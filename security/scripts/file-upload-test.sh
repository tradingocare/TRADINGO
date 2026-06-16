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
echo "  File Upload Security Tests"
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

UPLOAD_TOKEN="${UPLOAD_TOKEN:-}"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

get_upload_url() {
  local filename="$1"
  local content="$2"
  if [ -n "$UPLOAD_TOKEN" ]; then
    curl -s -X POST "$BASE_URL/storage/upload-url" \
      -H "Authorization: Bearer $UPLOAD_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"fileName\":\"$filename\",\"contentType\":\"application/octet-stream\"}" 2>/dev/null
  else
    echo '{"uploadUrl":"http://localhost:3001/upload/test","publicUrl":"http://localhost:3001/uploads/test"}'
  fi
}

upload_file() {
  local filename="$1"
  local content="$2"
  local mime="$3"
  local temp_file="$TEMP_DIR/$filename"
  echo -n "$content" > "$temp_file"

  if [ -n "$UPLOAD_TOKEN" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/storage/upload" \
      -H "Authorization: Bearer $UPLOAD_TOKEN" \
      -F "file=@$temp_file;type=$mime" 2>/dev/null
  else
    curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/storage/upload" \
      -F "file=@$temp_file;type=$mime" 2>/dev/null
  fi
}

echo "[1] Malicious File Extensions"
echo "--------------------------------------------"

dangerous_extensions=(
  "shell.exe"
  "script.php"
  "malware.sh"
  "virus.bat"
  "exploit.msi"
  "payload.dll"
  "backdoor.vbs"
  "ransomware.jar"
  "webshell.asp"
  "c99.php5"
  "cmd.jsp"
  "attack.pl"
  "exploit.py"
  "hack.rb"
  "xss.shtml"
)

for ext in "${dangerous_extensions[@]}"; do
  code=$(upload_file "$ext" "malicious content" "application/octet-stream")
  if [ "$code" = "400" ] || [ "$code" = "415" ] || [ "$code" = "422" ]; then
    echo -e "  ${GREEN}[PASS]${NC} Extension .${ext##*.} rejected with $code"
    PASS=$((PASS + 1))
  elif [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo -e "  ${RED}[FAIL]${NC} Extension .${ext##*.} ACCEPTED ($code)"
    FAIL=$((FAIL + 1))
  elif [ "$code" = "000" ]; then
    echo -e "  ${YELLOW}[INFO]${NC} Extension .${ext##*.}: cannot reach server"
  elif [ "$code" = "401" ]; then
    echo -e "  ${YELLOW}[INFO]${NC} Extension .${ext##*.}: 401 (auth required, blocked)"
  fi
done

echo ""
echo "[2] Oversized Files (>10MB)"
echo "--------------------------------------------"

oversized_content=$(head -c 15728640 /dev/zero 2>/dev/null | base64 2>/dev/null || python3 -c "print('A'*15728640)" 2>/dev/null || echo "LARGE_CONTENT")
temp_large="$TEMP_DIR/largefile.bin"
dd if=/dev/zero bs=1024 count=15360 of="$temp_large" 2>/dev/null || \
  python3 -c "open('$temp_large','wb').write(b'\\0'*15728640)" 2>/dev/null || \
  echo -n "LARGE" > "$temp_large"

if [ -n "$UPLOAD_TOKEN" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/storage/upload" \
    -H "Authorization: Bearer $UPLOAD_TOKEN" \
    -F "file=@$temp_large;type=image/jpeg" 2>/dev/null)
else
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/storage/upload" \
    -F "file=@$temp_large;type=image/jpeg" 2>/dev/null)
fi
if [ "$code" = "413" ]; then
  echo -e "  ${GREEN}[PASS]${NC} File >10MB rejected with 413"
  PASS=$((PASS + 1))
elif [ "$code" = "400" ] || [ "$code" = "422" ]; then
  echo -e "  ${GREEN}[PASS]${NC} File >10MB rejected with $code"
  PASS=$((PASS + 1))
elif [ "$code" = "200" ] || [ "$code" = "201" ]; then
  echo -e "  ${RED}[FAIL]${NC} File >10MB ACCEPTED ($code)"
  FAIL=$((FAIL + 1))
else
  echo -e "  ${YELLOW}[INFO]${NC} File >10MB: received $code (check server limits)"
fi

echo ""
echo "[3] Content-Type Bypass"
echo "--------------------------------------------"

content_type_tests=(
  "shell.php:application/pdf"
  "image.jpg:text/html"
  "doc.pdf:application/x-php"
  "logo.png:application/x-javascript"
  "data.csv:application/x-sh"
)

for pair in "${content_type_tests[@]}"; do
  filename="${pair%%:*}"
  mime="${pair##*:}"
  code=$(upload_file "$filename" "content-type bypass" "$mime")
  if [ "$code" = "400" ] || [ "$code" = "415" ] || [ "$code" = "422" ]; then
    echo -e "  ${GREEN}[PASS]${NC} MIME mismatch $filename ($mime) rejected"
    PASS=$((PASS + 1))
  elif [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo -e "  ${RED}[FAIL]${NC} MIME bypass $filename ($mime) ACCEPTED"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "[4] Path Traversal in Filename"
echo "--------------------------------------------"

traversal_names=(
  "../../../etc/passwd"
  "..%2F..%2F..%2Fetc%2Fshadow"
  "....//....//....//etc/hosts"
  "..\\..\\..\\windows\\system32\\config"
  "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc"
  "foo/../../../etc/hosts"
  "bar/..\\..\\..\\boot.ini"
)

for tname in "${traversal_names[@]}"; do
  code=$(upload_file "$tname" "path traversal" "text/plain")
  if [ "$code" = "400" ] || [ "$code" = "422" ]; then
    echo -e "  ${GREEN}[PASS]${NC} Path traversal '$tname' rejected"
    PASS=$((PASS + 1))
  elif [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo -e "  ${RED}[FAIL]${NC} Path traversal '$tname' ACCEPTED"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "[5] SVG with Embedded Scripts"
echo "--------------------------------------------"

svg_xss_payloads=(
  '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
  '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'
  '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><use href="data:application/xml;base64,PHN2Zy9vbmxvYWQ9YWxlcnQoMSk="/></svg>'
  '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><a xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="javascript:alert(1)"><text x="10" y="20">click me</text></a></svg>'
)

for svg in "${svg_xss_payloads[@]}"; do
  temp_svg="$TEMP_DIR/attack.svg"
  echo -n "$svg" > "$temp_svg"
  if [ -n "$UPLOAD_TOKEN" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/storage/upload" \
      -H "Authorization: Bearer $UPLOAD_TOKEN" \
      -F "file=@$temp_svg;type=image/svg+xml" 2>/dev/null)
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/storage/upload" \
      -F "file=@$temp_svg;type=image/svg+xml" 2>/dev/null)
  fi
  if [ "$code" = "400" ] || [ "$code" = "415" ] || [ "$code" = "422" ]; then
    echo -e "  ${GREEN}[PASS]${NC} SVG with script rejected ($code)"
    PASS=$((PASS + 1))
  elif [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo -e "  ${RED}[FAIL]${NC} SVG with script ACCEPTED ($code)"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "============================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "============================================"
exit $FAIL
