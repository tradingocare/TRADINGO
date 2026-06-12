import { Test, TestingModule } from '@nestjs/testing';
import { ProfileCompletionService } from './profile-completion.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProfileCompletionService', () => {
  let service: ProfileCompletionService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const fullCompany = {
    id: 'c1',
    name: 'Test Co',
    slug: 'test-co',
    logo: 'logo.png',
    banner: 'banner.png',
    description: 'A description',
    gstNumber: 'GST123',
    panNumber: 'PAN123',
    email: 'test@test.com',
    mobile: '1234567890',
    website: 'https://test.com',
    verificationLevel: 'LEVEL_3',
    goCashBalance: 100,
    profileCompletionPercentage: 100,
    deletedAt: null,
    products: [{ id: 'p1' }],
    categories: [{ categoryId: 'cat1' }],
    locations: [{ id: 'loc1' }],
    certificationDocs: [{ id: 'cert1', status: 'APPROVED' }],
  };

  const emptyCompany = {
    ...fullCompany,
    logo: null,
    banner: null,
    description: null,
    gstNumber: null,
    panNumber: null,
    email: null,
    mobile: null,
    website: null,
    products: [],
    categories: [],
    locations: [],
    certificationDocs: [],
  };

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn(), update: jest.fn() },
      goCashTransaction: { findFirst: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileCompletionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProfileCompletionService>(ProfileCompletionService);
  });

  describe('calculate', () => {
    it('should return 100% when all factors fulfilled', async () => {
      prisma.company.findFirst.mockResolvedValue(fullCompany);
      const result = await service.calculate('c1');
      expect(result.percentage).toBe(100);
    });

    it('should return 0 when all factors missing', async () => {
      prisma.company.findFirst.mockResolvedValue(emptyCompany);
      const result = await service.calculate('c1');
      expect(result.percentage).toBe(0);
    });

    it('should return 0 for non-existent company', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      const result = await service.calculate('unknown');
      expect(result.percentage).toBe(0);
    });
  });

  describe('calculateAndStore', () => {
    it('should calculate and store percentage', async () => {
      prisma.company.findFirst.mockResolvedValue(fullCompany);
      prisma.company.update.mockResolvedValue(fullCompany);
      const pct = await service.calculateAndStore('c1', 'user-1');
      expect(pct).toBe(100);
      expect(prisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { profileCompletionPercentage: 100, updatedBy: 'user-1' } }),
      );
    });
  });

  describe('getDetails', () => {
    it('should return detailed breakdown', async () => {
      prisma.company.findFirst.mockResolvedValue(fullCompany);
      const details = await service.getDetails('c1');
      expect(details.percentage).toBe(100);
      expect(details.factors).toHaveLength(11);
      expect(details.totalWeight).toBe(100);
    });
  });

  describe('rewardProfileCompletion', () => {
    it('should reward 500 GOCASH for 100% completion', async () => {
      prisma.company.findFirst.mockResolvedValue(fullCompany);
      prisma.goCashTransaction.findFirst.mockResolvedValue(null);
      prisma.goCashTransaction.create.mockResolvedValue({} as any);
      prisma.company.update.mockResolvedValue({} as any);

      const result = await service.rewardProfileCompletion('c1', 'user-1');
      expect(result).toBe(true);
      expect(prisma.goCashTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ amount: 500, type: 'EARNED' }) }),
      );
    });

    it('should not reward if already rewarded', async () => {
      prisma.company.findFirst.mockResolvedValue(fullCompany);
      prisma.goCashTransaction.findFirst.mockResolvedValue({ id: 'existing' } as any);
      const result = await service.rewardProfileCompletion('c1', 'user-1');
      expect(result).toBe(false);
    });

    it('should not reward if KYC not complete', async () => {
      prisma.company.findFirst.mockResolvedValue({
        ...fullCompany,
        verificationLevel: 'LEVEL_0',
        profileCompletionPercentage: 100,
      });
      prisma.goCashTransaction.findFirst.mockResolvedValue(null);
      const result = await service.rewardProfileCompletion('c1', 'user-1');
      expect(result).toBe(false);
    });

    it('should not reward if no products', async () => {
      prisma.company.findFirst.mockResolvedValue({
        ...fullCompany,
        products: [],
        profileCompletionPercentage: 100,
      });
      prisma.goCashTransaction.findFirst.mockResolvedValue(null);
      const result = await service.rewardProfileCompletion('c1', 'user-1');
      expect(result).toBe(false);
    });
  });
});
