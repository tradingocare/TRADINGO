import { apiClient } from './client';

export type CategoryMappingRelationType = 'EXACT' | 'RELATED' | 'ONE_TO_MANY';

export interface MappingTarget {
  catalogCategoryId: string;
  catalogSlug: string;
  relationType: CategoryMappingRelationType;
  confidence: number;
  isPrimary: boolean;
}

export interface ResolveMappingResponse {
  legacySlug: string;
  resolved: boolean;
  targets: MappingTarget[];
  primary: MappingTarget | null;
}

export interface BatchResolvedEntry {
  legacyCategoryId: string;
  legacyName?: string;
  targets: MappingTarget[];
  primary: MappingTarget | null;
}

export interface BatchResolveMappingsResponse {
  resolved: BatchResolvedEntry[];
  unresolved: { legacyCategoryId: string; legacyName?: string }[];
  totalInput: number;
  resolvedCount: number;
  unresolvedCount: number;
}

export interface ReverseMappingSource {
  legacyCategoryId: string;
  legacySlug: string;
  relationType: CategoryMappingRelationType;
  confidence: number;
  isPrimary: boolean;
}

export interface ReverseResolveResponse {
  catalogSlug: string;
  resolved: boolean;
  sources: ReverseMappingSource[];
  primary: ReverseMappingSource | null;
}

export function resolveCategoryMapping(legacySlug: string) {
  return apiClient
    .get<ResolveMappingResponse>('/category-mapping/resolve', { params: { legacySlug } })
    .then(r => r.data);
}

export function batchResolveCategoryMappings(ids: string[]) {
  return apiClient
    .post<BatchResolveMappingsResponse>('/category-mapping/resolve/batch', { ids })
    .then(r => r.data);
}

export function reverseResolveCategoryMapping(catalogSlug: string) {
  return apiClient
    .get<ReverseResolveResponse>('/category-mapping/resolve/reverse', { params: { catalogSlug } })
    .then(r => r.data);
}

/**
 * Phase 3C selection decision — the ONLY place a resolver response becomes a
 * UI selection. Defensive by construction:
 * - EXACT → primary target (or the single target) drives selection;
 * - RELATED / ONE_TO_MANY → never auto-selected (no supported UX yet);
 * - unresolved / malformed → null (clean browser, no fabrication).
 */
export function selectMappingTarget(
  response: ResolveMappingResponse | null | undefined,
): MappingTarget | null {
  if (!response || !response.resolved || !Array.isArray(response.targets)) return null;
  const exact = response.targets.filter(t => t?.relationType === 'EXACT');
  if (exact.length === 0) return null;
  return exact.find(t => t.isPrimary) ?? exact[0] ?? null;
}

/**
 * Phase 3N (UX Option A): RELATED targets are suggestion-only — never
 * auto-selected. The UI renders them as an explicit user choice.
 */
export function selectRelatedTargets(
  response: ResolveMappingResponse | null | undefined,
): MappingTarget[] {
  if (!response || !response.resolved || !Array.isArray(response.targets)) return [];
  return response.targets.filter(t => t?.relationType === 'RELATED');
}

/**
 * Phase 3P (UX Option A): ONE_TO_MANY chooser data. Returns ALL valid
 * targets in server order with NO selection, NO primary invention, and NO
 * auto-redirect semantics. The UI must render an explicit per-target choice;
 * even a single target must be explicitly chosen by the user.
 */
export function selectOneToManyTargets(
  response: ResolveMappingResponse | null | undefined,
): MappingTarget[] {
  if (!response || !response.resolved || !Array.isArray(response.targets)) return [];
  return response.targets.filter(t => t?.relationType === 'ONE_TO_MANY');
}
