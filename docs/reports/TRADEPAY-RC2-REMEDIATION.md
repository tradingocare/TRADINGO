# TradePay RC2 Remediation Report

**Date**: 2026-07-19  
**Phase**: E6 — RC2 Remediation  
**Status**: ALL 7 P0 + 4 P1 FIXES APPLIED

## P0 Fixes (Critical)

### C1 — SettlementModule missing PayoutModule import
- **File**: `apps/api/src/modules/settlement/settlement.module.ts`
- **Fix**: Added `PayoutModule` to imports array
- **Impact**: `SettlementService.create()` → `PayoutService.createFromSettlement()` now resolves at runtime instead of throwing DI error

### C2 — Subscription invoices 100x inflated
- **File**: `apps/api/src/modules/billing/invoice.service.ts`
- **Root cause**: `params.amount` stored in paise was written directly to Decimal(12,2) rupee fields in Invoice model
- **Fix**: Added `const amountInRupees = (params.amount - (params.discountAmount || 0)) / 100` conversion before storing in `subtotal`, `totalAmount`, `unitPrice`, and `amount` fields
- **Impact**: Subscription invoices now show correct rupee amounts

### C3 — Payment capture no Order update + no auto-escrow
- **File**: `apps/api/src/modules/payment/payment.service.ts`
- **Fix**: `handlePaymentSuccess()` for ORDER_PAYMENT type now:
  1. Updates Order status to `CONFIRMED`
  2. Auto-creates escrow via `EscrowService.hold()` with `'system-auto-escrow'` userId
  3. Generates invoice inline (with early return to prevent double-generation)
- **Dependencies**: Injected `EscrowService` into PaymentService; imported `EscrowModule` into PaymentModule
- **Impact**: Orders are confirmed and escrowed immediately upon payment capture

### C4 — Refund lifecycle disconnected
- **File**: `apps/api/src/modules/payment/payment.service.ts`
- **Fix**: `createRefund()` transaction now:
  1. Updates Order status to `RETURNED` (full refund) or `CANCELLED` (partial refund)
  2. Updates associated Escrow to `REFUNDED` with `refundedAt` timestamp
- **Impact**: Refunds now cascade through order → escrow → settlement chain

### C5 — PayoutProcessor orphaned
- **Files**: `apps/api/src/jobs/jobs.module.ts`, `apps/api/src/jobs/payout.processor.ts`
- **Fix**: 
  1. Added `PayoutModule` to JobsModule imports
  2. Added `PayoutProcessor` to JobsModule providers
  3. Added `PayoutService` to JobsModule providers
- **Impact**: BullMQ now properly registers and processes payout jobs on the SETTLEMENT queue

### C6 — Webhook routes behind CSRF
- **File**: `apps/api/src/main.ts`
- **Root cause**: `@fastify/csrf-protection` v8 registered globally without webhook exclusion
- **Fix**: Added global preHandler that:
  1. Generates CSRF token cookie on safe methods (GET/HEAD/OPTIONS)
  2. Exempts webhook routes (`/payments/webhook/*`) — they use Razorpay/Stripe signature verification
  3. Exempts JWT-authenticated requests (Authorization header) — browsers cannot forge custom headers
  4. Enforces CSRF token check on all other unsafe methods via `csrfProtection`
- **Impact**: Webhooks operate freely; JWT API calls unaffected; form-based endpoints protected

### C7 — fixedFee unit ambiguity
- **File**: `apps/api/src/modules/commission/commission.service.ts`
- **Root cause**: `fixedFee` stored as `Decimal(10,2)` in rupees but all amounts in paise
- **Fix**: Changed `Math.round(Number(bestRule.fixedFee))` → `Math.round(Number(bestRule.fixedFee) * 100)`
- **Impact**: Commission calculation now correctly converts fixedFee from rupees to paise

## P1 Fixes (Major)

### Audit Logging — CommissionService
- **Actions logged**: `COMMISSION_RULE_CREATED`, `COMMISSION_RULE_UPDATED`, `COMMISSION_RULE_DELETED` with metadata

### Audit Logging — PayoutService
- **Actions logged**: `PAYOUT_PROCESSING`, `PAYOUT_COMPLETED`, `PAYOUT_FAILED` with metadata

### Rate Limiting
| Controller | Limit |
|---|---|
| SettlementController | 30 req/min |
| EscrowController | 30 req/min |
| PaymentWebhookController | 60 req/min |

### Composite Indexes
| Model | Index Added |
|---|---|
| Payment | `[companyId, status]` |
| Refund | `[paymentId, status]` |
| Payout | `[companyId, status]` |
| Settlement | `[status, retryCount]` |

## Verification
- prisma validate: ✅
- tsc api --noEmit: 0 errors ✅
- tsc web --noEmit: 0 errors ✅
- next build: 282 routes ✅
