#!/usr/bin/env bash
# test-backup-timeout-gates.sh — static + fixture tests for the timeout
# remediation: SSH/job timeout ordering, ssh-agent pin, backup verification.
# Usage: bash test-backup-timeout-gates.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../..}"
WF="$ROOT/.github/workflows/deploy-production.yml"
VB="$ROOT/scripts/deploy/verify-backup.sh"

PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    *) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

# B1: SSH backstop raised to 5400, old 2400 gone.
if grep -q "timeout 5400 ssh" "$WF" && ! grep -q "timeout 2400 ssh" "$WF"; then
  report PASS B1 "remote backstop is timeout 5400 ssh"
else report FAIL B1 "expected 'timeout 5400 ssh' and no 'timeout 2400 ssh'"; fi

# B2: job timeout 100, and SSH backstop strictly below it with >=5min margin.
JOB_MIN="$(grep -E "timeout-minutes:" "$WF" | head -1 | grep -oE "[0-9]+")"
SSH_SEC="$(grep -oE "timeout [0-9]+ ssh" "$WF" | head -1 | grep -oE "[0-9]+")"
if [ -n "$JOB_MIN" ] && [ -n "$SSH_SEC" ] \
   && [ "$JOB_MIN" -eq 100 ] && [ "$SSH_SEC" -eq 5400 ] \
   && [ $((JOB_MIN * 60 - SSH_SEC)) -ge 300 ]; then
  report PASS B2 "job=${JOB_MIN}min, ssh=${SSH_SEC}s, margin=$((JOB_MIN * 60 - SSH_SEC))s"
else report FAIL B2 "JOB_MIN=$JOB_MIN SSH_SEC=$SSH_SEC"; fi

# B3: ssh-agent pin moved to v0.10.0, v0.9.0 gone.
if grep -q "webfactory/ssh-agent@v0.10.0" "$WF" && ! grep -q "webfactory/ssh-agent@v0.9.0" "$WF"; then
  report PASS B3 "ssh-agent pinned at v0.10.0"
else report FAIL B3 "pin mismatch"; fi

# B4: stale-backup exception is an explicit opt-in dispatch input (default false).
if grep -q "skip_fresh_backup" "$WF" && grep -A4 "skip_fresh_backup:" "$WF" | grep -q "default: false"; then
  report PASS B4 "skip_fresh_backup input exists, default false"
else report FAIL B4 "input missing or not default-false"; fi

# B5: warn-and-continue backup language gone; fail-closed gate present.
if ! grep -q "warn-and-continue" "$WF" && grep -q "verify-backup.sh" "$WF"; then
  report PASS B5 "backup gate calls verify-backup.sh, warn-and-continue removed"
else report FAIL B5 "workflow backup wiring wrong"; fi

# B6: migration/recreate still exit-gated after the backup gate (ordering).
BK_LINE="$(grep -n "verify-backup.sh" "$WF" | head -1 | cut -d: -f1)"
MG_LINE="$(grep -n "Running migrations" "$WF" | head -1 | cut -d: -f1)"
UP_LINE="$(grep -n "Recreating services" "$WF" | head -1 | cut -d: -f1)"
if [ -n "$BK_LINE" ] && [ -n "$MG_LINE" ] && [ -n "$UP_LINE" ] \
   && [ "$BK_LINE" -lt "$MG_LINE" ] && [ "$MG_LINE" -lt "$UP_LINE" ]; then
  report PASS B6 "order: backup-gate($BK_LINE) < migrate($MG_LINE) < recreate($UP_LINE)"
else report FAIL B6 "BK=$BK_LINE MG=$MG_LINE UP=$UP_LINE"; fi

# Fixture tests for verify-backup.sh (isolated temp dirs, no docker).
mkfixture() { # $1=dir $2=status $3=ageSec $4=size $5=mkfile(yes/no)
  local d="$1"
  mkdir -p "$d/backups/logs"
  local ts; ts="$(date -u -d "@$(( $(date -u +%s) - $3 ))" '+%Y-%m-%dT%H:%M:%SZ')"
  local f="-"
  if [ "$5" = "yes" ]; then f="$d/backups/art.dump"; head -c "$4" /dev/zero > "$f" 2>/dev/null || true; fi
  printf 'status=%s\ntimestamp=%s\nfile=%s\nsize=%s\nentries=42\n' "$2" "$ts" "$f" "$4" > "$d/backups/logs/backup-status.txt"
}
run_vb() { # $1=dir
  ( cd "$1" && BACKUP_DIR="backups" bash "$VB" >/dev/null 2>&1 ); echo $?
}
run_vb_override() { # $1=dir
  ( cd "$1" && BACKUP_DIR="backups" ALLOW_STALE_BACKUP=true bash "$VB" >/dev/null 2>&1 ); echo $?
}

# B7: fresh OK backup passes.
d=$(mktemp -d); mkfixture "$d" OK 60 1024 yes
[ "$(run_vb "$d")" -eq 0 ] && report PASS B7 "fresh OK backup exits 0" || report FAIL B7 "fresh OK rejected"
rm -rf "$d"
# B8: stale backup fails closed.
d=$(mktemp -d); mkfixture "$d" OK 7200 1024 yes
[ "$(run_vb "$d")" -eq 1 ] && report PASS B8 "stale backup exits 1" || report FAIL B8 "stale accepted"
rm -rf "$d"
# B9: missing status fails closed; override warns through.
d=$(mktemp -d)
[ "$(run_vb "$d")" -eq 1 ] && report PASS B9a "missing status exits 1" || report FAIL B9a "missing accepted"
[ "$(run_vb_override "$d")" -eq 0 ] && report PASS B9b "override exits 0 with warning" || report FAIL B9b "override blocked"
rm -rf "$d"
# B10: zero-size artifact fails closed.
d=$(mktemp -d); mkfixture "$d" OK 60 0 yes
[ "$(run_vb "$d")" -eq 1 ] && report PASS B10 "zero-size artifact exits 1" || report FAIL B10 "zero-size accepted"
rm -rf "$d"
# B11: FAILED status fails closed.
d=$(mktemp -d); mkfixture "$d" FAILED 60 0 no
[ "$(run_vb "$d")" -eq 1 ] && report PASS B11 "FAILED status exits 1" || report FAIL B11 "FAILED accepted"
rm -rf "$d"
# B12: missing artifact file fails closed.
d=$(mktemp -d); mkfixture "$d" OK 60 1024 no
[ "$(run_vb "$d")" -eq 1 ] && report PASS B12 "missing artifact exits 1" || report FAIL B12 "missing artifact accepted"
rm -rf "$d"

echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
