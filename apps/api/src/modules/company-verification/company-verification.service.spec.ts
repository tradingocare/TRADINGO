import { Test, TestingModule } from '@nestjs/testing';
import { CompanyVerificationService } from './company-verification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { VendorCodesService } from '../vendor-codes/vendor-codes.service';

describe('CompanyVerificationService', () => {
  let service: CompanyVerificationService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      companyOwner: { findUnique: jest.fn() },
      companyVerification: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      auditLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyVerificationService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: VendorCodesService,
          useValue: { generateVendorCode: jest.fn().mockResolvedValue('TRV000001') },
        },
      ],
    }).compile();

    service = module.get<CompanyVerificationService>(CompanyVerificationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('submit', () => {
    it('should submit a verification request', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1', verificationLevel: 'LEVEL_0' });
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });
      prisma.companyVerification.findFirst.mockResolvedValue(null);
      prisma.companyVerification.create.mockResolvedValue({
        id: 'ver-1',
        companyId: 'company-1',
        level: 'LEVEL_1',
        status: 'PENDING',
        documents: [],
      });

      const result = await service.submit({
        companyId: 'company-1',
        level: 'LEVEL_1',
        documents: [{ documentType: 'PAN', documentUrl: 'https://s3.example.com/doc.pdf' }],
      }, 'user-1');
      expect(result.id).toBe('ver-1');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if company not found', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.submit({
        companyId: 'unknown',
        level: 'LEVEL_1',
        documents: [],
      }, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not an owner', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1', verificationLevel: 'LEVEL_0' });
      prisma.companyOwner.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });

      await expect(service.submit({
        companyId: 'company-1',
        level: 'LEVEL_1',
        documents: [],
      }, 'user-2')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if pending verification exists', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1', verificationLevel: 'LEVEL_0' });
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });
      prisma.companyVerification.findFirst.mockResolvedValue({ id: 'pending-ver' });

      await expect(service.submit({
        companyId: 'company-1',
        level: 'LEVEL_1',
        documents: [],
      }, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('review', () => {
    it('should approve verification and update company level', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.companyVerification.findUnique.mockResolvedValue({
        id: 'ver-1',
        status: 'PENDING',
        level: 'LEVEL_3',
        companyId: 'company-1',
        submittedBy: 'user-1',
        company: { id: 'company-1', verificationLevel: 'LEVEL_0', slug: 'test-company' },
      });
      prisma.companyVerification.update.mockResolvedValue({
        id: 'ver-1',
        status: 'APPROVED',
        level: 'LEVEL_3',
        companyId: 'company-1',
        submittedBy: 'user-1',
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
        notes: 'All documents verified',
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.review('ver-1', { status: 'APPROVED', notes: 'All documents verified' }, 'admin-1');
      expect(result.status).toBe('APPROVED');
      expect(prisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ verificationLevel: 'LEVEL_3' }) }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'APPROVE_COMPANY_VERIFICATION' }) }),
      );
    });

    it('should reject verification without changing level', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.companyVerification.findUnique.mockResolvedValue({
        id: 'ver-1',
        status: 'PENDING',
        level: 'LEVEL_3',
        company: { id: 'company-1', verificationLevel: 'LEVEL_0', slug: 'test-company' },
      });

      await service.review('ver-1', { status: 'REJECTED', notes: 'Invalid documents' }, 'admin-1');
      expect(prisma.company.update).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'REJECT_COMPANY_VERIFICATION' }) }),
      );
    });

    it('should throw ForbiddenException for non-admin reviewers', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'VIEWER' });
      await expect(service.review('ver-1', { status: 'APPROVED', notes: 'OK' }, 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if already reviewed', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      prisma.companyVerification.findUnique.mockResolvedValue({
        id: 'ver-1',
        status: 'APPROVED',
        level: 'LEVEL_3',
        company: { id: 'company-1', verificationLevel: 'LEVEL_0', slug: 'test-company' },
      });
      await expect(service.review('ver-1', { status: 'REJECTED', notes: 'Already done' }, 'admin-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findByCompany', () => {
    it('should return verifications for a company', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      prisma.companyVerification.findMany.mockResolvedValue([{ id: 'ver-1', status: 'APPROVED' }]);

      const result = await service.findByCompany('company-1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if company not found', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.findByCompany('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated verifications', async () => {
      prisma.companyVerification.findMany.mockResolvedValue([{ id: 'ver-1', status: 'PENDING' }]);
      prisma.companyVerification.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
