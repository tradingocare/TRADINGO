'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/smart-delivery';

export function useBuyerDeliveries(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['smart-delivery', 'buyer', status, page, limit],
    queryFn: () => api.fetchBuyerDeliveries(status, page, limit),
  });
}

export function useSellerDeliveries(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['smart-delivery', 'seller', status, page, limit],
    queryFn: () => api.fetchSellerDeliveries(status, page, limit),
  });
}

export function useDeliveryDetail(deliveryId: string) {
  return useQuery({
    queryKey: ['smart-delivery', deliveryId],
    queryFn: () => api.fetchDeliveryDetail(deliveryId),
    enabled: !!deliveryId,
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createDelivery>[0]) => api.createDelivery(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-delivery'] }),
  });
}

export function useConfirmDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, ...data }: { deliveryId: string; receiverName?: string; receiverMobile?: string; otpVerified?: boolean; digitalSignatureUrl?: string; photoUrls?: string; geoLatitude?: number; geoLongitude?: number; courierNotes?: string; buyerNotes?: string }) =>
      api.confirmDelivery(deliveryId, data),
    onSuccess: (_, { deliveryId }) => {
      qc.invalidateQueries({ queryKey: ['smart-delivery'] });
      qc.invalidateQueries({ queryKey: ['smart-delivery', deliveryId] });
    },
  });
}

export function useRejectDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, ...data }: { deliveryId: string; reason: string; note?: string }) =>
      api.rejectDelivery(deliveryId, data),
    onSuccess: (_, { deliveryId }) => {
      qc.invalidateQueries({ queryKey: ['smart-delivery'] });
      qc.invalidateQueries({ queryKey: ['smart-delivery', deliveryId] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, ...data }: { deliveryId: string; status: string; note?: string }) =>
      api.updateDeliveryStatus(deliveryId, data),
    onSuccess: (_, { deliveryId }) => {
      qc.invalidateQueries({ queryKey: ['smart-delivery'] });
      qc.invalidateQueries({ queryKey: ['smart-delivery', deliveryId] });
    },
  });
}

export function useDeliveryTimeline(deliveryId: string) {
  return useQuery({
    queryKey: ['smart-delivery', deliveryId, 'timeline'],
    queryFn: () => api.fetchDeliveryTimeline(deliveryId),
    enabled: !!deliveryId,
  });
}

export function useAdminDeliveryAnalytics() {
  return useQuery({
    queryKey: ['smart-delivery', 'admin', 'analytics'],
    queryFn: () => api.fetchAdminDeliveryAnalytics(),
  });
}

export function useAdminDeliveries(status?: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['smart-delivery', 'admin', 'all', status, page, limit],
    queryFn: () => api.fetchAdminDeliveries(status, page, limit),
  });
}
