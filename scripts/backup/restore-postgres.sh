#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:?Usage: $0 <backup-file>}"
DB_NAME="${DB_NAME:-tradingo}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-tradingo}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] WARNING: This will overwrite the database: $DB_NAME"
echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] Restoring from: $BACKUP_FILE"
echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] Press CTRL+C to cancel, or wait 5 seconds to continue..."
sleep 5

pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --verbose \
  "$BACKUP_FILE"

echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] Restore complete"
