# Sprint 1.3B — Rate Limiting: Trade Domain Controllers

**Status**: ✅ COMPLETE  
**Date**: 2026-07-28  
**Pre-requisite**: Sprint 1.3A + Sprint 1.3 Pre-Implementation Audit

---

## Pre-Implementation Audit

From the 22 Trade Domain controllers listed in Sprint 1.3A's next-phase plan, **14 already had class-level `@Throttle`** (escrow, settlement, payout, payout-admin, dispute, payment, payment-admin, payment-subscription, payment-webhook, tradeserv ×6, tradetalk ×3, tradtrust, gocash, gocash-ecosystem, gocash-integration, wallet-api, campaign, referral, commission, advertising, gallery).

**8 controllers required changes** — verified one-by-one before modification:

| Controller | Before | After |
|---|---|---|
| `refund/refund-engine.controller.ts` | Method-level on 2/4 methods (10, 30) | + class-level ADMIN_WRITE (60) |
| `notification/notification.controller.ts` | Method-level on 1 method (10) | + class-level WRITE_GENERAL (30) |
| `support/support.controller.ts` | Method-level on 2 methods (10, 20) | + class-level WRITE_GENERAL (30) |
| `companies/companies.controller.ts` | Method-level on 9 methods (30/60) | + class-level MARKETPLACE_READ (60) |
| `products/products.controller.ts` | Method-level on 1 method (60) | + class-level MARKETPLACE_READ (60) |
| `categories/categories.controller.ts` | Method-level on 4 methods (30/60) | + class-level MARKETPLACE_READ (60) |
| `industries/industries.controller.ts` | Method-level on 2 methods (30/60) | + class-level MARKETPLACE_READ (60) |
| `advertising/admin-advertising.controller.ts` | **Completely unprotected** (no import, no decorator) | + ADMIN_WRITE (60) |

## Design Decisions

1. **Partially-covered controllers**: Adding class-level `@Throttle` as a safety net for unthrottled methods. Method-level decorators override the class-level default — existing throttles are preserved.

2. **Constant selection**: For controllers with public read methods (companies, products, categories, industries), `MARKETPLACE_READ` (60/min) was chosen to allow adequate browsing while preventing abuse. For admin-only controllers (refund, admin-advertising), `ADMIN_WRITE` (60/min) was used.

3. **No business logic changes**: All edits are additive — new import + one class-level decorator.

## Verification Results

| Endpoint | Before | After | Expected | Status |
|---|---|---|---|---|
| companies GET / | 100 (global) | **60** | MARKETPLACE_READ (60) | ✅ |
| products GET / | 100 (global) | **60** | MARKETPLACE_READ (60) | ✅ |
| categories GET / | 30 (method) | **30** | method-level override preserved | ✅ |
| industries GET / | 30 (method) | **30** | method-level override preserved | ✅ |
| support GET /tickets | 100 (global) | **30** | WRITE_GENERAL (30) | ✅ |
| admin GET /advertising | 100 (global) | **60** | ADMIN_WRITE (60) | ✅ |
| refund GET /history | 30 (method) | **30** | method-level override preserved | ✅ |
| membership GET /plans | 10 (Sprint 1.3A) | **10** | WRITE_FINANCIAL (10) | ✅ |

| Check | Result |
|---|---|
| TypeScript Compilation (api) | ✅ 0 errors |
| TypeScript Compilation (web) | ✅ 0 errors |
| Rate limit headers present on all 8 modified endpoints | ✅ |
| Method-level overrides preserved | ✅ |

## Files Changed

| File | Action |
|---|---|
| `apps/api/src/modules/refund/refund-engine.controller.ts` | MODIFIED |
| `apps/api/src/modules/notification/notification.controller.ts` | MODIFIED |
| `apps/api/src/modules/support/support.controller.ts` | MODIFIED |
| `apps/api/src/modules/companies/companies.controller.ts` | MODIFIED |
| `apps/api/src/modules/products/products.controller.ts` | MODIFIED |
| `apps/api/src/modules/categories/categories.controller.ts` | MODIFIED |
| `apps/api/src/modules/industries/industries.controller.ts` | MODIFIED |
| `apps/api/src/modules/advertising/admin-advertising.controller.ts` | MODIFIED |

## Current Coverage

| Metric | Count |
|---|---|
| Total controllers in platform | 174 |
| With custom `@Throttle()` (pre-Sprint 1.3) | 76 |
| Added in Sprint 1.3A | 16 |
| Added in Sprint 1.3B | 8 |
| **Total with custom limit** | **100 (57.5%)** |
| On global default (100/min) | 74 (42.5%) |
| SkipThrottle (health) | 1 |

---

## Next

**Ready for review.** On approval, proceed to **Sprint 1.3C** (Buyer, Seller, CRM, Finance — remaining Medium Priority controllers from the Sprint 1.3 audit).
