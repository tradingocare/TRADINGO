# Phase 15B.6 — Existing vs New Report

## Scoring Inputs Audit

| Input Domain | Exists? | File | Status | Reusable |
|-------------|---------|------|--------|----------|
| TradTrust Service | ✅ | tradtrust.service.ts | 6-factor engine (0-100), history, notification | Needs extension to 0-1000 + behavioral dims |
| TradTrust Controller | ✅ | tradtrust.controller.ts | 4 endpoints (score, history, recalculate, recalculate-all) | Needs enhancement endpoints |
| Trust Signals | ✅ | tradgo.service.ts | 14-field aggregate (orders, shipments, quotes, RFQs, wallet) | Directly reusable |
| Reputation Events | ✅ | reputation.service.ts | 11 event types, append-only, getSummary | Needs company-level aggregation |
| Company Verification | ✅ | company-verification.service.ts | Full CRUD + level upgrade | Already consumed by TradTrust |
| User Verification | ✅ | user-verification.service.ts | Full CRUD + level upgrade | NOT consumed by TradTrust |
| Performance Metrics | ✅ | smart-rfq, smart-shipment, smart-negotiation services | 6 metric families | Directly callable (all exported) |
| Analytics | ✅ | analytics.service.ts | getCompletionRate, getSellerLeaderboard | Directly callable |
| Rankings Facade | ✅ | tradgo.service.ts | 4 ranking methods (unified, city, state, category) | Directly reusable |
| Badge Registry | ✅ | tradgo.service.ts | 11 badge types | Directly reusable |
| Fraud Summary | ✅ | wallet-api.service.ts | getFraudSummary (7 indicators) | Needs company-level aggregation |
| GOCASH History | ✅ | gocash-integration.service.ts | getIntegrationSummary with breakdown | Needs company-level aggregation |
| Weights Config | ❌ | — | Hardcoded in TradTrustService (8 constants) | Needs centralized config |

## Existing Capabilities

- **TradTrustScore model** (Prisma): `id`, `companyId`, `score`, `factors` (Json), `calculatedAt`, `createdAt` — append-only history
- **Company.trustScore** (Int, 0-100): Denormalized, used across frontend
- **Recalculation**: Single company + global (admin-invoked)
- **Score notification**: `TRUST_SCORE_CHANGED` via NotificationService
- **Frontend**: VerifiedBadge (11 types), RankBadge (top 3 medal), SellerBadge (trust bar), trust score display in product/company cards

## What Must Be Created

| Item | Description |
|------|-------------|
| Weight Configuration | Centralized `TradTrustWeights` provider — all weights in one place, configurable |
| 0-1000 Scoring | Scale from current 0-100 to 0-1000 with behavioral dimensions |
| Behavioral Factors | 7 new scoring dimensions (order completion, delivery, RFQ, quote, negotiation, financial, reputation) |
| Negative Signals | Dispute penalty, fraud indicator penalty |
| Grade + Risk Level | A+/A/B+/B/C/D grades, Low/Medium/High/Critical risk |
| Score Breakdown API | GET /tradtrust/breakdown/:companyId |
| Recalculate by User | POST /tradtrust/recalculate-user/:userId |
| Admin Trust Stats | GET /tradtrust/stats |
| Frontend API | lib/api/tradtrust.ts (6 functions) |
| Frontend Hooks | hooks/use-tradtrust.ts (6 hooks) |
| TrustScoreCard | Score display with breakdown + grade + risk |
| Admin Dashboard Integration | Trust overview widget |
