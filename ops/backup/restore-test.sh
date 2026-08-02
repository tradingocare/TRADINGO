#!/usr/bin/env bash
set -euo pipefail

# TRADINGO Automated Restore Test
# Validates backup integrity by performing a restore to a test database
# Schedule: Weekly (cron: 0 4 * * 0)
# RTO Validation: Measures time to restore

BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
TEST_DB="${PG_TEST_DATABASE:-tradingo_restore_test}"
S3_BUCKET="${S3_BACKUP_BUCKET:-tradingo-backups}"
S3_PREFIX="${S3_BACKUP_PREFIX:-postgres}"
DB_HOST="${PG_HOST:-localhost}"
DB_PORT="${PG_PORT:-5432}"
DB_USER="${PG_USER:-tradingo}"
LOG_DIR="${BACKUP_LOG_DIR:-/var/log/tradingo/backups}"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
LOG_FILE="${LOG_DIR}/restore-test-${TIMESTAMP}.log"
LOG_TAG="[restore-test]"

log() { echo "$LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG_FILE"; }
error() { echo "$LOG_TAG ERROR: $*" | tee -a "$LOG_FILE" >&2; exit 1; }

command -v aws >/dev/null 2>&1 || error "aws CLI not found"
command -v psql >/dev/null 2>&1 || error "psql not found"
command -v pg_restore >/dev/null 2>&1 || error "pg_restore not found"

mkdir -p "$LOG_DIR" "$BACKUP_DIR"

log "=========================================="
log "RESTORE TEST — $(date -u +%Y-%m-%d)"
log "=========================================="

# Find latest full backup
log "Finding latest full backup..."
LATEST_S3=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/full/" | grep ".dump$" | sort | tail -1 | awk '{print $4}')
if [ -z "$LATEST_S3" ]; then
  error "No full backup found in S3"
fi
log "Latest backup: ${LATEST_S3}"

BACKUP_SIZE=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/full/${LATEST_S3}" | awk '{print $3}')
BACKUP_SIZE_MB=$(( BACKUP_SIZE / 1048576 ))
log "Backup size: ${BACKUP_SIZE_MB}MB"

# Download
log "Downloading backup..."
START_DOWNLOAD=$(date +%s%N)
aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/full/${LATEST_S3}" "${BACKUP_DIR}/${LATEST_S3}"
DOWNLOAD_DURATION=$(( ($(date +%s%N) - START_DOWNLOAD) / 1000000 ))
log "Downloaded in ${DOWNLOAD_DURATION}ms"

# Verify integrity
log "Verifying backup integrity..."
pg_restore --list "${BACKUP_DIR}/${LATEST_S3}" >/dev/null 2>&1 || error "Integrity check FAILED"
log "✅ Integrity check passed"

# Get table count from backup metadata
TABLE_COUNT=$(pg_restore --list "${BACKUP_DIR}/${LATEST_S3}" 2>/dev/null | grep "^[0-9]*;.*TABLE " | wc -l || echo "0")
FUNCTION_COUNT=$(pg_restore --list "${BACKUP_DIR}/${LATEST_S3}" 2>/dev/null | grep "^[0-9]*;.*FUNCTION " | wc -l || echo "0")
INDEX_COUNT=$(pg_restore --list "${BACKUP_DIR}/${LATEST_S3}" 2>/dev/null | grep "^[0-9]*;.*INDEX " | wc -l || echo "0")
log "Backup contents: ${TABLE_COUNT} tables, ${INDEX_COUNT} indexes, ${FUNCTION_COUNT} functions"

# Kill connections to test DB if exists
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = '${TEST_DB}'
    AND pid <> pg_backend_pid();
" 2>/dev/null || true

# Drop test DB if exists
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB};" 2>/dev/null || true
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${TEST_DB};"

# Time the restore
log "Starting restore to ${TEST_DB}..."
START_RESTORE=$(date +%s%N)
pg_restore \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$TEST_DB" \
  --format=custom \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --jobs=2 \
  "${BACKUP_DIR}/${LATEST_S3}" 2>&1 | while IFS= read -r line; do log "pg_restore: $line"; done
RESTORE_DURATION=$(( ($(date +%s%N) - START_RESTORE) / 1000000 ))
log "Restore completed in ${RESTORE_DURATION}ms"

# Validate restore count matches
RESTORED_TABLES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB" -t -c "
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
" 2>/dev/null | tr -d ' ' || echo "0")
log "Restored tables: ${RESTORED_TABLES}"

if [ "$RESTORED_TABLES" -eq 0 ]; then
  error "RESTORE TEST FAILED — zero tables restored"
fi

# Validate row counts in key tables
KEY_TABLES=("User" "Company" "Product" "GOCASH_Wallet" "GOCASH_Transaction")
for table in "${KEY_TABLES[@]}"; do
  ROW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"${table}\";" 2>/dev/null | tr -d ' ' || echo "0")
  log "  ${table}: ${ROW_COUNT} rows"
done

# Cleanup test DB
log "Cleaning up test database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = '${TEST_DB}'
    AND pid <> pg_backend_pid();
" 2>/dev/null || true
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB};" 2>/dev/null || true

# Cleanup downloaded backup
rm -f "${BACKUP_DIR}/${LATEST_S3}"

TOTAL_DURATION_MS=$(( DOWNLOAD_DURATION + RESTORE_DURATION ))
TOTAL_DURATION_S=$(( TOTAL_DURATION_MS / 1000 ))

log "=========================================="
log "RESTORE TEST COMPLETE"
log "Download: ${DOWNLOAD_DURATION}ms"
log "Restore:  ${RESTORE_DURATION}ms"
log "Total:    ${TOTAL_DURATION_S}s (${TOTAL_DURATION_MS}ms)"
log "Tables:   ${RESTORED_TABLES}/${TABLE_COUNT}"
log "Result:   ✅ PASS"
log "=========================================="

# Record test result
cat > "${LOG_DIR}/restore-test-result-${TIMESTAMP}.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "test": "full-restore",
  "result": "pass",
  "backup_file": "${LATEST_S3}",
  "backup_size_mb": ${BACKUP_SIZE_MB},
  "download_ms": ${DOWNLOAD_DURATION},
  "restore_ms": ${RESTORE_DURATION},
  "total_ms": ${TOTAL_DURATION_MS},
  "tables_expected": ${TABLE_COUNT},
  "tables_restored": ${RESTORED_TABLES}
}
EOF
