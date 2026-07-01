import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  priority: number;
  startDate: string;
  endDate: string;
  budget: number;
  spentBudget: number;
  remainingBudget: number;
  maxRewards: number;
  dailyLimit: number;
  perUserLimit: number;
  perCompanyLimit: number;
  maxClaims: number;
  currentClaims: number;
  rewardAmount: number;
  rewardType: string;
  eligibility: Record<string, unknown> | null;
  targetAudience: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  companyId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rules?: CampaignRule[];
  targets?: CampaignTarget[];
  _count?: { claims: number };
}

export interface CampaignRule {
  id: string;
  campaignId: string;
  priority: number;
  conditionField: string;
  conditionOperator: string;
  conditionValue: Record<string, unknown>;
  actionType: string;
  actionValue: Record<string, unknown>;
  isActive: boolean;
}

export interface CampaignTarget {
  id: string;
  campaignId: string;
  targetType: string;
  targetId: string;
  isInclude: boolean;
}

export interface CampaignClaim {
  id: string;
  campaignId: string;
  userId: string;
  companyId: string | null;
  claimType: string;
  amount: number;
  status: string;
  transactionId: string | null;
  claimedAt: string;
  campaign?: { name: string; type: string; status: string };
}

export interface CampaignAnalytics {
  id: string;
  campaignId: string;
  date: string;
  claims: number;
  approved: number;
  rejected: number;
  paid: number;
  rewardAmount: number;
  uniqueUsers: number;
  conversionCount: number;
  conversionRate: number;
}

export interface CampaignDashboard {
  total: number;
  active: number;
  completed: number;
  draft: number;
  totalClaims: number;
  totalRewardsPaid: number;
  totalBudget: number;
  totalSpent: number;
  budgetUsageRate: number;
  byType: Array<{ type: string; _count: { id: number } }>;
}

export function getCampaigns(params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<Campaign>>('/campaigns', { params }).then(r => r.data);
}

export function getCampaign(id: string) {
  return apiClient.get<Campaign>(`/campaigns/${id}`).then(r => r.data);
}

export function createCampaign(data: Partial<Campaign>) {
  return apiClient.post<Campaign>('/campaigns', data).then(r => r.data);
}

export function updateCampaign(id: string, data: Partial<Campaign>) {
  return apiClient.patch<Campaign>(`/campaigns/${id}`, data).then(r => r.data);
}

export function deleteCampaign(id: string) {
  return apiClient.delete(`/campaigns/${id}`).then(r => r.data);
}

export function cloneCampaign(id: string) {
  return apiClient.post<Campaign>(`/campaigns/${id}/clone`).then(r => r.data);
}

export function pauseCampaign(id: string) {
  return apiClient.post<Campaign>(`/campaigns/${id}/pause`).then(r => r.data);
}

export function resumeCampaign(id: string) {
  return apiClient.post<Campaign>(`/campaigns/${id}/resume`).then(r => r.data);
}

export function archiveCampaign(id: string) {
  return apiClient.post<Campaign>(`/campaigns/${id}/archive`).then(r => r.data);
}

export function getActiveCampaigns() {
  return apiClient.get<Campaign[]>('/campaigns/active').then(r => r.data);
}

export function getCampaignsByType(type: string) {
  return apiClient.get<Campaign[]>(`/campaigns/by-type/${type}`).then(r => r.data);
}

export function checkEligibility(campaignId: string, companyId?: string) {
  return apiClient.post<{ eligible: boolean; reason?: string }>('/campaigns/check-eligibility', { campaignId, companyId }).then(r => r.data);
}

export function claimReward(data: { campaignId: string; companyId?: string; claimType?: string; metadata?: Record<string, unknown> }) {
  return apiClient.post<CampaignClaim>('/campaigns/claim', data).then(r => r.data);
}

export function getMyClaims() {
  return apiClient.get<CampaignClaim[]>('/campaigns/my-claims').then(r => r.data);
}

export function getAdminCampaignDashboard() {
  return apiClient.get<CampaignDashboard>('/campaigns/admin/dashboard').then(r => r.data);
}

export function getSellerCampaigns() {
  return apiClient.get<Campaign[]>('/campaigns/seller').then(r => r.data);
}

export function getCampaignAnalytics(id: string) {
  return apiClient.get<CampaignAnalytics[]>(`/campaigns/${id}/analytics`).then(r => r.data);
}

export function evaluateRules(id: string, context: Record<string, unknown>) {
  return apiClient.post<{ matched: boolean; actions: Array<{ actionType: string; actionValue: unknown }> }>(`/campaigns/${id}/evaluate-rules`, context).then(r => r.data);
}
