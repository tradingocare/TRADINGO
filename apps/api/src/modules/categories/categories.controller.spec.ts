import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

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
      providers: [{ provide: CategoriesService, useValue: service }],
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
});
