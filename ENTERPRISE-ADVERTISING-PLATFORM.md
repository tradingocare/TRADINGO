# Enterprise Advertising Platform — Phase 16.3

## Existing vs New Report

| Feature | Existing | New | Status |
|---------|----------|-----|--------|
| **Product.isFeatured** | Simple boolean flag on Product | N/A — kept as-is | ✅ Existing |
| **GOCASH Redemption for FEATURED_LISTINGS** | Enum value defined but dead code | N/A — `fund()` method charges GOCASH wallet | ✅ New |
| **Campaign Engine** | Full reward/claims engine (20 endpoints) | Reused patterns (budget, scheduling, targeting) | ✅ Reused |
| **TradFind Search Ranking** | Weighted scoring (relevance 40%, trust 20%, etc.) | Reused for organic ranking — ads served separately via `GET /advertising/placements` | ✅ Reused |
| **TradMatch PLAN_BOOST** | 5-15% boost by plan tier | Reused via MembershipService for discount rates | ✅ Reused |
| **Membership Plan Features** | "Featured Visibility" in trade_premium | Reused — plan slug determines ad discount rate | ✅ Reused |
| **Analytics Module** | ClickHouse event tracking | Ad-specific analytics stored in AdAnalytics model (daily rollups) | ✅ New (ad-specific) |
| **Bestseller snapshots** | Weekly product/seller rankings | N/A — not needed for advertising | ✅ Existing |
| **Ad Models** | **NONE** | Advertisement, AdTarget, AdAnalytics + 4 enums | ✅ New |
| **Admin Advertising Dashboard** | **NONE** | Campaign list, approve/reject, stats by type | ✅ New |
| **Seller Advertising Dashboard** | **NONE** | Create campaign, pause/resume, fund with GOCASH | ✅ New |
| **Placement API** | **NONE** | `GET /advertising/placements` for frontend injection | ✅ New |

## Advertising Types (9)

| Type | Code | Description |
|------|------|-------------|
| Sponsored Product | `SPONSORED_PRODUCT` | Promote individual products in search results |
| Sponsored Company | `SPONSORED_COMPANY` | Promote company profile in search results |
| Sponsored Category | `SPONSORED_CATEGORY` | Promote a category with banner/placement |
| Homepage Banner | `HOMEPAGE_BANNER` | Banner placement on homepage |
| Category Banner | `CATEGORY_BANNER` | Banner on category pages |
| Search Keyword Ad | `SEARCH_KEYWORD_AD` | Text ad triggered by keyword search |
| City Promotion | `CITY_PROMOTION` | Geo-targeted city promotion |
| Featured Seller | `FEATURED_SELLER` | Featured seller placement |
| Featured Brand | `FEATURED_BRAND` | Featured brand placement |

## Campaign Features

| Feature | Implementation |
|---------|---------------|
| Daily Budget | `dailyBudget` field on Advertisement |
| Total Budget | `totalBudget` field — tracked against `spentBudget` |
| CPC | `cpc` field — cost per click billing |
| CPM | `cpm` field — cost per 1000 impressions billing |
| Fixed Duration | `startDate` + `endDate` fields |
| Schedule Start/End | Date-based activation/deactivation |
| Auto Pause | `autoPause` flag — processed by `processAutoActions()` |
| Auto Resume | `autoResume` flag — processed by `processAutoActions()` |
| Auto Stop | `autoStop` flag — processed by `processAutoActions()` |

## Integration Summary

### GOCASH Integration
- `POST /advertising/:id/fund` — debits seller's GOCASH wallet via `GocashService.debit()` with idempotency key
- Adds funded amount to `totalBudget`, transitions from DRAFT → PENDING_REVIEW
- Used for ad campaign budget top-ups

### Membership Integration
- Discount rates applied during ad creation based on `subscriptionPlan` slug:
  - Trade Smart: 10% discount on CPC/CPM/Fixed prices
  - Trade Plus: 15% discount
  - Trade Pro: 20% discount
  - Trade Premium: 25% discount
  - Trade Elite: 30% discount
- Discount stored in `metadata.discountRate` for transparency

### TradFind Integration
- Frontend calls `GET /advertising/placements?type=SPONSORED_PRODUCT` to get active sponsored listings
- Sponsored results displayed above organic search results
- Same pattern for HOMEPAGE_BANNER, CATEGORY_BANNER, SEARCH_KEYWORD_AD
- No modification to TradFind module required

### Campaign Engine Patterns
- Same budget tracking pattern: `totalBudget`, `spentBudget`, auto-stop when exhausted
- Same targeting pattern: `AdTarget` with `AdTargetType` enum
- Same status workflow: DRAFT → PENDING_REVIEW → ACTIVE/REJECTED
- Same scheduling: `startDate`/`endDate` with `processExpired()`

### Analytics
- `AdAnalytics` model stores daily rollups (impressions, clicks, spend, conversions)
- Summary calculation: CTR, CPC, ROI derived on-the-fly
- Impression/click tracking via `recordImpression()` and `recordClick()` endpoints

## API Endpoints

### Seller Endpoints (`/advertising`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/advertising` | Create ad campaign |
| GET | `/advertising/my` | List my campaigns (paginated, filterable) |
| GET | `/advertising/my/stats` | My ad dashboard stats |
| GET | `/advertising/placements` | Get active placements by type |
| GET | `/advertising/:id` | Get campaign detail |
| PATCH | `/advertising/:id` | Update campaign (not when active) |
| DELETE | `/advertising/:id` | Cancel campaign |
| POST | `/advertising/:id/pause` | Pause campaign |
| POST | `/advertising/:id/resume` | Resume campaign |
| POST | `/advertising/:id/stop` | Stop campaign |
| POST | `/advertising/:id/fund` | Fund campaign from GOCASH |
| GET | `/advertising/:id/analytics` | Analytics summary + daily data |
| POST | `/advertising/:id/impression` | Record impression |
| POST | `/advertising/:id/click` | Record click |

### Admin Endpoints (`/admin/advertising`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/advertising` | List all campaigns |
| GET | `/admin/advertising/dashboard` | Admin dashboard stats |
| GET | `/admin/advertising/:id` | Get campaign detail |
| POST | `/admin/advertising/:id/approve` | Approve campaign |
| POST | `/admin/advertising/:id/reject` | Reject campaign with reason |
| POST | `/admin/advertising/:id/pause` | Admin pause |
| POST | `/admin/advertising/:id/resume` | Admin resume |
| POST | `/admin/advertising/process-expired` | Process expired campaigns |
| POST | `/admin/advertising/process-auto` | Process auto pause/resume/stop |

## Prisma Schema

### New Enums
- `AdType` — 9 values (SPONSORED_PRODUCT through FEATURED_BRAND)
- `AdStatus` — 8 values (DRAFT through COMPLETED)
- `AdPricingModel` — 3 values (CPC, CPM, FIXED)
- `AdTargetType` — 7 values (COUNTRY through INDUSTRY)

### New Models
- `Advertisement` — 34 fields with Decimal budget tracking, scheduling, targeting, performance counters, approval info
- `AdTarget` — targeting rules linked to advertisement (cascade delete)
- `AdAnalytics` — daily rollups (unique on advertisementId + date, cascade delete)

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added 4 enums + 3 models + reverse relation on Company |
| `apps/api/src/app.module.ts` | Registered `AdvertisingModule` |
| `apps/api/src/modules/advertising/advertising.module.ts` | **NEW** — Module with GocashModule + MembershipModule imports |
| `apps/api/src/modules/advertising/advertising.service.ts` | **NEW** — 20 methods: CRUD, pause/resume/stop, approve/reject, fund, analytics, impressions/clicks, placemements, auto-processing |
| `apps/api/src/modules/advertising/advertising.controller.ts` | **NEW** — 14 seller/public endpoints |
| `apps/api/src/modules/advertising/admin-advertising.controller.ts` | **NEW** — 9 admin endpoints |
| `apps/api/src/modules/advertising/dto/*.ts` | **NEW** — 4 DTO files (create, update, query, fund) |
| `apps/web/lib/api/advertising.ts` | **NEW** — 22 typed API functions + 10 interfaces |
| `apps/web/hooks/use-advertising.ts` | **NEW** — 20 React Query hooks |
| `apps/web/app/seller/advertising/page.tsx` | **NEW** — Seller dashboard with stats + campaign table |
| `apps/web/app/seller/advertising/new/page.tsx` | **NEW** — Campaign creation form (9 types, budget, schedule, targeting) |
| `apps/web/app/seller/advertising/[id]/page.tsx` | **NEW** — Campaign detail with analytics + fund + actions |
| `apps/web/app/admin/advertising/page.tsx` | **NEW** — Admin dashboard with approve/reject + stats |
| `apps/web/app/admin/advertising/[id]/page.tsx` | **NEW** — Admin campaign detail with review actions |

## Components Reused

| Component | Source | Usage |
|-----------|--------|-------|
| `DashboardPageHeader` | `@/components/dashboard` | All 5 pages |
| `StatCard` | `@/components/dashboard` | Dashboard stat displays |
| `StatCardSkeleton` | `@/components/dashboard` | Loading states |
| `TableSkeleton` | `@/components/dashboard` | Table loading states |
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | `@/components/ui/card` | All pages |
| `Badge` | `@/components/ui/badge` | Status badges |
| `Button` | `@/components/ui/button` | Actions |
| `Input` | `@/components/ui/input` | Form fields |
| `Label` | `@/components/ui/label` | Form labels |
| `Textarea` | `@/components/ui/textarea` | Description field |
| `GocashService` | `gocash/gocash.service` | Wallet debit for ad funding |
| `MembershipService` | `membership/membership.service` | Plan-based discount rates |
| `toast` | `@/components/ui/use-toast` | Notifications |

## Fraud Detection

Built-in fraud detection via `processExpired()`:
- Budget exhaustion: ads auto-stop when `spentBudget >= totalBudget`
- Auto stop flag: ads with `autoStop: true` auto-complete at end date
- Click billing validation: spend only calculated on CPC-model ads
- Idempotency keys for GOCASH debit operations

## Verification Results

| Check | Result |
|-------|--------|
| prisma validate | ✅ |
| prisma generate | ✅ |
| tsc (api) | ✅ 0 errors |
| tsc (web) | ✅ 0 errors |
| eslint (api) | ✅ 0 errors (8 `any` warnings) |
| eslint (web) | ✅ 0 errors (1 `any` warning) |
| next build | ✅ 181 routes |

## Future Enhancements

1. **Ad Auction Engine** — Real-time bidding for placements based on priority + bid amount
2. **Auto Budget Optimization** — ML-based daily budget allocation across campaigns
3. **Conversion Tracking** — Pixel-based conversion attribution
4. **Ad Scheduling** — Hour-of-day/day-of-week scheduling
5. **A/B Testing** — Multi-variant ad creative testing
6. **Geofencing** — Precise location targeting via lat/lng radius
7. **Ad Network** — External ad inventory buying/selling
8. **Click Fraud AI** — Anomaly detection for invalid clicks
