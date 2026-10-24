import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CsvParseResult, CsvRow } from './csv-parser.service';
import { slugifyDeterministic, SlugAssigner } from './deterministic-slug';
import { normalizeUnit } from './unit-normalization';
import { resolveSubcategoryParent, PRESERVED_SERVICES_SUBCATEGORIES } from './services-redistribution';

/**
 * Catalog reconciliation engine (Phase 3 — zero-loss manifest).
 *
 * Maps WORKBOOK rows → canonical CatalogCategory → CatalogSubcategory →
 * CatalogItem → Product/Service master linkage WITHOUT writing anything:
 * `planImport()` is strictly read-only. The import path executes the same
 * resolutions and records the same outcomes per row.
 *
 * Outcome vocabulary (directive-locked, nothing else):
 *  - IMPORTED           — row creates new canonical records, verbatim
 *                         (modulo structural deterministic slugs).
 *  - TRANSFORMED        — row creates new records with a recorded data
 *                         transformation (unit normalization and/or DD-01
 *                         subcategory re-parenting).
 *  - MAPPED_TO_EXISTING — row resolves to already-present records
 *                         (rerun path; slug match AND name match required —
 *                         a slug match with different content is NOT a match).
 *  - FOUNDER_REVIEW     — row needs founder placement confirmation. The row
 *                         is STILL imported under its preserved parent (never
 *                         dropped); it is additionally listed in the review
 *                         artifact. Covers: the 126 preserved-unmatched
 *                         Services rows, slug-collision mismatches, and
 *                         structurally invalid rows (invalid rows are the
 *                         ONLY case that is not imported).
 *
 * Persisted per row into ImportJobRow.validatedData as
 * `{ outcome, transformations, reviewFlags, source: 'workbook', sno }`
 * (ImportRowStatus has no TRANSFORMED/MAPPED/REVIEW values, so the DB status
 * carries the closest native value — IMPORTED or DUPLICATE — and the
 * canonical outcome lives in validatedData; the manifest equation counts
 * the canonical labels, never the DB status).
 */

export type ReconciliationOutcome =
  | 'IMPORTED'
  | 'TRANSFORMED'
  | 'MAPPED_TO_EXISTING'
  | 'FOUNDER_REVIEW';

export interface RowManifestEntry {
  sno: number;
  category: string;
  subcategory: string;
  name: string;
  type: 'Product' | 'Service';
  outcome: ReconciliationOutcome;
  /** Resolved (or would-be) entity ids; null when the entity must be created. */
  entityIds: {
    categoryId: string | null;
    subcategoryId: string | null;
    itemId: string | null;
  };
  transformations: string[];
  reviewFlags: string[];
  checksum: string;
}

export interface ReconciliationManifest {
  fileHash: string | null;
  rowCount: number;
  totals: Record<ReconciliationOutcome, number>;
  rows: RowManifestEntry[];
  reviewArtifact: {
    preservedServicesRows: RowManifestEntry[];
    unitMappingsApplied: { from: string; to: string; reason: string }[];
    redistributionsApplied: string[];
  };
}

const PRESERVED_SET = new Set(PRESERVED_SERVICES_SUBCATEGORIES.map((s) => s.toLowerCase()));

export function rowChecksum(row: CsvRow): string {
  return `${row.serialNo}|${row.category}|${row.subCategory}|${row.name}|${row.type}`;
}

@Injectable()
export class CatalogReconciliationService {
  private readonly logger = new Logger(CatalogReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async planImport(parseResult: CsvParseResult, fileHash: string | null = null): Promise<ReconciliationManifest> {
    const rows = [...parseResult.rows].sort((a, b) => a.serialNo - b.serialNo);
    const itemAssigner = new SlugAssigner();
    // Pre-assign item slugs in S.No order so collision suffixes are stable
    // regardless of DB state or write concurrency.
    const itemSlugs = new Map<number, { slug: string; suffixed: boolean }>();
    for (const row of rows) {
      if (!row.name) continue;
      const assigned = itemAssigner.assign(row.name);
      itemSlugs.set(row.serialNo, { slug: assigned.slug, suffixed: assigned.suffixed });
    }

    const manifestRows: RowManifestEntry[] = [];
    const totals: Record<ReconciliationOutcome, number> = {
      IMPORTED: 0,
      TRANSFORMED: 0,
      MAPPED_TO_EXISTING: 0,
      FOUNDER_REVIEW: 0,
    };
    // Structured collectors (no string parsing — mappings are recorded at
    // the point of decision, not reverse-engineered from display text).
    const unitMappings = new Map<string, { from: string; to: string; reason: string }>();
    const redistributions = new Set<string>();

    for (const row of rows) {
      const entry = await this.planRow(row, itemSlugs.get(row.serialNo)?.slug ?? slugifyDeterministic(row.name || 'item'), {
        unitMappings,
        redistributions,
      });
      manifestRows.push(entry);
      totals[entry.outcome]++;
    }

    return {
      fileHash,
      rowCount: rows.length,
      totals,
      rows: manifestRows,
      reviewArtifact: {
        preservedServicesRows: manifestRows.filter((r) => r.outcome === 'FOUNDER_REVIEW' && !r.reviewFlags.some((f) => f.startsWith('invalid'))),
        unitMappingsApplied: [...unitMappings.values()],
        redistributionsApplied: [...redistributions],
      },
    };
  }

  private async planRow(
    row: CsvRow,
    itemSlug: string,
    collect: {
      unitMappings: Map<string, { from: string; to: string; reason: string }>;
      redistributions: Set<string>;
    },
  ): Promise<RowManifestEntry> {
    const base = {
      sno: row.serialNo,
      category: row.category,
      subcategory: row.subCategory,
      name: row.name,
      type: row.type,
      entityIds: { categoryId: null as string | null, subcategoryId: null as string | null, itemId: null as string | null },
      transformations: [] as string[],
      reviewFlags: [] as string[],
      checksum: rowChecksum(row),
    };

    // Structurally invalid rows can never be imported — flagged, never dropped.
    if (!row.name || !row.category || !row.subCategory) {
      return {
        ...base,
        outcome: 'FOUNDER_REVIEW',
        reviewFlags: ['invalid: blank name/category/subcategory — not imported, founder review required'],
      };
    }

    // DD-01 redistribution: resolve the EFFECTIVE parent before anything else.
    const redistribution = resolveSubcategoryParent(row.category, row.subCategory);
    const effectiveCategory = redistribution.category;
    if (redistribution.redirected && redistribution.trace) {
      base.transformations.push(redistribution.trace);
      collect.redistributions.add(redistribution.trace);
    }

    const category = await this.prisma.catalogCategory.findUnique({
      where: { slug: slugifyDeterministic(effectiveCategory) },
      select: { id: true, name: true },
    });
    if (category) base.entityIds.categoryId = category.id;

    let subcategory: { id: string; name: string } | null = null;
    if (base.entityIds.categoryId) {
      subcategory = await this.prisma.catalogSubcategory.findUnique({
        where: {
          categoryId_slug: { categoryId: base.entityIds.categoryId, slug: slugifyDeterministic(row.subCategory) },
        },
        select: { id: true, name: true },
      });
      if (subcategory) base.entityIds.subcategoryId = subcategory.id;
    }

    const existingItem = await this.prisma.catalogItem.findUnique({
      where: { slug: itemSlug },
      select: { id: true, name: true, subcategoryId: true, type: true },
    });

    // Unit normalization markers (never block; recorded either way).
    for (const unitValue of [row.unit, row.altUnits]) {
      if (!unitValue) continue;
      const normalized = normalizeUnit(unitValue);
      if (normalized.transformed) {
        base.transformations.push(`unit ${unitValue} → ${normalized.canonical} (${normalized.reason})`);
        collect.unitMappings.set(`${unitValue}→${normalized.canonical}`, {
          from: unitValue,
          to: normalized.canonical,
          reason: normalized.reason,
        });
      }
    }

    // Preserved-unmatched Services rows: imported under Services AND flagged.
    const isPreservedServicesRow =
      row.category.trim().toLowerCase() === 'services' &&
      PRESERVED_SET.has(row.subCategory.trim().toLowerCase());
    if (isPreservedServicesRow) {
      base.reviewFlags.push('FOUNDER_REVIEW: preserved-unmatched Services subcategory — imported under Services, placement confirmation pending (DD-01)');
      if (existingItem) base.entityIds.itemId = existingItem.id;
      return { ...base, outcome: 'FOUNDER_REVIEW' };
    }

    if (existingItem) {
      base.entityIds.itemId = existingItem.id;
      // A slug match is only a true match when it names the same record.
      // Anything else is a collision demanding human review — never a merge.
      const sameRecord =
        existingItem.name.trim().toLowerCase() === row.name.trim().toLowerCase() &&
        (!base.entityIds.subcategoryId || existingItem.subcategoryId === base.entityIds.subcategoryId);
      if (sameRecord) {
        return { ...base, outcome: 'MAPPED_TO_EXISTING' };
      }
      base.reviewFlags.push(
        `slug-collision: slug "${itemSlug}" already names "${existingItem.name}" — not merged, founder review required`,
      );
      return { ...base, outcome: 'FOUNDER_REVIEW' };
    }

    if (base.transformations.length > 0) {
      return { ...base, outcome: 'TRANSFORMED' };
    }
    return { ...base, outcome: 'IMPORTED' };
  }
}
