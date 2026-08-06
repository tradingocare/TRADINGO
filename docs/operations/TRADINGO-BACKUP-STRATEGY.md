# TRADINGO Backup Strategy

## Overview

Enterprise backup strategy covering PostgreSQL (primary database), Redis (cache/session), S3 (file storage), OpenSearch (search index), and ClickHouse (analytics). Designed for RPO ≤ 5 min and RTO ≤ 1 hour.

## Backup Inventory

| Component | Method | Schedule | Retention | Storage | RPO | RTO |
|-----------|--------|----------|-----------|---------|-----|-----|
| PostgreSQL Full | pg_dump custom (parallel) | Daily 02:00 UTC | 30d local, 90d S3 IA, 365d Glacier, 730d DEEP_ARCHIVE | S3 + local | N/A | 30 min |
| PostgreSQL WAL | Continuous archive | Every WAL segment (~1-5 min) | 7d DEEP_ARCHIVE, 90d total | S3 | 5 min | N/A |
| Redis RDB | SAVE + gzip | Every 6h | 14d S3 IA, 60d Glacier, 365d DEEP_ARCHIVE | S3 | 6h | 15 min |
| Redis AOF | appendfsync everysec | Continuous | Same as RDB | S3 | 1s | N/A |
| OpenSearch | Snapshot API | Daily | 14d S3 IA, 90d Glacier | S3 | 24h | 1h |
| ClickHouse | BACKUP TABLE | Daily | 30d | S3 | 24h | 2h |
| S3 Uploads | Cross-region replication | Real-time | 30d Glacier_IR, 730d DEEP_ARCHIVE | S3 CRR | Real-time | 1h |
| Application Config | env vars + k8s ConfigMap | Per deployment | Git history | GitHub + S3 | N/A | 5 min |

## Backup Scripts

All scripts in `ops/backup/`:

| Script | Purpose | Trigger |
|--------|---------|---------|
| `postgres-full-backup.sh` | Full pg_dump with S3 upload | Cron daily |
| `postgres-wal-archive.sh` | WAL segment archiving to S3 | PostgreSQL archive_command |
| `redis-backup.sh` | RDB snapshot + AOF backup to S3 | Cron every 6h |
| `restore-pitr.sh` | Point-in-time recovery from WAL + base backup | Manual |
| `restore-test.sh` | Weekly automated restore validation | Cron weekly |
| `cron-backup.sh` | Orchestrator dispatching daily/hourly/weekly jobs | Cron/systemd timer |
| `Dockerfile.backup` | Backup sidecar container image | Docker Compose |

## S3 Backup Lifecycle

See `ops/backup/s3-lifecycle.json` for full lifecycle rules that transition backups through storage classes over 2 years.

**S3 bucket:** `tradingo-backups` (separate from the app upload bucket `tradingo-uploads`)

## Redis Persistence

Configured in `ops/backup/redis/redis-persistence.conf` — dual RDB + AOF:
- **RDB:** Snapshots every 5 min (100+ key changes), every 60s (100+), every 300s (1+)
- **AOF:** `appendfsync everysec` — at most 1 second of data loss
- **AOF rewrite:** Auto-triggered at 100% growth past 64MB

## Backup Sidecar

`ops/backup/docker-compose.backup.yml` deploys a backup agent container with:
- `postgresql-client-15`, `redis-tools`, `awscli` pre-installed
- Cron daemon running daily full backup at 02:00 UTC
- Hourly WAL health check
- Weekly restore test (Sunday 03:00 UTC)
- Access to `postgres_data` and `redis_data` volumes (read-only)
- Healthcheck every 60s

## Backup Verification

| Check | Frequency | Method |
|-------|-----------|--------|
| pg_dump integrity | Every backup | `pg_restore --list` |
| Restore test | Weekly | Full restore to test DB, verify table/row counts |
| S3 lifecycle | Weekly | `aws s3api get-bucket-lifecycle-configuration` |
| WAL archive count | Hourly | Count WAL segments in S3 for today |
| Cross-region replication | Daily | Check DR region S3 has recent backups |

## Recovery Testing Schedule

- **Daily:** Automated integrity check on latest backup
- **Weekly (Sunday 04:00 UTC):** Full restore to test database, validate table/row counts (`restore-test.sh`)
- **Monthly (1st Saturday):** DR failover drill to secondary region (`dr-failover.sh --dry-run`)
- **Quarterly:** Full DR exercise with actual failover + failback

## Environment Variables

See `.env.example` section `BACKUP & DISASTER RECOVERY` for all required variables including `S3_BACKUP_BUCKET`, `BACKUP_RETENTION_DAYS`, `PG_DATABASE`, `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_TEST_DATABASE`, `WAL_RETENTION_HOURS`.
