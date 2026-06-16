import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockDate = new Date('2026-06-13T12:00:00Z');

const makePrisma = () => {
  const prisma = {
    rfq: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    rfqVendorMatch: { findFirst: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    quote: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn().mockResolvedValue({}), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    quoteLineItem: { findMany: jest.fn() },
    quoteEvent: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
  return prisma;
};

const mockRfq = (overrides = {}) => ({
  id: 'rfq-1',
  companyId: 'buyer-1',
  status: 'ACTIVE',
  deletedAt: null,
  quoteCount: 0,
  ...overrides,
});

const mockVendor = (overrides = {}) => ({
  id: 'vendor-1',
  name: 'Vendor Corp',
  slug: 'vendor-corp',
  trustScore: 80,
  responseRate: 90,
  verificationLevel: 'BASIC',
  ...overrides,
});

const mockQuote = (overrides = {}) => ({
  id: 'quote-1',
  rfqId: 'rfq-1',
  companyId: 'vendor-1',
  userId: 'user-1',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  status: 'DRAFT',
  quoteVersion: 1,
  currency: 'INR',
  subtotal: null,
  taxAmount: null,
  totalAmount: 10000,
  discountAmount: null,
  discountPercent: null,
  deliveryTerms: null,
  paymentTerms: null,
  leadTimeDays: 14,
  leadTimeDisplay: null,
  validityDate: null,
  notes: null,
  revisionComment: null,
  isSeen: false,
  seenAt: null,
  submittedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  acceptedAt: null,
  withdrawnAt: null,
  withdrawReason: null,
  createdAt: mockDate,
  updatedAt: mockDate,
  deletedAt: null,
  lineItems: [],
  attachments: [],
  company: mockVendor(),
  events: [],
  ...overrides,
});

describe('QuoteService', () => {
  let service: QuoteService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: false });
    jest.setSystemTime(mockDate);
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<QuoteService>(QuoteService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should throw NotFoundException for missing RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.create('vendor-1', 'rfq-1', 'user-1', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if buyer tries to quote on own RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq({ companyId: 'vendor-1' }));

      await expect(service.create('vendor-1', 'rfq-1', 'user-1', {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if RFQ is not ACTIVE', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq({ status: 'DRAFT' }));

      await expect(service.create('vendor-1', 'rfq-1', 'user-1', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if vendor is not matched', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.rfqVendorMatch.findFirst.mockResolvedValue(null);

      await expect(service.create('vendor-1', 'rfq-1', 'user-1', {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if vendor already has active quote', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.rfqVendorMatch.findFirst.mockResolvedValue({ id: 'match-1' });
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED' }));

      await expect(service.create('vendor-1', 'rfq-1', 'user-1', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if validityDate exceeds 30 days', async () => {
      const futureDate = new Date(mockDate);
      futureDate.setDate(futureDate.getDate() + 31);
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.rfqVendorMatch.findFirst.mockResolvedValue({ id: 'match-1' });
      prisma.quote.findFirst.mockResolvedValue(null);

      await expect(service.create('vendor-1', 'rfq-1', 'user-1', { validityDate: futureDate.toISOString() } as any)).rejects.toThrow(BadRequestException);
    });

    it('should create a quote successfully', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.rfqVendorMatch.findFirst.mockResolvedValue({ id: 'match-1' });
      prisma.quote.findFirst.mockResolvedValue(null);
      prisma.quote.create.mockResolvedValue(mockQuote());

      const result = await service.create('vendor-1', 'rfq-1', 'user-1', {
        totalAmount: 10000,
        leadTimeDays: 14,
        lineItems: [{ productName: 'Widget', unitPrice: 100 }],
      } as any);

      expect(result.id).toBe('quote-1');
      expect(prisma.quoteEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'QUOTE_CREATED' }) }),
      );
      expect(prisma.rfqVendorMatch.updateMany).toHaveBeenCalledWith({
        where: { rfqId: 'rfq-1', companyId: 'vendor-1', status: { in: ['SENT', 'VIEWED'] } },
        data: { status: 'QUOTED' },
      });
      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rfq-1' }, data: { quoteCount: { increment: 1 } } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // FIND ALL
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should throw NotFoundException for missing RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.findAll('rfq-1', 'buyer-1')).rejects.toThrow(NotFoundException);
    });

    it('should return ranked quotes for buyer', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findMany.mockResolvedValue([
        mockQuote({ id: 'q1', totalAmount: 5000, leadTimeDays: 10, company: { ...mockVendor(), trustScore: 80, responseRate: 90 } }),
        mockQuote({ id: 'q2', totalAmount: 10000, leadTimeDays: 20, company: { ...mockVendor({ id: 'v2' }), trustScore: 60, responseRate: 70 } }),
      ]);

      const result = await service.findAll('rfq-1', 'buyer-1');

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].rankScore).toBeGreaterThan(result[1].rankScore);
    });

    it('should return own quotes for vendor', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findMany.mockResolvedValue([mockQuote()]);

      const result = await service.findAll('rfq-1', 'vendor-1');

      expect(result).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // FIND BY ID
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should throw NotFoundException for missing quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(null);

      await expect(service.findById('rfq-1', 'quote-1', 'buyer-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote());
      prisma.rfq.findUnique.mockResolvedValue(mockRfq());

      await expect(service.findById('rfq-1', 'quote-1', 'stranger-1')).rejects.toThrow(ForbiddenException);
    });

    it('should mark as VIEWED when buyer views a SUBMITTED quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED' }));
      prisma.rfq.findUnique.mockResolvedValue(mockRfq());

      const result = await service.findById('rfq-1', 'quote-1', 'buyer-1');

      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'quote-1' }, data: expect.objectContaining({ status: 'VIEWED' }) }),
      );
    });

    it('should return quote for vendor directly (no VIEWED marking)', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED' }));
      prisma.rfq.findUnique.mockResolvedValue(mockRfq());

      const result = await service.findById('rfq-1', 'quote-1', 'vendor-1');

      expect(prisma.quote.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should throw BadRequestException for non-draft quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED' }));

      await expect(service.update('rfq-1', 'quote-1', 'user-1', { notes: 'test' })).rejects.toThrow(BadRequestException);
    });

    it('should update draft quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote());
      prisma.quote.update.mockResolvedValue(mockQuote({ notes: 'Updated notes' }));

      const result = await service.update('rfq-1', 'quote-1', 'user-1', { notes: 'Updated notes' });

      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------------------------
  describe('submit', () => {
    it('should throw NotFoundException for missing quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(null);

      await expect(service.submit('rfq-1', 'quote-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-draft quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED' }));

      await expect(service.submit('rfq-1', 'quote-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should submit draft quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote());
      prisma.quote.update.mockResolvedValue(mockQuote({ status: 'SUBMITTED', submittedAt: mockDate }));

      const result = await service.submit('rfq-1', 'quote-1', 'user-1');

      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'quote-1' }, data: expect.objectContaining({ status: 'SUBMITTED' }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // WITHDRAW
  // ---------------------------------------------------------------------------
  describe('withdraw', () => {
    it('should throw BadRequestException for accepted quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'ACCEPTED' }));

      await expect(service.withdraw('rfq-1', 'quote-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should withdraw a submitted quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED' }));
      prisma.quote.update.mockResolvedValue(mockQuote({ status: 'WITHDRAWN', withdrawnAt: mockDate }));

      const result = await service.withdraw('rfq-1', 'quote-1', 'user-1', 'Changed mind');

      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'quote-1' }, data: expect.objectContaining({ status: 'WITHDRAWN', withdrawReason: 'Changed mind' }) }),
      );
      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rfq-1' }, data: { quoteCount: { decrement: 1 } } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // ACCEPT
  // ---------------------------------------------------------------------------
  describe('accept', () => {
    it('should throw ForbiddenException if not buyer', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());

      await expect(service.accept('rfq-1', 'quote-1', 'vendor-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if RFQ not active', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq({ status: 'CLOSED' }));

      await expect(service.accept('rfq-1', 'quote-1', 'buyer-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if quote is not submitted/viewed', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'DRAFT' }));

      await expect(service.accept('rfq-1', 'quote-1', 'buyer-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if quote is expired', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED', validityDate: new Date('2026-06-01T00:00:00Z') }));

      await expect(service.accept('rfq-1', 'quote-1', 'buyer-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should accept a quote and reject others in transaction', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED' }));
      prisma.quote.update.mockResolvedValue(mockQuote({ status: 'ACCEPTED' }));
      prisma.quote.findUnique.mockResolvedValue(mockQuote({ status: 'ACCEPTED' }));

      const result = await service.accept('rfq-1', 'quote-1', 'buyer-1', 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.quote.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rfqId: 'rfq-1', id: { not: 'quote-1' }, status: { notIn: ['WITHDRAWN', 'REJECTED', 'EXPIRED'] } },
          data: expect.objectContaining({ status: 'REJECTED' }),
        }),
      );
      expect(prisma.quoteEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'QUOTE_ACCEPTED' }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // REJECT
  // ---------------------------------------------------------------------------
  describe('reject', () => {
    it('should throw ForbiddenException if not buyer', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());

      await expect(service.reject('rfq-1', 'quote-1', 'vendor-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should reject a submitted quote', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED' }));
      prisma.quote.update.mockResolvedValue(mockQuote({ status: 'REJECTED', rejectedAt: mockDate }));

      const result = await service.reject('rfq-1', 'quote-1', 'buyer-1', 'user-1', 'Not good enough');

      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'quote-1' }, data: expect.objectContaining({ status: 'REJECTED', rejectionReason: 'Not good enough' }) }),
      );
      expect(prisma.quoteEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'QUOTE_REJECTED' }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // REVISE
  // ---------------------------------------------------------------------------
  describe('revise', () => {
    it('should throw BadRequestException for draft quote', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'DRAFT' }));

      await expect(service.revise('rfq-1', 'quote-1', 'user-1', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if max revisions reached', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED', quoteVersion: 6 }));

      await expect(service.revise('rfq-1', 'quote-1', 'user-1', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if validity exceeds 30 days', async () => {
      prisma.quote.findFirst.mockResolvedValue(mockQuote({ status: 'SUBMITTED', quoteVersion: 1 }));
      const futureDate = new Date(mockDate);
      futureDate.setDate(futureDate.getDate() + 31);

      await expect(service.revise('rfq-1', 'quote-1', 'user-1', { validityDate: futureDate.toISOString() } as any)).rejects.toThrow(BadRequestException);
    });

    it('should revise and resubmit a quote', async () => {
      const original = mockQuote({ status: 'SUBMITTED', quoteVersion: 1 });
      prisma.quote.findFirst.mockResolvedValue(original);
      prisma.quote.update.mockResolvedValue({ ...original, quoteVersion: 2, status: 'SUBMITTED', revisionComment: 'Lower price' });

      const result = await service.revise('rfq-1', 'quote-1', 'user-1', { totalAmount: 8000, revisionComment: 'Lower price' } as any);

      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'quote-1' },
          data: expect.objectContaining({ quoteVersion: { increment: 1 }, revisionComment: 'Lower price' }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // EXPIRE OVERDUE QUOTES
  // ---------------------------------------------------------------------------
  describe('expireOverdueQuotes', () => {
    it('should expire overdue quotes and track events', async () => {
      prisma.quote.updateMany.mockResolvedValue({ count: 2 });
      prisma.quote.findMany.mockResolvedValue([
        { id: 'q1', companyId: 'v1', rfqId: 'rfq-1' },
        { id: 'q2', companyId: 'v2', rfqId: 'rfq-1' },
      ]);

      const count = await service.expireOverdueQuotes();

      expect(count).toBe(2);
      expect(prisma.quoteEvent.create).toHaveBeenCalledTimes(2);
      expect(prisma.quoteEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'QUOTE_EXPIRED' }) }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // RANKING
  // ---------------------------------------------------------------------------
  describe('ranking', () => {
    it('should return empty array for no quotes', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findMany.mockResolvedValue([]);

      const result = await service.findAll('rfq-1', 'buyer-1');

      expect(result).toEqual([]);
    });

    it('should rank lower price higher', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findMany.mockResolvedValue([
        mockQuote({ id: 'q1', totalAmount: 2000, leadTimeDays: 14, company: { ...mockVendor(), trustScore: 80, responseRate: 90 } }),
        mockQuote({ id: 'q2', totalAmount: 1000, leadTimeDays: 14, company: { ...mockVendor({ id: 'v2' }), trustScore: 80, responseRate: 90 } }),
      ]);

      const result = await service.findAll('rfq-1', 'buyer-1');

      expect(result[0].id).toBe('q2');
    });

    it('should rank lower delivery time higher', async () => {
      prisma.rfq.findFirst.mockResolvedValue(mockRfq());
      prisma.quote.findMany.mockResolvedValue([
        mockQuote({ id: 'q1', totalAmount: 5000, leadTimeDays: 30, company: { ...mockVendor(), trustScore: 80, responseRate: 90 } }),
        mockQuote({ id: 'q2', totalAmount: 5000, leadTimeDays: 10, company: { ...mockVendor({ id: 'v2' }), trustScore: 80, responseRate: 90 } }),
      ]);

      const result = await service.findAll('rfq-1', 'buyer-1');

      expect(result[0].id).toBe('q2');
    });
  });
});
