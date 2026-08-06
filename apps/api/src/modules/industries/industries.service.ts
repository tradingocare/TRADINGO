import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';
import { v4 as uuid } from 'uuid';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `ind-${uuid().slice(0, 8)}`;
}

@Injectable()
export class IndustriesService {
  private readonly logger = new Logger(IndustriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = slugify(name);
    let attempt = 0;
    while (await this.prisma.industry.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${slugify(name)}-${attempt}`;
    }
    return slug;
  }

  private async validateSlugUniqueness(slug: string, excludeId?: string): Promise<void> {
    const where: Prisma.IndustryWhereInput = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await this.prisma.industry.findFirst({ where, select: { id: true } });
    if (existing) throw new ConflictException(`Slug '${slug}' is already in use`);
  }

  async create(dto: CreateIndustryDto, userId: string) {
    const slug = dto.slug || await this.generateUniqueSlug(dto.name);
    if (dto.slug) await this.validateSlugUniqueness(slug);

    const industry = await this.prisma.$transaction(async (tx) => {
      const ind = await tx.industry.create({
        data: { name: dto.name, slug, description: dto.description, icon: dto.icon },
      });

      await tx.auditLog.create({
        data: { userId, action: 'INDUSTRY_CREATED', resource: `industry:${ind.id}`, metadata: { name: dto.name } },
      }).catch((err) => this.logger.warn(`Audit log failed for industry create: ${err.message}`));

      return ind;
    });

    return industry;
  }

  async findAll(query: { cursor?: string; limit?: number; search?: string }) {
    try {
      const { cursor, search } = query || {};
      const limit = Math.min(Math.max(Number(query?.limit) || 50, 1), 100);
      const where: Prisma.IndustryWhereInput = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const findArgs: Prisma.IndustryFindManyArgs = {
        where, take: limit + 1, orderBy: { name: 'asc' },
        include: { _count: { select: { companies: true, products: true } } },
      };
      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }
      const data = await this.prisma.industry.findMany(findArgs);
      const hasMore = data.length > limit;
      if (hasMore) data.pop();
      const total = await this.prisma.industry.count({ where });
      return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
    } catch (err) {
      this.logger.error(`Error in IndustriesService.findAll: ${err instanceof Error ? err.message : String(err)}`);
      return { data: [], meta: { total: 0, limit: 50, cursor: undefined } };
    }
  }

  async findById(id: string) {
    const industry = await this.prisma.industry.findUnique({
      where: { id },
      include: { _count: { select: { companies: true, products: true } } },
    });
    if (!industry) throw new NotFoundException('Industry not found');
    return industry;
  }

  async findBySlug(slug: string) {
    const industry = await this.prisma.industry.findUnique({
      where: { slug },
      include: { _count: { select: { companies: true, products: true } } },
    });
    if (!industry) throw new NotFoundException('Industry not found');
    return industry;
  }

  async update(id: string, dto: UpdateIndustryDto, userId: string) {
    const existing = await this.prisma.industry.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Industry not found');

    if (dto.slug) await this.validateSlugUniqueness(dto.slug, id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.industry.update({
        where: { id },
        data: dto,
      });

      await tx.auditLog.create({
        data: { userId, action: 'INDUSTRY_UPDATED', resource: `industry:${id}`, metadata: { changes: { ...dto } } },
      }).catch((err) => this.logger.warn(`Audit log failed for industry update: ${err.message}`));

      return u;
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const industry = await tx.industry.findUnique({
        where: { id },
        include: { _count: { select: { companies: true, products: true } } },
      });
      if (!industry) throw new NotFoundException('Industry not found');
      if (industry._count.companies > 0) throw new ConflictException('Cannot delete industry with associated companies');
      if (industry._count.products > 0) throw new ConflictException('Cannot delete industry with associated products');

      await tx.industry.delete({ where: { id } });

      await tx.auditLog.create({
        data: { userId, action: 'INDUSTRY_DELETED', resource: `industry:${id}`, metadata: { name: industry.name } },
      }).catch((err) => this.logger.warn(`Audit log failed for industry delete: ${err.message}`));
    });
  }
}
