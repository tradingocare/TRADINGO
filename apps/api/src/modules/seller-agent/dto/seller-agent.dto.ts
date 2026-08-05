export class SellerAgentPriority {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metric?: { label: string; value: string | number };
}

export class SellerAgentQuickAction {
  label: string;
  href: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export class DashboardCopilotResponse {
  priorities: SellerAgentPriority[];
  quickActions: SellerAgentQuickAction[];
  urgentAlerts: SellerAgentPriority[];
  growthOpportunities: SellerAgentPriority[];
  metrics: Record<string, number | string>;
}

export class ProductImprovementSuggestion {
  productId: string;
  productName: string;
  issue: string;
  currentScore: number;
  impact: 'high' | 'medium' | 'low';
  actionLabel: string;
}

export class ProductAdvisorResponse {
  averageQualityScore: number;
  trend: 'improving' | 'declining' | 'stable';
  improvements: ProductImprovementSuggestion[];
  lowScoringProductCount: number;
  duplicateRiskCount: number;
  topPicks: Array<{ productId: string; productName: string; commerceScore: number }>;
  missingFields: { label: string; count: number }[];
}

export class SalesAdvisorMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export class SalesAdvisorResponse {
  revenue: SalesAdvisorMetric;
  conversionRate: SalesAdvisorMetric;
  winRate: SalesAdvisorMetric;
  openDeals: number;
  topProducts: Array<{ productId: string; productName: string; orderCount: number; revenue: number }>;
  recommendations: string[];
}

export class AdvertisingAdvisorResponse {
  topProductsToPromote: Array<{
    productId: string; productName: string; qualityScore: number;
    suggestedDailyBudget: number; estimatedCpc: number; competitionLevel: string;
  }>;
  activeCampaignCount: number;
  totalAdSpend: number;
  recommendations: string[];
}

export class TrustFactorDetail {
  category: string;
  score: number;
  contribution: number;
  maxContribution: number;
}

export class TrustAdvisorResponse {
  unifiedScore: number;
  grade: string;
  riskLevel: string;
  breakdown: TrustFactorDetail[];
  recentChanges: Array<{ date: Date; score: number }>;
  improvements: string[];
}

export class GrowthPlannerResponse {
  suggestedGoals: Array<{ category: string; target: string; priority: 'high' | 'medium' | 'low'; reason: string }>;
  marketplaceOpportunities: Array<{ category: string; demandLevel: string; competitionLevel: string; potentialScore: number }>;
  milestones: Array<{ label: string; progress: number; target: string }>;
}

export class AiNotificationItem {
  type: 'alert' | 'milestone' | 'insight' | 'reminder';
  title: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  link?: string;
  createdAt: Date;
}

export class SellerAgentNotificationsResponse {
  dailyDigest: string;
  criticalAlerts: AiNotificationItem[];
  milestones: AiNotificationItem[];
  insights: AiNotificationItem[];
  reminders: AiNotificationItem[];
}

export class SellerAgentInsightsResponse {
  dashboardCopilot: DashboardCopilotResponse;
  productAdvisor: ProductAdvisorResponse;
  salesAdvisor: SalesAdvisorResponse;
  advertisingAdvisor: AdvertisingAdvisorResponse;
  trustAdvisor: TrustAdvisorResponse;
  growthPlanner: GrowthPlannerResponse;
  aiNotifications: SellerAgentNotificationsResponse;
}

