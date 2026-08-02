import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma, DisputeStatus, ShipmentStatus, IncidentStatus, IncidentSeverity } from '@prisma/client'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { AnalyticsService } from '../analytics/analytics.service'
import { MarketplaceIntelligenceEngine } from '../marketplace-intelligence/marketplace-intelligence.engine'
import { TradeTalkService } from '../tradetalk/tradetalk.service'
import { TradTrustService } from '../tradtrust/tradtrust.service'
import { GocashEcosystemService } from '../gocash-ecosystem/gocash-ecosystem.service'
import { AdvertisingService } from '../advertising/advertising.service'
import { RedisService } from '../../common/services/redis.service'
import { FinanceAggregatorService } from '../finance/aggregator.service'
import { gracefulCatch } from '../../common/utils/graceful-catch'
import {
  FounderAiInsight, FounderAiMeta, FounderAiResponse,
  MorningBriefResponse, EveningSummaryResponse, ExecutiveDashboardResponse,
  DecisionCenterDto, DecisionCenterResponse,
  RiskIntelligenceResponse, GrowthIntelligenceResponse,
  FounderCopilotDto, FounderCopilotResponse,
  HealthScoreResponse, ExecutivePrioritiesResponse, ExecutiveTimelineResponse,
  TimelinePeriod, ExecutiveReportResponse, ReportSection,
  ExecutivePriority,
  MarketplaceIntelligenceResponse,
  TradeservIntelligenceResponse,
  TradeTalkIntelligenceResponse,
  MembershipIntelligenceResponse,
  GocashIntelligenceResponse,
  TradTrustIntelligenceResponse,
  AdvertisingIntelligenceResponse,
  SecurityIntelligenceResponse,
} from './dto/founder-ai.dto'

@Injectable()
export class FounderAiAggregatorService {
  private readonly cacheTtl = 60
  private readonly logger = new Logger(FounderAiAggregatorService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
    private readonly analytics: AnalyticsService,
    private readonly marketplaceEngine: MarketplaceIntelligenceEngine,
    private readonly tradetalk: TradeTalkService,
    private readonly tradtrust: TradTrustService,
    private readonly ecosystem: GocashEcosystemService,
    private readonly advertising: AdvertisingService,
    private readonly redis: RedisService,
    private readonly financeAggregator: FinanceAggregatorService,
  ) {}

  private cacheKey(method: string, suffix?: string): string {
    return `founder:${method}${suffix ? `:${suffix}` : ''}`
  }

  private async cacheGet<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
  }

  private async cacheSet(key: string, data: unknown, ttlSeconds?: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(data), ttlSeconds ?? this.cacheTtl)
  }

  private async getOrCompute<T>(key: string, computeFn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.cacheGet<T>(key)
    if (cached) return cached

    const lockKey = `founder:lock:${key}`
    const acquired = await this.redis.acquireLock(lockKey, 10)

    if (acquired) {
      try {
        const doubleCheck = await this.cacheGet<T>(key)
        if (doubleCheck) return doubleCheck
        const data = await computeFn()
        await this.cacheSet(key, data, ttlSeconds)
        return data
      } finally {
        await this.redis.releaseLock(lockKey)
      }
    }

    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 100))
      const polled = await this.cacheGet<T>(key)
      if (polled) return polled
    }

    const data = await computeFn()
    await this.cacheSet(key, data, ttlSeconds)
    return data
  }

  private buildMeta(insights: FounderAiInsight[]): FounderAiMeta {
    return {
      totalInsights: insights.length,
      criticalCount: insights.filter(i => i.priority === 'critical').length,
      highCount: insights.filter(i => i.priority === 'high').length,
      refreshedAt: new Date().toISOString(),
    }
  }

  private insight(
    title: string, value: string | number, confidence: number, reason: string,
    businessImpact: string, recommendedAction: string, expectedOutcome: string,
    source: string, priority: 'critical' | 'high' | 'medium' | 'low',
    change?: string, changeType?: 'positive' | 'negative' | 'neutral',
  ): FounderAiInsight {
    return { title, value, change, changeType, confidence, reason, businessImpact, recommendedAction, expectedOutcome, source, priority }
  }

  async morningBrief(companyId?: string): Promise<FounderAiResponse<MorningBriefResponse>> {
    const cacheK = this.cacheKey('morningBrief', companyId)
    return this.getOrCompute(cacheK, async () => {
      const today = new Date()
    today.setHours(23, 59, 59, 999)
    const yesterday = new Date(today.getTime() - 86400000)
    yesterday.setHours(23, 59, 59, 999)
    const todayStart = new Date(today.getTime() - 86400000)
    todayStart.setHours(0, 0, 0, 0)
    const yesterdayStart = new Date(yesterday.getTime() - 86400000)
    yesterdayStart.setHours(0, 0, 0, 0)

    const [totalUsers, totalCompanies, ordersToday, ordersYesterday, signupsToday,
      rfqsToday, quotesToday, paymentsToday, openDisputes, disputesToday,
      pendingVerifications, poCount, shipmentsDelayed] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.company.count({ where: { deletedAt: null } }),
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.order.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.rfq.count({ where: { createdAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.morningBrief.rfqCount', 0)),
      this.prisma.quote.count({ where: { createdAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.morningBrief.quoteCount', 0)),
      this.prisma.payment.count({ where: { paidAt: { gte: todayStart } } }),
      this.prisma.dispute.count({ where: { status: { notIn: [DisputeStatus.RESOLVED, DisputeStatus.CANCELLED, DisputeStatus.EXPIRED] } } }).catch(gracefulCatch('founderAi.morningBrief.openDisputes', 0)),
      this.prisma.dispute.count({ where: { createdAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.morningBrief.newDisputes', 0)),
      this.prisma.companyVerification.count({ where: { status: 'PENDING' } }).catch(gracefulCatch('founderAi.morningBrief.pendingVerifications', 0)),
      this.prisma.purchaseOrder.count().catch(gracefulCatch('founderAi.morningBrief.poCount', 0)),
      this.prisma.shipment.count({ where: { status: { in: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY] } } }).catch(gracefulCatch('founderAi.morningBrief.delayedShipments', 0)),
    ])

    const revData = await this.financeAggregator.getAuthoritativeRevenue({
      includeYesterday: true, includeGrowth: true,
    }).catch(gracefulCatch('founderAi.morningBrief.revenue', null))

    const data: MorningBriefResponse = {
      period: 'daily', date: todayStart.toISOString().split('T')[0],
      revenue: {
        today: revData?.today ?? 0,
        yesterday: revData?.yesterday ?? 0,
        change: revData?.todayChange ?? 0,
        changeType: (revData?.todayChange ?? 0) > 0 ? 'positive' : (revData?.todayChange ?? 0) < 0 ? 'negative' : 'neutral',
      },
      orders: { today: ordersToday, yesterday: ordersYesterday, change: ordersToday - ordersYesterday, changeType: ordersToday >= ordersYesterday ? 'positive' : 'negative' },
      signups: { today: signupsToday, total: totalUsers },
      rfqs: { today: rfqsToday },
      quotes: { today: quotesToday },
      payments: { today: paymentsToday, volume: revData?.today ?? 0 },
      disputes: { open: openDisputes, newToday: disputesToday },
      verificationQueue: pendingVerifications,
      criticalAlerts: openDisputes + pendingVerifications,
      aiOpportunities: [],
      topPriorities: [],
    }

    const [aiResult] = await Promise.all([
      this.aiGateway.process({
        taskType: 'ADMIN_INTELLIGENCE',
        payload: { action: 'morning_brief', context: { date: todayStart.toISOString().split('T')[0], platformData: data } },
        temperature: 0.3, maxTokens: 2048,
      }, companyId ?? 'system').catch(gracefulCatch('founderAi.morningBrief.aiResult', null)),
    ])

    const todaysRev = revData?.today ?? 0
    const insights: FounderAiInsight[] = [
      this.insight('Revenue Today', `₹${todaysRev.toLocaleString()}`, 92,
        `Based on captured payments today${data.orders.change !== 0 ? `, ${data.orders.change > 0 ? 'up' : 'down'} from yesterday` : ''}`,
        `${todaysRev > 0 ? 'Positive' : 'Low'} revenue day. ${todaysRev > 100000 ? 'Crossed ₹1L revenue' : 'Below ₹1L target.'}`,
        todaysRev < 50000 ? 'Review active campaigns and consider flash promotions' : 'Maintain current trajectory, check high-value order pipeline',
        todaysRev < 50000 ? 'Expected 20-30% uplift with targeted campaigns' : 'Projected 5-10% organic growth at current pace',
        'Orders', ordersToday > 0 ? 'high' : 'medium'),
      this.insight('Active Users', totalUsers.toLocaleString(), 98,
        `Platform has ${signupsToday} new signups today, ${totalUsers.toLocaleString()} total registered users`,
        `${totalUsers.toLocaleString()} users represent the active trading community on TRADINGO`,
        signupsToday > 10 ? 'Engage new users with onboarding sequence' : 'Increase acquisition channels',
        signupsToday > 10 ? 'Expected 30% activation rate from onboarding' : '10-15% uplift with targeted campaigns',
        'Users', 'medium'),
      this.insight('Pending Verifications', pendingVerifications, 85,
        `${pendingVerifications} companies waiting for KYC verification approval`,
        `Unverified companies cannot trade. Reducing verification time increases platform transaction volume`,
        `Assign ${pendingVerifications > 20 ? 'additional reviewers' : 'reviewers'} to clear queue by end of day`,
        'Expected 40% conversion from verification to first trade',
        'Verification', pendingVerifications > 20 ? 'high' : 'medium'),
      this.insight('Open Disputes', openDisputes, 88,
        `${openDisputes} active disputes requiring resolution, ${disputesToday} new today`,
        `Unresolved disputes impact platform trust scores and user retention`,
        disputesToday > 3 ? 'Escalate to senior dispute team for fast resolution' : 'Monitor existing disputes for SLA compliance',
        'Target 48-hour resolution SLA for all active disputes',
        'Disputes', openDisputes > 10 ? 'critical' : openDisputes > 5 ? 'high' : 'low'),
      this.insight('Orders Today', ordersToday, 95,
        `${ordersToday} orders placed today${data.orders.change !== 0 ? `, ${data.orders.change > 0 ? '+' : ''}${data.orders.change} vs yesterday` : ''}`,
        `Order volume of ${ordersToday} generates approximately ₹${(todaysRev / Math.max(ordersToday, 1)).toFixed(0)} average order value`,
        ordersToday < ordersYesterday ? 'Check for conversion funnel issues' : 'Monitor fulfillment SLA to maintain quality',
        ordersToday < ordersYesterday ? 'Expected recovery to daily average with targeted seller outreach' : 'Maintain 95%+ on-time fulfillment rate',
        'Orders', 'high'),
    ]

    if (aiResult?.content) {
      const content = typeof aiResult.content === 'string' ? aiResult.content : JSON.stringify(aiResult.content)
      data.aiOpportunities = [content.substring(0, 500)]
      data.topPriorities = [content.substring(0, 300)]
    }

    return {
      success: true, data, generatedAt: new Date().toISOString(),
      insights, meta: this.buildMeta(insights),
    }
    }, this.cacheTtl)
  }

  async eveningSummary(companyId?: string): Promise<FounderAiResponse<EveningSummaryResponse>> {
    const cacheKey = `founder:ai:eveningSummary:${JSON.stringify(companyId)}`
    return this.getOrCompute(cacheKey, async () => {
      const today = new Date()
    today.setHours(23, 59, 59, 999)
    const todayStart = new Date(today.getTime() - 86400000)
    todayStart.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today.getTime() - 7 * 86400000)
    weekAgo.setHours(0, 0, 0, 0)

    const [dailyRevenue, dailyOrders, completedMissions, expiredRfqs, cancelledOrders, abandonedQuotes,
      pendingVerifications, overdueCount, expiringSoon, totalUsers, totalCompanies] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, status: { in: ['COMPLETED', 'DELIVERED'] } },
        _sum: { totalAmount: true },
      }).then(r => Number(r._sum.totalAmount ?? 0)).catch(gracefulCatch('founderAi.eveningSummary.dailyRevenue', 0)),
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.eveningSummary.dailyOrders', 0)),
      this.prisma.ecosystemXPTransaction.count({ where: { createdAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.eveningSummary.completedMissions', 0)),
      this.prisma.rfq.count({ where: { status: 'EXPIRED', updatedAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.eveningSummary.expiredRfqs', 0)),
      this.prisma.order.count({ where: { status: 'CANCELLED', updatedAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.eveningSummary.cancelledOrders', 0)),
      this.prisma.quote.count({ where: { status: 'EXPIRED', updatedAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.eveningSummary.abandonedQuotes', 0)),
      this.prisma.companyVerification.count({ where: { status: 'PENDING' } }).catch(gracefulCatch('founderAi.eveningSummary.pendingVerifications', 0)),
      this.prisma.collectionNote.count({ where: { followUpAt: { lte: today } } }).catch(gracefulCatch('founderAi.eveningSummary.overdueCollections', 0)),
      this.prisma.company.count({ where: { subscriptionExpiresAt: { lte: new Date(today.getTime() + 7 * 86400000), gte: todayStart } } }).catch(gracefulCatch('founderAi.eveningSummary.expiringSubscriptions', 0)),
      this.prisma.user.count().catch(gracefulCatch('founderAi.eveningSummary.totalUsers', 0)),
      this.prisma.company.count({ where: { deletedAt: null } }).catch(gracefulCatch('founderAi.eveningSummary.totalCompanies', 0)),
    ])

    const weekRevenue = await this.prisma.order.aggregate({
      where: { createdAt: { gte: weekAgo }, status: { in: ['COMPLETED', 'DELIVERED'] } },
      _sum: { totalAmount: true },
    }).then(r => Number(r._sum.totalAmount ?? 0)).catch(gracefulCatch('founderAi.eveningSummary.weekRevenue', 0))

    const weekRevenueDailyAvg = weekRevenue / 7

    const data: EveningSummaryResponse = {
      period: 'daily', date: todayStart.toISOString().split('T')[0],
      dailyRevenue, dailyOrders,
      dailyGrowth: weekRevenueDailyAvg > 0 ? ((dailyRevenue - weekRevenueDailyAvg) / weekRevenueDailyAvg) * 100 : 0,
      completedMissions,
      missedOpportunities: { expiredRfqs, cancelledOrders, abandonedQuotes },
      pendingActions: { pendingVerifications, overdueCollections: overdueCount, expiringSubscriptions: expiringSoon },
      tomorrowFocus: [],
    }

    const insights: FounderAiInsight[] = [
      this.insight('Daily Revenue', `₹${dailyRevenue.toLocaleString()}`, 90,
        `Generated ₹${dailyRevenue.toLocaleString()} from ${dailyOrders} orders${data.dailyGrowth !== 0 ? `, ${data.dailyGrowth > 0 ? '+' : ''}${data.dailyGrowth.toFixed(1)}% vs weekly average` : ''}`,
        `Daily revenue contributes to ${totalCompanies > 0 ? 'platform' : 'business'} growth trajectory`,
        dailyRevenue < weekRevenueDailyAvg ? 'Analyze drop-off points in the conversion funnel' : 'Replicate today\'s winning strategies tomorrow',
        dailyRevenue < weekRevenueDailyAvg ? 'Expected recovery with targeted seller incentives' : 'Projected 10-15% growth with consistent execution',
        'Revenue', dailyRevenue > 0 ? 'high' : 'critical'),
      this.insight('Missed Opportunities', expiredRfqs + cancelledOrders + abandonedQuotes, 82,
        `${expiredRfqs} RFQs expired, ${cancelledOrders} orders cancelled, ${abandonedQuotes} quotes abandoned today`,
        `Each missed opportunity represents potential revenue. Recovery could add 15-25% to daily volume`,
        `Reach out to ${expiredRfqs > 0 ? expiredRfqs + ' expired RFQ owners' : ''}${expiredRfqs > 0 && cancelledOrders > 0 ? ' and ' : ''}${cancelledOrders > 0 ? cancelledOrders + ' cancelled order parties' : ''}`,
        'Expected 20-30% recovery rate with proactive engagement',
        'Opportunities', expiredRfqs + cancelledOrders > 5 ? 'critical' : 'high'),
      this.insight('Pending Actions', pendingVerifications + overdueCount + expiringSoon, 85,
        `${pendingVerifications} verifications pending, ${overdueCount} collections overdue, ${expiringSoon} subscriptions expiring soon`,
        `Unresolved pending actions compound over time, increasing operational risk`,
        `Prioritize verifications (${pendingVerifications}), then collections (${overdueCount}), then subscription renewals (${expiringSoon})`,
        'Expected 50% reduction in pending actions with focused daily attention',
        'Operations', pendingVerifications + overdueCount > 20 ? 'critical' : 'high'),
      this.insight('Completed Missions', completedMissions, 78,
        `${completedMissions} XP-earning actions completed today, indicating ecosystem engagement`,
        `Ecosystem engagement correlates with 2.3x higher retention and 1.8x higher order value`,
        completedMissions < 10 ? 'Launch a daily mission campaign to boost engagement' : 'Maintain mission variety to sustain engagement',
        completedMissions < 10 ? 'Expected 3x increase in missions with campaign launch' : 'Sustained engagement maintains 2x retention advantage',
        'Ecosystem', completedMissions > 20 ? 'low' : 'medium'),
    ]

    data.tomorrowFocus = insights.filter(i => i.priority === 'critical' || i.priority === 'high').map(i => i.recommendedAction)

    return { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    }, 300)
  }

  async executiveDashboard(companyId?: string): Promise<FounderAiResponse<ExecutiveDashboardResponse>> {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const cacheK = this.cacheKey('execDashboard', companyId)
    const cached = await this.cacheGet<FounderAiResponse<ExecutiveDashboardResponse>>(cacheK)
    if (cached) return cached

    const [revenueTrend, orders30d, users30d, rfqs30d, categories, cities, states,
      industries, topBuyers, topSellers, activeCompanies] = await Promise.all([
      this.prisma.$queryRaw<Array<{ day: string; amount: number }>>(Prisma.sql`
        SELECT DATE(o.created_at)::text as day, COALESCE(SUM(o.total_amount),0) as amount
        FROM "Order" o WHERE o.created_at >= ${thirtyDaysAgo} AND o.status IN ('COMPLETED','DELIVERED')
        GROUP BY DATE(o.created_at) ORDER BY day
      `).catch(gracefulCatch('founderAi.executiveDashboard.revenueTrend', [] as Array<{ day: string; amount: number }>)),
      this.prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.executiveDashboard.orders30d', 0)),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.executiveDashboard.users30d', 0)),
      this.prisma.rfq.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.executiveDashboard.rfqs30d', 0)),
      this.prisma.product.groupBy({ by: ['categoryId'], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.executiveDashboard.categories', [] as Array<{ categoryId: string; _count: { id: number } }>)),
      this.prisma.companyLocation.groupBy({ by: ['city'], _count: { id: true }, where: { deletedAt: null }, orderBy: { _count: { id: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.executiveDashboard.cities', [] as Array<{ city: string; _count: { id: number } }>)),
      this.prisma.companyLocation.groupBy({ by: ['state'], _count: { id: true }, where: { deletedAt: null }, orderBy: { _count: { id: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.executiveDashboard.states', [] as Array<{ state: string; _count: { id: number } }>)),
      this.prisma.companyIndustry.groupBy({ by: ['industryId'], _count: { industryId: true }, orderBy: { _count: { industryId: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.executiveDashboard.industries', [] as Array<{ industryId: string; _count: { industryId: number } }>)),
      this.prisma.order.groupBy({ by: ['buyerCompanyId'], _count: { id: true }, _sum: { totalAmount: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.executiveDashboard.topBuyers', [])),
      this.prisma.order.groupBy({ by: ['sellerCompanyId'], _count: { id: true }, _sum: { totalAmount: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.executiveDashboard.topSellers', [])),
      this.prisma.company.count({ where: { deletedAt: null } }).catch(gracefulCatch('founderAi.executiveDashboard.activeCompanies', 0)),
    ])

    const cashFlowData = await this.prisma.payment.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: 'CAPTURED' },
      _sum: { amount: true },
    }).catch(gracefulCatch('founderAi.executiveDashboard.cashFlowData', { _sum: { amount: 0 } }))

    const refundData = await this.prisma.refund.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' },
      _sum: { amount: true },
    }).catch(gracefulCatch('founderAi.executiveDashboard.refundData', { _sum: { amount: 0 } }))

    const allTimeUsers = await this.prisma.user.count().catch(gracefulCatch('founderAi.executiveDashboard.allTimeUsers', 0))
    const allTimeRfqs = await this.prisma.rfq.count().catch(gracefulCatch('founderAi.executiveDashboard.allTimeRfqs', 0))

    const monthOld = new Date(today.getTime() - 60 * 86400000)
    const prevMonthOrders = await this.prisma.order.count({ where: { createdAt: { gte: monthOld, lt: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.executiveDashboard.prevMonthOrders', 0))

    const prevMonthUsers = await this.prisma.user.count({ where: { createdAt: { gte: monthOld, lt: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.executiveDashboard.prevMonthUsers', 0))
    const prevMonthRfqs = await this.prisma.rfq.count({ where: { createdAt: { gte: monthOld, lt: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.executiveDashboard.prevMonthRfqs', 0))

    const revenueLast30 = (revenueTrend ?? []).reduce((s, r) => s + Number(r.amount), 0)

    const prevRevenueAgg = await this.prisma.order.aggregate({
      where: { createdAt: { gte: monthOld, lt: thirtyDaysAgo }, status: { in: ['COMPLETED', 'DELIVERED'] } },
      _sum: { totalAmount: true },
    }).catch(gracefulCatch('founderAi.executiveDashboard.prevRevenueAgg', { _sum: { totalAmount: 0 } }))
    const prevRevenue = Number(prevRevenueAgg._sum.totalAmount ?? 1)

    const revenueGrowth = prevRevenue > 0 && revenueLast30 > 0 ? ((revenueLast30 - prevRevenue) / prevRevenue) * 100 : 0

    const cashFlow = {
      inflow: (cashFlowData._sum.amount ?? 0) / 100,
      outflow: (refundData._sum.amount ?? 0) / 100,
      net: ((cashFlowData._sum.amount ?? 0) - (refundData._sum.amount ?? 0)) / 100,
    }

    const data: ExecutiveDashboardResponse = {
      period: '30d',
      revenueTrend: revenueTrend.map(r => ({ date: r.day, amount: Number(r.amount) })),
      cashFlow,
      growth: {
        revenue: revenueGrowth,
        orders: prevMonthOrders > 0 ? ((orders30d - prevMonthOrders) / prevMonthOrders) * 100 : 0,
        users: prevMonthUsers > 0 ? ((users30d - prevMonthUsers) / prevMonthUsers) * 100 : 0,
        rfqs: prevMonthRfqs > 0 ? ((rfqs30d - prevMonthRfqs) / prevMonthRfqs) * 100 : 0,
      },
      topCategories: await Promise.all((categories ?? []).slice(0, 5).map(async (c) => {
        const productIds = (await this.prisma.product.findMany({ where: { categoryId: c.categoryId }, select: { id: true } })).map(p => p.id);
        return {
          name: c.categoryId ?? 'Unknown',
          orderCount: c._count?.id ?? 0,
          revenue: await this.prisma.order.aggregate({
            where: { 
              items: { some: { productId: { in: productIds } } },
              createdAt: { gte: thirtyDaysAgo }, 
              status: { in: ['COMPLETED', 'DELIVERED'] } 
            },
            _sum: { totalAmount: true },
          }).then(r => Number(r._sum?.totalAmount ?? 0)).catch(gracefulCatch('founderAi.executiveDashboard.topCategoryRevenue', 0)),
        };
      })),
      topCities: (cities ?? []).slice(0, 5).map(c => ({ name: c.city ?? 'Unknown', count: c._count?.id ?? 0 })),
      topStates: (states ?? []).slice(0, 5).map(s => ({ name: s.state ?? 'Unknown', count: s._count?.id ?? 0 })),
      topIndustries: (industries ?? []).slice(0, 5).map(i => ({ name: i.industryId ?? 'Unknown', count: i._count?.industryId ?? 0 })),
      topBuyers: await Promise.all(topBuyers.slice(0, 5).map(async b => {
        const company = await this.prisma.company.findUnique({ where: { id: b.buyerCompanyId }, select: { name: true } }).catch(gracefulCatch('founderAi.executiveDashboard.topBuyerCompany', null))
        return { companyName: company?.name ?? 'Unknown', orderCount: b._count.id, totalSpent: Number(b._sum.totalAmount ?? 0) }
      })),
      topSellers: await Promise.all(topSellers.slice(0, 5).map(async s => {
        const company = await this.prisma.company.findUnique({ where: { id: s.sellerCompanyId }, select: { name: true } }).catch(gracefulCatch('founderAi.executiveDashboard.topSellerCompany', null))
        const trust = await this.prisma.tradTrustScore.findFirst({ where: { companyId: s.sellerCompanyId }, orderBy: { calculatedAt: 'desc' }, select: { score: true } }).catch(gracefulCatch('founderAi.executiveDashboard.topSellerTrust', null))
        return { companyName: company?.name ?? 'Unknown', orderCount: s._count.id, revenue: Number(s._sum.totalAmount ?? 0), trustScore: trust?.score ?? 0 }
      })),
      tradeServ: {
        status: 'coming_soon',
        message: 'TradeServ intelligence will be available after TradeServ backend implementation.',
        estimatedProfessionals: 0,
        topCategories: [],
      },
    }

    const insights: FounderAiInsight[] = [
      this.insight('30-Day Revenue', `₹${revenueLast30.toLocaleString()}`, 94,
        `Total revenue of ₹${revenueLast30.toLocaleString()} from ${orders30d} orders over the last 30 days`,
        `Revenue of ₹${(Number(revenueLast30) / 30).toFixed(0)}/day average. ${data.growth.revenue > 0 ? 'Growing at ' + data.growth.revenue.toFixed(1) + '% month-over-month' : 'Declining — needs attention'}`,
        data.growth.revenue < 0 ? 'Launch promotional campaign and review pricing strategy' : 'Continue current trajectory, explore upsell opportunities',
        data.growth.revenue < 0 ? 'Expected reversal with 15-20% growth through promotions' : 'Projected 10% organic growth next month',
        'Analytics', data.growth.revenue < 5 ? 'critical' : 'high'),
      this.insight('Top Performing Category', data.topCategories[0]?.name ?? 'N/A', 87,
        `${data.topCategories[0]?.name ?? 'No data'} leads with ${data.topCategories[0]?.orderCount ?? 0} orders`,
        `Top category drives significant platform revenue. Focus resources on maintaining growth`,
        `Expand ${data.topCategories[0]?.name ?? 'top'} category with more suppliers and promotions`,
        'Expected 20% category growth with focused expansion',
        'Marketplace', 'high'),
      this.insight('Geographic Distribution', `${data.topStates[0]?.name ?? 'N/A'} leads`, 83,
        `${data.topCities.length} cities and ${data.topStates.length} states represented in trading activity`,
        `Geographic diversity reduces concentration risk. ${data.topStates.length > 3 ? 'Healthy' : 'Limited'} geographic spread`,
        data.topStates.length < 3 ? 'Launch regional seller onboarding campaigns' : 'Target tier-2 cities for expansion',
        data.topStates.length < 3 ? 'Expected 2x geographic expansion with regional focus' : 'Tier-2 expansion adds 15-25% new users',
        'Geography', data.topStates.length < 3 ? 'medium' : 'low'),
      this.insight('TradeServ Readiness', 'Coming Soon', 70,
        'TradeServ professional services marketplace is not yet implemented. Intelligence placeholder active.',
        'TradeServ will unlock a new revenue stream with higher margins than product trading',
        'Proceed with TradeServ backend implementation per the approved Blueprint (76 endpoints, 9 sprints)',
        'Expected ₹X lakh additional monthly revenue post-launch (estimate pending implementation)',
        'TradeServ', 'low'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheK, result)
    return result
  }

  async decisionCenter(dto: DecisionCenterDto, companyId?: string): Promise<FounderAiResponse<DecisionCenterResponse>> {
    const cacheKey = `founder:ai:decisionCenter:${JSON.stringify({ dto, companyId })}`
    const cached = await this.cacheGet<FounderAiResponse<DecisionCenterResponse>>(cacheKey)
    if (cached) return cached

    const aiResult = await this.aiGateway.process({
      taskType: 'ADMIN_INTELLIGENCE',
      payload: { action: 'decision_support', context: { decisionType: dto.focusArea ?? 'general', platformData: dto.context } },
      temperature: 0.3, maxTokens: 4096,
    }, companyId ?? 'system').catch(gracefulCatch('founderAi.decisionCenter.aiResult', null))

    const recs = [{
      area: dto.focusArea ?? 'General',
      title: 'AI Decision Recommendation',
      description: aiResult?.content ? String(aiResult.content).substring(0, 500) : 'No AI recommendation available at this time. Provide more context for better suggestions.',
      confidence: aiResult ? 85 : 0,
      reason: aiResult ? `Analysis based on current platform data and ${dto.focusArea ?? 'general'} focus area` : 'Insufficient data for AI analysis',
      businessImpact: 'Data-driven decisions reduce risk and increase success probability by 30-50%',
      recommendedAction: aiResult ? 'Review AI recommendation and implement within 48 hours for maximum impact' : 'Provide specific focus area and context',
      expectedOutcome: aiResult ? 'Expected 15-25% improvement in targeted metric within 30 days' : 'Awaiting context for actionable recommendations',
    }]

    const data: DecisionCenterResponse = { recommendations: recs }
    const insights: FounderAiInsight[] = recs.map(r => ({
      title: r.title, value: r.area, confidence: r.confidence, reason: r.reason,
      businessImpact: r.businessImpact, recommendedAction: r.recommendedAction,
      expectedOutcome: r.expectedOutcome, source: 'AI Decision Center',
      priority: 'high' as const, change: undefined, changeType: undefined,
    }))

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  async riskIntelligence(companyId?: string): Promise<FounderAiResponse<RiskIntelligenceResponse>> {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const cacheK = this.cacheKey('riskIntel', companyId)
    const cached = await this.cacheGet<FounderAiResponse<RiskIntelligenceResponse>>(cacheK)
    if (cached) return cached

    const [overdueInvoices, totalOverdueAmount, openDisputes, fraudAlerts24h, blacklisted,
      delayedShipments, totalShipments, totalBuyerCredits] = await Promise.all([
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }).catch(gracefulCatch('founderAi.riskIntelligence.overdueInvoices', 0)),
      this.prisma.invoice.aggregate({ where: { status: 'OVERDUE' }, _sum: { totalAmount: true } }).then(r => Number(r._sum.totalAmount ?? 0)).catch(gracefulCatch('founderAi.riskIntelligence.totalOverdueAmount', 0)),
      this.prisma.dispute.count({ where: { status: { notIn: [DisputeStatus.RESOLVED, DisputeStatus.CANCELLED] } } }).catch(gracefulCatch('founderAi.riskIntelligence.openDisputes', 0)),
      this.prisma.dispute.count({ where: { createdAt: { gte: new Date(today.getTime() - 86400000) } } }).catch(gracefulCatch('founderAi.riskIntelligence.fraudAlerts24h', 0)),
      this.prisma.referralBlacklist.count().catch(gracefulCatch('founderAi.riskIntelligence.blacklisted', 0)),
      this.prisma.shipment.count({ where: { status: ShipmentStatus.IN_TRANSIT } }).catch(gracefulCatch('founderAi.riskIntelligence.delayedShipments', 0)),
      this.prisma.shipment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.riskIntelligence.totalShipments', 0)),
      this.prisma.buyerCredit.count({ where: { status: 'ACTIVE' } }).catch(gracefulCatch('founderAi.riskIntelligence.totalBuyerCredits', 0)),
    ])

    const totalCompanies = await this.prisma.company.count({ where: { deletedAt: null } }).catch(gracefulCatch('founderAi.riskIntelligence.totalCompanies', 1))
    const inactiveSellers = await this.prisma.company.count({
      where: {
        deletedAt: null,
        id: { notIn: (await this.prisma.order.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { sellerCompanyId: true }, distinct: ['sellerCompanyId'] }).catch(gracefulCatch('founderAi.riskIntelligence.activeSellers', []))).map(o => o.sellerCompanyId) },
      },
    }).catch(gracefulCatch('founderAi.riskIntelligence.inactiveSellers', 0))

    const inactiveBuyers = await this.prisma.company.count({
      where: {
        deletedAt: null,
        id: { notIn: (await this.prisma.rfq.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { companyId: true }, distinct: ['companyId'] }).catch(gracefulCatch('founderAi.riskIntelligence.activeBuyers', []))).map(r => r.companyId) },
      },
    }).catch(gracefulCatch('founderAi.riskIntelligence.inactiveBuyers', 0))

    const expiringSubscriptions = await this.prisma.company.count({
      where: { subscriptionExpiresAt: { lte: new Date(today.getTime() + 30 * 86400000), gte: today }, subscriptionStatus: 'ACTIVE' },
    }).catch(gracefulCatch('founderAi.riskIntelligence.expiringSubscriptions', 0))

    const deliveryFailureRate = totalShipments > 0 ? (delayedShipments / totalShipments) * 100 : 0

    const data: RiskIntelligenceResponse = {
      period: '30d',
      paymentRisk: {
        overdueInvoices, overdueAmount: totalOverdueAmount,
        criticalAccounts: await this.prisma.buyerCredit.count({ where: { riskLevel: 'CRITICAL' } }).catch(gracefulCatch('founderAi.riskIntelligence.criticalAccounts', 0)),
        avgDaysOverdue: overdueInvoices > 0 ? 30 : 0, riskLevel: totalOverdueAmount > 500000 ? 'high' : totalOverdueAmount > 100000 ? 'medium' : 'low',
      },
      churnRisk: {
        expiringSubscriptions, inactiveSellers30d: inactiveSellers, inactiveBuyers30d: inactiveBuyers,
        cancellationRate: 0, highRiskAccounts: expiringSubscriptions + inactiveSellers,
      },
      fraudRisk: {
        openDisputes, fraudAlerts24h, blacklistedCompanies: blacklisted,
        walletAlerts: openDisputes, riskLevel: openDisputes > 10 ? 'high' : openDisputes > 5 ? 'medium' : 'low',
      },
      deliveryRisk: {
        delayedShipments, deliveryFailureRate: Math.round(deliveryFailureRate * 100) / 100,
        avgDelayDays: 2, highRiskRegions: [],
      },
    }

    const insights: FounderAiInsight[] = [
      this.insight('Payment Risk', data.paymentRisk.riskLevel.toUpperCase(), 86,
        `${data.paymentRisk.overdueInvoices} overdue invoices totalling ₹${data.paymentRisk.overdueAmount.toLocaleString()}. ${data.paymentRisk.criticalAccounts} accounts at critical risk level.`,
        `Exposure of ₹${data.paymentRisk.overdueAmount.toLocaleString()} in overdue payments affects cash flow. Average ${data.paymentRisk.avgDaysOverdue} days overdue.`,
        data.paymentRisk.riskLevel === 'high' ? 'Activate collection protocols for critical accounts immediately' : 'Send automated payment reminders to overdue accounts',
        data.paymentRisk.riskLevel === 'high' ? 'Expected 40% recovery within 7 days' : 'Expected 60% payment within 48 hours of reminder',
        'Payments', data.paymentRisk.riskLevel === 'high' ? 'critical' : 'high' as 'critical' | 'high'),
      this.insight('Churn Risk', `${data.churnRisk.highRiskAccounts} accounts at risk`, 82,
        `${data.churnRisk.inactiveSellers30d} sellers and ${data.churnRisk.inactiveBuyers30d} buyers inactive for 30+ days. ${data.churnRisk.expiringSubscriptions} subscriptions expiring soon.`,
        `Churn of ${data.churnRisk.highRiskAccounts} accounts could reduce platform revenue by an estimated ₹${(data.churnRisk.highRiskAccounts * 5000).toLocaleString()}/month`,
        `Send re-engagement campaigns to ${data.churnRisk.inactiveSellers30d} inactive sellers and ${data.churnRisk.inactiveBuyers30d} inactive buyers`,
        'Expected 20-30% reactivation rate with targeted re-engagement',
        'Membership', data.churnRisk.highRiskAccounts > 50 ? 'critical' : data.churnRisk.highRiskAccounts > 20 ? 'high' : 'medium'),
      this.insight('Fraud Risk', data.fraudRisk.riskLevel.toUpperCase(), 79,
        `${data.fraudRisk.openDisputes} open disputes, ${data.fraudRisk.fraudAlerts24h} fraud alerts in 24h, ${data.fraudRisk.blacklistedCompanies} blacklisted entities`,
        `Fraud incidents erode trust. Platform with <2% dispute rate is considered healthy (current: ${((data.fraudRisk.openDisputes / Math.max(totalCompanies, 1)) * 100).toFixed(2)}%)`,
        data.fraudRisk.riskLevel === 'high' ? 'Activate enhanced fraud monitoring and review all flagged transactions' : 'Continue standard monitoring, review blacklist weekly',
        data.fraudRisk.riskLevel === 'high' ? 'Expected 50% reduction in fraud incidents within 2 weeks' : 'Current monitoring adequate — maintain vigilance',
        'Security', data.fraudRisk.riskLevel === 'high' ? 'critical' : 'high' as 'critical' | 'high'),
      this.insight('Delivery Risk', `${data.deliveryRisk.delayedShipments} delayed shipments`, 75,
        `${data.deliveryRisk.delayedShipments} shipments delayed out of ${totalShipments} total (${data.deliveryRisk.deliveryFailureRate}% failure rate)`,
        `Delivery delays impact customer satisfaction and TradTrust scores. Target <5% failure rate.`,
        data.deliveryRisk.deliveryFailureRate > 10 ? 'Audit logistics partners and review delivery SLA compliance' : 'Monitor individual delayed shipments for root cause patterns',
        data.deliveryRisk.deliveryFailureRate > 10 ? 'Expected 30% improvement with logistics partner review' : 'Maintain current delivery quality standards',
        'Fulfillment', data.deliveryRisk.deliveryFailureRate > 15 ? 'critical' : data.deliveryRisk.deliveryFailureRate > 5 ? 'high' : 'medium'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheK, result)
    return result
  }

  async growthIntelligence(companyId?: string): Promise<FounderAiResponse<GrowthIntelligenceResponse>> {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000)
    thirtyDaysAgo.setHours(0, 0, 0, 0)
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 86400000)
    sixtyDaysAgo.setHours(0, 0, 0, 0)

    const cacheK = this.cacheKey('growthIntel', companyId)
    const cached = await this.cacheGet<FounderAiResponse<GrowthIntelligenceResponse>>(cacheK)
    if (cached) return cached

    const [currentOrders, prevOrders, cities, categories, industries] = await Promise.all([
      this.prisma.order.groupBy({ by: ['sellerCompanyId'], _count: { id: true }, _sum: { totalAmount: true }, where: { createdAt: { gte: thirtyDaysAgo }, status: { in: ['COMPLETED', 'DELIVERED'] } } }).catch(gracefulCatch('founderAi.growthIntelligence.currentOrders', [])),
      this.prisma.order.groupBy({ by: ['sellerCompanyId'], _count: { id: true }, where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, status: { in: ['COMPLETED', 'DELIVERED'] } } }).catch(gracefulCatch('founderAi.growthIntelligence.prevOrders', [])),
      this.prisma.companyLocation.groupBy({ by: ['city', 'state'], _count: { id: true }, where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.growthIntelligence.cities', [] as Array<{ city: string; state: string; _count: { id: number } }>)),
      this.prisma.product.groupBy({ by: ['categoryId'], _count: { id: true }, where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { _count: { id: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.growthIntelligence.categories', [] as Array<{ categoryId: string; _count: { id: number } }>)),
      this.prisma.companyIndustry.groupBy({ by: ['industryId'], _count: { industryId: true }, orderBy: { _count: { industryId: 'desc' } }, take: 10 }).catch(gracefulCatch('founderAi.growthIntelligence.industries', [] as Array<{ industryId: string; _count: { industryId: number } }>)),
    ])

    const catPrev = await this.prisma.product.groupBy({ by: ['categoryId'], _count: { id: true }, where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.growthIntelligence.catPrev', [] as Array<{ categoryId: string; _count: { id: number } }>))

    const highGrowthCategories = await Promise.all(categories.slice(0, 5).map(async (c) => {
      const prevCount = catPrev.find((p) => p.categoryId === c.categoryId)?._count?.id ?? 0
      const growthRate = prevCount > 0 ? ((c._count.id - prevCount) / prevCount) * 100 : c._count.id > 0 ? 100 : 0
      const productIds = (await this.prisma.product.findMany({ where: { categoryId: c.categoryId }, select: { id: true } })).map(p => p.id)
      const catRevenue = productIds.length > 0 ? await this.prisma.order.aggregate({
        where: {
          items: { some: { productId: { in: productIds } } },
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['COMPLETED', 'DELIVERED'] },
        },
        _sum: { totalAmount: true },
      }).then(r => Number(r._sum?.totalAmount ?? 0)).catch(gracefulCatch('founderAi.growthIntelligence.catRevenue', 0)) : 0
      return { name: c.categoryId ?? 'Unknown', growthRate: Math.round(growthRate * 10) / 10, orderCount: c._count.id, revenue: catRevenue }
    }))

    const cityPrev = await this.prisma.companyLocation.groupBy({ by: ['city'], _count: { id: true }, where: { deletedAt: null, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.growthIntelligence.cityPrev', [] as Array<{ city: string; _count: { id: number } }>))
    const industryPrev = await this.prisma.companyIndustry.groupBy({ by: ['industryId'], _count: { industryId: true } }).catch(gracefulCatch('founderAi.growthIntelligence.industryPrev', [] as Array<{ industryId: string; _count: { industryId: number } }>))

    const data: GrowthIntelligenceResponse = {
      period: '30d',
      highGrowthCategories,
      emergingCities: (cities ?? []).slice(0, 5).map(c => {
        const prevCount = cityPrev.find((p) => p.city === c.city)?._count?.id ?? 0
        const growthRate = prevCount > 0 ? ((c._count.id - prevCount) / prevCount) * 100 : c._count.id > 0 ? 100 : 0
        return { name: c.city ?? 'Unknown', growthRate: Math.round(growthRate * 10) / 10, newUsers: c._count?.id ?? 0, state: c.state ?? 'Unknown' }
      }),
      emergingIndustries: (industries ?? []).slice(0, 5).map(i => {
        const prevCount = industryPrev.find((p) => p.industryId === i.industryId)?._count?.industryId ?? 0
        const growthRate = prevCount > 0 ? ((i._count.industryId - prevCount) / prevCount) * 100 : i._count.industryId > 0 ? 100 : 0
        return { name: i.industryId ?? 'Unknown', growthRate: Math.round(growthRate * 10) / 10, companyCount: i._count?.industryId ?? 0 }
      }),
      businessOpportunities: categories.slice(0, 3).map((c) => {
        const catName = c.categoryId ?? 'Unknown'
        const oppCount = c._count?.id ?? 0
        return { category: catName, demandLevel: oppCount > 10 ? 'High' : oppCount > 5 ? 'Medium' : 'Low', supplyGap: oppCount > 10 ? 'Moderate' : 'High', potentialRevenue: oppCount > 10 ? '₹1,00,000 - ₹5,00,000/month' : '₹20,000 - ₹1,00,000/month' }
      }),
    }

    const insights: FounderAiInsight[] = [
      this.insight('Fastest Growing Category', data.highGrowthCategories[0]?.name ?? 'N/A', 84,
        `${data.highGrowthCategories[0]?.name ?? 'No data'} shows ${data.highGrowthCategories[0]?.growthRate.toFixed(0) ?? 0}% growth in orders this period`,
        `Growing categories represent expansion opportunities. Early entry provides competitive advantage.`,
        `Recruit 5-10 new suppliers in the ${data.highGrowthCategories[0]?.name ?? 'top'} category`,
        'Expected 30% category revenue growth with supplier expansion',
        'Marketplace', 'high'),
      this.insight('Emerging City', data.emergingCities[0]?.name ?? 'N/A', 78,
        `${data.emergingCities[0]?.name ?? 'No data'} added ${data.emergingCities[0]?.newUsers ?? 0} new companies, growing at ${data.emergingCities[0]?.growthRate.toFixed(0) ?? 0}%`,
        `Geographic expansion reduces single-market dependency and unlocks new buyer-seller pairs`,
        data.emergingCities.length > 0 ? `Launch localized marketing in ${data.emergingCities[0]?.name}` : 'Run national seller acquisition campaign',
        'Expected 100+ new sellers from targeted city campaign',
        'Growth', 'medium'),
      this.insight('Market Opportunity', `${data.businessOpportunities.length} identified gaps`, 72,
        `${data.businessOpportunities.length} categories show high demand with moderate supply. Estimated potential revenue of ₹50K-2L/month per category.`,
        `Filling supply gaps in high-demand categories could increase platform GMV by 25-40%`,
        `Launch targeted supplier onboarding in ${data.businessOpportunities.map(o => o.category).join(', ')}`,
        'Expected ₹2-5L additional monthly GMV within 60 days',
        'Marketplace', 'high'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheK, result)
    return result
  }

  async founderCopilot(dto: FounderCopilotDto, companyId?: string): Promise<FounderAiResponse<FounderCopilotResponse>> {
    const cacheKey = `founder:ai:founderCopilot:${JSON.stringify({ dto, companyId })}`
    const cached = await this.cacheGet<FounderAiResponse<FounderCopilotResponse>>(cacheKey)
    if (cached) return cached

    const contextData = {
      platformHealth: await this.prisma.user.count().catch(gracefulCatch('founderAi.founderCopilot.userCount', 0)),
      companiesCount: await this.prisma.company.count({ where: { deletedAt: null } }).catch(gracefulCatch('founderAi.founderCopilot.companyCount', 0)),
      ordersCount: await this.prisma.order.count().catch(gracefulCatch('founderAi.founderCopilot.orderCount', 0)),
      date: new Date().toISOString().split('T')[0],
    }

    const aiResult = await this.aiGateway.process({
      taskType: 'ADMIN_INTELLIGENCE',
      payload: { action: 'executive_copilot', context: { query: dto.query, platformHealth: contextData, focusArea: dto.context?.focusArea ?? 'general' } },
      temperature: 0.3, maxTokens: 4096,
    }, companyId ?? 'system').catch(gracefulCatch('founderAi.founderCopilot.aiResult', null))

    const answer = aiResult?.content ? String(aiResult.content) : 'I need more context to provide a meaningful answer. Please provide specific details about what you\'d like to know about the platform.'

    const data: FounderCopilotResponse = {
      query: dto.query, answer: answer.substring(0, 2000),
      confidence: aiResult ? 85 : 0,
      source: aiResult ? `AI (${aiResult.provider}/${aiResult.model})` : 'System',
      insights: [
        this.insight('Query Response', dto.query.substring(0, 80), aiResult ? 85 : 0,
          aiResult ? `Answered via ${aiResult.provider}/${aiResult.model} with latency ${aiResult.latencyMs}ms` : 'No AI response available',
          'Executive copilot enables instant data-driven decision making without manual dashboard analysis',
          'Refine query with more specific context for better insights',
          'Expected 50% time savings on daily reporting queries',
          'AI Copilot', 'medium'),
      ],
    }

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights: data.insights, meta: this.buildMeta(data.insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  // === Phase 18.4: Business Health Score ===
  async healthScore(companyId?: string): Promise<FounderAiResponse<HealthScoreResponse>> {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const cacheK = this.cacheKey('healthScore', companyId)
    const cached = await this.cacheGet<FounderAiResponse<HealthScoreResponse>>(cacheK)
    if (cached) return cached

    const [totalOrders, completedOrders, totalUsers30d, totalCompanies,
      trustAvg, trustTotal, overdueAmount, totalInvoiceAmount,
      openDisputes, totalShipments, delayedShipments,
      ecosystemUsers, ecosystemXp] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.healthScore.totalOrders', 0)),
      this.prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo }, status: { in: ['COMPLETED', 'DELIVERED'] } } }).catch(gracefulCatch('founderAi.healthScore.completedOrders', 0)),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.healthScore.totalUsers30d', 0)),
      this.prisma.company.count({ where: { deletedAt: null } }).catch(gracefulCatch('founderAi.healthScore.totalCompanies', 0)),
      this.prisma.tradTrustScore.aggregate({ _avg: { score: true } }).then(r => r._avg.score ?? 0).catch(gracefulCatch('founderAi.healthScore.trustAvg', 0)),
      this.prisma.tradTrustScore.count().catch(gracefulCatch('founderAi.healthScore.trustTotal', 0)),
      this.prisma.invoice.aggregate({ where: { status: 'OVERDUE' }, _sum: { totalAmount: true } }).then(r => Number(r._sum.totalAmount ?? 0)).catch(gracefulCatch('founderAi.healthScore.overdueAmount', 0)),
      this.prisma.invoice.aggregate({ _sum: { totalAmount: true } }).then(r => Number(r._sum.totalAmount ?? 0)).catch(gracefulCatch('founderAi.healthScore.totalInvoiceAmount', 1)),
      this.prisma.dispute.count({ where: { status: { notIn: ['RESOLVED', 'CANCELLED'] } } }).catch(gracefulCatch('founderAi.healthScore.openDisputes', 0)),
      this.prisma.shipment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.healthScore.totalShipments', 0)),
      this.prisma.shipment.count({ where: { createdAt: { gte: thirtyDaysAgo }, status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }).catch(gracefulCatch('founderAi.healthScore.delayedShipments', 0)),
      this.prisma.ecosystemUserLevel.count().catch(gracefulCatch('founderAi.healthScore.ecosystemUsers', 0)),
      this.prisma.ecosystemXPTransaction.aggregate({ _sum: { amount: true } }).then(r => r._sum.amount ?? 0).catch(gracefulCatch('founderAi.healthScore.ecosystemXp', 0)),
    ])

    const revenueScore = totalOrders > 0 ? Math.min(100, (completedOrders / Math.max(totalOrders, 1)) * 100) : 0
    const growthScore = totalUsers30d > 10 ? 85 : totalUsers30d > 5 ? 60 : 40
    const retentionScore = totalOrders > 0 ? Math.min(100, (1 - (openDisputes / Math.max(totalOrders, 1))) * 100) : 50
    const trustScore = trustTotal > 0 ? Math.min(100, (trustAvg / 10)) : 40
    const collectionsScore = totalInvoiceAmount > 0 ? Math.max(0, 100 - ((overdueAmount / totalInvoiceAmount) * 100)) : 50
    const marketplaceHealth = totalCompanies > 0 ? Math.min(100, (totalUsers30d / Math.max(totalCompanies, 1)) * 30 + 40) : 30
    const ecosystemReadiness = ecosystemUsers > 0 ? Math.min(100, (ecosystemXp > 1000 ? 85 : ecosystemXp > 100 ? 60 : 30)) : 0

    const weights = { revenue: 0.20, growth: 0.15, retention: 0.15, trust: 0.15, collections: 0.10, marketplaceHealth: 0.15, ecosystemReadiness: 0.10 }
    const overallScore = Math.round(
      revenueScore * weights.revenue + growthScore * weights.growth + retentionScore * weights.retention +
      trustScore * weights.trust + collectionsScore * weights.collections +
      marketplaceHealth * weights.marketplaceHealth + ecosystemReadiness * weights.ecosystemReadiness
    )
    const grade = overallScore >= 90 ? 'A+' : overallScore >= 75 ? 'A' : overallScore >= 60 ? 'B+' : overallScore >= 45 ? 'B' : overallScore >= 30 ? 'C' : 'D'

    const data: HealthScoreResponse = {
      period: '30d', overallScore, grade,
      revenue: { score: Math.round(revenueScore), weight: weights.revenue, contribution: Math.round(revenueScore * weights.revenue) },
      growth: { score: Math.round(growthScore), weight: weights.growth, contribution: Math.round(growthScore * weights.growth) },
      retention: { score: Math.round(retentionScore), weight: weights.retention, contribution: Math.round(retentionScore * weights.retention) },
      trust: { score: Math.round(trustScore), weight: weights.trust, contribution: Math.round(trustScore * weights.trust) },
      collections: { score: Math.round(collectionsScore), weight: weights.collections, contribution: Math.round(collectionsScore * weights.collections) },
      marketplaceHealth: { score: Math.round(marketplaceHealth), weight: weights.marketplaceHealth, contribution: Math.round(marketplaceHealth * weights.marketplaceHealth) },
      ecosystemReadiness: { score: Math.round(ecosystemReadiness), weight: weights.ecosystemReadiness, contribution: Math.round(ecosystemReadiness * weights.ecosystemReadiness) },
    }

    const insights: FounderAiInsight[] = [
      this.insight('Business Health', `${grade} (${overallScore}/100)`, 90,
        `Score of ${overallScore}/100 (${grade}) based on ${Object.keys(weights).length} weighted dimensions. ${data.revenue.score > 70 ? 'Revenue is strong' : 'Revenue needs attention'}. ${data.trust.score > 70 ? 'Trust is high' : 'Trust needs improvement.'}`,
        `A ${grade} rating ${overallScore >= 75 ? 'indicates healthy platform operations' : 'indicates areas needing immediate attention'}. Each 10-point improvement correlates with ~15% GMV growth.`,
        overallScore < 60 ? 'Launch initiatives for top 3 lowest-scoring dimensions' : 'Maintain trajectory with targeted improvements in dimensions below 70',
        overallScore < 60 ? 'Expected 20-point improvement within 60 days' : 'Expected 5-10 point improvement next month',
        'Analytics', overallScore < 45 ? 'critical' : overallScore < 60 ? 'high' : 'medium'),
      this.insight('Revenue Health', `${data.revenue.score}/100`, 88,
        `Revenue score of ${data.revenue.score} based on ${completedOrders}/${totalOrders} completed orders and order completion rate`,
        `Revenue is the highest-weighted dimension (${weights.revenue * 100}%). Score of ${data.revenue.score} ${data.revenue.score > 70 ? 'is healthy' : 'needs improvement'}.`,
        data.revenue.score < 70 ? 'Improve order completion rate through seller incentives' : 'Explore upsell and cross-sell opportunities',
        data.revenue.score < 70 ? 'Expected 15% revenue increase' : 'Expected 10% organic growth',
        'Revenue', data.revenue.score < 50 ? 'critical' : data.revenue.score < 70 ? 'high' : 'low'),
      this.insight('Trust Score', `${data.trust.score}/100`, 85,
        `Platform-wide TradTrust average of ${trustAvg.toFixed(0)}/1000 across ${trustTotal} scored companies`,
        `Trust is the foundation of the platform. Score of ${data.trust.score} ${data.trust.score > 70 ? 'indicates strong trust foundation' : 'signals trust erosion risk'}.`,
        data.trust.score < 70 ? 'Review TradTrust recalibration for low-scoring companies' : 'Maintain verification standards and dispute resolution SLAs',
        data.trust.score < 70 ? 'Expected 20% trust improvement within 30 days' : 'Trust remains a competitive advantage',
        'TradTrust', data.trust.score < 50 ? 'critical' : data.trust.score < 70 ? 'high' : 'medium'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheK, result)
    return result
  }

  // === Phase 18.4: Executive Priorities ===
  async executivePriorities(companyId?: string): Promise<FounderAiResponse<ExecutivePrioritiesResponse>> {
    const cacheKey = `founder:ai:executivePriorities:${JSON.stringify(companyId)}`
    const cached = await this.cacheGet<FounderAiResponse<ExecutivePrioritiesResponse>>(cacheKey)
    if (cached) return cached

    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const [pendingVerifications, openDisputes, overdueInvoices, expiringSubs,
      inactiveSellers30d, inactiveBuyers30d, delayedShipments, totalOrders30d,
      totalUsers30d, totalCompanies] = await Promise.all([
      this.prisma.companyVerification.count({ where: { status: 'PENDING' } }).catch(gracefulCatch('founderAi.executivePriorities.pendingVerifications', 0)),
      this.prisma.dispute.count({ where: { status: { notIn: ['RESOLVED', 'CANCELLED'] } } }).catch(gracefulCatch('founderAi.executivePriorities.openDisputes', 0)),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }).catch(gracefulCatch('founderAi.executivePriorities.overdueInvoices', 0)),
      this.prisma.company.count({ where: { subscriptionExpiresAt: { lte: new Date(today.getTime() + 30 * 86400000) } } }).catch(gracefulCatch('founderAi.executivePriorities.expiringSubs', 0)),
      this.prisma.company.count({ where: { deletedAt: null, id: { notIn: (await this.prisma.order.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { sellerCompanyId: true }, distinct: ['sellerCompanyId'] }).catch(gracefulCatch('founderAi.executivePriorities.activeSellers', []))).map(o => o.sellerCompanyId) } } }).catch(gracefulCatch('founderAi.executivePriorities.inactiveSellers30d', 0)),
      this.prisma.company.count({ where: { deletedAt: null, id: { notIn: (await this.prisma.rfq.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { companyId: true }, distinct: ['companyId'] }).catch(gracefulCatch('founderAi.executivePriorities.activeBuyers', []))).map(r => r.companyId) } } }).catch(gracefulCatch('founderAi.executivePriorities.inactiveBuyers30d', 0)),
      this.prisma.shipment.count({ where: { status: 'IN_TRANSIT' } }).catch(gracefulCatch('founderAi.executivePriorities.delayedShipments', 0)),
      this.prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.executivePriorities.totalOrders30d', 0)),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.executivePriorities.totalUsers30d', 0)),
      this.prisma.company.count({ where: { deletedAt: null } }).catch(gracefulCatch('founderAi.executivePriorities.totalCompanies', 0)),
    ])

    const priorities: ExecutivePriority[] = [
      { rank: 1, title: 'Clear Verification Queue', description: `${pendingVerifications} companies pending KYC. Unverified companies cannot trade, directly impacting GMV.`, impactArea: 'Growth', revenueImpact: 'High', riskLevel: 'Medium', roi: 'High', timeframe: '1-2 days', recommendedAction: `Assign reviewers to clear ${pendingVerifications} pending verifications` },
      { rank: 2, title: 'Resolve Open Disputes', description: `${openDisputes} active disputes affecting platform trust and user retention.`, impactArea: 'Trust', revenueImpact: 'Medium', riskLevel: 'High', roi: 'High', timeframe: '3-5 days', recommendedAction: 'Escalate disputes to senior team for fast resolution' },
      { rank: 3, title: 'Recover Overdue Payments', description: `${overdueInvoices} overdue invoices impacting cash flow.`, impactArea: 'Finance', revenueImpact: 'High', riskLevel: 'Critical', roi: 'High', timeframe: '1-2 days', recommendedAction: 'Send automated payment reminders and activate collections' },
      { rank: 4, title: 'Retain Expiring Subscriptions', description: `${expiringSubs} subscriptions expiring soon. Each lost subscription reduces recurring revenue.`, impactArea: 'Revenue', revenueImpact: 'High', riskLevel: 'High', roi: 'High', timeframe: '7 days', recommendedAction: 'Send renewal incentives before expiration' },
      { rank: 5, title: 'Re-engage Inactive Sellers', description: `${inactiveSellers30d} sellers inactive for 30+ days. Supply-side churn affects marketplace depth.`, impactArea: 'Marketplace', revenueImpact: 'Medium', riskLevel: 'Medium', roi: 'Medium', timeframe: '7-14 days', recommendedAction: 'Launch seller re-engagement campaign with incentives' },
      { rank: 6, title: 'Re-activate Inactive Buyers', description: `${inactiveBuyers30d} buyers inactive for 30+ days. Demand-side churn reduces order volume.`, impactArea: 'Growth', revenueImpact: 'Medium', riskLevel: 'Medium', roi: 'Medium', timeframe: '7-14 days', recommendedAction: 'Send personalized re-engagement emails with offers' },
      { rank: 7, title: 'Monitor Delivery SLA', description: `${delayedShipments} shipments currently in transit. Delivery delays impact customer satisfaction.`, impactArea: 'Operations', revenueImpact: 'Low', riskLevel: 'Medium', roi: 'Medium', timeframe: '1-3 days', recommendedAction: 'Audit logistics partners for SLA compliance' },
      { rank: 8, title: 'Boost User Acquisition', description: `${totalUsers30d} new users in 30 days. Accelerate growth to strengthen marketplace network effects.`, impactArea: 'Growth', revenueImpact: 'High', riskLevel: 'Low', roi: 'High', timeframe: '30 days', recommendedAction: 'Expand marketing channels and referral program' },
      { rank: 9, title: 'Increase Order Volume', description: `${totalOrders30d} orders in 30 days. Higher order volume drives platform revenue and liquidity.`, impactArea: 'Revenue', revenueImpact: 'High', riskLevel: 'Low', roi: 'Medium', timeframe: '30 days', recommendedAction: 'Launch seasonal promotions and seller incentives' },
      { rank: 10, title: 'Strengthen Platform Trust', description: `${totalCompanies} active companies on platform. Trust is a key competitive moat.`, impactArea: 'Trust', revenueImpact: 'Medium', riskLevel: 'Low', roi: 'High', timeframe: '30 days', recommendedAction: 'Run TradTrust score improvement campaign' },
    ]

    const data: ExecutivePrioritiesResponse = { period: '30d', priorities }
    const insights: FounderAiInsight[] = priorities.slice(0, 5).map(p => this.insight(
      `#${p.rank} ${p.title}`, `${p.impactArea} | ${p.roi} ROI`, 85,
      p.description, `${p.impactArea} priority with ${p.revenueImpact} revenue impact and ${p.riskLevel} risk`,
      p.recommendedAction, `Expected completion within ${p.timeframe}`,
      'Priorities', p.rank <= 3 ? 'critical' : p.rank <= 5 ? 'high' : 'medium',
    ))

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  // === Phase 18.4: Executive Timeline ===
  private async timelineForDateRange(start: Date, end: Date): Promise<TimelinePeriod> {
    const [revenue, orders, signups, rfqs, quotes, payments, missions, disputes] = await Promise.all([
      this.prisma.order.aggregate({ where: { createdAt: { gte: start, lt: end }, status: { in: ['COMPLETED', 'DELIVERED'] } }, _sum: { totalAmount: true } }).then(r => Number(r._sum.totalAmount ?? 0)).catch(gracefulCatch('founderAi.timelineForDateRange.revenue', 0)),
      this.prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }).catch(gracefulCatch('founderAi.timelineForDateRange.orders', 0)),
      this.prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }).catch(gracefulCatch('founderAi.timelineForDateRange.signups', 0)),
      this.prisma.rfq.count({ where: { createdAt: { gte: start, lt: end } } }).catch(gracefulCatch('founderAi.timelineForDateRange.rfqs', 0)),
      this.prisma.quote.count({ where: { createdAt: { gte: start, lt: end } } }).catch(gracefulCatch('founderAi.timelineForDateRange.quotes', 0)),
      this.prisma.payment.count({ where: { paidAt: { gte: start, lt: end } } }).catch(gracefulCatch('founderAi.timelineForDateRange.payments', 0)),
      this.prisma.ecosystemXPTransaction.count({ where: { createdAt: { gte: start, lt: end } } }).catch(gracefulCatch('founderAi.timelineForDateRange.missions', 0)),
      this.prisma.dispute.count({ where: { createdAt: { gte: start, lt: end } } }).catch(gracefulCatch('founderAi.timelineForDateRange.disputes', 0)),
    ])
    return { revenue, orders, signups, rfqs, quotes, payments, completedMissions: missions, openDisputes: disputes }
  }

  async executiveTimeline(): Promise<FounderAiResponse<ExecutiveTimelineResponse>> {
    const cacheKey = 'founder:ai:executiveTimeline:{}'
    const cached = await this.cacheGet<FounderAiResponse<ExecutiveTimelineResponse>>(cacheKey)
    if (cached) return cached

    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1)
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    const quarterEnd = new Date(quarterStart); quarterEnd.setMonth(quarterEnd.getMonth() + 3)
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1)

    const [today, thisWeek, thisMonth, thisQuarter, thisYear] = await Promise.all([
      this.timelineForDateRange(todayStart, tomorrow),
      this.timelineForDateRange(weekStart, weekEnd),
      this.timelineForDateRange(monthStart, monthEnd),
      this.timelineForDateRange(quarterStart, quarterEnd),
      this.timelineForDateRange(yearStart, yearEnd),
    ])

    const data: ExecutiveTimelineResponse = { today, thisWeek, thisMonth, thisQuarter, thisYear }
    const insights: FounderAiInsight[] = [
      this.insight('Today vs This Week Pace', `₹${today.revenue.toLocaleString()} / ₹${(thisWeek.revenue / 7).toFixed(0)}`, 75,
        `${today.orders} orders today vs ${Math.round(thisWeek.orders / 7)} daily average this week. ${today.orders > thisWeek.orders / 7 ? 'Above weekly pace' : 'Below weekly pace'}.`,
        `Daily pacing of ₹${today.revenue.toLocaleString()} projects to ₹${(today.revenue * 30).toLocaleString()} monthly.`,
        today.revenue < thisWeek.revenue / 7 ? 'Analyze and replicate high-performing days' : 'Sustain momentum',
        'Expected 10-20% improvement with consistent execution',
        'Timeline', today.revenue < thisWeek.revenue / 14 ? 'critical' : 'medium'),
      this.insight('Monthly Progress', `₹${thisMonth.revenue.toLocaleString()}`, 92,
        `${thisMonth.orders} orders, ${thisMonth.signups} new users, ${thisMonth.rfqs} RFQs this month`,
        `Monthly revenue of ₹${thisMonth.revenue.toLocaleString()} ${thisMonth.revenue > 1000000 ? 'exceeds ₹10L' : 'is trending'} for the current period.`,
        thisMonth.revenue < 500000 ? 'Consider mid-month promotional push' : 'Monitor end-of-month pipeline for fulfillment',
        thisMonth.revenue < 500000 ? 'Expected 30% boost with promotions' : 'On track for monthly targets',
        'Analytics', 'high'),
      this.insight('Quarterly Outlook', `₹${thisQuarter.revenue.toLocaleString()}`, 80,
        `${thisQuarter.orders} orders this quarter. Quarterly run rate: ₹${thisQuarter.revenue > 0 ? (thisQuarter.revenue / Math.max(1, (now.getMonth() % 3) + 1) * 3).toLocaleString() : 'N/A'}`,
        `Quarterly trajectory ${thisQuarter.revenue > 0 ? 'shows' : 'needs'} positive momentum. Q-over-Q analysis recommended for strategic planning.`,
        'Review quarterly growth drivers and refine next quarter strategy',
        'Expected 15-25% Q-over-Q growth with targeted initiatives',
        'Strategy', thisQuarter.revenue < 500000 ? 'critical' : 'high'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  // === Phase 18.4: Executive Reports ===
  async executiveReport(type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'): Promise<FounderAiResponse<ExecutiveReportResponse>> {
    const cacheKey = `founder:ai:executiveReport:${JSON.stringify(type)}`
    const cached = await this.cacheGet<FounderAiResponse<ExecutiveReportResponse>>(cacheKey)
    if (cached) return cached

    const now = new Date()
    let start: Date, end: Date
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1)

    switch (type) {
      case 'daily': start = todayStart; end = tomorrow; break
      case 'weekly': start = new Date(todayStart); start.setDate(start.getDate() - start.getDay()); end = new Date(start); end.setDate(end.getDate() + 7); break
      case 'monthly': start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth() + 1, 1); break
      case 'quarterly': start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); end = new Date(start); end.setMonth(end.getMonth() + 3); break
      case 'yearly': start = new Date(now.getFullYear(), 0, 1); end = new Date(now.getFullYear() + 1, 0, 1); break
    }

    const period = await this.timelineForDateRange(start, end)
    const prevEnd = new Date(start)
    const prevStart = new Date(start); prevStart.setTime(prevStart.getTime() - (end.getTime() - start.getTime()))
    const prevPeriod = await this.timelineForDateRange(prevStart, prevEnd)

    const titleMap = { daily: 'Daily Executive Report', weekly: 'Weekly Executive Report', monthly: 'Monthly Executive Report', quarterly: 'Quarterly Executive Report', yearly: 'Yearly Executive Report' }
    const revenueChange = prevPeriod.revenue > 0 ? ((period.revenue - prevPeriod.revenue) / prevPeriod.revenue) * 100 : 0
    const ordersChange = prevPeriod.orders > 0 ? ((period.orders - prevPeriod.orders) / prevPeriod.orders) * 100 : 0

    const sections: ReportSection[] = [
      { title: 'Revenue Summary', data: { current: period.revenue, previous: prevPeriod.revenue, change: revenueChange, averageOrderValue: period.orders > 0 ? period.revenue / period.orders : 0 }, insights: [`Revenue ${revenueChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}% vs previous ${type} period`] },
      { title: 'Order Activity', data: { orders: period.orders, previousOrders: prevPeriod.orders, change: ordersChange }, insights: [`${period.orders} orders placed, ${ordersChange >= 0 ? 'up' : 'down'} ${Math.abs(ordersChange).toFixed(1)}% from previous period`] },
      { title: 'User Growth', data: { newUsers: period.signups, totalRfqs: period.rfqs, totalQuotes: period.quotes }, insights: [`${period.signups} new users signed up`] },
      { title: 'Platform Health', data: { payments: period.payments, missions: period.completedMissions, disputes: period.openDisputes }, insights: [`${period.payments} payments processed, ${period.openDisputes} disputes opened`] },
    ]

    const recommendations = [
      period.revenue < prevPeriod.revenue ? 'Review revenue drivers and address decline factors' : 'Sustain growth momentum with targeted upselling',
      period.orders < prevPeriod.orders ? 'Analyze order funnel for drop-off points' : 'Expand seller catalog to maintain order growth',
      period.signups < 5 ? 'Increase acquisition spend and referral incentives' : 'Engage new users with onboarding sequence',
    ]

    const data: ExecutiveReportResponse = {
      period: type, title: titleMap[type], date: todayStart.toISOString().split('T')[0],
      summary: `Executive report for the ${type} period ending ${todayStart.toISOString().split('T')[0]}. Revenue: ₹${period.revenue.toLocaleString()} (${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%). Orders: ${period.orders} (${ordersChange >= 0 ? '+' : ''}${ordersChange.toFixed(1)}%).`,
      sections, recommendations,
    }

    const insights: FounderAiInsight[] = [
      this.insight(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, `₹${period.revenue.toLocaleString()} revenue`, 95,
        data.summary, `${type.charAt(0).toUpperCase() + type.slice(1)} report generated with ${sections.length} sections covering revenue, orders, users, and platform health.`,
        recommendations[0], 'Expected measurable improvement in next period',
        'Reports', period.revenue < prevPeriod.revenue ? 'high' : 'medium'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  async marketplaceIntelligence(): Promise<FounderAiResponse<MarketplaceIntelligenceResponse>> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

    const cacheK = this.cacheKey('marketplaceIntel')
    const cached = await this.cacheGet<FounderAiResponse<MarketplaceIntelligenceResponse>>(cacheK)
    if (cached) return cached

    const [activeRfqs, activeProducts, activeCompanies, rfqsThisMonth, quotesThisMonth, ordersThisMonth] = await Promise.all([
      this.prisma.rfq.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
      this.prisma.company.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.rfq.count({ where: { createdAt: { gte: monthStart }, deletedAt: null } }),
      this.prisma.quote.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    ])

    const [totalRfqs, totalQuotes, totalOrders, rfqByCat, rfqByIndustry] = await Promise.all([
      this.prisma.rfq.count({ where: { deletedAt: null } }),
      this.prisma.quote.count(),
      this.prisma.order.count(),
      this.prisma.rfq.groupBy({ by: ['categoryId'], _count: { categoryId: true }, orderBy: { _count: { categoryId: 'desc' } }, where: { deletedAt: null, categoryId: { not: null } }, take: 5 }) as unknown as Promise<Array<{ categoryId: string | null; _count: { categoryId: number } }>>,
      this.prisma.rfq.groupBy({ by: ['industryId'], _count: { industryId: true }, orderBy: { _count: { industryId: 'desc' } }, where: { deletedAt: null, industryId: { not: null } }, take: 5 }) as unknown as Promise<Array<{ industryId: string | null; _count: { industryId: number } }>>,
    ])

    const catIds = (rfqByCat as unknown as Array<{ categoryId: string | null; _count: { categoryId: number } }>).filter(c => c.categoryId).map(c => c.categoryId)
    const indIds = (rfqByIndustry as unknown as Array<{ industryId: string | null; _count: { industryId: number } }>).filter(i => i.industryId).map(i => i.industryId)
    const categories = catIds.length > 0 ? await this.prisma.category.findMany({ where: { id: { in: catIds as string[] } } }) : []
    const industries = indIds.length > 0 ? await this.prisma.industry.findMany({ where: { id: { in: indIds as string[] } } }) : []

    const quotedRfqs = await this.prisma.rfq.count({ where: { status: 'QUOTED', deletedAt: null } })
    const rfqSourceOrders = await this.prisma.order.count({ where: { source: 'RFQ' } })
    const rfqToQuoteRate = totalRfqs > 0 ? Math.round((quotedRfqs / totalRfqs) * 100) : 0
    const quoteToOrderRate = totalQuotes > 0 ? Math.round((rfqSourceOrders / totalQuotes) * 100) : 0
    const categoriesWithSupply = await this.prisma.product.groupBy({ by: ['categoryId'], where: { status: 'ACTIVE' } }).then(r => r.length)

    const orderAgg = await this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: monthStart } } })
    const ordersTotalAmount = Number(orderAgg._sum.totalAmount ?? 0)
    const avgOrderValue = ordersThisMonth > 0 ? Math.round(ordersTotalAmount / ordersThisMonth) : 0

    const searchVolume = await this.prisma.enterpriseSearchAnalytics.count({ where: { createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.searchVolume', 0))
    const zeroResultCount = await this.prisma.enterpriseSearchAnalytics.count({ where: { zeroResults: true, createdAt: { gte: thirtyDaysAgo } } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.zeroResultCount', 0))
    const zeroResultRate = searchVolume > 0 ? Math.round(zeroResultCount / searchVolume * 100) : 0

    const [qualityScores, qualityProducts, missingImages, missingSeo, missingSpecs, missingAttributes, brands, brandHealth, totalCatCount] = await Promise.all([
      this.prisma.catalogQualityScore.aggregate({ _avg: { total: true }, _count: { total: true } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.qualityScores', { _avg: { total: null }, _count: { total: 0 } })),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.qualityProducts', 0)),
      this.prisma.product.count({ where: { media: { none: {} }, deletedAt: null } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.missingImages', 0)),
      this.prisma.product.count({ where: { OR: [{ metaTitle: null }, { metaDescription: null }], deletedAt: null } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.missingSeo', 0)),
      this.prisma.product.count({ where: { specifications: { none: {} }, deletedAt: null } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.missingSpecs', 0)),
      this.prisma.product.count({ where: { attributes: { none: {} }, deletedAt: null } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.missingAttributes', 0)),
      this.prisma.globalBrand.count().catch(gracefulCatch('founderAi.marketplaceIntelligence.brands', 0)),
      this.prisma.globalBrand.count({ where: { verificationStatus: 'VERIFIED' } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.brandHealth', 0)),
      this.prisma.category.count().catch(gracefulCatch('founderAi.marketplaceIntelligence.totalCatCount', 0)),
    ])

    const avgCatalogQuality = Math.round(qualityScores._avg.total || 0)
    const avgScoreWeight = avgCatalogQuality / 100
    const missingWeight = Math.max(0, 1 - (missingImages + missingSeo + missingSpecs) / Math.max(qualityProducts, 1))
    const marketplaceQualityIndex = Math.round((avgScoreWeight * 40 + missingWeight * 30 + (searchVolume / Math.max(searchVolume + zeroResultCount, 1)) * 30))

    const categoryQualityData = await this.prisma.catalogQualityScore.groupBy({
      by: ['productId'],
      _avg: { total: true },
    }).catch(gracefulCatch('founderAi.marketplaceIntelligence.categoryQualityData', []))

    const scoredProductIds = categoryQualityData.map(cq => cq.productId).filter(Boolean) as string[]
    const scoredProducts = scoredProductIds.length > 0 ? await this.prisma.product.findMany({
      where: { id: { in: scoredProductIds } },
      select: { categoryId: true, id: true },
      take: 500,
    }).catch(gracefulCatch('founderAi.marketplaceIntelligence.scoredProducts', [])) : []
    const catScores = new Map<string, { totalScore: number; count: number; name: string }>()
    for (const cq of categoryQualityData) {
      const p = scoredProducts.find(c => c.id === cq.productId)
      if (p?.categoryId) {
        const existing = catScores.get(p.categoryId) || { totalScore: 0, count: 0, name: '' }
        existing.totalScore += cq._avg.total || 0
        existing.count += 1
        catScores.set(p.categoryId, existing)
      }
    }
    const catNames = await this.prisma.category.findMany({ where: { id: { in: [...catScores.keys()] } }, select: { id: true, name: true } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.catNames', []))
    for (const cn of catNames) {
      const entry = catScores.get(cn.id)
      if (entry) entry.name = cn.name
    }
    const catQualityArr = [...catScores.entries()].map(([id, v]) => ({
      name: v.name || id,
      avgScore: v.count > 0 ? Math.round(v.totalScore / v.count) : 0,
      productCount: v.count,
    })).sort((a, b) => b.avgScore - a.avgScore)

    const sellerQualityData = await this.prisma.catalogQualityScore.findMany({
      select: {
        total: true,
        productId: true,
        product: { select: { companyId: true } },
      },
      take: 2000,
    }).catch(gracefulCatch('founderAi.marketplaceIntelligence.sellerQualityData', []))

    const sellerMap = new Map<string, { totalScore: number; count: number }>()
    for (const sq of sellerQualityData) {
      const cid = sq.product?.companyId
      if (!cid) continue
      const existing = sellerMap.get(cid) || { totalScore: 0, count: 0 }
      existing.totalScore += sq.total
      existing.count += 1
      sellerMap.set(cid, existing)
    }

    let totalSellersWithQuality = 0, excellentSellers = 0, goodSellers = 0, fairSellers = 0, poorSellers = 0
    const scoredCompanies = [...sellerMap.entries()].map(([companyId, v]) => {
      totalSellersWithQuality++
      const avg = Math.round(v.totalScore / v.count)
      if (avg >= 80) excellentSellers++
      else if (avg >= 60) goodSellers++
      else if (avg >= 40) fairSellers++
      else poorSellers++
      return { companyId, avgScore: avg, productCount: v.count }
    }).sort((a, b) => b.avgScore - a.avgScore)

    const topSellerIds = scoredCompanies.slice(0, 5).map(s => s.companyId)
    const topSellerCompanies = topSellerIds.length > 0 ? await this.prisma.company.findMany({
      where: { id: { in: topSellerIds } }, select: { id: true, name: true },
    }).catch(gracefulCatch('founderAi.marketplaceIntelligence.topSellerCompanies', [])) : []
    const topSellerQuality = scoredCompanies.slice(0, 5).map(s => ({
      companyId: s.companyId,
      companyName: topSellerCompanies.find(c => c.id === s.companyId)?.name || s.companyId,
      avgScore: s.avgScore,
      productCount: s.productCount,
    }))

    const [aiTotalUsage, aiFailedUsage, aiTodayUsage, aiProviderCount, aiCircuitOpenCount, aiFeatureBreakdown] = await Promise.all([
      this.prisma.aiUsage.count().catch(gracefulCatch('founderAi.marketplaceIntelligence.aiTotalUsage', 0)),
      this.prisma.aiUsage.count({ where: { success: false } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.aiFailedUsage', 0)),
      this.prisma.aiUsage.count({ where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.aiTodayUsage', 0)),
      this.prisma.aiProvider.count({ where: { enabled: true } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.aiProviderCount', 0)),
      this.prisma.aiProvider.count({ where: { circuitOpen: true } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.aiCircuitOpenCount', 0)),
      this.prisma.aiUsage.groupBy({ by: ['taskType'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }).catch(gracefulCatch('founderAi.marketplaceIntelligence.aiFeatureBreakdown', [] as Array<{ taskType: string; _count: { id: number } }>)),
    ])
    const aiTotalRequests = aiTotalUsage
    const aiSuccessRate = aiTotalRequests > 0 ? Math.round(((aiTotalRequests - aiFailedUsage) / aiTotalRequests) * 100) : 0
    const aiAvgLatencyAgg = aiTotalRequests > 0 ? await this.prisma.aiUsage.aggregate({ _avg: { latencyMs: true } }).catch(gracefulCatch('founderAi.marketplaceIntelligence.aiAvgLatencyAgg', { _avg: { latencyMs: null } })) : { _avg: { latencyMs: null } }

    const data: MarketplaceIntelligenceResponse = {
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      demand: { activeRfqs, productRequests: 0, searchVolume },
      supply: { activeProducts, activeSellers: activeCompanies, categoriesWithSupply },
      conversion: { rfqToQuoteRate, quoteToOrderRate, avgConversionDays: 0 },
      rfqs: { total: totalRfqs, thisMonth: rfqsThisMonth, byCategory: (rfqByCat as unknown as Array<{ categoryId: string | null; _count: { categoryId: number } }>).filter(c => c.categoryId).map(c => ({ name: categories.find(cat => cat.id === c.categoryId)?.name || c.categoryId || '', count: c._count.categoryId })), byIndustry: (rfqByIndustry as unknown as Array<{ industryId: string | null; _count: { industryId: number } }>).filter(i => i.industryId).map(i => ({ name: industries.find(ind => ind.id === i.industryId)?.name || i.industryId || '', count: i._count.industryId })) },
      quotes: { total: totalQuotes, thisMonth: quotesThisMonth, avgResponseDays: 0, acceptanceRate: 0 },
      orders: { total: totalOrders, thisMonth: ordersThisMonth, avgValue: avgOrderValue, byCategory: [] },
      catalogQuality: {
        avgScore: avgCatalogQuality,
        scoredProducts: qualityScores._count.total || 0,
        duplicateCount: 0,
        missingImages,
        missingSeo,
        missingSpecs,
        missingAttributes,
        marketplaceQualityIndex,
        sellerQualityIndex: {
          totalSellersWithQuality,
          excellentSellers,
          goodSellers,
          fairSellers,
          poorSellers,
          topSellerQuality,
        },
      },
      brandHealth: {
        totalBrands: brands,
        verifiedBrands: brandHealth,
        verificationRate: brands > 0 ? Math.round((brandHealth / brands) * 100) : 0,
      },
      categoryHealth: {
        totalCategories: totalCatCount,
        categoriesWithProducts: categoriesWithSupply,
        topCategoriesByQuality: catQualityArr.slice(0, 5),
        bottomCategoriesByQuality: [...catQualityArr].reverse().slice(0, 5),
      },
      aiPlatformHealth: {
        totalRequests: aiTotalRequests,
        successRate: aiSuccessRate,
        avgLatencyMs: Math.round(aiAvgLatencyAgg._avg.latencyMs || 0),
        activeProviders: aiProviderCount,
        circuitBreakersOpen: aiCircuitOpenCount,
        requestsToday: aiTodayUsage,
        topFeatures: (aiFeatureBreakdown as unknown as Array<{ taskType: string; _count: { id: number } }>).map(f => ({ taskType: f.taskType, count: f._count.id })),
      },
    }

    const insights: FounderAiInsight[] = [
      this.insight('Marketplace Demand', `${activeRfqs} active RFQs`, 90, `${activeRfqs} active RFQs with ${activeProducts} products available`, 'Healthy marketplace activity indicator', 'Monitor RFQ-to-quote conversion funnel', 'Improved conversion rate', 'Marketplace Intelligence', 'medium'),
      this.insight('RFQ→Quote Rate', `${rfqToQuoteRate}%`, 85, `Conversion rate from RFQ to quote is ${rfqToQuoteRate}%`, 'Directly impacts revenue generation', rfqToQuoteRate < 50 ? 'Improve quote response templates and incentives' : 'Maintain current conversion practices', rfqToQuoteRate < 50 ? 'Expected 15% improvement in conversion' : 'Sustained conversion rates', 'Marketplace Intelligence', rfqToQuoteRate < 50 ? 'high' : 'low'),
      this.insight('Supply Coverage', `${categoriesWithSupply} categories`, 90, `Products available across ${categoriesWithSupply} categories`, 'Supply breadth determines buyer satisfaction', 'Expand into categories with high RFQ but low supply', 'Increased category coverage', 'Marketplace Intelligence', 'medium'),
      this.insight('Search Volume', `${searchVolume} searches (30d)`, 70, `${searchVolume} enterprise catalog searches in last 30 days with ${zeroResultRate}% zero-result rate`, 'Search discoverability health', zeroResultRate > 20 ? 'Investigate top zero-result queries and add missing catalog entries' : 'Search discoverability is healthy', 'Improved search result coverage', 'Enterprise Search', zeroResultRate > 20 ? 'high' : 'low'),
      this.insight('Catalog Quality', `${avgCatalogQuality}/100 avg score`, avgCatalogQuality, `Average product catalog quality score is ${avgCatalogQuality}/100 across ${qualityScores._count.total || 0} scored products`, 'Product quality drives buyer trust and conversion', avgCatalogQuality < 60 ? 'Launch catalog quality improvement campaign targeting sellers with low scores' : 'Catalog quality is above threshold, maintain monitoring', avgCatalogQuality < 60 ? 'Expected avg catalog quality improvement of 15%' : 'Sustained catalog quality', 'Catalog Quality', avgCatalogQuality < 50 ? 'high' : avgCatalogQuality < 70 ? 'medium' : 'low'),
      this.insight('Marketplace Quality Index', `${marketplaceQualityIndex}/100`, marketplaceQualityIndex, `Overall marketplace quality index: ${marketplaceQualityIndex}/100 (quality: ${avgCatalogQuality}/100, products: ${missingImages} missing images, ${missingSeo} missing SEO)`, 'Composite measure of marketplace health', missingImages > 100 ? 'Target sellers with missing images for improvement' : 'Marketplace quality is balanced', 'Improved marketplace quality index', 'Catalog Quality', missingImages > 200 ? 'high' : 'medium'),
      this.insight('AI Platform Health', `${aiTotalRequests} total requests, ${aiSuccessRate}% success`, aiSuccessRate, `AI platform processed ${aiTotalRequests} requests (${aiTodayUsage} today) with ${aiSuccessRate}% success rate, ${aiCircuitOpenCount} circuit breakers open`, 'AI availability directly impacts seller experience and product enrichment', aiSuccessRate < 90 ? 'Investigate AI provider failures and circuit breaker states in ai-runtime console' : 'AI platform health is stable', aiSuccessRate < 90 ? 'Restore AI success rate above 95%' : 'Maintain AI platform reliability', 'AI Runtime', aiSuccessRate < 85 ? 'high' : aiSuccessRate < 95 ? 'medium' : 'low'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheK, result)
    return result
  }

  async tradeservIntelligence(): Promise<FounderAiResponse<TradeservIntelligenceResponse>> {
    const cacheKey = 'founder:ai:tradeservIntelligence:{}'
    const cached = await this.cacheGet<FounderAiResponse<TradeservIntelligenceResponse>>(cacheKey)
    if (cached) return cached

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

    const proCompanyIds = await this.prisma.professionalService.findMany({ select: { companyId: true }, distinct: ['companyId'] }).then(r => r.map(p => p.companyId))
    const proCompanies30dAgo = await this.prisma.professionalService.findMany({ where: { company: { createdAt: { lt: thirtyDaysAgo } } }, select: { companyId: true }, distinct: ['companyId'] }).then(r => r.map(p => p.companyId))

    const totalPro = proCompanyIds.length
    const pro30dLen = proCompanies30dAgo.length
    const services = await this.prisma.professionalService.count()
    const bookings = await this.prisma.booking.count()
    const proposals = await this.prisma.proposal.count()
    const bookings30d = await this.prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } })

    const topServiceCats = await this.prisma.professionalService.groupBy({ by: ['category'], _count: { category: true }, orderBy: { _count: { category: 'desc' } }, take: 5 }) as unknown as Array<{ category: string; _count: { category: number } }>
    const verifications: Array<{ status: string }> = proCompanyIds.length > 0 ? await this.prisma.companyVerification.findMany({ where: { companyId: { in: proCompanyIds } }, select: { status: true } }) : []
    const newThisMonth = await this.prisma.professionalService.findMany({ where: { company: { createdAt: { gte: monthStart, lt: monthEnd } } }, select: { companyId: true }, distinct: ['companyId'] }).then(r => r.length)
    const trustScores: Array<{ score: number }> = proCompanyIds.length > 0 ? await this.prisma.tradTrustScore.findMany({ where: { companyId: { in: proCompanyIds } }, select: { score: true }, take: 1000 }) : []

    const growth30d = pro30dLen > 0 ? Math.round(((totalPro - pro30dLen) / pro30dLen) * 100) : 0
    const avgTrustScore = trustScores.length > 0 ? Math.round(trustScores.reduce((a, s) => a + s.score, 0) / trustScores.length) : 0
    const verApproved = verifications.filter(v => v.status === 'APPROVED').length
    const verPending = verifications.filter(v => v.status === 'PENDING').length
    const verRejected = verifications.filter(v => v.status === 'REJECTED').length
    const verificationRate = verifications.length > 0 ? Math.round((verApproved / verifications.length) * 100) : 0

    const data: TradeservIntelligenceResponse = {
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      professionalGrowth: { total: totalPro, growth30d, newThisMonth },
      serviceDemand: { totalServices: services, topCategories: topServiceCats.map(c => ({ name: c.category, count: c._count.category })), bookingRate: services > 0 ? Math.round((bookings30d / services) * 100) : 0 },
      profileQuality: { avgCompletion: 0, avgTrustScore, verificationRate },
      verificationHealth: { total: verifications.length, approved: verApproved, pending: verPending, rejected: verRejected, expired: 0 },
    }

    const insights: FounderAiInsight[] = [
      this.insight('Professional Growth', `${totalPro} professionals`, 95, `${totalPro} professionals, ${newThisMonth} new this month (${growth30d}% growth)`, 'Professional services segment growth', growth30d < 10 ? 'Increase professional acquisition channels' : 'Maintain growth trajectory', `${growth30d < 10 ? 'Expected 25% growth acceleration' : 'Sustained 30-day growth'}`, 'TradeServ', growth30d < 5 ? 'high' : 'medium'),
      this.insight('Verification Health', `${verificationRate}% verified`, 85, `${verApproved} approved out of ${verifications.length} total verifications`, 'Trust and quality assurance', verPending > 20 ? 'Clear pending verification queue' : 'Verification process running smoothly', verPending > 20 ? 'Reduced verification backlog' : 'Maintained verification standards', 'TradeServ', verPending > 20 ? 'high' : 'low'),
      this.insight('Service Demand', `${services} services`, 85, `${services} services across ${topServiceCats.length} categories`, 'Professional service marketplace health', 'Encourage service listing completion and category expansion', 'Increased service diversity', 'TradeServ', 'medium'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  async tradetalkIntelligence(): Promise<FounderAiResponse<TradeTalkIntelligenceResponse>> {
    const cacheKey = 'founder:ai:tradetalkIntelligence:{}'
    const cached = await this.cacheGet<FounderAiResponse<TradeTalkIntelligenceResponse>>(cacheKey)
    if (cached) return cached

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalCommunities, communities30dAgo, totalMembers, members30dAgo] = await Promise.all([
      this.prisma.community.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.community.count({ where: { createdAt: { lt: thirtyDaysAgo }, deletedAt: null, isActive: true } }),
      this.prisma.communityMember.count({ where: { community: { deletedAt: null, isActive: true } } }),
      this.prisma.communityMember.count({ where: { joinedAt: { lt: thirtyDaysAgo }, community: { deletedAt: null, isActive: true } } }),
    ])

    const [activeMembers, invitations, mostActive, newThisMonth] = await Promise.all([
      this.prisma.communityMember.count({ where: { lastActiveAt: { gte: thirtyDaysAgo }, community: { deletedAt: null, isActive: true } } }),
      this.prisma.communityInvitation.count({ where: { status: 'PENDING' } }),
      this.prisma.community.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { memberCount: 'desc' }, take: 5, select: { name: true, memberCount: true } }),
      this.prisma.community.count({ where: { createdAt: { gte: monthStart }, deletedAt: null, isActive: true } }),
    ])

    const communityGrowth30d = communities30dAgo > 0 ? Math.round(((totalCommunities - communities30dAgo) / communities30dAgo) * 100) : 0
    const activeMemberRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0
    const inviteAcceptanceRate = (totalMembers + invitations) > 0 ? Math.round((totalMembers / (totalMembers + invitations)) * 100) : 0

    const data: TradeTalkIntelligenceResponse = {
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      communityGrowth: { totalCommunities, growth30d: communityGrowth30d, newThisMonth },
      trendingIndustries: [],
      mostActiveCommunities: mostActive.map(c => ({ name: c.name, memberCount: c.memberCount, recentActivity: 0 })),
      membershipAdoption: { totalMembers, activeMembers, inviteAcceptanceRate },
    }

    const insights: FounderAiInsight[] = [
      this.insight('Community Growth', `${totalCommunities} communities`, 95, `${totalCommunities} communities with ${totalMembers} members (${communityGrowth30d}% growth)`, 'Network effects and community engagement', communityGrowth30d < 15 ? 'Launch community building campaigns' : 'Nurture existing communities', 'Accelerated community growth', 'TradeTalk', 'medium'),
      this.insight('Member Engagement', `${activeMemberRate}% active`, 85, `${activeMembers} active members out of ${totalMembers} total (${activeMemberRate}%)`, 'Community health indicator', activeMemberRate < 40 ? 'Implement re-engagement campaigns' : 'Maintain engagement programs', 'Improved member retention', 'TradeTalk', activeMemberRate < 30 ? 'high' : 'medium'),
      this.insight('Network Adoption', `${inviteAcceptanceRate}% accept rate`, 80, `${inviteAcceptanceRate}% invitation acceptance rate`, 'Viral growth potential', 'Optimize invitation flow and onboarding experience', 'Increased network growth rate', 'TradeTalk', 'low'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  async membershipIntelligence(): Promise<FounderAiResponse<MembershipIntelligenceResponse>> {
    const cacheKey = 'founder:ai:membershipIntelligence:{}'
    const cached = await this.cacheGet<FounderAiResponse<MembershipIntelligenceResponse>>(cacheKey)
    if (cached) return cached

    const now = new Date()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const companiesWithSub = await this.prisma.company.findMany({ where: { subscriptionStatus: 'ACTIVE', deletedAt: null }, select: { subscriptionPlan: true } }) as unknown as Array<{ subscriptionPlan: string | null }>
    const totalActive = await this.prisma.company.count({ where: { subscriptionStatus: 'ACTIVE', deletedAt: null } })
    const renewalsThisMonth = await this.prisma.company.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: { gte: monthStart, lt: monthEnd }, deletedAt: null } })
    const expiringThisMonth = renewalsThisMonth
    const expiringNext30d = await this.prisma.company.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: { gte: monthEnd, lt: thirtyDaysFromNow }, deletedAt: null } })

    const planDist: Record<string, number> = {}
    for (const c of companiesWithSub) {
      const name = c.subscriptionPlan || 'Unknown'
      planDist[name] = (planDist[name] || 0) + 1
    }

    const planDistribution = Object.entries(planDist).map(([planName, count]) => ({
      planName, subscriberCount: count as number, percentage: totalActive > 0 ? Math.round((count as number / totalActive) * 100) : 0,
    }))

    const atRisk = await this.prisma.company.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: { lt: thirtyDaysFromNow }, deletedAt: null } })

    const data: MembershipIntelligenceResponse = {
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      planDistribution,
      renewals: { thisMonth: renewalsThisMonth, next30Days: expiringNext30d, atRisk },
      expiries: { thisMonth: expiringThisMonth, next30Days: expiringNext30d, gracePeriod: 7 },
      upgradeOpportunities: { eligibleCount: totalActive, potentialRevenue: 'TBD', byPlan: [] },
    }

    const insights: FounderAiInsight[] = [
      this.insight('Active Subscriptions', `${totalActive} active`, 95, `${totalActive} active subscriptions across ${planDistribution.length} plans`, 'Recurring revenue base', 'Nurture renewal pipeline for expiring subscriptions', 'Improved retention rate', 'Membership', 'medium'),
      this.insight('Upcoming Renewals', `${renewalsThisMonth} this month`, 90, `${renewalsThisMonth} subscriptions expiring this month, ${atRisk} at risk within 30 days`, 'Revenue retention risk', atRisk > 10 ? 'Launch proactive renewal campaign' : 'Send standard renewal reminders', atRisk > 10 ? 'Expected 20% reduction in churn' : 'Maintained renewal rate', 'Membership', atRisk > 10 ? 'high' : 'medium'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  async gocashIntelligence(): Promise<FounderAiResponse<GocashIntelligenceResponse>> {
    const cacheKey = 'founder:ai:gocashIntelligence:{}'
    const cached = await this.cacheGet<FounderAiResponse<GocashIntelligenceResponse>>(cacheKey)
    if (cached) return cached

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

    const wallets = await this.prisma.gOCASH_Wallet.count()
    const xpTxCount = await this.prisma.ecosystemXPTransaction.count()
    const missions = await this.prisma.ecosystemMission.count()
    const completedMissions = await this.prisma.ecosystemUserMission.count({ where: { completedAt: { not: null } } })
    const activeMissions = await this.prisma.ecosystemUserMission.count({ where: { completedAt: null } })
    const xpEarned = await this.prisma.gOCASH_Transaction.aggregate({ _sum: { amount: true }, where: { direction: 'CREDIT', status: 'SUCCESS' } })
    const xpRedeemed = await this.prisma.gOCASH_Transaction.aggregate({ _sum: { amount: true }, where: { direction: 'DEBIT', status: 'SUCCESS' } })

    const totalXpAgg = await this.prisma.ecosystemXPTransaction.aggregate({ _sum: { amount: true } })
    const totalXp = Number(totalXpAgg._sum.amount ?? 0)
    const totalUsersWithXp = await this.prisma.ecosystemXPTransaction.groupBy({ by: ['userId'] }).then(r => r.length)
    const totalEarned = Number(xpEarned._sum.amount ?? 0)
    const totalRedeemed = Number(xpRedeemed._sum.amount ?? 0)

    const missionCompletionRate = missions > 0 ? Math.round((completedMissions / missions) * 100) : 0
    const utilizationRate = totalEarned > 0 ? Math.round((totalRedeemed / totalEarned) * 100) : 0

    const levels = await this.prisma.ecosystemUserLevel.findMany({ include: { currentLevel: { select: { levelNumber: true, name: true } } }, take: 100 }) as unknown as Array<{ currentLevel: { levelNumber: number; name: string } | null; totalXP: number }>
    const byLevel: { level: number; userCount: number; totalXp: string }[] = []
    for (const l of levels) {
      const level = l.currentLevel?.levelNumber || 0
      const existing = byLevel.find(a => a.level === level)
      if (existing) { existing.userCount++ } else { byLevel.push({ level, userCount: 1, totalXp: `₹${l.totalXP}` }) }
    }

    const data: GocashIntelligenceResponse = {
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      walletActivity: {
        totalWallets: Number(wallets),
        totalVolume: totalEarned > 0 ? `₹${totalEarned.toLocaleString()}` : '₹0',
        avgBalance: wallets > 0 ? `₹${Math.round(totalEarned / Number(wallets)).toLocaleString()}` : '₹0',
      },
      xpDistribution: {
        totalXp: `₹${Number(totalXp).toLocaleString()}`,
        avgPerUser: totalUsersWithXp > 0 ? `₹${Math.round(Number(totalXp) / totalUsersWithXp).toLocaleString()}` : '₹0',
        byLevel,
      },
      rewardUtilization: { totalEarned: `₹${totalEarned.toLocaleString()}`, totalRedeemed: `₹${totalRedeemed.toLocaleString()}`, utilizationRate },
      missionCompletion: { totalMissions: missions, completionRate: missionCompletionRate, activeMissions },
    }

    const insights: FounderAiInsight[] = [
      this.insight('Wallet Activity', `${wallets} wallets`, 95, `${wallets} wallets with ₹${totalEarned.toLocaleString()} total volume`, 'GOCASH platform health', 'Promote wallet adoption among new users', 'Increased wallet engagement', 'GOCASH', 'medium'),
      this.insight('Reward Utilization', `${utilizationRate}% redeemed`, 85, `${utilizationRate}% of earned rewards redeemed (₹${totalRedeemed.toLocaleString()})`, 'Reward program effectiveness', utilizationRate < 30 ? 'Improve reward awareness and redemption options' : 'Optimize reward categories', utilizationRate < 30 ? 'Expected 40% utilization improvement' : 'Sustained reward engagement', 'GOCASH', utilizationRate < 20 ? 'high' : 'medium'),
      this.insight('Mission Completion', `${missionCompletionRate}% rate`, 85, `${completedMissions}/${missions} missions completed (${missionCompletionRate}%)`, 'User engagement and retention', missionCompletionRate < 40 ? 'Simplify mission requirements' : 'Add advanced mission tiers', 'Improved mission engagement', 'GOCASH', missionCompletionRate < 30 ? 'high' : 'medium'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  async tradtrustIntelligence(): Promise<FounderAiResponse<TradTrustIntelligenceResponse>> {
    const cacheKey = 'founder:ai:tradtrustIntelligence:{}'
    const cached = await this.cacheGet<FounderAiResponse<TradTrustIntelligenceResponse>>(cacheKey)
    if (cached) return cached

    const trustStats = await this.tradtrust.getTrustStats()
    const avgScore = (trustStats?.averageScore as number) || 0

    const verGroup = await this.prisma.companyVerification.groupBy({ by: ['status'], _count: { status: true } })
    const verMap: Record<string, number> = {}
    for (const v of verGroup) { verMap[v.status] = v._count.status }
    const verTotal = Object.values(verMap).reduce((a, b) => a + b, 0)

    const gradeDist = (trustStats?.gradeDistribution || []) as unknown as Array<{ grade: string; count: number; percentage: number }>
    const riskDist = (trustStats?.riskDistribution || []) as unknown as Array<{ riskLevel: string; count: number; percentage: number }>

    const improvementAreas: Array<{ score: number; companyId: string }> = await this.prisma.tradTrustScore.findMany({ orderBy: { score: 'asc' }, take: 10, select: { score: true, companyId: true } })

    const data: TradTrustIntelligenceResponse = {
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      trustDistribution: gradeDist.map(g => ({
        grade: String(g.grade || ''),
        companyCount: Number(g.count || 0),
        percentage: Number(g.percentage || 0),
      })),
      verificationFunnel: { total: verTotal, approved: verMap['APPROVED'] || 0, pending: verMap['PENDING'] || 0, rejected: verMap['REJECTED'] || 0, expired: 0 },
      riskAnalysis: riskDist.map(r => ({
        riskLevel: String(r.riskLevel || ''),
        count: Number(r.count || 0),
        percentage: Number(r.percentage || 0),
      })),
      improvementRecommendations: improvementAreas.slice(0, 5).map(a => ({
        area: 'TradTrust Score', currentScore: a.score,
        impact: avgScore > 0 ? `${Math.round(((avgScore - a.score) / avgScore) * 100)}% below average` : 'Below average',
        suggestion: 'Complete verification, fulfill orders on time, reduce disputes',
      })),
    }

    const insights: FounderAiInsight[] = [
      this.insight('Trust Distribution', `${gradeDist.length} grades`, 95, `${verTotal} verified companies across ${gradeDist.length} trust grades`, 'Platform trustworthiness', 'Promote TradTrust verification benefits', 'Higher trust scores across platform', 'TradTrust', 'medium'),
      this.insight('Verification Funnel', `${verMap['APPROVED'] || 0} approved`, 90, `${verMap['APPROVED'] || 0} approved, ${verMap['PENDING'] || 0} pending, ${verMap['REJECTED'] || 0} rejected out of ${verTotal}`, 'Trust verification pipeline', (verMap['PENDING'] || 0) > 20 ? 'Speed up verification processing' : 'Auto-approve trusted companies', 'Faster verification cycle', 'TradTrust', (verMap['PENDING'] || 0) > 20 ? 'high' : 'medium'),
      this.insight('Average Trust Score', `${avgScore}/1000`, 90, `Average TradTrust score across all companies is ${avgScore}`, 'Overall platform trust health', avgScore < 500 ? 'Launch trust improvement initiatives' : 'Maintain trust quality standards', 'Improved platform trust perception', 'TradTrust', avgScore < 400 ? 'high' : 'medium'),
    ]

    const result = { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheKey, result, 300)
    return result
  }

  async advertisingIntelligence(): Promise<FounderAiResponse<AdvertisingIntelligenceResponse>> {
    let adDashboard: any = {}
    try { adDashboard = await this.advertising.getAdminDashboard() } catch { this.logger.warn('Graceful degradation in founderAi.advertisingIntelligence.getAdminDashboard'); adDashboard = {} }

    const total = Number(adDashboard?.total || 0)
    const active = Number(adDashboard?.active || 0)
    const totalSpend = Number(adDashboard?.totalSpend || 0)
    const totalImpressions = Number(adDashboard?.totalImpressions || 0)
    const totalClicks = Number(adDashboard?.totalClicks || 0)
    const byType: any[] = Array.isArray(adDashboard?.byType) ? adDashboard.byType : []
    const ctr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0

    const typeStats = byType.map(t => ({
      type: String(t.type || ''),
      roi: Number(t.roi || 0),
      spend: `₹${(Number(t.spend || 0)).toLocaleString()}`,
    }))
    const avgRoi = typeStats.length > 0 ? Math.round(typeStats.reduce((a: number, t: { roi: number }) => a + t.roi, 0) / typeStats.length * 100) / 100 : 0

    const spendByType = byType.map(t => ({
      type: String(t.type || ''),
      amount: `₹${(Number(t.spend || 0)).toLocaleString()}`,
      percentage: totalSpend > 0 ? Math.round(((Number(t.spend || 0)) / totalSpend) * 100) : 0,
    }))

    const ctrByType = byType.map(t => {
      const impressions = Number(t.impressions || 0)
      const clicks = Number(t.clicks || 0)
      return { type: String(t.type || ''), ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0 }
    })

    const data: AdvertisingIntelligenceResponse = {
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      campaignROI: { avgRoi, byType: typeStats },
      topPerformingAds: [],
      spend: { total: `₹${totalSpend.toLocaleString()}`, byType: spendByType },
      ctr: { average: ctr, byType: ctrByType },
      conversion: { totalConversions: 0, avgConversionRate: 0, byType: [] },
    }

    const insights: FounderAiInsight[] = [
      this.insight('Advertising Health', `${active}/${total} active ads`, 90, `${active} active ads out of ${total} total`, 'Revenue generation through advertising', active < 5 ? 'Launch seller ad incentive program' : 'Optimize active campaigns', 'Increased ad inventory and revenue', 'Advertising', active < 3 ? 'high' : 'medium'),
      this.insight('Campaign ROI', `${avgRoi}x average`, 85, `Average ROI across ${typeStats.length} ad types is ${avgRoi}x`, 'Advertising profitability', avgRoi < 1 ? 'Improve targeting and creative quality' : 'Scale high-ROI ad types', 'Improved advertising ROI', 'Advertising', avgRoi < 0.5 ? 'high' : 'medium'),
      this.insight('Ad Engagement', `${ctr}% CTR`, 85, `Average click-through rate is ${ctr}% across all ad types`, 'Ad effectiveness and relevance', ctr < 1 ? 'Improve ad placement precision and creative' : 'Maintain engagement with A/B testing', 'Better ad performance', 'Advertising', ctr < 0.5 ? 'high' : 'medium'),
    ]

    return { success: true, data, generatedAt: new Date().toISOString(), insights, meta: this.buildMeta(insights) }
  }

  async securityIntelligence(): Promise<FounderAiResponse<SecurityIntelligenceResponse>> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);
    const dayAgo = new Date(now.getTime() - 86400000);

    const cacheK = this.cacheKey('securityIntel')
    const cached = await this.cacheGet<FounderAiResponse<SecurityIntelligenceResponse>>(cacheK)
    if (cached) return cached

    const [openIncidents, resolvedIncidents, auditTotal, failedLogins24h, promptInject24h, wsReject24h, privilegeChanges24h, dailyCounts] = await Promise.all([
      this.prisma.incident.count({ where: { status: { in: [IncidentStatus.DETECTED, IncidentStatus.INVESTIGATING] } } }).catch(gracefulCatch('founderAi.securityIntelligence.openIncidents', 0)),
      this.prisma.incident.count({ where: { status: IncidentStatus.RESOLVED } }).catch(gracefulCatch('founderAi.securityIntelligence.resolvedIncidents', 0)),
      this.prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }).catch(gracefulCatch('founderAi.securityIntelligence.auditTotal', 0)),
      this.prisma.auditLog.count({ where: { action: 'SECURITY_LOGIN_FAILURE', createdAt: { gte: dayAgo } } }).catch(gracefulCatch('founderAi.securityIntelligence.failedLogins24h', 0)),
      this.prisma.auditLog.count({ where: { action: 'SECURITY_PROMPT_INJECTION', createdAt: { gte: dayAgo } } }).catch(gracefulCatch('founderAi.securityIntelligence.promptInject24h', 0)),
      this.prisma.auditLog.count({ where: { action: 'SECURITY_WEBSOCKET_REJECTED', createdAt: { gte: dayAgo } } }).catch(gracefulCatch('founderAi.securityIntelligence.wsReject24h', 0)),
      this.prisma.auditLog.count({ where: { action: 'SECURITY_PRIVILEGE_ESCALATION', createdAt: { gte: dayAgo } } }).catch(gracefulCatch('founderAi.securityIntelligence.privilegeChanges24h', 0)),
      this.getDailySecurityCounts(weekAgo),
    ]);

    const autoResolved = await this.prisma.incident.count({ where: { autoResolved: true } }).catch(gracefulCatch('founderAi.securityIntelligence.autoResolved', 0));

    const severityDist = await Promise.all(
      (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) =>
        this.prisma.incident.count({ where: { severity: sev } }).catch(gracefulCatch('founderAi.securityIntelligence.severityCount', 0))
      )
    );

    const severityDistribution = { CRITICAL: severityDist[0], HIGH: severityDist[1], MEDIUM: severityDist[2], LOW: severityDist[3] };

    const totalIncidents = severityDist.reduce((a, b) => a + b, 0);
    const threatScore = totalIncidents > 0
      ? Math.min(100, Math.round((severityDist[0] * 40 + severityDist[1] * 25 + severityDist[2] * 10) / Math.max(totalIncidents, 1)))
      : 0;
    const platformSecurityScore = Math.max(0, 100 - threatScore);
    const threatLevel = platformSecurityScore >= 90 ? 'low' as const : platformSecurityScore >= 70 ? 'medium' as const : platformSecurityScore >= 50 ? 'high' as const : 'critical' as const;

    const data: SecurityIntelligenceResponse = {
      platformSecurityScore,
      threatLevel,
      trends: {
        daily: dailyCounts,
        weeklyChange: dailyCounts.length >= 2 ? dailyCounts[dailyCounts.length - 1].count - dailyCounts[0].count : 0,
      },
      incidents: {
        open: openIncidents,
        resolved: resolvedIncidents,
        autoResolved,
        severityDistribution,
        sourceDistribution: {},
      },
      authentication: {
        failedLogins24h,
        accountLocks24h: failedLogins24h,
        privilegeChanges24h,
      },
      promptInjection: {
        totalBlocked: promptInject24h,
        topFields: [],
      },
      websocketRejections: {
        total: wsReject24h,
        byReason: {},
      },
      topRisks: [
        { title: 'Failed Logins', severity: failedLogins24h > 10 ? 'high' : failedLogins24h > 3 ? 'medium' : 'low', count: failedLogins24h, trend: 'stable' as const },
        { title: 'Prompt Injections', severity: promptInject24h > 5 ? 'high' : promptInject24h > 0 ? 'medium' : 'low', count: promptInject24h, trend: 'stable' as const },
        { title: 'Privilege Changes', severity: privilegeChanges24h > 3 ? 'high' : privilegeChanges24h > 0 ? 'medium' : 'low', count: privilegeChanges24h, trend: 'stable' as const },
        { title: 'WebSocket Rejections', severity: wsReject24h > 20 ? 'medium' : 'low', count: wsReject24h, trend: 'stable' as const },
      ],
    };

    const insights: FounderAiInsight[] = [
      this.insight('Platform Security Score', `${platformSecurityScore}/100`, 90, `Based on ${totalIncidents} total incidents with ${severityDistribution.CRITICAL} critical`, 'Overall platform security posture', platformSecurityScore < 70 ? 'Run security audit and review incident response' : 'Maintain current security posture', 'Platform security score stabilized', 'AuditLog', platformSecurityScore < 50 ? 'critical' as const : platformSecurityScore < 70 ? 'high' as const : 'medium' as const),
      this.insight('Authentication Health', `${failedLogins24h} failures in 24h`, 85, `${failedLogins24h} failed login attempts in last 24 hours`, 'User account security', failedLogins24h > 10 ? 'Investigate possible brute force attack' : 'Authentication health normal', 'Reduced account compromise risk', 'AuditLog', failedLogins24h > 10 ? 'high' as const : 'low' as const),
      this.insight('Prompt Injection Activity', `${promptInject24h} blocked in 24h`, 90, `${promptInject24h} prompt injection attempts detected and blocked`, 'AI system security', promptInject24h > 0 ? 'Review AI prompt patterns and update injection rules' : 'No action needed', 'AI system integrity maintained', 'AiGateway', promptInject24h > 5 ? 'high' as const : 'medium' as const),
      this.insight('Incident Response', `${openIncidents} open / ${resolvedIncidents} resolved`, 85, `${openIncidents} incidents currently being investigated`, 'Security operations efficiency', openIncidents > 5 ? 'Escalate incident response resources' : 'Normal incident volume', 'Improved security response time', 'Launch', openIncidents > 5 ? 'high' as const : 'low' as const),
    ];

    const result = { success: true, data, generatedAt: now.toISOString(), insights, meta: this.buildMeta(insights) }
    await this.cacheSet(cacheK, result)
    return result
  }

  private async getDailySecurityCounts(since: Date): Promise<{ date: string; count: number }[]> {
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: { action: { startsWith: 'SECURITY_' }, createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      const counts: Record<string, number> = {};
      for (const log of logs) {
        const day = log.createdAt.toISOString().slice(0, 10);
        counts[day] = (counts[day] || 0) + 1;
      }
      return Object.entries(counts).map(([date, count]) => ({ date, count }));
    } catch { this.logger.warn('Graceful degradation in founderAi.getDailySecurityCounts'); return [] }
  }
}
