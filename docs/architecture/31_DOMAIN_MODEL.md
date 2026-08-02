# TRADINGO Domain Model

> Core domain entities and their relationships.

## Core Domains

### Identity Domain
```
User ──┬── Session (1:N)
       ├── CompanyOwner (1:N)
       ├── OrganizationMember (1:N)
       ├── UserVerification (1:1)
       ├── GOCASH_Wallet (1:1)
       ├── EcosystemUserLevel (1:1)
       └── Notification (1:N)
```

### Company Domain
```
Company ──┬── CompanyOwner (1:N)
          ├── CompanyLocation (1:N)
          ├── CompanyVerification (1:1)
          ├── CompanyCertification (1:N)
          ├── CompanyCategory (1:N)
          ├── CompanyIndustry (1:N)
          ├── Product (1:N)
          ├── Rfq (1:N)
          ├── Quote (1:N)
          ├── Order (1:N) [buyer + seller]
          ├── GOCASH_Wallet (1:1)
          ├── Advertisement (1:N)
          └── Campaign (1:N)
```

### Product Domain
```
Product ──┬── ProductMedia (1:N)
          ├── ProductSpecification (1:N)
          ├── ProductVariant (1:N)
          ├── ProductPriceSlab (1:N)
          ├── ProductInventory (1:1)
          ├── ProductAttribute (1:N)
          ├── ProductTranslation (1:N)
          ├── Review (1:N)
          ├── Q&A (1:N)
          └── Wishlist (1:N)
```

### Trading Domain
```
Rfq ──┬── Quote (1:N)
      ├── RfqVendorMatch (1:N)
      └── Negotiation (1:N)
      
Quote ──┬── QuoteLineItem (1:N)
        ├── QuoteAttachment (1:N)
        └── Negotiation (1:N)

Negotiation ──┬── PurchaseOrder (1:1)
              └── NegotiationEvent (1:N)

PurchaseOrder ──┬── Order (1:1)

Order ──┬── OrderItem (1:N)
        ├── OrderTimelineEvent (1:N)
        ├── OrderDocument (1:N)
        ├── Shipment (1:N)
        ├── Payment (1:N)
        ├── Escrow (1:1)
        ├── Dispute (1:N)
        └── Invoice (1:N)

Shipment ──┬── Delivery (1:1)

Delivery ──┬── DeliveryEvent (1:N)
```

### Financial Domain
```
Payment ──┬── Invoice (1:1)
          ├── Refund (1:N)
          ├── ManualPaymentProof (1:N)
          └── Escrow (1:1)

Escrow ──┬── EscrowEvent (1:N)
         └── Settlement (1:N)

Settlement ──┬── SettlementEvent (1:N)

Invoice ──┬── InvoiceItem (1:N)
          ├── InvoiceHistory (1:N)
          └── TaxBreakdown (1:N)
```

### Trust Domain
```
CompanyVerification ──┬── CompanyVerificationDocument (1:N)
UserVerification ──┬── UserVerificationDocument (1:N)
TradTrustScore ── Company (1:1)
ReputationEvent ── User (1:N)
Dispute ──┬── DisputeMessage (1:N)
          ├── DisputeDocument (1:N)
          └── DisputeProcessorExecution (1:N)
```

### GOCASH Domain
```
GOCASH_Wallet ──┬── GOCASH_Transaction (1:N)
                └── GOCASH_Redemption (1:N)

EcosystemUserLevel ── User (1:1)
EcosystemUserBadge ── User (1:N)
EcosystemUserMission ── User (1:N)
EcosystemUserAchievement ── User (1:N)
EcosystemXPTransaction ── User (1:N)
EcosystemDailyCheckin ── User (1:N)
EcosystemStreak ── User (1:N)
```

### Communication Domain
```
Conversation ──┬── Message (1:N)
               ├── ConversationParticipant (1:N)
               └── ConversationLabel (1:N)
               
Message ──┬── MessageAttachment (1:N)
          └── MessageStatus (1:N)
```

### CRM Domain
```
CrmLead ──┬── CrmFollowUp (1:N)
          ├── CrmNote (1:N)
          ├── CrmTask (1:N)
          └── CrmTimelineEvent (1:N)
```

### Campaign & Advertising Domain
```
Campaign ──┬── CampaignRule (1:N)
           ├── CampaignTarget (1:N)
           ├── CampaignClaim (1:N)
           └── CampaignAnalytics (1:N)

Advertisement ──┬── AdTarget (1:N)
                └── AdAnalytics (1:N)
```
