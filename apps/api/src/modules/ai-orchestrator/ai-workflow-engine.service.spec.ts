import { Test, TestingModule } from '@nestjs/testing';
import { AiWorkflowEngine } from './ai-workflow-engine.service';
import { AiOrchestratorService } from './ai-orchestrator.service';

describe('AiWorkflowEngine', () => {
  let service: AiWorkflowEngine;
  let orchestrator: { dispatch: jest.Mock };

  beforeEach(async () => {
    orchestrator = {
      dispatch: jest.fn().mockResolvedValue({
        success: true,
        actionId: 'product.generate-description',
        actionName: 'Generate Description',
        actionDescription: 'desc',
        result: { description: 'A great product' },
        latencyMs: 100,
        credits: null,
        cached: false,
        fromMemory: false,
        fromCache: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiWorkflowEngine,
        { provide: AiOrchestratorService, useValue: orchestrator },
      ],
    }).compile();

    service = module.get<AiWorkflowEngine>(AiWorkflowEngine);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listWorkflows', () => {
    it('should return all workflows', () => {
      const workflows = service.listWorkflows();
      expect(workflows.length).toBe(4);
      expect(workflows.map(w => w.id)).toContain('product-launch-optimization');
    });
  });

  describe('getWorkflow', () => {
    it('should return a workflow by id', () => {
      expect(service.getWorkflow('seller-growth-review')?.name).toBe('Seller Growth Review');
    });

    it('should return undefined for unknown workflow', () => {
      expect(service.getWorkflow('nope')).toBeUndefined();
    });
  });

  describe('execute', () => {
    it('should throw for unknown workflow', async () => {
      await expect(service.execute({ workflowId: 'nope', companyId: 'company-1' } as any)).rejects.toThrow('not found');
    });

    it('should execute all steps of a workflow', async () => {
      const result = await service.execute({
        workflowId: 'product-launch-optimization',
        companyId: 'company-1',
        userId: 'user-1',
        context: { productId: 'product-1' },
      });
      expect(result.success).toBe(true);
      expect(result.workflowId).toBe('product-launch-optimization');
      expect(result.stepsCompleted).toBe(result.totalSteps);
      expect(result.totalSteps).toBe(7);
      expect(orchestrator.dispatch).toHaveBeenCalledTimes(7);
    });

    it('should stop at first failing step', async () => {
      orchestrator.dispatch.mockResolvedValueOnce({
        success: true,
        actionId: 'product.generate-description',
        actionName: 'a',
        actionDescription: 'd',
        result: {},
        latencyMs: 10,
        credits: null,
        cached: false,
        fromMemory: false,
        fromCache: false,
      });
      orchestrator.dispatch.mockRejectedValueOnce(new Error('gateway down'));
      const result = await service.execute({
        workflowId: 'product-launch-optimization',
        companyId: 'company-1',
        context: { productId: 'product-1' },
      });
      expect(result.success).toBe(false);
      expect(result.stepsCompleted).toBeLessThan(result.totalSteps);
    });
  });
});