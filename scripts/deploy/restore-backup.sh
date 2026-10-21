#!/usr/bin/env bash
# restore-backup.sh — restore a PostgreSQL backup with an explicit format
# contract, an explicit target, and a non-destructive default.
#
# Why this exists: the backup implementation (scripts/lib/pg-backup.sh) writes a
# PostgreSQL CUSTOM-FORMAT dump (`pg_dump --format=custom`), i.e. a file whose
# first five bytes are the magic "PGDMP". The documented restore command,
# `manage.sh restore backups/tradingo-<DATE>.sql.gz`, assumed a gzip-compressed
# plain-SQL dump instead and piped it into psql — a path that cannot read a
# custom-format archive at all. The mismatch was never exercised, so it was
# never noticed.
#
# This script replaces that guesswork with a validated contract:
#   - the format is determined from the artefact's MAGIC BYTES, never from its
#     file name;
#   - a custom-format archive is additionally validated with `pg_restore --list`
#     (which parses the real archive TOC) before anything is restored;
#   - the TARGET DATABASE must be named explicitly — there is no default target;
#   - the restore is NON-DESTRUCTIVE by default: it refuses to write into a
#     database that already exists. Overwriting an existing database requires
#     the explicit authorization flag (--allow-overwrite, or the environment
#     variable ALLOW_DESTRUCTIVE_RESTORE=true) — the same "documented operator
#     exception, default off" pattern the repository already uses for
#     ALLOW_STALE_BACKUP in scripts/deploy/verify-backup.sh;
#   - the source artefact is never modified, and no backup file is overwritten.
#
# The restore is executed inside the database container (which carries the
# PostgreSQL client), so no local client is required on the host.
#
# Usage:
#   bash scripts/deploy/restore-backup.sh --file <artefact> --target-db <database> \
#        [--db-container <name>] [--allow-overwrite] [--dry-run]
#
# Exit 0 = restored (or dry-run planned). Exit 1 = refused or failed.
set -uo pipefail

BACKUP_FILE=""
TARGET_DB=""
DB_CONTAINER="${RESTORE_DB_CONTAINER:-tradingo-postgres}"
ALLOW_OVERWRITE=false
DRY_RUN=false

while [ $# -gt 0 ]; do
  case "$1" in
    --file) BACKUP_FILE="$2"; shift 2 ;;
    --target-db) TARGET_DB="$2"; shift 2 ;;
    --db-container) DB_CONTAINER="$2"; shift 2 ;;
    --allow-overwrite) ALLOW_OVERWRITE=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help|-h)
      echo "Usage: $0 --file <artefact> --target-db <database> [--db-container <name>] [--allow-overwrite] [--dry-run]"
      exit 0
      ;;
    *) echo "ERROR: unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ "${ALLOW_DESTRUCTIVE_RESTORE:-false}" = "true" ]; then
  ALLOW_OVERWRITE=true
fi

fail() { echo "ERROR: $1" >&2; exit 1; }

[ -n "$BACKUP_FILE" ] || fail "--file is required (the backup artefact to restore)"
[ -n "$TARGET_DB" ] || fail "--target-db is required (the database to restore into; there is deliberately no default target)"

case "$TARGET_DB" in
  *[!A-Za-z0-9_]*) fail "invalid target database name: '$TARGET_DB'" ;;
esac
case "$DB_CONTAINER" in
  ''|-*|*[!A-Za-z0-9_.-]*) fail "invalid database container name: '$DB_CONTAINER'" ;;
esac

[ -f "$BACKUP_FILE" ] || fail "backup artefact not found: $BACKUP_FILE"
[ -s "$BACKUP_FILE" ] || fail "backup artefact is empty: $BACKUP_FILE"

# --- format detection from the magic bytes ----------------------------------
MAGIC="$(head -c 5 "$BACKUP_FILE" 2>/dev/null | tr -d '\r')"
GZIP_MAGIC="$(head -c 2 "$BACKUP_FILE" 2>/dev/null | od -An -tx1 | tr -d ' \n')"

FORMAT=""
WORK_DIR=""
cleanup() { [ -n "$WORK_DIR" ] && rm -rf "$WORK_DIR"; }
trap cleanup EXIT

if [ "$MAGIC" = "PGDMP" ]; then
  FORMAT="custom"
  SOURCE="$BACKUP_FILE"
elif [ "$GZIP_MAGIC" = "1f8b" ]; then
  FORMAT="gzip"
  WORK_DIR="$(mktemp -d)"
  SOURCE="$WORK_DIR/archive.sql"
  if ! gzip -dc "$BACKUP_FILE" > "$SOURCE" 2>/dev/null; then
    fail "gzip artefact could not be decompressed: $BACKUP_FILE"
  fi
  if [ ! -s "$SOURCE" ]; then
    fail "gzip artefact decompressed to an empty file: $BACKUP_FILE"
  fi
  # A gzipped plain-SQL dump must look like SQL; anything else is refused
  # rather than fed to psql.
  if ! head -c 4096 "$SOURCE" | grep -qEi '(^--|CREATE |SET |COPY |INSERT |ALTER |\\connect|pg_dump)'; then
    fail "gzip artefact does not contain a recognisable plain-SQL dump: $BACKUP_FILE"
  fi
else
  fail "unsupported backup format (magic bytes: '${MAGIC:-none}'). Supported: PostgreSQL custom format (PGDMP) and gzip-compressed plain SQL."
fi

echo "[restore] source        : $BACKUP_FILE"
echo "[restore] detected format: $FORMAT"
echo "[restore] target database: $TARGET_DB (container: $DB_CONTAINER)"

# --- container identity ------------------------------------------------------
if ! docker inspect "$DB_CONTAINER" >/dev/null 2>&1; then
  fail "database container '$DB_CONTAINER' not found — refusing to restore"
fi
RUNNING="$(docker inspect --format '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null || echo false)"
[ "$RUNNING" = "true" ] || fail "database container '$DB_CONTAINER' is not running — refusing to restore"

# --- validate the archive before restoring -----------------------------------
if [ "$FORMAT" = "custom" ]; then
  if ! docker exec -i "$DB_CONTAINER" pg_restore --list < "$SOURCE" > /dev/null 2>&1; then
    fail "the artefact is not a valid PostgreSQL custom archive (pg_restore --list failed) — nothing was restored"
  fi
  echo "[restore] archive validated (pg_restore --list)"
else
  echo "[restore] plain SQL detected; validated by content marker"
fi

# --- target existence and the non-destructive default ------------------------
EXISTS="$(docker exec "$DB_CONTAINER" psql -U "${POSTGRES_USER:-tradingo}" -tAc \
  "SELECT 1 FROM pg_database WHERE datname='${TARGET_DB}'" 2>/dev/null | tr -d '[:space:]')"

if [ "$EXISTS" = "1" ] && [ "$ALLOW_OVERWRITE" != "true" ]; then
  fail "target database '$TARGET_DB' already exists. Refusing to overwrite it. Re-run with --allow-overwrite (or ALLOW_DESTRUCTIVE_RESTORE=true) to authorize replacing its contents."
fi

if [ "$DRY_RUN" = "true" ]; then
  echo "[restore] DRY RUN — would restore '$TARGET_DB' from '$BACKUP_FILE' (format: $FORMAT). Nothing was changed."
  exit 0
fi

# --- create the target when it does not exist --------------------------------
if [ "$EXISTS" != "1" ]; then
  echo "[restore] creating target database '$TARGET_DB'"
  if ! docker exec "$DB_CONTAINER" createdb -U "${POSTGRES_USER:-tradingo}" "$TARGET_DB" 2>&1; then
    fail "could not create target database '$TARGET_DB' — nothing was restored"
  fi
fi

# --- restore -----------------------------------------------------------------
if [ "$FORMAT" = "custom" ]; then
  echo "[restore] restoring (pg_restore --clean --if-exists)"
  if ! docker exec -i "$DB_CONTAINER" pg_restore \
        -U "${POSTGRES_USER:-tradingo}" -d "$TARGET_DB" \
        --clean --if-exists --no-owner < "$SOURCE"; then
    fail "pg_restore failed — the target database may be partial"
  fi
else
  echo "[restore] restoring (psql)"
  if ! docker exec -i "$DB_CONTAINER" psql \
        -U "${POSTGRES_USER:-tradingo}" -d "$TARGET_DB" -v ON_ERROR_STOP=1 < "$SOURCE"; then
    fail "psql restore failed — the target database may be partial"
  fi
fi

# --- proof -------------------------------------------------------------------
COUNT="$(docker exec "$DB_CONTAINER" psql -U "${POSTGRES_USER:-tradingo}" -tAc \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public'" -d "$TARGET_DB" 2>/dev/null | tr -d '[:space:]')"
echo "[restore] OK — restored into '$TARGET_DB' (public tables: ${COUNT:-unknown}). The source artefact was not modified."
exit 0
