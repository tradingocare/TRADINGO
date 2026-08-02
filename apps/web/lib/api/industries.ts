import { apiClient } from './client';

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    companies: number;
    products: number;
  };
}

export interface GetIndustriesParams {
  cursor?: string;
  limit?: number;
  search?: string;
}

export function getIndustries(params?: GetIndustriesParams) {
  return apiClient.get<{ data: Industry[]; meta: { total: number; limit: number; cursor?: string } }>('/industries', { params }).then(r => r.data);
}

export function getIndustry(slug: string) {
  return apiClient.get<Industry>(`/industries/${slug}`).then(r => r.data);
}
