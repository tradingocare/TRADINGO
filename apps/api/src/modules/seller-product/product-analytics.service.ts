import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductAnalyticsService {
  private readonly logger = new Logger(ProductAnalyticsService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({ where: { userId }, include: { company: true } });
    if (!owner) throw new ForbiddenException('Company not found');
    return owner.company;
  }

  async getOverview(userId: string) {
    const company = await this.resolveCompany(userId);
    const [totalProducts, totalViews, totalSaved, totalOrders, activeProducts] = await Promise.all([
      this.prisma.product.count({ where: { companyId: company.id, deletedAt: null } }),
      this.prisma.product.aggregate({ where: { companyId: company.id, deletedAt: null }, _sum: { viewCount: true } }),
      this.prisma.product.aggregate({ where: { companyId: company.id, deletedAt: null }, _sum: { savedCount: true } }),
      this.prisma.product.aggregate({ where: { companyId: company.id, deletedAt: null }, _sum: { monthlyOrders: true } }),
      this.prisma.product.count({ where: { companyId: company.id, status: 'ACTIVE', deletedAt: null } }),
    ]);
    return {
      totalProducts,
      activeProducts,
      totalViews: totalViews._sum.viewCount || 0,
      totalSaved: totalSaved._sum.savedCount || 0,
      totalOrders: totalOrders._sum.monthlyOrders || 0,
    };
  }

  async getProductAnalytics(userId: string, page = 1, limit = 20) {
    const company = await this.resolveCompany(userId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { companyId: company.id, deletedAt: null, status: 'ACTIVE' },
        orderBy: { viewCount: 'desc' },
        skip, take: limit,
        select: {
          id: true, name: true, slug: true, status: true,
          viewCount: true, savedCount: true, monthlyOrders: true,
          createdAt: true, originalPrice: true,
          media: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      }),
      this.prisma.product.count({ where: { companyId: company.id, deletedAt: null, status: 'ACTIVE' } }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getPerformance(userId: string) {
    const company = await this.resolveCompany(userId);
    const [topByViews, topByOrders, bottomByViews] = await Promise.all([
      this.prisma.product.findMany({
        where: { companyId: company.id, deletedAt: null, status: 'ACTIVE' },
        orderBy: { viewCount: 'desc' }, take: 5,
        select: { id: true, name: true, viewCount: true, savedCount: true, monthlyOrders: true },
      }),
      this.prisma.product.findMany({
        where: { companyId: company.id, deletedAt: null, status: 'ACTIVE' },
        orderBy: { monthlyOrders: 'desc' }, take: 5,
        select: { id: true, name: true, viewCount: true, savedCount: true, monthlyOrders: true },
      }),
      this.prisma.product.findMany({
        where: { companyId: company.id, deletedAt: null, status: 'ACTIVE' },
        orderBy: { viewCount: 'asc' }, take: 5,
        select: { id: true, name: true, viewCount: true, savedCount: true, monthlyOrders: true },
      }),
    ]);
    return { topByViews, topByOrders, bottomByViews };
  }
}
