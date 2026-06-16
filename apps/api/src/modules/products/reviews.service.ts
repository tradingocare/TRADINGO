import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(productId: string, userId: string, companyId: string | undefined, dto: CreateReviewDto) {
    return this.prisma.productReview.create({
      data: {
        productId,
        userId,
        companyId,
        rating: dto.rating,
        title: dto.title,
        review: dto.review,
        isVerifiedPurchase: dto.isVerifiedPurchase ?? false,
      },
    });
  }

  async getReviews(productId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [raw, total, stats] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId, status: 'APPROVED' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productReview.count({ where: { productId, status: 'APPROVED' } }),
      this.getReviewStats(productId),
    ]);
    const userIds = raw.map((r) => r.userId).filter(Boolean) as string[];
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));
    return {
      data: raw.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        review: r.review,
        userName: r.userId ? userMap.get(r.userId) || 'Anonymous' : 'Anonymous',
        createdAt: r.createdAt,
        helpfulCount: r.helpfulCount,
      })),
      total,
      average: stats.averageRating,
      breakdown: stats.distribution,
    };
  }

  async markHelpful(reviewId: string) {
    try {
      return await this.prisma.productReview.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      });
    } catch {
      throw new NotFoundException('Review not found');
    }
  }

  async getReviewStats(productId: string) {
    const [totalReviews, avgResult, groupByRating] = await Promise.all([
      this.prisma.productReview.count({ where: { productId, status: 'APPROVED' } }),
      this.prisma.productReview.aggregate({
        where: { productId, status: 'APPROVED' },
        _avg: { rating: true },
      }),
      this.prisma.productReview.groupBy({
        by: ['rating'],
        where: { productId, status: 'APPROVED' },
        _count: { rating: true },
      }),
    ]);
    const distribution: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) distribution[i] = 0;
    for (const g of groupByRating) {
      distribution[g.rating] = g._count.rating;
    }
    return {
      averageRating: avgResult._avg.rating ?? 0,
      totalReviews,
      distribution,
    };
  }
}
