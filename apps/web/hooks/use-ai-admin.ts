import { useMutation } from '@tanstack/react-query'
import {
  aiMorningBrief, aiRevenueForecast, aiUserGrowthPrediction,
  aiFraudIntelligence, aiChurnPrediction, aiCategoryIntelligence,
  aiGeoIntelligence, aiMarketTrends, aiAlerts,
  aiExecutiveCopilot, aiWeeklyMonthlyReport, aiDecisionSupport,
} from '@/lib/api/ai-admin'

export function useAiMorningBrief() {
  return useMutation({ mutationFn: (data: any) => aiMorningBrief(data) })
}

export function useAiRevenueForecast() {
  return useMutation({ mutationFn: (data: any) => aiRevenueForecast(data) })
}

export function useAiUserGrowthPrediction() {
  return useMutation({ mutationFn: (data: any) => aiUserGrowthPrediction(data) })
}

export function useAiFraudIntelligence() {
  return useMutation({ mutationFn: (data: any) => aiFraudIntelligence(data) })
}

export function useAiChurnPrediction() {
  return useMutation({ mutationFn: (data: any) => aiChurnPrediction(data) })
}

export function useAiCategoryIntelligence() {
  return useMutation({ mutationFn: (data: any) => aiCategoryIntelligence(data) })
}

export function useAiGeoIntelligence() {
  return useMutation({ mutationFn: (data: any) => aiGeoIntelligence(data) })
}

export function useAiMarketTrends() {
  return useMutation({ mutationFn: (data: any) => aiMarketTrends(data) })
}

export function useAiAlerts() {
  return useMutation({ mutationFn: (data: any) => aiAlerts(data) })
}

export function useAiExecutiveCopilot() {
  return useMutation({ mutationFn: (data: any) => aiExecutiveCopilot(data) })
}

export function useAiWeeklyMonthlyReport() {
  return useMutation({ mutationFn: (data: any) => aiWeeklyMonthlyReport(data) })
}

export function useAiDecisionSupport() {
  return useMutation({ mutationFn: (data: any) => aiDecisionSupport(data) })
}
