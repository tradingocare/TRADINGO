import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../../modules/search/search.service';
import { buildProductIndexDoc } from '../../modules/products/product-index.doc';
import { CsvParserService, CsvRow, CsvParseResult } from './csv-parser.service';
import { ImportJobStatus, ProductType } from '@prisma/client';
import { v4 as uuid } from 'uuid';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${uuid().slice(0, 8)}`;
}

function generateUniqueSlug(name: string): string {
  return `${slugify(name)}-${uuid().slice(0, 6)}`;
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
  ) {}

  async runFullImport(
    csvContent: Buffer,
    companyId: string,
    existingJobId?: string,
    format?: 'csv' | 'xlsx',
  ): Promise<ImportResult> {
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
      const catResult = await this.importCategories(parseResult, jobId);
      categoriesCreated = catResult.created;

      const subcatResult = await this.importSubcategories(parseResult, jobId);
      subcategoriesCreated = subcatResult.created;

      // Master Catalog import (parallel to existing pipeline)
      const catalogCatResult = await this.importCatalogCategories(parseResult, jobId);
      catalogCategoriesCreated = catalogCatResult.created;
      errors.push(...catalogCatResult.errors);

      const catalogSubcatResult = await this.importCatalogSubcategories(parseResult, jobId);
      catalogSubcategoriesCreated = catalogSubcatResult.created;
      errors.push(...catalogSubcatResult.errors);

      const catalogItemResult = await this.importCatalogItems(parseResult, jobId);
      catalogItemsCreated = catalogItemResult.created;
      errors.push(...catalogItemResult.errors);

      const unitResult = await this.importCatalogUnits(parseResult, jobId);
      catalogUnitsCreated = unitResult.created;
      errors.push(...unitResult.errors);

      const pmResult = await this.importProductMasters(parseResult, jobId);
      productMastersCreated = pmResult.created;
      errors.push(...pmResult.errors);

      const smResult = await this.importServiceMasters(parseResult, jobId);
      serviceMastersCreated = smResult.created;
      errors.push(...smResult.errors);

      const productResult = await this.createProducts(parseResult, companyId, jobId);
      productsCreated = productResult.created;
      errors.push(...productResult.errors);

      if (productsCreated > 0) {
        searchIndexed = await this.indexProducts(productResult.productIds, jobId);
      }

      const finalStatus: ImportJobStatus = errors.length > 0
        ? (productsCreated > 0 ? 'PARTIAL' : 'FAILED')
        : 'COMPLETED';

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

    for (let i = 0; i < parseResult.categories.length; i += this.BATCH_SIZE) {
      const batch = parseResult.categories.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async (catName) => {
        try {
          const slug = generateUniqueSlug(catName);
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

    for (let i = 0; i < allSubs.length; i += this.BATCH_SIZE) {
      const batch = allSubs.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ category, subCategory }) => {
        try {
          const parentSlug = slugify(category);
          const parent = await this.prisma.category.findFirst({
            where: { slug: { startsWith: parentSlug } },
            select: { id: true },
          });

          if (!parent) {
            errors.push(`Subcategory "${subCategory}": parent category "${category}" not found`);
            return;
          }

          const slug = generateUniqueSlug(subCategory);
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
    _jobId: string,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < parseResult.products.length; i += this.BATCH_SIZE) {
      const batch = parseResult.products.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async (row) => {
        try {
          const slug = generateUniqueSlug(row.name);
          const keywords = generateKeywords(row.name);

          const category = await this.prisma.category.findFirst({
            where: { slug: { startsWith: slugify(row.category) } },
            select: { id: true },
          });

          const subcategory = row.subCategory
            ? await this.prisma.category.findFirst({
                where: { slug: { startsWith: slugify(row.subCategory) } },
                select: { id: true },
              })
            : null;

          await this.prisma.productMaster.upsert({
            where: { slug },
            update: {
              name: row.name,
              categoryId: category?.id || null,
              subcategoryId: subcategory?.id || null,
              unit: row.unit || null,
              hsCode: `HS-${row.serialNo}`,
              searchKeywords: keywords,
              synonyms: generateKeywords(row.altUnits),
              tags: keywords,
              metaTitle: `${row.name} - TRADINGO`,
              sourceData: row as any,
              isActive: true,
            },
            create: {
              name: row.name,
              slug,
              categoryId: category?.id || null,
              subcategoryId: subcategory?.id || null,
              unit: row.unit || null,
              hsCode: `HS-${row.serialNo}`,
              searchKeywords: keywords,
              synonyms: generateKeywords(row.altUnits),
              tags: keywords,
              metaTitle: `${row.name} - TRADINGO`,
              sourceData: row as any,
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
    _jobId: string,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < parseResult.services.length; i += this.BATCH_SIZE) {
      const batch = parseResult.services.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async (row) => {
        try {
          const slug = generateUniqueSlug(row.name);
          const keywords = generateKeywords(row.name);

          const category = await this.prisma.category.findFirst({
            where: { slug: { startsWith: slugify(row.category) } },
            select: { id: true },
          });

          const subcategory = row.subCategory
            ? await this.prisma.category.findFirst({
                where: { slug: { startsWith: slugify(row.subCategory) } },
                select: { id: true },
              })
            : null;

          await this.prisma.serviceMaster.upsert({
            where: { slug },
            update: {
              name: row.name,
              categoryId: category?.id || null,
              subcategoryId: subcategory?.id || null,
              unit: row.unit || null,
              sacCode: `SAC-${row.serialNo}`,
              searchKeywords: keywords,
              synonyms: generateKeywords(row.altUnits),
              tags: keywords,
              metaTitle: `${row.name} - TRADINGO`,
              sourceData: row as any,
              isActive: true,
            },
            create: {
              name: row.name,
              slug,
              categoryId: category?.id || null,
              subcategoryId: subcategory?.id || null,
              unit: row.unit || null,
              sacCode: `SAC-${row.serialNo}`,
              searchKeywords: keywords,
              synonyms: generateKeywords(row.altUnits),
              tags: keywords,
              metaTitle: `${row.name} - TRADINGO`,
              sourceData: row as any,
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

    for (let i = 0; i < parseResult.rows.length; i += this.BATCH_SIZE) {
      const batch = parseResult.rows.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async (row) => {
        try {
          const category = await this.prisma.category.findFirst({
            where: { slug: { startsWith: slugify(row.category) } },
            select: { id: true },
          });

          const slug = generateUniqueSlug(row.name);

          const product = await this.prisma.product.create({
            data: {
              companyId,
              categoryId: category?.id || null,
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
          const slug = slugify(catName);
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
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];
    const allSubs: { category: string; subCategory: string }[] = [];

    for (const [cat, subs] of parseResult.subcategories) {
      for (const sub of subs) {
        allSubs.push({ category: cat, subCategory: sub });
      }
    }

    for (let i = 0; i < allSubs.length; i += this.BATCH_SIZE) {
      const batch = allSubs.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async ({ category, subCategory }) => {
        try {
          const parentSlug = slugify(category);
          const parent = await this.prisma.catalogCategory.findUnique({
            where: { slug: parentSlug },
            select: { id: true },
          });

          if (!parent) {
            errors.push(`CatalogSubcategory "${subCategory}": parent catalog category "${category}" not found`);
            return;
          }

          const slug = slugify(subCategory);
          await this.prisma.catalogSubcategory.upsert({
            where: { categoryId_slug: { categoryId: parent.id, slug } },
            update: {
              name: subCategory,
              seoTitle: subCategory,
              seoDescription: `Explore ${subCategory} in ${category} on TRADINGO`,
            },
            create: {
              categoryId: parent.id,
              name: subCategory,
              slug,
              seoTitle: subCategory,
              seoDescription: `Explore ${subCategory} in ${category} on TRADINGO`,
            },
          });
          created++;
        } catch (err) {
          errors.push(`CatalogSubcategory "${subCategory}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors };
  }

  private async importCatalogItems(
    parseResult: CsvParseResult,
    _jobId: string,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < parseResult.rows.length; i += this.BATCH_SIZE) {
      const batch = parseResult.rows.slice(i, i + this.BATCH_SIZE);
      await Promise.all(batch.map(async (row) => {
        try {
          const catSlug = slugify(row.category);
          const category = await this.prisma.catalogCategory.findUnique({
            where: { slug: catSlug },
            select: { id: true },
          });

          if (!category) {
            errors.push(`CatalogItem "${row.name}": parent category "${row.category}" not found`);
            return;
          }

          const subcatSlug = slugify(row.subCategory);
          const subcategory = await this.prisma.catalogSubcategory.findUnique({
            where: { categoryId_slug: { categoryId: category.id, slug: subcatSlug } },
            select: { id: true },
          });

          if (!subcategory) {
            errors.push(`CatalogItem "${row.name}": parent subcategory "${row.subCategory}" not found`);
            return;
          }

          const slug = slugify(row.name);
          const keywords = [
            ...generateKeywords(row.name),
            ...generateKeywords(row.category),
            ...generateKeywords(row.subCategory),
          ];

          await this.prisma.catalogItem.upsert({
            where: { slug },
            update: {
              name: row.name,
              type: row.type === 'Service' ? 'Service' : 'Product',
              unit: row.unit || null,
              altUnits: row.altUnits || null,
              quantityParams: row.quantityParams || null,
              hsCode: row.type === 'Product' ? undefined : undefined,
              sacCode: row.type === 'Service' ? undefined : undefined,
              keywords,
              synonyms: generateKeywords(row.altUnits),
              seoTitle: row.name,
              seoDescription: `${row.name} - ${row.category} / ${row.subCategory} on TRADINGO`,
              isActive: true,
              sourceData: row as any,
            },
            create: {
              subcategoryId: subcategory.id,
              name: row.name,
              slug,
              type: row.type === 'Service' ? 'Service' : 'Product',
              unit: row.unit || null,
              altUnits: row.altUnits || null,
              quantityParams: row.quantityParams || null,
              hsCode: row.type === 'Product' ? `HS-${row.serialNo}` : null,
              sacCode: row.type === 'Service' ? `SAC-${row.serialNo}` : null,
              keywords,
              synonyms: generateKeywords(row.altUnits),
              seoTitle: row.name,
              seoDescription: `${row.name} - ${row.category} / ${row.subCategory} on TRADINGO`,
              isActive: true,
              sourceData: row as any,
            },
          });
          created++;
        } catch (err) {
          errors.push(`CatalogItem "${row.name}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }));
    }

    return { created, errors };
  }

  private async importCatalogUnits(
    parseResult: CsvParseResult,
    _jobId: string,
  ): Promise<{ created: number; errors: string[] }> {
    let created = 0;
    const errors: string[] = [];

    const unitSet = new Set<string>();
    for (const row of parseResult.rows) {
      if (row.unit) unitSet.add(row.unit.trim());
      if (row.altUnits) unitSet.add(row.altUnits.trim());
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

    return { created, errors };
  }

  async resumeImport(jobId: string, companyId: string): Promise<ImportResult> {
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

    return this.runFullImport(Buffer.from(csvContent), companyId, jobId);
  }
}
