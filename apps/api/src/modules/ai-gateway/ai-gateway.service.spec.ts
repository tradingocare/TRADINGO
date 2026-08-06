import { Test, TestingModule } from '@nestjs/testing';
import { AiGatewayService } from './ai-gateway.service';
import { AiCreditsService } from './ai-credits.service';
import { UsageTrackerService } from './usage-tracker.service';
import { CostEngineService } from './cost-engine.service';
import { ProviderRegistryService } from './provider-registry.service';
import { ProviderRouterService } from './provider-router.service';
import { ProviderHealthService } from './provider-health.service';
import { PromptManagerService } from './prompt-manager.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AiGatewayService', () => {
  let service: AiGatewayService;
  let mockProvider: { complete: jest.Mock; name: string };

  const mockPrisma = {
    aiUsage: { findUnique: jest.fn().mockResolvedValue(null) },
  };
  const mockRedis = { get: jest.fn().mockResolvedValue(undefined), set: jest.fn(), del: jest.fn() };
  const mockCredits = { checkCredits: jest.fn(), deductCredits: jest.fn().mockResolvedValue(undefined) };
  const mockUsage = { track: jest.fn().mockResolvedValue(undefined) };
  const mockCost = { calculateCost: jest.fn().mockResolvedValue({ totalCost: 0.001, currency: 'USD' }) };
  const mockRegistry = { getProviderInstance: jest.fn(), getProvider: jest.fn(), getBestProviderForTask: jest.fn() };
  const mockRouter = {
    route: jest.fn().mockResolvedValue({ provider: { name: 'openrouter', complete: jest.fn() }, providerConfig: { id: 'cfg-1' }, model: 'openai/gpt-4o-mini' }),
    getFallbackProviders: jest.fn().mockReturnValue([]),
  };
  const mockHealth = {
    isCircuitOpen: jest.fn().mockResolvedValue(false),
    recordSuccess: jest.fn().mockResolvedValue(undefined),
    recordFailure: jest.fn().mockResolvedValue(undefined),
  };
  const mockPrompt = {
    getPrompt: jest.fn().mockResolvedValue({ version: 1, systemPrompt: 'test', userPrompt: '', temperature: 0.3, maxTokens: 1024 }),
    renderPrompt: jest.fn((p: any, vars: any) => ({
      systemPrompt: p.systemPrompt,
      userPrompt: JSON.stringify(vars),
    })),
  };
  const mockConfig = { get: jest.fn().mockReturnValue('true') };
  const mockAuditLog = { log: jest.fn() };
  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    mockProvider = {
      name: 'openrouter',
      complete: jest.fn().mockResolvedValue({
        content: 'ai response',
        model: 'openai/gpt-4o-mini',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      }),
    };
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(undefined);
    mockRouter.getFallbackProviders.mockReturnValue([]);
    mockRouter.route.mockResolvedValue({
      provider: mockProvider,
      providerConfig: { id: 'cfg-1' },
      model: 'openai/gpt-4o-mini',
    });

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
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AiGatewayService>(AiGatewayService);
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(undefined);
    mockRouter.getFallbackProviders.mockReturnValue([]);
    mockRouter.route.mockResolvedValue({
      provider: mockProvider,
      providerConfig: { id: 'cfg-1' },
      model: 'openai/gpt-4o-mini',
    });
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
      expect(result.success).toBe(true);
      expect(mockRouter.route).toHaveBeenCalled();
    });

    it('should fallback to alternative providers on failure', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      const fallbackProvider = {
        name: 'gemini',
        complete: jest.fn().mockResolvedValue({ content: 'fallback response', model: 'gemini-2.0-flash', usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 } }),
      };
      mockProvider.complete.mockRejectedValue(new Error('Provider error'));
      mockRouter.getFallbackProviders.mockReturnValue([
        { provider: fallbackProvider, providerConfig: { id: 'cfg-2' }, model: 'gemini-2.0-flash' },
      ]);

      const result = await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(result).toBeDefined();
      expect(result.content).toBe('fallback response');
      expect(result.model).toBe('gemini-2.0-flash');
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
      expect(mockCost.calculateCost).toHaveBeenCalledWith('openrouter', 'openai/gpt-4o-mini', 100, 50);
    });

    it('should check provider health before routing', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(mockHealth.isCircuitOpen).toHaveBeenCalledWith('openrouter');
    });

    it('should return cached response when available', async () => {
      mockCredits.checkCredits.mockResolvedValue({ sufficient: true, available: 50, required: 10 });
      const cachedResponse = { success: true, content: 'cached response', cached: true, provider: 'openrouter' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedResponse));
      const result = await service.process({ taskType: 'SEARCH_ANALYSIS' as any, payload: { action: 'test' } }, 'company-1', 'user-1');
      expect(result).toBeDefined();
      expect(result.cached).toBe(true);
      expect(mockRedis.get).toHaveBeenCalled();
    });

    it('should throw when taskType missing', async () => {
      await expect(service.process({ payload: { action: 'test' } } as any, 'company-1')).rejects.toThrow('taskType is required');
    });
  });
});