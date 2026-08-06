# TRADEPAY Integration Audit (RC2)

**Date:** 2026-07-19  
**Audit Type:** Integration Point Verification  
**Scope:** All TradePay modules vs platform integrations  
**Verdict:** NO GO — 3 critical integration failures identified  

## 1. Payment → Order Integration

| Integration Point | Status | Details |
|---|---|---|
| Order payment status on capture | ❌ **BROKEN** | `payment.service.ts:139-142` handlePaymentSuccess() does NOT update Order status after ORDER_PAYMENT capture. Orders remain PENDING indefinitely. |
| Escrow auto-creation on payment | ❌ **BROKEN** | No bridge between payment capture and escrow creation. Escrow must be manually created via `/escrow` endpoint. |
| Order → Payment FK | ✅ PASS | `Order.payments[]` → `Payment.orderId` with `SetNull` onDelete |
| Order → Escrow FK | ✅ PASS | `Escrow.orderId @unique` → Order with `Restrict` onDelete |
| Payment → Invoice FK | ✅ PASS | `Invoice.paymentId @unique` → Payment with `Restrict` onDelete |

### 🔴 CRITICAL: No Order Status Update on Payment Capture
**File:** `apps/api/src/modules/payment/payment.service.ts:139-142`  
The `handlePaymentSuccess()` method handles ORDER_PAYMENT by doing nothing:
```
if (type === PaymentType.ORDER_PAYMENT) {
  // Currently no-op — just logs
  this.logger.log(`Payment completed for order ${orderId}`);
}
```
**Impact:** Orders stay in PENDING status even after successful payment. Downstream systems (fulfillment, delivery, escrow) never trigger.

### 🔴 CRITICAL: No Auto-Escrow on Payment Capture
**File:** `apps/api/src/modules/payment/payment.service.ts:139-189`  
When ORDER_PAYMENT is captured, no escrow is automatically created. Escrow requires manual API call to `/companies/:companyId/escrow`.  
**Impact:** Paid orders may never enter escrow, defeating the trust guarantee model.

---

## 2. Payment → Escrow → Commission → Settlement → Payout Pipeline

| Integration Point | Status | Details |
|---|---|---|
| Escrow.release → Commission.calculate | ✅ PASS | `escrow.service.ts:285-291` calls CommissionService on release |
| Commission → Settlement.create | ✅ PASS | `escrow.service.ts:327` calls SettlementService.create after release |
| Settlement.process → Payout.createFromSettlement | ❌ **CRITICAL** | `settlement.service.ts:149` calls PayoutService but SettlementModule does NOT import PayoutModule |
| Payout → Razorpay Payouts API | ⚠️ PARTIAL | `payout.service.ts:84-127` calls Razorpay Payouts API but has no webhook handler for async status updates |
| Payout → Queue | ❌ **ORPHANED** | `jobs/payout.processor.ts` exists but is NEVER registered in `JobsModule` |

### 🔴 CRITICAL: SettlementModule Missing PayoutModule Import
**File:** `apps/api/src/modules/settlement/settlement.module.ts:8`  
SettlementModule imports only AnalyticsModule but its service injects PayoutService. NestJS will throw a runtime provider error when settlementService.process() is called.  
**Impact:** The entire settlement→payout pipeline crashes at first settlement processing.

### 🟡 HIGH: PayoutProcessor Orphaned
**File:** `apps/jobs/payout.processor.ts` (entire file)  
The PayoutProcessor BullMQ worker is defined but never imported or registered in JobsModule. Settlement queue messages for payout processing will never be consumed.  
**Impact:** Payout jobs submitted to the queue will be silently dropped.

### 🟡 HIGH: No Payout Webhook Handler
**File:** `apps/api/src/modules/payment/payment-webhook.controller.ts`  
Razorpay sends `payout.processed`, `payout.failed`, `payout.reversed` webhooks. TradePay has no handler for these. Payout status is only updated via admin API endpoints.  
**Impact:** Razorpay-initiated payout status changes are never captured. Payouts remain PROCESSING indefinitely unless admin manually confirms.

---

## 3. Payment Analytics → Growth Intelligence

| Integration Point | Status | Details |
|---|---|---|
| PaymentAnalyticsService | ❌ **DEAD CODE** | `payment-analytics.service.ts` has `trackEvent()` method but PaymentService never injects or calls it |
| EscrowAnalyticsService | ✅ PASS | Wired correctly — EscrowService calls at hold/release/freeze/refund/reopen |
| SettlementAnalyticsService | ✅ PASS | Wired correctly — SettlementService calls on create/process/fail/retry/reopen |
| Growth Intelligence — Payment Events | ❌ **MISSING** | No PAYMENT_INITIATED, PAYMENT_COMPLETED, PAYMENT_FAILED, SUBSCRIPTION_PURCHASED, PAYOUT_PROCESSED, PAYOUT_FAILED in events.ts or any backend code |
| Frontend Payment Tracking | ❌ **ZERO COVERAGE** | No checkout, subscription purchase, or subscription payment page calls `useTracking()` |

### 🔴 CRITICAL: PaymentAnalyticsService is Dead Code
**File:** `apps/api/src/modules/payment/payment-analytics.service.ts` (entire file)  
This service has a working `trackEvent()` method that sends to ClickHouse `payment_analytics_events` table. It is registered in PaymentModule and exported. However, **PaymentService never injects it** — zero production code paths call it.  
**Impact:** Payment analytics events are NEVER recorded. The entire ClickHouse table stays empty.

### 🔴 CRITICAL: Zero Growth Intelligence Payment Events
**Files examined:** `apps/web/lib/tracking/events.ts`, all backend services  
None of the 6 required payment events exist anywhere in the codebase:
- PAYMENT_INITIATED — not defined
- PAYMENT_COMPLETED — not defined  
- PAYMENT_FAILED — only exists as NotificationType, not tracking event
- SUBSCRIPTION_PURCHASED — not defined
- PAYOUT_PROCESSED — only exists as NotificationType
- PAYOUT_FAILED — only exists as NotificationType

**Impact:** Growth Intelligence has no payment conversion data. Acquisition funnel stops at "First Order" with no payment step.

---

## 4. Escrow → Notification Integration

| Notification Type | Trigger | Status |
|---|---|---|
| ESCROW_HELD | EscrowService.hold() | ✅ PASS |
| ESCROW_RELEASED | EscrowService.release() | ✅ PASS |
| ESCROW_REFUNDED | EscrowService.refund() | ✅ PASS |
| PAYMENT_RECEIVED | PaymentService.verifyPayment() | ✅ PASS |
| PAYMENT_FAILED | PaymentService.webhook (payment.failed) | ✅ PASS |
| PAYMENT_REFUNDED | PaymentService.createRefund() | ✅ PASS |
| SETTLEMENT_PROCESSED | SettlementService.process() | ✅ PASS |
| SETTLEMENT_FAILED | SettlementService.fail() | ✅ PASS |
| PAYOUT_PROCESSED | PayoutService.confirmPayout() | ✅ PASS |
| PAYOUT_FAILED | PayoutService.failPayout() | ✅ PASS |

### ⚠️ Module Import Gap
**Affected modules:** PaymentModule, EscrowModule, SettlementModule, PayoutModule  
None of these modules import NotificationModule in their `imports` array. NotificationService injection works only if NotificationModule is @Global(). This should be verified at runtime.

---

## 5. Settlement → Payout Transaction Safety

| Aspect | Status | Details |
|---|---|---|
| Settlement.process() atomicity | ⚠️ PARTIAL | Settlement status updated to PROCESSED, then payout creation attempted. If payout creation fails, settlement remains PROCESSED — inconsistent. |
| processSettlements() batch transaction | ❌ **MISSING** | Sequential processing of all PENDING settlements with no transaction. Mid-batch failure leaves some PROCESSED, others PENDING. |
| Payout retry on failure | ⚠️ PARTIAL | Payout falls back to MANUAL status immediately (no auto-retry). Zero retry attempts. |
| Settlement retry | ✅ PASS | Up to 3 retries via processRetries() |

---

## 6. Invoice → Billing Integration

| Integration Point | Status | Details |
|---|---|---|
| Payment → Invoice (subscription) | ❌ **CRITICAL** | `invoice.service.ts:61-64` stores paise as rupees — 100x inflated amounts |
| Payment → Invoice (general) | ✅ PASS | `payment.service.ts:191-209` correctly converts paise to rupees |
| Invoice → CreditNote/DebitNote | ✅ PASS | FK relations with proper onDelete |
| Invoice numbering (subscription) | ✅ PASS | Uses atomic InvoiceSequence upsert |
| Invoice numbering (general) | ⚠️ WARNING | Uses race-condition-prone `count + 1` |
| Billing history | ✅ PASS | Unified query across payments, invoices, plan history |
| PDF generation | ✅ PASS | Works with correct rupee values |

### 🔴 CRITICAL: Subscription Invoice Amounts 100x Inflated
**File:** `apps/api/src/modules/billing/invoice.service.ts:61-64`
```
subtotal: params.amount - (params.discountAmount || 0),  
// Payment.amount is in paise (e.g., 6000 for ₹60), but stored as rupees (₹6,000)
```
**Impact:** Every subscription invoice shows 100x the correct amount. Trade Start (₹60) becomes ₹6,000 + GST. GST also calculated on inflated amount.

---

## 7. Membership/Subscription Integration

| Integration Point | Status | Details |
|---|---|---|
| Subscription payment → Membership activation | ✅ PASS | `payment.service.ts:456` calls MembershipService.activateSubscription() |
| Duration calculation | ⚠️ WARNING | `membership.service.ts:1031`: `duration * 12` — 1 becomes 12 months. Semantics unclear. |
| Plan features check | ✅ PASS | Membership benefits card reads from API |

---

## 8. Founder AI Integration

| Data Point | Status | Details |
|---|---|---|
| Payment counts for daily brief | ✅ PASS | FounderAiService queries payment.count() and aggregate() |
| Overdue invoice detection | ✅ PASS | invoice.count({ status: 'OVERDUE' }) for payment risk |
| Subscription expiry monitoring | ✅ PASS | Company.subscriptionExpiresAt queried for churn risk |
| Revenue from Orders | ✅ PASS | Health score revenue from Order completion rate |
| Enterprise Intelligence revenue | ⚠️ PARTIAL | Uses Order model, not direct Payment queries |
| Payout/Settlement metrics | ❌ **MISSING** | No Founder AI insight uses payout or settlement data |

---

## 9. Refund Disconnect (Cross-System)

| Refund Path | Actions Taken | Missing Actions |
|---|---|---|
| Payment refund (gateway) | Razorpay refund, Payment status updated, Refund record created | ❌ Escrow not updated ❌ Commission not reversed ❌ Settlement not cancelled |
| Escrow refund (platform) | Escrow status → REFUNDED, Notification sent | ❌ No gateway refund initiated ❌ No Refund record created ❌ Commission not reversed ❌ Settlement not cancelled |

### 🔴 CRITICAL: Refund Systems Are Completely Disconnected
**Impact:** For a full escrow refund, an admin must manually:
1. Call the payment refund API (gateway refund)
2. Call the escrow refund API (platform refund)
3. Manually adjust commission (no API exists)
4. Manually cancel settlement (no API exists)

This creates double-liability and operational risk.

---

## 10. Notification Templates (Never Triggered)

The following notification templates are defined in code (notification.template.service.ts) but their `NotificationType` values are never used in any service:

- ESCROW_CREATED
- ESCROW_FUNDED  
- ESCROW_DISPUTED
- ESCROW_FROZEN
- ESCROW_REOPENED
- SETTLEMENT_INITIATED
- SETTLEMENT_PROCESSING
- SETTLEMENT_COMPLETED
- SETTLEMENT_RETRYING
- SETTLEMENT_MANUAL_REVIEW
- SETTLEMENT_REOPENED

These represent undocumented/disconnected states or planned-but-unimplemented features.

---

## SCORING

| Category | Score | Max | % |
|---|---|---|---|
| Payment → Order pipeline | 2 | 10 | 20% |
| Escrow → Commission → Settlement → Payout | 4 | 10 | 40% |
| Analytics & Growth Intelligence | 1 | 10 | 10% |
| Notifications | 8 | 10 | 80% |
| Invoice & Billing | 4 | 10 | 40% |
| Membership/Subscription | 7 | 10 | 70% |
| Founder AI | 6 | 10 | 60% |
| Refund Cohesion | 1 | 10 | 10% |
| **Overall Integration** | **33** | **80** | **41%** |

## CRITICAL ISSUES REQUIRING REMEDIATION

| # | Issue | Severity |
|---|---|---|
| I1 | SettlementModule missing PayoutModule import — pipeline crashes | 🔴 P0 |
| I2 | No Order status update on payment capture | 🔴 P0 |
| I3 | No auto-escrow on payment capture | 🔴 P0 |
| I4 | Subscription invoice amounts 100x inflated | 🔴 P0 |
| I5 | PaymentAnalyticsService dead code — never called | 🔴 P0 |
| I6 | Refund systems completely disconnected (payment vs escrow) | 🔴 P0 |
| I7 | Zero Growth Intelligence payment events | 🟡 P1 |
| I8 | PayoutProcessor orphaned — never registered in JobsModule | 🟡 P1 |
| I9 | No payout webhook handler for Razorpay async updates | 🟡 P1 |
| I10 | Invoice number race condition (count+1) | 🟡 P1 |

---

*Generated: 2026-07-19 | Phase E5 — TradePay RC2 Certification*
