#!/usr/bin/env bash
# TRADINGO — pre-checkout untracked-collision preservation gate.
#
# Purpose: `git checkout <target>` refuses to run when untracked working-tree
# files collide with paths tracked by the target commit. This gate detects
# exactly those collisions, copies them to a unique recovery directory OUTSIDE
# the repository, verifies every copy, and only then removes the sources so
# checkout can proceed. Any failure aborts BEFORE checkout (fail closed).
#
# Environment:
#   APP_DIR          repository working tree on the VPS (required)
#   TARGET_SHA       exact release SHA to check out (required)
#   RECOVERY_PARENT  recovery base dir (default: ${APP_DIR}-recovery)
#   PRESERVE_TEST_HOOK (test only; never set in production) — evaluated between
#                      copy and verify to simulate external mutation.
#
# Exit codes: 0 = proceed to checkout; 1 = abort (working tree still at previous
# release; sources untouched unless verification already passed).
#
# Safety properties:
# - NUL-delimited path handling throughout (spaces/tabs/newlines safe).
# - Symlinks are replicated as links, never followed.
# - Ignored files/descendants colliding with target paths abort the run
#   (secrets/certificates must never be overwritten silently).
# - No `git clean`, `git reset --hard`, forced checkout, or blanket deletion.
# - Recovery directory is unique per run (timestamp + PID), mode 700.
# - Atomic mkdir advisory lock prevents concurrent deployments on one host.
set -uo pipefail

APP_DIR="${APP_DIR:?APP_DIR required}"
TARGET_SHA="${TARGET_SHA:?TARGET_SHA required}"
RECOVERY_PARENT="${RECOVERY_PARENT:-${APP_DIR}-recovery}"

(
  set -euo pipefail
  cd "$APP_DIR" || { echo "ERROR: cannot cd $APP_DIR"; exit 1; }

  echo "=== Pre-checkout: untracked collision preservation ==="

  # ---- 0. VPS working-tree advisory lock (atomic mkdir + PID ownership) ----
  LOCK_DIR="${APP_DIR}/.deploy.lock"
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "ERROR: Another deployment holds the lock ($LOCK_DIR). Aborting."
    exit 1
  fi
  echo "$$" > "${LOCK_DIR}/pid"
  # shellcheck disable=SC2064
  trap "if [ -f '${LOCK_DIR}/pid' ] && [ \"\$(cat '${LOCK_DIR}/pid' 2>/dev/null)\" = '$$' ]; then rm -rf '${LOCK_DIR}'; fi" EXIT
  echo "Deployment lock acquired (PID $$)."

  # ---- 1. Target-tracked paths (NUL-delimited, sorted) ----
  TARGET_PATHS="$(mktemp)"
  git ls-tree -rz --name-only "$TARGET_SHA" | sort -z > "$TARGET_PATHS" || {
    echo "ERROR: Failed to enumerate target commit paths"; exit 1; }

  # ---- 2. Untracked working-tree entries (NUL-delimited, sorted) ----
  # NOTE: git ls-files --others lists individual files; untracked dirs appear
  # as their contained files (with --directory it collapses, so no flag here).
  UNTRACKED_PATHS="$(mktemp)"
  git ls-files --others --exclude-standard -z | sort -z > "$UNTRACKED_PATHS" || {
    echo "ERROR: Failed to enumerate untracked files"; exit 1; }

  # ---- 3. Ignored files + ignored-directory descendants (fail-closed) ----
  IGNORED_RAW="$(mktemp)"
  git ls-files --others --ignored --exclude-standard -z | sort -z > "$IGNORED_RAW" || {
    echo "ERROR: Failed to enumerate ignored paths"; exit 1; }
  IGNORED_EXPANDED="$(mktemp)"
  : > "$IGNORED_EXPANDED"
  while IFS= read -rd '' ip; do
    if [ -d "${APP_DIR}/${ip}" ]; then
      # Ignored directory: expand to descendant files (relative to repo root)
      ( cd "$APP_DIR" && find "$ip" \( -type f -o -type l \) -print0 2>/dev/null ) >> "$IGNORED_EXPANDED" || true
    elif [ -e "${APP_DIR}/${ip}" ] || [ -L "${APP_DIR}/${ip}" ]; then
      printf '%s\0' "$ip" >> "$IGNORED_EXPANDED"
    fi
  done < "$IGNORED_RAW"
  sort -z -u "$IGNORED_EXPANDED" -o "$IGNORED_EXPANDED"
  IGNORED_COLLISIONS="$(mktemp)"
  comm -z -12 "$IGNORED_EXPANDED" "$TARGET_PATHS" > "$IGNORED_COLLISIONS" || true
  if [ -s "$IGNORED_COLLISIONS" ]; then
    echo "ERROR: Ignored files/descendants collide with target commit paths:"
    tr '\0' '\n' < "$IGNORED_COLLISIONS" | sed 's/^/  /'
    echo "Manual resolution required (secrets/certs at stake)."
    exit 1
  fi
  echo "Ignored-path check: clean."

  # ---- 4. Collision set: exact matches + ancestor/descendant conflicts ----
  # Git checkout fails for (a) exact path matches, (b) untracked DIR blocking a
  # target path beneath it, (c) untracked FILE blocking a target path beneath it,
  # (d) untracked path beneath a target FILE's location.
  COLLISION_PATHS="$(mktemp)"
  t_joined="$(tr '\0' '\n' < "$TARGET_PATHS")"
  while IFS= read -rd '' up; do
    hit=0
    # (a) exact match
    if printf '%s\n' "$t_joined" | grep -qxF "$up"; then hit=1; fi
    # (b)+(c): any target path strictly beneath untracked path (untracked is ancestor)
    if [ "$hit" -eq 0 ] && printf '%s\n' "$t_joined" | grep -qF "${up}/"; then hit=1; fi
    # (d): any ancestor of untracked path is a target path (target is ancestor)
    if [ "$hit" -eq 0 ]; then
      anc="$up"
      while [[ "$anc" == */* ]]; do
        anc="${anc%/*}"
        if printf '%s\n' "$t_joined" | grep -qxF "$anc"; then hit=1; break; fi
      done
    fi
    if [ "$hit" -eq 1 ]; then printf '%s\0' "$up" >> "$COLLISION_PATHS"; fi
  done < "$UNTRACKED_PATHS"

  COLLISION_COUNT=$(tr -cd '\0' < "$COLLISION_PATHS" | wc -c)

  if [ "$COLLISION_COUNT" -eq 0 ]; then
    echo "No untracked collisions with target commit."
    rm -f "$TARGET_PATHS" "$UNTRACKED_PATHS" "$IGNORED_RAW" "$IGNORED_EXPANDED" "$IGNORED_COLLISIONS" "$COLLISION_PATHS"
    exit 0
  fi
  echo "Found $COLLISION_COUNT untracked collision(s). Preserving..."

  # ---- 5. Unique recovery directory (outside repo, mode 700) ----
  mkdir -p "$RECOVERY_PARENT" || { echo "ERROR: Cannot create recovery base $RECOVERY_PARENT"; exit 1; }
  chmod 700 "$RECOVERY_PARENT" 2>/dev/null || { echo "ERROR: Cannot secure recovery base $RECOVERY_PARENT"; exit 1; }
  if [ ! -w "$RECOVERY_PARENT" ]; then
    echo "ERROR: Recovery base not writable: $RECOVERY_PARENT"; exit 1
  fi
  RECOVERY_DIR="${RECOVERY_PARENT}/untracked-$(date -u +%Y%m%dT%H%M%SZ)-$$"
  if [ -e "$RECOVERY_DIR" ]; then
    echo "ERROR: Recovery dir already exists (refusing to overwrite): $RECOVERY_DIR"; exit 1
  fi
  mkdir -p "$RECOVERY_DIR" || { echo "ERROR: Cannot create recovery dir"; exit 1; }
  chmod 700 "$RECOVERY_DIR" 2>/dev/null || { echo "ERROR: Cannot secure recovery dir"; exit 1; }
  echo "Recovery directory: $RECOVERY_DIR"
  echo "RECOVERY_DIR=$RECOVERY_DIR"

  # ---- 6. Manifests (NUL-delimited: hash\0mode\0path\0, link\0path\0, dirhash\0path\0) ----
  M_FILE="${RECOVERY_DIR}/MANIFEST.files"
  M_LINK="${RECOVERY_DIR}/MANIFEST.links"
  M_DIRS="${RECOVERY_DIR}/MANIFEST.dirs"
  : > "$M_FILE"; : > "$M_LINK"; : > "$M_DIRS"

  # ---- 7. Copy each collision into recovery (COPY first, remove only after verify)
  # Two-phase (copy -> verify all -> remove all) keeps the pristine source
  # until verification passes. On any failure the source is still in place.
  PRESERVED=0
  while IFS= read -rd '' f; do
    src="${APP_DIR}/${f}"
    if [ ! -e "$src" ] && [ ! -L "$src" ]; then
      echo "ERROR: $src vanished between scan and copy — aborting"; exit 1
    fi
    dst="${RECOVERY_DIR}/${f}"
    mkdir -p "$(dirname "$dst")" || { echo "ERROR: mkdir failed for $dst"; exit 1; }

    if [ -L "$src" ]; then
      # Symlink: replicate the link itself (never follow it)
      link_target="$(readlink "$src")" || { echo "ERROR: readlink failed for $src"; exit 1; }
      ln -s "$link_target" "$dst" || { echo "ERROR: ln -s failed for $src"; exit 1; }
      printf '%s\0%s\0' "$link_target" "$f" >> "$M_LINK"
      echo "  Copied symlink: $f"
    elif [ -f "$src" ]; then
      # hash BEFORE copy; verify AFTER copy (detects mutation in between)
      h="$(sha256sum "$src" | cut -d' ' -f1)" || { echo "ERROR: hash failed for $src"; exit 1; }
      m="$(stat -c '%a' "$src")" || { echo "ERROR: stat failed for $src"; exit 1; }
      cp -p "$src" "$dst" || { echo "ERROR: cp -p failed for $src"; exit 1; }
      printf '%s\0%s\0%s\0' "$h" "$m" "$f" >> "$M_FILE"
      echo "  Copied file: $f"
    elif [ -d "$src" ]; then
      dh="$(cd "$src" && find . \( -type f -o -type l \) -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1)" || { echo "ERROR: dir hash failed for $src"; exit 1; }
      cp -rp "$src" "$dst" || { echo "ERROR: cp -rp failed for $src"; exit 1; }
      printf '%s\0%s\0' "$dh" "$f" >> "$M_DIRS"
      echo "  Copied directory: $f"
    else
      echo "ERROR: $src unsupported type (block/char/fifo/socket) — aborting"; exit 1
    fi
    PRESERVED=$((PRESERVED + 1))
  done < "$COLLISION_PATHS"

  # ---- 7b. Optional test hook (test only; never set in production) ----
  if [ -n "${PRESERVE_TEST_HOOK:-}" ]; then
    # shellcheck disable=SC2086
    eval "$PRESERVE_TEST_HOOK" || { echo "ERROR: test hook failed"; exit 1; }
  fi

  # ---- 8. Verify copies (fail on ANY mismatch; sources still in place) ----
  echo "Verifying $PRESERVED copied entr(ies)..."
  verify_fail() { echo "ERROR: verification failed: $1 (sources untouched, recovery left for inspection)"; exit 1; }
  if [ -s "$M_FILE" ]; then
    while IFS= read -rd '' eh && IFS= read -rd '' em && IFS= read -rd '' p; do
      sp="${APP_DIR}/${p}" dp="${RECOVERY_DIR}/${p}"
      [ -f "$sp" ] || verify_fail "source file vanished: $p"
      [ -f "$dp" ] || verify_fail "recovery file missing: $p"
      ah="$(sha256sum "$dp" | cut -d' ' -f1)"
      [ "$ah" = "$eh" ] || verify_fail "recovery file hash mismatch: $p"
      sh2="$(sha256sum "$sp" | cut -d' ' -f1)"
      [ "$sh2" = "$eh" ] || verify_fail "source changed during copy: $p"
      sm="$(stat -c '%a' "$sp")"; dm="$(stat -c '%a' "$dp")"
      [ "$sm" = "$dm" ] || [ "$sm" = "$em" ] || verify_fail "mode mismatch: $p ($sm vs $dm)"
    done < "$M_FILE"
    echo "  files: OK"
  fi
  if [ -s "$M_LINK" ]; then
    while IFS= read -rd '' et && IFS= read -rd '' p; do
      sp="${APP_DIR}/${p}" dp="${RECOVERY_DIR}/${p}"
      [ -L "$sp" ] || verify_fail "source symlink vanished: $p"
      [ -L "$dp" ] || verify_fail "recovery symlink missing: $p"
      at="$(readlink "$dp")"
      [ "$at" = "$et" ] || verify_fail "symlink target mismatch: $p"
      st2="$(readlink "$sp")"
      [ "$st2" = "$et" ] || verify_fail "source link changed during copy: $p"
    done < "$M_LINK"
    echo "  symlinks: OK"
  fi
  if [ -s "$M_DIRS" ]; then
    while IFS= read -rd '' eh && IFS= read -rd '' p; do
      sp="${APP_DIR}/${p}" dp="${RECOVERY_DIR}/${p}"
      [ -d "$sp" ] || verify_fail "source directory vanished: $p"
      [ -d "$dp" ] || verify_fail "recovery directory missing: $p"
      ah="$(cd "$dp" && find . \( -type f -o -type l \) -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1)"
      [ "$ah" = "$eh" ] || verify_fail "directory hash mismatch: $p"
      sh2="$(cd "$sp" && find . \( -type f -o -type l \) -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1)"
      [ "$sh2" = "$eh" ] || verify_fail "source directory changed during copy: $p"
    done < "$M_DIRS"
    echo "  directories: OK"
  fi

  # ---- 9. All verified: remove sources so checkout can proceed ----
  echo "Removing $PRESERVED verified source(s) from working tree..."
  if [ -s "$M_FILE" ] || [ -s "$M_LINK" ] || [ -s "$M_DIRS" ]; then
    while IFS= read -rd '' p; do
      rm -f "${APP_DIR}/${p}" || verify_fail "cannot remove source file: $p"
    done < <(while IFS= read -rd '' _h && IFS= read -rd '' _m && IFS= read -rd '' _p; do printf '%s\0' "$_p"; done < "$M_FILE")
    while IFS= read -rd '' _t && IFS= read -rd '' _p; do
      rm -f "${APP_DIR}/${_p}" || verify_fail "cannot remove source link: $_p"
    done < "$M_LINK"
    while IFS= read -rd '' _h && IFS= read -rd '' _p; do
      rm -rf "${APP_DIR}/${_p}" || verify_fail "cannot remove source dir: $_p"
    done < "$M_DIRS"
    # Leftover empty parent dirs are harmless (git checkout recreates needed paths).
    echo "  sources removed."
  fi

  echo "All manifests verified."
  rm -f "$TARGET_PATHS" "$UNTRACKED_PATHS" "$IGNORED_RAW" "$IGNORED_EXPANDED" "$IGNORED_COLLISIONS" "$COLLISION_PATHS"
  exit 0
)
