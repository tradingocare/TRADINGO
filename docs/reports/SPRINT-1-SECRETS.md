# Sprint 1 — Secrets & .env.production — Completion Report

> Phase D1 · Sprint 1 · 2026-08-04 · Audit → Implement → Verify → Report → STOP
> (This file was created during Sprint 3 precondition resolution — Sprint 1 evidence
> previously lived only in `docs/security/SECRETS-CHECKLIST.md`.)

## 1. Audit findings
- `.env.production` was **git-tracked with placeholder values**; `JWT_SECRET=YOUR_JWT_SECRET_HERE` (19 chars) failed the `main.ts` boot guard → API could not boot.
- Guard gaps: Razorpay `rzp_live_YOUR_KEY_ID_HERE` passed validation; `SENTRY_ENABLED=true` with fake DSN; JWT placeholder patterns unchecked.
- `.gitignore` did not list `.env.production` (deliberately — template) but real secrets had nowhere safe to live (now: `.env.production.local`, matched by `.env.*.local`).

## 2. Implemented
| Change | Detail |
|---|---|
| `apps/api/src/main.ts` | Shared `isPlaceholder()` matcher; Razorpay **fatal in `PAYMENT_MODE=live`**, warn in test; Sentry fatal if enabled+placeholder DSN; `EMAIL_FROM` reject-domain list (example.com/tradingotech.com/…); AWS/AI/OAuth remain warn-only |
| `.env.production` | Kept as placeholder template; `EMAIL_FROM=noreply@tradingo.in`; `SENTRY_ENABLED=false`; guard notes added |
| `.env.production.local` (NEW, gitignored) | Generated 64-hex: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AI_VAULT_MASTER_KEY`, `POSTGRES_PASSWORD`, `PG_PASSWORD`, `REDIS_PASSWORD`, `GRAFANA_ADMIN_PASSWORD`; all external creds marked `FOUNDER_REQUIRED` |
| `docs/security/SECRETS-CHECKLIST.md` | File layout, generated vs founder matrix, guard summary, rotation commands |

## 3. Verification (all passed)
- A — production boot with real generated JWTs (PAYMENT_MODE=test): `validation passed (PAYMENT_MODE=test)`, `/live` + `/health` + `/api/v1/products` 200
- B — `PAYMENT_MODE=live` + placeholder Razorpay keys: process aborts, 3 RAZORPAY errors + fatal throw
- C — `SENTRY_ENABLED=true` + `your-dsn` placeholder: process aborts
- `tsc api`: `main.ts` clean (32 pre-existing error files unchanged)
- `git check-ignore .env.production.local` → ignored; tracked env files contain no secret values

## 4. Secrets status at end of Sprint 1
- Generated (7): see §2 → stored in `.env.production.local`
- Founder-required (13+2): AWS×2, Razorpay×3 (+`NEXT_PUBLIC_RAZORPAY_KEY_ID`), Google×2, AI×6, `SENTRY_DSN` — pending founder supply
- GitHub Secrets: unverifiable (`gh` unauthenticated — blocker B5)

Full details: `docs/security/SECRETS-CHECKLIST.md` · Sprint 2: `docs/reports/SPRINT-2-VPS-PROVISIONING.md`.
