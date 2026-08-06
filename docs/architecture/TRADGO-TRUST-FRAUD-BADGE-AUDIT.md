# Phase 15B.4 — Existing vs New Report

## Domain Audit Summary

| Domain | Existing | Missing | Action |
|--------|----------|---------|--------|
| Badge Components | VerifiedBadge (5 types), SellerBadge, Badge, StatusBadge, BadgesBar (x6 product badges) | Platinum, Top Seller, Top Buyer, Fast Responder, Reliable Supplier | Extend VerifiedBadge config |
| Badge Computation | tradgo.service.ts getBadges() — 6 types computed on-the-fly | No unified registry, no badge persistence | Extend tradgo with unified badges |
| Badge Notification | TRUST_BADGE_EARNED notification type exists (line 104) | Zero call sites | Wire notification |
| Trust Indicators | Company.trustScore (TradTrust), verificationLevel, status, responseRate (static 0) | No unified trust signals endpoint | Add to tradgo service |
| Verification | CompanyVerification (5 endpoints + admin page), UserVerification (5 endpoints + admin page), Reputation (2 endpoints) | Both admin pages exist | Add status cards to admin dashboard |
| Reputation Events | ReputationEvent model + service + controller (11 types) | recordEvent() has zero call sites | Not needed per scope |
| Fraud — Referral | 8 fraud detection methods, 4 blacklist types, velocity checks, circular detection | No cross-module correlation | Aggregate in fraud summary |
| Fraud — Wallet | `adminGetFraudAlerts()` (velocity, failures, reversals) | No unified fraud summary endpoint | Extend wallet-api |
| Fraud — Dispute | `fraudRate: 0` (stub), trustScore penalty on resolution | fraudRate hardcoded to 0 | Add real dispute metrics |
| Fraud — Order | No fraud-specific methods | No order fraud indicators | Include basic order anomaly checks |
| Fraud — Admin UI | `/admin/fraud-dashboard` page exists | Hardcoded mock data (7 mock items) | Wire to real API |
| Admin Dashboard | `/admin/dashboard` with 4 StatCards + Quick Links | No trust signals, badge status, fraud summary | Add sections |

## Implementation Plan

### 1. Unified Badge Registry — Extend `VerifiedBadge` (+5 types)
- Add `BADGE_CONFIG` entries: Platinum, Top Seller, Top Buyer, Fast Responder, Reliable Supplier
- Add `BADGE_CONFIG` entry for Future badge (generic placeholder)
- Backend: Add `getUnifiedBadges(companyId)` to `TradgoService` — computes 10+ badge types

### 2. Trust Signals — Add to `TradgoService`
- Add `getTrustSignals(companyId)` method
- Aggregates: verificationLevel, trustScore, order completion rate, delivery performance, RFQ quality, quote performance, GOCASH activity
- No scoring — raw data only

### 3. Unified Fraud Summary — Extend `WalletApiService`
- Add `getFraudSummary(adminUserId?)` method
- Aggregates: referral fraud alerts count, wallet fraud alerts, dispute counts, duplicate activity
- Expose via `GET /wallet/admin/fraud-summary`

### 4. Admin Dashboard Updates
- Add Trust Signals section to `/admin/dashboard`
- Wire `/admin/fraud-dashboard` to real API

### 5. APIs (all extend existing controllers)

| Method | Path | Source | Description |
|--------|------|--------|-------------|
| GET | /tradgo/unified-badges | TradgoController | All earnable badges for company |
| GET | /tradgo/trust-signals | TradgoController | Aggregated trust indicators |
| GET | /wallet/admin/fraud-summary | WalletApiController | Cross-module fraud summary |

## Files Modified

| File | Change |
|------|--------|
| `apps/web/components/shared/VerifiedBadge.tsx` | Add 5+ new badge types to BADGE_CONFIG |
| `apps/api/src/modules/tradgo/tradgo.service.ts` | Add getUnifiedBadges(), getTrustSignals() |
| `apps/api/src/modules/tradgo/tradgo.controller.ts` | Add 2 endpoints |
| `apps/api/src/modules/wallet-api/wallet-api.service.ts` | Add getFraudSummary() |
| `apps/api/src/modules/wallet-api/wallet-api.controller.ts` | Add GET /wallet/admin/fraud-summary |
| `apps/web/app/admin/dashboard/page.tsx` | Add trust signals section |
| `apps/web/app/admin/fraud-dashboard/page.tsx` | Wire to real API, remove hardcoded mock data |

## Files Created

None — all changes extend existing files.

## Verification Expected
- prisma validate ✅ (no schema changes)
- tsc (api) 0 errors
- tsc (web) 0 errors
- eslint — no new violations
- next build — no new routes added
