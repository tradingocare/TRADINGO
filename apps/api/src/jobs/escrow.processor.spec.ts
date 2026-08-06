import { Test, TestingModule } from '@nestjs/testing';
import { EscrowProcessor } from './escrow.processor';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma } from '../common/test/test-utils';

describe('EscrowProcessor', () => {
  let processor: EscrowProcessor;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowProcessor,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    processor = module.get<EscrowProcessor>(EscrowProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process escrow release job', async () => {
      const job = { data: { escrowId: 'escrow-1', action: 'release' }, id: 'job-1' };
      const result = await processor.process(job as any);
      expect(result).toBeDefined();
    });

    it('should handle missing escrow gracefully', async () => {
      const job = { data: {}, id: 'job-2' };
      const result = await processor.process(job as any);
      expect(result).toBeDefined();
    });
  });
});
