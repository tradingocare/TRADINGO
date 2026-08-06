# TRADEPAY Enterprise Payment Infrastructure Audit

> Phase E1 — Audit Date: 2026-07-19
> Scope: Full codebase analysis of all payment-related modules, models, queues, security, frontend, and integrations
> Status: AUDIT COMPLETE — 6 domains, 52+ files, 131+ endpoints, 61 Prisma models, 72 enums

---

## 1. Executive Summary

TRADINGO ships with a **fully built payment backend** covering Razorpay/Stripe gateway integration, order/cart checkout, subscription billing, GST invoicing, escrow holds, settlement processing, dispute resolution, credit/debit notes, trade credit, and GOCASH rewards wallet. The backend is **comprehensive** — 61 Prisma models, 72 enums, 131+ endpoints, 52+ files, 9+ services — but the **frontend is critically missing**: zero checkout pages, zero subscription purchase pages, zero admin payment/finance/wallet UIs.

### Domain Scores

| Domain | Score | Status |
|--------|-------|--------|
| Payment Gateway Integration | 90% | ✅ Robust — Razorpay + Stripe with HMAC webhooks |
| Order & Checkout Backend | 85% | ✅ Full state machine, location tracking, documents |
| Subscription & Membership Billing | 95% | ✅ 8 plans, invoicing, GST, coupons, referrals |
| Escrow & Settlement | 80% | ✅ Full hold/release pipeline with BullMQ cron |
| Dispute Resolution | 85% | ✅ 13-status state machine, admin arbitration, SLA |
| Finance & Credit Management | 75% | ✅ Credit limits, collections, notes, AI analysis |
| GOCASH Rewards Wallet | 90% | ✅ Append-only ledger, idempotent credit/debit |
| **Frontend Payment UI** | **5%** | 🔴 **CRITICAL — No checkout/subscription/payment pages** |
| **Admin Payment UI** | **0%** | 🔴 **CRITICAL — No admin payment/finance/wallet pages** |
| Payment Tracking & Analytics | 20% | 🟡 **No payment funnel events, no payment conversion metrics** |
| Payment Security | 85% | ✅ Good base — CSRF/HSTS/CSP/signature; ⚠️ CSRF+webhook conflict |
| Documentation | 10% | 🟡 **No payment architecture docs** |

---

## 2. Module-by-Module Audit

### 2.1 Payment Module (`apps/api/src/modules/payment/`)

| Metric | Value |
|--------|-------|
| Files | 19 `.ts` files |
| Lines of Code | ~1,200 |
| Services | `PaymentService` (605 lines, 8 methods), `PaymentAnalyticsService` (30 lines) |
| Controllers | `PaymentController` (71 lines, 6 endpoints), `PaymentWebhookController` (91 lines, 2 endpoints), `PaymentSubscriptionController` (93 lines, 5 endpoints), `PaymentAdminController` (120 lines, 4 endpoints) |
| DTOs | 4 files (CreatePaymentOrderDto, VerifyPaymentDto, CreateRefundDto, CreateSubscriptionOrderDto/VerifySubscriptionPaymentDto) |
| Gateways | RazorpayService (56 lines, implements IPaymentGateway), StripeService (86 lines, implements IPaymentGateway) |
| Total Endpoints | 17 |

**Key Features:**
- Gateway-agnostic factory pattern via `IPaymentGateway` interface + `getGateway()` factory
- Razorpay: Full implementation with HMAC-SHA256 signature + `timingSafeEqual`
- Stripe: Checkout Session creation + webhook `constructEvent()` verification
- Payment lifecycle: CREATE → VERIFY → CAPTURE → REFUND (with PARTIALLY_REFUNDED tracking)
- Webhook idempotency via `ProcessedWebhookEvent` model (eventId dedup)
- Auto-invoice generation on payment success
- Subscription payment + activation flow
- Credit pack purchase → RFQ credit ledger credits

**Issues:**
1. `PaymentService.createRefund()` manually updates `Payment.status` to `REFUNDED`/`PARTIALLY_REFUNDED` instead of using a dedicated refund state machine
2. Webhook path (line 503-521) skips notification for CREDIT_PACK_PURCHASE (unlike direct verify path)
3. Stripe uses `require('stripe')` (CommonJS) instead of ESM import

### 2.2 Order Module (`apps/api/src/modules/order/`)

| Metric | Value |
|--------|-------|
| Files | 11 `.ts` files |
| Lines of Code | ~1,450 |
| Services | `OrderService` (547 lines, 15 methods), `OrderNumberService` (69 lines), `OrderTimelineService` (35 lines), `OrderDocumentService` (48 lines), `OrderAnalyticsService` (54 lines) |
| Controllers | `OrderController` (214 lines, 19 endpoints) |
| DTOs | 9 classes in `order.dto.ts` (252 lines) |
| Total Endpoints | 19 |

**Key Features:**
- 11-status state machine (PENDING→CONFIRMED→PROCESSING→PACKED→...→COMPLETED)
- State-code-based order numbering (`TRD-{SC}-{YYMMDD}-{SEQ:4}`)
- Idempotency via `idempotencyKey` (unique)
- Per-location dispatch/delivery tracking
- Return/refund workflow (7-day window)
- Auto-creates Chat room on order creation
- Notifications on every status transition

**Issues:**
1. `CancelOrderDto.actor` defaults are confusing — buyer sends with ADMIN actor
2. Return approval does NOT trigger refund — manual PaymentService.createRefund() needed externally
3. No escalation path for unresolved returns

### 2.3 Billing & Invoice Module (`apps/api/src/modules/billing/`)

| Metric | Value |
|--------|-------|
| Files | 7 `.ts` files |
| Lines of Code | ~720 |
| Services | `BillingService` (73 lines), `InvoiceService` (246 lines), `TaxService` (73 lines), `PdfService` (132 lines) |
| Controllers | `BillingController` (89 lines, 5 endpoints), `BillingAdminController` (131 lines, 4 endpoints) |
| Total Endpoints | 9 |

**Key Features:**
- GST-compliant invoice generation (CGST 9% + SGST 9% intra-state, IGST 18% inter-state)
- Auto-incrementing invoice sequence (`TRD-INV-YYYY-SEQ`)
- Full tax breakdown model with TaxBreakdown per invoice
- Invoice PDF generation (HTML template, Buffer placeholder for real PDF library)
- Monthly GST reports for admin
- Void invoice workflow with history tracking

**Issues:**
1. `PdfService.generatePdfBuffer()` returns `Buffer.from(html)` — no actual PDF generation library installed
2. No `Invoice` PDF file — only HTML string returned
3. `TaxService` uses hardcoded 9%/18% — no configuration source for GST rates

### 2.4 Escrow Module (`apps/api/src/modules/escrow/`)

| Metric | Value |
|--------|-------|
| Files | 7 `.ts` files |
| Lines of Code | ~560 |
| Services | `EscrowService` (344 lines, 10 methods), `EscrowAnalyticsService` (64 lines) |
| Controllers | `EscrowController` (83 lines, 8 endpoints) |
| DTOs | 3 classes in `escrow.dto.ts` (18 lines) |
| Total Endpoints | 8 |

**Key Features:**
- Full escrow lifecycle: HOLD → RELEASE / REFUND / FREEZE / REOPEN
- Auto-release: 48 hours after delivery confirmation (via BullMQ cron)
- Seller dashboard with pending/released counts and release countdown
- Escrow freeze for dispute scenarios

**Issues:**
1. Escrow `release()` only release — no split payment or partial release support
2. No escrow-to-seller-payout integration — release only changes status, no actual money movement
3. BullMQ `EXPIRY_MONITOR` in escrow processor is a no-op (logs only)

### 2.5 Settlement Module (`apps/api/src/modules/settlement/`)

| Metric | Value |
|--------|-------|
| Files | 7 `.ts` files |
| Lines of Code | ~520 |
| Services | `SettlementService` (312 lines, 8 methods), `SettlementAnalyticsService` (57 lines) |
| Controllers | `SettlementController` (83 lines, 7 endpoints) |
| DTOs | 2 classes in `settlement.dto.ts` (23 lines) |
| Total Endpoints | 7 |

**Key Features:**
- Settlement lifecycle: CREATE → PROCESS / FAIL / RETRY / REOPEN
- Auto-retry with max 3 attempts (via BullMQ cron)
- Settlement events timeline (6 event types)
- Rate limiting with retry mechanism

**Issues:**
1. NO gateway payout integration — `process()` only updates status, doesn't call Razorpay Payouts API
2. Maximum retries (3) is hardcoded — no configurable retry policy
3. No settlement account management integration (SettlementAccount model mentioned but not wired)

### 2.6 Dispute Module (`apps/api/src/modules/dispute/`)

| Metric | Value |
|--------|-------|
| Files | 11 `.ts` files |
| Lines of Code | ~1,470 |
| Services | `DisputeService` (945 lines, 13 methods), `DisputeAnalyticsService` (59 lines), `AdminService` (52 lines), `AdminAssignmentService` (100 lines) |
| Controllers | `DisputeController` (127 lines, 11 endpoints) |
| DTOs | 7 classes in `dispute.dto.ts` (59 lines) |
| BullMQ Jobs | `EXPIRE_DISPUTES`, `EVIDENCE_REMINDER`, `NEGOTIATION_REMINDER`, `ARBITRATION_REMINDER`, `ADMIN_ARBITRATION`, `APPEAL_EXPIRY`, `ARBITRATION_SLA_BREACH` |
| Total Endpoints | 11 |

**Key Features:**
- 13-status state machine with legal status transitions mapped
- Timestamp tracking for all status changes (13 separate DateTime fields on Dispute model)
- Admin arbitration with round-robin + least-busy assignment strategies
- SLA breach detection (14-day arbitration window)
- Evidence management (max 10 files, 100MB total)
- Appeal workflow for resolved/rejected disputes
- Trust score penalty (10 points on RESOLVED/REFUNDED)
- BullMQ integration for 7 cron job types (expiry, reminders, arbitration, SLA)

**Issues:**
1. Evidence file size validation mentions 100MB but no actual file upload/storage — just URL recording
2. Escrow auto-refund on dispute resolution is synchronous — no independent verification
3. Trust score decrement is hardcoded (-10) — no configurable policy

### 2.7 Finance Module (`apps/api/src/modules/finance/`)

| Metric | Value |
|--------|-------|
| Files | 19 `.ts` files |
| Lines of Code | ~1,800 |
| Services | `CreditService` (146 lines, 12 methods), `CollectionsService` (112 lines, 7 methods), `CreditNoteService` (132 lines, 6 methods), `FinanceDashboardService` (84 lines, 2 methods), `RmFinanceService` (50 lines), `AiFinanceService` (273 lines, 10 methods) |
| Controllers | 8 controllers (42 endpoints) |
| DTOs | 6 files (27 DTOs) |
| Total Endpoints | 42 |

**Key Features:**
- Trade credit management (set limits, risk levels, approval workflow)
- Collections with aging reports (0-30/31-60/61-90/90+ day buckets)
- Credit notes with auto-numbering (`TRD-CN-YYYY-XXXXX`)
- Debit notes with same pattern (`TRD-DN-YYYY-XXXXX`)
- Finance dashboard with revenue/receivable/payable metrics
- Cash flow tracking (inflow vs outflow)
- Relationship Manager (RM) dashboards with collection performance
- AI-powered finance intelligence (10 methods via AiGateway)

**Issues:**
1. **No frontend pages** — zero admin finance UIs exist despite 42 endpoints
2. Collection aging only queries overdue payments — no integration with payment reminders
3. CreditNote/DebitNote `appliedAt` tracking exists but no accounting integration (no double-entry ledger update)
4. `AiFinanceService` uses hardcoded finance context — no real-time data aggregation

### 2.8 GOCASH Module (`apps/api/src/modules/gocash/`)

| Metric | Value |
|--------|-------|
| Files | 11 `.ts` files |
| Lines of Code | ~1,070 |
| Services | `GocashService` (597 lines, 16 methods) |
| Controllers | `GocashController` (160 lines, 17 endpoints) |
| DTOs | 5 files (7 DTOs) |
| Total Endpoints | 17 |

**Key Features:**
- Append-only ledger (CREDIT/DEBIT entries never mutate, only append)
- Idempotent transactions via `idempotencyKey`
- Wallet types: BUYER, SELLER, ADMIN
- 16 transaction types (SIGNUP_BONUS through ADMIN_CORRECTION)
- Balance calculation: `currentBalance = sum(CREBIT) - sum(DEBIT)` — always real-time computed
- Transaction reversal via `ADMIN_CORRECTION` (not mutation)
- Redemption workflow (PENDING→APPROVED/REJECTED)
- Admin wallet management (list, search, stats, fraud alerts)

**Issues:**
1. `GOCASH_Transaction` balanceBefore/balanceAfter set via `ledgerEntry.balanceAfter = balance.balance +` — race condition window exists without `$transaction` isolation (though Prisma serializes within transaction)
2. Redemption types include `CASH_WITHDRAWAL` but no actual payout integration exists
3. Fraud detection is basic (wallet-level, not behavioral)

### 2.9 Membership Module (`apps/api/src/modules/membership/`)

| Metric | Value |
|--------|-------|
| Files | 5 `.ts` files |
| Lines of Code | ~1,721 |
| Services | `MembershipService` (1,092 lines, 30+ methods) |
| Controllers | `MembershipController` (160 lines, 15 endpoints), `MembershipAdminController` (159 lines, 21 endpoints) |
| DTOs | `membership.dto.ts` (296 lines, 10 DTOs) |
| Total Endpoints | 36 |

**Key Features:**
- 8 plan tiers (TRAD UP→TRADE ELITE + TRADBUY + TRADE_PROFESSIONAL)
- Full plan CRUD with audit logging (field-level diffs via PlanAuditLog)
- Plan cloning + scheduled publishing/hiding
- Feature matrix management with PlanFeature model
- Addon management (PlanAddon model)
- Plan comparison + upgrade simulation
- Coupon validation (usage/plan/date/company-unique)
- Referral code validation
- Launch mode gating (DRAFT/LAUNCH/PUBLIC/ARCHIVED visibility)
- Subscription lifecycle (create → payment → activate → cancel)
- Grace period + auto-expire via BullMQ cron (3 subscription processors)
- Beta/invite code support

**Issues:**
1. `MembershipService.createOrder()` generates `ORD-` prefixed UUID but no real order number pattern
2. Coupon validation checks `maxUsage` but doesn't prevent concurrent race condition
3. No automatic plan renewal — relies entirely on BullMQ cron checking for expiry
4. Plan pricing is stored in cents (Int) but there's no currency formatting utility shared with frontend

### 2.10 Job Queue Infrastructure (`apps/api/src/jobs/`)

| Queue | Cron Jobs | Status |
|-------|-----------|--------|
| SUBSCRIPTION | CHECK_RENEWAL (30/15/7/3/1 day alerts), APPLY_GRACE (expire), AUTO_EXPIRE (14d grace) | ✅ 3 jobs |
| ESCROW | AUTO_RELEASE (process auto-release), EXPIRY_MONITOR (logs only) | ✅ 2 jobs |
| SETTLEMENT | PROCESS_SETTLEMENTS (batch), PROCESS_RETRIES (retry failed) | ✅ 2 jobs |
| DISPUTE | EXPIRE_DISPUTES (30d), EVIDENCE_REMINDER, NEGOTIATION_REMINDER, ARBITRATION_REMINDER, ADMIN_ARBITRATION (7d delayed), APPEAL_EXPIRY, ARBITRATION_SLA_BREACH (14d) | ✅ 7 jobs |

**Total: 4 queues, 14 cron/triggered jobs**

---

## 3. Prisma Model Inventory

### Payment Core (4 models)
Payment (33 fields), Refund (10 fields), Payout (14 fields), ManualPaymentProof (12 fields)

### Order Fulfillment (11 models)
Order (37 fields + 9 indexes), OrderItem (11 fields), OrderCancellation (11 fields), OrderReturn (14 fields), OrderTimelineEvent (8 fields), OrderDocument (10 fields), OrderLocation (14 fields), OrderNumberCounter (3 fields), PurchaseOrder (34 fields), PurchaseOrderLineItem (14 fields), PurchaseOrderVersion (9 fields)

### Invoice & Billing (6 models)
Invoice (26 fields), InvoiceItem (8 fields), InvoiceHistory (8 fields), InvoiceSequence (4 fields), TaxBreakdown (6 fields), Coupon (14 fields)

### Notes (4 models)
CreditNote (20 fields), CreditNoteItem (7 fields), DebitNote (20 fields), DebitNoteItem (7 fields)

### Subscription & Plans (6 models)
MembershipPlan (23 fields), PlanFeature (6 fields), PlanAddon (9 fields), PlanHistory (7 fields), PlanAuditLog (8 fields), SubscriptionEvent (8 fields)

### Escrow & Settlement (4 models)
Escrow (17 fields), EscrowEvent (5 fields), Settlement (12 fields), SettlementEvent (6 fields)

### Dispute (8 models)
Dispute (28 fields + 7 indexes), DisputeMessage (4 fields), DisputeEvidence (6 fields), DisputeTimelineEvent (5 fields), DisputeResolution (8 fields), DisputeProcessorExecution (5 fields), DisputeAppeal (9 fields)

### Finance & Credit (6 models)
BuyerCredit (12 fields), CreditHistory (8 fields), CreditApproval (13 fields), CollectionNote (8 fields), CollectionTimelineEvent (5 fields), RfqCreditPack (12 fields)

### GOCASH (3 models)
GOCASH_Wallet (15 fields), GOCASH_Transaction (22 fields + 8 indexes), GOCASH_Redemption (10 fields)

**Total: 52 payment/finance-related Prisma models**

---

## 4. Enum Inventory (72 total)

| Domain | Enums | Values |
|--------|-------|--------|
| Payment | PaymentGateway | RAZORPAY, CASHFREE, PHONEPE, STRIPE, BANK_TRANSFER, UPI_QR |
| Payment | PaymentStatus | PENDING, PROCESSING, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED |
| Payment | PaymentType | ORDER_PAYMENT, CREDIT_PACK_PURCHASE, SUBSCRIPTION, REFUND, PAYOUT |
| Payment | ManualPaymentMethod | UPI_QR, NEFT, RTGS, BANK_TRANSFER |
| Payment | ManualPaymentVerificationStatus | PENDING, VERIFIED, REJECTED |
| Order | OrderSource | RFQ, QUOTE, DIRECT, CART, REPEAT, CUSTOM |
| Order | OrderStatus | 11 values (PENDING→RETURNED) |
| Order | DeliveryMethod | PICKUP, SELLER_DELIVERY, THIRD_PARTY_LOGISTICS, BUYER_ARRANGED |
| PO | PurchaseOrderStatus | 9 values (DRAFT→CONVERTED_TO_ORDER) |
| PO | DeliveryTerms | EX_WORKS, FOB, CIF, CFR, CPT, CIP, DAP, DDP, FAS, FCA, OTHER |
| PO | PaymentTerms | 14 values (ADVANCE→OTHER) |
| Escrow | EscrowStatus | 11 values (PENDING→MANUAL_REVIEW) |
| Settlement | SettlementStatus | 8 values (PENDING→REOPENED) |
| Dispute | DisputeStatus | 13 values (OPEN→APPEALED) |
| Dispute | ResolutionType | FULL_REFUND, PARTIAL_REFUND, REPLACEMENT, PRICE_ADJUSTMENT, SERVICE_REWORK, NO_ACTION |
| Subscription | SubscriptionStatus | TRIAL, ACTIVE, EXPIRED, SUSPENDED, CANCELLED |
| Subscription | PlanType | 9 types |
| Billing | InvoiceStatus | DRAFT, GENERATED, SENT, PAID, OVERDUE, VOID, CANCELLED |
| Billing | TaxType | CGST, SGST, IGST, EXEMPT |
| Finance | CreditStatus | ACTIVE, SUSPENDED, BLOCKED, CLOSED |
| Finance | RiskLevel | LOW, MEDIUM, HIGH, CRITICAL |
| GOCASH | GOCASHTransactionType | 16 types |
| GOCASH | GOCASHLedgerDirection | CREDIT, DEBIT |

---

## 5. Cross-Domain Data Flow

```
Buyer Checkout → PaymentService.createPaymentOrder()
  → Razorpay/Stripe order creation
  → Buyer pays on gateway
  → Webhook: payment.captured
    → PaymentService.verifyPayment()
    → handlePaymentSuccess()
      → ORDER type: just logs
      → SUBSCRIPTION type: membershipService.activateSubscription()
      → CREDIT_PACK type: creates RfqCreditLedger entry

Escrow (on order delivery)
  → EscrowService.hold()
  → EscrowService.setAutoReleaseDate()
  → BullMQ: AUTO_RELEASE → release
  → SettlementService.create()
  → SettlementService.process()
  → SettlementService.fail() → retry()

Dispute (on order issue)
  → DisputeService.create() → escrow → DISPUTED
  → DisputeService.escalate() → admin arbitration
  → DisputeService.resolveDispute()
    → escrow → RELEASED or REFUNDED
    → trustScore → -10

GOCASH Rewards
  → GocashIntegrationService (9 reward methods)
  → GocashService.credit() (idempotent)
  → WalletApiService (buyer/seller/admin wrappers)

Invoice
  → PaymentService.handlePaymentSuccess()
    → generateInvoice() (auto)
  → BillingService / InvoiceService (admin retrieval + void)
```

---

## 6. Frontend Gaps (🔴 Critical)

| Gap | Backend Status | Frontend Status | Impact |
|-----|---------------|-----------------|--------|
| Checkout page | ✅ PaymentController (6 endpoints) | ❌ **No pages exist** | Buyers cannot pay for orders |
| Subscription purchase | ✅ MembershipController (15 endpoints) + Store | ❌ **No pages exist** | No paid plan signup flow |
| Admin payments | ✅ PaymentAdminController (4 endpoints) | ❌ **No pages exist** | Admins cannot manage payments |
| Admin wallets | ✅ WalletApiController (11 admin endpoints) | ❌ **No pages exist** | No financial oversight |
| Admin finance | ✅ FinanceController (42 endpoints) | ❌ **No pages exist** | No credit/collections/notes UI |
| Admin billing | ✅ BillingAdminController (4 endpoints) | ❌ **No pages exist** | No invoice management UI |
| Payment API client | ✅ Backend controllers | ⚠️ Broken URLs | `/payments` ≠ `companies/:companyId/payments` |

---

## 7. Security Findings

| Finding | Severity | Status |
|---------|----------|--------|
| HMAC-SHA256 webhook verification | ✅ | Secure — both Razorpay + Stripe |
| timingSafeEqual signature comparison | ✅ | Secure — prevents timing attacks |
| Webhook idempotency via ProcessedWebhookEvent | ✅ | Prevents duplicate processing |
| Live/test key enforcement in Razorpay | ✅ | Fatal error on test key in live mode |
| CSRF globally registered | ⚠️ Medium | May block webhook POST requests |
| Stripe SDK via `require()` | 🟡 Medium | Inconsistent with NestJS ESM conventions |
| API .env has placeholder secrets | 🟡 Low | `your_razorpay_secret` in actual env file |
| No payment rate limiting | 🟡 Low | Payment endpoints have no @Throttle() |

---

## 8. Queue Infrastructure

| Queue | Jobs | Cron | Reliability |
|-------|------|------|-------------|
| SUBSCRIPTION | 3 | Daily checks | ✅ Retry + error logging |
| ESCROW | 2 | Periodic auto-release | ✅ Retry + error logging |
| SETTLEMENT | 2 | Periodic processing | ✅ Retry (max 3) + error logging |
| DISPUTE | 7 | Mixed cron + delayed | ✅ Sentry + retry |

---

## 9. Key Architecture Strengths

1. **Gateway-agnostic**: `IPaymentGateway` interface + factory pattern — easy to add new gateways
2. **Append-only ledger**: GOCASH uses immutable CREDIT/DEBIT entries — every transaction creates a new row
3. **Idempotency everywhere**: Payment orders (existing PENDING prevents duplicate), GOCASH credit (idempotencyKey), webhooks (ProcessedWebhookEvent)
4. **Complete order state machine**: 11-status workflow with per-location tracking
5. **GST compliance**: Full CGST/SGST/IGST calculation with invoice auto-generation
6. **Escrow→Settlement→Dispute pipeline**: Linked lifecycle from order payment through resolution
7. **BullMQ cron infrastructure**: 14 production-grade scheduled jobs for subscription, escrow, settlement, dispute
8. **AI-powered finance**: 10 AI methods for credit risk, cash flow, collection strategy via AiGateway

---

## 10. Key Architecture Weaknesses

1. **🔴 No payout integration**: Settlements update status but don't call Razorpay Payouts API — no actual money movement
2. **🔴 No split payments**: Escrow only releases full amount — no marketplace commission deduction
3. **🔴 No frontend**: Zero checkout, subscription, admin payment, or finance pages exist
4. **🟡 No payment tracking**: Zero payment events in the 37-event tracking catalog
5. **🟡 No reconciliation**: Payment records exist but no bank statement matching or discrepancy detection
6. **🟡 No multi-currency**: All models hardcode INR — no exchange rate or multi-currency support
7. **🟡 No payment retry UI**: Failed payments can be retried via API but no frontend flow
8. **🟡 No refund portal**: Refunds work via API but no buyer-facing refund request UI
