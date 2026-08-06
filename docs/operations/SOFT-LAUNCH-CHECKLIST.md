# Soft Launch Checklist

## Pre-Launch Checks

### Infrastructure
- [x] PostgreSQL 16 running (Docker, localhost:5432)
- [x] Redis 7 running (Docker, localhost:6379)
- [x] OpenSearch 2.17 running
- [x] ClickHouse running (optional dependency — API starts without)
- [x] API serving on `localhost:3001` (NestJS)
- [x] Web serving on `localhost:3000` (Next.js)
- [x] Health endpoints: `GET /api/v1/health` ✅, `GET /live` ✅, `GET /ready` ✅
- [x] Grafana on `localhost:3002`
- [x] Prometheus postgres-exporter on `:9187`

### Configuration
- [x] `.env.production` has all required vars (SMTP, OAuth, Razorpay, etc.)
- [x] `NEXT_PUBLIC_SITE_URL` set
- [x] `PAYMENT_MODE` = `live` (production) or `test` (QA)
- [x] CSRF secret set
- [x] CORS whitelist configured
- [x] CSP headers configured (with unsafe-eval removed in production)
- [x] JWT secret configured

### Security
- [x] Auth guards on all admin endpoints (Phase P-1.1 audit)
- [x] Razorpay webhook: timingSafeEqual signature verification
- [x] Membership webhook: HMAC signature verification (`verifySignature`) — **FIXED**
- [x] Rate limiting: 100 req/60s globally (ThrottlerModule)
- [x] Sentry.init() conditional on SENTRY_DSN
- [x] No dev OTP bypasses (removed Phase 14D.1)
- [x] No raw SQL analytics endpoint (removed Phase 14D.1)

### Content & Legal
- [x] Privacy Policy: `/privacy` (120+ lines)
- [x] Terms & Conditions: `/terms` (180+ lines)
- [x] Contact page: `/contact` (form + details)
- [x] Cookies Policy: `/cookies` — **NEW**
- [x] Refund Policy: `/refund` — **NEW**
- [x] favicon.ico — **FIXED** (was 404 on every page)
- [x] Metadata on all legal pages — **FIXED**
- [x] Footer links: Privacy, Terms, Contact, Cookies, Refund — **FIXED**
- [x] Sitemap: includes /cookies, /refund — **FIXED**

### SEO
- [x] `robots.ts`: blocks /api/, /seller/, /buyer/, /admin/, /login/, /register/
- [x] `sitemap.ts`: 27 static routes + dynamic categories/cities
- [x] Root layout metadata: title template, description, OG tags
- [x] Canonical URLs on all pages
- [x] JSON-LD structured data (Organization, WebApplication, BreadcrumbList)
- [ ] No hreflang tags (low priority for India-only soft launch)
- [ ] OG locale is en_US — should be en_IN (low priority)

### Monitoring & Ops
- [x] Sentry error tracking (conditional on SENTRY_DSN + SENTRY_ENABLED)
- [x] Prometheus metrics at `:9100` (global interceptor)
- [x] Graceful shutdown (SIGTERM/SIGINT)
- [x] Cron jobs: 4 scheduled (profile completeness, inactivity, GOCASH interest, GOCASH ranking)
- [x] BullMQ queues: notifications, email
- [x] Email: SES (priority) → SMTP/nodemailer (fallback)
- [x] Docker Compose healthchecks on all services
- [ ] Log rotation not configured (medium priority — will fill disk on long runs)
- [ ] No automated backup to S3 (WAL-G not configured — medium priority)

### Payment
- [x] Razorpay webhook signature verified
- [x] Stripe webhook signature verified
- [x] Payment mode validation (live/test key mismatch detection)
- [x] Webhook sender IP whitelist

### Known Issues (Documented, Not Blocking)
- [ ] ClickHouse URL is optional — API starts without it
- [ ] Prometheus + AlertManager Docker config issues on Windows
- [ ] OAuth (Google/LinkedIn) uses placeholders — social login blocked
- [ ] SMTP uses placeholders — email delivery blocked
- [ ] AI_VAULT_MASTER_KEY uses placeholder
- [ ] Log rotation not configured
- [ ] No WAL-G/S3 backup configured
