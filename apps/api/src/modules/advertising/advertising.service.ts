import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GocashService } from '../gocash/gocash.service';
import { MembershipService } from '../membership/membership.service';
import { CreateAdvertisingDto, UpdateAdvertisingDto, QueryAdvertisingDto } from './dto';
import { AdType, AdStatus, Prisma } from '@prisma/client';

const MEMBERSHIP_DISCOUNT_RATES: Record<string, number> = {
  trade_smart: 0.10,
  trade_plus: 0.15,
  trade_pro: 0.20,
  trade_premium: 0.25,
  trade_elite: 0.30,
  'trade-smart-launch': 0.10,
};

@Injectable()
export class AdvertisingService {
  private readonly logger = new Logger(AdvertisingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gocashService: GocashService,
    private readonly membershipService: MembershipService,
  ) {}

  async create(dto: CreateAdvertisingDto, companyId: string, _userId: string) {
    const subscription = await this.membershipService.getCurrentSubscription(companyId);
    const planSlug = subscription.subscriptionPlan?.toLowerCase() || '';
    const discountRate = MEMBERSHIP_DISCOUNT_RATES[planSlug] || 0;
    const effectiveCpc = dto.cpc ? Math.round(dto.cpc * (1 - discountRate) * 100) / 100 : undefined;
    const effectiveCpm = dto.cpm ? Math.round(dto.cpm * (1 - discountRate) * 100) / 100 : undefined;
    const effectiveFixedPrice = dto.fixedPrice ? Math.round(dto.fixedPrice * (1 - discountRate) * 100) / 100 : undefined;

    const ad = await this.prisma.advertisement.create({
      data: {
        companyId,
        type: dto.type,
        pricingModel: dto.pricingModel,
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        targetUrl: dto.targetUrl,
        dailyBudget: new Prisma.Decimal(dto.dailyBudget),
        totalBudget: new Prisma.Decimal(dto.totalBudget),
        cpc: effectiveCpc ? new Prisma.Decimal(effectiveCpc) : undefined,
        cpm: effectiveCpm ? new Prisma.Decimal(effectiveCpm) : undefined,
        fixedPrice: effectiveFixedPrice ? new Prisma.Decimal(effectiveFixedPrice) : undefined,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        autoPause: dto.autoPause ?? false,
        autoResume: dto.autoResume ?? false,
        autoStop: dto.autoStop ?? false,
        productId: dto.productId,
        categoryId: dto.categoryId,
        keyword: dto.keyword,
        city: dto.city,
        brandId: dto.brandId,
        priority: dto.priority ?? 0,
        metadata: dto.metadata ? { ...dto.metadata, discountRate, planSlug } : { discountRate, planSlug },
        targets: dto.targets?.length ? {
          create: dto.targets.map(t => ({ targetType: t.targetType, targetValue: t.targetValue })),
        } : undefined,
      },
      include: { targets: true },
    });

    return ad;
  }

  async findAll(query: QueryAdvertisingDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.AdvertisementWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.companyId) where.companyId = query.companyId;

    const orderBy: Prisma.AdvertisementOrderByWithRelationInput = {};
    if (query.sortBy) {
      orderBy[query.sortBy as keyof Prisma.AdvertisementOrderByWithRelationInput] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.advertisement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { company: { select: { id: true, name: true, slug: true, logo: true } }, targets: true },
      }),
      this.prisma.advertisement.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async findMyAds(companyId: string, query: QueryAdvertisingDto) {
    return this.findAll({ ...query, companyId });
  }

  async findById(id: string) {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true, slug: true, logo: true } }, targets: true, analytics: { orderBy: { date: 'desc' }, take: 90 } },
    });
    if (!ad) throw new NotFoundException('Advertisement not found');
    return ad;
  }

  async update(id: string, dto: UpdateAdvertisingDto) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (ad.status === AdStatus.ACTIVE || ad.status === AdStatus.COMPLETED || ad.status === AdStatus.EXPIRED) {
      throw new BadRequestException('Cannot update an active, completed, or expired advertisement');
    }

    const updateData: Prisma.AdvertisementUpdateInput = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.targetUrl !== undefined) updateData.targetUrl = dto.targetUrl;
    if (dto.dailyBudget !== undefined) updateData.dailyBudget = new Prisma.Decimal(dto.dailyBudget);
    if (dto.totalBudget !== undefined) updateData.totalBudget = new Prisma.Decimal(dto.totalBudget);
    if (dto.cpc !== undefined) updateData.cpc = new Prisma.Decimal(dto.cpc);
    if (dto.cpm !== undefined) updateData.cpm = new Prisma.Decimal(dto.cpm);
    if (dto.fixedPrice !== undefined) updateData.fixedPrice = new Prisma.Decimal(dto.fixedPrice);
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.autoPause !== undefined) updateData.autoPause = dto.autoPause;
    if (dto.autoResume !== undefined) updateData.autoResume = dto.autoResume;
    if (dto.autoStop !== undefined) updateData.autoStop = dto.autoStop;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata as any;

    if (dto.targets) {
      await this.prisma.adTarget.deleteMany({ where: { advertisementId: id } });
      updateData.targets = {
        create: dto.targets.map(t => ({ targetType: t.targetType, targetValue: t.targetValue })),
      };
    }

    return this.prisma.advertisement.update({ where: { id }, data: updateData, include: { targets: true } });
  }

  async delete(id: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (ad.status === AdStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active advertisement. Stop it first.');
    }
    return this.prisma.advertisement.update({ where: { id }, data: { status: AdStatus.CANCELLED } });
  }

  async pause(id: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (ad.status !== AdStatus.ACTIVE) throw new BadRequestException('Only active advertisements can be paused');
    return this.prisma.advertisement.update({ where: { id }, data: { status: AdStatus.PAUSED } });
  }

  async resume(id: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (ad.status !== AdStatus.PAUSED) throw new BadRequestException('Only paused advertisements can be resumed');
    return this.prisma.advertisement.update({ where: { id }, data: { status: AdStatus.ACTIVE } });
  }

  async stop(id: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (ad.status === AdStatus.COMPLETED || ad.status === AdStatus.EXPIRED) {
      throw new BadRequestException('Advertisement already finished');
    }
    return this.prisma.advertisement.update({ where: { id }, data: { status: AdStatus.CANCELLED } });
  }

  async approve(id: string, adminId: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (ad.status !== AdStatus.PENDING_REVIEW) throw new BadRequestException('Advertisement is not pending review');
    if (Number(ad.totalBudget) <= 0) throw new BadRequestException('Cannot approve advertisement without budget');

    return this.prisma.advertisement.update({
      where: { id },
      data: { status: AdStatus.ACTIVE, approvedBy: adminId, approvedAt: new Date() },
    });
  }

  async reject(id: string, reason: string, adminId: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (ad.status !== AdStatus.PENDING_REVIEW) throw new BadRequestException('Advertisement is not pending review');
    if (!reason) throw new BadRequestException('Rejection reason is required');

    return this.prisma.advertisement.update({
      where: { id },
      data: { status: AdStatus.REJECTED, rejectedReason: reason, approvedBy: adminId, approvedAt: new Date() },
    });
  }

  async fund(id: string, amount: number, userId: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (ad.status === AdStatus.COMPLETED || ad.status === AdStatus.EXPIRED || ad.status === AdStatus.CANCELLED) {
      throw new BadRequestException('Cannot fund a finished advertisement');
    }

    const wallet = await this.gocashService.getWalletByUserId(userId);
    if (!wallet) throw new NotFoundException('GOCASH wallet not found');

    const balance = await this.gocashService.getBalance(wallet.id);
    if (Number(balance.currentBalance) < amount) throw new BadRequestException('Insufficient GOCASH balance');

    const idempotencyKey = `AD_FUND_${id}_${userId}_${Date.now()}`;
    await this.gocashService.debit({
      walletId: wallet.id,
      amount,
      type: 'MANUAL_DEBIT' as any,
      reason: `Funding advertisement: ${ad.title || ad.type}`,
      actorId: userId,
      actorType: 'USER',
      referenceId: id,
      referenceType: 'ADVERTISEMENT',
      idempotencyKey,
    });

    const currentSpent = Number(ad.spentBudget);
    const currentTotal = Number(ad.totalBudget);
    const newSpent = Math.max(0, currentSpent);
    const newTotal = currentTotal + amount;

    const updated = await this.prisma.advertisement.update({
      where: { id },
      data: {
        totalBudget: new Prisma.Decimal(newTotal),
        spentBudget: new Prisma.Decimal(newSpent),
        status: ad.status === AdStatus.DRAFT ? AdStatus.PENDING_REVIEW : ad.status,
      },
    });

    return updated;
  }

  async getAdminDashboard() {
    const [total, active, pending, paused, expired, completed, rejected, campaigns, totalSpend] = await Promise.all([
      this.prisma.advertisement.count(),
      this.prisma.advertisement.count({ where: { status: AdStatus.ACTIVE } }),
      this.prisma.advertisement.count({ where: { status: AdStatus.PENDING_REVIEW } }),
      this.prisma.advertisement.count({ where: { status: AdStatus.PAUSED } }),
      this.prisma.advertisement.count({ where: { status: AdStatus.EXPIRED } }),
      this.prisma.advertisement.count({ where: { status: AdStatus.COMPLETED } }),
      this.prisma.advertisement.count({ where: { status: AdStatus.REJECTED } }),
      this.prisma.advertisement.groupBy({ by: ['type'], _count: true, where: { status: AdStatus.ACTIVE } }),
      this.prisma.advertisement.aggregate({ _sum: { spentBudget: true } }),
    ]);

    const totalImpressions = await this.prisma.adAnalytics.aggregate({ _sum: { impressions: true } });
    const totalClicks = await this.prisma.adAnalytics.aggregate({ _sum: { clicks: true } });

    return {
      total,
      active,
      pending,
      paused,
      expired,
      completed,
      rejected,
      totalSpend: Number(totalSpend._sum.spentBudget || 0),
      totalImpressions: Number(totalImpressions._sum.impressions || 0),
      totalClicks: Number(totalClicks._sum.clicks || 0),
      byType: campaigns.map(c => ({ type: c.type, count: c._count })),
    };
  }

  async getSellerDashboard(companyId: string) {
    const [total, active, paused, completed, ads, analytics] = await Promise.all([
      this.prisma.advertisement.count({ where: { companyId } }),
      this.prisma.advertisement.count({ where: { companyId, status: AdStatus.ACTIVE } }),
      this.prisma.advertisement.count({ where: { companyId, status: AdStatus.PAUSED } }),
      this.prisma.advertisement.count({ where: { companyId, status: AdStatus.COMPLETED } }),
      this.prisma.advertisement.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 10, include: { targets: true } }),
      this.prisma.advertisement.aggregate({ where: { companyId }, _sum: { spentBudget: true, impressions: true, clicks: true } }),
    ]);

    return {
      total,
      active,
      paused,
      completed,
      totalSpend: Number(analytics._sum.spentBudget || 0),
      totalImpressions: Number(analytics._sum.impressions || 0),
      totalClicks: Number(analytics._sum.clicks || 0),
      ctr: Number(analytics._sum.impressions) > 0
        ? (Number(analytics._sum.clicks) / Number(analytics._sum.impressions) * 100).toFixed(2)
        : '0.00',
      recentAds: ads,
    };
  }

  async getPlacements(type: AdType, limit = 10) {
    const now = new Date();
    const ads = await this.prisma.advertisement.findMany({
      where: {
        type,
        status: AdStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
        totalBudget: { gt: 0 },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: { company: { select: { id: true, name: true, slug: true, logo: true } }, targets: true },
    });
    return ads;
  }

  async getAnalytics(id: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');

    const daily = await this.prisma.adAnalytics.findMany({
      where: { advertisementId: id },
      orderBy: { date: 'asc' },
    });

    const totalImpressions = daily.reduce((s, a) => s + a.impressions, 0);
    const totalClicks = daily.reduce((s, a) => s + a.clicks, 0);
    const totalSpend = daily.reduce((s, a) => s + Number(a.spend), 0);
    const totalConversions = daily.reduce((s, a) => s + a.conversions, 0);

    return {
      daily,
      summary: {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: totalImpressions > 0 ? Number((totalClicks / totalImpressions * 100).toFixed(2)) : 0,
        spend: totalSpend,
        conversions: totalConversions,
        cpc: totalClicks > 0 ? Number((totalSpend / totalClicks).toFixed(2)) : 0,
        roi: totalSpend > 0 ? Number(((totalConversions * 100 - totalSpend) / totalSpend * 100).toFixed(2)) : 0,
      },
    };
  }

  async recordImpression(adId: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id: adId } });
    if (!ad || ad.status !== AdStatus.ACTIVE) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.advertisement.update({ where: { id: adId }, data: { impressions: { increment: 1 } } });
    await this.prisma.adAnalytics.upsert({
      where: { advertisementId_date: { advertisementId: adId, date: today } },
      create: { advertisementId: adId, date: today, impressions: 1 },
      update: { impressions: { increment: 1 } },
    });
  }

  async recordClick(adId: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id: adId } });
    if (!ad || ad.status !== AdStatus.ACTIVE) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let spendAmount = 0;
    if (ad.pricingModel === 'CPC' && ad.cpc) {
      spendAmount = Number(ad.cpc);
    }

    const currentSpent = Number(ad.spentBudget);
    const currentTotal = Number(ad.totalBudget);
    const newSpent = currentSpent + spendAmount;
    let autoStopped = false;

    if (newSpent >= currentTotal) {
      autoStopped = true;
    }

    await this.prisma.advertisement.update({
      where: { id: adId },
      data: {
        clicks: { increment: 1 },
        spentBudget: new Prisma.Decimal(newSpent),
        ...(autoStopped ? { status: AdStatus.COMPLETED } : {}),
      },
    });
    await this.prisma.adAnalytics.upsert({
      where: { advertisementId_date: { advertisementId: adId, date: today } },
      create: { advertisementId: adId, date: today, clicks: 1, spend: new Prisma.Decimal(spendAmount) },
      update: { clicks: { increment: 1 }, spend: { increment: new Prisma.Decimal(spendAmount) } },
    });
  }

  async processExpired() {
    const now = new Date();
    const expired = await this.prisma.advertisement.updateMany({
      where: { status: AdStatus.ACTIVE, endDate: { lte: now } },
      data: { status: AdStatus.EXPIRED },
    });
    const exhausted = await this.prisma.advertisement.findMany({
      where: { status: AdStatus.ACTIVE },
      select: { id: true, spentBudget: true, totalBudget: true },
    });
    const budgetExhaustedIds = exhausted
      .filter(a => Number(a.spentBudget) >= Number(a.totalBudget) && Number(a.totalBudget) > 0)
      .map(a => a.id);
    if (budgetExhaustedIds.length > 0) {
      await this.prisma.advertisement.updateMany({
        where: { id: { in: budgetExhaustedIds } },
        data: { status: AdStatus.COMPLETED },
      });
    }
    return { expired: expired.count, budgetExhausted: budgetExhaustedIds.length };
  }

  async processAutoActions() {
    const now = new Date();
    const paused = await this.prisma.advertisement.updateMany({
      where: { status: AdStatus.PAUSED, autoResume: true, startDate: { lte: now }, endDate: { gte: now } },
      data: { status: AdStatus.ACTIVE },
    });
    const resumed = await this.prisma.advertisement.updateMany({
      where: { status: AdStatus.ACTIVE, autoPause: true, startDate: { lte: now }, endDate: { gte: now } },
      data: { status: AdStatus.PAUSED },
    });
    const stopped = await this.prisma.advertisement.updateMany({
      where: { status: AdStatus.ACTIVE, autoStop: true, endDate: { lte: now } },
      data: { status: AdStatus.COMPLETED },
    });
    return { paused: paused.count, resumed: resumed.count, stopped: stopped.count };
  }
}
