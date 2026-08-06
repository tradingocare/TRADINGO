import { Test, TestingModule } from '@nestjs/testing';
import { RfqProcessor } from './rfq.processor';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../modules/notification/notification.service';
import { NotificationType } from '@prisma/client';

const mockDate = new Date('2026-06-13T12:00:00Z');

describe('RfqProcessor', () => {
  let processor: RfqProcessor;
  let prisma: any;
  let notificationService: { createWithTemplate: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers({ advanceTimers: false });
    jest.setSystemTime(mockDate);

    prisma = {
      quote: { updateMany: jest.fn(), findMany: jest.fn() },
      quoteEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    notificationService = { createWithTemplate: jest.fn().mockResolvedValue({ id: 'notif-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfqProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    processor = module.get<RfqProcessor>(RfqProcessor);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('expireQuotes', () => {
    it('should expire overdue quotes and track events', async () => {
      prisma.quote.updateMany.mockResolvedValue({ count: 2 });
      prisma.quote.findMany.mockResolvedValue([
        { id: 'q1', companyId: 'v1', rfqId: 'rfq-1' },
        { id: 'q2', companyId: 'v2', rfqId: 'rfq-2' },
      ]);

      const job = { data: { type: 'EXPIRE_QUOTES' } } as any;
      await processor.process(job);

      expect(prisma.quote.updateMany).toHaveBeenCalledWith({
        where: { validityDate: { lte: mockDate }, status: { in: ['SUBMITTED', 'VIEWED'] } },
        data: { status: 'EXPIRED' },
      });
      expect(prisma.quoteEvent.create).toHaveBeenCalledTimes(2);
      expect(prisma.quoteEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'QUOTE_EXPIRED' }) }),
      );
    });

    it('should skip event tracking when no quotes expired', async () => {
      prisma.quote.updateMany.mockResolvedValue({ count: 0 });

      const job = { data: { type: 'EXPIRE_QUOTES' } } as any;
      await processor.process(job);

      expect(prisma.quoteEvent.create).not.toHaveBeenCalled();
    });
  });
});
