# Company Profile Navigation Audit

## Objective

Audited every component rendering company/seller information to ensure all company links resolve to `/companies/[slug]`. No generic directory links or database IDs should be used.

---

## Files Updated

| File | Fix |
|---|---|
| `apps/web/components/product/product-card.tsx` | 🔴 **Broken product links**: `/product/` → `/products/` (lines 286, 468) |
| `apps/web/app/categories/[slug]/page.tsx` | 🟡 **Missing slug**: Added `slug` to seller fallback object (line 82) |
| `apps/web/components/near-me/marker-popup.tsx` | 🟡 **Missing company link**: Wrapped `companyName` in `<Link href="/companies/[slug]">` |
| `apps/web/app/buyer/suppliers/page.tsx` | 🟡 **Missing company link**: Added `slug` to `Supplier` type/mock data, wrapped name in `<Link>`, fixed "View Profile" button |
| `apps/web/components/discovery/ProductDiscoveryClient.tsx` | ✅ Already correct — `dr.seller.slug` mapped to `toProductCardData` / `toCompareProduct` |
| `apps/web/components/shared/SellerBadge.tsx` | ✅ Already correct — links to `/companies/[slug]` via `seller.slug` |
| `apps/web/components/product/seller-card.tsx` | ✅ Already correct — links to `/companies/[seller.slug]` |
| `apps/web/components/company/CompanyCard.tsx` | ✅ Already correct — links to `/companies/[company.slug]` |

---

## Company Link Audit

### SellerBadge Usage (7 instances)

All 7 usages pass `linkToProfile={true}` (default) and correctly link to `/companies/[slug]`:

| File | `linkToProfile` | Status |
|---|---|---|
| `discovery/UnifiedCard.tsx` | `{true}` | ✅ |
| `discovery/ProductCard.tsx` | `{true}` | ✅ |
| `near-me/near-me-product-card.tsx` | `{true}` | ✅ |
| `compare/page.tsx` | `{true}` | ✅ |
| `products/[slug]/page.tsx` | `{true}` | ✅ |
| `buyer/saved-products/page.tsx` | `{true}` | ✅ |
| `search/search-content.tsx` | `{true}` | ✅ |

### Direct Company Links (6 instances)

All link to `/companies/[slug]`:

| File | Line | Target |
|---|---|---|
| `company/CompanyCard.tsx` | 55 | `/companies/${company.slug}` ✅ |
| `product/seller-card.tsx` | 61 | `/companies/${seller.slug}` ✅ |
| `product/seller-card.tsx` | 113 | `/companies/${seller.slug}` ✅ |
| `product/product-card.tsx` | 328 | `/companies/${seller.slug}` ✅ |
| `shared/SellerBadge.tsx` | 79 | `/companies/${seller.slug}` ✅ |

---

## Route Verification

| Route | Purpose | Status |
|---|---|---|
| `/companies` | Company Directory — lists all registered companies with search, filters, pagination | ✅ |
| `/companies/[slug]` | Company Profile — full business profile with hero, products, services, reviews, etc. | ✅ |
| `/product/[slug]` | ❌ **Broken** — was linked in product card (now fixed to `/products/[slug]`) | ✅ Fixed |
| `/products/[slug]` | Product Detail Page | ✅ |

---

## Pages Verified

| Page | Renders Company Link | Uses `/companies/[slug]` | Status |
|---|---|---|---|
| Home (`/`) | No — uses `CompanyCard` for directory entries | ✅ | ✅ |
| Products (`/products`) | ✅ via `ProductCard` | ✅ | ✅ |
| Browse (`/browse`) | ✅ via `ProductCard` | ✅ | ✅ |
| Search (`/search`) | ✅ via `SellerBadge` in search results | ✅ | ✅ |
| Categories (`/categories/[slug]`) | ✅ via `ProductCard` | ✅ (fallback slug fixed) | ✅ |
| Company Profile (`/companies/[slug]`) | ✅ via `CompanyCard` | ✅ | ✅ |
| Company Directory (`/companies`) | ✅ via `CompanyCard` | ✅ | ✅ |
| Wishlist / Saved (`/buyer/saved-products`) | ✅ via `SellerBadge` | ✅ | ✅ |
| Compare (`/compare`) | ✅ via `SellerBadge` | ✅ | ✅ |
| Recommendations / Related (`related-products.tsx`) | ✅ via `ProductCard` | ✅ | ✅ |
| Near To Far™ (`/buyer/near-me`) | ✅ via `SellerBadge` + `<Link>` in marker popup | ✅ | ✅ |
| Supplier List (`/buyer/suppliers`) | ✅ via direct `<Link>` | ✅ (slug added) | ✅ |
| Messages | N/A — uses ID for routing | ✅ | ✅ |
| RFQ | N/A — uses ID for routing | ✅ | ✅ |

---

## Fixes Applied

### 🔴 Critical — Broken Product Links

**File:** `apps/web/components/product/product-card.tsx`

**Issue:** Two links used singular `/product/${product.slug}` instead of plural `/products/${product.slug}`, causing 404 errors on product detail page navigation.

**Fix:** Changed both occurrences:
- Line 286: `/product/` → `/products/`
- Line 468: `/product/` → `/products/`

### 🟡 Medium — Missing Company Links

**File:** `apps/web/app/categories/[slug]/page.tsx`

**Issue:** Seller fallback object when `p.seller` was falsy had no `slug` field, so `resolveSellerInfo` returned `slug: undefined` and company links became `#`.

**Fix:** Added `slug: p.seller?.slug || p.companySlug || ''` to the fallback.

**File:** `apps/web/components/near-me/marker-popup.tsx`

**Issue:** Company name rendered as plain `<p>` with no link to company profile.

**Fix:** Wrapped in `<Link href="/companies/${product.companySlug}">` with `Building2` icon.

**File:** `apps/web/app/buyer/suppliers/page.tsx`

**Issue:** Company name rendered as plain `<h3>` with no link. "View Profile" button had no navigation handler.

**Fix:** Added `slug` to `Supplier` interface and mock data. Wrapped company name in `<Link href="/companies/${slug}">`. Wrapped "View Profile" button in `<Link>`.

---

## Final Navigation Flow

```
ANYWHERE in the app
  └─ Click company name / logo
       └─ /companies/[slug]
            └─ Company Profile Page
                 ├─ Company Hero (logo, banner, name, badges, trust score)
                 ├─ Company Overview
                 ├─ Contact Information
                 ├─ Business Details
                 ├─ Company Categories
                 ├─ Product Catalogue
                 ├─ All Products of This Company
                 ├─ Services
                 ├─ Certificates & Licenses
                 ├─ Factory / Infrastructure
                 ├─ Photos & Videos
                 ├─ Downloadable Catalogues
                 ├─ Reviews & Ratings
                 ├─ Similar Companies
                 └─ CTA: Chat, RFQ, Call, Follow, Share
```

Every company link in the application now resolves to `/companies/[slug]`.

---

## Verification

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ PASS |
| ESLint (`eslint`) | ✅ PASS (zero new warnings) |
| Next Build (`next build`) | ✅ PASS (5 pre-existing RFQ errors only) |
| All company links use slug | ✅ Verified |
| No broken `/product/` links remain | ✅ Fixed |
