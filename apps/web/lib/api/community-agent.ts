import { apiClient } from '@/lib/api/client';

export interface TradeAgentPriority {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metric?: { label: string; value: string | number };
}

export interface TradeAgentQuickAction {
  label: string;
  href: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CommunityDashboardCopilotResponse {
  todaysDiscussions: Array<{ title: string; communityName: string; replyCount: number; lastActivity: string }>;
  trendingIndustries: Array<{ name: string; communityCount: number; growth: number }>;
  recommendedCommunities: Array<{ id: string; name: string; slug: string; memberCount: number; matchReason: string }>;
  networkingSuggestions: number;
  pendingInvitations: number;
  alerts: TradeAgentPriority[];
  metrics: Record<string, number | string>;
  quickActions: TradeAgentQuickAction[];
}

export interface NetworkingAdvisorResponse {
  recommendedBusinesses: Array<{ companyId: string; name: string; slug: string; trustScore: number; industry: string; location: string; reason: string }>;
  recommendedProfessionals: Array<{ companyId: string; name: string; slug: string; professionalType: string; trustScore: number; reason: string }>;
  industryExperts: Array<{ userId: string; name: string; communitiesLed: number; trustScore: number; expertise: string[] }>;
  potentialPartners: Array<{ companyId: string; name: string; trustScore: number; mutualCommunities: number; reason: string }>;
}

export interface CommunityIntelligenceResponse {
  totalCommunities: number;
  totalMembers: number;
  communityGrowth30d: number;
  memberGrowth30d: number;
  engagementRate: number;
  activeMemberRate: number;
  topIndustries: Array<{ name: string; communityCount: number; memberCount: number; growth: number }>;
  growthTrend: Array<{ month: string; communities: number; members: number }>;
  inactiveCommunities: Array<{ id: string; name: string; memberCount: number; daysSinceLastActivity: number; suggestedAction: string }>;
  recommendations: string[];
}

export interface KnowledgeDiscoveryResponse {
  trendingDiscussions: Array<{ title: string; communityName: string; authorName: string; replyCount: number; createdAt: string }>;
  industryUpdates: Array<{ industry: string; title: string; summary: string; relevanceScore: number }>;
  businessResources: Array<{ title: string; description: string; type: string; url: string }>;
  professionalInsights: Array<{ professionalName: string; companyName: string; insight: string; trustScore: number }>;
  recommendedExperts: Array<{ companyId: string; name: string; slug: string; professionalType: string; serviceCount: number; trustScore: number }>;
}

export interface CollaborationAdvisorResponse {
  potentialPartnerships: Array<{ companyId: string; name: string; trustScore: number; industry: string; opportunity: string }>;
  supplierConnections: Array<{ companyId: string; name: string; productCategories: string[]; trustScore: number }>;
  buyerOpportunities: Array<{ companyId: string; name: string; recentRfqs: number; trustScore: number }>;
  tradeservOpportunities: Array<{ companyId: string; name: string; professionalType: string; serviceCount: number; location: string }>;
  marketplaceOpportunities: Array<{ category: string; demandLevel: string; professionalCount: number; potentialScore: number }>;
}

export interface CommunityReputationResponse {
  participationScore: number;
  communitiesJoined: number;
  communitiesLed: number;
  contributions: number;
  credibilityScore: number;
  tradTrustScore: number;
  leadershipScore: number;
  overallGrade: string;
  breakdown: Array<{ factor: string; score: number; maxScore: number; description: string }>;
  improvements: string[];
}

export interface CommunityNotificationsResponse {
  dailyDigest: string;
  trendingIndustries: TradeAgentPriority[];
  invitationAlerts: TradeAgentPriority[];
  discussionHighlights: TradeAgentPriority[];
  collaborationOpportunities: TradeAgentPriority[];
}

export interface CommunityAnalyticsResponse {
  period: string;
  communityGrowth: { total: number; growth30d: number; newThisMonth: number };
  memberEngagement: { total: number; active30d: number; engagementRate: number; avgCommunitiesPerUser: number };
  recommendationAdoption: { totalRecommendations: number; acceptedRecommendations: number; adoptionRate: number };
  aiAdoption: { totalAiCalls: number; uniqueUsers: number };
  networkingSuccess: { totalConnections: number; collaborationRate: number };
  knowledgeContribution: { totalDiscussions: number; activeContributors: number; contributionRate: number };
  topIndustries: Array<{ name: string; communityCount: number; memberCount: number; growth: number }>;
}

export const communityAgentApi = {
  getDashboardCopilot: () =>
    apiClient.get<CommunityDashboardCopilotResponse>('/community-agent/dashboard-copilot').then(r => r.data),

  getNetworkingAdvisor: () =>
    apiClient.get<NetworkingAdvisorResponse>('/community-agent/networking-advisor').then(r => r.data),

  getCommunityIntelligence: () =>
    apiClient.get<CommunityIntelligenceResponse>('/community-agent/community-intelligence').then(r => r.data),

  getKnowledgeDiscovery: () =>
    apiClient.get<KnowledgeDiscoveryResponse>('/community-agent/knowledge-discovery').then(r => r.data),

  getCollaborationAdvisor: () =>
    apiClient.get<CollaborationAdvisorResponse>('/community-agent/collaboration-advisor').then(r => r.data),

  getCommunityReputation: () =>
    apiClient.get<CommunityReputationResponse>('/community-agent/community-reputation').then(r => r.data),

  getNotifications: () =>
    apiClient.get<CommunityNotificationsResponse>('/community-agent/notifications').then(r => r.data),

  getAnalytics: () =>
    apiClient.get<CommunityAnalyticsResponse>('/community-agent/analytics').then(r => r.data),
};
