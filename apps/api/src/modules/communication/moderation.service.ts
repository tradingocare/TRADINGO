import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getReportedMessages(status?: string, limit = 50, offset = 0) {
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.reportedMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          message: { select: { id: true, content: true, type: true, createdAt: true, conversationId: true, senderId: true } },
          reportedBy: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.reportedMessage.count({ where }),
    ]);
    return { items, total, limit, offset };
  }

  async reviewReport(reportId: string, reviewedById: string, action: string) {
    return this.prisma.reportedMessage.update({
      where: { id: reportId },
      data: { status: 'REVIEWED', action: action as any, reviewedById, reviewedAt: new Date() },
    });
  }

  async dismissReport(reportId: string, reviewedById: string) {
    return this.prisma.reportedMessage.update({
      where: { id: reportId },
      data: { status: 'DISMISSED', action: 'DISMISSED' as any, reviewedById, reviewedAt: new Date() },
    });
  }

  async getSpamStats() {
    const [total, pending, reviewed, dismissed] = await Promise.all([
      this.prisma.reportedMessage.count(),
      this.prisma.reportedMessage.count({ where: { status: 'PENDING' } }),
      this.prisma.reportedMessage.count({ where: { status: 'REVIEWED' } }),
      this.prisma.reportedMessage.count({ where: { status: 'DISMISSED' } }),
    ]);
    return { total, pending, reviewed, dismissed };
  }
}
