import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiProviderService } from './ai-provider.service';
import { PromptService } from './prompt.service';
import { QueryCatalogQualityDto, DetectDuplicatesDto, AiHealthDashboardDto } from './dto/ai.dto';

@Injectable()
export class CatalogQualityService {
  private readonly logger = new Logger(CatalogQualityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AiProviderService,
    private readonly prompts: PromptService,
  ) {}

  async calculateScore(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, productBrand: true, media: true, specifications: true, attributes: true },
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
    const completeness = Math.round((titleQuality + descriptionQuality + imageQuality + specificationQuality + seoQuality + categoryQuality + brandQuality + attributeQuality) / 8);

    const recommendations: string[] = [];
    if (titleQuality < 70) recommendations.push('Add brand and model to product name');
    if (descriptionQuality < 70) recommendations.push('Add a detailed product description (200+ characters)');
    if (imageQuality < 70) recommendations.push('Add more product images (at least 3 recommended)');
    if (specificationQuality < 70) recommendations.push('Add technical specifications');
    if (seoQuality < 70) recommendations.push('Fill in SEO title and meta description');
    if (categoryQuality < 70) recommendations.push('Assign to a specific category');
    if (brandQuality < 70) recommendations.push('Specify brand name');

    const total = completeness;

    return this.prisma.catalogQualityScore.upsert({
      where: { productId },
      create: { productId, total, titleQuality, descriptionQuality, imageQuality, specificationQuality, seoQuality, categoryQuality, brandQuality, attributeQuality, completeness, recommendations: recommendations as any },
      update: { total, titleQuality, descriptionQuality, imageQuality, specificationQuality, seoQuality, categoryQuality, brandQuality, attributeQuality, completeness, recommendations: recommendations as any, lastCalculatedAt: new Date() },
    });
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

    const [totalProducts, scores, missingImages, missingSeo, missingSpecs, translations] = await Promise.all([
      this.prisma.product.count({ where: { ...where, deletedAt: null } }),
      this.prisma.catalogQualityScore.findMany({ where: dto.companyId ? { product: { companyId: dto.companyId } } : {}, select: { total: true, titleQuality: true, descriptionQuality: true, imageQuality: true, specificationQuality: true, seoQuality: true } }),
      this.prisma.product.count({ where: { ...where, deletedAt: null, media: { none: {} } } }),
      this.prisma.product.count({ where: { ...where, deletedAt: null, OR: [{ metaTitle: null }, { metaDescription: null }] } }),
      this.prisma.product.count({ where: { ...where, deletedAt: null, specifications: { none: {} } } }),
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
      missingImages, missingSeo, missingSpecs, lowScoringProducts: lowScoring,
      duplicateRiskCount: duplicateRisk.length,
      translations: translations.map(t => ({ locale: t.locale, count: t._count })),
    };
  }

  async detectDuplicates(dto: DetectDuplicatesDto) {
    const products = dto.productId
      ? [await this.prisma.product.findUnique({ where: { id: dto.productId } })].filter(Boolean)
      : await this.prisma.product.findMany({ where: dto.companyId ? { companyId: dto.companyId, deletedAt: null } : { deletedAt: null }, take: 100 });

    const results: Array<{ productId: string; productName: string; similarTo: string; confidence: string; reason: string }> = [];
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const a = products[i]!; const b = products[j]!;
        const nameSim = this.similarity(a.name.toLowerCase(), b.name.toLowerCase());
        if (nameSim > 0.8) {
          results.push({ productId: a.id, productName: a.name, similarTo: b.name, confidence: nameSim > 0.95 ? 'high' : 'medium', reason: `Name similarity: ${Math.round(nameSim * 100)}%` });
        }
      }
    }
    return results.slice(0, 50);
  }

  private async detectGlobalDuplicates(companyId?: string) {
    const products = await this.prisma.product.findMany({ where: companyId ? { companyId, deletedAt: null } : { deletedAt: null }, select: { id: true, name: true, companyId: true }, take: 200 });
    const results: Array<{ id: string; name: string; similarTo: string }> = [];
    for (let i = 0; i < Math.min(products.length, 50); i++) {
      for (let j = i + 1; j < Math.min(products.length, 50); j++) {
        if (this.similarity(products[i].name.toLowerCase(), products[j].name.toLowerCase()) > 0.85) {
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
    if (media.length === 0) return 0;
    if (media.length >= 1) return 30;
    if (media.length >= 3) return 60;
    if (media.length >= 5) return 80;
    if (media.length >= 8) return 100;
    return Math.min(media.length * 20, 100);
  }

  private scoreSpecifications(specs: any[]): number {
    if (specs.length === 0) return 0;
    if (specs.length >= 1) return 25;
    if (specs.length >= 3) return 50;
    if (specs.length >= 5) return 75;
    if (specs.length >= 10) return 100;
    return Math.min(specs.length * 15, 100);
  }

  private scoreSeo(metaTitle: string | null, metaDescription: string | null, keywords: string[]): number {
    let score = 0;
    if (metaTitle) score += 30;
    if (metaTitle && metaTitle.length >= 30 && metaTitle.length <= 60) score += 20;
    if (metaDescription) score += 30;
    if (keywords?.length > 0) score += 20;
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
