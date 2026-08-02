import { useQuery } from '@tanstack/react-query';
import {
  getCategories,
  getCategoryTree,
  getCategory,
  getCategoryBreadcrumbs,
  type GetCategoriesParams,
} from '@/lib/api/categories';

export function useCategories(params?: GetCategoriesParams) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => getCategories(params),
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => getCategoryTree(),
    staleTime: 60_000,
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['categories', slug],
    queryFn: () => getCategory(slug),
    enabled: !!slug,
  });
}

export function useCategoryBreadcrumbs(slug: string) {
  return useQuery({
    queryKey: ['categories', slug, 'breadcrumbs'],
    queryFn: () => getCategoryBreadcrumbs(slug),
    enabled: !!slug,
  });
}
