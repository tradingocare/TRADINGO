# Sprint P0.1 — SearchSort & ProductSearchDto Alignment

**Date:** 2026-07-31
**Status:** COMPLETE — verified
**Scope:** Fix `SearchSort` enum mismatch, fix `ProductSearchDto` mismatch, eliminate 400 responses for all supported sort/filter parameters. No UI, no Product Cards, no images/prices, no OpenSearch indexing changes.

---

## 1. Root Cause Recap (from TRADINGO-PRODUCTS-AUDIT.md)

Frontend discovery client sent 14+ params the backend DTO did not accept. Global `ValidationPipe` uses `forbidNonWhitelisted: true` → **any** unknown query param = 400. Frontend `placeholderData` masked the failures (stale results kept showing), so users saw filters/sort silently "not working".

## 2. Changes Applied (3 files, backend only)

### 2.1 `apps/api/src/modules/tradfind/enums/search.enums.ts`
Extended `SearchSort` with the 4 frontend sort values:
```ts
RATING = 'rating',        // Top Rated
PRICE_ASC = 'price_asc',  // Price: Low to High
PRICE_DESC = 'price_desc',// Price: High to Low
NEWEST = 'newest',        // Newest First (alias of LATEST)
```

### 2.2 `apps/api/src/modules/tradfind/dto/product-search.dto.ts`
Added 11 whitelisted params (all class-validator decorated):
- `subCategory?` (string) — accepted; not applied (no subCategory field in products index mapping)
- `minMoq?` (int ≥1) — **real filter**: `range { moq: { gte: minMoq } }`
- `verified?` (boolean) — **real filter**: `terms { verificationLevel: [LEVEL_1..LEVEL_4] }`
- `topRated?` (boolean) — accepted; not applied (no rating field in mapping yet)
- `inStock?` (boolean) — accepted; not applied (no stock field; `status: ACTIVE` already enforced)
- `fastResponse?` (boolean) — accepted; not applied (no responseTime field)
- `sellerType?` (string) — **real filter**: `term { businessType: sellerType.toUpperCase() }`
- `lat?` / `lng?` / `kmRadius?` (number/int) — **aliases** for `latitude` / `longitude` / `radius`
- `geoScope?` (string) — accepted; geo filter applies when coords present, else no-op

### 2.3 `apps/api/src/modules/tradfind/services/product-search.service.ts`
- New `resolveCoords()` helper — merges `latitude ?? lat`, `longitude ?? lng`, `radius ?? kmRadius`; used for geo distance filter AND geo sorts
- Filters wired: `verified`, `sellerType→businessType`, `minMoq→moq.gte` (in addition to existing `moq→moq.lte`)
- `buildSort()` — new cases:
  - `RATING` → `trustScoreSnapshot desc, _score desc` *(proxy: no rating field indexed yet — deterministic fallback, documented for P0.2)*
  - `PRICE_ASC` → `minPrice asc, missing: _last`
  - `PRICE_DESC` → `minPrice desc, missing: _last`
  - `NEWEST` → same as `LATEST` (`createdAt desc, _score desc`)
- **Data-honesty note:** params whose index fields don't exist (`topRated`, `inStock`, `fastResponse`, `subCategory`) are accepted WITHOUT crashing — term/range queries on unmapped OpenSearch fields would throw `search_phase_execution_exception` (500/empty results). They become no-ops returning all results until the fields are indexed (P0.2+). `verified=true` and `sellerType` execute real filters — they honestly return 0 while the index has no LEVEL_1+ / businessType docs.

## 3. Verification

### 3.1 API direct probes (all → **200**, zero 400s)
| Param combo | Status | Total | Notes |
|---|---|---|---|
| `sort=rating` / `price_asc` / `price_desc` / `newest` / `relevance` / `distance` | 200 | 5 | all sort values accepted |
| `verified=true` | 200 | 0 | honest — index has only LEVEL_0 |
| `topRated=true` / `inStock=true` / `fastResponse=true` | 200 | 5 | accepted no-ops |
| `sellerType=manufacturer` | 200 | 0 | honest — no businessType in docs |
| `minMoq=10` | 200 | **3** | real filter — moq≥10 matches PCB(100)/MOSFET(50)/Box(500) |
| `subCategory=cat` / `geoScope=near_me` | 200 | 5 | accepted no-ops |
| `lat=28.61&lng=77.2&kmRadius=50` | 200 | 0 | geo executes, docs lack location |
| `latitude=…&longitude=…&radius=…` | 200 | 0 | canonical names still work |
| combined (`sort=newest&verified&inStock&minMoq=1&sellerType`) | 200 | 0 | multi-param no crash |
| `minPrice=100&maxPrice=50000` | 200 | 0 | unchanged behavior (docs lack price) |

### 3.2 Playwright browser (localhost:3000/products, live API)
- Initial load → 200, 15 product links
- Sort dropdown → `sort=rating` → **200**, 15 links re-render
- Sort → `sort=price_asc` → **200**, 15 links
- "Verified Only" checkbox → `verified=true&sort=price_asc` → **200**, honest empty state
- Reset → 200, 15 links
- **Every `/search/products` call in browser: 200 — zero 400s**

### 3.3 Builds
- `pnpm -C apps/api build` (nest build) → **exit 0**
- `pnpm -C apps/web exec next build` → **exit 0**
- `tsc --noEmit` (api): 0 errors in production code; 37 pre-existing spec-file errors in `ai-gateway/*.spec.ts` (uncommitted earlier work, unrelated to this sprint — specs reference outdated service APIs)

## 4. Files Modified
1. `apps/api/src/modules/tradfind/enums/search.enums.ts`
2. `apps/api/src/modules/tradfind/dto/product-search.dto.ts`
3. `apps/api/src/modules/tradfind/services/product-search.service.ts`

API restarted with new build (detached, `node dist/main`). No frontend changes required — the frontend already sends the now-accepted param names.

## 5. Deferred (P0.2+ — explicitly out of Sprint P0.1 scope)
- `minPrice`/`rating`/`stock`/`responseTime`/`subCategory` fields are **not indexed** — sort/filter results reflect index data reality
- Frontend error-state UI (H-1), categories fetch fix (H-2), autocomplete route (H-3), pagination clamp (M-1) — separate sprints
