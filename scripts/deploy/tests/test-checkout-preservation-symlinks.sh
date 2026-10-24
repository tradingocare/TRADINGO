#!/usr/bin/env bash
# test-checkout-preservation-symlinks.sh — Linux symlink regression suite for
# scripts/deploy/checkout-preservation.sh (the exact file under test).
# Requires real symlinks (Linux/ext4). Each test builds a fresh git repo.
# Usage: REPO_SCRIPT=../checkout-preservation.sh bash test-checkout-preservation-symlinks.sh
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_SCRIPT="${REPO_SCRIPT:-$HERE/../checkout-preservation.sh}"
PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    *) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

# mk_target <dir>: crafts target commit with a symlink blob (mode 120000) at
# link.ts -> outside.txt WITHOUT touching the filesystem. Prints target SHA.
# (msys/Windows git cannot index symlinks; Linux git can via --cacheinfo.)
mk_symlink_target() { # $1=repo $2=linkname $3=linktarget
  ( cd "$1"
    blob=$(printf '%s' "$3" | git hash-object -w --stdin)
    git update-index --add --cacheinfo "120000,$blob,$2"
    T1=$(echo "t1" | git commit-tree "$(git write-tree)" -p "$(git rev-parse HEAD)")
    git reset -q --hard HEAD
    # remove the symlink blob from index (reset restores HEAD state, but the
    # blob was never committed to the branch; reset --hard clears it)
    printf '%s' "$T1" )
}
new_base() { # $1=dir
  ( cd "$1" && git init -q && git config user.email t@t && git config user.name t
    echo base > base.txt && git add -A && git commit -qm base )
}

# S1: real symlink collision, target has same path.
# Proves: branch executes, link relocated as link (no-follow), checkout succeeds.
s1() {
  local d; d="$(mktemp -d)"
  new_base "$d"
  ( cd "$d" && echo "real-target" > outside.txt && git add -A && git commit -qm data )
  T1="$(mk_symlink_target "$d" link.ts outside.txt)"
  ( cd "$d" && ln -s outside.txt link.ts )
  if [ ! -L "$d/link.ts" ]; then report FAIL S1 "setup: link.ts not a symlink (needs Linux)"; rm -rf "$d"; return; fi
  out="$(APP_DIR="$d" TARGET_SHA="$T1" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  rdir=$(printf '%s' "$out" | sed -n 's/^RECOVERY_DIR=//p' | tail -1)
  if [ "$rc" -ne 0 ]; then report FAIL S1 "rc=$rc out: $out"; rm -rf "$d" "$d-recovery"; return; fi
  # type check: preserved entry must be a symlink (no-follow proof: a content
  # copy would produce a regular file). The relocated link is dangling by
  # design (target was repo-relative), so only -L + target string are asserted.
  if [ -L "$rdir/link.ts" ]; then
    lt="$(readlink "$rdir/link.ts")"
    stype="$(stat -c '%F' "$rdir/link.ts")"
    if [ "$lt" = "outside.txt" ]; then
      report PASS S1 "symlink branch executed: type=$stype target=outside.txt, no content copy (rc=$rc)"
    else report FAIL S1 "link target wrong: $lt"; fi
  else report FAIL S1 "relocated entry is not a symlink (followed/copied?)"; fi
  # checkout must now succeed and yield the TARGET symlink
  if ( cd "$d" && git checkout -q "$T1" ) && [ -L "$d/link.ts" ]; then
    report PASS S1b "checkout succeeds after symlink relocation; target link restored"
  else report FAIL S1b "checkout failed or target link missing"; fi
  rm -rf "$d" "$d-recovery"
}

# S2: symlink verification failure -> abort, original link never moved.
s2() {
  local d; d="$(mktemp -d)"
  new_base "$d"
  ( cd "$d" && echo data > outside.txt && git add -A && git commit -qm data )
  T1="$(mk_symlink_target "$d" link.ts outside.txt)"
  ( cd "$d" && ln -s outside.txt link.ts )
  export PRESERVE_TEST_HOOK='rd=$(ls -1dt "$RECOVERY_PARENT"/untracked-* 2>/dev/null | head -1); rm -f "$rd/link.ts"; ln -s tampered.txt "$rd/link.ts"'
  out="$(APP_DIR="$d" TARGET_SHA="$T1" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  unset PRESERVE_TEST_HOOK
  if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "symlink target mismatch"; then
    if [ -L "$d/link.ts" ] && [ "$(readlink "$d/link.ts")" = "outside.txt" ]; then
      report PASS S2 "tampered symlink detected, abort, original never moved (rc=$rc)"
    else report FAIL S2 "abort but original link disturbed"; fi
  else report FAIL S2 "rc=$rc out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

# S3: absolute external symlink is never followed (recovery contains link only).
s3() {
  local d; d="$(mktemp -d)"
  new_base "$d"
  T1="$(mk_symlink_target "$d" extlink /etc/hostname)"
  ( cd "$d" && ln -s /etc/hostname extlink )
  out="$(APP_DIR="$d" TARGET_SHA="$T1" RECOVERY_PARENT="$d-recovery" bash "$REPO_SCRIPT" 2>&1)"; rc=$?
  rdir=$(printf '%s' "$out" | sed -n 's/^RECOVERY_DIR=//p' | tail -1)
  if [ "$rc" -eq 0 ] && [ -L "$rdir/extlink" ] && [ "$(readlink "$rdir/extlink")" = "/etc/hostname" ]; then
    report PASS S3 "absolute external symlink relocated as link only; target never read"
  else report FAIL S3 "rc=$rc out: $out"; fi
  rm -rf "$d" "$d-recovery"
}

s1; s2; s3
echo "---- SYMLINK SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
