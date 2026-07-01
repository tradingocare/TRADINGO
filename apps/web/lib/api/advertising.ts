import { apiClient } from './client';

export type AdType =
  | 'SPONSORED_PRODUCT' | 'SPONSORED_COMPANY' | 'SPONSORED_CATEGORY'
  | 'HOMEPAGE_BANNER' | 'CATEGORY_BANNER' | 'SEARCH_KEYWORD_AD'
  | 'CITY_PROMOTION' | 'FEATURED_SELLER' | 'FEATURED_BRAND';

export type AdTargetType = 'COUNTRY' | 'STATE' | 'CITY' | 'CATEGORY' | 'PRODUCT' | 'KEYWORD' | 'INDUSTRY';
export type AdPricingModel = 'CPC' | 'CPM' | 'FIXED';
export type AdStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED';

export interface Advertisement {
  id: string;
  companyId: string;
  company?: { name: string };
  name: string;
  type: AdType;
  status: AdStatus;
  pricingModel: AdPricingModel;
  rate: number;
  dailyBudget: number;
  totalBudget: number;
  spentBudget: number;
  startDate: string;
  endDate: string;
  targetUrl: string;
  mediaUrl: string;
  title: string;
  description: string;
  ctaText: string;
  priority: number;
  maxImpressions: number;
  maxClicks: number;
  impressions: number;
  clicks: number;
  cpc?: number;
  cpm?: number;
  keyword?: string;
  city?: string;
  autoPause: boolean;
  autoResume: boolean;
  autoStop: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason: string | null;
  rejectedReason?: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  targets?: AdTarget[];
  _count?: { analytics: number };
}

export interface AdTarget {
  id: string;
  advertisementId: string;
  targetType: AdTargetType;
  targetValue: string;
}

export interface AdAnalyticsItem {
  id: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions?: number;
}

export interface AdAnalyticsSummary {
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  roi: number;
}

export interface AdAnalyticsResponse {
  summary: AdAnalyticsSummary;
  daily: AdAnalyticsItem[];
}

export interface AdDashboard {
  total: number;
  active: number;
  pending: number;
  paused: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalSpent: number;
  ctr: number;
  completed: number;
  byStatus: Array<{ status: string; _count: number }>;
  byType: Array<{ type: string; count: number }>;
}

export interface AdQueryParams {
  page?: number;
  limit?: number;
  status?: AdStatus;
  type?: AdType;
  search?: string;
  companyId?: string;
}

export interface CreateAdData {
  type: AdType;
  pricingModel: AdPricingModel;
  name?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  targetUrl?: string;
  mediaUrl?: string;
  dailyBudget?: number;
  totalBudget?: number;
  cpc?: number;
  cpm?: number;
  fixedPrice?: number;
  rate?: number;
  startDate: string;
  endDate: string;
  ctaText?: string;
  priority?: number;
  maxImpressions?: number;
  maxClicks?: number;
  autoPause?: boolean;
  autoResume?: boolean;
  autoStop?: boolean;
  productId?: string;
  categoryId?: string;
  keyword?: string;
  city?: string;
  brandId?: string;
  targets?: Array<{ targetType: AdTargetType; targetValue: string }>;
}

export interface UpdateAdData {
  name?: string;
  title?: string;
  description?: string;
  dailyBudget?: number;
  totalBudget?: number;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  ctaText?: string;
  priority?: number;
}

export function getMyAds(params?: AdQueryParams) {
  return apiClient.get<{ data: Advertisement[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean } }>('/advertising/my', { params }).then(r => r.data);
}

export function getMyAdStats() {
  return apiClient.get<AdDashboard>('/advertising/my/stats').then(r => r.data);
}

export function getAdById(id: string) {
  return apiClient.get<Advertisement>(`/advertising/${id}`).then(r => r.data);
}

export function createAd(data: CreateAdData) {
  return apiClient.post<Advertisement>('/advertising', data).then(r => r.data);
}

export function updateAd(id: string, data: UpdateAdData) {
  return apiClient.patch<Advertisement>(`/advertising/${id}`, data).then(r => r.data);
}

export function deleteAd(id: string) {
  return apiClient.delete(`/advertising/${id}`).then(r => r.data);
}

export function pauseAd(id: string) {
  return apiClient.post<Advertisement>(`/advertising/${id}/pause`).then(r => r.data);
}

export function resumeAd(id: string) {
  return apiClient.post<Advertisement>(`/advertising/${id}/resume`).then(r => r.data);
}

export function stopAd(id: string) {
  return apiClient.post<Advertisement>(`/advertising/${id}/stop`).then(r => r.data);
}

export function fundAd(id: string, amount: number) {
  return apiClient.post<{ success: boolean; transactionId: string; balance: number }>(`/advertising/${id}/fund`, { amount }).then(r => r.data);
}

export function getAdAnalytics(id: string) {
  return apiClient.get<AdAnalyticsResponse>(`/advertising/${id}/analytics`).then(r => r.data);
}

export function getPlacements(type: AdType, limit = 10) {
  return apiClient.get<Advertisement[]>('/advertising/placements', { params: { type, limit } }).then(r => r.data);
}

export function recordImpression(id: string) {
  return apiClient.post(`/advertising/${id}/impression`).then(r => r.data);
}

export function recordClick(id: string) {
  return apiClient.post(`/advertising/${id}/click`).then(r => r.data);
}

export function getAdminAds(params?: AdQueryParams) {
  return apiClient.get<{ data: Advertisement[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean } }>('/admin/advertising', { params }).then(r => r.data);
}

export function getAdminAdDashboard() {
  return apiClient.get<AdDashboard>('/admin/advertising/dashboard').then(r => r.data);
}

export function approveAd(id: string) {
  return apiClient.post(`/admin/advertising/${id}/approve`).then(r => r.data);
}

export function rejectAd(id: string, reason: string) {
  return apiClient.post(`/admin/advertising/${id}/reject`, { reason }).then(r => r.data);
}

export function getAdminAdById(id: string) {
  return apiClient.get<Advertisement>(`/admin/advertising/${id}`).then(r => r.data);
}

export function adminPauseAd(id: string) {
  return apiClient.post(`/admin/advertising/${id}/pause`).then(r => r.data);
}

export function adminResumeAd(id: string) {
  return apiClient.post(`/admin/advertising/${id}/resume`).then(r => r.data);
}
