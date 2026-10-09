#!/usr/bin/env sh
set -eu

# ============================================================
# TRADINGO — Scheduled Database Backup (host cron, daily 02:00)
# Wave 3B-1: custom-format dump via the shared backup library
# (temp artifact -> pg_dump exit check -> pg_restore --list
# validation -> atomic rename). Failures are non-zero, logged,
# and can never leave a successful-looking artifact behind.
# Invoked by /etc/cron.d/tradingo-backup (deploy-vps.sh).
# ============================================================

cd "$(dirname "$0")/../.."
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
# Real secrets live ONLY in the gitignored .env.production.local.
# The tracked .env.production is a placeholder template and must NEVER be used at runtime.
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-.env.production.local}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

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

mkdir -p "$BACKUP_DIR" "$BACKUP_DIR/logs"

. ./scripts/lib/pg-backup.sh

TS="$(date -u '+%Y%m%d-%H%M%S')"
LOG="${BACKUP_DIR}/logs/backup-${TS}.log"
STATUS="${BACKUP_DIR}/logs/backup-status.txt"

echo "[Backup] Starting PostgreSQL backup ($(date -u '+%Y-%m-%dT%H:%M:%SZ'))"

if tradingo_pg_backup "$BACKUP_DIR" tradingo compose \
     --compose-file "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" > "$LOG" 2>&1; then
  result_line="$(grep '^BACKUP_RESULT=' "$LOG" | tail -n 1)"
  file="$(echo "$result_line" | cut -d' ' -f2 | sed 's/^FILE=//')"
  size="$(echo "$result_line" | cut -d' ' -f3 | sed 's/^SIZE=//')"
  entries="$(echo "$result_line" | cut -d' ' -f4 | sed 's/^ENTRIES=//')"
  {
    echo "status=OK"
    echo "timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "file=${file}"
    echo "size=${size}"
    echo "entries=${entries}"
  } > "$STATUS"
  echo "[Backup] Verified backup complete: ${file} (${size} bytes, ${entries} TOC entries)"
else
  rc=$?
  {
    echo "status=FAILED"
    echo "timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "file=-"
    echo "size=0"
    echo "entries=0"
  } > "$STATUS"
  echo "[Backup] ERROR: backup FAILED — see ${LOG} for details" >&2
  exit "$rc"
fi

# Retention: keep the last RETENTION_DAYS days of local backups.
# tradingo-*.dump covers both scheduled (tradingo-*) and pre-migration
# (tradingo-pre-migration-*) artifacts; legacy .sql.gz keeps its own glob.
find "$BACKUP_DIR" -maxdepth 1 -type f -name "tradingo-*.dump" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
find "$BACKUP_DIR" -maxdepth 1 -type f -name "tradingo-*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true

echo "[Backup] Retention: keeping backups from the last ${RETENTION_DAYS} days"
echo "[Backup] Done"