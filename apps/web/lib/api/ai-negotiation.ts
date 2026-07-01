import api from './client'

export interface AiNegotiationResponse<T> {
  success: boolean
  content: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}

export function aiNegotiationStrategy(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/strategy`, data)
}

export function aiBuyerBehavior(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/buyer-behavior`, data)
}

export function aiSellerSuggestions(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/seller-suggestions`, data)
}

export function aiSentiment(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/sentiment`, data)
}

export function aiDealProbability(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/probability`, data)
}

export function aiSuggestedReplies(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/replies`, data)
}

export function aiRiskDetection(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/risk`, data)
}

export function aiConversationSummary(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/summary`, data)
}

export function aiTranslateNegotiation(negotiationId: string, data: { text: string; targetLanguage: string; sourceLanguage?: string }) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/translate`, data)
}

export function aiNegotiationMemory(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/memory`, data)
}

export function aiNegotiationTimeline(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/timeline`, data)
}

export function aiNegotiationSidebar(negotiationId: string, data: any) {
  return api.post<AiNegotiationResponse<any>>(`/smart-negotiation/${negotiationId}/ai/sidebar`, data)
}
