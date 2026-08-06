import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBestSuppliers,
  getGeoClusters,
  getLocationSummary,
  recordMarketplaceEvent,
  getSellerRecommendations,
  getMarketplaceRankings,
  getGeoIntelligence,
  getBusinessIntelligence,
} from '@/lib/api/marketplace-intelligence'

export function useBestSuppliers(params: {
  lat?: number
  lng?: number
  radius?: number
  categoryId?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['best-suppliers', params],
    queryFn: () => getBestSuppliers(params),
    enabled: !!(params.lat && params.lng),
    staleTime: 5 * 60 * 1000,
  })
}

export function useGeoClusters(entityType?: string, period?: string) {
  return useQuery({
    queryKey: ['geo-clusters', entityType, period],
    queryFn: () => getGeoClusters(entityType, period),
    staleTime: 10 * 60 * 1000,
  })
}

export function useLocationSummary() {
  return useQuery({
    queryKey: ['location-summary'],
    queryFn: getLocationSummary,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRecordMarketplaceEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: recordMarketplaceEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['best-suppliers'] })
    },
  })
}

export function useSellerRecommendations(companyId: string, limit = 10) {
  return useQuery({
    queryKey: ['marketplace', 'seller-recommendations', companyId, limit],
    queryFn: () => getSellerRecommendations(companyId, limit),
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useMarketplaceRankings() {
  return useQuery({
    queryKey: ['marketplace', 'rankings'],
    queryFn: getMarketplaceRankings,
    staleTime: 15 * 60 * 1000,
  })
}

export function useGeoIntelligence() {
  return useQuery({
    queryKey: ['marketplace', 'geo-intelligence'],
    queryFn: getGeoIntelligence,
    staleTime: 30 * 60 * 1000,
  })
}

export function useBusinessIntelligence(companyId: string) {
  return useQuery({
    queryKey: ['marketplace', 'business-intelligence', companyId],
    queryFn: () => getBusinessIntelligence(companyId),
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  })
}
