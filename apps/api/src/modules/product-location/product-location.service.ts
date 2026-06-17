import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProductLocationDto, BulkUpdateLocationDto, SellerProductLocationQueryDto } from './dto';

@Injectable()
export class ProductLocationService {
  private readonly logger = new Logger(ProductLocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async update(productId: string, dto: UpdateProductLocationDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        company: { select: { id: true, trustScore: true, verificationLevel: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        ...(dto.visibilityRadius !== undefined && { visibilityRadius: dto.visibilityRadius }),
      },
    });

    const visibilityRadius = dto.visibilityRadius || product.visibilityRadius || 'LOCAL';
    const isVerified = product.company.verificationLevel !== 'LEVEL_0';
    const isTradgo = (product as any).companyTradgoEnabled === true;

    await this.prisma.productLocationIndex.upsert({
      where: { productId },
      create: {
        productId,
        companyId: product.companyId,
        categoryId: product.categoryId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        visibilityRadius,
        trustScore: product.company.trustScore,
        price: product.originalPrice,
        isVerified,
        isTradgo,
        moq: product.moq,
        deliveryEta: product.deliveryEta,
        status: product.status,
      },
      update: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        visibilityRadius,
        trustScore: product.company.trustScore,
        price: product.originalPrice,
        isVerified,
        isTradgo,
        moq: product.moq,
        deliveryEta: product.deliveryEta,
        status: product.status,
      },
    });

    this.logger.log(`Location updated for product ${productId}: (${dto.latitude}, ${dto.longitude})`);
    return updatedProduct;
  }

  async findByCompany(companyId: string, query: SellerProductLocationQueryDto) {
    const { search, status, locationStatus, page = 1, limit = 20 } = query;
    const where: any = { companyId, deletedAt: null };

    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (locationStatus === 'set') {
      where.latitude = { not: null };
      where.longitude = { not: null };
    } else if (locationStatus === 'missing') {
      where.latitude = null;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          status: true,
          latitude: true,
          longitude: true,
          visibilityRadius: true,
          originalPrice: true,
          moq: true,
          createdAt: true,
          category: { select: { id: true, name: true } },
          locationIndex: {
            select: { id: true, latitude: true, longitude: true, visibilityRadius: true, updatedAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const enriched = data.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      status: p.status,
      latitude: p.latitude,
      longitude: p.longitude,
      visibilityRadius: p.visibilityRadius,
      price: p.originalPrice ? Number(p.originalPrice) : null,
      moq: p.moq,
      createdAt: p.createdAt,
      category: p.category,
      locationSet: p.latitude !== null && p.longitude !== null,
      indexedAt: p.locationIndex?.updatedAt || null,
    }));

    return {
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async bulkUpdate(dto: BulkUpdateLocationDto) {
    const { productIds, latitude, longitude, visibilityRadius } = dto;
    if (!productIds || productIds.length === 0) {
      throw new BadRequestException('No product IDs provided');
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        company: { select: { id: true, trustScore: true, verificationLevel: true } },
      },
    });

    if (products.length === 0) {
      throw new NotFoundException('No products found for the given IDs');
    }

    let updated = 0;
    for (const product of products) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          latitude,
          longitude,
          ...(visibilityRadius !== undefined && { visibilityRadius }),
        },
      });

      const radius = visibilityRadius || product.visibilityRadius || 'LOCAL';
      const isVerified = product.company.verificationLevel !== 'LEVEL_0';
      const isTradgo = (product as any).companyTradgoEnabled === true;

      await this.prisma.productLocationIndex.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          companyId: product.companyId,
          categoryId: product.categoryId,
          latitude,
          longitude,
          visibilityRadius: radius,
          trustScore: product.company.trustScore,
          price: product.originalPrice,
          isVerified,
          isTradgo,
          moq: product.moq,
          deliveryEta: product.deliveryEta,
          status: product.status,
        },
        update: {
          latitude,
          longitude,
          visibilityRadius: radius,
          trustScore: product.company.trustScore,
          price: product.originalPrice,
          isVerified,
          isTradgo,
          moq: product.moq,
          deliveryEta: product.deliveryEta,
          status: product.status,
        },
      });
      updated++;
    }

    this.logger.log(`Bulk updated ${updated} products to (${latitude}, ${longitude})`);
    return { updated };
  }

  async getCompanyDefaultLocation(companyId: string) {
    const address = await this.prisma.companyLocation.findFirst({
      where: { companyId, isPrimary: true, deletedAt: null },
      select: {
        id: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        district: true,
        state: true,
        country: true,
        pincode: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!address) {
      const fallback = await this.prisma.companyLocation.findFirst({
        where: { companyId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          district: true,
          state: true,
          country: true,
          pincode: true,
          latitude: true,
          longitude: true,
        },
      });
      return fallback || null;
    }

    return address;
  }

  async syncAll() {
    this.logger.log('Starting full ProductLocationIndex sync...');
    const products = await this.prisma.product.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        deletedAt: null,
      },
      include: {
        company: { select: { id: true, trustScore: true, verificationLevel: true } },
      },
    });

    let count = 0;
    for (const product of products) {
      const isVerified = product.company.verificationLevel !== 'LEVEL_0';
      const isTradgo = (product as any).companyTradgoEnabled === true;

      await this.prisma.productLocationIndex.upsert({
        where: { productId: product.id },
        create: {
          productId: product.id,
          companyId: product.companyId,
          categoryId: product.categoryId,
          latitude: product.latitude!,
          longitude: product.longitude!,
          visibilityRadius: product.visibilityRadius || 'LOCAL',
          trustScore: product.company.trustScore,
          price: product.originalPrice,
          isVerified,
          isTradgo,
          moq: product.moq,
          deliveryEta: product.deliveryEta,
          status: product.status,
        },
        update: {
          latitude: product.latitude!,
          longitude: product.longitude!,
          visibilityRadius: product.visibilityRadius || 'LOCAL',
          trustScore: product.company.trustScore,
          price: product.originalPrice,
          isVerified,
          isTradgo,
          moq: product.moq,
          deliveryEta: product.deliveryEta,
          status: product.status,
        },
      });
      count++;
    }

    this.logger.log(`Synced ${count} product locations`);
    return { synced: count };
  }
}
