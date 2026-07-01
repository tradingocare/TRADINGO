import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GocashService } from '../gocash/gocash.service';
import * as crypto from 'crypto';
import { ReferralCodeType, ReferralBlacklistType } from '@prisma/client';

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.com',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', '10minutemail.com',
];

@Injectable()
export class ReferralService {
  private readonly REFERRAL_CODE_LENGTH = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gocashService: GocashService,
  ) {}

  async createReferralCode(dto: {
    userId: string;
    companyId?: string;
    type: ReferralCodeType;
    rewardAmount?: number;
    rewardType?: string;
    maxUsage?: number;
    expiresAt?: string;
  }) {
    const code = await this.generateUniqueCode();
    const data: any = {
      code,
      userId: dto.userId,
      type: dto.type,
      status: 'ACTIVE',
      createdBy: dto.userId,
      currentUsage: 0,
    };
    if (dto.companyId) data.companyId = dto.companyId;
    if (dto.rewardAmount != null) data.rewardAmount = dto.rewardAmount;
    if (dto.rewardType) data.rewardType = dto.rewardType;
    if (dto.maxUsage != null) data.maxUsage = dto.maxUsage;
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);

    const referralCode = await this.prisma.referralCode.create({ data });

    await this.audit(null, 'CREATED', `Referral code ${code} created`, dto.userId);

    return referralCode;
  }

  async getReferralCode(code: string) {
    const referralCode = await this.prisma.referralCode.findUnique({ where: { code } });
    if (!referralCode) throw new NotFoundException('Referral code not found');
    return referralCode;
  }

  async getMyReferralCode(userId: string, type?: ReferralCodeType) {
    const where: any = { userId, status: 'ACTIVE' };
    if (type) where.type = type;
    return this.prisma.referralCode.findFirst({ where, orderBy: { createdAt: 'desc' } });
  }

  async listMyReferralCodes(userId: string) {
    return this.prisma.referralCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateReferral(dto: {
    code: string;
    refereeEmail?: string;
    ipAddress?: string;
    deviceId?: string;
  }) {
    const referralCode = await this.prisma.referralCode.findUnique({ where: { code: dto.code } });
    if (!referralCode) return { valid: false, reason: 'Referral code not found' };
    if (referralCode.status !== 'ACTIVE') return { valid: false, reason: `Referral code is ${referralCode.status.toLowerCase()}` };
    if (referralCode.expiresAt && new Date() > referralCode.expiresAt) return { valid: false, reason: 'Referral code has expired' };
    if (referralCode.maxUsage > 0 && referralCode.currentUsage >= referralCode.maxUsage) {
      return { valid: false, reason: 'Referral code has reached maximum usage' };
    }
    if (dto.refereeEmail) {
      const domain = dto.refereeEmail.split('@')[1]?.toLowerCase();
      if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
        return { valid: false, reason: 'Disposable email domains not allowed' };
      }
    }

    return { valid: true, referralCode };
  }

  async applyReferral(dto: {
    code: string;
    refereeUserId?: string;
    refereeEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    source?: string;
  }) {
    const validation = await this.validateReferral(dto);
    if (!validation.valid) throw new BadRequestException(validation.reason);
    const referralCode = validation.referralCode!;

    if (dto.refereeUserId && dto.refereeUserId === referralCode.userId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    const email = dto.refereeEmail || '';
    if (email) {
      const existing = await this.prisma.referralUsage.findFirst({
        where: { refereeEmail: email, status: { in: ['PENDING', 'COMPLETED', 'REWARDED'] } },
      });
      if (existing) throw new ConflictException('This email has already been referred');
    }

    if (dto.ipAddress) {
      const blacklisted = await this.prisma.referralBlacklist.findFirst({
        where: { type: 'IP', value: dto.ipAddress },
      });
      if (blacklisted) throw new ForbiddenException('Referral from this IP is blocked');
    }
    if (dto.deviceId) {
      const blacklisted = await this.prisma.referralBlacklist.findFirst({
        where: { type: 'DEVICE', value: dto.deviceId },
      });
      if (blacklisted) throw new ForbiddenException('Referral from this device is blocked');
    }
    if (email) {
      const domain = email.split('@')[1];
      if (domain) {
        const blacklisted = await this.prisma.referralBlacklist.findFirst({
          where: { type: 'EMAIL_DOMAIN', value: domain },
        });
        if (blacklisted) throw new ForbiddenException('Email domain is blocked');
      }
      const blacklisted = await this.prisma.referralBlacklist.findFirst({
        where: { type: 'EMAIL', value: email },
      });
      if (blacklisted) throw new ForbiddenException('Email is blocked');
    }

    const velocityCheck = await this.checkReferralVelocity(dto.ipAddress, dto.deviceId);
    if (!velocityCheck.allowed) {
      throw new BadRequestException('Too many referrals from this source. Please try later.');
    }

    const usage = await this.prisma.referralUsage.create({
      data: {
        codeId: referralCode.id,
        referrerUserId: referralCode.userId,
        refereeUserId: dto.refereeUserId ?? null,
        refereeEmail: email,
        status: 'COMPLETED',
        source: dto.source ?? 'SIGNUP',
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
        deviceId: dto.deviceId ?? null,
        completedAt: new Date(),
      },
    });

    await this.prisma.referralCode.update({
      where: { id: referralCode.id },
      data: { currentUsage: { increment: 1 } },
    });

    await this.audit(usage.id, 'APPLIED', `Referral code ${dto.code} applied by ${email}`, dto.refereeUserId ?? null);

    try {
      await this.processReferralReward(usage, referralCode);
    } catch (error) {
      await this.audit(usage.id, 'FAILED', `Reward processing failed: ${(error as Error).message}`, null);
    }

    return usage;
  }

  private async processReferralReward(usage: any, referralCode: any) {
    const referrerWallet = await this.prisma.gOCASH_Wallet.findUnique({
      where: { userId: referralCode.userId },
    });
    if (!referrerWallet) {
      await this.audit(usage.id, 'FAILED', 'Referrer has no GOCASH wallet', null);
      return;
    }

    const rewardAmount = Number(referralCode.rewardAmount ?? 0);
    if (rewardAmount <= 0) return;

    const idempotencyKey = `REFERRAL_${usage.id}_REFERRER`;

    const existingReward = await this.prisma.referralReward.findFirst({
      where: { usageId: usage.id, type: 'REFERRER', status: 'PAID' },
    });
    if (existingReward) return;

    const ledgerEntry = await this.gocashService.credit({
      walletId: referrerWallet.id,
      amount: rewardAmount,
      type: 'REFERRAL_REWARD',
      reason: `Referral reward for ${usage.refereeEmail || usage.refereeUserId}`,
      actorId: 'SYSTEM',
      actorType: 'SYSTEM',
      referenceId: usage.id,
      referenceType: 'REFERRAL_USAGE',
      sourceType: 'REFERRAL',
      sourceSystem: 'REFERRAL_ENGINE',
      idempotencyKey,
    });

    await this.prisma.referralReward.create({
      data: {
        usageId: usage.id,
        referrerUserId: referralCode.userId,
        refereeUserId: usage.refereeUserId ?? null,
        amount: rewardAmount,
        type: 'REFERRER',
        status: 'PAID',
        transactionId: ledgerEntry.id,
        paidAt: new Date(),
      },
    });

    await this.prisma.referralUsage.update({
      where: { id: usage.id },
      data: { status: 'REWARDED' },
    });

    await this.audit(usage.id, 'REWARDED', `Referrer rewarded ${rewardAmount} GOCASH`, referralCode.userId);
  }

  async getReferralHistory(userId: string) {
    const codes = await this.prisma.referralCode.findMany({
      where: { userId },
      select: { id: true },
    });
    const codeIds = codes.map((c) => c.id);

    const usages = await this.prisma.referralUsage.findMany({
      where: { codeId: { in: codeIds } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const rewards = await this.prisma.referralReward.findMany({
      where: { referrerUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { usages, rewards, codes };
  }

  async getReferralStatistics(userId: string) {
    const codes = await this.prisma.referralCode.findMany({
      where: { userId },
      select: { id: true, code: true, currentUsage: true, maxUsage: true, status: true },
    });
    const codeIds = codes.map((c) => c.id);

    const [totalReferrals, rewardedCount, failedCount, totalRewards] = await Promise.all([
      this.prisma.referralUsage.count({ where: { codeId: { in: codeIds } } }),
      this.prisma.referralUsage.count({ where: { codeId: { in: codeIds }, status: 'REWARDED' } }),
      this.prisma.referralUsage.count({ where: { codeId: { in: codeIds }, status: { in: ['FAILED', 'REJECTED'] } } }),
      this.prisma.referralReward.aggregate({
        where: { referrerUserId: userId, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCodes: codes.length,
      activeCodes: codes.filter((c) => c.status === 'ACTIVE').length,
      totalReferrals,
      rewardedCount,
      failedCount,
      totalRewardsEarned: totalRewards._sum.amount ?? 0,
      codes,
    };
  }

  async adminGetDashboard() {
    const [totalCodes, activeCodes, totalUsages, totalRewards, fraudCount] = await Promise.all([
      this.prisma.referralCode.count(),
      this.prisma.referralCode.count({ where: { status: 'ACTIVE' } }),
      this.prisma.referralUsage.count(),
      this.prisma.referralReward.aggregate({ _sum: { amount: true } }),
      this.prisma.referralBlacklist.count(),
    ]);

    const topReferrers = await this.prisma.referralCode.groupBy({
      by: ['userId'],
      _sum: { currentUsage: true },
      orderBy: { _sum: { currentUsage: 'desc' } },
      take: 10,
    });

    return {
      totalCodes,
      activeCodes,
      totalUsages,
      totalRewardsPaid: totalRewards._sum.amount ?? 0,
      blacklistedEntries: fraudCount,
      topReferrers,
    };
  }

  async adminListReferrals(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { refereeEmail: { contains: query.search, mode: 'insensitive' } },
        { code: { code: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.referralUsage.findMany({
        where,
        include: { code: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.referralUsage.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminGetBlacklist() {
    return this.prisma.referralBlacklist.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminAddToBlacklist(dto: { type: string; value: string; reason?: string; expiresAt?: string; createdBy: string }) {
    const existing = await this.prisma.referralBlacklist.findFirst({
      where: { type: dto.type as ReferralBlacklistType, value: dto.value },
    });
    if (existing) throw new ConflictException('Entry already exists in blacklist');

    const data: any = {
      type: dto.type as ReferralBlacklistType,
      value: dto.value,
      reason: dto.reason ?? null,
      createdBy: dto.createdBy,
    };
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);

    const entry = await this.prisma.referralBlacklist.create({ data });
    await this.audit(null, 'BLACKLISTED', `${dto.type}: ${dto.value}`, dto.createdBy);
    return entry;
  }

  async adminRemoveFromBlacklist(id: string) {
    const entry = await this.prisma.referralBlacklist.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Blacklist entry not found');
    await this.prisma.referralBlacklist.delete({ where: { id } });
    return { success: true };
  }

  async getReferralAudit(usageId?: string) {
    const where: any = {};
    if (usageId) where.usageId = usageId;
    return this.prisma.referralAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async adminGetFraudAlerts() {
    const alerts: string[] = [];

    const selfReferrals = await this.checkSelfReferralPatterns();
    if (selfReferrals.length > 0) alerts.push(`Self-referral detected: ${selfReferrals.length} cases`);

    const velocityAlerts = await this.checkAbnormalVelocity();
    if (velocityAlerts.length > 0) alerts.push(`Abnormal referral velocity: ${velocityAlerts.length} sources`);

    const circularAlerts = await this.checkCircularReferrals();
    if (circularAlerts.length > 0) alerts.push(`Circular referral pattern: ${circularAlerts.length} pairs`);

    return { alerts, details: { selfReferrals, velocityAlerts, circularAlerts } };
  }

  private async checkSelfReferralPatterns() {
    const usages = await this.prisma.referralUsage.findMany({
      where: { status: 'COMPLETED' },
      include: { code: true },
      take: 500,
    });
    return usages.filter((u) => u.code.userId === u.refereeUserId).map((u) => u.id);
  }

  private async checkAbnormalVelocity(): Promise<string[]> {
    const recent = new Date();
    recent.setHours(recent.getHours() - 1);

    const countByIP = await this.prisma.referralUsage.groupBy({
      by: ['ipAddress'],
      where: { referredAt: { gte: recent }, ipAddress: { not: null } },
      _count: { id: true },
    });

    return countByIP.filter((c) => c._count.id > 5).map((c) => c.ipAddress!);
  }

  private async checkCircularReferrals(): Promise<Array<{ referrer: string; referee: string }>> {
    const usages = await this.prisma.referralUsage.findMany({
      where: { status: { in: ['COMPLETED', 'REWARDED'] } },
      include: { code: true },
      take: 1000,
    });

    const pairs: Array<{ referrer: string; referee: string }> = [];
    for (const a of usages) {
      for (const b of usages) {
        if (a.id === b.id) continue;
        if (a.code.userId === b.refereeUserId && b.code.userId === a.refereeUserId) {
          pairs.push({ referrer: a.code.userId, referee: b.code.userId! });
        }
      }
    }
    return pairs;
  }

  private async checkReferralVelocity(ipAddress?: string, deviceId?: string) {
    const recent = new Date();
    recent.setMinutes(recent.getMinutes() - 10);

    const recentCount = await this.prisma.referralUsage.count({
      where: {
        referredAt: { gte: recent },
        ...(ipAddress ? { ipAddress } : {}),
        ...(deviceId ? { deviceId } : {}),
      },
    });

    return { allowed: recentCount < 3, count: recentCount };
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = 'TRAD' + crypto.randomBytes(5).toString('hex').toUpperCase();
      const exists = await this.prisma.referralCode.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new Error('Failed to generate unique referral code after 10 attempts');
  }

  private async audit(usageId: string | null, action: string, details: string, actorId: string | null) {
    await this.prisma.referralAudit.create({
      data: {
        usageId,
        action,
        details,
        actorId,
      },
    }).catch(() => {});
  }
}
