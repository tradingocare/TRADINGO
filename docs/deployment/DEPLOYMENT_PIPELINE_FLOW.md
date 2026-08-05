# Deployment Pipeline Flow — TRADINGO

**Date:** 2026-08-04
**Source of truth:** `.github/workflows/*.yml` (static audit; gh unauthenticated — flows not yet executed live)

---

## 1. Flow Overview

```
                    ┌────────────────────────────────────────────┐
                    │                GitHub Repo                 │
                    │        tradingocare/TRADINGO (main)        │
                    └──────┬───────────┬───────────┬─────────────┘
                           │           │           │
              push develop │   push/PR main │  manual dispatch
                           ▼           ▼           ▼
              deploy-staging  ci.yml   ci.yml   deploy-production.yml
                           │           │           (confirm=yes)
                           │           ▼           │
                           │    all jobs green?    │
                           │           │           │
                           │        yes ▼ no ──► ❌ CI RED (blocker C1)
                           │           │
                           │    deploy.yml (workflow_run)
                           │           │
                           ▼           ▼
                      ECR staging  ECR production  ──► ECS production
                      :sha :staging :sha :latest      api / web / migration
```

## 2. Job Detail

### 2.1 `ci.yml` — quality gate
| Job | Steps | Fail condition |
|-----|-------|----------------|
| lint-and-typecheck | setup node 20 + pnpm 9.15.0 → `pnpm install --frozen-lockfile` → api lint → web lint → api typecheck → web typecheck | any error (today: **api typecheck fails — C1**) |
| unit-tests | api `jest --coverage` | failing tests |
| build | prisma generate → `pnpm --filter @tradingo/api build` → `pnpm --filter @tradingo/web build` | compile errors (today: **api build fails — C1**) |

### 2.2 `deploy.yml` — auto production (gated)
- Trigger: `workflow_run` with `workflows: [CI]` and `conclusion: success` on `main`
- Concurrency: `production` (block new while running)
- validate: checks `secrets.AWS_ACCOUNT_ID` non-empty
- deploy: ECR build+push → sed task defs → register → update ECS services → migration one-shot → smoke

### 2.3 `deploy-production.yml` — manual production
- Trigger: `workflow_dispatch`; input `confirm` must equal `yes`
- Environment: `production` (GitHub protection layer; reviewers if configured)
- Same deploy job as 2.2; `AWS_REGION=ap-south-1` hardcoded

### 2.4 `deploy-staging.yml` — staging
- Trigger: push to `develop`
- Environment: `staging`; `AWS_REGION=us-east-1`; registry from `vars.ECR_REGISTRY`
- Tags: `:sha` (immutable) + `:staging` (rolling)

### 2.5 `playwright.yml` — E2E
- Services: postgres:16, redis:7 ephemeral containers
- 6 E2E credentials (buyer/seller/admin) — secrets with hardcoded fallbacks (⚠ see security note in matrix)
- Runs Playwright against built web + API

## 3. Deploy Job Steps (ECR + ECS)

1. `docker/build-push-action@v6` — api + web, `:sha` and `:latest`
2. `sed -i "s/__AWS_ACCOUNT_ID__/${{ secrets.AWS_ACCOUNT_ID }}/g"` on `infrastructure/ecs/task-definition.*.json`
3. `aws ecs register-task-definition` ×3 (api, web, migration)
4. `aws ecs update-service` for api + web (FARGATE awsvpc; api cpu 512/mem 1024 port 3001+9100; web cpu 256/mem 512 port 3000)
5. migration task run: `npx prisma migrate deploy`
6. `scripts/deploy/smoke-test.sh` — health/readiness checks

## 4. Gates & Safety Summary

| Gate | Mechanism | Status |
|------|-----------|--------|
| CI quality | typecheck/lint/tests/build must pass | ❌ C1 blocks |
| Manual confirmation | `confirm=yes` input | ✅ present |
| Env protection | GitHub environments (reviewers/secrets) | ⚪ unverifiable (B5) |
| Concurrency | `production` + `production-manual` groups | ✅ present |
| Migrations | one-shot task, `migrate deploy`, ordered after image push | ✅ present |
| Post-deploy | smoke-test.sh | ✅ present (untested live) |
