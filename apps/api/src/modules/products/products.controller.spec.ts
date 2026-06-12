import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: Record<string, jest.Mock>;

  const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      searchProducts: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      publish: jest.fn(),
      unpublish: jest.fn(),
      archive: jest.fn(),
      duplicate: jest.fn(),
      updateInventory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should create', async () => {
    service.create.mockResolvedValue({ id: '1', name: 'Product' });
    const result = await controller.create({ name: 'Product', companyId: 'c-1' } as any, 'user-1');
    expect(result.name).toBe('Product');
  });

  it('should findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should search', async () => {
    service.searchProducts.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.search('phone', 'cat-1', 'ind-1', 'PHYSICAL', 'comp-1', 'Mumbai', 'MH');
    expect(service.searchProducts).toHaveBeenCalledWith('phone', {
      categoryId: 'cat-1', industryId: 'ind-1', productType: 'PHYSICAL',
      companyId: 'comp-1', city: 'Mumbai', state: 'MH',
    });
  });

  it('should findBySlug', async () => {
    service.findBySlug.mockResolvedValue({ slug: 'test-product' });
    const result = await controller.findBySlug('test-product');
    expect(result.slug).toBe('test-product');
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

  it('should publish', async () => {
    service.publish.mockResolvedValue({ id: '1', status: 'ACTIVE' });
    const result = await controller.publish('1', 'user-1');
    expect(result.status).toBe('ACTIVE');
  });

  it('should unpublish', async () => {
    service.unpublish.mockResolvedValue({ id: '1', status: 'INACTIVE' });
    const result = await controller.unpublish('1', 'user-1');
    expect(result.status).toBe('INACTIVE');
  });

  it('should archive', async () => {
    service.archive.mockResolvedValue({ id: '1', status: 'DISCONTINUED' });
    const result = await controller.archive('1', 'user-1');
    expect(result.status).toBe('DISCONTINUED');
  });

  it('should duplicate', async () => {
    service.duplicate.mockResolvedValue({ id: '2', name: 'Copy', status: 'DRAFT' });
    const result = await controller.duplicate('1', 'user-1');
    expect(result.id).toBe('2');
  });

  it('should updateInventory', async () => {
    service.updateInventory.mockResolvedValue({ availableQuantity: 50, stockStatus: 'IN_STOCK' });
    const result = await controller.updateInventory('1', 50, 5, 'user-1');
    expect(service.updateInventory).toHaveBeenCalledWith('1', 50, 5, 'user-1');
  });
});
