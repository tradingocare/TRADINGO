# TRADINGO Enterprise Implementation Blueprint

**Version**: 1.0
**Status**: Architecture Frozen — Implementation Planning
**Date**: 2026-07-27
**Classification**: Founder Confidential — Engineering Execution Guide

---

## TABLE OF CONTENTS

1. Executive Summary
2. Module Implementation Guide
3. Sprint Roadmap
4. Dependency Matrix
5. Testing Strategy
6. Deployment Strategy
7. Rollout Plan
8. Operational Readiness
9. Quality Gates
10. Final Implementation Checklist

---

## 1. EXECUTIVE SUMMARY

### 1.1 Platform at a Glance

| Dimension | Count |
|-----------|-------|
| Domains | 16 |
| Modules | ~35 |
| Controllers | ~155 |
| API Endpoints | ~1,325 |
| Aggregate Roots | 42 |
| Event Types | 300+ |
| Background Jobs | 24 |
| External Integrations | 14 |
| AI Task Types | 10 |
| AI Actions Registered | 127 |
| AI Agent Definitions | 6 (Seller, Buyer, Admin, Founder, Enterprise, Federation) |

### 1.2 Implementation Philosophy

| Principle | Rule |
|-----------|------|
| **Architecture First** | No code before contract. No contract before architecture. Architecture is frozen. |
| **Module Independence** | Every module can be built and tested independently. Shared infrastructure (Event Bus, Prisma, AI Gateway) is platform foundation. |
| **Event-Driven by Default** | Cross-module communication is event-based. No direct service-to-service calls across domain boundaries. |
| **API-Contract-First** | Every module's API surface is defined before implementation begins. Consumers develop against contracts. |
| **Idempotent by Design** | Every financial mutation is replay-safe. Idempotency keys are non-negotiable. |
| **Observable from Day One** | Every module ships with metrics, logs, traces, and health checks. No module is complete without observability. |

### 1.3 Phase Map

| Phase | Name | Modules | Duration | Dependencies |
|-------|------|---------|----------|-------------|
| **0** | Foundation | Shared Kernel, Event Bus, Infrastructure | 4 weeks | None |
| **1** | Identity & Trust | Identity, Company, TradTrust, Verification | 4 weeks | Phase 0 |
| **2** | Commerce Core | Catalog, RFQ, Quote, Order, Inventory | 6 weeks | Phase 1 |
| **3** | Financial Engine | Payment, Escrow, Settlement, Refund, Commission | 6 weeks | Phase 2 |
| **4** | Growth & Rewards | GoCash, Wallet, Referral, Campaign, Ecosystem | 4 weeks | Phase 3 |
| **5** | Services Marketplace | TradeServ, Booking, Proposal, Reviews | 4 weeks | Phase 2 |
| **6** | Social & Community | TradeTalk, Posts, Comments, Follows | 3 weeks | Phase 1 |
| **7** | AI Platform | AI Gateway, Runtime, Agents, Federation, Workflow | 6 weeks | Phase 0 |
| **8** | Intelligence Layer | Analytics, Growth Intelligence, Founder Intel, Enterprise Intel | 4 weeks | Phase 2, Phase 3 |
| **9** | Platform Services | Notification, Membership, CRM, Advertising, Support | 4 weeks | Phase 1 |
| **10** | Integration & Commerce | Knowledge Graph, Memory, Search Console, Admin Console | 3 weeks | Phase 7, Phase 8 |

**Total Estimated Duration**: 48 weeks (11 phases, some parallelizable)

---

## 2. MODULE IMPLEMENTATION GUIDE

### 2.1 Module Template

Every module in this section follows this structure:

```
1. Purpose
2. Business Capabilities (what the module enables for users)
3. APIs consumed (other modules' APIs this module calls)
4. APIs exposed (endpoints this module provides)
5. Events produced (events this module publishes)
6. Events consumed (events this module subscribes to)
7. Aggregate roots (consistency boundaries)
8. Data ownership (system of record, tenant scope)
9. Background jobs (queued or scheduled work)
10. AI touchpoints (AI task types this module uses)
11. External integrations (third-party services)
12. Permissions (role-based access requirements)
13. Feature flags (toggable capabilities)
14. Configuration (environment variables, settings)
15. Observability (metrics, logs, traces, health checks)
16. Performance targets (latency, throughput, SLA)
17. Security requirements (classification, encryption, audit)
18. Test strategy (unit, integration, E2E, contract testing)
19. Deployment dependencies (what must be running first)
20. Rollout strategy (phased, feature-flagged, canary)
```

---

### 2.2 Module: Shared Kernel

#### 2.2.1 PrismaModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Single source of truth for database access. All modules share one PrismaService instance. |
| **Business Capabilities** | Database connection pooling, migration management, query execution |
| **APIs consumed** | None |
| **APIs exposed** | `PrismaService` (injectable): all Prisma client methods |
| **Events produced** | None |
| **Events consumed** | None |
| **Aggregate roots** | None (cross-cutting) |
| **Data ownership** | Global — manages all 267+ tables across all schemas |
| **Background jobs** | Migration execution, connection pool health check |
| **AI touchpoints** | None |
| **External integrations** | PostgreSQL 16 |
| **Permissions** | Internal only — never exposed to HTTP layer |
| **Feature flags** | None |
| **Configuration** | `DATABASE_URL`, `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_POOL_TIMEOUT`, `DB_SSL_CA` |
| **Observability** | Query duration histogram (`prisma_query_duration_ms`), connection pool gauge (`prisma_connections_active`), slow query log (>500ms) |
| **Performance targets** | P50 < 5ms, P95 < 20ms, P99 < 100ms, max 50 concurrent connections |
| **Security requirements** | L3 — connection string encrypted at rest, SSL enforced for production, query logging masks PII |
| **Test strategy** | Integration tests against test PostgreSQL. Mock PrismaService for unit tests. |
| **Deployment dependencies** | PostgreSQL 16 running with schema migrations applied |
| **Rollout strategy** | Blue-green. Schema migrations backward-compatible for one version. |

#### 2.2.2 EventBusModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Central event bus for all domain event publishing and subscription. |
| **Business Capabilities** | Event publishing, subscription management, schema validation, DLQ management, replay |
| **APIs consumed** | None |
| **APIs exposed** | `EventBusService.publish()`, `EventBusService.subscribe()`, Event Schema Registry endpoints, Webhook management endpoints |
| **Events produced** | All events as infrastructure metadata |
| **Events consumed** | All domain events (for routing) |
| **Aggregate roots** | None |
| **Data ownership** | Event schema registry, subscription registry, webhook registry |
| **Background jobs** | DLQ monitoring, webhook delivery retry, event archival, replay execution |
| **AI touchpoints** | None |
| **External integrations** | Message broker (Redis Streams / Kafka / RabbitMQ — see infra decision) |
| **Permissions** | `ADMIN` for schema registry, `SUPER_ADMIN` for DLQ replay |
| **Feature flags** | `event-bus-enabled`, `event-outbox-enabled` |
| **Configuration** | `EVENT_BUS_PROVIDER`, `EVENT_BUS_RETENTION_HOURS`, `EVENT_DLQ_RETENTION_DAYS`, `EVENT_MAX_RETRY`, `WEBHOOK_CONCURRENCY`, `WEBHOOK_TIMEOUT_SEC` |
| **Observability** | Events produced/consumed count, consumer lag, DLQ depth, delivery latency P50/P95/P99, webhook failure rate |
| **Performance targets** | Publish latency P99 < 50ms, delivery latency P99 < 500ms (same process), < 2s (cross-process), 10,000 events/sec sustained |
| **Security requirements** | L2 — event payload encryption for L3+ events, webhook HMAC signing, consumer authentication |
| **Test strategy** | Unit: event publishing/marshalling. Integration: end-to-end delivery test with mock consumer. Chaos: bus unavailable, consumer crash, poison event. |
| **Deployment dependencies** | Redis (or chosen message broker) |
| **Rollout strategy** | Feature-flagged. Start with in-process EventEmitter, migrate to distributed broker when scaling. |

#### 2.2.3 RedisModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Shared Redis infrastructure for caching, rate limiting, OTP storage, session cache, AI cache, BullMQ queues |
| **Business Capabilities** | Cache-aside, rate limiting counters, OTP validation, session blacklist, AI response cache |
| **APIs consumed** | None |
| **APIs exposed** | `RedisService`: get/set/del/expire/incr, rate limit check, OTP store/verify |
| **Events produced** | None |
| **Events consumed** | None |
| **Aggregate roots** | None |
| **Data ownership** | Transient data only — no business facts in Redis |
| **Background jobs** | Key eviction (TTL-based), cache warming for hot keys |
| **AI touchpoints** | AI response cache (dedup identical prompts) |
| **External integrations** | Redis 7 |
| **Permissions** | Internal only |
| **Feature flags** | `redis-cache-enabled`, `redis-rate-limit-enabled` |
| **Configuration** | `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_KEY_PREFIX`, `REDIS_MAX_MEMORY`, `REDIS_EVICTION_POLICY` |
| **Observability** | Cache hit/miss ratio, memory usage, key count, eviction rate, command latency |
| **Performance targets** | Get: P50 < 1ms, P99 < 5ms. Set: P50 < 2ms, P99 < 10ms. |
| **Security requirements** | L3 — Redis password required, TLS for production, keys prefixed by environment |
| **Test strategy** | Integration with test Redis. Mock for unit tests. |
| **Deployment dependencies** | Redis 7 |
| **Rollout strategy** | Always-on. Redis is stateless — swap endpoints with zero downtime. |

#### 2.2.4 OpenSearchModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Shared search infrastructure for product, catalog, professional, and knowledge search. |
| **Business Capabilities** | Full-text search, faceted filtering, autocomplete, synonym expansion, ranking |
| **APIs consumed** | None |
| **APIs exposed** | `SearchService.index()`, `SearchService.search()`, `SearchService.delete()`, `SearchService.suggest()` |
| **Events produced** | `search.index.synchronized` |
| **Events consumed** | `product.created/updated/deleted/published`, `professional.registered/updated`, `category.created/updated` |
| **Aggregate roots** | None |
| **Data ownership** | Search indexes only — data sourced from Prisma entities |
| **Background jobs** | Index sync (entity create/update/delete), reindex (full or incremental), index health check |
| **AI touchpoints** | AI-ranked search results, synonym intelligence, query expansion |
| **External integrations** | OpenSearch 2.17 |
| **Permissions** | Internal (services), ADMIN for index management |
| **Feature flags** | `opensearch-enabled`, `opensearch-ai-ranking` |
| **Configuration** | `OPENSEARCH_URL`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD`, `OPENSEARCH_INDEX_PREFIX`, `OPENSEARCH_SHARDS`, `OPENSEARCH_REPLICAS`, `OPENSEARCH_REINDEX_BATCH_SIZE` |
| **Observability** | Index size, document count, query latency P50/P95/P99, indexing rate, search error rate |
| **Performance targets** | Query P50 < 50ms, P99 < 200ms. Indexing P50 < 100ms per document. |
| **Security requirements** | L2 — TLS required, basic auth, index-level access control |
| **Test strategy** | Integration with test OpenSearch. Fallback to Prisma search when unavailable. |
| **Deployment dependencies** | OpenSearch 2.17 |
| **Rollout strategy** | Deployed with index alias for zero-downtime reindex. Fallback to Prisma search if OpenSearch unavailable. |

---

### 2.3 Module: IdentityModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | User registration, authentication, session management, role management, password/OTP flows |
| **Business Capabilities** | User registration (email+password, social, SSO), login, logout, password reset, email/mobile verification, MFA, session management, role assignment |
| **APIs consumed** | NotificationModule (send OTP, send welcome email), RedisModule (session cache, OTP store, rate limit) |
| **APIs exposed** | 11 auth endpoints (register, login, social-login, refresh, logout, forgot-password, reset-password, change-password, verify-email, verify-mobile, send-otp), 5 user endpoints, 3 session endpoints, 6 role endpoints |
| **Events produced** | `user.created`, `user.updated`, `user.deleted`, `user.email.verified`, `user.mobile.verified`, `user.logged.in`, `user.logged.out`, `user.password.changed`, `user.role.changed`, `session.created`, `session.expired`, `session.revoked`, `user.anomaly.detected`, `user.onboarding.completed`, `user.mfa.enabled` |
| **Events consumed** | `company.created` (create owner member), `member.joined` (welcome notification) |
| **Aggregate roots** | User (Session[], Notification[], ReferralCode[]) |
| **Data ownership** | User entity, Session entity, Role entity. System of Record: Prisma (Identity schema) |
| **Background jobs** | Session cleanup (expired sessions > 90 days), anomaly detection scan |
| **AI touchpoints** | User risk profiling (anomaly detection), verification assist (document auto-verification), smart OTP (adaptive rate limiting) |
| **External integrations** | Google OAuth, LinkedIn OAuth, Redis (session/OTP/rate limit) |
| **Permissions** | `PUBLIC`: register, login, forgot-password, reset-password. `USER`: own profile, sessions. `ADMIN`: user list, roles. `SUPER_ADMIN`: role CRUD. |
| **Feature flags** | `social-login-google`, `social-login-linkedin`, `mfa-required`, `email-verification-required`, `mobile-verification-required` |
| **Configuration** | `JWT_SECRET`, `JWT_EXPIRY_ACCESS`, `JWT_EXPIRY_REFRESH`, `OTP_LENGTH`, `OTP_TTL_SECONDS`, `OTP_MAX_ATTEMPTS`, `PASSWORD_MIN_LENGTH`, `PASSWORD_HISTORY_COUNT`, `MAX_SESSIONS_PER_USER`, `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCKOUT_MINUTES` |
| **Observability** | Login success/failure rate, registration rate, account lockout rate, session count, password reset rate, MFA enrollment rate |
| **Performance targets** | Login P50 < 100ms, P99 < 500ms. Registration P50 < 200ms, P99 < 1s. Token validation P50 < 5ms, P99 < 20ms. |
| **Security requirements** | L3-L4 — passwords hashed (bcrypt), JWT signed, OTP rate-limited (10/min per IP), account lockout after 5 failed attempts, refresh token rotation, session revocation on password change, PII encryption at rest |
| **Test strategy** | Unit: password hashing, JWT validation, OTP generation. Integration: full registration→login→refresh→logout flow, social login mock, OTP verify. Security: brute-force lockout, token replay, session fixation, timing attack on login. |
| **Deployment dependencies** | PrismaModule, RedisModule, NotificationModule (for OTP delivery) |
| **Rollout strategy** | Feature-flagged: start with email+password login, enable social login by provider, enable MFA after stabilization. |

### 2.4 Module: CompaniesModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Company (B2B tenant) management, team structure, membership, profile completion |
| **Business Capabilities** | Company registration, profile management, team management, member invitations, company search, company verification documents |
| **APIs consumed** | UserModule (resolve user), PrismaModule, OpenSearchModule (search companies) |
| **APIs exposed** | 5 company endpoints (create, getById, update, my-company, list), member management |
| **Events produced** | `company.created`, `company.updated`, `company.deleted`, `company.restored`, `company.status.changed`, `company.onboarding.completed`, `company.profile.completed`, `company.gstin.verified`, `company.pan.verified`, `member.joined`, `member.left`, `member.role.changed`, `team.created/updated/deleted` |
| **Events consumed** | `user.created` (auto-join if invite token), `verification.company.approved` (update verification level) |
| **Aggregate roots** | Company (CompanyMember[], Team[], Product[], ProfessionalService[]) |
| **Data ownership** | Company entity, CompanyMember entity, Team entity. System of Record: Prisma |
| **Background jobs** | Onboarding reminder (email if incomplete after 24h), stale company cleanup |
| **AI touchpoints** | Trust summary generation, company description enrichment |
| **External integrations** | GSTIN verification API, PAN verification API |
| **Permissions** | `PUBLIC`: company search (limited fields). `COMPANY_MEMBER`: own company profile. `ADMIN`: all companies. |
| **Feature flags** | `company-onboarding-checklist`, `auto-verify-gstin` |
| **Configuration** | `ONBOARDING_REMINDER_HOURS`, `STALE_COMPANY_DAYS`, `GSTIN_VERIFICATION_API_KEY`, `PAN_VERIFICATION_API_KEY`, `MAX_MEMBERS_PER_PLAN` |
| **Observability** | Company registration rate, profile completion rate, member count distribution, onboarding funnel (registered→profile→verified) |
| **Performance targets** | Company lookup P50 < 20ms, P99 < 100ms. Company search P50 < 100ms (with OpenSearch). |
| **Security requirements** | L3 — company data access-controlled by membership, GSTIN/PAN encrypted at rest |
| **Test strategy** | Unit: company CRUD, member management. Integration: registration→member add→role change. Fuzz: duplicate slug, invalid GSTIN. |
| **Deployment dependencies** | PrismaModule, IdentityModule |
| **Rollout strategy** | Always-on. Deployed with Phase 1. |

### 2.5 Module: TradTrustModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Trust scoring, risk assessment, fraud detection, compliance verification, dispute management |
| **Business Capabilities** | 16-dimensional trust scoring, company verification, risk assessment, fraud monitoring, dispute resolution, compliance checks, trust badge management, seller verification levels |
| **APIs consumed** | CommerceModule (order/dispute data for scoring), CompaniesModule (company profile data), ReviewModule (review data for scoring) |
| **APIs exposed** | 4 trust score endpoints, 4 risk endpoints, 4 fraud endpoints, 3 compliance endpoints, 5 dispute endpoints, verification endpoints |
| **Events produced** | `trust.score.created`, `trust.score.recalculated`, `trust.score.dimension.changed`, `trust.score.threshold.crossed`, `trust.tier.changed`, `trust.risk.flagged`, `trust.risk.cleared`, `trust.recommendation.generated`, `trust.seller.badge.updated`, `verification.company.submitted/approved/rejected/expired/escalated`, `verification.user.submitted/approved/rejected`, `verification.level.upgraded`, `verification.document.uploaded/verified/rejected` |
| **Events consumed** | `order.completed` (transaction signal), `order.disputed` (risk signal), `payment.failed` (payment behavior), `user.created` (identity signal), `company.created` (init trust score), `review.created` (reputation signal), `booking.completed` (service signal), `product.first.published` (seller activity signal) |
| **Aggregate roots** | TradTrustScore (TrustScoreHistory[]), CompanyVerification, UserVerification |
| **Data ownership** | Trust scores, verification records, trust signals, risk assessments, dispute records. System of Record: Prisma |
| **Background jobs** | Trust score recalculation (event-driven), trust decay (time-based score decrease), verification expiry check, fraud pattern scan |
| **AI touchpoints** | Trust prediction (predict trust score from signals), fraud detection (anomaly detection in behavior patterns), resolution recommendation (suggest dispute resolution) |
| **External integrations** | Document verification service, GSTIN verification |
| **Permissions** | `PUBLIC`: trust scores (by company ID). `COMPANY`: own score, own verification. `ADMIN`: all scores, verifications, disputes, fraud cases. `SUPER_ADMIN`: risk rules, fraud rules. |
| **Feature flags** | `auto-trust-score`, `auto-verify-company`, `fraud-detection-enabled`, `trust-decay-enabled`, `seller-badge-enabled` |
| **Configuration** | `TRUST_SCORE_DIMENSION_WEIGHTS` (16 weights), `TRUST_SCORE_DECAY_DAILY_RATE`, `TRUST_SCORE_DECAY_MAX`, `VERIFICATION_AUTO_APPROVE_LEVELS`, `RISK_THRESHOLD_WARNING`, `RISK_THRESHOLD_CRITICAL`, `FRAUD_SCAN_INTERVAL_MINUTES`, `DISPUTE_ESCALATION_HOURS` |
| **Observability** | Score distribution histogram, verification approval rate, risk flag rate, dispute resolution time, fraud detection rate, score recalculation frequency |
| **Performance targets** | Score lookup P50 < 20ms, P99 < 100ms. Score recalculation P50 < 500ms, P99 < 2s. Risk assessment P50 < 200ms. |
| **Security requirements** | L2-L3 — trust scores are public by design (L2), verification documents encrypted (L3), dispute evidence restricted (L3) |
| **Test strategy** | Unit: 16-dimension score calculation with edge cases (zero data, extreme values, missing dimensions). Integration: full verification flow (submit→approve→score update). Performance: score recalculation under load (100 concurrent companies). |
| **Deployment dependencies** | PrismaModule, CompaniesModule |
| **Rollout strategy** | Feature-flagged. Start with trust score calculation for existing companies. Enable verification flow. Enable fraud detection last. |

### 2.6 Module: EnterpriseCatalogModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Master catalog management, product listing, category taxonomy, brand management, attribute management, product quality scoring, AI enrichment |
| **Business Capabilities** | Product CRUD, catalog item management, category tree, brand registration and verification, global attribute management, product quality scoring, duplicate detection, AI enrichment, bulk import/export, product publishing workflow |
| **APIs consumed** | TradTrustModule (trust scores for ranking), OpenSearchModule (product search), AiGatewayModule (AI enrichment, category suggestion), GocashIntegrationModule (rewards for publishing) |
| **APIs exposed** | 11 product endpoints, 6 category endpoints, 6 brand endpoints, catalog admin console, enterprise search (9 endpoints), autocomplete, quality scoring |
| **Events produced** | `product.created`, `product.updated`, `product.deleted`, `product.published`, `product.unpublished`, `product.status.changed`, `product.featured`, `product.quality.scored`, `product.ai.enriched`, `product.duplicate.detected`, `product.first.published`, `category.created/updated/deleted`, `catalog.item.created/updated`, `brand.created/verified/rejected`, `attribute.created/updated` |
| **Events consumed** | `trust.tier.changed` (re-rank products), `company.verified` (show verified seller products), `verification.brand.approved` (update brand verification status) |
| **Aggregate roots** | Product (ProductMedia[], CatalogQualityScore[]), CatalogItem (CatalogAlias[], CatalogAttribute[]), CatalogCategory (CatalogSubcategory[]), GlobalBrand, GlobalAttribute |
| **Data ownership** | Products, catalog items, categories, brands, attributes, quality scores. System of Record: Prisma + OpenSearch |
| **Background jobs** | Quality score computation (event-driven), AI enrichment (event-driven), duplicate detection scan (daily), OpenSearch index sync, bulk import processing |
| **AI touchpoints** | Description generation, SEO title/description, attribute suggestion, category suggestion, product title generation, duplicate detection, translation, keyword extraction |
| **External integrations** | OpenSearch 2.17 |
| **Permissions** | `SELLER`: own products CRUD. `BUYER`: read published products. `ADMIN`: all products, categories, brands, attributes, catalog management. |
| **Feature flags** | `product-auto-quality-scoring`, `product-ai-enrichment`, `duplicate-detection`, `catalog-search-v2`, `auto-brand-verification` |
| **Configuration** | `QUALITY_SCORE_DIMENSIONS` (SEO weight, image weight, spec weight, completeness weight), `AI_ENRICHMENT_BATCH_SIZE`, `DUPLICATE_SIMILARITY_THRESHOLD`, `MAX_PRODUCT_IMAGES`, `MAX_PRODUCT_SPECS`, `BULK_IMPORT_MAX_ROWS` |
| **Observability** | Product count by category, publish rate, quality score distribution, duplicate detection rate, AI enrichment coverage, search latency, search zero-result rate |
| **Performance targets** | Product CRUD P50 < 100ms, P99 < 500ms. Catalog search P50 < 50ms, P99 < 200ms. Bulk import: 10,000 rows in < 5 minutes. Quality score: P50 < 200ms. |
| **Security requirements** | L2 — product data internal. L3 — pricing data restricted. Draft products visible only to seller and admin. |
| **Test strategy** | Unit: quality score calculation, duplicate detection algorithm, category tree operations. Integration: full product lifecycle (create→publish→search→archive), bulk import CSV. Performance: catalog search under 10M products. |
| **Deployment dependencies** | PrismaModule, OpenSearchModule, AiGatewayModule (for enrichment) |
| **Rollout strategy** | Deployed in Phase 2. Start with product CRUD + basic search. Enable AI enrichment in Phase 7. Enable quality scoring in Phase 4 (reward dependent). |

### 2.7 Module: SmartRfqModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | RFQ (Request for Quote) management, supplier matching, AI-powered RFQ intelligence |
| **Business Capabilities** | RFQ creation, supplier auto-matching, completeness scoring, AI requirements extraction, market intelligence, timeline prediction, risk assessment, document analysis |
| **APIs consumed** | TradTrustModule (supplier trust scores for matching), EnterpriseCatalogModule (category/catalog data), AiGatewayModule (RFQ AI analysis) |
| **APIs exposed** | 7 RFQ endpoints, RFQ AI analysis endpoint |
| **Events produced** | `rfq.created`, `rfq.updated`, `rfq.closed`, `rfq.cancelled`, `rfq.expired`, `rfq.awarded`, `rfq.reopened`, `rfq.first.response`, `rfq.supplier.matched`, `rfq.completeness.scored`, `rfq.ai.analyzed` |
| **Events consumed** | `quote.submitted` (track first response), `quote.accepted` (trigger award), `company.verified` (include in supplier matching) |
| **Aggregate roots** | RFQ (Quote[]) |
| **Data ownership** | RFQ records. System of Record: Prisma |
| **Background jobs** | RFQ expiry check (auto-close expired RFQs), supplier matching (async after RFQ create), AI analysis queue |
| **AI touchpoints** | Requirements extraction, buyer-supplier matching, pricing analysis, timeline prediction, risk assessment, completeness check, document analysis, market intelligence, scope clarification |
| **External integrations** | None |
| **Permissions** | `BUYER`: own RFQs CRUD. `SELLER`: browse open RFQs, view details. `ADMIN`: all RFQs. |
| **Feature flags** | `supplier-auto-matching`, `rfq-ai-analysis`, `rfq-timeline-prediction`, `rfq-smart-scope` |
| **Configuration** | `RFQ_MAX_QUOTES`, `RFQ_DEFAULT_EXPIRY_HOURS`, `SUPPLIER_MATCHING_MIN_SCORE`, `SUPPLIER_MATCHING_MAX_RESULTS`, `RFQ_COMPLETENESS_WEIGHTS` |
| **Observability** | RFQ creation rate, average quotes per RFQ, time-to-first-quote, RFQ→award conversion rate, expired RFQ rate, supplier match accuracy |
| **Performance targets** | RFQ CRUD P50 < 100ms, P99 < 500ms. Supplier matching P50 < 500ms, P99 < 2s. |
| **Security requirements** | L3 — RFQ data visible to buyer + matched suppliers. AI analysis restricted to buyer. |
| **Test strategy** | Unit: RFQ status transitions, completeness scoring, matching algorithm. Integration: full RFQ lifecycle (create→receive quotes→award). |
| **Deployment dependencies** | PrismaModule, TradTrustModule, EnterpriseCatalogModule |
| **Rollout strategy** | Phase 2. Start with basic RFQ CRUD. Enable auto-matching after TradTrust stabilization. Enable AI in Phase 7. |

### 2.8 Module: QuoteModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Quote (seller response to RFQ) management, AI-powered pricing and win-probability analysis |
| **Business Capabilities** | Quote creation/submission, AI pricing recommendation, win probability analysis, margin analysis, competitiveness scoring, quote review, negotiation prep |
| **APIs consumed** | SmartRfqModule (RFQ data), TradTrustModule (buyer trust score), AiGatewayModule (quote AI analysis) |
| **APIs exposed** | 7 quote endpoints, quote AI analysis endpoints |
| **Events produced** | `quote.created`, `quote.updated`, `quote.submitted`, `quote.accepted`, `quote.rejected`, `quote.withdrawn`, `quote.expired`, `quote.countered`, `quote.ai.analyzed`, `quote.price.changed` |
| **Events consumed** | `negotiation.completed` (update quote status if deal reached), `order.placed` (mark quote as fulfilled) |
| **Aggregate roots** | Quote (Negotiation[]) |
| **Data ownership** | Quote records. System of Record: Prisma |
| **Background jobs** | Quote expiry check, AI analysis job (async after submit) |
| **AI touchpoints** | Price recommendation, win probability, margin analysis, competitiveness score, review feedback, negotiation preparation, risk assessment, quality score |
| **External integrations** | None |
| **Permissions** | `SELLER`: own quotes CRUD. `BUYER`: view quotes on own RFQs. `ADMIN`: all quotes. |
| **Feature flags** | `quote-ai-pricing`, `quote-win-probability`, `quote-margin-analysis`, `auto-quote-expiry` |
| **Configuration** | `QUOTE_DEFAULT_VALIDITY_HOURS`, `QUOTE_MIN_MARGIN_PERCENT`, `QUOTE_MAX_REVISION_COUNT`, `QUOTE_AI_CONFIDENCE_THRESHOLD` |
| **Observability** | Quote submission rate, quote→accept conversion rate, average quote amount, time-to-response, AI analysis coverage |
| **Performance targets** | Quote CRUD P50 < 100ms, P99 < 500ms. AI analysis P50 < 3s, P99 < 10s. |
| **Security requirements** | L3 — quote data visible to seller (own) + buyer (on RFQ). Pricing is confidential. |
| **Test strategy** | Unit: quote status transitions, win probability calculation. Integration: RFQ→quote→accept→order flow. |
| **Deployment dependencies** | PrismaModule, SmartRfqModule |
| **Rollout strategy** | Phase 2 with SmartRfqModule. Start with basic CRUD. Enable AI in Phase 7. |

### 2.9 Module: OrderModule (CommerceModule)

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Order lifecycle management, shipment tracking, milestone management, dispute coordination |
| **Business Capabilities** | Order creation (from quote), order confirmation, shipment tracking, delivery confirmation, cancellation, dispute filing, milestone tracking, order history |
| **APIs consumed** | PaymentModule (initiate payment), InventoryModule (reserve/release stock), NotificationModule (order notifications) |
| **APIs exposed** | 6 order endpoints, 4 shipment endpoints, dispute endpoints |
| **Events produced** | `order.placed`, `order.confirmed`, `order.shipped`, `order.delivered`, `order.completed`, `order.cancelled`, `order.disputed`, `order.status.changed`, `order.milestone.reached`, `order.payment.due`, `order.payment.overdue`, `order.fulfillment.delayed`, `negotiation.started`, `negotiation.completed` |
| **Events consumed** | `payment.captured` (confirm payment), `quote.accepted` (create order), `escrow.released` (mark payment complete), `settlement.completed` (mark financially complete) |
| **Aggregate roots** | Order (Payment[], Shipment[], Dispute[]), Negotiation (CounterOffer[]) |
| **Data ownership** | Order records, shipment records, negotiation records. System of Record: Prisma |
| **Background jobs** | Payment due reminder, overdue escalation, fulfillment delay detection, milestone detection |
| **AI touchpoints** | Seller AI: demand analysis, pricing intelligence. Buyer AI: procurement advisor. Negotiation AI: strategy, sentiment, deal probability. |
| **External integrations** | None |
| **Permissions** | `BUYER`: own orders. `SELLER`: orders on own products. `ADMIN`: all orders. Dispute: both parties + admin. |
| **Feature flags** | `auto-order-confirmation`, `auto-fulfillment-tracking`, `dispute-auto-escalation`, `milestone-rewards` |
| **Configuration** | `ORDER_DEFAULT_CANCEL_WINDOW_HOURS`, `PAYMENT_DUE_REMINDER_HOURS`, `OVERDUE_ESCALATION_HOURS`, `FULFILLMENT_DELAY_HOURS`, `MAX_DISPUTE_ESCALATION_DAYS` |
| **Observability** | Order volume, order→delivery cycle time, average order value, cancellation rate, dispute rate, fulfillment delay rate, milestone achievement rate |
| **Performance targets** | Order create P50 < 200ms, P99 < 1s. Order status updates P50 < 100ms. Order listing P50 < 200ms (with pagination). |
| **Security requirements** | L3 — order data visible to buyer + seller. L4 — payment details in order only via reference. |
| **Test strategy** | Unit: order status transitions, dispute lifecycle. Integration: full order flow (quote→order→payment→ship→deliver→complete). Chaos: concurrent status updates. |
| **Deployment dependencies** | PrismaModule, SmartRfqModule, QuoteModule |
| **Rollout strategy** | Phase 2. Start with basic order→payment→shipment flow. Enable AI negotiation in Phase 7. |

### 2.10 Module: PaymentModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Payment processing, escrow management, settlement, commission calculation, refund processing |
| **Business Capabilities** | Payment initiation and capture, escrow hold/release, settlement processing, commission rule engine, refund processing, reconciliation, multi-gateway support, payout creation |
| **APIs consumed** | Razorpay (payment gateway), CompaniesModule (payee/seller details), GoCashModule (wallet adjustments) |
| **APIs exposed** | 5 payment endpoints, 6 escrow endpoints, 3 settlement endpoints, 6 commission endpoints, 4 reconciliation endpoints, 9 finance ops endpoints |
| **Events produced** | `payment.initiated`, `payment.captured`, `payment.failed`, `payment.refunded`, `payment.status.changed`, `payment.gateway.timeout`, `payment.gateway.switch`, `escrow.held`, `escrow.released`, `escrow.frozen`, `escrow.disputed`, `escrow.refunded`, `settlement.created`, `settlement.completed`, `settlement.failed`, `settlement.paused`, `refund.initiated`, `refund.approved`, `refund.completed`, `refund.failed`, `commission.calculated` |
| **Events consumed** | `order.placed` (initiate payment), `order.delivered` (release escrow), `booking.payment.confirmed` (hold escrow), `booking.completed` (release escrow for booking), `order.disputed` (freeze escrow), `verification.company.approved` (update settlement rules) |
| **Aggregate roots** | Payment (Refund[], Escrow[]), Escrow (Settlement[], Commission[]), Settlement, Refund, CommissionRule |
| **Data ownership** | Payments, escrows, settlements, refunds, commission rules, invoices. System of Record: Prisma |
| **Background jobs** | Payment expiry check, escrow auto-release, settlement processing batch, settlement retry, reconciliation batch, commission recalculation, payout processing |
| **AI touchpoints** | Credit risk assessment, payment delay prediction, cash flow forecast, collection strategy, credit limit recommendation, invoice intelligence, fraud signal detection |
| **External integrations** | Razorpay (payment gateway, webhooks), Payout service (bank transfers) |
| **Permissions** | `BUYER`: own payments. `SELLER`: own settlements. `ADMIN`: all payments, escrows, settlements, refunds, commissions. `SUPER_ADMIN`: commission rules, reconciliation. |
| **Feature flags** | `payment-gateway-razorpay`, `payment-multi-gateway`, `escrow-milestone`, `auto-settlement`, `commission-engine-v2` |
| **Configuration** | `PAYMENT_MODE` (test/live), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `DEFAULT_SETTLEMENT_SCHEDULE`, `COMMISSION_PLATFORM_DEFAULT_PERCENT`, `ESCROW_RELEASE_POLICY`, `REFUND_APPROVAL_THRESHOLD`, `RECONCILIATION_SCHEDULE` |
| **Observability** | Payment success rate by gateway, average payment amount, escrow hold duration, settlement processing time, refund rate, commission collected, reconciliation discrepancy rate, gateway failover count |
| **Performance targets** | Payment initiation P50 < 200ms, P99 < 1s. Webhook processing P50 < 100ms. Settlement batch P50 < 5 minutes for 1,000 records. Commission calculation P50 < 50ms. |
| **Security requirements** | L4 — payment details restricted. All financial operations idempotent. Webhook HMAC verified. Payment amount in smallest currency unit (paise). |
| **Test strategy** | Unit: commission rule engine (5-level priority), escrow state machine, settlement calculations. Integration: Razorpay test mode for full payment→webhook→escrow→settlement flow. Idempotency: replay payment webhook, verify exactly-once processing. Security: signature verification failure, amount manipulation. |
| **Deployment dependencies** | PrismaModule, Razorpay account (test mode) |
| **Rollout strategy** | Phase 3 — only after Commerce Core is stable. Start in test mode with ₹1 transactions. Enable live mode with PAYMENT_MODE=live flag. Escrow rollout: hold→release flow first, milestone release later. |

### 2.11 Module: GoCashModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Wallet management, reward transactions, redemptions, ecosystem rewards, referral rewards, campaign rewards |
| **Business Capabilities** | Wallet creation, credit/debit transactions, redemption processing, balance inquiry, transaction history, ledger management, idempotent reward credit |
| **APIs consumed** | NotificationModule (reward notifications) |
| **APIs exposed** | 4 wallet endpoints, referral endpoints, campaign endpoints, ecosystem endpoints |
| **Events produced** | `wallet.created`, `wallet.frozen`, `wallet.unfrozen`, `transaction.credited`, `transaction.debited`, `transaction.reversed`, `transaction.failed`, `redeem.requested`, `redeem.completed`, `balance.threshold`, `reward.earned`, `reward.expiring`, `campaign.reward`, `referral.reward` |
| **Events consumed** | `company.created` (create wallet), `product.first.published` (reward), `order.delivered` (reward), `booking.completed` (reward), `review.created` (reward), `membership.upgrade.completed` (reward), `user.onboarding.completed` (signup reward), `verification.company.approved` (reward for verification) |
| **Aggregate roots** | Wallet (GOCASH_Transaction[], GOCASH_Redemption[]), Campaign (Claim[], Analytics[]) |
| **Data ownership** | Wallets, transactions, redemptions, rewards, campaigns, referrals. System of Record: Prisma |
| **Background jobs** | Reward expiry check, campaign processing, referral reward processing, balance threshold monitoring |
| **AI touchpoints** | Reward summary (AI-generated breakdown), suggested missions (AI-recommended activities) |
| **External integrations** | None |
| **Permissions** | `COMPANY`: own wallet. `ADMIN`: all wallets, campaigns. `SUPER_ADMIN`: manual adjustments, freeze/unfreeze. |
| **Feature flags** | `gocash-enabled`, `gocash-rewards`, `gocash-referrals`, `gocash-campaigns`, `gocash-redemption` |
| **Configuration** | `DEFAULT_WALLET_CURRENCY`, `MIN_REDEMPTION_AMOUNT`, `MAX_REDEMPTION_AMOUNT`, `REWARD_EXPIRY_DAYS`, `REFERRAL_REWARD_AMOUNT`, `CAMPAIGN_MAX_BUDGET` |
| **Observability** | Wallet count, total points issued/redeemed, active campaigns, referral conversion rate, top reward types by volume, balance distribution |
| **Performance targets** | Credit/debit P50 < 100ms, P99 < 500ms. Balance inquiry P50 < 10ms. Redemption P50 < 200ms. |
| **Security requirements** | L3 — all transactions idempotent via idempotencyKey. Balance computed as SUM(credit) - SUM(debit). No UPDATE on transaction records (append-only). Wallet freeze prevents all debits. |
| **Test strategy** | Unit: balance calculation (append-only), idempotency verification (replay same tx), redemption rules. Integration: full reward flow (event→credit→balance update→notification). Chaos: concurrent credits to same wallet. |
| **Deployment dependencies** | PrismaModule |
| **Rollout strategy** | Phase 4. Start with wallet creation + balance inquiry. Enable rewards in order: signup→order→referral→campaign. Enable redemption last. |

### 2.12 Module: TradeServModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Professional services marketplace — service providers, booking, proposals, reviews |
| **Business Capabilities** | Professional registration, service listing, service area management, booking lifecycle (request→confirm→complete), proposal submission, reviews and ratings, certification tracking, portfolio management |
| **APIs consumed** | PaymentModule (booking payment, escrow), GoCashModule (rewards), TradTrustModule (professional trust score), OpenSearchModule (professional search) |
| **APIs exposed** | 6 professional endpoints, 6 service endpoints, 6 booking endpoints, 6 proposal endpoints, 4 review endpoints, 5 portfolio endpoints, V2 search |
| **Events produced** | `professional.registered`, `professional.approved`, `professional.suspended`, `service.created/updated/deleted`, `booking.created`, `booking.confirmed`, `booking.completed`, `booking.cancelled`, `booking.disputed`, `booking.payment.confirmed`, `interface.created`, `review.created`, `professional.first.booking` |
| **Events consumed** | `payment.captured` (confirm booking payment), `escrow.released` (mark booking financially complete), `company.verified` (update professional verification badge) |
| **Aggregate roots** | Booking (ProfessionalReview[], Proposal[]), ProfessionalService (ProfessionalAvailability[], ProfessionalServiceArea[]), Proposal |
| **Data ownership** | Professional profiles, services, bookings, reviews, proposals, portfolios, certifications, service areas. System of Record: Prisma + OpenSearch |
| **Background jobs** | Booking no-show detection, booking auto-completion, certification expiry check, OpenSearch index sync (7 trigger points) |
| **AI touchpoints** | Semantic search, professional match score, booking insights, trust tier recommendations |
| **External integrations** | OpenSearch 2.17 (professional search index) |
| **Permissions** | `PUBLIC`: search professionals, view profiles. `BUYER`: create bookings, submit reviews. `PROFESSIONAL`: own services, manage bookings. `ADMIN`: approve professionals, all bookings. |
| **Feature flags** | `tradeserv-enabled`, `tradeserv-search-v2`, `professional-auto-approve`, `booking-auto-confirm`, `tradeserv-rewards` |
| **Configuration** | `BOOKING_AUTO_CONFIRM_HOURS`, `BOOKING_NO_SHOW_MINUTES`, `BOOKING_CANCELLATION_POLICY`, `PROFESSIONAL_APPROVAL_REQUIRED`, `MAX_SERVICE_AREAS`, `MAX_PORTFOLIO_ITEMS`, `REVIEW_MODERATION_ENABLED` |
| **Observability** | Professional count by category, booking volume, booking→completion rate, average booking value, cancellation rate, review distribution, search-to-booking conversion |
| **Performance targets** | Professional search P50 < 100ms (OpenSearch), P99 < 500ms. Booking CRUD P50 < 200ms. Review P50 < 100ms. |
| **Security requirements** | L3 — booking details visible to both parties. Professional documents restricted. Payment handled via PaymentModule. |
| **Test strategy** | Unit: booking state machine (6 states, valid transitions), review moderation rules. Integration: full booking flow (search→book→confirm→pay→complete→review). Performance: professional search with 10K+ professionals. |
| **Deployment dependencies** | PrismaModule, OpenSearchModule, PaymentModule |
| **Rollout strategy** | Phase 5. Start with professional registration + basic booking. Enable search V2, rewards, and reviews incrementally. |

### 2.13 Module: TradeTalkModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Community and social features — posts, comments, communities, follows, direct messages |
| **Business Capabilities** | Post creation with media/link, threaded comments, community management (public/private), member following, content moderation (AI-assisted), trending topics, content suggestions |
| **APIs consumed** | AiGatewayModule (content moderation, content assistance) |
| **APIs exposed** | 7 post endpoints, 9 community endpoints, 3 comment endpoints, 5 follow endpoints, 7 messaging endpoints, 6 AI moderation endpoints |
| **Events produced** | `post.created/updated/deleted`, `post.liked`, `post.shared`, `post.flagged`, `post.moderated`, `comment.created`, `community.created/updated/deleted`, `community.member.joined/left`, `user.followed/unfollowed`, `content.ai.moderated` |
| **Events consumed** | `company.verified` (show verified badge on posts) |
| **Aggregate roots** | Community (SocialPost[], CommunityMember[]), SocialPost (SocialPostLike[], SocialSavedPost[]) |
| **Data ownership** | Posts, comments, communities, follows, messages. System of Record: Prisma |
| **Background jobs** | Trending score calculation, content moderation queue, stale post archive |
| **AI touchpoints** | Content generation assist, moderation (spam/offensive/duplicate), summarization, translation, hashtag suggestion, title suggestion, posting time optimization, community recommendations |
| **External integrations** | None |
| **Permissions** | `PUBLIC`: read public communities/posts. `AUTHENTICATED`: create posts, comment, follow. `COMMUNITY_OWNER`: manage community. `ADMIN`: moderate all content. |
| **Feature flags** | `tradetalk-enabled`, `ai-content-moderation`, `ai-content-assist`, `community-private`, `trending-topics` |
| **Configuration** | `POST_MAX_LENGTH`, `POST_EDIT_WINDOW_MINUTES`, `COMMENT_MAX_LENGTH`, `COMMUNITY_MAX_MEMBERS`, `TRENDING_WINDOW_HOURS`, `MODERATION_QUEUE_SIZE`, `AI_MODERATION_THRESHOLD` |
| **Observability** | Post volume, engagement rate (likes/comments per post), community growth, moderation action rate, AI detection accuracy, trending topic accuracy |
| **Performance targets** | Feed load P50 < 200ms, P99 < 1s. Post create P50 < 100ms. Comment P50 < 50ms. |
| **Security requirements** | L1-L2 — public posts are L1. Private community content is L2. Moderation actions are L3. |
| **Test strategy** | Unit: content moderation rules, comment threading, community privacy enforcement. Integration: full social flow (create community→post→comment→like→follow). Security: private community data leakage test. |
| **Deployment dependencies** | PrismaModule |
| **Rollout strategy** | Phase 6. Start with public communities + posts. Enable AI moderation in Phase 7. Enable private communities after stabilization. |

### 2.14 Module: AiGatewayModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Central AI entry point — model routing, credit management, cost governance, prompt management, rate limiting, failover |
| **Business Capabilities** | AI model invocation (sync/async/streaming), model routing with fallback, credit tracking and enforcement, prompt version management, cost budgeting, audit logging, rate limiting, circuit breaker |
| **APIs consumed** | External AI providers (OpenRouter, Gemini, Groq), RedisModule (cache, rate limit), NotificationModule (credit alerts) |
| **APIs exposed** | 4 agent invocation endpoints, 6 prompt management endpoints, 3 credit/cost endpoints, 2 model endpoints, 6 governance endpoints |
| **Events produced** | `agent.invoked`, `agent.completed`, `agent.failed`, `agent.timed.out`, `inference.completed`, `inference.failed`, `credit.deducted`, `credit.exhausted`, `model.failover`, `model.rate.limited`, `cache.hit`, `feedback.submitted`, `approval.requested`, `approval.granted`, `approval.rejected` |
| **Events consumed** | `membership.plan.changed` (update credit allocation), `subscription.created` (allocate initial credits) |
| **Aggregate roots** | AgentDefinition (AgentSession[]), AgentSession (Inference[]), WorkflowDefinition (WorkflowExecution[]), KnowledgeGraph, MemoryFragment, AiCreditUsage |
| **Data ownership** | Agent definitions, sessions, inference logs, credit usage, prompts, cost budgets. System of Record: Prisma + Redis |
| **Background jobs** | Credit period reset (monthly), cache eviction, inference log archival (90 days), circuit breaker recovery, SLA metric computation |
| **AI touchpoints** | All AI task types pass through this module (10 types, 127 actions) |
| **External integrations** | OpenRouter (primary LLM), Google Gemini (fallback), Groq (fallback), Tavily (web search), Firecrawl (web scraping) |
| **Permissions** | `AUTHENTICATED`: invoke agents (credit-gated). `ADMIN`: manage prompts, view audit, manage budgets. `SUPER_ADMIN`: configure providers, reset credits. |
| **Feature flags** | `ai-gateway-enabled`, `ai-credit-enforcement`, `ai-cache-enabled`, `ai-streaming-enabled`, `ai-failover-enabled`, `ai-human-approval` |
| **Configuration** | `AI_VAULT_MASTER_KEY`, `AI_CACHE_ENABLED`, `AI_CACHE_TTL_SECONDS`, `AI_DEFAULT_MODEL`, `AI_MAX_TOKENS`, `AI_DEFAULT_TEMPERATURE`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`, `CREDIT_COST_OVERRIDES`, `RATE_LIMIT_PER_USER`, `CIRCUIT_BREAKER_THRESHOLD` |
| **Observability** | Inference volume by model/task type, cache hit rate, cost by provider/model, latency P50/P95/P99, error rate by provider, credit usage per company, circuit breaker status, rate limit hit count |
| **Performance targets** | Sync inference P50 < 2s, P99 < 10s. Streaming: first token < 500ms. Cache hit P50 < 10ms. Credit check P50 < 5ms. |
| **Security requirements** | L3-L4 — AI provider keys encrypted (L4), inference logs may contain PII (L3), credit budgets restrict abuse. Human approval required for high-cost or first-time actions. |
| **Test strategy** | Unit: credit calculation, fallback routing, circuit breaker states, prompt template rendering. Integration: mock provider for end-to-end inference flow, credit exhaustion boundary, failover verification. |
| **Deployment dependencies** | PrismaModule, RedisModule |
| **Rollout strategy** | Phase 7 — Foundation dependency for all AI features. Start with gateway-only (no agents). Register providers one at a time (OpenRouter→Gemini→Groq). Enable credit enforcement last. |

### 2.15 Module: AiRuntimeModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | AI job queue, workflow engine, multi-agent federation, SLA monitoring, circuit breaker |
| **Business Capabilities** | Priority job queuing (3 queues), workflow execution (sequential/parallel/conditional/nested), multi-agent coordination with collaboration patterns, SLA monitoring with P50/P95/P99 per action, circuit breaker (percentage-based, auto-recovery) |
| **APIs consumed** | AiGatewayModule (agent execution), AgentFrameworkModule (agent discovery), RedisModule (BullMQ queues) |
| **APIs exposed** | 7 runtime endpoints (enqueue, job status, workflow, queue stats, SLA, circuit breaker) |
| **Events produced** | `workflow.execution.started/completed/failed/paused/resumed/cancelled`, `workflow.step.completed/failed/retrying`, `workflow.approval.created/resolved`, `coordination.started/completed/failed` |
| **Events consumed** | All domain events (workflow trigger), `agent.completed` (workflow step continuation) |
| **Aggregate roots** | WorkflowDefinition (WorkflowExecution[]) |
| **Data ownership** | Workflow definitions, execution history, collaboration records, SLA metrics. System of Record: Prisma + Redis |
| **Background jobs** | Queue polling (10s interval), job processing (max 5 concurrent), SLA metric aggregation, circuit breaker health check, workflow timeout detection |
| **AI touchpoints** | All workflows execute AI actions through this module |
| **External integrations** | BullMQ (Redis-backed job queues) |
| **Permissions** | `AUTHENTICATED`: enqueue jobs. `ADMIN`: manage queues, view SLA. `SUPER_ADMIN`: reset circuit breaker. |
| **Feature flags** | `ai-runtime-enabled`, `ai-workflow-engine`, `ai-federation`, `ai-sla-monitoring`, `ai-circuit-breaker` |
| **Configuration** | `QUEUE_CRITICAL_CONCURRENCY`, `QUEUE_DEFAULT_CONCURRENCY`, `QUEUE_BACKGROUND_CONCURRENCY`, `QUEUE_POLL_INTERVAL_MS`, `CIRCUIT_BREAKER_FAILURE_THRESHOLD_PERCENT`, `CIRCUIT_BREAKER_HALF_OPEN_MAX`, `CIRCUIT_BREAKER_RECOVERY_MS`, `WORKFLOW_TIMEOUT_MS`, `SLA_ALERT_THRESHOLD` |
| **Observability** | Queue depth per priority, job processing duration, workflow success rate, collaboration duration, SLA compliance by action, circuit breaker state |
| **Performance targets** | Job enqueue P50 < 10ms. Workflow step execution P50 < 100ms (overhead). Queue processing P50 < 100ms from enqueue to start. |
| **Security requirements** | L2 — runtime metadata. L3 — workflow inputs may contain business data. |
| **Test strategy** | Unit: circuit breaker states (closed→open→half-open), workflow step orchestration, SLA percentile calculation. Integration: full workflow execution (sequential + parallel). Chaos: queue backpressure, circuit breaker threshold. |
| **Deployment dependencies** | PrismaModule, RedisModule, AiGatewayModule |
| **Rollout strategy** | Phase 7 with AiGatewayModule. Start with queue only. Enable workflow execution. Enable federation last. |

### 2.16 Module: AgentFrameworkModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Agent registry and lifecycle management — all agents self-register with capabilities |
| **Business Capabilities** | Agent registration/deregistration, capability discovery, role-based agent lookup, agent metadata management, agent health monitoring |
| **APIs consumed** | AiRuntimeModule (agent execution), AiGatewayModule (agent inference) |
| **APIs exposed** | 3 agent registry endpoints |
| **Events produced** | `agent.registered`, `agent.deregistered` |
| **Events consumed** | `admin.config.changed` (agent feature toggles) |
| **Aggregate roots** | AgentDefinition (AgentSession[]) |
| **Data ownership** | Agent registry, capability matrix, agent metadata. System of Record: Prisma |
| **Background jobs** | Agent health check (heartbeat), stale agent cleanup |
| **AI touchpoints** | All agents register here (6 agents: Seller, Buyer, Admin, Founder, Enterprise, Federation) |
| **External integrations** | None |
| **Permissions** | `ADMIN`: register/deregister agents. `AUTHENTICATED`: discover agents by capability. |
| **Feature flags** | `agent-framework-enabled` |
| **Configuration** | `AGENT_HEARTBEAT_INTERVAL_SECONDS`, `AGENT_STALE_TIMEOUT_MINUTES`, `MAX_AGENTS_PER_TYPE` |
| **Observability** | Registered agent count, agent health status, capability coverage |
| **Performance targets** | Agent lookup P50 < 10ms, P99 < 50ms. Registration P50 < 50ms. |
| **Security requirements** | L2 — agent metadata internal. Agent execution gated by user role and company permissions. |
| **Test strategy** | Unit: agent registration lifecycle, capability matching. Integration: agent registration→discovery→invocation flow. |
| **Deployment dependencies** | PrismaModule, AiGatewayModule |
| **Rollout strategy** | Phase 7. Deployed as global module. Agents self-register on module init. |

### 2.17 Module: NotificationModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Multi-channel notification delivery — in-app, email, SMS — with template management, marketing workflows, newsletter campaigns |
| **Business Capabilities** | Notification creation with templates, multi-channel delivery (in-app/email/SMS), template management with handlebars, marketing workflow automation, newsletter subscription/campaign, delivery tracking |
| **APIs consumed** | AWS SES (email), Twilio (SMS), RedisModule (notification queue) |
| **APIs exposed** | Notification management endpoints, template endpoints, workflow endpoints, newsletter endpoints |
| **Events produced** | `notification.sent`, `notification.read`, `notification.delivery.failed`, `notification.template.created/updated`, `notification.subscriber.subscribed/unsubscribed`, `notification.workflow.triggered/completed/failed` |
| **Events consumed** | All business events (for user-facing notifications) |
| **Aggregate roots** | Notification (NotificationDelivery[]), MarketingWorkflow (MarketingWorkflowLog[]), NewsletterCampaign, NotificationTemplate |
| **Data ownership** | Notifications, templates, delivery logs, subscribers, marketing workflows. System of Record: Prisma |
| **Background jobs** | Email queue (SES delivery), SMS queue (Twilio delivery), newsletter campaign dispatch, workflow trigger evaluation, bounce handling |
| **AI touchpoints** | None (pure delivery mechanism) |
| **External integrations** | AWS SES (email), Twilio (SMS) |
| **Permissions** | `USER`: own notifications. `ADMIN`: templates, workflows, newsletters. `SUPER_ADMIN`: all notifications. |
| **Feature flags** | `email-notifications`, `sms-notifications`, `in-app-notifications`, `notification-templates`, `marketing-workflows`, `newsletter-campaigns` |
| **Configuration** | `SES_REGION`, `SES_FROM_EMAIL`, `SES_FROM_NAME`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `NOTIFICATION_RETRY_MAX`, `NOTIFICATION_RETRY_BACKOFF_MS`, `NEWSLETTER_BATCH_SIZE`, `WORKFLOW_MAX_EXECUTIONS` |
| **Observability** | Notifications sent per channel, delivery success rate, email bounce rate, SMS failure rate, workflow execution count, newsletter open rate |
| **Performance targets** | In-app notification P50 < 20ms. Email queue P50 < 500ms. SMS queue P50 < 300ms. Batch newsletter: 10,000 recipients in < 5 minutes. |
| **Security requirements** | L2-L3 — notification content may contain business data (L3). Email/SMS content must not contain PII unless essential. |
| **Test strategy** | Unit: template rendering (handlebars), channel selection logic, workflow trigger evaluation. Integration: notification creation→delivery→read flow. Mock SES and Twilio for sandbox testing. |
| **Deployment dependencies** | PrismaModule, RedisModule |
| **Rollout strategy** | Phase 1 (with Identity). Start with in-app notifications. Enable email. Enable SMS. Enable marketing workflows and newsletters last. |

### 2.18 Module: MembershipModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Plan management, subscription lifecycle, billing, benefit allocation, usage tracking |
| **Business Capabilities** | Plan CRUD (8 plans: TRAD UP through Trade Elite), subscription management (create/cancel/upgrade/downgrade), billing with invoice generation, benefit allocation (AI credits, advertising credits, XP multiplier), usage tracking |
| **APIs consumed** | PaymentModule (subscription payment), GoCashModule (benefit rewards), AiGatewayModule (credit allocation) |
| **APIs exposed** | 5 plan endpoints, 7 subscription endpoints, 3 usage endpoints, 6 billing endpoints |
| **Events produced** | `subscription.created/updated/cancelled/expired/renewed`, `membership.upgrade.completed`, `membership.downgrade.completed`, `trial.started/expiring/ended`, `credit.allocated`, `benefit.used`, `plan.activated/deactivated`, `subscription.payment.failed/recovered` |
| **Events consumed** | `company.created` (assign default plan), `payment.captured` (confirm subscription payment), `payment.failed` (trigger subscription dunning) |
| **Aggregate roots** | Subscription, Plan |
| **Data ownership** | Plans, subscriptions, billing records, usage records, benefit allocations. System of Record: Prisma |
| **Background jobs** | Subscription renewal processing, expired subscription cleanup, trial expiry notification, dunning (failed payment retry), benefit expiry, usage rollup |
| **AI touchpoints** | Plan recommendation (AI suggests optimal plan), churn prediction (identify at-risk subscribers), upgrade timing (optimal upgrade moment) |
| **External integrations** | Razorpay (subscription payments) |
| **Permissions** | `SELLER/BUYER`: own subscription, available plans. `ADMIN`: all subscriptions, plan management. `SUPER_ADMIN`: plan pricing. |
| **Feature flags** | `membership-enabled`, `subscription-auto-renewal`, `trial-plans`, `usage-based-billing`, `ai-plan-recommendation` |
| **Configuration** | `DEFAULT_PLAN_SLUG`, `TRIAL_DURATION_DAYS`, `AUTO_RENEWAL_ENABLED`, `DUNNING_MAX_ATTEMPTS`, `DUNNING_INTERVAL_DAYS`, `PLAN_UPGRADE_PRORATION`, `PLAN_DOWNGRADE_POLICY` |
| **Observability** | Active subscriptions by plan, MRR (Monthly Recurring Revenue), churn rate, upgrade/downgrade rate, trial conversion rate, dunning success rate |
| **Performance targets** | Plan lookup P50 < 20ms. Subscription create P50 < 200ms. Usage tracking P50 < 50ms. |
| **Security requirements** | L3 — subscription data, billing info. Payment handled via PaymentModule. |
| **Test strategy** | Unit: subscription state machine, proration calculation, benefit allocation. Integration: full subscription lifecycle (trial→paid→upgrade→cancel). |
| **Deployment dependencies** | PrismaModule, PaymentModule |
| **Rollout strategy** | Phase 9. Start with static plans + manual subscription. Enable auto-renewal. Enable trial last. |

### 2.19 Module: AnalyticsModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Business analytics, reporting, tracking infrastructure, cohort/retention/funnel analysis |
| **Business Capabilities** | Dashboard metrics, report generation, event tracking (POST /track), cohort analysis, retention D7/D30/D90, funnel analysis, growth KPIs, search analytics |
| **APIs consumed** | All modules (aggregate queries), ClickHouse (event analytics) |
| **APIs exposed** | 7 analytics endpoints, 5 admin analytics endpoints, tracking endpoint, webhook ingestion |
| **Events produced** | `analytics.event.ingested`, `cohort.computed`, `retention.computed`, `funnel.computed`, `report.generated`, `kpi.threshold.breached`, `growth.kpi.updated` |
| **Events consumed** | All domain events (for analytics tracking) |
| **Aggregate roots** | KpiDefinition (KpiValue[], AlertDefinition[]), AlertDefinition (AlertEvent[]) |
| **Data ownership** | Aggregated metrics, reports, tracking events, cohort data. System of Record: Prisma + ClickHouse |
| **Background jobs** | Event ingestion processing (TrackerProcessor → 3 providers), cohort computation (scheduled), report generation (scheduled), data aggregation, raw event archival (30 days) |
| **AI touchpoints** | KPI threshold prediction, anomaly detection in metrics |
| **External integrations** | ClickHouse 24.12 |
| **Permissions** | `ADMIN`: all analytics. `SUPER_ADMIN`: raw event export. |
| **Feature flags** | `analytics-enabled`, `analytics-clickhouse`, `analytics-ai-insights`, `analytics-export` |
| **Configuration** | `CLICKHOUSE_URL`, `CLICKHOUSE_DATABASE`, `TRACKING_THROTTLE_PER_MINUTE`, `ANALYTICS_RETENTION_DAYS`, `COHORT_COMPUTE_SCHEDULE`, `REPORT_GENERATION_SCHEDULE` |
| **Observability** | Event ingestion rate, query latency, report generation duration, data freshness lag |
| **Performance targets** | Event ingestion: 1,000 events/sec sustained. Dashboard query P50 < 500ms, P99 < 2s. Report generation P50 < 30s. |
| **Security requirements** | L2 — aggregated analytics internal. Raw events may contain PII (L3). Export restricted to SUPER_ADMIN. |
| **Test strategy** | Unit: aggregation queries, cohort computation. Integration: event tracking→ClickHouse→dashboard query. Performance: 1M events ingestion benchmark. |
| **Deployment dependencies** | PrismaModule, ClickHouse |
| **Rollout strategy** | Phase 8. Start with Prisma-based aggregation (no ClickHouse dependency). Enable ClickHouse for scalability. Enable cohort/retention after 30 days of data. |

### 2.20 Module: FounderIntelligenceModule

| Dimension | Specification |
|-----------|--------------|
| **Purpose** | Executive intelligence — unified dashboard, KPI catalog, alert engine, health index, business score, correlation engine, executive reports |
| **Business Capabilities** | Morning brief, executive dashboard, health scoring (7-dimension weighted), KPI evaluation (20 KPIs across 6 domains), alert engine (6 definitions + CRUD), correlation engine (190 pairwise), executive priorities, timeline, reports |
| **APIs consumed** | All modules (aggregated data), EnterpriseIntelligenceModule (health index), GrowthIntelligenceModule (growth metrics), FinanceAggregatorModule (revenue), CommerceModule (marketplace metrics) |
| **APIs exposed** | 8 founder endpoints, 4 KPI endpoints, 3 alert endpoints, 5 executive agent endpoints, enterprise intelligence endpoints |
| **Events produced** | `kpi.threshold.breached`, `alert.triggered`, `report.generated` |
| **Events consumed** | All domain events (metric updates) |
| **Aggregate roots** | KpiDefinition (KpiValue[], AlertDefinition[]), AlertDefinition (AlertEvent[]) |
| **Data ownership** | KPI definitions, alert configurations, correlation matrices, health index configurations. No business data — all computed from other modules. |
| **Background jobs** | KPI evaluation (scheduled), alert engine evaluation, correlation recomputation, report generation, health score consolidation |
| **AI touchpoints** | Executive copilot (AI-generated brief), revenue forecast, user growth prediction, fraud intelligence, churn prediction, market trends, alert generation |
| **External integrations** | None (reads from all modules) |
| **Permissions** | `SUPER_ADMIN` — all endpoints. `ADMIN` — limited dashboard. |
| **Feature flags** | `founder-intelligence-enabled`, `executive-ai-copilot`, `auto-alerts`, `kpi-correlation` |
| **Configuration** | `FOUNDER_AI_CACHE_TTL_SECONDS`, `HEALTH_INDEX_WEIGHTS` (40/35/25), `ALERT_EVALUATION_INTERVAL_MINUTES`, `KPI_EVALUATION_SCHEDULE`, `ALERT_COOLDOWN_DEFAULT_MINUTES`, `REPORT_GENERATION_SCHEDULE` |
| **Observability** | KPI evaluation duration, alert trigger count, health score trend, report generation duration, cache hit rate |
| **Performance targets** | Dashboard load P50 < 1s, P99 < 3s (aggregates from 5+ services). KPI evaluation P50 < 500ms. Alert evaluation P50 < 100ms. |
| **Security requirements** | L2 — all data internal. L3 — financial metrics. SUPER_ADMIN only for raw data. |
| **Test strategy** | Unit: health score calculation (weighted 7-dimension), KPI evaluation (20 formulas), correlation engine (190 pairs). Integration: end-to-end dashboard aggregation (mock 5 downstream services). |
| **Deployment dependencies** | All modules Phase 0–3 (needs data from commerce, finance, growth) |
| **Rollout strategy** | Phase 8. Start with KPI catalog + dashboard. Enable alerts. Enable AI copilot in Phase 7+8 overlap. |

---

## 3. SPRINT ROADMAP

### 3.1 Phase 0: Foundation (Weeks 1-4)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Shared Kernel | PrismaModule setup | Singleton PrismaService, connection pooling, migration management, health check | 3 days | P0 | Critical | Low |
| | RedisModule setup | Cache service, rate limit service, OTP store, key prefix management | 2 days | P0 | Critical | Low |
| | OpenSearchModule setup | Index management, search/suggest/autocomplete, reindex pipeline | 3 days | P0 | Very High | Medium |
| Event Bus | Core event bus | EventBusService (publish/subscribe), event envelope, schema validation, DLQ | 5 days | P0 | Critical | Medium |
| | Outbox pattern | Event outbox table, publisher worker, idempotent consumer base | 3 days | P0 | Critical | Medium |
| | Schema registry | Schema registration, validation, versioning, compatibility check | 2 days | P0 | High | Low |
| Infrastructure | CI/CD pipeline | Build, test, deploy workflows for all apps | 3 days | P0 | Critical | Medium |
| | Docker compose | Dev and prod compose files with all services | 2 days | P0 | Critical | Low |
| | Monitoring stack | Prometheus metrics interceptor, Grafana dashboards, Sentry setup | 3 days | P0 | Critical | Low |

**Dependencies**: None
**Acceptance Criteria**: All shared services start up, health checks pass, end-to-end event publish→subscribe works
**Rollback Plan**: Feature flags disable shared services; module falls back to direct service calls
**Risk Assessment**: LOW — well-understood infrastructure patterns

### 3.2 Phase 1: Identity & Trust (Weeks 5-8)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Identity | User registration | Register (email), login, logout, JWT issuance, refresh token | 5 days | P0 | Critical | Low |
| | User profile | Profile CRUD, settings, password change, email/mobile verification | 3 days | P0 | Critical | Low |
| | Session management | Session creation/revocation/list, device tracking, concurrent session limit | 2 days | P1 | Very High | Low |
| | Social login | Google OAuth, LinkedIn OAuth integration | 3 days | P2 | High | Medium |
| | Role management | Role CRUD, role assignment, permission evaluation | 2 days | P1 | Very High | Low |
| Company | Company CRUD | Create/get/update, slug generation, GSTIN/PAN fields | 3 days | P0 | Critical | Low |
| | Member management | Add/remove/role change, member invitation, team management | 3 days | P1 | Very High | Low |
| | Onboarding flow | Company onboarding steps, completion detection, profile completeness | 2 days | P1 | Very High | Low |
| TradTrust | Trust score engine | 16-dimension calculation, scoring weights, score history | 5 days | P1 | Very High | High |
| | Verification flow | Company verification submit/review/approve/reject, document management | 4 days | P1 | Very High | Medium |
| | User verification | User KYC submit/review, level upgrade, document management | 3 days | P2 | High | Medium |
| | Risk assessment | Risk scoring, risk alerts, fraud signal detection | 3 days | P2 | High | High |

**Dependencies**: Phase 0
**Acceptance Criteria**: User can register→verify email→create company→invite members. Company trust score computed on creation.
**Rollback Plan**: Disable social login, disable auto-trust-scoring
**Risk Assessment**: MEDIUM — trust scoring algorithm is complex

### 3.3 Phase 2: Commerce Core (Weeks 9-14)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Catalog | Product CRUD | Product create/read/update/delete, media upload, spec management | 5 days | P0 | Critical | Low |
| | Category taxonomy | Category tree, subcategories, category admin | 3 days | P0 | Critical | Low |
| | Product publishing | Publish/unpublish workflow, status transitions, approval | 3 days | P1 | Very High | Low |
| | Bulk import | CSV/XLSX parsing, validation, batch import, error reporting | 4 days | P2 | Very High | Medium |
| | Quality scoring | Quality dimensions, scoring algorithm, score history | 3 days | P2 | High | Medium |
| RFQ | RFQ CRUD | Create/read/update/close RFQ, status transitions | 4 days | P0 | Critical | Low |
| | Supplier matching | Auto-match suppliers by category, trust score, location | 4 days | P1 | Very High | High |
| | RFQ AI analysis | Requirements extraction, completeness scoring, timeline prediction | 3 days | P2 | Very High | High |
| Quote | Quote CRUD | Create/read/update/submit/withdraw quote, status transitions | 4 days | P0 | Critical | Low |
| | Quote acceptance | Accept/reject flow, order creation trigger | 2 days | P0 | Critical | Low |
| | Quote AI analysis | Pricing recommendation, win probability, margin analysis | 3 days | P2 | Very High | High |
| Order | Order lifecycle | Create/confirm/ship/deliver/complete/cancel, status machine | 5 days | P0 | Critical | Medium |
| | Dispute management | File dispute, evidence, resolve, status tracking | 3 days | P2 | High | Medium |

**Dependencies**: Phase 1 (Companies, TradTrust)
**Acceptance Criteria**: Seller can create product→publish. Buyer can create RFQ→receive quotes→accept→order→pay→receive.
**Rollback Plan**: Disable AI analysis (fall back to basic CRUD). Disable auto-matching.
**Risk Assessment**: HIGH — order state machine complexity, concurrent status updates

### 3.4 Phase 3: Financial Engine (Weeks 15-20)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Payment | Payment capture | Payment initiation, Razorpay integration, webhook handling, idempotency | 5 days | P0 | Critical | High |
| | Payment methods | Card/UPI/netbanking/wallet, saved payment methods | 3 days | P1 | Very High | Medium |
| Escrow | Escrow hold/release | Escrow creation (on payment), release (on delivery), state machine | 4 days | P0 | Critical | High |
| | Escrow dispute | Freeze/unfreeze/refund, dispute lifecycle integration | 3 days | P2 | High | Medium |
| Settlement | Settlement processing | Create settlement on escrow release, process batch payout | 4 days | P0 | Critical | High |
| | Payout integration | Bank transfer via Razorpay payouts, retry, failure handling | 3 days | P1 | Very High | High |
| Commission | Commission engine | Rule priority (5 levels), calc types (percentage/fixed/zero), scope filtering | 4 days | P1 | Very High | Medium |
| | Commission admin | Rule CRUD, calc preview, summary dashboard | 2 days | P2 | High | Low |
| Refund | Refund processing | Initiate/approve/process/reject refund, gateway refund, booking refund | 4 days | P1 | Very High | High |
| Reconciliation | Financial reconciliation | Gateway vs escrow vs settlement matching, discrepancy detection, export | 3 days | P2 | Very High | High |

**Dependencies**: Phase 2 (Order module)
**Acceptance Criteria**: Payment→escrow→settlement→payout flow works end-to-end. Commission applied correctly.
**Rollback Plan**: Disable auto-settlement (manual release). Test mode payments only until stabilized.
**Risk Assessment**: VERY HIGH — financial transactions, real money, external gateway dependencies. Every operation must be idempotent.

### 3.5 Phase 4: Growth & Rewards (Weeks 21-24)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| GoCash | Wallet CRUD | Wallet creation, balance inquiry, transaction history | 3 days | P1 | Very High | Medium |
| | Credit/Debit | Append-only transactions, idempotent credit, balance invariant | 4 days | P1 | Very High | High |
| | Redemption | Request/approve/reject/process, balance validation | 3 days | P2 | High | Medium |
| Rewards | Platform rewards | Reward for signup, order, publish, review, booking | 4 days | P1 | Very High | Medium |
| | Reward idempotency | Idempotency key per reward type per entity, duplicate prevention | 2 days | P1 | Very High | Low |
| Referral | Referral codes | Code generation, validation, fraud detection, reward processing | 3 days | P2 | High | Medium |
| Campaign | Campaign engine | Campaign CRUD, rules engine, eligibility check, claim processing, budget tracking | 5 days | P2 | Very High | High |
| Ecosystem | XP/Levels | XP tracking, level calculation, streak tracking | 3 days | P2 | High | Medium |
| | Badges/Achievements | Badge definitions, achievement criteria, badge award | 3 days | P2 | High | Medium |
| | Leaderboard | Company ranking, score computation, period-based leaderboard | 2 days | P3 | Medium | Low |

**Dependencies**: Phase 3 (rewards depend on payments/settlements), Phase 2 (product publish reward)
**Acceptance Criteria**: Wallet created for every company. Rewards earned for platform actions. Referral code works end-to-end.
**Rollback Plan**: Disable reward triggers (events consumed but no-op). Wallet balance unaffected.
**Risk Assessment**: MEDIUM — idempotency is critical, append-only ledger is well-understood

### 3.6 Phase 5: Services Marketplace (Weeks 25-28)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Professional | Professional registration | Profile creation, service listing, certification, portfolio | 4 days | P1 | Very High | Low |
| | Professional search | OpenSearch index, faceted search, V2 search API | 3 days | P1 | Very High | Medium |
| Booking | Booking lifecycle | Create/confirm/in-progress/complete/cancel, state machine | 5 days | P1 | Very High | Medium |
| | Booking payment | Payment integration, escrow hold/release for services | 3 days | P1 | Very High | High |
| Proposals | Proposal CRUD | Create/submit/accept/reject, RFP flow | 3 days | P2 | High | Low |
| Reviews | Review system | Create/read/flag/moderate, verified-booking check | 3 days | P2 | High | Low |
| Financial | Booking financial orchestration | Escrow hold on payment, release on completion, settlement, commission | 4 days | P1 | Very High | High |
| | Commission for services | Rule for service category, professional-specific rates | 2 days | P2 | High | Medium |

**Dependencies**: Phase 2 (catalog for service categories), Phase 3 (payment/escrow for booking)
**Acceptance Criteria**: Professional can register→list service. Buyer can search→book→pay→complete→review.
**Rollback Plan**: Disable booking payment (free bookings), disable OpenSearch (Prisma fallback)
**Risk Assessment**: MEDIUM — booking state machine simpler than order

### 3.7 Phase 6: Social & Community (Weeks 29-31)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Community | Community CRUD | Create public/private, member join/leave, roles | 3 days | P2 | High | Low |
| | Community management | Update, delete, member management, privacy enforcement | 2 days | P2 | Medium | Low |
| Posts | Post CRUD | Create with media/link, edit, soft-delete, feed | 4 days | P2 | Very High | Low |
| | Engagement | Like, share, save, pin, engagement tracking | 2 days | P2 | High | Low |
| Comments | Threaded comments | Create, reply, soft-delete, paginated loading | 3 days | P2 | High | Medium |
| Follows | Follow system | Follow/unfollow, follower/following lists, follow counts | 2 days | P2 | Medium | Low |
| AI Moderation | Content moderation | Spam/offensive/duplicate detection, auto-flag, mod queue | 3 days | P2 | High | High |
| | Content assistance | Generate, rewrite, summarize, translate, hashtag suggestions | 3 days | P3 | Medium | High |

**Dependencies**: Phase 1 (Identity for user context)
**Acceptance Criteria**: User can create community→post→comment→like→follow. AI moderation flags inappropriate content.
**Rollback Plan**: Disable AI moderation (manual review only), disable AI content assist
**Risk Assessment**: LOW — well-understood social patterns

### 3.8 Phase 7: AI Platform (Weeks 32-37)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Gateway | Provider integration | OpenRouter/Gemini/Groq real HTTP clients, SSE streaming, retry, timeout | 5 days | P1 | Very High | High |
| | Model registry | Model catalog, capability mapping, cost tracking, fallback chains | 3 days | P1 | Very High | Medium |
| | Credit enforcement | Credit check before inference, deduction, balance tracking | 3 days | P1 | Very High | Medium |
| | Prompt management | Prompt CRUD, versioning, activation, variable injection | 2 days | P1 | High | Low |
| | Governance | Audit logging, cost budgets, rate limiting, human approval | 3 days | P2 | Very High | Medium |
| Runtime | Job queues | BullMQ priority queues (critical/default/background), concurrency control | 3 days | P1 | Very High | Medium |
| | Circuit breaker | Percentage-based threshold, half-open, auto-recovery | 2 days | P1 | High | Medium |
| | SLA monitoring | P50/P95/P99 tracking per action, alert thresholds | 2 days | P1 | High | Low |
| | Workflow engine | Multi-step workflow, sequential/parallel/conditional patterns | 4 days | P2 | Very High | High |
| Agents | Seller Agent | 8 capabilities: smart sell, product intel, demand, pricing, competition, market | 4 days | P2 | Very High | High |
| | Buyer Agent | 8 capabilities: procurement, RFQ assistant, supplier intel, negotiation | 4 days | P2 | Very High | High |
| | Admin Agent | 10 capabilities: system health, fraud, revenue, growth, moderation | 3 days | P2 | Very High | High |
| | Founder Agent | 8 capabilities: copilot, decision center, risk, opportunity, KPI, coordination | 4 days | P2 | Very High | High |
| | Federation | Multi-agent collaboration, capability matching, 6 execution patterns | 5 days | P2 | Very High | Very High |
| AI Services | RFQ AI | 10 features (requirements, match, pricing, timeline, risk, etc.) | 4 days | P2 | Very High | High |
| | Quote AI | 10 features (pricing, win-probability, margin, competitiveness, etc.) | 4 days | P2 | Very High | High |
| | Finance AI | 10 features (credit risk, cash flow, collection, fraud, etc.) | 4 days | P3 | Very High | High |
| | Search AI | 11 features (semantic, intent, similar, recommendations, etc.) | 4 days | P2 | Very High | High |
| | Admin AI | 12 features (brief, forecast, fraud, churn, alerts, etc.) | 4 days | P2 | Very High | High |
| | TradeTalk AI | 15 features (generate, moderate, summarize, translate, etc.) | 4 days | P3 | High | High |

**Dependencies**: Phase 0 (Redis for queues), Phase 1 (Identity for auth)
**Acceptance Criteria**: AI Gateway routes requests, credits enforced, circuit breaker works, all 6 agents respond, federation executes multi-step workflows
**Rollback Plan**: Disable AI features per domain (not a platform blocker)
**Risk Assessment**: VERY HIGH — external AI providers (availability, latency, cost), complex multi-agent coordination, prompt injection prevention

### 3.9 Phase 8: Intelligence Layer (Weeks 38-41)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Analytics | Event tracking pipeline | POST /track, TrackerProcessor, 3 providers (ClickHouse + GA4 + UsageEvent) | 4 days | P1 | Very High | Medium |
| | Dashboard metrics | Aggregation queries, dashboard API, metric computation | 3 days | P1 | Very High | Low |
| | Cohort/Retention | Cohort computation, D7/D30/D90 retention, funnel analysis | 4 days | P2 | Very High | High |
| Growth Intel | Acquisition funnel | 5-stage funnel (visitor→register→company→first order→repeat) | 3 days | P2 | Very High | Medium |
| | Campaign attribution | UTM tracking, campaign performance, multi-touch attribution | 4 days | P2 | Very High | High |
| | Growth KPIs | CAC, LTV, activation rate, referral conversion | 3 days | P2 | Very High | High |
| Founder Intel | KPI catalog | 20 KPIs across 6 domains, evaluation engine, status computation | 4 days | P2 | Very High | Medium |
| | Alert engine | 6 pre-seeded definitions, Redis cooldown, CRUD lifecycle | 3 days | P2 | Very High | Medium |
| | Health index | Consolidated 7-dimension health (40/35/25 weights), recommendations | 3 days | P2 | Very High | Medium |
| | Correlation engine | Pairwise correlation (190 pairs), strength classification, Redis cache | 3 days | P3 | High | High |
| Enterprise Intel | Revenue forecast | Linear regression forecasting, period-over-period growth | 3 days | P2 | Very High | Medium |
| | Digital twin | Catalog optimization engine, 8 action plans, what-if simulation | 4 days | P3 | Very High | Very High |
| | Market intelligence | Category intelligence, geo intelligence, supplier intelligence | 3 days | P3 | High | Medium |

**Dependencies**: Phase 2 (commerce data), Phase 3 (financial data), Phase 4 (growth data)
**Acceptance Criteria**: Analytics dashboard shows real metrics. KPI evaluation works. Alerts trigger on threshold breach. Health index computed.
**Rollback Plan**: Disable AI-powered insights, use basic aggregation only
**Risk Assessment**: MEDIUM — aggregation complexity, ClickHouse dependency

### 3.10 Phase 9: Platform Services (Weeks 42-45)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Membership | Plan CRUD | Create/read/update plans, 8 plan tiers, benefit configuration | 3 days | P1 | Very High | Low |
| | Subscription lifecycle | Create/cancel/upgrade/downgrade, status machine, auto-renewal | 4 days | P1 | Very High | Medium |
| | Billing | Invoice generation, payment integration, credit allocation | 3 days | P2 | Very High | Medium |
| | Usage tracking | Per-plan usage limits, tracking, overage detection | 2 days | P2 | High | Low |
| CRM | Lead management | Lead create/update/score/convert, source tracking, pipeline | 3 days | P2 | Very High | Low |
| | Campaign management | Campaign CRUD, lead assignment, campaign analytics | 3 days | P2 | High | Medium |
| Advertising | Ad campaign CRUD | Create/update/pause/stop, ad types (9), pricing models (CPC/CPM/FIXED) | 4 days | P2 | Very High | Medium |
| | Ad funding | GOCASH wallet integration, fund→activate, budget tracking | 2 days | P2 | Very High | Medium |
| | Ad placements | Placement API, impression/click tracking, auto-promotion | 3 days | P2 | Very High | Medium |
| Support | Ticket system | Create/assign/update/resolve/close, message thread, categories | 4 days | P2 | Very High | Low |
| | Knowledge base | Articles, categories, search, AI article suggestions | 3 days | P3 | High | Medium |

**Dependencies**: Phase 1 (Identity), Phase 4 (GoCash for advertising), Phase 3 (Payment for billing)
**Acceptance Criteria**: Plans available, subscription flows work, CRM leads trackable, advertising campaigns fundable, tickets resolvable
**Rollback Plan**: Disable paid plans (free tier only), disable advertising, disable CRM
**Risk Assessment**: LOW to MEDIUM

### 3.11 Phase 10: Integration & Commerce (Weeks 46-48)

| Epic | Stories | Tasks | Estimate | Priority | Business Value | Technical Risk |
|------|---------|-------|----------|----------|---------------|---------------|
| Knowledge Graph | Entity ingestion | Entity creation from domain events, relationship mapping | 4 days | P2 | Very High | High |
| | Graph query | Entity search, relationship traversal, path finding | 3 days | P2 | Very High | High |
| | Graph inference | Reasoning operations, recommendation from graph | 3 days | P3 | High | Very High |
| Memory | Fragment management | Memory CRUD, TTL-based expiry, context assembly | 3 days | P2 | High | Medium |
| | Consolidation | Cross-session consolidation, importance scoring | 3 days | P3 | High | High |
| Admin Console | Admin dashboard | System health, audit log, feature flags, configuration | 3 days | P1 | Very High | Low |
| | Search console | Index management, synonym management, analytics, health | 3 days | P2 | Very High | Low |
| | AI console | Model status, provider health, cost dashboard, credit management | 2 days | P2 | Very High | Low |
| Monitoring | Alertmanager | Production alert rules, notification routing, on-call integration | 2 days | P1 | Very High | Low |
| | Uptime monitoring | Synthetic checks, endpoint monitoring, SLA tracking | 2 days | P1 | Very High | Low |

**Dependencies**: All phases (needs data from all modules)
**Acceptance Criteria**: Knowledge Graph shows entity relationships. Admin Console manages all modules. Monitoring alerts on real conditions.
**Rollback Plan**: Disable Knowledge Graph (not business-critical), disable Memory (AI works without long-term memory)
**Risk Assessment**: MEDIUM — graph database complexity, entity relationship model

---

## 4. DEPENDENCY MATRIX

### 4.1 Module Dependency Graph

```
Phase 0 (Foundation)
├── PrismaModule [NONE]
├── RedisModule [NONE]
├── OpenSearchModule [NONE]
└── EventBusModule [RedisModule]

Phase 1 (Identity & Trust)
├── IdentityModule [PrismaModule, RedisModule, NotificationModule]
├── CompaniesModule [PrismaModule, IdentityModule, OpenSearchModule]
└── TradTrustModule [PrismaModule, CompaniesModule, IdentityModule]
    └── VerificationModule [PrismaModule, TradTrustModule]

Phase 2 (Commerce Core)
├── EnterpriseCatalogModule [PrismaModule, OpenSearchModule, TradTrustModule, AIGatewayModule*]
├── SmartRfqModule [PrismaModule, TradTrustModule, CatalogModule, AIGatewayModule*]
├── QuoteModule [PrismaModule, SmartRfqModule, AIGatewayModule*]
└── OrderModule [PrismaModule, QuoteModule, PaymentModule*, InventoryModule*]

Phase 3 (Financial Engine)
├── PaymentModule [PrismaModule, Razorpay]
├── EscrowModule [PrismaModule, PaymentModule]
├── SettlementModule [PrismaModule, EscrowModule, PayoutService]
├── CommissionModule [PrismaModule, MembershipModule*]
└── RefundModule [PrismaModule, PaymentModule, EscrowModule]

Phase 4 (Growth & Rewards)
├── GoCashModule [PrismaModule]
├── ReferralModule [PrismaModule, GoCashModule]
├── CampaignModule [PrismaModule, GoCashModule]
└── EcosystemModule [PrismaModule, GoCashModule, NotificationModule]

Phase 5 (Services Marketplace)
├── TradeServModule [PrismaModule, OpenSearchModule, PaymentModule, GoCashModule*, TradTrustModule*]
└── BookingModule [TradeServModule, PaymentModule, EscrowModule]

Phase 6 (Social & Community)
└── TradeTalkModule [PrismaModule, AIGatewayModule*]

Phase 7 (AI Platform)
├── AIGatewayModule [PrismaModule, RedisModule, OpenRouter/Gemini/Groq]
├── AiRuntimeModule [PrismaModule, RedisModule, AIGatewayModule]
├── AgentFrameworkModule [PrismaModule, AIGatewayModule]
├── FederationModule [AiRuntimeModule, AgentFrameworkModule]
└── Agent Services (all) [AIGatewayModule, domain modules]

Phase 8 (Intelligence Layer)
├── AnalyticsModule [PrismaModule, ClickHouse]
├── GrowthIntelligenceModule [PrismaModule, ClickHouse]
└── FounderIntelligenceModule [ALL modules + EnterpriseIntelligenceModule]

Phase 9 (Platform Services)
├── MembershipModule [PrismaModule, PaymentModule, GoCashModule]
├── CrmModule [PrismaModule]
├── AdvertisingModule [PrismaModule, GoCashModule]
└── SupportModule [PrismaModule, IdentityModule]

Phase 10 (Integration)
├── KnowledgeGraphModule [PrismaModule, EventBusModule]
├── MemoryModule [PrismaModule, RedisModule]
└── AdminConsoleModule [ALL modules]

(* = optional dependency, degrades gracefully if unavailable)
```

### 4.2 External Service Dependencies

| Service | Type | Used By | Critical Path | Fallback |
|---------|------|---------|---------------|----------|
| PostgreSQL 16 | Database | All modules | Phase 0 | None (SoR) |
| Redis 7 | Cache/Queue | Identity, AI, Event Bus | Phase 0 | In-process fallback |
| Razorpay | Payment Gateway | Payment, Membership | Phase 3 | Manual payment (admin) |
| OpenRouter | AI Provider | AI Gateway | Phase 7 | Gemini/Groq fallback |
| Google Gemini | AI Provider (fallback) | AI Gateway | Phase 7 | Degraded AI |
| Groq | AI Provider (fallback) | AI Gateway | Phase 7 | Degraded AI |
| AWS SES | Email | Notification | Phase 1 | Console log (dev) |
| Twilio | SMS | Notification | Phase 1 | Console log (dev) |
| OpenSearch 2.17 | Search | Catalog, TradeServ, Search | Phase 2 | Prisma search fallback |
| ClickHouse 24.12 | Analytics | Analytics, Growth Intel | Phase 8 | Prisma aggregation |
| Google OAuth | Social Auth | Identity | Phase 1 | Email+password only |
| LinkedIn OAuth | Social Auth | Identity | Phase 1 | Email+password only |
| Tavily | Web Search | AI (agents) | Phase 7 | Disabled |
| Firecrawl | Web Scraping | AI (agents) | Phase 7 | Disabled |

### 4.3 Deployment Order

```
1. PostgreSQL + Redis                          [Infrastructure — always first]
2. OpenSearch                                  [Search infrastructure]
3. ClickHouse                                  [Analytics infrastructure — optional]
4. API (NestJS)                                [Backend — all modules bundled]
5. Web (Next.js)                               [Frontend — depends on API]
6. Nginx                                       [Reverse proxy — depends on API + Web]
7. Prometheus + Grafana                        [Monitoring — always last]
```

---

## 5. TESTING STRATEGY

### 5.1 Test Pyramid

| Layer | Tools | Coverage Target | Who Writes |
|-------|-------|-----------------|------------|
| **Unit** | Jest, Vitest | 90%+ (service logic) | Developer |
| **Integration** | Supertest, TestContainers | 75%+ (API endpoints) | Developer |
| **Contract** | Pact, Dredd | 100% API contracts | Developer + API Owner |
| **E2E** | Playwright, Cypress | Critical paths | QA |
| **Performance** | k6, Artillery | P50/P95/P99 targets | Performance Engineer |
| **Security** | OWASP ZAP, SonarQube | OWASP Top 10 | Security Engineer |
| **Chaos** | Chaos Monkey, Gremlin | Resilience patterns | SRE |

### 5.2 Per-Module Test Requirements

| Module | Unit Coverage | Integration Paths | Contract Tests | E2E Flows |
|--------|---------------|-------------------|----------------|-----------|
| Identity | 90% | Register→Login→Refresh→Logout | All 11 auth endpoints | User registration → verified → login |
| Companies | 90% | Create Company→Add Member→Update Profile | All 5 company endpoints | Company onboarding complete |
| TradTrust | 95% | Score Calculation→Verification→Dispute | All 4 score endpoints | Company verified → score recalculated |
| Catalog | 90% | Create Product→Publish→Quality Score | All 11 product endpoints | Product create → publish → search |
| RFQ | 90% | Create RFQ→Receive Quotes→Award | All 7 RFQ endpoints | RFQ create → quote → award |
| Quote | 90% | Create Quote→Submit→Accept→Order | All 7 quote endpoints | Quote submit → accept → order |
| Order | 95% | Order→Payment→Ship→Deliver→Complete | All 6 order endpoints | Full order lifecycle |
| Payment | 95% | Initiate→Capture→Refund→Reconciliation | All 5 payment endpoints | Payment flow + webhook |
| Escrow | 95% | Hold→Release→Freeze→Dispute→Refund | All 6 escrow endpoints | Escrow hold → release |
| Settlement | 95% | Create→Process→Complete→Reconciliation | All 3 settlement endpoints | Full settlement cycle |
| GoCash | 95% | Credit→Debit→Redeem→Reward | All 4 wallet endpoints | Reward earn → redeem |
| TradeServ | 90% | Register→Service→Book→Complete→Review | All 6 booking endpoints | Full booking lifecycle |
| TradeTalk | 85% | Community→Post→Comment→Like→Follow | All 7 post endpoints | Social interaction flow |
| AI Gateway | 90% | Invoke→Inference→Credit→Audit | All 4 invocation endpoints | AI request → response → audit |
| Workflow | 90% | Create→Execute→Step→Complete→Fail | All workflow endpoints | Multi-step workflow execution |
| Notification | 85% | Create→Deliver→Read→Channel fallback | All notification endpoints | Notification delivery to all channels |
| Membership | 90% | Subscribe→Upgrade→Pay→Cancel | All 7 subscription endpoints | Full subscription lifecycle |
| Analytics | 85% | Track→Aggregate→Report→Export | All 7 analytics endpoints | Event → dashboard → report |
| Founder Intel | 90% | Dashboard→KPI→Alert→Health→Correlation | All 8 founder endpoints | Executive dashboard aggregation |

### 5.3 Contract Testing

Every API endpoint defined in `TRADINGO-API-CONTRACTS.md` must have a contract test:

```
1. Provider (API) publishes OpenAPI spec → Pact broker
2. Consumer (frontend, other service) verifies against provider
3. Breaking changes detected before deployment
```

**Contract Test Coverage**: 100% of public + internal APIs. Admin APIs tested but lower priority.

### 5.4 E2E Critical Paths

| Path | Modules Involved | Frequency | Criticality |
|------|-----------------|-----------|-------------|
| User Registration → Company → Verification | Identity, Companies, TradTrust | Every deploy | P0 |
| Product Create → Publish → Search | Catalog, OpenSearch | Every deploy | P0 |
| RFQ → Quote → Accept → Order → Pay | RFQ, Quote, Order, Payment, Escrow | Every deploy | P0 |
| Order → Ship → Deliver → Complete + Settlement | Order, Escrow, Settlement | Every deploy | P0 |
| Booking → Confirm → Pay → Complete → Review | TradeServ, Payment, Escrow | Daily | P1 |
| GoCash Reward Earn → Check Balance → Redeem | GoCash | Daily | P1 |
| Notification → All Channels → Read | Notification | Daily | P2 |
| AI Gateway → Inference → Credit Deduction | AI Gateway | Daily | P2 |

---

## 6. DEPLOYMENT STRATEGY

### 6.1 Environment Architecture

| Environment | Purpose | PostgreSQL | Redis | OpenSearch | ClickHouse | AI Providers |
|-------------|---------|------------|-------|------------|------------|--------------|
| **local** | Developer workstation | Docker | Docker | Docker | Docker | Mock/stub |
| **dev** | Integration testing | Shared dev instance | Shared dev | Shared dev | Shared dev | Sandbox keys |
| **staging** | Pre-production validation | Isolated staging | Isolated staging | Isolated staging | Isolated staging | Test mode |
| **production** | Live traffic | HA Cluster | HA Cluster | HA Cluster | HA Cluster | Production keys |
| **dr** | Disaster recovery | Cross-region replica | Cross-region replica | Cross-region replica | Cross-region replica | Read-only |

### 6.2 Deployment Model

```
┌─────────────────────────────────────────────────────┐
│                     Nginx (Reverse Proxy)             │
│  client_max_body_size 100M, WebSocket, TLS 1.3       │
├──────────────────────┬──────────────────────────────┤
│  API (NestJS)        │  Web (Next.js)                │
│  Port 3001           │  Port 3000                    │
│  Replicas: 2-5       │  Replicas: 2-5                │
│  Health: /live, /ready│  Health: /api/health          │
├──────────┬───────────┴───────┬──────────────────────┤
│  Redis   │  PostgreSQL       │  OpenSearch           │
│  Port 6379│  Port 5432       │  Port 9200            │
├──────────┴──────────────────┴───────────────────────┤
│  Prometheus :9100  │  Grafana :3002  │  ClickHouse :8123│
└─────────────────────────────────────────────────────┘
```

### 6.3 Deployment Pipeline

```
Git Push → GitHub Actions
├── Lint (ESLint, Prettier)
├── Type Check (tsc —noEmit)
├── Unit Tests (jest —coverage)
├── Build (nest build / next build)
├── Integration Tests (docker compose up)
├── Contract Tests (pact verify)
├── Build Docker Images
├── Push to Registry (Docker Hub / ECR)
├── Deploy to Staging
│   ├── Smoke Tests (critical paths)
│   ├── Performance Tests (if significant changes)
│   └── E2E Tests (Playwright)
└── Deploy to Production (approval gate)
    ├── Canary (10% traffic, 5 min)
    ├── Rolling update (per pod)
    └── Health check verification
```

### 6.4 Rollback Procedure

| Scenario | Detection | Action | RTO | RPO |
|----------|-----------|--------|-----|-----|
| API crash-loop | Health check failure | Revert to last known good image | < 2 min | 0 (stateless) |
| Migration error | Prisma migrate failure | `migrate down` + revert deploy | < 5 min | < 1 min |
| Data corruption | Monitoring alert | Restore from backup + point-in-time recovery | < 30 min | < 5 min |
| Payment bug | Transaction monitoring | Feature flag disable payment | < 1 min | 0 (idempotent) |
| AI provider outage | Circuit breaker | Auto-failover to secondary | < 30s | 0 |

---

## 7. ROLLOUT PLAN

### 7.1 Rollout Phases

| Phase | Duration | Modules | User Impact | Rollout Strategy |
|-------|----------|---------|-------------|------------------|
| **0** | 4 weeks | Foundation | None (platform) | Infrastructure-as-code |
| **1** | 4 weeks | Identity, Company, Trust | Registration, login, company setup | Feature-flagged (social login, MFA) |
| **2** | 6 weeks | Catalog, RFQ, Quote, Order | Full commerce flow | Feature-flagged (AI features) |
| **3** | 6 weeks | Payment, Escrow, Settlement | Financial transactions | Test mode first, live mode flag |
| **4** | 4 weeks | GoCash, Rewards | Wallet, rewards | Phased: wallet→rewards→redeem |
| **5** | 4 weeks | TradeServ | Service marketplace | Beta flag for early professionals |
| **6** | 3 weeks | TradeTalk | Community features | Public communities first |
| **7** | 6 weeks | AI Platform | AI-powered features | Per-domain AI flags |
| **8** | 4 weeks | Intelligence | Analytics dashboards | Read-only dashboards first |
| **9** | 4 weeks | Membership, CRM, Ads, Support | Monetization | Free tier + paid flag |
| **10** | 3 weeks | Knowledge Graph, Admin | Advanced features | Non-blocking features |

### 7.2 Go-Live Criteria (Production)

| Gate | Criteria | Verification |
|------|----------|--------------|
| **G1** | All P0 endpoints respond with correct status codes | Smoke tests pass |
| **G2** | Payment→escrow→settlement flow verified with ₹1 transaction | E2E test passes |
| **G3** | User registration→email verification→login→company creation works | E2E test passes |
| **G4** | Product→RFQ→Quote→Order flow works with valid data | E2E test passes |
| **G5** | Monitoring alerts configured for all P0 services | Dashboard review |
| **G6** | Rollback procedure documented and tested | DR drill completed |
| **G7** | All external integrations health-checked | Integration test passes |
| **G8** | Secrets rotated (no default/placeholder values) | Security audit |
| **G9** | Rate limiting configured for all public endpoints | Config review |
| **G10** | GDPR data retention and PII purge verified | Compliance review |

### 7.3 Regional Rollout Plan

```
Phase 1: India (domestic market)
├── INR currency, GST compliance, Indian payment methods (UPI/Netbanking)
├── Indian mobile number format, OTP via SMS
└── Indian business documents (GSTIN, PAN)

Phase 2: UAE, Middle East
├── AED currency, VAT compliance
├── International payment methods
└── English + Arabic localization

Phase 3: Southeast Asia (Singapore, Malaysia, Indonesia)
├── SGD/MYR/IDR currencies
├── Regional payment gateways
└── English + Bahasa localization
```

---

## 8. OPERATIONAL READINESS

### 8.1 Runbook Checklist

| Document | Owner | Reviewed |
|----------|-------|----------|
| Deployment runbook | Platform Eng | Pre-Phase 0 |
| Incident response runbook | SRE | Pre-Phase 3 |
| Database recovery runbook | DBA | Pre-Phase 3 |
| Security incident runbook | Security | Pre-Phase 1 |
| AI provider failover runbook | AI Eng | Pre-Phase 7 |
| Payment incident runbook | Finance Eng | Pre-Phase 3 |
| On-call escalation matrix | SRE | Pre-Phase 1 |

### 8.2 On-Call Setup

| Tier | Response Time | Coverage | Escalation |
|------|---------------|----------|------------|
| **T1** | < 5 min | Business hours | T2 after 15 min |
| **T2** | < 15 min | 24/7 (P0/P1 only) | T3 after 30 min |
| **T3** | < 60 min | 24/7 | Engineering lead |
| **T4** | Next business day | Business hours | CTO / Founder |

### 8.3 Backup Strategy

| Data | Frequency | Retention | Recovery Point | Recovery Time |
|------|-----------|-----------|----------------|---------------|
| PostgreSQL | Hourly (WAL), Daily (full) | Daily: 30 days, Weekly: 12 weeks, Monthly: 12 months | < 1 hour | < 30 min (from WAL) |
| Redis | Snapshot every 6 hours | 7 days | < 6 hours | < 10 min |
| OpenSearch | Snapshot daily | 30 days | < 24 hours | < 1 hour |
| ClickHouse | Backup daily | 30 days | < 24 hours | < 2 hours |
| Media (S3) | Cross-region replication | Indefinite | Near-zero | Instant |
| Config/Env | Version-controlled | Git history | Point-in-time | < 10 min |

### 8.4 Incident Severity Levels

| Severity | Definition | Response SLA | Examples |
|----------|-----------|-------------|----------|
| **P0 — Critical** | Platform down, data loss, payment failures | 5 min | API unavailable, DB corruption, payment gateway down |
| **P1 — High** | Major feature unavailable, degraded performance | 15 min | Search down, email delivery failed, AI timeout |
| **P2 — Medium** | Non-critical feature unavailable | 1 hour | Analytics stale, notification delayed, social feed slow |
| **P3 — Low** | Cosmetic, minor bug, no user impact | Next business day | UI typo, non-functional button, outdated docs |

---

## 9. QUALITY GATES

### 9.1 Mandatory Exit Criteria per Module

| # | Gate | Verification | Enforced By |
|---|------|-------------|-------------|
| 1 | **API Contract Complete** | OpenAPI spec matches API Contracts document | CI pipeline (contract test) |
| 2 | **Unit Test Coverage ≥ 85%** | Istanbul/Jest coverage report | CI pipeline (threshold) |
| 3 | **Integration Tests Pass** | All API endpoint integration tests green | CI pipeline (gate) |
| 4 | **No Critical/High Vulnerabilities** | SonarQube / Snyk scan | CI pipeline (gate) |
| 5 | **TypeScript Compilation (noEmit)** | `tsc --noEmit` passes with 0 errors | CI pipeline (gate) |
| 6 | **Event Contracts Registered** | Event type registered in Schema Registry | Schema Registry audit |
| 7 | **Observability Instrumented** | Metrics, logs, traces, health check endpoint | Code review + dashboard |
| 8 | **Documentation Updated** | README, API docs, runbook updated | PR checklist |
| 9 | **Performance Baseline Met** | P50/P95 within targets | Performance CI gate |
| 10 | **Security Review Passed** | OWASP scan, dependency audit, secrets scan | Security pipeline (gate) |

### 9.2 Per-Phase Quality Gates

| Phase | Pre-Deploy Gate | Post-Deploy Gate |
|-------|----------------|------------------|
| **0** | All shared services health check passed | E2E event publish→subscribe verified |
| **1** | Auth flow E2E passed, trust score algorithm verified | Registration→verification→company flow verified |
| **2** | Product→RFQ→Quote→Order E2E passed | Payment integration E2E passed |
| **3** | Razorpay test mode verified, escrow state machine tested | ₹1 transaction→escrow→settlement flow verified |
| **4** | Wallet create→credit→balance verified | Reward earn→wallet credit→notification flow verified |
| **5** | Professional→Service→Booking E2E passed | Booking→payment→complete→review flow verified |
| **6** | Community→Post→Comment→Like E2E passed | AI moderation accuracy ≥ 80% |
| **7** | AI Gateway→Inference→Credit flow verified | All 6 agents respond correctly |
| **8** | Analytics pipeline (event→aggregation→dashboard) verified | KPI→Alert→Health Index flow verified |
| **9** | Subscription→Payment→Benefit flow verified | Ad funding→placement→impression flow verified |
| **10** | Knowledge Graph entity ingestion verified | Admin dashboard shows all module health |

### 9.3 Release Approval Gates

| Gate | Approver | Criteria |
|------|----------|----------|
| **Architecture Review** | Solution Architect | All changes comply with frozen architecture |
| **Code Review** | Senior Engineer | 2 approvals, no unresolved comments |
| **Test Review** | QA Lead | All test gates pass, no P0/P1 bugs open |
| **Security Review** | Security Lead | No critical/high vulnerabilities |
| **Performance Review** | Performance Eng | Latency, throughput, and resource usage within targets |
| **Business Approval** | Product Owner | Feature meets acceptance criteria |
| **Final Sign-off** | CTO / Founder | All gates passed, go-live checklist complete |

---

## 10. FINAL IMPLEMENTATION CHECKLIST

### 10.1 Pre-Development

| # | Item | Owner | Due |
|---|------|-------|-----|
| [ ] | Architecture freeze verified against all changes | Solution Architect | Pre-Phase 0 |
| [ ] | API Contracts finalized for all Phase 1 modules | API Owners | Pre-Phase 1 |
| [ ] | Data Model frozen for Phase 1 entities | Data Architect | Pre-Phase 1 |
| [ ] | Event Contracts registered for Phase 1 events | Event Architect | Pre-Phase 1 |
| [ ] | Development environment provisioned | Platform Eng | Pre-Phase 0 |
| [ ] | CI/CD pipeline functional | Platform Eng | Pre-Phase 0 |
| [ ] | Test database seeded with reference data | QA | Pre-Phase 1 |

### 10.2 Per-Phase Development

| # | Item | Verification |
|---|------|-------------|
| [ ] | Module implementation complete (all 20 dimensions) | Module Implementation Guide checklist |
| [ ] | API endpoints match API Contracts | OpenAPI diff |
| [ ] | Events produced match Event Contracts | Schema Registry audit |
| [ ] | Events consumed produce correct side effects | Integration test |
| [ ] | All error states handled (loading, empty, error, edge cases) | Test coverage |
| [ ] | Idempotency verified for all financial operations | Chaos test (replay) |
| [ ] | Rate limiting configured for public endpoints | Config review |
| [ ] | Feature flags functional (enable/disable) | E2E test with flag toggle |
| [ ] | Observability dashboards showing metrics | Grafana review |
| [ ] | Performance within targets | k6 benchmark |

### 10.3 Pre-Production

| # | Item | Verification |
|---|------|-------------|
| [ ] | All 10 go-live criteria verified | E2E smoke test suite |
| [ ] | Rollback procedure tested (API, DB, migration) | DR drill |
| [ ] | Backup and restore tested | Recovery drill |
| [ ] | Security scan passed (no critical/high) | SonarQube + Snyk |
| [ ] | Rate limiting confirmed for all public endpoints | Load test |
| [ ] | Payment test mode transaction verified | Razorpay test |
| [ ] | Webhook HMAC signing verified for all webhooks | Integration test |
| [ ] | On-call rotation configured and notified | Escalation matrix |
| [ ] | Runbooks published and accessible | Wiki/docs |
| [ ] | Monitoring alerts configured with thresholds | Grafana/PagerDuty |

### 10.4 Post-Launch (First 30 Days)

| # | Item | Cadence |
|---|------|---------|
| [ ] | Monitor error rates, latency, and throughput | Daily |
| [ ] | Review and resolve P2+ bugs | Daily triage |
| [ ] | Verify data integrity (payment, wallet, trust) | Weekly |
| [ ] | Review AI provider costs and usage | Weekly |
| [ ] | Performance optimization based on real traffic | Weekly |
| [ ] | Security audit of production configuration | Bi-weekly |
| [ ] | Capacity planning review | Bi-weekly |
| [ ] | Feature flag cleanup (remove stabilized flags) | Monthly |
| [ ] | User feedback integration into backlog | Monthly |
| [ ] | Post-launch retrospective | Day 30 |

### 10.5 Architecture Compliance Checklist

| # | Rule | Verification |
|---|------|-------------|
| [ ] | No direct cross-module DB access | All inter-module data via events or API |
| [ ] | No hardcoded UI colors (design tokens only) | `bg-bg-base`, `bg-surface`, `border-border` etc. |
| [ ] | All financial mutations are idempotent | Idempotency key check in code review |
| [ ] | All append-only ledgers have no UPDATE path | Code review |
| [ ] | All aggregate root boundaries respected | Transaction scope review |
| [ ] | All state machines have documented transitions | State diagram in module docs |
| [ ] | All events are schema-validated at publish | Schema Registry integration |
| [ ] | All webhooks use HMAC signing | Security review |
| [ ] | All sensitive data classified L1-L4 | Data classification audit |
| [ ] | All roles follow RBAC hierarchy (SUPER_ADMIN→ADMIN→SELLER→BUYER→USER) | Permission matrix review |

---

> **End of TRADINGO Enterprise Implementation Blueprint v1.0**
>
> *"The architecture is frozen. The contracts are defined. The data model is complete. Implementation may proceed."*
