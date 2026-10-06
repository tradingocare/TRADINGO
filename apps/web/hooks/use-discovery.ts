import { useQuery } from '@tanstack/react-query';
import { getDiscoveryFeed, searchProducts, type SearchProductsParams } from '@/lib/api/discovery';
import type { DiscoveryResponse, DiscoveryResult, SearchFilters } from '@/types/discovery';

function toParams(filters: SearchFilters): SearchProductsParams {
  return {
    q: filters.q || undefined,
    categoryId: filters.categoryId || undefined,
    subCategory: filters.subCategory || undefined,
    // P0-3 Step 8: canonical taxonomy filters (auto-resolved, user-removable)
    catalogCategoryId: filters.catalogCategoryId || undefined,
    catalogSubcategoryId: filters.catalogSubcategoryId || undefined,
    catalogItemId: filters.catalogItemId || undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minMoq: filters.minMoq,
    verified: filters.verified || undefined,
    topRated: filters.topRated || undefined,
    inStock: filters.inStock || undefined,
    fastResponse: filters.fastResponse || undefined,
    sellerType: filters.sellerType || undefined,
    sortBy: filters.sortBy === 'relevance' ? undefined : filters.sortBy,
    page: filters.page || 1,
    limit: filters.limit || 24,
    lat: filters.lat,
    lng: filters.lng,
    kmRadius: filters.kmRadius,
    city: filters.city || undefined,
    state: filters.state || undefined,
    geoScope: filters.geoScope === 'pan_india' ? undefined : filters.geoScope,
  };
}

export function useProductSearch(filters: SearchFilters) {
  const params = toParams(filters);
  return useQuery({
    queryKey: ['product-search', params],
    queryFn: () => searchProducts(params),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Shared discovery-feed query (G4-2 dedup).
 *
 * `TradingDiscoveryClient` (trading-discover, limit 50) and
 * `CategoriesSection` (directory-discover, limit 72) hit the identical
 * `GET /discover?page=1` endpoint — note `getDiscoveryFeed` clamps any
 * limit to 50 server-side, so both always received the same 50 rows
 * under different React Query keys. One shared key means one request;
 * consumers slice locally to their display count.
 */
export function useSharedDiscoveryFeed() {
  return useQuery({
    queryKey: ['shared-discovery-feed'],
    queryFn: () => getDiscoveryFeed(1, 50),
    staleTime: 120_000,
  });
}

export type { DiscoveryResponse, DiscoveryResult };
