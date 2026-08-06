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
check_json "API live status" "$BASE_URL/live" "status" "ok"
check_json "API ready status" "$BASE_URL/ready" "status" "ok"
check_json "API health status" "$BASE_URL/health" "status" "ok"

# API endpoints
check "API root"        "$BASE_URL/api/v1"           200
check "Categories"      "$BASE_URL/api/v1/categories?limit=1" 200
check "Products"        "$BASE_URL/api/v1/products?limit=1"   200

# Frontend
check "UI homepage"     "$UI_URL/"                   200
check "UI login"        "$UI_URL/login"              200
check "UI products"     "$UI_URL/products"           200
check "UI companies"    "$UI_URL/companies"          200
check "UI categories"   "$UI_URL/categories"         200
check "UI industries"   "$UI_URL/industries"         200
check "UI search"       "$UI_URL/search"             200

echo "============================================"
echo "Results: $PASS passed, $FAIL failed"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
