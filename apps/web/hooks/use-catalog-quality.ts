'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calculateScore, getScore, listScores, getQualityDashboard, detectDuplicates, getBulkCompleteness, type CatalogScore, type HealthDashboard, type DuplicateResult, type ProductCompletenessResponse } from '@/lib/api/ai'

export function useCalculateScore(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => calculateScore(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-score', productId] })
      queryClient.invalidateQueries({ queryKey: ['catalog-scores'] })
    },
  })
}

export function useScore(productId: string) {
  return useQuery({
    queryKey: ['catalog-score', productId],
    queryFn: () => getScore(productId),
    enabled: !!productId,
  })
}

export function useScores(params?: { page?: number; limit?: number; companyId?: string }) {
  return useQuery({
    queryKey: ['catalog-scores', params],
    queryFn: () => listScores(params),
  })
}

export function useQualityDashboard() {
  return useQuery({
    queryKey: ['quality-dashboard'],
    queryFn: () => getQualityDashboard(),
  })
}

export function useDetectDuplicates() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data?: { productId?: string; companyId?: string }) => detectDuplicates(data || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
    },
  })
}

export function useBulkCompleteness() {
  return useMutation({
    mutationFn: (productIds: string[]) => getBulkCompleteness(productIds),
  })
}

export function useSellerQualityDashboard(companyId?: string) {
  return useQuery({
    queryKey: ['seller-quality-dashboard', companyId],
    queryFn: () => getQualityDashboard({ companyId }),
    enabled: !!companyId,
  })
}