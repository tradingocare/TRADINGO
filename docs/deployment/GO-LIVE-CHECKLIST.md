# TRADINGO v1.0.0 — Go-Live Checklist

## Pre-Deployment

### Environment
- [ ] Production `.env` populated with real secrets (no placeholder values)
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are random 64-char strings
- [ ] `AI_VAULT_MASTER_KEY` is a random 64-char string
- [ ] `NODE_ENV=production` set on all services
- [ ] `PAYMENT_MODE=live` (if processing real payments)
- [ ] All AI provider API keys configured (OpenRouter, Gemini, Groq, Tavily, Firecrawl)
- [ ] AWS credentials configured (S3, SES, CloudFront)
- [ ] Twilio credentials configured (SMS)
- [ ] Razorpay/Stripe live keys configured
- [ ] SMTP credentials configured (SendGrid or equivalent)
- [ ] Google OAuth credentials configured
- [ ] LinkedIn OAuth credentials configured
- [ ] Google Maps API key configured
- [ ] Sentry DSN configured with `SENTRY_ENABLED=true`
- [ ] Slack webhook URL configured

### SSL Certificates
- [ ] SSL certificate for `tradingo.io` obtained and placed at `/etc/nginx/ssl/tradingo.{crt,key}`
- [ ] SSL certificate for `api.tradingo.io` obtained and placed at `/etc/nginx/ssl/api.tradingo.{crt,key}`
- [ ] SSL certificate chain verified
- [ ] Auto-renewal configured (certbot/cert-manager)

### Infrastructure
- [ ] PostgreSQL 16 running and accessible
- [ ] Redis 7 running and accessible
- [ ] OpenSearch 2.17 running and accessible
- [ ] ClickHouse running (if analytics enabled)
- [ ] ClamAV running (if malware scanning enabled)
- [ ] MinIO or S3-compatible storage accessible
- [ ] Network security groups configured (only expose 443, 80 from nginx)
- [ ] Firewall rules verified

### Monitoring
- [ ] Prometheus running and scraping all targets
- [ ] Grafana running with dashboards imported
- [ ] Alertmanager configured with real PagerDuty/Slack keys
- [ ] Sentry enabled and receiving test events
- [ ] Uptime monitoring configured (e.g., Pingdom, StatusCake)
- [ ] Log aggregation configured (CloudWatch ELK/Loki)

### Backup
- [ ] Backup cron job installed (daily pg_dump)
- [ ] S3 bucket created for backups
- [ ] Restore procedure verified with a test restore

### CI/CD
- [ ] GitHub Actions workflows verified (test, build, deploy)
- [ ] Docker images build successfully
- [ ] Deployment target configured (ECS / bare metal / k8s)

## Deployment — Production

### Database
- [ ] Database user created with limited permissions
- [ ] `prisma migrate deploy` executed (all migrations applied)
- [ ] Seed data loaded: admin user, plans, AI prompts, categories
- [ ] Database backup taken before first deploy

### API
- [ ] API Docker image built and pushed to registry
- [ ] API container started with production env
- [ ] `/api/v1/live` returns 200 `{"status":"ok"}`
- [ ] `/api/v1/ready` returns 200 with all dependency checks green
- [ ] `/api/v1/health` returns 200

### Frontend
- [ ] Web Docker image built and pushed to registry
- [ ] Web container started with production env
- [ ] Frontend accessible at `https://tradingo.io`
- [ ] `/` homepage loads without errors
- [ ] `/login` renders correctly

### Workers
- [ ] BullMQ workers started (notifications, email, background jobs)
- [ ] Worker logs show no errors

### Nginx
- [ ] Nginx container started and routing correctly
- [ ] HTTPS redirect works (HTTP → HTTPS)
- [ ] HSTS headers present
- [ ] Static asset caching working (365d for `/_next/static`)

## Post-Deployment Validation

### Smoke Tests
- [ ] `scripts/deploy/smoke-test.sh` passes (all 7 checks)
- [ ] API live endpoint returns `{"status":"ok"}`
- [ ] API ready endpoint returns all dependencies green
- [ ] API health endpoint returns OK
- [ ] Categories endpoint returns data
- [ ] Products endpoint returns data
- [ ] Homepage returns 200

### Critical User Journeys
- [ ] Buyer: Register → RFQ → Quote → Negotiate → PO → Order → Ship → Deliver → Pay
- [ ] Seller: Register → Create Product → Receive RFQ → Submit Quote → Negotiate → Fulfill Order
- [ ] Professional: Register → Create Profile → Add Services → Receive Inquiry → Submit Proposal → Get Booked
- [ ] Admin: Login → View Dashboard → Manage Users → Manage Products → Review KYC → View Audit Logs
- [ ] Founder: Login → Morning Brief → Executive Dashboard → Risk Intelligence → Health Score

### Feature Validation
- [ ] GOCASH wallet creation and credit/debit
- [ ] GOCASH campaign engine (create, claim, reward)
- [ ] GOCASH referral engine (create code, validate, reward)
- [ ] GOCASH integration rewards (signup, order, RFQ, quote, etc.)
- [ ] TradTrust scoring engine (score calculation, breakdown)
- [ ] AI Gateway (process AI request, credit deduction, fallback)
- [ ] AI Credits (balance check, enforcement, admin management)
- [ ] Notifications (in-app + email delivery)
- [ ] SMS delivery (Twilio)
- [ ] Malware scanning (ClamAV)
- [ ] Advertising (create campaign, fund, approve, analytics)

### Monitoring Verification
- [ ] Prometheus targets all show UP
- [ ] Grafana dashboard loads with data
- [ ] Sentry captures a test error
- [ ] Alertmanager receives a firing alert
- [ ] Logs flowing to aggregation system

## Go/No-Go Decision

**Go Criteria** (all must pass):
- [ ] Smoke tests: all 7 checks pass
- [ ] Health endpoints: all return OK
- [ ] Database: migrations applied, no errors
- [ ] Monitoring: Prometheus UP, Sentry connected
- [ ] No critical errors in logs

**No-Go Conditions** (any triggers hold):
- [ ] Database migration fails
- [ ] Health endpoint returns non-OK status
- [ ] Auth (login/register) is broken
- [ ] Any P0 functionality is broken

## Post-Launch

### 24-Hour Monitoring
- [ ] Error rate < 1%
- [ ] p99 latency < 3s
- [ ] No 5xx spikes
- [ ] No OOM kills
- [ ] No database deadlocks

### 7-Day Monitoring
- [ ] Backup verification (first backup exists and is restorable)
- [ ] No memory leaks
- [ ] No connection pool exhaustion
- [ ] Certificate renewal verified (if < 30 days)

### Communication
- [ ] Launch announcement sent
- [ ] Status page updated
- [ ] Support team briefed
- [ ] Rollback procedure documented and accessible
