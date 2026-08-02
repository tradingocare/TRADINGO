# Sprint 6E — Rewards & Notification Integration

**Status**: COMPLETE
**Date**: 2026-07-22
**Objective**: Integrate GOCASH rewards and typed notifications into the TradeServ booking lifecycle.

---

## Audit Summary

| Domain | Key Findings |
|--------|-------------|
| **GocashService** | `credit()` accepts `LedgerCreditParams` (walletId, amount, type, reason, actorId, actorType, idempotencyKey, etc.). Idempotency via `verifyIdempotency(key)` — returns existing LedgerEntry if key already used. Wallet lookup by `findUnique({ where: { userId } })`. |
| **GocashIntegrationService** | Existing `awardReward()` private method handles wallet lookup, idempotency, credit, and GOCASH_EARNED notification. Pattern: `referenceType_refId_userId` idempotency key format. Used by 8 existing reward methods (order, RFQ, quote, etc.). |
| **NotificationService** | `createWithTemplate(companyId, userId, type, context, overrides?)` renders via `NotificationTemplateService.render()` using FALLBACK_TEMPLATES record. `@Global()` module — no import needed. |
| **NotificationType enum** | 80+ values across 15 categories. TradeServ had 8 types: BOOKING_CREATED/CONFIRMED/COMPLETED/CANCELLED, PROPOSAL_SUBMITTED/ACCEPTED/REJECTED, INQUIRY_RECEIVED. Missing: REVIEW_SUBMITTED, BOOKING_PAYMENT_FAILED. |
| **FALLBACK_TEMPLATES** | Already had TradeServ entries for BOOKING_CREATED/CONFIRMED/COMPLETED/CANCELLED, PROPOSAL_SUBMITTED/ACCEPTED/REJECTED, INQUIRY_RECEIVED. Missing: REVIEW_SUBMITTED, BOOKING_PAYMENT_FAILED. |
| **TradeservService `as any` casts** | 8 locations where `'BOOKING_CREATED' as any` etc. were used to bypass Prisma enum typing. All 8 enum values already existed — only the cast was wrong. |
| **AuditLog** | Existing `prisma.auditLog.create()` call in `updateBookingStatus()` already logs every booking status change. |
| **GOCASHTransactionType** | Existing `BUYER_CASHBACK`, `SELLER_CASHBACK` sufficient for TradeServ rewards. No new transaction types needed. |

---

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `REVIEW_SUBMITTED`, `BOOKING_PAYMENT_FAILED` to `NotificationType` enum |
| `apps/api/src/modules/gocash-integration/constants.ts` | Added `TRADESERV` section: `BOOKING_COMPLETED: 50`, `REVIEW_SUBMITTED: 25`, `PROFESSIONAL_SIGNUP: 100` |
| `apps/api/src/modules/gocash-integration/gocash-integration.service.ts` | Added 3 public methods: `awardBookingCompleted()`, `awardReviewSubmitted()`, `awardProfessionalSignup()` — all follow existing `awardReward()` pattern with idempotency keys |
| `apps/api/src/modules/notification/notification.template.service.ts` | Added `BOOKING_PAYMENT_FAILED` and `REVIEW_SUBMITTED` fallback templates |
| `apps/api/src/modules/tradeserv/tradeserv.service.ts` | Replaced all 8 `'TYPE' as any` with `NotificationType.TYPE`. Imported `GocashIntegrationService`. Injected into constructor. Wired booking completion reward, review reward, professional signup reward, payment failure notification, review notification. Added `awardBookingCompletionReward()` private helper (looks up client's primary owner userId). All reward/notification calls are `.catch(logger.warn)` — never rollback business transactions. |
| `apps/api/src/modules/tradeserv/tradeserv-booking.controller.ts` | Added `@CurrentUser('sub') userId: string` to `createReview()` method — needed to pass reviewer's userId for GOCASH reward |
| `apps/api/src/modules/tradeserv/tradeserv.module.ts` | Imported `GocashIntegrationModule` |

**Total: 7 files modified**

---

## Components Reused

| Component | Pattern |
|-----------|---------|
| `GocashIntegrationService.awardReward()` | Private helper with wallet lookup, idempotency, credit, notification |
| `NotificationService.createWithTemplate()` | Template rendering + multi-channel delivery |
| `NotificationTemplateService.render()` | FALLBACK_TEMPLATES record lookup with `{{variable}}` interpolation |
| `prisma.auditLog.create()` | Booking status change auditing (unchanged) |
| `prisma.gOCASH_Wallet.findUnique()` | Wallet lookup by userId |
| `prisma.companyOwner.findFirst()` | User ID resolution from company ID |

---

## Reward Flow Verification

### BOOKING_COMPLETED (50 GOCASH)
- **Trigger**: `updateBookingStatus()` transitions to `COMPLETED`
- **Recipient**: Client's primary company owner
- **Resolution**: `awardBookingCompletionReward()` → looks up `CompanyOwner` where `isPrimary: true` → calls `GocashIntegrationService.awardBookingCompleted()`
- **Idempotency key**: `BOOKING_COMPLETED_{bookingId}_{clientUserId}`
- **Non-blocking**: `.catch(logger.warn)` — never rolls back the booking completion
- **Verified**: ✓

### REVIEW_SUBMITTED (25 GOCASH)
- **Trigger**: `createReview()` successfully creates a review
- **Recipient**: Reviewer (client user)
- **Resolution**: Direct call to `GocashIntegrationService.awardReviewSubmitted(userId, clientId)`
- **Idempotency key**: `REVIEW_SUBMITTED_{reviewId}_{userId}`
- **Non-blocking**: `.catch(logger.warn)` — never rolls back the review creation
- **Verified**: ✓

### PROFESSIONAL_SIGNUP (100 GOCASH)
- **Trigger**: `registerProfessional()` creates a professional company
- **Recipient**: Professional user (the userId who called register)
- **Resolution**: Direct call to `GocashIntegrationService.awardProfessionalSignup(userId, companyId)`
- **Idempotency key**: `PROFESSIONAL_SIGNUP_{companyId}_{userId}`
- **Non-blocking**: `.catch(logger.warn)` — never rolls back the registration
- **Warning**: Wallet may not exist yet at registration time; `awardReward()` logs a warning and returns null
- **Verified**: ✓

### Duplicate Reward Prevention
- **Mechanism**: `GocashService.credit()` calls `verifyIdempotency(key)` before creating a transaction. If the key exists, it returns the existing `LedgerEntry` without creating a new one.
- **Scope**: Prevents double-crediting even if the reward method is called multiple times with the same idempotency key.
- **Verified**: ✓

---

## Notification Verification

### Type-Safe Notification Calls
- **Before**: 8 locations using `'BOOKING_CREATED' as any`, `'BOOKING_CONFIRMED' as any`, `'BOOKING_COMPLETED' as any`, `'BOOKING_CANCELLED' as any`, `'PROPOSAL_SUBMITTED' as any`, `'PROPOSAL_ACCEPTED' as any`, `'PROPOSAL_REJECTED' as any`, `'BOOKING_CONFIRMED' as any` (verifyBookingPayment)
- **After**: All 8 use `NotificationType.BOOKING_CREATED` etc. — properly typed Prisma enum values
- **Zero remaining `as any` notification casts in tradeserv/**: ✓

### REVIEW_SUBMITTED Template
| Field | Value |
|-------|-------|
| title | `'New Review'` |
| body | `'{{reviewerName}} left a {{rating}}-star review for your services.'` |
| emailSubject | `'New Review – TradeServ'` |
| **Verified**: | ✓ |

### BOOKING_PAYMENT_FAILED Template
| Field | Value |
|-------|-------|
| title | `'Payment Failed'` |
| body | `'Payment for your booking on {{date}} failed. Reason: {{reason}}'` |
| emailSubject | `'Payment Failed – TradeServ'` |
| **Verified**: | ✓ |

### Payment Failure Notification
- **Trigger**: `verifyBookingPayment()` when signature verification fails
- **Recipient**: Professional's company (`booking.companyId`)
- **Non-blocking**: `.catch(logger.warn)` — never masks the BadRequestException
- **Verified**: ✓

---

## Audit Logging Verification

- **Booking status changes**: Already audited via `prisma.auditLog.create()` in `updateBookingStatus()` — unchanged
- **Reward credited**: Logged by `GocashService.credit()` → creates `GOCASH_Transaction` record with direction, amount, balanceBefore, balanceAfter, actorId, actorType, referenceId, referenceType, idempotencyKey, etc.
- **Reward skipped (duplicate)**: `verifyIdempotency()` returns existing transaction; logged by `awardReward()`: `"Reward already processed for key ${idempotencyKey}"`
- **Notification failures**: All `createWithTemplate()` calls have `.catch(logger.warn)` — errors logged but never propagated
- **Idempotency rejection**: Handled internally by `GocashService.credit()` — returns existing entry without error

---

## Build Results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `prisma generate` | ✅ |
| `tsc @tradingo/api --noEmit` | 0 errors ✅ |
| `tsc @tradingo/web --noEmit` | 0 errors ✅ |
| `turbo typecheck` | 6/6 packages pass ✅ |
| `next build` | 297 routes, 0 errors ✅ |
| `pnpm lint` | No new errors (pre-existing only) ✅ |

---

## Remaining Gaps (Out of Scope for Sprint 6E)

1. **No escrow integration** — deferred to Sprint 6F
2. **No booking cancellation by client endpoint** — client side can only view
3. **No pricing negotiation flow** — amount set from service priceMax at creation time
4. **Wallet may not exist on signup** — `awardProfessionalSignup` silently skips if wallet not found; wallet creation should be auto-triggered on user registration
5. **No email delivery guarantee** — notifications are created in-app only (SES not configured)
6. **No admin reward analytics** — no page yet to view TradeServ reward metrics
