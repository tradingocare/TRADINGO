import { Injectable, Logger } from '@nestjs/common'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { PromptManagerService } from '../ai-gateway/prompt-manager.service'
import { TaskType } from '@prisma/client'

@Injectable()
export class AiAdminService {
  private readonly logger = new Logger(AiAdminService.name)

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
  ) {}

  async onModuleInit() {
    try {
      await this.prompts.getPrompt(TaskType.ADMIN_INTELLIGENCE)
    } catch {
      await this.prompts.createPrompt({
        taskType: TaskType.ADMIN_INTELLIGENCE,
        name: 'AI Admin Intelligence & Executive Copilot',
        description: 'Default prompt for AI Admin Intelligence — morning brief, revenue forecast, user growth, fraud intelligence, churn prediction, category intelligence, geo intelligence, market trends, alerts, executive copilot, reports, decision support',
        systemPrompt: `You are TRADINGO's AI Admin Intelligence & Executive Copilot for the B2B marketplace platform administrator.

Your role is to help Super Admin run the marketplace by analyzing platform data and providing actionable intelligence:

1. **Morning Executive Brief**: Generate a daily executive summary covering platform health (orders, revenue, users, disputes), yesterday's performance vs target, key wins and risks, and today's focus areas. Include confidence level per metric.

2. **Revenue Forecast (7/30/90 days)**: Predict revenue based on historical trends, current run-rate, seasonal patterns, and growth trajectory. Return expected revenue, confidence interval (low/high), key drivers, and risk factors.

3. **User Growth Prediction (Buyer/Seller/RM)**: Forecast user acquisition trends for next 1-3 months. Provide expected new registrations, growth rate, segment breakdown, and recommendations to accelerate growth.

4. **Fraud Intelligence**: Analyze platform-wide fraud signals across wallets (velocity anomalies, high failure rates, unusual reversals), referrals (self-referral, circular patterns, abnormal velocity), finance (payment fraud, chargeback patterns, credit abuse), and disputes. Flag critical risks with priority levels.

5. **Churn Prediction (Buyer/Seller)**: Predict churn risk based on engagement decline, order gaps, support tickets, payment issues, login frequency changes. Return risk score per segment, early warning signs, and retention recommendations.

6. **Category Intelligence**: Identify fastest-growing categories (by order volume growth, revenue), slowest categories (declining), most profitable categories (margin), and emerging categories. Include trend direction and confidence.

7. **Geo Intelligence**: Analyze top-performing cities and states by revenue and user base, identify emerging markets with growth potential, and recommend expansion targets.

8. **Market Trends**: Analyze demand patterns (search volume trends, RFQ categories), pricing trends (average order value changes, category price movements), and seasonality (monthly/quarterly patterns, upcoming demand peaks).

9. **AI Alerts (Revenue Risk, Fraud, Server Issues, Low Engagement, Collections)**: Generate prioritized alerts across all risk domains. Include severity (Critical/High/Medium/Low), affected metrics, trigger conditions, and recommended actions.

10. **Executive Copilot**: Inside Admin Dashboard — provide platform health overview (key metrics vs targets), revenue snapshot with trend, growth metrics (users, companies, transactions), risk assessment with top 3 risks, strategic recommendations, and prioritized action items.

11. **Weekly & Monthly Reports**: Auto-generated executive reports with period-over-period comparison, key achievements, areas needing attention, trend analysis, forecasts, and strategic recommendations.

12. **Decision Support**: Analyze opportunities and suggest campaigns (target audience, budget, timing, expected ROI), membership offers (pricing, features, target segments), advertising opportunities (high-impression categories, under-monetized sections), and market expansion (new cities, industries, buyer segments).

Always respond with valid JSON. Be specific, data-driven, and actionable. Use Indian market context (INR, GST, 45-day payment cycles, UPI, NEFT/RTGS, Indian festivals and seasons, metro + tier-2/3 cities) when relevant. Never auto-act — provide analysis and recommendations only. Use confidence scores for all predictions.`,
        userPrompt: `Action: {{action}}

Context:
{{context}}

Provide a structured JSON response appropriate for the action. Include scores, confidence levels, risk indicators, recommendations, and action items as applicable. Return ONLY valid JSON.`,
        variables: ['action', 'context'],
        temperature: 0.3,
        maxTokens: 4096,
      })
      this.logger.log('Seeded default ADMIN_INTELLIGENCE prompt for AI Admin Intelligence')
    }
  }

  async morningBrief(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.date) context.date = payload.date
    if (payload.platformData) context.platformData = payload.platformData
    if (payload.yesterdayStats) context.yesterdayStats = payload.yesterdayStats

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'morning_brief', context },
    }, companyId, userId)
  }

  async revenueForecast(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.forecastDays) context.forecastDays = payload.forecastDays
    if (payload.revenueData) context.revenueData = payload.revenueData
    if (payload.historicalData) context.historicalData = payload.historicalData

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'revenue_forecast', context },
    }, companyId, userId)
  }

  async userGrowthPrediction(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.buyerData) context.buyerData = payload.buyerData
    if (payload.sellerData) context.sellerData = payload.sellerData
    if (payload.rmData) context.rmData = payload.rmData
    if (payload.forecastMonths) context.forecastMonths = payload.forecastMonths

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'user_growth_prediction', context },
    }, companyId, userId)
  }

  async fraudIntelligence(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.walletAlerts) context.walletAlerts = payload.walletAlerts
    if (payload.referralAlerts) context.referralAlerts = payload.referralAlerts
    if (payload.financeSignals) context.financeSignals = payload.financeSignals
    if (payload.disputesData) context.disputesData = payload.disputesData

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'fraud_intelligence', context },
    }, companyId, userId)
  }

  async churnPrediction(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.buyerChurnData) context.buyerChurnData = payload.buyerChurnData
    if (payload.sellerChurnData) context.sellerChurnData = payload.sellerChurnData
    if (payload.engagementData) context.engagementData = payload.engagementData
    if (payload.subscriptionData) context.subscriptionData = payload.subscriptionData

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'churn_prediction', context },
    }, companyId, userId)
  }

  async categoryIntelligence(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.categories) context.categories = payload.categories
    if (payload.orderData) context.orderData = payload.orderData
    if (payload.revenueData) context.revenueData = payload.revenueData

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'category_intelligence', context },
    }, companyId, userId)
  }

  async geoIntelligence(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.cityData) context.cityData = payload.cityData
    if (payload.stateData) context.stateData = payload.stateData
    if (payload.buyerData) context.buyerData = payload.buyerData
    if (payload.sellerData) context.sellerData = payload.sellerData

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'geo_intelligence', context },
    }, companyId, userId)
  }

  async marketTrends(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.searchTrends) context.searchTrends = payload.searchTrends
    if (payload.pricingData) context.pricingData = payload.pricingData
    if (payload.seasonalData) context.seasonalData = payload.seasonalData
    if (payload.demandData) context.demandData = payload.demandData

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'market_trends', context },
    }, companyId, userId)
  }

  async aiAlerts(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.revenueData) context.revenueData = payload.revenueData
    if (payload.fraudData) context.fraudData = payload.fraudData
    if (payload.serverHealth) context.serverHealth = payload.serverHealth
    if (payload.engagementData) context.engagementData = payload.engagementData
    if (payload.collectionsData) context.collectionsData = payload.collectionsData

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'ai_alerts', context },
    }, companyId, userId)
  }

  async executiveCopilot(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.platformHealth) context.platformHealth = payload.platformHealth
    if (payload.revenueMetrics) context.revenueMetrics = payload.revenueMetrics
    if (payload.growthMetrics) context.growthMetrics = payload.growthMetrics
    if (payload.riskMetrics) context.riskMetrics = payload.riskMetrics
    if (payload.focusArea) context.focusArea = payload.focusArea

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'executive_copilot', context },
    }, companyId, userId)
  }

  async weeklyMonthlyReport(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      reportType: payload.reportType,
    }
    if (payload.periodStart) context.periodStart = payload.periodStart
    if (payload.periodEnd) context.periodEnd = payload.periodEnd
    if (payload.analyticsData) context.analyticsData = payload.analyticsData
    if (payload.financeData) context.financeData = payload.financeData
    if (payload.growthData) context.growthData = payload.growthData

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'weekly_monthly_report', context },
    }, companyId, userId)
  }

  async decisionSupport(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.marketData) context.marketData = payload.marketData
    if (payload.platformData) context.platformData = payload.platformData
    if (payload.campaignData) context.campaignData = payload.campaignData
    if (payload.membershipData) context.membershipData = payload.membershipData
    if (payload.decisionType) context.decisionType = payload.decisionType

    return this.aiGateway.process({
      taskType: TaskType.ADMIN_INTELLIGENCE,
      payload: { action: 'decision_support', context },
    }, companyId, userId)
  }
}
