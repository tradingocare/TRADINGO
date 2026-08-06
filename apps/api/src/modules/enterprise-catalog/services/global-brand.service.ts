import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateGlobalBrandDto, UpdateGlobalBrandDto, QueryGlobalBrandDto } from '../dto/global-brand.dto';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `brand-${Date.now()}`;
}

@Injectable()
export class GlobalBrandService {
  private readonly logger = new Logger(GlobalBrandService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGlobalBrandDto, userId: string) {
    const slug = dto.slug || slugify(dto.name);
    const existing = await this.prisma.globalBrand.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Brand with this slug already exists');
    return this.prisma.globalBrand.create({
      data: { ...dto, slug, createdBy: userId },
    });
  }

  async findAll(query: QueryGlobalBrandDto) {
    const limit = parseInt(query.limit || '20', 10);
    const where: any = {};
    if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { manufacturer: { contains: query.search, mode: 'insensitive' } }, { country: { contains: query.search, mode: 'insensitive' } }];
    if (query.verificationStatus) where.verificationStatus = query.verificationStatus;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    const [data, total] = await Promise.all([
      this.prisma.globalBrand.findMany({ where, orderBy: { name: 'asc' }, take: limit, skip: query.cursor ? 1 : 0, ...(query.cursor ? { cursor: { id: query.cursor } } : {}) }),
      this.prisma.globalBrand.count({ where }),
    ]);
    return { data, meta: { total, limit } };
  }

  async findById(id: string) {
    const brand = await this.prisma.globalBrand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Global brand not found');
    return brand;
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.globalBrand.findUnique({ where: { slug } });
    if (!brand) throw new NotFoundException('Global brand not found');
    return brand;
  }

  async update(id: string, dto: UpdateGlobalBrandDto, userId: string) {
    await this.findById(id);
    if (dto.slug) {
      const existing = await this.prisma.globalBrand.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) throw new ConflictException('Slug already in use');
    }
    return this.prisma.globalBrand.update({ where: { id }, data: { ...dto, updatedBy: userId } });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.globalBrand.delete({ where: { id } });
  }

  async verify(id: string, userId: string) {
    await this.findById(id);
    return this.prisma.globalBrand.update({ where: { id }, data: { verificationStatus: 'VERIFIED' as any, updatedBy: userId } });
  }
}
