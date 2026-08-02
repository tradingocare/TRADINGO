import { Test, TestingModule } from '@nestjs/testing';
import { PromptManagerService } from './prompt-manager.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma } from '../../common/test/test-utils';

describe('PromptManagerService', () => {
  let service: PromptManagerService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptManagerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PromptManagerService>(PromptManagerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPrompt', () => {
    it('should return prompt template', async () => {
      prisma.aiPrompt.findUnique.mockResolvedValue({
        id: 'prompt-1', taskType: 'PRODUCT_DESCRIPTION', systemPrompt: 'You are a helpful assistant',
        userTemplate: 'Write a description for {product}', temperature: 0.3, maxTokens: 2048,
        isActive: true, version: 1, createdAt: new Date(), updatedAt: new Date(),
      });
      const result = await service.getPrompt('PRODUCT_DESCRIPTION');
      expect(result).toBeDefined();
      expect(result.taskType).toBe('PRODUCT_DESCRIPTION');
    });

    it('should fallback to default when prompt not found', async () => {
      prisma.aiPrompt.findUnique.mockResolvedValue(null);
      const result = await service.getPrompt('UNKNOWN_TYPE');
      expect(result).toBeDefined();
    });
  });

  describe('createPrompt', () => {
    it('should create a new prompt', async () => {
      prisma.aiPrompt.create.mockResolvedValue({
        id: 'prompt-2', taskType: 'PRODUCT_DESCRIPTION', systemPrompt: 'You are helpful',
        userTemplate: 'Generate for {product}', temperature: 0.5, maxTokens: 4096,
        isActive: true, version: 1, createdAt: new Date(), updatedAt: new Date(),
      });
      const dto = { taskType: 'PRODUCT_DESCRIPTION', systemPrompt: 'You are helpful', userTemplate: 'Generate for {product}', temperature: 0.5, maxTokens: 4096 };
      const result = await service.createPrompt(dto as any);
      expect(result).toBeDefined();
    });
  });
});
