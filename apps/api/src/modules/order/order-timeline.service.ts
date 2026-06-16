import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async addEvent(
    orderId: string,
    toStatus: OrderStatus,
    changedBy: string,
    changedByRole?: string,
    fromStatus?: OrderStatus,
    note?: string,
  ) {
    return this.prisma.orderTimelineEvent.create({
      data: {
        orderId,
        fromStatus: fromStatus ?? null,
        toStatus,
        changedBy,
        changedByRole: changedByRole ?? null,
        note: note ?? null,
      },
    });
  }

  async getTimeline(orderId: string) {
    return this.prisma.orderTimelineEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
