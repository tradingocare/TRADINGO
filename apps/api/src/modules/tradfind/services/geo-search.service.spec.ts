import { Test, TestingModule } from '@nestjs/testing';
import { GeoSearchService } from './geo-search.service';

describe('GeoSearchService', () => {
  let service: GeoSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeoSearchService],
    }).compile();
    service = module.get<GeoSearchService>(GeoSearchService);
  });

  describe('buildGeoDistanceFilter', () => {
    it('should build geo_distance filter with correct params', () => {
      const result = service.buildGeoDistanceFilter({ lat: 19.076, lon: 72.8777, radiusKm: 25 });
      expect(result).toEqual({
        geo_distance: {
          distance: '25km',
          location: { lat: 19.076, lon: 72.8777 },
        },
      });
    });
  });

  describe('buildGeoDistanceSort', () => {
    it('should build geo_distance sort array', () => {
      const result = service.buildGeoDistanceSort(19.076, 72.8777);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        _geo_distance: {
          location: { lat: 19.076, lon: 72.8777 },
          order: 'asc',
          unit: 'km',
          mode: 'min',
        },
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between Mumbai and Delhi correctly', () => {
      const distance = service.calculateDistance(19.076, 72.8777, 28.7041, 77.1025);
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1200);
    });

    it('should return 0 for same point', () => {
      const distance = service.calculateDistance(19.076, 72.8777, 19.076, 72.8777);
      expect(distance).toBe(0);
    });

    it('should calculate distance between Bangalore and Hyderabad', () => {
      const distance = service.calculateDistance(12.9716, 77.5946, 17.385, 78.4867);
      expect(distance).toBeGreaterThan(490);
      expect(distance).toBeLessThan(510);
    });

    it('should be symmetric', () => {
      const d1 = service.calculateDistance(19.076, 72.8777, 28.7041, 77.1025);
      const d2 = service.calculateDistance(28.7041, 77.1025, 19.076, 72.8777);
      expect(Math.abs(d1 - d2)).toBeLessThan(0.01);
    });
  });

  describe('getDistanceLabel', () => {
    it('should return correct labels for ranges', () => {
      expect(service.getDistanceLabel(0)).toBe('0-5 KM');
      expect(service.getDistanceLabel(3)).toBe('0-5 KM');
      expect(service.getDistanceLabel(5)).toBe('0-5 KM');
      expect(service.getDistanceLabel(12)).toBe('10-25 KM');
      expect(service.getDistanceLabel(30)).toBe('25-50 KM');
      expect(service.getDistanceLabel(75)).toBe('50-100 KM');
      expect(service.getDistanceLabel(200)).toBe('100+ KM');
    });
  });
});
