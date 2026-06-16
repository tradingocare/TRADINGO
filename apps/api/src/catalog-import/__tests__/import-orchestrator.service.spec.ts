import { Test, TestingModule } from '@nestjs/testing';
import { ImportOrchestratorService } from '../services/import-orchestrator.service';
import { CsvParserService } from '../services/csv-parser.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../../modules/search/search.service';
import { ConflictException } from '@nestjs/common';

describe('ImportOrchestratorService', () => {
  let service: ImportOrchestratorService;
  let prisma: any;
  let searchService: any;
  let csvParser: any;

  const validCsv = Buffer.from(
    'S.No,Category (Landing Page),Sub Category,Product / Service Name,Type,Unit Mapping,Alt / Secondary Units,Quantity Parameters\n' +
    '1,Electronics,Mobiles,Smartphone X,Product,Piece,Box,100\n' +
    '2,Electronics,Laptops,Gaming Laptop,Product,Piece,Carton,50\n' +
    '3,Clothing,Shirts,Cotton Shirt,Product,Piece,Dozen,200\n' +
    '4,Accounting,Tax Consulting,Audit Service,Service,Per Project,Contract,1\n'
  );

  const mockCategory = (name: string) => ({
    id: `cat-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    slug: `${name.toLowerCase().replace(/\s+/g, '-')}-abc123`,
  });

  beforeEach(async () => {
    prisma = {
      importJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-1', status: 'RUNNING' }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      importJobRow: {
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      category: {
        upsert: jest.fn().mockImplementation(({ create }) => ({
          id: `cat-${create.slug}`,
          ...create,
        })),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const slug = where?.slug?.startsWith || '';
          const name = slug === 'electronics' ? 'Electronics' :
                       slug === 'clothing' ? 'Clothing' :
                       slug === 'accounting' ? 'Accounting' :
                       slug === 'mobiles' ? 'Mobiles' :
                       slug === 'laptops' ? 'Laptops' :
                       slug === 'shirts' ? 'Shirts' :
                       slug === 'tax-consulting' ? 'Tax Consulting' : null;
          if (!name) return null;
          return { id: `cat-${slug}-id`, name };
        }),
      },
      productMaster: {
        upsert: jest.fn().mockImplementation(({ create }) => ({ id: `pm-${create.slug}`, ...create })),
      },
      serviceMaster: {
        upsert: jest.fn().mockImplementation(({ create }) => ({ id: `sm-${create.slug}`, ...create })),
      },
      product: {
        create: jest.fn().mockImplementation(({ data }) => ({ id: `prod-${data.slug}`, ...data })),
        findUnique: jest.fn().mockResolvedValue({
          id: 'prod-test',
          name: 'Test',
          slug: 'test',
          companyId: 'company-1',
          categoryId: 'cat-1',
          category: { name: 'Test Cat' },
          company: { name: 'Test Co' },
          media: [],
          specifications: [],
          inventory: null,
          shortDescription: 'Test',
          productType: 'PHYSICAL',
          status: 'DRAFT',
          unit: 'Piece',
          originalPrice: null,
          latitude: null,
          longitude: null,
          visibilityRadius: null,
          createdAt: new Date(),
        }),
      },
    };

    searchService = {
      indexDocument: jest.fn().mockResolvedValue(undefined),
    };

    csvParser = new CsvParserService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportOrchestratorService,
        { provide: PrismaService, useValue: prisma },
        { provide: SearchService, useValue: searchService },
        { provide: CsvParserService, useValue: csvParser },
      ],
    }).compile();

    service = module.get<ImportOrchestratorService>(ImportOrchestratorService);
  });

  describe('runFullImport', () => {
    it('should run full import pipeline successfully', async () => {
      const result = await service.runFullImport(validCsv, 'company-1');

      expect(result.categoriesCreated).toBeGreaterThan(0);
      expect(result.subcategoriesCreated).toBeGreaterThan(0);
      expect(result.productMastersCreated).toBe(3);
      expect(result.serviceMastersCreated).toBe(1);
      expect(result.productsCreated).toBe(4);
      expect(result.searchIndexed).toBe(4);
      expect(result.status).toBe('COMPLETED');
    });

    it('should fail gracefully with empty CSV', async () => {
      const result = await service.runFullImport(Buffer.from('S.No,Category\n'), 'company-1');
      expect(result.status).toBe('FAILED');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle CSV with only invalid rows', async () => {
      const badCsv = Buffer.from(
        'S.No,Category (Landing Page),Sub Category,Product / Service Name,Type,Unit Mapping,Alt / Secondary Units,Quantity Parameters\n' +
        '1,,,,' + '\n'
      );
      const result = await service.runFullImport(badCsv, 'company-1');
      expect(result.status).toBe('FAILED');
    });

    it('should create import job record', async () => {
      await service.runFullImport(validCsv, 'company-1');
      expect(prisma.importJob.create).toHaveBeenCalled();
      expect(prisma.importJob.update).toHaveBeenCalled();
    });

    it('should index products in search', async () => {
      const result = await service.runFullImport(validCsv, 'company-1');
      expect(result.searchIndexed).toBe(4);
      expect(searchService.indexDocument).toHaveBeenCalledTimes(4);
    });

    it('should create import job rows for each product', async () => {
      await service.runFullImport(validCsv, 'company-1');
      expect(prisma.importJobRow.create).toHaveBeenCalledTimes(4);
    });

    it('should handle db errors gracefully', async () => {
      prisma.product.create.mockRejectedValue(new Error('DB error'));
      const result = await service.runFullImport(validCsv, 'company-1');
      expect(result.status).toBe('FAILED');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('resumeImport', () => {
    it('should resume a failed job', async () => {
      prisma.importJob.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'FAILED',
        type: 'CATEGORY',
        rows: [
          {
            rawData: {
              serialNo: 1,
              category: 'Electronics',
              subCategory: 'Mobiles',
              name: 'Resume Product',
              type: 'Product',
              unit: 'Piece',
              altUnits: 'Box',
              quantityParams: '100',
            },
          },
        ],
      });

      prisma.importJob.create.mockResolvedValue({ id: 'job-1', status: 'RUNNING' });

      const result = await service.resumeImport('job-1', 'company-1');
      expect(result.status).toBe('COMPLETED');
      expect(result.productsCreated).toBeGreaterThan(0);
    });

    it('should return error for non-existent job', async () => {
      prisma.importJob.findUnique.mockResolvedValue(null);
      const result = await service.resumeImport('missing', 'company-1');
      expect(result.status).toBe('FAILED');
    });

    it('should not resume completed jobs', async () => {
      prisma.importJob.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'COMPLETED',
        rows: [],
      });
      const result = await service.resumeImport('job-1', 'company-1');
      expect(result.errors[0]).toContain('COMPLETED');
    });

    it('should handle job with no failed rows', async () => {
      prisma.importJob.findUnique.mockResolvedValue({
        id: 'job-1',
        status: 'PARTIAL',
        rows: [],
      });
      const result = await service.resumeImport('job-1', 'company-1');
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('Category creation', () => {
    it('should create unique categories from CSV', async () => {
      const result = await service.runFullImport(validCsv, 'company-1');
      expect(result.categoriesCreated).toBeGreaterThanOrEqual(3);
    });

    it('should use upsert to avoid duplicates', async () => {
      await service.runFullImport(validCsv, 'company-1');
      expect(prisma.category.upsert).toHaveBeenCalled();
    });
  });

  describe('Subcategory creation', () => {
    it('should create subcategories under parent categories', async () => {
      const result = await service.runFullImport(validCsv, 'company-1');
      expect(result.subcategoriesCreated).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Product/Service creation', () => {
    it('should create ProductMaster for Product type rows', async () => {
      const result = await service.runFullImport(validCsv, 'company-1');
      expect(result.productMastersCreated).toBe(3);
    });

    it('should create ServiceMaster for Service type rows', async () => {
      const result = await service.runFullImport(validCsv, 'company-1');
      expect(result.serviceMastersCreated).toBe(1);
    });

    it('should create actual Product records', async () => {
      const result = await service.runFullImport(validCsv, 'company-1');
      expect(result.productsCreated).toBe(4);
      expect(prisma.product.create).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error handling', () => {
    it('should return PARTIAL status on partial failures', async () => {
      prisma.product.create
        .mockResolvedValueOnce({ id: 'p1' })
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ id: 'p3' })
        .mockResolvedValueOnce({ id: 'p4' });

      const result = await service.runFullImport(validCsv, 'company-1');
      expect(result.status).toBe('PARTIAL');
    });
  });
});
