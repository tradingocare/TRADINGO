import { useQuery } from '@tanstack/react-query';
import { searchProducts, type SearchProductsParams } from '@/lib/api/discovery';
import type { DiscoveryResponse, DiscoveryResult, SearchFilters } from '@/types/discovery';

function toParams(filters: SearchFilters): SearchProductsParams {
  return {
    q: filters.q || undefined,
    categoryId: filters.categoryId || undefined,
    subCategory: filters.subCategory || undefined,
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

export type { DiscoveryResponse, DiscoveryResult };
