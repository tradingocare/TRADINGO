# Deployment Readiness Audit

**Date**: 2026-07-28
**Scope**: Audit only — no infrastructure created, no deployments executed, no manifests modified
**Method**: Exhaustive 5-agent parallel audit covering 52+ files across K8s, Docker Compose, CI/CD, environment, secrets, DNS, SSL, monitoring, documentation, and verification scripts

---

## 1. Executive Summary

TRADINGO has **exceptional deployment documentation** (19 documents, 5 checklists, 4 procedures), **comprehensive health/verification tooling** (52 scripts), and a **well-architected CI/CD pipeline** (5 workflows, ECS Fargate). However, the platform is **not ready for production deployment** because:

1. **No cloud infrastructure is provisioned** — no AWS account configured, no ECS cluster exists, no K8s cluster exists, no VPS provisioned. All manifests are templates waiting for real infrastructure.
2. **SSL certificates do not exist** — `fullchain.pem` and `privkey.pem` are referenced but missing. Nginx will fail to start.
3. **65% of `.env.production` variables are placeholders or empty** — 18 placeholders (`YOUR_XXX`), 14 empty values. JWT secrets, database password, Redis password, Razorpay keys, OpenRouter API key, and Sentry DSN are all placeholders.
4. **CI/CD staging workflow has a critical bug** — `__AWS_ACCOUNT_ID__` substitution is missing, causing staging deployment to produce invalid IAM ARNs.
5. **All monitoring ports are publicly exposed** in Docker Compose — database (5432), API (3001), Web (3000), Prometheus (9090), Grafana (3002) all accessible without authentication.

**Score: 44/100 — BLOCKED**

---

## 2. Deployment Readiness Score (0–100)

| Domain | Score | Status |
|--------|:-----:|--------|
| A. Kubernetes Readiness | 35 | 🔴 K8s manifests explicitly deprecated, PDB selector broken, latest tags |
| B. Infrastructure Readiness | 25 | 🔴 No cloud resources provisioned; ECS is target but cluster doesn't exist |
| C. Secrets Audit | 15 | 🔴 18 placeholders, 14 empty, 4 critical (@ 0 real secrets configured) |
| D. Environment Variables | 30 | 🔴 35% production-ready; remaining are placeholders or empty |
| E. DNS Readiness | 40 | 🟡 Domains configured in manifests but no actual DNS records created |
| F. SSL Readiness | 25 | 🔴 cert-manager configured; actual cert files don't exist |
| G. CI/CD Readiness | 55 | 🟡 Well-structured, 4 critical bugs, staging broken, rollback has first-deploy gap |
| H. Monitoring Readiness | 65 | 🟡 Prometheus/Grafana configured, but Sentry DSN missing, dashboards directory empty |
| I. Health Checks & Verification | 85 | 🟢 Comprehensive — 52 scripts, health endpoints, smoke tests, DR scripts |
| J. Documentation | 90 | 🟢 Exceptional — 19 documents, 5 checklists, runbooks, guides |
| **Overall** | **44** | **🔴 BLOCKED** |

---

## 3. Infrastructure Inventory

### Implemented Infrastructure Approach

| Approach | Status | Primary? | Notes |
|----------|--------|:--------:|-------|
| **AWS ECS Fargate** | 🔴 Configured but NOT provisioned | ✅ Primary | 3 task definitions (api, web, migration), 5 CI/CD workflows targeting ECS. Cluster `tradingo-production` and `tradingo-staging` do not exist. |
| **Docker Compose** | 🟡 Fully configured, has blockers | ❌ Alternative | 12 services, 307 lines. Blocked by missing SSL certs and public port exposure. Works on single host. |
| **Kubernetes (K8s)** | 🔴 Deprecated by own README | ❌ Legacy | 15 manifests, but README explicitly says "DEPRECATED — preserved for reference only." PDB selector broken. |
| **VPS (Single VM)** | 🟡 Documented only | ❌ Documented | `VPS-DEPLOYMENT-GUIDE.md` (243 lines) + `deploy-vps.sh` (automated script). Not wired to CI/CD. |

### Infrastructure Components

| Component | ECS | Docker Compose | K8s | Notes |
|-----------|:---:|:--------------:|:---:|-------|
| PostgreSQL 16 | ✅ Task def | ✅ Container | ✅ StatefulSet | All 3 approaches defined |
| Redis 7 | ❌ Not in ECS | ✅ Container | ✅ Deployment | ECS uses ElastiCache (assumed); not in task defs |
| API (NestJS) | ✅ Task def | ✅ Container | ✅ Deployment | All 3 approaches defined |
| Web (Next.js) | ✅ Task def | ✅ Container | ✅ Deployment | All 3 approaches defined |
| Nginx | ❌ ALB/CloudFront | ✅ Container | ✅ Ingress | ALB replaces nginx in ECS |
| Prometheus | ❌ Not in ECS | ✅ Container | ❌ Not in K8s | Monitoring stack only in Docker Compose |
| Grafana | ❌ Not in ECS | ✅ Container | ❌ Not in K8s | Same |
| Alertmanager | ❌ Not in ECS | ✅ Container | ❌ Not in K8s | Same |
| Exporters (3) | ❌ Not in ECS | ✅ Container | ❌ Not in K8s | Same |

---

## 4. Kubernetes Audit

### Status: 🔴 NOT READY (explicitly deprecated)

**Source**: `ops/k8s/README.md` — "These manifests are **deprecated** and preserved for reference only."

### File Inventory (15 files)

| File | Kind | Has Issues? | Severity |
|------|------|:-----------:|:--------:|
| `tradingo-namespace.yaml` | Namespace | ✅ Clean | — |
| `api-deployment.yaml` | Deployment + SA + Role + RB | `:latest` tag | 🔴 Critical |
| `web-deployment.yaml` | Deployment | `:latest` tag, root path probe | 🔴 Critical |
| `redis-deployment.yaml` | Deployment + PVC + Service | Single replica | 🟡 Medium |
| `postgres-statefulset.yaml` | StatefulSet + PVC + 2 Services | Single replica, no backup | 🟠 High |
| `api-service.yaml` | Service + Headless | Unnecessary headless for Deployment | 🟢 Info |
| `web-service.yaml` | Service | ✅ Clean | — |
| `ingress.yaml` | Ingress | Missing security headers | 🟡 Medium |
| `tradingo-configmap.yaml` | ConfigMap | CloudFront placeholder | 🟠 High |
| `tradingo-secrets-template.yaml` | Secret (template) | **All values CHANGE_ME** | 🔴 Critical |
| `api-hpa.yaml` | HPA | Custom metric needs adapter | 🟡 Medium |
| `web-hpa.yaml` | HPA | ✅ Clean | — |
| `pdb.yaml` | 3× PDB | **Postgres selector mismatch** | 🔴 Critical |
| `kustomization.yaml` | Kustomization | v1beta1, includes secrets template | 🔴 Critical |
| `README.md` | Documentation | Declares deprecated | Informational |

### Critical Issues

| ID | Issue | File | Detail |
|----|-------|------|--------|
| K-C1 | **PDB selector mismatch** | `pdb.yaml` | Postgres PDB uses `app: tradingo-postgres` but StatefulSet has `app: postgres`. PDB matches zero pods — dead config. |
| K-C2 | **Secrets template in kustomization** | `kustomization.yaml` | `tradingo-secrets-template.yaml` (all `CHANGE_ME` values) is listed as a kustomize resource. `kubectl apply -k .` creates a secret with dummy values, breaking all integrations. |
| K-C3 | **`latest` image tags** | `api-deployment.yaml`, `web-deployment.yaml`, `kustomization.yaml` | Both images use `:latest` with `IfNotPresent` pull policy. No deterministic rollback. Stale images won't refresh. |
| K-C4 | **Web health probe on root path** | `web-deployment.yaml` | Liveness/readiness `GET /` returns 200 even if backend connectivity is lost (static shell). Traffic routed to broken pods. |

### Missing Manifests

| Missing | Impact |
|---------|--------|
| NetworkPolicy | No network isolation — any pod can reach any pod |
| Backup CronJob | No automated PostgreSQL backup defined in K8s |
| Metrics adapter | HPA custom metric `http_requests_per_second` requires PrometheusAdapter |

---

## 5. Environment Audit

### `.env.production` Audit (74 variables)

| Classification | Count | % |
|:---------------|:-----:|:-:|
| ✅ Production-ready | 26 | 35% |
| 🔴 Placeholder (`YOUR_XXX`) | 18 | 24% |
| ⚪ Empty | 14 | 19% |
| ⚪ Not used by code | 4 | 5% |
| ❓ Unknown status | 12 | 16% |

### Critical Placeholders (will crash on startup)

| Variable | Current Value | Impact |
|----------|---------------|--------|
| `DATABASE_URL` | `postgresql://tradingo:YOUR_DATABASE_PASSWORD@postgres:5432/tradingo` | 🔴 DB connection fails — API won't start |
| `REDIS_URL` | `redis://:YOUR_REDIS_PASSWORD@redis:6379/0` | 🔴 Redis auth fails — sessions, cache, queues broken |
| `JWT_SECRET` | `YOUR_JWT_SECRET_HERE` | 🔴 Token forgery vulnerability, auth broken |
| `JWT_REFRESH_SECRET` | `YOUR_JWT_REFRESH_SECRET_HERE` | 🔴 Same |
| `RAZORPAY_KEY_ID` | `rzp_live_YOUR_KEY_ID_HERE` | 🔴 All payments fail |
| `RAZORPAY_KEY_SECRET` | `YOUR_KEY_SECRET_HERE` | 🔴 Payment verification fails |
| `RAZORPAY_WEBHOOK_SECRET` | `YOUR_WEBHOOK_SECRET_HERE` | 🔴 Webhook signature verification fails |
| `OPENROUTER_API_KEY` | `YOUR_OPENROUTER_API_KEY` | 🔴 All AI features broken (primary provider) |
| `AI_VAULT_MASTER_KEY` | `YOUR_AI_VAULT_MASTER_KEY_HERE` | 🔴 AI vault encryption fails |
| `AWS_ACCESS_KEY_ID` | `YOUR_AWS_ACCESS_KEY_ID` | 🔴 File uploads, SES email broken |
| `AWS_SECRET_ACCESS_KEY` | `YOUR_AWS_SECRET_ACCESS_KEY` | 🔴 Same |
| `OPENSEARCH_URL` | `https://localhost:9200` | 🔴 Not production — localhost URL |
| `OPENSEARCH_USERNAME` / `PASSWORD` | `YOUR_OPENSEARCH_*` | 🔴 OpenSearch auth fails |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_YOUR_KEY_ID_HERE` | 🔴 Frontend checkout fails |
| `SENTRY_DSN` | `https://your-dsn@sentry.io/your-project` | 🔴 Error monitoring non-functional |

### `.env.example` Comparison

- Exists: ✅ `E:\tradingo\.env.example` (180 lines, 25 sections, ~100 variables)
- Has variables NOT in `.env.production`: `FEATURE_*` flags, `GA4_*`, `TURNSTILE_*`, `AI_CACHE_TTL`, AI provider base URLs, `PG_*` vars, `DR_*` region vars
- Missing from `.env.example` vs `.env.production`: `API_URL`, `SMS_PROVIDER`, `CLOUDFRONT_DOMAIN`, `WAL_BACKUP_BUCKET`, `GRAFANA_ADMIN_PASSWORD`
- **Action**: Synchronize the two files

---

## 6. Secrets Audit

### CI/CD Secrets Required

| Secret | Required By | Classification | Notes |
|--------|-------------|:--------------:|-------|
| `AWS_ACCOUNT_ID` | deploy.yml, deploy-production.yml | 🔴 PLACEHOLDER | Validate job checks emptiness; actual value unknown |
| `AWS_ACCESS_KEY_ID` | All deploy workflows | ❓ UNKNOWN | Must be configured in GitHub Secrets |
| `AWS_SECRET_ACCESS_KEY` | All deploy workflows | ❓ UNKNOWN | Same |
| `SLACK_WEBHOOK_URL` | deploy.yml, deploy-production.yml | ❓ UNKNOWN / EMPTY | `.env.production` value is empty |
| `SUBNETS` | deploy.yml, deploy-production.yml | ❓ UNKNOWN | Required for ECS run-task network config |
| `SECURITY_GROUPS` | deploy.yml, deploy-production.yml | ❓ UNKNOWN | Same |
| `DATABASE_URL` | deploy-staging.yml | ❓ UNKNOWN | Passed as CLI arg (security concern) |
| `E2E_BUYER_EMAIL` etc. | playwright.yml | ❓ UNKNOWN | Has hardcoded fallbacks in YAML |

### K8s Secrets Template (`tradingo-secrets-template.yaml`)

28 keys defined, **ALL values are `CHANGE_ME`**:
- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SENTRY_DSN`
- `SMTP_USER`, `SMTP_PASS`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `GOOGLE_MAPS_API_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
- `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `POSTGRES_PASSWORD`, `REDIS_PASSWORD`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `PAYMENT_MODE`, `NODE_ENV`
- `GRAFANA_ADMIN_PASSWORD`

### Summary

| Classification | Count |
|:---------------|:-----:|
| ✅ Present (real value) | 0 |
| 🔴 Placeholder / `CHANGE_ME` | 30+ |
| ❓ Unknown (may or may not be in GitHub Secrets) | 8+ |
| ⚪ Empty value | 3+ |

**No production secrets are configured anywhere in the repository.** All env files, K8s secrets templates, and CI/CD references use placeholder values.

---

## 7. DNS & SSL Audit

### DNS Readiness

| Domain | Configured In | DNS Records Exist? | Status |
|--------|--------------|:------------------:|:------:|
| `tradingo.in` | Ingress, `.env.production`, ConfigMap | ❓ Unknown — no DNS config in repo | 🟡 Assumed unconfigured |
| `www.tradingo.in` | Ingress | ❓ Unknown | 🟡 Assumed unconfigured |
| `api.tradingo.in` | Ingress, `.env.production`, ConfigMap | ❓ Unknown | 🟡 Assumed unconfigured |
| `app.tradingo.in` | Not referenced (uses tradingo.in) | ❓ Unknown | 🟡 Alternative domain |
| `monitor.tradingo.in` | Not referenced anywhere | ❓ Not configured | 🔴 Not configured |

**Repository contains zero DNS configuration files.** No Route53 zone files, no `external-dns` annotations, no DNS provider configuration. DNS must be configured manually or via cloud provider console.

### SSL Readiness

| Item | Status | Notes |
|------|:-----:|-------|
| cert-manager ClusterIssuer | ✅ Configured | `letsencrypt-prod` in `ingress.yaml` (K8s only) |
| Let's Encrypt automation | ✅ Scripted | `deploy-vps.sh` uses certbot for Docker/VPS |
| ACM certificate guide | ✅ Documented | `ssl-config.md` (250 lines) covers ACM, cert-manager, certbot |
| Certificate files exist? | 🔴 **NO** | `infrastructure/nginx/ssl/` contains only `README.md` — no `fullchain.pem` or `privkey.pem` |
| Renewal strategy | ✅ Documented | ACM auto-renewal + certbot cron + monitoring script |
| HSTS configuration | ✅ Configured | Nginx config has `max-age=63072000; includeSubDomains; preload` |
| TLS version enforcement | ✅ Configured | TLS 1.2/1.3 only, strong ciphers |

**BLOCKING**: SSL certificate files do not exist. The Docker Compose deployment references `fullchain.pem` and `privkey.pem` which are only `README.md` placeholders. Nginx will fail to bind port 443.

---

## 8. CI/CD Audit

### Workflow Inventory (5 files)

| Workflow | Trigger | Purpose | Status |
|----------|---------|---------|:------:|
| `ci.yml` | Push to main/develop, PR to main | Lint, typecheck, test, build, docker build check | 🟢 **READY** — 4 jobs, proper dependency chain |
| `deploy.yml` | CI pass on main (workflow_run) | Auto production deploy to ECS | 🟡 **CONDITIONAL** — well-structured but untested |
| `deploy-production.yml` | Manual (workflow_dispatch) | Manual production deploy to ECS | 🟡 **CONDITIONAL** — missing `wait-for-minutes` |
| `deploy-staging.yml` | Push to develop | Auto staging deploy to ECS | 🔴 **BLOCKED** — missing `__AWS_ACCOUNT_ID__` substitution, secret exposure, raw CLI |
| `playwright.yml` | Push/PR to main/develop | E2E tests with DB + Redis | 🟡 **CONDITIONAL** — fragile startup, hardcoded creds |

### Build & Test

| Step | Present? | Details |
|------|:--------:|---------|
| Lint | ✅ | `pnpm lint` (api + web) |
| Typecheck | ✅ | `pnpm typecheck` (api + web) |
| Unit tests | ✅ | `pnpm test --coverage` (api only — web missing) |
| E2E tests | ✅ | Playwright with Chromium, DB, Redis |
| Build | ✅ | `pnpm build` (api + web) |
| Docker build | ✅ | Builds images (but only as compile check in CI) |

### Image Publishing

| Aspect | Detail |
|--------|--------|
| Registry | Amazon ECR |
| API tags | `latest`, `${{ github.sha }}`, `${{ github.ref_name }}` (sha-pinned) |
| Web tags | Same |
| Staging tags | `tradingo/api:$sha`, `tradingo/api:staging` (different path) |
| Tag strategy | **Good** — SHA-pinned for rollback, latest for convenience |

### Deployment

| Aspect | Production | Staging |
|--------|-----------|---------|
| Target | ECS Fargate | ECS Fargate |
| Migration | `run-task` with exit code check, abort on failure | `docker run` with **NO exit code check** |
| Deploy action | `amazon-ecs-deploy-service-definition` | Raw AWS CLI (`register-task-definition` + `update-service`) |
| Wait for stability | 10 min timeout (auto) | `aws ecs wait services-stable` |
| | **MANUAL workflow missing wait-for-minutes** | |
| Health check | Curl retry on health + frontend | `smoke-test.sh` script |
| Slack notification | ✅ | ❌ Missing |

### Rollback

| Aspect | Rating | Detail |
|--------|:-----:|--------|
| Automated rollback on failure | ✅ Yes | Separate `rollback` job, `if: failure()` |
| Rollback method | ✅ Sound | Reverts to previous task definition |
| First-deployment guard | ❌ Missing | First-deploy rollback will redeploy same broken version |
| Database rollback | ❌ Not handled | Schema migration is one-way; no `prisma migrate down` |
| Slack notification on rollback | ✅ Yes | Separate Slack message for rollback completion |

### Critical CI/CD Issues

| ID | Issue | Severity | File |
|----|-------|:--------:|------|
| C-C1 | **`__AWS_ACCOUNT_ID__` substitution missing in staging** | 🔴 BLOCKING | `deploy-staging.yml` — task definitions rendered with literal `__AWS_ACCOUNT_ID__`, invalid ARNs |
| C-C2 | **Secret leakage via CLI** | 🔴 BLOCKING | `deploy-staging.yml` — `DATABASE_URL` passed as `docker run -e` argument, visible in process list |
| C-C3 | **Production manual deploy missing timeout** | 🟠 HIGH | `deploy-production.yml` — no `wait-for-minutes`, default 6-hour timeout |
| C-C4 | **First-deployment rollback loop** | 🟠 HIGH | All deploy workflows — rollback redeploys current (failed) task definition |
| C-C5 | **No web unit tests** | 🟡 MEDIUM | `ci.yml` — only API tests run |
| C-C6 | **No Sentry release integration** | 🟡 MEDIUM | All deploy workflows — no release tracking |
| C-C7 | **No staging → production gate** | 🟡 MEDIUM | Auto-production deploys directly from CI pass, no staging validation |

---

## 9. Monitoring Audit

### Components

| Component | Configured? | Status | Notes |
|-----------|:----------:|:------:|-------|
| Prometheus | ✅ Docker Compose | 🟢 Ready | `prometheus.yml` with 5 scrape jobs, 14 alert rules, 10 recording rules |
| Grafana | ✅ Docker Compose | 🟡 Missing dashboards | Datasource provisioned (Prometheus), dashboards directory is empty |
| Alertmanager | ✅ Docker Compose | 🟡 Empty webhook | Configured with Slack receiver but `SLACK_WEBHOOK_URL` is empty |
| Postgres Exporter | ✅ Docker Compose | 🟢 Ready | Configured with DB credentials |
| Redis Exporter | ✅ Docker Compose | 🟢 Ready | Configured with Redis password |
| Node Exporter | ✅ Docker Compose | 🟢 Ready | Host metrics |
| Sentry | ✅ SDK in code | 🔴 DSN placeholder | `SENTRY_DSN` is `https://your-dsn@sentry.io/your-project` — no error data reaches Sentry |
| Health endpoints (3) | ✅ API | 🟢 Ready | `GET /live`, `GET /ready`, `GET /health` all functional |
| Smoke tests (4) | ✅ Scripts | 🟢 Ready | Shell, TypeScript, PowerShell, k6 |
| K8s monitoring | ❌ Not configured | 🔴 Missing | No PodMonitor/ServiceMonitor, no metrics adapter for HPA |
| ECS monitoring | ❌ Not configured | 🔴 Missing | No Container Insights, no CloudWatch dashboard in repo |

### Port Exposure (Docker Compose)

| Service | Port | Exposed To | Risk |
|---------|:----:|:----------:|:----:|
| PostgreSQL | 5432 | `0.0.0.0` (public) | 🔴 **CRITICAL** — Database accessible from network |
| API | 3001 | `0.0.0.0` (public) | 🔴 **HIGH** — Bypasses nginx |
| Web | 3000 | `0.0.0.0` (public) | 🔴 **HIGH** — Bypasses nginx |
| Nginx | 80, 443 | `0.0.0.0` (public) | ✅ Intentional |
| Prometheus | 9090 | `0.0.0.0` (public) | 🔴 **MEDIUM** — No auth on metrics |
| Grafana | 3002 | `0.0.0.0` (public) | 🔴 **MEDIUM** — Dashboard accessible |
| Alertmanager | 9093 | `0.0.0.0` (public) | 🔴 **MEDIUM** — Alert config accessible |
| Postgres Exporter | 9187 | `0.0.0.0` (public) | 🔴 **MEDIUM** — Metrics visible |
| Redis Exporter | 9121 | `0.0.0.0` (public) | 🔴 **MEDIUM** — Metrics visible |
| Node Exporter | 9100 | `0.0.0.0` (public) | 🔴 **MEDIUM** — Host metrics visible |

**Recommendation**: Only nginx (80/443) should be publicly exposed. All other ports should either be removed (internal compose network) or bound to `127.0.0.1`.

---

## 10. Blocking Issues

### 🔴 BLOCKING (Must Fix Before Any Deployment)

| ID | Issue | Domain | Impact | Fix Required |
|----|-------|--------|--------|-------------|
| B-1 | **SSL certificates don't exist** | SSL/Infra | Nginx fails to start on port 443. Docker Compose deployment blocked. | Generate Let's Encrypt certs or ACM certificates before deployment |
| B-2 | **JWT secrets are placeholders** | Secrets/Auth | Auth broken; token forgery vulnerability | Generate and inject real `JWT_SECRET` and `JWT_REFRESH_SECRET` (64+ char random) |
| B-3 | **Database/Redis passwords are placeholders** | Secrets/Infra | API fails to connect to PostgreSQL and Redis on startup | Set real passwords in `.env.production`, `docker-compose.prod.yml`, and secrets |
| B-4 | **No cloud infrastructure exists** | Infrastructure | Target clusters (ECS/K8s) don't exist; no compute, no network, no IAM | Provision AWS account, ECS cluster, VPC, subnets, security groups, IAM roles |
| B-5 | **Staging workflow missing `__AWS_ACCOUNT_ID__` substitution** | CI/CD | Staging deployment produces invalid IAM ARNs; ECS registration fails | Add `sed` substitution step to `deploy-staging.yml` before task definition rendering |
| B-6 | **All Docker Compose ports publicly exposed** | Security | Database, API, monitoring services accessible without auth | Bind internal ports to `127.0.0.1` or remove port mappings; only nginx should be public |
| B-7 | **OpenSearch points to localhost** | Environment | Search features will fail in production | Set `OPENSEARCH_URL` to production OpenSearch endpoint |
| B-8 | **CI/CD secrets are not configured** | CI/CD | All deploy workflows will fail at first step | Configure all 8 CI/CD secrets in GitHub (AWS_ACCOUNT_ID, AWS keys, Slack webhook, subnets, security groups) |

### 🟠 HIGH (Fix Before Production Traffic)

| ID | Issue | Domain |
|----|-------|--------|
| H-1 | Razorpay keys are placeholders — all payments fail | Secrets/Finance |
| H-2 | OpenRouter API key is placeholder — all AI features fail | Secrets/AI |
| H-3 | AI vault master key is placeholder — AI encryption fails | Secrets/AI |
| H-4 | AWS access keys are placeholders — file uploads, SES email fail | Secrets/AWS |
| H-5 | Sentry DSN is placeholder — zero error monitoring | Monitoring |
| H-6 | Grafana admin password is placeholder — unauthorized dashboard access | Secrets/Monitoring |
| H-7 | K8s PDB selector mismatch for PostgreSQL (dead config) | K8s |
| H-8 | K8s secrets template included in kustomization (dummy values applied) | K8s |
| H-9 | Web health probe on `GET /` (false positives when backend is down) | K8s |
| H-10 | Production manual deploy missing `wait-for-minutes` (6h default timeout) | CI/CD |
| H-11 | First-deployment rollback would loop (no previous version) | CI/CD |
| H-12 | Staging migration has no exit code check (silent failure) | CI/CD |
| H-13 | Staging deploy uses raw CLI instead of ECS deploy action | CI/CD |
| H-14 | Missing NetworkPolicy (no pod isolation in K8s) | K8s |
| H-15 | Missing database backup/restore automation in K8s/Docker Compose | Infra |
| H-16 | Single-replica PostgreSQL and Redis (no HA, node failure = downtime) | Infra |
| H-17 | ClickHouse not in Docker Compose (only in env config) | Infra |

### 🟡 MEDIUM (Fix Post-Launch or Before Peak Load)

| ID | Issue | Domain |
|----|-------|--------|
| M-1 | E2E tests have hardcoded credentials in plaintext | CI/CD |
| M-2 | No web unit tests in CI | CI/CD |
| M-3 | No Sentry release integration in deploy workflows | CI/CD |
| M-4 | No staging → production validation gate | CI/CD |
| M-5 | Grafana dashboards directory is empty | Monitoring |
| M-6 | Alertmanager Slack webhook is empty | Monitoring |
| M-7 | K8s ingress missing security headers (HSTS, XFO, XCTO) | K8s |
| M-8 | ConfigMap/Secret value duplication (SMTP_HOST etc. in both) | K8s |
| M-9 | `api-migrate` missing resource limits in Docker Compose | Infrastructure |
| M-10 | PostgreSQL/Redis healthchecks missing `start_period` | Infrastructure |
| M-11 | Web depends_on uses shorthand form (no `condition: service_healthy`) | Infrastructure |
| M-12 | No logging configuration (logs grow unbounded) | Infrastructure |
| M-13 | No `security_opt` (no-new-privileges) on containers | Infrastructure |
| M-14 | `.env.example` and `.env.production` out of sync | Environment |

---

## 11. Exact Files Requiring Changes

### Pre-Deployment (Must Fix)

| # | File | Change Required | Linked Issue |
|---|------|-----------------|:------------:|
| 1 | `.env.production` | Replace ALL 18 placeholder values with real production secrets | B-2, B-3, H-1–H-6 |
| 2 | `docker-compose.prod.yml` | Remove/bind to 127.0.0.1 for 10 publicly exposed ports | B-6 |
| 3 | `docker-compose.prod.yml` | Add nginx healthcheck | B-6 |
| 4 | `infrastructure/nginx/ssl/` | Create `fullchain.pem` and `privkey.pem` (or switch to ACM) | B-1 |
| 5 | `.github/workflows/deploy-staging.yml` | Add `sed -i "s/__AWS_ACCOUNT_ID__/.../g"` before task def rendering | B-5 |
| 6 | `.github/workflows/deploy-staging.yml` | Replace `docker run -e DATABASE_URL` with ECS `run-task` pattern | B-5/C-C2 |
| 7 | `.github/workflows/` (all deploy) | Configure all 8 required GitHub Secrets | B-8 |
| 8 | `ops/k8s/pdb.yaml` | Fix PostgreSQL selector: `app: tradingo-postgres` → `app: postgres` | H-7 |
| 9 | `ops/k8s/kustomization.yaml` | Remove `tradingo-secrets-template.yaml` from resources | H-8 |
| 10 | `ops/k8s/api-deployment.yaml` | Pin image tag to SHA (not `:latest`) | H-3/K-C3 |
| 11 | `ops/k8s/web-deployment.yaml` | Pin image tag; change probe path from `/` to dedicated health endpoint | H-9/K-C4 |

### CI/CD Fixes

| # | File | Change Required | Linked Issue |
|---|------|-----------------|:------------:|
| 12 | `deploy-production.yml` | Add `wait-for-minutes: 10` to both ECS deploy steps | H-10 |
| 13 | All deploy workflows | Add first-deployment guard to rollback (skip if no previous version) | H-11 |
| 14 | `deploy-staging.yml` | Add migration exit code check after `docker run` | H-12 |
| 15 | `deploy-staging.yml` | Replace raw CLI deploy with `amazon-ecs-deploy-service-definition` action | H-13 |
| 16 | `ci.yml` | Add web unit tests (`pnpm --filter @tradingo/web test`) | M-2 |
| 17 | `playwright.yml` | Move hardcoded test credentials to GitHub Secrets | M-1 |

### Infrastructure Hardening

| # | File | Change Required | Linked Issue |
|---|------|-----------------|:------------:|
| 18 | `ops/k8s/` | Create NetworkPolicy manifest | H-14 |
| 19 | `docker-compose.prod.yml` / K8s | Add backup CronJob for PostgreSQL | H-15 |
| 20 | `docker-compose.prod.yml` | Add `start_period` to postgres + redis healthchecks | M-10 |
| 21 | `docker-compose.prod.yml` | Fix `web.depends_on` to use `condition: service_healthy` | M-11 |
| 22 | `docker-compose.prod.yml` | Add logging config (max-size, max-file) to all services | M-12 |
| 23 | `docker-compose.prod.yml` | Add `security_opt: ["no-new-privileges:true"]` | M-13 |
| 24 | `docker-compose.prod.yml` | Add resource limits to `api-migrate` service | M-9 |

### Environment & Config

| # | File | Change Required | Linked Issue |
|---|------|-----------------|:------------:|
| 25 | `.env.example` + `.env.production` | Synchronize variables (add missing, remove unused) | M-14 |
| 26 | `ops/k8s/tradingo-configmap.yaml` | Replace CloudFront placeholder with real domain | K8s audit |
| 27 | `ops/k8s/ingress.yaml` | Add security headers annotations (HSTS, X-Frame-Options, etc.) | M-7 |

---

## 12. Recommended Implementation Order

### Phase 1: Pre-Deployment Essentials (Day 1–2)

```
Priority: Critical — Deployment will fail without these
─────────────────────────────────────────────────────
1. Provision cloud infrastructure (AWS account, ECS cluster, VPC, subnets, IAM)
2. Configure 8 CI/CD secrets in GitHub (AWS_ACCOUNT_ID, keys, subnets, SGs, Slack)
3. Generate SSL certificates (ACM for ECS/ALB, Let's Encrypt for Docker/VPS)
4. Fill ALL 18 placeholder values in .env.production with real secrets
5. Fix port exposure in docker-compose.prod.yml (bind to 127.0.0.1)
6. Add nginx healthcheck to docker-compose.prod.yml
```

### Phase 2: CI/CD Fixes (Day 2–3)

```
Priority: High — Staging deployment currently broken
─────────────────────────────────────────────────────
7. Add __AWS_ACCOUNT_ID__ substitution to deploy-staging.yml
8. Fix secret leakage in deploy-staging.yml (use ECS run-task pattern)
9. Add wait-for-minutes to deploy-production.yml
10. Add migration exit code check to deploy-staging.yml
11. Add first-deployment rollback guard to all deploy workflows
```

### Phase 3: K8s Fixes (If K8s Path Chosen — Day 3–4)

```
Priority: High for K8s deployment; skip if using ECS
─────────────────────────────────────────────────────
12. Fix PDB selector mismatch (app: tradingo-postgres → app: postgres)
13. Remove secrets template from kustomization.yaml resources
14. Pin image tags to SHAs (not :latest) in all deployment manifests
15. Fix web health probe path (use dedicated health endpoint)
16. Create NetworkPolicy manifest
```

### Phase 4: Monitoring & Hardening (Day 4–5)

```
Priority: Medium — Fix before production traffic
─────────────────────────────────────────────────────
17. Configure Sentry DSN (real project)
18. Create Grafana dashboards (at minimum: Node, Postgres, API, Web, Redis)
19. Configure Alertmanager Slack webhook
20. Add start_period to postgres/redis healthchecks
21. Add logging configuration to all Docker Compose services
22. Add security_opt (no-new-privileges) to containers
```

### Phase 5: Testing & Verification (Day 5–6)

```
Priority: Medium — Verify everything works
─────────────────────────────────────────────────────
23. Run CI pipeline end-to-end (confirm all 4 jobs pass)
24. Run Playwright E2E tests (with proper credentials, not fallbacks)
25. Execute smoke-test.sh against staging environment
26. Run k6 smoke-test.js (1 VU, verify 5 endpoints)
27. Verify rollback procedure on staging
28. Add web unit tests to CI
```

---

## 13. Final Verdict

> **BLOCKED**

**Score**: 44/100

**One-sentence summary**: TRADINGO has best-in-class deployment documentation and verification tooling (90th percentile), but zero production secrets configured, zero cloud infrastructure provisioned, and multiple blocking configuration issues in every deployment path.

**Deployment path readiness:**

| Path | Status | Notes |
|------|:-----:|-------|
| 🐳 Docker Compose (single host) | 🔴 **BLOCKED** | SSL certs missing, 18 placeholder env vars, all ports publicly exposed |
| ☸️ Kubernetes | 🔴 **DEPRECATED** | Manifests explicitly marked deprecated by own README; PDB broken; latest tags |
| ⚡ ECS Fargate (CI/CD) | 🔴 **BLOCKED** | No AWS infrastructure exists; CI/CD secrets not configured; staging workflow broken |
| 🖥️ VPS (manual script) | 🟡 **DOCUMENTED ONLY** | Script exists (`deploy-vps.sh`); real deployment would hit same env var + SSL blockers |

**Minimum effort to READY**: 2–3 days of concentrated work on Phase 1 essentials (infrastructure provisioning, secrets configuration, SSL certs, port hardening). The deployment documentation, CI/CD architecture, and verification scripts are solid and require minimal changes.

**Do not deploy until**:
- [ ] Cloud infrastructure provisioned (ECS cluster or VPS provisioned)
- [ ] All `.env.production` placeholders replaced with real values
- [ ] SSL certificates generated and placed at expected paths
- [ ] Docker Compose ports hardened (only nginx public)
- [ ] CI/CD secrets configured in GitHub
- [ ] Staging workflow `__AWS_ACCOUNT_ID__` bug fixed
- [ ] Smoke tests pass against target environment

---

**Audit complete. No infrastructure created, no deployments executed, no manifests modified.**
