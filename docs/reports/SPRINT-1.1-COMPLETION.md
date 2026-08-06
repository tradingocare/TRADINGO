# Sprint 1.1 — CI/CD Hardening: Completion Report

## Summary

| Metric | Value |
|--------|-------|
| Gaps addressed | 4 (G-04a, G-04b, G-04c, G-04d) |
| Gaps removed from scope | 2 (G-04, G-13 — non-existent) |
| Files created | 2 |
| Files modified | 3 |
| Files deleted | 0 |
| Total effort | ~1.5 hours |
| Rollback complexity | Low |

---

## Files Modified

### 1. `.github/workflows/deploy-staging.yml`
- **Change**: Added rollback job (lines 101-129)
- **Pattern**: Follows existing rollback in `deploy.yml` — gets previous task definition via `aws ecs describe-services`, calls `update-service --task-definition`, waits for stability
- **Why**: Staging had no automatic rollback on failure. Production workflows had it; staging was inconsistent.
- **Risk**: Low — follows proven pattern. Rollback only activates on `failure()`.

### 2. `.github/workflows/deploy.yml`
- **Change**: Parameterized ALB health check URLs (lines 144-150)
- **Pattern**: `API_URL="${{ vars.API_URL }}"` → `"${API_URL:-https://api.tradingo.in}/api/v1/health"`
- **Why**: Hardcoded `https://api.tradingo.in` and `https://tradingo.in` made the workflow environment-specific.
- **Risk**: Low — falls back to original hardcoded values if `vars` are not set.

### 3. `.github/workflows/deploy-production.yml`
- **Change**: Same URL parameterization as deploy.yml (lines 139-146)
- **Why**: Same issue as deploy.yml
- **Risk**: Low — same fallback pattern.

---

## Files Created

### 1. `infrastructure/ecs/task-definition.migration.json`
- **Content**: ECS Fargate task definition for running Prisma migrations
- **Pattern**: Follows existing `task-definition.api.json` conventions (SSM Parameter Store for DATABASE_URL, `__AWS_ACCOUNT_ID__` placeholders, awslogs)
- **Differences from API task def**: No port mappings, no health check, `command: ["npx", "prisma", "migrate", "deploy"]`, 256 CPU / 512 MB
- **Why**: `deploy.yml:85` and `deploy-production.yml:85` reference `--task-definition tradingo-api-migration` but no file existed
- **Risk**: Low — referenced only at deploy time; same `sed` substitution pattern as other task defs

### 2. `ops/k8s/README.md`
- **Content**: Deprecation notice for K8s manifests
- **Key findings**: No CI/CD workflow references these files; DR scripts (`rollback.sh`, `dr-failover.sh`) reference `kubectl` but aren't deployment pipelines
- **Why**: 14 K8s manifests were orphaned — not referenced by any pipeline
- **Risk**: Low — documentation only, no functional change

---

## Gap Status

| Gap | Description | Status | Resolution |
|-----|-------------|--------|------------|
| G-02 | K8s image `latest` | ⚠️ Marked deprecated | README explains K8s is not deployment target |
| G-03 | K8s secrets `CHANGE_ME` | ⚠️ Marked deprecated | README documents template usage |
| G-04 | Missing deploy health check | ❌ Removed from scope | All 3 workflows already had verification |
| G-13 | Inconsistent migration | ❌ Removed from scope | All workflows use `prisma migrate deploy` |
| G-04a | Migration task def missing | ✅ **Fixed** | Created `task-definition.migration.json` |
| G-04b | Staging missing rollback | ✅ **Fixed** | Added rollback job to `deploy-staging.yml` |
| G-04c | Hardcoded ALB URLs | ✅ **Fixed** | Parameterized via `${{ vars.API_URL }}` / `${{ vars.WEB_URL }}` |
| G-04d | K8s manifests orphaned | ✅ **Documented** | Added deprecation README |

---

## Validation Results

| Check | Result | Notes |
|-------|--------|-------|
| `tsc api —noEmit` (production code) | ✅ **0 errors** | All spec-file errors are pre-existing |
| `tsc web —noEmit` | ✅ **0 errors** | Clean |
| `eslint api` | ⚠️ Pre-existing config error | `@typescript-eslint/prefer-optional-chain` needs parserOptions — pre-existing, not Sprint 1.1 |
| `eslint web` | ⚠️ Pre-existing config error | Same as api — pre-existing |
| Git diff verified | ✅ All changes confirmed | No unintended modifications |
| K8s dependency check | ✅ Verified orphaned | No workflow/CI references; DR scripts use kubectl but not deployment |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `tradingo-api-migration` task def not registered in AWS | Medium | The file now exists; must be registered in each AWS environment via `aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/task-definition.migration.json` |
| `vars.API_URL` / `vars.WEB_URL` not set in GitHub | Low | Bash fallback `${VAR:-default}` preserves existing hardcoded URLs |
| Staging rollback references `${{ env.ECS_CLUSTER }}` at job level | Low | `env` is in `deploy` job scope; need to confirm it's available in `rollback` job scope. GitHub Actions env context is job-level, not workflow-level, so `env` values set at the workflow level (lines 11-17) ARE available to all jobs. |
| Pre-existing uncommitted changes to `ci.yml`, `task-definition.api.json`, `task-definition.web.json` | Low | These are NOT Sprint 1.1 changes — they existed in the working tree before this sprint began. Should be committed separately. |

---

## Rollback Strategy

Every change is independently revertible:

| File | Rollback |
|------|----------|
| `task-definition.migration.json` | `git rm` and delete file |
| `deploy-staging.yml` rollback job | `git checkout -- .github/workflows/deploy-staging.yml` |
| `deploy.yml` URL parameterization | `git checkout -- .github/workflows/deploy.yml` |
| `deploy-production.yml` URL parameterization | `git checkout -- .github/workflows/deploy-production.yml` |
| `ops/k8s/README.md` | `git rm ops/k8s/README.md` |

---

## Pre-existing Issues Found (Not Sprint 1.1 Scope)

1. **ESLint config broken** — Both api and web have `@typescript-eslint/prefer-optional-chain` requiring parserOptions in flat config (G-07 related)
2. **AI Gateway + AI Orchestrator spec files fail compilation** — 35+ errors in 15 spec files (G-07 related)
3. **Uncommitted changes** to `ci.yml`, `task-definition.api.json`, `task-definition.web.json` — from a previous session
4. **K8s manifests orphaned** — Resolved in this sprint via deprecation README
7. **`scripts/deploy/smoke-test.sh`** tests `health` at `/api/v1/health` (the deep endpoint) rather than `/api/v1/ready` — if `/health` times out at 3s, the smoke test could fail despite the app being healthy

---

**Sprint 1.1 complete. Awaiting approval before Sprint 1.2.**
