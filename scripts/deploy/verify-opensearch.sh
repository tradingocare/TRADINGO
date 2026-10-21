#!/usr/bin/env bash
# verify-opensearch.sh — bounded, fail-closed OpenSearch readiness gate for the
# production release.
#
# Why this exists: the production Compose provisions an OpenSearch service on
# the `tradingo-net` network (service name `opensearch`, container
# `tradingo-opensearch`), and the API container joins that same network, so
# the reachable endpoint is `http://opensearch:9200`. The deployment
# configuration previously pointed the API at
# `http://host.docker.internal:9200` — a HOST port that the Compose service
# deliberately does not publish ("internal only: NO host port binding"), so
# the API constructed a client that could never connect. The observable
# symptom is a 200 response with an EMPTY discover feed and six failed
# queries logged per request — a silent misconfiguration.
#
# This gate therefore answers one question before the traffic switch: "is the
# endpoint the API is configured to use actually reachable from the API
# container?" It never creates, starts, stops or removes a container, and it
# never prints credentials.
#
# Optional-infrastructure behaviour is preserved: when no endpoint is
# configured, OpenSearch is INTENTIONALLY disabled (the API constructs no
# client and search/discovery degrade by design) and this gate exits 0.
# `--require-enabled` inverts that for a release that must have search.
#
# Env:
#   OPENSEARCH_ENV_FILE   env file to read the endpoint from (default .env.production.local)
#   OPENSEARCH_DEADLINE_SEC  readiness deadline in seconds (default 90)
#   OPENSEARCH_CONTAINER  container name (default tradingo-opensearch)
#   OPENSEARCH_SERVICE    compose service / DNS name (default opensearch)
#   OPENSEARCH_API_CONTAINER  container used as the network probe origin (default tradingo-api)
#   OPENSEARCH_PROBE_TIMEOUT_SEC  per-probe timeout (default 10)
#
# Usage: bash scripts/deploy/verify-opensearch.sh [--url URL] [--require-enabled]
# Exit 0 = reachable, or intentionally disabled. Exit 1 = not reachable.
set -uo pipefail

ENV_FILE="${OPENSEARCH_ENV_FILE:-.env.production.local}"
DEADLINE_SEC="${OPENSEARCH_DEADLINE_SEC:-90}"
CONTAINER="${OPENSEARCH_CONTAINER:-tradingo-opensearch}"
SERVICE="${OPENSEARCH_SERVICE:-opensearch}"
API_CONTAINER="${OPENSEARCH_API_CONTAINER:-tradingo-api}"
PROBE_TIMEOUT_SEC="${OPENSEARCH_PROBE_TIMEOUT_SEC:-10}"
REQUIRE_ENABLED=false
URL_OVERRIDE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL_OVERRIDE="$2"; shift 2 ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --require-enabled) REQUIRE_ENABLED=true; shift ;;
    --deadline-sec) DEADLINE_SEC="$2"; shift 2 ;;
    --container) CONTAINER="$2"; shift 2 ;;
    --service) SERVICE="$2"; shift 2 ;;
    --api-container) API_CONTAINER="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 [--url URL] [--env-file FILE] [--require-enabled] [--deadline-sec N]"
      exit 0
      ;;
    *) echo "ERROR: unknown option: $1" >&2; exit 1 ;;
  esac
done

is_uint() { case "$1" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }
is_uint "$DEADLINE_SEC" || { echo "ERROR: DEADLINE_SEC must be a non-negative integer: '$DEADLINE_SEC'" >&2; exit 1; }
is_uint "$PROBE_TIMEOUT_SEC" || { echo "ERROR: PROBE_TIMEOUT_SEC must be a non-negative integer: '$PROBE_TIMEOUT_SEC'" >&2; exit 1; }

# Read the endpoint from the env file without sourcing it (a sourced env file
# could execute arbitrary shell). Only the first OPENSEARCH_URL assignment is
# used; the value is never printed.
read_url_from_env() {
  [ -f "$ENV_FILE" ] || return 1
  sed -n 's/^[[:space:]]*OPENSEARCH_URL[[:space:]]*=[[:space:]]*//p' "$ENV_FILE" | head -n 1 | sed -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

URL="${URL_OVERRIDE}"
if [ -z "$URL" ]; then
  URL="$(read_url_from_env || true)"
fi
if [ -z "$URL" ] && [ -n "${OPENSEARCH_URL:-}" ]; then
  URL="$OPENSEARCH_URL"
fi
URL="$(printf '%s' "$URL" | tr -d '\r' | sed -e 's/[[:space:]]*$//')"

# Strip any credentials before the URL is ever printed or used in a message.
safe_url() {
  printf '%s' "$1" | sed -E 's#(://)[^/@]*@#\1***@#'
}

if [ -z "$URL" ]; then
  if [ "$REQUIRE_ENABLED" = "true" ]; then
    echo "ERROR: OpenSearch endpoint is not configured but this release requires it (--require-enabled). Set OPENSEARCH_URL in $ENV_FILE." >&2
    exit 1
  fi
  echo "[opensearch] DISABLED — no OPENSEARCH_URL configured in $ENV_FILE. Search and discovery are intentionally disabled (optional infrastructure); no client is constructed."
  exit 0
fi

case "$URL" in
  http://*|https://*) ;;
  *) echo "ERROR: OPENSEARCH_URL is not an http(s) URL: '$(safe_url "$URL")'" >&2; exit 1 ;;
esac

# Host of the configured endpoint (credentials and port removed).
HOST="$(printf '%s' "$URL" | sed -E -e 's#^[a-zA-Z][a-zA-Z0-9+.-]*://##' -e 's#^[^/@]*@##' -e 's#[:/].*$##')"
[ -n "$HOST" ] || { echo "ERROR: cannot determine the OpenSearch host from '$(safe_url "$URL")'" >&2; exit 1; }

echo "[opensearch] configured endpoint: $(safe_url "$URL")"

wait_for_container_healthy() {
  local deadline="$1" start now status
  start="$(date +%s)"
  while :; do
    status="$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER" 2>/dev/null || echo "missing|none")"
    case "$status" in
      "running|healthy") echo "[opensearch] container '$CONTAINER' is running and healthy"; return 0 ;;
    esac
    now="$(date +%s)"
    if [ $((now - start)) -ge "$deadline" ]; then
      echo "[opensearch] container '$CONTAINER' did not become healthy within ${deadline}s (last state: $status)" >&2
      return 1
    fi
    sleep 3
  done
}

probe_from_api() {
  # Probe from INSIDE the API container: it shares the `tradingo-net` network
  # with the OpenSearch service, so this proves the DNS name the API will use
  # actually resolves and answers there. No container is created.
  local url="$1" out
  if ! docker inspect "$API_CONTAINER" >/dev/null 2>&1; then
    echo "ERROR: API container '$API_CONTAINER' not found — cannot prove the OpenSearch endpoint is reachable from the API network" >&2
    return 1
  fi
  out="$(docker exec "$API_CONTAINER" curl -s -o /dev/null -w '%{http_code}' --max-time "$PROBE_TIMEOUT_SEC" "${url%/}/_cluster/health" 2>/dev/null || echo 000)"
  case "$out" in
    200|201) echo "[opensearch] reachable from '$API_CONTAINER' (HTTP $out)"; return 0 ;;
    *) echo "ERROR: OpenSearch endpoint $(safe_url "$url") is NOT reachable from '$API_CONTAINER' (HTTP ${out:-000}). The API would start with an unreachable search endpoint." >&2; return 1 ;;
  esac
}

if [ "$HOST" = "$SERVICE" ]; then
  # The endpoint names the Compose-managed service: it must be running and
  # healthy in this deployment, and reachable under that DNS name.
  echo "[opensearch] endpoint refers to the compose service '$SERVICE' — verifying the managed container"
  wait_for_container_healthy "$DEADLINE_SEC" || exit 1
  probe_from_api "$URL" || exit 1
else
  echo "[opensearch] endpoint refers to an external host ('$HOST') — verifying reachability only"
  probe_from_api "$URL" || exit 1
fi

echo "[opensearch] OK — configured endpoint is reachable from the API container"
exit 0
