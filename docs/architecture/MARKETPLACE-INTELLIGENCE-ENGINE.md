# Marketplace Intelligence Engine (Phase 17.2)

## Overview

Phase 17.2 completes the TRADINGO Intelligence Layer by adding Freight Intelligence, Market Intelligence, Territory Intelligence, Buyer Recommendation Engine, and fixing all placeholder scoring in the Marketplace Intelligence Engine.

## Modules

### 1. Freight Intelligence (`/freight-intelligence/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/freight-intelligence/estimate` | POST | Public | Shipping cost estimate with carrier options |
| `/freight-intelligence/analytics` | GET | ADMIN | Carrier analytics (on-time rate, avg cost, by region) |

**Service:** Haversine distance × weight × package count base cost, carrier multipliers by name (Delhivery 0.9×, Bluedart 1.2×, DTDC 0.8×), ETA estimation (distance/300 + carrier offset)

### 2. Market Intelligence (`/market-intelligence/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/market-intelligence/trends` | GET | Public | Category-level trends (RFQ count, orders, demand direction, price range) |
| `/market-intelligence/demand-signals` | GET | Public | Demand signals from RFQ activity (last 7 days, urgency, emerging detection) |

**Service:** Compares current 30-day vs previous 30-day RFQ counts for demand trend (RISING >20% growth, DECLINING <-20%), aggregates RFQ titles for demand signals

### 3. Territory Intelligence (`/territory-intelligence/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/territory-intelligence/tree` | GET | Public | Territory hierarchy tree |
| `/territory-intelligence/coverage` | GET | ADMIN | State-level coverage analytics |
| `/territory-intelligence/rm/:rmId` | GET | Public | RM's assigned territories |
| `/territory-intelligence/company/:companyId` | GET | Public | Find territory for a company |
| `/territory-intelligence` | POST | ADMIN | Create territory |
| `/territory-intelligence/:id` | PATCH | ADMIN | Update territory |

### 4. Marketplace Intelligence Enhancement

**Fixed 5 Math.random() placeholders:**
- `sellerRating` → real avg rating from `ProductReview`
- `financialHealth` → real payment success rate + total amount
- `aiConfidence` → based on total monthly orders
- `availability` → real inventory count / total products ratio
- `negotiationSuccess` → real negotiation completion rate

**Wired BuyerHistoryService:**
- `relationshipScore` was hardcoded 50 → now uses `BuyerHistoryService.getRelationshipScore(buyerId, sellerId)`
- `priceCompetitiveness` now compares against marketplace average price (not hardcoded divisor)

**New: Buyer Recommendation Engine**
- `GET /marketplace-intelligence/buyer-recommendations` — personalized supplier recommendations based on buyer's category preferences from BuyerHistory

**Missing Providers Fixed:**
- `UserPreferenceService` registered in `LocationIntelligenceModule`
- `BuyerHistoryService` registered in `MarketplaceIntelligenceModule`
- DTOs created for all endpoints

**Prisma:**
- Added `LOGISTICS` and `MARKET_INTELLIGENCE` to TaskType enum

## Files Created/Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added LOGISTICS, MARKET_INTELLIGENCE TaskTypes |
| `apps/api/src/modules/freight-intelligence/` | NEW — 4 files (service, controller, module, dto) |
| `apps/api/src/modules/market-intelligence/` | NEW — 4 files (service, controller, module) |
| `apps/api/src/modules/territory-intelligence/` | NEW — 4 files (service, controller, module, dto) |
| `apps/api/src/modules/marketplace-intelligence/marketplace-intelligence.service.ts` | REWRITTEN — real scoring, BuyerHistoryService wire, buyer recommendations |
| `apps/api/src/modules/marketplace-intelligence/marketplace-intelligence.controller.ts` | UPDATED — added buyer-recommendations, DTOs |
| `apps/api/src/modules/marketplace-intelligence/marketplace-intelligence.module.ts` | UPDATED — registered BuyerHistoryService |
| `apps/api/src/modules/marketplace-intelligence/dto/` | NEW — DTOs for marketplace endpoints |
| `apps/api/src/modules/location-intelligence/location-intelligence.module.ts` | UPDATED — registered UserPreferenceService |
| `apps/api/src/modules/location-intelligence/dto/` | NEW — DTOs for location endpoints |
| `apps/api/src/app.module.ts` | UPDATED — registered 3 new modules |
| `apps/web/lib/api/freight-intelligence.ts` | NEW — typed API client |
| `apps/web/lib/api/market-intelligence.ts` | NEW — typed API client |
| `apps/web/lib/api/territory-intelligence.ts` | NEW — typed API client |
| `apps/web/app/admin/freight-intelligence/page.tsx` | NEW — admin freight analytics dashboard |
| `apps/web/app/admin/market-intelligence/page.tsx` | NEW — admin market trends + demand signals |
| `apps/web/app/admin/territory-intelligence/page.tsx` | NEW — admin territory tree + coverage |
| `apps/web/data/master-data.ts` | UPDATED — added 3 nav items |

## Verification

- prisma validate ✅
- prisma generate ✅
- tsc (api) 0 errors ✅
- tsc (web) 0 errors ✅
- eslint 0 errors (11 warnings) ✅
- next build 197 routes ✅
