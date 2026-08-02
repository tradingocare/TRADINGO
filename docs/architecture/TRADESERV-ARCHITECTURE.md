# TradeServ™ Architecture Proposal

## TRADINGO® — The World's Most Intelligent AI-Powered B2B Commerce & Professional Services Ecosystem

---

# OUTPUT 1: COMPLETE EXISTING AUDIT

## 1.1 Authentication Module (apps/api/src/modules/auth/)

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `auth.service.ts` (713 lines, 23 methods) | **EXISTING** | ✅ FULL | JWT+Refresh token OTP, OAuth, brute-force protection, session management |
| `auth.controller.ts` (26 endpoints) | **EXISTING** | ✅ FULL | register, login, OAuth, OTP, password reset, session management |
| `JwtStrategy` | **EXISTING** | ✅ FULL | Bearer token, payload: `{sub, email, role, permissions}` |
| `RefreshTokenStrategy` | **EXISTING** | ✅ FULL | 7-day rotation, SHA-256 hashed storage |
| `GoogleStrategy` / `LinkedInStrategy` | **EXISTING** | ✅ FULL | Auto-creates BUYER role users |
| DTOs (10 files) | **EXISTING** | ✅ FULL | All class-validator decorators |
| RBAC Guards (4) | **EXISTING** | ✅ FULL | JwtAuthGuard, RolesGuard, PermissionsGuard, CompanyOwnerGuard |

## 1.2 User Model (prisma schema, lines 881-934)

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `User` model (24 fields) | **EXISTING** | ✅ FULL | **NEVER DUPLICATE** |
| `Role` enum (7 values) | **EXISTING** | ✅ FULL | SUPER_ADMIN, ADMIN, MANAGER, SELLER, BUYER, RM, VIEWER |
| `VerificationLevel` enum (7 levels) | **EXISTING** | ✅ FULL | LEVEL_0 through LEVEL_6 |
| `Session` model | **EXISTING** | ✅ FULL | Already handles device tracking |
| 22 User relations | **EXISTING** | ✅ FULL | |

## 1.3 Company Model (prisma schema, lines 1081-1206)

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `Company` model (45 fields) | **EXISTING** | ✅ FULL | **NEVER DUPLICATE** |
| `CompanyOwner` join table | **EXISTING** | ✅ FULL | Many-to-many with isPrimary |
| `CompanyLocation` model | **EXISTING** | ✅ FULL | 23 fields, geocoding support |
| `BusinessType` enum (11 values) | **EXISTING** | ⚠️ EXTEND | Add `PROFESSIONAL`, `CONSULTANCY`, `FREELANCER` |
| `CompanyStatus` enum (4 values) | **EXISTING** | ✅ FULL | ACTIVE, INACTIVE, SUSPENDED, VERIFIED |
| `OnboardingStep` enum (6 values) | **EXISTING** | ⚠️ EXTEND | Add professional-specific onboarding steps |

## 1.4 Membership & Plans

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `MembershipPlan` model | **EXISTING** | ✅ FULL | **NEVER DUPLICATE** |
| `PlanFeature` model | **EXISTING** | ✅ FULL | Extensible via feature strings |
| `PlanType` enum (7 values) | **EXISTING** | ⚠️ EXTEND | Add `TRADE_PROFESSIONAL_INDIVIDUAL`, `TRADE_PROFESSIONAL_COMPANY` |
| `SubscriptionStatus` enum | **EXISTING** | ✅ FULL | TRIAL, ACTIVE, EXPIRED, SUSPENDED, CANCELLED |
| `membership.service.ts` (40 methods) | **EXISTING** | ✅ FULL | Order, payment, activation, cancel, coupon, referral |
| `membership.controller.ts` (14 endpoints) | **EXISTING** | ✅ FULL | JWT-guarded customer endpoints |
| `membership-admin.controller.ts` (21 endpoints) | **EXISTING** | ✅ FULL | ADMIN-only management |
| Plan pricing (₹6K-₹150K/yr) | **EXISTING** | ⚠️ EXTEND | Add ₹2,499 Individual / ₹5,999 Company plans |
| `Payment` model | **EXISTING** | ✅ FULL | SUPPORTs SUBSCRIPTION type |
| `Invoice` model | **EXISTING** | ✅ FULL | FULL billing, GST, PDF support |

## 1.5 TradTrust (apps/api/src/modules/tradtrust/)

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `TradTrustService` (17 methods, 550 lines) | **EXISTING** | ✅ FULL | 6 profile dimensions + 8 behavioral dimensions - 2 penalties |
| `TradTrustController` (8 endpoints) | **EXISTING** | ✅ FULL | Score, breakdown, history, recalculate |
| `TradTrustScore` model | **EXISTING** | ✅ FULL | 16-factor JSON breakdown |
| Scoring formula (profile + behavioral - penalty) | **EXISTING** | ⚠️ EXTEND | Add professional-specific factors (portfolio, certifications, languages) |
| Grading (A+→D, 6 levels) | **EXISTING** | ✅ FULL | |
| Risk levels (Low/Critical, 4 levels) | **EXISTING** | ✅ FULL | |

## 1.6 Location Intelligence & Near→Far→Best™

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `LocationIntelligenceService` | **EXISTING** | ✅ FULL | Geocoding, nearby search, clusters |
| `GeocodingService` (Nominatim OSM) | **EXISTING** | ✅ FULL | Reverse geocode, forward geocode |
| `MarketplaceIntelligenceService` | **EXISTING** | ⚠️ EXTEND | 14-factor BestSupplierEngine — adapt for Professionals |
| `MarketplaceIntelligenceEngine` | **EXISTING** | ⚠️ EXTEND | 16-factor unified score, expansion radii |
| BuyerHistoryService | **EXISTING** | ✅ FULL | Category preferences, relationship scoring |
| `CompanyLocation` model | **EXISTING** | ✅ FULL | Lat/lng, geocoding, service radius |
| `GeoCluster` model | **EXISTING** | ✅ FULL | |
| `Territory` model | **EXISTING** | ✅ FULL | RM territory management |

## 1.7 CRM (apps/api/src/modules/crm/)

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `CrmService` (12 methods) | **EXISTING** | ✅ FULL | FULL lead management pipeline |
| `CrmLead` model (16 fields) | **EXISTING** | ✅ FULL | Status, priority, source, score, value |
| `CrmFollowUp` / `CrmTask` / `CrmNote` | **EXISTING** | ✅ FULL | Sub-resources with full CRUD |
| `CrmPipelineStage` model | **EXISTING** | ✅ FULL | Customizable pipeline stages |
| `CrmTimelineEvent` model | **EXISTING** | ✅ FULL | Activity log per lead |
| `AiCrmService` (12 AI methods) | **EXISTING** | ✅ FULL | AI scoring, next action, forecasting, sentiment |
| Sub-services (10) | **EXISTING** | ✅ FULL | Follow-up, note, task, timeline, pipeline, search, report |
| FRONTEND Hooks (23) | **EXISTING** | ✅ FULL | useLeads, useLead, useCreateLead, etc. |
| FRONTEND API (19 functions) | **EXISTING** | ✅ FULL | FULL typed API client |

**CRITICAL FINDING**: CRM is already 90% ready for TradeServ. Every professional gets a CRM as a default feature.

## 1.8 AI Gateway (apps/api/src/modules/ai-gateway/)

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `AiGatewayService` | **EXISTING** | ✅ FULL | 5 providers, fallback chain, circuit breaker, caching |
| `AiCreditsService` | **EXISTING** | ✅ FULL | Per-plan credit limits, monthly reset |
| `ProviderRegitryService` | **EXISTING** | ✅ FULL | 5 providers: OpenRouter, Gemini, Groq, Tavily, Firecrawl |
| `PromptManagerService` | **EXISTING** | ✅ FULL | DB-stored prompts with versioning |
| `UsageTrackerService` | **EXISTING** | ✅ FULL | Tracking, cost calculation |
| `TaskType` enum (21 values) | **EXISTING** | ⚠️ EXTEND | Add `PROFILE_REVIEW`, `BIO_GENERATION`, `PORTFOLIO_SUGGESTION`, `SERVICE_DESCRIPTION`, `LEAD_REPLY` |
| CONTROLLER (16 endpoints) | **EXISTING** | ✅ FULL | process, stream, providers, prompts, credits |
| ADMIN CONTROLLER (14 endpoints) | **EXISTING** | ✅ FULL | Dashboard, usage, health, cache |

**CRITICAL FINDING**: Every TradeServ AI feature routes through the existing AI Gateway. No new AI module needed.

## 1.9 Notification System (apps/api/src/modules/notification/)

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `NotificationService` | **EXISTING** | ✅ FULL | Global module, 2-tier templates |
| `NotificationTemplateService` | **EXISTING** | ✅ FULL | DB + fallback templates |
| `Notification` model (96+ types) | **EXISTING** | ✅ FULL | GOCASH_REWARD, TRUST_BADGE_EARNED, etc. |
| `NotificationGateway` (WebSocket) | **EXISTING** | ✅ FULL | Real-time delivery |
| FRONTEND NotificationProvider | **EXISTING** | ✅ FULL | Context-based, Socket.IO listener |
| FRONTEND NotificationDrawer | **EXISTING** | ✅ FULL | Bell icon, unread count |
| FRONTEND API + Hooks | **EXISTING** | ✅ FULL | useNotifications, useUnreadCount |

## 1.10 Documents & KYC

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `CompanyVerification` model | **EXISTING** | ✅ FULL | Submit, review, level upgrade |
| `UserVerification` model | **EXISTING** | ✅ FULL | Submit, review, level upgrade |
| `DocumentType` enum (7 values) | **EXISTING** | ⚠️ EXTEND | Add `DIPLOMA`, `PROFESSIONAL_CERTIFICATE`, `PORTFOLIO`, `BUSINESS_REGISTRATION`, `LIABILITY_INSURANCE` |
| `FileScan` model | **EXISTING** | ❌ UNUSED | Model exists but no service implementation |
| `VerificationLevel` enum | **EXISTING** | ✅ FULL | LEVEL_0→LEVEL_6 |

## 1.11 Payments & Billing

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| `PaymentService` (514 lines) | **EXISTING** | ✅ FULL | Razorpay + Stripe, refunds, webhooks |
| `InvoiceService` (246 lines) | **EXISTING** | ✅ FULL | GST compliance, invoice numbering |
| `TaxService` (73 lines) | **EXISTING** | ✅ FULL | CGST/SGST/IGST calculation |
| `Escrow` / `Settlement` models | **EXISTING** | ✅ FULL | Order lifecycle protection |
| `ManualPaymentProof` model | **EXISTING** | ✅ FULL | Offline payment verification |

## 1.12 Existing Frontend Components

| Component | Status | Reusable | Notes |
|-----------|--------|----------|-------|
| Dashboard framework | **EXISTING** | ✅ FULL | DashboardPageHeader, StatCard, Skeleton patterns |
| Ecosystem widgets | **EXISTING** | ✅ FULL | XPProgressBar, LevelCard, BadgeCard, Leaderboard |
| Wallet pages | **EXISTING** | ✅ FULL | Transaction filters, timeline, analytics bars |
| Profile pages | **EXISTING** | ✅ FULL | Company profile with multi-section layout |
| Search | **EXISTING** | ✅ FULL | FilterSidebar, search results, pagination |
| Chat/Messaging | **EXISTING** | ✅ FULL | Conversation list, message threads |
| Rating/Review components | **EXISTING** | ✅ FULL | Star ratings, review cards |
| Notification components | **EXISTING** | ✅ FULL | NotificationDrawer, NotificationProvider |
| Navigation framework | **EXISTING** | ✅ FULL | master-data.ts nav definitions, role-based menus |

---

# OUTPUT 2: ARCHITECTURE PROPOSAL

## 2.1 Core Philosophy

TradeServ is **NOT** a separate platform. It is a **professional services vertical** within TRADINGO, sharing:

- **IDENTITY**: Same User, Same Company, Same Auth
- **TRUST**: Same TradTrust scoring engine
- **INTELLIGENCE**: Same AI Gateway, same 5 providers
- **PAYMENTS**: Same Razorpay/Stripe integration
- **CRM**: Same lead management pipeline
- **MESSAGING**: Same business chat platform
- **NOTIFICATIONS**: Same real-time delivery
- **SEARCH**: Same OpenSearch index
- **MEMBERSHIP**: Same subscription/pricing engine
- **ADMIN**: Same admin panel framework

## 2.2 Professional Identity — The `ProfessionalProfile` Concept

Instead of creating a new `Professional` model (which would duplicate User), **extend the existing `Company` model** with a `professionalType` flag.

### Why Company and not User?
1. Professionals have business profiles (logo, banner, description, GST/PAN)
2. Professionals have memberships (subscription plans)
3. Professionals need TradTrust scoring
4. Professionals need locations (office address, service area)
5. Professionals need KYC/verification
6. Company already has all these fields

### Solution:
- Add `professionalType: ProfessionalType?` to Company (null = traditional seller/buyer)
- Add `ProfessionalProfile` model for professional-specific extended data
- Add `ProfessionalService` model for services offered
- Add `ProfessionalPortfolio` model for portfolio items
- Add `ProfessionalCertification` model for certifications
- Add `ProfessionalAvailability` model for availability
- Add `ProfessionalLanguage` model for languages spoken

## 2.3 Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│                   TRADESERV UI                      │
│  (Next.js App Router, Dark Theme, Premium Design)   │
├─────────────────────────────────────────────────────┤
│                  PRESENTATION LAYER                 │
│  ProfessionalProfilePage  SearchPage  Dashboard     │
│  ServiceListingPage       BookingPage  CRM          │
├─────────────────────────────────────────────────────┤
│                   API GATEWAY                       │
│  (NestJS Controllers, JWT Auth, RBAC, Rate Limit)   │
├─────────────────────────────────────────────────────┤
│                  BUSINESS LAYER                     │
│  ProfessionalProfileService   SearchService         │
│  ServiceListingService        BookingService        │
│  AIService (via AI Gateway)   CRMModule             │
├─────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE                     │
│  TradTrust  AI Gateway  CRM  Notification           │
│  Membership Payment    Chat  OpenSearch             │
│  LocationIntelligence  KYC   Analytics              │
├─────────────────────────────────────────────────────┤
│                    DATA LAYER                       │
│  Prisma ORM → PostgreSQL → Redis → OpenSearch       │
└─────────────────────────────────────────────────────┘
```

## 2.4 Module Architecture

```
tradeserv/
├── tradeserv.module.ts           ← Root module (registered in AppModule)
├── professional-profile/
│   ├── professional-profile.service.ts
│   ├── professional-profile.controller.ts
│   ├── dto/
│   └── professional-profile.module.ts
├── professional-services/
│   ├── professional-services.service.ts
│   ├── professional-services.controller.ts
│   ├── dto/
│   └── professional-services.module.ts
├── professional-portfolio/
│   ├── professional-portfolio.service.ts
│   ├── professional-portfolio.controller.ts
│   ├── dto/
│   └── professional-portfolio.module.ts
├── professional-search/
│   ├── professional-search.service.ts
│   ├── professional-search.controller.ts
│   ├── dto/
│   └── professional-search.module.ts
├── professional-booking/
│   ├── professional-booking.service.ts
│   ├── professional-booking.controller.ts
│   ├── dto/
│   └── professional-booking.module.ts
├── professional-discovery/
│   ├── professional-discovery.service.ts
│   ├── professional-discovery.controller.ts
│   └── professional-discovery.module.ts
└── professional-admin/
    ├── professional-admin.controller.ts
    └── professional-admin.module.ts
```

All sub-modules registered in the parent `TradeServModule`, which is registered in `AppModule`.

---

# OUTPUT 3: INFORMATION ARCHITECTURE

## 3.1 Professional Registration Flow

```
User Registration
    │
    ├── [Existing] Register as SELLER
    │       │
    │       └── Set professionalType = CONSULTANT | FREELANCER | AGENCY
    │
    └── [New] Register as PROFESSIONAL (new flow)
            │
            ├── Step 1: Basic Details (name, email, mobile, password)
            ├── Step 2: Professional Details (type, experience, industries)
            ├── Step 3: Services (select from category list)
            ├── Step 4: Location (office address, service area)
            ├── Step 5: Portfolio (upload samples, case studies)
            ├── Step 6: Verification (PAN, GST, certificates)
            ├── Step 7: Membership (Individual ₹2,499 / Company ₹5,999)
            ├── Step 8: Payment
            ├── Step 9: Admin Approval
            └── Step 10: Go Live

Every step: Auto Save
```

## 3.2 Professional Profile Structure

```
Professional Profile (extends Company)
│
├── Basic Info
│   ├── Professional Photo (Company.logo)
│   ├── Cover Banner (Company.banner)
│   ├── Business Name (Company.name)
│   ├── Tagline (Company.description - first 200 chars)
│   ├── About (Company.description - extended)
│   └── Languages (ProfessionalLanguage[])
│
├── Verification & Trust
│   ├── Verified Badge (Company.verificationLevel >= LEVEL_3)
│   ├── TradTrust Score (TradTrustScore)
│   ├── Professional Rating (from Booking reviews)
│   ├── Years of Experience (ProfessionalProfile.yearsExperience)
│   └── Response Time (calculated from chat/booking response rate)
│
├── Services (ProfessionalService[])
│   ├── Service Name
│   ├── Category (maps to existing Industry/Category)
│   ├── Description
│   ├── Price Range (min-max)
│   ├── Delivery Time
│   └── Service Area (cities, remote, travel)
│
├── Portfolio (ProfessionalPortfolio[])
│   ├── Title
│   ├── Description
│   ├── Media (images, documents, videos)
│   ├── Client (optional)
│   ├── Completion Date
│   └── Tags
│
├── Certifications (ProfessionalCertification[])
│   ├── Certificate Name
│   ├── Issuing Organization
│   ├── Issue Date
│   ├── Expiry Date (if any)
│   ├── Certificate URL (uploaded document)
│   └── Verification Status
│
├── Business Details
│   ├── Industries Served (CompanyIndustry[])
│   ├── Cities Served (ProfessionalServiceArea)
│   ├── Remote Available (boolean)
│   ├── Office Available (boolean)
│   ├── Travel Available (boolean)
│   ├── Business Hours (Json object)
│   └── Social Links (Json object)
│
├── Case Studies (ProfessionalCaseStudy[])
│   ├── Title
│   ├── Client
│   ├── Challenge
│   ├── Solution
│   ├── Results (metrics)
│   └── Media
│
├── Video Introduction (url)
│
├── Documents (via existing CompanyVerification)
│   ├── PAN
│   ├── GST
│   ├── Certificates
│   ├── Professional Membership Proof
│   └── Insurance (if applicable)
│
└── Membership (via existing Company.subscriptionPlan)
    ├── Individual ₹2,499
    └── Company ₹5,999
```

## 3.3 Buyer (Seeker) Experience Flow

```
Discovery
    │
    ├── Search (Category, Service, Location, Name)
    ├── Featured Professionals (admin curated)
    ├── Trending Professionals (most viewed/booked)
    ├── Top Rated (highest rated)
    ├── Nearby (closest geographically)
    ├── Recently Active (last online)
    ├── Recommended (AI-powered, based on history)
    └── AI Picks (explainable AI recommendations)
        │
        ▼
Professional Profile
    │
    ├── View Profile (photo, about, services, portfolio)
    ├── View Trust Score
    ├── View Ratings & Reviews
    ├── View Portfolio & Case Studies
    ├── View Certifications
    ├── Compare Professionals (side-by-side)
    ├── Save to Favorites
    ├── Share Profile
        │
        ▼
Engagement
    │
    ├── Chat (business chat via existing messaging)
    ├── Book Consultation (booking system)
    ├── Request Proposal (custom RFQ-like)
    ├── Schedule Meeting (calendar integration)
    ├── Send Quote Request
        │
        ▼
Transaction
    │
    ├── Accept Proposal
    ├── Make Payment (via existing payment system)
    ├── Track Progress
    ├── Complete Service
    ├── Rate & Review
    ├── Rehire
        │
        ▼
Retention
    ├── Save Professional
    ├── Follow Professional
    ├── Refer Professional
    └── Re-book (one-click rehire)
```

## 3.4 Seller (Professional) Experience Flow

```
Onboarding
    │
    ├── Registration (wizard, auto-save)
    ├── Profile Completion (AI-assisted)
    ├── Service Listing (AI-suggested)
    ├── Portfolio Upload
    ├── Verification (KYC, certificates)
    ├── Membership Purchase
    ├── Admin Approval
    └── Go Live
        │
        ▼
Daily Operations
    │
    ├── Dashboard
    │   ├── Profile Views
    │   ├── Leads (CRM integration)
    │   ├── Bookings
    │   ├── Revenue
    │   ├── Rating
    │   ├── AI Insights
    │   └── Growth Suggestions
    │
    ├── Leads (CRM)
    │   ├── Pipeline (NEW → CONTACTED → QUALIFIED → PROPOSAL → WON/LOST)
    │   ├── Follow-ups
    │   ├── Tasks
    │   └── Client History
    │
    ├── Bookings
    │   ├── Upcoming Consultations
    │   ├── Past Services
    │   └── Calendar
    │
    ├── Messages
    │   ├── Client Chats
    │   ├── Proposals
    │   ├── AI Reply Suggestions
    │   └── AI Translation
    │
    ├── AI Assistant
    │   ├── Profile Review
    │   ├── Portfolio Suggestions
    │   ├── AI SEO for Profile
    │   ├── Bio Improvement
    │   ├── Service Suggestions
    │   ├── Pricing Suggestions
    │   ├── Lead Suggestions
    │   ├── Market Insights
    │   └── Competitor Analysis
    │
    └── Analytics
        ├── Profile Performance
        ├── Lead Conversion
        ├── Revenue Trends
        ├── Client Demographics
        └── Service Performance
```

## 3.5 Discovery (Search) — Information Architecture

```
SEARCH INDEX (OpenSearch)
    │
    ├── Name (full-text)
    ├── Category (exact match)
    ├── Services (full-text)
    ├── Industry (exact match)
    ├── Location (geo-distance)
    ├── Language (exact match)
    ├── Experience Range (numeric range)
    ├── Rating Range (numeric range)
    ├── TradTrust Score (numeric range)
    ├── Availability (boolean)
    ├── Verification Level (enum range)
    └── Price Range (numeric range)

RANKING ALGORITHM (NEVER by payment)
    │
    ├── TradTrust Score (weight: 25%)
    ├── Distance (weight: 15%) — Near→Far→Best™
    ├── Response Time (weight: 10%)
    ├── Rating (weight: 10%)
    ├── Verification Level (weight: 10%)
    ├── Portfolio Quality (weight: 10%)
    ├── Recent Activity (weight: 10%)
    ├── AI Quality Score (weight: 5%)
    └── Profile Completeness (weight: 5%)

DISCOVERY SECTIONS
    │
    ├── Featured Professionals (admin curated, displayed in rotation)
    ├── Trending (most viewed/booked in last 7 days)
    ├── Top Rated (highest avg rating, min 5 reviews)
    ├── Nearby (geo-distance < 25km, ordered by TradTrust)
    ├── Recently Active (last online < 24 hours)
    ├── Recommended (AI-powered, based on buyer history)
    └── AI Picks (explainable: "This CA is recommended because...")
```

## 3.6 Event Architecture

```
EVENT                    TRIGGER                              CONSUMERS
─────────────────────────────────────────────────────────────────────────────
profile.published        Admin approves profile               Search Service (index)
                                Notification Service (welcome)
                                Ecosystem Service (XP reward)

lead.received            Client sends inquiry                 CRM (create lead)
                                Notification Service (alert)
                                Ecosystem Service (XP reward)

proposal.sent            Professional sends proposal          Notification Service
                                CRM (update timeline)

booking.confirmed        Client books consultation            Notification Service (both)
                                Dashboard (update stats)
                                Ecosystem Service (XP)

review.received          Client submits review                TradTrust (recalculate)
                                Notification Service
                                Professional Profile (update rating)
                                Ecosystem Service (XP)

membership.purchased     Professional buys plan               Membership Service (activate)
                                Notification Service
                                Ecosystem Service (XP)

portfolio.updated        Professional updates portfolio       AI Gateway (portfolio review)
                                Search Service (re-index)
                                TradTrust (recalculate)

profile.verified         Admin completes verification         Notification Service
                                TradTrust (recalculate)
                                Profile (show verified badge)

ai.suggestions.ready     AI completes analysis               Notification Service
                                Dashboard (show suggestions)
```

---

# OUTPUT 4: DATABASE IMPACT

## 4.1 New Enums to Add (prisma/schema.prisma)

```prisma
enum ProfessionalType {
  INDIVIDUAL_CONSULTANT    // Chartered Accountant, Legal Advisor, etc.
  FIRM                     // CA Firm, Law Firm, Consultancy
  FREELANCER               // Photographer, Designer, SEO Expert
  AGENCY                   // Marketing Agency, IT Consultancy
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  REFUNDED
}

enum AvailabilityDay {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

enum ProposalStatus {
  DRAFT
  SENT
  VIEWED
  ACCEPTED
  REJECTED
  WITHDRAWN
}
```

## 4.2 Extend Existing Models

### Company (extend with professional fields)

Add these fields to the existing `Company` model (lines 1081-1206):
```prisma
model Company {
  // ... existing 45 fields

  // NEW: TradeServ fields
  professionalType          ProfessionalType?   // null = regular seller/buyer
  professionalStatus        ProfessionalStatus?  // PENDING_REVIEW, APPROVED, REJECTED, SUSPENDED
  professionalApprovedAt    DateTime?
  professionalRejectedAt    DateTime?
  professionalRejectedReason String?
  professionalReviewedBy    String?
  responseTimeMinutes       Int?                // AI-calculated average response time
  lastActiveAt              DateTime?           // last login/activity timestamp
  videoIntroductionUrl      String?             // video introduction URL
  socialLinks               Json?
  businessHours             Json?
}

// Update indexes
@@index([professionalType])
@@index([professionalStatus])
@@index([professionalType, professionalStatus])
```

### VerificationLevel Enum (extend)

Add two more levels for professional-specific verification:
```prisma
enum VerificationLevel {
  LEVEL_0
  LEVEL_1
  LEVEL_2
  LEVEL_3
  LEVEL_4
  LEVEL_5
  LEVEL_6
  LEVEL_7    // NEW: Professional verified (certificates verified)
  LEVEL_8    // NEW: Expert verified (experience verified + client references)
}
```

### BusinessType Enum (extend)
```prisma
enum BusinessType {
  // ... existing 11 values
  PROFESSIONAL          // NEW
  CONSULTANCY           // NEW
  FREELANCER            // NEW
  SOLE_PROPRIETORSHIP   // NEW
}
```

### DocumentType Enum (extend)
```prisma
enum DocumentType {
  // ... existing 7 values
  DIPLOMA                    // NEW
  PROFESSIONAL_CERTIFICATE   // NEW
  PORTFOLIO_SAMPLE           // NEW
  LIABILITY_INSURANCE        // NEW
  PROFESSIONAL_MEMBERSHIP    // NEW
  CLIENT_REFERENCE           // NEW
  EXPERIENCE_LETTER          // NEW
}
```

## 4.3 New Models to Add

```prisma
/// ProfessionalService — Services offered by a professional
model ProfessionalService {
  id                String   @id @default(uuid())
  companyId         String
  name              String
  description       String?
  category          String?           // Maps to existing Category or Industry
  priceMin          Decimal?  @db.Decimal(12, 2)
  priceMax          Decimal?  @db.Decimal(12, 2)
  pricingType       String?           // FIXED, HOURLY, PROJECT_BASED, RANGE
  deliveryDays      Int?
  isActive          Boolean   @default(true)
  sortOrder         Int       @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  company           Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // NEW
  @@index([companyId])
  @@index([category])
  @@index([isActive])
}

/// ProfessionalPortfolio — Portfolio samples/case studies
model ProfessionalPortfolio {
  id                String    @id @default(uuid())
  companyId         String
  title             String
  description       String?
  clientName        String?
  completionDate    DateTime?
  media             Json?               // Array of URLs (images, videos, documents)
  tags              String[]            // Tag array
  isFeatured        Boolean   @default(false)
  sortOrder         Int       @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  company           Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // NEW
  @@index([companyId])
  @@index([isFeatured])
}

/// ProfessionalCertification — Professional certificates
model ProfessionalCertification {
  id                String             @id @default(uuid())
  companyId         String
  name              String
  issuingAuthority  String
  issueDate         DateTime
  expiryDate        DateTime?
  certificateUrl    String?             // Uploaded document
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt        DateTime?
  verifiedBy        String?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  company           Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // NEW
  @@index([companyId])
  @@index([verificationStatus])
}

/// ProfessionalAvailability — Availability schedule
model ProfessionalAvailability {
  id                String    @id @default(uuid())
  companyId         String
  dayOfWeek         Int                 // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime         String              // "09:00"
  endTime           String              // "17:00"
  isAvailable       Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  company           Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // NEW
  @@unique([companyId, dayOfWeek])
  @@index([companyId])
}

/// ProfessionalLanguage — Languages spoken
model ProfessionalLanguage {
  id                String    @id @default(uuid())
  companyId         String
  language          String              // "English", "Hindi", "Gujarati", etc.
  proficiency       String?             // NATIVE, FLUENT, BUSINESS, BASIC
  createdAt         DateTime  @default(now())

  company           Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // NEW
  @@unique([companyId, language])
  @@index([companyId])
}

/// ProfessionalServiceArea — Cities/regions served
model ProfessionalServiceArea {
  id                String    @id @default(uuid())
  companyId         String
  city              String
  state             String?
  country           String    @default("India")
  serviceType       String?             // REMOTE, ONSITE, BOTH
  createdAt         DateTime  @default(now())

  company           Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // NEW
  @@index([companyId])
  @@index([city])
}

/// Booking — Client booking/consultation appointment
model Booking {
  id                String        @id @default(uuid())
  companyId         String                // Professional's company
  clientId          String                // Client's company (buyer)
  serviceId         String?
  status            BookingStatus @default(PENDING)
  scheduledAt       DateTime
  durationMinutes   Int?
  amount            Decimal?      @db.Decimal(12, 2)
  notes             String?
  meetingLink       String?               // Video meeting URL
  location          String?               // Physical meeting address
  completedAt       DateTime?
  cancelledAt       DateTime?
  cancelReason      String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  company           Company       @relation(fields: [companyId], references: [id], onDelete: Restrict)
  client            Company       @relation("ClientBookings", fields: [clientId], references: [id], onDelete: Restrict)
  service           ProfessionalService? @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  reviews           ProfessionalReview[]
  // NEW
  @@index([companyId])
  @@index([clientId])
  @@index([status])
  @@index([scheduledAt])
}

/// ProfessionalReview — Review after booking completion
model ProfessionalReview {
  id                String    @id @default(uuid())
  bookingId         String
  companyId         String              // Professional being reviewed
  clientId          String              // Reviewer (buyer company)
  rating            Int                 // 1-5
  title             String?
  description       String?
  isVerifiedBooking Boolean   @default(true)  // Only verified bookings count
  rehired           Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  booking           Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  company           Company   @relation(fields: [companyId], references: [id], onDelete: Restrict)
  client            Company   @relation("ClientReviews", fields: [clientId], references: [id], onDelete: Restrict)
  // NEW
  @@unique([bookingId])             // One review per booking
  @@index([companyId])
  @@index([clientId])
  @@index([rating])
}

/// Proposal — Professional's response to client inquiry
model Proposal {
  id                String          @id @default(uuid())
  companyId         String          // Professional's company
  clientId          String          // Client's company
  inquiryId         String?         // Reference to original inquiry
  title             String
  description       String?
  amount            Decimal?        @db.Decimal(12, 2)
  deliveryDays      Int?
  status            ProposalStatus  @default(DRAFT)
  sentAt            DateTime?
  viewedAt          DateTime?
  acceptedAt        DateTime?
  rejectedAt        DateTime?
  rejectionReason   String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  company           Company         @relation(fields: [companyId], references: [id], onDelete: Restrict)
  client            Company         @relation("ClientProposals", fields: [clientId], references: [id], onDelete: Restrict)
  // NEW
  @@index([companyId])
  @@index([clientId])
  @@index([status])
}

/// ProfessionalSavedSearch — Saved search preferences for buyers
model ProfessionalSavedSearch {
  id                String    @id @default(uuid())
  userId            String
  searchCriteria    Json              // Saved filter state
  name              String?
  notifyNewResults  Boolean   @default(true)
  lastNotifiedAt    DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  // NEW
  @@index([userId])
}
```

## 4.4 Extend Existing Models

### CrmLead (extend, lines 5758-5793)

Add professional-specific fields:
```prisma
model CrmLead {
  // ... existing 16 fields
  // NEW
  professionalServiceId String?  // Link to ProfessionalService
  bookingId             String?  // Link to Booking if converted
  inquiryType           String?  // CONSULTATION, QUOTE, PROPOSAL, GENERAL
}
```

### PlanType Enum (extend)
```prisma
enum PlanType {
  // ... existing 7 values
  TRADE_PROFESSIONAL_INDIVIDUAL  // NEW: ₹2,499/yr
  TRADE_PROFESSIONAL_COMPANY     // NEW: ₹5,999/yr
}
```

### TaskType Enum (extend, lines 6246-6268)
```prisma
enum TaskType {
  // ... existing 21 values
  PROFILE_REVIEW           // NEW: AI profile review
  BIO_GENERATION           // NEW: AI bio improvement
  PORTFOLIO_SUGGESTION     // NEW: AI portfolio suggestions
  SERVICE_DESCRIPTION      // NEW: AI service listing writer
  PRICING_SUGGESTION       // NEW: AI pricing recommendations
  LEAD_REPLY               // NEW: AI lead reply suggestions
  MARKET_INSIGHT           // NEW: AI market insights
  COMPETITOR_ANALYSIS      // NEW: AI competitor analysis
}
```

---

# OUTPUT 5: REUSABLE COMPONENTS

## 5.1 Backend Modules (Reuse As-Is)

| Module | Purpose in TradeServ | Reuse Strategy |
|--------|---------------------|----------------|
| **AuthModule** | Professional & Buyer registration, login, OAuth | FULL — no changes needed |
| **MembershipModule** | Professional plan purchase, activation, billing | FULL — add new plan types only |
| **TradTrustModule** | Professional trust scoring, grade, breakdown | FULL — scoring engine works for all Companies |
| **CrmModule** | Lead pipeline, follow-ups, tasks, notes, timeline | FULL — each professional gets CRM out of the box |
| **AiGatewayModule** | All AI features (profile, SEO, pricing, etc.) | FULL — add new TaskTypes, no architecture changes |
| **NotificationModule** | All event notifications (lead, booking, review) | FULL — global module |
| **PaymentModule** | Professional membership payments, invoices | FULL — supports SUBSCRIPTION type |
| **LocationIntelligenceModule** | Nearby professional search, geocoding | FULL — works with CompanyLocation |
| **Chat/Messaging** | Client-Professional communication | FULL — existing business chat |

## 5.2 Backend Services (Reuse with Extension)

| Service | Extension Needed |
|---------|-----------------|
| `MarketplaceIntelligenceService.findBestSuppliers()` | Adapt to filter by `professionalType`, add professional-specific factors |
| `MarketplaceIntelligenceEngine.getUnifiedScore()` | Add professional-specific scoring factors (portfolio, certification, languages) |
| `CompanyVerificationService` | Add professional-specific document types for verification |
| `UserVerificationService` | Same document type extension |

## 5.3 Frontend Components (Reuse As-Is)

| Component | Purpose |
|-----------|---------|
| `DashboardPageHeader` | Standard page header |
| `StatCard` / `StatCardSkeleton` | Statistics display |
| `TableSkeleton` | Loading state |
| `StatusBadge` | Status indicators |
| `Badge` / `Button` / `Card` / `CardContent` / `CardHeader` / `CardTitle` | Base UI |
| `Skeleton` | Loading skeletons |
| `VerifiedBadge` | Verification level display |
| `FilterSidebar` | Search filtering |
| `XPProgressBar` | Profile completion progress |
| `XPProgressCard` | Level/XP display |
| `BadgeCard` / `LevelCard` | Badge/level display |
| `LeaderboardPodium` / `LeaderboardTable` | Top professionals leaderboard |
| `NotificationDrawer` / `NotificationProvider` | Real-time notifications |
| `useToast` / `toast` | Toast notifications |
| `AuthProvider` | Auth state management |

## 5.4 Frontend Components (Reuse with Extension)

| Component | Extension |
|-----------|-----------|
| `DailyCheckinCard` | Extend to track daily professional activity |
| `MissionCard` / `MissionCategoryTabs` | Professional onboarding missions |
| `RewardStatistics` / `RewardTimeline` | Professional achievement stats |
| `WalletTransactionFilters` / `WalletTimeline` | Professional earnings history |

---

# OUTPUT 6: FILES TO EXTEND

## 6.1 Backend Files to Extend

| # | File | Change | Complexity |
|---|------|--------|------------|
| 1 | `prisma/schema.prisma` | Add 8 new models, 4 enums, extend 4 existing models | HIGH |
| 2 | `apps/api/src/app.module.ts` | Register `TradeServModule` | LOW |
| 3 | `apps/api/src/modules/tradtrust/tradtrust.service.ts` | Add professional-specific scoring factors (portfolio quality, certification count, languages) | MEDIUM |
| 4 | `apps/api/src/modules/tradtrust/tradtrust-weights.config.ts` | Adjust weights for professional-specific factors | LOW |
| 5 | `apps/api/src/modules/location-intelligence/location-intelligence.service.ts` | Add `findNearbyProfessionals()` method filtering by `professionalType` | LOW |
| 6 | `apps/api/src/modules/marketplace-intelligence/marketplace-intelligence.engine.ts` | Extend `getUnifiedScore()` with professional factors | MEDIUM |
| 7 | `apps/api/src/modules/membership/membership.service.ts` | Add seed data for professional plans (₹2,499/₹5,999) | LOW |
| 8 | `apps/api/src/modules/ai-gateway/ai-credits.service.ts` | Add `CREDIT_COSTS` entries for new TaskTypes | LOW |
| 9 | `apps/api/src/modules/company-verification/company-verification.service.ts` | Add new DocumentType support for professional certs | LOW |
| 10 | `apps/api/src/modules/notification/notification.template.service.ts` | Add TradeServ-specific notification templates (BOOKING_CONFIRMED, PROPOSAL_RECEIVED, etc.) | LOW |

## 6.2 Frontend Files to Extend

| # | File | Change | Complexity |
|---|------|--------|------------|
| 1 | `apps/web/data/master-data.ts` | Add PROFESSIONAL role navigation and quick actions | MEDIUM |
| 2 | `apps/web/app/buyer/dashboard/page.tsx` | Add "Find Professionals" widget | LOW |
| 3 | `apps/web/app/seller/dashboard/page.tsx` | Add "Professional Dashboard" toggle or widget | LOW |
| 4 | `apps/web/lib/api/ecosystem.ts` | Add professional onboarding missions API | LOW |
| 5 | `apps/web/hooks/use-ecosystem.ts` | Add professional-specific mission hooks | LOW |
| 6 | `apps/web/lib/api/notifications.ts` | Add TradeServ notification type scripts | LOW |
| 7 | `apps/web/lib/api/types.ts` | Add `ProfessionalType` to Company interface | LOW |

## 6.3 Existing Pages to Extend

| # | Page | Change |
|---|------|--------|
| 1 | `/register/seller` | Add "Professional" option in registration type |
| 2 | `/admin/dashboard` | Add "Professionals" stats row |
| 3 | `/admin/verification` | Add professional-specific document verification UI |
| 4 | `/admin/users` | Add professional type filter |

---

# OUTPUT 7: FILES TO CREATE

## 7.1 Backend Files to Create

### Core TradeServ Module (9 files)

| # | File | Description |
|---|------|-------------|
| 1 | `apps/api/src/modules/tradeserv/tradeserv.module.ts` | Root module, imports all sub-modules |
| 2 | `apps/api/src/modules/tradeserv/professional-profile/professional-profile.service.ts` | Professional profile CRUD, validation, auto-save |
| 3 | `apps/api/src/modules/tradeserv/professional-profile/professional-profile.controller.ts` | Profile endpoints (GET/PUT/PATCH profile) |
| 4 | `apps/api/src/modules/tradeserv/professional-profile/dto/` | DTOs: CreateProfessionalProfileDto, UpdateProfessionalProfileDto |
| 5 | `apps/api/src/modules/tradeserv/professional-services/professional-services.service.ts` | Service listing CRUD |
| 6 | `apps/api/src/modules/tradeserv/professional-services/professional-services.controller.ts` | Service endpoints |
| 7 | `apps/api/src/modules/tradeserv/professional-services/dto/` | DTOs: CreateServiceDto, UpdateServiceDto |
| 8 | `apps/api/src/modules/tradeserv/professional-portfolio/professional-portfolio.service.ts` | Portfolio CRUD, media upload |
| 9 | `apps/api/src/modules/tradeserv/professional-portfolio/professional-portfolio.controller.ts` | Portfolio endpoints |
| 10 | `apps/api/src/modules/tradeserv/professional-portfolio/dto/` | DTOs: CreatePortfolioDto, UpdatePortfolioDto |

### Search & Discovery (4 files)

| # | File | Description |
|---|------|-------------|
| 11 | `apps/api/src/modules/tradeserv/professional-search/professional-search.service.ts` | OpenSearch indexing, query builder, ranking |
| 12 | `apps/api/src/modules/tradeserv/professional-search/professional-search.controller.ts` | Search endpoints (GET /tradeserv/search) |
| 13 | `apps/api/src/modules/tradeserv/professional-search/dto/` | SearchQueryDto with all filter fields |
| 14 | `apps/api/src/modules/tradeserv/professional-discovery/professional-discovery.service.ts` | Featured, trending, nearby, recommended, AI picks |
| 15 | `apps/api/src/modules/tradeserv/professional-discovery/professional-discovery.controller.ts` | Discovery endpoints |
| 16 | `apps/api/src/modules/tradeserv/professional-discovery/dto/` | Discovery DTOs |

### Booking & Proposals (4 files)

| # | File | Description |
|---|------|-------------|
| 17 | `apps/api/src/modules/tradeserv/professional-booking/professional-booking.service.ts` | Booking CRUD, scheduling, conflict detection |
| 18 | `apps/api/src/modules/tradeserv/professional-booking/professional-booking.controller.ts` | Booking endpoints |
| 19 | `apps/api/src/modules/tradeserv/professional-booking/dto/` | CreateBookingDto, UpdateBookingDto |
| 20 | `apps/api/src/modules/tradeserv/professional-proposal/professional-proposal.service.ts` | Proposal CRUD, status workflow |
| 21 | `apps/api/src/modules/tradeserv/professional-proposal/professional-proposal.controller.ts` | Proposal endpoints |
| 22 | `apps/api/src/modules/tradeserv/professional-proposal/dto/` | CreateProposalDto, UpdateProposalDto |

### Admin & AI (3 files)

| # | File | Description |
|---|------|-------------|
| 23 | `apps/api/src/modules/tradeserv/professional-admin/professional-admin.controller.ts` | Admin: approve/reject, feature, manage |
| 24 | `apps/api/src/modules/tradeserv/professional-admin/dto/` | Admin action DTOs |
| 25 | `apps/api/src/modules/tradeserv/professional-ai/professional-ai.service.ts` | AI features: profile review, SEO, pricing, leads |
| 26 | `apps/api/src/modules/tradeserv/professional-ai/professional-ai.controller.ts` | AI feature endpoints (routes through AI Gateway) |
| 27 | `apps/api/src/modules/tradeserv/professional-ai/dto/` | AI request/response DTOs |

### Onboarding (2 files)

| # | File | Description |
|---|------|-------------|
| 28 | `apps/api/src/modules/tradeserv/professional-onboarding/professional-onboarding.service.ts` | 10-step onboarding wizard, auto-save |
| 29 | `apps/api/src/modules/tradeserv/professional-onboarding/professional-onboarding.controller.ts` | Onboarding step endpoints |

**Total backend files to create: ~29 files**

## 7.2 Frontend Files to Create

### Pages (8 pages)

| # | Page | Description |
|---|------|-------------|
| 1 | `apps/web/app/tradeserv/page.tsx` | TradeServ landing page (category grid + search) |
| 2 | `apps/web/app/tradeserv/search/page.tsx` | Search results page with FilterSidebar |
| 3 | `apps/web/app/tradeserv/[slug]/page.tsx` | Professional profile page (full detail view) |
| 4 | `apps/web/app/tradeserv/[slug]/booking/page.tsx` | Book consultation page |
| 5 | `apps/web/app/tradeserv/register/page.tsx` | Professional registration wizard (10 steps) |
| 6 | `apps/web/app/professional/dashboard/page.tsx` | Professional dashboard (leads, bookings, revenue, AI) |
| 7 | `apps/web/app/professional/leads/page.tsx` | Lead management (CRM integration) |
| 8 | `apps/web/app/professional/bookings/page.tsx` | Booking management |
| 9 | `apps/web/app/admin/tradeserv/page.tsx` | Admin: professional verification queue |
| 10 | `apps/web/app/admin/tradeserv/professionals/page.tsx` | Admin: manage professionals |

### Components (15+ components)

| # | Component | Description |
|---|-----------|-------------|
| 1 | `apps/web/components/tradeserv/professional-card.tsx` | Search result card (photo, name, rating, services, location) |
| 2 | `apps/web/components/tradeserv/professional-header.tsx` | Profile header (photo, cover, badge, trust score, rating) |
| 3 | `apps/web/components/tradeserv/professional-services-list.tsx` | Services listing on profile |
| 4 | `apps/web/components/tradeserv/professional-portfolio-grid.tsx` | Portfolio grid/masonry |
| 5 | `apps/web/components/tradeserv/professional-certifications-list.tsx` | Certifications display |
| 6 | `apps/web/components/tradeserv/professional-availability.tsx` | Availability calendar |
| 7 | `apps/web/components/tradeserv/professional-reviews.tsx` | Reviews list with rating breakdown |
| 8 | `apps/web/components/tradeserv/professional-compare.tsx` | Side-by-side comparison |
| 9 | `apps/web/components/tradeserv/search-filters.tsx` | Professional-specific filters |
| 10 | `apps/web/components/tradeserv/booking-calendar.tsx` | Booking date/time picker |
| 11 | `apps/web/components/tradeserv/onboarding-wizard.tsx` | 10-step registration wizard |
| 12 | `apps/web/components/tradeserv/onboarding-step-*.tsx` | Individual step components |
| 13 | `apps/web/components/tradeserv/discovery-section.tsx` | Featured/trending/nearby/recommended sections |
| 14 | `apps/web/components/tradeserv/ai-profile-review.tsx` | AI profile review panel |
| 15 | `apps/web/components/tradeserv/professional-lead-row.tsx` | Lead row for professional CRM |

### API & Hooks (4 files)

| # | File | Description |
|---|------|-------------|
| 16 | `apps/web/lib/api/tradeserv.ts` | ALL TradeServ API functions |
| 17 | `apps/web/hooks/use-tradeserv.ts` | ALL TradeServ React Query hooks |
| 18 | `apps/web/lib/api/professional.ts` | Professional-specific API |
| 19 | `apps/web/hooks/use-professional.ts` | Professional-specific hooks |

**Total frontend files to create: ~35 files**

---

# OUTPUT 8: SECURITY CONSIDERATIONS

## 8.1 Authentication & Authorization

| Concern | Solution | Existing |
|---------|----------|----------|
| Professional Registration | Reuse existing JWT + Role-based auth | ✅ FULL |
| Role mapping | Professional maps to existing `SELLER` role with `professionalType` discriminator | ✅ EXISTING |
| Profile ownership | `CompanyOwnerGuard` already validates company ownership | ✅ FULL |
| Admin oversight | Existing `RolesGuard` with ADMIN/SUPER_ADMIN roles | ✅ FULL |
| Rate limiting | Existing `@Throttle()` decorators on all public endpoints | ✅ FULL |

## 8.2 Data Protection

| Concern | Solution | Existing |
|---------|----------|----------|
| Sensitive documents | Reuse existing `[MASKED]` mechanism in verification services | ✅ FULL |
| Portfolio media | Scan via existing `FileScan` model (pending implementation) | ⚠️ NEEDS WORK |
| PII in profiles | No Aadhaar/PAN in public profile responses | ✅ FULL |
| Professional contact | Email/mobile hidden until booking confirmed | ⚠️ NEEDS NEW GUARD |
| GDPR/Privacy | Existing User deletion cascade policies | ✅ FULL |

## 8.3 Professional Verification

| Concern | Solution |
|---------|----------|
| Fake profiles | ADMIN approval required before Go Live |
| Certificate fraud | VerificationStatus workflow (PENDING → VERIFIED/REJECTED) |
| Review fraud | Only verified bookings can leave reviews (isVerifiedBooking=true) |
| Identity fraud | Multi-level KYC (LEVEL_0→LEVEL_6+, PAN/GST mandatory) |
| Duplicate listings | Company.slug unique constraint prevents duplicate profiles |

## 8.4 API Security

| Concern | Solution | Existing |
|---------|----------|----------|
| SQL Injection | Use Prisma ORM (parameterized queries) | ✅ FULL |
| XSS | Next.js auto-escapes HTML in JSX | ✅ FULL |
| CSRF | `@fastify/csrf-protection` registered globally | ✅ FULL |
| Rate limiting | `@Throttle()` on all public/search endpoints | ✅ FULL |
| CORS | Fastify CORS configured in main.ts | ✅ FULL |
| Helmet | CSP headers configured in main.ts | ✅ FULL |

## 8.5 New Security Requirements for TradeServ

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | **Profile contact protection** | New `ProfessionalContactGuard` — hides email/mobile from unauthenticated users and users without a booking |
| 2 | **Review authenticity** | Only `isVerifiedBooking=true` reviews count toward rating — guard on ProfessionalReview creation |
| 3 | **Booking ownership** | Both professional and client must own the booking to access it |
| 4 | **Proposal visibility** | Only participants (professional + client) can view proposals |
| 5 | **Admin approval gate** | `professionalStatus = APPROVED` required for profile to appear in search |

---

# OUTPUT 9: SCALABILITY NOTES

## 9.1 Expected Load Patterns

| Metric | Estimate | Scaling Strategy |
|--------|----------|------------------|
| Professional profiles | 10K-100K | OpenSearch index, paginated queries |
| Search queries | 100-1000/sec | OpenSearch + Redis caching of popular searches |
| Bookings | 1K-10K/day | Append-only booking model, partitioned by companyId |
| AI requests | 10-100/sec | Existing AI Gateway fallback chain + circuit breaker |
| Profile views | 10K-100K/day | Redis cache for profile page queries |
| Portfolio images | 10K-100K | CDN for image delivery (CloudFront/S3) |
| Real-time notifications | 100-1000/sec | Existing Socket.IO + BullMQ queues |

## 9.2 Database Scaling

| Concern | Strategy |
|---------|----------|
| ProfessionalService table | Indexed on `companyId` and `category` |
| Booking table | Indexed on `companyId`, `clientId`, `status`, `scheduledAt` |
| Review table | Indexed on `companyId` for profile display, `rating` for filtering |
| Portfolio table | Media stored as URLs (not bytes), JSON array of references |
| ProfessionalCertification | Verification status indexed for admin queues |

## 9.3 Caching Strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|-------------|
| Professional profile summary | Redis | 5 min | On profile update event |
| Search results (popular) | Redis | 1 min | On new profile/update event |
| Discovery sections | Redis | 10 min | On admin feature change |
| TradTrust scores | Redis | 1 hour | On score recalculation |
| AI suggestions (profile) | Redis | 24 hours | On profile update |
| Geo-coded locations | GeoCacheService | 7 days | On location update |

## 9.4 Search Architecture

```
Client → Next.js → API → OpenSearch
                ↓
           Redis Cache
                ↓
           PostgreSQL
```

- OpenSearch is the primary search engine (full-text, geo, faceted)
- PostgreSQL is the source of truth
- Redis caches frequent queries
- Search re-index triggered by events (profile.published, profile.updated)

## 9.5 Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Search latency | <200ms | p95 OpenSearch query time |
| Profile page load | <500ms | First Contentful Paint |
| Booking creation | <300ms | API response time |
| AI feature response | <5s | Gateway timeout (with progress indicator) |
| Real-time notification | <1s | Socket.IO delivery time |
| Image load | <2s | CDN + lazy loading |

---

# OUTPUT 10: IMPLEMENTATION PLAN

## Phase 1: Foundation (Week 1-2)

### Prisma Schema Changes
- [ ] Add all 4 new enums to schema.prisma
- [ ] Extend Company model with professionalType + professionalStatus fields
- [ ] Extend VerificationLevel enum (LEVEL_7, LEVEL_8)
- [ ] Extend BusinessType enum
- [ ] Extend DocumentType enum
- [ ] Add 8 new models (ProfessionalService, ProfessionalPortfolio, ProfessionalCertification, ProfessionalAvailability, ProfessionalLanguage, ProfessionalServiceArea, Booking, ProfessionalReview, Proposal, ProfessionalSavedSearch)
- [ ] Extend CrmLead model
- [ ] Extend PlanType enum
- [ ] Extend TaskType enum
- [ ] Run `prisma validate` + `prisma generate`

### Backend: TradeServ Core Module
- [ ] Create `tradeserv.module.ts` (empty shell importing nothing yet)
- [ ] Register in AppModule

## Phase 2: Professional Profile (Week 2-3)

### Backend (7 files)
- [ ] Create `professional-profile.service.ts` — Full CRUD, auto-save, slug generation
- [ ] Create `professional-profile.controller.ts` — GET/PUT/PATCH endpoints
- [ ] Create `professional-profile.module.ts`
- [ ] Create DTOs (CreateProfileDto, UpdateProfileDto)
- [ ] Create `professional-services.service.ts` — Service listing CRUD
- [ ] Create `professional-services.controller.ts`
- [ ] Create service DTOs

### Frontend (6 files)
- [ ] Create `apps/web/app/tradeserv/[slug]/page.tsx` — Professional profile page
- [ ] Create `apps/web/components/tradeserv/professional-header.tsx`
- [ ] Create `apps/web/components/tradeserv/professional-services-list.tsx`
- [ ] Create `apps/web/components/tradeserv/professional-portfolio-grid.tsx`
- [ ] Create `apps/web/components/tradeserv/professional-certifications-list.tsx`
- [ ] Create `apps/web/lib/api/tradeserv.ts` (initial functions)
- [ ] Create `apps/web/hooks/use-tradeserv.ts` (initial hooks)

## Phase 3: Search & Discovery (Week 3-4)

### Backend (5 files)
- [ ] Create `professional-search.service.ts` — OpenSearch indexing + query
- [ ] Create `professional-search.controller.ts` — GET /tradeserv/search
- [ ] Create search DTOs
- [ ] Create `professional-discovery.service.ts` — Featured, trending, nearby, recommended, AI picks
- [ ] Create `professional-discovery.controller.ts`
- [ ] Extend `tradtrust.service.ts` — Add professional-specific scoring factors
- [ ] Extend `marketplace-intelligence.engine.ts` — Adapt for professional discovery

### Frontend (5 files)
- [ ] Create `apps/web/app/tradeserv/page.tsx` — Landing page with search + discovery sections
- [ ] Create `apps/web/app/tradeserv/search/page.tsx` — Full search results page
- [ ] Create `apps/web/components/tradeserv/professional-card.tsx`
- [ ] Create `apps/web/components/tradeserv/search-filters.tsx`
- [ ] Create `apps/web/components/tradeserv/discovery-section.tsx`

## Phase 4: Registration & Onboarding (Week 4-5)

### Backend (3 files)
- [ ] Create `professional-onboarding.service.ts` — 10-step wizard with auto-save
- [ ] Create `professional-onboarding.controller.ts`
- [ ] Create onboarding DTOs

### Frontend (12 files)
- [ ] Create `apps/web/app/tradeserv/register/page.tsx` — Registration page
- [ ] Create `apps/web/components/tradeserv/onboarding-wizard.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-1-basic.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-2-professional.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-3-services.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-4-location.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-5-portfolio.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-6-verification.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-7-membership.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-8-payment.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-9-approval.tsx`
- [ ] Create `apps/web/components/tradeserv/onboarding-step-10-golive.tsx`

## Phase 5: Booking & Proposals (Week 5-6)

### Backend (6 files)
- [ ] Create `professional-booking.service.ts` — Booking CRUD, scheduling, conflict detection
- [ ] Create `professional-booking.controller.ts`
- [ ] Create booking DTOs
- [ ] Create `professional-proposal.service.ts`
- [ ] Create `professional-proposal.controller.ts`
- [ ] Create proposal DTOs

### Frontend (4 files)
- [ ] Create `apps/web/app/tradeserv/[slug]/booking/page.tsx`
- [ ] Create `apps/web/components/tradeserv/booking-calendar.tsx`
- [ ] Create `apps/web/app/professional/bookings/page.tsx`
- [ ] Create `apps/web/app/professional/leads/page.tsx` — CRM integration

## Phase 6: Professional Dashboard (Week 6-7)

### Backend (2 files)
- [ ] Create `professional-admin.controller.ts` — Admin approval, feature, manage
- [ ] Create professional admin DTOs

### Frontend (5 files)
- [ ] Create `apps/web/app/professional/dashboard/page.tsx`
- [ ] Create `apps/web/app/professional/leads/page.tsx`
- [ ] Create `apps/web/app/professional/bookings/page.tsx`
- [ ] Create `apps/web/app/admin/tradeserv/page.tsx`
- [ ] Create `apps/web/app/admin/tradeserv/professionals/page.tsx`
- [ ] Update `apps/web/data/master-data.ts` — Add professional nav

## Phase 7: AI Features (Week 7-8)

### Backend (3 files)
- [ ] Create `professional-ai.service.ts` — 8 AI features routing through AI Gateway
- [ ] Create `professional-ai.controller.ts`
- [ ] Create AI DTOs
- [ ] Add 8 new TaskTypes to Prisma
- [ ] Add CREDIT_COSTS for new TaskTypes
- [ ] Auto-seed professional-specific prompts via PromptManagerService

### Frontend (2 files)
- [ ] Create `apps/web/components/tradeserv/ai-profile-review.tsx`
- [ ] Extend professional dashboard with AI panels

## Phase 8: Reviews & Ratings (Week 8)

### Backend (2 files)
- [ ] Create review endpoints (POST booking/:id/review, GET professional/:id/reviews)
- [ ] Integrate with TradTrust for rating-based scoring

### Frontend (2 files)
- [ ] Create `apps/web/components/tradeserv/professional-reviews.tsx`
- [ ] Create `apps/web/components/tradeserv/professional-compare.tsx`

## Phase 9: Payment Integration (Week 8-9)

### Backend (no new files)
- [ ] Configure professional membership plans (₹2,499/₹5,999)
- [ ] Add seed data in `membership.service.ts`

### Frontend (1 file)
- [ ] Create subscription/purchase page for professionals

## Phase 10: Verification & Deployment (Week 9-10)

- [ ] FULL end-to-end testing
- [ ] Performance testing (search, booking, AI)
- [ ] Security audit
- [ ] Production deployment
- [ ] Monitoring & alerting setup

---

# VERIFICATION: COMPLETE AUDIT MAP

```
MODULE                AUDITED    EXISTING    REUSABLE    EXTEND     NEW      TOUCH
────────────────────────────────────────────────────────────────────────────────────
Auth                  ✅ FULL    ✅          ✅          0          0        ❌ NO
Users                 ✅ FULL    ✅          ✅          0          0        ❌ NO
Companies             ✅ FULL    ✅          ✅          3 fields   0        ⚠️ EXTEND
Membership            ✅ FULL    ✅          ✅          2 plans    0        ⚠️ EXTEND
Plans                 ✅ FULL    ✅          ✅          2 types    0        ⚠️ EXTEND
TradTrust             ✅ FULL    ✅          ✅          1 factor   0        ⚠️ EXTEND
Marketplace Intel.    ✅ FULL    ✅          ✅          1 method   0        ⚠️ EXTEND
Near→Far→Best™       ✅ FULL    ✅          ✅          0          0        ❌ NO
CRM                   ✅ FULL    ✅          ✅          3 fields   0        ⚠️ EXTEND
Notifications         ✅ FULL    ✅          ✅          0          0        ❌ NO
AI Gateway            ✅ FULL    ✅          ✅          8 tasks    0        ⚠️ EXTEND
Payments              ✅ FULL    ✅          ✅          0          0        ❌ NO
Documents             ✅ FULL    ❌          FileScan    6 types    0        ⚠️ EXTEND
KYC                   ✅ FULL    ✅          ✅          6 types    0        ⚠️ EXTEND
Search/OpenSearch     ✅ FULL    ✅          ✅          0          0        ❌ NO
Profile               ✅ FULL    ✅          ✅          —          —        ⚠️ EXTEND
Dashboard             ✅ FULL    ✅          ✅          0          0        ❌ NO
Messaging/Chat        ✅ FULL    ✅          ✅          0          0        ❌ NO
Ratings/Reviews       ✅ FULL    ✅          ✅          —          —        ⚠️ EXTEND
Media/Uploads         ✅ FULL    ⚠️          FileScan    —          —        ⚠️ NEEDS WORK
Admin                 ✅ FULL    ✅          ✅          0          0        ❌ NO
Analytics             ✅ FULL    ✅          ✅          0          0        ❌ NO

NEW MODULES:
ProfessionalProfile   —          —           —          —          8 models  29 files
ProfessionalServices  —          —           —          —          1 model  
ProfessionalPortfolio —          —           —          —          1 model  
ProfessionalSearch    —          —           —          —          0 models 
ProfessionalBooking   —          —           —          —          3 models  
ProfessionalAdmin     —          —           —          —          0 models  
ProfessionalAI        —          —           —          —          0 models  
ProfessionalOnboard   —          —           —          —          0 models  

TOTALS:
Models to add:        8 new models + 4 extended enums = 12 schema changes
Backend files:        ~29 new files + 10 extended files = 39 file changes
Frontend files:       ~35 new files + 7 extended files = 42 file changes
Prisma changes:       12 schema additions (NEVER DUPLICATE User/Company/Membership)
```

---

# TRADESERV™ — Architecture Approved for Review

**Prepared for:** TRADINGO Founder

**Status:** 🔴 AWAITING FOUNDER APPROVAL

**Key Principles Upheld:**
- ✅ NEVER duplicate User, Company, or Membership
- ✅ Extend existing tables, never create parallel models
- ✅ Reuse TradTrust, CRM, AI Gateway, Notifications, Payments
- ✅ Event-driven architecture (all actions emit events)
- ✅ AI First (every professional gets AI copilot)
- ✅ Business First (never rank by payment, only by trust + quality)
- ✅ Architecture First (clean module boundaries, no circular deps)
- ✅ One Source of Truth (PostgreSQL → Prisma → OpenSearch)

**Next Step:** Please review and provide approval or feedback.
