import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapterService } from '../catalog-adapter/catalog-adapter.service';
import { EnrichedCategoryNode, EnrichedCategoryTreeResponse, MappingCoverageResponse, BatchResolveResponse } from './dto/bridge-response.dto';
import { CatalogTreeNode, ResolveMappingResult } from '../catalog-adapter/dto/adapter-result.dto';

@Injectable()
export class MarketplaceCatalogBridgeService {
  private readonly logger = new Logger(MarketplaceCatalogBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogAdapter: CatalogAdapterService,
  ) { }

  // Enrichment provided by CatalogAdapter (read-only). Feature flags are not used for enrichment in P-2.3.

  async getEnrichedCategoryTree(): Promise<EnrichedCategoryTreeResponse> {
    const oldCategories = await this.prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        isActive: true,
        sortOrder: true,
        _count: { select: { children: true, products: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const catalogTree: CatalogTreeNode[] = await this.catalogAdapter.getCatalogTree();
    const catalogBySlug = new Map(catalogTree.map((c) => [c.slug, c]));

    const buildNode = (cat: (typeof oldCategories)[0], depth = 0): EnrichedCategoryNode => {
      const catalogMatch = catalogBySlug.get(cat.slug);
      const children = oldCategories
        .filter((c) => c.parentId === cat.id)
        .map((c) => buildNode(c, depth + 1));

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        depth,
        productCount: cat._count.products,
        childCount: cat._count.children,
        catalogCategory: catalogMatch
          ? { id: catalogMatch.id, name: catalogMatch.name, slug: catalogMatch.slug }
          : null,
        children,
      };
    };

    const roots = oldCategories.filter((c) => !c.parentId).map((c) => buildNode(c));
    return { roots, catalogTree };
  }

  async getEnrichedCategory(id: string) {
    const oldCat = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        isActive: true,
        sortOrder: true,
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { children: true, products: true } },
      },
    });

    if (!oldCat) return null;

    const catalogResult = await this.catalogAdapter.resolveOldCategoryToNew(id);

    return {
      ...oldCat,
      catalogCategory: catalogResult
        ? { id: catalogResult.targetId, name: catalogResult.targetName }
        : null,
    };
  }

  async getEnrichedProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        industry: { select: { id: true, name: true, slug: true } },
        company: { select: { id: true, name: true, slug: true, trustScore: true, verificationLevel: true } },
        inventory: { select: { availableQuantity: true, stockStatus: true } },
        priceSlabs: { select: { minQty: true, maxQty: true, price: true }, orderBy: { minQty: 'asc' } },
        media: { select: { id: true, url: true, type: true, sortOrder: true }, take: 1, orderBy: { sortOrder: 'asc' } },
        specifications: { select: { key: true, value: true } },
      },
    });

    if (!product) return null;

    const catalogResult = product.category
      ? await this.catalogAdapter.unifiedSearch(product.category.name, {
        includeOld: false,
        includeCatalog: true,
        limit: 1,
      })
      : [];

    return {
      ...product,
      catalogCategory: catalogResult.length > 0
        ? { id: catalogResult[0].id, name: catalogResult[0].name, type: catalogResult[0].type }
        : null,
    };
  }

  async searchEnrichedProducts(params: {
    q?: string;
    categoryId?: string;
    brand?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.brand) where.brand = { contains: params.brand, mode: 'insensitive' };
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          industry: { select: { id: true, name: true } },
          company: { select: { id: true, name: true, slug: true, logo: true, trustScore: true, verificationLevel: true, responseRate: true, gstNumber: true, locations: { where: { isPrimary: true }, select: { city: true, state: true }, take: 1 } } },
          inventory: { select: { availableQuantity: true, stockStatus: true } },
          priceSlabs: { select: { minQty: true, maxQty: true, price: true }, orderBy: { minQty: 'asc' } },
          media: { select: { id: true, url: true, type: true, sortOrder: true }, take: 1, orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Bulk resolve category ids to new catalog mapping to include confidence
    const categoryIds = Array.from(new Set(products.map((p) => p.category?.id).filter(Boolean) as string[]));
    const batch: BatchResolveResponse = categoryIds.length > 0 ? await this.batchResolveOldToNew(categoryIds) : { resolved: [], unresolved: [], totalInput: 0, resolvedCount: 0, unresolvedCount: 0 };
    const resolvedBySourceId = new Map<string, ResolveMappingResult>();
    (batch.resolved || []).forEach((r: any) => resolvedBySourceId.set(r.sourceId, r as ResolveMappingResult));

    const catalogTree = await this.catalogAdapter.getCatalogTree();
    const catalogById = new Map(catalogTree.map((c) => [c.id, c]));

    const enrichedProducts = products.map((p) => {
      if (!p.category) return { ...p, catalogCategory: null };
      const mapping = resolvedBySourceId.get(p.category.id);
      if (mapping && mapping.targetId) {
        return {
          ...p,
          catalogCategory: {
            id: mapping.targetId,
            name: mapping.targetName,
            slug: catalogById.get(mapping.targetId)?.slug,
            confidence: mapping.confidence,
            matchType: mapping.matchType,
          },
        };
      }

      return { ...p, catalogCategory: null };
    });

    return {
      data: enrichedProducts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  async getMappingCoverage() {
    const [oldCategories, catalogCategories] = await Promise.all([
      this.catalogAdapter.listOldCategories(),
      this.catalogAdapter.listCatalogCategories(),
    ]);

    const catalogBySlug = new Map(catalogCategories.map((c) => [c.slug, c]));

    const mapped: { oldId: string; oldName: string; oldSlug: string; catalogId: string; catalogName: string }[] = [];
    const unmappedOld: { oldId: string; oldName: string; oldSlug: string }[] = [];
    const unmappedCatalog: { catalogId: string; catalogName: string; catalogSlug: string }[] = [];

    for (const old of oldCategories) {
      const match = catalogBySlug.get(old.slug);
      if (match) {
        mapped.push({ oldId: old.id, oldName: old.name, oldSlug: old.slug, catalogId: match.id, catalogName: match.name });
      } else {
        unmappedOld.push({ oldId: old.id, oldName: old.name, oldSlug: old.slug });
      }
    }

    const mappedOldSlugs = new Set(mapped.map((m) => m.oldSlug));
    for (const cat of catalogCategories) {
      if (!mappedOldSlugs.has(cat.slug)) {
        unmappedCatalog.push({ catalogId: cat.id, catalogName: cat.name, catalogSlug: cat.slug });
      }
    }

    return {
      totalOld: oldCategories.length,
      totalCatalog: catalogCategories.length,
      mappedCount: mapped.length,
      unmappedOldCount: unmappedOld.length,
      unmappedCatalogCount: unmappedCatalog.length,
      coverage: oldCategories.length > 0 ? (mapped.length / oldCategories.length) * 100 : 0,
      mapped,
      unmappedOld,
      unmappedCatalog,
    };
  }

  async batchResolveOldToNew(ids: string[]) {
    return this.catalogAdapter.batchResolve(ids, 'oldToNew');
  }

  async batchResolveNewToOld(ids: string[]) {
    return this.catalogAdapter.batchResolve(ids, 'newToOld');
  }

  async unifiedSearchBulk(queries: string[], options?: { includeOld?: boolean; includeCatalog?: boolean; limit?: number }) {
    return this.catalogAdapter.unifiedSearchBulk(queries, options);
  }
}