import { Test, TestingModule } from '@nestjs/testing';
import { DisputeProcessor } from './dispute.processor';
import { DisputeService } from '../modules/dispute/dispute.service';

describe('DisputeProcessor', () => {
  let processor: DisputeProcessor;
  let disputeService: jest.Mocked<DisputeService>;

  beforeEach(async () => {
    disputeService = {
      processExpiredDisputes: jest.fn(),
      adminArbitration: jest.fn(),
      handleArbitrationSlaBreach: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeProcessor,
        { provide: DisputeService, useValue: disputeService },
      ],
    }).compile();

    processor = module.get<DisputeProcessor>(DisputeProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should route EXPIRE_DISPUTES to processExpiredDisputes', async () => {
      const job = { data: { type: 'EXPIRE_DISPUTES' }, id: '1' } as any;
      await processor.process(job);
      expect(disputeService.processExpiredDisputes).toHaveBeenCalled();
    });

    it('should route ADMIN_ARBITRATION to adminArbitration', async () => {
      const job = { data: { type: 'ADMIN_ARBITRATION', disputeId: 'd1' }, id: '2' } as any;
      await processor.process(job);
      expect(disputeService.adminArbitration).toHaveBeenCalledWith('d1', '2');
    });

    it('should route ARBITRATION_SLA_BREACH to handleArbitrationSlaBreach', async () => {
      const job = { data: { type: 'ARBITRATION_SLA_BREACH', disputeId: 'd1' }, id: '3' } as any;
      await processor.process(job);
      expect(disputeService.handleArbitrationSlaBreach).toHaveBeenCalledWith('d1');
    });

    it('should not fail on unknown type', async () => {
      const job = { data: { type: 'UNKNOWN' }, id: '4' } as any;
      await expect(processor.process(job)).resolves.not.toThrow();
    });
  });
});
