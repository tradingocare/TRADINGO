import { Test, TestingModule } from '@nestjs/testing';
import { TradfindController } from './tradfind.controller';
import { TradfindService } from './tradfind.service';

describe('TradfindController', () => {
  let controller: TradfindController;
  let tradfindService: jest.Mocked<TradfindService>;

  beforeEach(async () => {
    const mockTradfindService = {
      globalSearch: jest.fn(),
      productSearch: jest.fn(),
      companySearch: jest.fn(),
      autocomplete: jest.fn(),
      getSuggestions: jest.fn(),
      getRecentSearches: jest.fn(),
      deleteRecentSearches: jest.fn(),
      getTrendingSearches: jest.fn(),
      getDiscoveryFeed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradfindController],
      providers: [
        { provide: TradfindService, useValue: mockTradfindService },
      ],
    }).compile();

    controller = module.get<TradfindController>(TradfindController);
    tradfindService = module.get(TradfindService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('globalSearch endpoint', () => {
    it('should call tradfindService.globalSearch with query params', async () => {
      const dto = { q: 'test', page: 1, limit: 10 };
      tradfindService.globalSearch.mockResolvedValue({
        products: [],
        companies: [],
        categories: [],
        industries: [],
        meta: { total: 0, page: 1, limit: 10 },
      });

      const result = await controller.globalSearch(dto);

      expect(tradfindService.globalSearch).toHaveBeenCalledWith(dto);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('searchProducts endpoint', () => {
    it('should call tradfindService.productSearch with query params', async () => {
      const dto = { q: 'test', page: 1, limit: 20 };
      tradfindService.productSearch.mockResolvedValue({ hits: [], total: 0, page: 1, limit: 20 });

      const result = await controller.productSearch(dto);

      expect(tradfindService.productSearch).toHaveBeenCalledWith(dto);
      expect(result.total).toBe(0);
    });
  });

  describe('searchCompanies endpoint', () => {
    it('should call tradfindService.companySearch with query params', async () => {
      const dto = { q: 'test', page: 1, limit: 20 };
      tradfindService.companySearch.mockResolvedValue({ hits: [], total: 0, page: 1, limit: 20 });

      const result = await controller.companySearch(dto);

      expect(tradfindService.companySearch).toHaveBeenCalledWith(dto);
      expect(result.total).toBe(0);
    });
  });

  describe('autocomplete endpoint', () => {
    it('should call tradfindService.autocomplete with query params', async () => {
      const dto = { q: 'test', limit: 5 };
      tradfindService.autocomplete.mockResolvedValue([]);

      const result = await controller.autocomplete(dto);

      expect(tradfindService.autocomplete).toHaveBeenCalledWith(dto);
      expect(result).toEqual([]);
    });
  });

  describe('suggestions endpoint', () => {
    it('should call tradfindService.getSuggestions with query params', async () => {
      const dto = { limit: 5 };
      tradfindService.getSuggestions.mockResolvedValue([]);

      const result = await controller.suggestions(dto);

      expect(tradfindService.getSuggestions).toHaveBeenCalledWith(dto);
      expect(result).toEqual([]);
    });
  });

  describe('trending endpoint', () => {
    it('should call tradfindService.getTrendingSearches with defaults', async () => {
      tradfindService.getTrendingSearches.mockResolvedValue([]);

      const result = await controller.trendingSearches(undefined, undefined);

      expect(tradfindService.getTrendingSearches).toHaveBeenCalledWith(10, 'daily');
      expect(result).toEqual([]);
    });

    it('should call tradfindService.getTrendingSearches with custom params', async () => {
      tradfindService.getTrendingSearches.mockResolvedValue([]);

      const result = await controller.trendingSearches(5, 'weekly');

      expect(tradfindService.getTrendingSearches).toHaveBeenCalledWith(5, 'weekly');
      expect(result).toEqual([]);
    });
  });

  describe('discoveryFeed endpoint', () => {
    it('should call tradfindService.getDiscoveryFeed with query params', async () => {
      const dto = { page: 1, limit: 20, latitude: 19.076, longitude: 72.8777 };
      tradfindService.getDiscoveryFeed.mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20 },
      });

      const result = await controller.discoveryFeed(dto);

      expect(tradfindService.getDiscoveryFeed).toHaveBeenCalledWith(dto);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getRecentSearches endpoint', () => {
    it('should call tradfindService.getRecentSearches with userId and limit', async () => {
      const dto = { limit: 10 };
      tradfindService.getRecentSearches.mockResolvedValue([]);

      const result = await controller.recentSearches('user-1', dto);

      expect(tradfindService.getRecentSearches).toHaveBeenCalledWith('user-1', 10);
      expect(result).toEqual([]);
    });
  });

  describe('deleteRecentSearch endpoint', () => {
    it('should call tradfindService.deleteRecentSearches with searchId', async () => {
      const dto = { searchId: 's1' };

      const result = await controller.deleteRecentSearches('user-1', dto);

      expect(tradfindService.deleteRecentSearches).toHaveBeenCalledWith('user-1', 's1');
      expect(result).toEqual({ message: 'Recent searches deleted' });
    });
  });

  describe('clearRecentSearches endpoint', () => {
    it('should call tradfindService.deleteRecentSearches without searchId', async () => {
      const dto = {};

      const result = await controller.deleteRecentSearches('user-1', dto);

      expect(tradfindService.deleteRecentSearches).toHaveBeenCalledWith('user-1', undefined);
      expect(result).toEqual({ message: 'Recent searches deleted' });
    });
  });
});
