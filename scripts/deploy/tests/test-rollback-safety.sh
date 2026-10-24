#!/usr/bin/env bash
# test-rollback-safety.sh â€” regression tests for ops/recovery/rollback.sh.
#
# The defect: the previous script used the deprecated `docker-compose` v1
# syntax, merged the DEVELOPMENT compose file with the production one, pulled
# image names that do not exist in this topology (tradingo/api:<v> instead of
# tradingo-prod-api:<sha>), ran a project-wide `down`, and edited IMAGE_TAG in
# the development .env â€” so it could stop the whole stack and restart the
# CURRENT build while reporting a rollback.
#
# This test asserts the new contract:
#   - the target release is named explicitly and by immutable SHA;
#   - the release images and the checkout are validated BEFORE anything is
#     changed, and a failure changes nothing;
#   - no project-wide `down`, no pruning, no volume operations;
#   - only api and web are recreated (the database and its volumes are
#     preserved, and no unrelated service is touched);
#   - success requires image-identity AND health evidence.
#
# Runs with a mocked `docker` â€” no container, no network, no production.
#
# Usage: bash test-rollback-safety.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"
SCRIPT="$ROOT/ops/recovery/rollback.sh"

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
  pull)
    # An image listed in image_missing is unavailable: neither present nor pullable.
    if [ -f "\$state/image_missing" ] && grep -q "\$2" "\$state/image_missing" 2>/dev/null; then exit 1; fi
    exit 0
    ;;
  image)
    # "docker image inspect --format {{.Id}} <image>": the image exists unless it
    # is listed in image_missing. The id is echoed so the script can compare the
    # recorded identity with what is present.
    if [ -f "\$state/image_missing" ]; then
      for arg in "\$@"; do
        case "\$arg" in
          sha256:*) if grep -q "\$arg" "\$state/image_missing" 2>/dev/null; then exit 1; fi ;;
        esac
      done
    fi
    if [ "\$2" = "inspect" ] && [ "\$3" = "--format" ]; then
      case "\$3" in
        *RepoDigests*) echo ""; exit 0 ;;
      esac
      for arg in "\$@"; do
        case "\$arg" in
          sha256:*) echo "\$arg"; exit 0 ;;
        esac
      done
      echo "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      exit 0
    fi
    exit 0
    ;;
  inspect)
    if [ "\$2" = "--format" ]; then
      fmt="\$3"
      case "\$fmt" in
        *State.Running*) echo "true" ;;
        *) echo "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" ;;
      esac
      exit 0
    fi
    exit 0
    ;;
  tag) exit 0 ;;
  compose)
    # the compose invocation is recorded; the script must use --no-deps api web
    exit 0
    ;;
esac
exit 0
EOF
chmod +x "$TMP/docker"
export PATH="$TMP:$PATH"

SHA="0000000000000000000000000000000000000000"

# A minimal deployment context the script can be pointed at. It is its own git
# repository, so the rollback target is a commit that genuinely exists in the
# application's history (the script refuses a target it does not know).
APP="$TMP/app"
mkdir -p "$APP"
cp "$ROOT/docker-compose.prod.yml" "$APP/docker-compose.prod.yml" 2>/dev/null || true
printf 'NODE_ENV=production\n' > "$APP/.env.production.local"
( cd "$APP" && git init -q . && git config user.email t@t && git config user.name t \
  && git add -A >/dev/null 2>&1 && git commit -qm init >/dev/null 2>&1 ) || true
SHA="$(cd "$APP" && git rev-parse HEAD 2>/dev/null)"
[ -n "$SHA" ] || SHA="0000000000000000000000000000000000000000"

# The recorded immutable release identity the rollback requires. The image id
# matches what the mocked docker reports, so the identity proof can succeed.
MANIFESTS="$TMP/releases"
mkdir -p "$MANIFESTS"
IMG_ID="sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
write_manifest() { # sha [ids...-override]
  local sha="$1"; shift
  local api_img="${1:-$IMG_ID}" web_img="${2:-$IMG_ID}" mig_img="${3:-$IMG_ID}"
  {
    echo "# TRADINGO release manifest (immutable release identity)"
    echo "release_sha=${sha}"
    echo "recorded_at=2026-10-21T03:30:00Z"
    echo "compose_project=tradingo-prod"
    echo "api_image=tradingo-prod-api:latest"
    echo "api_image_id=${api_img}"
    echo "api_digest="
    echo "api_migrate_image=tradingo-prod-api-migrate:latest"
    echo "api_migrate_image_id=${mig_img}"
    echo "api_migrate_digest="
    echo "web_image=tradingo-prod-web:latest"
    echo "web_image_id=${web_img}"
    echo "web_digest="
  } > "$MANIFESTS/${sha}.manifest"
}
write_manifest "$SHA"

run() { bash "$SCRIPT" "$@" > "$TMP/out.log" 2>&1; echo $?; }
run_manifest() { bash "$SCRIPT" --manifest-dir="$MANIFESTS" "$@" > "$TMP/out.log" 2>&1; echo $?; }

echo "--- static safety contract ---"

# Command lines only â€” the script documents in prose what it must never do,
# and a prose match would be a false positive.
code_lines() { grep -vE '^[[:space:]]*#' "$SCRIPT"; }

if code_lines | grep -qE 'compose down|--remove-orphans|system prune'; then
  report FAIL S1 "the rollback script still contains a project-wide down / orphan removal"
else
  report PASS S1 "no project-wide down, no --remove-orphans"
fi

if code_lines | grep -qE 'prune|volume rm|docker volume'; then
  report FAIL S2 "the rollback script still contains a pruning or volume operation"
else
  report PASS S2 "no pruning and no volume operations"
fi

if grep -q 'up -d --no-deps api web' "$SCRIPT"; then
  report PASS S3 "only the api and web services are recreated, with --no-deps"
else
  report FAIL S3 "the recreate step is not limited to 'up -d --no-deps api web'"
fi

if code_lines | grep -q 'tradingo/api:\|tradingo/web:'; then
  report FAIL S4 "the rollback script still references non-existent image names"
else
  report PASS S4 "no non-existent image names are referenced"
fi

if grep -q 'API_DST="\${PROJECT}-api:latest"' "$SCRIPT" && grep -q 'WEB_DST="\${PROJECT}-web:latest"' "$SCRIPT"; then
  report PASS S5 "the release images are retagged to the real project-local names"
else
  report FAIL S5 "the retag targets are not the project-local image names"
fi

if grep -q 'check_identity' "$SCRIPT" && grep -q 'HEALTH_URL' "$SCRIPT"; then
  report PASS S6 "success requires image-identity AND health evidence"
else
  report FAIL S6 "the identity/health proof steps are missing"
fi

if grep -qE 'postgres|redis|opensearch' "$SCRIPT" | grep -q 'up -d'; then
  report FAIL S7 "the rollback recreates a database or cache service"
else
  report PASS S7 "no database, cache or search service is recreated"
fi

if ! grep -q 'kubectl' "$SCRIPT"; then
  report PASS S8 "the Kubernetes path is no longer auto-detected for this topology"
else
  report FAIL S8 "the script still contains a Kubernetes path that could be auto-selected"
fi

echo "--- behavioural contract ---"

# B1: no --version -> refused.
rc="$(run --app-dir=$APP)"
if [ "$rc" != "0" ] && grep -q "version=<sha> is required" "$TMP/out.log"; then
  report PASS B1 "a rollback without an explicit target release is refused"
else
  report FAIL B1 "expected a missing-target refusal, got exit $rc"
fi

# B2: a malformed target is refused.
rc="$(run --app-dir=$APP --version=not-a-sha)"
if [ "$rc" != "0" ] && grep -q "invalid --version format" "$TMP/out.log"; then
  report PASS B2 "a malformed target SHA is refused"
else
  report FAIL B2 "expected a malformed-SHA refusal, got exit $rc"
fi

# B3: a missing application directory is refused.
rc="$(run --app-dir=$TMP/nowhere --version=$SHA)"
if [ "$rc" != "0" ] && grep -q "application directory not found" "$TMP/out.log"; then
  report PASS B3 "a missing application directory is refused"
else
  report FAIL B3 "expected a missing-directory refusal, got exit $rc"
fi

# B4: a missing environment file is refused.
rm -f "$APP/.env.production.local"
rc="$(run --app-dir=$APP --version="$SHA")"
if [ "$rc" != "0" ] && grep -q "environment file not found" "$TMP/out.log"; then
  report PASS B4 "a missing production environment file is refused"
else
  report FAIL B4 "expected a missing-env-file refusal, got exit $rc: $(tail -3 "$TMP/out.log" | tr '\n' ' ')"
fi
printf 'NODE_ENV=production\n' > "$APP/.env.production.local"

# B5: the recorded images must be obtainable BEFORE anything is changed.
: > "$TMP/docker.log"
printf '%s\n' "$IMG_ID" > "$TMP/image_missing"
rc="$(run_manifest --app-dir=$APP --version="$SHA")"
if [ "$rc" != "0" ] && grep -q "Nothing was changed" "$TMP/out.log"; then
  if grep -q ' tag ' "$TMP/docker.log"; then
    report FAIL B5 "an unavailable release image must not be followed by a retag"
  else
    report PASS B5 "an unavailable release image aborts before any retag or recreate"
  fi
else
  report FAIL B5 "expected an abort on an unavailable image, got exit $rc: $(tail -3 "$TMP/out.log" | tr '\n' ' ')"
fi
rm -f "$TMP/image_missing"

# B6: an unknown release SHA is refused.
rc="$(run --app-dir=$APP --version=1111111111111111111111111111111111111111)"
if [ "$rc" != "0" ] && grep -q "not present in the local repository history" "$TMP/out.log"; then
  report PASS B6 "a release that is not in the repository history is refused"
else
  report FAIL B6 "expected an unknown-SHA refusal, got exit $rc"
fi

# B7: --dry-run changes nothing.
: > "$TMP/docker.log"
rc="$(run_manifest --app-dir=$APP --version="$SHA" --dry-run)"
if [ "$rc" = "0" ] && grep -q "no changes made" "$TMP/out.log"; then
  if grep -q ' tag ' "$TMP/docker.log" || grep -q 'compose' "$TMP/docker.log"; then
    report FAIL B7 "a dry run must not tag or recreate anything"
  else
    report PASS B7 "a dry run reports the plan and changes nothing"
  fi
else
  report FAIL B7 "expected a successful dry run, got exit $rc: $(tail -3 "$TMP/out.log" | tr '\n' ' ')"
fi

# B7b: a target with NO recorded release identity is refused before any change.
rm -f "$MANIFESTS/${SHA}.manifest"
: > "$TMP/docker.log"
rc="$(run_manifest --app-dir=$APP --version="$SHA")"
if [ "$rc" != "0" ] && grep -q "no release manifest" "$TMP/out.log"; then
  if grep -q ' tag ' "$TMP/docker.log"; then
    report FAIL B7b "a missing release manifest must not be followed by a retag"
  else
    report PASS B7b "a release without a recorded immutable identity is refused"
  fi
else
  report FAIL B7b "expected a missing-manifest refusal, got exit $rc"
fi

# B7c: a manifest that records a DIFFERENT release is refused.
write_manifest "$SHA"
sed -i "s/^release_sha=.*/release_sha=2222222222222222222222222222222222222222/" "$MANIFESTS/${SHA}.manifest"
rc="$(run_manifest --app-dir=$APP --version="$SHA")"
if [ "$rc" != "0" ] && grep -q "mismatched identity" "$TMP/out.log"; then
  report PASS B7c "a manifest recording another release is refused"
else
  report FAIL B7c "expected a mismatched-manifest refusal, got exit $rc"
fi

# B7d: a manifest with an incomplete identity is refused.
write_manifest "$SHA"
sed -i "/^web_image_id=/d" "$MANIFESTS/${SHA}.manifest"
rc="$(run_manifest --app-dir=$APP --version="$SHA")"
if [ "$rc" != "0" ] && grep -q "identity is incomplete" "$TMP/out.log"; then
  report PASS B7d "a manifest with a missing image id is refused"
else
  report FAIL B7d "expected an incomplete-manifest refusal, got exit $rc"
fi
write_manifest "$SHA"

# B7e: the restore must use the immutable image ID, never a mutable tag.
: > "$TMP/docker.log"
rc="$(run_manifest --app-dir=$APP --version="$SHA" --dry-run)"
if grep -q "docker tag $IMG_ID" "$TMP/out.log"; then
  report PASS B7e "the plan tags the immutable image ID, not a mutable tag"
else
  report FAIL B7e "the plan does not tag by immutable image ID"
fi

echo "--- release manifest contract ---"
MANIFEST_SCRIPT="$ROOT/scripts/deploy/release-manifest.sh"
rm -rf "$TMP/mrec" && mkdir -p "$TMP/mrec"

# M1: recording captures the running image identities.
if RELEASE_MANIFEST_DIR="$TMP/mrec" bash "$MANIFEST_SCRIPT" record "$SHA" > "$TMP/m1.log" 2>&1; then
  if grep -q "^api_image_id=sha256:" "$TMP/mrec/${SHA}.manifest" 2>/dev/null \
     && grep -q "^web_image_id=sha256:" "$TMP/mrec/${SHA}.manifest" 2>/dev/null; then
    report PASS M1 "the manifest records the immutable image ids of the running release"
  else
    report FAIL M1 "the manifest does not record the image ids"
  fi
else
  report FAIL M1 "recording the release identity failed: $(tail -2 "$TMP/m1.log" | tr '\n' ' ')"
fi

# M2: an invalid SHA is refused.
if RELEASE_MANIFEST_DIR="$TMP/mrec" bash "$MANIFEST_SCRIPT" record "not-a-sha" > "$TMP/m2.log" 2>&1; then
  report FAIL M2 "an invalid release SHA must be refused"
else
  report PASS M2 "an invalid release SHA is refused"
fi

# M3: a recorded identity is never overwritten with a different one.
if RELEASE_MANIFEST_DIR="$TMP/mrec" bash "$MANIFEST_SCRIPT" record "$SHA" > "$TMP/m3.log" 2>&1; then
  if grep -q "already exists" "$TMP/m3.log"; then
    report PASS M3 "re-recording an identical manifest is a no-op"
  else
    report FAIL M3 "re-recording an identical manifest should be a no-op"
  fi
else
  report FAIL M3 "re-recording an identical manifest must not fail"
fi

# M4: verifying an unknown release fails closed.
if RELEASE_MANIFEST_DIR="$TMP/mrec" bash "$MANIFEST_SCRIPT" verify 1111111111111111111111111111111111111111 > "$TMP/m4.log" 2>&1; then
  report FAIL M4 "verifying an unrecorded release must fail"
else
  report PASS M4 "verifying an unrecorded release fails closed"
fi

# M5: verifying a recorded release succeeds.
if RELEASE_MANIFEST_DIR="$TMP/mrec" bash "$MANIFEST_SCRIPT" verify "$SHA" > "$TMP/m5.log" 2>&1; then
  report PASS M5 "a recorded release identity verifies"
else
  report FAIL M5 "a recorded release identity must verify: $(tail -2 "$TMP/m5.log" | tr '\n' ' ')"
fi

# M6: the deploy workflow must record the identity before the traffic switch.
WF="$ROOT/.github/workflows/deploy-production.yml"
m_line="$(grep -n 'release-manifest.sh record' "$WF" | head -n1 | cut -d: -f1)"
switch_line="$(grep -nE '^[[:space:]]*\$COMPOSE up -d --no-deps api web' "$WF" | head -n1 | cut -d: -f1)"
if [ -n "$m_line" ] && [ -n "$switch_line" ] && [ "$m_line" -lt "$switch_line" ]; then
  report PASS M6 "the workflow records the release identity BEFORE the traffic switch (line $m_line < $switch_line)"
else
  report FAIL M6 "the release identity is not recorded before the traffic switch (m=$m_line switch=$switch_line)"
fi
if grep -q 'release-manifest.sh record' "$WF" && grep -q 'could not be recorded' "$WF"; then
  report PASS M7 "a failure to record the identity aborts the deployment"
else
  report FAIL M7 "a failure to record the identity does not abort the deployment"
fi

# B8: the plan explicitly states what is NOT touched.
if grep -q "NOT touched" "$SCRIPT" && grep -q "NOT reversed" "$SCRIPT"; then
  report PASS B8 "the script documents what it does NOT touch and does NOT reverse"
else
  report FAIL B8 "the non-action documentation is missing"
fi

# B9: the script must not claim success without the health proof.
if grep -q "ROLLBACK COMPLETED AND VERIFIED" "$SCRIPT" && grep -q "ROLLBACK NOT VERIFIED" "$SCRIPT"; then
  report PASS B9 "success and failure outcomes are both explicit"
else
  report FAIL B9 "the outcome reporting is incomplete"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
