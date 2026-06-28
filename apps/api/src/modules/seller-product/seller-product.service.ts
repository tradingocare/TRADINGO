import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { ProductStatus, Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

const PRODUCT_INDEX = 'products';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `prod-${uuid().slice(0, 8)}`;
}

const MEMBERSHIP_LIMITS: Record<string, { maxProducts: number; bulkImport: boolean; mediaStorageMB: number }> = {
  trade_start: { maxProducts: 1, bulkImport: false, mediaStorageMB: 50 },
  trade_smart: { maxProducts: 25, bulkImport: true, mediaStorageMB: 200 },
  trade_plus: { maxProducts: 100, bulkImport: true, mediaStorageMB: 500 },
  trade_pro: { maxProducts: 500, bulkImport: true, mediaStorageMB: 1024 },
  trade_premium: { maxProducts: 2000, bulkImport: true, mediaStorageMB: 2048 },
  trade_elite: { maxProducts: -1, bulkImport: true, mediaStorageMB: 5120 },
};

@Injectable()
export class SellerProductService {
  private readonly logger = new Logger(SellerProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: { company: true },
    });
    if (!owner) throw new ForbiddenException('Company not found');
    return owner.company;
  }

  async checkMembershipLimit(companyId: string): Promise<{ allowed: boolean; current: number; max: number }> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const plan = company.subscriptionPlan || 'trade_start';
    const limits = MEMBERSHIP_LIMITS[plan] || MEMBERSHIP_LIMITS.trade_start;

    const current = await this.prisma.product.count({
      where: { companyId, deletedAt: null, status: { not: 'DISCONTINUED' as ProductStatus } },
    });

    if (limits.maxProducts === -1) return { allowed: true, current, max: Infinity };
    return { allowed: current < limits.maxProducts, current, max: limits.maxProducts };
  }

  async getStatusCounts(userId: string) {
    const company = await this.resolveCompany(userId);
    const counts = await Promise.all(
      (['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'ACTIVE', 'INACTIVE', 'DISCONTINUED'] as ProductStatus[]).map(status =>
        this.prisma.product.count({ where: { companyId: company.id, status, deletedAt: null } })
      ),
    );
    const result: Record<string, number> = {};
    (['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'ACTIVE', 'INACTIVE', 'DISCONTINUED'] as ProductStatus[]).forEach((s, i) => {
      result[s] = counts[i];
    });
    result.TOTAL = Object.values(result).reduce((a, b) => a + b, 0);
    return result;
  }

  async listProducts(userId: string, query: { status?: string; search?: string; page?: number; limit?: number }) {
    const company = await this.resolveCompany(userId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { companyId: company.id, deletedAt: null };
    if (query.status) where.status = query.status as ProductStatus;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { brand: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          media: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true } },
          inventory: { select: { availableQuantity: true, stockStatus: true } },
          priceSlabs: { orderBy: { minQty: 'asc' }, take: 1 },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getProduct(userId: string, productId: string) {
    const company = await this.resolveCompany(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId: company.id, deletedAt: null },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        specifications: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true }, orderBy: { sortOrder: 'asc' } },
        inventory: true,
        priceSlabs: { orderBy: { minQty: 'asc' } },
        productBrand: true,
        category: { select: { id: true, name: true, slug: true } },
        industry: { select: { id: true, name: true } },
        approvals: { orderBy: { createdAt: 'desc' } },
        attributes: true,
        attachments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(userId: string, dto: any) {
    const company = await this.resolveCompany(userId);
    const limit = await this.checkMembershipLimit(company.id);
    if (!limit.allowed) throw new BadRequestException(`Membership limit reached: ${limit.max} products`);

    const slug = dto.slug || slugify(dto.name);
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already exists`);

    const product = await this.prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: dto.categoryId,
        industryId: dto.industryId,
        name: dto.name,
        slug,
        shortDescription: dto.shortDescription,
        description: dto.description,
        productType: dto.productType || 'PHYSICAL',
        status: 'DRAFT',
        brand: dto.brand,
        brandId: dto.brandId,
        model: dto.model,
        sku: dto.sku,
        moq: dto.moq || 1,
        unit: dto.unit,
        originalPrice: dto.originalPrice ? Number(dto.originalPrice) : undefined,
        videoUrl: dto.videoUrl,
        returnPolicy: dto.returnPolicy,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    if (dto.specifications) {
      await this.prisma.productSpecification.createMany({
        data: dto.specifications.map((s: any) => ({ productId: product.id, key: s.key, value: s.value, sortOrder: s.sortOrder || 0 })),
      });
    }

    if (dto.priceSlabs) {
      await this.prisma.productPriceSlab.createMany({
        data: dto.priceSlabs.map((p: any) => ({ productId: product.id, minQty: p.minQty, maxQty: p.maxQty, price: Number(p.price), currency: p.currency || 'INR' })),
      });
    }

    if (dto.media) {
      await this.prisma.productMedia.createMany({
        data: dto.media.map((m: any) => ({ productId: product.id, type: m.type || 'IMAGE', url: m.url, title: m.title, altText: m.altText, isPrimary: m.isPrimary || false, sortOrder: m.sortOrder || 0 })),
      });
    }

    if (dto.inventory) {
      await this.prisma.productInventory.create({
        data: { productId: product.id, availableQuantity: dto.inventory.quantity || 0, stockStatus: (dto.inventory.quantity || 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK' },
      });
    }

    try { await this.searchService.indexDocument(PRODUCT_INDEX, product.id, { name: product.name, slug: product.slug }); } catch (e) { this.logger.warn('Search index failed', e); }

    return this.getProduct(userId, product.id);
  }

  async updateProduct(userId: string, productId: string, dto: any) {
    const company = await this.resolveCompany(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId: company.id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    const updateData: any = { updatedBy: userId };
    const fields = ['name', 'shortDescription', 'description', 'productType', 'brand', 'model', 'sku', 'moq', 'unit', 'categoryId', 'industryId', 'originalPrice', 'videoUrl', 'returnPolicy', 'brandId'];
    for (const f of fields) {
      if (dto[f] !== undefined) updateData[f] = dto[f];
    }
    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException(`Slug "${dto.slug}" already exists`);
      updateData.slug = dto.slug;
    }

    await this.prisma.product.update({ where: { id: productId }, data: updateData });

    if (dto.specifications !== undefined) {
      await this.prisma.productSpecification.deleteMany({ where: { productId } });
      if (dto.specifications.length) {
        await this.prisma.productSpecification.createMany({
          data: dto.specifications.map((s: any) => ({ productId, key: s.key, value: s.value, sortOrder: s.sortOrder || 0 })),
        });
      }
    }

    if (dto.priceSlabs !== undefined) {
      await this.prisma.productPriceSlab.deleteMany({ where: { productId } });
      if (dto.priceSlabs.length) {
        await this.prisma.productPriceSlab.createMany({
          data: dto.priceSlabs.map((p: any) => ({ productId, minQty: p.minQty, maxQty: p.maxQty, price: Number(p.price), currency: p.currency || 'INR' })),
        });
      }
    }

    if (dto.media !== undefined) {
      await this.prisma.productMedia.deleteMany({ where: { productId } });
      if (dto.media.length) {
        await this.prisma.productMedia.createMany({
          data: dto.media.map((m: any) => ({ productId, type: m.type || 'IMAGE', url: m.url, title: m.title, altText: m.altText, isPrimary: m.isPrimary || false, sortOrder: m.sortOrder || 0 })),
        });
      }
    }

    if (dto.inventory !== undefined) {
      await this.prisma.productInventory.upsert({
        where: { productId },
        create: { productId, availableQuantity: dto.inventory.quantity || 0, stockStatus: (dto.inventory.quantity || 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK' },
        update: { availableQuantity: dto.inventory.quantity, stockStatus: (dto.inventory.quantity || 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK' },
      });
    }

    try { await this.searchService.indexDocument(PRODUCT_INDEX, product.id, { name: product.name, slug: product.slug }); } catch (e) { this.logger.warn('Search index failed', e); }

    return this.getProduct(userId, product.id);
  }

  async deleteProduct(userId: string, productId: string) {
    const company = await this.resolveCompany(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId: company.id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), status: 'DISCONTINUED', updatedBy: userId },
    });
    return { success: true };
  }

  async submitForApproval(userId: string, productId: string) {
    const company = await this.resolveCompany(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId: company.id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'DRAFT') throw new BadRequestException('Only draft products can be submitted');

    const mediaCount = await this.prisma.productMedia.count({ where: { productId } });
    if (mediaCount === 0) throw new BadRequestException('At least one image is required');

    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id: productId }, data: { status: 'PENDING_APPROVAL', updatedBy: userId } }),
      this.prisma.productApproval.create({ data: { productId, action: 'SUBMITTED' } }),
    ]);

    return this.getProduct(userId, productId);
  }

  async duplicateProduct(userId: string, productId: string) {
    const company = await this.resolveCompany(userId);
    const original = await this.prisma.product.findFirst({
      where: { id: productId, companyId: company.id, deletedAt: null },
      include: { media: true, specifications: true, priceSlabs: true, inventory: true },
    });
    if (!original) throw new NotFoundException('Product not found');

    const limit = await this.checkMembershipLimit(company.id);
    if (!limit.allowed) throw new BadRequestException(`Membership limit reached: ${limit.max} products`);

    const newSlug = `${original.slug}-copy-${uuid().slice(0, 4)}`;
    const product = await this.prisma.product.create({
      data: {
        companyId: company.id, categoryId: original.categoryId, name: `${original.name} (Copy)`,
        slug: newSlug, shortDescription: original.shortDescription, description: original.description,
        productType: original.productType, status: 'DRAFT', brand: original.brand, model: original.model,
        sku: original.sku ? `${original.sku}-COPY` : undefined, moq: original.moq, unit: original.unit,
        originalPrice: original.originalPrice, createdBy: userId, updatedBy: userId,
      },
    });

    if (original.specifications.length) {
      await this.prisma.productSpecification.createMany({
        data: original.specifications.map(s => ({ productId: product.id, key: s.key, value: s.value, sortOrder: s.sortOrder })),
      });
    }
    if (original.priceSlabs.length) {
      await this.prisma.productPriceSlab.createMany({
        data: original.priceSlabs.map(p => ({ productId: product.id, minQty: p.minQty, maxQty: p.maxQty, price: p.price, currency: p.currency })),
      });
    }
    if (original.inventory) {
      await this.prisma.productInventory.create({
        data: { productId: product.id, availableQuantity: original.inventory.availableQuantity, stockStatus: original.inventory.stockStatus },
      });
    }

    return this.getProduct(userId, product.id);
  }

  async archiveProduct(userId: string, productId: string) {
    const company = await this.resolveCompany(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId: company.id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'DISCONTINUED', updatedBy: userId },
    });
    return { success: true };
  }

  async restoreProduct(userId: string, productId: string) {
    const company = await this.resolveCompany(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId: company.id },
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'DRAFT', deletedAt: null, updatedBy: userId },
    });
    return this.getProduct(userId, productId);
  }

  async bulkStatusUpdate(userId: string, ids: string[], status: ProductStatus) {
    const company = await this.resolveCompany(userId);
    await this.prisma.product.updateMany({
      where: { id: { in: ids }, companyId: company.id, deletedAt: null },
      data: { status, updatedBy: userId },
    });
    return { updated: ids.length };
  }

  async bulkDelete(userId: string, ids: string[]) {
    const company = await this.resolveCompany(userId);
    await this.prisma.product.updateMany({
      where: { id: { in: ids }, companyId: company.id, deletedAt: null },
      data: { deletedAt: new Date(), status: 'DISCONTINUED', updatedBy: userId },
    });
    return { deleted: ids.length };
  }
}
