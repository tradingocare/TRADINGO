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
      companyVerificationDocument: { findUnique: jest.fn() },
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

  // ── P0-1: cross-tenant + masking security ─────────────────────────────
  describe('P0-1 masking (real DocumentType enum)', () => {
    const verificationWithDocs = (types: string[]) => ({
      id: 'ver-1',
      documents: types.map((t, i) => ({ id: `doc-${i}`, documentType: t, documentUrl: 'https://s3.example.com/secret.pdf' })),
    });

    it.each([
      'PAN', 'GST', 'AADHAAR', 'BUSINESS_REGISTRATION', 'CANCELLED_CHEQUE',
      'BANK_VERIFICATION', 'LIABILITY_INSURANCE', 'PROFESSIONAL_MEMBERSHIP',
      'CLIENT_REFERENCE', 'EXPERIENCE_LETTER',
    ])('masks %s document URLs (previously GST/cheque/bank slipped through)', async (type) => {
      prisma.companyVerification.findUnique.mockResolvedValue(verificationWithDocs([type]));
      const result = await service.findById('ver-1');
      expect(result.documents[0].documentUrl).toBe('[MASKED]');
    });

    it('masks every sensitive doc in a mixed document set', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue(
        verificationWithDocs(['PAN', 'GST', 'CANCELLED_CHEQUE', 'BANK_VERIFICATION']),
      );
      const result = await service.findById('ver-1');
      result.documents.forEach((d: any) => expect(d.documentUrl).toBe('[MASKED]'));
    });

    it('does not mask non-sensitive portfolio documents', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue(verificationWithDocs(['PORTFOLIO_SAMPLE']));
      const result = await service.findById('ver-1');
      expect(result.documents[0].documentUrl).toBe('https://s3.example.com/secret.pdf');
    });

    it('masks across list results (findByCompany)', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      prisma.companyVerification.findMany.mockResolvedValue([verificationWithDocs(['GST'])]);
      const result = await service.findByCompany('company-1');
      expect(result[0].documents[0].documentUrl).toBe('[MASKED]');
    });
  });

  describe('P0-1 findAuthorizedById (cross-tenant read elimination)', () => {
    const baseVerification = {
      id: 'ver-1',
      companyId: 'company-A',
      documents: [{ id: 'doc-1', documentType: 'PAN', documentUrl: 'https://s3.example.com/pan.pdf' }],
      company: { id: 'company-A', name: 'A', slug: 'a' },
    };

    it('admin reads any verification', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue(baseVerification);
      const result = await service.findAuthorizedById('ver-1', 'admin-1', 'ADMIN');
      expect(result.id).toBe('ver-1');
      expect(prisma.companyOwner.findUnique).not.toHaveBeenCalled();
    });

    it('SUPER_ADMIN reads any verification', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue(baseVerification);
      await service.findAuthorizedById('ver-1', 'root-1', 'SUPER_ADMIN');
      expect(prisma.companyOwner.findUnique).not.toHaveBeenCalled();
    });

    it('company owner reads their own verification', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue(baseVerification);
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });
      const result = await service.findAuthorizedById('ver-1', 'owner-user', 'SELLER');
      expect(result.id).toBe('ver-1');
      expect(prisma.companyOwner.findUnique).toHaveBeenCalledWith({
        where: { companyId_userId: { companyId: 'company-A', userId: 'owner-user' } },
        select: { id: true },
      });
    });

    it('another company user gets 404 — no existence disclosure', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue(baseVerification);
      prisma.companyOwner.findUnique.mockResolvedValue(null);
      await expect(
        service.findAuthorizedById('ver-1', 'buyer-user', 'BUYER'),
      ).rejects.toThrow(NotFoundException);
    });

    it('unknown verification id → 404 before any ownership check', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue(null);
      await expect(
        service.findAuthorizedById('missing', 'user-1', 'BUYER'),
      ).rejects.toThrow(NotFoundException);
    });

    it('sensitive document URLs remain masked for the owner too (access is via presigned endpoint only)', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue(baseVerification);
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });
      const result = await service.findAuthorizedById('ver-1', 'owner-user', 'SELLER');
      expect(result.documents[0].documentUrl).toBe('[MASKED]');
    });
  });

  describe('P0-1 getDocumentForAuthorizedAccess', () => {
    it('admin gets the raw document URL for presigning', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue({ companyId: 'company-A' });
      prisma.companyVerificationDocument.findUnique.mockResolvedValue({
        documentUrl: 'https://s3.example.com/pan.pdf',
        verificationId: 'ver-1',
      });
      const result = await service.getDocumentForAuthorizedAccess('ver-1', 'doc-1', 'admin-1', 'ADMIN');
      expect(result.documentUrl).toBe('https://s3.example.com/pan.pdf');
      expect(result.companyId).toBe('company-A');
    });

    it('company owner gets their own document URL', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue({ companyId: 'company-A' });
      prisma.companyOwner.findUnique.mockResolvedValue({ id: 'owner-1' });
      prisma.companyVerificationDocument.findUnique.mockResolvedValue({
        documentUrl: 'https://s3.example.com/pan.pdf',
        verificationId: 'ver-1',
      });
      const result = await service.getDocumentForAuthorizedAccess('ver-1', 'doc-1', 'owner-user', 'SELLER');
      expect(result.documentUrl).toBe('https://s3.example.com/pan.pdf');
    });

    it('another company user gets 404', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue({ companyId: 'company-A' });
      prisma.companyOwner.findUnique.mockResolvedValue(null);
      await expect(
        service.getDocumentForAuthorizedAccess('ver-1', 'doc-1', 'buyer-user', 'BUYER'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.companyVerificationDocument.findUnique).not.toHaveBeenCalled();
    });

    it('document of a DIFFERENT verification cannot be fetched through this verification id', async () => {
      prisma.companyVerification.findUnique.mockResolvedValue({ companyId: 'company-A' });
      prisma.companyVerificationDocument.findUnique.mockResolvedValue({
        documentUrl: 'https://s3.example.com/other.pdf',
        verificationId: 'ver-OTHER', // mismatch — cross-verification attachment blocked
      });
      await expect(
        service.getDocumentForAuthorizedAccess('ver-1', 'doc-of-other', 'admin-1', 'ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
