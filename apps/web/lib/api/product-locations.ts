import { apiClient } from './client';
import type { GeographicReach } from '@prisma/client';

export interface ProductWithLocation {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  visibilityRadius: GeographicReach | null;
  price: number | null;
  moq: number;
  createdAt: string;
  category: { id: string; name: string } | null;
  locationSet: boolean;
  indexedAt: string | null;
}

export interface PaginatedProductLocations {
  data: ProductWithLocation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CompanyAddress {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string | null;
  state: string;
  country: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface BulkUpdatePayload {
  productIds: string[];
  latitude: number;
  longitude: number;
  visibilityRadius?: GeographicReach;
}

export async function getSellerProductLocations(params?: {
  search?: string;
  status?: string;
  locationStatus?: 'set' | 'missing';
  page?: number;
  limit?: number;
}): Promise<PaginatedProductLocations> {
  const { data } = await apiClient.get<PaginatedProductLocations>('/product-locations/seller', { params });
  return data;
}

export async function bulkUpdateLocations(payload: BulkUpdatePayload): Promise<{ updated: number }> {
  const { data } = await apiClient.patch<{ updated: number }>('/product-locations/bulk', payload);
  return data;
}

export async function getCompanyAddress(): Promise<CompanyAddress | null> {
  const { data } = await apiClient.get<CompanyAddress | null>('/product-locations/company-address');
  return data;
}

export async function updateProductLocation(productId: string, payload: {
  latitude: number;
  longitude: number;
  visibilityRadius?: GeographicReach;
}): Promise<any> {
  const { data } = await apiClient.patch(`/product-locations/${productId}`, payload);
  return data;
}
