# Marketplace Intelligence Engine

## Architecture

The Marketplace Intelligence Engine is a unified orchestration layer that wraps 10+ existing services into a facade pattern. It provides consolidated scoring, recommendations, rankings, geo intelligence, and business intelligence without modifying existing modules.

### Engine Methods

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `getUnifiedScore` | companyId | UnifiedScoreResult (17 factors, grade, recommendation) | Supplier-level explainable score |
| `findSuppliersWithExpansion` | lat/lng, categoryId, limit | NearFarResult (suppliers, expansionLevel) | Near→Far™ auto-expanding supplier search |
| `getBuyerRecommendations` | buyerId, companyId, limit | BuyerRecommendationResult[] | 5 recommendation types |
| `getSellerRecommendations` | companyId, limit | SellerRecommendationResult[] | 6 recommendation types |
| `getMarketplaceRankings` | none | 7-dimension MarketplaceRankings | Live rankings |
| `getGeoIntelligence` | none | GeoIntelligenceResult | 5 density types |
| `getBusinessIntelligence` | companyId | BusinessIntelligenceResult | Expansion/warehouse/advertising |
| `getBuyerRelationshipIntelligence` | buyerId, sellerId | RelationshipIntelligence | Buyer-seller relationship score |
| `getDeliveryPrediction` | origin/dest lat/lng, weight | DeliveryPredictionResult | Estimated delivery date + risk |

### API Endpoints

All endpoints under `/marketplace-intelligence`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/best-suppliers` | - | 14-factor best supplier scoring |
| GET | `/buyer-recommendations?buyerId=&companyId=` | - | AI-powered buyer recommendations |
| POST | `/record-event` | - | Record buyer history event |
| GET | `/score/:companyId` | - | Get unified supplier score |
| GET | `/near-far-suppliers?lat=&lng=` | - | Near→Far™ auto-expanding search |
| GET | `/seller-recommendations?companyId=` | - | Seller growth recommendations |
| GET | `/rankings` | - | Live marketplace rankings |
| GET | `/geo-intelligence` | - | Geo density & heatmap data |
| GET | `/business-intelligence?companyId=` | - | Expansion/warehouse insights |
| GET | `/relationship?buyerId=&sellerId=` | - | Buyer-seller relationship score |
| POST | `/delivery-prediction` | - | Delivery date estimation |
| GET | `/relationship-score?buyerId=&sellerId=` | - | Quick relationship score |

### Unified Score — 17 Factors

| Factor | Weight | Source |
|--------|--------|--------|
| TradTrust | 0.12 | TradTrustService.getScoreBreakdown |
| Verification Level | 0.03 | Company.verificationLevel |
| Response Rate | 0.08 | Company.responseRate |
| Completion Rate | 0.10 | Order status aggregation |
| Delivery Performance | 0.10 | Shipment dates comparison |
| Seller Rating | 0.07 | ProductReview aggregate |
| Financial Health | 0.06 | Payment success rate + volume |
| Availability | 0.04 | Product inventory ratio |
| Negotiation Success | 0.04 | Negotiation status |
| RFQ Win Rate | 0.04 | RFQ conversion rate |
| AI Confidence | 0.04 | Monthly orders volume |
| Freshness | 0.03 | Product creation recency |
| Repeat Business | 0.03 | Multi-order buyer count |
| Marketplace Activity | 0.03 | RFQ+Order+Shipment volume |
| Price Competitiveness | 0.03 | vs marketplace average |

### Near→Far™ Expansion

6-step radius expansion: 5km → 10km → 25km → 50km → 100km → 250km → 500km → Pan India

Uses Haversine SQL for real distance calculation (not city/state string compare).

### Dependencies

- TradTrustService — 17-factor trust scoring
- NearMeService — Haversine product search
- LocationIntelligenceService — Geocoding, clusters
- AnalyticsService — Business metrics
- AiGatewayService — AI-powered insights
- FreightIntelligenceService — Freight estimation
- MarketIntelligenceService — Market trends
- BuyerHistoryService — Category preferences, relationship

### Frontend

| Component | File | Purpose |
|-----------|------|---------|
| `BestScoreBadge` | `components/marketplace/best-score-badge.tsx` | Inline score badge |
| `SupplierScoreBreakdown` | `components/marketplace/supplier-score-breakdown.tsx` | Full factor breakdown |
| Buyer Recommendations | `app/buyer/dashboard/page.tsx` | AI recommendations panel |
| Seller Recommendations | `app/seller/dashboard/page.tsx` | Growth opportunity panel |
| Marketplace Rankings | `app/admin/marketplace-rankings/page.tsx` | 7-dimension admin rankings |

### File Structure

```
apps/api/src/modules/marketplace-intelligence/
├── buyer-history.service.ts          — Category preferences, relationship scoring
├── dto/
│   ├── marketplace.dto.ts            — BestSupplier/RecordEvent DTOs
│   └── marketplace-engine.dto.ts     — Engine query/body DTOs
├── marketplace-intelligence.controller.ts — 12 endpoints
├── marketplace-intelligence.engine.ts     — 10-method unified engine
├── marketplace-intelligence.module.ts     — Module with 8 dependency imports
└── marketplace-intelligence.service.ts    — Original 14-factor scorer

apps/web/
├── lib/api/marketplace-intelligence.ts    — 14 typed API functions + interfaces
├── components/marketplace/
│   ├── best-score-badge.tsx               — Inline score badge
│   └── supplier-score-breakdown.tsx       — Full factor breakdown component
├── app/buyer/dashboard/page.tsx           — Recommendation panel
├── app/seller/dashboard/page.tsx          — Recommendation panel
└── app/admin/marketplace-rankings/        — Admin rankings page
```
