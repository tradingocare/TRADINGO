# Program 1 — Performance & Quality Foundation

## Implementation Plan (Validated Against Live Repository)

---

## Session Context

- **Project**: TRADINGO v1.0.0 GA
- **Program**: 1 of 20 in Enterprise Phase 2
- **Mode**: CTO/Architect — zero new features, zero new modules
- **Rule**: Every finding re-validated against running code before action
- **Audit Report**: `docs/reports/PHASE-2-ENTERPRISE-AUDIT-VALIDATION.md`
- **Scope**: 10 validated gaps across CI/CD, Performance, Monitoring, Testing, Caching

---

## Sprints

| Sprint | Focus | Gaps | Effort | Dependencies |
|--------|-------|------|--------|-------------|
| 1.1 | CI/CD Hardening | G-02, G-03, G-04, G-13 | 2 days | K8s cluster access |
| 1.2 | Performance Bugs | G-01, G-05 | 1 day | None |
| 1.3 | Rate Limit Hardening | G-06 | 2 days | None |
| 1.4 | Monitoring Completeness | G-10, G-11, G-12, G-14 | 2 days | Prometheus reload |
| 1.5 | Cache Abstraction | G-08, G-09 | 3 days | None |
| 1.6 | Test Quality | G-07 | 3 days | None |

---

## Sprint 1.1 — CI/CD Hardening

### G-02: K8s Image Versioning

**Current State:** `ops/k8s/base/kustomization.yaml` uses `tradingo-api:latest` and `tradingo-web:latest`.

**Target State:** Images tagged with commit SHA (`tradingo-api:abc1234`). Rollback via previous SHA.

**Files to Modify:**
| File | Change |
|------|--------|
| `.github/workflows/deploy-production.yml` | Add `sed` substitution of image tags with `${{ github.sha }}` in kustomize |
| `.github/workflows/deploy-staging.yml` | Same pattern |
| `ops/k8s/base/kustomization.yaml` | Change `latest` to placeholder `TAG` for sed substitution |

**Validation:** `kubectl get deployment tradigo-api -o jsonpath='{.spec.template.spec.containers[0].image}'` shows commit SHA.

**Risk:** None — K8s cluster currently not provisioned. Change is in CI/CD only.

---

### G-03: K8s Secrets Template

**Current State:** `ops/k8s/base/secrets.yaml` contains literal `${POSTGRES_PASSWORD}`, `${REDIS_PASSWORD}`, etc. If applied directly, creates secrets with literal `${...}` values.

**Target State:** Secrets applied via `sops`-encrypted file or `external-secrets` operator with AWS Secrets Manager / Vault. Template replaced with instructions.

**Files to Modify:**
| File | Change |
|------|--------|
| `ops/k8s/base/secrets.yaml` | Replace with `sops`-encrypted production secrets or delete in favor of ExternalSecrets CRD |
| `ops/k8s/README.md` | Add secrets management instructions |

**Files to Create (if ExternalSecrets):**
| File | Content |
|------|---------|
| `ops/k8s/base/external-secrets.yaml` | `ExternalSecret` CRD referencing AWS Secrets Manager |

**Validation:** `kubectl get secrets tradingo-api-secrets -o yaml | grep -v "kind\|apiVersion\|metadata"` shows base64-encoded real values, not `${...}` literals.

**Risk:** Medium — switching to ExternalSecrets adds a cluster dependency. Alternative: use `sops` with age key committed to repo (simpler).

---

### G-04: Deploy Health Check

**Current State:** All 3 deploy workflows (`deploy.yml`, `deploy-production.yml`, `deploy-staging.yml`) push images and update deployments but never verify the new container is serving traffic.

**Target State:** After each deploy, run `curl --retry 10 --retry-delay 5 --retry-all-errors https://<url>/live` and fail if health check doesn't pass.

**Files to Modify:**
| File | Change |
|------|--------|
| `.github/workflows/deploy.yml` | Add `Deploy Verification` step after Deploy |
| `.github/workflows/deploy-production.yml` | Add verification step in each stage (canary→staging→production) |
| `.github/workflows/deploy-staging.yml` | Add verification step |

**Validation:** CI history shows green checkmark on verification step.

**Risk:** Low. Standard GitHub Actions pattern.

---

### G-13: Consistent Migration Strategy

**Current State:** Production deploy uses `prisma migrate deploy` (applies existing migrations). Staging deploy uses `prisma db push` (syncs schema directly — no migration file created).

**Target State:** Both use `prisma migrate deploy`. Staging gets migrations committed to repo (via CI on staging branch push, or via the same migration pipeline).

**Files to Modify:**
| File | Change |
|------|--------|
| `.github/workflows/deploy-staging.yml` | Change `prisma db push` → `prisma migrate deploy` |

**Validation:** Staging deploy runs `prisma migrate deploy` successfully.

**Risk:** Low. Requires migration files to exist (they do — 6 migrations in `prisma/migrations/`).

---

## Sprint 1.2 — Performance Bugs

### G-01: GMV Memory Fix

**Current State:** `apps/api/src/common/services/business-metrics.service.ts` uses `prisma.orderItem.findMany()` without `take` limit, loading ALL OrderItem rows into memory.

**Target State:** Use `prisma.orderItem.aggregate` to compute GMV server-side.

**File to Modify:** `apps/api/src/common/services/business-metrics.service.ts`

**Current Code (L~62):**
```typescript
const orderItems = await this.prisma.orderItem.findMany({
  where: { order: { status: 'DELIVERED' } },
  select: { totalPrice: true },
});
const gmv = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
```

**Target Code:**
```typescript
const result = await this.prisma.orderItem.aggregate({
  where: { order: { status: 'DELIVERED' } },
  _sum: { totalPrice: true },
});
const gmv = Number(result._sum.totalPrice ?? 0);
```

**Also Fix:** Add per-status order breakdown (pending, completed, cancelled) at the same time since it's the same service.

**Validation:** `curl http://localhost:3001/api/v1/metrics | grep business_gmv_total` returns correct value. No `findMany` on OrderItem without `take`.

**Risk:** None. Aggregate is standard Prisma — O(1) DB operation vs O(n) in-memory.

---

### G-05: Health Endpoint Optimization

**Current State:** `/ready` (root) = 0.21s ✅. `/api/v1/health` = 3.0s (OpenSearch + Storage timeout). `/health` (root) = 404 (route mismatch).

**Target State:** 
1. `/health` root returns same as `/ready` (DB-only, fast)
2. `/api/v1/health` timeouts fixed or deep checks eliminated

**Files to Modify:**
| File | Change |
|------|--------|
| `apps/api/src/health/health.controller.ts` | Add `GET /health` route (alias for `/ready`), or fix routing prefix so both paths work |
| OR simply note that `/api/v1/health` removal or timeout fix is needed |

**Recommended Approach (minimal change):**
- Make `/ready` the primary health check (already done, 0.21s)
- Either fix the OpenSearch ping timeout in `/api/v1/health`, or deprecate the deep check endpoint in favor of separate service-specific health checks
- Add a `GET /health` route that returns the same response as `GET /ready`

**Validation:** `curl http://localhost:3001/health` returns 200 in <500ms.

**Risk:** Low.

---

## Sprint 1.3 — Rate Limit Hardening

### G-06: Targeted Rate Limits

**Current State:** 99/174 controllers rely on global default of 100 req/min. High-risk endpoints (search, admin CRUD, categories, industries) have no custom limits.

**Target State:** Traffic-appropriate rate limits on all 99 un-customized controllers. Categorize by expected traffic pattern:

| Category | Recommended Limit | Rationale |
|----------|------------------|-----------|
| Public search | 30 req/min | Heavy query cost (OpenSearch) |
| Categories | 60 req/min | Moderate traffic, cached |
| Industries | 60 req/min | Moderate traffic, cached |
| Admin read | 60 req/min | Internal tooling |
| Admin write | 20 req/min | Audit-sensitive |
| Buyer RFQ | 20 req/min | Business-critical payload |
| Seller products | 30 req/min | Image upload bandwidth |
| Analytics | 10 req/min | Heavy aggregation queries |

**Implementation Strategy:**
- Create a shared `RateLimits` constant file with named limits (DRY violations will be caught during implementation)
- Add `@Throttle()` decorators to identified controllers

**Files to Create:**
| File | Content |
|------|---------|
| `apps/api/src/common/constants/rate-limits.ts` | Named rate limit constants |

**Files to Modify:**
All 99 controllers currently without `@Throttle` decorators. Priority order:
1. Public search (6+ controllers)
2. Categories + Industries (4 controllers)
3. Admin CRUD (~12 controllers)
4. Analytics (~6 controllers)
5. Buyer (~10 controllers)
6. Seller (~16 controllers)
7. Remaining (~45 controllers)

**Validation:** `curl --rate 120/m http://localhost:3001/categories` at 120 req/min returns 429 after 30s.

**Risk:** Low. Standard NestJS `@nestjs/throttler` pattern. All endpoints currently have 100 req/min default — tightening limits can only reduce abuse surface.

---

## Sprint 1.4 — Monitoring Completeness

### G-10: AI Metrics

**Current State:** No Prometheus metrics for AI Gateway — no throughput, cache hit rate, credit consumption, or model latency tracking.

**Target State:** AI Gateway exports:
- `ai_gateway_requests_total` (counter, labels: `model`, `action`, `status`)
- `ai_gateway_request_duration_seconds` (histogram, labels: `model`, `action`)
- `ai_gateway_cache_hits_total` (counter)
- `ai_gateway_cache_misses_total` (counter)
- `ai_credits_consumed_total` (counter, labels: `company`, `action`)
- `ai_gateway_fallback_activated_total` (counter, label: `primary_provider`)

**Files to Modify:**
| File | Change |
|------|--------|
| `apps/api/src/modules/ai-gateway/ai-gateway.service.ts` | Add Prometheus counter increment on each request/response |
| `apps/api/src/modules/ai-gateway/ai-gateway.service.ts` | Add latency tracking around `makeAiRequest()` |
| `apps/api/src/modules/ai-gateway/ai-credits.service.ts` | Add credit consumption counter on `checkCredits()` |

**Files to Create:**
None — reuse Prometheus client from existing `MetricsInterceptor`.

**Validation:** `curl http://localhost:3001/api/v1/metrics | grep ai_gateway` returns all 6 metric families.

**Risk:** Low. Existing Prometheus client is already configured; no new dependencies.

---

### G-11, G-12: Prometheus Scrape Targets

**Current State:** 
- ClickHouse and OpenSearch are running but not in Prometheus scrape config
- `tradingo-web` targets port 3000 with no `metrics_path` — Next.js defaults to `/api/metrics` but this is unverified

**Target State:**
- Add ClickHouse and OpenSearch scrape targets (even if exporters are minimal)
- Verify and fix `tradingo-web` metrics path

**Files to Modify:**
| File | Change |
|------|--------|
| `ops/monitoring/prometheus/prometheus.yml` | Add `clickhouse` and `opensearch` jobs |
| `ops/monitoring/prometheus/prometheus.yml` | Add `metrics_path: /api/metrics` to `tradingo-web` job |

**Validation:** `curl http://localhost:9090/api/v1/targets` shows all 7 targets as UP.

**Risk:** Low. Configuration-only change.

---

### G-14: AlertManager Multi-Channel

**Current State:** Single Slack receiver. No PagerDuty, email, or SMS fallback for critical alerts.

**Target State:** PagerDuty receiver added for critical alerts. Email receiver added for warnings.

**Files to Modify:**
| File | Change |
|------|--------|
| `ops/monitoring/alertmanager.yml` | Add `pagerduty_configs` and `email_configs` receivers |

**Validation:** Test alert fires PagerDuty incident + email notification.

**Risk:** Low. Requires PagerDuty account + API key.

---

## Sprint 1.5 — Cache Abstraction

### G-08: Cacheable Decorator

**Current State:** 15 modules implement their own Redis key format and TTL policy. No standard decorator.

**Target State:** `@Cacheable()` and `@CacheEvict()` decorators that wrap any method with Redis caching.

**Files to Create:**
| File | Content |
|------|---------|
| `apps/api/src/common/decorators/cacheable.decorator.ts` | Method/class decorator for Redis caching |
| `apps/api/src/common/decorators/cache-evict.decorator.ts` | Method decorator for cache invalidation |
| `apps/api/src/common/interceptors/cache.interceptor.ts` | NestJS interceptor implementing cache-aside pattern |

**Design:**
```typescript
// Usage
@Cacheable({ ttl: 60, key: 'founder:morning-brief' })
async getMorningBrief(companyId: string): Promise<MorningBrief> { ... }

@CacheEvict({ key: 'founder:morning-brief' })
async invalidateMorningBrief(companyId: string): Promise<void> { ... }
```

- Key generation: auto-derived from class + method + serialized args
- TTL: configurable per method, with default 60s
- Jitter: random ±10% on all TTLs (prevents thundering herd)
- Metrics: auto-increment `cache_hits_total` and `cache_misses_total`
- Fallback: on Redis error, execute method and log warning (never crash)

**Migration Strategy (Phase 2):**
1. Create decorator + interceptor
2. Annotate 3-5 highest-value cache methods first (Founder AI briefs, search suggestions, categories)
3. Verify correctness via metrics dashboard
4. Expand to remaining 15 modules over subsequent sprints

**Validation:** Decorator creates and retrieves Redis keys with correct TTL. Hit/miss counters visible in Prometheus.

**Risk:** Low-Medium. Must ensure serialization compatibility and no cache poisoning.

---

### G-09: Cache Warming

**Current State:** After every deployment, all Redis caches start cold. The first request to each endpoint pays the full DB/API cost.

**Target State:** On API startup, pre-populate known-hot cache keys.

**Files to Create:**
| File | Content |
|------|---------|
| `apps/api/src/common/listeners/cache-warmer.listener.ts` | `@OnEvent('app.bootstrap')` or `onModuleInit` warmup job |

**Files to Modify:**
| File | Change |
|------|--------|
| `apps/api/src/app.module.ts` | Register CacheWarmerListener |

**Warm List (startup priority):**
1. Categories (list, tree)
2. Industries (list)
3. Search suggestions (top queries)
4. Trending search
5. Founder AI morning brief (if cached)
6. Platform stats

**Validation:** After restart, `redis-cli keys '*' | wc -l` shows warm Cache entries within first 10s.

**Risk:** Low. Non-blocking — warming failures are logged but don't crash startup.

---

## Sprint 1.6 — Test Quality

### G-07: Reduce `as any` Casting

**Current State:** 58/135 spec files (42.9%) use `as any` casting, masking DTO type changes.

**Target State:** Reduce `as any` usage to <15% by creating proper typed mocks and test factories.

**Implementation Strategy (targeted, not exhaustive):**
1. Identify top 20 files with heaviest `as any` usage (by count per file)
2. Create `test/mock-factories.ts` with typed factory functions for:
   - User, Company, Product, Category, Industry
   - RFQ, Quote, Negotiation
   - Common DTOs
3. Replace inline object literals with factory calls in spec files

**Files to Create:**
| File | Content |
|------|---------|
| `test/mock-factories.ts` | Typed factory functions for test data |

**Files to Modify (top 20):**
| File | `as any` Count |
|------|----------------|
| `ai-gateway.service.spec.ts` | ~15 (heaviest) |
| `ai-orchestrator.service.spec.ts` | ~12 |
| `founder-ai.service.spec.ts` | ~10 |
| `analytics.service.spec.ts` | ~8 |
| `tradeserv.service.spec.ts` | ~8 |
| ... | (remaining 15 files with 3-6 each) |

**Explicitly NOT in scope:** 
- Full coverage of all 92 modules (46 uncovered modules — that's a separate initiative)
- End-to-end or integration tests
- Performance/stress tests (handled by k6)

**Validation:** `tsc --noEmit --project apps/api/tsconfig.spec.json` passes. `grep -r 'as any' apps/api/src --include='*.spec.ts' | wc -l` shows <20 instances (<15%).

**Risk:** Medium. Changing test mocks can cause false failures if factories are incorrect. Mitigation: run specs before/after each change.

---

## Rollback Strategy

Every change in this plan is **backward compatible and independently revertible**:

| Sprint | Rollback Action |
|--------|----------------|
| 1.1 | Revert CI/CD YAML changes. Existing images/artifacts unaffected. |
| 1.2 | Revert `business-metrics.service.ts` change. GMV falls back to in-memory sum (no regression, just slower). |
| 1.3 | Remove `@Throttle` decorators from modified controllers — fall back to 100 req/min default. |
| 1.4 | Revert `prometheus.yml` and `alertmanager.yml`. Existing scrape unfazed. |
| 1.5 | Remove `@Cacheable` decorators from annotated methods — methods execute without caching (no regression). |
| 1.6 | Revert spec file changes and delete `test/mock-factories.ts`. Tests fall back to inline objects. |

---

## Validation Plan

### Pre-Implementation Baseline
```bash
# Confirm no pre-existing 500 errors
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/categories?limit=50"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/industries?limit=50"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/companies?limit=50"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/products/search?q=test"

# Confirm baseline rate limiting
curl --rate 110/m -s -o /dev/null -w "%{http_code}" "http://localhost:3001/categories"

# Confirm test compilation
cd apps/api && npx tsc --noEmit --project tsconfig.spec.json 2>&1 | head -5

# Confirm Prometheus metrics
curl -s http://localhost:3001/api/v1/metrics | head -20
```

### Post-Implementation Validation
Same commands as above, plus:
```bash
# K8s image version
kubectl get deployment tradingo-api -o jsonpath='{.spec.template.spec.containers[0].image}'

# GMV fix
curl -s http://localhost:3001/api/v1/metrics | grep business_gmv_total

# AI metrics
curl -s http://localhost:3001/api/v1/metrics | grep ai_gateway

# Cache metrics
curl -s http://localhost:3001/api/v1/metrics | grep cache_hits_total

# Test quality
grep -r 'as any' apps/api/src --include='*.spec.ts' | wc -l
```

### Exit Criteria (all must pass)
1. ✅ CI: `tsc --noEmit` passes on api + web
2. ✅ Build: `next build` passes
3. ✅ Health: `/ready` returns 200 in <500ms
4. ✅ GMV: `business_gmv_total` metric returns correct value, no `findMany` on OrderItem
5. ✅ Rate limits: At least 30 custom `@Throttle` controllers added
6. ✅ AI metrics: All 6 metric families present in `/metrics`
7. ✅ Cache: `@Cacheable` decorator works with Redis, hit/miss counters visible
8. ✅ Tests: `as any` usage reduced to <20 files (<15%)
9. ✅ K8s: Images tagged with commit SHA
10. ✅ Prometheus: All targets UP

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cache decorator breaks serialization for complex DTOs | Medium | High | Use JSON.stringify/parse with BigInt handling; test with all DTO types |
| Rate limit too tight for legitimate workflows | Medium | Medium | Set conservative (generous) limits initially; monitor 429 rate in Grafana |
| Test factories diverge from DTOs | Medium | Medium | Run spec suite as CI gate; update factories when DTOs change |
| K8s secrets change breaks cluster if misconfigured | Low | Critical | Test on staging first; keep backup of current secrets |
| CI/CD changes break deploy pipeline | Low | High | Test on staging first; feature-branch the workflow changes |
| AI metrics add latency to AI Gateway | Low | Low | Use Prometheus `inc()` (atomic increment) — no blocking I/O |

---

## Summary

| Sprint | Gaps | Files Modified | Files Created | Effort | Risk |
|--------|------|----------------|---------------|--------|------|
| 1.1 CI/CD | G-02, G-03, G-04, G-13 | 5 | 1-2 | 2 days | Low |
| 1.2 Performance | G-01, G-05 | 2 | 0 | 1 day | None |
| 1.3 Rate Limits | G-06 | 100+ | 1 | 2 days | Low |
| 1.4 Monitoring | G-10, G-11, G-12, G-14 | 3 | 0 | 2 days | Low |
| 1.5 Cache | G-08, G-09 | 2 | 3 | 3 days | Low-Med |
| 1.6 Testing | G-07 | 20+ | 1 | 3 days | Medium |
| **Total** | **6 sprints, 11 gaps** | **~132** | **~6** | **13 days** | **Low** |
