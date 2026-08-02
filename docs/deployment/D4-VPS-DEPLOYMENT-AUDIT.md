# D4 — Hostinger VPS Production Deployment Audit

**Date:** 2026-07-28
**Target:** Hostinger KVM VPS (Ubuntu 24.04 LTS)
**Strategy:** Docker Compose (single VM)
**Domain:** tradingo.in

---

## Executive Summary

The existing TRADINGO deployment assets are **well-architected for VPS deployment**. The codebase already contains a complete Docker Compose production stack (`docker-compose.prod.yml`) with 12 services, comprehensive monitoring (Prometheus + Grafana + Alertmanager), a working deployment script (`deploy-vps.sh`), production Dockerfiles, Nginx reverse proxy configuration, Let's Encrypt SSL setup, automated database backups, and detailed production documentation.

**Verdict: READY WITH GAPS**

The deployment pipeline is ~75% VPS-ready. Work is needed for Hostinger-specific adjustments (Ubuntu 24.04 compatibility, resource tuning, port exposure strategy, monitoring hardening), but **no new services or architecture changes are required**. All core components — database, cache, application, reverse proxy, monitoring, backup — are already defined.

---

## 1. VPS Deployment Readiness Report

| Category | Status | Details |
|----------|--------|---------|
| Docker Engine | ✅ Ready | `deploy-vps.sh` installs via get.docker.com |
| Docker Compose | ✅ Ready | Plugin installed via docker-compose-plugin |
| PostgreSQL 16 | ✅ Ready | `postgres:16-alpine` image, healthcheck configured |
| Redis 7 | ✅ Ready | `redis:7-alpine` image with password auth + AOF persistence |
| API (NestJS) | ✅ Ready | Multi-stage Dockerfile, `HEALTHCHECK`, non-root user |
| Web (Next.js) | ✅ Ready | Multi-stage Dockerfile, `HEALTHCHECK`, standalone mode |
| Nginx Reverse Proxy | ✅ Ready | `nginx:1.27-alpine`, compression, security headers, WebSocket |
| SSL/TLS (Let's Encrypt) | ✅ Ready | `deploy-vps.sh` runs certbot, auto-renewal cron configured |
| Prometheus | ✅ Ready | Image with alert-rules.yml, recording-rules.yml |
| Grafana | ✅ Ready | Pre-provisioned datasource + dashboard provider |
| Alertmanager | ✅ Ready | Slack integration configured (needs webhook URL) |
| SMTP / Email | ✅ Ready via AWS SES | env vars wait for real AWS credentials |
| OAuth (Google/LinkedIn) | ⚠️ Config Only | Credentials needed from Google/LinkedIn dev consoles |
| SMS (Twilio) | ⚠️ Config Only | Account SID + Auth Token needed from Twilio |
| AI Provider Keys | ⚠️ Config Only | OpenRouter, OpenAI, Gemini, Groq, Tavily, Firecrawl keys needed |
| Sentry Error Tracking | ⚠️ Config Only | DSN placeholder — can start without |

### Unsupported by Current Stack

| Component | Required? | Gap |
|-----------|-----------|-----|
| OpenSearch 2.17 | Optional (search) | No service in `docker-compose.prod.yml` |
| ClickHouse | Optional (analytics) | Not included in compose stack |
| ClamAV | Optional (malware scanning) | Not in prod compose (exists in dev compose) |

**Impact:** These are optional. TRADINGO runs without OpenSearch (uses Prisma fallback), without ClickHouse (analytics degrade gracefully), and without ClamAV (file uploads work, no malware scanning). **No blocker.**

---

## 2. Existing Deployment Asset Reuse Report

### 2.1 Docker Compose Production Stack

**File:** `docker-compose.prod.yml` (307 lines, 12 services)

| Service | Image/Dockerfile | Reuse | Notes |
|---------|-----------------|-------|-------|
| `postgres` | `postgres:16-alpine` | ✅ Full reuse | PG16, healthcheck, resource limits |
| `redis` | `redis:7-alpine` | ✅ Full reuse | AOF enabled, password auth |
| `api` | `apps/api/Dockerfile` | ✅ Full reuse | Multi-stage builder→runner, non-root |
| `api-migrate` | `apps/api/Dockerfile` (target: migration) | ✅ Full reuse | One-shot migration container |
| `web` | `apps/web/Dockerfile` | ✅ Full reuse | Standalone Next.js output |
| `nginx` | `nginx:1.27-alpine` | ✅ Full reuse | SSL termination, reverse proxy |
| `prometheus` | `prom/prometheus:v2.55.0` | ✅ Full reuse | Pre-configured scrape + rules |
| `prometheus-postgres-exporter` | `prometheuscommunity/postgres-exporter:v0.16.0` | ✅ Full reuse | PG metrics |
| `grafana` | `grafana/grafana:11.3.0` | ✅ Full reuse | Auto-provisioned datasource |
| `alertmanager` | `prom/alertmanager:v0.27.0` | ✅ Full reuse | Slack alerts |
| `redis-exporter` | `oliver006/redis_exporter:v1.67.0` | ✅ Full reuse | Redis metrics |
| `node-exporter` | `prom/node-exporter:v1.8.2` | ✅ Full reuse | Host metrics |

### 2.2 Volumes

| Volume | Purpose | Reuse |
|--------|---------|-------|
| `postgres_data` | PG data persistence | ✅ Full reuse |
| `redis_data` | Redis AOF persistence | ✅ Full reuse |
| `prometheus_data` | TSDB storage | ✅ Full reuse |
| `grafana_data` | Dashboard/config persistence | ✅ Full reuse |

### 2.3 Networks

| Network | Driver | Reuse |
|---------|--------|-------|
| `tradingo-net` | bridge | ✅ Full reuse |

### 2.4 Dockerfiles

| File | Stages | Reuse |
|------|--------|-------|
| `apps/api/Dockerfile` | builder → migration → runner | ✅ Full reuse |
| `apps/web/Dockerfile` | deps → builder → runner | ✅ Full reuse |

### 2.5 Nginx Configuration

| File | Purpose | Reuse |
|------|---------|-------|
| `infrastructure/nginx/nginx.conf` | Main config (gzip, security headers, sendfile) | ✅ Full reuse |
| `infrastructure/nginx/sites/tradingo.conf` | Server blocks (HTTP→HTTPS, proxy to api:3001, web:3000, /ws/) | ⚠️ Needs domain/Hostinger IP | 
| `infrastructure/nginx/ssl/README.md` | SSL setup instructions | ✅ Full reuse |

### 2.6 Deployment Scripts

| File | Purpose | Reuse |
|------|---------|-------|
| `scripts/deploy/deploy-vps.sh` | Full automated deployment (479 lines) | ⚠️ Needs minor Hostinger tuning |
| `scripts/deploy/smoke-test.sh` | 8-endpoint health verification | ✅ Full reuse |
| `scripts/deploy/manage.sh` | Day-2 management (18 commands) | ✅ Full reuse |
| `scripts/deploy/backup-db.sh` | PostgreSQL dump + rotation | ✅ Full reuse |
| `scripts/deploy/secrets-template.sh` | Env template generator | ⚠️ Needs review |

### 2.7 Monitoring Stack

| File | Purpose | Reuse |
|------|---------|-------|
| `ops/monitoring/prometheus/prometheus.yml` | Scrape config (5 jobs) | ✅ Full reuse |
| `ops/monitoring/prometheus/alert-rules.yml` | 15 alert rules across 6 groups | ✅ Full reuse |
| `ops/monitoring/prometheus/recording-rules.yml` | SLO recording rules | ✅ Full reuse |
| `ops/monitoring/grafana/provisioning/datasources/prometheus.yml` | Prometheus datasource | ✅ Full reuse |
| `ops/monitoring/grafana/provisioning/dashboards/dashboards.yml` | Dashboard auto-provisioning | ✅ Full reuse |
| `ops/monitoring/grafana/dashboards/*.json` | 5 Grafana dashboards | ✅ Full reuse |
| `ops/monitoring/alertmanager.yml` | Slack alert routing | ✅ Full reuse |

### 2.8 Production Documentation

| File | Reuse |
|------|-------|
| `docs/deployment/VPS-DEPLOYMENT-GUIDE.md` | ✅ Full reuse (update provider name) |
| `docs/deployment/PRODUCTION-RUNBOOK.md` | ✅ Full reuse |
| `docs/deployment/GO-LIVE-CHECKLIST.md` | ✅ Full reuse |
| `docs/deployment/PRODUCTION-DEPLOYMENT.md` | ✅ Full reuse |
| `docs/deployment/DEPLOYMENT-CHECKLIST.md` | ✅ Full reuse |
| `docs/deployment/ROLLBACK-PROCEDURE.md` | ✅ Full reuse |
| `docs/deployment/ssl-config.md` | ⚠️ AWS-specific sections (update for certbot) |

---

## 3. Missing VPS Components

### Critical Gaps (Blockers)

| # | Component | Missing | Impact |
|---|-----------|---------|--------|
| 1 | OpenSearch | No service in prod compose | Search degrades to Prisma `contains` fallback — functional but limited |

### Significant Gaps (Should Fix Before Launch)

| # | Component | Missing | Impact |
|---|-----------|---------|--------|
| 1 | ClickHouse | Not in compose | Analytics module degrades gracefully |
| 2 | ClamAV | Not in prod compose | File uploads without malware scanning |
| 3 | `.env.production` values | 60% placeholder/empty | AI, SMS, OAuth, Maps features blocked |

### Minor Gaps (Post-Launch)

| # | Component | Missing | Impact |
|---|-----------|---------|--------|
| 1 | Log rotation policy | Docker json-file default (no max-size) | Logs grow unbounded |
| 2 | Docker daemon config | No `daemon.json` production tuning | Default logging, no registry mirrors |
| 3 | Systemd service | No docker-compose systemd unit | No auto-start on boot without Docker's built-in restart policy |

---

## 4. Deployment Sequence

```
Phase 1: VPS Provisioning (Hostinger)
├── Order KVM VPS (Ubuntu 24.04 LTS)
├── Configure DNS A records → VPS IP
└── Wait for DNS propagation

Phase 2: Server Hardening
├── SSH key-only auth (disable password)
├── Configure UFW (SSH+HTTP+HTTPS only)
├── Install Fail2Ban
├── Configure automatic security updates
├── Apply system tuning (sysctl + limits)
└── Install Docker Engine + Compose

Phase 3: Deploy TRADINGO Stack
├── Clone repository
├── Generate .env.production with real secrets
├── Deploy-vps.sh OR manual steps:
│   ├── docker compose -f docker-compose.prod.yml build
│   ├── docker compose -f docker-compose.prod.yml run --rm api-migrate
│   ├── docker compose -f docker-compose.prod.yml up -d
│   └── Run smoke tests

Phase 4: SSL & Domain
├── Obtain Let's Encrypt certificate
├── Configure Nginx SSL
├── Set up auto-renewal cron
└── Verify https://tradingo.in + https://api.tradingo.in

Phase 5: Verification
├── Smoke tests (8 endpoints)
├── Health check all services
├── Verify Grafana at :3002
└── Test pg_dump backup

Phase 6: Post-Launch
├── Configure remaining .env values (AI, OAuth, SMS, Maps)
├── Set up Sentry DSN
├── Configure Slack webhook for alerts
└── Establish monitoring
```

---

## 5. Docker Compose Validation

### docker-compose.prod.yml — 12 Services

| Check | Result |
|-------|--------|
| Valid YAML syntax | ✅ |
| All image references exist | ✅ |
| All build contexts exist | ✅ |
| All volume references match declarations | ✅ |
| All network references match declarations | ✅ |
| All `depends_on` services exist | ✅ |
| All env vars reference `.env.production` | ✅ |
| All healthcheck commands valid | ✅ |
| No duplicate ports | ✅ |
| Port conflicts | ⚠️ :3001 (api), :3000 (web), :5432 (postgres), :6379 (redis), :9090 (prometheus), :3002 (grafana), :9093 (alertmanager), :9187 (pgexporter), :9121 (redis-exporter), :9100 (node-exporter) — all exposed on host |
| Resource limits set | ✅ All services |
| Restart policies | ✅ Critical: `unless-stopped`, Migrate: `"no"` |

### Port Exposure Risk

**Issue:** All 12 services expose their ports to the host (`ports: "HOST:CONTAINER"`). Only nginx (`:80`, `:443`) should be public. Prometheus (`:9090`), Grafana (`:3002`), and other services should be internal-only or accessed via SSH tunnel.

**Recommendation:** Remove host port mappings for monitoring services (prometheus, grafana, alertmanager, pgexporter, redis-exporter, node-exporter). Access Grafana via SSH tunnel or restrict by UFW.

---

## 6. Port Mapping Report

| Service | Internal Port | Host Port | Should Be Public? |
|---------|--------------|-----------|-------------------|
| nginx | 80, 443 | 80, 443 | ✅ Yes |
| api | 3001 | 3001 | ❌ No (proxied by nginx) |
| web | 3000 | 3000 | ❌ No (proxied by nginx) |
| postgres | 5432 | 5432 | ❌ No (internal only) |
| redis | 6379 | 6379 | ❌ No (internal only) |
| prometheus | 9090 | 9090 | ❌ No (internal/SSH tunnel) |
| grafana | 3000 | 3002 | ❌ No (SSH tunnel or VPN) |
| alertmanager | 9093 | 9093 | ❌ No (internal only) |
| pgexporter | 9187 | 9187 | ❌ No (internal only) |
| redis-exporter | 9121 | 9121 | ❌ No (internal only) |
| node-exporter | 9100 | 9100 | ❌ No (internal only) |

**Action:** Remove host port mappings (or bind to `127.0.0.1`) for all services except nginx. This is already enforced by UFW in `deploy-vps.sh`, but defense-in-depth suggests removing host exposure entirely.

---

## 7. Volume Mapping Report

| Volume | Path in Container | Persistence | Backup Strategy |
|--------|------------------|-------------|-----------------|
| `postgres_data` | `/var/lib/postgresql/data` | ✅ Docker volume | pg_dump via backup-db.sh |
| `redis_data` | `/data` | ✅ Docker volume | RDB/AOF snapshot |
| `prometheus_data` | `/prometheus` | ✅ Docker volume | Prometheus snapshot |
| `grafana_data` | `/var/lib/grafana` | ✅ Docker volume | Grafana export |

### Bind Mounts (Host Files)

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `./infrastructure/nginx/nginx.conf` | `/etc/nginx/nginx.conf:ro` | Nginx config |
| `./infrastructure/nginx/sites` | `/etc/nginx/sites:ro` | Virtual hosts |
| `./infrastructure/nginx/ssl` | `/etc/nginx/ssl:ro` | SSL certs |
| `./ops/monitoring/prometheus` | `/etc/prometheus:ro` | Prometheus config |
| `./ops/monitoring/grafana/provisioning/datasources` | `/etc/grafana/provisioning/datasources:ro` | Grafana datasource |
| `./ops/monitoring/grafana/provisioning/dashboards` | `/etc/grafana/provisioning/dashboards:ro` | Grafana dashboards |
| `./ops/monitoring/alertmanager.yml` | `/etc/alertmanager/alertmanager.yml:ro` | Alertmanager config |
| `/:/host:ro,rslave` | Node exporter host path | Host metrics |

**Note:** The node-exporter bind mount (`/:/host:ro,rslave`) requires the host root filesystem to be accessible — this works on Linux but requires Docker Desktop permission on macOS/Windows. On Hostinger VPS (Ubuntu), this works natively.

---

## 8. SSL Readiness

| Component | Status | Details |
|-----------|--------|---------|
| Let's Encrypt certbot | ✅ Supported | `deploy-vps.sh` installs `certbot` + `python3-certbot-nginx` |
| Certificate request | ✅ Automated | `sudo certbot certonly --standalone -d tradingo.in -d www.tradingo.in -d api.tradingo.in` |
| Certificate placement | ✅ Scripted | Copies from `/etc/letsencrypt/live/tradingo.in/` → `infrastructure/nginx/ssl/` |
| Certificate fallback | ✅ Present | Self-signed fallback if Let's Encrypt unavailable |
| Auto-renewal | ✅ Configured | Certbot cron: `0 3 * * * root certbot renew --quiet --post-hook "docker compose ... restart nginx"` |
| Nginx SSL config | ✅ TLS 1.2/1.3 | `ssl_protocols TLSv1.2 TLSv1.3; ssl_ciphers HIGH:!aNULL:!MD5;` |
| HSTS | ✅ Configured | `max-age=31536000; includeSubDomains; preload` |
| Security headers | ✅ Configured | X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, Permissions-Policy |

**Pre-deployment requirement:** DNS A records must point to the Hostinger VPS IP before certbot can validate domain ownership.

**Gap:** Nginx config references `/etc/nginx/ssl/fullchain.pem` and `privkey.pem`. The `deploy-vps.sh` copies from Let's Encrypt live directory to these paths. Ensure the copy runs after certificate renewal (currently not in the renewal cron — only nginx restart).

---

## 9. Backup Readiness

| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL dump | ✅ Implemented | `pg_dump -U tradingo tradingo --clean --if-exists \| gzip` |
| Backup format | ✅ `.sql.gz` | Compressed SQL dump — compatible with `gunzip \| psql` restore |
| Backup frequency | ✅ Daily (2 AM) | Cron: `0 2 * * * /home/*/tradingo/scripts/deploy/backup-db.sh` |
| Retention | ✅ 30 days | `find ... -mtime +30 -delete` |
| Integrity check | ✅ Yes | `gzip -t` verification before declaring success |
| S3 off-site backup | ⚠️ Configured but blocked | Requires AWS credentials — `.env` has `S3_BACKUP_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| WAL archiving | ⚠️ Not implemented | `WAL_BACKUP_BUCKET` env var exists but no WAL archival script |
| Restore procedure | ✅ Documented | `manage.sh restore <file>` — gunzip → psql pipe |
| Test restore | ❌ Not verified | No documented test restore execution |

**Gap:** Off-site (S3) backup requires AWS credentials and has not been tested. Local disk backup is operational. S3 backup for WAL archive is not implemented.

---

## 10. Monitoring Readiness

| Component | Status | Details |
|-----------|--------|---------|
| Prometheus | ✅ Fully configured | 5 scrape jobs (api, web, postgres, redis, node), alert-rules.yml, recording-rules.yml |
| Grafana | ✅ Fully configured | Auto-provisioned Prometheus datasource, 5 dashboards (API, Database, Redis, Queue, Business) |
| Alertmanager | ✅ Configured | Slack integration — requires `SLACK_WEBHOOK_URL` |
| Prometheus Postgres Exporter | ✅ Configured | PG metrics at `:9187/metrics` |
| Redis Exporter | ✅ Configured | Redis metrics at `:9121/metrics` |
| Node Exporter | ✅ Configured | Host metrics at `:9100/metrics` |
| Alert Rules | ✅ 15 rules | API health/errors/latency, PG down/connections, disk/memory/CPU, disk usage, queue backlog |
| SLOs | ✅ Configured | Recording rules for error budget, P95/P99 latency |

**Gap:** Grafana dashboards exist as JSON files in `ops/monitoring/grafana/dashboards/` but are NOT wired into the provisioning system. The `dashboards.yml` provider is configured but there's no dashboard loader — dashboards must be manually imported via Grafana UI or a script. Fix: add a dashboard provisioning config pointing to the JSON files.

---

## 11. Production Security Checklist

| Category | Check | Status | Notes |
|----------|-------|--------|-------|
| **SSH** | Key-only authentication | ❌ Not configured | `deploy-vps.sh` doesn't configure SSH |
| **SSH** | Disable root login | ❌ Not configured | |
| **SSH** | Change default port | ❌ Not configured | Optional |
| **Firewall** | UFW configured | ✅ In script | `deploy-vps.sh` opens SSH, 80, 443 only |
| **Fail2Ban** | SSH brute force protection | ❌ Not installed | Not in `deploy-vps.sh` |
| **Updates** | Automatic security updates | ❌ Not configured | Not in script |
| **Docker** | Non-root user for containers | ✅ API only | API Dockerfile creates `tradingo` user; web uses `nextjs` |
| **Docker** | Read-only root filesystem | ❌ Not configured | Optional hardening |
| **Docker** | No privileged containers | ✅ Yes | No `privileged: true` |
| **Nginx** | Security headers | ✅ Configured | X-Frame-Options, X-Content-Type-Options, HSTS, etc. |
| **Nginx** | Hide nginx version | ✅ `server_tokens off` | |
| **Nginx** | Client max body size | ✅ 100M | |
| **Nginx** | SSL protocols | ✅ TLSv1.2 + TLSv1.3 | |
| **Application** | JWT auth with guards | ✅ Pre-existing | All controllers have AuthGuard/RolesGuard |
| **Application** | Rate limiting | ✅ Pre-existing | 131 controllers with @Throttle |
| **Application** | CSRF protection | ✅ Pre-existing | @fastify/csrf-protection registered |
| **Application** | Helmet CSP | ✅ Pre-existing | CSP with conditional unsafe-eval |
| **Secrets** | .env.production permissions | ✅ `chmod 600` | In `deploy-vps.sh` |
| **Secrets** | Real secrets (not placeholders) | ❌ Must be generated | deploy-vps.sh generates them; prompts for API keys |

### Gaps

1. **SSH key-only authentication** — must be configured manually on Hostinger
2. **Fail2Ban** — not in deployment script; should be added
3. **Automatic security updates** — not configured; `unattended-upgrades` package needed
4. **Docker daemon security** — no `daemon.json` for user namespace remapping, no live-restore

---

## 12. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `.env.production` has 60% placeholder values | HIGH | Use `deploy-vps.sh` which generates real secrets and prompts for API keys |
| No off-site backups (S3) | HIGH | Requires AWS credentials — configure post-launch |
| WAL archiving not implemented | MEDIUM | Point-in-time recovery not possible; acceptable for MVP |
| No Fail2Ban on VPS | MEDIUM | Manual install before deployment |
| Monitoring dashboards not auto-loaded | LOW | Manual Grafana import or add dashboard provisioning config |
| All monitoring ports exposed to host | LOW | UFW blocks them, but removing host ports is better |
| GraphQL subscription port exposure | LOW | Only if Chat/Notification modules use WebSocket at :3001 |
| No database connection pooling | LOW | PG max_connections handles current load; PgBouncer if scaling needed |
| No CDN for static assets | LOW | CloudFront not configured; acceptable for initial launch |

---

## 13. Implementation Plan

### Phase 1 — Hostinger VPS Setup (D4A)
**Estimated: 30 min**

- [ ] Order Hostinger KVM VPS (Ubuntu 24.04 LTS, 4 GB RAM / 2 vCPU / 80 GB SSD)
- [ ] Get VPS IP address
- [ ] Configure SSH key-based authentication (disable password login)
- [ ] Set hostname to `tradingo-prod`
- [ ] Configure DNS A records:
  - `tradingo.in` → VPS IP
  - `www.tradingo.in` → VPS IP
  - `api.tradingo.in` → VPS IP
- [ ] Wait for DNS propagation (5-30 min)

### Phase 2 — Server Hardening (D4B)
**Estimated: 15 min**

- [ ] SSH into VPS as root
- [ ] Create sudo user (not root) for daily operations
- [ ] Install Fail2Ban: `sudo apt-get install -y fail2ban`
- [ ] Configure automatic security updates: `sudo apt-get install -y unattended-upgrades`
- [ ] Install Docker Engine: `curl -fsSL https://get.docker.com | sudo sh`
- [ ] Install Docker Compose plugin: `sudo apt-get install -y docker-compose-plugin`
- [ ] Add user to docker group: `sudo usermod -aG docker $USER`
- [ ] Apply system tuning: `sudo tee /etc/sysctl.d/99-tradingo.conf` + `sudo sysctl --system`

### Phase 3 — Clone & Configure (D4C)
**Estimated: 10 min**

- [ ] Clone repository: `git clone git@github.com:anomalyco/tradingo.git ~/tradingo`
- [ ] `cd ~/tradingo`
- [ ] `chmod +x scripts/deploy/*.sh`
- [ ] Generate `.env.production`:
  - Option A: Run `bash scripts/deploy/deploy-vps.sh` (interactive, full automation)
  - Option B: Manual — run `generate_secrets()` section independently, fill API keys

### Phase 4 — Build & Deploy (D4D)
**Estimated: 15-20 min (build time)**

- [ ] Build images: `docker compose -f docker-compose.prod.yml build --parallel`
- [ ] Run migrations: `docker compose -f docker-compose.prod.yml run --rm api-migrate`
- [ ] Seed database: `docker compose -f docker-compose.prod.yml run --rm api-migrate npx prisma db seed`
- [ ] Start all services: `docker compose -f docker-compose.prod.yml up -d`
- [ ] Wait for healthy: `docker compose -f docker-compose.prod.yml ps`

### Phase 5 — SSL Certificate (D4E)
**Estimated: 5 min**

- [ ] Install certbot: `sudo apt-get install -y certbot python3-certbot-nginx`
- [ ] Obtain certificate:
  ```bash
  sudo certbot certonly --standalone --agree-tos --non-interactive \
    --email admin@tradingo.in \
    -d tradingo.in -d www.tradingo.in -d api.tradingo.in
  ```
- [ ] Copy to nginx ssl directory:
  ```bash
  sudo cp /etc/letsencrypt/live/tradingo.in/{fullchain,privkey}.pem infrastructure/nginx/ssl/
  sudo chmod 600 infrastructure/nginx/ssl/privkey.pem
  ```
- [ ] Restart nginx: `docker compose -f docker-compose.prod.yml restart nginx`
- [ ] Set up auto-renewal cron

### Phase 6 — Verification (D4F)
**Estimated: 5 min**

- [ ] Run smoke tests: `bash scripts/deploy/smoke-test.sh http://localhost:3001 http://localhost:3000`
- [ ] Verify: `curl https://tradingo.in/` returns 200
- [ ] Verify: `curl https://api.tradingo.in/api/v1/live` returns `{"status":"ok"}`
- [ ] Verify Grafana: `curl http://localhost:3002/api/health` (SSH tunnel)
- [ ] Verify Prometheus targets: `curl http://localhost:9090/api/v1/targets`
- [ ] Test backup: `bash scripts/deploy/backup-db.sh`

---

## Final Verdict

**READY WITH GAPS**

### Score: 75/100

| Category | Score | Notes |
|----------|-------|-------|
| Docker Compose | 95/100 | Complete 12-service stack; minor port exposure concern |
| Dockerfiles | 95/100 | Multi-stage, non-root, healthcheck — production quality |
| Nginx | 90/100 | Full reverse proxy + SSL + security headers; needs DNS for SSL |
| Deployment Scripts | 85/100 | Comprehensive deploy-vps.sh; missing Fail2Ban, unattended-upgrades |
| Monitoring | 80/100 | Full Prometheus+Grafana+Alertmanager stack; dashboards need manual import |
| Backup | 70/100 | Local pg_dump works; off-site S3 needs AWS creds; no WAL archiving |
| Security | 65/100 | Application security is strong; server hardening gaps (Fail2Ban, SSH config, auto-updates) |
| Documentation | 80/100 | VPS guide exists but references DigitalOcean; needs Hostinger adjustments |

### Key Actions Before Go-Live

1. **HIGH** — Generate real `.env.production` with all secrets (`deploy-vps.sh` does this)
2. **HIGH** — Configure DNS A records → Hostinger VPS IP (before SSL step)
3 **HIGH** — Obtain Let's Encrypt SSL certificate
4. **MEDIUM** — Install Fail2Ban and configure automatic security updates
5. **MEDIUM** — Remove host port mappings for monitoring services (defense-in-depth)
6. **MEDIUM** — Import Grafana dashboards (or wire up dashboard provisioning config)
7. **LOW** — Configure S3 backup once AWS credentials are available
8. **LOW** — Add Grafana dashboard JSON files to provisioning system

### Not Deploying (Per Instructions)

- No AWS ECS deployment (Terraform/ECS stays in repo for future enterprise scaling)
- No Kubernetes deployment
- No application feature changes
- No database schema changes
- No business logic modifications
