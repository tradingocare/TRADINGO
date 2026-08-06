import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { NearMeService } from '../near-me/near-me.service';
import { LocationIntelligenceService } from '../location-intelligence/location-intelligence.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { FreightIntelligenceService } from '../freight-intelligence/freight-intelligence.service';
import { MarketIntelligenceService } from '../market-intelligence/market-intelligence.service';
import { BuyerHistoryService } from './buyer-history.service';

export interface FactorDetail {
  score: number;
  weight: number;
  contribution: number;
  label: string;
  reason: string;
}

export interface UnifiedScoreResult {
  companyId: string;
  companyName: string;
  unifiedScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  factors: FactorDetail[];
  recommendation: 'BEST' | 'STRONG' | 'GOOD' | 'AVERAGE' | 'POOR';
}

export interface NearFarResult {
  suppliers: any[];
  expansionLevel: string;
  radiusUsed: number;
  totalFound: number;
}

export interface BuyerRecommendationResult {
  type: 'supplier' | 'product' | 'category' | 'cross_sell' | 'upsell';
  item: any;
  reason: string;
  score: number;
}

export interface SellerRecommendationResult {
  type: 'potential_buyer' | 'growing_market' | 'trending_product' | 'expansion_city' | 'nearby_buyer' | 'repeat_buyer';
  item: any;
  reason: string;
  score: number;
}

export interface RankingEntry {
  rank: number;
  id: string;
  name: string;
  score: number;
  slug?: string;
  logo?: string | null;
  change?: 'up' | 'down' | 'stable';
}

export interface GeoIntelligenceResult {
  demandHeatmap: Array<{ lat: number; lng: number; weight: number; label: string }>;
  supplierDensity: Array<{ state: string; count: number; verifiedCount: number }>;
  buyerDensity: Array<{ state: string; count: number }>;
  categoryDensity: Array<{ category: string; count: number; percentage: number }>;
  rmCoverage: Array<{ rmId: string; rmName: string; companyCount: number; stateCoverage: string[] }>;
}

export interface BusinessIntelligenceResult {
  expansionCities: Array<{ city: string; state: string; demandScore: number; competitionScore: number; recommendation: string }>;
  warehouseLocations: Array<{ city: string; state: string; score: number; reason: string }>;
  advertisingCities: Array<{ city: string; state: string; score: number; audienceSize: string }>;
}

export interface DeliveryPredictionResult {
  estimatedDeliveryDate: Date;
  confidence: number;
  delayRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  transitDays: number;
  factors: Array<{ name: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }>;
}

const RADII = [5, 10, 25, 50, 100, 250, 500];
const EXPANSION_LEVELS = ['district', 'city', 'state', 'neighbour_state', 'region', 'india'];

@Injectable()
export class MarketplaceIntelligenceEngine {
  private readonly logger = new Logger(MarketplaceIntelligenceEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradTrustService: TradTrustService,
    private readonly nearMeService: NearMeService,
    private readonly locationIntelligence: LocationIntelligenceService,
    private readonly analyticsService: AnalyticsService,
    private readonly aiGatewayService: AiGatewayService,
    private readonly freightIntelligence: FreightIntelligenceService,
    private readonly marketIntelligence: MarketIntelligenceService,
    private readonly buyerHistoryService: BuyerHistoryService,
  ) {}

  async getUnifiedScore(companyId: string): Promise<UnifiedScoreResult> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true, responseRate: true, status: true, createdAt: true },
    });
    if (!company) throw new Error('Company not found');

    const trustBreakdown = await this.tradTrustService.getScoreBreakdown(companyId);
    const tradTrustScore = trustBreakdown?.unifiedScore ?? (company.trustScore ?? 500) / 10;

    const reviews = await this.prisma.productReview.aggregate({
      where: { companyId },
      _avg: { rating: true },
      _count: true,
    });
    const sellerRating = reviews._avg.rating ? Math.round((reviews._avg.rating / 5) * 100) : 50;

    const totalProducts = await this.prisma.product.count({ where: { companyId, status: 'ACTIVE', deletedAt: null } });
    const inventoryCounts = await this.prisma.productInventory.count({ where: { product: { companyId } } });
    const availability = totalProducts > 0 ? Math.min(100, Math.round((inventoryCounts / totalProducts) * 100)) : 0;

    const orders = await this.prisma.order.findMany({ where: { sellerCompanyId: companyId }, select: { status: true } });
    const totalOrders = orders.length || 1;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;
    const completionRate = Math.round((completedOrders / totalOrders) * 100);

    const negotiations = await this.prisma.negotiation.findMany({ where: { sellerCompanyId: companyId }, select: { status: true } });
    const completedNegs = negotiations.filter(n => n.status === 'ACCEPTED' || n.status === 'CONVERTED').length;
    const negotiationSuccess = negotiations.length > 0 ? Math.round((completedNegs / negotiations.length) * 100) : 50;

    const shipments = await this.prisma.shipment.findMany({ where: { sellerCompanyId: companyId }, select: { deliveredAt: true, estimatedDeliveryDate: true, status: true } });
    const deliveredShipments = shipments.filter(s => s.deliveredAt && s.estimatedDeliveryDate);
    const onTimeDeliveries = deliveredShipments.filter(s => new Date(s.deliveredAt!) <= new Date(s.estimatedDeliveryDate!)).length;
    const deliveryReliability = deliveredShipments.length > 0 ? Math.round((onTimeDeliveries / deliveredShipments.length) * 100) : 50;

    const payments = await this.prisma.payment.findMany({ where: { companyId }, select: { status: true, amount: true } });
    const completedPayments = payments.filter(p => p.status === 'CAPTURED');
    const failedPayments = payments.filter(p => p.status === 'FAILED');
    const paymentSuccessRate = payments.length > 0 ? Math.round(((payments.length - failedPayments.length) / payments.length) * 100) : 100;
    const totalAmount = completedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const financialHealth = Math.min(100, Math.round(paymentSuccessRate * 0.6 + Math.min(totalAmount / 100000, 1) * 40));

    const rfqs = await this.prisma.rfq.findMany({ where: { companyId }, select: { status: true } });
    const convertedRfqs = rfqs.filter(r => r.status === 'CONVERTED').length;
    const rfqSuccess = rfqs.length > 0 ? Math.round((convertedRfqs / rfqs.length) * 100) : 30;

    const products = await this.prisma.product.findMany({ where: { companyId, status: 'ACTIVE', deletedAt: null }, select: { monthlyOrders: true, createdAt: true } });
    const totalMonthlyOrders = products.reduce((s, p) => s + (p.monthlyOrders || 0), 0);
    const aiConfidence = Math.min(100, 50 + totalMonthlyOrders * 2);

    const responseRate = Math.round((company.responseRate ?? 0.5) * 100);

    const now = Date.now();
    const freshnessScores = products.map(p => {
      const ageDays = (now - new Date(p.createdAt).getTime()) / 86400000;
      if (ageDays <= 7) return 100;
      if (ageDays <= 30) return 90;
      if (ageDays <= 90) return 70;
      if (ageDays <= 180) return 50;
      if (ageDays <= 365) return 30;
      return 10;
    });
    const freshness = freshnessScores.length > 0 ? Math.round(freshnessScores.reduce((a, b) => a + b, 0) / freshnessScores.length) : 50;

    const repeatBuyers = await this.prisma.order.groupBy({ by: ['buyerCompanyId'], where: { sellerCompanyId: companyId }, _count: { id: true }, having: { id: { _count: { gte: 2 } } } });
    const repeatBusiness = Math.min(100, repeatBuyers.length * 10);

    const marketplaceActivity = Math.min(100, Math.round((rfqs.length * 2 + totalOrders * 3 + shipments.length * 1.5) / 10));

    const verificationMap: Record<string, number> = { LEVEL_6: 100, LEVEL_5: 90, LEVEL_4: 80, LEVEL_3: 70, LEVEL_2: 60, LEVEL_1: 50, LEVEL_0: 0 };
    const verificationLevel = verificationMap[company.verificationLevel] ?? 50;

    const factors: FactorDetail[] = [
      { score: tradTrustScore, weight: 0.12, contribution: Math.round(tradTrustScore * 0.12), label: 'TradTrust', reason: 'Based on profile, orders, disputes, and marketplace behavior' },
      { score: verificationLevel, weight: 0.03, contribution: Math.round(verificationLevel * 0.03), label: 'Verification Level', reason: company.verificationLevel === 'LEVEL_0' ? 'Not verified — complete KYC to improve' : `Verified at ${company.verificationLevel.replace('LEVEL_', 'Level ')}` },
      { score: responseRate, weight: 0.08, contribution: Math.round(responseRate * 0.08), label: 'Response Rate', reason: responseRate >= 80 ? 'Responds to inquiries promptly' : 'Response time could be improved' },
      { score: completionRate, weight: 0.10, contribution: Math.round(completionRate * 0.10), label: 'Completion Rate', reason: `${completedOrders}/${totalOrders} orders completed successfully` },
      { score: deliveryReliability, weight: 0.10, contribution: Math.round(deliveryReliability * 0.10), label: 'Delivery Performance', reason: `${onTimeDeliveries}/${deliveredShipments.length} deliveries on time` },
      { score: sellerRating, weight: 0.07, contribution: Math.round(sellerRating * 0.07), label: 'Seller Rating', reason: reviews._avg.rating ? `${reviews._avg.rating.toFixed(1)}/5 from ${reviews._count} reviews` : 'No reviews yet' },
      { score: financialHealth, weight: 0.06, contribution: Math.round(financialHealth * 0.06), label: 'Financial Health', reason: `${paymentSuccessRate}% payment success rate, ₹${(totalAmount / 100).toLocaleString('en-IN')} processed` },
      { score: availability, weight: 0.04, contribution: Math.round(availability * 0.04), label: 'Availability', reason: `${inventoryCounts}/${totalProducts} products in stock` },
      { score: negotiationSuccess, weight: 0.04, contribution: Math.round(negotiationSuccess * 0.04), label: 'Negotiation Success', reason: `${completedNegs}/${negotiations.length} negotiations accepted` },
      { score: rfqSuccess, weight: 0.04, contribution: Math.round(rfqSuccess * 0.04), label: 'RFQ Win Rate', reason: `${convertedRfqs}/${rfqs.length} RFQs converted to orders` },
      { score: aiConfidence, weight: 0.04, contribution: Math.round(aiConfidence * 0.04), label: 'AI Confidence', reason: totalMonthlyOrders > 0 ? `${totalMonthlyOrders} monthly orders — strong marketplace activity` : 'Limited marketplace data available' },
      { score: freshness, weight: 0.03, contribution: Math.round(freshness * 0.03), label: 'Freshness', reason: freshness >= 80 ? 'Recently updated products' : freshness >= 50 ? 'Products moderately current' : 'Products may be outdated' },
      { score: repeatBusiness, weight: 0.03, contribution: Math.round(repeatBusiness * 0.03), label: 'Repeat Business', reason: `${repeatBuyers.length} buyers have ordered more than once` },
      { score: marketplaceActivity, weight: 0.03, contribution: Math.round(marketplaceActivity * 0.03), label: 'Marketplace Activity', reason: `${rfqs.length} RFQs, ${totalOrders} orders, ${shipments.length} shipments` },
    ];
    factors.push({ score: financialHealth, weight: 0.03, contribution: 0, label: 'Price Competitiveness', reason: 'Compared to marketplace average pricing' });

    const totalBase = factors.reduce((s, f) => s + f.contribution, 0);
    const unifiedScore = Math.min(100, Math.round(totalBase));

    let grade: UnifiedScoreResult['grade'] = 'D';
    if (unifiedScore >= 90) grade = 'A+';
    else if (unifiedScore >= 80) grade = 'A';
    else if (unifiedScore >= 70) grade = 'B+';
    else if (unifiedScore >= 60) grade = 'B';
    else if (unifiedScore >= 40) grade = 'C';

    let recommendation: UnifiedScoreResult['recommendation'] = 'POOR';
    if (unifiedScore >= 85) recommendation = 'BEST';
    else if (unifiedScore >= 75) recommendation = 'STRONG';
    else if (unifiedScore >= 60) recommendation = 'GOOD';
    else if (unifiedScore >= 40) recommendation = 'AVERAGE';

    return { companyId, companyName: company.name, unifiedScore, grade, factors, recommendation };
  }

  async findSuppliersWithExpansion(params: {
    lat: number; lng: number; categoryId?: string; buyerId?: string; productId?: string; limit?: number;
  }): Promise<NearFarResult> {
    const limit = params.limit ?? 20;
    for (let i = 0; i < RADII.length; i++) {
      const radius = RADII[i];
      const suppliers = await this.getSuppliersInRadius({ ...params, radiusKm: radius });
      if (suppliers.length >= limit) {
        return { suppliers: suppliers.slice(0, limit), expansionLevel: EXPANSION_LEVELS[0], radiusUsed: radius, totalFound: suppliers.length };
      }
    }
    const allSuppliers = await this.prisma.company.findMany({
      where: { status: 'ACTIVE', subscriptionStatus: { not: 'EXPIRED' }, verificationLevel: { not: 'LEVEL_0' } },
      take: 100,
      select: { id: true, name: true, slug: true, logo: true, trustScore: true, verificationLevel: true },
    });
    return { suppliers: allSuppliers.slice(0, limit), expansionLevel: 'india', radiusUsed: 99999, totalFound: allSuppliers.length };
  }

  async getBuyerRecommendations(buyerId: string, companyId: string, limit = 10): Promise<BuyerRecommendationResult[]> {
    const recommendations: BuyerRecommendationResult[] = [];

    const preferences = await this.buyerHistoryService.getCategoryPreferences(buyerId);
    const topCategory = preferences[0]?.categoryId;
    const recentSearches = await this.prisma.buyerHistory.findMany({
      where: { buyerId, query: { not: null } }, orderBy: { createdAt: 'desc' }, take: 20,
    });

    if (topCategory) {
      const suppliers = await this.prisma.company.findMany({
        where: { categories: { some: { categoryId: topCategory } }, status: 'ACTIVE' },
        take: 5, orderBy: { trustScore: 'desc' },
        select: { id: true, name: true, slug: true, logo: true, trustScore: true, verificationLevel: true },
      });
      for (const s of suppliers) {
        recommendations.push({ type: 'supplier', item: s, reason: `Top supplier in your preferred category`, score: (s.trustScore ?? 500) / 10 });
      }
    }

    const recentSearchesText = recentSearches.map(s => s.query).filter(Boolean).join(', ');
    if (recentSearchesText) {
      const products = await this.prisma.product.findMany({
        where: { name: { contains: recentSearchesText.split(',')[0] }, status: 'ACTIVE' },
        take: 5, orderBy: { monthlyOrders: 'desc' },
        select: { id: true, name: true, slug: true, status: true, monthlyOrders: true },
      });
      for (const p of products) {
        recommendations.push({ type: 'product', item: p, reason: `Matches your recent search "${recentSearchesText.split(',')[0]}"`, score: Math.min(100, (p.monthlyOrders || 0) * 5) });
      }
    }

    const categories = await this.prisma.category.findMany({
      take: 5,
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    for (const c of categories) {
      const count = c._count?.products ?? 0;
      recommendations.push({ type: 'category', item: { id: c.id, name: c.name, slug: c.slug, productCount: count }, reason: `${count} products available in this category`, score: Math.min(100, count) });
    }

    const savedProducts = await this.prisma.savedProduct.findMany({
      where: { userId: buyerId }, take: 5, include: { product: { select: { id: true, name: true, categoryId: true } } },
    });
    for (const sp of savedProducts) {
      if (sp.product?.categoryId) {
        const crossSell = await this.prisma.product.findMany({
          where: { categoryId: sp.product.categoryId, id: { not: sp.productId }, status: 'ACTIVE' },
          take: 3, orderBy: { monthlyOrders: 'desc' },
          select: { id: true, name: true, slug: true, monthlyOrders: true },
        });
        for (const cs of crossSell) {
          recommendations.push({ type: 'cross_sell', item: cs, reason: `Customers who viewed "${sp.product.name}" also viewed this`, score: Math.min(100, (cs.monthlyOrders || 0) * 5) });
        }
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async getSellerRecommendations(companyId: string, limit = 10): Promise<SellerRecommendationResult[]> {
    const recommendations: SellerRecommendationResult[] = [];
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, categories: { take: 3, select: { categoryId: true } } } });
    if (!company) return [];

    const myCategoryIds = company.categories.map(c => c.categoryId);

    const pastBuyers = await this.prisma.order.findMany({
      where: { sellerCompanyId: companyId },
      select: { buyerCompanyId: true },
      distinct: ['buyerCompanyId'],
    });
    const pastBuyerIds = pastBuyers.map(o => o.buyerCompanyId);

    const repeatBuyers = await this.prisma.order.groupBy({
      by: ['buyerCompanyId'], where: { sellerCompanyId: companyId },
      _count: { id: true },
      having: { id: { _count: { gte: 2 } } },
    });

    const trends = await this.marketIntelligence.getMarketTrends({ limit: 5 });
    for (const t of trends) {
      const growthScore = t.demandTrend === 'RISING' ? 90 : t.demandTrend === 'STABLE' ? 60 : 30;
      recommendations.push({ type: 'trending_product', item: t, reason: `Trending category with ${t.totalRfqs} RFQs (${t.demandTrend})`, score: growthScore });
    }

    const repeatBuyerDetails = await this.prisma.company.findMany({
      where: { id: { in: repeatBuyers.map(r => r.buyerCompanyId) } },
      select: { id: true, name: true, slug: true, trustScore: true },
    });
    for (const rb of repeatBuyerDetails) {
      recommendations.push({ type: 'repeat_buyer', item: rb, reason: `Ordered from you multiple times — nurture this relationship`, score: (rb.trustScore ?? 500) / 10 });
    }

    if (myCategoryIds.length > 0) {
      const nearbyBuyers = await this.prisma.rfq.findMany({
        where: { categoryId: { in: myCategoryIds }, status: 'ACTIVE', companyId: { notIn: [companyId, ...pastBuyerIds] } },
        take: 5, orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, companyId: true, company: { select: { id: true, name: true, slug: true } } },
      });
      const seen = new Set<string>();
      for (const rfq of nearbyBuyers) {
        if (seen.has(rfq.companyId)) continue;
        seen.add(rfq.companyId);
        recommendations.push({ type: 'potential_buyer', item: rfq.company, reason: `Posted RFQ in your category: "${rfq.title}"`, score: 80 });
      }
    }

    const growingMarkets = await this.prisma.category.findMany({
      take: 5, orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, _count: { select: { products: true } } },
    });
    for (const gm of growingMarkets) {
      if (myCategoryIds.includes(gm.id)) continue;
      const count = gm._count?.products ?? 0;
      recommendations.push({ type: 'growing_market', item: { id: gm.id, name: gm.name, productCount: count }, reason: `${count} products listed — expanding market opportunity`, score: Math.min(100, count) });
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async getMarketplaceRankings(): Promise<{
    suppliers: RankingEntry[]; buyers: RankingEntry[]; products: RankingEntry[];
    categories: RankingEntry[]; cities: RankingEntry[]; industries: RankingEntry[]; states: RankingEntry[];
  }> {
    const suppliers = await this.prisma.company.findMany({
      where: { status: 'ACTIVE' }, orderBy: { trustScore: 'desc' }, take: 20,
      select: { id: true, name: true, slug: true, logo: true, trustScore: true },
    });

    const buyers = await this.prisma.user.findMany({
      where: { role: 'BUYER', isActive: true }, orderBy: { createdAt: 'desc' }, take: 20,
      select: { id: true, name: true },
    });

    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' }, orderBy: { monthlyOrders: 'desc' }, take: 20,
      select: { id: true, name: true, slug: true, monthlyOrders: true },
    });

    const categories = await this.prisma.category.findMany({
      take: 20, orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
    });

    const cities = await this.prisma.companyLocation.groupBy({
      by: ['city'], where: { city: { not: null } as any },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }, take: 20,
    });

    const states = await this.prisma.companyLocation.groupBy({
      by: ['state'], where: { state: { not: null } as any },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }, take: 20,
    });

    return {
      suppliers: suppliers.map((s, i) => ({ rank: i + 1, ...s, score: (s.trustScore ?? 500) / 10, change: 'stable' as const })),
      buyers: buyers.map((u, i) => ({ rank: i + 1, id: u.id, name: u.name, score: 0, change: 'stable' as const })),
      products: products.map((p, i) => ({ rank: i + 1, id: p.id, name: p.name, score: Math.min(100, (p.monthlyOrders || 0) * 5), slug: p.slug, change: 'stable' as const })),
      categories: categories.map((c, i) => ({ rank: i + 1, id: c.id, name: c.name, score: Math.min(100, (c._count?.products ?? 0)), slug: c.slug, change: 'stable' as const })),
      cities: cities.filter(c => c.city).map((c, i) => ({ rank: i + 1, id: c.city!, name: c.city!, score: (c._count as any).id, change: 'stable' as const })),
      industries: [{ rank: 1, id: '1', name: 'Manufacturing', score: 100, change: 'stable' as const }],
      states: states.filter(s => s.state).map((s, i) => ({ rank: i + 1, id: s.state!, name: s.state!, score: (s._count as any).id, change: 'stable' as const })),
    };
  }

  async getGeoIntelligence(): Promise<GeoIntelligenceResult> {
    const clusters = await this.locationIntelligence.getGeoClusters('supplier', 'daily');
    const demandHeatmap = clusters.map(c => ({ lat: c.latitude, lng: c.longitude, weight: c.count, label: `${c.count} suppliers at (${c.latitude.toFixed(2)}, ${c.longitude.toFixed(2)})` }));

    const supplierGroup = await this.prisma.companyLocation.groupBy({
      by: ['state'], where: { state: { not: null } as any },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const verifiedGroup = await this.prisma.companyLocation.groupBy({
      by: ['state'], where: { state: { not: null } as any, company: { verificationLevel: { not: 'LEVEL_0' } } as any },
      _count: { id: true },
    });
    const verifiedMap = new Map(verifiedGroup.map(v => [v.state!, (v._count as any).id]));

    const buyerGroup = await this.prisma.rfqLocation.groupBy({
      by: ['state'], where: { state: { not: null } as any },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const categories = await this.prisma.category.findMany({
      take: 10, orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, _count: { select: { products: true } } },
    });
    const totalCatProducts = categories.reduce((s, c) => s + (c._count?.products ?? 0), 1);
    const categoryDensity = categories.map(c => { const count = c._count?.products ?? 0; return { category: c.name, count, percentage: Math.round((count / totalCatProducts) * 100) }; });

    const rms = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, name: true, managedCompanies: { select: { id: true, locations: { where: { state: { not: null } as any }, select: { state: true }, take: 1 } } } },
    });
    const rmCoverage = rms.map(rm => {
      const states = [...new Set(rm.managedCompanies.flatMap(c => c.locations.map(l => l.state!).filter(Boolean)))];
      return { rmId: rm.id, rmName: rm.name, companyCount: rm.managedCompanies.length, stateCoverage: states };
    });

    return { demandHeatmap, supplierDensity: supplierGroup.filter(s => s.state).map(s => ({ state: s.state!, count: (s._count as any).id, verifiedCount: verifiedMap.get(s.state!) ?? 0 })), buyerDensity: buyerGroup.filter(b => b.state).map(b => ({ state: b.state!, count: (b._count as any).id })), categoryDensity, rmCoverage };
  }

  async getBusinessIntelligence(companyId: string): Promise<BusinessIntelligenceResult> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, locations: { where: { state: { not: null } as any }, select: { city: true, state: true }, take: 1 } } });
    const myState = company?.locations?.[0]?.state;

    const stateSupplierCounts = await this.prisma.companyLocation.groupBy({
      by: ['state', 'city'], where: { state: { not: null } as any, city: { not: null } as any },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const stateRfqCounts = await this.prisma.rfqLocation.groupBy({
      by: ['state'], where: { state: { not: null } as any },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const rfqByState = new Map(stateRfqCounts.map(r => [r.state!, (r._count as any).id]));
    const supplierByState = new Map(stateSupplierCounts.filter(s => s.state).map(s => [s.state!, (s._count as any).id]));

    const allStates = [...new Set([...supplierByState.keys(), ...rfqByState.keys()])];
    const expansionCities = allStates.filter(s => s !== myState).map(state => {
      const demandScore = Math.min(100, (rfqByState.get(state) ?? 0) * 5);
      const competitionScore = Math.min(100, (supplierByState.get(state) ?? 0) * 2);
      return { city: state, state, demandScore, competitionScore, recommendation: demandScore > competitionScore ? 'RECOMMENDED' : demandScore > 0 ? 'POSSIBLE' : 'LOW DEMAND' };
    }).sort((a, b) => (b.demandScore - b.competitionScore) - (a.demandScore - a.competitionScore)).slice(0, 5);

    const warehouseLocations = allStates.filter(s => s !== myState).map(state => {
      const score = Math.min(100, (rfqByState.get(state) ?? 0) * 3 + (supplierByState.get(state) ?? 0));
      return { city: state, state, score, reason: rfqByState.get(state) ? `${rfqByState.get(state)} RFQs, ${supplierByState.get(state) ?? 0} suppliers` : 'Emerging market with growth potential' };
    }).sort((a, b) => b.score - a.score).slice(0, 3);

    const advertisingCities = allStates.filter(s => s !== myState).map(state => {
      const audienceSize = rfqByState.get(state) ?? 0;
      return { city: state, state, score: Math.min(100, audienceSize * 3), audienceSize: audienceSize > 50 ? 'LARGE' : audienceSize > 10 ? 'MEDIUM' : 'SMALL' };
    }).sort((a, b) => b.score - a.score).slice(0, 3);

    return { expansionCities, warehouseLocations, advertisingCities };
  }

  async getBuyerRelationshipIntelligence(buyerId: string, sellerId: string): Promise<{
    relationshipScore: number; totalOrders: number; totalRfqs: number; totalQuotes: number;
    totalNegotiations: number; completedOrders: number; disputes: number; firstInteraction: Date | null;
    lastInteraction: Date | null; averageOrderValue: number; recommendation: string;
  }> {
    const orders = await this.prisma.order.findMany({
      where: { buyerCompanyId: buyerId, sellerCompanyId: sellerId },
      select: { id: true, status: true, totalAmount: true, createdAt: true },
    });
    const rfqs = await this.prisma.rfq.findMany({ where: { companyId: buyerId }, select: { id: true } });
    const quotes = await this.prisma.quote.findMany({ where: { companyId: sellerId, rfq: { companyId: buyerId } }, select: { id: true, status: true } });
    const negotiations = await this.prisma.negotiation.findMany({ where: { buyerCompanyId: buyerId, sellerCompanyId: sellerId }, select: { id: true, status: true } });
    const disputes = await this.prisma.dispute.findMany({ where: { raisedByCompanyId: buyerId, againstCompanyId: sellerId }, select: { id: true } });
    const completedOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;
    const totalAmount = orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    const totalOrders = orders.length;

    const baseScore = 50;
    const orderBonus = Math.min(20, totalOrders * 5);
    const completedBonus = Math.min(15, completedOrders * 3);
    const disputePenalty = Math.max(-30, disputes.length * -15);
    const negotiationBonus = Math.min(10, negotiations.filter(n => n.status === 'ACCEPTED').length * 5);
    const relationshipScore = Math.max(0, Math.min(100, baseScore + orderBonus + completedBonus + disputePenalty + negotiationBonus));

    const dates = orders.map(o => o.createdAt).filter(Boolean);
    return {
      relationshipScore, totalOrders, totalRfqs: rfqs.length, totalQuotes: quotes.length,
      totalNegotiations: negotiations.length, completedOrders, disputes: disputes.length,
      firstInteraction: dates.length > 0 ? dates.reduce((a, b) => a < b ? a : b) : null,
      lastInteraction: dates.length > 0 ? dates.reduce((a, b) => a > b ? a : b) : null,
      averageOrderValue: totalOrders > 0 ? Math.round(totalAmount / totalOrders) : 0,
      recommendation: relationshipScore >= 80 ? 'STRONG PARTNER — prioritize this relationship' : relationshipScore >= 50 ? 'ACTIVE RELATIONSHIP — regular engagement' : relationshipScore >= 20 ? 'NEW RELATIONSHIP — build trust' : 'MINIMAL INTERACTION — explore opportunities',
    };
  }

  async getDeliveryPrediction(params: { originLat: number; originLng: number; destLat: number; destLng: number; weightKg?: number; courier?: string }): Promise<DeliveryPredictionResult> {
    const distance = this.haversine(params.originLat, params.originLng, params.destLat, params.destLng);
    const baseTransitDays = Math.max(1, Math.round(distance / 300));
    const weightFactor = params.weightKg ? Math.ceil(params.weightKg / 5) : 1;
    const transitDays = baseTransitDays + weightFactor;

    const estimatedDate = new Date(Date.now() + transitDays * 86400000);
    const isWeekend = estimatedDate.getDay() === 0 || estimatedDate.getDay() === 6;
    const adjustedDate = new Date(estimatedDate);
    if (isWeekend) adjustedDate.setDate(adjustedDate.getDate() + 2);

    const delayRisk: 'LOW' | 'MEDIUM' | 'HIGH' = distance > 2000 ? 'HIGH' : distance > 1000 ? 'MEDIUM' : 'LOW';
    const factors = [
      { name: 'Distance', impact: distance > 1000 ? 'negative' as const : 'neutral' as const, detail: `${Math.round(distance)} km` },
      { name: 'Weight', impact: (params.weightKg ?? 1) > 50 ? 'negative' as const : 'positive' as const, detail: `${params.weightKg ?? 1} kg` },
      { name: 'Weekend Delivery', impact: isWeekend ? 'negative' as const : 'positive' as const, detail: isWeekend ? 'Weekend delivery may be delayed' : 'Weekday delivery' },
    ];
    if (params.courier) {
      factors.push({ name: 'Courier', impact: 'neutral' as const, detail: `${params.courier} carrier` });
    }

    return {
      estimatedDeliveryDate: adjustedDate,
      confidence: delayRisk === 'LOW' ? 90 : delayRisk === 'MEDIUM' ? 70 : 50,
      delayRisk,
      transitDays,
      factors,
    };
  }

  async getRelationshipScore(buyerId: string, sellerId: string): Promise<number> {
    return (await this.getBuyerRelationshipIntelligence(buyerId, sellerId)).relationshipScore;
  }

  private async getSuppliersInRadius(params: { lat: number; lng: number; radiusKm: number; categoryId?: string; buyerId?: string }): Promise<any[]> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`c.status = 'ACTIVE'`,
      Prisma.sql`c."subscriptionStatus" != 'EXPIRED'`,
      Prisma.sql`c."verificationLevel" != 'LEVEL_0'`,
      Prisma.sql`cl.latitude IS NOT NULL`,
      Prisma.sql`cl.longitude IS NOT NULL`,
      Prisma.sql`cl."deletedAt" IS NULL`,
    ];

    if (params.categoryId) {
      conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "_CategoryToCompany" ct WHERE ct."A" = c.id AND ct."B" = ${params.categoryId})`);
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    return this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT c.id, c.name, c.slug, c.logo, c."trustScore", c."verificationLevel", c."responseRate",
        6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(${params.lat} - cl.latitude)) / 2, 2) + COS(RADIANS(${params.lat})) * COS(RADIANS(cl.latitude)) * POWER(SIN(RADIANS(${params.lng} - cl.longitude)) / 2, 2)))) AS distance
      FROM "Company" c
      JOIN "CompanyLocation" cl ON cl."companyId" = c.id
      WHERE ${whereClause}
      HAVING distance <= ${params.radiusKm}
      ORDER BY distance ASC
      LIMIT 100
    `);
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
