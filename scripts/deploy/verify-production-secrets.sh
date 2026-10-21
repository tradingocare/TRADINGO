#!/usr/bin/env bash
# verify-production-secrets.sh — fail-closed pre-flight check of the production
# environment file, run BEFORE any migration or container replacement.
#
# Why this exists: the production configuration is only proven by the API's own
# boot-time validation, and that happens AFTER the live containers have been
# replaced. A missing or unusable AI_VAULT_MASTER_KEY (or a live-mode payment
# key) therefore surfaced as a crash-looping API AFTER the traffic switch.
# This gate moves that discovery to a point where nothing has been changed yet.
#
# It checks the NAMES and the SHAPE of the required entries only:
#   - presence of every required key
#   - a minimum length for the signing/vault keys (never the value itself)
#   - rejection of published/known-unsafe literals and of obvious placeholders
#   - the payment-mode gate (live mode requires real payment keys)
#
# The value of a secret is NEVER printed. A failure names the offending KEY and
# the reason, never its content.
#
# Env:
#   PROD_ENV_FILE       env file to check (default .env.production.local)
#   PROD_MIN_SECRET_LEN minimum length for JWT/vault keys (default 32)
#
# Usage: bash scripts/deploy/verify-production-secrets.sh [--env-file FILE]
# Exit 0 = the file contains a usable configuration. Exit 1 = it does not.
set -uo pipefail

ENV_FILE="${PROD_ENV_FILE:-.env.production.local}"
MIN_SECRET_LEN="${PROD_MIN_SECRET_LEN:-32}"
REQUIRE_ENABLED=false

while [ $# -gt 0 ]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --min-len) MIN_SECRET_LEN="$2"; shift 2 ;;
    --help|-h) echo "Usage: $0 [--env-file FILE] [--min-len N]"; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; exit 1 ;;
  esac
done

is_uint() { case "$1" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }
is_uint "$MIN_SECRET_LEN" || { echo "ERROR: MIN_SECRET_LEN must be a non-negative integer: '$MIN_SECRET_LEN'" >&2; exit 1; }

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: production environment file not found: $ENV_FILE (the tracked placeholder .env.production must never be used)" >&2
  exit 1
fi

# Read one key's value without sourcing the file and without echoing it.
env_value() {
  sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$ENV_FILE" | head -n 1 \
    | sed -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | tr -d '\r'
}

# Published defaults and obvious placeholders that must never reach production.
# The first list is the same set the API's ProductionConfigValidator rejects as
# KNOWN_UNSAFE_SECRETS; keeping the two aligned is asserted by the test suite.
KNOWN_UNSAFE="local-development-secret-key-32chars-minimum
local-development-refresh-secret-32chars-min
local-development-ai-vault-master-key-32chars-minimum
tradingo-ai-vault-default-key-change-in-production!"
PLACEHOLDER_PATTERNS="change-me change_me replace your_ your- yours <your- <secret dummy founder xxxxxx"

FAILURES=0
fail() { echo "ERROR: $1" >&2; FAILURES=$((FAILURES + 1)); }

# --- 1. Required keys must be present and non-empty -------------------------
REQUIRED_KEYS="JWT_SECRET JWT_REFRESH_SECRET AI_VAULT_MASTER_KEY DATABASE_URL REDIS_URL"
for key in $REQUIRED_KEYS; do
  value="$(env_value "$key")"
  if [ -z "$value" ]; then
    fail "required key '$key' is missing or empty in $ENV_FILE"
  fi
done

# --- 2. Signing/vault keys must have a usable length ------------------------
for key in JWT_SECRET JWT_REFRESH_SECRET AI_VAULT_MASTER_KEY; do
  value="$(env_value "$key")"
  [ -n "$value" ] || continue
  if [ "${#value}" -lt "$MIN_SECRET_LEN" ]; then
    fail "key '$key' is shorter than the required minimum of ${MIN_SECRET_LEN} characters"
  fi
done

# --- 3. No published default and no obvious placeholder --------------------
for key in JWT_SECRET JWT_REFRESH_SECRET AI_VAULT_MASTER_KEY; do
  value="$(env_value "$key")"
  [ -n "$value" ] || continue
  unsafe=false
  while IFS= read -r known; do
    [ -n "$known" ] || continue
    if [ "$(printf '%s' "$value" | tr 'A-Z' 'a-z')" = "$(printf '%s' "$known" | tr 'A-Z' 'a-z')" ]; then
      unsafe=true
    fi
  done <<EOF
$KNOWN_UNSAFE
EOF
  if [ "$unsafe" = "true" ]; then
    fail "key '$key' holds a publicly known development default — it must never be used in production"
  fi
  lowered="$(printf '%s' "$value" | tr 'A-Z' 'a-z')"
  for pattern in $PLACEHOLDER_PATTERNS; do
    case "$lowered" in
      *"$pattern"*) fail "key '$key' still contains a placeholder marker ('$pattern')" ;;
    esac
  done
done

# --- 4. Payment mode gate ---------------------------------------------------
PAYMENT_MODE="$(env_value PAYMENT_MODE)"
[ -n "$PAYMENT_MODE" ] && PAYMENT_MODE="$(printf '%s' "$PAYMENT_MODE" | tr 'A-Z' 'a-z')"
if [ "$PAYMENT_MODE" = "live" ]; then
  for key in RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET RAZORPAY_WEBHOOK_SECRET; do
    value="$(env_value "$key")"
    if [ -z "$value" ]; then
      fail "PAYMENT_MODE=live requires '$key' to be set"
    fi
  done
  razorpay_id="$(env_value RAZORPAY_KEY_ID)"
  if [ -n "$razorpay_id" ] && [ "${razorpay_id#rzp_live_}" = "$razorpay_id" ]; then
    fail "PAYMENT_MODE=live requires a live Razorpay key id (rzp_live_*)"
  fi
fi

# --- 5. OpenSearch is optional, but an unreachable value is not acceptable ---
OPENSEARCH_URL="$(env_value OPENSEARCH_URL)"
if [ -n "$OPENSEARCH_URL" ]; then
  case "$OPENSEARCH_URL" in
    http://*|https://*) ;;
    *) fail "OPENSEARCH_URL is not an http(s) URL" ;;
  esac
fi

if [ "$FAILURES" -gt 0 ]; then
  echo "::error::Production configuration pre-flight FAILED with $FAILURES problem(s) in $ENV_FILE. No value was printed. Nothing has been changed; resolve the configuration before deploying." >&2
  exit 1
fi

echo "Production configuration pre-flight OK: required keys present, length and placeholder checks passed, payment mode '$PAYMENT_MODE' consistent."
exit 0
