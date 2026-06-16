import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames, BestsellerJobTypes, BestsellerJobData } from './queues';
import { BestsellerService } from '../modules/products/bestseller.service';

@Processor(QueueNames.BESTSELLER, { concurrency: 1, lockDuration: 300000 })
export class BestsellerProcessor extends WorkerHost {
  private readonly logger = new Logger(BestsellerProcessor.name);

  constructor(private readonly bestsellerService: BestsellerService) {
    super();
  }

  async process(job: Job<BestsellerJobData>): Promise<void> {
    switch (job.data.type) {
      case BestsellerJobTypes.CALCULATE_WEEKLY:
        this.logger.log('Starting weekly bestseller calculation');
        await this.bestsellerService.calculateWeeklySnapshots();
        this.logger.log('Weekly bestseller calculation completed');
        break;
      default:
        this.logger.warn(`Unknown bestseller job type: ${job.data.type}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BestsellerJobData>, error: Error) {
    this.logger.error(`Bestseller job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BestsellerJobData>) {
    this.logger.log(`Bestseller job ${job.id} completed`);
  }
}
