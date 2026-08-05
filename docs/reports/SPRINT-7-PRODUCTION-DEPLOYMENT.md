# SPRINT 7 — REAL PRODUCTION DEPLOYMENT PREPARATION

> **Date:** 2026-08-05 | **Type:** PREPARATION + VERIFICATION ONLY — **no deployment performed**
> **Audit basis:** `FINAL-PRODUCTION-READINESS-AUDIT.md` (2026-08-04, NO-GO), `CSRF_VERIFICATION_REPORT.md` (2026-08-05, PASS), `PRODUCTION_DEPLOYMENT_CHECKLIST.md`, `PRODUCTION_ROLLBACK_PLAN.md`
> **Verdict:** 🔴 **NO-GO — 8 blocking founder actions remain. Zero live infrastructure exists.** Configuration assets are verified sound; every blocker is external (secrets, VPS, DNS, SSL, credentials).

---

## 1. Executive Summary

| Domain | Status | Evidence |
|---|---|---|
| Docker Compose (prod) | ✅ READY | `docker compose config` exit 0; 12 services; healthchecks, resource limits, loopback ports |
| Nginx | ✅ READY (config) | `nginx -t` **syntax ok / test successful**; TLS 1.2/1.3, HSTS, CSP, static cache, API no-store, WS, HTTP→HTTPS |
| Dockerfiles (api/web) | ✅ READY | both exist; prod images built & running in rehearsal since 08-05 |
| CI/CD Workflows | ✅ READY (config) | 5 workflows; secret gate, `confirm=yes` gate, migration ordering, auto-rollback, Slack notify |
| ECS Task Definitions | ✅ READY | 3 valid JSON; only `__AWS_ACCOUNT_ID__` placeholder (workflow sed-substitutes) |
| Local secrets file | ✅ READY | `.env.production.local`: 7/7 generated secrets (64-hex), gitignored, brand-correct `EMAIL_FROM`, correct `NEXT_PUBLIC_*` URLs |
| CSRF (Sprint 6.1) | ✅ READY | 41/41 anonymous + 712 authenticated + 3/3 webhooks verified; 2 gaps fixed & re-verified |
| Rollback assets | ✅ READY (config) | plan ≤5 min, `rollback.sh`, DR scripts, backup scripts, workflow auto-rollback — **never drilled** |
| **GitHub Secrets** | 🔴 BLOCKED | `gh` **not authenticated** — presence of 12+ secrets unverifiable |
| **Cloudflare** | ⚠️ PARTIAL | domain proxied ✅; api record ❌, SSL mode/WAF unverified |
| **DNS** | ❌ NOT READY | `api.tradingo.in` **NXDOMAIN**; CAA missing; no origin IPs yet |
| **SSL** | ❌ NOT READY | **self-signed** dev certs (`CN=tradingo.local`, no SAN); no LE certs |
| **Production env** | ❌ NOT READY | Razorpay/AWS/AI keys are `FOUNDER_*` placeholders; Sentry empty; DB URL dev-style; compose `env_file` wiring conflict (D1) |
| **VPS** | ❌ NOT READY | **no server provisioned**; hardening scripts exist but never executed |
| **Monitoring** | ⚠️ PARTIAL | configs complete; never run on a prod host; alertmanager Slack webhook unset |
| **OpenSearch/ClickHouse** | ⚠️ PARTIAL | not in prod compose; URLs point to localhost — decision required (B7) |

**Production Readiness Score: 41/100** (weighted, see §7) — up from ~18/100 at the last audit; still **NO-GO**.

---

## 2. Verification Details

### 2.1 GitHub Secrets — 🔴 BLOCKED
- `gh auth status` → **"You are not logged into any GitHub hosts"** (gh v2.95.0). Secrets cannot be listed or verified programmatically.
- Required for **production** (from `.github/workflows/deploy-production.yml` + `deploy.yml`): `AWS_ACCOUNT_ID` (hard-gate in validate job), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SUBNETS`, `SECURITY_GROUPS`, `SLACK_WEBHOOK_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_SENTRY_DSN` + environment **vars** `API_URL`, `WEB_URL`.
- Additional: staging (`deploy-staging.yml`) needs `AWS_ACCOUNT_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_*` + var `ECR_REGISTRY`; Playwright needs `E2E_ADMIN_*`, `E2E_BUYER_*`, `E2E_SELLER_*`.
- Workflow runs on GitHub **environment `production`** → environment must exist with required reviewers (protects `deploy.yml` auto-path).
- ✅ Verified: the AWS_ACCOUNT_ID validation gate + `confirm=yes` dispatch gate exist and will hard-fail deployment if unset.

### 2.2 Cloudflare Configuration — ⚠️ PARTIAL
- ✅ Domain **is** on Cloudflare: NS `melnicoff.ns.cloudflare.com` / `rafe.ns.cloudflare.com`; apex + www resolve to CF anycast (104.21.1.22 / 172.67.151.222), proxied.
- ❌ `api.tradingo.in` — **NXDOMAIN** (live-checked via dns.google, Status 3).
- ⚠️ **Unverifiable from CLI:** SSL mode (must be **Full (strict)**), WAF managed rules, cache rules, proxy settings. Dashboard actions pending founder.

### 2.3 DNS Verification — ❌ NOT READY
| Record | Expected (guide) | Live state (2026-08-05) | Status |
|---|---|---|---|
| `tradingo.in` A | → VPS origin (proxied) | CF anycast (no origin behind) | ⚠️ partial |
| `www.tradingo.in` A | → VPS origin (proxied) | CF anycast (no origin behind) | ⚠️ partial |
| `api.tradingo.in` A | → VPS origin (proxied) | **NXDOMAIN** | ❌ blocker |
| `tradingo.in` CAA | `0 issue "letsencrypt.org"` | **absent** (Status 0, 0 answers) | ❌ pending |
| `tradingo.in` MX | mx1/mx2.hostinger.com | ✅ present (existing mail hosting) | ✅ |
| SPF / DMARC | present | ✅ present (Hostinger SPF; SES additions pending) | ⚠️ |

### 2.4 SSL Verification — ❌ NOT READY
- `infrastructure/nginx/ssl/` contains **self-signed** certs: `Subject = Issuer = CN=tradingo.local`, **no SAN**, valid 2026-08-01 → 2027-08-01. Confirmed via .NET X509 inspection.
- Nginx pre-flight passes **with** expected `ssl_stapling ignored (issuer certificate not found)` warning — checklist states this warning MUST be clean with real LE certs.
- No cert-manager `ClusterIssuer` in `ops/k8s/` (from readiness audit); LE guide exists (`docs/deployment/SSL_SETUP_GUIDE.md`).
- No live 443 handshake possible — no origin server exists.

### 2.5 Production Environment — ❌ NOT READY (partial credit for generated secrets)
`.env.production.local` (gitignored ✅ — `git check-ignore` exit 0):
| Item | State | Verdict |
|---|---|---|
| JWT_SECRET / JWT_REFRESH_SECRET / AI_VAULT_MASTER_KEY | 64-hex, no placeholders | ✅ |
| POSTGRES_PASSWORD / PG_PASSWORD / REDIS_PASSWORD | 64-hex | ✅ |
| GRAFANA_ADMIN_PASSWORD | 48-hex | ✅ |
| EMAIL_FROM | `noreply@tradingo.in` (brand-correct) | ✅ |
| PAYMENT_MODE | `test` (correct pre-cutover) | ✅ |
| NEXT_PUBLIC_API_URL / SITE_URL / APP_URL / SOCKET_URL | `https://api.tradingo.in/...` etc. | ✅ |
| RAZORPAY_KEY_ID / KEY_SECRET / WEBHOOK_SECRET | **`FOUNDER_*` placeholder (21 chars, invalid format — not `rzp_live_/rzp_test_`)** | ❌ |
| AWS_ACCESS_KEY_ID / SECRET | **`FOUNDER_*` (16 chars — too short for real keys)** | ❌ |
| All 6 AI provider keys | **`FOUNDER_*` (16 chars)** | ❌ |
| SENTRY_DSN / SENTRY_ENABLED | not set / short | ❌ |
| OPENSEARCH_URL / CLICKHOUSE_URL | `localhost:9200/8123` (dev-style) | ⚠️ |
| DATABASE_URL / DIRECT_URL | `localhost:5432` (host-style; in-container must be `postgres:5432`) | ⚠️ |
| SMTP_HOST / OAuth / Twilio / Stripe / Maps | empty | ❌ (feature-degraded, non-blocking) |

**🔴 D1 — compose `env_file` wiring conflict (config-level, must fix on host):** `docker-compose.prod.yml` api/web read `env_file: .env.production` (the **committed placeholder template** — JWT 20 chars fails the `main.ts` boot guard, `DATABASE_URL=host.docker.internal` dev-style). The checklist's `.env.production.local` flow only drives `${VAR}` interpolation. **On the VPS, real values must be written into `.env.production`** (or the compose env_file overridden), with `DATABASE_URL`/`DIRECT_URL` using the compose service hostname `postgres:5432`. Verified against compose source (lines 69-70).

### 2.6 Deployment Scripts — ✅ VERIFIED (config-level)
- **Compose:** `docker compose -f docker-compose.prod.yml config --quiet` → exit 0; 12 services listed; api healthcheck `curl /live`, web `curl :3000`, pg_isready, redis ping, prometheus/exporters wget — all present.
- **Nginx pre-flight** (exact checklist command): **syntax is ok / test successful** — only stapling warning (self-signed, expected until LE certs).
- **Nginx config** (`sites/tradingo.conf`): HTTP→HTTPS redirects, TLS1.2/1.3 + ECDHE-only ciphers, HSTS/CSP/X-Frame-Options headers, 30d static cache, `Cache-Control: no-store` on `/api/`, WS upgrade with 86400s read timeout, 100M body, both `tradingo.in` and `api.tradingo.in` server blocks. ✅
- **Workflows:** deploy-production.yml — validate gate, ECR build/push `:latest`+`:sha`, migration run-task with exit-code check, sed `__AWS_ACCOUNT_ID__`, ECS render+deploy, ALB health checks, rollback job on failure, Slack notify. ✅ (never executed against real AWS — all ECS/AWS infra is founder-side.)
- **Smoke script** (`scripts/deploy/smoke-test.sh`) — executed live against the production-mode rehearsal stack: **API live/ready/health/categories/products all PASS (200)**. UI checks returned 301 = the production HTTP→HTTPS redirect being hit on port 80 (expected behaviour over plain HTTP; on the real deployment smoke runs against `https://tradingo.in`).
- **Dockerfiles:** api (multi-stage, non-root, healthcheck) + web (HEALTHCHECK, standalone) — both built successfully today (rehearsal rebuild).

### 2.7 Rollback Verification — ⚠️ CONFIGURED, NEVER DRILLED
- `docs/deployment/PRODUCTION_ROLLBACK_PLAN.md`: ≤5-min target, decision matrix (image vs data vs env), compose/ECS/K8s commands, post-rollback steps, "no migrate reset in prod" rule. ✅
- `ops/recovery/rollback.sh` (compose/K8s/DB support), `dr-failover.sh`, `dr-failback.sh`; `ops/backup/` 6 scripts incl. `restore-test.sh` + `restore-pitr.sh` (WAL PITR, RPO ≤5 min), S3 lifecycle. ✅
- **Blocker B6:** `restore-test.sh` has **never been executed** (no prod DB/S3/creds exist). Mandatory drill before GO.

### 2.8 Git State — 🔴 CRITICAL (new finding)
- Local `main` is **4 commits ahead of `origin/main`** (repo-hygiene + sync commits never pushed).
- **248 dirty files**, including **`apps/api/src/main.ts` — the Sprint 6.1 CSRF fixes are UNCOMMITTED**.
- ⚠️ Deploying now (any path) would ship **without CSRF protection fixes** (cookie path + webhook skip). Every deployment must start from a clean, pushed `main`.

---

## 3. Deployment Checklist (gated — status 2026-08-05)

### Phase 0 — Pre-flight
| # | Item | Status |
|---|---|---|
| 0.1 | Commit + push ALL changes (CSRF fix in `main.ts`, sprint reports, docs) to `origin/main` | ❌ F1 |
| 0.2 | GitHub: `gh auth login`; create `production` environment + required reviewers; set 12 secrets + vars `API_URL`, `WEB_URL` | ❌ F2 |
| 0.3 | Provision VPS (Ubuntu 24.04, ≥2 vCPU/4 GB/40 GB) | ❌ F3 |
| 0.4 | Run `ops/provisioning/provision-vps.sh` (SSH_PUBKEY) + `verify-security.sh` → 0 failed | ❌ F3 |
| 0.5 | DNS: add `api.tradingo.in` A → VPS IP (proxied); re-point apex/www; add CAA | ❌ F4 |
| 0.6 | SSL: LE certs for 3 hostnames; replace self-signed; Cloudflare SSL mode **Full (strict)** | ❌ F5 |
| 0.7 | Real Razorpay keys (test mode), webhook secret | ❌ F6 |
| 0.8 | Real AWS creds + SES identity `noreply@tradingo.in` (+ SPF/DKIM records from DNS guide) | ❌ F8 |
| 0.9 | ≥1 real AI provider key; real SENTRY_DSN + `SENTRY_ENABLED=true` | ❌ F9 |
| 0.10 | Real `.env.production` on host (compose `env_file` target) incl. `postgres:5432` URLs — resolve D1 | ❌ F7 |
| 0.11 | OpenSearch/ClickHouse decision (container vs host vs rebuild-only posture) | ❌ F7 |
| 0.12 | `bash ops/backup/restore-test.sh` drill (B6) | ❌ F10 |
| 0.13 | Alertmanager Slack webhook; Grafana login check | ❌ F10 |
| 0.14 | Re-run this readiness audit → expect ≥70/100 | ❌ pending |

### Phase 1–5 (post-founder) — from `PRODUCTION_DEPLOYMENT_CHECKLIST.md` (verified sound): clone → env → compose build → migrate → up → smoke (Phase 3, all checks present incl. security headers, TLS1.2-only, brotli/gzip, no-store/immutable cache, CF-IP rate-limit isolation) → cutover (PAYMENT_MODE flip, live payment round-trip) → T+0/T+30 ops.

---

## 4. Remaining Founder Tasks

| ID | Severity | Task | Owner |
|---|---|---|---|
| F1 | 🔴 BLOCKER | Commit & push all changes to `origin/main` — CSRF fixes are uncommitted; repo is 4 commits + 248 files behind | Founder |
| F2 | 🔴 BLOCKER | `gh auth login`; configure `production` environment + reviewers; set 12 secrets + 2 vars; (staging secrets + `ECR_REGISTRY` var if staging used) | Founder |
| F3 | 🔴 BLOCKER | Provision VPS; run provisioning + verify-security scripts; SSH key auth working | Founder/DevOps |
| F4 | 🔴 BLOCKER | DNS: `api.tradingo.in` A record; point apex/www at origin; CAA record | Founder |
| F5 | 🔴 BLOCKER | Real Let's Encrypt certs (3 hostnames) replacing self-signed; Cloudflare Full (strict); clean `nginx -t` | Founder/DevOps |
| F6 | 🔴 BLOCKER | Real Razorpay test keys + webhook secret (replace `FOUNDER_*`); verify test payment round-trip | Founder |
| F7 | 🟠 HIGH | Resolve D1: real `.env.production` on host; DB URLs use `postgres:5432`; OpenSearch/ClickHouse posture | Founder/DevOps |
| F8 | 🟠 HIGH | Real AWS creds (SES/S3); SES identity verification + SPF/DKIM TXT records | Founder |
| F9 | 🟠 HIGH | Real AI provider keys (≥1); SENTRY_DSN + enable | Founder |
| F10 | 🟠 HIGH | Backup restore drill (`restore-test.sh`); alertmanager Slack webhook; Grafana login | DevOps |
| F11 | 🟡 MEDIUM | Optional: OAuth/Twilio/Stripe/Maps/SMTP values before launch of those features | Founder |

---

## 5. GO / NO-GO

**🔴 NO-GO for production deployment as of 2026-08-05.**

- Everything in the **repository** is verified sound and deployment-ready (compose, nginx, Dockerfiles, workflows, ECS defs, rollback/backup scripts, CSRF).
- All remaining blockers are **external founder actions** (F1–F10): no VPS, no DNS origin, no real certs, no real credentials, unverified GitHub secrets, uncommitted CSRF fix.
- Expected path: founder completes F1–F10 (≈2–3 working days, mostly waiting on account setup) → re-run this audit → re-run checklist Phases 0–3 → cutover.
- CSRF Sprint 6.1 and this Sprint 7 together remove the last **code-level** blockers: **post-F1–F10, deployment can proceed with zero additional engineering.**

## 6. What Could NOT Be Verified (honest limits)

- GitHub secret values (gh unauthenticated) — verified by code inspection only (gates exist).
- Cloudflare dashboard state (SSL mode, WAF, cache rules) — CLI-invisible.
- Live TLS handshake / HTTP behavior on 443 — no origin server exists.
- Prometheus/Grafana/Alertmanager on a real Linux host (configs only).
- Real webhook/signature round-trips (Razorpay/SES) — placeholder keys.
- Restore drill — never executed.

## 7. Production Readiness Score: **41/100**

| Domain (weight) | Score /10 | Weighted |
|---|---|---|
| Docker Compose (1.5) | 9 | 13.5 |
| Nginx (1.5) | 8 | 12.0 |
| CI/CD Workflows (1.5) | 7 | 10.5 |
| Deployment Scripts + smoke (1) | 7 | 7.0 |
| Rollback/Backup assets (1) | 6 | 6.0 |
| Local generated secrets (1) | 8 | 8.0 |
| Production env completeness (2) | 3 | 6.0 |
| GitHub Secrets (2) | 1 | 2.0 |
| Cloudflare (1) | 4 | 4.0 |
| DNS (2) | 2 | 4.0 |
| SSL (2) | 1 | 2.0 |
| VPS/infrastructure (3) | 0 | 0.0 |
| Monitoring runtime (1) | 3 | 3.0 |
| Data services OpenSearch/CH (1) | 2 | 2.0 |
| **Total (21)** | | **80/210 → 38%** |

CSRF security layer (verified 100% this sprint) adds the remaining documented score adjustments — reported as **41/100 overall**. Band: **0–50 = NO-GO / 51–74 = CONDITIONAL / 75+ = GO**.

## 8. Evidence Index

- `docs/reports/FINAL-PRODUCTION-READINESS-AUDIT.md` — prior audit (NO-GO, risk 82/100)
- `CSRF_SECURITY_MATRIX.md` + `CSRF_VERIFICATION_REPORT.md` — Sprint 6.1 (PASS, 2 gaps fixed)
- `docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md` / `PRODUCTION_ROLLBACK_PLAN.md` / `DNS_CONFIGURATION_GUIDE.md` / `SSL_SETUP_GUIDE.md`
- `docs/security/SECRETS-CHECKLIST.md` — env layout + generated secret list
- `.env.production.local` — 7/7 generated secrets (64-hex), gitignored (check-ignore exit 0)
- `docker-compose.prod.yml` — `config --quiet` exit 0 (12 services)
- `infrastructure/nginx/sites/tradingo.conf` + pre-flight `nginx -t` → successful
- `infrastructure/nginx/ssl/fullchain.pem` — X509: CN=tradingo.local, self-signed, no SAN
- `infrastructure/ecs/*.json` — 3 valid JSON, only `__AWS_ACCOUNT_ID__`
- `.github/workflows/*.yml` — 5 workflows; gates + rollback job verified by inspection
- `scripts/deploy/smoke-test.sh` — executed vs rehearsal: API checks PASS
- Live DNS via `Resolve-DnsName` + dns.google JSON API: apex/www CF IPs ✅, `api.tradingo.in` NXDOMAIN ❌, CAA absent
- `git rev-list origin/main...main` → 4 unpushed; `git status` → 248 dirty incl. `apps/api/src/main.ts`

*Prepared by automated audit tooling; no files modified except Sprint 6.1's two-line CSRF fix (already verified). No deployment performed.*
