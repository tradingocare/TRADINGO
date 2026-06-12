import { Test, TestingModule } from '@nestjs/testing';
import { CompanyLocationsService } from './company-locations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CompanyLocationsService', () => {
  let service: CompanyLocationsService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const mockLocation = {
    id: 'loc-1',
    companyId: 'company-1',
    type: 'HEAD_OFFICE',
    addressLine1: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    isPrimary: true,
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn() },
      companyLocation: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyLocationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CompanyLocationsService>(CompanyLocationsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a location for a company', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      prisma.companyLocation.create.mockResolvedValue(mockLocation);

      const result = await service.create({
        companyId: 'company-1',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
      }, 'user-1');
      expect(result.id).toBe('loc-1');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if company not found', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.create({
        companyId: 'unknown',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
      }, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should unset previous primary location when setting new primary', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      prisma.companyLocation.create.mockResolvedValue({ ...mockLocation, id: 'loc-2', isPrimary: true });

      await service.create({
        companyId: 'company-1',
        addressLine1: '456 Oak Ave',
        city: 'Delhi',
        state: 'Delhi',
        isPrimary: true,
      }, 'user-1');

      expect(prisma.companyLocation.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-1', isPrimary: true },
          data: { isPrimary: false },
        }),
      );
    });
  });

  describe('findByCompany', () => {
    it('should return all locations for a company', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
      prisma.companyLocation.findMany.mockResolvedValue([mockLocation]);

      const result = await service.findByCompany('company-1');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException if company not found', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      await expect(service.findByCompany('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return location by id', async () => {
      prisma.companyLocation.findFirst.mockResolvedValue(mockLocation);
      const result = await service.findById('loc-1');
      expect(result.id).toBe('loc-1');
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.companyLocation.findFirst.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update location', async () => {
      prisma.companyLocation.findFirst.mockResolvedValue(mockLocation);
      prisma.companyLocation.update.mockResolvedValue({ ...mockLocation, city: 'Pune' });

      const result = await service.update('loc-1', { city: 'Pune' }, 'user-1');
      expect(result.city).toBe('Pune');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.companyLocation.findFirst.mockResolvedValue(null);
      await expect(service.update('unknown', { city: 'Pune' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete location', async () => {
      prisma.companyLocation.findFirst.mockResolvedValue(mockLocation);
      await service.remove('loc-1', 'user-1');
      expect(prisma.companyLocation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { deletedAt: expect.any(Date) } }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.companyLocation.findFirst.mockResolvedValue(null);
      await expect(service.remove('unknown', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
