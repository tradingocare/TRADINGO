import { useMutation } from '@tanstack/react-query'
import {
  aiGenerateQuote, aiPriceRecommendation, aiWinningProbability, aiMarginAnalysis,
  aiCompetitivenessScore, aiQuoteReview, aiNegotiationPrep, aiRiskAssessment,
  aiQuoteQualityScore, aiQuoteSidebar,
} from '@/lib/api/ai-quote'

export function useAiGenerateQuote() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiGenerateQuote(companyId, data) })
}

export function useAiPriceRecommendation() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiPriceRecommendation(companyId, data) })
}

export function useAiWinningProbability() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiWinningProbability(companyId, data) })
}

export function useAiMarginAnalysis() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiMarginAnalysis(companyId, data) })
}

export function useAiCompetitivenessScore() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiCompetitivenessScore(companyId, data) })
}

export function useAiQuoteReview() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiQuoteReview(companyId, data) })
}

export function useAiNegotiationPrep() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiNegotiationPrep(companyId, data) })
}

export function useAiRiskAssessment() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiRiskAssessment(companyId, data) })
}

export function useAiQuoteQualityScore() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiQuoteQualityScore(companyId, data) })
}

export function useAiQuoteSidebar() {
  return useMutation({ mutationFn: ({ companyId, data }: { companyId: string; data: any }) => aiQuoteSidebar(companyId, data) })
}
