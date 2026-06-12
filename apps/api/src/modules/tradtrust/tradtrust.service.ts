import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const MAX_SCORE = 100;

const WEIGHTS = {
  verificationLevel: 30,
  profileCompletion: 25,
  companyAge: 15,
  activeStatus: 10,
  certifications: 10,
  onboarding: 10,
};

@Injectable()
export class TradTrustService {
  private readonly logger = new Logger(TradTrustService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateScore(companyId: string): Promise<number> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: {
        locations: { where: { deletedAt: null } },
        categories: true,
        owners: true,
        certificationDocs: { select: { status: true, expiresAt: true } },
      },
    });

    if (!company) {
      this.logger.warn(`Company ${companyId} not found for score calculation`);
      return 0;
    }

    const certificationScore = this.calculateCertificationScore(company.certificationDocs);
    const onboardingScore = this.calculateOnboardingScore(company.onboardingCompletedAt);

    const factors = {
      verificationLevelScore: this.calculateVerificationLevelScore(company.verificationLevel),
      profileCompletionScore: this.calculateProfileCompletionScore(company),
      companyAgeScore: this.calculateCompanyAgeScore(company.createdAt),
      activeStatusScore: this.calculateActiveStatusScore(company.status),
      certificationScore,
      onboardingScore,
    };

    const totalScore = Math.round(
      (factors.verificationLevelScore * WEIGHTS.verificationLevel +
        factors.profileCompletionScore * WEIGHTS.profileCompletion +
        factors.companyAgeScore * WEIGHTS.companyAge +
        factors.activeStatusScore * WEIGHTS.activeStatus +
        factors.certificationScore * WEIGHTS.certifications +
        factors.onboardingScore * WEIGHTS.onboarding) / MAX_SCORE,
    );

    const finalScore = Math.max(0, Math.min(MAX_SCORE, totalScore));

    await this.prisma.tradTrustScore.create({
      data: {
        companyId,
        score: finalScore,
        factors: factors as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: { trustScore: finalScore, updatedBy: company.createdBy },
    });

    this.logger.log(`TradTrust score for company ${companyId}: ${finalScore}`);
    return finalScore;
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
