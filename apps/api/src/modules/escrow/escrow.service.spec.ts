import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { EscrowAnalyticsService } from './escrow-analytics.service';
import { CommissionService } from '../commission/commission.service';
import { SettlementService } from '../settlement/settlement.service';
import { createMockPrisma, createMockNotificationService, createMockAnalyticsService, createMockCommissionService, createMockSettlementService } from '../../common/test/test-utils';

describe('EscrowService', () => {
  let service: EscrowService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let notificationService: ReturnType<typeof createMockNotificationService>;
  let analyticsService: ReturnType<typeof createMockAnalyticsService>;
  let commissionService: ReturnType<typeof createMockCommissionService>;
  let settlementService: ReturnType<typeof createMockSettlementService>;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    buyerCompanyId: 'buyer-company-1',
    sellerCompanyId: 'seller-company-1',
    totalAmount: '10000',
    status: 'CONFIRMED',
    deletedAt: null,
  };

  const mockEscrow = {
    id: 'escrow-1',
    orderId: 'order-1',
    bookingId: null,
    buyerCompanyId: 'buyer-company-1',
    sellerCompanyId: 'seller-company-1',
    amount: 1000000,
    goCashAmount: 0,
    netAmount: 1000000,
    commissionAmount: null,
    commissionMetadata: null,
    status: 'HELD',
    heldAt: new Date(),
    autoReleaseAt: null,
    releasedAt: null,
    refundedAt: null,
    frozenAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    events: [],
  };

  beforeEach(async () => {
    prisma = createMockPrisma();
    notificationService = createMockNotificationService();
    analyticsService = createMockAnalyticsService();
    commissionService = createMockCommissionService();
    settlementService = createMockSettlementService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
        { provide: EscrowAnalyticsService, useValue: analyticsService },
        { provide: CommissionService, useValue: commissionService },
        { provide: SettlementService, useValue: settlementService },
      ],
    }).compile();
    service = module.get<EscrowService>(EscrowService);
    jest.clearAllMocks();
  });

  describe('hold', () => {
    it('should create an escrow hold successfully', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.escrow.findUnique.mockResolvedValue(null);
      const tx = { escrow: { create: jest.fn().mockResolvedValue(mockEscrow) }, escrowEvent: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.hold('order-1', 'buyer-company-1', 'user-1');

      expect(result.id).toBe('escrow-1');
      expect(tx.escrow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ orderId: 'order-1', status: 'HELD' }),
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.hold('bad-order', 'buyer-company-1', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if company not involved', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.hold('order-1', 'unrelated-company', 'user-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if escrow already exists', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      await expect(service.hold('order-1', 'buyer-company-1', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getEscrow', () => {
    it('should return escrow by id', async () => {
      prisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      const result = await service.getEscrow('escrow-1', 'buyer-company-1');

      expect(result.id).toBe('escrow-1');
    });

    it('should throw NotFoundException if escrow not found', async () => {
      prisma.escrow.findUnique.mockResolvedValue(null);

      await expect(service.getEscrow('bad-id', 'buyer-company-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if company not party to escrow', async () => {
      prisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      await expect(service.getEscrow('escrow-1', 'unrelated-company'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('freeze', () => {
    it('should freeze a held escrow', async () => {
      prisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      const updated = { ...mockEscrow, status: 'FROZEN', frozenAt: new Date() };
      const tx = { escrow: { update: jest.fn().mockResolvedValue(updated) }, escrowEvent: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.freeze('escrow-1', 'company-1', 'user-1');

      expect(result.status).toBe('FROZEN');
    });

    it('should throw if escrow not in correct status', async () => {
      prisma.escrow.findUnique.mockResolvedValue({ ...mockEscrow, status: 'RELEASED' });

      await expect(service.freeze('escrow-1', 'company-1', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('release', () => {
    it('should release escrow with commission calculation', async () => {
      prisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      const updated = { ...mockEscrow, status: 'RELEASED', releasedAt: new Date(), commissionAmount: 50000, commissionMetadata: {} };
      const tx = { escrow: { update: jest.fn().mockResolvedValue(updated) }, escrowEvent: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.release('escrow-1', 'seller-company-1', 'user-1');

      expect(result.status).toBe('RELEASED');
      expect(commissionService.calculate).toHaveBeenCalled();
      expect(settlementService.create).toHaveBeenCalled();
    });

    it('should throw if escrow not HELD', async () => {
      prisma.escrow.findUnique.mockResolvedValue({ ...mockEscrow, status: 'RELEASED' });

      await expect(service.release('escrow-1', 'seller-company-1', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('refund', () => {
    it('should refund a held escrow', async () => {
      prisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      const updated = { ...mockEscrow, status: 'REFUNDED', refundedAt: new Date() };
      const tx = { escrow: { update: jest.fn().mockResolvedValue(updated) }, escrowEvent: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.refund('escrow-1', 'company-1', 'user-1');

      expect(result.status).toBe('REFUNDED');
    });
  });

  describe('reopen', () => {
    it('should reopen a frozen escrow', async () => {
      prisma.escrow.findUnique.mockResolvedValue({ ...mockEscrow, status: 'FROZEN' });
      const tx = { escrow: { update: jest.fn().mockResolvedValue({ ...mockEscrow, status: 'HELD' }) }, escrowEvent: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.reopen('escrow-1', 'company-1', 'user-1');

      expect(result.status).toBe('HELD');
    });

    it('should throw if not frozen', async () => {
      prisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      await expect(service.reopen('escrow-1', 'company-1', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated escrows for a company', async () => {
      prisma.escrow.findMany.mockResolvedValue([mockEscrow]);
      prisma.escrow.count.mockResolvedValue(1);

      const result = await service.findAll('buyer-company-1', { skip: 0, take: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.escrow.findMany.mockResolvedValue([mockEscrow]);
      prisma.escrow.count.mockResolvedValue(1);

      await service.findAll('buyer-company-1', { status: 'HELD', skip: 0, take: 20 });

      expect(prisma.escrow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'HELD',
          }),
        }),
      );
    });
  });

  describe('processAutoRelease', () => {
    it('should auto-release escrows past their autoReleaseAt', async () => {
      const escrow = { ...mockEscrow, autoReleaseAt: new Date(Date.now() - 3600000) };
      prisma.escrow.findMany.mockResolvedValue([escrow]);
      prisma.escrow.findUnique.mockResolvedValue(escrow);
      const updated = { ...escrow, status: 'RELEASED' };
      const tx = { escrow: { update: jest.fn().mockResolvedValue(updated) }, escrowEvent: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.processAutoRelease();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
    });

    it('should handle failures gracefully', async () => {
      const escrow = { ...mockEscrow, autoReleaseAt: new Date(Date.now() - 3600000) };
      prisma.escrow.findMany.mockResolvedValue([escrow]);
      prisma.escrow.findUnique.mockResolvedValue(escrow);
      const tx = { escrow: { update: jest.fn().mockRejectedValue(new Error('DB error')) }, escrowEvent: { create: jest.fn() } };
      prisma.$transaction.mockImplementation((fn: any) => fn(tx));

      const result = await service.processAutoRelease();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('getSellerDashboard', () => {
    it('should return seller escrow dashboard', async () => {
      prisma.escrow.findMany.mockResolvedValue([mockEscrow, { ...mockEscrow, status: 'RELEASED', netAmount: 500000 }]);

      const result = await service.getSellerDashboard('seller-company-1');

      expect(result.totalEscrows).toBe(2);
      expect(result.heldCount).toBe(1);
      expect(result.releasedCount).toBe(1);
      expect(result.totalReleasedAmount).toBe(500000);
    });
  });

  describe('setAutoReleaseDate', () => {
    it('should set auto release date 48h after delivery', async () => {
      prisma.escrow.update.mockResolvedValue(mockEscrow);
      const deliveredAt = new Date('2026-06-01T12:00:00Z');

      await service.setAutoReleaseDate('escrow-1', deliveredAt);

      expect(prisma.escrow.update).toHaveBeenCalledWith({
        where: { id: 'escrow-1' },
        data: { autoReleaseAt: new Date('2026-06-03T12:00:00Z') },
      });
    });
  });
});
