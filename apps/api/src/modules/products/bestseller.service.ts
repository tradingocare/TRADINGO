import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BestsellerAnalyticsService } from './bestseller-analytics.service';
import { BestsellerQueryDto } from './dto/bestseller-query.dto';
import { TrendingQueryDto, TopCategoriesQueryDto, TopSellersQueryDto, NearMeQueryDto } from './dto/ranking-query.dto';

interface ProductScore {
  productId: string;
  companyId: string;
  categoryId: string | null;
  score: number;
  salesCount: number;
  revenue: number;
  views: number;
  rfqs: number;
  quotes: number;
  conversionRate: number;
  trustScore: number;
  growthRate: number;
}

interface CategoryScore {
  categoryId: string;
  score: number;
  productCount: number;
  totalSales: number;
  totalRevenue: number;
  growthRate: number;
}

interface SellerScore {
  companyId: string;
  score: number;
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  avgTrustScore: number;
  responseRate: number;
  growthRate: number;
}

const RANKING_WEIGHTS = {
  salesCount: 0.30,
  revenue: 0.20,
  views: 0.10,
  rfqs: 0.10,
  quotes: 0.05,
  conversionRate: 0.10,
  trustScore: 0.10,
  growthRate: 0.05,
};

@Injectable()
export class BestsellerService {
  private readonly logger = new Logger(BestsellerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: BestsellerAnalyticsService,
  ) {}

  async calculateWeeklySnapshots(): Promise<void> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(now);
    const prevWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekEnd = new Date(weekStart.getTime() - 1);

    this.logger.log(`Calculating weekly bestseller snapshots for ${weekStart.toISOString()} - ${weekEnd.toISOString()}`);

    await this.calculateProductSnapshots(weekStart, weekEnd, prevWeekStart, prevWeekEnd);
    await this.calculateCategorySnapshots(weekStart, weekEnd, prevWeekStart, prevWeekEnd);
    await this.calculateSellerSnapshots(weekStart, weekEnd, prevWeekStart, prevWeekEnd);

    await this.analytics.trackCalculationTotal();
    this.logger.log('Weekly bestseller calculation completed');
  }

  private async calculateProductSnapshots(weekStart: Date, weekEnd: Date, prevWeekStart: Date, prevWeekEnd: Date): Promise<void> {
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: {
        company: { select: { trustScore: true } },
        category: { select: { id: true } },
      },
    });

    if (products.length === 0) {
      this.logger.warn('No active products found for bestseller calculation');
      return;
    }

    const productIds = products.map(p => p.id);
    const companyIds = [...new Set(products.map(p => p.companyId))];

    const currentOrders = await this.getProductOrderCounts(productIds, weekStart, weekEnd);
    const previousOrders = await this.getProductOrderCounts(productIds, prevWeekStart, prevWeekEnd);

    const currentRevenue = await this.getProductRevenue(productIds, weekStart, weekEnd);

    const currentRfqs = await this.getCategoryRfqCounts(products, weekStart, weekEnd);
    const currentQuotes = await this.getCompanyQuoteCounts(companyIds, weekStart, weekEnd);

    const scores: ProductScore[] = products.map(product => {
      const salesCount = currentOrders.get(product.id) || 0;
      const prevSales = previousOrders.get(product.id) || 0;
      const revenue = currentRevenue.get(product.id) || 0;
      const views = product.viewCount;
      const rfqs = currentRfqs.get(product.id) || 0;
      const quotes = currentQuotes.get(product.companyId) || 0;
      const trustScore = product.company.trustScore || product.trustScoreSnapshot || 0;
      const conversionRate = views > 0 ? parseFloat((salesCount / views).toFixed(4)) : 0;
      const growthRate = prevSales > 0 ? parseFloat(((salesCount - prevSales) / prevSales).toFixed(4)) : salesCount > 0 ? 1.0 : 0;

      const score = parseFloat((
        salesCount * RANKING_WEIGHTS.salesCount +
        revenue * RANKING_WEIGHTS.revenue +
        views * RANKING_WEIGHTS.views +
        rfqs * RANKING_WEIGHTS.rfqs +
        quotes * RANKING_WEIGHTS.quotes +
        conversionRate * RANKING_WEIGHTS.conversionRate +
        trustScore * RANKING_WEIGHTS.trustScore +
        growthRate * RANKING_WEIGHTS.growthRate
      ).toFixed(4));

      return {
        productId: product.id,
        companyId: product.companyId,
        categoryId: product.category?.id || null,
        score,
        salesCount,
        revenue,
        views,
        rfqs,
        quotes,
        conversionRate,
        trustScore,
        growthRate,
      };
    });

    scores.sort((a, b) => b.score - a.score);

    const snapshots = scores.map((s, i) => ({
      productId: s.productId,
      companyId: s.companyId,
      weekStart,
      weekEnd,
      rank: i + 1,
      score: s.score,
      salesCount: s.salesCount,
      revenue: s.revenue,
      views: s.views,
      rfqs: s.rfqs,
      quotes: s.quotes,
      conversionRate: s.conversionRate,
      trustScore: s.trustScore,
      growthRate: s.growthRate,
      city: null,
      state: null,
      country: 'IN',
    }));

    await this.prisma.$transaction([
      this.prisma.productBestsellerSnapshot.deleteMany({ where: { weekStart } }),
      this.prisma.productBestsellerSnapshot.createMany({ data: snapshots }),
    ]);

    await this.analytics.trackProductsTotal(snapshots.length);
    this.logger.log(`Created ${snapshots.length} product bestseller snapshots`);
  }

  private async calculateCategorySnapshots(weekStart: Date, weekEnd: Date, prevWeekStart: Date, prevWeekEnd: Date): Promise<void> {
    const categories = await this.prisma.category.findMany({
      include: {
        products: {
          where: { status: 'ACTIVE', deletedAt: null },
          select: { id: true },
        },
      },
    });

    const scores: CategoryScore[] = [];

    for (const category of categories) {
      const productIds = category.products.map(p => p.id);
      if (productIds.length === 0) continue;

      const currentOrders = await this.getProductOrderCounts(productIds, weekStart, weekEnd);
      const previousOrders = await this.getProductOrderCounts(productIds, prevWeekStart, prevWeekEnd);

      const currentRevenue = await this.getProductRevenue(productIds, weekStart, weekEnd);

      const totalSales = Array.from(currentOrders.values()).reduce((a, b) => a + b, 0);
      const prevSales = Array.from(previousOrders.values()).reduce((a, b) => a + b, 0);
      const totalRevenue = Array.from(currentRevenue.values()).reduce((a, b) => a + b, 0);
      const growthRate = prevSales > 0 ? parseFloat(((totalSales - prevSales) / prevSales).toFixed(4)) : totalSales > 0 ? 1.0 : 0;

      const score = parseFloat((
        totalSales * RANKING_WEIGHTS.salesCount +
        totalRevenue * RANKING_WEIGHTS.revenue +
        productIds.length * 0.05
      ).toFixed(4));

      scores.push({
        categoryId: category.id,
        score,
        productCount: productIds.length,
        totalSales,
        totalRevenue,
        growthRate,
      });
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 0) {
      this.logger.warn('No category data found for bestseller calculation');
      return;
    }

    const snapshots = scores.map((s, i) => ({
      categoryId: s.categoryId,
      weekStart,
      weekEnd,
      rank: i + 1,
      score: s.score,
      productCount: s.productCount,
      totalSales: s.totalSales,
      totalRevenue: s.totalRevenue,
      growthRate: s.growthRate,
      city: null,
      state: null,
      country: 'IN',
    }));

    await this.prisma.$transaction([
      this.prisma.categoryBestsellerSnapshot.deleteMany({ where: { weekStart } }),
      this.prisma.categoryBestsellerSnapshot.createMany({ data: snapshots }),
    ]);

    await this.analytics.trackCategoriesTotal(snapshots.length);
    this.logger.log(`Created ${snapshots.length} category bestseller snapshots`);
  }

  private async calculateSellerSnapshots(weekStart: Date, weekEnd: Date, prevWeekStart: Date, prevWeekEnd: Date): Promise<void> {
    const companies = await this.prisma.company.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        trustScore: true,
        responseRate: true,
        products: {
          where: { status: 'ACTIVE', deletedAt: null },
          select: { id: true },
        },
      },
    });

    const scores: SellerScore[] = [];

    for (const company of companies) {
      const productIds = company.products.map(p => p.id);
      if (productIds.length === 0) continue;

      const currentOrders = await this.getCompanyOrderCounts(company.id, weekStart, weekEnd);
      const previousOrders = await this.getCompanyOrderCounts(company.id, prevWeekStart, prevWeekEnd);

      const currentRevenue = await this.getCompanyRevenue(company.id, weekStart, weekEnd);

      const totalSales = currentOrders;
      const prevSales = previousOrders;
      const totalRevenue = currentRevenue;

      const responseRate = company.responseRate || 0;
      const growthRate = prevSales > 0 ? parseFloat(((totalSales - prevSales) / prevSales).toFixed(4)) : totalSales > 0 ? 1.0 : 0;

      const score = parseFloat((
        totalSales * RANKING_WEIGHTS.salesCount +
        totalRevenue * RANKING_WEIGHTS.revenue +
        productIds.length * 0.05 +
        (company.trustScore || 0) * RANKING_WEIGHTS.trustScore +
        responseRate * 0.05
      ).toFixed(4));

      scores.push({
        companyId: company.id,
        score,
        totalSales,
        totalRevenue,
        totalProducts: productIds.length,
        avgTrustScore: company.trustScore || 0,
        responseRate,
        growthRate,
      });
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 0) {
      this.logger.warn('No seller data found for bestseller calculation');
      return;
    }

    const snapshots = scores.map((s, i) => ({
      companyId: s.companyId,
      weekStart,
      weekEnd,
      rank: i + 1,
      score: s.score,
      totalSales: s.totalSales,
      totalRevenue: s.totalRevenue,
      totalProducts: s.totalProducts,
      avgTrustScore: s.avgTrustScore,
      responseRate: s.responseRate,
      growthRate: s.growthRate,
      city: null,
      state: null,
      country: 'IN',
    }));

    await this.prisma.$transaction([
      this.prisma.sellerBestsellerSnapshot.deleteMany({ where: { weekStart } }),
      this.prisma.sellerBestsellerSnapshot.createMany({ data: snapshots }),
    ]);

    await this.analytics.trackSellersTotal(snapshots.length);
    this.logger.log(`Created ${snapshots.length} seller bestseller snapshots`);
  }

  async getBestsellers(query: BestsellerQueryDto) {
    const limit = query.limit || 20;
    const weekStart = this.getWeekStart(new Date());

    const where: Record<string, unknown> = { weekStart };
    if (query.city) where.city = query.city;
    if (query.state) where.state = query.state;

    const snapshots = await this.prisma.productBestsellerSnapshot.findMany({
      where,
      orderBy: { rank: 'asc' },
      take: limit,
    });

    const productIds = snapshots.map(s => s.productId);
    const products = productIds.length > 0 ? await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, media: { take: 1, select: { url: true } } },
    }) : [];

    const productMap = new Map(products.map(p => [p.id, p]));
    return snapshots.map(s => ({ ...s, product: productMap.get(s.productId) || null }));
  }

  async getTrending(query: TrendingQueryDto) {
    const limit = query.limit || 20;
    const weekStart = this.getWeekStart(new Date());

    const where: Record<string, unknown> = { weekStart };
    if (query.categoryId) {
      const productIds = await this.prisma.product.findMany({
        where: { categoryId: query.categoryId, status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });
      where.productId = { in: productIds.map(p => p.id) };
    }
    if (query.city) where.city = query.city;

    const snapshots = await this.prisma.productBestsellerSnapshot.findMany({
      where,
      orderBy: { growthRate: 'desc' },
      take: limit,
    });

    const productIds = snapshots.map(s => s.productId);
    const products = productIds.length > 0 ? await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, media: { take: 1, select: { url: true } } },
    }) : [];

    const productMap = new Map(products.map(p => [p.id, p]));
    return snapshots.map(s => ({ ...s, product: productMap.get(s.productId) || null }));
  }

  async getTopCategories(query: TopCategoriesQueryDto) {
    const limit = query.limit || 20;
    const weekStart = this.getWeekStart(new Date());

    const where: Record<string, unknown> = { weekStart };
    if (query.city) where.city = query.city;
    if (query.state) where.state = query.state;

    const snapshots = await this.prisma.categoryBestsellerSnapshot.findMany({
      where,
      orderBy: { rank: 'asc' },
      take: limit,
    });

    const categoryIds = snapshots.map(s => s.categoryId);
    const categories = categoryIds.length > 0 ? await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, slug: true },
    }) : [];

    const categoryMap = new Map(categories.map(c => [c.id, c]));
    return snapshots.map(s => ({ ...s, category: categoryMap.get(s.categoryId) || null }));
  }

  async getTopSellers(query: TopSellersQueryDto) {
    const limit = query.limit || 20;
    const weekStart = this.getWeekStart(new Date());

    const where: Record<string, unknown> = { weekStart };
    if (query.city) where.city = query.city;
    if (query.state) where.state = query.state;

    const snapshots = await this.prisma.sellerBestsellerSnapshot.findMany({
      where,
      orderBy: { rank: 'asc' },
      take: limit,
    });

    const companyIds = snapshots.map(s => s.companyId);
    const companies = companyIds.length > 0 ? await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true, slug: true, logo: true },
    }) : [];

    const companyMap = new Map(companies.map(c => [c.id, c]));
    return snapshots.map(s => ({ ...s, company: companyMap.get(s.companyId) || null }));
  }

  async getNearMeTop(query: NearMeQueryDto) {
    const limit = query.limit || 20;
    const weekStart = this.getWeekStart(new Date());

    const where: Record<string, unknown> = { weekStart };
    if (query.city) where.city = query.city;
    if (query.state) where.state = query.state;

    const snapshots = await this.prisma.productBestsellerSnapshot.findMany({
      where,
      orderBy: { score: 'desc' },
      take: limit,
    });

    const productIds = snapshots.map(s => s.productId);
    const products = productIds.length > 0 ? await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true, name: true, slug: true, latitude: true, longitude: true,
        media: { take: 1, select: { url: true } },
      },
    }) : [];

    const productMap = new Map(products.map(p => [p.id, p]));
    return snapshots.map(s => ({ ...s, product: productMap.get(s.productId) || null }));
  }

  private async getProductOrderCounts(productIds: string[], start: Date, end: Date): Promise<Map<string, number>> {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        order: { status: { in: ['COMPLETED', 'DELIVERED', 'DISPATCHED'] }, createdAt: { gte: start, lte: end } },
      },
      _sum: { quantity: true },
    });

    const map = new Map<string, number>();
    for (const item of items) {
      if (item.productId) map.set(item.productId, item._sum.quantity || 0);
    }
    return map;
  }

  private async getProductRevenue(productIds: string[], start: Date, end: Date): Promise<Map<string, number>> {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        order: { status: { in: ['COMPLETED', 'DELIVERED', 'DISPATCHED'] }, createdAt: { gte: start, lte: end } },
      },
      _sum: { totalPrice: true },
    });

    const map = new Map<string, number>();
    for (const item of items) {
      if (item.productId) map.set(item.productId, Number(item._sum.totalPrice) || 0);
    }
    return map;
  }

  private async getCategoryRfqCounts(products: Array<{ id: string; categoryId: string | null }>, start: Date, end: Date): Promise<Map<string, number>> {
    const categoryIds = [...new Set(products.filter(p => p.categoryId).map(p => p.categoryId as string))];
    if (categoryIds.length === 0) return new Map();

    const rfqs = await this.prisma.rfq.groupBy({
      by: ['categoryId'],
      where: {
        categoryId: { in: categoryIds },
        status: { not: 'DRAFT' },
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
    });

    const categoryCounts = new Map<string, number>();
    for (const rfq of rfqs) {
      if (rfq.categoryId) categoryCounts.set(rfq.categoryId, rfq._count.id);
    }

    const productMap = new Map<string, number>();
    for (const product of products) {
      if (product.categoryId) {
        productMap.set(product.id, categoryCounts.get(product.categoryId) || 0);
      }
    }
    return productMap;
  }

  private async getCompanyQuoteCounts(companyIds: string[], start: Date, end: Date): Promise<Map<string, number>> {
    const quotes = await this.prisma.quote.groupBy({
      by: ['companyId'],
      where: {
        companyId: { in: companyIds },
        status: { notIn: ['DRAFT', 'WITHDRAWN', 'EXPIRED'] },
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
    });

    const map = new Map<string, number>();
    for (const q of quotes) {
      map.set(q.companyId, q._count.id);
    }
    return map;
  }

  private async getCompanyOrderCounts(companyId: string, start: Date, end: Date): Promise<number> {
    return this.prisma.order.count({
      where: {
        sellerCompanyId: companyId,
        status: { in: ['COMPLETED', 'DELIVERED', 'DISPATCHED'] },
        createdAt: { gte: start, lte: end },
      },
    });
  }

  private async getCompanyRevenue(companyId: string, start: Date, end: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        sellerCompanyId: companyId,
        status: { in: ['COMPLETED', 'DELIVERED', 'DISPATCHED'] },
        createdAt: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
    });
    return Number(result._sum.totalAmount) || 0;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getWeekEnd(date: Date): Date {
    const d = this.getWeekStart(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
