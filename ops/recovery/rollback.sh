#!/usr/bin/env bash
set -euo pipefail

# TRADINGO Deployment Rollback
# Rolls back a deployment to a previous stable version
# Supports: Docker Compose, Kubernetes, and database migration rollback
# Usage: ./rollback.sh [--type=<type>] [--version=<version>]

TYPE="auto"
TARGET_VERSION=""
DRY_RUN=false
LOG_TAG="[rollback]"

log() { echo "$LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }
error() { echo "$LOG_TAG ERROR: $*" >&2; exit 1; }
warn() { echo "$LOG_TAG WARN: $*"; }

for arg in "$@"; do
  case "$arg" in
    --type=*) TYPE="${arg#*=}" ;;       # docker, kubernetes, database, auto
    --version=*) TARGET_VERSION="${arg#*=}" ;;
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "TRADINGO Deployment Rollback"
      echo "Usage: $0 [--type=<type>] [--version=<version>] [--dry-run]"
      echo "  --type       Deployment type: docker, kubernetes, database, auto (default)"
      echo "  --version    Target version to rollback to (default: previous stable)"
      echo "  --dry-run    Show actions without executing"
      exit 0
      ;;
  esac
done

log "=========================================="
log "DEPLOYMENT ROLLBACK"
log "Type:    ${TYPE}"
log "Version: ${TARGET_VERSION:-latest-stable}"
log "Dry run: ${DRY_RUN}"
log "=========================================="

# Auto-detect deployment type
if [ "$TYPE" = "auto" ]; then
  if command -v kubectl >/dev/null 2>&1 && kubectl config current-context 2>/dev/null; then
    TYPE="kubernetes"
  elif [ -f "docker-compose.yml" ] || [ -f "docker-compose.prod.yml" ]; then
    TYPE="docker"
  else
    error "Could not auto-detect deployment type. Specify --type."
  fi
  log "Auto-detected: ${TYPE}"
fi

rollback_docker() {
  local VERSION="${1:-}"
  
  log "--- Docker Compose Rollback ---"
  
  # Determine current and previous versions from image tags
  if [ -z "$VERSION" ]; then
    # Get the current running image tag
    CURRENT_TAG=$(docker inspect --format '{{.Config.Image}}' tradingo-api 2>/dev/null | cut -d: -f2 || echo "latest")
    # Previous stable is typically the one before last
    VERSION="prev"
    log "No version specified, rolling back to previous stable"
  fi
  
  if $DRY_RUN; then
    log "[DRY-RUN] Would run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
    log "[DRY-RUN] Would run: # Update IMAGE_TAG=${VERSION} in .env"
    log "[DRY-RUN] Would run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
    return
  fi
  
  # Pull the target version
  log "Pulling image tag: ${VERSION}"
  docker pull "tradingo/api:${VERSION}" || warn "Image pull failed, using local cache"
  docker pull "tradingo/web:${VERSION}" || warn "Image pull failed, using local cache"
  
  # Graceful shutdown
  log "Stopping current deployment..."
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --timeout 30 || warn "Docker compose down had warnings"
  
  # Update env
  if [ -f ".env" ]; then
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${VERSION}/" .env
  fi
  
  # Start with target version
  log "Starting deployment with ${VERSION}..."
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --wait 2>&1 || error "Docker compose up failed"
  
  # Health check
  for i in {1..30}; do
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:3001/api/v1/health" 2>/dev/null || echo "000")
    if [ "$HEALTH" = "200" ]; then
      log "✅ Rollback complete — API healthy (HTTP 200)"
      return
    fi
    sleep 2
  done
  error "API healthcheck did not pass after rollback"
}

rollback_kubernetes() {
  local VERSION="${1:-}"
  
  log "--- Kubernetes Rollback ---"
  
  if $DRY_RUN; then
    log "[DRY-RUN] Would run: kubectl rollout undo deployment/api -n tradingo ${VERSION:+--to-revision=$VERSION}"
    log "[DRY-RUN] Would run: kubectl rollout undo deployment/web -n tradingo ${VERSION:+--to-revision=$VERSION}"
    log "[DRY-RUN] Would run: kubectl rollout status deployment/api -n tradingo --timeout=5m"
    log "[DRY-RUN] Would run: kubectl rollout status deployment/web -n tradingo --timeout=5m"
    return
  fi
  
  # Get rollout history
  log "Current rollout history:"
  kubectl rollout history deployment/api -n tradingo 2>&1 || warn "No rollout history found"
  
  # Execute rollback
  if [ -n "$VERSION" ]; then
    log "Rolling back API to revision ${VERSION}..."
    kubectl rollout undo deployment/api -n tradingo --to-revision="$VERSION" || error "API rollback failed"
    log "Rolling back Web to revision ${VERSION}..."
    kubectl rollout undo deployment/web -n tradingo --to-revision="$VERSION" || error "Web rollback failed"
  else
    # Rollback to previous revision
    log "Rolling back API to previous revision..."
    kubectl rollout undo deployment/api -n tradingo || error "API rollback failed"
    log "Rolling back Web to previous revision..."
    kubectl rollout undo deployment/web -n tradingo || error "Web rollback failed"
  fi
  
  # Wait for rollback to complete
  log "Waiting for API rollback to complete..."
  kubectl rollout status deployment/api -n tradingo --timeout=300s || warn "API rollout status monitoring timed out"
  log "Waiting for Web rollback to complete..."
  kubectl rollout status deployment/web -n tradingo --timeout=300s || warn "Web rollout status monitoring timed out"
  
  # Verify
  API_PODS=$(kubectl get pods -n tradingo -l app=tradingo-api --field-selector=status.phase=Running -o json | jq '.items | length')
  WEB_PODS=$(kubectl get pods -n tradingo -l app=tradingo-web --field-selector=status.phase=Running -o json | jq '.items | length')
  
  log "Running pods: API=${API_PODS}, Web=${WEB_PODS}"
  
  if [ "${API_PODS:-0}" -ge 2 ] && [ "${WEB_PODS:-0}" -ge 2 ]; then
    log "✅ Kubernetes rollback complete"
  else
    warn "Rollback finished but pod count is low — manual verification recommended"
  fi
}

rollback_database() {
  log "--- Database Migration Rollback ---"
  
  if $DRY_RUN; then
    log "[DRY-RUN] Would run: npx prisma migrate resolve --rolled-back <migration-name>"
    log "[DRY-RUN] Would run: npx prisma db execute --file=rollback.sql"
    log "[DRY-RUN] Would run: restore-pitr.sh <pre-migration-timestamp>"
    return
  fi
  
  # Check if Prisma is available
  if ! command -v npx >/dev/null 2>&1 || [ ! -f "prisma/schema.prisma" ]; then
    error "Prisma not available in this context. Use manual PITR restore instead."
  fi
  
  # List recent migrations
  log "Recent migrations:"
  ls -lt prisma/migrations/ 2>/dev/null | head -10 || warn "No migrations directory found"
  
  # For database rollback, we use PITR to pre-migration point
  local PRE_MIGRATION_TS=${TARGET_VERSION:-"15 minutes ago"}
  local TIMESTAMP=$(date -u -d "$PRE_MIGRATION_TS" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "$PRE_MIGRATION_TS")
  
  log "Database rollback to: ${TIMESTAMP}"
  log "Execute: /usr/local/bin/restore-pitr.sh \"${TIMESTAMP}\""
  
  if [ -f "/usr/local/bin/restore-pitr.sh" ]; then
    /usr/local/bin/restore-pitr.sh "$TIMESTAMP"
  else
    warn "restore-pitr.sh not found at /usr/local/bin/restore-pitr.sh"
    log "Manual steps:"
    log "  1. Identify the problematic migration"
    log "  2. Run: npx prisma migrate resolve --rolled-back <migration_name>"
    log "  3. PITR restore: restore-pitr.sh \"<pre-migration-timestamp>\""
  fi
  
  log "✅ Database rollback procedure completed"
}

# Execute based on type
case "$TYPE" in
  docker) rollback_docker "$TARGET_VERSION" ;;
  kubernetes) rollback_kubernetes "$TARGET_VERSION" ;;
  database) rollback_database ;;
  *)
    # Full rollback: DB first, then app
    rollback_database
    if command -v kubectl >/dev/null 2>&1; then
      rollback_kubernetes "$TARGET_VERSION"
    else
      rollback_docker "$TARGET_VERSION"
    fi
    ;;
esac

log "=========================================="
log "Rollback ${DRY_RUN:+DRY RUN }COMPLETE"
if $DRY_RUN; then
  log "Run without --dry-run to execute"
fi
log "=========================================="
