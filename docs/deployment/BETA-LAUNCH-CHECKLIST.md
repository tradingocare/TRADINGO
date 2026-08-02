# TRADINGO Beta Launch Checklist

## Pre-Launch

- [ ] Code freeze declared 48 hours before launch — no merges except critical fixes
- [ ] All PRs targeting `main` merged and reviewed
- [ ] Final `pnpm lint` and `pnpm typecheck` pass on `main` with zero errors
- [ ] Full test suite passes: `pnpm test` (unit), `pnpm --filter @tradingo/api test:e2e` (integration)
- [ ] E2E smoke tests pass on staging environment
- [ ] Sentry project created and DSN configured in AWS SSM Parameter Store
- [ ] Error tracking verified — intentional error triggers capture in Sentry dashboard
- [ ] Log aggregation (CloudWatch / Grafana Loki) confirmed receiving logs from all services
- [ ] Database migrations run against staging and validated with `prisma migrate deploy`
- [ ] Seed data script verified on staging (admin account, sample products, categories)
- [ ] Rollback migration script prepared and tested
- [ ] Docker images build successfully: `docker compose build`
- [ ] Full stack boots cleanly: `docker compose up`
- [ ] Smoke test: user registration, login, product browse, RFQ creation, quoting flow
- [ ] Payment sandbox (Razorpay test mode) flows verified end-to-end

## Auth & Security

- [ ] JWT access token expiry set to 15 minutes, refresh token to 7 days
- [ ] JWT secrets rotated — not using defaults from `.env.example`
- [ ] Rate limiting configured on auth endpoints (`/auth/login`, `/auth/register`): max 5 req/min per IP
- [ ] Account lockout after 5 failed login attempts (15-minute cooldown)
- [ ] Password policy enforced: minimum 8 characters, 1 uppercase, 1 number, 1 special
- [ ] All API routes behind authentication require valid Bearer token
- [ ] CORS configured to allow only `FRONTEND_URL` origin
- [ ] Helmet security headers active (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- [ ] HTTPS enforced — all HTTP traffic redirected to HTTPS at the load balancer
- [ ] SQL injection protection via Prisma parameterized queries (confirmed no raw queries)
- [ ] CSRF protection verified for all mutation endpoints
- [ ] Secrets stored in AWS SSM Parameter Store (not in env files, not in code)
- [ ] IAM roles with least-privilege principle for ECS, RDS, S3
- [ ] Security group rules restrict inbound traffic to ALB only (port 443), internal traffic on app ports
- [ ] KYC document uploads scanned for malware (ClamAV or AWS GuardDuty)
- [ ] OWASP Top 10 vulnerabilities scanned (see Testing Guide for tooling)
- [ ] `docker scan` or `trivy` image scan passes with zero critical/high findings
- [ ] 2FA (TOTP) option available for seller/buyer accounts

## Performance

- [ ] Load testing completed with target: 1000 concurrent users, <2s response time for 95th percentile
- [ ] API response times: <200ms for read endpoints, <500ms for write endpoints (p95)
- [ ] Next.js page Lighthouse scores validated (see Testing Guide for targets)
- [ ] Database query analysis — no sequential scans on hot tables; missing indexes added
- [ ] Redis caching configured for session data, rate limiter, and hot API responses
- [ ] CDN (CloudFront) configured for static assets and product images
- [ ] Image optimization: WebP format, responsive srcset, lazy loading
- [ ] Bundle size analyzed — main JS chunk under 200 KB gzipped
- [ ] Prisma connection pool tuned (default: 10 connections per instance)
- [ ] `Connection: keep-alive` enabled at the load balancer
- [ ] Database connection pooling via PgBouncer (or RDS Proxy) for production
- [ ] ClickHouse queries benchmarked for analytics dashboards — under 1s for 30-day aggregations
- [ ] OpenSearch index refresh interval set to 30s for write-heavy tables

## Monitoring

- [ ] Sentry alerts configured for: `p95` latency >3s, error rate >1%, 5xx spike >5%
- [ ] CloudWatch dashboards created: API (request count, latency, error rate), Web (page views, SSR errors), Infrastructure (CPU, memory, disk)
- [ ] Prometheus metrics endpoint `/metrics` accessible (port 9100 for API)
- [ ] Grafana dashboards imported and tested:
  - [ ] Node.js / NestJS runtime metrics
  - [ ] PostgreSQL query performance & connection count
  - [ ] Redis cache hit ratio & memory usage
  - [ ] ECS service CPU/memory reservation
- [ ] Uptime monitoring configured (Pingdom / Checkly / CloudWatch Synthetics): 1-minute interval
- [ ] Synthetic transactions for critical flows: login, search, RFQ flow, payment
- [ ] Slack webhook integration tested for alert notifications
- [ ] Log retention policy set: 30 days in CloudWatch, archived to S3 Glacier after 90 days
- [ ] Custom metrics for business KPIs (registrations, orders, RFQs, revenue) published to CloudWatch
- [ ] Alert thresholds documented and reviewed with the team
- [ ] On-call rotation established with escalation policy

## Infrastructure

- [ ] SSL/TLS certificate provisioned (AWS Certificate Manager) and auto-renewing
- [ ] DNS records configured in Route 53:
  - [ ] `tradingo.io` — CloudFront (web)
  - [ ] `api.tradingo.io` — ALB (API)
  - [ ] `www.tradingo.io` — redirect to `tradingo.io`
- [ ] CDN (CloudFront) distribution deployed with:
  - [ ] Origin: ALB for dynamic, S3 for static assets
  - [ ] Custom error pages (404, 500)
  - [ ] Geo-restriction disabled (global access)
- [ ] WAF (AWS WAF) rules active: SQL injection, XSS, rate-based block, IP reputation lists
- [ ] Automated database backups enabled: daily snapshot, 7-day retention
- [ ] Point-in-time recovery configured for RDS (35-day retention)
- [ ] S3 bucket versioning enabled for uploads bucket
- [ ] Infrastructure-as-code templates (CloudFormation / Terraform) reviewed and applied
- [ ] Auto-scaling configured: ECS services scale between 2–10 tasks based on CPU/memory
- [ ] Multi-AZ deployment for RDS (production)
- [ ] ECS task definitions use `awsvpc` network mode
- [ ] AMI / container image updates automated via CI/CD

## Content

- [ ] Homepage hero section, value propositions, and CTA finalized
- [ ] "Why Tradingo" page content complete
- [ ] About, Privacy Policy, Terms of Service pages published
- [ ] Contact page with form submission working (data stored in DB + Slack notification)
- [ ] SEO metadata (title, description, Open Graph) set for all static pages
- [ ] Dynamic OG images generated for product/category/company pages
- [ ] `sitemap.xml` generated and submitted to Google Search Console
- [ ] `robots.txt` correctly configured (allow public pages, disallow auth/admin/seller/buyer)
- [ ] JSON-LD structured data added for Organization, WebSite, Product, BreadcrumbList
- [ ] Google Analytics (GA4) property created and tracking tag deployed
- [ ] Google Search Console property verified
- [ ] Social media preview cards verified (Twitter, LinkedIn, Facebook)
- [ ] 404 page with search bar and navigation links
- [ ] Offline page with cached assets (service worker registered)

## Communication

- [ ] Status page created (e.g., `status.tradingo.io` via Atlassian Statuspage or Instatus)
- [ ] Support email (support@tradingo.io) configured and monitored
- [ ] In-app support widget (Intercom / Crisp / Freshchat) integrated
- [ ] Slack channel `#tradingo-alerts` created and connected to monitoring tools
- [ ] Email templates finalized:
  - [ ] Welcome email
  - [ ] Email verification
  - [ ] Password reset
  - [ ] Order confirmation (buyer & seller)
  - [ ] RFQ response notification
  - [ ] Payment receipt
  - [ ] Dispute update
- [ ] SMS delivery (Twilio / AWS SNS) confirmed for mobile verification and critical alerts
- [ ] Internal runbook created for: deployment rollback, database restore, incident response
- [ ] Launch announcement drafted for: blog, LinkedIn, Twitter, email list

## Launch Day

### Pre-Deployment (T-60 min)
- [ ] Final CI pipeline triggered and confirmed green
- [ ] Database backup taken (manual snapshot before migration)
- [ ] Rollback plan reviewed with the team

### Deployment Sequence
- [ ] Run database migrations against production
- [ ] Deploy API service (rolling update, 2-task minimum)
- [ ] Wait for API health check to pass (endpoint `/api/v1/health`)
- [ ] Deploy Web service (rolling update)
- [ ] Wait for Web health check to pass
- [ ] Verify CDN invalidation for updated assets
- [ ] Verify SSL certificate is valid and serving

### Smoke Tests (T+15 min)
- [ ] Homepage loads (200 status, <2s)
- [ ] User registration flow complete
- [ ] Login/logout flow works
- [ ] Product search returns results
- [ ] RFQ creation and quoting flow works
- [ ] Payment gateway renders and test transaction succeeds
- [ ] Mobile responsive layout verified (Chrome DevTools device emulation)

### Monitoring (T+30 min)
- [ ] Sentry dashboard shows zero unhandled errors
- [ ] CloudWatch alarm status: OK for all services
- [ ] API p95 latency <500ms
- [ ] Web page load time <3s (LCP)
- [ ] Database connection count within normal range
- [ ] No 5xx errors in the last 15 minutes

### Rollback Plan
If critical issues emerge within the first hour:
- [ ] Stop traffic: Update ALB default target group to point to previous task revision
- [ ] Revert database: Restore pre-deployment snapshot if migration was destructive
- [ ] Revert DNS: Point CloudFront origin to previous deployment
- [ ] Notify users via status page and in-app banner
- [ ] Declare incident, begin root-cause analysis

## Post-Launch

- [ ] First 24 hours: active monitoring by engineering team (on-call rotation active)
- [ ] First 7 days: daily standup to review metrics, errors, and user feedback
- [ ] Collect initial user feedback via in-app survey (NPS or CSAT)
- [ ] Review analytics: user acquisition, conversion funnel, drop-off points
- [ ] Analyze error logs and Sentry issues — prioritize fixes for launch-week bugs
- [ ] Performance audit: compare Lighthouse scores against targets, optimize if needed
- [ ] Database query performance review — add missing indexes from real query patterns
- [ ] Update runbook with any new findings from the launch process
- [ ] Schedule retrospective: what went well, what could be improved for next release
