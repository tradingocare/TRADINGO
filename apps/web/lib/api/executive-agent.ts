export interface ExecutiveAlert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  recommendedAction: string;
  timestamp: string;
}

export interface ExecutivePriority {
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

export interface RevenueSnapshot {
  gmv: { value: number; change: number; changeType: string };
  revenue: { value: number; change: number; changeType: string };
  orders: { value: number; change: number; changeType: string };
  avgOrderValue: number;
  period: string;
}

export interface AiPlatformHealthSummary {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  activeProviders: number;
  circuitBreakersOpen: number;
  creditsUsed: number;
  topFeatures: { name: string; usage: number }[];
  agentStatus: { agentId: string; name: string; status: string; lastActive: string }[];
}

export interface ExecutiveCopilotResponse {
  todayBrief: string;
  criticalAlerts: ExecutiveAlert[];
  strategicPriorities: ExecutivePriority[];
  revenueSnapshot: RevenueSnapshot;
  marketplaceHealth: { totalSellers: number; totalBuyers: number; activeProducts: number; totalRFQs: number; conversionRate: number; avgTrustScore: number; verificationRate: number; sellerQualityIndex: number };
  aiPlatformHealth: AiPlatformHealthSummary;
  quickDecisions: { id: string; area: string; question: string; options: { label: string; impact: string; recommended: boolean }[]; context: string }[];
}

export interface ExecutiveKpiResponse {
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

export interface ExecutiveRiskResponse {
  period: string;
  risks: {
    category: string; severity: string; title: string; description: string;
    currentValue: number; threshold: number; affectedEntities: number;
    trend: string; recommendedAction: string;
  }[];
  overallHealth: string;
  criticalCount: number;
  totalRisks: number;
}

export interface ExecutiveOpportunityResponse {
  period: string;
  opportunities: {
    category: string; title: string; description: string; potentialRevenue: string;
    confidence: number; effort: string; timeframe: string;
    metrics: { label: string; value: string | number }[]; source: string;
  }[];
  totalOpportunities: number;
  totalPotentialRevenue: string;
  topPriority: string;
}

export interface ExecutiveAnalyticsResponse {
  period: string;
  businessGrowth: { metric: string; current: number; previous: number; change: number }[];
  agentImpact: { agentId: string; name: string; actionsExecuted: number; successRate: number; businessValue: string }[];
  aiAdoption: { month: string; companiesUsingAi: number; totalRequests: number; creditsConsumed: number }[];
  executiveActions: { action: string; count: number; lastExecuted: string; successRate: number }[];
  recommendationsAccepted: { total: number; accepted: number; acceptanceRate: number; revenueImpact: string };
}

const BASE = '/founder/executive';

export async function getExecutiveCopilot(): Promise<ExecutiveCopilotResponse> {
  const res = await fetch(BASE + '/copilot'); if (!res.ok) throw new Error('Failed');
  return res.json();
}

export async function getDecisionCenter(): Promise<Record<string, unknown>> {
  const res = await fetch(BASE + '/decision-center'); if (!res.ok) throw new Error('Failed');
  return res.json();
}

export async function getExecutiveKpi(): Promise<ExecutiveKpiResponse> {
  const res = await fetch(BASE + '/kpi'); if (!res.ok) throw new Error('Failed');
  return res.json();
}

export async function getExecutiveRisks(timeframe?: string): Promise<ExecutiveRiskResponse> {
  const qs = timeframe ? '?timeframe=' + timeframe : '';
  const res = await fetch(BASE + '/risks' + qs); if (!res.ok) throw new Error('Failed');
  return res.json();
}

export async function getExecutiveOpportunities(): Promise<ExecutiveOpportunityResponse> {
  const res = await fetch(BASE + '/opportunities'); if (!res.ok) throw new Error('Failed');
  return res.json();
}

export async function getExecutiveAnalytics(): Promise<ExecutiveAnalyticsResponse> {
  const res = await fetch(BASE + '/analytics'); if (!res.ok) throw new Error('Failed');
  return res.json();
}

export async function coordinateWithAgent(targetAgentId: string, action: string, payload: Record<string, unknown>): Promise<{ success: boolean; result?: string }> {
  const res = await fetch(BASE + '/coordinate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetAgentId, action, payload }) });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}
