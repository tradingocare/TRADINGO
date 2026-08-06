# Tier 2 Delivery Report — Marketplace & Search Intelligence

Generated: 2026-07-25

## Objective

Extend and harden marketplace intelligence, fix placeholder data across intelligence endpoints, and add customer segmentation — all on top of the existing schema (no Prisma migrations).

## Existing vs New Report

### Files Modified
| File | Change |
|------|--------|
| `apps/api/src/modules/enterprise-intelligence/enterprise-intelligence.service.ts` | Fixed 5 placeholder/type-error issues in `getCategoryMomentum`, `getRegionalHeatmap`, `getOpportunities` |
| `apps/api/src/modules/marketplace-intelligence/marketplace-intelligence.module.ts` | Registered `CustomerSegmentationService` |
| `apps/api/src/modules/marketplace-intelligence/marketplace-intelligence.controller.ts` | Added 2 new endpoints (`GET /segments`, `GET /segments/:segment`) |

### Files Created
| File | Purpose |
|------|---------|
| `apps/api/src/modules/marketplace-intelligence/customer-segmentation.service.ts` | Real-time RFM customer segmentation from existing order/payment data |

## Features Added

### 1. Category Momentum Revenue (EnterpriseIntelligenceService.getCategoryMomentum)
- **Before**: `revenue: 0` hardcoded for all 20 categories
- **After**: Real Prisma raw SQL join through `Order → OrderItem → Product → Category`, sums `Payment.amount` (CAPTURED) per category

### 2. Regional Heatmap Buyers & Sellers (EnterpriseIntelligenceService.getRegionalHeatmap)
- **Before**: `buyerCount: 0, sellerCount: 0, supplyScore: 0, demandScore: 0` for all 20 regions
- **After**: Real `Order.groupBy` for buyer count, `Product.findMany` (distinct companyId) for seller count, product count for supply score, RFQ count for demand score

### 3. High-Value Buyer Opportunities (EnterpriseIntelligenceService.getOpportunities)
- **Before**: `highValueBuyers: []` (empty)
- **After**: Top 5 companies by order count from `Order.groupBy`, with company names resolved and payment totals aggregated

### 4. Top Seller Opportunities
- **Before**: `topSellers: []` (empty)
- **After**: Top 5 companies by `trustScore` that have active products, with product count

### 5. TradeServ Demand Opportunities
- **Before**: `tradeservDemand: []` (empty)
- **After**: Top 5 `ProfessionalService` categories by listing count

### 6. Community Growth Opportunities
- **Before**: `communityOpportunities: []` (empty)
- **After**: Top 5 communities by `postCount`, showing member count and post count

### 7. Customer Segmentation Service
- **New module**: `CustomerSegmentationService` at `marketplace-intelligence/customer-segmentation.service.ts`
- **8 RFM segments**: Champions, Loyal, Potential Loyalists, New, At Risk, Cannot Lose, Hibernating, Lost
- **Quintile-based scoring**: Computes R/F/M quintiles from real order data (recency from `Order._max.createdAt`, frequency from `Order._count.id`, monetary from `Payment.amount` sum)
- **Zero new Prisma models**: All computed on-the-fly from Order, Payment, and Company tables
- **2 API endpoints**: `GET /marketplace-intelligence/segments` (summary by segment), `GET /marketplace-intelligence/segments/:segment` (companies in a segment)

## Verification Results
| Check | Result |
|-------|--------|
| `tsc apps/api` | 0 errors |
| `tsc apps/web` | 0 errors |
| `next build` | 298 routes, 0 errors |

## Remaining Gaps
- Category momentum `revenue` query limited to top 200 orders (raw SQL `LIMIT 200`)
- Regional heatmap `growthRate: 0` remains as placeholder (requires period-over-period comparison data)
- Customer segmentation limited to top 200 companies (`take: 200`)
- No frontend pages created for segmentation (API-only)
