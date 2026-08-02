#!/usr/bin/env bash
set -euo pipefail

# ============================================
# TRADINGO — Database Backup Script
# Run daily via cron: scripts/deploy/backup-db.sh
# ============================================

cd "$(dirname "$0")/../.."
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-.env.production}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date -u '+%Y%m%d-%H%M%S')

mkdir -p "$BACKUP_DIR"

echo "[Backup] Starting PostgreSQL backup..."

# Backup database
docker compose --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U tradingo tradingo --clean --if-exists \
  2>/dev/null | gzip > "${BACKUP_DIR}/tradingo-${TIMESTAMP}.sql.gz"

# Check backup integrity
if gzip -t "${BACKUP_DIR}/tradingo-${TIMESTAMP}.sql.gz" 2>/dev/null; then
  size=$(du -h "${BACKUP_DIR}/tradingo-${TIMESTAMP}.sql.gz" | cut -f1)
  echo "[Backup] Completed: ${BACKUP_DIR}/tradingo-${TIMESTAMP}.sql.gz (${size})"
else
  echo "[Backup] ERROR: Backup file corrupted!"
  rm -f "${BACKUP_DIR}/tradingo-${TIMESTAMP}.sql.gz"
  exit 1
fi

# Rotate old backups (keep last N days)
find "$BACKUP_DIR" -name "tradingo-*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true

echo "[Backup] Retention: keeping backups from last ${RETENTION_DAYS} days"
echo "[Backup] Done"
