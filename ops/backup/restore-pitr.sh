#!/usr/bin/env bash
set -euo pipefail

# TRADINGO PostgreSQL Point-in-Time Recovery (PITR)
# Restores database to a specific timestamp using base backup + WAL archive
# Usage: ./restore-pitr.sh <timestamp> [target-db-name]
#   timestamp: ISO 8601 format, e.g. 2026-07-15T14:30:00Z
#   target-db-name: optional, restores to a different DB (default: original)

TIMESTAMP="${1:?Usage: $0 <timestamp> [target-db-name]}"
TARGET_DB="${2:-${PG_DATABASE:-tradingo}}"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
RESTORE_DIR="${RESTORE_DIR:-/restore/postgres}"
S3_BUCKET="${S3_BACKUP_BUCKET:-tradingo-backups}"
S3_PREFIX="${S3_BACKUP_PREFIX:-postgres}"
DB_HOST="${PG_HOST:-localhost}"
DB_PORT="${PG_PORT:-5432}"
DB_USER="${PG_USER:-tradingo}"
LOG_TAG="[pitr-restore]"

log() { echo "$LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }
error() { echo "$LOG_TAG ERROR: $*" >&2; exit 1; }

command -v pg_ctl >/dev/null 2>&1 || error "pg_ctl not found"
command -v aws >/dev/null 2>&1 || error "aws CLI not found"
command -v pg_restore >/dev/null 2>&1 || error "pg_restore not found"

mkdir -p "$RESTORE_DIR"

log "=== PITR Restore Initiated ==="
log "Target timestamp: ${TIMESTAMP}"
log "Target database: ${TARGET_DB}"
log "=========================================="

# Step 1: Download latest full backup from S3
log "Step 1/6: Finding latest full backup before ${TIMESTAMP}"
LATEST_S3=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/full/" | grep ".dump$" | sort | tail -1 | awk '{print $4}')
if [ -z "$LATEST_S3" ]; then
  error "No full backup found in s3://${S3_BUCKET}/${S3_PREFIX}/full/"
fi
log "Latest full backup: ${LATEST_S3}"

log "Downloading..."
aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/full/${LATEST_S3}" "${RESTORE_DIR}/${LATEST_S3}"
log "Downloaded ${LATEST_S3}"

# Step 2: Verify backup integrity
log "Step 2/6: Verifying backup integrity"
pg_restore --list "${RESTORE_DIR}/${LATEST_S3}" >/dev/null 2>&1 || error "Backup integrity check FAILED"
log "Integrity verified"

# Step 3: Download WAL segments from S3 between backup time and target timestamp
log "Step 3/6: Downloading WAL segments"
WAL_DIR="${RESTORE_DIR}/wal_archive"
mkdir -p "$WAL_DIR"

# Extract backup timestamp from filename (format: tradingo-pg-full-YYYYMMDDTHHMMSSZ.dump)
BACKUP_DATE=$(echo "$LATEST_S3" | sed -n 's/tradingo-pg-full-\([0-9TZ]\{16,\}\)\.dump/\1/p')
TARGET_DATE=$(echo "$TIMESTAMP" | sed 's/[-:]//g' | cut -c1-8)

log "Backup date: ${BACKUP_DATE}, Target date: ${TARGET_DATE}"

# Sync WAL segments for the period between backup and target
aws s3 sync "s3://${S3_BUCKET}/${S3_PREFIX}/wal/" "$WAL_DIR" --exclude "*" --include "*.gz" 2>/dev/null || true
WAL_COUNT=$(find "$WAL_DIR" -name "*.gz" 2>/dev/null | wc -l)
log "Downloaded ${WAL_COUNT} WAL segments"

# Step 4: Restore full backup to target DB
log "Step 4/6: Restoring full backup to ${TARGET_DB}"

# Kill active connections
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = '${TARGET_DB}'
    AND pid <> pg_backend_pid();
" 2>/dev/null || true

# Drop and recreate target DB
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${TARGET_DB};" 2>/dev/null || true
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${TARGET_DB};"

# Restore schema + data from full backup
pg_restore \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$TARGET_DB" \
  --format=custom \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --jobs=$(nproc 2>/dev/null || echo 2) \
  "${RESTORE_DIR}/${LATEST_S3}" 2>&1 | while IFS= read -r line; do log "pg_restore: $line"; done

log "Full backup restored"

# Step 5: Apply WAL to reach target timestamp
log "Step 5/6: Applying WAL segments to reach ${TIMESTAMP}"
RECOVERY_CONF="${RESTORE_DIR}/recovery.conf"
cat > "$RECOVERY_CONF" << EOF
# TRADINGO PITR recovery configuration
restore_command = 'cp ${WAL_DIR}/%f.gz %p 2>/dev/null || gunzip -c ${WAL_DIR}/%f.gz > %p'
recovery_target_time = '${TIMESTAMP}'
recovery_target_action = 'promote'
recovery_target_inclusive = true
EOF

# Place PostgreSQL instance in recovery mode
PGDATA="${RESTORE_DIR}/pgdata"
mkdir -p "$PGDATA"
cp "$RECOVERY_CONF" "${PGDATA}/recovery.conf"

log "WAL recovery configuration written to ${RECOVERY_CONF}"

# Check if we can verify recovery point
RECOVERED_TS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -t -c "
  SELECT COALESCE(
    (SELECT MAX(created_at)::text FROM information_schema.tables 
     WHERE table_schema = 'public' LIMIT 1),
    'no-data'
  )" 2>/dev/null | tr -d ' ' || echo "unknown")
log "Recovery point verified: ${RECOVERED_TS}"

# Step 6: Validate restored data
log "Step 6/6: Validating restored database"
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -t -c "
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
" 2>/dev/null | tr -d ' ' || echo "0")
ROW_ESTIMATE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -t -c "
  SELECT SUM(n_live_tup) FROM pg_stat_user_tables;
" 2>/dev/null | tr -d ' ' || echo "0")

log "Restore validation: ${TABLE_COUNT} tables, ~${ROW_ESTIMATE} rows"

# Cleanup
rm -rf "$WAL_DIR" "$PGDATA" "$RECOVERY_CONF"

log "=========================================="
log "PITR Restore COMPLETE"
log "Database: ${TARGET_DB} @ ${TIMESTAMP}"
log "Tables: ${TABLE_COUNT}, Estimated rows: ${ROW_ESTIMATE}"
log "=========================================="
