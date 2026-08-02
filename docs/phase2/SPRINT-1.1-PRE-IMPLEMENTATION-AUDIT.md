# Sprint 1.1 — Pre-Implementation Audit Report

## Audit Scope
CI/CD Hardening: G-02 (K8s image versioning), G-03 (K8s secrets), G-04 (deploy health check), G-13 (migration consistency).

## Methodology
Every file in the implementation plan was re-read from disk. Every claim was checked against actual code — no assumptions, no second-hand evidence.

---

## Critical Finding: Deployment Target Mismatch

The implementation plan assumed **K8s** is the deployment target. It is **NOT**.

| Deployment Path | Target | Used By | Status |
|----------------|--------|---------|--------|
| **ECS (Fargate)** | AWS ECS | `deploy.yml`, `deploy-production.yml`, `deploy-staging.yml` | ✅ Primary |
| **VPS (Docker Compose)** | Ubuntu VPS | `scripts/deploy/deploy-vps.sh` | ✅ Alternative |
| **K8s (Kustomize)** | Kubernetes | **None** — not referenced by any CI/CD workflow | ❌ Orphaned |

The 14 files in `ops/k8s/` are **never deployed** — no workflow applies them. They exist as a future/alternative deployment manifest that was never wired to a pipeline.

This invalidates the G-02 and G-03 rationale as presented in the plan. The primary deployment path (ECS) already has correct image versioning and secret management. The K8s manifests are a secondary concern.

---

## Gap-by-Gap Re-Audit

### G-02: K8s Image Versioning

**Claim:** `ops/k8s/base/kustomization.yaml` uses `tradingo-api:latest` — can't rollback.

**Reality Check:**

| File | Current State | Evidence |
|------|---------------|----------|
| `ops/k8s/kustomization.yaml:28-31` | `newTag: latest` | ✅ Confirmed |
| `.github/workflows/deploy.yml:66-68` | Tags with `${{ github.sha }}` | ECS path is correct |
| `.github/workflows/deploy-production.yml:67-69` | Tags with `${{ github.sha }}` | ECS path is correct |
| `.github/workflows/deploy-staging.yml:52-53` | Tags with `${{ github.sha }}` | ECS path is correct |
| `infrastructure/ecs/task-definition.api.json:12` | Uses `__AWS_ACCOUNT_ID__:latest` | BUT deploy workflow re-renders with SHA |

**Verdict:** ⚠️ **Valid for K8s path. Irrelevant for primary deploy path (ECS).**

The ECS deployment correctly tags every image with `${{ github.sha }}` AND `:${{ github.ref_name }}`. Rollback is possible by re-deploying a previous SHA. The `newTag: latest` in Kustomize only matters if/when K8s becomes a deployment target.

**Recommendation:** Either (a) remove the orphaned K8s manifests, or (b) fix them preemptively. Option (a) is simpler.

---

### G-03: K8s Secrets Template

**Claim:** `tradingo-secrets-template.yaml` contains literal `${PLACEHOLDER}` values that would apply as literal strings.

**Reality Check:**

File: `ops/k8s/tradingo-secrets-template.yaml`

```yaml
stringData:
  DATABASE_URL: "postgresql://tradingo:CHANGE_ME@postgres:5432/tradingo"
  JWT_SECRET: "CHANGE_ME_REPLACE_WITH_64_CHAR_RANDOM"
  ...
```

The values use **`CHANGE_ME`** (not `${PLACEHOLDER}` as claimed in the plan). The file has a clear header:

```
# Usage:
#   1. Copy to tradingo-secrets.yaml
#   2. Fill in all placeholder values
#   3. NEVER commit tradingo-secrets.yaml to version control
#   4. Apply: kubectl apply -f tradingo-secrets.yaml
```

**Additionally,** the ECS task definitions (`infrastructure/ecs/task-definition.api.json:31-65`) use **AWS SSM Parameter Store** for secrets — this is production-grade secret management:

```json
"secrets": [
  { "name": "DATABASE_URL", "valueFrom": "arn:aws:ssm:us-east-1:__AWS_ACCOUNT_ID__:parameter/tradingo/DATABASE_URL" },
  ...
]
```

The `__AWS_ACCOUNT_ID__` placeholder in the ARN is substituted at deploy time via `sed` (verified: `deploy.yml:99-103`).

**Verdict:** ✅ **Non-issue for primary path.** The `CHANGE_ME` template is properly documented. The ECS/SSM path is production-grade. The K8s secrets template is only relevant if K8s becomes a deployment target.

---

### G-04: Deploy Health Check

**Claim:** "All 3 workflows push images and update deployments but never verify the new container is serving traffic."

**Reality Check:**

| Workflow | Post-Deploy Verification | Evidence |
|----------|--------------------------|----------|
| `deploy.yml` | **✅ EXISTS** — ALB health checks for API + Web | Lines 139-145 |
| `deploy-production.yml` | **✅ EXISTS** — ALB health checks for API + Web | Lines 136-142 |
| `deploy-staging.yml` | **✅ EXISTS** — Comprehensive smoke test (7 checks) | Lines 97-99, `scripts/deploy/smoke-test.sh` |

`deploy.yml`:
```yaml
- name: Health check - API (via ALB)
  run: |
    curl -f --retry 10 --retry-delay 10 --retry-max-time 120 "https://api.tradingo.in/api/v1/health"
```

`deploy-staging.yml`:
```yaml
- name: Smoke test
  run: |
    STAGING_URL=${{ vars.STAGING_URL }} bash scripts/deploy/smoke-test.sh
```

`scripts/deploy/smoke-test.sh` checks: API live (200), API ready (200), API health (200), live status="ok", API root, Categories, Products, UI homepage — **7 checks total**.

**Verdict:** ❌ **Non-existent gap.** All three workflows have post-deploy verification. The claim was incorrect.

---

### G-13: Consistent Migration Strategy

**Claim:** "Production uses `prisma migrate deploy`, staging uses `prisma db push`."

**Reality Check:**

| Workflow | Migration Command | Evidence |
|----------|-------------------|----------|
| `deploy.yml` | ECS `run-task` → `tradingo-api-migration` task def → exits | Lines 81-97 |
| `deploy-production.yml` | Same ECS `run-task` pattern | Lines 81-97 |
| `deploy-staging.yml` | `docker run --rm ... npx prisma migrate deploy` | Line 70 |
| `deploy-vps.sh` | `docker compose run --rm api-migrate` (falls back to `db push` on failure) | Lines 300-303 |

All three GitHub workflows use **`prisma migrate deploy`** (or its equivalent via the API Docker entrypoint). The VPS script has a fallback to `db push` on migration failure, which is a resilience pattern, not a consistency problem.

**Migration Task Definition Gap:** `deploy.yml:85` and `deploy-production.yml:85` reference `--task-definition tradingo-api-migration`, but no `task-definition.migration.json` file exists in `infrastructure/ecs/`. The migration task definition must be pre-registered in AWS ECS separately (manually or via infrastructure-as-code).

**Verdict:** ⚠️ **Migration strategy is consistent.** All workflows use `migrate deploy`. However, the **migration task definition is not version-controlled** — it must exist pre-registered in AWS.

---

## Actual Gaps Found (Evidence-Based)

### G-04a (NEW): Migration Task Definition Missing

**File:** `infrastructure/ecs/task-definition.migration.json`

**Current State:** File does not exist. `deploy.yml:85` and `deploy-production.yml:85` reference `--task-definition tradingo-api-migration`, but this task definition must be pre-registered in ECS manually or via a separate process. It is not tracked in version control.

**Impact:** When deploying to a new AWS environment, the migration step will fail with `TaskDefinition not found`. This is a production blocker for fresh deployments.

**Fix:** Create `infrastructure/ecs/task-definition.migration.json` — a simple task definition that runs `npx prisma migrate deploy` and exits.

---

### G-04b (NEW): Staging Missing Rollback

**File:** `.github/workflows/deploy-staging.yml`

**Current State:** `deploy.yml` (lines 158-199) and `deploy-production.yml` (lines 155-193) both have rollback jobs that redeploy the previous task definition on failure. `deploy-staging.yml` has no rollback.

**Impact:** If a staging deploy fails (migration error, bad image, etc.), the service remains in a degraded state with no automatic recovery.

**Fix:** Add rollback job to `deploy-staging.yml` following the same pattern as production.

---

### G-04c (NEW): Hardcoded ALB URLs

**File:** `.github/workflows/deploy.yml:141,144`

**Current State:**
```yaml
curl -f --retry 10 ... "https://api.tradingo.in/api/v1/health"
curl -f --retry 10 ... "https://tradingo.in"
```

These URLs are hardcoded. If the domain changes (e.g., staging vs production, or domain migration), the health check silently fails or targets the wrong environment.

**Impact:** Low probability (domain won't change often), but this is a configuration smell. `deploy-production.yml` has the same pattern (lines 138, 141). `deploy-staging.yml` correctly uses `${{ vars.STAGING_URL }}`.

**Fix:** Move ALB URLs to `vars.API_URL` and `vars.WEB_URL` like staging already does.

---

### G-04d (NEW): K8s Manifests Orphaned

**File:** `ops/k8s/` (14 files, 1 directory)

**Current State:** 14 K8s manifests exist (kustomization, deployment, service, HPA, PDB, ingress, configmap, secrets template, namespace, postgres-statefulset, redis-deployment) — but no CI/CD workflow applies them. They are entirely disconnected from the deployment pipeline.

**Impact:** Maintenance burden. Anyone reading the repo will see K8s manifests and assume K8s is the deployment target. If ECS is the primary target, these files are misleading.

**Fix:** Either:
- (a) Remove `ops/k8s/` entirely (simplest, honest about ECS being the target)
- (b) Add a `deploy-k8s.yml` workflow that actually uses them
- (c) Add a README explaining these are for future migration

---

## Summary: Validated vs Invalidated Gaps

| ID | Gap | File(s) | Plan Claim | Audit Verdict | Action |
|----|-----|---------|-----------|---------------|--------|
| G-02 | K8s image `latest` | `ops/k8s/kustomization.yaml:28-31` | Need image versioning | ⚠️ Valid but K8s is orphaned — ECS already has SHA tagging | Remove K8s or tag images |
| G-03 | K8s secrets `CHANGE_ME` | `ops/k8s/tradingo-secrets-template.yaml` | Secrets template dangerous | ⚠️ Template is properly documented; ECS uses SSM Parameter Store | Remove K8s or leave as-is |
| G-04 | Missing deploy health check | All 3 workflows | No post-deploy verification | ❌ **Non-existent** — all 3 workflows have health checks | Remove from scope |
| G-13 | Staging uses `db push` | `deploy-staging.yml:70` | Migration inconsistency | ❌ **Non-existent** — staging uses `prisma migrate deploy` | Remove from scope |
| **G-04a** | Migration task def missing | `infrastructure/ecs/` | Not in plan | 🔴 **New finding** — no migration task definition file | Create file |
| **G-04b** | Staging missing rollback | `deploy-staging.yml` | Not in plan | 🟡 **New finding** — production has rollback, staging doesn't | Add rollback |
| **G-04c** | Hardcoded ALB URLs | `deploy.yml:141,144` | Not in plan | 🟢 **New finding** — should use vars | Parameterize |
| **G-04d** | K8s manifests orphaned | `ops/k8s/` | Not in plan | 🟡 **New finding** — 14 files, zero workflows | Clean up |

---

## Files to Modify (Corrected)

| File | Change | Reason | Risk |
|------|--------|--------|------|
| **`infrastructure/ecs/task-definition.migration.json`** | **CREATE** | Migration task def missing — referenced by deploy workflows but no file exists | Low (new file, no existing consumers) |
| **`.github/workflows/deploy-staging.yml`** | Add rollback job | Production has it, staging doesn't — inconsistent disaster recovery | Low (rollback is defensive) |
| **`.github/workflows/deploy.yml`** | Parameterize ALB URLs | Hardcoded `api.tradingo.in` and `tradingo.in` should be `${{ vars.API_URL }}` and `${{ vars.WEB_URL }}` | Low (backward compatible) |
| **`.github/workflows/deploy-production.yml`** | Parameterize ALB URLs | Same pattern as deploy.yml | Low |
| **`ops/k8s/`** | Remove directory or add README | 14 orphaned files — not referenced by any workflow | Low (no downstream consumers) |
| **`ops/k8s/kustomization.yaml`** | Fix `newTag: latest` or delete | If K8s is kept, tag images with SHA | Low (if deleted, no action needed) |

## Files NOT to Modify

| File | Reason |
|------|--------|
| **`tradingo-secrets-template.yaml`** | Properly documented template; ECS uses SSM — not a real gap |
| **`deploy-staging.yml` migration step** | Already uses `prisma migrate deploy` — no issue |
| **All health check steps** | Already exist in all workflows |

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Create migration task definition | Low | New file, no existing code depends on it |
| Add rollback to staging | Low | Follows existing pattern in deploy.yml — tested path |
| Parameterize ALB URLs | Low | Fallback: if `vars.API_URL` is unset, default to current hardcoded value |
| Remove K8s directory | Low | No workflow references it; can restore from git history |
| Keep K8s with fix | Low | If kept, just change `newTag: latest` to `newTag: TAG_PLACEHOLDER` |

---

## Pre-Implementation Baseline

```powershell
# Confirm no migration task def file exists
Test-Path "E:\tradingo\infrastructure\ecs\task-definition.migration.json"

# Confirm current health check in deploy.yml
Select-String -Path "E:\tradingo\.github\workflows\deploy.yml" -Pattern "Health check"

# Confirm current rollback in deploy-staging.yml
Select-String -Path "E:\tradingo\.github\workflows\deploy-staging.yml" -Pattern "rollback|Rollback"
```

---

## Corrected Sprint 1.1 Scope

Based on this audit, the scope changes significantly:

1. **CREATE** `infrastructure/ecs/task-definition.migration.json` — the real gap
2. **MODIFY** `.github/workflows/deploy-staging.yml` — add rollback job
3. **MODIFY** `.github/workflows/deploy.yml` — parameterize ALB URLs
4. **MODIFY** `.github/workflows/deploy-production.yml` — parameterize ALB URLs
5. **MODIFY** `ops/k8s/kustomization.yaml` — fix image tags (or remove K8s dir)
6. **REMOVE** `ops/k8s/` — if decided it's orphaned

**Removed from Sprint 1.1 (non-existent gaps):**
- Health check addition (already exists)
- Migration strategy fix (already consistent)

**Total real effort:** 1-2 hours (not 2 days as originally estimated).

---

**Ready for review. No code has been written.** Approve the corrected scope and I will proceed with implementation.
