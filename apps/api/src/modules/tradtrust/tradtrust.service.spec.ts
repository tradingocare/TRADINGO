import { Test, TestingModule } from '@nestjs/testing';
import { TradTrustService } from './tradtrust.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TradTrustService', () => {
  let service: TradTrustService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const mockCompany = {
    id: 'company-1',
    name: 'Test Company',
    slug: 'test-company',
    description: 'A test company',
    logo: 'https://example.com/logo.png',
    banner: 'https://example.com/banner.png',
    website: 'https://example.com',
    email: 'test@example.com',
    mobile: '+911234567890',
    gstNumber: 'GST123',
    panNumber: 'PAN123',
    businessType: 'MANUFACTURER',
    establishedYear: 2015,
    employeeCount: 100,
    geographicReach: 'PAN_INDIA',
    verificationLevel: 'LEVEL_3',
    status: 'ACTIVE',
    trustScore: 0,
    createdAt: new Date('2020-01-01'),
    createdBy: 'user-1',
    deletedAt: null,
    locations: [{ id: 'loc-1' }],
    categories: [{ id: 'cat-1' }],
    owners: [{ id: 'owner-1' }],
  };

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      tradTrustScore: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradTrustService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TradTrustService>(TradTrustService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('calculateScore', () => {
    it('should calculate a score based on all factors', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);

      const score = await service.calculateScore('company-1');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(prisma.tradTrustScore.create).toHaveBeenCalled();
      expect(prisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'company-1' },
          data: expect.objectContaining({ trustScore: score }),
        }),
      );
    });

    it('should return 0 for non-existent company', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      const score = await service.calculateScore('unknown');
      expect(score).toBe(0);
    });

    it('should give higher scores for verified companies', async () => {
      prisma.company.findFirst.mockResolvedValue({
        ...mockCompany,
        verificationLevel: 'LEVEL_6',
        status: 'VERIFIED',
      });
      const score = await service.calculateScore('company-1');
      expect(score).toBeGreaterThan(70);
    });

    it('should give lower scores for unverified companies', async () => {
      prisma.company.findFirst.mockResolvedValue({
        ...mockCompany,
        verificationLevel: 'LEVEL_0',
        description: null,
        logo: null,
        banner: null,
        website: null,
        email: null,
        mobile: null,
        gstNumber: null,
        panNumber: null,
        businessType: null,
        establishedYear: null,
        employeeCount: null,
        geographicReach: null,
        locations: [],
        categories: [],
        owners: [],
      });
      const score = await service.calculateScore('company-1');
      expect(score).toBeLessThanOrEqual(32);
    });
  });

  describe('recalculateByCompany', () => {
    it('should recalculate score for a specific company', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      const score = await service.recalculateByCompany('company-1');
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('recalculateAll', () => {
    it('should recalculate scores for all companies', async () => {
      prisma.company.findMany.mockResolvedValue([{ id: 'company-1' }, { id: 'company-2' }]);
      prisma.company.findFirst.mockResolvedValue(mockCompany);

      const count = await service.recalculateAll();
      expect(count).toBe(2);
    });
  });
});
