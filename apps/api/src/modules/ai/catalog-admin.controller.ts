import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogQualityService } from './catalog-quality.service';

@ApiTags('Catalog Admin')
@Controller('admin/catalog-intelligence')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class CatalogAdminController {
  private readonly logger = new Logger(CatalogAdminController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly qualityService: CatalogQualityService,
  ) {}

  @ApiOperation({ summary: 'Get catalog quality summary' })
  @Get('quality-summary')
  async qualitySummary() {
    const scores = await this.prisma.catalogQualityScore.aggregate({
      _avg: { total: true, titleQuality: true, descriptionQuality: true, imageQuality: true, specificationQuality: true, seoQuality: true, categoryQuality: true, brandQuality: true, attributeQuality: true, pricingQuality: true, inventoryQuality: true, completeness: true },
      _count: { total: true },
    }).catch((e) => { this.logger.error(`qualitySummary scores aggregation failed: ${e.message}`); return null; });
    const totalProducts = await this.prisma.product.count({ where: { deletedAt: null } }).catch((e) => { this.logger.error(`qualitySummary product count failed: ${e.message}`); return 0; });
    const scoredProducts = scores?._count?.total || 0;
    return {
      totalProducts,
      scoredProducts,
      overallAvgScore: Math.round(scores?._avg?.total || 0),
      breakdown: scores ? {
        titleQuality: Math.round(scores._avg.titleQuality || 0),
        descriptionQuality: Math.round(scores._avg.descriptionQuality || 0),
        imageQuality: Math.round(scores._avg.imageQuality || 0),
        specificationQuality: Math.round(scores._avg.specificationQuality || 0),
        seoQuality: Math.round(scores._avg.seoQuality || 0),
        categoryQuality: Math.round(scores._avg.categoryQuality || 0),
        brandQuality: Math.round(scores._avg.brandQuality || 0),
        attributeQuality: Math.round(scores._avg.attributeQuality || 0),
        pricingQuality: Math.round(scores._avg.pricingQuality || 0),
        inventoryQuality: Math.round(scores._avg.inventoryQuality || 0),
        completeness: Math.round(scores._avg.completeness || 0),
      } : null,
    };
  }

  @ApiOperation({ summary: 'Get brand performance rankings' })
  @Get('brand-performance')
  async brandPerformance() {
    const brands = await this.prisma.globalBrand.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const brandIds = brands.map(b => b.id);
    const [brandScores, brandProductCounts] = await Promise.all([
      brandIds.length > 0 ? this.prisma.catalogQualityScore.findMany({
        where: { product: { brandId: { in: brandIds } } },
        select: { total: true, product: { select: { brandId: true } } },
        take: 1000,
      }).catch((e) => { this.logger.error(`brandPerformance scores failed: ${e.message}`); return []; }) : [],
      brandIds.length > 0 ? this.prisma.product.groupBy({
        by: ['brandId'],
        _count: { brandId: true },
        where: { brandId: { in: brandIds }, deletedAt: null },
      }).catch((e) => { this.logger.error(`brandPerformance product count failed: ${e.message}`); return []; }) : [],
    ]);

    const scoreMap = new Map<string, { total: number; count: number }>();
    for (const bs of brandScores as Array<{ total: number; product: { brandId: string } | null }>) {
      const bid = bs.product?.brandId;
      if (!bid) continue;
      const existing = scoreMap.get(bid) || { total: 0, count: 0 };
      existing.total += bs.total;
      existing.count += 1;
      scoreMap.set(bid, existing);
    }

    const countMap = new Map(brandProductCounts.map(p => [p.brandId, p._count.brandId]));

    return brands.map(b => ({
      id: b.id, name: b.name, verificationStatus: b.verificationStatus,
      productCount: countMap.get(b.id) || 0,
      avgQuality: scoreMap.has(b.id) ? Math.round((scoreMap.get(b.id)!.total / scoreMap.get(b.id)!.count)) : 0,
    })).sort((a, b) => b.avgQuality - a.avgQuality);
  }

  @ApiOperation({ summary: 'Get category performance rankings' })
  @Get('category-performance')
  async categoryPerformance(@Query('limit') limit?: string) {
    const top = parseInt(limit || '20');
    const categories = await this.prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: top,
    });
    const catIds = categories.map(c => c.id);
    const [catScores, productCounts] = await Promise.all([
      catIds.length > 0 ? this.prisma.catalogQualityScore.findMany({
        where: { product: { categoryId: { in: catIds } } },
        select: { total: true, product: { select: { categoryId: true } } },
        take: 2000,
      }).catch((e) => { this.logger.error(`categoryPerformance scores failed: ${e.message}`); return []; }) : [],
      catIds.length > 0 ? this.prisma.product.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        where: { categoryId: { in: catIds }, deletedAt: null },
      }).catch((e) => { this.logger.error(`categoryPerformance product count failed: ${e.message}`); return []; }) : [],
    ]);

    const scoreMap = new Map<string, { total: number; count: number }>();
    for (const cs of catScores as Array<{ total: number; product: { categoryId: string } | null }>) {
      const cid = cs.product?.categoryId;
      if (!cid) continue;
      const existing = scoreMap.get(cid) || { total: 0, count: 0 };
      existing.total += cs.total;
      existing.count += 1;
      scoreMap.set(cid, existing);
    }

    const countMap = new Map(productCounts.map(p => [p.categoryId, p._count.categoryId]));

    return categories.map(c => ({
      id: c.id, name: c.name,
      productCount: countMap.get(c.id) || 0,
      avgQuality: scoreMap.has(c.id) ? Math.round((scoreMap.get(c.id)!.total / scoreMap.get(c.id)!.count)) : 0,
    })).sort((a, b) => b.avgQuality - a.avgQuality);
  }

  @ApiOperation({ summary: 'Get seller quality rankings' })
  @Get('seller-quality-rankings')
  async sellerQualityRankings(@Query('limit') limit?: string) {
    const top = parseInt(limit || '20');
    const scores = await this.prisma.catalogQualityScore.findMany({
      select: { total: true, product: { select: { companyId: true } } },
      take: 2000,
    }).catch((e) => { this.logger.error(`sellerQualityRankings scores failed: ${e.message}`); return []; }) as Array<{ total: number; product: { companyId: string } | null }>;

    const sellerMap = new Map<string, { totalScore: number; count: number }>();
    for (const s of scores) {
      const cid = s.product?.companyId;
      if (!cid) continue;
      const existing = sellerMap.get(cid) || { totalScore: 0, count: 0 };
      existing.totalScore += s.total;
      existing.count += 1;
      sellerMap.set(cid, existing);
    }

    const sellerIds = [...sellerMap.keys()];
    const sellers = sellerIds.length > 0 ? await this.prisma.company.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, slug: true, verificationLevel: true, totalProducts: true },
    }).catch((e) => { this.logger.error(`sellerQualityRankings company find failed: ${e.message}`); return []; }) : [];

    return [...sellerMap.entries()]
      .map(([id, v]) => {
        const seller = sellers.find(s => s.id === id);
        return {
          companyId: id,
          companyName: seller?.name || id,
          slug: seller?.slug || '',
          verificationLevel: seller?.verificationLevel || 'LEVEL_0',
          totalProducts: seller?.totalProducts || 0,
          scoredProducts: v.count,
          avgQuality: Math.round(v.totalScore / v.count),
        };
      })
      .sort((a, b) => b.avgQuality - a.avgQuality)
      .slice(0, top);
  }

  @ApiOperation({ summary: 'Get AI adoption rate' })
  @Get('ai-adoption')
  async aiAdoption() {
    const total = await this.prisma.company.count({ where: { deletedAt: null, status: 'ACTIVE' as any } }).catch((e) => { this.logger.error(`aiAdoption company count failed: ${e.message}`); return 0; });
    const events: Array<{ companyId: string; metadata: any }> = await this.prisma.sellerAnalyticsEvent.findMany({
      where: { eventType: 'PRODUCT_VIEW' as any, createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      select: { companyId: true, metadata: true },
      take: 2000,
    }).catch((e) => { this.logger.error(`aiAdoption events query failed: ${e.message}`); return []; }) as any;
    const aiUsers = new Set(events.filter(e => e.metadata?.catalogEventType === 'AI_USAGE').map(e => e.companyId));
    return {
      totalCompanies: total,
      companiesUsingAi: aiUsers.size,
      adoptionRate: total > 0 ? Math.round((aiUsers.size / total) * 100) : 0,
      totalAiEvents: events.filter(e => e.metadata?.catalogEventType === 'AI_USAGE').length,
    };
  }
}