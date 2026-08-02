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

export interface TradeAgentNotificationItem {
  type: 'alert' | 'milestone' | 'insight' | 'reminder' | 'opportunity';
  title: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  link?: string;
  createdAt: string;
}

export interface AdminDashboardCopilotResponse {
  priorities: TradeAgentPriority[];
  quickActions: TradeAgentQuickAction[];
  urgentAlerts: TradeAgentPriority[];
  metrics: Record<string, number | string>;
}

export interface SystemHealthItem {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  errorRate: number;
  avgResponseMs: number;
  lastIncident?: string;
}

export interface SystemHealthResponse {
  overall: 'healthy' | 'degraded' | 'critical';
  services: SystemHealthItem[];
  queueDepth: number;
  activeWorkers: number;
  openCircuitBreakers: number;
  slaBreaches24h: number;
}

export interface UserActivityResponse {
  totalUsers: number;
  newToday: number;
  activeToday: number;
  churnRisk: number;
  byRole: { role: string; count: number }[];
  topUsers: { id: string; name: string; email: string; role: string; activityScore: number }[];
}

export interface FraudIntelligenceResponse {
  flaggedEntities: number;
  riskDistribution: { level: string; count: number }[];
  walletAnomalies: number;
  highVelocityUsers: number;
  verificationIssues: number;
  recentAlerts: TradeAgentNotificationItem[];
}

export interface RevenueAnalyticsResponse {
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

export interface ModerationQueueResponse {
  pendingReviews: number;
  flaggedContent: number;
  reports: number;
  communityReports: number;
  productReports: number;
  topFlags: { type: string; count: number }[];
}

export interface PlatformGrowthResponse {
  sellers: { total: number; newThisMonth: number; active: number };
  buyers: { total: number; newThisMonth: number; active: number };
  products: { total: number; active: number; newThisMonth: number };
  tradeVolume: { totalOrders: number; totalValue: number; growth: number };
  rfqs: { total: number; thisMonth: number };
}

export interface PerformanceMetricsResponse {
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorBudget: { available: number; consumed: number; remaining: number };
  sla: { total: number; met: number; breached: number; rate: number };
  queueDepth: number;
  workerUtilization: number;
}

export interface DailyBriefResponse {
  date: string;
  morningBrief: string;
  topPriorities: TradeAgentPriority[];
  recommendedAction: string;
  metrics: Record<string, number | string>;
}

export interface AdminAgentAllInsightsResponse {
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

export const getAdminDashboardCopilot = () =>
  apiClient.get<AdminDashboardCopilotResponse>('/admin/agent/dashboard-copilot').then(r => r.data);

export const getAdminSystemHealth = () =>
  apiClient.get<SystemHealthResponse>('/admin/agent/system-health').then(r => r.data);

export const getAdminUserActivity = () =>
  apiClient.get<UserActivityResponse>('/admin/agent/user-activity').then(r => r.data);

export const getAdminFraudIntelligence = () =>
  apiClient.get<FraudIntelligenceResponse>('/admin/agent/fraud-intelligence').then(r => r.data);

export const getAdminRevenueAnalytics = () =>
  apiClient.get<RevenueAnalyticsResponse>('/admin/agent/revenue-analytics').then(r => r.data);

export const getAdminModerationQueue = () =>
  apiClient.get<ModerationQueueResponse>('/admin/agent/moderation-queue').then(r => r.data);

export const getAdminPlatformGrowth = () =>
  apiClient.get<PlatformGrowthResponse>('/admin/agent/platform-growth').then(r => r.data);

export const getAdminPerformanceMetrics = () =>
  apiClient.get<PerformanceMetricsResponse>('/admin/agent/performance-metrics').then(r => r.data);

export const getAdminDailyBrief = () =>
  apiClient.get<DailyBriefResponse>('/admin/agent/daily-brief').then(r => r.data);

export const getAdminAgentAllInsights = () =>
  apiClient.get<AdminAgentAllInsightsResponse>('/admin/agent/insights').then(r => r.data);
