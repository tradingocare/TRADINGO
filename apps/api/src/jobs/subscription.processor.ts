import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { QueueNames, SubscriptionJobTypes, SubscriptionJobData } from './queues';
import { PrismaService } from '../prisma/prisma.service';

const GRACE_PERIOD_DAYS = 14;

@Processor(QueueNames.SUBSCRIPTION, {
  concurrency: 5,
  lockDuration: 30000,
})
export class SubscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscriptionProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<SubscriptionJobData>): Promise<void> {
    switch (job.data.type) {
      case SubscriptionJobTypes.CHECK_RENEWAL:
        await this.checkRenewalAlerts();
        break;
      case SubscriptionJobTypes.APPLY_GRACE:
        await this.applyGracePeriod();
        break;
      case SubscriptionJobTypes.AUTO_EXPIRE:
        await this.autoExpireAfterGrace();
        break;
      default:
        this.logger.warn(`Unknown subscription job type: ${job.data.type}`);
    }
  }

  private async checkRenewalAlerts(): Promise<void> {
    const now = new Date();
    const alertPeriods = [30, 15, 7, 3, 1];

    for (const days of alertPeriods) {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const companies = await this.prisma.company.findMany({
        where: {
          deletedAt: null,
          subscriptionExpiresAt: {
            gte: new Date(targetDate.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(targetDate.getTime() + 12 * 60 * 60 * 1000),
          },
          subscriptionStatus: { in: ['TRIAL', 'ACTIVE'] },
        },
        select: { id: true, name: true, subscriptionExpiresAt: true, subscriptionStatus: true, owners: { take: 1, select: { userId: true } } },
      });

      for (const company of companies) {
        const existing = await this.prisma.subscriptionEvent.findFirst({
          where: { companyId: company.id, alertPeriod: `DAY_${days}` as any },
        });
        if (existing) continue;

        await this.prisma.subscriptionEvent.create({
          data: {
            companyId: company.id,
            status: company.subscriptionStatus ?? 'ACTIVE',
            alertPeriod: `DAY_${days}` as any,
            alertSentAt: now,
          },
        });

        this.logger.log(`Renewal alert (${days}d) queued for company ${company.id}`);
      }
    }
  }

  private async applyGracePeriod(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.company.findMany({
      where: {
        deletedAt: null,
        subscriptionExpiresAt: { lte: now },
        subscriptionGraceStart: null,
        subscriptionStatus: { in: ['TRIAL', 'ACTIVE'] },
      },
      select: { id: true },
    });

    for (const company of expired) {
      await this.prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionGraceStart: now,
          subscriptionStatus: 'EXPIRED',
        },
      });

      await this.prisma.subscriptionEvent.create({
        data: {
          companyId: company.id,
          status: 'EXPIRED',
          graceEndAt: new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      this.logger.log(`Grace period started for company ${company.id}`);
    }
  }

  private async autoExpireAfterGrace(): Promise<void> {
    const now = new Date();
    const graceEnd = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const companies = await this.prisma.company.findMany({
      where: {
        deletedAt: null,
        subscriptionGraceStart: { lte: graceEnd },
        subscriptionStatus: 'EXPIRED',
      },
      select: { id: true, name: true },
    });

    for (const company of companies) {
      await this.prisma.company.update({
        where: { id: company.id },
        data: { subscriptionStatus: 'CANCELLED' },
      });

      await this.prisma.subscriptionEvent.create({
        data: {
          companyId: company.id,
          status: 'CANCELLED',
          metadata: { reason: 'GRACE_PERIOD_EXPIRED' },
        },
      });

      this.logger.log(`Subscription cancelled for company ${company.id} after grace period`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Subscription job ${job.id} failed: ${error.message}`);
    Sentry.captureException(error, { extra: { jobId: job.id, data: job.data } });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Subscription job ${job.id} completed`);
  }
}
