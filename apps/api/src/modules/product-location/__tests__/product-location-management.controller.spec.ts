import { Test, TestingModule } from '@nestjs/testing';
import { ProductLocationManagementController } from '../product-location-management.controller';
import { ProductLocationService } from '../product-location.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ProductLocationManagementController', () => {
  let controller: ProductLocationManagementController;
  let service: any;
  let prisma: any;

  const mockService = {
    findByCompany: jest.fn(),
    bulkUpdate: jest.fn(),
    getCompanyDefaultLocation: jest.fn(),
    update: jest.fn(),
  };

  const mockPrisma = {
    companyOwner: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    product: { findMany: jest.fn(), findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductLocationManagementController],
      providers: [
        { provide: ProductLocationService, useValue: mockService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<ProductLocationManagementController>(ProductLocationManagementController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findSellerProducts', () => {
    it('should return products with location status', async () => {
      mockPrisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'c1' });
      mockService.findByCompany.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      const result = await controller.findSellerProducts('u1', { page: 1, limit: 20 });

      expect(mockService.findByCompany).toHaveBeenCalledWith('c1', { page: 1, limit: 20 });
      expect(result.meta.total).toBe(0);
    });

    it('should throw if no company found and not admin', async () => {
      mockPrisma.companyOwner.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'BUYER' });

      await expect(controller.findSellerProducts('u1', {} as any)).rejects.toThrow('Company not found for user');
    });
  });

  describe('bulkUpdate', () => {
    it('should bulk update locations', async () => {
      mockPrisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'c1' });
      mockPrisma.product.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
      mockService.bulkUpdate.mockResolvedValue({ updated: 2 });

      const dto = { productIds: ['p1', 'p2'], latitude: 19.076, longitude: 72.8777 };
      const result = await controller.bulkUpdate(dto, 'u1');

      expect(result.updated).toBe(2);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1', 'p2'] }, companyId: 'c1' },
        select: { id: true },
      });
    });

    it('should throw if some products not owned', async () => {
      mockPrisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'c1' });
      mockPrisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);

      const dto = { productIds: ['p1', 'p3'], latitude: 0, longitude: 0 };
      await expect(controller.bulkUpdate(dto, 'u1')).rejects.toThrow('not found or not owned');
    });
  });

  describe('getCompanyAddress', () => {
    it('should return company default address', async () => {
      mockPrisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'c1' });
      mockService.getCompanyDefaultLocation.mockResolvedValue({
        id: 'addr1', city: 'Mumbai', latitude: 19.076, longitude: 72.8777,
      });

      const result = (await controller.getCompanyAddress('u1'))!;
      expect(result!.city).toBe('Mumbai');
      expect(result!.latitude).toBe(19.076);
    });
  });

  describe('update', () => {
    it('should update single product location', async () => {
      mockPrisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'c1' });
      mockPrisma.product.findUnique.mockResolvedValue({ companyId: 'c1' });
      mockService.update.mockResolvedValue({ id: 'p1', latitude: 10, longitude: 20 });

      const result = await controller.update('p1', { latitude: 10, longitude: 20 } as any, 'u1');
      expect(result.latitude).toBe(10);
    });

    it('should throw if product not owned', async () => {
      mockPrisma.companyOwner.findFirst.mockResolvedValue({ companyId: 'c1' });
      mockPrisma.product.findUnique.mockResolvedValue({ companyId: 'c2' });

      await expect(controller.update('p1', { latitude: 0, longitude: 0 } as any, 'u1')).rejects.toThrow('not owned by you');
    });
  });
});
