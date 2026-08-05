# CI/CD Deployment Guide — TRADINGO

**Date:** 2026-08-04
**Target platform:** GitHub Actions → AWS ECR → AWS ECS (Fargate)
**Repo:** `https://github.com/tradingocare/TRADINGO.git` (branch `main`, tag `v0.3.0-tradfind`)

> **CURRENT STATE WARNING:** Pipeline is configured end-to-end but **NOT FUNCTIONAL**. Blocker C1 (98 pre-existing TypeScript errors — `nest build` fails) keeps CI permanently red; therefore deploy.yml (gated on CI success) can never fire. See `docs/reports/SPRINT-5-BUILD-VERIFICATION.md`. All verification below is static/audit evidence until C1/C2 are remediated.

---

## 1. Architecture

```
┌─────────────── GitHub Actions ───────────────┐
│                                              │
│  PR → ci.yml        main → ci.yml + deploy.yml│
│  develop → ci.yml + deploy-staging.yml        │
│  manual → deploy-production.yml (confirm=yes) │
│                                              │
│  ci.yml: lint → typecheck → unit tests → build│
└──────────────┬───────────────────────────────┘
               ▼ docker/build-push-action
        ┌──────────────┐   push :sha :latest   ┌──────────────┐
        │  ECR         │◄──────────────────────│  ECS         │
        │ tradingo-    │                       │ cluster      │
        │ production-  │  render task def      │ tradingo-    │
        │ api / web    │  (sed __AWS_ACCOUNT_ID__) │ production │
        └──────────────┘  register + update     └──────┬───────┘
                                                       ▼
                                              api Fargate (3001)
                                              web Fargate (3000)
                                              migration one-shot
                                              smoke-test.sh
```

## 2. Workflow Map

| Workflow | Trigger | Environment | Jobs | Gate |
|----------|---------|-------------|------|------|
| `ci.yml` | push `main`/`develop`, PR → `main` | — | lint-and-typecheck (api+web), unit-tests (api jest), build | all jobs green |
| `deploy.yml` | `workflow_run`: CI **completed+success** on `main` | `production` | validate → deploy (ECR+ECS) | CI green |
| `deploy-production.yml` | manual `workflow_dispatch` with `confirm: yes` | `production` | validate (`AWS_ACCOUNT_ID` non-empty) → deploy | manual confirmation |
| `deploy-staging.yml` | push `develop` | `staging` | build → push `:sha`+`:staging` → ECS staging | push only |
| `playwright.yml` | PR/merge (E2E) | — | postgres+redis services, 6 E2E creds, Playwright | tests pass |

Concurrency: `production-manual` (cancel-in-progress: false) for manual deploys; `production` group for auto deploys — prevents concurrent prod deployments.

## 3. Prerequisites (Founder/Org setup)

1. **GitHub repo** `tradingocare/TRADINGO` — exists ✅
2. **Secrets & variables** — see `GITHUB_SECRETS_MATRIX.md` (rows 1–4, 9–14 secrets; `ECR_REGISTRY` variable)
3. **AWS account**: IAM user with ECR + ECS + SSM permissions; ECR repos `tradingo-production-api`, `tradingo-production-web`; ECS cluster `tradingo-production`; task defs from `infrastructure/ecs/`
4. **SSM parameters** `/tradingo/production/*` (see matrix §2)
5. **Environments** `production` (required reviewers) + `staging` in repo settings
6. **DNS/SSL** for `tradingo.in` / `api.tradingo.in` (blocker B3/B4 — currently NXDOMAIN/self-signed)

## 4. Local Equivalence (what CI will run)

```powershell
# per-package checks (must pass BEFORE CI can pass)
pnpm --filter @tradingo/api lint
pnpm --filter @tradingo/api typecheck          # ❌ FAILS TODAY (C1: 92 errors / 17 files)
pnpm --filter @tradingo/api build              # ❌ FAILS TODAY (same debt)
pnpm --filter @tradingo/web lint
pnpm --filter @tradingo/web typecheck
pnpm --filter @tradingo/web build              # ✅ passes (298 routes)

# container build equivalence
docker build --progress=plain -t verify-api -f apps/api/Dockerfile .   # ❌ FAILS (C1)
docker build --progress=plain -t verify-web -f apps/web/Dockerfile .   # ✅ PASSES (230s)
```

## 5. Deployment Walkthrough (post-remediation)

**Auto (recommended):**
1. Merge PR to `main` → `ci.yml` runs (lint/typecheck/tests/build)
2. All green → `deploy.yml` fires automatically (workflow_run, environment `production`)
3. validate job: `AWS_ACCOUNT_ID` present → deploy job:
   - `docker/build-push-action@v6` builds both images, pushes `:sha` + `:latest` to ECR
   - `sed` substitutes `__AWS_ACCOUNT_ID__` in `infrastructure/ecs/task-definition.*.json`
   - `aws ecs register-task-definition` (api, web, migration)
   - `aws ecs update-service --cluster tradingo-production --service api|web` (FARGATE, awsvpc)
   - one-shot migration task runs `npx prisma migrate deploy`
4. Deployment waits for service stable → `scripts/deploy/smoke-test.sh` hits health endpoints

**Manual:**
1. Actions → Deploy to Production → Run workflow → input `confirm: yes`
2. Same pipeline as above, but skipped if CI itself is broken (validate job guards secrets; build still required)

**Staging:** push to `develop` → auto-deploy to `staging` environment (`us-east-1`, `vars.ECR_REGISTRY`, tags `:sha`+`:staging`).

## 6. Verification Steps After a Deploy

1. `curl -f https://api.tradingo.in/live` → 200
2. `curl -f https://api.tradingo.in/ready` → 200 (DB reachable)
3. `curl -f https://tradingo.in/` → 200 (web)
4. ECS service events: `aws ecs describe-services --cluster tradingo-production --services api web` → `steadyState`
5. Check migration task exit code 0
6. `scripts/deploy/smoke-test.sh` full run
7. Verify Security Headers (Sprint 4): `X-Frame-Options DENY`, HSTS, `nosniff`, CSP

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| CI red on typecheck/build | C1: 92–98 TS errors in 17 files | TypeScript debt remediation sprint (see build verification report §10) |
| `secret AWS_ACCOUNT_ID required` on validate | Secret missing | Create repo secret (matrix row 1) |
| `host not found in upstream` (nginx) | Self-test without compose DNS | `--add-host web/api:127.0.0.1` for `nginx -t` |
| ECS service never stable | Bad env/healthcheck | Check `aws logs` on task; verify SSM params exist (matrix §2) |
| Image push 403 | ECR repo absent / IAM | Create ECR repos; verify IAM `ecr:PutImage` |
| Deploy not triggered on merge | CI failed → workflow_run gated | Fix C1 first; deploy.yml only fires on CI success |

## 8. Related Docs

- `GITHUB_SECRETS_MATRIX.md` — every secret/var/SSM param required
- `DEPLOYMENT_PIPELINE_FLOW.md` — detailed flow diagrams
- `ROLLBACK_PIPELINE_FLOW.md` — rollback procedure
- `docs/reports/SPRINT-5-BUILD-VERIFICATION.md` — C1/C2 blocker evidence
- `docs/reports/SPRINT-4-PRODUCTION-INFRASTRUCTURE.md` — nginx/TLS/compose hardening (already verified working)
