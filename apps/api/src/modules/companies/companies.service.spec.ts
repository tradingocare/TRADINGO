import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { ProfileCompletionService } from '../profile-completion/profile-completion.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { VendorCodesService } from '../vendor-codes/vendor-codes.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let searchService: Record<string, jest.Mock>;

  const mockCompany = {
    id: 'company-1',
    name: 'Test Company',
    slug: 'test-company',
    description: 'A test company',
    businessType: 'MANUFACTURER',
    trustScore: 0,
    verificationLevel: 'LEVEL_0',
    status: 'ACTIVE',
    createdBy: 'user-1',
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      company: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      companyOwner: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      user: { findUnique: jest.fn(), findMany: jest.fn() },
      auditLog: { create: jest.fn() },
      companyOnboardingLog: { create: jest.fn(), findFirst: jest.fn() },
      subscriptionEvent: { create: jest.fn() },
    };
    searchService = {
      indexDocument: jest.fn(),
      search: jest.fn(),
      deleteDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: prisma },
        { provide: SearchService, useValue: searchService },
        { provide: ProfileCompletionService, useValue: { getDetails: jest.fn(), calculateAndStore: jest.fn() } },
        { provide: OnboardingService, useValue: { advanceStep: jest.fn(), getStatus: jest.fn(), isOnboardingComplete: jest.fn() } },
        { provide: TradTrustService, useValue: { calculateScore: jest.fn(), recalculateByCompany: jest.fn() } },
        { provide: VendorCodesService, useValue: { generateVendorCode: jest.fn(), assignReferral: jest.fn(), rewardReferral: jest.fn() } },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a company and add creator as primary owner', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      prisma.company.create.mockResolvedValue({
        ...mockCompany,
        owners: [{ userId: 'user-1', isPrimary: true }],
        locations: [],
        categories: [],
      });
      prisma.companyOnboardingLog.findFirst.mockResolvedValue(null);

      const result = await service.create({ name: 'Test Company' }, 'user-1');
      expect(result.name).toBe('Test Company');
      expect(result.slug).toBe('test-company');
      expect(prisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Company',
            createdBy: 'user-1',
            owners: { create: { userId: 'user-1', isPrimary: true } },
          }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CREATE_COMPANY' }) }),
      );
      expect(searchService.indexDocument).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.create({ name: 'Test Company', slug: 'existing' }, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated companies', async () => {
      prisma.company.findMany.mockResolvedValue([mockCompany]);
      prisma.company.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by ownerId', async () => {
      prisma.company.findMany.mockResolvedValue([mockCompany]);
      prisma.company.count.mockResolvedValue(1);

      await service.findAll({ ownerId: 'user-1' });
      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            owners: { some: { userId: 'user-1' } },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return company if found', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      const result = await service.findById('company-1');
      expect(result.id).toBe('company-1');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.findById('company-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return company by slug', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      const result = await service.findBySlug('test-company');
      expect(result.slug).toBe('test-company');
    });

    it('should throw NotFoundException if slug not found', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update company for owners', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });
      prisma.company.update.mockResolvedValue({ ...mockCompany, name: 'Updated' });

      const result = await service.update('company-1', { name: 'Updated' }, 'user-1');
      expect(result.name).toBe('Updated');
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(searchService.indexDocument).toHaveBeenCalled();
    });

    it('should throw NotFoundException if company not found', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.update('company-1', { name: 'Updated' }, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owners', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      prisma.companyOwner.findUnique.mockResolvedValue(null);
      await expect(service.update('company-1', { name: 'Updated' }, 'user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete company for owners', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });

      await service.remove('company-1', 'user-1');
      expect(prisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date), status: 'INACTIVE' }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(searchService.deleteDocument).toHaveBeenCalled();
    });
  });

  describe('addOwner', () => {
    it('should add a new owner', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      prisma.companyOwner.findUnique
        .mockResolvedValueOnce({ id: 'owner-1' })
        .mockResolvedValueOnce(null);
      prisma.companyOwner.create.mockResolvedValue({ id: 'owner-2', companyId: 'company-1', userId: 'user-2' });

      const result = await service.addOwner('company-1', 'user-2', 'user-1');
      expect(result.userId).toBe('user-2');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user is already owner', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      prisma.companyOwner.findUnique
        .mockResolvedValueOnce({ id: 'owner-1' })
        .mockResolvedValueOnce({ id: 'existing-owner' });
      await expect(service.addOwner('company-1', 'user-2', 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('removeOwner', () => {
    it('should remove an owner', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1', isPrimary: false });
      prisma.companyOwner.count.mockResolvedValue(2);

      await service.removeOwner('company-1', 'user-2', 'user-1');
      expect(prisma.companyOwner.delete).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if removing last primary owner', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1', isPrimary: true });
      prisma.companyOwner.count.mockResolvedValue(1);

      await expect(service.removeOwner('company-1', 'user-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('searchCompanies', () => {
    it('should search and return companies ordered by search relevance', async () => {
      searchService.search.mockResolvedValue({
        hits: [{ id: 'company-1' }, { id: 'company-2' }],
        total: 2,
      });
      prisma.company.findMany.mockResolvedValue([mockCompany, { ...mockCompany, id: 'company-2' }]);

      const result = await service.searchCompanies('test');
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should return empty result when no hits', async () => {
      searchService.search.mockResolvedValue({ hits: [], total: 0 });
      const result = await service.searchCompanies('unknown');
      expect(result.data).toHaveLength(0);
    });
  });
});
