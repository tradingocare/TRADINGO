# CI/CD Deployment Guide — TRADINGO

**Date:** 2026-08-31 (updated)
**Target platform:** GitHub Actions → Docker Compose → VPS (Ubuntu 24.04)
**Repo:** https://github.com/tradingocare/TRADINGO.git (branch main)

---

## 1. Architecture

`
┌─────────────── GitHub Actions ───────────────┐
│                                              │
│  PR → ci.yml           main → ci.yml          │
│                                              │
│  ci.yml: lint → typecheck → test → build     │
│                                              │
│  Manual: deploy-production.yml (workflow_dispatch) │
└──────────────┬───────────────────────────────┘
               ▼
        [Build Artifacts]
               │
               ▼
        VPS Deployment
        (docker compose)
        ──────────────────────────────────────
        Production Host: 200.141.15.162 (example)
        Services: postgres, redis, api, web, 
                  nginx, clamav, monitoring
`

### Production Stack

| Service | Port | Purpose |
|---------|------|---------|
| 
ginx | 80, 443 | Reverse proxy, TLS termination |
| pi | 3001 | NestJS API |
| web | 3000 | Next.js (standalone) |
| postgres | 5432 | PostgreSQL 16 |
| edis | 6379 | Redis 7 |
| clamav | 3310 | Malware scanning |
| prometheus | 9090 | Metrics |
| grafana | 3002 | Dashboards |

---

## 2. Workflow Map

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| ci.yml | push main/develop, PR → main | lint, typecheck, test, build |
| deploy-production.yml | manual workflow_dispatch | Build images + deploy to VPS |

### ci.yml Jobs

1. **lint-and-typecheck** — ESLint + TypeScript checks for API and Web
2. **test-api** — Jest tests with Postgres 16 + Redis 7 service containers
3. **test-web** — Next.js tests
4. **build** — Builds API and Web, uploads artifacts

### deploy-production.yml Jobs

1. **validate** — Confirms  deploy input and checks required secrets
2. **build-and-push** — Builds Docker images (template — requires registry configuration)
3. **deploy** — Deployment via SSH to VPS

---

## 3. Prerequisites (VPS Setup)

### 3.1 VPS Requirements
- Ubuntu 24.04 LTS
- Docker + Docker Compose v2
- SSH access with key-based authentication
- 2+ vCPU, 4+ GB RAM, 40+ GB storage

### 3.2 VPS Setup Steps

`ash
# 1. Clone repository
cd /home/tradingo
git clone https://github.com/tradingocare/TRADINGO.git
cd TRADINGO

# 2. Setup environment
cp .env.production.example .env.production.local
# Edit .env.production.local with real secrets

# 3. Pull latest
git pull origin main

# 4. Build & start
docker compose --env-file .env.production.local -f docker-compose.prod.yml build
docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d

# 5. Verify
curl -f https://api.tradingo.in/health
`

### 3.3 Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| VPS_HOST | Production VPS hostname or IP |
| VPS_SSH_KEY | SSH private key for VPS access |
| VPS_USERNAME | SSH username (default: ubuntu) |
| VPS_PORT | SSH port (default: 22) |
| DOCKER_REGISTRY | Docker registry URL (optional) |
| DOCKER_USERNAME | Registry username (optional) |
| DOCKER_PASSWORD | Registry password/token (optional) |

---

## 4. Deployment Walkthrough

### 4.1 CI Pipeline (Automatic)

Every push to main or develop, and every PR to main:

`
1. Checkout code
2. Setup pnpm 9.15.0
3. Install dependencies (frozen lockfile)
4. Lint API
5. Typecheck API
6. Typecheck Web
7. Test API (with Postgres + Redis services)
8. Test Web
9. Build API
10. Build Web
11. Upload artifacts
`

### 4.2 Production Deployment (Manual)

1. Go to GitHub Actions → Deploy Production → Run workflow
2. Enter confirm: deploy
3. Workflow validates secrets and executes deployment

**Or via VPS directly:**

`ash
# On the VPS
cd /home/tradingo/TRADINGO

# Pull latest code
git pull origin main

# Rebuild API (if API changed)
docker compose --env-file .env.production.local -f docker-compose.prod.yml build api

# Restart API
docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d --force-recreate --no-deps api

# Full restart (if needed)
docker compose --env-file .env.production.local -f docker-compose.prod.yml restart
`

### 4.3 Migration Handling

Migrations run automatically via the pi-migrate service:
- Runs as a one-shot container before API starts
- Uses prisma migrate deploy (idempotent)
- Controlled by PRISMA_MIGRATE_DISABLED env var

`ash
# Manual migration (if needed)
docker exec tradingo-api-migrate sh -c npx prisma migrate deploy
`

---

## 5. Service Dependency Order

`
postgres (healthy) ──────┐
                         ├──→ api-migrate ──→ api (healthy) ──→ web
redis (healthy) ─────────┤
clamav (healthy) ────────┘
`

The pi service waits for:
- pi-migrate to complete successfully
- postgres to be healthy
- edis to be healthy
- clamav to be healthy

---

## 6. Verification Steps After Deploy

`ash
# API health
curl -f https://api.tradingo.in/live
curl -f https://api.tradingo.in/ready

# Web
curl -f https://tradingo.in/

# Check containers
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs web
`

---

## 7. Rollback Procedure

`ash
# Identify previous image/tag
docker images | grep tradingo

# rollback to previous version
git checkout <previous-commit>
docker compose --env-file .env.production.local -f docker-compose.prod.yml build
docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d
`

---

## 8. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| API returns 502 | nginx can't reach api | Check docker compose logs api |
| Migrations failed | DB not ready | Ensure postgres healthy before api starts |
| Web shows old code | Cached chunks | docker compose up -d --force-recreate --no-deps web |
| ClamAV scan hangs | Memory pressure | Ensure 1GB+ RAM for clamav container |
| Redis connection refused | Redis not healthy | Check docker compose logs redis |

---

## 9. Related Documentation

| Document | Purpose |
|----------|---------|
| PRODUCTION-RUNBOOK.md | Day-to-day operations |
| PRODUCTION-DEPLOYMENT.md | Detailed deployment steps |
| TRADING-MASTER-AUDIT-FINAL-REMEDIATION.md | Security and technical findings |
| GITHUB_SECRETS_MATRIX.md | GitHub secret reference |
| TRADINGO-v1.0.0-GA-RELEASE.md | Release notes |

---

## 10. Architecture Notes

### What This Is NOT
- **NOT AWS ECS/Fargate** — that architecture was deprecated
- **NOT auto-deploy on merge** — production deploys are manual
- **NOT Kubernetes** — uses Docker Compose directly on VPS

### Why Docker Compose?
- Simple, reliable, well-understood
- Single host deployment (no orchestration overhead)
- All services on one VPS
- Manual operations with clear visibility

### Security Considerations
- All services except nginx are on private network (127.0.0.1)
- Database credentials come from .env.production.local (not in git)
- SSH key authentication required for GitHub Actions VPS access
- No auto-deployment prevents accidental production changes