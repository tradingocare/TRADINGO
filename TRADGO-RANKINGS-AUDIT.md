# Phase 15B.5 — Existing vs New Report

## Audit Summary

| Domain | Existing | Missing | Action |
|--------|----------|---------|--------|
| Search Ranking | TradFind module — 10 endpoints, 5-factor scoring (relevance 40%, distance 25%, trust 20%, verification 10%, freshness 5%), OpenSearch indices for products/companies/categories/industries, autocomplete, suggestions, trending, discovery feed, search analytics (ClickHouse + Redis) | Frontend not wired to TradFind — browse page uses mock data (`/v1/search-ai/query` doesn't exist), search page uses old products API | Wire browse & search to TradFind |
| Company Ranking | `GET /companies/directory` — 3 sort options (trustScore, newest, name), city/state/verified/elite filters, `GET /companies/search` — OpenSearch relevance, `GET /companies/:slug/similar` — trustScore desc | No rank position in response | Add rank to directory |
| Product Ranking | 5 ranking endpoints: bestsellers, trending, top-categories, top-sellers, near-me/top — weekly snapshot-based (8-factor scoring) | No frontend API clients or hooks for any ranking endpoint | Add frontend clients + hooks |
| Leaderboards | TRADGO leaderboard (trustScore*0.6 + products*2 cap40), Analytics leaderboard (ClickHouse revenue rank) | No buyer/category/city/state leaderboards, analytics leaderboard not wired to frontend | Add city/state/category leaderboards |
| City/State Listings | `GET /city/:slug` exists but loads all products (no city filter). State endpoints only exist as query params on existing endpoints. No `/state/` page. | City page has no city filtering, no state page exists | Add city filtering + state leaderboard |
| Rank Display | Inline rank number in seller/tradgo page only. VerifiedBadge (trust level), SellerBadge (seller info). | No reusable rank badge/indicator component | Create RankBadge component |
| Bestseller Snapshots | Weekly pipeline computes product/category/seller rankings with 8/3/5-factor scoring. Hooked to CRON. | City/state fields hardcoded null, `isBestseller` flag on Product never updated | Fix null city/state |

## Implementation Plan

### 1. Unified Ranking Service — Extend `TradgoService` (no new module)
- Add `getUnifiedRanking(companyId)` — facade combining TRADGO leaderboard rank + Analytics rank + trust signals
- Add `getCityRankings(city, limit?)` — top companies + products by city (reuses existing data)
- Add `getStateRankings(state, limit?)` — top companies + products by state
- Add `getCategoryRankings(categoryId?, limit?)` — top categories with product counts

### 2. Search Integration — Wire browse page to TradFind
- Fix `ProductDiscoveryClient` to call `GET /search/products` instead of `/v1/search-ai/query`
- Create frontend API client for TradFind search endpoints
- Add React Query hooks for TradFind search
- Reuse existing `UnifiedCard` and `FilterSidebar` components

### 3. Company Rankings — Extend `CompaniesService`
- Add `getCompanyRank(companyId)` returning rank position + total count
- Add rank to company directory response

### 4. Product Rankings — Frontend API + Hooks
- Add `getBestsellers()`, `getTrending()`, `getTopCategories()`, `getTopSellers()` to product API client
- Add React Query hooks for each ranking endpoint

### 5. Leaderboards — Unify across entities
- Create `GET /tradgo/leaderboard/city/:city` endpoint
- Create `GET /tradgo/leaderboard/state/:state` endpoint
- Create `GET /tradgo/leaderboard/category/:categoryId` endpoint
- Add buyer-specific leaderboard (by total RFQs or orders)

### 6. Frontend — Ranking indicators
- Create `RankBadge` component (shows #1, #2, #3 with gold/silver/bronze styling)
- Add ranking indicators to company cards and product cards
- Wire city page to city-specific endpoint
- Add ranking to category and industry pages

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/modules/tradgo/tradgo.service.ts` | Add getUnifiedRanking(), getCityRankings(), getStateRankings(), getCategoryRankings() |
| `apps/api/src/modules/tradgo/tradgo.controller.ts` | Add 4 leaderboard endpoints |
| `apps/api/src/modules/companies/companies.service.ts` | Add getCompanyRank() + rank to directory |
| `apps/api/src/modules/companies/companies.controller.ts` | Add rank endpoint |
| `apps/web/components/shared/RankBadge.tsx` | **NEW** — reusable rank indicator |
| `apps/web/lib/api/tradgo.ts` | Add ranking API functions |
| `apps/web/lib/api/products.ts` | Add bestseller/trending/top API functions |
| `apps/web/hooks/use-tradgo.ts` | Add ranking hooks |
| `apps/web/hooks/use-products.ts` | Add ranking hooks |
| `apps/web/app/browse/page.tsx` | Wire to TradFind search |
| `apps/web/app/search/search-content.tsx` | Wire to TradFind search |
| `apps/web/app/city/[slug]/page.tsx` | Add city-specific ranking |

## Verification Expected
- prisma validate ✅ (no schema changes)
- tsc (api) 0 errors
- tsc (web) 0 errors
- eslint — no new violations
- next build — no new routes
