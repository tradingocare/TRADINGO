import { Injectable, Logger } from '@nestjs/common'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { PromptManagerService } from '../ai-gateway/prompt-manager.service'
import { CrmService } from './crm.service'
import { TradTrustService } from '../tradtrust/tradtrust.service'
import { PrismaService } from '../../prisma/prisma.service'
import { TaskType } from '@prisma/client'

@Injectable()
export class AiCrmService {
  private readonly logger = new Logger(AiCrmService.name)

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
    private readonly crmService: CrmService,
    private readonly tradTrust: TradTrustService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      await this.prompts.getPrompt(TaskType.CRM_ANALYSIS)
    } catch {
      await this.prompts.createPrompt({
        taskType: TaskType.CRM_ANALYSIS,
        name: 'AI CRM Copilot',
        description: 'Default prompt for AI CRM Copilot — lead scoring, next best action, conversion prediction, insights, sentiment, pipeline health, forecast, risk, communication, follow-up priority',
        systemPrompt: `You are TRADINGO's AI CRM Copilot for the B2B marketplace.

Your role is to help sellers and RM teams manage their CRM pipeline more effectively by:
1. Generating AI-powered lead scores (0-100) based on behaviour, company profile, trust score, engagement, pipeline stage, estimated value
2. Recommending next best actions for each lead (call, email, demo, proposal, follow-up, escalation, nurture)
3. Predicting conversion probability (%) with key drivers and risk factors
4. Providing deep lead insights (engagement patterns, company health, buying intent, decision-making stage)
5. Analysing sentiment from notes, interactions, and timeline events (positive, neutral, negative with confidence)
6. Assessing pipeline health (stage distribution, velocity, bottlenecks, leakages, stage conversion rates)
7. Generating sales forecasts (expected revenue, close rates, time-to-close ranges, owner-level projections)
8. Detecting deal risks (stagnation, ghosting, budget issues, competitor threats, timing risk, internal blockers)
9. Recommending specific actions per lead status (new → qualify with key questions, contacted → demo proposal, qualified → negotiation, proposal → follow-up cadence)
10. Providing communication tips (personalized messaging, tone, timing, objection handling)
11. Prioritising follow-ups (urgency score, lead value, time sensitivity, risk of losing)
12. Generating all-in-one sidebar summary (key metrics, risk level, recommended action, next follow-up, deal health)

Always respond with valid JSON. Be specific, data-driven, and actionable. Use Indian market context (INR, GST, Incoterms) when relevant. Never auto-act — provide suggestions only.`,
        userPrompt: `Action: {{action}}

Context:
{{context}}

Provide a structured JSON response appropriate for the action. Include scores, confidence levels, recommendations, and risk indicators as applicable.`,
        variables: ['action', 'context'],
        temperature: 0.3,
        maxTokens: 4096,
      })
      this.logger.log('Seeded default CRM_ANALYSIS prompt for AI CRM Copilot')
    }
  }

  async leadScoring(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.leadData) context.leadData = payload.leadData
    if (payload.companyData) context.companyData = payload.companyData

    if (payload.leadData?.companyId) {
      const trust = await this.tradTrust.getUnifiedScore(payload.leadData.companyId).catch(() => null)
      if (trust) context.trustScore = trust
    }

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'lead_scoring', context },
    }, companyId, userId)
  }

  async nextBestAction(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.leadData) context.leadData = payload.leadData
    if (payload.recentActivities) context.recentActivities = payload.recentActivities
    if (payload.leadStatus) context.leadStatus = payload.leadStatus

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'next_best_action', context },
    }, companyId, userId)
  }

  async conversionProbability(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.leadData) context.leadData = payload.leadData
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.pastInteractions) context.pastInteractions = payload.pastInteractions

    if (payload.leadData?.companyId) {
      const trust = await this.tradTrust.getUnifiedScore(payload.leadData.companyId).catch(() => null)
      if (trust) context.trustScore = trust
    }

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'conversion_probability', context },
    }, companyId, userId)
  }

  async leadInsights(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.leadData) context.leadData = payload.leadData
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.notes) context.notes = payload.notes
    if (payload.timeline) context.timeline = payload.timeline

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'lead_insights', context },
    }, companyId, userId)
  }

  async sentiment(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      notes: payload.notes ?? [],
      interactions: payload.interactions ?? [],
    }
    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'sentiment_analysis', context },
    }, companyId, userId)
  }

  async pipelineHealth(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      stages: payload.stages ?? [],
      totalPipelineValue: payload.totalPipelineValue || 0,
      activeLeads: payload.activeLeads || 0,
      conversionRate: payload.conversionRate || 0,
    }

    const leadCount = await this.prisma.crmLead.count({ where: { companyId } }).catch(() => 0)
    context.totalLeads = leadCount

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'pipeline_health', context },
    }, companyId, userId)
  }

  async forecast(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      currentPipelineValue: payload.currentPipelineValue || 0,
      activeDeals: payload.activeDeals || 0,
      historicalConversionRate: payload.historicalConversionRate,
      avgDealSize: payload.avgDealSize,
    }

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'forecast', context },
    }, companyId, userId)
  }

  async dealRisk(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.leadData) context.leadData = payload.leadData
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.recentActivities) context.recentActivities = payload.recentActivities

    if (payload.leadData?.companyId) {
      const trust = await this.tradTrust.getUnifiedScore(payload.leadData.companyId).catch(() => null)
      if (trust) context.trustScore = trust
    }

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'deal_risk', context },
    }, companyId, userId)
  }

  async recommendedActions(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.leadData) context.leadData = payload.leadData
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.leadStatus) context.leadStatus = payload.leadStatus

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'recommended_actions', context },
    }, companyId, userId)
  }

  async communicationTips(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      leadName: payload.leadName,
      leadStatus: payload.leadStatus,
      industry: payload.industry,
      pastInteractions: payload.pastInteractions ?? [],
    }
    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'communication_tips', context },
    }, companyId, userId)
  }

  async followUpPriority(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      followUps: payload.followUps ?? [],
      maxRecommendations: payload.maxRecommendations || 5,
    }
    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'follow_up_priority', context },
    }, companyId, userId)
  }

  async sidebar(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.leadData) context.leadData = payload.leadData
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.recentNotes) context.recentNotes = payload.recentNotes
    if (payload.upcomingFollowUps) context.upcomingFollowUps = payload.upcomingFollowUps
    if (payload.pendingTasks) context.pendingTasks = payload.pendingTasks

    if (payload.leadData?.companyId) {
      const trust = await this.tradTrust.getUnifiedScore(payload.leadData.companyId).catch(() => null)
      if (trust) context.trustScore = trust
    }

    return this.aiGateway.process({
      taskType: TaskType.CRM_ANALYSIS,
      payload: { action: 'crm_sidebar', context },
    }, companyId, userId)
  }
}
