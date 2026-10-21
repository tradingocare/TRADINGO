#!/usr/bin/env bash
# release-manifest.sh — record and verify the IMMUTABLE identity of a deployed
# release, so a rollback can restore an exact, previously verified release
# without relying on mutable tags.
#
# Why this exists (verified on the live Hostinger host, 2026-10-21): the
# production containers run `tradingo-prod-api:latest` / `tradingo-prod-web:latest`
# — MUTABLE tags. The CI workflow pulls a SHA-tagged image and retags it to
# those project-local names, but the SHA tag was NOT present on the host, and no
# `ghcr.io/...:<sha>` image existed locally at all. A rollback that resolves a
# release by a mutable `latest` tag can therefore restore the WRONG build
# without any error.
#
# A release manifest records, per release SHA:
#   - the project-local image reference and its IMMUTABLE image ID (sha256:...);
#   - the registry digest, when the image carries one (digest-addressed pulls
#     are immutable; tags are not);
#   - the compose project and the recording timestamp.
# The rollback then restores by IMAGE ID (or by DIGEST) and re-verifies that
# the running containers carry exactly the recorded IDs.
#
# The manifest lives OUTSIDE the checkout (default /home/tradingo/releases)
# because the checkout is replaced on every release. It is written atomically
# and is never overwritten with different content.
#
# Usage:
#   release-manifest.sh record <sha>          # capture the CURRENTLY running release
#   release-manifest.sh verify <sha>          # check the manifest + the local images
#   release-manifest.sh list                  # list the recorded releases
#   release-manifest.sh show   <sha>          # print one manifest
#
# Env:
#   RELEASE_MANIFEST_DIR  where manifests live (default /home/tradingo/releases)
#   RELEASE_PROJECT       compose project (default tradingo-prod)
#
# Exit 0 = success. Exit 1 = refused (nothing was changed).
set -euo pipefail

MANIFEST_DIR="${RELEASE_MANIFEST_DIR:-/home/tradingo/releases}"
PROJECT="${RELEASE_PROJECT:-tradingo-prod}"

# service -> project-local image reference
image_ref() {
  case "$1" in
    api) echo "tradingo-prod-api:latest" ;;
    api-migrate) echo "tradingo-prod-api-migrate:latest" ;;
    web) echo "tradingo-prod-web:latest" ;;
    *) echo "" ;;
  esac
}

manifest_path() { printf '%s/%s.manifest' "$MANIFEST_DIR" "$1"; }

sha_is_valid() { printf '%s' "$1" | grep -Eq '^[0-9a-f]{40}$'; }

cmd_record() {
  local sha="${1:-}"
  if ! sha_is_valid "$sha"; then
    echo "ERROR: a 40-character lowercase release SHA is required (got: '${sha}')" >&2
    exit 1
  fi
  local out
  out="$(mktemp)"
  {
    echo "# TRADINGO release manifest (immutable release identity)"
    echo "release_sha=${sha}"
    echo "recorded_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "compose_project=${PROJECT}"
  } > "$out"
  for svc in api api-migrate web; do
    local ref id digest
    ref="$(image_ref "$svc")"
    if [ -z "$ref" ]; then echo "ERROR: unknown service '$svc'" >&2; exit 1; fi
    id="$(docker image inspect --format '{{.Id}}' "$ref" 2>/dev/null || true)"
    if [ -z "$id" ]; then
      echo "ERROR: image '$ref' is not present locally — cannot record its identity" >&2
      rm -f "$out"; exit 1
    fi
    digest="$(docker image inspect --format '{{if .RepoDigests}}{{index .RepoDigests 0}}{{end}}' "$ref" 2>/dev/null || true)"
    echo "${svc}_image=${ref}" >> "$out"
    echo "${svc}_image_id=${id}" >> "$out"
    echo "${svc}_digest=${digest}" >> "$out"
  done
  mkdir -p "$MANIFEST_DIR" || { echo "ERROR: cannot create $MANIFEST_DIR" >&2; rm -f "$out"; exit 1; }
  local dest
  dest="$(manifest_path "$sha")"
  if [ -f "$dest" ]; then
    # Never overwrite a recorded identity with a different one.
    if cmp -s "$out" "$dest"; then
      echo "release manifest for $sha already exists and is identical — nothing changed"
      rm -f "$out"; exit 0
    fi
    echo "ERROR: a different manifest for $sha already exists at $dest — refusing to overwrite a recorded release identity" >&2
    rm -f "$out"; exit 1
  fi
  mv "$out" "$dest" || { echo "ERROR: could not write $dest" >&2; rm -f "$out"; exit 1; }
  chmod 644 "$dest"
  echo "Recorded release manifest: $dest"
  sed -n 's/^\(release_sha\|[a-z-]*_image_id\|[a-z-]*_digest\)=/\1=/p' "$dest" | sed 's/^/  /'
}

cmd_verify() {
  local sha="${1:-}"
  if ! sha_is_valid "$sha"; then
    echo "ERROR: a 40-character lowercase release SHA is required" >&2; exit 1
  fi
  local dest
  dest="$(manifest_path "$sha")"
  if [ ! -f "$dest" ]; then
    echo "ERROR: no release manifest for $sha at $dest" >&2
    echo "       A rollback needs a recorded, immutable identity. On the host that ran this release, capture it with:" >&2
    echo "         bash scripts/deploy/release-manifest.sh record $sha" >&2
    echo "       (do that while that release is still running — the manifest records the image IDs in use)." >&2
    exit 1
  fi
  local recorded
  recorded="$(grep '^release_sha=' "$dest" | cut -d= -f2)"
  if [ "$recorded" != "$sha" ]; then
    echo "ERROR: manifest $dest records release_sha='$recorded', not '$sha' — refusing" >&2
    exit 1
  fi
  local ok=0
  for svc in api api-migrate web; do
    local id digest present
    id="$(grep "^${svc}_image_id=" "$dest" | cut -d= -f2-)"
    digest="$(grep "^${svc}_digest=" "$dest" | cut -d= -f2-)"
    [ -n "$id" ] || { echo "ERROR: manifest has no ${svc}_image_id" >&2; exit 1; }
    present="$(docker image inspect --format '{{.Id}}' "$id" 2>/dev/null || true)"
    if [ -n "$present" ] && [ "$present" = "$id" ]; then
      echo "  OK  ${svc}: image ID present locally ($id)"
    elif [ -n "$digest" ]; then
      echo "  MISS ${svc}: image ID $id not present locally, but the digest is recorded ($digest) — it can be pulled by digest (immutable)"
    else
      echo "  MISS ${svc}: image ID $id is not present locally and no digest was recorded — the release cannot be restored from this host" >&2
      ok=1
    fi
  done
  if [ "$ok" -ne 0 ]; then
    echo "ERROR: the release identity for $sha cannot be satisfied on this host" >&2
    exit 1
  fi
  echo "Release manifest for $sha is verifiable."
  exit 0
}

cmd_list() {
  if [ ! -d "$MANIFEST_DIR" ]; then
    echo "(no manifest directory $MANIFEST_DIR)"
    return 0
  fi
  local found=0
  for f in "$MANIFEST_DIR"/*.manifest; do
    [ -e "$f" ] || continue
    found=1
    echo "  $(basename "$f" .manifest)  recorded=$(grep '^recorded_at=' "$f" | cut -d= -f2-)"
  done
  [ "$found" = "1" ] || echo "(no release manifests recorded in $MANIFEST_DIR)"
}

case "${1:-}" in
  record) cmd_record "${2:-}" ;;
  verify) cmd_verify "${2:-}" ;;
  list) cmd_list ;;
  show) sha_is_valid "${2:-}" || { echo "ERROR: a 40-character release SHA is required" >&2; exit 1; }; cat "$(manifest_path "$2")" ;;
  *)
    echo "Usage: $0 record <sha> | verify <sha> | list | show <sha>" >&2
    exit 1
    ;;
esac
