import { Test, TestingModule } from '@nestjs/testing';
import { PromptManagerService } from './prompt-manager.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskType } from '@prisma/client';

describe('PromptManagerService', () => {
  let service: PromptManagerService;
  let prisma: {
    aiPrompt: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const prompt = { id: 'prompt-1', taskType: TaskType.PRODUCT_DESCRIPTION, version: 1, name: 'Product Description', isActive: true };

  beforeEach(async () => {
    prisma = {
      aiPrompt: {
        findFirst: jest.fn().mockResolvedValue(prompt),
        findMany: jest.fn().mockResolvedValue([prompt]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(prompt),
        findUnique: jest.fn().mockResolvedValue(prompt),
        update: jest.fn().mockResolvedValue(prompt),
        delete: jest.fn().mockResolvedValue(prompt),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptManagerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PromptManagerService>(PromptManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPrompt', () => {
    it('should return active prompt for task', async () => {
      const result = await service.getPrompt(TaskType.PRODUCT_DESCRIPTION);
      expect(result.taskType).toBe(TaskType.PRODUCT_DESCRIPTION);
      expect(prisma.aiPrompt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { taskType: TaskType.PRODUCT_DESCRIPTION, isActive: true } }),
      );
    });

    it('should throw when no prompt found', async () => {
      prisma.aiPrompt.findFirst.mockResolvedValue(null);
      await expect(service.getPrompt(TaskType.OCR)).rejects.toThrow('No active prompt found');
    });
  });

  describe('listPrompts', () => {
    it('should return paginated prompts', async () => {
      const result = await service.listPrompts(1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('createPrompt', () => {
    it('should version new prompt incrementally', async () => {
      prisma.aiPrompt.findFirst.mockResolvedValue({ version: 3 });
      await service.createPrompt({ taskType: TaskType.PRODUCT_DESCRIPTION, name: 'New', systemPrompt: 'x', userPrompt: 'y' });
      expect(prisma.aiPrompt.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ version: 4 }) }));
    });
  });

  describe('updatePrompt', () => {
    it('should update an existing prompt', async () => {
      await service.updatePrompt('prompt-1', { name: 'Renamed' });
      expect(prisma.aiPrompt.update).toHaveBeenCalledWith({ where: { id: 'prompt-1' }, data: { name: 'Renamed' } });
    });

    it('should throw when prompt missing', async () => {
      prisma.aiPrompt.findUnique.mockResolvedValue(null);
      await expect(service.updatePrompt('nope', { name: 'x' })).rejects.toThrow('Prompt not found');
    });
  });
});