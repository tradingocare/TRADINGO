// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { ProfileCompletionService } from '../profile-completion/profile-completion.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { VendorCodesService } from '../vendor-codes/vendor-codes.service';

const mockPrisma = {
  company: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  companyOwner: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  auditLog: { create: jest.fn() },
  companyOnboardingLog: { findFirst: jest.fn(), create: jest.fn() },
  subscriptionEvent: { create: jest.fn() },
};
const mockSearch = { indexDocument: jest.fn(), search: jest.fn(), deleteDocument: jest.fn() };
const mockGuard = { canActivate: jest.fn(() => true) };

describe('Company Flow Integration', () => {
  let controller: CompaniesController;
  let service: CompaniesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SearchService, useValue: mockSearch },
        { provide: ProfileCompletionService, useValue: { getDetails: jest.fn(), calculateAndStore: jest.fn() } },
        { provide: OnboardingService, useValue: { advanceStep: jest.fn(), getStatus: jest.fn(), isOnboardingComplete: jest.fn() } },
        { provide: TradTrustService, useValue: { calculateScore: jest.fn(), recalculateByCompany: jest.fn() } },
        { provide: VendorCodesService, useValue: { generateVendorCode: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(CompanyOwnerGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CompaniesController>(CompaniesController);
    service = module.get<CompaniesService>(CompaniesService);
  });

  beforeEach(() => { jest.clearAllMocks(); mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' }); });
  afterAll(() => { jest.restoreAllMocks(); });

  it('creates company and indexes in search', async () => {
    mockPrisma.company.create.mockResolvedValue({ id: 'c1', name: 'Test Co', slug: 'test-co', owners: [{ userId: 'u1', isPrimary: true, user: { id: 'u1', email: 'u@t.com', name: 'U' } }], locations: [], categories: [], trustScore: 0, verificationLevel: 'UNVERIFIED' });
    mockSearch.indexDocument.mockResolvedValue(undefined);

    const result = await controller.create({ name: 'Test Co', businessType: 'MANUFACTURER', email: 'c@t.com', organizationId: 'o1', status: 'ACTIVE' } as any, 'u1');

    expect(result.name).toBe('Test Co');
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    expect(mockSearch.indexDocument).toHaveBeenCalledWith('companies', 'c1', expect.any(Object));
  });

  it('rejects duplicate company slug', async () => {
    mockPrisma.company.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(controller.create({ name: 'Test Co', businessType: 'MANUFACTURER', email: 'c@t.com', organizationId: 'o1', status: 'ACTIVE' } as any, 'u1'))
      .rejects.toThrow('Company slug already exists');
  });

  it('lists companies with pagination', async () => {
    mockPrisma.company.findMany.mockResolvedValue([{ id: 'c1', name: 'Co1', slug: 'co1', owners: [], locations: [], categories: [], _count: { locations: 0, verifications: 0 }, createdAt: new Date(), updatedAt: new Date() }]);
    mockPrisma.company.count.mockResolvedValue(1);

    const result = await controller.findAll({ limit: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('finds company by slug', async () => {
    mockPrisma.company.findFirst.mockResolvedValue({ id: 'c1', name: 'Co', slug: 'co', owners: [], locations: [], categories: [], _count: { locations: 0, verifications: 0 } });

    expect((await controller.findBySlug('co')).id).toBe('c1');
  });

  it('updates company and re-indexes', async () => {
    mockPrisma.company.update.mockResolvedValue({ id: 'c1', name: 'Updated', slug: 'co', owners: [], locations: [], categories: [], trustScore: 0, verificationLevel: 'UNVERIFIED' });
    mockSearch.indexDocument.mockResolvedValue(undefined);

    const result = await controller.update('c1', { name: 'Updated' } as any, 'u1');

    expect(result.name).toBe('Updated');
    expect(mockSearch.indexDocument).toHaveBeenCalled();
  });

  it('soft deletes company and removes from search', async () => {
    mockPrisma.company.findFirst.mockResolvedValue({ id: 'c1' });
    mockSearch.deleteDocument.mockResolvedValue(undefined);

    await controller.remove('c1', 'u1');

    expect(mockPrisma.company.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }));
    expect(mockSearch.deleteDocument).toHaveBeenCalledWith('companies', 'c1');
  });

  it('manages company owners', async () => {
    mockPrisma.companyOwner.create.mockResolvedValue({ id: 'co1', companyId: 'c1', userId: 'u2' });
    await controller.addOwner('c1', 'u2', 'u1');
    expect(mockPrisma.companyOwner.create).toHaveBeenCalledWith({ data: { companyId: 'c1', userId: 'u2' } });
  });

  it('searches companies via search service', async () => {
    mockSearch.search.mockResolvedValue({ hits: [{ id: 'c2' }, { id: 'c1' }], total: 2, page: 1, limit: 20 });
    mockPrisma.company.findMany.mockResolvedValue([{ id: 'c1', name: 'A', slug: 'a', owners: [], locations: [], categories: [], createdAt: new Date(), updatedAt: new Date() }, { id: 'c2', name: 'B', slug: 'b', owners: [], locations: [], categories: [], createdAt: new Date(), updatedAt: new Date() }]);

    const result = await controller.search('query');

    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('returns sanitized public profile', async () => {
    mockPrisma.company.findFirst.mockResolvedValue({ id: 'c1', name: 'Co', slug: 'co', logo: null, banner: null, description: 'Desc', businessType: 'MANUFACTURER', establishedYear: 2020, employeeCount: '50', trustScore: 85, verificationLevel: 'LEVEL_3', geographicReach: 'LOCAL', totalProducts: 10, responseRate: 95, locations: [{ type: 'HQ', city: 'NYC', state: 'NY', country: 'US' }], categories: [{ category: { name: 'Elec' } }], owners: [{ user: { name: 'O' } }], _count: { locations: 1 } });

    const result = await service.getPublicProfile('co');

    expect(result.isGstVerified).toBe(true);
    expect(result.locations[0]).not.toHaveProperty('id');
  });
});
