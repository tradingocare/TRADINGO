import { Injectable, Logger } from '@nestjs/common'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { PromptManagerService } from '../ai-gateway/prompt-manager.service'
import { TaskType } from '@prisma/client'

@Injectable()
export class AiSearchService {
  private readonly logger = new Logger(AiSearchService.name)

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
  ) {}

  async onModuleInit() {
    try {
      await this.prompts.getPrompt(TaskType.SEARCH_ANALYSIS)
    } catch {
      await this.prompts.createPrompt({
        taskType: TaskType.SEARCH_ANALYSIS,
        name: 'AI Search & Recommendation Engine',
        description: 'Default prompt for AI Search & Recommendation Copilot — semantic search, intent detection, similar products, similar suppliers, personalized ranking, buyer recommendations, seller recommendations, search summary, smart filters, cross-sell/upsell, all-in-one sidebar',
        systemPrompt: `You are TRADINGO's AI Search & Recommendation Copilot for the B2B marketplace.

Your role is to help buyers and sellers discover relevant products, suppliers, and opportunities by:
1. Performing semantic search — understand natural language queries and return structured product/supplier criteria (productType, categoryId, industryId, keywords, priceRange, location, certifications, moq)
2. Detecting search intent — classify intent as product_search, supplier_search, industry_research, price_enquiry, location_based, requirement, or general; extract entities (product, category, industry, location, quantity) and confidence score
3. Finding similar products — analyse product name, category, industry, type, specs, price range and return matched product criteria with similarity score, key differentiators, and complementary suggestions
4. Finding similar suppliers — analyse company name, business type, industry, verification level, trust score, product categories and return recommended supplier criteria with match reasons and compatibility notes
5. Personalizing search ranking — re-rank search results based on user context (industry, recent clicks, orders, RFQs, saved products); return re-ranked results with relevance_boost and reason for each adjustment
6. Recommending products for buyers — based on past orders, RFQs, saved products, recent searches, and industry; return recommended criteria and explanation for each recommendation
7. Recommending opportunities for sellers — based on products, industry, past sales, and capacity; recommend buying opportunities, trending categories, and buyer segments
8. Generating search summaries — summarize query results including total results, categories found, price range, top suppliers, key trends, and actionable insights
9. Generating smart filters — suggest relevant filter categories, price ranges, locations, ratings thresholds, certifications, and business types based on search query
10. Cross-selling and upselling — recommend related, complementary, and premium alternatives based on product details; include cross-sell (related/complementary) and upsell (premium/upgrade) suggestions with reasoning
11. Providing all-in-one AI search & discovery sidebar: query understanding, recommended filters, similar products/suppliers, search summary, personalized ranking suggestions

Always respond with valid JSON. Be specific, data-driven, and actionable. Use B2B marketplace context (bulk pricing, MOQ, certifications, trade terms, Incoterms, FOB/CIF). Never include products or suppliers not found in context — provide criteria for searching, not hallucinated entities. Focus on Indian/Asian market context when relevant.`,
        userPrompt: `Action: {{action}}

Context:
{{context}}

Provide a structured JSON response appropriate for the action. Include scores, confidence levels, relevance indicators, recommendations, and action items as applicable. Return ONLY valid JSON.`,
        variables: ['action', 'context'],
        temperature: 0.3,
        maxTokens: 4096,
      })
      this.logger.log('Seeded default SEARCH_ANALYSIS prompt for AI Search & Recommendation')
    }
  }

  async semanticSearch(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = { query: payload.query }
    if (payload.location) context.location = payload.location
    if (payload.category) context.category = payload.category
    if (payload.industry) context.industry = payload.industry
    if (payload.userId) context.userId = payload.userId

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'semantic_search', context },
    }, companyId, userId)
  }

  async searchIntentDetection(companyId: string, userId: string, payload: any) {
    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'intent_detection', context: { query: payload.query } },
    }, companyId, userId)
  }

  async similarProducts(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = { productId: payload.productId }
    if (payload.productName) context.productName = payload.productName
    if (payload.categoryId) context.categoryId = payload.categoryId
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.productType) context.productType = payload.productType
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'similar_products', context },
    }, companyId, userId)
  }

  async similarSuppliers(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = { companyId: payload.companyId }
    if (payload.companyName) context.companyName = payload.companyName
    if (payload.businessType) context.businessType = payload.businessType
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'similar_suppliers', context },
    }, companyId, userId)
  }

  async personalizedRanking(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = { results: payload.results }
    if (payload.userContext) context.userContext = payload.userContext
    if (payload.query) context.query = payload.query
    if (payload.sortBy) context.sortBy = payload.sortBy

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'personalized_ranking', context },
    }, companyId, userId)
  }

  async buyerRecommendations(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.companyId) context.companyId = payload.companyId
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.pastOrders) context.pastOrders = payload.pastOrders
    if (payload.pastRfqs) context.pastRfqs = payload.pastRfqs
    if (payload.savedProducts) context.savedProducts = payload.savedProducts
    if (payload.recentSearches) context.recentSearches = payload.recentSearches
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'buyer_recommendations', context },
    }, companyId, userId)
  }

  async sellerRecommendations(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.companyId) context.companyId = payload.companyId
    if (payload.products) context.products = payload.products
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'seller_recommendations', context },
    }, companyId, userId)
  }

  async searchSummary(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = { query: payload.query }
    if (payload.totalResults) context.totalResults = payload.totalResults
    if (payload.topResults) context.topResults = payload.topResults
    if (payload.category) context.category = payload.category
    if (payload.location) context.location = payload.location

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'search_summary', context },
    }, companyId, userId)
  }

  async smartFilters(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = { query: payload.query }
    if (payload.categoryId) context.categoryId = payload.categoryId
    if (payload.availableFilters) context.availableFilters = payload.availableFilters

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'smart_filters', context },
    }, companyId, userId)
  }

  async crossSellUpsell(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = { productId: payload.productId }
    if (payload.productName) context.productName = payload.productName
    if (payload.categoryId) context.categoryId = payload.categoryId
    if (payload.productType) context.productType = payload.productType
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'cross_sell_upsell', context },
    }, companyId, userId)
  }

  async aiSearchSidebar(companyId: string, userId: string, payload: any) {
    const context: Record<string, unknown> = {}
    if (payload.query) context.query = payload.query
    if (payload.userId) context.userId = payload.userId
    if (payload.searchResults) context.searchResults = payload.searchResults
    if (payload.recentSearches) context.recentSearches = payload.recentSearches
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.categoryId) context.categoryId = payload.categoryId

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'ai_search_sidebar', context },
    }, companyId, userId)
  }
}
