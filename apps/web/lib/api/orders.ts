import { apiClient } from './client';
import type { Order, PaginatedResponse } from './types';

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
}

export function getOrders(params?: GetOrdersParams) {
  return apiClient.get<PaginatedResponse<Order>>('/orders', { params }).then(r => r.data);
}

export function getOrder(id: string) {
  return apiClient.get<Order>(`/orders/${id}`).then(r => r.data);
}

export function updateOrderStatus(id: string, status: string) {
  return apiClient.patch<Order>(`/orders/${id}`, { status }).then(r => r.data);
}
