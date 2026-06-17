import { apiClient } from './client';

export interface NearMeProduct {
  id: string;
  productId: string;
  companyId: string;
  categoryId: string | null;
  latitude: number;
  longitude: number;
  trustScore: number;
  price: number | null;
  moq: number;
  isVerified: boolean;
  isTradgo: boolean;
  deliveryEta: string | null;
  distanceKm: number;
  distanceLabel: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  unit: string | null;
  companyName: string;
  companySlug: string;
  categoryName: string | null;
  imageUrl: string | null;
}

export interface NearMeMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  center: { lat: number; lng: number };
  radiusKm: number;
}

export interface NearMeResponse {
  data: NearMeProduct[];
  meta: NearMeMeta;
}

export interface RadiusBreakdown {
  radius: number;
  label: string;
  count: number;
}

export interface CategoryCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  productCount: number;
}

export interface SellerSummary {
  id: string;
  name: string;
  slug: string;
  trustScore: number;
  verificationLevel: string;
  isTradgo: boolean;
  geographicReach: string | null;
  avgTrustScore: number;
  productCount: number;
  avgDistanceKm: number;
  distanceLabel: string;
}

export interface NearMeSearchParams {
  lat: number;
  lng: number;
  radius?: number;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minTrustScore?: number;
  verifiedOnly?: boolean;
  tradgoOnly?: boolean;
  maxMoq?: number;
  deliveryTime?: string;
  sort?: 'distance' | 'trust' | 'price_asc' | 'price_desc' | 'trending' | 'delivery';
  page?: number;
  limit?: number;
}

export async function searchProducts(params: NearMeSearchParams) {
  const query: Record<string, string> = {
    lat: params.lat.toString(),
    lng: params.lng.toString(),
    radius: (params.radius || 25).toString(),
    sort: params.sort || 'distance',
    page: (params.page || 1).toString(),
    limit: (params.limit || 20).toString(),
  };
  if (params.categoryId) query.categoryId = params.categoryId;
  if (params.subcategoryId) query.subcategoryId = params.subcategoryId;
  if (params.minPrice !== undefined) query.minPrice = params.minPrice.toString();
  if (params.maxPrice !== undefined) query.maxPrice = params.maxPrice.toString();
  if (params.minTrustScore !== undefined) query.minTrustScore = params.minTrustScore.toString();
  if (params.verifiedOnly) query.verifiedOnly = 'true';
  if (params.tradgoOnly) query.tradgoOnly = 'true';
  if (params.maxMoq !== undefined) query.maxMoq = params.maxMoq.toString();
  if (params.deliveryTime) query.deliveryTime = params.deliveryTime;

  const { data } = await apiClient.get<NearMeResponse>('/products/near-me', { params: query });
  return data;
}

export async function getCategories(lat: number, lng: number, radius?: number) {
  const params: Record<string, string> = {
    lat: lat.toString(),
    lng: lng.toString(),
    radius: (radius || 25).toString(),
  };
  const { data } = await apiClient.get<CategoryCount[]>('/products/near-me/categories', { params });
  return data;
}

export async function getSellers(
  lat: number,
  lng: number,
  radius?: number,
  filters?: { minTrustScore?: number; verifiedOnly?: boolean; tradgoOnly?: boolean },
) {
  const params: Record<string, string> = {
    lat: lat.toString(),
    lng: lng.toString(),
    radius: (radius || 25).toString(),
  };
  if (filters?.minTrustScore) params.minTrustScore = filters.minTrustScore.toString();
  if (filters?.verifiedOnly) params.verifiedOnly = 'true';
  if (filters?.tradgoOnly) params.tradgoOnly = 'true';
  const { data } = await apiClient.get<SellerSummary[]>('/products/near-me/sellers', { params });
  return data;
}

export async function getRadiusBreakdown(lat: number, lng: number) {
  const { data } = await apiClient.get<RadiusBreakdown[]>('/products/near-me/radius', {
    params: { lat: lat.toString(), lng: lng.toString() },
  });
  return data;
}
