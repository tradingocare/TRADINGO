import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueNames, EmailJobTypes, EmailJobData, NotificationJobTypes, NotificationJobData } from '../../jobs/queues';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { NotificationGateway } from './notification.gateway';

@Processor(QueueNames.NOTIFICATION, { concurrency: 5, lockDuration: 30000 })
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
    @InjectQueue(QueueNames.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QueueNames.EMAIL) private readonly emailQueue: Queue<EmailJobData>,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    switch (job.data.type) {
      case NotificationJobTypes.SEND_NOTIFICATION:
        await this.handleSendNotification(job);
        break;
      case NotificationJobTypes.RETRY_NOTIFICATION:
        await this.handleRetryNotification(job);
        break;
      case NotificationJobTypes.DEAD_LETTER:
        await this.handleDeadLetter(job);
        break;
      default:
        this.logger.warn(`Unknown notification job type: ${job.data.type}`);
    }
  }

  private async handleSendNotification(job: Job<NotificationJobData>): Promise<void> {
    const { notificationId, channel, userId, title, message, attemptCount = 0 } = job.data;

    try {
      const delivery = await this.prisma.notificationDelivery.findFirst({
        where: { notificationId, channel: channel as NotificationChannel },
      });
      if (!delivery) {
        this.logger.warn(`No delivery record for notification ${notificationId} channel ${channel}`);
        return;
      }

      if (channel === NotificationChannel.EMAIL) {
        await this.sendEmail(userId, title, message);
      } else if (channel === NotificationChannel.SMS) {
        await this.sendSms(userId, message);
      } else if (channel === NotificationChannel.PUSH) {
        await this.sendPushNotification(userId, title, message);
      }

      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          attemptCount: attemptCount + 1,
        },
      });

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });

      this.logger.log(`Notification ${notificationId} sent via ${channel}`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to send notification ${notificationId} via ${channel}: ${error.message}`);

      const newAttemptCount = attemptCount + 1;
      await this.prisma.notificationDelivery.updateMany({
        where: { notificationId, channel: channel as NotificationChannel },
        data: {
          status: newAttemptCount >= 3 ? NotificationStatus.FAILED : NotificationStatus.PENDING,
          failedAt: newAttemptCount >= 3 ? new Date() : undefined,
          failureReason: error.message,
          attemptCount: newAttemptCount,
          nextRetryAt: newAttemptCount < 3
            ? new Date(Date.now() + Math.pow(2, newAttemptCount) * 2000)
            : undefined,
        },
      });

      if (newAttemptCount >= 3) {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { status: NotificationStatus.FAILED, failedAt: new Date(), failureReason: error.message },
        });

        await this.notificationQueue.add(NotificationJobTypes.DEAD_LETTER, {
          ...job.data,
          type: NotificationJobTypes.DEAD_LETTER,
          attemptCount: newAttemptCount,
        });
      }

      throw error;
    }
  }

  private async handleRetryNotification(job: Job<NotificationJobData>): Promise<void> {
    await this.handleSendNotification(job);
  }

  private async handleDeadLetter(job: Job<NotificationJobData>): Promise<void> {
    this.logger.warn(`Notification ${job.data.notificationId} moved to dead letter queue after ${job.data.attemptCount} attempts`);
  }

  private async sendEmail(userId: string | undefined, subject: string, body: string): Promise<void> {
    if (!userId) return;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) throw new Error('User email not found');
    await this.emailQueue.add(EmailJobTypes.SEND_NOTIFICATION, {
      type: EmailJobTypes.SEND_NOTIFICATION,
      to: user.email,
      subject,
      template: 'notification',
      context: { message: body },
    });
    this.logger.log(`[EMAIL] Queued for SES delivery: To: ${user.email}, Subject: ${subject}`);
  }

  private async sendSms(userId: string | undefined, message: string): Promise<void> {
    if (!userId) return;
    const company = await this.prisma.companyOwner.findFirst({
      where: { userId, isPrimary: true },
      include: { company: { select: { mobile: true } } },
    });
    const phone = company?.company?.mobile;
    if (!phone) throw new Error('Company mobile not found');
    this.logger.log(`[SMS] To: ${phone}, Message: ${message.substring(0, 100)}...`);
  }

  private async sendPushNotification(userId: string | undefined, title: string, body: string): Promise<void> {
    if (!userId) return;
    this.logger.log(`[PUSH] To user ${userId}, Title: ${title}, Body: ${body.substring(0, 100)}...`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Notification job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Notification job ${job.id} completed`);
  }
}
