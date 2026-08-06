import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames } from '../../jobs/queues';
import { TrackEventDto } from './dto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectQueue(QueueNames.TRACKING) private readonly trackingQueue: Queue,
  ) {}

  async track(dto: TrackEventDto & { ipAddress?: string; userAgent?: string }): Promise<{ queued: boolean }> {
    try {
      await this.trackingQueue.add('track-event', {
        ...dto,
        timestamp: new Date().toISOString(),
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
      });
      return { queued: true };
    } catch (err) {
      this.logger.error(`Failed to queue tracking event: ${(err as Error).message}`);
      return { queued: false };
    }
  }
}
