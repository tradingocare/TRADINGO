# Environment Checklist — TRADINGO v1.0.0

**For**: Production deployment / new environment setup  
**Updated**: 2026-07-20  

---

## Required Variables (App Won't Start Without)

| # | Var | Config Namespace | Where Used | Verified |
|---|-----|-----------------|------------|----------|
| 1 | `DATABASE_URL` | `database.url` | Prisma | ✅ |
| 2 | `REDIS_URL` | `redis.url` | ioredis, BullMQ | ✅ |
| 3 | `JWT_SECRET` | `jwt.secret` | Auth (min 32 chars) | ✅ |
| 4 | `JWT_REFRESH_SECRET` | `jwt.refreshSecret` | Auth (min 32 chars) | ✅ |
| 5 | `OPENSEARCH_URL` | `opensearch.url` | Search service | ✅ |

## Required for Frontend (NEXT_PUBLIC_*)

| # | Var | Required? | Default |
|---|-----|-----------|---------|
| 1 | `NEXT_PUBLIC_API_URL` | ✅ Yes | — |
| 2 | `NEXT_PUBLIC_SITE_URL` | ✅ Yes | — |
| 3 | `NEXT_PUBLIC_SOCKET_URL` | ⚠️ Falls back to API_URL | `NEXT_PUBLIC_API_URL` |

## Core Features (Set Before Going Live)

| # | Var | Feature | Without It |
|---|-----|---------|------------|
| 1 | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | File upload, email (SES) | Uploads fail, email not delivered |
| 2 | `AWS_BUCKET` | S3 upload destination | Uploads fail |
| 3 | `CLOUDFRONT_DOMAIN` | CDN for uploads | Files served from API directly |
| 4 | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | Payment processing | Payments fail |
| 5 | `RAZORPAY_WEBHOOK_SECRET` | Payment webhook verification | Webhook calls rejected |
| 6 | `RAZORPAY_ACCOUNT_NUMBER` | Seller payouts | Payouts fail silently |
| 7 | `PAYMENT_MODE` | Test vs live payments | Defaults to 'test' |
| 8 | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Frontend payment SDK | Checkout page broken |
| 9 | `SENTRY_DSN` | Error tracking | Errors not captured |
| 10 | `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` | Email delivery | Emails not sent |
| 11 | `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` | SMS delivery | SMS not sent |
| 12 | `OPENROUTER_API_KEY` | AI features | AI features fail |
| 13 | `AI_VAULT_MASTER_KEY` | API key encryption | AI key storage broken |

## OAuth (Social Login)

| # | Var | Provider |
|---|-----|----------|
| 1 | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google login |
| 2 | `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` | LinkedIn login |

## Optional (Feature Flags)

| # | Var | Default | Purpose |
|---|-----|---------|---------|
| 1 | `FEATURE_REFERRAL_UI` | false | Referral program UI |
| 2 | `FEATURE_TRACKING` | true | Event tracking |
| 3 | `FEATURE_GA4` | false | Google Analytics 4 |
| 4 | `FEATURE_PUBLIC_CRM` | true | Public CRM lead capture |
| 5 | `FEATURE_LEAD_CAPTURE` | false | Lead capture forms |
| 6 | `FEATURE_SHARE_LINKS` | false | Share product links |

## Pre-Launch Verification Steps

```bash
# 1. Verify all env vars are set
node -e "
const required = [
  'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET',
  'OPENSEARCH_URL', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_SITE_URL'
];
required.forEach(v => {
  if (!process.env[v]) console.error('MISSING:', v);
});
console.log('Check complete');
"

# 2. Verify no .env in git
git ls-files | grep '\.env$' && echo "WARNING: .env is tracked!" || echo "OK: .env not tracked"

# 3. Confirm NEXT_PUBLIC_* prefix discipline
# All frontend-exposed vars must start with NEXT_PUBLIC_
grep -r "process.env\." apps/web/lib/env.ts | grep -v "NEXT_PUBLIC_" | grep -v "GA_ID"
```

## Production Readiness Checklist

| Check | Status |
|-------|--------|
| All required env vars documented in .env.example | ✅ |
| .env.production template has all vars | ✅ |
| .env files in .gitignore | ✅ |
| No real secrets in .env.example | ✅ |
| No real secrets in .env.production | ✅ |
| Frontend only sees NEXT_PUBLIC_* vars | ✅ |
| ConfigService reads all vars with fallbacks | ✅ |
| Joi validation covers critical vars | ✅ (33 vars validated) |
