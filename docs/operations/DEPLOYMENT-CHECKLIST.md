# Deployment Checklist

## Pre-Deployment
- [x] Build API: `pnpm build --filter api` ✅
- [x] Build Web: `pnpm build --filter web` ✅
- [x] TypeScript compile: `tsc --noEmit` both apps ✅
- [x] Prisma validate: `prisma validate` ✅
- [x] Prisma generate: `prisma generate` ✅
- [x] Next.js build: 284 routes ✅

## Infrastructure
- [x] Docker Compose (dev): `docker compose config` valid
- [x] Docker Compose (prod): `docker compose -f docker-compose.prod.yml config` valid
- [x] K8s manifests in `ops/k8s/` (14 manifests)
- [x] HPA configured for api + web
- [x] PDB configured for api + web + postgres
- [x] Pod anti-affinity configured
- [x] Resource limits set for all services

## CI/CD
- [x] GitHub Actions: `ci.yml` (lint + build + test)
- [x] GitHub Actions: `deploy-production.yml`
- [x] GitHub Actions: `deploy-staging.yml`
- [x] GitHub Actions: `deploy.yml`
- [x] Docker image versioning via kustomize

## Post-Deployment Verification
- [ ] Health check: `GET /api/v1/health`
- [ ] Liveness: `GET /live`
- [ ] Readiness: `GET /ready`
- [ ] Metrics: `:9100/metrics`
- [ ] Login flow functional
- [ ] Registration flow functional
- [ ] Razorpay payment flow functional
- [ ] Webhook delivery functional
- [ ] Email delivery functional (requires SMTP)
