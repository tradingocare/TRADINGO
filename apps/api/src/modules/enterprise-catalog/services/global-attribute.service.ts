import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateGlobalAttributeDto, UpdateGlobalAttributeDto, QueryGlobalAttributeDto } from '../dto/global-attribute.dto';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `attr-${Date.now()}`;
}

@Injectable()
export class GlobalAttributeService {
  private readonly logger = new Logger(GlobalAttributeService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGlobalAttributeDto, userId: string) {
    const slug = dto.slug || slugify(dto.name);
    const existing = await this.prisma.globalAttribute.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Attribute with this slug already exists');
    return this.prisma.globalAttribute.create({
      data: { ...dto, slug, createdBy: userId },
    });
  }

  async findAll(query: QueryGlobalAttributeDto) {
    const limit = parseInt(query.limit || '50', 10);
    const where: any = {};
    if (query.search) where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { label: { contains: query.search, mode: 'insensitive' } }];
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    const [data, total] = await Promise.all([
      this.prisma.globalAttribute.findMany({ where, orderBy: { sortOrder: 'asc' }, take: limit, skip: query.cursor ? 1 : 0, ...(query.cursor ? { cursor: { id: query.cursor } } : {}) }),
      this.prisma.globalAttribute.count({ where }),
    ]);
    return { data, meta: { total, limit } };
  }

  async findById(id: string) {
    const attr = await this.prisma.globalAttribute.findUnique({ where: { id } });
    if (!attr) throw new NotFoundException('Global attribute not found');
    return attr;
  }

  async findBySlug(slug: string) {
    const attr = await this.prisma.globalAttribute.findUnique({ where: { slug } });
    if (!attr) throw new NotFoundException('Global attribute not found');
    return attr;
  }

  async update(id: string, dto: UpdateGlobalAttributeDto, userId: string) {
    await this.findById(id);
    if (dto.slug) {
      const existing = await this.prisma.globalAttribute.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) throw new ConflictException('Slug already in use');
    }
    return this.prisma.globalAttribute.update({ where: { id }, data: { ...dto, updatedBy: userId } });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.globalAttribute.delete({ where: { id } });
  }

  async getTypes() {
    return Object.values(require('@prisma/client').GlobalAttributeType);
  }
}
