# TRADINGO — Secrets & Environment Management

> Sprint 1 of Phase D1 (Production Infrastructure). Created 2026-08-04.
> This is the operational reference for all environment variables, the split
> between generated vs. founder-provided secrets, and the deployment rules.

---

## 1. File Layout (authoritative)

| File | Git tracked | Purpose |
|---|---|---|
| `.env.production` | **YES (template only)** | Placeholder reference. NEVER contains real values. Boot guards make a naive deploy fail fast. |
| `.env.production.local` | **NO** (ignored via `.env.*.local`) | Real generated secrets + founder-provided values. Local verification source. `docker-compose.prod.yml api` reads `env_file: .env.production` — for a real local prod-style run use `--env-file .env.production.local`. |
| `apps/api/.env` | NO | Development environment (dev DB, dev JWT). |
| `.env` (repo root) | NO | Docker Compose dev variables (`POSTGRES_PASSWORD`, `REDIS_PASSWORD`, etc.). |

**Never-commit rule:** any file matching `.env*` that contains a real secret. Check with: `git check-ignore .env.production.local`. If a real secret is ever committed, rotate it immediately and purge history.

---

## 2. Secrets Generated (Sprint 1) — cryptographically random

Generated 2026-08-04 via .NET `RNGCryptoServiceProvider` (no openssl on local host). All values are hex. Stored **only** in `.env.production.local`.

| Variable | Length | Source | Validated by |
|---|---|---|---|
| `JWT_SECRET` | 64 hex (32 B) | generated | Joi schema (≥32) + main.ts guard |
| `JWT_REFRESH_SECRET` | 64 hex (32 B) | generated | Joi schema (≥32) + main.ts guard |
| `AI_VAULT_MASTER_KEY` | 64 hex (32 B) | generated | — |
| `POSTGRES_PASSWORD` / `PG_PASSWORD` | 64 hex (32 B) | generated | compose (must match `DATABASE_URL`) |
| `REDIS_PASSWORD` | 64 hex (32 B) | generated | compose + Redis `--requirepass` |
| `GRAFANA_ADMIN_PASSWORD` | 48 hex (24 B) | generated | compose |

**Generate (any time / rotation):**
```powershell
# hex strings (hex64 = 64 chars)
$b = New-Object byte[] 32; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join ''
# URL-safe base64 alternative
[Convert]::ToBase64String($b).TrimEnd('=').Replace('+','-').Replace('/','_')
```

---

## 3. Founder-Required Secrets (NOT generated — must be supplied)

Boot guard behavior defined in `apps/api/src/main.ts`:
- **FATAL (aborts boot in production):** JWT secrets (<32 chars / placeholder), Razorpay keys when `PAYMENT_MODE=live`, `EMAIL_FROM` missing/domain not in allowlist, Sentry when `SENTRY_ENABLED=true` but DSN placeholder.
- **WARN (boots, feature disabled):** AWS SES/S3 keys, AI provider keys, OAuth client ids, Twilio.

| # | Variable(s) | Default in template | Fatal? | Needed for | Owner action |
|---|---|---|---|---|---|
| 1 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | `YOUR_AWS_*` → `FOUNDER_REQUIRED` | No | SES email, S3 product media/backups | Create IAM user (SES SendEmail + S3) |
| 2 | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | `rzp_live_YOUR_*` | **Yes** (live mode) | All payments | Dashboard->Settings->API keys; webhook URL `https://api.tradingo.in/api/v1/payments/webhook/razorpay`; keep `PAYMENT_MODE=test` until provided |
| 3 | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_YOUR_KEY_ID_HERE` | No (web build) | Frontend checkout | Live publishable key |
| 4 | `SENTRY_DSN` | empty + `SENTRY_ENABLED=false` | **Yes** (if enabled) | Error monitoring | Create org/project DSN; keep `SENTRY_ENABLED=false` until then |
| 5 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `FOUNDER_REQUIRED` | No | Social login | OAuth app; redirect `https://api.tradingo.in/auth/google/callback` |
| 6 | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | empty | No | Social login | OAuth app (optional) |
| 7 | `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY` | `FOUNDER_REQUIRED` | No (≥1) | AI features | Apply for keys per provider |
| 8 | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | empty | No | SMS OTP | Twilio account (optional for MVP) |
| 9 | `GOOGLE_MAPS_API_KEY` | empty | No | Geo/catalog | Google Maps (optional) |
| 10 | `STRIPE_*` | empty | No | Stripe fallback | Only if enabled |
| 11 | `OPENSEARCH_USERNAME/PASSWORD` | `YOUR_OPENSEARCH_*` (template) / local default | No | Search | Sprint 4 provisioning |
| 12 | `SLACK_WEBHOOK_URL` | empty | No | Deploy alerts | Slack incoming webhook (optional) |
| 13 | GitHub Actions secrets (separate) | — | No | CI/CD (Sprint 5) | `AWS_ACCOUNT_ID`, AWS keys, `SUBNETS`, `SECURITY_GROUPS`, `SLACK_WEBHOOK_URL`, `NEXT_PUBLIC_*` |

`EMAIL_FROM` is now `noreply@tradingo.in` (matched to the verified production TLD). Before live email: create the **SES identity** for `tradingo.in` and set `EMAIL_FROM` to a verified sender.

---

## 4. Boot-time Guard Summary (main.ts)

| Guard | Scope | Behavior |
|---|---|---|
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | All envs | Fatal if missing / `<32` chars / placeholder patterns (`change-me`, `your_`, `your-`, `<secret>`, `founder`, …) |
| Razorpay keys | Production + `PAYMENT_MODE=live` | Fatal on missing/placeholder/test-key; **test mode → warn only** (allows local verification without live keys) |
| `EMAIL_FROM` | Production | Fatal if missing or domain in `{example.com, tradingotech.com, yourdomain.com, yourdomain.in, localhost}` |
| Sentry | Production | Fatal if `SENTRY_ENABLED=true` but DSN empty/placeholder |
| AWS, AI keys, OAuth, Twilio | Production | Warn only — platform remains functional, feature disabled |

All fatal errors are aggregated and throw once (`err: Production environment validation failed:\n …`) → **Pod/container fails before `app.listen`**, so unhealthy deploys never receive traffic.

---

## 5. Verification Evidence (Sprint 1)

| Test | Setup | Result |
|---|---|---|
| A — positive boot | `.env.production.local`, `PAYMENT_MODE=test`, real generated JWTs, DB/Redis overridden to local dev URLs | Boot OK: `validation passed (PAYMENT_MODE=test)`, `/live` 200, `/health` 200 (`database up`), `/api/v1/products` 200 |
| B — negative (Razorpay) | `PAYMENT_MODE=live` + `rzp_live_YOUR_KEY_ID_HERE`, `YOUR_KEY_SECRET_HERE`, `YOUR_WEBHOOK_SECRET_HERE` | Process aborts, port closed, log shows 3 RAZORPAY errors + fatal throw |
| C — negative (Sentry) | `SENTRY_ENABLED=true` + `https://your-dsn@sentry.io/your-project` | Process aborts, `SENTRY_ENABLED=true but SENTRY_DSN is missing or a placeholder` |

TypeScript: `tsc api` clean on `main.ts` (repo baseline 32 pre-existing files unchanged).

---

## 6. Commands

```bash
# Confirm a potential secret file is ignored
git check-ignore .env.production.local

# Show what tracked files contain (should be placeholders)
git ls-files | Select-String -Pattern "\.env"

# Generate a 64-hex secret (PowerShell — no openssl needed)
$b = New-Object byte[] 32; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join ''

# Rotation procedure
# 1) update .env.production.local 2) restart rolling deploy 3) revoke old value 4) update dependent dashboards
```

---

## 6. Dependencies / Forwarders on other sprints

- Sprint 4 (Prod infra): replace `DATABASE_URL`/`REDIS_URL` hosts `localhost` → service names, install `OPENSEARCH_*` real creds, provision `POSTGRES_PASSWORD`/`REDIS_PASSWORD` in the compose stack.
- Sprint 6 (Monitoring): real `SENTRY_DSN` + flip `SENTRY_ENABLED=true`; real `GRAFANA_ADMIN_PASSWORD`; Sentry DSN must NOT embed a JWT-like placeholder.
- Sprint 7 (Integrations): AWS IAM keys → SES + S3; Razorpay live keys + flip `PAYMENT_MODE=live` (boot guard becomes fatal with placeholders — expected); Google OAuth app + DNS callback.
- Sprint 5 (CI/CD): copy generated secrets into GitHub Actions secret store (never into `env:` in YAML).