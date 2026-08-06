import { Test, TestingModule } from '@nestjs/testing';
import { AiCreditsService } from './ai-credits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskType } from '@prisma/client';

describe('AiCreditsService', () => {
  let service: AiCreditsService;
  let prisma: {
    aiCreditUsage: { findFirst: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; upsert: jest.Mock };
    planFeature: { findFirst: jest.Mock };
    membershipPlan: { findFirst: jest.Mock; findUnique: jest.Mock };
    company: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      aiCreditUsage: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'usage-1' }),
        update: jest.fn().mockResolvedValue({}),
        upsert: jest.fn().mockResolvedValue({}),
      },
      planFeature: { findFirst: jest.fn().mockResolvedValue({ value: '100' }) },
      membershipPlan: {
        findFirst: jest.fn().mockResolvedValue({ planId: 'free-plan' }),
        findUnique: jest.fn().mockResolvedValue({ planId: 'plan-1', name: 'Trade Smart' }),
      },
      company: { findUnique: jest.fn().mockResolvedValue({ planId: 'plan-1', subscriptionPlan: 'plan-1', subscriptionStatus: 'ACTIVE', name: 'Test Co' }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCreditsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AiCreditsService>(AiCreditsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCreditCost', () => {
    it('should return credit cost for known task types', () => {
      expect(service.getCreditCost(TaskType.PRODUCT_DESCRIPTION)).toBeGreaterThan(0);
      expect(service.getCreditCost(TaskType.ADMIN_INTELLIGENCE)).toBeGreaterThan(0);
    });

    it('should return default cost for unknown task type', () => {
      expect(service.getCreditCost('UNKNOWN_TYPE' as TaskType)).toBe(5);
    });
  });

  describe('getCreditBalance', () => {
    it('should return balance for a company', async () => {
      const result = await service.getCreditBalance('company-1');
      expect(result.total).toBe(100);
      expect(result.used).toBe(0);
      expect(result.remaining).toBe(100);
      expect(result.planName).toBeDefined();
    });
  });

  describe('checkCredits', () => {
    it('should indicate sufficient credits', async () => {
      const result = await service.checkCredits('company-1', TaskType.PRODUCT_DESCRIPTION);
      expect(result.sufficient).toBe(true);
    });

    it('should indicate insufficient credits', async () => {
      prisma.planFeature.findFirst.mockResolvedValue({ value: '1' });
      prisma.aiCreditUsage.findUnique.mockResolvedValue({ used: 1 });
      const result = await service.checkCredits('company-1', TaskType.PRODUCT_DESCRIPTION);
      expect(result.sufficient).toBe(false);
    });
  });
});