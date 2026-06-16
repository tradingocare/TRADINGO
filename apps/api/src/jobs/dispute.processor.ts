import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueNames, DisputeJobTypes } from './queues';
import { DisputeService } from '../modules/dispute/dispute.service';

@Processor(QueueNames.DISPUTE)
export class DisputeProcessor extends WorkerHost {
  private readonly logger = new Logger(DisputeProcessor.name);

  constructor(private readonly disputeService: DisputeService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.data.type) {
      case DisputeJobTypes.EXPIRE_DISPUTES:
        await this.disputeService.processExpiredDisputes();
        break;

      case DisputeJobTypes.EVIDENCE_REMINDER:
        this.logger.log(`Evidence reminder for dispute ${job.data.disputeId}`);
        break;

      case DisputeJobTypes.NEGOTIATION_REMINDER:
        this.logger.log(`Negotiation reminder for dispute ${job.data.disputeId}`);
        break;

      case DisputeJobTypes.ARBITRATION_REMINDER:
        this.logger.log(`Arbitration reminder for dispute ${job.data.disputeId}`);
        break;

      case DisputeJobTypes.ADMIN_ARBITRATION:
        await this.disputeService.adminArbitration(job.data.disputeId, job.id?.toString());
        break;

      case DisputeJobTypes.ARBITRATION_SLA_BREACH:
        await this.disputeService.handleArbitrationSlaBreach(job.data.disputeId);
        break;

      case DisputeJobTypes.APPEAL_EXPIRY:
        this.logger.log(`Appeal expiry check for dispute ${job.data.disputeId}`);
        break;

      default:
        this.logger.warn(`Unknown dispute job type: ${job.data.type}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Dispute job ${job.id} completed: ${job.data.type}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Dispute job ${job.id} failed: ${err.message}`);
  }
}
