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
  catalogCategory: { id: string; name: string; slug: string; confidence?: number; matchType?: string } | null;
  children: EnrichedCategoryNode[];
}

export interface EnrichedCategoryTreeResponse {
  roots: EnrichedCategoryNode[];
  catalogTree: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
    subcategories: {
      id: string;
      categoryId: string;
      name: string;
      slug: string;
      itemCount?: number;
    }[];
  }[];
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
  resolved: { sourceId: string; sourceType: string; sourceName: string; targetId?: string; targetName?: string; confidence?: number; matchType?: string }[];
  unresolved: { id: string; name?: string }[];
  totalInput: number;
  resolvedCount: number;
  unresolvedCount: number;
}