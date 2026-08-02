import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrackingEvent } from './clickhouse.provider';

@Injectable()
export class UsageEventTrackingProvider {
  private readonly logger = new Logger(UsageEventTrackingProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(events: TrackingEvent[]): Promise<void> {
    for (const event of events) {
      try {
        await this.prisma.usageEvent.create({
          data: {
            companyId: event.userId || 'unattributed',
            userId: event.userId,
            eventName: event.event,
            category: 'tracking',
            properties: {
              ...(event.properties || {}),
              pageUrl: event.pageUrl,
              utm: event.utm,
              sessionId: event.sessionId,
            },
            ip: event.ipAddress,
            userAgent: event.userAgent,
            sessionId: event.sessionId,
            timestamp: new Date(event.timestamp),
          },
        });
      } catch (err) {
        this.logger.error(`UsageEvent insert failed: ${(err as Error).message}`);
      }
    }
  }
}
