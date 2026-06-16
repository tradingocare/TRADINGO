import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RfqAnalyticsService } from '../rfq/rfq-analytics.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';

const WEIGHTS = {
  CATEGORY: 0.45,
  GEO: 0.20,
  TRUST: 0.15,
  RESPONSE: 0.15,
  TRADGO: 0.05,
};

const PLAN_BOOST: Record<string, number> = {
  TRADE_ELITE: 0.15,
  TRADE_PREMIUM: 0.10,
  TRADE_PRO: 0.05,
};

const VENDOR_REACH_LIMITS: Record<string, number> = {
  TRADE_START: 20,
  TRADE_SMART: 30,
  TRADE_PLUS: 40,
  TRADE_PRO: 50,
  TRADE_PREMIUM: 75,
  TRADE_ELITE: Infinity,
  TRADBUY: 50,
};

@Injectable()
export class TradmatchService {
  private readonly logger = new Logger(TradmatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rfqAnalytics: RfqAnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  async findMatches(rfqId: string) {
    const rfq = await this.prisma.rfq.findFirst({ where: { id: rfqId, deletedAt: null } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== 'ACTIVE') throw new BadRequestException('RFQ must be ACTIVE to match vendors');
    if (rfq.expiresAt && rfq.expiresAt < new Date()) throw new BadRequestException('RFQ has expired');

    const existingMatches = await this.prisma.rfqVendorMatch.count({ where: { rfqId } });
    if (existingMatches > 0) throw new BadRequestException('RFQ already has vendor matches');

    const company = await this.prisma.company.findUnique({
      where: { id: rfq.companyId },
      select: { subscriptionPlan: true },
    });
    const maxVendors = company?.subscriptionPlan ? (VENDOR_REACH_LIMITS[company.subscriptionPlan] ?? 20) : 20;

    const matches = await this.scoreAndRankVendors(rfq, maxVendors);

    await this.broadcastMatches(rfqId, matches);

    await this.rfqAnalytics.trackMatchEvent(
      rfqId,
      rfq.companyId,
      matches.length,
      matches.reduce((s, m) => s + m.finalScore, 0) / matches.length,
      matches[0]?.finalScore ?? 0,
    );

    return matches;
  }

  async getMatches(rfqId: string) {
    return this.prisma.rfqVendorMatch.findMany({
      where: { rfqId },
      orderBy: { matchScore: 'desc' },
      include: {
        company: { select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true, subscriptionPlan: true } },
      },
    });
  }

  async getMatchById(rfqId: string, matchId: string) {
    const match = await this.prisma.rfqVendorMatch.findFirst({
      where: { id: matchId, rfqId },
      include: {
        company: { select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true, subscriptionPlan: true } },
      },
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  private async scoreAndRankVendors(rfq: any, maxVendors: number) {
    const rfqLocation = await this.prisma.rfqLocation.findFirst({
      where: { rfqId: rfq.id, isPrimary: true },
    }) ?? await this.prisma.rfqLocation.findFirst({ where: { rfqId: rfq.id } });

    let candidates = await this.findVendorsByCategory(rfq.categoryId, rfq.companyId);

    if (candidates.length < Math.min(maxVendors, 5)) {
      const expanded = await this.expandCategory(rfq.categoryId, rfq.companyId);
      const existingIds = new Set(candidates.map((c: any) => c.id));
      for (const v of expanded) {
        if (!existingIds.has(v.id)) candidates.push(v);
      }
    }

    if (candidates.length < Math.min(maxVendors, 3) && rfqLocation) {
      const radiusVendors = await this.expandRadius(rfqLocation, rfq.companyId, rfq.categoryId);
      const existingIds = new Set(candidates.map((c: any) => c.id));
      for (const v of radiusVendors) {
        if (!existingIds.has(v.id)) candidates.push(v);
      }
    }

    const scored = candidates.map((vendor: any) => this.calculateScore(vendor, rfq, rfqLocation));

    scored.sort((a: any, b: any) => b.finalScore - a.finalScore);

    return scored.slice(0, maxVendors);
  }

  private calculateScore(vendor: any, rfq: any, rfqLocation: any) {
    const categoryScore = this.categoryMatchScore(vendor, rfq);
    const geoScore = this.geoMatchScore(vendor, rfqLocation);
    const trustScore = (vendor.trustScore ?? 0) / 100;
    const responseScore = (vendor.responseRate ?? 0) / 100;
    const tradgoScore = vendor.goCashBalance ? Math.min(vendor.goCashBalance / 10000, 1) : 0;
    const planScore = vendor.subscriptionPlan ? (PLAN_BOOST[vendor.subscriptionPlan] ?? 0) : 0;

    const weighted =
      categoryScore * WEIGHTS.CATEGORY +
      geoScore * WEIGHTS.GEO +
      trustScore * WEIGHTS.TRUST +
      responseScore * WEIGHTS.RESPONSE +
      tradgoScore * WEIGHTS.TRADGO;

    const finalScore = Math.min(weighted * (1 + planScore), 1);

    return { vendorId: vendor.id, categoryScore, geoScore, trustScore, responseScore, tradgoScore, planScore, finalScore };
  }

  private categoryMatchScore(vendor: any, rfq: any): number {
    if (!rfq.categoryId) return 0.5;
    const vendorCategoryIds = (vendor.categories ?? []).map((cc: any) => cc.categoryId);
    if (vendorCategoryIds.includes(rfq.categoryId)) return 1.0;
    if (vendor.parentCategoryIds?.includes(rfq.categoryId)) return 0.8;
    if (vendor.industryIds?.includes(rfq.industryId)) return 0.5;
    return 0.3;
  }

  private geoMatchScore(vendor: any, rfqLocation: any): number {
    if (!rfqLocation) return 0.5;
    const vendorLocation = vendor.locations?.[0];
    if (!vendorLocation) return 0.3;
    if (vendorLocation.city === rfqLocation.city) return 1.0;
    if ((vendorLocation.state && vendorLocation.state === rfqLocation.state) ||
        (vendorLocation.stateCode && vendorLocation.stateCode === rfqLocation.state)) return 0.7;
    if (vendorLocation.country === rfqLocation.country) return 0.3;
    return 0.1;
  }

  private async findVendorsByCategory(categoryId: string | null, buyerCompanyId: string) {
    if (!categoryId) return [];
    return this.prisma.company.findMany({
      where: {
        categories: { some: { categoryId } },
        id: { not: buyerCompanyId },
        status: 'ACTIVE',
        subscriptionStatus: { not: 'CANCELLED' },
      },
      select: {
        id: true, name: true, trustScore: true, responseRate: true, goCashBalance: true,
        subscriptionPlan: true, subscriptionStatus: true,
        locations: { take: 1, orderBy: { isPrimary: 'desc' } },
        categories: { select: { categoryId: true } },
      },
    });
  }

  private async expandCategory(categoryId: string | null, buyerCompanyId: string) {
    if (!categoryId) return [];
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: { select: { id: true } } },
    });
    if (!category) return [];

    const childIds = category.children.map((c: any) => c.id);
    if (childIds.length === 0) return [];

    return this.prisma.company.findMany({
      where: {
        categories: { some: { categoryId: { in: childIds } } },
        id: { not: buyerCompanyId },
        status: 'ACTIVE',
        subscriptionStatus: { not: 'CANCELLED' },
      },
      select: {
        id: true, name: true, trustScore: true, responseRate: true, goCashBalance: true,
        subscriptionPlan: true, subscriptionStatus: true,
        locations: { take: 1, orderBy: { isPrimary: 'desc' } },
        categories: { select: { categoryId: true } },
      },
      take: 100,
    });
  }

  private async expandRadius(rfqLocation: any, buyerCompanyId: string, categoryId: string | null) {
    const where: any = {
      id: { not: buyerCompanyId },
      status: 'ACTIVE',
      subscriptionStatus: { not: 'CANCELLED' },
    };
    if (categoryId) {
      where.categories = { some: { categoryId } };
    }
    if (rfqLocation.state) {
      where.locations = { some: { state: rfqLocation.state } };
    }

    return this.prisma.company.findMany({
      where,
      select: {
        id: true, name: true, trustScore: true, responseRate: true, goCashBalance: true,
        subscriptionPlan: true, subscriptionStatus: true,
        locations: { take: 1, orderBy: { isPrimary: 'desc' } },
        categories: { select: { categoryId: true } },
      },
      take: 100,
    });
  }

  private async broadcastMatches(rfqId: string, matches: any[]) {
    const now = new Date();
    const data = matches.map((m: any) => ({
      rfqId,
      companyId: m.vendorId,
      matchScore: m.finalScore,
      categoryScore: m.categoryScore,
      geoScore: m.geoScore,
      trustScore: m.trustScore,
      responseScore: m.responseScore,
      tradgoScore: m.tradgoScore,
      planScore: m.planScore,
      status: 'SENT' as any,
      sentAt: now,
      matchedAt: now,
    }));

    await this.prisma.rfqVendorMatch.createMany({ data, skipDuplicates: true });

    await this.prisma.auditLog.create({
      data: {
        action: 'RFQ_MATCHES_CREATED',
        resource: `rfq:${rfqId}`,
        metadata: { matchCount: data.length, vendorIds: matches.map((m: any) => m.vendorId) },
      },
    });

    const rfq = await this.prisma.rfq.findUnique({
      where: { id: rfqId },
      select: { companyId: true, createdBy: true, title: true },
    });

    if (rfq) {
      await this.notificationService.createWithTemplate(
        rfq.companyId,
        rfq.createdBy,
        NotificationType.RFQ_MATCH,
        { rfqTitle: rfq.title, matchCount: data.length },
      );
    }

    this.logger.log(`Broadcast ${data.length} matches for RFQ ${rfqId}`);
  }
}
