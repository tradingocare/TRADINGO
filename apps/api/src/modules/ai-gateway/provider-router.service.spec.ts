import { Test, TestingModule } from '@nestjs/testing';
import { ProviderRouterService } from './provider-router.service';

describe('ProviderRouterService', () => {
  let service: ProviderRouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderRouterService],
    }).compile();

    service = module.get<ProviderRouterService>(ProviderRouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFallbackProviders', () => {
    it('should return fallback list for a provider', () => {
      const fallbacks = service.getFallbackProviders('openrouter');
      expect(Array.isArray(fallbacks)).toBe(true);
    });
  });
});
