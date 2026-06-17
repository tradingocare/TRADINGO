import { Test, TestingModule } from '@nestjs/testing';
import { ProductLocationService } from '../product-location.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductLocationService', () => {
  let service: ProductLocationService;
  let prisma: any;

  const mockPrisma = {
    product: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    productLocationIndex: { upsert: jest.fn(), findMany: jest.fn() },
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
