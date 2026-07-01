import api from './client'

export interface AiCrmResponse<T> {
  success: boolean
  content: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}

export function aiCrmScoring(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/scoring`, data)
}

export function aiCrmNextBestAction(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/next-best-action`, data)
}

export function aiCrmConversionProbability(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/conversion-probability`, data)
}

export function aiCrmInsights(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/insights`, data)
}

export function aiCrmSentiment(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/sentiment`, data)
}

export function aiCrmPipelineHealth(data: any) {
  return api.post<AiCrmResponse<any>>('/crm/ai/pipeline-health', data)
}

export function aiCrmForecast(data: any) {
  return api.post<AiCrmResponse<any>>('/crm/ai/forecast', data)
}

export function aiCrmDealRisk(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/deal-risk`, data)
}

export function aiCrmRecommendedActions(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/recommended-actions`, data)
}

export function aiCrmCommunicationTips(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/communication-tips`, data)
}

export function aiCrmFollowUpPriority(data: any) {
  return api.post<AiCrmResponse<any>>('/crm/ai/follow-up-priority', data)
}

export function aiCrmSidebar(leadId: string, data: any) {
  return api.post<AiCrmResponse<any>>(`/crm/${leadId}/ai/sidebar`, data)
}
