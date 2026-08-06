import { apiClient } from '@/lib/api/client';

export interface ProfessionalAgentPriority {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metric?: { label: string; value: string | number };
}

export interface ProfessionalAgentQuickAction {
  label: string;
  href: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DashboardCopilotResponse {
  priorities: ProfessionalAgentPriority[];
  quickActions: ProfessionalAgentQuickAction[];
  urgentAlerts: ProfessionalAgentPriority[];
  growthOpportunities: ProfessionalAgentPriority[];
  metrics: Record<string, number | string>;
}

export interface OpportunityItem {
  title: string;
  description: string;
  demandLevel: string;
  competitionLevel: string;
  potentialScore: number;
  actionUrl?: string;
}

export interface ClientAcquisitionResponse {
  marketplaceDemand: OpportunityItem[];
  nearbyOpportunities: OpportunityItem[];
  tradeTalkCommunities: Array<{ id: string; name: string; memberCount: number; relevance: string }>;
  recommendations: string[];
}

export interface ProposalIntelResponse {
  totalProposals: number;
  winRate: number;
  averageProposalScore: number;
  pricingInsights: Array<{ label: string; value: string; type: string }>;
  riskIndicators: Array<{ factor: string; severity: string; description: string }>;
  followUpSuggestions: Array<{ proposalId: string; clientName: string; daysSinceSent: number; suggestedAction: string }>;
  improvements: string[];
}

export interface PortfolioIntelResponse {
  portfolioQualityScore: number;
  itemCount: number;
  coverageAreas: string[];
  missingIndustries: string[];
  mediaQuality: string;
  suggestions: string[];
}

export interface ReputationAdvisorResponse {
  trustScore: number;
  trustGrade: string;
  riskLevel: string;
  averageRating: number;
  reviewCount: number;
  responseRate: number;
  profileCompleteness: number;
  verificationLevel: string;
  breakdown: Array<{ category: string; score: number; contribution: number; maxContribution: number }>;
  improvementPlan: Array<{ area: string; action: string; impact: string; expectedOutcome: string }>;
}

export interface RevenuePlannerResponse {
  currentRevenue: number;
  revenueTarget: number;
  pipelineValue: number;
  forecastedRevenue: number;
  monthlyTrend: Array<{ month: string; revenue: number; bookings: number }>;
  conversionOpportunities: Array<{ inquiryId: string; clientName: string; value: number; probability: number; stage: string }>;
  goals: Array<{ category: string; target: string; current: number; priority: string }>;
  recommendations: string[];
}

export interface AiNotificationItem {
  type: string;
  title: string;
  body: string;
  priority: string;
  link?: string;
  createdAt: string;
}

export interface ProfessionalNotificationsResponse {
  dailyDigest: string;
  criticalAlerts: AiNotificationItem[];
  milestones: AiNotificationItem[];
  insights: AiNotificationItem[];
  reminders: AiNotificationItem[];
  opportunities: AiNotificationItem[];
}

export interface TradeTalkIntegrationResponse {
  recommendedCommunities: Array<{ id: string; name: string; description: string; memberCount: number; relevanceScore: number; tags: string[] }>;
  activeDiscussions: Array<{ id: string; title: string; replyCount: number; lastActivity: string }>;
  networkingSuggestions: Array<{ professionalId: string; name: string; company: string; mutualConnections: number; reason: string }>;
  communityInsights: { totalCommunities: number; totalMembers: number; topIndustries: Array<{ name: string; count: number }> };
}

export interface ProfessionalAgentInsightsResponse {
  dashboardCopilot: DashboardCopilotResponse;
  clientAcquisition: ClientAcquisitionResponse;
  proposalIntelligence: ProposalIntelResponse;
  portfolioIntelligence: PortfolioIntelResponse;
  reputationAdvisor: ReputationAdvisorResponse;
  revenuePlanner: RevenuePlannerResponse;
  notifications: ProfessionalNotificationsResponse;
  tradeTalkIntegration: TradeTalkIntegrationResponse;
}

export const professionalAgentApi = {
  getDashboardCopilot: () =>
    apiClient.get<DashboardCopilotResponse>('/professional-agent/dashboard-copilot').then(r => r.data),

  getClientAcquisition: () =>
    apiClient.get<ClientAcquisitionResponse>('/professional-agent/client-acquisition').then(r => r.data),

  getProposalIntelligence: () =>
    apiClient.get<ProposalIntelResponse>('/professional-agent/proposal-intelligence').then(r => r.data),

  getPortfolioIntelligence: () =>
    apiClient.get<PortfolioIntelResponse>('/professional-agent/portfolio-intelligence').then(r => r.data),

  getReputationAdvisor: () =>
    apiClient.get<ReputationAdvisorResponse>('/professional-agent/reputation-advisor').then(r => r.data),

  getRevenuePlanner: () =>
    apiClient.get<RevenuePlannerResponse>('/professional-agent/revenue-planner').then(r => r.data),

  getNotifications: () =>
    apiClient.get<ProfessionalNotificationsResponse>('/professional-agent/notifications').then(r => r.data),

  getTradeTalkIntegration: () =>
    apiClient.get<TradeTalkIntegrationResponse>('/professional-agent/tradetalk-integration').then(r => r.data),

  getAllInsights: () =>
    apiClient.get<ProfessionalAgentInsightsResponse>('/professional-agent/insights').then(r => r.data),
};
