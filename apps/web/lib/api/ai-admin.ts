import api from './client'

export interface AiAdminResponse<T> {
  success: boolean
  content: T
  provider: string
  model: string
  cached: boolean
  latencyMs: number
  cost: number
}

export function aiMorningBrief(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/morning-brief', data)
}

export function aiRevenueForecast(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/revenue-forecast', data)
}

export function aiUserGrowthPrediction(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/user-growth-prediction', data)
}

export function aiFraudIntelligence(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/fraud-intelligence', data)
}

export function aiChurnPrediction(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/churn-prediction', data)
}

export function aiCategoryIntelligence(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/category-intelligence', data)
}

export function aiGeoIntelligence(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/geo-intelligence', data)
}

export function aiMarketTrends(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/market-trends', data)
}

export function aiAlerts(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/alerts', data)
}

export function aiExecutiveCopilot(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/executive-copilot', data)
}

export function aiWeeklyMonthlyReport(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/report', data)
}

export function aiDecisionSupport(data: any) {
  return api.post<AiAdminResponse<any>>('/admin/ai/decision-support', data)
}
