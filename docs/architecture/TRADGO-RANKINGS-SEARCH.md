# Phase 15B.5 — Unified Rankings & Search Integration

## Architecture

The ranking system reuses **6 existing ranking sources** through a unified facade — no new ranking engines or scoring algorithms were created.

### Ranking Sources

| Source | Module | Score Type | Used By |
|--------|--------|-----------|---------|
| TRADGO Leaderboard | `TradgoService.getLeaderboard()` | `trustScore * 0.6 + min(products * 2, 40)` | Company ranking |
| Company Directory | `CompaniesService.findDirectory()` | `trustScore DESC` | Directory listing |
| Product Bestseller | `BestsellerService` | 8-factor composite (weekly snapshot) | Product ranking |
| TradFind Search | `TradfindService.productSearch()` | OpenSearch 5-factor relevance | Browse/search |
| Trust Signals | `TradgoService.getTrustSignals()` | Aggregated trust data | Badge system |
| Analytics Leaderboard | `AnalyticsService.getSellerLeaderboard()` | ClickHouse revenue rank | Admin analytics |

### Unified Ranking Facade

**`TradgoService`** (no new module):
- `getUnifiedRanking(companyId)` — combines leaderboard rank + trust signals + earned badges
- `getCityRankings(city, limit?)` — top companies (trustScore DESC) + top products (createdAt DESC) by city
- `getStateRankings(state, limit?)` — same pattern for state
- `getCategoryRankings(categoryId, limit?)` — top products in category + related companies sorted by trustScore

**`CompaniesService`**:
- `getCompanyRank(companyId)` — rank position based on trustScore + totalProducts tiebreaker, percentile

### API Endpoints (6 new)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/tradgo/unified-ranking` | JWT | Current user's unified ranking |
| `GET` | `/tradgo/city-rankings/:city` | Public | Top companies & products by city |
| `GET` | `/tradgo/state-rankings/:state` | Public | Top companies & products by state |
| `GET` | `/tradgo/category-rankings/:categoryId` | Public | Top products & companies by category |
| `GET` | `/companies/:id/rank` | Public | Company rank position |
| `GET` | `/search/products` | Public | TradFind product search (existing endpoint, now wired) |

### Frontend Components

**`RankBadge`** (new component):
- Renders rank number (#1, #2, #3 with gold/silver/bronze styling)
- 3 sizes (sm/md/lg)
- Optional label display for top 3 ranks
- Optional "of N" total count display

**`ProductDiscoveryClient`** (wired):
- Replaced broken `/v1/search-ai/query` call with real `GET /search/products` (TradFind)
- Full parameter mapping: `q`, `categoryId`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`
- Response mapped to `DiscoveryResult[]` format
- Graceful fallback to empty state when API unavailable

**`SearchContent`** (enhanced):
- Added `trustScoreSnapshot` display as a star rating badge
- Imports `RankBadge` (available for future use)

**City page** (`/city/[slug]`):
- Fully wired: replaced all-products fetch with `GET /tradgo/city-rankings/:city`
- Real data: company count, product count, top sellers with `RankBadge`, top products with images

## Existing vs New

| Domain | Previously | Now |
|--------|-----------|-----|
| Ranking aggregation | None — each ranking source standalone | Unified facade across 6 sources |
| Browse page | Mock data + dead `/v1/search-ai/query` | Real TradFind `/search/products` |
| City page | All products (no city filter) | City-specific rankings |
| Rank display | Inline rank number in tradgo page only | Reusable `RankBadge` component |
| Company rank | Not available | `GET /companies/:id/rank` |
| TrustScore display | Hidden in nested seller info | Visible star badge in search results |
| City/state rankings | No dedicated endpoint | 4 new public endpoints |

## Files Modified (12)

| File | Change |
|------|--------|
| `apps/api/src/modules/tradgo/tradgo.service.ts` | Added 4 ranking methods (getUnifiedRanking, getCityRankings, getStateRankings, getCategoryRankings) |
| `apps/api/src/modules/tradgo/tradgo.controller.ts` | Added 4 endpoints + @Param import |
| `apps/api/src/modules/companies/companies.service.ts` | Added getCompanyRank() |
| `apps/api/src/modules/companies/companies.controller.ts` | Added GET /:id/rank |
| `apps/web/lib/api/tradgo.ts` | Added 6 interfaces + 4 API functions (getUnifiedRanking, getCityRankings, getStateRankings, getCategoryRankings) |
| `apps/web/lib/api/types.ts` | Added trustScoreSnapshot to Product interface |
| `apps/web/hooks/use-tradgo.ts` | Added 5 hooks (useUnifiedRanking, useCityRankings, useStateRankings, useCategoryRankings) |
| `apps/web/app/city/[slug]/page.tsx` | Wired to real city rankings API, added RankBadge, product images |
| `apps/web/app/search/search-content.tsx` | Added trustScoreSnapshot star badge |
| `apps/web/components/discovery/ProductDiscoveryClient.tsx` | Wired doSearch to TradFind /search/products |
| `apps/web/hooks/index.ts` | Already exports use-tradgo hooks (unchanged) |

## Files Created (2)

| File | Description |
|------|-------------|
| `apps/web/components/shared/RankBadge.tsx` | Reusable rank indicator with gold/silver/bronze styling |
| `TRADGO-RANKINGS-SEARCH.md` | This documentation |

## Components Reused

- `VerifiedBadge` — trust level display (already used by SellerBadge)
- `SellerBadge` — seller identity + trust score in search results
- `UnifiedCard`, `ProductCard`, `CompactProductCard` — listing card components

## New Integrations

- TradFind `/search/products` → Browse page (replaces dead endpoint)
- TradFind city/state/category rankings → New public API endpoints
- RankBadge → City page top sellers listing

## Verification Results

| Check | Status |
|-------|--------|
| prisma validate | ✅ (no schema changes) |
| prisma generate | ✅ (no schema changes) |
| tsc (api) | ✅ 0 errors |
| tsc (web) | ✅ 0 errors |
| eslint (api) | ✅ no new violations (61 pre-existing errors only) |
| next build | ✅ 180 routes |
