#!/usr/bin/env bash
set -euo pipefail

# ============================================
# TRADINGO — Database Backup Script
# Run daily via cron: scripts/deploy/backup-db.sh
# ============================================

cd "$(dirname "$0")/../.."
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
# Real secrets live ONLY in the gitignored .env.production.local.
# The tracked .env.production is a placeholder template and must NEVER be used at runtime.
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-.env.production.local}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date -u '+%Y%m%d-%H%M%S')

# Fail-fast: never operate against the tracked placeholder template.
if [ "$COMPOSE_ENV_FILE" = ".env.production" ]; then
  echo "[Backup] ERROR: refusing to use the tracked placeholder template .env.production. Use .env.production.local." >&2
  exit 1
fi

# Fail-fast: production secrets must be configured before any backup can run.
if [ ! -f "$COMPOSE_ENV_FILE" ]; then
  echo "[Backup] ERROR: $COMPOSE_ENV_FILE not found. Production secrets must be configured first." >&2
  echo "[Backup] Copy .env.production.local.example to .env.production.local and fill in real values." >&2
  exit 1
fi

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
