import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { PromptService } from './prompt.service';
import { AiJobType, TaskType } from '@prisma/client';
import {
  GenerateDescriptionDto, GenerateSeoDto, TranslateProductDto, SuggestSpecsDto, SuggestImagesDto,
  UpdateSeoDto, AcceptAiSuggestionDto, GenerateTitleDto, SuggestAttributesDto, SuggestCategoryDto,
  GenerateHighlightsDto, GenerateTagsDto, SuggestHsnGstDto, SuggestRelatedProductsDto, GenerateMetaKeywordsDto,
} from './dto/ai.dto';

@Injectable()
export class AiProductIntelligenceService {
  private readonly logger = new Logger(AiProductIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: AiGatewayService,
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
    const result = await this.gateway.process({ taskType: TaskType.PRODUCT_DESCRIPTION, payload: { action: 'generate_description', instructions: prompt, productName: product.name } }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { raw: result.content }; }
    await this.createAiCache(dto.productId, AiJobType.DESCRIPTION_GENERATION, prompt, content);
    return { productId: dto.productId, suggestions: content };
  }

  async generateSeo(dto: GenerateSeoDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true } });
    if (!product) throw new NotFoundException('Product not found');
    const prompt = this.prompts.seo(product.name, product.category?.name || 'General', product.productBrand?.name || product.brand || '', product.shortDescription || '', dto.targetKeyword || product.name, dto.additionalKeywords || []);
    const result = await this.gateway.process({ taskType: TaskType.SEO_GENERATION, payload: { action: 'generate_seo', instructions: prompt, productName: product.name } }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { raw: result.content }; }
    await this.createAiCache(dto.productId, AiJobType.SEO_GENERATION, prompt, content);
    return { productId: dto.productId, suggestions: content };
  }

  async translateProduct(dto: TranslateProductDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    const existing = await this.prisma.productTranslation.findUnique({ where: { productId_locale: { productId: dto.productId, locale: dto.targetLocale } } });
    if (existing) return { productId: dto.productId, locale: dto.targetLocale, message: 'Translation already exists' };
    const prompt = this.prompts.translate(product.name, product.shortDescription || '', product.description || '', dto.targetLocale);
    const result = await this.gateway.process({ taskType: TaskType.TRANSLATION, payload: { action: 'translate', instructions: prompt, productName: product.name, targetLocale: dto.targetLocale } }, 'system', userId);
    let content: { name: string; shortDescription: string; description: string };
    try { content = JSON.parse(result.content); } catch { throw new Error('AI returned invalid translation JSON'); }
    const translation = await this.prisma.productTranslation.create({
      data: { productId: dto.productId, locale: dto.targetLocale, name: content.name, shortDescription: content.shortDescription, description: content.description },
    });
    return { productId: dto.productId, locale: dto.targetLocale, translation };
  }

  async suggestSpecs(dto: SuggestSpecsDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true, specifications: true } });
    if (!product) throw new NotFoundException('Product not found');
    const prompt = this.prompts.specs(product.name, product.category?.name || 'General', product.productBrand?.name || product.brand || '', product.specifications.map(s => ({ key: s.key, value: s.value || '' })));
    const result = await this.gateway.process({ taskType: TaskType.SPEC_SUGGESTION, payload: { action: 'suggest_specs', instructions: prompt, productName: product.name } }, 'system', userId);
    let content: { suggestions: Array<{ key: string; value: string; confidence: string }> };
    try { content = JSON.parse(result.content); } catch { content = { suggestions: [] }; }
    await this.createAiCache(dto.productId, AiJobType.SPEC_SUGGESTION, prompt, content);
    return { productId: dto.productId, suggestions: content.suggestions };
  }

  async suggestImages(dto: SuggestImagesDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true, media: true } });
    if (!product) throw new NotFoundException('Product not found');
    const prompt = this.prompts.images(product.name, product.category?.name || 'General', product.productBrand?.name || product.brand || '', product.media.length);
    const result = await this.gateway.process({ taskType: TaskType.IMAGE_SUGGESTION, payload: { action: 'suggest_images', instructions: prompt, productName: product.name } }, 'system', userId);
    let content: { suggestions: Array<{ type: string; description: string; priority: string; reason: string }> };
    try { content = JSON.parse(result.content); } catch { content = { suggestions: [] }; }
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

  async generateTitle(dto: GenerateTitleDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true, specifications: true } });
    if (!product) throw new NotFoundException('Product not found');
    const result = await this.gateway.process({
      taskType: TaskType.PRODUCT_DESCRIPTION,
      payload: { action: 'generate_title', instructions: `Generate a compelling B2B product title for "${product.name}" (Brand: ${product.productBrand?.name || product.brand || 'N/A'}, Category: ${product.category?.name || 'General'}). The title should be 50-100 characters, include the brand name, key attributes (based on specs: ${product.specifications.slice(0, 3).map(s => `${s.key}: ${s.value}`).join(', ')}), and be SEO-friendly. Return JSON with keys: title, seoTitle (50-60 chars), and reasoning.`, productName: product.name },
    }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { title: result.content }; }
    await this.createAiCache(dto.productId, AiJobType.TITLE_GENERATION, 'generate_title', content);
    return { productId: dto.productId, suggestions: content };
  }

  async suggestAttributes(dto: SuggestAttributesDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { category: true, productBrand: true, specifications: true } });
    if (!product) throw new NotFoundException('Product not found');
    const globalAttrs = await this.prisma.globalAttribute.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    const attrContext = globalAttrs.map(a => `${a.name} (${a.type})${a.options?.length ? ` options: ${a.options.join(', ')}` : ''}`).join('\n');
    const result = await this.gateway.process({
      taskType: TaskType.SPEC_SUGGESTION,
      payload: { action: 'suggest_attributes', instructions: `For product "${product.name}" (Brand: ${product.productBrand?.name || product.brand || 'N/A'}, Category: ${product.category?.name || 'General'}), suggest which global attributes should be applied. Available attributes:\n${attrContext}\n\nCurrent specs: ${product.specifications.map(s => `${s.key}: ${s.value}`).join(', ')}\n\nReturn JSON with keys: suggestions (array of {attributeName, attributeType, suggestedValue, confidence: "high"/"medium"/"low", reasoning}). Recommend up to 8 attributes.`, productName: product.name },
    }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { suggestions: [] }; }
    await this.createAiCache(dto.productId, AiJobType.ATTRIBUTE_SUGGESTION, 'suggest_attributes', content);
    return { productId: dto.productId, suggestions: content.suggestions || [] };
  }

  async suggestCategory(dto: SuggestCategoryDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId }, include: { productBrand: true, specifications: true } });
    if (!product) throw new NotFoundException('Product not found');
    const categories = await this.prisma.category.findMany({ where: { isActive: true }, include: { parent: true }, orderBy: { sortOrder: 'asc' } });
    const catContext = categories.filter(c => !c.parentId).map(c => {
      const children = categories.filter(ch => ch.parentId === c.id);
      return `${c.name} (${c.slug})${children.length ? ` -> ${children.map(ch => ch.name).join(', ')}` : ''}`;
    }).join('\n');
    const result = await this.gateway.process({
      taskType: TaskType.CATEGORY_SUGGESTION,
      payload: { action: 'suggest_category', instructions: `For product "${product.name}" (Brand: ${product.productBrand?.name || product.brand || 'N/A'}, specs: ${product.specifications.slice(0, 5).map(s => `${s.key}: ${s.value}`).join(', ')}), suggest the best category from this hierarchy:\n${catContext}\n\nReturn JSON with keys: suggestedCategory (string - category name), suggestedSlug (string), confidence ("high"/"medium"/"low"), reasoning (string), alternatives (array of {name: string, slug: string, reasoning: string}).`, productName: product.name },
    }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { suggestedCategory: null, confidence: 'low' }; }
    await this.createAiCache(dto.productId, AiJobType.CATEGORY_SUGGESTION, 'suggest_category', content);
    return { productId: dto.productId, suggestion: content };
  }

  async generateHighlights(dto: GenerateHighlightsDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { category: true, productBrand: true, specifications: true, attributes: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const result = await this.gateway.process({
      taskType: TaskType.PRODUCT_DESCRIPTION,
      payload: {
        action: 'generate_highlights',
        instructions: `Generate key selling points and product highlights for "${product.name}" (Brand: ${product.productBrand?.name || product.brand || 'N/A'}, Category: ${product.category?.name || 'General'}). Product: ${product.shortDescription || product.description?.slice(0, 300) || ''}. Specs: ${product.specifications.slice(0, 5).map(s => `${s.key}: ${s.value}`).join(', ')}. Return JSON with keys: highlights (array of 4-6 concise bullet points), keySellingPoints (array of 3-5 compelling reasons to buy), and tags (array of 5-10 relevant product tags).`,
        productName: product.name,
      },
    }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { highlights: [], keySellingPoints: [], tags: [] }; }
    await this.createAiCache(dto.productId, AiJobType.HIGHLIGHT_GENERATION, 'generate_highlights', content);
    return { productId: dto.productId, highlights: content.highlights || [], keySellingPoints: content.keySellingPoints || [], tags: content.tags || [] };
  }

  async generateTags(dto: GenerateTagsDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { category: true, productBrand: true, specifications: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const count = dto.count || 10;
    const result = await this.gateway.process({
      taskType: TaskType.SEO_GENERATION,
      payload: {
        action: 'generate_tags',
        instructions: `Generate exactly ${count} relevant B2B product tags for "${product.name}" (Brand: ${product.productBrand?.name || product.brand || 'N/A'}, Category: ${product.category?.name || 'General'}, Description: ${product.shortDescription || product.description?.slice(0, 200) || ''}, Specs: ${product.specifications.slice(0, 3).map(s => `${s.key}: ${s.value}`).join(', ')}). Tags should cover: product type, material, application, industry use, and features. Return JSON with key: tags (array of strings).`,
        productName: product.name,
      },
    }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { tags: [] }; }
    await this.createAiCache(dto.productId, AiJobType.TAG_GENERATION, 'generate_tags', content);
    return { productId: dto.productId, tags: content.tags || [] };
  }

  async suggestHsnGst(dto: SuggestHsnGstDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { category: true, productBrand: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const result = await this.gateway.process({
      taskType: TaskType.SPEC_SUGGESTION,
      payload: {
        action: 'suggest_hsn_gst',
        instructions: `Suggest HSN code and GST rate for "${product.name}" (Category: ${product.category?.name || 'General'}, Brand: ${product.productBrand?.name || product.brand || 'N/A'}, Description: ${product.shortDescription || product.description?.slice(0, 200) || ''}). Consider product type ${product.productType || 'PHYSICAL'} and Indian GST classification. Return JSON with keys: suggestedHsnCode (string - 4-8 digit HSN), gstRate (number - 0, 5, 12, 18, or 28), description (string), confidence ("high"/"medium"/"low"), alternatives (array of {hsnCode: string, gstRate: number, description: string}).`,
        productName: product.name,
      },
    }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { suggestedHsnCode: null, gstRate: 0, confidence: 'low' }; }
    await this.createAiCache(dto.productId, AiJobType.HSN_GST_SUGGESTION, 'suggest_hsn_gst', content);
    return { productId: dto.productId, suggestion: content };
  }

  async suggestRelatedProducts(dto: SuggestRelatedProductsDto, _userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { category: true, specifications: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const limit = dto.limit || 8;
    const candidates = await this.prisma.product.findMany({
      where: { id: { not: dto.productId }, deletedAt: null, categoryId: product.categoryId || undefined, status: 'ACTIVE' },
      take: limit * 3,
      select: { id: true, name: true, slug: true, brand: true, categoryId: true, originalPrice: true, media: { where: { isPrimary: true }, select: { url: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
    const scored = candidates.map(c => {
      let score = 0;
      if (c.categoryId === product.categoryId) score += 50;
      if (c.brand && c.brand.toLowerCase() === product.brand?.toLowerCase()) score += 30;
      score += this.similarityScore(c.name, product.name) * 20;
      return { ...c, score };
    }).sort((a, b) => b.score - a.score).slice(0, limit);
    return { productId: dto.productId, relatedProducts: scored };
  }

  async generateMetaKeywords(dto: GenerateMetaKeywordsDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { category: true, productBrand: true, specifications: true, attributes: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const result = await this.gateway.process({
      taskType: TaskType.SEO_GENERATION,
      payload: {
        action: 'generate_meta_keywords',
        instructions: `Generate comprehensive SEO meta data for "${product.name}" (Brand: ${product.productBrand?.name || product.brand || 'N/A'}, Category: ${product.category?.name || 'General'}, Description: ${product.shortDescription || product.description?.slice(0, 300) || ''}, Specs: ${product.specifications.slice(0, 5).map(s => `${s.key}: ${s.value}`).join(', ')}). Return JSON with keys: metaTitle (50-60 chars, compelling B2B title), metaDescription (150-160 chars, persuasive with CTA), metaKeywords (array of 10-15 relevant B2B keywords), focusKeyphrase (string - single best keyphrase), and reasoning (string).`,
        productName: product.name,
      },
    }, 'system', userId);
    let content: any;
    try { content = JSON.parse(result.content); } catch { content = { metaTitle: '', metaDescription: '', metaKeywords: [] }; }
    await this.createAiCache(dto.productId, AiJobType.META_KEYWORD_GENERATION, 'generate_meta_keywords', content);
    return { productId: dto.productId, suggestions: content };
  }

  private similarityScore(a: string, b: string): number {
    if (a === b) return 1;
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    return wordsA.size + wordsB.size > 0 ? intersection.size / Math.max(wordsA.size, wordsB.size) : 0;
  }

  private async createAiCache(productId: string, cacheType: AiJobType, prompt: string, response: any) {
    return this.prisma.productAiCache.create({ data: { productId, cacheType, prompt, response: response as any, model: 'gpt-4o-mini' } });
  }
}
