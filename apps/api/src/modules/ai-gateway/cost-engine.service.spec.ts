import { Test, TestingModule } from '@nestjs/testing';
import { CostEngineService } from './cost-engine.service';
import { ModelRegistryService } from './model-registry.service';

describe('CostEngineService', () => {
  let service: CostEngineService;
  let modelRegistry: ModelRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostEngineService,
        { provide: ModelRegistryService, useValue: { getModel: jest.fn().mockReturnValue({ costPer1kInput: 0.15, costPer1kOutput: 0.60 }) } },
      ],
    }).compile();

    service = module.get<CostEngineService>(CostEngineService);
    modelRegistry = module.get<ModelRegistryService>(ModelRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCost', () => {
    it('should calculate cost based on token usage', () => {
      const cost = service.calculateCost('gpt-4o-mini', 500, 200);
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should return 0 for zero tokens', () => {
      const cost = service.calculateCost('gpt-4o-mini', 0, 0);
      expect(cost).toBe(0);
    });
  });
});
