import { Test, TestingModule } from '@nestjs/testing';
import { CertificationsService } from './certifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CertificationsService', () => {
  let service: CertificationsService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      companyCertification: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), updateMany: jest.fn() },
      auditLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CertificationsService>(CertificationsService);
  });

  describe('create', () => {
    it('should create certification', async () => {
      prisma.companyCertification.create.mockResolvedValue({ id: 'cert1', type: 'ISO', companyId: 'c1' } as any);
      const result = await service.create('c1', { type: 'ISO' as any, documentUrl: 'https://example.com/cert.pdf' }, 'user-1');
      expect(result.id).toBe('cert1');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all certifications for company', async () => {
      prisma.companyCertification.findMany.mockResolvedValue([{ id: 'cert1' }, { id: 'cert2' }]);
      const result = await service.findAll('c1');
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return certification if found', async () => {
      prisma.companyCertification.findUnique.mockResolvedValue({ id: 'cert1' } as any);
      const result = await service.findById('cert1');
      expect(result.id).toBe('cert1');
    });

    it('should throw if not found', async () => {
      prisma.companyCertification.findUnique.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow('Certification not found');
    });
  });

  describe('update', () => {
    it('should update certification fields', async () => {
      prisma.companyCertification.findUnique.mockResolvedValue({ id: 'cert1', companyId: 'c1' } as any);
      prisma.companyCertification.update.mockResolvedValue({ id: 'cert1', status: 'APPROVED' } as any);
      const result = await service.update('cert1', { status: 'APPROVED' as any }, 'user-1');
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('remove', () => {
    it('should delete certification', async () => {
      prisma.companyCertification.findUnique.mockResolvedValue({ id: 'cert1', companyId: 'c1' } as any);
      await service.remove('cert1', 'user-1');
      expect(prisma.companyCertification.delete).toHaveBeenCalledWith({ where: { id: 'cert1' } });
    });
  });

  describe('expireOutdated', () => {
    it('should expire outdated certifications', async () => {
      prisma.companyCertification.updateMany.mockResolvedValue({ count: 3 } as any);
      const count = await service.expireOutdated();
      expect(count).toBe(3);
    });
  });

  describe('review', () => {
    it('should approve certification', async () => {
      prisma.companyCertification.findUnique.mockResolvedValue({ id: 'cert1' } as any);
      prisma.companyCertification.update.mockResolvedValue({ id: 'cert1', status: 'APPROVED' } as any);
      const result = await service.review('cert1', 'APPROVED', 'Looks good', 'admin-1');
      expect(result.status).toBe('APPROVED');
    });
  });
});
