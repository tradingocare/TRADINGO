# Sprint 5 — Production Docker Image Build Verification

**Date:** 2026-08-04
**Status:** VERIFICATION EXECUTED — **NO-GO** (API image does not build)
**Scope:** Proof that both production Docker images build locally, run, and are clean. No deploy, no push, no infrastructure modification.

---

## 1. Executive Summary

| Image | Build | Wall Time | Result |
|-------|-------|-----------|--------|
| `tradingo-verify-api` (apps/api/Dockerfile) | `pnpm --filter @tradingo/api build` (nest build / tsc) | ~112 s | 🔴 **FAILED — 98 TypeScript errors** |
| `tradingo-verify-web` (apps/web/Dockerfile) | `pnpm --filter @tradingo/web build` (next build) | ~230 s | 🟢 **PASSED** — 206.7 MB standalone |

**Headline finding:** the production API image cannot be built. The `nest build` step (which runs `tsc`) fails on **pre-existing TypeScript debt** across 17 source files. The local dev API only works because it is launched with `ts-node --transpile-only` (type checking skipped). Consequences:

- `ci.yml` job `typecheck` and `build` will **always fail** on `pnpm --filter @tradingo/api`
- `deploy.yml` (auto production) is gated on `workflow_run: CI completed + success` → **production deployment can never trigger**, even with all secrets correctly configured
- This is **blocker C1**, independent of GitHub secrets (B5)

---

## 2. Environment

- Docker Desktop (Windows), engine restarted during session; recovered
- Host dev stack confirmed healthy: `tradingo-postgres`, `tradingo-redis`, `infrastructure-opensearch-1` (all `Up (healthy)`)
- Build context root `E:\tradingo`; `.dockerignore` audited clean (no `node_modules`, `.env*`, `.next`, `infrastructure`, `deployment` can enter context)
- Dev API/Web relaunched after session disruption: `:3001` live ✅, `:3000` live ✅

## 3. API Build — FAILED (Blocker C1)

Command:
```
docker build --progress=plain -t tradingo-verify-api -f apps/api/Dockerfile .
```
Fails at builder stage, step `pnpm --filter @tradingo/api build`:
```
error TS2322: Type 'Record<string, unknown>' is not assignable to type 'NullableJsonNullValueInput | InputJsonValue | undefined'
error TS2345: Argument of type 'AiMorningBriefDto' is not assignable to parameter of type 'Record<string, unknown>'
...
Found 98 errors
```

Reproduction (local, identical config): `pnpm --filter @tradingo/api exec tsc -p tsconfig.build.json --noEmit` → **92 errors across 17 files** (count variance 92 vs 98 = environment TS version/resolution difference in fresh container install).

### 3.1 Error inventory (17 files, 92 errors)

| # | File | Errors | Primary pattern |
|---|------|--------|-----------------|
| 1 | `src/modules/admin-intelligence/ai-admin.controller.ts` | 12 | A |
| 2 | `src/modules/finance/ai-finance.controller.ts` | 10 | A |
| 3 | `src/modules/finance/ai-finance.service.ts` | 12 | B |
| 4 | `src/modules/tradmatch/tradmatch.service.ts` | 13 | B |
| 5 | `src/modules/gocash-ecosystem/gocash-ecosystem.service.ts` | 14 | B + C |
| 6 | `src/modules/crm/ai-crm.service.ts` | 8 | B |
| 7 | `src/modules/crm/ai-crm.controller.ts` | 3 | A |
| 8 | `src/modules/smart-po/smart-po.service.ts` | 4 | B |
| 9 | `src/modules/dispute/admin.service.ts` | 2 | B |
| 10 | `src/modules/dispute/admin-assignment.service.ts` | 2 | B |
| 11 | `src/modules/smart-negotiation/ai-negotiation.service.ts` | 3 | B |
| 12 | `src/modules/smart-negotiation/ai-negotiation.controller.ts` | 1 | A |
| 13 | `src/modules/payment/payment.service.ts` | 3 | C |
| 14 | `src/modules/smart-order/smart-order.service.ts` | 2 | B |
| 15 | `src/modules/advertising/advertising.service.ts` | 1 | C |
| 16 | `src/modules/ai/catalog-analytics.service.ts` | 1 | B |
| 17 | `src/modules/tradfind/services/product-search.service.ts` | 1 | B |

### 3.2 Root-cause patterns

- **Pattern A — AI DTO → `Record<string, unknown>` (TS2345, ~26 errors):** AI controller methods pass class-validator DTO instances to `AiGatewayService.process(payload: Record<string, unknown>)`. Class instances without index signatures are not assignable to `Record<string, unknown>`. Fix: loosen `process()` signature to `object`/`unknown`, or cast at call sites.
- **Pattern B — Prisma `{}`/`unknown` result typing (TS2339/TS18046/TS2362/TS7053, ~45 errors):** `.aggregate()`/`.groupBy()`/`$transaction` results accessed without explicit generics/typing (e.g., `tx.purchaseOrder` is `unknown`, `a.activeDisputeCount` is `unknown`, `{}` index/arithmetic in tradmatch). Fix: explicit Prisma result types or typed transaction args.
- **Pattern C — `Record<string, unknown>` → Prisma `InputJsonValue` (TS2322, ~5 errors):** JSON fields assigned from untyped records (payment metadata, advertising metadata, gocash rewards). Fix: cast to `Prisma.InputJsonValue`.

None of the errors touch `main.ts` or any Sprint 4 change (verified: `main.ts` absent from error list; Sprint 4 edits were nginx/compose/Dockerfile-adjacent config only).

## 4. Web Build — PASSED

```
docker build --progress=plain -t tradingo-verify-web -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tradingo.in/api/v1 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://tradingo.in \
  --build-arg NEXT_PUBLIC_APP_URL=https://tradingo.in \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.tradingo.in \
  --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID= \
  --build-arg NEXT_PUBLIC_SENTRY_DSN= .
```
- **Wall time:** 230 s (compiled in 41 s; route generation + finalize rest)
- **Result:** `naming to docker.io/library/tradingo-verify-web:latest done`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`/`SENTRY_DSN` passed empty for local verification (no secret embedding; in ECS they come from SSM at runtime for the client bundle — placeholder `__AWS_ACCOUNT_ID__` substitution applies only to the ECS task def ARNs, not image content).

## 5. Web Image Runtime Verification (STEP 3)

Container `verify-web` on `-p 3100:3000` from the built image:

| Check | Result |
|-------|--------|
| `GET /` | **200**, `text/html; charset=utf-8`, 610,681 chars |
| `X-Content-Type-Options` | `nosniff` |
| `/_next/static/chunks/*.js` | **200**, `Cache-Control: public, max-age=31536000, immutable` |
| HEALTHCHECK | `curl -f http://localhost:3000/` configured in image |
| Container | started and served; removed after verification |

## 6. Web Image Audit (STEP 4) — CLEAN

| Property | Value |
|----------|-------|
| USER | `nextjs` (uid 1001, non-root) |
| ENTRYPOINT / CMD | `docker-entrypoint.sh` / `node apps/web/server.js` |
| EXPOSE | `3000/tcp` |
| Image size | 206.7 MB total (`/app`), `/app/apps/web` 154.8 MB |
| `.env*` files inside image | **NONE** (find returned zero) |
| Node modules (standalone) | self-contained under `/app` |

## 7. Security Scan (STEP 5) — FAILED ATTENTION (Blocker C2)

`docker scout cves tradingo-verify-web` → **71 vulnerabilities in 15 packages**:

| Severity | Count |
|----------|-------|
| CRITICAL | 5 |
| HIGH | 33 |
| MEDIUM | 17 |
| LOW | 4 |
| UNSPECIFIED | 12 |

Examples: CVE-2026-59873 (Allocation Without Limits), CVE-2026-11856, CVE-2026-10536 (criticals).

**Root cause:** stale base image `node:20-alpine` (Node 20 EOL as of Oct 2025). `docker scout recommendations`:
- Upgrade to **node:24-alpine** → 58 MB, 47 fewer packages, **removes 23 vulnerabilities, introduces 0 new**
- (node:22 LTS is the conservative alternative)

API image scan not possible (image does not build). Dockerfile base upgrade applies to both `apps/api/Dockerfile` and `apps/web/Dockerfile` (3 stages each).

## 8. Impact on Pipeline

1. `ci.yml` `lint-and-typecheck` job: `pnpm --filter @tradingo/api typecheck` → fails (same 92+ errors) → **CI is permanently red**
2. `build` job → same failure → Docker images never pushed → ECR empty
3. `deploy.yml` (`workflow_run` on CI success) → never fires → **production can never deploy**
4. `deploy-staging.yml` (push to develop) → same build failure at `docker/build-push-action` → staging also blocked
5. Only `playwright.yml` is unaffected (unit/E2E tests, no nest build)

**Conclusion:** the entire CI/CD estate is non-functional until the TypeScript debt (C1) and base image (C2) are remediated — independent of secrets, AWS access, or environment protection.

## 9. Blockers

| ID | Severity | Description | Owner |
|----|----------|-------------|-------|
| C1 | 🔴 BLOCKING | 92–98 pre-existing TS errors in 17 files; `nest build` fails; CI/deploy permanently red | Backend remediation sprint |
| C2 | 🔴 BLOCKING | `node:20-alpine` EOL; 71 vulns (5C/33H) in web image; API base same | Dockerfile update (node:22/24-alpine) |
| B5 | 🟠 HIGH | `gh` CLI unauthenticated — GitHub secrets/env/branch protection unverifiable | Founder + GitHub owner |

## 10. Recommendation

- **Release:** NO-GO until C1 + C2 remediated and both images rebuild green
- **Immediate next phase (requires Founder approval):** TypeScript debt remediation sprint — fix the 17 files (Pattern A: loosen `process()` signature; Pattern B: type Prisma aggregate/transaction results; Pattern C: `Prisma.InputJsonValue` casts), upgrade both Dockerfiles to node:22/24-alpine, re-run `tsc -p tsconfig.build.json --noEmit` (0 errors) + both `docker build`s, then re-run web runtime verification + scans.
- **After C1/C2:** complete B5 (gh auth → secrets matrix → staging deploy → smoke → prod).
