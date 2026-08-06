# TRADINGO PHASE 2

## Business Execution & Production Readiness Program

**Program Owner:** CTO / CPO / COO (unified leadership)
**Program Status:** 🟢 EXECUTION READY
**Date:** 2026-07-18
**Version:** 1.0.0

---

## Executive Summary

TRADINGO v1.0.0 GA is a fully built B2B marketplace platform with **260+ database models, 1,356 API endpoints, 280 frontend routes, 92 backend modules, 5 AI agents, and full production infrastructure** (Docker, K8s, CI/CD, monitoring, backup, DR).

Phase 2 transitions the organization from **software development to business execution**. Every workstream is designed to drive one or more of: production stability, customer acquisition, seller/buyer acquisition, membership revenue, TradeServ revenue, operational excellence, business automation, and scalability.

**Platform Maturity at Phase 2 Entry:**

| Domain | Readiness | Key Assets |
|--------|-----------|------------|
| Production Infrastructure | 86% | Docker Compose, K8s, CI/CD, monitoring |
| Security | 97% | 66 controls, 14 categories, guards, encryption |
| AI Platform | 92% | 5 agents, Runtime, Federation, Gateway |
| Onboarding | Ready | Buyer/Seller/TradeServ wizards |
| KYC/Verification | Ready | Company + User verification flows |
| Membership | Ready | 8 plans, subscription lifecycle, billing |
| Payments | Ready | Stripe + Razorpay, webhooks, refunds |
| Notifications | Ready | 150+ templates, Email/SMS/WebSocket |
| CRM | Ready | Full pipeline + AI CRM copilot |
| Marketing | Ready | Campaigns, Referrals, Advertising |
| Analytics | Ready | 13 domain analytics services |
| Legal/Compliance | 🔴 0% | **No documents exist** |
| Support/FAQ | 🟡 Minimal | Beta support only |
| Marketing/Sales | 🟡 Minimal | Brand guidelines only |
| ECS/Auto-scaling | 🔴 Missing | Directory empty |

---

## Phase 2 Structure

### Workstreams (18 Total)

| # | Workstream | Priority | Business Goal | Duration |
|---|------------|----------|---------------|----------|
| 1 | Production Infrastructure | P0 | Stability & Scalability | Days 1-30 |
| 2 | Deployment Pipeline | P0 | Reliable Releases | Days 1-20 |
| 3 | Security Hardening | P0 | Trust & Compliance | Days 1-15 |
| 4 | Performance Optimization | P1 | User Experience | Days 15-45 |
| 5 | Monitoring & Incident Mgmt | P0 | Operational Excellence | Days 1-30 |
| 6 | Marketplace Operations | P1 | Daily Business Operations | Days 15-60 |
| 7 | Seller Acquisition | P1 | Supply Growth | Days 15-90 |
| 8 | Buyer Acquisition | P1 | Demand Growth | Days 15-90 |
| 9 | TradeServ Operations | P2 | Revenue Diversification | Days 30-90 |
| 10 | Membership Revenue | P1 | Core Revenue | Days 1-60 |
| 11 | Customer Success | P2 | Retention & Growth | Days 30-90 |
| 12 | Support Center | P1 | Trust & Operations | Days 15-45 |
| 13 | Business Analytics | P1 | Data-Driven Decisions | Days 15-60 |
| 14 | Finance & Compliance | P0 | Legal & Regulatory | Days 1-30 |
| 15 | Legal Documentation | P0 | Risk Mitigation | Days 1-30 |
| 16 | Marketing Foundation | P1 | Brand & Awareness | Days 15-60 |
| 17 | Growth Engine | P2 | Viral & Organic Growth | Days 45-90 |
| 18 | Founder Dashboard | P1 | Strategic Visibility | Days 15-30 |

---

## Workstream 1: Production Infrastructure

### Mission
Achieve production-grade infrastructure with zero unplanned downtime, automated scaling, and disaster recovery validated within 30 days.

### Business Goal
Guarantee 99.9% platform availability from Day 1 of public launch. Every minute of downtime costs revenue and trust.

### Technical Goal
Move from manually-managed Docker Compose to production infrastructure with auto-scaling, self-healing, and infrastructure-as-code.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Docker Compose (dev) | `docker-compose.yml` | ✅ Verified |
| Docker Compose (prod) | `docker-compose.prod.yml` | ✅ Verified |
| Docker Compose (backup) | `ops/backup/docker-compose.backup.yml` | ✅ Complete |
| 3 Dockerfiles | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `ops/backup/Dockerfile.backup` | ✅ Complete |
| 14 K8s manifests | `ops/k8s/` | ✅ Complete |
| Nginx config | `infrastructure/nginx/nginx.conf` + `sites/tradingo.conf` | ✅ Complete |
| SSL instructions | `infrastructure/nginx/ssl/README.md` + `docs/deployment/ssl-config.md` | ✅ Complete |
| .env production template | `.env.production` | ✅ Complete |
| ECS directory | `infrastructure/ecs/` | 🔴 **Empty** |
| Load testing scripts | `ops/load-testing/` (4 k6 scripts) | ✅ Complete |
| DR scripts | `ops/recovery/dr-failover.sh`, `dr-failback.sh`, `rollback.sh` | ✅ Complete |
| Backup scripts | `ops/backup/` (8 files) | ✅ Complete |
| Postgres + Redis | Running in Docker (local dev) | ✅ Running |

### Existing Components — Reuse Plan

| Component | Reuse | Action Required |
|-----------|-------|-----------------|
| Docker Compose prod | Direct deployment | Add resource limits (already defined), verify env vars |
| K8s manifests | AWS EKS / DigitalOcean K8s | Apply secrets template, configure ingress TLS |
| Nginx config | Edge reverse proxy | Add to Docker Compose, configure domain/prod SSL |
| k6 scripts | CI/CD smoke tests | Integrate into deploy.yml as post-deploy check |
| Backup scripts | Cron jobs in production | Configure S3 buckets, IAM roles, monitoring |
| DR scripts | Production runbook | Update paths, test in staging |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 1.1 | Configure production domain DNS (tradingo.io, api.tradingo.io) | DevOps | 1 day | Domain registration |
| 1.2 | Provision production VPS/K8s cluster (AWS EKS or DigitalOcean) | DevOps | 2 days | Cloud account, budget |
| 1.3 | Configure SSL certificates via Let's Encrypt + auto-renewal | DevOps | 1 day | Domain DNS |
| 1.4 | Deploy monitoring stack (Prometheus + Grafana + Alertmanager) | DevOps | 2 days | 1.2 |
| 1.5 | Configure S3 backup bucket + IAM roles + lifecycle policies | DevOps | 1 day | AWS account |
| 1.6 | Test full backup + restore cycle in staging | DevOps + QA | 2 days | 1.4, 1.5 |
| 1.7 | Create ECS task definitions (fill `infrastructure/ecs/`) | DevOps | 2 days | — |
| 1.8 | Implement auto-scaling rules (CPU > 70% → +1 replica) | DevOps | 1 day | 1.2 |
| 1.9 | Set up CDN (CloudFront) for static assets + images | DevOps | 1 day | 1.1 |
| 1.10 | Load test production endpoints (sustain 1000 concurrent users) | QA | 3 days | 1.2 |

### Testing Plan
1. Deploy to staging → verify all 1,356 endpoints respond
2. Run k6 smoke test → verify < 500ms P95 latency
3. Run k6 stress test → identify breaking point
4. Test backup restore → verify data integrity
5. Test auto-scaling → verify +1 replica on CPU spike
6. Test DR failover → verify < 5min RTO

### Business Validation
- All user-facing pages load in < 2s (Lighthouse)
- No 5xx errors during peak load test
- Backup RTO < 1 hour, RPO < 5 minutes
- SSL grade A+ (SSL Labs)

### Operational Validation
- Prometheus alerts configured for: high error rate, high latency, pod restarts, disk usage, certificate expiry
- Grafana dashboards display: request rate, error rate, latency (P50/P95/P99), CPU/memory, disk I/O
- PagerDuty/Slack integration for critical alerts

### KPIs
- Uptime: 99.9%+
- P95 API latency: < 500ms
- API error rate: < 0.1%
- Page load time: < 2s
- Backup success rate: 100%
- DR failover RTO: < 5 min

### Exit Criteria
- Production deployment running with health checks passing
- Auto-scaling verified with load test
- Backups running on schedule with verified restore
- Monitoring alerts configured and tested
- SSL/TLS grade A+

---

## Workstream 2: Deployment Pipeline

### Mission
Establish a reliable, automated CI/CD pipeline that enables multiple daily deployments with zero manual steps and instant rollback capability.

### Business Goal
Ship features and fixes to production within 15 minutes of code merge. Every hour of deployment delay is an hour of deferred revenue.

### Technical Goal
Fully automated GitHub Actions CI/CD pipeline with build, test, deploy, and rollback stages for both staging and production.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| CI workflow | `.github/workflows/ci.yml` | ✅ Created (untested) |
| Production deploy | `.github/workflows/deploy-production.yml` | ✅ Created (untested) |
| Staging deploy | `.github/workflows/deploy-staging.yml` | ✅ Created (untested) |
| Reusable deploy | `.github/workflows/deploy.yml` | ✅ Created (untested) |
| Playwright E2E | `.github/workflows/playwright.yml` | ✅ Created (untested) |
| Rollback script | `ops/recovery/rollback.sh` | ✅ Created |
| Release docs | `docs/deployment/` (16 files) | ✅ Complete |
| PRODUCTION-RUNBOOK | `docs/deployment/PRODUCTION-RUNBOOK.md` | ✅ 209 lines |

### Existing Components — Reuse Plan

| Component | Reuse | Action Required |
|-----------|-------|-----------------|
| CI workflow | Direct use | Verify with first push on main |
| Deploy workflows | Direct use | Configure AWS ECR + K8s credentials as GitHub secrets |
| Playwright workflow | After test suites exist | Currently will pass with 0 tests |
| Rollback script | Production ops | Integrate as GitHub Actions reusable step |
| Production Runbook | Operations reference | Keep updated with actual URIs/secrets |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 2.1 | Set up Docker registry (AWS ECR or Docker Hub) | DevOps | 1 day | — |
| 2.2 | Configure GitHub Actions secrets (AWS keys, Docker creds, env vars) | DevOps | 1 day | 2.1 |
| 2.3 | Run CI pipeline on a PR → verify lint, tsc, build pass | DevOps | 1 day | — |
| 2.4 | Run deploy-staging workflow → verify staging deployment | DevOps | 2 days | 2.2 |
| 2.5 | Integrate k6 smoke test into deploy pipeline (post-deploy check) | QA | 1 day | 2.4 |
| 2.6 | Configure staging → production promotion workflow | DevOps | 1 day | 2.4 |
| 2.7 | Test rollback from production → staging (verify < 5 min) | DevOps | 1 day | 2.6 |
| 2.8 | Set up blue-green deployment capability | DevOps | 3 days | 2.6 |
| 2.9 | Create deployment dashboard (GitHub Actions → Slack notification) | DevOps | 1 day | 2.4 |
| 2.10 | Write deployment SOP document | DevOps | 1 day | 2.7 |

### Testing Plan
1. Push code change → verify CI triggers
2. Merge to staging → verify auto-deploy
3. Run smoke test against deployed staging
4. Promote to production → verify production deploy
5. Trigger rollback → verify staging restored
6. Verify Slack notifications on each event

### Business Validation
- Deploy frequency: multiple times daily
- Time from merge to production: < 15 min
- Rollback time: < 5 min
- Zero manual deployment steps

### KPIs
- Deployment frequency: 5+/day
- Deployment success rate: 99%+
- Mean time to deploy (MTTD): < 15 min
- Mean time to rollback (MTTR): < 5 min
- CI pipeline duration: < 10 min

### Exit Criteria
- CI pipeline passes on every PR
- Staging auto-deploys on merge to staging branch
- Production deploys on merge to main (or manual trigger)
- Rollback verified end-to-end
- Slack/email notifications for deploy events

---

## Workstream 3: Security Hardening

### Mission
Achieve enterprise-grade security certification with zero critical vulnerabilities and fully compliant data protection.

### Business Goal
B2B buyers require bank-grade security before transacting. Every security concern is a lost deal. Trust is the currency of B2B marketplaces.

### Technical Goal
Remediate all 6 critical AI Gateway findings, complete pen-test coverage, and achieve ISO 27001 readiness.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| JWT Auth Guard | `guards/jwt-auth.guard.ts` | ✅ Verified |
| Roles Guard | `guards/roles.guard.ts` | ✅ Verified |
| Permissions Guard | `guards/permissions.guard.ts` | ✅ Verified |
| Company Owner Guard | `guards/company-owner.guard.ts` | ✅ Verified |
| Rate limiting (22+ endpoints) | Across controllers | ✅ Verified |
| CSRF protection | `main.ts` | ✅ Verified |
| CORS (single origin) | `main.ts` | ✅ Verified |
| Helmet CSP | `main.ts` | ✅ Verified |
| AES-256-GCM key vault | `api-key-vault.service.ts` | ✅ Verified |
| Password hashing (bcrypt 12) | `auth.service.ts` | ✅ Verified |
| JWT (15min / 7d) | `auth.module.ts` + `jwt.strategy.ts` | ✅ Verified |
| OAuth (Google, LinkedIn) | `strategies/` | ✅ Verified |
| Session rotation | `auth.service.ts` | ✅ Verified |
| ClamAV malware scanning | `clamav.service.ts` | ✅ Verified |
| File upload MIME whitelist (18 types) | `storage.controller.ts` | ✅ Verified |
| Account lockout (3 → 15min) | `auth.service.ts` | ✅ Verified |
| DTO validation (108 files) | `dto/` across modules | ✅ Verified |
| Security docs (11 files) | `docs/security/` | ✅ Complete |

### Critical Gaps

| # | Gap | Severity | Location | Fix |
|---|-----|----------|----------|-----|
| C-1 | AI Gateway: Zero input sanitization | CRITICAL | 14 unsanitized passages across providers | Add input sanitization middleware |
| C-2 | Gemini: System+User prompt concatenation | CRITICAL | `openrouter.provider.ts` | Add role barrier |
| C-3 | Fallback prompt embeds raw user payload | CRITICAL | `ai-gateway.service.ts` | Add JSON sanitization |
| C-4 | Webhook URL validation missing | CRITICAL | `webhook` controllers | Add URL allowlist |
| C-5 | Firecrawl URL whitelist only | CRITICAL | `firecrawl.provider.ts` | Add URL validation + SSRF protection |
| C-6 | No prompt length limits | CRITICAL | Gateway providers | Add max token limit per action |
| G-1 | No rate limiting on AI endpoints | HIGH | AI Gateway controllers | Add `@Throttle` decorators |
| G-2 | No pen-test report | HIGH | — | Engage third-party pen-test firm |
| G-3 | No ISO 27001 documentation | MEDIUM | — | Begin ISO readiness program |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 3.1 | Fix C-1: Add input sanitization middleware for AI Gateway | Security Lead | 2 days | — |
| 3.2 | Fix C-2: Add role barrier for Gemini provider | Security Lead | 1 day | 3.1 |
| 3.3 | Fix C-3: Add JSON sanitization for fallback prompts | Security Lead | 1 day | 3.1 |
| 3.4 | Fix C-4: Add webhook URL allowlist | Security Lead | 1 day | — |
| 3.5 | Fix C-5: Add SSRF protection + URL validation | Security Lead | 1 day | — |
| 3.6 | Fix C-6: Add max token limits per action | Security Lead | 1 day | — |
| 3.7 | Add rate limiting to AI Gateway controllers | Security Lead | 1 day | — |
| 3.8 | Engage third-party pen-test firm | CTO | 5 days | Budget |
| 3.9 | Begin ISO 27001 readiness documentation | Compliance Lead | 30 days | 3.8 |
| 3.10 | Run OWASP ZAP scan against staging | QA | 2 days | 1.2 |
| 3.11 | Security awareness training for engineering team | CTO | 2 days | — |
| 3.12 | Create security incident response SOP | Security Lead | 3 days | — |

### Business Validation
- Pen-test report with zero critical findings
- OWASP ZAP scan passes with < 5 medium findings
- ISO 27001 readiness assessment > 60%

### KPIs
- Critical vulnerabilities: 0
- High vulnerabilities: < 3
- Pen-test pass rate: 100%
- Security audit score: > 90%
- Time to patch critical vuln: < 24 hours

### Exit Criteria
- All 6 critical AI Gateway findings remediated
- Third-party pen-test completed with no critical findings
- Security incident response SOP created
- OWASP ZAP scan passes

---

## Workstream 4: Performance Optimization

### Mission
Deliver sub-2-second page loads, sub-500ms API responses, and Lighthouse scores above 90 for all critical user journeys.

### Business Goal
Every 100ms of latency reduces conversion by 7% (Amazon benchmark). For a B2B marketplace, slow pages kill trust and deal velocity.

### Technical Goal
Optimize the top-20 slowest API endpoints, implement CDN caching, add database query optimization, and achieve Lighthouse > 90.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Image optimization (webp/avif) | `next.config.ts` | ✅ Applied (RC1) |
| minimumCacheTTL: 86400 | `next.config.ts` | ✅ Applied (RC1) |
| BlockedUser indexes | `prisma/schema.prisma` | ✅ Applied (RC1) |
| Founder AI Redis caching (11 methods) | `founder-ai.service.ts` | ✅ Applied (RC1) |
| Prometheus metrics interceptor | `metrics.interceptor.ts` | ✅ Complete |
| Recording rules (P50, P95, P99) | `recording-rules.yml` | ✅ Complete |
| k6 load/stress/smoke tests | `ops/load-testing/` | ✅ Complete |
| Cache-Control headers (immutable) | `next.config.ts` | ✅ Complete |
| Brotli compression (1KB threshold) | `nginx.conf` | ✅ Complete |
| No database query optimization | — | 🔴 Not done |
| No CDN configured | — | 🔴 Not done |
| No API response caching (except Founder AI) | — | 🔴 Not done |
| No bundle analysis run | — | 🔴 Not done |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 4.1 | Set up CDN (CloudFront/Fastly) for static assets | DevOps | 2 days | 1.1 |
| 4.2 | Run Lighthouse audit on all 10 critical user journeys | QA | 3 days | — |
| 4.3 | Identify top-20 slowest API endpoints (from Prometheus metrics) | Backend Lead | 2 days | 1.4 |
| 4.4 | Add Redis caching to slowest endpoints (product search, category listings) | Backend Lead | 5 days | 4.3 |
| 4.5 | Optimize Prisma queries: add select projections, reduce N+1 | Backend Lead | 5 days | 4.3 |
| 4.6 | Add database connection pooling (pgBouncer) | DevOps | 1 day | — |
| 4.7 | Implement API response compression (already in nginx.conf — verify) | DevOps | 1 day | — |
| 4.8 | Run `@next/bundle-analyzer` → reduce bundle size | Frontend Lead | 3 days | — |
| 4.9 | Implement route-level code splitting for slow pages | Frontend Lead | 3 days | 4.8 |
| 4.10 | Add loading skeletons to all data-fetching pages | Frontend Lead | 3 days | — |

### Business Validation
- Lighthouse Performance score > 90 on all critical pages
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- API P95 latency < 500ms

### KPIs
- Lighthouse score: > 90
- FCP: < 1.5s
- LCP: < 2.5s
- API P95: < 500ms
- Bundle size: < 300KB (initial JS)
- CDN cache hit rate: > 80%

### Exit Criteria
- Lighthouse > 90 on top 10 pages
- API P95 < 500ms across all endpoints
- CDN configured and serving static assets
- Database query optimization reduces avg query time by 50%

---

## Workstream 5: Monitoring & Incident Management

### Mission
Establish 24/7 production observability with proactive alerting, automated incident response, and post-mortem-driven improvement.

### Business Goal
Detect and respond to production incidents before customers notice. Every undetected incident erodes B2B trust and costs future revenue.

### Technical Goal
Implement full-stack observability (APM, logs, metrics, traces) with automated alerting and a documented incident response process.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Prometheus config | `ops/monitoring/prometheus/prometheus.yml` | ✅ Complete |
| Alert rules (15+) | `ops/monitoring/prometheus/alert-rules.yml` | ✅ Complete |
| Recording rules | `ops/monitoring/prometheus/recording-rules.yml` | ✅ Complete |
| Alertmanager | `ops/monitoring/alertmanager.yml` | ✅ Complete |
| Grafana API dashboard | `ops/monitoring/grafana/dashboards/tradingo-api-dashboard.json` | ✅ Complete |
| Grafana Business dashboard | `ops/monitoring/grafana/dashboards/tradingo-business-dashboard.json` | ✅ Complete |
| Grafana provisioning | `grafana/provisioning/` | ✅ Complete |
| Sentry (API + Web) | 5 files across API and Web | ✅ Complete |
| Metrics interceptor | `metrics.interceptor.ts` | ✅ Complete |
| Health controller | `health/health.controller.ts` | ✅ Complete |
| k6 load testing | `ops/load-testing/` (4 scripts) | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| M-1 | No centralized log aggregation (ELK/Loki) | HIGH | Deploy Loki + Grafana |
| M-2 | No distributed tracing | MEDIUM | Add OpenTelemetry |
| M-3 | No uptime monitoring (external) | HIGH | Configure UptimeRobot/Checkly |
| M-4 | No SLA/SLO tracking dashboard | MEDIUM | Create SLO dashboard |
| M-5 | No incident response runbook | HIGH | Create incident response SOP |
| M-6 | No post-mortem process | MEDIUM | Create post-mortem template |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 5.1 | Deploy Loki + Promtail for log aggregation | DevOps | 2 days | 1.2 |
| 5.2 | Configure Grafana Loki datasource + log dashboard | DevOps | 1 day | 5.1 |
| 5.3 | Set up external uptime monitoring (UptimeRobot/Checkly) | DevOps | 1 day | 1.1 |
| 5.4 | Create SLA/SLO dashboard in Grafana | DevOps | 2 days | 1.4 |
| 5.5 | Create incident response SOP document | Ops Lead | 2 days | — |
| 5.6 | Create post-mortem template | Ops Lead | 1 day | 5.5 |
| 5.7 | Set up on-call rotation (PagerDuty/OpsGenie) | Ops Lead | 2 days | — |
| 5.8 | Integrate Sentry with Slack (critical error alerts) | DevOps | 1 day | — |
| 5.9 | Run first incident response drill | Ops Lead | 2 days | 5.5, 5.7 |
| 5.10 | Create monitoring runbook | Ops Lead | 2 days | 5.1-5.9 |

### Business Validation
- Alerts trigger within 1 minute of threshold breach
- On-call engineer acknowledges within 5 minutes
- 90% of incidents detected by automated alerts (not customer reports)

### KPIs
- Mean time to detect (MTTD): < 5 min
- Mean time to acknowledge (MTTA): < 5 min
- Mean time to resolve (MTTR): < 30 min for P0, < 2 hr for P1
- Alert accuracy (precision): > 80%
- Uptime: 99.9%+

### Exit Criteria
- Log aggregation (Loki) deployed and queryable from Grafana
- External uptime monitoring configured with 1-min check interval
- Incident response runbook created
- On-call rotation established
- One incident drill completed with documented results

---

## Workstream 6: Marketplace Operations

### Mission
Establish daily operational workflows for marketplace management, including seller onboarding, KYC processing, dispute resolution, and platform health monitoring.

### Business Goal
Process 100+ seller verifications per day, resolve disputes within 24 hours, and maintain marketplace quality standards.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Company verification | `modules/company-verification/` | ✅ Complete |
| User verification | `modules/user-verification/` | ✅ Complete |
| Profile completion | `modules/profile-completion/` | ✅ Complete |
| Onboarding (buyer/seller/TradeServ) | Multiple registration wizards | ✅ Complete |
| Membership management | `modules/membership/` | ✅ Complete |
| Payment processing | `modules/payment/` | ✅ Complete |
| Billing/invoicing | `modules/billing/` | ✅ Complete |
| Moderation (reports) | `modules/communication/moderation.service.ts` | ✅ Complete |
| Reputation (events) | `modules/reputation/` | ✅ Complete |
| TradTrust scoring | `modules/tradtrust/` | ✅ Complete |
| Dispute resolution | `modules/dispute/` | ✅ Complete |
| Settlement management | `modules/settlement/` | ✅ Complete |
| Escrow management | `modules/escrow/` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| O-1 | No marketplace operations manual | HIGH | Create operations SOP |
| O-2 | No KYC quality metrics dashboard | MEDIUM | Build KYC analytics |
| O-3 | No dispute resolution SLA tracking | MEDIUM | Add SLA tracking to dispute system |
| O-4 | No marketplace health score | MEDIUM | Build marketplace health index |
| O-5 | No automated quality monitoring | MEDIUM | Add product quality alerts |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 6.1 | Create Marketplace Operations SOP | Ops Lead | 5 days | — |
| 6.2 | Build KYC/verification analytics dashboard | Backend + Frontend | 5 days | — |
| 6.3 | Add dispute SLA tracking + escalation automation | Backend Lead | 3 days | — |
| 6.4 | Build marketplace health score (active sellers, products, RFQs, orders, disputes) | Backend Lead | 3 days | — |
| 6.5 | Add automated quality monitoring alerts (product completeness, inactive sellers) | Backend Lead | 3 days | — |
| 6.6 | Create admin marketplace operations page | Frontend Lead | 5 days | 6.2-6.5 |
| 6.7 | Establish daily marketplace health review process | Ops Lead | 2 days | 6.4 |

### Business Validation
- Seller KYC processed within 24 hours
- Disputes resolved within 24 hours
- Marketplace health score > 80%
- Product quality score > 60% across all listings

### KPIs
- KYC processing time: < 24 hours (average)
- Dispute resolution time: < 24 hours
- Marketplace health score: > 80%
- Active seller rate: > 70% of registered sellers
- Product listing quality score: > 60%

### Exit Criteria
- Operations SOP created and distributed to team
- KYC analytics dashboard live
- Dispute SLA tracking operational
- Marketplace health score dashboard live

---

## Workstream 7: Seller Acquisition

### Mission
Onboard 100+ verified sellers in the first 90 days, with focus on high-quality B2B suppliers in target verticals.

### Business Goal
Supply drives demand. Without quality sellers and products, buyers have no reason to visit. Seller acquisition is the #1 growth lever.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Seller registration wizard | `app/register/vendor/` (7 steps) | ✅ Complete |
| Seller onboarding flow | `app/seller/onboarding/` (9 sections) | ✅ Complete |
| Seller dashboard | `app/seller/dashboard/` | ✅ Complete |
| Seller product management | `app/seller/products/` | ✅ Complete |
| Seller product wizard (AI) | `app/seller/products/new/wizard.tsx` | ✅ Complete |
| Seller bulk upload | `app/seller/bulk/` | ✅ Complete |
| Seller analytics | `app/seller/analytics/` | ✅ Complete |
| Seller advertising | `app/seller/advertising/` | ✅ Complete |
| Seller agent (AI) | `app/seller/agent/` | ✅ Complete |
| Seller AI workspace | `app/seller/ai-workspace/` | ✅ Complete |
| Seller ecosystem/gamification | `app/seller/ecosystem/` | ✅ Complete |
| Seller CRM | `app/seller/crm/` | ✅ Complete |
| Seller membership | `app/seller/membership/` | ✅ Complete |
| Seller GOCASH wallet | `app/seller/gocash/` | ✅ Complete |
| Seller success insights | `app/seller/success-insights/` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| S-1 | No seller acquisition funnels (landing pages, ads) | HIGH | Create seller landing pages |
| S-2 | No seller referral program | MEDIUM | Build seller referral flow |
| S-3 | No seller onboarding email sequence | HIGH | Create automated email sequence |
| S-4 | No seller success stories/case studies | MEDIUM | Collect and publish case studies |
| S-5 | No seller marketplace (automated matching) | MEDIUM | Build seller recommendation engine |
| S-6 | No seller onboarding tracking | MEDIUM | Add onboarding funnel analytics |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 7.1 | Create seller acquisition landing page (`/sell-on-tradingo`) | Marketing + Frontend | 5 days | — |
| 7.2 | Build automated seller onboarding email sequence (5 emails) | Marketing + Backend | 3 days | — |
| 7.3 | Create seller welcome pack (PDF guide) | Marketing | 3 days | — |
| 7.4 | Build seller onboarding funnel analytics | Backend + Frontend | 3 days | — |
| 7.5 | Create seller referral flow (existing sellers refer new sellers) | Backend + Frontend | 5 days | — |
| 7.6 | Target and outreach to top-50 suppliers in priority verticals | Sales | 14 days | — |
| 7.7 | Create seller success metrics dashboard | Frontend | 3 days | — |
| 7.8 | Establish seller onboarding support (dedicated Slack/WhatsApp) | Ops Lead | 2 days | — |

### Business Validation
- 25+ sellers onboarded in first 30 days
- 100+ sellers onboarded in first 90 days
- Seller activation rate (listed products within 7 days): > 60%
- Seller retained at 90 days: > 80%

### KPIs
- New seller registrations: 100+/quarter
- Seller activation rate: > 60%
- Seller 90-day retention: > 80%
- Products per active seller: > 20
- Time to first listing: < 3 days

### Exit Criteria
- Seller landing page live with conversion tracking
- Onboarding email sequence active
- 25+ sellers onboarded
- Funnel analytics showing drop-off points

---

## Workstream 8: Buyer Acquisition

### Mission
Onboard 500+ verified buyers in the first 90 days, targeting procurement managers and businesses in TRADINGO's core verticals.

### Business Goal
Demand must match supply. Buyers drive RFQs, orders, and revenue. Every active buyer is a potential membership subscriber.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Buyer registration wizard | `app/register/buyer/` (3 steps) | ✅ Complete |
| Buyer onboarding | `app/buyer/onboarding/` | ✅ Complete |
| Buyer dashboard | `app/buyer/dashboard/` | ✅ Complete |
| Buyer search | `app/buyer/search/` | ✅ Complete |
| Buyer RFQ creation | `app/buyer/rfq/` | ✅ Complete |
| Buyer quote comparison | `app/buyer/compare-quotes/` | ✅ Complete |
| Buyer negotiation | `app/buyer/negotiation/` | ✅ Complete |
| Buyer orders | `app/buyer/orders/` | ✅ Complete |
| Buyer campaigns | `app/buyer/campaigns/` | ✅ Complete |
| Buyer ecosystem | `app/buyer/ecosystem/` | ✅ Complete |
| Buyer GOCASH | `app/buyer/gocash/` | ✅ Complete |
| Buyer membership | `app/buyer/membership/` | ✅ Complete |
| Buyer analytics | `app/buyer/analytics/` | ✅ Complete |
| Buyer agent (AI) | `app/buyer/agent/` | ✅ Complete |
| Buyer settings | `app/buyer/settings/` | ✅ Complete |
| Buyer notifications | `app/buyer/notifications/` | ✅ Complete |
| Buyer saved products | `app/buyer/saved-products/` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| B-1 | No buyer acquisition landing pages | HIGH | Create buyer landing pages |
| B-2 | No buyer onboarding email sequence | HIGH | Create automated email sequence |
| B-3 | No buyer referral program | MEDIUM | Build buyer referral flow |
| B-4 | No buyer search engine ads (SEM) strategy | MEDIUM | Create SEM plan |
| B-5 | No buyer case studies/testimonials | MEDIUM | Collect buyer testimonials |
| B-6 | No "request a demo" flow | HIGH | Build demo request form + CRM pipeline |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 8.1 | Create buyer acquisition landing page (`/buy-on-tradingo`) | Marketing + Frontend | 5 days | — |
| 8.2 | Build "request a demo" form → auto-creates CRM lead | Backend + Frontend | 3 days | — |
| 8.3 | Build automated buyer onboarding email sequence (4 emails) | Marketing + Backend | 3 days | — |
| 8.4 | Create buyer referral flow (existing buyers refer new buyers) | Backend + Frontend | 5 days | — |
| 8.5 | Target top-100 companies in priority verticals (outbound) | Sales | 14 days | — |
| 8.6 | Create buyer onboarding funnel analytics | Backend + Frontend | 3 days | — |
| 8.7 | Establish buyer onboarding support | Ops Lead | 2 days | — |
| 8.8 | Create buyer success metrics dashboard | Frontend | 3 days | — |

### Business Validation
- 100+ buyers onboarded in first 30 days
- 500+ buyers onboarded in first 90 days
- Buyer activation (first RFQ within 14 days): > 40%
- RFQ-to-quote conversion rate: > 60%

### KPIs
- New buyer registrations: 500+/quarter
- Buyer activation rate: > 40%
- Buyer 90-day retention: > 60%
- RFQs per active buyer: > 3/quarter
- Quote response rate: > 60%

### Exit Criteria
- Buyer landing page live with conversion tracking
- Demo request flow integrated with CRM
- Onboarding email sequence active
- 100+ buyers onboarded

---

## Workstream 9: TradeServ Operations

### Mission
Launch TradeServ as a revenue-generating professional services marketplace with 50+ verified professionals and 200+ completed bookings in the first 90 days.

### Business Goal
TradeServ is TRADINGO's second revenue stream (after Membership). Professional services create a higher-margin business line and increase platform stickiness.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| TradeServ Prisma models (10+) | `schema.prisma` | ✅ Complete |
| TradeServ backend module | `modules/tradeserv/` | ✅ Complete |
| TradeServ controllers (60+ endpoints) | `modules/tradeserv/controllers/` | ✅ Complete |
| TradeServ service + DTOs | `modules/tradeserv/` | ✅ Complete |
| TradeServ frontend API (40+ functions) | `lib/api/tradeserv.ts` | ✅ Complete |
| TradeServ hooks (35+) | `hooks/use-tradeserv.ts` | ✅ Complete |
| TradeServ registration wizard (7 steps) | `app/tradeserv/register/` | ✅ Complete |
| TradeServ workspace pages | `app/tradeserv/workspace/` | ✅ Complete |
| TradeServ landing page | `app/tradeserv/page.tsx` | ✅ Complete |
| TradeServ architecture docs | `docs/architecture/TRADESERV-ARCHITECTURE.md` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| T-1 | No professional acquisition funnel | HIGH | Create professional landing pages |
| T-2 | No client acquisition funnel | HIGH | Create client landing page |
| T-3 | No booking/payment flow tested end-to-end | HIGH | Test booking → payment → confirmation |
| T-4 | No TradeServ-specific membership plans | MEDIUM | Create professional plan tiers |
| T-5 | No professional onboarding email sequence | MEDIUM | Create automated sequence |
| T-6 | No review/moderation dashboard | MEDIUM | Build review moderation admin page |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 9.1 | Test booking → payment → confirmation flow end-to-end | QA | 3 days | — |
| 9.2 | Create TradeServ-specific landing pages (professionals + clients) | Marketing + Frontend | 5 days | — |
| 9.3 | Create professional onboarding email sequence | Marketing + Backend | 3 days | — |
| 9.4 | Build professional review/moderation admin page | Backend + Frontend | 3 days | — |
| 9.5 | Recruit 25+ professionals in priority service categories | Sales | 14 days | — |
| 9.6 | Create professional success dashboard | Frontend | 3 days | — |
| 9.7 | Establish TradeServ operations SOP | Ops Lead | 3 days | — |

### Business Validation
- 25+ verified professionals in first 30 days
- 50+ verified professionals in first 90 days
- 200+ bookings completed in first 90 days
- Booking value: ₹10L+ in first quarter

### KPIs
- Verified professionals: 50+
- Bookings completed: 200+/quarter
- Average booking value: ₹5,000+
- Professional retention: > 80%
- Client satisfaction rating: > 4.5/5

### Exit Criteria
- Booking → payment flow tested and working
- Professional landing page live
- 25+ professionals onboarded
- Review moderation dashboard live

---

## Workstream 10: Membership Revenue

### Mission
Convert 15% of registered sellers and 5% of registered buyers to paid membership plans within 90 days, generating ₹50L+ MRR.

### Business Goal
Membership is TRADINGO's primary revenue engine. Every paid member represents predictable, recurring revenue with high lifetime value.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| 8 membership plans | `seeds/plan-seed.ts` | ✅ Complete |
| Membership modules (buyer/seller/TradeServ) | 3 membership pages | ✅ Complete |
| Membership backend (service + controller + admin) | `modules/membership/` (4 files) | ✅ Complete |
| Membership DTOs (14) | `membership.dto.ts` | ✅ Complete |
| Subscription lifecycle | `membership.service.ts` (1092 lines) | ✅ Complete |
| Payment processing | `payment-subscription.controller.ts` | ✅ Complete |
| Invoice generation | `billing/invoice.service.ts` + `pdf.service.ts` | ✅ Complete |
| Plan upgrade/downgrade | `membership.service.ts` | ✅ Complete |
| Membership frontend API | `lib/api/membership.ts` | ✅ Complete |
| Membership hooks | `hooks/use-membership.ts` | ✅ Complete |
| Membership benefits card | `components/ecosystem/membership-benefits-card.tsx` | ✅ Complete |
| Pricing cards | `components/shared/pricing-cards.tsx` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| M-1 | No membership pricing page A/B testing | HIGH | Configure pricing page variants |
| M-2 | No free trial → paid conversion funnel | HIGH | Build trial expiration flow |
| M-3 | No membership upgrade email sequence | MEDIUM | Create upgrade email campaign |
| M-4 | No membership analytics dashboard | HIGH | Build membership revenue dashboard |
| M-5 | No churn prediction | MEDIUM | Add churn prediction model |
| M-6 | No membership referral program | MEDIUM | Extend referral engine for memberships |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 10.1 | Build membership revenue dashboard | Backend + Frontend | 3 days | — |
| 10.2 | Create free trial → paid conversion flow with email reminders | Backend + Marketing | 5 days | — |
| 10.3 | Create membership upgrade email sequence (3 emails) | Marketing + Backend | 3 days | — |
| 10.4 | Configure pricing page variants (annual vs monthly, feature tiers) | Frontend Lead | 3 days | — |
| 10.5 | Extend referral engine: membership referral rewards | Backend Lead | 3 days | — |
| 10.6 | Build churn prediction alerts (identify at-risk subscribers) | Backend Lead | 3 days | — |
| 10.7 | Create membership onboarding call process for Elite/Premium plans | Sales | 5 days | — |

### Business Validation
- 15% seller-to-paid conversion
- 5% buyer-to-paid conversion
- Monthly churn < 5%
- Average revenue per user (ARPU) > ₹5,000/mo (sellers), > ₹2,000/mo (buyers)

### KPIs
- Paid members: 150+ sellers, 50+ buyers at 90 days
- MRR: ₹50L+
- ARPU (seller): ₹5,000+/mo
- ARPU (buyer): ₹2,000+/mo
- Monthly churn: < 5%
- Trial-to-paid conversion: > 20%

### Exit Criteria
- Membership revenue dashboard live
- Trial → paid conversion flow operational
- Upgrade email sequence active
- 50+ paid members

---

## Workstream 11: Customer Success

### Mission
Ensure every buyer and seller achieves their first success milestone within 14 days of registration, driving activation and long-term retention.

### Business Goal
Customer success is the #1 retention lever. A buyer who posts their first RFQ within 14 days has 3x higher 90-day retention.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Notification system | Full module | ✅ Complete |
| Email processor | `jobs/email.processor.ts` | ✅ Complete |
| SMS service | `modules/sms/` | ✅ Complete |
| In-app notifications | `components/notifications/notification-drawer.tsx` | ✅ Complete |
| Ecosystem/gamification | `components/ecosystem/` (16 components) | ✅ Complete |
| GOCASH rewards | Full engine | ✅ Complete |
| AI agents (buyer + seller) | `modules/buyer-agent/`, `modules/seller-agent/` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| CS-1 | No customer success playbook | HIGH | Create success playbook |
| CS-2 | No "first success" milestone tracking | HIGH | Build milestone tracking |
| CS-3 | No health score for sellers/buyers | HIGH | Build customer health score |
| CS-4 | No NPS survey system | MEDIUM | Build NPS survey flow |
| CS-5 | No churn early warning system | HIGH | Build churn detection |
| CS-6 | No customer communication calendar | MEDIUM | Create communication schedule |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 11.1 | Create Customer Success Playbook | CS Lead | 5 days | — |
| 11.2 | Build customer health score (logins, RFQs, orders, disputes, payments) | Backend Lead | 5 days | — |
| 11.3 | Build milestone tracking (first login, first RFQ, first order, first payment) | Backend + Frontend | 3 days | — |
| 11.4 | Build NPS survey → automated trigger at 30 days | Backend | 3 days | — |
| 11.5 | Build churn early warning system (inactivity, dispute, payment failure) | Backend Lead | 3 days | — |
| 11.6 | Create customer communication calendar | CS Lead | 2 days | — |
| 11.7 | Build customer success dashboard for CS team | Frontend | 5 days | 11.2-11.5 |

### Business Validation
- 70%+ of buyers post first RFQ within 14 days
- 60%+ of sellers list first product within 7 days
- NPS score > 40 at 90 days
- Customer health score > 70% for active customers

### KPIs
- Time to first RFQ (buyer): < 14 days (target 70%)
- Time to first listing (seller): < 7 days (target 60%)
- NPS: > 40
- Customer health score: > 70%
- Churn rate: < 5%/mo
- Support satisfaction: > 90%

### Exit Criteria
- Customer success playbook created
- Health score system operational
- Milestone tracking live
- NPS survey deployed
- Churn warning system active

---

## Workstream 12: Support Center

### Mission
Deliver enterprise-grade customer support with < 1 hour response time for critical issues and < 24 hours for standard issues.

### Business Goal
B2B buyers expect enterprise support. Slow or poor support kills trust and drives churn. Support is a competitive differentiator.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Support ticket system (beta) | `modules/beta-program/beta-support.controller.ts` | ✅ Minimal |
| SupportTicket Prisma model | `schema.prisma` (line 5050) | ✅ Complete |
| SupportTicketMessage model | `schema.prisma` (line 5071) | ✅ Complete |
| Notification system | Full module | ✅ Complete |
| SUPPORT-HANDBOOK | `docs/operations/SUPPORT-HANDBOOK.md` | ✅ Complete |
| Chat system | `modules/chat/` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| SU-1 | No dedicated support module (reuses beta support) | HIGH | Create full support module |
| SU-2 | No support ticket admin dashboard | HIGH | Build support dashboard |
| SU-3 | No knowledge base / FAQ | HIGH | Create FAQ knowledge base |
| SU-4 | No support SLA tracking | HIGH | Build SLA tracking |
| SU-5 | No live chat support | MEDIUM | Enable live chat |
| SU-6 | No phone support | MEDIUM | Set up phone line |
| SU-7 | No support analytics | MEDIUM | Build support analytics |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 12.1 | Create dedicated SupportModule (extends beta support) | Backend Lead | 5 days | — |
| 12.2 | Build support ticket admin dashboard (list, assign, reply, resolve) | Backend + Frontend | 5 days | 12.1 |
| 12.3 | Build support ticket customer page (my tickets, create, reply) | Frontend Lead | 5 days | 12.1 |
| 12.4 | Create knowledge base / FAQ pages | Frontend + CS | 5 days | — |
| 12.5 | Build SLA tracking (auto-escalate if SLA breached) | Backend Lead | 3 days | 12.1 |
| 12.6 | Set up support email inbox → auto-create tickets | DevOps | 2 days | — |
| 12.7 | Build support analytics dashboard | Backend + Frontend | 3 days | 12.1 |
| 12.8 | Create support escalation SOP | CS Lead | 3 days | — |

### Business Validation
- Ticket volume: handle 100+ tickets/day
- First response time: < 1 hour (critical), < 4 hours (standard)
- Resolution time: < 4 hours (critical), < 24 hours (standard)
- Customer satisfaction: > 90%

### KPIs
- First response time (critical): < 1 hour
- First response time (standard): < 4 hours
- Resolution time (critical): < 4 hours
- Resolution time (standard): < 24 hours
- CSAT score: > 90%
- Ticket volume handled: 100+/day

### Exit Criteria
- Support dashboard live with ticket management
- Knowledge base / FAQ published
- SLA tracking operational
- Email → ticket integration working
- Support escalation SOP created

---

## Workstream 13: Business Analytics

### Mission
Build a comprehensive business intelligence layer that provides real-time visibility into all revenue, operational, and growth metrics.

### Business Goal
Data-driven decisions require real-time access to the right metrics. Every day without visibility is a day of flying blind.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| 13 domain analytics services | Across modules | ✅ Complete |
| Analytics controller (admin dashboard) | `modules/analytics/analytics.controller.ts` | ✅ Complete |
| Analytics processor (BullMQ) | `modules/analytics/analytics.processor.ts` | ✅ Complete |
| Prometheus metrics interceptor | `common/interceptors/metrics.interceptor.ts` | ✅ Complete |
| Grafana API dashboard | `ops/monitoring/grafana/dashboards/tradingo-api-dashboard.json` | ✅ Complete |
| Grafana Business dashboard | `ops/monitoring/grafana/dashboards/tradingo-business-dashboard.json` | ✅ Complete |
| Enterprise Intelligence module (14 endpoints) | `modules/enterprise-intelligence/` | ✅ Complete |
| Founder AI (18 endpoints) | `modules/founder-ai/` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| BA-1 | No unified business analytics dashboard | HIGH | Build executive dashboard |
| BA-2 | No daily/weekly/monthly report generation | HIGH | Build scheduled reports |
| BA-3 | No revenue forecasting (beyond AI) | MEDIUM | Build revenue forecast model |
| BA-4 | No cohort analysis | MEDIUM | Build cohort retention tracking |
| BA-5 | No funnel analytics | MEDIUM | Build conversion funnel tracking |
| BA-6 | No automated report delivery (email) | MEDIUM | Build scheduled email reports |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 13.1 | Build unified business analytics dashboard (revenue, users, growth, health) | Frontend + Backend | 5 days | — |
| 13.2 | Build scheduled daily/weekly/monthly report generation | Backend Lead | 5 days | — |
| 13.3 | Build revenue forecast model (linear regression + trending) | Backend Lead | 3 days | — |
| 13.4 | Build cohort analysis (user retention by registration cohort) | Backend Lead | 3 days | — |
| 13.5 | Build conversion funnel tracking (visit→register→RFQ→order→payment) | Backend + Frontend | 5 days | — |
| 13.6 | Build scheduled email report delivery | Backend + Marketing | 3 days | 13.2 |
| 13.7 | Create data dictionary / metric definitions document | Analytics Lead | 3 days | — |

### Business Validation
- Executive dashboard reflects real-time data
- Daily reports delivered to leadership
- Revenue forecast accuracy within 10% of actual
- Funnel conversion rates visible at each stage

### KPIs
- Dashboard refresh latency: < 5 minutes
- Report delivery: 100% on schedule
- Forecast accuracy: ± 10%
- Funnel visibility: 5+ stages tracked
- Metric definitions: 50+ documented

### Exit Criteria
- Business analytics dashboard live
- Scheduled report generation working
- Revenue forecast model deployed
- Funnel tracking visible

---

## Workstream 14: Finance & Compliance

### Mission
Establish financial operations for revenue collection, GST compliance, vendor payouts, and regulatory reporting.

### Business Goal
Without finance and compliance, TRADINGO cannot legally operate. Every day of non-compliance is a legal and financial risk.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| GST billing engine | `modules/billing/` | ✅ Complete |
| Tax calculation (intra/inter-state) | `billing/tax.service.ts` | ✅ Complete |
| Invoice generation (PDF) | `billing/invoice.service.ts` + `pdf.service.ts` | ✅ Complete |
| Payment processing (Stripe + Razorpay) | `modules/payment/` | ✅ Complete |
| Refund processing | `payment.service.ts` (createRefund) | ✅ Complete |
| Escrow management | `modules/escrow/` | ✅ Complete |
| Settlement management | `modules/settlement/` | ✅ Complete |
| Finance module | `modules/finance/` | ✅ Complete |
| AI Finance Intelligence | `modules/finance/ai-finance.service.ts` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| F-1 | No GST registration for TRADINGO entity | CRITICAL | Register for GST |
| F-2 | No vendor payout system | HIGH | Build automated payout system |
| F-3 | No financial reconciliation dashboard | HIGH | Build reconciliation dashboard |
| F-4 | No revenue recognition process | HIGH | Establish revenue recognition |
| F-5 | No tax filing schedule | HIGH | Create tax compliance calendar |
| F-6 | No financial audit trail for transactions | MEDIUM | Add financial audit logging |
| F-7 | No refund/SLA compliance tracking | MEDIUM | Add refund SLA tracking |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 14.1 | Register TRADINGO entity for GST | Finance | 14 days | Legal entity formation |
| 14.2 | Build vendor payout system (auto-payout on order completion) | Backend Lead | 7 days | — |
| 14.3 | Build financial reconciliation dashboard | Backend + Frontend | 5 days | — |
| 14.4 | Establish revenue recognition process | Finance | 5 days | — |
| 14.5 | Create tax compliance calendar | Finance | 3 days | — |
| 14.6 | Add financial audit logging for all financial transactions | Backend Lead | 3 days | — |
| 14.7 | Build refund SLA tracking dashboard | Backend + Frontend | 3 days | — |
| 14.8 | Create finance operations SOP | Finance | 5 days | — |

### Business Validation
- GST-compliant invoices issued for all transactions
- Vendor payouts processed within 7 days of settlement
- Financial reconciliation completed daily
- Tax filings submitted on schedule

### KPIs
- GST compliance: 100% of invoices
- Vendor payout time: < 7 days
- Reconciliation accuracy: 100%
- Tax filing compliance: 100% on time
- Financial audit: zero discrepancies

### Exit Criteria
- GST registration obtained
- Vendor payout system operational
- Reconciliation dashboard live
- Finance SOP created

---

## Workstream 15: Legal Documentation

### Mission
Create a complete legal framework for marketplace operations, including terms of service, privacy policy, seller/buyer agreements, and regulatory compliance.

### Business Goal
Without legal documentation, TRADINGO cannot operate. Legal risk is business-ending risk. Every missing document is a liability.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Legal documents | 🔴 **NONE EXIST** | 🔴 Critical Gap |
| Privacy policy | — | 🔴 Missing |
| Terms of service | — | 🔴 Missing |
| Seller agreement | — | 🔴 Missing |
| Buyer agreement | — | 🔴 Missing |
| EULA | — | 🔴 Missing |
| Disclaimer | — | 🔴 Missing |
| Refund policy | — | 🔴 Missing |
| Cookie policy | — | 🔴 Missing |
| GDPR/privacy compliance | — | 🔴 Missing |
| Marketplace terms | — | 🔴 Missing |
| AI terms (AI-generated content) | — | 🔴 Missing |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 15.1 | Engage legal counsel for marketplace/Tech | CTO + Legal | 14 days | Budget |
| 15.2 | Draft Terms of Service | Legal | 10 days | 15.1 |
| 15.3 | Draft Privacy Policy (GDPR + India DPDP compliant) | Legal | 7 days | 15.1 |
| 15.4 | Draft Seller Agreement | Legal | 10 days | 15.1 |
| 15.5 | Draft Buyer Agreement | Legal | 7 days | 15.1 |
| 15.6 | Draft Refund & Cancellation Policy | Legal | 5 days | 15.1 |
| 15.7 | Draft AI Terms (disclaimers for AI-generated content) | Legal | 5 days | 15.1 |
| 15.8 | Draft Cookie Policy | Legal | 3 days | 15.1 |
| 15.9 | Create legal pages on platform (`/terms`, `/privacy`, `/refund`, `/cookies`) | Frontend | 3 days | 15.2-15.8 |
| 15.10 | Add cookie consent banner | Frontend | 2 days | 15.8 |
| 15.11 | Create legal compliance SOP | Legal | 3 days | 15.2-15.8 |

### Business Validation
- All legal documents reviewed by counsel
- Legal pages accessible from platform footer
- Cookie consent banner operational
- GDPR/DPDP compliance achieved

### KPIs
- Legal documents completed: 8/8
- Legal pages live: 4/4
- Cookie consent: implemented
- Legal review cycle: complete

### Exit Criteria
- All 8 legal documents drafted and reviewed by counsel
- Legal pages published on platform
- Cookie consent banner active
- Legal compliance SOP created

---

## Workstream 16: Marketing Foundation

### Mission
Establish TRADINGO's marketing engine with brand identity, content strategy, SEO foundation, and paid acquisition channels.

### Business Goal
Marketing is the engine that drives both seller and buyer acquisition. Without marketing, TRADINGO is invisible to its target audience.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Brand guidelines | `docs/architecture/01_BRAND_GUIDELINES.md` | ✅ Complete |
| Vision & mission | `docs/architecture/02_VISION_MISSION.md` | ✅ Complete |
| SEO report | `docs/architecture/TRADINGO-SEO-REPORT.md` | ✅ Complete |
| Referral engine | `modules/referral/` | ✅ Complete |
| Campaign engine | `modules/campaign/` | ✅ Complete |
| Advertising platform | `modules/advertising/` | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| MK-1 | No SEO content strategy | HIGH | Create SEO content plan |
| MK-2 | No blog / content marketing | HIGH | Launch blog |
| MK-3 | No social media presence | HIGH | Create social media accounts |
| MK-4 | No paid ads strategy (Google/LinkedIn) | HIGH | Create SEM/paid ads plan |
| MK-5 | No email marketing infrastructure | HIGH | Set up email marketing tool |
| MK-6 | No PR / media relations | MEDIUM | Create PR plan |
| MK-7 | No case studies / success stories | MEDIUM | Collect and publish |
| MK-8 | No video content | MEDIUM | Create product videos |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 16.1 | Create SEO content strategy (target keywords, content calendar) | Marketing | 7 days | — |
| 16.2 | Launch blog (`/blog` subdomain or `/resources`) | Marketing + Frontend | 5 days | — |
| 16.3 | Create social media accounts (LinkedIn, Twitter/X, YouTube) | Marketing | 3 days | — |
| 16.4 | Set up email marketing tool (Mailchimp/SendGrid) → 5 drip campaigns | Marketing | 5 days | — |
| 16.5 | Create paid ads strategy (Google Ads + LinkedIn) | Marketing | 7 days | Budget |
| 16.6 | Write 5 SEO-optimized pillar pages (industry verticals) | Marketing | 10 days | 16.1 |
| 16.7 | Create 3 product demo videos | Marketing | 10 days | — |
| 16.8 | Build referral landing page | Frontend | 3 days | — |

### Business Validation
- Blog publishing: 2 articles/week
- Social media followers: 1,000+ in 90 days
- Organic traffic: 5,000+ visits/month at 90 days
- Email subscribers: 500+ in 90 days

### KPIs
- Blog posts published: 24+ (90 days)
- Organic traffic: 5,000+/month
- Email subscribers: 500+
- Social media followers: 1,000+
- Content marketing leads: 50+/quarter
- Cost per lead (paid): < ₹500

### Exit Criteria
- Blog launched with 5+ published articles
- Social media accounts active
- Email marketing tool configured with 5 campaigns
- SEO content strategy documented

---

## Workstream 17: Growth Engine

### Mission
Build a self-sustaining growth engine powered by referrals, viral loops, network effects, and platform stickiness.

### Business Goal
Sustainable growth requires product-led acquisition. Every user should be a channel for bringing more users. Network effects create moats.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Referral engine (14 endpoints) | `modules/referral/` | ✅ Complete |
| Campaign engine (20 endpoints) | `modules/campaign/` | ✅ Complete |
| Advertising platform (20+ endpoints) | `modules/advertising/` | ✅ Complete |
| GOCASH ecosystem | Full engine | ✅ Complete |
| Ecosystem gamification | `components/ecosystem/` (16 components) | ✅ Complete |
| Mission engine | `modules/gocash-ecosystem/` | ✅ Complete |
| Badges + levels | Full system | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| GR-1 | No viral loop analysis | HIGH | Identify and optimize viral loops |
| GR-2 | No referral A/B testing | MEDIUM | Test referral incentives |
| GR-3 | No "invite team member" flow | MEDIUM | Build team invitation flow |
| GR-4 | No integration partnerships | MEDIUM | Identify integration partners |
| GR-5 | No marketplace network effect tracking | MEDIUM | Build network effect dashboard |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 17.1 | Analyze and optimize viral loops (referral → signup → RFQ → refer) | Growth Lead | 5 days | — |
| 17.2 | A/B test referral incentives (₹500 vs ₹1000, XP vs GOCASH vs cash) | Growth + Backend | 7 days | 17.1 |
| 17.3 | Build "invite team member" flow (buyer → colleagues) | Backend + Frontend | 5 days | — |
| 17.4 | Build network effect dashboard (buyers per seller, RFQs per buyer, etc.) | Backend + Frontend | 5 days | — |
| 17.5 | Create integration partnership strategy (ERP, accounting, logistics) | Growth Lead | 10 days | — |
| 17.6 | Build referral leaderboard (gamified referral competition) | Frontend + Backend | 5 days | — |

### Business Validation
- Referral conversion rate: > 20%
- Virality coefficient (K-factor): > 0.5
- Time to viral loop: < 30 days per user
- Integration partnerships: 3+ in 90 days

### KPIs
- Referral conversion rate: > 20%
- K-factor (virality): > 0.5
- Invited users: 30% of new signups
- Referral-driven signups: 100+/quarter
- Integration partnerships: 3+

### Exit Criteria
- Referral A/B test running
- Invite team flow live
- Network effect dashboard live
- Referral leaderboard live

---

## Workstream 18: Founder Dashboard

### Mission
Create a single-pane-of-glass CEO dashboard showing every critical metric across the business — revenue, growth, operations, risk, and platform health.

### Business Goal
The Founder/CEO needs real-time visibility into the entire business without toggling between 10 tools. Every hour spent hunting for data is an hour not spent on strategy.

### Repository Audit — What Exists

| Asset | Location | Status |
|-------|----------|--------|
| Founder AI (18 methods, 18 endpoints) | `modules/founder-ai/` | ✅ Complete |
| Founder Executive Agent (8 capabilities) | `modules/founder-ai/` + Agent Registry | ✅ Complete |
| Health score system | `founder-ai.service.ts` | ✅ Complete |
| Executive priorities | `founder-ai.service.ts` | ✅ Complete |
| Executive timeline | `founder-ai.service.ts` | ✅ Complete |
| Executive reports | `founder-ai.service.ts` | ✅ Complete |
| Founder frontend page | `app/founder/executive/page.tsx` | ✅ Complete |
| Founder AI frontend components | `components/founder-ai/` (6 cards) | ✅ Complete |
| Enterprise Intelligence (14 endpoints) | `modules/enterprise-intelligence/` | ✅ Complete |
| 13 analytics services | Across modules | ✅ Complete |

### Gaps

| # | Gap | Priority | Action |
|---|-----|----------|--------|
| FD-1 | No real-time revenue dashboard | HIGH | Build revenue tracker |
| FD-2 | No daily operational alerts summary | HIGH | Build daily brief |
| FD-3 | No investor-ready metrics view | MEDIUM | Build investor dashboard |
| FD-4 | No mobile-friendly CEO view | MEDIUM | Add responsive layout |
| FD-5 | No automated weekly report to email | MEDIUM | Build weekly email summary |

### Implementation Tasks

| # | Task | Owner | Duration | Dependencies |
|---|------|-------|----------|--------------|
| 18.1 | Build real-time revenue dashboard (MRR, ARPU, churn, LTV) | Backend + Frontend | 5 days | — |
| 18.2 | Build daily operational alerts summary | Backend Lead | 3 days | — |
| 18.3 | Build investor dashboard (ARR, growth rate, burn multiple, unit economics) | Backend + Frontend | 5 days | — |
| 18.4 | Build weekly automated email report to Founder | Backend | 3 days | — |
| 18.5 | Enhance Founder AI page with mobile-responsive layout | Frontend | 3 days | — |
| 18.6 | Build critical decisions log (record major decisions with rationale) | Backend + Frontend | 3 days | — |
| 18.7 | Build risk register dashboard (live from risk data) | Frontend | 3 days | — |

### Business Validation
- Dashboard loads in < 2 seconds
- All metrics match source data (reconciliation)
- Daily brief delivered by 8 AM
- Investor metrics match board reporting

### KPIs
- Dashboard load time: < 2s
- Metric accuracy: 100%
- Daily brief delivery: 100% on time
- Investor metrics: 15+ displayed
- Critical decisions logged: 100%

### Exit Criteria
- Revenue dashboard live with MRR/ARPU/churn/LTV
- Daily operational alerts working
- Investor dashboard live
- Weekly email report active

---

## Phase 2 Master Dashboard

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PHASE 2 MASTER DASHBOARD                    │
├───────────────┬───────────────┬───────────────┬───────────────┤
│  PLATFORM     │  REVENUE      │  MEMBERSHIP   │  TRADESERV    │
│  HEALTH       │  METRICS      │  METRICS      │  METRICS      │
├───────────────┼───────────────┼───────────────┼───────────────┤
│ • Uptime:99.9%│ • MRR: ₹XX   │ • Paid: XXX   │ • Pro: XXX    │
│ • Lat:P95:XXms│ • ARPU: ₹XX  │ • Churn: X%   │ • Bookings:XX │
│ • Err: 0.01%  │ • LTV: ₹XX   │ • Trial→Paid  │ • Revenue: ₹  │
│ • PgLoad:1.2s │ • MoM Growth │   Conv. X%    │ • Rating: X.X │
├───────────────┼───────────────┼───────────────┼───────────────┤
│  MARKETPLACE  │  BUYERS       │  VERIFIED     │  RFQs /       │
│  METRICS      │               │  PARTNERS     │  ORDERS       │
├───────────────┼───────────────┼───────────────┼───────────────┤
│ • Listings:XX │ • Total: XXX  │ • Sellers:XX  │ • RFQs: XXX   │
│ • Categories  │ • Active: XX  │ • Pro: XX     │ • Quotes: XX  │
│ • Industries  │ • ActRate:X%  │ • AvgScore:X  │ • Orders: XX  │
│ • SearchVol   │ • Ret90d:X%   │ • Verified:X% │ • Conv: X%    │
├───────────────┼───────────────┼───────────────┼───────────────┤
│  PAYMENTS /   │  SUPPORT      │  INFRA-      │  SECURITY     │
│  SETTLEMENTS  │               │  STRUCTURE   │               │
├───────────────┼───────────────┼───────────────┼───────────────┤
│ • Volume:₹XX  │ • Tickets: XX │ • Pods: 4/4   │ • Vulns:  0   │
│ • Success:99% │ • FRT: 30min  │ • CPU: 45%    │ • PenTest:P   │
│ • Pending:XX  │ • CSAT: 92%   │ • Mem: 60%    │ • Guards:All  │
│ • Disputes:X  │ • SLA: 98%    │ • Disk: 40%   │ • ISO: Ready  │
├───────────────┼───────────────┼───────────────┼───────────────┤
│  MARKETING    │  FINANCE      │  GROWTH       │  RISK         │
│  METRICS      │               │               │  REGISTER     │
├───────────────┼───────────────┼───────────────┼───────────────┤
│ • OrganicTraff│ • GST: Compl  │ • K-Factor:X  │ • P0: 0       │
│ • ConvRate:X% │ • Payouts:On  │ • ReferConv%  │ • P1: 2       │
│ • Leads: XX   │ • Recon:100%  │ • NetEff:X    │ • P2: 5       │
│ • CAC: ₹XX    │ • Audit:Pass  │ • MoM:X%      │ • Mitigated   │
├───────────────┴───────────────┴───────────────┴───────────────┤
│  LAUNCH READINESS: 🟢 GO / 🟡 CONDITIONAL / 🔴 STOP           │
└───────────────────────────────────────────────────────────────┘
```

### Data Sources
| Section | Source | Refresh |
|---------|--------|---------|
| Platform Health | Prometheus + Grafana | Real-time |
| Revenue | Billing + Payment + Membership DB | Real-time |
| Membership | Membership DB | Real-time |
| TradeServ | TradeServ DB | Real-time |
| Marketplace | Product + Company + Industry DB | Daily |
| Buyers | User DB | Daily |
| Partners | CompanyVerification + Company DB | Daily |
| RFQs/Orders | SmartRfq + Order DB | Real-time |
| Payments | Payment DB | Real-time |
| Support | SupportTicket DB | Real-time |
| Infrastructure | K8s API + Prometheus | Real-time |
| Security | Security audit DB | Daily |
| Marketing | Analytics + Google Analytics | Daily |
| Finance | Payment + Settlement + Billing | Daily |
| Growth | Referral + Invite + Campaign DB | Daily |
| Risk | Risk Register | Live |

---

## Business Documentation

All 14 SOPs will be created as markdown files in `docs/operations/sops/`.

| # | SOP | Location | Owner | Due |
|---|-----|----------|-------|-----|
| 1 | Seller Operations SOP | `docs/operations/sops/seller-operations.md` | Ops Lead | Day 30 |
| 2 | Buyer Operations SOP | `docs/operations/sops/buyer-operations.md` | Ops Lead | Day 30 |
| 3 | TradeServ Operations SOP | `docs/operations/sops/tradeserv-operations.md` | Ops Lead | Day 45 |
| 4 | Support SOP | `docs/operations/sops/support.md` | CS Lead | Day 15 |
| 5 | Incident Response SOP | `docs/operations/sops/incident-response.md` | Ops Lead | Day 15 |
| 6 | Release SOP | `docs/operations/sops/release.md` | DevOps | Day 20 |
| 7 | Deployment SOP | `docs/operations/sops/deployment.md` | DevOps | Day 20 |
| 8 | Sales SOP | `docs/operations/sops/sales.md` | Sales Lead | Day 30 |
| 9 | KYC SOP | `docs/operations/sops/kyc.md` | Ops Lead | Day 15 |
| 10 | Verification SOP | `docs/operations/sops/verification.md` | Ops Lead | Day 15 |
| 11 | Refund SOP | `docs/operations/sops/refund.md` | Finance | Day 30 |
| 12 | Escalation SOP | `docs/operations/sops/escalation.md` | CS Lead | Day 15 |
| 13 | Customer Success SOP | `docs/operations/sops/customer-success.md` | CS Lead | Day 30 |
| 14 | Legal Compliance SOP | `docs/operations/sops/legal-compliance.md` | Legal | Day 45 |

---

## Success Metrics

### Daily KPIs (Founder Dashboard)
- Revenue (MRR, today's revenue, month-to-date)
- New registrations (buyers, sellers, TradeServ pros)
- Active users (daily active buyers, sellers)
- RFQs created (today, month-to-date)
- Orders placed (today, month-to-date)
- Payments processed (volume, count, success rate)
- Disputes opened / resolved
- Support tickets (new, open, resolved, SLA breach)
- Platform uptime (today, 7-day rolling)
- API error rate (today, 7-day rolling)
- P95 latency (today)

### Weekly KPIs
- New paid members
- Churned members
- MRR growth rate
- ARPU (by segment)
- Seller activation rate (cohort)
- Buyer activation rate (cohort)
- Referral conversion rate
- Campaign performance
- Marketing spend vs leads
- NPS score (if surveyed)

### Monthly KPIs
- Total MRR
- Net revenue retention
- Customer acquisition cost (CAC) by channel
- Lifetime value (LTV) / CAC ratio
- Monthly churn rate
- Gross merchandise value (GMV)
- Take rate (revenue / GMV)
- Seller retention (90-day)
- Buyer retention (90-day)
- Organic traffic growth
- Paid member growth
- TradeServ booking value

### Quarterly KPIs
- Revenue vs target
- Member growth vs target
- Marketplace liquidity (buyers per seller)
- Network effect score (RFQs per buyer × quotes per RFQ)
- Platform health score
- Security audit score
- Customer satisfaction score
- Employee satisfaction / team health

### Yearly KPIs
- ARR (Annual Recurring Revenue)
- Total GMV
- Total registered users
- Total paid members
- Gross profit margin
- Net profit / burn rate
- Market share in target verticals
- Fundraising readiness score

---

## Execution Roadmap

### 30-Day Plan (Days 1-30)

| Week | Focus | Workstreams | Milestones |
|------|-------|-------------|------------|
| W1 | Foundation | 1, 2, 3, 14, 15 | Production infra up, CI/CD passing, pen-test engaged, legal engaged |
| W2 | Observability | 5, 12, 13 | Monitoring stack live, support system operational, analytics dashboard v1 |
| W3 | Revenue | 10, 14 | Membership revenue dashboard live, payout system working |
| W4 | Operations | 6, 11, 12 | Marketplace ops SOP created, CS playbook done, support center live |

**Day 30 Milestone:** Production platform running with monitoring, support, revenue tracking, and legal foundation.

### 60-Day Plan (Days 31-60)

| Week | Focus | Workstreams | Milestones |
|------|-------|-------------|------------|
| W5-6 | Acquisition | 7, 8 | Seller + buyer landing pages live, onboarding sequences active |
| W7 | Performance | 4 | Lighthouse > 90, API P95 < 500ms |
| W8 | Marketing | 16 | Blog launched, social media active, email campaigns running |

**Day 60 Milestone:** Acquisition funnels active, performance optimized, marketing engine running.

### 90-Day Plan (Days 61-90)

| Week | Focus | Workstreams | Milestones |
|------|-------|-------------|------------|
| W9-10 | Growth | 9, 17 | TradeServ bookings live, growth engine optimized |
| W11 | Leadership | 18 | Founder dashboard live, investor metrics ready |
| W12 | Review | All | 90-day review, adjust strategy for Phase 3 |

**Day 90 Milestone:** Platform at scale with 100+ sellers, 500+ buyers, ₹50L+ MRR.

### 12-Month Strategic Roadmap

| Quarter | Theme | Focus | Targets |
|---------|-------|-------|---------|
| Q1 | Launch | Production stability, initial acquisition, revenue validation | 100 sellers, 500 buyers, ₹50L MRR |
| Q2 | Growth | Scale acquisition, optimize conversion, expand verticals | 500 sellers, 2,500 buyers, ₹2Cr MRR |
| Q3 | Expansion | International expansion, API marketplace, integrations | 1,500 sellers, 7,500 buyers, ₹5Cr MRR |
| Q4 | Ecosystem | Platform network effects, AI-powered marketplace, Series A | 3,000 sellers, 15,000 buyers, ₹10Cr MRR |

---

## Founder Command Center

### Daily Priorities (Week 1 of Phase 2)

| Priority | Action | Owner | Due |
|----------|--------|-------|-----|
| P0 | Deploy production infrastructure | DevOps | Day 1-2 |
| P0 | Engage legal counsel | CTO | Day 1 |
| P0 | Register GST entity | Finance | Day 1-14 |
| P0 | Fix 6 critical AI security vulns | Security Lead | Day 1-7 |
| P0 | Verify CI/CD pipeline works | DevOps | Day 2-5 |
| P1 | Set up monitoring stack | DevOps | Day 2-5 |
| P1 | Build support center | Backend + Frontend | Day 5-15 |
| P1 | Create legal documents | Legal | Day 5-20 |
| P1 | Build membership dashboard | Backend + Frontend | Day 5-10 |
| P2 | Create seller landing page | Marketing | Day 7-14 |
| P2 | Create buyer landing page | Marketing | Day 7-14 |
| P2 | Build revenue dashboard | Backend + Frontend | Day 5-10 |

### Executive KPIs (Week 1)
- Platform uptime: 0% (not yet in production) → target 99.9%
- Revenue: ₹0 → target ₹50L MRR at Day 90
- Users: development accounts → target 500 buyers, 100 sellers at Day 90
- Security: 6 critical vulns → target 0 at Day 7

### Critical Decisions (Week 1)

| Decision | Options | Recommendation | Deadline |
|----------|---------|----------------|----------|
| Cloud provider | AWS / DigitalOcean / Azure | **AWS EKS** (existing K8s manifests target AWS) | Day 1 |
| Legal counsel | Individual lawyer / Law firm | **Tech-focused law firm** (e.g., Nishith Desai, IndusLaw) | Day 5 |
| Payment provider priority | Stripe / Razorpay / Both | **Both** (existing dual integration) | Day 1 |
| Marketing agency vs in-house | Agency / Hire / Founder | **Hire first marketing hire** (content + growth) | Day 30 |
| Pricing finalization | Current pricing / A/B test | **Launch with current pricing, A/B test in Q2** | Day 1 |

### Risk Register (Phase 2)

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Production outage at launch | Medium | Critical | DR scripts tested, rollback < 5 min, monitoring live | DevOps |
| AI Gateway prompt injection exploited | Low | Critical | Fix C-1 through C-6 in Week 1 | Security |
| Legal/compliance gap leads to regulatory action | Medium | Critical | Engage legal Day 1, prioritize documents | Legal |
| Low seller adoption | Medium | High | Aggressive seller outreach, onboarding support | Sales |
| Low buyer adoption | Medium | High | Demo request flow, buyer landing page, ads | Marketing |
| Payment reconciliation errors | Low | High | Automated reconciliation, daily audit | Finance |
| Security breach via 3rd-party dependency | Low | High | Dependabot configured, regular dependency audit | DevOps |
| Team capacity / burnout | Medium | Medium | Clear priorities, no scope creep, celebrate wins | CTO |

### Growth Opportunities (Phase 2)

| Opportunity | Potential Impact | Timeline | Requires |
|-------------|------------------|----------|----------|
| ERP integration (Tally, Zoho, SAP) | High — enterprise buyers | Q3 | Partnership development |
| Mobile app launch | Medium — buyer convenience | Q3 | React Native / Flutter team |
| API marketplace (embed tradingo) | High — platform revenue | Q3 | Developer docs, sandbox |
| International expansion (UAE, SEA) | High — market size | Q4 | Local regulations, payments |
| Trade financing (supply chain finance) | Very High — revenue | Q4 | NBFC partnership, regulatory |

### Operational Alerts (Week 1)
- 🔴 **No production deployment** — infrastructure not yet live
- 🔴 **No legal documents** — cannot operate without ToS/Privacy
- 🔴 **6 critical AI security vulnerabilities** — must fix before launch
- 🟡 **CI/CD pipeline untested** — must verify before any deployment
- 🟡 **No support system** — must be ready before first customer
- 🟢 **Platform codebase is complete and verified** — 1,356 endpoints, 280 pages ready
- 🟢 **Security architecture is mature** — 66 controls, 14 categories, 97% readiness

### Investor Metrics

| Metric | Current | 90-Day Target | 12-Month Target |
|--------|---------|---------------|-----------------|
| MRR | ₹0 | ₹50L | ₹10Cr |
| ARR | ₹0 | ₹6Cr | ₹120Cr |
| Total Users | ~50 (dev) | 2,000 | 50,000 |
| Paid Members | 0 | 200 | 5,000 |
| GMV (Monthly) | ₹0 | ₹5Cr | ₹100Cr |
| Take Rate | — | 3% (est) | 5% |
| Gross Margin | — | 70%+ | 80%+ |
| CAC (Seller) | — | ₹10,000 | ₹5,000 |
| CAC (Buyer) | — | ₹2,000 | ₹800 |
| LTV (Seller) | — | ₹1,50,000 | ₹3,00,000 |
| LTV (Buyer) | — | ₹50,000 | ₹1,00,000 |
| LTV/CAC (Seller) | — | 15x | 60x |
| LTV/CAC (Buyer) | — | 25x | 125x |
| Monthly Burn | — | ₹15-20L | ₹30-50L |
| Runway | — | 12-18 months | Post-Series A |

---

## Phase 2 — Next Actions

The Phase 2 program is **approved and ready for execution**. The following actions should be taken immediately:

### Day 1 Actions

| # | Action | Owner | Details |
|---|--------|-------|---------|
| 1 | Deploy production infrastructure | DevOps | Follow Workstream 1 tasks |
| 2 | Engage legal counsel | CTO | Find tech-focused law firm |
| 3 | Begin AI security fixes | Security Lead | Fix C-1 through C-6 |
| 4 | Register GST | Finance | Start GST registration process |
| 5 | Begin creating SOPs | All leads | Start with Support, KYC, Verification, Incident Response |

### Week 1 Actions

| # | Action | Owner | Details |
|---|--------|-------|---------|
| 1 | Verify CI/CD pipeline | DevOps | Run CI on a PR, deploy to staging |
| 2 | Set up monitoring stack | DevOps | Prometheus, Grafana, Alerts live |
| 3 | Create legal documents (drafts) | Legal | ToS, Privacy, Seller/Buyer agreements |
| 4 | Build support center | Backend + Frontend | Support module, ticket dashboard |
| 5 | Build revenue dashboard | Backend + Frontend | MRR, ARPU, churn, LTV |
| 6 | Build membership dashboard | Backend + Frontend | Paid members, conversion, retention |

### Month 1 Actions

| # | Action | Owner | Details |
|---|--------|-------|---------|
| 1 | Launch seller + buyer landing pages | Marketing | `/sell-on-tradingo`, `/buy-on-tradingo` |
| 2 | Launch automated email sequences | Marketing | Seller + buyer onboarding |
| 3 | Begin seller outreach | Sales | Top-50 suppliers in priority verticals |
| 4 | Begin buyer outreach | Sales | Top-100 companies in priority verticals |
| 5 | Begin marketing (blog + social) | Marketing | 2 blog posts/week, daily social |
| 6 | Complete all SOPs | All leads | All 14 SOPs created |

---

## Program Governance

### Weekly Cadence

| Day | Meeting | Attendees | Duration | Agenda |
|-----|---------|-----------|----------|--------|
| Monday | Leadership Sync | CTO, COO, CPO, Lead Investors | 30 min | Strategy, blockers, decisions |
| Monday | All-Hands Standup | All team | 15 min | Wins, priorities, blockers |
| Wednesday | Workstream Check-in | Workstream leads | 30 min | Progress, blockers, cross-deps |
| Friday | Demo & Metrics Review | All team | 30 min | Demo progress, review KPIs |

### Reporting

| Report | Frequency | Audience | Content |
|--------|-----------|----------|---------|
| Daily Brief | Daily | Founder/CEO | Top 5 metrics, alerts, decisions |
| Weekly Update | Weekly | All team | Progress vs plan, wins, learnings |
| Monthly Review | Monthly | Leadership + Investors | Revenue, growth, unit economics |
| Quarterly Review | Quarterly | Board | Full business review, strategy |

### Escalation Path

```
P0 (Platform Down / Security Breach)
  → Immediate: Slack #incidents + PagerDuty
  → Response: < 5 min acknowledge, < 30 min fix
  → Post-mortem: Within 24 hours

P1 (Major Feature Broken / Revenue Impact)
  → Immediate: Slack #incidents
  → Response: < 15 min acknowledge, < 4 hour fix
  → Post-mortem: Within 48 hours

P2 (Minor Bug / Non-Critical Issue)
  → Tracked in GitHub Issues
  → Response: < 24 hours acknowledge
  → Fix: Next sprint
```

---

## Appendix A: Workstream Dependency Graph

```
WS1 (Infra) ─┬─ WS2 (Pipeline) ── WS4 (Performance)
             ├─ WS3 (Security)
             └─ WS5 (Monitoring)

WS14 (Finance) ─┬─ WS15 (Legal)
                └─ WS10 (Membership)

WS7 (Seller Acq) ── WS11 (CS) ── WS12 (Support)
WS8 (Buyer Acq)  ── WS11 (CS) ── WS12 (Support)
WS9 (TradeServ)  ── WS11 (CS) ── WS12 (Support)

WS16 (Marketing) ─┬─ WS7 (Seller Acq)
                  └─ WS8 (Buyer Acq)

WS17 (Growth) ──── WS7 + WS8 + WS10

WS13 (Analytics) ──── WS18 (Founder Dashboard)
```

## Appendix B: Phase 2 Budget Estimate

| Category | Monthly (₹) | Setup (₹) | Notes |
|----------|-------------|-----------|-------|
| Cloud Infrastructure | 1,00,000 | 50,000 | AWS EKS, RDS, ElastiCache, CDN |
| Legal | 50,000 | 2,00,000 | Retainer + document drafting |
| Marketing (Paid Ads) | 2,00,000 | 50,000 | Google Ads + LinkedIn |
| Marketing (Content) | 50,000 | 25,000 | Blog, video production |
| Tools (SaaS) | 50,000 | 25,000 | Sentry, PagerDuty, Mailchimp, etc. |
| Team Expansion | 3,00,000 | 0 | 1 Marketing, 1 Support, 1 Sales |
| Misc / Buffer | 50,000 | 50,000 | Contingency |
| **Total** | **8,00,000** | **4,00,000** | **₹12L first month, ~₹8L/month ongoing** |

---

## Appendix C: File Map (New Files to Create)

All new files will be created in the TRADINGO repository under the appropriate directory.

```
docs/operations/sops/
├── seller-operations.md
├── buyer-operations.md
├── tradeserv-operations.md
├── support.md
├── incident-response.md
├── release.md
├── deployment.md
├── sales.md
├── kyc.md
├── verification.md
├── refund.md
├── escalation.md
├── customer-success.md
└── legal-compliance.md

apps/web/app/
├── (marketing)/sell-on-tradingo/page.tsx       # Seller landing page
├── (marketing)/buy-on-tradingo/page.tsx        # Buyer landing page
├── (legal)/terms/page.tsx                      # Terms of Service
├── (legal)/privacy/page.tsx                    # Privacy Policy
├── (legal)/refund/page.tsx                     # Refund Policy
├── (legal)/cookies/page.tsx                    # Cookie Policy
├── (marketing)/blog/                           # Blog (future)
├── (marketing)/resources/                      # Resources (future)
└── founder/dashboard/                          # Extended Founder Dashboard
    ├── page.tsx
    ├── revenue-section.tsx
    ├── investor-section.tsx
    ├── risk-section.tsx
    └── operations-alerts.tsx

ops/ecs/                                         # Fill empty directory
├── api-task-definition.json
├── web-task-definition.json
└── service-definitions.json

apps/web/components/
├── legal/cookie-consent-banner.tsx              # Cookie consent
├── support/ticket-list.tsx                      # Support tickets
├── support/ticket-detail.tsx                    # Support ticket detail
├── support/ticket-create.tsx                    # Create support ticket
├── support/knowledge-base.tsx                   # FAQ / Knowledge base
├── marketing/seller-landing.tsx                 # Seller page components
├── marketing/buyer-landing.tsx                  # Buyer page components
├── marketing/demo-request-form.tsx              # Demo request form
├── founder/daily-brief.tsx                      # Founder daily brief
├── founder/investor-dashboard.tsx               # Investor metrics
├── founder/risk-dashboard.tsx                   # Risk register
└── founder/operations-alerts.tsx                # Operational alerts
```

---

*This document constitutes the complete TRADINGO Phase 2 Business Execution & Production Readiness Program. It is the master operating blueprint for transitioning TRADINGO from a completed software product into a revenue-generating B2B marketplace.*

*All 18 workstreams are independently executable with clear missions, business goals, technical goals, deliverables, KPIs, and exit criteria. The program is designed to be implementation-ready and suitable for board meetings, investor discussions, internal leadership execution, and company-wide operations.*

**END OF PHASE 2 PROGRAM DOCUMENT**
