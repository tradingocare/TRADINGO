import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClickhouseService } from './clickhouse.service';

export interface DashboardQuery {
  companyId?: string;
  range?: 'today' | '7d' | '30d' | '90d' | '1y' | 'lifetime';
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly clickhouse: ClickhouseService,
    private readonly prisma: PrismaService,
  ) {}

  async getSellerDashboard(companyId: string, query: DashboardQuery) {
    const { start, end } = this.getDateRange(query);
    const range = { start: start.toISOString(), end: end.toISOString() };

    const [daily, leaderboard, goCash] = await Promise.all([
      this.getDailyMetrics(companyId, start, end),
      this.getSellerLeaderboardPosition(companyId),
      this.getGoCashMetrics(companyId, start, end),
    ]);

    const revenue = daily.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
    const orders = daily.reduce((sum, d) => sum + Number(d.orders || 0), 0);
    const rfqs = daily.reduce((sum, d) => sum + Number(d.rfqs || 0), 0);
    const quotesSent = daily.reduce((sum, d) => sum + Number(d.quotes_sent || 0), 0);
    const quotesAccepted = daily.reduce((sum, d) => sum + Number(d.quotes_accepted || 0), 0);
    const profileViews = daily.reduce((sum, d) => sum + Number(d.profile_views || 0), 0);

    return {
      overview: {
        revenue,
        orders,
        rfqs,
        quotesSent,
        quotesAccepted,
        profileViews,
        conversionRate: quotesSent > 0 ? Math.round((quotesAccepted / quotesSent) * 10000) / 100 : 0,
        responseRate: 0,
        disputeRate: 0,
      },
      leaderboard: {
        rank: leaderboard?.rank ?? 0,
        totalRevenue: leaderboard?.total_revenue ?? 0,
      },
      goCash: {
        earned: goCash.reduce((s, r) => s + Number(r.total_earned || 0), 0),
        redeemed: goCash.reduce((s, r) => s + Number(r.total_redeemed || 0), 0),
      },
      daily,
      period: range,
    };
  }

  async getAdminDashboard(query: DashboardQuery) {
    const { start, end } = this.getDateRange(query);
    const range = { start: start.toISOString(), end: end.toISOString() };

    const [sellerStats, orderStats, disputeStats, paymentStats, growth] = await Promise.all([
      this.getSellerStats(start, end),
      this.getOrderStats(start, end),
      this.getDisputeStats(start, end),
      this.getPaymentStats(start, end),
      this.getGrowthMetrics(start, end),
    ]);

    return {
      gmv: Number(orderStats[0]?.revenue || 0),
      totalSellers: Number(sellerStats[0]?.total_sellers || 0),
      totalBuyers: 0,
      rfqs: Number(sellerStats[0]?.total_rfqs || 0),
      orders: Number(orderStats[0]?.total_orders || 0),
      disputes: Number(disputeStats[0]?.total_disputes || 0),
      payments: Number(paymentStats[0]?.total_payments || 0),
      settlements: 0,
      growth,
      period: range,
    };
  }

  async getSellerDailyMetrics(companyId: string, query: DashboardQuery) {
    const { start, end } = this.getDateRange(query);
    return this.getDailyMetrics(companyId, start, end);
  }

  async getCompletionRate(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const orderWhere: any = {};
    if (startDate || endDate) orderWhere.createdAt = dateFilter;

    const [completed, cancelled, disputed] = await Promise.all([
      this.prisma.order.count({ where: { ...orderWhere, status: 'COMPLETED', deletedAt: null } }),
      this.prisma.order.count({ where: { ...orderWhere, status: 'CANCELLED', deletedAt: null } }),
      this.prisma.dispute.count({ where: { ...orderWhere, status: { not: 'RESOLVED' } } }),
    ]);

    const total = completed + cancelled + disputed;
    return {
      totalOrders: total,
      completedOrders: completed,
      cancelledOrders: cancelled,
      openDisputes: disputed,
      completionRate: total > 0 ? Math.round((completed / total) * 10000) / 100 : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 10000) / 100 : 0,
      disputeRate: total > 0 ? Math.round((disputed / total) * 10000) / 100 : 0,
    };
  }

  async getSellerLeaderboard(limit = 100) {
    return this.clickhouse.query<{
      company_id: string;
      total_orders: number;
      total_revenue: number;
      rank: number;
    }>(
      `SELECT company_id, total_orders, total_revenue, rank()
       OVER (ORDER BY total_revenue DESC) AS rank
       FROM tradingo.leaderboard_metrics
       ORDER BY total_revenue DESC
       LIMIT {limit:UInt32}`,
      { limit },
    );
  }

  async getSellerLeaderboardPosition(companyId: string) {
    const result = await this.clickhouse.query<{
      company_id: string;
      total_revenue: number;
      rank: number;
    }>(
      `SELECT company_id, total_revenue, rank
       FROM (
         SELECT company_id, total_revenue,
                row_number() OVER (ORDER BY total_revenue DESC) AS rank
         FROM tradingo.leaderboard_metrics
       )
       WHERE company_id = {companyId:String}`,
      { companyId },
    );
    return result[0] ?? null;
  }

  async getCharts(companyId: string, query: DashboardQuery) {
    const { start, end } = this.getDateRange(query);
    const daily = await this.getDailyMetrics(companyId, start, end);
    return { daily, period: { start: start.toISOString(), end: end.toISOString() } };
  }

  private async getDailyMetrics(companyId: string, start: Date, end: Date) {
    return this.clickhouse.query<{
      day: string;
      orders: number;
      rfqs: number;
      quotes_sent: number;
      quotes_accepted: number;
      profile_views: number;
      product_views: number;
      search_impressions: number;
      search_clicks: number;
      revenue: number;
    }>(
      `SELECT day, orders, rfqs, quotes_sent, quotes_accepted,
              profile_views, product_views, search_impressions, search_clicks,
              revenue
       FROM tradingo.daily_metrics
       WHERE company_id = {companyId:String}
         AND day >= {start:Date}
         AND day <= {end:Date}
       ORDER BY day ASC`,
      { companyId, start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
    );
  }

  private async getGoCashMetrics(companyId: string, start: Date, end: Date) {
    return this.clickhouse.query<{
      month: string;
      total_earned: number;
      total_redeemed: number;
    }>(
      `SELECT month, total_earned, total_redeemed
       FROM tradingo.tradgo_metrics
       WHERE company_id = {companyId:String}
         AND month >= {start:Date}
         AND month <= {end:Date}
       ORDER BY month ASC`,
      { companyId, start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
    );
  }

  private async getSellerStats(start: Date, end: Date) {
    return this.clickhouse.query<{
      total_sellers: number;
      total_rfqs: number;
    }>(
      `SELECT count(DISTINCT company_id) AS total_sellers,
              sum(rfqs) AS total_rfqs
       FROM tradingo.daily_metrics
       WHERE day >= {start:Date} AND day <= {end:Date}`,
      { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
    );
  }

  private async getOrderStats(start: Date, end: Date) {
    return this.clickhouse.query<{
      total_orders: number;
      revenue: number;
    }>(
      `SELECT sum(orders) AS total_orders, sum(revenue) AS revenue
       FROM tradingo.daily_metrics
       WHERE day >= {start:Date} AND day <= {end:Date}`,
      { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
    );
  }

  private async getDisputeStats(start: Date, end: Date) {
    return this.clickhouse.query<{
      total_disputes: number;
      resolved_disputes: number;
      sla_breaches: number;
    }>(
      `SELECT sum(total_disputes) AS total_disputes,
              sum(resolved_disputes) AS resolved_disputes,
              sum(sla_breaches) AS sla_breaches
       FROM tradingo.dispute_metrics
       WHERE month >= {start:Date} AND month <= {end:Date}`,
      { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
    );
  }

  private async getPaymentStats(start: Date, end: Date) {
    return this.clickhouse.query<{
      total_payments: number;
    }>(
      `SELECT sum(payments) AS total_payments
       FROM tradingo.daily_metrics
       WHERE day >= {start:Date} AND day <= {end:Date}`,
      { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
    );
  }

  private async getGrowthMetrics(start: Date, end: Date) {
    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (86400000)));
    const midPoint = new Date(start.getTime() + days * 43200000);

    const [firstHalf, secondHalf] = await Promise.all([
      this.getOrderStats(start, midPoint),
      this.getOrderStats(midPoint, end),
    ]);

    const firstRevenue = Number(firstHalf[0]?.revenue || 0);
    const secondRevenue = Number(secondHalf[0]?.revenue || 0);

    return {
      revenue: secondRevenue,
      growthRate: firstRevenue > 0 ? Math.round(((secondRevenue - firstRevenue) / firstRevenue) * 10000) / 100 : 0,
    };
  }

  private getDateRange(query: DashboardQuery): { start: Date; end: Date } {
    const end = query.endDate ? new Date(query.endDate) : new Date();
    let start: Date;

    if (query.startDate) {
      start = new Date(query.startDate);
    } else {
      switch (query.range) {
        case 'today':
          start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          break;
        case '7d':
          start = new Date(end.getTime() - 7 * 86400000);
          break;
        case '90d':
          start = new Date(end.getTime() - 90 * 86400000);
          break;
        case '1y':
          start = new Date(end.getTime() - 365 * 86400000);
          break;
        case 'lifetime':
          start = new Date(0);
          break;
        default:
          start = new Date(end.getTime() - 30 * 86400000);
      }
    }

    return { start, end };
  }
}
