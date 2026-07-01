import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GocashService } from '../gocash/gocash.service';
import { CampaignStatus, CampaignType, Prisma } from '@prisma/client';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignDto, ClaimCampaignDto } from './dto';

@Injectable()
export class CampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gocashService: GocashService,
  ) {}

  async create(dto: CreateCampaignDto, userId: string) {
    const { rules, targets, ...campaignData } = dto;

    const budget = campaignData.budget ?? 0;
    const data: Prisma.CampaignCreateInput = {
      name: campaignData.name,
      description: campaignData.description ?? null,
      type: campaignData.type,
      status: (campaignData.status as CampaignStatus) ?? 'DRAFT',
      priority: campaignData.priority ?? 0,
      startDate: new Date(campaignData.startDate),
      endDate: new Date(campaignData.endDate),
      budget,
      remainingBudget: budget,
      spentBudget: 0,
      maxRewards: campaignData.maxRewards ?? 0,
      dailyLimit: campaignData.dailyLimit ?? 0,
      perUserLimit: campaignData.perUserLimit ?? 0,
      perCompanyLimit: campaignData.perCompanyLimit ?? 0,
      maxClaims: campaignData.maxClaims ?? 0,
      currentClaims: 0,
      rewardAmount: campaignData.rewardAmount ?? 0,
      rewardType: campaignData.rewardType ?? 'FIXED_AMOUNT',
      eligibility: (campaignData.eligibility ?? null) as Prisma.InputJsonValue,
      targetAudience: (campaignData.targetAudience ?? null) as Prisma.InputJsonValue,
      metadata: (campaignData.metadata ?? null) as Prisma.InputJsonValue,
      companyId: campaignData.companyId ?? null,
      createdBy: userId,
    };

    const campaign = await this.prisma.campaign.create({ data });

    if (rules?.length) {
      await this.prisma.campaignRule.createMany({
        data: rules.map((r) => ({
          campaignId: campaign.id,
          priority: r.priority,
          conditionField: r.conditionField,
          conditionOperator: r.conditionOperator,
          conditionValue: r.conditionValue as Prisma.InputJsonValue,
          actionType: r.actionType,
          actionValue: r.actionValue as Prisma.InputJsonValue,
          isActive: r.isActive ?? true,
        })),
      });
    }

    if (targets?.length) {
      await this.prisma.campaignTarget.createMany({
        data: targets.map((t) => ({
          campaignId: campaign.id,
          targetType: t.targetType as any,
          targetId: t.targetId,
          isInclude: t.isInclude ?? true,
        })),
      });
    }

    return this.findById(campaign.id);
  }

  async findAll(query: QueryCampaignDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.companyId) where.companyId = query.companyId;
    if (query.startDateFrom || query.startDateTo) {
      where.startDate = {};
      if (query.startDateFrom) where.startDate.gte = new Date(query.startDateFrom);
      if (query.startDateTo) where.startDate.lte = new Date(query.startDateTo);
    }
    if (query.endDateFrom || query.endDateTo) {
      where.endDate = {};
      if (query.endDateFrom) where.endDate.gte = new Date(query.endDateFrom);
      if (query.endDateTo) where.endDate.lte = new Date(query.endDateTo);
    }

    const orderBy: Prisma.CampaignOrderByWithRelationInput = {};
    if (query.sortBy) {
      orderBy[query.sortBy as keyof Prisma.CampaignOrderByWithRelationInput] = query.sortOrder ?? 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: { rules: { orderBy: { priority: 'asc' } }, targets: true, _count: { select: { claims: true } } },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 },
    };
  }

  async findById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { rules: { orderBy: { priority: 'asc' } }, targets: true, _count: { select: { claims: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const existing = await this.findById(id);
    const { rules, targets, ...campaignData } = dto as any;

    if (campaignData.budget !== undefined) {
      const budgetDelta = Number(campaignData.budget) - Number(existing.budget);
      campaignData.remainingBudget = Number(existing.remainingBudget) + budgetDelta;
    }
    if (campaignData.startDate) campaignData.startDate = new Date(campaignData.startDate);
    if (campaignData.endDate) campaignData.endDate = new Date(campaignData.endDate);

    const updateData: any = { ...campaignData };
    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === undefined) delete updateData[k];
    });

    await this.prisma.campaign.update({ where: { id }, data: updateData });

    if (rules) {
      await this.prisma.campaignRule.deleteMany({ where: { campaignId: id } });
      if (rules.length) {
        await this.prisma.campaignRule.createMany({
          data: rules.map((r: any) => ({
            campaignId: id,
            priority: r.priority ?? 0,
            conditionField: r.conditionField,
            conditionOperator: r.conditionOperator,
            conditionValue: r.conditionValue as Prisma.InputJsonValue,
            actionType: r.actionType,
            actionValue: r.actionValue as Prisma.InputJsonValue,
            isActive: r.isActive ?? true,
          })),
        });
      }
    }

    if (targets) {
      await this.prisma.campaignTarget.deleteMany({ where: { campaignId: id } });
      if (targets.length) {
        await this.prisma.campaignTarget.createMany({
          data: targets.map((t: any) => ({
            campaignId: id,
            targetType: t.targetType as any,
            targetId: t.targetId,
            isInclude: t.isInclude ?? true,
          })),
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: string) {
    const existing = await this.findById(id);
    if (existing.status === 'ACTIVE') {
      throw new BadRequestException('Cannot delete an active campaign. Archive it first.');
    }
    await this.prisma.campaign.update({ where: { id }, data: { status: 'ARCHIVED' } });
    return { success: true };
  }

  async clone(id: string) {
    const existing = await this.findById(id);
    const data: Prisma.CampaignCreateInput = {
      name: `${existing.name} (Copy)`,
      description: existing.description,
      type: existing.type as CampaignType,
      status: 'DRAFT',
      priority: existing.priority,
      startDate: existing.startDate,
      endDate: existing.endDate,
      budget: existing.budget,
      remainingBudget: existing.budget,
      spentBudget: 0,
      maxRewards: existing.maxRewards,
      dailyLimit: existing.dailyLimit,
      perUserLimit: existing.perUserLimit,
      perCompanyLimit: existing.perCompanyLimit,
      maxClaims: existing.maxClaims,
      currentClaims: 0,
      rewardAmount: existing.rewardAmount,
      rewardType: existing.rewardType,
      eligibility: existing.eligibility as Prisma.InputJsonValue,
      targetAudience: existing.targetAudience as Prisma.InputJsonValue,
      metadata: existing.metadata as Prisma.InputJsonValue,
      companyId: existing.companyId,
      createdBy: existing.createdBy,
    };
    const cloned = await this.prisma.campaign.create({ data });

    if (existing.rules?.length) {
      await this.prisma.campaignRule.createMany({
        data: existing.rules.map((r) => ({
          campaignId: cloned.id,
          priority: r.priority,
          conditionField: r.conditionField,
          conditionOperator: r.conditionOperator,
          conditionValue: r.conditionValue as Prisma.InputJsonValue,
          actionType: r.actionType,
          actionValue: r.actionValue as Prisma.InputJsonValue,
          isActive: r.isActive,
        })),
      });
    }
    if (existing.targets?.length) {
      await this.prisma.campaignTarget.createMany({
        data: existing.targets.map((t) => ({
          campaignId: cloned.id,
          targetType: t.targetType,
          targetId: t.targetId,
          isInclude: t.isInclude,
        })),
      });
    }

    return this.findById(cloned.id);
  }

  async pause(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'ACTIVE') throw new BadRequestException('Only active campaigns can be paused');
    return this.prisma.campaign.update({ where: { id }, data: { status: 'PAUSED' } });
  }

  async resume(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'PAUSED') throw new BadRequestException('Only paused campaigns can be resumed');
    return this.prisma.campaign.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async archive(id: string) {
    const existing = await this.findById(id);
    if (existing.status === 'ARCHIVED') throw new BadRequestException('Campaign is already archived');
    return this.prisma.campaign.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async checkEligibility(campaignId: string, userId: string, companyId?: string) {
    const campaign = await this.findById(campaignId);

    if (campaign.status !== 'ACTIVE') {
      return { eligible: false, reason: `Campaign is ${campaign.status.toLowerCase()}` };
    }
    const now = new Date();
    if (now < campaign.startDate) return { eligible: false, reason: 'Campaign has not started yet' };
    if (now > campaign.endDate) return { eligible: false, reason: 'Campaign has ended' };

    if (Number(campaign.budget) > 0 && Number(campaign.remainingBudget) <= 0) {
      return { eligible: false, reason: 'Campaign budget exhausted' };
    }
    if (campaign.maxClaims > 0 && campaign.currentClaims >= campaign.maxClaims) {
      return { eligible: false, reason: 'Campaign has reached maximum claims' };
    }

    if (campaign.perUserLimit > 0) {
      const userClaims = await this.prisma.campaignClaim.count({
        where: { campaignId, userId, status: { in: ['APPROVED', 'PAID'] } },
      });
      if (userClaims >= campaign.perUserLimit) {
        return { eligible: false, reason: 'You have reached the maximum claims for this campaign' };
      }
    }

    if (campaign.perCompanyLimit > 0 && companyId) {
      const companyClaims = await this.prisma.campaignClaim.count({
        where: { campaignId, companyId, status: { in: ['APPROVED', 'PAID'] } },
      });
      if (companyClaims >= campaign.perCompanyLimit) {
        return { eligible: false, reason: 'Your company has reached the maximum claims for this campaign' };
      }
    }

    if (campaign.dailyLimit > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayClaims = await this.prisma.campaignClaim.count({
        where: { campaignId, claimedAt: { gte: today } },
      });
      if (todayClaims >= campaign.dailyLimit) {
        return { eligible: false, reason: 'Daily claim limit reached' };
      }
    }

    if (campaign.eligibility) {
      const eligibility = campaign.eligibility as Record<string, any>;
      if (eligibility.requiredMembership && !companyId) {
        return { eligible: false, reason: 'This campaign requires a company account' };
      }
    }

    return { eligible: true, campaign };
  }

  async claimReward(dto: ClaimCampaignDto) {
    const userId = dto.userId ?? 'SYSTEM';
    const eligibility = await this.checkEligibility(dto.campaignId, userId, dto.companyId);
    if (!eligibility.eligible) throw new BadRequestException(eligibility.reason);
    const campaign = eligibility.campaign!;

    const claimAmount = dto.amount ?? Number(campaign.rewardAmount);

    const claim = await this.prisma.campaignClaim.create({
      data: {
        campaignId: dto.campaignId,
        userId,
        companyId: dto.companyId ?? null,
        claimType: dto.claimType ?? 'REWARD',
        amount: claimAmount,
        status: 'APPROVED',
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
        metadata: (dto.metadata ?? null) as Prisma.InputJsonValue,
      },
    });

    const idempotencyKey = `CAMPAIGN_${campaign.id}_${dto.userId}_${claim.id}`;

    try {
      const wallet = await this.prisma.gOCASH_Wallet.findUnique({ where: { userId: dto.userId } });
      if (!wallet) throw new BadRequestException('User has no GOCASH wallet');

      const ledgerEntry = await this.gocashService.credit({
        walletId: wallet.id,
        amount: claimAmount,
        type: 'CAMPAIGN_REWARD',
        reason: `Campaign reward: ${campaign.name}`,
        actorId: 'SYSTEM',
        actorType: 'SYSTEM',
        referenceId: claim.id,
        referenceType: 'CAMPAIGN_CLAIM',
        sourceType: 'CAMPAIGN',
        sourceSystem: 'CAMPAIGN_ENGINE',
        idempotencyKey,
      });

      await this.prisma.campaignClaim.update({
        where: { id: claim.id },
        data: { status: 'PAID', transactionId: ledgerEntry.id },
      });

      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          currentClaims: { increment: 1 },
          spentBudget: { increment: claimAmount },
          remainingBudget: { decrement: claimAmount },
        },
      });

      await this.recordAnalytics(campaign.id, claim);
    } catch (error) {
      await this.prisma.campaignClaim.update({
        where: { id: claim.id },
        data: { status: 'FAILED' },
      });
      throw error;
    }

    return this.prisma.campaignClaim.findUnique({
      where: { id: claim.id },
      include: { campaign: { select: { name: true, type: true } } },
    });
  }

  private async recordAnalytics(campaignId: string, claim: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      await this.prisma.campaignAnalytics.upsert({
        where: { campaignId_date: { campaignId, date: today } },
        update: {
          claims: { increment: 1 },
          approved: { increment: claim.status === 'APPROVED' ? 1 : 0 },
          paid: { increment: claim.status === 'PAID' ? 1 : 0 },
          rewardAmount: { increment: Number(claim.amount) },
        },
        create: {
          campaignId,
          date: today,
          claims: 1,
          approved: claim.status === 'APPROVED' ? 1 : 0,
          paid: claim.status === 'PAID' ? 1 : 0,
          rewardAmount: Number(claim.amount),
          uniqueUsers: 1,
        },
      });
    } catch {
      // Analytics are non-critical — silently continue
    }
  }

  async getActiveCampaigns(userId: string, companyId?: string) {
    const now = new Date();
    return this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
        ...(companyId ? { OR: [{ companyId: null }, { companyId }] } : { companyId: null }),
      },
      include: { rules: { where: { isActive: true }, orderBy: { priority: 'asc' } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getMyClaims(userId: string) {
    return this.prisma.campaignClaim.findMany({
      where: { userId },
      include: { campaign: { select: { name: true, type: true, status: true } } },
      orderBy: { claimedAt: 'desc' },
      take: 50,
    });
  }

  async getCampaignAnalytics(campaignId: string) {
    await this.findById(campaignId);
    return this.prisma.campaignAnalytics.findMany({
      where: { campaignId },
      orderBy: { date: 'asc' },
    });
  }

  async getAdminDashboard() {
    const now = new Date();
    const [total, active, completed, draft, totalClaims, totalRewards, totalBudget, campaignTypeStats] = await Promise.all([
      this.prisma.campaign.count(),
      this.prisma.campaign.count({ where: { status: 'ACTIVE', startDate: { lte: now }, endDate: { gte: now } } }),
      this.prisma.campaign.count({ where: { status: 'COMPLETED' } }),
      this.prisma.campaign.count({ where: { status: 'DRAFT' } }),
      this.prisma.campaignClaim.count(),
      this.prisma.campaignClaim.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      this.prisma.campaign.aggregate({ _sum: { budget: true, spentBudget: true } }),
      this.prisma.campaign.groupBy({ by: ['type'], _count: { id: true } }),
    ]);

    return {
      total,
      active,
      completed,
      draft,
      totalClaims,
      totalRewardsPaid: totalRewards._sum.amount ?? 0,
      totalBudget: totalBudget._sum.budget ?? 0,
      totalSpent: totalBudget._sum.spentBudget ?? 0,
      budgetUsageRate: totalBudget._sum.budget && Number(totalBudget._sum.budget) > 0
        ? Number(totalBudget._sum.spentBudget) / Number(totalBudget._sum.budget)
        : 0,
      byType: campaignTypeStats,
    };
  }

  async getSellerCampaigns(companyId: string) {
    return this.prisma.campaign.findMany({
      where: {
        OR: [{ companyId }, { type: 'SELLER' as any }, { type: 'CASHBACK' as any }],
        status: { in: ['ACTIVE', 'DRAFT', 'PAUSED'] },
      },
      include: {
        rules: { where: { isActive: true }, orderBy: { priority: 'asc' } },
        _count: { select: { claims: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async evaluateRules(campaignId: string, context: Record<string, any>) {
    const campaign = await this.findById(campaignId);
    const rules = campaign.rules;
    if (!rules?.length) return { matched: false, actions: [] };

    const matchedActions: Array<{ actionType: string; actionValue: any }> = [];
    for (const rule of rules) {
      if (!rule.isActive) continue;
      const fieldValue = context[rule.conditionField];
      if (fieldValue === undefined) continue;

      const matched = this.evaluateCondition(fieldValue, rule.conditionOperator, rule.conditionValue);
      if (matched) {
        matchedActions.push({ actionType: rule.actionType, actionValue: rule.actionValue });
        break;
      }
    }

    return { matched: matchedActions.length > 0, actions: matchedActions };
  }

  private evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'EQUALS': return fieldValue === conditionValue;
      case 'NOT_EQUALS': return fieldValue !== conditionValue;
      case 'GREATER_THAN': return Number(fieldValue) > Number(conditionValue);
      case 'GREATER_THAN_OR_EQUAL': return Number(fieldValue) >= Number(conditionValue);
      case 'LESS_THAN': return Number(fieldValue) < Number(conditionValue);
      case 'LESS_THAN_OR_EQUAL': return Number(fieldValue) <= Number(conditionValue);
      case 'CONTAINS': return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'IN': return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'BETWEEN': return Array.isArray(conditionValue) && conditionValue.length === 2
        && Number(fieldValue) >= Number(conditionValue[0]) && Number(fieldValue) <= Number(conditionValue[1]);
      default: return false;
    }
  }

  async getCampaignsByType(type: string) {
    const now = new Date();
    return this.prisma.campaign.findMany({
      where: { type: type as CampaignType, status: 'ACTIVE', startDate: { lte: now }, endDate: { gte: now } },
      include: { _count: { select: { claims: true } } },
      orderBy: { priority: 'desc' },
    });
  }

  async processExpiredCampaigns() {
    const now = new Date();
    const result = await this.prisma.campaign.updateMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
      data: { status: 'EXPIRED' },
    });
    return { expired: result.count };
  }
}
