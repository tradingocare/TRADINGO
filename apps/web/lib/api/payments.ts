import { apiClient } from './client';
import type { Payment, PaginatedResponse } from './types';

export interface GetPaymentsParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export function getPayments(params?: GetPaymentsParams) {
  return apiClient.get<PaginatedResponse<Payment>>('/payments', { params }).then(r => r.data);
}

export function createPayment(data: Partial<Payment>) {
  return apiClient.post<Payment>('/payments', data).then(r => r.data);
}

export function releaseEscrow(escrowId: string) {
  return apiClient.post(`/escrow/${escrowId}/release`).then(r => r.data);
}
