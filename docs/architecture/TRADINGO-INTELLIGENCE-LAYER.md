# TRADINGO Intelligence Layer (Phase 17.0)

## Near→Far→Best™ Engine + Location Intelligence

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Marketplace Intelligence                      │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ BestSupplier  │  │ NearFarBest  │  │ BuyerHistory     │  │
│  │ Engine        │  │ Engine       │  │ Service          │  │
│  │ (14 factors)  │  │ (unified)    │  │ (relationship)   │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│          │                 │                    │            │
│          └─────────────────┴────────────────────┘            │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│                Location Intelligence                         │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Geocoding     │  │ GeoCache     │  │ Location         │  │
│  │ Service (OSM) │  │ (in-memory)  │  │ Controller       │  │
│  └───────┬───────┘  └──────────────┘  └──────────────────┘  │
│          │                                                    │
│          └─────────────────────────────────────────────────────┘
│                              │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────┐
│                  Prisma Schema                               │
│  LocationSource    LocationConfidence    BuyerHistory         │
│  UserPreference    Territory            GeoCluster            │
│  CompanyLocation (extended)            ProductLocationIndex   │
└───────────────────────────────────────────────────────────────┘
```

### Prisma Schema Changes
- **`LocationSource`** enum: AUTO_GEOCODE, GPS_CAPTURE, ADMIN_VERIFIED
- **`LocationConfidence`** enum: GPS, VERIFIED, AUTO_GEOCODED, MANUAL
- **`CompanyLocation`** extended: locationSource, locationConfidence, locationAccuracy, verifiedLocation, lastGeocodedAt, serviceRadius; added lat/lng index
- **`BuyerHistory`** model: tracks buyer interactions for relationship memory
- **`UserPreference`** model: preferred categories/sellers/cities, search radius, notification prefs
- **`Territory`** model: RM territory intelligence with hierarchical structure
- **`GeoCluster`** model: heatmap data for supplier density visualization
- **`LocationType`** extended: added DELIVERY_CENTER

### Backend Modules

#### 1. Location Intelligence Module (`/location-intelligence/`)
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/location-intelligence/geocode/:companyId` | POST | ADMIN | Geocode single company's unlocated addresses |
| `/location-intelligence/geocode-all` | POST | ADMIN | Geocode all unlocated addresses |
| `/location-intelligence/nearby` | GET | Public | Find nearby suppliers by lat/lng/radius |
| `/location-intelligence/clusters` | GET | Public | Get heatmap cluster data |
| `/location-intelligence/summary` | GET | ADMIN | Location coverage statistics |
| `/location-intelligence/cache-stats` | GET | ADMIN | Geo cache performance stats |
| `/location-intelligence/reverse-geocode` | POST | Public | Reverse geocode lat/lng to address |

#### 2. Marketplace Intelligence Module (`/marketplace-intelligence/`)
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/marketplace-intelligence/best-suppliers` | GET | Public | 14-factor Best Supplier scoring |
| `/marketplace-intelligence/record-event` | POST | Public | Record buyer interaction event |

### 14-Factor Marketplace Score

| Factor | Weight | Description |
|---|---|---|
| Distance Score | 12% | Haversine-based proximity scoring |
| TradTrust Score | 15% | Existing TradTrust 1000-point engine / 10 |
| Price Competitiveness | 14% | Avg variant price vs marketplace benchmark |
| Delivery Reliability | 10% | Dispute rate inverse scoring |
| Response Rate | 8% | Supplier's response rate to inquiries |
| Completion Rate | 8% | Completed orders / total orders ratio |
| Seller Rating | 7% | Buyer review aggregation |
| Financial Health | 6% | Payment history & credit score |
| Relationship Score | 7% | Repeat orders, duration, satisfaction |
| AI Confidence | 4% | AI Gateway analysis confidence |
| Availability | 3% | Stock status & inventory depth |
| Negotiation Success | 2% | Historical negotiation completion rate |
| RFQ Success | 2% | RFQ acceptance-to-completion ratio |
| Verification Level | 2% | KYC verification depth |

### Frontend Changes

1. **Geolocation Hook** (`hooks/use-geolocation.ts`): Browser GPS with sessionStorage persistence
2. **Marketplace API** (`lib/api/marketplace-intelligence.ts`): Typed API client for all endpoints
3. **React Query Hooks** (`hooks/use-marketplace-intelligence.ts`): useBestSuppliers, useGeoClusters, useLocationSummary
4. **BestScoreBadge** component: Gradient badge showing BEST/STRONG/GOOD/AVERAGE/POOR with score
5. **FilterSidebar** extended: "Use My Location" button, city/state inputs, radius slider
6. **ProductDiscoveryClient** fixed: doSearch() now sends lat, lng, kmRadius, city, state, geoScope
7. **CompanyCard** extended: BestScoreBadge display in stats section
8. **Admin Geo Intelligence** page (`/admin/geo-intelligence`): Summary cards, heatmap clusters

### Files Created

| File | Description |
|---|---|
| `apps/api/src/modules/location-intelligence/` | Location Intelligence module (5 files) |
| `apps/api/src/modules/marketplace-intelligence/` | Marketplace Intelligence module (4 files) |
| `apps/web/lib/api/marketplace-intelligence.ts` | Frontend API client |
| `apps/web/hooks/use-marketplace-intelligence.ts` | React Query hooks |
| `apps/web/hooks/use-geolocation.ts` | Browser geolocation hook |
| `apps/web/components/marketplace/best-score-badge.tsx` | Best Score badge component |
| `apps/web/app/admin/geo-intelligence/page.tsx` | Admin geo analytics page |

### Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | 4 new enums, 5 new models, CompanyLocation extended |
| `apps/api/src/app.module.ts` | Registered LocationIntelligenceModule + MarketplaceIntelligenceModule |
| `apps/web/components/discovery/ProductDiscoveryClient.tsx` | doSearch() now sends geo params |
| `apps/web/components/discovery/FilterSidebar.tsx` | Added Location filter section |
| `apps/web/components/company/CompanyCard.tsx` | Added BestScoreBadge |
| `apps/web/data/master-data.ts` | Added Geo Intelligence nav item |

### Verification
- prisma validate ✅
- prisma generate ✅
- tsc (api) 0 errors ✅
- tsc (web) 0 errors ✅
- eslint 0 errors (5 warnings) ✅
- next build 193 routes ✅

### Next Steps
1. Wire remaining mock pages (seller quote detail, saved suppliers)
2. Fix WebSocket CORS — Replace wildcard with explicit origins
3. Implement OAuth Strategies — Google/LinkedIn login
4. Deploy to staging — Run production-equivalent smoke tests
