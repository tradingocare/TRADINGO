import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface ProfileFactor {
  label: string;
  key: string;
  weight: number;
  fulfilled: boolean;
}

@Injectable()
export class ProfileCompletionService {
  private readonly logger = new Logger(ProfileCompletionService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly factors: Omit<ProfileFactor, 'fulfilled'>[] = [
    { label: 'Logo', key: 'logo', weight: 10 },
    { label: 'Banner', key: 'banner', weight: 5 },
    { label: 'GST Number', key: 'gstNumber', weight: 15 },
    { label: 'PAN Number', key: 'panNumber', weight: 10 },
    { label: 'Products', key: 'products', weight: 15 },
    { label: 'Categories', key: 'categories', weight: 10 },
    { label: 'Location', key: 'location', weight: 10 },
    { label: 'Bank Account', key: 'bankAccount', weight: 10 },
    { label: 'Certifications', key: 'certifications', weight: 5 },
    { label: 'Contact Details', key: 'contactDetails', weight: 5 },
    { label: 'Business Description', key: 'description', weight: 5 },
  ];

  async calculateAndStore(companyId: string, userId?: string): Promise<number> {
    const result = await this.calculate(companyId);
    if (result.percentage !== undefined) {
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          profileCompletionPercentage: result.percentage,
          updatedBy: userId,
        },
      });
    }
    return result.percentage ?? 0;
  }

  async calculate(companyId: string): Promise<{ percentage: number; factors: ProfileFactor[] }> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: {
        products: { where: { deletedAt: null }, take: 1, select: { id: true } },
        categories: { take: 1, select: { categoryId: true } },
        locations: { where: { deletedAt: null }, take: 1, select: { id: true } },
        certificationDocs: { where: { status: 'APPROVED' }, take: 1, select: { id: true } },
      },
    });

    if (!company) {
      return { percentage: 0, factors: [] };
    }

    const hasGst = !!company.gstNumber;
    const hasPan = !!company.panNumber;
    const hasLogo = !!company.logo;
    const hasBanner = !!company.banner;
    const hasDescription = !!company.description;
    const hasProducts = company.products.length > 0;
    const hasCategories = company.categories.length > 0;
    const hasLocation = company.locations.length > 0;
    const hasCertifications = company.certificationDocs.length > 0;
    const hasContact = !!(company.email || company.mobile || company.website);

    const factors: ProfileFactor[] = [
      { label: 'Logo', key: 'logo', weight: 10, fulfilled: hasLogo },
      { label: 'Banner', key: 'banner', weight: 5, fulfilled: hasBanner },
      { label: 'GST Number', key: 'gstNumber', weight: 15, fulfilled: hasGst },
      { label: 'PAN Number', key: 'panNumber', weight: 10, fulfilled: hasPan },
      { label: 'Products', key: 'products', weight: 15, fulfilled: hasProducts },
      { label: 'Categories', key: 'categories', weight: 10, fulfilled: hasCategories },
      { label: 'Location', key: 'location', weight: 10, fulfilled: hasLocation },
      { label: 'Bank Account', key: 'bankAccount', weight: 10, fulfilled: hasGst && hasPan },
      { label: 'Certifications', key: 'certifications', weight: 5, fulfilled: hasCertifications },
      { label: 'Contact Details', key: 'contactDetails', weight: 5, fulfilled: hasContact },
      { label: 'Business Description', key: 'description', weight: 5, fulfilled: hasDescription },
    ];

    const percentage = factors.reduce((sum, f) => sum + (f.fulfilled ? f.weight : 0), 0);
    return { percentage, factors };
  }

  async getDetails(companyId: string) {
    const { percentage, factors } = await this.calculate(companyId);
    return { percentage, factors, totalWeight: 100 };
  }

  async rewardProfileCompletion(companyId: string, userId: string): Promise<boolean> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: { products: { where: { deletedAt: null }, take: 1, select: { id: true } } },
    });
    if (!company) return false;

    const isComplete = company.profileCompletionPercentage >= 100;
    const hasProducts = company.products.length > 0;
    const kycComplete = company.verificationLevel !== 'LEVEL_0';

    if (!isComplete || !hasProducts || !kycComplete) return false;

    const existingReward = await this.prisma.goCashTransaction.findFirst({
      where: { companyId, type: 'EARNED', reason: 'PROFILE_COMPLETION_REWARD' },
    });
    if (existingReward) return false;

    await this.prisma.goCashTransaction.create({
      data: {
        companyId,
        userId,
        type: 'EARNED',
        amount: 500,
        balanceBefore: company.goCashBalance,
        balanceAfter: company.goCashBalance + 500,
        reason: 'PROFILE_COMPLETION_REWARD',
        sourceModule: 'PROFILE_COMPLETION',
      },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: { goCashBalance: company.goCashBalance + 500 },
    });

    return true;
  }
}
