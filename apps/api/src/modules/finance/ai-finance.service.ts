import { Injectable, Logger } from '@nestjs/common'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { PromptManagerService } from '../ai-gateway/prompt-manager.service'
import { CreditService } from './credit.service'
import { CollectionsService } from './collections.service'
import { FinanceDashboardService } from './finance-dashboard.service'
import { PrismaService } from '../../prisma/prisma.service'
import { TaskType } from '@prisma/client'

@Injectable()
export class AiFinanceService {
  private readonly logger = new Logger(AiFinanceService.name)

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
    private readonly creditService: CreditService,
    private readonly collectionsService: CollectionsService,
    private readonly dashboardService: FinanceDashboardService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      await this.prompts.getPrompt(TaskType.FINANCE_ANALYSIS)
    } catch {
      await this.prompts.createPrompt({
        taskType: TaskType.FINANCE_ANALYSIS,
        name: 'AI Finance & Credit Intelligence',
        description: 'Default prompt for AI Finance Copilot — credit risk, payment delay prediction, cash flow forecast, collection strategy, financial health, credit limit, invoice intelligence, fraud signals, collection drafts',
        systemPrompt: `You are TRADINGO's AI Finance & Credit Intelligence Copilot for the B2B marketplace.

Your role is to help finance teams make smarter financial decisions by:
1. Assessing credit risk (Approve/Reject/Review) with confidence percentage, detailed reasons, and risk factors — consider TradTrust score, payment history, credit utilization, company age, verification level, outstanding amounts
2. Predicting payment delay probability (%) based on invoice amount, days overdue, average payment days, on-time payment rate, and historical behaviour
3. Generating cash flow forecasts for 7/30/90-day periods — analyse current inflow/outflow, balance, average revenue, expenses, receivables; provide expected balance, surplus/deficit, and action recommendations
4. Recommending collection strategies (Call, Email, Reminder, Legal Notice, Hold Orders, Payment Plan) with escalation timeline and priority score
5. Assessing customer financial health as Excellent/Good/Average/Risky/Critical with explanation of key factors (payment behaviour, credit utilization, overdue amounts, trust score, revenue stability)
6. Recommending credit limit actions (Increase/Decrease/Freeze/Review) with recommended amount, reasoning, and risk-adjusted factors
7. Analysing invoices for GST issues, duplicates, missing fields, and risk flags — provide confidence scores per detection
8. Detecting fraud signals across payments, refunds, chargebacks, credit usage, and collections — flag unusual patterns, velocity anomalies, and behavioural red flags
9. Generating professional collection drafts: formal Collection Email, Reminder Letter, WhatsApp Draft, SMS Draft — with personalisation tokens for customer name, amount, due date, invoice number
10. Providing all-in-one finance copilot sidebar: credit risk summary, financial health, cash flow status, payment prediction, collection advice, recent AI suggestions

Always respond with valid JSON. Be specific, data-driven, and actionable. Use Indian market context (INR, GST, 45-day payment cycles, UPI, NEFT/RTGS) when relevant. Never auto-act — provide analysis and recommendations only.`,
        userPrompt: `Action: {{action}}

Context:
{{context}}

Provide a structured JSON response appropriate for the action. Include scores, confidence levels, risk indicators, recommendations, and action items as applicable.`,
        variables: ['action', 'context'],
        temperature: 0.3,
        maxTokens: 4096,
      })
      this.logger.log('Seeded default FINANCE_ANALYSIS prompt for AI Finance & Credit Intelligence')
    }
  }

  async creditRiskAssessment(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.creditData) context.creditData = payload.creditData
    if (payload.tradTrustData) context.tradTrustData = payload.tradTrustData
    if (payload.requestedLimit) context.requestedLimit = payload.requestedLimit

    if (payload.companyData?.id) {
      try {
        const credit = await this.creditService.getCredit(payload.companyData.id).catch(() => null)
        if (credit) context.creditProfile = credit
      } catch { /* skip */ }
    }

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'credit_risk_assessment', context },
    }, companyId, userId)
  }

  async paymentDelayPrediction(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.invoiceAmount !== undefined) context.invoiceAmount = payload.invoiceAmount
    if (payload.daysOverdue !== undefined) context.daysOverdue = payload.daysOverdue
    if (payload.avgPaymentDays !== undefined) context.avgPaymentDays = payload.avgPaymentDays
    if (payload.onTimePaymentRate !== undefined) context.onTimePaymentRate = payload.onTimePaymentRate

    if (payload.companyData?.id) {
      const payments = await this.prisma.payment.findMany({
        where: { companyId: payload.companyData.id },
        select: { amount: true, status: true, createdAt: true, paidAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }).catch(() => [])
      if (payments.length) context.recentPayments = payments
    }

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'payment_delay_prediction', context },
    }, companyId, userId)
  }

  async cashFlowForecast(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.currentInflow !== undefined) context.currentInflow = payload.currentInflow
    if (payload.currentOutflow !== undefined) context.currentOutflow = payload.currentOutflow
    if (payload.currentBalance !== undefined) context.currentBalance = payload.currentBalance
    if (payload.avgMonthlyRevenue !== undefined) context.avgMonthlyRevenue = payload.avgMonthlyRevenue
    if (payload.avgMonthlyExpenses !== undefined) context.avgMonthlyExpenses = payload.avgMonthlyExpenses
    if (payload.outstandingReceivables !== undefined) context.outstandingReceivables = payload.outstandingReceivables
    if (payload.forecastPeriodDays !== undefined) context.forecastPeriodDays = payload.forecastPeriodDays

    try {
      const dash = await this.dashboardService.getDashboard({ months: 3 }).catch(() => null)
      if (dash) context.dashboardData = dash
      const cash = await this.dashboardService.getCashFlow({ months: 3 }).catch(() => null)
      if (cash) context.cashFlowData = cash
    } catch { /* skip */ }

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'cash_flow_forecast', context },
    }, companyId, userId)
  }

  async collectionStrategy(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.totalOverdue !== undefined) context.totalOverdue = payload.totalOverdue
    if (payload.daysOverdue !== undefined) context.daysOverdue = payload.daysOverdue
    if (payload.pastActions) context.pastActions = payload.pastActions
    if (payload.totalInvoices !== undefined) context.totalInvoices = payload.totalInvoices
    if (payload.avgInvoiceValue !== undefined) context.avgInvoiceValue = payload.avgInvoiceValue

    if (payload.companyData?.id) {
      try {
        const summary = await this.collectionsService.getOutstandingSummary().catch(() => null)
        if (summary) context.collectionSummary = summary
        const aging = await this.collectionsService.getAgingReport().catch(() => null)
        if (aging) context.agingReport = aging
        const notes = await this.collectionsService.listNotes(payload.companyData.id).catch(() => [])
        if (notes.length) context.collectionNotes = notes
      } catch { /* skip */ }
    }

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'collection_strategy', context },
    }, companyId, userId)
  }

  async financialHealth(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.creditData) context.creditData = payload.creditData
    if (payload.tradTrustData) context.tradTrustData = payload.tradTrustData
    if (payload.recentTransactions) context.recentTransactions = payload.recentTransactions

    if (payload.companyData?.id) {
      const payments = await this.prisma.payment.findMany({
        where: { companyId: payload.companyData.id },
        select: { amount: true, status: true, createdAt: true, paidAt: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }).catch(() => [])
      if (payments.length) context.paymentHistory = payments

      const overdue = await this.prisma.invoice.count({
        where: { companyId: payload.companyData.id, status: 'OVERDUE' },
      }).catch(() => 0)
      context.overdueInvoiceCount = overdue
    }

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'financial_health_assessment', context },
    }, companyId, userId)
  }

  async creditLimitRecommendation(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.creditData) context.creditData = payload.creditData
    if (payload.tradTrustData) context.tradTrustData = payload.tradTrustData
    if (payload.currentLimit !== undefined) context.currentLimit = payload.currentLimit
    if (payload.utilizationRate !== undefined) context.utilizationRate = payload.utilizationRate
    if (payload.trustScore !== undefined) context.trustScore = payload.trustScore

    if (payload.companyData?.id) {
      try {
        const credit = await this.creditService.getCredit(payload.companyData.id).catch(() => null)
        if (credit) context.creditProfile = credit
      } catch { /* skip */ }
    }

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'credit_limit_recommendation', context },
    }, companyId, userId)
  }

  async invoiceIntelligence(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.invoiceData) context.invoiceData = payload.invoiceData
    if (payload.gstNumber) context.gstNumber = payload.gstNumber
    if (payload.invoiceNumber) context.invoiceNumber = payload.invoiceNumber
    if (payload.amount !== undefined) context.amount = payload.amount
    if (payload.items) context.items = payload.items

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'invoice_intelligence', context },
    }, companyId, userId)
  }

  async fraudSignals(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.recentPayments) context.recentPayments = payload.recentPayments
    if (payload.recentRefunds) context.recentRefunds = payload.recentRefunds
    if (payload.recentChargebacks) context.recentChargebacks = payload.recentChargebacks
    if (payload.creditData) context.creditData = payload.creditData
    if (payload.collectionData) context.collectionData = payload.collectionData
    if (payload.companyData) context.companyData = payload.companyData

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'fraud_signals', context },
    }, companyId, userId)
  }

  async collectionDraft(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      customerName: payload.customerName,
      outstandingAmount: payload.outstandingAmount || 0,
      daysOverdue: payload.daysOverdue || 0,
      invoiceNumber: payload.invoiceNumber,
      companyName: payload.companyName,
      totalOutstanding: payload.totalOutstanding,
    }

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'collection_draft', context },
    }, companyId, userId)
  }

  async sidebar(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.companyData) context.companyData = payload.companyData
    if (payload.creditData) context.creditData = payload.creditData
    if (payload.tradTrustData) context.tradTrustData = payload.tradTrustData
    if (payload.recentPayments) context.recentPayments = payload.recentPayments
    if (payload.collectionData) context.collectionData = payload.collectionData

    if (payload.companyData?.id) {
      try {
        const credit = await this.creditService.getCredit(payload.companyData.id).catch(() => null)
        if (credit) context.creditProfile = credit
      } catch { /* skip */ }
    }

    try {
      const dash = await this.dashboardService.getDashboard({ months: 1 }).catch(() => null)
      if (dash) context.dashboardSnapshot = dash
    } catch { /* skip */ }

    return this.aiGateway.process({
      taskType: TaskType.FINANCE_ANALYSIS,
      payload: { action: 'finance_sidebar', context },
    }, companyId, userId)
  }
}
