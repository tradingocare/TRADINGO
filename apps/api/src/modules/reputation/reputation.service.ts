import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReputationEventType, Prisma } from '@prisma/client';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(
    userId: string,
    type: ReputationEventType,
    reference?: { id: string; type: string },
    metadata?: Record<string, unknown>,
  ) {
    const event = await this.prisma.reputationEvent.create({
      data: {
        userId,
        type,
        referenceId: reference?.id,
        referenceType: reference?.type,
        metadata: metadata as Prisma.InputJsonValue ?? undefined,
      },
    });

    this.logger.debug(`Reputation event ${type} recorded for user ${userId}`);
    return event;
  }

  async getEvents(userId: string, limit = 50) {
    return this.prisma.reputationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getSummary(userId: string) {
    const [totalEvents, latestEvents, verifiedCheck] = await Promise.all([
      this.prisma.reputationEvent.count({ where: { userId } }),
      this.prisma.reputationEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerifiedAt: true, mobileVerifiedAt: true, verificationLevel: true, createdAt: true },
      }),
    ]);

    return {
      userId,
      totalEvents,
      memberSince: verifiedCheck?.createdAt,
      emailVerified: !!verifiedCheck?.emailVerifiedAt,
      mobileVerified: !!verifiedCheck?.mobileVerifiedAt,
      verificationLevel: verifiedCheck?.verificationLevel,
      recentEvents: latestEvents,
    };
  }
}
