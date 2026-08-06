import { Test, TestingModule } from '@nestjs/testing';
import { AiObservabilityService } from './ai-observability.service';

describe('AiObservabilityService', () => {
  let service: AiObservabilityService;

  const event = {
    actionId: 'product.generate-description',
    actionName: 'Generate Description',
    companyId: 'company-1',
    userId: 'user-1',
    success: true,
    latencyMs: 120,
    credits: { required: 5, remaining: 95 },
    cached: false,
    fromMemory: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiObservabilityService],
    }).compile();

    service = module.get<AiObservabilityService>(AiObservabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('record', () => {
    it('should store events', () => {
      service.record(event);
      expect(service.getRecent().length).toBe(1);
    });

    it('should cap events at max', () => {
      for (let i = 0; i < 1500; i++) {
        service.record({ ...event, actionId: `action-${i % 3}` });
      }
      expect(service.getRecent().length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getStats', () => {
    it('should compute totals and breakdown', () => {
      service.record(event);
      service.record({ ...event, success: false, latencyMs: 200 });
      const stats = service.getStats();
      expect(stats.total).toBe(2);
      expect(stats.successCount).toBe(1);
      expect(stats.failedCount).toBe(1);
      expect(stats.actionBreakdown['product.generate-description']).toBeDefined();
    });

    it('should return zeros when no events', () => {
      const stats = service.getStats();
      expect(stats.total).toBe(0);
      expect(stats.avgLatency).toBe(0);
    });
  });

  describe('getEventsByAction', () => {
    it('should filter by action', () => {
      service.record(event);
      service.record({ ...event, actionId: 'other.action' });
      const events = service.getEventsByAction('product.generate-description');
      expect(events).toHaveLength(1);
    });
  });
});