#!/usr/bin/env bash
# test-smoke-redirect-contract.sh — regression tests for the canonical-route
# contract assertions in scripts/deploy/smoke-test.sh.
#
# Context: the IA migration turned the legacy catalogue paths into permanent
# redirects (/products -> /product, /trading -> /product, /tradeserv ->
# /service, /browse -> /product). The smoke test previously asserted a bare
# HTTP 200 on /products without following redirects, so the migrated release
# failed its own production gate AFTER the containers were already switched.
#
# These tests drive the real smoke-test.sh against local python3 HTTP servers
# (no Docker, no database, no production, no network egress beyond loopback)
# and assert:
#   - a 308 to the canonical path passes
#   - a 308 to an UNEXPECTED destination fails
#   - a 302 (temporary) redirect fails
#   - a 404 fails
#   - a directly served 200 fails in strict mode and passes in non-strict mode
#   - an absolute Location header is accepted and compared by path
#   - routes that must be served directly still require HTTP 200
#
# Usage: bash test-smoke-redirect-contract.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"
SMOKE="$ROOT/scripts/deploy/smoke-test.sh"

PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    *) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

if ! command -v python3 >/dev/null 2>&1; then
  echo "FATAL: python3 is required to run the smoke redirect contract tests"
  exit 2
fi
if [ ! -f "$SMOKE" ]; then
  echo "FATAL: smoke-test.sh not found at $SMOKE"
  exit 2
fi

TMP="$(mktemp -d)"
PIDS=""
cleanup() { [ -n "$PIDS" ] && kill $PIDS 2>/dev/null; rm -rf "$TMP"; }
trap cleanup EXIT

free_port() {
  python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()'
}

# --- UI stub ---------------------------------------------------------------
cat > "$TMP/ui_server.py" <<'PYEOF'
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = int(sys.argv[1])
MODE = sys.argv[2]

LEGACY = {
    "/products": "/product",
    "/trading": "/product",
    "/tradeserv": "/service",
    "/browse": "/product",
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in LEGACY:
            if MODE == "direct":
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                self.wfile.write(b"ok")
                return
            if MODE == "notfound":
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"nf")
                return
            if MODE == "temporary":
                self.send_response(302)
                self.send_header("Location", LEGACY[path])
                self.end_headers()
                return
            if MODE == "redirect-wrong":
                self.send_response(308)
                self.send_header("Location", "/definitely-not-the-hub")
                self.end_headers()
                return
            if MODE == "redirect-absolute":
                self.send_response(308)
                self.send_header("Location", "http://127.0.0.1:%d%s" % (PORT, LEGACY[path]))
                self.end_headers()
                return
            self.send_response(308)
            self.send_header("Location", LEGACY[path])
            self.end_headers()
            return
        if MODE == "search-broken" and path == "/search":
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b"unavailable")
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"ok")


HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
PYEOF

# --- API stub --------------------------------------------------------------
cat > "$TMP/api_server.py" <<'PYEOF'
import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = int(sys.argv[1])


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/live", "/ready", "/health"):
            body = json.dumps({"statusCode": 200, "message": "ok", "data": {"status": "ok"}}).encode()
        elif path.startswith("/api/v1"):
            body = json.dumps({"statusCode": 200, "message": "ok", "data": []}).encode()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"nf")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)


HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
PYEOF

start_ui() { python3 "$TMP/ui_server.py" "$1" "$2" >/dev/null 2>&1 & PIDS="$PIDS $!"; sleep 0.7; }
start_api() { python3 "$TMP/api_server.py" "$1" >/dev/null 2>&1 & PIDS="$PIDS $!"; sleep 0.7; }
stop_all() { kill $PIDS 2>/dev/null; PIDS=""; sleep 0.3; }

run_smoke() { # ui_port api_port [env assignments...]
  local ui="$1" api="$2"; shift 2
  env "$@" bash "$SMOKE" "http://127.0.0.1:$api" "http://127.0.0.1:$ui" > "$TMP/out.log" 2>&1
  echo $?
}

# T1: the migrated release (308 -> canonical, relative Location) passes.
UI="$(free_port)"; API="$(free_port)"
start_ui "$UI" redirect-relative; start_api "$API"
rc="$(run_smoke "$UI" "$API")"
if [ "$rc" = "0" ] && grep -q "Results: .* 0 failed" "$TMP/out.log"; then
  report PASS T1 "canonical 308 redirects accepted (exit 0, 0 failed)"
else
  report FAIL T1 "expected exit 0 with 0 failed, got exit $rc: $(grep -E 'FAIL:|Results:' "$TMP/out.log" | head -5 | tr '\n' ' ')"
fi
if grep -q "PASS: UI products (legacy -> product hub) (308 -> /product)" "$TMP/out.log"; then
  report PASS T2 "the /products redirect check reports 308 -> /product"
else
  report FAIL T2 "missing 308 -> /product pass line: $(grep 'UI products' "$TMP/out.log" | head -2 | tr '\n' ' ')"
fi
stop_all

# T3: a redirect to an UNEXPECTED destination must fail.
UI="$(free_port)"; API="$(free_port)"
start_ui "$UI" redirect-wrong; start_api "$API"
rc="$(run_smoke "$UI" "$API")"
if [ "$rc" != "0" ] && grep -q "redirect target mismatch" "$TMP/out.log"; then
  report PASS T3 "redirect to an unexpected destination fails (exit $rc)"
else
  report FAIL T3 "expected failure on wrong redirect target, got exit $rc"
fi
stop_all

# T4: a temporary (302) redirect must fail.
UI="$(free_port)"; API="$(free_port)"
start_ui "$UI" temporary; start_api "$API"
rc="$(run_smoke "$UI" "$API")"
if [ "$rc" != "0" ] && grep -q "expected HTTP 308" "$TMP/out.log"; then
  report PASS T4 "302 redirect rejected (exit $rc)"
else
  report FAIL T4 "expected failure on 302, got exit $rc"
fi
stop_all

# T5: a 404 on a legacy route must fail.
UI="$(free_port)"; API="$(free_port)"
start_ui "$UI" notfound; start_api "$API"
rc="$(run_smoke "$UI" "$API")"
if [ "$rc" != "0" ] && grep -q "expected HTTP 308" "$TMP/out.log"; then
  report PASS T5 "404 on a legacy route rejected (exit $rc)"
else
  report FAIL T5 "expected failure on 404, got exit $rc"
fi
stop_all

# T6: directly served 200 fails in strict mode (the default).
UI="$(free_port)"; API="$(free_port)"
start_ui "$UI" direct; start_api "$API"
rc="$(run_smoke "$UI" "$API")"
if [ "$rc" != "0" ] && grep -q "expected a permanent redirect (308)" "$TMP/out.log"; then
  report PASS T6 "directly served 200 rejected in strict mode (exit $rc)"
else
  report FAIL T6 "expected strict-mode failure, got exit $rc"
fi
stop_all

# T7: directly served 200 is accepted in non-strict mode (pre-IA release).
UI="$(free_port)"; API="$(free_port)"
start_ui "$UI" direct; start_api "$API"
rc="$(run_smoke "$UI" "$API" SMOKE_STRICT_REDIRECTS=false)"
if [ "$rc" = "0" ] && grep -q "Results: .* 0 failed" "$TMP/out.log"; then
  report PASS T7 "non-strict mode accepts a directly served 200 (exit 0)"
else
  report FAIL T7 "expected exit 0 in non-strict mode, got $rc: $(grep -E 'FAIL:' "$TMP/out.log" | head -3 | tr '\n' ' ')"
fi
stop_all

# T8: an absolute Location header is accepted and compared by path.
UI="$(free_port)"; API="$(free_port)"
start_ui "$UI" redirect-absolute; start_api "$API"
rc="$(run_smoke "$UI" "$API")"
if [ "$rc" = "0" ] && grep -q "Results: .* 0 failed" "$TMP/out.log"; then
  report PASS T8 "absolute Location header accepted (exit 0)"
else
  report FAIL T8 "expected exit 0 with an absolute Location, got $rc: $(grep -E 'FAIL:' "$TMP/out.log" | head -3 | tr '\n' ' ')"
fi
stop_all

# T9: a route that must be served directly still requires HTTP 200.
UI="$(free_port)"; API="$(free_port)"
start_ui "$UI" search-broken; start_api "$API"
rc="$(run_smoke "$UI" "$API")"
if [ "$rc" != "0" ] && grep -q "FAIL: UI search" "$TMP/out.log"; then
  report PASS T9 "a directly served route still requires HTTP 200 (exit $rc)"
else
  report FAIL T9 "expected failure for a non-200 directly served route, got exit $rc"
fi
stop_all

# T10: the canonical hubs must still be verified directly.
if grep -q 'check "UI product hub"' "$SMOKE" && grep -q 'check "UI service hub"' "$SMOKE"; then
  report PASS T10 "the canonical hubs are still verified with HTTP 200"
else
  report FAIL T10 "canonical hub 200 checks missing from the smoke test"
fi

# T11: no bare 200 assertion on /products may remain.
if grep -q 'check "UI products"' "$SMOKE"; then
  report FAIL T11 "a bare 200 assertion on /products is still present"
else
  report PASS T11 "no bare 200 assertion on /products remains"
fi

# T12: the directly served UI routes must still be asserted with HTTP 200.
missing=""
for route in "UI homepage" "UI login" "UI companies" "UI categories" "UI industries" "UI search"; do
  grep -q "check \"$route\"" "$SMOKE" || missing="$missing $route"
done
if [ -z "$missing" ]; then
  report PASS T12 "every directly served UI route still has a 200 assertion"
else
  report FAIL T12 "missing 200 assertions for:$missing"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
