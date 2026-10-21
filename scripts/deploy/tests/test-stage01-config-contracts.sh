#!/usr/bin/env bash
# test-stage01-config-contracts.sh — regression tests for the two
# configuration contracts corrected in Stage 0.1:
#
#   1. CLICKHOUSE: the production configuration must not point at an endpoint
#      that does not exist. Phase 01V verified on the live Hostinger host that
#      `CLICKHOUSE_URL=http://host.docker.internal:8123` is present in the
#      production env file while NO ClickHouse service exists in
#      docker-compose.prod.yml and no ClickHouse host port is published — so the
#      API would construct a client that can never connect. ClickHouse must stay
#      genuinely optional: absent/empty => no client, Prisma aggregations.
#
#   2. DISCOVER INDEXING: the reindex command must be runnable against the
#      production topology (endpoint from the environment, no fabricated
#      localhost endpoint or default credentials), must create indices with
#      EXPLICIT mappings, must be idempotent, and must offer a dry run.
#
# Static source contracts only: no Docker, no database, no OpenSearch, no
# production contact.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"

PASS=0; FAIL=0
report() {
  case "$1" in
    PASS) PASS=$((PASS+1)); echo "PASS: $2 -- $3" ;;
    *) FAIL=$((FAIL+1)); echo "FAIL: $2 -- $3" ;;
  esac
}

ENV_PROD="$ROOT/.env.production"
ENV_PROD_EXAMPLE="$ROOT/.env.production.local.example"
DEPLOY_VPS="$ROOT/scripts/deploy/deploy-vps.sh"
COMPOSE_PROD="$ROOT/docker-compose.prod.yml"
COMPOSE_DEV="$ROOT/docker-compose.yml"
API_CONFIG="$ROOT/apps/api/src/config/app.config.ts"
REINDEX="$ROOT/scripts/reindex-products.js"

echo "--- ClickHouse: the production configuration ---"

# Only ACTIVE assignments count: the comments deliberately mention the retired
# endpoint so the reasoning is documented in the file itself.
active_lines() { grep -vE '^[[:space:]]*#' "$1" 2>/dev/null; }

# C1: the tracked production template must not carry the unreachable endpoint.
if active_lines "$ENV_PROD" | grep -qE '^CLICKHOUSE_URL=https?://host\.docker\.internal'; then
  report FAIL C1 "the production template still points ClickHouse at host.docker.internal"
else
  report PASS C1 "the production template has no host.docker.internal ClickHouse endpoint"
fi

# C2: the production template's ClickHouse URL must be empty (optional).
clickhouse_val="$(grep -E '^CLICKHOUSE_URL=' "$ENV_PROD" 2>/dev/null | head -n1 | cut -d= -f2- | tr -d ' \r')"
if [ -z "$clickhouse_val" ]; then
  report PASS C2 "the production template leaves CLICKHOUSE_URL empty (optional)"
else
  report FAIL C2 "the production template still sets CLICKHOUSE_URL='$clickhouse_val'"
fi

# C3: no production source may point ClickHouse at the host gateway.
hit=""
for f in "$ENV_PROD" "$ENV_PROD_EXAMPLE" "$ROOT/scripts/deploy/deploy-vps.sh" "$ROOT/.github/workflows/deploy-production.yml"; do
  [ -f "$f" ] || continue
  if active_lines "$f" | grep -qE 'CLICKHOUSE_URL=.*host\.docker\.internal'; then
    hit="$hit $(basename "$f")"
  fi
done
if [ -n "$hit" ]; then
  report FAIL C3 "a production source still points ClickHouse at host.docker.internal:$hit"
else
  report PASS C3 "no production source points ClickHouse at host.docker.internal"
fi

# C4: the deployment generator must emit an empty ClickHouse URL.
if grep -qE '^CLICKHOUSE_URL=$' "$DEPLOY_VPS" 2>/dev/null; then
  report PASS C4 "the deployment generator writes an empty CLICKHOUSE_URL"
else
  report FAIL C4 "the deployment generator does not write an empty CLICKHOUSE_URL"
fi

# C5: the production compose must not force a ClickHouse endpoint.
if grep -q 'CLICKHOUSE_URL' "$COMPOSE_PROD" 2>/dev/null; then
  report FAIL C5 "the production compose still forces a CLICKHOUSE_URL"
else
  report PASS C5 "the production compose does not force a CLICKHOUSE_URL"
fi

# C6: ClickHouse stays optional in the API configuration.
if grep -q "url: process.env.CLICKHOUSE_URL || ''" "$API_CONFIG" 2>/dev/null; then
  report PASS C6 "the API reads an optional ClickHouse URL (no fabricated endpoint)"
else
  report FAIL C6 "the API no longer treats the ClickHouse URL as optional"
fi
if grep -q "CLICKHOUSE_URL: Joi.string().uri().allow('').optional()" "$API_CONFIG" 2>/dev/null; then
  report PASS C7 "the Joi schema tolerates an absent or empty ClickHouse URL"
else
  report FAIL C7 "the Joi schema no longer tolerates an absent or empty ClickHouse URL"
fi

# C8: the API must not construct a client when no endpoint is configured.
CLICKHOUSE_SERVICE="$ROOT/apps/api/src/modules/analytics/clickhouse.service.ts"
if [ -f "$CLICKHOUSE_SERVICE" ] && grep -q "configService.get<string>('clickhouse.url')" "$CLICKHOUSE_SERVICE" 2>/dev/null; then
  if grep -qE "if \(!url\)|if \(!url \|\| !url\.trim\(\)\)" "$CLICKHOUSE_SERVICE" 2>/dev/null; then
    report PASS C8 "the ClickHouse client is not created without a configured endpoint"
  else
    report FAIL C8 "the ClickHouse service does not guard on an absent endpoint"
  fi
else
  report FAIL C8 "the ClickHouse service could not be inspected"
fi

# C9: the worktree compose must not force a ClickHouse endpoint either.
if grep -q 'CLICKHOUSE_URL' "$COMPOSE_DEV" 2>/dev/null; then
  report FAIL C9 "the development compose still forces a CLICKHOUSE_URL"
else
  report PASS C9 "the development compose does not force a CLICKHOUSE_URL"
fi

echo "--- Discover indexing: the reindex command ---"

# Only active code counts: the header comment deliberately quotes the retired
# endpoint and credentials so the reason for the rewrite is documented.
reindex_code() { grep -vE '^\s*(\*|//|/\*)' "$REINDEX" 2>/dev/null; }

# D1: no fabricated endpoint and no default credentials.
if reindex_code | grep -qE "node: *'http://localhost:9200'"; then
  report FAIL D1 "the reindex script still hard-codes a localhost OpenSearch endpoint"
else
  report PASS D1 "the reindex script has no hard-coded OpenSearch endpoint"
fi
if reindex_code | grep -qE "username: *'admin'.*password: *'admin'"; then
  report FAIL D2 "the reindex script still hard-codes default credentials"
else
  report PASS D2 "the reindex script has no hard-coded OpenSearch credentials"
fi

# D3: the endpoint must come from the environment.
if grep -q "process.env.OPENSEARCH_URL" "$REINDEX" 2>/dev/null; then
  report PASS D3 "the reindex script reads OPENSEARCH_URL from the environment"
else
  report FAIL D3 "the reindex script does not read OPENSEARCH_URL"
fi

# D4: it must refuse to run without an endpoint.
if grep -q "OPENSEARCH_URL is not set" "$REINDEX" 2>/dev/null; then
  report PASS D4 "the reindex script refuses to run without an endpoint"
else
  report FAIL D4 "the reindex script has no guard for a missing endpoint"
fi

# D5: a dry run must exist and must not write.
if grep -q -- "--dry-run" "$REINDEX" 2>/dev/null && grep -q "DRY RUN — nothing was written" "$REINDEX" 2>/dev/null; then
  report PASS D5 "the reindex script offers a dry run that writes nothing"
else
  report FAIL D5 "the reindex script has no usable dry run"
fi

# D6: a destructive recreate must require an explicit second confirmation.
if grep -q -- "--allow-destructive" "$REINDEX" 2>/dev/null; then
  report PASS D6 "recreating an index requires --allow-destructive"
else
  report FAIL D6 "recreating an index is not guarded"
fi

# D7: explicit mappings for every index the discover feed queries.
for idx in products companies categories industries; do
  if grep -q "^  $idx: {" "$REINDEX" 2>/dev/null && grep -q "name_suggest: { type: 'completion' }" "$REINDEX" 2>/dev/null; then
    report PASS "D7-$idx" "an explicit mapping is defined for '$idx'"
  else
    report FAIL "D7-$idx" "no explicit mapping for '$idx'"
  fi
done

# D8: the fields the discover feed filters and sorts on must be mapped.
for f in "status: { type: 'keyword' }" "isFeatured: { type: 'boolean' }" "trustScoreSnapshot: { type: 'float' }" "verificationLevel: { type: 'keyword' }"; do
  if grep -qF "$f" "$REINDEX" 2>/dev/null; then
    report PASS "D8-$f" "the discover query field is explicitly mapped"
  else
    report FAIL "D8-$f" "the discover query field is not explicitly mapped"
  fi
done

# D9: writes must be idempotent (upsert by primary id) and must refresh.
if grep -q "id: p.id" "$REINDEX" 2>/dev/null && grep -q "id: c.id" "$REINDEX" 2>/dev/null; then
  report PASS D9 "documents are written by primary id (idempotent upsert)"
else
  report FAIL D9 "documents are not written by primary id"
fi
if grep -q "indices.refresh" "$REINDEX" 2>/dev/null; then
  report PASS D10 "the indices are refreshed so the API sees the new documents"
else
  report FAIL D10 "the indices are never refreshed"
fi

# D11: stale documents must be an explicit, guarded operation.
if grep -q -- "--prune" "$REINDEX" 2>/dev/null; then
  report PASS D11 "stale-document removal is available and explicitly flagged"
else
  report FAIL D11 "no stale-document handling exists"
fi

# D12: the script must not fabricate catalogue data.
if grep -qE "prisma\.(product|company|category|industry)\.create|createMany" "$REINDEX" 2>/dev/null; then
  report FAIL D12 "the reindex script creates catalogue records"
else
  report PASS D12 "the reindex script only reads the database (it creates nothing)"
fi

# D13: retries must be bounded.
if grep -q "MAX_RETRIES" "$REINDEX" 2>/dev/null; then
  report PASS D13 "transient failures are retried a bounded number of times"
else
  report FAIL D13 "no bounded retry behaviour"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
