import { Test, TestingModule } from '@nestjs/testing';
import { CatalogImportController } from '../catalog-import.controller';
import { CatalogImportService } from '../catalog-import.service';
import { CsvParserService } from '../services/csv-parser.service';
import { ImportOrchestratorService } from '../services/import-orchestrator.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CanActivate, BadRequestException } from '@nestjs/common';
import { ImportJobType } from '@prisma/client';

describe('CatalogImportController', () => {
  let controller: CatalogImportController;
  let service: Record<string, jest.Mock>;
  let csvParser: Record<string, jest.Mock>;
  let orchestrator: Record<string, jest.Mock>;

  const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    service = {
      startImport: jest.fn(),
      retryImport: jest.fn(),
      rollbackImport: jest.fn(),
      getJob: jest.fn(),
      getJobs: jest.fn(),
      getJobStats: jest.fn(),
      searchCatalog: jest.fn(),
      uploadFile: jest.fn(),
      previewImport: jest.fn(),
      validateImport: jest.fn(),
    };

    csvParser = {
      parse: jest.fn(),
    };

    orchestrator = {
      runFullImport: jest.fn(),
      resumeImport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogImportController],
      providers: [
        { provide: CatalogImportService, useValue: service },
        { provide: CsvParserService, useValue: csvParser },
        { provide: ImportOrchestratorService, useValue: orchestrator },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CatalogImportController>(CatalogImportController);
  });

  describe('Module registration', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('POST /catalog-import/import', () => {
    it('should start import', async () => {
      const result = { id: 'job-1', status: 'RUNNING' };
      service.startImport.mockResolvedValue(result);
      const response = await controller.startImport({ type: 'CATEGORY' as ImportJobType, data: [{ name: 'Test' }] });
      expect(service.startImport).toHaveBeenCalledWith('CATEGORY', [{ name: 'Test' }]);
      expect(response).toEqual(result);
    });
  });

  describe('POST /catalog-import/start', () => {
    it('should start import via alias', async () => {
      const result = { id: 'job-2', status: 'RUNNING' };
      service.startImport.mockResolvedValue(result);
      const response = await controller.startImportAlias({ type: 'PRODUCT_MASTER' as ImportJobType, data: [{ name: 'Widget' }] });
      expect(service.startImport).toHaveBeenCalledWith('PRODUCT_MASTER', [{ name: 'Widget' }]);
      expect(response).toEqual(result);
    });

    it('should default data to empty array', async () => {
      await controller.startImportAlias({ type: 'CATEGORY' as ImportJobType });
      expect(service.startImport).toHaveBeenCalledWith('CATEGORY', []);
    });
  });

  describe('POST /catalog-import/csv-import', () => {
    it('should import CSV file', async () => {
      const result = { jobId: 'job-1', status: 'COMPLETED', productsCreated: 100 };
      orchestrator.runFullImport.mockResolvedValue(result);
      const file = { buffer: Buffer.from('csv,data') } as any;
      const response = await controller.importCsv(file, 'company-1', { companyId: 'company-1' });
      expect(orchestrator.runFullImport).toHaveBeenCalledWith(file.buffer, 'company-1');
      expect(response).toEqual(result);
    });

    it('should use user companyId when not provided', async () => {
      const result = { jobId: 'job-1', status: 'COMPLETED' };
      orchestrator.runFullImport.mockResolvedValue(result);
      const file = { buffer: Buffer.from('csv,data') } as any;
      const response = await controller.importCsv(file, undefined, { companyId: 'user-company' });
      expect(orchestrator.runFullImport).toHaveBeenCalledWith(file.buffer, 'user-company');
    });

    it('should throw BadRequestException when no companyId', async () => {
      const file = { buffer: Buffer.from('csv,data') } as any;
      await expect(controller.importCsv(file, undefined, {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no file', async () => {
      await expect(controller.importCsv(null as any, 'company-1', {} as any)).rejects.toThrow('CSV file is required');
    });
  });

  describe('POST /catalog-import/csv-import/:jobId/resume', () => {
    it('should resume import', async () => {
      const result = { jobId: 'job-1', status: 'COMPLETED' };
      orchestrator.resumeImport.mockResolvedValue(result);
      const response = await controller.resumeImport('job-1', 'company-1', { companyId: 'company-1' });
      expect(orchestrator.resumeImport).toHaveBeenCalledWith('job-1', 'company-1');
      expect(response).toEqual(result);
    });

    it('should use user companyId when not provided', async () => {
      orchestrator.resumeImport.mockResolvedValue({ jobId: 'job-1', status: 'COMPLETED' });
      await controller.resumeImport('job-1', undefined, { companyId: 'user-company' });
      expect(orchestrator.resumeImport).toHaveBeenCalledWith('job-1', 'user-company');
    });

    it('should throw when no companyId available', async () => {
      await expect(controller.resumeImport('job-1', undefined, {} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /catalog-import/csv-preview', () => {
    it('should preview CSV file', async () => {
      csvParser.parse.mockReturnValue({
        totalRows: 100,
        validRows: 95,
        invalidRows: 5,
        categories: ['Cat1', 'Cat2'],
        subcategories: new Map([['Cat1', ['Sub1']]]),
        products: [{ name: 'P1' }],
        services: [{ name: 'S1' }],
        rows: [{ name: 'P1' }, { name: 'P2' }],
        errors: [{ row: 10, message: 'Invalid' }],
      });

      const file = { buffer: Buffer.from('csv') } as any;
      const response = await controller.previewCsv(file);

      expect(response.totalRows).toBe(100);
      expect(response.validRows).toBe(95);
      expect(response.products).toBe(1);
      expect(response.services).toBe(1);
    });

    it('should throw when no file', async () => {
      await expect(controller.previewCsv(null as any)).rejects.toThrow('CSV file is required');
    });
  });

  describe('GET /catalog-import/jobs', () => {
    it('should list jobs with new route', async () => {
      const result = { jobs: [], total: 0, page: 1, limit: 20 };
      service.getJobs.mockResolvedValue(result);
      const response = await controller.getJobsNew(undefined, undefined, undefined, '10', '1');
      expect(service.getJobs).toHaveBeenCalledWith({ limit: 10, page: 1 });
      expect(response).toEqual(result);
    });
  });

  describe('GET /catalog-import/import (backward compat)', () => {
    it('should list jobs with old route', async () => {
      const result = { jobs: [], total: 0, page: 1, limit: 20 };
      service.getJobs.mockResolvedValue(result);
      const response = await controller.getJobs(undefined, undefined, undefined, undefined, '1');
      expect(service.getJobs).toHaveBeenCalledWith({ limit: 20, page: 1 });
      expect(response).toEqual(result);
    });
  });

  describe('GET /catalog-import/jobs/:id', () => {
    it('should get job by id via new route', async () => {
      const result = { id: 'job-1', status: 'COMPLETED' };
      service.getJob.mockResolvedValue(result);
      const response = await controller.getJobNew('job-1');
      expect(service.getJob).toHaveBeenCalledWith('job-1');
      expect(response).toEqual(result);
    });
  });

  describe('GET /catalog-import/import/:id (backward compat)', () => {
    it('should get job by id via old route', async () => {
      const result = { id: 'job-1', status: 'COMPLETED' };
      service.getJob.mockResolvedValue(result);
      const response = await controller.getJob('job-1');
      expect(service.getJob).toHaveBeenCalledWith('job-1');
      expect(response).toEqual(result);
    });
  });

  describe('POST /catalog-import/jobs/:id/rollback', () => {
    it('should rollback import via new route', async () => {
      const result = { id: 'job-1', status: 'ROLLED_BACK' };
      service.rollbackImport.mockResolvedValue(result);
      const response = await controller.rollbackImportNew('job-1');
      expect(service.rollbackImport).toHaveBeenCalledWith('job-1');
      expect(response).toEqual(result);
    });
  });

  describe('POST /catalog-import/import/:id/rollback (backward compat)', () => {
    it('should rollback import via old route', async () => {
      const result = { id: 'job-1', status: 'ROLLED_BACK' };
      service.rollbackImport.mockResolvedValue(result);
      const response = await controller.rollbackImport('job-1');
      expect(service.rollbackImport).toHaveBeenCalledWith('job-1');
      expect(response).toEqual(result);
    });
  });

  describe('POST /catalog-import/jobs/:id/retry', () => {
    it('should retry import', async () => {
      const result = { id: 'job-1', status: 'RUNNING' };
      service.retryImport.mockResolvedValue(result);
      const response = await controller.retryImport('job-1');
      expect(service.retryImport).toHaveBeenCalledWith('job-1');
      expect(response).toEqual(result);
    });
  });

  describe('POST /catalog-import/upload', () => {
    it('should accept file upload', async () => {
      const result = { fileName: 'test.csv', size: 100, mimeType: 'text/csv', message: 'File uploaded successfully.' };
      service.uploadFile.mockResolvedValue(result);
      const file = { originalname: 'test.csv', size: 100, mimetype: 'text/csv', buffer: Buffer.from('') } as any;
      const response = await controller.uploadFile(file);
      expect(service.uploadFile).toHaveBeenCalledWith(file);
      expect(response).toEqual(result);
    });
  });

  describe('POST /catalog-import/preview', () => {
    it('should preview import data', async () => {
      const result = { type: 'CATEGORY', totalRows: 1, validRows: 1, invalidRows: 0, rows: [] };
      service.previewImport.mockResolvedValue(result);
      const response = await controller.previewImport({ type: 'CATEGORY' as ImportJobType, data: [{ name: 'Test' }] });
      expect(service.previewImport).toHaveBeenCalledWith('CATEGORY', [{ name: 'Test' }]);
      expect(response).toEqual(result);
    });
  });

  describe('POST /catalog-import/validate', () => {
    it('should validate import data', async () => {
      const result = { type: 'CATEGORY', totalRows: 1, validRows: 1, invalidRows: 0, isValid: true, rows: [] };
      service.validateImport.mockResolvedValue(result);
      const response = await controller.validateImport({ type: 'CATEGORY' as ImportJobType, data: [{ name: 'Test' }] });
      expect(service.validateImport).toHaveBeenCalledWith('CATEGORY', [{ name: 'Test' }]);
      expect(response).toEqual(result);
    });
  });

  describe('GET /catalog-import/stats', () => {
    it('should return stats', async () => {
      const result = { totalJobs: 5, totalRows: 100, totalImported: 80 };
      service.getJobStats.mockResolvedValue(result);
      const response = await controller.getStats();
      expect(service.getJobStats).toHaveBeenCalled();
      expect(response).toEqual(result);
    });
  });

  describe('GET /catalog-import/search', () => {
    it('should search catalog', async () => {
      const result = { products: [], services: [] };
      service.searchCatalog.mockResolvedValue(result);
      const response = await controller.searchCatalog('widget', 'PRODUCT', undefined, undefined, undefined, '20');
      expect(service.searchCatalog).toHaveBeenCalledWith('widget', { type: 'PRODUCT', limit: 20 });
      expect(response).toEqual(result);
    });
  });
});
