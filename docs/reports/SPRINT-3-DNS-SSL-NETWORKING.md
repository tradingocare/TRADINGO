# Sprint 3 — DNS, SSL & Production Infrastructure Preparation — Audit Report

> Phase D1 · Sprint 3 · 2026-08-04 · Audit → Implement → Verify → Report → STOP
> Preconditions re-read: FINAL-PRODUCTION-READINESS-AUDIT.md, SPRINT-1-SECRETS.md
> (created — did not exist), SPRINT-2-VPS-PROVISIONING.md, docs/security/SECRETS-CHECKLIST.md.

## Verdict: 🔴 NO-GO for live deployment — preparation deliverables COMPLETE
Blockers B2 (VPS), B3 (api.tradingo.in DNS), B4 (real TLS) remain. No application code, DB schema, or UI modified. Nothing deployed.

---

## 1. DNS Audit (live, 2026-08-04 — no fabrication)

| Record | Type | Current status (live resolution) | Required value | Ready? |
|---|---|---|---|---|
| tradingo.in | A | 104.21.1.22 + 172.67.151.222 (Cloudflare proxied) | → VPS origin IP | ⚠️ points at CF proxy, origin absent (B2) |
| www.tradingo.in | A | 104.21.1.22 + 172.67.151.222 (proxied) | → VPS origin IP | ⚠️ same |
| **api.tradingo.in** | A | **NXDOMAIN — no records** | → VPS origin IP | ❌ **MISSING (B3)** |
| tradingo.in | NS | melnicoff/rafe.ns.cloudflare.com | Cloudflare (keep) | ✅ |
| tradingo.in | MX | mx1/mx2.hostinger.com (5/10) | Hostinger until SES migration | ✅ (current mail) |
| tradingo.in | TXT | SPF `include:_spf.mail.hostinger.com ~all`; google-site-verification | extend SPF with `amazonses.com` at SES cutover | ⚠️ partial |
| _dmarc.tradingo.in | TXT | `v=DMARC1; p=none` | `p=quarantine` after SES verified | ⚠️ exists, policy none |
| tradingo.in | CAA | none | `0 issue "letsencrypt.org"` | ❌ MISSING |

## 2. SSL Audit

| Item | Status | Detail |
|---|---|---|
| Development certificates | ❌ in prod path | `infrastructure/nginx/ssl/` = self-signed dev certs (CN=tradingo.local, README confirms) |
| Let's Encrypt readiness | ⚠️ ready but blocked | certbot flow exists (`deploy-vps.sh setup_ssl`), UFW opens 80/443, but DNS origin (B3) + VPS (B2) missing |
| cert-manager readiness | ⚠️ partial | `ingress.yaml` annotated `letsencrypt-prod` ✅; **`cluster-issuer.yaml` MISSING** ❌ |
| Auto-renewal strategy | ✅ documented | cron 03:00 daily `certbot renew --post-hook restart nginx` (deploy-vps.sh §350 + SSL_SETUP_GUIDE §3) |
| Fallback strategy | ✅ documented | CF Origin Certificate (15-yr) / certbot container / LE staging for tests (SSL_SETUP_GUIDE §4) |
| TLS policy | ⚠️ partial | `TLSv1.2 TLSv1.3` ✅; cipher string `HIGH:!aNULL:!MD5` dated; no session cache/OCSP stapling (guide §5) |

## 3. Nginx Audit (`infrastructure/nginx/nginx.conf` + `sites/tradingo.conf`)

| Scope item | Status | Evidence / gap |
|---|---|---|
| Reverse proxy | ✅ | web:3000, api:3001, api.tradingo.in → api; `proxy_http_version 1.1` |
| WebSocket | ✅ | Upgrade/Connection headers; `/ws/` read_timeout 86400s; socket.io falls through `location /` on api host (works) |
| Compression | ✅ | gzip on, level 6, JSON/JS/CSS/SVG; vary+proxied any |
| Caching | ❌ | **no `proxy_cache_path`/`expires` at nginx**; Next static handled by next.config (`immutable`); app-level caching elsewhere |
| Security headers | ⚠️ | nginx sets X-Frame-Options DENY, nosniff, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS(preload) ✅ — **no CSP at nginx**; API responses carry helmet CSP; **web HTML has no CSP** ❌ |
| Rate limiting | ⚠️ | API Throttler present; **nginx has no limit_req zones**; behind Cloudflare the API sees CF IPs — **`trustProxy` NOT set in main.ts** → per-IP throttling ineffective (config change needed, Sprint 4) |
| HTTP → HTTPS redirect | ✅ | 301 on both server blocks |
| Large upload | ✅ | `client_max_body_size 100M` (matches API bodyLimit) |
| Timeouts | ✅ | read/send 90s; WS 86400s |
| Extra gaps | ⚠️ | no `ssl_session_cache`, no OCSP stapling, dated ciphers (SSL guide §5); `server_tokens off` ✅ |

K8s ingress equivalent: TLS 3 hosts ✅, limit-rps 100 ✅, CORS ✅, proxy-body-size 100m ✅ — same cert-manager issuer gap (cluster-issuer missing).

## 4. Cloudflare Audit

| Item | Status | Evidence |
|---|---|---|
| DNS | ✅ | zone on CF NS; apex/www proxied A records |
| api.tradingo.in record | ❌ | missing (B3) |
| SSL Mode | ⚠️ UNVERIFIABLE | dashboard-only; required: **Full (strict)** — no API token in repo |
| Caching | ⚠️ UNVERIFIABLE | recommend: cache static only, bypass `/api/`, `/socket.io/`, `/live`, `/health` |
| WAF | ⚠️ UNVERIFIABLE | required: managed rules ON (OWASP + Cloudflare) |
| Bot Protection | ⚠️ UNVERIFIABLE | recommend Bot Fight Mode / managed challenge on auth |
| Firewall Rules | ⚠️ UNVERIFIABLE | recommend: block admin paths by country list, IP rules |
| Page Rules | ⚠️ UNVERIFIABLE | legacy; prefer Rules engine |
| Origin Rules | ⚠️ UNVERIFIABLE | TLS Full strict + origin server name |
| Zero Trust readiness | ⚠️ UNVERIFIABLE | not applicable yet (no internal services) |
| **Access blocker** | ❌ | no Cloudflare API token / dashboard access for AI verification — founder must run the Cloudflare checklist (§7 of report) |

## 5. Security Headers & TLS (production readiness)

| Header | nginx (all hosts) | API (helmet, /api responses) | Web (Next HTML) |
|---|---|---|---|
| X-Frame-Options | ✅ DENY | ✅ deny | ⚠️ only via nginx |
| X-Content-Type-Options | ✅ nosniff | ✅ nosniff | ✅ next.config |
| X-XSS-Protection | ✅ 1; mode=block | ✅ | ⚠️ nginx only |
| Strict-Transport-Security | ✅ max-age=31536000; includeSubDomains; preload | ✅ | ⚠️ nginx only |
| Referrer-Policy | ✅ strict-origin-when-cross-origin | ✅ | ⚠️ nginx only |
| Permissions-Policy | ✅ camera/mic/geo/cohort=() | ✅ | ⚠️ nginx only |
| Content-Security-Policy | ❌ **missing** | ✅ helmet (prod: no unsafe-eval) | ❌ **missing** |
| TLS | TLSv1.2/1.3 ✅ | — | — |

## 6. Environment Consistency

| File | Keys | Notes |
|---|---|---|
| `.env.production` (tracked template) | 75 | includes SMTP_* (4, documented NOT USED) — intentional |
| `.env.production.local` (gitignored) | 71 | generated secrets present; founder keys `FOUNDER_REQUIRED` |
| `.env.production.local.example` (tracked) | 71 | zero values (verified programmatically) |
| local ↔ example diff | **0** | exact key match ✅ |
| Tracked secrets | none | `git ls-files` env files = .env.example + .env.production only; `git grep FOUNDER_REQUIRED` clean |

## 7. Deliverables (all generated this sprint)

| Deliverable | Path |
|---|---|
| Production Deployment Checklist | `docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md` |
| DNS Configuration Guide | `docs/deployment/DNS_CONFIGURATION_GUIDE.md` |
| SSL Setup Guide | `docs/deployment/SSL_SETUP_GUIDE.md` |
| Server Hardening Checklist | `docs/deployment/SERVER_HARDENING_CHECKLIST.md` |
| Production Rollback Plan (≤5 min) | `docs/deployment/PRODUCTION_ROLLBACK_PLAN.md` |
| Sprint 1 report (was missing) | `docs/reports/SPRINT-1-SECRETS.md` |

## 8. Remaining Blockers

| ID | Blocker | Owner | Sprint |
|---|---|---|---|
| B2 | VPS not provisioned (origin absent behind Cloudflare) | Founder | 2/4 |
| B3 | `api.tradingo.in` NXDOMAIN + apex points at empty CF proxy | Founder (Cloudflare UI) | 3 |
| B4 | No real TLS (self-signed dev certs in nginx path) | DevOps | 3/4 |
| B5 | `gh` unauthenticated — GitHub Secrets unverifiable | Founder | 5 |
| B6 | Restore drill never executed | DevOps | 4+ |
| B9 | SES identity + Google OAuth app + callback DNS | Founder | 7 |
| N1 | `trustProxy` unset in API → rate limiter blind behind CF | DevOps (code config, Sprint 4, needs approval) | 4 |
| N2 | nginx: no CSP for web HTML, no proxy_cache, dated ciphers | DevOps (config, Sprint 4) | 4 |
| N3 | Cloudflare dashboard items unverifiable (no token) | Founder | 3/6 |

## 9. GO / NO-GO
- **Sprint 3 preparation: GO** — all 5 production documents + audit deliverables complete and consistent.
- **Live production deployment: NO-GO** until B2 + B3 + B4 are evidenced (VPS up + DNS applied + real certs verified), then re-run checklist Phase 3.

**STOP — awaiting founder approval.** Founder actions to unblock: provision VPS (B2), create `api.tradingo.in` A record → VPS IP + CAA (B3, per DNS_CONFIGURATION_GUIDE.md), then DevOps executes SSL_SETUP_GUIDE (B4). After approval → **Sprint 4 (Production Infrastructure: PostgreSQL, Redis, OpenSearch, Nginx on the VPS)**.
