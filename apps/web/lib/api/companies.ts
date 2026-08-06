import { apiClient } from './client';
import type { Company, PaginatedResponse } from './types';

export interface GetCompaniesParams {
  page?: number;
  limit?: number;
  status?: string;
  verificationStatus?: string;
  search?: string;
}

export function getCompanies(params?: GetCompaniesParams) {
  return apiClient.get<PaginatedResponse<Company>>('/companies', { params }).then(r => r.data);
}

export function getCompany(id: string) {
  return apiClient.get<Company>(`/companies/${id}`).then(r => r.data);
}

export function updateCompany(id: string, data: Partial<Company>) {
  return apiClient.patch<Company>(`/companies/${id}`, data).then(r => r.data);
}

export interface DirectoryCompany {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  businessType: string | null;
  verificationLevel: string;
  trustScore: number;
  totalProducts: number;
  rating: number;
  reviewCount: number;
  orderCount: number;
  responseRate: number;
  onTimeDelivery?: number;
  responseTime?: string;
  gstNumber?: string | null;
  establishedYear?: number | null;
  isoCertified?: boolean;
  productCount?: number;
  yearsActive?: number;
  categories: string[];
  city: string | null;
  state: string | null;
  isTradgoElite: boolean;
  isVerified: boolean;
}

export interface DirectoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DirectoryStats {
  totalCompanies: number;
  verifiedCompanies: number;
  eliteCompanies: number;
  totalCities: number;
  totalProducts: number;
  averageRating: number | null;
}

export interface DirectoryResponse {
  companies: DirectoryCompany[];
  pagination: DirectoryPagination;
  stats: DirectoryStats;
}

export async function getCompanyDirectory(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const res: any = await apiClient.get(`/companies/directory?${query}`);
  const raw = res.data;
  const d: any = raw?.data ?? raw;
  return {
    companies: d?.companies ?? [],
    pagination: d?.pagination ?? { page: 1, limit: 24, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    stats: d?.stats ?? { totalCompanies: 0, verifiedCompanies: 0, eliteCompanies: 0, totalCities: 0, totalProducts: 0, averageRating: null },
  } as DirectoryResponse;
}

export interface CompanyProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  unit?: string | null;
  moq?: number;
  monthlyOrders?: number;
  media?: { id: string; url: string; type: string }[];
  category?: { id: string; name: string; slug: string } | null;
}

export interface CompanyProductsResponse {
  products: CompanyProduct[];
  pagination: { total: number; page: number; limit: number; pages: number; hasNext: boolean };
}

export function getCompanyProducts(slug: string, params: { page?: number; limit?: number } = {}) {
  return apiClient.get<CompanyProductsResponse>(`/companies/${slug}/products`, { params }).then(r => r.data);
}

export interface SimilarCompany {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  city: string;
  state: string;
  trustScore: number;
  isVerified: boolean;
  categories: string[];
  productCount: number;
}

export function getCompanySimilar(slug: string) {
  return apiClient.get<SimilarCompany[]>(`/companies/${slug}/similar`).then(r => r.data);
}
