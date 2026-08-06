import { Test, TestingModule } from '@nestjs/testing';
import { ProviderRouterService } from './provider-router.service';
import { ProviderRegistryService } from './provider-registry.service';
import { TaskType } from '@prisma/client';

describe('ProviderRouterService', () => {
  let service: ProviderRouterService;
  let registry: {
    getProviderInstance: jest.Mock;
    getProvider: jest.Mock;
    getBestProviderForTask: jest.Mock;
  };

  const makeInstance = (name: string, defaultModel: string, supportedTasks: TaskType[]) => ({
    getDefinition: jest.fn().mockReturnValue({ name, displayName: name, defaultModel, supportedTasks }),
  });

  const openrouter = makeInstance('openrouter', 'openai/gpt-4o-mini', [TaskType.PRODUCT_DESCRIPTION, TaskType.RFQ_ANALYSIS]);
  const groq = makeInstance('groq', 'llama3-8b-8192', [TaskType.PRODUCT_DESCRIPTION, TaskType.FAST_SUGGESTION]);
  const gemini = makeInstance('gemini', 'gemini-2.0-flash', [TaskType.PRODUCT_DESCRIPTION]);
  const tavily = makeInstance('tavily', 'tavily-search', [TaskType.LIVE_SEARCH]);
  const firecrawl = makeInstance('firecrawl', 'firecrawl-scrape', [TaskType.WEBSITE_IMPORT]);

  beforeEach(async () => {
    registry = {
      getProviderInstance: jest.fn((name: string) => {
        const map: Record<string, any> = { openrouter, groq, gemini, tavily, firecrawl };
        return map[name] || null;
      }),
      getProvider: jest.fn().mockResolvedValue({ name: 'openrouter', enabled: true }),
      getBestProviderForTask: jest.fn().mockResolvedValue({ name: 'openrouter', supportedModels: ['openai/gpt-4o-mini'] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderRouterService,
        { provide: ProviderRegistryService, useValue: registry },
      ],
    }).compile();

    service = module.get<ProviderRouterService>(ProviderRouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('route', () => {
    it('should route using default routing for task', async () => {
      const result = await service.route(TaskType.PRODUCT_DESCRIPTION);
      expect(result.provider).toBe(openrouter);
      expect(result.model).toBe('openai/gpt-4o-mini');
    });

    it('should honour provider override', async () => {
      const result = await service.route(TaskType.PRODUCT_DESCRIPTION, 'gemini');
      expect(result.provider).toBe(gemini);
    });
  });

  describe('getFallbackProviders', () => {
    it('should exclude primary and failed providers', () => {
      const fallbacks = service.getFallbackProviders(TaskType.PRODUCT_DESCRIPTION, 'openrouter');
      expect(fallbacks.length).toBeGreaterThan(0);
      for (const f of fallbacks) {
        expect(f.provider.getDefinition().name).not.toBe('openrouter');
      }
    });

    it('should return empty when no compatible fallback', () => {
      const fallbacks = service.getFallbackProviders(TaskType.WEBSITE_IMPORT, 'firecrawl');
      expect(fallbacks).toEqual([]);
    });
  });
});