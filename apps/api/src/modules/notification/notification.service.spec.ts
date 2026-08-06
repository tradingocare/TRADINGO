import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationTemplateService } from './notification.template.service';
import { createMockPrisma } from '../../common/test/test-utils';
import { QueueNames } from '../../jobs/queues';
import { NotificationType, NotificationChannel, NotificationPriority } from '@prisma/client';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let mockQueue: { add: jest.Mock };

  const mockNotification = {
    id: 'notif-1',
    companyId: 'company-1',
    userId: 'user-1',
    type: NotificationType.GENERIC,
    channel: NotificationChannel.IN_APP,
    priority: NotificationPriority.MEDIUM,
    status: 'PENDING',
    title: 'Test notification',
    body: 'This is a test',
    metadata: null,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: { sendToUser: jest.fn(), sendToCompany: jest.fn() } },
        { provide: NotificationTemplateService, useValue: { render: jest.fn().mockResolvedValue({ title: 'Rendered', body: 'Content' }), getTemplate: jest.fn().mockResolvedValue({ subject: 'Test', body: 'Template body' }) } },
        { provide: getQueueToken(QueueNames.NOTIFICATION), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an in-app notification', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);
      const result = await service.create('company-1', {
        userId: 'user-1',
        type: NotificationType.GENERIC,
        channel: NotificationChannel.IN_APP,
        title: 'Test notification',
        body: 'This is a test',
      });
      expect(result).toBeDefined();
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should queue email notifications', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      await service.create('company-1', {
        userId: 'user-1',
        type: NotificationType.GENERIC,
        channel: NotificationChannel.EMAIL,
        title: 'Email test',
        body: 'Email body',
      });
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should create with template when templateName provided', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.notificationPreference.findMany.mockResolvedValue([]);
      const result = await service.createWithTemplate('company-1', 'user-1', NotificationType.GENERIC, { name: 'User' });
      expect(result).toBeDefined();
      expect(prisma.notificationDelivery.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([mockNotification]);
      prisma.notification.count.mockResolvedValue(1);
      const result: any = await service.findAll('company-1', { limit: '20' });
      expect(result).toBeDefined();
    });

    it('should return empty list when no notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);
      const result: any = await service.findAll('company-1', { limit: '20' });
      expect(result.items).toEqual([]);
    });

    it('should filter by type', async () => {
      prisma.notification.findMany.mockResolvedValue([mockNotification]);
      prisma.notification.count.mockResolvedValue(1);
      await service.findAll('company-1', { type: NotificationType.GENERIC, limit: '20' });
    });

    it('should filter by unread status', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);
      await service.findAll('company-1', { unreadOnly: true, limit: '20' });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 });
      const result: any = await service.markAsRead('company-1', 'notif-1');
      expect(result).toBeDefined();
      expect(prisma.notification.updateMany).toHaveBeenCalled();
    });

    it('should return zero count for missing notification', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });
      const result: any = await service.markAsRead('company-1', 'nonexistent');
      expect(result.count).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      prisma.notification.count.mockResolvedValue(5);
      const result = await service.getUnreadCount('company-1');
      expect(result).toEqual({ count: 5 });
    });

    it('should return zero when no unread', async () => {
      prisma.notification.count.mockResolvedValue(0);
      const result = await service.getUnreadCount('company-1');
      expect(result).toEqual({ count: 0 });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 10 });
      const result = await service.markAllAsRead('company-1');
      expect(result.count).toBe(10);
    });
  });

  describe('delete', () => {
    it('should soft delete a notification', async () => {
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      prisma.notification.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.softDelete('company-1', 'notif-1');
      expect(result).toBeUndefined();
    });
  });
});
