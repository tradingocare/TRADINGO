'use client'

import { useQuery } from '@tanstack/react-query'
import { getSalesPotential, getSuggestedPrice, getDemandTrend, getCompetitionAnalysis, getSuggestedAdvertising, getFullCommerceInsights } from '@/lib/api/ai'

export function useSalesPotential(productId: string) {
  return useQuery({
    queryKey: ['sales-potential', productId],
    queryFn: () => getSalesPotential(productId),
    enabled: !!productId,
  })
}

export function useSuggestedPrice(productId: string) {
  return useQuery({
    queryKey: ['suggested-price', productId],
    queryFn: () => getSuggestedPrice(productId),
    enabled: !!productId,
  })
}

export function useDemandTrend(productId: string) {
  return useQuery({
    queryKey: ['demand-trend', productId],
    queryFn: () => getDemandTrend(productId),
    enabled: !!productId,
  })
}

export function useCompetitionAnalysis(productId: string) {
  return useQuery({
    queryKey: ['competition-analysis', productId],
    queryFn: () => getCompetitionAnalysis(productId),
    enabled: !!productId,
  })
}

export function useSuggestedAdvertising(productId: string) {
  return useQuery({
    queryKey: ['suggested-advertising', productId],
    queryFn: () => getSuggestedAdvertising(productId),
    enabled: !!productId,
  })
}

export function useFullCommerceInsights(productId: string) {
  return useQuery({
    queryKey: ['commerce-insights', productId],
    queryFn: () => getFullCommerceInsights(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  })
}