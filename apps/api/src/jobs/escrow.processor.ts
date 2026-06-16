import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueNames, EscrowJobTypes } from './queues';
import { EscrowService } from '../modules/escrow/escrow.service';

@Processor(QueueNames.ESCROW)
export class EscrowProcessor extends WorkerHost {
  private readonly logger = new Logger(EscrowProcessor.name);

  constructor(private readonly escrowService: EscrowService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.data.type) {
      case EscrowJobTypes.AUTO_RELEASE:
        await this.escrowService.processAutoRelease();
        break;
      case EscrowJobTypes.EXPIRY_MONITOR:
        this.logger.log('Escrow expiry monitor triggered');
        // Log escrows held > 30 days for admin review
        break;
      default:
        this.logger.warn(`Unknown escrow job type: ${job.data.type}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Escrow job ${job.id} completed: ${job.data.type}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Escrow job ${job.id} failed: ${err.message}`);
  }
}
