import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { QueueNames } from '../../jobs/queues';
import { ClickhouseTrackingProvider, TrackingEvent } from './providers/clickhouse.provider';
import { Ga4TrackingProvider } from './providers/ga4.provider';
import { UsageEventTrackingProvider } from './providers/usage-event.provider';

@Processor(QueueNames.TRACKING, { concurrency: 5 })
export class TrackingProcessor extends WorkerHost {
  private readonly logger = new Logger(TrackingProcessor.name);

  constructor(
    private readonly clickhouse: ClickhouseTrackingProvider,
    private readonly ga4: Ga4TrackingProvider,
    private readonly usageEvent: UsageEventTrackingProvider,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const event = job.data as TrackingEvent;

    const providers: Promise<void>[] = [];

    providers.push(
      this.clickhouse.send([event]).catch((err) => {
        this.logger.error(`ClickHouse failed for event ${job.id}: ${(err as Error).message}`);
      }),
    );

    providers.push(
      this.ga4.send([event]).catch((err) => {
        this.logger.error(`GA4 failed for event ${job.id}: ${(err as Error).message}`);
      }),
    );

    providers.push(
      this.usageEvent.send([event]).catch((err) => {
        this.logger.error(`UsageEvent failed for event ${job.id}: ${(err as Error).message}`);
      }),
    );

    await Promise.all(providers);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Tracking job ${job.id} completed: ${job.data?.event}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Tracking job ${job.id} failed: ${err.message}`);
    Sentry.captureException(err, { tags: { queue: 'tracking', jobId: String(job.id) }, extra: { data: job.data } });
  }
}
