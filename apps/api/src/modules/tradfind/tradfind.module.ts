import { Module } from '@nestjs/common';
import { TradfindController } from './tradfind.controller';
import { TradfindService } from './tradfind.service';
import { SearchModule } from '../search/search.module';
import { ProductSearchService } from './services/product-search.service';
import { CompanySearchService } from './services/company-search.service';
import { GeoSearchService } from './services/geo-search.service';
import { SearchRankingService } from './services/search-ranking.service';
import { AutocompleteService } from './services/autocomplete.service';
import { SuggestionsService } from './services/suggestions.service';
import { RecentSearchService } from './services/recent-search.service';
import { TrendingSearchService } from './services/trending-search.service';
import { DiscoveryFeedService } from './services/discovery-feed.service';
import { SearchAnalyticsService } from './services/search-analytics.service';

@Module({
  imports: [SearchModule],
  controllers: [TradfindController],
  providers: [
    TradfindService,
    ProductSearchService,
    CompanySearchService,
    GeoSearchService,
    SearchRankingService,
    AutocompleteService,
    SuggestionsService,
    RecentSearchService,
    TrendingSearchService,
    DiscoveryFeedService,
    SearchAnalyticsService,
  ],
  exports: [TradfindService],
})
export class TradfindModule {}
