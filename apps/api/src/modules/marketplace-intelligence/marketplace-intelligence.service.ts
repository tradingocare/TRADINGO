import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BuyerHistoryService } from './buyer-history.service';

interface MarketplaceScoreFactors {
  distance: number;
  distanceScore: number;
  tradTrustScore: number;
  priceCompetitiveness: number;
  deliveryReliability: number;
  responseRate: number;
  completionRate: number;
  sellerRating: number;
  financialHealth: number;
  relationshipScore: number;
  aiConfidence: number;
  availability: number;
  negotiationSuccess: number;
  rfqSuccess: number;
  verificationLevel: number;
}

export interface BestSupplierResult {
  companyId: string;
  companyName: string;
  slug: string;
  logo: string | null;
  totalScore: number;
  factors: MarketplaceScoreFactors;
  recommendation: 'BEST' | 'STRONG' | 'GOOD' | 'AVERAGE' | 'POOR';
}

const WEIGHTS = {
  distance: 0.12,
  trustScore: 0.15,
  price: 0.14,
  delivery: 0.10,
  responseRate: 0.08,
  completionRate: 0.08,
  sellerRating: 0.07,
  financialHealth: 0.06,
  relationship: 0.07,
  aiConfidence: 0.04,
  availability: 0.03,
  negotiation: 0.02,
  rfqSuccess: 0.02,
  verification: 0.02,
};

@Injectable()
export class MarketplaceIntelligenceService {
  private readonly logger = new Logger(MarketplaceIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly buyerHistoryService: BuyerHistoryService,
  ) {}

  async findBestSuppliers(params: {
    buyerId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    categoryId?: string;
    productId?: string;
    limit?: number;
  }): Promise<BestSupplierResult[]> {
    const suppliers = await this.prisma.company.findMany({
      where: {
        status: 'ACTIVE',
        subscriptionStatus: { not: 'EXPIRED' },
        verificationLevel: { not: 'LEVEL_0' },
        ...(params.categoryId
          ? { categories: { some: { categoryId: params.categoryId } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        trustScore: true,
        verificationLevel: true,
        responseRate: true,
        locations: {
          where: { deletedAt: null, latitude: { not: null }, longitude: { not: null } },
          take: 3,
          orderBy: { isPrimary: 'desc' },
          select: { id: true, latitude: true, longitude: true, city: true, state: true },
        },
        _count: {
          select: {
            buyerOrders: true,
            sellerOrders: true,
            buyerShipments: true,
            sellerShipments: true,
            disputesRaised: true,
            disputesAgainst: true,
            rfqsCreated: true,
          },
        },
      },
      take: 200,
    });

    const supplierIds = suppliers.map((s) => s.id);

    const [marketplaceAvg, allVariants, reviewAggs, payments, negotiations, products, allInventory] =
      await Promise.all([
        this.prisma.productVariant.aggregate({
          where: { isActive: true },
          _avg: { price: true },
        }),
        this.prisma.productVariant.findMany({
          where: { product: { companyId: { in: supplierIds }, status: 'ACTIVE', deletedAt: null }, isActive: true },
          select: { price: true, product: { select: { companyId: true } } },
        }),
        this.prisma.productReview.groupBy({
          by: ['companyId'],
          where: { companyId: { in: supplierIds } },
          _avg: { rating: true },
          _count: { id: true },
        }),
        this.prisma.payment.findMany({
          where: { companyId: { in: supplierIds } },
          select: { companyId: true, status: true, amount: true },
        }),
        this.prisma.negotiation.findMany({
          where: params.buyerId
            ? { OR: [{ buyerCompanyId: params.buyerId }, { sellerCompanyId: { in: supplierIds } }] }
            : { sellerCompanyId: { in: supplierIds } },
          select: { sellerCompanyId: true, status: true },
        }),
        this.prisma.product.findMany({
          where: { companyId: { in: supplierIds }, status: 'ACTIVE', deletedAt: null },
          select: { id: true, companyId: true, monthlyOrders: true },
        }),
        this.prisma.productInventory.findMany({
          where: { product: { companyId: { in: supplierIds } } },
          select: { id: true, product: { select: { companyId: true } } },
        }),
      ]);

    const marketAvgPrice = marketplaceAvg._avg?.price?.toNumber() ?? 1000;

    const variantMap = new Map<string, number | null>();
    for (const v of allVariants) {
      const cid = v.product.companyId;
      if (!variantMap.has(cid)) variantMap.set(cid, v.price?.toNumber() ?? null);
    }
    const reviewMap = new Map(reviewAggs.map((r) => [r.companyId, { avgRating: r._avg?.rating ?? null, count: r._count.id ?? 0 }]));
    const paymentMap = new Map<string, { total: number; captured: number; failed: number; sumAmount: number }>();
    for (const p of payments) {
      const entry = paymentMap.get(p.companyId) || { total: 0, captured: 0, failed: 0, sumAmount: 0 };
      entry.total++;
      if (p.status === 'CAPTURED') { entry.captured++; entry.sumAmount += Number(p.amount) || 0; }
      if (p.status === 'FAILED') entry.failed++;
      paymentMap.set(p.companyId, entry);
    }
    const negotiationMap = new Map<string, { total: number; accepted: number }>();
    for (const n of negotiations) {
      const entry = negotiationMap.get(n.sellerCompanyId) || { total: 0, accepted: 0 };
      entry.total++;
      if (n.status === 'ACCEPTED' || n.status === 'CONVERTED') entry.accepted++;
      negotiationMap.set(n.sellerCompanyId, entry);
    }
    const productMap = new Map<string, { monthlyOrders: number; count: number }>();
    for (const p of products) {
      const entry = productMap.get(p.companyId) || { monthlyOrders: 0, count: 0 };
      entry.monthlyOrders += p.monthlyOrders;
      entry.count++;
      productMap.set(p.companyId, entry);
    }
    const inventoryMap = new Map<string, number>();
    for (const i of allInventory) {
      const cid = i.product.companyId;
      inventoryMap.set(cid, (inventoryMap.get(cid) ?? 0) + 1);
    }

    const scores: BestSupplierResult[] = [];

    for (const supplier of suppliers) {
      const primaryLoc = supplier.locations?.[0];
      let distance = 0;
      let distanceScore = 50;

      if (params.lat && params.lng && primaryLoc?.latitude && primaryLoc?.longitude) {
        distance = this.haversine(
          params.lat,
          params.lng,
          primaryLoc.latitude,
          primaryLoc.longitude,
        );
        if (params.radiusKm && distance > params.radiusKm) continue;
        distanceScore = Math.max(0, Math.round(100 - (distance / (params.radiusKm || 100)) * 100));
      }

      const trustScore = (supplier.trustScore ?? 500) / 10;

      const avgPrice = variantMap.get(supplier.id) ?? undefined;
      const priceCompetitiveness = avgPrice
        ? Math.round(Math.max(0, Math.min(100, ((marketAvgPrice - avgPrice) / marketAvgPrice) * 50 + 50)))
        : 50;

      const totalOrders = (supplier._count.buyerOrders + supplier._count.sellerOrders) || 1;
      const completedOrders = (supplier._count.buyerShipments + supplier._count.sellerShipments) || 0;
      const completionRate = Math.round((completedOrders / totalOrders) * 100);
      const responseRate = Math.round((supplier.responseRate ?? 0.5) * 100);

      const disputeRate = (supplier._count.disputesRaised + supplier._count.disputesAgainst) || 0;
      const deliveryReliability = Math.max(0, 100 - disputeRate * 10);

      const reviewData = reviewMap.get(supplier.id);
      const sellerRating = reviewData?.avgRating
        ? Math.round((reviewData.avgRating / 5) * 100)
        : 50;

      const payData = paymentMap.get(supplier.id);
      const totalPayments = payData?.total ?? 1;
      const paymentSuccessRate = payData
        ? Math.round(((totalPayments - payData.failed) / totalPayments) * 100)
        : 100;
      const totalAmount = payData?.sumAmount ?? 0;
      const financialHealth = Math.min(100, Math.round(
        (paymentSuccessRate * 0.6) + (Math.min(totalAmount / 100000, 1) * 40)
      ));

      let relationshipScore = 0;
      if (params.buyerId) {
        relationshipScore = await this.buyerHistoryService.getRelationshipScore(params.buyerId, supplier.id);
      }

      const negData = negotiationMap.get(supplier.id);
      const negotiationSuccess = negData && negData.total > 0
        ? Math.round((negData.accepted / negData.total) * 100)
        : 50;

      const prodData = productMap.get(supplier.id);
      const totalMonthlyOrders = prodData?.monthlyOrders ?? 0;
      const totalProducts = prodData?.count ?? 0;
      const aiConfidence = Math.min(100, 50 + totalMonthlyOrders * 2);

      const inventoryCount = inventoryMap.get(supplier.id) ?? 0;
      const availability = totalProducts > 0
        ? Math.min(100, Math.round((inventoryCount / totalProducts) * 100))
        : 0;

      const rfqSuccessScore = supplier._count.rfqsCreated > 0
        ? Math.min(100, Math.round((supplier._count.rfqsCreated / 10) * 100))
        : 30;

      const verificationLevelMap: Record<string, number> = {
        LEVEL_6: 100, LEVEL_5: 90, LEVEL_4: 80,
        LEVEL_3: 70, LEVEL_2: 60, LEVEL_1: 50, LEVEL_0: 0,
      };
      const verificationScore = verificationLevelMap[supplier.verificationLevel] ?? 50;

      const factors: MarketplaceScoreFactors = {
        distance,
        distanceScore,
        tradTrustScore: trustScore,
        priceCompetitiveness,
        deliveryReliability,
        responseRate,
        completionRate,
        sellerRating,
        financialHealth,
        relationshipScore,
        aiConfidence,
        availability,
        negotiationSuccess,
        rfqSuccess: rfqSuccessScore,
        verificationLevel: verificationScore,
      };

      const totalScore = Math.round(
        distanceScore * WEIGHTS.distance +
        trustScore * WEIGHTS.trustScore +
        priceCompetitiveness * WEIGHTS.price +
        deliveryReliability * WEIGHTS.delivery +
        responseRate * WEIGHTS.responseRate +
        completionRate * WEIGHTS.completionRate +
        sellerRating * WEIGHTS.sellerRating +
        financialHealth * WEIGHTS.financialHealth +
        relationshipScore * WEIGHTS.relationship +
        aiConfidence * WEIGHTS.aiConfidence +
        availability * WEIGHTS.availability +
        negotiationSuccess * WEIGHTS.negotiation +
        rfqSuccessScore * WEIGHTS.rfqSuccess +
        verificationScore * WEIGHTS.verification,
      );

      let recommendation: BestSupplierResult['recommendation'] = 'AVERAGE';
      if (totalScore >= 85) recommendation = 'BEST';
      else if (totalScore >= 75) recommendation = 'STRONG';
      else if (totalScore >= 60) recommendation = 'GOOD';

      scores.push({
        companyId: supplier.id,
        companyName: supplier.name,
        slug: supplier.slug,
        logo: supplier.logo,
        totalScore,
        factors,
        recommendation,
      });
    }

    return scores
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, params.limit ?? 20);
  }

  async getBuyerRecommendations(buyerId: string, limit = 10): Promise<BestSupplierResult[]> {
    const preferences = await this.buyerHistoryService.getCategoryPreferences(buyerId);
    const topCategory = preferences[0]?.categoryId;
    return this.findBestSuppliers({ buyerId, categoryId: topCategory, limit });
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
