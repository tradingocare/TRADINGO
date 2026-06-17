import { Test, TestingModule } from '@nestjs/testing';
import { ProductLocationService } from '../product-location.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductLocationService', () => {
  let service: ProductLocationService;
  let prisma: any;

  const mockPrisma = {
    product: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    productLocationIndex: { upsert: jest.fn(), findMany: jest.fn() },
    companyLocation: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductLocationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductLocationService>(ProductLocationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    const mockProduct = {
      id: 'p1',
      companyId: 'c1',
      categoryId: 'cat1',
      latitude: null,
      longitude: null,
      visibilityRadius: null,
      moq: 10,
      deliveryEta: '3 days',
      status: 'ACTIVE',
      originalPrice: 1500,
      company: { id: 'c1', trustScore: 85, verificationLevel: 'LEVEL_2' },
    };

    it('should throw if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.update('bad', { latitude: 0, longitude: 0 } as any)).rejects.toThrow(NotFoundException);
    });

    it('should update product location and upsert index', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, latitude: 19.076, longitude: 72.8777 });
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      const result = await service.update('p1', { latitude: 19.076, longitude: 72.8777 });

      expect(mockPrisma.product.update).toHaveBeenCalled();
      expect(mockPrisma.productLocationIndex.upsert).toHaveBeenCalled();
      expect(result.latitude).toBe(19.076);
      expect(result.longitude).toBe(72.8777);
    });

    it('should use visibility radius if provided', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, latitude: 10, longitude: 20, visibilityRadius: 'STATE' });
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      await service.update('p1', { latitude: 10, longitude: 20, visibilityRadius: 'STATE' as any });

      const upsertCall = mockPrisma.productLocationIndex.upsert.mock.calls[0][0];
      expect(upsertCall.create.visibilityRadius).toBe('STATE');
    });

    it('should set isVerified based on verificationLevel', async () => {
      const unverifiedProduct = { ...mockProduct, company: { id: 'c1', trustScore: 30, verificationLevel: 'LEVEL_0' } };
      mockPrisma.product.findUnique.mockResolvedValue(unverifiedProduct);
      mockPrisma.product.update.mockResolvedValue(unverifiedProduct);
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      await service.update('p1', { latitude: 10, longitude: 20 });

      const upsertCall = mockPrisma.productLocationIndex.upsert.mock.calls[0][0];
      expect(upsertCall.create.isVerified).toBe(false);
    });

    it('should include price in upsert', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue(mockProduct);
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      await service.update('p1', { latitude: 19.076, longitude: 72.8777 });

      const upsertCall = mockPrisma.productLocationIndex.upsert.mock.calls[0][0];
      expect(upsertCall.create.price).toBe(1500);
      expect(upsertCall.create.moq).toBe(10);
      expect(upsertCall.create.deliveryEta).toBe('3 days');
    });
  });

  describe('findByCompany', () => {
    const mockProducts = [
      {
        id: 'p1', name: 'Product A', slug: 'prod-a', sku: 'SKU001',
        status: 'ACTIVE', latitude: 19.076, longitude: 72.8777,
        visibilityRadius: 'STATE', originalPrice: 1500, moq: 10,
        createdAt: new Date(), category: { id: 'cat1', name: 'Food' },
        locationIndex: { id: 'idx1', latitude: 19.076, longitude: 72.8777, visibilityRadius: 'STATE', updatedAt: new Date() },
      },
      {
        id: 'p2', name: 'Product B', slug: 'prod-b', sku: 'SKU002',
        status: 'DRAFT', latitude: null, longitude: null,
        visibilityRadius: null, originalPrice: null, moq: 5,
        createdAt: new Date(), category: null,
        locationIndex: null,
      },
    ];

    it('should return all products with location status', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await service.findByCompany('c1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.data[0].locationSet).toBe(true);
      expect(result.data[1].locationSet).toBe(false);
    });

    it('should filter by locationStatus = set', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.findByCompany('c1', { locationStatus: 'set', page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].locationSet).toBe(true);
      expect(mockPrisma.product.findMany.mock.calls[0][0].where.latitude).toEqual({ not: null });
    });

    it('should filter by locationStatus = missing', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[1]]);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.findByCompany('c1', { locationStatus: 'missing', page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].locationSet).toBe(false);
      expect(mockPrisma.product.findMany.mock.calls[0][0].where.latitude).toBeNull();
    });

    it('should filter by search term', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await service.findByCompany('c1', { search: 'Product A' });

      const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(whereArg.OR).toBeDefined();
      expect(whereArg.OR[0].name.contains).toBe('Product A');
    });

    it('should filter by status', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[1]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await service.findByCompany('c1', { status: 'DRAFT' });

      expect(mockPrisma.product.findMany.mock.calls[0][0].where.status).toBe('DRAFT');
    });

    it('should paginate results', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(10);

      const result = await service.findByCompany('c1', { page: 2, limit: 5 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
      expect(result.meta.totalPages).toBe(2);
      expect(mockPrisma.product.findMany.mock.calls[0][0].skip).toBe(5);
      expect(mockPrisma.product.findMany.mock.calls[0][0].take).toBe(5);
    });
  });

  describe('bulkUpdate', () => {
    const mockProducts = [
      { id: 'p1', companyId: 'c1', categoryId: 'cat1', latitude: null, longitude: null, visibilityRadius: null, moq: 10, deliveryEta: '3 days', status: 'ACTIVE', originalPrice: 1500, company: { id: 'c1', trustScore: 85, verificationLevel: 'LEVEL_2' } },
      { id: 'p2', companyId: 'c1', categoryId: 'cat2', latitude: null, longitude: null, visibilityRadius: null, moq: 20, deliveryEta: '5 days', status: 'ACTIVE', originalPrice: 500, company: { id: 'c1', trustScore: 70, verificationLevel: 'LEVEL_0' } },
    ];

    it('should throw if no product IDs provided', async () => {
      await expect(service.bulkUpdate({ productIds: [], latitude: 0, longitude: 0 })).rejects.toThrow(BadRequestException);
    });

    it('should throw if no products found', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      await expect(service.bulkUpdate({ productIds: ['bad'], latitude: 0, longitude: 0 })).rejects.toThrow(NotFoundException);
    });

    it('should update all products and upsert index', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.update.mockResolvedValue({});
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      const result = await service.bulkUpdate({
        productIds: ['p1', 'p2'], latitude: 19.076, longitude: 72.8777, visibilityRadius: 'STATE' as any,
      });

      expect(result.updated).toBe(2);
      expect(mockPrisma.product.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.productLocationIndex.upsert).toHaveBeenCalledTimes(2);
    });

    it('should upsert with correct isVerified flags', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.update.mockResolvedValue({});
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      await service.bulkUpdate({ productIds: ['p1', 'p2'], latitude: 10, longitude: 20 });

      const firstUpsert = mockPrisma.productLocationIndex.upsert.mock.calls[0][0];
      const secondUpsert = mockPrisma.productLocationIndex.upsert.mock.calls[1][0];
      expect(firstUpsert.create.isVerified).toBe(true);
      expect(secondUpsert.create.isVerified).toBe(false);
    });
  });

  describe('getCompanyDefaultLocation', () => {
    const mockAddress = {
      id: 'addr1', addressLine1: '123 Main St', addressLine2: null,
      city: 'Mumbai', district: null, state: 'Maharashtra',
      country: 'India', pincode: '400001', latitude: 19.076, longitude: 72.8777,
    };

    it('should return primary address if exists', async () => {
      mockPrisma.companyLocation.findFirst.mockResolvedValueOnce(mockAddress);

      const result = (await service.getCompanyDefaultLocation('c1'))!;
      expect(result!.city).toBe('Mumbai');
      expect(result!.latitude).toBe(19.076);
      expect(mockPrisma.companyLocation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: 'c1', isPrimary: true, deletedAt: null } }),
      );
    });

    it('should fallback to first address if no primary', async () => {
      mockPrisma.companyLocation.findFirst.mockResolvedValueOnce(null);
      mockPrisma.companyLocation.findFirst.mockResolvedValueOnce(mockAddress);

      const result = (await service.getCompanyDefaultLocation('c1'))!;
      expect(result!.city).toBe('Mumbai');
    });

    it('should return null if no addresses exist', async () => {
      mockPrisma.companyLocation.findFirst.mockResolvedValueOnce(null);
      mockPrisma.companyLocation.findFirst.mockResolvedValueOnce(null);

      const result = await service.getCompanyDefaultLocation('c1');
      expect(result).toBeNull();
    });
  });

  describe('syncAll', () => {
    const mockProducts = [
      {
        id: 'p1', companyId: 'c1', categoryId: 'cat1',
        latitude: 19.076, longitude: 72.8777, visibilityRadius: null,
        moq: 10, deliveryEta: '3 days', status: 'ACTIVE', originalPrice: 1500,
        company: { id: 'c1', trustScore: 85, verificationLevel: 'LEVEL_2' },
      },
      {
        id: 'p2', companyId: 'c2', categoryId: 'cat2',
        latitude: 12.9716, longitude: 77.5946, visibilityRadius: 'STATE',
        moq: 50, deliveryEta: '7 days', status: 'ACTIVE', originalPrice: 500,
        company: { id: 'c2', trustScore: 60, verificationLevel: 'LEVEL_0' },
      },
    ];

    it('should sync all products with locations', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      const result = await service.syncAll();

      expect(result.synced).toBe(2);
      expect(mockPrisma.productLocationIndex.upsert).toHaveBeenCalledTimes(2);
    });

    it('should skip products without lat/lng', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      const result = await service.syncAll();
      expect(result.synced).toBe(0);
    });

    it('should set isVerified correctly', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      await service.syncAll();

      const firstUpsert = mockPrisma.productLocationIndex.upsert.mock.calls[0][0];
      const secondUpsert = mockPrisma.productLocationIndex.upsert.mock.calls[1][0];

      expect(firstUpsert.create.isVerified).toBe(true);
      expect(secondUpsert.create.isVerified).toBe(false);
    });

    it('should use default LOCAL radius if not set', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.productLocationIndex.upsert.mockResolvedValue({});

      await service.syncAll();

      const firstUpsert = mockPrisma.productLocationIndex.upsert.mock.calls[0][0];
      expect(firstUpsert.create.visibilityRadius).toBe('LOCAL');
    });
  });
});
