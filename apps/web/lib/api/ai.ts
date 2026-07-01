import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface AiSuggestion {
  id: string;
  productId: string;
  cacheType: string;
  prompt: string;
  response: Record<string, unknown>;
  model: string;
  accepted: boolean | null;
  createdAt: string;
}

export interface CatalogScore {
  id: string;
  productId: string;
  total: number;
  titleQuality: number;
  descriptionQuality: number;
  imageQuality: number;
  specificationQuality: number;
  seoQuality: number;
  categoryQuality: number;
  brandQuality: number;
  attributeQuality: number;
  completeness: number;
  recommendations: string[];
  lastCalculatedAt: string;
  product?: { id: string; name: string; slug: string; companyId: string; status: string; media?: { url: string }[] };
}

export interface HealthDashboard {
  totalProducts: number;
  scoredProducts: number;
  avgScore: number;
  avgTitleQuality: number;
  avgDescQuality: number;
  avgImageQuality: number;
  avgSpecQuality: number;
  avgSeoQuality: number;
  missingImages: number;
  missingSeo: number;
  missingSpecs: number;
  lowScoringProducts: number;
  duplicateRiskCount: number;
  translations: Array<{ locale: string; count: number }>;
}

export interface DuplicateResult {
  productId: string;
  productName: string;
  similarTo: string;
  confidence: string;
  reason: string;
}

export interface AiJob {
  id: string;
  productId: string;
  companyId: string;
  jobType: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string; slug: string };
}

export function generateDescription(data: { productId: string; specifications?: string[]; keyFeatures?: string[]; targetAudience?: string; tone?: string }) {
  return apiClient.post('/ai/products/generate-description', data).then(r => r.data);
}

export function generateSeo(data: { productId: string; targetKeyword?: string; additionalKeywords?: string[] }) {
  return apiClient.post('/ai/products/generate-seo', data).then(r => r.data);
}

export function translateProduct(data: { productId: string; targetLocale: string }) {
  return apiClient.post('/ai/products/translate', data).then(r => r.data);
}

export function suggestSpecs(data: { productId: string; category?: string }) {
  return apiClient.post('/ai/products/suggest-specs', data).then(r => r.data);
}

export function suggestImages(data: { productId: string }) {
  return apiClient.post('/ai/products/suggest-images', data).then(r => r.data);
}

export function updateSeo(productId: string, data: { metaTitle?: string; metaDescription?: string; focusKeywords?: string[] }) {
  return apiClient.patch(`/ai/products/${productId}/seo`, data).then(r => r.data);
}

export function getAiCache(productId: string, cacheType?: string) {
  const params = cacheType ? { cacheType } : undefined;
  return apiClient.get<AiSuggestion[]>(`/ai/products/${productId}/cache`, { params }).then(r => r.data);
}

export function acceptSuggestion(data: { cacheId: string; edits?: Record<string, unknown> }) {
  return apiClient.post('/ai/products/accept-suggestion', data).then(r => r.data);
}

export function calculateScore(productId: string) {
  return apiClient.post<CatalogScore>(`/ai/quality/calculate/${productId}`).then(r => r.data);
}

export function listScores(params?: { page?: number; limit?: number; minScore?: number; maxScore?: number; companyId?: string }) {
  return apiClient.get<PaginatedResponse<CatalogScore>>('/ai/quality/scores', { params }).then(r => r.data);
}

export function getScore(productId: string) {
  return apiClient.get<CatalogScore>(`/ai/quality/scores/${productId}`).then(r => r.data);
}

export function getQualityDashboard(params?: { companyId?: string }) {
  return apiClient.get<HealthDashboard>('/ai/quality/dashboard', { params }).then(r => r.data);
}

export function detectDuplicates(data: { productId?: string; companyId?: string }) {
  return apiClient.post<DuplicateResult[]>('/ai/quality/detect-duplicates', data).then(r => r.data);
}

export function bulkEnhance(data: { productIds: string[]; jobTypes: string[]; options?: Record<string, unknown> }) {
  return apiClient.post<{ jobsCreated: number; jobIds: string[] }>('/ai/bulk/enhance', data).then(r => r.data);
}

export function listBulkJobs(params?: { page?: number; limit?: number }) {
  return apiClient.get<PaginatedResponse<AiJob>>('/ai/bulk/jobs', { params }).then(r => r.data);
}

export function getBulkStats() {
  return apiClient.get<{ total: number; pending: number; processing: number; completed: number; failed: number }>('/ai/bulk/stats').then(r => r.data);
}
