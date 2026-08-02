import { Test, TestingModule } from '@nestjs/testing';
import { UsageTrackerService } from './usage-tracker.service';

describe('UsageTrackerService', () => {
  let service: UsageTrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsageTrackerService],
    }).compile();

    service = module.get<UsageTrackerService>(UsageTrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('track', () => {
    it('should track API usage without error', () => {
      expect(() => service.track('model-1', 'PRODUCT_DESCRIPTION', 500, 200)).not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return usage statistics', () => {
      service.track('model-1', 'PRODUCT_DESCRIPTION', 500, 200);
      const stats = service.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBeGreaterThan(0);
    });
  });
});
