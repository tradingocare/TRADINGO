import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, StockStatus, MediaType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Role } from '../../common/enums/role.enum';
import { v4 as uuid } from 'uuid';
import { ProductAttributeDisplayService } from './services/product-attribute-display.service';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `prod-${uuid().slice(0, 8)}`;
}

const PRODUCT_INDEX = 'products';

const MEDIA_LIMITS: Record<MediaType, number> = {
  IMAGE: 5,
  VIDEO: 5,
  DOCUMENT: 10,
};

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly attributeDisplayService: ProductAttributeDisplayService,
  ) {}

  private async generateUniqueSlug(name: string, companySlug: string): Promise<string> {
    const base = slugify(name);
    let slug = `${companySlug}-${base}`;
    let attempt = 0;
    while (await this.prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${companySlug}-${base}-${attempt}`;
    }
    return slug;
  }

  private async requireCompanyOwner(companyId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN) return;

    const owner = await this.prisma.companyOwner.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { id: true },
    });
    if (!owner) throw new ForbiddenException('You are not an owner of this company');
  }

  private validateMediaLimits(media: { type: MediaType }[]) {
    const counts: Record<string, number> = {};
    for (const m of media) {
      counts[m.type] = (counts[m.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(counts)) {
      const limit = MEDIA_LIMITS[type as MediaType];
      if (limit !== undefined && count > limit) {
        throw new BadRequestException(`Maximum ${limit} ${type.toLowerCase()}(s) allowed per product`);
      }
    }
  }

  private validatePriceSlabs(slabs: { minQty: number; maxQty?: number | null; price: number }[]) {
    const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].price <= 0) throw new BadRequestException('Price must be greater than 0');
      if (i > 0) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (prev.maxQty && curr.minQty <= prev.maxQty) {
          throw new BadRequestException('Price slabs must not overlap');
        }
      }
    }
  }

  private determineStockStatus(available: number, threshold: number): StockStatus {
    if (available <= 0) return 'OUT_OF_STOCK';
    if (available <= threshold) return 'LOW_STOCK';
    return 'IN_STOCK';
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

  async create(dto: CreateProductDto, userId: string) {
    await this.requireCompanyOwner(dto.companyId, userId);

    const company = await this.prisma.company.findFirst({
      where: { id: dto.companyId, deletedAt: null },
      select: { id: true, slug: true, trustScore: true, verificationLevel: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const slug = await this.generateUniqueSlug(dto.name, company.slug);

    if (dto.media?.length) this.validateMediaLimits(dto.media);
    if (dto.priceSlabs?.length) this.validatePriceSlabs(dto.priceSlabs);

    const product = await this.prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          companyId: dto.companyId,
          categoryId: dto.categoryId,
          industryId: dto.industryId,
          name: dto.name,
          slug,
          shortDescription: dto.shortDescription,
          description: dto.description,
          productType: dto.productType || 'PHYSICAL',
          status: dto.status || 'DRAFT',
          brand: dto.brand,
          model: dto.model,
          sku: dto.sku,
          moq: dto.moq ?? 1,
          unit: dto.unit,
          visibilityRadius: dto.visibilityRadius,
          isFeatured: dto.isFeatured ?? false,
          trustScoreSnapshot: company.trustScore,
          latitude: dto.latitude,
          longitude: dto.longitude,
          createdBy: userId,
          updatedBy: userId,
          media: dto.media?.length ? { create: dto.media } : undefined,
          specifications: dto.specifications?.length
            ? { create: dto.specifications.map((s) => ({ key: s.key, value: s.value, sortOrder: s.sortOrder ?? 0 })) }
            : undefined,
          variants: dto.variants?.length
            ? {
                create: dto.variants.map((v) => ({
                  variantType: v.variantType,
                  customName: v.customName,
                  value: v.value,
                  sku: v.sku,
                  price: v.price !== undefined ? v.price : undefined,
                  compareAtPrice: v.compareAtPrice !== undefined ? v.compareAtPrice : undefined,
                  currency: v.currency || 'INR',
                  inventory: v.availableQuantity !== undefined
                    ? {
                        create: {
                          availableQuantity: v.availableQuantity,
                          minimumThreshold: v.minimumThreshold ?? 5,
                          stockStatus: this.determineStockStatus(v.availableQuantity, v.minimumThreshold ?? 5),
                        },
                      }
                    : undefined,
                })),
              }
            : undefined,
          inventory: dto.availableQuantity !== undefined
            ? {
                create: {
                  availableQuantity: dto.availableQuantity,
                  minimumThreshold: dto.minimumThreshold ?? 5,
                  stockStatus: this.determineStockStatus(dto.availableQuantity, dto.minimumThreshold ?? 5),
                },
              }
            : undefined,
          priceSlabs: dto.priceSlabs?.length
            ? { create: dto.priceSlabs.map((s) => ({ minQty: s.minQty, maxQty: s.maxQty, price: s.price, currency: s.currency || 'INR' })) }
            : undefined,
        },
        include: {
          company: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          industry: { select: { id: true, name: true, slug: true } },
          media: { orderBy: { sortOrder: 'asc' } },
          specifications: { orderBy: { sortOrder: 'asc' } },
          variants: { include: { inventory: true }, orderBy: { sortOrder: 'asc' } },
          inventory: true,
          priceSlabs: { orderBy: { minQty: 'asc' } },
        },
      });

      await tx.auditLog.create({
        data: { userId, action: 'PRODUCT_CREATED', resource: `product:${p.id}`, metadata: { name: dto.name, slug, companyId: dto.companyId } },
      });

      await tx.company.update({
        where: { id: dto.companyId },
        data: { totalProducts: { increment: 1 }, updatedBy: userId },
      });

      return p;
    });

    await this.syncOpenSearch(product.id);

    this.logger.log(`Product ${product.id} created by ${userId}`);
    return product;
  }

  async findAll(query: {
    cursor?: string; limit?: number; search?: string;
    companyId?: string; categoryId?: string; industryId?: string;
    productType?: string; status?: string; ownerId?: string; isFeatured?: string;
  }) {
    const { cursor, limit = 20, search, companyId, categoryId, industryId, productType, status, isFeatured } = query;
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (companyId) where.companyId = companyId;
    if (categoryId) where.categoryId = categoryId;
    if (industryId) where.industryId = industryId;
    if (productType) where.productType = productType as Prisma.EnumProductTypeFilter['equals'];
    if (status) where.status = status as Prisma.EnumProductStatusFilter['equals'];
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';

    const findArgs: Prisma.ProductFindManyArgs = {
      where, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, slug: true, trustScore: true } },
        category: { select: { id: true, name: true, slug: true } },
        industry: { select: { id: true, name: true, slug: true } },
        media: { take: 1, orderBy: { sortOrder: 'asc' } },
        inventory: { select: { availableQuantity: true, stockStatus: true } },
        priceSlabs: { orderBy: { minQty: 'asc' } },
        _count: { select: { media: true, variants: true, specifications: true } },
      },
    };
    if (cursor) { findArgs.cursor = { id: cursor }; findArgs.skip = 1; }
    const [data, total] = await Promise.all([
      this.prisma.product.findMany(findArgs),
      this.prisma.product.count({ where }),
    ]);
    return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
  }

  async findByCompany(companyId: string, query: { status?: string; page?: number; limit?: number }, userId: string) {
    await this.requireCompanyOwner(companyId, userId);
    const { status, page = 1, limit = 20 } = query;
    const where: Prisma.ProductWhereInput = { companyId, deletedAt: null };
    if (status) where.status = status as any;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          media: { select: { id: true, url: true, type: true }, take: 1, orderBy: { sortOrder: 'asc' } },
          inventory: { select: { availableQuantity: true, stockStatus: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: { select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true } },
        category: { select: { id: true, name: true, slug: true } },
        industry: { select: { id: true, name: true, slug: true } },
        media: { orderBy: { sortOrder: 'asc' } },
        specifications: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true }, orderBy: { sortOrder: 'asc' } },
        inventory: true,
        priceSlabs: { orderBy: { minQty: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true, trustScore: true, verificationLevel: true, responseRate: true, gstNumber: true, totalProducts: true, locations: { where: { isPrimary: true }, select: { city: true, state: true }, take: 1 } } },
        category: { select: { id: true, name: true, slug: true } },
        industry: { select: { id: true, name: true, slug: true } },
        media: { orderBy: { sortOrder: 'asc' } },
        specifications: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true }, orderBy: { sortOrder: 'asc' } },
        inventory: true,
        priceSlabs: { orderBy: { minQty: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Track view
    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    const productAttributes = await this.attributeDisplayService.getDisplayAttributes(
      product.id,
      product.categoryId || undefined,
    );

    return Object.assign(product, { productAttributes }) as any;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, companyId: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.requireCompanyOwner(product.companyId, userId);

    if (dto.media?.length) this.validateMediaLimits(dto.media);
    if (dto.priceSlabs?.length) this.validatePriceSlabs(dto.priceSlabs);

    const { media, specifications, variants, availableQuantity, minimumThreshold, priceSlabs, ...updateData } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.product.update({
        where: { id },
        data: {
          ...updateData,
          updatedBy: userId,
          media: media !== undefined
            ? { deleteMany: {}, create: media.map((m) => ({ type: m.type, url: m.url, title: m.title, sortOrder: m.sortOrder ?? 0 })) }
            : undefined,
          specifications: specifications !== undefined
            ? { deleteMany: {}, create: specifications.map((s) => ({ key: s.key, value: s.value, sortOrder: s.sortOrder ?? 0 })) }
            : undefined,
          variants: variants !== undefined
            ? {
                deleteMany: {},
                create: variants.map((v) => ({
                  variantType: v.variantType,
                  customName: v.customName,
                  value: v.value,
                  sku: v.sku,
                  price: v.price !== undefined ? v.price : undefined,
                  compareAtPrice: v.compareAtPrice !== undefined ? v.compareAtPrice : undefined,
                  currency: v.currency || 'INR',
                  inventory: v.availableQuantity !== undefined
                    ? { create: { availableQuantity: v.availableQuantity, minimumThreshold: v.minimumThreshold ?? 5, stockStatus: this.determineStockStatus(v.availableQuantity, v.minimumThreshold ?? 5) } }
                    : undefined,
                })),
              }
            : undefined,
          priceSlabs: priceSlabs !== undefined
            ? { deleteMany: {}, create: priceSlabs.map((s) => ({ minQty: s.minQty, maxQty: s.maxQty, price: s.price, currency: s.currency || 'INR' })) }
            : undefined,
          inventory: availableQuantity !== undefined
            ? {
                upsert: {
                  create: { availableQuantity, minimumThreshold: minimumThreshold ?? 5, stockStatus: this.determineStockStatus(availableQuantity, minimumThreshold ?? 5) },
                  update: { availableQuantity, minimumThreshold: minimumThreshold ?? 5, stockStatus: this.determineStockStatus(availableQuantity, minimumThreshold ?? 5) },
                },
              }
            : undefined,
        },
        include: {
          company: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          industry: { select: { id: true, name: true, slug: true } },
          media: { orderBy: { sortOrder: 'asc' } },
          specifications: { orderBy: { sortOrder: 'asc' } },
          variants: { include: { inventory: true }, orderBy: { sortOrder: 'asc' } },
          inventory: true,
          priceSlabs: { orderBy: { minQty: 'asc' } },
        },
      });

      await tx.auditLog.create({
        data: { userId, action: 'PRODUCT_UPDATED', resource: `product:${id}`, metadata: { changes: JSON.parse(JSON.stringify(dto)) } },
      });

      return u;
    });

    await this.syncOpenSearch(id);

    return updated;
  }

  async remove(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, companyId: true, name: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.requireCompanyOwner(product.companyId, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'DISCONTINUED', updatedBy: userId },
      });

      await tx.auditLog.create({
        data: { userId, action: 'PRODUCT_DELETED', resource: `product:${id}`, metadata: { name: product.name } },
      });

      await tx.company.update({
        where: { id: product.companyId },
        data: { totalProducts: { decrement: 1 }, updatedBy: userId },
      });
    });

    try {
      await this.searchService.deleteDocument(PRODUCT_INDEX, id);
    } catch (err) {
      this.logger.warn(`Failed to delete product ${id} from OpenSearch: ${err}`);
    }

    this.logger.log(`Product ${id} soft-deleted by ${userId}`);
  }

  async publish(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, companyId: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.requireCompanyOwner(product.companyId, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.product.update({
        where: { id },
        data: { status: 'ACTIVE', updatedBy: userId },
      });

      await tx.auditLog.create({
        data: { userId, action: 'PRODUCT_PUBLISHED', resource: `product:${id}` },
      });

      return u;
    });

    await this.syncOpenSearch(id);
    return updated;
  }

  async unpublish(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, companyId: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.requireCompanyOwner(product.companyId, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.product.update({
        where: { id },
        data: { status: 'INACTIVE', updatedBy: userId },
      });

      await tx.auditLog.create({
        data: { userId, action: 'PRODUCT_UNPUBLISHED', resource: `product:${id}` },
      });

      return u;
    });

    await this.syncOpenSearch(id);
    return updated;
  }

  async archive(id: string, userId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, companyId: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.requireCompanyOwner(product.companyId, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.product.update({
        where: { id },
        data: { status: 'DISCONTINUED', updatedBy: userId },
      });

      await tx.auditLog.create({
        data: { userId, action: 'PRODUCT_ARCHIVED', resource: `product:${id}` },
      });

      return u;
    });

    await this.syncOpenSearch(id);
    return updated;
  }

  async duplicate(id: string, userId: string) {
    const original = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        specifications: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { sortOrder: 'asc' } },
        priceSlabs: { orderBy: { minQty: 'asc' } },
      },
    });
    if (!original) throw new NotFoundException('Product not found');
    await this.requireCompanyOwner(original.companyId, userId);

    const company = await this.prisma.company.findUnique({
      where: { id: original.companyId },
      select: { slug: true, trustScore: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const slug = await this.generateUniqueSlug(original.name, company.slug);

    const duplicate = await this.prisma.$transaction(async (tx) => {
      const d = await tx.product.create({
        data: {
          companyId: original.companyId,
          categoryId: original.categoryId,
          industryId: original.industryId,
          name: `${original.name} (Copy)`,
          slug,
          shortDescription: original.shortDescription,
          description: original.description,
          productType: original.productType,
          status: 'DRAFT',
          brand: original.brand,
          model: original.model,
          sku: original.sku ? `${original.sku}-copy` : undefined,
          moq: original.moq,
          unit: original.unit,
          visibilityRadius: original.visibilityRadius,
          isFeatured: false,
          trustScoreSnapshot: company.trustScore,
          createdBy: userId,
          updatedBy: userId,
          media: original.media.length ? { create: original.media.map((m) => ({ type: m.type, url: m.url, title: m.title, sortOrder: m.sortOrder })) } : undefined,
          specifications: original.specifications.length
            ? { create: original.specifications.map((s) => ({ key: s.key, value: s.value, sortOrder: s.sortOrder })) }
            : undefined,
          priceSlabs: original.priceSlabs.length
            ? { create: original.priceSlabs.map((s) => ({ minQty: s.minQty, maxQty: s.maxQty, price: s.price, currency: s.currency })) }
            : undefined,
        },
        include: {
          company: { select: { id: true, name: true, slug: true } },
          media: { orderBy: { sortOrder: 'asc' } },
          specifications: { orderBy: { sortOrder: 'asc' } },
          priceSlabs: { orderBy: { minQty: 'asc' } },
        },
      });

      await tx.auditLog.create({
        data: { userId, action: 'PRODUCT_DUPLICATED', resource: `product:${d.id}`, metadata: { originalProductId: id } },
      });

      await tx.company.update({
        where: { id: original.companyId },
        data: { totalProducts: { increment: 1 }, updatedBy: userId },
      });

      return d;
    });

    await this.syncOpenSearch(duplicate.id);

    return duplicate;
  }

  async updateInventory(productId: string, availableQuantity: number, minimumThreshold: number, userId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null }, select: { id: true, companyId: true, status: true } });
    if (!product) throw new NotFoundException('Product not found');
    await this.requireCompanyOwner(product.companyId, userId);

    const stockStatus = this.determineStockStatus(availableQuantity, minimumThreshold);

    const inventory = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.productInventory.upsert({
        where: { productId },
        create: { productId, availableQuantity, minimumThreshold, stockStatus },
        update: { availableQuantity, minimumThreshold, stockStatus },
      });

      await tx.auditLog.create({
        data: { userId, action: 'INVENTORY_CHANGED', resource: `product:${productId}`, metadata: { availableQuantity, minimumThreshold, stockStatus } },
      });

      if (stockStatus === 'OUT_OF_STOCK') {
        await tx.product.update({ where: { id: productId }, data: { status: 'OUT_OF_STOCK', updatedBy: userId } });
      } else if (product.status === 'OUT_OF_STOCK') {
        await tx.product.update({ where: { id: productId }, data: { status: 'ACTIVE', updatedBy: userId } });
      }

      return inv;
    });

    await this.syncOpenSearch(productId);

    return inventory;
  }

  async findRelated(slug: string, limit = 8) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, categoryId: true, companyId: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const related = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        id: { not: product.id },
        OR: [
          { categoryId: product.categoryId },
          { companyId: product.companyId },
        ],
      },
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true, trustScore: true, verificationLevel: true, responseRate: true, gstNumber: true } },
        media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { id: true, type: true, url: true, title: true } },
        inventory: { select: { availableQuantity: true, stockStatus: true } },
        priceSlabs: { orderBy: { minQty: 'asc' }, select: { id: true, minQty: true, maxQty: true, price: true, currency: true } },
        specifications: { take: 6, orderBy: { sortOrder: 'asc' }, select: { id: true, key: true, value: true, label: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return related.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      moq: p.moq,
      unit: p.unit,
      trustScoreSnapshot: p.company.trustScore,
      monthlyOrders: p.monthlyOrders,
      isBestseller: p.isBestseller,
      isFeatured: p.isFeatured,
      viewCount: p.viewCount,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      videoUrl: p.videoUrl,
      gstInvoiceAvailable: p.gstInvoiceAvailable,
      tradeCreditEligible: p.tradeCreditEligible,
      returnPolicy: p.returnPolicy,
      deliveryEta: p.deliveryEta,
      freeDeliveryAbove: p.freeDeliveryAbove ? Number(p.freeDeliveryAbove) : undefined,
      maxOrderQty: p.maxOrderQty,
      savedCount: p.savedCount,
      company: p.company,
      companyName: p.company.name,
      companySlug: p.company.slug,
      media: p.media,
      image: p.media[0]?.url || null,
      inventory: p.inventory,
      priceSlabs: p.priceSlabs,
      specifications: p.specifications,
      category: p.category,
      minPrice: p.priceSlabs[0]?.price || null,
      maxPrice: p.priceSlabs.length > 1 ? p.priceSlabs[p.priceSlabs.length - 1].price : null,
    }));
  }

  async searchProducts(query: string, filters: {
    categoryId?: string; industryId?: string; productType?: string;
    companyId?: string; minPrice?: number; maxPrice?: number;
    verificationLevel?: string; city?: string; state?: string;
    latitude?: number; longitude?: number; radius?: number;
  } = {}) {
    const searchFilters: Record<string, string | number | boolean | undefined> = {};
    if (filters.categoryId) searchFilters.categoryId = filters.categoryId;
    if (filters.industryId) searchFilters.industryId = filters.industryId;
    if (filters.productType) searchFilters.productType = filters.productType;
    if (filters.companyId) searchFilters.companyId = filters.companyId;
    if (filters.verificationLevel) searchFilters.verificationLevel = filters.verificationLevel;
    if (filters.city) searchFilters.city = filters.city;
    if (filters.state) searchFilters.state = filters.state;

    const result = await this.searchService.search<Record<string, unknown>>(
      PRODUCT_INDEX,
      query,
      searchFilters,
      { page: 1, limit: 50 },
    );

    const ids = result.hits.map((hit) => hit.id as string);
    if (ids.length === 0) return { data: [], meta: { total: 0, limit: 50, cursor: undefined } };

    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null, status: { not: 'DISCONTINUED' as Prisma.EnumProductStatusFilter['not'] } },
      include: {
        company: { select: { id: true, name: true, slug: true, logo: true, trustScore: true, verificationLevel: true } },
        category: { select: { id: true, name: true, slug: true } },
        industry: { select: { id: true, name: true, slug: true } },
        media: { take: 1, orderBy: { sortOrder: 'asc' } },
        inventory: { select: { availableQuantity: true, stockStatus: true } },
        priceSlabs: { orderBy: { minQty: 'asc' } },
      },
    });

    const idOrder = new Map(ids.map((id, index) => [id, index]));
    products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

    return {
      data: products,
      meta: { total: result.total, limit: 50, cursor: undefined },
    };
  }
}
