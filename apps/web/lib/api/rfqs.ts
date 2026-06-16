import { apiClient } from './client';
import type { Rfq, PaginatedResponse } from './types';

export interface GetRfqsParams {
  page?: number;
  limit?: number;
  status?: string;
  companyId?: string;
  search?: string;
}

export function getRfqs(params?: GetRfqsParams) {
  return apiClient.get<PaginatedResponse<Rfq>>('/rfq', { params }).then(r => r.data);
}

export function getRfq(id: string) {
  return apiClient.get<Rfq>(`/rfq/${id}`).then(r => r.data);
}

export function createRfq(data: Partial<Rfq>) {
  return apiClient.post<Rfq>('/rfq', data).then(r => r.data);
}

export function updateRfq(id: string, data: Partial<Rfq>) {
  return apiClient.patch<Rfq>(`/rfq/${id}`, data).then(r => r.data);
}
