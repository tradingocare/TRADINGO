# Sprint 6I — Refund & Dispute Foundation

## Status
**COMPLETE** (2026-07-22)

## Summary
Extended the existing Dispute module and built RefundEngineService to support booking refunds and disputes. All infrastructure is wired — GOCASH rewards, notification templates, settlement pause/resume, and admin endpoints.

## Changes

### Prisma Schema
| Change | Details |
|--------|---------|
| `Dispute.bookingId` | Added `String?` with `@relation` to Booking + `@@index([bookingId])` |
| `Dispute.orderId` | Changed from `String` to `String?` (optional — booking disputes don't have orders) |
| `Dispute.order` relation | Changed from required to optional (`Order?`) |
| `Booking.disputes` | Added opposite relation field `Dispute[]` |
| `SettlementStatus` | Added `PAUSED` value |

### Backend — New Module (3 files)
**`apps/api/src/modules/refund/`**
- `refund-engine.service.ts` — `processBookingRefund()` with gateway refund, escrow handling, booking status update, events + audit
- `refund-engine.controller.ts` — 4 endpoints: `POST /refund/booking/:bookingId`, `GET /refund/history`, `POST /refund/approve`, `GET /refund/stats`
- `refund.module.ts` — imports PrismaModule + PaymentModule, registered in AppModule

### Backend — Extended Modules
| File | Changes |
|------|---------|
| `dispute/dispute.service.ts` | Added `createBookingDispute()`; fixed 2 null-safe escrow lookups for optional `orderId` |
| `dispute/dispute.controller.ts` | Added `POST /companies/:companyId/disputes/booking` |
| `dispute/dto/dispute.dto.ts` | Added `CreateBookingDisputeDto` |
| `dispute/admin.service.ts` | Added `listBookingDisputes()`, `getBookingDisputesStats()` |
| `tradeserv/booking-financial-orchestrator.service.ts` | Added `pauseSettlement()`, `resumeSettlement()` |

### Module Registration
- `RefundModule` registered in `app.module.ts` (after CommissionModule)

### Dependencies
- `RazorpayService` (from PaymentModule) for gateway refunds
- `NotificationService` (Global) for dispute/refund notifications
- `EventEmitter2` for domain events
- `CommissionEngineService` (reused from Sprint 6H)
- `EscrowService.refund()` — existing method reused

## Verification
- prisma validate ✅
- prisma generate ✅
- tsc api 0 errors ✅
- tsc web 0 errors ✅
- next build ✅ (no new routes — all endpoints are API-only)

## Key Design Decisions
1. **Booking disputes reuse existing 12-status Dispute state machine** — no new dispute statuses
2. **`orderId` made optional** — cleanest approach, booking disputes simply don't have one
3. **RefundEngineService is standalone** — does NOT depend on PaymentService; calls RazorpayService directly for gateway refunds
4. **BookingFinancialOrchestrator** extended (not duplicated) with pause/resume
5. **Failure isolation** — notification/event failures never rollback the transaction (`.catch(logger.warn)`)

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/companies/:companyId/disputes/booking` | CompanyOwner | Create booking dispute |
| POST | `/refund/booking/:bookingId` | ADMIN | Process booking refund |
| GET | `/refund/history` | ADMIN | Paginated refund history |
| GET | `/refund/stats` | ADMIN | Refund statistics |
| POST | `/refund/approve` | ADMIN | Approve/reject manual refund |

## Next Steps
- Sprint 6J — Awaiting Founder review and approval
- Wire booking dispute creation in TradeServ frontend
