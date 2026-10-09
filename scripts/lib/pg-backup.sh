#!/usr/bin/env sh
# TRADINGO shared PostgreSQL backup core (Wave 3B-1)
# Used by scripts/deploy/backup-db.sh (compose mode) and
# scripts/docker-entrypoint.sh (direct mode, pre-migration).
# Never logs credentials.

tradingo_pg_backup() {
  # usage: tradingo_pg_backup <out_dir> <prefix> <compose|direct> [options]
  # options: --compose-file F | --env-file E | --min-entries N | --require-mounted
  if [ $# -lt 3 ]; then
    echo "[pg-backup] ERROR: usage: tradingo_pg_backup <out_dir> <prefix> <compose|direct> [options]" >&2
    return 1
  fi
  out_dir="$1"; prefix="$2"; mode="$3"; shift 3

  compose_file="docker-compose.prod.yml"
  env_file=".env.production.local"
  min_entries=10
  require_mounted=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --compose-file) compose_file="$2"; shift 2 ;;
      --env-file)     env_file="$2";     shift 2 ;;
      --min-entries)  min_entries="$2";  shift 2 ;;
      --require-mounted) require_mounted=1; shift ;;
      *) echo "[pg-backup] ERROR: unknown option: $1" >&2; return 1 ;;
    esac
  done

  if [ ! -d "$out_dir" ]; then
    echo "[pg-backup] ERROR: output directory does not exist: $out_dir" >&2
    return 1
  fi

  # Bind-mount guard: refuse backups to a container-local directory
  # (prevents false backups lost with the container — Wave 3B §19).
  if [ "$require_mounted" = "1" ]; then
    root_dev="$(stat -c %d / 2>/dev/null || echo unknown-root)"
    out_dev="$(stat -c %d "$out_dir" 2>/dev/null || echo unknown-out)"
    if [ "$root_dev" = "$out_dev" ]; then
      echo "[pg-backup] ERROR: $out_dir is not a persistent mount (same device as /) — refusing a backup that would be lost with the container" >&2
      return 1
    fi
  fi

  case "$mode" in
    compose)
      [ -f "$env_file" ] || { echo "[pg-backup] ERROR: compose env file not found: $env_file" >&2; return 1; }
      ;;
    direct)
      [ -n "${DATABASE_URL:-}" ] || { echo "[pg-backup] ERROR: DATABASE_URL is not set" >&2; return 1; }
      ;;
    *)
      echo "[pg-backup] ERROR: unknown mode: $mode (expected compose|direct)" >&2
      return 1
      ;;
  esac

  ts="$(date -u '+%Y%m%d-%H%M%S')"
  final="${out_dir}/${prefix}-${ts}.dump"
  tmp="${final}.tmp"
  errf="${out_dir}/.${prefix}-${ts}.err"
  toc="${out_dir}/.${prefix}-${ts}.toc"
  started=$(date +%s)

  # 1. pg_dump into TEMP artifact (custom format, built-in compression —
  #    no pipe, so the pg_dump exit status cannot be masked).
  rc=0
  if [ "$mode" = "compose" ]; then
    docker compose --env-file "$env_file" -f "$compose_file" exec -T postgres \
      pg_dump -U "${POSTGRES_USER:-tradingo}" --format=custom --compress=9 \
      "${POSTGRES_DB:-tradingo}" > "$tmp" 2> "$errf" || rc=$?
  else
    pg_dump --format=custom --compress=9 "$DATABASE_URL" > "$tmp" 2> "$errf" || rc=$?
  fi
  if [ "$rc" -ne 0 ]; then
    echo "[pg-backup] ERROR: pg_dump exited with status $rc — no backup created" >&2
    sed -e 's#postgresql://[^@ ]*@#postgresql://***@#g' -e 's#password=[^ ]*#password=***#g' "$errf" >&2 2>/dev/null
    rm -f "$tmp" "$errf" "$toc"
    return 1
  fi

  # 2. Non-empty check
  if [ ! -s "$tmp" ]; then
    echo "[pg-backup] ERROR: pg_dump produced an empty artifact — no backup created" >&2
    sed -e 's#postgresql://[^@ ]*@#postgresql://***@#g' "$errf" >&2 2>/dev/null
    rm -f "$tmp" "$errf" "$toc"
    return 1
  fi

  # 3. Real archive validation — pg_restore --list parses the actual
  #    custom-archive TOC (the check gzip -t could never provide).
  rc=0
  if [ "$mode" = "compose" ]; then
    docker compose --env-file "$env_file" -f "$compose_file" exec -T postgres \
      pg_restore --list < "$tmp" > "$toc" 2>> "$errf" || rc=$?
  else
    pg_restore --list "$tmp" > "$toc" 2>> "$errf" || rc=$?
  fi
  if [ "$rc" -ne 0 ]; then
    echo "[pg-backup] ERROR: pg_restore --list failed — not a valid PostgreSQL custom dump" >&2
    sed -e 's#postgresql://[^@ ]*@#postgresql://***@#g' "$errf" >&2 2>/dev/null
    rm -f "$tmp" "$errf" "$toc"
    return 1
  fi

  # 4. Structural sanity: TOC must contain plausible schema entries.
  #    TRADINGO has 272 tables; minimum 10 lines rejects trivial
  #    archives without rejecting a legitimately small database.
  entries=$(wc -l < "$toc")
  if [ "$entries" -lt "$min_entries" ]; then
    echo "[pg-backup] ERROR: archive TOC has only $entries entries (minimum $min_entries) — not a plausible database backup" >&2
    rm -f "$tmp" "$errf" "$toc"
    return 1
  fi
  grep -q "TABLE" "$toc" || {
    echo "[pg-backup] ERROR: archive TOC contains no table entries" >&2
    rm -f "$tmp" "$errf" "$toc"
    return 1
  }

  # 5. Atomic finalize — final artifact exists ONLY after all checks pass
  mv "$tmp" "$final"
  rm -f "$errf" "$toc"
  size=$(wc -c < "$final")
  echo "[pg-backup] OK: ${final} (${size} bytes, ${entries} TOC entries, $(( $(date +%s) - started ))s)"
  echo "BACKUP_RESULT=OK FILE=${final} SIZE=${size} ENTRIES=${entries}"
  return 0
}
