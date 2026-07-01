import { Injectable, Logger } from '@nestjs/common'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { PromptManagerService } from '../ai-gateway/prompt-manager.service'
import { QuoteService } from './quote.service'
import { TradTrustService } from '../tradtrust/tradtrust.service'
import { PrismaService } from '../../prisma/prisma.service'
import { TaskType } from '@prisma/client'

@Injectable()
export class AiQuoteService {
  private readonly logger = new Logger(AiQuoteService.name)

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
    private readonly quoteService: QuoteService,
    private readonly tradTrust: TradTrustService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      await this.prompts.getPrompt(TaskType.QUOTE_ANALYSIS)
    } catch {
      await this.prompts.createPrompt({
        taskType: TaskType.QUOTE_ANALYSIS,
        name: 'Quote Analysis & Pricing Advisor',
        description: 'Default prompt for AI Quote Advisor features — generates quotes, recommends prices, analyzes margins, predicts win probability, assesses competitiveness, reviews quality, prepares negotiation strategies, and evaluates risk.',
        systemPrompt: `You are TRADINGO's AI Quote & Pricing Advisor for the B2B marketplace.

Your role is to help sellers create winning quotes by:
1. Generating professional quote content from natural language
2. Recommending optimal pricing strategies based on market data
3. Predicting win probability using price, delivery, trust, and competition
4. Analyzing profit margins with actionable recommendations
5. Scoring competitiveness against market benchmarks
6. Reviewing quotes for completeness, errors, and improvements
7. Preparing negotiation strategies using buyer history
8. Assessing buyer credit and trust risk
9. Scoring quote quality and completeness

Always respond with valid JSON. Be specific, data-driven, and actionable. Use Indian market context (INR, GST, Incoterms) when relevant.`,
        userPrompt: `Action: {{action}}

Context:
{{context}}

Provide a structured JSON response with analysis, recommendations, scores, and actionable insights as appropriate for the action.`,
        variables: ['action', 'context'],
        temperature: 0.3,
        maxTokens: 4096,
      })
      this.logger.log('Seeded default QUOTE_ANALYSIS prompt for AI Quote Advisor')
    }
  }

  async generate(companyId: string, userId: string, payload: any) {
    let context: Record<string, unknown> = {}

    if (payload.rfqId) {
      const rfq = await this.prisma.rfq.findFirst({
        where: { id: payload.rfqId, deletedAt: null },
        include: { productItems: true },
      })
      if (rfq) {
        context.rfq = {
          title: rfq.title,
          description: rfq.description,
          productItems: rfq.productItems,
          categoryId: rfq.categoryId,
          preferredLocation: rfq.preferredLocation,
          budgetMin: rfq.budgetMin,
          budgetMax: rfq.budgetMax,
        }
      }
    }

    if (payload.rfqData) context.rfqData = payload.rfqData
    if (payload.naturalLanguage) context.naturalLanguage = payload.naturalLanguage

    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { name: true, trustScore: true, verificationLevel: true, businessType: true },
    })
    if (company) context.sellerProfile = company

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'generate_quote', context },
    }, companyId, userId)
  }

  async priceRecommendation(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      productName: payload.productName,
      basePrice: payload.basePrice,
      currency: payload.currency ?? 'INR',
      quantity: payload.quantity,
      unit: payload.unit,
      deliveryTerms: payload.deliveryTerms,
    }

    if (payload.marketContext) context.marketContext = payload.marketContext

    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      select: { name: true, trustScore: true, verificationLevel: true },
    })
    if (company) context.sellerProfile = company

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'price_recommendation', context },
    }, companyId, userId)
  }

  async winningProbability(companyId: string, userId: string, payload: any) {
    let quote = null
    let company = null
    let rfq = null
    let trustScoreData = null

    if (payload.quoteId) {
      quote = await this.prisma.quote.findFirst({
        where: { id: payload.quoteId },
        include: { rfq: { select: { title: true, status: true, categoryId: true, budgetMin: true, budgetMax: true } } },
      })
      if (quote) {
        rfq = quote.rfq as any
        company = await this.prisma.company.findFirst({
          where: { id: quote.companyId },
          select: { name: true, trustScore: true, verificationLevel: true, responseRate: true },
        })
        trustScoreData = await this.tradTrust.getUnifiedScore(quote.companyId).catch(() => null)
      }
    }

    const input = {
      quoteAmount: payload.totalAmount ?? (quote ? Number((quote as any).totalAmount) : undefined),
      leadTimeDays: payload.leadTimeDays ?? (quote ? (quote as any).leadTimeDays : undefined),
      trustScore: trustScoreData?.unifiedScore ?? payload.trustScore ?? company?.trustScore,
      responseRate: payload.responseRate ?? company?.responseRate,
      deliveryTerms: payload.deliveryTerms ?? (quote ? (quote as any).deliveryTerms : undefined),
      rfqTitle: rfq?.title,
      rfqBudgetMin: rfq?.budgetMin,
      rfqBudgetMax: rfq?.budgetMax,
      competitorQuotes: payload.competitorQuotes ?? [],
    }

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'winning_probability', context: input },
    }, companyId, userId)
  }

  async marginAnalysis(companyId: string, userId: string, payload: any) {
    const context = {
      subtotal: payload.subtotal,
      totalAmount: payload.totalAmount,
      taxAmount: payload.taxAmount ?? 0,
      discountAmount: payload.discountAmount ?? 0,
      discountPercent: payload.discountPercent ?? 0,
      currency: payload.currency ?? 'INR',
      estimatedCostOfGoods: payload.estimatedCostOfGoods,
      shippingCost: payload.shippingCost,
      platformFee: payload.platformFee,
      lineItems: payload.lineItems,
    }

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'margin_analysis', context },
    }, companyId, userId)
  }

  async competitivenessScore(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      totalAmount: payload.totalAmount,
      leadTimeDays: payload.leadTimeDays,
      trustScore: payload.trustScore,
      deliveryTerms: payload.deliveryTerms,
      paymentTerms: payload.paymentTerms,
      categoryName: payload.categoryName,
      marketQuotes: payload.marketQuotes ?? [],
    }

    const trustData = await this.tradTrust.getUnifiedScore(companyId).catch(() => null)
    if (trustData) context.tradTrustGrade = trustData.grade

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'competitiveness_score', context },
    }, companyId, userId)
  }

  async review(companyId: string, userId: string, payload: any) {
    let quote = null
    if (payload.quoteId) {
      quote = await this.quoteService.findMyQuoteById(payload.quoteId, userId).catch(() => null)
    }

    const context = {
      quoteData: payload.quoteData ?? quote,
      language: payload.language ?? 'en',
      strictness: payload.strictness ?? true,
    }

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'quote_review', context },
    }, companyId, userId)
  }

  async negotiationPrep(companyId: string, userId: string, payload: any) {
    let buyerProfile = null
    let pastNegotiations: any[] = []

    if (payload.quoteId) {
      const quote = await this.prisma.quote.findFirst({
        where: { id: payload.quoteId },
        include: { rfq: { select: { companyId: true, title: true } } },
      })
      if (quote?.rfq) {
        const rfq = quote.rfq as any
        buyerProfile = await this.prisma.company.findFirst({
          where: { id: rfq.companyId },
          select: { name: true, trustScore: true, verificationLevel: true },
        })
        const rfqs = await this.prisma.rfq.findMany({
          where: { companyId: rfq.companyId, status: 'QUOTED', deletedAt: null },
          select: { id: true, title: true },
        })
        if (rfqs.length) {
          const negotiations = await this.prisma.negotiation.findMany({
            where: { rfqId: { in: rfqs.map(r => r.id) }, sellerCompanyId: companyId },
            select: { id: true, status: true },
            take: 5,
          })
          pastNegotiations = negotiations
        }
      }
    }

    const context = {
      quoteData: payload.quoteData,
      buyerProfile: payload.buyerProfile ?? buyerProfile,
      pastNegotiations: payload.pastNegotiations ?? pastNegotiations,
    }

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'negotiation_prep', context },
    }, companyId, userId)
  }

  async riskAssessment(companyId: string, userId: string, payload: any) {
    let creditStatus = null
    let buyerCompany = null

    if (payload.buyerCompanyId) {
      buyerCompany = await this.prisma.company.findFirst({
        where: { id: payload.buyerCompanyId },
        select: { name: true, trustScore: true, verificationLevel: true, status: true },
      })
    }

    if (payload.quoteAmount && buyerCompany) {
      creditStatus = { hasEnrichedData: true }
    }

    const context = {
      buyerProfile: payload.buyerProfile ?? buyerCompany,
      creditStatus: payload.creditStatus ?? creditStatus,
      trustScore: payload.trustScore ?? buyerCompany?.trustScore,
      verificationLevel: payload.verificationLevel ?? buyerCompany?.verificationLevel,
      quoteAmount: payload.quoteAmount,
    }

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'risk_assessment', context },
    }, companyId, userId)
  }

  async qualityScore(companyId: string, userId: string, payload: any) {
    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'quality_score', context: { quoteData: payload.quoteData, language: payload.language ?? 'en' } },
    }, companyId, userId)
  }

  async sidebar(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {
      formData: payload.formData ?? {},
      lineItems: payload.lineItems ?? [],
      rfqData: payload.rfqData ?? {},
    }

    if (payload.companyProfile) context.companyProfile = payload.companyProfile
    if (payload.buyerProfile) context.buyerProfile = payload.buyerProfile

    const trustData = await this.tradTrust.getUnifiedScore(companyId).catch(() => null)
    if (trustData) context.tradTrust = { score: trustData.unifiedScore, grade: trustData.grade, riskLevel: trustData.riskLevel }

    return this.aiGateway.process({
      taskType: TaskType.QUOTE_ANALYSIS,
      payload: { action: 'quote_sidebar', context },
    }, companyId, userId)
  }
}
