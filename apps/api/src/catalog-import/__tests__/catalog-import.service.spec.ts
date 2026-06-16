import { Test, TestingModule } from '@nestjs/testing';
import { CatalogImportService } from '../catalog-import.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('CatalogImportService', () => {
  let service: CatalogImportService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      importJob: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      importJobRow: {
        createMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        groupBy: jest.fn(),
        count: jest.fn(),
      },
      category: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      productMaster: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
      serviceMaster: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogImportService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CatalogImportService>(CatalogImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('retryImport', () => {
    it('should throw NotFoundException if job not found', async () => {
      prisma.importJob.findUnique.mockResolvedValue(null);
      await expect(service.retryImport('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if job status is not FAILED or PARTIAL', async () => {
      prisma.importJob.findUnique.mockResolvedValue({ id: 'job-1', status: 'COMPLETED', type: 'CATEGORY', rows: [] });
      await expect(service.retryImport('job-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if no failed rows', async () => {
      prisma.importJob.findUnique.mockResolvedValue({ id: 'job-1', status: 'FAILED', type: 'CATEGORY', rows: [] });
      await expect(service.retryImport('job-1')).rejects.toThrow(ConflictException);
    });

    it('should retry a FAILED job with failed rows', async () => {
      const rawData = { name: 'Test Category', description: 'Test' };
      prisma.importJob.findUnique.mockResolvedValue({ id: 'job-1', status: 'FAILED', type: 'CATEGORY', rows: [{ id: 'row-1', rawData, rowNumber: 1 }] });
      prisma.importJob.update.mockResolvedValue({ id: 'job-1', status: 'RUNNING' });
      const mockJob = { id: 'job-2', status: 'COMPLETED' };
      jest.spyOn(service, 'startImport').mockResolvedValue(mockJob as any);
      const result = await service.retryImport('job-1');
      expect(service.startImport).toHaveBeenCalledWith('CATEGORY', [rawData]);
      expect(result).toEqual(mockJob);
    });
  });

  describe('uploadFile', () => {
    it('should throw BadRequestException if no file', async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow(BadRequestException);
    });

    it('should return file info on success', async () => {
      const file = { originalname: 'test.csv', size: 100, mimetype: 'text/csv', buffer: Buffer.from('a,b,c\n1,2,3') } as any;
      const result = await service.uploadFile(file);
      expect(result.fileName).toBe('test.csv');
      expect(result.size).toBe(100);
      expect(result.mimeType).toBe('text/csv');
    });
  });

  describe('previewImport', () => {
    it('should throw BadRequestException if no data', async () => {
      await expect(service.previewImport('CATEGORY' as any, [])).rejects.toThrow(BadRequestException);
    });

    it('should return preview with row validation', async () => {
      const data = [{ name: 'Valid Category' }, { name: '' }];
      const result = await service.previewImport('CATEGORY' as any, data);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);
      expect(result.rows[0].valid).toBe(true);
      expect(result.rows[1].valid).toBe(false);
    });
  });

  describe('validateImport', () => {
    it('should throw BadRequestException if no data', async () => {
      await expect(service.validateImport('CATEGORY' as any, [])).rejects.toThrow(BadRequestException);
    });

    it('should return validation results', async () => {
      const data = [{ name: 'Valid' }, { name: 'Also Valid' }];
      const result = await service.validateImport('PRODUCT_MASTER' as any, data);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.isValid).toBe(true);
    });

    it('should flag invalid rows', async () => {
      const data = [{ name: 'Valid' }, { name: '' }];
      const result = await service.validateImport('CATEGORY' as any, data);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);
      expect(result.isValid).toBe(false);
    });
  });

  describe('getJobs', () => {
    it('should return jobs with pagination info', async () => {
      prisma.importJob.findMany.mockResolvedValue([{ id: 'job-1' }]);
      prisma.importJob.count.mockResolvedValue(1);
      const result = await service.getJobs({ limit: 10, page: 1 });
      expect(result.jobs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should support cursor-based pagination', async () => {
      prisma.importJob.findMany.mockResolvedValue([{ id: 'job-2' }]);
      prisma.importJob.count.mockResolvedValue(2);
      const result = await service.getJobs({ cursor: 'job-1', limit: 10 });
      expect(prisma.importJob.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'job-1' }, skip: 1 }));
      expect(result.jobs).toHaveLength(1);
    });
  });

  describe('startImport', () => {
    it('should throw ConflictException for empty data', async () => {
      await expect(service.startImport('CATEGORY' as any, [])).rejects.toThrow(ConflictException);
    });

    it('should process rows and create import job', async () => {
      prisma.importJob.create.mockResolvedValue({ id: 'job-1', status: 'RUNNING' });
      prisma.importJobRow.findFirst.mockResolvedValue(null);
      prisma.category.upsert.mockResolvedValue({ id: 'cat-1' });
      prisma.importJob.update.mockResolvedValue({ id: 'job-1', status: 'COMPLETED' });
      prisma.importJob.findUnique.mockResolvedValue({ id: 'job-1', status: 'COMPLETED', _count: { rows: 1 } });
      prisma.importJobRow.groupBy.mockResolvedValue([{ status: 'IMPORTED', _count: 1 }]);

      const result = await service.startImport('CATEGORY' as any, [{ name: 'Test Cat' }]);

      expect(prisma.importJob.create).toHaveBeenCalled();
      expect(prisma.importJobRow.createMany).toHaveBeenCalled();
      expect(prisma.importJob.update).toHaveBeenCalled();
    });
  });
});
