import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BuyerService {
  private readonly logger = new Logger(BuyerService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const [savedProducts, savedSuppliers, activeRfqs, orders, downloads, unreadNotifications] = await Promise.all([
      this.prisma.savedProduct.count({ where: { userId } }),
      this.prisma.savedSupplier.count({ where: { userId } }),
      this.prisma.rfq.count({ where: { createdBy: userId, status: { in: ['ACTIVE', 'QUOTED'] as any } } }),
      this.prisma.order.count({ where: { buyerCompany: { owners: { some: { userId } } } } }),
      this.prisma.buyerDownload.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    const recentActivity = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, title: true, body: true, type: true, createdAt: true, readAt: true },
    });

    return {
      stats: { savedProducts, savedSuppliers, activeRfqs, orders, downloads, unreadNotifications },
      recentActivity,
    };
  }
}
