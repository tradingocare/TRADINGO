import { TradeAgentPriority, TradeAgentQuickAction, TradeAgentNotificationItem } from '../../agent-framework/dto/agent-shared.dto';

export class ProfessionalDashboardCopilotResponse {
  priorities: TradeAgentPriority[];
  quickActions: TradeAgentQuickAction[];
  urgentAlerts: TradeAgentPriority[];
  growthOpportunities: TradeAgentPriority[];
  metrics: Record<string, number | string>;
}

export class OpportunityItem {
  title: string;
  description: string;
  demandLevel: 'high' | 'medium' | 'low';
  competitionLevel: 'high' | 'medium' | 'low';
  potentialScore: number;
  actionUrl?: string;
}

export class ClientAcquisitionResponse {
  marketplaceDemand: OpportunityItem[];
  nearbyOpportunities: OpportunityItem[];
  tradeTalkCommunities: Array<{ id: string; name: string; memberCount: number; relevance: string }>;
  recommendations: string[];
}

export class ProposalIntelResponse {
  totalProposals: number;
  winRate: number;
  averageProposalScore: number;
  pricingInsights: Array<{ label: string; value: string; type: 'competitive' | 'premium' | 'economy' }>;
  riskIndicators: Array<{ factor: string; severity: 'high' | 'medium' | 'low'; description: string }>;
  followUpSuggestions: Array<{ proposalId: string; clientName: string; daysSinceSent: number; suggestedAction: string }>;
  improvements: string[];
}

export class PortfolioIntelResponse {
  portfolioQualityScore: number;
  itemCount: number;
  coverageAreas: string[];
  missingIndustries: string[];
  mediaQuality: 'excellent' | 'good' | 'needs_improvement';
  suggestions: string[];
}

export class ReputationAdvisorResponse {
  trustScore: number;
  trustGrade: string;
  riskLevel: string;
  averageRating: number;
  reviewCount: number;
  responseRate: number;
  profileCompleteness: number;
  verificationLevel: string;
  breakdown: Array<{ category: string; score: number; contribution: number; maxContribution: number }>;
  improvementPlan: Array<{ area: string; action: string; impact: 'high' | 'medium' | 'low'; expectedOutcome: string }>;
}

export class RevenuePlannerResponse {
  currentRevenue: number;
  revenueTarget: number;
  pipelineValue: number;
  forecastedRevenue: number;
  monthlyTrend: Array<{ month: string; revenue: number; bookings: number }>;
  conversionOpportunities: Array<{ inquiryId: string; clientName: string; value: number; probability: number; stage: string }>;
  goals: Array<{ category: string; target: string; current: number; priority: 'high' | 'medium' | 'low' }>;
  recommendations: string[];
}

export class ProfessionalNotificationsResponse {
  dailyDigest: string;
  criticalAlerts: TradeAgentNotificationItem[];
  milestones: TradeAgentNotificationItem[];
  insights: TradeAgentNotificationItem[];
  reminders: TradeAgentNotificationItem[];
  opportunities: TradeAgentNotificationItem[];
}

export class TradeTalkIntegrationResponse {
  recommendedCommunities: Array<{ id: string; name: string; description: string; memberCount: number; relevanceScore: number; tags: string[] }>;
  activeDiscussions: Array<{ id: string; title: string; replyCount: number; lastActivity: Date }>;
  networkingSuggestions: Array<{ professionalId: string; name: string; company: string; mutualConnections: number; reason: string }>;
  communityInsights: { totalCommunities: number; totalMembers: number; topIndustries: Array<{ name: string; count: number }> };
}

export class ProfessionalAgentInsightsResponse {
  dashboardCopilot: ProfessionalDashboardCopilotResponse;
  clientAcquisition: ClientAcquisitionResponse;
  proposalIntelligence: ProposalIntelResponse;
  portfolioIntelligence: PortfolioIntelResponse;
  reputationAdvisor: ReputationAdvisorResponse;
  revenuePlanner: RevenuePlannerResponse;
  notifications: ProfessionalNotificationsResponse;
  tradeTalkIntegration: TradeTalkIntegrationResponse;
}
