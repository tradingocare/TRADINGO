import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BuyerDownloadService {
  private readonly logger = new Logger(BuyerDownloadService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, limit = 50, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.buyerDownload.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.buyerDownload.count({ where: { userId } }),
    ]);
    return { items, total, limit, offset };
  }

  async create(userId: string, data: { type: string; title: string; fileUrl: string; fileSize?: number; sourceId?: string; sourceModule?: string }) {
    return this.prisma.buyerDownload.create({ data: { ...data, userId } as any });
  }
}
