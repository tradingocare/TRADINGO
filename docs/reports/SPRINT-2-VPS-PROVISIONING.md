# Sprint 2 — VPS Provisioning & Security Baseline — Completion Report

> Phase D1 · Sprint 2 · 2026-08-04 · Audit-first workflow: Audit → Implement → Verify → Report → STOP

## 1. Deliverables

| # | Deliverable | Location |
|---|---|---|
| 1 | VPS audit report | `docs/security/VPS-AUDIT-REPORT.md` |
| 2 | Security checklist | `docs/security/VPS-SECURITY-CHECKLIST.md` |
| 3 | `.env.production.local.example` (names/comments only, no values) | `.env.production.local.example` (repo root, git-tracked) |
| 4 | Provisioning script (hardening installer) | `ops/provisioning/provision-vps.sh` |
| 5 | Verification script (13 check groups, exit-0 gate) | `ops/provisioning/verify-security.sh` |
| 6 | Verification report (this doc §5) | `docs/reports/SPRINT-2-VPS-PROVISIONING.md` |
| 7 | Remaining blockers (§6) | this doc |

## 2. Environment Management (executed)

- `.env.production` — **kept as git-tracked placeholder template** (untouched content-wise this sprint).
- `.env.production.local` — **kept gitignored** (`git check-ignore` → PASS); values never printed; all generated values are hex and were written directly to the file.
- New `.env.production.local.example` — contains ONLY variable names, comments, legend (`[GENERATED]`/`[FOUNDER]`/`[OPTIONAL]`) and documentation. Confirmed zero real values.
- Git hygiene re-verified: tracked env files contain no `FOUNDER_REQUIRED` values; `.env.production.local` ignored.

## 3. Secrets Report (2026-08-04 snapshot — names only, no values)

**Auto-generated (7)** — exist in `.env.production.local`:
`JWT_SECRET`, `JWT_REFRESH_SECRET`, `AI_VAULT_MASTER_KEY`, `POSTGRES_PASSWORD`, `PG_PASSWORD`, `REDIS_PASSWORD`, `GRAFANA_ADMIN_PASSWORD`

**Founder-supplied (0)** — none yet received.

**Missing — founder action required (13):**
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`

**Missing — derivable at Sprint 4 wiring (not founder secrets) (5):**
`DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` (composed from generated passwords + host names), `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD` (set during provisioning)

**Missing — single-value founder (2):**
`NEXT_PUBLIC_RAZORPAY_KEY_ID` (live publishable key), `SENTRY_DSN` (real project DSN)

**Optional (10):**
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `GOOGLE_MAPS_API_KEY`, `SLACK_WEBHOOK_URL`

**GitHub Secrets: UNVERIFIED** — `gh` CLI not authenticated (blocker B5 carries into Sprint 5).

## 4. Implementation Notes

- `provision-vps.sh` — 12-phase hardened baseline: apt update/upgrade, unattended-upgrades, timezone, deployment user (`tradingo`, sudo), SSH key install + `sshd_config.d` lockdown (password/root login disabled **only when a key is supplied** — it is, `id_ed25519`), Fail2Ban (sshd jail 1h/5/10m), UFW (default deny, 22/80/443), Docker Engine via `get.docker.com` + compose plugin + auto-start, 2 GB swap persisted, sysctl/limits tuning, base tooling. Explicitly does **not** deploy, touch DNS, or obtain certs.
- `verify-security.sh` — 13 check groups covering every item in the Sprint 2 scope list + disk/memory/swap gates; `exit 1` on any FAIL.
- Scripts validated: `bash -n` → SYNTAX OK (all 3, incl. pre-existing `deploy-vps.sh`).

## 5. Verification Report (execution status)

| Item | Status |
|---|---|
| Script syntax validation (bash -n) | ✅ PASS (both new scripts) |
| Script shellcheck/consistency review | ✅ PASS (review + syntax) |
| Live execution on production VPS | ⏸️ **PENDING — no VPS exists; no credentials** |
| Ubuntu updated / Docker / Compose / user / SSH / UFW / Fail2Ban / timezone / auto-updates / disk / memory / swap / docker autostart | ⏸️ **PENDING** — to be executed by `verify-security.sh` on the provisioned host; output archived here |

The verification matrix above is intentionally NOT marked passed — no live host exists.

## 6. Remaining Blockers

| ID | Blocker | Needed from founder | Blocks |
|---|---|---|---|
| B2 | No VPS provisioned | Create Ubuntu 22.04/24.04 VPS (≥2 vCPU/4 GB/40 GB) at provider of choice; share root access + register `id_ed25519.pub` for `tradingo` | Live execution of provision + verify (this sprint's remaining work) |
| B5 | `gh` unauthenticated | `gh auth login` on dev machine | GitHub Secrets verification (Sprint 5), CI/CD |
| B7 | Prod OpenSearch/ClickHouse posture | Sprint 4 host decisions | Sprint 4 |
| Secrets | 13 founder secrets + `NEXT_PUBLIC_RAZORPAY_KEY_ID` + `SENTRY_DSN` | Provide values (see §3) | Live payment/email/AI/OAuth |

## 7. Verification (repo hygiene)
- `git check-ignore .env.production.local` → ignored ✅
- Tracked `.env*` files: `.env.example`, `.env.production` only (both templates) ✅
- No secret values printed or committed in this sprint ✅

---

**STOP — awaiting founder review.** Provide: (a) VPS access or AWS credentials to provision, and/or (b) decision to continue to Sprint 3 (DNS & SSL) with VPS provisioning executed the moment access exists.
