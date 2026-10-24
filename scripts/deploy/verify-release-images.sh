#!/usr/bin/env bash
# verify-release-images.sh — fail-closed check that the RUNNING api and web
# containers are exactly the SHA-tagged release images pulled from GHCR.
#
# Why this exists: on 2026-10-19, run 39218521897 "succeeded" while the release
# step had silently skipped the existing findings of earlier runs (stdin
# consumption, run 39214456391); mutable tags (tradingo-prod-api:latest) alone
# are NOT proof of the deployed code. This compares each running container's
# immutable image ID against the image ID of the SHA-tagged release image.
# Any mismatch (or a missing image/container) fails the deployment.
#
# Usage: bash verify-release-images.sh <TARGET_SHA> <GHCR_OWNER>
# Runs on the VPS from the checked-out release directory.
# Regression tests: scripts/deploy/tests/test-release-image-identity.sh
set -euo pipefail

TARGET_SHA="${1:?usage: verify-release-images.sh <TARGET_SHA> <GHCR_OWNER>}"
GHCR_OWNER="${2:?usage: verify-release-images.sh <TARGET_SHA> <GHCR_OWNER>}"
REGISTRY="ghcr.io/$GHCR_OWNER"

FAIL=0
check_pair() {
  local container="$1" image="$2"
  local running expected
  if ! running="$(docker inspect --format '{{.Image}}' "$container")"; then
    echo "ERROR: container $container not inspectable (not running?)"
    FAIL=1
    return 0
  fi
  if ! expected="$(docker image inspect --format '{{.Id}}' "$image")"; then
    echo "ERROR: release image $image not present locally; cannot prove the deployment"
    FAIL=1
    return 0
  fi
  if [ "$running" = "$expected" ]; then
    echo "OK: $container runs release image $image ($running)"
  else
    echo "ERROR: $container is running $running, but release image $image is $expected"
    FAIL=1
  fi
}

check_pair tradingo-api "$REGISTRY/tradingo-api:$TARGET_SHA"
check_pair tradingo-web "$REGISTRY/tradingo-web:$TARGET_SHA"

if [ "$FAIL" -ne 0 ]; then
  echo "ERROR: release image identity verification FAILED for $TARGET_SHA"
  exit 1
fi
echo "Release image identity verified for $TARGET_SHA"
