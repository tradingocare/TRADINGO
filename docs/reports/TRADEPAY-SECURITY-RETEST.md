# TradePay Security Retest Report

**Date**: 2026-07-19  
**Phase**: E6 — RC2 Remediation

## Findings from Phase E5 (RC2)

### C6 — Webhook routes behind CSRF → RESOLVED
**Before**: `@fastify/csrf-protection` registered globally without webhook exclusion
**After**: Global preHandler exempts:
- Webhook routes (`/payments/webhook/`) — use Razorpay/Stripe HMAC signature verification
- JWT-authenticated requests — browsers cannot forge `Authorization` header
- Safe HTTP methods (GET/HEAD/OPTIONS) — generate CSRF token cookie for future requests
- All other unsafe methods enforced via `csrfProtection` preHandler

### Rate Limiting → RESOLVED
**Before**: Payment webhook, settlement, and escrow controllers had no rate limiting
**After**:
| Controller | Rate Limit | Rationale |
|---|---|---|
| SettlementController | 30 req/min | Admin operations, moderate volume |
| EscrowController | 30 req/min | User-initiated escrow operations |
| PaymentWebhookController | 60 req/min | Razorpay/Stripe may send bursts |

### CSRF Logic
```ts
fastifyApp.addHook('preHandler', (request, reply, done) => {
  // Safe methods → generate CSRF token cookie
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) { ... generateCsrf() ... }
  // Webhook routes → skip (signature verification)
  if (url.includes('/payments/webhook/')) return done();
  // JWT-authenticated → skip (browser cannot forge Authorization header)
  if (request.headers.authorization) return done();
  // All other → enforce CSRF token check
  fastifyApp.csrfProtection(request, reply, done);
});
```

### Authorization
- All financial controllers (Payment, Payout, Settlement, Escrow, Commission) use `JwtAuthGuard` + `RolesGuard`/`CompanyOwnerGuard`
- PaymentWebhookController uses Razorpay/Stripe webhook signature verification (no JWT needed)
