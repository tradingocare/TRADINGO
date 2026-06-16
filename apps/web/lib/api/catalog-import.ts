import { apiClient } from './client';

export type ImportJobType = 'CATEGORY' | 'SUBCATEGORY' | 'PRODUCT_MASTER' | 'SERVICE_MASTER';
export type ImportJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'ROLLING_BACK' | 'ROLLED_BACK';
export type ImportRowStatus = 'PENDING' | 'VALID' | 'INVALID' | 'IMPORTED' | 'SKIPPED' | 'DUPLICATE' | 'ERROR' | 'ROLLED_BACK';

export interface ImportStatsResponse {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  totalCategories: number;
  totalSubcategories: number;
  totalProducts: number;
  totalServices: number;
}

export interface ImportJobResponse {
  id: string;
  type: ImportJobType;
  status: ImportJobStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  skippedRows: number;
  duplicateRows: number;
  errorRows: number;
  summary: Record<string, unknown> | null;
  errorLog: string | null;
  fileName: string | null;
  createdAt: string;
  completedAt: string | null;
  startedAt: string | null;
  rolledBackAt: string | null;
  rows?: ImportJobRowResponse[];
}

export interface ImportJobRowResponse {
  id: string;
  importJobId: string;
  rowNumber: number;
  status: ImportRowStatus;
  entityType: string | null;
  entityId: string | null;
  errors: string[];
  warnings: string[];
  createdAt: string;
}

export interface ImportJobListResponse {
  jobs: ImportJobResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface StartImportDto {
  type: ImportJobType | 'ALL';
  fileUrl?: string;
  data?: Record<string, unknown>[];
}

export interface SearchCatalogDto {
  q: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface SearchCatalogResponse {
  products: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    status: string;
    unit: string | null;
  }[];
  services: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    status: string;
    unit: string | null;
  }[];
  total: number;
}

export function getImportStats() {
  return apiClient.get<ImportStatsResponse>('/catalog-import/stats').then((r) => r.data);
}

export function getImportJobs(page = 1, limit = 20) {
  return apiClient.get<ImportJobListResponse>('/catalog-import/jobs', { params: { page, limit } }).then((r) => r.data);
}

export function getImportJob(id: string) {
  return apiClient.get<ImportJobResponse>(`/catalog-import/jobs/${id}`).then((r) => r.data);
}

export function startImport(data: StartImportDto) {
  return apiClient.post<ImportJobResponse>('/catalog-import/start', data).then((r) => r.data);
}

export function rollbackImport(id: string) {
  return apiClient.post<ImportJobResponse>(`/catalog-import/jobs/${id}/rollback`).then((r) => r.data);
}

export function retryImport(id: string) {
  return apiClient.post<ImportJobResponse>(`/catalog-import/jobs/${id}/retry`).then((r) => r.data);
}

export function searchCatalog(params: SearchCatalogDto) {
  return apiClient.get<SearchCatalogResponse>('/catalog-import/search', { params }).then((r) => r.data);
}
