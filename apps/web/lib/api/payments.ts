import { apiClient } from './client';
import type { Payment, PaginatedResponse } from './types';

export interface GetPaymentsParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

// Batch B repair: these functions previously called bare `/payments` (404 — no
// backend route exists at that path) and `POST /escrow/:id/release` (no HTTP
// release route exists; escrow release happens internally via the
// payment/booking orchestration and the smart-delivery confirmation flow).
//
// The canonical public API family is `companies/:companyId/payments`
// (payment.controller.ts): `GET` lists company payments and `GET :id` returns
// one. The company id resolves via the existing `GET /companies/my-company`
// endpoint (same pattern used by seller/profile, seller/reviews, seller/settings).
// The backend list returns `{ data, meta: { total, limit, cursor } }`; this lib
// maps it to the flat shape its consumers expect.
async function resolveMyCompanyId(): Promise<string> {
  const res = await apiClient.get('/companies/my-company');
  const company = (res.data as any)?.data ?? res.data;
  return company?.id as string;
}

function toPaginated<T>(res: unknown): PaginatedResponse<T> {
  const body = res as { data?: T[]; meta?: Record<string, unknown> } & Partial<PaginatedResponse<T>>;
  if (Array.isArray(body?.data) && body?.meta) {
    return {
      data: body.data,
      total: Number(body.meta.total ?? body.data.length),
      page: Number(body.meta.page ?? 1),
      limit: Number(body.meta.limit ?? body.data.length),
      totalPages: Number(body.meta.totalPages ?? Math.ceil(Number(body.meta.total ?? body.data.length) / Math.max(1, Number(body.meta.limit ?? body.data.length)))),
    };
  }
  return body as PaginatedResponse<T>;
}

export async function getPayments(params?: GetPaymentsParams) {
  const companyId = await resolveMyCompanyId();
  return apiClient
    .get(`/companies/${companyId}/payments`, { params: { limit: params?.limit ?? 20 } })
    .then(r => toPaginated<Payment>(r.data));
}

export async function getPayment(id: string) {
  const companyId = await resolveMyCompanyId();
  return apiClient.get<Payment>(`/companies/${companyId}/payments/${id}`).then(r => r.data);
}
