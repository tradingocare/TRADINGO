# TRADINGO Data Model

**Version**: 1.0
**Status**: Architecture Frozen — Design Specification
**Date**: 2026-07-27
**Classification**: Founder Confidential — Data Architecture

---

## TABLE OF CONTENTS

1. Data Design Principles
2. Domain Model Overview
3. Entity Catalog
4. Aggregate Roots
5. Relationship Model
6. Lifecycle Models
7. Ownership Matrix
8. Search & Index Strategy
9. AI Consumption Strategy
10. Data Governance
11. Canonical Naming Standards
12. Data Readiness Checklist

---

## 1. DATA DESIGN PRINCIPLES

### 1.1 Core Principles

| # | Principle | Rationale |
|---|-----------|----------|
| 1 | **Single Source of Truth** | Every business fact lives in exactly one system of record. All other representations are caches, views, or derivations. |
| 2 | **Immutable Audit Trail** | Financial and compliance-related data (payments, escrow, settlements, ledgers) is append-only. No UPDATE, no DELETE. |
| 3 | **Domain Ownership** | Each entity belongs to exactly one domain module. Cross-domain reads use service-to-service calls, never direct database access. |
| 4 | **Idempotency First** | Every financial mutation carries an idempotency key. Replay-safe by design. |
| 5 | **Soft Delete by Convention** | Business entities use `deletedAt: timestamp?` for soft-delete. Hard delete is reserved for test data and PII purge workflows. |
| 6 | **Audit Native** | Every mutation is logged with actor, action, target, timestamp, previous state, and new state. Queryable via AuditLog. |
| 7 | **Tenant Isolation** | All data is scoped by `companyId` (B2B tenant). Cross-tenant access is intentional, documented, and API-gated. |
| 8 | **AI Ready** | Every entity has an `ai_` metadata block for AI enrichment (confidence, embeddingId, aiSummary, lastEnrichedAt). Optional, never required. |

### 1.2 ID Generation Standards

| Entity Prefix | Pattern | Example |
|--------------|---------|---------|
| User | `usr_` + nanoid(16) | `usr_K4xR2mN8pL9vQw3E` |
| Company | `cmp_` + nanoid(16) | `cmp_aB7xR2mN8pL9vQw3` |
| Product | `prd_` + nanoid(16) | `prd_XyZ2mN8pL9vQw3Ef` |
| CatalogItem | `cat_` + nanoid(16) | `cat_mN8pL9vQw3EfXyZ2` |
| Category | `ctg_` + nanoid(16) | `ctg_R2mN8pL9vQw3EfXy` |
| Order | `ord_` + nanoid(16) | `ord_K4xR2mN8pL9vQw3E` |
| RFQ | `rfq_` + nanoid(16) | `rfq_aB7xR2mN8pL9vQw3` |
| Quote | `qte_` + nanoid(16) | `qte_XyZ2mN8pL9vQw3Ef` |
| Payment | `pay_` + nanoid(16) | `pay_mN8pL9vQw3EfXyZ2` |
| Wallet | `wlt_` + nanoid(16) | `wlt_R2mN8pL9vQw3EfXy` |
| Ledger | `ldg_` + nanoid(16) | `ldg_K4xR2mN8pL9vQw3E` |
| Escrow | `esw_` + nanoid(16) | `esw_aB7xR2mN8pL9vQw3` |
| Settlement | `stl_` + nanoid(16) | `stl_XyZ2mN8pL9vQw3Ef` |
| Commission | `com_` + nanoid(16) | `com_mN8pL9vQw3EfXyZ2` |
| Refund | `rfd_` + nanoid(16) | `rfd_R2mN8pL9vQw3EfXy` |
| Dispute | `dsp_` + nanoid(16) | `dsp_K4xR2mN8pL9vQw3E` |
| Negotiation | `neg_` + nanoid(16) | `neg_aB7xR2mN8pL9vQw3` |
| TrustScore | `trs_` + nanoid(16) | `trs_XyZ2mN8pL9vQw3Ef` |
| Verification | `vrf_` + nanoid(16) | `vrf_mN8pL9vQw3EfXyZ2` |
| Review | `rev_` + nanoid(16) | `rev_R2mN8pL9vQw3EfXy` |
| Booking | `bok_` + nanoid(16) | `bok_K4xR2mN8pL9vQw3E` |
| Proposal | `ppl_` + nanoid(16) | `ppl_aB7xR2mN8pL9vQw3` |
| Post | `pst_` + nanoid(16) | `pst_XyZ2mN8pL9vQw3Ef` |
| Community | `com_` + nanoid(16) | `com_mN8pL9vQw3EfXyZ2` |
| Subscription | `sub_` + nanoid(16) | `sub_R2mN8pL9vQw3EfXy` |
| Campaign | `cmp_` + nanoid(16) | `cmp_K4xR2mN8pL9vQw3E` |
| Advertisement | `ads_` + nanoid(16) | `ads_aB7xR2mN8pL9vQw3` |
| AgentSession | `ags_` + nanoid(16) | `ags_XyZ2mN8pL9vQw3Ef` |
| Inference | `inf_` + nanoid(16) | `inf_mN8pL9vQw3EfXyZ2` |
| KnowledgeGraph | `kgr_` + nanoid(16) | `kgr_R2mN8pL9vQw3EfXy` |
| MemoryFragment | `mem_` + nanoid(16) | `mem_K4xR2mN8pL9vQw3E` |

### 1.3 Field Naming Standards

| Category | Convention | Example |
|----------|-----------|---------|
| Primary Key | `id` (always String) | `id String @id @default(cuid())` |
| Foreign Key | `{relatedEntity}Id` camelCase | `companyId`, `userId`, `orderId` |
| Timestamps | `createdAt`, `updatedAt`, `deletedAt` | `createdAt DateTime @default(now())` |
| Status | `{entity}Status` enum | `OrderStatus`, `PaymentStatus` |
| Amount | Always in smallest currency unit (paise/cents) | `amount Int`, `commissionAmount Int` |
| Currency | ISO 4217 3-letter code | `currency String @default("INR")` |
| Soft Delete | `deletedAt DateTime?` | `deletedAt DateTime?` |
| Version | `version Int @default(1)` | Optimistic concurrency |
| AI Metadata | `ai_` prefix | `ai_summary String?`, `ai_confidence Float?` |
| Audit | `createdById`, `updatedById` | `createdById String?` |
| Tenant | `companyId` on every tenant-scoped entity | `companyId String` |

---

## 2. DOMAIN MODEL OVERVIEW

### 2.1 Domain Map

| Domain | Module | System of Record | Description |
|--------|--------|-----------------|-------------|
| Identity | IdentityModule | Prisma | Users, roles, authentication, sessions |
| Organization | CompaniesModule | Prisma | Companies, org structure, teams |
| Catalog | EnterpriseCatalogModule | Prisma + OpenSearch | Products, catalog items, categories, brands, attributes |
| Commerce | CommerceModule | Prisma + OpenSearch | RFQs, quotes, orders, negotiations |
| Payments | PaymentModule | Prisma + Razorpay | Payments, escrow, settlements, refunds |
| Wallet | GocashModule | Prisma | Wallets, transactions, ledgers, redemptions |
| Trust | TradTrustModule | Prisma | Trust scores, verification, reviews, certificates |
| TradeServ | TradeservModule | Prisma + OpenSearch | Professionals, bookings, proposals, service areas |
| Social | TradeTalkModule | Prisma | Communities, posts, comments, follows |
| CRM | CrmModule | Prisma + ClickHouse | Leads, campaigns, pipelines, marketing |
| Intelligence | EnterpriseIntelligenceModule | Prisma + Redis | Analytics, KPIs, alerts, correlations, health |
| AI | AiGatewayModule + Runtime | Prisma + Redis | AI gateway, agents, federation, credits, models |
| Notification | NotificationModule | Prisma | Notifications, templates, workflows, newsletters |
| Audit | AuditModule | Prisma | Immutable audit log |
| Configuration | ConfigModule | Prisma | Feature flags, settings, policies |
| Growth | GrowthIntelligenceModule | Prisma | Analytics, tracking, funnel, acquisition |

### 2.2 Entity Count by Domain

| Domain | Entities | Aggregate Roots | Value Objects |
|--------|----------|----------------|--------------|
| Identity | 4 | 2 | 2 |
| Organization | 6 | 3 | 1 |
| Catalog | 12 | 6 | 3 |
| Commerce | 8 | 5 | 2 |
| Payments | 8 | 5 | 2 |
| Wallet | 5 | 3 | 1 |
| Trust | 7 | 4 | 2 |
| TradeServ | 12 | 6 | 3 |
| Social | 6 | 3 | 1 |
| CRM | 5 | 3 | 2 |
| Intelligence | 6 | 3 | 1 |
| AI | 10 | 5 | 3 |
| Notification | 6 | 3 | 2 |
| Audit | 2 | 1 | 0 |
| Configuration | 3 | 2 | 0 |
| Growth | 4 | 2 | 1 |

---

## 3. ENTITY CATALOG

### 3.1 Identity Domain

#### User
- `id` String @id
- `email` String @unique
- `mobile` String?
- `passwordHash` String
- `firstName` String
- `lastName` String
- `role` Role (BUYER, SELLER, ADMIN, SUPER_ADMIN)
- `verificationLevel` VerificationLevel
- `emailVerifiedAt` DateTime?
- `mobileVerifiedAt` DateTime?
- `isActive` Boolean @default(true)
- `lastLoginAt` DateTime?
- `preferences` Json?
- `ai_preferences` Json? (AI tone, personalization settings)
- `createdAt` DateTime
- `updatedAt` DateTime
- `deletedAt` DateTime?

**Relations**: companyMembers[], sessions[], notifications[], created orders, reviews, posts, comments, bookings

#### Session
- `id` String @id
- `userId` String
- `token` String @unique
- `refreshToken` String @unique
- `device` String?
- `ip` String?
- `isActive` Boolean @default(true)
- `lastActiveAt` DateTime?
- `expiresAt` DateTime
- `createdAt` DateTime

**Domain Events**: SESSION_CREATED, SESSION_EXPIRED, SESSION_REVOKED

#### Role
- `id` String @id
- `name` String @unique
- `permissions` Json
- `isSystem` Boolean @default(false)

### 3.2 Organization Domain

#### Company
- `id` String @id
- `name` String
- `slug` String @unique
- `logo` String?
- `banner` String?
- `description` String?
- `gstin` String? @unique
- `pan` String? @unique
- `businessType` BusinessType?
- `verificationLevel` VerificationLevel
- `website` String?
- `foundedYear` Int?
- `employeeCount` Int?
- `annualRevenue` String?
- `socialLinks` Json?
- `ai_trustSummary` String?
- `ai_confidence` Float?
- `createdAt` DateTime
- `updatedAt` DateTime
- `deletedAt` DateTime?

**Relations**: members[], products[], professional services[], reviews[], bookings[], orders[], payments[], TrustScore[]

#### CompanyMember
- `id` String @id
- `companyId` String
- `userId` String
- `role` CompanyRole (OWNER, ADMIN, MEMBER, VIEWER)
- `isActive` Boolean @default(true)
- `joinedAt` DateTime

#### Team
- `id` String @id
- `companyId` String
- `name` String
- `description` String?
- `createdAt` DateTime

### 3.3 Catalog Domain

#### CatalogCategory
- `id` String @id
- `name` String
- `slug` String @unique
- `description` String?
- `icon` String?
- `parentId` String? (self-referencing)
- `displayOrder` Int @default(0)
- `isActive` Boolean @default(true)
- `ai_keywords` String[]
- `ai_searchVector` String?
- `createdAt` DateTime
- `updatedAt` DateTime

#### CatalogSubcategory
- `id` String @id
- `categoryId` String
- `name` String
- `slug` String @unique
- `description` String?
- `displayOrder` Int @default(0)
- `isActive` Boolean @default(true)
- `createdAt` DateTime
- `updatedAt` DateTime

#### CatalogItem
- `id` String @id
- `subcategoryId` String
- `type` CatalogItemType (PRODUCT, SERVICE)
- `name` String
- `slug` String @unique
- `description` String?
- `hsCode` String?
- `sacCode` String?
- `unitId` String?
- `attributes` Json?
- `isActive` Boolean @default(true)
- `ai_summary` String?
- `ai_keywords` String[]
- `ai_synonyms` String[]
- `ai_seoTitle` String?
- `ai_seoDescription` String?
- `ai_embeddingId` String?
- `ai_searchVector` String?
- `createdAt` DateTime
- `updatedAt` DateTime

#### GlobalBrand
- `id` String @id
- `name` String @unique
- `slug` String @unique
- `description` String?
- `logo` String?
- `website` String?
- `verificationStatus` BrandVerificationStatus
- `createdAt` DateTime
- `updatedAt` DateTime

#### GlobalAttribute
- `id` String @id
- `name` String
- `type` GlobalAttributeType (TEXT, NUMBER, BOOLEAN, SELECT, MULTI_SELECT, RANGE, COLOR, DIMENSION, WEIGHT, VOLTAGE, MATERIAL, SIZE, DATE, FILE, URL)
- `options` Json? (for SELECT/MULTI_SELECT)
- `unit` String?
- `isRequired` Boolean @default(false)
- `displayOrder` Int @default(0)
- `createdAt` DateTime
- `updatedAt` DateTime

### 3.4 Commerce Domain

#### Product
- `id` String @id
- `companyId` String
- `catalogItemId` String?
- `brandId` String?
- `name` String
- `slug` String
- `shortDescription` String?
- `description` String?
- `media` Json (images, videos)
- `specifications` Json?
- `pricing` Json? (price slabs, MOQ, volume discounts)
- `inventory` Int @default(0)
- `isActive` Boolean @default(true)
- `isFeatured` Boolean @default(false)
- `status` ProductStatus (DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED, UNPUBLISHED, ARCHIVED)
- `seoMetadata` Json?
- `ai_description` String?
- `ai_seoTitle` String?
- `ai_seoDescription` String?
- `ai_keywords` String[]
- `ai_confidence` Float?
- `ai_lastEnrichedAt` DateTime?
- `qualityScore` Float?
- `createdAt` DateTime
- `updatedAt` DateTime
- `deletedAt` DateTime?

**Domain Events**: product.created, product.updated, product.published, product.unpublished, product.quality.updated, product.ai.enriched

#### RFQ (Request for Quote)
- `id` String @id
- `companyId` String (buyer)
- `title` String
- `description` String?
- `categoryId` String?
- `catalogItemId` String?
- `quantity` Int
- `unit` String
- `budgetRange` Json? (min, max, currency)
- `deliveryRequiredBy` DateTime?
- `status` RfqStatus (DRAFT, OPEN, QUOTED, AWARDED, CLOSED, CANCELLED)
- `isPublic` Boolean @default(true)
- `ai_requirements` Json?
- `ai_completeness` Float?
- `createdAt` DateTime
- `updatedAt` DateTime

#### Quote
- `id` String @id
- `rfqId` String
- `companyId` String (seller)
- `amount` Int (in paise)
- `currency` String @default("INR")
- `validUntil` DateTime?
- `deliveryTimeline` String?
- `terms` Json?
- `status` QuoteStatus (DRAFT, SUBMITTED, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED)
- `ai_priceAnalysis` Json?
- `ai_winProbability` Float?
- `createdAt` DateTime
- `updatedAt` DateTime

#### Order
- `id` String @id
- `orderNumber` String @unique (human-readable: ORD-YYYYMMDD-XXXX)
- `buyerCompanyId` String
- `sellerCompanyId` String
- `quoteId` String?
- `rfqId` String?
- `subtotal` Int
- `taxAmount` Int
- `shippingAmount` Int
- `totalAmount` Int
- `currency` String @default("INR")
- `status` OrderStatus
- `shippingAddress` Json?
- `billingAddress` Json?
- `notes` String?
- `createdAt` DateTime
- `updatedAt` DateTime

#### Negotiation
- `id` String @id
- `rfqId` String?
- `quoteId` String?
- `buyerCompanyId` String
- `sellerCompanyId` String
- `status` NegotiationStatus
- `round` Int @default(1)
- `startedAt` DateTime
- `completedAt` DateTime?
- `ai_strategy` Json?
- `ai_riskScore` Float?
- `createdAt` DateTime
- `updatedAt` DateTime

### 3.5 Payments Domain

#### Payment
- `id` String @id
- `orderId` String?
- `bookingId` String?
- `companyId` String
- `amount` Int
- `currency` String @default("INR")
- `method` PaymentMethod
- `status` PaymentStatus (PENDING, PROCESSING, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED)
- `gatewayReference` String?
- `gatewayResponse` Json?
- `idempotencyKey` String @unique
- `metadata` Json?
- `createdAt` DateTime
- `updatedAt` DateTime

#### Escrow
- `id` String @id
- `paymentId` String?
- `orderId` String?
- `bookingId` String? @unique
- `amount` Int
- `commissionAmount` Int @default(0)
- `commissionRuleId` String?
- `commissionMetadata` Json?
- `status` EscrowStatus (HELD, RELEASED, FROZEN, REFUNDED, DISPUTED, PARTIALLY_RELEASED)
- `releaseCondition` Json? (milestones, triggers)
- `heldAt` DateTime
- `releasedAt` DateTime?
- `createdAt` DateTime
- `updatedAt` DateTime

**Domain Events**: escrow.held, escrow.released, escrow.frozen, escrow.disputed, escrow.refunded

#### Settlement
- `id` String @id
- `escrowId` String
- `payeeCompanyId` String
- `amount` Int
- `commissionAmount` Int
- `netAmount` Int
- `status` SettlementStatus (PENDING, PROCESSING, PROCESSED, FAILED, PAUSED)
- `settlementDate` DateTime?
- `createdAt` DateTime
- `updatedAt` DateTime

#### Refund
- `id` String @id
- `paymentId` String?
- `bookingId` String?
- `amount` Int
- `reason` String
- `status` RefundStatus (PENDING, APPROVED, PROCESSED, FAILED, REJECTED)
- `gatewayReference` String?
- `processedAt` DateTime?
- `createdAt` DateTime
- `updatedAt` DateTime

#### CommissionRule
- `id` String @id
- `ruleType` CommissionRuleType (PLATFORM, CATEGORY, MEMBERSHIP, PROFESSIONAL, PROMOTIONAL)
- `calcType` CommissionCalcType (PERCENTAGE, FIXED, ZERO)
- `value` Float
- `priority` Int @default(0)
- `scope` Json? (applicable categories, plans, professionals)
- `name` String
- `description` String?
- `isActive` Boolean @default(true)
- `effectiveFrom` DateTime
- `effectiveTo` DateTime?
- `membershipPlanId` String?
- `professionalId` String?
- `categoryId` String?
- `createdAt` DateTime
- `updatedAt` DateTime

### 3.6 Wallet Domain

#### GOCASH_Wallet
- `id` String @id
- `companyId` String @unique
- `balance` Int @default(0)
- `totalEarned` Int @default(0)
- `totalSpent` Int @default(0)
- `currency` String @default("INR")
- `status` WalletStatus (ACTIVE, FROZEN, CLOSED)
- `lastTransactionAt` DateTime?
- `createdAt` DateTime
- `updatedAt` DateTime

#### GOCASH_Transaction
- `id` String @id
- `walletId` String
- `type` TransactionType (30+ types covering all reward, campaign, ad, refund, referral scenarios)
- `direction` TransactionDirection (CREDIT, DEBIT)
- `amount` Int
- `balanceBefore` Int
- `balanceAfter` Int
- `referenceType` String? (entity type)
- `referenceId` String? (entity ID)
- `idempotencyKey` String @unique
- `description` String?
- `metadata` Json?
- `status` TransactionStatus (PENDING, COMPLETED, FAILED, REVERSED)
- `reversalId` String?
- `reversedAt` DateTime?
- `createdAt` DateTime

#### GOCASH_Redemption
- `id` String @id
- `walletId` String
- `amount` Int
- `type` RedemptionType
- `status` RedemptionStatus (PENDING, APPROVED, PROCESSED, REJECTED)
- `requestedAt` DateTime
- `processedAt` DateTime?
- `createdAt` DateTime

### 3.7 Trust Domain

#### TradTrustScore
- `id` String @id
- `companyId` String @unique
- `overallScore` Float
- `dimensions` Json (16 dimensions with individual scores)
- `trend` String? (IMPROVING, STABLE, DECLINING)
- `confidence` Float
- `lastRecalculatedAt` DateTime
- `createdAt` DateTime
- `updatedAt` DateTime

#### CompanyVerification
- `id` String @id
- `companyId` String
- `level` VerificationLevel
- `status` VerificationStatus (PENDING, SUBMITTED, VERIFIED, REJECTED, EXPIRED)
- `documents` Json?
- `reviewedById` String?
- `reviewedAt` DateTime?
- `notes` String?
- `submittedAt` DateTime
- `createdAt` DateTime
- `updatedAt` DateTime

#### UserVerification
- `id` String @id
- `userId` String
- `level` VerificationLevel
- `status` VerificationStatus
- `documents` Json?
- `reviewedById` String?
- `reviewedAt` DateTime?
- `createdAt` DateTime
- `updatedAt` DateTime

#### Review
- `id` String @id
- `productId` String?
- `companyId` String? (reviewed company)
- `bookingId` String? (TradeServ)
- `userId` String (reviewer)
- `rating` Int (1-5)
- `title` String?
- `description` String?
- `isVerifiedPurchase` Boolean @default(false)
- `isVerifiedBooking` Boolean @default(false)
- `createdAt` DateTime

### 3.8 TradeServ Domain

#### ProfessionalService
- `id` String @id
- `companyId` String
- `catalogItemId` String?
- `name` String
- `description` String?
- `category` String
- `subcategory` String?
- `pricingType` PricingType (FIXED, HOURLY, PROJECT_BASED, CUSTOM)
- `price` Int?
- `currency` String @default("INR")
- `duration` Int? (minutes)
- `isActive` Boolean @default(true)
- `createdAt` DateTime
- `updatedAt` DateTime

#### Booking
- `id` String @id
- `companyId` String (professional)
- `clientId` String (buyer company)
- `serviceId` String
- `status` BookingStatus (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
- `scheduledAt` DateTime
- `duration` Int (minutes)
- `location` Json? (address, coordinates)
- `amount` Int
- `currency` String @default("INR")
- `paymentStatus` PaymentStatus
- `paymentId` String?
- `escrowId` String? @unique
- `notes` String?
- `cancellationReason` String?
- `createdAt` DateTime
- `updatedAt` DateTime

#### Proposal
- `id` String @id
- `companyId` String (professional)
- `clientId` String (buyer company)
- `inquiryId` String?
- `title` String
- `description` String?
- `amount` Int
- `currency` String @default("INR")
- `timeline` String?
- `status` ProposalStatus (DRAFT, SUBMITTED, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED)
- `createdAt` DateTime
- `updatedAt` DateTime

### 3.9 Social Domain

#### Community
- `id` String @id
- `name` String
- `slug` String @unique
- `description` String?
- `banner` String?
- `type` CommunityType (PUBLIC, PRIVATE, INDUSTRY, REGION)
- `ownerId` String (company ID)
- `rules` String?
- `memberCount` Int @default(0)
- `postCount` Int @default(0)
- `isActive` Boolean @default(true)
- `createdAt` DateTime
- `updatedAt` DateTime

#### SocialPost
- `id` String @id
- `communityId` String?
- `authorId` String (company ID)
- `type` SocialPostType (DISCUSSION, QUESTION, SHOWCASE, OFFER, REQUEST, POLL, ARTICLE, EVENT, JOB)
- `title` String
- `content` String?
- `media` Json?
- `link` String?
- `tags` String[]
- `isPinned` Boolean @default(false)
- `isActive` Boolean @default(true)
- `engagement` Json? (likeCount, commentCount, shareCount)
- `ai_moderationScore` Float?
- `ai_moderationAction` String?
- `createdAt` DateTime
- `updatedAt` DateTime
- `deletedAt` DateTime?

### 3.10 CRM Domain

#### CrmLead
- `id` String @id
- `companyId` String?
- `source` LeadSource
- `status` LeadStatus
- `score` Int @default(0)
- `campaignId` String?
- `contactInfo` Json
- `notes` String?
- `assignedToId` String?
- `convertedAt` DateTime?
- `createdAt` DateTime
- `updatedAt` DateTime

#### CrmCampaign
- `id` String @id
- `name` String
- `type` CampaignType
- `status` CampaignStatus
- `targetAudience` Json?
- `budget` Int?
- `startDate` DateTime?
- `endDate` DateTime?
- `leads` Int @default(0)
- `conversions` Int @default(0)
- `revenue` Int @default(0)
- `createdAt` DateTime
- `updatedAt` DateTime

### 3.11 Intelligence Domain

#### KpiDefinition
- `id` String @id
- `name` String @unique
- `domain` String
- `description` String?
- `unit` String?
- `higherIsBetter` Boolean @default(true)
- `thresholds` Json? (warning, critical values)
- `source` String? (which service computes it)
- `isActive` Boolean @default(true)

#### KpiValue
- `id` String @id
- `kpiId` String
- `value` Float
- `periodStart` DateTime
- `periodEnd` DateTime
- `metadata` Json?
- `createdAt` DateTime

#### AlertDefinition
- `id` String @id
- `name` String
- `kpiId` String?
- `condition` String (expression evaluator)
- `severity` AlertSeverity (INFO, WARNING, CRITICAL)
- `cooldownMinutes` Int @default(60)
- `channels` String[] (notification channels)
- `isActive` Boolean @default(true)
- `createdAt` DateTime
- `updatedAt` DateTime

#### AlertEvent
- `id` String @id
- `definitionId` String
- `kpiId` String?
- `severity` AlertSeverity
- `message` String
- `value` Float?
- `threshold` Float?
- `acknowledgedAt` DateTime?
- `resolvedAt` DateTime?
- `createdAt` DateTime

### 3.12 AI Domain

#### AgentDefinition
- `id` String @id
- `name` String @unique
- `version` String
- `capabilities` Json (array of capability descriptors)
- `roles` String[]
- `endpoint` String?
- `isActive` Boolean @default(true)
- `metadata` Json?
- `createdAt` DateTime
- `updatedAt` DateTime

#### AgentSession
- `id` String @id
- `agentId` String
- `userId` String?
- `companyId` String?
- `context` Json?
- `status` SessionStatus (ACTIVE, PAUSED, COMPLETED, EXPIRED)
- `startedAt` DateTime
- `endedAt` DateTime?
- `tokenCount` Int @default(0)
- `createdAt` DateTime

#### Inference
- `id` String @id
- `agentSessionId` String?
- `modelId` String
- `prompt` Text
- `response` Text?
- `taskType` TaskType
- `action` String?
- `latency` Int? (ms)
- `tokenCount` Int @default(0)
- `cost` Float @default(0)
- `status` InferenceStatus (PENDING, PROCESSING, COMPLETED, FAILED, TIMEOUT)
- `error` String?
- `cacheHit` Boolean @default(false)
- `createdAt` DateTime

#### AiCreditUsage
- `id` String @id
- `companyId` String
- `periodStart` DateTime
- `periodEnd` DateTime
- `creditsUsed` Int @default(0)
- `creditsTotal` Int @default(0)
- `createdAt` DateTime
- `updatedAt` DateTime
- `@@unique([companyId, periodStart])`

#### WorkflowDefinition
- `id` String @id
- `name` String @unique
- `description` String?
- `steps` Json (ordered step definitions with agents, conditions, inputs/outputs)
- `triggers` Json? (event-based triggers)
- `isActive` Boolean @default(true)
- `version` Int @default(1)
- `createdAt` DateTime
- `updatedAt` DateTime

#### KnowledgeGraph
- `id` String @id
- `name` String @unique
- `domain` String
- `nodes` Json
- `edges` Json
- `version` Int @default(1)
- `createdAt` DateTime
- `updatedAt` DateTime

#### MemoryFragment
- `id` String @id
- `companyId` String?
- `agentId` String?
- `key` String
- `value` Json
- `ttl` Int? (seconds, null = permanent)
- `expiresAt` DateTime?
- `createdAt` DateTime
- `updatedAt` DateTime

### 3.13 Notification Domain

#### Notification
- `id` String @id
- `userId` String?
- `companyId` String?
- `type` NotificationType (70+ types covering all business events)
- `title` String
- `body` String?
- `data` Json?
- `isRead` Boolean @default(false)
- `readAt` DateTime?
- `channel` String (IN_APP, EMAIL, SMS)
- `externalId` String? (SES/SNS message ID)
- `createdAt` DateTime

#### NotificationTemplate
- `id` String @id
- `type` NotificationType @unique
- `title` String
- `body` String (handlebars template)
- `emailSubject` String?
- `emailBody` String? (HTML template)
- `smsBody` String?
- `channels` String[]
- `createdAt` DateTime
- `updatedAt` DateTime

#### NewsletterSubscriber
- `id` String @id
- `email` String @unique
- `companyId` String?
- `isActive` Boolean @default(true)
- `subscribedAt` DateTime
- `unsubscribedAt` DateTime?
- `createdAt` DateTime

### 3.14 Audit Domain

#### AuditLog
- `id` String @id
- `companyId` String?
- `userId` String?
- `action` String (SCREAMING_SNAKE_CASE)
- `entityType` String
- `entityId` String
- `previousState` Json?
- `newState` Json?
- `metadata` Json?
- `ip` String?
- `userAgent` String?
- `createdAt` DateTime

**Indexes**: `@@index([companyId, createdAt])`, `@@index([entityType, entityId])`, `@@index([action])`, `@@index([userId])`

### 3.15 Configuration Domain

#### FeatureFlag
- `id` String @id
- `name` String @unique
- `description` String?
- `isEnabled` Boolean @default(false)
- `rules` Json? (percentage rollout, company IDs, role-based)
- `createdAt` DateTime
- `updatedAt` DateTime

#### Policy
- `id` String @id
- `name` String @unique
- `domain` String
- `rules` Json (JSON-LD policy expression)
- `effect` String (ALLOW, DENY)
- `priority` Int @default(0)
- `isActive` Boolean @default(true)
- `createdAt` DateTime
- `updatedAt` DateTime

### 3.16 Growth Domain

#### UsageEvent
- `id` String @id
- `companyId` String?
- `userId` String?
- `sessionId` String?
- `eventName` String
- `properties` Json?
- `pageUrl` String?
- `utm` Json? (source, medium, campaign, term, content)
- `device` String?
- `ip` String?
- `createdAt` DateTime

**Indexes**: `@@index([eventName, createdAt])`, `@@index([companyId, createdAt])`, `@@index([sessionId])`

#### ReferralCode
- `id` String @id
- `companyId` String
- `userId` String
- `code` String @unique
- `usageCount` Int @default(0)
- `rewardAmount` Int
- `isActive` Boolean @default(true)
- `createdAt` DateTime

#### ReferralUsage
- `id` String @id
- `codeId` String
- `referredCompanyId` String
- `rewarded` Boolean @default(false)
- `rewardAmount` Int @default(0)
- `createdAt` DateTime

---

## 4. AGGREGATE ROOTS

Each aggregate root is the consistency boundary for transactional operations.

| Aggregate Root | Domain | Child Entities | Invariants |
|---------------|--------|----------------|------------|
| User | Identity | Session[], Notification[], ReferralCode[] | Email unique; active sessions limit (10); password strength |
| Company | Organization | CompanyMember[], Team[], Product[], ProfessionalService[] | Slug unique; GSTIN unique if provided; verification chain |
| Product | Catalog | ProductMedia[], CatalogQualityScore[] | Slug unique per company; status lifecycle enforced |
| CatalogItem | Catalog | CatalogAlias[], CatalogAttribute[] | Slug unique; hsCode/sacCode valid if provided |
| CatalogCategory | Catalog | CatalogSubcategory[] | Slug unique; self-referential parent valid |
| RFQ | Commerce | Quote[] | Status transitions: DRAFT→OPEN→QUOTED→AWARDED→CLOSED; single award |
| Quote | Commerce | Negotiation[] | Status transitions: DRAFT→SUBMITTED→ACCEPTED/REJECTED; sell-side only |
| Order | Commerce | Payment[], Shipment[], Dispute[] | Order number unique; total = subtotal + tax + shipping |
| Negotiation | Commerce | CounterOffer[] | Round increments monotonically; party validation |
| Payment | Payments | Refund[], Escrow[] | Idempotency key unique; amount positive |
| Escrow | Payments | Settlement[], Commission[] | Amount ≤ payment amount; single release |
| Wallet | Wallet | GOCASH_Transaction[], GOCASH_Redemption[] | Balance ≥ 0 for non-credit; append-only transactions |
| TradTrustScore | Trust | TrustScoreHistory[] | Overall = weighted average of 16 dimensions; immutable history |
| Booking | TradeServ | ProfessionalReview[], Proposal[] | Status transitions enforced; payment required before confirmation |
| ProfessionalService | TradeServ | ProfessionalAvailability[], ProfessionalServiceArea[] | Active status requires at least one service area |
| Community | Social | SocialPost[], CommunityMember[] | Owner must be member; privacy mode enforced |
| SocialPost | Social | SocialPostLike[], SocialSavedPost[] | Author can edit within 24h; soft-delete only |
| CrmLead | CRM | CrmNote[] | Source required; lead scoring automatic |
| Campaign | CRM | CampaignRule[], CampaignTarget[] | Budget cannot be exceeded |
| CrmCampaign | CRM | CrmLead[] | Status transitions: DRAFT→ACTIVE→PAUSED→COMPLETED |
| KpiDefinition | Intelligence | KpiValue[], AlertDefinition[] | Name unique; thresholds validated |
| AlertDefinition | Intelligence | AlertEvent[] | Cooldown enforced; condition must parse |
| AgentDefinition | AI | AgentSession[] | Capabilities must be non-empty; version semver |
| WorkflowDefinition | AI | WorkflowExecution[] | Steps ordered; triggers validated |
| Notification | Notification | NotificationDelivery[] | At least one channel; template must exist for type |
| MarketingWorkflow | Notification | MarketingWorkflowLog[] | Trigger types limited; action sequence validated |
| NewsletterCampaign | Notification | NewsletterCampaignDelivery[] | Subscriber list must be non-empty |
| ReferralCode | Growth | ReferralUsage[] | Code must be unique; self-referral blocked |
| FeatureFlag | Configuration | — | Rules must parse if provided |
| Policy | Configuration | — | Effect must be ALLOW or DENY |

---

## 5. RELATIONSHIP MODEL

### 5.1 Cross-Domain Relationship Map

```
User --1:N--> CompanyMember --N:1--> Company
Company --1:N--> Product --N:1--> CatalogItem
Company --1:N--> ProfessionalService --N:1--> CatalogItem
Company --1:1--> GOCASH_Wallet
Company --1:1--> TradTrustScore
Company --1:N--> CompanyVerification
User --1:N--> UserVerification
Company --1:N--> RFQ
Company --1:N--> Quote
RFQ --1:N--> Quote
Quote --1:N--> Negotiation
RFQ --1:N--> Order
Order --1:N--> Payment
Payment --1:1--> Escrow
Escrow --1:N--> Settlement
Booking --1:1--> Escrow
Booking --1:N--> ProfessionalReview
Payment --1:N--> Refund
Company --1:N--> Booking (as professional)
Company --1:N--> Booking (as client)
Company --1:N--> Community (as owner)
Community --1:N--> SocialPost
SocialPost --1:N--> SocialPostLike
Company --1:N--> Post (as author)
User --1:N--> Notification
Company --1:N--> CrmLead
Company --1:N--> ReferralCode
Company --1:N--> AiCreditUsage
Company --1:N--> AgentSession
AgentDefinition --1:N--> AgentSession
AgentSession --1:N--> Inference
KpiDefinition --1:N--> KpiValue
AlertDefinition --1:N--> AlertEvent
CatalogCategory --1:N--> CatalogSubcategory
CatalogSubcategory --1:N--> CatalogItem
```

### 5.2 Relationship Enforcement Rules

| Type | Enforcement | Example |
|------|------------|---------|
| **Required** (RESTRICT) | Cannot delete parent with children | Order with Payments, Company with Wallets, Escrow with Settlements |
| **Optional** (SET NULL) | Deletion nullifies FK | Product.brandId, Booking.paymentId |
| **Cascade** (CASCADE) | Child deletion follows parent | AuditLog entries, Notification deliveries, Session records |
| **Immutable** | No FK enforcement (archival) | PlanHistory, KpiValue snapshots |

### 5.3 Key Business Rules

- **Financial Chain**: Payment → Escrow → Settlement → Payout (each step requires previous to be COMPLETED)
- **Booking Payment**: Booking → Payment → Escrow (payment must succeed before booking confirmed)
- **Reward Flow**: Event → GOCASH_Transaction (CREDIT) → Wallet.balance (idempotent, append-only)
- **Trust Chain**: Verification → TradTrustScore recalculated (verification change triggers score recompute)
- **AI Chain**: AgentSession → Inference (each inference belongs to a session for billing/audit)
- **Commerce Chain**: RFQ → Quote → Order → Payment → Fulfillment (linear progression with guard rails)

---

## 6. LIFECYCLE MODELS

### 6.1 Pattern 1: CRUD + Soft Delete

Used by: Product, Community, SocialPost, CatalogItem, GlobalBrand, GlobalAttribute

```
CREATE → READ → UPDATE → SOFT_DELETE → (RESTORE → UPDATE) → HARD_DELETE (PII purge only)
```

Rules:
- `deletedAt` set on soft delete; queries filter `WHERE deletedAt IS NULL` by default
- Hard delete only for PII compliance (GDPR) and test data cleanup
- Restore sets `deletedAt = NULL`

### 6.2 Pattern 2: Immutable State Machine

Used by: Order, Payment, Escrow, Settlement, Booking, RFQ, Quote, Negotiation

```
State A → State B → State C → (State D → ...) → Terminal State
```

Rules:
- Each transition is audited via AuditLog
- Transitions cannot be reversed (except PAUSED↔ACTIVE patterns)
- Terminal states: COMPLETED, CANCELLED, REFUNDED, EXPIRED, REJECTED
- State transitions defined per entity in module service layer

### 6.3 Pattern 3: Append-Only Ledger

Used by: GOCASH_Transaction, AuditLog, UsageEvent, Inference, KpiValue

```
APPEND only — no UPDATE, no DELETE (except for data retention purge)
```

Rules:
- Each row carries idempotency key for replay safety
- Balance computed as `SUM(CREDIT) - SUM(DEBIT)` (never stored as computed field on ledger)
- Immutable by convention; DB-level enforce via triggers if needed

### 6.4 Pattern 4: Versioned Resource

Used by: WorkflowDefinition, Policy, FeatureFlag, NotificationTemplate, AgentDefinition

```
CREATE v1 → UPDATE v2 → UPDATE v3 → ... → ARCHIVE
```

Rules:
- Each update increments `version` counter
- Previous versions preserved for audit and rollback
- Active version is the highest-numbered non-archived version

---

## 7. OWNERSHIP MATRIX

### 7.1 Entity → Module → System of Record

| Entity | Owner Module | System of Record | CRUD Authority | Read Authority |
|--------|-------------|-----------------|---------------|---------------|
| User | IdentityModule | Prisma | IdentityModule | Self + Admin |
| Session | IdentityModule | Prisma | IdentityModule | Self |
| Company | CompaniesModule | Prisma | CompaniesModule | All (public fields) |
| CompanyMember | CompaniesModule | Prisma | CompaniesModule | Company scoped |
| Product | EnterpriseCatalogModule | Prisma + OpenSearch | SellerCompany | All (public) |
| CatalogItem | EnterpriseCatalogModule | Prisma + OpenSearch | Admin (import) | All |
| Category | EnterpriseCatalogModule | Prisma | Admin | All |
| GlobalBrand | EnterpriseCatalogModule | Prisma | Admin | All |
| GlobalAttribute | EnterpriseCatalogModule | Prisma | Admin | All |
| RFQ | CommerceModule | Prisma | BuyerCompany | Participant + Admin |
| Quote | CommerceModule | Prisma | SellerCompany | Participant + Admin |
| Order | CommerceModule | Prisma | CommerceModule | Participant + Admin |
| Negotiation | CommerceModule | Prisma | Participant companies | Participant + Admin |
| Payment | PaymentModule | Prisma | PaymentModule | Participant + Admin |
| Escrow | PaymentModule | Prisma | PaymentModule | Participant + Admin |
| Settlement | PaymentModule | Prisma | PaymentModule | Participant + Admin |
| CommissionRule | PaymentModule | Prisma | Admin | All |
| Refund | RefundModule | Prisma | RefundModule | Participant + Admin |
| GOCASH_Wallet | GocashModule | Prisma | GocashModule | Company self + Admin |
| GOCASH_Transaction | GocashModule | Prisma | GocashModule | Company self + Admin |
| TradTrustScore | TradTrustModule | Prisma | TradTrustModule | All (public) |
| CompanyVerification | TradTrustModule | Prisma | Admin | Company self + Admin |
| UserVerification | UserVerificationModule | Prisma | Admin | Self + Admin |
| Review | TradeServModule | Prisma | Authenticated user | All (public) |
| Booking | TradeservModule | Prisma | Participant companies | Participant + Admin |
| Proposal | TradeservModule | Prisma | Professional + Client | Participant + Admin |
| ProfessionalService | TradeservModule | Prisma | Professional company | All (public) |
| Community | TradeTalkModule | Prisma | Community owner + Admin | All (public/private gated) |
| SocialPost | TradeTalkModule | Prisma | Author + Admin | All (community scoped) |
| CrmLead | CrmModule | Prisma + ClickHouse | CrmModule | Admin |
| CrmCampaign | CrmModule | Prisma | Admin | Admin |
| KpiDefinition | EnterpriseIntelligenceModule | Prisma | Admin | Admin |
| KpiValue | EnterpriseIntelligenceModule | Prisma | IntelligenceModule | Admin |
| AlertDefinition | EnterpriseIntelligenceModule | Prisma | Admin | Admin |
| AlertEvent | EnterpriseIntelligenceModule | Prisma | IntelligenceModule | Admin |
| AgentDefinition | AiGatewayModule | Prisma | Admin | Admin |
| AgentSession | AiRuntimeModule | Prisma | AiRuntimeModule | Company self + Admin |
| Inference | AiRuntimeModule | Prisma | AiRuntimeModule | Company self + Admin |
| WorkflowDefinition | AiRuntimeModule | Prisma | Admin | Admin |
| KnowledgeGraph | AiOrchestratorModule | Prisma | Admin | Admin |
| MemoryFragment | AiOrchestratorModule | Prisma | Owned agent | Company self + Admin |
| AiCreditUsage | AiGatewayModule | Prisma | AiGatewayModule | Company self + Admin |
| Notification | NotificationModule | Prisma | NotificationModule | Target user + Admin |
| NotificationTemplate | NotificationModule | Prisma | Admin | All |
| NewsletterSubscriber | NotificationModule | Prisma | NotificationModule | Self + Admin |
| MarketingWorkflow | NotificationModule | Prisma | Admin | Admin |
| AuditLog | AuditModule | Prisma | AuditModule (append-only) | Admin |
| FeatureFlag | ConfigModule | Prisma | Admin | Admin |
| Policy | ConfigModule | Prisma | Admin | Admin |
| UsageEvent | GrowthIntelligenceModule | Prisma | TrackingModule | Admin |
| ReferralCode | ReferralModule | Prisma | Owner company | Owner + Admin |

---

## 8. SEARCH & INDEX STRATEGY

### 8.1 OpenSearch Indexes

| Index Name | Entity Type | Documents | Fields indexed | Use Case |
|-----------|-------------|-----------|---------------|----------|
| `products` | Product | All products | name, description, category, brand, price, specs, tags, status | Buyer product search |
| `catalog_items` | CatalogItem | Master catalog items | name, description, hsCode, keywords, synonyms, category | Autocomplete, AI search |
| `professionals` | ProfessionalService + Company | Service providers | name, category, pricing, location, rating, verification | TradeServ search |
| `companies` | Company | All companies | name, businessType, verificationLevel, gstin, description | Seller discovery |
| `rfqs` | RFQ | Open RFQs | title, description, category, budget, delivery date | Buyer-seller matching |
| `community_posts` | SocialPost | Active posts | title, content, tags, author, community | Social feed search |
| `categories` | CatalogCategory + Subcategory | All categories | name, description, parent | Taxonomy browser |
| `brands` | GlobalBrand | All brands | name, description, verification status | Brand directory |

### 8.2 Index Rules

- **Primary field**: `name` (edge_ngram + autocomplete analyzer)
- **Secondary**: `description` (standard analyzer)
- **Facet fields**: `category`, `status`, `verificationLevel`, `priceRange` (keyword)
- **Boost rules**: verified companies +2.0, featured products +1.5, recent items +1.2
- **Reindex trigger**: entity create/update/delete via event handler
- **Retry**: 3 attempts with exponential backoff, fallback to Prisma full-text search

### 8.3 Database Indexes (Composite)

See AGENTS.md Phase P-1.2 for full composite index definitions across 10 models.

---

## 9. AI CONSUMPTION STRATEGY

### 9.1 Entity → AI Consumption Matrix

| Entity | AI Feature | Data Consumed | Generated Output | Access Level |
|--------|-----------|---------------|-----------------|-------------|
| Product | Description generation | name, category, specs | ai_description | Public |
| Product | SEO generation | name, description, category | ai_seoTitle, ai_seoDescription | Public |
| Product | Translation | name, description | Multi-lang variants | Public |
| CatalogItem | Category suggestion | name, hsCode | suggested category ID | Admin |
| CatalogItem | Attribute suggestion | name, category | suggested attributes | Admin |
| RFQ | Requirements extraction | title, description | ai_requirements, ai_completeness | Participant |
| RFQ | Supplier suggestion | RFQ data + company data | supplier recommendations | Buyer only |
| Quote | Price analysis | quote + market data | ai_priceAnalysis, ai_winProbability | Seller only |
| Quote | Margin analysis | quote cost breakdown | margin recommendations | Seller only |
| Negotiation | Strategy | conversation history | ai_strategy, ai_riskScore | Participant |
| Negotiation | Sentiment | message history | sentiment trend | Participant |
| Review | Moderation | review content | moderation decision | Admin |
| SocialPost | Moderation | post content | ai_moderationScore, ai_moderationAction | Admin + Author |
| SocialPost | Content assist | draft content | suggestions (rewrite, grammar, hashtags) | Author |
| Company | Trust summary | all trust signals | ai_trustSummary, ai_confidence | Public |
| Booking | Scheduling insight | booking history | pattern recommendations | Professional |
| User | Personalization | user behavior | ai_preferences | Self only |

### 9.2 Data Access Levels

| Level | Description | Entities |
|-------|-------------|---------|
| **Public** | Visible to all authenticated users | Product (ai_description), Company (ai_trustSummary), CatalogItem (ai_keywords) |
| **Scoped** | Visible to participants + admin | RFQ ai_requirements, Quote ai_priceAnalysis, Negotiation ai_strategy |
| **Private** | Visible only to owner + admin | User ai_preferences, Company ai_personalization |
| **Internal** | Admin only | Moderation scores, fraud signals, system health |

### 9.3 Retention for AI Learning

- **Training data**: Anonymized aggregate signals only (never raw user data)
- **Feedback loop**: User accept/reject actions stored as positive/negative signals
- **Periodic purge**: Raw inference inputs purged after 90 days (configurable)
- **Opt-out**: Companies can opt out of training data contribution via FeatureFlag

---

## 10. DATA GOVERNANCE

### 10.1 Multi-Tenancy Rules

| Scope | Rule |
|-------|------|
| **Strict tenant isolation** | All B2B entities carry `companyId`. Cross-tenant access via explicit API gating. |
| **Cross-tenant reads** | Intentional and documented (e.g., buyer sees seller products, professional sees client bookings) |
| **Admin super-scope** | ADMIN/SUPER_ADMIN roles have cross-tenant read access. All admin actions audited. |
| **Public entities** | CatalogItem, CatalogCategory, GlobalBrand, GlobalAttribute are tenant-neutral |

### 10.2 Soft-Delete Policy

| Entity Category | Policy |
|----------------|--------|
| Financial (Payment, Escrow, Settlement, Ledger) | **No soft delete**. Immutable. Retention period: 10 years. |
| Business (Order, RFQ, Quote, Booking, Negotiation) | **No soft delete**. Status-based lifecycle. Retention: 7 years. |
| Catalog (Product, CatalogItem, Brand, Category) | **Soft delete** (`deletedAt`). Hard delete requires admin approval. |
| Social (Post, Community) | **Soft delete**. Author can delete; admin can restore. |
| Identity (User, Company) | **Soft delete**. Hard delete only for PII compliance. |
| Configuration (FeatureFlag, Policy) | **No delete**. Archive by setting `isActive = false`. |
| Audit (AuditLog) | **Immutability enforced**. Append-only. Retention: 10 years. |

### 10.3 Audit Coverage

Every mutation to the following entity categories MUST produce an AuditLog entry:

| Category | Events | Minimum Data |
|----------|--------|-------------|
| Financial | CREATE, STATUS_CHANGE, REVERSE | actor, target, previousState, newState |
| Commerce | CREATE, STATUS_CHANGE, CANCEL | actor, target, previousState, newState |
| Identity | CREATE, UPDATE, DELETE, LOGIN, LOGOUT | actor, target, action, ip |
| Trust | VERIFY, REJECT, SCORE_CHANGE | actor, target, previousScore, newScore |
| AI | INFERENCE, SESSION_START, SESSION_END | actor, target, tokenCount |
| Admin | All mutations | actor, target, action, full state diff |

### 10.4 Data Classification

| Level | Label | Examples | Handling |
|-------|-------|----------|---------|
| L1 | **Public** | Product names, catalog data, company public profiles | No restrictions |
| L2 | **Internal** | Order counts, revenue aggregates, RFQ titles | Auth required |
| L3 | **Confidential** | Pricing, negotiations, lead data, verification docs | Auth + audit + encryption at rest |
| L4 | **Restricted** | Payment details, PII, passwords, tokens, API keys | Auth + audit + encryption at rest + encryption in transit + access logging |

### 10.5 Retention Schedule

| Data Category | Retention | Purge Action |
|--------------|-----------|-------------|
| Audit logs | 10 years | Archive to cold storage, then delete |
| Financial records | 10 years | Archive to cold storage, then delete |
| Business records | 7 years | Soft delete → hard delete |
| Sessions | 90 days after expiry | Hard delete |
| AI inference inputs | 90 days | Hard delete (or anonymized aggregate) |
| AI inference outputs | 1 year | Hard delete |
| Usage events | 2 years | Aggregate → delete raw |
| Notifications | 1 year | Hard delete |
| Cache entries | TTL-based (max 7 days) | Redis eviction |
| Logs (application) | 30 days | Log rotation |

---

## 11. CANONICAL NAMING STANDARDS

### 11.1 Entity Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Entity names | PascalCase, singular | `User`, `CompanyMember`, `TradTrustScore` |
| Database tables | PascalCase (Prisma convention) | `User`, `CompanyMember`, `GOCASH_Wallet` |
| Join tables | Concatenated entity names | `_CategoryToProduct`, `UserRole` |
| Enum names | PascalCase | `OrderStatus`, `PaymentMethod`, `TransactionType` |
| Enum values | UPPER_SNAKE_CASE | `PENDING`, `IN_PROGRESS`, `COMPLETED` |

### 11.2 Field Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Primary Key | `id` | `id String @id @default(cuid())` |
| Foreign Key | `{entity}Id` camelCase | `companyId`, `userId`, `orderId` |
| Timestamps | camelCase, `At` suffix | `createdAt`, `updatedAt`, `deletedAt` |
| Boolean | `is` prefix | `isActive`, `isVerified`, `isFeatured` |
| Amounts | `amount` suffix | `amount`, `commissionAmount`, `netAmount` |
| Counts | `Count` suffix | `memberCount`, `postCount`, `usageCount` |
| JSON metadata | `metadata` | `metadata Json?` |
| AI fields | `ai_` prefix | `ai_summary`, `ai_confidence`, `ai_keywords` |
| Soft delete | `deletedAt` | `deletedAt DateTime?` |
| Version | `version` | `version Int @default(1)` |

### 11.3 Relationship Naming

| Type | Convention | Example |
|------|-----------|---------|
| 1:1 | Singular, field = related entity name | `company Company @relation` |
| 1:N | Plural, field = plural entity name | `products Product[]` |
| M:N | Implicit join table | `@manyToMany` (Prisma implicit) |
| Self-ref | Descriptive role name | `parent Category? @relation("CategoryParent")` |

---

## 12. DATA READINESS CHECKLIST

### 12.1 Per-Entity Checklist

Every entity in the catalog must satisfy:

| # | Check | Verification |
|---|-------|-------------|
| 1 | Entity has a clear domain owner | Module name in Ownership Matrix |
| 2 | Entity has at least one unique identifier | `@id` or `@unique` constraint |
| 3 | Entity has `createdAt` timestamp | `DateTime @default(now())` |
| 4 | Entity has `updatedAt` timestamp | `DateTime @updatedAt` |
| 5 | Entity has explicit `onDelete` policy for all relations | RESTRICT, SET_NULL, CASCADE |
| 6 | Financial entities have `idempotencyKey` | `String @unique` |
| 7 | Tenant-scoped entities have `companyId` | `String` with index |
| 8 | AI-enriched entities have `ai_` metadata fields | At minimum `ai_confidence` |
| 9 | Immutable entities have no `updatedAt` | Audit-only pattern |
| 10 | Soft-deletable entities have `deletedAt` | `DateTime?` |
| 11 | Status-based entities have valid state machine | Transitions documented in service layer |
| 12 | Amount fields are `Int` (smallest currency unit) | `amount Int` |
| 13 | Currency fields have sensible default | `currency String @default("INR")` |
| 14 | JSON fields have documented schema | In DTO or code comments |
| 15 | Indexes exist for all FK fields that are queried | `@@index` or `@index` |
| 16 | Composite indexes exist for common query patterns | `@@index([companyId, status])` |
| 17 | Audit logging is configured for mutating operations | AuditLog.create() in service |
| 18 | Soft-delete queries filter `WHERE deletedAt IS NULL` | Default scope in service |
| 19 | Validation rules exist in DTO layer | class-validator decorators |
| 20 | Entity is registered in the data catalog | This document |

### 12.2 Domain-Level Checks

| # | Check | Verification |
|---|-------|-------------|
| 1 | All entities in domain have documented relationships | Relationship Model section |
| 2 | Cross-domain dependencies are documented | Cross-Domain Relationship Map |
| 3 | System of Record is identified for each entity | Ownership Matrix |
| 4 | CRUD authority is documented and enforced | Ownership Matrix + API guards |
| 5 | Data classification level is documented | Data Classification section |
| 6 | Retention policy is documented | Retention Schedule section |
| 7 | Search index requirements are documented | Search & Index Strategy section |

### 12.3 Governance Checks

| # | Check | Verification |
|---|-------|-------------|
| 1 | Multi-tenancy rules are documented | Multi-Tenancy Rules section |
| 2 | Soft-delete policy is documented | Soft-Delete Policy section |
| 3 | Audit coverage is documented | Audit Coverage section |
| 4 | Data classification is documented | Data Classification section |
| 5 | Retention schedule is documented | Retention Schedule section |
| 6 | AI data consumption is documented | AI Consumption Strategy section |
| 7 | PII handling is documented | Soft-Delete Policy + PII purge in lifecycle |
| 8 | GDPR compliance is documented | Hard-delete for PII purge |
| 9 | Backup/recovery strategy exists | Operations documentation |
| 10 | Data migration strategy exists | PRP-03A remediation plan |

---

> **End of TRADINGO Data Model Specification v1.0**
>
> *"Design is complete. Implementation may begin. The data model is the single source of truth for all entity definitions, relationships, and data governance."*
