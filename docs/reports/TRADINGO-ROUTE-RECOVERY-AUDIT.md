# TRADINGO Route Recovery Audit — `/trading`, `/products`, `/browse`

**Date:** 2026-07-31
**Mode:** AUDIT ONLY — zero code modified
**Scope:** Route architecture, duplicate analysis, git provenance, runtime verification, navigation inventory, recovery plan

---

## 1. Executive Summary

| Route | Verdict |
|---|---|
| `/trading` | ✅ **ACTIVE** — TEM E-Marketplace marketing page. Renders fully (200, all 10 sections, 0 console errors). **Not blank.** 2 cosmetic corrupt bytes (U+FFFD) render as `?`. |
| `/products` | ✅ **ACTIVE — PRIMARY** — official Product Listing page (metadata + Suspense + ProductDiscoveryClient). |
| `/browse` | ⚠️ **DUPLICATE / ACCIDENTAL** — thin 25-line client wrapper mounting the **exact same component** as `/products`. Not referenced in main nav; only 16 deep-page links point to it. Never explicitly requested. |

**Key finding:** `/browse` is a leftover duplicate born in the same commit family as `/products` and converged to the same component on 2026-06-28 (`b85b3b8ed`). It has no business purpose distinct from `/products`.

---

## 2. Route Provenance (Git History)

| Route | Created | Original form | Converged to | Today |
|---|---|---|---|---|
| `/browse` | `9545fe3b3` (2026-06-16) | **Real listing**: `getProducts()` API + ProductCard grid + search + pagination | `b85b3b8ed` (2026-06-28) — reduced 117→20 lines | Thin wrapper → `ProductDiscoveryClient` |
| `/products` | `9545fe3b3` (2026-06-16) | Static marketing page (category cards, no listing) | `d039307e3` (06-17) added `[slug]` detail; `b85b3b8ed` (06-28) became **official listing** | Server component → `ProductsPageClient` → `ProductDiscoveryClient` |
| `/trading` | `9545fe3b3` (2026-06-16) | Server component w/ Metadata, CTA block | `53dcd8087` (06-22) redesign pass; `b85b3b8ed` (06-28) rewritten `'use client'` w/ token styling | 10-section marketing page |

**When `/browse` was introduced:** commit `9545fe3b3` — *"Phase 7D.1-7D.3 backend complete, migrations synced, build green"* (2026-06-16). It was the **first** listing route. It became a duplicate on 2026-06-28 in `b85b3b8ed` (*"Production build stable"*) when `/products` was promoted to the official discovery route and `/browse` was collapsed into a same-component alias. **This promotion+collapse in one commit is the root cause of the duplication** — `/browse` was never deleted.

---

## 3. Comparison Table

| Route | Page File | Components Used | Business Purpose | Status |
|---|---|---|---|---|
| `/trading` | `app/trading/page.tsx` (335 lines) | Hero, SectionHeader, AnimatedSection, FeatureCards, StatisticsCards, Timeline, LiveStats, GlassCard/IconBox/GradientGlow (local), `TRADING_*` + `MASTER_CITIES` + `CATALOG_CATEGORIES` data | TEM E-Marketplace branding/onboarding page (About TEM, categories, cities, sellers, buyers, RFQ flow, security, stats, why-trading) | **ACTIVE** — 200, full render, 0 console errors |
| `/products` | `app/products/page.tsx` → `ProductsPageClient.tsx` (re-export) | Suspense + LoadingFallback (server); `ProductDiscoveryClient` (client): SearchBar, FilterSidebar, NearToFarBanner, EngineBar, UnifiedCard, UnifiedProductCard, Compare drawer, pagination, skeletons | **Primary** product listing & discovery (search, filters, geo rings, engines, compare) | **ACTIVE / PRIMARY** |
| `/browse` | `app/browse/page.tsx` (25 lines) | `ProductDiscoveryClient` — **identical to `/products`** | None distinct — duplicates `/products` | **DUPLICATE / ACCIDENTAL** |

---

## 4. Does `/products` reuse `/browse`?

**No — it's the reverse.** `app/products/ProductsPageClient.tsx` is a 1-line re-export of `components/discovery/ProductDiscoveryClient`; `app/browse/page.tsx` imports the same component directly. Both routes mount the identical discovery client. `/products` additionally provides server-side `Metadata` (SEO title/description) and a proper token-styled loading fallback; `/browse` is a bare client wrapper (its fallback was token-fixed in the uncommitted working tree). `/browse` is the redundant alias, not vice-versa.

---

## 5. Why `/trading` Became "Blank" — Root Cause Analysis

**Current runtime state: NOT blank.** Verified 2026-07-31:
- `GET /trading` → **200** (142,783 bytes HTML)
- All 10 sections present (What is TEM, Browse Products, Browse by City, For Sellers, For Buyers, RFQ Marketplace Flow, Secure Trading, Live Stats, Why Trade on TRADINGO)
- Playwright: 0 console errors, 0 page errors, body text renders from "Skip to main content" through hero

**Historical blank-cause candidates (ordered by likelihood):**

1. **Corrupt UTF-8 bytes baked into the file (confirmed present).** `app/trading/page.tsx` permanently contains 2 U+FFFD replacement characters — line 253 renders *"How the RFQ process works ? from posting"* in the served HTML. This is the same corruption class that previously hard-broke `tradeserv/page.tsx` (raw 0x97 byte, fixed in V-1 G-5). On `next dev`/webpack the file survives as U+FFFD; on a strict toolchain (or if the byte were raw 0x80-0xBF as in the tradeserv case) the module fails to compile → **blank page**. The 2026-06-28 rewrite (`b85b3b8ed`) introduced the current form; the corrupt bytes survived the rewrite.
2. **Stale build/deploy.** The page was rewritten twice in 12 days (06-16 → 06-22 → 06-28). A stale deployed bundle missing the route, or a mid-rewrite crash, presents as blank/404.
3. **`LiveStats` is API-dependent but failure-safe** (`.catch()` → `--` placeholders) — ruled out as a crash source.
4. **Client-only white-on-dark styling at HEAD** (`text-white` on `#1D0001`) — visually dense but not blank; already token-migrated in the working tree.

**Verdict:** No functional blank exists in the current tree. The blank report matches corruption-class issue #1 (and/or a stale build) — both are now symptom-free but the corrupt bytes remain and should be cleaned.

---

## 6. Navigation Link Inventory (grep-verified, 2026-07-31)

### Links → `/browse` (16 references, all deep-page; **NOT in main nav**)
| File | Line | Context |
|---|---|---|
| `app/tradhexa/page.tsx` | 198 | engine hero CTA |
| `components/sections/BusinessCities.tsx` | 131, 147, 178 (`/browse?city=`), 243 | city cards CTA |
| `components/shared/engine-detail-page.tsx` | 128 | engine detail CTA |
| `app/sitemap/page.tsx` | 9 | sitemap entry |
| `app/compare/page.tsx` | 47, 60 | empty-compare back links |
| `app/checkout/page.tsx` | 228, 247 (fallback when no slug), 408 | checkout back links |
| `components/sections/HeroSection.tsx` | 147 | homepage hero CTA |
| `components/sections/SelectRegion.tsx` | 216 | region CTA |
| `components/sections/TradingAcrossBorders.tsx` | 269, 304 | CTA links |

### Links → `/products` (10 references; main nav + pages)
| File | Line | Context |
|---|---|---|
| `components/sections/ClaimYourGrowth.tsx` | 60 | CTA |
| `app/trading/page.tsx` | 120 | hero CTA + category cards |
| `app/city/[slug]/page.tsx` | 120 | city page CTA |
| `app/categories/[slug]/page.tsx` | 99, 127 | breadcrumb + CTA |
| `components/product/ProductDetailClient.tsx` | 361 | product detail back link |
| `app/search/search-content.tsx` | 205 | search empty CTA |
| `app/industry/[slug]/page.tsx` | 80, 136 | breadcrumb + CTA |
| `components/sections/IndiaHubs.tsx` | 108 | CTA |
| **Topbar nav** (rendered) | — | "PRODUCTS" → `/products` ✅ |

### Links → `/trading` (2 references)
| File | Line | Context |
|---|---|---|
| `components/sections/ClaimYourGrowth.tsx` | 48 | CTA |
| `app/trading/page.tsx` | 167 | **self-loop**: city chips → `/trading` ("Explore Cities" goes nowhere new) |
| **Topbar nav** (rendered) | — | "Trading" → `/trading` ✅ |

**Main nav check (Playwright, rendered topbar):** only `/products` and `/trading` appear — `/browse` has **zero** main-nav presence. SEO/sitemap, checkout, compare, and 6 homepage sections still link `/browse` (16 links).

---

## 7. Root Cause Summary

1. **`/browse` duplication** — commit `b85b3b8ed` (2026-06-28) promoted `/products` to the official discovery route and collapsed `/browse` into a same-component alias **without deleting it**. 16 deep links kept it alive.
2. **`/trading` blank reports** — no current defect; corrupt U+FFFD bytes (2) survived a double rewrite; stale-build/deploy window during the 06-16→06-28 rewrites is the likely historical cause.
3. **Minor** — `/trading` city-chips self-link (`/trading` → `/trading`); `/checkout` fallback falls back to duplicate `/browse`.

---

## 8. Recovery Plan (Audit-Only Proposal — awaits Founder approval)

### Option A — Redirect alias (minimal risk, recommended)
1. Add Next.js redirect: `/browse` → `/products` (permanent, `301`), with query passthrough (`/browse?city=x` → `/products?city=x`).
2. Delete `app/browse/page.tsx` + `app/browse/` directory.
3. Update the 16 deep links to point at `/products` (or rely on the redirect and batch-fix later).
4. Fix `/checkout` fallback (`'/browse'` → `'/products'`).

### Option B — Keep as alias
- Keep `/browse` as-is, add only the redirect for canonical SEO; defer link cleanup. (Not recommended — leaves a permanent dead twin.)

### Required follow-up (either option)
5. Clean the 2 corrupt U+FFFD bytes in `app/trading/page.tsx:253` (restore `—` em-dash).
6. Fix `/trading` self-loop: city chips → `/products?city=...` (they already map `MASTER_CITIES`).
7. Re-verify: `tsc (web)` + `next build` + Playwright smoke on `/products`, `/trading`, `/browse→/products`.

---

## 9. Files Touched by This Audit

**None.** Audit-only. Evidence: `git log` provenance, runtime HTTP + Playwright checks (temp scripts under `C:\Users\aryan\AppData\Local\Temp\opencode\`), grep inventories above.

---

## 10. Route Recovery Completion (2026-07-31, Founder APPROVE A)

### Changes Applied
1. **301 redirect** — `next.config.ts`: added `redirects()` — `/browse` → `/products` and `/browse/:path*` → `/products/:path*` (both `permanent: true`; dev serves 308, production 301). Query strings preserved (verified `/browse?city=mumbai` → `/products?city=mumbai`).
2. **Duplicate route removed** — `apps/web/app/browse/` deleted (was the 25-line wrapper around `ProductDiscoveryClient`).
3. **All 17 links updated** (`/browse` → `/products`): `tradhexa/page.tsx:198`, `BusinessCities.tsx` (×4 incl. `/browse?city=`), `engine-detail-page.tsx:128`, `sitemap/page.tsx:9`, `compare/page.tsx` (×2), `checkout/page.tsx` (×3), `HeroSection.tsx:147`, `SelectRegion.tsx:216`, `TradingAcrossBorders.tsx` (×2), `master-data.ts:1119` (sitemap entry). Zero `/browse` references remain.
4. **Checkout fallback fixed** — `checkout/page.tsx:247`: `'/browse'` → `'/products'`.
5. **UTF-8 corruption removed** — `trading/page.tsx`: U+FFFD → `—` em-dash (0 U+FFFD remaining, verified in file + rendered page).
6. **City-chip self-loop fixed** — `trading/page.tsx`: chips now `MASTER_CITIES.map(c => /products?city=${c.slug})` (10 chips verified); "Explore Cities" section view-more `viewMoreHref` `/trading` → `/products`.

### Verification
- `pnpm -C apps/web exec tsc --noEmit` → **exit 0** (0 errors)
- `pnpm -C apps/web exec next build` → **exit 0** (299 routes; `/browse` absent, `/trading` + `/products` present)
- Playwright smoke (live server): `/products` 200 ✅, `/trading` 200 ✅ (TEM E-Marketplace, 0 console errors) ✅, `/browse` → `/products` ✅, `/browse?city=mumbai` → `/products?city=mumbai` ✅, 10 city chips ✅, no U+FFFD ✅
- Remaining `href="/trading"` occurrences are **intentional entry points** (sitewide footer "eMarketplace", global `ClaimYourGrowth` CTA, `FeatureCards` "Pan-India Network" card) — not self-loops, left untouched per scope.

### Scope Discipline
- No Product Listing P0 fixes, no Product Card changes, no UI redesign. The pre-existing listing quirks (empty-state text alongside results, 404 resource) remain documented in `TRADINGO-PRODUCTS-AUDIT.md` and are **NOT** part of this recovery.

### Files Modified (7)
`apps/web/next.config.ts`, `apps/web/app/trading/page.tsx`, `apps/web/app/tradhexa/page.tsx`, `apps/web/app/sitemap/page.tsx`, `apps/web/app/compare/page.tsx`, `apps/web/app/checkout/page.tsx`, `apps/web/components/sections/BusinessCities.tsx`, `apps/web/components/shared/engine-detail-page.tsx`, `apps/web/components/sections/HeroSection.tsx`, `apps/web/components/sections/SelectRegion.tsx`, `apps/web/components/sections/TradingAcrossBorders.tsx`, `apps/web/data/master-data.ts`
**Deleted (1):** `apps/web/app/browse/page.tsx`
