# TRADINGO — Production Deployment Checklist

> Sprint 3 (Phase D1) + Sprint 4 hardening (Phase D1) · 2026-08-04.
> Executable, ordered, evidence-gated. Each step has a verification command; do not advance on FAIL.
> Sprint 4 (2026-08-04) added: trustProxy, modern TLS, CSP, static-asset cache, API no-store,
> snippets mount, brotli/gzip verification, nginx pre-flight — all reflected below.

## Phase 0 — Pre-flight (founder actions, ~1 day)

- [ ] **B1 Secrets** — all 15 founder secrets supplied; `docs/security/SECRETS-CHECKLIST.md` §3 complete:
  - [ ] Razorpay live `KEY_ID` / `KEY_SECRET` / `WEBHOOK_SECRET` (+ `NEXT_PUBLIC_RAZORPAY_KEY_ID`)
  - [ ] AWS `ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` (SES + S3 IAM user)
  - [ ] `SENTRY_DSN` (+ flip `SENTRY_ENABLED=true`)
  - [ ] Google OAuth `CLIENT_ID` / `CLIENT_SECRET` (redirect `https://api.tradingo.in/auth/google/callback`)
  - [ ] AI provider keys (≥1: OpenAI/OpenRouter/Gemini/Groq/Tavily/Firecrawl)
  - [ ] `EMAIL_FROM` SES-verified (noreply@tradingo.in)
  - Verify: `git check-ignore .env.production.local` → ignored; **no** real values in git
- [ ] **B2 VPS** — provisioned (Ubuntu 22.04/24.04, ≥2 vCPU/4 GB/40 GB), hardened:
  - [ ] `bash ops/provisioning/provision-vps.sh` (SSH_PUBKEY set) run as root
  - [ ] `bash ops/provisioning/verify-security.sh` → **0 failed**
  - Verify: `ssh tradingo@<VPS_IP> -i ~/.ssh/id_ed25519` works
- [ ] **B3 DNS** — `docs/deployment/DNS_CONFIGURATION_GUIDE.md` applied:
  - [ ] `api.tradingo.in` A → `<VPS_IP>` (proxied)
  - [ ] `tradingo.in` + `www.tradingo.in` A → `<VPS_IP>` (proxied)
  - [ ] CAA `0 issue "letsencrypt.org"`
  - Verify: `Resolve-DnsName api.tradingo.in` returns CF IPs; `nslookup api.tradingo.in 1.1.1.1`
- [ ] **B4 SSL** — `docs/deployment/SSL_SETUP_GUIDE.md` executed:
  - [ ] Real LE certs in `infrastructure/nginx/ssl/` (NOT self-signed)
  - [ ] Renewal cron installed; test renew works (`certbot renew --dry-run`)
  - Verify: `echo | openssl s_client -servername tradingo.in -connect tradingo.in:443 2>/dev/null | openssl x509 -noout -dates -subject`

## Phase 1 — Repository & Secrets on host (20 min)

- [ ] `git clone` repo on VPS as `tradingo`, checkout `main`
- [ ] `cp .env.production.local.example .env.production.local` and fill real values (or scp from dev)
- [ ] `chmod 600 .env.production.local`
- [ ] Compose validation: `docker compose --env-file .env.production.local -f docker-compose.prod.yml config --quiet` → exit 0
- [ ] **Nginx pre-flight** (Sprint 4): `docker run --rm --add-host web:127.0.0.1 --add-host api:127.0.0.1 -v "$PWD/infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$PWD/infrastructure/nginx/snippets:/etc/nginx/snippets:ro" -v "$PWD/infrastructure/nginx/sites:/etc/nginx/sites:ro" -v "$PWD/infrastructure/nginx/ssl:/etc/nginx/ssl:ro" nginx:1.27-alpine nginx -t` → `syntax is ok / test is successful` (stapling warn acceptable with self-signed; MUST be clean with real LE certs)

## Phase 2 — Deploy stack (30–45 min)

- [ ] Create data dirs: `mkdir -p prometheus_data grafana_data postgres_data redis_data`
- [ ] Build: `docker compose --env-file .env.production.local -f docker-compose.prod.yml build --parallel`
- [ ] Migrations: `docker compose --env-file .env.production.local -f docker-compose.prod.yml run --rm api-migrate npx prisma migrate deploy`
- [ ] Start: `docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d`
- [ ] Health wait: all services `running` + `healthy` (10-min cap; `docker compose ps`)
- [ ] Grafana admin password from `.env.production.local`; Prometheus targets UP (`http://localhost:9090/targets`)

## Phase 3 — Smoke & verification (15 min)

- [ ] `curl -fsS https://api.tradingo.in/live` → `{"status":"ok"}`
- [ ] `curl -fsS https://api.tradingo.in/health` → `database: up`
- [ ] `curl -fsS https://tradingo.in` → 200
- [ ] **Sprint 4 — Security headers**: `curl -sI https://tradingo.in` → carries CSP + `X-Frame-Options: DENY` + `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` + `X-Content-Type-Options: nosniff`
- [ ] **Sprint 4 — TLS 1.2+ only**: `testssl.sh --proto https://tradingo.in` or `curl -sI --tlsv1.1 https://tradingo.in` **fails**; TLS1.2/1.3 succeed
- [ ] **Sprint 4 — gzip/brotli**: `curl -sI -H "Accept-Encoding: br" https://api.tradingo.in/api/v1/categories` → `Content-Encoding: br`; with `gzip` → `gzip`; web HTML `curl -sI -H "Accept-Encoding: gzip" https://tradingo.in` → `gzip`
- [ ] **Sprint 4 — API not cached**: `curl -sI https://tradingo.in/api/v1/products?limit=1` → `Cache-Control: no-store`
- [ ] **Sprint 4 — static assets cached**: `curl -sI https://tradingo.in/_next/static/.../page.css` → `Cache-Control: ...immutable` (or `max-age=2592000`)
- [ ] **Sprint 4 — rate limiting behind Cloudflare**: `curl -sI https://tradingo.in/api/v1/categories` twice → different IPs (`X-Forwarded-For: 1.1.1.1` vs `2.2.2.2`) show independent `x-ratelimit-remaining` buckets (trustProxy active)
- [ ] `curl -fsS -o /dev/null -w "%{http_code}" https://tradingo.in/api/v1/products?limit=1` → 200
- [ ] HTTP→HTTPS: `curl -sI http://tradingo.in` → 301
- [ ] WS handshake: `curl -fsS -H "Upgrade: websocket" -H "Connection: Upgrade" -o /dev/null -w "%{http_code}" https://api.tradingo.in/socket.io/` (expect 400/200 handshake, not 502)
- [ ] Login flow with seeded test user (OTP via verified SES email)
- [ ] Payment sandbox: Razorpay `PAYMENT_MODE=test` order creation round-trip
- [ ] `bash scripts/deploy/smoke-test.sh "https://api.tradingo.in" "https://tradingo.in"`

## Phase 4 — Cutover (30 min, only after Phase 3 all-green)

- [ ] Founder confirmation on go-live
- [ ] Flip `PAYMENT_MODE=live` in `.env.production.local` + `docker compose up -d api` (boot guard validates live keys)
- [ ] Verify live: `/live`, Razorpay test payment ₹2 capture, SES email received
- [ ] Cloudflare: SSL mode **Full (strict)**; cache rules on static only; WAF managed rules ON
- [ ] Record base metrics (uptime, latency, memory) — baseline for monitoring

## Phase 5 — Post-launch (T+0 → T+30)

- [ ] Daily: backup logs (`/var/log/tradingo-provision.log`), `docker compose ps`, Grafana dashboards
- [ ] Weekly: `certbot renew` check; Fail2Ban stats; disk/swap review
- [ ] T+7: run `ops/backup/restore-test.sh` restore drill (mandatory, B6)
- [ ] T+30: post-launch checklist review (`docs/deployment/POST-LAUNCH-CHECKLIST.md`)

## Emergency abort
Any FAIL in Phase 3 → execute `docs/deployment/PRODUCTION_ROLLBACK_PLAN.md` (target ≤ 5 min).
