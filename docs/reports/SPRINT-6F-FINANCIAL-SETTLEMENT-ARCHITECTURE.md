# Sprint 6F — Financial Settlement Foundation
## Architecture & Planning Document v1.0

**Date:** 2026-07-22
**Author:** Sprint 6F Architecture Audit
**Status:** PENDING FOUNDER APPROVAL
**Next:** Implementation Sprint 6G (starts only after approval)

---

## Executive Summary

This document contains 13 deliverables across 3 phases — Audit, Analysis, and Design — for the Financial Settlement Foundation. The goal is to unify existing financial modules (Escrow, Payment, Commission, Settlement, GoCash, Membership) into an integrated end-to-end financial settlement pipeline for the TradeServ booking marketplace.

**Core Problem:** Six financial modules exist today with no unified transaction pipeline. A TradeServ booking flows through:

1. `tradeserv.service.ts` → `Booking.createBookingPaymentOrder()` → Razorpay
2. No automated commission deduction
3. No automated escrow hold
4. No automated settlement after booking completion
5. No GoCash reward trigger from booking completion
6. No notification on booking payment failure to professional

**Key Finding:** All modules exist but are **disconnected**. The architecture sprint reveals zero new Prisma models are needed — only integration wiring and 4 new service-level orchestrations.

---

## Phase 1 — Audit (Deliverables 1–6)

### D1 — Booking Payment Flow Audit

**Source:** `apps/api/src/modules/tradeserv/tradeserv.service.ts` — `createBookingPaymentOrder()` and `verifyBookingPayment()`

#### Current Flow:

```
POST /tradeserv/bookings (registerProfessional)
  → Creates Booking with PENDING + PENDING

POST /tradeserv/bookings/:id/pay (createBookingPaymentOrder)
  → Validates: Booking exists, status=PENDING, paymentStatus=PENDING, not cancelled
  → Validates: professional has minimum 1 service (no service-less bookings)
  → Calls PaymentService.createPaymentOrder(gateway='RAZORPAY', amount=booking.amount, type=BOOKING_PAYMENT, bookingId)
  → Returns { gatewayOrderId, amount, currency, id }

POST /tradeserv/bookings/:id/verify (verifyBookingPayment)
  → Validates: Booking exists, paymentStatus=PENDING
  → Calls PaymentService.verifyPayment(booking.paymentId, gatewayPaymentId, gatewaySignature)
  → On success: updates booking.paymentStatus=PAID, booking.status=CONFIRMED
  → On failure: sends BOOKING_PAYMENT_FAILED notification to professional
```

#### Data Flow:
| Step | Module | Action | Status |
|------|--------|--------|--------|
| 1 | TradeservService | Create booking | ✅ Done |
| 2 | PaymentService | Create payment order | ✅ Done |
| 3 | Razorpay | Process payment | ✅ Done |
| 4 | PaymentService | Verify payment | ✅ Done |
| 5 | TradeservService | Update booking status | ✅ Done (CONFIRMED) |
| - | EscrowService | Hold in escrow | ❌ MISSING |
| - | TradeservService | Notify professional | ✅ Done (Phase 6E: BOOKING_PAYMENT_FAILED) |

#### Gaps:
1. **No escrow hold** after payment verification — money goes to merchant account directly
2. **No professional notification on success** — only failure is notified
3. **No GoCash reward** for booking payment (separate from completion reward)
4. **No commission calculation** at payment time

---

### D2 — Commission Engine Audit

**Source:** `apps/api/src/modules/commission/`

#### Existing Components:

| Component | Lines | Purpose |
|-----------|-------|---------|
| `CommissionService` | ~300 | CRUD for commission rules + calculation |
| `CommissionRule` Prisma model | — | `commissionType`, `rate`, `minFee`, `maxFee`, `categoryId`, `minTransactionAmount`, `maxTransactionAmount`, `priority`, `isActive` |
| `CommissionType` enum | — | `PERCENTAGE`, `FIXED` |
| `CommissionPlan` model | — | Global override plan |

#### Key Methods:
- `calculateCommission(amount, categoryId?, companyId?)` — applies highest-priority matching rule
- `getApplicableRule(amount, categoryId?, companyId?)` — rule resolution
- `createRule()`, `updateRule()`, `deleteRule()`, `listRules()`

#### Gaps:
1. **No integration point** — CommissionService is not called anywhere in the booking pipeline
2. **No commission deduction** from payment/escrow — calculated amount is never applied
3. **No commission ledger** — no record of commissions earned/collected per booking
4. **No seller commission visibility** — no endpoint for professionals to see commission breakdown

---

### D3 — Settlement Engine Audit

**Source:** `apps/api/src/modules/settlement/`

#### Existing Components:

| Component | Lines | Purpose |
|-----------|-------|---------|
| `SettlementService` | ~400 | CRUD + process settlements |
| `SettlementCycleService` | ~200 | Batch settlement cycles |
| `SettlementExportService` | ~150 | CSV/Excel export |
| `SettlementReportService` | ~150 | Settlement reports |

#### Prisma Models:
| Model | Key Fields | Status |
|-------|-----------|--------|
| `Settlement` | escrowId, amount, status, processedAt, retryCount | ✅ Exists |
| `SettlementBatch` | — | ❌ Does not exist |
| `SettlementEvent` | settlementId, type, metadata | ✅ Exists |
| `SettlementRule` | — | ❌ Does not exist |

#### Gaps:
1. **Settlement is only escrow-triggered** — no TradeServ booking settlement path
2. **No settlement trigger** from TradeServ booking completion
3. **No settlement batch** concept — bulk settlement processing missing
4. **No settlement rule** — scheduling/auto-processing without manual intervention
5. **No payout model** — `Payout` model referenced in `Settlement.payouts` relation but not yet queryable from TradeServ

---

### D4 — Escrow Module Audit

**Source:** `apps/api/src/modules/escrow/`

#### Existing Components:

| Component | Lines | Purpose |
|-----------|-------|---------|
| `EscrowController` | ~180 | 8 endpoints (create, hold, release, refund, dispute-hold, get, list, analytics) |
| `EscrowService` | ~500 | hold/release/refund/dispute-hold + state machine |
| `EscrowAnalyticsService` | ~200 | Escrow analytics |
| `EscrowEvent` model | — | Timeline of escrow state changes |

#### Key Methods:
- `hold(orderId)` — Creates or confirms escrow hold
- `release(escrowId)` — Releases funds to seller
- `refund(escrowId)` — Returns funds to buyer
- `disputeHold(escrowId)` — Freezes on dispute
- `getEscrowAnalytics()` — Dashboard data

#### State Machine:
```
PENDING → HELD → RELEASED (success)
               → REFUNDED (cancel/dispute lost)
               → DISPUTED → FROZEN → MANUAL_REVIEW → RELEASED or REFUNDED
               → CANCELLED
               → FAILED
```

#### Gaps:
1. **No Booking → Escrow integration** — `hold()` is never called from TradeServ
2. **No auto-release** on booking completion — release must be manual today
3. **No GoCash amount tracking** — `goCashAmount` field exists but is populated by Settlement only
4. **No escrow creation endpoint for bookings** — only order-based escrow exists

---

### D5 — Payment Module Audit

**Source:** `apps/api/src/modules/payment/`

#### Existing Components:

| Component | Lines | Purpose |
|-----------|-------|---------|
| `PaymentService` | 631 | 15+ methods: create, verify, refund, webhook |
| Razorpay Gateway | ~200 | Razorpay SDK integration |
| Stripe Gateway | ~200 | Stripe SDK integration |
| `PaymentWebhookController` | — | Razorpay webhooks |
| `SubscriptionController` | — | Membership subscription payments |

#### Key Models:
| Model | Key Fields |
|-------|-----------|
| `Payment` | id, companyId, type, gateway, status, gatewayOrderId, gatewayPaymentId, amount, currency, fee, tax, orderId, rfqCreditPackId |
| `Refund` | paymentId, gatewayRefundId, amount, reason, status |

#### Payment Types (enum):
`ORDER_PAYMENT`, `CREDIT_PACK_PURCHASE`, `SUBSCRIPTION`, `REFUND`, `PAYOUT`, `BOOKING_PAYMENT`

#### Key Methods:
- `createPaymentOrder(gateway, amount, type, metadata)` — creates gateway order + Payment record
- `verifyPayment(paymentId, gatewayPaymentId, gatewaySignature)` — verifies signature
- `createRefund(paymentId, amount, reason)` — initiates refund
- `processRefund(refundId)` — processes via gateway
- `handleWebhook(event)` — processes Razorpay webhooks

#### Gaps:
1. **No PAYOUT type processing** — `PAYOUT` exists in enum but no implementation path
2. **No fee/tax calculation** — fee and tax fields exist but are never populated for booking payments
3. **No webhook handler for booking payments** — only order/subscription webhooks
4. **No payment-to-escrow bridge** — after verification, no automatic escrow creation/hold

---

### D6 — GoCash/Idempotency Audit

**Source:** `apps/api/src/modules/gocash/` + `apps/api/src/modules/gocash-integration/`

#### Existing Components:

| Component | Lines | Purpose |
|-----------|-------|---------|
| `GocashService` | ~400 | 14 methods: credit, debit, reverse, redeem, getBalance, etc. |
| `GocashIntegrationService` | ~200 | 10+ reward methods with idempotency |
| `CatalogRewardsService` | ~150 | Catalog-specific rewards |
| `GOCASH_Wallet` model | — | companyId, balance, status |
| `GOCASH_Transaction` model | — | walletId, type, amount, direction, idempotencyKey, status |

#### Idempotency Pattern:
```
idempotencyKey = `${REFERENCE_TYPE}_${refId}_${userId}`
verifyIdempotency(key) → if exists, return existing transaction (no-op)
credit(walletId, amount, type, idempotencyKey) → create transaction
```

#### Existing TRADESERV Reward Constants (Phase 6E):
| Event | Amount | Trigger |
|-------|--------|---------|
| BOOKING_COMPLETED | 50 | Booking status → COMPLETED |
| REVIEW_SUBMITTED | 25 | Review created |
| PROFESSIONAL_SIGNUP | 100 | Professional registered |

#### Gaps:
1. **No GoCash payment integration** — wallet cannot be used to pay for bookings
2. **No GoCash discount** — no `goCashAmount` deduction at checkout
3. **No commission payout via GoCash** — commission could be credited/paid via wallet
4. **No GoCash settlement integration** — `goCashAmount` on Escrow model is never populated from TradeServ

---

## Phase 2 — Analysis (Deliverables 7–8)

### D7 — Prisma Schema Audit

**Full Model Inventory (Financial):**

| # | Model | Relations | Key Purpose | Status |
|---|-------|-----------|-------------|--------|
| 1 | `Payment` | → Company, Order, RfqCreditPack, Refund[], Invoice | Payment gateway records | ✅ |
| 2 | `Escrow` | → Order, Buyer, Seller, EscrowEvent[], Settlement[], Dispute[] | Order-level escrow | ✅ |
| 3 | `Settlement` | → Escrow, SettlementEvent[], Payout[] | Escrow settlement | ✅ |
| 4 | `CommissionRule` | standalone | Commission rate config | ✅ |
| 5 | `CommissionPlan` | → Company[], CommissionRate[] | Plan-level commission | ✅ |
| 6 | `Invoice` | → Company, Payment, InvoiceItem[], TaxBreakdown[] | GST invoices | ✅ |
| 7 | `Refund` | → Payment, OrderReturn | Gateway refunds | ✅ |
| 8 | `GOCASH_Wallet` | standalone | Wallet balance | ✅ |
| 9 | `GOCASH_Transaction` | → GOCASH_Wallet | Ledger entries | ✅ |
| 10 | `Booking` | → Company (pro), Company (client), Service | TradeServ bookings | ✅ |
| 11 | `Dispute` | → Order, Escrow, Companies, DisputeMessage[], Evidence[] | Full dispute lifecycle | ✅ |
| 12 | `Payout` | referenced by Settlement | **Unused/empty** | ⚠️ |
| 13 | `SettlementBatch` | — | **Does not exist** | ❌ |
| 14 | `SettlementRule` | — | **Does not exist** | ❌ |

#### Critical Gap Analysis:

| Gap | Impact | Severity |
|-----|--------|----------|
| No `SettlementBatch` model | No bulk settlement processing | HIGH |
| No `SettlementRule` model | No auto-settlement scheduling | HIGH |
| `Payout` model exists but empty | Payout functionality unavailable | MEDIUM |
| `Booking` has no escrowId | Booking ↔ Escrow link missing | HIGH |
| `Booking` has no commissionId | Commission record not linked to booking | MEDIUM |
| No booking-level invoice link | GST/invoice not generated for bookings | MEDIUM |
| No `BookingPayment` subtotal/fee/tax fields | No fee breakdown per booking | LOW |

#### Recommended Schema Changes (Implementation Sprint):
1. Add `escrowId String?` to `Booking` model → `@relation("BookingEscrow")`
2. Add `commissionId String?` to `Booking` model
3. Create `SettlementBatch` model (id, type, status, totalAmount, count, processedAt)
4. Create `SettlementRule` model (id, frequency, dayOfWeek/Month, type, isActive)

---

### D8 — Notification Audit

**TradeServ-Relevant Notification Types (existing, from Prisma `NotificationType` enum):**

| Type | Used In | Status |
|------|---------|--------|
| `BOOKING_CONFIRMED` | tradeserv.service (confirm/cancel) | ✅ |
| `BOOKING_CANCELLED` | tradeserv.service (cancel) | ✅ |
| `BOOKING_REMINDER` | — | ⚠️ Unused |
| `BOOKING_COMPLETED` | tradeserv.service (complete) | ✅ |
| `BOOKING_PAYMENT_FAILED` | tradeserv.service (verify fail) | ✅ (Phase 6E) |
| `ESCROW_HELD` | escrow.service | ✅ |
| `ESCROW_FROZEN` | escrow.service | ✅ |
| `ESCROW_REOPENED` | escrow.service | ✅ |
| `PAYMENT_RECEIVED` | — | ⚠️ Unused |
| `PAYMENT_REFUNDED` | — | ⚠️ Unused |
| `SETTLEMENT_COMPLETED` | — | ⚠️ Unused |
| `REVIEW_SUBMITTED` | tradeserv.service (createReview) | ✅ (Phase 6E) |

#### Notification Template Gaps:
| Missing Template | Priority |
|-----------------|----------|
| `PAYMENT_RECEIVED` | HIGH (booking payment received) |
| `PAYMENT_REFUNDED` | HIGH (booking refund processed) |
| `SETTLEMENT_COMPLETED` | MEDIUM (settlement payout to professional) |
| `BOOKING_REMINDER` | LOW (upcoming booking reminder) |
| `COMMISSION_DEDUCTED` | MEDIUM (professional notified of commission) |

#### Cast Pattern Audit:
- Sprint 6E eliminated all `as any` casts for notification types in tradeserv module — all use `NotificationType.TYPE`
- EscrowService still has 1+ `as any` cast — needs cleanup in implementation sprint

---

## Phase 3 — Design (Deliverables 9–13)

### D9 — Gap Analysis

#### Summary Matrix:

| Domain | Existing | Missing | Priority |
|--------|----------|---------|----------|
| Booking → Payment | createPaymentOrder(), verifyPayment() | → Escrow hold | P0 |
| Booking → Commission | — | Auto-calculate + deduct | P0 |
| Booking → Settlement | — | Auto-settle on completion | P0 |
| Booking → GoCash | BOOKING_COMPLETED reward | Payment via wallet | P1 |
| Booking → Notification | Success/Failure/Complete | PAYMENT_RECEIVED, SETTLEMENT_COMPLETED | P1 |
| Booking → Invoice | — | GST invoice generation | P2 |
| Booking → Commission | — | Commission ledger + visibility | P2 |
| Escrow → TradeServ | Order-based escrow | Booking-based escrow | P0 |
| Settlement → Batch | Single settlement | Bulk batch processing | P2 |
| GoCash → Payment | Idempotent credit | Wallet payment at checkout | P3 |

#### P0 Gaps (Blocking):
1. **No escrow hold after booking payment verification** — client pays, money goes direct
2. **No commission calculation/deduction in booking pipeline**
3. **No settlement after booking completion** — professional never gets paid out

#### P1 Gaps (High Impact):
4. **No PAYMENT_RECEIVED notification** for booking
5. **No SETTLEMENT_COMPLETED notification** for professional payout
6. **No `Payout` model usage** — payout functionality is dead code

#### P2 Gaps (Medium Impact):
7. **No `SettlementBatch` model** for bulk processing
8. **No `SettlementRule` model** for auto-scheduling
9. **No booking invoice** — GST compliance gap
10. **No commission ledger** — professional visibility gap

#### P3 Gaps (Low Impact Immediate):
11. **No wallet payment option** at booking checkout
12. **No GoCash discount** on booking amount

---

### D10 — Architecture Design

#### Proposed Unified Settlement Pipeline:

```
BOOKING CREATED (status=PENDING, paymentStatus=PENDING)
  │
  ▼
PAYMENT ORDER CREATED (PaymentService.createPaymentOrder)
  │ gateway: RAZORPAY, type: BOOKING_PAYMENT
  │ metadata: { bookingId, serviceId }
  ▼
CLIENT PAYS (Razorpay)
  │
  ▼
PAYMENT VERIFIED (PaymentService.verifyPayment)
  │
  ├──▶ BOOKING STATUS = CONFIRMED
  ├──▶ NOTIFICATION: PAYMENT_RECEIVED (client + professional)
  ├──▶ (NEW) ESCROW HELD (EscrowService.holdFromBooking)
  │       → Creates/associates Escrow record
  │       → Links escrow.id → Booking.escrowId
  └──▶ (NEW) COMMISSION CALCULATED (CommissionService.calculate)
           → Creates CommissionSnapshot record (not new model, just metadata)
           → Stores: grossAmount, commissionRate, commissionAmount, netAmount
           → Notification: (future) COMMISSION_DEDUCTED

BOOKING COMPLETED (status=COMPLETED)
  │
  ├──▶ GOCASH REWARD: BOOKING_COMPLETED (50) (EXISTING - Phase 6E)
  ├──▶ (NEW) SETTLEMENT TRIGGERED (SettlementService.createFromBooking)
  │       → Creates Settlement record linked to escrow
  │       → Processes: gross - commission = net payout
  │       → Settlement status = PROCESSING → PROCESSED
  ├──▶ (NEW) NOTIFICATION: SETTLEMENT_COMPLETED (professional)
  ├──▶ (NEW) ESCROW RELEASED (EscrowService.releaseFromBooking)
  │       → Escrow status = RELEASED
  │       → releasedAt = now()
  └──▶ (NEW) INVOICE GENERATED (InvoiceService.createFromBooking)
           → Creates GST invoice for booking

BOOKING CANCELLED (before payment)
  → No financial impact

BOOKING CANCELLED (after payment, before completion)
  ├──▶ ESCROW REFUNDED (EscrowService.refund)
  ├──▶ NOTIFICATION: PAYMENT_REFUNDED
  └──▶ BOOKING status = CANCELLED, paymentStatus = REFUNDED

DISPUTE RAISED
  → Existing Dispute module handles (already integrated with Escrow)
```

#### Module Interaction Diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADESERV MODULE                              │
│  tradeserv.service.ts                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ createBookingPaymentOrder() → PaymentService             │    │
│  │ verifyBookingPayment() → [PaymentService, EscrowService] │    │
│  │ completeBooking() → [GocashIntegration, Settlement, Escrow]│   │
│  │ cancelBooking() → [EscrowService, PaymentService]        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │           │           │           │
          ▼           ▼           ▼           ▼
┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ PAYMENT    │ │ ESCROW   │ │ COMMISSION│ │ SETTLEMENT   │
│ MODULE     │ │ MODULE   │ │ MODULE   │ │ MODULE       │
│            │ │          │ │          │ │              │
│ createOrder│ │ hold()   │ │ calculate│ │ createFrom-  │
│ verify()   │ │ release()│ │ snapshot │ │ Booking()    │
│ refund()   │ │ refund() │ │ ledger   │ │ process()    │
└────────────┘ └──────────┘ └──────────┘ └──────────────┘
          │                                         │
          ▼                                         ▼
┌────────────────┐                     ┌────────────────────┐
│ GOCASH MODULE  │                     │ NOTIFICATION MODULE│
│                │                     │                    │
│ credit()       │                     │ createWithTemplate│
│ debit()        │                     │ send()             │
│ verifyIdempo-  │                     │                    │
│ tency()        │                     │                    │
└────────────────┘                     └────────────────────┘
```

#### Orchestration Layer (NEW):

Create a single **`BookingFinancialOrchestratorService`** that:
- Is injected into `tradeserv.service.ts`
- Coordinates the multi-step financial pipeline
- Uses `.catch(logger.warn)` for non-critical steps (notifications, rewards)
- Throws/rolls back for critical steps (escrow, settlement)
- Maintains idempotency via bookingId-based idempotency keys

```
BookingFinancialOrchestratorService
├── processPaymentVerified(bookingId, paymentId)
│   ├── escrowService.hold(bookingId, amount)
│   ├── commissionService.calculate(amount, categoryId)
│   └── notificationService.send(PAYMENT_RECEIVED)
│
├── processBookingCompleted(bookingId)
│   ├── settlementService.createFromBooking(bookingId)
│   ├── escrowService.release(escrowId)
│   ├── gocashIntegration.awardBookingCompleted(bookingId, userId)
│   └── notificationService.send(SETTLEMENT_COMPLETED)
│
└── processBookingCancelled(bookingId)
    ├── escrowService.refund(escrowId)
    └── notificationService.send(PAYMENT_REFUNDED)
```

---

### D11 — Data Model Design

#### Changes to Existing Models (Implementation Sprint):

**Model: `Booking`** (+2 fields)
```prisma
  escrowId     String?  // NEW — link to Escrow record
  escrow       Escrow?  @relation("BookingEscrow", fields: [escrowId], references: [id])
  commissionSnapshot Json?  // NEW — { grossAmount, rate, commissionAmount, netAmount }
```

**Model: `Escrow`** (+1 relation)
```prisma
  booking Booking?  @relation("BookingEscrow")  // NEW — reverse relation
```

**Model: `Settlement`** (+1 field, no new models needed immediately)
```prisma
  bookingId String?  // NEW — direct link to booking (optional, can navigate via escrow)
```

#### New Models (Implementation Sprint):

**Model: `SettlementBatch`**
```prisma
model SettlementBatch {
  id          String        @id @default(uuid())
  type        String        // MANUAL, SCHEDULED, THRESHOLD
  status      SettlementBatchStatus @default(PENDING)
  totalAmount Decimal       @db.Decimal(14, 2)
  totalCount  Int           @default(0)
  processedCount Int        @default(0)
  failedCount  Int          @default(0)
  processedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  settlements Settlement[]

  @@index([status])
  @@index([createdAt])
}

enum SettlementBatchStatus {
  PENDING
  PROCESSING
  COMPLETED
  PARTIALLY_COMPLETED
  FAILED
}
```

**Model: `SettlementRule`**
```prisma
model SettlementRule {
  id          String   @id @default(uuid())
  frequency   String   // DAILY, WEEKLY, BIWEEKLY, MONTHLY
  dayOfWeek   Int?     // 0=Sunday, 1=Monday, ... (for WEEKLY)
  dayOfMonth  Int?     // 1-31 (for MONTHLY)
  type        String   // BOOKING, ORDER, ALL
  minAmount   Decimal? @db.Decimal(14, 2)  // minimum to trigger
  isActive    Boolean  @default(true)
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive, frequency])
}
```

#### No New Models Needed (Reuse Existing):
| Requirement | Existing Model |
|-------------|----------------|
| Commission record | `CommissionRule` + metadata in `Booking.commissionSnapshot` |
| Payout to professional | `Payout` model (already exists, needs wiring) |
| Refund tracking | `Refund` model (already exists) |
| Invoice/ GST | `Invoice` model (already exists for subscriptions) |
| Audit log | `AuditLog` model (already exists) |

---

### D12 — API Contract Design

#### New Endpoints (Implementation Sprint):

```yaml
# TradeServ Booking Financial Endpoints

POST /tradeserv/bookings/:id/pay:
  description: Create payment order + escrow hold (extended)
  body: { gateway: RAZORPAY | STRIPE }
  response: { gatewayOrderId, amount, currency, escrowId, paymentId }
  auth: BUYER
  changes: Returns escrowId in response

POST /tradeserv/bookings/:id/verify:
  description: Verify payment + hold escrow
  body: { gatewayPaymentId, gatewaySignature }
  response: { bookingStatus, paymentStatus, escrowStatus }
  auth: BUYER
  changes: Creates Escrow record on successful verification

POST /tradeserv/bookings/:id/complete:
  description: Mark booking complete + trigger settlement
  response: { bookingStatus, settlementStatus, escrowStatus, rewards: [...], notification: boolean }
  auth: PROFESSIONAL
  changes: Triggers settlement + escrow release + GoCash reward

GET /tradeserv/bookings/:id/financials:
  description: Get financial breakdown for booking
  response: { 
    grossAmount, commissionRate, commissionAmount, netAmount,
    escrowId, escrowStatus, settlementId, settlementStatus,
    paymentId, paymentStatus, invoices: [...], rewards: [...]
  }
  auth: PROFESSIONAL, BUYER, ADMIN

# Admin Settlement Endpoints

GET /admin/settlements:
  description: List settlements with filters
  query: { status, type, fromDate, toDate, page, limit }
  auth: ADMIN

POST /admin/settlements/batch:
  description: Create settlement batch
  body: { settlementIds: string[] }
  auth: ADMIN

POST /admin/settlement-rules:
  description: Create settlement rule
  auth: ADMIN

GET /admin/settlement-rules:
  description: List settlement rules
  auth: ADMIN

# Commission Endpoints

GET /tradeserv/commission/rules:
  description: View applicable commission rules
  auth: ADMIN

GET /seller/tradeserv/earnings:
  description: Professional earning summary
  response: { 
    totalGross, totalCommission, totalNet, 
    pendingSettlement, settledAmount,
    bookingsCount, periodStart, periodEnd
  }
  auth: SELLER (professional)
```

#### Modified Endpoints:

```yaml
GET /tradeserv/bookings/:id:
  changes: Include 'financials' embed with escrow/settlement/payment summary
  
GET /admin/tradeserv/bookings/stats:
  changes: Include financial stats (totalCommission, totalSettled, pendingPayouts)
  
GET /seller/tradeserv/stats:
  changes: Include earning stats
```

---

### D13 — Migration Strategy

#### Phase 1: Core Pipeline (P0 — Implementation Sprint 6G)

| Step | Change | Risk | Rollback |
|------|--------|------|----------|
| 1 | Add `escrowId` to Booking model | LOW — nullable, no existing data affected | Prisma migrate down |
| 2 | Create `SettlementBatch` + `SettlementRule` models | LOW — net new tables | Prisma migrate down |
| 3 | Create `BookingFinancialOrchestratorService` | LOW — new service, no existing code changed | Remove service |
| 4 | Wire escrow hold into `verifyBookingPayment()` | MEDIUM — changes payment flow | Revert wiring, keep service |
| 5 | Wire settlement + escrow release into `updateBookingStatus(COMPLETED)` | MEDIUM — changes completion flow | Revert wiring |

#### Phase 2: Notifications & Rewards (P1 — Sprint 6H)

| Step | Change | Risk | Rollback |
|------|--------|------|----------|
| 6 | Add PAYMENT_RECEIVED, SETTLEMENT_COMPLETED notification templates | LOW — templates only | Remove templates |
| 7 | Wire PAYMENT_RECEIVED after payment verified | LOW — non-critical | Remove call |
| 8 | Wire SETTLEMENT_COMPLETED after settlement processed | LOW — non-critical | Remove call |
| 9 | Wire Payout model for professional payouts | MEDIUM — financial impact | Manual payout revert |

#### Phase 3: Invoicing & Ledger (P2 — Sprint 6I)

| Step | Change | Risk | Rollback |
|------|--------|------|----------|
| 10 | Create booking invoice on completion | LOW — invoice generation only | Void invoice |
| 11 | Create commission ledger view for professionals | LOW — read-only endpoint | Remove endpoint |
| 12 | Add `SettlementBatch` processing job | MEDIUM — scheduled job | Disable job |

#### Phase 4: GoCash Wallet Payment (P3 — Future)

| Step | Change | Risk | Rollback |
|------|--------|------|----------|
| 13 | Allow wallet balance at booking checkout | MEDIUM — payment flow change | Disable wallet option |
| 14 | GoCash discount/deduction on booking amount | MEDIUM — financial calc change | Disable discount |

#### Data Migration:
```sql
-- No data migration needed for Phase 1 — all new fields are nullable
-- Existing bookings: escrowId = null (no escrow for past bookings)
-- Future bookings: escrowId populated
```

#### Rollback Plan:
1. **Schema rollback:** `prisma migrate down` for each phase
2. **Service rollback:** Remove orchestrator injection, revert to direct calls
3. **Endpoint rollback:** Remove new endpoints, old endpoints unchanged
4. **Data integrity:** All new columns nullable — no data loss on rollback

---

## Implementation Estimate

| Sprint | Scope | Estimated Files | Risk |
|--------|-------|-----------------|------|
| 6G | Core Pipeline (escrow + commission + settlement) | 8–12 files | MEDIUM |
| 6H | Notifications + Rewards + Payouts | 5–8 files | LOW |
| 6I | Invoicing + Ledger + Batch Processing | 6–10 files | LOW |
| Future | GoCash Wallet Payment | 4–6 files | MEDIUM |

## Dependencies
- All modules already exist — no new library installations
- `prisma generate` after schema changes
- No new infrastructure (no new queues, no new databases)
- No external API changes (Razorpay webhook format unchanged)

## Risks
1. **Escrow + Booking dual state machine** — Booking status and Escrow status must stay in sync
2. **Idempotency** — verifyBookingPayment could be called twice; must not double-hold escrow
3. **Partial failure** — settlement succeeds but notification fails; must not roll back settlement
4. **Commission rule ambiguity** — multiple rules may match; must define priority resolution

## Approval

**Founder:** __________________________ **Date:** ______________________

- [ ] Approved — proceed to Sprint 6G Implementation
- [ ] Approved with changes (see comments)
- [ ] Rejected (see comments)
