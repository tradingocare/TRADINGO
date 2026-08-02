#!/usr/bin/env bash
set -euo pipefail

# TRADINGO PostgreSQL Full Backup
# Performs: pg_dump custom-format → local staging → S3 upload → cleanup
# Schedule: Daily via cron/systemd timer (recommended: 02:00 UTC)

BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
S3_BUCKET="${S3_BACKUP_BUCKET:-tradingo-backups}"
S3_PREFIX="${S3_BACKUP_PREFIX:-postgres/full}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DB_NAME="${PG_DATABASE:-tradingo}"
DB_HOST="${PG_HOST:-localhost}"
DB_PORT="${PG_PORT:-5432}"
DB_USER="${PG_USER:-tradingo}"
PGPASSFILE="${PGPASSFILE:-/etc/postgresql/.pgpass}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
FILENAME="tradingo-pg-full-${TIMESTAMP}.dump"
LATEST_LINK="${BACKUP_DIR}/latest.dump"
LOG_TAG="[pg-full-backup]"

log() { echo "$LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }
error() { echo "$LOG_TAG ERROR: $*" >&2; exit 1; }

# Prerequisites
command -v pg_dump >/dev/null 2>&1 || error "pg_dump not found"
command -v aws >/dev/null 2>&1 || error "aws CLI not found"
command -v gzip >/dev/null 2>&1 || error "gzip not found"

mkdir -p "$BACKUP_DIR"

log "Starting full PostgreSQL backup: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
log "Output: ${BACKUP_DIR}/${FILENAME}"

# Measure duration
START_TS=$(date +%s)

# Dump with custom format (parallel jobs if available)
PARALLEL_JOBS=$(nproc 2>/dev/null || echo 2)
if [ "$PARALLEL_JOBS" -gt 4 ]; then PARALLEL_JOBS=4; fi

pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_DIR}/${FILENAME}" \
  --verbose \
  --no-owner \
  --no-acl \
  --jobs="$PARALLEL_JOBS" 2>&1 | while IFS= read -r line; do log "pg_dump: $line"; done

DURATION=$(( $(date +%s) - START_TS ))

# Verify dump integrity
pg_restore --list "${BACKUP_DIR}/${FILENAME}" >/dev/null 2>&1 || error "Backup integrity check FAILED for ${FILENAME}"

DUMP_SIZE=$(stat -c%s "${BACKUP_DIR}/${FILENAME}" 2>/dev/null || stat -f%z "${BACKUP_DIR}/${FILENAME}" 2>/dev/null)
DUMP_SIZE_MB=$(( DUMP_SIZE / 1048576 ))
log "Backup complete: ${DUMP_SIZE_MB}MB in ${DURATION}s — integrity verified"

# Create/update latest symlink
ln -sf "${BACKUP_DIR}/${FILENAME}" "$LATEST_LINK"

# Upload to S3 with storage class transition
log "Uploading to s3://${S3_BUCKET}/${S3_PREFIX}/${FILENAME}"
aws s3 cp \
  "${BACKUP_DIR}/${FILENAME}" \
  "s3://${S3_BUCKET}/${S3_PREFIX}/${FILENAME}" \
  --storage-class STANDARD_IA \
  --metadata "timestamp=${TIMESTAMP},database=${DB_NAME},type=full-backup,size-mb=${DUMP_SIZE_MB},duration-s=${DURATION}"

# Write backup metadata
cat > "${BACKUP_DIR}/${FILENAME}.meta" << EOF
timestamp=${TIMESTAMP}
database=${DB_NAME}
host=${DB_HOST}:${DB_PORT}
type=full-backup
format=custom
compression=9
size-mb=${DUMP_SIZE_MB}
duration-s=${DURATION}
pg_version=$(pg_dump --version 2>/dev/null || echo unknown)
s3_path=s3://${S3_BUCKET}/${S3_PREFIX}/${FILENAME}
EOF

aws s3 cp \
  "${BACKUP_DIR}/${FILENAME}.meta" \
  "s3://${S3_BUCKET}/${S3_PREFIX}/${FILENAME}.meta" \
  --content-type text/plain

# Cleanup local backups older than retention
find "$BACKUP_DIR" -name "tradingo-pg-full-*.dump" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "tradingo-pg-full-*.dump.meta" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

log "Local retention applied: ${RETENTION_DAYS} days"
log "Backup successfully completed and uploaded"
