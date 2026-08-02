import { Test, TestingModule } from '@nestjs/testing';
import { AiContextEngineService } from './ai-context-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma } from '../../common/test/test-utils';

describe('AiContextEngineService', () => {
  let service: AiContextEngineService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiContextEngineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AiContextEngineService>(AiContextEngineService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildContext', () => {
    it('should build context for company', async () => {
      prisma.company.findUnique.mockResolvedValue({
        id: 'company-1', name: 'Test Corp', slug: 'test-corp', about: 'A test company',
        createdAt: new Date(), updatedAt: new Date(),
      });
      const result = await service.buildContext('company-1');
      expect(result).toBeDefined();
    });
  });
});
