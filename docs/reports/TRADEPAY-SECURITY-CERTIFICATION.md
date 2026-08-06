# TRADEPAY Security Certification (RC2)

**Date:** 2026-07-19  
**Audit Type:** Security Control Verification  
**Scope:** All TradePay modules, infrastructure, and configuration  

## 1. Webhook Security

| Control | Status | Evidence |
|---|---|---|
| Razorpay webhook signature verification | ✅ PASS | `utils/signature.ts` uses HMAC-SHA256 with timingSafeEqual |
| Stripe webhook signature verification | ✅ PASS | Stripe SDK `constructEvent()` verifies payload |
| Webhook replay protection | ✅ PASS | `ProcessedWebhookEvent` table with `eventId @unique` |
| Webhook idempotency check | ✅ PASS | Duplicate event ID check before processing |
| Payout webhook handling | ❌ **FAIL** | No handler for razorpay `payout.processed`, `payout.failed`, `payout.reversed` |
| Webhook raw body parsing | ✅ PASS | Fastify `addContentTypeParser` for `application/json` raw body |

### Signature Utility (`utils/signature.ts:7-16`)
- Uses `crypto.timingSafeEqual()` — timing-attack resistant
- Returns `false` for null/empty input — protects against missing signatures
- Uses `createHmac('sha256', secret)` with RAZORPAY_WEBHOOK_SECRET

### Webhook Replay Protection (`payment-webhook.controller.ts:39-50`)
Controller checks `ProcessedWebhookEvent` by `eventId` (unique constraint) before processing. Duplicate events return 200 immediately without re-processing. However, there's a potential race condition: the controller checks at line 40, and the service also checks at line 475 of payment.service.ts. Two concurrent deliveries could both pass the controller check and attempt duplicate processing.

---

## 2. Rate Limiting

| Controller | @Throttle | Assessment |
|---|---|---|
| PaymentController | ✅ 30 req/60s | Adequate |
| PaymentSubscriptionController | ✅ 10 req/60s | Adequate |
| PaymentAdminController | ✅ 120 req/60s | Adequate |
| CommissionController | ✅ 30 req/60s | Adequate |
| PayoutController | ✅ 30 req/60s | Adequate |
| PayoutAdminController | ✅ 120 req/60s | Adequate |
| **PaymentWebhookController** | ❌ **NONE** | **CRITICAL** — No rate limiting on public webhook endpoint |
| **EscrowController** | ❌ **NONE** | **CRITICAL** — freeze/refund/release have no rate limit |
| **SettlementController** | ❌ **NONE** | **CRITICAL** — process/fail/retry have no rate limit |
| **DisputeController** | ❌ **NONE** | No rate limiting |
| **CreditController** | ❌ **NONE** | No rate limiting |
| **CreditApprovalController** | ❌ **NONE** | No rate limiting |
| **CreditNoteController** | ❌ **NONE** | No rate limiting |
| **DebitNoteController** | ❌ **NONE** | No rate limiting |
| **CollectionsController** | ❌ **NONE** | No rate limiting |
| **FinanceDashboardController** | ❌ **NONE** | No rate limiting |

### 🔴 CRITICAL: 6 Production Controllers Missing Rate Limiting
**Affected endpoints:** Escrow (freeze, refund, release — financial operations), Settlement (process — payout trigger), Payment Webhook (no limit on webhook replay), Dispute (creation, escalation), all Finance controllers (credit changes, notes, reports).

**Risk:** Escrow controller without rate limiting allows an attacker or buggy client to rapidly freeze/release escrows, potentially blocking legitimate payouts or causing financial manipulation.

---

## 3. Authentication & Authorization

| Control | Status | Evidence |
|---|---|---|
| JWT authentication on payment endpoints | ✅ PASS | PaymentController: `JwtAuthGuard` at class level |
| Role-based access control | ✅ PASS | Admin controllers: `RolesGuard('ADMIN','SUPER_ADMIN')` |
| CompanyOwnerGuard on company-scoped endpoints | ✅ PASS | Payment/Escrow/Settlement controllers |
| Webhook endpoints public (designed) | ✅ PASS | No auth guards (signature-verified) |
| PayoutController role scoping | ✅ PASS | BUYER/SELLER/SELLER roles per endpoint |
| CommissionController admin-only | ✅ PASS | ADMIN roles |

### PayoutController `user.companyId` Risk
**File:** `payout.controller.ts:23`
```
const companyId = user.companyId;
```
The `@CurrentUser()` decorator returns the JWT payload (`sub`, `email`, `roles`). The `companyId` field is NOT a standard JWT claim. Unless a custom guard/middleware populates this field, it will be `undefined` at runtime. **This needs verification.**

---

## 4. CSRF Protection

| Control | Status | Evidence |
|---|---|---|
| @fastify/csrf-protection registered | ✅ PASS | `main.ts:85` — global registration |
| Cookie-based CSRF token | ✅ PASS | Default `@fastify/csrf-protection` behavior |
| Webhook CSRF exclusion | ❌ **FAIL** | No CSRF exclusion for `/payments/webhook/*` routes |
| CORS configuration | ✅ PASS | Origin: FRONTEND_URL, credentials: true |

### 🔴 CRITICAL: Webhook Routes Behind CSRF
**File:** `main.ts:85` — CSRF is registered globally with no route exclusions.  
**Routes affected:** `POST /payments/webhook/razorpay`, `POST /payments/webhook/stripe`  
**Impact:** Razorpay and Stripe servers POST to these endpoints without CSRF cookies/tokens. Requests will be rejected with 403. Payment webhooks will never be processed in production.

Current Phase E2 code (main.ts ~line 254) has a comment mentioning CSRF exclusion but no actual exclusion logic is in place:
```typescript
// Skip CSRF for webhook routes
```
No `csrfProtection` or `skipCsrf` decorator exists in any payment file. The `@fastify/csrf-protection` options don't include route exclusion configuration.

---

## 5. Environment & Secret Handling

| Control | Status | Evidence |
|---|---|---|
| All env vars documented in .env.example | ✅ PASS | RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, STRIPE_*, PAYMENT_MODE |
| PAYMENT_MODE enforcement | ✅ PASS | `razorpay.service.ts:17-22` blocks test keys in live mode |
| No hardcoded secrets in code | ✅ PASS | No API keys found in source |
| Secret not logged | ✅ PASS | Logger never outputs secrets |
| Production vs test key separation | ✅ PASS | `.env.production` has live keys placeholder |

### PAYMENT_MODE Validator (razorpay.service.ts:17-22)
```typescript
if (PAYMENT_MODE === 'live' && keyId.startsWith('rzp_test_')) {
  throw new Error('Test keys not allowed in live mode');
}
```
This correctly prevents test Razorpay keys from being used in production. However, the validation does not cover:

- Stripe test key detection (starts with `sk_test_`)
- Production key validation in test mode (e.g., warning when live keys used in test)

---

## 6. Audit Logging

| Module | AuditLog Calls | Status |
|---|---|---|
| PaymentService | 2 (CREDIT_PACK_GRANTED, REFUND_CREATED) | ⚠️ PARTIAL |
| EscrowService | 0 | ❌ **FAIL** |
| SettlementService | 0 | ❌ **FAIL** |
| PayoutService | 0 | ❌ **FAIL** |
| CommissionService | 0 | ❌ **FAIL** |
| DisputeService | 0 | ❌ **FAIL** |
| FinanceService | 0 | ❌ **FAIL** |

### 🟡 HIGH: No Audit Trail for Financial Operations
**Missing audit events include:**
- Escrow hold, release, freeze, refund, reopen
- Settlement create, process, fail, retry
- Payout create, process, confirm, fail
- Commission rule CRUD
- Credit limit changes
- Credit note issue/cancel

Currently, the only financial audit trail exists in EscrowEvent and SettlementEvent tables (event models). These provide business-level event history but do NOT record WHO performed the action (createdById exists for EscrowEvent but not all events use it).

---

## 7. HTTPS & Transport Security

| Control | Status | Evidence |
|---|---|---|
| Helmet CSP | ✅ PASS | `main.ts:62-82` — full CSP with HSTS, X-Frame-Options, etc. |
| HSTS | ✅ PASS | 1 year, includeSubDomains, preload |
| X-Frame-Options | ✅ PASS | DENY |
| X-Content-Type-Options | ✅ PASS | nosniff |
| Referrer-Policy | ✅ PASS | strict-origin-when-cross-origin |
| Production-only CSP hardening | ✅ PASS | unsafe-eval removed in production |

---

## 8. Fraud Protection

| Control | Status | Evidence |
|---|---|---|
| Payment verification signature | ✅ PASS | HMAC SHA256 with timingSafeEqual |
| Duplicate payment prevention | ✅ PASS | Dedup: reuses PENDING payment if exists (`payment.service.ts:72-78`) |
| Refund amount validation | ✅ PASS | Validates refund ≤ remaining capturable (`payment.service.ts:290-292`) |
| Webhook dedup | ✅ PASS | eventId unique constraint |
| Payout account verification | ⚠️ PARTIAL | Admin must manually verify — no automated bank account validation |

---

## SECURITY SCORECARD

| Category | Score | Max | % |
|---|---|---|---|
| Webhook Security | 7 | 10 | 70% |
| Rate Limiting | 4 | 10 | 40% |
| Authentication & Authorization | 8 | 10 | 80% |
| CSRF Protection | 5 | 10 | 50% |
| Environment & Secrets | 9 | 10 | 90% |
| Audit Logging | 2 | 10 | 20% |
| Transport Security | 10 | 10 | 100% |
| Fraud Protection | 7 | 10 | 70% |
| **Overall Security** | **52** | **80** | **65%** |

## CRITICAL SECURITY ISSUES

| # | Issue | Severity | Fix |
|---|---|---|---|
| S1 | Webhook routes behind CSRF — never process in production | 🔴 P0 | Add CSRF route exclusion for `/payments/webhook/*` in main.ts |
| S2 | No rate limiting on webhook — replay flood risk | 🔴 P0 | Add `@Throttle(60 req/60s)` to PaymentWebhookController |
| S3 | No rate limiting on EscrowController — financial ops unthrottled | 🔴 P0 | Add `@Throttle(20 req/60s)` to EscrowController |
| S4 | No rate limiting on SettlementController — payout trigger unthrottled | 🔴 P0 | Add `@Throttle(10 req/60s)` to SettlementController |
| S5 | Zero audit logging in escrow, settlement, payout, commission | 🟡 P1 | Add auditLog.create() calls to all financial operations |
| S6 | PayoutController.user.companyId may resolve to undefined | 🟡 P1 | Verify JWT payload includes companyId or add resolver |
| S7 | No payout webhook handler — status never updated asynchronously | 🟡 P1 | Add payout webhook handlers in PaymentWebhookController |

---

*Generated: 2026-07-19 | Phase E5 — TradePay RC2 Certification*
