import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto, QueryCommissionRuleDto } from './dto/commission.dto';

export interface CommissionResult {
  commissionPercent: number;
  commissionAmount: number;
  fixedFee: number;
  tdsPercent: number;
  tdsAmount: number;
  gstOnCommission: boolean;
  gstAmount: number;
  totalDeductions: number;
  netAmount: number;
  ruleId: string | null;
}

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculate(orderTotal: number, categoryId?: string): Promise<CommissionResult> {
    const bestRule = await this.findBestRule(orderTotal, categoryId);

    if (!bestRule) {
      return {
        commissionPercent: 0,
        commissionAmount: 0,
        fixedFee: 0,
        tdsPercent: 0,
        tdsAmount: 0,
        gstOnCommission: false,
        gstAmount: 0,
        totalDeductions: 0,
        netAmount: orderTotal,
        ruleId: null,
      };
    }

    const percentFee = Math.round((orderTotal * Number(bestRule.percent)) / 100);
    const fixedFee = Math.round(Number(bestRule.fixedFee) * 100);
    const commissionAmount = percentFee + fixedFee;
    const tdsPercent = Number(bestRule.tdsPercent);
    const tdsAmount = tdsPercent > 0 ? Math.round((commissionAmount * tdsPercent) / 100) : 0;
    const gstOnCommission = bestRule.gstOnCommission;
    const gstAmount = gstOnCommission ? Math.round(commissionAmount * 0.18) : 0;
    const totalDeductions = commissionAmount + tdsAmount + gstAmount;
    const netAmount = Math.max(0, orderTotal - totalDeductions);

    return {
      commissionPercent: Number(bestRule.percent),
      commissionAmount,
      fixedFee,
      tdsPercent,
      tdsAmount,
      gstOnCommission,
      gstAmount,
      totalDeductions,
      netAmount,
      ruleId: bestRule.id,
    };
  }

  private async findBestRule(orderTotal: number, categoryId?: string) {
    const rules = await this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    const applicable = rules.filter((r) => {
      if (r.categoryId && r.categoryId !== categoryId) return false;
      const min = r.minAmount ? Number(r.minAmount) : null;
      const max = r.maxAmount ? Number(r.maxAmount) : null;
      if (min !== null && orderTotal < min) return false;
      if (max !== null && orderTotal > max) return false;
      return true;
    });

    const categoryMatch = applicable.find((r) => r.categoryId === categoryId);
    const globalMatch = applicable.find((r) => !r.categoryId);
    return categoryMatch || globalMatch || null;
  }

  async createRule(dto: CreateCommissionRuleDto) {
    const rule = await this.prisma.commissionRule.create({ data: dto });
    await this.prisma.auditLog.create({
      data: { action: 'COMMISSION_RULE_CREATED', resource: `commission-rule:${rule.id}`, metadata: { percent: dto.percent, fixedFee: dto.fixedFee } },
    });
    return rule;
  }

  async updateRule(id: string, dto: UpdateCommissionRuleDto) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission rule not found');
    const updated = await this.prisma.commissionRule.update({ where: { id }, data: dto });
    await this.prisma.auditLog.create({
      data: { action: 'COMMISSION_RULE_UPDATED', resource: `commission-rule:${id}`, metadata: dto as any },
    });
    return updated;
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission rule not found');
    await this.prisma.commissionRule.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { action: 'COMMISSION_RULE_DELETED', resource: `commission-rule:${id}`, metadata: { percent: rule.percent, fixedFee: rule.fixedFee } },
    });
  }

  async getRule(id: string) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Commission rule not found');
    return rule;
  }

  async listRules(query: QueryCommissionRuleDto) {
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.categoryId) where.categoryId = query.categoryId;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.commissionRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commissionRule.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 } };
  }

  async getSummary() {
    const rules = await this.prisma.commissionRule.findMany({ where: { isActive: true } });
    const totalCollected = await this.prisma.payout.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { commissionAmount: true },
    });

    return {
      activeRules: rules.length,
      categoryRules: rules.filter((r) => r.categoryId).length,
      globalRules: rules.filter((r) => !r.categoryId).length,
      totalCommissionCollected: totalCollected._sum.commissionAmount ?? 0,
    };
  }
}
