import { SearchEntity, SearchSort } from '../enums/search.enums';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GeoSearchParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface SearchFilters {
  categoryId?: string;
  industryId?: string;
  productType?: string;
  verificationLevel?: string;
  businessType?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  moq?: number;
  minTrustScore?: number;
  maxTrustScore?: number;
  city?: string;
  state?: string;
  country?: string;
  isFeatured?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface SearchPagination {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SearchSortOptions {
  sort?: SearchSort;
  latitude?: number;
  longitude?: number;
}

export interface UnifiedSearchResult<T> {
  hits: T[];
  total: number;
  page: number;
  limit: number;
  cursor?: string;
}

export interface GlobalSearchResponse {
  products: Record<string, unknown>[];
  companies: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  industries: Record<string, unknown>[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface AutocompleteResult {
  type: SearchEntity;
  id: string;
  text: string;
  slug?: string;
  logo?: string;
  subText?: string;
}

export interface SearchSuggestion {
  query: string;
  count: number;
  type?: SearchEntity;
}

export interface RecentSearchEntry {
  id?: string;
  userId: string;
  query: string;
  timestamp: Date;
}

export interface TrendingSearchEntry {
  query: string;
  count: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface DiscoveryFeedItem {
  type: 'product' | 'company' | 'category' | 'deal';
  data: Record<string, unknown>;
  reason: string;
  dealType?: 'featured' | 'promotion' | 'subscription_boost' | 'rfq' | 'go_reach';
  promotionSource?: string;
}

export interface DiscoveryFeedResponse {
  items: DiscoveryFeedItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface SearchRankingScore {
  relevanceScore: number;
  distanceScore: number;
  trustScore: number;
  verificationScore: number;
  freshnessScore: number;
  totalScore: number;
}

export interface SearchAnalyticsEvent {
  userId?: string;
  sessionId?: string;
  query: string;
  entityType?: SearchEntity;
  resultCount: number;
  clickedResultId?: string;
  clickedResultType?: string;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
