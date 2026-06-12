import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsTimeRange } from './dto/analytics-query.dto';

@Injectable()
export class SellerAnalyticsService {
  private readonly logger = new Logger(SellerAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(range: AnalyticsTimeRange): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;
    switch (range) {
      case AnalyticsTimeRange.TODAY:
        start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        break;
      case AnalyticsTimeRange.DAYS_7:
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsTimeRange.DAYS_30:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsTimeRange.DAYS_90:
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsTimeRange.YEAR_1:
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsTimeRange.LIFETIME:
        start = new Date(0);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return { start, end };
  }

  async getDashboardSummary(companyId: string, range: AnalyticsTimeRange = AnalyticsTimeRange.DAYS_30) {
    const { start, end } = this.getDateRange(range);
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: {
        trustScore: true,
        responseRate: true,
        profileCompletionPercentage: true,
        goCashBalance: true,
        totalProducts: true,
        createdAt: true,
      },
    });
    if (!company) return null;

    const events = await this.prisma.sellerAnalyticsEvent.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } },
    });

    const profileViews = events.filter((e) => e.eventType === 'PROFILE_VIEW').length;
    const productViews = events.filter((e) => e.eventType === 'PRODUCT_VIEW').length;
    const rfqs = events.filter((e) => e.eventType === 'RFQ_SUBMITTED').length;
    const orders = events.filter((e) => e.eventType === 'ORDER_PLACED').length;
    const searchImpressions = events.filter((e) => e.eventType === 'SEARCH_IMPRESSION').length;
    const searchClicks = events.filter((e) => e.eventType === 'SEARCH_CLICK').length;
    const quotesSent = events.filter((e) => e.eventType === 'QUOTE_SENT').length;
    const quotesAccepted = events.filter((e) => e.eventType === 'QUOTE_ACCEPTED').length;

    const goCashEvents = await this.prisma.goCashTransaction.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } },
    });
    const goCashEarned = goCashEvents
      .filter((t) => ['EARNED', 'BONUS', 'REFERRAL'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      profileViews,
      productViews,
      rfqs,
      orders,
      trustScore: company.trustScore,
      responseRate: company.responseRate,
      searchImpressions,
      searchClicks,
      ctr: searchImpressions > 0 ? Math.round((searchClicks / searchImpressions) * 100) : 0,
      quoteConversion: quotesSent > 0 ? Math.round((quotesAccepted / quotesSent) * 100) : 0,
      rfqWinRate: rfqs > 0 ? Math.round((orders / rfqs) * 100) : 0,
      profileCompletion: company.profileCompletionPercentage,
      goCashEarned,
      goCashBalance: company.goCashBalance,
      totalProducts: company.totalProducts,
      period: { start, end, range: range.toString() },
    };
  }

  async getCharts(companyId: string, range: AnalyticsTimeRange = AnalyticsTimeRange.DAYS_30) {
    const { start, end } = this.getDateRange(range);
    const events = await this.prisma.sellerAnalyticsEvent.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, Record<string, number>>();
    events.forEach((event) => {
      const day = event.createdAt.toISOString().slice(0, 10);
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { profileViews: 0, productViews: 0, rfqs: 0, orders: 0, searchClicks: 0 });
      }
      const dayData = dailyMap.get(day)!;
      switch (event.eventType) {
        case 'PROFILE_VIEW': dayData.profileViews++; break;
        case 'PRODUCT_VIEW': dayData.productViews++; break;
        case 'RFQ_SUBMITTED': dayData.rfqs++; break;
        case 'ORDER_PLACED': dayData.orders++; break;
        case 'SEARCH_CLICK': dayData.searchClicks++; break;
      }
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { daily, period: { start, end, range: range.toString() } };
  }

  async getPerformanceMetrics(companyId: string, range: AnalyticsTimeRange = AnalyticsTimeRange.DAYS_30) {
    const dashboard = await this.getDashboardSummary(companyId, range);
    if (!dashboard) return null;

    const { data: goCashHistory } = await this.getGoCashHistory(companyId, range);

    return {
      overview: dashboard,
      goCashHistory,
    };
  }

  private async getGoCashHistory(companyId: string, range: AnalyticsTimeRange) {
    const { start, end } = this.getDateRange(range);
    const transactions = await this.prisma.goCashTransaction.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
    });
    return { data: transactions };
  }

  async trackEvent(
    companyId: string,
    eventType: string,
    metadata: Record<string, unknown> | null,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const event = await this.prisma.sellerAnalyticsEvent.create({
      data: {
        companyId,
        userId,
        eventType: eventType as any,
        metadata: (metadata ?? undefined) as any,
        ipAddress,
        userAgent,
      },
    });
    return event;
  }
}
