#!/usr/bin/env sh
# TRADINGO shared PostgreSQL backup core (Wave 3B-1)
# Used by scripts/deploy/backup-db.sh (compose mode) and
# scripts/docker-entrypoint.sh (direct mode, pre-migration).
# Never logs credentials.

tradingo_pg_backup() {
  # usage: tradingo_pg_backup <out_dir> <prefix> <compose|direct> [options]
  # options: --compose-file F | --env-file E | --min-entries N | --require-mounted | --db-container C | --expect-volume V
  # Compose mode addresses the database by EXPLICIT CONTAINER (docker exec),
  # never by Compose project/service labels: the live container may belong to
  # a different Compose project than the caller's files (run 38850639427 showed
  # project-scoped `exec -T postgres` failing while the container was healthy).
  # --db-container is REQUIRED in compose mode (fail closed, no silent
  # default). --expect-volume defaults to the verified production data volume;
  # the container must mount it at /var/lib/postgresql/data or the run aborts.
  # Direct mode ignores container/volume flags (it uses DATABASE_URL).
  if [ $# -lt 3 ]; then
    echo "[pg-backup] ERROR: usage: tradingo_pg_backup <out_dir> <prefix> <compose|direct> [options]" >&2
    return 1
  fi
  out_dir="$1"; prefix="$2"; mode="$3"; shift 3

  compose_file="docker-compose.prod.yml"
  env_file=".env.production.local"
  min_entries=10
  require_mounted=0
  db_container=""
  expect_volume="tradingo-prod_postgres_data"
  while [ $# -gt 0 ]; do
    case "$1" in
      --compose-file) compose_file="$2"; shift 2 ;;
      --env-file)     env_file="$2";     shift 2 ;;
      --min-entries)  min_entries="$2";  shift 2 ;;
      --require-mounted) require_mounted=1; shift ;;
      --db-container) db_container="$2"; shift 2 ;;
      --expect-volume) expect_volume="$2"; shift 2 ;;
      --project-name)
        echo "[pg-backup] ERROR: --project-name was removed; use --db-container (container addressing is project-agnostic)" >&2
        return 1 ;;
      *) echo "[pg-backup] ERROR: unknown option: $1" >&2; return 1 ;;
    esac
  done

  # Container-name hygiene is enforced inline where --db-container is
  # validated (must look like a Docker name, never an option or a shell
  # metacharacter string). The resolved full container ID is used for all
  # subsequent operations, so names are only a lookup key.

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
      [ -n "$db_container" ] || { echo "[pg-backup] ERROR: --db-container is required in compose mode" >&2; return 1; }
      case "$db_container" in
        ''|-*|*[!A-Za-z0-9_.-]*)
          echo "[pg-backup] ERROR: invalid container name: '$db_container'" >&2; return 1 ;;
      esac
      ;;
    direct)
      [ -n "${DATABASE_URL:-}" ] || { echo "[pg-backup] ERROR: DATABASE_URL is not set" >&2; return 1; }
      if [ -n "$db_container" ] || [ "$expect_volume" != "tradingo-prod_postgres_data" ]; then
        echo "[pg-backup] ERROR: container/volume flags are compose-mode only" >&2; return 1
      fi
      ;;
    *)
      echo "[pg-backup] ERROR: unknown mode: $mode (expected compose|direct)" >&2
      return 1
      ;;
  esac

  # Resolve the intended database container ONCE and validate the identity
  # bundle: exists, running, postgres image family, Compose service label
  # `postgres`, and the expected data volume mounted at the Postgres data dir.
  # Prints the full container ID on success. Never logs environment or secrets.
  # Callers must use the printed ID (not the name) for all subsequent execs so
  # a name-reuse swap between check and use fails closed instead of hitting a
  # different container.
  verify_db_container() {
    _info="$(docker inspect --format '{{.Id}}|{{.Config.Image}}|{{.State.Running}}' "$db_container" 2>/dev/null)" || {
      echo "[pg-backup] ERROR: database container '$db_container' not found" >&2; return 1; }
    _cid="$(printf '%s' "$_info" | cut -d'|' -f1)"
    _img="$(printf '%s' "$_info" | cut -d'|' -f2)"
    _run="$(printf '%s' "$_info" | cut -d'|' -f3)"
    [ -n "$_cid" ] || { echo "[pg-backup] ERROR: empty container ID for '$db_container'" >&2; return 1; }
    [ "$_run" = "true" ] || { echo "[pg-backup] ERROR: database container '$db_container' is not running" >&2; return 1; }
    case "$_img" in
      *postgres*) echo "[pg-backup] container image: $_img" >&2 ;;
      *) echo "[pg-backup] ERROR: container '$db_container' image '$_img' is not a postgres image" >&2; return 1 ;;
    esac
    _labels="$(docker inspect --format '{{index .Config.Labels "com.docker.compose.service"}}' "$_cid" 2>/dev/null)" || {
      echo "[pg-backup] ERROR: cannot read labels of '$db_container'" >&2; return 1; }
    [ "$_labels" = "postgres" ] || { echo "[pg-backup] ERROR: container '$db_container' service label is '$_labels', not 'postgres'" >&2; return 1; }
    _mount="$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}' "$_cid" 2>/dev/null)" || {
      echo "[pg-backup] ERROR: cannot read mounts of '$db_container'" >&2; return 1; }
    [ "$_mount" = "$expect_volume" ] || { echo "[pg-backup] ERROR: container '$db_container' data volume is '$_mount', expected '$expect_volume'" >&2; return 1; }
    printf '%s' "$_cid"
    return 0
  }

  ts="$(date -u '+%Y%m%d-%H%M%S')"
  final="${out_dir}/${prefix}-${ts}.dump"
  tmp="${final}.tmp"
  errf="${out_dir}/.${prefix}-${ts}.err"
  toc="${out_dir}/.${prefix}-${ts}.toc"
  started=$(date +%s)

  # 1. pg_dump into TEMP artifact (custom format, built-in compression —
  #    no pipe, so the pg_dump exit status cannot be masked). In compose mode
  #    the container identity is verified FIRST so no tmp artifact is created
  #    for a wrong/missing database.
  rc=0
  if [ "$mode" = "compose" ]; then
    db_cid="$(verify_db_container)" || return 1
    docker exec "$db_cid" \
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
  #    custom-archive TOC (the check gzip -t could never provide). The archive
  #    travels over the exec's stdin (`-i` keeps it open; no TTY is allocated
  #    so output is never CR-mangled). Identity is re-verified immediately
  #    before validation so a container swap between dump and validation fails
  #    closed instead of validating against a different database.
  rc=0
  if [ "$mode" = "compose" ]; then
    db_cid="$(verify_db_container)" || return 1
    docker exec -i "$db_cid" \
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

  # 5. Atomic finalize — final artifact exists ONLY after all checks pass.
  # Same-directory rename is atomic; a failure here (I/O error, remount,
  # permission change) must be fatal so no success status can follow a
  # missing artifact. Callers invoke this function as an if-condition, which
  # suppresses their `set -e` inside the body, so the guard must be explicit.
  mv "$tmp" "$final" || {
    echo "[pg-backup] ERROR: atomic finalize failed — no backup created" >&2
    rm -f "$tmp" "$errf" "$toc"
    return 1
  }
  size=$(wc -c < "$final")
  echo "[pg-backup] OK: ${final} (${size} bytes, ${entries} TOC entries, $(( $(date +%s) - started ))s)"
  echo "BACKUP_RESULT=OK FILE=${final} SIZE=${size} ENTRIES=${entries}"
  return 0
}
