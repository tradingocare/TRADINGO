import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface EnrichedCategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  depth: number;
  productCount: number;
  childCount: number;
  catalogCategory: { id: string; name: string; slug: string } | null;
  children: EnrichedCategoryNode[];
}

export interface EnrichedCategoryTreeResponse {
  roots: EnrichedCategoryNode[];
  catalogTree: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    sortOrder: number;
    subcategories: {
      id: string;
      categoryId: string;
      name: string;
      slug: string;
      itemCount: number;
    }[];
  }[];
}

export interface EnrichedCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  parent: { id: string; name: string; slug: string } | null;
  children: { id: string; name: string; slug: string; isActive: boolean; sortOrder: number }[];
  _count: { children: number; products: number };
  catalogCategory: { id: string; name: string; slug: string } | null;
}

export interface EnrichedProductResponse {
  id: string;
  companyId: string;
  categoryId: string | null;
  industryId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  productType: string;
  status: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  moq: number;
  unit: string | null;
  isFeatured: boolean;
  visibilityRadius: number | null;
  trustScoreSnapshot: number | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string } | null;
  industry: { id: string; name: string; slug: string } | null;
  company: { id: string; name: string; slug: string; trustScore: number; verificationLevel: string };
  inventory: { availableQuantity: number; stockStatus: string } | null;
  priceSlabs: { minQty: number; maxQty: number | null; price: number }[];
  media: { id: string; url: string; type: string; sortOrder: number }[];
  specifications: { key: string; value: string }[];
  catalogCategory: { id: string; name: string; type: string } | null;
}

export interface MappingCoverageResponse {
  totalOld: number;
  totalCatalog: number;
  mappedCount: number;
  unmappedOldCount: number;
  unmappedCatalogCount: number;
  coverage: number;
  mapped: { oldId: string; oldName: string; oldSlug: string; catalogId: string; catalogName: string }[];
  unmappedOld: { oldId: string; oldName: string; oldSlug: string }[];
  unmappedCatalog: { catalogId: string; catalogName: string; catalogSlug: string }[];
}

export interface BatchResolveResponse {
  resolved: { sourceId: string; sourceType: string; sourceName: string; targetId: string; targetName: string; confidence: number; matchType: string }[];
  unresolved: { id: string; name?: string }[];
  totalInput: number;
  resolvedCount: number;
  unresolvedCount: number;
}

export interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export interface SubcategoryItemsResponse {
  data: SubcategoryItem[];
  meta: { total: number; page: number; limit: number; subcategoryId: string; categoryId: string };
}

export interface CardSubcategoryPreview {
  subcategoryId: string;
  products: any[];
  productTotal: number;
  services: any[];
  status: 'ok' | 'error';
}

export interface CardPreviewResponse {
  previews: CardSubcategoryPreview[];
}

/** Pure slice selector: a column consumes only its own subcategory preview. */
export function selectSubPreview(
  data: CardPreviewResponse | null | undefined,
  subcategoryId: string,
): CardSubcategoryPreview | undefined {
  if (!data || !Array.isArray(data.previews)) return undefined;
  return data.previews.find(p => p?.subcategoryId === subcategoryId);
}

export const marketplaceCatalogBridgeApi = {
  getEnrichedTree: () =>
    apiClient.get<EnrichedCategoryTreeResponse>('/marketplace-catalog-bridge/categories/tree').then(r => r.data),

  listSubcategoryItems: (subcategoryId: string, page = 1, limit = 50) =>
    apiClient.get<SubcategoryItemsResponse>(`/marketplace-catalog-bridge/subcategories/${subcategoryId}/items`, { params: { page, limit } }).then(r => r.data),

  getEnrichedCategory: (id: string) =>
    apiClient.get<EnrichedCategoryResponse>(`/marketplace-catalog-bridge/categories/${id}`).then(r => r.data),

  getEnrichedProduct: (id: string) =>
    apiClient.get<EnrichedProductResponse>(`/marketplace-catalog-bridge/products/${id}`).then(r => r.data),

  searchEnrichedProducts: (params: { q?: string; categoryId?: string; brand?: string; catalogCategoryId?: string; catalogSubcategoryId?: string; catalogItemId?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/marketplace-catalog-bridge/products/search', { params }).then(r => {
      const response = r.data;
      return {
        data: (response.data || []).map((p: any) => ({
          ...p,
          price: p.priceSlabs?.[0]?.price || p.minPrice || 0,
          stock: p.inventory?.availableQuantity || 0,
        })),
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 20,
        totalPages: response.meta?.totalPages || 1,
      } as PaginatedResponse<EnrichedProductResponse & { price: number; stock: number }>;
    }),

  getMappingCoverage: () =>
    apiClient.get<MappingCoverageResponse>('/marketplace-catalog-bridge/coverage').then(r => r.data),

  batchResolveOldToNew: (ids: string[]) =>
    apiClient.get<BatchResolveResponse>('/marketplace-catalog-bridge/resolve/old-to-new', { params: { ids: ids.join(',') } }).then(r => r.data),

  batchResolveNewToOld: (ids: string[]) =>
    apiClient.get<BatchResolveResponse>('/marketplace-catalog-bridge/resolve/new-to-old', { params: { ids: ids.join(',') } }).then(r => r.data),

  unifiedSearchBulk: (queries: string[], limit?: number) =>
    apiClient.get<Record<string, { id: string; name: string; type: string; description?: string; parentName?: string; keywords?: string[] }[]>>(
      '/marketplace-catalog-bridge/unified-search/bulk',
      { params: { queries: queries.join(','), limit } }
    ).then(r => r.data),

  getCardPreviews: (subcategoryIds: string[]) =>
    apiClient.get<{ previews?: any[] }>('/marketplace-catalog-bridge/products/card-preview', {
      params: { catalogSubcategoryIds: subcategoryIds.join(',') },
    }).then(r => {
      const response = r.data as any;
      const previews = (response.previews || []).map((pr: any) => ({
        ...pr,
        // Same row mapping as searchEnrichedProducts (price/stock derivation).
        products: (pr.products || []).map((p: any) => ({
          ...p,
          price: p.priceSlabs?.[0]?.price || p.minPrice || 0,
          stock: p.inventory?.availableQuantity || 0,
        })),
      }));
      return { previews } as CardPreviewResponse;
    }),

  classifyCatalog: (input: ClassifyCatalogInput) =>
    apiClient.post<ClassifyCatalogResult>('/catalog/classify', input).then(r => r.data),
};

export interface ClassifyCatalogInput {
  name: string;
  description?: string;
  brand?: string;
  attributes?: Record<string, string>;
  imageUrl?: string;
  context?: 'product' | 'service';
}

export interface ClassifyAlternative {
  categoryId: string;
  subcategoryId: string | null;
  catalogItemId: string | null;
  label: string;
  confidence: number;
}

export interface ClassifyCatalogResult {
  categoryId: string | null;
  subcategoryId: string | null;
  catalogItemId: string | null;
  type: 'Product' | 'Service' | null;
  confidence: number;
  band: 'HIGH' | 'MEDIUM' | 'LOW';
  matchType: 'exact' | 'synonym' | 'ai' | 'fallback' | 'unclassified';
  reasons: string[];
  alternatives: ClassifyAlternative[];
  /** Display labels for the primary suggestion (names are display-only). */
  categoryName?: string | null;
  subcategoryName?: string | null;
}


