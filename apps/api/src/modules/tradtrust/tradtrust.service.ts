import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SmartRfqService } from '../smart-rfq/smart-rfq.service';
import { SmartShipmentService } from '../smart-shipment/smart-shipment.service';
import { SmartNegotiationService } from '../smart-negotiation/smart-negotiation.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { TradTrustWeightsService } from './tradtrust-weights.config';
import { Prisma, NotificationType } from '@prisma/client';

@Injectable()
export class TradTrustService {
  private readonly logger = new Logger(TradTrustService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly weightsService: TradTrustWeightsService,
    private readonly smartRfqService: SmartRfqService,
    private readonly smartShipmentService: SmartShipmentService,
    private readonly smartNegotiationService: SmartNegotiationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async calculateScore(companyId: string): Promise<number> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: {
        locations: { where: { deletedAt: null } },
        categories: true,
        owners: { select: { userId: true } },
        certificationDocs: { select: { status: true, expiresAt: true } },
      },
    });

    if (!company) {
      this.logger.warn(`Company ${companyId} not found for score calculation`);
      return 0;
    }

    const w = this.weightsService.weights;
    const maxPos = this.weightsService.getMaxPositiveWeight();

    const profileFactors = {
      verificationLevelScore: this.calculateVerificationLevelScore(company.verificationLevel),
      profileCompletionScore: this.calculateProfileCompletionScore(company),
      companyAgeScore: this.calculateCompanyAgeScore(company.createdAt),
      activeStatusScore: this.calculateActiveStatusScore(company.status),
      certificationScore: this.calculateCertificationScore(company.certificationDocs),
      onboardingScore: this.calculateOnboardingScore(company.onboardingCompletedAt),
    };

    const profileScore =
      (profileFactors.verificationLevelScore * w.verificationLevel +
        profileFactors.profileCompletionScore * w.profileCompletion +
        profileFactors.companyAgeScore * w.companyAge +
        profileFactors.activeStatusScore * w.activeStatus +
        profileFactors.certificationScore * w.certifications +
        profileFactors.onboardingScore * w.onboarding) / 100;

    const behavioral = await this.computeBehavioralScore(companyId, company.owners.map(o => o.userId));

    const penaltyScore = await this.computePenaltyScore(companyId);

    const rawTotal = profileScore + behavioral.behavioralScore - penaltyScore;
    const finalScore = Math.max(0, Math.min(this.weightsService.maxScore, Math.round(rawTotal)));

    const allFactors: Record<string, number> = {
      ...profileFactors,
      ...behavioral.factors,
      fraudPenalty: Math.round(Math.min(penaltyScore * 100 / w.fraudPenalty, 100)),
      disputePenalty: Math.round(Math.min(penaltyScore * 100 / w.disputePenalty, 100)),
    };

    await this.prisma.tradTrustScore.create({
      data: {
        companyId,
        score: finalScore,
        factors: allFactors as unknown as Prisma.InputJsonValue,
      },
    });

    const legacyScore = Math.round(finalScore / 10);

    await this.prisma.company.update({
      where: { id: companyId },
      data: { trustScore: legacyScore, updatedBy: company.createdBy },
    });

    this.logger.log(`TradTrust unified score for company ${companyId}: ${finalScore}/1000`);

    try {
      await this.notificationService.createWithTemplate(
        companyId,
        company.createdBy ?? undefined,
        NotificationType.TRUST_SCORE_CHANGED,
        { score: finalScore, grade: this.weightsService.getGrade(finalScore) },
      );
    } catch (err) {
      this.logger.warn(`Failed to send trust score notification for ${companyId}: ${(err as Error).message}`);
    }

    return finalScore;
  }

  private async computeBehavioralScore(
    companyId: string,
    userIds: string[],
  ): Promise<{ behavioralScore: number; factors: Record<string, number> }> {
    const w = this.weightsService.weights;
    const factors: Record<string, number> = {};

    const [
      completionRates,
      rfqMetrics,
      quoteMetrics,
      negotiationMetrics,
      shipmentMetrics,
      walletData,
      reputationSummary,
      rankData,
    ] = await Promise.all([
      this.analyticsService.getCompletionRate().catch(() => null),
      this.smartRfqService.getRfqQualityMetrics(companyId).catch(() => null),
      this.smartRfqService.getQuotePerformanceMetrics(companyId).catch(() => null),
      this.smartNegotiationService.getPerformanceMetrics(companyId).catch(() => null),
      this.smartShipmentService.getPerformanceMetrics(companyId).catch(() => null),
      this.fetchWalletSignals(companyId),
      this.fetchReputationSignals(userIds),
      this.analyticsService.getSellerLeaderboardPosition(companyId).catch(() => null),
    ]);

    const completionScore = completionRates?.completionRate
      ? Math.min(100, Math.round(completionRates.completionRate))
      : 50;
    factors.orderCompletionScore = completionScore;

    const deliveryScore = shipmentMetrics?.onTimeDeliveryRate
      ? Math.min(100, Math.round(shipmentMetrics.onTimeDeliveryRate))
      : 50;
    factors.deliveryPerformanceScore = deliveryScore;

    const rfqScore = rfqMetrics?.responseRate
      ? Math.min(100, Math.round(
          (rfqMetrics.responseRate + (rfqMetrics.conversionRate ?? 0)) / 2,
        ))
      : 50;
    factors.rfqQualityScore = rfqScore;

    const quoteScore = quoteMetrics?.acceptanceRate
      ? Math.min(100, Math.round(quoteMetrics.acceptanceRate))
      : 50;
    factors.quoteSuccessScore = quoteScore;

    const negotiationScore = negotiationMetrics?.successRate
      ? Math.min(100, Math.round(negotiationMetrics.successRate))
      : 50;
    factors.negotiationSuccessScore = negotiationScore;

    const financialScore = walletData ?? 50;
    factors.financialHealthScore = financialScore;

    const reputationScore = reputationSummary ?? 50;
    factors.reputationEventsScore = reputationScore;

    const rankScore = rankData?.rank
      ? Math.min(100, Math.round((1 - (rankData.rank - 1) / 100) * 100))
      : 50;
    factors.marketplaceRankScore = rankScore;

    const behavioralScore =
      (completionScore * w.orderCompletion +
        deliveryScore * w.deliveryPerformance +
        rfqScore * w.rfqQuality +
        quoteScore * w.quoteSuccess +
        negotiationScore * w.negotiationSuccess +
        financialScore * w.financialHealth +
        reputationScore * w.reputationEvents +
        rankScore * w.marketplaceRank) / 100;

    return { behavioralScore, factors };
  }

  private async fetchWalletSignals(companyId: string): Promise<number | null> {
    try {
      const wallet = await this.prisma.gOCASH_Wallet.findFirst({
        where: { companyId },
        select: { status: true, currentBalance: true, kycVerified: true },
      });
      if (!wallet) return 30;
      let base = 50;
      if (wallet.status === 'ACTIVE') base += 30;
      if (wallet.kycVerified) base += 20;
      const balance = Number(wallet.currentBalance);
      if (balance > 100000) base += 20;
      else if (balance > 10000) base += 10;
      if (wallet.status === 'LOCKED' || wallet.status === 'SUSPENDED') base -= 40;
      if (wallet.status === 'EXPIRED') base -= 20;
      return Math.max(0, Math.min(100, base));
    } catch {
      return null;
    }
  }

  private async fetchReputationSignals(userIds: string[]): Promise<number | null> {
    if (userIds.length === 0) return null;
    try {
      const events = await this.prisma.reputationEvent.groupBy({
        by: ['type'],
        where: { userId: { in: userIds } },
        _count: true,
      });
      const eventMap = new Map(events.map(e => [e.type, e._count]));
      const positive = (eventMap.get('BUYER_VERIFIED') ?? 0) * 3
        + (eventMap.get('ORDER_COMPLETED') ?? 0) * 2
        + (eventMap.get('QUOTE_ACCEPTED') ?? 0) * 1
        + (eventMap.get('DELIVERY_CONFIRMED') ?? 0) * 2
        + (eventMap.get('GOCASH_REWARDS_EARNED') ?? 0) * 1
        + (eventMap.get('DISPUTE_RESOLVED') ?? 0) * 2;
      const negative = (eventMap.get('ORDER_CANCELLED') ?? 0) * 3
        + (eventMap.get('DISPUTE_OPENED') ?? 0) * 4;
      const net = positive - negative;
      return Math.max(0, Math.min(100, 50 + Math.round(net / 2)));
    } catch {
      return null;
    }
  }

  private async computePenaltyScore(companyId: string): Promise<number> {
    const w = this.weightsService.weights;
    let penalty = 0;

    try {
      const openDisputes = await this.prisma.dispute.count({
        where: {
          OR: [{ raisedByCompanyId: companyId }, { againstCompanyId: companyId }],
          status: { in: ['OPEN', 'UNDER_REVIEW', 'EVIDENCE_PENDING', 'NEGOTIATION', 'ESCALATED', 'ADMIN_ARBITRATION'] },
        },
      });
      penalty += openDisputes * (w.disputePenalty / 5);
    } catch { /* ignore */ }

    try {
      const cancelledOrders = await this.prisma.order.count({
        where: {
          OR: [{ buyerCompanyId: companyId }, { sellerCompanyId: companyId }],
          status: 'CANCELLED',
        },
      });
      penalty += cancelledOrders * (w.disputePenalty / 20);
    } catch { /* ignore */ }

    try {
      const fraudWallets = await this.prisma.gOCASH_Wallet.count({
        where: { companyId, status: { in: ['SUSPENDED', 'LOCKED'] } },
      });
      if (fraudWallets > 0) penalty += w.fraudPenalty;
    } catch { /* ignore */ }

    return Math.min(penalty, w.fraudPenalty + w.disputePenalty);
  }

  async getUnifiedScore(companyId: string) {
    const score = await this.getScore(companyId);
    return {
      ...score,
      unifiedScore: score.score * 10,
      grade: this.weightsService.getGrade(score.score * 10),
      riskLevel: this.weightsService.getRiskLevel(score.score * 10),
    };
  }

  async getScoreBreakdown(companyId: string) {
    const latest = await this.prisma.tradTrustScore.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { score: true, factors: true, createdAt: true },
    });
    if (!latest) return null;

    const factors = latest.factors as Record<string, number>;
    const unifiedScore = latest.score;
    const w = this.weightsService.weights;

    const breakdown: { category: string; score: number; weight: number; contribution: number; maxContribution: number }[] = [];

    const profileFactors = [
      { key: 'verificationLevelScore', label: 'Verification Level', weight: w.verificationLevel },
      { key: 'profileCompletionScore', label: 'Profile Completion', weight: w.profileCompletion },
      { key: 'companyAgeScore', label: 'Company Age', weight: w.companyAge },
      { key: 'activeStatusScore', label: 'Active Status', weight: w.activeStatus },
      { key: 'certificationScore', label: 'Certifications', weight: w.certifications },
      { key: 'onboardingScore', label: 'Onboarding', weight: w.onboarding },
    ];

    const behavioralFactors = [
      { key: 'orderCompletionScore', label: 'Order Completion', weight: w.orderCompletion },
      { key: 'deliveryPerformanceScore', label: 'Delivery Performance', weight: w.deliveryPerformance },
      { key: 'rfqQualityScore', label: 'RFQ Quality', weight: w.rfqQuality },
      { key: 'quoteSuccessScore', label: 'Quote Success', weight: w.quoteSuccess },
      { key: 'negotiationSuccessScore', label: 'Negotiation Success', weight: w.negotiationSuccess },
      { key: 'financialHealthScore', label: 'Financial Health', weight: w.financialHealth },
      { key: 'reputationEventsScore', label: 'Reputation Events', weight: w.reputationEvents },
      { key: 'marketplaceRankScore', label: 'Marketplace Rank', weight: w.marketplaceRank },
    ];

    const penalties = [
      { key: 'fraudPenalty', label: 'Fraud Penalty', weight: w.fraudPenalty },
      { key: 'disputePenalty', label: 'Dispute Penalty', weight: w.disputePenalty },
    ];

    for (const f of profileFactors) {
      const score = factors[f.key] ?? 50;
      breakdown.push({
        category: f.label,
        score: Math.round(score),
        weight: f.weight,
        contribution: Math.round(score * f.weight / 100),
        maxContribution: f.weight,
      });
    }

    for (const f of behavioralFactors) {
      const score = factors[f.key] ?? 50;
      breakdown.push({
        category: f.label,
        score: Math.round(score),
        weight: f.weight,
        contribution: Math.round(score * f.weight / 100),
        maxContribution: f.weight,
      });
    }

    for (const p of penalties) {
      const score = factors[p.key] ?? 0;
      breakdown.push({
        category: p.label,
        score: Math.round(score),
        weight: p.weight,
        contribution: -Math.round(score * p.weight / 100),
        maxContribution: 0,
      });
    }

    return {
      unifiedScore,
      grade: this.weightsService.getGrade(unifiedScore),
      riskLevel: this.weightsService.getRiskLevel(unifiedScore),
      breakdown,
    };
  }

  async recalculateByCompany(companyId: string): Promise<number> {
    return this.calculateScore(companyId);
  }

  async recalculateAll(): Promise<number> {
    const companies = await this.prisma.company.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    let count = 0;
    for (const company of companies) {
      await this.calculateScore(company.id);
      count++;
    }

    this.logger.log(`Recalculated TradTrust scores for ${count} companies`);
    return count;
  }

  async recalculateByUser(userId: string): Promise<{ companyId: string; score: number } | null> {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      select: { companyId: true },
    });
    if (!owner) return null;
    const score = await this.calculateScore(owner.companyId);
    return { companyId: owner.companyId, score };
  }

  async getTrustStats(): Promise<{
    totalCompanies: number;
    averageScore: number;
    gradeDistribution: Record<string, number>;
    riskDistribution: Record<string, number>;
    highestScore: number;
    lowestScore: number;
    recentRecalculations: number;
  }> {
    const scores = await this.prisma.tradTrustScore.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { score: true },
    });

    const latestScores = await this.prisma.company.findMany({
      where: { deletedAt: null },
      select: { trustScore: true },
    });

    const validScores = latestScores.map(c => c.trustScore ?? 0).filter(s => s > 0);
    const avg = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

    const gradeDist: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0 };
    const riskDist: Record<string, number> = { 'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0 };

    for (const c of latestScores) {
      const unified = (c.trustScore ?? 0) * 10;
      const grade = this.weightsService.getGrade(unified);
      gradeDist[grade] = (gradeDist[grade] ?? 0) + 1;
      const risk = this.weightsService.getRiskLevel(unified);
      riskDist[risk] = (riskDist[risk] ?? 0) + 1;
    }

    return {
      totalCompanies: latestScores.length,
      averageScore: avg * 10,
      gradeDistribution: gradeDist,
      riskDistribution: riskDist,
      highestScore: Math.max(...validScores, 0) * 10,
      lowestScore: Math.min(...validScores, 0) * 10,
      recentRecalculations: scores.length,
    };
  }

  async getScore(companyId: string): Promise<{ score: number; factors: Record<string, number> | null; updatedAt: Date | null }> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { trustScore: true },
    });

    const latest = await this.prisma.tradTrustScore.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { score: true, factors: true, createdAt: true },
    });

    return {
      score: company?.trustScore ?? latest?.score ?? 0,
      factors: (latest?.factors ?? null) as Record<string, number> | null,
      updatedAt: latest?.createdAt ?? null,
    };
  }

  async getHistory(companyId: string, limit = 20): Promise<{ id: string; score: number; factors: Record<string, number> | null; createdAt: Date }[]> {
    const records = await this.prisma.tradTrustScore.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, score: true, factors: true, createdAt: true },
    });

    return records.map((r) => ({ ...r, factors: r.factors as Record<string, number> | null }));
  }

  private calculateVerificationLevelScore(level: string): number {
    const levelScores: Record<string, number> = {
      LEVEL_0: 0,
      LEVEL_1: 10,
      LEVEL_2: 20,
      LEVEL_3: 50,
      LEVEL_4: 70,
      LEVEL_5: 85,
      LEVEL_6: 100,
    };
    return levelScores[level] ?? 0;
  }

  private calculateProfileCompletionScore(company: {
    description: string | null;
    logo: string | null;
    banner: string | null;
    website: string | null;
    email: string | null;
    mobile: string | null;
    gstNumber: string | null;
    panNumber: string | null;
    businessType: string | null;
    establishedYear: number | null;
    employeeCount: number | null;
    geographicReach: string | null;
    locations: unknown[];
    categories: unknown[];
    owners: unknown[];
  }): number {
    const fields: (string | null | undefined)[] = [
      company.description,
      company.logo,
      company.banner,
      company.website,
      company.email,
      company.mobile,
      company.gstNumber,
      company.panNumber,
      company.businessType,
      company.establishedYear?.toString(),
      company.employeeCount?.toString(),
      company.geographicReach,
    ];

    const filledFields = fields.filter((f) => f !== null && f !== undefined && f !== '').length;
    const baseScore = (filledFields / fields.length) * 70;

    const hasLocations = company.locations.length > 0 ? 10 : 0;
    const hasCategories = company.categories.length > 0 ? 10 : 0;
    const hasOwners = company.owners.length > 0 ? 10 : 0;

    return Math.min(100, Math.round(baseScore + hasLocations + hasCategories + hasOwners));
  }

  private calculateCompanyAgeScore(createdAt: Date): number {
    const ageInYears = (Date.now() - createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageInYears >= 5) return 100;
    if (ageInYears >= 3) return 80;
    if (ageInYears >= 2) return 60;
    if (ageInYears >= 1) return 40;
    if (ageInYears >= 0.5) return 20;
    return 10;
  }

  private calculateActiveStatusScore(status: string): number {
    switch (status) {
      case 'VERIFIED': return 100;
      case 'ACTIVE': return 80;
      case 'INACTIVE': return 20;
      case 'SUSPENDED': return 0;
      default: return 50;
    }
  }

  private calculateCertificationScore(certs: { status: string; expiresAt: Date | null }[]): number {
    if (certs.length === 0) return 0;

    const activeCerts = certs.filter((c) => c.status === 'APPROVED' || c.status === 'PENDING');
    const expiredCerts = certs.filter((c) => c.status === 'EXPIRED' || (c.expiresAt && c.expiresAt < new Date()));

    const activeRatio = certs.length > 0 ? activeCerts.length / certs.length : 0;
    const expiredPenalty = expiredCerts.length * 15;

    const baseScore = Math.round(activeRatio * 100);
    return Math.max(0, baseScore - expiredPenalty);
  }

  private calculateOnboardingScore(onboardingCompletedAt: Date | null): number {
    return onboardingCompletedAt ? 100 : 0;
  }
}
