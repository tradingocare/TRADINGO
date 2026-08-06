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

export function submitQuote(companyId: string, rfqId: string, quoteId: string) {
  return apiClient.post<Quote>(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/submit`).then(r => r.data);
}

export function withdrawQuote(companyId: string, rfqId: string, quoteId: string, reason?: string) {
  return apiClient.post<Quote>(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/withdraw`, { reason }).then(r => r.data);
}

export function reviseQuote(companyId: string, rfqId: string, quoteId: string, data: Record<string, unknown>) {
  return apiClient.post<Quote>(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}/revise`, data).then(r => r.data);
}

export function updateQuote(companyId: string, rfqId: string, quoteId: string, data: Record<string, unknown>) {
  return apiClient.patch<Quote>(`/companies/${companyId}/rfq/${rfqId}/quotes/${quoteId}`, data).then(r => r.data);
}
