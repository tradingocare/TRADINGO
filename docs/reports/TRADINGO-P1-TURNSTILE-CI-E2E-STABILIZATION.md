# TRADINGO — P1 Turnstile CI/E2E Test-Harness Stabilization

**Mode:** AUDIT → EVIDENCE → IMPLEMENT (test-harness only) → VERIFY → RECORD.
**Date:** 2026-10-07
**PR HEAD at start:** `fb7173c146094e0b014859f15d057eeef9d70ec4` (branch `ci/rc-tree-include-hidden-files`)
**Production:** UNTOUCHED · **RC-10.2:** UNTOUCHED · **No release tag created** · **PR #34 not merged**

---

## Executive summary

**Turnstile was not the blocker.** The verified 403 on vendor registration is emitted by the
**anonymous CSRF preHandler** (`Missing csrf secret`), which runs *before* Nest's guards — the
request never reaches `TurnstileGuard`. A second, independent defect (Playwright `baseURL`
path resolution) meant the spec never called the real endpoint at all. Behind those two lay
three further pre-existing harness/data defects (placeholder taxonomy category, `/users/me`
response-shape drift, cross-test identity reuse).

All five were fixed **inside the test harness only**. No API source, no guard, no CI config,
no secret and no production behaviour was changed.

---

## A. Turnstile root cause

### A.1 What the guard actually does (unchanged, `apps/api/src/common/guards/turnstile.guard.ts`)

```ts
const token = request.body?.turnstileToken || request.headers['cf-turnstile-token'];
if (!token) {
  if (process.env.NODE_ENV === 'development') return true;
  if (!this.turnstileService.isConfigured) return true;   // ← no secret ⇒ inert
  throw new HttpException({ status: 'error', message: 'Turnstile token required' }, 403);
}
```

`TurnstileService.isConfigured` is `TURNSTILE_SECRET_KEY.length > 0`.

### A.2 Why the guard cannot be the CI 403

| Fact | Evidence |
|---|---|
| `TURNSTILE_SECRET_KEY` is never set in `.github/workflows/playwright.yml` ("Start application" step) | workflow file |
| No `.env` reaches the CI checkout (`.gitignore:6` → `.env`; `apps/api/.env` also ignored) | `git check-ignore -v` |
| `TURNSTILE_SECRET_KEY` is absent from local `.env` **and** `apps/api/.env` | `grep -c TURNSTILE` → `0` / `0` |
| ⇒ `isConfigured === false` and/or `NODE_ENV === 'development'` ⇒ guard returns `true` | code above |

### A.3 The real 403 (proven against the live API)

```
POST /api/v1/auth/register/vendor     (no Origin, no Authorization)
→ HTTP 403 {"statusCode":403,"message":"Missing csrf secret","path":"/api/v1/auth/register/vendor"}
```

`apps/api/src/common/hooks/csrf-prehandler.ts` short-circuits every state-changing request that
has neither a trusted `Origin` nor an `Authorization` header:

```ts
if (request.headers?.authorization) return done();
const trustedOrigin = configService.get('FRONTEND_URL', 'http://localhost:3000');
if (request.headers?.origin && request.headers.origin === trustedOrigin) return done();
… csrfProtection(...) // fail-closed 403
```

A browser supplies `Origin` automatically, so **all browser-driven specs pass this hook**. An
`APIRequestContext` does not — hence the 403.

**Proof the hook runs before routing** (so a wrong URL is indistinguishable from a guard denial):

```
POST http://localhost:3001/auth/register/vendor      (no /api/v1 segment)
→ 403 {"message":"Missing csrf secret","path":"/auth/register/vendor"}   ← not a 404
```

### A.4 Second defect — Playwright `baseURL` drops the base path

`playwright.config.ts`-style contexts are built with `baseURL: API_URL`
(`http://localhost:3001/api/v1`). Playwright resolves a leading-slash path with
`new URL(path, baseURL)`, which **replaces the base path**:

```
GET  /auth/csrf        → http://localhost:3001/auth/csrf        → 404   (observed live)
GET  /api/v1/auth/csrf → http://localhost:3001/api/v1/auth/csrf → 200   (observed live)
```

So `vendor-submit-api.spec.ts` was never exercising the real endpoint; it was answered by the
CSRF hook on an unrouted path.

### A.5 The registration Turnstile widget — why the iframe never renders

`TurnstileWidget` (`apps/web/components/auth/turnstile-widget.tsx`) is imported by exactly three
surfaces:

| Surface | Widget |
|---|---|
| `app/(auth)/login/LoginClient.tsx` | ✅ (test `should have turnstile widget on login form` **passes**) |
| `app/admin/login/AdminLoginClient.tsx` | ✅ |
| `app/(auth)/forgot-password/page.tsx` | ✅ |
| **`/register`, `/register/buyer`, `/register/vendor`, `/register/seller`** | ❌ **none** |

`app/(auth)/register/page.tsx` is now a compatibility redirect to `/register/buyer`
(R3C-R1C canonicalization); the old `RegisterFormCard` it used to import **does not exist in the
tree**. `registration-flow.spec.ts:74` asserts `iframe[src*="challenges.cloudflare"]` on
`/register` — an assertion the current product cannot satisfy. Its kill-widget script mock is
fine (proven by the passing login-flow equivalent); the missing infra is **a widget on the
registration surfaces**, not a determinism problem.

---

## B. Exact files changed

| File | Change |
|---|---|
| `tests/e2e/vendor-submit-api.spec.ts` | CSRF bootstrap (`GET /api/v1/auth/csrf` → `x-csrf-token` + cookie, same contract as `tier-purchase.spec.ts`); full `/api/v1` prefix on every path; real seeded taxonomy category; `/users/me` shape tolerance; per-probe isolated identities |
| `tests/e2e/vendor-wizard-submit.spec.ts` | strict-mode locator narrowed on the email-verification gate (`getByText(...).first()`) |
| `tests/e2e/tier-purchase.spec.ts` | onboarding payload category corrected (its `beforeAll` bootstrap was blocked by the same defect) |
| `docs/reports/TRADINGO-P1-TURNSTILE-CI-E2E-STABILIZATION.md` | this report |

`git diff --stat` (tracked): **3 test files, 83 insertions(+), 21 deletions(-)** — no `apps/` source,
no workflow, no schema/migration, no RC artefact.

---

## C. Test-only security boundary

* **Zero** changes to `turnstile.guard.ts`, `turnstile.service.ts`, `auth.controller.ts`,
  `csrf-prehandler.ts`, `app.module.ts`, `main.ts` or any workflow.
* **No** Turnstile bypass flag was introduced. The guard's only bypasses stay exactly
  `NODE_ENV === 'development'` and `!isConfigured` (both pre-existing).
* **No** secret was added anywhere; the proof run used Cloudflare's *public documented* test
  key `1x0000000000000000000000000000000AA` and never wrote it to a file.
* **No** production credential, no Razorpay change, no Product Card change, no SEO change,
  no migration.
* The new CSRF bootstrap is the same contract the **web client already uses** (`GET /auth/csrf`
  first) and the same one `tests/e2e/tier-purchase.spec.ts` already implements — it authenticates
  the request as same-origin traffic, exactly as the browser does. It does not skip the hook.

---

## D. Production behaviour proof (Turnstile still enforced)

Surviving evidence: real API booted from the current `dist`, with a configured secret and a
non-development environment:

```
PORT=3002 NODE_ENV=test TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA node dist/main
POST /api/v1/auth/register/vendor   (Origin trusted, no turnstileToken)
→ HTTP 403 {"statusCode":403,"message":"Turnstile token required"}
```

The guard's decision for `NODE_ENV=production` is byte-identical to `NODE_ENV=test` on this path
(`NODE_ENV === 'development'` is false in both; `isConfigured` is true) — and **the guard file was
not modified by this task**, so deployed behaviour is unchanged by construction.

---

## E. Registration API result

`tests/e2e/vendor-submit-api.spec.ts` (chromium, 1 worker, live API :3001, seeded DB):

```
8 passed (1.8s)     ← run 1
8 passed (1.7s)     ← run 2
8 passed (1.6s)     ← run 3
```

Before: **0/8** — every request 403 `Missing csrf secret` (`test-results/*` from the 09:25 UTC run).

Now green, including the previously unreachable real paths:

| Assertion | Observed |
|---|---|
| `register creates the account and issues a session` | **201** `{success:true, userId, accessToken}` |
| `onboarding creates the company and flips the role to SELLER` | **201** `{companyId, accessToken, sessionId}` |
| `session carries the SELLER role` | **200** `data.role = "SELLER"` |
| duplicate email / duplicate PAN | **409**, correct messages |
| malformed PAN / missing password | **400** |
| re-onboarding an active seller | **409** `Vendor capability is already active on this account` |
| **P2003** | **not observed in any run** |

---

## F. Vendor wizard result

`tests/e2e/vendor-wizard-submit.spec.ts` (chromium): **4 passed / 1 failed** (was 3/2 in the first
pass, before the locator fix).

* `Step 2 blocks progression until the email is verified` — **FIXED**. The wizard *did* render the
  gate; the test used an unscoped `getByText('Email must be verified')` which resolved to **two**
  elements (summary `<li>` + field-level `<p>`) → strict-mode violation reported as
  `toBeVisible() failed`. Locator narrowed to `.first()` → **passes**. Progression is not blocked by
  the product.
* `Step 2 validates email shape and disposable domains` — **still failing, not fixed (see I.2)**.

---

## G. Registration-flow result

`tests/e2e/registration-flow.spec.ts` (chromium): **6 passed / 1 failed**.

The single failure is `should show turnstile widget on register form` —
`element(s) not found` for `iframe[src*="challenges.cloudflare"]`. Root cause in **A.5**.
**Not** fixed: per instruction, the missing test infrastructure is reported instead of the test
being rewritten or the response faked. (`login-flow.spec.ts › should have turnstile widget on login
form` **passes** with the identical mock, proving the mechanism itself is deterministic.)

---

## H. Full Playwright result

**Attempted, inconclusive — environment-limited, not used as evidence of green.**

`playwright test --project=chromium` reached `[177/133]` (133 tests + retries) and then died:

```
Error: worker process exited unexpectedly (code=3221225794, signal=null)
```

`0xC0000142` = Windows worker init failure (host resource exhaustion under a `next dev` server +
two API instances). Additionally this host is **not CI-equivalent** (dev server instead of the
standalone production build, no OpenSearch, a local DB with extra rows), so a full local suite
cannot be an authoritative statement about CI anyway. Per-suite results above were each obtained
in isolation and are reproducible.

---

## I. Remaining failures (each needs a Founder decision — none fixed unilaterally)

1. **`registration-flow.spec.ts:74` — Turnstile widget on registration.**
   Product has no widget on any registration surface while the API *does* guard
   `/auth/register`, `/auth/register/vendor`, `/auth/register/buyer`.
   *Latent production risk:* the day `TURNSTILE_SECRET_KEY` is configured on VPS, registration
   breaks with 403 (the frontend sends no token). Options: **(a)** mount `TurnstileWidget` on the
   registration wizards and send `turnstileToken` (product change; CF test sitekey already
   defaults for E2E), or **(b)** retarget the assertion at the surfaces that do render the widget.
   *Both are product/spec decisions — no change made.*

2. **`vendor-wizard-submit.spec.ts:77` — `Enter a valid email` never rendered.**
   `Step2ContactCredentials.validate()` assigns `e.email` four times and the later lines win:
   ```ts
   if (email && !isEmailValid)      e.email = 'Enter a valid email'
   if (email && isEmailDisposable)  e.email = 'Disposable email addresses are not allowed'
   if (!isEmailValid || !email)     e.email = 'Email is required'      // ← overwrites
   if (!emailVerified)              e.email = 'Email must be verified' // ← overwrites
   ```
   So a malformed/disposable email is always reported as `Email must be verified`. Enforcement is
   intact (`sendEmailOtp` early-returns on `isEmailDisposable`, and the inline
   `Disposable email addresses are not allowed` `<p>` renders) — only the summary message is
   masked. **Not fixed:** changing that precedence is registration-UX behaviour, not test harness,
   and the assertion was deliberately left intact rather than weakened.

3. **`tier-purchase.spec.ts` browser half — 4 failures, all strict-mode locator ambiguities.**
   Example: `getByText('Commercial Plans')` resolves to 2 elements (intro paragraph + `<h2>`);
   same for the guest-CTA and seller-context tests. Diagnosis is complete and the fix is mechanical,
   but this is Tier Purchase work — explicitly out of scope for this task. *(Its `beforeAll`
   register→onboarding bootstrap is now fixed; it previously threw before any test could run.)*

4. **`apps/api/src/modules/auth/auth.verify-pan.spec.ts` — 9 failures, local-only.**
   `Nest can't resolve dependencies … CatalogClassifyService at index [9]`. The file is
   **untracked** (`?? …`, `git ls-files --error-unmatch` → *did not match*), so it is not part of
   CI's `Test API` job. Pre-existing; not touched.

5. **`tests/e2e/auth.spec.ts:16`** still asserts `[401, 403]` against an endpoint that a global
   `ThrottlerGuard` can answer with `429` under CI load (documented in
   `TRADINGO-PLAYWRIGHT-CI-FAILURE-ROOT-CAUSE-AUDIT.md`). Untouched here.

---

## J. Commit / push status

One focused commit containing the three test-harness files plus this report; message
`test(e2e): stabilize turnstile registration flow`. **No** reset, **no** clean, **no** stash,
**no** force push, **no** tag, **no** merge of PR #34.
Details (SHA + remote HEAD verification) are recorded in the session hand-off.

---

## K. Production status

**UNCHANGED.** No deployment, no container action, no migration, no env change, no secret.
The only server processes started were local verification instances (`:3001`, `:3002`, `:3000`),
all stopped; the VPS was never contacted.

## L. RC-10.2 status

**UNCHANGED.** No RC artefact, tag, workflow or packaging file was read-modified or regenerated.

---

## Verification ledger

| Check | Result |
|---|---|
| `tsc --noEmit` (api) | **0 errors** |
| `tsc --noEmit` (web) | **0 errors** |
| `jest src/modules/auth` | **98 passed / 9 failed** — all 9 from the untracked local `auth.verify-pan.spec.ts` (`auth.service`, `auth.controller`, `auth.integration` all PASS) |
| `vendor-submit-api.spec.ts` ×3 | **8/8, 8/8, 8/8** — no retries |
| `vendor-wizard-submit.spec.ts` | **4/5** |
| `registration-flow.spec.ts` | **6/7** |
| `login-flow.spec.ts` | **7/7** |
| Production Turnstile enforcement | **403 `Turnstile token required`** with a configured secret |
| `git diff` scope | 3 test files only |
