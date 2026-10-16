#!/usr/bin/env sh
# Backup Compose-project selection tests (scripts/lib/pg-backup.sh compose mode).
# Runs with mocked docker/pg_dump/pg_restore so no real database or daemon is
# touched. Mirrors the style of scripts/__tests__/backup-db.spec.sh.
# Usage: sh scripts/__tests__/backup-compose.spec.sh   (from repo root)
#   or:  docker run --rm -v <repo>:/t alpine:latest sh /t/scripts/__tests__/backup-compose.spec.sh
PASS=0; FAIL=0
ok()  { echo "  PASS: $1"; PASS=$((PASS+1)); }
bad() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

LIB="$1"
[ -n "$LIB" ] || LIB="./scripts/lib/pg-backup.sh"
. "$LIB"

setup_mocks() {
  MOCKBIN=/tmp/cmockbin
  rm -rf "$MOCKBIN"; mkdir -p "$MOCKBIN"
  rm -f /tmp/docker_args.log /tmp/dump_mode

  # pg_dump mock: ok -> fake custom archive bytes on stdout; fail -> exit 1
  cat > "$MOCKBIN/pg_dump" <<'EOF'
#!/usr/bin/env sh
mode=$(cat /tmp/dump_mode 2>/dev/null || echo ok)
case "$mode" in
  fail) echo 'service "postgres" is not running' >&2; exit 1 ;;
  *)    printf 'PGDMP'; i=0; while [ $i -lt 500 ]; do echo "TABLE - $i public table_$i"; i=$((i+1)); done; exit 0 ;;
esac
EOF
  # pg_restore mock: --list reads the archive from stdin (compose mode,
  # `pg_restore --list < tmp`) or from the file argument (direct mode,
  # `pg_restore --list tmp`); requires the PGDMP header either way.
  cat > "$MOCKBIN/pg_restore" <<'EOF'
#!/usr/bin/env sh
[ "$1" = "--list" ] || exit 0
own_tmp=0
if [ -n "$2" ] && [ -f "$2" ]; then src="$2"; else src=/tmp/restore-in.$$; cat > "$src"; own_tmp=1; fi
head -c 5 "$src" 2>/dev/null | grep -q 'PGDMP' || { echo "pg_restore: [archiver] input file appears to be a custom format dump" >&2; [ "$own_tmp" = "1" ] && rm -f "$src"; exit 1; }
i=0; while [ $i -lt 500 ]; do echo "TABLE - $i public table_$i"; i=$((i+1)); done
[ "$own_tmp" = "1" ] && rm -f "$src"; exit 0
EOF
  # docker mock: logs full argv, then delegates to the pg_dump/pg_restore
  # mock named in argv (stdin inherited, so compose-mode redirections work).
  cat > "$MOCKBIN/docker" <<'EOF'
#!/usr/bin/env sh
printf '%s\n' "$*" >> /tmp/docker_args.log
while [ $# -gt 0 ]; do
  case "$1" in pg_dump|pg_restore) prog="$1"; shift; break;; *) shift;; esac
done
exec /tmp/cmockbin/"$prog" "$@"
EOF
  chmod +x "$MOCKBIN/pg_dump" "$MOCKBIN/pg_restore" "$MOCKBIN/docker"
  export PATH="$MOCKBIN:$PATH"
  echo ok > /tmp/dump_mode
  rm -f /tmp/toc_lines /tmp/toc_zero_table
  export DATABASE_URL="postgresql://mockuser:mockpass@localhost:5432/mockdb"
  export PGUSER=mockuser
}

fresh_env() {
  rm -rf /tmp/cbk /tmp/docker_args.log; mkdir -p /tmp/cbk
  printf 'POSTGRES_USER=x\nPOSTGRES_PASSWORD=x\n' > /tmp/cbk.env
}

echo "=== Backup Compose-project selection tests ==="

# ── P1: compose backup with --project-name succeeds; BOTH dump and TOC
#        validation run against the selected project ─────────────────────────
echo "--- P1: project selection on dump + validation ---"
setup_mocks; fresh_env
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --project-name tradingo-prod >/dev/null 2>&1; then
  ok "P1: compose backup with --project-name succeeds"
else
  bad "P1: compose backup with --project-name should succeed"
fi
n=$(grep -c -- "-p tradingo-prod" /tmp/docker_args.log 2>/dev/null || echo 0)
[ "$n" = "2" ] && ok "P1: both pg_dump and pg_restore invocations carry -p tradingo-prod" || bad "P1: expected 2 project-selected invocations, got $n"
grep -q "exec -T postgres" /tmp/docker_args.log && ok "P1: service name postgres preserved" || bad "P1: service name missing"

# ── P2 REGRESSION: without --project-name, the production wrong-project
#        failure shape is reproduced (service lookup fails, no -p flag) ──────
echo "--- P2: wrong-project failure reproduction ---"
setup_mocks; fresh_env
printf 'fail\n' > /tmp/dump_mode
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env >/dev/null 2>/tmp/cbk-err.log; then
  bad "P2: failing pg_dump must return non-zero"
else
  ok "P2: failing pg_dump returns non-zero"
fi
grep -q "pg_dump exited with status" /tmp/cbk-err.log && ok "P2: production error shape reproduced (pg_dump exit status)" || bad "P2: error shape missing"
grep -q -- "-p tradingo-prod" /tmp/docker_args.log && bad "P2: unexpected -p flag without --project-name" || ok "P2: no project flag without --project-name (legacy behavior preserved)"

# ── P3: backup-db.sh end-to-end project wiring (mocked docker, temp dirs) ─────
# backup-db.sh cds to the repo root on start; BACKUP_DIR/COMPOSE_ENV_FILE are
# absolute temp paths so nothing is written outside them. Mock docker in PATH.
echo "--- P3: backup-db.sh project wiring ---"
setup_mocks
TROOT=$(mktemp -d)
printf 'POSTGRES_USER=x\nPOSTGRES_PASSWORD=x\n' > "$TROOT/prod.env"
rm -f /tmp/docker_args.log
if BACKUP_DIR="$TROOT/backups" COMPOSE_FILE="docker-compose.prod.yml" COMPOSE_ENV_FILE="$TROOT/prod.env" \
   sh ./scripts/deploy/backup-db.sh >/tmp/p3.log 2>&1; then
  ok "P3: backup-db.sh succeeds with mocks"
else
  bad "P3: backup-db.sh should succeed with mocks"
fi
n=$(grep -c -- "-p tradingo-prod" /tmp/docker_args.log 2>/dev/null || echo 0)
[ "$n" = "2" ] && ok "P3: both dump and validation run with -p tradingo-prod" || bad "P3: expected 2 project-selected invocations, got $n"
grep -q "^status=OK" "$TROOT/backups/logs/backup-status.txt" 2>/dev/null && ok "P3: status file reports OK" || bad "P3: status file missing/FAILED"
rm -rf "$TROOT"

# ── P4: direct mode ignores --project-name (entrypoint compatibility) ────────
echo "--- P4: direct mode compatibility ---"
setup_mocks; fresh_env
export DATABASE_URL="postgresql://mockuser:mockpass@localhost:5432/mockdb"
if tradingo_pg_backup /tmp/cbk testbk direct --project-name tradingo-prod >/dev/null 2>&1; then
  ok "P4: direct mode accepts (and ignores) --project-name"
else
  bad "P4: direct mode must stay compatible"
fi
n=$(ls /tmp/cbk/testbk-*.dump 2>/dev/null | wc -l)
[ "$n" = "1" ] && ok "P4: direct artifact created" || bad "P4: direct artifact missing"

echo ""
echo "=== RESULTS: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "ALL TESTS PASSED" || { echo "TESTS FAILED"; exit 1; }
