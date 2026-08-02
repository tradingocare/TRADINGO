# TRADINGO Production Risk Register

## Risk Classification
- **P0** — Critical: Must fix before production launch. Causes downtime, data loss, or security breach.
- **P1** — Major: Should fix before production. Causes degraded performance, poor UX, or operational friction.
- **P2** — Minor: Fix within first sprint after launch. Causes inconvenience or technical debt.
- **P3** — Cosmetic: Fix when time permits. Low impact, low likelihood.

---

## P0 — Critical Risks (Must Fix Before Launch)

| ID | Risk | Domain | Impact | Mitigation | Effort |
|----|------|--------|--------|------------|--------|
| P0-01 | **No CI/CD pipeline** — all deployments are manual | Operations | Every deploy requires manual SSH/kubectl; no automated testing gate; no rollback automation; human error causes downtime | Create GitHub Actions workflow: lint → tsc → test → build → deploy to K8s | 2-3 days |
| P0-02 | **Docker Compose has zero resource limits** on 19 services across 5 compose files | Operations | Memory leak in any container (api, redis, postgres, opensearch, clickhouse) can OOM-kill entire host | Add `deploy.resources.limits` to every service in every docker-compose file | 1 day |
| P0-03 | **API Dockerfile missing NODE_ENV=production** | Operations | API starts in development mode: Swagger UI exposed, verbose error messages, debug logging, unminified output | Add `ENV NODE_ENV=production` to API Dockerfile runner stage | 15 min |
| P0-04 | **Web Dockerfile missing HEALTHCHECK** | Operations | K8s may route traffic to unhealthy pods; no auto-restart on failure | Add `HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:3000/` | 15 min |
| P0-05 | **Missing viewport width=device-width, initial-scale=1** | Mobile | iOS Safari renders at 980px default width; zoom broken; WCAG 1.4.4 violation | Add `width: 'device-width', initialScale: 1` to layout.tsx viewport export | 5 min |

---

## P1 — Major Risks (Fix Before Launch)

| ID | Risk | Domain | Impact | Mitigation | Effort |
|----|------|--------|--------|------------|--------|
| P1-01 | **No Kubernetes PodDisruptionBudget** — all pods can be drained simultaneously | Infrastructure | Voluntary node drains (upgrades, maintenance) can take down all API/Web replicas | Create PDBs: api minAvailable=2, web minAvailable=2, postgres minAvailable=1 | 1 hour |
| P1-02 | **No pod anti-affinity** — all replicas on same node | Infrastructure | Node failure takes down entire service | Add `preferredDuringSchedulingIgnoredDuringExecution` podAntiAffinity | 1 hour |
| P1-03 | **Docker images use :latest tag** — no version pinning | Infrastructure | Unreproducible builds; rollbacks impossible; wrong image pulled on restart | Use git SHA or semver tags: `image: tradingo-api:${GIT_SHA}` | 1 hour |
| P1-04 | **Web K8s deployment missing startupProbe** | Infrastructure | Next.js cold start (>30s) may be killed by liveness probe before ready | Add startupProbe with failureThreshold=30 | 30 min |
| P1-05 | **CSP allows unsafe-eval in production** | Security | XSS risk via eval(); unnecessary for production Next.js | Make unsafe-eval conditional on NODE_ENV | 30 min |
| P1-06 | **CSRF registered without explicit secret** | Security | CSRF token uses default secret; potential for prediction | Add CSRF_SECRET env var and wire to csrf plugin | 30 min |
| P1-07 | **Monitoring exporters not deployed** (redis-exporter, node-exporter, alertmanager) | Operations | Prometheus scrape targets fail; no Redis/Node metrics; no alert delivery | Add missing containers to docker-compose.prod.yml | 1 day |
| P1-08 | **No OpenSearch snapshot/backup script** | Data | OpenSearch data not backed up; S3 lifecycle exists but no implementation | Create opensearch-snapshot.sh using snapshot API | 1 day |
| P1-09 | **Zero loading.tsx boundaries** across 177 buyer/seller/admin pages | UX | No route-level loading skeletons; inconsistent loading UX | Add loading.tsx to main route groups | 2 days |
| P1-10 | **Analytics controller missing RolesGuard** | Security | Any authenticated user can access analytics data | Add @UseGuards(RolesGuard) + @Roles('ADMIN', 'SUPER_ADMIN') | 30 min |

---

## P2 — Minor Risks (Fix Post-Launch)

| ID | Risk | Domain | Impact | Mitigation | Effort |
|----|------|--------|--------|------------|--------|
| P2-01 | **BullMQ AI queue has no rate limiter** | AI | Unbounded job submission could overwhelm AI providers | Add `limiter: { max: 10, duration: 1000 }` to queue registration | 30 min |
| P2-02 | **AI Federation AbortController not wired** | AI | CancelCollaboration is a no-op; hung tasks run until timeout | Pass abortSignal through to orchestrator.dispatch() | 1 day |
| P2-03 | **No collaboration-level timeout in federation** | AI | Stuck workflow runs indefinitely | Add timeout parameter to executeWorkflow() | 1 day |
| P2-04 | **No startup API key validation for AI providers** | AI | Missing API keys only discovered at first request | Add onModuleInit() validation hook | 1 hour |
| P2-05 | **Hardcoded AI vault master key default** | AI | If AI_VAULT_MASTER_KEY not set, uses 'tradingo-ai-vault-default-key-change-in-production!' | Throw on startup if key is default placeholder | 30 min |
| P2-06 | **8 endpoints still use @Body() body: any** | API | No request validation; unexpected payloads accepted | Replace with typed DTOs | 1 day |
| P2-07 | **18 endpoints use @Roles() with empty args** | API | Any authenticated user can access campaign/reward endpoints | Replace with explicit @Roles('BUYER', 'SELLER', 'ADMIN') | 1 hour |
| P2-08 | **OpenSearch single shard indices** | Search | No horizontal scaling; shard size grows unbounded | Increase to 3 shards based on data volume | 1 hour |
| P2-09 | **Prisma default pool size (3)** | Database | Connection contention under high concurrency | Increase to 10-20 based on workload testing | 30 min |
| P2-10 | **No skip-to-content accessibility pattern** | Accessibility | Screen reader users must tab through full nav on every page | Add skip-to-content link as first focusable element | 1 hour |
| P2-11 | **Dashboard pages have zero ARIA attributes** | Accessibility | Screen readers get no context for stat cards/charts | Add aria-label to key dashboard components | 1 day |
| P2-12 | **Push notifications are stub only** | Notifications | Mobile push will not work | Implement Firebase/APNs integration | 3 days |

---

## P3 — Cosmetic Risks (Fix When Time Permits)

| ID | Risk | Domain | Impact | Mitigation | Effort |
|----|------|--------|--------|------------|--------|
| P3-01 | **CLICKHOUSE_URL marked as required in config** | Operations | API fails to start if ClickHouse not configured | Change to optional() or default(null) | 15 min |
| P3-02 | **Joi schema allows empty strings for critical vars** | Operations | Missing AWS keys, Razorpay secrets silently pass validation | Use .disallow('') or custom validator | 1 hour |
| P3-03 | **Two circuit breaker implementations (in-memory + Prisma)** | AI | Potential inconsistent state between implementations | Consolidate into one | 1 day |
| P3-04 | **No stale TradTrust score expiry/recalculation cron** | Trust | Scores may become stale over time | Add weekly recalculation cron job | 1 day |
| P3-05 | **Founder AI executiveTimeline still makes 40 queries** | Performance | Cache-aside not yet applied to this method | Add cache-aside (same pattern as other 7 methods) | 1 hour |
| P3-06 | **Dual backup scripts (ops/ vs scripts/)** | Operations | Confusion about which backup script is active | Consolidate into ops/ directory, remove scripts/ duplicate | 1 hour |
| P3-07 | **No per-action SLA config overrides** | AI | All actions use default 5s/15s/30s thresholds | Add admin API for per-action SLA config | 1 day |
| P3-08 | **No Docker CPU/memory limits in K8s for backup container** | Operations | Backup agent could consume unbounded resources | Add resource limits to backup deployment | 30 min |
