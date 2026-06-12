import { Test, TestingModule } from '@nestjs/testing';
import { IndustriesService } from './industries.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('IndustriesService', () => {
  let service: IndustriesService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const mockIndustry = {
    id: 'ind-1', name: 'Technology', slug: 'technology',
    description: null, icon: null, deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      industry: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndustriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<IndustriesService>(IndustriesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create an industry with generated slug', async () => {
      prisma.industry.findUnique.mockResolvedValue(null);
      prisma.industry.create.mockResolvedValue(mockIndustry);

      const result = await service.create({ name: 'Technology' }, 'user-1');
      expect(result.name).toBe('Technology');
      expect(result.slug).toBe('technology');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'INDUSTRY_CREATED' }) }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      prisma.industry.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.create({ name: 'Technology', slug: 'tech' }, 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated industries', async () => {
      prisma.industry.findMany.mockResolvedValue([mockIndustry]);
      prisma.industry.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search', async () => {
      prisma.industry.findMany.mockResolvedValue([mockIndustry]);
      prisma.industry.count.mockResolvedValue(1);

      await service.findAll({ search: 'Tech' });
      expect(prisma.industry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Tech', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return industry', async () => {
      prisma.industry.findUnique.mockResolvedValue({ ...mockIndustry, _count: { companies: 0, products: 0 } });
      const result = await service.findById('ind-1');
      expect(result.id).toBe('ind-1');
    });

    it('should throw NotFoundException', async () => {
      prisma.industry.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return industry by slug', async () => {
      prisma.industry.findUnique.mockResolvedValue({ ...mockIndustry, _count: { companies: 0, products: 0 } });
      const result = await service.findBySlug('technology');
      expect(result.id).toBe('ind-1');
    });

    it('should throw NotFoundException', async () => {
      prisma.industry.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update industry', async () => {
      prisma.industry.findUnique.mockResolvedValue(mockIndustry);
      prisma.industry.update.mockResolvedValue({ ...mockIndustry, name: 'Updated Tech' });

      const result = await service.update('ind-1', { name: 'Updated Tech' }, 'user-1');
      expect(result.name).toBe('Updated Tech');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'INDUSTRY_UPDATED' }) }),
      );
    });

    it('should throw NotFoundException', async () => {
      prisma.industry.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', { name: 'Updated' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete industry', async () => {
      prisma.industry.findUnique.mockResolvedValue({ ...mockIndustry, _count: { companies: 0, products: 0 } });
      await service.remove('ind-1', 'user-1');
      expect(prisma.industry.delete).toHaveBeenCalledWith({ where: { id: 'ind-1' } });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if has companies', async () => {
      prisma.industry.findUnique.mockResolvedValue({ ...mockIndustry, _count: { companies: 2, products: 0 } });
      await expect(service.remove('ind-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if has products', async () => {
      prisma.industry.findUnique.mockResolvedValue({ ...mockIndustry, _count: { companies: 0, products: 3 } });
      await expect(service.remove('ind-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException', async () => {
      prisma.industry.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
