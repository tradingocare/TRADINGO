#!/usr/bin/env sh
# Waves 3A-1 + 3B-1 ? docker-entrypoint.sh exit-code propagation tests
# Runs inside an alpine container with mock binaries on PATH.
# Usage: docker run --rm --tmpfs /backups -v <repo>:/t alpine:latest sh /t/scripts/__tests__/docker-entrypoint.spec.sh
# (--tmpfs /backups gives the pre-migration backup dir a REAL mount with a
#  device id distinct from /, satisfying the lib's --require-mounted guard)

PASS=0; FAIL=0
ok()   { echo "  PASS: $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }
assert_exit() { # desc expected actual
  if [ "$2" -eq "$3" ]; then ok "$1 (exit=$3)"; else bad "$1 ? expected exit $2, got $3"; fi
}

echo "=== Wave 3A-1: docker-entrypoint.sh fail-safe tests ==="

# ?? Mock environment builder ????????????????????????????????????????????????
setup_mocks() {
  MOCKBIN=/tmp/mockbin
  rm -rf "$MOCKBIN"; mkdir -p "$MOCKBIN"

  # pg_isready: exits 1 while /tmp/pg_fail exists (PG "down"), else 0 (PG "up")
  cat > "$MOCKBIN/pg_isready" <<'EOF'
#!/usr/bin/env sh
if [ -f /tmp/pg_fail ]; then exit 1; fi
exit 0
EOF
  # npx: matches the FULL arg string ? "npx prisma migrate deploy" arrives as
  # 3 positional args, so "$*" pattern-matching is used instead of $1 parsing.
  cat > "$MOCKBIN/npx" <<'EOF'
#!/usr/bin/env sh
case "$*" in
  *"migrate deploy"*)
    [ -f /tmp/deploy_fail ] && exit 1
    echo "mock: migrate deploy ok"; exit 0 ;;
  *"migrate status"*)
    [ -f /tmp/status_fail ] && exit 1
    echo "mock: migrate status ok"; exit 0 ;;
  *"generate"*)
    [ -f /tmp/generate_fail ] && exit 1
    echo "mock: generate ok"; exit 0 ;;
  *) exit 0 ;;
esac
EOF
  # pg_dump / pg_restore mocks for the Wave 3B-1 pre-migration backup.
  # /tmp/backup_fail set -> pg_dump exits 1 (backup failure path).
  cat > "$MOCKBIN/pg_dump" <<'EOF'
#!/usr/bin/env sh
if [ -f /tmp/backup_fail ]; then echo "pg_dump: error: mock failure" >&2; exit 1; fi
printf 'PGDMP'; i=0; while [ $i -lt 500 ]; do echo "TABLE - $i public table_$i"; i=$((i+1)); done; exit 0
EOF
  cat > "$MOCKBIN/pg_restore" <<'EOF'
#!/usr/bin/env sh
[ "$1" = "--list" ] || exit 0
head -c 5 "$2" 2>/dev/null | grep -q 'PGDMP' || exit 1
cat "$2"; exit 0
EOF
  chmod +x "$MOCKBIN/pg_isready" "$MOCKBIN/npx" "$MOCKBIN/pg_dump" "$MOCKBIN/pg_restore"
  export PATH="$MOCKBIN:$PATH"

  # Control files (fail-flags removed ? each case re-adds the one it needs)
  rm -f /tmp/pg_fail /tmp/deploy_fail /tmp/status_fail /tmp/generate_fail /tmp/backup_fail

  # Entrypoint checks ./prisma/schema.prisma RELATIVE to cwd ? ensure it exists
  mkdir -p /t/prisma
  [ -f /t/prisma/schema.prisma ] || echo "model T { id Int @id }" > /t/prisma/schema.prisma

  # Entrypoint sources the backup lib at /scripts/lib/pg-backup.sh
  mkdir -p /scripts/lib
  cp /t/scripts/lib/pg-backup.sh /scripts/lib/pg-backup.sh

  export DATABASE_URL="postgresql://mockuser:mockpass@localhost:5432/mockdb"
  export PG_HOST="localhost"
  export PG_USER="mockuser"
  export PRISMA_MIGRATE_DISABLED="false"
  export DB_WAIT_TIMEOUT="2"
}

run_entrypoint() {
  # cwd must be /t: entrypoint gates migrations on ./prisma/schema.prisma.
  cd /t || return 99
  sh /t/scripts/docker-entrypoint.sh /bin/true >/tmp/out.log 2>&1
  RC=$?
  return $RC
}

# ?? CASE A: PostgreSQL unavailable ? non-zero exit, migration NOT executed ??
echo "--- CASE A: PG unavailable ---"
setup_mocks
touch /tmp/pg_fail
run_entrypoint; EXIT=$?
assert_exit "CASE A: PG unavailable exits non-zero" 1 "$EXIT"
grep -q "migrate deploy" /tmp/out.log && bad "CASE A: migration executed (should not)" || ok "CASE A: migration not executed"
grep -q "ERROR: PostgreSQL not ready" /tmp/out.log && ok "CASE A: fatal PG message present" || bad "CASE A: fatal PG message missing"

# ?? CASE B: PG ready + migrate deploy FAILS ? non-zero exit ??????????????????
echo "--- CASE B: migration fails ---"
setup_mocks
touch /tmp/deploy_fail
run_entrypoint; EXIT=$?
assert_exit "CASE B: deploy failure exits non-zero" 1 "$EXIT"
grep -q "migrate deploy failed" /tmp/out.log && ok "CASE B: deploy-failure message present" || bad "CASE B: deploy-failure message missing"
grep -q "complete and verified" /tmp/out.log && bad "CASE B: success message wrongly printed" || ok "CASE B: no success message"

# ?? CASE C: PG ready + deploy succeeds + status succeeds ? exit 0, reaches CMD ??
echo "--- CASE C: all succeed ---"
setup_mocks
run_entrypoint; EXIT=$?
assert_exit "CASE C: full success path exits 0" 0 "$EXIT"
grep -q "complete and verified" /tmp/out.log && ok "CASE C: verified message present" || bad "CASE C: verified message missing"
grep -q "Starting application" /tmp/out.log && ok "CASE C: reached CMD exec" || bad "CASE C: did not reach CMD"

# ?? CASE D: deploy succeeds + status FAILS ? non-zero exit ??????????????????
echo "--- CASE D: status verification fails ---"
setup_mocks
touch /tmp/status_fail
run_entrypoint; EXIT=$?
assert_exit "CASE D: status failure exits non-zero" 1 "$EXIT"
grep -q "verification failed" /tmp/out.log && ok "CASE D: verification-failure message present" || bad "CASE D: verification-failure message missing"

# ?? CASE E: deploy + status succeed + generate FAILS ? exit 0 (non-fatal) ???
echo "--- CASE E: generate failure is non-fatal ---"
setup_mocks
touch /tmp/generate_fail
run_entrypoint; EXIT=$?
assert_exit "CASE E: generate failure does not block (exit 0)" 0 "$EXIT"
grep -q "build-time generated client" /tmp/out.log && ok "CASE E: generate fallback message present" || bad "CASE E: generate fallback message missing"

# ?? CASE F: DATABASE_URL unset ? non-zero exit ??????????????????????????????
echo "--- CASE F: DATABASE_URL missing ---"
setup_mocks
unset DATABASE_URL
run_entrypoint; EXIT=$?
assert_exit "CASE F: missing DATABASE_URL exits non-zero" 1 "$EXIT"
grep -q "DATABASE_URL is not set" /tmp/out.log && ok "CASE F: missing-URL message present" || bad "CASE F: missing-URL message missing"

# ?? CASE G (3B-1): pre-migration backup FAILS -> migration MUST NOT execute ?
echo "--- CASE G: pre-migration backup failure blocks migration ---"
setup_mocks
touch /tmp/backup_fail
run_entrypoint; EXIT=$?
assert_exit "CASE G: backup failure exits non-zero" 1 "$EXIT"
grep -q "migrate deploy" /tmp/out.log && bad "CASE G: migration executed despite backup failure" || ok "CASE G: migrate deploy NOT invoked"
grep -q "pre-migration backup failed" /tmp/out.log && ok "CASE G: backup-failure message present" || bad "CASE G: backup-failure message missing"

# ?? CASE H (3B-1): pre-migration backup succeeds -> migration may proceed ?
echo "--- CASE H: backup success allows migration ---"
setup_mocks
run_entrypoint; EXIT=$?
assert_exit "CASE H: backup success path exits 0" 0 "$EXIT"
grep -q "Pre-migration backup verified" /tmp/out.log && ok "CASE H: backup-verified message present" || bad "CASE H: backup-verified message missing"
grep -q "mock: migrate deploy ok" /tmp/out.log && ok "CASE H: migrate deploy invoked" || bad "CASE H: migrate deploy NOT invoked"


# -- CASE I: --require-mounted flag wired into tradingo_pg_backup (L-3) ------
# Structural regression guard: if a future edit removes --require-mounted
# from the docker-entrypoint.sh:52 invocation, the lib's mount guard is
# silently disabled and a missing /backups mount would no longer abort the
# backup step. End-to-end runtime check (entrypoint without --tmpfs /backups)
# is not possible here: this spec already runs inside an alpine container
# with no docker daemon, so a nested `docker run` cannot be issued. The
# structural grep below is the strongest achievable invariant.
echo "--- CASE I: --require-mounted flag wired into tradingo_pg_backup ---"
if grep -q -- "--require-mounted" /t/scripts/docker-entrypoint.sh; then
  ok "CASE I: --require-mounted is present in the entrypoint invocation"
else
  bad "CASE I: --require-mounted is MISSING from the entrypoint invocation — mount-guard disabled"
fi

# -- CASE J: /scripts/lib/pg-backup.sh missing — build-drift safety net (L-4)
# Proves that a Dockerfile change forgetting `COPY scripts/lib/pg-backup.sh`
# is detected: the entrypoint's `. /scripts/lib/pg-backup.sh` runs under
# `set -e`, so a missing file aborts the script BEFORE `migrate deploy` is
# reached. The next case's setup_mocks re-copies the lib, so the rm is
# scoped to this case only.
echo "--- CASE J: missing pg-backup.sh (build-drift safety net) ---"
setup_mocks
rm -f /scripts/lib/pg-backup.sh
run_entrypoint; EXIT=$?
if [ "$EXIT" -ne 0 ]; then ok "CASE J: missing lib aborts (exit=$EXIT, non-zero)"; else bad "CASE J: missing lib did NOT abort (exit=0) — build-drift net broken"; fi
grep -qE "not found|cannot|missing|No such file" /tmp/out.log && ok "CASE J: missing-file error reported" || bad "CASE J: missing-file error not reported"
grep -q "migrate deploy" /tmp/out.log && bad "CASE J: migration executed despite missing lib" || ok "CASE J: migrate deploy NOT invoked (build-drift net works)"
# ?? SUMMARY ??????????????????????????????????????????????????????????????????
echo ""
echo "=== RESULTS: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "ALL TESTS PASSED" || { echo "TESTS FAILED"; exit 1; }