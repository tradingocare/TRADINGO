# Seller Identity Architecture

**Status:** 🟢 LOCKED · 🟢 VERIFIED · 🟢 PRODUCTION READY  
**Last Updated:** 26 June 2026

---

## 1. Standard Seller Schema

Every seller object returned by the backend MUST conform to this schema:

```ts
interface SellerObject {
  // ── Required ──
  id:             string
  name:           string
  slug:           string
  isVerified:     boolean
  trustScore:     number

  // ── Optional ──
  logo?:           string
  city?:           string
  state?:          string
  country?:        string
  isTradgoElite?:  boolean
  gstVerified?:    boolean
  yearsActive?:    number
  avgResponseTime?: string
  ordersFulfilled?: number
}
```

This is the **only** seller response format. No other shape may be introduced.

---

## 2. API Contract

Every customer-facing product endpoint MUST return the normalized seller object nested under `product.seller`.

### Endpoints verified as compliant:

| Endpoint | Normalization Method |
|----------|---------------------|
| `GET /products` | `ProductsService.normalizeProduct()` |
| `GET /products/search` | `ProductsService.normalizeProduct()` |
| `GET /products/:slug` | `ProductsService.normalizeProduct()` |
| `GET /products/:slug/related` | `ProductsService.normalizeProduct()` |
| `GET /products/wishlist` | `WishlistService.normalizeProduct()` |
| `GET /products/near-me` | Inline mapper in `NearMeService.searchProducts()` |

### Normalization reference — `ProductsService.normalizeProduct()`:

```ts
private normalizeProduct(product: any) {
  const c = product?.company;
  if (!c) return product;
  const loc = c.locations?.[0] || {};
  return {
    ...product,
    seller: {
      id:              c.id,
      name:            c.name || 'Verified Supplier',
      slug:            c.slug,
      logo:            c.logo || undefined,
      city:            loc.city || undefined,
      state:           loc.state || undefined,
      isVerified:      c.verificationLevel !== 'LEVEL_0' && c.verificationLevel != null,
      isTradgoElite:   !!(c as any).isTradgoElite,
      trustScore:      c.trustScore || 0,
      yearsActive:     (c as any).yearsActive || undefined,
      avgResponseTime: c.responseRate ? `< ${c.responseRate}` : undefined,
      ordersFulfilled: (c as any).totalProducts || undefined,
      gstVerified:     !!c.gstNumber,
    },
  };
}
```

### Prisma includes required for normalization:

```ts
company: {
  select: {
    id: true, name: true, slug: true, logo: true,
    trustScore: true, verificationLevel: true,
    responseRate: true, gstNumber: true,
    locations: {
      where: { isPrimary: true },
      select: { city: true, state: true },
      take: 1,
    },
  },
},
```

Every product query that returns customer-facing data **must** include this company select.

---

## 3. Component Hierarchy

```
SellerBadge (shared component)
├── props: SellerInfo, size, showLocation, showStats, showLogo, linkToProfile, className
├── resolveSellerInfo(product) — adapter that extracts seller from any product shape
│   - Checks: product.seller → product.vendor → product.company → product.supplierInfo → {}
│   - Normalizes all field naming conventions into SellerInfo
└── Renders: logo, name, verified badge, elite badge, location, stats

Product Cards that CONTAIN SellerBadge:
├── components/product/product-card.tsx         ← <SellerBadge seller={resolveSellerInfo(product)} />
├── components/discovery/ProductCard.tsx         ← <SellerBadge seller={resolveSellerInfo(product)} />
├── components/discovery/UnifiedCard.tsx         ← <SellerBadge seller={resolveSellerInfo(product)} />
└── components/near-me/near-me-product-card.tsx  ← <SellerBadge seller={resolveSellerInfo(product)} />

Pages that DIRECTLY render SellerBadge:
├── app/products/[slug]/page.tsx            ← Product Details
├── app/search/search-content.tsx           ← Search Results
├── app/compare/page.tsx                    ← Compare (in table)
└── app/buyer/saved-products/page.tsx       ← Wishlist
```

### Rule:
Every product-rendering component **must** reuse `SellerBadge`.  
No alternative seller UI component may be created.

---

## 4. Integration Points

| Integration | How SellerBadge is Included | File |
|-------------|----------------------------|------|
| Homepage | N/A (marketing, no product cards) | `app/page.tsx` |
| Product Listing (`/products`) | Via `<UnifiedCard>` | `app/products/ProductsPageClient.tsx` |
| Product Detail (`/products/[slug]`) | Direct `<SellerBadge>` | `app/products/[slug]/page.tsx` |
| Search (`/search`) | Direct `<SellerBadge>` in `SearchContent` | `app/search/search-content.tsx` |
| Browse (`/browse`) | Via `<ProductCard>` | `app/browse/page.tsx` |
| Categories (`/categories/[slug]`) | Via `<ProductCard>` | `app/categories/[slug]/page.tsx` |
| Near Me (`/buyer/near-me`) | Via `<NearMeProductCard>` | `buyer/near-me/page.tsx` |
| Compare (`/compare`) | Direct `<SellerBadge>` in table row | `app/compare/page.tsx` |
| Wishlist / Saved Products (`/buyer/saved-products`) | Direct `<SellerBadge>` | `buyer/saved-products/page.tsx` |
| Related Products | Via `<ProductCard>` in `RelatedProducts` | `components/product/related-products.tsx` |
| Company Profile (`/companies/[slug]`) | N/A (company-level, not product-level) | `companies/[slug]/CompanyProfileClient.tsx` |

---

## 5. Backend Normalization Rules

1. **Every** customer-facing product endpoint must normalize seller data
2. The `normalizeProduct()` method is the single source of truth
3. The `seller` field is constructed from the `company` relation, **never** from product-level fields
4. Company locations are resolved from the primary location only
5. Raw SQL queries (NearMe) must construct the seller object inline with the same shape
6. Bestseller/trending/near-me-top endpoints return snapshot data and are exempt (they are analytics, not product display)

### Adding a new endpoint:
```ts
// 1. Include company data in the Prisma query
include: {
  company: { select: { /* see section 2 */ } },
}

// 2. Call normalizeProduct on each result
return data.map(p => this.normalizeProduct(p));
```

---

## 6. Frontend Rendering Rules

1. Import `SellerBadge` and `resolveSellerInfo` from `@/components/shared/SellerBadge`
2. Always use `resolveSellerInfo(product)` to extract seller data — never access `product.seller` directly
3. Pass the result to the `<SellerBadge>` component
4. Do NOT create wrapper components or alternative seller cards

### Standard usage:
```tsx
import SellerBadge, { resolveSellerInfo } from '@/components/shared/SellerBadge'

<SellerBadge
  seller={resolveSellerInfo(product)}
  size="xs"           // xs | sm | md
  showLocation={true}
  showStats={false}
  showLogo={true}
  linkToProfile={true}
  className=""
/>
```

---

## 7. SellerInfo Interface (frontend type)

```ts
interface SellerInfo {
  id?:             string
  name?:           string
  slug?:           string
  logo?:           string
  city?:           string
  state?:          string
  isVerified?:     boolean
  isTradgoElite?:  boolean
  trustScore?:     number
  yearsActive?:    number
  avgResponseTime?: string
  ordersFulfilled?: number
  gstVerified?:    boolean
}
```

Defined in: `components/shared/SellerBadge.tsx`

---

## 8. Field Mapping (resolveSellerInfo)

The `resolveSellerInfo` function normalizes multiple naming conventions into `SellerInfo`:

| SellerInfo Field | Sources (in priority order) |
|-----------------|-----------------------------|
| `id` | `s.id` → `s._id` → `product.vendorId` → `product.sellerId` |
| `name` | `s.businessName` → `s.companyName` → `s.name` → `s.tradeName` → `product.companyName` → `product.sellerName` → `product.vendorName` → `'Verified Supplier'` |
| `slug` | `s.slug` → `s.id` → `s._id` → `product.companySlug` |
| `logo` | `s.logo` → `s.logoUrl` → `s.profileImage` |
| `city` | `loc.city` → `s.city` → `product.city` |
| `state` | `loc.state` → `s.state` → `product.state` |
| `isVerified` | `s.isVerified` → `s.kycVerified` → `false` |
| `isTradgoElite` | `s.isTradgoElite` → `s.tradgoElite` → `s.isElite` → `false` |
| `trustScore` | `s.trustScore` → `s.trust_score` → `0` |
| `yearsActive` | `s.yearsActive` → `s.yearsOnPlatform` |
| `avgResponseTime` | `s.avgResponseTime` → `s.responseTime` → `s.responseRate` (formatted) |
| `ordersFulfilled` | `s.ordersFulfilled` → `s.ordersCount` → `s.totalProducts` |
| `gstVerified` | `s.gstVerified` → `!!s.gstNumber` |

---

## 9. Extension Guidelines

### Adding a new page that displays products:
1. Use one of the existing product card components (`ProductCard`, `UnifiedCard`, `NearMeProductCard`)
2. These components already include `SellerBadge`
3. If using a custom layout, import `SellerBadge` directly
4. Never build a new seller display component

### Adding a new backend endpoint that returns products:
1. Include company data in the Prisma `include`/`select`
2. Call `normalizeProduct()` on each result
3. Return the normalized `seller` object in the response

### Adding a new seller field:
1. Add the field to the Prisma `Company` model (if needed)
2. Add it to the `normalizeProduct()` mapper in the backend
3. Add it to `SellerInfo` interface in `SellerBadge.tsx`
4. Add it to `resolveSellerInfo()` with appropriate fallback chain
5. Add rendering logic in `<SellerBadge>` component

### When the company data is stored differently (raw SQL, search index, etc.):
1. Query the same company columns
2. Construct the `seller` object with the same field names
3. Follow the pattern in `NearMeService.searchProducts()`

---

## 10. Architecture Diagram (Logical)

```
[Product API] ──normalizeProduct()──> { ...product, seller: {...} }
                                          │
                                          ▼
[Frontend API Layer] ── receives typed response with seller
                                          │
                                          ▼
[resolveSellerInfo(product)] ── extracts/normalizes into SellerInfo
                                          │
                                          ▼
[<SellerBadge seller={SellerInfo} />] ── renders seller identity UI
```

---

## Ownership

- **Component:** `components/shared/SellerBadge.tsx`
- **Adapter:** `resolveSellerInfo()` in same file
- **Backend normalizer:** `ProductsService.normalizeProduct()`
- **Backend wishlist normalizer:** `WishlistService.normalizeProduct()`
- **NearMe normalizer:** Inline in `NearMeService.searchProducts()`
- **Types (frontend):** `SellerInfo` in `SellerBadge.tsx`, `NearMeSeller` in `lib/api/near-me.ts`, `WishlistItem` in `lib/api/products.ts`
