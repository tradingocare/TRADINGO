import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { RfqNumberService } from './rfq-number.service';
import { RfqAnalyticsService } from './rfq-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { RfqQueryDto } from './dto/rfq-query.dto';

const mockTx = {
  rfqCreditLedger: { groupBy: jest.fn(), create: jest.fn() },
};

const makePrisma = () => ({
  rfq: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
  rfqCreditLedger: { groupBy: jest.fn(), create: jest.fn() },
  rfqAnalyticsEvent: { create: jest.fn(), createMany: jest.fn() },
  rfqCreditPack: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  rfqNumberCounter: { upsert: jest.fn() },
  company: { findUnique: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn((cb: any) => cb(mockTx)),
});

const mockRfqNumberService = {
  generate: jest.fn().mockResolvedValue('TRFQ-XX-260610-0001'),
};

const mockAnalyticsService = {
  trackEvent: jest.fn().mockResolvedValue(undefined),
  trackMatchEvent: jest.fn().mockResolvedValue(undefined),
};

const mockDate = new Date('2026-06-10T12:00:00Z');

describe('RfqService', () => {
  let service: RfqService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: false });
    jest.setSystemTime(mockDate);
    mockTx.rfqCreditLedger.groupBy.mockReset();
    mockTx.rfqCreditLedger.create.mockReset();
    mockRfqNumberService.generate.mockClear();
    mockAnalyticsService.trackEvent.mockClear();

    prisma = makePrisma();
    prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADBUY' });
    prisma.rfq.update.mockImplementation((_: any) => Promise.resolve({ id: 'rfq-1' }));
    prisma.rfqAnalyticsEvent.create.mockResolvedValue({});
    prisma.rfqNumberCounter.upsert.mockResolvedValue({ seq: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfqService,
        { provide: PrismaService, useValue: prisma },
        { provide: RfqNumberService, useValue: mockRfqNumberService },
        { provide: RfqAnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    service = module.get<RfqService>(RfqService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function stubGroupBy(balance: number) {
    const groups: any[] = [];
    if (balance > 0) {
      groups.push({ type: 'PURCHASE', _sum: { amount: balance } });
    }
    prisma.rfqCreditLedger.groupBy.mockResolvedValue(groups);
    mockTx.rfqCreditLedger.groupBy.mockResolvedValue(groups);
  }

  const closedRfq = (overrides = {}) => ({
    ...draftRfq(),
    status: 'CLOSED' as const,
    closedAt: new Date('2026-06-08T12:00:00Z'),
    closedBy: 'user-1',
    ...overrides,
  });

  const draftRfq = (overrides = {}) => ({
    id: 'rfq-1',
    companyId: 'company-1',
    userId: 'user-1',
    title: 'Test RFQ',
    description: 'desc',
    rfqType: 'PRODUCT',
    visibility: 'PUBLIC',
    urgency: 'NORMAL',
    status: 'DRAFT',
    budgetMin: null,
    budgetMax: null,
    showBudget: true,
    currency: 'INR',
    quantity: 10,
    unit: 'pcs',
    preferredLocation: null,
    expiresAt: null,
    categoryId: null,
    industryId: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: mockDate,
    updatedAt: mockDate,
    deletedAt: null,
    cancelledAt: null,
    cancelReason: null,
    locations: [],
    attachments: [],
    productItems: [],
    ...overrides,
  });

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------
  describe('create', () => {
    const dto: CreateRfqDto = {
      title: 'Need steel rods',
      rfqType: 'PRODUCT' as any,
      quantity: 100,
      unit: 'kg',
      budgetMin: 50000,
      budgetMax: 75000,
      showBudget: true,
      currency: 'INR',
      preferredLocation: 'Mumbai',
      description: 'High quality steel rods',
      visibility: 'PUBLIC',
      urgency: 'NORMAL',
    };

    it('should create an RFQ with minimal required fields', async () => {
      const minimal: CreateRfqDto = { title: 'Minimal', rfqType: 'SERVICE' as any, quantity: 1, unit: 'hr' };
      prisma.rfq.create.mockResolvedValue(draftRfq({ title: 'Minimal', rfqType: 'SERVICE' }));
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.create('c1', minimal, 'u1');

      expect(prisma.rfq.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Minimal', rfqType: 'SERVICE', status: 'DRAFT', createdBy: 'u1', updatedBy: 'u1' }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CREATE_RFQ', userId: 'u1' }) }),
      );
      expect(result.title).toBe('Minimal');
    });

    it('should create an RFQ with locations, attachments, and productItems', async () => {
      const full: CreateRfqDto = {
        ...dto,
        locations: [{ city: 'Mumbai', state: 'MH', country: 'India', pincode: '400001', isPrimary: true }],
        attachments: [{ type: 'PDF', url: 'https://example.com/doc.pdf', originalName: 'spec.pdf', mimeType: 'application/pdf', fileSize: 1024 }],
        productItems: [{ productName: 'Steel Rod', categoryId: 'cat-1', quantity: 10, unit: 'kg', targetPrice: 500, isService: false }],
      };
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', full, 'u1');

      const call = prisma.rfq.create.mock.calls[0][0];
      expect(call.data.locations).toBeDefined();
      expect(call.data.locations.create).toHaveLength(1);
      expect(call.data.attachments).toBeDefined();
      expect(call.data.attachments.create).toHaveLength(1);
      expect(call.data.productItems).toBeDefined();
      expect(call.data.productItems.create).toHaveLength(1);
    });

    it('should create audit log on successful creation', async () => {
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});
      await service.create('c1', dto, 'u1');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CREATE_RFQ' }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // FIND ALL
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return paginated RFQs', async () => {
      prisma.rfq.findMany.mockResolvedValue([draftRfq()]);
      prisma.rfq.count.mockResolvedValue(1);

      const result = await service.findAll('c1', {} as RfqQueryDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(prisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: 'c1', deletedAt: null } }),
      );
    });

    it('should filter by status', async () => {
      prisma.rfq.findMany.mockResolvedValue([]);
      prisma.rfq.count.mockResolvedValue(0);

      await service.findAll('c1', { status: 'ACTIVE' } as any);

      expect(prisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
    });

    it('should filter by rfqType', async () => {
      prisma.rfq.findMany.mockResolvedValue([]);
      prisma.rfq.count.mockResolvedValue(0);

      await service.findAll('c1', { rfqType: 'BULK' } as any);

      expect(prisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ rfqType: 'BULK' }) }),
      );
    });

    it('should return empty list when no RFQs', async () => {
      prisma.rfq.findMany.mockResolvedValue([]);
      prisma.rfq.count.mockResolvedValue(0);

      const result = await service.findAll('c1', {} as RfqQueryDto);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // FIND BY ID
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should return an RFQ by id', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq());

      const result = await service.findById('rfq-1');

      expect(result.id).toBe('rfq-1');
      expect(prisma.rfq.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rfq-1', deletedAt: null } }),
      );
    });

    it('should throw NotFoundException when RFQ not found', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should exclude soft-deleted RFQs', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.findById('deleted-rfq')).rejects.toThrow(NotFoundException);

      expect(prisma.rfq.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'deleted-rfq', deletedAt: null } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update a draft RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq());
      prisma.rfq.update.mockResolvedValue(draftRfq({ title: 'Updated' }));
      prisma.auditLog.create.mockResolvedValue({});

      const dto: UpdateRfqDto = { title: 'Updated', description: 'New desc' };
      const result = await service.update('rfq-1', dto, 'u1');

      expect(result.title).toBe('Updated');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'UPDATE_RFQ' }) }),
      );
    });

    it('should throw when updating non-draft RFQ (unless cancel)', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));

      const dto: UpdateRfqDto = { title: 'Hack attempt' };

      await expect(service.update('rfq-1', dto, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when RFQ not found', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as UpdateRfqDto, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should allow cancelling a non-draft RFQ via update with status=CANCELLED', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));
      prisma.rfq.update.mockResolvedValue(draftRfq({ status: 'CANCELLED' }));
      prisma.auditLog.create.mockResolvedValue({});

      const dto: UpdateRfqDto = { status: 'CANCELLED' as any };
      const result = await service.update('rfq-1', dto, 'u1');

      expect(result.status).toBe('CANCELLED');
    });
  });

  // ---------------------------------------------------------------------------
  // REMOVE (soft delete)
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should soft-delete a draft RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq());
      prisma.rfq.update.mockResolvedValue(draftRfq({ deletedAt: mockDate, status: 'CANCELLED' }));
      prisma.auditLog.create.mockResolvedValue({});

      await service.remove('rfq-1', 'u1');

      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rfq-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date), status: 'CANCELLED' }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'DELETE_RFQ' }) }),
      );
    });

    it('should soft-delete a cancelled RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'CANCELLED' }));
      prisma.rfq.update.mockResolvedValue(draftRfq({ status: 'CANCELLED', deletedAt: mockDate }));
      prisma.auditLog.create.mockResolvedValue({});

      await service.remove('rfq-1', 'u1');

      expect(prisma.rfq.update).toHaveBeenCalled();
    });

    it('should throw when deleting ACTIVE RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));

      await expect(service.remove('rfq-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when deleting CLOSED RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'CLOSED' }));

      await expect(service.remove('rfq-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when RFQ not found', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // PUBLISH
  // ---------------------------------------------------------------------------
  describe('publish', () => {
    it('should publish a draft RFQ and deduct credits', async () => {
      const rfq = draftRfq({ rfqType: 'PRODUCT' });
      prisma.rfq.findFirst.mockResolvedValue(rfq);
      stubGroupBy(10);
      prisma.rfq.update.mockResolvedValue({ ...rfq, status: 'ACTIVE' });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.publish('rfq-1', 'u1');

      expect(result.status).toBe('ACTIVE');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockTx.rfqCreditLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'USED', amount: 1, companyId: 'company-1', referenceId: 'rfq-1' }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'PUBLISH_RFQ' }) }),
      );
    });

    it('should throw when publishing non-draft RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));

      await expect(service.publish('rfq-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when RFQ not found', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.publish('nonexistent', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when insufficient credits', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq());
      stubGroupBy(0);

      await expect(service.publish('rfq-1', 'u1')).rejects.toThrow(ForbiddenException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException on race condition inside transaction', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq());
      prisma.rfqCreditLedger.groupBy
        .mockResolvedValueOnce([{ type: 'PURCHASE', _sum: { amount: 1 } }]);
      mockTx.rfqCreditLedger.groupBy
        .mockResolvedValueOnce([{ type: 'PURCHASE', _sum: { amount: 0 } }]);
      prisma.$transaction.mockImplementation(async (cb: any) => cb(mockTx));

      await expect(service.publish('rfq-1', 'u1')).rejects.toThrow(ForbiddenException);

      expect(mockTx.rfqCreditLedger.create).not.toHaveBeenCalled();
    });

    it('should charge correct credits per RFQ type', async () => {
      const testCases = [
        { rfqType: 'PRODUCT', expected: 1 },
        { rfqType: 'SERVICE', expected: 1 },
        { rfqType: 'BULK', expected: 3 },
        { rfqType: 'URGENT', expected: 5 },
      ];

      for (const { rfqType, expected } of testCases) {
        jest.clearAllMocks();
        const rfq = draftRfq({ rfqType });
        prisma.rfq.findFirst.mockResolvedValue(rfq);
        stubGroupBy(10);
        prisma.rfq.update.mockResolvedValue({ ...rfq, status: 'ACTIVE' });
        prisma.auditLog.create.mockResolvedValue({});

        await service.publish('rfq-1', 'u1');

        expect(mockTx.rfqCreditLedger.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ amount: expected }) }),
        );
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CANCEL
  // ---------------------------------------------------------------------------
  describe('cancel', () => {
    it('should cancel an active RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));
      prisma.rfq.update.mockResolvedValue(draftRfq({ status: 'CANCELLED', cancelledAt: mockDate }));
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.cancel('rfq-1', 'Changed mind', 'u1');

      expect(result.status).toBe('CANCELLED');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CANCEL_RFQ' }) }),
      );
    });

    it('should cancel with default reason when none provided', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));
      prisma.rfq.update.mockResolvedValue(draftRfq({ status: 'CANCELLED' }));
      prisma.auditLog.create.mockResolvedValue({});

      await service.cancel('rfq-1', undefined, 'u1');

      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ cancelReason: 'Cancelled by user' }) }),
      );
    });

    it('should throw when cancelling already CANCELLED RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'CANCELLED' }));

      await expect(service.cancel('rfq-1', 'again', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when cancelling CLOSED RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'CLOSED' }));

      await expect(service.cancel('rfq-1', '', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when cancelling CONVERTED RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'CONVERTED' }));

      await expect(service.cancel('rfq-1', '', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when RFQ not found', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.cancel('nonexistent', '', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // GET CREDIT BALANCE
  // ---------------------------------------------------------------------------
  describe('getCreditBalance', () => {
    it('should return 0 when no ledger entries', async () => {
      prisma.rfqCreditLedger.groupBy.mockResolvedValue([]);

      const balance = await service.getCreditBalance('c1');

      expect(balance).toBe(0);
    });

    it('should compute balance from PURCHASE and USED entries', async () => {
      prisma.rfqCreditLedger.groupBy.mockResolvedValue([
        { type: 'PURCHASE', _sum: { amount: 100 } },
        { type: 'BONUS', _sum: { amount: 50 } },
        { type: 'USED', _sum: { amount: 30 } },
        { type: 'ADMIN_CREDIT', _sum: { amount: 20 } },
        { type: 'REFUNDED', _sum: { amount: 10 } },
      ]);

      const balance = await service.getCreditBalance('c1');

      expect(balance).toBe(150);
    });

    it('should clamp balance at 0', async () => {
      prisma.rfqCreditLedger.groupBy.mockResolvedValue([
        { type: 'USED', _sum: { amount: 100 } },
      ]);

      const balance = await service.getCreditBalance('c1');

      expect(balance).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // ADMIN GRANT CREDITS
  // ---------------------------------------------------------------------------
  describe('adminGrantCredits', () => {
    it('should grant credits to a company', async () => {
      prisma.rfqCreditLedger.groupBy.mockResolvedValue([]);
      prisma.rfqCreditLedger.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      await service.adminGrantCredits('c1', 50, 'admin-u1');

      expect(prisma.rfqCreditLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'ADMIN_CREDIT', amount: 50, companyId: 'c1', balanceBefore: 0, balanceAfter: 50 }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'GRANT_RFQ_CREDITS', userId: 'admin-u1' }) }),
      );
    });

    it('should compute balanceBefore from existing credits', async () => {
      prisma.rfqCreditLedger.groupBy.mockResolvedValue([
        { type: 'PURCHASE', _sum: { amount: 30 } },
      ]);
      prisma.rfqCreditLedger.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      await service.adminGrantCredits('c1', 20, 'u1');

      expect(prisma.rfqCreditLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ balanceBefore: 30, balanceAfter: 50 }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASES
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle missing categoryId and industryId gracefully', async () => {
      const dto: CreateRfqDto = { title: 'No cat', rfqType: 'PRODUCT' as any, quantity: 5, unit: 'units' };
      prisma.rfq.create.mockResolvedValue(draftRfq({ categoryId: null, industryId: null }));
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.create('c1', dto, 'u1');

      expect(result.categoryId).toBeNull();
    });

    it('should set showBudget default to false', async () => {
      const dto: CreateRfqDto = { title: 'Budget hidden', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'unit' };
      prisma.rfq.create.mockResolvedValue(draftRfq({ showBudget: false }));
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.create('c1', dto, 'u1');

      expect(prisma.rfq.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ showBudget: false }) }),
      );
    });

    it('should set visibility default to PUBLIC', async () => {
      const dto: CreateRfqDto = { title: 'Default vis', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'unit' };
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', dto, 'u1');

      expect(prisma.rfq.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ visibility: 'PUBLIC' }) }),
      );
    });

    it('should set urgency default to NORMAL', async () => {
      const dto: CreateRfqDto = { title: 'Default urg', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'unit' };
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', dto, 'u1');

      expect(prisma.rfq.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ urgency: 'NORMAL' }) }),
      );
    });

    it('should handle expiresAt as Date conversion from string', async () => {
      const dto: CreateRfqDto = {
        title: 'Expiring',
        rfqType: 'PRODUCT' as any,
        quantity: 1,
        unit: 'unit',
        expiresAt: '2026-07-10T12:00:00Z',
      };
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', dto, 'u1');

      expect(prisma.rfq.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expiresAt: new Date('2026-07-10T12:00:00Z') }),
        }),
      );
    });

    it('should generate RFQ number and stateCode on creation', async () => {
      const dto: CreateRfqDto = { title: 'Numbered', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'unit' };
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.create('c1', dto, 'u1');

      expect(mockRfqNumberService.generate).toHaveBeenCalled();
      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ rfqNumber: expect.any(String) }) }),
      );
      expect(result.rfqNumber).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // CLOSE
  // ---------------------------------------------------------------------------
  describe('close', () => {
    it('should close an ACTIVE RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));
      prisma.rfq.update.mockResolvedValue(draftRfq({ status: 'CLOSED', closedAt: mockDate }));
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.close('rfq-1', 'u1');

      expect(result.status).toBe('CLOSED');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CLOSE_RFQ' }) }),
      );
    });

    it('should close a QUOTED RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'QUOTED' }));
      prisma.rfq.update.mockResolvedValue(draftRfq({ status: 'CLOSED' }));
      prisma.auditLog.create.mockResolvedValue({});

      await service.close('rfq-1', 'u1');

      expect(prisma.rfq.update).toHaveBeenCalled();
    });

    it('should throw when closing DRAFT RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'DRAFT' }));

      await expect(service.close('rfq-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when closing CLOSED RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'CLOSED' }));

      await expect(service.close('rfq-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when RFQ not found', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.close('nonexistent', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // REOPEN
  // ---------------------------------------------------------------------------
  describe('reopen', () => {
    it('should reopen a CLOSED RFQ within 7 days', async () => {
      prisma.rfq.findFirst.mockResolvedValue(closedRfq());
      prisma.rfq.update.mockResolvedValue(draftRfq({ status: 'ACTIVE', reopenedAt: mockDate, reopenCount: 1 }));
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.reopen('rfq-1', 'u1');

      expect(result.status).toBe('ACTIVE');
      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reopenedAt: expect.any(Date), reopenCount: { increment: 1 }, closedAt: null }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'REOPEN_RFQ' }) }),
      );
    });

    it('should throw when reopening non-CLOSED RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));

      await expect(service.reopen('rfq-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw when reopening already-reopened RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(closedRfq({ reopenCount: 1 }));

      await expect(service.reopen('rfq-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when RFQ not found', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.reopen('nonexistent', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------------------------
  describe('search', () => {
    it('should search by rfqNumber', async () => {
      prisma.rfq.findMany.mockResolvedValue([draftRfq()]);
      prisma.rfq.count.mockResolvedValue(1);

      const result = await service.search('c1', { rfqNumber: 'TRFQ' } as any);

      expect(result.data).toHaveLength(1);
      expect(prisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rfqNumber: { contains: 'TRFQ', mode: 'insensitive' } }),
        }),
      );
    });

    it('should search by title', async () => {
      prisma.rfq.findMany.mockResolvedValue([]);
      prisma.rfq.count.mockResolvedValue(0);

      await service.search('c1', { title: 'steel' } as any);

      expect(prisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ title: { contains: 'steel', mode: 'insensitive' } }),
        }),
      );
    });

    it('should filter by categoryId', async () => {
      prisma.rfq.findMany.mockResolvedValue([]);
      prisma.rfq.count.mockResolvedValue(0);

      await service.search('c1', { categoryId: 'cat-1' } as any);

      expect(prisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prisma.rfq.findMany.mockResolvedValue([]);
      prisma.rfq.count.mockResolvedValue(0);

      await service.search('c1', { dateFrom: '2026-06-01', dateTo: '2026-06-30' } as any);

      expect(prisma.rfq.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: new Date('2026-06-01'), lte: new Date('2026-06-30') },
          }),
        }),
      );
    });

    it('should return paginated results', async () => {
      prisma.rfq.findMany.mockResolvedValue([]);
      prisma.rfq.count.mockResolvedValue(0);

      const result = await service.search('c1', { page: 2, limit: 10 } as any);

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
    });
  });

  // ---------------------------------------------------------------------------
  // PURCHASE CREDIT PACK
  // ---------------------------------------------------------------------------
  describe('purchaseCreditPack', () => {
    it('should create a credit pack and return payment details', async () => {
      prisma.rfqCreditPack.create.mockResolvedValue({ id: 'pack-1', credits: 5, price: 999, currency: 'INR' });

      const result = await service.purchaseCreditPack('c1', 'u1');

      expect(result.id).toBe('pack-1');
      expect(result.credits).toBe(5);
      expect(result.amount).toBe(99900);
      expect(result.currency).toBe('INR');
      expect(prisma.rfqCreditPack.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // PLAN ENFORCEMENT
  // ---------------------------------------------------------------------------
  describe('plan enforcement', () => {
    it('should allow creation for TRADBUY subscription', async () => {
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADBUY' });
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', { title: 'Test', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'pcs' }, 'u1');

      expect(prisma.rfq.create).toHaveBeenCalled();
    });

    it('should block free tier beyond 5 RFQs/month', async () => {
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: null });
      prisma.rfq.count.mockResolvedValue(5);

      await expect(
        service.create('c1', { title: 'Sixth', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'pcs' }, 'u1'),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.rfq.create).not.toHaveBeenCalled();
    });

    it('should allow free tier within limit (4 of 5 used)', async () => {
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: null });
      prisma.rfq.count.mockResolvedValue(4);
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', { title: 'Fifth allowed', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'pcs' }, 'u1');

      expect(prisma.rfq.create).toHaveBeenCalled();
    });

    it('should allow unlimited for TRADBUY regardless of count', async () => {
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADBUY' });
      prisma.rfq.count.mockResolvedValue(999);
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', { title: 'Unlimited', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'pcs' }, 'u1');

      expect(prisma.rfq.create).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // ANALYTICS EVENTS
  // ---------------------------------------------------------------------------
  describe('analytics event tracking', () => {
    it('should track CREATED event on RFQ creation', async () => {
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', { title: 'Tracked', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'pcs' }, 'u1');

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(
        'c1', 'rfq-1', 'CREATED', { rfqType: 'PRODUCT' },
      );
    });

    it('should track PUBLISHED event on publish', async () => {
      prisma.rfq.findFirst.mockResolvedValue(draftRfq());
      stubGroupBy(10);
      prisma.rfq.update.mockResolvedValue(draftRfq({ status: 'ACTIVE' }));
      prisma.auditLog.create.mockResolvedValue({});

      await service.publish('rfq-1', 'u1');

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(
        expect.any(String), 'rfq-1', 'PUBLISHED', { creditsUsed: 1 },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // STATE CODE SUPPORT
  // ---------------------------------------------------------------------------
  describe('state code support', () => {
    it('should derive stateCode from primary location and pass to number generator', async () => {
      const dto: CreateRfqDto = {
        title: 'Mumbai RFQ',
        rfqType: 'PRODUCT' as any,
        quantity: 1,
        unit: 'pcs',
        locations: [{ city: 'Mumbai', state: 'Maharashtra', isPrimary: true }],
      };
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', dto, 'u1');

      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ stateCode: 'MH' }) }),
      );
    });

    it('should use XX for missing state', async () => {
      const dto: CreateRfqDto = { title: 'No state', rfqType: 'PRODUCT' as any, quantity: 1, unit: 'pcs' };
      prisma.rfq.create.mockResolvedValue(draftRfq());
      prisma.auditLog.create.mockResolvedValue({});

      await service.create('c1', dto, 'u1');

      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ stateCode: 'XX' }) }),
      );
    });
  });
});
