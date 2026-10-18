#!/usr/bin/env bash
# test-deploy-backup-context.sh — Test that workflow uses correct GitHub Actions context

set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WF="${1:-$HERE/../../..}"
WF="${WF}/.github/workflows/deploy-backup.yml"

PASS=0
FAIL=0

report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    FAIL) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

# Test 1: Check that needs.validate is NOT used (since there's only one job)
if [ -f "$WF" ]; then
  if grep -q "needs.validate" "$WF"; then
    report FAIL C1 "needs.validate still referenced (should use steps.confirm directly)"
  else
    report PASS C1 "no invalid needs.validate references"
  fi
else
  report FAIL C1 "workflow file not found at $WF"
fi

# Test 2: Check that steps.confirm.outputs.target_ref is used
if [ -f "$WF" ]; then
  if grep -q "steps.confirm.outputs.target_ref" "$WF"; then
    report PASS C2 "steps.confirm.outputs.target_ref correctly referenced"
  else
    report FAIL C2 "steps.confirm.outputs.target_ref not found"
  fi
else
  report FAIL C2 "workflow file not found"
fi

# Test 3: Check that no job-level outputs are declared
# Job-level outputs appear at 4-space indentation under jobs.<job>;
# step-level outputs appear at 6+ spaces under steps.<id>.
if [ -f "$WF" ]; then
  if grep -qE '^    outputs:' "$WF"; then
    report FAIL C3 "job-level outputs still present (not needed for single job)"
  else
    report PASS C3 "no job-level outputs declaration"
  fi
else
  report FAIL C3 "workflow file not found"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
