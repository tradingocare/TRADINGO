import { Injectable, Logger } from '@nestjs/common'
import { AiGatewayService } from '../ai-gateway/ai-gateway.service'
import { PromptManagerService } from '../ai-gateway/prompt-manager.service'
import { CatalogTaxonomyPersistenceService } from '../marketplace-catalog-bridge/catalog-taxonomy-persistence.service'
import { ClassifyCatalogResponse } from '../marketplace-catalog-bridge/dto/classify-catalog.dto'
import { TaskType } from '@prisma/client'

// P0-3 Step 4: honest unclassified sidecar — mirrors the engine's own
// unclassified contract (never fabricated IDs).
const UNCLASSIFIED_TAXONOMY: ClassifyCatalogResponse = {
  categoryId: null,
  subcategoryId: null,
  catalogItemId: null,
  type: null,
  confidence: 0,
  band: 'LOW',
  matchType: 'unclassified',
  reasons: ['no product/service signal in query — taxonomy unresolved'],
  alternatives: [],
}

@Injectable()
export class AiSearchService {
  private readonly logger = new Logger(AiSearchService.name)

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly prompts: PromptManagerService,
    private readonly taxonomy: CatalogTaxonomyPersistenceService,
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

  /**
   * P0-3 Step 6: semantic search + the shared canonical taxonomy sidecar.
   * Gateway call unchanged (existing cache keys stay valid); sidecar
   * attached additively via the Step-4 shared helper — server-side
   * validated IDs, honest unclassified when the query carries no
   * product/service meaning. Retrieval itself is the user's Apply action
   * (Step 5 filter boundary); this endpoint never writes filters.
   */
  async semanticSearch(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = { query: payload.query }
    if (payload.location) context.location = payload.location
    if (payload.category) context.category = payload.category
    if (payload.industry) context.industry = payload.industry
    if (payload.userId) context.userId = payload.userId

    const result = await this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'semantic_search', context },
    }, companyId, userId, clientIp)

    const taxonomy = await this.buildIntentTaxonomy(payload?.query, result?.content, companyId, userId)
    return { ...result, taxonomy }
  }

  /**
   * P0-3 Step 4: intent detection + canonical taxonomy sidecar.
   *
   * The gateway call is byte-identical to the legacy one (action, context,
   * taskType) — so existing Redis cache entries under
   * md5(SEARCH_ANALYSIS + payload) remain valid and hit; the sidecar is
   * computed fresh per call and attached additively. The existing response
   * contract (content/provider/model/cached/latencyMs/cost/tokens) is
   * preserved untouched.
   *
   * Sidecar rules (no second engine, no invented thresholds):
   *  - classification runs through the Step-1 canonical adapter
   *    (classifyValidated) in DETERMINISTIC mode (aiTier:false) — the LLM
   *    already produced its intent/entity names in this same request; the
   *    sidecar resolves those signals against the live catalog without a
   *    second LLM call, charge, or latency cliff;
   *  - every ID is server-side validated (parent chain, type, existence) by
   *    the adapter — never fabricated, never client-resolved;
   *  - queries without product/service meaning classify to an honest
   *    LOW/unclassified sidecar (band LOW, confidence 0, all-IDs null);
   *  - product/service distinction flows through the engine's existing
   *    `type: 'Product' | 'Service' | null` — no new enum;
   *  - confidence/band semantics come from the engine's existing thresholds
   *    (HIGH ≥ auto-threshold / MEDIUM ≥ suggest-threshold / LOW below) —
   *    Step 5 will decide how filters consume them.
   */
  async searchIntentDetection(companyId: string, userId: string, payload: any, clientIp?: string) {
    // Phase 3ZC: forward the client idempotency key (accepted by
    // AiSearchIntentDto since 3ZB) so gateway claim/replay/quota semantics
    // apply end-to-end. Other ai-search DTOs reject unknown keys at the
    // validation boundary, so there is nothing to forward for them.
    const result = await this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'intent_detection', context: { query: payload.query } },
      idempotencyKey: payload.idempotencyKey,
    }, companyId, userId, clientIp)

    const taxonomy = await this.buildIntentTaxonomy(
      payload?.query,
      result?.content,
      companyId,
      userId,
    )

    return { ...result, taxonomy }
  }

  /**
   * Resolve the canonical taxonomy sidecar for an intent result. Prefers the
   * LLM's extracted entity name (strongest signal); falls back to the raw
   * query. Never throws into the intent response — any resolution failure
   * degrades to the honest unclassified sidecar.
   */
  private async buildIntentTaxonomy(
    query: string,
    content: unknown,
    companyId: string,
    userId: string,
  ): Promise<ClassifyCatalogResponse> {
    // Extract the LLM's entity/product signal without trusting it as IDs —
    // it is used only as a classification HINT (name string), and the
    // engine re-resolves and validates everything server-side.
    let hint: string | undefined
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content
      const candidate = parsed?.entities?.product
        ?? parsed?.entities?.category
        ?? parsed?.entities?.productName
      if (typeof candidate === 'string' && candidate.trim()) hint = candidate.trim()
    } catch {
      hint = undefined
    }

    const name = (hint || query || '').trim()
    if (!name) return UNCLASSIFIED_TAXONOMY

    try {
      return await this.taxonomy.classifyValidated(
        { name },
        companyId,
        userId,
        { aiTier: false },
      )
    } catch (err) {
      this.logger.warn(
        `Intent taxonomy sidecar failed for "${name}": ${err instanceof Error ? err.message : String(err)} — degrading to unclassified`,
      )
      return UNCLASSIFIED_TAXONOMY
    }
  }

  async similarProducts(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = { productId: payload.productId }
    if (payload.productName) context.productName = payload.productName
    if (payload.categoryId) context.categoryId = payload.categoryId
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.productType) context.productType = payload.productType
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'similar_products', context },
    }, companyId, userId, clientIp)
  }

  async similarSuppliers(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = { companyId: payload.companyId }
    if (payload.companyName) context.companyName = payload.companyName
    if (payload.businessType) context.businessType = payload.businessType
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'similar_suppliers', context },
    }, companyId, userId, clientIp)
  }

  async personalizedRanking(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = { results: payload.results }
    if (payload.userContext) context.userContext = payload.userContext
    if (payload.query) context.query = payload.query
    if (payload.sortBy) context.sortBy = payload.sortBy

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'personalized_ranking', context },
    }, companyId, userId, clientIp)
  }

  async buyerRecommendations(companyId: string, userId: string, payload: any, clientIp?: string) {
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
    }, companyId, userId, clientIp)
  }

  async sellerRecommendations(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = {}
    if (payload.companyId) context.companyId = payload.companyId
    if (payload.products) context.products = payload.products
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'seller_recommendations', context },
    }, companyId, userId, clientIp)
  }

  /**
   * P0-3 Step 6: search summary + shared canonical taxonomy sidecar
   * (same additive contract as intent/semantic — see searchIntentDetection).
   */
  async searchSummary(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = { query: payload.query }
    if (payload.totalResults) context.totalResults = payload.totalResults
    if (payload.topResults) context.topResults = payload.topResults
    if (payload.category) context.category = payload.category
    if (payload.location) context.location = payload.location

    const result = await this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'search_summary', context },
    }, companyId, userId, clientIp)

    const taxonomy = await this.buildIntentTaxonomy(payload?.query, result?.content, companyId, userId)
    return { ...result, taxonomy }
  }

  /**
   * P0-3 Step 6: smart filters + shared canonical taxonomy sidecar. The LLM
   * keeps suggesting generic filter categories (presentation-only); the
   * canonical sidecar provides the validated IDs that Apply-to-Search can
   * actually act on (Step 5 filter boundary).
   */
  async smartFilters(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = { query: payload.query }
    if (payload.categoryId) context.categoryId = payload.categoryId
    if (payload.availableFilters) context.availableFilters = payload.availableFilters

    const result = await this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'smart_filters', context },
    }, companyId, userId, clientIp)

    const taxonomy = await this.buildIntentTaxonomy(payload?.query, result?.content, companyId, userId)
    return { ...result, taxonomy }
  }

  async crossSellUpsell(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = { productId: payload.productId }
    if (payload.productName) context.productName = payload.productName
    if (payload.categoryId) context.categoryId = payload.categoryId
    if (payload.productType) context.productType = payload.productType
    if (payload.limit) context.limit = payload.limit

    return this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'cross_sell_upsell', context },
    }, companyId, userId, clientIp)
  }

  /**
   * P0-3 Step 6: all-in-one sidebar + shared canonical taxonomy sidecar.
   * The sidebar aggregates query understanding — its natural taxonomy hint
   * is the query itself (deterministic resolution, same as the other
   * query-carrying copilots).
   */
  async aiSearchSidebar(companyId: string, userId: string, payload: any, clientIp?: string) {
    const context: Record<string, unknown> = {}
    if (payload.query) context.query = payload.query
    if (payload.userId) context.userId = payload.userId
    if (payload.searchResults) context.searchResults = payload.searchResults
    if (payload.recentSearches) context.recentSearches = payload.recentSearches
    if (payload.industryId) context.industryId = payload.industryId
    if (payload.categoryId) context.categoryId = payload.categoryId

    const result = await this.aiGateway.process({
      taskType: TaskType.SEARCH_ANALYSIS,
      payload: { action: 'ai_search_sidebar', context },
    }, companyId, userId, clientIp)

    const taxonomy = payload.query
      ? await this.buildIntentTaxonomy(payload.query, result?.content, companyId, userId)
      : null
    return { ...result, taxonomy }
  }
}
