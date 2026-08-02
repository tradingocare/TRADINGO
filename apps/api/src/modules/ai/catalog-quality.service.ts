import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryCatalogQualityDto, DetectDuplicatesDto, AiHealthDashboardDto, GenerateBulkQualityScoresDto } from './dto/ai.dto';
import { gracefulCatch } from '../../common/utils/graceful-catch';

@Injectable()
export class CatalogQualityService {
  private readonly logger = new Logger(CatalogQualityService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async calculateScore(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, productBrand: true, media: true, specifications: true, attributes: true, inventory: true, priceSlabs: true },
    });
    if (!product) throw new Error('Product not found');

    const titleQuality = this.scoreTitle(product.name, product.brand);
    const descriptionQuality = this.scoreDescription(product.shortDescription, product.description);
    const imageQuality = this.scoreImages(product.media);
    const specificationQuality = this.scoreSpecifications(product.specifications);
    const seoQuality = this.scoreSeo(product.metaTitle, product.metaDescription, product.focusKeywords);
    const categoryQuality = product.categoryId ? (product.category?.name ? 80 : 50) : 0;
    const brandQuality = product.brand || product.brandId ? 80 : 0;
    const attributeQuality = product.attributes.length > 0 ? Math.min(product.attributes.length * 10, 100) : 0;
    const pricingQuality = this.scorePricing(product.priceSlabs, product.originalPrice);
    const inventoryQuality = this.scoreInventory(product.inventory);
    const completeness = Math.round((titleQuality + descriptionQuality + imageQuality + specificationQuality + seoQuality + categoryQuality + brandQuality + attributeQuality + pricingQuality + inventoryQuality) / 10);

    const recommendations: string[] = [];
    if (titleQuality < 70) recommendations.push('Add brand and model to product name');
    if (descriptionQuality < 70) recommendations.push('Add a detailed product description (200+ characters)');
    if (imageQuality < 70) recommendations.push('Add more product images (at least 3 recommended)');
    if (specificationQuality < 70) recommendations.push('Add technical specifications');
    if (seoQuality < 70) recommendations.push('Fill in SEO title and meta description');
    if (categoryQuality < 70) recommendations.push('Assign to a specific category');
    if (brandQuality < 70) recommendations.push('Specify brand name');
    if (pricingQuality < 70) recommendations.push('Define pricing slabs for volume-based pricing');
    if (inventoryQuality < 70) recommendations.push('Set inventory quantity and stock status');

    const total = completeness;

    return this.prisma.catalogQualityScore.upsert({
      where: { productId },
      create: { productId, total, titleQuality, descriptionQuality, imageQuality, specificationQuality, seoQuality, categoryQuality, brandQuality, attributeQuality, pricingQuality, inventoryQuality, completeness, recommendations: recommendations as any },
      update: { total, titleQuality, descriptionQuality, imageQuality, specificationQuality, seoQuality, categoryQuality, brandQuality, attributeQuality, pricingQuality, inventoryQuality, completeness, recommendations: recommendations as any, lastCalculatedAt: new Date() },
    });
  }

  async calculateBulkScores(dto: GenerateBulkQualityScoresDto) {
    const results: Array<{ productId: string; total: number; completeness: number; error?: string }> = [];
    for (const productId of dto.productIds) {
      try {
        const score = await this.calculateScore(productId);
        results.push({ productId, total: score.total, completeness: score.completeness });
      } catch (err: any) {
        results.push({ productId, total: 0, completeness: 0, error: err.message });
      }
    }
    return { results, totalProcessed: results.length, successCount: results.filter(r => !r.error).length, failedCount: results.filter(r => r.error).length };
  }

  async listScores(query: QueryCatalogQualityDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};
    if (query.minScore !== undefined) where.total = { gte: query.minScore };
    if (query.maxScore !== undefined) where.total = { ...where.total, lte: query.maxScore };
    if (query.companyId) where.product = { companyId: query.companyId };

    const [data, total] = await Promise.all([
      this.prisma.catalogQualityScore.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { total: 'asc' },
        include: { product: { select: { id: true, name: true, slug: true, companyId: true, status: true, media: { where: { isPrimary: true }, select: { url: true }, take: 1 } } } },
      }),
      this.prisma.catalogQualityScore.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrevious: page > 1 } };
  }

  async getScore(productId: string) {
    return this.prisma.catalogQualityScore.findUnique({
      where: { productId },
      include: { product: { select: { id: true, name: true, slug: true, companyId: true, status: true } } },
    });
  }

  async getHealthDashboard(dto: AiHealthDashboardDto) {
    const where: any = {};
    if (dto.companyId) where.companyId = dto.companyId;

    const [totalProducts, scores, missingImages, missingSeo, missingSpecs, missingAttributes, missingPricing, translations] = await Promise.all([
      this.prisma.product.count({ where: { ...where, deletedAt: null } }),
      this.prisma.catalogQualityScore.findMany({ where: dto.companyId ? { product: { companyId: dto.companyId } } : {}, select: { total: true, titleQuality: true, descriptionQuality: true, imageQuality: true, specificationQuality: true, seoQuality: true, pricingQuality: true, inventoryQuality: true }, take: 1000 }),
      this.prisma.product.count({ where: { ...where, deletedAt: null, media: { none: {} } } }),
      this.prisma.product.count({ where: { ...where, deletedAt: null, OR: [{ metaTitle: null }, { metaDescription: null }] } }),
      this.prisma.product.count({ where: { ...where, deletedAt: null, specifications: { none: {} } } }),
      this.prisma.product.count({ where: { ...where, deletedAt: null, attributes: { none: {} } } }),
      this.prisma.product.count({ where: { ...where, deletedAt: null, OR: [{ priceSlabs: { none: {} } }, { minPrice: null }] } }),
      this.prisma.productTranslation.groupBy({ by: ['locale'], _count: true }),
    ]);

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.total, 0) / scores.length) : 0;
    const avgTitleQuality = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.titleQuality, 0) / scores.length) : 0;
    const avgDescQuality = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.descriptionQuality, 0) / scores.length) : 0;
    const avgImageQuality = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.imageQuality, 0) / scores.length) : 0;
    const avgSpecQuality = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.specificationQuality, 0) / scores.length) : 0;
    const avgSeoQuality = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.seoQuality, 0) / scores.length) : 0;

    const lowScoring = scores.filter(s => s.total < 50).length;
    const duplicateRisk = await this.detectGlobalDuplicates(dto.companyId);

    return {
      totalProducts, scoredProducts: scores.length, avgScore, avgTitleQuality, avgDescQuality, avgImageQuality, avgSpecQuality, avgSeoQuality,
      missingImages, missingSeo, missingSpecs, missingAttributes, missingPricing, lowScoringProducts: lowScoring,
      duplicateRiskCount: duplicateRisk.length,
      translations: translations.map(t => ({ locale: t.locale, count: t._count })),
    };
  }

  async getSellerDashboard(companyId: string) {
    const [avgScore, totalProducts, scoredProducts, missingImages, missingSeo, missingSpecs, missingAttributes, lowScoring, duplicates] = await Promise.all([
      this.prisma.catalogQualityScore.aggregate({ where: { product: { companyId } }, _avg: { total: true } }).then(r => Math.round(r._avg.total || 0)).catch(gracefulCatch('catalogQuality.getSellerDashboard.avgScore', 0)),
      this.prisma.product.count({ where: { companyId, deletedAt: null } }).catch(gracefulCatch('catalogQuality.getSellerDashboard.totalProducts', 0)),
      this.prisma.catalogQualityScore.count({ where: { product: { companyId } } }).catch(gracefulCatch('catalogQuality.getSellerDashboard.scoredProducts', 0)),
      this.prisma.product.count({ where: { companyId, media: { none: {} }, deletedAt: null } }).catch(gracefulCatch('catalogQuality.getSellerDashboard.missingImages', 0)),
      this.prisma.product.count({ where: { companyId, OR: [{ metaTitle: null }, { metaDescription: null }], deletedAt: null } }).catch(gracefulCatch('catalogQuality.getSellerDashboard.missingSeo', 0)),
      this.prisma.product.count({ where: { companyId, specifications: { none: {} }, deletedAt: null } }).catch(gracefulCatch('catalogQuality.getSellerDashboard.missingSpecs', 0)),
      this.prisma.product.count({ where: { companyId, attributes: { none: {} }, deletedAt: null } }).catch(gracefulCatch('catalogQuality.getSellerDashboard.missingAttributes', 0)),
      this.prisma.catalogQualityScore.count({ where: { total: { lt: 70 }, product: { companyId } } }).catch(gracefulCatch('catalogQuality.getSellerDashboard.lowScoring', 0)),
      this.detectGlobalDuplicates(companyId).catch(gracefulCatch('catalogQuality.getSellerDashboard.duplicates', [])),
    ])
    const scoreDistribution = await this.prisma.catalogQualityScore.groupBy({
      by: ['total'], where: { product: { companyId } }, _count: { total: true },
      orderBy: { total: 'asc' },
    }).catch(gracefulCatch('catalogQuality.getSellerDashboard.scoreDistribution', []))
    return { avgScore, totalProducts, scoredProducts, missingImages, missingSeo, missingSpecs, missingAttributes, lowScoringProducts: lowScoring, duplicateRiskCount: duplicates.length, scoreDistribution }
  }

  async detectDuplicates(dto: DetectDuplicatesDto) {
    const where: any = { deletedAt: null };
    if (dto.companyId) where.companyId = dto.companyId;

    const products = dto.productId
      ? [await this.prisma.product.findUnique({ where: { id: dto.productId } })].filter(Boolean)
      : await this.prisma.product.findMany({ where, take: 500, include: { category: { select: { name: true } } } });

    const results: Array<{ productId: string; productName: string; similarTo: string; confidence: string; reason: string; matchType: string }> = [];
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const a = products[i]!; const b = products[j]!;
        const nameSim = this.similarity(a.name.toLowerCase(), b.name.toLowerCase());
        const sameCategory = a.categoryId && b.categoryId && a.categoryId === b.categoryId;
        const sameSku = a.sku && b.sku && a.sku.toLowerCase() === b.sku.toLowerCase();
        const sameBrand = a.brand && b.brand && a.brand.toLowerCase() === b.brand.toLowerCase();
        const brandNameSim = sameBrand ? nameSim * 1.15 : nameSim;
        const nearDuplicate = brandNameSim > 0.75 && sameCategory && sameBrand;
        const exactBrandNameSim = brandNameSim > 0.9 && sameBrand;

        if (sameSku) {
          results.push({ productId: a.id, productName: a.name, similarTo: b.name, confidence: 'high', reason: `Same SKU: ${a.sku}`, matchType: 'SKU' });
        } else if (exactBrandNameSim) {
          results.push({ productId: a.id, productName: a.name, similarTo: b.name, confidence: 'high', reason: `Name similarity: ${Math.round(brandNameSim * 100)}% + same brand`, matchType: 'NAME_BRAND' });
        } else if (nameSim > 0.85 && sameCategory) {
          results.push({ productId: a.id, productName: a.name, similarTo: b.name, confidence: nameSim > 0.95 ? 'high' : 'medium', reason: `Name similarity: ${Math.round(nameSim * 100)}% + same category`, matchType: 'NAME_CATEGORY' });
        } else if (nameSim > 0.9) {
          results.push({ productId: a.id, productName: a.name, similarTo: b.name, confidence: 'high', reason: `Name similarity: ${Math.round(nameSim * 100)}%`, matchType: 'NAME' });
        } else if (nearDuplicate) {
          results.push({ productId: a.id, productName: a.name, similarTo: b.name, confidence: 'medium', reason: `Near duplicate: ${Math.round(brandNameSim * 100)}% similarity + same brand/category`, matchType: 'NEAR_DUPLICATE' });
        }
      }
    }
    return results.slice(0, 50);
  }

  private async detectGlobalDuplicates(companyId?: string) {
    const products = await this.prisma.product.findMany({ where: companyId ? { companyId, deletedAt: null } : { deletedAt: null }, select: { id: true, name: true, companyId: true, brand: true }, take: 200 });
    const results: Array<{ id: string; name: string; similarTo: string }> = [];
    for (let i = 0; i < Math.min(products.length, 50); i++) {
      for (let j = i + 1; j < Math.min(products.length, 50); j++) {
        const sim = this.similarity(products[i].name.toLowerCase(), products[j].name.toLowerCase());
        const sameBrand = products[i].brand && products[j].brand && products[i].brand!.toLowerCase() === products[j].brand!.toLowerCase();
        if (sim > 0.85 || (sim > 0.75 && sameBrand)) {
          results.push({ id: products[i].id, name: products[i].name, similarTo: products[j].name });
        }
      }
    }
    return results;
  }

  private scoreTitle(name: string, brand: string | null): number {
    let score = 0;
    if (!name) return 0;
    if (name.length >= 10) score += 20;
    if (name.length >= 30) score += 20;
    if (brand && name.toLowerCase().includes(brand.toLowerCase())) score += 20;
    if (name.includes('-') || name.includes('|')) score += 20;
    if (name.split(' ').length >= 3) score += 20;
    return Math.min(score, 100);
  }

  private scoreDescription(short: string | null, long: string | null): number {
    let score = 0;
    const text = (long || short || '');
    if (!text) return 0;
    if (text.length > 50) score += 25;
    if (text.length > 200) score += 25;
    if (text.length > 500) score += 25;
    if ((long?.length || 0) > 100) score += 25;
    return Math.min(score, 100);
  }

  private scoreImages(media: any[]): number {
    return media.length === 0 ? 0 : Math.min(media.length >= 8 ? 100 : media.length >= 5 ? 80 : media.length >= 3 ? 60 : media.length >= 1 ? 30 : media.length * 20, 100);
  }

  private scoreSpecifications(specs: any[]): number {
    return specs.length === 0 ? 0 : Math.min(specs.length >= 10 ? 100 : specs.length >= 5 ? 75 : specs.length >= 3 ? 50 : specs.length >= 1 ? 25 : specs.length * 15, 100);
  }

  private scoreSeo(metaTitle: string | null, metaDescription: string | null, keywords: string[]): number {
    let score = 0;
    if (metaTitle) score += 30;
    if (metaTitle && metaTitle.length >= 30 && metaTitle.length <= 60) score += 20;
    if (metaDescription) score += 30;
    if (keywords?.length > 0) score += 20;
    return Math.min(score, 100);
  }

  private scorePricing(priceSlabs: any[], originalPrice: any): number {
    let score = 0;
    if (priceSlabs && priceSlabs.length >= 2) score += 40;
    if (priceSlabs && priceSlabs.length >= 1) score += 30;
    if (originalPrice && Number(originalPrice) > 0) score += 30;
    return Math.min(score, 100);
  }

  private scoreInventory(inventory: any): number {
    if (!inventory) return 0;
    let score = 30;
    if (inventory.availableQuantity > 0) score += 30;
    if (inventory.availableQuantity >= 100) score += 20;
    if (inventory.stockStatus) score += 20;
    return Math.min(score, 100);
  }

  private similarity(a: string, b: string): number {
    if (a === b) return 1;
    const aWords = a.split(/\s+/);
    const bWords = b.split(/\s+/);
    const common = aWords.filter(w => bWords.includes(w)).length;
    return common / Math.max(aWords.length, bWords.length);
  }
}
