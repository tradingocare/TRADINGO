import { Injectable, Logger, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VendorCodesService {
  private readonly logger = new Logger(VendorCodesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getCurrentPeriod(): string {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `${mm}${yy}`;
  }

  async generateVendorCode(companyId: string): Promise<string> {
    const prefix = 'TRV';
    const period = this.getCurrentPeriod();
    const seq = await this.getNextSequence(prefix, period);
    const code = `${prefix}${period}${String(seq).padStart(4, '0')}`;

    await this.prisma.company.update({
      where: { id: companyId },
      data: { vendorCode: code },
    });

    await this.ensureAttributionRecord(code, 'VENDOR');
    return code;
  }

  async generateRmCode(userId: string): Promise<string> {
    const prefix = 'TRM';
    const period = this.getCurrentPeriod();
    const seq = await this.getNextSequence(prefix, period);
    const code = `${prefix}${period}${String(seq).padStart(4, '0')}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { rmCode: code },
    });

    await this.ensureAttributionRecord(code, 'RM', userId);
    return code;
  }

  async generateMeCode(userId: string): Promise<string> {
    const prefix = 'TME';
    const period = this.getCurrentPeriod();
    const seq = await this.getNextSequence(prefix, period);
    const code = `${prefix}${period}${String(seq).padStart(4, '0')}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { meCode: code },
    });

    await this.ensureAttributionRecord(code, 'ME', undefined, userId);
    return code;
  }

  async getCompanyByVendorCode(vendorCode: string) {
    return this.prisma.company.findUnique({ where: { vendorCode } });
  }

  async getUserByCode(code: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ rmCode: code }, { meCode: code }],
      },
    });
  }

  async getCodeOwner(code: string) {
    const company = await this.prisma.company.findUnique({ where: { vendorCode: code } });
    if (company) return { type: 'VENDOR' as const, companyId: company.id, name: company.name };

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ rmCode: code }, { meCode: code }],
      },
    });
    if (user) {
      const codeType = user.rmCode === code ? 'RM' : 'ME';
      return { type: codeType as 'RM' | 'ME', userId: user.id, name: user.name };
    }

    return null;
  }

  async trackAttribution(
    code: string,
    data: {
      leadCount?: number;
      revenueAttribution?: number;
      sellerCount?: number;
      buyerCount?: number;
      commissionAmount?: number;
    },
  ) {
    const attribution = await this.prisma.codeAttribution.findUnique({ where: { code } });
    if (!attribution) return;

    await this.prisma.codeAttribution.update({
      where: { code },
      data: {
        leadCount: data.leadCount !== undefined ? attribution.leadCount + data.leadCount : undefined,
        revenueAttribution:
          data.revenueAttribution !== undefined
            ? Number(attribution.revenueAttribution) + data.revenueAttribution
            : undefined,
        sellerCount:
          data.sellerCount !== undefined ? attribution.sellerCount + data.sellerCount : undefined,
        buyerCount:
          data.buyerCount !== undefined ? attribution.buyerCount + data.buyerCount : undefined,
        commissionAmount:
          data.commissionAmount !== undefined
            ? Number(attribution.commissionAmount) + data.commissionAmount
            : undefined,
      },
    });
  }

  async getAttribution(code: string) {
    return this.prisma.codeAttribution.findUnique({ where: { code } });
  }

  async assignReferral(companyId: string, referralCode: string) {
    const owner = await this.getCodeOwner(referralCode);
    if (!owner) throw new ConflictException('Invalid referral code');

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true, onboardedByCode: true, owners: { select: { userId: true } }, createdBy: true, referralRewardedAt: true },
    });
    if (!company) throw new ConflictException('Company not found');

    if (company.onboardedByCode) {
      throw new ConflictException('Company already has a referral code assigned');
    }

    if (company.referralRewardedAt) {
      throw new ConflictException('Referral already rewarded');
    }

    const companyOwnerIds = company.owners.map((o) => o.userId);
    if (owner.type !== 'VENDOR' && owner.userId) {
      if (companyOwnerIds.includes(owner.userId) || company.createdBy === owner.userId) {
        throw new ForbiddenException('Self-referral is not allowed');
      }
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: { onboardedByCode: referralCode },
    });

    return owner;
  }

  async rewardReferral(companyId: string, trigger: 'KYC_COMPLETED' | 'PLAN_PURCHASED'): Promise<boolean> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true, onboardedByCode: true, referralRewardedAt: true, goCashBalance: true },
    });
    if (!company?.onboardedByCode || company.referralRewardedAt) return false;

    await this.prisma.company.update({
      where: { id: companyId },
      data: { referralRewardedAt: new Date() },
    });

    await this.trackAttribution(company.onboardedByCode, { sellerCount: 1 });

    const owner = await this.getCodeOwner(company.onboardedByCode);
    if (owner?.type === 'RM' || owner?.type === 'ME') {
      await this.prisma.goCashTransaction.create({
        data: {
          companyId,
          type: 'REFERRAL',
          amount: 200,
          balanceBefore: company.goCashBalance,
          balanceAfter: company.goCashBalance + 200,
          reason: `REFERRAL_REWARD_${trigger}`,
          sourceModule: 'REFERRAL',
        },
      });
      await this.prisma.company.update({
        where: { id: companyId },
        data: { goCashBalance: company.goCashBalance + 200 },
      });
    }

    this.logger.log(`Referral rewarded for company ${companyId} via ${trigger}`);
    return true;
  }

  private async getNextSequence(prefix: string, period: string): Promise<number> {
    const result = await this.prisma.vendorCodeSequence.upsert({
      where: { prefix_period: { prefix, period } },
      create: { prefix, period, sequence: 1 },
      update: { sequence: { increment: 1 } },
    });
    return result.sequence;
  }

  private async ensureAttributionRecord(code: string, codeType: string, rmUserId?: string, meUserId?: string) {
    const exists = await this.prisma.codeAttribution.findUnique({ where: { code } });
    if (!exists) {
      await this.prisma.codeAttribution.create({
        data: { code, codeType, rmOwnerId: rmUserId, meOwnerId: meUserId },
      });
    }
  }
}
