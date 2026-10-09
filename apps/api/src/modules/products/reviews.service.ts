import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
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

  /**
   * P0-3 — the single legitimate moderation write-path.
   * PENDING → APPROVED | PENDING → REJECTED only; terminal states are final.
   * - repeat of the same decision → idempotent success (no duplicate write)
   * - cross-decision on a terminal review → 409 Conflict
   * - moderator acting on their own review → 403
   * - the status precondition rides inside a single atomic updateMany, so two
   *   concurrent moderators deterministically resolve to exactly one winner
   *   (the loser re-reads and gets idempotent-success or 409 — never a torn state)
   * No new columns are used (updatedAt records the transition; moderator-audit
   * fields would require a founder-approved migration — tracked as P1).
   */
  async moderateReview(reviewId: string, status: 'APPROVED' | 'REJECTED', moderatorUserId: string) {
    const review = await this.prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId && review.userId === moderatorUserId) {
      throw new ForbiddenException('Moderators cannot moderate their own reviews');
    }
    if (review.status === status) return review;
    if (review.status !== 'PENDING') {
      throw new ConflictException(`Review is already ${review.status} and cannot be moved to ${status}`);
    }

    const result = await this.prisma.productReview.updateMany({
      where: { id: reviewId, status: 'PENDING' },
      data: { status },
    });
    if (result.count === 1) {
      return { ...review, status };
    }

    // Lost a concurrent race — re-read for a deterministic outcome.
    const current = await this.prisma.productReview.findUnique({ where: { id: reviewId } });
    if (current?.status === status) return current;
    throw new ConflictException(`Review is already ${current?.status ?? 'moderated'} and cannot be moved to ${status}`);
  }

  /**
   * P0-3 — moderation discovery queue (admin-only at the controller).
   * Mirrors the existing `GET /products/admin/all` precedent; lets reviewers
   * actually find PENDING reviews instead of guessing IDs.
   */
  async listReviewsForModeration(
    status?: 'PENDING' | 'APPROVED' | 'REJECTED',
    page = 1,
    limit = 20,
  ) {
    const where: { status?: 'PENDING' | 'APPROVED' | 'REJECTED' } = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, slug: true, companyId: true } },
        },
      }),
      this.prisma.productReview.count({ where }),
    ]);
    return { data, total, page, limit };
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
