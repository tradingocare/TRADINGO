# TRADINGO v1.0.0 — Rollback Procedure

**Date**: 2026-07-14
**Purpose**: Standard operating procedure for rolling back a production deployment.

---

## When to Rollback

Trigger rollback if any of these occur within 1 hour of deployment:

- **P0**: Auth/login is broken for all users
- **P0**: Core trade flow (RFQ→Quote→PO→Order) is non-functional
- **P0**: Database corruption or data loss detected
- **P1**: Error rate > 5% sustained for 10+ minutes
- **P1**: p99 latency > 5s sustained for 10+ minutes
- **P1**: Payment processing failures affecting > 1% of transactions

---

## Rollback Steps

### 1. Stop Deployment — Immediate Actions

```bash
# Stop new traffic from reaching the new version
# If using ECS:
aws ecs update-service --cluster tradingo-prod --service tradingo-api    --desired-count 0
aws ecs update-service --cluster tradingo-prod --service tradingo-web    --desired-count 0
aws ecs update-service --cluster tradingo-prod --service tradingo-worker --desired-count 0

# If using Docker Compose:
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### 2. Database Rollback

```bash
# Option A: Restore from backup (if schema migration was applied)
# Find the most recent pre-deployment backup
aws s3 ls s3://tradingo-backups/postgres/ | sort

# Download and restore
aws s3 cp s3://tradingo-backups/postgres/tradingo_20260713_235959.dump /tmp/
./scripts/backup/restore-postgres.sh /tmp/tradingo_20260713_235959.dump

# Option B: Rollback Prisma migration (if migration can be reversed)
# NOTE: Not all migrations are reversible. Prefer Option A.
npx prisma migrate resolve --rolled-back "<migration-name>"
```

### 3. Redeploy Previous Version

```bash
# Re-tag the previous Docker image as :latest
docker tag tradingo-api:1.0.0-rc1 tradingo-api:latest
docker tag tradingo-web:1.0.0-rc1 tradingo-web:latest

# Or pull from registry
docker pull registry.tradingo.io/tradingo-api:1.0.0-rc1
docker pull registry.tradingo.io/tradingo-web:1.0.0-rc1

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Verify Rollback

```bash
# Run smoke tests
bash scripts/deploy/smoke-test.sh https://api.tradingo.io/v1 https://tradingo.io

# Verify health
curl -f https://api.tradingo.io/v1/live
curl -f https://api.tradingo.io/v1/ready
curl -f https://api.tradingo.io/v1/health

# Verify frontend
curl -f https://tradingo.io/
```

### 5. Notify Team

```
Subject: [INCIDENT] Production rollback triggered
Version rolled back: v1.0.0 → v1.0.0-rc1
Time: YYYY-MM-DD HH:MM:SS UTC
Trigger reason: <reason>
Action taken: Database restored, previous images deployed
Smoke tests: PASS/FAIL
```

---

## Database Migration Rollback

### If migration was additive (new tables/columns only)

Additive migrations are non-destructive. The new code will simply not use the new schema elements:

```bash
# No action needed — just deploy previous API version
```

### If migration was destructive (column rename/drop)

```bash
# 1. Restore database from pre-deployment backup
./scripts/backup/restore-postgres.sh /backups/postgres/tradingo_20260713_235959.dump

# 2. Verify restore
psql -U tradingo -d tradingo -c "SELECT COUNT(*) FROM users;"
```

### If migration modified critical data

```bash
# 1. Stop all services
docker compose down

# 2. Restore database
./scripts/backup/restore-postgres.sh /backups/postgres/pre-deploy-backup.dump

# 3. Deploy previous version
docker compose up -d

# 4. Verify
bash scripts/deploy/smoke-test.sh
```

---

## Post-Rollback Tasks

- [ ] Incident report filed (root cause, impact, resolution)
- [ ] Database backup taken of the post-rollback state
- [ ] Monitoring dashboards reviewed for any lingering issues
- [ ] Affected users notified (if any)
- [ ] Fix scheduled in next release cycle
- [ ] Rollback procedure updated with lessons learned

---

## Testing Rollback Procedure

Test the rollback procedure in staging before every production deployment:

```bash
# 1. Note the current staging state
# 2. Deploy new version to staging
# 3. Execute rollback procedure
# 4. Verify staging returns to previous state
# 5. Run full smoke test suite
```

Document any issues discovered during rollback testing in this file.

---

## Contact

| Role | Person | Contact |
|------|--------|---------|
| SRE Lead | TBD | sre@tradingo.com |
| Backend Lead | TBD | backend@tradingo.com |
| Database Admin | TBD | dba@tradingo.com |
| Incident Response | TBD | incident@tradingo.com |
