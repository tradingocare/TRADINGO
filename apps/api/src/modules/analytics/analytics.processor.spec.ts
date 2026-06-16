import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsProcessor } from './analytics.processor';
import { ClickhouseService } from './clickhouse.service';

describe('AnalyticsProcessor', () => {
  let processor: AnalyticsProcessor;
  let clickhouse: any;

  beforeEach(async () => {
    clickhouse = {
      insert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsProcessor,
        { provide: ClickhouseService, useValue: clickhouse },
      ],
    }).compile();

    processor = module.get<AnalyticsProcessor>(AnalyticsProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should handle flush-batch jobs', async () => {
      const job = {
        name: 'flush-batch',
        data: { table: 'seller_analytics_events', events: [{ company_id: 'c1', event_type: 'TEST' }] },
      } as any;
      await processor.process(job);
      expect(clickhouse.insert).toHaveBeenCalledWith('seller_analytics_events', [{ company_id: 'c1', event_type: 'TEST' }]);
    });

    it('should handle process-dead-letter jobs', async () => {
      clickhouse.insert
        .mockRejectedValueOnce(new Error('still failing'))
        .mockResolvedValueOnce(undefined);

      const job = {
        name: 'process-dead-letter',
        data: {
          events: [
            { table: 'seller_analytics_events', company_id: 'c1', event_type: 'TEST' },
          ],
        },
      } as any;
      await expect(processor.process(job)).resolves.not.toThrow();
      expect(clickhouse.insert).toHaveBeenCalledTimes(2);
    });

    it('should handle retry-failed jobs', async () => {
      const job = {
        name: 'retry-failed',
        data: { table: 'seller_analytics_events', events: [{ company_id: 'c1', event_type: 'TEST' }], attempt: 1 },
      } as any;
      await processor.process(job);
      expect(clickhouse.insert).toHaveBeenCalled();
    });

    it('should warn on unknown job', async () => {
      const job = { name: 'unknown', data: {} } as any;
      await expect(processor.process(job)).resolves.not.toThrow();
    });
  });
});
