import { Test, TestingModule } from '@nestjs/testing';
import { AiCreditsService } from './ai-credits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createMockPrisma } from '../../common/test/test-utils';

describe('AiCreditsService', () => {
  let service: AiCreditsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCreditsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test') } },
      ],
    }).compile();

    service = module.get<AiCreditsService>(AiCreditsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkCredits', () => {
    it('should return sufficient when credits available', async () => {
      prisma.aiCreditUsage.findFirst.mockResolvedValue(null);
      const result = await service.checkCredits('company-1', 10);
      expect(result.sufficient).toBe(true);
    });
  });

  describe('getCreditBalance', () => {
    it('should return credit balance', async () => {
      prisma.aiCreditUsage.findFirst.mockResolvedValue(null);
      prisma.membership.findFirst.mockResolvedValue({
        id: 'mem-1', companyId: 'company-1', planId: 'plan-1', planSlug: 'trade_pro',
        status: 'ACTIVE', startDate: new Date(), endDate: new Date(), autoRenew: true,
        createdAt: new Date(), updatedAt: new Date(),
      });
      const result = await service.getCreditBalance('company-1');
      expect(result).toBeDefined();
      expect(typeof result.total).toBe('number');
      expect(typeof result.used).toBe('number');
    });
  });

  describe('getCreditSummary', () => {
    it('should return admin summary', async () => {
      prisma.aiCreditUsage.findMany.mockResolvedValue([]);
      const result = await service.getCreditSummary();
      expect(result).toBeDefined();
    });
  });
});
