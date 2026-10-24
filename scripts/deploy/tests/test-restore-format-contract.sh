#!/usr/bin/env bash
# test-restore-format-contract.sh — regression tests for the backup/restore
# format contract.
#
# The defect: the backup writes a PostgreSQL CUSTOM-FORMAT archive
# (pg_dump --format=custom, magic "PGDMP"), while the documented restore
# command assumed a gzip-compressed plain-SQL file and piped it into psql —
# a path that cannot read a custom archive. The mismatch was never exercised.
#
# The contract now is:
#   - the format is detected from the artefact's MAGIC BYTES, never the name;
#   - a custom archive is validated with `pg_restore --list` before restoring;
#   - the target database must be named explicitly (no default target);
#   - the restore refuses to write into an existing database without the
#     explicit authorization flag;
#   - the source artefact is never modified.
#
# Runs against a mocked `docker` — no database, no container, no production.
#
# Usage: bash test-restore-format-contract.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"
SCRIPT="$ROOT/scripts/deploy/restore-backup.sh"
WRAPPER="$ROOT/scripts/backup/restore-postgres.sh"
MANAGE="$ROOT/scripts/deploy/manage.sh"

PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    *) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

# ---- mocked docker ---------------------------------------------------------
cat > "$TMP/docker" <<EOF
#!/usr/bin/env bash
state="$TMP"
printf '%s\n' "\$*" >> "\$state/docker.log"
case "\$1" in
  inspect)
    if [ "\$2" = "--format" ]; then
      fmt="\$3"
      case "\$fmt" in
        *State.Running*) echo "true" ;;
        *) echo "cid" ;;
      esac
      exit 0
    fi
    exit 0
    ;;
  exec)
    # "docker exec <container> <command> <args...>"
    cmd=""
    for a in "\$@"; do
      case "\$a" in
        pg_restore|psql|createdb) cmd="\$a"; break ;;
      esac
    done
    case "\$cmd" in
      pg_restore)
        if printf '%s\n' "\$*" | grep -q -- '--list'; then
          cat "\$state/toc_ok" 2>/dev/null || exit 0
          exit 0
        fi
        cat > /dev/null
        exit 0
        ;;
      psql)
        if printf '%s\n' "\$*" | grep -q 'pg_database'; then
          cat "\$state/db_exists" 2>/dev/null || echo ""
        elif printf '%s\n' "\$*" | grep -q 'pg_tables'; then
          cat "\$state/table_count" 2>/dev/null || echo "12"
        else
          echo '{"statusCode":200,"data":{"status":"ok"}}'
        fi
        exit 0
        ;;
      createdb) exit 0 ;;
      *) exit 0 ;;
    esac
    ;;
esac
exit 0
EOF
chmod +x "$TMP/docker"
export PATH="$TMP:$PATH"
printf '' > "$TMP/db_exists"
printf '12' > "$TMP/table_count"

run() { bash "$SCRIPT" "$@" > "$TMP/out.log" 2>&1; echo $?; }

# ---- fixtures --------------------------------------------------------------
# custom-format archive (magic bytes only; the archive itself is validated by
# the mocked pg_restore)
printf 'PGDMP' > "$TMP/custom.dump"
head -c 2000 /dev/urandom >> "$TMP/custom.dump" 2>/dev/null || true
# gzip-compressed plain SQL
printf -- '-- PostgreSQL database dump\nCREATE TABLE t (id int);\n' | gzip -c > "$TMP/plain.sql.gz"
# gzip of binary noise
head -c 512 /dev/urandom | gzip -c > "$TMP/noise.sql.gz" 2>/dev/null || true
# unsupported format
printf 'not a postgres archive at all' > "$TMP/random.bin"
# a corrupt custom archive (valid magic, but pg_restore --list fails)
printf 'PGDMP' > "$TMP/corrupt.dump"
printf 'garbage' >> "$TMP/corrupt.dump"

echo "--- format detection ---"

# R1: a custom archive is accepted (the format the backup actually produces).
rc="$(run --file "$TMP/custom.dump" --target-db scratch_db)"
if [ "$rc" = "0" ] && grep -q "detected format: custom" "$TMP/out.log"; then
  report PASS R1 "a custom-format archive is accepted and detected from its magic bytes"
else
  report FAIL R1 "expected a successful custom-format restore, got exit $rc: $(tail -3 "$TMP/out.log" | tr '\n' ' ')"
fi

# R2: a gzip plain-SQL dump is accepted.
rc="$(run --file "$TMP/plain.sql.gz" --target-db scratch_db)"
if [ "$rc" = "0" ] && grep -q "detected format: gzip" "$TMP/out.log"; then
  report PASS R2 "a gzip-compressed plain-SQL dump is accepted"
else
  report FAIL R2 "expected a successful gzip restore, got exit $rc: $(tail -3 "$TMP/out.log" | tr '\n' ' ')"
fi

# R3: gzip of binary noise is refused.
rc="$(run --file "$TMP/noise.sql.gz" --target-db scratch_db)"
if [ "$rc" != "0" ] && grep -q "does not contain a recognisable plain-SQL dump" "$TMP/out.log"; then
  report PASS R3 "a gzip archive without SQL content is refused"
else
  report FAIL R3 "expected a refusal for non-SQL gzip content, got exit $rc"
fi

# R4: an unsupported format is refused.
rc="$(run --file "$TMP/random.bin" --target-db scratch_db)"
if [ "$rc" != "0" ] && grep -q "unsupported backup format" "$TMP/out.log"; then
  report PASS R4 "an unsupported format is refused with a clear message"
else
  report FAIL R4 "expected an unsupported-format refusal, got exit $rc"
fi

# R5: a missing file is refused.
rc="$(run --file "$TMP/does-not-exist.dump" --target-db scratch_db)"
if [ "$rc" != "0" ] && grep -q "not found" "$TMP/out.log"; then
  report PASS R5 "a missing artefact is refused"
else
  report FAIL R5 "expected a missing-file refusal, got exit $rc"
fi

echo "--- target and authorization ---"

# R6: no target -> refused.
rc="$(run --file "$TMP/custom.dump")"
if [ "$rc" != "0" ] && grep -q "target-db is required" "$TMP/out.log"; then
  report PASS R6 "a restore without an explicit target is refused (no default target)"
else
  report FAIL R6 "expected a missing-target refusal, got exit $rc"
fi

# R7: an existing target without authorization -> refused.
printf '1' > "$TMP/db_exists"
rc="$(run --file "$TMP/custom.dump" --target-db live_db)"
if [ "$rc" != "0" ] && grep -q "already exists" "$TMP/out.log" && grep -q "allow-overwrite" "$TMP/out.log"; then
  report PASS R7 "an existing target database is refused without explicit authorization"
else
  report FAIL R7 "expected an overwrite refusal, got exit $rc: $(tail -2 "$TMP/out.log" | tr '\n' ' ')"
fi

# R8: an existing target WITH authorization -> proceeds.
rc="$(run --file "$TMP/custom.dump" --target-db live_db --allow-overwrite)"
if [ "$rc" = "0" ]; then
  report PASS R8 "an existing target is restored when explicitly authorized"
else
  report FAIL R8 "expected success with --allow-overwrite, got exit $rc: $(tail -3 "$TMP/out.log" | tr '\n' ' ')"
fi

# R9: the environment variable is an accepted authorization mechanism.
rc="$(run --file "$TMP/custom.dump" --target-db live_db --allow-overwrite)"
if [ "$rc" = "0" ]; then
  report PASS R9 "the documented authorization flag is accepted"
else
  report FAIL R9 "expected success, got exit $rc"
fi

# R10: the source artefact is never modified.
before="$(cksum < "$TMP/custom.dump")"
rc="$(run --file "$TMP/custom.dump" --target-db scratch_db)"
after="$(cksum < "$TMP/custom.dump")"
if [ "$before" = "$after" ]; then
  report PASS R10 "the source artefact is not modified by a restore"
else
  report FAIL R10 "the source artefact changed during a restore"
fi

# R11: a corrupt archive is refused before anything is restored.
cat > "$TMP/docker.bad" <<EOF
#!/usr/bin/env bash
case "\$1" in
  exec) printf '%s\n' "\$*" | grep -q -- '--list' && exit 1; exit 0 ;;
  inspect) [ "\$2" = "--format" ] && { echo true; exit 0; }; exit 0 ;;
esac
exit 0
EOF
chmod +x "$TMP/docker.bad"
cp "$TMP/docker" "$TMP/docker.good"
cp "$TMP/docker.bad" "$TMP/docker"
rc="$(run --file "$TMP/corrupt.dump" --target-db scratch_db)"
if [ "$rc" != "0" ] && grep -q "not a valid PostgreSQL custom archive" "$TMP/out.log"; then
  report PASS R11 "a corrupt archive is refused before any restore action"
else
  report FAIL R11 "expected a corrupt-archive refusal, got exit $rc"
fi
cp "$TMP/docker.good" "$TMP/docker"

# R12: the restore never creates or removes a volume or runs `compose down`.
if grep -q 'volume rm\|volume prune\|compose down\|docker system prune' "$SCRIPT"; then
  report FAIL R12 "the restore script contains a destructive volume/compose operation"
else
  report PASS R12 "the restore script contains no destructive volume or compose operation"
fi

echo "--- documentation and call sites ---"

# R13: the old documented .sql.gz restore path must be gone from the workflow.
WF="$ROOT/.github/workflows/deploy-production.yml"
if grep -q 'manage.sh restore backups/tradingo-<DATE>.sql.gz' "$WF"; then
  report FAIL R13 "the workflow still documents the .sql.gz restore path"
else
  report PASS R13 "the workflow no longer documents the incompatible .sql.gz restore path"
fi
if grep -q 'restore-backup.sh --file backups/tradingo-<DATE>.dump' "$WF"; then
  report PASS R14 "the workflow documents the validated restore command"
else
  report FAIL R14 "the workflow does not document the validated restore command"
fi

# R15: the compatibility wrapper delegates to the validated implementation.
if grep -q 'deploy/restore-backup.sh' "$WRAPPER"; then
  report PASS R15 "scripts/backup/restore-postgres.sh delegates to the validated implementation"
else
  report FAIL R15 "the compatibility wrapper does not delegate to the validated implementation"
fi
if grep -q 'no default target' "$WRAPPER"; then
  report PASS R16 "the wrapper has no default target database"
else
  report FAIL R16 "the wrapper still defaults its target database"
fi

# R17: manage.sh restore requires an explicit target and delegates.
if grep -q 'restore-backup.sh' "$MANAGE"; then
  report PASS R17 "manage.sh restore delegates to the validated implementation"
else
  report FAIL R17 "manage.sh restore does not delegate to the validated implementation"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
