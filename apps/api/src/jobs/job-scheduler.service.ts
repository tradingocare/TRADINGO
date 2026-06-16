import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames, CertificationJobTypes, SubscriptionJobTypes, RfqJobTypes, EscrowJobTypes, SettlementJobTypes, DisputeJobTypes, BestsellerJobTypes } from './queues';

@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectQueue(QueueNames.CERTIFICATION) private readonly certificationQueue: Queue,
    @InjectQueue(QueueNames.SUBSCRIPTION) private readonly subscriptionQueue: Queue,
    @InjectQueue(QueueNames.RFQ) private readonly rfqQueue: Queue,
    @InjectQueue(QueueNames.ESCROW) private readonly escrowQueue: Queue,
    @InjectQueue(QueueNames.SETTLEMENT) private readonly settlementQueue: Queue,
    @InjectQueue(QueueNames.DISPUTE) private readonly disputeQueue: Queue,
    @InjectQueue(QueueNames.BESTSELLER) private readonly bestsellerQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.registerCronJobs();
  }

  private async registerCronJobs(): Promise<void> {
    await this.certificationQueue.upsertJobScheduler(
      'certification-expiry-daily',
      { pattern: '0 2 * * *' },
      { name: 'certification-expiry', data: { type: CertificationJobTypes.CHECK_EXPIRY } },
    );

    await this.subscriptionQueue.upsertJobScheduler(
      'subscription-renewal-daily',
      { pattern: '0 3 * * *' },
      { name: 'subscription-renewal', data: { type: SubscriptionJobTypes.CHECK_RENEWAL } },
    );

    await this.subscriptionQueue.upsertJobScheduler(
      'subscription-grace-daily',
      { pattern: '0 4 * * *' },
      { name: 'subscription-grace', data: { type: SubscriptionJobTypes.APPLY_GRACE } },
    );

    await this.subscriptionQueue.upsertJobScheduler(
      'subscription-expire-daily',
      { pattern: '0 5 * * *' },
      { name: 'subscription-expire', data: { type: SubscriptionJobTypes.AUTO_EXPIRE } },
    );

    await this.rfqQueue.upsertJobScheduler(
      'rfq-expiry-daily',
      { pattern: '0 1 * * *' },
      { name: 'rfq-expiry', data: { type: RfqJobTypes.EXPIRE_RFQS } },
    );

    await this.rfqQueue.upsertJobScheduler(
      'rfq-credit-expiry-monthly',
      { pattern: '0 0 1 * *' },
      { name: 'rfq-credit-expiry', data: { type: RfqJobTypes.EXPIRE_CREDIT_PACKS } },
    );

    await this.rfqQueue.upsertJobScheduler(
      'rfq-quote-expiry-daily',
      { pattern: '0 1 * * *' },
      { name: 'rfq-quote-expiry', data: { type: RfqJobTypes.EXPIRE_QUOTES } },
    );

    // Escrow auto-release: runs every hour
    await this.escrowQueue.upsertJobScheduler(
      'escrow-auto-release-hourly',
      { pattern: '0 * * * *' },
      { name: 'escrow-auto-release', data: { type: EscrowJobTypes.AUTO_RELEASE } },
    );

    // Escrow expiry monitor: daily at 6am
    await this.escrowQueue.upsertJobScheduler(
      'escrow-expiry-daily',
      { pattern: '0 6 * * *' },
      { name: 'escrow-expiry', data: { type: EscrowJobTypes.EXPIRY_MONITOR } },
    );

    // Settlement processing: every 30 minutes
    await this.settlementQueue.upsertJobScheduler(
      'settlement-process-every-30min',
      { pattern: '*/30 * * * *' },
      { name: 'settlement-process', data: { type: SettlementJobTypes.PROCESS_SETTLEMENTS } },
    );

    // Settlement retry: every hour
    await this.settlementQueue.upsertJobScheduler(
      'settlement-retry-hourly',
      { pattern: '0 * * * *' },
      { name: 'settlement-retry', data: { type: SettlementJobTypes.PROCESS_RETRIES } },
    );

    // Dispute expiry: daily at 7am
    await this.disputeQueue.upsertJobScheduler(
      'dispute-expiry-daily',
      { pattern: '0 7 * * *' },
      { name: 'dispute-expiry', data: { type: DisputeJobTypes.EXPIRE_DISPUTES } },
    );

    // Evidence reminder: daily at 8am
    await this.disputeQueue.upsertJobScheduler(
      'dispute-evidence-reminder-daily',
      { pattern: '0 8 * * *' },
      { name: 'dispute-evidence-reminder', data: { type: DisputeJobTypes.EVIDENCE_REMINDER } },
    );

    // Negotiation reminder: daily at 9am
    await this.disputeQueue.upsertJobScheduler(
      'dispute-negotiation-reminder-daily',
      { pattern: '0 9 * * *' },
      { name: 'dispute-negotiation-reminder', data: { type: DisputeJobTypes.NEGOTIATION_REMINDER } },
    );

    // Arbitration reminder: daily at 10am
    await this.disputeQueue.upsertJobScheduler(
      'dispute-arbitration-reminder-daily',
      { pattern: '0 10 * * *' },
      { name: 'dispute-arbitration-reminder', data: { type: DisputeJobTypes.ARBITRATION_REMINDER } },
    );

    // Appeal expiry: daily at 11am
    await this.disputeQueue.upsertJobScheduler(
      'dispute-appeal-expiry-daily',
      { pattern: '0 11 * * *' },
      { name: 'dispute-appeal-expiry', data: { type: DisputeJobTypes.APPEAL_EXPIRY } },
    );

    // Bestseller calculation: Sunday 11:55 PM IST (18:25 UTC)
    await this.bestsellerQueue.upsertJobScheduler(
      'bestseller-weekly-sunday',
      { pattern: '25 18 * * 0' },
      { name: 'bestseller-weekly', data: { type: BestsellerJobTypes.CALCULATE_WEEKLY } },
    );

    this.logger.log('Scheduled cron jobs registered');
  }
}
