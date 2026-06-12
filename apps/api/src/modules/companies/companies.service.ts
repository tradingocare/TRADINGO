import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Role } from '../../common/enums/role.enum';
import { v4 as uuid } from 'uuid';

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

    const company = await this.prisma.company.create({
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

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_COMPANY',
        resource: `company:${company.id}`,
        metadata: { name: dto.name, slug },
      },
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
    const { cursor, limit = 20, search, businessType, status, verificationLevel, organizationId, ownerId } = query;
    const where: Prisma.CompanyWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (businessType) where.businessType = businessType as Prisma.EnumBusinessTypeNullableFilter['equals'];
    if (status) where.status = status as Prisma.EnumCompanyStatusFilter['equals'];
    if (verificationLevel) where.verificationLevel = verificationLevel as Prisma.EnumVerificationLevelFilter['equals'];
    if (organizationId) where.organizationId = organizationId;
    if (ownerId) {
      where.owners = { some: { userId: ownerId } };
    }

    const findArgs: Prisma.CompanyFindManyArgs = {
      where,
      take: limit,
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
    const [data, total] = await Promise.all([
      this.prisma.company.findMany(findArgs),
      this.prisma.company.count({ where }),
    ]);
    return {
      data,
      meta: { total, limit, cursor: data.length > 0 ? data[data.length - 1].id : undefined },
    };
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

  async findBySlug(slug: string) {
    const company = await this.prisma.company.findFirst({
      where: { slug, deletedAt: null },
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

  async update(id: string, dto: UpdateCompanyDto, userId: string) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!company) throw new NotFoundException('Company not found');
    await this.requireOwnerOrAdmin(id, userId);

    const { categoryIds, ...updateData } = dto;

    const updated = await this.prisma.company.update({
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

    await this.prisma.auditLog.create({
      data: { userId, action: 'UPDATE_COMPANY', resource: `company:${id}`, metadata: { changes: { ...dto } } },
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

    await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId, status: 'INACTIVE' },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'DELETE_COMPANY', resource: `company:${id}` },
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

    const newOwner = await this.prisma.companyOwner.create({
      data: { companyId, userId: newOwnerUserId },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'ADD_COMPANY_OWNER', resource: `company:${companyId}`, metadata: { newOwnerUserId } },
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

    await this.prisma.companyOwner.delete({ where: { id: owner.id } });

    await this.prisma.auditLog.create({
      data: { userId, action: 'REMOVE_COMPANY_OWNER', resource: `company:${companyId}`, metadata: { removedUserId: ownerUserId } },
    });
  }

  async searchCompanies(query: string, filters: { businessType?: string; status?: string; city?: string; state?: string } = {}) {
    const searchFilters: Record<string, string | number | boolean | undefined> = {};
    if (filters.businessType) searchFilters.businessType = filters.businessType;
    if (filters.status) searchFilters.status = filters.status;

    const result = await this.searchService.search<Record<string, unknown>>(
      COMPANY_INDEX,
      query,
      searchFilters,
      { page: 1, limit: 20 },
    );

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
      where: { slug, deletedAt: null, status: { not: 'INACTIVE' as Prisma.EnumCompanyStatusFilter['not'] } },
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
