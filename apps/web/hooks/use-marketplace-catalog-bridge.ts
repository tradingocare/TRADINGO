import { useQuery } from '@tanstack/react-query';
import { marketplaceCatalogBridgeApi } from '@/lib/api/marketplace-catalog-bridge';
import type { EnrichedCategoryTreeResponse, EnrichedCategoryResponse, EnrichedProductResponse, MappingCoverageResponse, BatchResolveResponse } from '@/lib/api/marketplace-catalog-bridge';
import type { PaginatedResponse } from '@/lib/api/types';

export function useEnrichedCategoryTree() {
  return useQuery<EnrichedCategoryTreeResponse>({
    queryKey: ['marketplace-catalog-bridge', 'categories', 'tree'],
    queryFn: () => marketplaceCatalogBridgeApi.getEnrichedTree(),
  });
}

export function useEnrichedCategory(id: string) {
  return useQuery<EnrichedCategoryResponse | null>({
    queryKey: ['marketplace-catalog-bridge', 'categories', id],
    queryFn: () => marketplaceCatalogBridgeApi.getEnrichedCategory(id),
    enabled: !!id,
  });
}

export function useEnrichedProduct(id: string) {
  return useQuery<EnrichedProductResponse | null>({
    queryKey: ['marketplace-catalog-bridge', 'products', id],
    queryFn: () => marketplaceCatalogBridgeApi.getEnrichedProduct(id),
    enabled: !!id,
  });
}

export function useEnrichedProductSearch(params: { q?: string; categoryId?: string; brand?: string; page?: number; limit?: number }) {
  return useQuery<PaginatedResponse<EnrichedProductResponse & { price: number; stock: number }>>({
    queryKey: ['marketplace-catalog-bridge', 'products', 'search', params],
    queryFn: () => marketplaceCatalogBridgeApi.searchEnrichedProducts(params),
  });
}

export function useMappingCoverage() {
  return useQuery<MappingCoverageResponse>({
    queryKey: ['marketplace-catalog-bridge', 'coverage'],
    queryFn: () => marketplaceCatalogBridgeApi.getMappingCoverage(),
  });
}

export function useBatchResolveOldToNew(ids: string[]) {
  return useQuery<BatchResolveResponse>({
    queryKey: ['marketplace-catalog-bridge', 'resolve', 'old-to-new', ids.sort().join(',')],
    queryFn: () => marketplaceCatalogBridgeApi.batchResolveOldToNew(ids),
    enabled: ids.length > 0,
  });
}

export function useBatchResolveNewToOld(ids: string[]) {
  return useQuery<BatchResolveResponse>({
    queryKey: ['marketplace-catalog-bridge', 'resolve', 'new-to-old', ids.sort().join(',')],
    queryFn: () => marketplaceCatalogBridgeApi.batchResolveNewToOld(ids),
    enabled: ids.length > 0,
  });
}

export function useUnifiedSearchBulk(queries: string[], limit?: number) {
  return useQuery<Record<string, { id: string; name: string; type: string; description?: string; parentName?: string; keywords?: string[] }[]>>({
    queryKey: ['marketplace-catalog-bridge', 'unified-search', 'bulk', queries.sort().join(','), limit],
    queryFn: () => marketplaceCatalogBridgeApi.unifiedSearchBulk(queries, limit),
    enabled: queries.length > 0,
  });
}

