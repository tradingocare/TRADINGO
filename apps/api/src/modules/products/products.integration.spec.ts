import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const mockPrisma = {
  product: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  productInventory: { upsert: jest.fn() },
  company: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  companyOwner: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  auditLog: { create: jest.fn() },
};
const mockSearch = { indexDocument: jest.fn(), search: jest.fn(), deleteDocument: jest.fn() };

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('mock-uuid') }));

describe('Product Flow Integration', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockUser = { sub: 'user-1' };

  function resetMocks() {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'SUPER_ADMIN' });
    mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-1', slug: 'test-company', trustScore: 85, verificationLevel: 'LEVEL_2' });
    mockPrisma.company.findUnique.mockResolvedValue({ id: 'company-1', slug: 'test-company', trustScore: 85 });
    mockPrisma.product.findUnique.mockResolvedValue(null);
    mockPrisma.product.findFirst.mockResolvedValue(null);
  }

  beforeEach(async () => {
    resetMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SearchService, useValue: mockSearch },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => { jest.restoreAllMocks(); });

  const baseDto = {
    companyId: 'company-1',
    categoryId: 'cat-1',
    name: 'Test Product',
    shortDescription: 'A test product',
    productType: 'PHYSICAL' as const,
    status: 'DRAFT' as const,
    brand: 'TestBrand',
    sku: 'SKU-001',
    moq: 1,
    unit: 'piece',
    isFeatured: false,
  };

  const syncProduct = {
      id: 'prod-1', name: 'Test Product', slug: 'slug',
      shortDescription: 'Desc', description: 'Full',
      productType: 'PHYSICAL', status: 'DRAFT',
      brand: 'Brand', model: null, sku: 'SKU', moq: 1, unit: 'pc',
      visibilityRadius: null, isFeatured: false,
      latitude: null, longitude: null,
      company: { id: 'company-1', name: 'Test Company', slug: 'test-company', trustScore: 85, verificationLevel: 'LEVEL_2', status: 'ACTIVE' },
      category: { id: 'cat-1', name: 'Cat', slug: 'cat' },
      industry: { id: 'ind-1', name: 'Ind', slug: 'ind' },
      media: [{ id: 'm1', url: 'img.jpg', type: 'IMAGE', sortOrder: 0 }],
      specifications: [{ key: 'weight', value: '1kg' }],
      inventory: { availableQuantity: 100, stockStatus: 'IN_STOCK' },
      priceSlabs: [{ minQty: 1, maxQty: 10, price: 100 }],
      companyId: 'company-1', categoryId: 'cat-1', industryId: 'ind-1',
      deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
    };

  describe('Create Product Flow', () => {
    it('creates product with minimal fields', async () => {
      mockPrisma.product.create.mockResolvedValue({
        id: 'prod-1', ...baseDto,
        slug: 'test-company-test-product',
        company: { id: 'company-1', name: 'Test Company', slug: 'test-company' },
        category: { id: 'cat-1', name: 'Category', slug: 'cat' },
        industry: null,
        media: [], specifications: [],
        variants: [], inventory: null, priceSlabs: [],
      });
      mockPrisma.product.findFirst.mockResolvedValue(syncProduct);
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.create(baseDto, mockUser.sub);

      expect(result.name).toBe('Test Product');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockPrisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ totalProducts: { increment: 1 } }),
      }));
      expect(mockSearch.indexDocument).toHaveBeenCalled();
    });

    it('creates product with full nested resources', async () => {
      mockPrisma.product.create.mockResolvedValue({
        id: 'prod-1', name: 'Test Product', slug: 'slug',
        company: { id: 'company-1', name: 'Test', slug: 'test' },
        category: null, industry: null,
        media: [{ id: 'm1', url: 'img.jpg', type: 'IMAGE', sortOrder: 0 }],
        specifications: [{ id: 's1', key: 'weight', value: '1kg', sortOrder: 0 }],
        variants: [{ id: 'v1', variantType: 'size', value: 'L', inventory: null, sortOrder: 0 }],
        inventory: { id: 'inv1', availableQuantity: 100, stockStatus: 'IN_STOCK' },
        priceSlabs: [{ id: 'ps1', minQty: 1, maxQty: 10, price: 100, currency: 'INR' }],
      });
      mockPrisma.product.findFirst.mockResolvedValue(syncProduct);
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const fullDto: any = {
        ...baseDto,
        media: [{ type: 'IMAGE', url: 'img.jpg', title: 'Image', sortOrder: 0 }],
        specifications: [{ key: 'weight', value: '1kg', sortOrder: 0 }],
        variants: [{ variantType: 'size', customName: 'Size', value: 'L', sku: 'SKU-L', price: 100, availableQuantity: 50, minimumThreshold: 5 }],
        availableQuantity: 100,
        minimumThreshold: 10,
        priceSlabs: [{ minQty: 1, maxQty: 10, price: 100, currency: 'INR' }],
      };

      const result = await controller.create(fullDto, mockUser.sub);

      expect(result.name).toBe('Test Product');
      expect(mockSearch.indexDocument).toHaveBeenCalled();
    });

    it('validates price slabs overlap', async () => {
      await expect(controller.create({
        ...baseDto,
        priceSlabs: [
          { minQty: 1, maxQty: 10, price: 100 },
          { minQty: 5, maxQty: 20, price: 80 },
        ],
      } as any, mockUser.sub)).rejects.toThrow('Price slabs must not overlap');
    });

    it('validates media limits', async () => {
      const manyImages = Array.from({ length: 6 }, (_, i) => ({ type: 'IMAGE' as any, url: `img${i}.jpg` }));

      await expect(controller.create({
        ...baseDto, media: manyImages,
      } as any, mockUser.sub)).rejects.toThrow('Maximum 5 image(s) allowed per product');
    });
  });

  describe('Find Products Flow', () => {
    const products = [
      { id: 'p1', name: 'Product 1', slug: 'p1', company: { id: 'c1', name: 'C1', slug: 'c1', trustScore: 80 }, category: { id: 'cat1', name: 'Cat1', slug: 'cat1' }, industry: null, media: [], inventory: null, priceSlabs: [], _count: { media: 0, variants: 0, specifications: 0 }, createdAt: new Date(), updatedAt: new Date() },
      { id: 'p2', name: 'Product 2', slug: 'p2', company: { id: 'c1', name: 'C1', slug: 'c1', trustScore: 80 }, category: null, industry: null, media: [], inventory: null, priceSlabs: [], _count: { media: 0, variants: 0, specifications: 0 }, createdAt: new Date(), updatedAt: new Date() },
    ];

    it('lists products with pagination', async () => {
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await controller.findAll({});

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('filters by company ID', async () => {
      mockPrisma.product.findMany.mockResolvedValue([products[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await controller.findAll({ companyId: 'c1' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ companyId: 'c1' }) }),
      );
    });

    it('filters by featured', async () => {
      mockPrisma.product.findMany.mockResolvedValue([products[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await controller.findAll({ isFeatured: 'true' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isFeatured: true }) }),
      );
    });
  });

  describe('Find Product By Slug Flow', () => {
    it('finds product by slug', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({
        id: 'p1', name: 'Product', slug: 'product',
        company: { id: 'c1', name: 'C1', slug: 'c1', trustScore: 80, verificationLevel: 'LEVEL_2' },
        category: null, industry: null, media: [], specifications: [], variants: [], inventory: null, priceSlabs: [],
      });

      const result = await controller.findBySlug('product');

      expect(result.id).toBe('p1');
    });

    it('throws when slug not found', async () => {
      await expect(controller.findBySlug('nonexistent')).rejects.toThrow('Product not found');
    });
  });

  describe('Update Product Flow', () => {
    it('updates product fields', async () => {
      mockPrisma.product.findFirst
        .mockResolvedValueOnce({ id: 'prod-1', companyId: 'company-1' })
        .mockResolvedValue(syncProduct);
      mockPrisma.product.update.mockResolvedValue({
        id: 'prod-1', name: 'Updated Product', slug: 'slug',
        company: { id: 'c1', name: 'C1', slug: 'c1' }, category: null, industry: null,
        media: [], specifications: [], variants: [], inventory: null, priceSlabs: [],
      });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.update('prod-1', { name: 'Updated Product' }, mockUser.sub);

      expect(result.name).toBe('Updated Product');
      expect(mockSearch.indexDocument).toHaveBeenCalled();
    });

    it('validates media on update', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1', companyId: 'company-1' });

      await expect(controller.update('prod-1', {
        media: Array.from({ length: 11 }, (_, i) => ({ type: 'DOCUMENT', url: `doc${i}.pdf` })),
      }, mockUser.sub)).rejects.toThrow('Maximum 10 document(s) allowed per product');
    });
  });

  describe('Delete Product Flow', () => {
    it('soft deletes product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod-1', companyId: 'company-1', name: 'Product' });
      mockPrisma.product.update.mockResolvedValue({});
      mockSearch.deleteDocument.mockResolvedValue(undefined);

      await controller.remove('prod-1', mockUser.sub);

      expect(mockPrisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date), status: 'DISCONTINUED' }),
      }));
      expect(mockPrisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ totalProducts: { decrement: 1 } }),
      }));
      expect(mockSearch.deleteDocument).toHaveBeenCalled();
    });
  });

  describe('Publish/Unpublish/Archive Flow', () => {
    it('publishes product', async () => {
      mockPrisma.product.findFirst
        .mockResolvedValueOnce({ id: 'prod-1', companyId: 'company-1' })
        .mockResolvedValue(syncProduct);
      mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', status: 'ACTIVE' });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.publish('prod-1', mockUser.sub);

      expect(result.status).toBe('ACTIVE');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'PRODUCT_PUBLISHED' }),
      }));
    });

    it('unpublishes product', async () => {
      mockPrisma.product.findFirst
        .mockResolvedValueOnce({ id: 'prod-1', companyId: 'company-1' })
        .mockResolvedValue(syncProduct);
      mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', status: 'INACTIVE' });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.unpublish('prod-1', mockUser.sub);

      expect(result.status).toBe('INACTIVE');
    });

    it('archives product', async () => {
      mockPrisma.product.findFirst
        .mockResolvedValueOnce({ id: 'prod-1', companyId: 'company-1' })
        .mockResolvedValue(syncProduct);
      mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', status: 'DISCONTINUED' });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.archive('prod-1', mockUser.sub);

      expect(result.status).toBe('DISCONTINUED');
    });
  });

  describe('Duplicate Product Flow', () => {
    it('duplicates a product', async () => {
      mockPrisma.product.findFirst
        .mockResolvedValueOnce({
          id: 'prod-1', companyId: 'company-1', name: 'Original', slug: 'orig',
          shortDescription: 'Desc', description: 'Full', productType: 'PHYSICAL',
          brand: 'Brand', model: 'Model', sku: 'SKU', moq: 1, unit: 'pc',
          visibilityRadius: null, isFeatured: false, trustScoreSnapshot: 85,
          categoryId: 'cat-1', industryId: null, latitude: null, longitude: null,
          media: [], specifications: [], variants: [], priceSlabs: [],
          createdAt: new Date(), updatedAt: new Date(),
        })
        .mockResolvedValue(syncProduct);
      mockPrisma.company.findUnique.mockResolvedValue({ slug: 'test-company', trustScore: 85 });
      mockPrisma.product.create.mockResolvedValue({
        id: 'dup-1', name: 'Original (Copy)', slug: 'test-company-original-copy',
        company: { id: 'c1', name: 'C1', slug: 'c1' },
        media: [], specifications: [], priceSlabs: [],
      });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.duplicate('prod-1', mockUser.sub);

      expect(result.name).toBe('Original (Copy)');
      expect(mockPrisma.company.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ totalProducts: { increment: 1 } }),
      }));
    });
  });

  describe('Update Inventory Flow', () => {
    it('updates inventory to in-stock', async () => {
      mockPrisma.product.findFirst
        .mockResolvedValueOnce({ id: 'prod-1', companyId: 'company-1', status: 'DRAFT' })
        .mockResolvedValue(syncProduct);
      mockPrisma.productInventory.upsert.mockResolvedValue({
        id: 'inv-1', productId: 'prod-1', availableQuantity: 50, minimumThreshold: 10, stockStatus: 'IN_STOCK',
      });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.updateInventory('prod-1', 50, 10, mockUser.sub);

      expect(result.stockStatus).toBe('IN_STOCK');
    });

    it('marks product OUT_OF_STOCK and updates product status', async () => {
      mockPrisma.product.findFirst
        .mockResolvedValueOnce({ id: 'prod-1', companyId: 'company-1', status: 'ACTIVE' })
        .mockResolvedValue(syncProduct);
      mockPrisma.productInventory.upsert.mockResolvedValue({
        id: 'inv-1', productId: 'prod-1', availableQuantity: 0, minimumThreshold: 5, stockStatus: 'OUT_OF_STOCK',
      });
      mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', status: 'OUT_OF_STOCK' });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.updateInventory('prod-1', 0, 5, mockUser.sub);

      expect(result.stockStatus).toBe('OUT_OF_STOCK');
      expect(mockPrisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'OUT_OF_STOCK' }),
      }));
    });

    it('restores product to ACTIVE when coming back from OUT_OF_STOCK', async () => {
      mockPrisma.product.findFirst
        .mockResolvedValueOnce({ id: 'prod-1', companyId: 'company-1', status: 'OUT_OF_STOCK' })
        .mockResolvedValue(syncProduct);
      mockPrisma.productInventory.upsert.mockResolvedValue({
        id: 'inv-1', productId: 'prod-1', availableQuantity: 20, minimumThreshold: 5, stockStatus: 'IN_STOCK',
      });
      mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', status: 'ACTIVE' });
      mockSearch.indexDocument.mockResolvedValue(undefined);

      const result = await controller.updateInventory('prod-1', 20, 5, mockUser.sub);

      expect(result.stockStatus).toBe('IN_STOCK');
      expect(mockPrisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'ACTIVE' }),
      }));
    });
  });

  describe('Search Products Flow', () => {
    it('searches products with filters', async () => {
      mockSearch.search.mockResolvedValue({
        hits: [{ id: 'p1' }, { id: 'p2' }],
        total: 2, page: 1, limit: 50,
      });
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Product 1', slug: 'p1', company: { id: 'c1', name: 'C1', slug: 'c1', logo: null, trustScore: 80, verificationLevel: 'LEVEL_1' }, category: { id: 'cat1', name: 'Cat1', slug: 'cat1' }, industry: null, media: [], inventory: null, priceSlabs: [], createdAt: new Date(), updatedAt: new Date() },
        { id: 'p2', name: 'Product 2', slug: 'p2', company: { id: 'c1', name: 'C1', slug: 'c1', logo: null, trustScore: 80, verificationLevel: 'LEVEL_1' }, category: null, industry: null, media: [], inventory: null, priceSlabs: [], createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await controller.search('test', 'cat-1');

      expect(result.data).toHaveLength(2);
      expect(mockSearch.search).toHaveBeenCalledWith('products', 'test', expect.objectContaining({ categoryId: 'cat-1' }), expect.any(Object));
    });

    it('returns empty when no hits', async () => {
      mockSearch.search.mockResolvedValue({ hits: [], total: 0, page: 1, limit: 50 });

      const result = await controller.search('nothing');

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('Sync OpenSearch (private method via side effects)', () => {
    it('syncs product data to OpenSearch after create', async () => {
      mockPrisma.product.create.mockResolvedValue({
        id: 'prod-1', name: 'Test', slug: 'slug',
        company: { id: 'c1', name: 'C1', slug: 'c1' },
        category: null, industry: null,
        media: [], specifications: [], variants: [], inventory: null, priceSlabs: [],
      });
      mockPrisma.product.findFirst.mockResolvedValue(syncProduct);

      await controller.create({
        companyId: 'company-1', name: 'Test', status: 'DRAFT' as const,
      } as any, mockUser.sub);

      expect(mockSearch.indexDocument).toHaveBeenCalledWith('products', 'prod-1', expect.any(Object));
    });

    it('handles OpenSearch sync failure gracefully', async () => {
      mockPrisma.product.create.mockResolvedValue({
        id: 'prod-1', name: 'Test', slug: 'slug',
        company: { id: 'c1', name: 'C1', slug: 'c1' },
        category: null, industry: null,
        media: [], specifications: [], variants: [], inventory: null, priceSlabs: [],
      });
      mockPrisma.product.findFirst.mockResolvedValue(syncProduct);
      mockSearch.indexDocument.mockRejectedValue(new Error('Sync failed'));

      const result = await controller.create({
        companyId: 'company-1', name: 'Test', status: 'DRAFT' as const,
      } as any, mockUser.sub);

      expect(result.id).toBe('prod-1');
    });
  });
});
