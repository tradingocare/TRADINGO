#!/usr/bin/env bash
set -euo pipefail

# TRADINGO Redis Backup
# Performs: RDB snapshot → S3 upload
# Also records AOF backup info for continuity
# Schedule: Every 6 hours (primary); RDB every 5 min via redis.conf

BACKUP_DIR="${BACKUP_DIR:-/backups/redis}"
S3_BUCKET="${S3_BACKUP_BUCKET:-tradingo-backups}"
S3_PREFIX="${S3_BACKUP_PREFIX:-redis}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
LOG_TAG="[redis-backup]"

log() { echo "$LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }
error() { echo "$LOG_TAG ERROR: $*" >&2; exit 1; }

# Prerequisites
command -v redis-cli >/dev/null 2>&1 || error "redis-cli not found"
command -v aws >/dev/null 2>&1 || error "aws CLI not found"
command -v gzip >/dev/null 2>&1 || error "gzip not found"

mkdir -p "$BACKUP_DIR"

log "Starting Redis backup: ${REDIS_HOST}:${REDIS_PORT}"

# Get Redis info before backup
REDIS_INFO=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} INFO 2>/dev/null || true)
REDIS_VERSION=$(echo "$REDIS_INFO" | grep "^redis_version:" | cut -d: -f2 || echo "unknown")
REDIS_UPTIME=$(echo "$REDIS_INFO" | grep "^uptime_in_seconds:" | cut -d: -f2 || echo "0")
DB_KEYS=$(echo "$REDIS_INFO" | grep "^keyspace=" | cut -d= -f2 || echo "unknown")

log "Redis ${REDIS_VERSION}, uptime ${REDIS_UPTIME}s, keyspace: ${DB_KEYS}"

# 1. Trigger RDB save (BLOCKING on the main Redis process, but consistent)
log "Triggering SAVE..."
SAVE_RESULT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} SAVE 2>&1)
if [ "$SAVE_RESULT" != "OK" ]; then
  error "Redis SAVE failed: $SAVE_RESULT"
fi

# 2. Locate the RDB file
RDB_DIR=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} CONFIG GET dir 2>/dev/null | tail -1 || echo "/data")
RDB_NAME=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} CONFIG GET dbfilename 2>/dev/null | tail -1 || echo "dump.rdb")
RDB_PATH="${RDB_DIR}/${RDB_NAME}"

if [ ! -f "$RDB_PATH" ]; then
  error "RDB file not found at ${RDB_PATH}"
fi

log "Found RDB: ${RDB_PATH}"

# 3. Copy and compress
RDB_SIZE=$(stat -c%s "$RDB_PATH" 2>/dev/null || stat -f%z "$RDB_PATH" 2>/dev/null)
FILENAME="tradingo-redis-${TIMESTAMP}.rdb.gz"
cp "$RDB_PATH" "${BACKUP_DIR}/dump.rdb"
gzip -c "${BACKUP_DIR}/dump.rdb" > "${BACKUP_DIR}/${FILENAME}"
rm -f "${BACKUP_DIR}/dump.rdb"

COMPRESSED_SIZE=$(stat -c%s "${BACKUP_DIR}/${FILENAME}" 2>/dev/null || stat -f%z "${BACKUP_DIR}/${FILENAME}" 2>/dev/null)
LOG_KEYS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} DBSIZE 2>/dev/null || echo "0")

# 4. Upload to S3
log "Uploading to s3://${S3_BUCKET}/${S3_PREFIX}/${FILENAME} (${COMPRESSED_SIZE} bytes)"
aws s3 cp \
  "${BACKUP_DIR}/${FILENAME}" \
  "s3://${S3_BUCKET}/${S3_PREFIX}/${FILENAME}" \
  --storage-class STANDARD_IA \
  --metadata "timestamp=${TIMESTAMP},redis_version=${REDIS_VERSION},keys=${LOG_KEYS},rdb_size=${RDB_SIZE}"

# 5. Upload AOF if present
AOF_NAME=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} CONFIG GET appendfilename 2>/dev/null | tail -1 || echo "appendonly.aof")
AOF_STATUS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} CONFIG GET appendonly 2>/dev/null | tail -1 || echo "no")
if [ "$AOF_STATUS" = "yes" ]; then
  AOF_PATH="${RDB_DIR}/${AOF_NAME}"
  if [ -f "$AOF_PATH" ]; then
    AOF_FILENAME="tradingo-redis-aof-${TIMESTAMP}.aof.gz"
    gzip -c "$AOF_PATH" > "${BACKUP_DIR}/${AOF_FILENAME}"
    aws s3 cp \
      "${BACKUP_DIR}/${AOF_FILENAME}" \
      "s3://${S3_BUCKET}/${S3_PREFIX}/aof/${AOF_FILENAME}" \
      --storage-class STANDARD_IA \
      --metadata "timestamp=${TIMESTAMP}"
    log "AOF backed up to s3://${S3_BUCKET}/${S3_PREFIX}/aof/${AOF_FILENAME}"
    rm -f "${BACKUP_DIR}/${AOF_FILENAME}"
  fi
fi

# 6. Cleanup
rm -f "${BACKUP_DIR}/${FILENAME}"
find "$BACKUP_DIR" -name "tradingo-redis-*.rdb.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

log "Redis backup complete: ${LOG_KEYS} keys, ${COMPRESSED_SIZE} bytes compressed"
