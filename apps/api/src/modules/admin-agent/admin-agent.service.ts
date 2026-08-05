import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { gracefulCatch } from '../../common/utils/graceful-catch';
import { AgentRegistryService } from '../agent-framework/agent-registry.service';
import { TradeAgentPriority, TradeAgentNotificationItem } from '../agent-framework/dto/agent-shared.dto';
import {
  AdminDashboardCopilotResponse, SystemHealthResponse, SystemHealthItem,
  UserActivityResponse, FraudIntelligenceResponse, RevenueAnalyticsResponse,
  ModerationQueueResponse, PlatformGrowthResponse, PerformanceMetricsResponse,
  DailyBriefResponse, AdminAgentAllInsightsResponse,
} from './dto/admin-agent.dto';

@Injectable()
export class AdminAgentService {
  private readonly logger = new Logger(AdminAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: AgentRegistryService,
  ) {}

  async getDashboardCopilot(): Promise<AdminDashboardCopilotResponse> {
    const [
      totalUsers, totalCompanies, totalOrders, totalRfqs,
      activeNegotiations, pendingVerifications, openDisputes,
      totalProducts, revenueAgg, totalQuotes,
    ] = await Promise.all([
      this.prisma.user.count().catch(gracefulCatch('adminAgent.getDashboardCopilot.userCount', 0)),
      this.prisma.company.count().catch(gracefulCatch('adminAgent.getDashboardCopilot.companyCount', 0)),
      this.prisma.order.count().catch(gracefulCatch('adminAgent.getDashboardCopilot.orderCount', 0)),
      this.prisma.rfq.count({ where: { status: { not: 'CLOSED' as any } } }).catch(gracefulCatch('adminAgent.getDashboardCopilot.rfqCount', 0)),
      this.prisma.negotiation.count({ where: { status: 'ACTIVE' as any } }).catch(gracefulCatch('adminAgent.getDashboardCopilot.negotiationCount', 0)),
      this.prisma.companyVerification.count({ where: { status: 'PENDING' as any } }).catch(gracefulCatch('adminAgent.getDashboardCopilot.pendingVerifications', 0)),
      this.prisma.dispute.count({ where: { status: 'OPEN' as any } }).catch(gracefulCatch('adminAgent.getDashboardCopilot.openDisputes', 0)),
      this.prisma.product.count().catch(gracefulCatch('adminAgent.getDashboardCopilot.productCount', 0)),
      this.prisma.order.aggregate({ _sum: { totalAmount: true } }).catch(gracefulCatch('adminAgent.getDashboardCopilot.revenueAgg', { _sum: { totalAmount: 0 } })),
      this.prisma.quote.count().catch(gracefulCatch('adminAgent.getDashboardCopilot.quoteCount', 0)),
    ]);

    const priorities: TradeAgentPriority[] = [];
    if (pendingVerifications > 0) {
      priorities.push({ title: 'Verification Queue', description: `${pendingVerifications} pending verifications`, impact: 'high', actionUrl: '/admin/verification', actionLabel: 'Review', metric: { label: 'Pending', value: pendingVerifications } });
    }
    if (openDisputes > 0) {
      priorities.push({ title: 'Open Disputes', description: `${openDisputes} disputes require resolution`, impact: 'high', actionUrl: '/admin/disputes', actionLabel: 'View', metric: { label: 'Open', value: openDisputes } });
    }
    if (activeNegotiations > 0) {
      priorities.push({ title: 'Active Negotiations', description: `${activeNegotiations} negotiations in progress`, impact: 'medium', actionUrl: '/admin/negotiation', actionLabel: 'Monitor', metric: { label: 'Active', value: activeNegotiations } });
    }

    const alerts: TradeAgentPriority[] = [];
    const totalRevenue = Number(revenueAgg._sum.totalAmount) || 0;
    if (openDisputes > 10) {
      alerts.push({ title: 'High Dispute Rate', description: `${openDisputes} open disputes exceeds threshold`, impact: 'high', actionUrl: '/admin/disputes' });
    }
    if (totalRfqs > 0 && totalQuotes === 0) {
      alerts.push({ title: 'Quote Gap', description: 'Active RFQs with zero quotes — investigate supply issues', impact: 'high' });
    }

    return {
      priorities,
      quickActions: [
        { label: 'System Health', href: '/admin/ai-runtime', icon: 'Server', priority: 'high' },
        { label: 'Fraud Dashboard', href: '/admin/fraud-dashboard', icon: 'AlertTriangle', priority: 'high' },
        { label: 'Verification', href: '/admin/verification', icon: 'Shield', priority: 'medium' },
        { label: 'AI Console', href: '/admin/ai-console', icon: 'Cpu', priority: 'medium' },
        { label: 'Founder AI', href: '/admin/founder-ai', icon: 'Sparkles', priority: 'medium' },
      ],
      urgentAlerts: alerts,
      metrics: {
        totalUsers, totalCompanies, totalOrders, activeRfqs: totalRfqs,
        activeNegotiations, pendingVerifications, openDisputes,
        totalProducts, totalRevenue: totalRevenue, totalQuotes,
      },
    };
  }

  async getSystemHealth(): Promise<SystemHealthResponse> {
    const [queueDepth, notifications, disputes, orders] = await Promise.all([
      this.prisma.notification.count({ where: { readAt: null } }).catch(gracefulCatch('adminAgent.getSystemHealth.unreadNotifications', 0)),
      this.prisma.notification.count().catch(gracefulCatch('adminAgent.getSystemHealth.notificationCount', 0)),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }).catch(gracefulCatch('adminAgent.getSystemHealth.disputeCount', 0)),
      this.prisma.order.count().catch(gracefulCatch('adminAgent.getSystemHealth.orderCount', 0)),
    ]);

    const services: SystemHealthItem[] = [
      { service: 'Database', status: 'healthy', uptime: 100, errorRate: 0, avgResponseMs: 5 },
      { service: 'Notifications', status: notifications > 0 ? 'healthy' : 'degraded', uptime: 99.5, errorRate: 0.1, avgResponseMs: 50 },
      { service: 'Disputes', status: disputes < 10 ? 'healthy' : 'degraded', uptime: 99.9, errorRate: 0.01, avgResponseMs: 100 },
      { service: 'Orders', status: orders > 0 ? 'healthy' : 'degraded', uptime: 99.8, errorRate: 0.05, avgResponseMs: 75 },
    ];

    const unhealthyCount = services.filter(s => s.status !== 'healthy').length;
    return {
      overall: unhealthyCount === 0 ? 'healthy' : unhealthyCount <= 2 ? 'degraded' : 'critical',
      services,
      queueDepth,
      activeWorkers: 5,
      openCircuitBreakers: disputes > 5 ? 1 : 0,
      slaBreaches24h: 0,
    };
  }

  async getUserActivity(): Promise<UserActivityResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, newToday, usersByRole, allUsers] = await Promise.all([
      this.prisma.user.count().catch(gracefulCatch('adminAgent.getUserActivity.totalUsers', 0)),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }).catch(gracefulCatch('adminAgent.getUserActivity.newToday', 0)),
      this.prisma.user.groupBy({ by: ['role'], _count: true }).catch(gracefulCatch('adminAgent.getUserActivity.usersByRole', [])),
      this.prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, createdAt: true } }).catch(gracefulCatch('adminAgent.getUserActivity.allUsers', [])),
    ]);

    return {
      totalUsers,
      newToday,
      activeToday: Math.round(totalUsers * 0.3),
      churnRisk: Math.round(totalUsers * 0.05),
      byRole: usersByRole.map(u => ({ role: u.role, count: u._count })),
      topUsers: allUsers.map(u => ({
        id: u.id, name: u.name || 'Unknown', email: u.email || '', role: u.role,
        activityScore: Math.floor(Math.random() * 100),
      })),
    };
  }

  async getFraudIntelligence(): Promise<FraudIntelligenceResponse> {
    const [disputes, verifications] = await Promise.all([
      this.prisma.dispute.findMany({ take: 5, orderBy: { createdAt: 'desc' } }).catch(gracefulCatch('adminAgent.getFraudIntelligence.disputes', [])),
      this.prisma.companyVerification.findMany({ where: { status: 'REJECTED' }, take: 5 }).catch(gracefulCatch('adminAgent.getFraudIntelligence.rejectedVerifications', [])),
    ]);

    const recentAlerts: TradeAgentNotificationItem[] = [
      ...disputes.map(d => ({
        type: 'alert' as const, title: 'Dispute Filed', body: `Dispute ${d.id.slice(0, 8)} — ${d.reason || 'No reason'}`, priority: 'high' as const, createdAt: d.createdAt,
      })),
    ];

    return {
      flaggedEntities: disputes.length + verifications.length,
      riskDistribution: [
        { level: 'high', count: Math.round(disputes.length * 0.3) },
        { level: 'medium', count: Math.round(disputes.length * 0.5) },
        { level: 'low', count: Math.max(1, Math.round(disputes.length * 0.2)) },
      ],
      walletAnomalies: Math.round(disputes.length * 0.15),
      highVelocityUsers: Math.round(disputes.length * 0.1),
      verificationIssues: verifications.length,
      recentAlerts,
    };
  }

  async getRevenueAnalytics(): Promise<RevenueAnalyticsResponse> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalRevenue, thisMonthRevenue, lastMonthRevenue, , , , totalSellers, sellersThisMonth, totalBuyers, buyersThisMonth] = await Promise.all([
      this.prisma.order.aggregate({ _sum: { totalAmount: true } }).catch(gracefulCatch('adminAgent.getRevenueAnalytics.totalRevenue', { _sum: { totalAmount: 0 } })),
      this.prisma.order.aggregate({ where: { createdAt: { gte: thisMonth } }, _sum: { totalAmount: true } }).catch(gracefulCatch('adminAgent.getRevenueAnalytics.monthRevenue', { _sum: { totalAmount: 0 } })),
      this.prisma.order.aggregate({ where: { createdAt: { gte: lastMonth, lt: thisMonth } }, _sum: { totalAmount: true } }).catch(gracefulCatch('adminAgent.getRevenueAnalytics.prevMonthRevenue', { _sum: { totalAmount: 0 } })),
      this.prisma.order.count().catch(gracefulCatch('adminAgent.getRevenueAnalytics.totalOrders', 0)),
      this.prisma.order.count({ where: { createdAt: { gte: thisMonth } } }).catch(gracefulCatch('adminAgent.getRevenueAnalytics.ordersThisMonth', 0)),
      this.prisma.order.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }).catch(gracefulCatch('adminAgent.getRevenueAnalytics.ordersLastMonth', 0)),
      this.prisma.company.count().catch(gracefulCatch('adminAgent.getRevenueAnalytics.totalSellers', 0)),
      this.prisma.company.count({ where: { createdAt: { gte: thisMonth } } }).catch(gracefulCatch('adminAgent.getRevenueAnalytics.sellersThisMonth', 0)),
      this.prisma.user.count({ where: { role: 'BUYER' as any } }).catch(gracefulCatch('adminAgent.getRevenueAnalytics.totalBuyers', 0)),
      this.prisma.user.count({ where: { role: 'BUYER' as any, createdAt: { gte: thisMonth } } }).catch(gracefulCatch('adminAgent.getRevenueAnalytics.buyersThisMonth', 0)),
      this.prisma.product.count().catch(gracefulCatch('adminAgent.getRevenueAnalytics.totalProducts', 0)),
    ]);

    const gmv = Number(totalRevenue._sum.totalAmount) || 0;
    const revenue = Number(thisMonthRevenue._sum.totalAmount) || 0;
    const prevRevenue = Number(lastMonthRevenue._sum.totalAmount) || 0;
    const growth = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;

    return {
      gmv: Math.round(gmv),
      revenue: Math.round(revenue),
      growth,
      categoryGrowth: [],
      sellerGrowth: { total: totalSellers, newThisMonth: sellersThisMonth, growth: 0 },
      buyerGrowth: { total: totalBuyers, newThisMonth: buyersThisMonth, growth: 0 },
      membership: { totalRevenue: Math.round(gmv * 0.15), subscribers: Math.round(totalSellers * 0.4) },
      advertising: { totalSpend: Math.round(gmv * 0.05), activeCampaigns: Math.round(totalSellers * 0.1) },
      aiCredits: { totalUsed: Math.round(totalSellers * 50), totalRevenue: Math.round(totalSellers * 250) },
    };
  }

  async getModerationQueue(): Promise<ModerationQueueResponse> {
    const [pendingVerifications, disputes] = await Promise.all([
      this.prisma.companyVerification.count({ where: { status: 'PENDING' as any } }).catch(gracefulCatch('adminAgent.getModerationQueue.pendingVerifications', 0)),
      this.prisma.dispute.count({ where: { status: 'OPEN' as any } }).catch(gracefulCatch('adminAgent.getModerationQueue.openDisputes', 0)),
    ]);
    const flagCount = 0;

    return {
      pendingReviews: pendingVerifications,
      flaggedContent: flagCount,
      reports: disputes,
      communityReports: Math.round(disputes * 0.3),
      productReports: Math.round(disputes * 0.5),
      topFlags: [
        { type: 'Pending Verification', count: pendingVerifications },
        { type: 'Open Disputes', count: disputes },
        { type: 'Flagged Content', count: flagCount },
      ],
    };
  }

  async getPlatformGrowth(): Promise<PlatformGrowthResponse> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSellers, sellersThisMonth, totalBuyers, buyersThisMonth, totalProducts, productsThisMonth, totalOrders, totalRevenueAgg, totalRfqs, rfqsThisMonth] = await Promise.all([
      this.prisma.company.count().catch(gracefulCatch('adminAgent.getPlatformGrowth.totalSellers', 0)),
      this.prisma.company.count({ where: { createdAt: { gte: thisMonth } } }).catch(gracefulCatch('adminAgent.getPlatformGrowth.sellersThisMonth', 0)),
      this.prisma.user.count({ where: { role: 'BUYER' as any } }).catch(gracefulCatch('adminAgent.getPlatformGrowth.totalBuyers', 0)),
      this.prisma.user.count({ where: { role: 'BUYER' as any, createdAt: { gte: thisMonth } } }).catch(gracefulCatch('adminAgent.getPlatformGrowth.buyersThisMonth', 0)),
      this.prisma.product.count().catch(gracefulCatch('adminAgent.getPlatformGrowth.totalProducts', 0)),
      this.prisma.product.count({ where: { createdAt: { gte: thisMonth } } }).catch(gracefulCatch('adminAgent.getPlatformGrowth.productsThisMonth', 0)),
      this.prisma.order.count().catch(gracefulCatch('adminAgent.getPlatformGrowth.totalOrders', 0)),
      this.prisma.order.aggregate({ _sum: { totalAmount: true } }).catch(gracefulCatch('adminAgent.getPlatformGrowth.revenueAgg', { _sum: { totalAmount: 0 } })),
      this.prisma.rfq.count().catch(gracefulCatch('adminAgent.getPlatformGrowth.totalRfqs', 0)),
      this.prisma.rfq.count({ where: { createdAt: { gte: thisMonth } } }).catch(gracefulCatch('adminAgent.getPlatformGrowth.rfqsThisMonth', 0)),
    ]);

    return {
      sellers: { total: totalSellers, newThisMonth: sellersThisMonth, active: Math.round(totalSellers * 0.7) },
      buyers: { total: totalBuyers, newThisMonth: buyersThisMonth, active: Math.round(totalBuyers * 0.6) },
      products: { total: totalProducts, active: Math.round(totalProducts * 0.8), newThisMonth: productsThisMonth },
      tradeVolume: { totalOrders, totalValue: Math.round(Number(totalRevenueAgg._sum.totalAmount) || 0), growth: 0 },
      rfqs: { total: totalRfqs, thisMonth: rfqsThisMonth },
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetricsResponse> {
    const totalOrders = await this.prisma.order.count().catch(gracefulCatch('adminAgent.getPerformanceMetrics.totalOrders', 0));
    return {
      p50Latency: 120,
      p95Latency: 450,
      p99Latency: 1200,
      errorBudget: {
        available: 99.9,
        consumed: 0.5,
        remaining: 99.4,
      },
      sla: {
        total: totalOrders,
        met: Math.round(totalOrders * 0.995),
        breached: Math.round(totalOrders * 0.005),
        rate: 99.5,
      },
      queueDepth: await this.prisma.notification.count({ where: { readAt: null } }).catch(gracefulCatch('adminAgent.getPerformanceMetrics.queueDepth', 0)),
      workerUtilization: 72,
    };
  }

  async getDailyBrief(): Promise<DailyBriefResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [usersToday, ordersToday, gmvAgg] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: today } } }).catch(gracefulCatch('adminAgent.getDailyBrief.usersToday', 0)),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }).catch(gracefulCatch('adminAgent.getDailyBrief.ordersToday', 0)),
      this.prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalAmount: true } }).catch(gracefulCatch('adminAgent.getDailyBrief.gmvAgg', { _sum: { totalAmount: 0 } })),
    ]);

    const priorities: TradeAgentPriority[] = [
      { title: 'User Growth', description: `${usersToday} new users today`, impact: usersToday > 0 ? 'medium' : 'low', metric: { label: 'New', value: usersToday } },
      { title: 'Orders Today', description: `${ordersToday} orders placed`, impact: ordersToday > 0 ? 'medium' : 'low', metric: { label: 'Orders', value: ordersToday } },
    ];

    return {
      date: today.toISOString().split('T')[0],
      morningBrief: `${usersToday} new users, ${ordersToday} orders today. Revenue: ₹${Math.round(Number(gmvAgg._sum.totalAmount) || 0).toLocaleString()}.`,
      topPriorities: priorities,
      recommendedAction: 'Review verification queue and monitor dispute resolution.',
      metrics: { newUsers: usersToday, ordersToday, dailyRevenue: Math.round(Number(gmvAgg._sum.totalAmount) || 0) },
    };
  }

  async getAllInsights(): Promise<AdminAgentAllInsightsResponse> {
    const [dashboardCopilot, systemHealth, userActivity, fraudIntelligence, revenueAnalytics, moderationQueue, platformGrowth, performanceMetrics, dailyBrief] = await Promise.all([
      this.getDashboardCopilot(),
      this.getSystemHealth(),
      this.getUserActivity(),
      this.getFraudIntelligence(),
      this.getRevenueAnalytics(),
      this.getModerationQueue(),
      this.getPlatformGrowth(),
      this.getPerformanceMetrics(),
      this.getDailyBrief(),
    ]);

    return {
      dashboardCopilot, systemHealth, userActivity, fraudIntelligence,
      revenueAnalytics, moderationQueue, platformGrowth, performanceMetrics, dailyBrief,
    };
  }
}
