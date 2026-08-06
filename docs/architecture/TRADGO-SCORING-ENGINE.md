# Phase 15B.6 — TradTrust™ Unified Scoring Engine

## Architecture

One deterministic engine — `TradTrustService` — consumes 13 existing data sources and produces a single 0–1000 trust score with explainable breakdown, grade, and risk level.

```
┌──────────────────────────────────────────────────────────────────┐
│                    TradTrustService.calculateScore()             │
│                                                                  │
│  ┌────────────────────────┐   ┌──────────────────────────────┐  │
│  │   Profile Factors      │   │   Behavioral Factors         │  │
│  │  ┌──────────────────┐  │   │  ┌────────────────────────┐  │  │
│  │  │ Verification     │120│   │  │ Order Completion      │180│  │
│  │  │ Profile Complete │ 80│   │  │ Delivery Performance   │120│  │
│  │  │ Company Age      │ 60│   │  │ RFQ Quality           │ 80│  │
│  │  │ Active Status    │ 50│   │  │ Quote Success         │ 70│  │
│  │  │ Certifications   │ 40│   │  │ Negotiation Success   │ 60│  │
│  │  │ Onboarding       │ 50│   │  │ Financial Health      │ 60│  │
│  │  └──────────────────┘  │   │  │ Reputation Events     │ 50│  │
│  │  Total: 400            │   │  │ Marketplace Rank      │ 60│  │
│  └────────────────────────┘   │  └────────────────────────┘  │
│                                │  Total: 680                   │
│                                └──────────────────────────────┘
│                                         │
│                                         ▼
│  ┌─────────────────────────────────────────────┐
│  │  Raw Score = Profile(400) + Behavioral(680) │
│  │            - Penalty(up to 180)              │
│  │  Final Score = Clamp(0, 1000, Raw)           │
│  └─────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

## Weight System

All weights centralized in `TradTrustWeightsService` — no hardcoded numbers in business logic.

### Positive Weights (max 1080, capped to 1000)

| Factor | Weight | Source |
|--------|--------|--------|
| Order Completion | 180 | `AnalyticsService.getCompletionRate()` |
| Verification Level | 120 | `Company.verificationLevel` |
| Delivery Performance | 120 | `SmartShipmentService.getPerformanceMetrics()` |
| Profile Completion | 80 | Company profile fields |
| RFQ Quality | 80 | `SmartRfqService.getRfqQualityMetrics()` |
| Quote Success | 70 | `SmartRfqService.getQuotePerformanceMetrics()` |
| Negotiation Success | 60 | `SmartNegotiationService.getPerformanceMetrics()` |
| Company Age | 60 | Company creation date |
| Financial Health | 60 | GOCASH wallet status + balance |
| Marketplace Rank | 60 | `AnalyticsService.getSellerLeaderboardPosition()` |
| Active Status | 50 | Company status |
| Reputation Events | 50 | `ReputationEvent` counts |
| Onboarding | 50 | Onboarding completion |
| Certifications | 40 | Document certifications |

### Penalty Weights (max 180)

| Penalty | Weight | Source |
|---------|--------|--------|
| Fraud Penalty | 100 | Wallet status (SUSPENDED/LOCKED) |
| Dispute Penalty | 80 | Open disputes + cancelled orders |

All weights are injectable via `TradTrustWeightsService` and can be tuned without rewriting the engine.

## Formula

```
Factor(i) = Score(i) × Weight(i) / 100
           where Score(i) ∈ [0, 100]

ProfileScore = Σ(ProfileFactor(i))    max 400
BehavioralScore = Σ(BehavioralFactor(i))  max 680
Penalty = FraudPenalty + DisputePenalty   max 180

RawScore = ProfileScore + BehavioralScore - Penalty
FinalScore = Clamp(0, 1000, RawScore)
LegacyScore = Round(FinalScore / 10)     → Company.trustScore (0-100)

Grade = A+(≥900) | A(≥750) | B+(≥600) | B(≥450) | C(≥250) | D(<250)
Risk   = Low(≥600) | Medium(≥300) | High(≥100) | Critical(<100)
```

## Input Sources (all existing, no new queries)

| Input | Service Method | Returns |
|-------|---------------|---------|
| Order completion | `AnalyticsService.getCompletionRate()` | completionRate, cancellationRate, disputeRate |
| RFQ quality | `SmartRfqService.getRfqQualityMetrics()` | responseRate, conversionRate, completenessScore |
| Quote performance | `SmartRfqService.getQuotePerformanceMetrics()` | acceptanceRate, rejectionRate |
| Negotiation success | `SmartNegotiationService.getPerformanceMetrics()` | successRate, avgDurationHours |
| Delivery performance | `SmartShipmentService.getPerformanceMetrics()` | onTimeDeliveryRate, deliveryFailureRate |
| Financial health | `Prisma.GOCASH_Wallet` | status, balance, kycVerified |
| Reputation events | `Prisma.ReputationEvent` | grouped by type, positive/negative counting |
| Marketplace rank | `AnalyticsService.getSellerLeaderboardPosition()` | rank, totalRevenue |
| Fraud indicators | `Prisma.GOCASH_Wallet` | SUSPENDED/LOCKED status |
| Dispute counts | `Prisma.Dispute` | OPEN/UNDER_REVIEW/ESCALATED count |
| Verification level | `Company.verificationLevel` | LEVEL_0 through LEVEL_6 |
| Profile completion | Inline calculation | 12 text fields + arrays |
| Company age | `Company.createdAt` | Years on platform |
| Certifications | `Company.certificationDocs` | Active/expired ratio |

## Output Structure

```json
{
  "score": 100,
  "unifiedScore": 755,
  "grade": "A",
  "riskLevel": "Low",
  "factors": {
    "verificationLevelScore": 85,
    "orderCompletionScore": 92,
    "deliveryPerformanceScore": 88,
    "fraudPenalty": 0,
    "disputePenalty": 10
  },
  "updatedAt": "2026-06-30T..."
}
```

## APIs Added (3 new, 5 enhanced)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/tradtrust/unified/:companyId` | Public | Unified score (0-1000) + grade + risk |
| `GET` | `/tradtrust/breakdown/:companyId` | Public | Detailed factor breakdown per category |
| `GET` | `/tradtrust/stats` | ADMIN | Trust score statistics (distribution, avg, etc.) |
| `POST` | `/tradtrust/recalculate-user/:userId` | ADMIN | Recalculate by user (resolves company) |

Existing endpoints enhanced: `GET /score/:companyId` (unchanged), `GET /history/:companyId` (unchanged), `POST /recalculate/:companyId` (now uses 0-1000, stores 0-100 legacy), `POST /recalculate-all` (same).

## Recalculation Flow

```
Admin POST /recalculate/:companyId
  → TradTrustService.calculateScore(companyId)
    → Load company profile + owners
    → Compute 6 profile factors (inline)
    → Compute 8 behavioral factors (calls existing services)
    → Compute penalty (inline Prisma queries)
    → Build allFactors JSON
    → Store TradTrustScore record (append-only history)
    → Update Company.trustScore (0-100 legacy)
    → Send TRUST_SCORE_CHANGED notification
    → Return 0-1000 score

Admin POST /recalculate-user/:userId
  → Resolves company via CompanyOwner
  → Delegates to calculateScore()

Admin POST /recalculate-all
  → Iterates all non-deleted companies
  → Delegates to calculateScore() for each
```

## Score History

Existing `TradTrustScore` model (Prisma):
- `id`, `companyId`, `score` (0-1000), `factors` (JSON with all 16 factors), `calculatedAt`, `createdAt`
- Append-only, indexed by `companyId` and `score`
- `GET /tradtrust/history/:companyId` returns cursor-ordered list (desc)

## Frontend

- **`lib/api/tradtrust.ts`** — 8 typed API functions
- **`hooks/use-tradtrust.ts`** — 8 React Query hooks
- **`TrustScoreCard`** component — Score display (0-1000), grade badge, risk level, per-factor progress bars, rank badge, last updated timestamp
- All components reuse existing: `VerifiedBadge` (grade-based badge type), `RankBadge` (leaderboard rank)

## Files Modified (5)

| File | Change |
|------|--------|
| `apps/api/src/modules/tradtrust/tradtrust.service.ts` | Extended with 8 behavioral dimensions, penalty system, 0-1000 scoring, grade/risk, unified score, breakdown, user recalculation, trust stats |
| `apps/api/src/modules/tradtrust/tradtrust.controller.ts` | Added 3 new endpoints (unified, breakdown, stats, recalculate-user) + Public decorators |
| `apps/api/src/modules/tradtrust/tradtrust.module.ts` | Imported SmartRfqModule, SmartShipmentModule, SmartNegotiationModule, AnalyticsModule; added TradTrustWeightsService |

## Files Created (5)

| File | Description |
|------|-------------|
| `apps/api/src/modules/tradtrust/tradtrust-weights.config.ts` | Centralized weight configuration with grade/risk thresholds |
| `apps/web/lib/api/tradtrust.ts` | 8 typed API functions for TradTrust endpoints |
| `apps/web/hooks/use-tradtrust.ts` | 8 React Query hooks (useTrustScore, useUnifiedScore, useScoreBreakdown, useScoreHistory, useTrustStats, useRecalculateScore, useRecalculateAllScores, useRecalculateUserScore) |
| `apps/web/components/shared/TrustScoreCard.tsx` | Reusable score display card with breakdown bars, grade badge, risk level, rank badge |
| `TRADGO-SCORING-ENGINE.md` | This documentation |

## Components Reused

- `VerifiedBadge` — mapped from grade (A+→elite, A→gold, B+→premium, B→trusted, C→verified)
- `RankBadge` — optional leaderboard rank display
- Card, CardContent, CardHeader, CardTitle — base UI components

## New Integrations

- TradTrustService → SmartRfqService (RFQ quality + quote performance)
- TradTrustService → SmartShipmentService (delivery performance)
- TradTrustService → SmartNegotiationService (negotiation success)
- TradTrustService → AnalyticsService (completion rate + leaderboard rank)
- TradTrustService → Prisma.ReputationEvent (reputation scoring)
- TradTrustService → Prisma.GOCASH_Wallet (financial health + fraud)
- TradTrustService → Prisma.Dispute + Prisma.Order (penalty computation)

## Verification Results

| Check | Status |
|-------|--------|
| prisma validate | ✅ (no schema changes) |
| prisma generate | ✅ (no schema changes) |
| tsc (api) | ✅ 0 errors |
| tsc (web) | ✅ 0 errors |
| eslint (api) | ✅ no new violations |
| next build | ✅ 180 routes |

## Future AI Extension Points

- **Dynamic weights** — Move `TradTrustWeightsService` values to a DB table for admin tuning via UI
- **Time decay** — Add recency weighting for behavioral factors (older transactions count less)
- **Review sentiment** — Incorporate `ProductReview` sentiment analysis
- **Network effects** — Score boost for verified network partners
- **Event-driven recalculation** — Auto-recalculate on verification approval, dispute resolution, or order completion
- **Predictive scoring** — ML model trained on historical TradTrustScore records to predict future trust changes
