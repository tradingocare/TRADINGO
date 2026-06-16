import { Test, TestingModule } from '@nestjs/testing';
import { CategoryTemplatesService } from '../category-templates.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoryTemplatesService', () => {
  let service: CategoryTemplatesService;
  let prisma: any;

  const mockPrisma = {
    category: { findUnique: jest.fn() },
    categoryTemplate: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn(), updateMany: jest.fn() },
    templateSection: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    templateField: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    productAttribute: { createMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryTemplatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoryTemplatesService>(CategoryTemplatesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw if category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.create({ categoryId: 'bad', name: 'Test' } as any, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should create template with version 1 if none exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.categoryTemplate.create.mockResolvedValue({ id: 't1', name: 'Test', version: 1, sections: [] });

      const result = await service.create({ categoryId: 'c1', name: 'Test' } as any, 'u1');

      expect(mockPrisma.categoryTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ version: 1 }) })
      );
    });

    it('should increment version if active template exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue({ version: 3 });
      mockPrisma.categoryTemplate.create.mockResolvedValue({ id: 't1', name: 'Test', version: 4, sections: [] });

      const result = await service.create({ categoryId: 'c1', name: 'Test' } as any, 'u1');

      expect(mockPrisma.categoryTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ version: 4 }) })
      );
    });
  });

  describe('findAll', () => {
    it('should return templates with category info and section count', async () => {
      mockPrisma.categoryTemplate.findMany.mockResolvedValue([{ id: 't1', category: { name: 'Cat' }, _count: { sections: 3 } }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should throw if not found', async () => {
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue(null);
      await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
    });

    it('should return template with sections and fields', async () => {
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue({ id: 't1', sections: [{ isActive: true, fields: [{ isActive: true }] }] });
      const result = await service.findById('t1');
      expect(result.id).toBe('t1');
    });
  });

  describe('update', () => {
    it('should update template name and status', async () => {
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue({ id: 't1' });
      mockPrisma.categoryTemplate.update.mockResolvedValue({ id: 't1', name: 'Updated' });

      const result = await service.update('t1', { name: 'Updated', status: 'ACTIVE' } as any);

      expect(mockPrisma.categoryTemplate.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete template', async () => {
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue({ id: 't1' });
      await service.remove('t1');
      expect(mockPrisma.categoryTemplate.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });
  });

  describe('duplicate', () => {
    it('should duplicate template with incremented version', async () => {
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue({
        id: 't1', categoryId: 'c1', name: 'Original', version: 1,
        sections: [{ sortOrder: 0, fields: [{ sortOrder: 0 }] }],
      });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.categoryTemplate.create.mockResolvedValue({ id: 't2' });
      mockPrisma.templateSection.create.mockResolvedValue({ id: 's1' });
      mockPrisma.templateField.create.mockResolvedValue({ id: 'f1' });
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue({ id: 't2', sections: [] });

      const result = await service.duplicate('t1', 'u1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('should archive other active and set this to active', async () => {
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue({ id: 't1', categoryId: 'c1' });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.categoryTemplate.update.mockResolvedValue({ id: 't1', status: 'ACTIVE' });

      const result = await service.activate('t1');

      expect(mockPrisma.categoryTemplate.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { categoryId: 'c1', status: 'ACTIVE' } })
      );
    });
  });

  describe('getActiveForCategory', () => {
    it('should return active template', async () => {
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue({ id: 't1', status: 'ACTIVE', sections: [] });
      const result = await service.getActiveForCategory('c1') as any;
      expect(result.status).toBe('ACTIVE');
    });

    it('should return null if no active template', async () => {
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(null);
      const result = await service.getActiveForCategory('c1');
      expect(result).toBeNull();
    });
  });

  describe('sections', () => {
    it('should add section', async () => {
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue({ id: 't1' });
      mockPrisma.templateSection.create.mockResolvedValue({ id: 's1', title: 'Test' });

      const result = await service.addSection('t1', { key: 'test', title: 'Test' } as any);

      expect(result.title).toBe('Test');
    });

    it('should update section', async () => {
      mockPrisma.templateSection.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.templateSection.update.mockResolvedValue({ id: 's1', title: 'Updated' });

      const result = await service.updateSection('s1', { title: 'Updated' } as any);

      expect(mockPrisma.templateSection.update).toHaveBeenCalled();
    });

    it('should delete section', async () => {
      mockPrisma.templateSection.findUnique.mockResolvedValue({ id: 's1' });
      await service.removeSection('s1');
      expect(mockPrisma.templateSection.delete).toHaveBeenCalled();
    });
  });

  describe('fields', () => {
    it('should add field', async () => {
      mockPrisma.templateSection.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.templateField.create.mockResolvedValue({ id: 'f1', label: 'Test', key: 'test' });

      const result = await service.addField('s1', { key: 'test', label: 'Test', type: 'TEXT' } as any);

      expect(result.label).toBe('Test');
    });

    it('should update field', async () => {
      mockPrisma.templateField.findUnique.mockResolvedValue({ id: 'f1' });
      mockPrisma.templateField.update.mockResolvedValue({ id: 'f1', label: 'Updated' });

      const result = await service.updateField('f1', { label: 'Updated' } as any);

      expect(result.label).toBe('Updated');
    });

    it('should delete field', async () => {
      mockPrisma.templateField.findUnique.mockResolvedValue({ id: 'f1' });
      await service.removeField('f1');
      expect(mockPrisma.templateField.delete).toHaveBeenCalled();
    });
  });

  describe('exportJson', () => {
    it('should export structured JSON', async () => {
      mockPrisma.categoryTemplate.findUnique.mockResolvedValue({
        id: 't1', name: 'Test', version: 1,
        category: { slug: 'test-cat' },
        sections: [{ key: 'basic', title: 'Basic', fields: [{ key: 'name', label: 'Name', type: 'TEXT' }] }],
      });

      const result = await service.exportJson('t1');

      expect(result.name).toBe('Test');
      expect(result.sections).toHaveLength(1);
    });
  });

  describe('importJson', () => {
    it('should import from JSON', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.categoryTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.categoryTemplate.create.mockResolvedValue({ id: 't1' });
      mockPrisma.templateSection.create.mockResolvedValue({ id: 's1' });
      mockPrisma.templateField.create.mockResolvedValue({ id: 'f1' });

      const result = await service.importJson('c1', 'u1', {
        name: 'Imported',
        sections: [{ key: 'basic', title: 'Basic', fields: [{ key: 'name', label: 'Name', type: 'TEXT' }] }],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
