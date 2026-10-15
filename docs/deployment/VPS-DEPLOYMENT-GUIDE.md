# TRADINGO — VPS Deployment Guide

**Domain:** `tradingo.in`
**Provider:** DigitalOcean (or any Ubuntu 22.04+ VPS)
**Architecture:** Docker Compose (single VM)

---

## 1. Prerequisites

- [ ] DigitalOcean account (or any VPS provider)
- [ ] Domain `tradingo.in` with DNS management access
- [ ] Razorpay live account with API keys
- [ ] AWS account with SES + S3 permissions (or SMTP credentials)
- [ ] (Optional) AI provider API keys (OpenAI, OpenRouter, Gemini, Groq, Tavily, Firecrawl)
- [ ] (Optional) OAuth credentials (Google, LinkedIn)
- [ ] (Optional) Twilio SMS account
- [ ] (Optional) Google Maps API key
- [ ] (Optional) Sentry DSN for error monitoring

---

## 2. Provision VPS

**Recommended spec:** 4 GB RAM / 2 vCPU / 80 GB SSD

Create a **Droplet** (DigitalOcean):
1. **Distribution:** Ubuntu 22.04 LTS
2. **Plan:** Basic — $24/mo (4 GB / 2 vCPU / 80 GB SSD)
3. **Authentication:** SSH key (recommended) or password
4. **Hostname:** `tradingo-prod`

**Get the IP** (e.g., `192.0.2.10`), then configure DNS:

| Record | Type | Value |
|--------|------|-------|
| `@` (root) | A | `<VPS_IP>` |
| `www` | A | `<VPS_IP>` |
| `api` | A | `<VPS_IP>` |

*DNS propagation can take 5–30 minutes.*

---

## 3. Deploy (Automated)

SSH into your VPS and run:

```bash
# Clone the repo
git clone https://github.com/tradingocare/TRADINGO.git
cd tradingo

# Make scripts executable
chmod +x scripts/deploy/*.sh

# Run the deployment script
# It will prompt for API keys interactively
bash scripts/deploy/deploy-vps.sh
```

### What the script does:

| Step | Description |
|------|-------------|
| 1. Prerequisites | Verifies OS, sudo access |
| 2. System deps | Installs Docker, Docker Compose, certbot, tools |
| 3. Firewall | Opens SSH/HTTP/HTTPS only |
| 4. Repo setup | Clones/pulls latest code |
| 5. Secrets | Generates random passwords + prompts for API keys |
| 6. SSL | Obtains Let's Encrypt certificate for tradingo.in |
| 7. Build & deploy | Builds images, runs migrations, starts all services |
| 8. Smoke tests | Verifies 8 endpoints (live/ready/health/API/UI) |
| 9. Auto-renewal | Configures SSL cert auto-renewal |
| 10. Backup cron | Sets up daily 2 AM database backup |
| 11. System tuning | Applies production sysctl / file descriptor tuning |

---

## 4. Manual Deployment Steps

If you prefer to run steps individually:

```bash
# Generate secrets first
bash scripts/deploy/deploy-vps.sh
# Or set env vars to skip prompts:
export DOMAIN=tradingo.in
export RAZORPAY_KEY_ID=rzp_live_xxx
export RAZORPAY_KEY_SECRET=xxx
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
bash scripts/deploy/deploy-vps.sh
```

---

## 5. Post-Deployment Verification

```bash
# Check all services
docker compose --env-file .env.production.local -f docker-compose.prod.yml ps

# View logs
docker compose --env-file .env.production.local -f docker-compose.prod.yml logs -f

# Run smoke tests
bash scripts/deploy/smoke-test.sh http://localhost:3001 http://localhost:3000
```

### Health endpoints:

| Endpoint | Expected | Purpose |
|----------|----------|---------|
| `https://api.tradingo.in/api/v1/live` | `{"status":"ok"}` | Liveness check |
| `https://api.tradingo.in/api/v1/ready` | 200 | Readiness (PG + Redis) |
| `https://api.tradingo.in/api/v1/health` | 200 | Full health |
| `https://tradingo.in/` | 200 | Frontend homepage |

---

## 6. Day-2 Configuration

After the base deployment is running, configure these services in `.env.production.local`:

### Required for core features:

| Feature | Env Variables | Source |
|---------|--------------|--------|
| **Email (SES)** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | AWS IAM |
| **Payments** | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard |
| **SMS** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Twilio Console |

### Required for AI features:

| Feature | Env Variables | Source |
|---------|--------------|--------|
| **AI Gateway** | `OPENROUTER_API_KEY` (primary) | OpenRouter.ai |
| **AI Fallback** | `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` | Respective providers |
| **Search** | `TAVILY_API_KEY` | Tavily API |
| **Scraping** | `FIRECRAWL_API_KEY` | Firecrawl.dev |

### Required for social login:

| Feature | Env Variables | Source |
|---------|--------------|--------|
| **Google OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| **LinkedIn OAuth** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | LinkedIn Developer |

### Optional:

| Feature | Env Variables |
|---------|--------------|
| **Error tracking** | `SENTRY_DSN` |
| **Maps** | `GOOGLE_MAPS_API_KEY` |
| **Alerts** | `SLACK_WEBHOOK_URL` |
| **Analytics** | `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD` |
| **OpenSearch** | `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD` |

After updating `.env.production.local`:

```bash
docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d
```

---

## 7. Management Commands

```bash
# Deploy latest code (pull + build + migrate + restart)
bash scripts/deploy/manage.sh deploy

# View logs
bash scripts/deploy/manage.sh logs          # all services
bash scripts/deploy/manage.sh logs api      # specific service

# Restart services
bash scripts/deploy/manage.sh restart       # all
bash scripts/deploy/manage.sh restart api   # specific

# Database
bash scripts/deploy/manage.sh migrate       # run migrations
bash scripts/deploy/manage.sh seed          # seed data
bash scripts/deploy/manage.sh backup        # manual backup
bash scripts/deploy/manage.sh restore backups/tradingo-20240725.sql.gz

# Monitoring
bash scripts/deploy/manage.sh health        # run smoke tests
bash scripts/deploy/manage.sh status        # service status
bash scripts/deploy/manage.sh env           # environment summary

# Debug
bash scripts/deploy/manage.sh psql           # PostgreSQL shell
bash scripts/deploy/manage.sh redis-cli      # Redis CLI
bash scripts/deploy/manage.sh shell api      # shell into container

# Maintenance
bash scripts/deploy/manage.sh cleanup        # prune unused images/volumes
```

---

## 8. Monitoring

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | `http://127.0.0.1:3002` via SSH tunnel | `admin` / auto-generated |
| **Prometheus** | `http://127.0.0.1:9090` via SSH tunnel | (internal) |
| **Alertmanager** | `http://127.0.0.1:9093` via SSH tunnel | (internal) |

---

## 9. SSL Renewal

Certificates auto-renew daily at 3 AM via cron. To manually renew:

```bash
sudo certbot renew --quiet --post-hook "docker compose --env-file .env.production.local -f docker-compose.prod.yml restart nginx"
```

---

## 10. Rollback

If a deployment fails:

```bash
# Rollback to previous Docker image
docker compose --env-file .env.production.local -f docker-compose.prod.yml pull
docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d

# Database rollback (if migration caused issues)
bash scripts/deploy/manage.sh restore backups/tradingo-<PREVIOUS_DATE>.sql.gz
```

See `ROLLBACK-PROCEDURE.md` for detailed rollback steps.

---

## 11. Post-Launch Checklist

Run through `docs/operations/POST-LAUNCH-CHECKLIST.md` after deployment for T+0, T+1h, T+24h, T+7d, and T+30d checks.

---

## 12. Production Releases via GitHub Actions

Releases run from the `main` branch only through `.github/workflows/deploy-production.yml`
(manual `workflow_dispatch`). The workflow builds images on the VPS itself; no
registry is involved.

### 12.1 Main-only policy

- The workflow **fails closed unless it runs from `refs/heads/main`**. A dispatch
  launched from any other branch's copy of the file stops before any secret is
  touched or any SSH connection is opened.
- The release tracks **`origin/main` only**. The exact SHA is resolved on the VPS
  at deploy time (`git rev-parse origin/main`); operator-supplied branches, tags
  and SHAs are not accepted.
- There is no push trigger. Every release needs the typed `deploy` confirmation.
  NOTE (verified 2026-10-13): the `production` environment currently has **no
  required reviewers**, so its gate resolves immediately — effective approval
  is dispatch permission (write access) plus the typed confirmation. This is
  NOT two-person review. To restore a reviewer checkpoint, add an eligible
  reviewer under Settings → Environments → `production` (founder decision;
  weigh self-review protection for single-account operation).

### 12.2 Required secrets (production environment, names only)

| Secret | Required | Purpose / default |
|--------|----------|-------------------|
| `VPS_HOST` | yes | VPS hostname. No default. |
| `VPS_SSH_KEY` | yes | Private Ed25519 deployment key for the `tradingo` user. No default. |
| `VPS_KNOWN_HOSTS` | yes | Verified `known_hosts` line(s) for the VPS (see 12.3). No default. |
| `VPS_PORT` | no | SSH port. Defaults to `22`. |
| `VPS_USER` | no | Deployment user. Defaults to `tradingo` (least privilege; do not use `root`). |
| `VPS_APP_DIR` | no | Repo checkout on the VPS. Defaults to `/home/tradingo/tradingo`. |

Set them under repository Settings → Secrets and variables → Actions →
**Environment secrets** for the `production` environment (not repository
secrets), so they are only exposed to runs using that environment.
Values are never printed by the workflow; verification steps report
`configured` / `MISSING` names only.

### 12.3 Provisioning and verifying `VPS_KNOWN_HOSTS`

The workflow performs **no runtime `ssh-keyscan` discovery** (trust-on-first-use
against an unauthenticated peer is forbidden). The founder provisions the pinned
host keys once, through a trusted channel:

1. From a trusted machine/network, collect the VPS host keys:
   `ssh-keyscan -t ed25519 -p 22 srv1889262.hstgr.cloud`
2. **Verify out-of-band before trusting:** compare the key fingerprint against an
   independent source — the Hostinger control panel (hPanel shows the server's
   SSH fingerprint), a second network, or a previously recorded value from a
   trusted session. If the two sources disagree, STOP and investigate; do not
   store the key.
3. Store the full verified `known_hosts` line(s) (unhashed form, `host keytype
   base64...`) as the `VPS_KNOWN_HOSTS` environment secret. One line per key
   type present; do not invent, truncate, or hand-edit key material.
4. Rotate the secret the same way if the VPS is rebuilt or its host keys change
   (SSH will then fail closed with a host-key mismatch instead of connecting).

### 12.4 Release and rollback behavior

- Order on the VPS: fetch → pin SHA → record previous SHA → **untracked-collision
  preservation gate** (`scripts/deploy/checkout-preservation.sh`, read from the
  target release) → checkout → pre-deploy DB backup → build `api` + `web`
  (compose project `tradingo-prod`) → exit-gated `api-migrate` → recreate
  `api` + `web` → `smoke-test.sh` against localhost.
- The preservation gate relocates untracked files that collide with new target
  paths into a unique timestamped recovery directory outside the repository
  (`<app-dir>-recovery/untracked-<UTC-timestamp>-<PID>/`, mode 700), verifies
  every copy by hash, and only then clears the sources. Any failure aborts
  **before checkout** with the working tree untouched. Ignored files that
  collide (secrets/certificates) abort the run for manual resolution.
- A failed backup logs a loud warning and continues **only** under the policy
  documented in the workflow header (operator must confirm a known-good backup
  exists). A failed migration or failed smoke test stops the rollout with
  containers untouched (migrate) or explicitly reported (health).
- Rollback is always manual using the previous SHA printed by the failed run;
  database restore is a separate deliberate decision (migrations are
  forward-only). Full procedure: `docs/deployment/ROLLBACK-PROCEDURE.md`.
