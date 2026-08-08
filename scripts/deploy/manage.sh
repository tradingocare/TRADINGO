#!/usr/bin/env bash
set -euo pipefail

# ============================================
# TRADINGO — Production Management Utility
# Usage: bash scripts/deploy/manage.sh <command>
# ============================================

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
# Real secrets live ONLY in the gitignored .env.production.local.
# The tracked .env.production is a placeholder template and must NEVER be used at runtime.
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-.env.production.local}"
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

# Fail-fast: never operate against the tracked placeholder template.
if [ "$COMPOSE_ENV_FILE" = ".env.production" ]; then
  echo "[TRADINGO] ERROR: refusing to use the tracked placeholder template .env.production. Use .env.production.local." >&2
  exit 1
fi

# Fail-fast: production secrets must be configured before any management command can run.
if [ ! -f "$COMPOSE_ENV_FILE" ]; then
  echo "[TRADINGO] ERROR: $COMPOSE_ENV_FILE not found. Production secrets must be configured first." >&2
  echo "[TRADINGO] Copy .env.production.local.example to .env.production.local and fill in real values." >&2
  exit 1
fi

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

compose() {
  docker compose --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

usage() {
  cat << USAGE
TRADINGO Production Management

Usage: bash $0 <command> [options]

Commands:
  status              Show all service statuses
  logs    [service]   Tail logs (optional: specific service)
  restart [service]   Restart all or a specific service
  deploy              Pull latest, rebuild, migrate, restart
  migrate             Run database migrations only
  seed                Seed database (idempotent)
  backup              Run manual database backup
  restore <file>      Restore database from backup file
  health              Run smoke tests
  shell  <service>    Open a shell in a running container
  psql                Open PostgreSQL shell
  redis-cli           Open Redis CLI
  cleanup             Remove unused Docker images/volumes
  env                 Show current environment summary

USAGE
  exit 1
}

cmd_status() {
  compose ps
}

cmd_logs() {
  local service="${1:-}"
  if [ -n "$service" ]; then
    compose logs -f "$service"
  else
    compose logs -f
  fi
}

cmd_restart() {
  local service="${1:-}"
  if [ -n "$service" ]; then
    info "Restarting $service..."
    compose restart "$service"
  else
    info "Restarting all services..."
    compose restart
  fi
  ok "Restart complete"
}

cmd_deploy() {
  info "Pulling latest changes..."
  git pull origin main

  info "Rebuilding images..."
  compose build --parallel

  info "Running migrations..."
  compose run --rm api-migrate || fail "Migration failed. Resolve the error before retrying deploy."

  info "Starting services..."
  compose up -d

  info "Running smoke tests..."
  bash scripts/deploy/smoke-test.sh || warn "Smoke tests failed"

  ok "Deploy complete"
}

cmd_migrate() {
  info "Running migrations..."
  compose run --rm api-migrate
  ok "Migration complete"
}

cmd_seed() {
  info "Seeding database..."
  compose run --rm api-migrate npx prisma db seed
  ok "Seed complete"
}

cmd_backup() {
  bash scripts/deploy/backup-db.sh
}

cmd_restore() {
  local file="${1:-}"
  if [ -z "$file" ] || [ ! -f "$file" ]; then
    fail "Usage: $0 restore <backup-file.sql.gz>"
  fi
  info "Restoring from $file..."
  gunzip -c "$file" | compose exec -T postgres psql -U tradingo tradingo
  ok "Restore complete"
}

cmd_health() {
  bash scripts/deploy/smoke-test.sh
}

cmd_shell() {
  local service="${1:-}"
  if [ -z "$service" ]; then
    fail "Usage: $0 shell <service-name>"
  fi
  docker compose -f "$COMPOSE_FILE" exec "$service" /bin/sh -c "exec \$(command -v bash || command -v sh)"
}

cmd_psql() {
  compose exec postgres psql -U tradingo tradingo
}

cmd_redis_cli() {
  compose exec redis redis-cli
}

cmd_cleanup() {
  info "Removing unused Docker images..."
  docker image prune -f
  info "Removing unused volumes..."
  docker volume prune -f
  ok "Cleanup complete"
}

cmd_env() {
  echo "=== TRADINGO Environment ==="
  echo "Project:    $PROJECT_DIR"
  echo "Compose:    $COMPOSE_FILE"
  echo "Env file:   $COMPOSE_ENV_FILE"
  compose config --services | while read -r svc; do
    echo "Service:    $svc"
  done
  echo
  echo "=== Docker Status ==="
  docker info --format 'Containers: {{.Containers}} | Running: {{.ContainersRunning}} | Images: {{.Images}}'
  echo
  df -h / | tail -1
}

# ── Main ──
COMMAND="${1:-}"
shift 2>/dev/null || true

case "$COMMAND" in
  status)   cmd_status "$@" ;;
  logs)     cmd_logs "$@" ;;
  restart)  cmd_restart "$@" ;;
  deploy)   cmd_deploy "$@" ;;
  migrate)  cmd_migrate "$@" ;;
  seed)     cmd_seed "$@" ;;
  backup)   cmd_backup "$@" ;;
  restore)  cmd_restore "$@" ;;
  health)   cmd_health "$@" ;;
  shell)    cmd_shell "$@" ;;
  psql)     cmd_psql "$@" ;;
  redis-cli) cmd_redis_cli "$@" ;;
  cleanup)  cmd_cleanup "$@" ;;
  env)      cmd_env "$@" ;;
  *)        usage ;;
esac
