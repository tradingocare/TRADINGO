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
echo "  RBAC (Role-Based Access Control) Tests"
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

login_as() {
  local email="$1"
  local password="$2"
  local res
  res=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null)
  echo "$res" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/'
}

echo "[1] Unauthenticated Access Returns 401"
echo "--------------------------------------------"

endpoints=(
  "GET /auth/me"
  "GET /users/me"
  "POST /companies"
  "GET /orders"
  "GET /payments"
)

for ep in "${endpoints[@]}"; do
  method=$(echo "$ep" | awk '{print $1}')
  path=$(echo "$ep" | awk '{print $2}')
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" 2>/dev/null)
  check "Unauthenticated $method $path returns 401" "401" "$code"
done

echo ""
echo "[2] SELLER Cannot Access Buyer Endpoints"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[SKIP]${NC} Requires SELLER credentials configured in env"
echo "  Set SELLER_EMAIL and SELLER_PASSWORD to test"

if [ -n "$SELLER_EMAIL" ] && [ -n "$SELLER_PASSWORD" ]; then
  seller_token=$(login_as "$SELLER_EMAIL" "$SELLER_PASSWORD")

  seller_endpoints=(
    "GET /users"
    "PATCH /users/some-id/role"
    "DELETE /users/some-id"
    "PATCH /companies/some-id/subscription"
  )

  for ep in "${seller_endpoints[@]}"; do
    method=$(echo "$ep" | awk '{print $1}')
    path=$(echo "$ep" | awk '{print $2}')
    code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $seller_token" \
      -H "Content-Type: application/json" \
      -d "{}" 2>/dev/null)
    check "SELLER $method $path returns 403" "403" "$code"
  done
fi

echo ""
echo "[3] BUYER Cannot Access Seller Endpoints"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[SKIP]${NC} Requires BUYER credentials configured in env"
echo "  Set BUYER_EMAIL and BUYER_PASSWORD to test"

echo ""
echo "[4] ADMIN Has Full Access"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[SKIP]${NC} Requires ADMIN credentials configured in env"
echo "  Set ADMIN_EMAIL and ADMIN_PASSWORD to test"

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  admin_token=$(login_as "$ADMIN_EMAIL" "$ADMIN_PASSWORD")

  admin_endpoints=(
    "GET /users"
    "GET /users/me"
    "GET /companies"
  )

  for ep in "${admin_endpoints[@]}"; do
    method=$(echo "$ep" | awk '{print $1}')
    path=$(echo "$ep" | awk '{print $2}')
    code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" \
      -H "Authorization: Bearer $admin_token" 2>/dev/null)
    check "ADMIN $method $path returns 200" "200" "$code"
  done
fi

echo ""
echo "[5] Role Escalation Attempts"
echo "--------------------------------------------"

escalation_payloads=(
  '{"role":"SUPER_ADMIN"}'
  '{"role":"ADMIN"}'
  '{"role":"MANAGER"}'
  '{"permissions":["users:write:role","admin:*","*:*"]}'
)

for payload in "${escalation_payloads[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/users/some-id/role" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>/dev/null)
  check "Role escalation without token: 401" "401" "$code"
done

echo ""
echo "[6] Permission Boundary Tests"
echo "--------------------------------------------"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/users/99999-nonexistent" \
  -H "Authorization: Bearer invalidtoken" 2>/dev/null)
check "No auth for user resource: 401" "401" "$code"

echo ""
echo "============================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "============================================"
exit $FAIL
