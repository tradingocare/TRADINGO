import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeProduct(product: any) {
    const c = product?.company;
    if (!c) return product;
    const loc = c.locations?.[0] || {};
    return {
      ...product,
      seller: {
        id: c.id,
        name: c.name || 'Verified Supplier',
        slug: c.slug,
        logo: c.logo || undefined,
        city: loc.city || undefined,
        state: loc.state || undefined,
        isVerified: c.verificationLevel !== 'LEVEL_0' && c.verificationLevel != null,
        isTradgoElite: !!(c as any).isTradgoElite,
        trustScore: c.trustScore || 0,
        yearsActive: (c as any).yearsActive || undefined,
        avgResponseTime: c.responseRate ? `< ${c.responseRate}` : undefined,
        ordersFulfilled: (c as any).totalProducts || undefined,
        gstVerified: !!c.gstNumber,
      },
    };
  }

  async addToWishlist(userId: string, productId: string, notes?: string) {
    return this.prisma.savedProduct.upsert({
      where: { userId_productId: { userId, productId } },
      update: { notes },
      create: { userId, productId, notes },
    });
  }

  async removeFromWishlist(userId: string, productId: string) {
    try {
      return await this.prisma.savedProduct.delete({
        where: { userId_productId: { userId, productId } },
      });
    } catch {
      throw new NotFoundException('SavedProduct not found');
    }
  }

  async getWishlist(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.savedProduct.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              company: {
                select: {
                  id: true, name: true, slug: true, logo: true,
                  trustScore: true, verificationLevel: true,
                  responseRate: true, gstNumber: true,
                  locations: { where: { isPrimary: true }, select: { city: true, state: true }, take: 1 },
                },
              },
              category: { select: { id: true, name: true, slug: true } },
              media: { take: 1, orderBy: { sortOrder: 'asc' } },
              inventory: { select: { availableQuantity: true, stockStatus: true } },
              priceSlabs: { orderBy: { minQty: 'asc' } },
            },
          },
        },
      }),
      this.prisma.savedProduct.count({ where: { userId } }),
    ]);
    return {
      data: data.map(entry => ({
        ...entry,
        product: entry.product ? this.normalizeProduct(entry.product) : null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async isInWishlist(userId: string, productId: string) {
    const entry = await this.prisma.savedProduct.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return { isInWishlist: !!entry };
  }
}
