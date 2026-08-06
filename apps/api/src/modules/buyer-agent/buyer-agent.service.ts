import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { AiOrchestratorService } from '../ai-orchestrator/ai-orchestrator.service';
import { gracefulCatch } from '../../common/utils/graceful-catch';
import {
  DashboardCopilotResponse, BuyerAgentPriority, BuyerAgentQuickAction,
  SmartProcurementResponse, ProcurementRecommendation,
  RfqAssistantResponse, RfqSuggestion,
  SupplierIntelligenceResponse, SupplierIntelligenceItem,
  NegotiationAdvisorResponse, CounterOfferSuggestion,
  CostOptimizationResponse, CostOptimizationItem,
  BuyerNotificationsResponse, BuyerNotificationItem,
  BuyerAgentInsightsResponse,
} from './dto/buyer-agent.dto';

@Injectable()
export class BuyerAgentService {
  private readonly logger = new Logger(BuyerAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradTrust: TradTrustService,
    private readonly orchestrator: AiOrchestratorService,
  ) {}

  private async resolveCompany(userId: string): Promise<string> {
    const owner = await this.prisma.companyOwner.findFirst({ where: { userId }, select: { companyId: true } }).catch(gracefulCatch('buyerAgent.resolveCompany.findCompanyOwner', null));
    return owner?.companyId || '';
  }

  async getDashboardCopilot(userId: string): Promise<DashboardCopilotResponse> {
    const companyId = await this.resolveCompany(userId);

    const rfqWhere = companyId ? { companyId, deletedAt: null, status: { in: ['ACTIVE', 'QUOTED'] as any } } : { id: '' };
    const quoteWhere = companyId ? { rfq: { companyId } } : { id: '' };
    const negWhere = companyId ? { buyerCompanyId: companyId } : { id: '' };
    const orderWhere = companyId ? { buyerCompanyId: companyId } : { id: '' };
    const notifWhere = companyId ? { companyId, status: 'PENDING' as any } : { id: '' };

    const [rfqs, quotes, negotiations, orders, pendingNotifs, savedProducts, savedSuppliers] = await Promise.all([
      this.prisma.rfq.count({ where: rfqWhere }).catch(gracefulCatch('buyerAgent.getDashboardCopilot.rfqCount', 0)),
      this.prisma.quote.count({ where: quoteWhere }).catch(gracefulCatch('buyerAgent.getDashboardCopilot.quoteCount', 0)),
      this.prisma.negotiation.count({ where: negWhere }).catch(gracefulCatch('buyerAgent.getDashboardCopilot.negotiationCount', 0)),
      this.prisma.order.count({ where: orderWhere }).catch(gracefulCatch('buyerAgent.getDashboardCopilot.orderCount', 0)),
      this.prisma.notification.findMany({ where: notifWhere, take: 3, orderBy: { createdAt: 'desc' }, select: { title: true, createdAt: true } }).catch(gracefulCatch('buyerAgent.getDashboardCopilot.pendingNotifications', [])),
      this.prisma.savedProduct.count({ where: { userId } }).catch(gracefulCatch('buyerAgent.getDashboardCopilot.savedProductCount', 0)),
      this.prisma.savedSupplier.count({ where: { userId } }).catch(gracefulCatch('buyerAgent.getDashboardCopilot.savedSupplierCount', 0)),
    ]);

    const priorities: BuyerAgentPriority[] = [];
    const alerts: BuyerAgentPriority[] = [];
    const savings: BuyerAgentPriority[] = [];

    if (rfqs > 0) priorities.push({ title: 'Active RFQs to Track', description: `You have ${rfqs} active RFQs awaiting quotes`, impact: 'high', actionUrl: '/buyer/rfq', actionLabel: 'View RFQs', metric: { label: 'Active', value: rfqs } });
    if (quotes > 0) priorities.push({ title: 'Quotes to Review', description: `You have ${quotes} quotes available for review`, impact: 'high', actionUrl: '/buyer/quote', actionLabel: 'Review Quotes', metric: { label: 'Quotes', value: quotes } });
    if (negotiations > 0) priorities.push({ title: 'Active Negotiations', description: `${negotiations} negotiations in progress`, impact: 'medium', actionUrl: '/buyer/negotiation', actionLabel: 'View', metric: { label: 'Active', value: negotiations } });
    if (pendingNotifs.length > 0) priorities.push({ title: 'Unread Notifications', description: `${pendingNotifs.length} new notifications`, impact: 'medium', actionUrl: '/buyer/notifications', actionLabel: 'View', metric: { label: 'New', value: pendingNotifs.length } });
    if (rfqs === 0) alerts.push({ title: 'No Active RFQs', description: 'Start sourcing by creating a new RFQ', impact: 'high', actionUrl: '/buyer/rfq/new', actionLabel: 'Create RFQ' });
    if (orders > 0) savings.push({ title: 'Reorder Opportunities', description: `${orders} previous orders — check for cost-effective reordering`, impact: 'medium', actionUrl: '/buyer/order', actionLabel: 'View Orders', metric: { label: 'Orders', value: orders } });

    const quickActions: BuyerAgentQuickAction[] = [
      { label: 'Create RFQ', href: '/buyer/rfq/new', icon: 'FileText', priority: 'high' },
      { label: 'Search Products', href: '/search', icon: 'Search', priority: 'high' },
      { label: 'View Quotes', href: '/buyer/quote', icon: 'DollarSign', priority: 'medium' },
    ];

    return {
      priorities, quickActions, urgentAlerts: alerts, savingsOpportunities: savings,
      metrics: { activeRfqs: rfqs, quotes, negotiations, orders, savedProducts, savedSuppliers },
    };
  }

  async getSmartProcurement(userId: string): Promise<SmartProcurementResponse> {
    const companyId = await this.resolveCompany(userId);
    const orderWhere = companyId ? { buyerCompanyId: companyId } : { id: '' };
    const rfqWhere = companyId ? { companyId, deletedAt: null } : { id: '' };

    const [orders, rfqs] = await Promise.all([
      this.prisma.order.findMany({ where: orderWhere, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, totalAmount: true, status: true, createdAt: true } }).catch(gracefulCatch('buyerAgent.getSmartProcurement.orders', [])),
      this.prisma.rfq.findMany({ where: rfqWhere, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, title: true, status: true, createdAt: true } }).catch(gracefulCatch('buyerAgent.getSmartProcurement.rfqs', [])),
    ]);

    const totalSpend = (orders as any[]).reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
    const categorySpendDistribution = [{ category: 'General', percentage: 100, amount: totalSpend }];

    const recommendations: ProcurementRecommendation[] = [];
    if (orders.length === 0) recommendations.push({ category: 'Getting Started', recommendation: 'Create your first RFQ to start sourcing products', reason: 'Active sourcing is the first step to procurement', impact: 'high', actionUrl: '/buyer/rfq/new' });
    if (rfqs.length > orders.length * 2 && orders.length > 0) recommendations.push({ category: 'Conversion', recommendation: 'Follow up on pending RFQs', reason: `${rfqs.length} RFQs vs ${orders.length} orders`, impact: 'high', actionUrl: '/buyer/rfq' });

    return { buyingRecommendations: recommendations, reorderTiming: [], alternativeSuppliers: [], riskWarnings: [], categorySpendDistribution };
  }

  async getRfqAssistant(userId: string): Promise<RfqAssistantResponse> {
    const companyId = await this.resolveCompany(userId);
    const draftWhere = companyId ? { companyId, status: 'DRAFT' as any, deletedAt: null } : { id: '' };
    const recentWhere = companyId ? { companyId, deletedAt: null } : { id: '' };

    const [draftRfqs, recentRfqs] = await Promise.all([
      this.prisma.rfq.findMany({ where: draftWhere, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, description: true, categoryId: true } }).catch(gracefulCatch('buyerAgent.getRfqAssistant.draftRfqs', [])),
      this.prisma.rfq.findMany({ where: recentWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, description: true, budgetMin: true, budgetMax: true, preferredLocation: true, categoryId: true } }).catch(gracefulCatch('buyerAgent.getRfqAssistant.recentRfqs', [])),
    ]);

    const suggestions: RfqSuggestion[] = [];
    for (const rfq of draftRfqs as any[]) {
      if (!rfq.title || rfq.title.length < 10) suggestions.push({ field: 'Title', issue: `RFQ has a short title`, suggestion: 'Add specific product name, quantity, and key specifications', impact: 'high' });
      if (!rfq.description || rfq.description.length < 50) suggestions.push({ field: 'Description', issue: `RFQ lacks detailed description`, suggestion: 'Include technical specs, quality requirements, and delivery expectations', impact: 'high' });
    }

    const withBudget = (recentRfqs as any[]).filter((r: any) => r.budgetMax);
    const estimatedPricing = withBudget.length > 0
      ? { min: Math.min(...withBudget.map((r: any) => Number(r.budgetMin || 0))), max: Math.max(...withBudget.map((r: any) => Number(r.budgetMax))), currency: 'INR' }
      : null;

    return {
      suggestions,
      estimatedPricing,
      categoryRecommendation: (recentRfqs as any[]).filter((r: any) => r.categoryId).length > 0 ? 'Based on your history — consider related categories' : null,
      deliveryRecommendation: (recentRfqs as any[]).filter((r: any) => r.preferredLocation).length > 0 ? 'Express delivery recommended for urgent RFQs' : 'Standard delivery recommended for cost optimization',
      completenessScore: Math.max(30, 85 - suggestions.length * 10),
    };
  }

  async getSupplierIntelligence(userId: string): Promise<SupplierIntelligenceResponse> {
    const companyId = await this.resolveCompany(userId);

    const [topSuppliers, pastOrdersArr] = await Promise.all([
      this.prisma.company.findMany({ where: { deletedAt: null, status: 'VERIFIED' as any }, take: 20, orderBy: { trustScore: 'desc' }, select: { id: true, name: true, slug: true, trustScore: true, responseTimeMinutes: true } }),
      companyId ? this.prisma.order.findMany({ where: { buyerCompanyId: companyId }, take: 100, select: { sellerCompanyId: true } }) : [],
    ]);

    const pastOrderCounts = new Map<string, number>();
    for (const o of pastOrdersArr) {
      if (o.sellerCompanyId) pastOrderCounts.set(o.sellerCompanyId, (pastOrderCounts.get(o.sellerCompanyId) || 0) + 1);
    }

    const suppliers: SupplierIntelligenceItem[] = [];
    for (const company of topSuppliers) {
      const unified = await this.tradTrust.getUnifiedScore(company.id).catch(gracefulCatch('buyerAgent.getSupplierIntelligence.unifiedScore', null));
      suppliers.push({
        companyId: company.id,
        companyName: company.name,
        slug: company.slug,
        trustScore: company.trustScore || 0,
        unifiedScore: unified?.unifiedScore || 0,
        grade: unified?.grade || 'N/A',
        riskLevel: unified?.riskLevel || 'Unknown',
        avgQualityScore: 0,
        responseTime: company.responseTimeMinutes ? `${company.responseTimeMinutes} min` : 'N/A',
        industryMatch: true,
        pastOrderCount: pastOrderCounts.get(company.id) || 0,
        recommendationScore: Math.round((company.trustScore || 0) * 0.4 + (pastOrderCounts.get(company.id) || 0) * 10),
      });
    }

    suppliers.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return {
      suppliers: suppliers.slice(0, 10),
      filters: [
        { field: 'grade', values: ['A+', 'A', 'B+', 'B', 'C'] },
        { field: 'riskLevel', values: ['Low', 'Medium', 'High'] },
        { field: 'pastOrders', values: ['Previously Ordered', 'New Supplier'] },
      ],
      totalCount: suppliers.length,
      topRecommendation: suppliers[0] || null,
    };
  }

  async getNegotiationAdvisor(userId: string): Promise<NegotiationAdvisorResponse> {
    const companyId = await this.resolveCompany(userId);
    const negWhere = companyId ? { buyerCompanyId: companyId } : { id: '' };
    const quoteWhere = companyId ? { rfq: { companyId } } : { id: '' };

    const [negotiations] = await Promise.all([
      this.prisma.negotiation.findMany({ where: negWhere, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, status: true, proposedPrice: true, createdAt: true } }).catch(gracefulCatch('buyerAgent.getNegotiationAdvisor.negotiations', [])),
      this.prisma.quote.findMany({ where: quoteWhere, take: 50, select: { id: true, totalAmount: true, status: true, companyId: true } }).catch(gracefulCatch('buyerAgent.getNegotiationAdvisor.quotes', [])),
    ]);

    const counterOffers: CounterOfferSuggestion[] = [];
    for (const n of (negotiations as any[]).slice(0, 3)) {
      if (n.proposedPrice) {
        counterOffers.push({
          field: 'Price',
          currentValue: `₹${Number(n.proposedPrice).toLocaleString()}`,
          suggestedValue: `₹${Math.round(Number(n.proposedPrice) * 0.92).toLocaleString()}`,
          reasoning: 'Industry standard initial counter: 8-10% below proposed price',
        });
      }
    }

    return {
      strategy: negotiations.length === 0 ? 'Start negotiations on quotes to maximize value' : 'Focus on current negotiations — review latest counter-offers',
      counterOffers,
      discountOpportunities: [
        { type: 'Volume Discount', potential: '5-15%', reasoning: 'Bulk orders typically qualify for volume pricing' },
        { type: 'Early Payment', potential: '2-5%', reasoning: 'Offer early payment terms for discount' },
      ],
      riskIndicators: negotiations.length === 0 ? [{ factor: 'No Negotiation History', level: 'low' as const, description: 'First-time negotiations carry standard market risk' }] : [],
      winProbability: negotiations.length > 0 ? 70 : 75,
    };
  }

  async getCostOptimization(userId: string): Promise<CostOptimizationResponse> {
    const companyId = await this.resolveCompany(userId);
    const orderWhere = companyId ? { buyerCompanyId: companyId } : { id: '' };
    const quoteWhere = companyId ? { rfq: { companyId }, status: 'SUBMITTED' as any } : { id: '' };

    const [orders, quotes] = await Promise.all([
      this.prisma.order.findMany({ where: orderWhere, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, totalAmount: true, status: true } }).catch(gracefulCatch('buyerAgent.getCostOptimization.orders', [])),
      this.prisma.quote.findMany({ where: quoteWhere, take: 50, select: { id: true, totalAmount: true, companyId: true } }).catch(gracefulCatch('buyerAgent.getCostOptimization.quotes', [])),
    ]);

    const items: CostOptimizationItem[] = [];
    for (const o of (orders as any[]).slice(0, 5)) {
      const price = Number(o.totalAmount || 0);
      if (price > 0) {
        items.push({
          productName: `Order ${(o.id as string).slice(0, 8)}`,
          currentPrice: price,
          suggestedPrice: Math.round(price * 0.9),
          expectedSavings: Math.round(price * 0.1),
          savingsPercent: 10,
          confidence: 'medium',
        });
      }
    }

    const totalSavings = items.reduce((s: number, i: CostOptimizationItem) => s + i.expectedSavings, 0);
    const recommendations: string[] = [];
    if (quotes.length > 0) recommendations.push('Compare multiple quotes to find competitive pricing');
    if ((orders as any[]).length > 5) recommendations.push('Consolidate orders to negotiate volume discounts');
    recommendations.push('Explore alternative brands in same category for cost savings');

    return { items, totalPotentialSavings: totalSavings, marketTrend: 'stable', recommendations };
  }

  async getBuyerNotifications(userId: string): Promise<BuyerNotificationsResponse> {
    const companyId = await this.resolveCompany(userId);
    const notifWhere = companyId ? { companyId } : { id: '' };
    const rfqWhere = companyId ? { companyId, deletedAt: null } : { id: '' };
    const quoteWhere = companyId ? { rfq: { companyId }, status: 'SUBMITTED' as any } : { id: '' };

    const [pendingNotifs, rfqs, quotes] = await Promise.all([
      this.prisma.notification.findMany({ where: notifWhere, orderBy: { createdAt: 'desc' }, take: 20, select: { title: true, body: true, type: true, createdAt: true, link: true, status: true } }).catch(gracefulCatch('buyerAgent.getBuyerNotifications.pendingNotifications', [])),
      this.prisma.rfq.findMany({ where: rfqWhere, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, title: true, status: true, createdAt: true, expiresAt: true } }).catch(gracefulCatch('buyerAgent.getBuyerNotifications.rfqs', [])),
      this.prisma.quote.findMany({ where: quoteWhere, take: 10, select: { id: true, totalAmount: true, companyId: true, createdAt: true } }).catch(gracefulCatch('buyerAgent.getBuyerNotifications.quotes', [])),
    ]);

    const criticalAlerts: BuyerNotificationItem[] = [];
    const reminders: BuyerNotificationItem[] = [];
    const opportunities: BuyerNotificationItem[] = [];
    const milestones: BuyerNotificationItem[] = [];

    for (const n of (pendingNotifs as any[]).slice(0, 5)) {
      const nType = String(n.type || '');
      if (nType.includes('QUOTE_RECEIVED')) {
        opportunities.push({ type: 'opportunity', title: n.title, body: n.body, priority: 'high', link: n.link || undefined, createdAt: n.createdAt });
      } else {
        reminders.push({ type: 'reminder', title: n.title, body: n.body, priority: 'medium', link: n.link || undefined, createdAt: n.createdAt });
      }
    }

    if (quotes.length > 0) opportunities.push({ type: 'opportunity', title: `${quotes.length} Quotes Available`, body: 'Review and compare quotes to find the best deal', priority: 'high', link: '/buyer/quote', createdAt: new Date() });
    if (rfqs.length > 0) milestones.push({ type: 'milestone', title: `${rfqs.length} Total RFQs Created`, body: 'Active procurement driving marketplace engagement', priority: 'low', createdAt: new Date() });

    return {
      dailyDigest: `You have ${(pendingNotifs as any[]).filter((n: any) => n.status === 'PENDING').length} notifications, ${rfqs.length} active RFQs, ${quotes.length} quotes to review.`,
      criticalAlerts, reminders, opportunities, milestones,
    };
  }

  async getAllInsights(userId: string): Promise<BuyerAgentInsightsResponse> {
    const [dashboardCopilot, smartProcurement, rfqAssistant, supplierIntelligence, negotiationAdvisor, costOptimization, buyerNotifications] = await Promise.all([
      this.getDashboardCopilot(userId),
      this.getSmartProcurement(userId),
      this.getRfqAssistant(userId),
      this.getSupplierIntelligence(userId),
      this.getNegotiationAdvisor(userId),
      this.getCostOptimization(userId),
      this.getBuyerNotifications(userId),
    ]);
    return { dashboardCopilot, smartProcurement, rfqAssistant, supplierIntelligence, negotiationAdvisor, costOptimization, buyerNotifications };
  }
}
