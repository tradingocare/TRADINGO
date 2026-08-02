# Configuration Audit — TRADINGO v1.0.0

**Date**: 2026-07-20  
**Phase**: P2.1 — Official Configuration Integration  

---

## 1. Environment Files

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `.env` | 96 | ✅ EXISTING | Development secrets |
| `.env.example` | 188 | ✅ **UPDATED** | Added 11 missing vars |
| `.env.production` | 112 | ✅ **UPDATED** | Fixed CLICKHOUSE_HOST/PORT → URL; added RAZORPAY_ACCOUNT_NUMBER; added NEXT_PUBLIC_* block |
| `apps/api/.env` | 85 | ✅ **UPDATED** | Added PAYMENT_MODE, AI_VAULT_MASTER_KEY |
| `.env.staging` | — | ❌ MISSING | Not created — not required for Phase P2.1 |

## 2. Config Namespaces (NestJS ConfigService)

| Namespace | File | Vars Registered | Status |
|-----------|------|----------------|--------|
| `app` | `app.config.ts:4` | PORT, NODE_ENV | ✅ |
| `database` | `app.config.ts:9` | DATABASE_URL | ✅ |
| `redis` | `app.config.ts:13` | REDIS_URL | ✅ |
| `jwt` | `app.config.ts:17` | JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN | ✅ |
| `aws` | `app.config.ts:24` | AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, CLOUDFRONT_DOMAIN | ✅ |
| `opensearch` | `app.config.ts:32` | OPENSEARCH_URL, OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD, OPENSEARCH_REJECT_UNAUTHORIZED | ✅ |
| `sentry` | `app.config.ts:39` | SENTRY_DSN, SENTRY_ENABLED | ✅ |
| `razorpay` | `app.config.ts:44` | RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, **RAZORPAY_ACCOUNT_NUMBER** (added), PAYMENT_MODE | ✅ **UPDATED** |
| `clickhouse` | `app.config.ts:52` | CLICKHOUSE_URL, CLICKHOUSE_USERNAME, CLICKHOUSE_PASSWORD | ✅ |

## 3. Frontend Env Config (`apps/web/lib/env.ts`)

| Key | Required | Source | Status |
|-----|----------|--------|--------|
| NEXT_PUBLIC_API_URL | ✅ Yes | process.env | ✅ |
| NEXT_PUBLIC_SOCKET_URL | ✅ Yes (now falls back to API_URL) | process.env | ✅ **IMPROVED** |
| NEXT_PUBLIC_SITE_URL | ✅ Yes | process.env | ✅ |
| NEXT_PUBLIC_APP_URL | ❌ No | process.env | ✅ |
| NEXT_PUBLIC_SENTRY_DSN | ❌ No | process.env → SENTRY_DSN fallback | ✅ |
| NEXT_PUBLIC_APP_VERSION | ❌ No | process.env | ✅ |
| NEXT_PUBLIC_APP_ENV | ❌ No | process.env | ✅ |
| GA_ID | ❌ No | process.env | ✅ |

## 4. Social Links / Branding

| Location | Before | After |
|----------|--------|-------|
| `master-data.ts` FOOTER_SOCIAL_LINKS | Facebook, X, LinkedIn, YouTube | **LinkedIn, Facebook, Instagram, YouTube** |
| `navbar.tsx` socialLinks | Facebook, X, LinkedIn, Telegram, YouTube | **LinkedIn, Facebook, Instagram, YouTube** |
| TwitterIcon component | ✅ Present | ❌ Removed (no longer referenced) |
| TelegramIcon component | ✅ Present | ❌ Removed (replaced by InstagramIcon) |
| InstagramIcon component | ❌ Missing | ✅ Added (inline SVG) |

## 5. Integration Audit

| Integration | Status | Config Source | Notes |
|-------------|--------|---------------|-------|
| PostgreSQL | ✅ CONFIGURED | DATABASE_URL → ConfigService | |
| Redis | ✅ CONFIGURED | REDIS_URL → ConfigService | |
| BullMQ | ✅ CONFIGURED | Uses REDIS_URL | |
| Razorpay | ✅ CONFIGURED | RAZORPAY_* → ConfigService | Added RAZORPAY_ACCOUNT_NUMBER for payouts |
| Stripe | ✅ CONFIGURED | STRIPE_* → ConfigService | Optional integration |
| AWS S3 | ✅ CONFIGURED | AWS_* → ConfigService | File storage, presigned URLs |
| AWS SES | ✅ CONFIGURED | AWS_* + EMAIL_FROM → ConfigService | Email delivery |
| CloudFront | ✅ CONFIGURED | CLOUDFRONT_DOMAIN → ConfigService | CDN for uploaded files |
| OpenSearch | ✅ CONFIGURED | OPENSEARCH_* → ConfigService | Full-text search |
| ClickHouse | ✅ CONFIGURED | CLICKHOUSE_* → ConfigService | Analytics |
| Sentry | ✅ CONFIGURED | SENTRY_* → ConfigService | Error tracking |
| Prometheus | ✅ CONFIGURED | Hardcoded port 9100 | Metrics |
| Grafana | ✅ CONFIGURED | docker-compose, dashboard JSON | Monitoring |
| Google OAuth | ✅ CONFIGURED | GOOGLE_* → ConfigService | Social login |
| LinkedIn OAuth | ✅ CONFIGURED | LINKEDIN_* → ConfigService | Social login |
| Google Maps | ✅ CONFIGURED | GOOGLE_MAPS_API_KEY → ConfigService | |
| Twilio SMS | ✅ CONFIGURED | TWILIO_* → ConfigService | SMS delivery |
| Turnstile | ✅ CONFIGURED | TURNSTILE_* → ConfigService | Bot protection |
| GA4 | ✅ CONFIGURED | GA4_* → ConfigService | Analytics |
| AI Gateway (OpenRouter) | ✅ CONFIGURED | OPENROUTER_* → ConfigService | |
| AI Gateway (Gemini) | ✅ CONFIGURED | GEMINI_* → ConfigService | |
| AI Gateway (Groq) | ✅ CONFIGURED | GROQ_* → ConfigService | |
| AI Gateway (Tavily) | ✅ CONFIGURED | TAVILY_* → ConfigService | |
| AI Gateway (Firecrawl) | ✅ CONFIGURED | FIRECRAWL_* → ConfigService | |
| AI Gateway (OpenAI) | ✅ CONFIGURED | OPENAI_* → ConfigService | |
| Cloudinary | ❌ NOT USED | N/A | No references in any source file |
| Resend | ❌ NOT USED | N/A | No references in any source file |
| AWS SNS | ❌ NOT USED | AWS_SNS_* defined but no code usage | Credentials defined in `apps/api/.env` only |
| MongoDB | ❌ NOT USED | N/A | Only in `package-lock.json` as transitive optional dep |
| ClamAV | ⚠️ CONFIGURED | Hardcoded defaults in code | No env vars exposed |

## 6. Joi Validation Schema Coverage

`app.config.ts:57-94` validates 37 env vars. **Missing from validation**: RAZORPAY_ACCOUNT_NUMBER, NEXT_PUBLIC_* vars (frontend-only, not needed in API validation).

## 7. Secret Exposure Check

| Check | Result |
|-------|--------|
| API secrets accessible from frontend? | ✅ NO — Only NEXT_PUBLIC_* vars available client-side |
| .env files in .gitignore? | ✅ YES — `.env` and `.env.*.local` ignored |
| .env.example contains real secrets? | ✅ NO — Contains placeholder values |
| .env.production contains real secrets? | ✅ NO — Contains `<replace>` placeholders |
