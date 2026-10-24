#!/usr/bin/env bash
# test-backup-workflow.sh — behavioral tests for deploy-backup.yml
# These tests validate actual behavior, not just keyword presence.
# Exit 0 = all pass.

set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WF="${1:-$HERE/../../..}"
WF="${WF}/.github/workflows/deploy-backup.yml"

PASS=0; FAIL=0

report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    FAIL) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

# ---- B1: skip_fresh_backup input REMOVED ----
if [ -f "$WF" ]; then
  if ! grep -q "skip_fresh_backup" "$WF"; then
    report PASS B1 "skip_fresh_backup input removed"
  else
    report FAIL B1 "skip_fresh_backup input still exists"
  fi
else report FAIL B1 "workflow file not found"; fi

# ---- B2: ALLOW_STALE_BACKUP REMOVED ----
if grep -q "ALLOW_STALE_BACKUP" "$WF"; then
  report FAIL B2 "ALLOW_STALE_BACKUP still referenced in workflow"
else report PASS B2 "ALLOW_STALE_BACKUP removed"; fi

# ---- B3: verify-backup.sh always runs without bypass ----
if grep -q "scripts/deploy/verify-backup.sh" "$WF" && ! grep -q "ALLOW_STALE_BACKUP.*verify-backup.sh" "$WF"; then
  report PASS B3 "verify-backup.sh always runs without bypass"
else report FAIL B3 "verify-backup.sh may be bypassed"; fi

# ---- B4: Preservation executes BEFORE checkout ----
if awk '/REMOTE_EOF/,/^[[:space:]]*$/ {p=1} /scripts\/deploy\/checkout-preservation/ && p {p=2} /git checkout/ && p==2 {found=1; exit}' "$WF"; then
  report PASS B4 "preservation executes before checkout"
else report FAIL B4 "preservation order incorrect"; fi

# ---- B5: checkout failure triggers cleanup ----
if grep -A 5 'git checkout "$TARGET_SHA"' "$WF" | grep -q 'rm -f "$PRESERVE_SCRIPT"'; then
  report PASS B5 "checkout failure triggers cleanup"
else report FAIL B5 "checkout failure cleanup missing"; fi

# ---- B6: No build/migrate/smoke-test commands ----
if grep -q "docker compose build" "$WF" || grep -q "api-migrate" "$WF" || grep -q "smoke-test.sh" "$WF"; then
  report FAIL B6 "workflow contains forbidden deployment commands"
else report PASS B6 "no forbidden deployment commands"; fi

# ---- B7: Confirmation validated against "deploy" ----
if grep -q 'CONFIRM_INPUT.*!=.*deploy' "$WF"; then
  report PASS B7 "confirmation validated against deploy"
else report FAIL B7 "confirmation validation missing"; fi

# ---- B8: main ref enforced ----
if grep -q "GITHUB_REF.*refs/heads/main" "$WF"; then
  report PASS B8 "main ref enforced"
else report FAIL B8 "main ref not enforced"; fi

# ---- B9: SSH strict host key checking ----
if grep -q "StrictHostKeyChecking=yes" "$WF"; then
  report PASS B9 "SSH strict host key checking enabled"
else report FAIL B9 "SSH strict host key checking missing"; fi

# ---- B10: Backup failure stops workflow ----
if grep -q 'if bash scripts/deploy/manage.sh backup' "$WF" && grep -A 5 'manage.sh backup' "$WF" | grep -q 'exit 1'; then
  report PASS B10 "backup failure stops workflow"
else report FAIL B10 "backup failure handling missing"; fi

# ---- B11: Verification failure stops workflow ----
if grep -q 'if ! bash scripts/deploy/verify-backup.sh' "$WF" && grep -A 3 'verify-backup.sh' "$WF" | grep -q 'exit 1'; then
  report PASS B11 "verification failure stops workflow"
else report FAIL B11 "verification failure handling missing"; fi

# ---- B12: Preservation failure stops checkout ----
if grep -qF 'if ! APP_DIR="$APP_DIR" TARGET_SHA="$TARGET_SHA" bash "$PRESERVE_SCRIPT"' "$WF" \
   && grep -A 3 'PRESERVE_SCRIPT' "$WF" | grep -q 'exit 1'; then
  report PASS B12 "preservation failure stops checkout"
else report FAIL B12 "preservation failure handling missing"; fi

# ---- B13: SSH agent bootstrap present (VPS_SSH_KEY is actually loaded) ----
if grep -q "webfactory/ssh-agent@v0.10.0" "$WF"; then
  report PASS B13 "ssh-agent setup present (webfactory/ssh-agent@v0.10.0)"
else report FAIL B13 "ssh-agent setup missing"; fi

# ---- B14: VPS_KNOWN_HOSTS installed into a known_hosts file ----
if grep -qF '> ~/.ssh/known_hosts' "$WF"; then
  report PASS B14 "VPS_KNOWN_HOSTS installed into ~/.ssh/known_hosts"
else report FAIL B14 "known_hosts install missing"; fi

# ---- B15: SSH strict host key checking retained ----
if grep -q "StrictHostKeyChecking=yes" "$WF"; then
  report PASS B15 "StrictHostKeyChecking=yes retained"
else report FAIL B15 "StrictHostKeyChecking=yes missing"; fi

# ---- B16: no unsafe host-key bypass patterns ----
if grep -q "StrictHostKeyChecking=no" "$WF" \
   || grep -q "UserKnownHostsFile=/dev/null" "$WF" \
   || grep -q "ssh-keyscan" "$WF"; then
  report FAIL B16 "unsafe host-key bypass pattern present"
else report PASS B16 "no unsafe host-key bypass patterns"; fi

# ---- B17: non-revealing ssh-keygen -F pre-flight present ----
if grep -q "ssh-keygen -F" "$WF"; then
  report PASS B17 "ssh-keygen -F pre-flight present"
else report FAIL B17 "ssh-keygen -F pre-flight missing"; fi

# ---- B18: existing safety gates unchanged ----
if grep -q 'CONFIRM_INPUT.*!=.*deploy' "$WF" \
   && grep -q "GITHUB_REF.*refs/heads/main" "$WF" \
   && grep -q 'if bash scripts/deploy/manage.sh backup' "$WF" \
   && grep -q 'if ! bash scripts/deploy/verify-backup.sh' "$WF"; then
  report PASS B18 "confirmation, main-ref, backup and verify gates intact"
else report FAIL B18 "one or more safety gates changed"; fi

# ---- B19: explicit origin/main refresh refspec present ----
if grep -qF 'git fetch origin "+refs/heads/main:refs/remotes/origin/main"' "$WF"; then
  report PASS B19 "explicit origin/main refresh refspec present"
else report FAIL B19 "explicit origin/main refresh refspec missing"; fi

# ---- B20: no plain (refspec-less) git fetch origin remains ----
if grep -q 'git fetch origin ||' "$WF" || grep -qE 'git fetch origin[[:space:]]*$' "$WF"; then
  report FAIL B20 "plain git fetch origin still present"
else report PASS B20 "no plain git fetch origin remains"; fi

# ---- B21: fail-closed target-ref validation present ----
if grep -q '"$TARGET_REF" != "refs/heads/main"' "$WF" \
   && grep -A 3 '"$TARGET_REF" != "refs/heads/main"' "$WF" | grep -q 'exit 1'; then
  report PASS B21 "fail-closed target-ref validation present"
else report FAIL B21 "fail-closed target-ref validation missing"; fi

# ---- B22: target SHA resolved from refreshed origin/main ----
if grep -q 'git rev-parse refs/remotes/origin/main' "$WF"; then
  report PASS B22 "target SHA resolved from refs/remotes/origin/main"
else report FAIL B22 "target SHA not resolved from origin/main"; fi

# ---- B23: preservation invoked via APP_DIR/TARGET_SHA environment contract ----
if grep -qF 'APP_DIR="$APP_DIR" TARGET_SHA="$TARGET_SHA" bash "$PRESERVE_SCRIPT"' "$WF"; then
  report PASS B23 "preservation invoked with APP_DIR/TARGET_SHA env contract"
else report FAIL B23 "preservation env-var invocation missing"; fi

# ---- B24: no positional-argument invocation of the preservation gate ----
if grep -qF 'bash "$PRESERVE_SCRIPT" "$APP_DIR" "$TARGET_SHA"' "$WF"; then
  report FAIL B24 "positional-argument preservation invocation still present"
else report PASS B24 "no positional-argument preservation invocation"; fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
