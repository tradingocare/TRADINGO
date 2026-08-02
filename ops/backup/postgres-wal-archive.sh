#!/usr/bin/env bash
set -euo pipefail

# TRADINGO PostgreSQL WAL Archiving
# Called by PostgreSQL archive_command: `wal_level=replica || logical`
# Archives completed WAL segments to S3 for Point-in-Time Recovery (PITR)
# Schedule: Every WAL segment (typically 16MB, every 1-5 min under load)

S3_BUCKET="${S3_BACKUP_BUCKET:-tradingo-backups}"
S3_PREFIX="${S3_BACKUP_PREFIX:-postgres/wal}"
WAL_RETENTION_HOURS="${WAL_RETENTION_HOURS:-168}"  # 7 days
LOG_TAG="[pg-wal-archive]"

# Arguments from postgresql.conf archive_command: %p = path, %f = filename
WAL_PATH="$1"
WAL_FILE="$2"

if [ -z "$WAL_PATH" ] || [ -z "$WAL_FILE" ]; then
  echo "$LOG_TAG ERROR: Usage: $0 <wal_path> <wal_filename>"
  exit 1
fi

log() { echo "$LOG_TAG $(date -u +%Y%m%dT%H%M%SZ) $*"; }
error() { echo "$LOG_TAG ERROR: $*" >&2; exit 1; }

# Prerequisites
command -v aws >/dev/null 2>&1 || error "aws CLI not found"
command -v gzip >/dev/null 2>&1 || error "gzip not found"

# Compress and upload
S3_KEY="${S3_PREFIX}/$(date -u +%Y/%m/%d)/${WAL_FILE}.gz"

# Use a staging area with atomic move to avoid partial uploads on crash
STAGING_FILE=$(mktemp /tmp/wal_staging_XXXXXX.gz)
trap 'rm -f "$STAGING_FILE"' EXIT

gzip -c "$WAL_PATH" > "$STAGING_FILE"

WAL_SIZE=$(stat -c%s "$STAGING_FILE" 2>/dev/null || stat -f%z "$STAGING_FILE" 2>/dev/null)

aws s3 cp \
  "$STAGING_FILE" \
  "s3://${S3_BUCKET}/${S3_KEY}" \
  --storage-class STANDARD_IA \
  --metadata "wal_file=${WAL_FILE},timestamp=$(date -u +%Y%m%dT%H%M%SZ)"

log "Archived ${WAL_FILE} (${WAL_SIZE} bytes) → s3://${S3_BUCKET}/${S3_KEY}"
exit 0
