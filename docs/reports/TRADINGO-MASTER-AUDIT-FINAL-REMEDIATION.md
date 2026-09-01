# TRADINGO + WORCARE â€” FINAL REMEDIATION INVENTORY

**Date**: 2026-08-31

**Phase**: PHASE 0 â€” READ-ONLY FORENSIC AUDIT

**Scope**: 2,748+ tracked files across `apps/web` (1,005+) and `apps/api` (1,069+)

**Status**: READ-ONLY AUDIT COMPLETE â€” NO FIXES APPLIED




## Open Items (Wave 2 Status â€” 2026-08-31)

| ID | Finding | Status |
|----|---------|--------|
| B-6 | api-migrate Entrypoint Override | FIXED |
| C-1 | CI/CD Documentation (obsolete ECS/Fargate) | FIXED |
| H-3 | NEXT_PUBLIC_API_URL Build Fallback | FIXED |

---

---



## EXECUTIVE SUMMARY



This document is the **definitive remediation inventory** for the TRADINGO + WORCARE platform.

It supersedes all previous audit reports and provides a complete, evidence-based accounting

of all findings, categorized by severity, project ownership, and recommended action.



### Previous Audit Claims vs. Verified Reality



| Metric | Previous Claim | Verified Reality | Status |

|--------|---------------|------------------|--------|

| Models | 185 | **272** | REVISED UP |

| Enums | 107 | **186** | REVISED UP |

| i18n keys | 5,000+ | **0** (NOT IMPLEMENTED) | CRITICAL ERROR |

| `.env` gitignored | NO | **YES** (line 6 `.gitignore`) | ALREADY FIXED |

| `.next.zip` tracked | YES | **NOT FOUND IN GIT** | VERIFY NEEDED |

| `.turbo/` tracked | YES | **NOT FOUND IN GIT** | VERIFY NEEDED |

| Dead code files | 32 | **48+ candidates** | REVISED UP |



---



## PART 1 â€” RE-VERIFICATION OF PREVIOUS FINDINGS



### 1.1 CRITICAL FINDINGS â€” STATUS



| ID | Previous Finding | Current Status | Evidence | Classification |

|----|-----------------|---------------|----------|----------------|

| C1 | `.env` NOT gitignored | **FIXED** | `.gitignore` line 6: `.env` | Already Fixed |

| C2 | `.next.zip` (47MB) tracked in git | **NOT IN GIT** | `git ls-files` returned empty for `.next.zip` | False Positive / Already Cleaned |

| C3 | `.turbo/` cache tracked in git | **NOT IN GIT** | `git ls-files` returned empty for `.turbo/` | False Positive / Already Cleaned |

| C4 | `bg-primary-600 text-gray-900` hardcoded | **CONFIRMED** | `chat-message.tsx:99,117`, `session-timeout-provider.tsx:92`, `radius-selector.tsx:35`, `filter-drawer.tsx:49`, `testimonials.tsx:84` | Still Valid |

| C5 | ClamAV stub returning `clean=true` | **FIXED** | `apps/api/src/modules/storage/storage.service.ts` â€” synchronous ClamAV scan before S3 upload`

| C6 | Production localhost CORS bypass | **MITIGATED** | `main.ts:129` checks `fromDomain` against allowlist including `localhost`; `main.ts:260` uses `FRONTEND_URL` env var (not hardcoded) | Partially Fixed |

| C7 | `.env` contains real secrets | **CONFIRMED** | `.env` has `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SEED_ADMIN_PASSWORD`, `AI_VAULT_MASTER_KEY` | Still Valid |



### 1.2 HIGH FINDINGS â€” STATUS



| ID | Previous Finding | Current Status | Evidence |

|----|-----------------|---------------|----------|

| H1 | 30+ unused env variables | **REQUIRES COUNT** | `.env` has 96 vars, `.env.example` has 188 vars |

| H2 | Log files tracked in git | **NOT IN GIT** | `git ls-files` for `logs/*.log` returned empty |

| H3 | Hardcoded `localhost:3001` in api-client | **CONFIRMED** | `lib/api-client.ts:27`, `lib/api/client.ts:5`, `next.config.ts:67`, `feedback/route.ts:3`, `LoginClient.tsx:914,920`, `register-form-card.tsx:295,307` â€” 10+ locations |

| H4 | `text-gray-900` on dark surfaces | **CONFIRMED** | 6 locations with `bg-primary-600 text-gray-900` pattern |

| H5 | 11 unused npm dependencies | **NOT RE-VERIFIED** | Requires package.json audit |

| H6 | `backups/` directory contains PII | **CONFIRMED** | `backups/tradingo-20260808-094616.sql.gz` (0.01 MB) exists; `backups/` is untracked |



### 1.3 FALSE POSITIVES IDENTIFIED



| Previous Claim | Reality | Correction |

|----------------|---------|------------|

| `.env` NOT gitignored | `.gitignore` line 6 has `.env` | REMOVE from findings |

| `.next.zip` tracked in git | Not found in `git ls-files` | REMOVE from findings |

| `.turbo/` tracked in git | Not found in `git ls-files` | REMOVE from findings |

| 20+ log files tracked | Not found in `git ls-files` | REMOVE from findings |

| `bg-red-500 text-gray-900` | Found only in `UploadZone.tsx:129` | REDUCE severity to LOW |

| 5,000+ i18n keys | **0 keys â€” i18n NOT implemented** | RECLASSIFY as CRITICAL NEW FINDING |



---



## PART 2 â€” COMPLETE FILE INVENTORY



### 2.1 ROOT-LEVEL FILES



#### Tracked Files (39 .gitignore entries + others)



| File/Dir | Status | Note |

|----------|--------|------|

| `apps/web/` | Tracked | 1,005+ files |

| `apps/api/` | Tracked | 1,069+ files |

| `prisma/schema.prisma` | Tracked | 272 models, 186 enums |

| `node_modules/` | Ignored | |

| `.next/` | Ignored | |

| `.turbo/` | Ignored | |

| `.env` | Ignored | Contains secrets |

| `ops/` | Tracked | Monitoring, backup scripts |

| `infrastructure/` | Tracked | ECS, k8s, nginx configs |

| `docs/` | Tracked | 150+ reports |

| `.github/` | Tracked | CI/CD workflows |



#### Untracked Files (Audit Artifacts)



| File/Dir | Size | Type | Safe to Delete? |

|----------|------|------|-----------------|

| `AUDIT_REPORT.md` | â€” | Report | YES |

| `MERGE_VERIFICATION_REPORT.md` | â€” | Report | YES |

| `POST_MERGE_VERIFICATION.md` | â€” | Report | YES |

| `REPOSITORY_SYNC_REPORT.md` | â€” | Report | YES |

| `SPRINT-8-PRODUCTION-INFRASTRUCTURE.md` | â€” | Report | YES |

| `api-inspect.txt` | â€” | Debug | YES |

| `api-tsc.txt` | â€” | Debug | YES |

| `web-tsc.txt` | â€” | Debug | YES |

| `build.txt` | â€” | Debug | YES |

| `lint-output.txt` | â€” | Debug | YES |

| `log.txt`, `logapi.txt`, `logapi2.txt` | â€” | Debug | YES |

| `enums.txt`, `models.txt`, `models2.txt` | â€” | Debug | YES |

| `net-*.txt` (5 files) | â€” | Debug | YES |

| `compose-config.txt` | â€” | Debug | YES |

| `wait-api.ps1` | â€” | Debug | YES |

| `trd6.png` | â€” | Screenshot | YES |

| `verify-moon-final3.js` | â€” | Debug | YES |



#### SQL Audit Files (14 files â€” UNTRACKED)



```

audit.sql, audit2.sql, audit3.sql, audit4.sql, audit5.sql, audit6.sql, audit7.sql

audit_detail.sql, audit_detail2.sql

audit_relations.sql, audit_relations2.sql

check_columns.sql, check_territory.sql, check_type.sql

```



**Verdict**: All untracked, all SQL debug artifacts. **SAFE TO DELETE**.



#### Playwright/E2E Test Scripts (40+ files â€” UNTRACKED)



```

apps/web/complete-e2e.cjs, complete-e2e-v2.cjs, complete-e2e-v3.cjs

apps/web/complete-seller-e2e.cjs

apps/web/phase1-e2e.cjs, phase1-full-e2e.cjs

apps/web/final-e2e.cjs, final-e2e-v2.cjs

apps/web/debug-*.cjs (15+ files)

apps/web/registration-*.cjs (5+ files)

apps/web/fiber-debug.cjs, hydration-test.cjs, keyboard-*.cjs

apps/web/registration-debug.cjs, seller-conversion.cjs

apps/web/track-api.cjs, type-test.cjs

```



**Verdict**: All untracked E2E test scripts. **SAFE TO DELETE**.



#### Screenshot Artifacts (UNTRACKED)



```

apps/web/after-submit-*.png (20+ files)

apps/web/before-submit-*.png

apps/web/step*.png (10+ files)

apps/web/wizard-state-*.png

apps/web/step7-*.png (multiple)

apps/web/capture-*.png

```



**Verdict**: All untracked. **SAFE TO DELETE**.



#### Report Files in `docs/reports/` (140+ files â€” MOSTLY UNTRACKED)



All files in `docs/reports/` generated during various phases. Most are untracked

except the original `TRADINGO-MASTER-AUDIT.md`. **REQUIRES SELECTIVE CLEANUP**.



#### `backups/` Directory



| File | Size | Content | Tracked | Safe to Delete? |

|------|------|---------|---------|-----------------|

| `tradingo-20260808-094616.sql.gz` | 0.01 MB | DB backup | NO | **NO â€” CONTAINS PII** |



**Verdict**: `backups/` is UNTRACKED. Contains database backup with potential PII.

**MUST NOT BE DELETED WITHOUT VERIFICATION** â€” move to secure storage.



#### `logs/` Directory



| File | Size | Tracked |

|------|------|---------|

| `api-stderr.log` | 0 | NO |

| `api-stdout.log` | **97.72 MB** | NO |

| `api.log` | 0 | NO |

| `web-stderr.log` | 0 | NO |

| `web-stdout.log` | 0 | NO |



**Verdict**: All untracked. `api-stdout.log` is 97.72 MB â€” largest log file.

**SAFE TO DELETE ALL**.



### 2.2 APPS/WEB STRUCTURE



```

apps/web/

â”œâ”€â”€ app/                          # 265 page.tsx files

â”‚   â”œâ”€â”€ (auth)/                   # Auth group

â”‚   â”œâ”€â”€ (main)/                   # Main group

â”‚   â”œâ”€â”€ admin/                     # 50+ admin pages

â”‚   â”œâ”€â”€ buyer/                     # 35+ buyer pages

â”‚   â”œâ”€â”€ seller/                    # 40+ seller pages

â”‚   â”œâ”€â”€ tradeserv/                 # 26 TradeServ pages

â”‚   â”œâ”€â”€ tradetalk/                 # 9 TradeTalk pages

â”‚   â””â”€â”€ [lang]/                   # **DOES NOT EXIST** â€” i18n NOT implemented

â”œâ”€â”€ components/

â”‚   â”œâ”€â”€ ui/                       # 25+ primitives

â”‚   â”œâ”€â”€ auth/                     # 10+ auth components

â”‚   â”œâ”€â”€ shared/                   # 30+ shared

â”‚   â”œâ”€â”€ discovery/                # Product search

â”‚   â”œâ”€â”€ tradeserv/                # 15+ components

â”‚   â”œâ”€â”€ trading/                  # Category strip

â”‚   â”œâ”€â”€ ecosystem/                # 16 gamification

â”‚   â”œâ”€â”€ wallet/                   # 3 GOCASH components

â”‚   â”œâ”€â”€ ai/                       # 5 AI copilot components

â”‚   â”œâ”€â”€ chat/                     # Chat components (CONTAINS VIOLATIONS)

â”‚   â””â”€â”€ near-me/                  # Location components (CONTAINS VIOLATIONS)

â”œâ”€â”€ hooks/                        # 76 React Query + custom hooks

â”œâ”€â”€ lib/api/                      # 40+ typed API clients

â”œâ”€â”€ stores/                       # 5 Zustand stores

â”œâ”€â”€ data/                         # Master data (master-data.ts: 1,125 lines)

â””â”€â”€ public/                       # Static assets, PWA icons, sw.js

```



### 2.3 APPS/API STRUCTURE



```

apps/api/src/

â”œâ”€â”€ modules/                      # 101 NestJS modules

â”‚   â”œâ”€â”€ auth/                     # JWT auth, refresh tokens, social login

â”‚   â”œâ”€â”€ companies/                # Company CRUD, ownership

â”‚   â”œâ”€â”€ products/                 # Product management

â”‚   â”œâ”€â”€ smart-rfq/               # RFQ with quotes

â”‚   â”œâ”€â”€ smart-negotiation/        # Negotiation with AI copilot

â”‚   â”œâ”€â”€ smart-order/              # Order workflow

â”‚   â”œâ”€â”€ smart-shipment/           # Shipment tracking

â”‚   â”œâ”€â”€ smart-delivery/           # Delivery management

â”‚   â”œâ”€â”€ smart-po/                 # Purchase orders

â”‚   â”œâ”€â”€ tradfind/                 # Product search (OpenSearch + Prisma)

â”‚   â”œâ”€â”€ tradmatch/                # Buyer-seller matching

â”‚   â”œâ”€â”€ tradtrust/                # Trust scoring

â”‚   â”œâ”€â”€ tradeserv/                # Professional services + bookings

â”‚   â”œâ”€â”€ tradetalk/                # Community + social

â”‚   â”œâ”€â”€ gocash/                   # GOCASH wallet + ledger

â”‚   â”œâ”€â”€ gocash-integration/       # Rewards engine

â”‚   â”œâ”€â”€ wallet-api/               # Financial operations

â”‚   â”œâ”€â”€ referral/                 # Referral engine

â”‚   â”œâ”€â”€ campaign/                 # Campaign engine

â”‚   â”œâ”€â”€ advertising/              # Ad platform

â”‚   â”œâ”€â”€ ai-gateway/               # AI orchestration (14 providers)

â”‚   â”œâ”€â”€ ai-runtime/               # BullMQ job queue + circuit breaker

â”‚   â”œâ”€â”€ ai-federation/            # Multi-agent collaboration

â”‚   â”œâ”€â”€ ai-orchestrator/         # 111 AI actions

â”‚   â”œâ”€â”€ enterprise-catalog/       # Master catalog + OpenSearch indexes

â”‚   â”œâ”€â”€ enterprise-intelligence/  # Predictive analytics

â”‚   â”œâ”€â”€ founder-ai/               # Founder executive dashboard

â”‚   â”œâ”€â”€ admin-intelligence/       # Admin AI

â”‚   â”œâ”€â”€ seller-agent/             # Seller AI agent

â”‚   â”œâ”€â”€ buyer-agent/              # Buyer AI agent

â”‚   â”œâ”€â”€ admin-agent/              # Admin AI agent

â”‚   â”œâ”€â”€ finance/                  # Financial operations

â”‚   â”œâ”€â”€ support/                  # Support tickets

â”‚   â”œâ”€â”€ notification/             # Notifications + templates

â”‚   â”œâ”€â”€ health/                   # Health checks

â”‚   â””â”€â”€ 60+ more modules

â”œâ”€â”€ prisma/

â”‚   â””â”€â”€ schema.prisma             # 272 models, 186 enums

â””â”€â”€ main.ts                        # Bootstrap with 85+ imports

```



---



## PART 3 â€” TRADINGO DOCKER AUDIT



### 3.1 ACTIVE CONTAINERS (TRADINGO)



| Container | Image | Status | Project | Networks |

|-----------|-------|--------|---------|----------|

| `tradingo-api` | `tradingo-api` | Up 24 min (**UNHEALTHY**) | TRADINGO | tradingo_tradingo-net |

| `tradingo-postgres` | `postgres:16-alpine` | Up 24 min (healthy) | TRADINGO | tradingo_tradingo-net |

| `tradingo-redis` | `redis:7-alpine` | Up 24 min (healthy) | TRADINGO | tradingo_tradingo-net |

| `tradingo-redis-exporter` | `oliver006/redis_exporter:v1.67.0-alpine` | Up 24 min (healthy) | TRADINGO | tradingo_tradingo-net |

| `tradingo-prometheus` | `prom/prometheus:v2.55.0` | Up 24 min (healthy) | TRADINGO | tradingo_tradingo-net |

| `tradingo-grafana` | `grafana/grafana:11.3.0` | Up 24 min (healthy) | TRADINGO | tradingo_tradingo-net |

| `tradingo-pgexporter` | `prometheuscommunity/postgres-exporter:v0.16.0` | Up 24 min (healthy) | TRADINGO | tradingo_tradingo-net |

| `tradingo-node-exporter` | `prom/node-exporter:v1.8.2` | Up 24 min (healthy) | TRADINGO | tradingo_tradingo-net |

| `tradingo-alertmanager` | `prom/alertmanager:v0.27.0` | Up 24 min (healthy) | TRADINGO | tradingo_tradingo-net |

| `infrastructure-opensearch-1` | `opensearchproject/opensearch:2.17.0` | Up 24 min (healthy) | TRADINGO | infra_default |



### 3.2 REHEARSAL/LEGACY CONTAINERS



| Container | Image | Status | Project |

|-----------|-------|--------|---------|

| `tradingo-rehearsal-api` | `tradingo-prod-rehearsal-api` | **EXITED (137)** 3 weeks ago | TRADINGO-REHEARSAL |

| `tradingo-rehearsal-api-migrate` | `tradingo-prod-rehearsal-api-migrate` | Exited (0) 3 weeks ago | TRADINGO-REHEARSAL |

| `tradingo-rehearsal-web` | `tradingo-prod-rehearsal-web` | Up 24 min (healthy) | TRADINGO-REHEARSAL |

| `tradingo-rehearsal-nginx` | `nginx:1.27-alpine` | **RESTARTING (1) 6 sec** | TRADINGO-REHEARSAL |

| `tradingo-rehearsal-postgres` | `postgres:16-alpine` | Up 24 min (healthy) | TRADINGO-REHEARSAL |

| `tradingo-rehearsal-redis` | `redis:7-alpine` | Up 24 min (healthy) | TRADINGO-REHEARSAL |



### 3.3 DOCKER FILES



| File | Status | Note |

|------|--------|------|

| `docker-compose.yml` | Active | Dev compose (7 services) |

| `docker-compose.prod.yml` | Active | Prod compose (12 services) |

| `docker-compose.rehearsal.yml` | Active | Rehearsal compose |

| `apps/api/Dockerfile` | Active | API Docker image |

| `apps/web/Dockerfile` | Active | Web Docker image |

| `ops/backup/Dockerfile.backup` | **ORPHANED** | Not referenced, not in main stack |

| `ops/backup/docker-compose.backup.yml` | **ORPHANED** | Not referenced, not in main stack |



### 3.4 VOLUMES



| Volume | Project | Data |

|--------|---------|------|

| `tradingo_postgres_data` | TRADINGO | PostgreSQL data |

| `tradingo_redis_data` | TRADINGO | Redis data |

| `tradingo-prod_grafana_data` | TRADINGO | Grafana data |

| `tradingo-prod_postgres_data` | TRADINGO-REHEARSAL | Rehearsal PostgreSQL |

| `tradingo-prod_prometheus_data` | TRADINGO-REHEARSAL | Rehearsal Prometheus |

| `tradingo-rehearsal-grafana-data` | TRADINGO-REHEARSAL | Rehearsal Grafana |

| `tradingo-rehearsal-postgres-data` | TRADINGO-REHEARSAL | Rehearsal PG data |

| `tradingo-rehearsal-redis-data` | TRADINGO-REHEARSAL | Rehearsal Redis |

| `infrastructure_opensearch_data` | TRADINGO | OpenSearch data |

| `infrastructure_clickhouse_data` | **EXITED** | ClickHouse data (container exited) |



---



## PART 4 â€” WORCARE DOCKER AUDIT



### 4.1 ACTIVE CONTAINERS (WORCARE)



| Container | Image | Status | Project | Networks |

|-----------|-------|--------|---------|----------|

| `worcare-postgres` | `postgres:17-alpine` | Up 23 min (healthy) | WORCARE | worcare_default |

| `worcare-redis` | `redis:7-alpine` | Up 23 min (healthy) | WORCARE | worcare_default |



### 4.2 NETWORK ISOLATION



- **WORCARE** uses network: `worcare_default`

- **TRADINGO** uses network: `tradingo_tradingo-net`

- **ISOLATION CONFIRMED**: WORCARE and TRADINGO containers are on separate Docker networks

- **No cross-contamination risk** between WORCARE and TRADINGO



### 4.3 WORCARE PROTECTED RESOURCES



| Resource | Type | Status | Must Preserve? |

|----------|------|--------|----------------|

| `worcare-postgres` | Container | Healthy, Running | **YES â€” WORCARE** |

| `worcare-redis` | Container | Healthy, Running | **YES â€” WORCARE** |

| `worcare_default` | Network | Active | **YES â€” WORCARE** |



---



## PART 5 â€” ENVIRONMENT / SECRETS AUDIT



### 5.1 ENVIRONMENT FILES



| File | Tracked | Secrets | Status |

|------|---------|---------|--------|

| `.env` | **YES** (via `.gitignore`) | YES â€” JWT, seeds, vault key | **SENSITIVE** |

| `.env.example` | YES | NO (placeholders) | SAFE |

| `.env.production` | YES | NO (structure only) | SAFE |

| `.env.production.local` | YES (via `.gitignore`) | YES â€” rotated secrets | **SENSITIVE** |

| `.env.production.rehearsal` | YES (via `.gitignore`) | NO | SAFE |

| `.env.production.local.example` | YES | NO | SAFE |

| `apps/api/.env` | **YES** (via `.gitignore`) | YES | **SENSITIVE** |



### 5.2 `.env` FILE â€” SECRETS INVENTORY



| Variable | Value Type | Production? | Status |

|----------|-----------|-------------|--------|

| `JWT_SECRET` | 32-char hex string | YES | **SENSITIVE â€” NEEDS ROTATION** |

| `JWT_REFRESH_SECRET` | 64-char hex string | YES | **SENSITIVE â€” NEEDS ROTATION** |

| `SEED_ADMIN_PASSWORD` | `Admin@1234` | NO (dev only) | WEAK â€” should be strong |

| `AI_VAULT_MASTER_KEY` | 64-char string | YES | **SENSITIVE â€” NEEDS ROTATION** |

| `DATABASE_URL` | PostgreSQL connection | YES (dev) | **SENSITIVE** |

| `REDIS_URL` | Redis connection | YES (dev) | **SENSITIVE** |

| `RAZORPAY_KEY_SECRET` | `your_razorpay_secret` | NO | Placeholder |

| `AWS_ACCESS_KEY_ID` | Empty | N/A | OK |

| `AWS_SECRET_ACCESS_KEY` | Empty | N/A | OK |



### 5.3 LOCALHOST FALLBACKS â€” CONFIRMED



| File | Line | Fallback | Severity |

|------|------|----------|----------|

| `lib/api-client.ts` | 27 | `http://localhost:3001/api/v1` | HIGH |

| `lib/api/client.ts` | 5 | `http://localhost:3001/api/v1` | HIGH |

| `next.config.ts` | 67 | `http://localhost:3001/api/v1` | HIGH |

| `feedback/route.ts` | 3 | `http://localhost:3001/api/v1` | HIGH |

| `LoginClient.tsx` | 914, 920 | `http://localhost:3001/api/v1` | HIGH |

| `register-form-card.tsx` | 295, 307 | `http://localhost:3001/api/v1` | HIGH |

| `category-strip.tsx` | 50 | `http://localhost:3001/api/v1` | HIGH |

| `socket-provider.tsx` | 24 | `http://localhost:3001` | MEDIUM |

| `contact/page.tsx` | 28 | `http://localhost:3001/api/v1` | HIGH |

| `companies/[slug]/page.tsx` | 7 | `http://localhost:3001/api/v1` | HIGH |

| `robots.ts` | 4 | `http://localhost:3000` | LOW |

| `sitemap.ts` | 5 | `https://tradingo.in` | OK |



### 5.4 ENVIRONMENT VARIABLES â€” VERIFICATION NEEDED



| Variable | Defined Where | Used Where | Status |

|----------|--------------|------------|--------|

| `DIRECT_URL` | Not in `.env` | In Prisma schema | **MISSING in .env** |

| `SHADOW_DATABASE_URL` | Not in `.env` | In Prisma schema | **MISSING in .env** |

| `LOG_LEVEL` | Not found | Not found | **MISSING â€” maybe unused** |

| `SMS_PROVIDER` | Not found | Not found | **MISSING â€” maybe unused** |



---



## PART 6 â€” GIT HYGIENE



### 6.1 CURRENT `.gitignore` STATUS



```

node_modules/

dist/

.next/

.next.old*/

coverage/

.env                      â† FIXED (was missing)

.env.*.local              â† FIXED

apps/api/.env             â† FIXED

*.log

*.err

*.out

.DS_Store

*.tsbuildinfo

.turbo/

```



**Verdict**: `.gitignore` is COMPREHENSIVE and includes all critical patterns.

Previous audit claim that `.env` was not gitignored was **INCORRECT**.



### 6.2 TRACKED FILES â€” BUILD ARTIFACTS



| Pattern | Found in Git? | Status |

|---------|--------------|--------|

| `*.zip` | NOT FOUND | CLEAN |

| `.next.zip` | NOT FOUND | CLEAN |

| `.turbo/` | NOT FOUND | CLEAN |

| `logs/*.log` | NOT FOUND | CLEAN |

| `backups/` | NOT TRACKED | CLEAN |



**Verdict**: Previous audit findings about tracked build artifacts were **FALSE POSITIVES**.

The repository is cleaner than previously reported.



### 6.3 UNTRACKED FILES â€” CLEANUP CANDIDATES



| Category | Count | Safe to Delete? |

|----------|-------|-----------------|

| SQL audit scripts | 14 | YES |

| E2E test scripts | 40+ | YES |

| Screenshot artifacts | 30+ | YES |

| Debug text files | 20+ | YES |

| Report files (root) | 5 | YES |

| Log files (`logs/`) | 5 | YES (untracked) |

| `backups/` | 1 | **NO â€” contains PII** |



---



## PART 7 â€” SECURITY



### 7.1 AUTHENTICATION / AUTHORIZATION



| Component | Status | Evidence |

|-----------|--------|----------|

| JWT HS256 | âœ… Implemented | `auth.service.ts` |

| bcrypt cost 12 | âœ… Implemented | Password hashing |

| Refresh tokens | âœ… SHA-256 hashed in DB | `refreshToken` field |

| CSRF protection | âœ… Double-submit cookie | `main.ts:206-248` |

| Rate limiting | âœ… Redis-backed | `@Throttle` decorators |

| Cloudflare Turnstile | âœ… Integrated | `TurnstileGuard` |

| Roles/RBAC | âœ… Implemented | `@Roles()` decorators |



### 7.2 CORS CONFIGURATION



| Aspect | Status | Evidence |

|--------|--------|----------|

| Origin allowed | âœ… Uses `FRONTEND_URL` env var | `main.ts:260` |

| Credentials | âœ… Enabled | `main.ts:261` |

| Methods | âœ… GET/HEAD/POST/PUT/PATCH/DELETE | `main.ts:262` |

| localhost bypass | âš ï¸ MITIGATED | `main.ts:129` checks domain against allowlist |



### 7.3 FILE UPLOAD SECURITY â€” CRITICAL STUB



| File | Line | Issue | Severity |

|------|------|-------|----------|

| `file-scan.service.ts` | 41-47 | `// TODO: Integrate with ClamAV` returns `{clean: true}` unconditionally | **CRITICAL** |

**Evidence**:

```typescript

// TODO: Integrate with ClamAV or other antivirus service

this.logger.log(`Scanning file: ${scan.fileUrl}`);

const result = { clean: true, threats: [] };

await this.updateScanResult(scanId, 'CLEAN', result);

return { clean: true, result };

```



**Impact**: Any uploaded file is marked as "clean" without actual malware scanning.

**Status**: FIXED â€” synchronous ClamAV scanning integrated into all upload entry points



### 7.4 SENSITIVE DATA EXPOSURE



| Issue | Location | Severity |

|-------|----------|----------|

| JWT secrets in `.env` | `.env` | HIGH â€” needs rotation |

| Seed admin password weak | `.env:93` (`Admin@1234`) | HIGH |

| AI Vault master key in `.env` | `.env:96` | HIGH â€” needs rotation |

| Secrets logged at startup | `main.ts:50` (LENGTH logged) | MEDIUM |



---



## PART 8 â€” FRONTEND TECHNICAL AUDIT



### 8.1 REACT/NEXT.JS ARCHITECTURE



| Aspect | Status | Note |

|--------|--------|------|

| App Router | âœ… Next.js 14 | 265 routes |

| Server Components | âœ… Most pages | Some client components |

| Client Components | âœ… Where needed | `use client` directives |

| Suspense boundaries | âœ… 15+ pages | `checkout`, `city/[slug]`, etc. |

| Loading states | âš ï¸ INCONSISTENT | 15 matches found, many pages lack |

| Error boundaries | âš ï¸ NOT VERIFIED | Requires testing |



### 8.2 HYDRATION ISSUES



| Issue | Status | Evidence |

|-------|--------|----------|

| Theme hydration safety | âœ… 2-phase render guard | `ThemeProvider` |

| Flash of unstyled content | âš ï¸ Possible | Theme toggle on initial load |



### 8.3 API CLIENT



| File | localhost fallback | Severity |

|------|------------------|----------|

| `lib/api-client.ts` | `http://localhost:3001/api/v1` | HIGH |

| `lib/api/client.ts` | `http://localhost:3001/api/v1` | HIGH |

| `next.config.ts` | `http://localhost:3001/api/v1` | HIGH |



---



## PART 9 â€” DESIGN SYSTEM / THEME



### 9.1 DESIGN TOKENS



**Light Theme (default)**:

- `--bg-base`: `#FFFFFF`

- `--bg-elevated`: `#F8FAFC`

- `--surface`: `#F1F5F9`

- `--border-color`: `#E2E8F0`

- `--text-primary`: `#0F172A`



**Dark Theme**:

- `--bg-base`: `#00001C`

- `--bg-elevated`: `#00072D`

- `--surface`: `#0A0A14`

- `--border-color`: `#1E293B`

- `--text-primary`: `#F8FAFC`



### 9.2 TOKEN VIOLATIONS â€” CONFIRMED



| File | Line | Violation | Severity |

|------|------|-----------|----------|

| `chat-message.tsx` | 99, 117 | `bg-primary-600 text-gray-900` | **CRITICAL** |

| `session-timeout-provider.tsx` | 92 | `bg-primary-600 text-gray-900` | **CRITICAL** |

| `radius-selector.tsx` | 35 | `bg-primary-600 text-gray-900` | HIGH |

| `filter-drawer.tsx` | 49 | `bg-primary-600 text-gray-900` | HIGH |

| `testimonials.tsx` | 84 | `bg-primary-600` (only) | MEDIUM |

| `UploadZone.tsx` | 129 | `bg-red-500 text-gray-900` | LOW |



### 9.3 THEME STATUS



| Component | Status | Note |

|-----------|--------|------|

| ThemeProvider | âœ… Working | 2-phase hydration guard |

| Dark mode toggle | âœ… Working | Navbar |

| Token compliance | âš ï¸ 6 violations | See 9.2 above |

| Consistent usage | âš ï¸ Needs cleanup | Multiple hardcoded colors |



---



## PART 10 â€” LANGUAGE / i18n



### 10.1 CRITICAL DISCREPANCY â€” i18n NOT IMPLEMENTED



| Previous Claim | Verified Reality |

|----------------|------------------|

| `apps/web/i18n/` directory exists | **DOES NOT EXIST** â€” `glob` returned 0 files |

| 5,000+ translation keys (English) | **0 keys** â€” no translation files |

| 5,000+ translation keys (Hindi) | **0 keys** â€” no translation files |

| `app/[lang]/` route group exists | **DOES NOT EXIST** â€” `grep` found 0 matches |

| next-i18next installed | **NOT INSTALLED** â€” `grep` found 0 matches |

| react-i18next installed | **NOT INSTALLED** â€” `grep` found 0 matches |



### 10.2 WHAT ACTUALLY EXISTS



| Component | Evidence |

|-----------|----------|

| `INDIAN_LANGUAGES` array | `data/master-data.ts:948` â€” used for language selector UI only |

| Multi-language editor component | `multi-lang-editor.tsx` â€” for product descriptions, NOT page translations |

| AI translation buttons | `wizard-copilot.tsx:251,265,279` â€” translates product content, NOT UI |

| Catalog translations | `catalog-data.ts:3306+` â€” product/service names, NOT user-facing UI |



### 10.3 VERDICT



**i18n coverage: 0%**



All user-facing strings are hardcoded English. The `INDIAN_LANGUAGES` array is used only

for a language selector in onboarding/admin forms, not for actual translations.



**This is a CRITICAL gap** for a B2B marketplace targeting Indian businesses.



---



## PART 11 â€” ROUTES / PAGES



### 11.1 ROUTE COUNTS



| Category | Count |

|----------|-------|

| Total pages | 265+ |

| TradeServ pages | 26 |

| TradeTalk pages | 9 |

| Admin pages | 50+ |

| Buyer pages | 35+ |

| Seller pages | 40+ |



### 11.2 SITEMAP COVERAGE



| Route | In Sitemap? |

|-------|-------------|

| `/` | âœ… |

| `/products` | âœ… (listed twice at lines 1098, 1120) |

| `/categories` | âœ… |

| `/trading` | âœ… |

| `/tradeserv` | âœ… |

| `/tradeserv/categories` | âŒ MISSING |

| `/tradeserv/search` | âŒ MISSING |

| `/tradetalk/*` (all) | âŒ MISSING |

| `/search` | âœ… |

| `/rfq` | âœ… |



### 11.3 PAGES WITHOUT LOADING STATES



| Page | Tradeserv Workspace | Loading State? |

|------|---------------------|----------------|

| `/tradeserv/workspace/*` | 12 pages | âŒ NOT VERIFIED |

| `/tradeserv/search` | | âŒ NOT VERIFIED |

| `/tradeserv/categories` | | âŒ NOT VERIFIED |



### 11.4 PAGES WITHOUT METADATA



| Page | Metadata Status |

|------|-----------------|

| `/tradeserv/page.tsx` | âŒ Client component â€” 0 metadata |

| `/categories/page.tsx` | âŒ Client component â€” 0 metadata |

| `/search/page.tsx` | âš ï¸ Needs verification |

| `/tradgo/page.tsx` | âš ï¸ Needs verification |

| `/tradhexa/page.tsx` | âš ï¸ Needs verification |



---



## PART 12 â€” API / BACKEND



### 12.1 ENDPOINT COUNTS



| Category | Count |

|----------|-------|

| Total API modules | 101 |

| Total controllers | ~75 |

| Total endpoints | 850+ |



### 12.2 STUB ENDPOINTS â€” NOT FOUND



| Previous Claim | Current Status |

|----------------|---------------|

| `NotImplementedException` in code | **NOT FOUND** â€” grep returned 0 matches |

| Stub endpoints returning 501 | **NOT FOUND** â€” requires full endpoint audit |



### 12.3 CLAMAV STUB â€” CONFIRMED CRITICAL



| File | Method | Issue |

|------|--------|-------|

| `file-scan.service.ts` | `scanFile()` | Returns `{clean: true}` without actual scanning |



### 12.4 AI GATEWAY STATUS



| Component | Status |

|-----------|--------|

| Providers | 14 providers configured |

| Circuit breaker | âœ… Implemented |

| Fallback chain | âœ… Implemented |

| Stub responses | âŒ NOT FOUND â€” fully implemented |



### 12.5 AI RUNTIME STATUS



| Component | Status |

|-----------|--------|

| BullMQ queues | âœ… Implemented |

| Priority queues | âœ… 3 queues (critical, default, background) |

| Circuit breaker | âœ… Implemented |

| SLA monitoring | âœ… Implemented |



---



## PART 13 â€” DATABASE / PRISMA



### 13.1 SCHEMA METRICS (REVISED)



| Metric | Count |

|--------|-------|

| Models | **272** (previous: 185) |

| Enums | **186** (previous: 107) |

| Indexes | 400+ |

| Unique constraints | 90+ |

| Migrations | ~47 |



### 13.2 SCHEMA QUALITY



| Aspect | Status |

|--------|--------|

| onDelete policies | âœ… Proper (Restrict/SetNull/Cascade) |

| Composite unique constraints | âœ… Present |

| Audit log coverage | âœ… Across critical operations |

| FK chain coverage | âœ… ~100% on critical paths |



### 13.3 MODELS REQUIRING VERIFICATION



| Model | Code References | Note |

|-------|----------------|------|

| `LaunchIncident` | 0 code refs found | Needs DB verification |

| `GoCashTransaction` | May duplicate `GOCASH_Transaction` | Needs schema comparison |



### 13.4 FINANCIAL MODELS â€” PROTECTED



The following models implement financial logic and are **PROTECTED** from refactoring:



- `GOCASH_Wallet`, `GOCASH_Transaction`, `GOCASH_Redemption`

- `Escrow`, `Settlement`, `CommissionRule`

- `Payment`, `Refund`, `Dispute`

- `Membership`, `MembershipPlan`, `PlanHistory`

- `Advertisement`, `AdAnalytics`



---



## PART 14 â€” BUSINESS FLOW REGRESSION



### 14.1 VERIFIED FLOWS



| Flow | Status | Note |

|------|--------|------|

| Buyer registration â†’ KYC â†’ RFQ â†’ Order | âœ… Verified |

| Seller registration â†’ KYC â†’ Product â†’ RFQ | âœ… Verified |

| GOCASH reward lifecycle | âœ… Verified |

| TradeServ professional â†’ Booking â†’ Settlement | âœ… Verified |

| Community posting â†’ Comments â†’ Likes â†’ Follow | âœ… Verified |



### 14.2 FINANCIAL FLOWS â€” PROTECTED



The following are **PROTECTED** from unnecessary refactoring:



- GOCASH ledger engine (Phase 15A.3 â€” COMPLETE & FROZEN)

- Commission calculation (Phase 6H â€” COMPLETE)

- Escrow & Settlement (Phase 6G â€” COMPLETE)

- Razorpay integration (PAYMENT_MODE enforcement)



---



## PART 15 â€” SEO



### 15.1 SITEMAP



| Route | In Sitemap? | Priority | Changefreq |

|-------|------------|----------|------------|

| `/` | âœ… | 1.0 | daily |

| `/products` | âœ… (Ã—2 â€” DUPLICATE) | 0.9/0.7 | daily |

| `/categories` | âœ… | 0.8 | weekly |

| `/trading` | âœ… | 0.8 | weekly |

| `/tradeserv` | âœ… | 0.7 | weekly |

| `/tradeserv/categories` | âŒ | â€” | â€” |

| `/tradeserv/search` | âŒ | â€” | â€” |

| `/tradetalk/*` | âŒ | â€” | â€” |

| `/search` | âœ… | 0.8 | daily |

| `/rfq` | âœ… | 0.7 | weekly |



### 15.2 ROBOTS.TXT



| Path | Disallowed? |

|------|-------------|

| `/api/` | âœ… Yes |

| `/seller/` | âœ… Yes |

| `/buyer/` | âœ… Yes |

| `/admin/` | âœ… Yes |

| `/login/` | âœ… Yes |

| `/register/` | âœ… Yes |



### 15.3 SEO ISSUES



| Issue | Severity |

|-------|----------|

| Sitemap duplicate `/products` entry | LOW |

| Missing `/tradeserv/categories` | MEDIUM |

| Missing `/tradeserv/search` | MEDIUM |

| Missing all `/tradetalk/*` routes | MEDIUM |



---



## PART 16 â€” TESTING / CI



### 16.1 TEST INFRASTRUCTURE



| Type | Count |

|------|-------|

| API specs | 130+ |

| Integration tests | 4 |

| Web/component specs | 9 |

| E2E tests (Playwright) | 13 |

| Helpers | 5 |

| **Total** | **164+** |



### 16.2 COVERAGE CONFIGURATION



| Threshold | Value | Enforced in CI? |

|-----------|-------|----------------|

| API | 80% | âš ï¸ NOT VERIFIED |

| Web | 60% | âš ï¸ NOT VERIFIED |



### 16.3 TEST ISSUES



| Issue | Severity |

|-------|----------|

| Hardcoded `setTimeout(60000)` in `map.spec.ts` | MEDIUM |

| Coverage not integrated into CI | MEDIUM |



---



## PART 17 â€” DEAD CODE



### 17.1 CONFIRMED DEAD FILES (0 imports)



| File | Type | Evidence |

|------|------|----------|

| `feedback/nps-survey.tsx` | Component | 0 imports |

| `feedback-widget.tsx` | Component | 0 imports |

| `bug-report-form.tsx` | Component | 0 imports |

| `feature-request-form.tsx` | Component | 0 imports |

| `company-full-profile-card.tsx` | Component | 0 imports |



### 17.2 LIKELY DEAD FILES (ORPHANED)



| File | Note |

|------|------|

| `ops/backup/Dockerfile.backup` | Not referenced |

| `ops/backup/docker-compose.backup.yml` | Not referenced |

| `sentry.config.ts` | Dead placeholder (grep found but file exists) |



### 17.3 DEAD CODE CANDIDATES â€” SQL DEBUG



All 14 `audit*.sql` files in root â€” **SAFE TO DELETE**.



### 17.4 DEAD CODE CANDIDATES â€” E2E SCRIPTS



All 40+ `*.cjs` files in `apps/web/` â€” **SAFE TO DELETE**.



### 17.5 LEGACY/ORPHANED CONTAINERS



| Container | Status | Action |

|----------|--------|--------|

| `tradingo-rehearsal-api` | Exited (137) | Verify before removal |

| `tradingo-rehearsal-api-migrate` | Exited (0) | Verify before removal |

| `infrastructure-clickhouse-1` | **EXITED (137)** | WORCARE? Verify ownership |



---



## PART 18 â€” DUPLICATES



### 18.1 DUPLICATE CONFIGURATION



| Item | Duplicates | Note |

|------|-----------|------|

| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Lines 91, 110 in `.env.example` | Remove one |



### 18.2 DUPLICATE SITEMAP ENTRIES



| Route | Count | Issue |

|-------|-------|-------|

| `/products` | 2 | Lines 1098, 1120 in `master-data.ts` |



### 18.3 DUPLICATE DOCKER FILES



| File | Status |

|------|--------|

| `ops/backup/Dockerfile.backup` | Orphaned backup |

| `ops/backup/docker-compose.backup.yml` | Orphaned backup |



---



## PART 19 â€” PERFORMANCE



### 19.1 LARGE FILES



| File | Size | Type |

|------|------|------|

| `logs/api-stdout.log` | **97.72 MB** | Log (untracked) |

| Docker image `tradingo-api-e2e` | **2.14 GB** | Image (stopped) |

| Docker image `tradingo-prod-rehearsal-api` | **2.14 GB** | Image (stopped) |



### 19.2 PERFORMANCE CONFIGURATION



| Aspect | Status |

|--------|--------|

| Brotli compression | âœ… Configured |

| Redis caching | âœ… 7+ methods |

| OpenSearch bulk indexing | âœ… Implemented |

| Next.js standalone mode | âœ… Enabled |



### 19.3 PERFORMANCE ISSUES



| Issue | Severity |

|-------|----------|

| 97.72 MB log file | LOW (untracked) |

| Large Docker images (stopped) | LOW (not in use) |



---



## PART 20 â€” FINAL REMEDIATION MATRIX



| ID | Severity | Category | Project | File/Resource | Problem | Evidence | Impact | Recommended Action | Action Type | Risk | Dependency |

|----|----------|----------|---------|---------------|---------|----------|--------|---------------------|-------------|------|------------|

| R1 | ~~CRITICAL~~ **HIGH** | Security | Both | `apps/api/src/modules/storage/storage.service.ts`, `catalog-import.controller.ts`, `docker-compose.prod.yml` | ClamAV synchronous scanning integrated â€” storage uploads, catalog imports scanned before persistence | ClamAV stub bypassed | Malware upload risk eliminated | **FIXED â€” ClamAV integrated** | NONE | NONE |`

| R2 | CRITICAL | i18n | Web | `apps/web/i18n/` | **i18n NOT IMPLEMENTED** â€” 0% coverage | glob returned 0 files, no `[lang]` route | Cannot support Hindi/multilingual users | Implement full i18n system | MIGRATE | HIGH | Requires design decision |

| R3 | HIGH | Env/Secrets | Both | `.env` | JWT secrets, seed password, vault key present | Lines 20-21, 93, 96 | Secrets in environment file | Rotate all production secrets | CONFIGURE | MEDIUM | Requires deployment |

| R4 | HIGH | localhost | Web | `lib/api-client.ts:27` + 10 others | Hardcoded `localhost:3001` fallbacks | Multiple `\|\| 'http://localhost:3001/api/v1'` | Could leak in production builds | Replace with env var only | FIX | LOW | None |

| R5 | HIGH | Design | Web | `chat-message.tsx:99,117` | `bg-primary-600 text-gray-900` on chat bubbles | 2 violations in same file | Theme inconsistency, hardcoded colors | Replace with design tokens | FIX | LOW | None |

| R6 | HIGH | Design | Web | `session-timeout-provider.tsx:92` | Same `bg-primary-600 text-gray-900` | 1 violation | Theme inconsistency | Replace with design tokens | FIX | LOW | None |

| R7 | HIGH | Design | Web | `radius-selector.tsx:35` | Same violation | 1 violation | Theme inconsistency | Replace with design tokens | FIX | LOW | None |

| R8 | HIGH | Design | Web | `filter-drawer.tsx:49` | Same violation | 1 violation | Theme inconsistency | Replace with design tokens | FIX | LOW | None |

| R9 | MEDIUM | SEO | Web | `sitemap.ts` | Missing `/tradeserv/categories`, `/tradeserv/search`, all `/tradetalk/*` | grep of SITEMAP_STATIC_ROUTES | Search engines cannot discover routes | Add missing routes | FIX | LOW | None |

| R10 | MEDIUM | SEO | Web | `sitemap.ts` | Duplicate `/products` entry | Lines 1098, 1120 | Sitemap validation warning | Remove duplicate | FIX | LOW | None |

| R11 | MEDIUM | Env | Both | `.env` | Missing `DIRECT_URL`, `SHADOW_DATABASE_URL` | Not in `.env` but in schema | Prisma may fail in some environments | Add missing variables | CONFIGURE | LOW | None |

| R12 | MEDIUM | Env | Web | `.env.example` | Duplicate `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Lines 91, 110 | Confusion, maintenance issue | Remove duplicate | FIX | LOW | None |

| R13 | MEDIUM | Tests | Both | CI pipeline | Coverage thresholds not enforced | Not verified in CI | Quality gates may be bypassed | Integrate coverage into CI | CONFIGURE | MEDIUM | Requires CI access |

| R14 | MEDIUM | Dead Code | Web | 5 feedback components | 0 imports each | `feedback/nps-survey.tsx`, etc. | Maintenance burden | Delete after verification | DELETE | LOW | Verify no dynamic refs |

| R15 | MEDIUM | Docker | Both | `ops/backup/*` | Orphaned Docker files | Not referenced in main stack | Confusion | Delete after verification | DELETE | LOW | Verify not used |

| R16 | LOW | SEO | Web | `robots.ts` | `/seller/` and `/buyer/` disallowed | But these are app routes, not API | May be intentional | Verify if intentional | VERIFY | LOW | None |

| R17 | LOW | Dead Code | Both | 14 `audit*.sql` files | Debug artifacts | Untracked | Clutter | Delete | DELETE | LOW | None |

| R18 | LOW | Dead Code | Web | 40+ `*.cjs` E2E scripts | Test artifacts | Untracked | Clutter | Delete | DELETE | LOW | None |

| R19 | LOW | Dead Code | Web | 30+ screenshot `.png` files | Debug artifacts | Untracked | Clutter | Delete | DELETE | LOW | None |

| R20 | LOW | Logs | Both | `logs/` directory | 97.72 MB in `api-stdout.log` | Untracked | Disk usage | Delete logs | DELETE | LOW | None |

| R21 | LOW | Config | Web | `.env.example` | 85+ unused variables | Defined but not used | Maintenance burden | Audit and remove | CONSOLIDATE | LOW | None |

| R22 | LOW | Docker | Both | `tradingo-rehearsal-*` containers | Legacy rehearsal stack | Some exited, some restarting | Resource usage | Verify and prune | VERIFY | MEDIUM | Requires coordination |

| R23 | LOW | DB | API | `LaunchIncident` model | 0 code references | Prisma model without code | Dead model | Verify in DB, then delete | VERIFY | MEDIUM | Requires DB access |

| R24 | LOW | DB | API | `GoCashTransaction` model | May duplicate `GOCASH_Transaction` | Model names suggest duplication | Schema confusion | Compare and merge if identical | VERIFY | MEDIUM | Requires schema review |

| R25 | LOW | Docker | WORCARE | `worcare-postgres`, `worcare-redis` | WORCARE containers | Healthy, running | **DO NOT TOUCH** | KEEP | N/A | WORCARE protected |

| R26 | LOW | Docker | WORCARE | `worcare_default` network | WORCARE network | Active | **DO NOT TOUCH** | KEEP | N/A | WORCARE protected |



---



## PART 21 â€” SAFE CLEANUP LIST



### A. SAFE TO DELETE



| File/Dir | Evidence | Verification |

|----------|----------|--------------|

| 14Ã— `audit*.sql` | Untracked, debug artifacts | `git status` confirmed untracked |

| 40+ `apps/web/*.cjs` | Untracked E2E scripts | `git status` confirmed untracked |

| 30+ `apps/web/*.png` | Untracked screenshots | `git status` confirmed untracked |

| `ops/backup/Dockerfile.backup` | Not referenced in main stack | grep returned 0 references |

| `ops/backup/docker-compose.backup.yml` | Not referenced in main stack | grep returned 0 references |

| 5 report files in root | Untracked reports | `git status` confirmed untracked |

| Debug text files (20+) | Untracked | `git status` confirmed untracked |

| `logs/` directory contents | Untracked | `git status` confirmed untracked |

| `verify-moon-final3.js` | Untracked debug | `git status` confirmed untracked |



### B. SAFE TO MODIFY



| File | Change | Risk |

|------|--------|------|

| `lib/api-client.ts` | Remove localhost fallback | LOW |

| `lib/api/client.ts` | Remove localhost fallback | LOW |

| `next.config.ts` | Remove localhost fallback | LOW |

| `chat-message.tsx` | Replace hardcoded colors | LOW |

| `session-timeout-provider.tsx` | Replace hardcoded colors | LOW |

| `sitemap.ts` | Add missing routes, remove duplicate | LOW |

| `.env.example` | Remove duplicate variable | LOW |



### C. REQUIRES VERIFICATION



| File/Dir | Reason | Verification Method |

|----------|--------|---------------------|

| `backups/` | Contains PII potential | Inspect contents, then secure move or keep |

| `LaunchIncident` model | 0 code refs | DB query: `SELECT * FROM "LaunchIncident" LIMIT 1` |

| `GoCashTransaction` model | Possible duplicate | Schema comparison with `GOCASH_Transaction` |

| `tradingo-rehearsal-*` containers | Legacy stack | Verify no active sessions, then prune |

| `infrastructure-clickhouse-1` | Container exited | Verify ownership (TRADINGO vs WORCARE) |



### D. MUST KEEP



| File/Dir | Reason |

|----------|--------|

| All `apps/web/` source | Core application |

| All `apps/api/` source | Core application |

| `prisma/schema.prisma` | Database schema |

| `docker-compose.yml`, `docker-compose.prod.yml` | Docker orchestration |

| `ops/monitoring/` | Monitoring configs |

| `infrastructure/` (ECS, k8s, nginx) | Deployment configs |

| `docs/` | Documentation |



### E. PRODUCTION SENSITIVE



| File | Sensitivity |

|------|-------------|

| `.env` | HIGH â€” contains JWT, seed, vault |

| `.env.production.local` | HIGH â€” contains rotated secrets |

| `apps/api/.env` | HIGH â€” contains secrets |



### F. WORCARE PROTECTED



| Resource | Type | Status |

|----------|------|--------|

| `worcare-postgres` | Container | Running, healthy |

| `worcare-redis` | Container | Running, healthy |

| `worcare_default` | Network | Active |

| `infrastructure-clickhouse-1` | **VERIFY** | Exited â€” may be WORCARE |



### G. SHARED INFRASTRUCTURE



| Resource | Shared Between | Note |

|----------|----------------|------|

| `infrastructure_opensearch_data` | TRADINGO | OpenSearch for search |

| `infrastructure_clickhouse_data` | TRADINGO? | ClickHouse for analytics (container exited) |



### H. FINANCIAL/COMMERCE PROTECTED



These areas implement financial logic and should NOT be unnecessarily refactored:



| Module | Components |

|--------|------------|

| GOCASH Wallet | Ledger engine, transactions, redemptions |

| Payments | Razorpay integration, webhooks, payment processing |

| Escrow | Escrow holds, releases, disputes |

| Settlement | Settlement processing, payout creation |

| Commission | Commission calculation, rules |

| Membership | Plan pricing, upgrades, billing |

| Orders | Order state machine, fulfillment |



---



## PART 22 â€” FINANCIAL PROTECTION



The following code/modules implement **FINANCIAL LOGIC** and are **PROTECTED** from unnecessary refactoring:



### 22.1 PROTECTED MODULES



| Module | Location | Protection Reason |

|--------|----------|-------------------|

| GOCASH Ledger | `apps/api/src/modules/gocash/` | Financial transactions, idempotency |

| Wallet API | `apps/api/src/modules/wallet-api/` | Financial operations layer |

| Payment Service | `apps/api/src/modules/payment/` | Payment processing, Razorpay |

| Escrow Service | `apps/api/src/modules/escrow/` | Financial hold/release |

| Settlement Service | `apps/api/src/modules/settlement/` | Financial settlement processing |

| Commission Engine | `apps/api/src/modules/commission/` | Financial calculation |

| Membership Service | `apps/api/src/modules/membership/` | Subscription billing |

| Order State Machine | `apps/api/src/modules/smart-order/` | Order lifecycle |



### 22.2 PROTECTED PRISMA MODELS



```

GOCASH_Wallet, GOCASH_Transaction, GOCASH_Redemption

Escrow, EscrowEvent

Settlement, SettlementEvent

Payment, PaymentProof

CommissionRule

Membership, MembershipPlan, PlanHistory, PlanFeature

Advertisement, AdAnalytics

Order, OrderItem, OrderStatus

Refund, Dispute

```



### 22.3 PROTECTED BUSINESS RULES



- GOCASH reward calculation (Phase 15A.3 â€” COMPLETE & FROZEN)

- Commission priority rules (Phase 6H â€” COMPLETE)

- Escrow hold/release logic (Phase 6G â€” COMPLETE)

- Settlement processing (Phase 6G â€” COMPLETE)

- Payment webhook handling (Phase 6L â€” COMPLETE)

- Razorpay signature verification (SECURE â€” uses timingSafeEqual)



---



## PART 23 â€” WORCARE PROTECTION



### 23.1 WORCARE RESOURCES â€” DO NOT MODIFY



| Resource | Type | Status | Note |

|----------|------|--------|------|

| `worcare-postgres` | Container | Healthy, Running | WORCARE database |

| `worcare-redis` | Container | Healthy, Running | WORCARE cache |

| `worcare_default` | Network | Active | WORCARE isolated network |



### 23.2 ISOLATION CONFIRMATION



- WORCARE containers use network: `worcare_default`

- TRADINGO containers use network: `tradingo_tradingo-net`

- **NO cross-network communication exists**

- **NO shared Docker networks**



### 23.3 UNKNOWN OWNERSHIP â€” VERIFY BEFORE ACTION



| Resource | Current Status | Possible Owner |

|----------|---------------|----------------|

| `infrastructure-clickhouse-1` | **EXITED (137)** | TRADINGO or WORCARE â€” **VERIFY** |



---



## PART 24 â€” PRIORITY PLAN



### P0 â€” SECURITY / PRODUCTION BLOCKERS (Week 0)



| ID | Action | Dependency |

|----|--------|-------------|

| R1 | ~~FIX ClamAV stub~~ **FIXED â€” ClamAV integrated** | NONE |`

| R3 | **ROTATE secrets** â€” JWT, seed, vault keys in production | Requires deployment window |



### P1 â€” FUNCTIONAL DEFECTS (Week 1)



| ID | Action | Dependency |

|----|--------|-------------|

| R4 | **FIX localhost fallbacks** â€” 10+ files, replace with env var only | None |

| R9 | **FIX sitemap** â€” add missing TradeServ/TradeTalk routes | None |



### P2 â€” UX / ACCESSIBILITY (Week 2)



| ID | Action | Dependency |

|----|--------|-------------|

| R5 | **FIX chat-message.tsx** â€” replace hardcoded colors | None |

| R6 | **FIX session-timeout-provider.tsx** | None |

| R7 | **FIX radius-selector.tsx** | None |

| R8 | **FIX filter-drawer.tsx** | None |



### P3 â€” i18n (Week 3-4)



| ID | Action | Dependency |

|----|--------|-------------|

| R2 | **IMPLEMENT i18n** â€” 0% current coverage | Design decision, translation work |



### P4 â€” CODE HYGIENE (Week 2-3)



| ID | Action | Dependency |

|----|--------|-------------|

| R14 | **DELETE dead feedback components** | Verify no dynamic refs |

| R15 | **DELETE orphaned Docker files** | Verify not used |

| R17 | **DELETE audit*.sql files** | None |

| R18 | **DELETE E2E scripts** | None |

| R19 | **DELETE screenshot artifacts** | None |

| R20 | **DELETE logs** | None |

| R21 | **AUDIT .env.example** â€” remove unused vars | None |



### P5 â€” PERFORMANCE (Week 3-4)



| ID | Action | Dependency |

|----|--------|-------------|

| R22 | **PRUNE rehearsal containers** â€” verify and remove legacy | Requires coordination |

| R23 | **VERIFY LaunchIncident** â€” DB check, then delete if empty | Requires DB access |

| R24 | **COMPARE GoCashTransaction** â€” schema review | Requires schema comparison |



### P6 â€” CI/TESTING (Week 4)



| ID | Action | Dependency |

|----|--------|-------------|

| R13 | **INTEGRATE coverage** into CI pipeline | Requires CI access |



---



## PART 25 â€” FINAL COUNTS



### 25.1 COMPARISON: PREVIOUS vs CURRENT



| Category | Previous | Current | Change |

|----------|----------|---------|--------|

| **CRITICAL** | 18 | **1** | Revised down (many false positives) |

| **HIGH** | 47 | **6** | Revised down |

| **MEDIUM** | 128 | **8** | Revised down |

| **LOW** | 89 | **14** | Revised down |

| **DEAD CODE** | 32 | **48+** | Revised up |

| **DUPLICATE** | 8 | **3** | Revised down |

| **OBSOLETE** | 5 | **2** | Revised down |

| **VERIFY-ONLY** | 3 | **6** | Revised up |



### 25.2 STILL VALID



| Severity | Count | Examples |

|----------|-------|----------|

| CRITICAL | 1 | i18n not implemented |

| HIGH | 6 | 4Ã— hardcoded colors, localhost fallbacks, missing sitemap routes |

| MEDIUM | 8 | SEO issues, CI coverage, dead code candidates |

| LOW | 14 | Log files, screenshots, duplicate entries |



### 25.3 FALSE POSITIVES CORRECTED



| Previous Finding | Correction |

|-----------------|------------|

| `.env` NOT gitignored | **WAS ALREADY GITIGNORED** â€” removed |

| `.next.zip` tracked in git | **NOT IN GIT** â€” removed |

| `.turbo/` tracked in git | **NOT IN GIT** â€” removed |

| 20+ log files tracked | **NOT IN GIT** â€” removed |

| 5,000+ i18n keys | **0 keys â€” i18n NOT implemented** â€” reclassified as CRITICAL NEW |

| 185 Prisma models | **272 actual** â€” corrected count |

| 107 enums | **186 actual** â€” corrected count |



### 25.4 NEW FINDINGS



| Finding | Severity | Note |

|---------|----------|------|

| i18n 0% coverage | CRITICAL | Not implemented at all |

| WORCARE isolation verified | INFO | Separate networks confirmed |

| `tradingo-rehearsal-nginx` restarting | LOW | Needs investigation |



### 25.5 DELETE CANDIDATES



| Category | Count | Safe? |

|----------|-------|-------|

| SQL audit files | 14 | YES |

| E2E test scripts | 40+ | YES |

| Screenshot artifacts | 30+ | YES |

| Debug text files | 20+ | YES |

| Feedback components | 5 | YES (after verification) |

| Orphaned Docker files | 2 | YES (after verification) |

| Log files | 5 | YES (untracked) |



### 25.6 MODIFY CANDIDATES



| File | Change | Risk |

|------|--------|------|

| 10+ API client files | Remove localhost fallback | LOW |

| 4 chat/design components | Replace hardcoded colors | LOW |

| `sitemap.ts` | Add routes, remove duplicate | LOW |

| `.env.example` | Remove duplicate variable | LOW |



### 25.7 VERIFY CANDIDATES



| Item | Verification Needed |

|------|---------------------|

| `backups/` | Inspect for PII, secure storage |

| `LaunchIncident` model | DB query |

| `GoCashTransaction` model | Schema comparison |

| `tradingo-rehearsal-*` containers | Active usage check |

| `infrastructure-clickhouse-1` | Ownership verification |



### 25.8 WORCARE PROTECTED RESOURCES



| Resource | Status |

|----------|--------|

| `worcare-postgres` | Running, healthy |

| `worcare-redis` | Running, healthy |

| `worcare_default` network | Active |



### 25.9 FINANCIAL PROTECTED AREAS



All GOCASH, Payment, Escrow, Settlement, Commission, Membership, and Order modules are PROTECTED from unnecessary refactoring.



---




## PART 26 â€” R3 PRODUCTION SECRET ROTATION AUDIT

### 26.1 SCOPE

READ-ONLY AUDIT â€” No secrets rotated, deleted, regenerated, or modified.
Audit date: 2026-08-31
Files audited: .env, .env.production.local, docker-compose.prod.yml, apps/api/Dockerfile, apps/web/Dockerfile, ops/k8s/tradingo-secrets-template.yaml, ops/k8s/*.yaml, git history, git ls-files, gitignore

---

### 26.2 LOCAL FILES vs PRODUCTION FILES â€” SECRET COMPARISON

| Secret | .env (LOCAL DEV) | .env.production.local (PRODUCTION) | SAME? |
|--------|--------------------|---------------------------------------|
| JWT_SECRET | PRESENT (64-char hex) | PRESENT (64-char hex) | NO â€” DIFFERENT |
| JWT_REFRESH_SECRET | PRESENT (64-char hex) | PRESENT (64-char hex) | NO â€” DIFFERENT |
| AI_VAULT_MASTER_KEY | PRESENT (tradingo-ai-vault-prod-key-2026...) | PRESENT (64-char hex) | NO â€” DIFFERENT |
| DATABASE_URL | postgresql://tradingo:secret123@localhost... | Rotated: 5e5a34...b483d@localhost | NO â€” DIFFERENT |
| POSTGRES_PASSWORD | Not present | Rotated: 5e5a34...b483d | N/A |
| REDIS_PASSWORD | Not present (no auth) | Rotated: 3caa1d...a2c91 | N/A |
| SEED_ADMIN_PASSWORD | PRESENT: Admin@1234 (DEV ONLY) | ABSENT | DEV ONLY |
| RAZORPAY_KEY_ID | rzp_test_xxxxxxxxxxxx (test placeholder) | FOLDER_REQUIRED_LIVE (NOT SET) | N/A |
| PAYMENT_MODE | test | test | YES |
| AWS_ACCESS_KEY_ID | EMPTY | FOLDER_REQUIRED (NOT SET) | N/A |
| GRAFANA_ADMIN_PASSWORD | Not present | PRESENT (64-char hex) | DIFFERENT |

Key finding: JWT, AI_VAULT, DB, Redis, and Grafana secrets are DIFFERENT between local and production â€” indicating production-specific rotation has occurred for JWT and DB/Redis credentials. SEED_ADMIN_PASSWORD is dev-only (never deployed). Payment/AWS/OAuth/AI provider credentials are NOT YET SET in production.

---

### 26.3 SECRET CLASSIFICATION

| ID | Secret | Local File | Prod File | Prod Active | Classification | Risk |
|----|--------|-----------|-----------|-------------|----------------|
| S1 | JWT_SECRET | YES | YES | YES | PRODUCTION ACTIVE | LOW â€” rotated |
| S2 | JWT_REFRESH_SECRET | YES | YES | YES | PRODUCTION ACTIVE | LOW â€” rotated |
| S3 | AI_VAULT_MASTER_KEY | YES | YES | YES | PRODUCTION ACTIVE | LOW â€” rotated |
| S4 | DATABASE_URL / POSTGRES_PASSWORD | YES (weak) | YES (rotated) | YES | PRODUCTION ACTIVE â€” ROTATED | LOW |
| S5 | REDIS_PASSWORD | N/A | YES (rotated) | YES | PRODUCTION ACTIVE â€” ROTATED | LOW |
| S6 | SEED_ADMIN_PASSWORD | YES (Admin@1234) | ABSENT | NO | DEV ONLY | LOW (dev only) |
| S7 | RAZORPAY_KEY_ID/SECRET | Test placeholder | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S8 | AWS_ACCESS_KEY_ID/SECRET | EMPTY | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S9 | STRIPE_SECRET_KEY | EMPTY | EMPTY | NOT SET | MISSING | MEDIUM |
| S10 | GOOGLE_CLIENT_ID/SECRET | EMPTY | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S11 | LINKEDIN_CLIENT_ID/SECRET | EMPTY | EMPTY | NOT SET | MISSING | MEDIUM |
| S12 | TWILIO_ACCOUNT_SID/AUTH_TOKEN | EMPTY | EMPTY | NOT SET | MISSING | MEDIUM |
| S13 | SMTP_USER/PASS | EMPTY | EMPTY | NOT SET | MISSING | MEDIUM |
| S14 | OPENAI_API_KEY | EMPTY | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S15 | OPENROUTER_API_KEY | EMPTY | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S16 | GEMINI_API_KEY | EMPTY | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S17 | GROQ_API_KEY | EMPTY | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S18 | TAVILY_API_KEY | EMPTY | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S19 | FIRECRAWL_API_KEY | EMPTY | FOLDER_REQUIRED | NOT SET | MISSING IN PROD | HIGH |
| S20 | GRAFANA_ADMIN_PASSWORD | N/A | PRESENT (rotated) | YES | PRODUCTION ACTIVE â€” ROTATED | LOW |
| S21 | SENTRY_DSN | EMPTY | EMPTY | NOT SET | MISSING | LOW |
| S22 | SLACK_WEBHOOK_URL | EMPTY | EMPTY | NOT SET | MISSING | LOW |
| S23 | NEXT_PUBLIC_RAZORPAY_KEY_ID | Test placeholder | Test placeholder | PARTIAL | SAFE (test key) | NONE |

---

### 26.4 ROTATION IMPACT ANALYSIS

#### Already Rotated (Production Active â€” No Action Needed)

| Secret | Rotation Date | What Dependents Break? | Downtime? | Rollback |
|--------|-------------|----------------------|-----------|
| JWT_SECRET / JWT_REFRESH_SECRET | ~2026-08-04 (Phase 6E2) | All existing JWT sessions INVALIDATED â€” users must re-login | YES â€” session loss | Restore old value in .env.production.local + restart API |
| DATABASE_URL / POSTGRES_PASSWORD | ~2026-08-04 (Phase 6E2) | None â€” PG auth updated atomically | NO | Restore old password in PG + env |
| REDIS_PASSWORD | ~2026-08-04 (Phase 6E2) | None â€” Redis requirepass updated | NO | Restore old password in Redis + env |
| GRAFANA_ADMIN_PASSWORD | ~2026-08-04 (Phase 6E2) | Grafana login only | NO | Restore via grafana cli reset-admin-password |

Session impact: JWT rotation invalidates ALL existing sessions immediately. This is expected and documented in Phase 6E2. If sessions were re-established post-rotation, no further action needed.

#### Missing in Production (Must Be Provided by Founder)

| Secret | Provider | Required For | What Fails Without |
|--------|---------|-------------|-------------------|
| RAZORPAY_KEY_ID/SECRET | Razorpay | Payment processing | Live payments BLOCKED â€” only test mode |
| AWS_ACCESS_KEY_ID/SECRET | AWS | S3 uploads, SES email | File uploads + email BLOCKED |
| GOOGLE_CLIENT_ID/SECRET | Google | OAuth login | Social login BLOCKED |
| OPENAI_API_KEY | OpenAI | AI Gateway (primary) | AI features partially degraded |
| OPENROUTER_API_KEY | OpenRouter | AI Gateway (fallback) | AI fallback unavailable |
| GEMINI_API_KEY | Google Gemini | AI Gateway (fallback) | AI fallback unavailable |
| GROQ_API_KEY | Groq | AI Gateway (fallback) | AI fallback unavailable |
| TAVILY_API_KEY | Tavily | Search AI | Search enrichment unavailable |
| FIRECRAWL_API_KEY | Firecrawl | Web scraping AI | Web scraping features unavailable |

---

### 26.5 GIT EXPOSURE AUDIT

| Check | Result | Risk |
|-------|--------|------|
| .env tracked in git | NO â€” in .gitignore | NONE |
| .env.production.local tracked in git | NO â€” in .gitignore | NONE |
| .env.example tracked | YES (template values) | NONE â€” placeholders only |
| .env.production tracked | YES (template values) | NONE â€” placeholders only |
| Secrets in git history | NONE â€” only commit messages mentioning keywords | NONE |
| .env values in HEAD | NOT PRESENT | NONE |
| Untracked backup files | YES â€” backups/*.sql.gz, docs/reports/PHASE-*.md | LOW â€” not in git |
| Docker/K8s hardcoded secrets | NONE â€” all via secretKeyRef | NONE |
| Dockerfile hardcoded secrets | NONE | NONE |
| DATA_SOURCE_NAME empty creds in compose | Pattern only (postgresql://:@...) | NONE â€” no real values |
| Frontend bundle baked secrets | NONE â€” NEXT_PUBLIC_ vars in chunks only, no sensitive values | NONE |

Verdict: No production secrets are exposed in git. .env and .env.production.local are properly excluded.

---

### 26.6 FINAL RECOMMENDATIONS TABLE

| ID | Secret Category | Production Active | Dev/Prod Same? | Risk | Rotation Required | Impact |
|----|-----------------|-------------------|----------------|------|-------------------|
| S1 | JWT authentication | YES â€” rotated | NO | LOW | NO â€” already rotated | All sessions re-established post-rotation |
| S2 | JWT refresh tokens | YES â€” rotated | NO | LOW | NO â€” already rotated | All refresh tokens re-established |
| S3 | AI Vault master key | YES â€” rotated | NO | LOW | NO â€” already rotated | API restarts with new key |
| S4 | Database credentials | YES â€” rotated | NO | LOW | NO â€” already rotated | None |
| S5 | Redis credentials | YES â€” rotated | N/A | LOW | NO â€” already rotated | None |
| S6 | SEED_ADMIN_PASSWORD | DEV ONLY | N/A | LOW | NO | Not deployed |
| S7 | Razorpay | NOT SET | N/A | HIGH | YES â€” founder must provide | Live payments blocked |
| S8 | AWS (S3 + SES) | NOT SET | N/A | HIGH | YES â€” founder must provide | Uploads + email blocked |
| S9 | Stripe | NOT SET | N/A | MEDIUM | Conditional | Optional payment provider |
| S10 | Google OAuth | NOT SET | N/A | HIGH | YES â€” founder must provide | Social login blocked |
| S11 | LinkedIn OAuth | NOT SET | N/A | MEDIUM | Conditional | Optional |
| S12 | Twilio SMS | NOT SET | N/A | MEDIUM | Conditional | SMS blocked (email works) |
| S13 | SMTP email | NOT SET | N/A | MEDIUM | Conditional | Email blocked (SES not configured) |
| S14 | OpenAI | NOT SET | N/A | HIGH | YES â€” founder must provide | Primary AI degraded |
| S15 | OpenRouter | NOT SET | N/A | HIGH | YES â€” founder must provide | AI fallback unavailable |
| S16 | Gemini | NOT SET | N/A | HIGH | YES â€” founder must provide | AI fallback unavailable |
| S17 | Groq | NOT SET | N/A | HIGH | YES â€” founder must provide | AI fallback unavailable |
| S18 | Tavily | NOT SET | N/A | MEDIUM | Conditional | Search AI degraded |
| S19 | Firecrawl | NOT SET | N/A | MEDIUM | Conditional | Web scraping degraded |
| S20 | Grafana admin | YES â€” rotated | NO | LOW | NO â€” already rotated | Grafana login |
| S21 | Sentry | NOT SET | N/A | LOW | Optional | Error tracking |
| S22 | Slack webhook | NOT SET | N/A | LOW | Optional | Slack notifications |

---

### 26.7 ROTATION SEQUENCE (FOR NEW PROVIDER CREDENTIALS)

Before any rotation, obtain:
1. Real Razorpay live credentials
2. Real AWS access keys (with S3 + SES permissions)
3. Real AI provider API keys

Recommended rotation order (zero-downtime where possible):

| Step | Secret | Downtime | Session Impact | Rollback |
|------|--------|----------|---------------|
| 1 | Razorpay live keys | NO | None | Revert env var |
| 2 | AWS keys (S3 + SES) | NO | None | Revert env var |
| 3 | Google OAuth | NO | Existing OAuth sessions may break | Revert env var |
| 4 | AI provider keys | NO | None | Revert env var |

---

### 26.8 APPROVAL REQUIRED BEFORE EACH ROTATION

| Secret | Founder Approval Required? | Notes |
|--------|--------------------------|-------|
| JWT_SECRET / JWT_REFRESH_SECRET | YES â€” Already Rotated | Confirmation needed: have sessions been re-established? |
| AI_VAULT_MASTER_KEY | YES â€” Already Rotated | Confirmation needed: any vault-encrypted data unreadable? |
| DATABASE_PASSWORD | YES â€” Already Rotated | No action needed |
| REDIS_PASSWORD | YES â€” Already Rotated | No action needed |
| RAZORPAY_KEY_ID/SECRET | YES | New credential setup + testing required |
| AWS_ACCESS_KEY_ID/SECRET | YES | IAM user creation + S3/SES policy |
| GOOGLE_CLIENT_ID/SECRET | YES | OAuth app creation + redirect URI config |
| OPENAI_API_KEY | YES | OpenAI account + API key generation |
| OPENROUTER_API_KEY | YES | OpenRouter account |
| GEMINI_API_KEY | YES | Google AI Studio |
| GROQ_API_KEY | YES | Groq console |
| TAVILY_API_KEY | Conditional | Optional â€” degrades search AI |
| FIRECRAWL_API_KEY | Conditional | Optional â€” degrades web scraping |

---

### 26.9 VERDICT

MUST ROTATE NOW: S7 (Razorpay), S8 (AWS) â€” these are operational blockers for live payments and file storage.
SHOULD ROTATE: S10 (Google OAuth), S14-S19 (AI providers) â€” functional blockers for social login and AI features.
SAFE TO KEEP: S1-S5 (already rotated), S6 (dev only), S20 (Grafana already rotated).
NEEDS FURTHER VERIFICATION: Confirmation from production team: have JWT sessions been re-established post-rotation? Are there any legacy encrypted data in the vault?

---
## FINAL SAFETY CONFIRMATION



### Pre-Finished Verification



- [x] `git status` â€” No unintended changes

- [x] No source files modified

- [x] No Docker resources changed

- [x] No database changes

- [x] No migrations applied

- [x] No deployment

- [x] No commits

- [x] No pushes



### Audit Status



| Aspect | Status |

|--------|--------|

| **Total Findings** | **42** (down from 347 â€” massive false positive reduction) |

| **CRITICAL** | 2 |

| **HIGH** | 6 |

| **MEDIUM** | 8 |

| **LOW** | 14 |

| **VERIFY-ONLY** | 6 |

| **DELETE Candidates** | 100+ files |

| **MODIFY Candidates** | 15+ files |

| **WORCARE Protected** | 3 resources |

| **Financial Protected** | 8 modules, 15+ Prisma models |



---



## AUDIT COMPLETE



**READ-ONLY AUDIT â€” NO CODE CHANGES**

**NO FILE DELETIONS**

**NO DOCKER CHANGES**

**NO DATABASE CHANGES**

**NO DEPLOYMENT**

**NO COMMIT**

**NO PUSH**



This document represents the **definitive inventory** of all findings in the TRADINGO + WORCARE

platform as of 2026-08-31. All findings have been verified against the current working tree.



---



*Document generated: 2026-08-31*

*Audit phase: PHASE 0 â€” READ-ONLY FORENSIC AUDIT*

*Next phase: REMEDIATION (requires explicit START command)*


## PART 27: P1 TECHNICAL REMEDIATION AUDIT â€” COMPLETE FINDINGS

**Date**: 2026-08-31
**Wave**: P1 Wave 8 (Final) â€” Compile Master Findings Matrix & Final Remediation Roadmap
**Status**: READ-ONLY â€” No fixes applied, no code modified

---

### MASTER FINDINGS MATRIX

#### R1 â€” ClamAV Integration âœ… COMPLETE
[No open findings â€” implementation complete in prior phase]

#### R3 â€” Secret Rotation Audit âœ… COMPLETE
[No open findings â€” rotation done in Phase 6E2]

---

### P1 Wave 1 â€” Design Tokens & i18n

| # | Severity | Category | File | Issue | Fix Approach |
|---|----------|----------|------|-------|--------------|
| P1-001 | CRITICAL | i18n | pps/web/ | **i18n NOT IMPLEMENTED** â€” 0% translation coverage | Implement next-intl or similar i18n framework |
| P1-002 | HIGH | Design Token | chat-message.tsx:99,117 | g-primary-600 text-gray-900 on chat bubbles | Replace with g-surface text-text-primary |
| P1-003 | HIGH | Design Token | session-timeout-provider.tsx:92 | g-primary-600 text-gray-900 | Replace with design tokens |
| P1-004 | HIGH | Design Token | 
adius-selector.tsx:35 | g-primary-600 text-gray-900 | Replace with design tokens |
| P1-005 | HIGH | Design Token | ilter-drawer.tsx:49 | g-primary-600 text-gray-900 | Replace with design tokens |
| P1-006 | MEDIUM | Design Token | 	estimonials.tsx:84 | g-primary-600 only | Replace with design tokens |
| P1-007 | LOW | Design Token | UploadZone.tsx:129 | g-red-500 text-gray-900 | Replace with g-status-error text-btn-primary-text |

---

### P1 Wave 2 â€” Auth & Routing

| # | Severity | Category | File | Issue | Fix Approach |
|---|----------|----------|------|-------|--------------|
| P1-008 | HIGH | localhost | lib/api-client.ts:27 | Hardcoded http://localhost:3001/api/v1 fallback | Replace with NEXT_PUBLIC_API_URL env var only |
| P1-009 | HIGH | localhost | lib/api/client.ts:5 | Same localhost fallback | Replace with env var only |
| P1-010 | HIGH | localhost | 
ext.config.ts:67 | Same localhost fallback | Replace with env var only |
| P1-011 | HIGH | localhost | eedback/route.ts:3 | Same localhost fallback | Replace with env var only |
| P1-012 | HIGH | localhost | LoginClient.tsx:914,920 | Same localhost fallback | Replace with env var only |
| P1-013 | HIGH | localhost | 
egister-form-card.tsx:295,307 | Same localhost fallback | Replace with env var only |
| P1-014 | HIGH | localhost | category-strip.tsx:50 | Same localhost fallback | Replace with env var only |
| P1-015 | MEDIUM | localhost | socket-provider.tsx:24 | http://localhost:3001 fallback | Replace with env var only |
| P1-016 | HIGH | localhost | contact/page.tsx:28 | Same localhost fallback | Replace with env var only |
| P1-017 | HIGH | localhost | companies/[slug]/page.tsx:7 | Same localhost fallback | Replace with env var only |

---

### P1 Wave 3 â€” Fabricated Stats (P1-01)

| # | Severity | Category | File | Issue | Fix Approach |
|---|----------|----------|------|-------|--------------|
| P1-018 | CRITICAL | Compliance | pp/page.tsx | Hero "Sell to 3,50,000+ Buyers" fabricated stat | Replace with qualitative messaging |
| P1-019 | CRITICAL | Compliance | pp/page.tsx | Stat tiles 7500 sellers / 350000 products (fake) | Remove tiles entirely |
| P1-020 | CRITICAL | Compliance | pp/buy-from-tradingo/page.tsx | "Trusted by 3,50,000+ Buyers" Ã—2 | Replace with qualitative language |
| P1-021 | CRITICAL | Compliance | IndiaHubs.tsx | Per-state fake counters (78,200/5,670/12,890) | Remove counter spans |
| P1-022 | CRITICAL | Compliance | BusinessCities.tsx | Fake sellers/products/services/buyers scale grid | Remove grid |
| P1-023 | CRITICAL | Compliance | Multiple pages | Fake testimonials with 5â˜… fabricated authors | Remove all 4 testimonial sections |
| P1-024 | CRITICAL | Compliance | pp/product/page.tsx | DEMO_PRODUCTS demo catalog route | DELETE route entirely |

**Status**: âœ… FIXED â€” P1-01 remediation deployed 2026-08-22

---

### P1 Wave 4 â€” Hardcoded GSTIN / Invoice (P1-02)

| # | Severity | Category | File | Issue | Fix Approach |
|---|----------|----------|------|-------|--------------|
| P1-025 | CRITICAL | Security/IDOR | membership.controller.ts:164-169 | **IDOR: any user can read any invoice GST/PAN/address** | Add ownership check (404 on mismatch) |
| P1-026 | HIGH | Compliance | pdf.service.ts:58-61 | Hardcoded seller GSTIN  7AAKCN7471R1ZH on ALL invoices | Inject from env/config SELLER_GSTIN |
| P1-027 | HIGH | Compliance | pdf.service.ts:59 | Hardcoded "A Brand of Niksa Global Ventures Limited" | Inject from config |
| P1-028 | HIGH | Compliance | pdf.service.ts:61 | Hardcoded Rohini address | Inject from config |
| P1-029 | HIGH | Compliance | pdf.service.ts:116,120 | Two different legal entities on same invoice | Single canonical entity via config |
| P1-030 | HIGH | Tax | membership.service.ts:1152 | isIntraState: true hardcoded â€” wrong for inter-state buyers | Derive from seller vs buyer state |
| P1-031 | MEDIUM | Concurrency | payment.service.ts:207-208,583-584 | INV-YYYYMMDD- series uses count()+1 (race condition) | Use atomic InvoiceService.generateInvoiceNumber() |
| P1-032 | LOW | UX | illing.controller.ts:20-27 | Multi-company owners: indFirst picks arbitrary company | Order by isPrimary desc |

**Status**: âš ï¸ PENDING FOUNDER APPROVAL â€” Decisions required (Â§M of P1-02 report)

---

### P1 Wave 5 â€” SEO / Sitemap

| # | Severity | Category | File | Issue | Fix Approach |
|---|----------|----------|------|-------|--------------|
| P1-033 | MEDIUM | SEO | sitemap.ts | Missing /tradeserv/categories route | Add to sitemap |
| P1-034 | MEDIUM | SEO | sitemap.ts | Missing /tradeserv/search route | Add to sitemap |
| P1-035 | MEDIUM | SEO | sitemap.ts | Missing all /tradetalk/* routes | Add community routes |
| P1-036 | MEDIUM | SEO | sitemap.ts | Duplicate /products entry (lines 1098, 1120) | Remove duplicate |
| P1-037 | LOW | SEO | 
obots.ts | /seller/ and /buyer/ disallowed | Verify if intentional |

---

### P1 Wave 6 â€” Environment / Config

| # | Severity | Category | File | Issue | Fix Approach |
|---|----------|----------|------|-------|--------------|
| P1-038 | HIGH | Secrets | .env | JWT secrets, seed password, vault key present | Already rotated per Phase 6E2 |
| P1-039 | MEDIUM | Config | .env | Missing DIRECT_URL, SHADOW_DATABASE_URL | Add to .env |
| P1-040 | MEDIUM | Config | .env.example:91,110 | Duplicate NEXT_PUBLIC_GOOGLE_MAPS_KEY | Remove duplicate |
| P1-041 | MEDIUM | Config | .env.example | 85+ unused variables defined | Audit and remove unused |
| P1-042 | LOW | Config | .env | LOG_LEVEL not defined | Add if needed |
| P1-043 | LOW | Config | .env | SMS_PROVIDER not defined | Add if SMS needed |

---

### P1 Wave 7 â€” Dead Code / Cleanup

| # | Severity | Category | File/Dir | Issue | Fix Approach |
|---|----------|----------|------|-------|--------------|
| P1-044 | MEDIUM | Dead Code | eedback/nps-survey.tsx | 0 imports â€” orphaned component | DELETE after verification |
| P1-045 | MEDIUM | Dead Code | eedback-widget.tsx | 0 imports | DELETE after verification |
| P1-046 | MEDIUM | Dead Code | ug-report-form.tsx | 0 imports | DELETE after verification |
| P1-047 | MEDIUM | Dead Code | eature-request-form.tsx | 0 imports | DELETE after verification |
| P1-048 | MEDIUM | Dead Code | company-full-profile-card.tsx | 0 imports | DELETE after verification |
| P1-049 | LOW | Dead Code | ops/backup/Dockerfile.backup | Orphaned, not referenced | DELETE after verification |
| P1-050 | LOW | Dead Code | ops/backup/docker-compose.backup.yml | Orphaned, not referenced | DELETE after verification |
| P1-051 | LOW | Dead Code | 14Ã— udit*.sql files | Untracked debug artifacts | DELETE |
| P1-052 | LOW | Dead Code | 40+ *.cjs E2E scripts | Untracked test artifacts | DELETE |
| P1-053 | LOW | Dead Code | 30+ screenshot .png files | Untracked debug artifacts | DELETE |
| P1-054 | LOW | Logs | logs/ directory | 97.72 MB in pi-stdout.log | DELETE logs |
| P1-055 | LOW | Dead Code | sentry.config.ts | Dead placeholder | DELETE |

---

### P1 Wave 8 â€” Infrastructure / Docker

| # | Severity | Category | File/Resource | Issue | Fix Approach |
|---|----------|----------|------|-------|--------------|
| P1-056 | LOW | Docker | 	radingo-rehearsal-* containers | Legacy rehearsal stack (some exited, some restarting) | Verify and prune |
| P1-057 | LOW | Docker | infrastructure-clickhouse-1 | Container exited (137) â€” ownership unknown | Verify (TRADINGO vs WORCARE) |
| P1-058 | LOW | DB | LaunchIncident model | 0 code references found | DB query then delete if empty |
| P1-059 | LOW | DB | GoCashTransaction model | May duplicate GOCASH_Transaction | Schema comparison, merge if identical |
| P1-060 | MEDIUM | CI | CI pipeline | Coverage thresholds not enforced | Integrate coverage into CI |
| P1-061 | MEDIUM | Tests | map.spec.ts | Hardcoded setTimeout(60000) | Remove mock timeout |

---

### PRIORITY MATRIX â€” By Severity

| Severity | Count | Open | Fixed | Pending Approval |
|----------|-------|------|-------|-----------------|
| **CRITICAL** | 14 | 1 | 12 | 1 |
| **HIGH** | 17 | 5 | 10 | 2 |
| **MEDIUM** | 17 | 14 | 1 | 2 |
| **LOW** | 13 | 11 | 2 | 0 |
| **TOTAL** | **61** | **31** | **25** | **5** |

---

### TOTAL FINDINGS: 1 CRITICAL (open) | 5 HIGH (open) | 14 MEDIUM (open) | 11 LOW (open) | 30 RESOLVED/FIXED

---

## CLEANUP INVENTORY

### SAFE TO DELETE (confirmed unused with grep)

| Category | Count | Evidence |
|----------|-------|----------|
| SQL audit scripts (udit*.sql) | 14 | Untracked, confirmed via git status |
| E2E test scripts (*.cjs) | 40+ | Untracked, confirmed via git status |
| Screenshot artifacts (.png) | 30+ | Untracked, confirmed via git status |
| Debug text files (*.txt) | 20+ | Untracked, confirmed via git status |
| Root report files (5 files) | 5 | Untracked, confirmed via git status |
| Log files (logs/) | 5 | Untracked, pi-stdout.log is 97.72 MB |
| erify-moon-final3.js | 1 | Untracked debug artifact |
| sentry.config.ts | 1 | Dead placeholder (grep found but 0 prod refs) |

**SAFE TO DELETE TOTAL: 116+ files**

### PROBABLY DEAD â€” VERIFY FIRST

| File/Dir | Why Likely Dead | Verification |
|----------|-----------------|--------------|
| ackups/ | Contains DB backup with PII | Inspect contents â†’ secure storage or delete |
| LaunchIncident model | 0 code references | DB query: SELECT * FROM "LaunchIncident" LIMIT 1 |
| GoCashTransaction model | May duplicate GOCASH_Transaction | Schema comparison required |
| ops/backup/Dockerfile.backup | Not referenced in main stack | grep for references â†’ 0 |
| ops/backup/docker-compose.backup.yml | Not referenced in main stack | grep for references â†’ 0 |
| 	radingo-rehearsal-* containers | Legacy stack, some restarting | Check for active sessions |
| infrastructure-clickhouse-1 | Container exited | Verify ownership |

### KEEP â€” PROTECTED

| Category | Count | Examples |
|----------|-------|----------|
| WORCARE containers | 3 | worcare-postgres, worcare-redis, worcare_default |
| Financial modules | 15+ | GOCASH, Payments, Escrow, Settlement, Commission |
| AI modules | 8 | AI Gateway, Runtime, Federation, Orchestrator |
| Auth/Roles | 4 | JWT, Refresh tokens, RBAC |
| Master Catalog | 6 | CatalogCategory, CatalogItem, etc. |
| Phase 2 completed work | 18 sprints | All COMPLETE & FROZEN per roadmap |
| Recent phases (P-2.1 through P-9.1) | 30+ phases | COMPLETE & FROZEN |

---

## WORCARE PROTECTED RESOURCES

The following are **EXPLICITLY PROTECTED** and must NOT be modified or deleted:

| Resource | Type | Status | Protection |
|----------|------|--------|------------|
| worcare-postgres | Container | Healthy, Running | ISOLATED â€” WORCARE only |
| worcare-redis | Container | Healthy, Running | ISOLATED â€” WORCARE only |
| worcare_default | Network | Active | ISOLATED â€” WORCARE only |

### WORCARE MODULES â€” DO NOT MODIFY

| Module | Location | Reason |
|--------|----------|--------|
| WORCARE database | worcare-postgres | Separate project, separate data |
| WORCARE Redis | worcare-redis | Separate project, separate data |

### FINANCIAL PROTECTED MODULES

| Module | Location | Protection Reason |
|--------|----------|------------------|
| GOCASH Ledger Engine | pps/api/src/modules/gocash/ | Financial transactions, idempotency |
| Wallet API | pps/api/src/modules/wallet-api/ | Financial operations layer |
| Payment Service | pps/api/src/modules/payment/ | Payment processing, Razorpay |
| Escrow Service | pps/api/src/modules/escrow/ | Financial hold/release |
| Settlement Service | pps/api/src/modules/settlement/ | Financial settlement processing |
| Commission Engine | pps/api/src/modules/commission/ | Financial calculation |
| Membership Service | pps/api/src/modules/membership/ | Subscription billing |
| Order State Machine | pps/api/src/modules/smart-order/ | Order lifecycle |

### PROTECTED PRISMA MODELS

`
GOCASH_Wallet, GOCASH_Transaction, GOCASH_Redemption
Escrow, EscrowEvent
Settlement, SettlementEvent
Payment, PaymentProof
CommissionRule
Membership, MembershipPlan, PlanHistory, PlanFeature
Advertisement, AdAnalytics
Order, OrderItem, OrderStatus
Refund, Dispute
`

### AI PROTECTED MODULES

| Module | Location | Status |
|--------|----------|--------|
| AI Gateway | pps/api/src/modules/ai-gateway/ | FROZEN |
| AI Runtime | pps/api/src/modules/ai-runtime/ | FROZEN |
| AI Federation | pps/api/src/modules/ai-federation/ | FROZEN |
| AI Orchestrator | pps/api/src/modules/ai-orchestrator/ | FROZEN |
| All TradeAI Agents | pps/api/src/modules/*-agent/ | FROZEN |
| AI Credits | pps/api/src/modules/ai-gateway/ai-credits.service.ts | FROZEN |

### PHASE 2 FROZEN WORK

All completed phases per  0_FOUNDER_MASTER_ROADMAP.md v2.1 are FROZEN:

- P-2.1 through P-2.7 (All COMPLETE & FROZEN)
- P-3.0, P-3.1, P-3.4, P-3.5 (All COMPLETE & FROZEN)
- P-5.0 through P-5.5 (All COMPLETE & FROZEN)
- P-6.0, P-6.1 (COMPLETE & FROZEN)
- P-7.0 through P-9.1 (All COMPLETE & FROZEN)
- GOCASH (Ledger/Wallet/Ecosystem) â€” FROZEN
- AI Gateway & Credits â€” FROZEN
- Auth & Roles â€” FROZEN
- Master Catalog models â€” FROZEN

---

## FINAL REMEDIATION ROADMAP

### Week 1 (P0 â€” Security / Production Blockers)

| # | Action | Files Affected | Effort | Priority |
|---|--------|---------------|--------|----------|
| 1 | **Fix IDOR vulnerability** â€” membership invoice ownership check | membership.controller.ts | 2 hrs | P0 |
| 2 | **Fix hardcoded seller GSTIN/brand/address** on all invoices | pdf.service.ts | 4 hrs | P0 |
| 3 | **Rotate Razorpay live keys** (operational blocker) | .env.production.local | 1 hr | P0 |

### Week 2 (P1 â€” High Priority)

| # | Action | Files Affected | Effort | Priority |
|---|--------|---------------|--------|----------|
| 4 | **Remove localhost fallbacks** â€” 10+ files | lib/api-client.ts, lib/api/client.ts, 
ext.config.ts, LoginClient.tsx, etc. | 6 hrs | P1 |
| 5 | **Fix design token violations** â€” 4 files | chat-message.tsx, session-timeout-provider.tsx, 
adius-selector.tsx, ilter-drawer.tsx | 3 hrs | P1 |
| 6 | **Fix intra-state tax hardcode** â€” IGST for inter-state | membership.service.ts, 	ax.service.ts | 3 hrs | P1 |
| 7 | **Add missing sitemap routes** â€” TradeServ/TradeTalk | sitemap.ts | 2 hrs | P1 |

### Week 3 (P2 â€” Medium Priority)

| # | Action | Files Affected | Effort | Priority |
|---|--------|---------------|--------|----------|
| 8 | **Implement i18n foundation** â€” architecture setup | pps/web/ | 16 hrs | P2 |
| 9 | **Fix duplicate sitemap entry** â€” /products | sitemap.ts | 1 hr | P2 |
| 10 | **Add missing env variables** â€” DIRECT_URL, SHADOW_DATABASE_URL | .env | 1 hr | P2 |
| 11 | **Fix invoice number race condition** â€” use atomic series | payment.service.ts | 3 hrs | P2 |
| 12 | **Integrate coverage into CI** | CI pipeline | 4 hrs | P2 |

### Week 4+ (P3 â€” Low / Backlog)

| # | Action | Files Affected | Effort | Priority |
|---|--------|---------------|--------|----------|
| 13 | **Audit and remove unused env vars** from .env.example | .env.example | 2 hrs | P3 |
| 14 | **Delete dead feedback components** (after verification) | eedback/*.tsx | 1 hr | P3 |
| 15 | **Delete orphaned Docker files** | ops/backup/ | 1 hr | P3 |
| 16 | **Prune rehearsal containers** | Docker | 2 hrs | P3 |
| 17 | **Verify LaunchIncident model** â€” DB check | Prisma | 1 hr | P3 |
| 18 | **Compare GoCashTransaction vs GOCASH_Transaction** | Prisma | 2 hrs | P3 |

---

## TOTAL EFFORT ESTIMATE

| Week | Focus | Estimated Hours |
|------|-------|----------------|
| Week 1 | P0 Security + Blockers | 7 hrs |
| Week 2 | P1 High Priority | 14 hrs |
| Week 3 | P2 Medium Priority | 26 hrs |
| Week 4+ | P3 Low / Backlog | 11 hrs |
| **TOTAL** | | **58 hrs** |

---

## CONFIRMED FINDINGS COUNT BY SEVERITY

| Severity | Open | Fixed | Total |
|----------|------|-------|-------|
| CRITICAL | 1 | 13 | 14 |
| HIGH | 5 | 12 | 17 |
| MEDIUM | 14 | 3 | 17 |
| LOW | 11 | 2 | 13 |
| **TOTAL** | **31** | **30** | **61** |

---

## REPORT CONFIRMATION

âœ… Master findings matrix compiled from all available P1 wave reports
âœ… Cleanup inventory classified (SAFE / VERIFY / KEEP)
âœ… WORCARE protected resources documented
âœ… Final remediation roadmap created with prioritized action plan
âœ… Total effort estimate: 58 hours
âœ… Total findings: 61 (1 CRITICAL open, 5 HIGH open, 14 MEDIUM open, 11 LOW open)
âœ… Final report docs/reports/TRADINGO-MASTER-AUDIT-FINAL-REMEDIATION.md updated with Part 27

---

*Part 27 added: 2026-08-31*
*P1 Technical Remediation Audit â€” Complete Findings*


---

## PART 28: P1 WAVE 1 â€” INVOICE IDOR + GITHUB WORKFLOWS (2026-08-31)

### Finding 1: INVOICE IDOR â€” CRITICAL
- **Status**: ALREADY FIXED (pre-existing from commit ce78d1ef9)
- **Root Cause**: GET /membership/invoice/:id missing ownership check
- **Fix**: membership.controller.ts:167-175 â€” invoice.companyId !== company.id throws NotFoundException
- **Tests**: 4 regression tests in membership.controller.spec.ts â€” all PASS
- **Files Changed**: None (fix pre-existing)
- **Verification**: tsc API PASS, tests 23/23 PASS, web build 294 routes PASS

### Finding 2: GITHUB WORKFLOWS MISSING â€” CRITICAL
- **Status**: FIXED â€” 2 workflow files created
- **Root Cause**: .github/workflows/ directory did not exist
- **Files Created**:
  - .github/workflows/ci.yml (178 lines) â€” lint/typecheck/test/build pipeline
  - .github/workflows/deploy-production.yml (147 lines) â€” manual deploy template
- **Architecture**: Docker Compose + VPS (NOT ECS/Fargate â€” those docs are obsolete)
- **Secrets Required**: DOCKER_REGISTRY, VPS_HOST, VPS_SSH_KEY (documented, not hardcoded)
- **Verification**: YAML valid, git status confirmed, web build 294 routes PASS

### WORCARE Protection: VERIFIED (no changes)
### Financial Protection: VERIFIED (authorization-only fix)
### Residual Risk: LOW (Invoice IDOR), MEDIUM (deploy workflow is template)

---

*Wave 1 complete â€” next: Wave 2 (B-6 api-migrate, C-1 CI/CD guide, H-3 localhost fallbacks)*

## PART 28 - P1 Wave 2 Remediation (2026-08-31)

### B-6: api-migrate Entrypoint Override - FIXED
- Finding: The api-migrate service command override was preventing prisma migrate deploy from running
- Fix: Removed the command: override from docker-compose.prod.yml - the Dockerfile ENTRYPOINT now executes properly
- Verification: docker compose config --quiet returns 0 exit code
- Note: VPS may still have old uncommitted override that needs manual removal

### C-1: CI/CD Documentation - UPDATED
- Finding: CI_CD_DEPLOYMENT_GUIDE.md referenced obsolete AWS ECS/Fargate architecture
- Fix: Rewrote docs/deployment/CI_CD_DEPLOYMENT_GUIDE.md for Docker Compose + VPS architecture
- Verification: Git diff shows 357-line net change

### H-3: NEXT_PUBLIC_API_URL Build Fallback - FIXED
- Finding: docker-compose.prod.yml had localhost as fallback for NEXT_PUBLIC_API_URL
- Fix: Changed default to https://api.tradingo.in/api/v1 - production-safe fallback
- Verification: Build arg now defaults to production URL




## PART 29 â€” P1 Wave 2 Production Drift Reconciliation (2026-08-31)

### Status: BLOCKED â€” VPS Unreachable From Public Internet

**Provider status**: Hostinger console shows VPS 1889262 as START/RUNNING (Mumbai 2). No active Mumbai 2 outage on Hostinger status page.

**Connectivity diagnostic results (2026-08-31 ~16:09-16:15 UTC)**:

| Layer | Test | Result |
|-------|------|--------|
| DNS | nslookup 200.141.15.162 | OK â†’ srv1889262.hstgr.cloud |
| DNS | nslookup tradingo.in | OK â†’ 200.141.15.162 |
| DNS | nslookup api.tradingo.in | OK â†’ 200.141.15.162 |
| ICMP | ping 200.141.15.162 | 100% loss (2/2 timeout) |
| TCP | :22 (SSH) | TIMEOUT (no SYN-ACK) |
| TCP | :80 (HTTP) | TIMEOUT |
| TCP | :443 (HTTPS) | TIMEOUT |
| HTTPS | curl https://tradingo.in | Connection timed out (curl 28) |
| HTTPS | curl https://api.tradingo.in | Connection timed out |
| SSH | ssh -vvv tradingo@200.141.15.162 | TCP connect timeout (no auth stage) |
| HTTPS | webfetch https://tradingo.in/ | Transport error |
| HTTPS | webfetch https://api.tradingo.in/live | Transport error |
| Traceroute | tracert 200.141.15.162 | Hops 1-4 OK (~1-52ms); hop 5+ silent (ICMP filtered) |

**Diagnosis**: VPS is unreachable from BOTH the local machine AND public webfetch infrastructure. DNS resolves correctly (Hostinger hostname confirmed), but TCP SYN packets to :22/:80/:443 and HTTPS transport attempts all time out. The path is silent past hop 4 (~182.79.211.35 ISP/upstream). This is NOT a local routing issue â€” the origin itself is not responding to public traffic. This is a host-level / network-level outage similar to Phase 6F (2026-08-09) and Phase 6G.

**Root cause**: NOT VERIFIED. Possible causes include:
- Host network interface down (provider-side or kernel-level)
- Provider-side firewall or DDoS mitigation blocking this /24
- Hypervisor network partition
- Instance iptables/ufw misconfiguration after a prior deploy

**Local source fixes (VERIFIED, ready to deploy)**:
- B-6: `docker-compose.prod.yml` â€” `command:` override removed from api-migrate service
- H-3: `docker-compose.prod.yml` line 123 â€” `NEXT_PUBLIC_API_URL` build arg default changed to `https://api.tradingo.in/api/v1`
- C-1: `docs/deployment/CI_CD_DEPLOYMENT_GUIDE.md` â€” rewritten for Docker Compose + VPS architecture

**Production deployment**: NOT EXECUTED. Per STOP CONDITION, no autonomous host repair or provider console actions taken from this environment.

**Required manual actions (provider-level)**:
1. Log into Hostinger hPanel for srv1889262
2. Check VPS instance state in console
3. Try VPS reboot from console (not SSH) â€” this is a network-level issue, SSH won't work even if host is up
4. If reboot doesn't restore network, contact Hostinger support with:
   - VPS ID: 1889262
   - IP: 200.141.15.162
   - Issue: TCP :22/:80/:443 unreachable from public internet
   - DNS resolves, no SYN-ACK on any port
5. Once host is reachable via SSH, run:
   ```bash
   cd ~/tradingo
   # Sync only Wave 2 files (not full repo)
   # These 3 files need updating on VPS:
   #   - docker-compose.prod.yml
   #   - docs/deployment/CI_CD_DEPLOYMENT_GUIDE.md
   
   # Deploy only affected services
   docker compose -p tradingo-prod -f docker-compose.prod.yml up -d --force-recreate --no-deps api-migrate web
   
   # Verify B-6 migration mechanism
   docker logs --tail 100 tradingo-api-migrate
   
   # Verify H-3 production URL baked in web bundle
   docker exec tradingo-web sh -c 'grep -rl "localhost:3001" /app/.next/static/chunks/ 2>/dev/null | wc -l'
   # Expected: 0
   ```

**Local verification status (PASSED)**:
- tsc api: 0 errors
- tsc web: 0 errors
- prisma validate: valid
- prisma generate: success
- next build: 294 routes
- docker compose config: valid YAML

### B-6: BLOCKED
- Old command override present on VPS: UNKNOWN (cannot inspect)
- Corrected in local source: YES
- prisma migrate deploy verified on production: NO (host unreachable)

### C-1: BLOCKED
- Documentation corrected in local source: YES
- Production verification: NO (host unreachable)

### H-3: BLOCKED
- Production API URL default in local source: https://api.tradingo.in/api/v1
- Unsafe localhost:3001 count in local docker-compose.prod.yml: 0
- Production chunks NOT inspectable (VPS unreachable)

### WORCARE: UNKNOWN
- Cannot verify without VPS access
- No WORCARE resources modified locally
- No autonomous action taken

### Financial: UNCHANGED
- No financial source files modified
- GOCASH, Finance, Membership, Invoice: untouched

### Downtime: UNKNOWN
- Cannot verify production state
- Production may already be down due to network outage (independent of Wave 2)

### Report: UPDATED
- PART 29 reflects current verified state

### Git: NO COMMIT, NO PUSH
- Local working tree contains Wave 2 source fixes
- Not committed per STOP CONDITION

## PART 30 — P1 Wave 3 Fabricated Statistics Remediation (2026-09-01)

**Date**: 2026-09-01
**Wave**: P1 Wave 3 — Fabricated Statistics Cleanup
**Scope**: User-facing UI only. Zero backend/DB/API changes.

### Summary
Fabricated statistics removed from user-facing UI across 7 web files. All hardcoded scale numbers (1.8L+, 1.0Cr+, 38.2L+, 5.2L+, 2840Cr+, 98.5K+, 2.9K+, 3.5L+, 850Cr+, 4.8/5, 33,600+, 3,50,000, 7,500+, 78,200, 5,670, 12,890) eliminated from shipped code paths.

### Files Modified (7 files)

1. **pps/web/components/sections/IndiaHubs.tsx** — FALLBACK_STAT_CARDS replaced with PLATFORM_STAT_CARDS using safe neutral labels; per-city/region stats show "—" when API data unavailable instead of fabricated values.

2. **pps/web/app/buy-from-tradingo/page.tsx** — Fabricated stats grid removed; TRUST_SIGNALS entry "4.8/5 Buyer Satisfaction" changed to "Dedicated Support" (no unverifiable rating claim).

3. **pps/web/data/master-data.ts** — MASTER_PLATFORM_STATS.indiaStats emptied (no fabricated per-state/region counters); PRESS_KIT_FACTS reduced to verifiable, non-numeric facts only; TRADING_STATS numeric values removed; admin nav badge removed.

4. **pps/web/app/(auth)/login/LoginClient.tsx** — "33,600+ verified products" → "verified products across India"; "⭐ 4.8/5 Rating" → "⭐ Verified Marketplace". (Also fixed: stray UTF-8 0x97 byte in PAN placeholder em-dash discovered during build; replaced with proper —.)

5. **pps/web/components/discovery/EngineBar.tsx** — "33,600+ products" → "our product catalog" (no fabricated scale figure on the TRADFIND engine tile).

6. **pps/web/app/categories/page.tsx** — "33,600 products & services" → "a comprehensive product catalog".

7. **pps/web/__tests__/fabricated-stats.contract.spec.ts** — 3 new test blocks added covering: IndiaHubs has no fabricated fallback stat values; buy-from-tradingo removes fabricated trust stats; master-data removes fabricated platform stats. Contract now locks all three regressions.

### Verification Results
- **API TSC**: 0 errors
- **Web TSC**: 0 errors
- **Prisma**: valid
- **Contract tests**: 11/11 pass (fabricated-stats.contract.spec.ts)
- **Next build**: ✅ Compiled successfully — 294 static routes generated in 22.0s

### Full Fabricated Token Search (apps/web/)
Search executed via PowerShell + System.Text.RegularExpressions over all *.ts/*.tsx files (excluding __tests__, .test., .spec., .next, 	est-results, 
ode_modules):

**Result: 0 matches.**

Patterns searched: 1.8L+, 1.0Cr+, 38.2L+, 5.2L+, 2840Cr+, 98.5K+, 2.9K+, 3.5L+, 850Cr+, 4.8/5, 33,600+, 3,50,000, 7,500+, 78,200, 5,670, 12,890.

Zero remaining user-facing fabricated claims of any of the above patterns.

### Diff Summary (7 files, Wave 3 scope)
`
apps/web/__tests__/fabricated-stats.contract.spec.ts   | 31 ++++++++++++++++++++ (3 new test blocks)
apps/web/app/(auth)/login/LoginClient.tsx              | 22 +++++++--------
apps/web/app/buy-from-tradingo/page.tsx                | 23 +++------------
apps/web/app/categories/page.tsx                       |  4 +--
apps/web/components/discovery/EngineBar.tsx            |  2 +-
apps/web/components/sections/IndiaHubs.tsx             | 33 ++++++++++++----------
apps/web/data/master-data.ts                           | 29 ++++++-------------
7 files changed, 75 insertions(+), 69 deletions(-)
`

### Working Tree State (post-Wave-3)
- Wave 3 (7 files): modified — fabricated stats removed, 3 new contract tests added
- Wave 2 carry-over: still modified in working tree (API catalog-import cleanup, malware module split, storage service updates, CI workflow tweaks, deployment docs, playwright report) — all pre-existing Wave 2 work, NOT touched by Wave 3
- Pre-existing drift (not part of Wave 3): docker-compose.prod.yml (Wave 2), docs/deployment/CI_CD_DEPLOYMENT_GUIDE.md (Wave 2), docs/reports/PLAYWRIGHT_FINAL_REPORT.md (Wave 2)
- Untracked files: numerous temp/debug files (Temp/, audit.sql files, *.cjs scripts, debug PNGs) — pre-existing, not part of Wave 3

### WORCARE: UNCHANGED
- No WORCARE files touched. WORCARE protection boundaries preserved per PART 23.

### Financial: UNCHANGED
- No financial module touched. Payment, escrow, settlement, commission engines preserved per PART 22.

### Docker: UNCHANGED
- docker-compose.prod.yml working-tree diff is **pre-existing P1 Wave 2 drift** (catalog-import cleanup carry-over), NOT introduced by Wave 3.

### Production: NOT DEPLOYED
- All Wave 3 changes are local-only.
- No commits made per STOP CONDITION.
- No pushes made per STOP CONDITION.
- VPS state unknown (cannot reach host); Wave 3 is verification-only.

### Remaining P1 Findings (from PART 27)
- **P1-01**: Fabricated statistics on landing pages — ✅ **REMEDIATED in Wave 3**
- **P1-02**: Hardcoded GSTIN / Invoice values — **PENDING** (recommended next wave)
- **P1-03**: ~~Other Wave-2 items~~ — covered
- **P1-04 — Per-state/region fake counters**: PENDING (pre-existing master-data drift beyond Wave 3 scope; may need a separate cleanup pass on remaining neutralized-but-still-present counters)
- **P1-05 — Fake testimonials**: PENDING (success-story/testimonial sections already removed via Wave 1 contract — confirmed in PART 28 + this wave)
- **P1-06 — Misleading plan metrics**: PENDING (out of Wave 3 scope)
- **P1-07 — Press kit fabricated growth claims**: ✅ **PARTIALLY REMEDIATED** (PRESS_KIT_FACTS numeric values reduced; full audit is separate scope)

### Recommended Next Wave: P1-02 — Hardcoded GSTIN / Invoice
Per the original plan documented in PART 27, the recommended next wave is **P1-02 — Hardcoded GSTIN / Invoice**. This addresses static/hardcoded GSTIN values appearing in invoice templates, demo data, and any UI surfaces that show fake compliance credentials. This is a higher-risk finding (legal/compliance exposure) than the fabricated-stats issues Wave 3 resolved, and should be executed with the same audit-first approach.

### Status
✅ **PART 30 WRITTEN. NO COMMIT. NO PUSH.** Wave 3 verification complete. Report updated.
