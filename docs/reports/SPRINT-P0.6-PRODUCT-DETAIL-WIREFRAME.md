# Sprint P0.6 — Product Detail Page Wireframe Implementation

**Status**: ✅ FOUNDER APPROVED (2026-07-31)
**Date**: 2026-07-31
**Acceptance criterion**: Founder's Product Detail Page Wireframe "same to same"

## What Was Done

`apps/web/components/product/PremiumProductDetailClient.tsx` fully rewritten to match the Founder's ASCII wireframe (previous P0.4 layout replaced; P0.4 design explicitly superseded by the wireframe directive).

### Wireframe → Implementation Mapping

| Wireframe block | Implementation |
|---|---|
| Breadcrumb `Machinery > CNC Machines > CNC Milling Machine VMC-850` | Breadcrumb `Home › Products › {category.slug} › {name}` + category line `{parent} › {category}` |
| Badges `[✅ Verified] [🪪 Elite Seller] [📊 TRADEXA® Score 3.5 (526)]` | `VerifiedBadge` (verificationLevel ≠ LEVEL_0), Elite Seller chip (only when `company.isTradgoElite`), TRADEXA® chip = `(trustScore/20).toFixed(1)` with `(reviews.total \|\| viewCount)` count |
| Left col: gallery + 36% OFF tag + `[+8 photos]` | `ImageGallery` (live media; seed has 1 IMAGE) + `DiscountBadge` (only when `originalPrice` set — null for seed → hidden) + wishlist overlay |
| Left col: AI Recommendation / Trust Stats / Seller Info 3-card grid | 3-card grid: AI Recommendation (score star), Trust Stats (On-Time Delivery / Response Rate / Buyers Reached), Seller Info (Listed Products / Seller Rating / Years in Business) — all with honest fallbacks |
| Key Specifications table | `Specifications` (product.specifications → attrSections → specProps → fallback) |
| Product Highlights | Highlights with `SanitizedHtml(description)` + highlight items |
| Documents & Download | Documents card (DOCUMENT media, max 4) + empty state + "Download All" |
| Right col: Offer Price ₹18,50,000 / unit + M.R.P. | `ProductHeroPrice` from `Math.min(...priceSlabs)` (seed: ₹50,000 — **wireframe numerals are schematic, real API data shown**) |
| GOCASH +₹1,85,000 | `ProductHeroGocash` — hidden when API sends no `goCashEligible` (seed `tradeCreditEligible: false`; **pre-existing platform behavior, never sent by API**) |
| Order Details: In Stock / MOQ / Lead Time / Est. Delivery | Stock dot (IN_STOCK/LOW_STOCK/OUT), MOQ row, Lead Time (`deliveryEta` → "Contact seller"), Est. Delivery (`freeDeliveryAbove` → "Pan India") |
| Quantity chips | chips from `[moq, 2, 5, 10, 25, 50]` |
| Seller Card → `/companies/{slug}` | `ProductHeroSeller` (logo/name/trust) linking to company profile |
| Action buttons: Chat / Buy / RFQ / Save | 4 stacked full-width buttons (Chat outline, Buy accent, RFQ, Save) + Compare/Share 2-col grid; Sample button when `isSampleOrder` |
| Trust & Support: 7-day returns, 1-yr warranty, UPI/NetBanking/TradePay, +91 78277 28852 | Trust & Support card (7 Days Easy Returns, Manufacturer Warranty, Secure Payments chips, Need Help phone + mail) |
| Tabs: Overview / Reviews / Q&A / Similar | Sticky quick-nav tabs (conditional on data presence) + anchor sections `#overview #reviews #qa #similar` |
| Listing meta | New surface-card row: Listed on `{createdAt}`, Product ID `{sku‖id}`, Report this listing (mailto) |

### Retained (verified no regression)
Reviews, Q&A, Seller Information (company stats + Quantity Discounts + Trade Assurance sticky), Similar Products sections; all handlers (buy → `/checkout?productId&qty`, RFQ → `/buyer/rfq/create?productId`, chat → `/messages?vendor&product`, share, wishlist/compare gated by `requireAuth`).

## Fixes During Verification
- **TS2451 duplicate `const setQuantity`** — state setter (line 142) + same-scope wrapper (line 292). Wrapper renamed `changeQuantity`; 3 call sites updated.
- Removed unused `Star` lucide import.

## Verification Results
- `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` → 0 errors
- `next build` → ✓ Compiled successfully (46s), `/products/[slug]` listed
- Playwright smoke (4 viewports 1600/1280/768/390): HTTP 200; all 31/33 wireframe section checks found (2 misses = selector miss on gallery + GOCASH badge correctly hidden for non-eligible product); H1 "CNC Milling Machine 5-Axis"; page heights desktop 6102 / tablet 8138 / mobile 9631; console errors = only pre-existing `example.com` 404 image noise
- Regressions: `/products` 200 (3160px — unchanged), `/companies` 200 (2811px), `/companies/test-seller-company` 200 (3585px — unchanged)
- Screenshots: `docs/review/P0.6-PRODUCT-DETAIL-WIREFRAME/*.png` (desktop/laptop/tablet/mobile)

## Data Gaps (wireframe vs real data — NOT hardcoded)
1. Price ₹18,50,000 / M.R.P. / −36% — seed sells at ₹50,000 (₹45,000 @ 3+); no `originalPrice` → no MRP/discount chip.
2. GOCASH badge — API never sends `goCashEligible`; seed `tradeCreditEligible: false`.
3. 4 thumbnails + [+8 photos] — seed has 1 IMAGE (example.com → known 404 noise).
4. Rajkot, Gujarat (296 km) — product has no lat/lng; no distance utility exists in web.
5. 36 listed products / 4.8★ (526) — company `findById` include lacks totalProducts/responseRate; reviews table empty.

All wireframe numerals shown with honest fallbacks per platform rules (no mock/hardcoded data).

## Stop
~~Awaiting Founder approval of the wireframe match (screenshots in `docs/review/P0.6-PRODUCT-DETAIL-WIREFRAME/`).~~ ✅ **FOUNDER APPROVED 2026-07-31.**
