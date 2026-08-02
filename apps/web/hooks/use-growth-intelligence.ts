import { useQuery } from '@tanstack/react-query';
import {
  getAcquisitionFunnel,
  getCampaignPerformance,
  getReferralConversion,
  getLeadConversion,
  getTopLandingPages,
  getTrafficSources,
  getGrowthSummary,
  getCohortAnalysis,
  getRetentionAnalysis,
  getLtvAnalysis,
  getCacAnalysis,
  getChannelAttribution,
  getGrowthKpis,
  getFunnelAnalytics,
} from '@/lib/api/growth-intelligence';

export function useAcquisitionFunnel(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'acquisition-funnel', days],
    queryFn: () => getAcquisitionFunnel(days),
    staleTime: 60_000,
  });
}

export function useCampaignPerformance(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'campaign-performance', days],
    queryFn: () => getCampaignPerformance(days),
    staleTime: 60_000,
  });
}

export function useReferralConversion(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'referral-conversion', days],
    queryFn: () => getReferralConversion(days),
    staleTime: 60_000,
  });
}

export function useLeadConversion(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'lead-conversion', days],
    queryFn: () => getLeadConversion(days),
    staleTime: 60_000,
  });
}

export function useTopLandingPages(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'top-landing-pages', days],
    queryFn: () => getTopLandingPages(days),
    staleTime: 60_000,
  });
}

export function useTrafficSources(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'traffic-sources', days],
    queryFn: () => getTrafficSources(days),
    staleTime: 60_000,
  });
}

export function useGrowthSummary(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'summary', days],
    queryFn: () => getGrowthSummary(days),
    staleTime: 60_000,
  });
}

// ─── Extended Growth Intelligence Hooks ────────────────────

export function useCohortAnalysis(months = 12) {
  return useQuery({
    queryKey: ['growth-intelligence', 'cohort-analysis', months],
    queryFn: () => getCohortAnalysis(months),
    staleTime: 120_000,
  });
}
export function useRetentionAnalysis(months = 12) {
  return useQuery({
    queryKey: ['growth-intelligence', 'retention', months],
    queryFn: () => getRetentionAnalysis(months),
    staleTime: 120_000,
  });
}
export function useLtvAnalysis() {
  return useQuery({
    queryKey: ['growth-intelligence', 'ltv'],
    queryFn: () => getLtvAnalysis(),
    staleTime: 300_000,
  });
}
export function useCacAnalysis() {
  return useQuery({
    queryKey: ['growth-intelligence', 'cac'],
    queryFn: () => getCacAnalysis(),
    staleTime: 300_000,
  });
}
export function useChannelAttribution(days = 90) {
  return useQuery({
    queryKey: ['growth-intelligence', 'attribution', days],
    queryFn: () => getChannelAttribution(days),
    staleTime: 120_000,
  });
}
export function useGrowthKpis(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'kpis', days],
    queryFn: () => getGrowthKpis(days),
    staleTime: 60_000,
  });
}
export function useFunnelAnalytics(days = 30) {
  return useQuery({
    queryKey: ['growth-intelligence', 'funnel', days],
    queryFn: () => getFunnelAnalytics(days),
    staleTime: 60_000,
  });
}
