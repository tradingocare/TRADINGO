import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BatchResolveMappingsResponse,
  MappingTarget,
  ResolveMappingResponse,
  ReverseMappingSource,
  ReverseResolveResponse,
} from './dto/category-mapping.dto';

/**
 * Read-only resolver over LegacyCategoryCatalogMapping.
 *
 * Authority rules (founder-approved):
 * - only rows with isActive=true and a currently-valid effective window resolve;
 * - no fuzzy/name-similarity logic — the table is authoritative for mappings
 *   that exist, and absence of rows is an honest UNMAPPED answer;
 * - primary is surfaced only when a row carries isPrimary=true (never invented).
 */
@Injectable()
export class CategoryMappingService {
  constructor(private readonly prisma: PrismaService) {}

  private validityWhere(now: Date) {
    return {
      isActive: true,
      AND: [
        { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
        { OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
      ],
    };
  }

  private toTarget(row: {
    catalogCategoryId: string;
    relationType: string;
    confidence: number;
    isPrimary: boolean;
    catalogCategory: { id: string; slug: string };
  }): MappingTarget {
    return {
      catalogCategoryId: row.catalogCategory.id,
      catalogSlug: row.catalogCategory.slug,
      relationType: row.relationType as MappingTarget['relationType'],
      confidence: row.confidence,
      isPrimary: row.isPrimary,
    };
  }

  async resolveByLegacySlug(legacySlug: string): Promise<ResolveMappingResponse> {
    const now = new Date();
    const rows = await this.prisma.legacyCategoryCatalogMapping.findMany({
      where: { ...this.validityWhere(now), legacyCategory: { slug: legacySlug } },
      include: { catalogCategory: { select: { id: true, slug: true } } },
      // Deterministic tie-break (Phase 3R): isPrimary → confidence → slug.
      orderBy: [{ isPrimary: 'desc' }, { confidence: 'desc' }, { catalogCategory: { slug: 'asc' } }],
    });
    const targets = rows.map((r) => this.toTarget(r));
    return {
      legacySlug,
      resolved: targets.length > 0,
      targets,
      primary: targets.find((t) => t.isPrimary) ?? null,
    };
  }

  async resolveBatch(legacyCategoryIds: string[]): Promise<BatchResolveMappingsResponse> {
    const ids = [...new Set((legacyCategoryIds ?? []).filter(Boolean))];
    if (ids.length === 0) {
      return { resolved: [], unresolved: [], totalInput: 0, resolvedCount: 0, unresolvedCount: 0 };
    }
    const now = new Date();
    // Bounded: exactly two queries regardless of input size (no N+1).
    const rows = await this.prisma.legacyCategoryCatalogMapping.findMany({
      where: { ...this.validityWhere(now), legacyCategoryId: { in: ids } },
      include: { catalogCategory: { select: { id: true, slug: true } } },
      // Deterministic tie-break (Phase 3R): isPrimary → confidence → slug.
      orderBy: [{ isPrimary: 'desc' }, { confidence: 'desc' }, { catalogCategory: { slug: 'asc' } }],
    });
    const legacy = await this.prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const nameById = new Map(legacy.map((c) => [c.id, c.name]));
    const rowsBySource = new Map<string, typeof rows>();
    for (const id of ids) rowsBySource.set(id, []);
    for (const row of rows) rowsBySource.get(row.legacyCategoryId)?.push(row);

    const resolved: BatchResolveMappingsResponse['resolved'] = [];
    const unresolved: BatchResolveMappingsResponse['unresolved'] = [];
    for (const id of ids) {
      const group = rowsBySource.get(id) ?? [];
      if (group.length === 0) {
        unresolved.push({ legacyCategoryId: id, legacyName: nameById.get(id) });
        continue;
      }
      const targets = group.map((r) => this.toTarget(r));
      resolved.push({
        legacyCategoryId: id,
        legacyName: nameById.get(id),
        targets,
        primary: targets.find((t) => t.isPrimary) ?? null,
      });
    }
    return {
      resolved,
      unresolved,
      totalInput: ids.length,
      resolvedCount: resolved.length,
      unresolvedCount: unresolved.length,
    };
  }

  async resolveReverse(catalogSlug: string): Promise<ReverseResolveResponse> {
    const now = new Date();
    const rows = await this.prisma.legacyCategoryCatalogMapping.findMany({
      where: { ...this.validityWhere(now), catalogCategory: { slug: catalogSlug } },
      include: { legacyCategory: { select: { id: true, slug: true } } },
      // Deterministic tie-break (Phase 3R): isPrimary → confidence → slug.
      orderBy: [{ isPrimary: 'desc' }, { confidence: 'desc' }, { legacyCategory: { slug: 'asc' } }],
    });
    const sources: ReverseMappingSource[] = rows.map((r) => ({
      legacyCategoryId: r.legacyCategory.id,
      legacySlug: r.legacyCategory.slug,
      relationType: r.relationType as ReverseMappingSource['relationType'],
      confidence: r.confidence,
      isPrimary: r.isPrimary,
    }));
    return {
      catalogSlug,
      resolved: sources.length > 0,
      sources,
      primary: sources.find((s) => s.isPrimary) ?? null,
    };
  }
}
