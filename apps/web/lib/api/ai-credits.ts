import { apiClient } from './client';

export interface CreditBalance {
  total: number;
  used: number;
  remaining: number;
  planName: string;
  periodStart: string;
  periodEnd: string;
}

export interface CreditSummary {
  totalIssued: number;
  totalUsed: number;
  totalRemaining: number;
  topConsumers: Array<{ companyId: string; companyName: string; used: number }>;
}

export interface CompanyCreditDetail extends CreditBalance {
  monthlyHistory: Array<{ periodStart: string; used: number }>;
}

export function getMyCreditBalance() {
  return apiClient.get<CreditBalance>('/ai-gateway/credits/balance').then(r => r.data);
}

export function getCreditSummary() {
  return apiClient.get<CreditSummary>('/admin/ai-gateway/credits/summary').then(r => r.data);
}

export function getCompanyCreditDetail(companyId: string) {
  return apiClient.get<CompanyCreditDetail>(`/admin/ai-gateway/credits/company/${companyId}`).then(r => r.data);
}

export function resetCompanyCredits(companyId: string) {
  return apiClient.post<{ message: string; companyId: string }>(`/admin/ai-gateway/credits/reset/${companyId}`).then(r => r.data);
}
