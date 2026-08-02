import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma, PlanType, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ProfileCompletionService } from '../profile-completion/profile-completion.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { TradTrustService } from '../tradtrust/tradtrust.service';
import { VendorCodesService } from '../vendor-codes/vendor-codes.service';
import { Role } from '../../common/enums/role.enum';
import { v4 as uuid } from 'uuid';

const MAX_ELITE_SELLERS_PER_RM = 100;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || `company-${uuid().slice(0, 8)}`;
}

const COMPANY_INDEX = 'companies';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly profileCompletionService: ProfileCompletionService,
    private readonly onboardingService: OnboardingService,
    private readonly tradTrustService: TradTrustService,
    private readonly vendorCodesService: VendorCodesService,
  ) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = slugify(name);
    let attempt = 0;
    while (await this.prisma.company.findUnique({ where: { slug }, select: { id: true } })) {
      attempt++;
      slug = `${slugify(name)}-${attempt}`;
    }
    return slug;
  }

  async create(dto: CreateCompanyDto, userId: string) {
    const slug = dto.slug || await this.generateUniqueSlug(dto.name);
    const existing = await this.prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (existing) throw new ConflictException('Company slug already exists');

    const company = await this.prisma.$transaction(async (tx) => {
      const c = await tx.company.create({
        data: {
          name: dto.name,
          slug,
          logo: dto.logo,
          banner: dto.banner,
          description: dto.description,
          businessType: dto.businessType,
          establishedYear: dto.establishedYear,
          employeeCount: dto.employeeCount,
          gstNumber: dto.gstNumber,
          panNumber: dto.panNumber,
          website: dto.website,
          email: dto.email,
          mobile: dto.mobile,
          geographicReach: dto.geographicReach,
          status: dto.status,
          organizationId: dto.organizationId,
          createdBy: userId,
          updatedBy: userId,
          owners: { create: { userId, isPrimary: true } },
          categories: dto.categoryIds?.length
            ? { create: dto.categoryIds.map((catId) => ({ categoryId: catId })) }
            : undefined,
        },
        include: {
          owners: { include: { user: { select: { id: true, email: true, name: true } } } },
          locations: true,
          categories: { include: { category: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_COMPANY',
          resource: `company:${c.id}`,
          metadata: { name: dto.name, slug },
        },
      });

      return c;
    });

    try {
      await this.searchService.indexDocument(COMPANY_INDEX, company.id, {
        name: company.name,
        slug: company.slug,
        description: company.description,
        businessType: company.businessType,
        trustScore: company.trustScore,
        verificationLevel: company.verificationLevel,
        status: company.status,
      });
    } catch (err) {
      this.logger.warn(`Failed to index company ${company.id} in OpenSearch: ${err}`);
    }

    await this.onboardingService.advanceStep(company.id, 'ACCOUNT_CREATED', userId);
    await this.onboardingService.advanceStep(company.id, 'BUSINESS_ADDED', userId);

    this.logger.log(`Company ${company.id} created by ${userId}`);
    return company;
  }

  async findAll(query: {
    cursor?: string;
    limit?: number;
    search?: string;
    businessType?: string;
    status?: string;
    verificationLevel?: string;
    organizationId?: string;
    ownerId?: string;
  }) {
    try {
      const { cursor, search, businessType, status, verificationLevel, organizationId, ownerId } = query || {};
      const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 100);
      const where: Prisma.CompanyWhereInput = { deletedAt: null };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (businessType) where.businessType = businessType as any;
      if (status && ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status.toUpperCase())) where.status = status.toUpperCase() as any;
      if (verificationLevel && verificationLevel.startsWith('LEVEL_')) where.verificationLevel = verificationLevel as Prisma.EnumVerificationLevelFilter['equals'];
      if (organizationId) where.organizationId = organizationId;
      if (ownerId) {
        where.owners = { some: { userId: ownerId } };
      }

      const findArgs: Prisma.CompanyFindManyArgs = {
        where,
        take: limit + 1,
        orderBy: { createdAt: 'desc' },
        include: {
          owners: { include: { user: { select: { id: true, email: true, name: true } } } },
          locations: { where: { deletedAt: null }, take: 1 },
          categories: { include: { category: true } },
          _count: { select: { locations: true, verifications: true } },
        },
      };
      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      }
      const data = await this.prisma.company.findMany(findArgs);
      const hasMore = data.length > limit;
      if (hasMore) data.pop();
      const total = await this.prisma.company.count({ where });
      return {
        data,
        meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined },
      };
    } catch (err) {
      this.logger.error(`Error in CompaniesService.findAll: ${err instanceof Error ? err.message : String(err)}`);
      return { data: [], meta: { total: 0, limit: 20, cursor: undefined } };
    }
  }

  // ── Public Directory (page-based, filterable) ──
  async findDirectory(params: {
    q?:          string
    category?:   string
    city?:       string
    state?:      string
    verified?:   boolean
    elite?:      boolean
    sellerType?: string
    minTrust?:   number
    sortBy?:     string
    page:        number
    limit:       number
  }) {
    const { q, category, city, state, verified, elite, sellerType, minTrust, sortBy, page, limit } = params
    const skip = (page - 1) * limit

    const where: Prisma.CompanyWhereInput = { deletedAt: null, status: { not: 'INACTIVE' } }

    if (q?.trim()) {
      where.OR = [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (sellerType) where.businessType = sellerType as any
    if (minTrust)   where.trustScore = { gte: minTrust }
    if (city)       where.locations = { some: { city: { contains: city, mode: 'insensitive' }, deletedAt: null } }
    if (verified)   where.verificationLevel = { not: 'LEVEL_0' as any }
    if (category)   where.categories = { some: { category: { slug: category } } }
    if (elite)      where.subscriptionPlan = 'TRADE_ELITE' as any

    const orderBy: Prisma.CompanyOrderByWithRelationInput =
      sortBy === 'name' ? { name: 'asc' } :
      sortBy === 'newest' ? { createdAt: 'desc' } :
      { trustScore: 'desc' };

    const companies = await this.prisma.company.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        locations: { where: { deletedAt: null }, take: 1 },
        _count: { select: { products: true } },
      },
    })

    const companyIds = companies.map(c => c.id)

    const [total, statsData, reviewAgg, orderAgg] = await Promise.all([
      this.prisma.company.count({ where }),
      this.getDirectoryStats(),
      companyIds.length > 0
        ? this.prisma.productReview.groupBy({
            by: ['companyId'],
            where: { companyId: { in: companyIds }, status: 'APPROVED' },
            _avg: { rating: true },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      companyIds.length > 0
        ? this.prisma.order.groupBy({
            by: ['sellerCompanyId'],
            where: { sellerCompanyId: { in: companyIds }, deletedAt: null },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ])

    const ratingMap = new Map(reviewAgg.map(r => [r.companyId, { avg: r._avg?.rating ?? 0, count: r._count._all }]))
    const orderMap = new Map(orderAgg.map(o => [o.sellerCompanyId, o._count._all]))

    const mapped = companies.map(c => {
      const loc = c.locations?.[0] || {}
      const rating = ratingMap.get(c.id)
      const certs = Array.isArray(c.certifications) ? (c.certifications as unknown[]) : []
      const isoCertified = certs.some(x => typeof x === 'string' && /iso/i.test(x))
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        banner: c.banner,
        bannerUrl: c.banner,
        description: c.description,
        tagline: null,
        city: loc.city || '',
        state: loc.state || '',
        categories: [],
        sellerType: c.businessType,
        isVerified: c.verificationLevel !== 'LEVEL_0',
        isTradgoElite: c.subscriptionPlan === 'TRADE_ELITE',
        trustScore: c.trustScore,
        rating: rating ? parseFloat(rating.avg.toFixed(1)) : 0,
        reviewCount: rating?.count ?? 0,
        orderCount: orderMap.get(c.id) ?? 0,
        responseRate: c.responseRate,
        responseTime: c.responseRate ? `< ${c.responseRate}h` : undefined,
        gstNumber: c.gstNumber,
        establishedYear: c.establishedYear,
        isoCertified,
        productCount: c._count?.products || 0,
        yearsActive: c.establishedYear
          ? new Date().getFullYear() - c.establishedYear
          : undefined,
      }
    })

    return {
      companies: mapped,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
      stats: statsData,
    }
  }

  private async getDirectoryStats() {
    const [totalCompanies, verifiedCompanies, eliteCompanies, citiesResult, totalProducts, ratingResult] = await Promise.all([
      this.prisma.company.count({ where: { deletedAt: null, status: { not: 'INACTIVE' } } }),
      this.prisma.company.count({ where: { deletedAt: null, verificationLevel: { not: 'LEVEL_0' as any } } }),
      this.prisma.company.count({ where: { deletedAt: null, subscriptionPlan: 'TRADE_ELITE' as any } }),
      this.prisma.companyLocation.findMany({ where: { deletedAt: null }, select: { city: true }, distinct: ['city'] }),
      this.prisma.product.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.productReview.aggregate({ _avg: { rating: true }, where: { status: 'APPROVED' } }),
    ])
    return {
      totalCompanies,
      verifiedCompanies,
      eliteCompanies,
      totalCities: citiesResult.length,
      totalProducts,
      averageRating: ratingResult._avg.rating ? Math.round(ratingResult._avg.rating * 10) / 10 : 0,
    }
  }

  // ── Company Products ──
  async getProducts(slug: string, page: number, limit: number) {
    const company = await this.prisma.company.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    })
    if (!company) throw new NotFoundException('Company not found')

    const skip = (page - 1) * limit
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { companyId: company.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          media: { where: { type: 'IMAGE' }, take: 3, orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.product.count({ where: { companyId: company.id, status: 'ACTIVE' } }),
    ])

    return {
      products,
      pagination: { total, page, limit, pages: Math.ceil(total / limit), hasNext: page * limit < total },
    }
  }

  // ── Company Reviews ──
  async getReviews(slug: string, page: number, limit: number) {
    const company = await this.prisma.company.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    })
    if (!company) throw new NotFoundException('Company not found')

    const skip = (page - 1) * limit
    const [reviews, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { companyId: company.id, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.productReview.count({ where: { companyId: company.id, status: 'APPROVED' } }),
    ])

    const stars: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0 }
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) stars[r.rating]++ })
    const avgRating = total > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total
      : 0

    return {
      reviews: reviews.map(r => ({
        ...r,
        comment: r.review,
      })),
      summary: {
        average: parseFloat(avgRating.toFixed(1)),
        total,
        stars,
      },
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    }
  }

  // ── Similar Companies ──
  async getSimilar(slug: string, take: number) {
    const company = await this.prisma.company.findFirst({
      where: { slug, deletedAt: null },
      select: { businessType: true, id: true },
    })
    if (!company) return []

    const similar = await this.prisma.company.findMany({
      where: {
        NOT: { slug },
        deletedAt: null,
        status: { not: 'INACTIVE' },
        businessType: company.businessType,
      },
      orderBy: { trustScore: 'desc' },
      take,
      include: {
        locations: { where: { deletedAt: null }, take: 1 },
        _count: { select: { products: true } },
      },
    })

    return similar.map(c => {
      const loc = c.locations?.[0] || {}
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        city: loc.city || '',
        state: loc.state || '',
        trustScore: c.trustScore,
        isVerified: c.verificationLevel !== 'LEVEL_0',
        categories: [],
        productCount: c._count?.products || 0,
      }
    })
  }

  async findById(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        owners: { include: { user: { select: { id: true, email: true, name: true } } } },
        locations: { where: { deletedAt: null } },
        categories: { include: { category: true } },
        _count: { select: { locations: true, verifications: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findByOwner(userId: string) {
    const owner = await this.prisma.companyOwner.findFirst({
      where: { userId },
      include: {
        company: {
          include: {
            owners: { include: { user: { select: { id: true, email: true, name: true } } } },
            locations: { where: { deletedAt: null } },
            categories: { include: { category: true } },
            certificationDocs: true,
            _count: { select: { locations: true, verifications: true, products: true } },
          },
        },
      },
    });
    if (!owner) throw new ForbiddenException('Company not found');
    return owner.company;
  }

  async findBySlug(slug: string) {
    const company = await this.prisma.company.findFirst({
      where: { slug, deletedAt: null },
      include: {
        owners: { include: { user: { select: { id: true, email: true, name: true } } } },
        locations: { where: { deletedAt: null } },
        categories: { include: { category: true } },
        certificationDocs: true,
        _count: { select: { locations: true, verifications: true, products: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, userId: string) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!company) throw new NotFoundException('Company not found');
    await this.requireOwnerOrAdmin(id, userId);

    const { categoryIds, ...updateData } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.company.update({
        where: { id },
        data: {
          ...updateData,
          updatedBy: userId,
          categories: categoryIds !== undefined
            ? {
                deleteMany: {},
                create: categoryIds.map((catId) => ({ categoryId: catId })),
              }
            : undefined,
        },
        include: {
          owners: { include: { user: { select: { id: true, email: true, name: true } } } },
          locations: { where: { deletedAt: null } },
          categories: { include: { category: true } },
        },
      });

      await tx.auditLog.create({
        data: { userId, action: 'UPDATE_COMPANY', resource: `company:${id}`, metadata: { changes: { ...dto } } },
      });

      return u;
    });

    try {
      await this.searchService.indexDocument(COMPANY_INDEX, id, {
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        businessType: updated.businessType,
        trustScore: updated.trustScore,
        verificationLevel: updated.verificationLevel,
        status: updated.status,
      });
    } catch (err) {
      this.logger.warn(`Failed to update company ${id} in OpenSearch: ${err}`);
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!company) throw new NotFoundException('Company not found');
    await this.requireOwnerOrAdmin(id, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: userId, status: 'INACTIVE' },
      });

      await tx.auditLog.create({
        data: { userId, action: 'DELETE_COMPANY', resource: `company:${id}` },
      });
    });

    try {
      await this.searchService.deleteDocument(COMPANY_INDEX, id);
    } catch (err) {
      this.logger.warn(`Failed to delete company ${id} from OpenSearch: ${err}`);
    }

    this.logger.log(`Company ${id} soft-deleted by ${userId}`);
  }

  async addOwner(companyId: string, newOwnerUserId: string, userId: string) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, deletedAt: null }, select: { id: true } });
    if (!company) throw new NotFoundException('Company not found');
    await this.requireOwnerOrAdmin(companyId, userId);

    const existing = await this.prisma.companyOwner.findUnique({
      where: { companyId_userId: { companyId, userId: newOwnerUserId } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('User is already an owner');

    const newOwner = await this.prisma.$transaction(async (tx) => {
      const owner = await tx.companyOwner.create({
        data: { companyId, userId: newOwnerUserId },
      });

      await tx.auditLog.create({
        data: { userId, action: 'ADD_COMPANY_OWNER', resource: `company:${companyId}`, metadata: { newOwnerUserId } },
      });

      return owner;
    });

    return newOwner;
  }

  async removeOwner(companyId: string, ownerUserId: string, userId: string) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, deletedAt: null }, select: { id: true } });
    if (!company) throw new NotFoundException('Company not found');
    await this.requireOwnerOrAdmin(companyId, userId);

    const owner = await this.prisma.companyOwner.findUnique({
      where: { companyId_userId: { companyId, userId: ownerUserId } },
      select: { id: true, isPrimary: true },
    });
    if (!owner) throw new NotFoundException('Owner not found');
    if (owner.isPrimary) {
      const ownerCount = await this.prisma.companyOwner.count({ where: { companyId } });
      if (ownerCount <= 1) throw new ForbiddenException('Cannot remove the last primary owner');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.companyOwner.delete({ where: { id: owner.id } });

      await tx.auditLog.create({
        data: { userId, action: 'REMOVE_COMPANY_OWNER', resource: `company:${companyId}`, metadata: { removedUserId: ownerUserId } },
      });
    });
  }

  async searchCompanies(query: string, filters: { businessType?: string; status?: string; city?: string; state?: string } = {}) {
    const searchFilters: Record<string, string | number | boolean | undefined> = {};
    if (filters.businessType) searchFilters.businessType = filters.businessType;
    if (filters.status) searchFilters.status = filters.status;

    let result;
    try {
      result = await this.searchService.search<Record<string, unknown>>(
        COMPANY_INDEX,
        query,
        searchFilters,
        { page: 1, limit: 20 },
      );
    } catch (err) {
      this.logger.warn(`Company search via OpenSearch failed, falling back to DB: ${(err as Error).message}`);
      const dbResult = await this.prisma.company.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { trustScore: 'desc' },
        include: {
          owners: { include: { user: { select: { id: true, email: true, name: true } } } },
          locations: { where: { deletedAt: null }, take: 1 },
          categories: { include: { category: true } },
        },
      });
      return { data: dbResult, meta: { total: dbResult.length, limit: 20, cursor: undefined } };
    }

    const ids = result.hits.map((hit) => hit.id as string);
    if (ids.length === 0) return { data: [], meta: { total: 0, limit: 20, cursor: undefined } };

    const companies = await this.prisma.company.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: {
        owners: { include: { user: { select: { id: true, email: true, name: true } } } },
        locations: { where: { deletedAt: null }, take: 1 },
        categories: { include: { category: true } },
      },
    });

    const idOrder = new Map(ids.map((id, index) => [id, index]));
    companies.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

    return {
      data: companies,
      meta: { total: result.total, limit: 20, cursor: undefined },
    };
  }

  async getPublicProfile(slug: string) {
    const company = await this.prisma.company.findFirst({
      where: { slug, deletedAt: null, status: { not: 'INACTIVE' } },
      include: {
        owners: { include: { user: { select: { id: true, name: true } } } },
        locations: { where: { deletedAt: null } },
        categories: { include: { category: true } },
        _count: { select: { locations: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo: company.logo,
      banner: company.banner,
      description: company.description,
      businessType: company.businessType,
      establishedYear: company.establishedYear,
      employeeCount: company.employeeCount,
      trustScore: company.trustScore,
      verificationLevel: company.verificationLevel,
      geographicReach: company.geographicReach,
      totalProducts: company.totalProducts,
      responseRate: company.responseRate,
      locations: company.locations.map((l) => ({
        type: l.type,
        city: l.city,
        state: l.state,
        country: l.country,
      })),
      categories: company.categories.map((cc) => cc.category.name),
      owners: company.owners.map((o) => ({ name: o.user.name })),
      isGstVerified: company.verificationLevel >= VerificationLevelThresholds.GST_VERIFIED,
    };
  }

  async getProfileCompletion(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, profileCompletionPercentage: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return { companyId: id, percentage: company.profileCompletionPercentage };
  }

  async getProfileCompletionDetails(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return this.profileCompletionService.getDetails(id);
  }

  async getOnboardingStatus(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return this.onboardingService.getStatus(id);
  }

  async updateSubscription(id: string, plan: string, status: string, expiresAt: string | undefined, userId: string) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null } });
    if (!company) throw new NotFoundException('Company not found');

    const data: Record<string, unknown> = {
      subscriptionPlan: plan as PlanType,
      subscriptionStatus: status as SubscriptionStatus,
      updatedBy: userId,
    };
    if (status === 'ACTIVE' || status === 'TRIAL') {
      data.subscriptionActivatedAt = company.subscriptionActivatedAt ?? new Date();
    }
    if (expiresAt) {
      data.subscriptionExpiresAt = new Date(expiresAt);
    }
    if (status === 'EXPIRED') {
      data.subscriptionGraceStart = new Date();
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.company.update({ where: { id }, data });

      await tx.subscriptionEvent.create({
        data: {
          companyId: id,
          status: status as SubscriptionStatus,
          planType: plan as PlanType,
          metadata: { previousStatus: company.subscriptionStatus },
        },
      });

      return u;
    });

    if (plan === 'TRADE_ELITE') {
      await this.autoAssignRm(id);
    }

    if (status === 'ACTIVE' || status === 'TRIAL') {
      await this.onboardingService.advanceStep(id, 'SUBSCRIPTION_ACTIVATED', userId);
    }

    return updated;
  }

  async removeRm(companyId: string, userId: string) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
    if (!company) throw new NotFoundException('Company not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: { assignedRmId: null, assignedAt: null, updatedBy: userId },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'REMOVE_RM',
          resource: `company:${companyId}`,
        },
      });
    });
  }

  async assignRm(companyId: string, rmUserId: string, userId: string) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
    if (!company) throw new NotFoundException('Company not found');

    const rmUser = await this.prisma.user.findUnique({ where: { id: rmUserId, isActive: true } });
    if (!rmUser) throw new NotFoundException('RM user not found');

    const managedCount = await this.prisma.company.count({ where: { assignedRmId: rmUserId, deletedAt: null } });
    if (managedCount >= MAX_ELITE_SELLERS_PER_RM) {
      throw new ForbiddenException(`RM can manage maximum ${MAX_ELITE_SELLERS_PER_RM} sellers`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.company.update({
        where: { id: companyId },
        data: { assignedRmId: rmUserId, assignedAt: new Date(), updatedBy: userId },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'ASSIGN_RM',
          resource: `company:${companyId}`,
          metadata: { rmUserId },
        },
      });

      return u;
    });

    return updated;
  }

  private async autoAssignRm(companyId: string) {
    const rms = await this.prisma.user.findMany({
      where: { isActive: true, role: 'MANAGER', rmCode: { not: null } },
      select: { id: true, _count: { select: { managedCompanies: true } } },
      orderBy: { managedCompanies: { _count: 'asc' } },
    });

    for (const rm of rms) {
      if (rm._count.managedCompanies < MAX_ELITE_SELLERS_PER_RM) {
        await this.prisma.company.update({
          where: { id: companyId },
          data: { assignedRmId: rm.id, assignedAt: new Date() },
        });
        this.logger.log(`Auto-assigned RM ${rm.id} to company ${companyId}`);
        return;
      }
    }

    this.logger.warn(`No available RM found for auto-assignment to company ${companyId}`);
  }

  async getCompanyRank(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { trustScore: true, verificationLevel: true, totalProducts: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const higherRanked = await this.prisma.company.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        OR: [
          { trustScore: { gt: company.trustScore ?? 0 } },
          { trustScore: company.trustScore ?? 0, totalProducts: { gt: company.totalProducts ?? 0 } },
        ],
      },
    });

    const totalActive = await this.prisma.company.count({
      where: { deletedAt: null, status: 'ACTIVE' },
    });

    return {
      companyId,
      rank: higherRanked + 1,
      totalActive,
      percentile: totalActive > 0
        ? Math.round(((totalActive - higherRanked) / totalActive) * 100)
        : 0,
      trustScore: company.trustScore,
      verificationLevel: company.verificationLevel,
    };
  }

  private async requireOwnerOrAdmin(companyId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN) return;

    const owner = await this.prisma.companyOwner.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { id: true },
    });
    if (!owner) throw new ForbiddenException('You are not an owner of this company');
  }
}

const VerificationLevelThresholds = {
  GST_VERIFIED: 'LEVEL_3',
} as const;
