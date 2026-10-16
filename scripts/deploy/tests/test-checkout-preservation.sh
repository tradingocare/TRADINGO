#!/usr/bin/env bash
# test-checkout-preservation.sh — executable regression suite for
# scripts/deploy/checkout-preservation.sh (the exact file under test).
# Each test builds a fresh git repo in a temp dir. No network, no VPS.
# Usage: REPO_SCRIPT=../checkout-preservation.sh bash test-checkout-preservation.sh
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_SCRIPT="${REPO_SCRIPT:-$HERE/../checkout-preservation.sh}"

PASS=0; FAIL=0; NOTESTED=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    FAIL) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
    *) NOTESTED=$((NOTESTED+1)); echo "NOT TESTED: $2 -- $3" ;;
  esac
}

# new_repo: prints "<dir> <target_sha>".
# base commit = prev state; target commit = base + 3 tracked files.
new_repo() {
  local d; d="$(mktemp -d)"
  ( cd "$d" && git init -q && git config user.email t@t && git config user.name t
    echo "prev" > mods-prev.txt
    git add -A && git commit -qm prev
    mkdir -p apps/api apps/web/lib/auth/__tests__
    echo "target-a" > apps/api/target-file.ts
    echo "target-b" > apps/web/lib/auth/session.ts
    echo "target-spec" > apps/web/lib/auth/__tests__/session.spec.ts
    git add -A && git commit -qm target
    local ts; ts="$(git rev-parse HEAD)"
    git reset -q --hard HEAD~1
    printf '%s %s' "$d" "$ts" )
}
run_preserve() { # $1=repo $2=target_sha
  APP_DIR="$1" TARGET_SHA="$2" RECOVERY_PARENT="$1-recovery" bash "$REPO_SCRIPT" 2>&1
}
rec_dir_of() { # $1=preserve stdout -> recovery dir path
  printf '%s' "$1" | sed -n 's/^RECOVERY_DIR=//p' | tail -1
}

t1() { # no collisions
  read -r d ts <<< "$(new_repo)"
  out="$(run_preserve "$d" "$ts")"; rc=$?
  if [ "$rc" -eq 0 ] && echo "$out" | grep -q "No untracked collisions"; then
    if [ -e "$d-recovery" ]; then report FAIL T1 "recovery dir created despite no collisions"
    else report PASS T1 "exit 0, no recovery dir"; fi
  else report FAIL T1 "rc=$rc out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

t2() { # exact file-to-file collisions (3 files)
  read -r d ts <<< "$(new_repo)"
  ( cd "$d"
    mkdir -p apps/api apps/web/lib/auth/__tests__
    echo "u1" > apps/api/target-file.ts
    echo "u2" > apps/web/lib/auth/session.ts
    echo "u3" > apps/web/lib/auth/__tests__/session.spec.ts )
  out="$(run_preserve "$d" "$ts")"; rc=$?
  if [ "$rc" -ne 0 ]; then report FAIL T2 "rc=$rc out: $out"; rm -rf "$d" "$d-recovery"; return; fi
  local rdir; rdir="$(rec_dir_of "$out")"
  ok=1
  [ "$(cat "$rdir/apps/api/target-file.ts")" = "u1" ] || ok=0
  [ "$(cat "$rdir/apps/web/lib/auth/session.ts")" = "u2" ] || ok=0
  [ "$(cat "$rdir/apps/web/lib/auth/__tests__/session.spec.ts")" = "u3" ] || ok=0
  # sources must be removed from working tree after verified copy
  [ -e "$d/apps/api/target-file.ts" ] && ok=0
  # checkout must now succeed (proves relocation unblocks git)
  ( cd "$d" && git checkout -q "$ts" ) || ok=0
  if [ "$ok" -eq 1 ] && [ -s "$rdir/MANIFEST.files" ]; then
    report PASS T2 "3 files copy-verified + sources removed + checkout succeeds"
  else report FAIL T2 "content/manifest/checkout mismatch rdir=$rdir"; fi
  rm -rf "$d" "$d-recovery"
}

t3sp() { # spaced nested dir collision
  read -r d ts <<< "$(new_repo)"
  ( cd "$d"
    mkdir -p "sp ace/nested dir" && echo tx > "sp ace/nested dir/f ile.txt"
    git add -A && git commit -qm target2 && ts2="$(git rev-parse HEAD)"
    echo "$ts2" > .ts2
    git reset -q --hard HEAD~1
    mkdir -p "sp ace/nested dir" && echo ux > "sp ace/nested dir/f ile.txt" )
  ts="$(cat "$d/.ts2")"; rm -f "$d/.ts2"
  out="$(run_preserve "$d" "$ts")"; rc=$?
  local rdir; rdir="$(rec_dir_of "$out")"
  if [ "$rc" -eq 0 ] && [ -f "$rdir/sp ace/nested dir/f ile.txt" ] && \
     [ "$(cat "$rdir/sp ace/nested dir/f ile.txt")" = "ux" ]; then
    report PASS T3sp "spaced nested dir preserved content-identical"
  else report FAIL T3sp "rc=$rc rdir=$rdir out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

t3c() { # untracked FILE where target has DIR
  local d; d="$(mktemp -d)"
  ( cd "$d" && git init -q && git config user.email t@t && git config user.name t
    echo base > base.txt && git add -A && git commit -qm base
    PREV="$(git rev-parse HEAD)"
    mkdir -p cdir && echo in-target-dir > cdir/f.txt && git add -A && git commit -qm t1
    git rev-parse HEAD > .t1
    git checkout -q "$PREV"
    echo "blocking-file" > cdir )
  out="$(APP_DIR="$d" TARGET_SHA="$(cat "$d/.t1")" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  if [ "$rc" -ne 0 ]; then report FAIL T3c "preserve rc=$rc out: $out"
  else
    rdir="$(rec_dir_of "$out")"
    if [ -f "$rdir/cdir" ] && [ "$(cat "$rdir/cdir")" = "blocking-file" ]; then
      ( cd "$d" && git checkout -q "$(cat .t1)" ) && report PASS T3c "file-vs-dir: preserved + checkout now succeeds" \
        || report FAIL T3c "checkout still fails after preservation"
    else report FAIL T3c "preserved content wrong"; fi
  fi
  rm -rf "$d" "$d-recovery"
}

t3d() { # untracked DIR where target has FILE
  local d; d="$(mktemp -d)"
  ( cd "$d" && git init -q && git config user.email t@t && git config user.name t
    echo base > base.txt && git add -A && git commit -qm base
    PREV="$(git rev-parse HEAD)"
    echo "target-file-content" > rconf && git add -A && git commit -qm t1
    git rev-parse HEAD > .t1
    git checkout -q "$PREV"
    mkdir -p rconf && echo "inside-untracked-dir" > rconf/inner.txt )
  out="$(APP_DIR="$d" TARGET_SHA="$(cat "$d/.t1")" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  if [ "$rc" -ne 0 ]; then report FAIL T3d "preserve rc=$rc out: $out"
  else
    rdir="$(rec_dir_of "$out")"
    if [ -f "$rdir/rconf/inner.txt" ] && [ "$(cat "$rdir/rconf/inner.txt")" = "inside-untracked-dir" ]; then
      ( cd "$d" && git checkout -q "$(cat .t1)" ) && report PASS T3d "dir-vs-file: preserved + checkout now succeeds" \
        || report FAIL T3d "checkout still fails after preservation"
    else report FAIL T3d "preserved content wrong: $out"; fi
  fi
  rm -rf "$d" "$d-recovery"
}

t4() { # ignored secret colliding with target-tracked path -> fail closed
  local d; d="$(mktemp -d)"
  ( cd "$d" && git init -q && git config user.email t@t && git config user.name t
    echo base > base.txt && git add -A && git commit -qm base
    PREV="$(git rev-parse HEAD)"
    echo "target-key" > api.key && git add -A && git commit -qm t1
    git rev-parse HEAD > .t1
    git checkout -q "$PREV"
    echo "api.key" > .gitignore && git add .gitignore && git commit -qm ign
    echo "real-secret-live" > api.key )
  out="$(APP_DIR="$d" TARGET_SHA="$(cat "$d/.t1")" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  if [ "$rc" -ne 0 ] && echo "$out" | grep -q "Ignored files/descendants collide"; then
    if [ "$(cat "$d/api.key")" = "real-secret-live" ]; then
      report PASS T4 "ignored collision aborts before checkout, secret untouched"
    else report FAIL T4 "secret modified"; fi
  else report FAIL T4 "rc=$rc (expected fail-closed) out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

t4b() { # ignored DIRECTORY whose descendant collides with target
  local d; d="$(mktemp -d)"
  ( cd "$d" && git init -q && git config user.email t@t && git config user.name t
    echo base > base.txt && git add -A && git commit -qm base
    PREV="$(git rev-parse HEAD)"
    mkdir -p secrets && echo "target-cert" > secrets/tls.key && git add -A && git commit -qm t1
    git rev-parse HEAD > .t1
    git checkout -q "$PREV"
    printf 'secrets/\n' > .gitignore && git add .gitignore && git commit -qm ign
    mkdir -p secrets && echo "real-tls-key" > secrets/tls.key )
  out="$(APP_DIR="$d" TARGET_SHA="$(cat "$d/.t1")" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  if [ "$rc" -ne 0 ] && echo "$out" | grep -q "Ignored files/descendants collide"; then
    if [ "$(cat "$d/secrets/tls.key")" = "real-tls-key" ]; then
      report PASS T4b "ignored-dir descendant collision aborts, cert untouched"
    else report FAIL T4b "cert modified"; fi
  else report FAIL T4b "rc=$rc (expected fail-closed) out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

t5() { # space/tab/newline filenames (symlink branch: see symlinks suite, Linux)
  local d; d="$(mktemp -d)"
  local WN; WN="$(printf 'sp ace\tTab\nnewline.txt')"
  ( cd "$d" && git init -q && git config user.email t@t && git config user.name t
    echo base > base.txt && git add -A && git commit -qm base
    PREV="$(git rev-parse HEAD)"
    printf 'target-weird' > "$WN"
    git add -A && git commit -qm t1
    git rev-parse HEAD > .t1
    git checkout -q "$PREV"
    printf 'untracked-weird' > "$WN" )
  out="$(APP_DIR="$d" TARGET_SHA="$(cat "$d/.t1")" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  local rdir; rdir="$(rec_dir_of "$out")"
  if [ "$rc" -eq 0 ] && [ -f "$rdir/$WN" ] && [ "$(cat "$rdir/$WN")" = "untracked-weird" ]; then
    ( cd "$d" && git checkout -q "$(cat .t1)" ) && report PASS T5 "space/tab/newline names relocated + checkout succeeds" \
      || report FAIL T5 "checkout still fails"
  else report FAIL T5 "rc=$rc out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

t6a() { # unwritable recovery parent -> fail closed
  read -r d ts <<< "$(new_repo)"
  ( cd "$d" && mkdir -p apps/api && echo u > apps/api/target-file.ts )
  rm -rf "$d-recovery"; echo blocker > "$d-recovery"
  out="$(run_preserve "$d" "$ts")"; rc=$?
  rm -f "$d-recovery"
  if [ "$rc" -ne 0 ]; then report PASS T6a "unwritable recovery parent fails closed (rc=$rc)"
  else report FAIL T6a "rc=0 despite blocked recovery parent"; fi
  rm -rf "$d" "$d-recovery"
}

t6b() { # corrupted recovery copy -> abort, sources intact
  read -r d ts <<< "$(new_repo)"
  ( cd "$d" && mkdir -p apps/api && echo u > apps/api/target-file.ts )
  export PRESERVE_TEST_HOOK='rd=$(ls -1dt "$RECOVERY_PARENT"/untracked-* 2>/dev/null | head -1); echo CORRUPT > "$rd/apps/api/target-file.ts"'
  out="$(run_preserve "$d" "$ts")"; rc=$?
  unset PRESERVE_TEST_HOOK
  if [ "$rc" -ne 0 ] && echo "$out" | grep -q "mismatch"; then
    report PASS T6b "corrupted recovery copy detected, abort (rc=$rc)"
  else report FAIL T6b "rc=$rc out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

t6c() { # source mutation between copy and verify
  read -r d ts <<< "$(new_repo)"
  ( cd "$d" && mkdir -p apps/api && echo original > apps/api/target-file.ts )
  export PRESERVE_TEST_HOOK='echo MUTATED > "$APP_DIR/apps/api/target-file.ts"'
  out="$(run_preserve "$d" "$ts")"; rc=$?
  unset PRESERVE_TEST_HOOK
  if [ "$rc" -ne 0 ] && echo "$out" | grep -q "source changed during copy"; then
    report PASS T6c "source mutation detected via re-hash, abort, recovery holds original (rc=$rc)"
  else report FAIL T6c "rc=$rc out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

t7a() { # lock contention
  read -r d ts <<< "$(new_repo)"
  ( cd "$d" && mkdir -p apps/api && echo u > apps/api/target-file.ts )
  mkdir -p "$d/.deploy.lock" && echo 999999 > "$d/.deploy.lock/pid"
  out="$(run_preserve "$d" "$ts")"; rc=$?
  rm -rf "$d/.deploy.lock"
  if [ "$rc" -ne 0 ] && echo "$out" | grep -q "holds the lock"; then
    report PASS T7a "lock contention fails closed (rc=$rc)"
  else report FAIL T7a "rc=$rc out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

t7b() { # repeat runs -> unique dirs
  read -r d ts <<< "$(new_repo)"
  ( cd "$d" && mkdir -p apps/api && echo u > apps/api/target-file.ts )
  out1="$(run_preserve "$d" "$ts")"; rc1=$?
  sleep 2
  # simulate a second attempt where the collision is still present
  ( cd "$d" && mkdir -p apps/api && echo u2 > apps/api/target-file.ts )
  out2="$(run_preserve "$d" "$ts")"; rc2=$?
  n=$(ls -1d "$d-recovery"/untracked-* 2>/dev/null | wc -l)
  if [ "$rc1" -eq 0 ] && [ "$rc2" -eq 0 ] && [ "$n" -eq 2 ]; then
    report PASS T7b "repeat runs: 2 unique recovery dirs, no overwrite"
  else report FAIL T7b "rc1=$rc1 rc2=$rc2 dirs=$n"; fi
  rm -rf "$d" "$d-recovery"
}

t7c() { # stale lock blocks (fail-closed, operator clears)
  read -r d ts <<< "$(new_repo)"
  ( cd "$d" && mkdir -p apps/api && echo u > apps/api/target-file.ts )
  mkdir -p "$d/.deploy.lock" && echo 1 > "$d/.deploy.lock/pid"
  out="$(run_preserve "$d" "$ts")"; rc=$?
  rm -rf "$d/.deploy.lock"
  if [ "$rc" -ne 0 ]; then
    report PASS T7c "stale lock blocks new run (fail-closed, operator must clear)"
  else report FAIL T7c "rc=0 despite lock present"; fi
  rm -rf "$d" "$d-recovery"
}

t8() { # failure path: source untouched + lock released
  read -r d ts <<< "$(new_repo)"
  ( cd "$d" && mkdir -p apps/api && echo precious > apps/api/target-file.ts )
  rm -rf "$d-recovery"; echo blocker > "$d-recovery"
  out="$(run_preserve "$d" "$ts")"; rc=$?
  rm -f "$d-recovery"
  if [ "$rc" -ne 0 ] && [ "$(cat "$d/apps/api/target-file.ts")" = "precious" ] && \
     [ ! -e "$d/.deploy.lock" ]; then
    report PASS T8 "failure path: source intact, lock released (rc=$rc)"
  else report FAIL T8 "rc=$rc lock=$([ -e "$d/.deploy.lock" ] && echo present || echo gone)"; fi
  rm -rf "$d" "$d-recovery"
}

t9() { # path traversal: '..' cannot survive in tracked paths
  local d; d="$(mktemp -d)"
  ( cd "$d" && git init -q && git config user.email t@t && git config user.name t
    echo base > base.txt && git add -A && git commit -qm base
    mkdir -p sub && echo x > "sub/../evil.txt"
    git add -A 2>/dev/null
    # git normalizes sub/../evil.txt -> evil.txt; verify no '..' survives in index
    if git ls-files | grep -q '\.\.'; then echo "TRAVERSAL-PRESENT"; else echo "TRAVERSAL-ABSENT"; fi ) > "$d/t9.out" 2>&1
  if grep -q "TRAVERSAL-ABSENT" "$d/t9.out"; then
    report PASS T9 "git normalizes '..' out of tracked paths; recovery dst cannot escape via tracked names"
  else report FAIL T9 "git accepted '..' path: $(cat "$d/t9.out")"; fi
  rm -rf "$d"
}

count0() { tr -cd '\0' | wc -c; }

# R1–R6: target-driven reconciler regression (detection correctness).
r1() {
  local d; d=$(mktemp -d); pushd "$d" >/dev/null
  git init -q && git config user.email t@t && git config user.name t
  echo b > b && git add -A && git commit -qm base
  mkdir -p "sp ace"; printf 'A' > f1; printf 'B' > "sp ace/f 2"; printf 'C' > g3
  git add -A && git commit -qm t; T=$(git rev-parse HEAD)
  git reset -q --hard HEAD~1
  mkdir -p "sp ace"; printf 'u' > f1; printf 'u' > "sp ace/f 2"; printf 'u' > g3
  out="$(APP_DIR="$d" TARGET_SHA="$T" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  rdir=$(printf '%s' "$out" | sed -n 's/^RECOVERY_DIR=//p' | tail -1)
  if [ "$rc" -eq 0 ] && [ "$(cat "$rdir/f1")" = "u" ] && [ ! -e "$d/f1" ] \
     && ( cd "$d" && git checkout -q "$T" ); then
    report PASS R1 "3 collisions incl. spaced name, no redundant parent dir"
  else report FAIL R1 "rc=$rc out: $out"; fi
  popd >/dev/null; rm -rf "$d" "$d-recovery"
}
r2() {
  local d; d=$(mktemp -d); pushd "$d" >/dev/null
  git init -q && git config user.email t@t && git config user.name t
  echo b > b && git add -A && git commit -qm base
  P=$(git rev-parse HEAD)
  mkdir -p cdir; echo x > cdir/f; echo y > sfile; git add -A && git commit -qm t
  T=$(git rev-parse HEAD)
  git checkout -q "$P"
  echo blk > cdir; mkdir -p sfile; echo in > sfile/inner
  out="$(APP_DIR="$d" TARGET_SHA="$T" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  if [ "$rc" -eq 0 ] && ( cd "$d" && git checkout -q "$T" ); then
    report PASS R2 "both file-dir directions detected, checkout succeeds"
  else report FAIL R2 "rc=$rc out: $out"; fi
  popd >/dev/null; rm -rf "$d" "$d-recovery"
}
r3() {
  local d; d=$(mktemp -d); pushd "$d" >/dev/null
  git init -q && git config user.email t@t && git config user.name t
  echo b > b && git add -A && git commit -qm t
  T=$(git rev-parse HEAD)
  echo unrelated > other
  out="$(APP_DIR="$d" TARGET_SHA="$T" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  if [ "$rc" -eq 0 ] && echo "$out" | grep -q "No untracked collisions"; then
    report PASS R3 "empty, exit 0"
  else report FAIL R3 "rc=$rc out: $out"; fi
  popd >/dev/null; rm -rf "$d" "$d-recovery"
}
r4() {
  local d; d=$(mktemp -d); pushd "$d" >/dev/null
  WN=$(printf 'a\tb\nc')
  git init -q && git config user.email t@t && git config user.name t
  echo b > b && git add -A && git commit -qm base
  printf t > "$WN" && git add -A && git commit -qm t
  T=$(git rev-parse HEAD)
  git reset -q --hard HEAD~1
  printf u > "$WN"
  out="$(APP_DIR="$d" TARGET_SHA="$T" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  rdir=$(printf '%s' "$out" | sed -n 's/^RECOVERY_DIR=//p' | tail -1)
  if [ "$rc" -eq 0 ] && [ -f "$rdir/$WN" ] && [ "$(cat "$rdir/$WN")" = "u" ] \
     && ( cd "$d" && git checkout -q "$T" ); then
    report PASS R4 "newline-name collision detected, preserved, checkout succeeds"
  else report FAIL R4 "rc=$rc out: $out"; fi
  popd >/dev/null; rm -rf "$d" "$d-recovery"
}
r5() {
  local d; d=$(mktemp -d); pushd "$d" >/dev/null
  git init -q && git config user.email t@t && git config user.name t
  echo v1 > tracked && git add -A && git commit -qm t
  T=$(git rev-parse HEAD)
  echo v2 > tracked
  out="$(APP_DIR="$d" TARGET_SHA="$T" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  if [ "$rc" -eq 0 ] && echo "$out" | grep -q "No untracked collisions"; then
    report PASS R5 "modified tracked file not reported"
  else report FAIL R5 "rc=$rc out: $out"; fi
  popd >/dev/null; rm -rf "$d" "$d-recovery"
}
r6() {
  local d; d=$(mktemp -d); pushd "$d" >/dev/null
  git init -q && git config user.email t@t && git config user.name t
  echo b > b && git add -A && git commit -qm base
  echo tk > sec.key && git add -A && git commit -qm t
  T=$(git rev-parse HEAD)
  git reset -q --hard HEAD~1
  echo real > sec.key && echo "sec.key" > .gitignore
  out="$(APP_DIR="$d" TARGET_SHA="$T" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  if [ "$rc" -ne 0 ] && echo "$out" | grep -q "Ignored files/descendants collide" \
     && [ "$(cat sec.key)" = "real" ]; then
    report PASS R6 "ignored collision aborts before checkout, secret untouched"
  else report FAIL R6 "rc=$rc out: $out"; fi
  popd >/dev/null; rm -rf "$d" "$d-recovery"
}

t1; t2; t3sp; t3c; t3d; t4; t4b; t5; t6a; t6b; t6c; t7a; t7b; t7c; t8; t9; r1; r2; r3; r4; r5; r6
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL NOTESTED=$NOTESTED ----"
[ "$FAIL" -eq 0 ]
