import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapterService } from '../catalog-adapter/catalog-adapter.service';
import { NotificationService } from '../notification/notification.service';
import { RazorpayService } from '../payment/gateways/razorpay.service';
import { Prisma, ProfessionalCompanyStatus, BookingPaymentStatus, BookingStatus, NotificationType } from '@prisma/client';
import { GocashIntegrationService } from '../gocash-integration/gocash-integration.service';
import { BookingFinancialOrchestratorService } from './booking-financial-orchestrator.service';
import { CatalogTaxonomyPersistenceService } from '../marketplace-catalog-bridge/catalog-taxonomy-persistence.service';

@Injectable()
export class TradeservService {
  private readonly logger = new Logger(TradeservService.name);
  private indexSyncService: { indexProfessional(companyId: string): Promise<void>; removeProfessional(companyId: string): Promise<void> } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogAdapter: CatalogAdapterService,
    private readonly notificationService: NotificationService,
    private readonly razorpayService: RazorpayService,
    private readonly gocashIntegration: GocashIntegrationService,
    private readonly financialOrchestrator: BookingFinancialOrchestratorService,
    private readonly taxonomyPersistence: CatalogTaxonomyPersistenceService,
  ) {}

  setIndexSyncService(service: { indexProfessional(companyId: string): Promise<void>; removeProfessional(companyId: string): Promise<void> }) {
    this.indexSyncService = service;
  }

  async getProfessionalBySlug(slug: string) {
    // C-01 P1 P1-1: public detail is APPROVED-only — PENDING_REVIEW/REJECTED
    // professionals must not be publicly viewable by slug (same gate as every
    // listing path). Owner preview uses the owner-scoped workspace endpoints.
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        professionalServices: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        professionalPortfolio: { orderBy: { sortOrder: 'asc' } },
        professionalCertifications: { orderBy: { issueDate: 'desc' } },
        professionalAvailability: { orderBy: { dayOfWeek: 'asc' } },
        professionalLanguages: true,
        professionalServiceAreas: true,
        reviewsAsProfessional: { include: { client: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        locations: true,
      },
    });
    if (!company?.professionalType || company.professionalStatus !== ProfessionalCompanyStatus.APPROVED) {
      throw new NotFoundException('Professional not found');
    }
    return company;
  }

  async getProfessionalSummary(slug: string) {
    // C-01 P1 P1-1: APPROVED-only parity with the detail lookup above.
    const company = await this.prisma.company.findUnique({
      where: { slug, professionalType: { not: null }, professionalStatus: ProfessionalCompanyStatus.APPROVED },
      select: {
        id: true, name: true, slug: true, logo: true, professionalType: true,
        description: true, trustScore: true, verificationLevel: true,
        responseTimeMinutes: true, lastActiveAt: true, videoIntroductionUrl: true,
        socialLinks: true, professionalStatus: true,
        locations: { select: { city: true, state: true } },
        _count: { select: { professionalServices: true, professionalPortfolio: true, reviewsAsProfessional: true } },
      },
    });
    if (!company) throw new NotFoundException('Professional not found');

    const avgRating = await this.prisma.professionalReview.aggregate({
      where: { companyId: company.id },
      _avg: { rating: true },
    });
    const languages = await this.prisma.professionalLanguage.findMany({
      where: { companyId: company.id },
      select: { language: true },
    });

    return {
      ...company,
      serviceCount: company._count.professionalServices,
      portfolioCount: company._count.professionalPortfolio,
      reviewCount: company._count.reviewsAsProfessional,
      averageRating: avgRating._avg.rating || 0,
      locations: company.locations.map(l => l.city),
      languages: languages.map(l => l.language),
      _count: undefined,
    };
  }

  async searchProfessionals(params: {
    query?: string; category?: string; city?: string; professionalType?: string;
    minRating?: number; maxPrice?: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
    page?: number; limit?: number;
    // C-01 P1 F-8: canonical company-ID sets resolved by the controller
    // (OpenSearch-fallback parity — same resolver, same honest-empty).
    canonicalCompanyIds?: string[];
  }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      professionalType: { not: null },
      professionalStatus: ProfessionalCompanyStatus.APPROVED,
    };

    // C-01 P1 F-8: canonical filter parity with the OpenSearch path.
    // `[]` = validated-but-unsatisfiable (honest empty via sentinel);
    // non-empty = exact company-ID membership.
    if (params.canonicalCompanyIds != null) {
      where.id = params.canonicalCompanyIds.length === 0
        ? { in: ['__canonical_no_match__'] }
        : { in: params.canonicalCompanyIds };
    }

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
      ];
    }
    if (params.professionalType) {
      where.professionalType = params.professionalType as any;
    }
    if (params.city) {
      where.locations = { some: { city: { contains: params.city, mode: 'insensitive' } } };
    }
    if (params.minRating) {
      where.reviewsAsProfessional = { some: { rating: { gte: params.minRating } } };
    }

    if (params.category) {
      where.professionalServices = {
        some: { category: { contains: params.category, mode: 'insensitive' }, isActive: true },
      };
    }

    const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
    if (params.sortBy === 'trustScore') orderBy.trustScore = params.sortOrder || 'desc';
    else if (params.sortBy === 'name') orderBy.name = params.sortOrder || 'asc';
    else if (params.sortBy === 'lastActiveAt') orderBy.lastActiveAt = params.sortOrder || 'desc';
    else orderBy.trustScore = 'desc';

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true, name: true, slug: true, logo: true, professionalType: true,
          description: true, trustScore: true, verificationLevel: true,
          responseTimeMinutes: true, lastActiveAt: true, professionalStatus: true,
          locations: { select: { city: true, state: true } },
          _count: { select: { professionalServices: true, reviewsAsProfessional: true } },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: data.map(c => ({
        ...c, serviceCount: c._count.professionalServices,
        reviewCount: c._count.reviewsAsProfessional, _count: undefined,
        locations: c.locations.map(l => l.city),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  /**
   * C-01 P1 F-8: canonical taxonomy filter resolver for TradeServ search
   * (Step-5 semantics, transposed to the professional-services domain).
   *
   * Server-side validation against the live catalog:
   *  - every submitted ID must exist (category/subcategory) and be active;
   *  - CatalogItem must be active AND type = 'Service' (product taxonomy can
   *    never filter professionals — Phase 10 separation);
   *  - parent/child chain respected: subcategory must belong to the submitted
   *    category; item must belong to the submitted subcategory/category —
   *    any contradictory combination resolves to the honest empty set.
   *
   * Resolves to the exact set of APPROVED professional company IDs whose
   * active ProfessionalServices carry the validated canonical linkage.
   * Returns `null` when NO canonical filter was submitted (chain unchanged);
   * `[]` means validated-but-unsatisfiable — never unfiltered, never leaking.
   */
  async resolveCanonicalCompanyFilters(input: {
    catalogCategoryId?: string;
    catalogSubcategoryId?: string;
    catalogItemId?: string;
  }): Promise<string[] | null> {
    if (!input.catalogCategoryId && !input.catalogSubcategoryId && !input.catalogItemId) {
      return null;
    }

    try {
      let allowedItemIds: string[] | null = null; // null = unconstrained so far

      if (input.catalogCategoryId) {
        const category = await this.prisma.catalogCategory.findFirst({
          where: { id: input.catalogCategoryId, isActive: true },
          select: { id: true },
        });
        if (!category) {
          this.logger.warn(`Canonical tradeserv filter: catalogCategoryId ${input.catalogCategoryId} not found/active — honest empty`);
          return [];
        }
        const services = await this.prisma.catalogItem.findMany({
          where: {
            isActive: true,
            type: 'Service',
            subcategory: { categoryId: input.catalogCategoryId },
          },
          select: { id: true },
        });
        allowedItemIds = services.map((s) => s.id);
      }

      if (input.catalogSubcategoryId) {
        const sub = await this.prisma.catalogSubcategory.findFirst({
          where: { id: input.catalogSubcategoryId },
          select: { id: true, categoryId: true },
        });
        if (!sub) {
          this.logger.warn(`Canonical tradeserv filter: catalogSubcategoryId ${input.catalogSubcategoryId} not found — honest empty`);
          return [];
        }
        if (input.catalogCategoryId && sub.categoryId !== input.catalogCategoryId) {
          this.logger.warn(
            `Canonical tradeserv filter: subcategory ${input.catalogSubcategoryId} belongs to category ${sub.categoryId}, not the submitted ${input.catalogCategoryId} — honest empty`,
          );
          return [];
        }
        const services = await this.prisma.catalogItem.findMany({
          where: { isActive: true, type: 'Service', subcategoryId: input.catalogSubcategoryId },
          select: { id: true },
        });
        const subSet = services.map((s) => s.id);
        allowedItemIds = allowedItemIds === null
          ? subSet
          : allowedItemIds.filter((id) => subSet.includes(id));
      }

      if (input.catalogItemId) {
        const item = await this.prisma.catalogItem.findFirst({
          where: { id: input.catalogItemId, isActive: true, type: 'Service' },
          select: { id: true, subcategoryId: true, subcategory: { select: { categoryId: true } } },
        });
        if (!item) {
          this.logger.warn(`Canonical tradeserv filter: catalogItemId ${input.catalogItemId} not found/active/Service — honest empty`);
          return [];
        }
        allowedItemIds = allowedItemIds === null
          ? [item.id]
          : allowedItemIds.includes(item.id) ? [item.id] : [];
      }

      const itemIds = allowedItemIds ?? [];
      if (itemIds.length === 0) return [];

      const companies = await this.prisma.company.findMany({
        where: {
          professionalStatus: ProfessionalCompanyStatus.APPROVED,
          professionalType: { not: null },
          professionalServices: {
            some: { isActive: true, catalogItemId: { in: itemIds } },
          },
        },
        select: { id: true },
      });
      return companies.map((c) => c.id);
    } catch (err) {
      // Resolution infrastructure failure → honest empty (never unfiltered).
      this.logger.warn(
        `Canonical tradeserv filter resolution failed: ${(err as Error).message} — honest empty`,
      );
      return [];
    }
  }

  /**
   * C-01 P1 F-8 (Phase 8 parity): canonical facet options + counts for the
   * PostgreSQL fallback path. Counts are DISTINCT (company, value) pairs over
   * active services of APPROVED professionals matching the base (non-taxonomy)
   * filters — the same doc semantics the OpenSearch company-doc aggs produce
   * (one count per matching professional). Display fields are enriched from
   * the live catalog; the bucket KEY stays the canonical ID.
   */
  async computeCanonicalFacets(base?: {
    query?: string;
    city?: string;
    professionalType?: string;
    minRating?: number;
    /** C-01 P1 F-8: the validated canonical company set (when a canonical
     *  filter is active) — facets compute within the same filtered universe
     *  as the OpenSearch aggregations (Phase 8 parity). */
    canonicalCompanyIds?: string[];
  }): Promise<{
    catalogCategories: { key: string; doc_count: number; name?: string; slug?: string }[];
    catalogSubcategories: { key: string; doc_count: number; name?: string; slug?: string; parentId?: string }[];
    catalogItems: { key: string; doc_count: number; name?: string; slug?: string; parentId?: string }[];
  }> {
    const empty = { catalogCategories: [], catalogSubcategories: [], catalogItems: [] };
    try {
      const companyWhere: Prisma.CompanyWhereInput = {
        professionalType: { not: null },
        professionalStatus: ProfessionalCompanyStatus.APPROVED,
      };
      if (base?.query) {
        companyWhere.OR = [
          { name: { contains: base.query, mode: 'insensitive' } },
          { description: { contains: base.query, mode: 'insensitive' } },
        ];
      }
      if (base?.professionalType) companyWhere.professionalType = base.professionalType as any;
      if (base?.city) companyWhere.locations = { some: { city: { contains: base.city, mode: 'insensitive' } } };
      if (base?.minRating) companyWhere.reviewsAsProfessional = { some: { rating: { gte: base.minRating } } };
      // Phase 8 parity: same filtered universe as the OpenSearch aggs.
      if (base?.canonicalCompanyIds != null) {
        companyWhere.id = base.canonicalCompanyIds.length === 0
          ? { in: ['__canonical_no_match__'] }
          : { in: base.canonicalCompanyIds };
      }

      const svcWhere = (col: 'catalogCategoryId' | 'catalogSubcategoryId' | 'catalogItemId') =>
        ({
          isActive: true,
          [col]: { not: null },
          company: companyWhere,
        }) as Prisma.ProfessionalServiceWhereInput;

      const [catPairs, subPairs, itemPairs] = await Promise.all([
        this.prisma.professionalService.findMany({
          where: svcWhere('catalogCategoryId'),
          select: { companyId: true, catalogCategoryId: true },
          distinct: ['companyId', 'catalogCategoryId'],
        }),
        this.prisma.professionalService.findMany({
          where: svcWhere('catalogSubcategoryId'),
          select: { companyId: true, catalogSubcategoryId: true },
          distinct: ['companyId', 'catalogSubcategoryId'],
        }),
        this.prisma.professionalService.findMany({
          where: svcWhere('catalogItemId'),
          select: { companyId: true, catalogItemId: true },
          distinct: ['companyId', 'catalogItemId'],
        }),
      ]);

      const pairCounts = (
        pairs: { companyId: string }[],
        pick: (p: any) => string | null,
      ) => {
        const m = new Map<string, number>();
        for (const p of pairs) {
          const id = pick(p);
          if (id) m.set(id, (m.get(id) ?? 0) + 1);
        }
        return [...m.entries()]
          .map(([key, doc_count]) => ({ key, doc_count }))
          .sort((a, b) => b.doc_count - a.doc_count)
          .slice(0, 30);
      };

      const catCounts = pairCounts(catPairs, (p) => p.catalogCategoryId);
      const subCounts = pairCounts(subPairs, (p) => p.catalogSubcategoryId);
      const itemCounts = pairCounts(itemPairs, (p) => p.catalogItemId).slice(0, 40);

      const [cats, subs, items] = await Promise.all([
        catCounts.length > 0
          ? this.prisma.catalogCategory.findMany({
              where: { id: { in: catCounts.map((c) => c.key) } },
              select: { id: true, name: true, slug: true },
            })
          : [],
        subCounts.length > 0
          ? this.prisma.catalogSubcategory.findMany({
              where: { id: { in: subCounts.map((c) => c.key) } },
              select: { id: true, name: true, slug: true, categoryId: true },
            })
          : [],
        itemCounts.length > 0
          ? this.prisma.catalogItem.findMany({
              where: { id: { in: itemCounts.map((c) => c.key) } },
              select: { id: true, name: true, slug: true, subcategoryId: true },
            })
          : [],
      ]);
      const catById = new Map(cats.map((c) => [c.id, c]));
      const subById = new Map(subs.map((s) => [s.id, s]));
      const itemById = new Map(items.map((i) => [i.id, i]));

      return {
        catalogCategories: catCounts.map((c) => {
          const row = catById.get(c.key);
          return { key: c.key, doc_count: c.doc_count, name: row?.name, slug: row?.slug };
        }),
        catalogSubcategories: subCounts.map((c) => {
          const row = subById.get(c.key);
          return { key: c.key, doc_count: c.doc_count, name: row?.name, slug: row?.slug, parentId: row?.categoryId };
        }),
        catalogItems: itemCounts.map((c) => {
          const row = itemById.get(c.key);
          return { key: c.key, doc_count: c.doc_count, name: row?.name, slug: row?.slug, parentId: row?.subcategoryId };
        }),
      };
    } catch (err) {
      // Facet computation is best-effort in the fallback path — search itself
      // must never fail because facets could not be computed.
      this.logger.warn(`Canonical tradeserv facets (fallback) failed: ${(err as Error).message}`);
      return empty;
    }
  }

  async getFeaturedProfessionals(limit = 10) {
    // C-01 P1 P0-1: normalize locations to display strings at the API
    // boundary (sibling paths return city strings; raw `{city}` objects
    // crash ProfessionalCard with React #31).
    const rows = await this.prisma.company.findMany({
      where: { professionalType: { not: null }, professionalStatus: ProfessionalCompanyStatus.APPROVED },
      orderBy: { trustScore: 'desc' },
      take: limit,
      select: {
        id: true, name: true, slug: true, logo: true, professionalType: true,
        description: true, trustScore: true, verificationLevel: true,
        responseTimeMinutes: true, lastActiveAt: true,
        locations: { select: { city: true }, take: 1 },
        _count: { select: { professionalServices: true, reviewsAsProfessional: true } },
      },
    });
    return rows.map((r) => ({ ...r, locations: r.locations.map((l) => l.city) }));
  }

  async getProfessionalCategories(enriched?: boolean) {
    // O-7: public category counts/names derive ONLY from publicly visible
    // services — same APPROVED-company predicate as the established gates
    // (featured/search/facets/detail).
    const raw = await this.prisma.professionalService.groupBy({
      by: ['category'],
      where: {
        category: { not: null },
        isActive: true,
        company: { professionalType: { not: null }, professionalStatus: ProfessionalCompanyStatus.APPROVED },
      },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    if (!enriched) return raw;

    const enrichedCategories = await Promise.all(
      raw.map(async (entry) => {
        const catalogResult = entry.category
          ? await this.catalogAdapter.unifiedSearch(entry.category, {
              includeOld: false,
              includeCatalog: true,
              limit: 1,
            })
          : [];
        const catalogMatch = catalogResult.length > 0 ? catalogResult[0] : null;
        return {
          category: entry.category,
          _count: entry._count.category,
          catalogCategory: catalogMatch
            ? { id: catalogMatch.id, name: catalogMatch.name, type: catalogMatch.type }
            : null,
        };
      }),
    );

    return enrichedCategories;
  }

  async resolveServiceCategory(categoryName: string) {
    const catalogResult = await this.catalogAdapter.unifiedSearch(categoryName, {
      includeOld: false,
      includeCatalog: true,
      limit: 5,
    });

    return {
      query: categoryName,
      resolved: catalogResult.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        parentName: r.parentName,
      })),
      matchedCount: catalogResult.length,
    };
  }

  async getEnrichedService(id: string) {
    // O-7: public enriched-service lookup enforces the established public
    // visibility gate (APPROVED company) plus isActive — non-public rows 404
    // exactly like the professional detail lookup.
    const service = await this.prisma.professionalService.findFirst({
      where: {
        id,
        isActive: true,
        company: { professionalType: { not: null }, professionalStatus: ProfessionalCompanyStatus.APPROVED },
      },
    });
    if (!service) throw new NotFoundException('Service not found');

    const catalogResult = service.category
      ? await this.catalogAdapter.unifiedSearch(service.category, {
          includeOld: false,
          includeCatalog: true,
          limit: 1,
        })
      : [];

    return {
      ...service,
      catalogCategory: catalogResult.length > 0
        ? { id: catalogResult[0].id, name: catalogResult[0].name, type: catalogResult[0].type }
        : null,
    };
  }

  // F6/F7 — ONE legal company: reuse an existing owned company (by companyId, or by
  // matching PAN/GST) instead of always creating a new one. Never links by email.
  async registerProfessional(userId: string, dto: { fullName: string; professionalTitle: string; professionalType: string; companyName: string; mobile?: string; email?: string; companyId?: string; panNumber?: string; gstNumber?: string }) {
    let company: any = null;

    if (dto.companyId) {
      const owned = await this.prisma.companyOwner.findFirst({ where: { userId, companyId: dto.companyId } });
      if (owned) {
        company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
      }
    }

    if (!company && (dto.panNumber || dto.gstNumber)) {
      const panMatch = dto.panNumber
        ? await this.prisma.company.findFirst({
            where: { panNumber: dto.panNumber.toUpperCase(), owners: { some: { userId } } },
          })
        : null;
      const gstMatch = !panMatch && dto.gstNumber
        ? await this.prisma.company.findFirst({
            where: { gstNumber: dto.gstNumber.toUpperCase(), owners: { some: { userId } } },
          })
        : null;
      company = panMatch || gstMatch;
    }

    if (company) {
      // Reuse: activate the professional capability on the existing legal entity.
      // Seller businessType is deliberately preserved — professional identity lives
      // in professionalType/professionalStatus. PAN/GST are persisted so downstream
      // identity flows (vendor onboarding) can match the same legal entity.
      company = await this.prisma.company.update({
        where: { id: company.id },
        data: {
          professionalType: dto.professionalType as any,
          professionalStatus: ProfessionalCompanyStatus.PENDING_REVIEW,
          description: company.description || dto.professionalTitle,
          mobile: company.mobile || dto.mobile,
          email: company.email || dto.email,
          panNumber: company.panNumber || dto.panNumber?.toUpperCase() || null,
          gstNumber: company.gstNumber || dto.gstNumber?.toUpperCase() || null,
          updatedBy: userId,
        },
      });
    } else {
      company = await this.prisma.company.create({
        data: {
          name: dto.companyName,
          slug: dto.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6),
          professionalType: dto.professionalType as any,
          professionalStatus: ProfessionalCompanyStatus.PENDING_REVIEW,
          businessType: 'PROFESSIONAL' as any,
          description: dto.professionalTitle,
          mobile: dto.mobile,
          email: dto.email,
          panNumber: dto.panNumber?.toUpperCase() || null,
          gstNumber: dto.gstNumber?.toUpperCase() || null,
          createdBy: userId,
          updatedBy: userId,
          owners: { create: { userId, isPrimary: true } },
        },
      });
    }

    this.indexSyncService?.indexProfessional(company.id).catch((err) => this.logger.warn(`Index sync failed for professional ${company.id}: ${(err as Error).message}`));
    // Reward professional signup (non-blocking — wallet may not exist yet)
    this.gocashIntegration.awardProfessionalSignup(userId, company.id)
      .catch((err) => this.logger.warn(`Professional signup reward failed: ${(err as Error).message}`));
    return company;
  }

  async updateCompanyProfile(companyId: string, dto: Record<string, unknown>) {
    const result = await this.prisma.company.update({ where: { id: companyId }, data: dto });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return result;
  }

  async addService(companyId: string, dto: any) {
    // P0-2 (F-04): free-text category never persists alone — resolve to a
    // canonical CatalogItem (service context) and persist the canonical
    // linkage. The category string stays as a display echo only.
    const taxonomyData = await this.serviceTaxonomyData(dto, 'create');
    const service = await this.prisma.professionalService.create({
      data: { ...taxonomyData, name: taxonomyData.name ?? dto.name, companyId } as any,
    });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return service;
  }

  async updateService(id: string, companyId: string, dto: any) {
    const existing = await this.prisma.professionalService.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Service not found');
    const service = await this.prisma.professionalService.update({
      where: { id },
      data: (await this.serviceTaxonomyData(dto, 'update', existing)) as any,
    });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return service;
  }

  /**
   * P0-2: canonical taxonomy handling for ProfessionalService writes.
   * - Confirmed catalogItemId (Tick/Change) → validated server-side, persisted.
   * - Otherwise deterministic classify (name/category, service context) →
   *   persisted when trustworthy (exact-band only).
   * - Free-text category is normalized to the canonical item name when the
   *   chain resolves (display echo follows canonical truth).
   * - Never fabricated; unresolvable keeps the raw string (zero-loss).
   */
  private async serviceTaxonomyData(
    dto: Record<string, unknown>,
    mode: 'create' | 'update',
    existing?: { catalogItemId?: string | null },
  ): Promise<Record<string, unknown>> {
    // P1 O-5: canonical columns are server-derived — never accept them from
    // the client (the DTOs don't declare them; the global pipe rejects them
    // live). Strip defensively so a pipe bypass can never persist stale
    // lineage through the spread below.
    const data: Record<string, unknown> = { ...dto };
    delete data.catalogCategoryId;
    delete data.catalogSubcategoryId;

    // Explicit null on update = deliberate canonical clear.
    const explicitClear = mode === 'update' && dto.catalogItemId === null;
    const confirmedItem = (dto.catalogItemId as string | undefined) || null;

    let canonical: { categoryId: string; subcategoryId: string | null; catalogItemId: string | null } | null = null;
    if (confirmedItem) {
      canonical = await this.taxonomyPersistence.validateConfirmedTriple({
        catalogItemId: confirmedItem,
        expectedType: 'Service',
      });
      if (!canonical) {
        // Invalid confirmed item — refuse rather than fabricate.
        throw new BadRequestException('Invalid canonical service category — pick from the structured catalog');
      }
    }

    if (!canonical && !explicitClear) {
      // P1 O-5: preserve user-confirmed lineage — a rename-only update must
      // not silently replace it with classifier output. Classification runs
      // only when there is nothing confirmed to preserve.
      const preserveConfirmed =
        mode === 'update' && !!existing?.catalogItemId && dto.catalogItemId === undefined;
      if (!preserveConfirmed) {
        const classifyName =
          (dto.name as string) || (dto.category as string) || '';
        if (classifyName) {
          canonical = await this.taxonomyPersistence.resolvePersistableTaxonomy({
            name: classifyName,
            description: (dto.description as string) || null,
            context: 'service',
            expectedType: 'Service',
          });
        }
      }
    }

    if (canonical) {
      // Full canonical triple persists (F-04): category, subcategory, item.
      Object.assign(data, this.taxonomyPersistence.applyCanonicalTriple(canonical));
      if (canonical.catalogItemId) {
        // Display echo follows canonical truth when the chain resolves and the
        // caller didn't provide its own display string.
        if (dto.category === undefined || dto.category === null || dto.category === '') {
          const triple = await this.taxonomyPersistence.tripleForCatalogItem(canonical.catalogItemId, 'Service');
          if (triple) data.category = triple.itemName;
        }
      }
    } else if (mode === 'create' || explicitClear) {
      // P1 O-5: unresolvable create and deliberate clear both land on an
      // all-null triple — never a partially-populated residue.
      Object.assign(data, this.taxonomyPersistence.applyCanonicalTriple(null));
    }
    // update with no resolution and no explicit clear leaves the persisted
    // lineage untouched (never silently dropped).
    return data;
  }

  async deleteService(id: string, companyId: string) {
    const existing = await this.prisma.professionalService.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Service not found');
    const result = await this.prisma.professionalService.delete({ where: { id } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return result;
  }

  async addPortfolioItem(companyId: string, dto: any) {
    const item = await this.prisma.professionalPortfolio.create({ data: { ...dto, companyId } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return item;
  }

  async updatePortfolioItem(id: string, companyId: string, dto: any) {
    const existing = await this.prisma.professionalPortfolio.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Portfolio item not found');
    const item = await this.prisma.professionalPortfolio.update({ where: { id }, data: dto });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return item;
  }

  async deletePortfolioItem(id: string, companyId: string) {
    const existing = await this.prisma.professionalPortfolio.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Portfolio item not found');
    const result = await this.prisma.professionalPortfolio.delete({ where: { id } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return result;
  }

  async addCertification(companyId: string, dto: any) {
    const cert = await this.prisma.professionalCertification.create({ data: { ...dto, companyId, issueDate: new Date(dto.issueDate), expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return cert;
  }

  async updateCertification(id: string, companyId: string, dto: any) {
    const existing = await this.prisma.professionalCertification.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Certification not found');
    const data = { ...dto };
    if (dto.issueDate) data.issueDate = new Date(dto.issueDate);
    if (dto.expiryDate) data.expiryDate = new Date(dto.expiryDate);
    const cert = await this.prisma.professionalCertification.update({ where: { id }, data });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return cert;
  }

  async deleteCertification(id: string, companyId: string) {
    const existing = await this.prisma.professionalCertification.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Certification not found');
    const result = await this.prisma.professionalCertification.delete({ where: { id } });
    this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    return result;
  }

  async setAvailability(companyId: string, dto: { dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }) {
    return this.prisma.professionalAvailability.upsert({
      where: { companyId_dayOfWeek: { companyId, dayOfWeek: dto.dayOfWeek } },
      create: { ...dto, companyId },
      update: { startTime: dto.startTime, endTime: dto.endTime, isAvailable: dto.isAvailable ?? true },
    });
  }

  async addLanguage(companyId: string, dto: { language: string; proficiency?: string }) {
    return this.prisma.professionalLanguage.upsert({
      where: { companyId_language: { companyId, language: dto.language } },
      create: { ...dto, companyId },
      update: { proficiency: dto.proficiency },
    });
  }

  async removeLanguage(companyId: string, language: string) {
    const existing = await this.prisma.professionalLanguage.findFirst({ where: { companyId, language } });
    if (!existing) throw new NotFoundException('Language not found');
    return this.prisma.professionalLanguage.delete({ where: { id: existing.id } });
  }

  async addServiceArea(companyId: string, dto: any) {
    return this.prisma.professionalServiceArea.create({ data: { ...dto, companyId } });
  }

  async removeServiceArea(id: string, companyId: string) {
    const existing = await this.prisma.professionalServiceArea.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Service area not found');
    return this.prisma.professionalServiceArea.delete({ where: { id } });
  }

  async checkAvailability(
    companyId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeBookingId?: string,
  ) {
    const scheduledEnd = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    const where: Prisma.BookingWhereInput = {
      companyId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
      scheduledAt: { lt: scheduledEnd },
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const existingBookings = await this.prisma.booking.findMany({
      where,
      select: { id: true, scheduledAt: true, durationMinutes: true, status: true },
    });

    const conflicts = existingBookings.filter((existing) => {
      const existingEnd = new Date(
        existing.scheduledAt.getTime() + (existing.durationMinutes || 60) * 60000,
      );
      return existingEnd > scheduledAt;
    });

    if (conflicts.length > 0) {
      const conflictDetails = conflicts.map(
        (c) =>
          `${c.id}: ${c.scheduledAt.toISOString()} (${c.durationMinutes || 60}min, ${c.status})`,
      );
      this.logger.warn(
        `Availability conflict for company ${companyId}: ${conflictDetails.join(', ')}`,
      );
      throw new BadRequestException({
        message: 'Booking conflicts with existing appointments',
        conflicts: conflicts.map((c) => ({
          id: c.id,
          scheduledAt: c.scheduledAt,
          durationMinutes: c.durationMinutes || 60,
          status: c.status,
        })),
      });
    }

    return { available: true };
  }

  async createBooking(
    clientId: string,
    dto: {
      companyId: string;
      serviceId?: string;
      scheduledAt: string;
      durationMinutes?: number;
      notes?: string;
      meetingLink?: string;
      location?: string;
    },
  ) {
    const scheduledAt = new Date(dto.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt date');
    }
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const durationMinutes = dto.durationMinutes || 60;

    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
      select: { id: true, professionalType: true, professionalStatus: true },
    });
    if (!company?.professionalType) {
      throw new NotFoundException('Professional not found');
    }
    if (company.professionalStatus !== ProfessionalCompanyStatus.APPROVED) {
      throw new BadRequestException('Professional is not yet approved');
    }

    await this.checkAvailability(dto.companyId, scheduledAt, durationMinutes);

    let amount: number | undefined;
    if (dto.serviceId) {
      const service = await this.prisma.professionalService.findUnique({
        where: { id: dto.serviceId },
        select: { priceMin: true, priceMax: true },
      });
      if (service && service.priceMin) {
        const minPrice = Number(service.priceMin);
        const maxPrice = service.priceMax ? Number(service.priceMax) : minPrice;
        amount = maxPrice > minPrice ? maxPrice : minPrice;
      }
    }

    const booking = await this.prisma.booking.create({
      data: {
        companyId: dto.companyId,
        clientId,
        serviceId: dto.serviceId,
        scheduledAt,
        durationMinutes,
        amount: amount ?? undefined,
        notes: dto.notes,
        meetingLink: dto.meetingLink,
        location: dto.location,
      },
    });

    await this.notificationService.createWithTemplate(
      dto.companyId,
      undefined,
      NotificationType.BOOKING_CREATED,
      { date: dto.scheduledAt, clientName: clientId },
      { sourceModule: 'TRADESERV', link: '/seller/tradeserv/bookings' },
    ).catch((err) => this.logger.warn(`BOOKING_CREATED notification failed: ${(err as Error).message}`));

    return booking;
  }

  async updateBookingStatus(bookingId: string, userId: string, dto: { status: string; cancelReason?: string; meetingLink?: string }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // P0-SEC-02: authorize the actor before ANY write or financial side effect.
    // booking.clientId and booking.companyId are both Company ids; ownership is
    // resolved user -> owned companies via CompanyOwner.
    const [profOwnership, clientOwnership, requester] = await Promise.all([
      this.prisma.companyOwner.findFirst({
        where: {
          userId,
          companyId: booking.companyId,
          company: { deletedAt: null, status: 'ACTIVE' },
        },
        select: { id: true },
      }),
      this.prisma.companyOwner.findFirst({
        where: { userId, companyId: booking.clientId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    ]);
    const isAdmin = requester?.role === 'ADMIN' || requester?.role === 'SUPER_ADMIN';
    if (!profOwnership && !clientOwnership && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update this booking');
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    };

    const allowed = validTransitions[booking.status];
    if (!allowed?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition booking from ${booking.status} to ${dto.status}`,
      );
    }

    // Actor-scoped permissions on top of the state machine:
    // professional owner / admin -> all legal transitions;
    // client -> CANCELLED only.
    if (!isAdmin && !profOwnership && dto.status !== 'CANCELLED') {
      throw new ForbiddenException('Clients can only cancel bookings');
    }

    if (dto.status === 'CONFIRMED' && booking.amount && booking.amount.toNumber() > 0) {
      if (booking.paymentStatus !== BookingPaymentStatus.PAID) {
        throw new BadRequestException('Booking cannot be confirmed until payment is completed');
      }
    }

    const data: any = { status: dto.status };
    if (dto.status === 'CANCELLED') { data.cancelledAt = new Date(); data.cancelReason = dto.cancelReason; }
    if (dto.status === 'CONFIRMED') { data.meetingLink = dto.meetingLink; }
    if (dto.status === 'COMPLETED') { data.completedAt = new Date(); }

    const updated = await this.prisma.booking.update({ where: { id: bookingId }, data });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `BOOKING_${dto.status}`,
        resource: 'booking',
        metadata: {
          bookingId,
          previousStatus: booking.status,
          newStatus: dto.status,
          cancelReason: dto.cancelReason,
        },
      },
    });

    const dateStr = booking.scheduledAt.toISOString().split('T')[0];
    if (dto.status === 'CONFIRMED') {
      await this.notificationService.createWithTemplate(
        booking.clientId,
        undefined,
        NotificationType.BOOKING_CONFIRMED,
        { date: dateStr, professionalName: booking.companyId },
        { sourceModule: 'TRADESERV', link: '/buyer/tradeserv/bookings' },
      ).catch((err) => this.logger.warn(`BOOKING_CONFIRMED notification failed: ${(err as Error).message}`));
    } else if (dto.status === 'COMPLETED') {
      await this.notificationService.createWithTemplate(
        booking.clientId,
        undefined,
        NotificationType.BOOKING_COMPLETED,
        { date: dateStr, professionalName: booking.companyId },
        { sourceModule: 'TRADESERV', link: '/buyer/tradeserv/bookings' },
      ).catch((err) => this.logger.warn(`BOOKING_COMPLETED notification failed: ${(err as Error).message}`));
      // Reward client for booking completion
      this.awardBookingCompletionReward(bookingId, booking.clientId);
      // Financial settlement — failure-isolated, never rolls back booking completion
      this.financialOrchestrator.processBookingCompleted(bookingId, userId)
        .catch((err) => this.logger.warn(`Settlement processing failed for booking ${bookingId}: ${(err as Error).message}`));
    } else if (dto.status === 'CANCELLED') {
      await this.notificationService.createWithTemplate(
        booking.clientId,
        undefined,
        NotificationType.BOOKING_CANCELLED,
        { date: dateStr, reason: dto.cancelReason || 'No reason provided' },
        { sourceModule: 'TRADESERV', link: '/buyer/tradeserv/bookings' },
      ).catch((err) => this.logger.warn(`BOOKING_CANCELLED notification failed: ${(err as Error).message}`));
    }

    return updated;
  }

  async getBookingById(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        company: { select: { id: true, name: true, slug: true, logo: true, email: true, mobile: true } },
        client: { select: { id: true, name: true, slug: true, logo: true, email: true, mobile: true } },
        reviews: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const userCompanyIds = await this.prisma.companyOwner.findMany({
      where: { userId },
      select: { companyId: true },
    });
    const ownedCompanyIds = new Set(userCompanyIds.map((c) => c.companyId));
    if (!ownedCompanyIds.has(booking.companyId) && !ownedCompanyIds.has(booking.clientId)) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getBookings(companyId: string, role: 'professional' | 'client', page = 1, limit = 20, status?: string) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.BookingWhereInput = role === 'professional' ? { companyId } : { clientId: companyId };
    if (status) where.status = status as BookingStatus;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: safeLimit,
        include: { service: true, company: { select: { name: true, slug: true, logo: true } } },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit), hasNext: page * safeLimit < total, hasPrevious: page > 1 },
    };
  }

  async createProposal(companyId: string, clientId: string, dto: any) {
    const proposal = await this.prisma.proposal.create({ data: { ...dto, companyId, clientId } });

    await this.notificationService.createWithTemplate(
      clientId,
      undefined,
      NotificationType.PROPOSAL_SUBMITTED,
      { professionalName: companyId },
      { sourceModule: 'TRADESERV', link: '/buyer/tradeserv/proposals' },
    ).catch((err) => this.logger.warn(`PROPOSAL_SUBMITTED notification failed: ${(err as Error).message}`));

    return proposal;
  }

  async updateProposalStatus(proposalId: string, companyId: string, dto: { status: string; rejectionReason?: string }) {
    const proposal = await this.prisma.proposal.findFirst({ where: { id: proposalId, companyId } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    const data: any = { status: dto.status };
    if (dto.status === 'SENT') data.sentAt = new Date();
    if (dto.status === 'ACCEPTED') data.acceptedAt = new Date();
    if (dto.status === 'REJECTED') { data.rejectedAt = new Date(); data.rejectionReason = dto.rejectionReason; }

    const updated = await this.prisma.proposal.update({ where: { id: proposalId }, data });

    if (dto.status === 'ACCEPTED') {
      await this.notificationService.createWithTemplate(
        proposal.companyId,
        undefined,
        NotificationType.PROPOSAL_ACCEPTED,
        { clientName: proposal.clientId },
        { sourceModule: 'TRADESERV', link: '/seller/tradeserv/proposals' },
      ).catch((err) => this.logger.warn(`PROPOSAL_ACCEPTED notification failed: ${(err as Error).message}`));
    } else if (dto.status === 'REJECTED') {
      await this.notificationService.createWithTemplate(
        proposal.companyId,
        undefined,
        NotificationType.PROPOSAL_REJECTED,
        { clientName: proposal.clientId },
        { sourceModule: 'TRADESERV', link: '/seller/tradeserv/proposals' },
      ).catch((err) => this.logger.warn(`PROPOSAL_REJECTED notification failed: ${(err as Error).message}`));
    }

    return updated;
  }

  async getProposals(companyId: string, role: 'professional' | 'client', page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * safeLimit;
    const where = role === 'professional' ? { companyId } : { clientId: companyId };
    const [data, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.proposal.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit), hasNext: page * safeLimit < total, hasPrevious: page > 1 },
    };
  }

  async createReview(clientId: string, userId: string, dto: { bookingId: string; rating: number; title?: string; description?: string; rehired?: boolean }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== clientId) throw new BadRequestException('You can only review your own bookings');
    if (booking.status !== 'COMPLETED') throw new BadRequestException('Can only review completed bookings');

    const review = await this.prisma.professionalReview.create({ data: { ...dto, companyId: booking.companyId, clientId } });

    // Notify professional about the review
    await this.notificationService.createWithTemplate(
      booking.companyId,
      undefined,
      NotificationType.REVIEW_SUBMITTED,
      { reviewerName: clientId, rating: dto.rating },
      { sourceModule: 'TRADESERV', link: '/seller/tradeserv/bookings' },
    ).catch((err) => this.logger.warn(`REVIEW_SUBMITTED notification failed: ${(err as Error).message}`));

    // Reward the reviewer
    this.gocashIntegration.awardReviewSubmitted(review.id, userId, clientId)
      .catch((err) => this.logger.warn(`Review reward failed: ${(err as Error).message}`));

    return review;
  }

  async createBookingPaymentOrder(bookingId: string, companyId: string, amount: number, currency = 'INR') {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== companyId) throw new BadRequestException('Only the booking client can pay');

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay for a cancelled booking');
    }
    if (booking.paymentStatus === BookingPaymentStatus.PAID) {
      throw new BadRequestException('Booking is already paid');
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        companyId,
        status: 'PENDING',
        notes: { path: ['bookingId'], equals: bookingId },
      },
    });
    if (existingPayment) {
      this.logger.log(`Returning existing PENDING payment ${existingPayment.id} for booking ${bookingId}`);
      return {
        id: existingPayment.id,
        gatewayOrderId: existingPayment.gatewayOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency || 'INR',
        keyId: this.razorpayService.getKeyId(),
      };
    }

    const receipt = `bk_${companyId.slice(0, 8)}_${Date.now()}`;
    const razorpayOrder = await this.razorpayService.createOrder(amount, currency, receipt, {
      companyId,
      bookingId,
      type: 'BOOKING_PAYMENT',
    });

    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        type: 'BOOKING_PAYMENT',
        gateway: 'RAZORPAY',
        status: 'PENDING',
        gatewayOrderId: razorpayOrder.id,
        amount,
        currency,
        description: `Booking payment: ${bookingId}`,
        notes: { bookingId },
      },
    });

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentId: payment.id,
        paymentStatus: BookingPaymentStatus.PENDING,
        amount: amount / 100,
      },
    });

    return {
      id: payment.id,
      bookingId,
      gatewayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: this.razorpayService.getKeyId(),
    };
  }

  async verifyBookingPayment(
    bookingId: string,
    companyId: string,
    dto: {
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    },
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== companyId) throw new BadRequestException('Only the booking client can verify payment');

    const payment = await this.prisma.payment.findFirst({
      where: {
        companyId,
        gatewayOrderId: dto.razorpayOrderId,
        status: 'PENDING',
      },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    const isValid = this.razorpayService.verifyPayment({
      gatewayOrderId: dto.razorpayOrderId,
      gatewayPaymentId: dto.razorpayPaymentId,
      gatewaySignature: dto.razorpaySignature,
    });
    if (!isValid) {
      await this.notificationService.createWithTemplate(
        booking.companyId,
        undefined,
        NotificationType.BOOKING_PAYMENT_FAILED,
        { date: booking.scheduledAt.toISOString().split('T')[0], reason: 'Signature mismatch — payment could not be verified' },
        { sourceModule: 'TRADESERV', link: '/seller/tradeserv/bookings' },
      ).catch((err) => this.logger.warn(`BOOKING_PAYMENT_FAILED notification failed: ${(err as Error).message}`));
      throw new BadRequestException('Payment verification failed — signature mismatch');
    }

    const [updatedPayment] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CAPTURED',
          gatewayPaymentId: dto.razorpayPaymentId,
          gatewaySignature: dto.razorpaySignature,
          paidAt: new Date(),
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: BookingPaymentStatus.PAID,
          status: BookingStatus.CONFIRMED,
        },
      }),
    ]);

    try {
      const amountInRupees = (updatedPayment.amount / 100).toFixed(2);
      await this.notificationService.createWithTemplate(
        booking.companyId,
        undefined,
        NotificationType.BOOKING_CONFIRMED,
        { date: booking.scheduledAt.toISOString().split('T')[0], amount: amountInRupees },
        { sourceModule: 'TRADESERV', link: '/seller/tradeserv/bookings' },
      );
    } catch (err) {
      this.logger.error(`Failed to send BOOKING_CONFIRMED notification: ${(err as Error).message}`);
    }

    this.financialOrchestrator.processPaymentVerified(bookingId, booking.clientId)
      .catch((err) => this.logger.warn(`Escrow hold failed for booking ${bookingId}: ${(err as Error).message}`));

    return {
      success: true,
      bookingId,
      paymentId: payment.id,
      amount: updatedPayment.amount,
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
    };
  }

  async getAdminProfessionals(params: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CompanyWhereInput = { professionalType: { not: null } };
    if (params.status) where.professionalStatus = params.status as any;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.company.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, slug: true, logo: true, professionalType: true, professionalStatus: true, trustScore: true, verificationLevel: true, email: true, mobile: true, createdAt: true, _count: { select: { professionalServices: true, reviewsAsProfessional: true } } } }),
      this.prisma.company.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 } };
  }

  async getAdminBookings(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.BookingWhereInput = {};
    if (params.status) where.status = params.status as BookingStatus;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          service: { select: { name: true } },
          company: { select: { id: true, name: true, slug: true, logo: true } },
          client: { select: { id: true, name: true, slug: true, logo: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrevious: page > 1 },
    };
  }

  async getAdminBookingStats() {
    const [total, pending, confirmed, inProgress, completed, cancelled] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.IN_PROGRESS } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
    ]);
    return { total, pending, confirmed, inProgress, completed, cancelled };
  }

  async approveProfessional(companyId: string, status: ProfessionalCompanyStatus, reason?: string) {
    const data: any = { professionalStatus: status };
    if (status === 'APPROVED') data.professionalApprovedAt = new Date();
    if (status === 'REJECTED') { data.professionalRejectedAt = new Date(); data.professionalRejectedReason = reason; }
    const result = await this.prisma.company.update({ where: { id: companyId }, data });
    if (status === 'APPROVED') {
      this.indexSyncService?.indexProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    } else if (status === 'REJECTED') {
      this.indexSyncService?.removeProfessional(companyId).catch((err) => this.logger.warn(`Index sync failed: ${(err as Error).message}`));
    }
    return result;
  }

  async getDashboardStats(companyId: string) {
    const [services, portfolio, bookings, reviews, proposals] = await Promise.all([
      this.prisma.professionalService.count({ where: { companyId } }),
      this.prisma.professionalPortfolio.count({ where: { companyId } }),
      this.prisma.booking.count({ where: { companyId } }),
      this.prisma.professionalReview.count({ where: { companyId } }),
      this.prisma.proposal.count({ where: { companyId } }),
    ]);
    return { services, portfolio, bookings, reviews, proposals };
  }

  async getAnalytics(companyId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [totalReviews, recentBookings, proposals, profile] = await Promise.all([
      this.prisma.professionalReview.count({ where: { companyId } }),
      this.prisma.booking.findMany({ where: { companyId, createdAt: { gte: sixMonthsAgo } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.proposal.count({ where: { companyId } }),
      this.prisma.company.findUnique({ where: { id: companyId }, select: { trustScore: true, professionalStatus: true } }),
    ]);

    const monthlyTrends = this.buildMonthlyTrends(sixMonthsAgo, now, recentBookings);

    return {
      overview: {
        reviews: totalReviews,
        inquiries: proposals,
        bookings: recentBookings.length,
        trustScore: profile?.trustScore || 0,
      },
      monthlyTrends,
    };
  }

  private async awardBookingCompletionReward(bookingId: string, clientCompanyId: string) {
    try {
      const clientOwner = await this.prisma.companyOwner.findFirst({
        where: { companyId: clientCompanyId, isPrimary: true },
      });
      if (clientOwner) {
        await this.gocashIntegration.awardBookingCompleted(bookingId, clientOwner.userId, clientCompanyId);
      } else {
        this.logger.warn(`No primary owner found for client company ${clientCompanyId}, skipping booking completion reward`);
      }
    } catch (err) {
      this.logger.warn(`Booking completion reward failed: ${(err as Error).message}`);
    }
  }

  private buildMonthlyTrends(from: Date, to: Date, bookings: { createdAt: Date }[]) {
    const months: { month: string; bookings: number }[] = [];
    const current = new Date(from);
    while (current <= to) {
      const monthKey = current.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const count = bookings.filter(
        b => new Date(b.createdAt).getMonth() === current.getMonth() && new Date(b.createdAt).getFullYear() === current.getFullYear()
      ).length;
      months.push({ month: monthKey, bookings: count });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }

  async getSettings(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        email: true, mobile: true, website: true, socialLinks: true,
        businessHours: true, description: true, name: true,
      },
    });
    return {
      notifications: { emailAlerts: true, smsAlerts: false, digestEnabled: true },
      privacy: { showEmail: true, showPhone: false, allowMessages: true },
      visibility: { searchVisible: true, categoryVisible: true, featured: false },
      communication: { weeklyDigest: true, renewalReminders: true, platformUpdates: true },
      profile: company,
    };
  }

  async updateSettings(companyId: string, dto: Record<string, unknown>) {
    const allowedFields = ['notifications', 'privacy', 'visibility', 'communication'];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (dto[key] !== undefined) updateData[key] = dto[key];
    }
    return updateData;
  }
}
