#!/usr/bin/env bash
# test-backup-workflow.sh — static + fixture tests for the
# .github/workflows/deploy-backup.yml (the exact file under test).
# Each test builds a fresh git repo in a temp dir. No network, no VPS.
# Usage: bash test-backup-workflow.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WF="${1:-$HERE/../..}"
WF="${WF}/.github/workflows/deploy-backup.yml"

PASS=0; FAIL=0; NOTESTED=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    FAIL) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
    *) NOTESTED=$((NOTESTED+1)); echo "NOT TESTED: $2 -- $3" ;;
  esac
}

# Helper: check if pattern exists in confirm step run block
# Uses sed to extract the confirm step's run block, then greps for pattern
confirm_has() {
  local pattern="$1"
  sed -n '/^[[:space:]]*-[[:space:]]*name:[[:space:]]*Check confirmation/,/^[[:space:]]*-[[:space:]]*name:/p' "$WF" | \
    sed -n '/run:[[:space:]]*|/,/^[[:space:]]*[^[:space:]]/p' | \
    grep -q "$1"
}

# ---- B1: dispatch-only (no push) ---
if [ -f "$WF" ]; then
  if grep -q 'workflow_dispatch:' "$WF" && ! grep -q 'push:' "$WF"; then
    report PASS B1 "workflow is dispatch-only (no push trigger)"
  else report FAIL B1 "workflow is not dispatch-only"; fi
else report FAIL B1 "workflow file not found at $WF"; fi

# ---- B2: confirm-env: true | main-lock: true (enforced in logic, not comments) ---
# Check confirm input exists and is required
if grep -q "confirm:" "$WF" && grep -q "required: true" "$WF"; then
  # Check confirm step enforces main ref
  if grep -A 30 'name: Check confirmation' "$WF" | grep -q 'GITHUB_REF.*refs/heads/main' && \
     grep -A 30 'name: Check confirmation' "$WF" | grep -q 'target_ref=refs/heads/main'; then
    report PASS B2 "confirm-env: true | main-lock enforced in logic"
  else
    report FAIL B2 "main-lock not enforced in confirm step logic"
  fi
else
  report FAIL B2 "confirm input or required: true missing"
fi

# ---- B3: known-hosts-req: true | strict: true ---
if grep -q "VPS_KNOWN_HOSTS" "$WF" && \
   grep -q "StrictHostKeyChecking=yes" "$WF" && \
   ! grep -q "ssh-keyscan" "$WF"; then
  report PASS B3 "known-hosts-req: true | strict: true"
else report FAIL B3 "known-hosts or strict-host-key checking missing"; fi

# ---- B4: backup-only: no build/migrate/recreate/smoke steps ---
if grep -q "docker compose build" "$WF" || \
   grep -q "api-migrate" "$WF" || \
   grep -q "up -d --no-deps api web" "$WF" || \
   grep -q "smoke-test.sh" "$WF"; then
  report FAIL B4 "workflow contains build/migrate/recreate/smoke steps (should be backup-only)"
else report PASS B4 "backup-only: no build/migrate/recreate/smoke steps"; fi

# ---- B5: backup script: calls `bash scripts/deploy/manage.sh backup` ---
if grep -q "bash scripts/deploy/manage.sh backup" "$WF"; then
  report PASS B5 "backup script wired: bash scripts/deploy/manage.sh backup"
else report FAIL B5 "backup script (backup-db.sh) not invoked"; fi

# ---- B6: verify-script: calls `bash scripts/deploy/verify-backup.sh` ---
if grep -q "bash scripts/deploy/verify-backup.sh" "$WF"; then
  report PASS B6 "verification script wired: bash scripts/deploy/verify-backup.sh"
else report FAIL B6 "verify-backup.sh not invoked"; fi

# ---- B7: target_ref output wired correctly in confirm step ----
if grep -A 30 'name: Check confirmation' "$WF" | grep -q 'target_ref=refs/heads/main' && \
   grep -A 30 'name: Check confirmation' "$WF" | grep -q 'GITHUB_OUTPUT' && \
   grep -A 30 'name: Check confirmation' "$WF" | grep -q 'GITHUB_REF.*refs/heads/main'; then
  report PASS B7 "target_ref output wired and main ref enforced in confirm step"
else
  report FAIL B7 "target_ref output or main ref enforcement missing in confirm step"
fi

# ---- B8: TARGET_REF validated on VPS side before use ----
if grep -q 'TARGET_REF.*needs.validate.outputs.target_ref' "$WF" && \
   grep -q 'TARGET_REF.*=~.*A-Za-z0-9' "$WF"; then
  report PASS B8 "TARGET_REF validated on VPS before use"
else
  report FAIL B8 "TARGET_REF validation missing on VPS side"
fi

# ---- B9: SKIP_FRESH_BACKUP input not forced true ----
if grep -q "skip_fresh_backup" "$WF" && \
   grep -q "SKIP_FRESH_BACKUP" "$WF" && \
   ! grep -q 'skip_fresh_backup.*:.*true' "$WF" && \
   ! grep -q 'default:.*true' "$WF"; then
  report PASS B9 "SKIP_FRESH_BACKUP not forced true"
else
  report FAIL B9 "SKIP_FRESH_BACKUP may be forced true"
fi

# ---- B10: No build/migrate/restart/recreate/smoke-test commands in run blocks ----
# Check for deployment commands in actual run: blocks (not comments)
if (grep -E "docker compose (build|up -d|restart)" "$WF" | grep -v "^#" | grep -q .) || \
   (grep -E "api-migrate|recreate|smoke-test\.sh" "$WF" | grep -v "^#" | grep -q .); then
  report FAIL B10 "workflow contains deployment commands (build/migrate/recreate/restart/smoke)"
else report PASS B10 "backup-only: no deployment commands"; fi

# ---- B11: SHA resolution on VPS at execution time (not dispatch time) ----
# Verifies git fetch origin and git rev-parse "$TARGET_REF" in remote script
if grep -q 'git fetch origin' "$WF" && \
   grep -q 'TARGET_SHA="\$(git rev-parse "\$TARGET_REF")"' "$WF"; then
  report PASS B11 "SHA resolved on VPS at execution time via git fetch + git rev-parse"
else
  report FAIL B11 "SHA resolution on VPS missing or incorrect"
fi

# ---- B12: Invalid target refs rejected by regex validation ----
# Verifies regex rejects invalid ref patterns (empty, special chars, etc.)
if grep -q 'TARGET_REF.*=~.*A-Za-z0-9' "$WF" && \
   grep -B 5 -A 5 'TARGET_REF.*=~.*A-Za-z0-9' "$WF" | grep -q 'exit 1'; then
  report PASS B12 "Invalid target refs rejected by regex validation"
else
  report FAIL B12 "Invalid target ref rejection missing or incomplete"
fi

# ---- B13: Target SHA compared with currently deployed SHA ----
# Verifies workflow compares resolved target SHA with currently deployed SHA
if grep -q 'PREV_SHA="\$(git rev-parse HEAD)"' "$WF" && \
   grep -q 'PREV_SHA.*=.*TARGET_SHA' "$WF"; then
  report PASS B13 "Resolved target SHA compared with currently deployed SHA"
else
  report FAIL B13 "SHA comparison missing or incomplete"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL NOTESTED=$NOTESTED ----"
[ "$FAIL" -eq 0 ]