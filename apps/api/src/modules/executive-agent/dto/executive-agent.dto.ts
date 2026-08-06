import { IsString, IsOptional, IsObject } from 'class-validator';

export class ExecutiveCopilotResponse {
  todayBrief: string;
  criticalAlerts: ExecutiveAlert[];
  strategicPriorities: ExecutivePriority[];
  revenueSnapshot: RevenueSnapshot;
  marketplaceHealth: MarketplaceHealthSummary;
  aiPlatformHealth: AiPlatformHealthSummary;
  quickDecisions: QuickDecision[];
}

export class ExecutiveAlert {
  id: string;
  type: 'risk' | 'opportunity' | 'failure' | 'anomaly' | 'milestone';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric?: { label: string; value: number; change?: number };
  source: string;
  recommendedAction: string;
  timestamp: string;
}

export class ExecutivePriority {
  rank: number;
  title: string;
  description: string;
  impactArea: string;
  revenueImpact: string;
  riskLevel: 'high' | 'medium' | 'low';
  roi: string;
  timeframe: string;
  recommendedAction: string;
  contributingAgent: string;
}

export class RevenueSnapshot {
  gmv: { value: number; change: number; changeType: 'positive' | 'negative' | 'neutral' };
  revenue: { value: number; change: number; changeType: 'positive' | 'negative' | 'neutral' };
  orders: { value: number; change: number; changeType: 'positive' | 'negative' | 'neutral' };
  avgOrderValue: number;
  period: string;
}

export class MarketplaceHealthSummary {
  totalSellers: number;
  totalBuyers: number;
  activeProducts: number;
  totalRFQs: number;
  conversionRate: number;
  avgTrustScore: number;
  verificationRate: number;
  sellerQualityIndex: number;
}

export class AiPlatformHealthSummary {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  activeProviders: number;
  circuitBreakersOpen: number;
  creditsUsed: number;
  topFeatures: { name: string; usage: number }[];
  agentStatus: { agentId: string; name: string; status: 'healthy' | 'degraded' | 'down'; lastActive: string }[];
}

export class QuickDecision {
  id: string;
  area: string;
  question: string;
  options: { label: string; impact: string; recommended: boolean }[];
  context: string;
  deadline?: string;
}

export class RiskReportDto {
  @IsOptional() @IsString() timeframe?: '24h' | '7d' | '30d';
}

export class ExecutiveKpiResponse {
  period: string;
  gmv: number;
  revenue: number;
  orders: number;
  users: number;
  companies: number;
  rfqs: number;
  tradeserv: { professionals: number; bookings: number; proposals: number };
  tradetalk: { communities: number; members: number; activeMembers: number };
  advertising: { campaigns: number; spend: number; impressions: number };
  aiAdoption: { companiesUsingAi: number; totalRequests: number; creditsConsumed: number };
  trustScore: number;
  platformHealth: { uptime: number; errorRate: number; avgResponseTime: number };
  growth: { userGrowth: number; companyGrowth: number; orderGrowth: number; revenueGrowth: number };
}

export class ExecutiveRiskResponse {
  period: string;
  risks: {
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    currentValue: number;
    threshold: number;
    affectedEntities: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendedAction: string;
  }[];
  overallHealth: string;
  criticalCount: number;
  totalRisks: number;
}

export class ExecutiveOpportunityResponse {
  period: string;
  opportunities: {
    category: string;
    title: string;
    description: string;
    potentialRevenue: string;
    confidence: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    metrics: { label: string; value: string | number }[];
    source: string;
  }[];
  totalOpportunities: number;
  totalPotentialRevenue: string;
  topPriority: string;
}

export class AgentCoordinationDto {
  @IsString() targetAgentId: string;
  @IsString() action: string;
  @IsObject() payload: Record<string, unknown>;
  @IsOptional() @IsString() collaborationId?: string;
}

export class ExecutiveAnalyticsResponse {
  period: string;
  businessGrowth: { metric: string; current: number; previous: number; change: number }[];
  agentImpact: { agentId: string; name: string; actionsExecuted: number; successRate: number; businessValue: string }[];
  aiAdoption: { month: string; companiesUsingAi: number; totalRequests: number; creditsConsumed: number }[];
  executiveActions: { action: string; count: number; lastExecuted: string; successRate: number }[];
  recommendationsAccepted: { total: number; accepted: number; acceptanceRate: number; revenueImpact: string };
}

