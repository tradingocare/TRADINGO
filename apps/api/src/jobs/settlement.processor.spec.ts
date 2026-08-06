import { Test, TestingModule } from '@nestjs/testing';
import { SettlementProcessor } from './settlement.processor';
import { SettlementService } from '../modules/settlement/settlement.service';
import { QueueNames, SettlementJobTypes } from './queues';

describe('SettlementProcessor', () => {
  let processor: SettlementProcessor;
  let settlementService: { processSettlements: jest.Mock; processRetries: jest.Mock };

  beforeEach(async () => {
    settlementService = {
      processSettlements: jest.fn().mockResolvedValue(undefined),
      processRetries: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementProcessor,
        { provide: SettlementService, useValue: settlementService },
      ],
    }).compile();

    processor = module.get<SettlementProcessor>(SettlementProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process settlements job', async () => {
      const job = { data: { type: SettlementJobTypes.PROCESS_SETTLEMENTS }, id: 'job-1' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
      expect(settlementService.processSettlements).toHaveBeenCalled();
    });

    it('should process retries job', async () => {
      const job = { data: { type: SettlementJobTypes.PROCESS_RETRIES }, id: 'job-2' };
      await processor.process(job as any);
      expect(settlementService.processRetries).toHaveBeenCalled();
    });

    it('should handle missing settlement data gracefully', async () => {
      const job = { data: {}, id: 'job-3' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
      expect(settlementService.processSettlements).not.toHaveBeenCalled();
    });
  });
});
