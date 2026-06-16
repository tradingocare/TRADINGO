import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let searchService: Record<string, jest.Mock>;

  const mockProduct = {
    id: 'prod-1', companyId: 'comp-1', categoryId: null, industryId: null,
    name: 'Test Product', slug: 'comp-1-test-product',
    shortDescription: null, description: null,
    productType: 'PHYSICAL', status: 'DRAFT',
    brand: null, model: null, sku: null,
    moq: 1, unit: null, visibilityRadius: null,
    isFeatured: false, trustScoreSnapshot: 80,
    latitude: null, longitude: null,
    createdAt: new Date(), updatedAt: new Date(),
    deletedAt: null, createdBy: 'user-1', updatedBy: 'user-1',
    company: { id: 'comp-1', name: 'Test Co', slug: 'comp-1', trustScore: 80, verificationLevel: 'LEVEL_2', status: 'ACTIVE' },
    category: null, industry: null,
    media: [], specifications: [], variants: [],
    inventory: null, priceSlabs: [],
  };

  const mockCompany = { id: 'comp-1', slug: 'comp-1', trustScore: 80, verificationLevel: 'LEVEL_2', status: 'ACTIVE' };

  beforeEach(async () => {
    prisma = {
      product: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      productInventory: { upsert: jest.fn() },
      company: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      companyOwner: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      auditLog: { create: jest.fn() },
    };

    searchService = {
      indexDocument: jest.fn(),
      deleteDocument: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SearchService, useValue: searchService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a product with all nested data', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.create.mockResolvedValue(mockProduct);

      const dto = {
        companyId: 'comp-1', name: 'Test Product',
        media: [{ type: 'IMAGE' as const, url: 'https://example.com/img.jpg' }],
        specifications: [{ key: 'weight', value: '1kg' }],
        priceSlabs: [{ minQty: 1, price: 100 }],
        availableQuantity: 50,
      };

      const result = await service.create(dto, 'user-1');
      expect(result.name).toBe('Test Product');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'PRODUCT_CREATED' }) }),
      );
      expect(searchService.indexDocument).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for non-owner', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'MEMBER' });
      prisma.companyOwner.findUnique.mockResolvedValue(null);

      await expect(service.create({ companyId: 'comp-1', name: 'Test' }, 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if company not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.create({ companyId: 'comp-1', name: 'Test' }, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if media exceeds limits', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.company.findFirst.mockResolvedValue(mockCompany);

      const dto = {
        companyId: 'comp-1', name: 'Test',
        media: Array(6).fill({ type: 'IMAGE' as const, url: 'https://example.com/img.jpg' }),
      };
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should apply filters', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      await service.findAll({ companyId: 'comp-1', status: 'ACTIVE' });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: 'comp-1', status: 'ACTIVE' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return product', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      const result = await service.findById('prod-1');
      expect(result.id).toBe('prod-1');
    });

    it('should throw NotFoundException', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      const result = await service.findBySlug('comp-1-test-product');
      expect(result.id).toBe('prod-1');
    });

    it('should throw NotFoundException', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Updated' });

      const result = await service.update('prod-1', { name: 'Updated' }, 'user-1');
      expect(result.name).toBe('Updated');
      expect(searchService.indexDocument).toHaveBeenCalled();
    });

    it('should throw NotFoundException', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.update('nonexistent', { name: 'Updated' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a product', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.company.update.mockResolvedValue(mockCompany);

      await service.remove('prod-1', 'user-1');
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'prod-1' }, data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      );
      expect(searchService.deleteDocument).toHaveBeenCalledWith('products', 'prod-1');
    });
  });

  describe('publish', () => {
    it('should set product status to ACTIVE', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, status: 'ACTIVE' });

      const result = await service.publish('prod-1', 'user-1');
      expect(result.status).toBe('ACTIVE');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'PRODUCT_PUBLISHED' }) }),
      );
    });
  });

  describe('unpublish', () => {
    it('should set product status to INACTIVE', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, status: 'INACTIVE' });

      const result = await service.unpublish('prod-1', 'user-1');
      expect(result.status).toBe('INACTIVE');
    });
  });

  describe('archive', () => {
    it('should set product status to DISCONTINUED', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, status: 'DISCONTINUED' });

      const result = await service.archive('prod-1', 'user-1');
      expect(result.status).toBe('DISCONTINUED');
    });
  });

  describe('duplicate', () => {
    it('should create a copy with DRAFT status', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      const original = {
        ...mockProduct,
        media: [], specifications: [], variants: [], priceSlabs: [],
      };
      prisma.product.findFirst.mockResolvedValue(original);
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({ ...mockProduct, id: 'prod-2', name: 'Test Product (Copy)', status: 'DRAFT' });
      prisma.company.update.mockResolvedValue(mockCompany);

      const result = await service.duplicate('prod-1', 'user-1');
      expect(result.name).toBe('Test Product (Copy)');
      expect(result.status).toBe('DRAFT');
    });

    it('should throw NotFoundException if original not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.duplicate('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateInventory', () => {
    it('should update inventory and set OUT_OF_STOCK when zero', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findFirst.mockResolvedValue({ ...mockProduct, status: 'ACTIVE' });
      prisma.productInventory.upsert.mockResolvedValue({
        productId: 'prod-1', availableQuantity: 0, minimumThreshold: 5, stockStatus: 'OUT_OF_STOCK',
      });

      await service.updateInventory('prod-1', 0, 5, 'user-1');
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'OUT_OF_STOCK' }) }),
      );
    });

    it('should restore ACTIVE when restocked', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findFirst.mockResolvedValue({ ...mockProduct, status: 'OUT_OF_STOCK' });
      prisma.productInventory.upsert.mockResolvedValue({
        productId: 'prod-1', availableQuantity: 50, minimumThreshold: 5, stockStatus: 'IN_STOCK',
      });

      await service.updateInventory('prod-1', 50, 5, 'user-1');
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE' }) }),
      );
    });
  });

  describe('findByCompany', () => {
    it('should return paginated products for company', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findByCompany('c1', { status: 'ACTIVE', page: 1, limit: 10 }, 'u1');

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findByCompany('c1', { status: 'ACTIVE' }, 'u1');

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        })
      );
    });

    it('should throw if not company owner', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      prisma.companyOwner.findUnique.mockResolvedValue(null);

      await expect(service.findByCompany('c1', {}, 'u1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('searchProducts', () => {
    it('should search and return products in order', async () => {
      searchService.search.mockResolvedValue({
        hits: [{ id: 'prod-1' }, { id: 'prod-2' }],
        total: 2,
      });
      prisma.product.findMany.mockResolvedValue([
        { ...mockProduct, id: 'prod-2' },
        { ...mockProduct, id: 'prod-1' },
      ]);

      const result = await service.searchProducts('test');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('prod-1');
      expect(result.data[1].id).toBe('prod-2');
    });

    it('should return empty results when no hits', async () => {
      searchService.search.mockResolvedValue({ hits: [], total: 0 });
      const result = await service.searchProducts('nothing');
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });
});
