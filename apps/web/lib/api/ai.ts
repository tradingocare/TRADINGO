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

// ─── P-3.3 AI Product Intelligence — New Endpoints ─────────────────

export interface HighlightsResponse {
  productId: string;
  highlights: string[];
  keySellingPoints: string[];
  tags: string[];
}

export interface TagsResponse {
  productId: string;
  tags: string[];
}

export interface HsnGstResponse {
  productId: string;
  hsnCode: string;
  gstRate: number;
  description: string;
}

export interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  minPrice: number | null;
  maxPrice: number | null;
  brand: string | null;
  similarity: number;
  matchReason: string;
}

export interface MetaKeywordsResponse {
  productId: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyphrase: string;
}

export function generateHighlights(data: { productId: string }) {
  return apiClient.post<HighlightsResponse>('/ai/products/generate-highlights', data).then(r => r.data);
}

export function generateTags(data: { productId: string; count?: number }) {
  return apiClient.post<TagsResponse>('/ai/products/generate-tags', data).then(r => r.data);
}

export function suggestHsnGst(data: { productId: string }) {
  return apiClient.post<HsnGstResponse>('/ai/products/suggest-hsn-gst', data).then(r => r.data);
}

export function suggestRelatedProducts(data: { productId: string; limit?: number }) {
  return apiClient.post<RelatedProduct[]>('/ai/products/suggest-related', data).then(r => r.data);
}

export function generateMetaKeywords(data: { productId: string }) {
  return apiClient.post<MetaKeywordsResponse>('/ai/products/generate-meta-keywords', data).then(r => r.data);
}

// ─── P-3.3 Commerce Intelligence ────────────────────────────────────

export interface SalesPotentialResponse {
  productId: string;
  productName: string;
  salesPotential: number;
  demandLevel: string;
  competitionLevel: string;
  competitorCount: number;
  categoryRfqCount: number;
  categoryOrderCount: number;
  inStock: boolean;
  estimatedMonthlyDemand: number;
}

export interface SuggestedPriceResponse {
  productId: string;
  currentPrice: number;
  suggestedPrice: number;
  avgCategoryPrice: number;
  medianCategoryPrice: number;
  suggestedMargin: number;
  pricePosition: string;
  competitorCount: number;
}

export interface DemandTrendResponse {
  productId: string;
  trend: string;
  rfqCount: number;
  orderCount: number;
  quoteCount: number;
  demandScore: number;
}

export interface CompetitionAnalysisResponse {
  productId: string;
  totalCompetitors: number;
  brandCount: number;
  avgCompetitorTrustScore: number;
  competitors: Array<{ id: string; name: string; brand: string | null; minPrice: number | null; companyName: string | null; trustScore: number | null }>;
  marketConcentration: string;
}

export interface SuggestedAdvertisingResponse {
  productId: string;
  suggestedDailyBudget: number;
  suggestedMonthlyBudget: number;
  suggestedKeywords: string[];
  competitionLevel: string;
  estimatedCpc: number;
}

export interface FullCommerceInsightsResponse {
  productId: string;
  salesPotential: SalesPotentialResponse | null;
  suggestedPricing: SuggestedPriceResponse | null;
  demandTrend: DemandTrendResponse | null;
  competitionAnalysis: CompetitionAnalysisResponse | null;
  suggestedAdvertising: SuggestedAdvertisingResponse | null;
  overallCommerceScore: number;
}

export function getSalesPotential(productId: string) {
  return apiClient.get<SalesPotentialResponse>(`/ai/commerce/sales-potential/${productId}`).then(r => r.data);
}

export function getSuggestedPrice(productId: string) {
  return apiClient.get<SuggestedPriceResponse>(`/ai/commerce/suggested-price/${productId}`).then(r => r.data);
}

export function getDemandTrend(productId: string) {
  return apiClient.get<DemandTrendResponse>(`/ai/commerce/demand-trend/${productId}`).then(r => r.data);
}

export function getCompetitionAnalysis(productId: string) {
  return apiClient.get<CompetitionAnalysisResponse>(`/ai/commerce/competition/${productId}`).then(r => r.data);
}

export function getSuggestedAdvertising(productId: string) {
  return apiClient.get<SuggestedAdvertisingResponse>(`/ai/commerce/advertising/${productId}`).then(r => r.data);
}

export function getFullCommerceInsights(productId: string) {
  return apiClient.get<FullCommerceInsightsResponse>(`/ai/commerce/full-insights/${productId}`).then(r => r.data);
}

// ─── P-3.3 Product Completeness ─────────────────────────────────────

export interface CompletenessField {
  name: string;
  status: 'present' | 'missing' | 'incomplete';
  importance: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface ProductCompletenessResponse {
  productId: string;
  productName: string;
  completionPercent: number;
  totalFields: number;
  presentFields: number;
  missingFields: number;
  incompleteFields: number;
  fields: CompletenessField[];
  grade: string;
}

export interface BulkCompletenessResponse {
  results: ProductCompletenessResponse[];
  total: number;
}

export function getProductCompleteness(productId: string) {
  return apiClient.get<ProductCompletenessResponse>(`/ai/completeness/${productId}`).then(r => r.data);
}

export function getBulkCompleteness(productIds: string[]) {
  return apiClient.post<BulkCompletenessResponse>('/ai/completeness/bulk', { productIds }).then(r => r.data);
}
