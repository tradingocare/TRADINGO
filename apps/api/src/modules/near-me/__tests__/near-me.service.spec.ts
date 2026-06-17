import { Test, TestingModule } from '@nestjs/testing';
import { NearMeService } from '../near-me.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('NearMeService', () => {
  let service: NearMeService;
  let prisma: any;

  const mockPrisma = {
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NearMeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NearMeService>(NearMeService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRadiusOptions', () => {
    it('should return 8 radius steps', () => {
      const options = service.getRadiusOptions();
      expect(options).toHaveLength(8);
      expect(options[0]).toEqual({ label: '5 km', value: 5 });
      expect(options[7]).toEqual({ label: 'Export', value: 20000 });
    });
  });

  describe('getDistanceLabel', () => {
    it('should return correct labels for distance ranges', () => {
      expect(service.getDistanceLabel(0.5)).toBe('< 1 km');
      expect(service.getDistanceLabel(3)).toBe('< 5 km');
      expect(service.getDistanceLabel(7)).toBe('< 10 km');
      expect(service.getDistanceLabel(20)).toBe('< 25 km');
      expect(service.getDistanceLabel(40)).toBe('< 50 km');
      expect(service.getDistanceLabel(75)).toBe('< 100 km');
      expect(service.getDistanceLabel(150)).toBe('Same State');
      expect(service.getDistanceLabel(1000)).toBe('Pan India');
      expect(service.getDistanceLabel(5000)).toBe('Global');
    });
  });

  describe('searchProducts', () => {
    it('should return empty result when no products found', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      const result = await service.searchProducts({
        lat: 19.076,
        lng: 72.8777,
        radiusKm: 25,
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.center).toEqual({ lat: 19.076, lng: 72.8777 });
    });

    it('should search with default params', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      await service.searchProducts({ lat: 0, lng: 0, radiusKm: 25, page: 1, limit: 20 });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
    });

    it('should apply category filter', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      await service.searchProducts({
        lat: 19.076, lng: 72.8777, radiusKm: 25,
        categoryId: 'cat1', page: 1, limit: 20,
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should apply price range filters', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      await service.searchProducts({
        lat: 19.076, lng: 72.8777, radiusKm: 25,
        minPrice: 100, maxPrice: 5000, page: 1, limit: 20,
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should apply verified and tradgo filters', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      await service.searchProducts({
        lat: 19.076, lng: 72.8777, radiusKm: 25,
        verifiedOnly: true, tradgoOnly: true, page: 1, limit: 20,
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should apply trust score and delivery time filters', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      await service.searchProducts({
        lat: 19.076, lng: 72.8777, radiusKm: 25,
        minTrustScore: 50, deliveryTime: '7 days', page: 1, limit: 20,
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should support sort by trust', async () => {
      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      await service.searchProducts({
        lat: 19.076, lng: 72.8777, radiusKm: 25,
        sort: 'trust', page: 1, limit: 20,
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should support pagination', async () => {
      const mockProducts = Array.from({ length: 20 }, (_, i) => ({
        id: `pli_${i}`, productId: `p_${i}`, companyId: 'c1', categoryId: 'cat1',
        latitude: 19.076, longitude: 72.8777, trustScore: 80,
        price: 1000, moq: 10, isVerified: true, isTradgo: false, deliveryEta: '3 days',
        distanceKm: 5.5, name: `Product ${i}`, slug: `product-${i}`,
        shortDescription: null, unit: 'kg', companyName: 'Acme', companySlug: 'acme',
        categoryName: 'Category', imageUrl: null,
      }));

      mockPrisma.$queryRawUnsafe
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([{ total: 45 }]);

      const result = await service.searchProducts({
        lat: 19.076, lng: 72.8777, radiusKm: 25,
        page: 1, limit: 20,
      });

      expect(result.data).toHaveLength(20);
      expect(result.meta.total).toBe(45);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.data[0].distanceLabel).toBe('< 10 km');
    });

    it('should handle query errors gracefully', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('DB error'));

      const result = await service.searchProducts({
        lat: 19.076, lng: 72.8777, radiusKm: 25,
        page: 1, limit: 20,
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('should return categories with product counts', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'cat1', name: 'Electronics', slug: 'electronics', icon: null, productCount: 15 },
        { id: 'cat2', name: 'Food', slug: 'food', icon: null, productCount: 8 },
      ]);

      const result = await service.getCategories(19.076, 72.8777, 25);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Electronics');
      expect(result[0].productCount).toBe(15);
    });

    it('should return empty array when no categories', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
      const result = await service.getCategories(0, 0, 5);
      expect(result).toEqual([]);
    });
  });

  describe('getSellers', () => {
    it('should return sellers with product counts', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          id: 'c1', name: 'Acme Corp', slug: 'acme', trustScore: 85,
          verificationLevel: 'LEVEL_2', isTradgo: false, geographicReach: null,
          avgTrustScore: 82, productCount: 12, avgDistanceKm: 8.5,
        },
      ]);

      const result = await service.getSellers(19.076, 72.8777, 25);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Acme Corp');
      expect(result[0].distanceLabel).toBeDefined();
    });

    it('should apply seller filters', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

      await service.getSellers(19.076, 72.8777, 25, {
        minTrustScore: 70, verifiedOnly: true, tradgoOnly: true,
      });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('getRadiusBreakdown', () => {
    it('should return breakdown for all 8 radius steps', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 5 }]);

      const result = await service.getRadiusBreakdown(19.076, 72.8777);

      expect(result).toHaveLength(8);
      expect(result[0].radius).toBe(5);
      expect(result[0].label).toBe('5 km');
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(8);
    });

    it('should handle zero counts', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }]);

      const result = await service.getRadiusBreakdown(0, 0);

      result.forEach((r) => {
        expect(r.count).toBe(0);
      });
    });
  });
});
