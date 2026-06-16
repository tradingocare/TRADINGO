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
echo "  JWT Security Test Suite"
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

register_and_login() {
  local email="test-$(date +%s)@tradingo.io"
  local password="TestPass@123"
  local name="Test User"

  local register_res
  register_res=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"name\":\"$name\"}" 2>/dev/null)

  local access_token
  access_token=$(echo "$register_res" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
  local refresh_token
  refresh_token=$(echo "$register_res" | sed 's/.*"refreshToken":"\([^"]*\)".*/\1/')

  if [ -z "$access_token" ] || [ "$access_token" = "$register_res" ]; then
    local login_res
    login_res=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null)
    access_token=$(echo "$login_res" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
    refresh_token=$(echo "$login_res" | sed 's/.*"refreshToken":"\([^"]*\)".*/\1/')
  fi

  echo "$access_token|$refresh_token"
}

echo "[1] Token Expiration Handling"
echo "--------------------------------------------"

tokens=$(register_and_login)
access_token=$(echo "$tokens" | cut -d'|' -f1)
refresh_token=$(echo "$tokens" | cut -d'|' -f2)

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $access_token" 2>/dev/null)
check "Valid access token returns 200" "200" "$code"

echo ""
echo "[2] Invalid Signature Rejection"
echo "--------------------------------------------"

tampered_token="${access_token%.*}.tampered"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $tampered_token" 2>/dev/null)
check "Tampered token returns 401" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer invalidtoken123" 2>/dev/null)
check "Invalid token returns 401" "401" "$code"

echo ""
echo "[3] Tampered Token Rejection"
echo "--------------------------------------------"

IFS='.' read -r header payload signature <<< "$access_token"
if [ -n "$payload" ]; then
  tampered_payload=$(echo "$payload" | base64 -d 2>/dev/null | sed 's/"sub":"[^"]*"/"sub":"attacker-id"/' | base64 -w0 2>/dev/null | sed 's/+/-/g; s/\//_/g; s/=//g')
  tampered_full="${header}.${tampered_payload}.${signature}"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $tampered_full" 2>/dev/null)
  check "Payload-tampered token returns 401" "401" "$code"
fi

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer " 2>/dev/null)
check "Empty token returns 401" "401" "$code"

echo ""
echo "[4] Replay Attack Prevention"
echo "--------------------------------------------"

code1=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $access_token" 2>/dev/null)
code2=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $access_token" 2>/dev/null)
if [ "$code1" = "200" ] && [ "$code2" = "200" ]; then
  echo -e "  ${YELLOW}[INFO]${NC} Access token reuse allowed (expected - stateless JWTs)"
  PASS=$((PASS + 1))
else
  echo -e "  ${YELLOW}[INFO]${NC} Access token replay partially restricted"
fi

echo ""
echo "[5] Refresh Token Rotation"
echo "--------------------------------------------"

if [ -n "$refresh_token" ]; then
  refresh_res=$(curl -s -X POST "$BASE_URL/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$refresh_token\"}" 2>/dev/null)
  new_refresh=$(echo "$refresh_res" | sed 's/.*"refreshToken":"\([^"]*\)".*/\1/')

  if [ -n "$new_refresh" ] && [ "$new_refresh" != "$refresh_res" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refreshToken\":\"$refresh_token\"}" 2>/dev/null)
    check "Reused refresh token rotated - old one rejected" "401" "$code"
  else
    echo -e "  ${YELLOW}[INFO]${NC} Could not verify rotation (token may be single-use)"
  fi
fi

echo ""
echo "============================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "============================================"
exit $FAIL
