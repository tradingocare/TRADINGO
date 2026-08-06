import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMorningBrief, getEveningSummary, getExecutiveDashboard,
  getDecisionCenter, getRiskIntelligence, getGrowthIntelligence,
  getFounderCopilot, getHealthScore, getExecutivePriorities,
  getExecutiveTimeline, getExecutiveReport,
  getMarketplaceIntelligence, getTradeservIntelligence,
  getTradeTalkIntelligence, getMembershipIntelligence,
  getGocashIntelligence, getTradTrustIntelligence, getAdvertisingIntelligence,
  getSecurityIntelligence,
} from '@/lib/api/ai-founder'

export function useMorningBrief() {
  return useQuery({
    queryKey: ['founder-ai', 'morning-brief'],
    queryFn: () => getMorningBrief().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useEveningSummary() {
  return useQuery({
    queryKey: ['founder-ai', 'evening-summary'],
    queryFn: () => getEveningSummary().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useExecutiveDashboard() {
  return useQuery({
    queryKey: ['founder-ai', 'executive-dashboard'],
    queryFn: () => getExecutiveDashboard().then(r => r.data),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export function useDecisionCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data?: { focusArea?: string; context?: Record<string, unknown> }) =>
      getDecisionCenter(data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['founder-ai'] }),
  })
}

export function useRiskIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'risk-intelligence'],
    queryFn: () => getRiskIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useGrowthIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'growth-intelligence'],
    queryFn: () => getGrowthIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useFounderCopilot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { query: string; context?: Record<string, unknown> }) =>
      getFounderCopilot(data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['founder-ai'] }),
  })
}

export function useHealthScore() {
  return useQuery({
    queryKey: ['founder-ai', 'health-score'],
    queryFn: () => getHealthScore().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useExecutivePriorities() {
  return useQuery({
    queryKey: ['founder-ai', 'priorities'],
    queryFn: () => getExecutivePriorities().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useExecutiveTimeline() {
  return useQuery({
    queryKey: ['founder-ai', 'timeline'],
    queryFn: () => getExecutiveTimeline().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useExecutiveReport(type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') {
  return useQuery({
    queryKey: ['founder-ai', 'report', type],
    queryFn: () => getExecutiveReport(type).then(r => r.data),
    enabled: false,
  })
}

export function useMarketplaceIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'marketplace-intelligence'],
    queryFn: () => getMarketplaceIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useTradeservIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'tradeserv-intelligence'],
    queryFn: () => getTradeservIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useTradeTalkIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'tradetalk-intelligence'],
    queryFn: () => getTradeTalkIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useMembershipIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'membership-intelligence'],
    queryFn: () => getMembershipIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useGocashIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'gocash-intelligence'],
    queryFn: () => getGocashIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useTradTrustIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'tradtrust-intelligence'],
    queryFn: () => getTradTrustIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useAdvertisingIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'advertising-intelligence'],
    queryFn: () => getAdvertisingIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}

export function useSecurityIntelligence() {
  return useQuery({
    queryKey: ['founder-ai', 'security-intelligence'],
    queryFn: () => getSecurityIntelligence().then(r => r.data),
    refetchInterval: 300000,
    staleTime: 120000,
  })
}
