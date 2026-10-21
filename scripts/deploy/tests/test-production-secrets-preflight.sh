#!/usr/bin/env bash
# test-production-secrets-preflight.sh — regression tests for the production
# configuration pre-flight gate.
#
# The defect this closes: the production configuration was only validated when
# the new API container booted — i.e. AFTER the live containers had been
# replaced. A missing AI_VAULT_MASTER_KEY or a live-mode payment key therefore
# surfaced as a crash-looping API after the traffic switch.
#
# The gate checks the NAMES and the SHAPE of the required entries only. This
# test asserts that it fails closed for every unsafe configuration, and — just
# as importantly — that it NEVER prints a secret value.
#
# No secret is read from the environment: every fixture value is invented for
# this test.
#
# Usage: bash test-production-secrets-preflight.sh [path-to-repo-root]
# Exit 0 = all pass.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$HERE/../../..}"
GATE="$ROOT/scripts/deploy/verify-production-secrets.sh"

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

run() { bash "$GATE" --env-file "$1" > "$TMP/out.log" 2>&1; echo $?; }

write_env() { # file, then KEY=VALUE pairs
  local f="$1"; shift
  : > "$f"
  for kv in "$@"; do echo "$kv" >> "$f"; done
}

echo "--- fail-closed behaviour ---"

# P1: a missing env file is refused.
rc="$(run "$TMP/does-not-exist")"
if [ "$rc" != "0" ] && grep -q "not found" "$TMP/out.log"; then
  report PASS P1 "a missing environment file is refused"
else
  report FAIL P1 "expected a missing-file refusal, got exit $rc"
fi

# P2: a missing JWT_SECRET is refused and NAMED.
write_env "$TMP/e1" "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0"
rc="$(run "$TMP/e1")"
if [ "$rc" != "0" ] && grep -q "JWT_SECRET" "$TMP/out.log"; then
  report PASS P2 "a missing JWT_SECRET is refused and the key is named"
else
  report FAIL P2 "expected a JWT_SECRET refusal, got exit $rc"
fi

# P3: a missing AI_VAULT_MASTER_KEY is refused (the vault must not boot open).
write_env "$TMP/e2" "JWT_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0"
rc="$(run "$TMP/e2")"
if [ "$rc" != "0" ] && grep -q "AI_VAULT_MASTER_KEY" "$TMP/out.log"; then
  report PASS P3 "a missing AI_VAULT_MASTER_KEY is refused"
else
  report FAIL P3 "expected an AI_VAULT_MASTER_KEY refusal, got exit $rc"
fi

# P4: a too-short signing key is refused.
write_env "$TMP/e3" "JWT_SECRET=tooshort" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0"
rc="$(run "$TMP/e3")"
if [ "$rc" != "0" ] && grep -q "shorter than the required minimum" "$TMP/out.log"; then
  report PASS P4 "a signing key below the minimum length is refused"
else
  report FAIL P4 "expected a length refusal, got exit $rc"
fi

# P5: the published development default is refused.
write_env "$TMP/e4" "JWT_SECRET=local-development-secret-key-32chars-minimum" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0"
rc="$(run "$TMP/e4")"
if [ "$rc" != "0" ] && grep -q "publicly known development default" "$TMP/out.log"; then
  report PASS P5 "a published development default is refused"
else
  report FAIL P5 "expected a known-unsafe refusal, got exit $rc"
fi

# P6: a placeholder value is refused.
write_env "$TMP/e5" "JWT_SECRET=change-me-before-production-please" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0"
rc="$(run "$TMP/e5")"
if [ "$rc" != "0" ] && grep -q "placeholder marker" "$TMP/out.log"; then
  report PASS P6 "a placeholder value is refused"
else
  report FAIL P6 "expected a placeholder refusal, got exit $rc"
fi

# P7: live payment mode without payment keys is refused.
write_env "$TMP/e6" "JWT_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0" \
  "PAYMENT_MODE=live"
rc="$(run "$TMP/e6")"
if [ "$rc" != "0" ] && grep -q "RAZORPAY_KEY_ID" "$TMP/out.log"; then
  report PASS P7 "PAYMENT_MODE=live without payment keys is refused"
else
  report FAIL P7 "expected a payment-mode refusal, got exit $rc"
fi

# P8: live payment mode with a TEST key id is refused.
write_env "$TMP/e7" "JWT_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0" \
  "PAYMENT_MODE=live" "RAZORPAY_KEY_ID=rzp_test_abc" \
  "RAZORPAY_KEY_SECRET=cccccccccccccccccccccccc" "RAZORPAY_WEBHOOK_SECRET=dddddddddddddddddddd"
rc="$(run "$TMP/e7")"
if [ "$rc" != "0" ] && grep -q "live Razorpay key id" "$TMP/out.log"; then
  report PASS P8 "PAYMENT_MODE=live with a test-mode key id is refused"
else
  report FAIL P8 "expected a live-key refusal, got exit $rc"
fi

echo "--- accepted configurations ---"

# P9: a complete, sane configuration passes.
write_env "$TMP/ok" "JWT_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0" \
  "PAYMENT_MODE=test" "OPENSEARCH_URL=http://opensearch:9200"
rc="$(run "$TMP/ok")"
if [ "$rc" = "0" ]; then
  report PASS P9 "a complete configuration passes"
else
  report FAIL P9 "expected success, got exit $rc: $(tail -3 "$TMP/out.log" | tr '\n' ' ')"
fi

# P10: live payment mode with live keys passes.
write_env "$TMP/ok2" "JWT_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0" \
  "PAYMENT_MODE=live" "RAZORPAY_KEY_ID=rzp_live_abc" \
  "RAZORPAY_KEY_SECRET=cccccccccccccccccccccccc" "RAZORPAY_WEBHOOK_SECRET=dddddddddddddddddddd"
rc="$(run "$TMP/ok2")"
if [ "$rc" = "0" ]; then
  report PASS P10 "live payment mode with live keys passes"
else
  report FAIL P10 "expected success, got exit $rc: $(tail -3 "$TMP/out.log" | tr '\n' ' ')"
fi

# P11: OpenSearch is optional — an empty value must not fail the gate.
write_env "$TMP/ok3" "JWT_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "JWT_REFRESH_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "AI_VAULT_MASTER_KEY=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" \
  "DATABASE_URL=postgresql://x:y@postgres:5432/tradingo" "REDIS_URL=redis://redis:6379/0" \
  "OPENSEARCH_URL="
rc="$(run "$TMP/ok3")"
if [ "$rc" = "0" ]; then
  report PASS P11 "an empty OpenSearch endpoint is accepted (optional infrastructure)"
else
  report FAIL P11 "expected success, got exit $rc"
fi

echo "--- disclosure hygiene ---"

# P12: no secret value is ever printed.
write_env "$TMP/secret" "JWT_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  "JWT_REFRESH_SECRET=supersecretrefreshvalue0123456789" \
  "AI_VAULT_MASTER_KEY=supersecretvaultvalue0123456789abc" \
  "DATABASE_URL=postgresql://user:dbpasswordvalue@postgres:5432/tradingo" "REDIS_URL=redis://:redispasswordvalue@redis:6379/0" \
  "PAYMENT_MODE=live"
rc="$(run "$TMP/secret")"
leaked=""
for needle in supersecretrefreshvalue0123456789 supersecretvaultvalue0123456789abc dbpasswordvalue redispasswordvalue; do
  grep -q "$needle" "$TMP/out.log" && leaked="$leaked $needle"
done
if [ -n "$leaked" ]; then
  report FAIL P12 "secret values leaked into the output:$leaked"
else
  report PASS P12 "no secret value appears in the output"
fi

# P13: the source of truth for the known-unsafe list is the API validator.
VALIDATOR="$ROOT/apps/api/src/common/services/production-config-validator.service.ts"
missing=""
for lit in "local-development-secret-key-32chars-minimum" "local-development-refresh-secret-32chars-min" \
           "local-development-ai-vault-master-key-32chars-minimum" "tradingo-ai-vault-default-key-change-in-production!"; do
  grep -q "$lit" "$VALIDATOR" || missing="$missing $lit"
  grep -q "$lit" "$GATE" || missing="$missing gate:$lit"
done
if [ -z "$missing" ]; then
  report PASS P13 "the gate's known-unsafe list matches the API validator's"
else
  report FAIL P14 "known-unsafe list drift:$missing"
fi

echo ""
echo "---- SUMMARY: PASS=$PASS FAIL=$FAIL ----"
[ "$FAIL" -eq 0 ]
