import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import { QueueNames, CategoryDemandJobTypes, CategoryDemandJobData } from './queues';
import { CategoryDemandService } from '../modules/categories/category-demand.service';

@Processor(QueueNames.CATEGORY_DEMAND, { concurrency: 1, lockDuration: 300000 })
export class CategoryDemandProcessor extends WorkerHost {
  private readonly logger = new Logger(CategoryDemandProcessor.name);

  constructor(private readonly categoryDemandService: CategoryDemandService) {
    super();
  }

  async process(job: Job<CategoryDemandJobData>): Promise<void> {
    switch (job.data.type) {
      case CategoryDemandJobTypes.RECALCULATE_DEMAND:
        this.logger.log('Recalculating category demand scores');
        const result = await this.categoryDemandService.getTopCategories(job.data.limit ?? 20);
        this.logger.log(`Category demand recalculation completed (${result.data.length} categories)`);
        break;
      default:
        this.logger.warn(`Unknown category demand job type: ${String(job.data.type)}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<CategoryDemandJobData>, error: Error) {
    this.logger.error(`Category demand job ${job.id} failed: ${error.message}`);
    Sentry.captureException(error, { tags: { queue: 'category-demand', jobId: String(job.id), type: String(job.data.type) }, extra: { data: job.data } });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<CategoryDemandJobData>) {
    this.logger.log(`Category demand job ${job.id} completed`);
  }
}
