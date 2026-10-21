#!/usr/bin/env bash
# test-opensearch-contract.sh â€” regression tests for the OpenSearch endpoint and
# readiness contract introduced after the Phase 01U audit.
#
# The defect: the production deployment configuration pointed the API at
# http://host.docker.internal:9200, but the Compose opensearch service
# publishes NO host port, so the API constructed a client that could never
# connect. The observable symptom was a 200 discover response with an empty
# items array plus six failed queries per request â€” a silent misconfiguration.
#
# Covers: the generated configuration uses the compose service DNS name; the
# compose service is internal-only and shares the API network; the readiness
# gate preserves the optional (disabled) behaviour; the gate fails closed for
# an unreachable endpoint; and the deployment workflow starts and verifies
# OpenSearch before the traffic switch.
#
# Runs with a mocked `docker` and a mocked probe â€” no container, no network,
# no production.
#
# Usage: bash test-opensearch-contract.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"
GATE="$ROOT/scripts/deploy/verify-opensearch.sh"
DEPLOY="$ROOT/scripts/deploy/deploy-vps.sh"
COMPOSE="$ROOT/docker-compose.prod.yml"
WF="$ROOT/.github/workflows/deploy-production.yml"

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
# The mock answers `docker inspect` (container health) and `docker exec`
# (the reachability probe) from files in the temp dir. No container is created,
# no network is touched.
cat > "$TMP/docker" <<EOF
#!/usr/bin/env bash
state="$TMP"
case "\$1" in
  inspect)
    if [ "\$2" = "--format" ]; then
      fmt="\$3"
      case "\$fmt" in
        *State.Status*) cat "\$state/health" 2>/dev/null || echo "running|healthy" ;;
        *State.Health*) cat "\$state/health" 2>/dev/null || echo "running|healthy" ;;
        *) echo "cid" ;;
      esac
      exit 0
    fi
    exit 0
    ;;
  exec)
    cat "\$state/probe" 2>/dev/null || echo 200
    exit 0
    ;;
esac
exit 0
EOF
chmod +x "$TMP/docker"
export PATH="$TMP:$PATH"
printf 'running|healthy' > "$TMP/health"
printf '200' > "$TMP/probe"

# ---- static contract -------------------------------------------------------
echo "--- configuration contract ---"

if grep -q 'OPENSEARCH_URL=http://opensearch:9200' "$DEPLOY"; then
  report PASS O1 "the generated configuration uses the compose service DNS name"
else
  report FAIL O1 "deploy-vps.sh does not set OPENSEARCH_URL=http://opensearch:9200"
fi

if grep -vE '^[[:space:]]*#' "$DEPLOY" | grep -q 'host.docker.internal:9200'; then
  report FAIL O2 "the unreachable host.docker.internal:9200 endpoint is still present"
else
  report PASS O2 "no unreachable host.docker.internal OpenSearch endpoint remains"
fi

if grep -qE '^CLICKHOUSE_URL=$' "$DEPLOY"; then
  report PASS O3 "CLICKHOUSE_URL is empty (no ClickHouse service exists in the production compose)"
else
  report FAIL O3 "CLICKHOUSE_URL is not empty"
fi

# compose: the opensearch service must be internal-only and share the API network
if grep -q 'opensearchproject/opensearch' "$COMPOSE"; then
  report PASS O4 "the production compose provisions OpenSearch"
else
  report FAIL O4 "no OpenSearch service in the production compose"
fi

os_block="$(awk '/^  opensearch:/{f=1} f{print} f&&/^  [a-z-]+:$/&&!/opensearch:/{exit}' "$COMPOSE")"
if printf '%s' "$os_block" | grep -q 'tradingo-net'; then
  report PASS O5 "OpenSearch joins tradingo-net, the network the API also joins"
else
  report FAIL O5 "OpenSearch is not on tradingo-net"
fi
if printf '%s' "$os_block" | grep -qE '^\s+- "[0-9]+:[0-9]+'; then
  report FAIL O6 "OpenSearch publishes a host port (it must stay internal)"
else
  report PASS O6 "OpenSearch publishes no host port"
fi
if printf '%s' "$os_block" | grep -q 'DISABLE_SECURITY_PLUGIN'; then
  report PASS O7 "the production OpenSearch runs with the security plugin disabled (no credentials required)"
else
  report FAIL O7 "unexpected OpenSearch security configuration"
fi
api_block="$(awk '/^  api:/{f=1} f{print} f&&/^  [a-z-]+:$/&&!/api:/{exit}' "$COMPOSE")"
if printf '%s' "$api_block" | grep -q 'tradingo-net'; then
  report PASS O8 "the API joins tradingo-net, so the service DNS name resolves"
else
  report FAIL O8 "the API is not on tradingo-net"
fi

# ---- workflow wiring -------------------------------------------------------
echo "--- workflow wiring ---"
if grep -q 'verify-opensearch.sh' "$WF"; then
  report PASS O9 "the deployment workflow runs the OpenSearch readiness gate"
else
  report FAIL O9 "the workflow does not run verify-opensearch.sh"
fi
if grep -q 'verify-production-secrets.sh' "$WF"; then
  report PASS O10 "the deployment workflow runs the production configuration pre-flight"
else
  report FAIL O10 "the workflow does not run verify-production-secrets.sh"
fi

os_line="$(grep -n '^[[:space:]]*bash scripts/deploy/verify-opensearch\.sh' "$WF" | head -n1 | cut -d: -f1)"
recreate_line="$(grep -n '^[[:space:]]*\$COMPOSE up -d --no-deps api web' "$WF" | head -n1 | cut -d: -f1)"
if [ -n "$os_line" ] && [ -n "$recreate_line" ] && [ "$os_line" -lt "$recreate_line" ]; then
  report PASS O11 "the OpenSearch gate runs BEFORE the traffic switch (line $os_line < $recreate_line)"
else
  report FAIL O11 "the OpenSearch gate does not run before the traffic switch"
fi

sec_line="$(grep -n '^[[:space:]]*bash scripts/deploy/verify-production-secrets\.sh' "$WF" | head -n1 | cut -d: -f1)"
mig_line="$(grep -n '^[[:space:]]*\$COMPOSE run -T --rm --no-deps api-migrate' "$WF" | head -n1 | cut -d: -f1)"
if [ -n "$sec_line" ] && [ -n "$mig_line" ] && [ "$sec_line" -lt "$mig_line" ]; then
  report PASS O12 "the configuration pre-flight runs BEFORE the migration (line $sec_line < $mig_line)"
else
  report FAIL O12 "the configuration pre-flight does not run before the migration"
fi

# ---- behavioural contract ---------------------------------------------------
echo "--- readiness gate behaviour ---"

# D1: no endpoint configured -> optional behaviour preserved (exit 0).
printf 'NODE_ENV=production\n' > "$TMP/env-empty"
if bash "$GATE" --env-file "$TMP/env-empty" --deadline-sec 5 > "$TMP/o1.log" 2>&1; then
  if grep -q 'DISABLED' "$TMP/o1.log"; then
    report PASS O13 "an unconfigured endpoint is treated as intentionally disabled (exit 0)"
  else
    report FAIL O13 "exit 0 but no DISABLED diagnostic: $(cat "$TMP/o1.log")"
  fi
else
  report FAIL O13 "an unconfigured endpoint must not fail the gate"
fi

# D2: --require-enabled with no endpoint -> fail closed.
if bash "$GATE" --env-file "$TMP/env-empty" --require-enabled --deadline-sec 5 > "$TMP/o2.log" 2>&1; then
  report FAIL O14 "--require-enabled with no endpoint must fail"
else
  report PASS O14 "--require-enabled with no endpoint fails closed"
fi

# D3: a non-http endpoint is rejected.
printf 'OPENSEARCH_URL=ftp://opensearch:9200\n' > "$TMP/env-bad"
if bash "$GATE" --env-file "$TMP/env-bad" --deadline-sec 5 > "$TMP/o3.log" 2>&1; then
  report FAIL O15 "a non-http endpoint must be rejected"
else
  report PASS O15 "a non-http endpoint is rejected"
fi

# D4: the compose service endpoint, container healthy, probe 200 -> OK.
printf 'OPENSEARCH_URL=http://opensearch:9200\n' > "$TMP/env-ok"
printf '200' > "$TMP/probe"
if bash "$GATE" --env-file "$TMP/env-ok" --deadline-sec 5 > "$TMP/o4.log" 2>&1; then
  report PASS O16 "a healthy, reachable compose service endpoint passes"
else
  report FAIL O16 "expected success, got: $(cat "$TMP/o4.log")"
fi

# D5: the same endpoint but the probe fails -> fail closed.
printf '000' > "$TMP/probe"
if bash "$GATE" --env-file "$TMP/env-ok" --deadline-sec 5 > "$TMP/o5.log" 2>&1; then
  report FAIL O17 "an unreachable endpoint must fail closed"
else
  report PASS O17 "an unreachable endpoint fails closed"
fi

# D6: the container never becomes healthy -> fail closed.
printf 'running|starting' > "$TMP/health"
printf '200' > "$TMP/probe"
if bash "$GATE" --env-file "$TMP/env-ok" --deadline-sec 3 > "$TMP/o6.log" 2>&1; then
  report FAIL O18 "an unhealthy OpenSearch container must fail the gate"
else
  report PASS O18 "an unhealthy OpenSearch container fails the gate"
fi
printf 'running|healthy' > "$TMP/health"

# D7: credentials must never be printed.
printf 'OPENSEARCH_URL=http://user:sup3rs3cr3t@opensearch:9200\n' > "$TMP/env-creds"
if bash "$GATE" --env-file "$TMP/env-creds" --deadline-sec 5 > "$TMP/o7.log" 2>&1; then
  if grep -q 'sup3rs3cr3t' "$TMP/o7.log"; then
    report FAIL O19 "credentials in the endpoint were printed"
  else
    report PASS O19 "credentials in the endpoint are never printed"
  fi
else
  if grep -q 'sup3rs3cr3t' "$TMP/o7.log"; then
    report FAIL O19 "credentials in the endpoint were printed (on the failure path)"
  else
    report PASS O19 "credentials in the endpoint are never printed (failure path)"
  fi
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
