import { Test, TestingModule } from '@nestjs/testing';
import { ModelRegistryService } from './model-registry.service';

describe('ModelRegistryService', () => {
  let service: ModelRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModelRegistryService],
    }).compile();

    service = module.get<ModelRegistryService>(ModelRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getModel', () => {
    it('should return model by name', () => {
      const model = service.getModel('gpt-4o-mini');
      expect(model).toBeDefined();
      expect(model.name).toBe('gpt-4o-mini');
    });

    it('should return undefined for unknown model', () => {
      const model = service.getModel('unknown-model');
      expect(model).toBeUndefined();
    });
  });

  describe('getModelsByCapability', () => {
    it('should return models matching capability', () => {
      const models = service.getModelsByCapability('streaming');
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('getAllModels', () => {
    it('should return all registered models', () => {
      const models = service.getAllModels();
      expect(models.length).toBeGreaterThan(0);
    });
  });
});
