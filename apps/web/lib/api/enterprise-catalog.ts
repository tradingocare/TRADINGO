import { apiClient } from './client';

export interface GlobalBrand {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  manufacturer: string | null;
  country: string | null;
  logo: string | null;
  website: string | null;
  description: string | null;
  verificationStatus: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalAttribute {
  id: string;
  name: string;
  slug: string;
  label: string | null;
  type: string;
  unit: string | null;
  options: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CatalogSynonym {
  id: string;
  term: string;
  synonyms: string[];
  locale: string;
  isActive: boolean;
  createdAt: string;
}

export interface IndustryCategoryMapping {
  id: string;
  industryId: string;
  categoryId: string;
  description: string | null;
  isActive: boolean;
  industry?: { id: string; name: string; slug: string };
  category?: { id: string; name: string; slug: string };
}

export interface CatalogDashboard {
  categories: { total: number; active: number };
  brands: { total: number; verified: number };
  attributes: { total: number };
  synonyms: { total: number };
  industryMappings: { total: number };
  products: { total: number; pendingApprovals: number; missingImages: number; missingSeo: number };
  quality: { avgScore: number; scoredProducts: number };
  imports: { totalJobs: number };
}

// Brands
export function getBrands(params?: { search?: string; verificationStatus?: string; isActive?: boolean }) {
  return apiClient.get('/enterprise-catalog/brands', { params }).then(r => r.data);
}

export function getBrand(id: string) {
  return apiClient.get(`/enterprise-catalog/brands/${id}`).then(r => r.data);
}

export function getBrandBySlug(slug: string) {
  return apiClient.get(`/enterprise-catalog/brands/slug/${slug}`).then(r => r.data);
}

export function createBrand(data: any) {
  return apiClient.post('/enterprise-catalog/brands', data).then(r => r.data);
}

export function updateBrand(id: string, data: any) {
  return apiClient.patch(`/enterprise-catalog/brands/${id}`, data).then(r => r.data);
}

export function deleteBrand(id: string) {
  return apiClient.delete(`/enterprise-catalog/brands/${id}`);
}

export function verifyBrand(id: string) {
  return apiClient.post(`/enterprise-catalog/brands/${id}/verify`).then(r => r.data);
}

// Attributes
export function getAttributes(params?: { search?: string; type?: string; isActive?: boolean }) {
  return apiClient.get('/enterprise-catalog/attributes', { params }).then(r => r.data);
}

export function getAttribute(id: string) {
  return apiClient.get(`/enterprise-catalog/attributes/${id}`).then(r => r.data);
}

export function getAttributeBySlug(slug: string) {
  return apiClient.get(`/enterprise-catalog/attributes/slug/${slug}`).then(r => r.data);
}

export function getAttributeTypes() {
  return apiClient.get('/enterprise-catalog/attributes/types').then(r => r.data);
}

export function createAttribute(data: any) {
  return apiClient.post('/enterprise-catalog/attributes', data).then(r => r.data);
}

export function updateAttribute(id: string, data: any) {
  return apiClient.patch(`/enterprise-catalog/attributes/${id}`, data).then(r => r.data);
}

export function deleteAttribute(id: string) {
  return apiClient.delete(`/enterprise-catalog/attributes/${id}`);
}

// Taxonomy
export function getSynonyms(search?: string, locale?: string) {
  return apiClient.get('/enterprise-catalog/taxonomy/synonyms', { params: { search, locale } }).then(r => r.data);
}

export function getSynonym(id: string) {
  return apiClient.get(`/enterprise-catalog/taxonomy/synonyms/${id}`).then(r => r.data);
}

export function createSynonym(data: { term: string; synonyms: string[]; locale?: string }) {
  return apiClient.post('/enterprise-catalog/taxonomy/synonyms', data).then(r => r.data);
}

export function updateSynonym(id: string, data: any) {
  return apiClient.patch(`/enterprise-catalog/taxonomy/synonyms/${id}`, data).then(r => r.data);
}

export function deleteSynonym(id: string) {
  return apiClient.delete(`/enterprise-catalog/taxonomy/synonyms/${id}`);
}

export function getIndustryCategoryMappings(industryId?: string, categoryId?: string) {
  return apiClient.get('/enterprise-catalog/taxonomy/industry-category-mappings', { params: { industryId, categoryId } }).then(r => r.data);
}

export function createIndustryCategoryMapping(data: { industryId: string; categoryId: string; description?: string }) {
  return apiClient.post('/enterprise-catalog/taxonomy/industry-category-mappings', data).then(r => r.data);
}

export function deleteIndustryCategoryMapping(id: string) {
  return apiClient.delete(`/enterprise-catalog/taxonomy/industry-category-mappings/${id}`);
}

// Admin
export function getCatalogDashboard() {
  return apiClient.get('/enterprise-catalog/admin/dashboard').then(r => r.data);
}

export function getCatalogTaxonomyTree() {
  return apiClient.get('/enterprise-catalog/admin/taxonomy-tree').then(r => r.data);
}
