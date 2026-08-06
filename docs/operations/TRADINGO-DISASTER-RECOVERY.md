# TRADINGO Disaster Recovery Plan

## Recovery Objectives

| Metric | Target | Measurement |
|--------|--------|-------------|
| **RPO** (Recovery Point Objective) | **≤ 5 minutes** | Max data loss measured in WAL segment lag |
| **RTO** (Recovery Time Objective) | **≤ 1 hour** | Time from incident declaration to full service restoration |
| **RTO — Full Database** | 30 min | pg_restore of latest full backup |
| **RTO — PITR** | 45 min | Full restore + WAL replay |
| **RTO — Full Stack** | 1 hour | DNS switch + app deployment + DB restore |
| **RTO — DR Failover** | 15 min | Cross-region failover with pre-warmed standby |

## Failure Scenarios & Response

### 1. Single Pod/Container Failure

**Impact:** Brief service degradation for one instance
**Response:** Kubernetes auto-healing / Docker restart policy
**RTO:** < 30 seconds
**Script:** None (self-healing)

### 2. Database Corruption (Schema/Data)

**Impact:** Query failures, incorrect data
**Response:** PITR to pre-corruption timestamp
**RTO:** 30-45 min
**Script:** `ops/backup/restore-pitr.sh "2026-07-15T14:30:00Z"`

**Procedure:**
```bash
# 1. Stop application (prevent writes)
kubectl scale deployment/api --replicas=0 -n tradingo

# 2. Identify target timestamp (just before corruption)
./ops/backup/restore-pitr.sh "2026-07-15T14:30:00Z"

# 3. Verify restored database
psql -d tradingo -c "SELECT COUNT(*) FROM \"Product\""

# 4. Resume application
kubectl scale deployment/api --replicas=3 -n tradingo
```

### 3. Primary Region Failure (AWS Region Outage)

**Impact:** Complete service unavailability
**Response:** DR failover to secondary region
**RTO:** 15 min
**Script:** `ops/recovery/dr-failover.sh --commit --region=eu-west-1`

**Procedure:**
```bash
# 1. Verify primary region is unreachable
curl -s --max-time 5 https://api.tradingo.com/health || echo "Primary down"

# 2. Execute DR failover (dry-run first)
./ops/recovery/dr-failover.sh --dry-run --region=eu-west-1
# Review output — confirm DR region has latest replicated backups

# 3. Commit failover
./ops/recovery/dr-failover.sh --commit --region=eu-west-1

# 4. Verify DR application health
curl -s https://api.tradingo.com/health
```

### 4. Accidental Data Deletion (Operator Error)

**Impact:** Lost records, potential compliance violation
**Response:** PITR to pre-deletion timestamp
**RTO:** 45 min
**Script:** `ops/backup/restore-pitr.sh`

### 5. Redis Data Loss

**Impact:** Session invalidation, cache miss storm
**Response:** Restore from latest RDB backup
**RTO:** 15 min

**Procedure:**
```bash
# 1. Download latest Redis backup
aws s3 cp s3://tradingo-backups/redis/tradingo-redis-latest.rdb.gz /tmp/

# 2. Decompress and replace Redis data
gunzip -c /tmp/tradingo-redis-latest.rdb.gz > /var/lib/redis/dump.rdb

# 3. Restart Redis
systemctl restart redis
```

### 6. Deployment Failure (Broken Release)

**Impact:** Application errors, partial rollback needed
**Response:** Rollback to previous stable version
**RTO:** 5 min (k8s), 10 min (Docker)
**Script:** `ops/recovery/rollback.sh`

**Procedure:**
```bash
# Kubernetes (auto-detected)
./ops/recovery/rollback.sh --dry-run    # Preview actions
./ops/recovery/rollback.sh              # Execute rollback

# Or target specific revision
./ops/recovery/rollback.sh --version=42

# Database rollback if migration was included
./ops/recovery/rollback.sh --type=database --version="10 minutes ago"
```

## Failback Procedure

After primary region is restored following a DR failover:

```bash
# 1. Verify primary region health
curl -s --max-time 10 https://api.ap-south-1.tradingo.internal/health

# 2. Execute failback (dry-run first)
./ops/recovery/dr-failback.sh --dry-run --primary-region=ap-south-1

# 3. Commit failback
./ops/recovery/dr-failback.sh --commit --primary-region=ap-south-1

# 4. Run restore test to verify data integrity
./ops/backup/restore-test.sh

# 5. Monitor for 1 hour
```

## Recovery Testing

| Test | Frequency | Success Criteria | Script |
|------|-----------|-----------------|--------|
| Backup integrity | Daily | `pg_restore --list` passes | Inline in backup script |
| Full restore drill | Weekly | Same table/row count as original | `restore-test.sh` |
| DR failover dry-run | Monthly | All steps executable without errors | `dr-failover.sh --dry-run` |
| Full DR exercise | Quarterly | Application serving traffic from DR region | `dr-failover.sh --commit` |
| Rollback drill | Monthly | Previous version serves traffic | `rollback.sh --dry-run` |

## Monitoring & Alerts

| Alert | Condition | Channel |
|-------|-----------|---------|
| Backup age > 26h | No full backup in 26 hours | Slack, PagerDuty |
| WAL archive lag > 10 min | Last WAL archived > 10 min ago | Slack |
| Restore test failure | `restore-test.sh` exits non-zero | Slack, PagerDuty |
| DR failover initiated | `dr-failover.sh` executed | Slack alert |
| Backup size anomaly | Backup > 20% deviation from 7-day avg | Slack |
| S3 sync failure | Cross-region replication delayed > 1h | Slack |

## Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| **Platform Engineer** | Maintain backup scripts, monitor backup health, execute recovery |
| **SRE (On-Call)** | Respond to backup alerts, triage failures, execute DR if needed |
| **Engineering Lead** | Approve failback after DR, coordinate post-mortem |
| **CTO/Founder** | Final decision on DR failover execution |

## Post-Recovery Checklist

- [ ] Verify all services operational (API, Web, Worker, WebSocket)
- [ ] Run data integrity check on critical tables (User, Company, Product, Wallet, Transaction)
- [ ] Verify search indices are in sync (OpenSearch)
- [ ] Verify Redis cache warming
- [ ] Check Sentry for error rate baseline
- [ ] Run smoke tests on critical buyer/seller workflows
- [ ] Document incident timeline and root cause
- [ ] Schedule post-mortem within 48 hours
