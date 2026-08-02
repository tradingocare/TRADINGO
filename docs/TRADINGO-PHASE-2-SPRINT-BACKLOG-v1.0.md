# TRADINGO Phase 2 Sprint Backlog v1.0

**Status**: APPROVED
**Date**: 2026-07-21
**Authority**: Enterprise Delivery Manager
**Architecture Reference**: TRADINGO-ARCHITECTURE-FREEZE-v1.0.md

---

## Overall Release Roadmap

### Sprint Order

| Sprint | Name | Priority | Complexity | Duration |
|--------|------|----------|------------|----------|
| 1 | Security Hardening | CRITICAL | M | 10 days |
| 2 | Quality Foundation (E2E + Integration + Component Tests) | HIGH | XL | 15 days |
| 3 | Search & Catalog Reliability | HIGH | L | 10 days |
| 4 | Performance & Infrastructure Hardening | HIGH | L | 10 days |
| 5 | Business Workflow Stabilization | MEDIUM | M | 10 days |
| 6 | Production Readiness | HIGH | M | 10 days |

### Critical Path

```
Sprint 1 (Security)
  └─► Sprint 2 (Tests)
       └─► Sprint 4 (Performance) ─► Sprint 6 (Production)
 Sprint 3 (Search) ──────────────────► Sprint 6
 Sprint 5 (Workflows) ──────────────► Sprint 6
```

### Blocking Dependencies

- **Sprint 2** blocked until Sprint 1 completes (security must be verified before writing tests)
- **Sprint 4** blocked until Sprint 2 completes (performance tests need test infra)
- **Sprint 6** blocked by Sprints 1-5

### Go/No-Go Gates

| Gate | Sprint | Criteria |
|------|--------|----------|
| G1 | Sprint 1 | All 3 CRITICAL security findings remediated and verified |
| G2 | Sprint 2 | Test coverage ≥40% on core commerce API, ≥20% on frontend |
| G3 | Sprint 3 | OpenSearch sync verified, search analytics tracking complete |
| G4 | Sprint 4 | Lighthouse score ≥70, P95 latency ≤2s, Prometheus operational |
| G5 | Sprint 5 | All Quote/Payment endpoints wired, TradTrust method coverage complete |
| G6 | Sprint 6 | All env vars replaced, cloud deployment verified, runbook published |

### Release Criteria

1. All 6 sprints pass their Go/No-Go gates
2. 0 CRITICAL or HIGH security findings
3. Test coverage ≥40% API, ≥20% frontend
4. Lighthouse performance ≥70
5. All placeholder env vars replaced with production values
6. K8s deployment verified with healthchecks passing
7. Monitoring dashboards operational (Grafana + Prometheus)
8. Runbook + Support Handbook published
9. Architecture freeze document remains the single source of truth (no deviations)

---

## Sprint 1 — Security Hardening

**Priority**: CRITICAL
**Estimated Complexity**: M
**Dependencies**: None
**Expected Deliverables**: Security audit report, remediated rate limiting, missing guards added, circuit breaker aligned, community membership enforced, penetration test pass

### Business Objective
Remediate all CRITICAL and HIGH security findings identified during TradeSocial certification and security audit. Ensure every endpoint has appropriate authentication, authorization, rate limiting, and input validation.

### Scope

1. **Rate limiting on AI endpoints** — TradeSocial certification CRITICAL finding. AI endpoints (AI Gateway, Orchestrator, Runtime, Agents, AI TradeTalk, AI TradeServ) have no rate limiting. Extend @Throttle decorators across all AI controllers.

2. **Rate limiting on all unprotected endpoints** — TradeSocial certification CRITICAL finding. Audit all controllers for missing @Throttle and apply appropriate limits.

3. **Private community membership enforcement** — TradeSocial certification CRITICAL finding. Ensure private community posts/comments are only visible to members.

4. **Controller guard audit** — Verify every controller has appropriate JwtAuthGuard, RolesGuard, and @Roles decorators. Fix any unguarded write endpoints.

5. **AI Gateway circuit breaker alignment** — Current implementation uses fixed failure threshold (5) and 60s recovery. Align with percentage-based threshold and 30s half-open recovery as originally specified.

6. **Secrets rotation** — Verify no hardcoded keys, tokens, or passwords remain in codebase.

### Existing Modules to Reuse

- AuthModule — JwtAuthGuard, @Public() decorator, role system
- AiGatewayModule — controller patterns, credit enforcement
- TradeTalkModule — community membership logic, post visibility
- NotificationModule — security alert notifications
- IncidentResponseModule — incident tracking

### Components to Extend

- AiRuntimeModule — AiCircuitBreakerService (threshold calculation)
- TradeTalkModule — SocialPostService (private community enforcement)
- Individual AI controllers — add @Throttle decorators

### Controllers to Modify

- ai-gateway.controller.ts — add @Throttle
- admin-ai-gateway.controller.ts — add @Throttle
- ai-runtime.controller.ts — add @Throttle
- federation.controller.ts — add @Throttle
- ai-orchestrator.controller.ts — add @Throttle
- ai-tradetalk.controller.ts — add @Throttle
- ai-tradeserv.controller.ts — add @Throttle
- ai-admin.controller.ts — add @Throttle
- seller-agent.controller.ts — add @Throttle
- buyer-agent.controller.ts — add @Throttle
- admin-agent.controller.ts — add @Throttle
- community-agent.controller.ts — add @Throttle
- professional-agent.controller.ts — add @Throttle
- executive-agent.controller.ts — add @Throttle
- tradetalk.controller.ts — private community enforcement
- Any unguarded controllers from audit — add JwtAuthGuard/RolesGuard

### Services to Modify

- AiCircuitBreakerService — percentage-based threshold calculation
- SocialPostService — private community visibility filter

### Frontend Pages Affected

- None (backend-only security hardening)

### APIs Affected

- All AI endpoints (Gateway, Orchestrator, Runtime, Federation, Agents, AI TradeTalk, AI TradeServ, Admin AI)
- TradeTalk community endpoints
- Any endpoints missing guards

### Database Changes

None

### Security Impact

**PRIMARY** — This sprint is entirely about security. Every task directly improves the platform security posture. CRITICAL findings are remediated.

### Performance Impact

Rate limiting adds negligible overhead (in-memory counter check). Circuit breaker changes improve resilience.

### Test Requirements

- Unit tests for AiCircuitBreakerService threshold calculation
- Integration tests for rate limiting on AI endpoints
- Integration tests for private community post visibility
- Guard presence verification via controller specs

### Documentation Updates

- Update Architecture Freeze Section 7 (Security) to reflect percentage-based circuit breaker
- Document rate limit tiers in API documentation

### Risks

- Rate limiting on AI endpoints may affect legitimate high-volume usage — monitor via Prometheus and adjust tiers
- Circuit breaker change may cause temporary service degradation if threshold is too sensitive

### Acceptance Criteria

1. All AI controllers have @Throttle decorators with appropriate limits
2. Private community posts are invisible to non-members
3. Every write endpoint has JwtAuthGuard + appropriate RolesGuard
4. AiCircuitBreakerService uses percentage-based threshold
5. No hardcoded secrets remain in codebase
6. Security audit passes with 0 CRITICAL, 0 HIGH findings

### Definition of Done

- [ ] Security audit completed against all 162 controllers
- [ ] @Throttle added to all AI controllers (minimum 15 controllers)
- [ ] Private community enforcement verified with integration test
- [ ] All unguarded write endpoints identified and guarded
- [ ] Circuit breaker threshold changed to percentage-based
- [ ] Secrets scan completed — 0 hardcoded secrets
- [ ] prisma validate — pass
- [ ] tsc api — 0 errors
- [ ] tsc web — 0 errors
- [ ] next build — pass
- [ ] Security audit report generated

---

## Sprint 2 — Quality Foundation

**Priority**: HIGH
**Estimated Complexity**: XL
**Dependencies**: Sprint 1 (security must be verified before writing tests)
**Expected Deliverables**: Comprehensive test suite with ≥40% API coverage, ≥20% frontend coverage, Playwright E2E smoke tests, CI integration

### Business Objective
Establish the testing foundation that all subsequent sprints build upon. Without tests, regressions are invisible. This sprint writes tests for the existing verified codebase — no new features, no refactoring.

### Scope

1. **Core commerce API integration tests** — Write integration tests for every marketplace controller covering the happy path for CRUD operations. Target: all 15 core commerce controllers.

2. **AI platform unit tests** — Unit tests for AiGatewayService, AiCircuitBreakerService, AiSlaEngineService, TradeAgentFederationService, AgentExecutorService.

3. **GOCASH financial integration tests** — Integration tests for wallet credit/debit/reverse, idempotency verification, balance calculation.

4. **TradTrust scoring engine tests** — Unit tests for score calculation, weight configuration, history recording.

5. **Frontend component tests** — Component tests for shared UI primitives (VerifiedBadge, SellerBadge, FollowButton, XPProgressBar, DailyCheckinCard, MissionCard, CopilotPanel).

6. **E2E smoke tests** — Playwright smoke tests for critical buyer and seller workflows: login, browse products, create RFQ, view quotes, accept quote, view order, check wallet balance.

7. **CI workflow update** — Ensure CI pipeline runs tests on every PR and blocks merge on test failure.

### Existing Modules to Reuse

- All 92 modules — tests cover existing code only
- Jest 29 (API + Web) — existing test framework
- Playwright — existing E2E framework
- test/ directory — existing e2e test config
- supertest — existing HTTP testing utility

### Components to Extend

- No component modification. Tests only.

### Controllers to Modify

- None. Tests only.

### Services to Modify

- None. Tests only.

### Frontend Pages Affected

- None. Tests only.

### APIs Affected

- None. Tests only.

### Database Changes

None

### Security Impact

None (tests do not change any code)

### Performance Impact

None (tests run in CI/CD, not in production)

### Test Requirements

| Test Type | Framework | Target Count | Coverage Target |
|-----------|-----------|-------------|-----------------|
| API Integration | Jest + supertest | 80+ spec files | ≥40% API |
| Unit (AI/GOCASH/TradTrust) | Jest | 30+ spec files | ≥50% AI services |
| Frontend Component | Jest + @testing-library/react | 20+ spec files | ≥20% Frontend |
| E2E Smoke | Playwright | 8+ test files | Critical paths |

### Documentation Updates

- Add test coverage targets to AGENTS.md
- Document test patterns (fixtures, mocks, test DB) in testing guide

### Risks

- Test environment setup may reveal missing database fixtures — mitigate with shared test factories
- Flaky tests from async BullMQ processing — mock queues in integration tests
- Legacy RfqModule and OrderModule may have untestable patterns — explicitly exclude from coverage targets

### Acceptance Criteria

1. API test coverage ≥40% (measured by Jest --coverage)
2. Frontend test coverage ≥20%
3. All 8 critical user journeys pass E2E smoke tests
4. CI pipeline runs full test suite and blocks on failure
5. AI Gateway unit tests cover all 6 providers + routing + fallback
6. GOCASH integration tests verify idempotency (duplicate credit produces 1 transaction)

### Definition of Done

- [ ] Integration tests for all 15 core commerce controllers
- [ ] Unit tests for AiGatewayService, AiCircuitBreakerService, AiSlaEngineService
- [ ] Unit tests for TradeAgentFederationService, AgentExecutorService
- [ ] Integration tests for GOCASH credit/debit/reverse/idempotency
- [ ] Unit tests for TradTrust score calculation + weight configuration
- [ ] Component tests for 6 shared UI components
- [ ] Playwright E2E smoke tests for 8 critical workflows
- [ ] CI workflow updated to run tests and block on failure
- [ ] Test coverage ≥40% API
- [ ] Test coverage ≥20% Frontend
- [ ] prisma validate — pass
- [ ] tsc api — 0 errors
- [ ] tsc web — 0 errors

---

## Sprint 3 — Search & Catalog Reliability

**Priority**: HIGH
**Estimated Complexity**: L
**Dependencies**: None
**Expected Deliverables**: OpenSearch index sync verified, search analytics tracking complete, synonym intelligence operational, zero-result query monitoring active

### Business Objective
Ensure Enterprise Catalog search is reliable, complete, and observable. OpenSearch indices must sync correctly with Prisma data. Search analytics must track all query patterns. Synonym intelligence must handle B2B domain correctly.

### Scope

1. **OpenSearch index sync verification** — Verify that all 4 enterprise indices (enterprise_brands, enterprise_attributes, enterprise_synonyms, enterprise_mappings) sync correctly with Prisma models. Add index health endpoint for monitoring.

2. **Search analytics completion** — Verify EnterpriseSearchAnalyticsService tracks all query types. Ensure trending data populates correctly for daily/weekly/monthly periods. Add missing analytics dimensions.

3. **Synonym intelligence validation** — Audit the 40+ built-in B2B synonym pairs. Add synonym cache warming on startup. Verify bidirectional mapping works for all pairs.

4. **Zero-result query monitoring** — Wire zero-result queries to Founder Intelligence so marketplaceIntelligence() shows accurate zero-result rate. Add alert when zero-result rate exceeds threshold.

5. **Marketplace OpenSearch sync** — Verify marketplace search indices (categories, products, companies) sync correctly. Fix any mapping discrepancies.

6. **Search reindex API hardening** — Add idempotency to reindex operations. Prevent concurrent reindex on same index.

### Existing Modules to Reuse

- EnterpriseCatalogModule — EnterpriseSearchService, SynonymIntelligenceService, EnterpriseSearchAnalyticsService, EnterpriseRankingService
- SearchModule — marketplace search service
- FounderAiModule — marketplaceIntelligence() for zero-result insight
- AiGatewayModule — reindex API patterns

### Components to Extend

- EnterpriseSearchService — index health endpoint, sync verification
- SynonymIntelligenceService — cache warming on init
- EnterpriseSearchAnalyticsService — missing dimensions, trending validation
- SearchModule — marketplace index sync verification

### Controllers to Modify

- enterprise-search.controller.ts — add index health endpoint, reindex idempotency

### Services to Modify

- EnterpriseSearchService — add checkIndexHealth(), add verifySync() method
- SynonymIntelligenceService — add warmCache() onModuleInit
- EnterpriseSearchAnalyticsService — add missing dimensions
- FounderAiService — marketplaceIntelligence() — real zero-result query count

### Frontend Pages Affected

- /admin/search-console — index health tab, sync status display
- /admin/dashboard — search health indicator

### APIs Affected

- GET /enterprise-catalog/search/health (new)
- POST /enterprise-catalog/reindex (idempotency hardening)
- GET /enterprise-catalog/analytics/zero-results (data accuracy)
- GET /admin/founder-ai/dashboard (zero-result rate)

### Database Changes

- Verify EnterpriseSearchAnalytics indexes are correct (composite on query, period, date)
- Add index if missing for zero-result query tracking

### Security Impact

None (existing guards apply to new endpoints)

### Performance Impact

- Index health check is O(1) — negligible
- Cache warming on startup adds startup time (~2s) — acceptable
- Reindex idempotency prevents resource contention

### Test Requirements

- Integration tests for index health endpoint
- Unit tests for synonym cache warming
- Integration tests for search analytics dimensions
- Unit test for zero-result query integration with Founder AI

### Documentation Updates

- Update Enterprise Search documentation with sync verification procedure
- Document search analytics data model

### Risks

- OpenSearch mapping drift from Prisma schema changes — mitigated by health endpoint
- Synonym cache warming may fail if OpenSearch is unavailable during startup — graceful degradation to cold cache

### Acceptance Criteria

1. All 4 enterprise indices return healthy status with document count
2. Search analytics record all query dimensions correctly
3. Synonym cache warms on startup with all 40+ pairs
4. Zero-result queries appear in Founder Intelligence dashboard
5. Marketplace search indices verified healthy
6. Concurrent reindex on same index returns 409 Conflict

### Definition of Done

- [ ] Index health endpoint returns per-index doc count, status, last sync time
- [ ] Synonym cache warms on module init
- [ ] Zero-result query rate accurate in Founder Intelligence
- [ ] All analytics dimensions tracked in EnterpriseSearchAnalyticsService
- [ ] Reindex API returns 409 on concurrent same-index requests
- [ ] Marketplace indices verified synced
- [ ] prisma validate — pass
- [ ] tsc api — 0 errors
- [ ] tsc web — 0 errors
- [ ] next build — pass

---

## Sprint 4 — Performance & Infrastructure Hardening

**Priority**: HIGH
**Estimated Complexity**: L
**Dependencies**: Sprint 2 (performance tests need test infrastructure)
**Expected Deliverables**: Prometheus operational, Lighthouse ≥70, P95 ≤2s, composite indexes added, N+1 queries fixed, Docker/CI/CD hardening

### Business Objective
Harden the production infrastructure for reliability and performance. Fix Prometheus/AlertManager compatibility issues, add missing database indexes, resolve N+1 query patterns, and ensure the platform meets performance SLAs.

### Scope

1. **Prometheus & AlertManager infrastructure** — Fix Windows Docker config compatibility issues. Ensure Prometheus scrapes API metrics correctly. AlertManager routes alerts to configured channels.

2. **Missing composite indexes** — Add verified composite indexes to ProfessionalService, Booking, Proposal, ProfessionalReview, CatalogItem models (identified during P-1.2 audit).

3. **N+1 query remediation** — Audit and fix N+1 query patterns in high-traffic endpoints: product listings, RFQ lists, quote lists, order lists, notification lists.

4. **Prisma select projection optimization** — Ensure all list endpoints use Prisma select projection (not full model fetch) to reduce payload size and query time.

5. **Response compression verification** — Verify brotli compression (1KB threshold) works correctly for API responses. Add Cache-Control headers for immutable static assets.

6. **Docker resource limit hardening** — Verify all docker-compose services have appropriate CPU/memory limits. Add missing limits to any service.

7. **CI/CD workflow hardening** — Add performance benchmark step to CI. Fail CI if P95 latency exceeds threshold on benchmark endpoints.

### Existing Modules to Reuse

- All controllers — add Prisma select projections
- MetricsInterceptor — Prometheus metrics (already registered)
- Prometheus config — ops/monitoring/prometheus/prometheus.yml
- Docker compose — ops/docker-compose.prod.yml

### Components to Extend

- All list endpoint services — add Prisma select projections
- CI workflow — add performance benchmark step

### Controllers to Modify

- products.controller.ts — verify select projections
- smart-rfq.controller.ts — verify select projections
- quote.controller.ts — verify select projections
- smart-negotiation.controller.ts — verify select projections
- smart-po.controller.ts — verify select projections
- smart-order.controller.ts — verify select projections
- notification.controller.ts — verify select projections
- tradeserv.controller.ts — verify select projections
- tradetalk.controller.ts — verify select projections

### Services to Modify

- ProductsService — add select projections to list methods
- SmartRfqService — add select projections to findQuotes, findAll
- QuoteService — add select projections
- SmartNegotiationService — add select projections
- NotificationService — add select projections
- TradeServService — add select projections

### Frontend Pages Affected

- None (backend performance — transparent to frontend)

### APIs Affected

- All list endpoints (performance improvement, no contract change)

### Database Changes

- Add composite indexes (prisma schema modifications):
  - ProfessionalService: @@index([companyId, isActive])
  - ProfessionalCertification: @@index([companyId, verificationStatus])
  - ProfessionalServiceArea: @@index([companyId, city])
  - Booking: @@index([companyId, status]), @@index([clientId, status]), @@index([companyId, scheduledAt])
  - ProfessionalReview: @@index([companyId, rating]), @@index([companyId, isVerifiedBooking])
  - Proposal: @@index([companyId, status]), @@index([clientId, status])
  - CatalogItem: @@index([subcategoryId, isActive]), @@index([subcategoryId, type])

### Security Impact

None

### Performance Impact

**PRIMARY** — This sprint is entirely about performance. Expected improvements:

| Metric | Before | After (Target) |
|--------|--------|----------------|
| Product list P95 | ~3s | ≤1s |
| RFQ list P95 | ~2s | ≤800ms |
| Notification list P95 | ~1.5s | ≤500ms |
| Lighthouse Performance | ~50 | ≥70 |
| API response compression | off | brotli at 1KB+ |
| Prometheus metrics | broken on Windows | fully operational |

### Test Requirements

- Performance benchmark test for top 10 list endpoints (via k6)
- Automated P95 verification in CI

### Documentation Updates

- Update operations runbook with Prometheus/AlertManager operational procedure
- Document index strategy for performance

### Risks

- Adding indexes may cause temporary write lock on large tables — use CONCURRENTLY if available
- Select projections may miss fields needed by some frontend consumers — verify all consumers

### Acceptance Criteria

1. Prometheus scrapes successfully and metrics appear in Grafana
2. AlertManager routes test alert to configured channel
3. All 13 missing composite indexes added
4. Top 10 list endpoints use Prisma select projections
5. P95 latency on all list endpoints ≤2s
6. Lighthouse performance score ≥70
7. Brotli compression verified working
8. All docker services have CPU/memory limits

### Definition of Done

- [ ] Prometheus operational in dev Docker environment
- [ ] AlertManager routes test alert
- [ ] 13 composite indexes created (prisma migrate)
- [ ] N+1 query audit completed — 0 remaining in top 10 list endpoints
- [ ] Prisma select projections on all list endpoints
- [ ] Caching headers verified for static assets
- [ ] Docker resource limits on all 8 prod services
- [ ] CI performance benchmark step added
- [ ] Lighthouse ≥70
- [ ] P95 latency ≤2s on list endpoints
- [ ] prisma validate — pass
- [ ] tsc api — 0 errors
- [ ] tsc web — 0 errors

---

## Sprint 5 — Business Workflow Stabilization

**Priority**: MEDIUM
**Estimated Complexity**: M
**Dependencies**: None
**Expected Deliverables**: Quote controller completed, Payment controller completed, TradTrust service aligned with documentation, all business workflows stable

### Business Objective
Complete any partial controller/service implementations identified during the architecture audit. The Quote controller (9 actual endpoints vs ~19 expected) and Payment controller (6 vs ~15) need completion. TradTrust service method count needs alignment.

### Scope

1. **Quote controller completion** — Audit existing QuoteController against QuoteModule capabilities. Add any missing CRUD endpoints: quote history, quote comparison, quote expiry management, quote PDF export, quote line-item management.

2. **Payment controller completion** — Audit existing PaymentController against PaymentModule capabilities. Add missing endpoints: payment retry, payment method management, receipt download, payment history with filters, manual payment verification status.

3. **TradTrust service method expansion** — Audit TradTrustService (9 async methods) against TradTrustModule capabilities. Add missing service methods for: trust score comparison, score trend analysis, dimension breakdown, company rank, score recommendation.

4. **TradTrust controller expansion** — Add endpoints for score comparison, trend analysis, dimension breakdown (extending existing 8 endpoints).

5. **Workflow event completeness audit** — Verify all business workflow events are emitted via EventEmitter2. Fix missing events: order.shipped, order.delivered, payment.received, payment.failed, dispute.opened, dispute.resolved.

### Existing Modules to Reuse

- QuoteModule — QuoteService, existing QuoteController
- PaymentModule — PaymentService, RazorpayService, manual payment flow
- TradTrustModule — TradTrustService, TradTrustController
- ProductsModule — EventEmitter2 pattern for event emission
- EventEmitter2 — existing event bus

### Components to Extend

- QuoteController — add missing endpoints
- QuoteService — add missing methods
- PaymentController — add missing endpoints
- PaymentService — add missing methods
- TradTrustService — add score comparison, trend analysis, dimension breakdown
- TradTrustController — add new endpoints
- SmartOrderModule — add event emission on shipped/delivered
- PaymentModule — add event emission on received/failed
- DisputeModule — add event emission on opened/resolved

### Controllers to Modify

- quote.controller.ts — add missing endpoints
- payment.controller.ts — add missing endpoints
- tradtrust.controller.ts — add score comparison/trend/dimension endpoints

### Services to Modify

- QuoteService — add method stubs (query existing data, no new schema needed)
- PaymentService — add method stubs
- TradTrustService — add score comparison, trend analysis, dimension breakdown
- SmartOrderService — emit events on shipped/delivered
- PaymentService — emit events on received/failed
- DisputeService — emit events on opened/resolved

### Frontend Pages Affected

- /buyer/quotes — quote history view
- /buyer/payments — payment history/method management
- /seller/quotes — quote comparison
- /admin/tradtrust — score comparison/trend

### APIs Affected

- QuoteController — new endpoints (additive, no existing changes)
- PaymentController — new endpoints (additive, no existing changes)
- TradTrustController — new endpoints (additive, no existing changes)

### Database Changes

None

### Security Impact

- New endpoints inherit existing guards from their controllers
- Ensure @Roles decorators are correct for new admin endpoints

### Performance Impact

- New endpoints query existing data only — no new expensive computations
- Score comparison/trend requires aggregation — add caching if latency exceeds 500ms

### Test Requirements

- Integration tests for all new QuoteController endpoints
- Integration tests for all new PaymentController endpoints
- Integration tests for TradTrustService new methods
- Unit tests for event emission on business workflow transitions

### Documentation Updates

- Update Architecture Freeze Section 3 (Single Source of Truth) endpoint counts
- Document TradTrust scoring dimensions and trend analysis

### Risks

- Quote/Payment controllers may have been intentionally limited — verify with business stakeholders before adding endpoints
- TradTrust trend analysis may require significant historical data to be useful

### Acceptance Criteria

1. QuoteController has comprehensive CRUD covering quote lifecycle
2. PaymentController has payment management + history features
3. TradTrustService has score comparison, trend, dimension breakdown methods
4. TradTrustController exposes new methods as REST endpoints
5. All business workflow events emitted consistently: shipped, delivered, received, failed, opened, resolved
6. All new endpoints have proper guards and validation

### Definition of Done

- [ ] Quote endpoints: history, comparison, expiry, export, line-item management
- [ ] Payment endpoints: retry, method management, receipt, history with filters, manual payment status
- [ ] TradTrust: score comparison, trend analysis, dimension breakdown, company rank
- [ ] Business events: shipped, delivered, payment.received, payment.failed, dispute.opened, dispute.resolved
- [ ] All new endpoints have @Throttle + JwtAuthGuard + appropriate @Roles
- [ ] prisma validate — pass
- [ ] tsc api — 0 errors
- [ ] tsc web — 0 errors
- [ ] next build — pass

---

## Sprint 6 — Production Readiness

**Priority**: HIGH
**Estimated Complexity**: M
**Dependencies**: Sprints 1-5
**Expected Deliverables**: Cloud deployment, production env vars, final runbook, support handbook, post-launch checklist, RC4 certification

### Business Objective
Replace all placeholder environment variables with production values. Deploy to cloud infrastructure (VPS/K8s) using existing manifests. Validate end-to-end production readiness with comprehensive smoke tests. Publish operations and support documentation.

### Scope

1. **Placeholder env var replacement** — Replace all remaining placeholder environment variables: OAuth secrets (Google, LinkedIn), SMTP credentials, AI_VAULT_MASTER_KEY, Sentry DSN, Razorpay live keys, AWS credentials.

2. **Cloud deployment** — Provision target infrastructure (VPS or K8s cluster). Apply existing K8s manifests. Configure DNS, TLS certificates, CDN.

3. **End-to-end production smoke test** — Run full smoke test suite against production deployment: health checks, login, registration, product search, RFQ flow, quote flow, negotiation, order, payment, payout, wallet, AI features, TradeServ, TradeTalk.

4. **Monitoring verification** — Verify Prometheus scrapes production API. Verify Grafana dashboards display real data. Configure alert thresholds. Test AlertManager notification delivery.

5. **Operations runbook publication** — Publish TRADINGO-PRODUCTION-RUNBOOK.md, OPERATIONS-RUNBOOK.md, SUPPORT-HANDBOOK.md, POST-LAUNCH-CHECKLIST.md (existing artifacts from Phase P-9.0 — verify and update).

6. **RC4 certification audit** — Run final production audit across all 12 domains. Generate RC4 certification report. Verify all prior sprint acceptance criteria are met.

### Existing Modules to Reuse

- All 92 modules — production deployment
- HealthModule — /live, /ready probes
- ops/k8s/ — all 14 manifests
- ops/docker-compose.prod.yml — Docker production config
- ops/monitoring/prometheus/prometheus.yml — scrape config
- ops/monitoring/grafana/dashboards/ — Grafana dashboards
- Existing runbooks (docs/deployment/) — verify and update
- All test suites from Sprint 2

### Components to Extend

- .env.example — update with final production values
- K8s manifests — verify namespace, secrets, resource limits
- Monitoring dashboards — verify data sources, add production-specific panels

### Controllers to Modify

- None

### Services to Modify

- None

### Frontend Pages Affected

- None

### APIs Affected

- None

### Database Changes

- Production database migration (prisma migrate deploy against empty production DB)
- Seed essential reference data (categories, industries, TradTrust weights, AI prompts)

### Security Impact

- Production OAuth secrets must be stored in K8s secrets, not in env files
- TLS termination at ingress/nginx
- AI_VAULT_MASTER_KEY rotation procedure documented

### Performance Impact

- Production deployment expected to meet Sprint 4 performance targets
- CDN caching for static assets reduces frontend load times

### Test Requirements

- Full smoke test suite against production deployment
- k6 load test against production (100 VUs, 5 min)
- AlertManager notification delivery test

### Documentation Updates

- Update all 4 runbooks with production-specific details (actual URLs, endpoints, credentials)
- Publish deployment guide with step-by-step cloud provisioning instructions
- Update Architecture Freeze with production deployment checklist

### Risks

- Cloud provider may have different capabilities than local Docker — verify K8s manifests against target environment
- DNS propagation delay — pre-configure DNS before deployment window
- Razorpay live key activation requires business verification — verify ahead of deployment window

### Acceptance Criteria

1. All placeholder env vars replaced with production values
2. Production deployment passes all health checks (/live, /ready)
3. E2E smoke tests pass against production URL
4. Prometheus scrapes production successfully
5. Grafana dashboards show live data
6. AlertManager delivers test notification
7. k6 load test passes (100 VUs, 5 min, error rate <1%)
8. All 4 runbooks published and verified
9. RC4 certification report generated with passing score

### Definition of Done

- [ ] All placeholder env vars replaced
- [ ] Cloud infrastructure provisioned
- [ ] K8s deployment applied and verified
- [ ] DNS configured, TLS certificates installed
- [ ] Full smoke test passes against production URL
- [ ] Prometheus + Grafana operational with live data
- [ ] AlertManager notification delivery verified
- [ ] k6 load test passes
- [ ] 4 runbooks published and verified
- [ ] RC4 certification report generated
- [ ] prisma migrate deploy — pass
- [ ] All prior sprint acceptance criteria verified met

---

## Summary

| Sprint | Effort | Risk | Dependencies | Business Value |
|--------|--------|------|-------------|---------------|
| S1 — Security Hardening | M | LOW | None | CRITICAL — eliminates business-ending security risks |
| S2 — Quality Foundation | XL | MEDIUM | S1 | HIGH — enables confident future development |
| S3 — Search & Catalog | L | LOW | None | HIGH — core marketplace functionality |
| S4 — Performance & Infra | L | MEDIUM | S2 | HIGH — user experience + ops reliability |
| S5 — Workflow Stabilization | M | MEDIUM | None | MEDIUM — completes partial implementations |
| S6 — Production Readiness | M | MEDIUM | S1-S5 | CRITICAL — enables public production |

**Total estimated effort**: ~65 days (13 weeks)
**Optimal start**: Immediately following Architecture Freeze approval
**Hard launch deadline**: Day 90 from Phase 2 program start

---

**Phase 2 Sprint Backlog v1.0 Complete.**
**Ready for Sprint 1 Implementation Approval.**
