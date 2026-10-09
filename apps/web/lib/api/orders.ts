import type { Order, PaginatedResponse } from './types';
// Reuse the existing canonical smart-order client (lib/api/smart-order.ts →
// backend smart-order.controller.ts). Batch B repair: these functions
// previously called bare `/orders(/:id)` which has no backend route (404) and
// `PATCH /orders/:id` which likewise does not exist.
import {
  fetchBuyerOrders,
  fetchSellerOrders,
  fetchAdminOrders,
  fetchOrderDetail,
  updateOrderStatus as smartUpdateOrderStatus,
} from './smart-order';

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  role?: 'buyer' | 'seller' | 'admin';
}

// The smart-order endpoints return the same { data, meta } envelope the
// buyer/seller smart pages already consume; map it to the flat shape the
// legacy consumers of this lib expect (PaginatedResponse<Order>).
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

export async function getOrders(params?: GetOrdersParams) {
  const role = params?.role ?? 'buyer';
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const res = role === 'admin'
    ? fetchAdminOrders(params?.status, page, limit)
    : role === 'seller'
      ? fetchSellerOrders(params?.status, page, limit)
      : fetchBuyerOrders(params?.status, page, limit);
  return toPaginated<Order>(await res);
}

export async function getOrder(id: string) {
  return (await fetchOrderDetail(id)) as unknown as Order;
}

export async function updateOrderStatus(id: string, status: string) {
  return (await smartUpdateOrderStatus(id, status)) as unknown as Order;
}
