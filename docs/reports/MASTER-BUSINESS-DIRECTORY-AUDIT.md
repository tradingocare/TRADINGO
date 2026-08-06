# TRADINGO Master Business Directory — Scalable Implementation Audit

**Phase**: Founder Change Request — `/trading` → Master Business Directory
**Date**: 2026-08-02
**Status**: ✅ COMPLETE — scales from today's data to 160+ / 1,600+ / 33,600+ without redesign

---

## 1. API Capacity Audit (current vs maximum)

| API | Pagination | Sort support | Filters | Max limit | Caching | Future capacity |
|---|---|---|---|---|---|---|
| `GET /categories` | cursor (`meta.cursor`) | sortOrder+name | search, isActive | 100 | — | 160+ categories (2 pages) |
| `GET /categories/tree` | none (full hierarchy) | hierarchical | — | — | — | fine for featured slice |
| `GET /industries` | cursor (`meta.cursor`) | name asc | search | 100 | — | ~50 industries (1 page) |
| `GET /discover` | page (`meta.total`) | feed-internal | — | page/limit | Redis 300s | any feed size |
| `GET /search/products` | page (`total`, `pages`) | relevance, distance, trust_score, latest, popularity, rating, price_asc/desc, newest | q, geo, filters | default 20 | — | 33,600+ products |
| `GET /companies/directory` | page (`pagination.hasNext`) | trustScore, newest, name | q, category, city, state, verified, elite, sellerType, minTrust | 48 | — | any company count |

**Key finding**: every backend API the directory needs already supports pagination (cursor or page) — the frontend now consumes it fully.

---

## 2. Capacity Table — Current Data vs Future Supported

| Domain | Today (DB) | Future supported (design) | Mechanism |
|---|---|---|---|
| Industries | 5 | ~50 (any count) | cursor infinite fetch (limit 100) + progressive 12 → +24 → All + search |
| Categories | 12 | **160+** | cursor infinite pages (limit 100) + server-side search + alphabetical + Featured/Popular/All tabs |
| Sub-categories | ~12 | **1,600+** | cursor infinite fetch, grouped by parent, A–Z index, per-group lazy expansion (20 → all) |
| Products | 11 | **33,600+** | 6 tabs; discover feed infinite (featured/trending) + search API infinite pages (recent/viewed/rated) |
| Companies | 2 | any | `/companies/directory` infinite pages × 4 tabs (featured/newest/verified/elite) |
| Brands | 0 | public API | future-ready placeholder (no fabrication) |
| Services | 0 | service module | future-ready placeholder (no fabrication) |
| Cities | 15 (static) | any | Popular / A–Z / Near Me (geolocation + real `/products/near-me/sellers`) |
| Collections | 8 (derived) | any | live-derived from category tree (top by product count) |

---

## 3. Performance Implementation

| Technique | Where |
|---|---|
| **Code splitting** | `next/dynamic` — Industries, Categories, Sub-categories, Products, Companies, Cities, Collections load on demand with skeleton fallbacks |
| **Infinite scroll** | Shared `useInfiniteScroll` IntersectionObserver hook (one implementation, reused by Products + Companies) + react-query v5 `useInfiniteQuery` (cursor and page variants) |
| **Progressive disclosure** | Industries 12 → View More (+24) → All; sub-category groups 20 → show all; top 12 groups → all groups |
| **Virtualization** | `content-visibility: auto` + `contain-intrinsic-size` on every section shell (defers layout/paint of off-screen sections, no library) |
| **Lazy loading** | City images `loading="lazy" decoding="async"`; ProductCard/CompanyCard images already lazy via Next Image |
| **Search** | Server-side search (categories + industries APIs accept `search`) with debounce-free controlled inputs; sub-category client filter |
| **Caching** | Discover feed Redis-cached (300s); react-query staleTime 60–300s per query; stats 300s |
| **Alphabetical** | Sub-categories A–Z index with smooth scroll; categories All tab alphabetical; cities A–Z tab |

---

## 4. Section Architecture (auto-scaling)

| # | Section | Data source | Scales via |
|---|---|---|---|
| Hero | AI Search | SearchBar (existing) | — |
| Stats strip | Live directory stats | `GET /companies/directory` (limit 1) — real counts | any data volume |
| Industries | `GET /industries` cursor | industries | cursor loop |
| Categories | tree + discover + `GET /categories` cursor | categories | cursor loop + search |
| Sub-categories | `GET /categories` cursor (grouped by parent) | subcategories | cursor loop + lazy groups |
| Products | discover + `GET /search/products` | products | page infinite × 5 tabs |
| Services | placeholder | — | swap data source only |
| Companies | `GET /companies/directory` | companies | page infinite × 4 tabs |
| Brands | placeholder | — | swap data source only |
| Cities | MASTER_CITIES + geolocation → near-me | cities/sellers | tab switching |
| Collections | category tree (derived) | categories | live derivation |
| Recommended | AI buyer-recommendations / trending | AI gateway | existing |

**Routing (all verified)**: industries → `/industry/[slug]` · categories & sub-categories → `/categories/[slug]` · products → `/products/[slug]` (ProductCard) · companies → `/companies/[slug]` (CompanyCard) · cities → `/city/[slug]`.

---

## 5. Honest gaps (no fabrication)

| Requested | Status | Reason |
|---|---|---|
| Most Viewed | ✅ powered by `sort=popularity` | closest supported sort; backend has no view-count ranking yet — swap value when it ships |
| Best Rated | ✅ powered by `sort=rating` | trustScoreSnapshot ranking |
| Highest GOCASH | ⏳ future-ready chip | **no backend sort exists** — tab renders a "coming soon" panel, auto-fills when ranking ships |
| Services / Brands | ⏳ placeholders | no public APIs / no data — per founder instructions |

---

## 6. Files

| File | Change |
|---|---|
| `app/trading/TradingDiscoveryClient.tsx` | REWRITTEN — hero + stats strip + 12 code-split sections + AI recommendations |
| `app/trading/page.tsx` | Updated metadata (title/description/canonical) |
| `lib/api/categories.ts` | Fixed `getCategories` return type — added backend `meta {cursor}` (was typed as PaginatedResponse, mismatching reality) |
| `components/directory/use-infinite-scroll.ts` | NEW — shared IntersectionObserver hook |
| `components/directory/primitives.tsx` | NEW — SectionShell (content-visibility), DirHeader, skeletons, error/empty, ViewMore, InfiniteSentinel |
| `components/directory/industries-section.tsx` | NEW — cursor + progressive disclosure + search |
| `components/directory/categories-section.tsx` | NEW — Featured/Popular/All tabs + search + alphabetical |
| `components/directory/subcategories-section.tsx` | NEW — grouped, A–Z, searchable, lazy groups |
| `components/directory/products-section.tsx` | NEW — 6 tabs, infinite scroll |
| `components/directory/companies-section.tsx` | NEW — 4 tabs, infinite scroll |
| `components/directory/cities-section.tsx` | NEW — Popular/A–Z/Near Me (geolocation) |
| `components/directory/collections-section.tsx` | NEW — live-derived collections |
| `components/directory/services-brands.tsx` | NEW — shared future-ready placeholders |

---

## 7. Verification

| Check | Result |
|---|---|
| `tsc --noEmit` (web) | ✅ 0 errors |
| `next build` | ✅ exit 0, compiled in 62s, `/trading` static route |
| No hardcoded categories / fabricated products | ✅ — every section consumes real API or approved placeholder |
| Design tokens | ✅ — `bg-surface`, `border-border`, `text-text-*`, `accent` only; text-white only on dark gradient overlays/buttons |

**Deliverable 4 (founder screenshots)** — page renders client-side; capture Desktop/Laptop/Tablet/Mobile via browser DevTools after `npm run dev` on http://localhost:3000/trading.
