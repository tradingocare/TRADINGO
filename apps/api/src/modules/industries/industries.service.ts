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

  async create(dto: CreateIndustryDto, userId: string) {
    const slug = dto.slug || await this.generateUniqueSlug(dto.name);
    const existing = await this.prisma.industry.findUnique({ where: { slug }, select: { id: true } });
    if (existing) throw new ConflictException('Industry slug already exists');

    const industry = await this.prisma.industry.create({
      data: { name: dto.name, slug, description: dto.description, icon: dto.icon },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'INDUSTRY_CREATED', resource: `industry:${industry.id}`, metadata: { name: dto.name } },
    });

    return industry;
  }

  async findAll(query: { cursor?: string; limit?: number; search?: string }) {
    const { cursor, limit = 50, search } = query;
    const where: Prisma.IndustryWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const findArgs: Prisma.IndustryFindManyArgs = {
      where, take: limit, orderBy: { name: 'asc' },
      include: { _count: { select: { companies: true, products: true } } },
    };
    if (cursor) { findArgs.cursor = { id: cursor }; findArgs.skip = 1; }
    const [data, total] = await Promise.all([
      this.prisma.industry.findMany(findArgs),
      this.prisma.industry.count({ where }),
    ]);
    return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
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
    const industry = await this.prisma.industry.findUnique({ where: { id }, select: { id: true } });
    if (!industry) throw new NotFoundException('Industry not found');

    const updated = await this.prisma.industry.update({ where: { id }, data: dto });

    await this.prisma.auditLog.create({
      data: { userId, action: 'INDUSTRY_UPDATED', resource: `industry:${id}`, metadata: { changes: { ...dto } } },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const industry = await this.prisma.industry.findUnique({
      where: { id },
      include: { _count: { select: { companies: true, products: true } } },
    });
    if (!industry) throw new NotFoundException('Industry not found');
    if (industry._count.companies > 0) throw new ConflictException('Cannot delete industry with associated companies');
    if (industry._count.products > 0) throw new ConflictException('Cannot delete industry with associated products');

    await this.prisma.industry.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: { userId, action: 'INDUSTRY_DELETED', resource: `industry:${id}`, metadata: { name: industry.name } },
    });
  }
}
