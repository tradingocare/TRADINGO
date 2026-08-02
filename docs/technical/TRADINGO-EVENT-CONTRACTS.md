# TRADINGO Enterprise Event Architecture

**Version**: 1.0
**Status**: Architecture Frozen — Design Specification
**Date**: 2026-07-27
**Classification**: Founder Confidential — Event Architecture
**Precedes**: API Contracts Section 5 (infrastructure), Data Model (entities)

---

## TABLE OF CONTENTS

1. Event Principles
2. Event Naming Standards
3. Canonical Event Catalog
4. Event Contracts
5. Event Flows
6. Reliability Model
7. Governance
8. Security
9. Observability
10. Readiness Checklist

---

## 1. EVENT PRINCIPLES

### 1.1 Core Principles

| # | Principle | Rationale |
|---|-----------|----------|
| 1 | **Events are Facts** | An event represents something that has already happened. Past tense. Immutable. No event is ever deleted or updated. |
| 2 | **Domain Ownership** | Each event is owned by exactly one domain module. The owning module defines the schema, the trigger, and the semantics. |
| 3 | **Producer-Consumer Contract** | Producers emit events without knowledge of consumers. Consumers subscribe without knowledge of producers. The Event Bus is the only coupling point. |
| 4 | **At-Least-Once Delivery** | Events must be delivered at least once. Consumers are responsible for idempotent handling. Duplicate events are expected. |
| 5 | **Schema-Backed** | Every event type has a registered schema in the Schema Registry. Schema validation is enforced at publish time. Events that fail validation are rejected. |
| 6 | **Versioned and Migratable** | Event schemas evolve forward. Breaking changes require a new major version. Parallel run supports migration without downtime. |
| 7 | **Correlated by Default** | Every event carries a correlationId that traces the entire business transaction across domain boundaries. Every event carries a traceId for distributed tracing. |
| 8 | **Secure by Classification** | Every event carries a security classification (L1–L4). L3+ events are encrypted at rest and in transit. L4 events are access-controlled. |
| 9 | **Observable by Design** | Every event production and consumption is logged. Metrics track throughput, latency, error rates, and DLQ depth per event type. |
| 10 | **Learning-Aware** | Every event carries a `learningValue` and `businessValue` tag to inform the AI training pipeline. Events with high learning value feed the Knowledge Graph and agent memory. |

### 1.2 Event vs. Command vs. Message

| Concept | Description | Guarantee | Example |
|---------|-------------|-----------|---------|
| **Domain Event** | Something that happened in the past | At-least-once, immutable | `order.placed` |
| **Integration Event** | Cross-domain notification of state change | At-least-once, immutable | `payment.captured` triggers order fulfillment |
| **Command** | Request for an action to be taken | At-most-once (exactly-once with idempotency) | `POST /api/v1/commerce/orders/{id}/cancel` |
| **Message** | Data sent to a specific recipient | At-least-once, mutable per channel | Chat message, notification |
| **Event Carried State Transfer** | Full state snapshot in event payload | Best-effort, eventually consistent | `product.updated` with full product data |

### 1.3 Event Class Hierarchy

```
Event
├── Lifecycle Event (entity state transition)
│   ├── Created     — entity.created
│   ├── Updated     — entity.updated
│   ├── Deleted     — entity.deleted
│   ├── Status Changed — entity.status.changed
│   └── Archived    — entity.archived
├── Business Event (domain-specific business occurrence)
│   ├── Financial   — payment.captured, escrow.released, settlement.completed
│   ├── Commerce    — rfq.awarded, order.shipped, negotiation.completed
│   ├── Trust       — company.verified, score.recalculated
│   ├── AI          — agent.invocation.completed, workflow.execution.completed
│   └── Growth      — referral.converted, campaign.completed
├── System Event (infrastructure occurrence)
│   ├── Heartbeat   — module.heartbeat
│   ├── Alert       — system.alert.threshold
│   └── Metric      — system.metric.report
└── Audit Event (compliance/governance occurrence)
    ├── Access      — audit.access.anomaly
    ├── Change      — audit.config.change
    └── Security    — audit.security.breach
```

### 1.4 Event Classification Tags

Every event carries three orthogonal classification tags:

| Tag | Values | Purpose |
|-----|--------|---------|
| **priority** | `critical`, `very-high`, `high`, `medium`, `low` | Determines retry policy and alerting SLA |
| **businessValue** | `critical`, `very-high`, `high`, `medium`, `low` | Determines archival retention and replay priority |
| **learningValue** | `very-high`, `high`, `medium`, `low`, `none` | Determines whether event feeds AI training pipeline |

---

## 2. EVENT NAMING STANDARDS

### 2.1 Event Name Format

```
{entity}.{action}
```

All lowercase. Dot-separated. Past-tense verbs for actions. The entity name matches the Data Model entity (singular form). The owning domain is implicit from the module ownership matrix.

When disambiguation is needed (same entity name in multiple domains), the format is:

```
{domain}.{entity}.{action}
```

| Component | Rule | Example |
|-----------|------|---------|
| **domain** | When needed for disambiguation | `commerce`, `payment`, `tradeserv` |
| **entity** | Singular, matches Data Model entity name | `user`, `order`, `company`, `product` |
| **action** | Past tense verb | `created`, `updated`, `verified`, `captured` |

### 2.2 Action Verb Registry

| Verb | Meaning | Used By |
|------|---------|---------|
| `.created` | Entity first created | All entities |
| `.updated` | Entity fields changed (non-status) | All mutable entities |
| `.deleted` | Entity soft-deleted | Catalog, Social, Identity |
| `.archived` | Entity moved to archive | Orders, RFQs, Negotiations |
| `.restored` | Entity restored from soft-delete | Catalog, Social |
| `.status.changed` | Entity status transition | State machine entities |
| `.verified` | Verification completed | Company, User, Brand |
| `.rejected` | Verification/review rejected | Company, User, Brand, Quote |
| `.recalculated` | Score or metric recomputed | TradTrustScore, KpiValue |
| `.published` | Entity made public | Product, Post |
| `.unpublished` | Entity made private | Product, Post |
| `.awarded` | RFQ awarded to seller | RFQ |
| `.submitted` | Quote/RFP/Proposal submitted | Quote, Proposal |
| `.accepted` | Quote/Offer accepted | Quote, Booking, Proposal |
| `.rejected` | Quote/Offer rejected | Quote, Booking, Proposal |
| `.withdrawn` | Quote/Offer withdrawn | Quote, Proposal |
| `.expired` | Entity reached TTL | Quote, Booking, Session, RFQ |
| `.placed` | Order placed | Order |
| `.confirmed` | Order/Booking confirmed | Order, Booking |
| `.shipped` | Order shipped | Order |
| `.delivered` | Order delivered | Order |
| `.completed` | Entity lifecycle completed | Order, Booking, Workflow, Payment |
| `.cancelled` | Entity cancelled | Order, Booking, Payment, RFQ |
| `.captured` | Payment captured | Payment |
| `.failed` | Payment/Operation failed | Payment, Escrow, Settlement |
| `.refunded` | Payment refunded | Payment, Refund |
| `.released` | Escrow released | Escrow |
| `.frozen` | Escrow frozen due to dispute | Escrow |
| `.disputed` | Dispute raised | Dispute, Order, Booking |
| `.resolved` | Dispute resolved | Dispute |
| `.held` | Escrow funds held | Escrow |
| `.processed` | Settlement completed | Settlement |
| `.paused` | Entity paused | Settlement, Campaign, Workflow |
| `.resumed` | Entity resumed | Settlement, Campaign, Workflow |
| `.credited` | Funds/credits added | Wallet, GoCash |
| `.debited` | Funds/credits deducted | Wallet, GoCash |
| `.reversed` | Transaction reversed | GoCash |
| `.redeemed` | Rewards redeemed | GoCash |
| `.rewarded` | Reward granted | GoCash, Campaign |
| `.converted` | Lead converted to customer | CRM, Referral |
| `.triggered` | Workflow/Alert triggered | Workflow, Alert |
| `.executed` | Workflow step executed | Workflow |
| `.invoked` | Agent invoked | AI Agent |
| `.completed` | Agent/Inference completed | AI Agent, Workflow |
| `.failed` | Agent/Inference failed | AI Agent, Workflow |
| `.started` | Long-running process started | Booking, Workflow, Agent Session |
| `.joined` | User/member joined | Community, Company |
| `.left` | User/member left | Community, Company |
| `.pinned` | Post pinned | Post |
| `.liked` | Content liked | Post, Review |
| `.shared` | Content shared | Post |
| `.commented` | Comment added | Post |
| `.followed` | User/Company followed | Social |
| `.unfollowed` | User/Company unfollowed | Social |
| `.matched` | Supplier matched to RFQ | Commerce Intelligence |
| `.detected` | Anomaly/fraud detected | Intelligence, Fraud |
| `.alerted` | Alert fired | Alerts |
| `.enriched` | AI enrichment completed | AI, Catalog |
| `.synchronized` | Index sync completed | OpenSearch, Knowledge Graph |
| `.scored` | Quality/Completeness scored | Catalog, RFQ |
| `.analyzed` | AI analysis completed | AI, RFQ, Quote |
| `.flagged` | Content/entity flagged for review | Moderation, Risk |
| `.cleared` | Flag cleared | Moderation, Risk |

### 2.3 Classification Tags by Domain

| Domain | Typical Priority | Typical Business Value | Typical Learning Value |
|--------|-----------------|----------------------|----------------------|
| Identity | very-high | very-high | medium |
| Company | very-high | very-high | high |
| Membership | high | very-high | medium |
| Commerce | very-high | critical | very-high |
| Catalog | medium | high | very-high |
| Inventory | high | high | medium |
| RFQ | very-high | critical | very-high |
| Quote | very-high | critical | very-high |
| Order | critical | critical | very-high |
| Payment | critical | critical | high |
| Settlement | critical | critical | low |
| Refund | critical | critical | medium |
| Escrow | critical | critical | medium |
| GoCash | high | very-high | high |
| TradTrust | very-high | critical | very-high |
| Verification | very-high | very-high | high |
| Review | low | high | very-high |
| TradeServ | high | very-high | high |
| Booking | very-high | very-high | high |
| TradeTalk | low | medium | very-high |
| Notification | low | low | low |
| Analytics | low | very-high | very-high |
| Knowledge Graph | low | very-high | very-high |
| Memory | medium | high | very-high |
| AI | high | critical | very-high |
| Workflow | very-high | very-high | high |
| Administration | high | very-high | medium |

---

## 3. CANONICAL EVENT CATALOG

### 3.1 Identity Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `user.created` | IdentityModule | User registration | very-high | very-high | medium |
| `user.updated` | IdentityModule | Profile update | medium | high | medium |
| `user.deleted` | IdentityModule | Account deletion | very-high | very-high | low |
| `user.restored` | IdentityModule | Account restoration | high | high | low |
| `user.email.verified` | IdentityModule | Email verification | high | very-high | medium |
| `user.mobile.verified` | IdentityModule | Mobile OTP verification | high | very-high | medium |
| `user.logged.in` | IdentityModule | Successful login | low | medium | medium |
| `user.logged.out` | IdentityModule | Logout or session expiry | low | low | low |
| `user.password.changed` | IdentityModule | Password change | high | high | low |
| `user.password.reset` | IdentityModule | Password reset flow | high | high | low |
| `user.role.changed` | IdentityModule | Role assignment change | very-high | very-high | medium |
| `session.created` | IdentityModule | Session token issued | low | medium | low |
| `session.expired` | IdentityModule | Session TTL reached | low | low | low |
| `session.revoked` | IdentityModule | Manual session revocation | high | high | low |
| `user.anomaly.detected` | IdentityModule | Suspicious login/activity | critical | critical | very-high |
| `user.onboarding.completed` | IdentityModule | Onboarding flow finished | high | very-high | high |
| `user.mfa.enabled` | IdentityModule | MFA turned on | high | very-high | low |
| `user.mfa.disabled` | IdentityModule | MFA turned off | high | very-high | low |

### 3.2 Company Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `company.created` | CompaniesModule | Company registration | very-high | very-high | high |
| `company.updated` | CompaniesModule | Profile update | medium | high | high |
| `company.deleted` | CompaniesModule | Company closure | critical | critical | low |
| `company.restored` | CompaniesModule | Reactivation | very-high | very-high | low |
| `company.status.changed` | CompaniesModule | Active/suspended/closed | very-high | very-high | medium |
| `member.joined` | CompaniesModule | User added to company | high | high | medium |
| `member.left` | CompaniesModule | User removed or left | high | high | medium |
| `member.role.changed` | CompaniesModule | Member role updated | high | high | medium |
| `team.created` | CompaniesModule | Team created | low | medium | low |
| `team.updated` | CompaniesModule | Team updated | low | medium | low |
| `team.deleted` | CompaniesModule | Team deleted | low | low | low |
| `company.onboarding.completed` | CompaniesModule | Setup complete | very-high | very-high | high |
| `company.profile.completed` | CompaniesModule | All required fields filled | high | very-high | high |
| `company.gstin.verified` | CompaniesModule | GSTIN verification | very-high | very-high | medium |
| `company.pan.verified` | CompaniesModule | PAN verification | very-high | very-high | medium |
| `company.document.uploaded` | CompaniesModule | Verification document | medium | high | medium |

### 3.3 Membership Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `subscription.created` | MembershipModule | New subscription | very-high | very-high | high |
| `subscription.updated` | MembershipModule | Plan change | high | very-high | medium |
| `subscription.cancelled` | MembershipModule | Subscription cancelled | very-high | very-high | medium |
| `subscription.expired` | MembershipModule | TTL reached | high | very-high | high |
| `subscription.renewed` | MembershipModule | Auto-renewal processed | high | very-high | medium |
| `subscription.payment.failed` | MembershipModule | Renewal declined | very-high | very-high | medium |
| `subscription.payment.recovered` | MembershipModule | Retry succeeded | high | very-high | low |
| `plan.activated` | MembershipModule | Benefit activation | high | very-high | medium |
| `plan.deactivated` | MembershipModule | Benefit deactivation | medium | high | low |
| `benefit.used` | MembershipModule | Benefit consumed | low | medium | high |
| `benefit.expired` | MembershipModule | Benefit TTL reached | low | low | low |
| `membership.upgrade.completed` | MembershipModule | Plan upgrade | very-high | very-high | high |
| `membership.downgrade.completed` | MembershipModule | Plan downgrade | high | high | medium |
| `trial.started` | MembershipModule | Trial begins | high | very-high | high |
| `trial.expiring` | MembershipModule | Trial ending soon | medium | very-high | high |
| `trial.ended` | MembershipModule | Trial over | high | very-high | high |
| `credit.allocated` | MembershipModule | AI/ad credits added | high | high | low |

### 3.4 Commerce Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `order.placed` | CommerceModule | Order created by buyer | critical | critical | very-high |
| `order.updated` | CommerceModule | Details changed | high | very-high | medium |
| `order.confirmed` | CommerceModule | Seller confirms | very-high | critical | very-high |
| `order.shipped` | CommerceModule | Order dispatched | very-high | very-high | high |
| `order.delivered` | CommerceModule | Order received | very-high | critical | very-high |
| `order.completed` | CommerceModule | Lifecycle complete | critical | critical | very-high |
| `order.cancelled` | CommerceModule | Cancelled by either party | very-high | very-high | high |
| `order.archived` | CommerceModule | Moved to archive | low | low | low |
| `order.disputed` | CommerceModule | Dispute raised | critical | critical | very-high |
| `order.status.changed` | CommerceModule | Any status transition | very-high | very-high | high |
| `negotiation.started` | CommerceModule | Negotiation initiated | high | very-high | very-high |
| `negotiation.round.completed` | CommerceModule | Round ends | high | high | very-high |
| `negotiation.completed` | CommerceModule | Resolved (deal/lift) | very-high | critical | very-high |
| `negotiation.cancelled` | CommerceModule | Cancelled | medium | high | high |
| `contract.created` | CommerceModule | Contract generated | high | very-high | medium |
| `contract.signed` | CommerceModule | Digitally signed | very-high | very-high | medium |
| `contract.expired` | CommerceModule | Validity ended | low | medium | low |
| `buyer.first.order` | CommerceModule | Buyer's first order | very-high | critical | very-high |
| `seller.first.sale` | CommerceModule | Seller's first sale | very-high | critical | very-high |
| `milestone.reached` | CommerceModule | Order count milestone | high | very-high | high |

### 3.5 Catalog Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `product.created` | EnterpriseCatalogModule | Product created | high | very-high | very-high |
| `product.updated` | EnterpriseCatalogModule | Details changed | medium | high | very-high |
| `product.deleted` | EnterpriseCatalogModule | Soft-deleted | high | very-high | medium |
| `product.restored` | EnterpriseCatalogModule | Restored | medium | high | low |
| `product.published` | EnterpriseCatalogModule | Made visible | very-high | very-high | very-high |
| `product.unpublished` | EnterpriseCatalogModule | Hidden | high | high | medium |
| `product.status.changed` | EnterpriseCatalogModule | Review/approve/reject | high | very-high | high |
| `product.featured` | EnterpriseCatalogModule | Marked featured | medium | high | high |
| `product.unfeatured` | EnterpriseCatalogModule | Unfeatured | low | low | low |
| `product.quality.scored` | EnterpriseCatalogModule | Quality score computed | medium | high | very-high |
| `product.ai.enriched` | EnterpriseCatalogModule | AI enrichment done | low | high | very-high |
| `product.duplicate.detected` | EnterpriseCatalogModule | Potential duplicate | high | very-high | very-high |
| `product.first.published` | EnterpriseCatalogModule | Seller's first publish | very-high | very-high | very-high |
| `category.created` | EnterpriseCatalogModule | New master category | medium | very-high | medium |
| `category.updated` | EnterpriseCatalogModule | Category changed | low | high | low |
| `category.deleted` | EnterpriseCatalogModule | Category retired | high | very-high | low |
| `catalog.item.created` | EnterpriseCatalogModule | Catalog item added | medium | very-high | high |
| `catalog.item.updated` | EnterpriseCatalogModule | Catalog item updated | low | high | high |
| `brand.created` | EnterpriseCatalogModule | Brand registered | medium | high | medium |
| `brand.verified` | EnterpriseCatalogModule | Brand verified | high | very-high | medium |
| `brand.rejected` | EnterpriseCatalogModule | Brand rejected | medium | high | low |
| `attribute.created` | EnterpriseCatalogModule | New global attribute | low | high | low |
| `attribute.updated` | EnterpriseCatalogModule | Attribute changed | low | medium | low |
| `unit.created` | EnterpriseCatalogModule | New catalog unit | low | medium | low |

### 3.6 Inventory Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `inventory.quantity.updated` | InventoryModule | Stock level change | high | very-high | high |
| `inventory.quantity.reserved` | InventoryModule | Reserved for order | very-high | very-high | high |
| `inventory.quantity.released` | InventoryModule | Reservation released | high | high | medium |
| `inventory.quantity.low` | InventoryModule | Below threshold | high | very-high | medium |
| `inventory.out.of.stock` | InventoryModule | Stock exhausted | high | very-high | medium |
| `inventory.restocked` | InventoryModule | New stock received | high | very-high | low |
| `batch.created` | InventoryModule | Batch/lot created | low | medium | low |
| `batch.expired` | InventoryModule | Batch TTL reached | medium | high | low |

### 3.7 RFQ Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `rfq.created` | SmartRfqModule | RFQ published by buyer | very-high | critical | very-high |
| `rfq.updated` | SmartRfqModule | Details changed | high | very-high | high |
| `rfq.closed` | SmartRfqModule | Closed without award | high | high | high |
| `rfq.cancelled` | SmartRfqModule | Cancelled by buyer | high | high | medium |
| `rfq.expired` | SmartRfqModule | Validity period ended | high | high | high |
| `rfq.awarded` | SmartRfqModule | Awarded to seller | very-high | critical | very-high |
| `rfq.reopened` | SmartRfqModule | Reopened after close | medium | high | medium |
| `rfq.first.response` | SmartRfqModule | First quote received | high | very-high | very-high |
| `rfq.ai.analyzed` | SmartRfqModule | AI analysis done | medium | high | very-high |
| `rfq.supplier.matched` | SmartRfqModule | Suppliers auto-matched | high | very-high | very-high |
| `rfq.completeness.scored` | SmartRfqModule | Completeness score | low | medium | high |

### 3.8 Quote Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `quote.created` | QuoteModule | Drafted by seller | high | very-high | very-high |
| `quote.updated` | QuoteModule | Details changed | medium | high | high |
| `quote.submitted` | QuoteModule | Sent to buyer | very-high | critical | very-high |
| `quote.accepted` | QuoteModule | Buyer accepts | critical | critical | very-high |
| `quote.rejected` | QuoteModule | Buyer rejects | high | very-high | very-high |
| `quote.withdrawn` | QuoteModule | Seller withdraws | high | high | medium |
| `quote.expired` | QuoteModule | Validity ended | medium | high | medium |
| `quote.countered` | QuoteModule | Counter-offer initiated | high | very-high | very-high |
| `quote.ai.analyzed` | QuoteModule | AI pricing analysis | medium | high | very-high |
| `quote.price.changed` | QuoteModule | Price amendment | high | very-high | high |

### 3.9 Order Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `order.placed` | OrderModule | Order record created | critical | critical | very-high |
| `order.updated` | OrderModule | Details changed | high | very-high | medium |
| `order.confirmed` | OrderModule | Seller confirms | very-high | critical | very-high |
| `order.processing` | OrderModule | Fulfillment starts | high | very-high | high |
| `order.shipped` | OrderModule | Dispatched | very-high | critical | very-high |
| `order.delivered` | OrderModule | Received | very-high | critical | very-high |
| `order.completed` | OrderModule | Lifecycle ends | critical | critical | very-high |
| `order.cancelled` | OrderModule | Cancelled | critical | critical | high |
| `order.disputed` | OrderModule | Dispute filed | critical | critical | very-high |
| `order.archived` | OrderModule | Long-term storage | low | low | low |
| `order.status.changed` | OrderModule | Any transition | very-high | very-high | high |
| `order.milestone.reached` | OrderModule | Company order count | high | very-high | high |
| `order.payment.due` | OrderModule | Payment deadline near | very-high | very-high | medium |
| `order.payment.overdue` | OrderModule | Payment past due | critical | critical | high |
| `order.fulfillment.delayed` | OrderModule | Behind schedule | high | very-high | high |

### 3.10 Payment Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `payment.initiated` | PaymentModule | Flow started | very-high | critical | high |
| `payment.processing` | PaymentModule | Gateway processing | very-high | critical | high |
| `payment.captured` | PaymentModule | Successfully captured | critical | critical | high |
| `payment.failed` | PaymentModule | Declined/error | critical | critical | high |
| `payment.refunded` | PaymentModule | Full refund processed | critical | critical | medium |
| `payment.partially.refunded` | PaymentModule | Partial refund | critical | critical | medium |
| `payment.expired` | PaymentModule | Link/attempt expired | medium | high | low |
| `payment.status.changed` | PaymentModule | Any transition | very-high | very-high | medium |
| `payment.method.changed` | PaymentModule | Buyer switches method | low | medium | high |
| `payment.gateway.timeout` | PaymentModule | Gateway timeout | critical | critical | high |
| `payment.gateway.error` | PaymentModule | Gateway error | critical | critical | high |
| `payment.gateway.switch` | PaymentModule | Auto-failover | critical | critical | very-high |
| `payment.receipt.generated` | PaymentModule | Receipt/invoice created | low | high | low |

### 3.11 Settlement Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `settlement.created` | PaymentModule | Record created | very-high | critical | low |
| `settlement.processing` | PaymentModule | Processing started | very-high | critical | low |
| `settlement.completed` | PaymentModule | Successfully transferred | critical | critical | low |
| `settlement.failed` | PaymentModule | Transfer failed | critical | critical | medium |
| `settlement.paused` | PaymentModule | Paused (dispute) | very-high | very-high | medium |
| `settlement.resumed` | PaymentModule | Resumed after pause | very-high | very-high | low |
| `settlement.status.changed` | PaymentModule | Any transition | very-high | very-high | low |

### 3.12 Refund Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `refund.initiated` | RefundModule | Request created | critical | critical | medium |
| `refund.approved` | RefundModule | Approved by admin | critical | critical | medium |
| `refund.rejected` | RefundModule | Rejected | very-high | very-high | medium |
| `refund.processing` | RefundModule | Gateway initiated | critical | critical | low |
| `refund.completed` | RefundModule | Successfully processed | critical | critical | low |
| `refund.failed` | RefundModule | Processing error | critical | critical | high |
| `refund.status.changed` | RefundModule | Any transition | very-high | very-high | low |

### 3.13 Escrow Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `escrow.held` | PaymentModule | Payment secured | critical | critical | medium |
| `escrow.released` | PaymentModule | Funds released to seller | critical | critical | low |
| `escrow.partially.released` | PaymentModule | Milestone partial release | critical | critical | low |
| `escrow.frozen` | PaymentModule | Frozen (dispute) | critical | critical | high |
| `escrow.unfrozen` | PaymentModule | Unfrozen after resolution | critical | critical | low |
| `escrow.refunded` | PaymentModule | Refunded to buyer | critical | critical | low |
| `escrow.disputed` | PaymentModule | Under dispute | critical | critical | high |
| `escrow.status.changed` | PaymentModule | Any transition | very-high | very-high | medium |

### 3.14 GoCash Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `wallet.created` | GocashModule | Wallet created for company | high | very-high | low |
| `wallet.frozen` | GocashModule | Frozen by admin | very-high | very-high | medium |
| `wallet.unfrozen` | GocashModule | Unfrozen | high | high | low |
| `transaction.credited` | GocashModule | Credit completed | high | very-high | high |
| `transaction.debited` | GocashModule | Debit completed | high | very-high | high |
| `transaction.reversed` | GocashModule | Transaction reversed | very-high | very-high | medium |
| `transaction.failed` | GocashModule | Processing error | high | very-high | medium |
| `redeem.requested` | GocashModule | Redemption requested | medium | high | medium |
| `redeem.approved` | GocashModule | Approved | high | very-high | low |
| `redeem.rejected` | GocashModule | Rejected | medium | high | low |
| `redeem.completed` | GocashModule | Processed | high | very-high | low |
| `balance.threshold` | GocashModule | Balance crosses threshold | medium | high | medium |
| `reward.earned` | GocashModule | Reward credited (generic) | high | very-high | very-high |
| `reward.expiring` | GocashModule | Points about to expire | medium | high | medium |
| `campaign.reward` | GocashModule | Campaign reward distributed | high | very-high | very-high |
| `referral.reward` | GocashModule | Referral reward credited | high | very-high | very-high |

### 3.15 TradTrust Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `trust.score.created` | TradTrustModule | Initial score computed | high | very-high | high |
| `trust.score.recalculated` | TradTrustModule | Score recomputed | very-high | critical | very-high |
| `trust.score.dimension.changed` | TradTrustModule | Dimension changed | high | very-high | very-high |
| `trust.score.threshold.crossed` | TradTrustModule | Tier boundary crossed | very-high | very-high | very-high |
| `trust.signal.added` | TradTrustModule | New signal recorded | medium | high | very-high |
| `trust.signal.removed` | TradTrustModule | Signal expired/removed | medium | medium | high |
| `trust.tier.changed` | TradTrustModule | Company trust tier changed | very-high | critical | very-high |
| `trust.risk.flagged` | TradTrustModule | Risk threshold crossed | critical | critical | very-high |
| `trust.risk.cleared` | TradTrustModule | Risk resolved | high | high | high |
| `trust.recommendation.generated` | TradTrustModule | Improvement recommendation | low | high | very-high |
| `trust.seller.badge.updated` | TradTrustModule | Badge level changed | high | very-high | high |

### 3.16 Verification Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `verification.company.submitted` | TradTrustModule | Company application | very-high | very-high | high |
| `verification.company.approved` | TradTrustModule | Verification passed | very-high | critical | high |
| `verification.company.rejected` | TradTrustModule | Verification failed | very-high | very-high | high |
| `verification.company.expired` | TradTrustModule | Validity ended | high | very-high | medium |
| `verification.company.escalated` | TradTrustModule | Manual review required | high | very-high | medium |
| `verification.user.submitted` | UserVerificationModule | User application | high | very-high | medium |
| `verification.user.approved` | UserVerificationModule | User KYC passed | high | very-high | medium |
| `verification.user.rejected` | UserVerificationModule | User KYC rejected | high | high | medium |
| `verification.brand.submitted` | EnterpriseCatalogModule | Brand application | medium | high | medium |
| `verification.brand.approved` | EnterpriseCatalogModule | Brand verified | high | very-high | low |
| `verification.brand.rejected` | EnterpriseCatalogModule | Brand denied | medium | high | low |
| `verification.level.upgraded` | TradTrustModule | Level increased | very-high | very-high | high |
| `verification.document.uploaded` | TradTrustModule | Document submitted | medium | high | medium |
| `verification.document.verified` | TradTrustModule | Document verified | high | very-high | low |
| `verification.document.rejected` | TradTrustModule | Document rejected | high | high | medium |

### 3.17 Review Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `review.created` | TradeServModule | Review submitted | medium | high | very-high |
| `review.updated` | TradeServModule | Review edited | low | medium | high |
| `review.deleted` | TradeServModule | Review removed | low | medium | low |
| `review.flagged` | TradeServModule | Reported as inappropriate | medium | high | very-high |
| `review.moderated` | TradeServModule | Admin moderation action | high | high | very-high |
| `review.helpful.marked` | TradeServModule | Marked helpful | low | low | high |
| `review.response.added` | TradeServModule | Seller responded | low | medium | high |

### 3.18 TradeServ Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `professional.registered` | TradeservModule | Service created | very-high | very-high | very-high |
| `professional.updated` | TradeservModule | Profile changed | medium | high | high |
| `professional.approved` | TradeservModule | Admin approval | high | very-high | medium |
| `professional.suspended` | TradeservModule | Suspended | very-high | very-high | high |
| `professional.reinstated` | TradeservModule | Suspension lifted | high | high | low |
| `service.created` | TradeservModule | New service added | medium | high | high |
| `service.updated` | TradeservModule | Service changed | low | medium | medium |
| `service.deleted` | TradeservModule | Service removed | medium | medium | low |
| `service.area.added` | TradeservModule | Area expanded | low | medium | medium |
| `service.area.removed` | TradeservModule | Area removed | low | low | low |
| `professional.first.booking` | TradeservModule | First booking received | very-high | very-high | very-high |
| `professional.trust.tier.changed` | TradeservModule | Trust tier changed | high | very-high | high |
| `professional.portfolio.added` | TradeservModule | Portfolio item uploaded | low | medium | high |
| `professional.certification.added` | TradeservModule | New certification | high | very-high | high |
| `professional.certification.expired` | TradeservModule | Certification ended | medium | high | medium |
| `inquiry.received` | TradeservModule | New buyer inquiry | high | very-high | medium |

### 3.19 Booking Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `booking.created` | TradeservModule | Request submitted | very-high | critical | very-high |
| `booking.confirmed` | TradeservModule | Professional confirms | very-high | critical | very-high |
| `booking.in.progress` | TradeservModule | Service delivery starts | high | very-high | high |
| `booking.completed` | TradeservModule | Service delivered | very-high | critical | very-high |
| `booking.cancelled` | TradeservModule | Cancelled (either party) | very-high | very-high | high |
| `booking.no.show` | TradeservModule | Client no-show | high | high | high |
| `booking.rescheduled` | TradeservModule | Date/time changed | medium | high | medium |
| `booking.disputed` | TradeservModule | Dispute raised | critical | critical | very-high |
| `booking.payment.confirmed` | TradeservModule | Payment received | very-high | critical | medium |
| `booking.payment.failed` | TradeservModule | Payment declined | very-high | very-high | medium |
| `booking.status.changed` | TradeservModule | Any transition | very-high | very-high | high |

### 3.20 TradeTalk Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `community.created` | TradeTalkModule | New community | medium | high | high |
| `community.updated` | TradeTalkModule | Settings changed | low | medium | medium |
| `community.deleted` | TradeTalkModule | Removed | medium | high | low |
| `community.member.joined` | TradeTalkModule | User joined | low | medium | high |
| `community.member.left` | TradeTalkModule | User left | low | low | medium |
| `post.created` | TradeTalkModule | Post published | medium | high | very-high |
| `post.updated` | TradeTalkModule | Post edited | low | medium | high |
| `post.deleted` | TradeTalkModule | Post removed | low | medium | low |
| `post.pinned` | TradeTalkModule | Pinned by moderator | low | low | low |
| `post.unpinned` | TradeTalkModule | Unpinned | low | low | low |
| `comment.created` | TradeTalkModule | Comment on post | low | medium | very-high |
| `comment.deleted` | TradeTalkModule | Comment removed | low | low | low |
| `post.liked` | TradeTalkModule | Post liked | low | low | very-high |
| `post.shared` | TradeTalkModule | Post shared | low | low | high |
| `post.flagged` | TradeTalkModule | Post reported | medium | high | very-high |
| `post.moderated` | TradeTalkModule | Moderation action | high | very-high | very-high |
| `user.followed` | TradeTalkModule | Follow created | low | low | high |
| `user.unfollowed` | TradeTalkModule | Follow removed | low | low | low |
| `community.trending` | TradeTalkModule | Trending threshold | low | medium | high |
| `content.ai.moderated` | TradeTalkModule | AI moderation verdict | medium | high | very-high |
| `content.ai.suggested` | TradeTalkModule | AI content suggestion | low | low | very-high |

### 3.21 Notification Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `notification.sent` | NotificationModule | Delivered via channel | medium | high | low |
| `notification.read` | NotificationModule | User read notification | low | low | medium |
| `notification.batch.sent` | NotificationModule | Bulk campaign sent | low | medium | low |
| `notification.delivery.failed` | NotificationModule | Channel permanently failed | high | high | medium |
| `notification.template.created` | NotificationModule | New template registered | low | medium | low |
| `notification.template.updated` | NotificationModule | Template modified | low | medium | low |
| `notification.subscriber.subscribed` | NotificationModule | Newsletter subscription | low | high | medium |
| `notification.subscriber.unsubscribed` | NotificationModule | Newsletter unsubscription | low | high | medium |
| `notification.workflow.triggered` | NotificationModule | Marketing workflow | medium | high | high |
| `notification.workflow.completed` | NotificationModule | Workflow finished | low | medium | low |
| `notification.workflow.failed` | NotificationModule | Workflow error | high | high | medium |

### 3.22 Analytics Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `analytics.event.ingested` | TrackingModule | Raw event recorded | low | high | very-high |
| `cohort.computed` | GrowthIntelligenceModule | Cohort analysis done | low | very-high | very-high |
| `retention.computed` | GrowthIntelligenceModule | Retention updated | low | very-high | very-high |
| `funnel.computed` | GrowthIntelligenceModule | Funnel updated | low | very-high | very-high |
| `report.generated` | AnalyticsModule | Scheduled report done | low | high | low |
| `kpi.threshold.breached` | EnterpriseIntelligenceModule | KPI crosses threshold | high | very-high | very-high |
| `growth.kpi.updated` | GrowthIntelligenceModule | Metric recalculated | low | very-high | high |

### 3.23 Knowledge Graph Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `kg.entity.created` | KnowledgeModule | New entity node | low | very-high | very-high |
| `kg.entity.updated` | KnowledgeModule | Node modified | low | high | high |
| `kg.entity.deleted` | KnowledgeModule | Node removed | low | high | low |
| `kg.relationship.created` | KnowledgeModule | Edge added | low | very-high | very-high |
| `kg.relationship.deleted` | KnowledgeModule | Edge removed | low | high | low |
| `kg.synchronized` | KnowledgeModule | Synced from source | low | very-high | high |
| `kg.query.executed` | KnowledgeModule | Graph query performed | low | medium | very-high |
| `kg.inference.completed` | KnowledgeModule | Graph reasoning done | low | very-high | very-high |

### 3.24 Memory Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `memory.fragment.created` | AiOrchestratorModule | New memory stored | low | high | very-high |
| `memory.fragment.updated` | AiOrchestratorModule | Memory modified | low | high | high |
| `memory.fragment.deleted` | AiOrchestratorModule | Evicted/expired | low | medium | medium |
| `memory.fragment.expired` | AiOrchestratorModule | TTL reached | low | low | low |
| `memory.context.retrieved` | AiOrchestratorModule | Context for agent | low | high | very-high |
| `memory.consolidation.completed` | AiOrchestratorModule | Consolidation done | low | very-high | very-high |

### 3.25 AI Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `agent.invoked` | AiGatewayModule | Agent invocation started | high | very-high | very-high |
| `agent.completed` | AiGatewayModule | Execution finished | high | very-high | very-high |
| `agent.failed` | AiGatewayModule | Execution error | very-high | very-high | very-high |
| `agent.timed.out` | AiGatewayModule | Timeout exceeded | very-high | high | very-high |
| `inference.completed` | AiGatewayModule | Model response received | medium | high | very-high |
| `inference.failed` | AiGatewayModule | Model error | high | high | very-high |
| `session.created` | AiRuntimeModule | Agent session created | medium | high | high |
| `session.completed` | AiRuntimeModule | Session ended | low | medium | high |
| `session.expired` | AiRuntimeModule | TTL reached | low | low | low |
| `credit.deducted` | AiGatewayModule | Credits consumed | medium | high | medium |
| `credit.exhausted` | AiGatewayModule | Company out of credits | high | very-high | high |
| `credit.topped.up` | AiGatewayModule | Credits added/recharged | medium | high | low |
| `model.failover` | AiGatewayModule | Fallback model used | very-high | critical | very-high |
| `model.rate.limited` | AiGatewayModule | Provider rate limit hit | high | high | high |
| `cache.hit` | AiGatewayModule | Response from cache | low | medium | very-high |
| `feedback.submitted` | AiGatewayModule | User feedback on AI output | low | high | very-high |
| `approval.requested` | AiGatewayModule | Human approval needed | very-high | very-high | very-high |
| `approval.granted` | AiGatewayModule | Human approved | high | very-high | very-high |
| `approval.rejected` | AiGatewayModule | Human rejected | high | very-high | very-high |
| `approval.modified` | AiGatewayModule | Approved with changes | high | very-high | very-high |
| `agent.registered` | AgentFrameworkModule | Agent added to registry | medium | high | medium |
| `agent.deregistered` | AgentFrameworkModule | Agent removed | medium | high | medium |
| `coordination.started` | AiRuntimeModule | Multi-agent collab begins | high | very-high | very-high |
| `coordination.completed` | AiRuntimeModule | Multi-agent collab ends | high | very-high | very-high |
| `coordination.failed` | AiRuntimeModule | Agent collab error | very-high | very-high | very-high |

### 3.26 Workflow Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `workflow.definition.created` | AiRuntimeModule | Workflow template created | low | high | medium |
| `workflow.definition.updated` | AiRuntimeModule | Template modified | low | high | low |
| `workflow.definition.archived` | AiRuntimeModule | Template retired | low | low | low |
| `workflow.execution.started` | AiRuntimeModule | Instance begins | very-high | very-high | very-high |
| `workflow.execution.completed` | AiRuntimeModule | Finished successfully | very-high | very-high | very-high |
| `workflow.execution.failed` | AiRuntimeModule | Error encountered | critical | critical | very-high |
| `workflow.execution.paused` | AiRuntimeModule | Paused (approval) | high | high | high |
| `workflow.execution.resumed` | AiRuntimeModule | Resumed | high | high | medium |
| `workflow.execution.cancelled` | AiRuntimeModule | Manually cancelled | high | high | medium |
| `workflow.step.completed` | AiRuntimeModule | Individual step done | medium | high | very-high |
| `workflow.step.failed` | AiRuntimeModule | Step error | very-high | very-high | very-high |
| `workflow.step.retrying` | AiRuntimeModule | Step being retried | high | high | high |
| `workflow.approval.created` | AiRuntimeModule | Approval step created | very-high | very-high | very-high |
| `workflow.approval.resolved` | AiRuntimeModule | Granted/rejected | high | very-high | high |

### 3.27 Administration Domain

| Event Name | Producer | Trigger | Priority | Business Value | Learning |
|------------|----------|---------|----------|---------------|----------|
| `admin.config.changed` | ConfigModule | Feature flag toggled | high | very-high | low |
| `admin.policy.created` | ConfigModule | New access policy | very-high | very-high | medium |
| `admin.policy.updated` | ConfigModule | Policy modified | very-high | very-high | medium |
| `admin.policy.deleted` | ConfigModule | Policy removed | high | very-high | low |
| `admin.audit.access.anomaly` | AuditModule | Suspicious access | critical | critical | very-high |
| `admin.audit.security.breach` | AuditModule | Security event | critical | critical | very-high |
| `admin.audit.data.export` | AuditModule | Bulk data export | very-high | very-high | high |
| `admin.system.health.critical` | AdminModule | Health check failure | critical | critical | high |
| `admin.system.health.warning` | AdminModule | Health check warning | high | very-high | medium |
| `admin.system.health.recovered` | AdminModule | Health restored | high | high | low |
| `admin.system.backup.completed` | AdminModule | DB backup finished | high | critical | low |
| `admin.system.backup.failed` | AdminModule | DB backup errored | critical | critical | medium |
| `admin.system.maintenance.scheduled` | AdminModule | Maintenance window | high | very-high | low |
| `admin.system.maintenance.started` | AdminModule | Maintenance begins | critical | critical | low |
| `admin.system.maintenance.completed` | AdminModule | Maintenance ends | critical | critical | low |
| `admin.data.retention.purged` | AdminModule | Retention cleanup | high | very-high | low |
| `admin.data.migration.completed` | AdminModule | Schema migration | very-high | critical | low |
| `admin.data.migration.failed` | AdminModule | Migration error | critical | critical | medium |
| `admin.user.impersonated` | AuditModule | Admin impersonates user | very-high | critical | low |

---

## 4. EVENT CONTRACTS

### 4.1 Contract Structure

Every event type in the catalog has a formal contract. Each contract defines:

| Section | Description |
|---------|-------------|
| **Event Name** | Canonical name from catalog |
| **Version** | Semantic version (major.minor) |
| **Owner** | Owning module |
| **Producer** | Service that emits the event |
| **Trigger** | What causes this event |
| **Business Semantics** | What this event means in business terms |
| **Known Consumers** | List of modules/services that consume this event |
| **Payload Schema** | Logical field definitions |
| **Ordering** | Global sequential / per-key sequential / unordered |
| **Idempotency Key** | Strategy for deduplication |
| **Retry Policy** | Retry tier reference |
| **DLQ Handling** | Dead-letter queue tier |
| **Retention** | Event retention period |
| **Audit Required** | Whether this event produces an AuditLog entry |
| **Security Classification** | L1–L4 |
| **Event Class** | Lifecycle / Business / System / Audit |

### 4.2 Selected Contracts

#### Contract: `user.created`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | IdentityModule |
| **Producer** | AuthService |
| **Trigger** | User registration completes (email+password, social login, or SSO) |
| **Business Semantics** | A new user account has been created. Not yet verified. May or may not be associated with a company. |
| **Known Consumers** | CompaniesModule (member if invited), NotificationModule (welcome), AnalyticsModule, GrowthIntelligenceModule (funnel) |
| **Payload Schema** | `userId`, `email`, `firstName`, `lastName`, `role`, `authMethod` (email/social/sso), `inviteToken?`, `metadata` |
| **Ordering** | Per-user sequential |
| **Idempotency Key** | Natural key: `email` |
| **Retry Policy** | Very High |
| **DLQ Handling** | Tier 2 — alert within 5 minutes |
| **Retention** | 7 years |
| **Audit Required** | Yes |
| **Security Classification** | L3 — Confidential (PII) |
| **Event Class** | Lifecycle |

#### Contract: `company.created`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | CompaniesModule |
| **Producer** | CompanyService |
| **Trigger** | Company registration completes |
| **Business Semantics** | New B2B tenant created. No products, no verification, one owner member. |
| **Known Consumers** | GocashModule (create wallet), TradTrustModule (init score), MembershipModule (default plan), NotificationModule, AnalyticsModule |
| **Payload Schema** | `companyId`, `name`, `slug`, `businessType`, `ownerUserId`, `country`, `metadata` (source, plan) |
| **Ordering** | Per-company sequential |
| **Idempotency Key** | Natural key: `slug` |
| **Retry Policy** | Very High |
| **DLQ Handling** | Tier 2 |
| **Retention** | 7 years |
| **Audit Required** | Yes |
| **Security Classification** | L3 |
| **Event Class** | Lifecycle |

#### Contract: `order.placed`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | CommerceModule |
| **Producer** | OrderService |
| **Trigger** | Buyer confirms order after quote acceptance |
| **Business Semantics** | Legally binding purchase order created. Payment expected. Fulfillment begins. |
| **Known Consumers** | PaymentModule (initiate payment), InventoryModule (reserve stock), NotificationModule (notify seller), AnalyticsModule, KnowledgeGraphModule, GrowthIntelligenceModule, TradTrustModule |
| **Payload Schema** | `orderId`, `orderNumber`, `buyerCompanyId`, `sellerCompanyId`, `quoteId?`, `rfqId?`, `items[]` (productId, quantity, unitPrice, total), `subtotal`, `tax`, `shipping`, `total`, `currency`, `deliveryDate`, `shippingAddress`, `metadata` |
| **Ordering** | Per-buyer sequential |
| **Idempotency Key** | Natural key: `orderId` |
| **Retry Policy** | Critical |
| **DLQ Handling** | Tier 1 — alert on-call immediately |
| **Retention** | 10 years |
| **Audit Required** | Yes |
| **Security Classification** | L3 |
| **Event Class** | Lifecycle |

#### Contract: `order.delivered`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | CommerceModule |
| **Producer** | OrderFulfillmentService |
| **Trigger** | Buyer confirms delivery or delivery proof uploaded |
| **Business Semantics** | Goods received. Escrow release trigger. Revenue recognized. Review invitation sent. |
| **Known Consumers** | PaymentModule (release escrow), SettlementModule (initiate settlement), GoCashModule (reward), NotificationModule, ReviewModule, TradTrustModule, AnalyticsModule |
| **Payload Schema** | `orderId`, `deliveredAt`, `confirmedBy` (buyer/system), `deliveryNotes?`, `photos?`, `condition` (satisfactory/damaged/partial) |
| **Ordering** | Per-order sequential |
| **Idempotency Key** | Natural key: `orderId` |
| **Retry Policy** | Critical |
| **DLQ Handling** | Tier 1 |
| **Retention** | 10 years |
| **Audit Required** | Yes |
| **Security Classification** | L3 |
| **Event Class** | Lifecycle |

#### Contract: `payment.captured`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | PaymentModule |
| **Producer** | PaymentService |
| **Trigger** | Payment gateway confirms successful capture |
| **Business Semantics** | Funds debited from buyer. Held in escrow or settlement account. |
| **Known Consumers** | EscrowModule (hold funds), OrderModule (update status), NotificationModule, MembershipModule (if subscription), AnalyticsModule, FinanceModule |
| **Payload Schema** | `paymentId`, `orderId?`, `bookingId?`, `companyId`, `amount`, `currency`, `gateway`, `gatewayReference`, `fee`, `netAmount`, `method`, `capturedAt` |
| **Ordering** | Per-payment sequential |
| **Idempotency Key** | Natural key: `paymentId` |
| **Retry Policy** | Critical |
| **DLQ Handling** | Tier 1 |
| **Retention** | 10 years |
| **Audit Required** | Yes |
| **Security Classification** | L4 — Restricted (payment details) |
| **Event Class** | Lifecycle |

#### Contract: `settlement.completed`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | PaymentModule |
| **Producer** | SettlementService |
| **Trigger** | Settlement payout transferred to seller/professional |
| **Business Semantics** | Seller received funds net of commission. Financial lifecycle complete. |
| **Known Consumers** | OrderModule (mark financially complete), BookingModule (mark complete), FinanceModule, NotificationModule, GoCashModule |
| **Payload Schema** | `settlementId`, `escrowId`, `payeeCompanyId`, `grossAmount`, `commissionAmount`, `commissionRuleId?`, `netAmount`, `currency`, `payoutReference`, `method`, `settledAt` |
| **Ordering** | Per-settlement sequential |
| **Idempotency Key** | Natural key: `settlementId` |
| **Retry Policy** | Critical |
| **DLQ Handling** | Tier 1 |
| **Retention** | 10 years |
| **Audit Required** | Yes |
| **Security Classification** | L4 |
| **Event Class** | Lifecycle |

#### Contract: `trust.score.recalculated`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | TradTrustModule |
| **Producer** | TradTrustService |
| **Trigger** | Any trust signal change: verification, order completion, dispute, review, age decay |
| **Business Semantics** | Company trust rating updated. Affects search ranking, badge, RFQ matching, buyer confidence. |
| **Known Consumers** | SearchModule (update index), CatalogModule (product ranking), RFQModule (supplier matching), NotificationModule (tier change), AnalyticsModule, KnowledgeGraphModule |
| **Payload Schema** | `companyId`, `overallScore` (0–100), `previousScore`, `dimensions[]` (name, score, delta), `tier`, `previousTier`, `confidence`, `recalculatedAt`, `trigger` |
| **Ordering** | Per-company sequential |
| **Idempotency Key** | Event ID (each recalculation unique) |
| **Retry Policy** | Very High |
| **DLQ Handling** | Tier 2 |
| **Retention** | 10 years |
| **Audit Required** | Yes |
| **Security Classification** | L2 — Internal |
| **Event Class** | Lifecycle |

#### Contract: `booking.completed`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | TradeservModule |
| **Producer** | TradeservService |
| **Trigger** | Professional marks delivered, client confirms, or auto-complete |
| **Business Semantics** | Service delivered. Escrow release. Review invitation. Payment net commission. |
| **Known Consumers** | EscrowModule (release funds), SettlementModule, GoCashModule (reward), ReviewModule, NotificationModule, TradTrustModule, AnalyticsModule |
| **Payload Schema** | `bookingId`, `professionalCompanyId`, `clientCompanyId`, `serviceId`, `amount`, `completedAt`, `completionMethod` (professional/client/auto), `clientFeedback?`, `metadata` |
| **Ordering** | Per-booking sequential |
| **Idempotency Key** | Natural key: `bookingId` |
| **Retry Policy** | Critical |
| **DLQ Handling** | Tier 1 |
| **Retention** | 7 years |
| **Audit Required** | Yes |
| **Security Classification** | L3 |
| **Event Class** | Lifecycle |

#### Contract: `reward.earned`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | GocashModule |
| **Producer** | GocashIntegrationService |
| **Trigger** | Platform event triggers reward: order completed, product published, booking done, review submitted, referral, campaign |
| **Business Semantics** | Company earned GOCASH reward for platform activity. May trigger notifications, level-ups, badges. |
| **Known Consumers** | NotificationModule, EcosystemModule (XP/level/badges), AnalyticsModule, GrowthIntelligenceModule |
| **Payload Schema** | `rewardId`, `companyId`, `userId?`, `amount`, `rewardType` (signup / order_completed / product_published / review_submitted / booking_completed / referral / campaign / milestone / quality_score / ai_used / membership_upgrade), `referenceType`, `referenceId`, `description`, `campaignId?`, `metadata` |
| **Ordering** | Per-company sequential |
| **Idempotency Key** | Producer: `{referenceType}_{referenceId}_{companyId}` |
| **Retry Policy** | High |
| **DLQ Handling** | Tier 3 |
| **Retention** | 10 years |
| **Audit Required** | Yes |
| **Security Classification** | L3 |
| **Event Class** | Business |

#### Contract: `workflow.execution.failed`

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Owner** | AiRuntimeModule |
| **Producer** | WorkflowEngineService |
| **Trigger** | Workflow step encounters unrecoverable error |
| **Business Semantics** | Business process failed. Manual intervention likely required. Compensating transactions may need to execute. |
| **Known Consumers** | NotificationModule (alert operator), AdminModule (dashboard), AuditModule |
| **Payload Schema** | `executionId`, `workflowId`, `workflowName`, `failedStep`, `errorType`, `errorMessage`, `stackTrace?`, `partiallyCompletedSteps[]`, `context` |
| **Ordering** | Per-workflow sequential |
| **Idempotency Key** | Natural key: `executionId` |
| **Retry Policy** | Critical |
| **DLQ Handling** | Tier 1 |
| **Retention** | 5 years |
| **Audit Required** | Yes |
| **Security Classification** | L2 |
| **Event Class** | Lifecycle |

---

## 5. EVENT FLOWS

### 5.1 Company Onboarding

```
Actor: New user (self-registered or invited)

1. user.created                              [IdentityModule → Event Bus]
2. company.created                            [CompaniesModule → Event Bus]
   ├── wallet.created                         [GocashModule → Event Bus]
   ├── trust.score.created                    [TradTrustModule]
   └── subscription.created                   [MembershipModule → Event Bus]
3. member.joined                              [CompaniesModule → Event Bus]
4. verification.company.submitted             [Verification → Event Bus]
   (if documents uploaded during onboarding)
5. verification.document.uploaded             [Verification → Event Bus]
   (multiple documents possible)
6. verification.company.approved              [AdminReview → Event Bus]
   ├── trust.score.recalculated               [TradTrustModule → Event Bus]
   └── verification.level.upgraded            [TradTrustModule → Event Bus]
7. company.onboarding.completed               [CompaniesModule → Event Bus]
   ├── membership.upgrade.completed           [If trial→paid]
   └── reward.earned                          [GoCash signup reward]

Cross-cutting (every event):
   → AuditLog.append
   → Knowledge Graph (entity/relationship upsert)
   → Analytics (funnel tracking)
```

### 5.2 Product Publishing

```
Actor: Seller

1. product.created                            [EnterpriseCatalogModule → Event Bus]
   ├── product.quality.scored                 [QualityEngine → Event Bus]
   ├── product.ai.enriched                    [AIEngine → Event Bus]
   └── analytics.event.ingested               [Tracking]
2. product.updated (iterative)                [Seller edits → Event Bus]
   └── product.quality.scored (re-triggered)
3. product.published                          [Seller or Admin → Event Bus]
   ├── product.first.published                [if first → Event Bus]
   │   └── reward.earned                      [GoCash first-publish reward]
   ├── catalog.item.updated                   [If catalog link created]
   └── trust.score.recalculated               [Product count signal]

Error path:
   product.status.changed → rejected          [Admin rejects → Event Bus]
   └── notification.sent                      [Seller notified]
```

### 5.3 RFQ Lifecycle

```
Actor: Buyer

1. rfq.created                                [SmartRfqModule → Event Bus]
   ├── rfq.completeness.scored                [AIEngine → Event Bus]
   ├── rfq.supplier.matched                   [MatchEngine → Event Bus]
   │   └── notification.sent                  [Matched suppliers alerted]
   ├── rfq.ai.analyzed                        [AIRfqService → Event Bus]
   └── kg.relationship.created                [Knowledge Graph edges]

2. quote.created                              [Seller drafts → Event Bus]
3. quote.submitted                            [Seller submits → Event Bus]
   ├── rfq.first.response                     [if first quote → Event Bus]
   ├── quote.ai.analyzed                      [AIQuoteService → Event Bus]
   └── notification.sent                      [Buyer alerted]

4. quote.accepted                             [Buyer accepts → Event Bus]
   ├── rfq.awarded                            [SmartRfqModule → Event Bus]
   ├── order.placed                           [OrderModule → Event Bus]
   │   └── (continues in Order Flow)
   └── trust.score.recalculated               [TradTrustModule]

Alternative endings:
   rfq.expired                                [No quotes → Event Bus]
   rfq.cancelled                              [Buyer cancels → Event Bus]
   quote.rejected                             [Buyer rejects → Event Bus]
   quote.expired                              [Seller quote expired → Event Bus]
```

### 5.4 Order Lifecycle (Payment & Settlement)

```
Actor: Buyer + Seller + System

1. order.placed                               [CommerceModule → Event Bus]
   ├── payment.initiated                      [PaymentModule → Event Bus]
   ├── inventory.quantity.reserved            [InventoryModule → Event Bus]
   └── notification.sent                      [Seller alerted]

2. payment.captured                           [PaymentModule → Event Bus]
   ├── escrow.held                            [EscrowModule → Event Bus]
   ├── order.confirmed                        [CommerceModule → Event Bus]
   ├── notification.sent                      [Both parties]
   └── settlement.created                     [SettlementModule → Event Bus]

3. order.shipped                              [Seller → Event Bus]
   └── notification.sent                      [Buyer alerted]

4. order.delivered                            [Buyer confirms → Event Bus]
   ├── escrow.released                        [EscrowModule → Event Bus]
   ├── settlement.processing                  [SettlementModule → Event Bus]
   ├── settlement.completed                   [SettlementModule → Event Bus]
   │   └── reward.earned                      [GoCashModule order reward]
   ├── order.completed                        [CommerceModule → Event Bus]
   ├── review.created                         [If buyer reviews → Event Bus]
   ├── inventory.quantity.released            [If over-reserved]
   ├── trust.score.recalculated               [TradTrustModule]
   └── notification.sent                      [Both parties]

Error paths:
   payment.failed →                           [Retry/alternative payment]
     ├── order.cancelled                      [If max retries exceeded]
     └── inventory.quantity.released          [Reservation released]

   order.disputed →                           [Either party]
     ├── escrow.frozen                        [EscrowModule]
     ├── settlement.paused                    [SettlementModule]
     └── dispute.resolved →                   [Admin resolves]
       ├── escrow.released / escrow.refunded
       └── settlement.resumed / settlement.cancelled
```

### 5.5 Membership Activation

```
Actor: Company admin

1. subscription.created                       [MembershipModule → Event Bus]
   ├── plan.activated                         [MembershipModule → Event Bus]
   ├── credit.allocated                       [AI/ad credits → Event Bus]
   └── benefit.activated                      [Per-benefit events]

2. payment.captured                           [PaymentModule → Event Bus]
   (subscription payment confirmation)

3. membership.upgrade.completed               [If plan change → Event Bus]
   ├── subscription.updated                    [MembershipModule → Event Bus]
   ├── credit.allocated                       [Additional credits]
   ├── plan.activated                         [New plan benefits]
   └── reward.earned                          [Upgrade reward]

4. subscription.renewed                       [Auto-renewal → Event Bus]
   ├── payment.captured                       [If charge successful]
   └── membership.upgrade.completed           [If plan changed]

Error paths:
   subscription.payment.failed                [Renewal declined]
     └── subscription.payment.recovered       [If retry succeeds]
     └── subscription.cancelled               [If all retries exhausted]
       └── plan.deactivated                   [Benefits removed]
         └── benefit.expired                  [Per-benefit]
```

### 5.6 TradTrust Verification

```
Actor: Company + Admin

1. verification.company.submitted             [TradTrustModule → Event Bus]
   ├── verification.document.uploaded         [Multiple events possible]
   ├── verification.company.escalated         [If auto-verification fails]
   └── notification.sent                      [Admin alerted]

2. verification.document.verified             [Admin or auto → Event Bus]
   (per document, may repeat)

3. verification.company.approved              [Admin approves → Event Bus]
   ├── verification.level.upgraded            [TradTrustModule → Event Bus]
   ├── trust.score.recalculated               [TradTrustModule → Event Bus]
   ├── trust.tier.changed                     [If score crosses threshold → Event Bus]
   ├── trust.seller.badge.updated             [If seller → Event Bus]
   ├── company.updated                        [Verification metadata → Event Bus]
   └── notification.sent                      [Company notified]

Alternative:
   verification.company.rejected              [Admin rejects → Event Bus]
     └── verification.company.submitted       [Re-apply with new docs]
```

### 5.7 TradeServ Booking

```
Actor: Buyer + Professional + System

1. inquiry.received                           [TradeservModule → Event Bus]
   (optional — pre-booking inquiry)

2. booking.created                            [Buyer requests → Event Bus]
   ├── notification.sent                      [Professional alerted]
   └── analytics.event.ingested               [Booking funnel]

3. booking.confirmed                          [Professional accepts → Event Bus]
   ├── payment.initiated                      [PaymentModule → Event Bus]
   └── booking.payment.confirmed              [Payment captured → Event Bus]
     ├── escrow.held                          [EscrowModule → Event Bus]
     └── notification.sent                    [Buyer confirmed]

4. booking.in.progress                        [Professional starts → Event Bus]
   └── notification.sent                      [Buyer notified]

5. booking.completed                          [Professional completes → Event Bus]
   ├── escrow.released                        [EscrowModule → Event Bus]
   ├── settlement.created → completed         [SettlementModule → Event Bus]
   ├── reward.earned                          [Both parties rewarded]
   ├── review.created                         [If buyer reviews]
   ├── trust.score.recalculated               [Booking signal]
   └── notification.sent                      [Review invitation]

Error paths:
   booking.cancelled                          [Either party]
     └── escrow.refunded                      [If payment held]

   booking.no.show                            [Client absent]
     └── escrow.released (partial/full)       [Per cancellation policy]

   booking.disputed                           [Either party]
     └── escrow.frozen
     └── settlement.paused
```

### 5.8 TradeTalk Publishing

```
Actor: Community member

1. post.created                               [TradeTalkModule → Event Bus]
   ├── content.ai.moderated                   [AIModeration → Event Bus]
   │   └── (may flag/reject/approve post)
   ├── kg.relationship.created                [Author→Post edges]
   └── notification.sent                      [Followers alerted (if following)]

2. comment.created                            [Any user → Event Bus]
   ├── content.ai.moderated                   [AIModeration → Event Bus]
   └── notification.sent                      [Post author alerted]

3. post.liked / post.shared                   [Users engage → Event Bus]
   └── trust.signal.added                     [Engagement signal]

4. post.flagged                               [Reported → Event Bus]
   └── post.moderated                         [Admin action → Event Bus]
     ├── post.deleted (if removed)
     └── notification.sent                    [Author notified]

5. community.trending                         [Threshold reached → Event Bus]
   └── notification.batch.sent                [Community members]
```

### 5.9 AI Agent Execution

```
Actor: Any authorized user or system

1. agent.invoked                              [AiGatewayModule → Event Bus]
   ├── credit.deducted                        [AiGatewayModule → Event Bus]
   │   └── credit.exhausted                   [If no credits remain → Event Bus]
   ├── session.created                        [AiRuntimeModule → Event Bus]
   ├── kg.relationship.created                [Knowledge Graph context]
   ├── memory.context.retrieved               [MemoryModule]
   └── coordination.started                   [If multi-agent → Event Bus]

2. inference.completed                        [Per inference → Event Bus]
   ├── cache.hit                              [If cached → Event Bus]
   ├── memory.fragment.created                [Store result]
   └── approval.requested                     [If human-in-loop → Event Bus]
     ├── approval.granted                     [Actions executed]
     └── approval.rejected                    [Action blocked]

3. agent.completed                            [Success → Event Bus]
   ├── coordination.completed                 [If multi-agent → Event Bus]
   ├── session.completed                      [AiRuntimeModule → Event Bus]
   ├── feedback.submitted                     [If user feedback → Event Bus]
   └── memory.consolidation.completed         [Periodic → Event Bus]

Error paths:
   inference.failed → retry
   agent.failed / agent.timed.out              [After retries exhausted]
     └── model.failover                       [If fallback used → Event Bus]
       ├── (retry with fallback model)
       └── notification.sent                  [Alert operator]
```

### 5.10 GoCash Rewards

```
Actor: System (event-driven)

Trigger event → reward.earned                  [GocashModule → Event Bus]
   ├── transaction.credited                    [GocashModule → Event Bus]
   │   └── reward.earned (complementary types) [Multiple reward types]
   ├── notification.sent                       [In-app + push]
   ├── ecosystem.xp.added                      [EcosystemModule]
   ├── ecosystem.level.changed                 [If XP threshold crossed]
   │   └── reward.earned (level-up reward)
   ├── ecosystem.badge.earned                  [If badge criteria met]
   │   └── reward.earned (badge reward)
   └── trust.signal.added                      [TradTrust activity signal]

Redeem flow:
   redeem.requested                            [User requests → Event Bus]
     ├── redeem.approved                       [Auto or admin → Event Bus]
     │   └── transaction.debited               [Wallet deducted → Event Bus]
     │     └── redeem.completed                [Processed → Event Bus]
     └── redeem.rejected                       [If insufficient balance/policy]
```

### 5.11 Notification Delivery

```
Actor: System (event-driven)

Any business event (eventType = any)

1. (Event reaches NotificationModule via subscription)
   ├── resolve template                       [Match eventType → template]
   ├── resolve recipients                     [Per event data]
   ├── resolve channels                       [Per user preference + template]
   ├── render content                         [Template variables]

2. notification.sent                          [Per channel → Event Bus]
   ├── (IN_APP) → stored, displayed on UI
   ├── (EMAIL) → queued for SES delivery
   │   └── notification.delivery.failed       [If SES bounces → Event Bus]
   └── (SMS) → queued for Twilio delivery
       └── notification.delivery.failed       [If Twilio fails → Event Bus]

3. notification.read                          [User opens → Event Bus]
   └── analytics.event.ingested               [Engagement metric]

Batch path (newsletter campaigns):
   notification.workflow.triggered            [Schedule or event → Event Bus]
   notification.batch.sent                    [Campaign dispatched → Event Bus]
     └── notification.subscriber.unsubscribed [Per bounce/unsubscribe]
   notification.workflow.completed            [Done → Event Bus]
```

### 5.12 Workflow Execution

```
Actor: Event trigger / Schedule / Manual

1. workflow.execution.started                 [AiRuntimeModule → Event Bus]
   └── kg.relationship.created                [Knowledge Graph]

2. workflow.step.completed (per step)         [Sequential/parallel → Event Bus]
   ├── (step produces side effects: events, API calls, notifications)
   ├── workflow.approval.created              [If approval step → Event Bus]
   │   └── workflow.execution.paused          [Waiting for human → Event Bus]
   │     ├── workflow.approval.resolved       [Granted/rejected → Event Bus]
   │     └── workflow.execution.resumed       [Continue → Event Bus]
   ├── workflow.step.retrying                 [On transient failure → Event Bus]
   └── workflow.step.failed                   [On unrecoverable failure → Event Bus]
     └── workflow.execution.failed            [If no retry left → Event Bus]
       └── admin.system.health.warning        [Operator alerted]

3. workflow.execution.completed               [All steps done → Event Bus]
   ├── notification.sent                      [Initiator alerted]
   └── kg.inference.completed                 [Knowledge Graph updated]
```

---

## 6. RELIABILITY MODEL

### 6.1 Delivery Guarantees

| Guarantee | Scope | Implementation |
|-----------|-------|----------------|
| **At-Least-Once** | All events | Consumer must handle duplicates via idempotency key |
| **Ordered per Key** | Financial, escrow, wallet, state machine events | Partitioned by entity ID |
| **Exactly-Once Processing** | Payment, escrow, settlement, refund | Idempotency key + atomic state check + transaction |
| **Best Effort** | Analytics, tracking, knowledge graph | Unordered, may be batched, never critical |

### 6.2 Retry Tiers

| Tier | Attempts | Backoff | After Exhaustion | Alert SLA |
|------|----------|---------|-----------------|-----------|
| **Tier 1 — Critical** | 5 | Exponential: 1s, 2s, 4s, 8s, 16s | DLQ + Page on-call | Immediate |
| **Tier 2 — Very High** | 5 | Exponential: 5s, 10s, 20s, 40s, 80s | DLQ + Alert | 5 minutes |
| **Tier 3 — High** | 3 | Exponential: 30s, 60s, 120s | DLQ + Log | 30 minutes |
| **Tier 4 — Medium** | 3 | Linear: 5min, 10min, 15min | DLQ + Daily digest | Daily |
| **Tier 5 — Low** | 1 | None | Log and discard | None |

### 6.3 Dead-Letter Queue

| Aspect | Policy |
|--------|--------|
| **DLQ Retention** | 30 days |
| **DLQ Replay** | Manual via admin API — retry immediately or schedule |
| **DLQ Threshold Alert** | 10% failure rate per event type in 1-hour window |
| **DLQ Inspection** | Admin dashboard with search, filter, drill-down |
| **DLQ Auto-Purge** | Events older than 30 days automatically deleted |

### 6.4 Failure Modes

| Failure | Impact | Mitigation |
|---------|--------|------------|
| **Producer crash after commit** | Event never emitted | Outbox pattern: event written in same DB transaction as state change |
| **Bus unavailable** | Events not delivered | Producer retries with backoff. Consumer side must be resilient to gaps. |
| **Consumer crash** | Event lost if not persisted before crash | Consumer acknowledges after persisting. Unacknowledged events retried. |
| **Duplicate event** | Double processing | Idempotency key dedup. Natural key or producer-generated. |
| **Poison event** | Consumer repeatedly fails | After max retries, event moves to DLQ. Poison detected automatically. |
| **Slow consumer** | Backpressure on bus | Separate consumer groups per throughput tier. Independent scaling. |
| **Schema mismatch** | Consumer cannot parse event | Schema validation at producer. Consumer must tolerate unknown fields. |

### 6.5 Outbox Pattern

All events that have audit or financial implications MUST use the Transactional Outbox pattern:

```
1. Begin DB transaction
2. Write business entity mutation
3. Write event to event_outbox table (same DB)
4. Commit transaction
5. Asynchronously read from event_outbox and publish to Event Bus
6. Delete or mark event_outbox row as published
```

This guarantees that the event is never lost if the producer crashes after the DB commit but before publishing to the bus.

### 6.6 Consumer Idempotency Strategy

| Strategy | How It Works | When To Use |
|----------|-------------|-------------|
| **Natural key** | Event contains business key (orderId, paymentId) that is unique in consumer's DB | Always preferred |
| **Producer idempotency key** | Event contains `idempotencyKey` header. Consumer stores processed keys. | Financial transactions |
| **Event ID dedup** | Consumer stores `eventId` for dedup window (default 5 minutes) | Fallback when no natural key |
| **State check** | Consumer checks current state before applying. If already applied, skip. | State machine transitions |

---

## 7. GOVERNANCE

### 7.1 Schema Registry

Every event type MUST have a registered schema before production publishing begins.

| Schema Element | Description |
|----------------|-------------|
| **Event Type** | Canonical name from catalog |
| **Version** | Major.minor (semver without patch) |
| **Schema** | JSON Schema or Avro schema definition |
| **Owner** | Owning module |
| **Compatibility Mode** | BACKWARD / FORWARD / FULL / NONE |
| **Created At** | Registration timestamp |
| **Status** | ACTIVE / DEPRECATED / RETIRED |

### 7.2 Compatibility Rules

| Mode | Rule | Example |
|------|------|---------|
| **BACKWARD** (default) | New schema can read old data. Adding optional fields OK. Removing fields BREAKING. | Default for most events |
| **FORWARD** | Old schema can read new data. Consumers tolerate unknown fields. | Analytics events |
| **FULL** | Both backward and forward compatible. | Financial events (strict) |
| **NONE** | No compatibility guarantees. Consumers must upgrade immediately. | Debug/internal events |

### 7.3 Version Evolution

| Change Type | Compatible? | Version Bump | Migration |
|-------------|-------------|--------------|-----------|
| Add optional field | Yes | Minor | None required |
| Add required field | No | Major | Parallel run 14 days |
| Remove field | No | Major | Parallel run 14 days |
| Rename field | No | Major | Parallel run 14 days |
| Change field type | No | Major | Parallel run 14 days |
| Relax constraint (make optional) | Yes | Minor | None |
| Tighten constraint (make required) | No | Major | Parallel run 14 days |
| Add new event type | N/A | N/A | Schema registration only |

**Parallel Run Procedure:**
```
1. Producer publishes both v1 and v2 events for 14 days
2. Consumers migrate to v2 at their own pace
3. After all consumers confirm v2 readiness, v1 publishing stops
4. v1 schema marked DEPRECATED → RETIRED after 30 days
```

### 7.4 Replay Policy

| Aspect | Policy |
|--------|--------|
| **Replay Window** | Up to 30 days for DLQ. Up to 7 days for full replay. |
| **Replay Trigger** | Manual (admin API). Never automatic. |
| **Replay Scope** | Single event type or all events for a subscription. |
| **Replay Safety** | Idempotency keys protect consumers. Duplicates expected and handled. |
| **Replay Throttle** | Max 10,000 events per replay request. Rate-limited to 1,000/min. |
| **Replay Audit** | Every replay request logged with initiator, scope, and timestamp. |

### 7.5 Event Archival

| Event Category | Hot Storage | Warm Storage | Cold Storage | Purge |
|----------------|-------------|--------------|--------------|-------|
| Financial | 90 days | 1 year (compressed) | 10 years (encrypted) | After 10 years |
| Business | 30 days | 6 months (compressed) | 7 years (encrypted) | After 7 years |
| AI/ML | 30 days | 90 days (compressed) | 2 years | After 2 years |
| Analytics | 7 days | 30 days (aggregated) | — | After 30 days raw |
| Debug/System | 7 days | — | — | After 7 days |

### 7.6 Monitoring & Alerting

| Metric | Description | Threshold | Alert |
|--------|-------------|-----------|-------|
| **Publish Rate** | Events/sec per type | +50% above baseline | Warning |
| **Consumer Lag** | Unprocessed events per subscription | > 1,000 | Warning |
| **Consumer Lag** | Unprocessed events per subscription | > 10,000 | Critical |
| **Error Rate** | Failed deliveries per type | > 1% in 5 min | Warning |
| **Error Rate** | Failed deliveries per type | > 5% in 5 min | Critical |
| **DLQ Depth** | Events in dead-letter queue per type | > 10/type | Warning |
| **DLQ Depth** | Events in dead-letter queue | > 100 total | Critical |
| **Latency P99** | End-to-end delivery latency | > 5 seconds | Warning |
| **Latency P99** | End-to-end delivery latency | > 30 seconds | Critical |

### 7.7 Schema Registry API

(Refer to API Contracts Section 5.6 for the complete API surface.)

The Schema Registry maintains:
- Every event type with its active and historical schemas
- Compatibility validation on schema registration
- Schema diff tool for version comparison
- Consumer registry listing which services subscribe to which event versions

---

## 8. SECURITY

### 8.1 Event Security Classification

Every event is classified into one of four levels (matching Data Model Section 10.4):

| Level | Label | Examples | Handling |
|-------|-------|----------|----------|
| **L1** | Public | `post.created`, `review.created` | No encryption required, no access control |
| **L2** | Internal | `trust.score.recalculated`, `product.quality.scored` | Auth required for subscribe, at-rest encryption |
| **L3** | Confidential | `order.placed`, `payment.captured`, `booking.created` | Auth + at-rest encryption + in-transit encryption + audit |
| **L4** | Restricted | `payment.failed` (with card details), `admin.user.impersonated` | Auth + encryption + access logging + limited retention |

### 8.2 Event Bus Security

| Layer | Control |
|-------|---------|
| **Authentication** | Events published by authenticated producers only. Service tokens for internal producers. |
| **Authorization** | Consumers must be authorized to subscribe to event types. Admin-only for L3+ events. |
| **Encryption in Transit** | TLS 1.3 for all Event Bus communication. |
| **Encryption at Rest** | L3+ events encrypted at rest. L4 events encrypted with tenant-isolated keys. |
| **Audit** | Every publish, subscribe, and consume action logged. Subscriptions reviewed quarterly. |
| **Data Minimization** | Events carry minimum payload needed for consumers. No PII in event data unless required. |
| **Consumer Isolation** | Consumer groups are isolated. One consumer cannot read another consumer's queue. |

### 8.3 Webhook Security

(Refer to API Contracts Section 5.3 for the complete webhook security model.)

- HMAC-SHA256 signature for every webhook delivery
- Signature timestamp prevents replay attacks (max 5-minute skew)
- Webhook secret rotatable via API (immediate invalidation)
- IP allowlisting for production webhook endpoints
- Payload signing, not transport-level security (supports relays)

### 8.4 Sensitive Event Handling

| Type | Handling |
|------|----------|
| **PII in events** | Masked or tokenized. Full PII only when required for business operation. |
| **Payment details** | Never included. Event references paymentId only. Full details via authorized API. |
| **Password hashes** | Never included in any event. |
| **API keys/secrets** | Never included in any event. |
| **Internal IPs** | Never included in events destined for webhooks. |

---

## 9. OBSERVABILITY

### 9.1 Correlation ID

- Generated at the API entry point (HTTP request, webhook, scheduled job)
- Propagated through every downstream event
- Included in every event envelope as `correlationId`
- Enables tracing a single business transaction across all domain boundaries

```
API Request (correlationId = corr_abc)
  → order.placed (correlationId = corr_abc)
    → payment.initiated (correlationId = corr_abc)
      → payment.captured (correlationId = corr_abc)
        → escrow.held (correlationId = corr_abc)
          → settlement.completed (correlationId = corr_abc)
```

### 9.2 Trace ID

- Generated per event publish (may differ from correlationId)
- Included in every event envelope as `traceId`
- Enables distributed tracing across producer, bus, and consumer
- Trace ID format compatible with OpenTelemetry (W3C Trace Context)

### 9.3 Event Logging

| Log Point | Data | Destination |
|-----------|------|-------------|
| **Event produced** | eventId, eventType, correlationId, traceId, timestamp | Structured log + metrics |
| **Event consumed** | eventId, consumerId, processingStarted, processingEnded, success/failure | Structured log + metrics |
| **Event DLQ'd** | eventId, eventType, reason, retryCount, originalTimestamp | Structured log + alert |
| **Event replayed** | replayId, eventType, scope, initiator, timestamp | Audit log |

### 9.4 Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `events_produced_total` | Counter | eventType, domain, producer |
| `events_consumed_total` | Counter | eventType, consumer |
| `events_consumer_lag` | Gauge | eventType, consumerGroup |
| `events_dlq_depth` | Gauge | eventType |
| `events_processing_duration` | Histogram | eventType, consumer |
| `events_retry_count` | Histogram | eventType |
| `events_error_total` | Counter | eventType, errorType |

### 9.5 SLA Monitoring

| Tier | Description | Target |
|------|-------------|--------|
| **P0 — Financial** | Payment, escrow, settlement events | P99 < 500ms, 0% loss |
| **P1 — Business** | Order, booking, verification events | P99 < 2s, < 0.01% loss |
| **P2 — Operational** | Notification, analytics, knowledge graph | P99 < 5s, < 0.1% loss |
| **P3 — Best Effort** | Tracking, memory, system events | No SLA, at-least-once |

---

## 10. READINESS CHECKLIST

### 10.1 Per-Event-Type Checklist

| # | Check | Verification |
|---|-------|-------------|
| 1 | Event name registered in catalog | Section 3 entry exists |
| 2 | Event contract documented | Section 4 entry exists with all fields |
| 3 | Schema registered in Schema Registry | `POST /api/v1/events/schemas` registered |
| 4 | Schema validated as backward-compatible | Compatibility check passed |
| 5 | Owning module identified | Owner field in contract |
| 6 | All known consumers documented | Known Consumers field in contract |
| 7 | Payload schema defined with all fields | Logical schema in contract |
| 8 | Ordering guarantee specified | Ordered or unordered |
| 9 | Idempotency strategy defined | Natural key, producer key, or event ID |
| 10 | Retry tier assigned | Tiers 1–5 |
| 11 | DLQ handling defined | DLQ tier |
| 12 | Retention period specified | Per Data Model retention schedule |
| 13 | Audit requirement documented | True/False |
| 14 | Security classification assigned | L1–L4 |
| 15 | Event class assigned | Lifecycle / Business / System / Audit |
| 16 | Priority classification assigned | Critical / Very High / High / Medium / Low |
| 17 | Business value classification assigned | Critical / Very High / High / Medium / Low |
| 18 | Learning value classification assigned | Very High / High / Medium / Low / None |
| 19 | Producer implemented (Outbox pattern if financial) | Service code review |
| 20 | Consumer idempotent handling implemented | Consumer code review |

### 10.2 Event Flow Checklist

| # | Check | Verification |
|---|-------|-------------|
| 1 | Everything that can go wrong has an error path | Section 5 error paths documented |
| 2 | All side effects are documented | Event flows trace side effects |
| 3 | Compensating events exist for rollback scenarios | Reverse flows documented |
| 4 | Knowledge Graph events included for all domain entities | KG events in flows |
| 5 | Analytics events included for tracked metrics | Analytics events in flows |
| 6 | Notification events included where user-facing | Notification events in flows |
| 7 | GoCash reward events included where applicable | Reward events in flows |
| 8 | TradTrust score events included where trust signals change | Trust events in flows |

### 10.3 Governance Checklist

| # | Check | Verification |
|---|-------|-------------|
| 1 | Schema Registry is populated for all event types | Registry API |
| 2 | Compatibility mode is set for each schema | BACKWARD/FORWARD/FULL/NONE |
| 3 | Version evolution policy is documented | Section 7.3 |
| 4 | Replay policy is defined | Section 7.4 |
| 5 | Archival strategy is defined per category | Section 7.5 |
| 6 | Monitoring dashboards exist for all event metrics | Grafana dashboards |
| 7 | Alert thresholds are configured | PagerDuty/OpsGenie |
| 8 | Correlation ID propagation is verified | Trace across 3+ domains |
| 9 | Outbox pattern implemented for all financial events | Code review |
| 10 | Event security classification is enforced | Access control audit |

### 10.4 Launch Gate Criteria

| # | Criteria | Verification |
|---|----------|-------------|
| 1 | All P0 event types have registered schemas | Schema Registry |
| 2 | All P0 event flows are documented with error paths | Section 5 |
| 3 | Consumer idempotency is verified for P0 events | Integration test |
| 4 | DLQ routing is configured for all retry tiers | Infrastructure review |
| 5 | Correlation ID propagation is verified end-to-end | Trace test |
| 6 | At-least-once delivery is validated | Integration test |
| 7 | Outbox pattern is implemented for financial events | Code review |
| 8 | Monitoring and alerting is configured | Dashboard review |
| 9 | Event bus encryption is enabled (TLS + at-rest) | Security review |
| 10 | Webhook HMAC signing is verified | Integration test |

---

> **End of TRADINGO Enterprise Event Architecture v1.0**
>
> *"Design is complete. Implementation may begin. Events are the nervous system of the platform."*
