import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapterService } from '../catalog-adapter/catalog-adapter.service';
import { EnrichedCategoryNode, EnrichedCategoryTreeResponse, BatchResolveResponse } from './dto/bridge-response.dto';
import { CatalogTreeNode, ResolveMappingResult } from '../catalog-adapter/dto/adapter-result.dto';

@Injectable()
export class MarketplaceCatalogBridgeService {
  private readonly logger = new Logger(MarketplaceCatalogBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogAdapter: CatalogAdapterService,
  ) { }

  /** Preview rows per subcategory (mirrors PRODUCT_PREVIEW_LIMIT in the card). */
  private static readonly CARD_PREVIEW_LIMIT = 4;
  /** Hard upper bound: a card never carries more than 10 subcategories. */
  private static readonly CARD_PREVIEW_MAX_SUBS = 10;

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

  /**
   * F-07 cascade picker (read-only): list active catalog items of one
   * subcategory. Parent is validated first — items of another/inactive
   * parent are never returned, and an unknown parent 404s instead of
   * returning an arbitrary list. Paginated like the other list reads.
   */
  async listSubcategoryItems(subcategoryId: string, page = 1, limit = 50) {
    const sub = await this.prisma.catalogSubcategory.findUnique({
      where: { id: subcategoryId },
      select: { id: true, categoryId: true },
    });
    if (!sub) throw new NotFoundException('Catalog subcategory not found');
    const take = Math.min(Math.max(limit || 50, 1), 100);
    const pageNum = Math.max(page || 1, 1);
    const where = { subcategoryId: sub.id, isActive: true };
    const [data, total] = await Promise.all([
      this.prisma.catalogItem.findMany({
        where,
        select: { id: true, name: true, slug: true, type: true },
        orderBy: { name: 'asc' },
        skip: (pageNum - 1) * take,
        take,
      }),
      this.prisma.catalogItem.count({ where }),
    ]);
    return { data, meta: { total, page: pageNum, limit: take, subcategoryId: sub.id, categoryId: sub.categoryId } };
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
    // D1 (founder decision A+B): bridge discovery surfaces ACTIVE products
    // only; a non-ACTIVE product resolves to null so the controller answers
    // with the canonical 404. Mirrors products.service findById/findBySlug.
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null, status: 'ACTIVE' },
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
    // P0-3 Step 5: canonical taxonomy filters (server-side validated; an
    // invalid/mismatched combination filters to honest empty).
    catalogCategoryId?: string;
    catalogSubcategoryId?: string;
    catalogItemId?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // D1 (founder decision A): collection/search silently excludes
    // non-ACTIVE products at the query layer (never client-side).
    const where: any = { deletedAt: null, status: 'ACTIVE' };
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.brand) where.brand = { contains: params.brand, mode: 'insensitive' };
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    // P0-3 Step 5: canonical taxonomy filter on the existing
    // Product→catalogItem→subcategory→category relation chain. Validates the
    // submitted IDs and the parent/child chain server-side; contradictory
    // or invalid combos resolve to an unsatisfiable filter (honest empty).
    if (params.catalogItemId) {
      const item = await this.prisma.catalogItem.findFirst({
        where: { id: params.catalogItemId, isActive: true },
        select: { id: true, subcategoryId: true, subcategory: { select: { categoryId: true } } },
      });
      if (!item) {
        where.catalogItemId = { in: ['__canonical_no_match__'] };
      } else if (
        (params.catalogSubcategoryId && item.subcategoryId !== params.catalogSubcategoryId) ||
        (params.catalogCategoryId && item.subcategory.categoryId !== params.catalogCategoryId)
      ) {
        where.catalogItemId = { in: ['__canonical_no_match__'] };
      } else {
        where.catalogItemId = params.catalogItemId;
      }
    } else if (params.catalogSubcategoryId) {
      const sub = await this.prisma.catalogSubcategory.findFirst({
        where: { id: params.catalogSubcategoryId },
        select: { id: true, categoryId: true },
      });
      if (!sub || (params.catalogCategoryId && sub.categoryId !== params.catalogCategoryId)) {
        where.catalogItemId = { in: ['__canonical_no_match__'] };
      } else {
        where.catalogItem = { subcategoryId: params.catalogSubcategoryId };
      }
    } else if (params.catalogCategoryId) {
      const category = await this.prisma.catalogCategory.findFirst({
        where: { id: params.catalogCategoryId, isActive: true },
        select: { id: true },
      });
      if (!category) {
        where.catalogItemId = { in: ['__canonical_no_match__'] };
      } else {
        where.catalogItem = { subcategory: { categoryId: params.catalogCategoryId } };
      }
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
      if (mapping?.targetId) {
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

  /**
   * Phase 3J: card-scoped aggregated subcategory previews (read-only).
   *
   * ONE request covers up to CARD_PREVIEW_MAX_SUBS subcategories with TRUE
   * SERVICE-LEVEL BATCHING (shared validation, no per-sub tree/resolve fan-out,
   * no HTTP fan-in). Per-subcategory semantics mirror searchEnrichedProducts +
   * the EMPTY→services fallback exactly: same ACTIVE/deletedAt/company-gating
   * predicates, same createdAt-desc ordering, same limit=4, same APPROVED
   * service gating. Per-sub try/catch keeps one bad subcategory from
   * aborting the rest. Unknown IDs resolve to honest empty (never unfiltered).
   */
  async getCardPreviews(rawIds: string[] | string | undefined): Promise<{
    previews: {
      subcategoryId: string;
      products: Record<string, unknown>[];
      productTotal: number;
      services: Record<string, unknown>[];
      status: 'ok' | 'error';
    }[];
  }> {
    // Accept repeated params (string[]) and the established comma-joined
    // convention (resolve/old-to-new, unified-search/bulk): split first.
    const list = Array.isArray(rawIds) ? rawIds.flatMap((s) => String(s).split(',')) : rawIds ? String(rawIds).split(',') : [];
    const ids = [...new Set(list.map((s) => String(s).trim()).filter(Boolean))].slice(
      0,
      MarketplaceCatalogBridgeService.CARD_PREVIEW_MAX_SUBS,
    );
    if (ids.length === 0) return { previews: [] };

    // Shared validation: ONE query for the whole card (not per subcategory).
    // (No catalog-tree / batchResolve fan-out here — previews never consume
    // the enrichment those calls serve.)
    const validSubs = await this.prisma.catalogSubcategory.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const valid = new Set(validSubs.map((s) => s.id));

    const previews = await Promise.all(
      ids.map(async (subId) => {
        try {
          if (!valid.has(subId)) {
            // Mirrors the __canonical_no_match__ path: honest empty, no error.
            return { subcategoryId: subId, products: [], productTotal: 0, services: [], status: 'ok' as const };
          }
          const where: any = {
            deletedAt: null,
            status: 'ACTIVE',
            catalogItem: { subcategoryId: subId },
          };
          const [products, total] = await Promise.all([
            this.prisma.product.findMany({
              where,
              skip: 0,
              take: MarketplaceCatalogBridgeService.CARD_PREVIEW_LIMIT,
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
          const rows = (products as any[]).filter((p) => !!p?.slug);
          let services: Record<string, unknown>[] = [];
          if (rows.length === 0) {
            services = await this.previewServicesForSubcategory(subId);
          }
          return { subcategoryId: subId, products: rows, productTotal: total, services, status: 'ok' as const };
        } catch (err) {
          this.logger.warn(`Card preview failed for subcategory ${subId}: ${(err as Error).message}`);
          return { subcategoryId: subId, products: [], productTotal: 0, services: [], status: 'error' as const };
        }
      }),
    );
    return { previews };
  }

  /**
   * Services fallback for ONE subcategory. Mirrors TradeservService
   * resolveCanonicalCompanyFilters (subcategory branch) + the Prisma
   * APPROVED fallback select/ordering, bounded to the preview limit.
   * Kept local (no cross-module import) to avoid a bridge↔tradeserv cycle;
   * predicates are copied exactly — any semantic change must mirror the source.
   */
  private async previewServicesForSubcategory(subcategoryId: string): Promise<Record<string, unknown>[]> {
    const sub = await this.prisma.catalogSubcategory.findFirst({
      where: { id: subcategoryId },
      select: { id: true },
    });
    if (!sub) return [];
    const items = await this.prisma.catalogItem.findMany({
      where: { isActive: true, type: 'Service', subcategoryId },
      select: { id: true },
    });
    const itemIds = items.map((s) => s.id);
    if (itemIds.length === 0) return [];
    const companies = await this.prisma.company.findMany({
      where: {
        professionalStatus: 'APPROVED',
        professionalType: { not: null },
        professionalServices: {
          some: { isActive: true, catalogItemId: { in: itemIds } },
        },
      },
      orderBy: { trustScore: 'desc' },
      take: MarketplaceCatalogBridgeService.CARD_PREVIEW_LIMIT,
      select: {
        id: true, name: true, slug: true, logo: true, professionalType: true,
        trustScore: true, verificationLevel: true,
        locations: { select: { city: true, state: true } },
      },
    });
    return companies as unknown as Record<string, unknown>[];
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

  /**
   * Phase 14 — identifier contract: accept a legacy Category ID *or* slug,
   * return the canonical legacy Category ID. Returns null when neither matches.
   * Callers must treat null as "no match" (honest empty), never as "unfiltered".
   */
  async resolveLegacyCategorySlugOrId(input: string): Promise<{ id: string } | null> {
    const value = (input ?? '').trim();
    if (!value) return null;
    const byId = await this.prisma.category.findUnique({
      where: { id: value },
      select: { id: true },
    });
    if (byId) return byId;
    return this.prisma.category.findUnique({
      where: { slug: value },
      select: { id: true },
    });
  }

  /**
   * Phase 14 — identifier contract: accept a subcategory slug *or* display name,
   * return the canonical display name used by search filters. Falls back to the
   * trimmed input unchanged when nothing matches (backend then misses honestly).
   */
  async resolveSubcategoryDisplayName(input: string): Promise<string> {
    const value = (input ?? '').trim();
    if (!value) return value;
    const byCatalogSlug = await this.prisma.catalogSubcategory.findFirst({
      where: { slug: value },
      select: { name: true },
    });
    if (byCatalogSlug) return byCatalogSlug.name;
    const byCatalogName = await this.prisma.catalogSubcategory.findFirst({
      where: { name: { equals: value, mode: 'insensitive' } },
      select: { name: true },
    });
    if (byCatalogName) return byCatalogName.name;
    const byLegacySlug = await this.prisma.category.findUnique({
      where: { slug: value },
      select: { name: true },
    });
    if (byLegacySlug) return byLegacySlug.name;
    const byLegacyName = await this.prisma.category.findFirst({
      where: { name: { equals: value, mode: 'insensitive' } },
      select: { name: true },
    });
    if (byLegacyName) return byLegacyName.name;
    return value;
  }

  async batchResolveNewToOld(ids: string[]) {
    return this.catalogAdapter.batchResolve(ids, 'newToOld');
  }

  async unifiedSearchBulk(queries: string[], options?: { includeOld?: boolean; includeCatalog?: boolean; limit?: number }) {
    return this.catalogAdapter.unifiedSearchBulk(queries, options);
  }
}