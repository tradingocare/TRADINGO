import { Test, TestingModule } from '@nestjs/testing';
import { SearchRankingService } from './search-ranking.service';

describe('SearchRankingService', () => {
  let service: SearchRankingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchRankingService],
    }).compile();
    service = module.get<SearchRankingService>(SearchRankingService);
  });

  describe('calculateScore', () => {
    it('should calculate balanced score for average inputs', () => {
      const result = service.calculateScore({
        relevanceScore: 0.5,
        distance: 10,
        maxDistance: 50,
        trustScore: 50,
        verificationLevel: 'LEVEL_3',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      });
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeLessThanOrEqual(1);
      expect(result.relevanceScore).toBe(0.5);
      expect(result.distanceScore).toBeCloseTo(0.8);
    });

    it('should give highest score for perfect inputs', () => {
      const result = service.calculateScore({
        relevanceScore: 1,
        distance: 0,
        maxDistance: 50,
        trustScore: 100,
        verificationLevel: 'LEVEL_6',
        createdAt: new Date(),
      });
      expect(result.totalScore).toBeGreaterThan(0.9);
      expect(result.trustScore).toBe(1);
      expect(result.verificationScore).toBe(1);
      expect(result.freshnessScore).toBe(1);
    });

    it('should give lowest score for worst inputs', () => {
      const result = service.calculateScore({
        relevanceScore: 0,
        distance: 100,
        maxDistance: 50,
        trustScore: 0,
        verificationLevel: 'LEVEL_0',
        createdAt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
      });
      expect(result.totalScore).toBeLessThan(0.3);
      expect(result.trustScore).toBe(0);
      expect(result.verificationScore).toBe(0);
      expect(result.freshnessScore).toBe(0.1);
    });

    it('should handle missing distance', () => {
      const result = service.calculateScore({
        relevanceScore: 0.5,
        trustScore: 50,
        verificationLevel: 'LEVEL_3',
        createdAt: new Date(),
      });
      expect(result.distanceScore).toBe(0.5);
    });

    it('should handle unknown verification level', () => {
      const result = service.calculateScore({
        relevanceScore: 0.5,
        trustScore: 50,
        verificationLevel: 'LEVEL_UNKNOWN',
        createdAt: new Date(),
      });
      expect(result.verificationScore).toBe(0);
    });

    it('should handle very old creation date', () => {
      const result = service.calculateScore({
        relevanceScore: 0.5,
        trustScore: 50,
        verificationLevel: 'LEVEL_3',
        createdAt: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
      });
      expect(result.freshnessScore).toBe(0.1);
    });

    it('should handle recent creation date within 7 days', () => {
      const result = service.calculateScore({
        relevanceScore: 0.5,
        trustScore: 50,
        verificationLevel: 'LEVEL_3',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      });
      expect(result.freshnessScore).toBe(1);
    });

    it('should handle maxDistance of zero', () => {
      const result = service.calculateScore({
        relevanceScore: 0.5,
        distance: 10,
        maxDistance: 0,
        trustScore: 50,
        verificationLevel: 'LEVEL_3',
        createdAt: new Date(),
      });
      expect(result.distanceScore).toBe(0.5);
    });
  });
});
