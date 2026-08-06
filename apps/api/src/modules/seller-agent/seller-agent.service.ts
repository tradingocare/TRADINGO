import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogQualityService } from '../ai/catalog-quality.service';
import { CommerceIntelligenceService } from '../ai/commerce-intelligence.service';
import { CatalogAnalyticsService } from '../ai/catalog-analytics.service';
import { SellerAnalyticsService } from '../seller-analytics/seller-analytics.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { AdvertisingService } from '../advertising/advertising.service';
import { FounderAiAggregatorService } from '../founder-ai/founder-ai.service';
import { gracefulCatch } from '../../common/utils/graceful-catch';
import {
  DashboardCopilotResponse, SellerAgentPriority, SellerAgentQuickAction,
  ProductAdvisorResponse, ProductImprovementSuggestion,
  SalesAdvisorResponse,
  AdvertisingAdvisorResponse,
  TrustAdvisorResponse,
  GrowthPlannerResponse,
  SellerAgentNotificationsResponse, AiNotificationItem,
  SellerAgentInsightsResponse,
} from './dto/seller-agent.dto';

@Injectable()
export class SellerAgentService {
  private readonly logger = new Logger(SellerAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogQuality: CatalogQualityService,
    private readonly commerceIntelligence: CommerceIntelligenceService,
    private readonly catalogAnalytics: CatalogAnalyticsService,
    private readonly sellerAnalytics: SellerAnalyticsService,
    private readonly tradTrust: TradTrustService,
    private readonly advertising: AdvertisingService,
    private readonly founderAi: FounderAiAggregatorService,
  ) {}

  async getDashboardCopilot(companyId: string): Promise<DashboardCopilotResponse> {
    const [dashboard, quality, trustScore, pendingNotifs, ads, productCount] = await Promise.all([
      this.sellerAnalytics.getDashboardSummary(companyId).catch(gracefulCatch('sellerAgent.getDashboardCopilot.dashboard', null)),
      this.catalogQuality.getSellerDashboard(companyId).catch(gracefulCatch('sellerAgent.getDashboardCopilot.quality', null)),
      this.tradTrust.getScore(companyId).catch(gracefulCatch('sellerAgent.getDashboardCopilot.trustScore', null)),
      this.prisma.notification.findMany({ where: { companyId, status: 'PENDING' as any }, take: 3, orderBy: { createdAt: 'desc' }, select: { title: true, body: true, createdAt: true, link: true } }).catch(gracefulCatch('sellerAgent.getDashboardCopilot.pendingNotifications', [] as Array<{ title: string; body: string; createdAt: Date; link: string | null }>)),
      this.prisma.advertisement.count({ where: { companyId, status: { in: ['ACTIVE', 'PENDING_REVIEW'] as any } } }).catch(gracefulCatch('sellerAgent.getDashboardCopilot.ads', 0)),
      this.prisma.product.count({ where: { companyId, deletedAt: null } }).catch(gracefulCatch('sellerAgent.getDashboardCopilot.productCount', 0)),
    ]);

    const priorities: SellerAgentPriority[] = [];

    if (quality && quality.lowScoringProducts > 0) {
      priorities.push({ title: 'Improve Product Quality', description: `${quality.lowScoringProducts} products score below 70 — boost to increase visibility`, impact: 'high', actionUrl: '/seller/success-insights', actionLabel: 'View Products', metric: { label: 'Low Scoring', value: quality.lowScoringProducts } });
    }
    if (quality && quality.missingImages > 0) {
      priorities.push({ title: 'Add Product Images', description: `${quality.missingImages} products missing images — products with images get 5x more views`, impact: 'high', actionUrl: '/seller/products', actionLabel: 'Add Images', metric: { label: 'Missing', value: quality.missingImages } });
    }
    if (quality && quality.missingSeo > 0) {
      priorities.push({ title: 'Optimize Product SEO', description: `${quality.missingSeo} products missing SEO metadata`, impact: 'medium', actionUrl: '/seller/products', actionLabel: 'Fix SEO', metric: { label: 'Missing SEO', value: quality.missingSeo } });
    }
    if (pendingNotifs.length > 0) {
      priorities.push({ title: 'Unread Notifications', description: `You have ${pendingNotifs.length} unread notifications`, impact: 'medium', actionUrl: '/seller/inbox', actionLabel: 'View', metric: { label: 'New', value: pendingNotifs.length } });
    }

    const alerts: SellerAgentPriority[] = [];
    if (trustScore && trustScore.score < 30) {
      alerts.push({ title: 'Low Trust Score', description: `Your trust score is ${trustScore.score} — complete profile and verification`, impact: 'high', actionUrl: '/seller/settings', actionLabel: 'Improve Score', metric: { label: 'Score', value: trustScore.score } });
    }

    const quickActions: SellerAgentQuickAction[] = [
      { label: 'Add Product', href: '/seller/products/new', icon: 'PlusCircle', priority: 'high' },
      { label: 'View Analytics', href: '/seller/analytics', icon: 'BarChart3', priority: 'medium' },
      { label: 'Check RFQs', href: '/seller/rfq', icon: 'FileText', priority: 'high' },
    ];

    const opportunities: SellerAgentPriority[] = [];
    if (ads === 0 && productCount > 0) {
      opportunities.push({ title: 'Promote Your Products', description: 'No active ads — sponsored products get 3x more visibility', impact: 'high', actionUrl: '/seller/advertising', actionLabel: 'Start Advertising', metric: { label: 'Active Ads', value: 0 } });
    }
    if (quality && quality.avgScore && quality.avgScore < 50) {
      opportunities.push({ title: 'Boost Product Quality', description: `Average quality score is ${quality.avgScore} — use AI tools to improve listings`, impact: 'high', actionUrl: '/seller/ai-workspace', actionLabel: 'Open AI Workspace', metric: { label: 'Avg Score', value: quality.avgScore } });
    }

    const metrics: Record<string, number | string> = {
      totalProducts: productCount,
      profileViews: dashboard?.profileViews ?? 0,
      rfqs: dashboard?.rfqs ?? 0,
      orders: dashboard?.orders ?? 0,
      trustScore: trustScore?.score ?? 0,
    };

    return { priorities, quickActions, urgentAlerts: alerts, growthOpportunities: opportunities, metrics };
  }

  async getProductAdvisor(companyId: string): Promise<ProductAdvisorResponse> {
    const [dashboard, qualityTrend, scoresResult] = await Promise.all([
      this.catalogQuality.getSellerDashboard(companyId).catch(gracefulCatch('sellerAgent.getProductAdvisor.dashboard', null)),
      this.catalogAnalytics.getQualityTrend(companyId, 30).catch(gracefulCatch('sellerAgent.getProductAdvisor.qualityTrend', [])),
      this.catalogQuality.listScores({ companyId, limit: 100, page: 1 }).catch(gracefulCatch('sellerAgent.getProductAdvisor.scoresResult', { data: [], meta: { total: 0 } })),
    ]);

    const avgScore = dashboard?.avgScore ?? 0;
    const trendArr = Array.isArray(qualityTrend) ? qualityTrend : [];
    const avgDelta = trendArr.length > 0 ? trendArr.reduce((s, d) => s + d.avgDelta, 0) / trendArr.length : 0;
    const trend: 'improving' | 'declining' | 'stable' = avgDelta > 2 ? 'improving' : avgDelta < -2 ? 'declining' : 'stable';

    const improvements: ProductImprovementSuggestion[] = [];
    if (dashboard?.missingImages && dashboard.missingImages > 0) improvements.push({ productId: '', productName: '', issue: `${dashboard.missingImages} products missing images`, currentScore: dashboard.avgScore || 0, impact: 'high', actionLabel: 'Upload Images' });
    if (dashboard?.missingSeo && dashboard.missingSeo > 0) improvements.push({ productId: '', productName: '', issue: `${dashboard.missingSeo} products missing SEO metadata`, currentScore: dashboard.avgScore || 0, impact: 'high', actionLabel: 'Add SEO' });
    if (dashboard?.missingSpecs && dashboard.missingSpecs > 0) improvements.push({ productId: '', productName: '', issue: `${dashboard.missingSpecs} products missing specifications`, currentScore: dashboard.avgScore || 0, impact: 'medium', actionLabel: 'Add Specs' });
    if (dashboard?.missingAttributes && dashboard.missingAttributes > 0) improvements.push({ productId: '', productName: '', issue: `${dashboard.missingAttributes} products missing attributes`, currentScore: dashboard.avgScore || 0, impact: 'medium', actionLabel: 'Add Attributes' });

    const scoredData = (scoresResult as any).data || [];
    const lowScoringWithProducts = scoredData
      .filter((s: any) => s.total < 50)
      .slice(0, 5)
      .map((s: any) => ({
        productId: s.product?.id || '',
        productName: s.product?.name || 'Unknown',
        issue: `Quality score: ${s.total}/100`,
        currentScore: s.total,
        impact: 'high' as const,
        actionLabel: 'Improve Quality',
      }));

    const topPicksPromises = scoredData
      .filter((s: any) => s.total >= 70)
      .slice(0, 5)
      .map(async (s: any) => {
        const pId: string | undefined = s.product?.id;
        if (!pId) return null;
        const commerce = await this.commerceIntelligence.getFullCommerceInsights(pId).catch(gracefulCatch('sellerAgent.getProductAdvisor.commerce', null));
        return { productId: pId, productName: s.product?.name || 'Unknown', commerceScore: commerce?.overallCommerceScore || s.total };
      });
    const topPicksResults = await Promise.all(topPicksPromises);
    const topPicks = topPicksResults.filter(Boolean) as { productId: string; productName: string; commerceScore: number }[];

    const missingFields: { label: string; count: number }[] = [];
    if (dashboard?.missingImages) missingFields.push({ label: 'Images', count: dashboard.missingImages });
    if (dashboard?.missingSeo) missingFields.push({ label: 'SEO', count: dashboard.missingSeo });
    if (dashboard?.missingSpecs) missingFields.push({ label: 'Specifications', count: dashboard.missingSpecs });
    if (dashboard?.missingAttributes) missingFields.push({ label: 'Attributes', count: dashboard.missingAttributes });

    return {
      averageQualityScore: avgScore,
      trend,
      improvements: [...lowScoringWithProducts, ...improvements],
      lowScoringProductCount: dashboard?.lowScoringProducts ?? 0,
      duplicateRiskCount: dashboard?.duplicateRiskCount ?? 0,
      topPicks: topPicks.slice(0, 3),
      missingFields,
    };
  }

  async getSalesAdvisor(companyId: string): Promise<SalesAdvisorResponse> {
    const [orders, rfqs, quotes, negotiations] = await Promise.all([
      this.prisma.order.findMany({ where: { sellerCompanyId: companyId }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, totalAmount: true, status: true, createdAt: true } }).catch(gracefulCatch('sellerAgent.getSalesAdvisor.orders', [] as Array<{ id: string; totalAmount: any; status: string; createdAt: Date }>)),
      this.prisma.rfq.count({ where: { companyId, deletedAt: null } }).catch(gracefulCatch('sellerAgent.getSalesAdvisor.rfqs', 0)),
      this.prisma.quote.count({ where: { companyId } }).catch(gracefulCatch('sellerAgent.getSalesAdvisor.quotes', 0)),
      this.prisma.negotiation.count({ where: { sellerCompanyId: companyId } }).catch(gracefulCatch('sellerAgent.getSalesAdvisor.negotiations', 0)),
    ]);

    const confirmedStatuses = ['CONFIRMED', 'COMPLETED', 'DELIVERED', 'SHIPPED'];
    const confirmedOrders = orders.filter(o => confirmedStatuses.includes(o.status));
    const totalRevenue = confirmedOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
    const recentOrders = orders.filter(o => o.createdAt >= thirtyDaysAgo);
    const prevOrders = orders.filter(o => o.createdAt < thirtyDaysAgo && o.createdAt >= sixtyDaysAgo);

    const revenueRecent = recentOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const revenuePrev = prevOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const quoteAcceptanceRate = quotes > 0 ? Math.round((confirmedOrders.length / quotes) * 100) : 0;

    const recommendations: string[] = [];
    if (totalRevenue === 0) recommendations.push('Complete your profile and enable advertising to start generating sales');
    if (rfqs > orders.length * 2) recommendations.push('Improve quote response rate to convert more RFQs');
    if (quoteAcceptanceRate < 30 && quotes > 0) recommendations.push('Review pricing strategy — quote acceptance rate is below 30%');

    return {
      revenue: { label: 'Revenue (30d)', value: revenueRecent, change: revenuePrev > 0 ? Math.round(((revenueRecent - revenuePrev) / revenuePrev) * 100) : 0, changeType: revenueRecent >= revenuePrev ? 'positive' : 'negative' },
      conversionRate: { label: 'Quote → Order', value: quoteAcceptanceRate, change: 0, changeType: quoteAcceptanceRate >= 30 ? 'positive' : 'negative' },
      winRate: { label: 'Win Rate', value: quotes > 0 ? Math.round((confirmedOrders.length / quotes) * 100) : 0, change: 0, changeType: 'neutral' },
      openDeals: negotiations + rfqs,
      topProducts: [],
      recommendations,
    };
  }

  async getAdvertisingAdvisor(companyId: string): Promise<AdvertisingAdvisorResponse> {
    const products = await this.prisma.product.findMany({
      where: { companyId, deletedAt: null },
      take: 50,
      include: { media: { take: 1 }, priceSlabs: { orderBy: { minQty: 'asc' }, take: 1 } },
    });

    const qualityScores = await this.prisma.catalogQualityScore.findMany({
      where: { product: { companyId } },
      select: { productId: true, total: true },
    });
    const scoreMap = new Map(qualityScores.map(s => [s.productId, s.total]));

    const [activeAds, adStats] = await Promise.all([
      this.prisma.advertisement.findMany({ where: { companyId }, take: 50, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true, dailyBudget: true, totalBudget: true } }),
      this.prisma.advertisement.aggregate({ where: { companyId, status: 'ACTIVE' as any }, _sum: { dailyBudget: true, totalBudget: true } }).catch(gracefulCatch('sellerAgent.getAdvertisingAdvisor.adStats', { _sum: { dailyBudget: null, totalBudget: null } })),
    ]);

    const topPromotable = products
      .map(p => ({ productId: p.id, productName: p.name, qualityScore: scoreMap.get(p.id) || 0, price: Number((p as any).priceSlabs?.[0]?.price || p.originalPrice || 0) }))
      .filter(p => p.qualityScore >= 50)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 5)
      .map(p => ({
        productId: p.productId,
        productName: p.productName,
        qualityScore: p.qualityScore,
        suggestedDailyBudget: Math.max(100, Math.round(p.price * 0.05)),
        estimatedCpc: Math.round(p.price * 0.01),
        competitionLevel: p.qualityScore >= 80 ? 'low' : p.qualityScore >= 60 ? 'medium' : 'high',
      }));

    const recommendations: string[] = [];
    if (topPromotable.length === 0) recommendations.push('Improve product quality scores to at least 50 to enable advertising recommendations');
    if (activeAds.length === 0 && topPromotable.length > 0) recommendations.push('Start with sponsored product ads for your highest-quality products');
    if (topPromotable.length > 3) recommendations.push(`You have ${topPromotable.length} promotable products — consider a budget increase to maximize reach`);

    return {
      topProductsToPromote: topPromotable,
      activeCampaignCount: activeAds.length,
      totalAdSpend: Number(adStats._sum.totalBudget || 0),
      recommendations,
    };
  }

  async getTrustAdvisor(companyId: string): Promise<TrustAdvisorResponse> {
    const [breakdown, history] = await Promise.all([
      this.tradTrust.getScoreBreakdown(companyId).catch(gracefulCatch('sellerAgent.getTrustAdvisor.breakdown', null)),
      this.tradTrust.getHistory(companyId, 10).catch(gracefulCatch('sellerAgent.getTrustAdvisor.history', [])),
    ]);

    const improvements: string[] = [];
    if (breakdown) {
      for (const f of breakdown.breakdown) {
        if (f.score < 50) {
          improvements.push(`${f.category}: ${f.score}/100 — needs improvement (contributes ${f.contribution}/${f.maxContribution} points)`);
        }
      }
    }
    if (!breakdown) {
      improvements.push('Complete your company profile to generate a trust score');
    }

    return {
      unifiedScore: breakdown?.unifiedScore ?? 0,
      grade: breakdown?.grade ?? 'N/A',
      riskLevel: breakdown?.riskLevel ?? 'Unknown',
      breakdown: breakdown?.breakdown.map(f => ({
        category: f.category,
        score: f.score,
        contribution: f.contribution,
        maxContribution: f.maxContribution,
      })) || [],
      recentChanges: history.map(h => ({ date: h.createdAt, score: h.score })),
      improvements,
    };
  }

  async getGrowthPlanner(companyId: string): Promise<GrowthPlannerResponse> {
    const [scores, orders, , products] = await Promise.all([
      this.catalogQuality.getSellerDashboard(companyId).catch(gracefulCatch('sellerAgent.getGrowthPlanner.scores', null)),
      this.prisma.order.count({ where: { sellerCompanyId: companyId } }).catch(gracefulCatch('sellerAgent.getGrowthPlanner.orders', 0)),
      this.prisma.rfq.count({ where: { companyId, deletedAt: null } }).catch(gracefulCatch('sellerAgent.getGrowthPlanner.rfqs', 0)),
      this.prisma.product.count({ where: { companyId, deletedAt: null } }).catch(gracefulCatch('sellerAgent.getGrowthPlanner.products', 0)),
      this.prisma.company.findFirst({ where: { id: companyId }, select: { id: true } }).catch(gracefulCatch('sellerAgent.getGrowthPlanner.company', null)),
    ]);

    const suggestedGoals: Array<{ category: string; target: string; priority: 'high' | 'medium' | 'low'; reason: string }> = [];

    if (products < 20) suggestedGoals.push({ category: 'Product Catalog', target: `${20 - products} more products`, priority: 'high', reason: 'Sellers with 20+ products get 3x more visibility' });
    if (orders < 5) suggestedGoals.push({ category: 'Sales', target: `${5 - orders} more orders`, priority: 'high', reason: 'Build social proof with confirmed orders' });
    if (scores && scores.avgScore < 70) suggestedGoals.push({ category: 'Quality Score', target: `Average score ${scores.avgScore} → 70`, priority: 'medium', reason: 'Products with 70+ score rank higher in search' });
    suggestedGoals.push({ category: 'Advertising', target: 'Launch first campaign', priority: 'medium', reason: 'Sponsored products get 3x more clicks' });

    const marketplaceOpportunities = [
      { category: 'Electronics', demandLevel: 'high', competitionLevel: 'moderate', potentialScore: 75 },
      { category: 'Industrial Machinery', demandLevel: 'high', competitionLevel: 'low', potentialScore: 85 },
      { category: 'Packaging', demandLevel: 'medium', competitionLevel: 'moderate', potentialScore: 65 },
    ];

    const milestones: Array<{ label: string; progress: number; target: string }> = [];
    milestones.push({ label: 'Product Count', progress: Math.min(products, 50), target: '50 products' });
    milestones.push({ label: 'Orders', progress: Math.min(orders, 100), target: '100 orders' });
    milestones.push({ label: 'Quality Score', progress: scores?.avgScore || 0, target: '90+ quality' });

    return { suggestedGoals, marketplaceOpportunities, milestones };
  }

  async getAiNotifications(companyId: string): Promise<SellerAgentNotificationsResponse> {
    const [pendingNotifications, score, quality, analytics] = await Promise.all([
      this.prisma.notification.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 20, select: { title: true, body: true, type: true, createdAt: true, link: true, status: true } }).catch(gracefulCatch('sellerAgent.getAiNotifications.pendingNotifications', [] as Array<{ title: string; body: string; type: string; createdAt: Date; link: string | null; status: string }>)),
      this.tradTrust.getScore(companyId).catch(gracefulCatch('sellerAgent.getAiNotifications.score', null)),
      this.catalogQuality.getSellerDashboard(companyId).catch(gracefulCatch('sellerAgent.getAiNotifications.quality', null)),
      this.sellerAnalytics.getDashboardSummary(companyId).catch(gracefulCatch('sellerAgent.getAiNotifications.analytics', null)),
    ]);

    const criticalAlerts: AiNotificationItem[] = [];
    const milestones: AiNotificationItem[] = [];
    const insights: AiNotificationItem[] = [];
    const reminders: AiNotificationItem[] = [];

    const unread = pendingNotifications.filter(n => n.status === 'PENDING');
    for (const n of unread.slice(0, 5)) {
      const nType = String(n.type || '');
      if (nType.includes('DISPUTE') || nType.includes('PAYMENT_FAILED')) {
        criticalAlerts.push({ type: 'alert', title: n.title, body: n.body, priority: 'critical', link: n.link || undefined, createdAt: n.createdAt });
      } else {
        reminders.push({ type: 'reminder', title: n.title, body: n.body, priority: 'medium', link: n.link || undefined, createdAt: n.createdAt });
      }
    }

    if (score && score.score && score.score >= 70) {
      milestones.push({ type: 'milestone', title: 'Strong Trust Score', body: `Your trust score is ${score.score}/1000 — maintains buyer confidence`, priority: 'low', createdAt: score.updatedAt || new Date() });
    }
    if (quality && quality.avgScore && quality.avgScore >= 70) {
      milestones.push({ type: 'milestone', title: 'Product Quality Milestone', body: `Average product quality is ${quality.avgScore}/100 — excellent`, priority: 'low', createdAt: new Date() });
    }
    if (analytics && analytics.orders > 0) {
      milestones.push({ type: 'milestone', title: `${analytics.orders} Orders Received`, body: `You've received ${analytics.orders} orders in the last 30 days`, priority: 'low', createdAt: new Date() });
    }
    if (quality && quality.avgScore && quality.avgScore < 40) {
      insights.push({ type: 'insight', title: 'Quality Improvement Opportunity', body: `Your product quality score (${quality.avgScore}) is below average — use AI tools to improve listings`, priority: 'high', link: '/seller/ai-workspace', createdAt: new Date() });
    }
    if (analytics && analytics.searchImpressions > 0 && (analytics as any).ctr < 5) {
      insights.push({ type: 'insight', title: 'Low Click-Through Rate', body: `Your search CTR is ${(analytics as any).ctr}% — consider improving product titles and images`, priority: 'medium', link: '/seller/analytics', createdAt: new Date() });
    }
    if (analytics && analytics.rfqs > analytics.orders * 2 && analytics.rfqs > 0) {
      insights.push({ type: 'insight', title: 'Unconverted RFQs', body: `You received ${analytics.rfqs} RFQs but only ${analytics.orders} orders — review pricing and response time`, priority: 'medium', link: '/seller/rfq', createdAt: new Date() });
    }

    return {
      dailyDigest: `You have ${unread.length} notifications, ${analytics?.profileViews || 0} profile views, ${analytics?.rfqs || 0} RFQs, and ${analytics?.orders || 0} orders today.`,
      criticalAlerts,
      milestones,
      insights,
      reminders,
    };
  }

  async getAllInsights(companyId: string): Promise<SellerAgentInsightsResponse> {
    const [dashboardCopilot, productAdvisor, salesAdvisor, advertisingAdvisor, trustAdvisor, growthPlanner, aiNotifications] = await Promise.all([
      this.getDashboardCopilot(companyId),
      this.getProductAdvisor(companyId),
      this.getSalesAdvisor(companyId),
      this.getAdvertisingAdvisor(companyId),
      this.getTrustAdvisor(companyId),
      this.getGrowthPlanner(companyId),
      this.getAiNotifications(companyId),
    ]);
    return { dashboardCopilot, productAdvisor, salesAdvisor, advertisingAdvisor, trustAdvisor, growthPlanner, aiNotifications };
  }
}
