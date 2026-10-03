import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogClassifyService } from './catalog-classify.service';
import { ClassifyCatalogDto, ClassifyCatalogResponse } from './dto/classify-catalog.dto';

/**
 * P0-2 canonical taxonomy persistence helper.
 *
 * Single shared writer-side contract for every Product/ProfessionalService
 * creation path. Guarantees:
 *  - only VALID canonical IDs are persisted (verified against the live
 *    catalog; never fabricated, never taken on faith from the client);
 *  - classification results are never silently dropped — when a path has
 *    no confirmed triple, the deterministic classifier runs once to attempt
 *    resolution (bulk/quick paths stay free + reproducible via aiTier:false);
 *  - the legacy Category layer is bridged, not bypassed: when a canonical
 *    triple is confirmed, the matching legacy categoryId is looked up by
 *    slug so Product.categoryId keeps its historical behavior (synthetic
 *    legacy layer preserved — P0-2 audit §R).
 *
 * Identifier contract: slug = route, ID = persistence, name = display.
 */
@Injectable()
export class CatalogTaxonomyPersistenceService {
  private readonly logger = new Logger(CatalogTaxonomyPersistenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly classify: CatalogClassifyService,
  ) {}

  /**
   * The one creation-path entry point.
   *
   * 1. If a confirmed triple (Tick/Change) is present → validate it against
   *    the live catalog (never trust client IDs) and return it.
   * 2. Otherwise run the deterministic classifier (exact → synonym, NO LLM
   *    by default) and return a triple only for auto-applicable results
   *    (band HIGH — same rule SmartRfqService uses). MEDIUM/LOW return null:
   *    those need human confirmation and must never be auto-persisted.
   * 3. Any failure/miss returns null — the caller keeps its existing
   *    behavior (legacy-only or none). Never fabricated, never thrown
   *    upward into a creation transaction.
   */
  async resolvePersistableTaxonomy(input: {
    confirmed?: {
      categoryId?: string | null;
      subcategoryId?: string | null;
      catalogItemId?: string | null;
    };
    name: string;
    description?: string | null;
    brand?: string | null;
    context: 'product' | 'service';
    expectedType?: 'Product' | 'Service' | null;
    aiTier?: boolean;
  }): Promise<{
    categoryId: string;
    subcategoryId: string | null;
    catalogItemId: string | null;
  } | null> {
    const confirmed = input.confirmed;
    if (confirmed && (confirmed.catalogItemId || confirmed.categoryId || confirmed.subcategoryId)) {
      const validated = await this.validateConfirmedTriple({
        categoryId: confirmed.categoryId ?? null,
        subcategoryId: confirmed.subcategoryId ?? null,
        catalogItemId: confirmed.catalogItemId ?? null,
        expectedType: input.expectedType ?? null,
      });
      if (validated) return validated;
      // A confirmed-but-invalid triple is a client error the caller may 400
      // on (paths do); for resolution purposes we fall through to the
      // deterministic classifier rather than persisting nothing silently.
      this.logger.warn(
        `Confirmed triple failed validation for "${input.name}" — falling through to deterministic classification`,
      );
    }

    // Nothing to classify on — callers pass product/service names, but a
    // blank never resolves anything. Skip the classifier call entirely.
    if (!(input.name || '').trim()) return null;

    try {
      const result = await this.classify.classify(
        {
          name: input.name,
          description: input.description ?? undefined,
          brand: input.brand ?? undefined,
          context: input.context,
        },
        'system-taxonomy-persistence',
        undefined,
        { aiTier: input.aiTier ?? false },
      );
      if (result.band !== 'HIGH' || !result.categoryId) return null;
      return {
        categoryId: result.categoryId,
        subcategoryId: result.subcategoryId,
        catalogItemId: result.catalogItemId,
      };
    } catch (err) {
      this.logger.warn(
        `Creation-path taxonomy resolution failed for "${input.name}": ${err instanceof Error ? err.message : String(err)} — keeping caller behavior`,
      );
      return null;
    }
  }

  /**
   * P0-3 Step-1 canonical classification adapter — the single read-side entry
   * point around CatalogClassifyService. Runs the full tier chain (exact →
   * synonym → AI unless aiTier:false → fallback) and then SERVER-SIDE
   * validates every returned ID against the live catalog:
   *  - existence of category/subcategory/item,
   *  - item→subcategory→category parent/child chain,
   *  - optional expectedType (Product/Service) match.
   * Returns the canonical contract {categoryId, subcategoryId, catalogItemId,
   * confidence, band} with all IDs verified. Anything unverifiable degrades to
   * an honest LOW/unclassified response (alternatives preserved for the
   * structured picker) — never fabricated, never thrown. No classification
   * logic is duplicated here: tiers live entirely in CatalogClassifyService.
   */
  async classifyValidated(
    dto: ClassifyCatalogDto,
    companyId?: string,
    userId?: string,
    options?: { aiTier?: boolean; expectedType?: 'Product' | 'Service' | null },
  ): Promise<ClassifyCatalogResponse> {
    let result: ClassifyCatalogResponse;
    try {
      result = await this.classify.classify(
        dto,
        companyId || 'system-taxonomy-persistence',
        userId,
        { aiTier: options?.aiTier },
      );
    } catch (err) {
      this.logger.warn(
        `Validated classification failed for "${dto?.name}": ${err instanceof Error ? err.message : String(err)} — returning unclassified`,
      );
      return {
        categoryId: null,
        subcategoryId: null,
        catalogItemId: null,
        type: null,
        confidence: 0,
        band: 'LOW',
        matchType: 'unclassified',
        reasons: ['classification unavailable — structured picker required'],
        alternatives: [],
      };
    }
    if (!result.categoryId && !result.catalogItemId && !result.subcategoryId) return result;
    const validated = await this.validateConfirmedTriple({
      categoryId: result.categoryId,
      subcategoryId: result.subcategoryId,
      catalogItemId: result.catalogItemId,
      expectedType: options?.expectedType ?? null,
    });
    if (validated) return result;
    this.logger.warn(
      `Classifier returned unverifiable IDs for "${dto?.name}" — degrading to unclassified (never fabricated)`,
    );
    return {
      categoryId: null,
      subcategoryId: null,
      catalogItemId: null,
      type: null,
      confidence: 0,
      band: 'LOW',
      matchType: 'unclassified',
      reasons: ['classifier output failed server-side verification — structured picker required'],
      alternatives: result.alternatives ?? [],
    };
  }

  /**
   * Validate a client-supplied (confirmed via Tick/Change) canonical triple.
   * Returns the verified triple or null — null means "unresolvable right now".
   * Callers that treat a confirmed triple as mandatory may throw on null;
   * callers that treat it as best-effort fall back to classification.
   */
  async validateConfirmedTriple(input: {
    categoryId?: string | null;
    subcategoryId?: string | null;
    catalogItemId?: string | null;
    expectedType?: 'Product' | 'Service' | null;
  }): Promise<{
    categoryId: string;
    subcategoryId: string | null;
    catalogItemId: string | null;
  } | null> {
    if (!input.catalogItemId && !input.categoryId && !input.subcategoryId) return null;

    // Item-first: the leaf is the strongest identifier. Verify the whole
    // chain (item -> subcategory -> category) from the DB, not the client.
    if (input.catalogItemId) {
      const item = await this.prisma.catalogItem.findFirst({
        where: {
          id: input.catalogItemId,
          isActive: true,
          ...(input.expectedType ? { type: input.expectedType } : {}),
        },
        select: {
          id: true,
          type: true,
          name: true,
          subcategory: { select: { id: true, categoryId: true, category: { select: { id: true } } } },
        },
      });
      if (item) {
        return {
          categoryId: item.subcategory.category.id,
          subcategoryId: item.subcategory.id,
          catalogItemId: item.id,
        };
      }
      this.logger.warn(
        `Confirmed catalogItemId ${input.catalogItemId} failed validation (missing/inactive/type-mismatch) — refusing fabricated lineage`,
      );
      return null;
    }

    // Category/subcategory-only confirmation (item not chosen yet).
    if (input.subcategoryId) {
      const sub = await this.prisma.catalogSubcategory.findFirst({
        where: { id: input.subcategoryId, ...(input.categoryId ? { categoryId: input.categoryId } : {}) },
        select: { id: true, categoryId: true },
      });
      if (sub) {
        return { categoryId: sub.categoryId, subcategoryId: sub.id, catalogItemId: null };
      }
      this.logger.warn(`Confirmed subcategoryId ${input.subcategoryId} failed validation — refusing`);
    } else if (input.categoryId) {
      const cat = await this.prisma.catalogCategory.findFirst({
        where: { id: input.categoryId, isActive: true },
        select: { id: true },
      });
      if (cat) return { categoryId: cat.id, subcategoryId: null, catalogItemId: null };
      this.logger.warn(`Confirmed categoryId ${input.categoryId} failed validation — refusing`);
    }
    return null;
  }

  /**
   * Read the full verified chain for a catalogItemId (display echo + full
   * triple persistence on paths that store all three columns).
   */
  async tripleForCatalogItem(
    catalogItemId: string,
    expectedType?: 'Product' | 'Service' | null,
  ): Promise<{
    categoryId: string;
    subcategoryId: string;
    catalogItemId: string;
    categoryName: string;
    subcategoryName: string;
    itemName: string;
  } | null> {
    const item = await this.prisma.catalogItem.findFirst({
      where: { id: catalogItemId, isActive: true, ...(expectedType ? { type: expectedType } : {}) },
      select: {
        id: true,
        name: true,
        subcategory: { select: { id: true, name: true, categoryId: true, category: { select: { id: true, name: true } } } },
      },
    });
    if (!item) return null;
    return {
      categoryId: item.subcategory.category.id,
      subcategoryId: item.subcategory.id,
      catalogItemId: item.id,
      categoryName: item.subcategory.category.name,
      subcategoryName: item.subcategory.name,
      itemName: item.name,
    };
  }

  /**
   * P1 O-1/O-5: single shared writer for the canonical triple.
   *
   * Applies `catalogItemId + catalogCategoryId + catalogSubcategoryId`
   * together as one atomic lineage — never a partial triple. A null input
   * clears the entire triple (all three columns), so clearing can never
   * leave stale category columns behind. Pure mapping over an already
   * DB-verified triple (see validateConfirmedTriple /
   * resolvePersistableTaxonomy); performs no resolution itself and creates
   * no second taxonomy engine.
   */
  applyCanonicalTriple(validated: {
    categoryId: string;
    subcategoryId: string | null;
    catalogItemId: string | null;
  } | null): {
    catalogItemId: string | null;
    catalogCategoryId: string | null;
    catalogSubcategoryId: string | null;
  } {
    if (!validated) {
      return { catalogItemId: null, catalogCategoryId: null, catalogSubcategoryId: null };
    }
    return {
      catalogItemId: validated.catalogItemId,
      catalogCategoryId: validated.categoryId,
      catalogSubcategoryId: validated.subcategoryId,
    };
  }

  /**
   * Bridge a canonical CatalogCategory to the synthetic legacy Category so
   * Product.categoryId retains historical semantics (slug-equality mapping,
   * P-2.3 adapter contract). Returns null when no legacy twin exists —
   * caller keeps whatever legacy value it already resolved.
   */
  async bridgeLegacyCategoryId(canonicalCategoryId: string): Promise<string | null> {    const canonical = await this.prisma.catalogCategory.findUnique({
      where: { id: canonicalCategoryId },
      select: { slug: true },
    });
    if (!canonical) return null;
    const legacy = await this.prisma.category.findUnique({
      where: { slug: canonical.slug },
      select: { id: true },
    });
    return legacy?.id ?? null;
  }
}
