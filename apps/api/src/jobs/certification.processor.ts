import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { QueueNames, CertificationJobTypes, CertificationJobData } from './queues';
import { PrismaService } from '../prisma/prisma.service';
import { TradTrustService } from '../modules/tradtrust/tradtrust.service';

@Processor(QueueNames.CERTIFICATION, {
  concurrency: 5,
  lockDuration: 30000,
})
export class CertificationProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradTrustService: TradTrustService,
  ) {
    super();
  }

  async process(job: Job<CertificationJobData>): Promise<void> {
    switch (job.data.type) {
      case CertificationJobTypes.CHECK_EXPIRY:
        await this.checkExpiry();
        break;
      case CertificationJobTypes.RECALCULATE_TRUST:
        if (job.data.companyId) {
          await this.tradTrustService.recalculateByCompany(job.data.companyId);
        }
        break;
      default:
        this.logger.warn(`Unknown certification job type: ${job.data.type}`);
    }
  }

  private async checkExpiry(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.companyCertification.findMany({
      where: { expiresAt: { lte: now }, status: { not: 'EXPIRED' } },
      select: { id: true, companyId: true, type: true },
    });

    if (expired.length === 0) {
      this.logger.log('No expired certifications found');
      return;
    }

    const companyIds = [...new Set(expired.map((c) => c.companyId))];

    await this.prisma.companyCertification.updateMany({
      where: { id: { in: expired.map((c) => c.id) } },
      data: { status: 'EXPIRED' },
    });

    this.logger.log(`Expired ${expired.length} certifications across ${companyIds.length} companies`);

    for (const companyId of companyIds) {
      await this.tradTrustService.recalculateByCompany(companyId);
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'CERTIFICATION_EXPIRY_CHECK',
        resource: 'system',
        metadata: { expiredCount: expired.length, companyIds },
      },
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Certification job ${job.id} failed: ${error.message}`);
    Sentry.captureException(error, { extra: { jobId: job.id, data: job.data } });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Certification job ${job.id} completed`);
  }
}
