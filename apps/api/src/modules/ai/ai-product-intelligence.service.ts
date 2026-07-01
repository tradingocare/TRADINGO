import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiProviderService } from './ai-provider.service';
import { PromptService } from './prompt.service';
import { AiJobType, AiJobStatus } from '@prisma/client';
import { GenerateDescriptionDto, GenerateSeoDto, TranslateProductDto, SuggestSpecsDto, SuggestImagesDto, UpdateSeoDto, AcceptAiSuggestionDto } from './dto/ai.dto';

@Injectable()
export class AiProductIntelligenceService {
  private readonly logger = new Logger(AiProductIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AiProviderService,
    private readonly prompts: PromptService,
  ) {}

  async generateDescription(dto: GenerateDescriptionDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true, specifications: true } });
    if (!product) throw new NotFoundException('Product not found');

    const prompt = this.prompts.description(
      product.name, product.category?.name || 'General', product.productBrand?.name || product.brand || '',
      dto.specifications || product.specifications.map(s => `${s.key}: ${s.value}`),
      dto.keyFeatures || [], dto.targetAudience || 'General B2B buyers', dto.tone || 'Professional',
    );

    const content = await this.aiProvider.generateJson<any>(prompt);
    await this.createAiCache(dto.productId, AiJobType.DESCRIPTION_GENERATION, prompt, content);
    return { productId: dto.productId, suggestions: content };
  }

  async generateSeo(dto: GenerateSeoDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true } });
    if (!product) throw new NotFoundException('Product not found');

    const prompt = this.prompts.seo(product.name, product.category?.name || 'General', product.productBrand?.name || product.brand || '', product.shortDescription || '', dto.targetKeyword || product.name, dto.additionalKeywords || []);
    const content = await this.aiProvider.generateJson<any>(prompt);
    await this.createAiCache(dto.productId, AiJobType.SEO_GENERATION, prompt, content);
    return { productId: dto.productId, suggestions: content };
  }

  async translateProduct(dto: TranslateProductDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.productTranslation.findUnique({ where: { productId_locale: { productId: dto.productId, locale: dto.targetLocale } } });
    if (existing) return { productId: dto.productId, locale: dto.targetLocale, message: 'Translation already exists' };

    const prompt = this.prompts.translate(product.name, product.shortDescription || '', product.description || '', dto.targetLocale);
    const content = await this.aiProvider.generateJson<{ name: string; shortDescription: string; description: string }>(prompt);

    const translation = await this.prisma.productTranslation.create({
      data: { productId: dto.productId, locale: dto.targetLocale, name: content.name, shortDescription: content.shortDescription, description: content.description },
    });
    return { productId: dto.productId, locale: dto.targetLocale, translation };
  }

  async suggestSpecs(dto: SuggestSpecsDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true, specifications: true } });
    if (!product) throw new NotFoundException('Product not found');

    const prompt = this.prompts.specs(product.name, product.category?.name || 'General', product.productBrand?.name || product.brand || '', product.specifications.map(s => ({ key: s.key, value: s.value || '' })));
    const content = await this.aiProvider.generateJson<{ suggestions: Array<{ key: string; value: string; confidence: string }> }>(prompt);
    await this.createAiCache(dto.productId, AiJobType.SPEC_SUGGESTION, prompt, content);
    return { productId: dto.productId, suggestions: content.suggestions };
  }

  async suggestImages(dto: SuggestImagesDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true, media: true } });
    if (!product) throw new NotFoundException('Product not found');

    const prompt = this.prompts.images(product.name, product.category?.name || 'General', product.productBrand?.name || product.brand || '', product.media.length);
    const content = await this.aiProvider.generateJson<{ suggestions: Array<{ type: string; description: string; priority: string; reason: string }> }>(prompt);
    await this.createAiCache(dto.productId, AiJobType.IMAGE_SUGGESTION, prompt, content);
    return { productId: dto.productId, suggestions: content.suggestions };
  }

  async updateSeo(productId: string, dto: UpdateSeoDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({ where: { id: productId }, data: { metaTitle: dto.metaTitle, metaDescription: dto.metaDescription, focusKeywords: dto.focusKeywords, updatedBy: userId }, select: { id: true, name: true, metaTitle: true, metaDescription: true, focusKeywords: true } });
  }

  async getAiCache(productId: string, cacheType?: AiJobType) {
    const where: any = { productId };
    if (cacheType) where.cacheType = cacheType;
    return this.prisma.productAiCache.findMany({ where, orderBy: { createdAt: 'desc' }, take: 20 });
  }

  async acceptSuggestion(dto: AcceptAiSuggestionDto, userId: string) {
    const cache = await this.prisma.productAiCache.findUnique({ where: { id: dto.cacheId }, include: { product: true } });
    if (!cache) throw new NotFoundException('Suggestion not found');
    await this.prisma.productAiCache.update({ where: { id: dto.cacheId }, data: { accepted: true } });

    const response = dto.edits || (cache.response as any);
    if (cache.cacheType === AiJobType.SEO_GENERATION && response) {
      await this.prisma.product.update({ where: { id: cache.productId }, data: { metaTitle: response.seoTitle || response.metaTitle, metaDescription: response.seoDescription || response.metaDescription, focusKeywords: response.keywords || response.focusKeywords || [], updatedBy: userId } });
    }
    if (cache.cacheType === AiJobType.DESCRIPTION_GENERATION && response) {
      await this.prisma.product.update({ where: { id: cache.productId }, data: { shortDescription: response.shortDescription, description: response.longDescription || response.description, updatedBy: userId } });
    }
    return { accepted: true, cacheId: dto.cacheId };
  }

  private async createAiCache(productId: string, cacheType: AiJobType, prompt: string, response: any) {
    return this.prisma.productAiCache.create({ data: { productId, cacheType, prompt, response: response as any, model: 'gpt-4o-mini' } });
  }
}
