# VPS Deployment Preparation Report — TRADINGO

> **Status:** READY FOR VPS PROVISIONING
> **Date:** 2026-08-08
> **Target architecture (FOUNDER DECISION):** SINGLE UBUNTU VPS + `docker-compose.prod.yml`
> **Out of scope:** AWS ECS / Kubernetes — `infrastructure/terraform/`, `infrastructure/ecs/`, `ops/k8s/`, and the GitHub Actions ECS workflows remain **untouched** unless explicitly requested.
> **Constraints honored:** read-only audit only; no live deployment; no credential invention; no application code changes; no CI changes; no boot-guard weakening; nothing committed to git.

---

## 1. Repository Readiness — Verified State

| Component | Status | Evidence |
|---|---|---|
| Main SHA | `9b6fc5eff` | verified |
| Build (API + Web) | GREEN | CI green |
| Docker build | GREEN | `apps/api/Dockerfile`, `apps/web/Dockerfile` |
| Lint + typecheck | GREEN | CI green |
| Unit tests | GREEN | CI green |
| Playwright | GREEN — 216/216 | PR #4 merged |
| Product-search PostgreSQL fallback | merged | — |
| WebKit/Chromium fix | merged | — |
| Production compose | valid | `docker-compose.prod.yml` (326 lines, 12 services) |
| nginx config | valid | `infrastructure/nginx/` (nginx.conf + snippets + sites) |
| Provisioning scripts | syntax-validated | `ops/provisioning/provision-vps.sh`, `verify-security.sh` |
| Deploy scripts | present | `scripts/deploy/` (deploy-vps.sh, manage.sh, smoke-test.sh, backup-db.sh, secrets-template.sh) |
| k6 load tests | present | `ops/load-testing/` (7 scripts incl. smoke-test.js) |
| Monitoring stack | configured | `ops/monitoring/` (prometheus.yml, alert-rules, alertmanager.yml, 5 Grafana dashboards) |
| Backup stack | configured | `ops/backup/` (sidecar compose, Dockerfile.backup, verify script, s3-lifecycle) |
| Secrets schema | complete | `.env.production` (tracked template) + `.env.production.local.example` (names only) + `.env.production.local` (gitignored, 7 generated values present) |

**No code changes were required or made during this preparation.**

---

## 2. Deployment Verification (26-point checklist)

### 2.1 Compose startup order (exact)

Derived from `docker-compose.prod.yml` `depends_on` + healthchecks:

```
 1. postgres ──────────┐ (healthcheck: pg_isready)
 2. redis ─────────────┤ (healthcheck: redis-cli ping)
 3. api-migrate ───────┘ waits: postgres healthy + redis healthy
                        → runs `prisma migrate deploy` via scripts/docker-entrypoint.sh
                        → exits 0 (compose requires service_completed_successfully)
 4. api ─────────────── waits: api-migrate completed successfully + postgres/redis healthy
 5. web ─────────────── waits: api (port 3000 ready)
 6. nginx ───────────── waits: api + web (public edge :80/:443)
 7. monitoring (parallel, independent):
    prometheus → prometheus-postgres-exporter, redis-exporter, node-exporter, grafana, alertmanager
```

### 2.2 Services that must be running

All **12**: `postgres`, `redis`, `api`, `api-migrate` (runs once, exits), `web`, `nginx`, `prometheus`, `prometheus-postgres-exporter`, `grafana`, `alertmanager`, `redis-exporter`, `node-exporter`.
Optional degraded mode: OpenSearch/ClickHouse are **not** compose services — API falls back to PostgreSQL (search) and Prisma aggregation (analytics). Stack is fully functional without them.

### 2.3 Public ports (nginx ONLY)

| Port | Service | Purpose |
|---|---|---|
| 80 | nginx | HTTP → 301 HTTPS |
| 443 | nginx | HTTPS (TLS termination) |

### 2.4 Private ports (bind 127.0.0.1 only — never expose)

| Port | Service | Port | Service |
|---|---|---|---|
| 5432 | postgres | 9090 | prometheus |
| 6379 | redis | 9187 | postgres-exporter |
| 3001 | api | 3002 | grafana (host mapping) |
| 3000 | web | 9093 | alertmanager |
| 9121 | redis-exporter | 9100 | node-exporter |

All are reachable only via SSH tunnel (e.g. `ssh -L 3002:127.0.0.1:3002 user@vps`).

### 2.5 Required `.env.production.local` variables (complete schema)

Schema: `.env.production.local.example` (git-tracked, names only). Values go into `.env.production.local` (gitignored). Non-secret defaults live in the tracked `.env.production`.

### 2.6 Mandatory vs optional

| Tier | Variables | Consequence if missing |
|---|---|---|
| **[GENERATED] boot-fatal** | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `AI_VAULT_MASTER_KEY`, `GRAFANA_ADMIN_PASSWORD` | API fails to boot (boot guards FAIL FAST on placeholders/missing) |
| **[FOUNDER] boot-fatal with mode** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (fatal when `PAYMENT_MODE=live`), `SENTRY_DSN` (fatal when `SENTRY_ENABLED=true`) | API fails to boot in live mode; payment/error-tracking degraded otherwise |
| **[FOUNDER] feature-gating** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (SES email + S3 media/backup), `EMAIL_FROM`, AI provider keys (≥1 of `OPENAI/OPENROUTER/GEMINI/GROQ/TAVILY/FIRECRAWL`), `NEXT_PUBLIC_RAZORPAY_KEY_ID` (build arg) | Email/AI/payments feature-gated off; rest of platform works |
| **[GENERATED] composed** | `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `PG_PASSWORD` (must match DB password) | Derived at deploy time |
| **[OPTIONAL]** | Twilio, Stripe, LinkedIn OAuth, Google Maps, Google OAuth, `CLOUDFRONT_DOMAIN`, `SLACK_WEBHOOK_URL`, `CLICKHOUSE_*` | Feature disabled; no impact |

### 2.7 Values that must come from the founder/provider

1. Razorpay live keys (`rzp_live_...` x3) + publishable key for `NEXT_PUBLIC_RAZORPAY_KEY_ID`
2. AWS IAM keys (SES + S3 permissions), region `ap-south-1`
3. AI provider keys (OpenRouter recommended as primary)
4. Google OAuth ID/secret (optional), Sentry DSN (optional), Twilio (optional), Google Maps (optional)
5. Domain DNS control (`tradingo.in`)

### 2.8 DNS records

| Record | Type | Value | Purpose |
|---|---|---|---|
| `@` (tradingo.in) | A | `<VPS_IP>` | Web + /api/ via nginx |
| `www` | A | `<VPS_IP>` | Redirects to apex |
| `api` | A | `<VPS_IP>` | API direct + WebSocket |

Propagation 5–30 min; TLS issuance requires these to resolve to the VPS first.

### 2.9 TLS / Let's Encrypt sequence

1. DNS A records resolve to VPS (prerequisite)
2. `deploy-vps.sh setup_ssl`: `certbot certonly --standalone` for `tradingo.in`, `www.tradingo.in`, `api.tradingo.in` (ports 80/443 free — runs before nginx starts)
3. Certs copied to `infrastructure/nginx/ssl/{fullchain,privkey}.pem` (gitignored — never committed; existing .pem files in repo are self-signed placeholders)
4. nginx mounts `./infrastructure/nginx/ssl` (read-only)
5. Auto-renewal cron `/etc/cron.d/certbot-renew` daily 03:00 with post-hook `docker compose ... restart nginx`
6. Manual: `sudo certbot renew --quiet --post-hook "docker compose --env-file .env.production.local -f docker-compose.prod.yml restart nginx"`

### 2.10 Razorpay live-mode requirements

- Live keys from Razorpay dashboard; `PAYMENT_MODE=live` (already default in template)
- `razorpay.service.ts` enforces: **blocks test keys in live mode** and warns live keys in test mode — deploy fails fast if key prefix doesn't match mode
- Webhook URL must be registered in Razorpay dashboard: `https://api.tradingo.in/api/v1/payments/webhook` (verify exact path against PaymentController during deployment)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is a **build-time arg** — must be the live publishable key at image build time (compose `args:` + workflow build-args)
- Signature verification uses `timingSafeEqual` (constant-time)

### 2.11 PostgreSQL backup / PITR

- **Daily dump:** `scripts/deploy/backup-db.sh` via cron (`/etc/cron.d/tradingo-backup` 02:00) — `pg_dump --clean --if-exists | gzip`, 30-day retention
- **S3 offsite:** `ops/backup/docker-compose.backup.yml` sidecar (`tradingo/backup-agent`) uploads to `S3_BACKUP_BUCKET=tradingo-backups`, prefix `postgres`, lifecycle policy `ops/backup/s3-lifecycle.json`, verify script included
- **PITR (WAL):** `WAL_BACKUP_BUCKET=tradingo-wal-archive`, `WAL_RETENTION_HOURS=168` — see `docs/operations/PITR-README.md` for archive_command configuration on the postgres container
- **Restore:** `bash scripts/deploy/manage.sh restore backups/tradingo-<TIMESTAMP>.sql.gz`
- **Test cadence:** monthly restore drill, quarterly DR exercise (see `docs/operations/backup-strategy.md`)

### 2.12 Redis persistence

- `--appendonly yes` (AOF) + RDB snapshots (default)
- Volume `redis_data:/data` (named volume)
- Backup sidecar copies RDB/AOF; restore documented in `docs/operations/backup-strategy.md`

### 2.13 S3 backup requirements

| Bucket | Use |
|---|---|
| `tradingo-uploads` | User media (S3 direct uploads) |
| `tradingo-backups` | Daily pg dumps (30-day retention, lifecycle) |
| `tradingo-wal-archive` | WAL files (168h) |

### 2.14 Grafana / Prometheus / Alertmanager readiness

- Prometheus scrapes: `api:3001/api/v1/metrics`, `prometheus-postgres-exporter:9187`, `redis-exporter:9121`, `node-exporter:9100` (all on `tradingo-net`)
- Alert rules + recording rules loaded (`alert-rules.yml`, `recording-rules.yml`)
- Alertmanager routes to Slack `#tradingo-alerts` via `SLACK_WEBHOOK_URL` (webhook URL written to file at container start)
- Grafana: 5 provisioned dashboards (api, database, redis, queue, business), datasource auto-provisioned, admin password from `GRAFANA_ADMIN_PASSWORD`, reachable only via SSH tunnel `:3002`

### 2.15 nginx configuration & certificate locations

- Main: `infrastructure/nginx/nginx.conf`; snippets: `snippets/security-headers.conf`; sites: `sites/tradingo.conf` (both `tradingo.in` and `api.tradingo.in` server blocks, HTTP→HTTPS, TLS 1.2/1.3, HSTS, CSP, 100M body, WebSocket upgrades, `Cache-Control: no-store` on `/api/`)
- Certificates: `infrastructure/nginx/ssl/fullchain.pem` + `privkey.pem` (gitignored; Let's Encrypt copies at deploy)
- Mounted read-only into nginx container

### 2.16 Docker volume requirements

| Volume | Used by | Host location |
|---|---|---|
| `postgres_data` | postgres | `/var/lib/docker/volumes/tradingo-prod_postgres_data` |
| `redis_data` | redis (AOF) | `/var/lib/docker/volumes/tradingo-prod_redis_data` |
| `prometheus_data` | prometheus TSDB | `.../prometheus_data` |
| `grafana_data` | grafana | `.../grafana_data` |
| `backup-data`, `backup-logs` | backup sidecar | `ops/backup/docker-compose.backup.yml` |

Backup volume snapshot: `pg_dump` handles postgres; redis via sidecar; media lives in S3 (not on-disk).

### 2.17 VPS minimum recommended resources

Sum of compose `limits` ≈ **10.5 vCPU / 5.6 GB RAM**; `reservations` ≈ 2 GB RAM.

| Recommendation | Spec |
|---|---|
| **Minimum (works, tight)** | 2 vCPU / 4 GB / 80 GB SSD (Ubuntu 22.04/24.04) |
| **Recommended (headroom + backups)** | 4 vCPU / 8 GB / 100 GB SSD (NVMe) |
| Note | `provision-vps.sh` adds 2 GB swap + sysctl/limits tuning |

Existing guidance (`docs/deployment/VPS-DEPLOYMENT-GUIDE.md`) says 4 GB/2 vCPU/80 GB — acceptable as minimum.

### 2.18 Firewall requirements

- **UFW** (via `provision-vps.sh` / `deploy-vps.sh`): default deny incoming, allow `22/tcp` (SSH, key-only), `80/tcp`, `443/tcp`
- **Provider firewall/security group**: same three ports only
- All non-nginx services bind `127.0.0.1` — unreachable externally even if UFW is bypassed by Docker's iptables chains
- SSH hardening: `sshd_config.d` lockdown (root login + password auth disabled), Fail2Ban jail, dedicated deploy user `tradingo` with `id_ed25519` key

### 2.19 Deployment and rollback sequence

**Deploy (automated — `scripts/deploy/deploy-vps.sh`):** prerequisites → system deps (Docker, compose, certbot) → firewall → clone/pull repo → generate secrets (interactive prompts for founder keys) → SSL (certbot standalone) → build → migrate (`compose run --rm api-migrate`) → seed (idempotent) → `up -d` → wait healthy → smoke tests → SSL renewal cron → backup cron → sysctl tuning.

**Deploy (manual, exact):**
```bash
git pull origin main
cp .env.production.local.example .env.production.local   # fill in values (0600 perms)
docker compose --env-file .env.production.local -f docker-compose.prod.yml build
docker compose --env-file .env.production.local -f docker-compose.prod.yml run --rm api-migrate
docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d
bash scripts/deploy/smoke-test.sh http://localhost:3001 http://localhost:3000
```

**Rollback:**
1. **Code rollback:** `git checkout <PREVIOUS_SHA>` → rebuild → `compose up -d` (or `compose pull` + `up -d` to re-pull a previous image tag)
2. **DB rollback (migration failed):** restore previous dump — `bash scripts/deploy/manage.sh restore backups/tradingo-<PREVIOUS_DATE>.sql.gz` (verify before proceeding; migrations are additive by policy)
3. **Cert rollback:** previous `infrastructure/nginx/ssl/` backup → `compose restart nginx`
4. Full procedures: `docs/deployment/ROLLBACK-PROCEDURE.md`, `docs/deployment/PRODUCTION_ROLLBACK_PLAN.md`, `docs/deployment/blue-green-deploy.md` (ECS-oriented — compose uses rebuild/re-pull)

### 2.20 Post-deployment smoke tests

`scripts/deploy/smoke-test.sh` — 15 checks, exit 1 on any failure:
- API: `/live` (200 + `status:ok`), `/ready` (200 + ok), `/health` (200 + ok), `/api/v1`, `/api/v1/categories?limit=1`, `/api/v1/products?limit=1`
- UI: `/`, `/login`, `/products`, `/companies`, `/categories`, `/industries`, `/search` (all 200)
- External URLs: `https://tradingo.in` + `https://api.tradingo.in` equivalents after DNS

### 2.21–2.25 Health & metrics endpoints (verified in code)

`apps/api/src/main.ts:265` — global prefix `api/v1`, **excluding** `live/ready/health`; `health/diagnostics` and metrics under the prefix.

| Endpoint | Type | Dependencies | Expected |
|---|---|---|---|
| `GET /live` | Liveness | none | `{"status":"ok","timestamp":"..."}` |
| `GET /ready` | Readiness | PostgreSQL, Redis | `{"status":"ok","checks":{"database":"up","redis":"up"}}` |
| `GET /health` | Full health | PostgreSQL, Redis (+ optional backends) | `{"status":"ok",...}` |
| `GET /api/v1/health/diagnostics` | Deep diagnostics | all 5 backends | per-backend up/down |
| `GET /api/v1/metrics` | Prometheus | none (fastify route, main.ts:354) | Prometheus text format |

> Note: `docs/deployment/PRODUCTION-RUNBOOK.md` lists these under `/api/v1/live` etc. — **stale**; the correct public paths are root-level `/live`, `/ready`, `/health` (excluded from the global prefix), matching the compose healthchecks and smoke-test.sh. This report supersedes.

### 2.26 k6 load test requirements

Present in repo: `ops/load-testing/` — `smoke-test.js` (quick pre-release), `load-test.js`, `auth-load-test.js`, `stress-test.js`, `comprehensive-load-test.js` (7 endpoints, staged, baseline pass: 100 VUs, 0.00% 5xx, P95 7.65 ms, 293.7 req/s), `comprehensive-stress-test.js` (10→1000 VU escalation), `monitor-process.ps1`.
- Run `k6 run ops/load-testing/smoke-test.js` post-deploy against `https://api.tradingo.in`
- Full validation: `comprehensive-load-test.js` at 100 VUs — gate: 0% 5xx, P95 < 200 ms, 100% checks

---

## A. Repository readiness

Complete — see §1. No changes required before provisioning.

## B. VPS requirements

- Ubuntu 22.04/24.04 LTS, ≥ 2 vCPU / 4 GB RAM (recommended 4 vCPU / 8 GB) / ≥ 80 GB SSD (recommended 100 GB)
- SSH key access for user `tradingo` (register `id_ed25519.pub`)
- Provider firewall: 22, 80, 443 only
- Run `ops/provisioning/provision-vps.sh` (hardening: auto-updates, Fail2Ban, UFW, swap, sysctl) then verify with `ops/provisioning/verify-security.sh` (exit-0 gate)

## C. Required secrets

- Generated on VPS: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD`, `PG_PASSWORD`, `REDIS_PASSWORD`, `AI_VAULT_MASTER_KEY`, `GRAFANA_ADMIN_PASSWORD` (deploy-vps.sh auto-generates)
- Founder-supplied (13): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`, `SENTRY_DSN` (+ optional: Twilio, Stripe, LinkedIn, Maps, Slack)
- File: `.env.production.local` (gitignored, chmod 600). Schema: `.env.production.local.example`.

## D. DNS requirements

`A @ → VPS_IP`, `A www → VPS_IP`, `A api → VPS_IP` (all same IP). Required **before** TLS issuance.

## E. TLS requirements

Let's Encrypt via certbot standalone for 3 SANs (tradingo.in, www, api). Certs land in `infrastructure/nginx/ssl/` (gitignored). Auto-renewal cron installed by deploy-vps.sh.

## F. Firewall requirements

UFW: deny incoming default; allow 22/80/443. Provider firewall same. Loopback binding protects all internal services.

## G. Exact deployment sequence

1. Provision VPS + run `provision-vps.sh` + `verify-security.sh`
2. Point DNS (3 A records) → wait for propagation
3. `bash scripts/deploy/deploy-vps.sh` (or manual sequence §2.19)
4. Smoke tests pass (exit-0)
5. Configure monitoring alerting (`SLACK_WEBHOOK_URL`), verify Grafana via tunnel
6. Run k6 smoke (`ops/load-testing/smoke-test.js`)
7. `docs/operations/POST-LAUNCH-CHECKLIST.md` T+0 → T+30

## H. Exact rollback sequence

§2.19. Code: checkout previous SHA → rebuild → `up -d`. DB: `manage.sh restore <previous dump>`. Certs: restore previous pem → `compose restart nginx`. Monitoring: unchanged (loopback).

## I. Post-deployment verification

- 15 smoke checks (§2.20)
- 5 health/metrics endpoints (§2.21–2.25)
- k6 smoke + 100-VU gate (§2.26)
- Grafana dashboards populated; Alertmanager Slack delivered
- Daily backup cron produces a valid gzip at 02:00; verify script runs
- Registration + login + Razorpay test payment (test mode first, then `PAYMENT_MODE=live` after keys verified)

## J. Founder/provider actions required

1. Provision VPS + provide SSH access + register `id_ed25519.pub`
2. Provide the 15 founder secrets (§C)
3. Provide DNS control / point records
4. Provide Razorpay live keys (and switch `PAYMENT_MODE` from test→live only after smoke)
5. (Optional) Slack webhook, Sentry DSN, Twilio, OAuth keys

## K. What Claude can execute after VPS credentials are supplied

- Run `provision-vps.sh` + `verify-security.sh` on the host (no secrets needed)
- Generate `.env.production.local` from the schema (generated values only; founder keys remain placeholders/prompts)
- Run `deploy-vps.sh` end-to-end (it prompts for founder keys — secrets never stored in repo or chat logs beyond the VPS file)
- Execute smoke tests, k6 runs, health checks
- Verify monitoring, backups, and TLS issuance
- Execute rollback procedures if required

## L. What must NEVER be committed to Git

- `.env.production.local` (gitignored) — real secrets
- `infrastructure/nginx/ssl/*.pem` (gitignored) — real certificates
- Any file containing live Razorpay/AWS/AI/OAuth keys, JWTs, DB/Redis passwords
- `.env.production` must remain the placeholder template (tracked)
- Backup dumps (`backups/`), k6 results with real data, test credentials
- Policy: `docs/security/SECRETS-CHECKLIST.md` + `docs/deployment/GITHUB_SECRETS_MATRIX.md`

---

## Audit Findings (flagged, NOT changed — require founder approval)

| # | Finding | Impact | Recommendation |
|---|---|---|---|
| ~~F1~~ | ~~`deploy-vps.sh`, `backup-db.sh`, `manage.sh` default to `--env-file .env.production` (the **tracked template**) and `deploy-vps.sh` writes generated secrets into it~~ | ~~Overwrites tracked file on VPS → next `git pull` conflicts; risk of committing secrets~~ | ✅ **RESOLVED 2026-08-08** — all three scripts now default to `.env.production.local` with fail-fast guards; `deploy-vps.sh` refuses to overwrite an existing secrets file without confirmation; `docker-compose.prod.yml` `env_file:` entries point to `.env.production.local` |
| F2 | `PRODUCTION-RUNBOOK.md` compose section lists only 8 services (stale vs 12) and health endpoints under `/api/v1/` prefix | Wrong operational reference | Extended in this preparation (see §2.21 note); runbook updated separately if approved |
| F3 | Repo `.pem` files in `infrastructure/nginx/ssl/` are self-signed placeholders | nginx will serve invalid certs until Let's Encrypt runs | Expected — deploy-vps.sh replaces them; never commit real ones |

---

## DEPLOYMENT STATUS

**READY FOR VPS PROVISIONING**

**BLOCKERS:**
- VPS/SSH access
- production secrets
- live Razorpay credentials
- DNS
- TLS

No live deployment occurred during this task. ECS/Kubernetes untouched.
