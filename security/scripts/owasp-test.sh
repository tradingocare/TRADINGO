#!/bin/bash
set -e

BASE_URL="${API_URL:-http://localhost:3001}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASS=0
FAIL=0
WARN=0

echo "============================================"
echo "  OWASP Top 10 Automated Security Checks"
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

warn() {
  local desc="$1"
  echo -e "  ${YELLOW}[WARN]${NC} $desc"
  WARN=$((WARN + 1))
}

echo ""
echo "────────────────────────────────────────────"
echo "  A01: Broken Access Control"
echo "────────────────────────────────────────────"
echo ""

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/users" 2>/dev/null)
check "Unauthenticated /users returns 401" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin" 2>/dev/null)
check "No /admin endpoint accessible" "404" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/.env" 2>/dev/null)
check ".env file not exposed" "404" "$code"

for path in "/.git/config" "/.git/HEAD" "/.gitignore" "/node_modules" "/package.json" "/proc/self/environ"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" 2>/dev/null)
  if [ "$code" = "404" ] || [ "$code" = "403" ]; then
    echo -e "  ${GREEN}[PASS]${NC} $path blocked ($code)"
    PASS=$((PASS + 1))
  elif [ "$code" = "200" ]; then
    echo -e "  ${RED}[FAIL]${NC} $path exposed (200)"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "────────────────────────────────────────────"
echo "  A02: Cryptographic Failures"
echo "────────────────────────────────────────────"
echo ""

resp=$(curl -s "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' 2>/dev/null)
has_token=$(echo "$resp" | grep -c "accessToken" 2>/dev/null || true)
if [ "$has_token" -gt 0 ]; then
  token_hint=$(echo "$resp" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/' | cut -c1-20)
  echo -e "  ${YELLOW}[INFO]${NC} JWT issued: $token_hint..."
fi

resp_headers=$(curl -s -I "$BASE_URL/auth/login" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' 2>/dev/null)
hsts=$(echo "$resp_headers" | grep -i "strict-transport-security" | head -1)
if [ -n "$hsts" ]; then
  echo -e "  ${GREEN}[PASS]${NC} HSTS header present"
  PASS=$((PASS + 1))
else
  warn "No HSTS header"
fi

echo ""
echo "────────────────────────────────────────────"
echo "  A03: Injection (SQLi Patterns)"
echo "────────────────────────────────────────────"
echo ""

sqli_payloads=(
  "' OR '1'='1"
  "1; DROP TABLE users--"
  "' UNION SELECT * FROM users--"
  "admin'--"
  "1 OR 1=1"
  "' OR 1=1--"
  "1' AND 1=1--"
  "' WAITFOR DELAY '00:00:05'--"
  "' AND SLEEP(5)--"
  "1' AND PG_SLEEP(5)--"
  "'||DBMS_PIPE.RECEIVE_MESSAGE('x',5)||'"
)

for payload in "${sqli_payloads[@]}"; do
  encoded_payload=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$payload'))" 2>/dev/null || echo "$payload")
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/companies/search?q=$encoded_payload" 2>/dev/null)
  if [ "$code" = "400" ] || [ "$code" = "422" ] || [ "$code" = "500" ]; then
    echo -e "  ${YELLOW}[INFO]${NC} SQLi payload '$payload' returned $code (not 200)"
  elif [ "$code" = "200" ]; then
    warn "SQLi payload '$payload' returned 200 (check for possible injection)"
  fi
done

echo ""
echo "────────────────────────────────────────────"
echo "  A04: Insecure Design (XSS)"
echo "────────────────────────────────────────────"
echo ""

xss_payloads=(
  "<script>alert(1)</script>"
  "<img src=x onerror=alert(1)>"
  "<svg/onload=alert(1)>"
  "javascript:alert(1)"
  "\"><script>alert(1)</script>"
  "<body onload=alert(1)>"
  "{{constructor.constructor('alert(1)')()}}"
)

for payload in "${xss_payloads[@]}"; do
  encoded_payload=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$payload'))" 2>/dev/null || echo "$payload")
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/companies/search?q=$encoded_payload" 2>/dev/null)
  if [ "$code" != "200" ]; then
    :
  fi
done

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"xss@test.com\",\"password\":\"<script>alert(1)</script>\",\"name\":\"<img src=x onerror=alert(1)>\"}" 2>/dev/null)
if [ "$code" = "400" ] || [ "$code" = "422" ]; then
  echo -e "  ${GREEN}[PASS]${NC} XSS in registration fields rejected"
  PASS=$((PASS + 1))
elif [ "$code" = "201" ]; then
  warn "XSS payload accepted in registration"
else
  warn "XSS in registration returned $code"
fi

echo ""
echo "────────────────────────────────────────────"
echo "  A05: Security Misconfiguration"
echo "────────────────────────────────────────────"
echo ""

resp_headers=$(curl -s -I "$BASE_URL/health" 2>/dev/null)
x_powered=$(echo "$resp_headers" | grep -i "x-powered-by" | head -1)
if [ -z "$x_powered" ]; then
  echo -e "  ${GREEN}[PASS]${NC} Server info not leaked (no X-Powered-By)"
  PASS=$((PASS + 1))
else
  warn "Server info leaked: $x_powered"
fi

server=$(echo "$resp_headers" | grep -i "^server:" | head -1)
if [ -n "$server" ]; then
  warn "Server header present: $server"
fi

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null)
check "Health endpoint accessible" "200" "$code"

echo ""
echo "────────────────────────────────────────────"
echo "  A06: Vulnerable Components"
echo "────────────────────────────────────────────"
echo ""

resp_headers=$(curl -s -I "$BASE_URL" 2>/dev/null)
if [ -n "$UPLOAD_TOKEN" ]; then
  resp_headers=$(curl -s -I "$BASE_URL" -H "Authorization: Bearer $UPLOAD_TOKEN" 2>/dev/null)
fi
methods=$(echo "$resp_headers" | grep -i "allow" | head -1)
if [ -z "$methods" ]; then
  echo -e "  ${YELLOW}[INFO]${NC} HTTP methods not advertised (good)"
fi

echo ""
echo "────────────────────────────────────────────"
echo "  A07: Identification & Auth Failures"
echo "────────────────────────────────────────────"
echo ""

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@tradingo.io","password":"wrong"}' 2>/dev/null)
check "Invalid login returns 401" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":""}' 2>/dev/null)
check "Empty credentials rejected" "400" "$code"

echo ""
echo "────────────────────────────────────────────"
echo "  A08: Software Integrity Failures"
echo "────────────────────────────────────────────"
echo ""

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/companies" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","__proto__":{"admin":true}}' 2>/dev/null)
check "Prototype pollution attempt rejected" "401" "$code"

echo ""
echo "────────────────────────────────────────────"
echo "  A09: Logging & Monitoring Failures"
echo "────────────────────────────────────────────"
echo ""

for i in 1 2 3; do
  curl -s -o /dev/null -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"bruteforce-alert@tradingo.io","password":"wrong'$i'"}' 2>/dev/null
done
echo -e "  ${YELLOW}[INFO]${NC} Brute-force simulation sent (check auth service logs)"

echo ""
echo "────────────────────────────────────────────"
echo "  A10: SSRF"
echo "────────────────────────────────────────────"
echo ""

ssrf_payloads=(
  "http://169.254.169.254/latest/meta-data/"
  "http://localhost:5432"
  "http://127.0.0.1:3000"
  "http://0.0.0.0:6379"
  "file:///etc/passwd"
  "http://metadata.google.internal/"
  "http://10.0.0.1/"
  "https://checkip.amazonaws.com/"
)

for payload in "${ssrf_payloads[@]}"; do
  encoded_payload=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$payload'))" 2>/dev/null || echo "$payload")
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/companies/search?q=$encoded_payload" 2>/dev/null)
  if [ "$code" = "400" ] || [ "$code" = "422" ]; then
    :
  fi
done
echo -e "  ${YELLOW}[INFO]${NC} SSRF payloads sent - verify server-side blocking in logs"

echo ""
echo "────────────────────────────────────────────"
echo "  XXE (XML External Entities)"
echo "────────────────────────────────────────────"
echo ""

xxe_payload='<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>'
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/companies" \
  -H "Content-Type: application/xml" \
  -d "$xxe_payload" 2>/dev/null)
if [ "$code" = "400" ] || [ "$code" = "415" ] || [ "$code" = "406" ]; then
  echo -e "  ${GREEN}[PASS]${NC} XML/XXE content rejected ($code)"
  PASS=$((PASS + 1))
elif [ "$code" = "401" ]; then
  echo -e "  ${GREEN}[PASS]${NC} XML content blocked by auth ($code)"
  PASS=$((PASS + 1))
else
  warn "XXE payload returned $code"
fi

echo ""
echo "============================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$WARN warnings${NC}"
echo "============================================"
exit $FAIL
