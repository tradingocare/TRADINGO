import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as Sentry from '@sentry/nestjs';
import { QueueNames, EmailJobData, EmailJobTypes } from './queues';
import { renderTemplate } from '../common/utils/template.utils';

@Processor(QueueNames.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly ses: SESClient;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.ses = new SESClient({
      region: this.configService.get<string>('aws.region', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId')!,
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey')!,
      },
    });
    this.fromAddress = this.configService.get<string>('EMAIL_FROM', 'noreply@tradingo.io');
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.log(`Processing email job ${job.id} of type ${job.data.type}`);

    switch (job.data.type) {
      case EmailJobTypes.SEND_WELCOME_EMAIL:
        await this.sendWelcomeEmail(job.data);
        break;
      case EmailJobTypes.SEND_PASSWORD_RESET:
        await this.sendPasswordReset(job.data);
        break;
      case EmailJobTypes.SEND_NOTIFICATION:
        await this.sendNotification(job.data);
        break;
      default:
        this.logger.warn(`Unknown email job type: ${job.data.type}`);
    }
  }

  private async sendWelcomeEmail(data: EmailJobData): Promise<void> {
    const htmlBody = renderTemplate(data.template, data.context);
    await this.ses.send(new SendEmailCommand({
      Source: this.fromAddress,
      Destination: { ToAddresses: [data.to] },
      Message: {
        Subject: { Data: data.subject },
        Body: { Html: { Data: htmlBody } },
      },
    }));
    this.logger.log(`Welcome email sent to ${data.to}`);
  }

  private async sendPasswordReset(data: EmailJobData): Promise<void> {
    const htmlBody = renderTemplate(data.template, data.context);
    await this.ses.send(new SendEmailCommand({
      Source: this.fromAddress,
      Destination: { ToAddresses: [data.to] },
      Message: {
        Subject: { Data: data.subject },
        Body: { Html: { Data: htmlBody } },
      },
    }));
    this.logger.log(`Password reset email sent to ${data.to}`);
  }

  private async sendNotification(data: EmailJobData): Promise<void> {
    const htmlBody = renderTemplate(data.template, data.context);
    await this.ses.send(new SendEmailCommand({
      Source: this.fromAddress,
      Destination: { ToAddresses: [data.to] },
      Message: {
        Subject: { Data: data.subject },
        Body: { Html: { Data: htmlBody } },
      },
    }));
    this.logger.log(`Notification email sent to ${data.to}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Email job ${job.id} failed: ${error.message}`);
    Sentry.captureException(error, {
      extra: { jobId: job.id, data: job.data },
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Email job ${job.id} completed successfully`);
  }
}
