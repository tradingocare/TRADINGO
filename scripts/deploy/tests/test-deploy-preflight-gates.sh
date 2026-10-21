#!/usr/bin/env bash
# test-deploy-preflight-gates.sh — regression tests for the production
# deployment flow: the fail-closed gates that must be preserved, the order in
# which they run, and the explicit post-switch failure state.
#
# The Phase 01U audit found that the release could pass the pre-flight and
# still fail AFTER the traffic switch (secret validity was only proven at API
# boot; the OpenSearch endpoint could be unreachable). This test locks in the
# gate order and the failure handling.
#
# Static assertions only — no workflow is executed, no container is touched.
#
# Usage: bash test-deploy-preflight-gates.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"
WF="$ROOT/.github/workflows/deploy-production.yml"
COMPOSE="$ROOT/docker-compose.prod.yml"

PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    *) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

line_of() { grep -n "$1" "$WF" | head -n1 | cut -d: -f1; }
# Command lines only: the workflow header documents these gates in prose, and a
# prose match would be attributed to the command that actually runs.
code_lines() { grep -vE '^[[:space:]]*#' "$WF"; }

echo "--- preserved fail-closed gates ---"

for gate in verify-backup.sh verify-release-images.sh wait-for-ready.sh smoke-test.sh; do
  if grep -q "$gate" "$WF"; then
    report PASS "G-$gate" "the $gate gate is still wired into the workflow"
  else
    report FAIL "G-$gate" "the $gate gate is missing from the workflow"
  fi
done

if grep -q 'TRADINGO_DEPLOY_VERIFIED_OK' "$WF"; then
  report PASS G-marker "the terminal release marker is still present"
else
  report FAIL G-marker "the terminal release marker is missing"
fi

if grep -q 'grep -q .TRADINGO_DEPLOY_VERIFIED_OK target=' "$WF"; then
  report PASS G-marker-gate "the runner still refuses success without the marker"
else
  report FAIL G-marker-gate "the marker is no longer enforced by the runner"
fi

echo "--- gate ordering ---"

backup_line="$(line_of '^[[:space:]]*ALLOW_STALE_BACKUP=.*verify-backup\.sh')"
secrets_line="$(line_of '^[[:space:]]*bash scripts/deploy/verify-production-secrets\.sh')"
opensearch_line="$(line_of '^[[:space:]]*bash scripts/deploy/verify-opensearch\.sh')"
migrate_line="$(line_of '^[[:space:]]*\$COMPOSE run -T --rm --no-deps api-migrate')"
recreate_line="$(line_of '^[[:space:]]*\$COMPOSE up -d --no-deps api web')"
identity_line="$(line_of '^[[:space:]]*bash scripts/deploy/verify-release-images\.sh')"
ready_line="$(line_of '^[[:space:]]*bash scripts/deploy/wait-for-ready\.sh')"
smoke_line="$(line_of '^[[:space:]]*if bash scripts/deploy/smoke-test\.sh http://localhost:3001')"

order_ok=1
[ -n "$backup_line" ] && [ -n "$secrets_line" ] && [ "$backup_line" -lt "$secrets_line" ] || order_ok=0
[ -n "$secrets_line" ] && [ -n "$opensearch_line" ] && [ "$secrets_line" -lt "$opensearch_line" ] || order_ok=0
[ -n "$opensearch_line" ] && [ -n "$migrate_line" ] && [ "$opensearch_line" -lt "$migrate_line" ] || order_ok=0
[ -n "$migrate_line" ] && [ -n "$recreate_line" ] && [ "$migrate_line" -lt "$recreate_line" ] || order_ok=0
[ -n "$recreate_line" ] && [ -n "$identity_line" ] && [ "$recreate_line" -lt "$identity_line" ] || order_ok=0
[ -n "$identity_line" ] && [ -n "$ready_line" ] && [ "$identity_line" -lt "$ready_line" ] || order_ok=0
[ -n "$ready_line" ] && [ -n "$smoke_line" ] && [ "$ready_line" -lt "$smoke_line" ] || order_ok=0

if [ "$order_ok" = "1" ]; then
  report PASS G-order "the gate order is backup -> config -> opensearch -> migrate -> recreate -> identity -> readiness -> smoke"
else
  report FAIL G-order "the gate order is wrong (backup=$backup_line secrets=$secrets_line opensearch=$opensearch_line migrate=$migrate_line recreate=$recreate_line identity=$identity_line ready=$ready_line smoke=$smoke_line)"
fi

if [ -n "$backup_line" ] && [ -n "$recreate_line" ] && [ "$backup_line" -lt "$recreate_line" ]; then
  report PASS G-backup-before-switch "the backup gate runs before the traffic switch"
else
  report FAIL G-backup-before-switch "the backup gate does not run before the traffic switch"
fi

if [ -n "$secrets_line" ] && [ -n "$recreate_line" ] && [ "$secrets_line" -lt "$recreate_line" ]; then
  report PASS G-secrets-before-switch "the configuration pre-flight runs before the traffic switch"
else
  report FAIL G-secrets-before-switch "the configuration pre-flight does not run before the traffic switch"
fi

echo "--- post-switch failure handling ---"

if grep -q 'PARTIAL DEPLOYMENT — RECOVERY REQUIRED' "$WF"; then
  report PASS G-partial "a post-switch failure is reported as a partial deployment"
else
  report FAIL G-partial "no explicit partial-deployment state is reported"
fi

if grep -q 'TRADINGO_DEPLOY_FAILED_AFTER_SWITCH' "$WF"; then
  report PASS G-failed-marker "a post-switch failure emits a machine-readable marker"
else
  report FAIL G-failed-marker "no post-switch failure marker"
fi

if grep -q 'ops/recovery/rollback.sh --version=' "$WF"; then
  report PASS G-rollback-ref "the failure path names the verified rollback command"
else
  report FAIL G-rollback-ref "the failure path does not name the rollback command"
fi

if grep -q 'NOT rolling back automatically' "$WF"; then
  report PASS G-no-auto-rollback "the workflow still states that it does not auto-roll-back"
else
  report FAIL G-no-auto-rollback "the no-auto-rollback statement is missing"
fi

if code_lines | grep -vE '^[[:space:]]*echo' | grep -qE 'compose down|--remove-orphans'; then
  report FAIL G-no-down "the workflow contains a project-wide down"
else
  report PASS G-no-down "the workflow never runs a project-wide down"
fi

if code_lines | grep -vE '^[[:space:]]*echo' | grep -qE 'prune'; then
  report FAIL G-no-prune "the workflow contains a prune operation"
else
  report PASS G-no-prune "the workflow never prunes"
fi

echo "--- production compose topology ---"

if grep -q 'profiles: \["standalone-db"\]' "$COMPOSE"; then
  report PASS C-profile "the standalone database/redis services are behind a profile"
else
  report FAIL C-profile "the standalone-db profile is missing"
fi

api_block="$(awk '/^  api:/{f=1} f{print} f&&/^  [a-z-]+:$/&&!/api:/{exit}' "$COMPOSE")"
if printf '%s' "$api_block" | grep -q 'condition: service_healthy'; then
  report FAIL C-deps "the api service still depends on a profiled database service"
else
  report PASS C-deps "the api service no longer depends on the profiled database services"
fi

if printf '%s' "$api_block" | grep -q 'api-migrate:'; then
  report PASS C-migrate-dep "the api service still waits for the migration container"
else
  report FAIL C-migrate-dep "the api service lost its api-migrate dependency"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
