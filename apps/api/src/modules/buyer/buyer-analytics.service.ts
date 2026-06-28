import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BuyerAnalyticsService {
  private readonly logger = new Logger(BuyerAnalyticsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const [savedProducts, savedSuppliers, lists, rfqs, orders] = await Promise.all([
      this.prisma.savedProduct.count({ where: { userId } }),
      this.prisma.savedSupplier.count({ where: { userId } }),
      this.prisma.requirementList.count({ where: { userId } }),
      this.prisma.rfq.count({ where: { createdBy: userId } }),
      this.prisma.order.count({ where: { buyerCompany: { owners: { some: { userId } } } } }),
    ]);
    return { savedProducts, savedSuppliers, requirementLists: lists, rfqs, orders };
  }

  async getSpendingByMonth(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { buyerCompany: { owners: { some: { userId } } } },
      select: { totalAmount: true, createdAt: true },
    });

    const byMonth: Record<string, number> = {};
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + Number(o.totalAmount || 0);
    }
    return Object.entries(byMonth).map(([month, total]) => ({ month, total }));
  }

  async getTopPurchasedProducts(userId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { buyerCompany: { owners: { some: { userId } } } } },
      select: { productName: true, quantity: true },
    });

    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
    }
    return Object.entries(counts)
      .map(([productName, count]) => ({ productName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
