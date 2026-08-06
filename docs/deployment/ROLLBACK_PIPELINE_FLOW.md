# Rollback Pipeline Flow — TRADINGO

**Date:** 2026-08-04
**Applies to:** ECS Fargate deployments (api/web) via GitHub Actions

> All rollback paths are **pipeline-configured, not yet exercised live**. First full rollback drill (B6) is a Sprint 5+ founder requirement.

---

## 1. Rollback Triggers

| Trigger | Detection | Action |
|---------|-----------|--------|
| Smoke test failure post-deploy | `scripts/deploy/smoke-test.sh` non-zero | Immediate task-def rollback (below) |
| ECS service unstable | `update-service` never reaches `steadyState` (healthchecks failing) | Same |
| User-facing incident (bad code) | Monitoring/Alerts (Sprint 4 nginx + API health) | Code revert + redeploy or task-def rollback |
| Migration broke DB | migration one-shot task exit ≠ 0 | Restore DB backup; redeploy previous task def |

## 2. Rollback Methods (in order of speed)

### 2.1 ECS Task Definition Rollback (fastest — seconds)
```
aws ecs describe-services --cluster tradingo-production --services api \
  --query 'services[0].deployments'   # find previousRevision / activeRevision
aws ecs update-service --cluster tradingo-production --service api \
  --task-definition tradingo-production-api:<previousRevision>
aws ecs update-service --cluster tradingo-production --service web \
  --task-definition tradingo-production-web:<previousRevision>
```
- Zero-downtime: Fargate drains old tasks, registers new ones
- Images are immutable (`:sha` tags) — previous revision always pullable from ECR
- Apply to web, api; run migration task ONLY if the failed release changed schema (usually skip)

### 2.2 Git Revert + Redeploy (correct long-term fix)
```
git checkout main && git pull
git revert <bad-sha>        # or git reset --hard <good-sha> + force-push (team decision)
git push origin main        # CI → deploy.yml fires on success
```
- Keeps `:latest` pointing at last-good code
- Wait for deploy job to complete + smoke pass

### 2.3 Database Rollback (only if migration damaged data)
1. `pg_restore` from latest pre-release backup (RDS automated snapshot or manual dump)
2. Roll forward from restored point using current code (data loss window documented)
3. Update task def env if DATABASE_URL changed

## 3. Decision Matrix

| Situation | Method |
|-----------|--------|
| Bad deploy, DB untouched | 2.1 (task def rollback) |
| Bad code, DB untouched, want permanent fix | 2.2 (revert) |
| Migration corrupted data | 2.3 (restore) after stopping deploys |
| Incident during manual deploy | Cancel workflow (`cancel-in-progress` guard), then 2.1 |

## 4. Rollback Checklist

- [ ] Confirm which revision/sha is GOOD (deployments history, CI artifacts)
- [ ] Pause automated deploys (disable deploy.yml / protect main) if incident ongoing
- [ ] Execute 2.1 or 2.2 above
- [ ] Verify: `/live`, `/ready`, `/health` 200; web 200; smoke-test.sh passes
- [ ] Monitor ECS events for `steadyState`
- [ ] Post-incident review: root cause, prevent recurrence (C1/C2 fixes first)

## 5. Gaps to Close Before First Live Rollback Drill

- [ ] B6: full rollback drill not yet performed (founder requirement)
- [ ] No live monitoring/alerting (Prometheus/Grafana configured locally in compose; ECS cloudwatch events untested)
- [ ] DB backup automation unverified (RDS automated backups or cron pg_dump)
- [ ] C1: cannot even reach deploy state until TS debt fixed
