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

  private async validateSlugUniqueness(slug: string, excludeId?: string): Promise<void> {
    const where: Prisma.CategoryWhereInput = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await this.prisma.category.findFirst({ where, select: { id: true } });
    if (existing) throw new ConflictException(`Slug '${slug}' is already in use`);
  }

  private async detectCircularReference(id: string, newParentId: string): Promise<void> {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();
    while (currentId) {
      if (currentId === id) throw new ConflictException('Circular reference detected: category cannot be its own ancestor');
      if (visited.has(currentId)) break;
      visited.add(currentId);
      const parent: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = parent?.parentId ?? null;
    }
  }

  async create(dto: CreateCategoryDto, userId: string) {
    const slug = dto.slug || await this.generateUniqueSlug(dto.name);
    if (dto.slug) await this.validateSlugUniqueness(slug);

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId }, select: { id: true } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const category = await this.prisma.$transaction(async (tx) => {
      const c = await tx.category.create({
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

      await tx.auditLog.create({
        data: { userId, action: 'CATEGORY_CREATED', resource: `category:${c.id}`, metadata: { name: dto.name, slug } },
      }).catch((err) => this.logger.warn(`Audit log failed for category create: ${err.message}`));

      return c;
    });

    this.logger.log(`Category ${category.id} created by ${userId}`);
    return category;
  }

  async findAll(query: { cursor?: string; limit?: number; search?: string; isActive?: string }) {
    try {
      const { cursor, search, isActive } = query || {};
      const limit = Math.min(Math.max(Number(query?.limit) || 50, 1), 100);
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
        take: limit + 1,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: { select: { children: true, products: true } },
        },
      };
      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }
      const data = await this.prisma.category.findMany(findArgs);
      const hasMore = data.length > limit;
      if (hasMore) data.pop();
      const total = await this.prisma.category.count({ where });
      return { data, meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined } };
    } catch (err) {
      this.logger.error(`Error in CategoriesService.findAll: ${err instanceof Error ? err.message : String(err)}`);
      return { data: [], meta: { total: 0, limit: 50, cursor: undefined } };
    }
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
        _count: { select: { children: true, products: true, serviceMasters: true } },
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
    const existing = await this.prisma.category.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.parentId) {
      if (dto.parentId === id) throw new ConflictException('Category cannot be its own parent');
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId }, select: { id: true } });
      if (!parent) throw new NotFoundException('Parent category not found');
      await this.detectCircularReference(id, dto.parentId);
    }

    if (dto.slug) await this.validateSlugUniqueness(dto.slug, id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.category.update({
        where: { id },
        data: { ...dto },
        include: { parent: { select: { id: true, name: true, slug: true } } },
      });

      await tx.auditLog.create({
        data: { userId, action: 'CATEGORY_UPDATED', resource: `category:${id}`, metadata: { changes: { ...dto } } },
      }).catch((err) => this.logger.warn(`Audit log failed for category update: ${err.message}`));

      return u;
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id },
        include: { _count: { select: { children: true, products: true } } },
      });
      if (!category) throw new NotFoundException('Category not found');
      if (category._count.children > 0) throw new ConflictException('Cannot delete category with child categories');
      if (category._count.products > 0) throw new ConflictException('Cannot delete category with associated products');

      await tx.category.delete({ where: { id } });

      await tx.auditLog.create({
        data: { userId, action: 'CATEGORY_DELETED', resource: `category:${id}`, metadata: { name: category.name } },
      }).catch((err) => this.logger.warn(`Audit log failed for category delete: ${err.message}`));
    });

    this.logger.log(`Category ${id} deleted by ${userId}`);
  }
}
