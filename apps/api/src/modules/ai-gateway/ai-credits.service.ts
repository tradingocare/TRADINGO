import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TaskType } from '@prisma/client'

const CREDIT_COSTS: Partial<Record<TaskType, number>> = {
  [TaskType.PRODUCT_DESCRIPTION]: 10,
  [TaskType.SEO_GENERATION]: 5,
  [TaskType.TRANSLATION]: 8,
  [TaskType.SPEC_SUGGESTION]: 3,
  [TaskType.IMAGE_SUGGESTION]: 3,
  [TaskType.QUALITY_SCORING]: 2,
  [TaskType.DUPLICATE_DETECTION]: 5,
  [TaskType.OCR]: 10,
  [TaskType.FAST_SUGGESTION]: 1,
  [TaskType.LIVE_SEARCH]: 2,
  [TaskType.WEBSITE_IMPORT]: 15,
  [TaskType.RFQ_ANALYSIS]: 15,
  [TaskType.QUOTE_ANALYSIS]: 15,
  [TaskType.NEGOTIATION]: 20,
  [TaskType.CRM_ANALYSIS]: 5,
  [TaskType.FINANCE_ANALYSIS]: 10,
  [TaskType.SEARCH_ANALYSIS]: 5,
  [TaskType.ADMIN_INTELLIGENCE]: 10,
  [TaskType.GENERAL_CHAT]: 1,
}

const PLAN_AI_CREDITS: Record<string, number> = {
  'trad-up': 20,
  'trade-smart-launch': 100,
  'trade_start': 50,
  'trade_smart': 100,
  'trade_plus': 250,
  'trade_pro': 500,
  'trade_premium': 1000,
  'trade_elite': 2500,
}

export interface CreditBalance {
  total: number
  used: number
  remaining: number
  planName: string
  periodStart: string
  periodEnd: string
}

export interface CreditSummary {
  totalIssued: number
  totalUsed: number
  totalRemaining: number
  topConsumers: Array<{ companyId: string; companyName: string; used: number }>
}

function getPeriod(): { periodStart: Date; periodEnd: Date; nextPeriodStart: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { periodStart: start, periodEnd: end, nextPeriodStart: nextStart }
}

@Injectable()
export class AiCreditsService implements OnModuleInit {
  private readonly logger = new Logger(AiCreditsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPlanFeatures()
  }

  private async seedPlanFeatures() {
    const plans = await this.prisma.membershipPlan.findMany({ select: { planId: true } })
    for (const plan of plans) {
      const existing = await this.prisma.planFeature.findFirst({
        where: { planId: plan.planId, feature: 'ai_credits' },
      })
      if (!existing) {
        const credits = PLAN_AI_CREDITS[plan.planId] ?? 20
        await this.prisma.planFeature.create({
          data: { planId: plan.planId, feature: 'ai_credits', value: String(credits), included: true, sortOrder: 0 },
        })
        this.logger.log(`Seeded ai_credits=${credits} for plan ${plan.planId}`)
      }
    }
  }

  getCreditCost(taskType: TaskType): number {
    return CREDIT_COSTS[taskType] ?? 5
  }

  async checkCredits(companyId: string, taskType: TaskType): Promise<{ sufficient: boolean; available: number; required: number }> {
    const cost = this.getCreditCost(taskType)
    const balance = await this.getCreditBalance(companyId)
    return { sufficient: balance.remaining >= cost, available: balance.remaining, required: cost }
  }

  async deductCredits(companyId: string, taskType: TaskType): Promise<void> {
    const cost = this.getCreditCost(taskType)
    const { periodStart, periodEnd } = getPeriod()

    await this.prisma.aiCreditUsage.upsert({
      where: { companyId_periodStart: { companyId, periodStart } },
      create: { companyId, periodStart, periodEnd, used: cost },
      update: { used: { increment: cost } },
    })
  }

  async getAvailableCredits(companyId: string): Promise<number> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionPlan: true, subscriptionStatus: true },
    })
    if (!company || company.subscriptionStatus !== 'ACTIVE' || !company.subscriptionPlan) {
      const freePlan = await this.prisma.membershipPlan.findFirst({ where: { isFree: true } })
      if (!freePlan) return 20
      return this.getPlanCredits(freePlan.planId)
    }
    return this.getPlanCredits(company.subscriptionPlan as string)
  }

  async getPlanCredits(planId: string): Promise<number> {
    const feature = await this.prisma.planFeature.findFirst({
      where: { planId, feature: 'ai_credits' },
    })
    if (feature?.value) return parseInt(feature.value, 10)
    const plan = await this.prisma.membershipPlan.findUnique({ where: { planId } })
    if (plan?.features && typeof plan.features === 'object') {
      const f = plan.features as Record<string, unknown>
      if (f.aiCredits) return Number(f.aiCredits)
    }
    return 20
  }

  async getCreditBalance(companyId: string): Promise<CreditBalance> {
    const total = await this.getAvailableCredits(companyId)
    const { periodStart, periodEnd } = getPeriod()

    const usage = await this.prisma.aiCreditUsage.findUnique({
      where: { companyId_periodStart: { companyId, periodStart } },
    })
    const used = usage?.used ?? 0

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionPlan: true, currentPlan: { select: { name: true } } },
    })
    const planName = company?.currentPlan?.name ?? 'Free'

    return {
      total,
      used,
      remaining: Math.max(0, total - used),
      planName,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    }
  }

  async resetCompanyUsage(companyId: string): Promise<void> {
    const { periodStart } = getPeriod()
    await this.prisma.aiCreditUsage.upsert({
      where: { companyId_periodStart: { companyId, periodStart } },
      create: { companyId, periodStart, periodEnd: new Date(0), used: 0 },
      update: { used: 0 },
    })
    this.logger.log(`Reset AI credit usage for company ${companyId}`)
  }

  async getCreditSummary(): Promise<CreditSummary> {
    const { periodStart, periodEnd } = getPeriod()
    const usages = await this.prisma.aiCreditUsage.findMany({
      where: { periodStart, periodEnd },
      include: { company: { select: { name: true } } },
      orderBy: { used: 'desc' },
      take: 100,
    })

    const totalIssued = 0
    const totalUsed = usages.reduce((s, u) => s + u.used, 0)
    const totalRemaining = 0
    const topConsumers = usages.slice(0, 10).map((u) => ({
      companyId: u.companyId,
      companyName: u.company.name,
      used: u.used,
    }))

    return { totalIssued, totalUsed, totalRemaining, topConsumers }
  }

  async getCompanyCreditDetail(companyId: string): Promise<CreditBalance & { monthlyHistory: Array<{ periodStart: string; used: number }> }> {
    const balance = await this.getCreditBalance(companyId)

    const history = await this.prisma.aiCreditUsage.findMany({
      where: { companyId },
      orderBy: { periodStart: 'desc' },
      take: 12,
      select: { periodStart: true, used: true },
    })

    return {
      ...balance,
      monthlyHistory: history.map((h) => ({ periodStart: h.periodStart.toISOString(), used: h.used })),
    }
  }
}
