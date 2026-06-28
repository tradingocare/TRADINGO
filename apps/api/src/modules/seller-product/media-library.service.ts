import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaLibraryService {
  private readonly logger = new Logger(MediaLibraryService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({ where: { userId }, include: { company: true } });
    if (!owner) throw new ForbiddenException('Company not found');
    return owner.company;
  }

  async listMedia(userId: string, folderId?: string, page = 1, limit = 50) {
    const company = await this.resolveCompany(userId);
    const skip = (page - 1) * limit;
    const where: any = { product: { companyId: company.id, deletedAt: null } };
    if (folderId) where.folderId = folderId;

    const [data, total] = await Promise.all([
      this.prisma.productMedia.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.productMedia.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async uploadMedia(userId: string, dto: { url: string; type?: string; title?: string; altText?: string; isPrimary?: boolean; productId?: string; folderId?: string }) {
    const company = await this.resolveCompany(userId);
    if (dto.productId) {
      const product = await this.prisma.product.findFirst({ where: { id: dto.productId, companyId: company.id } });
      if (!product) throw new NotFoundException('Product not found');
    }
    const media = await this.prisma.productMedia.create({
      data: {
        productId: dto.productId || '',
        folderId: dto.folderId,
        type: (dto.type as any) || 'IMAGE',
        url: dto.url,
        title: dto.title,
        altText: dto.altText,
        isPrimary: dto.isPrimary || false,
      },
    });
    return media;
  }

  async updateMedia(userId: string, mediaId: string, dto: { title?: string; altText?: string; isPrimary?: boolean; folderId?: string }) {
    const company = await this.resolveCompany(userId);
    const media = await this.prisma.productMedia.findFirst({
      where: { id: mediaId, product: { companyId: company.id } },
    });
    if (!media) throw new NotFoundException('Media not found');
    return this.prisma.productMedia.update({ where: { id: mediaId }, data: dto as any });
  }

  async deleteMedia(userId: string, mediaId: string) {
    const company = await this.resolveCompany(userId);
    const media = await this.prisma.productMedia.findFirst({
      where: { id: mediaId, product: { companyId: company.id } },
    });
    if (!media) throw new NotFoundException('Media not found');
    await this.prisma.productMedia.delete({ where: { id: mediaId } });
    return { success: true };
  }

  async reorderMedia(userId: string, items: { id: string; sortOrder: number }[]) {
    const company = await this.resolveCompany(userId);
    for (const item of items) {
      await this.prisma.productMedia.updateMany({
        where: { id: item.id, product: { companyId: company.id } },
        data: { sortOrder: item.sortOrder },
      });
    }
    return { success: true };
  }

  async listFolders(userId: string) {
    const company = await this.resolveCompany(userId);
    return this.prisma.mediaFolder.findMany({
      where: { companyId: company.id },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { media: true, children: true } } },
    });
  }

  async createFolder(userId: string, dto: { name: string; parentId?: string }) {
    const company = await this.resolveCompany(userId);
    const maxSort = await this.prisma.mediaFolder.aggregate({
      where: { companyId: company.id, parentId: dto.parentId || null },
      _max: { sortOrder: true },
    });
    return this.prisma.mediaFolder.create({
      data: { companyId: company.id, name: dto.name, parentId: dto.parentId, sortOrder: (maxSort._max.sortOrder || 0) + 1 },
    });
  }

  async renameFolder(userId: string, folderId: string, name: string) {
    const company = await this.resolveCompany(userId);
    const folder = await this.prisma.mediaFolder.findFirst({ where: { id: folderId, companyId: company.id } });
    if (!folder) throw new NotFoundException('Folder not found');
    return this.prisma.mediaFolder.update({ where: { id: folderId }, data: { name } });
  }

  async deleteFolder(userId: string, folderId: string) {
    const company = await this.resolveCompany(userId);
    const folder = await this.prisma.mediaFolder.findFirst({ where: { id: folderId, companyId: company.id } });
    if (!folder) throw new NotFoundException('Folder not found');
    await this.prisma.productMedia.updateMany({ where: { folderId }, data: { folderId: null } });
    await this.prisma.mediaFolder.delete({ where: { id: folderId } });
    return { success: true };
  }
}
