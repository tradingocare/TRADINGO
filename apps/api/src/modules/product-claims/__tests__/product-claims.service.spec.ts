import { Test, TestingModule } from '@nestjs/testing';
import { ProductClaimsService } from '../product-claims.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';

describe('ProductClaimsService', () => {
  let service: ProductClaimsService;
  let prisma: any;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    companyOwner: { findUnique: jest.fn() },
    company: { findUnique: jest.fn() },
    productMaster: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    productClaim: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
    product: { findUnique: jest.fn(), create: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductClaimsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductClaimsService>(ProductClaimsService);
    jest.clearAllMocks();
  });

  describe('searchProductMasters', () => {
    it('should search product masters with pagination', async () => {
      mockPrisma.productMaster.findMany.mockResolvedValue([{ id: '1', name: 'Test', category: { id: 'c1', name: 'Cat' } }]);
      mockPrisma.productMaster.count.mockResolvedValue(1);

      const result = await service.searchProductMasters('test', { page: 1, limit: 20 });

      expect(mockPrisma.productMaster.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 })
      );
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by categoryId', async () => {
      mockPrisma.productMaster.findMany.mockResolvedValue([]);
      mockPrisma.productMaster.count.mockResolvedValue(0);

      await service.searchProductMasters('test', { categoryId: 'cat1' });

      const call = mockPrisma.productMaster.findMany.mock.calls[0][0];
      expect(call.where.categoryId).toBe('cat1');
    });
  });

  describe('create', () => {
    it('should create a product claim', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: Role.SUPER_ADMIN });
      mockPrisma.productMaster.findUnique.mockResolvedValue({ id: 'pm1' });
      mockPrisma.productClaim.create.mockResolvedValue({ id: 'claim1', name: 'Test' });

      const result = await service.create('company1', {
        productMasterId: 'pm1',
        name: 'Test Product',
      } as any, 'user1');

      expect(result.id).toBe('claim1');
      expect(mockPrisma.productClaim.create).toHaveBeenCalled();
    });

    it('should throw if ProductMaster not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: Role.SUPER_ADMIN });
      mockPrisma.productMaster.findUnique.mockResolvedValue(null);

      await expect(
        service.create('company1', { productMasterId: 'bad', name: 'Test' } as any, 'user1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if not company owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: Role.VIEWER });
      mockPrisma.companyOwner.findUnique.mockResolvedValue(null);

      await expect(
        service.create('company1', { productMasterId: 'pm1', name: 'Test' } as any, 'user1')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should list claims for company', async () => {
      mockPrisma.productClaim.findMany.mockResolvedValue([{ id: '1', name: 'Test' }]);
      mockPrisma.productClaim.count.mockResolvedValue(1);

      const result = await service.findAll('company1');

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.productClaim.findMany.mockResolvedValue([]);
      mockPrisma.productClaim.count.mockResolvedValue(0);

      await service.findAll('company1', 'DRAFT');

      expect(mockPrisma.productClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DRAFT' }),
        })
      );
    });
  });

  describe('findById', () => {
    it('should return claim if found', async () => {
      mockPrisma.productClaim.findFirst.mockResolvedValue({ id: '1', name: 'Test' });

      const result = await service.findById('1');

      expect(result.id).toBe('1');
    });

    it('should throw if not found', async () => {
      mockPrisma.productClaim.findFirst.mockResolvedValue(null);

      await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit', () => {
    it('should change status to PENDING', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: Role.SUPER_ADMIN });
      mockPrisma.productClaim.findFirst.mockResolvedValue({ id: '1', status: 'DRAFT', companyId: 'c1' });
      mockPrisma.productClaim.update.mockResolvedValue({ id: '1', status: 'PENDING' });

      const result = await service.submit('1', 'user1');

      expect(result.status).toBe('PENDING');
    });

    it('should throw if not draft', async () => {
      mockPrisma.productClaim.findFirst.mockResolvedValue({ id: '1', status: 'PENDING', companyId: 'c1' });

      await expect(service.submit('1', 'user1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should approve claim and create product', async () => {
      mockPrisma.productClaim.findFirst.mockResolvedValue({
        id: '1',
        status: 'PENDING',
        companyId: 'c1',
        name: 'Test',
        productMasterId: 'pm1',
        productMaster: { id: 'pm1', categoryId: 'cat1' },
      });
      mockPrisma.company.findUnique.mockResolvedValue({ slug: 'test-company', trustScore: 80 });
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        return cb(mockPrisma);
      });
      mockPrisma.product.create.mockResolvedValue({ id: 'new-product', name: 'Test' });
      mockPrisma.productClaim.update.mockResolvedValue({ id: '1', status: 'PUBLISHED', productId: 'new-product' });

      const result = await service.approve('1', 'admin1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.product.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw if not PENDING', async () => {
      mockPrisma.productClaim.findFirst.mockResolvedValue({ id: '1', status: 'DRAFT' });

      await expect(service.approve('1', 'admin1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject claim with reason', async () => {
      mockPrisma.productClaim.findFirst.mockResolvedValue({ id: '1', status: 'PENDING', companyId: 'c1' });
      mockPrisma.productClaim.update.mockResolvedValue({ id: '1', status: 'REJECTED', rejectionReason: 'bad' });

      const result = await service.reject('1', 'Insufficient info', 'admin1');

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('bad');
    });

    it('should throw if not PENDING', async () => {
      mockPrisma.productClaim.findFirst.mockResolvedValue({ id: '1', status: 'PUBLISHED' });

      await expect(service.reject('1', 'no', 'admin1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a draft claim', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: Role.SUPER_ADMIN });
      mockPrisma.productClaim.findFirst.mockResolvedValue({ id: '1', status: 'DRAFT', companyId: 'c1' });
      mockPrisma.productClaim.update.mockResolvedValue({ id: '1', deletedAt: new Date() });

      await service.remove('1', 'user1');

      expect(mockPrisma.productClaim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });

    it('should throw if not DRAFT', async () => {
      mockPrisma.productClaim.findFirst.mockResolvedValue({ id: '1', status: 'PENDING', companyId: 'c1' });

      await expect(service.remove('1', 'user1')).rejects.toThrow(BadRequestException);
    });
  });
});
