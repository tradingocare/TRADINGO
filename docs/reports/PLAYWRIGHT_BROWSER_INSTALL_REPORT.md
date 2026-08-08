# PLAYWRIGHT BROWSER INSTALL REPORT

**Date:** 2026-08-07
**Branch:** `fix/playwright-startup`
**Commit:** `d57864b0d`
**Status:** FIX APPLIED AND PUSHED — CI verification pending (no GH token available in this environment)

---

## 1. Root Cause (confirmed from GitHub Actions logs)

The "Playwright E2E Tests" workflow failed **before executing any test**:

```
browserType.launch:
Executable doesn't exist:
/home/runner/.cache/ms-playwright/webkit-*/pw_run.sh
```

Playwright itself reported that **WebKit browsers are not installed** on the CI runner.

---

## 2. Audit — `.github/workflows/playwright.yml`

**File:** `.github/workflows/playwright.yml` (174 lines)

| Step | Line | Before (broken) | After (fixed) |
|------|------|-----------------|---------------|
| Install Playwright browsers | 122 | `pnpm --filter @tradingo/web exec playwright install chromium --with-deps` | `pnpm --filter @tradingo/web exec playwright install chromium webkit --with-deps` |

**Finding:** The install step installed **only Chromium**. The test suite is configured with a mobile project that requires WebKit, so every mobile test crashed at browser launch with the missing-executable error above.

---

## 3. Audit — `playwright.config.ts` projects

**File:** `playwright.config.ts` (63 lines)

| Project | Device | Browser engine required |
|---------|--------|------------------------|
| `chromium` | Desktop Chrome | **Chromium** |
| `mobile` | iPhone 13 | **WebKit** |

**Finding:** Exactly two browser engines are referenced by the configured projects: **Chromium** and **WebKit**. No Firefox project is configured, so Firefox is **not** required and was deliberately not added to the install command.

---

## 4. Fix — Install every configured browser

Updated the workflow install step to match the configured projects:

```yaml
- name: Install Playwright browsers
  run: pnpm --filter @tradingo/web exec playwright install chromium webkit --with-deps
```

- `chromium` → desktop project
- `webkit` → mobile (iPhone 13) project
- `--with-deps` → installs OS-level shared library dependencies on `ubuntu-latest`
- **Firefox intentionally omitted** — no project references it

No other workflow changes were made (per instruction: do not change workflows unnecessarily).

---

## 5. Browser cache locations

| Environment | Cache path |
|-------------|-----------|
| CI (ubuntu-latest) | `/home/runner/.cache/ms-playwright/` (the exact missing path in the CI error was `.../ms-playwright/webkit-*/pw_run.sh`) |
| Local Windows | `%USERPROFILE%\AppData\Local\ms-playwright\` |
| Local macOS/Linux | `~/.cache/ms-playwright/` |

Playwright resolves the cache directory via `PLAYWRIGHT_BROWSERS_PATH` (when set) or the platform default above. The CI failure proves the runner cache contained Chromium only; after the fix, `webkit-*` will be present before the test step starts.

---

## 6. Verification plan

1. Push `d57864b0d` to `fix/playwright-startup` (PR #4 → main) → workflow triggered via `pull_request`.
2. Expected: `Install Playwright browsers` step now downloads Chromium **and** WebKit.
3. Expected: mobile project tests execute instead of crashing with `browserType.launch: Executable doesn't exist`.
4. Remaining checks re-verified in the same run (from the confirmed Sprint 7.6 state):
   - `LoginDto` now accepts optional `turnstileToken` (prevents 400 `property turnstileToken should not exist` on UI login).
   - `tests/helpers/auth.ts` sets `accessToken`/`userRole` cookies at **context level** so the Next.js proxy authorizes `/seller|/buyer|/admin` navigation.
5. Verify via `gh run list` (requires `GH_TOKEN`) or the Actions tab: **Playwright E2E Tests must be green**.

---

## 7. Files changed in commit `d57864b0d`

| File | Change |
|------|--------|
| `.github/workflows/playwright.yml` | Install Chromium + WebKit |
| `apps/api/src/modules/auth/dto/login.dto.ts` | Accept optional `turnstileToken` |
| `tests/helpers/auth.ts` | Context-level proxy cookies + localStorage token injection |

---

## 8. Compliance

- ✅ Audit-first: workflow and config audited before any change
- ✅ Only the minimal workflow line changed
- ✅ Every configured browser (Chromium, WebKit) installed; Firefox omitted (not configured)
- ✅ No production code modified for this fix (`login.dto.ts` is the previously approved contract fix; `auth.ts` is test infra)
- ⏳ **STOP condition pending:** Playwright must be re-run in CI and reported green
