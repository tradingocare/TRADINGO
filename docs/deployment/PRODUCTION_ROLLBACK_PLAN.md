# TRADINGO — Production Rollback Plan (≤ 5 minutes)

> Sprint 3 (Phase D1) · 2026-08-04. Trigger: any FAIL in
> `PRODUCTION_DEPLOYMENT_CHECKLIST.md` Phase 3 (smoke) or a blip after cutover.
> Target: restore previous known-good stack from images within 5 minutes.

## 0. Preconditions (create before first deploy)

- [ ] Previous **known-good image**: ECS/ECR tags `:latest` + `:sha` (workflow already publishes both); compose: keep previous successful image tagged locally
- [ ] Boot guard on `main.ts` fails-fast on bad secrets — bad env cannot silently deploy
- [ ] Secrets never change during rollback (only env file on disk is used)
- [ ] DB backup cover exists for the last 5 min: WAL archive (`ops/backup/postgres-wal-archive.sh`) — RPO ≤ 5 min
- [ ] Document/label current "GOOD" release sha: `git rev-parse --short HEAD`

## 1. Decision matrix

| Symptom | Category | Action |
|---|---|---|
| `curl https://api.tradingo.in/live` not 200 | App/nginx | Rollback images (§2) |
| `/health` DB down | Data | Restore path (§3), not image rollback |
| 500s but `/live` OK | Code/registry | Image rollback (§2) |
| Partial (web up, api down) | Code | Image rollback (§2) |
| Compose syntax/env broken at boot | Config | Revert environment diff (§4) |

## 2. Image rollback (≤ 5 min)

```bash
# compose path — re-run the previously known-good tag
cd ~/tradingo
docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d \
  --force-recreate --no-deps api-tag=your-prev-image:oldsha
# ECS path — deploy-production.yml already auto-rolls-back on failed health check;
# manual: re-run workflow pinned to previous commit sha
# K8s path — kubectl rollout undo deployment api -n tradingo
# verify
curl -fsS https://api.tradingo.in/live && curl -fsS -o /dev/null -w "%{http_code}\n" https://tradingo.in
```

## 3. Data restore (only if DB affected; NOT image-only)

```bash
# stop app writers
docker compose ... stop api web
# restore from aws backup (docs/operations/backup-strategy.md)
bash ops/backup/restore-pitr.sh --to-time "<T-5min>"   # point-in-time via WAL
# re-run migrations up to the release level AFTER restore
docker compose run --rm api-migrate npx prisma migrate deploy
docker compose start api web
# verify counts minimally (products count > previous baseline)
```

## 4. Environment rollback

- The API cannot boot with bad secrets (guard). If a bad env slipped in:
  - `mv .env.production.local .env.production.local.bad` → restore last-good copy → `docker compose up -d --force-recreate api web`

## 5. Post-rollback

1. Capture logs: `docker compose logs --tail=200 api web nginx 2>&1 | tee /var/log/tradingo-rollback-$(date +%s).log`
2. Pause CI deploy (cancel in-flight); notify founder; record RCA in `docs/reports/`
3. **Never force-forward by skipping migrations on the live DB.** If schema already advanced, forward-fix (`prisma migrate reset` is FORBIDDEN in prod).

## 6. Drill (mandatory before GO, blocker B6)
```bash
bash ops/backup/restore-test.sh    # restores staged copy, no prod impact
# controller: run the rollback sequence against staging, time it. Target < 5 min.
```