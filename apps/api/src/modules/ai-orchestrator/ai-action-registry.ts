export interface AiAction {
  id: string
  name: string
  description: string
  service: string
  method: string
  taskType: string
  credits: number
  requiredRole: string[]
  module: string
  tags: string[]
}

const REGISTRY: AiAction[] = [
  // ── Product Intelligence (13 actions) ──
  { id: 'product.generate-description', name: 'Generate Description', description: 'Generate product description from name/category/brand', service: 'AiProductIntelligenceService', method: 'generateDescription', taskType: 'PRODUCT_DESCRIPTION', credits: 10, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'content'] },
  { id: 'product.generate-seo', name: 'Generate SEO', description: 'Generate SEO metadata for product', service: 'AiProductIntelligenceService', method: 'generateSeo', taskType: 'SEO_GENERATION', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'seo'] },
  { id: 'product.translate', name: 'Translate Product', description: 'Translate product to target locale', service: 'AiProductIntelligenceService', method: 'translateProduct', taskType: 'TRANSLATION', credits: 8, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'translation'] },
  { id: 'product.suggest-specs', name: 'Suggest Specs', description: 'Suggest product specifications', service: 'AiProductIntelligenceService', method: 'suggestSpecs', taskType: 'SPEC_SUGGESTION', credits: 3, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'specs'] },
  { id: 'product.suggest-images', name: 'Suggest Images', description: 'Suggest product image types', service: 'AiProductIntelligenceService', method: 'suggestImages', taskType: 'IMAGE_SUGGESTION', credits: 3, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'images'] },
  { id: 'product.generate-title', name: 'Generate Title', description: 'Generate optimized product title', service: 'AiProductIntelligenceService', method: 'generateTitle', taskType: 'PRODUCT_DESCRIPTION', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'content'] },
  { id: 'product.suggest-attributes', name: 'Suggest Attributes', description: 'Suggest product attributes', service: 'AiProductIntelligenceService', method: 'suggestAttributes', taskType: 'CATEGORY_SUGGESTION', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'attributes'] },
  { id: 'product.suggest-category', name: 'Suggest Category', description: 'Suggest category for product', service: 'AiProductIntelligenceService', method: 'suggestCategory', taskType: 'CATEGORY_SUGGESTION', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'category'] },
  { id: 'product.generate-highlights', name: 'Generate Highlights', description: 'Generate key selling points and highlights', service: 'AiProductIntelligenceService', method: 'generateHighlights', taskType: 'PRODUCT_DESCRIPTION', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'content'] },
  { id: 'product.generate-tags', name: 'Generate Tags', description: 'Generate product tags', service: 'AiProductIntelligenceService', method: 'generateTags', taskType: 'SEO_GENERATION', credits: 3, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'tags'] },
  { id: 'product.suggest-hsn-gst', name: 'Suggest HSN/GST', description: 'Suggest HSN code and GST rate', service: 'AiProductIntelligenceService', method: 'suggestHsnGst', taskType: 'CATEGORY_SUGGESTION', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'compliance'] },
  { id: 'product.suggest-related', name: 'Suggest Related Products', description: 'Suggest related products', service: 'AiProductIntelligenceService', method: 'suggestRelatedProducts', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'recommendations'] },
  { id: 'product.generate-meta-keywords', name: 'Generate Meta Keywords', description: 'Generate SEO meta keywords', service: 'AiProductIntelligenceService', method: 'generateMetaKeywords', taskType: 'SEO_GENERATION', credits: 3, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['product', 'seo'] },

  // ── Commerce Intelligence (6 data-driven actions) ──
  { id: 'commerce.sales-potential', name: 'Sales Potential', description: 'Analyze product sales potential', service: 'CommerceIntelligenceService', method: 'getSalesPotential', taskType: '', credits: 0, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['commerce', 'analytics'] },
  { id: 'commerce.suggested-price', name: 'Suggested Price', description: 'Get suggested product price', service: 'CommerceIntelligenceService', method: 'getSuggestedPrice', taskType: '', credits: 0, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['commerce', 'pricing'] },
  { id: 'commerce.demand-trend', name: 'Demand Trend', description: 'Get product demand trend', service: 'CommerceIntelligenceService', method: 'getDemandTrend', taskType: '', credits: 0, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['commerce', 'analytics'] },
  { id: 'commerce.competition', name: 'Competition Analysis', description: 'Analyze product competition', service: 'CommerceIntelligenceService', method: 'getCompetitionAnalysis', taskType: '', credits: 0, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['commerce', 'analytics'] },
  { id: 'commerce.advertising-suggestion', name: 'Ad Suggestion', description: 'Get advertising budget suggestion', service: 'CommerceIntelligenceService', method: 'getSuggestedAdvertising', taskType: '', credits: 0, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['commerce', 'advertising'] },
  { id: 'commerce.full-insights', name: 'Full Commerce Insights', description: 'Get all commerce insights for product', service: 'CommerceIntelligenceService', method: 'getFullCommerceInsights', taskType: '', credits: 0, requiredRole: ['SELLER', 'ADMIN'], module: 'ai', tags: ['commerce', 'analytics'] },

  // ── RFQ Intelligence (10 actions) ──
  { id: 'rfq.generate-from-text', name: 'Generate RFQ from Text', description: 'Generate RFQ from natural language', service: 'AiRfqService', method: 'generateFromText', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'SELLER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'generation'] },
  { id: 'rfq.refine', name: 'Refine RFQ', description: 'Refine and improve RFQ', service: 'AiRfqService', method: 'refineRfq', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'optimization'] },
  { id: 'rfq.detect-missing', name: 'Detect Missing Fields', description: 'Detect missing RFQ fields', service: 'AiRfqService', method: 'detectMissing', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'completeness'] },
  { id: 'rfq.detect-duplicates', name: 'Detect Duplicate RFQs', description: 'Detect duplicate RFQs', service: 'AiRfqService', method: 'detectDuplicates', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'duplicates'] },
  { id: 'rfq.predict-category', name: 'Predict Category', description: 'Predict RFQ category', service: 'AiRfqService', method: 'predictCategory', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'category'] },
  { id: 'rfq.suggest-products', name: 'Suggest Products', description: 'Suggest products for RFQ', service: 'AiRfqService', method: 'suggestProducts', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'matching'] },
  { id: 'rfq.suggest-suppliers', name: 'Suggest Suppliers', description: 'Suggest suppliers for RFQ', service: 'AiRfqService', method: 'suggestSuppliers', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'matching'] },
  { id: 'rfq.quality-score', name: 'RFQ Quality Score', description: 'Calculate RFQ quality score', service: 'AiRfqService', method: 'calculateQualityScore', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'quality'] },
  { id: 'rfq.translate', name: 'Translate RFQ', description: 'Translate RFQ to target language', service: 'AiRfqService', method: 'translateRfq', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'translation'] },
  { id: 'rfq.assistant', name: 'RFQ Assistant', description: 'Get RFQ AI assistant data', service: 'AiRfqService', method: 'getAssistantData', taskType: 'RFQ_ANALYSIS', credits: 15, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-rfq', tags: ['rfq', 'assistant'] },

  // ── Quote Intelligence (10 actions) ──
  { id: 'quote.generate', name: 'Generate Quote', description: 'Generate AI-powered quote', service: 'AiQuoteService', method: 'generate', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'generation'] },
  { id: 'quote.price-recommendation', name: 'Price Recommendation', description: 'Get price recommendation', service: 'AiQuoteService', method: 'priceRecommendation', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'pricing'] },
  { id: 'quote.winning-probability', name: 'Winning Probability', description: 'Calculate quote winning probability', service: 'AiQuoteService', method: 'winningProbability', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'analytics'] },
  { id: 'quote.margin-analysis', name: 'Margin Analysis', description: 'Analyze quote margins', service: 'AiQuoteService', method: 'marginAnalysis', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'finance'] },
  { id: 'quote.competitiveness', name: 'Competitiveness Score', description: 'Score quote competitiveness', service: 'AiQuoteService', method: 'competitivenessScore', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'analytics'] },
  { id: 'quote.review', name: 'Review Quote', description: 'AI review of quote', service: 'AiQuoteService', method: 'review', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'review'] },
  { id: 'quote.negotiation-prep', name: 'Negotiation Prep', description: 'Prepare negotiation strategy', service: 'AiQuoteService', method: 'negotiationPrep', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'negotiation'] },
  { id: 'quote.risk-assessment', name: 'Quote Risk Assessment', description: 'Assess quote risk', service: 'AiQuoteService', method: 'riskAssessment', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'risk'] },
  { id: 'quote.quality-score', name: 'Quote Quality Score', description: 'Calculate quote quality score', service: 'AiQuoteService', method: 'qualityScore', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'quality'] },
  { id: 'quote.sidebar', name: 'Quote Sidebar', description: 'Get quote AI sidebar data', service: 'AiQuoteService', method: 'sidebar', taskType: 'QUOTE_ANALYSIS', credits: 15, requiredRole: ['SELLER', 'ADMIN'], module: 'quote', tags: ['quote', 'assistant'] },

  // ── Negotiation Intelligence (12 actions) ──
  { id: 'negotiation.strategy', name: 'Negotiation Strategy', description: 'Generate negotiation strategy', service: 'AiNegotiationService', method: 'generateStrategy', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'strategy'] },
  { id: 'negotiation.buyer-behavior', name: 'Buyer Behavior', description: 'Analyze buyer behavior', service: 'AiNegotiationService', method: 'buyerBehaviorAnalysis', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'analytics'] },
  { id: 'negotiation.seller-suggestions', name: 'Seller Suggestions', description: 'Get seller suggestions', service: 'AiNegotiationService', method: 'sellerSuggestions', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'suggestions'] },
  { id: 'negotiation.sentiment', name: 'Sentiment Analysis', description: 'Analyze negotiation sentiment', service: 'AiNegotiationService', method: 'sentimentAnalysis', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'analytics'] },
  { id: 'negotiation.deal-probability', name: 'Deal Probability', description: 'Calculate deal probability', service: 'AiNegotiationService', method: 'dealProbability', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'analytics'] },
  { id: 'negotiation.suggested-replies', name: 'Suggested Replies', description: 'Get suggested replies', service: 'AiNegotiationService', method: 'suggestedReplies', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'communication'] },
  { id: 'negotiation.risk-detection', name: 'Risk Detection', description: 'Detect negotiation risks', service: 'AiNegotiationService', method: 'riskDetection', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'risk'] },
  { id: 'negotiation.summary', name: 'Conversation Summary', description: 'Summarize negotiation conversation', service: 'AiNegotiationService', method: 'conversationSummary', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'summary'] },
  { id: 'negotiation.translate', name: 'Negotiation Translate', description: 'Translate negotiation messages', service: 'AiNegotiationService', method: 'translate', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'translation'] },
  { id: 'negotiation.memory', name: 'Negotiation AI Memory', description: 'Get AI memory for negotiation', service: 'AiNegotiationService', method: 'aiMemory', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'memory'] },
  { id: 'negotiation.timeline', name: 'Negotiation Timeline', description: 'Get negotiation timeline', service: 'AiNegotiationService', method: 'timeline', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'analytics'] },
  { id: 'negotiation.sidebar', name: 'Negotiation Sidebar', description: 'Get negotiation AI sidebar', service: 'AiNegotiationService', method: 'sidebar', taskType: 'NEGOTIATION', credits: 20, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'smart-negotiation', tags: ['negotiation', 'assistant'] },

  // ── Finance Intelligence (10 actions) ──
  { id: 'finance.credit-risk', name: 'Credit Risk Assessment', description: 'Assess company credit risk', service: 'AiFinanceService', method: 'creditRiskAssessment', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'risk'] },
  { id: 'finance.payment-delay', name: 'Payment Delay Prediction', description: 'Predict payment delays', service: 'AiFinanceService', method: 'paymentDelayPrediction', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'predictions'] },
  { id: 'finance.cash-flow', name: 'Cash Flow Forecast', description: 'Forecast cash flow', service: 'AiFinanceService', method: 'cashFlowForecast', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'forecast'] },
  { id: 'finance.collection-strategy', name: 'Collection Strategy', description: 'Get collection strategy', service: 'AiFinanceService', method: 'collectionStrategy', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'collections'] },
  { id: 'finance.health', name: 'Financial Health', description: 'Assess financial health', service: 'AiFinanceService', method: 'financialHealth', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'health'] },
  { id: 'finance.credit-limit', name: 'Credit Limit Recommendation', description: 'Recommend credit limit', service: 'AiFinanceService', method: 'creditLimitRecommendation', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'credit'] },
  { id: 'finance.invoice-intelligence', name: 'Invoice Intelligence', description: 'Analyze invoice data', service: 'AiFinanceService', method: 'invoiceIntelligence', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'invoices'] },
  { id: 'finance.fraud-signals', name: 'Fraud Signals', description: 'Detect fraud signals', service: 'AiFinanceService', method: 'fraudSignals', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'fraud'] },
  { id: 'finance.collection-draft', name: 'Collection Draft', description: 'Generate collection draft', service: 'AiFinanceService', method: 'collectionDraft', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'collections'] },
  { id: 'finance.sidebar', name: 'Finance Sidebar', description: 'Get finance AI sidebar', service: 'AiFinanceService', method: 'sidebar', taskType: 'FINANCE_ANALYSIS', credits: 10, requiredRole: ['ADMIN'], module: 'finance', tags: ['finance', 'assistant'] },

  // ── Search Intelligence (11 actions) ──
  { id: 'search.semantic', name: 'Semantic Search', description: 'Perform semantic search', service: 'AiSearchService', method: 'semanticSearch', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'semantic'] },
  { id: 'search.intent-detection', name: 'Search Intent Detection', description: 'Detect search intent', service: 'AiSearchService', method: 'searchIntentDetection', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'analytics'] },
  { id: 'search.similar-products', name: 'Similar Products', description: 'Find similar products', service: 'AiSearchService', method: 'similarProducts', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'recommendations'] },
  { id: 'search.similar-suppliers', name: 'Similar Suppliers', description: 'Find similar suppliers', service: 'AiSearchService', method: 'similarSuppliers', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'recommendations'] },
  { id: 'search.personalized-ranking', name: 'Personalized Ranking', description: 'Get personalized search ranking', service: 'AiSearchService', method: 'personalizedRanking', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'ranking'] },
  { id: 'search.buyer-recommendations', name: 'Buyer Recommendations', description: 'Get buyer recommendations', service: 'AiSearchService', method: 'buyerRecommendations', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'recommendations'] },
  { id: 'search.seller-recommendations', name: 'Seller Recommendations', description: 'Get seller recommendations', service: 'AiSearchService', method: 'sellerRecommendations', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'tradfind', tags: ['search', 'recommendations'] },
  { id: 'search.summary', name: 'Search Summary', description: 'Summarize search results', service: 'AiSearchService', method: 'searchSummary', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'summary'] },
  { id: 'search.smart-filters', name: 'Smart Filters', description: 'Get smart filter suggestions', service: 'AiSearchService', method: 'smartFilters', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'filters'] },
  { id: 'search.cross-sell', name: 'Cross-sell/Upsell', description: 'Get cross-sell and upsell suggestions', service: 'AiSearchService', method: 'crossSellUpsell', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'ADMIN'], module: 'tradfind', tags: ['search', 'recommendations'] },
  { id: 'search.sidebar', name: 'Search Sidebar', description: 'Get search AI sidebar', service: 'AiSearchService', method: 'aiSearchSidebar', taskType: 'SEARCH_ANALYSIS', credits: 5, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradfind', tags: ['search', 'assistant'] },

  // ── Admin Intelligence (12 actions) ──
  { id: 'admin.morning-brief', name: 'Morning Brief', description: 'Get admin morning brief', service: 'AiAdminService', method: 'morningBrief', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'executive'] },
  { id: 'admin.revenue-forecast', name: 'Revenue Forecast', description: 'Forecast platform revenue', service: 'AiAdminService', method: 'revenueForecast', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'finance'] },
  { id: 'admin.user-growth', name: 'User Growth Prediction', description: 'Predict user growth', service: 'AiAdminService', method: 'userGrowthPrediction', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'analytics'] },
  { id: 'admin.fraud-intelligence', name: 'Fraud Intelligence', description: 'Detect platform fraud patterns', service: 'AiAdminService', method: 'fraudIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'fraud'] },
  { id: 'admin.churn-prediction', name: 'Churn Prediction', description: 'Predict company churn', service: 'AiAdminService', method: 'churnPrediction', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'analytics'] },
  { id: 'admin.category-intelligence', name: 'Category Intelligence', description: 'Analyze category performance', service: 'AiAdminService', method: 'categoryIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'analytics'] },
  { id: 'admin.geo-intelligence', name: 'Geo Intelligence', description: 'Get geographical insights', service: 'AiAdminService', method: 'geoIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'analytics'] },
  { id: 'admin.market-trends', name: 'Market Trends', description: 'Analyze market trends', service: 'AiAdminService', method: 'marketTrends', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'analytics'] },
  { id: 'admin.alerts', name: 'AI Alerts', description: 'Get AI-powered alerts', service: 'AiAdminService', method: 'aiAlerts', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'alerts'] },
  { id: 'admin.executive-copilot', name: 'Executive Copilot', description: 'Executive AI copilot', service: 'AiAdminService', method: 'executiveCopilot', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'executive'] },
  { id: 'admin.report', name: 'Weekly/Monthly Report', description: 'Generate admin report', service: 'AiAdminService', method: 'weeklyMonthlyReport', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'reports'] },
  { id: 'admin.decision-support', name: 'Decision Support', description: 'Get decision support', service: 'AiAdminService', method: 'decisionSupport', taskType: 'ADMIN_INTELLIGENCE', credits: 10, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'admin-intelligence', tags: ['admin', 'analytics'] },

  // ── TradeTalk Intelligence (10 actions) ──
  { id: 'tradetalk.community-copilot', name: 'Community Copilot', description: 'AI community assistant', service: 'AiTradeTalkService', method: 'aiCommunityCopilot', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'community'] },
  { id: 'tradetalk.community-summary', name: 'Community Summary', description: 'Summarize community activity', service: 'AiTradeTalkService', method: 'aiCommunitySummary', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'summary'] },
  { id: 'tradetalk.suggested-communities', name: 'Suggested Communities', description: 'Get community suggestions', service: 'AiTradeTalkService', method: 'aiSuggestedCommunities', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'recommendations'] },
  { id: 'tradetalk.suggested-members', name: 'Suggested Members', description: 'Get member suggestions', service: 'AiTradeTalkService', method: 'aiSuggestedMembers', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'recommendations'] },
  { id: 'tradetalk.networking', name: 'Networking Suggestions', description: 'Get networking suggestions', service: 'AiTradeTalkService', method: 'aiNetworkingSuggestions', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'networking'] },
  { id: 'tradetalk.discussion-ideas', name: 'Discussion Ideas', description: 'Get discussion topic ideas', service: 'AiTradeTalkService', method: 'aiDiscussionIdeas', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'content'] },
  { id: 'tradetalk.community-insights', name: 'Community Insights', description: 'Get community analytics', service: 'AiTradeTalkService', method: 'aiCommunityInsights', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'analytics'] },
  { id: 'tradetalk.dashboard-widgets', name: 'Community Dashboard', description: 'Get community dashboard widgets', service: 'AiTradeTalkService', method: 'aiDashboardWidgets', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'dashboard'] },
  { id: 'tradetalk.notification-prep', name: 'Community Notifications', description: 'Prepare notification content', service: 'AiTradeTalkService', method: 'aiNotificationPrep', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'notifications'] },

  // ── Phase D7: Content Assistance (7 actions) ──
  { id: 'tradetalk.generate-post', name: 'Generate Post', description: 'Generate a business post using AI', service: 'AiTradeTalkService', method: 'generatePost', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'content', 'generation'] },
  { id: 'tradetalk.rewrite-post', name: 'Rewrite Post', description: 'Rewrite a post in a different style', service: 'AiTradeTalkService', method: 'rewritePost', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'content', 'editing'] },
  { id: 'tradetalk.improve-grammar', name: 'Improve Grammar', description: 'Improve grammar and clarity of post content', service: 'AiTradeTalkService', method: 'improveGrammar', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'content', 'editing'] },
  { id: 'tradetalk.summarize', name: 'Summarize Content', description: 'Summarize long content', service: 'AiTradeTalkService', method: 'summarizeContent', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'content', 'summary'] },
  { id: 'tradetalk.translate', name: 'Translate Content', description: 'Translate post content to target language', service: 'AiTradeTalkService', method: 'translateContent', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'content', 'translation'] },
  { id: 'tradetalk.suggest-hashtags', name: 'Suggest Hashtags', description: 'Suggest hashtags for post content', service: 'AiTradeTalkService', method: 'suggestHashtags', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'content', 'hashtags'] },
  { id: 'tradetalk.suggest-title', name: 'Suggest Title', description: 'Suggest a title for post content', service: 'AiTradeTalkService', method: 'suggestTitle', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'content', 'titles'] },

  // ── Phase D7: Moderation (5 actions) ──
  { id: 'tradetalk.detect-spam', name: 'Detect Spam', description: 'Detect spam content', service: 'AiTradeTalkService', method: 'detectSpam', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'moderation', 'spam'] },
  { id: 'tradetalk.detect-duplicates', name: 'Detect Duplicates', description: 'Detect duplicate content', service: 'AiTradeTalkService', method: 'detectDuplicateContent', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'moderation', 'duplicates'] },
  { id: 'tradetalk.detect-offensive', name: 'Detect Offensive Language', description: 'Detect offensive language', service: 'AiTradeTalkService', method: 'detectOffensiveLanguage', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'moderation', 'offensive'] },
  { id: 'tradetalk.detect-unsafe-links', name: 'Detect Unsafe Links', description: 'Detect unsafe links in content', service: 'AiTradeTalkService', method: 'detectUnsafeLinks', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'moderation', 'links'] },
  { id: 'tradetalk.recommend-status', name: 'Recommend Status', description: 'Recommend content status based on policy review', service: 'AiTradeTalkService', method: 'recommendContentStatus', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'moderation', 'status'] },

  // ── Phase D7: Insights (3 actions) ──
  { id: 'tradetalk.suggest-posting-time', name: 'Suggest Posting Time', description: 'Suggest optimal posting time', service: 'AiTradeTalkService', method: 'suggestPostingTime', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'insights', 'timing'] },
  { id: 'tradetalk.suggest-categories', name: 'Suggest Categories', description: 'Suggest categories for content', service: 'AiTradeTalkService', method: 'suggestCategories', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'insights', 'categories'] },
  { id: 'tradetalk.suggest-communities-for-content', name: 'Suggest Communities', description: 'Suggest communities where content fits best', service: 'AiTradeTalkService', method: 'suggestCommunitiesForContent', taskType: 'COMMUNITY_ANALYSIS', credits: 3, requiredRole: ['SELLER', 'BUYER', 'ADMIN'], module: 'tradetalk', tags: ['tradetalk', 'insights', 'communities'] },

  // ── Founder AI (18 actions) ──
  { id: 'founder.morning-brief', name: 'Founder Morning Brief', description: 'Get founder morning brief', service: 'FounderAiAggregatorService', method: 'morningBrief', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'executive'] },
  { id: 'founder.evening-summary', name: 'Founder Evening Summary', description: 'Get founder evening summary', service: 'FounderAiAggregatorService', method: 'eveningSummary', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'executive'] },
  { id: 'founder.executive-dashboard', name: 'Executive Dashboard', description: 'Get executive dashboard', service: 'FounderAiAggregatorService', method: 'executiveDashboard', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'dashboard'] },
  { id: 'founder.decision-center', name: 'Decision Center', description: 'Get decision support center', service: 'FounderAiAggregatorService', method: 'decisionCenter', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'analytics'] },
  { id: 'founder.risk-intelligence', name: 'Risk Intelligence', description: 'Get risk assessment', service: 'FounderAiAggregatorService', method: 'riskIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'risk'] },
  { id: 'founder.growth-intelligence', name: 'Growth Intelligence', description: 'Get growth opportunities', service: 'FounderAiAggregatorService', method: 'growthIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'growth'] },
  { id: 'founder.copilot', name: 'Founder Copilot', description: 'Ask founder AI copilot', service: 'FounderAiAggregatorService', method: 'founderCopilot', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'assistant'] },
  { id: 'founder.health-score', name: 'Business Health Score', description: 'Get business health score', service: 'FounderAiAggregatorService', method: 'healthScore', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'health'] },
  { id: 'founder.priorities', name: 'Executive Priorities', description: 'Get top executive priorities', service: 'FounderAiAggregatorService', method: 'executivePriorities', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'priorities'] },
  { id: 'founder.timeline', name: 'Executive Timeline', description: 'Get executive timeline', service: 'FounderAiAggregatorService', method: 'executiveTimeline', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'timeline'] },
  { id: 'founder.report', name: 'Executive Report', description: 'Generate executive report', service: 'FounderAiAggregatorService', method: 'executiveReport', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'reports'] },
  { id: 'founder.marketplace-intelligence', name: 'Marketplace Intelligence', description: 'Get marketplace analysis', service: 'FounderAiAggregatorService', method: 'marketplaceIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'marketplace'] },
  { id: 'founder.tradeserv-intelligence', name: 'TradeServ Intelligence', description: 'Get TradeServ analysis', service: 'FounderAiAggregatorService', method: 'tradeservIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'tradeserv'] },
  { id: 'founder.tradetalk-intelligence', name: 'TradeTalk Intelligence', description: 'Get TradeTalk analysis', service: 'FounderAiAggregatorService', method: 'tradetalkIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'tradetalk'] },
  { id: 'founder.membership-intelligence', name: 'Membership Intelligence', description: 'Get membership analysis', service: 'FounderAiAggregatorService', method: 'membershipIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'membership'] },
  { id: 'founder.gocash-intelligence', name: 'GOCASH Intelligence', description: 'Get GOCASH analysis', service: 'FounderAiAggregatorService', method: 'gocashIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'gocash'] },
  { id: 'founder.tradtrust-intelligence', name: 'TradTrust Intelligence', description: 'Get TradTrust analysis', service: 'FounderAiAggregatorService', method: 'tradtrustIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'tradtrust'] },
  { id: 'founder.advertising-intelligence', name: 'Advertising Intelligence', description: 'Get advertising analysis', service: 'FounderAiAggregatorService', method: 'advertisingIntelligence', taskType: 'ADMIN_INTELLIGENCE', credits: 0, requiredRole: ['ADMIN', 'SUPER_ADMIN'], module: 'founder-ai', tags: ['founder', 'advertising'] },
]

export class AiActionRegistry {
  getAll(): AiAction[] {
    return REGISTRY
  }

  getById(id: string): AiAction | undefined {
    return REGISTRY.find(a => a.id === id)
  }

  findByTags(tags: string[]): AiAction[] {
    return REGISTRY.filter(a => tags.some(t => a.tags.includes(t)))
  }

  findByModule(module: string): AiAction[] {
    return REGISTRY.filter(a => a.module === module)
  }

  findByRole(role: string): AiAction[] {
    return REGISTRY.filter(a => a.requiredRole.includes(role) || a.requiredRole.includes('ADMIN'))
  }

  findByTaskType(taskType: string): AiAction[] {
    return REGISTRY.filter(a => a.taskType === taskType)
  }

  getSummary() {
    const byModule = new Map<string, number>()
    for (const a of REGISTRY) {
      byModule.set(a.module, (byModule.get(a.module) || 0) + 1)
    }
    const byTag = new Map<string, number>()
    for (const a of REGISTRY) {
      for (const t of a.tags) {
        byTag.set(t, (byTag.get(t) || 0) + 1)
      }
    }
    return {
      totalActions: REGISTRY.length,
      byModule: Object.fromEntries(byModule),
      byTag: Object.fromEntries(byTag),
    }
  }
}