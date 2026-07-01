import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface ReferralCode {
  id: string;
  code: string;
  userId: string;
  companyId: string | null;
  type: string;
  status: string;
  rewardAmount: number | null;
  rewardType: string | null;
  maxUsage: number;
  currentUsage: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface ReferralUsage {
  id: string;
  codeId: string;
  referrerUserId: string;
  refereeUserId: string | null;
  refereeEmail: string;
  status: string;
  source: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface ReferralReward {
  id: string;
  usageId: string;
  referrerUserId: string;
  refereeUserId: string | null;
  amount: number;
  type: string;
  status: string;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface ReferralStats {
  totalCodes: number;
  activeCodes: number;
  totalReferrals: number;
  rewardedCount: number;
  failedCount: number;
  totalRewardsEarned: number;
  codes: ReferralCode[];
}

export interface ReferralHistory {
  usages: ReferralUsage[];
  rewards: ReferralReward[];
  codes: ReferralCode[];
}

export interface ReferralDashboard {
  totalCodes: number;
  activeCodes: number;
  totalUsages: number;
  totalRewardsPaid: number;
  blacklistedEntries: number;
  topReferrers: Array<{ userId: string; _sum: { currentUsage: number } }>;
}

export interface FraudAlert {
  alerts: string[];
  details: {
    selfReferrals: string[];
    velocityAlerts: string[];
    circularAlerts: Array<{ referrer: string; referee: string }>;
  };
}

export function getMyReferralCode(type?: string) {
  const params = type ? { type } : {};
  return apiClient.get<ReferralCode>('/referrals/codes/my', { params }).then(r => r.data);
}

export function listMyReferralCodes() {
  return apiClient.get<ReferralCode[]>('/referrals/codes/my/all').then(r => r.data);
}

export function createReferralCode(data: { userId: string; type: string; companyId?: string; rewardAmount?: number; maxUsage?: number }) {
  return apiClient.post<ReferralCode>('/referrals/codes', data).then(r => r.data);
}

export function validateReferral(code: string, data?: { refereeEmail?: string; ipAddress?: string; deviceId?: string }) {
  return apiClient.post<{ valid: boolean; reason?: string }>('/referrals/validate', { code, ...data }).then(r => r.data);
}

export function getReferralHistory() {
  return apiClient.get<ReferralHistory>('/referrals/history').then(r => r.data);
}

export function getReferralStatistics() {
  return apiClient.get<ReferralStats>('/referrals/statistics').then(r => r.data);
}

export function getReferralAudit(usageId?: string) {
  const params = usageId ? { usageId } : {};
  return apiClient.get<unknown[]>('/referrals/audit', { params }).then(r => r.data);
}

export function getAdminDashboard() {
  return apiClient.get<ReferralDashboard>('/referrals/admin/dashboard').then(r => r.data);
}

export function getAdminReferrals(params?: { page?: number; limit?: number; search?: string }) {
  return apiClient.get<PaginatedResponse<ReferralUsage>>('/referrals/admin/referrals', { params }).then(r => r.data);
}

export function getFraudAlerts() {
  return apiClient.get<FraudAlert>('/referrals/admin/fraud-alerts').then(r => r.data);
}

export function getBlacklist() {
  return apiClient.get<Array<{ id: string; type: string; value: string; reason: string | null; createdAt: string }>>('/referrals/admin/blacklist').then(r => r.data);
}

export function addToBlacklist(data: { type: string; value: string; reason?: string }) {
  return apiClient.post('/referrals/admin/blacklist', data).then(r => r.data);
}

export function removeFromBlacklist(id: string) {
  return apiClient.delete(`/referrals/admin/blacklist/${id}`).then(r => r.data);
}
