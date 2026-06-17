import { Test, TestingModule } from '@nestjs/testing';
import { NearMeController } from '../near-me.controller';
import { NearMeService } from '../near-me.service';

describe('NearMeController', () => {
  let controller: NearMeController;
  let service: any;

  const mockNearMeService = {
    searchProducts: jest.fn(),
    getCategories: jest.fn(),
    getSellers: jest.fn(),
    getRadiusBreakdown: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NearMeController],
      providers: [
        { provide: NearMeService, useValue: mockNearMeService },
      ],
    }).compile();

    controller = module.get<NearMeController>(NearMeController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchProducts', () => {
    it('should call service with parsed query params', async () => {
      const mockResult = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0, center: { lat: 19.076, lng: 72.8777 }, radiusKm: 25 } };
      mockNearMeService.searchProducts.mockResolvedValue(mockResult);

      const result = await controller.searchProducts(
        '19.076', '72.8777', '25',
        'cat1', undefined,
        '100', '5000',
        '50',
        'true', 'false',
        '100', '7 days',
        'distance',
        '1', '20',
      );

      expect(mockNearMeService.searchProducts).toHaveBeenCalledWith({
        lat: 19.076,
        lng: 72.8777,
        radiusKm: 25,
        categoryId: 'cat1',
        subcategoryId: undefined,
        minPrice: 100,
        maxPrice: 5000,
        minTrustScore: 50,
        verifiedOnly: true,
        tradgoOnly: false,
        maxMoq: 100,
        deliveryTime: '7 days',
        sort: 'distance',
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle missing optional params', async () => {
      mockNearMeService.searchProducts.mockResolvedValue({ data: [], meta: {} });

      await controller.searchProducts('0', '0');

      expect(mockNearMeService.searchProducts).toHaveBeenCalledWith({
        lat: 0,
        lng: 0,
        radiusKm: 25,
        categoryId: undefined,
        subcategoryId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minTrustScore: undefined,
        verifiedOnly: false,
        tradgoOnly: false,
        maxMoq: undefined,
        deliveryTime: undefined,
        sort: undefined,
        page: 1,
        limit: 20,
      });
    });
  });

  describe('getCategories', () => {
    it('should call service with lat, lng, radius', async () => {
      mockNearMeService.getCategories.mockResolvedValue([]);

      await controller.getCategories('19.076', '72.8777', '50');

      expect(mockNearMeService.getCategories).toHaveBeenCalledWith(19.076, 72.8777, 50);
    });

    it('should default radius to 25', async () => {
      mockNearMeService.getCategories.mockResolvedValue([]);

      await controller.getCategories('19.076', '72.8777');

      expect(mockNearMeService.getCategories).toHaveBeenCalledWith(19.076, 72.8777, 25);
    });
  });

  describe('getSellers', () => {
    it('should call service with filters', async () => {
      mockNearMeService.getSellers.mockResolvedValue([]);

      await controller.getSellers('19.076', '72.8777', '25', '70', 'true', 'false');

      expect(mockNearMeService.getSellers).toHaveBeenCalledWith(19.076, 72.8777, 25, {
        minTrustScore: 70,
        verifiedOnly: true,
        tradgoOnly: false,
      });
    });
  });

  describe('getRadiusOptions', () => {
    it('should call service with lat, lng', async () => {
      mockNearMeService.getRadiusBreakdown.mockResolvedValue([]);

      await controller.getRadiusOptions('19.076', '72.8777');

      expect(mockNearMeService.getRadiusBreakdown).toHaveBeenCalledWith(19.076, 72.8777);
    });
  });
});
