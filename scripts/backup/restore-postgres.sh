#!/usr/bin/env bash
# restore-postgres.sh — compatibility wrapper around the validated restore
# implementation.
#
# The original version of this script piped a gzipped plain-SQL dump into psql
# against a locally reachable server, with a default target of the LIVE
# database ("tradingo"). The backup implementation actually produces a
# PostgreSQL CUSTOM-FORMAT archive (pg_dump --format=custom), so that default
# path could never restore a real backup — and its default target made an
# accidental overwrite of the live database a single argument away.
#
# All restoring now goes through scripts/deploy/restore-backup.sh, which:
#   - detects the format from the artefact's magic bytes and validates it;
#   - requires the target database to be named explicitly (no default target);
#   - refuses to overwrite an existing database without explicit authorization.
#
# Usage: bash scripts/backup/restore-postgres.sh <backup-file> --target-db <database>
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
IMPL="${HERE}/../deploy/restore-backup.sh"

if [ ! -f "$IMPL" ]; then
  echo "ERROR: restore implementation not found at $IMPL" >&2
  exit 1
fi

BACKUP_FILE="${1:?Usage: $0 <backup-file> --target-db <database>}"
shift || true

# The target must be explicit. DB_NAME/TARGET_DB are accepted for
# compatibility but must be set by the operator — there is no default.
if [ -z "${TARGET_DB:-}" ] && [ -z "${DB_NAME:-}" ]; then
  echo "ERROR: no target database specified. Pass --target-db <database> (or set TARGET_DB/DB_NAME)." >&2
  echo "       There is deliberately no default target: this command must never guess the live database." >&2
  exit 1
fi

exec bash "$IMPL" --file "$BACKUP_FILE" --target-db "${TARGET_DB:-${DB_NAME}}" "$@"
