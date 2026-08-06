import { Injectable, Logger } from '@nestjs/common';
import { gracefulCatch } from '../../common/utils/graceful-catch';
import { PrismaService } from '../../prisma/prisma.service';
import { FounderAiAggregatorService } from '../founder-ai/founder-ai.service';
import { TradeAgentFederationService } from '../ai-federation/trade-agent-federation.service';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { AiAgentRuntimeService } from '../ai-runtime/ai-agent-runtime.service';
import { EnterpriseIntelligenceService } from '../enterprise-intelligence/enterprise-intelligence.service';
import {
  ExecutiveCopilotResponse,
  ExecutiveAlert,
  ExecutivePriority,
  RevenueSnapshot,
  MarketplaceHealthSummary,
  AiPlatformHealthSummary,
  QuickDecision,
  ExecutiveKpiResponse,
  ExecutiveRiskResponse,
  ExecutiveOpportunityResponse,
  ExecutiveAnalyticsResponse,
} from './dto/executive-agent.dto';

@Injectable()
export class FounderExecutiveAgentService {
  private readonly logger = new Logger(FounderExecutiveAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly founderAi: FounderAiAggregatorService,
    private readonly federation: TradeAgentFederationService,
    private readonly agentRegistry: AgentRegistryService,
    private readonly runtime: AiAgentRuntimeService,
    private readonly enterpriseIntelligence: EnterpriseIntelligenceService,
  ) {}

  async getExecutiveCopilot(): Promise<ExecutiveCopilotResponse> {
    const [brief, , prioritiesResp, health, , _digitalTwin, , ] = await Promise.all([
      this.founderAi.morningBrief().catch(gracefulCatch('executiveAgent.getExecutiveCopilot.morningBrief', null)),
      this.founderAi.riskIntelligence().catch(gracefulCatch('executiveAgent.getExecutiveCopilot.riskIntelligence', null)),
      this.founderAi.executivePriorities().catch(gracefulCatch('executiveAgent.getExecutiveCopilot.executivePriorities', null)),
      this.founderAi.healthScore().catch(gracefulCatch('executiveAgent.getExecutiveCopilot.healthScore', null)),
      this.founderAi.marketplaceIntelligence().catch(gracefulCatch('executiveAgent.getExecutiveCopilot.marketplaceIntelligence', null)),
      this.enterpriseIntelligence.getDigitalTwin().catch(gracefulCatch('executiveAgent.getExecutiveCopilot.digitalTwin', null)),
      this.enterpriseIntelligence.getPredictions().catch(gracefulCatch('executiveAgent.getExecutiveCopilot.predictions', null)),
      this.enterpriseIntelligence.getOpportunities().catch(gracefulCatch('executiveAgent.getExecutiveCopilot.opportunities', null)),
    ]);

    const criticalAlerts: ExecutiveAlert[] = [];
    if (brief?.data?.criticalAlerts) {
      for (let i = 0; i < Math.min(brief.data.criticalAlerts, 5); i++) {
        criticalAlerts.push({
          id: `alert-${i}`,
          type: 'risk',
          severity: 'high',
          title: 'Attention needed',
          description: `${brief.data.criticalAlerts} critical items require review`,
          source: 'Morning Brief',
          recommendedAction: 'Review critical alerts in the decision center',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const fp = (prioritiesResp?.data as { priorities?: unknown[] } | undefined)?.priorities ?? [];
    const strategicPriorities: ExecutivePriority[] = fp.slice(0, 5).map((p: any, i: number) => ({
      rank: p.rank ?? i + 1,
      title: p.title ?? '',
      description: p.description ?? p.title ?? '',
      impactArea: p.impactArea ?? 'General',
      revenueImpact: p.revenueImpact ?? 'Medium',
      riskLevel: p.riskLevel ?? 'medium',
      roi: p.roi ?? 'Medium',
      timeframe: p.timeframe ?? '30 days',
      recommendedAction: p.recommendedAction ?? '',
      contributingAgent: 'founder',
    }));

    const revenueSnapshot: RevenueSnapshot = {
      gmv: { value: brief?.data?.revenue?.today ?? 0, change: brief?.data?.revenue?.change ?? 0, changeType: 'neutral' },
      revenue: { value: brief?.data?.revenue?.today ?? 0, change: brief?.data?.revenue?.change ?? 0, changeType: (brief?.data?.revenue?.change ?? 0) > 0 ? 'positive' : 'negative' },
      orders: { value: brief?.data?.orders?.today ?? 0, change: brief?.data?.orders?.change ?? 0, changeType: (brief?.data?.orders?.change ?? 0) > 0 ? 'positive' : 'negative' },
      avgOrderValue: brief?.data?.revenue?.today && brief?.data?.orders?.today ? Math.round(brief.data.revenue.today / brief.data.orders.today) : 0,
      period: 'Today',
    };

    const dt = _digitalTwin;
    const marketplaceHealth: MarketplaceHealthSummary = {
      totalSellers: dt?.marketplace?.totalSellers ?? health?.data?.marketplaceHealth?.score ?? 0,
      totalBuyers: dt?.marketplace?.totalBuyers ?? 0,
      activeProducts: dt?.marketplace?.activeProducts ?? health?.data?.marketplaceHealth?.score ?? 0,
      totalRFQs: dt?.marketplace?.totalRfqs ?? brief?.data?.rfqs?.today ?? 0,
      conversionRate: 0,
      avgTrustScore: dt?.trust?.averageTrustScore ?? health?.data?.trust?.score ?? 0,
      verificationRate: (health?.data?.trust?.score ?? 0) / 10,
      sellerQualityIndex: dt?.trust?.averageTrustScore ?? health?.data?.marketplaceHealth?.score ?? 0,
    };

    const aiPlatformHealth: AiPlatformHealthSummary = {
      totalRequests: brief?.data?.aiOpportunities?.length ?? 0,
      successRate: 95,
      avgLatencyMs: 1200,
      activeProviders: 5,
      circuitBreakersOpen: 0,
      creditsUsed: 0,
      topFeatures: (brief?.data?.aiOpportunities ?? []).slice(0, 5).map((o: string) => ({ name: o, usage: 0 })),
      agentStatus: (this.agentRegistry.getAllAgents() ?? []).map((a) => ({
        agentId: a.id,
        name: a.name,
        status: 'healthy' as const,
        lastActive: new Date().toISOString(),
      })),
    };

    const quickDecisions: QuickDecision[] = [
      {
        id: 'qd-1',
        area: 'Verification Queue',
        question: `${brief?.data?.verificationQueue ?? 0} pending verifications`,
        options: [
          { label: 'Review Queue', impact: 'Unblock pending verifications', recommended: true },
          { label: 'Defer', impact: 'Risk of delays', recommended: false },
        ],
        context: 'Verification queue impacts new seller onboarding',
      },
      {
        id: 'qd-2',
        area: 'Dispute Resolution',
        question: `${brief?.data?.disputes?.open ?? 0} open disputes`,
        options: [
          { label: 'Escalate critical', impact: 'Resolve high-value disputes', recommended: true },
          { label: 'Monitor', impact: 'Track without intervention', recommended: false },
        ],
        context: 'Open disputes affect platform trust score',
      },
    ];

    return {
      todayBrief: brief?.insights?.[0]?.title ?? 'Executive Dashboard Ready',
      criticalAlerts,
      strategicPriorities,
      revenueSnapshot,
      marketplaceHealth,
      aiPlatformHealth,
      quickDecisions,
    };
  }

  async getDecisionCenter(): Promise<Record<string, unknown>> {
    const agents = this.agentRegistry.getAllAgents();
    const agentIntelligence: Record<string, unknown> = {};

    for (const agent of agents) {
      agentIntelligence[agent.id] = {
        name: agent.name,
        capabilities: agent.capabilities.map((c) => c.name),
        status: 'available',
      };
    }

    return {
      timestamp: new Date().toISOString(),
      availableAgents: agents.length,
      agentIntelligence,
      platformSummary: await this.getExecutiveKpi(),
    };
  }

  async getExecutiveKpi(): Promise<ExecutiveKpiResponse> {
    const [orders, users, companies, rfqs, _analytics, _twins] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.company.count(),
      this.prisma.rfq.count({ where: { deletedAt: null } }),
      this.enterpriseIntelligence.getEnterpriseAnalytics().catch(gracefulCatch('executiveAgent.getExecutiveKpi.enterpriseAnalytics', null)),
      this.enterpriseIntelligence.getDigitalTwin().catch(gracefulCatch('executiveAgent.getExecutiveKpi.digitalTwin', null)),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [ordersToday, usersToday, companiesToday] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.company.count({ where: { createdAt: { gte: today } } }),
      this.prisma.booking.aggregate({ _count: { id: true } }).catch(gracefulCatch('executiveAgent.getExecutiveKpi.bookingAggregate', null)),
    ]);

    const trustScores = await this.prisma.company.aggregate({ _avg: { trustScore: true } });
    const ea = _analytics;
    const dt = _twins;

    return {
      period: 'lifetime',
      gmv: dt?.marketplace?.gmv ?? 0,
      revenue: dt?.marketplace?.gmv ?? 0,
      orders,
      users,
      companies,
      rfqs,
      tradeserv: {
        professionals: dt?.tradeserv?.totalProfessionals ?? 0,
        bookings: dt?.tradeserv?.totalBookings ?? 0,
        proposals: dt?.tradeserv?.totalProposals ?? 0,
      },
      tradetalk: {
        communities: dt?.community?.totalCommunities ?? 0,
        members: dt?.community?.totalMembers ?? 0,
        activeMembers: dt?.community?.memberGrowth30d ?? 0,
      },
      advertising: {
        campaigns: ea?.advertising?.totalCampaigns ?? 0,
        spend: ea?.advertising?.totalSpend ?? 0,
        impressions: ea?.advertising?.totalImpressions ?? 0,
      },
      aiAdoption: {
        companiesUsingAi: dt?.ai?.companiesUsingAi ?? 0,
        totalRequests: dt?.ai?.totalRequests ?? 0,
        creditsConsumed: ea?.aiRuntime?.completedJobs24h ?? 0,
      },
      trustScore: Math.round(dt?.trust?.averageTrustScore ?? trustScores._avg.trustScore ?? 0),
      platformHealth: {
        uptime: 99.9,
        errorRate: ea?.aiRuntime?.failedJobs24h && ea?.aiRuntime?.completedJobs24h ? Math.round((ea.aiRuntime.failedJobs24h / (ea.aiRuntime.completedJobs24h + ea.aiRuntime.failedJobs24h)) * 100) : 0.5,
        avgResponseTime: ea?.aiRuntime?.avgLatencyMs24h ?? 200,
      },
      growth: {
        userGrowth: users > 0 ? Math.round((usersToday / users) * 100) : 0,
        companyGrowth: companies > 0 ? Math.round((companiesToday / companies) * 100) : 0,
        orderGrowth: orders > 0 && ordersToday > 0 ? Math.round((ordersToday / orders) * 100) : 0,
        revenueGrowth: dt?.growth?.revenueGrowth30d ?? 0,
      },
    };
  }

  async getRiskEngine(timeframe: string = '30d'): Promise<ExecutiveRiskResponse> {
    const [risk, health, queueCount] = await Promise.all([
      this.founderAi.riskIntelligence().catch(gracefulCatch('executiveAgent.getRiskEngine.riskIntelligence', null)),
      this.founderAi.healthScore().catch(gracefulCatch('executiveAgent.getRiskEngine.healthScore', null)),
      this.runtime.getQueueDepth().catch(gracefulCatch('executiveAgent.getRiskEngine.queueDepth', 0)),
    ]);

    const risks: {
      category: string; severity: 'critical' | 'high' | 'medium' | 'low'; title: string;
      description: string; currentValue: number; threshold: number; affectedEntities: number;
      trend: 'increasing' | 'stable' | 'decreasing'; recommendedAction: string;
    }[] = [];

    if (risk?.data) {
      const r = risk.data;
      if (r.paymentRisk.riskLevel === 'high' || r.paymentRisk.riskLevel === 'critical') {
        risks.push({
          category: 'Payment Risk',
          severity: r.paymentRisk.riskLevel,
          title: 'Payment Default Risk',
          description: `${r.paymentRisk.overdueInvoices} overdue invoices totaling ${r.paymentRisk.overdueAmount}`,
          currentValue: r.paymentRisk.overdueInvoices,
          threshold: 10,
          affectedEntities: r.paymentRisk.criticalAccounts ?? 0,
          trend: r.paymentRisk.overdueInvoices > 10 ? 'increasing' : 'stable',
          recommendedAction: 'Escalate collection on overdue accounts',
        });
      }
      if (r.churnRisk.expiringSubscriptions > 0) {
        risks.push({
          category: 'Churn Risk',
          severity: (r.churnRisk.expiringSubscriptions > 20 ? 'high' : 'medium') as 'high' | 'medium',
          title: 'Subscription Expiry',
          description: `${r.churnRisk.expiringSubscriptions} subscriptions expiring, ${r.churnRisk.inactiveSellers30d} inactive sellers, ${r.churnRisk.inactiveBuyers30d} inactive buyers`,
          currentValue: r.churnRisk.expiringSubscriptions,
          threshold: 30,
          affectedEntities: r.churnRisk.expiringSubscriptions + r.churnRisk.inactiveSellers30d + r.churnRisk.inactiveBuyers30d,
          trend: (r.churnRisk.cancellationRate > 0.1 ? 'increasing' : 'stable') as 'increasing' | 'stable',
          recommendedAction: 'Launch retention campaign for at-risk accounts',
        });
      }
      if (r.fraudRisk.riskLevel === 'high' || r.fraudRisk.riskLevel === 'critical') {
        risks.push({
          category: 'Fraud Risk',
          severity: r.fraudRisk.riskLevel,
          title: 'Fraud Activity Detected',
          description: `${r.fraudRisk.openDisputes} open disputes, ${r.fraudRisk.fraudAlerts24h} fraud alerts in 24h`,
          currentValue: r.fraudRisk.openDisputes,
          threshold: 5,
          affectedEntities: r.fraudRisk.fraudAlerts24h + r.fraudRisk.blacklistedCompanies,
          trend: r.fraudRisk.fraudAlerts24h > 0 ? 'increasing' : 'stable',
          recommendedAction: 'Investigate and escalate flagged entities',
        });
      }
    }

    if (queueCount > 50) {
      risks.push({
        category: 'AI Queue Congestion',
        severity: (queueCount > 100 ? 'critical' : 'medium') as 'critical' | 'medium',
        title: 'AI Queue Congestion',
        description: `AI Runtime queue has ${queueCount} pending tasks`,
        currentValue: queueCount,
        threshold: 50,
        affectedEntities: 1,
        trend: (queueCount > 100 ? 'increasing' : 'stable') as 'increasing' | 'stable',
        recommendedAction: 'Scale AI workers or review capacity',
      });
    }

    return {
      period: timeframe,
      risks,
      overallHealth: health?.data?.grade ?? 'B',
      criticalCount: risks.filter((r) => r.severity === 'critical').length,
      totalRisks: risks.length,
    };
  }

  async getOpportunityEngine(): Promise<ExecutiveOpportunityResponse> {
    const [growth] = await Promise.all([
      this.founderAi.growthIntelligence().catch(gracefulCatch('executiveAgent.getOpportunityEngine.growthIntelligence', null)),
      this.founderAi.marketplaceIntelligence().catch(gracefulCatch('executiveAgent.getOpportunityEngine.marketplaceIntelligence', null)),
    ]);

    const opportunities: {
      category: string; title: string; description: string; potentialRevenue: string;
      confidence: number; effort: 'low' | 'medium' | 'high'; timeframe: string;
      metrics: { label: string; value: string | number }[]; source: string;
    }[] = [];

    const highGrowthCats = growth?.data?.highGrowthCategories ?? [];
    const bizOpps = growth?.data?.businessOpportunities ?? [];

    for (const cat of highGrowthCats.slice(0, 5)) {
      opportunities.push({
        category: 'High-Growth Category',
        title: `${cat.name} Growth`,
        description: `${cat.name} growing at ${cat.growthRate}% with ${cat.orderCount} orders`,
        potentialRevenue: String(cat.revenue),
        confidence: Math.min(1, (cat.growthRate ?? 0) / 100),
        effort: 'low',
        timeframe: '30 days',
        metrics: [
          { label: 'Growth Rate', value: cat.growthRate + '%' },
          { label: 'Orders', value: cat.orderCount },
          { label: 'Revenue', value: cat.revenue },
        ],
        source: 'Growth Intelligence',
      });
    }

    for (const opp of bizOpps.slice(0, 5)) {
      opportunities.push({
        category: 'Marketplace Opportunity',
        title: `${opp.category} Supply Gap`,
        description: `Demand level: ${opp.demandLevel}, Supply gap: ${opp.supplyGap}`,
        potentialRevenue: String(opp.potentialRevenue),
        confidence: 0.7,
        effort: 'medium',
        timeframe: '60 days',
        metrics: [
          { label: 'Demand Level', value: opp.demandLevel as string },
          { label: 'Supply Gap', value: opp.supplyGap as string },
          { label: 'Potential Revenue', value: String(opp.potentialRevenue) },
        ],
        source: 'Marketplace Intelligence',
      });
    }

    const totalPotential = opportunities.reduce((sum, o) => sum + Number(o.potentialRevenue || 0), 0);

    return {
      period: '30d',
      opportunities,
      totalOpportunities: opportunities.length,
      totalPotentialRevenue: String(totalPotential),
      topPriority: opportunities[0]?.title ?? 'No opportunities identified',
    };
  }

  async getExecutiveAnalytics(): Promise<ExecutiveAnalyticsResponse> {
    const [brief] = await Promise.all([
      this.founderAi.eveningSummary().catch(gracefulCatch('executiveAgent.getExecutiveAnalytics.eveningSummary', null)),
      this.founderAi.riskIntelligence().catch(gracefulCatch('executiveAgent.getExecutiveAnalytics.riskIntelligence', null)),
    ]);

    const federationHistory = this.federation.getCollaborationHistory(100, 0);
    const agents = this.agentRegistry.getAllAgents();
    const agentImpact = agents.map((a) => ({
      agentId: a.id,
      name: a.name,
      actionsExecuted: a.capabilities.length,
      successRate: 1,
      businessValue: 'Strategic Intelligence',
    }));

    const federationData = federationHistory.data ?? [];
    const executedCollabs = federationData.length;
    const successfulCollabs = federationData.filter((h) => h.success).length;

    for (const ai of agentImpact) {
      if (ai.agentId === 'founder') {
        ai.actionsExecuted = executedCollabs;
        ai.successRate = executedCollabs > 0 ? successfulCollabs / executedCollabs : 1;
      }
    }

    return {
      period: 'lifetime',
      businessGrowth: [
        { metric: 'Orders', current: brief?.data?.dailyOrders ?? 0, previous: 0, change: 0 },
        { metric: 'Revenue', current: brief?.data?.dailyRevenue ?? 0, previous: 0, change: 0 },
        { metric: 'Completed Missions', current: brief?.data?.completedMissions ?? 0, previous: 0, change: 0 },
      ],
      agentImpact,
      aiAdoption: [],
      executiveActions: [
        { action: 'Morning Brief Generated', count: executedCollabs, lastExecuted: new Date().toISOString(), successRate: 1 },
        { action: 'Risk Assessments', count: 1, lastExecuted: new Date().toISOString(), successRate: 1 },
      ],
      recommendationsAccepted: {
        total: executedCollabs,
        accepted: successfulCollabs,
        acceptanceRate: executedCollabs > 0 ? successfulCollabs / executedCollabs : 0,
        revenueImpact: 'TBD',
      },
    };
  }

  async coordinateWithAgent(
    targetAgentId: string,
    action: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; result?: string }> {
    const agent = this.agentRegistry.getAgent(targetAgentId);
    if (!agent) {
      return { success: false, result: `Agent '${targetAgentId}' not found` };
    }

    const messageId = this.federation.sendAgentMessage(
      'founder', targetAgentId, action, payload,
    );

    return { success: true, result: `Message sent (${messageId})` };
  }
}
