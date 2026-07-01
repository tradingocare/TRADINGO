import api from './client'

export interface AiQuoteResponse<T> {
  success: boolean
  content: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}

// 1. Generate Quote
export function aiGenerateQuote(companyId: string, data: { rfqId?: string; naturalLanguage?: string; rfqData?: Record<string, unknown> }) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/generate`, data)
}

// 2. Price Recommendation
export function aiPriceRecommendation(companyId: string, data: {
  productName: string; basePrice: number; currency?: string; quantity?: number; unit?: string; deliveryTerms?: string; marketContext?: Record<string, unknown>
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/price-recommendation`, data)
}

// 3. Winning Probability
export function aiWinningProbability(companyId: string, data: {
  quoteId: string; rfqId?: string; totalAmount?: number; leadTimeDays?: number; trustScore?: number; responseRate?: number; deliveryTerms?: string; competitorQuotes?: { amount: number; leadTime: number; trustScore: number }[]
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/winning-probability`, data)
}

// 4. Margin Analysis
export function aiMarginAnalysis(companyId: string, data: {
  subtotal: number; totalAmount: number; taxAmount?: number; discountAmount?: number; discountPercent?: number; currency?: string; estimatedCostOfGoods?: number; shippingCost?: number; platformFee?: number; lineItems?: { productName: string; quantity: number; unitPrice: number; estimatedCost?: number }[]
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/margin-analysis`, data)
}

// 5. Competitiveness Score
export function aiCompetitivenessScore(companyId: string, data: {
  totalAmount: number; leadTimeDays?: number; trustScore?: number; deliveryTerms?: string; paymentTerms?: string; categoryName?: string; marketQuotes?: { amount: number; leadTime: number }[]
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/competitiveness`, data)
}

// 6. Quote Review
export function aiQuoteReview(companyId: string, data: {
  quoteId: string; quoteData?: Record<string, unknown>; language?: string; strictness?: boolean
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/review`, data)
}

// 7. Negotiation Prep
export function aiNegotiationPrep(companyId: string, data: {
  quoteId?: string; buyerId?: string; quoteData?: Record<string, unknown>; buyerProfile?: Record<string, unknown>; pastNegotiations?: Record<string, unknown>[]
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/negotiation-prep`, data)
}

// 8. Risk Assessment
export function aiRiskAssessment(companyId: string, data: {
  buyerId?: string; buyerCompanyId?: string; buyerProfile?: Record<string, unknown>; creditStatus?: Record<string, unknown>; trustScore?: number; verificationLevel?: string; quoteAmount?: number
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/risk-assessment`, data)
}

// 9. Quality Score
export function aiQuoteQualityScore(companyId: string, data: {
  quoteData: Record<string, unknown>; language?: string
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/quality-score`, data)
}

// 10. Sidebar (all-in-one)
export function aiQuoteSidebar(companyId: string, data: {
  rfqData?: Record<string, unknown>; formData?: Record<string, unknown>; lineItems?: Record<string, unknown>[]; companyProfile?: Record<string, unknown>; buyerProfile?: Record<string, unknown>
}) {
  return api.post<AiQuoteResponse<any>>(`/companies/${companyId}/quote/ai/sidebar`, data)
}
