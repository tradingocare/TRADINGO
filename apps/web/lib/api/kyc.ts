import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface CompanyVerification {
  id: string;
  companyId: string;
  company?: { id: string; name: string; slug: string };
  level: string;
  status: string;
  submittedBy: string;
  submitter?: { id: string; email: string; name: string };
  documents: { id: string; documentType: string; status: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewer?: { id: string; name: string };
}

export interface GetKycSubmissionsParams {
  limit?: number;
  cursor?: string;
  status?: string;
}

export function getKycSubmissions(params?: GetKycSubmissionsParams) {
  return apiClient.get<PaginatedResponse<CompanyVerification>>('/company-verifications', { params }).then(r => r.data);
}

export function reviewKyc(id: string, status: string, notes?: string) {
  return apiClient.post<CompanyVerification>(`/company-verifications/${id}/review`, { status, notes }).then(r => r.data);
}
