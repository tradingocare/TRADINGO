# Company Profile Navigation Fix

## Root Cause

### The Problem

Clicking a company name from any product card generated a URL like `/companies/<database-UUID>` instead of `/companies/<actual-slug>`. The backend only looks up companies by the `slug` field, so these UUID-based URLs returned "Trader not found".

### Trace

```
ProductCard
  → resolveSellerInfo(product)
    → s = product.seller                     // seller object from API response
    → s.slug = undefined                     // seller object had no 'slug' field
    → s.id / s._id = "clr7xyz..."            // database UUID was used as fallback
    → seller.slug = "clr7xyz..."             // BUG: UUID passed as slug
  → SellerBadge renders
    → profileHref = /companies/clr7xyz...    // BUG: UUID in URL
  → Backend GET /v1/companies/clr7xyz...
    → prisma.company.findFirst({ where: { slug: "clr7xyz..." } })
    → No match → NotFoundException("Company not found")
    → "Trader not found"
```

### Why slug was missing

The backend API (`GET /products`, `GET /products/search`, `GET /products/:slug`) all return `seller.slug` via `normalizeProduct()` — but several frontend data pipelines did **not** forward it:

| Pipeline | Issue |
|----------|-------|
| `toProductCard()` in `products/[slug]/page.tsx:46` | Built `seller` from `p.company` but omitted `p.company?.slug` |
| `ProductCardData.seller` type in `product-card.tsx:41` | Type had no `slug` or `id` fields |
| `buildResults()` in `ProductsPageClient.tsx:42` | Manually constructed seller objects without `slug` |
| `CompareProduct.seller` type in `compare-store.ts:15` | Type had no `slug` field |
| `DiscoveryResult.seller` type in `types/discovery.ts:52` | Type had no `slug` field |

The central safety net — `resolveSellerInfo()` — then fell back to `s.id` / `s._id` (database UUIDs) as the slug, generating broken URLs.

---

## Files Modified

| File | Change | Impact |
|------|--------|--------|
| `components/shared/SellerBadge.tsx:42` | Removed `s.id` / `s._id` from slug fallback. Now checks `product?.companySlug` and `product?.company?.slug` before giving up | Prevents any UUID/ID from being used as slug |
| `components/shared/SellerBadge.tsx:78` | Removed `seller.id` fallback in `profileHref`. Only generates link when a real slug exists | Badges without slug render non-clickable (`#`) instead of broken links |
| `app/products/[slug]/page.tsx:47` | Added `id`, `slug` to seller in `toProductCard` | Product detail page now provides the real company slug |
| `components/product/product-card.tsx:42` | Added `id?`, `slug?` to `ProductCardData.seller` type | Type system now expects slug |
| `store/compare-store.ts:16` | Added `slug?` to `CompareProduct.seller` type | Compare page type includes slug |
| `types/discovery.ts:55` | Added `slug?` to `DiscoveryResult.seller` type | Discovery/search type includes slug |

---

## Link Format

**Before (broken):**
```
/companies/clr7a1b2c3d4e5f6a7b8c9d0e   ← database UUID used as slug
/companies/s-mach1                        ← master-data internal ID used as slug
```

**After (correct):**
```
/companies/precision-machining-tools-ltd   ← actual database slug
/companies/kumar-steel-industries          ← actual database slug
#                                           ← safe fallback (no link) when slug unavailable
```

---

## Verification by Page

| Page | Component | Product Data Source | `seller.slug` available? | Link |
|------|-----------|-------------------|--------------------------|------|
| **Product Detail** (`/products/[slug]`) | `products/[slug]/page.tsx` | API → `toProductCard()` | ✅ Now added from `p.company?.slug` | `/companies/<slug>` |
| **Products Listing** (`/products`) | `ProductsPageClient.tsx` → `UnifiedCard` | API (real) | ✅ `normalizeProduct()` returns `seller.slug` | `/companies/<slug>` |
| **Products Listing (fallback)** | `buildResults()` → `UnifiedCard` | Master data | ❌ No real company exists → profileHref = `#` | Safe no-link |
| **Search** (`/search?q=`) | `search-content.tsx` | API `GET /products/search` | ✅ `normalizeProduct()` returns `seller.slug` | `/companies/<slug>` |
| **Browse** (`/browse`) | `browse/page.tsx` | Master data fallback | ❌ No real company → profileHref = `#` | Safe no-link |
| **Categories** (`/categories/[slug]`) | Category detail page | API | ✅ Via `normalizeProduct()` | `/companies/<slug>` |
| **Wishlist** (`/buyer/saved-products`) | `saved-products/page.tsx` | API `GET /products/wishlist` | ✅ `seller.slug` in wishlist response | `/companies/<slug>` |
| **Compare** (`/compare`) | `compare/page.tsx` | Compare store | ✅ Now typed in `CompareProduct.seller` | `/companies/<slug>` |
| **Near Me** (`/near-me`) | `near-me-product-card.tsx` | Near Me API | ✅ `NearMeSeller.slug` present | `/companies/<slug>` |
| **Recommendations** | Various recommendation widgets | API | ✅ Via `normalizeProduct()` | `/companies/<slug>` |

---

## Summary

1. **Primary fix**: `resolveSellerInfo` no longer falls back to UUIDs/IDs as slugs. Real slugs from the API (`seller.slug`, `company.slug`, `companySlug`) are preferred; if none exist, the badge renders without a link.
2. **Data pipeline fix**: `toProductCard` now forwards `p.company?.slug` → `seller.slug`. Types updated in 3 interfaces.
3. **No backend changes needed**: The API already returns `seller.slug` via `normalizeProduct()`.
4. **Safe master-data fallback**: When real data is unavailable, badges show the company name without a broken link.
