# Sprint 6L — Critical Stabilization

## Scope
Resolve Phase 2 release blockers only. No new features, no new modules, no new UI, no roadmap expansion.

## Fix 1 — Booking Webhook Gap
- **Files**: `apps/api/src/modules/payment/payment.service.ts`, `apps/api/src/modules/tradeserv/booking-financial-orchestrator.service.ts`
- **Problem**: `handleWebhookEvent()` had no handler for TradeServ `BOOKING_PAYMENT` webhook events. Booking payments were captured by Razorpay but never created escrow or triggered the financial pipeline.
- **Fix**: Added `BOOKING_PAYMENT` case that calls `verifyBookingPayment()` with event metadata, then emits `booking.payment.webhook.captured` event. `BookingFinancialOrchestratorService` listens with `@OnEvent('booking.payment.webhook.captured')` → calls `processPaymentVerified()` for escrow creation.

## Fix 2 — Missing Payout Flow
- **Files**: `apps/api/src/modules/tradeserv/booking-financial-orchestrator.service.ts`, `apps/api/src/modules/tradeserv/tradeserv.module.ts`
- **Problem**: After settlement was processed in `processBookingCompleted()`, no payout was created for the professional. Money sat in the platform account.
- **Fix**: Injected `PayoutService` into `BookingFinancialOrchestratorService`. Added `payoutService.createFromSettlement()` call after settlement processing completes. Imported `PayoutModule` in `TradeservModule`.

## Fix 3 — Escrow Event Type Mismatch
- **File**: `apps/api/src/modules/tradeserv/booking-financial-orchestrator.service.ts`
- **Problem**: `resumeSettlement()` used `'ESCROW_RELEASED' as EscrowEventType` which didn't match the enum value `ESCROW_REOPENED`. Events were published with wrong type.
- **Fix**: Changed to `EscrowEventType.ESCROW_REOPENED` for proper type safety and event routing.

## Fix 4 — Commission Double-Calculation
- **Files**: `apps/api/src/modules/escrow/escrow.service.ts`, `apps/api/src/modules/payout/payout.service.ts`
- **Problem**: Commission was calculated in `BookingFinancialOrchestrator.processPaymentVerified()` but lost when passed to payout. Payout re-calculated commission from scratch, causing mismatches.
- **Fix**: `EscrowService.release()` now persists `commissionAmount` and `commissionMetadata` (JSON) on the escrow record. `PayoutService.createFromSettlement()` reads commission from escrow when available, falls back to recalculation only for legacy orders without commission data.

## Fix 5 — Escrow Guard Weakness
- **File**: `apps/api/src/modules/escrow/escrow.controller.ts`
- **Problem**: Freeze, refund, and reopen endpoints on `EscrowController` had no role guard — any authenticated user could manipulate escrow state.
- **Fix**: Added `@UseGuards(RolesGuard)` + `@Roles('ADMIN', 'SUPER_ADMIN')` decorators to `freeze()`, `refund()`, and `reopen()` endpoints.

## Fix 6 — SQL Injection
- **File**: `apps/api/src/modules/malware/malware-event.service.ts`
- **Problem**: `incrementCounters()` used raw ClickHouse `exec()` with string interpolation (`${eventType}`) — parameter injection vulnerability.
- **Fix**: Changed to `query()` with parameterized syntax (`{eventType:String}`). ClickHouse safely substitutes named parameters.

## Fix 7 — Roadmap Synchronization
- **Files**: `docs/architecture/00_FOUNDER_MASTER_ROADMAP.md`, `docs/architecture/21_ROADMAP.md`, `docs/architecture/22_PHASE_STATUS.md`
- **Problem**: Roadmap files were stale — Sprint 6I/6J/6L not reflected, outdated next phase references.
- **Fix**: `00_FOUNDER_MASTER_ROADMAP.md` updated to v2.1 (Sprint 6I/6J as COMPLETE, Sprint 6L as current, Sprint 7 as LOCKED). `21_ROADMAP.md` and `22_PHASE_STATUS.md` synchronized to match.

## Verification Results
| Check | Result |
|-------|--------|
| tsc (api) | 0 errors ✅ |
| tsc (web) | 0 errors ✅ |
| eslint | 0 errors (warnings only) ✅ |
| next build | 297 routes ✅ |

## Files Modified
| File | Fix |
|------|-----|
| `apps/api/src/modules/payment/payment.service.ts` | 1 — Webhook BOOKING_PAYMENT handler |
| `apps/api/src/modules/tradeserv/booking-financial-orchestrator.service.ts` | 1, 2, 3 — Event listener, payout, event type |
| `apps/api/src/modules/tradeserv/tradeserv.module.ts` | 2 — PayoutModule import |
| `apps/api/src/modules/escrow/escrow.service.ts` | 4 — Commission storage on release |
| `apps/api/src/modules/payout/payout.service.ts` | 4 — Commission read from escrow |
| `apps/api/src/modules/escrow/escrow.controller.ts` | 5 — RolesGuard on admin endpoints |
| `apps/api/src/modules/malware/malware-event.service.ts` | 6 — Parameterized ClickHouse query |
| `docs/architecture/00_FOUNDER_MASTER_ROADMAP.md` | 7 — v2.1 sync |
| `docs/architecture/21_ROADMAP.md` | 7 — Sync |
| `docs/architecture/22_PHASE_STATUS.md` | 7 — Sync |

## Release Blocker Status
| Blocker | Status |
|---------|--------|
| Booking payment escrow creation | FIXED |
| Payout not created for professionals | FIXED |
| Escrow event type mismatch | FIXED |
| Commission double-calculation | FIXED |
| Escrow admin endpoints unguarded | FIXED |
| SQL injection in ClickHouse query | FIXED |
| Roadmap files out of sync | FIXED |

**Phase 2 Release Blockers: ALL RESOLVED**
