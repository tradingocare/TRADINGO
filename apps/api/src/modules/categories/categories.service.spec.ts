import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const mockCategory = {
    id: 'cat-1', parentId: null, name: 'Electronics', slug: 'electronics',
    description: null, icon: null, image: null, seoTitle: null, seoDescription: null,
    isActive: true, sortOrder: 0, deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a category with generated slug', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue({ ...mockCategory, parent: null });

      const result = await service.create({ name: 'Electronics' }, 'user-1');
      expect(result.name).toBe('Electronics');
      expect(result.slug).toBe('electronics');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CATEGORY_CREATED' }) }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.create({ name: 'Electronics', slug: 'existing-slug' }, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parent category not found', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(null);
      prisma.category.findUnique.mockResolvedValueOnce(null);
      await expect(service.create({ name: 'Mobile', parentId: 'nonexistent' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      prisma.category.findMany.mockResolvedValue([mockCategory]);
      prisma.category.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search', async () => {
      prisma.category.findMany.mockResolvedValue([mockCategory]);
      prisma.category.count.mockResolvedValue(1);

      await service.findAll({ search: 'Electro' });
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Electro', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return category', async () => {
      prisma.category.findUnique.mockResolvedValue({ ...mockCategory, parent: null, children: [], _count: { children: 0, products: 0 } });
      const result = await service.findById('cat-1');
      expect(result.id).toBe('cat-1');
    });

    it('should throw NotFoundException', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return category', async () => {
      prisma.category.findUnique.mockResolvedValue({ ...mockCategory, parent: null, children: [], _count: { children: 0, products: 0 } });
      const result = await service.findBySlug('electronics');
      expect(result.id).toBe('cat-1');
    });

    it('should throw NotFoundException', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTree', () => {
    it('should build tree structure', async () => {
      const parent = { ...mockCategory, id: 'cat-1', name: 'Electronics', parentId: null, _count: { children: 1, products: 0 } };
      const child = { ...mockCategory, id: 'cat-2', name: 'Mobile', parentId: 'cat-1', _count: { children: 0, products: 0 } };
      prisma.category.findMany.mockResolvedValue([parent, child]);

      const tree = await service.getTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Electronics');
      expect((tree[0].children as Array<Record<string, unknown>>)).toHaveLength(1);
      expect((tree[0].children as Array<Record<string, unknown>>)[0].name).toBe('Mobile');
    });
  });

  describe('getBreadcrumbs', () => {
    it('should return breadcrumbs from root to category', async () => {
      const root = { id: 'cat-1', name: 'Electronics', slug: 'electronics', parentId: null };
      const child = { id: 'cat-2', name: 'Mobile', slug: 'mobile', parentId: 'cat-1' };
      prisma.category.findUnique
        .mockResolvedValueOnce(child)
        .mockResolvedValueOnce(root);

      const crumbs = await service.getBreadcrumbs('mobile');
      expect(crumbs).toHaveLength(2);
      expect(crumbs[0].slug).toBe('electronics');
      expect(crumbs[1].slug).toBe('mobile');
    });

    it('should throw NotFoundException', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.getBreadcrumbs('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.category.update.mockResolvedValue({ ...mockCategory, name: 'Updated' });

      const result = await service.update('cat-1', { name: 'Updated' }, 'user-1');
      expect(result.name).toBe('Updated');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if setting self as parent', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      await expect(service.update('cat-1', { parentId: 'cat-1' }, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', { name: 'Updated' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete category', async () => {
      prisma.category.findUnique.mockResolvedValue({ ...mockCategory, _count: { children: 0, products: 0 } });
      await service.remove('cat-1', 'user-1');
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if has children', async () => {
      prisma.category.findUnique.mockResolvedValue({ ...mockCategory, _count: { children: 2, products: 0 } });
      await expect(service.remove('cat-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if has products', async () => {
      prisma.category.findUnique.mockResolvedValue({ ...mockCategory, _count: { children: 0, products: 3 } });
      await expect(service.remove('cat-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
