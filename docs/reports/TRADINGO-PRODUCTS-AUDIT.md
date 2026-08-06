# TRADINGO Product Listing Audit — `/products`

**Date:** 2026-07-31
**Mode:** AUDIT ONLY — zero code modified
**Target:** `http://localhost:3000/products`
**Tooling:** Static code trace (route → client → hook → API → OpenSearch) + Playwright 1.61 runtime verification + direct API/OpenSearch probes

---

## 1. Summary Verdict

| Domain | Status | Evidence |
|---|---|---|
| Routing | ✅ PASS | `/products` → Suspense → `ProductDiscoveryClient`; `/products/[slug]` detail |
| API responses | ⚠️ PARTIAL | `/search/products` 200 & mapped correctly; **9 of 18 filter/sort params → 400** |
| Browser console | ⚠️ WARN | 0 errors on clean load; 2 React setState-in-render warnings; 404s after interaction |
| Network requests | ⚠️ PARTIAL | Autocomplete → `/search-ai/autocomplete` 404 (route is `/search/autocomplete`) |
| React Query | ⚠️ GAP | **No `isError` handling anywhere** — failures silently show stale/empty data |
| Component hierarchy | ✅ PASS | 8 components, clean delegation |
| Reusable components | ✅ PASS | SearchBar/FilterSidebar/NearToFarBanner/EngineBar/UnifiedCard all reused |
| CSS/Layout | ✅ PASS | Design tokens used; no broken images; sticky search bar correct |
| Empty/Loading states | ✅ PASS | Skeletons + "No results found" verified at runtime |
| Error states | ❌ MISSING | No error UI, no toast on query failure |
| **Runtime score** | **6.5/10** | Page renders, but core commerce filters + pricing data are broken |

---

## 2. Routing Map (Verified)

```
app/products/page.tsx                  (server, Metadata + Suspense)
└─ app/products/ProductsPageClient.tsx  (re-export)
   └─ components/discovery/ProductDiscoveryClient.tsx   ← the real page
      ├─ SearchBar           (query, mode tabs, autocomplete, voice/image stubs)
      ├─ FilterSidebar       (sort, quick filters, location, seller type, price, category)
      ├─ NearToFarBanner     (6 geo rings)
      ├─ EngineBar           (TRADFIND/TRADMATCH/TRADRFQ/TRADCONNECT/TRADTRUST/TRADZERO)
      ├─ UnifiedProductCard  (products, via fromDiscoveryResult)
      ├─ UnifiedCard         (services/companies fallback)
      ├─ Compare drawer      (useCompareStore, /compare?ids=)
      ├─ BreadcrumbNav / ResultSkeleton / pagination
   └─ hooks/use-discovery.ts → useProductSearch → lib/api/discovery.ts → GET /search/products
```

URL sync: `router.replace('/products?q&mode&category&sort&page')` — verified working (sort/category/page reflect in URL).

---

## 3. API Contract Audit (Frontend vs Backend)

**Backend:** `GET /api/v1/search/products` (TradfindController → TradfindService.productSearch → ProductSearchService.search)
**DTO:** `ProductSearchDto` with `whitelist: true, forbidNonWhitelisted: true` (main.ts:239-243)

| Frontend sends | Backend accepts? | Runtime result |
|---|---|---|
| `q`, `page`, `limit`, `categoryId`, `minPrice`, `maxPrice`, `city`, `state` | ✅ Yes | **200 OK** |
| `sort=rating` (Top Rated) | ❌ Not in `SearchSort` enum | **400** |
| `sort=price_asc` | ❌ Not in enum | **400** |
| `sort=price_desc` | ❌ Not in enum | **400** |
| `sort=newest` | ❌ Not in enum | **400** |
| `verified=true` (Verified Only) | ❌ Not in DTO | **400** |
| `topRated=true` | ❌ Not in DTO | **400** |
| `inStock=true` | ❌ Not in DTO | **400** |
| `fastResponse=true` | ❌ Not in DTO | **400** |
| `sellerType=manufacturer` | ❌ Not in DTO | **400** |
| `minMoq` | ❌ DTO has `moq`, not `minMoq` | **400** |
| `geoScope=near_me` | ❌ Not in DTO | **400** |
| `lat`, `lng`, `kmRadius` | ❌ DTO has `latitude`/`longitude`/`radius` | **400** |
| `subCategory` | ❌ Not in DTO | **400** |
| `sort=distance` | ✅ Valid enum value | 200 |
| `sort=relevance` | ✅ Valid | 200 |

**Backend `SearchSort` enum:** `relevance | distance | trust_score | verification | latest | popularity`
**Frontend sends:** `relevance | rating | price_asc | price_desc | newest` — only `relevance` overlaps.

> **Root cause:** frontend filter vocabulary (built for a different API era) was never aligned to the current DTO. Combined with `forbidNonWhitelisted: true`, **every filter except category/price/city/state triggers a 400**. Because `placeholderData: prev => prev` keeps stale results, the user never sees an error — filters just silently stop working.

---

## 4. Data Quality Audit (OpenSearch Index)

Probed `GET /products/_search?size=5` directly:

| Field | Indexed? | Value |
|---|---|---|
| `minPrice` / `maxPrice` / `currency` | ⚠️ In mapping | **ABSENT from all 5 docs** |
| `media` | ✅ | **Empty array `[]` on all 5 docs** |
| `verificationLevel` | ✅ | `LEVEL_0` (all) |
| `trustScoreSnapshot` | ✅ | `0` (all) |
| `city` / `state` | ✅ | empty |
| `moq` / `unit` / `sku` | ✅ | populated |

**Impact:**
- **No price anywhere** → every card renders `Rs /unit` with blank price (mapper hardcodes `price: undefined`).
- **No images** → all cards fall back to the 📦 emoji placeholder block.
- **No geo/trust/verification data** → cards show "0.0 (0)" rating, no Verified badge, no trust chip.

> **Root cause:** index sync pipeline (wherever docs are written to OpenSearch) does not populate `minPrice`/`maxPrice`/`currency`/`media` from the Product record. This is a data-pipeline gap, not a UI gap.

---

## 5. Component-Level Findings

### ProductDiscoveryClient.tsx
- ✅ Loading skeletons (12), empty state with "Clear All Filters", corrected-query banner, pagination
- ❌ **No `isError` branch** — `const { data, isLoading } = useProductSearch(filters)`; on 400/500 the UI shows stale `placeholderData` or the empty state as if "no results"
- ❌ Mode tabs (All/Products/Services/Companies) change URL but **mode is never sent to the API** — `toParams()` drops `mode`; backend `/search/products` is products-only. Tabs are decorative.
- ❌ Geo rings (NearToFarBanner) call `geoScope=near_me` → 400 (see table above)
- ⚠️ Pagination: when URL `?page=2` exceeds available pages, page shows **both** "5 results" text AND "No results found" (contradictory). Verified at runtime.

### use-discovery.ts
- ✅ queryKey per params, `placeholderData`, 30s staleTime
- ❌ No `retry`/`onError`/`isError` surfaced to UI

### discovery.ts (`searchProducts`)
- ❌ `mapOsHitToDiscoveryResult` hardcodes `price: undefined`, `rating: 0`, `reviewCount: 0`, `geoBreakdown: []`, `responseTime: ''`
- ❌ Mapper reads `hit.media` (array of `{url}` or strings) — index docs have `media: []`, so images never appear even when prices do later

### SearchBar.tsx
- ❌ **Autocomplete calls `/search-ai/autocomplete` — 404**. Backend route is `/search/autocomplete` (verified 404 vs 200). Silent `catch {}` → suggestions never appear.
- ⚠️ `placeholder-white/30` (line 97) — token violation (minor, decorative)

### FilterSidebar.tsx
- ⚠️ `hover:text-gray-600` (line 192) — DESIGN_D token violation (minor)
- ❌ Verified/Top Rated/In Stock/Fast Response/Seller Type/Location/MOQ — all → 400 (see table)

### UnifiedCard.tsx
- ✅ Tokens, VerifiedBadge, SellerBadge, compare, RFQ, chat all wired
- ⚠️ Save uses `POST /v1/recommendations/track` — endpoint availability not verified in this audit

### Categories fetch (ProductDiscoveryClient line 90-99)
- ❌ Backend returns paginated `{ data: [...], meta }`; frontend reads `res.data?.categories || res.data` → `.map()` on a wrapper object throws → React Query error → **Category filter renders empty**. (Silently.)

---

## 6. Runtime Test Results (Playwright, fresh API)

| Test | Result |
|---|---|
| GET /products | 200, renders (41,919 chars body) |
| Product cards | 5 results / 15 product links |
| Price visible | ❌ Blank — "Rs /unit" (no price in index) |
| `q=product` | Empty state correctly shown (0 matching names) |
| `q=PCB` (direct API) | 1 hit — search works |
| Sort → "Top Rated" | **400** → stale results shown, no error |
| Verified Only | **400** → silent |
| Price range 1000-5000 | 200 → "No results found" (correct filter behavior) |
| Page 2 URL | Contradictory "5 results" + "No results found" |
| Console errors (clean load) | 0 ❌→ 8 after interactions (400s, 404s, 2 React warnings) |
| Broken images | 0 (no images to break — media empty) |
| Autocomplete | ❌ no suggestions (404 route) |

---

## 7. Bugs Register

### 🔴 CRITICAL
| # | Bug | Root cause | Fix area |
|---|---|---|---|
| C-1 | **Sort dropdown: 4 of 5 options → 400** (Top Rated, Price L→H, H→L, Newest) | Frontend sort values ∉ backend `SearchSort` enum | Align enum or map values in `discovery.ts` |
| C-2 | **Filters: 8 of 11 → 400** (Verified, Top Rated, In Stock, Fast Response, Seller Type, MOQ, Geo scope, Location+Radius) | Frontend params ∉ `ProductSearchDto` + `forbidNonWhitelisted` | Extend DTO or map params client-side |
| C-3 | **No price on any card** | Index docs have no `minPrice`/`maxPrice`/`currency`; mapper hardcodes `price: undefined` | Fix index sync to populate price fields |
| C-4 | **No product images** | Index docs have `media: []` | Fix index sync to populate media |

### 🟠 HIGH
| # | Bug | Root cause | Fix area |
|---|---|---|---|
| H-1 | **No error state** — API failures render as "no results"/stale data, no toast | `isError` not destructured/handled | `ProductDiscoveryClient` |
| H-2 | **Category filter empty** | Frontend `.map` on paginated wrapper `{data,meta}` | `discovery.ts` categories fetch |
| H-3 | **Autocomplete dead** | `/search-ai/autocomplete` vs `/search/autocomplete` | `SearchBar.tsx` route |
| H-4 | Rating/trust/geo signals always blank (0.0, no badges, no geo counts) | Mapper hardcodes zeros; index has no data | Index sync + mapper |

### 🟡 MEDIUM
| # | Bug | Root cause |
|---|---|---|
| M-1 | Page 2 beyond range → contradictory "5 results" + "No results found" | No page clamp against `pages` |
| M-2 | Mode tabs (Products/Services/Companies) do nothing | `mode` never sent to API |
| M-3 | Geo rings (`NearToFarBanner`) break search (400) | `geoScope` not in DTO |
| M-4 | 2× "Cannot update a component while rendering a different component" | Likely SearchBar suggestion state or skeleton — needs identification |
| M-5 | `/placeholder-product.jpg` 404 (compare fallback) | Missing asset |

### 🟢 LOW
| # | Bug |
|---|---|
| L-1 | `placeholder-white/30` in SearchBar (token) |
| L-2 | `hover:text-gray-600` in FilterSidebar (token) |
| L-3 | `geoBreakdown` hardcoded `[]` — NearToFarBanner counts never display |

---

## 8. Existing vs Missing

**Existing (reuse, don't rebuild):** ProductDiscoveryClient layout & URL sync, SearchBar, FilterSidebar, NearToFarBanner, EngineBar, UnifiedCard, UnifiedProductCard, useCompareStore, useProductSearch hook, ResultSkeleton, empty state, pagination UI, backend ProductSearchService (OpenSearch), ProductSearchDto, SearchSort enum, TransformInterceptor unwrap (already fixed globally).

**Missing (fix, don't build new):** error-state UI, param vocabulary alignment (frontend↔DTO), price/media index population, autocomplete route fix, categories response unwrap, page clamp, mode→API wiring, geoBreakdown mapping.

---

## 9. Priority-wise Fix List

### P0 — Blocking (commerce breaks)
1. **C-1/C-2 — Align filter/sort params.** *Option A (backend):* extend `ProductSearchDto` with `verified`, `topRated`, `inStock`, `fastResponse`, `sellerType`, `minMoq`, `geoScope`, `subCategory`, `lat`, `lng`, `kmRadius` + extend `SearchSort` with `rating|price_asc|price_desc|newest`. *Option B (frontend):* map in `discovery.ts` to existing DTO fields (`verified`→`verificationLevel`, `minMoq`→`moq`, `lat/lng/kmRadius`→`latitude/longitude/radius`, drop `geoScope`/`subCategory`, map sort values to enum). Recommended: **A** (single contract, no silent drops).
2. **C-3/C-4 — Populate price + media in OpenSearch index** at sync time (`minPrice`, `maxPrice`, `currency`, `media` URLs from Product record); then map them in `mapOsHitToDiscoveryResult` (`price: hit.minPrice`, `images: media`).

### P1 — High
3. **H-1 — Add `isError` branch** in `ProductDiscoveryClient`: error banner + "Try again" button (reuse existing toast).
4. **H-2 — Fix categories fetch**: unwrap `res.data.data` (or read `.data` array).
5. **H-3 — Fix autocomplete route** to `/search/autocomplete`.
6. **H-4 — Map real rating/reviewCount/geoRing/trust from index** when present; fall back to 0.

### P2 — Medium
7. **M-1 — Clamp `page`** to `data.pages` (or hide count when `results.length===0`).
8. **M-2 — Wire `mode`** to backend or hide the tabs until supported.
9. **M-3 — Remove/remap `geoScope`** param; use `latitude/longitude/radius` only.
10. **M-4 — Identify & fix setState-in-render warning** (react-dev mode; console noise).
11. **M-5 — Provide placeholder image asset** or remove fallback reference.

### P3 — Low
12. **L-1/L-2 — Token cleanup** (placeholder-white/30, hover:text-gray-600).
13. **L-3 — Map `geoBreakdown`** from response when backend provides it.

---

## 10. Files Touched by This Audit
**None.** Audit-only — no code modified. Temporary Playwright scripts (`products-audit.mjs`) remain in `apps/web/` for re-runs; screenshots in `apps/web/fat-report/products-audit/`.

**Environment note:** During the audit, Docker Desktop + PostgreSQL + Redis were found down (API dead, connection-refused). Containers restarted; API restarted detached; all subsequent tests ran against healthy infra. This downtime was environmental, not application code.
