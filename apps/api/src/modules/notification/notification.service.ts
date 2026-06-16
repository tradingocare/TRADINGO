import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationTemplateService } from './notification.template.service';
import { QueueNames, NotificationJobTypes, NotificationJobData } from '../../jobs/queues';
import { CreateNotificationDto, CreateBulkNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { UpsertPreferenceDto } from './dto/notification-preference.dto';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
    private readonly templateService: NotificationTemplateService,
    @InjectQueue(QueueNames.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async create(companyId: string, dto: CreateNotificationDto): Promise<unknown> {
    const notification = await this.prisma.notification.create({
      data: {
        companyId,
        userId: dto.userId,
        type: dto.type ?? NotificationType.GENERIC,
        channel: dto.channel,
        priority: dto.priority ?? NotificationPriority.MEDIUM,
        status: NotificationStatus.PENDING,
        title: dto.title,
        body: dto.body,
        metadata: dto.metadata as Prisma.InputJsonValue,
        link: dto.link,
        imageUrl: dto.imageUrl,
        sourceModule: dto.sourceModule,
        sourceId: dto.sourceId,
      },
    });

    await this.dispatch(notification.id, companyId, dto.userId, dto.type ?? NotificationType.GENERIC, dto.channel);
    this.logger.log(`Notification ${notification.id} created for company ${companyId}`);
    return notification;
  }

  async createWithTemplate(
    companyId: string,
    userId: string | undefined,
    type: NotificationType,
    context: Record<string, unknown>,
    overrides?: {
      channel?: NotificationChannel;
      priority?: NotificationPriority;
      link?: string;
      sourceModule?: string;
      sourceId?: string;
    },
  ): Promise<unknown> {
    const channels = await this.resolveChannels(companyId, userId, type);
    const rendered = await this.templateService.render(type, NotificationChannel.IN_APP, context);

    const notification = await this.prisma.notification.create({
      data: {
        companyId,
        userId,
        type,
        priority: overrides?.priority ?? NotificationPriority.MEDIUM,
        status: NotificationStatus.PENDING,
        title: rendered.title,
        body: rendered.body,
        metadata: (context as Prisma.InputJsonValue),
        link: overrides?.link,
        sourceModule: overrides?.sourceModule,
        sourceId: overrides?.sourceId,
      },
    });

    for (const channel of channels) {
      const channelRendered = await this.templateService.render(type, channel, context);
      await this.prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel,
          status: NotificationStatus.PENDING,
          maxAttempts: channel === NotificationChannel.EMAIL || channel === NotificationChannel.SMS ? 3 : 1,
        },
      });

      if (channel === NotificationChannel.IN_APP) {
        await this.deliverInApp(notification.id, userId, channelRendered);
      } else {
        await this.enqueueDelivery(notification.id, companyId, userId, channel, channelRendered);
      }
    }

    return notification;
  }

  async createBulk(companyId: string, dto: CreateBulkNotificationDto): Promise<{ count: number }> {
    const data = dto.userIds.map((userId) => ({
      companyId,
      userId,
      type: dto.type ?? NotificationType.GENERIC,
      status: NotificationStatus.PENDING as NotificationStatus,
      title: dto.title,
      body: dto.body,
      metadata: dto.metadata as Prisma.InputJsonValue,
      link: dto.link,
      sourceModule: dto.sourceModule,
      sourceId: dto.sourceId,
      channel: dto.channel,
      priority: dto.priority ?? NotificationPriority.MEDIUM,
    }));

    await this.prisma.notification.createMany({ data });
    this.logger.log(`Created ${data.length} bulk notifications for company ${companyId}`);

    for (const item of data) {
      const notif = await this.prisma.notification.findFirst({
        where: { companyId, userId: item.userId, title: item.title },
        orderBy: { createdAt: 'desc' },
      });
      if (notif) {
        await this.dispatch(notif.id, companyId, item.userId, item.type!, item.channel);
      }
    }

    return { count: data.length };
  }

  async findAll(companyId: string, query: NotificationQueryDto): Promise<unknown> {
    const where: Prisma.NotificationWhereInput = { companyId, deletedAt: null };

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.sourceModule) where.sourceModule = query.sourceModule;
    if (query.sourceId) where.sourceId = query.sourceId;
    if (query.unreadOnly) where.readAt = null;

    const limit = Math.min(parseInt(query.limit ?? '20', 10), 100);

    if (query.cursor) {
      where.createdAt = { lt: new Date(query.cursor) };
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].createdAt.toISOString()
      : undefined;

    return { items, nextCursor, hasMore };
  }

  async findOne(companyId: string, id: string): Promise<unknown> {
    return this.prisma.notification.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { deliveries: true },
    });
  }

  async getUnreadCount(companyId: string, userId?: string): Promise<{ count: number }> {
    const where: Prisma.NotificationWhereInput = {
      companyId,
      readAt: null,
      deletedAt: null,
    };
    if (userId) where.userId = userId;

    const count = await this.prisma.notification.count({ where });
    return { count };
  }

  async markAsRead(companyId: string, id: string): Promise<unknown> {
    return this.prisma.notification.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async markAsUnread(companyId: string, id: string): Promise<unknown> {
    return this.prisma.notification.updateMany({
      where: { id, companyId, deletedAt: null, readAt: { not: null } },
      data: { status: NotificationStatus.DELIVERED, readAt: null },
    });
  }

  async markSpecificAsRead(companyId: string, ids: string[]): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { id: { in: ids }, companyId, readAt: null, deletedAt: null },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
    return { count: result.count };
  }

  async markAllAsRead(companyId: string, userId?: string): Promise<{ count: number }> {
    const where: Prisma.NotificationWhereInput = {
      companyId,
      readAt: null,
      deletedAt: null,
    };
    if (userId) where.userId = userId;

    const result = await this.prisma.notification.updateMany({
      where,
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
    return { count: result.count };
  }

  async softDelete(companyId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async getPreferences(companyId: string, userId: string): Promise<unknown[]> {
    return this.prisma.notificationPreference.findMany({
      where: { companyId, userId },
    });
  }

  async upsertPreference(companyId: string, userId: string, dto: UpsertPreferenceDto): Promise<unknown> {
    return this.prisma.notificationPreference.upsert({
      where: {
        companyId_userId_channel_type: {
          companyId,
          userId,
          channel: dto.channel,
          type: dto.type ?? NotificationType.GENERIC,
        },
      },
      create: {
        companyId,
        userId,
        channel: dto.channel,
        type: dto.type,
        enabled: dto.enabled,
      },
      update: { enabled: dto.enabled },
    });
  }

  async initializeDefaultPreferences(companyId: string, userId: string): Promise<void> {
    const existing = await this.prisma.notificationPreference.count({
      where: { companyId, userId },
    });
    if (existing > 0) return;

    const defaults = [
      { channel: NotificationChannel.IN_APP, enabled: true },
      { channel: NotificationChannel.EMAIL, enabled: true },
      { channel: NotificationChannel.PUSH, enabled: false },
      { channel: NotificationChannel.SMS, enabled: false },
    ];

    await this.prisma.notificationPreference.createMany({
      data: defaults.map((d) => ({
        companyId,
        userId,
        channel: d.channel as NotificationChannel,
        enabled: d.enabled,
      })),
    });
  }

  processDelivery(jobData: NotificationJobData): void {
    this.enqueueDelivery(
      jobData.notificationId,
      jobData.companyId,
      jobData.userId,
      jobData.channel as NotificationChannel,
      { title: jobData.title, body: jobData.message, subject: '' },
    ).catch((err) => this.logger.error(`Delivery failed for ${jobData.notificationId}: ${err.message}`));
  }

  private async dispatch(
    notificationId: string,
    companyId: string,
    userId: string | undefined,
    type: NotificationType,
    channel?: NotificationChannel,
  ): Promise<void> {
    const channels = channel
      ? [channel]
      : await this.resolveChannels(companyId, userId, type);

    for (const ch of channels) {
      await this.prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: ch,
          status: NotificationStatus.PENDING,
          maxAttempts: ch === NotificationChannel.EMAIL || ch === NotificationChannel.SMS ? 3 : 1,
        },
      });
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) return;

    for (const ch of channels) {
      const rendered = await this.templateService.render(type, ch, {
        ...((notification.metadata as Record<string, unknown>) ?? {}),
        title: notification.title,
        message: notification.body,
      });

      if (ch === NotificationChannel.IN_APP) {
        await this.deliverInApp(notificationId, userId, rendered);
      } else {
        await this.enqueueDelivery(notificationId, companyId, userId, ch, rendered, notification);
      }
    }
  }

  private async deliverInApp(
    notificationId: string,
    userId: string | undefined,
    rendered: { title: string; body: string },
  ): Promise<void> {
    if (!userId) {
      await this.prisma.notificationDelivery.updateMany({
        where: { notificationId, channel: NotificationChannel.IN_APP },
        data: { status: NotificationStatus.DELIVERED, deliveredAt: new Date() },
      });
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.DELIVERED, deliveredAt: new Date() },
      });
      return;
    }

    try {
      this.gateway.emitToUser(userId, 'notification:new', {
        id: notificationId,
        title: rendered.title,
        body: rendered.body,
        createdAt: new Date(),
      });

      await this.prisma.notificationDelivery.updateMany({
        where: { notificationId, channel: NotificationChannel.IN_APP },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });
    } catch (err) {
      this.logger.warn(`Failed to emit in-app notification to user ${userId}: ${(err as Error).message}`);
    }
  }

  private async enqueueDelivery(
    notificationId: string,
    companyId: string,
    userId: string | undefined,
    channel: NotificationChannel,
    rendered: { title: string; subject: string; body: string },
    notification?: { title: string; body: string; metadata?: unknown },
  ): Promise<void> {
    try {
      await this.notificationQueue.add(NotificationJobTypes.SEND_NOTIFICATION, {
        type: NotificationJobTypes.SEND_NOTIFICATION,
        notificationId,
        companyId,
        userId,
        channel,
        title: rendered.title,
        message: rendered.body,
        metadata: notification?.metadata as Record<string, unknown>,
        attemptCount: 0,
      } as NotificationJobData);
    } catch (err) {
      this.logger.error(`Failed to enqueue notification ${notificationId}: ${(err as Error).message}`);
      await this.prisma.notificationDelivery.updateMany({
        where: { notificationId, channel },
        data: { status: NotificationStatus.FAILED, failedAt: new Date(), failureReason: (err as Error).message },
      });
    }
  }

  private async resolveChannels(
    companyId: string,
    userId: string | undefined,
    type: NotificationType,
  ): Promise<NotificationChannel[]> {
    const defaultChannels: NotificationChannel[] = [NotificationChannel.IN_APP];
    if (!userId) return defaultChannels;

    const prefs = await this.prisma.notificationPreference.findMany({
      where: { companyId, userId, enabled: true },
    });

    if (prefs.length === 0) {
      return [NotificationChannel.IN_APP, NotificationChannel.EMAIL];
    }

    const typePrefs = prefs.filter((p) => p.type === null || p.type === type);
    return typePrefs.length > 0
      ? typePrefs.map((p) => p.channel)
      : defaultChannels;
  }
}
