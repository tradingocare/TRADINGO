import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../../modules/search/search.service';
import { buildProductIndexDoc } from '../../modules/products/product-index.doc';
import { CsvParserService, CsvRow, CsvParseResult } from './csv-parser.service';
import { ImportJobStatus, ProductType } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { slugifyDeterministic, SlugAssigner } from './deterministic-slug';
import { normalizeUnit } from './unit-normalization';
import {
  resolveSubcategoryParent,
  PRESERVED_SERVICES_SUBCATEGORIES,
} from './services-redistribution';
import type { ReconciliationOutcome } from './catalog-reconciliation.service';
import { CatalogTaxonomyPersistenceService } from '../../modules/marketplace-catalog-bridge/catalog-taxonomy-persistence.service';

// Local alias: the hardened deterministic slugifier replaces the previous
// naive implementation everywhere in this file (same output shape for ASCII
// names, plus NFKD safety, minus the uuid fallback). Collision suffixes
// come exclusively from per-scope SlugAssigner instances (see each import
// method) — never from randomness, so reruns agree byte-for-byte.

export interface CatalogImportOptions {
  /**
   * Platform catalog import (workbook runs): persist canonical catalog
   * tables + masters + units + manifest job rows, but skip seller-listing
   * artifacts (`createProducts`/`indexProducts`) which require a company
   * context and would duplicate on rerun (`.create`, not upsert).
   * Default false = historical full behavior, byte-identical for existing
   * callers (seller CSV imports, resume flows, specs).
   */
  catalogOnly?: boolean;
}

function generateKeywords(text: string): string[] {
  return text.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2);
}

export interface ImportResult {
  jobId: string;
  status: ImportJobStatus;
  categoriesCreated: number;
  subcategoriesCreated: number;
  productMastersCreated: number;
  serviceMastersCreated: number;
  productsCreated: number;
  searchIndexed: number;
  // Master Catalog counts
  catalogCategoriesCreated: number;
  catalogSubcategoriesCreated: number;
  catalogItemsCreated: number;
  catalogUnitsCreated: number;
  errors: string[];
  summary: Record<string, unknown>;
}

@Injectable()
export class ImportOrchestratorService {
  private readonly logger = new Logger(ImportOrchestratorService.name);
  private readonly BATCH_SIZE = 100;
  private readonly PRODUCT_INDEX = 'products';

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly csvParser: CsvParserService,
    private readonly taxonomyPersistence: CatalogTaxonomyPersistenceService,
  ) {}

  async runFullImport(
    csvContent: Buffer,
    companyId: string,
    existingJobId?: string,
    format?: 'csv' | 'xlsx',
    options?: CatalogImportOptions,
  ): Promise<ImportResult> {
    const catalogOnly = options?.catalogOnly === true;
    // Manifest provenance: sha256 of the exact input bytes. Stored on the job
    // summary so reruns/resumes of the same file are comparable.
    const fileHash = createHash('sha256').update(csvContent).digest('hex');
    const parseResult = format === 'xlsx'
      ? this.csvParser.parseXlsx(csvContent)
      : this.csvParser.parse(csvContent);
    if (parseResult.validRows === 0) {
      return {
        jobId: '',
        status: 'FAILED' as ImportJobStatus,
        categoriesCreated: 0,
        subcategoriesCreated: 0,
        productMastersCreated: 0,
        serviceMastersCreated: 0,
        productsCreated: 0,
        searchIndexed: 0,
        catalogCategoriesCreated: 0,
        catalogSubcategoriesCreated: 0,
        catalogItemsCreated: 0,
        catalogUnitsCreated: 0,
        errors: parseResult.errors.map((e) => `Row ${e.row}: ${e.message}`),
        summary: { parseErrors: parseResult.errors.length },
      };
    }

    const jobId = existingJobId || uuid();
    const job = existingJobId
      ? await this.prisma.importJob.findUnique({ where: { id: jobId } })
      : await this.prisma.importJob.create({
          data: {
            id: jobId,
            type: 'CATEGORY',
            status: 'RUNNING',
            totalRows: parseResult.validRows,
            startedAt: new Date(),
          },
        });

    if (!job && !existingJobId) {
      throw new ConflictException('Failed to create import job');
    }

    if (existingJobId && job?.status === 'COMPLETED') {
      throw new ConflictException(`Job ${jobId} is already completed`);
    }
    const errors: string[] = [];
    let categoriesCreated = 0;
    let subcategoriesCreated = 0;
    let productMastersCreated = 0;
    let serviceMastersCreated = 0;
    let productsCreated = 0;
    let searchIndexed = 0;
    let catalogCategoriesCreated = 0;
    let catalogSubcategoriesCreated = 0;
    let catalogItemsCreated = 0;
    let catalogUnitsCreated = 0;

    try {
      // catalogOnly (platform/workbook runs): canonical catalog tables +
      // masters + units + manifest only. Legacy Category dual-write and
      // seller-listing artifacts (createProducts/indexProducts, which need a
      // company context and duplicate on rerun via .create) are skipped.
      // Default false = historical full behavior for existing callers.
      if (!catalogOnly) {
        const catResult = await this.importCategories(parseResult, jobId);
        categoriesCreated = catResult.created;

        const subcatResult = await this.importSubcategories(parseResult, jobId);
        subcategoriesCreated = subcatResult.created;
      }

      // Master Catalog import (parallel to existing pipeline)
      const catalogCatResult = await this.importCatalogCategories(parseResult, jobId);
      catalogCategoriesCreated = catalogCatResult.created;
      errors.push(...catalogCatResult.errors);

      const catalogSubcatResult = await this.importCatalogSubcategories(parseResult, jobId, catalogOnly);
      catalogSubcategoriesCreated = catalogSubcatResult.created;
      errors.push(...catalogSubcatResult.errors);
      const redistributed = [...catalogSubcatResult.redistributed];

      const catalogItemResult = await this.importCatalogItems(parseResult, jobId, catalogOnly);
      catalogItemsCreated = catalogItemResult.created;
      errors.push(...catalogItemResult.errors);
      const unitMappings = [...catalogItemResult.unitMappings];
      redistributed.push(...catalogItemResult.redistributed.filter((t) => !redistributed.includes(t)));

      const unitResult = await this.importCatalogUnits(parseResult, jobId, catalogOnly);
      catalogUnitsCreated = unitResult.created;
      errors.push(...unitResult.errors);
      for (const m of unitResult.normalized) {
        if (!unitMappings.some((u) => u.from === m.from && u.to === m.to)) unitMappings.push(m);
      }

      const pmResult = await this.importProductMasters(parseResult, jobId, catalogOnly);
      productMastersCreated = pmResult.created;
      errors.push(...pmResult.errors);

      const smResult = await this.importServiceMasters(parseResult, jobId, catalogOnly);
      serviceMastersCreated = smResult.created;
      errors.push(...smResult.errors);

      if (!catalogOnly) {
        const productResult = await this.createProducts(parseResult, companyId, jobId);
        productsCreated = productResult.created;
        errors.push(...productResult.errors);

        if (productsCreated > 0) {
          searchIndexed = await this.indexProducts(productResult.productIds, jobId);
        }
      }

      // Non-catalog runs keep the historical PARTIAL/FAILED rule untouched.
      // Catalog runs count catalog items as imported work too.
      const hasImportedWork = catalogOnly ? catalogItemsCreated > 0 : productsCreated > 0;
      const finalStatus: ImportJobStatus = errors.length > 0
        ? (hasImportedWork ? 'PARTIAL' : 'FAILED')
        : 'COMPLETED';

      // Zero-loss manifest equation (catalog-only runs): every input row must
      // resolve to exactly one canonical outcome. Aggregated from the durable
      // per-row ImportJobRow records (validatedData.outcome), never from
      // counters, so the proof survives process restarts.
      const reconciliation = catalogOnly
        ? await this.buildReconciliation(jobId, fileHash, parseResult.validRows)
        : null;

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          importedRows: productsCreated,
          errorRows: errors.length,
          completedAt: new Date(),
          summary: {
            categoriesCreated,
            subcategoriesCreated,
            productMastersCreated,
            serviceMastersCreated,
            productsCreated,
            searchIndexed,
            catalogCategoriesCreated,
            catalogSubcategoriesCreated,
            catalogItemsCreated,
            catalogUnitsCreated,
            totalErrors: errors.length,
            catalogOnly,
            fileHash,
            unitMappingsApplied: unitMappings,
            redistributionsApplied: redistributed,
            reconciliation,
          },
        },
      });

      this.logger.log(`Import job ${jobId} completed: ${finalStatus}`);

      return {
        jobId,
        status: finalStatus,
        categoriesCreated,
        subcategoriesCreated,
        productMastersCreated,
        serviceMastersCreated,
        productsCreated,
        searchIndexed,
        catalogCategoriesCreated,
        catalogSubcategoriesCreated,
        catalogItemsCreated,
        catalogUnitsCreated,
        errors,
        summary: {
          categoriesCreated,
          subcategoriesCreated,
          productMastersCreated,
          serviceMastersCreated,
          productsCreated,
          searchIndexed,
          catalogCategoriesCreated,
          catalogSubcategoriesCreated,
          catalogItemsCreated,
          catalogUnitsCreated,
          totalRows: parseResult.validRows,
          catalogOnly,
          fileHash,
          unitMappingsApplied: unitMappings,
          redistributionsApplied: redistributed,
          reconciliation,
        },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Import job ${jobId} failed: ${errorMsg}`);

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorLog: errorMsg, completedAt: new Date() },
      }).catch((e) => this.logger.error(`Failed to update job status: ${e}`));

      return {
        jobId,
        status: 'FAILED',
        categoriesCreated,
        subcategoriesCreated,
        productMastersCreated,
        serviceMastersCreated,
        productsCreated,
        searchIndexed,
        catalogCategoriesCreated,
        catalogSubcategoriesCreated,
        catalogItemsCreated,
        catalogUnitsCreated,
        errors: [errorMsg, ...errors],
        summary: { error: errorMsg },
      };
    }
  }

  private async importCategories(
    parseResult: CsvParseResult,
    _jobId: string,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];
    // Assign slugs sequentially in file order BEFORE concurrent writes so
    // collision suffixes (-2, -3, …) are deterministic across reruns.
    const assigner = new SlugAssigner();
    const planned = parseResult.categories.map((catName) => ({
      catName,
      slug: assigner.assign(catName).slug,
    }));

    for (let i = 0; i < planned.length; i += this.BATCH_SIZE) {
      const batch = planned.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ catName, slug }) => {
        try {
          await this.prisma.category.upsert({
            where: { slug },
            update: {
              name: catName,
              seoTitle: `${catName} - TRADINGO B2B`,
              isActive: true,
            },
            create: {
              name: catName,
              slug,
              seoTitle: `${catName} - TRADINGO B2B`,
              isActive: true,
            },
          });
          created++;
        } catch (err) {
          errors.push(`Category "${catName}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors };
  }

  private async importSubcategories(
    parseResult: CsvParseResult,
    _jobId: string,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];
    const allSubs: { category: string; subCategory: string }[] = [];

    for (const [cat, subs] of parseResult.subcategories) {
      for (const sub of subs) {
        allSubs.push({ category: cat, subCategory: sub });
      }
    }

    // Legacy Category.slug is GLOBALLY unique (unlike the scoped catalog
    // model), so one global assigner: a repeated sub name under a different
    // parent gets a deterministic -2 suffix instead of overwriting the first
    // row's parentId via upsert-match. (Pre-uuid code created distinct rows;
    // this preserves that invariant deterministically.)
    const assigner = new SlugAssigner();
    const planned = allSubs.map(({ category, subCategory }) => ({
      category,
      subCategory,
      slug: assigner.assign(subCategory).slug,
    }));

    for (let i = 0; i < planned.length; i += this.BATCH_SIZE) {
      const batch = planned.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ category, subCategory, slug }) => {
        try {
          const parentSlug = slugifyDeterministic(category);
          const parent = await this.prisma.category.findFirst({
            where: { slug: { startsWith: parentSlug } },
            select: { id: true },
          });

          if (!parent) {
            errors.push(`Subcategory "${subCategory}": parent category "${category}" not found`);
            return;
          }

          await this.prisma.category.upsert({
            where: { slug },
            update: {
              name: subCategory,
              parentId: parent.id,
              seoTitle: `${subCategory} - TRADINGO`,
              isActive: true,
            },
            create: {
              name: subCategory,
              slug,
              parentId: parent.id,
              seoTitle: `${subCategory} - TRADINGO`,
              isActive: true,
            },
          });
          created++;
        } catch (err) {
          errors.push(`Subcategory "${subCategory}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors };
  }

  private async importProductMasters(
    parseResult: CsvParseResult,
    jobId: string,
    catalogOnly = false,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];
    // S.No order + single global assigner: ProductMaster.slug is globally
    // unique, so reruns reproduce identical slugs and upsert-match.
    const ordered = [...parseResult.products].sort((a, b) => a.serialNo - b.serialNo);
    const assigner = new SlugAssigner();
    const planned = ordered.map((row) => ({ row, slug: assigner.assign(row.name).slug }));

    for (let i = 0; i < planned.length; i += this.BATCH_SIZE) {
      const batch = planned.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ row, slug }) => {
        try {
          const keywords = generateKeywords(row.name);

          const category = await this.prisma.category.findFirst({
            where: { slug: { startsWith: slugifyDeterministic(row.category) } },
            select: { id: true },
          });

          const subcategory = row.subCategory
            ? await this.prisma.category.findFirst({
                where: { slug: { startsWith: slugifyDeterministic(row.subCategory) } },
                select: { id: true },
              })
            : null;

          await this.prisma.productMaster.upsert({
            where: { slug },
            update: {
              name: row.name,
              categoryId: category?.id || null,
              subcategoryId: subcategory?.id || null,
              unit: catalogOnly ? normalizeUnit(row.unit).canonical || null : row.unit || null,
              hsCode: `HS-${row.serialNo}`,
              searchKeywords: keywords,
              synonyms: generateKeywords(row.altUnits),
              tags: keywords,
              metaTitle: `${row.name} - TRADINGO`,
              sourceData: catalogOnly ? { ...row, _source: 'workbook', _sno: row.serialNo, _jobId: jobId } : (row as any),
              isActive: true,
            },
            create: {
              name: row.name,
              slug,
              categoryId: category?.id || null,
              subcategoryId: subcategory?.id || null,
              unit: catalogOnly ? normalizeUnit(row.unit).canonical || null : row.unit || null,
              hsCode: `HS-${row.serialNo}`,
              searchKeywords: keywords,
              synonyms: generateKeywords(row.altUnits),
              tags: keywords,
              metaTitle: `${row.name} - TRADINGO`,
              sourceData: catalogOnly ? { ...row, _source: 'workbook', _sno: row.serialNo, _jobId: jobId } : (row as any),
              isActive: true,
            },
          });
          created++;
        } catch (err) {
          errors.push(`ProductMaster "${row.name}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors };
  }

  private async importServiceMasters(
    parseResult: CsvParseResult,
    jobId: string,
    catalogOnly = false,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];
    // Same determinism contract as importProductMasters (global slug unique).
    const ordered = [...parseResult.services].sort((a, b) => a.serialNo - b.serialNo);
    const assigner = new SlugAssigner();
    const planned = ordered.map((row) => ({ row, slug: assigner.assign(row.name).slug }));

    for (let i = 0; i < planned.length; i += this.BATCH_SIZE) {
      const batch = planned.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ row, slug }) => {
        try {
          const keywords = generateKeywords(row.name);

          const category = await this.prisma.category.findFirst({
            where: { slug: { startsWith: slugifyDeterministic(row.category) } },
            select: { id: true },
          });

          const subcategory = row.subCategory
            ? await this.prisma.category.findFirst({
                where: { slug: { startsWith: slugifyDeterministic(row.subCategory) } },
                select: { id: true },
              })
            : null;

          await this.prisma.serviceMaster.upsert({
            where: { slug },
            update: {
              name: row.name,
              categoryId: category?.id || null,
              subcategoryId: subcategory?.id || null,
              unit: catalogOnly ? normalizeUnit(row.unit).canonical || null : row.unit || null,
              sacCode: `SAC-${row.serialNo}`,
              searchKeywords: keywords,
              synonyms: generateKeywords(row.altUnits),
              tags: keywords,
              metaTitle: `${row.name} - TRADINGO`,
              sourceData: catalogOnly ? { ...row, _source: 'workbook', _sno: row.serialNo, _jobId: jobId } : (row as any),
              isActive: true,
            },
            create: {
              name: row.name,
              slug,
              categoryId: category?.id || null,
              subcategoryId: subcategory?.id || null,
              unit: catalogOnly ? normalizeUnit(row.unit).canonical || null : row.unit || null,
              sacCode: `SAC-${row.serialNo}`,
              searchKeywords: keywords,
              synonyms: generateKeywords(row.altUnits),
              tags: keywords,
              metaTitle: `${row.name} - TRADINGO`,
              sourceData: catalogOnly ? { ...row, _source: 'workbook', _sno: row.serialNo, _jobId: jobId } : (row as any),
              isActive: true,
            },
          });
          created++;
        } catch (err) {
          errors.push(`ServiceMaster "${row.name}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors };
  }

  private async createProducts(
    parseResult: CsvParseResult,
    companyId: string,
    jobId: string,
  ): Promise<{ created: number; productIds: string[]; errors: string[] }> {
    let created = 0;
    const productIds: string[] = [];
    const errors: string[] = [];

    // S.No order + single assigner: same-run name collisions get deterministic
    // -2/-3 suffixes (previously uuid-suffixed). Reruns reproduce identical
    // slugs, so .create surfaces honest P2002 errors instead of silently
    // doubling listings. Catalog-only runs skip this method entirely.
    const ordered = [...parseResult.rows].sort((a, b) => a.serialNo - b.serialNo);
    const assigner = new SlugAssigner();
    const planned = ordered.map((row) => ({ row, slug: assigner.assign(row.name).slug }));

    for (let i = 0; i < planned.length; i += this.BATCH_SIZE) {
      const batch = planned.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ row, slug }) => {
        try {
          const category = await this.prisma.category.findFirst({
            where: { slug: { startsWith: slugifyDeterministic(row.category) } },
            select: { id: true },
          });

          // P0-2: imported products must carry canonical lineage, not just a
          // legacy slug-matched category. Deterministic exact-only classify
          // on name (no LLM per row — free, reproducible, zero-loss: rows
          // that resolve to nothing keep the historical legacy-only write).
          const canonical = await this.taxonomyPersistence
            .resolvePersistableTaxonomy({
              name: row.name,
              description: row.subCategory ? `${row.name} ${row.subCategory}` : row.name,
              context: row.type === 'Service' ? 'service' : 'product',
              expectedType: row.type === 'Service' ? 'Service' : 'Product',
            })
            .catch(() => null);
          let categoryId = category?.id || null;
          if (canonical && !categoryId) {
            categoryId =
              (await this.taxonomyPersistence.bridgeLegacyCategoryId(canonical.categoryId)) ?? null;
          }

          const product = await this.prisma.product.create({
            data: {
              companyId,
              categoryId,
              catalogItemId: canonical?.catalogItemId ?? null,
              catalogCategoryId: canonical?.categoryId ?? null,
              catalogSubcategoryId: canonical?.subcategoryId ?? null,
              name: row.name,
              slug,
              productType: row.type === 'Service' ? 'SERVICE' as ProductType : 'PHYSICAL' as ProductType,
              status: 'DRAFT',
              unit: row.unit || null,
              moq: 1,
              createdBy: 'catalog-import',
              updatedBy: 'catalog-import',
              shortDescription: `${row.name} - ${row.category}${row.subCategory ? ` / ${row.subCategory}` : ''}`,
              gstInvoiceAvailable: true,
              tradeCreditEligible: false,
              trustScoreSnapshot: 0,
              isFeatured: false,
              isBestseller: false,
            },
          });

          productIds.push(product.id);
          created++;

          await this.createImportJobRow(jobId, row, product.id);
        } catch (err) {
          errors.push(`Product "${row.name}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, productIds, errors };
  }

  private async createImportJobRow(jobId: string, row: CsvRow, productId: string): Promise<void> {
    await this.prisma.importJobRow.create({
      data: {
        importJobId: jobId,
        rowNumber: row.serialNo,
        status: 'IMPORTED',
        entityType: 'PRODUCT',
        entityId: productId,
        rawData: row as any,
        checksum: `${row.serialNo}-${row.name}-${row.type}`,
      },
    });
  }

  /**
   * Durable per-row manifest record (catalog-only runs). The canonical
   * outcome vocabulary is IMPORTED | TRANSFORMED | MAPPED_TO_EXISTING |
   * FOUNDER_REVIEW. `ImportRowStatus` has no TRANSFORMED/MAPPED/REVIEW
   * values, so the DB status carries the closest native value (IMPORTED for
   * imported-or-flagged rows, DUPLICATE for rerun matches) and the canonical
   * label lives in `validatedData.outcome` alongside provenance. The Phase 8
   * equation counts canonical labels, never DB statuses.
   */
  private async recordRowOutcome(
    jobId: string,
    row: CsvRow,
    outcome: ReconciliationOutcome,
    entityId: string | null,
    transformations: string[],
    reviewFlags: string[],
    slug: string,
  ): Promise<void> {
    const dbStatus = outcome === 'MAPPED_TO_EXISTING' ? 'DUPLICATE' : 'IMPORTED';
    await this.prisma.importJobRow.create({
      data: {
        importJobId: jobId,
        rowNumber: row.serialNo,
        status: dbStatus as 'IMPORTED' | 'DUPLICATE',
        entityType: 'CATALOG_ROW',
        entityId,
        rawData: row as any,
        validatedData: {
          outcome,
          source: 'workbook',
          sno: row.serialNo,
          slug,
          transformations,
          reviewFlags,
        } as any,
        checksum: `${row.serialNo}|${row.category}|${row.subCategory}|${row.name}|${row.type}`,
        warnings: [...transformations, ...reviewFlags],
        duplicateOf: outcome === 'MAPPED_TO_EXISTING' ? entityId : null,
        importedAt: new Date(),
      },
    }).catch((e) => this.logger.error(`Failed to record row outcome (sno ${row.serialNo}): ${e}`));
  }

  /**
   * Zero-loss manifest equation, aggregated from durable job rows (never
   * from in-memory counters): INPUT ROWS = IMPORTED + TRANSFORMED +
   * MAPPED_TO_EXISTING + FOUNDER_REVIEW. Returns the proof object stored
   * on the job summary.
   */
  private async buildReconciliation(jobId: string, fileHash: string, inputRows: number) {
    const rows = await this.prisma.importJobRow.findMany({
      where: { importJobId: jobId, entityType: 'CATALOG_ROW' },
      select: { validatedData: true },
    });
    const totals: Record<ReconciliationOutcome, number> = {
      IMPORTED: 0,
      TRANSFORMED: 0,
      MAPPED_TO_EXISTING: 0,
      FOUNDER_REVIEW: 0,
    };
    for (const r of rows) {
      const outcome = (r.validatedData as any)?.outcome as ReconciliationOutcome | undefined;
      if (outcome && outcome in totals) totals[outcome]++;
    }
    const accounted = totals.IMPORTED + totals.TRANSFORMED + totals.MAPPED_TO_EXISTING + totals.FOUNDER_REVIEW;
    return {
      fileHash,
      inputRows,
      accountedRows: accounted,
      unaccountedRows: inputRows - accounted,
      totals,
      balanced: accounted === inputRows,
    };
  }

  private async indexProducts(
    productIds: string[],
    _jobId: string,
  ): Promise<number> {
    let indexed = 0;

    for (let i = 0; i < productIds.length; i += this.BATCH_SIZE) {
      const batch = productIds.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async (id) => {
        try {
          const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
              media: { select: { url: true, type: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
              category: { select: { id: true, name: true, slug: true } },
              industry: { select: { id: true, name: true, slug: true } },
              specifications: { select: { key: true, value: true } },
              inventory: { select: { availableQuantity: true, stockStatus: true } },
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  trustScore: true,
                  verificationLevel: true,
                  businessType: true,
                  establishedYear: true,
                  gstNumber: true,
                  certifications: true,
                  locations: {
                    select: { city: true, state: true, country: true, isPrimary: true },
                    where: { deletedAt: null },
                  },
                },
              },
              priceSlabs: { select: { minQty: true, maxQty: true, price: true, currency: true }, orderBy: { minQty: 'asc' } },
              catalogItem: { select: { id: true, slug: true, subcategory: { select: { name: true } } } },
            },
          });

          if (!product) return;

          await this.searchService.indexDocument(this.PRODUCT_INDEX, product.id, buildProductIndexDoc(product as any));
          indexed++;
        } catch (err) {
          this.logger.warn(`Failed to index product ${id}: ${err}`);
        }
      }));
    }

    return indexed;
  }

  // ═══════════════════════════════════════════════════════════════
  // MASTER CATALOG IMPORT METHODS
  // Immutable — no manual CRUD. CSV is the only source of truth.
  // Uses deterministic slugs (no UUID suffix) for idempotent re-import.
  // ═══════════════════════════════════════════════════════════════

  private async importCatalogCategories(
    parseResult: CsvParseResult,
    _jobId: string,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < parseResult.categories.length; i += this.BATCH_SIZE) {
      const batch = parseResult.categories.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async (catName) => {
        try {
          // Deterministic: CatalogCategory.slug is globally unique and the
          // upsert key, so the base slug alone is the stable identity.
          const slug = slugifyDeterministic(catName);
          await this.prisma.catalogCategory.upsert({
            where: { slug },
            update: {
              name: catName,
              description: `${catName} - Master Catalog category`,
              seoTitle: catName,
              seoDescription: `${catName} - Browse products and services on TRADINGO`,
              isActive: true,
            },
            create: {
              name: catName,
              slug,
              description: `${catName} - Master Catalog category`,
              seoTitle: catName,
              seoDescription: `${catName} - Browse products and services on TRADINGO`,
              isActive: true,
            },
          });
          created++;
        } catch (err) {
          errors.push(`CatalogCategory "${catName}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors };
  }

  private async importCatalogSubcategories(
    parseResult: CsvParseResult,
    _jobId: string,
    catalogOnly = false,
  ): Promise<{ created: number; errors: string[]; redistributed: string[] }> {
    let created = 0;
    const errors: string[] = [];
    const redistributed: string[] = [];
    const allSubs: { category: string; subCategory: string }[] = [];

    for (const [cat, subs] of parseResult.subcategories) {
      for (const sub of subs) {
        allSubs.push({ category: cat, subCategory: sub });
      }
    }

    // DD-01 (catalog-only runs): redirect the 4 matched Services pairs to
    // their verified counterpart categories BEFORE parent resolution, so the
    // scoped upsert key (categoryId, slug) lands under the right parent on
    // first write and on every rerun. Per-parent assigners keep identical
    // sub names under different parents on their base slugs.
    const assigners = new Map<string, SlugAssigner>();
    const planned = allSubs.map(({ category, subCategory }) => {
      let effectiveCategory = category;
      if (catalogOnly) {
        const redirect = resolveSubcategoryParent(category, subCategory);
        if (redirect.redirected) {
          effectiveCategory = redirect.category;
          if (redirect.trace && !redistributed.includes(redirect.trace)) {
            redistributed.push(redirect.trace);
          }
        }
      }
      const key = effectiveCategory.trim().toLowerCase();
      let assigner = assigners.get(key);
      if (!assigner) {
        assigner = new SlugAssigner();
        assigners.set(key, assigner);
      }
      return { category, effectiveCategory, subCategory, slug: assigner.assign(subCategory).slug };
    });

    for (let i = 0; i < planned.length; i += this.BATCH_SIZE) {
      const batch = planned.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ category: _category, effectiveCategory, subCategory, slug }) => {
        try {
          const parentSlug = slugifyDeterministic(effectiveCategory);
          const parent = await this.prisma.catalogCategory.findUnique({
            where: { slug: parentSlug },
            select: { id: true },
          });

          if (!parent) {
            errors.push(`CatalogSubcategory "${subCategory}": parent catalog category "${effectiveCategory}" not found`);
            return;
          }

          await this.prisma.catalogSubcategory.upsert({
            where: { categoryId_slug: { categoryId: parent.id, slug } },
            update: {
              name: subCategory,
              seoTitle: subCategory,
              seoDescription: `Explore ${subCategory} in ${effectiveCategory} on TRADINGO`,
            },
            create: {
              categoryId: parent.id,
              name: subCategory,
              slug,
              seoTitle: subCategory,
              seoDescription: `Explore ${subCategory} in ${effectiveCategory} on TRADINGO`,
            },
          });
          created++;
        } catch (err) {
          errors.push(`CatalogSubcategory "${subCategory}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors, redistributed };
  }

  private async importCatalogItems(
    parseResult: CsvParseResult,
    jobId: string,
    catalogOnly = false,
  ): Promise<{ created: number; errors: string[]; unitMappings: { from: string; to: string; reason: string }[]; redistributed: string[] }> {
    let created = 0;
    const errors: string[] = [];
    const unitMappings = new Map<string, { from: string; to: string; reason: string }>();
    const redistributed = new Set<string>();

    // S.No order + single global assigner: CatalogItem.slug is globally unique.
    const ordered = [...parseResult.rows].sort((a, b) => a.serialNo - b.serialNo);
    const assigner = new SlugAssigner();
    const planned = ordered.map((row) => ({ row, slug: assigner.assign(row.name).slug }));

    for (let i = 0; i < planned.length; i += this.BATCH_SIZE) {
      const batch = planned.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ row, slug }) => {
        try {
          // DD-01: resolve the EFFECTIVE parent (redirected for the 4 matched
          // Services pairs in catalog-only runs) so items land under the same
          // parent their subcategory row did. Non-catalog runs keep history.
          let effectiveCategory = row.category;
          if (catalogOnly) {
            const redirect = resolveSubcategoryParent(row.category, row.subCategory);
            if (redirect.redirected) {
              effectiveCategory = redirect.category;
              if (redirect.trace) redistributed.add(redirect.trace);
            }
          }
          const catSlug = slugifyDeterministic(effectiveCategory);
          const category = await this.prisma.catalogCategory.findUnique({
            where: { slug: catSlug },
            select: { id: true },
          });

          if (!category) {
            errors.push(`CatalogItem "${row.name}": parent category "${effectiveCategory}" not found`);
            if (catalogOnly) {
              await this.recordRowOutcome(jobId, row, 'FOUNDER_REVIEW', null, [], [`missing-parent: catalog category "${effectiveCategory}" not found`], slug);
            }
            return;
          }

          const subcatSlug = slugifyDeterministic(row.subCategory);
          const subcategory = await this.prisma.catalogSubcategory.findUnique({
            where: { categoryId_slug: { categoryId: category.id, slug: subcatSlug } },
            select: { id: true },
          });

          if (!subcategory) {
            errors.push(`CatalogItem "${row.name}": parent subcategory "${row.subCategory}" not found`);
            if (catalogOnly) {
              await this.recordRowOutcome(jobId, row, 'FOUNDER_REVIEW', null, [], [`missing-parent: catalog subcategory "${row.subCategory}" not found under "${effectiveCategory}"`], slug);
            }
            return;
          }

          // DD-04 hybrid normalization (catalog-only runs): verified
          // equivalents map to the canonical dictionary name; everything else
          // passes through verbatim. The transformation is recorded per row.
          const transformations: string[] = [];
          let unit: string | null = row.unit || null;
          let altUnits: string | null = row.altUnits || null;
          if (catalogOnly) {
            const normalizedUnit = normalizeUnit(row.unit);
            if (normalizedUnit.transformed) {
              transformations.push(`unit ${row.unit} → ${normalizedUnit.canonical} (${normalizedUnit.reason})`);
              unitMappings.set(`${row.unit}→${normalizedUnit.canonical}`, { from: row.unit, to: normalizedUnit.canonical, reason: normalizedUnit.reason });
              unit = normalizedUnit.canonical;
            }
            const normalizedAlt = normalizeUnit(row.altUnits);
            if (normalizedAlt.transformed) {
              transformations.push(`altUnits ${row.altUnits} → ${normalizedAlt.canonical} (${normalizedAlt.reason})`);
              unitMappings.set(`${row.altUnits}→${normalizedAlt.canonical}`, { from: row.altUnits, to: normalizedAlt.canonical, reason: normalizedAlt.reason });
              altUnits = normalizedAlt.canonical;
            }
            if (effectiveCategory !== row.category) {
              transformations.push(`DD-01 redistribute: (${row.category} / ${row.subCategory}) parented under "${effectiveCategory}"`);
            }
          }
          const keywords = [
            ...generateKeywords(row.name),
            ...generateKeywords(row.category),
            ...generateKeywords(row.subCategory),
          ];

          // Phase 6 provenance: every catalog row carries its workbook origin.
          // Non-catalog runs keep the historical bare-row shape untouched.
          const sourceData = catalogOnly
            ? { ...row, _source: 'workbook', _sno: row.serialNo, _jobId: jobId }
            : (row as any);

          // MAPPED detection (rerun path, catalog-only runs): a slug match is
          // only a true match when it names the same record — otherwise it
          // is a collision that must never merge (FOUNDER_REVIEW). Skipped
          // entirely for legacy runs (historical behavior: no pre-read).
          const preExisting = catalogOnly
            ? await this.prisma.catalogItem.findUnique({
              where: { slug },
              select: { id: true, name: true, subcategoryId: true, type: true },
            })
            : null;
          const sameIdentity = !!preExisting &&
            preExisting.name.trim().toLowerCase() === row.name.trim().toLowerCase() &&
            preExisting.subcategoryId === subcategory.id;
          if (catalogOnly && preExisting && !sameIdentity) {
            // Collision: skip the write entirely so the existing record is
            // never merged with a different logical row.
            await this.recordRowOutcome(
              jobId, row, 'FOUNDER_REVIEW', preExisting.id, transformations,
              [`slug-collision: slug "${slug}" already names "${preExisting.name}" — write skipped, not merged`], slug,
            );
            created++;
            return;
          }

          await this.prisma.catalogItem.upsert({
            where: { slug },
            update: {
              name: row.name,
              type: row.type === 'Service' ? 'Service' : 'Product',
              unit,
              altUnits,
              quantityParams: row.quantityParams || null,
              hsCode: row.type === 'Product' ? undefined : undefined,
              sacCode: row.type === 'Service' ? undefined : undefined,
              keywords,
              synonyms: generateKeywords(row.altUnits),
              seoTitle: row.name,
              seoDescription: `${row.name} - ${row.category} / ${row.subCategory} on TRADINGO`,
              isActive: true,
              sourceData,
            },
            create: {
              subcategoryId: subcategory.id,
              name: row.name,
              slug,
              type: row.type === 'Service' ? 'Service' : 'Product',
              unit,
              altUnits,
              quantityParams: row.quantityParams || null,
              hsCode: row.type === 'Product' ? `HS-${row.serialNo}` : null,
              sacCode: row.type === 'Service' ? `SAC-${row.serialNo}` : null,
              keywords,
              synonyms: generateKeywords(row.altUnits),
              seoTitle: row.name,
              seoDescription: `${row.name} - ${row.category} / ${row.subCategory} on TRADINGO`,
              isActive: true,
              sourceData,
            },
          });
          if (catalogOnly) {
            const createdRow = await this.prisma.catalogItem.findUnique({ where: { slug }, select: { id: true } });
            // Rerun matches are pure MAPPED (this run changed nothing
            // material — the upsert above was a no-op refresh). Preserved-
            // unmatched Services rows import normally under the preserved
            // parent AND carry the review flag (DD-01).
            const isPreservedRow =
              row.category.trim().toLowerCase() === 'services' &&
              (PRESERVED_SERVICES_SUBCATEGORIES as readonly string[]).some(
                (s) => s.toLowerCase() === row.subCategory.trim().toLowerCase(),
              );
            if (preExisting && sameIdentity) {
              await this.recordRowOutcome(jobId, row, 'MAPPED_TO_EXISTING', createdRow?.id ?? null, [], [], slug);
            } else if (isPreservedRow) {
              await this.recordRowOutcome(
                jobId, row, 'FOUNDER_REVIEW', createdRow?.id ?? null, transformations,
                ['FOUNDER_REVIEW: preserved-unmatched Services subcategory — imported under Services, placement confirmation pending (DD-01)'],
                slug,
              );
            } else {
              await this.recordRowOutcome(
                jobId, row,
                transformations.length > 0 ? 'TRANSFORMED' : 'IMPORTED',
                createdRow?.id ?? null, transformations, [], slug,
              );
            }
          }
          created++;
        } catch (err) {
          errors.push(`CatalogItem "${row.name}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors, unitMappings: [...unitMappings.values()], redistributed: [...redistributed] };
  }

  private async importCatalogUnits(
    parseResult: CsvParseResult,
    _jobId: string,
    catalogOnly = false,
  ): Promise<{ created: number; errors: string[]; normalized: { from: string; to: string; reason: string }[] }> {
    let created = 0;
    const errors: string[] = [];
    const normalized: { from: string; to: string; reason: string }[] = [];
    const seen = new Set<string>();

    // DD-04 hybrid normalization (catalog-only runs): verified equivalents
    // resolve to the canonical dictionary name; distinct strings pass
    // through verbatim as their own rows. Non-catalog runs keep history.
    const unitSet = new Set<string>();
    for (const row of parseResult.rows) {
      for (const raw of [row.unit, row.altUnits]) {
        if (!raw) continue;
        const value = catalogOnly ? normalizeUnit(raw).canonical : raw.trim();
        if (!value) continue;
        if (catalogOnly) {
          const n = normalizeUnit(raw);
          if (n.transformed && !seen.has(`${raw}→${n.canonical}`)) {
            seen.add(`${raw}→${n.canonical}`);
            normalized.push({ from: raw, to: n.canonical, reason: n.reason });
          }
        }
        unitSet.add(value);
      }
    }

    const uniqueUnits = [...unitSet].filter(Boolean);
    for (const unit of uniqueUnits) {
      try {
        const lowerName = unit.toLowerCase();
        lowerName.replace(/[/\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
        await this.prisma.catalogUnit.upsert({
          where: { name: unit },
          update: { symbol: unit },
          create: { name: unit, symbol: unit, category: 'imported' },
        });
        created++;
      } catch (err) {
        errors.push(`CatalogUnit "${unit}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return { created, errors, normalized };
  }

  async resumeImport(
    jobId: string,
    companyId: string,
    options?: CatalogImportOptions,
  ): Promise<ImportResult> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
      include: { rows: { where: { status: 'ERROR' }, select: { rawData: true } } },
    });

    if (!job) {
      return {
        jobId,
        status: 'FAILED',
        categoriesCreated: 0,
        subcategoriesCreated: 0,
        productMastersCreated: 0,
        serviceMastersCreated: 0,
        productsCreated: 0,
        searchIndexed: 0,
        catalogCategoriesCreated: 0,
        catalogSubcategoriesCreated: 0,
        catalogItemsCreated: 0,
        catalogUnitsCreated: 0,
        errors: [`Job ${jobId} not found`],
        summary: {},
      };
    }

    if (job.status !== 'FAILED' && job.status !== 'PARTIAL') {
      return {
        jobId,
        status: job.status as ImportJobStatus,
        categoriesCreated: 0,
        subcategoriesCreated: 0,
        productMastersCreated: 0,
        serviceMastersCreated: 0,
        productsCreated: 0,
        searchIndexed: 0,
        catalogCategoriesCreated: 0,
        catalogSubcategoriesCreated: 0,
        catalogItemsCreated: 0,
        catalogUnitsCreated: 0,
        errors: [`Job ${jobId} is in ${job.status} status, cannot resume`],
        summary: {},
      };
    }

    const failedRows = job.rows
      .filter((r) => r.rawData && typeof r.rawData === 'object')
      .map((r) => r.rawData as Record<string, unknown>);

    if (failedRows.length === 0) {
      return {
        jobId,
        status: 'COMPLETED',
        categoriesCreated: 0,
        subcategoriesCreated: 0,
        productMastersCreated: 0,
        serviceMastersCreated: 0,
        productsCreated: 0,
        searchIndexed: 0,
        catalogCategoriesCreated: 0,
        catalogSubcategoriesCreated: 0,
        catalogItemsCreated: 0,
        catalogUnitsCreated: 0,
        errors: [],
        summary: { message: 'No failed rows to resume' },
      };
    }

    const header = 'S.No,Category (Landing Page),Sub Category,Product / Service Name,Type,Unit Mapping,Alt / Secondary Units,Quantity Parameters';
    const csvContent = header + '\n' + failedRows.map((r) =>
      `${r.serialNo},${r.category},${r.subCategory},"${r.name}",${r.type},${r.unit},${r.altUnits},${r.quantityParams}`
    ).join('\n');

    // A resumed catalog-only job must stay catalog-only; fall back to the
    // flag stored on the original job summary when the caller omits it.
    const storedCatalogOnly = (job.summary as any)?.catalogOnly === true;
    const catalogOnly = options?.catalogOnly ?? storedCatalogOnly;
    return this.runFullImport(
      Buffer.from(csvContent),
      companyId,
      jobId,
      undefined,
      catalogOnly ? { catalogOnly: true } : undefined,
    );
  }
}
