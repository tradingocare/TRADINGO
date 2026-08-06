import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TradfindService } from './tradfind.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GlobalSearchDto } from './dto/global-search.dto';
import { ProductSearchDto } from './dto/product-search.dto';
import { CompanySearchDto } from './dto/company-search.dto';
import { AutocompleteDto } from './dto/autocomplete.dto';
import { SuggestionsDto } from './dto/suggestions.dto';
import { RecentSearchQueryDto, DeleteRecentSearchDto } from './dto/recent-search.dto';
import { DiscoveryFeedDto } from './dto/discovery-feed.dto';
import { CatalogSearchDto } from './dto/catalog-search.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('TradFind Search')
@Controller()
export class TradfindController {
  constructor(
    private readonly tradfindService: TradfindService,
    private readonly searchAnalytics: SearchAnalyticsService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Global search across products and companies' })
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async globalSearch(@Query() dto: GlobalSearchDto) {
    return this.tradfindService.globalSearch(dto);
  }

  @Get('search/products')
  @ApiOperation({ summary: 'Search products' })
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async productSearch(@Query() dto: ProductSearchDto) {
    return this.tradfindService.productSearch(dto);
  }

  @Get('search/companies')
  @ApiOperation({ summary: 'Search companies' })
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async companySearch(@Query() dto: CompanySearchDto) {
    return this.tradfindService.companySearch(dto);
  }

  @Get('search/autocomplete')
  @ApiOperation({ summary: 'Autocomplete search query' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async autocomplete(@Query() dto: AutocompleteDto) {
    return this.tradfindService.autocomplete(dto);
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async suggestions(@Query() dto: SuggestionsDto) {
    return this.tradfindService.getSuggestions(dto);
  }

  @Get('search/recent')
  @ApiOperation({ summary: 'Get recent searches' })
  @UseGuards(JwtAuthGuard)
  async recentSearches(
    @CurrentUser('sub') userId: string,
    @Query() dto: RecentSearchQueryDto,
  ) {
    return this.tradfindService.getRecentSearches(userId, dto.limit || 10);
  }

  @Delete('search/recent')
  @ApiOperation({ summary: 'Delete recent searches' })
  @UseGuards(JwtAuthGuard)
  async deleteRecentSearches(
    @CurrentUser('sub') userId: string,
    @Query() dto: DeleteRecentSearchDto,
  ) {
    await this.tradfindService.deleteRecentSearches(userId, dto.searchId);
    return { message: 'Recent searches deleted' };
  }

  @Get('search/trending')
  @ApiOperation({ summary: 'Get trending searches' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async trendingSearches(
    @Query('limit') limit?: number,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.tradfindService.getTrendingSearches(limit || 10, period || 'daily');
  }

  @Get('discover')
  @ApiOperation({ summary: 'Get discovery feed' })
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async discoveryFeed(@Query() dto: DiscoveryFeedDto) {
    return this.tradfindService.getDiscoveryFeed(dto);
  }

  @Get('search/catalog')
  @ApiOperation({ summary: 'Search master catalog' })
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async searchCatalog(@Query() dto: CatalogSearchDto) {
    return this.tradfindService.searchCatalog(dto.q || '', dto.page, dto.limit);
  }

  @Post('search/reindex-catalog')
  @ApiOperation({ summary: 'Reindex master catalog' })
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  async reindexCatalog() {
    const result = await this.tradfindService.reindexCatalog();
    return {
      message: 'Master Catalog index synchronized successfully',
      ...result,
    };
  }

  @Post('search/click')
  @ApiOperation({ summary: 'Track search result click' })
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async trackClick(@Body() body: { query: string; resultId: string; resultType: string; userId?: string }) {
    await this.searchAnalytics.trackClick(body.query, body.resultId, body.resultType, body.userId);
    return { success: true };
  }

  @Get('search/analytics/summary')
  @ApiOperation({ summary: 'Search analytics summary' })
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  async searchAnalyticsSummary() {
    return this.searchAnalytics.getSearchAnalyticsSummary();
  }

  @Get('search/analytics/popular')
  @ApiOperation({ summary: 'Popular search queries' })
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  async popularQueries(@Query('limit') limit?: number) {
    return this.searchAnalytics.getPopularQueries(limit || 20);
  }
}
