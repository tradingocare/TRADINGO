#!/usr/bin/env bash
# test-release-image-identity.sh — regression tests for the fail-closed release
# identity guard: a deployment may not be reported successful unless the
# RUNNING api/web containers are exactly the SHA-tagged GHCR release images,
# and the remote script reaches its terminal verified-complete marker.
# Usage: bash test-release-image-identity.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"
WF="$ROOT/.github/workflows/deploy-production.yml"
GUARD="$ROOT/scripts/deploy/verify-release-images.sh"

PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    *) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

# G1: workflow invokes the guard with TARGET_SHA and GHCR_OWNER.
if grep -q 'verify-release-images.sh "\$TARGET_SHA" "\$GHCR_OWNER"' "$WF"; then
  report PASS G1 "workflow calls verify-release-images.sh with TARGET_SHA + GHCR_OWNER"
else report FAIL G1 "guard invocation missing in workflow"; fi

# G2: workflow asserts the checkout landed on the exact release commit.
if grep -q 'git rev-parse HEAD' "$WF" && grep -q 'expected \$TARGET_SHA' "$WF"; then
  report PASS G2 "checkout HEAD vs TARGET_SHA assertion present"
else report FAIL G2 "checkout HEAD assertion missing"; fi

# G3: terminal marker emitted by the remote script and enforced by the runner.
if grep -q 'echo "TRADINGO_DEPLOY_VERIFIED_OK target=\$TARGET_SHA"' "$WF" \
   && grep -q "grep -q 'TRADINGO_DEPLOY_VERIFIED_OK target='" "$WF"; then
  report PASS G3 "terminal marker emitted and runner-side grep enforced"
else report FAIL G3 "marker emission or runner-side grep missing"; fi

# G4: remote output is captured with tee so the marker can be verified.
if grep -q 'tee "\$RUNNER_TEMP/deploy-remote.log"' "$WF"; then
  report PASS G4 "remote output captured via tee"
else report FAIL G4 "tee capture missing (marker cannot be verified)"; fi

# G5: immutable identities are logged (image ID + registry digest).
if grep -q 'RELEASE_IMAGE \$name tag=\$img id=\$id digest=\$digest' "$WF"; then
  report PASS G5 "release image id/digest logging present"
else report FAIL G5 "release image id/digest logging missing"; fi

# Behavioural tests against the guard with a mocked docker CLI.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin"

cat > "$TMP/bin/docker" <<'MOCK'
#!/usr/bin/env bash
# Minimal docker mock: only the inspect calls the guard performs.
if [ "$1" = "inspect" ]; then
  ctr="${!#}"
  case "$ctr" in
    tradingo-api) [ -n "${MOCK_API_RUNNING:-}" ] || exit 1; echo "$MOCK_API_RUNNING" ;;
    tradingo-web) [ -n "${MOCK_WEB_RUNNING:-}" ] || exit 1; echo "$MOCK_WEB_RUNNING" ;;
    *) exit 1 ;;
  esac
elif [ "$1" = "image" ] && [ "$2" = "inspect" ]; then
  img="${!#}"
  case "$img" in
    *tradingo-api:*) [ -n "${MOCK_API_EXPECTED:-}" ] || exit 1; echo "$MOCK_API_EXPECTED" ;;
    *tradingo-web:*) [ -n "${MOCK_WEB_EXPECTED:-}" ] || exit 1; echo "$MOCK_WEB_EXPECTED" ;;
    *) exit 1 ;;
  esac
else
  exit 1
fi
MOCK
chmod +x "$TMP/bin/docker"

SHA="0123456789abcdef0123456789abcdef01234567"

# G6: matching identities -> exit 0.
if PATH="$TMP/bin:$PATH" MOCK_API_RUNNING=sha256:aaa MOCK_API_EXPECTED=sha256:aaa \
   MOCK_WEB_RUNNING=sha256:bbb MOCK_WEB_EXPECTED=sha256:bbb \
   bash "$GUARD" "$SHA" tradingocare > "$TMP/out-ok.log" 2>&1; then
  report PASS G6 "matching image identities accepted"
else report FAIL G6 "matching identities rejected: $(tail -2 "$TMP/out-ok.log")"; fi

# G7: stale running api container -> exit 1 with explicit mismatch evidence.
if PATH="$TMP/bin:$PATH" MOCK_API_RUNNING=sha256:old MOCK_API_EXPECTED=sha256:new \
   MOCK_WEB_RUNNING=sha256:bbb MOCK_WEB_EXPECTED=sha256:bbb \
   bash "$GUARD" "$SHA" tradingocare > "$TMP/out-bad.log" 2>&1; then
  report FAIL G7 "stale api container accepted (false pass)"
else
  if grep -q "is running sha256:old" "$TMP/out-bad.log"; then
    report PASS G7 "stale api container rejected with explicit evidence"
  else report FAIL G7 "rejected but without explicit mismatch evidence"; fi
fi

# G8: missing release image locally -> exit 1.
if PATH="$TMP/bin:$PATH" MOCK_API_RUNNING=sha256:aaa \
   MOCK_WEB_RUNNING=sha256:bbb MOCK_WEB_EXPECTED=sha256:bbb \
   bash "$GUARD" "$SHA" tradingocare > "$TMP/out-missing.log" 2>&1; then
  report FAIL G8 "missing release image accepted (false pass)"
else
  if grep -q "not present locally" "$TMP/out-missing.log"; then
    report PASS G8 "missing release image rejected with explicit evidence"
  else report FAIL G8 "rejected without explicit 'not present locally' evidence"; fi
fi

echo "--------------------------------------------"
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
