import { apiClient } from './client';
import type { Rfq, PaginatedResponse } from './types';

export interface GetRfqsParams {
  page?: number;
  limit?: number;
  status?: string;
  companyId?: string;
  search?: string;
}

// Batch B repair: these functions previously called bare `/rfq(/:id)` which has
// no backend route (404). The canonical public API family is `/smart-rfq`
// (smart-rfq.controller.ts): `GET /smart-rfq` lists the caller's own company
// RFQs and item routes are `/smart-rfq/:id`. Signatures are preserved so
// existing consumers (hooks/use-rfqs + dashboard widgets + list pages) are
// unchanged. The backend returns the standard envelope `{ data, meta }`; this
// lib maps it to the flat `PaginatedResponse` shape this client has always
// promised its consumers ({ data, total, ... }).
function toPaginated<T>(res: unknown): PaginatedResponse<T> {
  const body = res as { data?: T[]; meta?: Record<string, unknown> } & Partial<PaginatedResponse<T>>;
  if (Array.isArray(body?.data) && body?.meta) {
    return {
      data: body.data,
      total: Number(body.meta.total ?? body.data.length),
      page: Number(body.meta.page ?? 1),
      limit: Number(body.meta.limit ?? body.data.length),
      totalPages: Number(body.meta.totalPages ?? 1),
    };
  }
  return body as PaginatedResponse<T>;
}

export function getRfqs(params?: GetRfqsParams) {
  return apiClient.get('/smart-rfq', { params }).then(r => toPaginated<Rfq>(r.data));
}

// Role-scoped canonical lists (smart-rfq.controller.ts): admins use
// `GET /smart-rfq/admin/rfqs` (all RFQs), sellers use
// `GET /smart-rfq/seller/incoming` (RFQs matched to their company).
export function getAdminRfqs(params?: GetRfqsParams) {
  return apiClient.get('/smart-rfq/admin/rfqs', { params }).then(r => toPaginated<Rfq>(r.data));
}

export function getSellerIncomingRfqs(params?: GetRfqsParams) {
  return apiClient.get('/smart-rfq/seller/incoming', { params }).then(r => toPaginated<Rfq>(r.data));
}

export function getRfq(id: string) {
  return apiClient.get<Rfq>(`/smart-rfq/${id}`).then(r => r.data);
}

export function createRfq(data: Partial<Rfq>) {
  return apiClient.post<Rfq>('/smart-rfq', data).then(r => r.data);
}

export function updateRfq(id: string, data: Partial<Rfq>) {
  return apiClient.patch<Rfq>(`/smart-rfq/${id}`, data).then(r => r.data);
}
