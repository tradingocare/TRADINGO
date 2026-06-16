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
