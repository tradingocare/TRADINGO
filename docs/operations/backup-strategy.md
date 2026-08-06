# TRADINGO Backup & Disaster Recovery Strategy

## 1. PostgreSQL Database

### Daily Full Backups
- **Schedule**: Every day at 02:00 UTC
- **Tool**: `pg_dump` via cron job on the bastion host
- **Retention**: 30 days locally, 90 days in S3
- **Encryption**: AES-256 at rest (S3-SSE), TLS in transit
- **Storage**: `s3://tradingo-backups/postgres/daily/`
- **Verification**: Automated restore test on a staging RDS instance after each backup

### WAL Archiving (Point-in-Time Recovery)
- **Method**: Continuous archiving of WAL segments to S3 (every 5 minutes)
- **Tool**: `pg_receivewal` + `wal-g` or `pgbackrest`
- **RPO**: 5 minutes
- **Retention**: 7 days of WAL segments in `s3://tradingo-backups/postgres/wal/`
- **PITR Capability**: Ability to restore to any point within the retention window
- **Storage**: `s3://tradingo-backups/postgres/wal/`

### RDS Automated Backups
- **Backup retention**: 35 days
- **Backup window**: 01:00-02:00 UTC
- **Multi-AZ**: Automatic failover with synchronous standby
- **Manual snapshots**: Before every production deployment

### Restore Procedures
```bash
# Full restore from latest backup
pg_restore -d tradingo_prod -h <target-host> -U tradingo \
  --jobs=8 --verbose --clean --if-exists \
  s3://tradingo-backups/postgres/daily/tradingo_YYYYMMDD.sql.gz

# PITR restore to a specific timestamp
pgbackrest --stanza=tradingo --type=time \
  --target="2026-06-14 14:30:00 UTC" --target-action=promote restore
```

## 2. Redis

### RDB Snapshots
- **Frequency**: Every 5 minutes if at least 100 keys changed
- **Configuration**: `save 300 100` in redis.conf
- **Storage**: Local disk + replicated to S3 every hour
- **Path**: `/var/lib/redis/dump.rdb`

### AOF Persistence
- **Mode**: `appendfsync everysec`
- **Rewrite**: Auto-triggered at 100% growth (auto-aof-rewrite-percentage 100)
- **AOF file**: `/var/lib/redis/appendonly.aof`

### Backup to S3
```bash
# RDB backup
aws s3 cp /var/lib/redis/dump.rdb \
  s3://tradingo-backups/redis/rdb/redis_$(date +%Y%m%d_%H%M).rdb

# AOF backup
aws s3 cp /var/lib/redis/appendonly.aof \
  s3://tradingo-backups/redis/aof/redis_aof_$(date +%Y%m%d_%H%M).aof
```

### Restore
```bash
# From RDB
aws s3 cp s3://tradingo-backups/redis/rdb/redis_20260614_0200.rdb /var/lib/redis/dump.rdb
redis-cli shutdown && redis-server

# From AOF (point-in-time)
aws s3 cp s3://tradingo-backups/redis/aof/redis_aof_20260614_0200.aof /var/lib/redis/appendonly.aof
redis-cli shutdown && redis-server --appendonly yes
```

## 3. File Uploads (S3 Asset Replication)

### Cross-Region Replication (CRR)
- **Source Bucket**: `tradingo-assets-prod-ap-south-1`
- **Destination Bucket**: `tradingo-assets-prod-eu-west-1`
- **Replication Scope**: Full bucket (all prefixes)
- **Storage Class**: Standard → Standard-IA in destination
- **Sync Frequency**: Real-time (S3 CRR) + daily batch sync as failsafe

### Daily Batch Sync
```bash
aws s3 sync s3://tradingo-assets-prod-ap-south-1 \
  s3://tradingo-assets-backup-eu-west-1 \
  --delete --exclude "*.tmp"
```

## 4. Retention Policy

| Backup Type | Daily | Weekly | Monthly | Yearly |
|-------------|-------|--------|---------|--------|
| PostgreSQL full | 30 days | 12 weeks | 12 months | 7 years |
| PostgreSQL WAL | 7 days | - | - | - |
| Redis RDB | 30 days | 12 weeks | 12 months | - |
| Redis AOF | 7 days | - | - | - |
| S3 Assets | 30 days (versioning) | - | - | - |
| OpenSearch snapshots | 14 days | 8 weeks | 6 months | - |
| EBS snapshots | 7 days | 4 weeks | 3 months | - |

## 5. Disaster Recovery

### Recovery Objectives
- **RPO (Recovery Point Objective)**: 5 minutes
- **RTO (Recovery Time Objective)**:
  - Critical services (trading engine, auth): 1 hour
  - Core services (API, Web, Orders): 2 hours
  - Full platform recovery: 4 hours
  - Data analytics / reporting: 8 hours

### Recovery Tiers

| Tier | Services | RTO | Priority |
|------|----------|-----|----------|
| Tier 0 | Trading Engine, Auth, Redis | 1 hour | Critical |
| Tier 1 | API, Web, PostgreSQL | 2 hours | High |
| Tier 2 | Notifications, WebSocket | 3 hours | Medium |
| Tier 3 | Analytics, Reporting, Admin | 8 hours | Low |

### Cross-Region Failover

**Primary Region**: `ap-south-1` (Mumbai)
**Secondary Region**: `eu-west-1` (Ireland)

#### Failover Steps
1. Route53 DNS failover → update health checks to secondary region
2. Promote RDS read replica in secondary region to primary
3. Scale up ECS services in secondary region from min=0 to desired count
4. Verify CloudFront origin is pointing to secondary ALB
5. Validate all services via health check endpoints
6. Update monitoring stack to point to secondary region endpoints

#### Failback Steps
1. Once primary region is operational, re-establish RDS replication
2. Sync assets back to primary S3 bucket
3. Switch Route53 to primary region
4. Verify zero data loss
5. Document incident in post-mortem

### Regional Architecture
```
                          AWS Global
                     ┌──────────────────┐
                     │   Route53 /      │
                     │   CloudFront     │
                     │   WAF            │
                     └──────┬───────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
     ┌────────┴────────┐       ┌─────────┴────────┐
     │  ap-south-1     │       │  eu-west-1       │
     │  (Primary)      │       │  (Secondary)     │
     │                 │       │                  │
     │  ┌───────────┐  │       │  ┌───────────┐   │
     │  │ ECS + ALB │  │       │  │ ECS + ALB │   │
     │  ├───────────┤  │       │  ├───────────┤   │
     │  │ RDS (P)   │◄─┼───────┼──┤ RDS (R)   │   │
     │  ├───────────┤  │       │  ├───────────┤   │
     │  │ Redis (P) │  │       │  │ Redis (R) │   │
     │  ├───────────┤  │       │  ├───────────┤   │
     │  │ S3 Assets │──┼───────┼──┤ S3 Backup │   │
     │  └───────────┘  │       │  └───────────┘   │
     └─────────────────┘       └──────────────────┘
```

## 6. Backup Testing

### Monthly Restore Drill
- **Schedule**: First Saturday of every month, 06:00 UTC
- **Scope**: Full restore of PostgreSQL + Redis to a test environment
- **Procedure**:
  1. Provision temporary RDS instance from latest backup
  2. Load Redis RDB snapshot
  3. Run data integrity checks
  4. Run query performance benchmarks
  5. Verify application connectivity
  6. Tear down test environment
  7. Document results and any issues

### Quarterly DR Exercise
- **Schedule**: First weekend of every quarter
- **Scope**: Full cross-region failover simulation
- **Procedure**:
  1. Announce DR exercise (internal comms)
  2. Execute failover to secondary region
  3. Run full smoke test suite (15 minutes)
  4. Run load test at 25% of peak traffic (30 minutes)
  5. Fail back to primary region
  6. Verify no data loss
  7. Publish DR exercise report

## 7. Monitoring & Alerts

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Backup age | > 24 hours since last successful backup | Critical |
| WAL archive lag | > 10 minutes since last WAL upload | Warning |
| RDS replication lag | > 300 seconds | Critical |
| S3 replication status | `ReplicationLatency` > 15 minutes | Warning |
| Backup restore test | Test failure | Critical |
| EBS snapshot age | > 7 days without snapshot | Warning |

## 8. Tools & Scripts

### Required Tools
- `pg_dump` / `pg_restore` (PostgreSQL 16.x)
- `pgbackrest` or `wal-g` (WAL archiving)
- `aws-cli` v2.x
- `redis-cli` 7.x
- Custom Python scripts in `scripts/backup/`

### Backup Directory Structure
```
scripts/backup/
├── postgres_full_backup.sh   # Daily full backup
├── postgres_wal_archive.sh   # Continuous WAL archiving
├── redis_backup.sh           # RDB + AOF backup
├── restore_test.sh           # Monthly restore drill
├── dr_failover.sh            # Cross-region failover
└── dr_failback.sh            # Cross-region failback
```
