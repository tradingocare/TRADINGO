#!/usr/bin/env sh
set -euo pipefail

# TRADINGO Docker Entrypoint
# Runs before the main application starts:
#   1. Wait for PostgreSQL to be available
#   2. Run Prisma migrations (idempotent)
#   3. Execute the main command

# ─── Configuration ──────────────────────────────────────────────────────────
MAX_DB_WAIT="${DB_WAIT_TIMEOUT:-60}"
MIGRATE_DISABLED="${PRISMA_MIGRATE_DISABLED:-false}"

# ─── Wait for PostgreSQL ────────────────────────────────────────────────────
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
    echo "[entrypoint] WARNING: PostgreSQL not confirmed ready after ${MAX_DB_WAIT}s, continuing anyway"
  else
    echo "[entrypoint] PostgreSQL is ready"
  fi
fi

# ─── Run Prisma Migrations ──────────────────────────────────────────────────
if [ "$MIGRATE_DISABLED" = "false" ] && [ -f "./prisma/schema.prisma" ]; then
  echo "[entrypoint] Running Prisma migrations..."
  npx prisma migrate deploy 2>&1 || echo "[entrypoint] WARNING: Migration deploy failed, continuing"
  npx prisma generate 2>&1 || echo "[entrypoint] WARNING: Prisma generate failed, continuing"
  echo "[entrypoint] Prisma migrations complete"
fi

# ─── Execute Main Command ───────────────────────────────────────────────────
echo "[entrypoint] Starting application: $*"
exec "$@"