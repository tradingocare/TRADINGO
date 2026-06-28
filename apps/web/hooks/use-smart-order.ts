'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/smart-order';

export function useBuyerOrders(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['smart-order', 'buyer', status, page, limit],
    queryFn: () => api.fetchBuyerOrders(status, page, limit),
  });
}

export function useSellerOrders(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['smart-order', 'seller', status, page, limit],
    queryFn: () => api.fetchSellerOrders(status, page, limit),
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['smart-order', orderId],
    queryFn: () => api.fetchOrderDetail(orderId),
    enabled: !!orderId,
  });
}

export function useCreateOrderFromPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) => api.createOrderFromPo(poId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smart-order'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: string; status: string; note?: string }) =>
      api.updateOrderStatus(orderId, status, note),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['smart-order'] });
      qc.invalidateQueries({ queryKey: ['smart-order', orderId] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...data }: { orderId: string; reason: string; reasonText?: string; note?: string }) =>
      api.cancelOrder(orderId, data),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['smart-order'] });
      qc.invalidateQueries({ queryKey: ['smart-order', orderId] });
    },
  });
}

export function useRequestReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...data }: { orderId: string; reason: string; description?: string; quantity?: number }) =>
      api.requestReturn(orderId, data),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['smart-order', orderId] });
    },
  });
}

export function useOrderTimeline(orderId: string) {
  return useQuery({
    queryKey: ['smart-order', orderId, 'timeline'],
    queryFn: () => api.fetchOrderTimeline(orderId),
    enabled: !!orderId,
  });
}

export function useOrderAnalytics() {
  return useQuery({
    queryKey: ['smart-order', 'analytics'],
    queryFn: () => api.fetchOrderAnalytics(),
  });
}

export function useAdminOrderAnalytics() {
  return useQuery({
    queryKey: ['smart-order', 'admin', 'analytics'],
    queryFn: () => api.fetchAdminOrderAnalytics(),
  });
}

export function useAdminOrders(status?: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['smart-order', 'admin', 'all', status, page, limit],
    queryFn: () => api.fetchAdminOrders(status, page, limit),
  });
}

export function useAdminOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['smart-order', 'admin', orderId],
    queryFn: () => api.fetchAdminOrderDetail(orderId),
    enabled: !!orderId,
  });
}
