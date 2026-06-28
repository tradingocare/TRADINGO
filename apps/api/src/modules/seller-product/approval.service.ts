import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getPendingProducts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: 'PENDING_APPROVAL', deletedAt: null },
        orderBy: { updatedAt: 'asc' },
        skip, take: limit,
        include: {
          company: { select: { id: true, name: true, slug: true, logo: true } },
          media: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true } },
          approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.product.count({ where: { status: 'PENDING_APPROVAL', deletedAt: null } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async approveProduct(productId: string, reviewerId: string, reason?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: 'PENDING_APPROVAL', deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found or not pending');

    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id: productId }, data: { status: 'ACTIVE', updatedBy: reviewerId } }),
      this.prisma.productApproval.create({ data: { productId, action: 'APPROVED', reviewerId, reason } }),
    ]);

    return { success: true, status: 'ACTIVE' };
  }

  async rejectProduct(productId: string, reviewerId: string, reason: string) {
    if (!reason) throw new BadRequestException('Rejection reason is required');
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: 'PENDING_APPROVAL', deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found or not pending');

    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id: productId }, data: { status: 'REJECTED', updatedBy: reviewerId } }),
      this.prisma.productApproval.create({ data: { productId, action: 'REJECTED', reviewerId, reason } }),
    ]);

    return { success: true, status: 'REJECTED' };
  }

  async getAuditTrail(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.productApproval.findMany({
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.productApproval.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
