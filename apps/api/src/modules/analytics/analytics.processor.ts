import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueNames } from '../../jobs/queues';
import { ClickhouseService } from './clickhouse.service';

@Processor(QueueNames.ANALYTICS)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly clickhouse: ClickhouseService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'flush-batch':
        await this.processFlushBatch(job);
        break;
      case 'process-dead-letter':
        await this.processDeadLetter(job);
        break;
      case 'retry-failed':
        await this.processRetry(job);
        break;
      default:
        this.logger.warn(`Unknown analytics job: ${job.name}`);
    }
  }

  private async processFlushBatch(job: Job): Promise<void> {
    const { table, events } = job.data as { table: string; events: Record<string, unknown>[] };
    await this.clickhouse.insert(table as any, events);
    this.logger.log(`Flushed ${events.length} events to ${table}`);
  }

  private async processDeadLetter(job: Job): Promise<void> {
    const { events } = job.data as { events: Record<string, unknown>[] };
    let successCount = 0;
    const failed: Record<string, unknown>[] = [];

    for (const event of events) {
      try {
        const { table, ...data } = event;
        await this.clickhouse.insert(table as any, [data]);
        successCount++;
      } catch {
        failed.push(event);
      }
    }

    if (failed.length > 0) {
      this.logger.warn(`Dead-letter: ${failed.length}/${events.length} still failing`);
      try {
        await this.clickhouse.insert('seller_analytics_events' as any, failed.map((f) => ({
          company_id: 'dead-letter',
          event_type: 'DEAD_LETTER',
          metadata: JSON.stringify(f),
          created_at: new Date().toISOString(),
        })));
      } catch (dlErr) {
        this.logger.error(`Dead-letter storage failed: ${(dlErr as Error).message}`);
      }
    }

    this.logger.log(`Dead-letter processed: ${successCount} succeeded, ${failed.length} failed`);
  }

  private async processRetry(job: Job): Promise<void> {
    const { table, events, attempt } = job.data as { table: string; events: Record<string, unknown>[]; attempt: number };
    try {
      await this.clickhouse.insert(table as any, events);
      this.logger.log(`Retry successful for ${events.length} events to ${table} (attempt ${attempt})`);
    } catch (err) {
      this.logger.error(`Retry ${attempt} failed for ${table}: ${(err as Error).message}`);
      if (attempt < 3) {
        throw err;
      }
      this.logger.warn(`Retry exhausted for ${events.length} events to ${table}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Analytics job ${job.id} completed: ${job.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Analytics job ${job.id} failed: ${err.message}`);
  }
}
