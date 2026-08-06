# TRADINGO Deployment Pipeline

## Overview
Production-grade CI/CD pipeline for TRADINGO B2B Commerce Platform with zero-downtime deployments, automated testing, and rollback capabilities.

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR to main, push to main/develop | Lint, typecheck, unit tests, build, Docker build |
| `deploy.yml` | CI success on main | Build images, push ECR, deploy ECS Fargate, run migrations |
| `deploy-staging.yml` | Push to develop | Build images, deploy to staging ECS, smoke test |
| `deploy-production.yml` | Manual dispatch (`confirm=yes`) | Build images, deploy to production ECS, run migrations |
| `playwright.yml` | PR to main, push to main/develop | Run E2E tests with Playwright |

## Deployment Strategy

### ECS Fargate (Current)
- **Rolling Update**: `maxSurge=1, maxUnavailable=0` — zero-downtime
- **Health Checks**: Liveness `/live`, Readiness `/ready` — 30s interval, 5s timeout
- **Task Definitions**: API (512 CPU/1024 MB), Web (256 CPU/512 MB)
- **Secrets**: AWS SSM Parameter Store — no secrets in task definitions
- **Logging**: CloudWatch Logs with awslogs driver

### Kubernetes (Ready — Manual Apply)
- **Manifests**: `ops/k8s/` — namespace, deployments, services, HPA, ingress, ConfigMap
- **HPA**: CPU 70% / memory 80% — 3-10 replicas (API), 3-8 replicas (Web)
- **Ingress**: nginx-ingress with cert-manager (Let's Encrypt), rate limiting, CORS
- **Rolling Update**: maxSurge 1-2, maxUnavailable 0-1

## Docker Images

### API (`apps/api/Dockerfile`)
- Multi-stage: builder (pnpm install, prisma generate, build) → runner (dist only)
- Base: `node:20-alpine`, non-root user `tradingo:1001`
- Healthcheck: `curl -f http://localhost:3001/api/v1/health`
- Port: 3001

### Web (`apps/web/Dockerfile`)
- 3-stage: deps (pnpm install) → builder (next build) → runner (standalone)
- Base: `node:20-alpine`, non-root user `nextjs`
- Port: 3000, standalone output

## Database Migrations
- Prisma Migrate via ECS run-task (Fargate ephemeral task)
- Executed after API deployment, before traffic switch
- Rollback: `npx prisma migrate resolve --rolled-back <migration>` + PITR

## Monitoring
- **Prometheus**: Scrapes `/api/v1/metrics` every 15s
- **Grafana**: Provisioned dashboards at `ops/monitoring/grafana/dashboards/`
- **Alerting Rules**: 15 rules at `ops/monitoring/prometheus/alert-rules.yml`
- **Sentry**: Error tracking with DSN from secrets

## Rollback

| Method | Scope | RTO |
|--------|-------|-----|
| `kubectl rollout undo` | Kubernetes | < 2 min |
| `docker-compose down && up` | Docker Compose | < 3 min |
| `restore-pitr.sh` | Database | < 15 min |
| `dr-failover.sh` | Full DR | < 10 min |

See `ops/recovery/rollback.sh` for automated rollback scripts.

## Load Testing
- **k6 scripts**: `ops/load-testing/`
- **Smoke**: 1 VU, 30s — validate critical endpoints
- **Load**: 100/500 VU — buyer marketplace flow
- **Stress**: Ramp to 1000 VU — find breaking point
- **Thresholds**: p95 < 3s (load), p95 < 10s (stress), failure < 5%

## Infrastructure as Code

| Resource | Location |
|----------|----------|
| Docker Compose (dev) | `docker-compose.yml` |
| Docker Compose (prod) | `docker-compose.prod.yml` |
| Docker Compose (infra) | `infrastructure/docker-compose.yml` |
| Docker Compose (monitoring) | `infrastructure/docker-compose.monitoring.yml` |
| Kubernetes manifests | `ops/k8s/` |
| Nginx config | `infrastructure/nginx/` |
| ECS task definitions | `infrastructure/ecs/` |
| Prometheus config | `ops/monitoring/prometheus/` |
| Grafana dashboards | `ops/monitoring/grafana/dashboards/` |
| S3 lifecycle policy | `ops/backup/s3-lifecycle.json` |

## Quick Commands

```bash
# Build and start production stack
pnpm docker:build
pnpm docker:up:prod

# Run database migrations
pnpm db:migrate

# Run load tests
pnpm k6:smoke
pnpm k6:load
pnpm k6:stress

# Analyze bundle size
pnpm analyze

# Deploy to k8s
kubectl apply -k ops/k8s/
```
