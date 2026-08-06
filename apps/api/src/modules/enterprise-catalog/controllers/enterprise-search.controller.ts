import { Controller, Get, Post, Body, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { EnterpriseSearchService } from '../services/enterprise-search.service';
import { EnterpriseSearchAnalyticsService } from '../services/enterprise-search-analytics.service';
import {
  EnterpriseSearchDto,
  AutocompleteDto,
  SearchSuggestionsDto,
  ReindexEnterpriseSearchDto,
  EnterpriseSearchAnalyticsQueryDto,
  EnterpriseSearchHealthDto,
} from '../dto/enterprise-search.dto';

interface RequestWithUser extends Request {
  user?: { id: string; companyId?: string };
}

@ApiTags('Enterprise Search')
@Controller('enterprise-catalog/search')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class EnterpriseSearchController {
  constructor(
    private readonly searchService: EnterpriseSearchService,
    private readonly analytics: EnterpriseSearchAnalyticsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Search enterprise catalog' })
  @Public()
  async search(@Body() dto: EnterpriseSearchDto, @Req() req: RequestWithUser) {
    return this.searchService.search(dto, req.user?.companyId, req.user?.id);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete enterprise search' })
  @Public()
  async autocomplete(@Query() dto: AutocompleteDto) {
    return this.searchService.autocomplete(dto.q, dto.limit);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @Public()
  async suggestions(@Query() dto: SearchSuggestionsDto, @Req() req: RequestWithUser) {
    return this.searchService.getSuggestions(req.user?.id, dto.limit, dto.entityType, dto.recentLimit);
  }

  @Post('reindex')
  @ApiOperation({ summary: 'Reindex enterprise search' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async reindex(@Body() dto: ReindexEnterpriseSearchDto) {
    return this.searchService.reindex(dto.indices);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check search index health' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async health(@Query() dto: EnterpriseSearchHealthDto) {
    return this.searchService.getIndexHealth(dto.indices);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get search analytics summary' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async analyticsSummary(@Query() dto: EnterpriseSearchAnalyticsQueryDto) {
    return this.analytics.getSearchAnalyticsSummary(dto.days);
  }

  @Get('analytics/top-queries')
  @ApiOperation({ summary: 'Get top search queries' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async topQueries(@Query() dto: EnterpriseSearchAnalyticsQueryDto) {
    return this.analytics.getTopQueries(dto.entityType, dto.days, dto.limit);
  }

  @Get('analytics/zero-results')
  @ApiOperation({ summary: 'Get zero-result queries' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async zeroResultQueries(@Query() dto: EnterpriseSearchAnalyticsQueryDto) {
    return this.analytics.getZeroResultQueries(dto.entityType, dto.days, dto.limit);
  }

  @Get('analytics/popular-brands')
  @ApiOperation({ summary: 'Get popular search brands' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async popularBrands(@Query() dto: EnterpriseSearchAnalyticsQueryDto) {
    return this.analytics.getPopularBrands(dto.days, dto.limit);
  }

  @Get('analytics/popular-categories')
  @ApiOperation({ summary: 'Get popular search categories' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async popularCategories(@Query() dto: EnterpriseSearchAnalyticsQueryDto) {
    return this.analytics.getPopularCategories(dto.days, dto.limit);
  }

  @Get('analytics/popular-attributes')
  @ApiOperation({ summary: 'Get popular search attributes' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async popularAttributes(@Query() dto: EnterpriseSearchAnalyticsQueryDto) {
    return this.analytics.getPopularAttributes(dto.days, dto.limit);
  }
}
