import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TradeservService } from './tradeserv.service';
import { TradeservIndexSyncService } from './tradeserv-index-sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchProfessionalsDto, SaveSearchDto } from './dto';
import { TradeservSearchV2Dto } from './dto/tradeserv-search-v2.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfessionalCompanyStatus } from '@prisma/client';

@ApiTags('TradeServ Search')
@Controller('tradeserv')
@Throttle({ default: { limit: 60, ttl: 60000 } })
export class TradeservSearchController {
  constructor(
    private readonly service: TradeservService,
    private readonly prisma: PrismaService,
    private readonly indexSyncService: TradeservIndexSyncService,
  ) {}

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search professionals' })
  async search(@Query() query: SearchProfessionalsDto) {
    return this.service.searchProfessionals(query);
  }

  @Get('discovery/trending')
  @Public()
  @ApiOperation({ summary: 'Get trending professionals' })
  async getTrending() {
    return this.prisma.professionalReview.groupBy({
      by: ['companyId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
  }

  @Get('discovery/nearby')
  @Public()
  @ApiOperation({ summary: 'Get nearby professionals by city' })
  async getNearby(@Query('city') city: string) {
    if (!city) return [];
    // O-9/O-11 narrowed scope: public nearby results enforce the established
    // APPROVED-company gate (same predicate as featured/search/detail).
    return this.prisma.company.findMany({
      where: { professionalType: { not: null }, professionalStatus: ProfessionalCompanyStatus.APPROVED, locations: { some: { city: { contains: city, mode: 'insensitive' } } } },
      select: { id: true, name: true, slug: true, logo: true, professionalType: true, description: true, trustScore: true, locations: { select: { city: true } } },
      take: 20,
    });
  }

  @Post('saved-searches')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save a search' })
  async saveSearch(@Body() body: SaveSearchDto, @CurrentUser('sub') userId: string) {
    return this.prisma.professionalSavedSearch.create({ data: { userId, name: body.name, searchCriteria: body.searchCriteria as any } });
  }

  @Get('search/v2')
  @Public()
  @ApiOperation({ summary: 'Search professionals with OpenSearch full-text + faceted filters' })
  async searchV2(@Query() query: TradeservSearchV2Dto) {
    // C-01 P1 F-8: resolve + server-validate canonical taxonomy filters ONCE
    // (both paths share this resolution — OpenSearch + Prisma fallback parity
    // by construction). Invalid IDs / mismatched parent-child resolve to the
    // honest empty company set; product-type items can never match (Service
    // type enforced in the resolver).
    const canonicalCompanyIds = await this.service.resolveCanonicalCompanyFilters({
      catalogCategoryId: query.catalogCategoryId,
      catalogSubcategoryId: query.catalogSubcategoryId,
      catalogItemId: query.catalogItemId,
    });

    const result = await this.indexSyncService.searchV2({
      query: query.query,
      category: query.category,
      city: query.city,
      state: query.state,
      professionalType: query.professionalType,
      minRating: query.minRating,
      verificationLevel: query.verificationLevel,
      languages: query.languages,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
      // Resolved validated APPROVED company set (undefined = no canonical
      // filter submitted; [] = honest unsatisfiable).
      resolvedCompanyIds: canonicalCompanyIds ?? undefined,
    });
    // F-14: searchV2 returns null on OpenSearch error OR zero-total on page 1
    // (empty/unsynced index must not masquerade as "no professionals") —
    // both fall through to the Prisma APPROVED search below.
    if (result) return result;
    const fallback = await this.service.searchProfessionals({
      query: query.query,
      category: query.category,
      city: query.city,
      professionalType: query.professionalType,
      minRating: query.minRating,
      page: query.page,
      limit: query.limit,
      sortBy: query.sort === 'newest' ? 'lastActiveAt' : 'trustScore',
      // C-01 P1 F-8: PG fallback parity — the same validated company-ID set.
      canonicalCompanyIds: canonicalCompanyIds ?? undefined,
    });
    // C-01 P1 F-8 (Phase 8 parity): canonical facets computed within the SAME
    // filtered universe as the OpenSearch aggregations (base filters + the
    // validated canonical company set) — real counts, no static lists.
    const canonicalFacets = await this.service.computeCanonicalFacets({
      query: query.query,
      city: query.city,
      professionalType: query.professionalType,
      minRating: query.minRating,
      canonicalCompanyIds: canonicalCompanyIds ?? undefined,
    });
    return {
      ...fallback,
      aggregations: {
        categories: [],
        ...canonicalFacets,
        cities: [],
        states: [],
        verificationLevels: [],
        ratingRanges: [],
        professionalTypes: [],
      },
    };
  }

  @Post('professionals-index/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Sync all professionals to OpenSearch index' })
  async syncIndex() {
    await this.indexSyncService.ensureIndex();
    const count = await this.indexSyncService.syncAllProfessionals();
    return { success: true, indexed: count, index: 'tradeserv_professionals_v1', alias: 'tradeserv_professionals' };
  }

  @Get('saved-searches')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List saved searches' })
  async listSavedSearches(@CurrentUser('sub') userId: string) {
    return this.prisma.professionalSavedSearch.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  @Delete('saved-searches/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a saved search' })
  async deleteSavedSearch(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const existing = await this.prisma.professionalSavedSearch.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Saved search not found');
    return this.prisma.professionalSavedSearch.delete({ where: { id } });
  }
}
