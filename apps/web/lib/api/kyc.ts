import { apiClient } from './client';
import type { KYCSubmission, PaginatedResponse } from './types';

export interface GetKycSubmissionsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export function getKycSubmissions(params?: GetKycSubmissionsParams) {
  return apiClient.get<PaginatedResponse<KYCSubmission>>('/kyc', { params }).then(r => r.data);
}

export function reviewKyc(id: string, status: string, notes?: string) {
  return apiClient.patch<KYCSubmission>(`/kyc/${id}`, { status, notes }).then(r => r.data);
}
