import api from './client';

export interface SellerAgentPriority {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metric?: { label: string; value: string | number };
}

export interface SellerAgentQuickAction {
  label: string;
  href: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DashboardCopilotResponse {
  priorities: SellerAgentPriority[];
  quickActions: SellerAgentQuickAction[];
  urgentAlerts: SellerAgentPriority[];
  growthOpportunities: SellerAgentPriority[];
  metrics: Record<string, number | string>;
}

export interface ProductImprovementSuggestion {
  productId: string;
  productName: string;
  issue: string;
  currentScore: number;
  impact: 'high' | 'medium' | 'low';
  actionLabel: string;
}

export interface ProductAdvisorResponse {
  averageQualityScore: number;
  trend: 'improving' | 'declining' | 'stable';
  improvements: ProductImprovementSuggestion[];
  lowScoringProductCount: number;
  duplicateRiskCount: number;
  topPicks: Array<{ productId: string; productName: string; commerceScore: number }>;
  missingFields: { label: string; count: number }[];
}

export interface SalesAdvisorMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface SalesAdvisorResponse {
  revenue: SalesAdvisorMetric;
  conversionRate: SalesAdvisorMetric;
  winRate: SalesAdvisorMetric;
  openDeals: number;
  topProducts: Array<{ productId: string; productName: string; orderCount: number; revenue: number }>;
  recommendations: string[];
}

export interface AdvertisingAdvisorResponse {
  topProductsToPromote: Array<{
    productId: string; productName: string; qualityScore: number;
    suggestedDailyBudget: number; estimatedCpc: number; competitionLevel: string;
  }>;
  activeCampaignCount: number;
  totalAdSpend: number;
  recommendations: string[];
}

export interface TrustFactorDetail {
  category: string;
  score: number;
  contribution: number;
  maxContribution: number;
}

export interface TrustAdvisorResponse {
  unifiedScore: number;
  grade: string;
  riskLevel: string;
  breakdown: TrustFactorDetail[];
  recentChanges: Array<{ date: Date; score: number }>;
  improvements: string[];
}

export interface GrowthPlannerResponse {
  suggestedGoals: Array<{ category: string; target: string; priority: 'high' | 'medium' | 'low'; reason: string }>;
  marketplaceOpportunities: Array<{ category: string; demandLevel: string; competitionLevel: string; potentialScore: number }>;
  milestones: Array<{ label: string; progress: number; target: string }>;
}

export interface AiNotificationItem {
  type: 'alert' | 'milestone' | 'insight' | 'reminder';
  title: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  link?: string;
  createdAt: Date;
}

export interface SellerAgentNotificationsResponse {
  dailyDigest: string;
  criticalAlerts: AiNotificationItem[];
  milestones: AiNotificationItem[];
  insights: AiNotificationItem[];
  reminders: AiNotificationItem[];
}

export interface SellerAgentInsightsResponse {
  dashboardCopilot: DashboardCopilotResponse;
  productAdvisor: ProductAdvisorResponse;
  salesAdvisor: SalesAdvisorResponse;
  advertisingAdvisor: AdvertisingAdvisorResponse;
  trustAdvisor: TrustAdvisorResponse;
  growthPlanner: GrowthPlannerResponse;
  aiNotifications: SellerAgentNotificationsResponse;
}

export const getDashboardCopilot = () =>
  api.get<DashboardCopilotResponse>('/seller/agent/dashboard-copilot').then(r => r.data);

export const getProductAdvisor = () =>
  api.get<ProductAdvisorResponse>('/seller/agent/product-advisor').then(r => r.data);

export const getSalesAdvisor = () =>
  api.get<SalesAdvisorResponse>('/seller/agent/sales-advisor').then(r => r.data);

export const getAdvertisingAdvisor = () =>
  api.get<AdvertisingAdvisorResponse>('/seller/agent/advertising-advisor').then(r => r.data);

export const getTrustAdvisor = () =>
  api.get<TrustAdvisorResponse>('/seller/agent/trust-advisor').then(r => r.data);

export const getGrowthPlanner = () =>
  api.get<GrowthPlannerResponse>('/seller/agent/growth-planner').then(r => r.data);

export const getAgentNotifications = () =>
  api.get<SellerAgentNotificationsResponse>('/seller/agent/notifications').then(r => r.data);

export const getAllInsights = () =>
  api.get<SellerAgentInsightsResponse>('/seller/agent/insights').then(r => r.data);
