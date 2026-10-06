import { Test, TestingModule } from '@nestjs/testing';
import { CompanyVerificationController } from './company-verification.controller';
import { CompanyVerificationService } from './company-verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CanActivate } from '@nestjs/common';

describe('CompanyVerificationController', () => {
  let controller: CompanyVerificationController;
  let service: Record<string, jest.Mock>;
  let storageService: { generatePresignedUrl: jest.Mock; extractKeyFromUrl: jest.Mock };

  beforeEach(async () => {
    service = {
      submit: jest.fn(),
      findAll: jest.fn(),
      findByCompany: jest.fn(),
      findById: jest.fn(),
      findAuthorizedById: jest.fn(),
      getDocumentForAuthorizedAccess: jest.fn(),
      review: jest.fn(),
    };

    storageService = {
      generatePresignedUrl: jest.fn().mockResolvedValue('https://presigned.example.com/doc.pdf'),
      extractKeyFromUrl: jest.fn().mockReturnValue('vendor/pan/user-1/doc.pdf'),
    };

    const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyVerificationController],
      providers: [
        { provide: CompanyVerificationService, useValue: service },
        { provide: PrismaService, useValue: { companyOwner: { findFirst: jest.fn() } } },
        { provide: StorageService, useValue: storageService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(CompanyOwnerGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CompanyVerificationController>(CompanyVerificationController);
  });

  it('should submit', async () => {
    service.submit.mockResolvedValue({ id: '1', status: 'PENDING' });
    const result = await controller.submit({ companyId: 'comp-1' } as any, 'user-1');
    expect(result.status).toBe('PENDING');
  });

  it('should findAll', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
    const result = await controller.findAll({});
    expect(result.meta.total).toBe(0);
  });

  it('should findByCompany', async () => {
    service.findByCompany.mockResolvedValue([{ id: '1' }]);
    const result = await controller.findByCompany('comp-1');
    expect(result).toHaveLength(1);
  });

  it('should findOne (P0-1: ownership-scoped via service)', async () => {
    service.findAuthorizedById.mockResolvedValue({ id: '1' });
    const result = await controller.findOne('1', { sub: 'user-1', role: 'BUYER' });
    expect(result.id).toBe('1');
    expect(service.findAuthorizedById).toHaveBeenCalledWith('1', 'user-1', 'BUYER');
  });

  it('should review', async () => {
    service.review.mockResolvedValue({ id: '1', status: 'APPROVED' });
    const result = await controller.review('1', { status: 'APPROVED' } as any, 'user-1');
    expect(result.status).toBe('APPROVED');
  });

  describe('getDocumentAccess (P0-1)', () => {
    it('presigns a 5-minute URL after the service authorization check passes', async () => {
      service.getDocumentForAuthorizedAccess.mockResolvedValue({
        documentUrl: 'https://tradingo-test.s3.ap-south-1.amazonaws.com/vendor/pan/user-1/doc.pdf',
        companyId: 'company-1',
      });

      const result = await controller.getDocumentAccess('ver-1', 'doc-1', { sub: 'admin-1', role: 'ADMIN' });

      expect(service.getDocumentForAuthorizedAccess).toHaveBeenCalledWith('ver-1', 'doc-1', 'admin-1', 'ADMIN');
      expect(storageService.extractKeyFromUrl).toHaveBeenCalledWith('https://tradingo-test.s3.ap-south-1.amazonaws.com/vendor/pan/user-1/doc.pdf');
      expect(storageService.generatePresignedUrl).toHaveBeenCalledWith('vendor/pan/user-1/doc.pdf', 300);
      expect(result).toEqual({ url: 'https://presigned.example.com/doc.pdf', expiresIn: 300 });
    });

    it('returns the stored URL as-is (no presign attempt) for non-S3 external URLs', async () => {
      service.getDocumentForAuthorizedAccess.mockResolvedValue({
        documentUrl: 'https://external.example.com/doc.pdf',
        companyId: 'company-1',
      });
      storageService.extractKeyFromUrl.mockReturnValue(null);

      const result = await controller.getDocumentAccess('ver-1', 'doc-1', { sub: 'admin-1', role: 'ADMIN' });

      expect(storageService.generatePresignedUrl).not.toHaveBeenCalled();
      expect(result).toEqual({ url: 'https://external.example.com/doc.pdf', expiresIn: 0 });
    });
  });
});
