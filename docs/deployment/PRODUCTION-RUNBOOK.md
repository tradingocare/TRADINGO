# TRADINGO Production Runbook

## Overview

This runbook covers the production deployment, operations, and incident response for the TRADINGO platform (v1.0.0 GA).

## Architecture

```
                     ┌─────────────┐
                     │   Nginx     │
                     │  :443/80    │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼──────┐ ┌───▼──────┐
       │  API Pods   │ │ Web Pods │ │  Workers │
       │  :3001      │ │ :3000    │ │  BullMQ  │
       └──────┬──────┘ └──────────┘ └──────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼──┐ ┌───▼──┐ ┌───▼──────┐
│Post│ │Redis│ │OpenSearch│
│greSQL│ │  :6379│ │  :9200   │
│ :5432 │ └──────┘ └──────────┘
└───────┘
```

## Deployment Architecture

### Docker Compose (Self-Hosted)
- **File**: `docker-compose.prod.yml`
- **Services**: postgres, redis, api, web, nginx, prometheus, postgres-exporter, grafana
- **Network**: tradingo-net (bridge)
- **Volumes**: postgres_data, redis_data, prometheus_data, grafana_data

### Kubernetes (Orchestrated)
- **Directory**: `ops/k8s/` (14 manifests)
- **Namespace**: tradingo
- **API**: 3 replicas, HPA (3-10), PDB (minAvailable=2)
- **Web**: 3 replicas, HPA (3-10), PDB (minAvailable=2)
- **PostgreSQL**: StatefulSet (single replica), PDB (minAvailable=1)
- **Redis**: Deployment with AOF persistence

### Resource Limits

| Service | CPUs | Memory |
|---------|------|--------|
| PostgreSQL | 2 | 2G |
| Redis | 1 | 512M |
| API | 2 | 1G |
| Web | 1 | 512M |
| Nginx | 1 | 256M |
| Prometheus | 1 | 512M |
| Postgres Exporter | 0.5 | 128M |
| Grafana | 1 | 512M |

## Health Endpoints

| Endpoint | Type | Auth | Dependencies | Expected Response |
|----------|------|------|-------------|-------------------|
| `GET /api/v1/live` | Liveness | None | None | `{"status":"ok","timestamp":"..."}` |
| `GET /api/v1/ready` | Readiness | None | PostgreSQL, Redis | `{"status":"ok","checks":{"database":"up","redis":"up"}}` |
| `GET /api/v1/health` | Full Health | None | PostgreSQL, Redis, OpenSearch | `{"status":"ok","checks":{"database":"up","redis":"up","opensearch":"up"}}` |

## Deployment Procedure

### Prerequisites
```bash
# Set production environment
export NODE_ENV=production
export DATABASE_URL=postgresql://...
export REDIS_URL=redis://...
export JWT_SECRET=<64-char-random>
export JWT_REFRESH_SECRET=<64-char-random>
```

### Docker Compose Deploy
```bash
# Build images
docker compose --env-file .env.production -f docker-compose.prod.yml build

# Apply database migrations
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Start all services
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# Verify health
curl http://localhost:3001/api/v1/health
```

### Kubernetes Deploy
```bash
# Create namespace and secrets
kubectl create namespace tradingo
kubectl apply -f ops/k8s/tradingo-namespace.yaml
kubectl apply -f ops/k8s/tradingo-secrets-template.yaml

# Build and push images
docker build -t tradingo-api:$(git rev-parse --short HEAD) -f apps/api/Dockerfile .
docker build -t tradingo-web:$(git rev-parse --short HEAD) -f apps/web/Dockerfile .
docker tag tradingo-api:$(git rev-parse --short HEAD) registry/tradingo-api:$(git rev-parse --short HEAD)
docker push registry/tradingo-api:$(git rev-parse --short HEAD)

# Override image tags in kustomize
cd ops/k8s
kustomize edit set image tradingo-api=registry/tradingo-api:$(git rev-parse --short HEAD)
kustomize edit set image tradingo-web=registry/tradingo-web:$(git rev-parse --short HEAD)

# Apply manifests
kubectl apply -k ops/k8s/
```

## Monitoring

### Prometheus
- **URL**: `http://localhost:9090`
- **Scrape targets**: API (:3001/metrics), PostgreSQL exporter (:9187)
- **Custom metrics**: `api_http_requests_total`, `api_http_request_duration_seconds`, `api_http_connections_active`

### Grafana
- **URL**: `http://localhost:3002`
- **Default admin**: admin/admin (change on first login)
- **Dashboards**: Pre-provisioned in `ops/monitoring/grafana/dashboards/`

### Sentry
- **DSN**: Configured via `SENTRY_DSN` env var
- **Environment**: `production`
- **Tracks**: API errors, performance traces

## Health Check Summary

| Check | Endpoint | Interval | Timeout | Failure Threshold |
|-------|----------|----------|---------|-------------------|
| API Liveness | `GET /api/v1/live` | 10s | 5s | 3 |
| API Readiness | `GET /api/v1/ready` | 5s | 3s | 3 |
| API Startup | `GET /api/v1/live` | 5s | 5s | 30 |
| Web Liveness | `GET /` | 10s | 5s | 3 |
| Web Readiness | `GET /` | 5s | 3s | 3 |
| Web Startup | `GET /` | 5s | 5s | 30 |
| Docker API | `curl /api/v1/health` | 30s | 10s | 3 |
| Docker Web | `curl /api` | 30s | 10s | 3 |

## Environment Variables

### Required (No Default)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — 64-char random string
- `JWT_REFRESH_SECRET` — 64-char random string
- `REDIS_URL` — Redis connection string
- `FRONTEND_URL` — Production frontend URL

### Required for Features
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — S3/SES access
- `OPENSEARCH_URL` / `OPENSEARCH_USERNAME` / `OPENSEARCH_PASSWORD` — Search
- `SENTRY_DSN` — Error tracking
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Payments
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` — SMS
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — Email
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` — OAuth
- `OPENROUTER_API_KEY` / `GEMINI_API_KEY` / `GROQ_API_KEY` / `TAVILY_API_KEY` / `FIRECRAWL_API_KEY` — AI

### Optional
- `NODE_ENV` (default: production)
- `PORT` (default: 3001 API, 3000 Web)
- `LOG_LEVEL` (default: info)
- `CLICKHOUSE_URL` — Analytics (optional)
- `SLACK_WEBHOOK_URL` — Alert notifications
- `CLAMAV_HOST` / `CLAMAV_PORT` — Malware scanning

## Backup & Recovery

### PostgreSQL Backup
```bash
# On backup host (cron: daily 2 AM)
pg_dump -h localhost -U tradingo tradingo | gzip > /backups/tradingo-$(date +%Y%m%d).sql.gz
aws s3 cp /backups/tradingo-$(date +%Y%m%d).sql.gz s3://tradingo-backups/database/
```

### PostgreSQL Restore
```bash
# Download latest backup
aws s3 cp s3://tradingo-backups/database/tradingo-$(date +%Y%m%d).sql.gz .
gunzip tradingo-$(date +%Y%m%d).sql.gz
psql -h localhost -U tradingo tradingo < tradingo-$(date +%Y%m%d).sql
```

### Redis Backup
```bash
# Trigger RDB save
redis-cli -a $REDIS_PASSWORD SAVE
# Backup RDB file
cp /data/dump.rdb /backups/redis-$(date +%Y%m%d).rdb
```

### Rollback
```bash
# Docker Compose
docker compose --env-file .env.production -f docker-compose.prod.yml down
# Revert to previous image tag
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# Database rollback (if migration reversible)
npx prisma migrate down
```
