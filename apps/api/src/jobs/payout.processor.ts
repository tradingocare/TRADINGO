import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueNames, PayoutJobTypes } from './queues';
import { PayoutService } from '../modules/payout/payout.service';

import * as Sentry from '@sentry/nestjs';

@Processor(QueueNames.PAYOUT, { concurrency: 2, lockDuration: 60000 })
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);

  constructor(private readonly payoutService: PayoutService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.data.type) {
      case PayoutJobTypes.PROCESS_PENDING:
        await this.payoutService.processPendingPayouts();
        break;
      case PayoutJobTypes.PROCESS_MANUAL:
        await this.payoutService.processManualPayouts();
        break;
      case PayoutJobTypes.VERIFY_STATUS:
        this.logger.log('Payout status verification triggered');
        break;
      default:
        this.logger.warn(`Unknown payout job type: ${job.data.type}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Payout job ${job.id} completed: ${job.data.type}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Payout job ${job.id} failed: ${err.message}`);
    Sentry.captureException(err, { tags: { queue: 'payout', jobId: String(job.id), type: String(job.data.type) }, extra: { data: job.data } });
  }
}
