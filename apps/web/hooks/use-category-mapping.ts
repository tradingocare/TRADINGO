import { useQuery } from '@tanstack/react-query';
import { resolveCategoryMapping } from '@/lib/api/category-mapping';

/**
 * Phase 3C: single-resolve hook for the legacy ?category= deep link.
 * One bounded request per distinct slug (long staleTime — mappings change
 * by admin approval, not by traffic). Canonical ?catalogCategory= URLs
 * never reach this hook (caller gates on absence of that param).
 */
export function useCategoryMappingResolve(legacySlug: string | null) {
  return useQuery({
    queryKey: ['category-mapping', 'resolve', legacySlug],
    queryFn: () => resolveCategoryMapping(legacySlug as string),
    enabled: !!legacySlug,
    staleTime: 1_800_000,
  });
}
