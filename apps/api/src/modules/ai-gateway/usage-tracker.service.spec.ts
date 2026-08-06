import { Test, TestingModule } from '@nestjs/testing';
import { UsageTrackerService } from './usage-tracker.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskType } from '@prisma/client';

describe('UsageTrackerService', () => {
  let service: UsageTrackerService;
  let prisma: {
    aiUsage: { create: jest.Mock; aggregate: jest.Mock; groupBy: jest.Mock };
  };

  const validParams = {
    companyId: 'company-1',
    userId: 'user-1',
    taskType: TaskType.PRODUCT_DESCRIPTION,
    providerName: 'openrouter',
    modelName: 'gpt-4o-mini',
    promptTokens: 500,
    completionTokens: 200,
    totalTokens: 700,
    latencyMs: 250,
    estimatedCost: 0.001,
    cacheHit: false,
    queueTimeMs: 10,
    success: true,
  };

  beforeEach(async () => {
    prisma = {
      aiUsage: {
        create: jest.fn().mockResolvedValue({ id: 'usage-1' }),
        aggregate: jest.fn().mockResolvedValue({ _count: { id: 10 }, _sum: { totalTokens: 5000, estimatedCost: 0.5 } }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageTrackerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsageTrackerService>(UsageTrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('track', () => {
    it('should persist usage record', async () => {
      await service.track(validParams);
      expect(prisma.aiUsage.create).toHaveBeenCalled();
    });

    it('should not throw when persistence fails', async () => {
      prisma.aiUsage.create.mockRejectedValue(new Error('DB down'));
      await expect(service.track(validParams)).resolves.toBeUndefined();
    });
  });

  describe('getDashboardStats', () => {
    it('should return aggregated statistics', async () => {
      const result = await service.getDashboardStats();
      expect(result).toBeDefined();
    });
  });
});
