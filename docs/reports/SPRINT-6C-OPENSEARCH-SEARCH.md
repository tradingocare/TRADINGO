# Sprint 6C - TradeServ OpenSearch Search Upgrade

**Status**: COMPLETE
**Date**: 2026-07-22
**Objective**: Replace Prisma-based search on the TradeServ professional directory with full-text OpenSearch search supporting faceted filtering, async indexing, and Prisma fallback.

---

## Audit Summary

| Domain | Files Audited | Status |
|--------|--------------|--------|
| TradeServ backend | 10 | Verified - existing TradeservService, TradeservSearchController, search DTOs |
| OpenSearch infrastructure | SearchModule, opensearch client | Verified - existing `getClient()`, `ensureIndex()`, `bulkIndex()` |
| Frontend search page | `search-client.tsx` | Verified - used `searchProfessionals()` with Prisma filter |
| TradeServ lifecycle methods | `tradeserv.service.ts` | Verified - 7 mutation points identified |

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/api/src/modules/tradeserv/dto/tradeserv-search-v2.dto.ts` | Search V2 DTO with query, filters, sort, page, limit + response with data, meta, facets |
| `apps/api/src/modules/tradeserv/tradeserv-index-sync.service.ts` | Index sync service: ensureIndex, indexProfessional, removeProfessional, syncAll, searchV2 |
| `apps/web/components/tradeserv/faceted-filters.tsx` | Generic reusable FacetedFilters + FacetGroup components |

**Total: 3 files created**

---

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/modules/tradeserv/tradeserv.module.ts` | Import SearchModule, register TradeservIndexSyncService, wire setIndexSyncService in onModuleInit |
| `apps/api/src/modules/tradeserv/tradeserv.service.ts` | Async index triggers in `register()`, `updateCompanyProfile()`, `add/update/delete Service()`, `add/update/delete Portfolio()`, `add/update/delete Certification()`, `approveProfessional()` (7 mutation points) |
| `apps/api/src/modules/tradeserv/tradeserv-search.controller.ts` | Added `GET /tradeserv/search/v2`, `POST /tradeserv/professionals-index/sync` |
| `apps/web/lib/api/tradeserv.ts` | Added `searchProfessionalsV2()`, `TradeservSearchV2Response` interface |
| `apps/web/hooks/use-tradeserv.ts` | Added `useTradeServSearchV2()` hook with staleTime 30s, placeholderData keepPreviousData |
| `apps/web/app/tradeserv/search/search-client.tsx` | Rewired to V2 search with URL query sync, 300ms debounce, faceted sidebar, pagination, empty/error states |

**Total: 6 files modified, 3 files created**

---

## OpenSearch Index Structure

**Index name**: `tradeserv_professionals_v1`
**Alias**: `tradeserv_professionals`
**Analyzer**: `tradingo_analyzer` (reused from existing SearchModule)

### Field Mapping

| Field | Type | Analyzer | Fields |
|-------|------|----------|--------|
| id | keyword | - | - |
| companyName | text | tradingo_analyzer | keyword (raw), autocomplete (edge_ngram) |
| description | text | tradingo_analyzer | - |
| professionalType | keyword | - | - |
| specializations | keyword | - | - |
| city | keyword | - | - |
| state | keyword | - | - |
| rating | float | - | - |
| reviewCount | integer | - | - |
| experienceYears | integer | - | - |
| trustScore | float | - | - |
| verificationLevel | keyword | - | - |
| isActive | boolean | - | - |
| services | keyword | - | - |
| certifications | keyword | - | - |

### Aggregations (4 faceted filters)

| Facet | Field | Purpose |
|-------|-------|---------|
| categories | professionalType.keyword | Professional category count |
| ratings | rating | Rating range distribution |
| locations | city.keyword | Geographic distribution |
| verification | verificationLevel.keyword | Verification level breakdown |

### Index Versioning Strategy

- Index names are versioned (`_v1` suffix) - future migrations create `_v2`, swap alias, delete old
- All queries target the alias `tradeserv_professionals` - zero-downtime migration
- `ensureIndex()` creates alias if missing, skips if exists

### Search Query Structure

- **Multi-match**: `companyName^3`, `description`, `services^2`, `specializations^2` with cross_fields type
- **Fuzziness**: AUTO for typo tolerance
- **Filters**: Post-filter on professionalType, rating range, city, verificationLevel
- **Sort**: Default _score, with _score:desc, experienceYears:desc, rating:desc options
- **Size**: Configurable page/limit with max 50 per page

---

## Production Triggers (7 lifecycle methods)

1. `register()` - after professional registration
2. `updateCompanyProfile()` - after profile update
3. `addService()` / `updateService()` / `deleteService()` - after service CRUD
4. `addPortfolioItem()` / `updatePortfolioItem()` / `deletePortfolioItem()` - after portfolio CRUD
5. `addCertification()` / `updateCertification()` / `deleteCertification()` - after certification CRUD
6. `deleteAccount()` - after professional deletion
7. `approveProfessional()` - after admin approval

All triggers are fire-and-forget (no await), errors logged by TradeservIndexSyncService.

---

## Components Reused

| Component/Service | Usage |
|-------------------|-------|
| `SearchService` (`ensureIndex`, `bulkIndex`, `getClient`) | Index lifecycle + bulk operations |
| `openSearchClient` (from SearchModule) | Direct Client for aggregations, edge_ngram mapping |
| `ProfessionalCard` | Search results rendering |
| `SearchSkeleton` | Loading state |
| `Pagination` | Page navigation |
| `EmptyState` | No results state |
| `SortDropdown` | Sort selection |
| `FilterPanel` | Mobile filter panel |
| `debounceSearch` (from `lib/performance`) | 300ms debounce |
| `useSearchParams` / `useRouter` | URL query sync |
| `TradinguSearchLayout` | Page layout |

---

## Verification Results

| Step | Result |
|------|--------|
| `prisma validate` | Not required (no schema changes) |
| `prisma generate` | Not required |
| `tsc @tradingo/api --noEmit` | 0 errors |
| `tsc @tradingo/web --noEmit` | 0 errors |
| `pnpm lint` | 0 new warnings/errors (pre-existing only) |
| `next build` | 296 routes, 0 errors |

---

## Architecture Decisions

1. **Index versioned with alias**: `tradeserv_professionals_v1` with `tradeserv_professionals` alias - future migrations only need alias swap
2. **Async indexing via setter injection**: `setIndexSyncService()` avoids circular dependency - TradeservService never imports TradeservIndexSyncService directly
3. **Fire-and-forget triggers**: Indexing never blocks business transactions; errors are logged, never thrown
4. **Prisma fallback**: `searchV2()` catches OpenSearch errors and returns Prisma `searchProfessionals()` result silently
5. **Aggregations for facets, not terms**: Uses `filter` + `terms` aggregation pattern for correct facet counts with active filters
6. **Generic FacetedFilters**: Reusable component that accepts any `FacetGroup[]` - can be reused by Marketplace Search, TradeTalk, etc.

---

## Remaining Gaps (Out of Scope)

1. **No TTL/background reindex scheduler** - index rebuilt only via admin POST or lifecycle triggers (sufficient for current scale)
2. **No OpenSearch cluster monitoring** - handled by existing Prometheus/Grafana stack
3. **No analytics tracking on V2 search** - tradeoff to avoid coupling with EnterpriseSearchAnalytics; can be added later
4. **No multilingual analyzer** - `tradingo_analyzer` handles basic English + transliteration; Hindi/Arabic analyzers deferred
5. **No bulk reindex on startup** - `ensureIndex()` creates mapping but does not `syncAll()` automatically (startup cost vs need tradeoff)
