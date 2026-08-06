import { Test, TestingModule } from '@nestjs/testing';
import { ProviderHealthService } from './provider-health.service';
import { ProviderRegistryService } from './provider-registry.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProviderHealthService', () => {
  let service: ProviderHealthService;
  let prisma: {
    aiProvider: {
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let registry: { getActiveProviders: jest.Mock };

  beforeEach(async () => {
    prisma = {
      aiProvider: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    registry = {
      getActiveProviders: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderHealthService,
        { provide: ProviderRegistryService, useValue: registry },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProviderHealthService>(ProviderHealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordSuccess', () => {
    it('should reset failure counters', async () => {
      await service.recordSuccess('openrouter');
      expect(prisma.aiProvider.update).toHaveBeenCalledWith({
        where: { name: 'openrouter' },
        data: expect.objectContaining({ failureCount: 0, circuitOpen: false }),
      });
    });
  });

  describe('recordFailure', () => {
    it('should increment failure count', async () => {
      prisma.aiProvider.findUnique.mockResolvedValue({ failureCount: 1 });
      await service.recordFailure('openrouter');
      expect(prisma.aiProvider.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'openrouter' } }),
      );
    });

    it('should no-op when provider not found', async () => {
      await service.recordFailure('missing');
      expect(prisma.aiProvider.update).not.toHaveBeenCalled();
    });
  });

  describe('getProviderHealthDashboard', () => {
    it('should return providers list', async () => {
      const result = await service.getProviderHealthDashboard();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});