import { Test, TestingModule } from '@nestjs/testing';
import { AiOrchestratorService } from './ai-orchestrator.service';

describe('AiOrchestratorService', () => {
  let service: AiOrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiOrchestratorService],
    }).compile();

    service = module.get<AiOrchestratorService>(AiOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatch', () => {
    it('should dispatch AI action', async () => {
      const payload = { action: 'generate-description', data: { productName: 'Test' } };
      const result = await service.dispatch(payload);
      expect(result).toBeDefined();
    });
  });
});
