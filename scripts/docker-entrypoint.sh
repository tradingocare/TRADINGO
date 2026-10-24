#!/usr/bin/env sh
set -euo pipefail

# TRADINGO Docker Entrypoint
# Runs before the main application starts:
#   1. Wait for PostgreSQL to be available (fatal on timeout)
#   2. Verified pre-migration backup (fatal on failure)
#   3. Run Prisma migrations (fatal on failure)
#   4. Verify migration state (fatal on inconsistency)
#   5. Execute the main command
#
# A non-zero exit prevents the dependent API container from starting
# via docker-compose's service_completed_successfully gate.

# ─── Configuration ──────────────────────────────────────────────────────────
MAX_DB_WAIT="${DB_WAIT_TIMEOUT:-60}"
MIGRATE_DISABLED="${PRISMA_MIGRATE_DISABLED:-false}"

# ─── Wait for PostgreSQL (fatal) ────────────────────────────────────────────
if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Waiting for PostgreSQL (max ${MAX_DB_WAIT}s)..."
  DB_HOST="${PG_HOST:-${DATABASE_URL#*@}}"
  DB_HOST="${DB_HOST%%:*}"

  i=0
  while ! pg_isready -h "$DB_HOST" -U "${PG_USER:-tradingo}" -q 2>/dev/null && [ "$i" -lt "$MAX_DB_WAIT" ]; do
    i=$((i + 1))
    sleep 1
  done

  if [ "$i" -ge "$MAX_DB_WAIT" ]; then
    echo "[entrypoint] ERROR: PostgreSQL not ready after ${MAX_DB_WAIT}s — aborting so the API does not start against an unavailable database" >&2
    exit 1
  fi
  echo "[entrypoint] PostgreSQL is ready"
else
  echo "[entrypoint] ERROR: DATABASE_URL is not set — cannot verify database readiness" >&2
  exit 1
fi

# ─── Migrations: verified backup first, then deploy (all fatal) ────────────
if [ "$MIGRATE_DISABLED" = "false" ] && [ -f "./prisma/schema.prisma" ]; then
  # Pre-migration backup (Wave 3B-1): a verified backup must exist before ANY
  # migration runs. Uses the same shared implementation as the scheduled host
  # backup (scripts/lib/pg-backup.sh). /backups is bind-mounted from the host
  # (api-migrate volumes); the mount guard refuses an unmounted directory so
  # a container-local false backup can never be produced.
  PRE_MIGRATION_BACKUP_DIR="${PRE_MIGRATION_BACKUP_DIR:-/backups}"
  mkdir -p "$PRE_MIGRATION_BACKUP_DIR" 2>/dev/null || true
  . /scripts/lib/pg-backup.sh
  echo "[entrypoint] Running pre-migration backup..."
  if ! tradingo_pg_backup "$PRE_MIGRATION_BACKUP_DIR" tradingo-pre-migration direct --require-mounted --min-entries 10; then
    echo "[entrypoint] ERROR: pre-migration backup failed — aborting so no migration can run without a verified backup" >&2
    exit 1
  fi
  echo "[entrypoint] Pre-migration backup verified"

  echo "[entrypoint] Running Prisma migrations..."
  if ! npx prisma migrate deploy 2>&1; then
    echo "[entrypoint] ERROR: prisma migrate deploy failed — aborting so the API does not start on a stale schema" >&2
    exit 1
  fi

  # Post-migration verification: confirms all migrations are applied and
  # no failed/rolled-back records exist. Read-only; deterministic exit codes.
  echo "[entrypoint] Verifying migration state..."
  if ! npx prisma migrate status 2>&1; then
    echo "[entrypoint] ERROR: migration state verification failed (unapplied or failed migrations) — aborting" >&2
    exit 1
  fi

  # Prisma client is generated at Docker build time (builder stage) and copied
  # into this image. Regenerating at runtime is a convenience for manual runs
  # against a locally-mounted schema only; its failure must not block startup
  # because the generated client already exists from the build.
  npx prisma generate 2>&1 || echo "[entrypoint] WARNING: prisma generate failed — using build-time generated client"

  echo "[entrypoint] Prisma migrations complete and verified"
else
  echo "[entrypoint] Migrations skipped (disabled or schema not present)"
fi

# ─── Execute Main Command ───────────────────────────────────────────────────
echo "[entrypoint] Starting application: $*"
exec "$@"