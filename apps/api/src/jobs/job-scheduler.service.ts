import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNames, CertificationJobTypes, SubscriptionJobTypes } from './queues';

@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectQueue(QueueNames.CERTIFICATION) private readonly certificationQueue: Queue,
    @InjectQueue(QueueNames.SUBSCRIPTION) private readonly subscriptionQueue: Queue,
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

    this.logger.log('Scheduled cron jobs registered');
  }
}
