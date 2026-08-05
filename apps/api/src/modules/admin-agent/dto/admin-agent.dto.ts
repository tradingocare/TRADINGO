import { TradeAgentPriority, TradeAgentQuickAction, TradeAgentNotificationItem } from '../../agent-framework/dto/agent-shared.dto';

export class AdminDashboardCopilotResponse {
  priorities: TradeAgentPriority[];
  quickActions: TradeAgentQuickAction[];
  urgentAlerts: TradeAgentPriority[];
  metrics: Record<string, number | string>;
}

export class SystemHealthItem {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  errorRate: number;
  avgResponseMs: number;
  lastIncident?: string;
}

export class SystemHealthResponse {
  overall: 'healthy' | 'degraded' | 'critical';
  services: SystemHealthItem[];
  queueDepth: number;
  activeWorkers: number;
  openCircuitBreakers: number;
  slaBreaches24h: number;
}

export class UserActivityResponse {
  totalUsers: number;
  newToday: number;
  activeToday: number;
  churnRisk: number;
  byRole: { role: string; count: number }[];
  topUsers: { id: string; name: string; email: string; role: string; activityScore: number }[];
}

export class FraudIntelligenceResponse {
  flaggedEntities: number;
  riskDistribution: { level: string; count: number }[];
  walletAnomalies: number;
  highVelocityUsers: number;
  verificationIssues: number;
  recentAlerts: TradeAgentNotificationItem[];
}

export class RevenueAnalyticsResponse {
  gmv: number;
  revenue: number;
  growth: number;
  categoryGrowth: { category: string; revenue: number; growth: number }[];
  sellerGrowth: { total: number; newThisMonth: number; growth: number };
  buyerGrowth: { total: number; newThisMonth: number; growth: number };
  membership: { totalRevenue: number; subscribers: number };
  advertising: { totalSpend: number; activeCampaigns: number };
  aiCredits: { totalUsed: number; totalRevenue: number };
}

export class ModerationQueueResponse {
  pendingReviews: number;
  flaggedContent: number;
  reports: number;
  communityReports: number;
  productReports: number;
  topFlags: { type: string; count: number }[];
}

export class PlatformGrowthResponse {
  sellers: { total: number; newThisMonth: number; active: number };
  buyers: { total: number; newThisMonth: number; active: number };
  products: { total: number; active: number; newThisMonth: number };
  tradeVolume: { totalOrders: number; totalValue: number; growth: number };
  rfqs: { total: number; thisMonth: number };
}

export class PerformanceMetricsResponse {
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorBudget: { available: number; consumed: number; remaining: number };
  sla: { total: number; met: number; breached: number; rate: number };
  queueDepth: number;
  workerUtilization: number;
}

export class DailyBriefResponse {
  date: string;
  morningBrief: string;
  topPriorities: TradeAgentPriority[];
  recommendedAction: string;
  metrics: Record<string, number | string>;
}

export class AdminAgentAllInsightsResponse {
  dashboardCopilot: AdminDashboardCopilotResponse;
  systemHealth: SystemHealthResponse;
  userActivity: UserActivityResponse;
  fraudIntelligence: FraudIntelligenceResponse;
  revenueAnalytics: RevenueAnalyticsResponse;
  moderationQueue: ModerationQueueResponse;
  platformGrowth: PlatformGrowthResponse;
  performanceMetrics: PerformanceMetricsResponse;
  dailyBrief: DailyBriefResponse;
}
