# TRADESERV BACKEND BLUEPRINT — v1.0 FREEZE

> **Implementation Contract** — No code, no Prisma, no DTO, no Service, no Controller.
> This document defines exactly what must be built and in what order.
> Any deviation requires a new freeze cycle.

---

## 1. DOMAIN MODEL

### 1.1 Domain Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        TRADESERV DOMAIN MAP                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   FOUNDATION LAYER                   EXTENDED LAYER                      │
│   ┌──────────────────────┐          ┌────────────────────────┐          │
│   │ Professional          │          │ Verification            │          │
│   │   (Company extension) │◀─────────│   (Documents + Review)  │          │
│   └──────────────────────┘          └────────────────────────┘          │
│            │                                  │                          │
│            ▼                                  ▼                          │
│   ┌──────────────────────┐          ┌────────────────────────┐          │
│   │ Business Identity     │          │ TradTrust               │          │
│   │   (Company + Location │◀─────────│   (Scoring Engine)      │          │
│   │    + Hours)           │          └────────────────────────┘          │
│   └──────────────────────┘                                               │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────────┐          ┌────────────────────────┐          │
│   │ Services              │          │ Portfolio               │          │
│   │   (Listings + Pricing │◀─────────│   (Projects + Case     │          │
│   │    + Availability)    │          │    Studies + Media)     │          │
│   └──────────────────────┘          └────────────────────────┘          │
│                                                                          │
│   INTERACTION LAYER                   FEEDBACK LAYER                     │
│   ┌──────────────────────┐          ┌────────────────────────┐          │
│   │ Inquiry               │─────────▶│ Proposal                │          │
│   │   (Leads from buyers) │          │   (Quotes + Milestones) │          │
│   └──────────────────────┘          └──────────┬─────────────┘          │
│                                                 │                        │
│                                                 ▼                        │
│                                        ┌────────────────────────┐       │
│                                        │ Review                  │       │
│                                        │   (Ratings + Feedback)  │       │
│                                        └────────────────────────┘       │
│                                                                          │
│   COMPUTATION LAYER                    SUPPORT LAYER                     │
│   ┌──────────────────────┐          ┌────────────────────────┐          │
│   │ Analytics             │          │ Membership              │          │
│   │   (Events + Metrics)  │          │   (Plans + Subscription)│          │
│   └──────────────────────┘          └────────────────────────┘          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Domain Definitions

| Domain | Owner | Description |
|---|---|---|
| **Professional** | Company (extended) | A person registered as a professional service provider on TradeServ. Extends the existing `Company` model with `professionalType` discriminator. Not a separate User. Not a separate Company. **Single source of truth: `Company`** |
| **Business Identity** | Company + CompanyLocation + BusinessHours | The business entity behind the professional. Company name, logo, banner, description, registration details, office address, contact info, working hours. **Single source of truth: `Company`** |
| **Verification** | CompanyVerification + CompanyDocument | Document submission, review, and approval process. Determines trust level and unlocks TradTrust scoring. **Single source of truth: `CompanyVerification`** |
| **Services** | ProfessionalService | The services a professional offers. Name, description, category, pricing, availability, deliverables, media. **Single source of truth: `ProfessionalService`** |
| **Portfolio** | ProfessionalPortfolio + ProfessionalCaseStudy + Media | Showcase of past work. Projects with descriptions, case studies with challenge/solution/outcome, and media attachments (images, documents, videos). **Single source of truth: `ProfessionalPortfolio`** |
| **Inquiry** | ProfessionalInquiry | Lead generated when a buyer contacts a professional via the public profile. Contains contact info, requirement details, budget, timeline. **Single source of truth: `ProfessionalInquiry`** |
| **Proposal** | ProfessionalProposal + ProposalMilestone | Professional's response to an inquiry. Scope, pricing (fixed/hourly/milestone), terms, deliverables. Status workflow: draft → sent → viewed → accepted/rejected/withdrawn. **Single source of truth: `ProfessionalProposal`** |
| **Review** | ProfessionalReview | Client feedback after engagement. Rating (1-5), comment, linked to booking/proposal. Only verified engagements count toward TradTrust. **Single source of truth: `ProfessionalReview`** |
| **TradTrust** | TradTrustScore (existing) | Reuse the existing TRADINGO TradTrust module. Add professional-specific scoring factors (portfolio quality, certification count, response rate, languages). **Single source of truth: `TradTrustScore`** |
| **Analytics** | AnalyticsEvent + DailyMetric (existing) | Reuse existing analytics infrastructure. Profile views, search appearances, inquiry counts, proposal win rate, review trends. **Single source of truth: `AnalyticsEvent`** |
| **Membership** | Subscription + Plan (existing) | Reuse existing membership system. Add 2 new plan types: Professional Individual (₹2,499/yr) and Professional Company (₹5,999/yr). **Single source of truth: `Subscription`** |

---

## 2. ENTITY RELATIONSHIPS

### 2.1 Relationship Diagram

```
User (EXISTING)
  │
  │ 1
  │
  ├──────────────────────────────────────────┐
  │                                          │
  ▼                                          ▼
CompanyOwner (EXISTING)                 Session (EXISTING)
  │
  │ M
  │
  ▼
Company (EXISTING — EXTENDED)
  │
  │── 1 ── CompanyLocation (EXISTING) ──── 0..* GeoCluster (EXISTING)
  │── 1 ── BusinessHours (NEW, owned by Company)
  │── 1 ── ProfessionalAvailability (NEW) ── 0..* time slots
  │── 1 ── ProfessionalLanguage (NEW) ── 0..* languages
  │── 1 ── ProfessionalServiceArea (NEW) ── 0..* cities
  │── 1 ── ProfessionalProfile (NEW) ── extended bio, experience, video
  │── 1 ── ProfessionalService (NEW) ── 0..* services
  │── 1 ── ProfessionalPortfolio (NEW) ── 0..* projects
  │── 1 ── ProfessionalCaseStudy (NEW) ── 0..* case studies
  │── 1 ── ProfessionalCertification (NEW) ── 0..* certifications
  │── 1 ── ProfessionalInquiry (NEW) ── 0..* inquiries (as receiver)
  │── 1 ── ProfessionalInquiry (NEW) ── 0..* inquiries (as sender via clientId)
  │── 1 ── ProfessionalProposal (NEW) ── 0..* proposals (as professional)
  │── 1 ── ProfessionalProposal (NEW) ── 0..* proposals (as client via clientId)
  │── 1 ── ProfessionalReview (NEW) ── 0..* reviews (as professional)
  │── 1 ── ProfessionalReview (NEW) ── 0..* reviews (as reviewer via clientId)
  │── 1 ── TradTrustScore (EXISTING) ── 1 score (if VERIFIED)
  │── 1 ── Subscription (EXISTING) ── 1 current plan
  │
  ▼
CompanyVerification (EXISTING)
  │
  │── 1 ── CompanyDocument (EXISTING) ── 0..* documents
```

### 2.2 Entity Ownership Rules

| Entity | Parent | Ownership | onDelete |
|---|---|---|---|
| CompanyLocation | Company | **Company owns locations** | Cascade |
| BusinessHours | Company | **Company owns hours** | Cascade |
| ProfessionalProfile | Company | **Company owns profile** — one per Company with `professionalType != null` | Cascade |
| ProfessionalAvailability | Company | **Company owns availability** | Cascade |
| ProfessionalLanguage | Company | **Company owns languages** | Cascade |
| ProfessionalServiceArea | Company | **Company owns service area** | Cascade |
| ProfessionalService | Company | **Company owns services** | Cascade |
| ProfessionalPortfolio | Company | **Company owns portfolio** | Cascade |
| ProfessionalCaseStudy | Company | **Company owns case studies** | Cascade |
| ProfessionalCertification | Company | **Company owns certifications** | Cascade |
| ProfessionalInquiry | Professional (receiver) + Buyer Company (sender) | **Inquiry belongs to receiver Company** | Restrict (financial record) |
| ProfessionalProposal | Professional (author) + Buyer Company (client) | **Proposal belongs to author Company** | Restrict (contractual record) |
| ProfessionalReview | Professional (subject) + Buyer Company (reviewer) | **Review belongs to subject Company** | Restrict (reputation record) |
| TradTrustScore | Company | **One score per Company** | Cascade |
| CompanyVerification | Company | **One verification per Company** | Cascade |

### 2.3 Non-Duplication Guarantee

| Data Point | Canonical Location | All Other Locations Must Read Only |
|---|---|---|
| Company name | `Company.name` | Profile page reads; Verification page reads |
| GSTIN/PAN | `CompanyDocument` linked to `CompanyVerification` | Profile page REMOVES these fields |
| Email/Phone/Website | `Company` fields (email, phone) + `CompanyLocation` | Profile page REMOVES these fields |
| Service name/desc/price | `ProfessionalService` | Profile page REMOVES inline services section |
| Project title/desc | `ProfessionalPortfolio` | Profile page REMOVES inline portfolio section |
| Qualification/Certification | `ProfessionalCertification` | Profile page reads; Registration seeds |
| Plan name/features | `Plan` + `Subscription` | Registration Step 6 reads from Plans API |
| Analytics metrics | `AnalyticsEvent` (computed) | Dashboard reads from Analytics API |

---

## 3. PRISMA MODEL DEPENDENCY ORDER

```
ORDER  MODEL                    DEPENDS ON            TYPE          ACTION
────── ──────────────────────── ───────────────────── ───────────── ──────────────────────
  1    ProfessionalType (enum)  None                  NEW ENUM      Create
      ProfessionalStatus (enum) None                  NEW ENUM      Create
      ProposalStatus (enum)     None                  NEW ENUM      Create

  2    Company (extend)         User (existing)       EXTEND        Add 11 fields + indexes

  3    ProfessionalProfile      Company               NEW           Extended bio, experience
                                                                      languages[], video URL

  4    BusinessHours            Company               NEW           Days, open/close, TZ
      ProfessionalLanguage     Company               NEW            language + proficiency
      ProfessionalServiceArea  Company               NEW            city + state + serviceType

  5    ProfessionalCertification Company              NEW           name, authority, issue/expiry,
                                                                      verification status, document URL

  6    ProfessionalService      Company               NEW           name, category, pricing,
                                                                      delivery, isActive

  7    ProfessionalAvailability Company               NEW           dayOfWeek, start/end, isAvailable

  8    ProfessionalPortfolio    Company               NEW           title, desc, client, media(JSON),
                                                                      tags[], isFeatured

  9    ProfessionalCaseStudy    ProfessionalPortfolio  NEW           challenge, solution, outcome

  10   ProfessionalInquiry      Company (receiver)    NEW           contact, requirement, budget,
                                 Company (sender)                   timeline, status

  11   ProfessionalProposal     Company (author)      NEW           title, scope, pricing, terms,
                                 Company (client)                   deliverables, status
      ProposalMilestone         ProfessionalProposal  NEW           label, amount, dueDate

  12   ProfessionalReview       Company (subject)     NEW           rating, comment, verified,
                                 Company (reviewer)                 linked to booking/proposal

  13   CompanyDocument (extend) CompanyVerification   EXTEND        Add 7 new DocumentType values

  ---  (Everything above is TradeServ-specific. Below is EXISTING and reused) ---

  14   TradTrustScore           Company (existing)    REUSE         Already exists. No create.

  15   Subscription + Plan      Company (existing)    EXTEND        Add 2 new PlanType values

  16   AnalyticsEvent           Company (existing)    REUSE         Already exists. No create.
```

### Dependency Graph

```
User (existing)
  │
  ▼
Company (extend) ──────────► CompanyVerification (existing) ──► CompanyDocument (extend)
  │                                                                      │
  ├──► ProfessionalProfile                                                │
  ├──► BusinessHours                                                      │
  ├──► ProfessionalLanguage                                               │
  ├──► ProfessionalServiceArea                                            │
  ├──► ProfessionalCertification ◄────────────────────────────────────────┘
  ├──► ProfessionalService
  │        │
  │        ▼
  ├──► ProfessionalAvailability
  │
  ├──► ProfessionalPortfolio
  │        │
  │        ▼
  │    ProfessionalCaseStudy
  │
  ├──► ProfessionalInquiry ──────► ProfessionalProposal ──► ProposalMilestone
  │                                      │
  │                                      ▼
  │                                 ProfessionalReview
  │
  ├──► TradTrustScore (reuse)
  ├──► Subscription (reuse — extend PlanType)
  └──► AnalyticsEvent (reuse)
```

---

## 4. API DEPENDENCY ORDER

### 4.1 Implementation Sequence

```
DEPENDENCY ORDER
═══════════════════════════════════════════════════════════════════════════════

WEEK 1-2: AUTH + FOUNDATION
─────────────────────────────
  1. POST /auth/register            ← Registration (works without TradeServ)
  2. POST /auth/login               ← JWT + refresh token
  3. GET  /auth/me                   ← Current user profile
  4. PATCH /auth/me                  ← Update user profile

WEEK 2-3: PROFESSIONAL PROFILE
─────────────────────────────
  5. PUT    /tradeserv/profile              ← Create/update professional profile
  6. GET    /tradeserv/profile              ← Get own profile
  7. POST   /tradeserv/profile/photo        ← Upload profile photo
  8. POST   /tradeserv/profile/cover        ← Upload cover image
  9. POST   /tradeserv/profile/certifications        ← Add certification
  10. DELETE /tradeserv/profile/certifications/:id   ← Remove certification

WEEK 3-4: BUSINESS IDENTITY
────────────────────────────
  11. GET    /tradeserv/company              ← Get company info
  12. PUT    /tradeserv/company              ← Update company info
  13. GET    /tradeserv/company/location     ← Get office location
  14. PUT    /tradeserv/company/location     ← Update office location
  15. GET    /tradeserv/company/hours        ← Get business hours
  16. PUT    /tradeserv/company/hours        ← Update business hours
  17. GET    /tradeserv/company/languages    ← Get languages
  18. PUT    /tradeserv/company/languages    ← Update languages
  19. GET    /tradeserv/company/service-area ← Get service area
  20. PUT    /tradeserv/company/service-area ← Update service area

WEEK 4: VERIFICATION
────────────────────
  21. POST   /tradeserv/verification/documents/upload  ← Upload document
  22. GET    /tradeserv/verification                   ← Get verification status
  23. GET    /tradeserv/verification/documents         ← List documents
  24. DELETE /tradeserv/verification/documents/:id     ← Remove document
  25. POST   /admin/tradeserv/verification/:id/review  ← Admin: approve/reject
  26. GET    /admin/tradeserv/verification             ← Admin: pending queue

WEEK 4-5: SERVICES
─────────────────
  27. GET    /tradeserv/services               ← List public services
  28. GET    /tradeserv/services/:id           ← Get service detail
  29. POST   /tradeserv/services               ← Create service
  30. PATCH  /tradeserv/services/:id           ← Update service
  31. DELETE /tradeserv/services/:id           ← Delete service
  32. PATCH  /tradeserv/services/:id/feature   ← Toggle featured
  33. PATCH  /tradeserv/services/:id/activate  ← Toggle active

WEEK 5: PORTFOLIO
────────────────
  34. GET    /tradeserv/portfolio              ← List public portfolio
  35. POST   /tradeserv/portfolio/projects     ← Add project
  36. PATCH  /tradeserv/portfolio/projects/:id ← Update project
  37. DELETE /tradeserv/portfolio/projects/:id ← Delete project
  38. POST   /tradeserv/portfolio/case-studies           ← Add case study
  39. PATCH  /tradeserv/portfolio/case-studies/:id       ← Update case study
  40. DELETE /tradeserv/portfolio/case-studies/:id       ← Delete case study
  41. POST   /tradeserv/media/upload           ← Upload media file
  42. DELETE /tradeserv/media/:id              ← Delete media

WEEK 5-6: INQUIRY
────────────────
  43. POST   /tradeserv/inquiries              ← Buyer submits inquiry (PUBLIC)
  44. GET    /tradeserv/inquiries              ← Professional lists own inquiries
  45. GET    /tradeserv/inquiries/:id          ← Get inquiry detail
  46. PATCH  /tradeserv/inquiries/:id/status   ← Update status
  47. POST   /tradeserv/inquiries/:id/respond  ← Respond to inquiry

WEEK 6-7: PROPOSAL
─────────────────
  48. POST   /tradeserv/proposals              ← Create proposal
  49. GET    /tradeserv/proposals              ← List own proposals
  50. GET    /tradeserv/proposals/:id          ← Get proposal detail
  51. PATCH  /tradeserv/proposals/:id          ← Update proposal
  52. POST   /tradeserv/proposals/:id/send     ← Send to client
  53. POST   /tradeserv/proposals/:id/accept   ← Client accepts (signed link)
  54. POST   /tradeserv/proposals/:id/reject   ← Client rejects (signed link)
  55. GET    /tradeserv/proposals/:id/preview  ← Public preview link

WEEK 7: REVIEW
─────────────
  56. POST   /tradeserv/reviews                ← Buyer submits review
  57. GET    /tradeserv/reviews                ← List public reviews
  58. PATCH  /tradeserv/reviews/:id/feature    ← Toggle testimonial
  59. POST   /tradeserv/reviews/:id/respond    ← Professional responds
  60. POST   /tradeserv/reviews/:id/flag       ← Flag inappropriate

WEEK 7-8: SEARCH + DISCOVERY
───────────────────────────
  61. GET    /tradeserv/search                 ← Search professionals
  62. GET    /tradeserv/discovery/featured     ← Featured professionals
  63. GET    /tradeserv/discovery/trending     ← Trending professionals
  64. GET    /tradeserv/discovery/nearby       ← Nearby (geo query)
  65. GET    /tradeserv/discovery/recommended  ← AI-recommended

WEEK 8: MEMBERSHIP (REUSE)
─────────────────────────
  66. GET    /membership/current               ← Current plan (existing)
  67. GET    /membership/plans                 ← All plans (existing)
  68. POST   /membership/upgrade               ← Upgrade plan (existing)

WEEK 8: TRADTRUST (REUSE)
─────────────────────────
  69. GET    /tradtrust/score/:companyId       ← Public score (existing)
  70. GET    /tradtrust/history/:companyId     ← Score history (existing)
  71. POST   /tradtrust/recalculate/:companyId ← Admin: recalculate (existing)

WEEK 8: ADMIN
────────────
  72. GET    /admin/tradeserv/professionals              ← List all professionals
  73. GET    /admin/tradeserv/professionals/:id          ← Professional detail
  74. PATCH  /admin/tradeserv/professionals/:id/status   ← Approve/reject/suspend
  75. GET    /admin/tradeserv/analytics                  ← Platform analytics
  76. POST   /admin/tradeserv/featured                   ← Set featured professionals
```

### 4.2 Total API Count

| Category | Endpoints | Auth Required |
|---|---|---|
| Auth | 4 | 2 (register/login public) |
| Professional Profile | 6 | 5 |
| Business Identity | 10 | 10 |
| Verification | 6 | 4 (2 admin) |
| Services | 7 | 5 (2 public read) |
| Portfolio | 9 | 7 (2 public read) |
| Inquiry | 5 | 4 (1 public submit) |
| Proposal | 8 | 6 (2 via signed link) |
| Review | 5 | 3 (1 public read, 1 public submit) |
| Search + Discovery | 5 | 4 public (1 auth for recommended) |
| Membership (reuse) | 3 | 2 (1 public read) |
| TradTrust (reuse) | 3 | 1 public read, 1 owner, 1 admin |
| Admin | 5 | 5 admin |
| **TOTAL** | **76** | |

---

## 5. EVENT ARCHITECTURE

### 5.1 Event Definitions

```
EVENT                        PRODUCER              CONSUMER(S)                      TRIGGER                           PAYLOAD
════════════════════════════ ═════════════════════ ═════════════════════════════════ ═══════════════════════════════════ ════════════════════════════════════════════════

professional.registered      RegistrationService    NotificationService              Registration Step 7 submitted     { companyId, userId, slug, professionalType }
                                                  SearchService (index)
                                                  EcosystemService (XP seed)

profile.updated             ProfessionalProfileSer NotificationService              PUT /tradeserv/profile             { companyId, changedFields[] }
                             vice                  TradTrustService (recalc score)  (any field changed)               

profile.photo.updated       ProfessionalProfileSer NotificationService              POST /tradeserv/profile/photo      { companyId, photoUrl }
                             vice

company.updated             CompanyService         SearchService (re-index)         PUT /tradeserv/company             { companyId, changedFields[] }
                                                  PublicProfileService (refresh)

company.location.updated    CompanyService         LocationIntelligenceService       PUT /tradeserv/company/location    { companyId, lat, lng, city, state }
                                                  (geocode + re-index)

document.uploaded           VerificationService    VerificationService (scan)        POST /tradeserv/verification/...   { documentId, companyId, documentType }
                                                  (placeholder — no actual scanning)

document.verified           VerificationService    TradTrustService (recalc score)   POST /admin/.../review             { documentId, companyId, documentType }
                                                  NotificationService               (admin clicks Approve)            
                                                  SearchService (re-index)

document.rejected           VerificationService    NotificationService               POST /admin/.../review             { documentId, companyId, documentType,
                                                     (reason + resubmit link)          (admin clicks Reject)              rejectionReason }

company.fully-verified      VerificationService    TradTrustService (enable score)   All documents verified            { companyId, verificationLevel }
                                                  NotificationService (badge)
                                                  SearchService (boost rank)

service.created             ServiceService         SearchService (index)             POST /tradeserv/services          { serviceId, companyId, category }
                                                  PublicProfileService (refresh)

service.deleted             ServiceService         SearchService (re-index)          DELETE /tradeserv/services/:id     { serviceId, companyId }

service.featured-changed    ServiceService         PublicProfileService (reorder)    PATCH /tradeserv/.../feature       { serviceId, companyId, featured }

portfolio.updated           PortfolioService       AI Gateway (review prompt)        POST /tradeserv/portfolio/projects { companyId, projectCount, hasCaseStudies }
                                                  TradTrustService (recalc score)

inquiry.received            InquiryService         NotificationService               POST /tradeserv/inquiries          { inquiryId, companyId, senderCompanyId,
                                                  CRM (create lead)                 (buyer submits inquiry)             budget, timeline }
                                                  DashboardService (update count)

inquiry.status-changed      InquiryService         NotificationService               PATCH /tradeserv/inquiries/...     { inquiryId, companyId, oldStatus,
                                                  (to both parties)                 (professional changes status)       newStatus }

proposal.created            ProposalService        DashboardService (count)          POST /tradeserv/proposals          { proposalId, companyId, clientId, amount }

proposal.sent               ProposalService        NotificationService               POST /tradeserv/proposals/.../send { proposalId, companyId, clientId,
                                                  (email to client with link)        (professional clicks Send)          signedAcceptUrl, signedRejectUrl }

proposal.accepted           ProposalService        NotificationService               POST /tradeserv/proposals/.../     { proposalId, companyId, clientId,
                                                  (both parties)                     accept via signed link              amount, acceptedAt }
                                                  ReviewService (schedule request
                                                    — trigger 7 days later)

proposal.rejected           ProposalService        NotificationService               POST /tradeserv/proposals/.../     { proposalId, companyId, clientId,
                                                  (to professional)                  reject via signed link              rejectionReason }

review.submitted            ReviewService          TradTrustService (recalc score)   POST /tradeserv/reviews            { reviewId, companyId, rating, clientId }
                                                  PublicProfileService (update)

review.featured-changed     ReviewService          PublicProfileService (reorder)    PATCH /tradeserv/reviews/.../      { reviewId, companyId, featured }
                                                                                      feature

score.updated               TradTrustService       PublicProfileService (update      Any TradTrust recalculation        { companyId, oldScore, newScore,
                                                     score display)                                                                oldGrade, newGrade }
                                                  SearchService (re-rank)
                                                  NotificationService (if threshold
                                                     crossed: "You reached Gold!")

membership.upgraded         MembershipService      FeatureFlagsService (update)      POST /membership/upgrade           { companyId, oldPlan, newPlan,
                                                  TradTrustService (re-weight)                                                 expiryDate }
                                                  NotificationService

analytics.daily-snapshot    Cron Job               DashboardService (refresh)        Every midnight (00:00 UTC)         { companyId, date, views, searches,
                                                  AnalyticsService (trends)                                                    inquiries, proposals, reviews }
```

### 5.2 Event Rules

1. **Idempotency**: Every event must carry a unique `eventId` (UUIDv4). Consumer must deduplicate by `eventId`.
2. **Async delivery**: Events fire asynchronously via in-process EventEmitter or message queue. The producer API must not wait for consumers.
3. **Failure isolation**: Consumer failure must not affect producer. Use try/catch with error logging per consumer.
4. **Event ordering**: No guaranteed ordering between events. If order matters (e.g., document.verified must fire before company.fully-verified), the consumer must check state.
5. **Retention**: Events are ephemeral. No event store. If persistence is needed later, use the existing Notification model.

---

## 6. PERMISSION MATRIX

### 6.1 Role Definitions

| Role | Scope | Description |
|---|---|---|
| **PUBLIC** | Unauthenticated | Anyone browsing TradeServ |
| **BUYER** | Authenticated User with BUYER role | Can search, view profiles, submit inquiries, submit reviews |
| **PROFESSIONAL** | Company with `professionalType != null` | Owns a professional workspace. Can manage own profile/services/portfolio/inquiries/proposals. Maps to existing `SELLER` role with `professionalType` discriminator |
| **COMPANY** | Authenticated User linked to a Company | Base role for anyone with a company. Inherits BUYER or PROFESSIONAL based on `professionalType` |
| **RM** | Relationship Manager | Can view professional performance, assist with issues, manage territory |
| **ADMIN** | ADMIN role | Can review documents, manage professionals, view platform analytics |
| **SUPER_ADMIN** | SUPER_ADMIN role | Everything. Can manage plans, settings, all professionals |

### 6.2 Endpoint × Role Matrix

```
ENDPOINT                              PUBLIC  BUYER   PROF    COMPANY  RM      ADMIN   SUPER
═════════════════════════════════════ ═══════ ═══════ ═══════ ════════ ═══════ ═══════ ═══════

POST /auth/register                    ✅      —       —       —        —       —       —
POST /auth/login                       ✅      —       —       —        —       —       —
GET /auth/me                           —       ✅      ✅      ✅       ✅      ✅      ✅
PATCH /auth/me                         —       ✅      ✅      ✅       ✅      ✅      ✅

GET /tradeserv/profile                 —       —       ✅      —        —       ✅      ✅
PUT /tradeserv/profile                 —       —       ✅      —        —       —       —
POST /tradeserv/profile/photo          —       —       ✅      —        —       —       —
POST /tradeserv/profile/cover          —       —       ✅      —        —       —       —
POST /tradeserv/profile/certifications —       —       ✅      —        —       —       —
DELETE /tradeserv/.../certifications   —       —       ✅      —        —       —       —

GET /tradeserv/company                 —       —       ✅      —        —       ✅      ✅
PUT /tradeserv/company                 —       —       ✅      —        —       —       —
GET /tradeserv/company/location        ✅      ✅      ✅      ✅       ✅      ✅      ✅
PUT /tradeserv/company/location        —       —       ✅      —        —       —       —
GET /tradeserv/company/hours           ✅      ✅      ✅      ✅       ✅      ✅      ✅
PUT /tradeserv/company/hours           —       —       ✅      —        —       —       —
GET /tradeserv/company/languages       ✅      ✅      ✅      ✅       ✅      ✅      ✅
PUT /tradeserv/company/languages       —       —       ✅      —        —       —       —
GET /tradeserv/company/service-area    ✅      ✅      ✅      ✅       ✅      ✅      ✅
PUT /tradeserv/company/service-area    —       —       ✅      —        —       —       —

POST /tradeserv/verification/upload    —       —       ✅      —        —       —       —
GET /tradeserv/verification            —       —       ✅      —        —       ✅      ✅
DELETE /tradeserv/verification/docs    —       —       ✅      —        —       —       —
POST /admin/.../review                 —       —       —       —        —       ✅      ✅
GET /admin/.../verification            —       —       —       —        —       ✅      ✅

GET /tradeserv/services                ✅      ✅      ✅      ✅       ✅      ✅      ✅
GET /tradeserv/services/:id            ✅      ✅      ✅      ✅       ✅      ✅      ✅
POST /tradeserv/services               —       —       ✅      —        —       —       —
PATCH /tradeserv/services/:id          —       —       ✅      —        —       —       —
DELETE /tradeserv/services/:id         —       —       ✅      —        —       —       —
PATCH /tradeserv/.../feature           —       —       ✅      —        —       —       —
PATCH /tradeserv/.../activate          —       —       ✅      —        —       —       —

GET /tradeserv/portfolio               ✅      ✅      ✅      ✅       ✅      ✅      ✅
POST /tradeserv/portfolio/projects     —       —       ✅      —        —       —       —
PATCH /tradeserv/.../projects/:id      —       —       ✅      —        —       —       —
DELETE /tradeserv/.../projects/:id     —       —       ✅      —        —       —       —
POST /tradeserv/portfolio/case-studies —       —       ✅      —        —       —       —
DELETE /tradeserv/.../case-studies     —       —       ✅      —        —       —       —
POST /tradeserv/media/upload           —       —       ✅      —        —       —       —
DELETE /tradeserv/media/:id            —       —       ✅      —        —       —       —

POST /tradeserv/inquiries              —       ✅      —       ✅       —       —       —
GET /tradeserv/inquiries               —       —       ✅      —        ✅      ✅      ✅
GET /tradeserv/inquiries/:id           —       —       ✅      —        ✅      ✅      ✅
PATCH /tradeserv/inquiries/:id/status  —       —       ✅      —        —       —       —
POST /tradeserv/inquiries/:id/respond  —       —       ✅      —        —       —       —

POST /tradeserv/proposals              —       —       ✅      —        —       —       —
GET /tradeserv/proposals               —       —       ✅      —        ✅      ✅      ✅
GET /tradeserv/proposals/:id           —       —       ✅      —        ✅      ✅      ✅
PATCH /tradeserv/proposals/:id         —       —       ✅      —        —       —       —
POST /tradeserv/.../send               —       —       ✅      —        —       —       —
POST /tradeserv/.../accept             ✅      —       —       —        —       —       —
POST /tradeserv/.../reject             ✅      —       —       —        —       —       —

POST /tradeserv/reviews                —       ✅      —       ✅       —       —       —
GET /tradeserv/reviews                 ✅      ✅      ✅      ✅       ✅      ✅      ✅
PATCH /tradeserv/reviews/:id/feature   —       —       ✅      —        —       —       —
POST /tradeserv/reviews/:id/respond    —       —       ✅      —        —       —       —
POST /tradeserv/reviews/:id/flag       —       —       ✅      —        —       ✅      ✅

GET /tradeserv/search                  ✅      ✅      ✅      ✅       ✅      ✅      ✅
GET /tradeserv/discovery/featured      ✅      ✅      ✅      ✅       ✅      ✅      ✅
GET /tradeserv/discovery/trending      ✅      ✅      ✅      ✅       ✅      ✅      ✅
GET /tradeserv/discovery/nearby        ✅      ✅      ✅      ✅       ✅      ✅      ✅
GET /tradeserv/discovery/recommended   —       ✅      —       ✅       —       —       —

GET /membership/current                —       —       ✅      —        —       ✅      ✅
GET /membership/plans                  ✅      ✅      ✅      ✅       ✅      ✅      ✅
POST /membership/upgrade               —       —       ✅      —        —       —       —

GET /tradtrust/score/:companyId        ✅      ✅      ✅      ✅       ✅      ✅      ✅
GET /tradtrust/history/:companyId      ✅      ✅      ✅      ✅       ✅      ✅      ✅
POST /tradtrust/recalculate/:companyId —       —       —       —        —       ✅      ✅

GET /admin/tradeserv/professionals     —       —       —       —        —       ✅      ✅
GET /admin/tradeserv/professionals/:id —       —       —       —        —       ✅      ✅
PATCH /admin/.../status                —       —       —       —        —       ✅      ✅
GET /admin/tradeserv/analytics         —       —       —       —        —       ✅      ✅
POST /admin/tradeserv/featured         —       —       —       —        —       ✅      ✅
```

### 6.3 ABAC Rules (Attribute-Based)

| Rule | Evaluation | Applies To |
|---|---|---|
| **Company Ownership** | `req.user.companyId === param.companyId` or `req.user.companyId === record.companyId` | All OWNER endpoints |
| **Proposal Client Access** | Signed JWT in URL containing `proposalId` + `clientCompanyId` | `POST /proposals/:id/accept`, `POST /proposals/:id/reject` |
| **Review Ownership** | `req.user.companyId === review.companyId` (professional) OR `req.user.companyId === review.clientId` (reviewer) | `PATCH /reviews/:id/flag` |
| **Inquiry Receivership** | `req.user.companyId === inquiry.companyId` | `GET /inquiries`, `PATCH /inquiries/:id/status` |
| **Verification Assignment** | Admin only — no company ownership check | `POST /admin/.../review` |
| **Self vs Other** | Profile data: owner sees all fields; public sees limited fields | `GET /tradeserv/profile` (owner) vs `GET /tradeserv/profiles/:slug` (public) |

---

## 7. SEARCH ARCHITECTURE

### 7.1 OpenSearch Index Design

```
INDEX NAME: tradeserv_professionals

PRIMARY FIELDS
──────────────
  Field                     Type         Analyzer       Indexed  Stored  Searchable
  ───────────────────────── ──────────── ────────────── ──────── ─────── ──────────
  id                        keyword      —              ✅       ✅      Filter
  companyId                 keyword      —              ✅       ✅      Filter
  slug                      keyword      —              ✅       ✅      Filter
  name                      text         standard       ✅       ✅      Full-text
  title                     text         standard       ✅       ✅      Full-text
  bio                       text         standard       ✅       ✅      Full-text
  category                  keyword      —              ✅       ✅      Filter (exact)
  services.name[]           text         standard       ✅       —       Full-text
  services.category[]       keyword      —              ✅       —       Filter
  location.city             keyword      —              ✅       ✅      Filter
  location.state            keyword      —              ✅       ✅      Filter
  location.lat              geo_point    —              ✅       —       Geo-distance
  location.lng              geo_point    —              ✅       —       Geo-distance
  languages[]               keyword      —              ✅       —       Filter
  experience                integer      —              ✅       —       Range filter
  rating.avg                float        —              ✅       —       Range filter
  rating.count              integer      —              ✅       —       Range filter
  tradtrust.score           integer      —              ✅       —       Range filter
  tradtrust.grade           keyword      —              ✅       —       Filter
  verification.level        integer      —              ✅       —       Range filter
  responseTimeMinutes       integer      —              ✅       —       Range filter
  membership.plan           keyword      —              ✅       —       Filter
  membership.active         boolean      —              ✅       —       Filter
  isActive                  boolean      —              ✅       —       Filter
  isFeatured                boolean      —              ✅       —       Filter
  lastActiveAt              date         —              ✅       —       Sort
  createdAt                 date         —              ✅       —       Sort
  priceMin                  float        —              ✅       —       Range filter
  priceMax                  float        —              ✅       —       Range filter
  portfolio.projectCount    integer      —              ✅       —       Range filter
  portfolio.hasCaseStudies  boolean      —              ✅       —       Filter

NESTED FIELDS
  services[] — nested object (name, category, priceMin, priceMax, deliveryDays)
  availability[] — nested object (dayOfWeek, startTime, endTime)
```

### 7.2 Ranking Algorithm

```
TOTAL SCORE = Σ(weight × normalized_factor)

FACTOR          WEIGHT    SOURCE                    NORMALIZATION
───────         ──────    ────────────────────────── ───────────────────────────────
TradTrust Score  25%      TradTrustScore.score       score / 100 (already 0-100)
Geo Distance     15%      lat/lng → buyer's location 1 - (distance / maxRadius)
                              (Near→Far→Best™)        (0 = farthest, 1 = nearest)
Response Time    10%      Company.responseTimeMinutes 1 - (minutes / 1440)
                              (lower = better)        (capped at 0)
Rating           10%      ProfessionalReview.avg       avgRating / 5
Verification     10%      Company.verificationLevel     level / 8
Portfolio        10%      ProfessionalPortfolio.count   min(count / 5, 1)
Active Recent    10%      Company.lastActiveAt          1 if active in 7 days, else 0.5
Profile Complete  5%      ProfessionalProfile.fields    filledFields / totalFields
Membership Tier   5%      Subscription.planTier          planTier / 5

CONSTRAINTS (hard filters, not ranking):
  - professionalType must match (INDIVIDUAL_CONSULTANT | FIRM | FREELANCER | AGENCY)
  - professionalStatus must be APPROVED
  - isActive must be true
  - verificationLevel >= LEVEL_3 (minimum verified)
```

### 7.3 Near→Far→Best™ Integration

The existing `LocationIntelligenceService` and `MarketplaceIntelligenceService` handle geo queries.

```
WORKFLOW:
1. Buyer searches → detects if coordinates available (from browser geolocation or IP)
2. If coordinates available:
   a. Geo-filter: limit to professionals within maxRadius (default 100km)
   b. Geo-boost: "Near" factor in ranking (15% weight)
3. If no coordinates:
   a. Use buyer's saved city from User/Company profile
   b. Match against ProfessionalServiceArea.city
4. Fallback: no geo filtering (ranking works without location)

EXPANSION TIERS (from existing MarketplaceIntelligenceEngine):
  Tier 1: 0-25km  (Local — highest geo weight)
  Tier 2: 25-100km (Regional — medium geo weight)
  Tier 3: 100-500km (National — reduced geo weight)
  Tier 4: 500km+   (Pan-India — minimal geo weight)
  Tier 5: Remote only (no geo weight, but boosted by available)
```

### 7.4 API Query Parameters

```
GET /tradeserv/search?q=audit+gst&category=CA&city=Mumbai&minRating=4&
  maxPrice=50000&languages=English,Hindi&available=remote&
  sort=relevance&page=1&limit=20&lat=19.0760&lng=72.8777&radius=50

PARAMETER   TYPE      DEFAULT    DESCRIPTION
──────────  ────────  ─────────  ──────────────────────────────────────
q           string    —          Full-text search query
category    string    —          Exact match on category
city        string    —          Filter by city
state       string    —          Filter by state
minRating   float     —          Minimum average rating (1-5)
maxPrice    float     —          Maximum service price
languages   string    —          Comma-separated language filter
available   string    —          remote | onsite | hybrid
verified    boolean   —          Filter by verification level >= LEVEL_3
tradtrust   string    —          Minimum TradTrust grade (A | B | C | D)
plan        string    —          Minimum membership plan
lat         float     —          Buyer latitude (for Near→Far→Best™)
lng         float     —          Buyer longitude
radius      integer   100        Search radius in km
sort        string    relevance  relevance | rating | experience | newest
page        integer   1          Page number
limit       integer   20         Results per page (max 50)
```

### 7.5 Indexing Strategy

| Event | Action | Delay |
|---|---|---|
| `professional.registered` | Index on APPROVAL (not on registration) | Immediate |
| `profile.updated` | Re-index document | 5 second debounce |
| `company.updated` | Re-index document | 5 second debounce |
| `service.created` | Re-index parent professional | Immediate |
| `service.deleted` | Re-index parent professional | Immediate |
| `portfolio.updated` | Re-index parent professional | Immediate |
| `review.submitted` | Re-index parent professional | Immediate |
| `score.updated` | Re-index parent professional | Immediate |
| `membership.upgraded` | Re-index parent professional | Immediate |
| `company.fully-verified` | Re-index parent professional | Immediate |

---

## 8. TRADTRUST INTEGRATION

### 8.1 Scoring Architecture

```
TRADTRUST SCORE = Professional Score (40%) + Behavioral Score (45%) + Penalties (-15% max)

   PROFESSIONAL SCORE (40%)
   ├── Profile Completeness (10%) — % of ProfessionalProfile fields filled
   ├── Document Verification (15%) — % of verified documents
   │     (PAN, GST, MSME, Certificates, License, Insurance)
   ├── Portfolio Quality (10%) — has projects? has case studies? media count?
   └── Certification Count (5%) — number of verified certifications (log scale)

   BEHAVIORAL SCORE (45%)
   ├── Review Rating (15%) — average rating (min 3 reviews required)
   ├── Review Volume (10%) — log₂(review_count) / log₂(max_count)
   ├── Response Rate (10%) — inquiries responded to / total inquiries
   ├── Proposal Win Rate (5%) — proposals accepted / proposals sent
   └── Membership Tier (5%) — plan tier score (0-100)

   PENALTIES (max -15%)
   ├── Low Response Time (>48h) — -5%
   ├── Inactive >30 days — -5%
   ├── High Rejection Rate (>50%) — -5%
   └── Multiple Rejected Documents — -2% per rejection (max -10%)

GRADE THRESHOLDS:
   0-30:   None (no badge)
   31-50:  Bronze
   51-70:  Silver
   71-85:  Gold
   86-95:  Platinum
   96-100: Elite
```

### 8.2 Score Trigger Points

| Event | Fires Score Recalculation? | Impact |
|---|---|---|
| `profile.updated` | ✅ Yes | Profile Completeness factor changes |
| `document.verified` | ✅ Yes | Document Verification factor changes |
| `document.rejected` | ✅ Yes | Penalty may apply |
| `company.fully-verified` | ✅ Yes | All document factors now 100% |
| `service.created` | ❌ No | Service count does not affect scoring |
| `portfolio.updated` | ✅ Yes | Portfolio Quality changes |
| `review.submitted` | ✅ Yes | Review Rating + Volume change |
| `inquiry.received` | ❌ No | Not scored |
| `inquiry.responded` | ✅ Yes | Response Rate changes |
| `proposal.accepted` | ✅ Yes | Win Rate changes |
| `proposal.rejected` | ✅ Yes | Win Rate + Rejection Rate change |
| `membership.upgraded` | ✅ Yes | Membership Tier changes |
| `membership.expired` | ✅ Yes | Membership Tier drops |
| Daily cron (>30d inactivity) | ✅ Yes | Inactivity penalty |
| Daily cron (>48h avg response) | ✅ Yes | Slow response penalty |

### 8.3 Score Read Points

| Screen | Reads Score From | Display |
|---|---|---|
| Public Profile (`/tradeserv/p/:slug`) | `GET /tradtrust/score/:companyId` | Grade badge + score number |
| Search Results | OpenSearch index (pre-computed) | Grade badge on card |
| Professional Workspace Dashboard | `GET /tradtrust/score/:companyId` | Score widget with factors |
| TradTrust Workspace Page | `GET /tradtrust/score/:companyId` + `GET /tradtrust/history` | Full breakdown + history chart |
| Admin Dashboard | `GET /tradtrust/score/:companyId` | All professionals' scores |

### 8.4 Scoring Guard Conditions

Score is **hidden** (shows `--`) until:
- `professionalStatus === APPROVED` AND
- `verificationLevel >= LEVEL_3` AND
- At least 3 documents verified

Score shows but is **marked as "Limited"** if:
- Reviews < 3 (rating displays but weight reduced)
- No inquiries received yet (response rate = N/A, factor splits among other factors)

---

## 9. NOTIFICATION FLOW

### 9.1 Notification Template Definitions

All notifications use the existing `NotificationService.createWithTemplate()`.

```
EVENT                      NOTIFICATION TYPE       RECIPIENT          TEMPLATE CONTENT
══════════════════════════ ════════════════════════ ══════════════════ ════════════════════════════════════════════════════════

professional.registered    TRADESERV_WELCOME         Professional       "Welcome to TradeServ! Your profile is being reviewed."
                                                     (in-app + email)   Subject: Welcome to TradeServ

document.verified          TRADESERV_DOC_VERIFIED    Professional       "{{documentType}} has been verified. {{verifiedCount}}/{{totalCount}} documents complete."
                                                     (in-app + email)   Subject: Document Verified ✓

document.rejected          TRADESERV_DOC_REJECTED    Professional       "{{documentType}} was rejected. Reason: {{reason}}. Please upload a corrected version."
                                                     (in-app + email)   Subject: Document Needs Attention

company.fully-verified     TRADESERV_VERIFIED        Professional       "Congratulations! Your profile is now TRADTRUST Verified. Your TradTrust score is now active."
                                                     (in-app + email)   Subject: You're Verified! ✓

inquiry.received           TRADESERV_INQUIRY         Professional       "New inquiry from {{senderName}} ({{senderCompany}}). Budget: {{budget}}. Timeline: {{timeline}}."
                                                     (in-app + email)   Subject: New Inquiry: {{senderCompany}}
                                                     
inquiry.status-changed     TRADESERV_INQUIRY_STATUS  Buyer (sender)     "Your inquiry to {{professionalName}} has been {{status}}."
                                                     (in-app + email)   Subject: Inquiry Update

proposal.created           (no notification — draft) —                  Proposals in draft do not trigger notifications.

proposal.sent              TRADESERV_PROPOSAL_SENT   Client (buyer)     "{{professionalName}} has sent you a proposal for {{proposalTitle}}. Amount: {{amount}}."
                                                     (in-app + email)   Subject: New Proposal from {{professionalName}}

proposal.accepted          TRADESERV_PROPOSAL_       Professional       "{{clientName}} has accepted your proposal for {{proposalTitle}}!"
                           ACCEPTED                  (in-app + email)   Subject: Proposal Accepted ✓

proposal.accepted          TRADESERV_PROPOSAL_       Client (buyer)     "You've accepted {{professionalName}}'s proposal. Expect to hear from them shortly."
                           ACCEPTED_BUYER            (in-app)           (no email — they already clicked the accept button)

proposal.rejected          TRADESERV_PROPOSAL_       Professional       "{{clientName}} has declined your proposal for {{proposalTitle}}. Reason: {{reason}}."
                           REJECTED                  (in-app + email)   Subject: Proposal Declined

review.submitted           TRADESERV_REVIEW          Professional       "{{reviewerName}} left a {{rating}}-star review: \"{{commentPreview}}...\""
                                                     (in-app + email)   Subject: New Review for {{professionalName}}

score.updated              TRADESERV_SCORE_UP        Professional       "Your TradTrust score has increased to {{newScore}} ({{newGrade}})!"
                           (only if newScore > old)  (in-app + email)   Subject: TradTrust Score Updated ➚

score.updated              TRADESERV_SCORE_DOWN      Professional       "Your TradTrust score has changed to {{newScore}} ({{newGrade}}). View details."
                           (only if newScore < old)  (in-app + email)   Subject: TradTrust Score Updated ➘

score.threshold-crossed    TRADESERV_BADGE_EARNED    Professional       "Congratulations! You've reached {{newGrade}} status on TradeServ!"
                                                     (in-app + email)   Subject: New Badge Earned! 🏆

membership.upgraded        TRADESERV_PLAN_UPGRADED   Professional       "You've upgraded to {{planName}}. Your new benefits are now active."
                                                     (in-app + email)   Subject: Plan Upgraded ✓

membership.expiring        TRADESERV_PLAN_EXPIRING   Professional       "Your {{planName}} plan expires in {{daysRemaining}} days. Renew to keep your benefits."
                           (cron: 30/15/7/3/1 days)  (in-app + email)   Subject: Membership Renewal Reminder

analytics.weekly-digest    TRADESERV_WEEKLY_DIGEST   Professional       "Your weekly TradeServ stats: {{views}} views, {{searches}} searches, {{inquiries}} inquiries."
                           (cron: every Monday)      (in-app + email)   Subject: Your Weekly TradeServ Digest
```

### 9.2 Notification Channels

| Channel | When | Implementation |
|---|---|---|
| **In-App** | All events | `NotificationService.createWithTemplate()` → stored in DB → fetched by frontend `NotificationDrawer` |
| **Email** | Critical events only (welcome, verified, inquiry, proposal, score threshold, membership) | Via existing `EmailProcessor` queued by `NotificationProcessor` |
| **SMS** | Inquiry received (if professional has mobile notifications enabled) | Via existing `SmsService` (Twilio) |
| **Push** | Not in scope for v1 | Future enhancement |

### 9.3 Opt-Out Rules

Professionals can disable notification types via the Settings API:

```
PATCH /tradeserv/settings/notifications
{
  "email": {
    "inquiry_received": false,       ← opt out of email for new inquiries
    "weekly_digest": false           ← opt out of weekly digest
  },
  "sms": {
    "inquiry_received": true         ← opt in to SMS for inquiries
  }
}
```

---

## 10. AI GATEWAY INTEGRATION

### 10.1 AI Task Definitions

All AI features route through the existing `AiGatewayService` with `TaskType` and `action` discrimination.

```
TASK TYPE             ACTION              MODULE OWNER       CREDITS   INPUT                          OUTPUT
═════════════════════ ═══════════════════ ═══════════════════ ═════════ ═══════════════════════════════ ═════════════════════════════════

PROFILE_REVIEW        review              ProfessionalProfile  5        profile data (bio, experience,   score breakdown, suggestions[]
                                                                       qualifications, certifications)   actionItems[]

BIO_GENERATION        generate-bio        ProfessionalProfile  5        raw inputs (experience,         generated bio text (3 variants)
                                                                       skills, industries)

BIO_GENERATION        improve-bio         ProfessionalProfile  3        existing bio text                improved bio with suggestions

PORTFOLIO_SUGGESTION  suggest-projects    ProfessionalPortfolio 5      portfolio data, category        project suggestions[]
                                                                                                        with templates

PORTFOLIO_SUGGESTION  suggest-case-study  ProfessionalPortfolio 5      project description             case study template
                                                                                                        (challenge/solution/outcome)

SERVICE_DESCRIPTION   generate-desc       ProfessionalService  3        service name + keywords          detailed description
SERVICE_DESCRIPTION   suggest-category    ProfessionalService  2        service description              category + subcategory

PRICING_SUGGESTION    suggest-pricing     ProfessionalService  5        service name, description,       priceRangeMin, priceRangeMax,
                                                                       competitors (optional),          pricingModel, explanation
                                                                       location

LEAD_REPLY            suggest-reply       ProfessionalInquiry  3        inquiry text, service context    suggested reply text
LEAD_REPLY            score-lead          ProfessionalInquiry  2        inquiry text, budget,           lead score (1-100), priority,
                                                                       timeline                          reasoning

MARKET_INSIGHT        demand-trends       ProfessionalProfile  5        category, location               demand trends, seasonal
                                                                                                        patterns, opportunities

MARKET_INSIGHT        competitor-analysis ProfessionalProfile  5        category, location               competitor pricing, service gaps

SEARCH_ANALYSIS       smart-filters       Search & Discovery  2        search query, results            filter suggestions, category
  (existing)                                                                                             refinements
```

### 10.2 Integration Points

| Module | AI Task | Where It's Called | UX |
|---|---|---|---|
| Professional Profile | `review`, `generate-bio`, `improve-bio` | Profile workspace page → "AI Review" button | Panel shows score + suggestions + rewrite options |
| Services | `generate-desc`, `suggest-category`, `suggest-pricing` | Service create/edit form → "AI Generate" button | Fills description, category, or pricing fields |
| Portfolio | `suggest-projects`, `suggest-case-study` | Portfolio page → "AI Suggest" button | Pre-fills project/case study forms |
| Inquiry | `suggest-reply`, `score-lead` | Inquiry detail page → "AI Reply" button | Shows suggested reply + lead score badge |
| Search | `smart-filters` (existing) | Search page → "AI Smart Search" | Filter suggestions in search sidebar |

### 10.3 Credit Costs

AI credits use the existing `AiCreditsService`. Costs are:

| TaskType | Credits per Call |
|---|---|
| PROFILE_REVIEW | 5 |
| BIO_GENERATION | 5 (generate) / 3 (improve) |
| PORTFOLIO_SUGGESTION | 5 |
| SERVICE_DESCRIPTION | 3 (generate) / 2 (suggest) |
| PRICING_SUGGESTION | 5 |
| LEAD_REPLY | 3 (reply) / 2 (score) |
| MARKET_INSIGHT | 5 |

### 10.4 Prompt Seed Data

Add to the existing `Prompt` table via `PromptManagerService`:

| Prompt Name | TaskType | System Prompt | Temperature | MaxTokens |
|---|---|---|---|---|
| `PROFILE_REVIEW` | PROFILE_REVIEW | "You are a professional profile reviewer for TradeServ..." | 0.3 | 2048 |
| `BIO_GENERATION` | BIO_GENERATION | "You are a professional bio writer..." | 0.5 | 1024 |
| `PORTFOLIO_SUGGESTION` | PORTFOLIO_SUGGESTION | "You are a portfolio consultant..." | 0.5 | 2048 |
| `SERVICE_DESCRIPTION` | SERVICE_DESCRIPTION | "You are a service description writer..." | 0.4 | 1024 |
| `PRICING_SUGGESTION` | PRICING_SUGGESTION | "You are a pricing strategy consultant..." | 0.3 | 1024 |
| `LEAD_REPLY` | LEAD_REPLY | "You are a business development assistant..." | 0.4 | 1024 |
| `MARKET_INSIGHT` | MARKET_INSIGHT | "You are a market research analyst..." | 0.3 | 2048 |

---

## 11. RISK ANALYSIS

### 11.1 Risk Register

```
ID   RISK                                   SEVERITY   PROBABILITY   MITIGATION
════ ═══════════════════════════════════════ ═════════  ═════════════ ════════════════════════════════════════════════════════

R01  ProfessionalType discriminator creates   HIGH       Medium        Use `professionalType` on existing Company model
      confusion between SELLER and PROFESSIONAL                          instead of new Role. One User can be both SELLER
                                                                        and PROFESSIONAL (e.g., a CA firm that also trades).

R02  Inquiry→Proposal→Review workflow has    HIGH       High          Implement after-engagement review request via cron
      no automated review request after                                  job (7 days after proposal.accepted). No manual
      proposal acceptance                                                "request review" needed.

R03  OpenSearch index drift — professional   HIGH       Medium        Implement reliable event→index pipeline. Use 5-second
      changes not reflected in search                                    debounce + DLQ for failed index operations.

R04  Price stored as string in frontend      MEDIUM     High          Backend must always use Decimal. Frontend must convert
      will break Decimal backend                                         all price strings to numbers before API calls. Add
                                                                        validation in DTO.

R05  Registration wizard data stored in       MEDIUM     High          Registration submit endpoint must accept complete
      localStorage may be lost on browser                                payload (all 7 steps at once). Server-side draft
      clear or different device                                          support via `PUT /tradeserv/register/draft` is
                                                                        optional for v1.

R06  Public proposal accept/reject via        MEDIUM     Medium        Use signed JWT embedded in URL. JWT must contain
      signed link is vulnerable to CSRF                                  proposalId + clientCompanyId + exp (7 days). Verify
                                                                        signature + expiry. No cookies needed.

R07  No email/SMS infrastructure in          MEDIUM     Medium        Reuse existing NotificationService which already has
      TradeServ — must reuse existing                                    EmailProcessor + Twilio SmsService. Just add templates.

R08  TradTrust scoring may show low scores   LOW        Medium        Show score as "--" until minimum conditions met
      for new professionals with no reviews                              (3 docs verified, 3 reviews minimum). This is already
      or inquiries                                                      designed in Section 8.4.

R09  Document file scanning (malware/        LOW        Low           Use existing FileScan model (already in Prisma but
      virus) not implemented                                             no service). Implement scan on upload for v1.1.

R10  GDPR/DPDP compliance for professional   LOW        Low           Company data already has privacy controls. Add
      data displayed on public profile                                   `showEmail`, `showPhone` toggles in Settings.

R11  Inquiry spam — rate limiting needed     MEDIUM     High          Rate limit `POST /tradeserv/inquiries` per IP
                                                                        (max 10/hour). Require authenticated BUYER role.

R12  Portfolio/media storage limits          LOW        Medium        Start with 10 images + 5 documents per professional.
                                                                        Reuse existing file upload infrastructure.
```

### 11.2 Risk Heat Map

```
HIGH    │  R02         R01  R03
        │
MEDIUM  │  R04  R05    R06  R07  R11
        │
LOW     │  R09  R10    R08  R12
        │
        └────────────────────────────
           LOW    MEDIUM    HIGH
                PROBABILITY
```

---

## 12. RECOMMENDED BACKEND SPRINT ORDER

### 12.1 Week-by-Week Implementation Roadmap

```
SPRINT 1 (Weeks 1-2): FOUNDATION + SCHEMA
═══════════════════════════════════════════════════════════════════════════════════
  Day 1-3:   Prisma schema — 11 new models, 3 enums, 7 model extensions
  Day 4:     Prisma migrations — validate, generate, push
  Day 5:     Create `TradeServModule` with empty sub-module stubs
  Day 6-7:   Seed script — create 10 categories, 1 demo professional, 1 buyer
  Day 8-10:  Company extension — add professional fields, CompanyOwnerGuard update
  Day 11-14: Professional Profile API — 6 endpoints (CRUD + photo + certifications)
  ─────────
  VERIFICATION: prisma validate ✅, prisma generate ✅, tsc api 0 errors ✅

SPRINT 2 (Weeks 3-4): BUSINESS IDENTITY + VERIFICATION
═══════════════════════════════════════════════════════════════════════════════════
  Day 15-17: Business Identity API — 10 endpoints (company, location, hours, languages)
  Day 18-19: Verification API — 6 endpoints (upload, list, review, admin queue)
  Day 20-21: Document type extensions — add 7 new DocumentType enum values
  Day 22-24: Notification templates — seed TRADESERV templates
  Day 25-28: Event wiring — wire notification events for sprints 1-2
  ─────────
  VERIFICATION: tsc api 0 errors ✅, all 16 endpoints respond ✅

SPRINT 3 (Week 5): SERVICES + PORTFOLIO
═══════════════════════════════════════════════════════════════════════════════════
  Day 29-31: Services API — 7 endpoints (CRUD + feature + activate)
  Day 32-33: Portfolio API — 9 endpoints (projects, case studies, media upload)
  Day 34:    Frontend API layer — `lib/api/tradeserv.ts` (service + portfolio functions)
  Day 35:    Wire services page + portfolio page to real APIs
  ─────────
  VERIFICATION: tsc api ✅, tsc web ✅, services page loads real data ✅

SPRINT 4 (Weeks 6-7): INQUIRY + PROPOSAL
═══════════════════════════════════════════════════════════════════════════════════
  Day 36-38: Inquiry API — 5 endpoints (submit, list, detail, status, respond)
  Day 39-42: Proposal API — 8 endpoints (CRUD + send + accept/reject via signed link)
  Day 43:    ProposalMilestone CRUD
  Day 44-45: Frontend API layer — inquiry + proposal functions
  Day 46-47: Wire inquiries page + proposals page to real APIs
  Day 48-49: Event wiring — inquiry.received → Notification + CRM. Proposal events.
  ─────────
  VERIFICATION: tsc api ✅, tsc web ✅, inquiry→proposal flow works end-to-end ✅

SPRINT 5 (Week 8): REVIEWS + TRADTRUST
═══════════════════════════════════════════════════════════════════════════════════
  Day 50-51: Review API — 5 endpoints (submit, list, feature, respond, flag)
  Day 52:    TradTrust professional factors — extend TradTrustService with
              portfolio quality, certification count, response rate factors
  Day 53:    Wire review submission → TradTrust recalculation
  Day 54-55: Wire reviews page to real API
  Day 56:    Event wiring — review.submitted → Notification
  ─────────
  VERIFICATION: tsc api ✅, TradTrust shows professional-specific factors ✅

SPRINT 6 (Week 9): SEARCH + DISCOVERY
═══════════════════════════════════════════════════════════════════════════════════
  Day 57-58: OpenSearch index mapping + indexing pipeline
  Day 59-60: Search API — full-text, filters, sort, pagination
  Day 61:    Geo search — Near→Far→Best™ integration
  Day 62:    Discovery API — featured, trending, nearby, recommended
  Day 63:    Wire search page to OpenSearch API (replace client-side filter)
  ─────────
  VERIFICATION: search returns results ✅, geo filter works ✅, page loads fast ✅

SPRINT 7 (Week 10): MEMBERSHIP + FRONTEND WIRING
═══════════════════════════════════════════════════════════════════════════════════
  Day 64:    Add professional plan types (Individual ₹2,499 / Company ₹5,999)
  Day 65:    Wire membership page to real plans API
  Day 66:    Wire dashboard to real analytics API + TradTrust API
  Day 67:    Wire public profile page to real API (replace DEMO_PROFILES)
  Day 68:    Registration → submit to real POST /tradeserv/register endpoint
  Day 69-70: Cleanup — remove all demo data, localStorage references
  ─────────
  VERIFICATION: all 20 pages load real data ✅, no demo data remains ✅

SPRINT 8 (Week 11): ADMIN + AI + POLISH
═══════════════════════════════════════════════════════════════════════════════════
  Day 71-72: Admin endpoints — professional list, detail, status management
  Day 73:    Admin verification queue — approve/reject documents
  Day 74-75: AI integration — PROFILE_REVIEW, BIO_GENERATION, SERVICE_DESCRIPTION,
              PRICING_SUGGESTION, LEAD_REPLY prompts + service methods
  Day 76:    AI credit costs — register new TaskTypes with credit costs
  Day 77:    Documentation — API docs, README updates
  ─────────
  VERIFICATION: admin manages professionals ✅, AI features work ✅

SPRINT 9 (Week 12): PRODUCTION READINESS
═══════════════════════════════════════════════════════════════════════════════════
  Day 78:    Rate limiting — inquiry submission + registration
  Day 79:    Error handling audit — ensure all endpoints return proper errors
  Day 80:    Load test — 100 concurrent users searching, submitting inquiries
  Day 81:    Security audit — signed link validation, permission checks
  Day 82:    Performance audit — OpenSearch query optimization, N+1 fixes
  Day 83:    Staging deployment + smoke tests
  Day 84:    Production deployment GO / NO-GO decision
  ─────────
  VERIFICATION: load test passes ✅, security audit passes ✅, staging green ✅
```

### 12.2 Dependency Blockers

| Sprint | Blocked By | Unblocking Condition |
|---|---|---|
| Sprint 1 | Existing Company model extension | `professionalType` field approved on Company |
| Sprint 3 | API layer must exist | Frontend wiring needs backends from Sprints 1-2 |
| Sprint 5 | Existing TradTrust module must accept new professional factors | TradTrust team adds Portfolio/Certification/ResponseRate factors |
| Sprint 6 | OpenSearch cluster must be accessible | DevOps provides credentials |
| Sprint 7 | All prior sprints complete | All APIs must work before frontend can wire |
| Sprint 8 | AI Gateway must have new TaskTypes registered | Prompt seeding must happen before AI features work |

### 12.3 Parallel Work Possible

| Work Stream 1 | Work Stream 2 | Can Run Parallel? |
|---|---|---|
| Sprint 1 (Schema) | Sprint 1 (Company extension) | ✅ Yes — different files |
| Sprint 2 (Verification) | Sprint 5 (TradTrust factors) | ✅ Yes — different modules |
| Sprint 3 (Services) | Sprint 3 (Portfolio) | ✅ Yes — independent models |
| Sprint 4 (Inquiry) | Sprint 4 (Proposal) | ✅ Yes — Proposal depends on Inquiry but can be built same sprint |
| Sprint 6 (Search) | Sprint 8 (AI) | ✅ Yes — different systems |

**Optimal parallel plan**: 6-8 weeks elapsed (not 12) by running Sprint 2 + Sprint 5, Sprint 3 internally, Sprint 4 internally, Sprint 6 + Sprint 8 in parallel.

---

## 13. IMPLEMENTATION RULES

### 13.1 Code Conventions

1. **No `any` types** anywhere in TradeServ code. Every DTO, service method, and controller must have explicit types.
2. **DTOs must use class-validator/class-transformer** decorators consistently (matching the existing TRADINGO standard).
3. **Every Prisma relation must have explicit `onDelete`** policy — no defaults.
4. **Every endpoint must return `PaginatedResponse<T>`** for list endpoints (using existing `paginate()` helper).
5. **Error responses must follow** `{ statusCode: 400, message: string[], error: "Validation Error", timestamp }` format.
6. **Every service method must have try/catch** with proper NestJS exception filters.
7. **Event emissions must be async** — use EventEmitter2 or queue. Never await consumers.

### 13.2 Testing Requirements

1. **Every DTO** must have a corresponding unit test validating decorators.
2. **Every service** must have integration tests with real Prisma (test database).
3. **Every controller** must have e2e tests with HTTP requests.
4. **Search** must have integration tests against a real OpenSearch test index.

### 13.3 Non-Negotiables

1. **No file is to be created or modified outside the `tradeserv/` directory** except:
   - `prisma/schema.prisma` (extend Company model + add new models)
   - `apps/api/src/app.module.ts` (register TradeServModule)
   - `apps/web/lib/api/tradeserv.ts` (frontend API layer)
   - `apps/web/hooks/use-tradeserv.ts` (frontend React Query hooks)
   - `apps/web/data/master-data.ts` (add workspace nav link if needed)
2. **No modification to existing TRADINGO business logic** (quotes, orders, RFQ, products, etc.)
3. **No new Role in `Role` enum** — use `professionalType` discriminator on Company.
4. **No new User model** — reuse existing `User` with `CompanyOwner` join.
5. **No AI features without credit enforcement** — every AI call must check credits first.

---

## 14. FILES TO CREATE VS FILES TO EXTEND

### 14.1 New Files (Backend)

```
apps/api/src/modules/tradeserv/
├── tradeserv.module.ts                          ← Root module
├── tradeserv.constants.ts                       ← Event names, constants
├── tradeserv.events.ts                          ← Event payload types
│
├── professional-profile/
│   ├── professional-profile.service.ts
│   ├── professional-profile.controller.ts
│   ├── dto/
│   │   ├── create-professional-profile.dto.ts
│   │   ├── update-professional-profile.dto.ts
│   │   └── add-certification.dto.ts
│   └── professional-profile.module.ts
│
├── business-identity/
│   ├── business-identity.service.ts
│   ├── business-identity.controller.ts
│   ├── dto/
│   │   ├── update-company.dto.ts
│   │   ├── update-location.dto.ts
│   │   ├── update-hours.dto.ts
│   │   ├── update-languages.dto.ts
│   │   └── update-service-area.dto.ts
│   └── business-identity.module.ts
│
├── professional-services/
│   ├── professional-services.service.ts
│   ├── professional-services.controller.ts
│   ├── dto/
│   │   ├── create-service.dto.ts
│   │   └── update-service.dto.ts
│   └── professional-services.module.ts
│
├── professional-portfolio/
│   ├── professional-portfolio.service.ts
│   ├── professional-portfolio.controller.ts
│   ├── dto/
│   │   ├── create-project.dto.ts
│   │   ├── update-project.dto.ts
│   │   ├── create-case-study.dto.ts
│   │   └── update-case-study.dto.ts
│   └── professional-portfolio.module.ts
│
├── professional-inquiry/
│   ├── professional-inquiry.service.ts
│   ├── professional-inquiry.controller.ts
│   ├── dto/
│   │   ├── create-inquiry.dto.ts
│   │   └── update-inquiry-status.dto.ts
│   └── professional-inquiry.module.ts
│
├── professional-proposal/
│   ├── professional-proposal.service.ts
│   ├── professional-proposal.controller.ts
│   ├── dto/
│   │   ├── create-proposal.dto.ts
│   │   ├── update-proposal.dto.ts
│   │   └── proposal-action.dto.ts
│   └── professional-proposal.module.ts
│
├── professional-review/
│   ├── professional-review.service.ts
│   ├── professional-review.controller.ts
│   ├── dto/
│   │   ├── create-review.dto.ts
│   │   └── respond-review.dto.ts
│   └── professional-review.module.ts
│
├── professional-search/
│   ├── professional-search.service.ts
│   ├── professional-search.controller.ts
│   ├── dto/
│   │   └── search-query.dto.ts
│   └── professional-search.module.ts
│
├── professional-discovery/
│   ├── professional-discovery.service.ts
│   ├── professional-discovery.controller.ts
│   └── professional-discovery.module.ts
│
└── professional-admin/
    ├── professional-admin.controller.ts
    └── professional-admin.module.ts

Total new backend files: ~48
```

### 14.2 New Files (Frontend)

```
apps/web/lib/api/tradeserv.ts                     ← All TradeServ API functions
apps/web/hooks/use-tradeserv.ts                   ← All TradeServ React Query hooks
apps/web/components/tradeserv/use-copy-to-clipboard.ts  ← New shared hook
apps/web/components/tradeserv/glass-card-preview.tsx    ← New shared component
apps/web/components/tradeserv/status-tab-bar.tsx        ← New shared component

Total new frontend files: 5
```

### 14.3 Files to Extend

```
File                                              Change
══════════════════════════════════════════════════ ════════════════════════════════════════════════
prisma/schema.prisma                               Add: 11 new models, 3 enums (ProfessionalType,
                                                    ProfessionalStatus, ProposalStatus)
                                                   Extend: Company (11 fields), CompanyDocument
                                                    (7 new DocumentType), VerificationLevel
                                                    (LEVEL_7, LEVEL_8), BusinessType (3 new),
                                                    PlanType (2 new), TaskType (8 new)

apps/api/src/app.module.ts                         Import TradeServModule

apps/api/src/modules/tradtrust/tradtrust.service.ts Add professional-specific scoring factors
                                                     (portfolio quality, certification count,
                                                     response rate)

apps/api/src/modules/tradtrust/tradtrust-weights    Update weights for professional factors
  .config.ts

apps/api/src/modules/location-intelligence/         Add findNearbyProfessionals() method
  location-intelligence.service.ts

apps/api/src/modules/marketplace-intelligence/       Extend getUnifiedScore() with professional
  marketplace-intelligence.engine.ts                 factors

apps/api/src/modules/membership/membership.service.ts Seed professional plans

apps/api/src/modules/ai-gateway/ai-credits.service.ts Add CREDIT_COSTS for 7 new TaskTypes

apps/api/src/modules/notification/notification       Add TRADESERV notification templates
  .template.service.ts

apps/web/lib/api/tradeserv.ts                       All 60+ API functions

apps/web/hooks/use-tradeserv.ts                     All React Query hooks

apps/web/data/master-data.ts                        Add workspace nav if needed
```

---

## 15. FINAL APPROVAL CHECKLIST

Before implementation begins, the following must be confirmed:

- [ ] **ProfessionalType enum values** finalized: INDIVIDUAL_CONSULTANT, FIRM, FREELANCER, AGENCY
- [ ] **ProfessionalStatus enum values** finalized: PENDING_REVIEW, APPROVED, REJECTED, SUSPENDED
- [ ] **ProposalStatus enum values** finalized: DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, WITHDRAWN
- [ ] **Pricing model**: Decimal (backend) / number (frontend) confirmed — no strings
- [ ] **Role strategy confirmed**: Use existing SELLER role with `professionalType` discriminator (no new Role)
- [ ] **Single source of truth confirmed**: Profile page will remove services/portfolio/business sections
- [ ] **Search engine**: OpenSearch confirmed available for Sprint 6
- [ ] **Document scan**: Deferred to v1.1 — accept uploads without scan in v1
- [ ] **Booking system**: Deferred to Phase 20+ — not in scope for this implementation
- [ ] **AI credits**: All 7 new TaskTypes registered with credit costs before AI integration
- [ ] **Notification templates**: All TRADESERV templates seeded before event wiring
- [ ] **Proposal signed link**: Security review completed for accept/reject flow

---

*This document is the permanent backend contract for TradeServ v1.0. Any deviation from the architecture, API structure, model design, or event flow defined here requires a new freeze cycle and Founder approval.*

*Generated: 03 Jul 2026 | Version: 1.0 | Status: AWAITING FOUNDER APPROVAL*
