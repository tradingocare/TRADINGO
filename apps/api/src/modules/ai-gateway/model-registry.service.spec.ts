import { Test, TestingModule } from '@nestjs/testing';
import { ModelRegistryService } from './model-registry.service';
import { ProviderRegistryService } from './provider-registry.service';

describe('ModelRegistryService', () => {
  let service: ModelRegistryService;

  const fakeInstance = {
    getDefinition: jest.fn().mockReturnValue({
      name: 'openrouter',
      displayName: 'OpenRouter',
      defaultModel: 'openai/gpt-4o-mini',
      supportedModels: ['openai/gpt-4o-mini', 'openai/gpt-4o'],
      supportedTasks: [],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelRegistryService,
        { provide: ProviderRegistryService, useValue: { getAllInstances: jest.fn().mockReturnValue([fakeInstance]) } },
      ],
    }).compile();

    service = module.get<ModelRegistryService>(ModelRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getModelCatalog', () => {
    it('should return catalog of registered models', () => {
      const models = service.getModelCatalog();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].name).toBe('openai/gpt-4o-mini');
    });
  });

  describe('getModelsByCapability', () => {
    it('should return models matching capability', () => {
      const models = service.getModelsByCapability('streaming', true);
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('getBestModelForTask', () => {
    it('should return a model for a known task', () => {
      const model = service.getBestModelForTask('PRODUCT_DESCRIPTION');
      expect(model).not.toBeNull();
    });

    it('should return a fallback model for unknown task', () => {
      const model = service.getBestModelForTask('UNKNOWN_TASK');
      expect(model).not.toBeNull();
    });
  });

  describe('getCatalogStats', () => {
    it('should return statistics', () => {
      const stats = service.getCatalogStats();
      expect(stats.totalModels).toBeGreaterThan(0);
      expect(stats.providers).toBeGreaterThan(0);
    });
  });
});
