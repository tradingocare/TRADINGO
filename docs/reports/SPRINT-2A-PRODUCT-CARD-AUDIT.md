# Sprint 2A — Universal Product Card: Audit & Plan

## 1. Component Inventory

### Active Product Card Components (render product data)

| # | File | Component | Lines | `memo`d | Reused By |
|---|------|-----------|-------|---------|-----------|
| 1 | `components/product/product-card.tsx` | `ProductCard` | 405 | ✅ | ProductDiscoveryClient (list view), CompanyProfileClient |
| 2 | `components/product/compact-product-card.tsx` | `CompactProductCard` | 208 | ✅ | ProductDiscoveryClient (grid view), related-products, categories/[slug] |
| 3 | `components/near-me/near-me-product-card.tsx` | `NearMeProductCard` | 104 | ❌ | buyer/near-me page |
| 4 | `components/discovery/UnifiedCard.tsx` | `UnifiedCard` | 288 | ✅ | ProductDiscoveryClient (non-product items) |

### Dead/Unused Components (zero imports)
| # | File | Component | Lines | Notes |
|---|------|-----------|-------|-------|
| 5 | `components/discovery/ProductCard.tsx` | `ProductCard` (re-export) | 489 | Dead — completely unused |
| 6 | `components/product/product-card.legacy.tsx` | `ProductCard` (legacy) | 413 | Dead — kept for backward compat, zero imports |

### Inline Product Card Renderings (need migration)
| # | File | Context | Lines of JSX | Complexity |
|---|------|---------|-------------|------------|
| 7 | `app/search/search-content.tsx` | Search results page | ~75 lines of inline card | High — has brand, catalog category, stock badge, trust score |
| 8 | `app/city/[slug]/page.tsx` | City page top products | ~30 lines inline | Low — basic image, name, company, price |
| 9 | `app/industry/[slug]/page.tsx` | Industry page products | ~25 lines inline | Low — basic image, name, price, category badge, stock |

---

## 2. Duplicate Logic Analysis

### A. Type Interfaces — 4 conflicting product card data shapes

| Interface | Defined In | Fields | Used By |
|-----------|-----------|--------|---------|
| `ProductCardData` | `product-card.tsx:19` | 35 fields (seller sub-object with 12 fields) | ProductCard, CompactProductCard, ProductDiscoveryClient, CompanyProfileClient, related-products, ProductDetailClient |
| `DiscoveryResult` | `types/discovery.ts:33` | 25 fields (seller sub-object) | ProductDiscoveryClient, UnifiedCard, FilterSidebar, SearchBar |
| `NearMeProduct` | `lib/api/near-me.ts` | 18 fields (NearMeSeller sub-object) | NearMeProductCard |
| `Product` (CRUD) | `lib/api/types.ts` | ~12 fields | Admin/Seller CRUD pages, useProducts hook |

**Overlap analysis:**
- `ProductCardData` and `DiscoveryResult` share 80% of fields (id, name, slug, images, price, rating, reviewCount, seller name/trust/verified).
- `DiscoveryResult` has geo/type fields (`geoRing`, `distanceKm`, `type`) that `ProductCardData` lacks.
- `ProductCardData` has richer commerce fields (`priceSlabs`, `specifications`, `seller.isGstRegistered`, `moq`, `deliveryEta`) that `DiscoveryResult` also has but as optional.
- `NearMeProduct` overlaps with `ProductCardData` on ~60% of fields, adds `productId`, `distanceLabel`, `isTradgo`.
- **Verdict:** A single `UnifiedProductCardData` type can cover all 4 with optional fields.

### B. Duplicated Helper Functions

| Helper | product-card.tsx | compact-product-card.tsx | NearMeProductCard |
|--------|-----------------|------------------------|-------------------|
| `resolveSellerInfo()` | ✅ (via SellerBadge import) | ✅ (via SellerBadge import) | ✅ (via SellerBadge import) |
| `gocashEarn()` | ✅ (inline) | ❌ | ❌ |
| `getQtyOptions()` | ✅ (inline) | ❌ | ❌ |
| `getPriceForQty()` | ✅ (inline) | ❌ | ❌ |
| `getGeoChip()` | ✅ (inline) | ❌ | ❌ |
| `formatPrice()` | ✅ (inline) | ❌ | ❌ |
| `requireAuth()` pattern | ✅ (inline) | ✅ (inline duplicate) | ❌ |
| `handleSave()` | ✅ (inline) | ✅ (inline duplicate) | ❌ |
| `handleCompare()` | ✅ (inline) | ✅ (inline duplicate) | ❌ |
| `handleChat()` | ✅ (inline) | ✅ (inline duplicate) | ❌ |
| `handleRFQ()` | ✅ (inline) | ✅ (inline duplicate) | ❌ |
| `handleBuyNow()` | ✅ (inline) | ✅ (inline duplicate) | ❌ |

**Verdict:** 12 duplicated functions across 2 components. These should be extracted into a shared `useProductActions()` hook.

### C. UI Pattern Duplication

| UI Pattern | product-card.tsx | compact-product-card.tsx | inline search | inline city | inline industry |
|-----------|-----------------|------------------------|---------------|-------------|----------------|
| Image gallery + arrows | ✅ | ✅ | ❌ | ❌ | ❌ |
| Save/Bookmark button | ✅ (positioned absolute) | ✅ (positioned absolute) | ❌ | ❌ | ❌ |
| Discount badge | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bestseller badge | ✅ | ❌ | ❌ | ❌ | ❌ |
| VerifiedBadge | ✅ | ✅ | ❌ | ❌ | ❌ |
| Price display | ✅ | ✅ | ✅ | ✅ | ✅ |
| Unit display | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rating + review count | ✅ | ✅ | ❌ | ❌ | ❌ |
| MOQ display | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delivery ETA | ✅ | ❌ | ❌ | ❌ | ❌ |
| Stock badge | ✅ | ❌ | ✅ | ❌ | ✅ |
| SellerBadge | ✅ | ✅ | ✅ | ❌ | ❌ |
| Company name | ✅ | ✅ | ❌ | ✅ | ❌ |
| Location/Geo chip | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quantity pricing grid | ✅ | ❌ | ❌ | ❌ | ❌ |
| GOCASH reward | ✅ | ❌ | ❌ | ❌ | ❌ |
| Action buttons (Buy/RFQ/Chat/Save/Compare) | ✅ (6 buttons) | ✅ (5 icon buttons) | ❌ | ❌ | ❌ |
| Category badge | ✅ (text) | ❌ | ✅ (catalog + category) | ❌ | ✅ |
| TrustScore badge | ❌ | ❌ | ✅ | ❌ | ❌ |
| Product brand | ❌ | ❌ | ✅ | ❌ | ❌ |

**Verdict:** 20+ UI elements spread across 6 rendering contexts. No single component covers more than 14/20.

---

## 3. Existing Shared Components Available for Reuse

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `VerifiedBadge` | `components/shared/VerifiedBadge.tsx` | 5 verification badge types | ✅ Ready |
| `SellerBadge` | `components/shared/SellerBadge.tsx` | Seller identity display | ✅ Ready |
| `Card` + `CardContent` | `components/ui/card.tsx` | Base UI card primitive | ✅ Ready |
| `DistanceBadge` | `components/near-me/distance-badge.tsx` | Geo distance label | ✅ Ready |
| `useCompareStore` | `store/compare-store.ts` | Compare state management | ✅ Ready |
| `useWishlistStore` | `store/wishlist-store.ts` | Wishlist state management | ✅ Ready |
| `useAuthStore` | `store/auth-store.ts` | Auth state | ✅ Ready |
| `toast` | `components/ui/use-toast.ts` | Toast notifications | ✅ Ready |

---

## 4. Proposed Architecture: `UnifiedProductCard`

### Data Model

Consolidate all 4 product card interfaces into one:

```typescript
export interface UnifiedProductCardData {
  // Identity
  id: string
  slug: string
  title: string
  images: string[]
  videoUrl?: string

  // Classification
  categoryName: string
  subCategory?: string
  brand?: string
  type?: 'product' | 'service'

  // Pricing
  price: number
  originalPrice?: number
  unit: string
  moq: number
  maxOrderQty?: number
  priceSlabs?: { minQty: number; maxQty: number | null; price: number }[]

  // Seller
  seller: {
    id: string
    name: string
    slug?: string
    isVerified: boolean
    trustScore: number
    isTradgoElite?: boolean
    city: string
    avgResponseTime?: string
  }

  // Rating & Social Proof
  rating: number
  reviewCount: number
  monthlyOrders?: number
  isBestseller?: boolean

  // Logistics
  inStock: boolean
  stockQty?: number
  deliveryEta?: string

  // Geo
  distanceKm?: number
  geoLabel?: string

  // Rewards
  gocashEarn?: number

  // Extras
  trustScoreSnapshot?: number
}
```

### Component Variants (single component, `variant` prop)

```typescript
type CardVariant = 'list' | 'grid' | 'compact' | 'search' | 'nearme' | 'minimal'
```

| Variant | Layout | Image size | Details shown | Use case |
|---------|--------|-----------|---------------|----------|
| `list` | Horizontal (img left, content right) | 35% width, full height | All fields, quantity grid, 6 action buttons | Discovery list view, company profile |
| `grid` | Vertical stack | 4:3 aspect ratio | Title, price, rating, MOQ, seller, 5 icon buttons | Discovery grid view, categories |
| `compact` | Vertical stack | 4:3 aspect ratio | Title, price, rating, MOQ, seller, 5 icon buttons | Related products horizontal scroller |
| `search` | Vertical stack, hover lift | 4:3 aspect ratio | Brand, catalog category, stock badge, trust score, seller | Search results page |
| `nearme` | Horizontal, distance badge | 96px square | Name, price, distance, seller, delivery ETA | Near-me page |
| `minimal` | Vertical | 4:3 or icon | Name, price, company, basic badge | City/industry pages |

### Wireframe (text)

```
┌─────────────────────────────────────────────────────────────┐
│  [Image]  [◀] [▶]                               [♥ Save]   │
│           [● ● ● ●]                                         │
│  [Bestseller] [-25% OFF] [Verified]                         │
├─────────────────────────────────────────────────────────────┤
│  Product Title Line 1                                        │
│  Product Title Line 2                                        │
│  Category › SubCategory                                      │
│                                                              │
│  ₹1,25,000    ₹1,50,000   -17%   Save ₹25,000   / Unit     │
│                                                              │
│  [SellerBadge: Company Name ✓]                               │
│  [📍 Near You]                                               │
│                                                              │
│  📦 MOQ 2  🚚 7-10 days  ✅ In stock (185)  ★ 4.2 (128)    │
│  📈 89 orders/month                                          │
│                                                              │
│  [1]  [2]  [5]  [10]  [25]                                   │
│  ₹1.25L  ₹1.2L  ₹1.1L  ₹1L  ₹0.95L                         │
│                                                              │
│  ₹1,25,000/unit × 2 = ₹2,50,000  Save ₹25K  +250 GOCASH    │
│                                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐ │
│  │ BUY  │ │ RFQ  │ │CHAT  │ │SAVE  │ │ CMP  │ │  INFO    │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Shared Hook: `useProductActions()`

Extract into a single hook at `components/product/use-product-actions.ts`:

```typescript
function useProductActions(productId: string) {
  // auth guard
  // handleSave -> wishlist store
  // handleCompare -> compare store
  // handleChat -> router push
  // handleRFQ -> router push
  // handleBuyNow -> router push
  // isSaved, inCompare computed booleans
  // wishlist fetch on mount for BUYER role
}
```

Replaces 12 duplicated functions across ProductCard and CompactProductCard.

---

## 5. Migration Plan

### Phase A: Create Foundation (files to create)
1. **`types/product-card.ts`** — Single `UnifiedProductCardData` interface + `CardVariant` type
2. **`components/product/use-product-actions.ts`** — Shared hook (auth guard, save, compare, chat, RFQ, buy)
3. **`components/product/unified-product-card.tsx`** — One component, 6 variants via prop

### Phase B: Wire Active Consumers (files to modify)
| File | Replace | With Variant |
|------|---------|-------------|
| `components/discovery/ProductDiscoveryClient.tsx` | ProductCard + CompactProductCard | `list` / `grid` |
| `components/product/related-products.tsx` | CompactProductCard | `compact` |
| `app/categories/[slug]/page.tsx` | CompactProductCard | `compact` |
| `app/companies/[slug]/CompanyProfileClient.tsx` | ProductCard | `list` |
| `app/buyer/near-me/page.tsx` | NearMeProductCard | `nearme` |

### Phase C: Replace Inline Renderings (files to modify)
| File | Inline Lines | Replace With |
|------|-------------|-------------|
| `app/search/search-content.tsx` | ~75 lines | `search` variant |
| `app/city/[slug]/page.tsx` | ~30 lines | `minimal` variant |
| `app/industry/[slug]/page.tsx` | ~25 lines | `minimal` variant |

### Phase D: Cleanup (files to delete)
1. `components/discovery/ProductCard.tsx` — Dead, 489 lines
2. `components/product/product-card.legacy.tsx` — Dead, 413 lines

### Phase E: Delete Old Components (after full migration)
1. `components/product/product-card.tsx` — Replaced by UnifiedProductCard (list mode)
2. `components/product/compact-product-card.tsx` — Replaced by UnifiedProductCard (grid/compact mode)
3. `components/near-me/near-me-product-card.tsx` — Replaced by UnifiedProductCard (nearme mode)

---

## 6. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single component vs HOC | Single component with `variant` prop | 6 variants share 80% layout; HOC adds indirection without benefit |
| CSS approach | Tailwind classes (same as current) | Consistent with codebase, no new dependency |
| Image gallery | Keep image arrows + dot indicators | Already works in ProductCard, reused by all variants |
| Action buttons | Show all 6 in `list` mode, 5 icon-only in `grid`/`compact`, 0 in `minimal` | Context-appropriate: full actions on listing, minimal on city/industry |
| GOCASH reward row | Show only when `gocashEarn > 0` | Clean UI, conditional render |
| VerifiedBadge | Reuse existing `VerifiedBadge` component | Already handles 5 types, no need to duplicate |
| SellerBadge | Reuse existing `SellerBadge` component | Already handles seller identity |
| Quantity pricing grid | Show only in `list` variant | Too large for grid/nearme/minimal |
| `useProductActions` hook | Extract from product-card.tsx | Eliminates 12 duplicated functions |
