import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createMockPrisma } from '../common/test/test-utils';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test') } },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process email notification job', async () => {
      const job = { data: { to: 'test@test.com', subject: 'Test', body: 'Hello' }, id: 'job-1' };
      const result = await processor.process(job as any);
      expect(result).toBeDefined();
    });

    it('should handle missing recipient gracefully', async () => {
      const job = { data: {}, id: 'job-2' };
      const result = await processor.process(job as any);
      expect(result).toBeDefined();
    });
  });
});
