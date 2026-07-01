import { useMutation } from '@tanstack/react-query'
import {
  aiNegotiationStrategy, aiBuyerBehavior, aiSellerSuggestions, aiSentiment,
  aiDealProbability, aiSuggestedReplies, aiRiskDetection, aiConversationSummary,
  aiTranslateNegotiation, aiNegotiationMemory, aiNegotiationTimeline, aiNegotiationSidebar,
} from '@/lib/api/ai-negotiation'

export function useAiNegotiationStrategy() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiNegotiationStrategy(negotiationId, data) })
}

export function useAiBuyerBehavior() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiBuyerBehavior(negotiationId, data) })
}

export function useAiSellerSuggestions() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiSellerSuggestions(negotiationId, data) })
}

export function useAiSentiment() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiSentiment(negotiationId, data) })
}

export function useAiDealProbability() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiDealProbability(negotiationId, data) })
}

export function useAiSuggestedReplies() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiSuggestedReplies(negotiationId, data) })
}

export function useAiRiskDetection() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiRiskDetection(negotiationId, data) })
}

export function useAiConversationSummary() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiConversationSummary(negotiationId, data) })
}

export function useAiTranslateNegotiation() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: { text: string; targetLanguage: string } }) => aiTranslateNegotiation(negotiationId, data) })
}

export function useAiNegotiationMemory() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiNegotiationMemory(negotiationId, data) })
}

export function useAiNegotiationTimeline() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiNegotiationTimeline(negotiationId, data) })
}

export function useAiNegotiationSidebar() {
  return useMutation({ mutationFn: ({ negotiationId, data }: { negotiationId: string; data: any }) => aiNegotiationSidebar(negotiationId, data) })
}
