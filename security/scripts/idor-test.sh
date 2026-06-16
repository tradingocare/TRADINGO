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
echo "  IDOR (Insecure Direct Object Reference)"
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

register_user() {
  local email="user-$(date +%s)-$1@tradingo.io"
  local password="TestPass@123"
  local name="User $1"
  local res
  res=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"name\":\"$name\"}" 2>/dev/null)
  local access_token
  access_token=$(echo "$res" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
  if [ -z "$access_token" ] || [ "$access_token" = "$res" ]; then
    local login_res
    login_res=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null)
    access_token=$(echo "$login_res" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
  fi
  local user_id
  user_id=$(echo "$res" | sed 's/.*"id":"\([^"]*\)".*/\1/')
  echo "$access_token|$user_id"
}

echo "[1] User A Cannot Access User B's Orders"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[SKIP]${NC} Requires existing order IDs from env"
echo "  Set USER_A_TOKEN, USER_B_TOKEN, and USER_B_ORDER_ID to test"

if [ -n "$USER_A_TOKEN" ] && [ -n "$USER_B_ORDER_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/orders/$USER_B_ORDER_ID" \
    -H "Authorization: Bearer $USER_A_TOKEN" 2>/dev/null)
  check "User A cannot access User B's order" "403" "$code"
fi

echo ""
echo "[2] User A Cannot Modify User B's RFQ"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[SKIP]${NC} Requires USER_A_TOKEN, USER_B_RFQ_ID"

if [ -n "$USER_A_TOKEN" ] && [ -n "$USER_B_RFQ_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/rfqs/$USER_B_RFQ_ID" \
    -H "Authorization: Bearer $USER_A_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Hacked RFQ Title"}' 2>/dev/null)
  check "User A cannot modify User B's RFQ" "403" "$code"

  code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/rfqs/$USER_B_RFQ_ID" \
    -H "Authorization: Bearer $USER_A_TOKEN" 2>/dev/null)
  check "User A cannot delete User B's RFQ" "403" "$code"
fi

echo ""
echo "[3] User A Cannot View User B's Profile"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[SKIP]${NC} Requires USER_A_TOKEN and USER_B_ID"

if [ -n "$USER_A_TOKEN" ] && [ -n "$USER_B_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/users/$USER_B_ID" \
    -H "Authorization: Bearer $USER_A_TOKEN" 2>/dev/null)
  check "Non-admin user cannot view another user's profile" "403" "$code"
fi

echo ""
echo "[4] IDOR Across Roles"
echo "--------------------------------------------"
echo -e "  ${YELLOW}[SKIP]${NC} Requires ADMIN_TOKEN, SELLER_TOKEN, BUYER_TOKEN"

if [ -n "$ADMIN_TOKEN" ] && [ -n "$SELLER_COMPANY_ID" ] && [ -n "$BUYER_COMPANY_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/companies/$SELLER_COMPANY_ID" \
    -H "Authorization: Bearer $BUYER_TOKEN" 2>/dev/null)
  check "BUYER cannot access SELLER company details (no owner)" "403" "$code"
fi

echo ""
echo "[5] Sequential ID Enumeration"
echo "--------------------------------------------"

if [ -n "$VALID_TOKEN" ]; then
  local_ids=(1 2 3 100 1000 99999)
  attempts=0
  successes=0
  for id in "${local_ids[@]}"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/users/$id" \
      -H "Authorization: Bearer $VALID_TOKEN" 2>/dev/null)
    if [ "$code" != "401" ] && [ "$code" != "403" ] && [ "$code" != "404" ]; then
      successes=$((successes + 1))
    fi
    attempts=$((attempts + 1))
  done
  if [ "$successes" -eq 0 ]; then
    echo -e "  ${GREEN}[PASS]${NC} Sequential ID enumeration blocked"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}[FAIL]${NC} $successes/$attempts IDs returned non-error (possible enumeration)"
    FAIL=$((FAIL + 1))
  fi
else
  echo -e "  ${YELLOW}[INFO]${NC} Set VALID_TOKEN to test sequential ID enumeration"
fi

echo ""
echo "--------------------------------------------"
echo "IDOR Direct Tests (parameter tampering)"
echo "--------------------------------------------"

echo -e "  ${YELLOW}[INFO]${NC} These tests verify the API rejects IDOR patterns."
echo ""

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/companies/nonexistent-company-id-12345/profile-completion" 2>/dev/null)
check "No-auth access to company profile returns 401" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/companies/invalid/owners" \
  -H "Content-Type: application/json" \
  -d '{"userId":"attacker-id"}' 2>/dev/null)
check "No-auth owner addition returns 401" "401" "$code"

echo ""
echo "============================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "============================================"
exit $FAIL
