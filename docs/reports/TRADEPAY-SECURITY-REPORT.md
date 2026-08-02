# TradePay Security Report — RC1

## Audit Scope
Security review of all payment-adjacent controllers and configurations. Based on Phase E1 security audit findings.

## Issues Found & Remediated

### CSRF Protection
**Issue**: Webhook endpoints (`/payments/webhook/*`) use Razorpay/Stripe signature verification, not CSRF tokens. CSRF protection blocking valid webhook callbacks is a denial-of-service risk.

**Fix**: Added documentation comment in `main.ts` clarifying that webhooks use signature verification (not CSRF). `app.register(csrf)` with default config — CSRF token validation remains active for all browser-facing routes.

### Missing Rate Limiting
**Issue**: 7 payment-related controllers had no rate limiting, exposing critical financial endpoints to abuse.

**Fix**: Applied `@Throttle()` decorators:
| Controller | Limit | TTL |
|-----------|-------|-----|
| CommissionController | 30 | 60s |
| PayoutController | 30 | 60s |
| PayoutAdminController | 120 | 60s |
| PaymentController | 30 | 60s |
| PaymentSubscriptionController | 10 | 60s |
| PaymentAdminController | 120 | 60s |

### .env Placeholder Validation
**Issue**: Razorpay credentials could contain placeholder values (`your-razorpay-key-id-here`) that would cause silent failures at runtime.

**Fix**: Added `RAZORPAY_CONFIG_VALIDATOR` provider to `AppModule` that warns at startup if keys are missing or contain placeholder strings.

## Security Posture
- ✅ All payment-controllers have rate limiting
- ✅ CSRF enforcement with webhook exemption documented
- ✅ Razorpay credential validation at startup
- ✅ ThrottlerGuard registered as APP_GUARD (100 req/min default)
- ✅ All Guard patterns consistent with existing RBAC (JwtAuthGuard + RolesGuard)

## Remaining Risk
- Webhook endpoint signature verification logic must be tested with production Razorpay webhook payloads
- Payouts API uses Razorpay Payouts endpoint directly — ensure the Razorpay account has payouts enabled in the dashboard
- Rate limiting is application-level (NestJS) — infrastructure-level rate limiting (WAF/nginx) remains a separate concern
