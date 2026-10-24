import { useQuery } from '@tanstack/react-query';
import { marketplaceCatalogBridgeApi } from '@/lib/api/marketplace-catalog-bridge';
import type { EnrichedCategoryTreeResponse, EnrichedCategoryResponse, EnrichedProductResponse, MappingCoverageResponse, BatchResolveResponse, CardPreviewResponse } from '@/lib/api/marketplace-catalog-bridge';
import type { PaginatedResponse } from '@/lib/api/types';
import { retryExcept429 } from '@/lib/query/retry-policy';

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

export function useEnrichedProductSearch(
  params: { q?: string; categoryId?: string; brand?: string; catalogCategoryId?: string; catalogSubcategoryId?: string; catalogItemId?: string; page?: number; limit?: number },
  enabled = true,
  // Phase 3E: subcategory previews opt out of 429 retries so throttled
  // preview fan-out never doubles. Default true preserves existing behavior
  // for final-result callers (context panel, rail, search page).
  options?: { retryOn429?: boolean },
) {
  const retryOn429 = options?.retryOn429 ?? true;
  return useQuery<PaginatedResponse<EnrichedProductResponse & { price: number; stock: number }>>({
    queryKey: ['marketplace-catalog-bridge', 'products', 'search', params],
    queryFn: () => marketplaceCatalogBridgeApi.searchEnrichedProducts(params),
    enabled,
    retry: retryOn429 ? undefined : retryExcept429,
  });
}

/**
 * Phase 3J: card-scoped aggregated previews. ONE request covers the whole
 * card's subcategory set (deduped + sorted for a deterministic cache key).
 * Same 30s preview freshness and same 429-no-retry policy as the per-sub
 * preview hooks it replaces. Final-result hooks are untouched.
 */
export function useCardPreviews(subcategoryIds: string[], enabled = true) {
  // Normalized inline each render (dedupe + sort); React Query hashes keys
  // structurally, so identity churn never refetches.
  const key = [...new Set((subcategoryIds ?? []).filter(Boolean))].sort();
  return useQuery<CardPreviewResponse>({
    queryKey: ['marketplace-catalog-bridge', 'products', 'card-preview', key],
    queryFn: () => marketplaceCatalogBridgeApi.getCardPreviews(key),
    enabled: enabled && key.length > 0,
    staleTime: 30_000,
    retry: retryExcept429,
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

