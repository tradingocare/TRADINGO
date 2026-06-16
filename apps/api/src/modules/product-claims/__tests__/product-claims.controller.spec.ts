import { Test, TestingModule } from '@nestjs/testing';
import { ProductClaimsController } from '../product-claims.controller';
import { ProductClaimsService } from '../product-claims.service';

describe('ProductClaimsController', () => {
  let controller: ProductClaimsController;
  let service: any;

  const mockService = {
    searchProductMasters: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    submit: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductClaimsController],
      providers: [{ provide: ProductClaimsService, useValue: mockService }],
    }).compile();

    controller = module.get<ProductClaimsController>(ProductClaimsController);
    jest.clearAllMocks();
  });

  describe('searchProductMasters', () => {
    it('should delegate to service', async () => {
      mockService.searchProductMasters.mockResolvedValue({ data: [], meta: {} });
      const result = await controller.searchProductMasters('test', 'cat1');

      expect(mockService.searchProductMasters).toHaveBeenCalledWith('test', { categoryId: 'cat1', page: undefined, limit: undefined, subcategoryId: undefined });
      expect(result).toEqual({ data: [], meta: {} });
    });
  });

  describe('create', () => {
    it('should delegate to service', async () => {
      mockService.create.mockResolvedValue({ id: 'c1' });
      const dto = { productMasterId: 'pm1', name: 'Test' };

      const result = await controller.create('company1', dto as any, 'u1');

      expect(mockService.create).toHaveBeenCalledWith('company1', dto, 'u1');
      expect(result).toEqual({ id: 'c1' });
    });
  });

  describe('findAll', () => {
    it('should delegate to service', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: {} });

      const result = await controller.findAll('company1', 'DRAFT');

      expect(mockService.findAll).toHaveBeenCalledWith('company1', 'DRAFT');
      expect(result).toEqual({ data: [], meta: {} });
    });
  });

  describe('findById', () => {
    it('should delegate to service', async () => {
      mockService.findById.mockResolvedValue({ id: 'c1' });

      const result = await controller.findById('c1');

      expect(result).toEqual({ id: 'c1' });
    });
  });

  describe('update', () => {
    it('should delegate to service', async () => {
      mockService.update.mockResolvedValue({ id: 'c1' });
      const dto = { name: 'Updated' };

      const result = await controller.update('c1', dto as any, 'u1');

      expect(mockService.update).toHaveBeenCalledWith('c1', dto, 'u1');
      expect(result).toEqual({ id: 'c1' });
    });
  });

  describe('submit', () => {
    it('should delegate to service', async () => {
      mockService.submit.mockResolvedValue({ id: 'c1', status: 'PENDING' });

      const result = await controller.submit('c1', 'u1');

      expect(result).toEqual({ id: 'c1', status: 'PENDING' });
    });
  });

  describe('approve', () => {
    it('should delegate to service', async () => {
      mockService.approve.mockResolvedValue({ id: 'c1', status: 'PUBLISHED' });

      const result = await controller.approve('c1', 'admin1');

      expect(result).toEqual({ id: 'c1', status: 'PUBLISHED' });
    });
  });

  describe('reject', () => {
    it('should delegate to service', async () => {
      mockService.reject.mockResolvedValue({ id: 'c1', status: 'REJECTED' });

      const result = await controller.reject('c1', 'Insufficient quality', 'admin1');

      expect(result).toEqual({ id: 'c1', status: 'REJECTED' });
    });
  });

  describe('remove', () => {
    it('should delegate to service', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('c1', 'u1');

      expect(result).toBeUndefined();
    });
  });
});
