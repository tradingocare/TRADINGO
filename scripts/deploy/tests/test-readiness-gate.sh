#!/usr/bin/env bash
# test-readiness-gate.sh — regression tests for the bounded, fail-closed
# readiness gate added after run 39228403830: smoke UI checks must not run
# before the web endpoint (and API /health) actually answer HTTP 200.
#
# Covers: ready-immediately, ready-after-retries, never-ready (fail closed),
# non-200 treated as unready, API failure reported separately, unsafe
# CURL_MAX_TIME override rejected, workflow
# wiring/order (identity < readiness < smoke), fail-closed smoke gating in
# the extracted remote snippet (mocked), and presence of the existing
# backup/identity/marker safeguards.
# Usage: bash test-readiness-gate.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"
GATE="$ROOT/scripts/deploy/wait-for-ready.sh"
WF="$ROOT/.github/workflows/deploy-production.yml"

PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    *) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

if ! command -v node >/dev/null 2>&1; then
  echo "FATAL: node is required to run the readiness gate behavioural tests"
  exit 2
fi

TMP="$(mktemp -d)"
SERVER_PIDS=""
cleanup() { [ -n "$SERVER_PIDS" ] && kill $SERVER_PIDS 2>/dev/null; rm -rf "$TMP"; }
trap cleanup EXIT

free_port() {
  node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close();});'
}
start_server() { # port delay_ms http_code
  node -e 'const http=require("http");const p=Number(process.argv[1]),d=Number(process.argv[2]),c=Number(process.argv[3]);const s=http.createServer((q,r)=>{r.writeHead(c);r.end();});setTimeout(()=>s.listen(p,"127.0.0.1"),d);' "$1" "$2" "$3" >/dev/null 2>&1 &
  SERVER_PIDS="$SERVER_PIDS $!"
}

# R1: web + API ready immediately -> exit 0 with ready diagnostics.
P_WEB="$(free_port)"; P_API="$(free_port)"
start_server "$P_WEB" 0 200; start_server "$P_API" 0 200
if WEB_URL="http://127.0.0.1:$P_WEB/" API_URL="http://127.0.0.1:$P_API/health" \
   WEB_DEADLINE_SEC=10 API_DEADLINE_SEC=10 POLL_INTERVAL_SEC=1 \
   bash "$GATE" > "$TMP/r1.log" 2>&1; then
  if grep -q '\[ready\] web ready: HTTP 200' "$TMP/r1.log" && grep -q '\[ready\] API ready: HTTP 200' "$TMP/r1.log"; then
    report PASS R1 "ready-immediately accepted (exit 0)"
  else report FAIL R1 "exit 0 but ready diagnostics missing"; fi
else report FAIL R1 "ready endpoints rejected: $(tail -2 "$TMP/r1.log")"; fi

# R2: web ready only after several failed attempts -> exit 0, retries visible.
P_WEB="$(free_port)"; P_API="$(free_port)"
start_server "$P_WEB" 2500 200; start_server "$P_API" 0 200
if WEB_URL="http://127.0.0.1:$P_WEB/" API_URL="http://127.0.0.1:$P_API/health" \
   WEB_DEADLINE_SEC=20 API_DEADLINE_SEC=10 POLL_INTERVAL_SEC=1 \
   bash "$GATE" > "$TMP/r2.log" 2>&1; then
  if grep -q '\[ready\] web waiting:.*code=000' "$TMP/r2.log" && grep -q '\[ready\] web ready: HTTP 200' "$TMP/r2.log"; then
    report PASS R2 "ready-after-retries accepted with visible retry diagnostics"
  else report FAIL R2 "exit 0 but retry diagnostics missing"; fi
else report FAIL R2 "delayed-ready web rejected: $(tail -2 "$TMP/r2.log")"; fi

# R3: web never ready (closed port) -> fail closed before the API gate.
P_WEB="$(free_port)"; P_API="$(free_port)"
start_server "$P_API" 0 200
if WEB_URL="http://127.0.0.1:$P_WEB/" API_URL="http://127.0.0.1:$P_API/health" \
   WEB_DEADLINE_SEC=2 API_DEADLINE_SEC=10 POLL_INTERVAL_SEC=1 \
   bash "$GATE" > "$TMP/r3.log" 2>&1; then
  report FAIL R3 "never-ready web accepted (false pass)"
else
  if grep -q 'ERROR: web readiness not achieved within 2s' "$TMP/r3.log" && ! grep -q '\[ready\] API ready' "$TMP/r3.log"; then
    report PASS R3 "never-ready web fails closed with explicit diagnostics (API gate not reached)"
  else report FAIL R3 "failed without the expected web-readiness diagnostics"; fi
fi

# R3b: web answers non-200 (HTTP 500) -> still unready, fails closed.
P_WEB="$(free_port)"; P_API="$(free_port)"
start_server "$P_WEB" 0 500; start_server "$P_API" 0 200
if WEB_URL="http://127.0.0.1:$P_WEB/" API_URL="http://127.0.0.1:$P_API/health" \
   WEB_DEADLINE_SEC=2 API_DEADLINE_SEC=10 POLL_INTERVAL_SEC=1 \
   bash "$GATE" > "$TMP/r3b.log" 2>&1; then
  report FAIL R3b "HTTP 500 web endpoint accepted (false pass)"
else
  if grep -q 'last_code=500' "$TMP/r3b.log"; then
    report PASS R3b "non-200 web response treated as unready (last_code=500)"
  else report FAIL R3b "non-200 rejection without explicit last_code evidence"; fi
fi

# R4: dead API reported separately (web ready passed first).
P_WEB="$(free_port)"; P_API="$(free_port)"
start_server "$P_WEB" 0 200
if WEB_URL="http://127.0.0.1:$P_WEB/" API_URL="http://127.0.0.1:$P_API/health" \
   WEB_DEADLINE_SEC=10 API_DEADLINE_SEC=2 POLL_INTERVAL_SEC=1 \
   bash "$GATE" > "$TMP/r4.log" 2>&1; then
  report FAIL R4 "dead API accepted (false pass)"
else
  if grep -q '\[ready\] web ready' "$TMP/r4.log" && grep -q 'ERROR: API readiness not achieved within 2s' "$TMP/r4.log"; then
    report PASS R4 "API failure reported separately after web readiness passed"
  else report FAIL R4 "API failure not reported separately: $(tail -3 "$TMP/r4.log")"; fi
fi

# R4b: CURL_MAX_TIME=0 rejected (would disable the curl timeout entirely).
if CURL_MAX_TIME=0 WEB_URL="http://127.0.0.1:1/" API_URL="http://127.0.0.1:1/health" \
   bash "$GATE" > "$TMP/r4b.log" 2>&1; then
  report FAIL R4b "CURL_MAX_TIME=0 accepted (curl timeout could be disabled)"
else
  if grep -q 'CURL_MAX_TIME=0 would disable the curl timeout' "$TMP/r4b.log"; then
    report PASS R4b "CURL_MAX_TIME=0 rejected with explicit error before polling"
  else report FAIL R4b "rejected without explicit CURL_MAX_TIME error: $(tail -2 "$TMP/r4b.log")"; fi
fi

# R5: workflow wiring — order identity < readiness < smoke (invocation lines).
L_ID="$(grep -n 'verify-release-images.sh "\$TARGET_SHA" "\$GHCR_OWNER"' "$WF" | head -1 | cut -d: -f1)"
L_WAIT="$(grep -n 'bash scripts/deploy/wait-for-ready.sh' "$WF" | head -1 | cut -d: -f1)"
L_SMOKE="$(grep -n 'if bash scripts/deploy/smoke-test.sh http://localhost:3001' "$WF" | head -1 | cut -d: -f1)"
if [ -n "$L_ID" ] && [ -n "$L_WAIT" ] && [ -n "$L_SMOKE" ] \
   && [ "$L_ID" -lt "$L_WAIT" ] && [ "$L_WAIT" -lt "$L_SMOKE" ]; then
  report PASS R5 "order: identity ($L_ID) < readiness ($L_WAIT) < smoke ($L_SMOKE)"
else report FAIL R5 "wiring order wrong (identity=$L_ID readiness=$L_WAIT smoke=$L_SMOKE)"; fi

# R5b: readiness call guarded fail-closed, single invocation, errexit intact.
L_COUNT="$(grep -c 'bash scripts/deploy/wait-for-ready.sh' "$WF")"
if grep -q 'wait-for-ready.sh || { echo "ERROR' "$WF" && [ "$L_COUNT" -eq 1 ] \
   && grep -q 'set -euo pipefail' "$WF" && grep -q 'set -euo pipefail' "$GATE"; then
  report PASS R5b "readiness gate guarded fail-closed (single invocation, errexit)"
else report FAIL R5b "readiness gate not fail-closed guarded (invocations=$L_COUNT)"; fi

# R6: behavioural — extract the remote snippet (identity .. before release
# summary), mock the three invoked scripts, and prove: a readiness failure
# stops the run BEFORE smoke; an identity failure stops before both; all
# pass reaches smoke. The snippet is run WITHOUT set -e on purpose, so only
# the explicit fail-closed guards can stop it (stricter than production).
AWK_EXTRACT='/verify-release-images\.sh "\$TARGET_SHA"/{f=1} f && /=== Release summary ===/{exit} f{print}'
awk "$AWK_EXTRACT" "$WF" | tr -d '\r' > "$TMP/snippet.sh"
MK="$TMP/mocks"; mkdir -p "$MK"
cat > "$MK/identity.sh" <<'MOCK'
#!/usr/bin/env bash
echo invoked >> "$MOCK_DIR/identity.calls"
exit "${MOCK_IDENTITY_RC:-0}"
MOCK
cat > "$MK/wait.sh" <<'MOCK'
#!/usr/bin/env bash
echo invoked >> "$MOCK_DIR/wait.calls"
exit "${MOCK_WAIT_RC:-0}"
MOCK
cat > "$MK/smoke.sh" <<'MOCK'
#!/usr/bin/env bash
echo invoked >> "$MOCK_DIR/smoke.calls"
exit "${MOCK_SMOKE_RC:-0}"
MOCK
chmod +x "$MK/"*.sh
sed -e "s|bash scripts/deploy/verify-release-images.sh|bash \"$MK/identity.sh\"|" \
    -e "s|bash scripts/deploy/wait-for-ready.sh|bash \"$MK/wait.sh\"|" \
    -e "s|bash scripts/deploy/smoke-test.sh|bash \"$MK/smoke.sh\"|" \
    "$TMP/snippet.sh" > "$TMP/snippet-mocked.sh"
if grep -q 'wait.sh' "$TMP/snippet-mocked.sh" && grep -q 'smoke.sh' "$TMP/snippet-mocked.sh"; then
  run_snippet() { # identity_rc wait_rc smoke_rc -> echoes snippet exit code
    rm -f "$MK"/*.calls
    MOCK_DIR="$MK" MOCK_IDENTITY_RC="$1" MOCK_WAIT_RC="$2" MOCK_SMOKE_RC="$3" \
      TARGET_SHA=deadbeefcafebabe PREV_SHA=previousrelease GHCR_OWNER=tradingocare COMPOSE=true \
      bash "$TMP/snippet-mocked.sh" > "$TMP/snippet-run.log" 2>&1
    echo $?
  }
  RC="$(run_snippet 1 0 0)"
  if [ "$RC" -ne 0 ] && [ ! -f "$MK/wait.calls" ] && [ ! -f "$MK/smoke.calls" ]; then
    report PASS R6a "identity failure stops before readiness and smoke"
  else report FAIL R6a "identity failure mishandled (rc=$RC wait=$( [ -f "$MK/wait.calls" ] && echo called || echo skipped) smoke=$( [ -f "$MK/smoke.calls" ] && echo called || echo skipped))"; fi
  RC="$(run_snippet 0 1 0)"
  if [ "$RC" -ne 0 ] && [ -f "$MK/identity.calls" ] && [ ! -f "$MK/smoke.calls" ]; then
    report PASS R6b "readiness failure stops BEFORE smoke (smoke never invoked)"
  else report FAIL R6b "readiness failure mishandled (rc=$RC smoke=$( [ -f "$MK/smoke.calls" ] && echo called || echo skipped))"; fi
  RC="$(run_snippet 0 0 0)"
  if [ "$RC" -eq 0 ] && [ -f "$MK/smoke.calls" ]; then
    report PASS R6c "all-pass run reaches smoke and exits 0"
  else report FAIL R6c "all-pass run did not reach smoke (rc=$RC)"; fi
else
  report FAIL R6 "snippet extraction/mocking failed (wait.sh or smoke.sh not injected)"
fi

# R7: existing safeguards untouched by this change.
if grep -q 'manage.sh backup' "$WF" && grep -q 'verify-backup.sh' "$WF" \
   && grep -q 'verify-release-images.sh "\$TARGET_SHA" "\$GHCR_OWNER"' "$WF" \
   && grep -q 'echo "TRADINGO_DEPLOY_VERIFIED_OK target=\$TARGET_SHA"' "$WF"; then
  report PASS R7 "backup gate, identity guard and terminal marker all still present"
else report FAIL R7 "one of the existing safeguards is missing"; fi

echo "--------------------------------------------"
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
