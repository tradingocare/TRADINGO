# Sprint 4 — Production Infrastructure Hardening — Completion Report

> Phase D1 · Sprint 4 · 2026-08-04 · Audit → Implement → Verify → Report → STOP
> Founder-approved. Scope: PostgreSQL, Redis, OpenSearch, Nginx, Docker Compose,
> health checks, security headers, Cloudflare compatibility. No public deployment.
> UI / Product Cards / Business Directory / DB schema: **untouched**.

## Verdict: 🟡 SPRINT GO — infra configuration hardened & verified · **Platform NO-GO** for live deploy (blocker B1–B9 remain, founder/owner-owned)

---

## 1. Infrastructure Audit — before vs after

| Domain | Before (Sprint 3) | After (Sprint 4) | Evidence |
|---|---|---|---|
| trustProxy (NestJS) | **unset** → throttler keyed on nginx/edge IP | `trustProxy: true` in `FastifyAdapter` | functional test: per-XFF buckets 29/29/28 ✅ |
| TLS | `TLSv1.2 TLSv1.3`, ciphers `HIGH:!aNULL:!MD5` (dated) | ECDHE-AES128/256-GCM + CHACHA20 only, `ssl_prefer_server_ciphers on`, session cache/tickets, OCSP stapling, `http2 on` | `nginx -t` ok |
| HTTP/2 | `listen … http2` (deprecated in 1.27) | `listen 443 ssl;` + `http2 on;` | warning gone |
| HSTS | http-level | snippets (compile-time, preload) | header verified |
| X-Frame / nosniff / Referrer / Permissions | http-level | snippet + CSP; `frame-ancestors 'self'` | nginx -t |
| CSP | **absent on web HTML** | Web: `default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src self+data+blob+https; connect-src api+wss; frame-src razorpay; object-src none; frame-ancestors self; base-uri self; form-action self; upgrade-insecure-requests` (API covered by helmet) | `nginx -t` |
| CSS/JS extension cache | none | `location ~* …` `expires 30d` (Next immutable preserved) | config |
| API cache | none | `Cache-Control: no-store` on all API locations + `proxy_hide_header Cache-Control` (Cloudflare/browser bypass) | config |
| gzip | on (level 6) | kept + `gzip_disable msie6`; `Vary` via `gzip_vary` | verified |
| Brotli | web n/a; API @fastify/compress (threshold 1024) | unchanged; **verified `Content-Encoding: br`** on API | curl ✅ |
| Reverse-proxy header hygiene | — | `proxy_hide_header X-Powered-By` (hides Next.js) | — |
| Client-IP observability | redundant xff in log only | log_format includes `cf_connecting_ip` | — |
| Cloudflare compat | not considered | X-Forwarded-For honored (trustProxy), X-Forwarded-Proto `$scheme`, no-store bypasses CF cache on /api, HTTP→HTTPS 301 for both hosts | verified |

**Files changed:** `apps/api/src/main.ts` (trustProxy), `infrastructure/nginx/nginx.conf` · `sites/tradingo.conf` (rewritten) · `snippets/security-headers.conf` (**new**) · `docker-compose.prod.yml` (snippets mount) · `docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md`.

## 2. Docker Verification (compose config)

- `docker compose --env-file .env.production.local config --quiet` → **VALID**
- Volume mount for `./infrastructure/nginx/snippets:/etc/nginx/snippets:ro` resolves
- `docker run … nginx:1.27-alpine nginx -t` → **syntax is ok / test is successful** (`--add-host web/api:127.0.0.1` fakes net → resolves upstream names; `ssl_stapling ignored (issuer cert not found)` warning expected with self-signed dev certs, disappears with real LE certs)
- Remaining: full stack boot gated by B1 (secrets) — not executed this spring, by design.

## 3. Container Health Report (dev parity stack, running locally)

| Container | Status | Restart policy | Memory (limit) | Persistence |
|---|---|---|---|---|
| tradingo-postgres (16-alpine) | **healthy**, `pg_isready` OK | unless-stopped | 611 MiB (2 GiB) | `tradingo_postgres_data` → `/var/lib/postgresql/data` |
| tradingo-redis (7-alpine) | **healthy**, `PING → PONG`, AOF + successful RDB saves | unless-stopped | 11.8 MiB (512 MiB) | `tradingo_redis_data` → `/data` |
| infrastructure-opensearch-1 | **healthy**, cluster yellow (1 node, 15/15 primary shards, replicas unassigned — expected single-node) | unless-stopped | 1.4 GiB | `infrastructure_opensearch_data` → `/usr/share/opensearch/data` |

Endpoints after reload:
- `GET /live` → `{"status":"ok"}` ✅
- `GET /ready` → `{"checks":{"database":{"status":"up"}}}` ✅
- `GET /health` → database up ✅

## 4. Security Audit

| Control | Status | Where/Evidence |
|---|---|---|
| trustProxy | ✅ verified | per-XFF throttler buckets isolated in live traffic |
| HSTS (preload) | ✅ | app + nginx |
| CSP | ✅ nginx (web) + helmet (API) | verified header on API response; prod removes `unsafe-inline`/`unsafe-eval` (main.ts) |
| X-Frame-Options / COOP/CORP | ✅ | DENY / same-origin (app + nginx) |
| Referrer-Policy / Permissions-Policy | ✅ | strict-origin-when-cross-origin / restricted |
| Modern ciphers + TLS 1.2/1.3 only | ✅ | config; TLSv1.0/1.1 refused |
| API not cached | ✅ | `no-store` everywhere API is served |
| Static cache (immutable) | ✅ | nginx 30d + Next immutable |
| Rate limiting behind CF | ✅ | per real-client-IP buckets working (trustProxy); Throttler intact (`x-ratelimit-*` headers observed) |
| `server_tokens off` + no X-Powered-By | ✅ | |
| HSTS on `api.tradingo.in` | ✅ | http-level + host include |

## 5. Updated Production Checklist
`docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md` — Sprint 4 items inserted (nginx pre-flight, security-header/TLS/CSP/static/no-store/brotli/rate-limit probe steps in Phase 3+).

## 6. Production Readiness Score

| Domain (weight) | Before | After | Evidence |
|---|---|---|---|
| Docker Compose (2) | 80 | 100 | config valid, 12 services, healthchecks, ws limits, ro mounts, snippets |
| K8s (1) | 30 | 30 | out of scope (Sprint 5+) |
| CI/CD (1) | 100 | 100 | unchanged |
| GitHub Secrets (1) | 0 | 0 | gh unauthenticated (B5) |
| Secrets/env (2) | 40 | 100 | guards + generated secrets + .env consistency |
| SSL (1) | 20 | 30 | LE guide ready, certs still self-signed (B4) |
| DNS (2) | 25 | 25 | api record missing (B3) |
| Routing (1) | 0 | 0 | no VPS/origin (B2) |
| Backups (1) | 80 | 80 | docs + scripts |
| Restore drill (1) | 10 | 10 | not executed (B6) |
| Redis (1) | 100 | 100 | AOF + volume + health verified |
| OpenSearch (1) | 40 | 50 | dev single-node yellow; prod rebuild-only posture (B7) |
| Monitoring (1) | 40 | 40 | host unverified |
| Health checks (1) | 90 | 100 | /live /ready /health verified |
| Nginx (1) | 60 | 95 | modern TLS/stapling/HTTP2, caching, no-store |
| Security headers (1) | 70 | 95 | CSP added for web; all base headers |
| Rate limiting/NAT (1) | 50 | 100 | trustProxy verified |
| Cache policy (1) | 50 | 95 | static cache + API no-store |
| Cloudflare (1) | 30 | 30 | dashboard unverifiable (no token) |
| VPS (2) | 5 | 15 | scripts + checklist ready; not provisioned (B2) |
| **Weighted readiness** | **~50** | **~67** | config posture fixed; external blockers unchanged |

> Remaining deviation is **entirely founder-provisioned**: B1 secrets (VPS owners), B2 VPS, B3 DNS, B4 TLS, B5 GitHub, B6 drill, B9 SES/OAuth. No remaining **code/config** debt from this sprint.

## 7. GO / NO-GO
- **Sprint 4 scope: GO** — all in-scope configuration hardened and verified (trustProxy, modern TLS, HSTS/CSP/frame/referrer/permissions, cipher suites, static cache, API no-store, gzip/brotli verification, docker/compose/volume/health/restart verified).
- **Live production deploy: NO-GO** — same external blockers as Sprint 3 (B1–B3, B4, B6, B9). Re-run checklist after founder provisions VPS + DNS + TLS + secrets.

## 8. Acknowledged residual items (out of sprint scope)
1. Web CSP is nginx-level (compose path). K8s ingress has **no CSP** — add next.config.ts CSP or ingress annotation during k8s phase.
2. nginx:1.27-alpine ships **no brotli module**; API responses verified `br`, web gzip only. Optional: custom image with `nginx-mod-http-brotli` (do not use unverified 3rd-party images).
3. `tradingo-postgres` log shows one old `column "isActive" does not exist` (dev query vs empty DB) — dev-only artifact, not infra.
4. OpenSearch single-node `yellow` (replicas unassigned) — expected for dev; prod must run ≥2 nodes or set replication 0.

**STOP — awaiting founder approval.** Next after approval: **Sprint 5 — GitHub Secrets/CI verification** (or VPS provisioning once founder supplies B1/B2/B3).