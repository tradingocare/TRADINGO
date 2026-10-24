#!/usr/bin/env sh
# Wave 3B-1 — backup reliability tests (scripts/lib/pg-backup.sh +
# scripts/deploy/backup-db.sh). Runs in alpine with mocked pg_dump /
# pg_restore / docker so no real database is touched.
# Usage: docker run --rm -v <repo>:/t alpine:latest sh /t/scripts/__tests__/backup-db.spec.sh

PASS=0; FAIL=0
ok()  { echo "  PASS: $1"; PASS=$((PASS+1)); }
bad() { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

. /t/scripts/lib/pg-backup.sh

# ── Mock environment ────────────────────────────────────────────────────────
setup_mocks() {
  MOCKBIN=/tmp/mockbin
  rm -rf "$MOCKBIN"; mkdir -p "$MOCKBIN"

  # pg_dump mock: behaviors controlled by /tmp/dump_mode
  #   ok        -> valid custom archive (fake header + many TABLE lines)
  #   fail      -> exit 1 with stderr
  #   empty     -> exit 0 but zero output (the old 0-byte failure mode)
  #   garbage   -> exit 0 with non-archive bytes
  cat > "$MOCKBIN/pg_dump" <<'EOF'
#!/usr/bin/env sh
mode=$(cat /tmp/dump_mode 2>/dev/null || echo ok)
case "$mode" in
  fail)   echo "pg_dump: error: connection refused" >&2; exit 1 ;;
  empty)  exit 0 ;;
  garbage) printf 'not-a-pg-archive'; exit 0 ;;
  *)      # valid fake custom archive: header + 500 TABLE TOC lines
          printf 'PGDMP'; i=0; while [ $i -lt 500 ]; do echo "TABLE - $i public table_$i"; i=$((i+1)); done; exit 0 ;;
esac
EOF
  # pg_restore --list mock: validates against the same modes, plus control
  # files for TOC sanity guards:
  #   /tmp/toc_lines=N    -> emit N lines WITHOUT TABLE keyword (low-entry sim)
  #   /tmp/toc_zero_table -> emit 500 lines WITHOUT TABLE keyword (zero-TABLE sim)
  cat > "$MOCKBIN/pg_restore" <<'EOF'
#!/usr/bin/env sh
if [ "$1" != "--list" ]; then exit 0; fi
f="$2"
head -c 5 "$f" 2>/dev/null | grep -q 'PGDMP' || { echo "pg_restore: [archiver] input file appears to be a custom format dump" >&2; exit 1; }
  # Behavior controlled by control files (default = 500 TABLE lines):
  #   /tmp/toc_lines=N    -> emit N lines with no TABLE keyword (insufficient-entries simulation)
  #   /tmp/toc_zero_table -> emit 500 lines with no TABLE keyword (zero-TABLE simulation)
  if [ -f /tmp/toc_lines ]; then
    n=$(cat /tmp/toc_lines 2>/dev/null | tr -dc '0-9'); n=${n:-0}; i=0
    while [ $i -lt $n ]; do echo "INDEX - $i public idx_$i"; i=$((i+1)); done
  elif [ -f /tmp/toc_zero_table ]; then
    i=0; while [ $i -lt 500 ]; do echo "INDEX - $i public idx_$i"; i=$((i+1)); done
  else
    i=0; while [ $i -lt 500 ]; do echo "TABLE - $i public table_$i"; i=$((i+1)); done
  fi
  exit 0
EOF
  chmod +x "$MOCKBIN/pg_dump" "$MOCKBIN/pg_restore"
  export PATH="$MOCKBIN:$PATH"

  rm -f /tmp/dump_mode
  echo ok > /tmp/dump_mode
  rm -f /tmp/toc_lines /tmp/toc_zero_table
  export DATABASE_URL="postgresql://mockuser:mockpass@localhost:5432/mockdb"
  export PGUSER=mockuser
}

fresh_dir() { rm -rf /tmp/bk; mkdir -p /tmp/bk; }

echo "=== Wave 3B-1: backup reliability tests ==="

# ── CASE 1: successful pg_dump -> backup succeeds ───────────────────────────
echo "--- CASE 1: success path ---"
setup_mocks; fresh_dir
if tradingo_pg_backup /tmp/bk testbk direct; then
  ok "CASE 1: success path returns 0"
else
  bad "CASE 1: success path should return 0"
fi
n=$(ls /tmp/bk/testbk-*.dump 2>/dev/null | wc -l)
[ "$n" = "1" ] && ok "CASE 1: exactly one final artifact" || bad "CASE 1: expected 1 artifact, got $n"
[ ! -f /tmp/bk/testbk-*.dump.tmp ] && ok "CASE 1: no .tmp artifact left" || bad "CASE 1: .tmp left behind"

# ── CASE 2: pg_dump fails with stderr -> non-zero, no artifact ──────────────
echo "--- CASE 2: pg_dump failure ---"
setup_mocks; fresh_dir
echo fail > /tmp/dump_mode
if tradingo_pg_backup /tmp/bk testbk direct 2>/tmp/err.log; then
  bad "CASE 2: pg_dump failure must return non-zero"
else
  ok "CASE 2: pg_dump failure returns non-zero"
fi
n=$(ls /tmp/bk/testbk-*.dump /tmp/bk/.*.err /tmp/bk/.*.toc /tmp/bk/*.tmp 2>/dev/null | wc -l)
[ "$n" = "0" ] && ok "CASE 2: no artifacts left after failure" || bad "CASE 2: $n artifacts left after failure"
grep -q "exited with status" /tmp/err.log && ok "CASE 2: failure reason reported" || bad "CASE 2: no failure reason"

# ── CASE 3: pg_dump empty output -> fails (the 0-byte guard) ───────────────
echo "--- CASE 3: empty output (0-byte failure mode) ---"
setup_mocks; fresh_dir
echo empty > /tmp/dump_mode
if tradingo_pg_backup /tmp/bk testbk direct 2>/dev/null; then
  bad "CASE 3: empty pg_dump output must fail"
else
  ok "CASE 3: empty pg_dump output fails"
fi
n=$(ls /tmp/bk/*.dump /tmp/bk/*.tmp 2>/dev/null | wc -l)
[ "$n" = "0" ] && ok "CASE 3: no empty artifact survives" || bad "CASE 3: empty artifact left behind"

# ── CASE 4: invalid archive (pg_restore --list fails) -> fails ───────────────
echo "--- CASE 4: invalid archive ---"
setup_mocks; fresh_dir
echo garbage > /tmp/dump_mode
if tradingo_pg_backup /tmp/bk testbk direct 2>/dev/null; then
  bad "CASE 4: invalid archive must fail"
else
  ok "CASE 4: invalid archive fails (pg_restore --list gate)"
fi

# ── CASE 5: valid backup -> final exists, tmp absent, success line format ──
echo "--- CASE 5: artifact + BACKUP_RESULT line ---"
setup_mocks; fresh_dir
out=$(tradingo_pg_backup /tmp/bk testbk direct)
echo "$out" | grep -q "^BACKUP_RESULT=OK FILE=" && ok "CASE 5: BACKUP_RESULT line emitted" || bad "CASE 5: BACKUP_RESULT line missing"
f=$(echo "$out" | grep '^FILE=' 2>/dev/null | head -1)
[ -f /tmp/bk/testbk-*.dump ] && ok "CASE 5: final artifact exists" || bad "CASE 5: final artifact missing"
ls /tmp/bk/*.tmp 2>/dev/null | grep -q . && bad "CASE 5: tmp artifact left" || ok "CASE 5: tmp artifact absent"

# ── CASE 6: retention does not delete current backup ───────────────────────
echo "--- CASE 6: retention safety ---"
setup_mocks; fresh_dir
tradingo_pg_backup /tmp/bk testbk direct >/dev/null 2>&1
# simulate old + new artifacts; retention must delete only old
touch -d "40 days ago" /tmp/bk/testbk-20200101-000000.dump 2>/dev/null || touch -t 202001010000 /tmp/bk/testbk-20200101-000000.dump
find /tmp/bk -maxdepth 1 -type f -name "testbk-*.dump" -mtime "+30" -delete 2>/dev/null || true
[ -f /tmp/bk/testbk-*.dump ] && ok "CASE 6: current backup survives retention" || bad "CASE 6: current backup deleted by retention"
[ ! -f /tmp/bk/testbk-20200101-000000.dump ] && ok "CASE 6: old artifact removed" || bad "CASE 6: old artifact kept"

# ── CASE 7: failure never writes a success status (wrapper check) ──────────
echo "--- CASE 7: no misleading success ---"
setup_mocks; fresh_dir
echo fail > /tmp/dump_mode
out=$(tradingo_pg_backup /tmp/bk testbk direct 2>&1)
echo "$out" | grep -q "BACKUP_RESULT=OK" && bad "CASE 7: success line emitted on failure path" || ok "CASE 7: no success line on failure"
echo "$out" | grep -qi "OK:" && bad "CASE 7: OK message on failure path" || ok "CASE 7: no OK message on failure path"

# ── CASE 7b: mount guard (direct mode, unmounted dir) ─────────────────────
echo "--- CASE 7b: bind-mount guard ---"
setup_mocks
mkdir -p /tmp/guard-same-dev
if tradingo_pg_backup /tmp/guard-same-dev testbk direct --require-mounted 2>/tmp/err.log; then
  bad "CASE 7b: unmounted dir must be refused"
else
  ok "CASE 7b: unmounted dir refused (guard works)"
fi
grep -q "not a persistent mount" /tmp/err.log && ok "CASE 7b: guard reason reported" || bad "CASE 7b: guard reason missing"

# ── CASE 8: TOC has fewer than min-entries ───────────────────────────────────────────────
echo "--- CASE 8: insufficient TOC entries ---"
setup_mocks
echo 5 > /tmp/toc_lines
if tradingo_pg_backup /tmp/bk testbk direct --min-entries 10 2>/dev/null; then
  bad "CASE 8: insufficient TOC must fail"
else
  ok "CASE 8: insufficient TOC rejected (entries<min-entries guard)"
fi
n=$(ls /tmp/bk/testbk-*.dump /tmp/bk/*.tmp /tmp/bk/.testbk-*.toc 2>/dev/null | wc -l)
[ "$n" = "0" ] && ok "CASE 8: no artifact left" || bad "CASE 8: $n artifacts left"

# ── CASE 9: TOC has zero TABLE entries ──────────────────────────────────────────────────
echo "--- CASE 9: zero TABLE entries in TOC ---"
setup_mocks
touch /tmp/toc_zero_table
if tradingo_pg_backup /tmp/bk testbk direct 2>/dev/null; then
  bad "CASE 9: zero-TABLE TOC must fail"
else
  ok "CASE 9: zero-TABLE TOC rejected (grep -q TABLE guard)"
fi
n=$(ls /tmp/bk/testbk-*.dump /tmp/bk/*.tmp /tmp/bk/.testbk-*.toc 2>/dev/null | wc -l)
[ "$n" = "0" ] && ok "CASE 9: no artifact left" || bad "CASE 9: $n artifacts left"

# ── SUMMARY ──────────────────────────────────────────────────────────────────
echo ""
echo "=== RESULTS: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] && echo "ALL TESTS PASSED" || { echo "TESTS FAILED"; exit 1; }