import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TradmatchService } from './tradmatch.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RfqAnalyticsService } from '../rfq/rfq-analytics.service';

const mockAnalytics = {
  trackEvent: jest.fn(),
  trackMatchEvent: jest.fn(),
};

const makePrisma = () => ({
  rfq: { findFirst: jest.fn() },
  rfqLocation: { findFirst: jest.fn() },
  company: { findUnique: jest.fn(), findMany: jest.fn() },
  category: { findUnique: jest.fn() },
  rfqVendorMatch: { count: jest.fn(), createMany: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
});

const mockDate = new Date('2026-06-13T12:00:00Z');

const activeRfq = (overrides = {}) => ({
  id: 'rfq-1',
  companyId: 'buyer-1',
  categoryId: 'cat-1',
  industryId: 'ind-1',
  status: 'ACTIVE',
  expiresAt: new Date('2026-07-01T00:00:00Z'),
  ...overrides,
});

const sampleVendor = (overrides = {}) => ({
  id: 'vendor-1',
  name: 'Acme Corp',
  trustScore: 80,
  responseRate: 90,
  goCashBalance: 5000,
  subscriptionPlan: 'TRADE_PRO',
  subscriptionStatus: 'ACTIVE',
  locations: [{ city: 'Mumbai', state: 'Maharashtra', country: 'India' }],
  categories: [{ categoryId: 'cat-1' }],
  ...overrides,
});

describe('TradmatchService', () => {
  let service: TradmatchService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: false });
    jest.setSystemTime(mockDate);
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradmatchService,
        { provide: PrismaService, useValue: prisma },
        { provide: RfqAnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<TradmatchService>(TradmatchService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // FIND MATCHES
  // ---------------------------------------------------------------------------
  describe('findMatches', () => {
    it('should throw NotFoundException for missing RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(null);

      await expect(service.findMatches('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-ACTIVE RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq({ status: 'DRAFT' }));

      await expect(service.findMatches('rfq-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired RFQ', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq({ expiresAt: new Date('2026-06-01T00:00:00Z') }));

      await expect(service.findMatches('rfq-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if matches already exist', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq());
      prisma.rfqVendorMatch.count.mockResolvedValue(3);

      await expect(service.findMatches('rfq-1')).rejects.toThrow(BadRequestException);
    });

    it('should find and broadcast vendor matches', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq());
      prisma.rfqVendorMatch.count.mockResolvedValue(0);
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADE_PLUS' });
      prisma.rfqLocation.findFirst.mockResolvedValue({ city: 'Mumbai', state: 'Maharashtra', country: 'India' });
      prisma.company.findMany.mockResolvedValue([sampleVendor()]);
      prisma.rfqVendorMatch.createMany.mockResolvedValue({ count: 1 });

      const result = await service.findMatches('rfq-1');

      expect(result).toHaveLength(1);
      expect(prisma.rfqVendorMatch.createMany).toHaveBeenCalled();
      expect(mockAnalytics.trackMatchEvent).toHaveBeenCalled();
    });

    it('should apply vendor reach limit from buyer plan', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq());
      prisma.rfqVendorMatch.count.mockResolvedValue(0);
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADE_START' });
      prisma.rfqLocation.findFirst.mockResolvedValue(null);

      const vendors = Array.from({ length: 30 }, (_, i) => sampleVendor({ id: `v-${i}`, trustScore: 50 + i }));
      prisma.company.findMany.mockResolvedValue(vendors);

      const result = await service.findMatches('rfq-1');

      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should fall back to category expansion when few exact matches', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq());
      prisma.rfqVendorMatch.count.mockResolvedValue(0);
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADBUY' });
      prisma.rfqLocation.findFirst.mockResolvedValue(null);
      prisma.company.findMany
        .mockResolvedValueOnce([sampleVendor({ id: 'v1' })])
        .mockResolvedValueOnce([sampleVendor({ id: 'v2' }), sampleVendor({ id: 'v3' })]);
      prisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        children: [{ id: 'cat-2' }, { id: 'cat-3' }],
      });

      const result = await service.findMatches('rfq-1');

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // SCORING
  // ---------------------------------------------------------------------------
  describe('score calculation', () => {
    it('should give higher score for exact category match', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq());
      prisma.rfqVendorMatch.count.mockResolvedValue(0);
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADBUY' });
      prisma.rfqLocation.findFirst.mockResolvedValue(null);

      const exactMatch = sampleVendor({ id: 'v1', trustScore: 90, responseRate: 95, categories: [{ categoryId: 'cat-1' }] });
      const noMatch = sampleVendor({ id: 'v2', trustScore: 90, responseRate: 95, categories: [{ categoryId: 'cat-9' }] });
      prisma.company.findMany.mockResolvedValue([exactMatch, noMatch]);

      const result = await service.findMatches('rfq-1');

      const v1Score = result.find((m: any) => m.vendorId === 'v1')?.finalScore ?? 0;
      const v2Score = result.find((m: any) => m.vendorId === 'v2')?.finalScore ?? 0;
      expect(v1Score).toBeGreaterThan(v2Score);
    });

    it('should give plan boost for Trade Elite vendors', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq({ categoryId: 'cat-1' }));
      prisma.rfqVendorMatch.count.mockResolvedValue(0);
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADBUY' });
      prisma.rfqLocation.findFirst.mockResolvedValue(null);

      const elite = sampleVendor({ id: 'v1', subscriptionPlan: 'TRADE_ELITE', trustScore: 50, responseRate: 50, categories: [{ categoryId: 'cat-1' }] });
      const basic = sampleVendor({ id: 'v2', subscriptionPlan: 'TRADE_START', trustScore: 50, responseRate: 50, categories: [{ categoryId: 'cat-1' }] });
      prisma.company.findMany.mockResolvedValue([elite, basic]);

      const result = await service.findMatches('rfq-1');

      const eliteScore = result.find((m: any) => m.vendorId === 'v1')?.finalScore ?? 0;
      const basicScore = result.find((m: any) => m.vendorId === 'v2')?.finalScore ?? 0;
      expect(eliteScore).toBeGreaterThan(basicScore);
    });
  });

  // ---------------------------------------------------------------------------
  // GET MATCHES
  // ---------------------------------------------------------------------------
  describe('getMatches', () => {
    it('should return matches ordered by score descending', async () => {
      prisma.rfqVendorMatch.findMany.mockResolvedValue([
        { id: 'm1', matchScore: 0.9, company: { id: 'v1', name: 'A', slug: 'a', trustScore: 0, verificationLevel: null, subscriptionPlan: null } },
        { id: 'm2', matchScore: 0.7, company: { id: 'v2', name: 'B', slug: 'b', trustScore: 0, verificationLevel: null, subscriptionPlan: null } },
      ]);

      const result = await service.getMatches('rfq-1');

      expect(result).toHaveLength(2);
      expect(prisma.rfqVendorMatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { rfqId: 'rfq-1' }, orderBy: { matchScore: 'desc' } }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GET MATCH BY ID
  // ---------------------------------------------------------------------------
  describe('getMatchById', () => {
    it('should return a match by id', async () => {
      prisma.rfqVendorMatch.findFirst.mockResolvedValue({
        id: 'm1', matchScore: 0.85, company: { id: 'v1', name: 'Acme', slug: 'acme', trustScore: 0, verificationLevel: null, subscriptionPlan: null },
      });

      const result = await service.getMatchById('rfq-1', 'm1');

      expect(result.id).toBe('m1');
    });

    it('should throw NotFoundException for missing match', async () => {
      prisma.rfqVendorMatch.findFirst.mockResolvedValue(null);

      await expect(service.getMatchById('rfq-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // DUPLICATE PREVENTION
  // ---------------------------------------------------------------------------
  describe('duplicate prevention', () => {
    it('should skip duplicate vendor matches', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq());
      prisma.rfqVendorMatch.count.mockResolvedValue(0);
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADBUY' });
      prisma.rfqLocation.findFirst.mockResolvedValue(null);
      prisma.company.findMany.mockResolvedValue([sampleVendor(), sampleVendor({ id: 'vendor-1' })]);
      prisma.rfqVendorMatch.createMany.mockResolvedValue({ count: 1 });

      const result = await service.findMatches('rfq-1');

      expect(prisma.rfqVendorMatch.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // ANALYTICS
  // ---------------------------------------------------------------------------
  describe('analytics generation', () => {
    it('should track MATCHED analytics event', async () => {
      prisma.rfq.findFirst.mockResolvedValue(activeRfq());
      prisma.rfqVendorMatch.count.mockResolvedValue(0);
      prisma.company.findUnique.mockResolvedValue({ subscriptionPlan: 'TRADBUY' });
      prisma.rfqLocation.findFirst.mockResolvedValue(null);
      prisma.company.findMany.mockResolvedValue([sampleVendor()]);
      prisma.rfqVendorMatch.createMany.mockResolvedValue({ count: 1 });

      await service.findMatches('rfq-1');

      expect(mockAnalytics.trackMatchEvent).toHaveBeenCalledWith(
        'rfq-1', 'buyer-1', 1, expect.any(Number), expect.any(Number),
      );
    });
  });
});
