# TRADINGO Staging Deployment Checklist

## Pre-Deployment

- [ ] All CI checks pass (lint, typecheck, test, build)
- [ ] `prisma validate` — schema is valid
- [ ] `prisma generate` — client is up to date
- [ ] `tsc --noEmit` passes for both API and Web
- [ ] `next build` completes without errors
- [ ] Docker build succeeds for both API and Web
- [ ] Changelog updated
- [ ] Version bumped in package.json
- [ ] Git tag created (vX.Y.Z-rc1)

## Database

- [ ] Backup taken before migration
- [ ] `prisma migrate deploy` runs without errors
- [ ] Rollback migration plan exists
- [ ] Seed data verified (categories, master data)

## Environment

- [ ] `.env` has all required variables (verify against `.env.example`)
- [ ] JWT secrets are strong 64-char random strings
- [ ] All secrets stored in AWS Secrets Manager / SSM Parameter Store
- [ ] `NODE_ENV=production` set
- [ ] `SENTRY_DSN` configured and enabled
- [ ] Monitoring stack configured (Prometheus targets, Grafana dashboards)

## Deployment

- [ ] AWS ECR repositories exist and are accessible
- [ ] Docker images pushed with git SHA tag
- [ ] ECS task definitions registered
- [ ] Blue/green deployment initiated
- [ ] Circuit breaker monitoring active

## Post-Deployment

- [ ] Health endpoint returns 200 (`/api/v1/live`, `/api/v1/ready`, `/api/v1/health`)
- [ ] Smoke test suite passes
- [ ] Can create RFQ and view products
- [ ] Frontend loads without console errors
- [ ] Sentry error rate normal (< 0.1%)
- [ ] Prometheus metrics flowing
- [ ] Grafana dashboards showing data
- [ ] Logs streaming to CloudWatch / ELK
- [ ] Database connections healthy (not exhausted)
- [ ] Redis cache working
- [ ] OpenSearch index healthy

## Rollback

- [ ] Previous ECS task definition available for rollback
- [ ] Database migration is reversible
- [ ] Rollback script tested
- [ ] Rollback triggers alert to #alerts channel
