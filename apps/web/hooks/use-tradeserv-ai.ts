import { useQuery, useMutation } from '@tanstack/react-query';
import { tradeservAiApi } from '@/lib/api/tradeserv-ai';

export function useAiProfileReview() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.profileReview(data) });
}

export function useAiGenerateBio() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.generateBio(data) });
}

export function useAiGenerateSeo() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.generateSeo(data) });
}

export function useAiPortfolioSuggestions() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.portfolioSuggestions(data) });
}

export function useAiServiceDescription() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.serviceDescription(data) });
}

export function useAiWriteProposal() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.writeProposal(data) });
}

export function useAiPricingSuggestions() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.pricingSuggestions(data) });
}

export function useAiSkillSuggestions() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.skillSuggestions(data) });
}

export function useAiCategorySuggestions() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => tradeservAiApi.categorySuggestions(data) });
}

export function useAiRecommendations(limit?: number) {
  return useQuery({
    queryKey: ['tradeserv-ai', 'recommendations', limit],
    queryFn: () => tradeservAiApi.getRecommendations(limit),
  });
}

export function useAiDashboardWidgets() {
  return useQuery({
    queryKey: ['tradeserv-ai', 'dashboard-widgets'],
    queryFn: () => tradeservAiApi.getDashboardWidgets(),
  });
}

export function useAiMarketplaceSuggestions() {
  return useQuery({
    queryKey: ['tradeserv-ai', 'marketplace-suggestions'],
    queryFn: () => tradeservAiApi.getMarketplaceSuggestions(),
  });
}

export function useAiGrowthSuggestions() {
  return useQuery({
    queryKey: ['tradeserv-ai', 'growth-suggestions'],
    queryFn: () => tradeservAiApi.getGrowthSuggestions(),
  });
}

export function useAiFounderInsights() {
  return useQuery({
    queryKey: ['tradeserv-ai', 'founder-insights'],
    queryFn: () => tradeservAiApi.getFounderInsights(),
  });
}

export function useAiMembershipBenefits() {
  return useQuery({
    queryKey: ['tradeserv-ai', 'membership-benefits'],
    queryFn: () => tradeservAiApi.getMembershipBenefits(),
  });
}

export function useAiTradTrustSuggestions() {
  return useQuery({
    queryKey: ['tradeserv-ai', 'tradtrust-suggestions'],
    queryFn: () => tradeservAiApi.getTradTrustSuggestions(),
  });
}

export function useAiGocashRewards() {
  return useQuery({
    queryKey: ['tradeserv-ai', 'gocash-rewards'],
    queryFn: () => tradeservAiApi.getGocashRewards(),
  });
}

export function useAiAnalyticsCards() {
  return useQuery({
    queryKey: ['tradeserv-ai', 'analytics-cards'],
    queryFn: () => tradeservAiApi.getAnalyticsCards(),
  });
}
