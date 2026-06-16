import { apiClient } from './client';
import type { Quote, PaginatedResponse } from './types';

export interface GetQuotesParams {
  page?: number;
  limit?: number;
  status?: string;
  rfqId?: string;
}

export function getQuotes(params?: GetQuotesParams) {
  return apiClient.get<PaginatedResponse<Quote>>('/quotes', { params }).then(r => r.data);
}

export function getQuote(id: string) {
  return apiClient.get<Quote>(`/quotes/${id}`).then(r => r.data);
}

export function createQuote(data: Partial<Quote>) {
  return apiClient.post<Quote>('/quotes', data).then(r => r.data);
}

export function acceptQuote(companyId: string, rfqId: string, quoteId: string, comment?: string) {
  return apiClient.post<Quote>(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/accept`, { comment }).then(r => r.data);
}
