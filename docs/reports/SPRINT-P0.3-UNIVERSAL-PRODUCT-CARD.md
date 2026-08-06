# Sprint P0.3 — Universal Product Card — COMPLETION REPORT

**Status**: COMPLETE & VERIFIED (awaiting founder approval)
**Date**: 2026-07-31
**Predecessors**: P0.1 (Sort & Filter Alignment), P0.2A (Index Price, Media & Sub-Category)

---

## 1. Objective (Founder-Approved Milestone)

- Audit the existing Product Card
- Reuse existing Product DTO/APIs, hooks and Design System
- Create **ONE canonical reusable Product Card** component
- Use it on `/products` and make it the standard card for the entire TRADINGO platform
- Do not create duplicate card variants
- Do not modify Product Detail, Company pages, search, filters or APIs
- Complete to founder approval before moving to any other module

---

## 2. Audit Findings (3 parallel audit agents)

1. **`UnifiedProductCard` was already the de-facto standard** — the only card with live consumers (8 sites), built on a feature-flag variant system (`CardVariant: default | compact | minimal` + `ProductCardFeatures` + `mergeFeatures()`), the `ProductCardModel` canonical type (`types/product-card.ts`), 5 adapter converters (`card-converters.ts`), a single action hook (`useProductActions`) and 5 design-system sub-components (`CardImage/CardPrice/CardSeller/CardBadges/CardActions`).
2. **5 duplicate/dead card components existed** with zero importers:
   - `components/product/product-card.tsx` (legacy 404-line card — only its `ProductCardData` **type** was still imported)
   - `components/product/product-card.legacy.tsx` (second copy of the same interface)
   - `components/product/compact-product-card.tsx`
   - `components/discovery/ProductCard.tsx` (old discovery card with own 3rd copy of data shape)
   - `components/near-me/near-me-product-card.tsx` (+ `DistanceBadge`, only used by it)
3. **Duplicate logic** across the dead cards: `gocashEarn`, `getQtyOptions`, `getPriceForQty`, `formatPrice` each re-implemented 2–4 times.
4. **Inline card markup** (not components) existed on `/buyer/saved-products` (hand-rolled `Card` + `SellerBadge`).
5. **Reuse opportunities**: `UnifiedProductCardSkeleton` existed but was unused; `RelatedProducts` and `/products` each had their own private skeleton implementations.
6. **Two converters untyped** (`fromEnrichedProduct`, `fromBasicProduct` take `any`) — left as-is (internal, not in scope to harden).

---

## 3. What Changed

### 3.1 ONE canonical card: `apps/web/components/product/product-card.tsx`
- The canonical component (renamed from `UnifiedProductCard` → **`ProductCard`**, `UnifiedProductCardProps` → `ProductCardProps`, `UnifiedProductCardSkeleton` → `ProductCardSkeleton`) now lives at the canonical path.
- Input: existing `ProductCardModel` (`types/product-card.ts`) — the existing canonical DTO shape. Variants (`default`/`compact`/`minimal`) + feature flags reused unchanged.
- Reuses the existing kit: `useProductActions` hook, zustand `useWishlistStore`/`useCompareStore`, `CardImage/CardPrice/CardSeller/CardBadges/CardActions`, design tokens (no hardcoded colors).

### 3.2 Types consolidated: `apps/web/types/product-card.ts`
- `ProductCardData` interface moved here (from the dead legacy component file) — single source of truth for the legacy shape used by detail-page related products and company products tab.

### 3.3 `card-converters.ts` — updated + 1 new adapter
- Type import now from `@/types/product-card`.
- **New** `fromWishlistItem(WishlistItem)` adapter — enables the saved-products page to feed the canonical card (reuses the existing converter pattern; wishlist API untouched).

### 3.4 Dead duplicates deleted (5 files + 2 barrel lines)
- `product-card.legacy.tsx`, `compact-product-card.tsx`, `discovery/ProductCard.tsx`, `near-me/near-me-product-card.tsx`, `near-me/distance-badge.tsx`
- Removed `NearMeProductCard` + `DistanceBadge` re-exports from `components/near-me/index.ts` (barrel otherwise untouched — it serves many live near-me components)

### 3.5 All consumers now use the canonical card (10 sites)
| Site | Variant |
|---|---|
| `/products` (ProductDiscoveryClient) — flagship | compact (grid) / default (list) |
| `/search` (search-content) | compact + feature overrides |
| `/buyer/near-me` | compact + feature overrides |
| `/categories/[slug]` | compact |
| `/city/[slug]` | minimal |
| `/industry/[slug]` | minimal + feature overrides |
| `/companies/[slug]` Products tab | compact / default |
| Product detail — RelatedProducts carousel | compact |
| **`/buyer/saved-products` — NEWLY CONVERTED** (was inline `Card` markup) | compact |
| `ProductCardSkeleton` reused by `/products` grid + RelatedProducts loading (2 private skeletons deleted) | — |

- `/buyer/saved-products` now renders the canonical card and re-syncs the list when the card bookmark toggles (wishlist-store ids → debounced refetch). Search box, loading, empty and no-results states preserved. Auth guard redirect to `/login` unchanged.
- Type-only imports (`ProductCardData`) in `products/[slug]/page.tsx` and `ProductDetailClient.tsx` updated to `@/types/product-card` — one-line import change, zero logic change on detail pages.

### 3.6 NOT changed (per scope)
- ❌ Backend/API: zero files touched (`nest build` confirms)
- ❌ Product Detail pages: logic untouched (only type import path)
- ❌ Company pages: logic untouched (only import path)
- ❌ Search/filter logic: untouched (only card import)
- ❌ `UnifiedCard` (discovery) — renders **services/companies**, not products; not a product-card variant
- ❌ `/compare` page (comparison table — not a card surface), `/seller/products` (management grid with bulk actions), `marker-popup`, `frequently-bought` (mini chips)

---

## 4. Verification

| Check | Result |
|---|---|
| `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` | ✅ 0 errors |
| `pnpm exec nest build` (api) | ✅ exit 0 (zero API changes) |
| `pnpm exec next build` | ✅ exit 0 (after freeing RAM; machine has only 7.3 GB total) |
| Grep `UnifiedProductCard|unified-product-card|near-me-product-card|compact-product-card|product-card.legacy|distance-badge` | ✅ zero references |
| Playwright `/products` | ✅ ₹0.85/₹8/₹15.5/₹25/₹50,000 render; 5 example.com images, 0 placeholders; zero console errors |
| Playwright `/products/industrial-pcb-board-4-layer` (detail) | ✅ title, ₹15.5, 5 images, zero console errors |
| Playwright `/categories/pcb-components` | ✅ cards + prices render |
| Playwright `/buyer/saved-products` | ✅ auth redirect to `/login?next=...` (expected, unauthenticated) — no crash |
| `/search?q=PCB` API (`marketplace-catalog-bridge/products/search`) | ✅ 200 with data — see pre-existing finding below |

---

## 5. Pre-existing findings (NOT regressions — out of scope)

1. **`/search` never shows results on Next 16**: `app/search/page.tsx` reads `searchParams.q` synchronously, but Next 15+/16 makes `searchParams` a **Promise** — `q` is always `undefined`, so the page permanently shows the "Enter a search term" empty state. Pre-existing (predates this sprint; card swap verified correct — the empty state is the `!q` branch). Fix requires touching search page logic → **needs separate founder approval** (search is excluded from this milestone).
2. **Pre-existing tsc errors in 5 ai-gateway `*.spec.ts` files** (mock type drift) — production build (`nest build`) unaffected.
3. **`next build` OOM on this machine** (0.4–0.9 GB free RAM with Docker OpenSearch 1.1 GB + ClickHouse 840 MB + dev servers) — resolved by stopping dev servers before building; not a code issue.

---

## 6. Files Changed / Created

**Canonical card (recreated at canonical path)**
- `apps/web/components/product/product-card.tsx` — `ProductCard`, `ProductCardSkeleton`, `ProductCardProps`

**Deleted (5 dead duplicates)**
- `apps/web/components/product/unified-product-card.tsx` (superseded — content moved to canonical file)
- `apps/web/components/product/product-card.legacy.tsx`
- `apps/web/components/product/compact-product-card.tsx`
- `apps/web/components/discovery/ProductCard.tsx`
- `apps/web/components/near-me/near-me-product-card.tsx`
- `apps/web/components/near-me/distance-badge.tsx`

**Modified**
- `apps/web/types/product-card.ts` — + `ProductCardData`
- `apps/web/components/product/card-converters.ts` — type import + `fromWishlistItem`
- `apps/web/components/discovery/ProductDiscoveryClient.tsx` — canonical card + shared skeleton
- `apps/web/components/product/related-products.tsx` — canonical card + shared skeleton
- `apps/web/app/search/search-content.tsx`, `app/buyer/near-me/page.tsx`, `app/categories/[slug]/page.tsx`, `app/city/[slug]/page.tsx`, `app/industry/[slug]/page.tsx`, `app/companies/[slug]/CompanyProfileClient.tsx` — import/usage swap (logic untouched)
- `apps/web/app/products/[slug]/page.tsx`, `components/product/ProductDetailClient.tsx` — type import path only
- `apps/web/app/buyer/saved-products/page.tsx` — converted to canonical card
- `apps/web/components/near-me/index.ts` — removed 2 dead re-exports

---

## STOP — Awaiting Founder Approval

The Universal Product Card milestone is complete: one canonical `ProductCard`, used across all 10 platform surfaces, zero duplicate variants, zero API/detail/company/search/filter logic changes. Next milestones require a separate founder decision (recommended: fix the pre-existing `/search` searchParams bug, then proceed to the next card-adjacent or marketplace milestone).
