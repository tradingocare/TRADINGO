import { Test, TestingModule } from '@nestjs/testing';
import { AiContextEngine } from './ai-context-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AiContextEngine', () => {
  let service: AiContextEngine;
  let prisma: {
    company: { findUnique: jest.Mock };
    product: { findUnique: jest.Mock; count: jest.Mock };
    user: { findUnique: jest.Mock };
    catalogQualityScore: { aggregate: jest.Mock };
    companyIndustry: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      company: {
        findUnique: jest.fn().mockResolvedValue({ id: 'company-1', name: 'Test Co', verificationLevel: 'VERIFIED', trustScore: 80 }),
      },
      product: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(5),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Test User', role: 'BUYER' }) },
      catalogQualityScore: { aggregate: jest.fn().mockResolvedValue({ _avg: { total: 75 } }) },
      companyIndustry: { findMany: jest.fn().mockResolvedValue([{ industry: { id: 'ind-1', name: 'Textiles' } }]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiContextEngine,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AiContextEngine>(AiContextEngine);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAggregatedContext', () => {
    it('should fetch company context when requested', async () => {
      const result = await service.getAggregatedContext({ companyId: 'company-1', include: ['company'] });
      expect(result.company).toBeDefined();
      expect((result.company as any).name).toBe('Test Co');
    });

    it('should fetch user context when requested with userId', async () => {
      const result = await service.getAggregatedContext({ companyId: 'company-1', userId: 'user-1', include: ['company', 'user'] });
      expect(result.user).toBeDefined();
    });

    it('should not include contexts not requested', async () => {
      const result = await service.getAggregatedContext({ companyId: 'company-1', include: [] });
      expect(result.company).toBeUndefined();
      expect(result.product).toBeUndefined();
    });

    it('should degrade gracefully when company lookup fails', async () => {
      prisma.company.findUnique.mockRejectedValue(new Error('DB down'));
      const result = await service.getAggregatedContext({ companyId: 'company-1', include: ['company'] });
      expect(result.company).toEqual({});
    });
  });
});