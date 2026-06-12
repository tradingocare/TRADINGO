import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  Body,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TradfindService } from './tradfind.service';
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

@Controller()
export class TradfindController {
  constructor(private readonly tradfindService: TradfindService) {}

  @Get('search')
  @Public()
  async globalSearch(@Query() dto: GlobalSearchDto) {
    return this.tradfindService.globalSearch(dto);
  }

  @Get('search/products')
  @Public()
  async productSearch(@Query() dto: ProductSearchDto) {
    return this.tradfindService.productSearch(dto);
  }

  @Get('search/companies')
  @Public()
  async companySearch(@Query() dto: CompanySearchDto) {
    return this.tradfindService.companySearch(dto);
  }

  @Get('search/autocomplete')
  @Public()
  async autocomplete(@Query() dto: AutocompleteDto) {
    return this.tradfindService.autocomplete(dto);
  }

  @Get('search/suggestions')
  @Public()
  async suggestions(@Query() dto: SuggestionsDto) {
    return this.tradfindService.getSuggestions(dto);
  }

  @Get('search/recent')
  @UseGuards(JwtAuthGuard)
  async recentSearches(
    @CurrentUser('sub') userId: string,
    @Query() dto: RecentSearchQueryDto,
  ) {
    return this.tradfindService.getRecentSearches(userId, dto.limit || 10);
  }

  @Delete('search/recent')
  @UseGuards(JwtAuthGuard)
  async deleteRecentSearches(
    @CurrentUser('sub') userId: string,
    @Query() dto: DeleteRecentSearchDto,
  ) {
    await this.tradfindService.deleteRecentSearches(userId, dto.searchId);
    return { message: 'Recent searches deleted' };
  }

  @Get('search/trending')
  @Public()
  async trendingSearches(
    @Query('limit') limit?: number,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.tradfindService.getTrendingSearches(limit || 10, period || 'daily');
  }

  @Get('discover')
  @Public()
  async discoveryFeed(@Query() dto: DiscoveryFeedDto) {
    return this.tradfindService.getDiscoveryFeed(dto);
  }
}
