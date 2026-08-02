# TRADGO Performance Metrics Foundation

## Overview

6 missing metric families implemented by extending existing analytics services across the TRADINGO platform. No new analytics engine, no new ClickHouse tables, no new Prisma models.

## Metrics Implemented

### 1. RFQ Quality Metrics
**Service**: `SmartRfqService.getRfqQualityMetrics()`
**Endpoint**: `GET /smart-rfq/quality/metrics?startDate=&endDate=`
**Returns**:
| Metric | Description |
|--------|-------------|
| `totalRfqs` | Total RFQs in period |
| `byStatus` | Count per RFQ status (DRAFT, ACTIVE, MATCHED, QUOTED, etc.) |
| `completenessScore` | Avg % of optional fields filled (description, budget, delivery, payment, location) |
| `responseRate` | % of RFQs that received at least 1 quote |
| `avgResponseTimeHours` | Avg hours from RFQ creation to first quote |
| `avgQuotesPerRfq` | Average number of quotes per RFQ |
| `avgQuoteValue` | Average value of received quotes |
| `conversionRate` | % of RFQs that reached CONVERTED status |

**Query**: Prisma aggregation on `RFQ` + `Quote` models. Computes completeness from 5 optional fields. Tracks response time by matching first quote creation time to RFQ creation time.

### 2. Quote Performance Metrics
**Service**: `SmartRfqService.getQuotePerformanceMetrics()`
**Endpoint**: `GET /smart-rfq/quote/performance?startDate=&endDate=`
**Returns**:
| Metric | Description |
|--------|-------------|
| `totalQuotes` | Total quotes (buyer = quotes on my RFQs, seller = quotes I submitted) |
| `byStatus` | Count per quote status |
| `acceptanceRate` | % of quotes accepted |
| `rejectionRate` | % of quotes rejected |
| `pendingRate` | % of quotes submitted or negotiating |
| `expirationRate` | % of quotes expired |
| `avgQuoteValue` | Average total amount across all non-draft quotes |

**Query**: Prisma aggregation on `Quote` model. Dual-perspective: `OR [{ rfq.companyId }, { companyId }]` covers both buyer and seller views.

### 3. Negotiation Performance Metrics
**Service**: `SmartNegotiationService.getPerformanceMetrics()`
**Endpoint**: `GET /smart-negotiation/performance/metrics?startDate=&endDate=`
**Returns**:
| Metric | Description |
|--------|-------------|
| `totalNegotiations` | Total negotiations |
| `byStatus` | Count per negotiation status |
| `successRate` | % accepted |
| `rejectionRate` | % rejected |
| `cancellationRate` | % cancelled |
| `avgDurationHours` | Avg hours from creation to acceptance |
| `avgCounterOffers` | Avg number of version exchanges per negotiation |

**Query**: Prisma `Negotiation` model for counts/duration, `NegotiationVersion.groupBy` for counter offer stats.

### 4. Shipment Performance Metrics
**Service**: `SmartShipmentService.getPerformanceMetrics()`
**Endpoint**: `GET /smart-shipment/performance/metrics?startDate=&endDate=`
**Returns**:
| Metric | Description |
|--------|-------------|
| `totalShipments` | Total shipments |
| `byStatus` | Count per shipment status |
| `onTimeDeliveryRate` | % delivered before or on estimatedDeliveryDate |
| `avgTransitTimeHours` | Avg hours from creation to delivery |
| `deliveryFailureRate` | % ended in DELIVERY_FAILED |
| `totalDelivered` | Count of successfully delivered shipments |

**Query**: Prisma `Shipment` model. On-time vs estimatedDeliveryDate comparison.

### 5. Delivery Performance Metrics
**Service**: `SmartShipmentService.getDeliveryMetrics()`
**Endpoint**: `GET /smart-shipment/delivery/performance?startDate=&endDate=`
**Returns**:
| Metric | Description |
|--------|-------------|
| `totalShipments` | Total shipments |
| `deliveryConfirmationRate` | % of shipments that reached DELIVERED |
| `deliveryFailureRate` | % in DELIVERY_FAILED status |
| `avgDeliveryTimeHours` | Avg hours from creation to delivery confirmation |
| `totalDelivered` | Count of confirmed deliveries |
| `totalFailed` | Count of failed deliveries |

**Query**: Prisma `Shipment` model.

### 6. Completion Rate Metrics
**Service**: `AnalyticsService.getCompletionRate()`
**Endpoint**: `GET /analytics/admin/completion-rate?startDate=&endDate=`
**Returns**:
| Metric | Description |
|--------|-------------|
| `totalOrders` | Total orders in period |
| `completedOrders` | Orders in COMPLETED status |
| `cancelledOrders` | Orders in CANCELLED status |
| `openDisputes` | Non-resolved disputes |
| `completionRate` | % completed / (completed + cancelled + disputed) |
| `cancellationRate` | % cancelled |
| `disputeRate` | % disputed |

**Query**: Prisma `Order` count by status + `Dispute` count for open disputes.

## Architecture

### Design Principles
1. **No new analytics engine**: All metrics extend existing services
2. **No new ClickHouse tables**: Computed from Prisma (existing data)
3. **No schema changes**: Pure query-level additions
4. **Consistent filtering**: All endpoints accept optional `startDate`/`endDate` query params
5. **Dual-perspective**: Quote/Shipment metrics work for both buyers and sellers via `OR` queries on company IDs
6. **Existing controllers**: Endpoints added to existing controllers, no new modules

### Files Modified

| File | Change |
|------|--------|
| `apps/api/src/modules/smart-rfq/smart-rfq.service.ts` | Added `getRfqQualityMetrics()`, `getQuotePerformanceMetrics()` |
| `apps/api/src/modules/smart-rfq/smart-rfq.controller.ts` | Added `GET /smart-rfq/quality/metrics`, `GET /smart-rfq/quote/performance` |
| `apps/api/src/modules/smart-negotiation/smart-negotiation.service.ts` | Added `getPerformanceMetrics()` |
| `apps/api/src/modules/smart-negotiation/smart-negotiation.controller.ts` | Added `GET /smart-negotiation/performance/metrics` |
| `apps/api/src/modules/smart-shipment/smart-shipment.service.ts` | Added `getPerformanceMetrics()`, `getDeliveryMetrics()`, made `getUserCompany` public |
| `apps/api/src/modules/smart-shipment/smart-shipment.controller.ts` | Added `GET /smart-shipment/performance/metrics`, `GET /smart-shipment/delivery/performance` |
| `apps/api/src/modules/analytics/analytics.service.ts` | Added `getCompletionRate()`, `PrismaService` dependency |
| `apps/api/src/modules/analytics/analytics.controller.ts` | Added `GET /analytics/admin/completion-rate` |

### API Reference

All endpoints require JWT auth. Date params are ISO strings (e.g. `2026-01-01`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/smart-rfq/quality/metrics` | JWT (buyer) | RFQ quality metrics |
| GET | `/smart-rfq/quote/performance` | JWT (buyer/seller) | Quote performance metrics |
| GET | `/smart-negotiation/performance/metrics` | JWT (buyer/seller) | Negotiation performance metrics |
| GET | `/smart-shipment/performance/metrics` | JWT (buyer/seller) | Shipment performance metrics |
| GET | `/smart-shipment/delivery/performance` | JWT (buyer/seller) | Delivery performance metrics |
| GET | `/analytics/admin/completion-rate` | JWT (admin) | Order completion rate metrics |

## Verification

- prisma validate ✅
- tsc (api) 0 errors ✅
- tsc (web) 0 errors ✅
- eslint — pre-existing warnings only (no new violations) ✅
- next build — 180 routes ✅
