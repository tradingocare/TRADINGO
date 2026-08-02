import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ResolveMappingResult,
  UnifiedSearchItem,
  CatalogTreeNode,
  ResolveBatchResult,
} from './dto/adapter-result.dto';

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/g, '').trim();
}

interface NameMapping {
  targetId: string;
  targetName: string;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'none';
}

@Injectable()
export class CatalogAdapterService {
  private readonly logger = new Logger(CatalogAdapterService.name);

  constructor(private readonly prisma: PrismaService) { }

  private computeNameMatch(sourceName: string, targetName: string): number {
    const a = normalizeName(sourceName);
    const b = normalizeName(targetName);
    if (a === b) return 1.0;
    if (a.includes(b) || b.includes(a)) return 0.8;
    const aWords = new Set(a.split(/\s+/));
    const bWords = new Set(b.split(/\s+/));
    const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
    return intersection.size / Math.max(aWords.size, bWords.size, 1);
  }

  async resolveOldCategoryToNew(oldCategoryId: string): Promise<ResolveMappingResult | null> {
    const oldCat = await this.prisma.category.findUnique({
      where: { id: oldCategoryId },
      select: { id: true, name: true, slug: true },
    });
    if (!oldCat) {
      this.logger.warn(`resolveOldCategoryToNew: old category ${oldCategoryId} not found`);
      return null;
    }

    const catalogCat = await this.prisma.catalogCategory.findFirst({
      where: { slug: oldCat.slug },
      select: { id: true, name: true },
    });

    if (!catalogCat) {
      this.logger.warn(`resolveOldCategoryToNew: no catalog match for "${oldCat.name}" (${oldCategoryId})`);
      return this.buildResult(oldCat.id, 'oldCategory', oldCat.name, undefined, undefined, 0, 'none');
    }

    return this.buildResult(oldCat.id, 'oldCategory', oldCat.name, catalogCat.id, catalogCat.name, 1.0, 'exact');
  }

  async resolveNewCategoryToOld(catalogCategoryId: string): Promise<ResolveMappingResult | null> {
    const catalogCat = await this.prisma.catalogCategory.findUnique({
      where: { id: catalogCategoryId },
      select: { id: true, name: true, slug: true },
    });
    if (!catalogCat) {
      this.logger.warn(`resolveNewCategoryToOld: catalog category ${catalogCategoryId} not found`);
      return null;
    }

    const oldCat = await this.prisma.category.findFirst({
      where: { slug: catalogCat.slug },
      select: { id: true, name: true },
    });

    if (!oldCat) {
      this.logger.warn(`resolveNewCategoryToOld: no old category match for "${catalogCat.name}" (${catalogCategoryId})`);
      return this.buildResult(catalogCat.id, 'catalogCategory', catalogCat.name, undefined, undefined, 0, 'none');
    }

    return this.buildResult(catalogCat.id, 'catalogCategory', catalogCat.name, oldCat.id, oldCat.name, 1.0, 'exact');
  }

  async unifiedSearch(
    query: string,
    options?: { includeOld?: boolean; includeCatalog?: boolean; limit?: number },
  ): Promise<UnifiedSearchItem[]> {
    const includeOld = options?.includeOld !== false;
    const includeCatalog = options?.includeCatalog !== false;
    const limit = options?.limit || 20;
    const results: UnifiedSearchItem[] = [];

    if (includeOld) {
      const oldCategories = await this.prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, description: true },
        take: limit,
      });
      for (const cat of oldCategories) {
        results.push({ id: cat.id, name: cat.name, type: 'oldCategory', description: cat.description || undefined });
      }
    }

    if (includeCatalog) {
      const [categories, subcategories, items] = await Promise.all([
        this.prisma.catalogCategory.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, description: true },
          take: limit,
        }),
        this.prisma.catalogSubcategory.findMany({
          where: { name: { contains: query, mode: 'insensitive' } },
          select: {
            id: true, name: true,
            category: { select: { name: true } },
          },
          take: limit,
        }),
        this.prisma.catalogItem.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { keywords: { has: query } },
              { synonyms: { has: query } },
            ],
          },
          select: {
            id: true, name: true, keywords: true,
            subcategory: { select: { name: true, category: { select: { name: true } } } },
          },
          take: limit,
        }),
      ]);

      for (const cat of categories) {
        results.push({ id: cat.id, name: cat.name, type: 'catalogCategory', description: cat.description || undefined });
      }
      for (const sub of subcategories) {
        results.push({ id: sub.id, name: sub.name, type: 'catalogSubcategory', parentName: sub.category.name });
      }
      for (const item of items) {
        results.push({
          id: item.id,
          name: item.name,
          type: 'catalogItem',
          parentName: `${item.subcategory.category.name} / ${item.subcategory.name}`,
          keywords: item.keywords,
        });
      }
    }

    return results.slice(0, limit);
  }

  async getCatalogTree(): Promise<CatalogTreeNode[]> {
    const categories = await this.prisma.catalogCategory.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, slug: true, description: true,
        isActive: true, sortOrder: true,
        subcategories: {
          where: { items: { some: { isActive: true } } },
          select: {
            id: true, categoryId: true, name: true, slug: true,
            _count: { select: { items: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || undefined,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
      subcategories: cat.subcategories.map((sub) => ({
        id: sub.id,
        categoryId: sub.categoryId,
        name: sub.name,
        slug: sub.slug,
        itemCount: sub._count.items,
      })),
    }));
  }

  async validateMapping(
    oldCategoryId: string,
    catalogCategoryId: string,
  ): Promise<{ valid: boolean; confidence: number; matchType: string; details: Record<string, unknown> }> {
    const [oldCat, catalogCat] = await Promise.all([
      this.prisma.category.findUnique({ where: { id: oldCategoryId }, select: { name: true, slug: true } }),
      this.prisma.catalogCategory.findUnique({ where: { id: catalogCategoryId }, select: { name: true, slug: true } }),
    ]);

    if (!oldCat || !catalogCat) {
      return {
        valid: false,
        confidence: 0,
        matchType: 'entity_not_found',
        details: { oldFound: !!oldCat, catalogFound: !!catalogCat },
      };
    }

    const confidence = this.computeNameMatch(oldCat.name, catalogCat.name);
    const slugMatch = oldCat.slug === catalogCat.slug;
    const valid = confidence >= 0.8 || slugMatch;

    return {
      valid,
      confidence,
      matchType: slugMatch ? 'slug_exact' : confidence >= 1.0 ? 'name_exact' : confidence >= 0.8 ? 'name_fuzzy' : 'mismatch',
      details: {
        oldName: oldCat.name,
        catalogName: catalogCat.name,
        oldSlug: oldCat.slug,
        catalogSlug: catalogCat.slug,
        slugMatch,
      },
    };
  }

  async batchResolve(
    ids: string[],
    direction: 'oldToNew' | 'newToOld',
  ): Promise<ResolveBatchResult> {
    const resolved: ResolveMappingResult[] = [];
    const unresolved: { id: string; name?: string }[] = [];

    if (direction === 'oldToNew') {
      const oldCats = await this.prisma.category.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, slug: true },
      });

      const slugs = oldCats.map((c) => c.slug);
      const catalogCats = await this.prisma.catalogCategory.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, name: true, slug: true },
      });
      const catalogBySlug = new Map(catalogCats.map((c) => [c.slug, c]));

      const resolvedIds = new Set<string>();
      for (const oldCat of oldCats) {
        const match = catalogBySlug.get(oldCat.slug);
        if (match) {
          resolved.push(this.buildResult(oldCat.id, 'oldCategory', oldCat.name, match.id, match.name, 1.0, 'exact'));
          resolvedIds.add(oldCat.id);
        }
      }

      for (const oldCat of oldCats) {
        if (!resolvedIds.has(oldCat.id)) {
          this.logger.warn(`batchResolve oldToNew: no match for "${oldCat.name}" (${oldCat.id})`);
          unresolved.push({ id: oldCat.id, name: oldCat.name });
        }
      }
    } else {
      const catalogCats = await this.prisma.catalogCategory.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, slug: true },
      });

      const slugs = catalogCats.map((c) => c.slug);
      const oldCats = await this.prisma.category.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, name: true, slug: true },
      });
      const oldBySlug = new Map(oldCats.map((c) => [c.slug, c]));

      const resolvedIds = new Set<string>();
      for (const catalogCat of catalogCats) {
        const match = oldBySlug.get(catalogCat.slug);
        if (match) {
          resolved.push(this.buildResult(catalogCat.id, 'catalogCategory', catalogCat.name, match.id, match.name, 1.0, 'exact'));
          resolvedIds.add(catalogCat.id);
        }
      }

      for (const catalogCat of catalogCats) {
        if (!resolvedIds.has(catalogCat.id)) {
          this.logger.warn(`batchResolve newToOld: no match for "${catalogCat.name}" (${catalogCat.id})`);
          unresolved.push({ id: catalogCat.id, name: catalogCat.name });
        }
      }
    }

    return {
      resolved,
      unresolved,
      totalInput: ids.length,
      resolvedCount: resolved.length,
      unresolvedCount: unresolved.length,
    };
  }

  async getIndustryMapping(catalogCategoryId: string) {
    const mappings = await this.prisma.catalogIndustryMapping.findMany({
      where: { catalogCategoryId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ isPrimary: 'desc' }, { relevanceScore: 'desc' }],
    });

    if (mappings.length === 0) {
      this.logger.warn(`getIndustryMapping: no mappings for catalog category ${catalogCategoryId}`);
    }

    return mappings;
  }

  async getCatalogItem(id: string) {
    const item = await this.prisma.catalogItem.findUnique({
      where: { id },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        attributes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        aliases: { where: { isActive: true } },
      },
    });

    if (!item) {
      this.logger.warn(`getCatalogItem: item ${id} not found`);
    }

    return item;
  }

  async getCatalogCategory(id: string) {
    const category = await this.prisma.catalogCategory.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { items: true } },
          },
        },
        industryMappings: {
          where: { isPrimary: true },
          select: { industryId: true, relevanceScore: true },
        },
      },
    });

    if (!category) {
      this.logger.warn(`getCatalogCategory: category ${id} not found`);
    }

    return category;
  }

  async getCatalogSubcategory(id: string) {
    const subcategory = await this.prisma.catalogSubcategory.findUnique({
      where: { id },
      include: {
        category: true,
        items: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true, name: true, slug: true, type: true,
            unit: true, keywords: true, isActive: true,
          },
        },
        industryMappings: {
          where: { isPrimary: true },
          select: { industryId: true, relevanceScore: true },
        },
      },
    });

    if (!subcategory) {
      this.logger.warn(`getCatalogSubcategory: subcategory ${id} not found`);
    }

    return subcategory;
  }

  /**
   * Return all active catalog categories (id, name, slug) — helper for coverage reports.
   */
  async listCatalogCategories() {
    return this.prisma.catalogCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Return all active legacy marketplace categories (id, name, slug) — helper for coverage reports.
   */
  async listOldCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Bulk unified search for multiple queries — returns results per query to avoid N+1 on callers.
   */
  async unifiedSearchBulk(
    queries: string[],
    options?: { includeOld?: boolean; includeCatalog?: boolean; limit?: number },
  ): Promise<Record<string, UnifiedSearchItem[]>> {
    const tasks = queries.map((q) => this.unifiedSearch(q, options));
    const results = await Promise.all(tasks);
    const out: Record<string, UnifiedSearchItem[]> = {};
    for (let i = 0; i < queries.length; i++) out[queries[i]] = results[i];
    return out;
  }

  private buildResult(
    sourceId: string,
    sourceType: ResolveMappingResult['sourceType'],
    sourceName: string,
    targetId?: string,
    targetName?: string,
    confidence?: number,
    matchType?: ResolveMappingResult['matchType'],
  ): ResolveMappingResult {
    return { sourceId, sourceType, sourceName, targetId, targetName, confidence, matchType };
  }
}
