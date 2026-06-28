'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/smart-shipment';

export function useBuyerShipments(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['smart-shipment', 'buyer', status, page, limit],
    queryFn: () => api.fetchBuyerShipments(status, page, limit),
  });
}

export function useSellerShipments(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['smart-shipment', 'seller', status, page, limit],
    queryFn: () => api.fetchSellerShipments(status, page, limit),
  });
}

export function useShipmentDetail(shipmentId: string) {
  return useQuery({
    queryKey: ['smart-shipment', shipmentId],
    queryFn: () => api.fetchShipmentDetail(shipmentId),
    enabled: !!shipmentId,
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createShipment>[0]) => api.createShipment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['smart-shipment'] });
    },
  });
}

export function useAssignCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shipmentId, ...data }: { shipmentId: string; courierProviderId: string; trackingNumber: string; estimatedDeliveryDate?: string }) =>
      api.assignCourier(shipmentId, data),
    onSuccess: (_, { shipmentId }) => {
      qc.invalidateQueries({ queryKey: ['smart-shipment'] });
      qc.invalidateQueries({ queryKey: ['smart-shipment', shipmentId] });
    },
  });
}

export function useUpdateShipmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shipmentId, ...data }: { shipmentId: string; status: string; note?: string; location?: string }) =>
      api.updateShipmentStatus(shipmentId, data),
    onSuccess: (_, { shipmentId }) => {
      qc.invalidateQueries({ queryKey: ['smart-shipment'] });
      qc.invalidateQueries({ queryKey: ['smart-shipment', shipmentId] });
    },
  });
}

export function useShipmentTimeline(shipmentId: string) {
  return useQuery({
    queryKey: ['smart-shipment', shipmentId, 'timeline'],
    queryFn: () => api.fetchShipmentTimeline(shipmentId),
    enabled: !!shipmentId,
  });
}

export function useCourierProviders() {
  return useQuery({
    queryKey: ['smart-shipment', 'courier-providers'],
    queryFn: () => api.fetchCourierProviders(),
  });
}

export function useAddShipmentDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shipmentId, ...data }: { shipmentId: string; docType: string; fileName: string; fileUrl: string }) =>
      api.addShipmentDocument(shipmentId, data),
    onSuccess: (_, { shipmentId }) => {
      qc.invalidateQueries({ queryKey: ['smart-shipment', shipmentId, 'documents'] });
    },
  });
}

export function useAdminShipmentAnalytics() {
  return useQuery({
    queryKey: ['smart-shipment', 'admin', 'analytics'],
    queryFn: () => api.fetchAdminShipmentAnalytics(),
  });
}

export function useAdminShipments(status?: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['smart-shipment', 'admin', 'all', status, page, limit],
    queryFn: () => api.fetchAdminShipments(status, page, limit),
  });
}

export function useAdminShipmentDetail(shipmentId: string) {
  return useQuery({
    queryKey: ['smart-shipment', 'admin', shipmentId],
    queryFn: () => api.fetchAdminShipmentDetail(shipmentId),
    enabled: !!shipmentId,
  });
}
