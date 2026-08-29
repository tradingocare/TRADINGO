# TRADINGO — F2 Playwright Throttle Remediation

**Founder decision:** APPROVE F2 ONLY (do NOT implement F1).
**Date:** 2026-08-29
**Scope:** CI/test-environment only. Production throttling UNCHANGED.

---

## A. Proven Root Cause

The API registers a **global** `ThrottlerModule` (`apps/api/src/app.module.ts`):

- `ThrottlerModule.forRootAsync` → `throttlers: [{ limit: 100, ttl: 60000 }]` (100 req / 60s per IP)
- `ThrottlerGuard` registered as the global `APP_GUARD` (lines 283-284) → runs **before** auth guards

In the Playwright CI job (`playwright.yml`), web (`:3000`), api (`:3001`), postgres, and redis all run on the **same runner**, so every test request originates from `127.0.0.1` and shares **one** 100 req/min per-IP bucket. With 215 tests × multiple API calls each (2 workers × 2 projects), the bucket is exhausted almost immediately → `429` on unauthenticated/session calls.

Effects:
- `auth.spec.ts:16` asserted only `[401, 403]` for `GET /users/me` (unauth) → got `429` → **1 FAILED**.
- `escrow-settlement-flow.spec.ts:74` first attempt: admin `loginAs` API call rate-limited → no `accessToken` → **flaky** (passed retry #1).
- `listing-card.spec.ts:29` first attempt: checkout API call rate-limited → navigation timeout → **flaky** (passed retry #1).
- `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL` = pnpm wrapper, **not** the cause.

---

## B. F2 Implementation

Disabled the global throttler **only** when `E2E_THROTTLE_DISABLED=true`, using `@nestjs/throttler@6.5.0`'s module-level `skipIf` option (cleanest, no production impact).

### `apps/api/src/app.module.ts` (lines 150-160)
```ts
ThrottlerModule.forRootAsync({
  imports: [RedisModule],
  inject: [RedisService],
  useFactory: (redisService: RedisService): ThrottlerModuleOptions => {
    const e2eThrottleDisabled = process.env.E2E_THROTTLE_DISABLED === 'true';
    return {
      throttlers: [{ limit: 100, ttl: 60000 }],
      storage: new RedisThrottlerStorage(redisService) as unknown as ThrottlerStorage,
      ...(e2eThrottleDisabled ? { skipIf: () => true } : {}),
    };
  },
}),
```
- Production: `E2E_THROTTLE_DISABLED` unset → `skipIf` not added → 100 req/min limit active (unchanged).
- E2E: `E2E_THROTTLE_DISABLED=true` → `skipIf: () => true` → global guard bypassed entirely.

### `.github/workflows/playwright.yml` ("Start application" step)
Added `E2E_THROTTLE_DISABLED: 'true'` to the API start env.

No test files were modified. `expect([401, 403])` is unchanged (F1 explicitly rejected). No retries increased. No production throttle removed/raised. No special production headers added. No auth behavior changed.

---

## C. Exact Files

| File | Change |
|------|--------|
| `apps/api/src/app.module.ts` | Gate `ThrottlerModule` with `skipIf` when `E2E_THROTTLE_DISABLED=true` |
| `.github/workflows/playwright.yml` | Add `E2E_THROTTLE_DISABLED: 'true'` to CI API start env |
| `docs/reports/TRADINGO-F2-PLAYWRIGHT-THROTTLE-REMEDIATION.md` | This report |

**NOT included:** PR #8 CPU changes (`docker-compose.prod.yml`), TLS work, any other module.

---

## D. Production Safety

| Env | `E2E_THROTTLE_DISABLED` | Throttler |
|-----|--------------------------|-----------|
| E2E/CI (`playwright.yml`) | `true` | bypassed (`skipIf`) |
| Production (Docker / `docker-compose.prod.yml` / `.env.production`) | absent | **100 req/min, UNCHANGED** |

- `grep E2E_THROTTLE_DISABLED` across repo returns matches **only** in `playwright.yml` + `app.module.ts` + this report. Not present in any production compose, Dockerfile, or `.env*`.
- `NODE_ENV` is not used as the gate, so production `NODE_ENV=production` is unaffected.
- API `tsc --noEmit` → **exit 0** (compiles clean).

---

## E. Test Results (local)

Local full E2E requires a Docker postgres+redis stack, prisma migrate, seed, and a production build — not executed in this audit window ("full Playwright suite if practical"). The change is verified by:
- Type-check: `pnpm --filter @tradingo/api exec tsc --noEmit` → **exit 0**.
- Mechanism proof: `skipIf: () => true` is a first-class `@nestjs/throttler@6.5.0` option (confirmed in `throttler-module-options.interface.d.ts` line 18), which short-circuits the global guard.
- CI verification (Section F) is the authoritative run.

---

## F. CI Result

Branch `fix/playwright-e2e-throttle` (based on `origin/main`, independent of PR #8) pushed; PR opened against `main` → triggers the same `Playwright E2E Tests` job that previously failed.

Expected after fix:
- Global throttle bypassed in CI → no shared-IP `429` exhaustion.
- `auth.spec.ts › should reject unauthenticated API access` → strict `401/403` passes (no 429).
- `escrow-settlement-flow` + `listing-card` → stable (no rate-limit-induced retry).
- **failed = 0**, flaky = 0 (environment-stable).

CI run conclusion recorded post-execution (see Section J).

---

## G. Flaky-Test Result

The two flaky tests were rate-limit-induced (login/checkout API calls throttled). With `skipIf` active in CI, those API calls are no longer throttled → flaky root cause removed. No test logic changed; stability comes from the environment gate, not from masking.

---

## H. PR #8 Impact

- F2 is on a **separate** branch (`fix/playwright-e2e-throttle`), NOT on PR #8 (`fix/cpu-limit-vps-safe`).
- PR #8 remains exactly the one-file CPU change (`docker-compose.prod.yml`: `cpus: '2'` → `"${POSTGRES_CPUS:-0.75}"` / `"${API_CPUS:-0.75}"`).
- PR #8 is NOT merged yet (per instruction). Once F2 is merged and CI is green, PR #8's required `test` check will also pass (it shares the same CI throttle behavior), enabling its merge.

---

## I. No Production Deployment

This is a CI/test-environment fix. No production API deployed. No `docker compose` change to running services. Purpose: make CI reliable without changing production behavior.

---

## J. Remaining Steps

1. Confirm CI run on `fix/playwright-e2e-throttle` is **green** (0 failed, 0 flaky).
2. Merge F2 PR into `main`.
3. Re-run / let PR #8 CI go green (same throttle gate now applies).
4. Merge PR #8 (CPU fix) — pending founder approval.
5. (Separate) VPS deploy of CPU fix per `TRADINGO-CPU-FIX-PR-MERGE-DEPLOYMENT.md` plan.

---

## FINAL VERDICT

`F2 PLAYWRIGHT THROTTLE FIX — <CI GREEN | BLOCKED>` (set after CI run concludes)
