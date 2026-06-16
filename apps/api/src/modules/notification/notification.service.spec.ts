import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationTemplateService } from './notification.template.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { QueueNames } from '../../jobs/queues';

const mockPrisma = {
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  notificationDelivery: {
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  notificationPreference: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
  },
  notificationTemplate: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

(mockPrisma.$transaction as jest.Mock).mockImplementation((fn: (tx: any) => any) => fn(mockPrisma));

const mockGateway = {
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
  emitToAll: jest.fn(),
};

const mockTemplateService = {
  render: jest.fn().mockResolvedValue({ title: 'Test', body: 'Test body', subject: '' }),
};

const mockQueue = {
  add: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    jest.resetAllMocks();

    mockTemplateService.render.mockResolvedValue({ title: 'Test', body: 'Test body', subject: '' });
    mockPrisma.$transaction.mockImplementation((fn: (tx: any) => any) => fn(mockPrisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationGateway, useValue: mockGateway },
        { provide: NotificationTemplateService, useValue: mockTemplateService },
        { provide: getQueueToken(QueueNames.NOTIFICATION), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get(PrismaService) as any;
  });

  describe('create', () => {
    it('should create a notification and dispatch', async () => {
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1', companyId: 'company-1' });
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'notif-1', title: 'Test', body: 'Test body', metadata: {} });
      mockPrisma.notificationPreference.findMany.mockResolvedValue([]);
      mockPrisma.notificationDelivery.create.mockResolvedValue({});

      const result = await service.create('company-1', {
        title: 'Test Notification',
        body: 'This is a test',
        userId: 'user-1',
      });

      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockPrisma.notificationDelivery.create).toHaveBeenCalled();
      expect(mockTemplateService.render).toHaveBeenCalled();
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 'notification:new', expect.any(Object));
    });
  });

  describe('createWithTemplate', () => {
    it('should render template and create notification with delivery', async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([
        { channel: 'IN_APP', type: null, enabled: true },
        { channel: 'EMAIL', type: null, enabled: true },
      ]);
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
      mockPrisma.notificationDelivery.create.mockResolvedValue({});
      mockTemplateService.render.mockResolvedValue({ title: 'RFQ Match', body: 'You have a new match', subject: '' });

      await service.createWithTemplate(
        'company-1',
        'user-1',
        'RFQ_MATCH' as any,
        { rfqTitle: 'Test RFQ', vendorName: 'Vendor Inc' },
        { link: '/rfq/123', sourceModule: 'RFQ', sourceId: '123' },
      );

      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockTemplateService.render).toHaveBeenCalledTimes(3);
      expect(mockPrisma.notificationDelivery.create).toHaveBeenCalledTimes(2);
      expect(mockGateway.emitToUser).toHaveBeenCalled();
    });

    it('should create notification without userId', async () => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([]);
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-2' });
      mockPrisma.notificationDelivery.create.mockResolvedValue({});

      await service.createWithTemplate(
        'company-1',
        undefined,
        'GENERIC' as any,
        { message: 'Hello' },
      );

      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockPrisma.notificationDelivery.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('createBulk', () => {
    it('should create notifications for multiple users', async () => {
      mockPrisma.notification.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'notif-bulk' });
      mockPrisma.notificationDelivery.create.mockResolvedValue({});
      mockTemplateService.render.mockResolvedValue({ title: 'Bulk', body: 'Test', subject: '' });
      mockPrisma.notificationPreference.findMany.mockResolvedValue([]);
      mockPrisma.notification.findMany.mockResolvedValueOnce([]);

      const result = await service.createBulk('company-1', {
        userIds: ['user-1', 'user-2', 'user-3'],
        title: 'Bulk Notification',
        body: 'Sent to many',
      });

      expect(result.count).toBe(3);
      expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockPrisma.notificationPreference.findMany.mockResolvedValue([]);
    });

    it('should return paginated notifications', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'notif-1', createdAt: new Date() }, { id: 'notif-2', createdAt: new Date() }]);

      const result = await service.findAll('company-1', { limit: '10' }) as any;

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by type and status', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await service.findAll('company-1', {
        type: 'RFQ_MATCH' as any,
        status: 'PENDING' as any,
        unreadOnly: true,
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalled();
    });

    it('should handle cursor-based pagination', async () => {
      const items = Array(15).fill(null).map((_, i) => ({
        id: `notif-${i}`,
        createdAt: new Date(Date.now() - i * 1000),
      }));
      mockPrisma.notification.findMany.mockResolvedValue(items);

      const result = await service.findAll('company-1', { limit: '10' }) as any;

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return notification with deliveries', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({
        id: 'notif-1',
        deliveries: [],
      });

      const result = await service.findOne('company-1', 'notif-1');

      expect(result).toBeDefined();
      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', companyId: 'company-1', deletedAt: null },
        include: { deliveries: true },
      });
    });

    it('should return null if not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await service.findOne('company-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for company', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('company-1');

      expect(result.count).toBe(5);
    });

    it('should filter by userId when provided', async () => {
      mockPrisma.notification.count.mockResolvedValue(2);

      const result = await service.getUnreadCount('company-1', 'user-1');

      expect(result.count).toBe(2);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ userId: 'user-1' }),
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('company-1', 'notif-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', companyId: 'company-1', deletedAt: null },
        data: { status: 'READ', readAt: expect.any(Date) },
      });
    });
  });

  describe('markAsUnread', () => {
    it('should mark notification as unread', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsUnread('company-1', 'notif-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', companyId: 'company-1', deletedAt: null, readAt: { not: null } },
        data: { status: 'DELIVERED', readAt: null },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read for company', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 10 });

      const result = await service.markAllAsRead('company-1');

      expect(result.count).toBe(10);
    });

    it('should filter by userId', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      await service.markAllAsRead('company-1', 'user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ userId: 'user-1' }),
        data: { status: 'READ', readAt: expect.any(Date) },
      });
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt timestamp', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.softDelete('company-1', 'notif-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', companyId: 'company-1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('getPreferences', () => {
    it('should return preferences for user', async () => {
      const prefs = [
        { channel: 'IN_APP', enabled: true },
        { channel: 'EMAIL', enabled: false },
      ];
      mockPrisma.notificationPreference.findMany.mockResolvedValue(prefs);

      const result = await service.getPreferences('company-1', 'user-1');

      expect(result).toEqual(prefs);
    });
  });

  describe('upsertPreference', () => {
    it('should upsert a preference', async () => {
      mockPrisma.notificationPreference.upsert.mockResolvedValue({
        channel: 'EMAIL',
        enabled: false,
      });

      const result = await service.upsertPreference('company-1', 'user-1', {
        channel: 'EMAIL' as any,
        enabled: false,
      });

      expect(mockPrisma.notificationPreference.upsert).toHaveBeenCalled();
    });
  });

  describe('initializeDefaultPreferences', () => {
    it('should create default preferences if none exist', async () => {
      mockPrisma.notificationPreference.count.mockResolvedValue(0);

      await service.initializeDefaultPreferences('company-1', 'user-1');

      expect(mockPrisma.notificationPreference.createMany).toHaveBeenCalled();
    });

    it('should skip if preferences already exist', async () => {
      mockPrisma.notificationPreference.count.mockResolvedValue(3);

      await service.initializeDefaultPreferences('company-1', 'user-1');

      expect(mockPrisma.notificationPreference.createMany).not.toHaveBeenCalled();
    });
  });
});
