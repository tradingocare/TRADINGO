'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { getProductCompleteness, getBulkCompleteness, type ProductCompletenessResponse } from '@/lib/api/ai'

export function useProductCompleteness(productId: string) {
  return useQuery({
    queryKey: ['product-completeness', productId],
    queryFn: () => getProductCompleteness(productId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  })
}

export function useBulkCompleteness() {
  return useMutation({
    mutationFn: (productIds: string[]) => getBulkCompleteness(productIds),
  })
}