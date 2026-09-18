import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { CategoryDemandResult } from './dto/category-demand.dto';

const SALES_WEIGHT = 0.40;
const RFQ_WEIGHT = 0.10;
const SEARCH_WEIGHT = 0.15;
const VIEW_WEIGHT = 0.20;
const ENGAGEMENT_WEIGHT = 0.10;
const CONVERSION_WEIGHT = 0.05;

const TOTAL_WEIGHT = SALES_WEIGHT + RFQ_WEIGHT + SEARCH_WEIGHT + VIEW_WEIGHT + ENGAGEMENT_WEIGHT + CONVERSION_WEIGHT; // 1.00

const CACHE_KEY = 'categories:demand:v1';
const CACHE_TTL_SECONDS = 300;

@Injectable()
export class CategoryDemandService {
  private readonly logger = new Logger(CategoryDemandService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get top N categories by demand score.
   * SINGLE bounded Prisma aggregation — NO per-category DB queries.
   * All scoring is done in memory from one fetched dataset.
   * 
   * Architecture compliance: ONE Prisma call → in-memory grouping → signal computation → percentile normalization → score → rank → return.
   * Uses existing Prisma Product fields: monthlyOrders, viewCount, savedCount.
   * No arbitrary fixed caps — scales as data grows.
   */
  async getTopCategories(limit = 20): Promise<CategoryDemandResult> {
    // 0. Cache read-through (Redis, TTL 300s) — the BullMQ 5-min scheduler warms this key.
    const cached = await this.redisService.getJson<CategoryDemandResult>(CACHE_KEY);
    if (cached && cached.data && cached.data.length > 0) {
      if (limit <= cached.data.length) {
        return { data: cached.data.slice(0, limit), meta: { total: cached.meta.total, limit } };
      }
    }

    // 1. ONE Prisma fetch: ROOT-LEVEL active categories only (parentId IS NULL)
    // Root categories are required for the navbar Top-20 strip per founder spec.
    const allCategories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        products: {
          select: {
            monthlyOrders: true,
            viewCount: true,
            savedCount: true,
          },
        },
      },
    });

    const categoriesCount = allCategories.length;

    if (categoriesCount === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          limit,
        },
      };
    }

    // 2. Build parallel array: one product array per category
    const productArrays = allCategories.map((cat) => cat.products || []);

    // 3. Compute raw signal values for EACH category (one pass, all in memory)
    const rawSignals = productArrays.map((products, catIndex) => {
      const cat = allCategories[catIndex];
      const totalProducts = products.length;

      // Sales: total monthlyOrders across products in this category
      const totalMonthlyOrders = products.reduce(
        (sum, p) => sum + (p.monthlyOrders ?? 0),
        0,
      );

      // Search: total viewCount as proxy for search interest
      const totalViews = products.reduce(
        (sum, p) => sum + (p.viewCount ?? 0),
        0,
      );

      // Engagement: savedCount
      const totalSaved = products.reduce(
        (sum, p) => sum + (p.savedCount ?? 0),
        0,
      );

      // Conversion: ratio of orders to views
      const totalViewsForConversion = totalViews;
      const totalOrders = totalMonthlyOrders;
      const conversionRatio = totalViewsForConversion > 0 ? totalOrders / totalViewsForConversion : 0;

      // Recency: fraction of products with data (we use viewCount presence as proxy)
      const productsWithViewData = products.filter(
        (p) => p.viewCount !== undefined,
      );
      const recencyRatio = totalProducts > 0 ? productsWithViewData.length / totalProducts : 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        totalMonthlyOrders,
        totalViews,
        totalSaved,
        conversionRatio,
        recencyRatio,
        totalProducts,
      };
    });

    // 4. Percentile normalization across ALL categories for each signal type
    // Extract each signal array
    const monthlyOrdersArray = rawSignals.map((s) => s.totalMonthlyOrders);
    const viewsArray = rawSignals.map((s) => s.totalViews);
    const savedArray = rawSignals.map((s) => s.totalSaved);
    // const conversionArray = rawSignals.map((s) => s.conversionRatio); // REMOVED

    // Compute percentile ranks (0-100 scale) for each signal
    const getPercentile = (value: number, array: number[]) => {
      if (array.length === 0) return 0;
      const greaterOrEqual = array.filter((v) => v <= value).length;
      return Math.round((greaterOrEqual / array.length) * 100);
    };

    const salesPercentile = rawSignals.map((s) => getPercentile(s.totalMonthlyOrders, monthlyOrdersArray));
    const viewPercentile = rawSignals.map((s) => getPercentile(s.totalViews, viewsArray));
    const engagementPercentile = rawSignals.map((s) => getPercentile(s.totalSaved, savedArray));
    // Conversion is already 0-100 scale (ratio * 500, capped at 100)
    const conversionPercentile = rawSignals.map((s) => Math.round(Math.min(s.conversionRatio * 500, 100)));
    // Recency is already 0-100 (ratio * 100)
    // const recencyPercentile = rawSignals.map((s) => getPercentile(s.recencyRatio * 100, recencyArray.map(r => r * 100))); // REMOVED
    // RFQ percentile: proxy using total products count
    const rfqPercentile = rawSignals.map((s) => getPercentile(s.totalProducts, productArrays.map(pa => pa.length)));
    // Search percentile: using totalViews as proxy
    const searchPercentile = rawSignals.map((s) => getPercentile(s.totalViews, viewsArray));

    // 5. Compute weighted total demand score per category
    const demandScores = rawSignals.map((s, idx) => ({
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      slug: s.slug,
      icon: s.icon,
      rank: 0, // will be set after sorting
      totalDemandScore: Math.round(
        (SALES_WEIGHT / TOTAL_WEIGHT) * salesPercentile[idx] +
        (RFQ_WEIGHT / TOTAL_WEIGHT) * rfqPercentile[idx] +
        (SEARCH_WEIGHT / TOTAL_WEIGHT) * searchPercentile[idx] +
        (VIEW_WEIGHT / TOTAL_WEIGHT) * viewPercentile[idx] +
        (ENGAGEMENT_WEIGHT / TOTAL_WEIGHT) * engagementPercentile[idx] +
        (CONVERSION_WEIGHT / TOTAL_WEIGHT) * conversionPercentile[idx]
      ),
      dataConfidence: this.computeDataConfidence(
        s.totalMonthlyOrders,
        s.totalViews,
        s.totalSaved,
      ),
      calculatedAt: new Date(),
      signalBreakdown: {
        sales: salesPercentile[idx],
        rfq: rfqPercentile ? rfqPercentile[idx] : 0,
        search: searchPercentile ? searchPercentile[idx] : 0,
        views: viewPercentile[idx],
        engagement: engagementPercentile[idx],
        conversion: conversionPercentile[idx],
      },
    }));

    // 6. Sort by totalDemandScore DESC
    demandScores.sort((a, b) => b.totalDemandScore - a.totalDemandScore);

    // 7. Assign ranks (1-indexed, with ties getting same rank)
    for (let i = 0; i < demandScores.length; i++) {
      if (i > 0 && demandScores[i].totalDemandScore === demandScores[i - 1].totalDemandScore) {
        demandScores[i].rank = demandScores[i - 1].rank;
      } else {
        demandScores[i].rank = i + 1;
      }
    }

    // 8. Slice top N
    const top = demandScores.slice(0, limit);

    // 9. Cache the computed result (skip caching of empty datasets)
    const result = {
      data: top,
      meta: {
        total: categoriesCount,
        limit,
      },
    };

    if (result.data.length > 0) {
      await this.redisService.setJson(CACHE_KEY, result, CACHE_TTL_SECONDS);
    }

    return result;
  }

  /**
   * Compute data confidence: 0.0-1.0 based on fraction of signal types populated.
   * Available signals: sales (monthlyOrders), views (viewCount), engagement (savedCount)
   * Returns value like 0.67, 1.0, 0.33, etc.
   */
  private computeDataConfidence(
    totalMonthlyOrders: number,
    totalViews: number,
    totalSaved: number,
  ): number {
    const populatedSignals = [
      totalMonthlyOrders > 0 ? 1 : 0,
      totalViews > 0 ? 1 : 0,
      totalSaved > 0 ? 1 : 0,
    ].filter(Boolean).length;
    return Number((populatedSignals / 3).toFixed(2)); // 0.00 - 1.00
  }
}