import { TradeAgentPriority, TradeAgentQuickAction, TradeAgentNotificationItem, TradeAgentMetric } from '../../agent-framework/dto/agent-shared.dto';

export class CommunityDashboardCopilotResponse {
  todaysDiscussions: Array<{ title: string; communityName: string; replyCount: number; lastActivity: Date }>;
  trendingIndustries: Array<{ name: string; communityCount: number; growth: number }>;
  recommendedCommunities: Array<{ id: string; name: string; slug: string; memberCount: number; matchReason: string }>;
  networkingSuggestions: number;
  pendingInvitations: number;
  alerts: TradeAgentPriority[];
  metrics: Record<string, number | string>;
  quickActions: TradeAgentQuickAction[];
}

export class NetworkingAdvisorResponse {
  recommendedBusinesses: Array<{ companyId: string; name: string; slug: string; trustScore: number; industry: string; location: string; reason: string }>;
  recommendedProfessionals: Array<{ companyId: string; name: string; slug: string; professionalType: string; trustScore: number; reason: string }>;
  industryExperts: Array<{ userId: string; name: string; communitiesLed: number; trustScore: number; expertise: string[] }>;
  potentialPartners: Array<{ companyId: string; name: string; trustScore: number; mutualCommunities: number; reason: string }>;
}

export class CommunityIntelligenceResponse {
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

export class KnowledgeDiscoveryResponse {
  trendingDiscussions: Array<{ title: string; communityName: string; authorName: string; replyCount: number; createdAt: Date }>;
  industryUpdates: Array<{ industry: string; title: string; summary: string; relevanceScore: number }>;
  businessResources: Array<{ title: string; description: string; type: string; url: string }>;
  professionalInsights: Array<{ professionalName: string; companyName: string; insight: string; trustScore: number }>;
  recommendedExperts: Array<{ companyId: string; name: string; slug: string; professionalType: string; serviceCount: number; trustScore: number }>;
}

export class CollaborationAdvisorResponse {
  potentialPartnerships: Array<{ companyId: string; name: string; trustScore: number; industry: string; opportunity: string }>;
  supplierConnections: Array<{ companyId: string; name: string; productCategories: string[]; trustScore: number }>;
  buyerOpportunities: Array<{ companyId: string; name: string; recentRfqs: number; trustScore: number }>;
  tradeservOpportunities: Array<{ companyId: string; name: string; professionalType: string; serviceCount: number; location: string }>;
  marketplaceOpportunities: Array<{ category: string; demandLevel: string; professionalCount: number; potentialScore: number }>;
}

export class CommunityReputationResponse {
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

export class CommunityNotificationsResponse {
  dailyDigest: string;
  trendingIndustries: TradeAgentNotificationItem[];
  invitationAlerts: TradeAgentNotificationItem[];
  discussionHighlights: TradeAgentNotificationItem[];
  collaborationOpportunities: TradeAgentNotificationItem[];
}

export class CommunityAnalyticsResponse {
  period: string;
  communityGrowth: { total: number; growth30d: number; newThisMonth: number };
  memberEngagement: { total: number; active30d: number; engagementRate: number; avgCommunitiesPerUser: number };
  recommendationAdoption: { totalRecommendations: number; acceptedRecommendations: number; adoptionRate: number };
  aiAdoption: { totalAiCalls: number; uniqueUsers: number };
  networkingSuccess: { totalConnections: number; collaborationRate: number };
  knowledgeContribution: { totalDiscussions: number; activeContributors: number; contributionRate: number };
  topIndustries: Array<{ name: string; communityCount: number; memberCount: number; growth: number }>;
}

export class CommunityAgentInsightsResponse {
  dashboardCopilot: CommunityDashboardCopilotResponse;
  networkingAdvisor: NetworkingAdvisorResponse;
  communityIntelligence: CommunityIntelligenceResponse;
  knowledgeDiscovery: KnowledgeDiscoveryResponse;
  collaborationAdvisor: CollaborationAdvisorResponse;
  communityReputation: CommunityReputationResponse;
  notifications: CommunityNotificationsResponse;
  analytics: CommunityAnalyticsResponse;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
