import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapterService } from '../catalog-adapter/catalog-adapter.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { SynonymIntelligenceService } from '../enterprise-catalog/services/synonym-intelligence.service';
import { ClassifyCatalogDto, ClassifyCatalogResponse } from './dto/classify-catalog.dto';

/**
 * Unified taxonomy classification service — POST /catalog/classify.
 *
 * Single entry point that fronts the existing classification fragments
 * WITHOUT duplicating their logic:
 *  - exact tier: direct Prisma reads (same tables every consumer uses);
 *  - synonym tier: SynonymIntelligenceService.expandQuery (the shared engine);
 *  - AI tier: AiGatewayService.process with TaskType.CATEGORY_SUGGESTION
 *    (the shared primitive AiProductIntelligenceService also uses; the
 *    catalog-tree prompt context here is new capability, not a copy —
 *    the existing prompt only knows the legacy tree);
 *  - fallback tier: CatalogAdapterService.unifiedSearch (the same primitive
 *    TradeservService.resolveServiceCategory is built on).
 * Chaining whole LLM services per call is deliberately avoided: each LLM
 * hop costs credits + latency, so exactly ONE gateway call happens per
 * classify request, only when deterministic tiers miss.
 *
 * Confidence bands (FD-TAX-05): thresholds are env-calibratable
 * (CLASSIFY_AUTO_THRESHOLD / CLASSIFY_SUGGEST_THRESHOLD). Structural
 * defaults are conservative by design — only deterministic exactness earns
 * HIGH pre-calibration; every LLM-derived result starts at MEDIUM so a
 * human confirms it. Calibration may promote LLM-high to AUTO later.
 */
@Injectable()
export class CatalogClassifyService {
  private readonly logger = new Logger(CatalogClassifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly catalogAdapter: CatalogAdapterService,
    private readonly aiGateway: AiGatewayService,
    private readonly synonyms: SynonymIntelligenceService,
  ) {}

  private autoThreshold(): number {
    const raw = Number(this.configService.get<string>('CLASSIFY_AUTO_THRESHOLD'));
    return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : 1.0;
  }

  private suggestThreshold(): number {
    const raw = Number(this.configService.get<string>('CLASSIFY_SUGGEST_THRESHOLD'));
    return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : 0.5;
  }

  private bandFor(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (confidence >= this.autoThreshold()) return 'HIGH';
    if (confidence >= this.suggestThreshold()) return 'MEDIUM';
    return 'LOW';
  }

  async classify(
    dto: ClassifyCatalogDto,
    companyId: string,
    userId?: string,
    options?: { aiTier?: boolean },
  ): Promise<ClassifyCatalogResponse> {
    const name = dto.name.trim();
    const contextType = dto.context === 'service' ? 'Service' : dto.context === 'product' ? 'Product' : null;

    // Tier 1 — exact: deterministic, confidence 1.0, auto-appliable.
    const exact = await this.exactMatch(name, contextType);
    if (exact) return exact;

    // Tier 2 — synonym expansion through the shared engine.
    const synonymHit = await this.synonymMatch(name, dto.description, contextType);
    if (synonymHit) return synonymHit;

    // Tier 3 — single LLM call with catalog-tree context (never legacy tree).
    // Skippable for bulk validation (aiTier:false): deterministic tiers only,
    // so per-row classification stays free, fast, and reproducible.
    if (options?.aiTier === false) {
      return this.fallback(name, contextType);
    }
    try {
      const aiHit = await this.aiClassify(dto, name, contextType, companyId, userId);
      if (aiHit) return aiHit;
    } catch (err) {
      this.logger.warn(`Classify LLM tier failed, falling through: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Tier 4 — honest fallback: top unified-search candidates as picker input.
    return this.fallback(name, contextType);
  }

  private async exactMatch(
    name: string,
    contextType: 'Product' | 'Service' | null,
  ): Promise<ClassifyCatalogResponse | null> {
    const itemWhere: Record<string, unknown> = {
      OR: [{ name: { equals: name, mode: 'insensitive' } }],
    };
    if (contextType) itemWhere['type'] = contextType;
    const item = await this.prisma.catalogItem.findFirst({
      where: { ...(itemWhere as any), isActive: true },
      select: {
        id: true, name: true, type: true,
        subcategory: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
      },
    });
    if (!item) return null;
    return {
      categoryId: item.subcategory.category.id,
      subcategoryId: item.subcategory.id,
      catalogItemId: item.id,
      type: item.type as 'Product' | 'Service',
      confidence: 1.0,
      band: this.bandFor(1.0),
      matchType: 'exact',
      reasons: [`exact name match on catalog item "${item.name}"`],
      alternatives: [],
      categoryName: item.subcategory.category.name,
      subcategoryName: item.subcategory.name,
    };
  }

  private async synonymMatch(
    name: string,
    description: string | undefined,
    contextType: 'Product' | 'Service' | null,
  ): Promise<ClassifyCatalogResponse | null> {
    const expanded = await this.synonyms.expandQuery([name, description || ''].filter(Boolean).join(' '));
    const terms = [...new Set([expanded.original, ...expanded.expanded])].filter(Boolean);
    if (terms.length === 0) return null;
    const candidates = await this.prisma.catalogItem.findMany({
      where: {
        isActive: true,
        ...(contextType ? { type: contextType } : {}),
        OR: terms.slice(0, 12).flatMap((t) => [
          { name: { contains: t, mode: 'insensitive' } },
          { keywords: { has: t } },
          { synonyms: { has: t } },
        ]),
      },
      select: {
        id: true, name: true, type: true,
        subcategory: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
      },
      take: 6,
    });
    if (candidates.length === 0) return null;
    // Single unambiguous candidate → MEDIUM (strong lexical signal, still
    // human-confirmed pre-calibration). Ambiguous → LOW picker below.
    const [top, ...rest] = candidates;
    const confidence = rest.length === 0 ? 0.8 : 0.4;
    const band = this.bandFor(confidence);
    if (band === 'LOW' || rest.length > 0) {
      return {
        categoryId: null,
        subcategoryId: null,
        catalogItemId: null,
        type: null,
        confidence,
        band: 'LOW',
        matchType: 'fallback',
        reasons: [`${candidates.length} synonym candidates — picker required`],
        alternatives: candidates.slice(0, 5).map((c) => ({
          categoryId: c.subcategory.category.id,
          subcategoryId: c.subcategory.id,
          catalogItemId: c.id,
          label: `${c.subcategory.category.name} / ${c.subcategory.name} / ${c.name}`,
          confidence: 0.4,
        })),
      };
    }
    return {
      categoryId: top.subcategory.category.id,
      subcategoryId: top.subcategory.id,
      catalogItemId: top.id,
      type: top.type as 'Product' | 'Service',
      confidence,
      band,
      matchType: 'synonym',
      reasons: [`single synonym-expanded match on "${top.name}"`],
      alternatives: [],
      categoryName: top.subcategory.category.name,
      subcategoryName: top.subcategory.name,
    };
  }

  private async aiClassify(
    dto: ClassifyCatalogDto,
    name: string,
    contextType: 'Product' | 'Service' | null,
    companyId: string,
    userId?: string,
  ): Promise<ClassifyCatalogResponse | null> {
    const tree = await this.catalogAdapter.getCatalogTree();
    // Cap context: top categories by sort order keep the prompt bounded.
    const catContext = tree
      .slice(0, 60)
      .map((c: any) => {
        const subs = (c.subcategories || c.children || []).slice(0, 12).map((s: any) => s.name).join(', ');
        return `${c.name} (${c.slug})${subs ? ` -> ${subs}` : ''}`;
      })
      .join('\n');
    const parts = [`For product "${name}"`];
    if (dto.brand) parts.push(`(Brand: ${dto.brand}`);
    if (dto.description) parts.push(`Description: ${dto.description.slice(0, 500)}`);
    if (dto.attributes && Object.keys(dto.attributes).length > 0) {
      parts.push(`Attributes: ${Object.entries(dto.attributes).slice(0, 8).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
    }
    if (contextType) parts.push(`Offer context: ${contextType}`);
    const result = await this.aiGateway.process(
      {
        taskType: TaskType.CATEGORY_SUGGESTION,
        payload: {
          action: 'suggest_category',
          instructions: `${parts.join(' ')} — pick the best category from this canonical hierarchy:\n${catContext}\n\nReturn JSON with keys: suggestedCategory (string - category name), suggestedSubcategory (string or null), confidence ("high"/"medium"/"low"), reasoning (string), alternatives (array of {name: string, reasoning: string}, max 3).`,
          productName: name,
        },
      } as any,
      companyId,
      userId,
    );
    let content: any;
    try {
      content = JSON.parse((result as any).content ?? (result as any).text ?? '{}');
    } catch {
      return null;
    }
    if (!content?.suggestedCategory) return null;
    // Resolve suggestion names to canonical IDs server-side — the client
    // must never re-resolve (F-11 fix at the source).
    const resolved = await this.resolveSuggestion(content.suggestedCategory, content.suggestedSubcategory ?? null);
    if (!resolved) {
      return {
        categoryId: null,
        subcategoryId: null,
        catalogItemId: null,
        type: null,
        confidence: 0.3,
        band: 'LOW',
        matchType: 'fallback',
        reasons: [`AI suggested "${content.suggestedCategory}" which resolves to no canonical node — picker required`],
        alternatives: [],
      };
    }
    // LLM-derived results start at MEDIUM regardless of the model's own
    // label — only calibration (FD-TAX-05) may promote LLM-high to AUTO.
    const alternatives = Array.isArray(content.alternatives) ? content.alternatives.slice(0, 3) : [];
    return {
      categoryId: resolved.categoryId,
      subcategoryId: resolved.subcategoryId,
      catalogItemId: null,
      type: contextType,
      confidence: 0.7,
      band: this.bandFor(0.7),
      matchType: 'ai',
      reasons: [`AI suggestion: ${content.suggestedCategory}${resolved.subcategoryName ? ` / ${resolved.subcategoryName}` : ''}`, String(content.reasoning || '').slice(0, 300)],
      alternatives: alternatives.map((a: any) => ({
        categoryId: resolved.categoryId,
        subcategoryId: resolved.subcategoryId,
        catalogItemId: null,
        label: String(a?.name || 'alternative'),
        confidence: 0.5,
      })),
      categoryName: content.suggestedCategory,
      subcategoryName: resolved.subcategoryName,
    };
  }

  private async resolveSuggestion(
    categoryName: string,
    subcategoryName: string | null,
  ): Promise<{ categoryId: string; subcategoryId: string | null; subcategoryName: string | null } | null> {
    const category = await this.prisma.catalogCategory.findFirst({
      where: { OR: [{ name: { equals: categoryName, mode: 'insensitive' } }] },
      select: { id: true, name: true },
    });
    if (!category) return null;
    if (!subcategoryName) return { categoryId: category.id, subcategoryId: null, subcategoryName: null };
    const subcategory = await this.prisma.catalogSubcategory.findFirst({
      where: { categoryId: category.id, name: { equals: subcategoryName, mode: 'insensitive' } },
      select: { id: true, name: true },
    });
    return {
      categoryId: category.id,
      subcategoryId: subcategory?.id ?? null,
      subcategoryName: subcategory?.name ?? null,
    };
  }

  /**
   * Category-text resolution for bulk/onboarding flows (Phase 12).
   * Resolves a bare category display string to a canonical CatalogCategory
   * ID using deterministic tiers only (exact → synonym) — deliberately NO
   * LLM tier, so bulk validation stays free, fast, and reproducible.
   * Returns null when unresolvable; callers MUST surface an explicit
   * unmapped-row report (never silent drops, never invented categories).
   */
  async resolveCategoryText(
    text: string,
  ): Promise<{ categoryId: string; categoryName: string; matchType: 'exact' | 'synonym' } | null> {
    const cleaned = (text || '').trim();
    if (!cleaned) return null;
    const exact = await this.prisma.catalogCategory.findFirst({
      where: { isActive: true, OR: [{ name: { equals: cleaned, mode: 'insensitive' } }] },
      select: { id: true, name: true },
    });
    if (exact) return { categoryId: exact.id, categoryName: exact.name, matchType: 'exact' };
    const expanded = await this.synonyms.expandQuery(cleaned);
    const terms = [...new Set([expanded.original, ...expanded.expanded])].filter(Boolean);
    for (const term of terms.slice(0, 8)) {
      const hit = await this.prisma.catalogCategory.findFirst({
        where: { isActive: true, name: { contains: term, mode: 'insensitive' } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });
      if (hit) return { categoryId: hit.id, categoryName: hit.name, matchType: 'synonym' };
    }
    return null;
  }

  private async fallback(
    name: string,
    contextType: 'Product' | 'Service' | null,
  ): Promise<ClassifyCatalogResponse> {
    const hits = await this.catalogAdapter.unifiedSearch(name, { includeOld: false, includeCatalog: true, limit: 8 });
    const alternatives: ClassifyCatalogResponse['alternatives'] = [];
    for (const hit of hits) {
      if (hit.type === 'catalogItem') {
        const item = await this.prisma.catalogItem.findUnique({
          where: { id: hit.id },
          select: {
            id: true, name: true, type: true,
            subcategory: { select: { id: true, category: { select: { id: true } } } },
          },
        });
        if (!item) continue;
        if (contextType && item.type !== contextType) continue;
        alternatives.push({
          categoryId: item.subcategory.category.id,
          subcategoryId: item.subcategory.id,
          catalogItemId: item.id,
          label: hit.parentName ? `${hit.parentName} / ${hit.name}` : hit.name,
          confidence: 0.3,
        });
        if (alternatives.length >= 5) break;
      }
    }
    return {
      categoryId: null,
      subcategoryId: null,
      catalogItemId: null,
      type: null,
      confidence: 0.2,
      band: 'LOW',
      matchType: alternatives.length > 0 ? 'fallback' : 'unclassified',
      reasons: alternatives.length > 0
        ? ['no exact, synonym, or AI match — closest catalog hits offered for the structured picker']
        : ['no catalog match at all — structured picker required'],
      alternatives,
    };
  }
}
