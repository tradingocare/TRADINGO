# TRADGO Trust Signals & Fraud Summary

## Overview

Unified trust signals and fraud summary built by aggregating existing data across 6+ modules. No new analytics engine, no new Prisma models, no new ClickHouse tables.

## Trust Signals

### Backend
- **File**: `apps/api/src/modules/tradgo/tradgo.service.ts`
- **Method**: `getTrustSignals(companyId)`
- **Endpoint**: `GET /tradgo/trust-signals` (JWT)
- **Returns**: Unified view of all trust-related data for a company

### Data Sources

| Field | Source | Description |
|-------|--------|-------------|
| `trustScore` | `Company.trustScore` | TradTrust score (0-100) |
| `verificationLevel` | `Company.verificationLevel` | LEVEL_0 through LEVEL_6 |
| `companyStatus` | `Company.status` | ACTIVE, VERIFIED, etc. |
| `totalProducts` | `Company.totalProducts` | Product catalog size |
| `responseRate` | `Company.responseRate` | Response rate (tbd auto-computation) |
| `memberSince` | `Company.createdAt` | Account age |
| `totalOrders` | `Order` count | Orders involving this company |
| `totalShipments` | `Shipment` count | Shipments from this company |
| `totalQuotes` | `Quote` count | Quotes sent/received |
| `totalRfqs` | `RFQ` count | RFQs created |
| `goCashBalance` | `GOCASH_Wallet.currentBalance` | Current wallet balance |
| `goCashLifetimeEarned` | `GOCASH_Wallet.lifetimeEarned` | Total GOCASH earned |
| `walletStatus` | `GOCASH_Wallet.status` | Wallet status |

### Frontend
- **Hooks**: `useTrustSignals()` from `@/hooks/use-tradgo`
- **API Client**: `getTrustSignals()` from `@/lib/api/tradgo`

## Fraud Summary

### Backend
- **File**: `apps/api/src/modules/wallet-api/wallet-api.service.ts`
- **Method**: `getFraudSummary()`
- **Endpoint**: `GET /wallet/admin/fraud-summary` (Admin)
- **Returns**: Aggregated fraud indicators across all modules

### Data Sources

| Field | Source | Description |
|-------|--------|-------------|
| `totalAlerts` | Combined | Sum of all active alerts |
| `highVelocityWallets` | Wallet API | Wallets with >50 txns in 24h |
| `failedTransactions24h` | GOCASH | Failed transaction count |
| `reversals24h` | GOCASH | Reversed transaction count |
| `rejectedReferrals24h` | Referral usage | Referrals rejected by fraud checks |
| `referralAuditAlerts24h` | Referral audit | Fraud audit entries (24h) |
| `openDisputes` | Dispute | Non-resolved disputes |
| `blacklistedEntries` | ReferralBlacklist | Total blacklist size |
| `walletAlerts` | Wallet API | Human-readable alert strings |

### Frontend
- **Hooks**: `useFraudSummary()` from `@/hooks/use-wallet`
- **API Client**: `getFraudSummary()` from `@/lib/api/wallet`
- **Admin Pages**: `/admin/dashboard` (4 fraud stat cards), `/admin/fraud-dashboard` (full fraud view)
- **States**: Loading (skeleton), Error (card with retry message), Empty ("no alerts"), Data (stats + alert cards)

### Key Design Decisions
1. **No new fraud engine**: All metrics computed from existing Prisma models via aggregation queries
2. **Cross-module**: Aggregates from Referral, Wallet, and Dispute modules — single endpoint replaces 3 separate API calls
3. **Reuses**: Existing `adminGetFraudAlerts()` in WalletApiService, existing Prisma queries for referral/dispute data
4. **Admin dashboard integration**: Trust signals section added to existing `/admin/dashboard` page
5. **Fraud dashboard rewired**: Previously hardcoded mock data replaced with real API call

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/modules/tradgo/tradgo.service.ts` | Added `getUnifiedBadges()`, `getTrustSignals()` |
| `apps/api/src/modules/tradgo/tradgo.controller.ts` | Added 2 endpoints |
| `apps/api/src/modules/wallet-api/wallet-api.service.ts` | Added `getFraudSummary()` |
| `apps/api/src/modules/wallet-api/wallet-api.controller.ts` | Added 1 endpoint |
| `apps/web/components/shared/VerifiedBadge.tsx` | Added 5+ new badge types |
| `apps/web/lib/api/tradgo.ts` | Added `getUnifiedBadges()`, `getTrustSignals()`, interfaces |
| `apps/web/lib/api/wallet.ts` | Added `getFraudSummary()`, `FraudSummary` interface |
| `apps/web/hooks/use-tradgo.ts` | Added `useUnifiedBadges()`, `useTrustSignals()` |
| `apps/web/hooks/use-wallet.ts` | Added `useFraudSummary()` |
| `apps/web/app/admin/dashboard/page.tsx` | Added fraud summary stat cards |
| `apps/web/app/admin/fraud-dashboard/page.tsx` | Wired to real API, removed mock data |

## Verification
- tsc (api) 0 errors ✅
- tsc (web) 0 errors ✅
- eslint 0 new violations ✅
- next build 180 routes ✅
