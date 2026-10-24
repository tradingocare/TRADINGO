import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nestjs';
import { QueueNames, EmailJobData, EmailJobTypes } from './queues';
import { renderTemplate } from '../common/utils/template.utils';

type EmailProvider = 'ses' | 'resend';

/**
 * F-5: strip OTP-bearing fields before any job data reaches Sentry extras.
 * EmailJobData.context (otp-login / password-reset / otp-verify templates)
 * carries the live OTP — redact it, preserve all other diagnostic metadata.
 */
function redactEmailJobData(data: EmailJobData): Record<string, unknown> {
  const context = data.context ? { ...data.context } : undefined;
  if (context) {
    if (typeof context.otp === 'string' && context.otp.length > 0) context.otp = '[REDACTED]';
    if (typeof context.verificationToken === 'string' && context.verificationToken.length > 0) {
      context.verificationToken = '[REDACTED]';
    }
  }
  return { ...data, context };
}

@Processor(QueueNames.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private ses: SESClient | null = null;
  private resend: Resend | null = null;
  private readonly fromAddress: string;
  private readonly sesConfigured: boolean;
  private readonly resendConfigured: boolean;
  private readonly provider: EmailProvider;

  constructor(private readonly configService: ConfigService) {
    super();
    const configuredProvider = this.configService.get<string>('EMAIL_PROVIDER', 'ses');
    this.provider = configuredProvider === 'resend' ? 'resend' : 'ses';

    const awsAccessKey = this.configService.get<string>('aws.accessKeyId');
    const awsSecretKey = this.configService.get<string>('aws.secretAccessKey');
    this.sesConfigured = !!(awsAccessKey && awsSecretKey);
    if (this.sesConfigured) {
      this.ses = new SESClient({
        region: this.configService.get<string>('aws.region', 'us-east-1'),
        credentials: { accessKeyId: awsAccessKey!, secretAccessKey: awsSecretKey! },
      });
    }

    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resendConfigured = !!resendApiKey;
    if (this.resendConfigured) {
      this.resend = new Resend(resendApiKey!);
    }

    if (this.provider === 'ses' && !this.sesConfigured) {
      this.logger.warn('EMAIL_PROVIDER=ses but AWS credentials not configured — email delivery disabled. Set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.');
    }
    if (this.provider === 'resend' && !this.resendConfigured) {
      this.logger.warn('EMAIL_PROVIDER=resend but RESEND_API_KEY not set — email delivery disabled.');
    }

    this.fromAddress = this.configService.get<string>('RESEND_FROM') || this.configService.get<string>('EMAIL_FROM', 'noreply@tradingotech.com');
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    if (this.provider === 'ses') {
      if (!this.sesConfigured || !this.ses) {
        this.logger.warn(`SES not configured — skipping email job ${job.id} (${job.data.type})`);
        return;
      }
    } else {
      if (!this.resendConfigured || !this.resend) {
        this.logger.warn(`Resend not configured — skipping email job ${job.id} (${job.data.type})`);
        return;
      }
    }

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

  private async deliver(data: EmailJobData, htmlBody: string): Promise<void> {
    if (this.provider === 'resend') {
      // Resend SDK resolves send() with { data, error } — an error object is NOT
      // thrown (resend@6.18.1 CreateEmailResponse). Treat a non-null error as a
      // delivery failure so the job fails/retries instead of "completing" silently.
      const result = await this.resend!.emails.send({
        from: this.fromAddress,
        to: data.to,
        subject: data.subject,
        html: htmlBody,
      });
      if (result.error) {
        // Only the provider's machine-readable error name is surfaced — never
        // internals beyond what the provider contract already defines.
        throw new Error(`Resend delivery failed: ${result.error.name}`);
      }
      return;
    }
    await this.ses!.send(new SendEmailCommand({
      Source: this.fromAddress,
      Destination: { ToAddresses: [data.to] },
      Message: {
        Subject: { Data: data.subject },
        Body: { Html: { Data: htmlBody } },
      },
    }));
  }

  private async sendWelcomeEmail(data: EmailJobData): Promise<void> {
    const htmlBody = renderTemplate(data.template, data.context);
    await this.deliver(data, htmlBody);
    this.logger.log(`Welcome email sent to ${data.to} via ${this.provider === 'resend' ? 'Resend' : 'SES'}`);
  }

  private async sendPasswordReset(data: EmailJobData): Promise<void> {
    const htmlBody = renderTemplate(data.template, data.context);
    await this.deliver(data, htmlBody);
    this.logger.log(`Password reset email sent to ${data.to} via ${this.provider === 'resend' ? 'Resend' : 'SES'}`);
  }

  private async sendNotification(data: EmailJobData): Promise<void> {
    const htmlBody = renderTemplate(data.template, data.context);
    await this.deliver(data, htmlBody);
    this.logger.log(`Notification email sent to ${data.to} via ${this.provider === 'resend' ? 'Resend' : 'SES'}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Email job ${job.id} failed: ${error.message}`);
    Sentry.captureException(error, {
      extra: { jobId: job.id, data: redactEmailJobData(job.data) },
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Email job ${job.id} completed successfully`);
  }
}
