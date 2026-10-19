#!/usr/bin/env bash
# wait-for-ready.sh — bounded, fail-closed endpoint readiness gate that runs
# BEFORE smoke tests in the production deploy workflow.
#
# Why this exists: in run 39228403830 (2026-10-19), `compose up -d` recreated
# tradigo-web and the smoke test started ~400ms later — before the Next.js
# server had bound port 3000 (the server logged "Ready" at +0.8s). All seven
# UI checks failed with instant connection-refused ("000000") on a release
# that was in fact healthy, turning the run red. Smoke tests must only run
# once the real endpoints answer.
#
# Behaviour: polls the web endpoint, then the API /health endpoint, until each
# answers HTTP 200 or its deadline (wall-clock seconds) expires. On expiry the
# gate exits 1 with explicit per-endpoint diagnostics, so the deployment stops
# BEFORE smoke tests (fail closed). It never recreates containers, never
# touches image identity verification, and never touches backup verification.
#
# Env (all optional):
#   WEB_URL            default http://localhost:3000/
#   API_URL            default http://localhost:3001/health
#   WEB_DEADLINE_SEC   default 60  (observed web bind time: ~0.8s)
#   API_DEADLINE_SEC   default 30
#   POLL_INTERVAL_SEC  default 1
#   CURL_MAX_TIME      default 3   (per-request timeout; must be >= 1 —
#                      curl --max-time 0 disables the timeout entirely)
#
# Usage: bash scripts/deploy/wait-for-ready.sh
# Regression tests: scripts/deploy/tests/test-readiness-gate.sh
set -euo pipefail

WEB_URL="${WEB_URL:-http://localhost:3000/}"
API_URL="${API_URL:-http://localhost:3001/health}"
WEB_DEADLINE_SEC="${WEB_DEADLINE_SEC:-60}"
API_DEADLINE_SEC="${API_DEADLINE_SEC:-30}"
POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-1}"
CURL_MAX_TIME="${CURL_MAX_TIME:-3}"

is_uint() { case "$1" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }
for name in WEB_DEADLINE_SEC API_DEADLINE_SEC POLL_INTERVAL_SEC CURL_MAX_TIME; do
  value="${!name}"
  is_uint "$value" || { echo "ERROR: $name is not a non-negative integer: '$value'"; exit 1; }
done
# curl treats --max-time 0 as "no timeout", which would let a single hung
# request stall a poll forever despite the wall-clock deadline. Require >= 1.
if [ "$CURL_MAX_TIME" -eq 0 ]; then
  echo "ERROR: CURL_MAX_TIME=0 would disable the curl timeout; use a value >= 1"
  exit 1
fi

wait_service() {
  local name="$1" url="$2" deadline="$3"
  local start attempt=0 code elapsed
  start="$(date +%s)"
  while :; do
    attempt=$((attempt + 1))
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time "$CURL_MAX_TIME" "$url" 2>/dev/null)" || code="000"
    elapsed=$(( $(date +%s) - start ))
    if [ "$code" = "200" ]; then
      echo "[ready] $name ready: HTTP 200 after ${elapsed}s (attempt $attempt) $(date -u +%H:%M:%SZ)"
      return 0
    fi
    if [ "$elapsed" -ge "$deadline" ]; then
      echo "ERROR: $name readiness not achieved within ${deadline}s (attempts=$attempt last_code=$code url=$url) $(date -u +%H:%M:%SZ)"
      return 1
    fi
    echo "[ready] $name waiting: attempt=$attempt code=$code elapsed=${elapsed}s/${deadline}s $(date -u +%H:%M:%SZ)"
    sleep "$POLL_INTERVAL_SEC"
  done
}

echo "[ready] gate start $(date -u +%H:%M:%SZ) web=$WEB_URL (deadline ${WEB_DEADLINE_SEC}s) api=$API_URL (deadline ${API_DEADLINE_SEC}s)"
wait_service web "$WEB_URL" "$WEB_DEADLINE_SEC" || { echo "ERROR: web did not become ready; smoke tests NOT attempted"; exit 1; }
wait_service API "$API_URL" "$API_DEADLINE_SEC" || { echo "ERROR: API did not become ready; smoke tests NOT attempted"; exit 1; }
echo "[ready] all endpoints ready $(date -u +%H:%M:%SZ)"
