import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommerceIntelligenceService {
  private readonly logger = new Logger(CommerceIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getSalesPotential(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, inventory: true, priceSlabs: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const competitorCount = await this.prisma.product.count({
      where: { categoryId: product.categoryId || undefined, deletedAt: null, id: { not: productId } },
    });
    const categoryRfqCount = await this.prisma.rfq.count({
      where: { categoryId: product.categoryId || undefined, deletedAt: null },
    });
    const categoryOrderCount = await this.prisma.order.count({
      where: { items: { some: { productId } } },
    });

    const demandLevel = categoryRfqCount > 50 ? 'high' : categoryRfqCount > 20 ? 'medium' : 'low';
    const competitionLevel = competitorCount > 50 ? 'high' : competitorCount > 20 ? 'medium' : 'low';
    const salesPotential = competitionLevel === 'low' && demandLevel === 'high' ? 85
      : competitionLevel === 'high' && demandLevel === 'low' ? 25
      : 55;

    return {
      productId,
      productName: product.name,
      salesPotential,
      demandLevel,
      competitionLevel,
      competitorCount,
      categoryRfqCount,
      categoryOrderCount,
      inStock: product.inventory?.availableQuantity !== null && (product.inventory?.availableQuantity ?? 0) > 0,
      estimatedMonthlyDemand: categoryRfqCount > 0 ? Math.round(categoryRfqCount / 3) : 0,
    };
  }

  async getSuggestedPrice(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, priceSlabs: true, inventory: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const catProducts = await this.prisma.product.findMany({
      where: { categoryId: product.categoryId || undefined, deletedAt: null, id: { not: productId } },
      include: { priceSlabs: { orderBy: { minQty: 'asc' }, take: 1 } },
      take: 50,
    });

    const prices = catProducts
      .flatMap(p => p.priceSlabs.map(s => Number(s.price)))
      .filter((p): p is number => p !== null && p !== undefined && p > 0);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0;
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices.length > 0 ? sortedPrices[Math.floor(sortedPrices.length / 2)] : 0;
    const currentPrice = product.priceSlabs?.[0]?.price ? Number(product.priceSlabs[0].price) : Number(product.originalPrice || 0);

    const suggestedPrice = avgPrice > 0 ? Math.round((avgPrice + medianPrice) / 2) : currentPrice;
    const suggestedMargin = avgPrice > 0 && currentPrice > 0
      ? Math.round(((currentPrice - avgPrice) / avgPrice) * 100)
      : 15;

    return {
      productId,
      currentPrice,
      suggestedPrice,
      avgCategoryPrice: avgPrice,
      medianCategoryPrice: medianPrice,
      suggestedMargin: Math.max(5, Math.min(40, suggestedMargin)),
      pricePosition: currentPrice > avgPrice ? 'premium' : currentPrice < avgPrice ? 'budget' : 'mid-range',
      competitorCount: catProducts.length,
    };
  }

  async getDemandTrend(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const [rfqCount, orderCount, quoteCount] = await Promise.all([
      this.prisma.rfq.count({ where: { categoryId: product.categoryId || undefined, deletedAt: null } }),
      this.prisma.order.count({ where: { items: { some: { productId } } } }),
      this.prisma.quote.count({ where: { rfq: { categoryId: product.categoryId || undefined } } }),
    ]);

    const trend = rfqCount > orderCount * 2 ? 'increasing'
      : orderCount > rfqCount ? 'declining'
      : 'stable';

    return {
      productId,
      trend,
      rfqCount,
      orderCount,
      quoteCount,
      demandScore: Math.min(100, Math.round((rfqCount + orderCount + quoteCount) / 3)),
    };
  }

  async getCompetitionAnalysis(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, company: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const competitors = await this.prisma.product.findMany({
      where: { categoryId: product.categoryId || undefined, deletedAt: null, id: { not: productId } },
      include: { company: { select: { name: true, trustScore: true } }, priceSlabs: { orderBy: { minQty: 'asc' }, take: 1 } },
      take: 20,
    });

    const brandCount = new Set(competitors.map(c => c.brand).filter(Boolean)).size;
    const avgTrustScore = competitors.length > 0
      ? Math.round(competitors.reduce((s, c) => s + (c.company?.trustScore || 0), 0) / competitors.length)
      : 0;

    return {
      productId,
      totalCompetitors: competitors.length,
      brandCount,
      avgCompetitorTrustScore: avgTrustScore,
      competitors: competitors.slice(0, 10).map(c => ({
        id: c.id, name: c.name, brand: c.brand, minPrice: c.priceSlabs?.[0]?.price ? Number(c.priceSlabs[0].price) : null, companyName: c.company?.name, trustScore: c.company?.trustScore,
      })),
      marketConcentration: competitors.length > 50 ? 'fragmented' : competitors.length > 20 ? 'moderate' : 'concentrated',
    };
  }

  async getSuggestedAdvertising(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, priceSlabs: { orderBy: { minQty: 'asc' }, take: 1 } },
    });
    if (!product) throw new NotFoundException('Product not found');

    const competitorCount = await this.prisma.product.count({
      where: { categoryId: product.categoryId || undefined, deletedAt: null, id: { not: productId } },
    });
    const productPrice = product.priceSlabs?.[0]?.price ? Number(product.priceSlabs[0].price) : Number(product.originalPrice || 0);

    const suggestedBudget = productPrice > 5000 ? Math.round(productPrice * 0.05)
      : productPrice > 1000 ? Math.round(productPrice * 0.08)
      : Math.round(productPrice * 0.1);

    return {
      productId,
      suggestedDailyBudget: Math.max(100, suggestedBudget),
      suggestedMonthlyBudget: Math.max(3000, suggestedBudget * 30),
      suggestedKeywords: [
        product.name?.split(' ').slice(0, 3).join(' '),
        product.brand,
        product.category?.name,
      ].filter(Boolean),
      competitionLevel: competitorCount > 50 ? 'high' : competitorCount > 20 ? 'medium' : 'low',
      estimatedCpc: competitorCount > 50 ? Math.round(productPrice * 0.02) : Math.round(productPrice * 0.01),
    };
  }

  async getFullCommerceInsights(productId: string) {
    const [potential, pricing, demand, competition, advertising] = await Promise.all([
      this.getSalesPotential(productId).catch(() => { this.logger.warn(`getSalesPotential failed for ${productId}`); return null; }),
      this.getSuggestedPrice(productId).catch(() => { this.logger.warn(`getSuggestedPrice failed for ${productId}`); return null; }),
      this.getDemandTrend(productId).catch(() => { this.logger.warn(`getDemandTrend failed for ${productId}`); return null; }),
      this.getCompetitionAnalysis(productId).catch(() => { this.logger.warn(`getCompetitionAnalysis failed for ${productId}`); return null; }),
      this.getSuggestedAdvertising(productId).catch(() => { this.logger.warn(`getSuggestedAdvertising failed for ${productId}`); return null; }),
    ]);
    const score = potential?.salesPotential || 0;
    const priceScore = 55;
    const demandScore = demand?.demandScore || 0;
    const overall = Math.round((score + priceScore + demandScore) / 3);
    return { productId, salesPotential: potential, suggestedPricing: pricing, demandTrend: demand, competitionAnalysis: competition, suggestedAdvertising: advertising, overallCommerceScore: overall };
  }
}