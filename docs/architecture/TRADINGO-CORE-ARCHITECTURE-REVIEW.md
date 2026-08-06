# TRADINGO Core Architecture Review

> **Status**: Final Draft — Pending Founder Approval
> **Date**: 2026-07-03
> **Scope**: Complete backend (73 modules), Prisma schema (231 models), shared infrastructure, frontend architecture
> **Purpose**: Freeze TRADINGO Core architecture before any new module group (TradeServ) implementation begins

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Backend Module Catalog (73 Modules)](#3-backend-module-catalog-73-modules)
4. [Prisma Schema: 231 Models by Domain](#4-prisma-schema-231-models-by-domain)
5. [Auth & Security Infrastructure](#5-auth--security-infrastructure)
6. [Shared Services Layer](#6-shared-services-layer)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Dependency Graph & Module Layers](#8-dependency-graph--module-layers)
9. [Module Classification: Reusable vs Extendable vs Frozen](#9-module-classification-reusable-vs-extendable-vs-frozen)
10. [Critical Findings & Risks](#10-critical-findings--risks)
11. [Implementation Order for New Module Groups](#11-implementation-order-for-new-module-groups)
12. [TradeServ Integration Points](#12-tradeserv-integration-points)
13. [Approval Checklist](#13-approval-checklist)

---

## 1. Executive Summary

TRADINGO Core is a **product trading marketplace platform** built on NestJS + Fastify + Prisma. It consists of:

| Dimension | Count |
|-----------|-------|
| Backend modules | **73** |
| Prisma models | **231** |
| Prisma enums | **160** |
| Schema lines | **6,868** |
| Auth endpoints (AuthModule only) | **24** |
| BullMQ queues | **13** |
| Cron schedules | **17** |
| Background processors | **12** |
| Frontend pages/routes | **193** (Next.js build) |
| Frontend component directories | **28** |
| Frontend hooks | **48** |
| Frontend API function files | **57** |
| Payment gateways | **2** (Razorpay + Stripe) |
| Global modules (@Global) | **4** (Prisma, Redis, Notification, Sms) |
| Guards | **5** |
| Global interceptors | **3** |
| Design system UI primitives | **17** |

### Architecture Maturity

- **Production-certified**: GOCASH v1.0 (5 sub-modules, wallet, ledger, integration)
- **AI layer production-ready**: 6 AI domain modules (Search, Finance, Admin, CRM, Negotiation, RFQ, Quote) + AI Gateway with 5 providers, fallback chain, credit system
- **Full audit completed**: 170 models audited in Production Audit, 77 issues found, all fixed
- **Go-Live**: APPROVED (Phase 14D.1 — 3 blockers remediated)

### Key Architectural Decisions

1. **Monorepo** — Single NestJS API (`apps/api`) + Next.js web (`apps/web`)
2. **Prisma ORM** — No raw SQL except ClickHouse for analytics
3. **No middleware.ts** — All frontend route protection is client-side
4. **Dual auth systems** — Context-based (provider tree) + Zustand-based (store) coexist
5. **BullMQ for async jobs** — 13 queues, 17 cron schedules, exponential backoff
6. **ClickHouse for analytics** — Separate OLAP database from PostgreSQL OLTP
7. **Dual payment gateways** — Razorpay (primary India) + Stripe (primary global)
8. **@Global() modules** — Prisma, Redis, Notification, SMS (injected anywhere)
9. **Circular dependency handled via forwardRef** — Membership ↔ Billing
10. **No event bus** — Notification module handles domain events synchronously (no event-driven architecture like Kafka/RabbitMQ)

---

## 2. Architecture Overview

### 2.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TRADINGO CORE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                   CLIENT LAYER (Next.js 16)                   │     │
│  │  React 19 + Zustand + TanStack Query + Socket.IO + Axios    │     │
│  │  193 routes │ 28 component dirs │ 48 hooks │ 57 API files   │     │
│  └──────────────────┬──────────────────────────────────────────┘     │
│                     │ HTTP REST (JSON:API)                           │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │               API LAYER (NestJS + Fastify)                    │     │
│  │  73 Modules │ 5 Guards │ 3 Interceptors │ 1 Global Pipe     │     │
│  │  Helmet + CSRF + Compression + Sentry + Prometheus           │     │
│  └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┘     │
│     │      │      │      │      │      │      │      │               │
│     ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼               │
│  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐                    │
│  │PG│  │R │  │OS│  │CH│  │S3│  │BQ│  │Tw│  │Se│                    │
│  │  │  │e │  │  │  │i│  │  │  │M│  │il│  │nt│                    │
│  │  │  │d │  │  │  │k│  │  │  │Q│  │io│  │ry│                    │
│  │  │  │is│  │  │  │h│  │  │  │  │  │  │  │  │                    │
│  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘                    │
│ PostgreSQL Redis OS CH S3 BullMQ Twilio Sentry                     │
│ (Prisma)     Search (ClickHouse)         SES                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Service Layer Architecture

```
@Global() Modules (auto-injected everywhere)
├── PrismaModule → PrismaService
├── RedisModule → RedisService
├── NotificationModule → NotificationService, NotificationGateway
└── SmsModule → SmsService, SmsProviderFactory

Foundation Modules (no @Global, explicit import)
├── AuthModule → AuthService, JwtModule
├── UsersModule → UsersService
├── SearchModule → SearchService (OpenSearch)
├── StorageModule → StorageService (S3 + CloudFront)
└── AnalyticsModule → AnalyticsService, ClickhouseService, EventIngestionService

Domain Modules (product marketplace)
├── ProductsModule, ProductOnboardingModule, SellerProductModule
├── CategoriesModule, CategoryTemplatesModule
├── ProductAttributesModule, ProductClaimsModule
├── ProductLocationModule, CatalogImportModule
├── TradfindModule, NearMeModule
├── RfqModule, SmartRfqModule, TradmatchModule
├── QuoteModule, SmartNegotiationModule
├── SmartPoModule, SmartOrderModule, SmartShipmentModule, SmartDeliveryModule
├── OrderModule, PaymentModule, EscrowModule, SettlementModule
├── DisputeModule, ManualPaymentModule
├── ChatModule, CommunicationModule

AI Modules
├── AiModule (legacy — 3 services)
├── AiGatewayModule (new — 8 services, 5 providers)
├── AdminIntelligenceModule, FinanceModule (AiFinance)
├── CrmModule (AiCrm)
└── Embedded: AiSearch (Tradfind), AiRfq (SmartRfq), AiQuote (Quote), AiNegotiation

Financial Modules
├── GocashModule + WalletApiModule + GocashIntegrationModule
├── ReferralModule + CampaignModule + AdvertisingModule
└── GocashEcosystemModule

Company & Trust Modules
├── CompaniesModule, CompanyLocationsModule
├── CompanyVerificationModule + UserVerificationModule + ReputationModule
├── TradTrustModule
└── OrganizationsModule, VendorCodesModule

Intelligence Modules
├── LocationIntelligenceModule (global)
├── MarketplaceIntelligenceModule
├── FreightIntelligenceModule
├── MarketIntelligenceModule
└── TerritoryIntelligenceModule

Membership Modules
├── MembershipModule ↔ BillingModule (circular via forwardRef)
└── PlansModule

Support Modules
├── SellerModule, BuyerModule, SellerAnalyticsModule
├── ProfileCompletionModule, OnboardingModule
├── TradgoModule, GalleryModule, CertificationsModule
├── MalwareModule, BetaProgramModule, LaunchModule
├── JobsModule (12 queues, 17 cron schedules)
└── HealthModule (liveness + readiness probes)
```

---

## 3. Backend Module Catalog (73 Modules)

### 3.1 Global Modules (4)

| Module | Service(s) | Purpose |
|--------|-----------|---------|
| `PrismaModule` | `PrismaService` | Database ORM singleton |
| `RedisModule` | `RedisService` | Cache, rate limiting, Socket.IO adapter |
| `NotificationModule` | `NotificationService`, `NotificationGateway`, `NotificationTemplateService`, `NotificationAnalyticsService` | In-app/email/SMS/push notifications |
| `SmsModule` | `SmsService`, `SmsProviderFactory` | SMS delivery (Twilio/Console) |

### 3.2 Foundation Modules (6)

| Module | Service(s) | Controllers | Auth Required |
|--------|-----------|-------------|---------------|
| `AuthModule` | `AuthService` | 1 (24 endpoints) | Mixed |
| `UsersModule` | `UsersService` | 1 | JWT |
| `SearchModule` | `SearchService` | 0 | Internal |
| `StorageModule` | `StorageService` | 1 | JWT |
| `AnalyticsModule` | `AnalyticsService`, `ClickhouseService`, `EventIngestionService` | 1 | JWT |
| `HealthModule` | — | 1 (3 endpoints) | Public |

### 3.3 Company & Trust Modules (8)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `OrganizationsModule` | `OrganizationsService` | 1 |
| `CompaniesModule` | `CompaniesService` | 1 |
| `CompanyLocationsModule` | `CompanyLocationsService` | 1 |
| `CompanyVerificationModule` | `CompanyVerificationService` | 1 |
| `UserVerificationModule` | `UserVerificationService` | 1 |
| `ReputationModule` | `ReputationService` | 1 |
| `TradTrustModule` | `TradTrustService`, `TradTrustWeightsService` | 1 |
| `VendorCodesModule` | `VendorCodesService` | 1 |

### 3.4 Catalog & Product Modules (10)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `CategoriesModule` | `CategoriesService` | 1 |
| `IndustriesModule` | `IndustriesService` | 1 |
| `ProductsModule` | `ProductsService`, `BestsellerService`, `BestsellerAnalyticsService`, `ProductAttributeDisplayService` | 1 |
| `ProductOnboardingModule` | `ProductOnboardingService` | 1 |
| `SellerProductModule` | `SellerProductService`, `ApprovalService` | 7 |
| `CategoryTemplatesModule` | `CategoryTemplatesService` | 2 |
| `ProductAttributesModule` | `ProductAttributesService` | 1 |
| `ProductLocationModule` | `ProductLocationService` | 2 |
| `ProductClaimsModule` | `ProductClaimsService` | 1 |
| `CatalogImportModule` | `CatalogImportService`, `CsvParserService`, `ImportOrchestratorService` | 1 |

### 3.5 Search & Discovery Modules (4)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `TradfindModule` | `TradfindService`, `AiSearchService` | 2 |
| `NearMeModule` | `NearMeService` | 1 |
| `TradmatchModule` | `TradmatchService` | 1 |
| `MarketplaceIntelligenceModule` | `MarketplaceIntelligenceService`, `MarketplaceIntelligenceEngine`, `BuyerHistoryService` | 1 |

### 3.6 RFQ → Negotiation → Order → Fulfillment Modules (10)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `RfqModule` | `RfqService`, `RfqNumberService`, `RfqAnalyticsService` | 1 |
| `SmartRfqModule` | `SmartRfqService`, `AiRfqService` | 1 |
| `QuoteModule` | `QuoteService`, `AiQuoteService` | 4 |
| `SmartNegotiationModule` | `SmartNegotiationService` | 2 |
| `SmartPoModule` | `SmartPoService` | 1 |
| `SmartOrderModule` | `SmartOrderService` | 1 |
| `SmartShipmentModule` | `SmartShipmentService` | 1 |
| `SmartDeliveryModule` | `SmartDeliveryService` | 1 |
| `OrderModule` | `OrderService`, `OrderAnalyticsService` | 1 |
| `EscrowModule` | `EscrowService`, `EscrowAnalyticsService` | 1 |

### 3.7 Payment & Finance Modules (7)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `PaymentModule` | `PaymentService`, `PaymentAnalyticsService`, `RazorpayService`, `StripeService` | 4 |
| `ManualPaymentModule` | `ManualPaymentService` | 2 |
| `SettlementModule` | `SettlementService`, `SettlementAnalyticsService` | 1 |
| `DisputeModule` | `DisputeService`, `DisputeAnalyticsService`, `AdminService`, `AdminAssignmentService` | 1 |
| `FinanceModule` | `CreditService`, `CreditNoteService`, `FinanceDashboardService` | 8 |
| `MembershipModule` | `MembershipService` | 2 |
| `BillingModule` | `InvoiceService`, `TaxService` | 2 |

### 3.8 GOCASH Ecosystem Modules (7)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `GocashModule` | `GocashService` | 1 |
| `GoCashModule` (legacy, separate) | `GoCashService`, `GoCashAnalyticsService` | 1 |
| `WalletApiModule` | `WalletApiService` | 1 |
| `GocashIntegrationModule` | `GocashIntegrationService` | 1 |
| `ReferralModule` | `ReferralService` | 1 |
| `CampaignModule` | `CampaignService` | 1 |
| `GocashEcosystemModule` | `GocashEcosystemService` | 2 |

### 3.9 AI Modules (7)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `AiModule` (legacy) | `AiProviderService`, `PromptService`, `CatalogQualityService` | 3 |
| `AiGatewayModule` | `AiGatewayService`, `ProviderRegistryService`, `PromptManagerService`, `AiCreditsService`, `UsageTrackerService`, `CostEngineService`, `ProviderHealthService`, `ModelRegistryService` | 2 |
| `AdminIntelligenceModule` | `AiAdminService` | 1 |
| `CrmModule` | `CrmService` | 10 |
| `FinanceModule` (AI) | `AiFinanceService` (inside FinanceModule) | 1 (AiFinance) |
| `AdvertisingModule` | `AdvertisingService` | 3 |

### 3.10 Intelligence Modules (5)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `LocationIntelligenceModule` | `LocationIntelligenceService`, `GeocodingService`, `GeoCacheService`, `UserPreferenceService` | 1 |
| `MarketplaceIntelligenceModule` | (see 3.5) | 1 |
| `FreightIntelligenceModule` | `FreightIntelligenceService` | 1 |
| `MarketIntelligenceModule` | `MarketIntelligenceService` | 1 |
| `TerritoryIntelligenceModule` | `TerritoryIntelligenceService` | 1 |

### 3.11 Support Modules (10)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `SellerModule` | `SellerService` | 1 |
| `SellerAnalyticsModule` | `SellerAnalyticsService` | 1 |
| `BuyerModule` | `BuyerService` | 6 |
| `ProfileCompletionModule` | `ProfileCompletionService` | 1 |
| `OnboardingModule` | `OnboardingService` | 1 |
| `TradgoModule` | `TradgoService` | 1 |
| `GalleryModule` | `GalleryService` | 1 |
| `CertificationsModule` | `CertificationsService` | 1 |
| `MalwareModule` | `MalwareProcessor`, `ClamAvService`, `FileScanService`, `MalwareEventService` | 0 |
| `BetaProgramModule` | `BetaProgramService` | 6 |
| `LaunchModule` | `LaunchService` | 3 |

### 3.12 Communication Modules (2)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `ChatModule` | `ChatService`, `ChatFilterService`, `ChatPresenceService`, `ChatAnalyticsService`, `ChatSearchService` | 1 |
| `CommunicationModule` | `ConversationService`, `MessageService` | 5 |

### 3.13 Infrastructure Modules (2)

| Module | Service(s) | Controllers |
|--------|-----------|-------------|
| `JobsModule` | — (registers 12 Bull queues) | 0 |
| `HealthModule` | — | 1 |

---

## 4. Prisma Schema: 231 Models by Domain

### 4.1 Model Distribution

| Domain | Models | Key Entities |
|--------|--------|--------------|
| **User & Auth** | 7 | `User`, `Session`, `UserVerification`, `UserVerificationDocument`, `UserPreference`, `BuyerHistory`, `ReputationEvent` |
| **Company & Org** | 8 | `Organization`, `Company`, `CompanyLocation`, `CompanyVerification`, `CompanyVerificationDocument`, `VendorCode`, `TradTrustScore`, `TradTrustHistory` |
| **Catalog & Products** | 23 | `Category`, `Industry`, `Product`, `ProductMedia`, `ProductAttribute`, `ProductAttributeValue`, `ProductVariant`, `ProductVariantValue`, `ProductPriceSlab`, `ProductMultiLangDescription`, `BestsellerSnapshot`, `ProductView`, `ProductClaim`, `CategoryTemplate`, `CategoryTemplateField`, `ProductLocation`, `Brand`, `MediaLibrary`, `BulkUploadJob`, `BulkUploadError`, `ImportLog`, `ApprovalQueue`, `ProductOnboardingDraft` |
| **RFQ → Negotiation** | 15 | `Rfq`, `RfqProduct`, `RfqRequirement`, `RfqTimeline`, `SmartRfq`, `RfqMatch`, `Quote`, `QuoteLineItem`, `QuoteTerm`, `SmartNegotiation`, `NegotiationMessage`, `NegotiationTerm`, `NegotiationTimeline`, `RfqNumberCounter`, `CreditPack` |
| **Order → Fulfillment** | 20 | `PurchaseOrder`, `SmartPO`, `PODocument`, `SmartOrder`, `OrderItem`, `OrderTimeline`, `SmartShipment`, `ShipmentItem`, `ShipmentDocument`, `SmartDelivery`, `DeliveryDocument`, `DeliveryConfirmation`, `DeliveryProof`, `DeliveryReview`, `Escrow`, `EscrowRelease`, `EscrowDispute`, `EscrowTimeline`, `Settlement`, `SettlementBatch` |
| **Payment & Billing** | 11 | `Payment`, `PaymentOrder`, `ManualPaymentProof`, `PaymentSubscription`, `ProcessedWebhookEvent`, `Invoice`, `InvoiceItem`, `Credit`, `CreditLine`, `CreditNote`, `DebitNote` |
| **Dispute** | 4 | `Dispute`, `DisputeEvidence`, `DisputeTimeline`, `DisputeProcessorExecution` |
| **Chat & Communication** | 5 | `Conversation`, `ConversationParticipant`, `Message`, `MessageReaction`, `MessageAttachment` |
| **Notification & SMS** | 4 | `Notification`, `NotificationDelivery`, `NotificationPreference`, `NotificationTemplate`, `SmsLog` |
| **Membership & Plans** | 8 | `Plan`, `PlanFeature`, `PlanHistory`, `PlanDiscount`, `Subscription`, `SubscriptionItem`, `SubscriptionUsage`, `Coupon` |
| **GOCASH Ecosystem** | 17 | `GOCASH_Wallet`, `GOCASH_Transaction`, `GOCASH_Redemption`, `ReferralCode`, `ReferralUsage`, `ReferralReward`, `ReferralAudit`, `ReferralRule`, `ReferralBlacklist`, `Campaign`, `CampaignRule`, `CampaignTarget`, `CampaignClaim`, `CampaignAnalytics`, `Advertisement`, `AdTarget`, `AdAnalytics` |
| **AI** | 3 | `AiProvider`, `AiPrompt`, `AiCache`, `AiCreditUsage` |
| **Intelligence** | 5 | `Territory`, `GeoCluster`, `MarketDataPoint`, `FreightRoute`, `FreightRate` |
| **Support** | 10 | `Certification`, `CertificationDocument`, `MalwareScan`, `FileScan`, `Gallery`, `GalleryItem`, `BetaProgram`, `BetaFeedback`, `UserFeedback`, `FeatureRequest` |
| **CRM & Finance** | 12 | `Lead`, `LeadActivity`, `LeadNote`, `LeadTimeline`, `Pipeline`, `PipelineStage`, `Task`, `TaskAssignment`, `Collection`, `CollectionAction`, `CommunicationLog`, `OnboardingTask` |
| **System** | 5 | `AuditLog`, `AuditLogChange`, `SystemConfig`, `SystemHealth`, `CronJobLog` |

### 4.2 Enum Distribution (160 total)

| Category | Count | Key Enums |
|----------|-------|-----------|
| **Generic** | 10 | `Role`, `VerificationLevel`, `VerificationStatus`, `Currency`, `Language`, `CountryCode`, `TimeZone`, `UnitOfMeasure`, `WeightUnit`, `DimensionUnit` |
| **Products** | 12 | `ProductStatus`, `ProductVisibility`, `ProductCondition`, `ProductCertification`, `ApprovalStatus`, `BulkUploadStatus`, `ImportStatus`, `AttributeType`, `ClaimStatus`, `ListingType`, `ReturnPolicy`, `WarrantyType` |
| **RFQ** | 8 | `RfqStatus`, `RfqUrgency`, `RfqVisibility`, `QuoteStatus`, `NegotiationStatus`, `NegotiationType`, `NegotiationStrategy`, `MatchStatus` |
| **Order** | 15 | `OrderStatus`, `PoStatus`, `ShipmentStatus`, `DeliveryStatus`, `FulfillmentStatus`, `PaymentTerm`, `Incoterm`, `ShippingMethod`, `ShipmentType`, `DeliveryWindow`, `DeliveryConfirmationMethod`, `ProofType`, `ReviewRating`, `EscrowStatus`, `EscrowReleaseCondition` |
| **Payment** | 12 | `PaymentStatus`, `PaymentMethod`, `PaymentMode`, `PaymentGateway`, `SettlementStatus`, `SettlementMethod`, `DisputeStatus`, `DisputeType`, `DisputeSeverity`, `DisputeResolution`, `CreditStatus`, `CreditType` |
| **AI** | 10 | `AiProvider`, `AiModel`, `TaskType` (16 types), `AiCapability` (6 types), `PromptType`, `PromptCategory`, `PromptStatus`, `CacheStatus`, `CreditPeriod` |
| **GOCASH** | 12 | `GOCASHTransactionType` (16 types), `GOCASHLedgerDirection`, `GOCASHLedgerStatus`, `GOCASH_RedemptionType`, `GOCASH_RedemptionStatus`, `AdType` (9), `AdStatus` (8), `AdPricingModel`, `AdTargetType` (7), `CampaignType` (13), `CampaignTargetType` (11), `CampaignClaimStatus` (5) |
| **Referral** | 5 | `ReferralCodeStatus`, `ReferralRewardStatus`, `ReferralRuleType`, `FraudType` (4), `FraudSeverity` |
| **Intelligence** | 10 | `LocationSource`, `LocationConfidence`, `GeoClusterType`, `LocationType`, `TerritoryType`, `MarketSegment`, `FreightMode`, `FreightType`, `MarketTrend`, `IntelligenceType` |
| **Notification** | 5 | `NotificationType`, `NotificationChannel`, `NotificationPriority`, `DeliveryStatus`, `TemplateChannel` |
| **Support** | 8 | `BetaStatus`, `BetaFeedbackType`, `FeedbackType`, `FeatureRequestStatus`, `CertificationStatus`, `MalwareStatus`, `ScanStatus`, `FileType` |
| **System** | 8 | `AuditAction` (20+), `AuditEntityType`, `JobStatus`, `SystemHealthStatus`, `ConfigType`, `LogLevel`, `EventType`, `CronJobStatus` |
| **Communication** | 6 | `ConversationType`, `ConversationStatus`, `MessageType`, `MessageStatus`, `ChannelType`, `CommunicationType` |
| **CRM** | 8 | `LeadStatus`, `LeadSource`, `LeadPriority`, `PipelineStage`, `TaskStatus`, `TaskPriority`, `CollectionStatus`, `CollectionMethod` |

---

## 5. Auth & Security Infrastructure

### 5.1 Auth Strategy

| Component | Implementation |
|-----------|---------------|
| **Strategy** | JWT access + refresh token |
| **Access token** | 15-min expiry, stored in localStorage + cookie |
| **Refresh token** | 7-day expiry, rotated on each use |
| **Password** | bcrypt, salt rounds 12 |
| **OTP** | 6-digit, stored in Redis with 10-min TTL |
| **OAuth** | Google OAuth via Passport |

### 5.2 Auth Endpoints (24 total)

| Category | Endpoints |
|----------|-----------|
| **Registration** | `POST /auth/register` (buyer/seller) |
| **Login** | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| **OTP** | `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/login-with-otp` |
| **OAuth** | `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/oauth/callback`, `POST /auth/social-login` |
| **Password** | `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password` |
| **Verification** | `POST /auth/verify-email`, `POST /auth/verify-mobile` |
| **Profile** | `GET /auth/me`, `PATCH /auth/me`, `PATCH /auth/me/settings` |
| **Sessions** | `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `DELETE /auth/sessions` |
| **2FA** | `POST /auth/2fa/enable`, `POST /auth/2fa/disable`, `POST /auth/2fa/verify` |

### 5.3 Guards & Decorators

| Guard | Decorator | Purpose |
|-------|-----------|---------|
| `JwtAuthGuard` | `@Public()` | JWT verification with public bypass |
| `RolesGuard` | `@Roles(...roles)` | Role-based access (ADMIN, SELLER, BUYER) |
| `PermissionsGuard` | `@Permissions(...perms)` | Permission-based access |
| `CompanyOwnerGuard` | — | Company ownership verification |
| `ThrottlerGuard` | — | Rate limiting (100 req/60s global) |

### 5.4 Global Infrastructure

| Layer | Implementation |
|-------|---------------|
| **Interceptors** | `TransformInterceptor` (response envelope), `SentryInterceptor` (error capture), `LoggingInterceptor` (request logging) |
| **Exception Filter** | `AllExceptionsFilter` — standard error format |
| **Validation Pipe** | Global `ValidationPipe` with whitelist + transform |
| **Security** | Helmet (CSP), CSRF protection, Compression |
| **Monitoring** | Prometheus on port 9100, Sentry error tracking, Health checks at `/live`, `/ready`, `/health` |

---

## 6. Shared Services Layer

### 6.1 Queue System (BullMQ)

| Queue | Processor | Cron Schedule | Purpose |
|-------|-----------|---------------|---------|
| `MALWARE` | `MalwareProcessor` | — | Anti-virus file scanning |
| `EMAIL` | `EmailProcessor` | — | SES email delivery (3 templates) |
| `EXPORT` | `ExportProcessor` | — | CSV/PDF generation |
| `NOTIFICATION` | `NotificationProcessor` | — | Multi-channel notifications |
| `CERTIFICATION` | `CertificationProcessor` | Daily 2AM | Certification expiry |
| `SUBSCRIPTION` | `SubscriptionProcessor` | Daily 3-5AM | Renewal, grace, expiry |
| `RFQ` | `RfqProcessor` | Daily 1AM + Monthly | RFQ/quote/credit pack expiry |
| `ESCROW` | `EscrowProcessor` | Hourly | Auto-release + expiry monitoring |
| `SETTLEMENT` | `SettlementProcessor` | Every 30min + Hourly | Batch processing + retry |
| `DISPUTE` | `DisputeProcessor` | Daily 7-11AM | Expiry/evidence/arbitration |
| `ANALYTICS` | `AnalyticsProcessor` | — | ClickHouse batch flush |
| `BESTSELLER` | `BestsellerProcessor` | Weekly Sunday | Bestseller calculation |
| `AI` | `AiProcessor` | — | Bulk AI processing |

### 6.2 Notification System

| Channel | Provider | Template Source | Delivery |
|---------|----------|-----------------|----------|
| In-app | Socket.IO (`/chat` namespace) | DB + 60+ fallback | Real-time via NotificationGateway |
| Email | AWS SES | HTML templates (welcome, verification, password-reset, notification) | BullMQ EMAIL queue |
| SMS | Twilio (prod) / Console (dev) | 12 SMS templates | `SmsService.send()` directly |

### 6.3 External Integrations

| Service | Provider | Module | Access Pattern |
|---------|----------|--------|---------------|
| **Database** | PostgreSQL via Prisma | `PrismaModule` (global) | Direct injection |
| **Cache** | Redis via ioredis | `RedisModule` (global) | Direct injection |
| **Search** | OpenSearch | `SearchModule` | Module import |
| **Analytics** | ClickHouse | `AnalyticsModule` | Module import |
| **Storage** | AWS S3 + CloudFront CDN | `StorageModule` | Module import |
| **Email** | AWS SES | `JobsModule` (EmailProcessor) | BullMQ queue |
| **SMS** | Twilio | `SmsModule` (global) | Direct injection |
| **Payments** | Razorpay + Stripe | `PaymentModule` | Gateway factory pattern |
| **Maps** | Leaflet (frontend), Nominatim (backend) | Frontend + `LocationIntelligenceModule` | Direct API calls |
| **Error tracking** | Sentry | `main.ts` + `SentryInterceptor` | Global |

### 6.4 AI Gateway (5 Providers, 14 Models)

| Provider | Models | Capabilities | Credit Cost |
|----------|--------|-------------|-------------|
| OpenRouter | gpt-4o-mini, gpt-4o, claude-3-haiku, claude-3-sonnet | Vision, streaming | Varies |
| Gemini | gemini-2.0-flash, gemini-2.0-pro | Vision, streaming | Low |
| Groq | mixtral-8x7b, llama-3.1-70b, llama-3.1-8b | Streaming (SSE) | Low |
| Tavily | tavily-search | Search | 1 |
| Firecrawl | firecrawl-scrape | Web scraping | 2 |

---

## 7. Frontend Architecture

### 7.1 Route Structure (193 routes)

```
app/
├── (auth)/                   # 7 routes — login, register, forgot/reset password, verify email/mobile, onboarding
├── (dashboard)/              # 1 route — placeholder
├── buyer/                    # 30 routes — dashboard, ecosystem, gocash, campaigns, rfq, quote, negotiation,
│                             #   order, po, shipment, delivery, payments, chat, inbox, notifications,
│                             #   settings, support, saved-products, downloads, near-me, suppliers, analytics
├── seller/                   # 37 routes — dashboard, ecosystem, gocash, products, campaigns, advertising,
│                             #   ai-workspace, rfq, quote, negotiation, order, po, shipment, delivery,
│                             #   payments, chat, inbox, profile, settings, brands, media, export, reviews,
│                             #   buyers, crm, tradgo, analytics
├── admin/                    # 50 routes — dashboard, ecosystem, wallets, advertising, campaigns,
│                             #   ai-credits, ai-console, ai-infrastructure, users, companies,
│                             #   verification, kyc, products, categories, orders, po, rfq, quote,
│                             #   negotiation, payments, plans, disputes, fraud, analytics, audit-logs,
│                             #   sms, feedback, crm, geo-intelligence, territory, market, freight,
│                             #   marketplace-rankings, system-health, beta, launch, catalog, delivery, settings
├── search/                   # 1 route — product search results
├── products/                 # 1 route — product detail
├── companies/                # 1 route — company profile
├── compare/                  # 1 route — product comparison
├── categories/               # 1 route — category listing
├── city/                     # 1 route — city-specific
├── tradeserv/                # 1 route — TradeServ landing page
└── public/                   # ~20 routes — about, features, plans, contact, etc.
```

### 7.2 Shared Component Architecture

```
components/
├── ui/                  # 17 primitives — Button, Badge, Card, Input, Skeleton, Pagination, Toast, etc.
├── shared/              # 32 components — Navbar, Footer, ThemeToggle, VerifiedBadge, UploadZone, etc.
├── dashboard/           # 9 components — Sidebar, Topbar, StatCard, StatusBadge, Breadcrumbs, Skeleton
├── auth/                # 5 components — AuthProvider, RouteGuard, RoleGuard, SessionTimeoutProvider
├── providers/           # 6 providers — Theme, Query, Auth, Socket, Notification, Chat, Typing
├── ecosystem/           # 19 components — XPProgressBar, LevelCard, BadgeCard, MissionCard, etc.
├── product/             # 15 components — ProductCard, ImageGallery, Reviews, QA, CompareBar
├── wallet/              # 3 components — TransactionFilters, Timeline, AnalyticsBar
├── notifications/       # 4 components — Drawer, RealtimeToast, Toast, UnreadBadge
├── ai/                  # 4 components — CopilotPanel, SuggestionCard, CatalogScoreCard, WizardCopilot
├── tradeserv/           # 11 components — GlassCard, SearchSkeleton, StarRating, etc.
└── [+ 16 more domain dirs]
```

### 7.3 State Management

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Server state** | TanStack Query v5 | All API data (staleTime: 30s) |
| **Client state** | Zustand v5 | Auth (parallel), checkout, compare, RFQ wizard, wishlist |
| **Realtime** | Socket.IO | Notifications, chat, typing, presence |
| **UI state** | React Context | Theme, toast, session timeout |

### 7.4 Dual Auth System (Notable Issue)

| Aspect | System A (Primary) | System B (Parallel) |
|--------|-------------------|-------------------|
| **File** | `components/auth/auth-provider.tsx` | `hooks/use-auth.ts` + `store/auth-store.ts` |
| **Mechanism** | React Context | Zustand store |
| **Endpoint** | `GET /auth/me` | `GET /users/me` |
| **API client** | `lib/api/client.ts` (axios) | `lib/api-client.ts` (class-based) |
| **Used by** | Provider tree (94% of pages) | Select pages |

---

## 8. Dependency Graph & Module Layers

### 8.1 Module Dependency Layers

```
Layer 0 (Standalone — 31 modules)
  PrismaModule (global), RedisModule (global), UsersModule, SearchModule,
  StorageModule, OrganizationsModule, CategoriesModule, IndustriesModule,
  CompanyLocationsModule, ProductAttributesModule, CategoryTemplatesModule,
  ProductClaimsModule, ProductLocationModule, NearMeModule, GocashModule,
  SmartPoModule, SmartShipmentModule, SmartDeliveryModule,
  ManualPaymentModule, SellerModule, BuyerModule,
  ProfileCompletionModule, OnboardingModule, TradgoModule,
  GalleryModule, CertificationsModule, BetaProgramModule, LaunchModule,
  CommunicationModule, UserVerificationModule, ReputationModule

Layer 1 (Prisma + Bull only — 6 modules)
  VendorCodesModule, AiModule, FreightIntelligenceModule,
  MarketIntelligenceModule, TerritoryIntelligenceModule, AnalyticsModule

Layer 2 (1-2 non-global deps — 21 modules)
  AuthModule, CompaniesModule, ProductsModule, ProductOnboardingModule,
  SellerProductModule, CatalogImportModule, SmartRfqModule,
  TradmatchModule, QuoteModule, SmartOrderModule, OrderModule,
  EscrowModule, SettlementModule, DisputeModule, ChatModule,
  SellerAnalyticsModule, CompanyVerificationModule,
  WalletApiModule, GocashIntegrationModule, ReferralModule,
  CampaignModule, AiGatewayModule, FinanceModule,
  AdminIntelligenceModule, LocationIntelligenceModule (global),
  NotificationModule (global), SmsModule (global)

Layer 3 (3-5 deps — 8 modules)
  PaymentModule, MembershipModule / BillingModule (circular),
  AdvertisingModule, GocashEcosystemModule, TradTrustModule,
  SmartNegotiationModule, TradfindModule, MalwareModule, CrmModule

Layer 4 (8 deps — heaviest)
  MarketplaceIntelligenceModule

Layer 5 (73 deps — AppModule)
  AppModule imports all 73 modules
```

### 8.2 Key Dependency Sinks (Most Imported Modules)

| Module | Imported By | Count |
|--------|-------------|-------|
| **PrismaModule** (global) | All 73 modules (implicit) | 73 |
| **AnalyticsModule** | TradTrust, Order, Escrow, Settlement, Dispute, SellerAnalytics, Rfq, Payment, Malware, Chat, GoCash, Notification, MarketplaceIntelligence, Jobs | 14 |
| **AiGatewayModule** | Tradfind, SmartRfq, Quote, SmartNegotiation, Crm, Finance, AdminIntelligence, MarketplaceIntelligence | 8 |
| **GocashModule** | WalletApi, GocashIntegration, Referral, Campaign, Advertising, GocashEcosystem | 6 |
| **SearchModule** | Companies, Products, ProductOnboarding, SellerProduct, CatalogImport, Chat, Tradfind | 7 |
| **TradTrustModule** | Quote, Crm, SmartNegotiation, MarketplaceIntelligence | 4 |
| **NotificationModule** (global) | Dispute, GocashEcosystem | 2+ (implicit) |

### 8.3 Circular Dependencies

```
MembershipModule ←→ BillingModule  (via forwardRef)
PaymentModule → MembershipModule → BillingModule → MembershipModule (chain)
```

---

## 9. Module Classification: Reusable vs Extendable vs Frozen

### 9.1 FROZEN — Do NOT Modify (20 modules)

These modules are production-certified, fully audited, and must not be touched:

| Module | Reason |
|--------|--------|
| `PrismaModule` | Global — all data access depends on stability |
| `RedisModule` | Global — all caching/rate-limiting depends on it |
| `GocashModule` | GOCASH v1.0 CERTIFIED — append-only ledger |
| `WalletApiModule` | Financial operations layer — GOCASH production wrapper |
| `GocashIntegrationModule` | Reward processing — idempotency keys for all platforms |
| `ReferralModule` | Fraud detection + reward processing |
| `CampaignModule` | Budget engine + claim system |
| `GocashEcosystemModule` | XP/badges/missions/checkin/streaks |
| `GoCashModule` (legacy) | Existing analytics — leave for backward compat |
| `AuthModule` | 24 endpoints — security-critical |
| `HealthModule` | Liveness/readiness probes |
| `SmsModule` | Global — OTP delivery |
| `JobsModule` | Queue registry — infrastructure |
| `MalwareModule` | Security scanning |
| `TradTrustModule` | Scoring engine — 6 dimensions |
| `CompanyVerificationModule` | KYC workflow |
| `UserVerificationModule` | Buyer verification workflow |
| `ReputationModule` | Append-only event log |
| `PaymentModule` | 2 gateways — financial transactions |
| `NotificationModule` | Global — all notification delivery |

### 9.2 EXTENDABLE — Add Features, Don't Refactor (25 modules)

These modules can have new endpoints/services added but existing contracts must not break:

| Module | Extension Points |
|--------|-----------------|
| `ProductsModule` | New product types, fields |
| `SellerProductModule` | New bulk ops, approval flows |
| `ProductOnboardingModule` | New wizard steps |
| `RfqModule` | New RFQ types |
| `SmartRfqModule` | AI features (existing pattern) |
| `QuoteModule` | Quote AI (existing pattern) |
| `SmartNegotiationModule` | Negotiation AI (existing pattern) |
| `OrderModule` | New order statuses |
| `SmartPO/SmartOrder/SmartShipment/SmartDelivery` | Fulfillment features |
| `EscrowModule` | New release conditions |
| `SettlementModule` | New settlement methods |
| `DisputeModule` | Dispute workflows |
| `FinanceModule` | Credit/finance features |
| `CrmModule` | CRM workflows |
| `CommunicationModule` | Communication channels |
| `ChatModule` | Chat features |
| `SearchModule` | Search indexing strategies |
| `AnalyticsModule` | New analytics dashboards |
| `MembershipModule` | Plan features, tiers |
| `BillingModule` | Invoicing |
| `AdvertisingModule` | Ad types, placements |
| `AiGatewayModule` | New providers, models |
| `LocationIntelligenceModule` | Geocoding sources |
| `MarketplaceIntelligenceModule` | Ranking algorithms |
| `TradfindModule` | Search features |

### 9.3 REUSABLE AS-IS — Import Without Modification (28 modules)

These modules provide services that other module groups can import directly:

| Module | Reusable Service(s) |
|--------|-------------------|
| `AuthService` | Authentication, token management |
| `UsersService` | User CRUD |
| `CompaniesService` | Company resolution |
| `CategoriesService` | Category tree |
| `StorageService` | File upload to S3 |
| `SearchService` | OpenSearch indexing/search |
| `ClickhouseService` | Analytics events |
| `NotificationService` | Multi-channel notifications |
| `SmsService` | SMS delivery |
| `RedisService` | Caching, rate limiting |
| `PrismaService` | Database access |
| `AiGatewayService` | AI processing |
| `AiCreditsService` | Credit balance/check |
| `GocashService` | Wallet/ledger operations |
| `GeocodingService` | Address geocoding |
| `TradTrustService` | Trust scores |
| `EventIngestionService` | Analytics event tracking |
| `GatewayFactory` | Payment gateway resolution |
| `SmsProviderFactory` | SMS provider resolution |
| `PromptManagerService` | AI prompt management |
| `ProviderRegistryService` | AI provider routing |
| `UserPreferenceService` | User preferences |
| `BuyerHistoryService` | Buyer behavior history |
| `GeoCacheService` | Geocoding cache |
| `MarketplaceIntelligenceEngine` | Supplier scoring |
| `BestsellerService` | Bestseller snapshots |
| `ApprovalService` | Approval workflows |
| `CsvParserService` | CSV parsing |

---

## 10. Critical Findings & Risks

### 10.1 CRITICAL (2)

| # | Finding | Impact | Recommendation |
|---|---------|--------|---------------|
| C1 | **No event bus / domain events** | All cross-module communication is synchronous via service injection. No event-driven architecture exists. Modules cannot react to domain events asynchronously. | Consider introducing an event bus (NestJS EventEmitter + BullMQ) before adding new module groups that need to react to domain events (e.g., TradeServ reacting to order completions) |
| C2 | **No middleware.ts (Next.js)** | All route protection is client-side. Server-side route access control relies on individual page checks. Potential for unauthenticated server-side data fetching. | Add `middleware.ts` for server-side route protection before adding new public pages (TradeServ) |

### 10.2 HIGH (4)

| # | Finding | Impact | Recommendation |
|---|---------|--------|---------------|
| H1 | **Dual auth systems** | System A (Context) and System B (Zustand) coexist with slightly different endpoints (`/auth/me` vs `/users/me`). Inconsistent user state possible. | Consolidate to single auth system. System A is dominant (94% usage) — migrate System B consumers. |
| H2 | **Dual API clients** | `lib/api/client.ts` (axios) and `lib/api-client.ts` (class-based) implement independent refresh logic. Different error handling behavior. | Deprecate `lib/api-client.ts`. Standardize on axios client. |
| H3 | **No Prisma middleware** | No soft-delete, no audit logging, no query logging at the ORM level. | Add Prisma middleware for soft-delete filter and query logging. |
| H4 | **Analytics has raw SQL** (historical) | ClickHouse queries use raw SQL strings. No query builder or validation. | Add ClickHouse query builder to prevent injection. |

### 10.3 MEDIUM (5)

| # | Finding | Impact | Recommendation |
|---|---------|--------|---------------|
| M1 | **Membership ↔ Billing circular dep** | `forwardRef` works but indicates tight coupling. | Extract shared interfaces to break the cycle. |
| M2 | **No middleware.ts = no SSR route protection** | Server components can render protected content without auth check. | Add `middleware.ts` with JWT verification from `jose`. |
| M3 | **ClamAV integration is a stub** | `MalwareProcessor` always returns `{ clean: true }`. | Complete ClamAV integration or remove stub. |
| M4 | **90% of AI processor is stub** | `AiProcessor` has minimal implementation. | Wire to actual AI processing or remove. |
| M5 | **react-hot-toast vs custom toast** | `react-hot-toast` installed but unused. Custom toast system used instead. | Remove unused dependency. |

### 10.4 LOW (3)

| # | Finding | Impact | Recommendation |
|---|---------|--------|---------------|
| L1 | **No Redis pool configuration** | `RedisService` uses default pool. | Not an issue until high concurrency. Monitor. |
| L2 | **No OpenSearch cluster config** | Single-node OpenSearch. | Scale when needed. |
| L3 | **Console SMS provider as default** | `SMS_PROVIDER` defaults to `console`. | Change default to `twilio` after production verification. |

---

## 11. Implementation Order for New Module Groups

When adding a new module group (e.g., TradeServ), modules must be implemented in this order based on dependency analysis:

### Phase 1: Foundation (Depends On: Nothing new)

```
TradeServ Prisma Models + Enums  ─────────────────────────────────────┐
                                                                       │
                                    ┌──────────────────────────────────┘
                                    ▼
```

### Phase 2: Core Services (Depends On: Phase 1 + Existing Core Modules)

```
TradeServ Core Data Access Layer
  ├── TradeServ Users Module         (uses: AuthService, UsersService)
  ├── TradeServ Companies Module     (uses: CompaniesService, StorageService)
  ├── TradeServ Categories Module    (uses: CategoriesService)
  └── TradeServ Search Module        (uses: SearchService, GeocodingService)
```

### Phase 3: Domain Services (Depends On: Phase 2)

```
TradeServ Domain Services
  ├── TradeServ Listings Module      (uses: Phase 2, TradTrustService, GocashService)
  ├── TradeServ Bookings Module      (uses: Phase 2, NotificationService)
  └── TradeServ Reviews Module       (uses: Phase 2, ReputationModule)
```

### Phase 4: Transactional (Depends On: Phase 3)

```
TradeServ Transactional Services
  ├── TradeServ Payments Module      (uses: GatewayFactory, InvoiceService)
  └── TradeServ Disputes Module      (uses: DisputeModule, EscrowModule)
```

### Phase 5: AI & Intelligence (Depends On: Phase 3+4)

```
TradeServ AI Layer
  └── TradeServ AI Module            (uses: AiGatewayService, AiCreditsService)
```

### Phase 6: GOCASH Integration (Depends On: Phase 3+4)

```
TradeServ GOCASH Rewards
  └── TradeServ Integration Module   (uses: GocashIntegrationModule pattern)
```

### Phase 7: Notification (Depends On: All Above)

```
TradeServ Notification Templates
  └── TradeServ Notification Templates  (uses: NotificationTemplateService)
```

---

## 12. TradeServ Integration Points

TradeServ (professional services marketplace) must integrate with existing Core modules at these specific points:

### 12.1 Mandatory Integrations

| Core Module | Integration Point | TradeServ Requirement |
|-------------|------------------|---------------------|
| **AuthModule** | JWT auth, OAuth, OTP | Reuse directly — no changes needed |
| **UsersModule** | User CRUD | Professional extends User (new role: PROFESSIONAL) |
| **CompaniesModule** | Company resolution | Professionals are Companies with type `SERVICE_PROVIDER` |
| **StorageModule** | File upload | Service portfolio images, documents |
| **SearchModule** | OpenSearch indexing | Service listing search |
| **NotificationModule** | Multi-channel notifications | Booking confirmations, reminders |
| **SmsModule** | OTP delivery | Phone verification, booking alerts |
| **GeocodingService** | Address geocoding | Professional location, service area |
| **PaymentModule** | Payment processing | Service bookings, deposits |
| **GocashService** | Wallet/ledger | Service rewards, cashback |
| **TradTrustService** | Trust scores | Professional reputation scoring |
| **ReputationModule** | Event logging | Service completion events |
| **AiGatewayService** | AI processing | Service recommendations, smart matching |

### 12.2 Optional Integrations

| Core Module | Integration Point | TradeServ Value |
|-------------|------------------|----------------|
| **AnalyticsModule** | ClickHouse events | Service analytics |
| **EventIngestionService** | Event tracking | Service demand trends |
| **MarketplaceIntelligenceModule** | Best-supplier engine | Best-professional ranking |
| **CampaignModule** | Campaign rewards | Service promotion campaigns |
| **AdvertisingModule** | Sponsored listings | Featured service listings |
| **ChatModule** | Real-time chat | Client-professional communication |

### 12.3 Modules That Must NOT Be Modified for TradeServ

| Module | Reason |
|--------|--------|
| `AuthModule` | Security-critical — 24 endpoints, JWT, OTP, OAuth |
| `PaymentModule` | Financial transactions — 2 gateways |
| `GocashModule` | GOCASH v1.0 certified — append-only ledger |
| `NotificationModule` | Global — all platform notifications |
| `SmsModule` | Global — OTP delivery, security-critical |
| `TradTrustModule` | Scoring engine — 6 dimensions |
| `ReputationModule` | Append-only — data integrity |
| `MalwareModule` | Security scanning |
| `DisputeModule` | Dispute resolution workflow |
| `EscrowModule` | Financial escrow |
| `PrismaModule` | Global database |
| `RedisModule` | Global caching |

---

## 13. Approval Checklist

### Architecture Freeze Conditions

- [ ] All 73 modules cataloged with dependency classification
- [ ] 231 models and 160 enums mapped by domain
- [ ] Auth/security infrastructure documented (24 endpoints, 5 guards, 4 decorators)
- [ ] Shared services documented (13 queues, 17 cron, 2 gateways, 5 AI providers)
- [ ] Frontend architecture documented (193 routes, 28 component dirs, 48 hooks, 57 API files)
- [ ] Dependency graph mapped (6 layers, circular deps identified)
- [ ] Module classification complete (20 frozen, 25 extendable, 28 reusable)
- [ ] Critical findings documented (2 critical, 4 high, 5 medium, 3 low)
- [ ] Implementation order defined for new module groups
- [ ] TradeServ integration points identified (12 mandatory, 6 optional, 12 untouchable)

### Next Steps After Approval

1. Fix critical findings (C1: event bus, C2: middleware.ts)
2. Fix high findings (H1: dual auth, H2: dual API client, H3: Prisma middleware, H4: ClickHouse)
3. Proceed with TradeServ backend per approved Blueprint
4. Implement in dependency order (Foundation → Core → Domain → Transactional → AI → GOCASH → Notification)

---

*Document generated: 2026-07-03 | Source: TRADINGO Core Architecture Audit | 73 modules, 231 models, 193 frontend routes*
