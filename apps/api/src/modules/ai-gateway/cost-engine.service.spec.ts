import { Test, TestingModule } from '@nestjs/testing';
import { CostEngineService } from './cost-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CostEngineService', () => {
  let service: CostEngineService;
  let prisma: { aiProvider: { findUnique: jest.Mock }; aiUsage: { aggregate: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      aiProvider: { findUnique: jest.fn().mockResolvedValue(null) },
      aiUsage: { aggregate: jest.fn().mockResolvedValue({ _sum: { estimatedCost: 0.5 }, _count: { id: 3 } }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostEngineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CostEngineService>(CostEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCost', () => {
    it('should calculate cost based on token usage', async () => {
      const cost = await service.calculateCost('openrouter', 'openai/gpt-4o-mini', 500, 200);
      expect(cost.totalCost).toBeGreaterThan(0);
      expect(typeof cost.totalCost).toBe('number');
      expect(cost.currency).toBe('USD');
    });

    it('should return 0 for zero tokens', async () => {
      const cost = await service.calculateCost('openrouter', 'openai/gpt-4o-mini', 0, 0);
      expect(cost.totalCost).toBe(0);
    });
  });

  describe('getCompanySpend', () => {
    it('should return aggregated spend for a company', async () => {
      const result = await service.getCompanySpend('company-1');
      expect(result.totalSpend).toBe(0.5);
      expect(result.totalRequests).toBe(3);
    });
  });
});
