import { Injectable, Logger } from '@nestjs/common'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { PromptManagerService } from '../ai-gateway/prompt-manager.service'
import { AiCreditsService } from '../ai-gateway/ai-credits.service'
import { ModelRegistryService } from '../ai-gateway/model-registry.service'
import { PrismaService } from '../../prisma/prisma.service'
import { TaskType } from '@prisma/client'
import {
  NaturalLanguageRfqDto, RefineRfqDto, DetectMissingDto, DetectDuplicatesDto,
  PredictCategoryDto, SuggestProductsDto, SuggestSuppliersDto, QualityScoreDto,
  TranslateRfqDto, AiAssistantDto,
  GeneratedRfq, MissingField, DuplicateRfq, QualityScoreResult,
} from './dto/ai-rfq.dto'

@Injectable()
export class AiRfqService {
  private readonly logger = new Logger(AiRfqService.name)

  constructor(
    private readonly gateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
    private readonly credits: AiCreditsService,
    private readonly modelRegistry: ModelRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  private async callAi(taskType: TaskType, payload: Record<string, unknown>, companyId = 'system', userId?: string, temperature = 0.3) {
    const result = await this.gateway.process(
      { taskType, payload, temperature, maxTokens: 2048 },
      companyId,
      userId,
    )
    let parsed: any
    try {
      parsed = JSON.parse(result.content)
    } catch {
      parsed = { raw: result.content }
    }
    return { ...result, data: parsed }
  }

  async generateFromText(dto: NaturalLanguageRfqDto, companyId: string, userId?: string) {
    return this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'generate_rfq_from_text',
      userText: dto.text,
      language: dto.language || 'en',
      instructions: `Parse the following buyer requirement into a structured RFQ. Extract: title, description, category, quantity, unit, deliveryLocation, deliveryTimeline, budgetMin, budgetMax, specifications[], suggestedTags[]. Output ONLY valid JSON. If a field is not mentioned, use null.`,
    }, companyId, userId)
  }

  async refineRfq(dto: RefineRfqDto, companyId: string, userId?: string) {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: dto.rfqId }, include: { productItems: true, locations: true } })
    if (!rfq) throw new Error('RFQ not found')

    return this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'refine_rfq',
      focusArea: dto.focusArea || 'general',
      additionalContext: dto.additionalContext || '',
      currentTitle: rfq.title,
      currentDescription: rfq.description,
      productItems: rfq.productItems,
      locations: rfq.locations,
      instructions: `Improve the RFQ's ${dto.focusArea || 'description and completeness'}. Output ONLY valid JSON with fields: improvedTitle, improvedDescription, additionalSpecs[], suggestions[].`,
    }, companyId, userId)
  }

  async detectMissing(dto: DetectMissingDto, companyId: string, userId?: string) {
    return this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'detect_missing_fields',
      rfqData: dto.rfqData,
      language: dto.language || 'en',
      instructions: `Analyze the RFQ data and identify missing or incomplete fields. Output ONLY valid JSON array where each item has: field (string), label (string), reason (string - why it matters), suggestion (string - what to enter).`,
    }, companyId, userId)
  }

  async detectDuplicates(dto: DetectDuplicatesDto, companyId: string, userId?: string) {
    const result = await this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'generate_search_criteria',
      title: dto.title,
      description: dto.description || '',
      productNames: dto.productNames || [],
      instructions: `Generate 3-5 search keywords from the RFQ to find similar existing RFQs. Output ONLY valid JSON array of strings.`,
    }, companyId, userId)

    const keywords: string[] = Array.isArray(result.data) ? result.data : []
    const searchTerms = [dto.title, ...keywords].filter(Boolean).join(' ')

    const existing = await this.prisma.rfq.findMany({
      where: {
        status: { in: ['ACTIVE', 'MATCHED', 'QUOTED', 'NEGOTIATING'] },
        OR: [
          { title: { contains: searchTerms, mode: 'insensitive' as any } },
          { description: { contains: searchTerms, mode: 'insensitive' as any } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, status: true, createdAt: true },
    })

    const duplicates: DuplicateRfq[] = existing.map(r => ({
      rfqId: r.id,
      title: r.title,
      similarityScore: this.calcSimilarity(dto.title, r.title),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })).sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5)

    return { success: true, data: duplicates, count: duplicates.length }
  }

  private calcSimilarity(a: string, b: string): number {
    const aWords = a.toLowerCase().split(/\s+/)
    const bWords = b.toLowerCase().split(/\s+/)
    const intersection = aWords.filter(w => bWords.includes(w)).length
    const union = new Set([...aWords, ...bWords]).size
    return Math.round((intersection / union) * 100)
  }

  async predictCategory(dto: PredictCategoryDto, companyId: string, userId?: string) {
    const result = await this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'predict_category',
      productName: dto.productName,
      description: dto.description || '',
      instructions: `Predict the most suitable product category for this RFQ item. Output ONLY valid JSON with fields: categoryName, categoryPath (e.g. "Food & Beverages > Cocoa > Cocoa Powder"), confidence (0-100), alternatives[] (array of {name, path, confidence}).`,
    }, companyId, userId)

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, parentId: true },
    })

    const predictedName = result.data?.categoryName || dto.productName
    const matched = categories.find(c => c.name.toLowerCase() === predictedName.toLowerCase())
    if (matched) result.data.categoryId = matched.id

    return result
  }

  async suggestProducts(dto: SuggestProductsDto, companyId: string, userId?: string) {
    const result = await this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'suggest_products',
      productNames: dto.productNames,
      instructions: `For each product name, suggest matching product specifications and category. Output ONLY valid JSON array with items: { productName, suggestedCategory, typicalSpecifications[], unitOptions[], priceRange: { min, max, currency } }.`,
    }, companyId, userId)

    const products = await this.prisma.product.findMany({
      where: {
        OR: dto.productNames.map(name => ({ name: { contains: name, mode: 'insensitive' as any } })),
        status: 'ACTIVE',
        deletedAt: null,
      },
      take: dto.limit || 10,
      select: { id: true, name: true, slug: true, categoryId: true, originalPrice: true },
    })

    return { success: true, data: { aiSuggestions: result.data, catalogProducts: products }, provider: result.provider, model: result.model }
  }

  async suggestSuppliers(dto: SuggestSuppliersDto, companyId: string, userId?: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: dto.rfqId },
      include: { productItems: true, locations: true },
    })
    if (!rfq) throw new Error('RFQ not found')

    const result = await this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'generate_supplier_criteria',
      title: rfq.title,
      description: rfq.description,
      productItems: rfq.productItems,
      locations: rfq.locations,
      instructions: `Generate supplier matching criteria from this RFQ. Output ONLY valid JSON with fields: targetCategories[], targetIndustries[], requiredVerificationLevel (0-6), minTrustScore (0-100), preferredLocations[], productKeywords[].`,
    }, companyId, userId)

    const criteria = result.data || {}
    const supplierQuery: any = { status: 'ACTIVE', deletedAt: null }
    if (criteria.targetIndustries?.length) supplierQuery.industries = { some: { industryId: { in: criteria.targetIndustries } } }

    const suppliers = await this.prisma.company.findMany({
      where: supplierQuery,
      take: dto.limit || 20,
      select: {
        id: true, name: true, slug: true, logo: true,
        trustScore: true, verificationLevel: true, totalProducts: true,
      },
      orderBy: { trustScore: 'desc' },
    })

    return {
      success: true,
      data: {
        matchingCriteria: criteria,
        suppliers: suppliers.map(s => ({
          ...s,
          matchReason: `Trust score ${s.trustScore || 'N/A'}, Level ${s.verificationLevel || 'LEVEL_0'} verified`,
          relevanceScore: s.trustScore ? Math.min(100, s.trustScore * 0.6 + (s.verificationLevel ? Number(s.verificationLevel.toString().replace('LEVEL_', '')) * 15 : 0) + Math.min(s.totalProducts || 0, 100) * 0.1) : 0,
        })).sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, dto.limit || 10),
      },
    }
  }

  async calculateQualityScore(dto: QualityScoreDto, companyId: string, userId?: string) {
    const data = dto.rfqData as any
    const breakdown = [
      { category: 'Title Quality', score: this.scoreField(data.title, 20, 10), maxScore: 20, weight: 0.2 },
      { category: 'Description', score: this.scoreField(data.description, 20, 50), maxScore: 20, weight: 0.2 },
      { category: 'Category', score: data.categoryId || data.category ? 15 : 0, maxScore: 15, weight: 0.15 },
      { category: 'Product Details', score: this.scoreProducts(data.productItems || []), maxScore: 15, weight: 0.15 },
      { category: 'Quantity & Unit', score: data.quantity && data.unit ? 10 : data.quantity || data.unit ? 5 : 0, maxScore: 10, weight: 0.1 },
      { category: 'Location', score: data.locations?.length ? this.scoreLocation(data.locations) : data.deliveryLocation ? 5 : 0, maxScore: 10, weight: 0.1 },
      { category: 'Budget', score: data.budgetMin || data.budgetMax ? 10 : 0, maxScore: 10, weight: 0.1 },
    ]

    const totalScore = Math.round(breakdown.reduce((sum, b) => sum + b.score, 0))
    const weightedScore = Math.round(breakdown.reduce((sum, b) => sum + b.score * b.weight, 0))

    const result = await this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'quality_analysis',
      rfqData: data,
      breakdown: breakdown.map(b => ({ category: b.category, score: b.score, maxScore: b.maxScore })),
      weightedScore,
      instructions: `Based on the RFQ data and score breakdown, provide quality improvement suggestions. Output ONLY valid JSON with fields: improvements[] (string), strengths[] (string), overallAssessment (string).`,
    }, companyId, userId)

    return {
      success: true,
      data: {
        score: weightedScore,
        maxScore: 100,
        breakdown,
        improvements: result.data?.improvements || [],
        strengths: result.data?.strengths || [],
      },
    }
  }

  private scoreField(value: unknown, maxScore: number, minLength = 1): number {
    if (!value) return 0
    const str = String(value).trim()
    if (str.length < minLength) return Math.round((str.length / minLength) * maxScore * 0.5)
    return maxScore
  }

  private scoreProducts(items: any[]): number {
    if (!items?.length) return 0
    const named = items.filter(i => i.productName).length
    return Math.min(15, Math.round((named / Math.max(items.length, 1)) * 15))
  }

  private scoreLocation(locations: any[]): number {
    if (!locations?.length) return 0
    const loc = locations[0]
    let score = 3
    if (loc.city) score += 3
    if (loc.state) score += 2
    if (loc.pincode) score += 2
    return Math.min(10, score)
  }

  async translateRfq(dto: TranslateRfqDto, companyId: string, userId?: string) {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: dto.rfqId }, include: { productItems: true } })
    if (!rfq) throw new Error('RFQ not found')

    return this.callAi(TaskType.RFQ_ANALYSIS, {
      action: 'translate_rfq',
      targetLanguage: dto.targetLanguage,
      title: rfq.title,
      description: rfq.description,
      productItems: rfq.productItems,
      instructions: `Translate the RFQ to ${dto.targetLanguage}. Output ONLY valid JSON with fields: translatedTitle, translatedDescription, translatedProductItems[] (each with productName, description). Keep all numbers and prices unchanged.`,
    }, companyId, userId)
  }

  async getAssistantData(dto: AiAssistantDto, companyId: string, userId?: string) {
    const missingDetected = await this.detectMissing({ rfqData: dto.rfqData, language: 'en' }, companyId, userId).catch(() => ({ data: [] }))
    const quality = await this.calculateQualityScore({ rfqData: dto.rfqData }, companyId, userId).catch(() => ({ data: { score: 0, improvements: [], strengths: [] } }))

    return {
      success: true,
      data: {
        missingFields: Array.isArray(missingDetected.data) ? missingDetected.data : [],
        qualityScore: quality.data,
        suggestion: dto.context || dto.rfqData ? 'Consider adding more product details and delivery specifications to attract better supplier responses.' : 'Start by describing what you need.',
        title: (dto.rfqData as any)?.title || '',
        totalFields: Object.keys(dto.rfqData as object).length,
      },
    }
  }
}
