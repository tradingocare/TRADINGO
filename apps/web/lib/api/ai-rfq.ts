import api from './client'

export interface GeneratedRfq {
  title: string
  description: string
  category: string | null
  quantity: number | null
  unit: string | null
  deliveryLocation: string | null
  deliveryTimeline: string | null
  budgetMin: number | null
  budgetMax: number | null
  specifications: string[]
  suggestedTags: string[]
}

export interface MissingField {
  field: string
  label: string
  reason: string
  suggestion: string
}

export interface DuplicateRfq {
  rfqId: string
  title: string
  similarityScore: number
  status: string
  createdAt: string
}

export interface QualityScoreBreakdown {
  category: string
  score: number
  maxScore: number
  weight: number
}

export interface QualityScoreResult {
  score: number
  maxScore: number
  breakdown: QualityScoreBreakdown[]
  improvements: string[]
  strengths: string[]
}

export interface AiSuggestion {
  productName: string
  suggestedCategory: string
  typicalSpecifications: string[]
  unitOptions: string[]
  priceRange: { min: number; max: number; currency: string }
}

export interface CatalogProduct {
  id: string
  name: string
  slug: string
  categoryId: string | null
  originalPrice: number | null
}

export interface SupplierMatch {
  id: string
  name: string
  slug: string
  logo: string | null
  trustScore: number
  verificationLevel: string
  totalProducts: number
  matchReason: string
  relevanceScore: number
}

export interface AiAssistantData {
  missingFields: MissingField[]
  qualityScore: QualityScoreResult
  suggestion: string
  title: string
  totalFields: number
}

export interface AiRfqResponse<T> {
  success: boolean
  data: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}

// 1. Natural Language RFQ
export function generateRfqFromText(text: string, language?: string) {
  return api.post<AiRfqResponse<GeneratedRfq>>('/smart-rfq/ai/generate-from-text', { text, language })
}

// 2. AI Requirement Refinement
export function refineRfq(rfqId: string, focusArea?: string, additionalContext?: string) {
  return api.post<AiRfqResponse<any>>(`/smart-rfq/${rfqId}/ai/refine`, { rfqId, focusArea, additionalContext })
}

// 3. Missing Information Detection
export function detectMissingFields(rfqData: Record<string, unknown>, language?: string) {
  return api.post<AiRfqResponse<MissingField[]>>('/smart-rfq/ai/detect-missing', { rfqData, language })
}

// 4. Duplicate RFQ Detection
export function detectDuplicateRfqs(title: string, description?: string, productNames?: string[]) {
  return api.post<AiRfqResponse<DuplicateRfq[]>>('/smart-rfq/ai/detect-duplicates', { title, description, productNames })
}

// 5. AI Category Prediction
export function predictCategory(productName: string, description?: string) {
  return api.post<AiRfqResponse<any>>('/smart-rfq/ai/predict-category', { productName, description })
}

// 6. AI Product Suggestions
export function suggestProducts(productNames: string[], categoryId?: string, limit?: number) {
  return api.post<{ success: boolean; data: { aiSuggestions: AiSuggestion[]; catalogProducts: CatalogProduct[] } }>('/smart-rfq/ai/suggest-products', { productNames, categoryId, limit })
}

// 7. AI Supplier Suggestions
export function suggestSuppliers(rfqId: string, limit?: number) {
  return api.post<{ success: boolean; data: { matchingCriteria: any; suppliers: SupplierMatch[] } }>(`/smart-rfq/${rfqId}/ai/suggest-suppliers`, { rfqId, limit })
}

// 8. RFQ Quality Score
export function calculateQualityScore(rfqData: Record<string, unknown>) {
  return api.post<AiRfqResponse<QualityScoreResult>>('/smart-rfq/ai/quality-score', { rfqData })
}

// 9. Multi-language RFQ
export function translateRfq(rfqId: string, targetLanguage: string) {
  return api.post<AiRfqResponse<any>>(`/smart-rfq/${rfqId}/ai/translate`, { rfqId, targetLanguage })
}

// 10. AI Assistant Sidebar
export function getAiAssistantData(rfqData: Record<string, unknown>, context?: string) {
  return api.post<AiRfqResponse<AiAssistantData>>('/smart-rfq/ai/assistant', { rfqData, context })
}
