import { apiClient } from './client';

export interface EnterpriseSearchDto {
  q: string;
  entityTypes?: string[];
  brandCountry?: string;
  attributeType?: string;
  page?: number;
  limit?: number;
  useSynonyms?: boolean;
  useAi?: boolean;
}

export interface SearchMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  synonymExpanded: boolean;
  latencyMs: number;
  expandedQuery: string | null;
}

export interface EnterpriseSearchResult {
  data: Record<string, unknown>[];
  meta: SearchMeta;
  byEntity: Record<string, { total: number }>;
}

export interface AutocompleteSuggestion {
  text: string;
  type: string;
  slug: string;
}

export interface SuggestionResult {
  trending: { text: string; count: number; source: string }[];
  recent: { text: string; source: string; timestamp: string }[];
}

export interface SearchAnalyticsSummary {
  totalSearches: number;
  uniqueQueries: number;
  zeroResultSearches: number;
  zeroResultRate: number;
  entityBreakdown: { entityType: string; count: number }[];
  topQueries: PopularItem[];
  zeroResultQueries: PopularItem[];
}

export interface IndexHealth {
  indices: Record<string, { exists: boolean }>;
  allExist: boolean;
  totalIndices: number;
  healthyIndices: number;
}

export interface ReindexResult {
  [index: string]: number;
}

export interface PopularItem {
  query: string;
  count: number;
}

export function enterpriseSearch(data: EnterpriseSearchDto) {
  return apiClient.post('/enterprise-catalog/search', data).then(r => r.data);
}

export function enterpriseAutocomplete(q: string, limit?: number) {
  return apiClient.get('/enterprise-catalog/search/autocomplete', { params: { q, limit } }).then(r => r.data);
}

export function enterpriseSuggestions(limit?: number, entityType?: string, recentLimit?: number) {
  return apiClient.get('/enterprise-catalog/search/suggestions', { params: { limit, entityType, recentLimit } }).then(r => r.data);
}

export function reindexEnterpriseSearch(indices?: string[]) {
  return apiClient.post('/enterprise-catalog/search/reindex', { indices }).then(r => r.data);
}

export function getEnterpriseSearchHealth(indices?: string[]) {
  return apiClient.get('/enterprise-catalog/search/health', { params: { indices } }).then(r => r.data);
}

export function getEnterpriseSearchAnalyticsSummary(days?: number) {
  return apiClient.get('/enterprise-catalog/search/analytics/summary', { params: { days } }).then(r => r.data);
}

export function getEnterpriseTopQueries(entityType?: string, days?: number, limit?: number) {
  return apiClient.get('/enterprise-catalog/search/analytics/top-queries', { params: { entityType, days, limit } }).then(r => r.data);
}

export function getEnterpriseZeroResultQueries(entityType?: string, days?: number, limit?: number) {
  return apiClient.get('/enterprise-catalog/search/analytics/zero-results', { params: { entityType, days, limit } }).then(r => r.data);
}

export function getEnterprisePopularBrands(days?: number, limit?: number) {
  return apiClient.get('/enterprise-catalog/search/analytics/popular-brands', { params: { days, limit } }).then(r => r.data);
}

export function getEnterprisePopularCategories(days?: number, limit?: number) {
  return apiClient.get('/enterprise-catalog/search/analytics/popular-categories', { params: { days, limit } }).then(r => r.data);
}

export function getEnterprisePopularAttributes(days?: number, limit?: number) {
  return apiClient.get('/enterprise-catalog/search/analytics/popular-attributes', { params: { days, limit } }).then(r => r.data);
}
