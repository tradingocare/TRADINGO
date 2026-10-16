#!/usr/bin/env sh
# Backup container-addressing tests (scripts/lib/pg-backup.sh compose mode).
# The backup addresses the database by verified container ID (plain
# `docker exec`), never by Compose project/service labels. Runs with mocked
# docker/pg_dump/pg_restore so no real database or daemon is touched.
# Usage: sh scripts/__tests__/backup-container.spec.sh   (from repo root)
PASS=0; FAIL=0
ok()  { echo "  PASS: $1"; PASS=$((PASS+1)); }
bad() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

LIB="$1"
[ -n "$LIB" ] || LIB="./scripts/lib/pg-backup.sh"
. "$LIB"

setup_mocks() {
  MOCKBIN=/tmp/cmockbin
  rm -rf "$MOCKBIN"; mkdir -p "$MOCKBIN"
  rm -f /tmp/docker_args.log /tmp/dump_mode /tmp/inspect_mode

  # pg_dump mock: ok -> fake custom archive bytes on stdout; fail -> exit 1
  cat > "$MOCKBIN/pg_dump" <<'EOF'
#!/usr/bin/env sh
mode=$(cat /tmp/dump_mode 2>/dev/null || echo ok)
case "$mode" in
  fail) echo 'pg_dump: error: connection refused' >&2; exit 1 ;;
  *)    printf 'PGDMP'; i=0; while [ $i -lt 500 ]; do echo "TABLE - $i public table_$i"; i=$((i+1)); done; exit 0 ;;
esac
EOF
  # pg_restore mock: --list reads the archive from stdin (compose mode,
  # `pg_restore --list < tmp`) or from the file argument (direct mode);
  # requires the PGDMP header either way.
  cat > "$MOCKBIN/pg_restore" <<'EOF'
#!/usr/bin/env sh
[ "$1" = "--list" ] || exit 0
own_tmp=0
if [ -n "$2" ] && [ -f "$2" ]; then src="$2"; else src=/tmp/restore-in.$$; cat > "$src"; own_tmp=1; fi
head -c 5 "$src" 2>/dev/null | grep -q 'PGDMP' || { echo "pg_restore: [archiver] input file appears to be a custom format dump" >&2; [ "$own_tmp" = "1" ] && rm -f "$src"; exit 1; }
i=0; while [ $i -lt 500 ]; do echo "TABLE - $i public table_$i"; i=$((i+1)); done
[ "$own_tmp" = "1" ] && rm -f "$src"; exit 0
EOF
  # docker mock: logs full argv; `inspect` answers from /tmp/inspect_mode
  # (ok | missing | stopped | wrong-image | wrong-label | wrong-volume).
  # Format-specific inspects (labels, mounts) are matched BEFORE the generic
  # inspect branch; `exec` delegates to the pg_dump/pg_restore mock named in
  # argv (stdin inherited, so redirections work).
  cat > "$MOCKBIN/docker" <<'EOF'
#!/usr/bin/env sh
printf '%s\n' "$*" >> /tmp/docker_args.log
case "$*" in
  *com.docker.compose.service*) mode=$(cat /tmp/inspect_mode 2>/dev/null || echo ok)
    case "$mode" in wrong-label) echo "api";; *) echo "postgres";; esac; exit 0 ;;
  *Mounts*) mode=$(cat /tmp/inspect_mode 2>/dev/null || echo ok)
    case "$mode" in wrong-volume) echo "tradingo_postgres_data";; *) echo "tradingo-prod_postgres_data";; esac; exit 0 ;;
esac
if [ "$1" = "inspect" ]; then
  mode=$(cat /tmp/inspect_mode 2>/dev/null || echo ok)
  case "$mode" in
    missing) echo 'Error: No such container' >&2; exit 1 ;;
    stopped) echo "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef|postgres:16-alpine|false"; exit 0 ;;
    wrong-image) echo "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890|redis:7-alpine|true"; exit 0 ;;
    *) echo "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890|postgres:16-alpine|true"; exit 0 ;;
  esac
fi
while [ $# -gt 0 ]; do
  case "$1" in pg_dump|pg_restore) prog="$1"; shift; break;; *) shift;; esac
done
exec /tmp/cmockbin/"$prog" "$@"
EOF
  chmod +x "$MOCKBIN/pg_dump" "$MOCKBIN/pg_restore" "$MOCKBIN/docker"
  export PATH="$MOCKBIN:$PATH"
  echo ok > /tmp/dump_mode
  echo ok > /tmp/inspect_mode
  rm -f /tmp/toc_lines /tmp/toc_zero_table
  export DATABASE_URL="postgresql://mockuser:mockpass@localhost:5432/mockdb"
  export PGUSER=mockuser
  mkdir -p /tmp/cbk
  printf 'POSTGRES_USER=x\nPOSTGRES_PASSWORD=x\n' > /tmp/cbk.env
}

fresh_env() {
  rm -rf /tmp/cbk /tmp/docker_args.log; mkdir -p /tmp/cbk
  printf 'POSTGRES_USER=x\nPOSTGRES_PASSWORD=x\n' > /tmp/cbk.env
  echo ok > /tmp/inspect_mode
}

echo "=== Backup container-addressing tests ==="

# ── C1: dump + validation address the verified container ID; no compose ─────
echo "--- C1: container-ID addressing, no compose ---"
setup_mocks; fresh_env
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container tradingo-postgres --expect-volume tradingo-prod_postgres_data >/dev/null 2>&1; then
  ok "C1: compose backup with --db-container succeeds"
else
  bad "C1: compose backup with --db-container should succeed"
fi
grep -q "exec abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" /tmp/docker_args.log 2>/dev/null && ok "C1: exec targets the resolved full container ID" || bad "C1: full-ID addressing missing"
grep -q "pg_restore --list" /tmp/docker_args.log 2>/dev/null && ok "C1: archive validation runs against the same container" || bad "C1: validation invocation missing"
grep -q "^compose" /tmp/docker_args.log 2>/dev/null && bad "C1: compose must not be invoked" || ok "C1: zero compose invocations"

# ── C2: missing container fails closed before any dump ──────────────────────
echo "--- C2: missing container ---"
setup_mocks; fresh_env
echo missing > /tmp/inspect_mode
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container tradingo-postgres --expect-volume tradingo-prod_postgres_data >/dev/null 2>/tmp/cbk-err.log; then
  bad "C2: missing container must fail"
else
  ok "C2: missing container fails closed"
fi
grep -q "not found" /tmp/cbk-err.log && ok "C2: reason reported" || bad "C2: reason missing"
n=$(ls /tmp/cbk/testbk-*.dump /tmp/cbk/*.tmp 2>/dev/null | wc -l)
[ "$n" = "0" ] && ok "C2: no artifact created" || bad "C2: artifact left behind"

# ── C3: stopped container fails closed ──────────────────────────────────────
echo "--- C3: stopped container ---"
setup_mocks; fresh_env
echo stopped > /tmp/inspect_mode
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container tradingo-postgres --expect-volume tradingo-prod_postgres_data >/dev/null 2>&1; then
  bad "C3: stopped container must fail"
else
  ok "C3: stopped container fails closed"
fi

# ── C4: wrong image fails closed ────────────────────────────────────────────
echo "--- C4: wrong image ---"
setup_mocks; fresh_env
echo wrong-image > /tmp/inspect_mode
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container tradingo-postgres --expect-volume tradingo-prod_postgres_data >/dev/null 2>&1; then
  bad "C4: wrong image must fail"
else
  ok "C4: wrong image fails closed (name-squatting rejected)"
fi

# ── C5: wrong service label fails closed ────────────────────────────────────
echo "--- C5: wrong service label ---"
setup_mocks; fresh_env
echo wrong-label > /tmp/inspect_mode
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container tradingo-postgres --expect-volume tradingo-prod_postgres_data >/dev/null 2>&1; then
  bad "C5: wrong service label must fail"
else
  ok "C5: wrong service label fails closed"
fi

# ── C6: wrong data volume fails closed ──────────────────────────────────────
echo "--- C6: wrong data volume ---"
setup_mocks; fresh_env
echo wrong-volume > /tmp/inspect_mode
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container tradingo-postgres --expect-volume tradingo-prod_postgres_data >/dev/null 2>&1; then
  bad "C6: wrong data volume must fail"
else
  ok "C6: wrong data volume fails closed (unknown data never dumped)"
fi

# ── C7: malformed container names rejected before any docker call ───────────
echo "--- C7: malformed names ---"
setup_mocks; fresh_env
rm -f /tmp/docker_args.log
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container "--rm" --expect-volume tradingo-prod_postgres_data >/dev/null 2>&1; then
  bad "C7: option-like name must fail"
else
  ok "C7: option-like name rejected"
fi
[ ! -f /tmp/docker_args.log ] && ok "C7: no docker call attempted" || bad "C7: docker was contacted"
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container "a;b" --expect-volume tradingo-prod_postgres_data >/dev/null 2>&1; then
  bad "C7: metachar name must fail"
else
  ok "C7: metachar name rejected"
fi

# ── C8: --db-container required in compose mode ─────────────────────────────
echo "--- C8: container required ---"
setup_mocks; fresh_env
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env >/dev/null 2>&1; then
  bad "C8: missing --db-container must fail"
else
  ok "C8: missing --db-container fails closed"
fi

# ── C9: removed --project-name errors loudly (no silent legacy path) ────────
echo "--- C9: legacy flag rejected ---"
setup_mocks; fresh_env
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --project-name tradingo-prod >/dev/null 2>&1; then
  bad "C9: removed flag must fail"
else
  ok "C9: removed --project-name errors loudly"
fi

# ── C10: backup-db.sh end-to-end container wiring (mocked docker) ────────────
echo "--- C10: backup-db.sh wiring ---"
setup_mocks
TROOT=$(mktemp -d)
printf 'POSTGRES_USER=x\nPOSTGRES_PASSWORD=x\n' > "$TROOT/prod.env"
rm -f /tmp/docker_args.log
if BACKUP_DIR="$TROOT/backups" COMPOSE_FILE="docker-compose.prod.yml" COMPOSE_ENV_FILE="$TROOT/prod.env" \
   sh ./scripts/deploy/backup-db.sh >/tmp/c10.log 2>&1; then
  ok "C10: backup-db.sh succeeds with mocks"
else
  bad "C10: backup-db.sh should succeed with mocks"
fi
grep -q "exec abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" /tmp/docker_args.log 2>/dev/null && ok "C10: dump+validation address the verified container ID" || bad "C10: container-ID addressing missing"
grep -q "^status=OK" "$TROOT/backups/logs/backup-status.txt" 2>/dev/null && ok "C10: status file reports OK" || bad "C10: status file missing/FAILED"
rm -rf "$TROOT"

# ── C11: direct mode unchanged and rejects container flags ───────────────────
echo "--- C11: direct mode ---"
setup_mocks; fresh_env
if tradingo_pg_backup /tmp/cbk testbk direct >/dev/null 2>&1; then
  ok "C11: plain direct mode succeeds"
else
  bad "C11: plain direct mode must succeed"
fi
if tradingo_pg_backup /tmp/cbk testbk direct --db-container tradingo-postgres >/dev/null 2>&1; then
  bad "C11: contradictory container flag must fail"
else
  ok "C11: container flag in direct mode fails closed"
fi

# ── C12: simulated rename failure can never produce success ─────────────────
echo "--- C12: atomic-finalize failure ---"
setup_mocks; fresh_env
mv() { echo "mock-mv: refusing rename" >&2; return 1; }
if tradingo_pg_backup /tmp/cbk testbk compose --compose-file /tmp/cbk.env --env-file /tmp/cbk.env --db-container tradingo-postgres --expect-volume tradingo-prod_postgres_data >/tmp/c12.log 2>&1; then
  bad "C12: rename failure must return non-zero"
else
  ok "C12: rename failure returns non-zero"
fi
unset -f mv
grep -q "atomic finalize failed" /tmp/c12.log && ok "C12: clear error reported" || bad "C12: error message missing"
grep -q "BACKUP_RESULT=OK" /tmp/c12.log && bad "C12: success line emitted after rename failure" || ok "C12: no success line after rename failure"
n=$(ls /tmp/cbk/testbk-*.dump /tmp/cbk/*.tmp 2>/dev/null | wc -l)
[ "$n" = "0" ] && ok "C12: no final artifact and no tmp left behind" || bad "C12: artifacts left behind"
rm -f /tmp/c12.log

echo ""
echo "=== RESULTS: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "ALL TESTS PASSED" || { echo "TESTS FAILED"; exit 1; }
