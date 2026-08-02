# Near→Far→Best™ Engine

## Overview

The Near→Far→Best™ Engine auto-expands supplier search across 6 geographic tiers when insufficient suppliers are found at a given radius. It combines distance-based ranking with 14 marketplace factors to deliver "Best" suppliers closest to the buyer.

## Expansion Tiers

| Tier | Radius | Level | Fallback Condition |
|------|--------|-------|-------------------|
| 1 | 5 km | District | < limit suppliers |
| 2 | 10 km | City | < limit suppliers |
| 3 | 25 km | State | < limit suppliers |
| 4 | 50 km | Neighbour State | < limit suppliers |
| 5 | 100 km | Region | < limit suppliers |
| 6 | 250 km | Region+ | < limit suppliers |
| 7 | 500 km | Macro Region | < limit suppliers |
| 8 | Pan India | India | Always returns |

## Scoring Formula

```
totalScore = Σ(factor_i × weight_i)
```

Where 14 factors are weighted and summed, producing a 0-100 score with recommendation tiers: BEST (≥85), STRONG (≥75), GOOD (≥60), AVERAGE (≥40), POOR (<40).

## Haversine Distance

Real spherical distance calculation in SQL:

```sql
6371 * 2 * ASIN(SQRT(
  POWER(SIN(RADIANS($1 - cl.latitude)) / 2, 2) +
  COS(RADIANS($1)) * COS(RADIANS(cl.latitude)) *
  POWER(SIN(RADIANS($2 - cl.longitude)) / 2, 2)
)) AS distance
```

Filters `CompanyLocation` with non-null lat/lng, excludes expired subscriptions and LEVEL_0 verification.

## Explainability

Every supplier score includes factor-level breakdowns with:
- **score** (0-100 per factor)
- **weight** (contribution to total)
- **contribution** (score × weight)
- **label** (human-readable name)
- **reason** (why this score was assigned)

## Integration Points

| Module | Integration | File |
|--------|-------------|------|
| TradFind search | Near→Far expansion | marketplace-intelligence.engine.ts |
| Buyer dashboard | Supplier recommendations | buyer/dashboard/page.tsx |
| Seller dashboard | Growth recommendations | seller/dashboard/page.tsx |
| Admin console | Market rankings | admin/marketplace-rankings/page.tsx |
| Supplier cards | Score breakdown | SupplierScoreBreakdown component |

## Future Enhancements

- Real-time geocoding with GPS capture on mobile
- Multi-modal transport distance (road/rail/air vs straight-line)
- Weather-aware delivery prediction
- AI-enhanced supplier scoring with natural language factors
