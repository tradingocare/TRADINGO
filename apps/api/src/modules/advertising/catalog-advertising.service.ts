import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdvertisingService } from './advertising.service';
import { CreateAdvertisingDto } from './dto/create-advertising.dto';
import { ProductStatus, AdType, AdPricingModel } from '@prisma/client';

@Injectable()
export class CatalogAdvertisingService {
  private readonly logger = new Logger(CatalogAdvertisingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly advertising: AdvertisingService,
  ) {}

  async recommendPromotions(companyId: string, limit = 5) {
    const products = await this.prisma.product.findMany({
      where: { companyId, status: ProductStatus.ACTIVE, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const scored = products.map(p => {
      const salesScore = (p.isBestseller ? 30 : 0) + (p.isFeatured ? 20 : 0);
      return {
        productId: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: '',
        targetUrl: `/products/${p.slug}`,
        qualityScore: 0,
        reviewCount: 0,
        salesScore,
        compositeScore: salesScore * 0.6,
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore).slice(0, limit);

    return {
      companyId,
      recommendations: scored.map(({ compositeScore: _compositeScore, ...rest }) => rest),
      generatedAt: new Date().toISOString(),
    };
  }

  async autoPromoteTopProducts(companyId: string) {
    const recs = await this.recommendPromotions(companyId, 3);
    const created: any[] = [];

    for (const product of recs.recommendations) {
      try {
        const dto: CreateAdvertisingDto = {
          type: AdType.SPONSORED_PRODUCT,
          pricingModel: AdPricingModel.CPC,
          title: product.name,
          targetUrl: product.targetUrl,
          dailyBudget: 500,
          totalBudget: 5000,
          cpc: 5,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          productId: product.productId,
          autoStop: true,
        };
        const ad = await this.advertising.create(dto, companyId, 'SYSTEM');
        created.push(ad);
      } catch (err: any) {
        this.logger.warn(`Auto-promote failed for ${product.productId}: ${err.message}`);
      }
    }

    return { companyId, createdCount: created.length, created };
  }
}