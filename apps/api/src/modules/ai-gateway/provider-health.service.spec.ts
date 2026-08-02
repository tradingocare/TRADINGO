import { Test, TestingModule } from '@nestjs/testing';
import { ProviderHealthService } from './provider-health.service';

describe('ProviderHealthService', () => {
  let service: ProviderHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderHealthService],
    }).compile();

    service = module.get<ProviderHealthService>(ProviderHealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordSuccess', () => {
    it('should record a successful call', () => {
      expect(() => service.recordSuccess('openrouter')).not.toThrow();
    });
  });

  describe('recordFailure', () => {
    it('should record a failed call', () => {
      expect(() => service.recordFailure('openrouter')).not.toThrow();
    });
  });

  describe('getHealth', () => {
    it('should return health status for all providers', () => {
      const health = service.getHealth();
      expect(health).toBeDefined();
    });
  });
});
