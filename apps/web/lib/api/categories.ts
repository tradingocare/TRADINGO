import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface CategoryNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parent: { id: string; name: string; slug: string } | null;
  _count: { children: number; products: number; serviceMasters?: number };
  children?: CategoryNode[];
}

export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface GetCategoriesParams {
  cursor?: string;
  limit?: number;
  search?: string;
  isActive?: string;
}

export function getCategories(params?: GetCategoriesParams) {
  return apiClient
    .get<PaginatedResponse<CategoryNode> & { meta?: { total: number; limit: number; cursor?: string } }>('/categories', { params })
    .then(r => r.data);
}

export function getCategoryTree() {
  return apiClient.get<CategoryNode[]>('/categories/tree').then(r => r.data);
}

export function getCategory(slug: string) {
  return apiClient.get<CategoryNode>(`/categories/${slug}`).then(r => r.data);
}

export function getCategoryBreadcrumbs(slug: string) {
  return apiClient.get<CategoryBreadcrumb[]>(`/categories/${slug}/breadcrumbs`).then(r => r.data);
}
