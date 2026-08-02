# TRADINGO INTELLIGENCE ARCHITECTURE

## Unified Intelligence & Knowledge Architecture — Single Source of Truth

---

> **Version**: 1.0
> **Classification**: Founder Confidential — Intelligence Architecture
> **Author**: Intelligence Architecture Sprint (IAS-01)
> **Date**: July 2026
> **Scope**: Zero code — intelligence architecture, knowledge graph, memory, events, decisions, learning, trust, personalisation. Single source of truth for all future AI implementation.
> **Prerequisite**: TRADINGO-FOUNDER-BLUEPRINT-2030.md (FAS-01)

---

## TABLE OF CONTENTS

1. Executive Summary
2. Intelligence Principles
3. Unified Knowledge Graph
4. Business Memory
5. Event Intelligence
6. Decision Architecture
7. Agent Collaboration
8. Personalisation Strategy
9. Learning Strategy
10. Trust Intelligence
11. Capability Map
12. Future Implementation Guidelines

---

## 1. EXECUTIVE SUMMARY

TRADINGO's competitive moat is not its codebase, its listings, or its user base. It is intelligence — the accumulated understanding of millions of business interactions, relationships, decisions, and outcomes. Every RFQ, every negotiation, every payment, every support ticket, every TradeTalk conversation feeds a unified intelligence backbone that grows smarter with each interaction.

This document defines that backbone.

**The Core Architecture:**

```
                         ┌──────────────────────────┐
                         │   EXPERIENCE LAYER        │
                         │  (UI / API / Voice)       │
                         └──────────┬───────────────┘
                                    │
                         ┌──────────▼───────────────┐
                         │   DECISION LAYER          │
                         │  (Recommendations /       │
                         │   Predictions / Actions)  │
                         └──────────┬───────────────┘
                                    │
┌───────────────────────────────────┼───────────────────────────────────┐
│           INTELLIGENCE MIDDLEWARE │                                   │
│                                   │                                   │
│  ┌────────────────┐  ┌───────────▼──────────┐  ┌──────────────────┐  │
│  │  EVENT ENGINE  │──►  KNOWLEDGE GRAPH    │  │  MEMORY SYSTEMS   │  │
│  │  (Stream +     │  │  (Entities +        │  │  (Episodic +      │  │
│  │   Batch)       │  │   Relationships)    │  │   Semantic +      │  │
│  └────────────────┘  └──────────┬──────────┘  │   Procedural)     │  │
│                                 │              └──────────────────┘  │
│  ┌────────────────┐  ┌──────────▼──────────┐  ┌──────────────────┐  │
│  │  TRUST ENGINE  │  │  LEARNING ENGINE    │  │  PERSONALISATION │  │
│  │  (TradTrust)   │  │  (Model Training +  │  │  (Behaviour +    │  │
│  │                │  │   Feedback Loops)   │  │   Context)       │  │
│  └────────────────┘  └─────────────────────┘  └──────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                         ┌──────────▼───────────────┐
                         │     DATA LAYER            │
                         │  (PostgreSQL / Redis /    │
                         │   Vector Store /          │
                         │   Object Store /          │
                         │   Event Store)            │
                         └──────────────────────────┘
```

**Four Key Commitments:**

1. **Every interaction must contribute to platform intelligence.** No event is too small. A search with no results, a failed payment, a rejected quote — every signal has learning value.
2. **Intelligence must be accessible to every AI agent.** No silos. No duplicate knowledge. The Knowledge Graph is the single source of truth for business relationships.
3. **Decisions must be explainable.** Every recommendation includes signals used, confidence level, evidence, risk assessment, and expected business impact.
4. **The platform must improve autonomously.** Feedback loops at every level ensure continuous learning without human intervention.

---

## 2. INTELLIGENCE PRINCIPLES

### 2.1 Foundational Principles

| # | Principle | Description | Implication |
|---|-----------|-------------|-------------|
| 1 | **Event-First** | Every platform interaction generates a typed, structured event | All modules must emit events; no side-effect-only code |
| 2 | **Graph-Native** | Business relationships are stored as a traversable graph | Knowledge Graph is the primary query surface for AI; SQL is secondary |
| 3 | **Memory-Persistent** | No business knowledge is ever deleted | All interactions, decisions, and outcomes are permanently stored |
| 4 | **Decision-Transparent** | Every AI recommendation includes full reasoning | Explainability is a non-negotiable output of the Decision Engine |
| 5 | **Confidence-Gated** | AI actions are proportional to confidence | Low confidence → suggest; Medium → recommend; High → execute autonomously |
| 6 | **Feedback-Closed** | Every decision has a feedback mechanism | Positive and negative outcomes both train the system |
| 7 | **Cross-Domain** | Learning in one domain benefits all domains | Seller behaviour insights improve buyer recommendations |
| 8 | **Privacy-Preserving** | Business intelligence is never shared between businesses | Aggregated patterns only; individual data is compartmentalised |
| 9 | **Real-Time First** | Intelligence is available within seconds of events | Batch processing for model training only; live queries are always fresh |
| 10 | **Cost-Aware** | Intelligence depth is proportional to transaction value | High-value transactions get full reasoning; low-value get fast heuristics |

### 2.2 Intelligence Quality Metrics

Every intelligence output must be measurable:

| Metric | Definition | Target |
|--------|------------|--------|
| **Decision Accuracy** | % of AI recommendations that achieve stated outcome | >85% |
| **Confidence Calibration** | Alignment between stated confidence and actual accuracy | ±5% |
| **Latency (P95)** | Time from event to intelligence availability | <2s |
| **Explanation Completeness** | % of decisions with complete, human-readable reasoning | 100% |
| **Feedback Capture Rate** | % of decisions with captured outcome feedback | >90% |
| **Knowledge Freshness** | Time from event to Knowledge Graph update | <5s |
| **Agent Collaboration Success** | % of multi-agent requests completed successfully | >95% |
| **Personalisation Accuracy** | % of personalised recommendations that improve outcomes | >70% |

---

## 3. UNIFIED KNOWLEDGE GRAPH

### 3.1 Purpose

The Knowledge Graph is the central nervous system of TRADINGO's intelligence. It is a directed, labelled, property graph that represents all business entities, their attributes, and the relationships between them. It is not a secondary index — it is the primary representation of business knowledge.

### 3.2 Entity Types

Every entity in the Knowledge Graph has a type, a unique ID, a temporal scope (birth → last update → optional death), and a set of typed properties.

#### 3.2.1 Core Entities

| Entity | Description | Unique Identity | Critical Properties |
|--------|-------------|-----------------|-------------------|
| **Company** | Any business entity (buyer, seller, manufacturer, distributor, service provider) | `company:{id}` | name, type, industry, size, location, verificationLevel, status, tradTrustScore, foundedDate |
| **Person** | Any human user (founder, buyer, seller, professional, admin) | `person:{id}` | name, role, company, verificationLevel, expertise, communicationPreference |
| **Product** | A sellable item in the catalog | `product:{id}` | name, category, brand, attributes, hsCode, priceRange, status, qualityScore |
| **Service** | A professional service offered via TradeServ | `service:{id}` | name, category, professional, priceRange, serviceArea, status |
| **RFQ** | A request for quotation | `rfq:{id}` | buyer, products, quantity, budget, timeline, status, category |
| **Quote** | A supplier response to an RFQ | `quote:{id}` | supplier, rfq, product, price, terms, validity, status |
| **Order** | A confirmed purchase | `order:{id}` | buyer, supplier, products, amount, status, paymentTerms, deliveryDate |
| **Invoice** | A billing document | `invoice:{id}` | order, amount, tax, status, dueDate, paidDate |
| **Payment** | A financial transaction | `payment:{id}` | order, amount, method, status, timestamp, gatewayReference |
| **Conversation** | A communication thread | `conversation:{id}` | participants, type, channel, subject, messageCount, outcome |
| **Document** | Any uploaded or generated file | `document:{id}` | type, entity, status, verificationStatus, expiryDate |
| **Certification** | A verified credential | `certification:{id}` | certifier, entity, type, issueDate, expiryDate, status |
| **Location** | A geographic point | `location:{id}` | address, city, state, country, coordinates, type |
| **Industry** | An industry classification | `industry:{id}` | name, code, parent, description |
| **Category** | A product/service category | `category:{id}` | name, parent, attributes, industry |
| **Membership** | A subscription plan | `membership:{id}` | company, plan, startDate, endDate, status, tier |
| **Community** | A TradeTalk community | `community:{id}` | name, type, members, topics, industry |
| **TrustSignal** | A verifiable trust indicator | `trustsignal:{id}` | source, target, type, weight, timestamp, evidence |
| **GrowthSignal** | A growth trajectory indicator | `growthsignal:{id}` | company, type, metric, value, trend, timestamp |
| **Achievement** | A GOCASH or platform milestone | `achievement:{id}` | entity, type, level, timestamp, reward |

#### 3.2.2 Relationship Types

Relationships are directional, typed, and temporal. Each relationship has:
- **Source Entity ID**
- **Target Entity ID**
- **Relationship Type** (from ontology below)
- **Properties** (weight, confidence, firstObserved, lastObserved, metadata)
- **Status** (active, inactive, archived)

**Commerce Relationships:**

| Relationship | Source | Target | Meaning | Weight Factors |
|-------------|--------|--------|---------|----------------|
| `SUPPLIES` | Company | Product/Service | This company supplies this product/service | Volume, consistency, recency |
| `BUYS` | Company | Product/Service | This company purchases this product/service | Volume, frequency, recency |
| `SOURCES_FROM` | Company | Company | Buyer-supplier relationship | Transaction volume, duration, quality |
| `SELLS_TO` | Company | Company | Supplier-buyer relationship | Same as SOURCES_FROM (inverse) |
| `RFQ_CREATED` | Company | RFQ | Company created this RFQ | N/A (factual) |
| `QUOTE_FOR` | Quote | RFQ | Quote responds to RFQ | N/A (factual) |
| `QUOTED_BY` | Quote | Company | Quote was provided by this company | N/A (factual) |
| `ORDER_FOR` | Order | Quote/RFQ | Order originates from this quote/RFQ | N/A (factual) |
| `INVOICE_FOR` | Invoice | Order | Invoice for this order | N/A (factual) |
| `PAID_BY` | Payment | Order/Invoice | Payment for this order/invoice | N/A (factual) |

**Organisational Relationships:**

| Relationship | Source | Target | Meaning | Temporal |
|-------------|--------|--------|---------|----------|
| `EMPLOYS` | Company | Person | Person works at company | Always (with date range) |
| `OWNS` | Person | Company | Person owns company | Always |
| `MANAGES` | Person | Company/RFQ/Order | Person manages entity | Always |
| `LOCATED_AT` | Company/Person | Location | Physical location | Always (can change) |
| `BELONGS_TO` | Product/Service | Category | Category membership | Always |
| `CLASSIFIES` | Company | Industry | Industry classification | Always |
| `HAS_MEMBERSHIP` | Company | Membership | Current/ past subscription | Always (with date range) |

**Trust Relationships:**

| Relationship | Source | Target | Meaning | Computation |
|-------------|--------|--------|---------|-------------|
| `TRUSTS` | Company | Company | Computed trust score | TradTrust engine |
| `VERIFIED_BY` | Company/Certification | Company | Verification by authority | Based on documents |
| `CERTIFIED_FOR` | Certification | Company | Company holds certification | Certification entity |
| `HAS_TRUST_SIGNAL` | TrustSignal | Company | Trust indicator | Platform computation |
| `DISPUTED_WITH` | Company | Company | Dispute history | Dispute records |
| `ENDORSED_BY` | Company | Company | Endorsement | Network signal |

**Network Relationships:**

| Relationship | Source | Target | Meaning | Strength Factors |
|-------------|--------|--------|---------|-----------------|
| `FOLLOWS` | Person/Company | Person/Company | TradeTalk follow | N/A |
| `MEMBER_OF` | Person/Company | Community | Community membership | Participation level |
| `COLLABORATES_WITH` | Company | Company | Multi-transaction relationship | Breadth, depth, longevity |
| `REFERRED_BY` | Company | Company | Referral relationship | Referral success |
| `COMPETES_WITH` | Company | Company | Market competition | Category/industry overlap |
| `PARTNERS_WITH` | Company | Company | Strategic partnership | Formal partnership |

**Knowledge Relationships:**

| Relationship | Source | Target | Meaning |
|-------------|--------|--------|---------|
| `MENTIONS` | Conversation/Document | Product/Company | Content references entity |
| `DISCUSSES` | Conversation | Topic | Topic of conversation |
| `RESOLVES` | Conversation | Issue | Issue resolution |
| `RELATES_TO` | Document | Entity | Document relevance |
| `HAS_ATTRIBUTE` | Entity | Attribute | Entity property |
| `SIMILAR_TO` | Product/Company | Product/Company | Computed similarity |

### 3.3 Graph Evolution Over Time

The Knowledge Graph is not static — relationships evolve continuously:

**Time Dimensions:**
- **First Observed**: When a relationship was first detected
- **Last Confirmed**: Last verification of relationship validity
- **Weight Trajectory**: How relationship strength has changed over time (increasing, stable, declining)
- **Temporal Segments**: Relationship characteristics in different time windows

**Evolution Patterns:**

| Pattern | Description | Graph Impact |
|---------|-------------|--------------|
| **Relationship Formation** | Two entities begin interacting | Edge created with initial weight |
| **Relationship Strengthening** | More transactions, higher quality | Edge weight increases |
| **Relationship Weakening** | Fewer interactions, negative signals | Edge weight decreases or decays |
| **Relationship Termination** | No interaction for defined period | Edge status → `inactive` |
| **Relationship Restoration** | Interaction resumes after inactivity | Edge status → `active`, weight may resume from previous |
| **Relationship Damage** | Dispute, failed transaction, complaint | Edge weight decreases, negative properties added |
| **Relationship Repair** | Successful resolution of dispute | Edge weight partially recovers |
| **Entity Maturation** | Company grows, adds capabilities | Entity properties updated, new edges formed |

**Decay Function:**
```
relationship.weight(t) = relationship.base_weight × e^(-λ × Δt)
Where:
  - λ = decay rate (configurable per relationship type)
  - Δt = time since last relationship activity
  - relationship.base_weight = maximum weight achieved during active period
```

### 3.4 Query Patterns

The Knowledge Graph supports these query patterns for AI agents:

| Pattern | Description | Example |
|---------|-------------|---------|
| **Entity Resolution** | Find entity by attributes | "Find the company with GSTIN 27AAABC1234A1Z5" |
| **Path Traversal** | Follow relationships | "What products does Company A supply that Company B buys?" |
| **Subgraph Extraction** | Get connected subgraph | "Get Company A's supplier network within 500km" |
| **Similarity Search** | Find similar entities | "Find companies similar to Company A in the same industry" |
| **Anomaly Detection** | Find unusual patterns | "Which relationships have abnormally high dispute rates?" |
| **Temporal Query** | Get state at a point in time | "What was Company A's supplier network in January 2026?" |
| **Aggregation** | Compute metrics over subgraph | "What is the average TradTrust score of Company A's suppliers?" |
| **Recommendation** | Rank entities by relevance | "Which suppliers have the highest combination of trust + capacity + proximity?" |

### 3.5 Graph Storage Architecture

```
┌─────────────────────────────────────────────────────┐
│                  KNOWLEDGE GRAPH                     │
├─────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐ │
│  │  REAL-TIME GRAPH (RedisGraph / FalkorDB)       │ │
│  │  - Current state                                │ │
│  │  - Hot entities and relationships               │ │
│  │  - Sub-millisecond traversal                    │ │
│  │  - TTL-managed (hot only)                      │ │
│  └────────────────────────────────────────────────┘ │
│                      ↕ sync                          │
│  ┌────────────────────────────────────────────────┐ │
│  │  PERSISTENT GRAPH (PostgreSQL + pg_graphql)    │ │
│  │  - Complete state                               │ │
│  │  - Historical segments                          │ │
│  │  - Full temporal queries                        │ │
│  │  - ACID compliance                             │ │
│  └────────────────────────────────────────────────┘ │
│                      ↕ enrich                        │
│  ┌────────────────────────────────────────────────┐ │
│  │  VECTOR INDEX (pgvector / Pinecone)            │ │
│  │  - Semantic embeddings                         │ │
│  │  - Similarity search                           │ │
│  │  - Entity and relationship vectors             │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 4. BUSINESS MEMORY

### 4.1 Memory Architecture

TRADINGO's memory is modelled on human memory — different types for different purposes, with automatic transitions between types.

```
                         ┌─────────────────────────┐
                         │   WORKING MEMORY         │
                         │   (Current Session)      │
                         │   TTL: Session           │
                         │   Store: Redis            │
                         └───────────┬─────────────┘
                                     │ promote
                         ┌───────────▼─────────────┐
                         │   SHORT-TERM MEMORY      │
                         │   (Recent Activity)      │
                         │   TTL: 30 days           │
                         │   Store: PostgreSQL      │
                         └───────────┬─────────────┘
                                     │ consolidate
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
  ┌───────────▼──────────┐ ┌────────▼─────────┐ ┌──────────▼──────────┐
  │ EPISODIC MEMORY      │ │ SEMANTIC MEMORY  │ │ PROCEDURAL MEMORY   │
  │ (Past Experiences)   │ │ (Facts &         │ │ (How things work)   │
  │                      │ │  Knowledge)      │ │                     │
  │ - Past transactions  │ │ - Company goals  │ │ - Business workflows │
  │ - Past negotiations  │ │ - Preferences    │ │ - SOPs              │
  │ - Past disputes      │ │ - Supplier prefs │ │ - Approval chains   │
  │ - Past support       │ │ - Payment habits │ │ - Compliance reqs   │
  │   tickets            │ │ - Industry norms │ │ - Custom rules      │
  │ - Past searches      │ │ - Market facts   │ │ - Integration maps  │
  │                      │ │ - Relationship   │ │                     │
  │ TTL: Permanent       │ │   summaries      │ │ TTL: Until changed  │
  │ Store: PostgreSQL    │ │                  │ │ Store: PostgreSQL   │
  │ + Object Store       │ │ TTL: Permanent   │ │ + K8s ConfigMap     │
  └──────────────────────┘ │ Store: Knowledge │ └─────────────────────┘
                           │   Graph          │
                           └──────────────────┘
```

### 4.2 Working Memory (Session)

**What it holds:**
- Current page/screen context
- Active search query and results
- Items currently in negotiation or checkout
- Recent AI agent interactions
- Temporary computation results

**Characteristics:**
- Volatile — lost when session ends
- Sub-millisecond access
- Stored in Redis with session TTL
- Max 100 entries per session

### 4.3 Short-Term Memory (Recent Activity)

**What it holds:**
- Last 30 days of platform activity
- Recently viewed products and suppliers
- Recent conversations and messages
- Recent RFQs, quotes, orders
- Dismissed recommendations (negative feedback)
- Abandoned workflows

**Characteristics:**
- Automatically consolidated from events
- Used for immediate personalisation
- 30-day retention with automatic pruning
- Stored in PostgreSQL with time-based partitioning

**Consolidation Trigger:**
```
For each event:
  1. Write to Short-Term Memory
  2. If event importance > threshold → promote to Episodic Memory
  3. If factual knowledge extracted → promote to Semantic Memory
  4. If workflow pattern detected → promote to Procedural Memory
  
Importance Score = f(event_type, business_value, entity_priority)
```

### 4.4 Episodic Memory (Past Experiences)

**What it holds:**
- Every past transaction with full context
- Every negotiation with strategy and outcome
- Every dispute with resolution details
- Every support interaction and resolution
- Every search session and click path
- Every recommendation and its outcome

**Characteristics:**
- Permanent — never deleted
- Append-only — new episodes never modify old ones
- Rich metadata — each episode includes context, decisions, outcomes, and emotions (sentiment)
- Stored in PostgreSQL with object store attachments for large context
- Queryable by time, entity, event type, outcome, sentiment

**Episode Structure:**
```
Episode {
  id: UUID
  type: Transaction | Negotiation | Support | Search | Recommendation | ...
  timestamp: DateTime
  entities: [Entity]  // involved companies, people, products
  context: JSON       // full state at time of event
  action: JSON        // what happened
  outcome: {          // what resulted
    result: Success | Failure | Partial
    metrics: { revenue_impact, time_saved, satisfaction_delta }
    feedback: UserFeedback | null
  }
  importance: Float   // computed importance score
  embeddings: Vector  // for semantic retrieval
}
```

### 4.5 Semantic Memory (Facts & Knowledge)

**What it holds:**
- Company goals and strategic priorities
- Business preferences and constraints
- Supplier preferences and blacklists
- Payment habits and risk tolerance
- Communication preferences and style
- Industry-specific knowledge and norms
- Market facts and competitive intelligence
- Relationship summaries (not raw history)
- TradTrust scores and trust dimensions

**Characteristics:**
- Permanent — updated, never deleted
- Derived from Episodic Memory via consolidation
- Stored in Knowledge Graph and Vector Store
- Facts have confidence scores (how certain are we?)
- Facts have source attribution (which episode produced this?)

**Fact Lifecycle:**
```
Observation → Hypothesis → Confirmed(confidence) → Established Fact
                               ↓
                         Contradicted → Revised Fact(confidence reduced)
```

### 4.6 Procedural Memory (How Things Work)

**What it holds:**
- Custom business workflows and approval chains
- Standard operating procedures extracted from behaviour
- Compliance requirements and regulatory rules
- Negotiation strategies that historically work
- Communication templates that get responses
- Optimal pricing formulas for repeat purchases

**Characteristics:**
- Editable by businesses (they own their procedures)
- Learnable by AI (observed patterns become suggested procedures)
- Machine-readable (executable, not just documentation)
- Versioned (procedures change over time)
- Stored in PostgreSQL (structured) + Knowledge Graph (relationships)

**Procedure Types:**
```
Workflow: Sequential steps with conditions and approvals
Rule: IF condition THEN action
Template: Reusable structure with variables
Policy: Constraint that must not be violated
Strategy: Approach with decision criteria
```

### 4.7 Shared Organisational Memory

**What it is:** Memory that spans across all entities of the same type, aggregated and anonymised.

**Contents:**
- Industry benchmarks (aggregated, no individual data)
- Market trends detected across multiple businesses
- Best practices identified from successful businesses
- Common problems and solutions
- Seasonal patterns and market timing
- Successful negotiation strategies (anonymised)

**Access Control:**
- Only aggregated patterns (min 5 contributing businesses)
- No individual business data exposed
- Opt-out available for sensitive analyses
- Differential privacy for all shared insights

### 4.8 Agent Memory

**What it is:** Each AI agent maintains its own memory partition.

**Contents:**
- Conversation history with users
- Past decisions and their outcomes
- In-progress tasks and state
- User preferences for interaction style
- Agent-specific learned patterns
- Confidence calibration data

**Characteristics:**
- Isolated per agent instance (Company A's Buyer AI ≠ Company B's Buyer AI)
- Hierarchical (agent can access its own memory, not other agents')
- Shared pool for cross-agent collaboration (see Section 7)
- Ephemeral for stateless agents, persistent for stateful agents

### 4.9 Memory Retrieval Protocol

```
Agent Query → Memory Retrieval Engine

1. Check Working Memory (fastest, session-scoped)
2. If not found, check Short-Term Memory (fast, recent-scoped)
3. If not found, check Semantic Memory (medium, fact-scoped)
4. If not found, check Episodic Memory (slow, full-scoped)
   a. Structured query (by entity, type, time)
   b. Semantic query (by embedding similarity)
5. If not found, check Shared Organisational Memory (slowest, anonymised)

Each level returns:
  - Matched memories with relevance scores
  - Confidence in each match
  - Source attribution (which episode/fact produced this)
  - Time to live / freshness indicator
```

---

## 5. EVENT INTELLIGENCE

### 5.1 Event Taxonomy

Every event in TRADINGO has a unique type, a schema, a priority, a learning value, and a business value. Events are the atomic unit of intelligence — everything the platform learns comes from events.

#### 5.1.1 Identity & Lifecycle Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `registration.started` | Low | Medium | Low | userId, timestamp, channel, referrer |
| `registration.completed` | Medium | High | High | userId, companyId, role, industry, location |
| `profile.updated` | Low | Medium | Medium | userId, changedFields, previousValues |
| `company.verified` | High | Very High | Very High | companyId, verificationLevel, documents |
| `company.kyc_submitted` | Medium | High | High | companyId, documentTypes |
| `company.kyc_approved` | Very High | Very High | Very High | companyId, verifier, level |
| `company.kyc_rejected` | High | High | Medium | companyId, reason, resubmissionCount |

#### 5.1.2 Commerce Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `product.created` | Medium | High | High | productId, companyId, category, attributes |
| `product.updated` | Low | Medium | Medium | productId, changedFields |
| `product.published` | Medium | High | High | productId, companyId |
| `product.unpublished` | Low | Medium | Medium | productId, reason |
| `product.quality_updated` | Medium | Medium | Medium | productId, score, dimensions |
| `product.ai_enriched` | Low | Medium | Low | productId, enrichmentType |

#### 5.1.3 Discovery Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `search.executed` | Low | Very High | Medium | userId, query, filters, resultCount, responseTime |
| `search.zero_results` | Medium | Very High | High | userId, query, filters — **critical for catalog gaps** |
| `search.result_clicked` | Medium | High | High | userId, query, resultId, position, dwellTime |
| `search.abandoned` | Medium | High | Medium | userId, query, reason (if available) |
| `product.viewed` | Low | Medium | Medium | userId, productId, source, duration |
| `product.saved` | Low | High | High | userId, productId |
| `product.shared` | Low | Medium | Medium | userId, productId, channel |
| `supplier.profile_viewed` | Low | Medium | Medium | userId, companyId, duration |
| `category.browsed` | Low | Medium | Low | userId, categoryId, depth |

#### 5.1.4 RFQ & Negotiation Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `rfq.created` | High | Very High | Very High | rfqId, buyerId, products, quantity, budget, timeline |
| `rfq.updated` | Medium | Medium | Medium | rfqId, changedFields |
| `rfq.expired` | Low | Medium | Medium | rfqId, reason (no quotes, low quality quotes) |
| `rfq.ai_assisted` | Medium | High | High | rfqId, aiAction, improvement |
| `quote.received` | High | Very High | Very High | quoteId, rfqId, supplierId, price, terms, deliveryDate |
| `quote.ai_generated` | Medium | High | High | quoteId, aiParameters, accepted |
| `quote.accepted` | Very High | Very High | Very High | quoteId, rfqId, reason (if available) |
| `quote.rejected` | Medium | Very High | Medium | quoteId, reason, counterOffer |
| `negotiation.started` | High | Very High | High | negotiationId, rfqId, participants |
| `negotiation.message_sent` | Medium | High | Medium | negotiationId, sender, content, intent |
| `negotiation.deal_reached` | Very High | Very High | Very High | negotiationId, terms, satisfaction |
| `negotiation.failed` | High | Very High | High | negotiationId, reason, breakdownPoint |
| `negotiation.ai_counteroffer` | Medium | High | Medium | negotiationId, suggestedTerms, accepted |

#### 5.1.5 Order & Fulfilment Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `order.created` | Very High | Very High | Very High | orderId, rfqId, quoteId, buyerId, supplierId, amount |
| `order.payment_received` | Very High | High | Very High | orderId, paymentId, amount, method |
| `order.payment_failed` | High | Very High | High | orderId, paymentId, reason, attempts |
| `order.invoiced` | Medium | Medium | Medium | orderId, invoiceId, amount, tax |
| `order.shipped` | High | High | High | orderId, carrier, trackingId, estimatedDelivery |
| `order.delivered` | Very High | Very High | Very High | orderId, actualDeliveryDate, condition |
| `order.delayed` | High | High | High | orderId, delayDuration, reason |
| `order.disputed` | Very High | Very High | Very High | orderId, disputant, reason, amount |
| `order.resolved` | Very High | Very High | Very High | orderId, resolution, outcome, satisfaction |
| `order.cancelled` | Medium | High | Medium | orderId, reason, stage |

#### 5.1.6 Trust & Risk Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `trust.score_updated` | Medium | Medium | Very High | companyId, newScore, changedDimensions |
| `trust.signal_added` | Medium | High | Medium | companyId, signalType, value, evidence |
| `trust.signal_removed` | Low | Medium | Low | companyId, signalType, reason |
| `risk.alert_triggered` | Very High | High | Very High | companyId, riskType, severity, entities |
| `risk.alert_resolved` | Medium | Medium | Medium | alertId, resolution, actions |
| `fraud.suspected` | Very High | Very High | Very High | transactionId, reason, signals |
| `fraud.confirmed` | Very High | Very High | Very High | caseId, impact, action |
| `fraud.false_positive` | Medium | Very High | Medium | caseId, correctionSignal |

#### 5.1.7 Engagement Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `membership.subscribed` | High | High | Very High | companyId, plan, amount, term |
| `membership.upgraded` | Medium | High | High | companyId, oldPlan, newPlan, reason |
| `membership.cancelled` | Very High | Very High | Very High | companyId, plan, reason, tenure |
| `membership.expired` | Medium | Medium | Medium | companyId, plan, tenure |
| `gocash.earned` | Low | Medium | Medium | entityId, amount, source, balance |
| `gocash.spent` | Low | Medium | High | entityId, amount, destination, balance |
| `campaign.participated` | Medium | Medium | Medium | companyId, campaignId, action |
| `achievement.unlocked` | Low | Medium | Low | entityId, achievement, level |

#### 5.1.8 Service & Network Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `tradeserv.booking_created` | High | High | High | bookingId, professionalId, clientId, serviceId |
| `tradeserv.booking_completed` | High | High | High | bookingId, satisfaction, issues |
| `tradeserv.review_submitted` | Medium | Very High | Medium | reviewId, professionalId, rating, feedback |
| `tradetalk.post_created` | Low | High | Medium | postId, authorId, communityId, content |
| `tradetalk.comment_added` | Low | Medium | Low | commentId, postId, authorId |
| `tradetalk.community_joined` | Low | Medium | Low | userId, communityId |

#### 5.1.9 System Intelligence Events

| Event | Priority | Learning Value | Business Value | Schema |
|-------|----------|---------------|----------------|--------|
| `ai.recommendation_shown` | Medium | Very High | Medium | recommendationId, agent, context, items |
| `ai.recommendation_accepted` | Very High | Very High | Very High | recommendationId, outcome, delta |
| `ai.recommendation_rejected` | High | Very High | Medium | recommendationId, reason, alternative |
| `ai.decision_executed` | Very High | Very High | Very High | decisionId, agent, action, context |
| `ai.decision_failed` | Very High | Very High | Very High | decisionId, error, impact |
| `ai.confidence_calibrated` | Low | Very High | Low | agent, expectedAccuracy, actualAccuracy |
| `feedback.explicit` | High | Very High | Very High | entityId, rating, comment, category |
| `feedback.implicit` | Medium | High | Medium | entityId, signal, inferred |

### 5.2 Event Lifecycle

```
                                      ┌─────────────────┐
                                      │  EVENT EMITTED   │
                                      │  (Module → Bus)  │
                                      └────────┬────────┘
                                               │
                                      ┌────────▼────────┐
                                      │  EVENT RECEIVED  │
                                      │  (Event Bus)     │
                                      └────────┬────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         │                     │                     │
                  ┌──────▼──────┐      ┌───────▼───────┐     ┌──────▼──────┐
                  │  VALIDATE   │      │  ENRICH       │     │  PRIORITISE │
                  │  Schema +   │      │  Add Context  │     │  Route to   │
                  │  Integrity  │      │  + Entity     │     │  Queue      │
                  └──────┬──────┘      └───────┬───────┘     └──────┬──────┘
                         │                     │                     │
                         └─────────────────────┼─────────────────────┘
                                                │
                                     ┌──────────▼──────────┐
                                     │  EVENT DISPATCH     │
                                     │  (Parallel Handlers)│
                                     └──────────┬──────────┘
                                                │
          ┌──────────────────────────────────────┼──────────────────────────────┐
          │            │             │            │              │              │
   ┌──────▼─────┐ ┌───▼────┐ ┌─────▼────┐ ┌─────▼────┐  ┌─────▼────┐  ┌──────▼──────┐
   │ WRITE TO   │ │UPDATE  │ │UPDATE    │ │UPDATE    │  │TRIGGER   │  │ ENQUEUE     │
   │ EVENT LOG  │ │KNOW.   │ │SHORT-TERM│ │EPISODIC  │  │WORKFLOWS │  │ MODEL       │
   │ (Audit)    │ │GRAPH   │ │MEMORY    │ │MEMORY    │  │          │  │ TRAINING     │
   └────────────┘ └────────┘ └──────────┘ └──────────┘  └──────────┘  └─────────────┘
```

### 5.3 Event Priority & Processing

| Priority | Processing | SLA | Examples |
|----------|-----------|-----|----------|
| **Critical** | Synchronous + immediate downstream | <100ms | Payment events, fraud alerts, security events |
| **Very High** | Synchronous dispatch, async processing | <1s | Order events, trust updates, KYC results |
| **High** | Async with priority queue | <5s | RFQ events, dispute events, membership changes |
| **Medium** | Async with standard queue | <30s | Search events, product updates, AI recommendations |
| **Low** | Async with batch processing | <5min | View events, engagement events, periodic signals |

### 5.4 Event Learning Value Assessment

Every event is assessed for its learning value — how much it contributes to platform intelligence:

```
Learning Value = f(
    Signal Richness: How many insights can be extracted
    Outcome Clarity: How clearly the result is known
    Generalisability: How applicable across other businesses/contexts
    Novelty: How different from existing patterns
    Verifiability: Can the signal be confirmed from other sources
)

Very High: Transaction outcome, AI decision result, explicit feedback
High: RFQ details, search patterns, negotiation moves, trust signals
Medium: Profile updates, product views, content creation
Low: Page views, session heartbeats, non-critical interactions
```

### 5.5 Event Business Value Assessment

Every event is also assessed for immediate business value:

```
Business Value = f(
    Revenue Impact: Does this event generate or risk revenue?
    User Impact: Does this event affect user satisfaction or retention?
    Operational Impact: Does this event require human intervention?
    Regulatory Impact: Does this event have compliance implications?
)

Very High: Payment, order, dispute, membership, fraud, KYC results
High: RFQ, quote, negotiation, delivery, compliance events
Medium: Product changes, profile updates, engagement milestones
Low: Browse events, cosmetic updates, system health
```

---

## 6. DECISION ARCHITECTURE

### 6.1 Decision Types

| Type | Description | Autonomy Level | Examples |
|------|-------------|----------------|----------|
| **Suggestion** | AI offers an option; user must act | Inform only | "You might also consider..." |
| **Recommendation** | AI recommends with reasoning; user confirms | Suggest | "We recommend supplier X (95% match)" |
| **Assisted Decision** | AI proposes; user approves with one click | Approve | "Shall I send this RFQ to top 5 suppliers?" |
| **Delegated Decision** | User sets parameters; AI executes within them | Supervised autonomy | "Get me the best price under ₹5L with delivery by Friday" |
| **Autonomous Decision** | AI decides and acts within defined boundaries | Full autonomy | "Reorder office supplies when inventory < threshold" |
| **Emergency Decision** | AI acts immediately; notifies after | Reaction | "Block transaction — fraud pattern detected" |

### 6.2 Decision Signal Architecture

Every decision is made from a combination of signals:

```
Signal Categories:

┌─────────────────────────────────────────────────────────────┐
│                     SIGNAL LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│  L1 — CONTEXT SIGNALS                                       │
│  Current state, active entities, session context            │
│  Source: Working Memory (Redis)                              │
├─────────────────────────────────────────────────────────────┤
│  L2 — BEHAVIOURAL SIGNALS                                   │
│  Past behaviour patterns, preferences, habits               │
│  Source: Short-Term Memory + Episodic Memory                │
├─────────────────────────────────────────────────────────────┤
│  L3 — KNOWLEDGE SIGNALS                                     │
│  Facts, relationships, market data, rules                   │
│  Source: Knowledge Graph + Semantic Memory                   │
├─────────────────────────────────────────────────────────────┤
│  L4 — TRUST SIGNALS                                         │
│  TradTrust scores, risk assessments, compliance status      │
│  Source: TradTrust Engine + Risk Intelligence                 │
├─────────────────────────────────────────────────────────────┤
│  L5 — MARKET SIGNALS                                        │
│  Market conditions, trends, pricing, demand                 │
│  Source: Market Intelligence + Demand Intelligence           │
├─────────────────────────────────────────────────────────────┤
│  L6 — PREDICTIVE SIGNALS                                    │
│  Forecasts, probabilities, what-if simulations              │
│  Source: Prediction Engine + Causal Reasoning Engine        │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Decision Process

```
                          ┌──────────────────────┐
                          │  DECISION REQUEST     │
                          │  (Agent + Context +   │
                          │   Constraints)        │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  SIGNAL GATHERING     │
                          │  (L1 → L6 signals)    │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  OPTION GENERATION    │
                          │  (Top-N alternatives  │
                          │   with rationale)     │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  RISK ASSESSMENT      │
                          │  (Per-option risk     │
                          │   scoring)            │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  CONFIDENCE SCORING   │
                          │  (Signal strength +   │
                          │   Historical accuracy)│
                          └──────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼─────┐   ┌──────▼──────┐   ┌───▼────────┐
              │Confidence  │   │Confidence   │   │Confidence  │
              │ < 0.4     │   │0.4 - 0.7    │   │ > 0.7      │
              │SUGGEST    │   │RECOMMEND    │   │EXECUTE     │
              └─────┬─────┘   └──────┬──────┘   └───┬────────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  DECISION OUTPUT      │
                          │  (Choice + Reasoning  │
                          │   + Risk + Confidence)│
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  FEEDBACK CAPTURE     │
                          │  (Was this decision   │
                          │   accepted? Outcome?) │
                          └──────────────────────┘
```

### 6.4 Confidence Scoring

Confidence is computed per decision, per option:

```
Confidence = Σ(signal_weight_i × signal_confidence_i × signal_relevance_i)
                               ÷ Σ(signal_weight_i)

Where:
  - signal_weight: importance of this signal type for this decision type
  - signal_confidence: quality of this signal (data freshness, source reliability)
  - signal_relevance: how applicable this signal is to the current context

Final confidence is calibrated against historical accuracy:
  calibrated_confidence = f(raw_confidence, historical_bias)
```

### 6.5 Evidence & Explainability

Every decision output includes:

```
DecisionOutput {
  decision_id: UUID
  timestamp: DateTime
  agent: AgentID
  decision_type: Suggestion | Recommendation | Assisted | Delegated | Autonomous | Emergency
  
  selected_option: {
    id: String
    value: JSON
    confidence: Float
    risk_score: Float
  }
  
  alternatives: [
    {
      id: String
      value: JSON
      confidence: Float
      risk_score: Float
      rejection_reason: String
    }
  ]
  
  signals_used: [
    {
      signal_type: String
      value: JSON
      weight: Float
      source: String
      freshness: String  // "real-time" | "1h" | "1d" | "1w"
    }
  ]
  
  reasoning: {
    summary: String  // Human-readable explanation
    key_factors: [String]  // Top 3-5 factors driving this decision
    trade_offs: [{
      dimension: String
      selected_value: String
      alternative_value: String
      impact: String
    }]
    what_if: [{
      scenario: String
      outcome: String
      probability: Float
    }]
  }
  
  risk_assessment: {
    overall_risk: Float  // 0-1
    dimensions: {
      financial: Float
      operational: Float
      reputational: Float
      compliance: Float
    }
    mitigations: [String]
  }
  
  expected_impact: {
    metric: String
      estimated_value: Float
      confidence_interval: [Float, Float]
    }
  ]
  
  autonomy_check: {
    level: String
    requires_human: Boolean
    escalation_reason: String | null
    time_to_act: String
  }
}
```

### 6.6 Decision Feedback Loop

```
Decision → Outcome → Feedback → Learning → Improved Future Decisions

Feedback Types:
  1. Explicit: User accepts/rejects, rates, comments
  2. Implicit: User behaviour after decision (did they follow the recommendation?)
  3. Outcome: Did the decision produce the expected result?
  4. Delayed: Long-term outcome (repeat purchase, churn, dispute)

Feedback → Learning:
  - Positive outcome → reinforce signal weights, increase confidence
  - Negative outcome → reduce signal weights, flag for review
  - Neutral outcome → maintain weights, reduce confidence slightly
  - Undetermined → maintain but add to review queue

Learning Outcomes:
  - Improved signal weighting for similar decisions
  - Better confidence calibration
  - New patterns discovered from unexpected outcomes
  - Signal quality improvements (identify unreliable signals)
```

---

## 7. AGENT COLLABORATION

### 7.1 Collaboration Principles

1. **Agents are specialised.** Each agent has a defined domain of expertise. No agent is a generalist.
2. **Agents discover each other.** No hardcoded agent dependencies. The Federation Registry enables dynamic discovery.
3. **Collaboration is explicit.** All cross-agent interactions are logged, auditable, and traceable.
4. **Conflict is resolvable.** When agents disagree, a deterministic resolution protocol applies.
5. **Memory is shared selectively.** Agents access each other's memory only through defined interfaces.
6. **Failures are graceful.** If a collaborating agent is unavailable, the requesting agent proceeds with degraded capability.

### 7.2 Agent Registry & Discovery

```
AgentRegistry {
  register(agent: {
    id: AgentID
    name: String
    version: String
    capabilities: [Capability]
    domain: String  // buyer, seller, finance, legal, etc.
    input_schema: JSON Schema
    output_schema: JSON Schema
    confidence_threshold: Float
    max_autonomy_level: String
    dependencies: [AgentID]  // optional agents that enhance this agent
    memory_scope: String  // private, company, platform
  })
  
  discover(query: {
    capability: String
    domain: String
    min_confidence: Float
    max_latency: String
  }) → [Agent]
  
  get_agent(agent_id: AgentID) → Agent
  
  health_check(agent_id: AgentID) → { status, latency, load }
}
```

### 7.3 Delegation Protocol

When Agent A needs Agent B to perform a task:

```
1. DISCOVER: Agent A queries registry for agents with required capability
2. SELECT: Agent A selects Agent B based on capability match + load + latency
3. CONTEXT: Agent A assembles context package for Agent B
4. DELEGATE: Agent A sends delegation request to Agent B
5. ACKNOWLEDGE: Agent B acknowledges (or rejects with reason)
6. EXECUTE: Agent B performs the task (sync or async)
7. RESPOND: Agent B returns result with confidence and reasoning
8. FEEDBACK: Agent A records outcome (success/failure) to registry

DelegationRequest {
  id: UUID
  source_agent: AgentID
  target_agent: AgentID
  task: {
    type: String
    input: JSON
    constraints: {
      deadline: DateTime
      max_cost: Float
      required_confidence: Float
    }
  }
  context: {
    entity_ids: [EntityID]
    memory_hints: [String]  // helpful memories for target agent
    priority: Low | Medium | High | Critical
  }
  reply_to: AgentID
  synchronous: Boolean
  timeout: Duration
}

DelegationResponse {
  id: UUID
  request_id: UUID
  source_agent: AgentID
  status: Success | Partial | Failure | Timeout
  result: JSON
  confidence: Float
  reasoning: String
  signals_used: [SignalRef]
  cost: Float  // compute/credits consumed
  duration: Duration
  warnings: [String]
}
```

### 7.4 Escalation Protocol

When an agent cannot handle a request within its autonomy limits:

```
1. SELF-ASSESS: Agent evaluates problem against its capabilities
2. ESCALATE TO PEER: If another agent has better capability → delegate
3. ESCALATE TO ORCHESTRATOR: If multi-agent coordination needed → orchestrate
4. ESCALATE TO HUMAN: If confidence < threshold or risk > limit → human in loop

Escalation triggers:
  - Confidence < agent's minimum threshold
  - Risk score > maximum autonomy threshold
  - Decision value > human-approval threshold (configurable per company)
  - Novel situation with no historical patterns
  - Regulatory requirement for human approval
  - Repeated failure in autonomous handling
```

### 7.5 Shared Memory Protocol

Agents can access each other's memory through controlled interfaces:

```
SharedMemoryAccess {
  read(agent_id: AgentID, scope: MemoryScope, query: {
    entity_ids: [EntityID]
    memory_types: [Episodic | Semantic | Procedural]
    time_range: [DateTime, DateTime]
    max_results: Int
  }) → [Memory]
  
  write(agent_id: AgentID, scope: MemoryScope, memory: {
    type: MemoryType
    content: JSON
    entities: [EntityID]
    importance: Float
    ttl: Duration | null  // null = permanent
  }) → MemoryID
  
  subscribe(agent_id: AgentID, scope: MemoryScope, filter: {
    entity_ids: [EntityID]
    event_types: [EventType]
    min_importance: Float
  }) → SubscriptionID  // Agent gets notified of matching new memories
}
```

### 7.6 Conflict Resolution Protocol

When two agents provide conflicting recommendations or assessments:

```
ConflictResolution {
  participants: [AgentID]
  subject: EntityID | DecisionID
  conflict_type: Assessment | Recommendation | Prediction
  
  positions: [
    {
      agent: AgentID
      position: JSON
      confidence: Float
      evidence: [SignalRef]
      reasoning: String
    }
  ]
  
  resolution_strategy:
    | Confidence — highest confidence wins
    | Domain — domain-authority agent wins (e.g., Finance AI on credit)
    | Consensus — weighted average of all positions
    | De-escalation — reduce to lowest common denominator
    | Human — escalate to human decision
    | Experiment — A/B test both options
  
  resolution: {
    strategy_used: String
    final_position: JSON
    dissenting_agents: [AgentID]
    explanation: String
  }
}
```

### 7.7 Agent-to-Agent Interaction Matrix

Key collaboration patterns between major agents:

```
Founder AI ←→ Growth AI: Strategy + expansion planning
Founder AI ←→ Risk AI: Platform health + risk monitoring
Founder AI ←→ Finance AI: Revenue + financial strategy

Buyer AI ←→ Seller AI: Transaction orchestration
Buyer AI ←→ Negotiation AI: Deal optimisation
Buyer AI ←→ Finance AI: Payment terms + credit
Buyer AI ←→ Logistics AI: Delivery planning
Buyer AI ←→ TradTrust AI: Supplier assessment
Buyer AI ←→ Compliance AI: Regulatory checks

Seller AI → Catalog AI: Listing optimisation
Seller AI → Marketing AI: Campaign creation
Seller AI ←→ Pricing Intelligence: Pricing optimisation
Seller AI ←→ Demand Intelligence: Production planning

Finance AI → Legal AI: Contract term validation
Finance AI → Risk AI: Credit risk assessment
Finance AI → Compliance AI: Financial regulation

Legal AI → Compliance AI: Regulatory alignment
Legal AI → Negotiation AI: Term validation in negotiations

TradeServ AI → TradTrust AI: Professional verification
TradeServ AI → Quality AI: Service quality monitoring

TradeTalk AI → Community AI: Content + engagement
TradeTalk AI → Knowledge Graph: Knowledge extraction
```

### 7.8 Multi-Agent Workflow Engine

For complex scenarios requiring multiple agents:

```
Workflow Structure:
  1. RECEIVE: User or Founder AI initiates complex request
  2. PLAN: Orchestrator decomposes into sub-tasks
  3. MAP: Each sub-task mapped to appropriate agent
  4. EXECUTE: Agents execute (parallel or sequential as defined)
  5. SYNTHESIZE: Orchestrator combines results
  6. VERIFY: Quality check against original request
  7. DELIVER: Unified response to requester

Example: "I want to expand my textile business to Dubai"
  1. Market AI: Analyse Dubai textile market (size, competition, entry barriers)
  2. Compliance AI: UAE import regulations, tariff rates, documentation
  3. Export AI: Export readiness assessment, documentation checklist
  4. Logistics AI: Shipping routes, costs, timeline
  5. Finance AI: Cost analysis, financing options, currency risk
  6. Tax AI: UAE corporate tax, VAT implications, double taxation
  7. Legal AI: Business structure recommendation (LLC vs branch), licences
  8. TradTrust AI: Shortlist potential Dubai partners from platform
  9. Synthesize: Unified expansion plan with phasing, costs, risks, timeline
```

---

## 8. PERSONALISATION STRATEGY

### 8.1 Personalisation Dimensions

Every experience on TRADINGO is personalised across these dimensions:

| Dimension | Elements | Data Sources | Refresh |
|-----------|----------|-------------|---------|
| **Industry** | Catalogue, suppliers, content, compliance, peers | Company profile, transaction history | Static (changes slowly) |
| **Company Size** | Feature depth, pricing, support tier, credit limits | Company profile, transaction volume | Monthly |
| **Role** | UI layout, feature set, permissions, notifications | User role, access control | Static |
| **Behaviour** | Search ranking, recommendations, shortcuts, defaults | Clickstream, purchase history, session data | Continuous |
| **Goals** | Recommended actions, milestones, success metrics | Explicit (set during onboarding), inferred | Weekly |
| **Business Stage** | Feature roadmap, growth recommendations, benchmarks | Company age, transaction history, Trajectory | Monthly |
| **Growth Maturity** | Expansion readiness, market recommendations, risk profile | Growth signals, TradHexa dimensions | Monthly |
| **Communication Style** | Language, formality, detail level, channel preference | Interaction history, feedback, settings | Continuous |

### 8.2 Personalisation Engine Architecture

```
User/Company Event → Personalisation Engine

1. Profile Update
   └── Update entity profile in Knowledge Graph

2. Behaviour Analysis
   └── Extract patterns from Short-Term Memory
   └── Update behavioural preferences

3. Context Assembly
   └── Gather current context (session, active entities, goals)
   └── Retrieve relevant preferences

4. Experience Adaptation
   └── Rank search results
   └── Select recommendations
   └── Choose UI layout
   └── Set communication tone
   └── Surface relevant features

5. Feedback Capture
   └── Implicit: engagement, conversion, dwell time
   └── Explicit: ratings, accept/reject, settings changes
   └── Update preference confidence
```

### 8.3 Cold Start Strategy

For new businesses with no history:

```
Phase 1 — Explicit (Onboarding):
  - Ask about industry, role, goals (structured onboarding)
  - Use company profile (size, location, existing systems)
  - Bootstrap from similar businesses (industry + size + location)

Phase 2 — Implicit (First 7 days):
  - Observe behaviour: what they click, search, view
  - Update preferences based on first actions
  - Confidence starts low, increases with each signal

Phase 3 — Adaptive (After 30 days):
  - Full behavioural personalisation active
  - Preferences stabilise
  - Predictive personalisation begins

Cold Start Algorithm:
  similarity_score(a, b) = f(
    industry_overlap × 0.4,
    size_similarity × 0.2,
    location_proximity × 0.15,
    role_match × 0.15,
    goal_overlap × 0.1
  )
  
  For new business N:
    find top-5 most similar established businesses
    initial_preferences(N) = weighted_average(preferences(similar))
    confidence = 0.3 (increases with N's own data)
```

### 8.4 Preference Decay

Preferences that are not reinforced naturally decay:

```
Decay Function:
  preference.weight(t) = preference.base_weight × e^(-λ × Δt)
  
  Where:
  - λ = decay rate (configurable: fast for browsing, slow for purchasing)
  - Δt = time since last supporting interaction

  When weight < threshold → preference archived
  When behaviour contradicts → preference replaced

Example decay rates:
  - Product category preference: λ = 0.1/day (10% decay per day)
  - Supplier preference: λ = 0.02/day (2% decay per day)
  - Payment method preference: λ = 0.01/day (1% decay per day)
  - Communication channel: λ = 0.001/day (very slow decay)
```

### 8.5 Privacy & Control

- Businesses can view all stored preferences
- Businesses can delete specific preference categories
- Businesses can pause personalisation
- All personalisation is on-platform (no third-party data)
- No personalisation data is shared between businesses
- Aggregated patterns only (min 5 entities) used for platform learning

---

## 9. LEARNING STRATEGY

### 9.1 Learning Sources

TRADINGO learns from every interaction:

| Source | Learning Type | Volume | Value |
|--------|--------------|--------|-------|
| **Transactions** | Outcome patterns, pricing relationships, trust signals | High | Very High |
| **Searches** | Intent signals, catalog gaps, demand patterns | Very High | Very High |
| **RFQs** | Demand signals, price expectations, requirement patterns | Medium | Very High |
| **Negotiations** | Strategy effectiveness, price elasticity, communication patterns | Medium | Very High |
| **Orders** | fulfilment reliability, payment behaviour, delivery patterns | Medium | Very High |
| **Payments** | Creditworthiness, fraud patterns, currency behaviour | Medium | Very High |
| **Support Tickets** | Problem patterns, resolution effectiveness, pain points | Medium | High |
| **Reviews & Ratings** | Quality signals, satisfaction drivers, trust indicators | Medium | High |
| **TradeTalk Content** | Knowledge extraction, expert identification, trend signals | High | Medium |
| **AI Feedback** | Decision accuracy, confidence calibration, improvement areas | Low | Very High |
| **Founder Feedback** | Strategic direction, product priorities, quality standards | Low | Very High |
| **Implicit Signals** | Dwell time, abandonment, click patterns, navigation paths | Very High | High |
| **Explicit Feedback** | Ratings, comments, feature requests, complaints | Low | Very High |

### 9.2 Learning Loop

```
                        ┌──────────────────────┐
                        │     RAW EVENTS        │
                        │  (All platform events)│
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  EVENT INGESTION      │
                        │  (Validate, Enrich,   │
                        │   Store)              │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
     │ REAL-TIME       │  │ BATCH          │  │ KNOWLEDGE      │
     │ LEARNING        │  │ LEARNING       │  │ EXTRACTION     │
     │ (Online models, │  │ (Model         │  │ (Graph updates,│
     │  micro-decisions)│  │  retraining,   │  │  Fact          │
     │                  │  │  Deep analysis)│  │  extraction)   │
     └────────┬────────┘  └───────┬────────┘  └───────┬────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  MODEL & KNOWLEDGE   │
                        │  UPDATE              │
                        │  (Models, Graph,     │
                        │   Memory, Rules)     │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  INTELLIGENCE        │
                        │  DEPLOYMENT          │
                        │  (Online serve,      │
                        │   A/B test)          │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  FEEDBACK CAPTURE    │
                        │  (Was this better?   │
                        │   Did it work?)      │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  FEEDBACK INTEGRATION│
                        │  (Close the loop,    │
                        │   Reinforce / Correct)│
                        └──────────────────────┘
```

### 9.3 Online Learning (Real-Time)

For decisions that need immediate adaptation:

- **Models**: Lightweight, single-purpose models (e.g., click-through rate, response time)
- **Updates**: Incremental updates per event; no batch retraining needed
- **Latency**: <50ms from event to model update
- **Storage**: Redis for feature store; lightweight model files
- **Examples**: Search ranking adjustment based on click feedback, real-time fraud scoring

### 9.4 Batch Learning (Periodic)

For deep learning that requires comprehensive analysis:

- **Frequency**: Daily for core models, weekly for complex models, monthly for strategic models
- **Scope**: Full historical data for relevant period
- **Process**: Feature engineering → model training → evaluation → deployment
- **Storage**: Feature store (PostgreSQL + vector store), model registry
- **Examples**: TradTrust score recalibration, demand forecasting model, negotiation strategy optimisation, fraud detection model update

### 9.5 Knowledge Extraction

Extracting structured knowledge from unstructured events:

```
Extraction Pipeline:

1. Event arrives (e.g., support ticket, negotiation message, community post)
2. AI processes content:
   - Entity extraction (companies, products, people mentioned)
   - Intent classification (problem, question, complaint, praise)
   - Sentiment analysis
   - Key insight extraction
   - Relationship discovery
3. Candidate facts generated:
   - "Company A experienced shipping delays with carrier X"
   - "Product Y has quality issues in humid conditions"
   - "Buyers in industry Z prefer net-30 payment terms"
4. Fact validation:
   - Cross-reference with existing facts (confirm or contradict)
   - Check frequency (single instance vs. pattern)
   - Assign confidence score
5. Knowledge Graph update:
   - Add new entities if not present
   - Add/update relationships
   - Update entity attributes with extracted information
   - Link facts to source events
6. Memory consolidation:
   - Important facts promoted to Semantic Memory
   - Interesting patterns flagged for human review
   - Anomalies flagged for investigation
```

### 9.6 Model Improvement Strategy

| Model | Update Frequency | Training Data | Evaluation Metric | Target |
|-------|-----------------|---------------|-------------------|--------|
| Search Ranking | Daily | Click-through, conversion, dwell time | NDCG@10, CTR | NDCG > 0.85 |
| Supplier Recommendation | Weekly | Transaction outcomes, TradTrust, feedback | Precision@5, Recall@5 | Precision > 0.75 |
| Pricing Optimisation | Weekly | Transaction prices, market data, elasticity | Margin improvement | +5% |
| Fraud Detection | Real-time + Daily batch | Transaction patterns, reported fraud | Precision, Recall, F1 | F1 > 0.95 |
| TradTrust Scoring | Monthly | All trust signals, dispute outcomes | Predictive accuracy | >90% |
| Demand Forecasting | Weekly | RFQ volume, search volume, seasonality | MAPE | <15% |
| Churn Prediction | Weekly | Engagement metrics, support tickets, usage | AUC-ROC | >0.85 |
| Personalisation | Daily | Click patterns, conversion, satisfaction | CTR improvement | +20% |
| Negotiation Strategy | Monthly | Negotiation outcomes, strategy effectiveness | Win rate, margin | +10% win rate |
| Support Resolution | Weekly | Ticket resolution, satisfaction, time-to-resolve | FCR, CSAT | FCR > 80% |

### 9.7 Feedback Integration

Every learning loop closes with feedback:

```
Decision → Outcome → Signal → Learning

Positive Feedback Loop:
  Good decision → Positive outcome → Reinforce patterns → More confident decisions

Negative Feedback Loop:
  Bad decision → Negative outcome → Flag for review → Adjust patterns → Better future decisions

Feedback Sources:
  - Explicit user feedback (ratings, comments, accept/reject)
  - Implicit user feedback (behaviour change, repeat usage, abandonment)
  - Outcome measurement (did the predicted outcome occur?)
  - Delayed measurement (long-term consequences, lifecycle value)

Feedback Delay Handling:
  - Immediate signals (click, accept, reject) → instant update
  - Short-term signals (first repeat, 7-day retention) → daily update
  - Long-term signals (churn, LTV, TradTrust impact) → monthly recalibration
```

---

## 10. TRUST INTELLIGENCE

### 10.1 Dynamic Trust Model

Trust on TRADINGO is not a static score. It is a dynamic, multi-dimensional, real-time computation that evolves with every interaction.

**Core Principle**: Trust is earned through verifiable behaviour, not claimed through profiles or reviews.

### 10.2 Trust Inputs — Official 16-Dimension Model

The TradTrust score is computed from 16 weighted dimensions. This model is canonical across all TRADINGO architecture documents. See FAS-01 Section 9.4 for the authoritative reference.

| # | Input | Weight | Description | Update Frequency |
|---|-------|--------|-------------|-----------------|
| 1 | **Transaction Volume** | 8% | Number and total value of past platform transactions | Per transaction |
| 2 | **Transaction Consistency** | 8% | Regularity and predictability of transaction activity | Per transaction |
| 3 | **Delivery Performance** | 10% | On-time delivery rate, quality accuracy, condition | Per delivery |
| 4 | **Quality Consistency** | 10% | Return rate, quality feedback, complaint rate | Per review |
| 5 | **Payment Behaviour** | 10% | On-time payment rate, full payment rate, disputes | Per payment |
| 6 | **Communication Responsiveness** | 5% | Response rate, response time, resolution rate | Per interaction |
| 7 | **Verification Level** | 8% | KYC depth, document verification, face match | On verification |
| 8 | **Dispute History** | 8% | Dispute frequency, severity, resolution outcome | Per dispute |
| 9 | **Network Quality** | 5% | Quality of counterparties, referrals, endorsements | Continuous |
| 10 | **Longevity** | 5% | Length of platform membership, consistency of activity | Continuous |
| 11 | **Complaint Record** | 5% | Complaint frequency and severity | Per complaint |
| 12 | **Certification Status** | 5% | Active certifications, diversity, relevance | Per certification |
| 13 | **Financial Health** | 5% | Payment capacity signals, creditworthiness | Continuous |
| 14 | **Compliance Record** | 3% | Regulatory compliance, audit results, filing timeliness | Per compliance event |
| 15 | **Platform Engagement** | 3% | Feature adoption, community participation, responsiveness | Continuous |
| 16 | **AI-Trust Score** | 2% | ML-based trust prediction from latent signals | Per event |

**Total**: 100%

### 10.3 Trust Score Computation

```
Base Computation:

  TradTrust_Score = Σ(weight_i × score_i) × decay_factor × bonus_factor

  Where:
  - weight_i = importance weight of dimension i (sum = 1.0)
  - score_i = normalised score (0-1) for dimension i
  - decay_factor = reduction for inactivity (0.99^days_inactive)
  - bonus_factor = 1.0 + bonus for exceptional behaviour (max 1.15)

Dimension Score Computation:

  score_delivery = f(
    on_time_rate × 0.5,
    quality_accuracy × 0.3,
    condition_rating × 0.2
  )

  score_payment = f(
    on_time_percentage × 0.5,
    full_payment_percentage × 0.3,
    dispute_rate_inverse × 0.2
  )

  // ... similar for each dimension

Calibration:
  - Scores are calibrated quarterly against actual outcomes
  - Calibration adjusts weight_i to maximise predictive accuracy
  - Score distribution is monitored — unnatural patterns trigger investigation
```

### 10.4 Trust Evolution Over Time

Trust is not static — it evolves through a business's lifecycle on the platform:

```
Phase 1 — New (0-90 days):
  - Base trust: 300 (out of 1000)
  - Heavy weight on identity verification and initial compliance
  - Limited transaction history → lower confidence in score
  - Score range: 200-500

Phase 2 — Building (90-365 days):
  - Trust builds primarily through transaction behaviour
  - Each successful transaction increases score
  - First dispute/delay can drop score significantly
  - Score range: 300-700

Phase 3 — Established (1-3 years):
  - Transaction history provides strong signal
  - Reputation effects: good businesses attract good counterparties
  - Score stabilises with smaller fluctuations
  - Score range: 400-850

Phase 4 — Mature (3+ years):
  - Long track record provides high confidence
  - High trust → premium features unlocked (higher credit, faster payments)
  - Score is slower to change (high inertia)
  - Score range: 500-1000

Trust Recovery:
  - After negative event: score drops immediately
  - Recovery requires sustained positive behaviour (typically 2x the negative period)
  - Recovery path is communicated to business: "Complete 20 successful deliveries to recover"
```

### 10.5 Trust Signals Detail

Each trust dimension is supported by specific, verifiable signals:

```
delivery_signal: {
  on_time_rate: Float          // % of deliveries on or before promised date
  quality_accuracy: Float      // % of deliveries with correct quality
  condition_rating: Float      // average condition rating (1-5)
  packaging_quality: Float     // packaging feedback score
  documentation_accuracy: Float // shipping doc accuracy rate
  sample_match_rate: Float     // % of samples matching final delivery
}

payment_signal: {
  on_time_percentage: Float    // % of payments made by due date
  full_payment_percentage: Float // % of payments made in full
  average_delay_days: Float     // average days late (negative = early)
  dispute_rate: Float           // % of transactions disputed
  chargeback_rate: Float        // chargeback frequency
  payment_method_reliability: Float // reliability score by payment method
}

communication_signal: {
  response_rate: Float         // % of messages responded to
  average_response_time: Float  // average time to first response
  resolution_rate: Float       // % of issues resolved via communication
  language_quality: Float      // professionalism of communication
  proactive_communication: Float // proactive status updates
}

compliance_signal: {
  certification_count: Int     // number of active certifications
  certification_diversity: Float // breadth of certification coverage
  compliance_violations: Int   // number of violations
  audit_results: [AuditResult] // past audit outcomes
  regulatory_filings_timely: Float // % of filings submitted on time
}
```

### 10.6 Trust Confidence

Every TradTrust score includes a confidence interval:

```
Confidence Factors:
  - Data quantity: Number of transactions, interactions, events
  - Data recency: How recent is the data
  - Data consistency: How consistent are the signals
  - Data source reliability: Quality of the data sources

  For new businesses (few data points):
    Score = 300 ± 100 (wide confidence interval)
  
  For established businesses (many data points):
    Score = 750 ± 25 (narrow confidence interval)

  Confidence is used by other agents:
    - High confidence → use score as primary decision factor
    - Low confidence → use score as supplementary factor, rely more on other signals
```

### 10.7 Trust as a Platform Asset

Trust intelligence is not just defensive (preventing bad behaviour). It is an active platform asset:

- **Trusted businesses get premium placement** in search results
- **High trust unlocks credit** and financing options
- **Trusted counterparties matched together** preferentially
- **Trust unlocks reduced escrow fees** and faster settlement
- **Trust unlocks higher transaction limits** and lower payment holds
- **Trust signals are portable** (future: recognised by banks, insurers, governments)

---

## 11. CAPABILITY MAP

### 11.1 Module-to-Intelligence Mapping

Every TRADINGO module has specific intelligence capabilities. This map shows which module provides which intelligence function.

#### 11.1.1 TradeAI (Agent Framework)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Agent Registry | Agent Framework | Registration, discovery, health monitoring of all agents |
| Agent Execution | Decision Engine | Task execution with context, reasoning, and feedback |
| Agent Memory | Memory Layer | Per-agent memory isolation and sharing |
| Agent Federation | Collaboration Engine | Cross-agent delegation, coordination, and conflict resolution |
| Workflow Engine | Orchestration | Multi-step, multi-agent workflow execution |

#### 11.1.2 TradHexa (Business Intelligence)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Health Dimension | Analytics + Memory | Financial + operational health computation |
| Trust Dimension | TradTrust Engine | Multi-dimensional trust scoring |
| Growth Dimension | Learning Engine + Memory | Growth trajectory and potential assessment |
| Market Dimension | Market Intelligence | Market position and competitive analysis |
| Capability Dimension | Knowledge Graph | Product/service breadth and depth analysis |
| Network Dimension | Relationship Graph | Network quality and relationship analysis |
| TradHexa Score | Decision Engine | Weighted composite of all six dimensions |

#### 11.1.3 TradTrust (Trust Engine)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Trust Scoring | TradTrust Engine | Multi-dimension trust computation |
| Trust Signals | Event Intelligence | Trust signal extraction from events |
| Trust Evolution | Learning Engine | Temporal trust modelling and decay |
| Trust Confidence | Decision Engine | Confidence intervals for trust scores |
| Trust Prediction | Prediction Engine | ML-based trust prediction for new entities |
| Trust-Based Matching | Knowledge Graph | Preferential matching of trusted entities |

#### 11.1.4 TradeServ (Services)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Professional Matching | Knowledge Graph + Personalisation | Intelligent professional-service matching |
| Service Quality | TradTrust Engine | Service quality scoring and monitoring |
| Cross-Service Recommendations | Recommendation Engine | Related service discovery (e.g., lawyer after accountant) |
| Lifecycle Support | Memory + Learning Engine | Proactive service recommendations based on business stage |

#### 11.1.5 Tradors (Business Graph)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Digital Identity | Knowledge Graph | Comprehensive business entity representation |
| Capability Graph | Knowledge Graph | Machine-readable capability representation |
| Relationship Graph | Knowledge Graph + Memory | Persistent, verifiable business relationships |
| Growth Graph | Learning Engine + Memory | Growth trajectory and potential |
| Discovery | Search + Personalisation | Intelligent business discovery |

#### 11.1.6 TradeTalk (Community)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Content Intelligence | Event Intelligence | Knowledge extraction from discussions |
| Expert Identification | Learning Engine | AI-verified domain expertise recognition |
| Community Health | Analytics + Memory | Community engagement and quality metrics |
| Opportunity Detection | Decision Engine | Business opportunity identification from conversations |
| Content Moderation | AI Pipeline | Automated, context-aware content quality control |

#### 11.1.7 Marketplace (Commerce)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Search Intelligence | Knowledge Graph + Personalisation | Intelligent, context-aware product search |
| Recommendation Engine | Decision Engine + Learning | Multi-factor product and supplier recommendations |
| Pricing Intelligence | Market Intelligence + Learning | Market-driven pricing guidance |
| Demand Intelligence | Prediction Engine | Predictive demand signals at granular level |
| Catalog Intelligence | Knowledge Graph + Quality AI | Catalog optimisation and quality management |

#### 11.1.8 Analytics (Data & Insights)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Descriptive Analytics | Event Intelligence | What happened? (dashboards, reports) |
| Diagnostic Analytics | Knowledge Graph + Reasoning | Why did it happen? (drill-down, root cause) |
| Predictive Analytics | Prediction Engine | What will happen? (forecasts, predictions) |
| Prescriptive Analytics | Decision Engine | What should we do? (recommendations, optimisation) |
| Real-Time Analytics | Event Intelligence | What is happening right now? (streaming, alerts) |

#### 11.1.9 Membership (Subscription)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Dynamic Tiers | Learning Engine + Personalisation | Usage-based membership optimisation |
| Churn Prediction | Prediction Engine | Early churn detection and intervention |
| Lifetime Value | Prediction Engine | CLV forecasting for retention investment |
| Upgrade Timing | Decision Engine | Optimal membership upgrade recommendations |
| Benefit Personalisation | Personalisation Engine | Personalised benefit selection and surfacing |

#### 11.1.10 Enterprise Search

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Semantic Search | Knowledge Graph + Vector Store | Meaning-based, not keyword-based search |
| Faceted Discovery | Knowledge Graph | Attribute-driven structured discovery |
| Personalised Ranking | Personalisation Engine | Behaviour-influenced result ranking |
| Zero-Result Intelligence | Event Intelligence | Catalog gap detection from failed searches |
| Synonym Intelligence | Knowledge Graph | Industry-aware synonym expansion |

#### 11.1.11 Founder Intelligence

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Executive Dashboard | Analytics + Event Intelligence | Real-time platform health and KPIs |
| Morning Brief | Decision Engine | Daily AI-generated strategic summary |
| Risk Radar | Risk Intelligence | Platform risk early warning system |
| Opportunity Scanner | Decision Engine | Automated growth opportunity discovery |
| Strategic Advisor | Decision Engine + Learning | Long-term strategy recommendations |
| Platform Health Index | TradHexa | Composite platform health across all dimensions |

#### 11.1.12 Manufacturer AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Production Planning | Learning Engine + Memory | Optimised production scheduling from demand signals |
| Raw Material Procurement | Decision Engine | Procurement recommendations with timing optimisation |
| Capacity Utilisation | Analytics + Knowledge Graph | Machine utilisation and capacity analysis |
| Quality Monitoring | Quality AI + Event Intelligence | Defect analysis and quality improvement tracking |
| Distribution Optimisation | Knowledge Graph + Personalisation | Channel and route optimisation for finished goods |

#### 11.1.13 Distributor AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Inventory Optimisation | Prediction Engine + Learning | Stock level targets and rebalancing recommendations |
| Route Planning | Knowledge Graph + Event Intelligence | Optimal distribution routes and carrier selection |
| Channel Performance | Analytics + Memory | Distribution channel analysis and optimisation |
| Cost Optimisation | Decision Engine | Distribution cost analysis and savings identification |

#### 11.1.14 Retail AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Assortment Planning | Decision Engine + Personalisation | Product assortment optimisation for retail |
| Demand Forecasting | Prediction Engine | Consumer demand prediction for procurement |
| Supplier Scorecards | TradTrust Engine + Analytics | Supplier performance measurement and ranking |
| Markdown Optimisation | Learning Engine + Memory | Optimal markdown timing and pricing advice |

#### 11.1.15 Export AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Market Entry Analysis | Market Intelligence + Decision Engine | Priority market identification and timing |
| Document Automation | Event Intelligence + Memory | Auto-generation of export documentation |
| Customs Compliance | Knowledge Graph + Compliance Engine | HS code classification and customs clearance |
| Cross-Border Logistics | Knowledge Graph + Event Intelligence | International shipping optimisation |
| Currency Management | Prediction Engine + Decision Engine | Multi-currency risk management and FX advice |

#### 11.1.16 Insurance AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Risk Coverage Analysis | Risk Intelligence + Decision Engine | Insurance needs identification per transaction |
| Premium Comparison | Market Intelligence + Analytics | Provider pricing comparison and recommendation |
| Claims Assistance | Event Intelligence + Memory | Claim documentation and processing guidance |
| Coverage Gap Detection | Knowledge Graph + Learning | Gap analysis of existing vs required coverage |

#### 11.1.17 Tax AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Tax Calculation | Knowledge Graph + Decision Engine | Real-time tax computation per jurisdiction |
| Compliance Calendar | Event Intelligence + Memory | Filing deadlines and compliance scheduling |
| Optimisation Insights | Learning Engine + Analytics | Cross-border tax structuring and treaty benefits |
| Audit Preparation | Knowledge Graph + Event Intelligence | Documentation and reporting for tax audits |

#### 11.1.18 Education AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Learning Path Generation | Personalisation Engine + Memory | Personalised curriculum based on role and goals |
| Skill Assessment | Analytics + Decision Engine | Progress tracking and capability gap analysis |
| Content Recommendation | Knowledge Graph + Personalisation | Just-in-time learning material surfacing |
| Certification Management | Event Intelligence + Memory | Certification progress and achievement tracking |

#### 11.1.19 Onboarding AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Journey Personalisation | Personalisation Engine + Memory | Adaptive onboarding flow per business type |
| Time-to-Value Optimisation | Decision Engine + Learning | Milestone-driven activation path optimisation |
| Drop-Off Intervention | Event Intelligence + Prediction | Early detection and rescue of stalled users |
| Feature Adoption | Personalisation Engine + Memory | Progressive feature introduction sequencing |

#### 11.1.20 Quality AI

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Quality Scoring | Analytics + Event Intelligence | Multi-dimension quality assessment |
| Trend Analysis | Learning Engine + Memory | Quality trajectory and early warning detection |
| Benchmarking | Knowledge Graph + Analytics | Cross-industry quality comparison |
| Automated Enforcement | Decision Engine + Event Intelligence | Rule-based quality actions and remediation |

#### 11.1.21 Community AI (TradeTalk AI)

| Capability | Intelligence Component | Description |
|------------|----------------------|-------------|
| Content Intelligence | Event Intelligence | Knowledge extraction from community discussions |
| Expert Identification | Learning Engine | AI-verified domain expertise recognition |
| Moderation | AI Pipeline + Event Intelligence | Automated content quality and policy enforcement |
| Opportunity Detection | Decision Engine + Knowledge Graph | Business opportunity matching from conversations |
| Knowledge Graph Integration | Knowledge Graph + Memory | Structured knowledge extraction into graph |

### 11.2 Intelligence Flow Map

How intelligence flows between modules:

```
User Action → Event Bus → Knowledge Graph → Memory → Intelligence → Experience

Example — RFQ Creation:

  1. User creates RFQ
  2. Event: rfq.created → Event Bus
  3. Knowledge Graph: Creates RFQ entity, links to buyer, products, category
  4. Memory: Writes to Short-Term Memory, promotes to Episodic if important
  5. Learning: Updates demand patterns, category signals, buyer preferences
  6. TradTrust: Updates buyer trust signals (active buyer)
  7. Intelligence:
     - Seller AI: Identifies matching suppliers
     - Market Intelligence: Updates demand signal for category
     - Pricing Intelligence: Determines expected price range
     - Buyer AI: Prepares recommendations for RFQ improvement
  8. Experience: User sees AI-suggested improvements + expected supplier response
```

### 11.3 Intelligence Dependency Graph

```
TradeAI Agent Framework
├── Knowledge Graph
│   ├── Event Intelligence
│   └── Memory Layer
├── Decision Engine
│   ├── TradTrust Engine
│   ├── Prediction Engine
│   └── Personalisation Engine
├── Learning Engine
│   ├── Event Intelligence
│   └── Feedback Loop
└── Collaboration Engine
    └── Agent Registry

TradHexa
├── Knowledge Graph (entity data)
├── TradTrust Engine (trust dimension)
├── Memory Layer (historical data)
├── Analytics (computation)
└── Learning Engine (score calibration)

TradTrust
├── Event Intelligence (trust signals)
├── Knowledge Graph (entity relationships)
├── Memory Layer (past behaviour)
├── Learning Engine (score calibration)
└── Decision Engine (confidence computation)

Marketplace Search
├── Knowledge Graph (entity indexing)
├── Personalisation Engine (result ranking)
├── Learning Engine (feedback integration)
└── Event Intelligence (zero-result tracking)
```

---

## 12. FUTURE IMPLEMENTATION GUIDELINES

### 12.1 Architecture Principles for Implementation

These rules must be followed by all future AI implementation:

| # | Rule | Rationale |
|---|------|-----------|
| 1 | **Every module emits typed events.** | Without events, there is no intelligence. Events are the atomic unit of learning. |
| 2 | **Every decision is logged with full context.** | Explainability is a non-negotiable platform requirement. Every decision must be auditable. |
| 3 | **Knowledge Graph is the primary query surface.** | AI agents query the Knowledge Graph first, PostgreSQL second. Duplicate knowledge is forbidden. |
| 4 | **All memory is append-only.** | No data deletion. Historical states must be reconstructable. |
| 5 | **Confidence gates all autonomous actions.** | No AI action occurs without confidence scoring. The confidence-action matrix is law. |
| 6 | **Feedback closes every loop.** | Every decision must have a mechanism to capture outcome feedback. |
| 7 | **Agents discover capabilities through the registry.** | No hardcoded agent dependencies. The registry is the single source of truth for agent capabilities. |
| 8 | **Personalisation is stored separately from core data.** | Preference data is derived, not primary. Core platform function must work without personalisation. |
| 9 | **Privacy is proactive, not reactive.** | All shared intelligence is differentially private (min 5 entities). Individual data never crosses business boundaries. |
| 10 | **Intelligence cost is proportional to value.** | High-value transactions get full reasoning depth. Low-value transactions use efficient heuristics. Cost-awareness is a first-class design consideration. |

### 12.2 Implementation Sequence

Recommended order of intelligence implementation:

```
Phase 1 — Foundation (Essential for all AI):
  1. Event Bus and Event Taxonomy (Event Intelligence)
  2. Knowledge Graph (core entities and relationships)
  3. Working Memory + Short-Term Memory
  4. Basic TradTrust Engine (top 8 dimensions)

Phase 2 — Core Intelligence (Essential for AI agents):
  5. Decision Engine (recommendation + confidence framework)
  6. Long-Term Memory (Episodic + Semantic)
  7. Agent Registry and basic collaboration
  8. Personalisation Engine v1 (behaviour + industry)

Phase 3 — Advanced Intelligence (Enables autonomous operation):
   9. Learning Engine (online + batch loops)
   10. Full TradTrust (all 16 dimensions with confidence)
  11. Prediction Engine (demand, pricing, churn)
  12. Agent Federation (full delegation + escalation)

Phase 4 — Strategic Intelligence (Differentiates the platform):
  13. Causal Reasoning Engine
  14. TradHexa (all 6 dimensions)
  15. Market Intelligence + Demand Intelligence
  16. Risk Intelligence (systemic + per-entity)
  17. Near→Far Growth Intelligence

Phase 5 — Autonomous Intelligence (2030 vision):
  18. Full autonomous decision execution
  19. Cross-domain learning
  20. Self-optimising platform
  21. Global intelligence graph
```

### 12.3 Anti-Patterns to Avoid

| Anti-Pattern | Why | Alternative |
|-------------|-----|-------------|
| Storing AI decisions without context | Unexplainable, unlearnable decisions | Always store full decision context |
| Hardcoding agent interactions | Brittle, unscalable | Use Agent Registry for discovery |
| Embedding business logic in event handlers | Event handlers become God classes | Events trigger workflows; logic lives in services |
| Storing the same knowledge in multiple places | Inconsistency, stale data | Knowledge Graph is the single source |
| Making autonomous decisions without confidence thresholds | Unpredictable, potentially harmful behaviour | All autonomous actions require confidence > 0.7 |
| Deleting historical data | Loss of learning signal, audit trail | Append-only for all business data |
| Building general-purpose models | Underperforms in specific contexts | Specialised models per domain with a meta-learner |
| Ignoring implementation cost | AI inference costs scale with complexity | Tiered intelligence: fast path for low-value decisions |

### 12.4 Decision Rights

Who decides what in the intelligence architecture:

| Decision | Owner | Review Cadence |
|----------|-------|----------------|
| Event taxonomy changes | Platform Architecture Team | Quarterly |
| Knowledge Graph schema | Platform Architecture Team | Quarterly |
| Trust dimension changes | Chief Trust Officer + AI Team | Bi-annually |
| Personalisation strategy | Product + AI Team | Quarterly |
| Learning model updates | AI Team | Continuous (with monitoring) |
| Agent capability additions | AI Team + Domain Owners | Monthly |
| Confidence threshold adjustments | AI Team | Continuous (with monitoring) |
| Privacy policy changes | Legal + Security | Annually or as needed |
| Intelligence cost budget | Platform Architecture + Finance | Monthly |

---

## 13. AI GOVERNANCE

### 13.1 Governance Principles

| # | Principle | Description | Enforcement |
|---|-----------|-------------|-------------|
| 1 | **Every AI decision is auditable** | All decisions include full context, signals, reasoning, and outcome. | Decision audit log (mandatory, append-only) |
| 2 | **Autonomy is proportional to confidence** | No autonomous action without confidence scoring. Thresholds are per-agent, per-action. | Confidence gate in Decision Engine |
| 3 | **Humans set boundaries; AI operates within them** | All autonomous actions have configurable limits (value, risk, scope). | Agent permission matrix |
| 4 | **Models are versioned and tested before deployment** | No model goes to production without shadow deployment and A/B evaluation. | Model lifecycle gates |
| 5 | **Prompts are assets, not code** | All prompts are versioned, tested, and audited in the Prompt Registry. | Prompt Registry |
| 6 | **Cost is tracked per agent, per tenant, per model** | AI spending is visible and accountable. Budgets prevent cost overruns. | AI Cost Governance |
| 7 | **Fairness is measured and maintained** | Models are evaluated for bias across industry, geography, and business size. | Responsible AI reviews |
| 8 | **Privacy is non-negotiable** | No business data crosses entity boundaries. All shared intelligence is differentially private. | Data governance enforcement |

### 13.2 Agent Permission Matrix

Every AI agent operates at a defined autonomy level per action category. The matrix is defined in BCA-01 Section 8.2 (AI Touchpoint Matrix) and enforced at runtime.

**Permission Categories:**

| Permission | Description | Default | Override |
|-----------|-------------|---------|----------|
| **Inform** | Agent presents information without recommendation | Always allowed | — |
| **Suggest** | Agent offers options; user must act | Always allowed | — |
| **Recommend** | Agent recommends with reasoning; user confirms | Allowed for all agents | — |
| **Execute with Approval** | Agent performs action; waits for confirmation | Requires confidence > 0.7 | Configurable per company |
| **Autonomous (Bound)** | Agent acts within defined parameters | Requires confidence > 0.85 + value < ₹50K + counterparty TradTrust > 700 | Per-company override |
| **Autonomous (Full)** | Agent acts independently | Emergency actions only (fraud, security) | SUPER_ADMIN approval |

**Per-Agent Permission Rules:**

| Agent | Actions Allowed Autonomously | Requires Approval | Never Autonomous |
|-------|------------------------------|-------------------|------------------|
| **Buyer AI** | Reorder routine items (<₹50K), Supplier discovery | Purchase >₹50K, New supplier onboarding | Contract signing, Credit commitment |
| **Seller AI** | Listing optimisation, Price adjustment within band | Price outside band, Bulk promotions | Permanent account changes |
| **Finance AI** | Payment reminders, Credit score recalculations | Credit limit changes, Payment holds | Fund transfers, Fee waivers |
| **Negotiation AI** | Standard price negotiation (pattern matched >100x) | First-time negotiation with new counterparty | Legal term changes |
| **Founder AI** | Data aggregation, Report generation | Strategic recommendations | Platform configuration changes |
| **All Agents** | Information retrieval, Pattern analysis, Recommendation generation | Any action affecting financial transactions | Any action with regulatory compliance impact |

### 13.3 Model Lifecycle

Every AI model follows a defined lifecycle with mandatory gates:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ DEVELOP  │───→│ SHADOW   │───→│ A/B TEST │───→│ PRODUCTION│───→│ RETIRE   │
│ (Offline │    │ (Mirror  │    │ (Live    │    │ (Serving  │    │ (Archive │
│  training)│    │  traffic) │    │  split)  │    │  traffic) │    │  + doc)  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Stage Gates:**

| Stage | Duration | Success Criteria | Gate Keeper |
|-------|----------|-----------------|-------------|
| **Develop** | Variable | Training loss converges, Offline eval metrics met | AI Team Lead |
| **Shadow** | 7 days | Output quality within 5% of production model | AI Engineer |
| **A/B Test** | 14 days | Statistically significant improvement (p<0.05) | AI Team + Domain Owner |
| **Production** | Until retired | Monitoring metrics within SLA | Automated (rollback if breached) |
| **Retire** | 30-day notice | Replacement model stable in production | Architecture Review Board |

**Monitoring Metrics (Production):**
- Prediction accuracy / quality score
- Latency (P50/P95/P99)
- Confidence calibration (expected vs actual accuracy)
- Drift detection (data drift, concept drift)
- Cost per inference
- User feedback score (explicit + implicit)

### 13.4 Prompt Registry

All AI prompts are managed through a versioned Prompt Registry — never hardcoded.

**Prompt Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | String | Human-readable name (e.g., "buyer-ai-supplier-ranking") |
| `version` | SemVer | Semantic version |
| `model` | String | Target model (e.g., "gpt-4o-mini", "gemini-2.0-flash") |
| `temperature` | Float | 0.0 - 1.0 |
| `maxTokens` | Integer | Maximum output tokens |
| `systemPrompt` | Text | System-level instructions |
| `userTemplate` | Template | User message template with variables |
| `costPerCall` | Float | Estimated cost in platform credits |
| `status` | Enum | `draft → active → deprecated → retired` |
| `changeLog` | JSON[] | History of changes with timestamps and authors |

**Versioning Rules:**
- Every prompt change creates a new version
- Active prompts can be A/B tested (split traffic between versions)
- Prompt audit log records every inference with prompt version used
- Deprecated prompts remain available for 90 days for replay/debugging

### 13.5 AI Cost Governance

AI costs are tracked and governed as a first-class platform resource.

**Cost Tracking Dimensions:**
| Dimension | Tracking | Budget Enforcement |
|-----------|----------|-------------------|
| **Per Agent** | Credits consumed per agent per period | Per-agent monthly budget |
| **Per Tenant** | Credits consumed per company per period | Per-company plan-based allowance |
| **Per Model** | Credits consumed per AI model | Model-level cost alerts |
| **Per Action Type** | Credits consumed per action category | Action-type throttling |

**Budget Tiers:**
| Tier | Monthly Credit Allowance | Overage Policy |
|------|------------------------|----------------|
| **Free** | 20 credits | Blocked until next period |
| **Starter** | 100 credits | Pay-per-use at 2x rate |
| **Professional** | 500 credits | Pay-per-use at 1.5x rate |
| **Enterprise** | Custom | Invoiced |

**Alert Thresholds:**
- Warning at 70% of budget
- Critical at 90% of budget
- Hard block at 100% (configurable per company)

### 13.6 AI Audit Log

Every AI action is logged with full context for audit, debugging, and improvement.

**Audit Entry Schema:**
```
AuditEntry {
  id: UUID
  timestamp: DateTime
  agentId: String
  actionType: String
  decisionType: Suggestion | Recommendation | Assisted | Delegated | Autonomous | Emergency
  inputContext: JSON (sanitised — no PII)
  outputValue: JSON
  confidence: Float
  signalsUsed: [SignalRef]
  reasoning: String
  outcome: Success | Failure | Pending | Unknown
  costCredits: Float
  modelVersion: String
  promptVersion: String
  userId: String (optional)
  companyId: String
  requiresHumanReview: Boolean
  reviewedBy: String | null
  reviewedAt: DateTime | null
}
```

**Retention:**
- Active decisions: Online for 90 days
- Archived: Object store for 7 years
- Audited decisions: Permanent (append-only)

### 13.7 Human Approval Policy

| Decision Type | Auto-Approval Criteria | Requires Human |
|---------------|----------------------|----------------|
| **Recommendations** | Always (informational) | — |
| **Standard Execution** | Confidence > 0.85, Value < ₹50K, TradTrust > 700, Pattern matched >100x | Any criterion not met |
| **High-Value Execution** | Never | All >₹50K transactions |
| **Novel Actions** | Never | First-time action type |
| **Fraud Response** | Confidence > 0.95 (emergency auto-block) | Confidence < 0.95 |
| **Account Changes** | Never | All account-level changes |
| **Regulatory Actions** | Never | All compliance-impacting actions |
| **Cross-Border** | Confidence > 0.85, Value < ₹10L | Any criterion not met |

**Escalation Path:**
1. Agent → Automated action (if within autonomy)
2. Agent → Human approval request (if requires approval)
3. Human → Accept/Reject/Modify
4. Human → Escalate to supervisor (if confidence low or risk high)
5. Supervisor → Final decision (recorded in audit log)

### 13.8 Responsible AI Principles

| Principle | Implementation | Verification |
|-----------|---------------|--------------|
| **Fairness** | Models evaluated for bias across industry, geography, company size, and business tenure | Quarterly bias audit |
| **Transparency** | Every AI decision includes explainable reasoning in business language | Decision audit completeness (100% target) |
| **Accountability** | Every AI action is traceable to a specific agent version, model version, and prompt version | Audit log completeness |
| **Privacy** | No business data crosses entity boundaries. All shared intelligence is differentially private (min 5 entities). | Quarterly privacy review |
| **Safety** | Confidence-gated autonomy with hard limits on financial and regulatory actions | Circuit breaker monitoring |
| **Human Control** | Businesses can override, limit, or disable any AI agent at any time | Per-company agent configuration |
| **Continuous Improvement** | All outcomes (positive and negative) train the system via the Learning Engine | Feedback capture rate > 90% |

---

> **End of TRADINGO Intelligence Architecture**
>
> *"Every interaction is intelligence. Every decision is learning. Every transaction is trust."*
