import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueNames, SettlementJobTypes } from './queues';
import { SettlementService } from '../modules/settlement/settlement.service';

@Processor(QueueNames.SETTLEMENT)
export class SettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(private readonly settlementService: SettlementService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.data.type) {
      case SettlementJobTypes.PROCESS_SETTLEMENTS:
        await this.settlementService.processSettlements();
        break;
      case SettlementJobTypes.PROCESS_RETRIES:
        await this.settlementService.processRetries();
        break;
      default:
        this.logger.warn(`Unknown settlement job type: ${job.data.type}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Settlement job ${job.id} completed: ${job.data.type}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Settlement job ${job.id} failed: ${err.message}`);
  }
}
