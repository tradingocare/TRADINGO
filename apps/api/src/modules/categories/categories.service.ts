import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { v4 as uuid } from 'uuid';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${uuid().slice(0, 8)}`;
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = slugify(name);
    let attempt = 0;
    while (await this.prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${slugify(name)}-${attempt}`;
    }
    return slug;
  }

  async create(dto: CreateCategoryDto, userId: string) {
    const slug = dto.slug || await this.generateUniqueSlug(dto.name);
    const existing = await this.prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (existing) throw new ConflictException('Category slug already exists');

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId }, select: { id: true } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const category = await this.prisma.category.create({
      data: {
        parentId: dto.parentId,
        name: dto.name,
        slug,
        description: dto.description,
        icon: dto.icon,
        image: dto.image,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: { parent: { select: { id: true, name: true, slug: true } } },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'CATEGORY_CREATED', resource: `category:${category.id}`, metadata: { name: dto.name, slug } },
    });

    this.logger.log(`Category ${category.id} created by ${userId}`);
    return category;
  }

  async findAll(query: { cursor?: string; limit?: number; search?: string; isActive?: string }) {
    const { cursor, limit = 50, search, isActive } = query;
    const where: Prisma.CategoryWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const findArgs: Prisma.CategoryFindManyArgs = {
      where,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true, products: true } },
      },
    };
    if (cursor) { findArgs.cursor = { id: cursor }; findArgs.skip = 1; }
    const [data, total] = await Promise.all([
      this.prisma.category.findMany(findArgs),
      this.prisma.category.count({ where }),
    ]);
    return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { children: true, products: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { children: true, products: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async getTree() {
    const all = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { children: true, products: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' } ],
    });

    const map = new Map<string, Record<string, unknown>>();
    const roots: Record<string, unknown>[] = [];

    for (const cat of all) {
      map.set(cat.id, { ...cat, children: [] });
    }
    for (const cat of all) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        (map.get(cat.parentId)!.children as Record<string, unknown>[]).push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async getBreadcrumbs(slug: string) {
    const breadcrumbs: { id: string; name: string; slug: string }[] = [];
    let current = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, parentId: true },
    });
    if (!current) throw new NotFoundException('Category not found');

    while (current) {
      breadcrumbs.unshift({ id: current.id, name: current.name, slug: current.slug });
      if (current.parentId) {
        current = await this.prisma.category.findUnique({
          where: { id: current.parentId },
          select: { id: true, name: true, slug: true, parentId: true },
        });
      } else {
        current = null;
      }
    }
    return breadcrumbs;
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!category) throw new NotFoundException('Category not found');

    if (dto.parentId) {
      if (dto.parentId === id) throw new ConflictException('Category cannot be its own parent');
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId }, select: { id: true } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { ...dto },
      include: { parent: { select: { id: true, name: true, slug: true } } },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'CATEGORY_UPDATED', resource: `category:${id}`, metadata: { changes: { ...dto } } },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true, products: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category._count.children > 0) throw new ConflictException('Cannot delete category with child categories');
    if (category._count.products > 0) throw new ConflictException('Cannot delete category with associated products');

    await this.prisma.category.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: { userId, action: 'CATEGORY_DELETED', resource: `category:${id}`, metadata: { name: category.name } },
    });

    this.logger.log(`Category ${id} deleted by ${userId}`);
  }
}
