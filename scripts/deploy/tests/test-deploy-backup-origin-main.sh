#!/usr/bin/env bash
# test-deploy-backup-origin-main.sh — behavioral regression tests for the
# deploy-backup.yml release-pinning corrections:
#
#   T1 stale refs     — with a pruned/narrowed fetch refspec, a plain
#                       `git fetch origin` leaves refs/remotes/origin/main
#                       stale; the workflow's explicit refspec must refresh
#                       it to the actual upstream main.
#   T2 ref validation — the remote script must fail closed on any target ref
#                       other than refs/heads/main, before fetching.
#   T3 missing script — the remote script must abort before checkout when the
#                       target commit has no checkout-preservation.sh.
#   T4/T5 invocation  — checkout-preservation.sh requires the APP_DIR and
#                       TARGET_SHA environment variables; positional
#                       arguments are not part of its interface.
#
# T2/T3 execute the REAL remote script extracted from the workflow heredoc
# (between the `<< 'REMOTE_EOF'` opener and the REMOTE_EOF terminator) against
# real local git fixtures. Exit 0 = all pass.

set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${REPO_ROOT:-$(cd "$HERE/../../.." && pwd)}"
WF="$REPO_ROOT/.github/workflows/deploy-backup.yml"
GATE="$REPO_ROOT/scripts/deploy/checkout-preservation.sh"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Isolate from host git configuration.
export GIT_CONFIG_GLOBAL="$TMP/gitconfig"
export GIT_CONFIG_SYSTEM=/dev/null
: > "$GIT_CONFIG_GLOBAL"

PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    FAIL) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

git_q() { git -c user.email=test@test.invalid -c user.name=tests -c commit.gpgsign=false "$@"; }

# Extract the remote script exactly as the workflow delivers it to `bash -s`.
# YAML block scalars strip the common indentation (10 spaces) at runtime, so
# the same strip is applied here. CR characters are stripped because a Windows
# checkout (core.autocrlf) carries CRLF in the working tree while the blob
# stored in git — the bytes GitHub actually executes — uses LF.
REMOTE_SCRIPT="$TMP/remote-script.sh"
awk '
  /<< .REMOTE_EOF./ { capture=1; next }
  capture && /^[[:space:]]*REMOTE_EOF[[:space:]]*$/ { exit }
  capture { sub(/\r$/, ""); sub(/^ {10}/, ""); print }
' "$WF" > "$REMOTE_SCRIPT"

echo "========================================================"
echo "BEHAVIORAL TESTS: deploy-backup.yml origin/main pinning"
echo "WORKFLOW: $WF"
echo "========================================================"
echo ""

if [ ! -s "$REMOTE_SCRIPT" ]; then
  echo "FAIL: could not extract remote script from workflow"
  exit 1
fi

# ---------------------------------------------------------------
# T1: stale origin/main must be refreshed by the explicit refspec
# ---------------------------------------------------------------
(
  set -e
  cd "$TMP"

  git init -q --bare -b main origin-t1.git
  git init -q -b main work-t1
  cd work-t1
  git remote add origin "$TMP/origin-t1.git"
  echo one > f.txt
  git_q add f.txt
  git_q commit -qm one
  git_q push -q -u origin main
  cd "$TMP"

  # Advance upstream main independently.
  git init -q -b main adv-t1
  cd adv-t1
  git remote add origin "$TMP/origin-t1.git"
  git_q fetch -q origin
  git_q checkout -q -B main refs/remotes/origin/main
  echo two > f.txt
  git_q add f.txt
  git_q commit -qm two
  git_q push -q origin main
  git rev-parse HEAD > "$TMP/t1-new-sha"
  cd "$TMP/work-t1"

  # Simulate a pruned/narrowed fetch refspec config, under which the
  # remote-tracking ref can no longer be refreshed by a plain fetch.
  git config --unset-all remote.origin.fetch
  git rev-parse refs/remotes/origin/main > "$TMP/t1-stale-sha"
)
T1_NEW="$(cat "$TMP/t1-new-sha" 2>/dev/null || echo missing)"
T1_STALE="$(cat "$TMP/t1-stale-sha" 2>/dev/null || echo missing)"

if [ "$T1_STALE" != "missing" ] && [ "$T1_NEW" != "missing" ] && [ "$T1_STALE" != "$T1_NEW" ]; then
  report PASS T1a "precondition: origin/main is stale ($T1_STALE != $T1_NEW)"
else
  report FAIL T1a "precondition setup failed (stale=$T1_STALE new=$T1_NEW)"
fi

# Old behavior: plain fetch leaves the stale ref in place.
( cd "$TMP/work-t1" && git fetch -q origin ) || true
T1_AFTER_PLAIN="$(git -C "$TMP/work-t1" rev-parse refs/remotes/origin/main 2>/dev/null || echo missing)"
if [ "$T1_AFTER_PLAIN" = "$T1_STALE" ]; then
  report PASS T1b "plain 'git fetch origin' leaves origin/main stale (defect demonstrated)"
else
  report FAIL T1b "plain fetch unexpectedly refreshed ref (got $T1_AFTER_PLAIN)"
fi

# Fixed behavior: explicit refspec refreshes it.
( cd "$TMP/work-t1" && git fetch -q origin "+refs/heads/main:refs/remotes/origin/main" )
T1_AFTER_EXPLICIT="$(git -C "$TMP/work-t1" rev-parse refs/remotes/origin/main 2>/dev/null || echo missing)"
if [ "$T1_AFTER_EXPLICIT" = "$T1_NEW" ]; then
  report PASS T1c "explicit refspec refreshes stale origin/main to upstream ($T1_NEW)"
else
  report FAIL T1c "explicit refspec did not refresh ref (got $T1_AFTER_EXPLICIT)"
fi

# Contract: the workflow must carry exactly this refspec.
if grep -qF 'git fetch origin "+refs/heads/main:refs/remotes/origin/main"' "$WF"; then
  report PASS T1d "workflow uses the explicit origin/main refresh refspec"
else
  report FAIL T1d "workflow lacks the explicit origin/main refresh refspec"
fi

# ---------------------------------------------------------------
# T2: unexpected target ref fails closed (before any fetch)
# ---------------------------------------------------------------
(
  set -e
  cd "$TMP"
  git init -q --bare -b main origin-t2.git
  git init -q -b main work-t2
  cd work-t2
  git remote add origin "$TMP/origin-t2.git"
  echo base > f.txt
  git_q add f.txt
  git_q commit -qm base
  git_q push -q -u origin main
  touch docker-compose.prod.yml .env.production.local
)
T2_HEAD_BEFORE="$(git -C "$TMP/work-t2" rev-parse HEAD)"
T2_OUT="$TMP/t2-out.txt"
(
  cd "$TMP"
  TARGET_REF='refs/heads/evil' APP_DIR="$TMP/work-t2" bash "$REMOTE_SCRIPT"
) > "$T2_OUT" 2>&1
T2_EXIT=$?
T2_HEAD_AFTER="$(git -C "$TMP/work-t2" rev-parse HEAD)"

if [ "$T2_EXIT" -ne 0 ] && grep -q 'unexpected target ref' "$T2_OUT"; then
  report PASS T2a "unexpected TARGET_REF fails closed (exit $T2_EXIT)"
else
  report FAIL T2a "unexpected TARGET_REF did not fail closed (exit $T2_EXIT)"
fi
if [ "$T2_HEAD_BEFORE" = "$T2_HEAD_AFTER" ]; then
  report PASS T2b "working tree untouched on unexpected TARGET_REF"
else
  report FAIL T2b "working tree moved on unexpected TARGET_REF"
fi

# ---------------------------------------------------------------
# T3: missing preservation script fails closed before checkout
# ---------------------------------------------------------------
(
  set -e
  cd "$TMP"
  git init -q --bare -b main origin-t3.git
  git init -q -b main work-t3
  cd work-t3
  git remote add origin "$TMP/origin-t3.git"
  echo prev > f.txt
  git_q add f.txt
  git_q commit -qm prev
  T3_PREV="$(git rev-parse HEAD)"
  echo prev > "$TMP/t3-prev-sha"
  git_q push -q -u origin main

  # Target commit on main intentionally has NO scripts/deploy/checkout-preservation.sh.
  echo target > g.txt
  git_q add g.txt
  git_q commit -qm target
  git_q push -q origin main

  # Roll the working tree back to the previous release (previous deployment state).
  git_q reset -q --hard "$T3_PREV"
  touch docker-compose.prod.yml .env.production.local
)
T3_HEAD_BEFORE="$(git -C "$TMP/work-t3" rev-parse HEAD)"
T3_OUT="$TMP/t3-out.txt"
(
  cd "$TMP"
  TARGET_REF='refs/heads/main' APP_DIR="$TMP/work-t3" bash "$REMOTE_SCRIPT"
) > "$T3_OUT" 2>&1
T3_EXIT=$?
T3_HEAD_AFTER="$(git -C "$TMP/work-t3" rev-parse HEAD)"

if [ "$T3_EXIT" -ne 0 ] && grep -q 'could not retrieve preservation script' "$T3_OUT"; then
  report PASS T3a "missing preservation script fails closed (exit $T3_EXIT)"
else
  report FAIL T3a "missing preservation script did not fail closed (exit $T3_EXIT): $(tail -3 "$T3_OUT" | tr '\n' ' ')"
fi
if [ "$T3_HEAD_BEFORE" = "$T3_HEAD_AFTER" ]; then
  report PASS T3b "checkout aborted; working tree still at previous release"
else
  report FAIL T3b "working tree moved despite missing preservation script"
fi

# ---------------------------------------------------------------
# T4/T5: invocation contract — APP_DIR/TARGET_SHA env vars, not positionals
# ---------------------------------------------------------------
(
  set -e
  cd "$TMP"
  git init -q --bare -b main origin-t4.git
  git init -q -b main work-t4
  cd work-t4
  git remote add origin "$TMP/origin-t4.git"
  echo one > f.txt
  git_q add f.txt
  git_q commit -qm one
  git_q push -q -u origin main
)
T4_SHA="$(git -C "$TMP/work-t4" rev-parse HEAD)"

# T4: correct env-var contract succeeds on a clean tree.
T4_OUT="$TMP/t4-out.txt"
(
  cd "$TMP"
  APP_DIR="$TMP/work-t4" TARGET_SHA="$T4_SHA" bash "$GATE"
) > "$T4_OUT" 2>&1
T4_EXIT=$?
if [ "$T4_EXIT" -eq 0 ] && grep -q 'No untracked collisions' "$T4_OUT"; then
  report PASS T4 "APP_DIR/TARGET_SHA env contract works with real gate"
else
  report FAIL T4 "env-var invocation failed (exit $T4_EXIT): $(tail -3 "$T4_OUT" | tr '\n' ' ')"
fi

# T5: positional arguments are not an interface (old invocation must fail).
T5_OUT="$TMP/t5-out.txt"
(
  cd "$TMP"
  env -u APP_DIR -u TARGET_SHA bash "$GATE" "$TMP/work-t4" "$T4_SHA"
) > "$T5_OUT" 2>&1
T5_EXIT=$?
if [ "$T5_EXIT" -ne 0 ] && grep -q 'APP_DIR required' "$T5_OUT"; then
  report PASS T5 "positional-argument invocation rejected (env contract required)"
else
  report FAIL T5 "positional-argument invocation unexpectedly accepted (exit $T5_EXIT)"
fi

# Static contract: workflow invokes the gate with the env-var form only.
if grep -qF 'APP_DIR="$APP_DIR" TARGET_SHA="$TARGET_SHA" bash "$PRESERVE_SCRIPT"' "$WF" \
   && ! grep -qF 'bash "$PRESERVE_SCRIPT" "$APP_DIR" "$TARGET_SHA"' "$WF"; then
  report PASS T6 "workflow uses env-var invocation contract only"
else
  report FAIL T6 "workflow invocation contract incorrect"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
