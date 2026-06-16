import { Test, TestingModule } from '@nestjs/testing';
import { BestsellerProcessor } from '../bestseller.processor';
import { BestsellerService } from '../../modules/products/bestseller.service';
import { BestsellerJobTypes } from '../queues';

describe('BestsellerProcessor', () => {
  let processor: BestsellerProcessor;
  let bestsellerService: Record<string, jest.Mock>;

  beforeEach(async () => {
    bestsellerService = {
      calculateWeeklySnapshots: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BestsellerProcessor,
        { provide: BestsellerService, useValue: bestsellerService },
      ],
    }).compile();

    processor = module.get<BestsellerProcessor>(BestsellerProcessor);
  });

  it('should process CALCULATE_WEEKLY job type', async () => {
    const job = { data: { type: BestsellerJobTypes.CALCULATE_WEEKLY } } as any;
    await processor.process(job);
    expect(bestsellerService.calculateWeeklySnapshots).toHaveBeenCalled();
  });

  it('should log warning for unknown job types', async () => {
    const job = { data: { type: 'UNKNOWN' } } as any;
    await processor.process(job);
    expect(bestsellerService.calculateWeeklySnapshots).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    bestsellerService.calculateWeeklySnapshots.mockRejectedValue(new Error('DB error'));
    const job = { data: { type: BestsellerJobTypes.CALCULATE_WEEKLY } } as any;
    await expect(processor.process(job)).rejects.toThrow('DB error');
  });
});
