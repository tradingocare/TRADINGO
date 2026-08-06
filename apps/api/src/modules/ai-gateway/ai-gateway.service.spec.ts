import { Test, TestingModule } from '@nestjs/testing';
import { AiGatewayService } from './ai-gateway.service';
import { AiCreditsService } from './ai-credits.service';
import { UsageTrackerService } from './usage-tracker.service';
import { CostEngineService } from './cost-engine.service';
import { ProviderRegistryService } from './provider-registry.service';
import { ProviderRouterService } from './provider-router.service';
import { ProviderHealthService } from './provider-health.service';
import { PromptManagerService } from './prompt-manager.service';
import { ModelRegistryService } from './model-registry.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';

describe('AiGatewayService', () => {
  let service: AiGatewayService;
  let mockProvider: { complete: jest.Mock; stream: jest.Mock };

  const mockPrisma = {
    aiCreditUsage: { findUnique: jest.fn(), upsert: jest.fn(), findMany: jest.fn() },
  };
  const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const mockCredits = { checkCredits: jest.fn(), deductCredits: jest.fn() };
  const mockUsage = { track: jest.fn() };
  const mockCost = { calculate: jest.fn().mockReturnValue({ totalCost: 0.001 }) };
  const mockRegistry = { getProvider: jest.fn() };
  const mockRouter = { getFallbackProviders: jest.fn().mockReturnValue([]) };
  const mockHealth = { isHealthy: jest.fn().mockResolvedValue(true) };
  const mockPrompt = { getPrompt: jest.fn().mockResolvedValue({ systemPrompt: 'test', temperature: 0.3, maxTokens: 1024 }) };
  const mockModel = { getModel: jest.fn().mockReturnValue({ modelId: 'gpt-4o-mini', provider: 'openrouter' }) };
  const mockConfig = { get: jest.fn().mockReturnValue({}) };

  beforeEach(async () => {
    mockProvider = {
      complete: jest.fn().mockResolvedValue({ content: 'ai response', usage: { totalTokens: 150 } }),
      stream: jest.fn(),
    };
    mockRegistry.getProvider.mockResolvedValue(mockProvider);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGatewayService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: AiCreditsService, useValue: mockCredits },
        { provide: UsageTrackerService, useValue: mockUsage },
        { provide: CostEngineService, useValue: mockCost },
        { provide: ProviderRegistryService, useValue: mockRegistry },
        { provide: ProviderRouterService, useValue: mockRouter },
        { provide: ProviderHealthService, useValue: mockHealth },
        { provide: PromptManagerService, useValue: mockPrompt },
        { provide: ModelRegistryService, useValue: mockModel },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AiGatewayService>(AiGatewayService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('process', () => {
    it('should throw when credits insufficient', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: false, available: 0, required: 10 });
      await expect(service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1'))
        .rejects.toThrow();
    });

    it('should process with sufficient credits', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      const result = await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(result).toBeDefined();
      expect(mockRegistry.getProvider).toHaveBeenCalled();
    });

    it('should use prompt context when provided', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      mockPrompt.getPrompt.mockResolvedValue({ systemPrompt: 'You are a helpful assistant', temperature: 0.5, maxTokens: 2048 });
      const result = await service.process({
        taskType: 'SEARCH_ANALYSIS' as any,
        payload: { action: 'test', query: 'find products' },
        promptContext: { userQuery: 'find products' },
      }, 'company-1', 'user-1');
      expect(result).toBeDefined();
    });

    it('should fallback to alternative providers on failure', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      const failingProvider = { complete: jest.fn().mockRejectedValue(new Error('Provider error')) };
      const fallbackProvider = { complete: jest.fn().mockResolvedValue({ content: 'fallback response', usage: { totalTokens: 50 } }) };
      mockRegistry.getProvider
        .mockResolvedValueOnce(failingProvider)
        .mockResolvedValueOnce(fallbackProvider);
      mockRouter.getFallbackProviders.mockReturnValue(['gemini', 'groq']);

      const result = await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(result).toBeDefined();
      expect(mockRouter.getFallbackProviders).toHaveBeenCalled();
    });

    it('should handle provider timeout gracefully', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      mockProvider.complete.mockRejectedValue(new Error('Timeout exceeded'));
      await expect(service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1'))
        .rejects.toThrow();
    });

    it('should deduct credits after successful processing', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(mockCredits.deductCredits).toHaveBeenCalled();
    });

    it('should track usage after processing', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(mockUsage.track).toHaveBeenCalled();
    });

    it('should calculate cost for the request', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(mockCost.calculate).toHaveBeenCalled();
    });

    it('should check provider health before routing', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      mockHealth.isHealthy.mockResolvedValue(true);
      await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(mockHealth.isHealthy).toHaveBeenCalled();
    });

    it('should return cached response when available', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      const cachedResponse = { content: 'cached response', cached: true, usage: { totalTokens: 0 } };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedResponse));
      const result = await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(result).toBeDefined();
      expect(mockRedis.get).toHaveBeenCalled();
    });
  });
});
