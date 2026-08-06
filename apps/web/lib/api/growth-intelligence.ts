import { apiClient } from '@/lib/api/client';

export interface AcquisitionFunnel {
  visitors: number;
  leads: number;
  conversionRate: number;
  stages: Array<{ label: string; count: number; dropOff: number }>;
}

export interface CampaignPerformance {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
  totalConversions: number;
  roi: number;
}

export interface ReferralConversion {
  totalCodes: number;
  totalUsages: number;
  successfulRewards: number;
  conversionRate: number;
  topReferrers: Array<{ userId: string; count: number; rewarded: number }>;
}

export interface LeadConversion {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  sourceBreakdown: Array<{ source: string; count: number; converted: number }>;
}

export interface TopLandingPage {
  url: string;
  visits: number;
  leads: number;
  conversionRate: number;
}

export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

export interface GrowthSummary {
  totalVisitors: number;
  totalLeads: number;
  totalReferrals: number;
  totalOrders: number;
  periodGrowth: number;
  topSources: Array<{ source: string; percentage: number }>;
}

export async function getAcquisitionFunnel(days = 30): Promise<AcquisitionFunnel> {
  const res = await apiClient.get(`/growth-intelligence/acquisition-funnel?days=${days}`);
  return res.data ?? res;
}

export async function getCampaignPerformance(days = 30): Promise<CampaignPerformance> {
  const res = await apiClient.get(`/growth-intelligence/campaign-performance?days=${days}`);
  return res.data ?? res;
}

export async function getReferralConversion(days = 30): Promise<ReferralConversion> {
  const res = await apiClient.get(`/growth-intelligence/referral-conversion?days=${days}`);
  return res.data ?? res;
}

export async function getLeadConversion(days = 30): Promise<LeadConversion> {
  const res = await apiClient.get(`/growth-intelligence/lead-conversion?days=${days}`);
  return res.data ?? res;
}

export async function getTopLandingPages(days = 30): Promise<TopLandingPage[]> {
  const res = await apiClient.get(`/growth-intelligence/top-landing-pages?days=${days}`);
  return res.data ?? res;
}

export async function getTrafficSources(days = 30): Promise<TrafficSource[]> {
  const res = await apiClient.get(`/growth-intelligence/traffic-sources?days=${days}`);
  return res.data ?? res;
}

export async function getGrowthSummary(days = 30): Promise<GrowthSummary> {
  const res = await apiClient.get(`/growth-intelligence/summary?days=${days}`);
  return res.data ?? res;
}

// ─── Extended Growth Intelligence API ──────────────────────

export interface CohortPeriod {
  period: string;
  users: number;
  retained: number;
  retentionRate: string;
}
export interface CohortData {
  cohort: string;
  periods: CohortPeriod[];
}
export interface RetentionAnalysis {
  overallRetentionRate: string;
  d7Retention: string;
  d30Retention: string;
  d90Retention: string;
  cohorts: CohortData[];
}
export interface LtvAnalysis {
  averageLtv: number;
  byCohort: Array<{ cohort: string; averageLtv: number; orderCount: number }>;
  byPlan: Array<{ plan: string; averageLtv: number; customerCount: number }>;
}
export interface CacAnalysis {
  totalAcquisitionCost: number;
  totalCustomers: number;
  averageCac: number;
  cacByChannel: Array<{ channel: string; cost: number; customers: number; cac: number }>;
  ltvCacRatio: number;
}
export interface AttributionChannel {
  channel: string;
  attributedRevenue: number;
  attributedOrders: number;
  percentage: string;
}
export interface AttributionModel {
  model: string;
  channels: AttributionChannel[];
}
export interface ChannelAttribution {
  firstTouch: AttributionModel;
  lastTouch: AttributionModel;
  linear: AttributionModel;
}
export interface GrowthKpis {
  newUsers: number;
  userGrowth: string;
  totalOrders: number;
  orderGrowth: string;
  revenue: number;
  revenueGrowth: string;
}

export async function getCohortAnalysis(months = 12): Promise<CohortData[]> {
  const res = await apiClient.get(`/growth-intelligence/cohort-analysis?months=${months}`);
  return res.data ?? res;
}
export async function getRetentionAnalysis(months = 12): Promise<RetentionAnalysis> {
  const res = await apiClient.get(`/growth-intelligence/retention?months=${months}`);
  return res.data ?? res;
}
export async function getLtvAnalysis(): Promise<LtvAnalysis> {
  const res = await apiClient.get('/growth-intelligence/ltv');
  return res.data ?? res;
}
export async function getCacAnalysis(): Promise<CacAnalysis> {
  const res = await apiClient.get('/growth-intelligence/cac');
  return res.data ?? res;
}
export async function getChannelAttribution(days = 90): Promise<ChannelAttribution> {
  const res = await apiClient.get(`/growth-intelligence/attribution?days=${days}`);
  return res.data ?? res;
}
export async function getGrowthKpis(days = 30): Promise<GrowthKpis> {
  const res = await apiClient.get(`/growth-intelligence/kpis?days=${days}`);
  return res.data ?? res;
}
export async function getFunnelAnalytics(days = 30): Promise<AcquisitionFunnel> {
  const res = await apiClient.get(`/growth-intelligence/funnel?days=${days}`);
  return res.data ?? res;
}
