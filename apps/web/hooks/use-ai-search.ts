import { useMutation } from '@tanstack/react-query'
import {
  aiSemanticSearch, aiSearchIntent, aiSimilarProducts, aiSimilarSuppliers,
  aiPersonalizedRanking, aiBuyerRecommendations, aiSellerRecommendations,
  aiSearchSummary, aiSmartFilters, aiCrossSellUpsell, aiSearchSidebar,
} from '@/lib/api/ai-search'

export function useAiSemanticSearch() {
  return useMutation({ mutationFn: (data: any) => aiSemanticSearch(data) })
}

export function useAiSearchIntent() {
  return useMutation({ mutationFn: (data: any) => aiSearchIntent(data) })
}

export function useAiSimilarProducts() {
  return useMutation({ mutationFn: (data: any) => aiSimilarProducts(data) })
}

export function useAiSimilarSuppliers() {
  return useMutation({ mutationFn: (data: any) => aiSimilarSuppliers(data) })
}

export function useAiPersonalizedRanking() {
  return useMutation({ mutationFn: (data: any) => aiPersonalizedRanking(data) })
}

export function useAiBuyerRecommendations() {
  return useMutation({ mutationFn: (data: any) => aiBuyerRecommendations(data) })
}

export function useAiSellerRecommendations() {
  return useMutation({ mutationFn: (data: any) => aiSellerRecommendations(data) })
}

export function useAiSearchSummary() {
  return useMutation({ mutationFn: (data: any) => aiSearchSummary(data) })
}

export function useAiSmartFilters() {
  return useMutation({ mutationFn: (data: any) => aiSmartFilters(data) })
}

export function useAiCrossSellUpsell() {
  return useMutation({ mutationFn: (data: any) => aiCrossSellUpsell(data) })
}

export function useAiSearchSidebar() {
  return useMutation({ mutationFn: (data: any) => aiSearchSidebar(data) })
}
