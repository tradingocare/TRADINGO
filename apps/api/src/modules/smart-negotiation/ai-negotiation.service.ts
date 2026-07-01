import { Injectable, Logger } from '@nestjs/common'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { PromptManagerService } from '../ai-gateway/prompt-manager.service'
import { SmartNegotiationService } from './smart-negotiation.service'
import { QuoteService } from '../quote/quote.service'
import { TradTrustService } from '../tradtrust/tradtrust.service'
import { PrismaService } from '../../prisma/prisma.service'
import { TaskType } from '@prisma/client'

@Injectable()
export class AiNegotiationService {
  private readonly logger = new Logger(AiNegotiationService.name)

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
    private readonly negotiationService: SmartNegotiationService,
    private readonly quoteService: QuoteService,
    private readonly tradTrust: TradTrustService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      await this.prompts.getPrompt(TaskType.NEGOTIATION)
    } catch {
      await this.prompts.createPrompt({
        taskType: TaskType.NEGOTIATION,
        name: 'AI Negotiation Copilot',
        description: 'Default prompt for AI Negotiation Copilot — strategy, behaviour analysis, sentiment, risk, probability, replies, summary, translation, memory, timeline',
        systemPrompt: `You are TRADINGO's AI Negotiation Copilot for the B2B marketplace.

Your role is to help buyers and sellers negotiate more effectively by:
1. Generating negotiation strategies (counter offers, walk-away prices, discount recommendations, negotiation sequences, closing strategies)
2. Analysing buyer behaviour (price sensitivity, response speed, negotiation style, purchase intent, historical acceptance)
3. Suggesting seller improvements (price, delivery, warranty, payment terms)
4. Analysing conversation sentiment (positive, neutral, negative with confidence %)
5. Predicting deal probability (closing %, reason, confidence, improvement tips)
6. Generating suggested replies (professional, short, commercial, escalation)
7. Detecting risks (payment risk, fraud signals, unrealistic demands, aggressive negotiation, commercial risk)
8. Generating conversation summaries (key points, agreements, pending issues, action items)
9. Supporting multi-language translation
10. Maintaining AI memory across RFQ, Quote, Negotiation, Orders, CRM contexts
11. Analysing negotiation timeline (offer history, counter offers, outcomes)

Always respond with valid JSON. Be specific, data-driven, and actionable. Use Indian market context (INR, GST, Incoterms) when relevant. Never auto-send — provide suggestions only.`,
        userPrompt: `Action: {{action}}

Context:
{{context}}

Provide a structured JSON response appropriate for the action. Include scores, confidence levels, suggestions, and recommendations as applicable.`,
        variables: ['action', 'context'],
        temperature: 0.3,
        maxTokens: 4096,
      })
      this.logger.log('Seeded default NEGOTIATION prompt for AI Negotiation Copilot')
    }
  }

  async generateStrategy(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.negotiationData) context.negotiationData = payload.negotiationData
    if (payload.quoteData) context.quoteData = payload.quoteData
    if (payload.role) context.role = payload.role

    const trustData = await this.tradTrust.getUnifiedScore(companyId).catch(() => null)
    if (trustData) context.sellerTrust = trustData

    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'generate_strategy', context },
    }, companyId, userId)
  }

  async buyerBehaviorAnalysis(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}

    if (payload.buyerCompanyId) {
      const buyerCo = await this.prisma.company.findFirst({
        where: { id: payload.buyerCompanyId },
        select: { name: true, trustScore: true, verificationLevel: true, responseRate: true },
      })
      if (buyerCo) context.buyerProfile = buyerCo

      const buyerTrust = await this.tradTrust.getUnifiedScore(payload.buyerCompanyId).catch(() => null)
      if (buyerTrust) context.buyerTrust = buyerTrust

      const rfqs = await this.prisma.rfq.findMany({
        where: { companyId: payload.buyerCompanyId, deletedAt: null },
        select: { id: true, title: true, status: true, quoteCount: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
      if (rfqs.length) context.buyerRfqHistory = rfqs
    }

    if (payload.pastNegotiations) context.pastNegotiations = payload.pastNegotiations
    if (payload.chatMessages) context.chatMessages = payload.chatMessages
    if (payload.buyerProfile) context.buyerProfile = payload.buyerProfile

    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'buyer_behavior', context },
    }, companyId, userId)
  }

  async sellerSuggestions(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.negotiationData) context.negotiationData = payload.negotiationData
    if (payload.currentOffer) context.currentOffer = payload.currentOffer
    if (payload.companyProfile) context.companyProfile = payload.companyProfile

    const trustData = await this.tradTrust.getUnifiedScore(companyId).catch(() => null)
    if (trustData) context.sellerTrust = trustData

    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'seller_suggestions', context },
    }, companyId, userId)
  }

  async sentimentAnalysis(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      chatMessages: payload.chatMessages ?? [],
      negotiationEvents: payload.negotiationEvents ?? [],
    }
    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'sentiment_analysis', context },
    }, companyId, userId)
  }

  async dealProbability(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.negotiationData) context.negotiationData = payload.negotiationData
    context.sellerTrustScore = payload.sellerTrustScore
    context.buyerTrustScore = payload.buyerTrustScore
    context.totalRounds = payload.totalRounds
    context.negotiationStatus = payload.negotiationStatus

    const sellerTrust = await this.tradTrust.getUnifiedScore(companyId).catch(() => null)
    if (sellerTrust) context.sellerTrustGrade = sellerTrust.grade

    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'deal_probability', context },
    }, companyId, userId)
  }

  async suggestedReplies(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      role: payload.role ?? 'SELLER',
      tone: payload.tone ?? 'PROFESSIONAL',
      context: payload.context ?? {},
      recentMessages: payload.recentMessages ?? [],
    }
    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'suggested_replies', context },
    }, companyId, userId)
  }

  async riskDetection(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.negotiationData) context.negotiationData = payload.negotiationData
    if (payload.buyerCreditStatus) context.buyerCreditStatus = payload.buyerCreditStatus
    context.buyerTrustScore = payload.buyerTrustScore
    context.buyerVerificationLevel = payload.buyerVerificationLevel
    context.quoteAmount = payload.quoteAmount

    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'risk_detection', context },
    }, companyId, userId)
  }

  async conversationSummary(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      chatMessages: payload.chatMessages ?? [],
      negotiationEvents: payload.negotiationEvents ?? [],
      versions: payload.versions ?? [],
    }
    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'conversation_summary', context },
    }, companyId, userId)
  }

  async translate(companyId: string, userId: string, payload: any) {
    const context = {
      text: payload.text,
      targetLanguage: payload.targetLanguage,
      sourceLanguage: payload.sourceLanguage ?? 'auto',
    }
    return this.aiGateway.process({
      taskType: TaskType.TRANSLATION,
      payload: { action: 'translate_negotiation', context },
    }, companyId, userId)
  }

  async aiMemory(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}

    if (payload.rfqId) {
      const rfq = await this.prisma.rfq.findFirst({
        where: { id: payload.rfqId, deletedAt: null },
        select: { id: true, title: true, status: true, budgetMin: true, budgetMax: true, currency: true, createdAt: true },
      })
      if (rfq) context.rfq = rfq
    }

    if (payload.quoteId) {
      const quote = await this.prisma.quote.findFirst({
        where: { id: payload.quoteId },
        select: { id: true, totalAmount: true, currency: true, status: true, leadTimeDays: true, deliveryTerms: true, paymentTerms: true, quoteVersion: true, createdAt: true },
      })
      if (quote) context.quote = quote
    }

    if (payload.negotiationId) {
      const neg = await this.prisma.negotiation.findFirst({
        where: { id: payload.negotiationId },
        select: { id: true, status: true, createdAt: true, updatedAt: true },
      })
      if (neg) context.negotiation = neg

      const versionCount = await this.prisma.negotiationVersion.count({ where: { negotiationId: payload.negotiationId } })
      context.versionCount = versionCount
    }

    if (payload.buyerCompanyId) {
      const buyerCo = await this.prisma.company.findFirst({
        where: { id: payload.buyerCompanyId },
        select: { name: true, trustScore: true, verificationLevel: true },
      })
      if (buyerCo) context.buyerCompany = buyerCo
      const buyerTrust = await this.tradTrust.getUnifiedScore(payload.buyerCompanyId).catch(() => null)
      if (buyerTrust) context.buyerTrustGrade = buyerTrust.grade
    }

    if (payload.sellerCompanyId) {
      const sellerCo = await this.prisma.company.findFirst({
        where: { id: payload.sellerCompanyId },
        select: { name: true, trustScore: true, verificationLevel: true },
      })
      if (sellerCo) context.sellerCompany = sellerCo
      const sellerTrust = await this.tradTrust.getUnifiedScore(payload.sellerCompanyId).catch(() => null)
      if (sellerTrust) context.sellerTrustGrade = sellerTrust.grade
    }

    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'ai_memory', context },
    }, companyId, userId)
  }

  async timeline(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      versions: payload.versions ?? [],
      events: payload.events ?? [],
    }
    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'timeline_analysis', context },
    }, companyId, userId)
  }

  async sidebar(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}

    if (payload.negotiationData) context.negotiationData = payload.negotiationData
    if (payload.quoteData) context.quoteData = payload.quoteData
    if (payload.buyerProfile) context.buyerProfile = payload.buyerProfile
    if (payload.sellerProfile) context.sellerProfile = payload.sellerProfile
    if (payload.recentMessages) context.recentMessages = payload.recentMessages

    const trustData = await this.tradTrust.getUnifiedScore(companyId).catch(() => null)
    if (trustData) context.myTrust = trustData

    return this.aiGateway.process({
      taskType: TaskType.NEGOTIATION,
      payload: { action: 'negotiation_sidebar', context },
    }, companyId, userId)
  }
}
