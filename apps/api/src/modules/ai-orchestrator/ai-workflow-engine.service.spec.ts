import { Test, TestingModule } from '@nestjs/testing';
import { AiWorkflowEngineService } from './ai-workflow-engine.service';

describe('AiWorkflowEngineService', () => {
  let service: AiWorkflowEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiWorkflowEngineService],
    }).compile();

    service = module.get<AiWorkflowEngineService>(AiWorkflowEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeWorkflow', () => {
    it('should execute a multi-step workflow', async () => {
      const workflow = {
        id: 'wf-1',
        steps: [
          { action: 'generate', params: { task: 'write' } },
          { action: 'review', params: {} },
        ],
      };
      const result = await service.executeWorkflow(workflow as any);
      expect(result).toBeDefined();
    });
  });
});
