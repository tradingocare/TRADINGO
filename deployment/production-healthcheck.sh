#!/bin/bash
set -euo pipefail

WEB_URL="${WEB_URL:-https://tradingo.com}"
API_URL="${API_URL:-https://api.tradingo.com}"
DB_URL="${DATABASE_URL:-}"
REDIS_URL="${REDIS_URL:-}"

echo "=== TRADINGO Production Health Check ==="
echo "Time: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo ""

FAILED=0

check() {
  local name=$1 url=$2 expected=${3:-200}
  local start=$(date +%s%N)
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
  local end=$(date +%s%N)
  local ms=$(( (end - start) / 1000000 ))
  
  if [ "$status" = "$expected" ]; then
    echo "  ✅ $name - $url (${ms}ms)"
  else
    echo "  ❌ $name - $url (HTTP $status, expected $expected, ${ms}ms)"
    FAILED=$((FAILED + 1))
  fi
}

echo "--- Web Application ---"
check "Homepage" "$WEB_URL"
check "Products" "$WEB_URL/products"
check "Search" "$WEB_URL/search?q=steel"

echo ""
echo "--- API Services ---"
check "Health" "$API_URL/api/health"
check "Products API" "$API_URL/api/v1/products?limit=1"
check "Categories API" "$API_URL/api/v1/categories"

echo ""
echo "--- Infrastructure ---"
if [ -n "${DB_URL}" ]; then
  echo "  Database: using connection string"
fi

if [ -n "${REDIS_URL}" ]; then
  echo "  Redis: using connection string"
fi

echo ""
echo "--- Summary ---"
if [ "$FAILED" -eq 0 ]; then
  echo "  ✅ All checks passed"
else
  echo "  ❌ $FAILED check(s) failed"
fi

exit "$FAILED"
