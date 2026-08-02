import { apiClient } from './client';

export interface AiTradeservResponse<T = unknown> {
  success: boolean;
  content?: T;
  data?: T;
}

export interface DashboardWidgetsData {
  profileCompletion: number;
  trustScore: number | null;
  trustGrade: string | null;
  servicesCount: number;
  portfolioCount: number;
  certificationsCount: number;
  languagesCount: number;
  serviceAreasCount: number;
}

export interface GrowthSuggestion {
  area: string;
  suggestion: string;
  impact: string;
}

export interface TradTrustSuggestionsData {
  score: number | null;
  grade?: string;
  riskLevel?: string;
  suggestions: Array<{ factor: string; score: number; maxScore: number; tip: string }>;
}

export interface MembershipBenefitsData {
  plan: string | null;
  status: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  benefits: Array<{ name: string; available: boolean; limit?: string }>;
}

export interface GocashRewardsData {
  balance: { toString: () => string } | number;
  available: { toString: () => string } | number;
  kycVerified: boolean;
  isActive: boolean;
  earningOpportunities: Array<{ action: string; reward: string }>;
}

export interface FounderInsight {
  insight: string;
  type: string;
}

export interface MarketplaceSuggestion {
  suggestion: string;
}

export interface AnalyticsCardsData {
  overview: Record<string, unknown> | null;
  analytics: Record<string, unknown> | null;
  trustScore: number | null;
  timestamp: string;
}

export const tradeservAiApi = {
  profileReview: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/profile-review', data).then(r => r.data),

  generateBio: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/bio', data).then(r => r.data),

  generateSeo: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/seo', data).then(r => r.data),

  portfolioSuggestions: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/portfolio-suggestions', data).then(r => r.data),

  serviceDescription: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/service-description', data).then(r => r.data),

  writeProposal: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/proposal', data).then(r => r.data),

  pricingSuggestions: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/pricing', data).then(r => r.data),

  skillSuggestions: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/skills', data).then(r => r.data),

  categorySuggestions: (data: Record<string, unknown>) =>
    apiClient.post<AiTradeservResponse>('/tradeserv/ai/categories', data).then(r => r.data),

  getRecommendations: (limit?: number) =>
    apiClient.get<AiTradeservResponse>('/tradeserv/ai/recommendations', { params: { limit } }).then(r => r.data),

  getDashboardWidgets: () =>
    apiClient.get<AiTradeservResponse<DashboardWidgetsData>>('/tradeserv/ai/dashboard-widgets').then(r => r.data),

  getMarketplaceSuggestions: () =>
    apiClient.get<AiTradeservResponse<MarketplaceSuggestion[]>>('/tradeserv/ai/marketplace-suggestions').then(r => r.data),

  getGrowthSuggestions: () =>
    apiClient.get<AiTradeservResponse<GrowthSuggestion[]>>('/tradeserv/ai/growth-suggestions').then(r => r.data),

  getFounderInsights: () =>
    apiClient.get<AiTradeservResponse<FounderInsight[]>>('/tradeserv/ai/founder-insights').then(r => r.data),

  getMembershipBenefits: () =>
    apiClient.get<AiTradeservResponse<MembershipBenefitsData>>('/tradeserv/ai/membership-benefits').then(r => r.data),

  getTradTrustSuggestions: () =>
    apiClient.get<AiTradeservResponse<TradTrustSuggestionsData>>('/tradeserv/ai/tradtrust-suggestions').then(r => r.data),

  getGocashRewards: () =>
    apiClient.get<AiTradeservResponse<GocashRewardsData>>('/tradeserv/ai/gocash-rewards').then(r => r.data),

  getAnalyticsCards: () =>
    apiClient.get<AiTradeservResponse<AnalyticsCardsData>>('/tradeserv/ai/analytics-cards').then(r => r.data),
};
