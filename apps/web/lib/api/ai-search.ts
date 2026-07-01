import api from './client'

export interface AiSearchResponse<T> {
  success: boolean
  content: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}

export function aiSemanticSearch(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/semantic', data)
}

export function aiSearchIntent(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/intent', data)
}

export function aiSimilarProducts(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/similar-products', data)
}

export function aiSimilarSuppliers(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/similar-suppliers', data)
}

export function aiPersonalizedRanking(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/personalized-ranking', data)
}

export function aiBuyerRecommendations(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/buyer-recommendations', data)
}

export function aiSellerRecommendations(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/seller-recommendations', data)
}

export function aiSearchSummary(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/summary', data)
}

export function aiSmartFilters(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/smart-filters', data)
}

export function aiCrossSellUpsell(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/cross-sell', data)
}

export function aiSearchSidebar(data: any) {
  return api.post<AiSearchResponse<any>>('/search/ai/sidebar', data)
}
