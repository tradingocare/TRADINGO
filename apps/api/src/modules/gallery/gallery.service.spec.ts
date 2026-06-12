import { Test, TestingModule } from '@nestjs/testing';
import { GalleryService } from './gallery.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GalleryService', () => {
  let service: GalleryService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn() },
      companyGalleryImage: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), updateMany: jest.fn() },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GalleryService>(GalleryService);
  });

  describe('upload', () => {
    it('should upload image within plan limit', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'c1', subscriptionPlan: 'TRADE_PRO', galleryImages: [{ id: 'img1' }, { id: 'img2' }] });
      prisma.companyGalleryImage.create.mockResolvedValue({ id: 'img3', url: 'https://example.com/img.jpg' } as any);
      const result = await service.upload('c1', { url: 'https://example.com/img.jpg' }, 'user-1');
      expect(result.id).toBe('img3');
    });

    it('should throw when plan limit reached', async () => {
      const images = Array(20).fill(null).map((_, i) => ({ id: `img${i}` }));
      prisma.company.findFirst.mockResolvedValue({ id: 'c1', subscriptionPlan: 'TRADE_PRO', galleryImages: images });
      await expect(service.upload('c1', { url: 'test.jpg' }, 'user-1')).rejects.toThrow('Gallery limit reached');
    });
  });

  describe('findAll', () => {
    it('should return images sorted by sortOrder', async () => {
      prisma.companyGalleryImage.findMany.mockResolvedValue([{ id: 'img1', sortOrder: 0 }, { id: 'img2', sortOrder: 1 }]);
      const result = await service.findAll('c1');
      expect(result).toHaveLength(2);
    });
  });

  describe('remove', () => {
    it('should delete image', async () => {
      prisma.companyGalleryImage.findUnique.mockResolvedValue({ id: 'img1', companyId: 'c1' } as any);
      await service.remove('img1', 'user-1');
      expect(prisma.companyGalleryImage.delete).toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('should update sort orders', async () => {
      prisma.companyGalleryImage.updateMany.mockResolvedValue({} as any);
      prisma.companyGalleryImage.findMany.mockResolvedValue([]);
      prisma.$transaction.mockResolvedValue([]);
      await service.reorder('c1', { images: [{ id: 'img1', sortOrder: 1 }] }, 'user-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('moderate', () => {
    it('should update moderation status', async () => {
      prisma.companyGalleryImage.findUnique.mockResolvedValue({ id: 'img1' } as any);
      prisma.companyGalleryImage.update.mockResolvedValue({ id: 'img1', moderationStatus: 'APPROVED' } as any);
      const result = await service.moderate('img1', 'APPROVED', 'admin-1');
      expect(result.moderationStatus).toBe('APPROVED');
    });
  });
});
