import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

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
        include: { product: true },
      }),
      this.prisma.savedProduct.count({ where: { userId } }),
    ]);
    return {
      data,
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
