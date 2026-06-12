import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { QueueNames, ExportJobData, ExportJobTypes } from './queues';

@Processor(QueueNames.EXPORT)
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  async process(job: Job<ExportJobData>): Promise<void> {
    this.logger.log(`Processing export job ${job.id} of type ${job.data.type}`);

    switch (job.data.type) {
      case ExportJobTypes.GENERATE_CSV:
        await this.generateCsv(job.data);
        break;
      case ExportJobTypes.GENERATE_PDF:
        await this.generatePdf(job.data);
        break;
      default:
        this.logger.warn(`Unknown export job type: ${job.data.type}`);
    }
  }

  private async generateCsv(data: ExportJobData): Promise<void> {
    this.logger.log(`Generating CSV export for ${data.resource}`);
  }

  private async generatePdf(data: ExportJobData): Promise<void> {
    this.logger.log(`Generating PDF export for ${data.resource}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Export job ${job.id} failed: ${error.message}`);
    Sentry.captureException(error, {
      extra: { jobId: job.id, data: job.data },
    });
  }
}
