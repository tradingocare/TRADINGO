# TRADINGO Prisma Schema

> Source: `E:\tradingo\prisma\schema.prisma` (6,884 lines)

## Generator & Datasource

```prisma
generator client {
  provider        = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Enum Inventory (160 enums)

### Core Business Enums
| Enum | Values | Used By |
|------|--------|---------|
| `Role` | SUPER_ADMIN, ADMIN, MANAGER, SELLER, BUYER, RM, VIEWER | User |
| `BusinessType` | MANUFACTURER, EXPORTER, IMPORTER, DISTRIBUTOR, WHOLESALER, RETAILER, TRADER, BROKER, SERVICE_PROVIDER, OEM, CONTRACT_MANUFACTURER | Company |
| `CompanyStatus` | ACTIVE, INACTIVE, SUSPENDED, VERIFIED | Company |
| `VerificationLevel` | LEVEL_0 through LEVEL_6 (7 levels) | Company, User |
| `VerificationStatus` | PENDING, APPROVED, REJECTED | CompanyVerification, UserVerification |
| `SubscriptionStatus` | TRIAL, ACTIVE, EXPIRED, SUSPENDED, CANCELLED | Company, MembershipPlan |

### Product & Catalog Enums (12)
`ProductType`, `ProductStatus`, `ProductApprovalAction`, `BrandStatus`, `MediaType`, `StockStatus`, `ClaimStatus`, `VariantType` (20 values), `DraftStatus`, `FieldType` (13 values), `TemplateFieldType` (19 values), `ReviewStatus`

### RFQ & Quote Enums (8)
`RfqType`, `RfqStatus` (10 states), `RfqVisibility`, `RfqUrgency`, `RfqAttachmentType`, `RfqSource`, `QuoteStatus` (8 states), `QuoteEventType`

### Order & Fulfillment Enums (13)
`OrderSource`, `OrderType`, `OrderStatus` (11 states), `CancellationActor`, `CancellationReason`, `DeliveryMethod`, `ReturnReason`, `ReturnStatus`, `DeliveryTerms` (11 values), `PaymentTerms` (13 values), `DeliveryStatus` (8 states), `ShipmentStatus` (10 states), `ShipmentType` (6 types)

### Financial Enums (18)
`PaymentGateway` (6), `PaymentStatus` (6), `PaymentType` (5), `InvoiceStatus` (7), `TaxType` (4), `CreditStatus`, `CreditApprovalStatus`, `CreditTransactionType`, `CreditNoteStatus`, `DebitNoteStatus`, `DiscountType`, `RiskLevel` (4), `CollectionActionType`, `EscrowStatus` (11 states), `EscrowEventType`, `SettlementStatus` (8 states), `SettlementEventType`, `ManualPaymentVerificationStatus`, `ManualPaymentMethod`

### GOCASH Enums (10)
`GOCASHWalletType` (BUYER/SELLER/ADMIN), `GOCASHWalletStatus` (ACTIVE/LOCKED/SUSPENDED/EXPIRED), `GOCASHLedgerDirection` (CREDIT/DEBIT), `GOCASHLedgerStatus` (PENDING/SUCCESS/FAILED/REVERSED), `GOCASHTransactionType` (16 values), `GOCASH_CampaignType` (5), `GOCASH_CampaignStatus` (5), `GOCASH_ReferralStatus`, `GOCASH_RedemptionType` (6), `GOCASH_RedemptionStatus`

### Campaign & Advertising Enums (8)
`CampaignType` (13 values including AI), `CampaignStatus` (7 states), `CampaignTargetType` (12 types), `CampaignClaimStatus` (5 states), `AdType` (9 types), `AdStatus` (8 states), `AdPricingModel` (3), `AdTargetType` (7)

### Notification Enums (5)
`NotificationChannel` (5), `NotificationType` (135 values across 12 categories), `NotificationPriority` (4), `NotificationStatus` (6), `NotificationAlertPeriod`

### AI Enums (5)
`AiJobStatus`, `AiJobType` (8), `AiProviderStatus` (4), `TaskType` (21 values), `AiCreditPeriod` (3)

### Ecosystem Enums (7)
`EcosystemLevelName` (8 levels), `EcosystemMissionPeriod`, `EcosystemLeaderboardPeriod`, `EcosystemLeaderboardCategory`, `EcosystemRewardType` (6), `EcosystemXPReason` (33 values), `EcosystemEntityStatus` (7), `EcosystemStreakType`, `EcosystemMissionActionType` (16 values)

### Negotiation, PO, Shipment Enums (6)
`NegotiationStatus` (8 states), `NegotiationEventType` (10), `PurchaseOrderStatus` (9), `PoEventType` (11), `ShipmentStatus`, `ShipmentType`

### Other Enums (30+)
`AnalyticsEventType`, `DocumentType`, `ExportJobStatus`, `ExportType`, `Priority`, `ListStatus`, `DownloadType`, `FileScanStatus`, `PlanType` (8), `PlanVisibility` (4), `ReputationEventType` (11), `ReferralCodeType`, `ReferralStatus`, `GalleryModerationStatus`, `LocationType`, `LocationSource`, `LocationConfidence`, `BetaInviteStatus`, `FeedbackType`, `FeedbackStatus`, `TicketStatus`, `TicketPriority`, `BetaOnboardingStep`, `ChecklistStatus`, `IncidentSeverity`, `IncidentStatus`, `DisputeType`, `DisputeReason`, `DisputeStatus`, `ResolutionType`, `ConversationType`, `ConversationSource`, `MessageStatus`, `MessageType`, `ParticipantRole`, `ModerationAction`, `CrmLeadStatus`, `CrmPriority`, `CrmLeadSource`, `CrmFollowUpStatus`, `CrmTaskType`, `CrmTaskStatus`, `OrgMemberRole`, `InvitationStatus`, `GeographicReach`, `OnboardingStep`, `CertificationType`, `CertificationStatus`, `PlanChangeType`

## Key Model Categories

### Identity & Access (7 models)
`User` (48 fields), `Session`, `Organization`, `OrganizationMember`, `OrganizationInvitation`, `VendorCode`, `VendorCodeSequence`

### Company & Verification (12 models)
`Company` (113 fields — largest model), `CompanyOwner`, `CompanyLocation`, `CompanyCategory`, `CompanyIndustry`, `CompanyVerification`, `CompanyVerificationDocument`, `CompanyCertification`, `CompanyGalleryImage`, `CompanyOnboardingLog`, `UserVerification`, `UserVerificationDocument`

### Product Catalog (18 models)
`Product` (65 fields), `ProductMedia`, `ProductSpecification`, `ProductVariant`, `VariantInventory`, `ProductInventory`, `ProductPriceSlab`, `ProductDraft`, `ProductDraftMultiLangDesc`, `ProductMaster`, `ProductAttribute`, `ProductTranslation`, `ProductAlias`, `ProductClaim`, `ProductBestsellerSnapshot`, `Category`, `CategoryBestsellerSnapshot`, `SellerBestsellerSnapshot`

### RFQ & Quote (8 models)
`Rfq` (52 fields), `RfqVendorMatch`, `RfqCreditPack`, `RfqCreditLedger`, `RfqNumberCounter`, `RfqAnalytics`, `RfqAnalyticsEvent`, `Quote` (40 fields)

### Order & Fulfillment (14 models)
`Order` (55 fields), `OrderItem`, `OrderLocation`, `OrderTimelineEvent`, `OrderDocument`, `OrderCancellation`, `OrderReturn`, `OrderNumberCounter`, `PurchaseOrder` (51 fields), `Shipment` (38 fields), `Delivery` (30 fields), `Negotiation` (37 fields)

### Financial (14 models)
`Payment` (25 fields), `Invoice`, `InvoiceItem`, `InvoiceHistory`, `TaxBreakdown`, `InvoiceSequence`, `CreditNote`, `DebitNote`, `CollectionNote`, `CollectionTimelineEvent`, `BuyerCredit`, `CreditHistory`, `CreditApproval`, `Coupon`

### Trust & Safety (8 models)
`TradTrustScore`, `ReputationEvent`, `Dispute` (41 fields), `DisputeMessage`, `DisputeDocument`, `DisputeProcessorExecution`, `Escrow`, `Settlement`

### GOCASH (3 core + ecosystem)
`GOCASH_Wallet`, `GOCASH_Transaction`, `GOCASH_Redemption`, `EcosystemUserLevel`, `EcosystemLevel`, `EcosystemBadge`, `EcosystemUserBadge`, `EcosystemMission`, `EcosystemUserMission`, `EcosystemAchievement`, `EcosystemUserAchievement`, `EcosystemDailyCheckin`, `EcosystemStreak`, `EcosystemXPTransaction`, `EcosystemLeaderboardConfig`

### Campaign, Referral, Advertising (10 models)
`Campaign`, `CampaignRule`, `CampaignTarget`, `CampaignClaim`, `CampaignAnalytics`, `ReferralCode`, `ReferralUsage`, `ReferralReward`, `ReferralAudit`, `ReferralRule`, `ReferralBlacklist`, `Advertisement` (37 fields), `AdTarget`, `AdAnalytics`

### AI (4 models)
`AiProvider` (26 fields), `AiPrompt`, `AiUsage`, `AiCreditUsage`

### Communication (12 models)
`Conversation`, `ConversationParticipant`, `Message`, `MessageAttachment`, `BlockedUser`, `ReportedMessage`, `ConversationLabel`, `ConversationLabelAssignment`, `ConversationAuditLog`, `SavedTemplate`, `ModerationRule`

### Analytics (5 models)
`AnalyticsEvent`, `UsageEvent`, `ErrorEvent`, `ChatEvent`, `OrderAnalyticsEvent`

### CRM (5 models)
`CrmLead`, `CrmFollowUp`, `CrmNote`, `CrmTask`, `CrmTimelineEvent`

### Standalone (40+ models)
Configuration, analytics, tracking, and utility tables with no or self-only relations.

## Key Index Coverage

| Model | Indexes | Key Indexes |
|-------|---------|-------------|
| Shipment | 10 | status, companyId, orderId, dates, tracking |
| Order | 9 | status, buyerId, sellerId, orderNumber, dates |
| Product | 9 | status, companyId, categoryId, price, date |
| Dispute | 9 | status, orderId, parties, dates |
| GOCASH_Transaction | 8 | walletId, type, direction, idempotencyKey, date |
| Company | 8 | status, ownerId, verification, date |
| Rfq | 8 | status, companyId, category, date |
| Delivery |8 | status, shipmentId, orderId, date |
| CampaignClaim | 8 | campaignId, status, companyId, dates |

## Prisma Client Usage

The `PrismaService` at `apps/api/src/prisma/prisma.service.ts` extends `PrismaClient` and is registered as a `@Global()` module, making it available across all modules without explicit imports:

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```
