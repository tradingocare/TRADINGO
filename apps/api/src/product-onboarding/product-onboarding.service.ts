import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, DraftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../modules/search/search.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { v4 as uuid } from 'uuid';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `prod-${uuid().slice(0, 8)}`;
}

const PRODUCT_INDEX = 'products';

const DRAFT_INCLUDE = {
  company: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  draftSpecs: { orderBy: { sortOrder: 'asc' as const } },
  draftVariants: { orderBy: { sortOrder: 'asc' as const } },
  draftMedia: { orderBy: { sortOrder: 'asc' as const } },
  draftAttachments: { orderBy: { sortOrder: 'asc' as const } },
  certifications: true,
  multiLangDesc: true,
  priceSlabs: { orderBy: { minQty: 'asc' as const } },
  completeness: true,
};

@Injectable()
export class ProductOnboardingService {
  private readonly logger = new Logger(ProductOnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  private async getUserCompany(userId: string): Promise<{ companyId: string; companySlug: string }> {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: { select: { id: true, slug: true } } },
    });
    if (!owner) throw new ForbiddenException('You are not associated with any company');
    return { companyId: owner.company.id, companySlug: owner.company.slug };
  }

  private async requireDraftOwnership(draftId: string, companyId: string): Promise<any> {
    const draft = await this.prisma.productDraft.findFirst({
      where: { id: draftId, companyId },
      include: DRAFT_INCLUDE,
    });
    if (!draft) throw new NotFoundException('Draft not found');
    return draft;
  }

  private async syncOpenSearch(productId: string) {
    try {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
        include: {
          company: { select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true, status: true } },
          category: { select: { id: true, name: true, slug: true } },
          industry: { select: { id: true, name: true, slug: true } },
          inventory: { select: { availableQuantity: true, stockStatus: true } },
          media: { select: { id: true, url: true, type: true, sortOrder: true }, take: 1, orderBy: { sortOrder: 'asc' } },
          specifications: { select: { key: true, value: true } },
          priceSlabs: { select: { minQty: true, maxQty: true, price: true }, orderBy: { minQty: 'asc' } },
        },
      });
      if (!product) return;

      await this.searchService.indexDocument(PRODUCT_INDEX, product.id, {
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        productType: product.productType,
        status: product.status,
        categoryId: product.category?.id,
        categoryName: product.category?.name,
        industryId: product.industry?.id,
        industryName: product.industry?.name,
        companyId: product.company.id,
        companyName: product.company.name,
        companySlug: product.company.slug,
        trustScoreSnapshot: product.company.trustScore,
        verificationLevel: product.company.verificationLevel,
        brand: product.brand,
        model: product.model,
        sku: product.sku,
        moq: product.moq,
        unit: product.unit,
        visibilityRadius: product.visibilityRadius,
        isFeatured: product.isFeatured,
        latitude: product.latitude,
        longitude: product.longitude,
        thumbnail: product.media[0]?.url || null,
        specifications: Object.fromEntries(product.specifications.map((s: { key: string; value: string }) => [s.key, s.value])),
        inventoryStatus: product.inventory?.stockStatus || 'OUT_OF_STOCK',
        availableQuantity: product.inventory?.availableQuantity || 0,
        minPrice: product.priceSlabs[0]?.price || null,
        maxPrice: product.priceSlabs.length > 0 ? product.priceSlabs[product.priceSlabs.length - 1]?.price : null,
      });
    } catch (err) {
      this.logger.warn(`Failed to sync product ${productId} with OpenSearch: ${err}`);
    }
  }

  async createDraft(userId: string, dto: CreateDraftDto) {
    const { companyId } = await this.getUserCompany(userId);

    const draft = await this.prisma.$transaction(async (tx) => {
      const d = await tx.productDraft.create({
        data: {
          companyId,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId,
          name: dto.name,
          shortDescription: dto.shortDescription,
          description: dto.description,
          productType: dto.productType as any,
          brand: dto.brand,
          model: dto.model,
          sku: dto.sku,
          gtin: dto.gtin,
          hsCode: dto.hsCode,
          moq: dto.moq,
          unit: dto.unit,
          visibilityRadius: dto.visibilityRadius,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isSampleOrder: dto.isSampleOrder ?? false,
          samplePrice: dto.samplePrice,
          exportSupported: dto.exportSupported ?? false,
          exportCountries: dto.exportCountries ?? [],
          createdBy: userId,
          updatedBy: userId,
          draftSpecs: dto.specs?.length
            ? { create: dto.specs.map((s) => ({ key: s.key, value: s.value, sortOrder: s.sortOrder ?? 0 })) }
            : undefined,
          draftVariants: dto.variants?.length
            ? { create: dto.variants.map((v) => ({ variantType: v.variantType, customName: v.customName, value: v.value, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, currency: v.currency ?? 'INR', quantity: v.quantity ?? 0, sortOrder: v.sortOrder ?? 0 })) }
            : undefined,
          draftMedia: dto.media?.length
            ? { create: dto.media.map((m) => ({ type: m.type, url: m.url, title: m.title, altText: m.altText, isPrimary: m.isPrimary ?? false, sortOrder: m.sortOrder ?? 0 })) }
            : undefined,
          draftAttachments: dto.attachments?.length
            ? { create: dto.attachments.map((a) => ({ type: a.type, url: a.url, title: a.title, sortOrder: a.sortOrder ?? 0 })) }
            : undefined,
          certifications: dto.certifications?.length
            ? { create: dto.certifications.map((c) => ({ type: c.type, number: c.number, issuedBy: c.issuedBy, issuedAt: c.issuedAt ? new Date(c.issuedAt) : undefined, expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined, fileUrl: c.fileUrl })) }
            : undefined,
          multiLangDesc: dto.multiLangDescriptions?.length
            ? { create: dto.multiLangDescriptions.map((l) => ({ locale: l.locale, name: l.name, shortDescription: l.shortDescription, description: l.description, isPrimary: l.isPrimary ?? false })) }
            : undefined,
          priceSlabs: dto.priceSlabs?.length
            ? { create: dto.priceSlabs.map((p) => ({ minQty: p.minQty, maxQty: p.maxQty, price: p.price, currency: p.currency ?? 'INR' })) }
            : undefined,
        },
        include: DRAFT_INCLUDE,
      });

      await tx.auditLog.create({
        data: { userId, action: 'DRAFT_CREATED', resource: `draft:${d.id}`, metadata: { companyId } },
      });

      return d;
    });

    this.logger.log(`Draft ${draft.id} created by ${userId}`);
    return draft;
  }

  async getDraft(draftId: string, userId: string) {
    const { companyId } = await this.getUserCompany(userId);
    return this.requireDraftOwnership(draftId, companyId);
  }

  async updateDraft(draftId: string, userId: string, dto: UpdateDraftDto) {
    const { companyId } = await this.getUserCompany(userId);
    await this.requireDraftOwnership(draftId, companyId);

    const { specs, variants, media, attachments, certifications, multiLangDescriptions, priceSlabs, ...data } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.productDraft.update({
        where: { id: draftId },
        data: {
          ...data,
          productType: data.productType as any,
          updatedBy: userId,
          draftSpecs: specs !== undefined
            ? { deleteMany: {}, create: specs.map((s) => ({ key: s.key, value: s.value, sortOrder: s.sortOrder ?? 0 })) }
            : undefined,
          draftVariants: variants !== undefined
            ? { deleteMany: {}, create: variants.map((v) => ({ variantType: v.variantType, customName: v.customName, value: v.value, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, currency: v.currency ?? 'INR', quantity: v.quantity ?? 0, sortOrder: v.sortOrder ?? 0 })) }
            : undefined,
          draftMedia: media !== undefined
            ? { deleteMany: {}, create: media.map((m) => ({ type: m.type, url: m.url, title: m.title, altText: m.altText, isPrimary: m.isPrimary ?? false, sortOrder: m.sortOrder ?? 0 })) }
            : undefined,
          draftAttachments: attachments !== undefined
            ? { deleteMany: {}, create: attachments.map((a) => ({ type: a.type, url: a.url, title: a.title, sortOrder: a.sortOrder ?? 0 })) }
            : undefined,
          certifications: certifications !== undefined
            ? { deleteMany: {}, create: certifications.map((c) => ({ type: c.type, number: c.number, issuedBy: c.issuedBy, issuedAt: c.issuedAt ? new Date(c.issuedAt) : undefined, expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined, fileUrl: c.fileUrl })) }
            : undefined,
          multiLangDesc: multiLangDescriptions !== undefined
            ? { deleteMany: {}, create: multiLangDescriptions.map((l) => ({ locale: l.locale, name: l.name, shortDescription: l.shortDescription, description: l.description, isPrimary: l.isPrimary ?? false })) }
            : undefined,
          priceSlabs: priceSlabs !== undefined
            ? { deleteMany: {}, create: priceSlabs.map((p) => ({ minQty: p.minQty, maxQty: p.maxQty, price: p.price, currency: p.currency ?? 'INR' })) }
            : undefined,
        },
        include: DRAFT_INCLUDE,
      });

      await tx.auditLog.create({
        data: { userId, action: 'DRAFT_UPDATED', resource: `draft:${draftId}`, metadata: { changes: JSON.parse(JSON.stringify(dto)) } },
      });

      return u;
    });

    return updated;
  }

  async listDrafts(userId: string, page = 1, limit = 20, status?: DraftStatus) {
    const { companyId } = await this.getUserCompany(userId);

    const where: Prisma.ProductDraftWhereInput = { companyId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.productDraft.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          draftMedia: { take: 1, orderBy: { sortOrder: 'asc' } },
          completeness: true,
          _count: { select: { draftSpecs: true, draftVariants: true, draftMedia: true, certifications: true } },
        },
      }),
      this.prisma.productDraft.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async deleteDraft(draftId: string, userId: string) {
    const { companyId } = await this.getUserCompany(userId);
    await this.requireDraftOwnership(draftId, companyId);

    await this.prisma.$transaction(async (tx) => {
      await tx.productDraft.update({
        where: { id: draftId },
        data: { status: 'ARCHIVED' as DraftStatus, updatedBy: userId },
      });

      await tx.auditLog.create({
        data: { userId, action: 'DRAFT_ARCHIVED', resource: `draft:${draftId}` },
      });
    });

    this.logger.log(`Draft ${draftId} archived by ${userId}`);
  }

  async submitDraft(draftId: string, userId: string) {
    const { companyId, companySlug } = await this.getUserCompany(userId);
    const draft = await this.requireDraftOwnership(draftId, companyId);

    if (!draft.name) throw new BadRequestException('Product name is required to submit');
    if (!draft.categoryId) throw new BadRequestException('Category is required to submit');

    const base = slugify(draft.name);
    let slug = `${companySlug}-${base}`;
    let attempt = 0;
    while (await this.prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${companySlug}-${base}-${attempt}`;
    }

    const product = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({
        where: { id: companyId },
        select: { trustScore: true },
      });

      const p = await tx.product.create({
        data: {
          companyId,
          categoryId: draft.categoryId,
          name: draft.name,
          slug,
          shortDescription: draft.shortDescription,
          description: draft.description,
          productType: draft.productType || 'PHYSICAL' as any,
          status: 'ACTIVE' as any,
          brand: draft.brand,
          model: draft.model,
          sku: draft.sku,
          moq: draft.moq ?? 1,
          unit: draft.unit,
          visibilityRadius: draft.visibilityRadius,
          trustScoreSnapshot: company?.trustScore ?? 0,
          latitude: draft.latitude,
          longitude: draft.longitude,
          createdBy: userId,
          updatedBy: userId,
          media: draft.draftMedia?.length
            ? { create: draft.draftMedia.map((m: any) => ({ type: m.type, url: m.url, title: m.title, sortOrder: m.sortOrder ?? 0 })) }
            : undefined,
          specifications: draft.draftSpecs?.length
            ? { create: draft.draftSpecs.map((s: any) => ({ key: s.key, value: s.value, sortOrder: s.sortOrder ?? 0 })) }
            : undefined,
          variants: draft.draftVariants?.length
            ? { create: draft.draftVariants.map((v: any) => ({
                variantType: v.variantType,
                customName: v.customName,
                value: v.value,
                sku: v.sku,
                price: v.price !== null ? v.price : undefined,
                compareAtPrice: v.compareAtPrice !== null ? v.compareAtPrice : undefined,
                currency: v.currency || 'INR',
                inventory: v.quantity !== undefined
                  ? { create: { availableQuantity: v.quantity, minimumThreshold: 5, stockStatus: v.quantity > 0 ? 'IN_STOCK' as any : 'OUT_OF_STOCK' as any } }
                  : undefined,
              })) }
            : undefined,
          priceSlabs: draft.priceSlabs?.length
            ? { create: draft.priceSlabs.map((s: any) => ({ minQty: s.minQty, maxQty: s.maxQty, price: s.price, currency: s.currency || 'INR' })) }
            : undefined,
        },
        include: {
          company: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          media: { orderBy: { sortOrder: 'asc' } },
          specifications: { orderBy: { sortOrder: 'asc' } },
          variants: { include: { inventory: true }, orderBy: { sortOrder: 'asc' } },
          inventory: true,
          priceSlabs: { orderBy: { minQty: 'asc' } },
        },
      });

      await tx.productDraft.update({
        where: { id: draftId },
        data: { status: 'SUBMITTED' as DraftStatus, slug, submittedAt: new Date(), updatedBy: userId },
      });

      await tx.auditLog.create({
        data: { userId, action: 'DRAFT_SUBMITTED', resource: `draft:${draftId}`, metadata: { productId: p.id, name: draft.name } },
      });

      await tx.company.update({
        where: { id: companyId },
        data: { totalProducts: { increment: 1 }, updatedBy: userId },
      });

      return p;
    });

    await this.syncOpenSearch(product.id);

    this.logger.log(`Draft ${draftId} submitted as product ${product.id} by ${userId}`);
    return product;
  }

  async calculateCompleteness(draftId: string, userId: string) {
    const { companyId } = await this.getUserCompany(userId);
    const draft = await this.requireDraftOwnership(draftId, companyId);

    let basicInfo = 0;
    const basicFields = [
      draft.name, draft.categoryId, draft.productType, draft.description,
      draft.brand, draft.model, draft.unit, draft.moq, draft.hsCode, draft.gtin,
    ];
    basicInfo = Math.round((basicFields.filter(Boolean).length / basicFields.length) * 20);

    let specifications = 0;
    const specCount = draft.draftSpecs?.length ?? 0;
    specifications = Math.min(Math.round(specCount * 3), 15);

    let media = 0;
    const mediaItems = draft.draftMedia ?? [];
    const imageCount = mediaItems.filter((m: any) => m.type === 'IMAGE').length;
    const hasVideo = mediaItems.some((m: any) => m.type === 'VIDEO');
    if (imageCount > 0) media += 10;
    media += Math.min((imageCount - 1) * 5, 5);
    if (hasVideo) media += 5;

    let pricing = 0;
    const hasPriceSlabs = (draft.priceSlabs?.length ?? 0) > 0;
    if (hasPriceSlabs) pricing += 10;
    if (draft.moq) pricing += 5;
    pricing += 5;

    let variants = 0;
    const variantCount = draft.draftVariants?.length ?? 0;
    const variantsHavePricing = draft.draftVariants?.some((v: any) => v.price !== null && v.price !== undefined);
    if (variantCount > 0 && variantsHavePricing) variants = 10;

    let certifications = 0;
    const certCount = draft.certifications?.length ?? 0;
    certifications = Math.min(certCount * 2, 10);

    let localization = 0;
    const hasMultiLang = (draft.multiLangDesc?.length ?? 0) > 0;
    if (hasMultiLang) localization = 5;

    const total = basicInfo + specifications + media + pricing + variants + certifications + localization;

    const score = await this.prisma.productCompletenessScore.upsert({
      where: { draftId },
      create: { draftId, total, basicInfo, specifications, media, pricing, variants, certifications, localization, lastCalculatedAt: new Date() },
      update: { total, basicInfo, specifications, media, pricing, variants, certifications, localization, lastCalculatedAt: new Date() },
    });

    return score;
  }

  async getAttributeTemplate(categoryId: string) {
    const template = await this.prisma.attributeTemplate.findFirst({
      where: { categoryId, isActive: true },
      include: { fields: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    if (!template) throw new NotFoundException('No attribute template found for this category');
    return template;
  }

  async createOrUpdateTemplate(categoryId: string, name: string, fields: any[]) {
    const existing = await this.prisma.attributeTemplate.findUnique({
      where: { categoryId_name: { categoryId, name } },
    });

    if (existing) {
      return this.prisma.$transaction(async (tx) => {
        await tx.attributeTemplateField.deleteMany({ where: { templateId: existing.id } });
        return tx.attributeTemplate.update({
          where: { id: existing.id },
          data: {
            fields: { create: fields.map((f: any, i: number) => ({ key: f.key, label: f.label, type: f.type, placeholder: f.placeholder, helpText: f.helpText, defaultValue: f.defaultValue, options: f.options ?? [], unit: f.unit, minValue: f.minValue, maxValue: f.maxValue, minLength: f.minLength, maxLength: f.maxLength, required: f.required ?? false, conditionKey: f.conditionKey, conditionValue: f.conditionValue, sortOrder: f.sortOrder ?? i, section: f.section })) },
          },
          include: { fields: { orderBy: { sortOrder: 'asc' } } },
        });
      });
    }

    return this.prisma.attributeTemplate.create({
      data: {
        categoryId,
        name,
        fields: { create: fields.map((f: any, i: number) => ({ key: f.key, label: f.label, type: f.type, placeholder: f.placeholder, helpText: f.helpText, defaultValue: f.defaultValue, options: f.options ?? [], unit: f.unit, minValue: f.minValue, maxValue: f.maxValue, minLength: f.minLength, maxLength: f.maxLength, required: f.required ?? false, conditionKey: f.conditionKey, conditionValue: f.conditionValue, sortOrder: f.sortOrder ?? i, section: f.section })) },
      },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async autoSave(draftId: string, userId: string, dto: UpdateDraftDto) {
    const { companyId } = await this.getUserCompany(userId);
    await this.requireDraftOwnership(draftId, companyId);

    const { specs, variants, media, attachments, certifications, multiLangDescriptions, priceSlabs, ...data } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.productDraft.update({
        where: { id: draftId },
        data: {
          ...data,
          productType: data.productType as any,
          updatedBy: userId,
          lastAutoSavedAt: new Date(),
          draftSpecs: specs !== undefined
            ? { deleteMany: {}, create: specs.map((s) => ({ key: s.key, value: s.value, sortOrder: s.sortOrder ?? 0 })) }
            : undefined,
          draftVariants: variants !== undefined
            ? { deleteMany: {}, create: variants.map((v) => ({ variantType: v.variantType, customName: v.customName, value: v.value, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, currency: v.currency ?? 'INR', quantity: v.quantity ?? 0, sortOrder: v.sortOrder ?? 0 })) }
            : undefined,
          draftMedia: media !== undefined
            ? { deleteMany: {}, create: media.map((m) => ({ type: m.type, url: m.url, title: m.title, altText: m.altText, isPrimary: m.isPrimary ?? false, sortOrder: m.sortOrder ?? 0 })) }
            : undefined,
          draftAttachments: attachments !== undefined
            ? { deleteMany: {}, create: attachments.map((a) => ({ type: a.type, url: a.url, title: a.title, sortOrder: a.sortOrder ?? 0 })) }
            : undefined,
          certifications: certifications !== undefined
            ? { deleteMany: {}, create: certifications.map((c) => ({ type: c.type, number: c.number, issuedBy: c.issuedBy, issuedAt: c.issuedAt ? new Date(c.issuedAt) : undefined, expiresAt: c.expiresAt ? new Date(c.expiresAt) : undefined, fileUrl: c.fileUrl })) }
            : undefined,
          multiLangDesc: multiLangDescriptions !== undefined
            ? { deleteMany: {}, create: multiLangDescriptions.map((l) => ({ locale: l.locale, name: l.name, shortDescription: l.shortDescription, description: l.description, isPrimary: l.isPrimary ?? false })) }
            : undefined,
          priceSlabs: priceSlabs !== undefined
            ? { deleteMany: {}, create: priceSlabs.map((p) => ({ minQty: p.minQty, maxQty: p.maxQty, price: p.price, currency: p.currency ?? 'INR' })) }
            : undefined,
        },
        include: DRAFT_INCLUDE,
      });

      await tx.auditLog.create({
        data: { userId, action: 'DRAFT_AUTO_SAVED', resource: `draft:${draftId}` },
      });

      return u;
    });

    return updated;
  }
}
