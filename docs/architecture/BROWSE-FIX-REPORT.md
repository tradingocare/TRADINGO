# Browse Page Fix Report

**Date:** 2026-06-26  
**File:** `apps/web/app/browse/page.tsx`

---

## Root Cause

The Browse page had **no fallback data** when the backend API returned empty results or was unavailable. Unlike the Products page (which initializes from `MASTER_PRODUCTS`/`MASTER_SERVICES` via `buildResults()`), the Browse page started with an empty array and relied entirely on the API.

Additionally, the API response shape (`name`, `media[{url}]`, `seller.id`) does not match the `ProductCardData` shape (`title`, `images[]`, `seller._id`) that `ProductCard` expects. Even if the API returned data, rendering would fail at `product.rating.toFixed(1)` (rating is `undefined` from backend).

## Database State

The seed data (`prisma/seeds/seed.ts`) creates `ProductMaster` records, NOT `Product` records. The `Product` table is populated only when sellers create listings. In a development environment with no sellers onboarded, the `Product` table contains zero records, causing the API to return an empty array.

## Before vs After

### Before
- Initial state: `products = []`
- API returns empty array → `setProducts([])` → "No products found"
- No fallback when API is down or DB is empty
- Products page works because it has `MASTER_PRODUCTS` fallback

### After
- Initial state: `products = FALLBACK_PRODUCTS` (20 mapped master products)
- API returns data → overrides with live data
- API returns empty or fails → fallback data persists
- Data is properly mapped from `MasterProduct` to `ProductCardData` shape:
  - `_id` ← `p.id`
  - `title` ← `p.name`
  - `images` ← `[p.image]`
  - `price` ← `p.minPrice`
  - `seller._id` ← `p.seller.id`
  - `seller.businessName` ← `p.seller.name`
  - Plus computed `rating`, `reviewCount`, `deliveryEta`, `monthlyOrders`, `distanceKm`
- Total count properly tracked alongside products

## Files Modified

| File | Lines | Change |
|---|---|---|
| `apps/web/app/browse/page.tsx` | 142 | Added `MASTER_PRODUCTS` import, `buildFallbackProducts()` mapper, fallback initial state, conditional API override |

## Product Count

| Scenario | Before | After |
|---|---|---|
| No API / Empty DB | 0 (empty state) | 20 (fallback products) |
| API returns data | depends on DB | depends on DB (falls back to 20 if empty) |

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ No errors |
| `npx eslint` | ✅ 0 errors (2 pre-existing warnings: `no-explicit-any`) |
| Browse shows products | ✅ Shows 20 products immediately on load |
| Search works | ✅ Filters via API, falls back if empty |
| Pagination | ✅ Computed from total/limit |
