# GitHub Secrets & CI/CD Configuration Matrix

**Date:** 2026-08-04
**Audit method:** static analysis of `.github/workflows/*.yml`, `infrastructure/ecs/task-definition.*.json`, `.env.example`
**Status legend:** 🔴 REQUIRED-UNVERIFIED (founder must create; could not verify — `gh` CLI unauthenticated, blocker B5) · 🟡 OPTIONAL · ⚪ NOT REQUIRED (embedded in task defs) · ✅ VERIFIED (locally provable only)

> **Security policy:** this document records NAMES, locations, and usage only. **No secret values are stored here or anywhere in the repository.** All values are supplied by the Founder in the GitHub UI / AWS SSM Parameter Store.

---

## 1. GitHub Actions Secrets & Variables

| # | Name | Kind | Used by | Purpose | Status |
|---|------|------|---------|---------|--------|
| 1 | `AWS_ACCOUNT_ID` | Secret | deploy-production.yml, deploy.yml (validate job: `${{ secrets.AWS_ACCOUNT_ID }}` must be non-empty), staging | ECR/ECS account namespace; substituted for `__AWS_ACCOUNT_ID__` in task defs | 🔴 REQUIRED-UNVERIFIED |
| 2 | `AWS_ACCESS_KEY_ID` | Secret | all deploy workflows | AWS deploy credentials (ci.yml also for ECR in build job) | 🔴 REQUIRED-UNVERIFIED |
| 3 | `AWS_SECRET_ACCESS_KEY` | Secret | all deploy workflows | AWS deploy credentials | 🔴 REQUIRED-UNVERIFIED |
| 4 | `AWS_DEFAULT_REGION` | Secret | deploy workflows (hardcoded `ap-south-1` in prod, `us-east-1` in staging — verify consistency) | AWS region | 🔴 REQUIRED-UNVERIFIED |
| 5 | `ECR_REGISTRY` | Var | deploy-staging.yml (`vars.ECR_REGISTRY`) | Staging ECR registry (prod derives from `AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com`) | 🔴 REQUIRED-UNVERIFIED |
| 6 | `RAZORPAY_KEY_ID` | Secret | (not referenced in workflows — runtime only via SSM) | Razorpay key id for runtime | ⚪ SSM |
| 7 | `RAZORPAY_KEY_SECRET` | Secret | (runtime only) | Razorpay key secret | ⚪ SSM |
| 8 | `SENTRY_DSN` | Secret | (runtime only via SSM) | Error tracking DSN | ⚪ SSM |
| 9 | `E2E_BUYER_EMAIL` | Secret | playwright.yml | E2E buyer login | 🔴 REQUIRED-UNVERIFIED |
| 10 | `E2E_BUYER_PASSWORD` | Secret | playwright.yml | E2E buyer password | 🔴 REQUIRED-UNVERIFIED |
| 11 | `E2E_SELLER_EMAIL` | Secret | playwright.yml | E2E seller login | 🔴 REQUIRED-UNVERIFIED |
| 12 | `E2E_SELLER_PASSWORD` | Secret | playwright.yml | E2E seller password | 🔴 REQUIRED-UNVERIFIED |
| 13 | `E2E_ADMIN_EMAIL` | Secret | playwright.yml | E2E admin login | 🔴 REQUIRED-UNVERIFIED |
| 14 | `E2E_ADMIN_PASSWORD` | Secret | playwright.yml | E2E admin password | 🔴 REQUIRED-UNVERIFIED |

> **Security finding:** playwright.yml has hardcoded fallback values (`TestBuyer@123`, `TestSeller@123`, `TestAdmin@123` via `secrets.X || '...'`). These are test-only defaults and never reach production, but they should be removed once real secrets exist to prevent accidental reuse of weak credentials in E2E.

## 2. AWS SSM Parameter Store (`/tradingo/production/*`) — referenced by ECS task definitions

| # | Parameter name | Used by task def | Purpose | Status |
|---|----------------|------------------|---------|--------|
| 1 | `/tradingo/production/DATABASE_URL` | api, migration | PostgreSQL connection | 🔴 REQUIRED-UNVERIFIED |
| 2 | `/tradingo/production/REDIS_URL` | api | Redis connection | 🔴 REQUIRED-UNVERIFIED |
| 3 | `/tradingo/production/JWT_SECRET` | api | JWT signing | 🔴 REQUIRED-UNVERIFIED |
| 4 | `/tradingo/production/JWT_REFRESH_SECRET` | api | Refresh token signing | 🔴 REQUIRED-UNVERIFIED |
| 5 | `/tradingo/production/RAZORPAY_KEY_ID` | api | Razorpay | 🔴 REQUIRED-UNVERIFIED |
| 6 | `/tradingo/production/RAZORPAY_KEY_SECRET` | api | Razorpay | 🔴 REQUIRED-UNVERIFIED |
| 7 | `/tradingo/production/PAYMENT_MODE` | api | `live`/`test` gate | 🔴 REQUIRED-UNVERIFIED |
| 8 | `/tradingo/production/SMTP_HOST` | api | Email delivery | 🔴 REQUIRED-UNVERIFIED |
| 9 | `/tradingo/production/SMTP_PORT` | api | Email delivery | 🔴 REQUIRED-UNVERIFIED |
| 10 | `/tradingo/production/SMTP_USER` | api | Email auth | 🔴 REQUIRED-UNVERIFIED |
| 11 | `/tradingo/production/SMTP_PASS` | api | Email auth | 🔴 REQUIRED-UNVERIFIED |
| 12 | `/tradingo/production/CLICKHOUSE_URL` | api | Analytics (optional at boot) | 🟡 OPTIONAL |
| 13 | `/tradingo/production/OPEN_SEARCH_URL` | api | Search (optional at boot) | 🟡 OPTIONAL |
| 14 | `/tradingo/production/NEXT_PUBLIC_RAZORPAY_KEY_ID` | web | Client Razorpay key | 🔴 REQUIRED-UNVERIFIED |
| 15 | `/tradingo/production/SENTRY_DSN` | web | Error tracking | 🟡 OPTIONAL |

Additional secrets the runtime needs (from `.env.example`, not yet in task defs — verify): `OTP_SECRET`, `TWILIO_*`, `GOOGLE_*`, `LINKEDIN_*`, `AI_VAULT_MASTER_KEY`, `AI_PROVIDER_*` keys, `AWS_*` SES credentials.

## 3. GitHub Environment Protection (referenced by workflows — existence unverifiable)

| Environment | Workflow | Requirements enforced by workflow | GitHub-level protection expected |
|-------------|----------|-----------------------------------|----------------------------------|
| `production` | deploy-production.yml, deploy.yml | `confirm=yes` manual input (deploy-production only); `workflow_run` CI success (deploy.yml) | Required reviewers, protected branch `main`, environment secrets |
| `staging` | deploy-staging.yml | push to `develop` only | Branch protection on `develop` |

## 4. Static (non-secret) configuration embedded in task defs / workflows

- `NEXT_PUBLIC_API_URL=https://api.tradingo.in/api/v1` (web task def)
- `NEXT_PUBLIC_SITE_URL=https://tradingo.in` (web task def)
- `NEXT_PUBLIC_APP_URL=https://tradingo.in` (web task def)
- `NEXT_PUBLIC_SOCKET_URL=https://api.tradingo.in` (web task def)
- Image tags: `:sha` + `:latest` (api/web), `:staging` (staging)
- Placeholder `__AWS_ACCOUNT_ID__` in task def ARNs — substituted at deploy time (sed) by workflows

## 5. Verification checklist for Founder (post `gh auth login`)

1. `gh secret list` → confirm rows 1–4, 9–14 exist
2. `gh variable list` → confirm `ECR_REGISTRY` exists
3. `gh api repos/{owner}/{repo}/environments` → confirm `production` + `staging` environments exist with protection rules
4. AWS SSM: confirm all `/tradingo/production/*` parameters exist (rows above)
5. Trigger `ci.yml` via PR → expect RED until C1 (TS debt) is remediated
