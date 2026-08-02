# TRADINGO Architecture Freeze Document v1.0

**Status**: FROZEN
**Date**: 2026-07-21
**Version**: 1.0.0 GA
**Authority**: Chief Enterprise Architect
**Scope**: Entire TRADINGO platform — 266 Prisma models, 162 controllers, 196 DTOs, 12 security guard categories, 6 AI providers, 7 registered agents, 126 AI actions, 292 frontend pages, 282 API routes

---

## 1. Executive Summary

TRADINGO is a monolithic NestJS (Fastify) backend serving a Next.js 14 frontend, deployed as a single codebase with 92 registered NestJS modules. The platform spans B2B marketplace commerce (RFQ, Quote, Negotiation, Order, Payment, Payout, Settlement, Dispute, Escrow, Commission), professional services marketplace (TradeServ), community/social platform (TradeTalk), enterprise trust scoring (TradTrust), digital wallet & gamification (GOCASH), enterprise master catalog & search intelligence (Enterprise Catalog/OpenSearch), AI platform (Gateway, Orchestrator, Runtime, Federation, Agents), growth/product/admin intelligence, multi-provider AI with circuit breaker and SLA monitoring, BullMQ background job processing, ClickHouse analytics, Prometheus metrics, and fully documented OpenAPI at 1,325 endpoints.

The database is PostgreSQL 16 with 266 tables managed by Prisma ORM. Redis provides caching, session management, BullMQ queue backend, and Socket.io pub/sub for horizontal chat scaling. OpenSearch (4 enterprise indices + marketplace) powers search. ClickHouse stores analytics events. Sentry captures errors. Pino provides structured logging.

**This architecture is now officially frozen.** No new modules may be introduced. No existing module may be replaced. All future development must extend the existing module set following the Extension Rules in Section 9.

**Engineering philosophy**: Build on what exists. Audit before adding. Reuse shared services before creating new ones. Never duplicate a capability that already has a canonical implementation. Every change must be backward compatible with all existing workflows. No placeholder code, no TODOs, no hardcoded test data in production paths.

---

## 2. Official Platform Modules

### 2.1 Core Commerce

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **AuthModule** | JWT authentication, registration, login, password reset, email/mobile verification, social login, refresh tokens | Redis, Prisma, Config | PRODUCTION | New auth providers (OAuth), new verification methods | JWT strategy, token format, refresh flow, rate limits |
| **UsersModule** | User CRUD, profile management, role assignment | Prisma | PRODUCTION | Profile fields, preferences | User model structure, core fields |
| **CompaniesModule** | Company CRUD, company profile, my-company resolution | Prisma, Storage | PRODUCTION | Profile fields, verification workflows | Company model, slug generation |
| **CategoriesModule** | Category CRUD, tree management, admin-guarded write | Prisma | PRODUCTION | Subcategory depth, attributes | Category model, hierarchy |
| **IndustriesModule** | Industry CRUD, admin-guarded write | Prisma | PRODUCTION | Industry fields | Industry model |
| **ProductsModule** | Product CRUD, marketplace product management, event emission | Prisma, EventEmitter, Storage | PRODUCTION | Product fields, quality scoring, AI enrichment | Core product model, lifecycle events |
| **RfqModule** | Legacy RFQ management | Prisma | PRODUCTION | None (superseded by SmartRfqModule) | All endpoints |
| **SmartRfqModule** | RFQ lifecycle (create, edit, submit, quote requests, accept/reject quote), AI RFQ intelligence | Prisma, AiGateway, TradTrust | PRODUCTION | RFQ fields, AI intelligence features | RFQ state machine, quote acceptance flow |
| **QuoteModule** | Quote CRUD, AI quote advisor | Prisma, AiGateway | PRODUCTION | Quote fields, AI pricing features | Quote model, lifecycle |
| **SmartNegotiationModule** | Negotiation CRUD, AI copilot (strategy, behavior, risk, communication, summary) | Prisma, AiGateway, Quote, TradTrust | PRODUCTION | AI negotiation features, negotiation fields | Negotiation state machine |
| **SmartPoModule** | Purchase Order lifecycle | Prisma | PRODUCTION | PO fields, approval workflows | PO model, state machine |
| **SmartOrderModule** | Order lifecycle | Prisma | PRODUCTION | Order fields | Order model, state machine |
| **SmartShipmentModule** | Shipment tracking | Prisma | PRODUCTION | Shipment fields, carrier integration | Shipment model, status flow |
| **SmartDeliveryModule** | Delivery confirmation | Prisma | PRODUCTION | Delivery fields | Delivery model, confirmation flow |
| **OrderModule** | Legacy order management | Prisma | PRODUCTION | None (superseded by SmartOrderModule) | All endpoints |
| **PaymentModule** | Payment processing, Razorpay integration, webhooks | Prisma, Razorpay | PRODUCTION | New payment gateways | Razorpay integration flow, payment model, webhook verification |
| **PayoutModule** | Seller payout processing | Prisma, Razorpay | PRODUCTION | Payout fields | Payout model, settlement schedule |
| **SettlementModule** | Settlement lifecycle | Prisma | PRODUCTION | Settlement fields | Settlement model, state machine |
| **EscrowModule** | Escrow management | Prisma | PRODUCTION | Escrow fields | Escrow model, release flow |
| **CommissionModule** | Commission calculation | Prisma | PRODUCTION | Commission rates | Commission calculation logic |
| **DisputeModule** | Dispute lifecycle with processor execution | Prisma, BullMQ | PRODUCTION | Dispute fields | Dispute state machine, processor pattern |
| **MembershipModule** | Plan management, subscriptions, benefits (AI credits, XP multiplier, advertising discounts) | Prisma, Gocash | PRODUCTION | New plans, new benefits | Plan model, subscription lifecycle, benefit calculation |
| **BillingModule** | Billing/invoice management | Prisma | PRODUCTION | Invoice fields | Invoice model |
| **SellerProductModule** | Seller-specific product management | Prisma, Products | PRODUCTION | Seller product fields | Product-seller relationship |
| **SellerAnalyticsModule** | Seller analytics dashboard | Prisma | PRODUCTION | Analytics dimensions | Dashboard data model |
| **SellerModule** | Seller workspace services | Prisma | PRODUCTION | Seller tools | Seller identity |

### 2.2 GOCASH & Rewards

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **GocashModule** | Wallet CRUD, credit/debit/reverse, ledger, idempotency, admin stats | Prisma | PRODUCTION | Transaction types | **GOCASH Ledger** — ALL: append-only ledger, balance calculation, idempotency, direction/status, credit/debit/reverse |
| **ReferralModule** | Referral codes, fraud detection, rewards, admin dashboard | Prisma, Gocash | PRODUCTION | Referral rules, fraud detection features | Referral code generation, reward processing |
| **CampaignModule** | Campaign engine, IF/THEN rules, budgets, eligibility, analytics | Prisma, Gocash | PRODUCTION | Campaign types, rule operators | Budget engine, eligibility engine |
| **GocashIntegrationModule** | Platform-wide reward triggers (signup, order, RFQ, quote, shipment, delivery) | Gocash, Notification | PRODUCTION | New reward triggers | Idempotent reward processing, reward constants |
| **GocashEcosystemModule** | Gamification: XP, levels, badges, missions, achievements, streaks, daily checkin, leaderboard | Prisma, EventEmitter, Gocash, Notification | PRODUCTION | New mission types, badge types, achievement criteria | XP ledger, level calculation, streak logic |
| **WalletApiModule** | Buyer/seller/admin wallet API, statements, CSV export, analytics, freeze/unfreeze | Gocash | PRODUCTION | Wallet analytics dimensions | Wallet freeze/unfreeze, manual adjustment |

### 2.3 TradeServ (Professional Services)

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **TradeservModule** | Professional services marketplace: profile, search, booking, proposals, reviews, inquiries, AI assistance | Prisma, AiGateway, TradTrust, Chat | PRODUCTION | Service categories, booking workflows, review criteria | Professional profile model, booking state machine, proposal lifecycle |

### 2.4 TradeTalk (Community & Social)

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **TradeTalkModule** | Community management, social posts, feeds, comments (reuses Chat/Messages), likes, bookmarks, follows, invitations, AI content assistance | Prisma, AiGateway, Chat | PRODUCTION | Post types, community features, moderation | Post model, follow model, comment system (via Chat Messages) |

### 2.5 Chat & Communication

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **ChatModule** | Real-time messaging via Socket.io, conversation management, TradeTalk comment conversations | Prisma, Redis (Socket.io adapter) | PRODUCTION | Message types, conversation features | Message model, WebSocket gateway, Redis adapter |

### 2.6 TradTrust

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **TradTrustModule** | 8-endpoint trust scoring engine, 6-dimension scoring, score history, recalculation, leaderboard | Prisma | PRODUCTION | **TradTrust Engine** — ALL: scoring dimensions, weight configuration, recalculation, score history, leaderboard |

### 2.7 Enterprise Catalog & Search

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **EnterpriseCatalogModule** | Master catalog: GlobalBrands, GlobalAttributes, Taxonomy (synonyms, industry-category mappings), Catalog quality scoring, event-driven commerce events, catalog rewards, advertising automation | Prisma, EventEmitter, AiGateway, GocashIntegration, Advertising | PRODUCTION | Brand/attribute fields, synonym pairs | GlobalBrand model, GlobalAttribute model, CatalogSynonym model, IndustryCategoryMapping model |
| **EnterpriseIntelligenceModule** | Enterprise intelligence: dashboard, revenue, growth, health, anomalies, market intelligence, compliance, risk, supplier intelligence, digital twin optimization, agent registry | Prisma, AiGateway, Federation | PRODUCTION | Intelligence metrics, digital twin optimization parameters | Digital twin engine, intelligence aggregation |
| **GrowthIntelligenceModule** | Growth analytics: acquisition funnel, campaign performance, referral conversion, lead conversion, landing pages, traffic sources | Prisma, Tracking | PRODUCTION | Growth metrics, attribution models | Tracking event catalog, funnel calculation |

### 2.8 AI Platform

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **AiGatewayModule** | Central AI gateway: 6 provider adapters, model registry, provider routing, prompt management, API key vault, cost engine, usage tracking, credit enforcement | Prisma, Redis | PRODUCTION | New provider adapters, new models | **AI Gateway** — ALL: provider abstraction, routing logic, prompt management, credit enforcement, cost engine |
| **AiOrchestratorModule** | AI orchestrator: 126-action registry, context engine (5 domains), memory service, workflow engine, observability | Prisma, AiGateway, Redis | PRODUCTION | New actions in registry, new workflows | Action registry format, context engine, memory LRU |
| **AiRuntimeModule** | AI runtime: BullMQ priority queues (critical/default/background), circuit breaker, SLA engine (P50/P95/P99), streaming SSE, telemetry | BullMQ, Redis, Prisma | PRODUCTION | Queue configurations, SLA targets | Circuit breaker pattern, BullMQ queue assignment, SLA measurement framework |
| **AiFederationModule** | Multi-agent federation: capability matching, collaboration engine (6 patterns), cross-agent workflows (4 predefined), agent messaging, shared context, federation analytics | AgentFramework, AiOrchestrator, BullMQ | PRODUCTION | New collaboration patterns, new cross-agent workflows | Federation service, capability matching, collaboration engine |
| **AgentFrameworkModule** | Global agent registry: agent discovery, capability metadata, execution contract | Prisma | PRODUCTION | New agent capabilities | Registry format, metadata schema, execution contract |
| **SellerAgentModule** | TradeAI Seller Agent: 8 endpoints, smart sell, product intelligence, demand analysis, pricing, competition, market intel | AiGateway, TradTrust | PRODUCTION | Agent capabilities | Agent identity, capability set |
| **BuyerAgentModule** | TradeAI Buyer Agent: 8 endpoints, procurement, RFQ, supplier intelligence, negotiation, cost optimization, notifications | AiGateway, TradTrust | PRODUCTION | Agent capabilities | Agent identity, capability set |
| **AdminAgentModule** | TradeAI Admin Agent: 10 endpoints, system health, user activity, fraud, revenue, moderation, growth, performance | Prisma, AiGateway | PRODUCTION | Agent capabilities | Agent identity, capability set |
| **CommunityAgentModule** | Community Agent: 9 endpoints | AiGateway, TradeTalk | PRODUCTION | Agent capabilities | Agent identity, capability set |
| **ProfessionalAgentModule** | Professional Agent: 9 endpoints | AiGateway, TradeServ | PRODUCTION | Agent capabilities | Agent identity, capability set |
| **FounderExecutiveAgentModule** | Executive Agent: 9 endpoints, executive copilot, decision center, KPI dashboard, risk engine, opportunity engine | Prisma, FounderAi, AiFederation, AiRuntime | PRODUCTION | Agent capabilities | Agent identity, capability set |

### 2.9 Intelligence & Analytics

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **AiModule** | AI product intelligence: title generation, attribute suggestion, category suggestion, catalog quality, duplicate detection | Prisma, AiGateway | PRODUCTION | New AI features | Catalog quality scoring, duplicate detection |
| **AdminIntelligenceModule** | Admin AI: 12 endpoints, morning brief, revenue/user growth, fraud, churn, category intelligence, market trends, executive copilot | FounderAi, AiGateway | PRODUCTION | Intelligence metrics | Intelligence prompt template |
| **FounderAiModule** | Founder AI: 19 endpoints, health score, priorities, timeline, reports, marketplace intelligence aggregation | Prisma, Analytics | PRODUCTION | Health dimensions, report types | Health scoring algorithm, priority ranking |
| **EnterpriseIntelligenceModule** | Enterprise intelligence: dashboard aggregation, ML analytics, digital twin | Prisma, AiGateway, Federation | PRODUCTION | Intelligence dimensions, optimization parameters | Digital twin engine |
| **GrowthIntelligenceModule** | Growth analytics: acquisition funnel, campaign/referral/lead conversion, top pages, traffic sources | Prisma, Tracking | PRODUCTION | Growth metrics | Funnel calculation, event attribution |
| **AnalyticsModule** | Analytics: ClickHouse queries, admin dashboard, 11 endpoints | ClickHouse, Prisma | PRODUCTION | Analytics dimensions | ClickHouse query patterns |
| **SellerAnalyticsModule** | Seller-scoped analytics | Prisma | PRODUCTION | Analytics dimensions | Data aggregation |

### 2.10 Additional Modules

| Module | Purpose | Dependencies | Status | Allowed Extension | Frozen Components |
|--------|---------|-------------|--------|-------------------|-------------------|
| **TrackingModule** | Event tracking pipeline: 60/min throttle, 3 retries, 3 providers (ClickHouse, GA4, UsageEvent), frontend tracking hook | BullMQ, ClickHouse, Prisma | PRODUCTION | New tracking providers, new event types | **Tracking** — ALL: event pipeline, provider dispatch, frontend tracking hook |
| **NotificationModule** | In-app notifications, 68+ templates, email (SES), SMS (Twilio), notification preferences | Prisma, Sms, SES | PRODUCTION | New notification channels, new templates | Notification template system, delivery routing |
| **SmsModule** | SMS gateway: Twilio integration, rate limiting, SmsLog persistence | Twilio, Prisma | PRODUCTION | SMS providers | Twilio integration |
| **AdvertisingModule** | Enterprise advertising: 9 ad types, CPC/CPM/Fixed, GOCASH funding, membership discounts, impression/click tracking, placements API | Prisma, Gocash, Membership | PRODUCTION | Ad types, pricing models, placement slots | Ad funding via GOCASH, placement API |
| **LocationIntelligenceModule** | Geocoding (Nominatim OSM), nearby search, geo clusters, territory management | Prisma | PRODUCTION | Geocoding providers, territory features | Geocoding abstraction |
| **MarketplaceIntelligenceModule** | 14-factor BestSupplierEngine | Prisma, TradTrust | PRODUCTION | Scoring factors | BestSupplierEngine |
| **CrmModule** | CRM: lead management, pipeline, inquiry sourcing | Prisma | PRODUCTION | Pipeline stages, lead sources | Lead model, pipeline state machine |
| **FinanceModule** | Finance: credit, collections, AI finance copilot (credit risk, payment delay, cash flow, collection strategy) | Prisma, AiGateway | PRODUCTION | Finance features | Credit/collection models |
| **FreightIntelligenceModule** | Freight intelligence | Prisma | PRODUCTION | Freight features | Data models |
| **MarketIntelligenceModule** | Market intelligence | Prisma | PRODUCTION | Intelligence sources | Data models |
| **TerritoryIntelligenceModule** | Territory management | Prisma | PRODUCTION | Territory features | Territory model |
| **CompanyVerificationModule** | KYC/company verification workflow | Prisma, Storage | PRODUCTION | Verification fields | Verification workflow |
| **UserVerificationModule** | Buyer/user verification workflow | Prisma, Storage | PRODUCTION | Verification fields | Verification workflow |
| **ReputationModule** | Reputation event system (append-only) | Prisma | PRODUCTION | Event types | Event log model |
| **CommissionModule** | Commission calculation engine | Prisma | PRODUCTION | Commission rules | Calculation logic |
| **PayoutModule** | Payout scheduling, Razorpay integration | Prisma, Razorpay | PRODUCTION | Payout schedules | Payout lifecycle |
| **SearchModule** | OpenSearch marketplace search | OpenSearch | PRODUCTION | Search features | Search abstraction |
| **CatalogAdapterModule** | Catalog compatibility layer | Prisma | PRODUCTION | Compatibility features | Adapter pattern |
| **IncidentResponseModule** | Security incident response | Prisma | PRODUCTION | Response procedures | Incident model |
| **AuditLogModule** | Audit trail | Prisma | PRODUCTION | Audit events | Audit log model |
| **AdminSettingsModule** | Platform administration settings | Prisma | PRODUCTION | Settings fields | Settings model |
| **FeatureFlagModule** | Feature flag management | Prisma | PRODUCTION | Feature flags | Flag evaluation |
| **OnboardingModule** | User onboarding flows | Prisma | PRODUCTION | Onboarding steps | Onboarding state machine |
| **ProfileCompletionModule** | Company profile completion tracking | Prisma | PRODUCTION | Completion criteria | Scoring algorithm |
| **HealthModule** | Liveness/readiness probes for K8s | - | PRODUCTION | Health indicators | Probe endpoints |
| **JobsModule** | BullMQ processor registration | BullMQ | PRODUCTION | New processors | BullMQ configuration |
| **StorageModule** | AWS S3 file storage abstraction | AWS S3 | PRODUCTION | Storage providers | Storage abstraction |

---

## 3. Single Source of Truth

### 3.1 Authentication

- **Official Module**: AuthModule
- **Official Service**: AuthService
- **Official Database Owner**: Prisma — User, Session, Otp models
- **Pattern**: JWT access token (15 min) + refresh token (7 days), stored in Redis for invalidation
- **Guards**: JwtAuthGuard, @Public() decorator for public endpoints

### 3.2 Users

- **Official Module**: UsersModule
- **Official Service**: UsersService
- **Official Database Owner**: Prisma — User model
- **Pattern**: CRUD with company association, role management

### 3.3 Companies

- **Official Module**: CompaniesModule
- **Official Service**: CompaniesService
- **Official Database Owner**: Prisma — Company model
- **Pattern**: CRUD with verification levels, TradTrust scoring

### 3.4 Products

- **Official Module**: ProductsModule (marketplace) + SellerProductModule (seller workspace)
- **Official Service**: ProductsService + SellerProductService
- **Official Database Owner**: Prisma — Product model, ProductVariant, ProductSpecs, ProductMedia, ProductAttribute, ProductCertification
- **Pattern**: Seller creates via SellerProductModule, marketplace serves via ProductsModule, events emitted via EventEmitter

### 3.5 Categories

- **Official Module**: CategoriesModule
- **Official Service**: CategoriesService
- **Official Database Owner**: Prisma — Category model
- **Pattern**: Admin-guarded write, public read, hierarchical tree

### 3.6 RFQ

- **Official Module**: SmartRfqModule (primary) + RfqModule (legacy)
- **Official Service**: SmartRfqService
- **Official Database Owner**: Prisma — SmartRfq, RfqProductItem, RfqTimeline models
- **Pattern**: Buyer creates RFQ, sellers respond with quotes, buyer accepts/rejects

### 3.7 Quotes

- **Official Module**: QuoteModule
- **Official Service**: QuoteService
- **Official Database Owner**: Prisma — Quote, QuoteLineItem models
- **Pattern**: Seller creates quote in response to RFQ, buyer reviews and accepts

### 3.8 Negotiation

- **Official Module**: SmartNegotiationModule
- **Official Service**: SmartNegotiationService
- **Official Database Owner**: Prisma — SmartNegotiation, NegotiationMessage models
- **Pattern**: Buyer/seller negotiate price/terms, AI copilot assists both sides

### 3.9 Orders

- **Official Module**: SmartOrderModule (primary) + OrderModule (legacy)
- **Official Service**: SmartOrderService
- **Official Database Owner**: Prisma — Order, OrderItem models
- **Pattern**: Created from accepted quote, triggers shipment/delivery workflow

### 3.10 Payments

- **Official Module**: PaymentModule
- **Official Service**: PaymentService (Razorpay)
- **Official Database Owner**: Prisma — Payment, PaymentMethod, ManualPaymentProof models
- **Pattern**: Razorpay integration with webhook verification, manual payment proof support

### 3.11 Payouts

- **Official Module**: PayoutModule
- **Official Service**: PayoutService
- **Official Database Owner**: Prisma — Payout model
- **Pattern**: Automated Razorpay payouts, scheduled via BullMQ processor

### 3.12 Settlement

- **Official Module**: SettlementModule
- **Official Service**: SettlementService
- **Official Database Owner**: Prisma — Settlement model
- **Pattern**: Automated settlement between buyer and seller

### 3.13 Disputes

- **Official Module**: DisputeModule
- **Official Service**: DisputeService
- **Official Database Owner**: Prisma — Dispute, DisputeProcessorExecution models
- **Pattern**: Escalation workflow with automated processing via BullMQ DisputeProcessor

### 3.14 TradeServ

- **Official Module**: TradeservModule
- **Official Service**: TradeservService + TradeservSearchService + TradeservBookingService + TradeservInquiryService + TradeservProposalService + AiTradeservService
- **Official Database Owner**: Prisma — ProfessionalService, ProfessionalPortfolio, ProfessionalCertification, ProfessionalAvailability, ProfessionalLanguage, ProfessionalServiceArea, ProfessionalInquiry, Booking, ProfessionalReview, Proposal, ProfessionalSavedSearch
- **Pattern**: Professional services marketplace with search, booking, proposals, reviews

### 3.15 TradeTalk

- **Official Module**: TradeTalkModule
- **Official Service**: TradeTalkService + SocialPostService + SocialFeedService + SocialFollowService + AiTradeTalkService
- **Official Database Owner**: Prisma — SocialPost, SocialPostLike, SocialSavedPost, SocialFollow, Community models
- **Pattern**: Community social platform with posts, feeds, comments (via Chat Messages), follows, AI content assistance

### 3.16 TradTrust

- **Official Module**: TradTrustModule
- **Official Service**: TradTrustService
- **Official Database Owner**: Prisma — TrustScore, TrustScoreHistory models
- **Pattern**: 6-dimension trust scoring engine, weight-configurable, recalculate on demand

### 3.17 GOCASH

- **Official Module**: GocashModule
- **Official Service**: GocashService
- **Official Database Owner**: Prisma — GOCASH_Wallet, GOCASH_Transaction, GOCASH_Redemption
- **Pattern**: Append-only ledger, credit/debit/reverse with idempotency keys, balance calculated from transaction sum

### 3.18 Enterprise Catalog

- **Official Module**: EnterpriseCatalogModule
- **Official Service**: CatalogAdminService, GlobalBrandService, GlobalAttributeService, TaxonomyService, CatalogQualityService
- **Official Database Owner**: Prisma — GlobalBrand, GlobalAttribute, CatalogItem, CatalogCategory, CatalogSubcategory, CatalogAttribute, CatalogAlias, CatalogIndustryMapping, CatalogUnit, CatalogSynonym, IndustryCategoryMapping, CatalogQualityScore
- **Pattern**: Master catalog management with brand/attribute/taxonomy engines

### 3.19 Enterprise Search

- **Official Module**: EnterpriseCatalogModule (search sub-services)
- **Official Service**: EnterpriseSearchService, SynonymIntelligenceService, EnterpriseRankingService, EnterpriseSearchAnalyticsService
- **Official Database Owner**: Prisma — EnterpriseSearchAnalytics, EnterpriseSearchTrending + OpenSearch (4 indices: enterprise_brands, enterprise_attributes, enterprise_synonyms, enterprise_mappings)
- **Pattern**: Unified search across catalog entities with synonym expansion, 8-factor ranking, analytics

### 3.20 Analytics

- **Official Module**: AnalyticsModule
- **Official Service**: AnalyticsService, ClickHouseService
- **Official Database Owner**: ClickHouse + Prisma (aggregated)
- **Pattern**: ClickHouse for raw event analytics, Prisma for pre-aggregated dashboard data

### 3.21 Notifications

- **Official Module**: NotificationModule
- **Official Service**: NotificationService
- **Official Database Owner**: Prisma — Notification, NotificationPreference models
- **Pattern**: Template-based notification creation, multi-channel delivery (in-app, email, SMS)

### 3.22 Tracking

- **Official Module**: TrackingModule
- **Official Service**: TrackingService, TrackingProcessor (BullMQ)
- **Official Database Owner**: BullMQ queue + ClickHouse + Prisma (UsageEvent)
- **Pattern**: Frontend events via POST /track, BullMQ processing, dispatch to 3 providers

### 3.23 AI Gateway

- **Official Module**: AiGatewayModule
- **Official Service**: AiGatewayService, ProviderRegistryService, ProviderRouterService, PromptManagerService, ApiKeyVaultService, AiCreditsService, UsageTrackerService, CostEngineService, ProviderHealthService, ModelRegistryService
- **Official Database Owner**: Prisma — AiProvider, AiPrompt, AiJobAudit, AiCreditUsage models
- **Pattern**: Provider-agnostic AI processing with fallback routing, credit enforcement, cost tracking

### 3.24 AI Runtime

- **Official Module**: AiRuntimeModule
- **Official Service**: AiStreamingRuntimeService, AiAgentRuntimeService, AiCircuitBreakerService, AiSlaEngineService, AiTelemetryService
- **Official Database Owner**: BullMQ (3 queues) + Prisma (audit) + Redis (circuit state)
- **Pattern**: Priority queue dispatching, circuit breaker, SLA monitoring, SSE streaming

### 3.25 AI Agents

- **Official Framework**: AgentFrameworkModule (global)
- **Official Registry**: AgentRegistryService
- **Official Meta-Owner**: AiFederationModule
- **Registered Agents**: Seller Agent, Buyer Agent, Admin Agent, Community Agent, Professional Agent, Executive Agent, Enterprise Intelligence
- **Pattern**: Agents register with capability metadata, federation routes requests to matching agents

### 3.26 Founder Intelligence

- **Official Module**: FounderAiModule + EnterpriseIntelligenceModule + GrowthIntelligenceModule
- **Official Service**: FounderAiService, EnterpriseIntelligenceService, GrowthIntelligenceService
- **Official Database Owner**: Prisma (aggregations) + ClickHouse (raw data)
- **Pattern**: Aggregated platform intelligence with health scoring, predictive analytics, digital twin

### 3.27 Developer Platform

- **Official Source**: OpenAPI/Swagger at /api/docs (dev mode only)
- **Official Documentation**: /docs/architecture/ directory (155+ documents moved from root)
- **Pattern**: Swagger auto-generates from NestJS decorators, all 1,325 endpoints documented

---

## 4. Shared Platform Services

| Service | Module | Owner | Purpose |
|---------|--------|-------|---------|
| **Redis** | RedisModule (common/services) | Platform | Caching, session storage, BullMQ backend, Socket.io pub/sub, circuit breaker state |
| **BullMQ** | JobsModule + @nestjs/bullmq | Platform | Background job processing: disputes, escrow, payout, email, settlement, RFQ, bestseller, AI, export, certification, subscription, tracking |
| **Prisma** | PrismaModule | Database | ORM for PostgreSQL 16, 266 models, all DML operations |
| **ClickHouse** | AnalyticsModule | Analytics | Raw analytics event storage, time-series queries |
| **OpenSearch** | SearchModule + EnterpriseCatalogModule | Search | Full-text search, marketplace indices, 4 enterprise indices |
| **Notification** | NotificationModule | Platform | Multi-channel notification delivery (in-app, email, SMS) |
| **SMS** | SmsModule | Platform | Twilio SMS gateway with rate limiting |
| **Storage** | StorageModule | Platform | AWS S3 file upload abstraction |
| **AI Gateway** | AiGatewayModule | AI Platform | Provider-agnostic AI processing hub |
| **AI Runtime** | AiRuntimeModule | AI Platform | Queue, circuit breaker, SLA, streaming |
| **AI Orchestrator** | AiOrchestratorModule | AI Platform | Action registry, context engine, memory, workflow |
| **AI Federation** | AiFederationModule | AI Platform | Multi-agent coordination, capability matching |
| **Agent Framework** | AgentFrameworkModule (global) | AI Platform | Agent registration, discovery, execution contract |
| **Event Bus** | EventEmitter2 (via GocashEcosystemModule) | Platform | In-process domain events (product lifecycle, ecosystem events) |
| **Prometheus** | main.ts MetricsInterceptor | Operations | HTTP metrics, custom metrics, scraped at /api/v1/metrics |
| **Sentry** | main.ts SentryInterceptor | Operations | Error tracking, performance monitoring |
| **Pino** | common/logger.ts | Operations | Structured JSON logging with redaction |
| **Config** | ConfigModule (global) | Platform | Environment variable validation via Joi schema |
| **Validation** | ValidationPipe (global) | Platform | class-validator DTO validation with whitelist/transform |

---

## 5. Event-Driven Architecture

### 5.1 Domain Events (EventEmitter2 — In-Process)

- **Registered via**: GocashEcosystemModule (`EventEmitterModule.forRoot({ wildcard: false, delimiter: '.', maxListeners: 20 })`)
- **Scope**: In-process synchronous/asynchronous event handling within the NestJS process
- **Known events**:
  - `product.created` — emitted by ProductsService.create()
  - `product.updated` — emitted by ProductsService.update()
  - `product.published` — emitted by ProductsService.publish()
  - `product.unpublished` — emitted by ProductsService.unpublish()
  - Quality milestone events (handled by EnterpriseCommerceEventHandler)
  - AI enrichment events
  - Ecosystem events (checkin, levelUp, badgeEarned, missionCompleted)
- **All handlers**: EnterpriseCommerceEventHandler (4 @OnEvent handlers)

### 5.2 Background Jobs (BullMQ — Async)

| Queue Type | Queues | Processor | Owner | Purpose |
|-----------|--------|-----------|-------|---------|
| **Platform Queues** | (configured in jobs/queues.ts) | Platform | Core marketplace async jobs |
| | dispute | DisputeProcessor | Dispute | Automated dispute resolution |
| | escrow | EscrowProcessor | Escrow | Escrow release scheduling |
| | payout | PayoutProcessor | Payout | Automated payout execution |
| | email | EmailProcessor | Notification | SES email delivery |
| | settlement | SettlementProcessor | Settlement | Settlement calculation |
| | rfq | RfqProcessor | SmartRfq | RFQ expiry/notifications |
| | bestseller | BestsellerProcessor | Analytics | Bestseller calculation |
| | export | ExportProcessor | Export | Data export generation |
| | certification | CertificationProcessor | Certification | Certification processing |
| | subscription | SubscriptionProcessor | Membership | Subscription lifecycle |
| | tracking | TrackingProcessor | Tracking | Event dispatch to 3 providers |
| **AI Queues** | | AiAgentRuntimeService | AI Runtime | |
| | `critical` | (BullMQ queue) | AI Runtime | Priority AI jobs |
| | `default` | (BullMQ queue) | AI Runtime | Standard AI jobs |
| | `background` | (BullMQ queue) | AI Runtime | Batch/low-priority AI jobs |

### 5.3 Queue Ownership

| Queue | Owned By | Processing Pattern |
|-------|---------|-------------------|
| Dispute | DisputeModule | Single processor, sequential |
| Escrow | EscrowModule | Single processor, sequential |
| Payout | PayoutModule | Single processor, sequential |
| Email | NotificationModule | Single processor, sequential |
| Settlement | SettlementModule | Single processor, sequential |
| RFQ | SmartRfqModule | Single processor, sequential |
| Bestseller | AnalyticsModule | Scheduled cron |
| Export | ExportModule | On-demand |
| Certification | CertificationModule | On-demand |
| Subscription | MembershipModule | Scheduled cron |
| Tracking | TrackingModule | Single processor, 60/min throttle |
| AI Critical | AiRuntimeModule | Priority dispatch |
| AI Default | AiRuntimeModule | Standard dispatch |
| AI Background | AiRuntimeModule | Batch processing |

### 5.4 Event Flow

```
Frontend Action
  → NestJS Controller
    → Service Method
      → EventEmitter2.emit() (in-process domain event)
          → EnterpriseCommerceEventHandler (product lifecycle)
          → Ecosystem event handlers (gamification)
      → BullMQ queue.add() (async background job)
          → Processor
              → NotificationService
              → External Services (SES, Twilio)
              → Prisma writes
      → WebSocket Gateway (real-time)
          → Connected clients
```

---

## 6. AI Architecture

### 6.1 AI Gateway (AiGatewayModule)

Central processing hub that abstracts all AI providers:

- **Provider Registry**: 6 registered adapters — OpenRouter, Gemini, Groq, Tavily, Firecrawl, BaseProvider (fallback)
- **Provider Router**: Fallback chain routing on failure
- **Model Registry**: 14+ models across providers, tagged with capabilities (vision, OCR, streaming, maxTokens, contextWindow, cost)
- **Prompt Manager**: Template-based prompt management with auto-seeding for all AI features
- **API Key Vault**: Encrypted API key storage and rotation
- **Cost Engine**: Per-model cost calculation
- **Usage Tracker**: Per-company credit consumption tracking
- **Credit Enforcement**: 402 Payment Required on insufficient credits
- **Health Monitor**: Per-provider health status tracking

### 6.2 AI Runtime (AiRuntimeModule)

Production orchestration layer:

- **Priority Queues**: 3 BullMQ queues — critical (highest priority), default (standard), background (batch)
- **Circuit Breaker**: Action-level circuit state with configurable threshold (default: 5 failures), recovery timeout (60s), half-open max requests (3)
- **SLA Engine**: Per-action P50/P95/P99 latency tracking, configurable targets (default: 5000/15000/30000ms), alert threshold breach detection
- **Streaming SSE**: POST /ai-runtime/stream with configurable chunk size/delay, RxJS Observable pattern
- **Telemetry**: Job audit logging, latency recording, SLA breach recording

### 6.3 AI Orchestrator (AiOrchestratorModule)

Intelligence coordination layer:

- **Action Registry**: 126 registered AI actions across all domains
- **Context Engine**: 5-domain context aggregation — company, product, user, marketplace, membership
- **Memory Service**: LRU cache with AI memory storage/retrieval
- **Workflow Engine**: Multi-step AI workflow execution
- **Observability**: Action-level tracking and logging

### 6.4 AI Federation (AiFederationModule)

Multi-agent coordination:

- **Federation Service**: Agent discovery, capability matching, workflow routing
- **Capability Matching**: Automatic agent selection with confidence scoring (0.2-1.0), fallback chain generation
- **Collaboration Engine**: 6 execution patterns — single, parallel, sequential, conditional, nested, coordinator (DAG)
- **Cross-Agent Workflows**: 4 predefined — buyer-rfq, product-published, tradeserv-lead, platform-health
- **Agent Messaging**: Request/response/event/error message types, collaboration-scoped channels
- **Shared Context**: Federated context from AiContextEngine

### 6.5 Agent Framework (AgentFrameworkModule — Global)

Foundation for all agents:

- **Agent Registry**: Central registry with discovery, capability metadata, role/tag-based lookup
- **Execution Contract**: Standardized execute() method with context validation, latency tracking, error handling
- **Auto-Registration**: Modules register agents on init via onModuleInit

### 6.6 Registered Agents

| Agent | ID | Capabilities | Roles |
|-------|----|-------------|-------|
| Seller Agent | seller | Smart Sell, Product Intelligence, Demand Analysis, Pricing, Competition, Market Intel | SELLER, ADMIN |
| Buyer Agent | buyer | Smart Procurement, RFQ Assistant, Supplier Intelligence, Negotiation Advisor, Cost Optimization, Buyer Notifications | BUYER, ADMIN |
| Admin Agent | admin | System Health, User Activity, Fraud Intelligence, Revenue Analytics, Moderation Queue, Platform Growth, Performance Metrics, Daily Brief, All Insights | ADMIN, SUPER_ADMIN |
| Community Agent | community | Community moderation, content assistance | ADMIN, MODERATOR |
| Professional Agent | professional | Professional services AI | SELLER, ADMIN |
| Executive Agent | founder | Executive Copilot, Decision Center, Risk Engine, Opportunity Engine, KPI Dashboard, Agent Coordination, Executive Analytics, Morning Brief | SUPER_ADMIN |
| Enterprise Intelligence | enterprise-intelligence | Dashboard, Revenue, Growth, Health, Anomalies, Market, Compliance, Risk, Supplier, Summary, Digital Twin, Catalog, Workflow | ADMIN, SUPER_ADMIN |

### 6.7 AI Request Flow

```
1. User Action (frontend button click / API call)
   → Controller endpoint
     → Service method (domain specific)
       → AiGatewayService.process()
         → Credit enforcement check (AiCreditsService.checkCredits())
           → 402 if insufficient
         → Prompt construction (PromptManagerService)
         → Provider selection (ProviderRouterService)
           → Fallback chain on failure (ProviderRegistryService)
           → Circuit breaker check (AiCircuitBreakerService)
             → Route OPEN → skip provider
           → Provider HTTP call (OpenRouter/Gemini/Groq/etc.)
           → Latency recording (AiSlaEngineService)
           → Cost calculation (CostEngineService)
           → Usage recording (UsageTrackerService)
         → Response transformation
       → Return to controller
       → Return to frontend

2. AI Runtime Flow (for queue-based processing):
   → AiAgentRuntimeService.enqueue()
     → BullMQ queue (critical/default/background)
       → Processor
         → AiGatewayService.process()
         → Callback/WebSocket delivery

3. Agent Federation Flow (for multi-agent):
   → Federation endpoint
     → TradeAgentFederationService.executeCrossAgentWorkflow()
       → CapabilityMatchingService (finds matching agents)
       → CollaborationEngine (executes pattern)
         → AgentMessagingService (inter-agent communication)
         → SharedContextService (context assembly)
       → Result aggregation
     → Return to caller

4. Streaming Flow:
   → POST /ai-runtime/stream
     → AiStreamingRuntimeService
       → RxJS Observable
         → Chunked SSE response
         → AbortController cancellation
```

---

## 7. Security Freeze

### 7.1 Authentication

- **Mechanism**: JWT access token (15 min expiry) + refresh token (7 day expiry)
- **Storage**: Tokens in Authorization header (Bearer scheme); refresh tokens optionally stored in Redis for invalidation
- **Guard**: JwtAuthGuard — applied at controller level (396 references across all controllers)
- **Public endpoints**: @Public() decorator bypasses JWT auth (100 references)
- **Social login**: OAuth provider flow via AuthController
- **Password flow**: Forgot/reset password with OTP verification via Redis
- **Email verification**: OTP-based email verification
- **Mobile verification**: OTP-based mobile verification via Twilio SMS
- **Frozen**: JWT token format, refresh token rotation, OTP-based verification flow

### 7.2 Authorization

- **Mechanism**: Role-based access control (RBAC)
- **Roles**: User model has role enum; RolesGuard checks @Roles() decorator metadata (291 references)
- **Company ownership**: CompanyOwnerGuard ensures user belongs to the target company
- **Permissions**: PermissionsGuard + @Permissions() decorator for fine-grained access
- **Frozen**: Role hierarchy, RolesGuard implementation, @Roles() decorator contract

### 7.3 Validation

- **Global ValidationPipe**: whitelist=true, transform=true, forbidNonWhitelisted=true
- **Error format**: `{ statusCode: 400, message: string[], error: "Validation Error", timestamp }`
- **DTOs**: 196 class-validator decorated DTOs across all modules
- **Frozen**: ValidationPipe configuration, error format, class-validator requirement

### 7.4 Rate Limiting

- **Global**: 100 req/min per IP (ThrottlerGuard registered as APP_GUARD)
- **Auth-specific**: 5 req/min (login), 3 req/min (password reset), 3 req/min (OTP), 10 req/min (register), 20 req/min (refresh)
- **41 @Throttle decorators** on specific endpoints
- **Frozen**: Global rate limit, auth rate limit tiers

### 7.5 Audit Logs

- **Mechanism**: AuditLogModule with Prisma persistence
- **Coverage**: All admin write operations, role changes, verification actions
- **Frozen**: Audit log model, write-only pattern

### 7.6 Incident Response

- **Module**: IncidentResponseModule
- **Coverage**: Security incident tracking, resolution workflows
- **Frozen**: Incident model, response workflow

### 7.7 Secrets Management

- **Environment**: .env files with Joi validation schema
- **Secrets validated at startup**: JWT_SECRET (64 char), JWT_REFRESH_SECRET (64 char), AWS credentials, Razorpay keys, Sentry DSN
- **Production guard**: API refuses to start with placeholder/invalid credentials
- **API Key Vault**: Encrypted AI provider key storage in AiGatewayModule
- **Frozen**: Secret validation logic, key vault encryption

### 7.8 Encryption

- **TLS**: Terminated at nginx/ingress level (infrastructure)
- **At rest**: PostgreSQL encryption (infrastructure)
- **In-transit**: HTTPS enforced
- **CSRF**: @fastify/csrf-protection registered, bypassed for JWT-authenticated requests and webhook routes
- **Frozen**: CSRF protection pattern

### 7.9 Monitoring — Security

- **Sentry**: Error tracking, configurable via SENTRY_DSN
- **Prometheus**: API metrics at /api/v1/metrics
- **Pino**: Structured JSON logging with automatic redaction (passwords, tokens, OTPs, secrets)
- **Frozen**: Logging interceptor format, metrics format, Sentry integration pattern

### 7.10 Security Headers

- **Helmet**: CSP, HSTS (1 year, preload), frameguard (deny), referrerPolicy (strict-origin-when-cross-origin), noSniff, xssFilter
- **CSP**: default-src 'self', script-src with 'unsafe-inline', CloudFront CDN; 'unsafe-eval' added in dev only
- **Frozen**: Helmet configuration, CSP policy

### 7.11 Frozen Security Components

| Component | Status | Reason |
|-----------|--------|--------|
| JWT authentication flow | **FROZEN** | Core identity, change breaks all auth |
| JwtAuthGuard | **FROZEN** | Used by 396 references, canonical auth guard |
| RolesGuard + @Roles | **FROZEN** | Used by 291 references, canonical RBAC |
| @Public() decorator | **FROZEN** | 100 endpoints depend on this contract |
| ValidationPipe config | **FROZEN** | All 196 DTOs depend on whitelist/transform |
| Rate limiting tiers | **FROZEN** | 41 @Throttle endpoints depend on these limits |
| Helmet CSP policy | **FROZEN** | Browser security model for entire platform |
| CSRF protection pattern | **FROZEN** | Bypass logic tied to JWT/webhook patterns |
| Secret validation at startup | **FROZEN** | Production guard against misconfiguration |
| Pino log redaction paths | **FROZEN** | Prevents credential leakage |
| Audit log model | **FROZEN** | Compliance requires consistent audit schema |

---

## 8. Infrastructure Freeze

### 8.1 Docker

- **API Dockerfile**: Multi-stage build (node:20-alpine), non-root user, healthcheck
- **Web Dockerfile**: Multi-stage build, standalone Next.js output, healthcheck
- **Docker Compose (dev)**: 7 services — postgres, redis, api, web, opensearch, clickhouse, opensearch-dashboards
- **Docker Compose (prod)**: 8 services — postgres, redis, api, web, nginx, prometheus, postgres-exporter, grafana
- **Frozen**: Dockerfile patterns, docker-compose service definitions

### 8.2 Kubernetes

- **Namespace**: tradingo
- **Manifests**: 14 files — api/web deployments, HPA (api/hpa.yaml, web/hpa.yaml), services, ingress, PDB, ConfigMap, Secrets template, postgres StatefulSet, redis deployment, kustomization
- **HPA**: CPU-based auto-scaling for api and web
- **PDB**: Min available constraints for api and web
- **Frozen**: K8s manifest structure, ingress configuration, HPA/PDB config

### 8.3 Redis

- **Version**: 7.x
- **Usage**: Caching, BullMQ queue backend, Socket.io pub/sub, OTP storage, session management, AI circuit breaker state
- **Module**: RedisModule (common/services)
- **Service**: RedisService — get/set/del/incr/expire wrappers
- **Frozen**: Redis service abstraction, key naming patterns

### 8.4 PostgreSQL

- **Version**: 16
- **ORM**: Prisma (266 models)
- **Connection**: PrismaModule with connection pooling via PrismaService
- **Frozen**: Prisma schema, PrismaService initialization

### 8.5 ClickHouse

- **Version**: 24.12
- **Usage**: Analytics event storage, time-series queries
- **Service**: ClickHouseService (AnalyticsModule)
- **Dependency**: Optional — API starts without ClickHouse if not configured
- **Frozen**: ClickHouse connection pattern, query abstraction

### 8.6 OpenSearch

- **Version**: 2.17
- **Indices**: Marketplace search indices + 4 enterprise indices (enterprise_brands, enterprise_attributes, enterprise_synonyms, enterprise_mappings)
- **Analyzer**: tradingo_analyzer with edge_ngram/autocomplete
- **Service**: SearchService + EnterpriseSearchService
- **Frozen**: Index mapping patterns, analyzer configuration, search abstraction

### 8.7 Monitoring

- **Prometheus**: Scrapes API at /api/v1/metrics, custom dashboard configuration
- **Grafana**: 2 dashboards (api, business), provisioning via YAML, datasource prometheus.yml
- **Postgres Exporter**: Database metrics
- **Alert Rules**: prometheus/alert-rules.yml
- **Recording Rules**: prometheus/recording-rules.yml
- **AlertManager**: alertmanager.yml
- **Frozen**: Dashboard definitions, alert rules, metric naming

### 8.8 CI/CD

- **GitHub Actions**: 5 workflow files — ci.yml, deploy-production.yml, deploy-staging.yml, deploy.yml, playwright.yml
- **Frozen**: Workflow structure, deployment stages, test gates

### 8.9 Logging

- **Driver**: Pino (structured JSON logging)
- **Transport**: pino-pretty (dev), raw JSON (prod)
- **Redaction**: Automatic redaction of 11 sensitive fields (passwords, tokens, OTPs, secrets)
- **Format**: `{ level, time, reqId, correlationId, msg, ... }`
- **Frozen**: Log format, redaction rules, correlation ID pattern

### 8.10 Backup

- **Location**: ops/backup/
- **Frozen**: Backup strategy (infrastructure-dependent)

### 8.11 Disaster Recovery

- **Location**: ops/recovery/
- **Frozen**: Recovery procedures (infrastructure-dependent)

---

## 9. Extension Rules

### 9.1 What Developers MAY Extend

1. **Add new controller endpoints** to existing modules following the existing module's patterns
2. **Add new DTOs** using class-validator decorators consistent with existing DTOs
3. **Add new service methods** to existing services
4. **Add new Prisma fields** to existing models (nullable or with defaults)
5. **Add new AI actions** to the action registry (AiActionRegistry)
6. **Add new BullMQ processors** to JobsModule for new background tasks
7. **Add new notification templates** to NotificationService
8. **Add new tracking event types** to the TrackingModule
9. **Add new mission/badge/achievement types** to GocashEcosystemModule
10. **Add new agent capabilities** to existing registered agents
11. **Add new provider adapters** to AiGatewayModule
12. **Add new features** to existing frontend pages using existing API patterns

### 9.2 What Developers MUST NOT Duplicate

1. **Authentication** — Must use AuthModule + JwtAuthGuard. Never implement custom auth.
2. **Authorization** — Must use @Roles() + RolesGuard. Never implement custom RBAC.
3. **Validation** — Must use class-validator DTOs with global ValidationPipe. Never inline validate.
4. **Pagination** — Must use shared PaginatedResponse format. Never implement custom pagination.
5. **AI processing** — Must use AiGatewayService.process(). Never call AI providers directly.
6. **Event emission** — Must use EventEmitter2 for domain events. Never implement custom event buses.
7. **Background jobs** — Must use existing BullMQ queues. Never create separate job systems.
8. **File storage** — Must use StorageService (S3 abstraction). Never implement custom file storage.
9. **Notifications** — Must use NotificationService. Never implement custom notification delivery.
10. **SMS** — Must use SmsService. Never implement custom SMS delivery.
11. **Logging** — Must use the shared logger (common/logger.ts). Never use console.log in production paths.
12. **Agent registration** — Must use AgentRegistryService. Never implement custom agent discovery.

### 9.3 What Developers MUST Reuse

1. **RedisService** — for all Redis operations
2. **PrismaService** — for all database operations
3. **TransformInterceptor** — response envelope format
4. **LoggingInterceptor** — request logging
5. **MetricsInterceptor** — Prometheus metrics
6. **AllExceptionsFilter** — error handling
7. **ValidationPipe** — DTO validation
8. **CompanyOwnerGuard** — company-scoped access control
9. **OpenSearch indices** — must follow existing mapping patterns
10. **Frontend components** — VerifiedBadge, SellerBadge, FollowButton, etc.

---

## 10. Frozen Components

| Component | Status | Reason |
|-----------|--------|--------|
| **Authentication (AuthModule)** | FROZEN | Core identity — JWT strategy, refresh flow, OTP verification. Breaking change breaks every authenticated request. |
| **GOCASH Ledger (GocashModule)** | FROZEN | Append-only financial ledger — credit/debit/reverse with idempotency. Change breaks balance integrity across all 68+ integration points. |
| **TradTrust Engine (TradTrustModule)** | FROZEN | 6-dimension trust scoring — weight configuration, recalculation algorithm, score history. Change breaks all marketplace trust surfaces. |
| **AI Gateway (AiGatewayModule)** | FROZEN | Provider abstraction, routing, credit enforcement. 126 actions depend on this contract. Direct provider calls bypass credits. |
| **Enterprise Search Indices** | FROZEN | 4 OpenSearch indices with analyzer configuration. Change breaks all enterprise search functionality. |
| **Notification Engine (NotificationModule)** | FROZEN | Template system, multi-channel delivery, preference model. All 68+ templates depend on this. |
| **Tracking Pipeline (TrackingModule)** | FROZEN | Event pipeline with 3 providers, frontend tracking hook. Growth Intelligence and Analytics depend on this. |
| **Global ValidationPipe** | FROZEN | whitelist=true, transform=true, forbidNonWhitelisted=true. All 196 DTOs depend on this configuration. |
| **JwtAuthGuard + RolesGuard** | FROZEN | Canonical auth + RBAC guards. 396 + 291 references respectively. |
| **Rate Limiting (ThrottlerGuard)** | FROZEN | 100 req/min global, auth-specific tiers. 41 @Throttle decorators depend on these limits. |
| **Helmet Security Headers** | FROZEN | CSP, HSTS, frameguard, referrerPolicy. Browser security model for the entire platform. |
| **BullMQ Queue Configuration** | FROZEN | 64+ queue definitions, 3 AI priority queues. Change breaks all background processing. |
| **EventEmitter2 Configuration** | FROZEN | In-process domain event bus. Product lifecycle and ecosystem events depend on this. |
| **Prisma Schema (266 models)** | FROZEN | All existing models, relations, indexes, enums. New fields may be added to existing models; models may not be removed. |
| **Master Catalog (GlobalBrand, GlobalAttribute, CatalogSynonym, IndustryCategoryMapping)** | FROZEN | Core catalog entity models for Enterprise Catalog. Immutable once populated. |
| **Frontend Tracking Hook (useTracking)** | FROZEN | Event naming convention, payload format, auto session/UTM capture. Change breaks Growth Intelligence funnel. |

---

## 11. Phase 2 Development Rules

### 11.1 Mandatory Engineering Rules

| # | Rule | Enforcement |
|---|------|------------|
| 1 | **Audit First** | Before any implementation, audit the codebase for existing capabilities. Read the relevant module, service, controller, DTO, and frontend files. |
| 2 | **Reuse Before Create** | If a capability exists, extend it. Do not create a new module, service, or component when an existing one can handle the requirement. |
| 3 | **Never Duplicate** | Zero tolerance for code duplication. Every shared pattern must be abstracted into a reusable utility or component. |
| 4 | **One Source of Truth** | Every domain concept has exactly one canonical module, service, and database owner (Section 3). All other modules read from the canonical source. |
| 5 | **Architecture Before Coding** | Every sprint must pass the Architecture Approval Checklist (Section 12) before implementation begins. |
| 6 | **Testing Required** | Every new endpoint must have at minimum a controller spec. Every new service method must have a unit test. |
| 7 | **Security Review Required** | Every new endpoint must be reviewed for: JwtAuthGuard, RolesGuard, @Throttle, input validation, output sanitization. |
| 8 | **Performance Review Required** | Every new query must be reviewed for: N+1, missing indexes, pagination, select projection. |
| 9 | **Documentation Required** | Every new feature must update the relevant architecture document. Every new endpoint is auto-documented via Swagger decorators. |
| 10 | **Backward Compatibility Required** | Every change must be backward compatible. Existing API contracts, database schemas, and frontend-consumed response formats must not break. Existing business workflows must not change. |
| 11 | **No Placeholder Code** | Zero TODOs, zero console.log, zero mock data in production paths. Every integration must call the real API. |
| 12 | **No Module Creation Without Approval** | New modules may only be created with explicit Chief Architect approval. All new functionality must first be proven impossible within existing modules. |
| 13 | **Frozen Components Are Inviolable** | No modifications to any component listed in Section 10. Feature requests involving frozen components must be redirected to extend non-frozen surfaces. |
| 14 | **Verify Before Declaring Done** | Every phase must pass: prisma validate, prisma generate, tsc api (0 errors), tsc web (0 errors), next build (no errors). |

### 11.2 Code Review Checklist

```
[ ] Audit completed — existing capabilities identified
[ ] Reuse confirmed — no duplicate services created
[ ] DTO validation — class-validator decorators present
[ ] Auth guard — JwtAuthGuard applied (unless @Public())
[ ] RBAC — @Roles() + RolesGuard applied where needed
[ ] Rate limiting — @Throttle considered for sensitive endpoints
[ ] onDelete policy — explicit on every new Prisma relation
[ ] Indexes — composite indexes added for query patterns
[ ] Pagination — shared pagination format used
[ ] Error handling — toast notifications on frontend failures
[ ] Loading states — loading/empty/error states present
[ ] TypeScript — zero `any` in new code (existing any is grandfathered)
[ ] Frozen components — not modified
[ ] Backward compatible — existing workflows unchanged
```

---

## 12. Architecture Approval Checklist

Every future sprint must pass this checklist **before implementation begins**. The sprint lead must produce a document answering all items and submit for Chief Architect review.

### 12.1 Domain Identification

- [ ] Which existing module(s) does this sprint touch?
- [ ] What is the single source of truth for each domain concept involved?
- [ ] Which shared services will be needed (Redis, BullMQ, AI Gateway, Notification, etc.)?

### 12.2 Audit Verification

- [ ] All existing capabilities in the affected modules have been read and understood
- [ ] No existing capability can handle the sprint's requirements (proven by reference)
- [ ] Frozen components (Section 10) are not impacted
- [ ] No duplicate code path will be created

### 12.3 Architecture Impact

- [ ] No new modules required (or Chief Architect approved the new module)
- [ ] No changes to the event flow (Section 5)
- [ ] No changes to the AI flow (Section 6)
- [ ] No changes to the security model (Section 7)
- [ ] No changes to the infrastructure (Section 8)

### 12.4 Backward Compatibility

- [ ] All existing API contracts remain unchanged
- [ ] All existing database schemas remain compatible (new fields nullable/defaulted)
- [ ] All existing frontend routes remain functional
- [ ] All existing business workflows continue to work

### 12.5 Extension vs Creation

- [ ] New endpoints are added to existing controllers
- [ ] New service methods are added to existing services
- [ ] New DTOs follow existing class-validator patterns
- [ ] New fields follow existing Prisma patterns

### 12.6 Verification Plan

- [ ] prisma validate will pass
- [ ] prisma generate will pass
- [ ] tsc api will produce 0 errors
- [ ] tsc web will produce 0 errors
- [ ] next build will succeed with no errors
- [ ] eslint will produce 0 new errors

### 12.7 Approval

- [ ] Chief Architect approves the sprint architecture

---

**TRADINGO Architecture v1.0 Frozen.**
**Future development must extend this architecture and must not replace it.**
