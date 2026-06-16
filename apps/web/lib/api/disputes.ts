import { apiClient } from './client';
import type { Dispute, PaginatedResponse } from './types';

export interface GetDisputesParams {
  page?: number;
  limit?: number;
  status?: string;
}

export function getDisputes(params?: GetDisputesParams) {
  return apiClient.get<PaginatedResponse<Dispute>>('/disputes', { params }).then(r => r.data);
}

export function getDispute(id: string) {
  return apiClient.get<Dispute>(`/disputes/${id}`).then(r => r.data);
}

export function resolveDispute(id: string, data: Partial<Dispute>) {
  return apiClient.patch<Dispute>(`/disputes/${id}`, data).then(r => r.data);
}
