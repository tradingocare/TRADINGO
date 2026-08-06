import { Test, TestingModule } from '@nestjs/testing';
import { SettlementProcessor } from './settlement.processor';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma } from '../common/test/test-utils';

describe('SettlementProcessor', () => {
  let processor: SettlementProcessor;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementProcessor,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    processor = module.get<SettlementProcessor>(SettlementProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process settlement job', async () => {
      const job = { data: { settlementId: 'settle-1' }, id: 'job-1' };
      const result = await processor.process(job as any);
      expect(result).toBeDefined();
    });

    it('should handle missing settlement data', async () => {
      const job = { data: {}, id: 'job-2' };
      const result = await processor.process(job as any);
      expect(result).toBeDefined();
    });
  });
});
