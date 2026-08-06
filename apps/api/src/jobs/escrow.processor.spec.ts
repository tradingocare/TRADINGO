import { Test, TestingModule } from '@nestjs/testing';
import { EscrowProcessor } from './escrow.processor';
import { EscrowService } from '../modules/escrow/escrow.service';
import { QueueNames, EscrowJobTypes } from './queues';

describe('EscrowProcessor', () => {
  let processor: EscrowProcessor;
  let escrowService: { processAutoRelease: jest.Mock };

  beforeEach(async () => {
    escrowService = {
      processAutoRelease: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowProcessor,
        { provide: EscrowService, useValue: escrowService },
      ],
    }).compile();

    processor = module.get<EscrowProcessor>(EscrowProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process escrow auto-release job', async () => {
      const job = { data: { type: EscrowJobTypes.AUTO_RELEASE }, id: 'job-1' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
      expect(escrowService.processAutoRelease).toHaveBeenCalled();
    });

    it('should handle unknown job type gracefully', async () => {
      const job = { data: {}, id: 'job-2' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
      expect(escrowService.processAutoRelease).not.toHaveBeenCalled();
    });
  });
});
