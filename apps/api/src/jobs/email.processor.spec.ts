import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createMockPrisma } from '../common/test/test-utils';
import { QueueNames, EmailJobTypes } from './queues';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let prisma: ReturnType<typeof createMockPrisma>;
  let config: { get: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrisma();
    config = { get: jest.fn().mockReturnValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should skip email delivery when SES is not configured', async () => {
      const job = { data: { to: 'test@test.com', subject: 'Test', body: 'Hello', type: EmailJobTypes.SEND_NOTIFICATION }, id: 'job-1' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
    });

    it('should handle missing recipient gracefully', async () => {
      const job = { data: {}, id: 'job-2' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
    });
  });
});
