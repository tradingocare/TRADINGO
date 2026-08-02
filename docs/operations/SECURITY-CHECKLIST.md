# Production Security Checklist

## Auth & Access Control
- [x] JWT authentication on all protected routes
- [x] Roles guard (`@Roles('ADMIN')`, `@Roles('SUPER_ADMIN')`) on all admin endpoints
- [x] `@Public()` only on explicitly public endpoints (login, register, health, webhooks)
- [x] Rate limiting: 100 req/60s (ThrottlerModule global)
- [x] Password hashing (bcrypt)
- [x] Session management with Device/IP tracking

## API Security
- [x] CSP headers with HSTS, X-Frame-Deny, XSS-Protection, referrer-policy
- [x] CORS whitelist (configurable via env var)
- [x] CSRF protection (safe methods + JWT + webhooks skipped)
- [x] Helmet middleware
- [x] Body size limit: 100MB
- [x] ValidationPipe (class-validator) on all DTOs
- [x] No dev OTP bypasses (Phase 14D.1 remediation)

## Webhook Security
- [x] Razorpay: `verifySignature()` with timingSafeEqual
- [x] Stripe: raw body + signature verification
- [x] Membership webhook: HMAC signature verification via `verifySignature()` — **FIXED Phase P3**
- [x] Webhook sender IP whitelist

## AI Security
- [x] AI Gateway has credit enforcement (402 when insufficient)
- [x] No raw SQL execution endpoints (Phase 14D.1 remediation)
- [x] All AI endpoints use TaskType-based cost model
- [x] AI prompt injection protections via Gateway

## Monitoring & Incident Response
- [x] Sentry error tracking
- [x] Prometheus metrics
- [ ] Log rotation (not configured — medium priority)
- [ ] Automated backup to S3 (not configured — medium priority)
- [x] Graceful shutdown on SIGTERM/SIGINT

## Environment
- [x] `.env.production` has all required variables
- [x] PAYMENT_MODE validation (rejects test keys in live mode)
- [x] No secrets committed to repository
- [x] CSRF secret in env (not hardcoded)
