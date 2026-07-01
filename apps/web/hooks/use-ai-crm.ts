import { useMutation } from '@tanstack/react-query'
import {
  aiCrmScoring, aiCrmNextBestAction, aiCrmConversionProbability, aiCrmInsights,
  aiCrmSentiment, aiCrmPipelineHealth, aiCrmForecast, aiCrmDealRisk,
  aiCrmRecommendedActions, aiCrmCommunicationTips, aiCrmFollowUpPriority, aiCrmSidebar,
} from '@/lib/api/ai-crm'

export function useAiCrmScoring() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmScoring(leadId, data) })
}

export function useAiCrmNextBestAction() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmNextBestAction(leadId, data) })
}

export function useAiCrmConversionProbability() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmConversionProbability(leadId, data) })
}

export function useAiCrmInsights() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmInsights(leadId, data) })
}

export function useAiCrmSentiment() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmSentiment(leadId, data) })
}

export function useAiCrmPipelineHealth() {
  return useMutation({ mutationFn: (data: any) => aiCrmPipelineHealth(data) })
}

export function useAiCrmForecast() {
  return useMutation({ mutationFn: (data: any) => aiCrmForecast(data) })
}

export function useAiCrmDealRisk() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmDealRisk(leadId, data) })
}

export function useAiCrmRecommendedActions() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmRecommendedActions(leadId, data) })
}

export function useAiCrmCommunicationTips() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmCommunicationTips(leadId, data) })
}

export function useAiCrmFollowUpPriority() {
  return useMutation({ mutationFn: (data: any) => aiCrmFollowUpPriority(data) })
}

export function useAiCrmSidebar() {
  return useMutation({ mutationFn: ({ leadId, data }: { leadId: string; data: any }) => aiCrmSidebar(leadId, data) })
}
