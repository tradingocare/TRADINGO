import { apiClient } from './client';
import type { GocashEntry, PaginatedResponse } from './types';

export interface GetGocashHistoryParams {
  page?: number;
  limit?: number;
  type?: string;
}

export function getGocashBalance() {
  return apiClient.get<{ balance: number }>('/gocash/balance').then(r => r.data);
}

export function getGocashHistory(params?: GetGocashHistoryParams) {
  return apiClient.get<PaginatedResponse<GocashEntry>>('/gocash/history', { params }).then(r => r.data);
}
