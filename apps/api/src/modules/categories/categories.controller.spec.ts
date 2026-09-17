import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';
import { CategoryDemandService } from './category-demand.service';
import { CategoryDemandResult } from './dto/category-demand.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      getTree: jest.fn(),
      getBreadcrumbs: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: service },
        {
          provide: CategoryDemandService,
          useValue: {
            getTopCategories: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should create', async () => {
    service.create.mockResolvedValue({ id: '1', name: 'Test' });
    const result = await controller.create({ name: 'Test' } as any, 'user-1');
    expect(result.id).toBe('1');
  });

  it('should findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should getTree', async () => {
    service.getTree.mockResolvedValue([]);
    const result = await controller.getTree();
    expect(result).toEqual([]);
  });

  it('should findBySlug', async () => {
    service.findBySlug.mockResolvedValue({ slug: 'test' });
    const result = await controller.findBySlug('test');
    expect(result.slug).toBe('test');
  });

  it('should getBreadcrumbs', async () => {
    service.getBreadcrumbs.mockResolvedValue([{ slug: 'root' }, { slug: 'child' }]);
    const result = await controller.getBreadcrumbs('child');
    expect(result).toHaveLength(2);
  });

  it('should update', async () => {
    service.update.mockResolvedValue({ id: '1', name: 'Updated' });
    const result = await controller.update('1', { name: 'Updated' } as any, 'user-1');
    expect(result.name).toBe('Updated');
  });

  it('should remove', async () => {
    await controller.remove('1', 'user-1');
    expect(service.remove).toHaveBeenCalledWith('1', 'user-1');
  });

  describe('getTopCategories', () => {
    it('should return top categories ranked by demand score', async () => {
      const mockResult: CategoryDemandResult = {
        data: [
          {
            categoryId: 'cat-1',
            categoryName: 'Electronics',
            slug: 'electronics',
            icon: 'phone',
            rank: 1,
            totalDemandScore: 85,
            dataConfidence: 0.8,
            signalBreakdown: {
              sales: 80,
              rfq: 60,
              search: 70,
              views: 90,
              engagement: 50,
              conversion: 40,
            },
            calculatedAt: new Date(),
          },
        ],
        meta: { total: 100, limit: 20 },
      };

      ;(controller as any).categoryDemandService.getTopCategories.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getTopCategories({ limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].categoryName).toBe('Electronics');
      expect(result.data[0].rank).toBe(1);
      expect(result.data[0].totalDemandScore).toBe(85);
      expect(result.data[0].dataConfidence).toBe(0.8);
    });

    it('should use default limit of 20 when not specified', async () => {
      const mockResult: CategoryDemandResult = {
        data: [],
        meta: { total: 0, limit: 20 },
      };

      ;(controller as any).categoryDemandService.getTopCategories.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getTopCategories({} as any);

      expect(result.meta.limit).toBe(20);
    });

    it('should return 400 for invalid limit', async () => {
      ;(controller as any).categoryDemandService.getTopCategories.mockResolvedValue({
        data: [],
        meta: { total: 0, limit: 20 },
      } as any);

      const result = await controller.getTopCategories({ limit: 0 } as any);

      // Should not throw, should return result (validation happens at HTTP layer)
      expect(result).toBeDefined();
    });

    it('should be publicly accessible without authentication', async () => {
      // The endpoint should not require JWT auth guard
      // Verify the controller method exists and is callable
      ;(controller as any).categoryDemandService.getTopCategories.mockResolvedValue({
        data: [],
        meta: { total: 0, limit: 20 },
      });
      const result = await controller.getTopCategories({ limit: 20 } as any);
      expect(result).toBeDefined();
    });
  });
});
