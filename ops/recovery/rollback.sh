#!/usr/bin/env bash
# TRADINGO — Deployment Rollback (Docker Compose / Hostinger VPS topology)
#
# SCOPE AND LIMITS (read before using):
#   * This script rolls the APPLICATION back to a previously verified release by
#     its IMMUTABLE image identity, taken from a release manifest
#     (scripts/deploy/release-manifest.sh). It does NOT reverse database
#     migrations: the release migrations are forward-only by design, and a data
#     restore is a separate, deliberate decision (scripts/deploy/restore-backup.sh).
#   * It NEVER runs `docker compose down`, never prunes images or volumes, and
#     never touches the postgres, redis, opensearch, nginx or monitoring
#     services. The database and its volumes are preserved, and no unrelated
#     founder/WORCARE container is affected.
#   * It replaces only the `api` and `web` containers (`up -d --no-deps`), so
#     the traffic switch is NOT atomic: nginx proxies to the api container
#     name, so there is a short window in which that container is being
#     recreated. A zero-downtime switch would need a second api instance and
#     an upstream switch — that is an architecture decision, NOT something this
#     script can or should simulate. It is left explicitly unresolved.
#   * The Kubernetes path is retained for completeness but is NOT APPLICABLE to
#     the Hostinger Docker Compose deployment; it must be requested explicitly.
#
# RELEASE IDENTITY (verified on the live host 2026-10-21):
#   The production containers run MUTABLE tags (tradingo-prod-api:latest /
#   tradingo-prod-web:latest) and no SHA-tagged image was present on the host.
#   Resolving a release by such a tag can restore the WRONG build silently.
#   This script therefore requires a recorded manifest and restores by IMAGE ID
#   (or by DIGEST, which is also immutable). A target with no manifest, an
#   unknown SHA, a malformed manifest, or images that are neither present nor
#   retrievable by digest is REFUSED before any service is changed.
#
# Usage:
#   ./rollback.sh --version=<40-hex-sha> [--app-dir=/home/tradingo/tradingo]
#                  [--manifest-dir=/home/tradingo/releases] [--dry-run]
#
# Exit 0 = rollback completed AND verified (image identity + health).
# Exit 1 = rollback not attempted, or attempted and NOT verified. A non-zero
#          exit always means "the release is not known good".
set -uo pipefail

TYPE="docker"
TARGET_VERSION=""
APP_DIR="${ROLLBACK_APP_DIR:-/home/tradingo/tradingo}"
MANIFEST_DIR="${ROLLBACK_MANIFEST_DIR:-/home/tradingo/releases}"
MANIFEST_FILE=""
PROJECT="${ROLLBACK_PROJECT:-tradingo-prod}"
COMPOSE_FILE="${ROLLBACK_COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ROLLBACK_ENV_FILE:-.env.production.local}"
HEALTH_DEADLINE_SEC="${ROLLBACK_HEALTH_DEADLINE_SEC:-90}"
DRY_RUN=false
LOG_TAG="[rollback]"

log() { echo "$LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }
error() { echo "$LOG_TAG ERROR: $*" >&2; }
warn() { echo "$LOG_TAG WARN: $*" >&2; }

for arg in "$@"; do
  case "$arg" in
    --type=*) TYPE="${arg#*=}" ;;
    --version=*) TARGET_VERSION="${arg#*=}" ;;
    --app-dir=*) APP_DIR="${arg#*=}" ;;
    --manifest-dir=*) MANIFEST_DIR="${arg#*=}" ;;
    --manifest=*) MANIFEST_FILE="${arg#*=}" ;;
    --project=*) PROJECT="${arg#*=}" ;;
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "TRADINGO Deployment Rollback (Docker Compose, manifest-driven identity)"
      echo "Usage: $0 --version=<40-hex-sha> [--app-dir=<path>] [--manifest-dir=<path>] [--manifest=<file>] [--dry-run]"
      echo "  --version       the exact release SHA to roll back to (required; never guessed)"
      echo "  --manifest-dir  directory holding the recorded release manifests"
      exit 0
      ;;
  esac
done

log "=========================================="
log "DEPLOYMENT ROLLBACK"
log "Type:    ${TYPE}"
log "Version: ${TARGET_VERSION:-<none>}"
log "Project: ${PROJECT}   App dir: ${APP_DIR}"
log "Dry run: ${DRY_RUN}"
log "=========================================="

if [ "$TYPE" != "docker" ]; then
  error "--type=${TYPE} is not supported by this script. The Hostinger deployment is Docker Compose; use --type=docker."
  error "The Kubernetes path below is retained for reference only and is NOT APPLICABLE to this deployment."
  exit 1
fi

# --- 1. The target release must be named explicitly -------------------------
if [ -z "$TARGET_VERSION" ]; then
  error "--version=<sha> is required. The rollback target is never guessed: a rollback must name a specific, previously verified release."
  exit 1
fi
if ! printf '%s' "$TARGET_VERSION" | grep -Eq '^[0-9a-f]{40}$'; then
  error "invalid --version format: '$TARGET_VERSION' (expected a 40-character lowercase commit SHA)"
  exit 1
fi

# --- 2. The deployment context must be intact -------------------------------
[ -d "$APP_DIR" ] || { error "application directory not found: $APP_DIR"; exit 1; }
[ -f "$APP_DIR/$COMPOSE_FILE" ] || { error "compose file not found: $APP_DIR/$COMPOSE_FILE"; exit 1; }
[ -f "$APP_DIR/$ENV_FILE" ] || { error "environment file not found: $APP_DIR/$ENV_FILE (the tracked placeholder must never be used)"; exit 1; }

cd "$APP_DIR" || { error "cannot enter $APP_DIR"; exit 1; }

COMPOSE="docker compose -p ${PROJECT} --env-file ${ENV_FILE} -f ${COMPOSE_FILE}"

# --- 3. The release must exist in the repository history --------------------
if ! git cat-file -e "${TARGET_VERSION}^{commit}" 2>/dev/null; then
  error "release $TARGET_VERSION is not present in the local repository history."
  error "Fetch it first (git fetch origin) — a rollback must target a release this host knows about."
  exit 1
fi
log "target release present in repository history: $TARGET_VERSION"

# --- 4. The recorded immutable release identity is mandatory ----------------
if [ -z "$MANIFEST_FILE" ]; then
  MANIFEST_FILE="${MANIFEST_DIR}/${TARGET_VERSION}.manifest"
fi
if [ ! -f "$MANIFEST_FILE" ]; then
  error "no release manifest for $TARGET_VERSION at $MANIFEST_FILE"
  error "A rollback restores an exact release identity, not a mutable tag. Record the identity on the host that ran that release:"
  error "  bash scripts/deploy/release-manifest.sh record $TARGET_VERSION"
  error "Nothing was changed."
  exit 1
fi

manifest_value() { grep "^$1=" "$MANIFEST_FILE" 2>/dev/null | head -n1 | cut -d= -f2-; }

RECORDED_SHA="$(manifest_value release_sha)"
if [ "$RECORDED_SHA" != "$TARGET_VERSION" ]; then
  error "release manifest $MANIFEST_FILE records release_sha='$RECORDED_SHA', not '$TARGET_VERSION' — refusing a mismatched identity"
  exit 1
fi

API_ID="$(manifest_value api_image_id)"
MIGRATE_ID="$(manifest_value api_migrate_image_id)"
WEB_ID="$(manifest_value web_image_id)"
API_DIGEST="$(manifest_value api_digest)"
MIGRATE_DIGEST="$(manifest_value api_migrate_digest)"
WEB_DIGEST="$(manifest_value web_digest)"

for pair in "api:$API_ID" "api-migrate:$MIGRATE_ID" "web:$WEB_ID"; do
  svc="${pair%%:*}"; id="${pair#*:}"
  if [ -z "$id" ]; then
    error "release manifest $MANIFEST_FILE has no ${svc}_image_id — the identity is incomplete; refusing"
    exit 1
  fi
done
log "release identity loaded from $MANIFEST_FILE"

# --- 5. The images must be available (by ID, or by digest) BEFORE any change -
image_available() { # image_id
  docker image inspect --format '{{.Id}}' "$1" >/dev/null 2>&1
}
ensure_image() { # service image_id digest
  local svc="$1" id="$2" digest="$3"
  if image_available "$id"; then
    log "  $svc: image ID present locally ($id)"
    return 0
  fi
  if [ -n "$digest" ]; then
    log "  $svc: image ID not present locally — pulling the recorded DIGEST (immutable): $digest"
    if docker pull "$digest" >/dev/null 2>&1 && image_available "$id"; then
      log "  $svc: image retrieved by digest and matches the recorded ID"
      return 0
    fi
    error "  $svc: the recorded digest could not be pulled, or the pulled image does not match the recorded ID"
    return 1
  fi
  error "  $svc: image ID $id is not present on this host and no digest was recorded — the release cannot be restored"
  return 1
}

ensure_image api "$API_ID" "$API_DIGEST" || { error "Nothing was changed. The target release's images are not available on this host."; exit 1; }
ensure_image api-migrate "$MIGRATE_ID" "$MIGRATE_DIGEST" || { error "Nothing was changed. The target release's images are not available on this host."; exit 1; }
ensure_image web "$WEB_ID" "$WEB_DIGEST" || { error "Nothing was changed. The target release's images are not available on this host."; exit 1; }

API_DST="${PROJECT}-api:latest"
MIGRATE_DST="${PROJECT}-api-migrate:latest"
WEB_DST="${PROJECT}-web:latest"

# --- 6. Plan -----------------------------------------------------------------
cat <<EOF
$(log "PLAN")
$(log "  1. docker tag $API_ID     -> $API_DST")
$(log "  2. docker tag $MIGRATE_ID -> $MIGRATE_DST")
$(log "  3. docker tag $WEB_ID     -> $WEB_DST")
$(log "  4. $COMPOSE up -d --no-deps api web")
$(log "  5. verify the running image ids equal the recorded release identity")
$(log "  6. wait for the API health endpoint")
$(log) NOT touched: postgres, redis, opensearch, nginx, monitoring, any volume, any image cache
$(log) NOT reversed: database migrations (forward-only by design)
EOF

if $DRY_RUN; then
  log "[DRY-RUN] no changes made"
  exit 0
fi

# --- 7. Apply (by immutable image ID, never by a mutable tag) ---------------
docker tag "$API_ID" "$API_DST" || { error "failed to tag the api image ID"; exit 1; }
docker tag "$MIGRATE_ID" "$MIGRATE_DST" || { error "failed to tag the api-migrate image ID"; exit 1; }
docker tag "$WEB_ID" "$WEB_DST" || { error "failed to tag the web image ID"; exit 1; }
log "release images tagged from their immutable IDs"

if ! $COMPOSE up -d --no-deps api web </dev/null; then
  error "service recreate failed. The previous release could NOT be restored."
  error "The api/web containers may be absent or running the failed release. Inspect with: $COMPOSE ps api web"
  exit 1
fi
log "api and web containers recreated (no project-wide down, no pruning)"

# --- 8. Proof: the running containers carry the RECORDED identity -----------
FAIL=0
check_identity() { # container recorded_image_id
  local running expected
  running="$(docker inspect --format '{{.Image}}' "$1" 2>/dev/null || echo "")"
  expected="$2"
  if [ -z "$running" ]; then
    error "cannot verify identity for $1 (container missing or not inspectable)"
    FAIL=1
    return
  fi
  if [ "$running" = "$expected" ]; then
    log "OK: $1 runs the recorded release image ($running)"
  else
    error "$1 is running $running but the recorded release image is $expected — the rollback did NOT take effect"
    FAIL=1
  fi
}
check_identity tradingo-api "$API_ID"
check_identity tradingo-web "$WEB_ID"

# --- 9. Proof: health --------------------------------------------------------
HEALTH_URL="${ROLLBACK_HEALTH_URL:-http://localhost:3001/health}"
start="$(date +%s)"
code="000"
while :; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$HEALTH_URL" 2>/dev/null || echo 000)"
  [ "$code" = "200" ] && break
  now="$(date +%s)"
  if [ $((now - start)) -ge "$HEALTH_DEADLINE_SEC" ]; then
    break
  fi
  sleep 3
done
if [ "$code" = "200" ]; then
  log "OK: API health endpoint answered 200 ($HEALTH_URL)"
else
  error "API health endpoint did not answer 200 within ${HEALTH_DEADLINE_SEC}s (last code: $code)"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then
  echo "" >&2
  error "ROLLBACK NOT VERIFIED — the release must be treated as NOT known good."
  error "Inspect: $COMPOSE ps api web"
  error "The database was not modified. A data restore is a separate decision (scripts/deploy/restore-backup.sh)."
  exit 1
fi

log "ROLLBACK COMPLETED AND VERIFIED: running $TARGET_VERSION"
log "Reminder: forward-only migrations are NOT reversed. If the release required a schema change, evaluate a data restore separately."
exit 0
