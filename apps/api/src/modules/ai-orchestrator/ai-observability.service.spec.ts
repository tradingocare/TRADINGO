import { Test, TestingModule } from '@nestjs/testing';
import { AiObservabilityService } from './ai-observability.service';

describe('AiObservabilityService', () => {
  let service: AiObservabilityService;

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
    it('should record observability event', () => {
      expect(() => service.record('action-1', 250, true)).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return aggregated metrics', () => {
      service.record('action-1', 250, true);
      service.record('action-1', 300, true);
      service.record('action-2', 100, false);
      const metrics = service.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
