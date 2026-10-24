#!/usr/bin/env bash
# TRADINGO — pre-deploy backup verification gate.
#
# Fails closed unless a FRESH, VERIFIED backup exists: reads the status file
# written by scripts/deploy/backup-db.sh (backups/logs/backup-status.txt) and
# requires status=OK, a timestamp within MAX_AGE_SEC, and an existing
# non-empty artifact file. Runs on the VPS after the best-effort backup
# attempt and BEFORE any migration or service recreation.
#
# Environment:
#   BACKUP_DIR         backup directory (default: backups, relative to repo root)
#   MAX_AGE_SEC        max acceptable backup age in seconds (default: 2700 = 45 min)
#   ALLOW_STALE_BACKUP == "true": documented operator exception — warn and
#                      succeed without a fresh backup. Set only via the
#                      workflow's explicit dispatch input; never default true.
#
# Exit codes: 0 = verified backup present (or explicit exception);
#             1 = no usable backup (deployment must stop).
set -uo pipefail

BACKUP_DIR="${BACKUP_DIR:-backups}"
MAX_AGE_SEC="${MAX_AGE_SEC:-2700}"
ALLOW_STALE_BACKUP="${ALLOW_STALE_BACKUP:-false}"

STATUS_FILE="${BACKUP_DIR}/logs/backup-status.txt"

is_uint() { case "$1" in ''|*[!0-9]*) return 1;; *) return 0;; esac; }

# Config errors fail unconditionally: the stale-backup exception covers backup
# state, never a misconfigured gate.
is_uint "$MAX_AGE_SEC" || { echo "::error::MAX_AGE_SEC is not a non-negative integer: '$MAX_AGE_SEC'"; exit 1; }

stale_ok() {
  echo "::warning::Operator exception: proceeding without a fresh verified backup (ALLOW_STALE_BACKUP=true). Rollback would reuse the latest existing backup, if any."
  exit 0
}
fail_closed() {
  echo "::error::No fresh verified backup available: $1. Resolve backup health, or dispatch with the documented stale-backup exception."
  exit 1
}

if [ ! -f "$STATUS_FILE" ]; then
  [ "$ALLOW_STALE_BACKUP" = "true" ] && stale_ok
  fail_closed "status file $STATUS_FILE missing"
fi

B_STATUS="$(grep '^status=' "$STATUS_FILE" | tail -n 1 | cut -d= -f2)"
B_TS="$(grep '^timestamp=' "$STATUS_FILE" | tail -n 1 | cut -d= -f2)"
B_FILE="$(grep '^file=' "$STATUS_FILE" | tail -n 1 | cut -d= -f2)"
B_SIZE="$(grep '^size=' "$STATUS_FILE" | tail -n 1 | cut -d= -f2)"

[ "$B_STATUS" = "OK" ] || {
  [ "$ALLOW_STALE_BACKUP" = "true" ] && stale_ok
  fail_closed "last backup status is '$B_STATUS', not OK"
}

NOW="$(date -u +%s)"
THEN="$(date -u -d "$B_TS" +%s 2>/dev/null || echo 0)"
AGE=$((NOW - THEN))
if [ "$THEN" -eq 0 ] || [ "$AGE" -lt 0 ] || [ "$AGE" -gt "$MAX_AGE_SEC" ]; then
  [ "$ALLOW_STALE_BACKUP" = "true" ] && stale_ok
  fail_closed "backup timestamp '$B_TS' is missing, invalid, or older than ${MAX_AGE_SEC}s"
fi

if [ -z "$B_FILE" ] || [ "$B_FILE" = "-" ] || [ ! -f "$B_FILE" ]; then
  [ "$ALLOW_STALE_BACKUP" = "true" ] && stale_ok
  fail_closed "backup artifact '$B_FILE' does not exist"
fi
if ! is_uint "$B_SIZE" || [ "$B_SIZE" -le 0 ]; then
  [ "$ALLOW_STALE_BACKUP" = "true" ] && stale_ok
  fail_closed "backup artifact has invalid size '$B_SIZE'"
fi
# Stored size must match the actual artifact: a mismatch means the status
# file does not describe this artifact (tampering, partial write, or stale
# status). Integrity failure aborts even under the stale-backup exception,
# which covers backup *state*, never status corruption.
ACTUAL_SIZE="$(stat -c%s "$B_FILE" 2>/dev/null || echo -1)"
if [ "$ACTUAL_SIZE" != "$B_SIZE" ]; then
  fail_closed "backup size mismatch: status reports $B_SIZE bytes but artifact is $ACTUAL_SIZE bytes"
fi

echo "Verified backup: $B_FILE (${B_SIZE} bytes, age ${AGE}s)."
exit 0
