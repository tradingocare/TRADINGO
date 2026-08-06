# TRADINGO Core Infrastructure Blueprint

> **Status**: Architecture Reference — Pending Founder Approval
> **Version**: 1.0
> **Date**: 2026-07-03
> **Scope**: Global Event Bus, Domain Events, Middleware, Request Pipeline, Audit, Context, Permissions, Feature Flags, Plugin Architecture
> **Rule**: No implementation. No code. No Prisma. No APIs. This is the permanent Core Infrastructure Contract.

---

## Table of Contents

1. [Global Event Bus](#1-global-event-bus)
2. [Domain Events Catalog](#2-domain-events-catalog)
3. [Event Naming Convention](#3-event-naming-convention)
4. [Event Payload Standards](#4-event-payload-standards)
5. [Event Consumers](#5-event-consumers)
6. [Event Producers](#6-event-producers)
7. [Middleware Architecture](#7-middleware-architecture)
8. [Global Request Pipeline](#8-global-request-pipeline)
9. [Audit Logging Pipeline](#9-audit-logging-pipeline)
10. [Request Context](#10-request-context)
11. [Correlation IDs](#11-correlation-ids)
12. [Permission Resolution](#12-permission-resolution)
13. [Module Resolution](#13-module-resolution)
14. [Feature Flag Strategy](#14-feature-flag-strategy)
15. [Plugin Architecture](#15-plugin-architecture)
16. [Shared Infrastructure Contract](#16-shared-infrastructure-contract)

---

## 1. Global Event Bus

### 1.1 Problem Statement

The current architecture has **no event-driven communication layer**. All cross-module interaction happens via direct service injection. This creates:

- **Tight coupling** — Module A must import Module B to emit a signal
- **No async workflows** — Every module interaction is synchronous in the request lifecycle
- **No replay** — Past domain events cannot be replayed for new subscribers
- **No failure isolation** — A failure in a downstream module propagates to the caller
- **No extensibility** — New module groups (e.g., TradeServ) cannot react to existing domain events without modifying core modules

### 1.2 Architecture

The Global Event Bus is a **dual-delivery** system:

```
                            Domain Event Bus
                                  |
                    ┌─────────────┴─────────────┐
                    v                             v
        +----------------------+     +--------------------------+
        |    Sync Delivery     |     |    Async Delivery         |
        | (NestJS EventEmitter)|     |  (BullMQ EVENT_QUEUE)     |
        |                      |     |                           |
        | In-process handlers   |     |  Durable via Redis        |
        | Same transaction      |     |  Retry with backoff       |
        | Blocking              |     |  Dead-letter support      |
        | No persistence        |     |  Ordered per aggregate    |
        +----------------------+     +--------------------------+
```

### 1.3 Delivery Guarantees

| Delivery Mode | Consistency | Persistence | Ordering | Retry |
|--------------|-------------|-------------|----------|-------|
| **Sync** | Immediate | None | FIFO | None (caller handles) |
| **Async** | Within 1s | Redis + DB | Per aggregate key | 3 attempts, exponential backoff |
| **Replay** | On demand | Event log table | Original order | N/A |

### 1.4 Outbox Pattern

To prevent event loss during failures, every event passes through an **outbox table** before dispatch:

```
Service:
  1. Begin DB transaction
  2. Perform business logic
  3. INSERT into event_outbox (inside same transaction)
  4. Commit transaction
  5. Dispatcher picks up outbox records
  6. Routes to sync subscribers
  7. Enqueues async handlers
  8. Marks outbox record as DISPATCHED
```

This ensures events are never lost even if the dispatcher crashes after commit.

### 1.5 Event Bus Service Contract

The `DomainEventBus` service (shared infrastructure, accessible to every module):

```
DomainEventBus:
  emit(event: DomainEvent)                # Fire-and-forget (async via outbox)
  emitSync(event: DomainEvent)            # Block until sync subscribers complete
  subscribe(eventName, handler, options?) # Register a subscriber
  replay(eventName, from, to)             # Replay events from event log
  getStats()                              # Dispatch metrics
```

### 1.6 Existing Integration

The Event Bus does NOT replace the existing BullMQ queues (EMAIL, NOTIFICATION, ESCROW, etc.). Those remain for domain-specific job processing. The Event Bus operates at a **higher abstraction level**:

```
Domain Event (e.g., order.placed)
  -> Sync subscribers update caches, materialized views
  -> Async handlers enqueue domain-specific BullMQ jobs (EMAIL, NOTIFICATION)
  -> Each queue processor runs independently (existing pattern unchanged)
```

### 1.7 Queue Topology

```
EVENT_QUEUE (new) — General domain event processing
  Concurrency: 10
  Retry: 3 attempts, exponential backoff (2^n * 1000ms)
  Dead-letter: After 3 failures -> DEAD_LETTER queue
  TTL: 7 days

DEAD_LETTER (new) — Failed event inspection
  No auto-processing
  Manual replay via admin UI

Existing queues remain unchanged (EMAIL, NOTIFICATION, ESCROW, etc.)
```

### 1.8 Event Bus Module

The Event Bus itself is a **shared infrastructure module** registered with `@Global()` — like PrismaModule, RedisModule, NotificationModule, and SmsModule. Any module can inject `DomainEventBus` without importing EventBusModule explicitly.

---

## 2. Domain Events Catalog

### 2.1 Auth Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `auth.user.registered` | New user registered | AuthService | Notification (welcome), GOCASH (signup reward), Referral (reward referrer), Campaign (eligibility), CRM (create lead) |
| `auth.user.logged_in` | User authenticated | AuthService | AuditLog, Analytics (session tracking) |
| `auth.user.logged_out` | User session ended | AuthService | Presence (offline status) |
| `auth.user.password_changed` | Password changed | AuthService | Notification (security alert), AuditLog |
| `auth.user.email_verified` | Email confirmed | AuthService | UserVerification (level up), Notification |
| `auth.user.mobile_verified` | Mobile confirmed | AuthService | UserVerification (level up) |
| `auth.user.2fa_enabled` | 2FA activated | AuthService | AuditLog |
| `auth.user.2fa_disabled` | 2FA deactivated | AuthService | AuditLog |

### 2.2 Company Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `company.company.created` | New company registered | CompaniesService | Search (index), Notification, Analytics, GOCASH (create wallet) |
| `company.company.updated` | Company profile changed | CompaniesService | Search (re-index), AuditLog |
| `company.company.verified` | KYC completed | CompanyVerificationService | TradTrust (recalculate), Notification, Search (badge), Campaign (eligibility), CRM |
| `company.company.kyc_submitted` | KYC documents uploaded | CompanyVerificationService | Notification (admin review), Analytics |
| `company.company.kyc_rejected` | KYC rejected | CompanyVerificationService | Notification (resubmit), AuditLog |
| `company.location.added` | New business location | CompanyLocationsService | GeoCluster (update), Search (re-index) |
| `company.location.updated` | Location changed | CompanyLocationsService | GeoCluster (update), Search (re-index) |

### 2.3 Product Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `product.product.created` | New product published | SellerProductService | Search (index), Analytics, Bestseller (recalc), Notification (followers) |
| `product.product.updated` | Product details changed | SellerProductService | Search (re-index), AuditLog |
| `product.product.deleted` | Product removed | SellerProductService | Search (remove), Analytics |
| `product.product.approved` | Product approved by admin | ApprovalService | Notification (seller), Search (publish) |
| `product.product.rejected` | Product rejected by admin | ApprovalService | Notification (seller), AuditLog |
| `product.product.claimed` | Product ownership claimed | ProductClaimsService | Notification (admin verification), AuditLog |
| `product.product.bestseller_calculated` | Weekly bestseller updated | BestsellerProcessor | Notification (top sellers) |

### 2.4 RFQ Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `rfq.rfq.submitted` | New RFQ created | SmartRfqService | Notification (matched suppliers), GOCASH Integration (reward), Analytics, Tradmatch (find matches) |
| `rfq.rfq.updated` | RFQ details changed | SmartRfqService | Notification (interested suppliers), AuditLog |
| `rfq.rfq.expired` | RFQ reached deadline | RfqProcessor | Notification (buyer), Analytics |
| `rfq.rfq.assigned` | Supplier assigned to RFQ | TradmatchService | Notification (both parties), Chat (create conversation) |

### 2.5 Quote Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `quote.quote.submitted` | Supplier submitted quote | QuoteService | Notification (buyer), Analytics, Negotiation (create thread) |
| `quote.quote.accepted` | Buyer accepted quote | SmartRfqService | Notification (supplier), GOCASH Integration (reward both), Quote (mark won), SmartNegotiation (close), Analytics |
| `quote.quote.rejected` | Buyer rejected quote | SmartRfqService | Notification (supplier), Analytics |
| `quote.quote.revised` | Quote revised by supplier | QuoteService | Notification (buyer), AuditLog |

### 2.6 Negotiation Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `negotiation.negotiation.started` | Negotiation session begins | SmartNegotiationService | Chat (enable), Analytics, Notification |
| `negotiation.negotiation.message_sent` | New negotiation message | SmartNegotiationService | Notification (other party), AI Negotiation Copilot (analyze) |
| `negotiation.negotiation.completed` | Negotiation concluded | SmartNegotiationService | GOCASH Integration (reward), Analytics, PO (create draft) |
| `negotiation.negotiation.deal_reached` | Both parties agreed | SmartNegotiationService | Notification, SmartPO (auto-create), Analytics |
| `negotiation.negotiation.failed` | No agreement | SmartNegotiationService | Notification, Analytics |

### 2.7 Order Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `order.po.confirmed` | Purchase order confirmed | SmartPoService | Notification (both), GOCASH Integration (reward), Escrow (create), Finance (credit), Analytics, CRM |
| `order.po.amended` | PO terms changed | SmartPoService | Notification (both), AuditLog |
| `order.order.placed` | Order created from PO | OrderService | Notification, GOCASH Integration (reward), Analytics |
| `order.order.status_changed` | Order status updated | OrderService | Notification, Analytics, Timeline |
| `order.order.completed` | Order fulfilled | OrderService | Notification, GOCASH Integration (reward), TradTrust (recalc), Analytics, Campaign (eligibility) |
| `order.order.cancelled` | Order cancelled | OrderService | Notification, Escrow (release), Finance (credit reversal), Analytics |
| `order.shipment.created` | Shipment initiated | SmartShipmentService | Notification (buyer), Analytics, Delivery (schedule) |
| `order.shipment.delivered` | Goods delivered | SmartShipmentService | Notification (both), GOCASH Integration (reward), Escrow (release trigger) |
| `order.delivery.confirmed` | Delivery confirmed by buyer | SmartDeliveryService | Notification, GOCASH Integration (reward), Payment (release), TradTrust (recalc) |

### 2.8 Payment Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `payment.payment.initiated` | Payment flow starts | PaymentService | Analytics, Escrow |
| `payment.payment.completed` | Payment successful | PaymentService | Notification, Order (update status), Invoice (generate), Analytics, Membership (activate), Campaign (goal tracking) |
| `payment.payment.failed` | Payment declined | PaymentService | Notification, Analytics |
| `payment.payment.refunded` | Refund processed | PaymentService | Notification, Finance, Analytics |
| `payment.escrow.released` | Escrow funds released | EscrowService | Notification, Settlement (trigger), Finance |
| `payment.escrow.disputed` | Escrow disputed | EscrowService | Notification, Dispute (create), Analytics |
| `payment.settlement.completed` | Settlement batch done | SettlementService | Notification, Finance, Analytics |

### 2.9 Membership Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `membership.subscription.created` | New subscription started | MembershipService | Notification, GOCASH Integration (reward), Campaign, Analytics |
| `membership.subscription.upgraded` | Plan upgraded | MembershipService | Notification, GOCASH Integration (reward), AI Credits (sync), Advertising (discount calc) |
| `membership.subscription.downgraded` | Plan downgraded | MembershipService | Notification, AI Credits (sync), Advertising (discount calc) |
| `membership.subscription.expired` | Subscription ended | SubscriptionProcessor | Notification, AI Credits (reset), Feature Flags (revoke) |
| `membership.subscription.renewed` | Auto-renewed | SubscriptionProcessor | Notification, Analytics |

### 2.10 GOCASH Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `gocash.wallet.created` | New wallet initialized | GocashService | Analytics |
| `gocash.wallet.credited` | Funds added | GocashService | Notification, Analytics, Campaign (goal) |
| `gocash.wallet.debited` | Funds spent | GocashService | AuditLog, Analytics |
| `gocash.wallet.reward_earned` | Reward granted | GocashIntegrationService | Notification (ecosystem), Analytics, Campaign (progress), Referral (track) |
| `gocash.wallet.redemption_requested` | User requested redeem | GocashService | Notification (admin), AuditLog |
| `gocash.wallet.redemption_completed` | Redemption processed | GocashService | Notification (user), Analytics |
| `gocash.referral.code_used` | Referral code applied | ReferralService | Notification (referrer), GOCASH Integration (reward), Analytics |
| `gocash.campaign.claimed` | Campaign reward claimed | CampaignService | Notification, Analytics, Campaign (budget) |
| `gocash.ecosystem.checkin_completed` | Daily check-in done | GocashEcosystemService | Notification, Analytics, Streak (update) |
| `gocash.ecosystem.level_up` | User leveled up | GocashEcosystemService | Notification, Analytics, Campaign (milestone) |
| `gocash.ecosystem.badge_earned` | Badge awarded | GocashEcosystemService | Notification, Analytics |
| `gocash.ecosystem.mission_completed` | User finished mission | GocashEcosystemService | Notification, Analytics, Campaign (progress) |

### 2.11 Trust Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `trust.tradtrust.score_updated` | Trust score recalculated | TradTrustService | Search (re-rank), Notification (seller), MarketplaceIntelligence (recalc) |
| `trust.tradtrust.threshold_crossed` | Score crossed milestone | TradTrustService | Notification (badge), Campaign (eligibility) |

### 2.12 Dispute Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `dispute.dispute.opened` | New dispute filed | DisputeService | Notification (both parties, admin), Escrow (hold), Analytics |
| `dispute.dispute.evidence_submitted` | Evidence uploaded | DisputeService | Notification (admin), AuditLog |
| `dispute.dispute.resolved` | Dispute concluded | DisputeService | Notification, Escrow (release/refund), Finance, Analytics |
| `dispute.dispute.escalated` | Dispute sent to arbitration | DisputeService | Notification (admin), AuditLog |

### 2.13 Communication Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `chat.message.sent` | New chat message | ChatService | Notification (recipient), Analytics, AI (sentiment) |
| `chat.conversation.started` | Chat initiated | ChatService | Analytics |

### 2.14 CRM Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `crm.lead.created` | New lead captured | CrmService | Notification (sales), Analytics |
| `crm.lead.status_changed` | Lead moved in pipeline | CrmService | Notification, Analytics, Campaign (if converted) |
| `crm.lead.converted` | Lead became customer | CrmService | Notification, Analytics, Campaign (reward) |

### 2.15 System Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `system.audit.access_denied` | Unauthorized access attempt | PermissionsGuard | AuditLog, Security alert |
| `system.audit.config_changed` | System config modified | AdminService | AuditLog, Cache (invalidate) |
| `system.job.completed` | Cron job finished | JobSchedulerService | Analytics, Health |
| `system.job.failed` | Cron job failed | JobSchedulerService | Notification (admin), Health |

### 2.16 Advertising Domain

| Event Name | Meaning | Emitted By | Async Consumers |
|-----------|---------|------------|-----------------|
| `advertising.ad.created` | New ad submitted | AdvertisingService | Notification (admin review), Analytics |
| `advertising.ad.approved` | Ad approved | AdvertisingService | Notification (seller), AdServer (activate), Analytics |
| `advertising.ad.rejected` | Ad rejected | AdvertisingService | Notification (seller), GOCASH (refund), AuditLog |
| `advertising.ad.impression_recorded` | Ad shown | AdAnalytics | Analytics, Billing (CPM) |
| `advertising.ad.click_recorded` | Ad clicked | AdAnalytics | Analytics, Billing (CPC) |

---

## 3. Event Naming Convention

### 3.1 Pattern

```
{DOMAIN}.{AGGREGATE}.{PAST_TENSE_ACTION}
```

| Segment | Format | Example |
|---------|--------|---------|
| **Domain** | Lowercase, singular | `order`, `payment`, `auth`, `product`, `gocash` |
| **Aggregate** | Lowercase, singular | `po`, `order`, `wallet`, `rfq` |
| **Action** | Past tense snake_case | `placed`, `confirmed`, `credited`, `level_up` |

### 3.2 Rules

1. **Always past tense** — `order.placed`, NOT `order.place`.
2. **Max 3 segments** — Never deeper than `domain.aggregate.action`.
3. **No dots in segments** — Use underscores for multi-word: `level_up`, `checkin_completed`.
4. **No version in name** — Version goes in payload: `eventVersion: 1`.
5. **No prefixes** — No `tradingo.` or `app.` prefix.
6. **Consistent aggregate names** — Match Prisma model naming conventions.

### 3.3 Examples

| Correct | Incorrect |
|---------|-----------|
| `order.po.confirmed` | `order.purchase-order.confirmed` |
| `payment.payment.completed` | `payment.completed` (missing aggregate) |
| `gocash.wallet.credited` | `gocash.gocash_wallet.credited` |
| `product.product.created` | `product.created` (ambiguous) |
| `auth.user.registered` | `user.registered` (missing domain) |

---

## 4. Event Payload Standards

### 4.1 Envelope (Every Event)

Every event MUST carry this envelope. The Event Bus inspects only the envelope.

```
DomainEventEnvelope:
  eventId: string         // UUID v7 (sortable, time-based)
  eventName: string       // "order.po.confirmed"
  eventVersion: number    // 1 (semver major for breaking changes)
  source: string          // "SmartPoService" (emitter class name)
  timestamp: string       // ISO 8601 UTC
  correlationId: string   // UUID v4 — traces entire request chain
  causationId: string     // UUID v7 — the event/command that caused this
  actorId: string         // UUID of user or "system"
  actorType: string       // "user", "admin", "system", "cron", "webhook"
  data: object            // Domain-specific payload (see 4.2)
  metadata: object        // Cross-cutting concerns (see 4.3)
```

### 4.2 Data Payload Rules

1. **Include aggregate ID** — Every payload includes the primary aggregate ID.
2. **Include parent IDs** — Related aggregates by reference (not nesting).
3. **Include state change** — Previous + new status when status transitions.
4. **Flatten, don't nest** — Reference IDs, not entire objects.
5. **No secrets** — No passwords, tokens, API keys, or PII beyond actorId.

Example for `order.po.confirmed`:
```
{
  "poId": "uuid",
  "poNumber": "PO-2026-0421",
  "orderId": "uuid",
  "companyId": "uuid",
  "supplierCompanyId": "uuid",
  "amount": 15000.00,
  "currency": "USD",
  "previousStatus": "DRAFT",
  "newStatus": "CONFIRMED"
}
```

### 4.3 Metadata (Cross-Cutting Only)

The `metadata` field is for infrastructure concerns ONLY:

```
{
  "requestIp": "203.0.113.42",
  "userAgent": "Mozilla/5.0",
  "traceId": "tp=1234567890123456",
  "featureFlags": ["tradeserv:enabled", "ai-credits:enabled"],
  "tenantId": "uuid"
}
```

### 4.4 Event Versioning

| Version | Rule |
|---------|------|
| 1 | Initial schema |
| 2+ | Breaking change (field removed, renamed, type changed) |
| Minor | Additive only — new fields never break consumers |

Consumers read `eventVersion` and apply migration logic. Old versions preserved.

---

## 5. Event Consumers

### 5.1 Registration

Consumers register via decorator on service methods:

```
@OnEvent('order.po.confirmed')                          // Sync subscriber
@OnEvent('order.po.confirmed', { async: true })          // Async via BullMQ
@OnEvent('order.*')                                      // Wildcard
@OnEvent(['order.*', 'payment.*'])                       // Multiple patterns
```

### 5.2 Consumer Contract

Every consumer:
1. **Receives full DomainEventEnvelope** — eventName, eventVersion, data, metadata
2. **Returns void** — Fire-and-forget; no response to producer
3. **Must be idempotent** — Same event twice = same result
4. **Must handle failure gracefully** — Catch, log, don't crash the bus
5. **Should have at most one sync subscriber** — Primary action; async for side effects

### 5.3 Idempotency

Every consumer stores processed event IDs to handle duplicate delivery:

```
Check idempotency store (Redis SET, 24h TTL)
  -> If processed: ack immediately (no-op)
  -> If not processed: execute handler
     -> On success: store eventId in idempotency store
     -> On failure: retry (async) or propagate (sync)
```

Redis key pattern: `idempotent:consumer:{CONSUMER_NAME}:{EVENT_ID}`

### 5.4 Consumer Isolation

| Failure Mode | Sync Consumer | Async Consumer |
|-------------|---------------|----------------|
| Consumer throws | Exception propagates to caller | Retry 3x, then dead-letter |
| Consumer times out | Blocked up to 30s | Job timeout (configurable) |
| Consumer crashes | Affects request | Retry on different worker |
| DB unavailable | Fails (caller handles) | Retry with backoff |

### 5.5 Planned Consumer Catalog

| Consumer | Module | Events Consumed | Mode | Action |
|----------|--------|-----------------|------|--------|
| SearchIndexer | SearchModule | `product.*`, `company.*`, `category.*` | Async | Re-index OpenSearch |
| NotificationDispatcher | NotificationModule | All user-facing events | Async | Create in-app + email + SMS |
| AuditLogger | AuditModule | All domain events | Async | Write audit_log table |
| TradTrustRecalculator | TradTrustModule | `order.*`, `delivery.*`, `dispute.*`, `payment.*` | Async | Recalculate trust scores |
| GocashRewarder | GocashIntegrationModule | `auth.*`, `order.*`, `quote.*`, `rfq.*`, `negotiation.*` | Async | Award GOCASH rewards |
| CampaignTracker | CampaignModule | `order.*`, `gocash.*`, `auth.*` | Async | Track campaign goals |
| MarketplaceRanker | MarketplaceIntelligenceModule | `trust.*`, `order.*`, `company.*` | Async | Re-rank supplier scores |
| AnalyticsTracker | AnalyticsModule | All events | Async | Ingest to ClickHouse |
| CRMUpdater | CrmModule | `order.*`, `auth.*`, `company.*`, `dispute.*` | Async | Update customer timelines |
| AICacheWarmer | AiModule | `product.*`, `rfq.*`, `company.*` | Async | Pre-warm AI cache |
| CacheInvalidator | RedisModule | `company.*`, `product.*`, `membership.*` | Sync | Invalidate Redis cache keys |
| GeoClusterUpdater | LocationIntelligenceModule | `company.location.*` | Async | Update geo clustering |
| BestsellerCalculator | ProductsModule | `order.order.completed` | Async | Trigger bestseller calc |

---

## 6. Event Producers

### 6.1 When to Emit

Emit a domain event when:

1. **A state change is committed** — After DB transaction succeeds
2. **A domain-relevant action completes** — Not every method; only meaningful business events
3. **Another module might care** — If you can imagine a downstream system reacting, emit it

### 6.2 Producer Rules

1. **Emit after commit** — Never emit inside a transaction that may roll back
2. **One event per action** — Don't emit duplicates; use event grouping if needed
3. **No consumer awareness** — Producers don't know who subscribes; never emit "for" a specific consumer
4. **Include correlationId** — Always pass through from request context
5. **Set actorType correctly** — `user` for UI actions, `system` for automated processes, `cron` for scheduled, `webhook` for incoming integrations

### 6.3 Producer Integration Rules

| Scenario | Module Action | Event Emitted |
|----------|--------------|---------------|
| Service method calls emit | After DB commit, in a try-finally | `eventBus.emit(envelope)` |
| Controller indirectly emits | Never from controller; service owns events | Service layer handles |
| Queue processor emits | After job completes successfully | `eventBus.emit(envelope)` |
| Cron job emits | After scheduled processing finishes | `eventBus.emit(envelope)` |
| Existing code emits | Wrapped in existing try-catch, no behavioral change | Add emit line after success |

New modules must NOT import existing services just to emit events. They use the Event Bus.

---

## 7. Middleware Architecture

### 7.1 Problem Statement

The current architecture has **no middleware.ts** (Next.js). All route protection is client-side via `RouteGuard` and `RoleGuard` components. This means:

- **No server-side auth check** before page rendering — protected pages can be server-side rendered without verifying JWT
- **No pre-request validation** — feature flags, maintenance mode, and tenant resolution happen too late
- **No unified request pipeline** — every page implements its own auth/redirect logic

### 7.2 Middleware Layers (Global + Route-Specific)

The middleware architecture follows a **layered onion** pattern:

```
Request
  |
  v
Layer 1: Global Middleware (applied to ALL routes)
  ├── Correlation ID injection (header: X-Correlation-Id)
  ├── Performance monitoring (Server-Timing header)
  ├── Security headers (CSP, HSTS, etc.)
  ├── Maintenance mode check (503 if enabled)
  ├── Rate limiting (by IP for unauthenticated)
  └── Tenant resolution (subdomain/header based)
  |
  v
Layer 2: Protected Route Middleware (applied to authenticated routes)
  ├── JWT verification (verify token from cookie/header)
  ├── Session validation (check Redis for active session)
  ├── Feature flag check (is this feature enabled for this user?)
  ├── Role-based redirect (buyer != admin route)
  └── Company ownership check (for company-scoped routes)
  |
  v
Layer 3: Route Group Middleware (buyer / seller / admin)
  ├── Buyer middleware: subscription check, onboarding check
  ├── Seller middleware: company profile check, verification check
  └── Admin middleware: elevated permission check
  |
  v
Route Handler (page or API route)
```

### 7.3 Route Protection Matrix

| Route Pattern | Middleware Protection | Auth Required | Role Required |
|--------------|---------------------|---------------|---------------|
| `/` (public) | Global only | No | None |
| `/(auth)/*` | Global + redirect if authenticated | Mixed | None |
| `/buyer/*` | Global + JWT + Buyer | Yes | BUYER |
| `/seller/*` | Global + JWT + Seller | Yes | SELLER |
| `/admin/*` | Global + JWT + Admin | Yes | ADMIN |
| `/search` | Global only | No | None |
| `/products/*` | Global only | No | None |
| `/companies/*` | Global only | No | None |
| `/tradeserv/*` | Global + Feature Flag | No | None (public) |
| `/api/*` | Global + JWT (when auth required) | Per endpoint | Per endpoint |

### 7.4 Middleware Execution Order

```
1. correlationId()       — Inject X-Correlation-Id header
2. performanceMonitor()  — Track request duration, set Server-Timing
3. securityHeaders()     — CSP, HSTS, X-Frame-Options, etc.
4. maintenanceMode()     — Check SystemConfig, return 503 if enabled
5. rateLimiter()         — IP-based rate limiting
6. tenantResolver()      — Parse subdomain or header for tenant
7. jwtGuard()            — Verify token, attach user to request
8. sessionValidator()    — Check Redis for active session
9. featureFlagGuard()    — Check feature flags for route patterns
10. roleGuard()          — Check user role matches route group
11. companyGuard()       — Verify company ownership for /company/* routes
```

---

## 8. Global Request Pipeline

### 8.1 API Request Pipeline (Backend)

Every incoming API request flows through this pipeline:

```
Client
  |
  v
Fastify Server
  |
  +-> Correlation ID (RequestContextPlugin)
  +-> Compression (@fastify/compress)
  +-> Helmet CSP (@fastify/helmet)
  +-> CSRF Protection (@fastify/csrf-protection)
  |
  v
NestJS Application
  |
  +-> ThrottlerGuard (rate limit: 100 req/60s)
  +-> ValidationPipe (whitelist + transform)
  |
  v
Controller (route matched)
  |
  +-> JwtAuthGuard (verify token, attach user)
  +-> RolesGuard (check role from @Roles())
  +-> PermissionsGuard (check granular permissions)
  +-> CompanyOwnerGuard (verify company ownership)
  |
  v
Route Handler (business logic)
  |
  +-> Service Layer
  |     |
  |     +-> PrismaService (data access)
  |     +-> DomainEventBus.emit() (events after commit)
  |     +-> AuditService.log() (state changes)
  |
  +-> SentryInterceptor (error capture)
  +-> LoggingInterceptor (request logging)
  |
  v
TransformInterceptor (response envelope)
  |
  v
Client (JSON response: { statusCode, message, data, timestamp })
```

### 8.2 Page Request Pipeline (Frontend)

Every page request flows through:

```
Browser
  |
  v
Next.js Server
  |
  +-> middleware.ts (global + route-specific checks)
  |     +-> JWT verification -> redirect or allow
  |     +-> Feature flag check -> 404 or allow
  |     +-> Maintenance mode -> 503 page
  |     +-> Role redirect -> /login or correct dashboard
  |
  v
Server Component / Page
  |
  +-> Auth guard (RouteGuard client component)
  +-> Role guard (RoleGuard client component)
  |
  v
Page Layout
  |
  +-> Sidebar (role-specific nav items)
  +-> Topbar (user info, notifications)
  +-> Content (page-specific components)
  |
  v
Client Components
  |
  +-> TanStack Query (data fetching)
  +-> DomainEventBus.emit() (client-side events)
  +-> Toast notifications (success/failure)
```

### 8.3 Pipeline Standardization Rules

1. **Every route goes through the pipeline** — No route bypasses correlation ID, logging, or response transformation
2. **Global guards are app-level** — `APP_GUARD` for ThrottlerGuard, `APP_PIPE` for ValidationPipe
3. **Route-specific guards are controller-level** — `@UseGuards(JwtAuthGuard, RolesGuard)` per controller
4. **No raw handler bypass** — Services don't emit HTTP responses; controllers always return through TransformInterceptor
5. **Consistent error format** — All exceptions go through `AllExceptionsFilter` → `{ statusCode, message, timestamp, path }`

---

## 9. Audit Logging Pipeline

### 9.1 Problem Statement

The current architecture has **no centralized audit logging**. State changes are logged inconsistently:
- Some services have manual `AuditLog` creation
- Many state changes have no audit record
- No standardized format for audit entries
- No way to query "who did what, when" across the platform

### 9.2 Architecture

Every state-changing operation is automatically audited through a **three-layer pipeline**:

```
Layer 1: Automatic (Event-Driven)
  Every Domain Event is consumed by AuditLogger
  -> Writes structured audit entry to audit_log table
  -> Includes: eventId, eventName, actorId, actorType, correlationId,
               aggregateId, aggregateType, previousState, newState, timestamp
  -> Non-blocking (async consumer)

Layer 2: Service-Level (Manual)
  Services call auditService.log() for operations that don't emit events
  -> GET operations, read-only views, config fetches
  -> Login attempts (failed + successful)
  -> Search queries (anonymized)

Layer 3: Security-Level (Automatic)
  Guards emit audit events for security-relevant actions
  -> Access denied (403)
  -> Unauthenticated access attempt (401)
  -> Rate limit exceeded (429)
  -> Token refresh
```

### 9.3 Audit Entry Schema

Every audit entry contains:

```
auditLog:
  id: UUID v7
  eventName: string            // "order.po.confirmed"
  action: string               // "CREATE", "UPDATE", "DELETE", "READ", "LOGIN", "ACCESS_DENIED"
  actorId: string?             // UUID or null for unauthenticated
  actorType: string            // "user", "admin", "system", "cron", "webhook", "anonymous"
  correlationId: string        // Traces to request
  ipAddress: string?           // Client IP (GDPR: logged only for security events)
  userAgent: string?           // Browser header
  aggregateType: string?       // Prisma model name: "PurchaseOrder", "Product"
  aggregateId: string?         // Primary key UUID
  previousState: object?       // JSON snapshot before change
  newState: object?            // JSON snapshot after change
  metadata: object?            // Extensible
  timestamp: string            // ISO 8601 UTC
```

### 9.4 Audit Retention

| Event Type | Retention | Storage |
|-----------|-----------|---------|
| Standard domain events | 90 days | PostgreSQL (audit_log table) |
| Security events (access denied, login) | 1 year | PostgreSQL (audit_log table) |
| Financial events (payment, escrow) | 7 years | PostgreSQL (audit_log table) + archival |
| GOCASH transactions | 7 years | GOCASH_Transaction (append-only ledger) |

### 9.5 Query Patterns

```
GET /admin/audit-logs?actor=userId&from=date&to=date&action=UPDATE
GET /admin/audit-logs/:aggregateType/:aggregateId  (full history of an entity)
GET /admin/audit-logs/export?from=date&to=date     (CSV export for compliance)
```

---

## 10. Request Context

### 10.1 Architecture

Every request (HTTP, queue job, cron, WebSocket) carries a **Request Context** — an object accessible from any point in the call chain without being passed as a parameter.

Storage: `AsyncLocalStorage` (Node.js built-in, NestJS compatible)

### 10.2 Context Schema

```
RequestContext:
  correlationId: string         // UUID v4 — generated at first entry point
  causationId: string?          // UUID v7 — event or command that caused this request
  startTime: number             // Date.now() at entry
  method: string?               // "GET", "POST", etc. (HTTP only)
  path: string?                 // "/api/orders" (HTTP only)
  ip: string?                   // Client IP (HTTP only)
  userAgent: string?            // Requesting browser (HTTP only)

  // Auth (after guard verification)
  userId: string?               // UUID of authenticated user
  userRole: string?             // "BUYER", "SELLER", "ADMIN"
  companyId: string?            // UUID of current company context
  email: string?                // User email (for logging, not events)
  permissions: string[]         // Resolved permissions for this request

  // Tenant
  tenantId: string?             // Multi-tenant identifier (future)
  locale: string                // "en", "hi", etc.

  // Feature flags (evaluated at request start)
  featureFlags: Map<string, boolean>

  // Instrumentation
  traceId: string?              // Sentry/profiling trace ID
  baggage: object               // OpenTelemetry baggage
```

### 10.3 Access Patterns

```
// Service layer — inject RequestContextService
this.requestContext.get()          // { userId, companyId, correlationId, ... }
this.requestContext.getUserId()    // convenience getter
this.requestContext.getCompanyId() // convenience getter
this.requestContext.isAuthenticated()

// Decorator-based (existing pattern, unchanged)
@CurrentUser() user    // extracts user from request (JwtAuthGuard)
@CurrentCompany() company  // new — extracts current company context
```

### 10.4 Automatic Population

| Entry Point | Correlation ID | Causation ID | User Context | Company Context |
|-------------|---------------|--------------|--------------|-----------------|
| HTTP Request | Generated | null | From JWT | From user.defaultCompany or header |
| Queue Job | From job data | null | From job data | From job data |
| Cron Job | Generated | null | "system" | null |
| WebSocket | Generated on connect | null | From JWT (handshake) | From user context |
| Event Handler | From event envelope | event.eventId | From event actorId | From event data |

### 10.5 Rules

1. **Every entry point creates a context** — HTTP middleware, queue decorator, cron decorator, WS middleware
2. **Context is read-only after creation** — Set once at entry, never mutated mid-request
3. **Context is inherited** — AsyncLocalStorage propagates through async boundaries
4. **Context is not serialized in responses** — Never leak correlation ID or user info in error messages (existing safe guards remain)

---

## 11. Correlation IDs

### 11.1 Purpose

Correlation IDs trace a single request across every system boundary:
- Browser -> middleware.ts -> Next.js -> API -> Queue -> Processor -> Event Bus -> Consumer -> ClickHouse
- Every log line, every event, every API call carries the same correlation ID

### 11.2 Generation & Propagation

```
Entry Point
  |
  +-> Generate UUID v4 correlationId
  +-> Set in RequestContext
  +-> Inject into all outgoing requests:
  |     +-> HTTP header: X-Correlation-Id
  |     +-> Queue job metadata
  |     +-> Event envelope
  |     +-> Log entries (structured logging)
  |     +-> Sentry scope
  |     +-> Database queries (comment in SQL)
  |
  v
Downstream System
  |
  +-> Read X-Correlation-Id from incoming request
  +-> If present: use (don't regenerate)
  +-> If absent: generate new one
  +-> Propagate to all sub-calls
  +-> Include in response header
```

### 11.3 API Response

Every API response includes `X-Correlation-Id` header, regardless of success or failure.

```
HTTP/1.1 200 OK
X-Correlation-Id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Content-Type: application/json
```

### 11.4 Logging Integration

All structured log entries include correlationId as a mandatory field:

```
{ level: 'info', message: 'Order placed', correlationId: '...', userId: '...', duration: 42 }
```

### 11.5 Frontend Integration

- middleware.ts generates correlation ID for page requests
- API client (`lib/api/client.ts`) attaches `X-Correlation-Id` header to all outgoing requests
- If no correlation ID exists (e.g., initial page load), generate one
- React dev tools can filter requests by correlation ID

---

## 12. Permission Resolution

### 12.1 Architecture

Permission resolution follows a **Role + Attribute** (RBAC + ABAC) hybrid model:

```
User
  |-- Has Role(s): ["BUYER", "SELLER"] (can have multiple)
  |     |-- Role has Permissions: ["product:read", "product:create", "order:read"]
  |
  |-- Has Attributes:
  |     |-- companyId (company context)
  |     |-- ownerId (resource ownership)
  |     |-- department (functional area)
  |
  |-- Has Conditions (ABAC):
        |-- Time-based (business hours only)
        |-- Location-based (specific country)
        |-- Subscription-level (premium features only)
        |-- Feature flag gated
```

### 12.2 Permission Set

Permissions follow the `{resource}:{action}` pattern:

| Permission | Meaning | Assigned To |
|-----------|---------|-------------|
| `product:read` | View product catalog | BUYER, SELLER, ADMIN |
| `product:create` | Create products | SELLER, ADMIN |
| `product:update` | Update own products | SELLER (own), ADMIN (all) |
| `product:delete` | Delete products | SELLER (own), ADMIN (all) |
| `order:read` | View orders | BUYER (own), SELLER (own), ADMIN (all) |
| `order:create` | Create orders | BUYER, ADMIN |
| `order:cancel` | Cancel orders | BUYER (own pending), ADMIN (all) |
| `rfq:create` | Create RFQ | BUYER, ADMIN |
| `rfq:respond` | Respond to RFQ | SELLER |
| `payment:read` | View payment history | BUYER (own), SELLER (own), ADMIN (all) |
| `payment:refund` | Process refunds | ADMIN |
| `users:manage` | Manage users | ADMIN |
| `companies:verify` | Verify companies | ADMIN |
| `settings:read` | View system settings | ADMIN |
| `settings:update` | Change system config | SUPER_ADMIN |
| `analytics:read` | View analytics | SELLER (own), BUYER (own), ADMIN (all) |
| `reports:export` | Export data | SELLER, BUYER, ADMIN |
| `audit:read` | View audit logs | ADMIN, SUPER_ADMIN |
| `ecosystem:admin` | Manage gamification | ADMIN |

### 12.3 Resolution Pipeline

```
1. User requests action (e.g., DELETE /products/:id)
2. JwtAuthGuard verifies token -> userId, role
3. RolesGuard checks @Roles(['SELLER', 'ADMIN']) -> passes if role matches
4. PermissionsGuard checks @Permissions(['product:delete']) -> passes if permission exists
5. CompanyOwnerGuard (if applicable) checks companyId match
6. ABAC conditions evaluated:
   - Is user the owner of this product? (owner check)
   - Is the product in user's company? (company check)
   - Is the user's subscription active? (subscription check)
   - Is the feature flag enabled? (feature flag check)
7. Decision: ALLOW or DENY (403 with reason)
```

### 12.4 Permission Resolution Order

```
Permission -> @Permissions decorator (on controller method)
Role       -> @Roles decorator (on controller or class)
Ownership  -> CompanyOwnerGuard (by endpoint parameter)
ABAC       -> @Conditions decorator or inline in service
```

### 12.5 Cache Strategy

Permissions are resolved per request and cached in Redis:

```
Cache key: permission:{userId}:{companyId}
TTL: 300 seconds (5 minutes)
Invalidated on: role change, subscription change, feature flag toggle
```

---

## 13. Module Resolution

### 13.1 Purpose

Module resolution determines which module group handles a given request. As new module groups are added (TradeServ, future ecosystems), request routing must be unambiguous and extensible without modifying existing modules.

### 13.2 Route Prefix Convention

Each module group gets a **dedicated route prefix** in Fastify:

| Module Group | Route Prefix | Controller Pattern |
|-------------|-------------|-------------------|
| Core (existing) | `/` or `/api/` | `AuthController`, `ProductsController` |
| TradeServ | `/tradeserv/api/` | `TradeservController` (in tradeserv module) |
| Future Group | `/group-name/api/` | `GroupController` |

### 13.3 Resolution Flow

```
Request: POST /tradeserv/api/bookings
  |
  +-> Fastify route matching
  +-> Prefix /tradeserv/api/ matches TradeServ module group
  +-> Feature flag check: is "tradeserv" enabled?
  |     +-> If disabled: 404 (not 403 — feature doesn't exist for this instance)
  |     +-> If enabled: continue
  +-> Module resolution: tradeserv.module -> TradeservBookingsController
  +-> Standard guard pipeline (JWT, roles, permissions)
  +-> Route handler executed
```

### 13.4 Registration

New module groups register in AppModule as standard NestJS module imports (existing pattern unchanged). The module resolution is purely route-prefix based — no dynamic module loading.

```
AppModule.imports = [
  CoreModules,
  TradeservModule.register(),  // routes under /tradeserv/api/
  // Future modules here
]
```

### 13.5 Feature Flag Gating

Every module group must be gated by a feature flag. If the flag is disabled, the module's routes return 404:

```
Feature Flag: tradeserv
  - Enabled: Routes visible, middleware passes
  - Disabled: All /tradeserv/api/* routes return 404
  - Rollout: Percentage-based or user-segment targeting
```

---

## 14. Feature Flag Strategy

### 14.1 Architecture

Feature flags control feature visibility at multiple levels:

```
Global (affects all users)
  -> maintenance_mode (boolean)
  -> tradeserv_enabled (boolean)
  -> ai_features_enabled (boolean)

User Segment (affects user groups)
  -> beta_program (user in beta group)
  -> early_access (user in early access group)

Percentage Rollout (gradual release)
  -> ai_description_generation (50%)
  -> new_checkout_flow (10%)

User-specific (individual toggle)
  -> debug_mode (admin users only)
  -> force_recalculate (developer users)

Plan-based (subscription level)
  -> ai_credits_enabled (Premium+ only)
  -> advanced_analytics (Business+ only)
```

### 14.2 Storage & Caching

```
Source of truth: SystemConfig table (PostgreSQL)
  - key: string (unique)
  - value: JSON (boolean | percentage | array | object)
  - type: "boolean" | "percentage" | "segment" | "user_list"
  - description: string
  - updatedAt: timestamp

Cache layer: Redis with 60s TTL
  - Key: feature:{key}
  - Value: parsed flag value
  - Cache-aside pattern: read from Redis, miss -> read from DB -> populate cache

Frontend: Injected via middleware.ts
  - middleware.ts reads feature flags from API
  - Passes to React context via cookie/header
  - Client components consume via useFeatureFlag() hook
```

### 14.3 Evaluation Order

```
For each request:
  1. Is user authenticated? Get user segments (beta, early access)
  2. What plan does the user have?
  3. Look up feature flag key
  4. Evaluate by type:
     - BOOLEAN: return value directly
     - PERCENTAGE: hash(userId) % 100 < percentage -> enabled
     - SEGMENT: user.segments includes flag segments -> enabled
     - USER_LIST: user.id in flag.userIds -> enabled
     - PLAN: user.plan >= flag.minPlan -> enabled
  5. Cache result for request duration in RequestContext
  6. Return boolean
```

### 14.4 Service Contract

```
FeatureFlagService:
  isEnabled(key: string, userId?: string): boolean
  getValue<T>(key: string, defaultValue: T): T
  setFlag(key: string, value: unknown, type: FlagType): void
  deleteFlag(key: string): void
  getAllFlags(): Record<string, unknown>
```

### 14.5 Planned Flags (Initial)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `maintenance_mode` | boolean | false | Global read-only mode |
| `tradeserv_enabled` | boolean | false | TradeServ module visibility |
| `ai_features_enabled` | boolean | true | AI copilot features |
| `ai_credits_enabled` | boolean | true | AI credit enforcement |
| `beta_program` | segment | [] | Beta feature access |
| `new_checkout` | percentage | 0 | New checkout flow rollout |
| `gocash_ecosystem` | boolean | true | Gamification ecosystem |
| `audit_logging_enabled` | boolean | true | Centralized audit logging |

---

## 15. Plugin Architecture

### 15.1 Purpose

The Plugin Architecture defines how **new module groups** (TradeServ, future ecosystems) integrate with the TRADINGO Core without modifying core modules.

### 15.2 Core Principles

1. **Never modify existing modules** — New features extend via events, not imports
2. **Own prefix, own domain** — Every module group has its own route prefix and Prisma schema
3. **Shared infrastructure only** — Reuse EventBus, AuditService, FeatureFlags, RequestContext
4. **Register in AppModule** — Standard NestJS import; no dynamic module loading
5. **Feature flag gated** — Disabled = transparent to the system

### 15.3 Plugin Contract

Every plugin module group must:

```
1. MODULE FILE
   - Export a @Module() class
   - Register controllers under OWN route prefix
   - Import only from Shared Infrastructure (never core domain modules)
   - Declare imports in module metadata

2. ROUTE PREFIX
   - Use /{plugin-name}/api/* prefix
   - Example: /tradeserv/api/bookings

3. PRISMA SCHEMA
   - Create separate schema file: prisma/{plugin-name}.prisma
   - Extend core enums via migration (never modify core schema file)
   - Integration models (if referencing core IDs) use @map for clarity

4. CONTROLLERS
   - Standard guard pipeline (JwtAuthGuard + RolesGuard + PermissionsGuard)
   - Own set of @Roles() and @Permissions() as needed
   - Return standard response format (TransformInterceptor handles this)

5. EVENTS
   - EMIT: Plugin emits own domain events under own domain prefix
   - SUBSCRIBE: Plugin subscribes to core events via @OnEvent decorator
   - Never emit core-domain events (auth.*, order.* belong to core)

6. SHARED SERVICES
   - Inject: DomainEventBus, AuditService, FeatureFlagService, RequestContextService
   - Inject: NotificationService (for user notifications)
   - Inject: PrismaService (for plugin's own schema, plus core read-only queries)
   - Do NOT inject core domain services (ProductService, OrderService, etc.)

7. REGISTRATION
   - Import in AppModule (standard, not dynamic)
   - Gate behind feature flag check in module constructor or onModuleInit
```

### 15.4 What Plugin Modules CANNOT Do

- Cannot modify any existing core module file
- Cannot inject core domain services (ProductsService, OrderService, etc.)
- Cannot modify core Prisma schema
- Cannot emit core-domain events
- Cannot add new enums to core Prisma schema (extend via migration or own schema)
- Cannot bypass guards or interceptors
- Cannot register global-scoped providers or interceptors

### 15.5 What Plugin Modules CAN Do

- Register own controllers under own prefix
- Create own Prisma models in separate schema file
- Subscribe to any core domain event via `@OnEvent()`
- Emit own domain events under own prefix
- Use all shared infrastructure services
- Register own BullMQ queues and processors
- Use existing StorageService, NotificationService, SearchService
- Integrate with GOCASH via GocashModule (wallet operations)
- Add new admin routes under own prefix

### 15.6 Plugin Lifecycle

```
Module init:
  1. Check feature flag (tradeserv_enabled)
  2. If disabled: log "TradeServ module loaded but disabled"
  3. If enabled: register routes, queues, event subscribers

Module destroy:
  1. Flush pending events
  2. Close queue processors
  3. Log shutdown

Feature flag toggle (runtime):
  - Enable: Routes become accessible, queue processing starts
  - Disable: Routes return 404, pending jobs complete, new jobs rejected
```

---

## 16. Shared Infrastructure Contract

### 16.1 The Shared Infrastructure

Every ecosystem module (including plugins) receives these services through NestJS dependency injection. They form the **Shared Infrastructure** — the permanent, immutable contract that every module depends on.

| Service | Module | Global? | Purpose |
|---------|--------|---------|---------|
| `PrismaService` | PrismaModule | YES | Database ORM — all data access |
| `RedisService` | RedisModule | YES | Caching, rate limiting, sessions |
| `DomainEventBus` | EventBusModule | YES | Event emit/subscribe |
| `RequestContextService` | RequestContextModule | YES | Current request state |
| `AuditService` | AuditModule | YES | Structured audit logging |
| `FeatureFlagService` | FeatureFlagModule | YES | Feature gating |
| `ConfigService` | ConfigModule | YES | Environment configuration |
| `NotificationService` | NotificationModule | YES | Multi-channel user notifications |
| `SmsService` | SmsModule | YES | SMS delivery |
| `StorageService` | StorageModule | NO | File upload (S3 + CloudFront) |
| `SearchService` | SearchModule | NO | OpenSearch indexing/search |
| `AnalyticsService` | AnalyticsModule | NO | Dashboard analytics |
| `EventIngestionService` | AnalyticsModule | NO | ClickHouse event tracking |
| `AiGatewayService` | AiGatewayModule | NO | AI processing |
| `AiCreditsService` | AiGatewayModule | NO | AI credit balance/check |
| `GocashService` | GocashModule | NO | Wallet/ledger operations |
| `GeocodingService` | LocationIntelligenceModule | NO | Address geocoding |
| `TradTrustService` | TradTrustModule | NO | Trust score retrieval |

### 16.2 Contract Rules

1. **Global services are injectable anywhere** — No import needed for EventBusModule, AuditModule, FeatureFlagModule, RequestContextModule, PrismaModule, RedisModule, NotificationModule, SmsModule
2. **Non-global services require module import** — Must import StorageModule, AnalyticsModule, etc. explicitly in plugin's module definition
3. **Services are immutable** — Existing service interfaces will NOT change for plugin compatibility. Additive changes only (new methods, never removed)
4. **No direct database access outside Prisma** — All data access goes through PrismaService. No raw SQL drivers
5. **No direct Redis access outside RedisService** — All cache operations go through RedisService. No ioredis direct usage

### 16.3 Global Module Registration

New global modules to be added alongside existing globals:

```
Current Globals:        New Globals:
  PrismaModule            EventBusModule
  RedisModule             AuditModule
  NotificationModule      FeatureFlagModule
  SmsModule               RequestContextModule
```

### 16.4 Dependency Injection Contract

A plugin module typically injects:

```typescript
// Shared Infrastructure (global, no import needed)
constructor(
  private prisma: PrismaService,
  private redis: RedisService,
  private eventBus: DomainEventBus,
  private requestContext: RequestContextService,
  private audit: AuditService,
  private featureFlags: FeatureFlagService,
  private notification: NotificationService,
  private config: ConfigService,
) {}
```

### 16.5 Module Dependency Graph (Updated)

With the new infrastructure modules, the dependency graph becomes:

```
Layer 0 (New Infrastructure):
  EventBusModule (global)
  AuditModule (global)
  FeatureFlagModule (global)
  RequestContextModule (global)

Layer 0 (Existing Infrastructure):
  PrismaModule (global)
  RedisModule (global)
  NotificationModule (global)
  SmsModule (global)

Layer 1 (Foundation — import infrastructure):
  AuthModule, UsersModule, SearchModule, StorageModule, AnalyticsModule

Layers 2-5 (Existing domain modules — unchanged)

Plugin Layer (New module groups):
  TradeservModule
    -> Imports: [StorageModule, SearchModule, GocashModule]
    -> Depends on: All global modules (auto-injected)
    -> Does NOT import: ProductsModule, OrderModule, PaymentModule
    -> Subscribes to: order.*, payment.*, auth.* via @OnEvent
    -> Emits: tradeserv.* events
```

---

## Appendix A: Infrastructure Module Registration

### A.1 New Global Modules

| Module | Package | Justification |
|--------|---------|---------------|
| EventBusModule | @nestjs/event-emitter | Required for @OnEvent decorator |
| AuditModule | Internal | Centralized audit logging |
| FeatureFlagModule | Internal | Feature gating for all modules |
| RequestContextModule | Internal | AsyncLocalStorage context |

### A.2 BullMQ Topology Changes

| Queue | New? | Purpose |
|-------|------|---------|
| EVENT_QUEUE | NEW | Async domain event processing |
| DEAD_LETTER | NEW | Failed event inspection/replay |

### A.3 Prisma Schema Additions

| Table | Purpose |
|-------|---------|
| `event_outbox` | Outbox pattern event persistence |
| `event_log` | Event log for replay |
| `audit_log` | Centralized audit entries |

---

## Appendix B: Implementation Priority

When implementation is approved, the order is:

| Priority | Component | Depends On |
|----------|-----------|------------|
| P0 | RequestContextModule | AsyncLocalStorage, Correlation ID generation |
| P0 | Correlation ID middleware (middleware.ts + Fastify plugin) | RequestContextModule |
| P1 | FeatureFlagModule | RequestContextModule, RedisService, PrismaService |
| P1 | Feature flag middleware (middleware.ts) | FeatureFlagModule |
| P2 | EventBusModule | @nestjs/event-emitter, BullMQ (EVENT_QUEUE + DEAD_LETTER) |
| P2 | Outbox Prisma model + dispatcher | EventBusModule |
| P2 | Domain events — wire into existing services | EventBusModule |
| P3 | AuditModule | EventBusModule (consumes events) |
| P3 | Audit Prisma model | AuditModule |
| P4 | Middleware pipeline — JWT guard + role guard | RequestContextModule, FeatureFlagModule |
| P4 | Route protection matrix (full implementation) | All above |
| P5 | Plugin Architecture — module resolution | All above |
| P5 | TradeServ integration points | All above |

**TradeServ backend implementation begins AFTER P5.**

---

*Document generated: 2026-07-03 | Version: 1.0 | Status: Architecture Reference — Pending Founder Approval*
*This document is the permanent Core Infrastructure Contract. No implementation begins without explicit Founder approval.*
