import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CatalogQualityService } from './catalog-quality.service';
import { CatalogAnalyticsService } from './catalog-analytics.service';
import { QueryCatalogQualityDto, DetectDuplicatesDto, AiHealthDashboardDto, GenerateBulkQualityScoresDto } from './dto/ai.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Catalog Quality')
@Controller('ai/quality')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CatalogQualityController {
  constructor(
    private readonly qualityService: CatalogQualityService,
    private readonly analytics: CatalogAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Calculate quality score for product' })
  @Post('calculate/:productId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  calculateScore(@Param('productId') productId: string) { return this.qualityService.calculateScore(productId); }

  @ApiOperation({ summary: 'Calculate bulk quality scores' })
  @Post('calculate-bulk')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  calculateBulkScores(@Body() dto: GenerateBulkQualityScoresDto) { return this.qualityService.calculateBulkScores(dto); }

  @ApiOperation({ summary: 'List quality scores' })
  @Get('scores')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  listScores(@Query() query: QueryCatalogQualityDto) { return this.qualityService.listScores(query); }

  @ApiOperation({ summary: 'Get quality score by product' })
  @Get('scores/:productId')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  getScore(@Param('productId') productId: string) { return this.qualityService.getScore(productId); }

  @ApiOperation({ summary: 'Get quality health dashboard' })
  @Get('dashboard')
  @Roles('ADMIN', 'SUPER_ADMIN')
  healthDashboard(@Query() dto: AiHealthDashboardDto) { return this.qualityService.getHealthDashboard(dto); }

  @ApiOperation({ summary: 'Detect duplicate products' })
  @Post('detect-duplicates')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  detectDuplicates(@Body() dto: DetectDuplicatesDto) { return this.qualityService.detectDuplicates(dto); }

  @ApiOperation({ summary: 'Get seller quality dashboard' })
  @Get('seller-dashboard')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  sellerDashboard(@Req() req: any) { return this.qualityService.getSellerDashboard(req.user.companyId); }

  @ApiOperation({ summary: 'Get seller quality trend' })
  @Get('seller/quality-trend')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async qualityTrend(@Req() req: any, @Query('days') days?: string) {
    return this.analytics.getQualityTrend(req.user.companyId, days ? parseInt(days) : 30);
  }

  @ApiOperation({ summary: 'Get seller AI usage history' })
  @Get('seller/ai-usage')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async aiUsage(@Req() req: any, @Query('days') days?: string) {
    const cutoff = new Date(Date.now() - (days ? parseInt(days) : 30) * 24 * 3600 * 1000);
    const events = await this.prisma.sellerAnalyticsEvent.findMany({
      where: { companyId: req.user.companyId, eventType: 'PRODUCT_VIEW' as any, createdAt: { gte: cutoff } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const usage = events
      .filter(e => (e.metadata as any)?.catalogEventType === 'AI_USAGE')
      .map(e => ({ id: e.id, action: (e.metadata as any)?.action, createdAt: e.createdAt }));
    return { total: usage.length, events: usage };
  }

  @ApiOperation({ summary: 'Get seller GOCASH rewards earned' })
  @Get('seller/rewards')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async rewardsEarned(@Req() req: any, @Query('days') days?: string) {
    const cutoff = new Date(Date.now() - (days ? parseInt(days) : 30) * 24 * 3600 * 1000);
    const events = await this.prisma.sellerAnalyticsEvent.findMany({
      where: { companyId: req.user.companyId, eventType: 'PRODUCT_VIEW' as any, createdAt: { gte: cutoff } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const rewards = events
      .filter(e => (e.metadata as any)?.catalogEventType === 'REWARD_EARNED')
      .map(e => ({ id: e.id, action: (e.metadata as any)?.rewardAction, amount: (e.metadata as any)?.amount, createdAt: e.createdAt }));
    const totalAmount = rewards.reduce((sum, r) => sum + (r.amount || 0), 0);
    return { total: rewards.length, totalAmount, rewards };
  }

  @ApiOperation({ summary: 'Get seller advertising opportunities' })
  @Get('seller/advertising-opportunities')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async advertisingOpportunities(@Req() req: any) {
    const products = await this.prisma.product.findMany({
      where: { companyId: req.user.companyId, status: 'ACTIVE' as any, deletedAt: null },
      select: {
        id: true, name: true, slug: true, isFeatured: true, isBestseller: true,
        qualityScores: { select: { total: true } },
      },
      take: 50,
    });
    const existing = await this.prisma.advertisement.findMany({
      where: { companyId: req.user.companyId, status: { not: 'STOPPED' as any } },
      select: { productId: true },
      take: 200,
    });
    const promotedIds = new Set(existing.map(a => a.productId));
    const opportunities = products
      .filter(p => !promotedIds.has(p.id) && (p.qualityScores?.total ?? 0) >= 50)
      .map(p => ({
        productId: p.id, name: p.name, slug: p.slug,
        qualityScore: p.qualityScores?.total || 0,
        isFeatured: p.isFeatured, isBestseller: p.isBestseller,
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore);
    return { total: opportunities.length, opportunities };
  }

  @ApiOperation({ summary: 'Get seller commerce score' })
  @Get('seller/commerce-score')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  async commerceScore(@Req() req: any) {
    const products = await this.prisma.product.findMany({
      where: { companyId: req.user.companyId, deletedAt: null },
      select: {
        id: true, isBestseller: true, isFeatured: true, viewCount: true, savedCount: true, monthlyOrders: true,
        qualityScores: { select: { total: true, seoQuality: true, imageQuality: true, specificationQuality: true, attributeQuality: true } },
      },
      take: 200,
    });
    const scored = products.filter(p => p.qualityScores);
    if (scored.length === 0) return { avgCommerceScore: 0, productCount: 0 };

    const avgCommerce = Math.round(scored.reduce((s, p) => {
      const cq = p.qualityScores!;
      const salesScore = (p.isBestseller ? 30 : 0) + (p.isFeatured ? 20 : 0) + Math.min(p.monthlyOrders * 2, 30);
      return s + Math.round((cq.total * 0.3 + cq.seoQuality * 0.2 + cq.imageQuality * 0.15 + salesScore * 0.35));
    }, 0) / scored.length);
    return { avgCommerceScore: avgCommerce, productCount: scored.length };
  }
}