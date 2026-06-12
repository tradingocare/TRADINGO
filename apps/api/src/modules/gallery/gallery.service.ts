import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadGalleryImageDto } from './dto/upload-gallery-image.dto';
import { ReorderGalleryDto } from './dto/reorder-gallery.dto';
import { PlanType } from '@prisma/client';

const PLAN_LIMITS: Record<string, number> = {
  TRADE_START: 5,
  TRADE_SMART: 10,
  TRADE_PLUS: 15,
  TRADE_PRO: 20,
  TRADE_PREMIUM: 25,
  TRADE_ELITE: 25,
};

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getPlanLimit(plan: PlanType | null): number {
    if (plan && PLAN_LIMITS[plan]) return PLAN_LIMITS[plan];
    return 5;
  }

  async upload(companyId: string, dto: UploadGalleryImageDto, userId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      include: { galleryImages: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const limit = this.getPlanLimit(company.subscriptionPlan);
    if (company.galleryImages.length >= limit) {
      throw new ForbiddenException(`Gallery limit reached (${limit} images) for your plan`);
    }

    const image = await this.prisma.companyGalleryImage.create({
      data: {
        companyId,
        url: dto.url,
        title: dto.title,
        altText: dto.altText,
        sortOrder: dto.sortOrder ?? company.galleryImages.length,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPLOAD_GALLERY_IMAGE',
        resource: `gallery:${image.id}`,
        metadata: { companyId },
      },
    });

    return image;
  }

  async findAll(companyId: string) {
    return this.prisma.companyGalleryImage.findMany({
      where: { companyId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const image = await this.prisma.companyGalleryImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Gallery image not found');
    return image;
  }

  async remove(id: string, userId: string) {
    const image = await this.prisma.companyGalleryImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Gallery image not found');

    await this.prisma.companyGalleryImage.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_GALLERY_IMAGE',
        resource: `gallery:${id}`,
        metadata: { companyId: image.companyId },
      },
    });
  }

  async reorder(companyId: string, dto: ReorderGalleryDto, userId: string) {
    const updates = dto.images.map((img) =>
      this.prisma.companyGalleryImage.updateMany({
        where: { id: img.id, companyId },
        data: { sortOrder: img.sortOrder },
      }),
    );
    await this.prisma.$transaction(updates);

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REORDER_GALLERY',
        resource: `gallery:${companyId}`,
      },
    });

    return this.findAll(companyId);
  }

  async moderate(id: string, status: 'APPROVED' | 'REJECTED', _userId: string) {
    const image = await this.prisma.companyGalleryImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Gallery image not found');

    return this.prisma.companyGalleryImage.update({
      where: { id },
      data: { moderationStatus: status },
    });
  }
}
