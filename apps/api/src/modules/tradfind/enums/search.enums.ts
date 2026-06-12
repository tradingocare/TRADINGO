export enum SearchEntity {
  PRODUCTS = 'products',
  COMPANIES = 'companies',
  CATEGORIES = 'categories',
  INDUSTRIES = 'industries',
}

export enum SearchSort {
  RELEVANCE = 'relevance',
  DISTANCE = 'distance',
  TRUST_SCORE = 'trust_score',
  VERIFICATION = 'verification',
  LATEST = 'latest',
  POPULARITY = 'popularity',
}

export enum DistanceUnit {
  KM = 'km',
}

export enum VerificationPriority {
  BANK_VERIFIED = 'LEVEL_4',
  GST_VERIFIED = 'LEVEL_3',
  BUSINESS_VERIFIED = 'LEVEL_2',
  BASIC_VERIFIED = 'LEVEL_1',
  UNVERIFIED = 'LEVEL_0',
}

export enum DistanceRange {
  WITHIN_5KM = 5,
  WITHIN_10KM = 10,
  WITHIN_25KM = 25,
  WITHIN_50KM = 50,
  WITHIN_100KM = 100,
  DISTRICT = -1,
  STATE = -2,
  PAN_INDIA = -3,
  GLOBAL = -4,
}

export enum SearchEvent {
  SEARCH_EXECUTED = 'search_executed',
  SEARCH_CLICKED = 'search_clicked',
  SEARCH_SAVED = 'search_saved',
}

export const SUGGESTIONS_CACHE_TTL = 300;
export const RECENT_SEARCHES_LIMIT = 20;
export const TRENDING_SEARCHES_LIMIT = 50;
export const DISCOVERY_FEED_CACHE_TTL = 300;
export const DEFAULT_SEARCH_LIMIT = 20;
export const MAX_AUTOCOMPLETE_SUGGESTIONS = 10;
export const SEARCH_RANKING_RELEVANCE_WEIGHT = 0.40;
export const SEARCH_RANKING_DISTANCE_WEIGHT = 0.25;
export const SEARCH_RANKING_TRUST_WEIGHT = 0.20;
export const SEARCH_RANKING_VERIFICATION_WEIGHT = 0.10;
export const SEARCH_RANKING_FRESHNESS_WEIGHT = 0.05;
