import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { CatalogClassifyService } from '../marketplace-catalog-bridge/catalog-classify.service';
import { CatalogTaxonomyPersistenceService } from '../marketplace-catalog-bridge/catalog-taxonomy-persistence.service';
import { entitlementLimit } from '../membership/plan-entitlements';
import { v4 as uuid } from 'uuid';

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly catalogClassify: CatalogClassifyService,
    private readonly taxonomyPersistence: CatalogTaxonomyPersistenceService,
  ) {}

  private async resolveCompany(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({ where: { userId }, include: { company: true } });
    if (!owner) throw new ForbiddenException('Company not found');
    return owner.company;
  }

   async previewImport(userId: string, rows: any[]) {
     await this.resolveCompany(userId);
     const results = [];
     const warnings: any[] = [];
     for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];
      if (!row.name) errors.push('Name is required');
      if (row.sku) {
        // Check uniqueness within company
      }
      // Pre-flight taxonomy check (Phase 12): same resolver as execute, so
      // sellers see unmapped categories BEFORE importing. Never invalidates.
      const { warning } = await this.classifyRowCategory(row.category, i + 1);
      if (warning) warnings.push(warning);
      results.push({ row: i + 1, name: row.name || '', valid: errors.length === 0, errors });
    }
    return { total: rows.length, valid: results.filter(r => r.valid).length, invalid: results.filter(r => !r.valid).length, rows: results, warnings };
  }

  async validateRows(userId: string, rows: any[]) {
    return this.previewImport(userId, rows);
  }

  /**
   * Canonical category resolution for a free-text bulk row value (Phase 12).
   * Deterministic tiers only (exact → synonym), never LLM per row.
   * Returns taxonomy metadata + an optional explicit warning. Never throws
   * for unresolvable input — the caller imports uncategorized and reports.
   */
  private async classifyRowCategory(
    rowCategory: unknown,
    rowNumber: number,
  ): Promise<{
    taxonomy: { resolved: boolean; categoryId: string | null; categoryName: string | null; matchType: string | null };
    warning: { row: number; warning: string } | null;
  }> {
    const empty = { resolved: false, categoryId: null, categoryName: null, matchType: null };
    if (!rowCategory || typeof rowCategory !== 'string' || !rowCategory.trim()) {
      return { taxonomy: empty, warning: null };
    }
    try {
      const resolved = await this.catalogClassify.resolveCategoryText(rowCategory);
      if (resolved) {
        return {
          taxonomy: { resolved: true, categoryId: resolved.categoryId, categoryName: resolved.categoryName, matchType: resolved.matchType },
          warning: null,
        };
      }
      return {
        taxonomy: empty,
        warning: {
          row: rowNumber,
          warning: `Category "${rowCategory}" did not resolve to the canonical catalog — imported uncategorized. Pick from the structured category list to classify it.`,
        },
      };
    } catch (e: any) {
      // Resolution is advisory: a resolver failure must never fail the row.
      this.logger.warn(`Bulk taxonomy resolution failed for row ${rowNumber}: ${e?.message || e}`);
      return { taxonomy: empty, warning: null };
    }
  }

  async executeImport(userId: string, rows: any[]) {
    const company = await this.resolveCompany(userId);
    const imported: any[] = [];
    const errors: any[] = [];
    // Phase 12 (FD-TAX-01/04): free-text row.category must resolve to the
    // canonical catalog or be explicitly reported. Unmapped rows still import
    // (historical behavior preserved) but land in `warnings` — never silently
    // dropped, never inventing a category.
    const warnings: any[] = [];

    // 2B-2B: version-pinned companies get an upfront guard against their
    // snapshot listing cap (bulk path previously bypassed checkMembershipLimit
    // entirely); legacy subscribers keep ungated import verbatim.
    const snap = await this.membershipService.getVersionedEntitlements(company.id);
    if (snap && 'product_listings_limit' in snap) {
      const max = entitlementLimit(snap, 'product_listings_limit', Infinity);
      if (max !== Infinity) {
        const current = await this.prisma.product.count({
          where: { companyId: company.id, deletedAt: null, status: { not: 'DISCONTINUED' as ProductStatus } },
        });
        if (current + rows.length > max) {
          throw new BadRequestException(
            `Plan allows ${max} products (currently ${current}); importing ${rows.length} rows would exceed the limit`,
          );
        }
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name) { errors.push({ row: i + 1, error: 'Name is required' }); continue; }

        const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + `-${uuid().slice(0, 4)}`;
        const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
        const finalSlug = existingSlug ? `${slug}-${uuid().slice(0, 4)}` : slug;

        let categoryId: string | undefined;
        // P0-2 (F-05): canonical resolution is NO LONGER advisory-only —
        // the resolved canonical category + deterministic item classification
        // are persisted on the Product record. Unmapped rows still import
        // uncategorized (zero-loss preserved) and land in `warnings` —
        // never silently dropped, never inventing a category.
        const { taxonomy, warning } = await this.classifyRowCategory(row.category, i + 1);
        if (warning) warnings.push(warning);
        if (row.category) {
          const cat = await this.prisma.category.findFirst({ where: { slug: row.category.toLowerCase().replace(/ /g, '-') } });
          if (cat) categoryId = cat.id;
        }
        // Deterministic item-level classify (exact-only, free, per row).
        const canonical = await this.taxonomyPersistence
          .resolvePersistableTaxonomy({
            confirmed: taxonomy.resolved
              ? { categoryId: taxonomy.categoryId, subcategoryId: null, catalogItemId: null }
              : undefined,
            name: row.name,
            description: (row.shortDescription as string) || (row.description as string) || null,
            brand: (row.brand as string) || null,
            context: 'product',
            expectedType: 'Product',
          })
          .catch(() => null);
        if (canonical && !categoryId) {
          categoryId =
            (await this.taxonomyPersistence.bridgeLegacyCategoryId(canonical.categoryId)) ?? undefined;
        }

        const product = await this.prisma.product.create({
          data: {
            companyId: company.id, categoryId, name: row.name, slug: finalSlug,
            catalogItemId: canonical?.catalogItemId ?? null,
            catalogCategoryId: canonical?.categoryId ?? null,
            catalogSubcategoryId: canonical?.subcategoryId ?? null,
            shortDescription: row.shortDescription, description: row.description,
            brand: row.brand, model: row.model, sku: row.sku, moq: row.moq ? Number(row.moq) : 1,
            unit: row.unit, originalPrice: row.price ? Number(row.price) : undefined,
            status: (row.status === 'active' ? 'ACTIVE' : 'DRAFT') as any,
            createdBy: userId, updatedBy: userId,
          },
        });
        imported.push({ row: i + 1, productId: product.id, name: product.name, taxonomy });
      } catch (e: any) {
        errors.push({ row: i + 1, error: e.message || 'Import failed' });
      }
    }

    return { imported: imported.length, failed: errors.length, products: imported, errors, warnings };
  }

  async uploadZip(userId: string, files: { fileName: string; url: string }[]) {
    return { uploaded: files.length, files };
  }
}
