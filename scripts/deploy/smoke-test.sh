#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${STAGING_URL:-http://localhost:3001}}"
UI_URL="${2:-${STAGING_UI_URL:-http://localhost:3000}}"
PASS=0
FAIL=0

red() { printf "\033[31m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }

check() {
  local label="$1" url="$2" expected="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expected" ]; then
    green "PASS: $label ($code)"
    PASS=$((PASS + 1))
  else
    red "FAIL: $label (expected $expected, got $code)"
    FAIL=$((FAIL + 1))
  fi
}

# Strictness of the redirect contract assertions (see check_redirect below).
# true  = a legacy route MUST permanently redirect to its canonical hub
# false = a directly served 200 is also accepted (pre-IA releases only)
SMOKE_STRICT_REDIRECTS="${SMOKE_STRICT_REDIRECTS:-true}"

# Asserts a canonical-route contract: the URL must either be served directly
# (200, only in non-strict mode) or answer with a 308 Permanent Redirect whose
# Location header resolves to exactly the expected path. The Location header
# may be relative ("/product") or absolute ("https://host/product"); only the
# path is compared. Any other status, or a redirect to an unexpected
# destination, fails with an actionable message.
check_redirect() {
  local label="$1" url="$2" expected_location="$3"
  local headers status location path
  headers="$(curl -s -o /dev/null -D - --max-time 10 "$url" 2>/dev/null | tr -d '\r' || true)"
  status="$(printf '%s\n' "$headers" | awk 'toupper($1) ~ /^HTTP\// {code=$2} END {print code+0}')"
  [ "$status" = "0" ] && status="000"
  location="$(printf '%s\n' "$headers" | awk 'tolower($1)=="location:" {sub(/^[^:]*:[[:space:]]*/,""); sub(/[[:space:]]+$/,""); print; exit}')"
  # Normalise an absolute Location to its path; keep a relative one as-is.
  path="$(printf '%s' "$location" | sed -E 's#^[a-zA-Z][a-zA-Z0-9+.-]*://[^/]+##')"
  [ -n "$path" ] || path="$location"

  if [ "$status" = "200" ]; then
    if [ "$SMOKE_STRICT_REDIRECTS" = "true" ]; then
      red "FAIL: $label — expected a permanent redirect (308) to '$expected_location', got HTTP 200 (served directly). The canonical route contract is not in effect."
      FAIL=$((FAIL + 1))
    else
      green "PASS: $label (200, served directly — non-strict mode)"
      PASS=$((PASS + 1))
    fi
    return
  fi

  if [ "$status" != "308" ]; then
    red "FAIL: $label — expected HTTP 308 to '$expected_location', got HTTP ${status:-000}${location:+ (location: $location)}"
    FAIL=$((FAIL + 1))
    return
  fi

  if [ "$path" != "$expected_location" ]; then
    red "FAIL: $label — redirect target mismatch: expected '$expected_location', got '$path' (HTTP 308). The canonical route contract is broken."
    FAIL=$((FAIL + 1))
    return
  fi

  green "PASS: $label (308 -> $expected_location)"
  PASS=$((PASS + 1))
}

check_json() {
  local label="$1" url="$2" field="$3" expected="$4"
  local val
  val=$(curl -s --max-time 10 "$url" 2>/dev/null | FIELD="$field" python3 -c 'import json, os, sys
path = os.environ["FIELD"].split(".")
try:
    data = json.load(sys.stdin)
except Exception:
    print("")
    raise SystemExit(0)
for key in path:
    if isinstance(data, dict):
        data = data.get(key, "")
    else:
        data = ""
        break
print("" if isinstance(data, (dict, list)) else data)' 2>/dev/null || echo "")
  if [ "$val" = "$expected" ]; then
    green "PASS: $label ($val)"
    PASS=$((PASS + 1))
  else
    red "FAIL: $label (expected $expected, got $val)"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================"
echo "  TRADINGO Smoke Tests"
echo "  API: $BASE_URL"
echo "  UI:  $UI_URL"
echo "  Time: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "============================================"

# Health endpoints
check "API live"        "$BASE_URL/live"             200
check "API ready"       "$BASE_URL/ready"            200
check "API health"      "$BASE_URL/health"           200
# The API wraps every response in the standard envelope
# {statusCode, message, data, timestamp}, so status lives at data.status.
check_json "API live status" "$BASE_URL/live" "data.status" "ok"
check_json "API ready status" "$BASE_URL/ready" "data.status" "ok"
check_json "API health status" "$BASE_URL/health" "data.status" "ok"

# API endpoints
check "API root"        "$BASE_URL/api/v1"           200
check "Categories"      "$BASE_URL/api/v1/categories?limit=1" 200
check "Products"        "$BASE_URL/api/v1/products?limit=1"   200

# Frontend — routes that are directly served must answer 200.
check "UI homepage"     "$UI_URL/"                   200
check "UI login"        "$UI_URL/login"              200
check "UI companies"    "$UI_URL/companies"          200
check "UI categories"   "$UI_URL/categories"         200
check "UI industries"   "$UI_URL/industries"         200
check "UI search"       "$UI_URL/search"             200

# Frontend — routes that the IA migration turned into permanent redirects.
# These are asserted as a ROUTE CONTRACT, not as a bare status code: the
# response must be a 308 whose Location points at exactly the canonical hub.
# A redirect to any other destination is a failure, so a wrong target can
# never be mistaken for a healthy release.
#
# SMOKE_STRICT_REDIRECTS=true (default) additionally requires the redirect to
# be present. Set it to false ONLY when verifying a release that predates the
# IA migration (for example after a manual rollback to such a release), where
# the legacy path is still served directly with 200.
check_redirect "UI products (legacy -> product hub)" "$UI_URL/products" "/product"
check_redirect "UI trading (legacy -> product hub)"  "$UI_URL/trading"  "/product"
check_redirect "UI tradeserv (legacy -> service hub)" "$UI_URL/tradeserv" "/service"
check_redirect "UI browse (legacy -> product hub)"   "$UI_URL/browse"  "/product"

# The canonical hubs the redirects point at must themselves be served.
check "UI product hub"  "$UI_URL/product"            200
check "UI service hub"  "$UI_URL/service"            200

echo "============================================"
echo "Results: $PASS passed, $FAIL failed"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
