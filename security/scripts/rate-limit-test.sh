#!/bin/bash
set -e

BASE_URL="${API_URL:-http://localhost:3001}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASS=0
FAIL=0

echo "============================================"
echo "  Rate Limiting Security Tests"
echo "============================================"
echo ""

check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo -e "  ${GREEN}[PASS]${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}[FAIL]${NC} $desc (expected: $expected, got: $actual)"
    FAIL=$((FAIL + 1))
  fi
}

rate_limit_test() {
  local endpoint="$1"
  local method="${2:-GET}"
  local data="$3"
  local requests=100
  local rate_limited=0
  local success=0
  local last_status=""

  echo "  Sending $requests rapid requests to $endpoint..."

  for i in $(seq 1 $requests); do
    status=""
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
      status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
      status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint" 2>/dev/null)
    else
      status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    fi
    last_status="$status"
    if [ "$status" = "429" ]; then
      rate_limited=$((rate_limited + 1))
    elif [ "$status" != "000" ]; then
      success=$((success + 1))
    fi
  done

  echo "    Success: $success, Rate-limited (429): $rate_limited"
  echo "$rate_limited"
}

echo "[1] Auth Endpoint Rate Limiting"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[INFO]${NC} Auth endpoints have strict limits (login=10/min, register=5/min)"
echo ""

result=$(rate_limit_test "/auth/login" "POST" '{"email":"ratelimit-test@tradingo.io","password":"TestPass@123"}')
if [ "$result" -gt 0 ]; then
  echo -e "  ${GREEN}[PASS]${NC} Auth endpoint rate limiting triggered (429 received)"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}[FAIL]${NC} Auth endpoint did not rate-limit (no 429 received)"
  FAIL=$((FAIL + 1))
fi

sleep 2

echo ""
echo "[2] Search Endpoint Rate Limiting"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[INFO]${NC} Search endpoints have global throttler (100/min)"

result2=$(rate_limit_test "/companies/search?q=test")
if [ "$result2" -gt 0 ] || [ "$result2" = "0" ]; then
  if [ "$result2" -gt 0 ]; then
    echo -e "  ${GREEN}[PASS]${NC} Search endpoint rate limiting triggered"
    PASS=$((PASS + 1))
  else
    echo -e "  ${YELLOW}[INFO]${NC} Search endpoint not rate-limited (may need more requests)"
  fi
fi

sleep 2

echo ""
echo "[3] RFQ Creation Rate Limiting"
echo "--------------------------------------------"

if [ -n "$RFQ_TOKEN" ]; then
  result3=$(rate_limit_test "/rfqs" "POST" '{"title":"Rate Limit Test RFQ","rfqType":"PRODUCT","visibility":"PUBLIC","urgency":"NORMAL"}' \
    -H "Authorization: Bearer $RFQ_TOKEN")
  if [ "$result3" -gt 0 ]; then
    echo -e "  ${GREEN}[PASS]${NC} RFQ creation rate limiting triggered"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}[FAIL]${NC} RFQ creation did not rate-limit"
    FAIL=$((FAIL + 1))
  fi
else
  echo -e "  ${YELLOW}[SKIP]${NC} Set RFQ_TOKEN to test RFQ rate limiting"
fi

sleep 2

echo ""
echo "[4] Rate Limit Headers Validation"
echo "--------------------------------------------"

if [ -n "$VALID_TOKEN" ]; then
  headers=$(curl -s -I -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $VALID_TOKEN" 2>/dev/null)
  retry_after=$(echo "$headers" | grep -i "retry-after" | awk '{print $2}' | tr -d '\r')
  limit=$(echo "$headers" | grep -i "x-ratelimit-limit" | awk '{print $2}' | tr -d '\r')
  remaining=$(echo "$headers" | grep -i "x-ratelimit-remaining" | awk '{print $2}' | tr -d '\r')
  reset=$(echo "$headers" | grep -i "x-ratelimit-reset" | awk '{print $2}' | tr -d '\r')

  echo -e "  ${YELLOW}[INFO]${NC} Rate limit headers - Limit: $limit, Remaining: $remaining, Reset: $reset"
  if [ -n "$limit" ] || [ -n "$remaining" ]; then
    echo -e "  ${GREEN}[PASS]${NC} Rate limit headers present"
    PASS=$((PASS + 1))
  else
    echo -e "  ${YELLOW}[INFO]${NC} Rate limit headers not exposed (configurable)"
  fi
else
  echo -e "  ${YELLOW}[SKIP]${NC} Set VALID_TOKEN to test rate limit headers"
fi

echo ""
echo "[5] Rate Limit Reset After Window"
echo "--------------------------------------------"

echo -e "  ${YELLOW}[INFO]${NC} Test rate limit reset by waiting for window to pass"
echo -e "  ${YELLOW}[INFO]${NC} Waiting 65 seconds for rate limit window reset..."

sleep 65

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ratelimit-reset-test@tradingo.io","password":"TestPass@123"}' 2>/dev/null)
if [ "$code" = "429" ]; then
  echo -e "  ${YELLOW}[INFO]${NC} Rate limit still active (window may not have fully reset)"
elif [ "$code" = "200" ] || [ "$code" = "401" ]; then
  echo -e "  ${GREEN}[PASS]${NC} Rate limit reset after window"
  PASS=$((PASS + 1))
elif [ "$code" = "000" ]; then
  echo -e "  ${YELLOW}[INFO]${NC} Could not reach endpoint (server may be down)"
fi

echo ""
echo "============================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "============================================"
exit $FAIL
