import { Test, TestingModule } from '@nestjs/testing';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { AiActionRegistry } from './ai-action-registry';
import { AiMemoryService } from './ai-memory.service';
import { AiContextEngine } from './ai-context-engine.service';
import { AiObservabilityService } from './ai-observability.service';
import { AiCreditsService } from '../ai-gateway/ai-credits.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ModuleRef } from '@nestjs/core';

describe('AiOrchestratorService', () => {
  let service: AiOrchestratorService;
  let registry: { getAll: jest.Mock; getById: jest.Mock };

  beforeEach(async () => {
    registry = {
      getAll: jest.fn().mockReturnValue([]),
      getById: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiOrchestratorService,
        { provide: AiActionRegistry, useValue: registry },
        { provide: ModuleRef, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        { provide: AiMemoryService, useValue: { get: jest.fn().mockReturnValue(undefined), set: jest.fn() } },
        { provide: AiContextEngine, useValue: { getAggregatedContext: jest.fn().mockResolvedValue({}) } },
        { provide: AiObservabilityService, useValue: { record: jest.fn() } },
        { provide: AiCreditsService, useValue: { checkCredits: jest.fn().mockResolvedValue({ sufficient: true, available: 100, required: 5 }), deductCredits: jest.fn().mockResolvedValue(undefined) } },
        { provide: AiGatewayService, useValue: { process: jest.fn().mockResolvedValue({ data: 'ok' }) } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<AiOrchestratorService>(AiOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableActions', () => {
    it('should return empty when no services resolved', () => {
      expect(service.getAvailableActions()).toEqual([]);
    });
  });

  describe('dispatch', () => {
    it('should throw when action not found in registry', async () => {
      await expect(
        service.dispatch({ actionId: 'nonexistent', companyId: 'company-1', payload: {} }),
      ).rejects.toThrow(`Action 'nonexistent' not found in registry`);
    });

    it('should throw when service not resolved', async () => {
      registry.getById.mockReturnValue({ id: 'action-1', name: 'Action 1', service: 'product', method: 'generateDescription', credits: 5, taskType: 'PRODUCT_DESCRIPTION', description: 'd', category: 'product' });
      await expect(
        service.dispatch({ actionId: 'action-1', companyId: 'company-1', payload: {} }),
      ).rejects.toThrow('is not available');
    });
  });

  describe('isActionAvailable', () => {
    it('should return false for unknown action', () => {
      expect(service.isActionAvailable('nope')).toBe(false);
    });
  });
});