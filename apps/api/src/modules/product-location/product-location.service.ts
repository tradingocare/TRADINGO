import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProductLocationDto } from './dto/update-product-location.dto';

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
