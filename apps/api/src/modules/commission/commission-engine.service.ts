import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionCalculationResult } from './dto/commission-engine.dto';
import { CommissionRuleType, CommissionCalcType, Prisma } from '@prisma/client';

const RULE_PRIORITY_ORDER: CommissionRuleType[] = [
  CommissionRuleType.PROMOTIONAL,
  CommissionRuleType.PROFESSIONAL,
  CommissionRuleType.MEMBERSHIP,
  CommissionRuleType.CATEGORY,
  CommissionRuleType.PLATFORM_DEFAULT,
];

interface Context {
  amountInPaise: number;
  professionalCompanyId?: string;
  categoryId?: string;
  membershipPlanId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type RuleRecord = Prisma.CommissionRuleGetPayload<{}>;

@Injectable()
export class CommissionEngineService {
  private readonly logger = new Logger(CommissionEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventEmitter2,
  ) {}

  async calculate(
    amountInPaise: number,
    professionalCompanyId?: string,
    categoryId?: string,
    membershipPlanId?: string,
  ): Promise<CommissionCalculationResult> {
    const activeRules = await this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
        scope: 'BOOKING',
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    if (activeRules.length === 0) {
      return this.zeroCommission(amountInPaise);
    }

    const ctx: Context = { amountInPaise, professionalCompanyId, categoryId, membershipPlanId };

    for (const ruleType of RULE_PRIORITY_ORDER) {
      const candidates = activeRules.filter((r) => r.ruleType === ruleType);
      if (candidates.length === 0) continue;

      const matched = this.findMatchInLevel(candidates, ctx, ruleType);
      if (matched) {
        const result = this.applyCommission(matched, ctx);
        await this.emitAndAudit(result, ctx);
        return result;
      }
    }

    return this.zeroCommission(amountInPaise);
  }

  private findMatchInLevel(
    rules: RuleRecord[],
    ctx: Context,
    ruleType: CommissionRuleType,
  ): RuleRecord | null {
    for (const rule of rules) {
      if (!this.isAmountInRange(rule, ctx.amountInPaise)) continue;
      if (ruleType === CommissionRuleType.PROFESSIONAL && rule.professionalId) {
        if (rule.professionalId !== ctx.professionalCompanyId) continue;
      }
      if (ruleType === CommissionRuleType.MEMBERSHIP && rule.membershipPlanId) {
        if (rule.membershipPlanId !== ctx.membershipPlanId) continue;
      }
      if (ruleType === CommissionRuleType.CATEGORY && rule.categoryId) {
        if (rule.categoryId !== ctx.categoryId) continue;
      }
      if (!this.isDateValid(rule)) continue;
      return rule;
    }
    return null;
  }

  private isAmountInRange(rule: { minAmount: unknown; maxAmount: unknown }, amount: number): boolean {
    const min = rule.minAmount != null ? Number(rule.minAmount) : null;
    const max = rule.maxAmount != null ? Number(rule.maxAmount) : null;
    const amountInUnits = amount / 100;
    if (min !== null && amountInUnits < min) return false;
    if (max !== null && amountInUnits > max) return false;
    return true;
  }

  private isDateValid(rule: { startsAt: Date; endsAt: Date | null }): boolean {
    const now = new Date();
    if (rule.startsAt > now) return false;
    if (rule.endsAt && rule.endsAt < now) return false;
    return true;
  }

  private applyCommission(rule: RuleRecord, ctx: Context): CommissionCalculationResult {
    const percent = Number(rule.percent);
    const fixedFee = Number(rule.fixedFee);
    let commissionAmount = 0;
    let commissionType = 'PERCENTAGE';
    let commissionValue = 0;

    switch (rule.calcType) {
      case CommissionCalcType.ZERO:
        commissionType = 'ZERO';
        commissionValue = 0;
        commissionAmount = 0;
        break;
      case CommissionCalcType.FIXED:
        commissionType = 'FIXED';
        commissionValue = fixedFee * 100;
        commissionAmount = fixedFee * 100;
        break;
      case CommissionCalcType.PERCENTAGE:
      default:
        commissionType = 'PERCENTAGE';
        commissionValue = percent;
        commissionAmount = Math.round((ctx.amountInPaise * percent) / 100);
        break;
    }

    const netSettlementAmount = Math.max(0, ctx.amountInPaise - commissionAmount);

    const ruleSourceMap: Record<CommissionRuleType, string> = {
      [CommissionRuleType.PROMOTIONAL]: 'PROMOTIONAL_OVERRIDE',
      [CommissionRuleType.PROFESSIONAL]: 'PROFESSIONAL_OVERRIDE',
      [CommissionRuleType.MEMBERSHIP]: 'MEMBERSHIP_OVERRIDE',
      [CommissionRuleType.CATEGORY]: 'CATEGORY_RULE',
      [CommissionRuleType.PLATFORM_DEFAULT]: 'PLATFORM_DEFAULT',
    };

    return {
      grossAmount: ctx.amountInPaise,
      commissionType,
      commissionValue,
      platformCommission: commissionAmount,
      netSettlementAmount,
      appliedRule: {
        id: rule.id,
        ruleType: rule.ruleType,
        name: rule.name,
        priority: rule.priority,
      },
      ruleSource: ruleSourceMap[rule.ruleType] || 'UNKNOWN',
      calculationTimestamp: new Date(),
    };
  }

  private zeroCommission(amountInPaise: number): CommissionCalculationResult {
    return {
      grossAmount: amountInPaise,
      commissionType: 'ZERO',
      commissionValue: 0,
      platformCommission: 0,
      netSettlementAmount: amountInPaise,
      appliedRule: null,
      ruleSource: 'NO_RULE',
      calculationTimestamp: new Date(),
    };
  }

  private async emitAndAudit(
    result: CommissionCalculationResult,
    ctx: Context,
  ): Promise<void> {
    this.eventBus.emit('commission.calculated', {
      grossAmount: result.grossAmount,
      commissionAmount: result.platformCommission,
      netAmount: result.netSettlementAmount,
      ruleId: result.appliedRule?.id ?? null,
      ruleSource: result.ruleSource,
      professionalCompanyId: ctx.professionalCompanyId,
      bookingAmount: ctx.amountInPaise,
      calculationTimestamp: result.calculationTimestamp,
    });

    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'COMMISSION_CALCULATED',
          resource: 'commission_engine',
          metadata: {
            grossAmount: result.grossAmount,
            commissionAmount: result.platformCommission,
            netSettlementAmount: result.netSettlementAmount,
            ruleId: result.appliedRule?.id ?? null,
            ruleSource: result.ruleSource,
            commissionType: result.commissionType,
            commissionValue: result.commissionValue,
            professionalCompanyId: ctx.professionalCompanyId,
            calculationTimestamp: result.calculationTimestamp.toISOString(),
          },
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to audit commission calculation: ${(err as Error).message}`);
    }
  }
}
