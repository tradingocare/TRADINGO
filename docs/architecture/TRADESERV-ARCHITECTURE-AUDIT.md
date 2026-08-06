# TradeServ Architecture Audit — Phase 11

## Complete Workflow Diagram

```
                          ┌──────────────────────────────────────────────────────────────┐
                          │                    TRADESERV PLATFORM                         │
                          │                                                              │
  ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐    ┌───────────┐
  │  PUBLIC  │    │  REGISTRATION │───▶│    PROFILE   │───▶│  BUSINESS  │───▶│VERIFICATION│
  │ LANDING  │    │  (7 Steps)   │    │  MANAGEMENT  │    │  IDENTITY  │    │(Documents)│
  └──────────┘    └──────────────┘    └──────────────┘    └────────────┘    └─────┬─────┘
       │                                                                          │
       ▼                                                                          ▼
  ┌──────────┐                                                           ┌──────────────┐
  │ SEARCH   │◀──────────────────────────────────────────────────────────│   TRADTRUST  │
  │(Buyers)  │                                                           │  (Scoring)   │
  └──────────┘                                                           └──────────────┘
       │                                                                       │
       ▼                                                                       ▼
  ┌───────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   ┌──────────┐
  │  PUBLIC   │    │   SERVICES   │    │   PORTFOLIO  │    │   REVIEWS    │   │MEMBERSHIP│
  │  PROFILE  │◀───│   CATALOG    │    │  & MEDIA     │    │& TESTIMONIALS│   │(Plans)   │
  └───────────┘    └──────┬───────┘    └──────────────┘    └──────┬───────┘   └──────────┘
       ▲                   │                                       │
       │                   ▼                                       ▼
       │            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
       │            │  INQUIRIES   │───▶│  PROPOSALS   │───▶│   ANALYTICS  │
       │            │  (Received)  │    │  & QUOTES    │    │  & INSIGHTS  │
       │            └──────────────┘    └──────────────┘    └──────────────┘
       │                                                           │
       └─────────────────── SETTINGS ◀─────────────────────────────┘
                           (Preferences)
```

---

## Module-by-Module Audit

### 1. Registration

| Aspect | Detail |
|---|---|
| **Purpose** | Multi-step onboarding for professionals (7 steps: Basic Info → Professional → Services → Portfolio → Documents → Membership → Review) |
| **Input Data** | fullName, professionalTitle, experience, location, languages, category, qualification, certifications, services, projects, documents, membership plan |
| **Output Data** | Registered profile with slug reservation, initial document status, redirect to success page |
| **Dependencies** | None (entry point) |
| **Future Backend Model** | `User`, `ProfessionalProfile`, `Company`, `Qualification`, `Certification`, `Document` |
| **Future API** | `POST /register` (multi-step or final submit), `GET /register/check-slug`, `POST /register/reserve-slug` |
| **Future Events** | `professional.registered`, `slug.reserved` |
| **Future Permissions** | Public endpoint (registration is open) |
| **Duplicate Fields** | `fullName` → profile's `name`, `professionalTitle` → profile's `title`, `experience` / `location` / `languages` duplicated in profile + business identity |
| **Recommendations** | Registration should seed Profile, Business Identity, and initial Document records simultaneously. The 7 registration steps map 1:1 to workspace pages. Consider consolidating registration and workspace data models to avoid duplication. |

---

### 2. Profile Management

| Aspect | Detail |
|---|---|
| **Purpose** | Central profile editing — about, services, portfolio, certifications, business info |
| **Input Data** | summary, languages, experience, location, website, linkedin, services (name/desc/price), qualifications, certifications, projects, company name, GSTIN, PAN, address |
| **Output Data** | Updated profile data reflected on public profile |
| **Dependencies** | Registration (seeds initial data), Business Identity (companyName, GSTIN, PAN overlap) |
| **Future Backend Model** | `ProfessionalProfile`, `Service`, `Qualification`, `Certification`, `Project` |
| **Future API** | `GET/PATCH /profile`, `POST/DELETE /profile/services`, `POST/DELETE /profile/qualifications`, `POST/DELETE /profile/certifications` |
| **Future Events** | `profile.updated`, `service.added`, `service.removed` |
| **Future Permissions** | OWNER only |
| **Duplicate Fields** | `companyName` duplicated in Business Identity page; `GSTIN`/`PAN` duplicated in Business Identity Documents section; `services` array duplicated in Services Catalog page; `projects` duplicated in Portfolio page |
| **Recommendations** | The profile page tries to be too many things. It should delegate: services → Services Catalog, projects → Portfolio, business info → Business Identity. Make profile about personal info only (summary, languages, experience, certifications). |

---

### 3. Business Identity & Verification

| Aspect | Detail |
|---|---|
| **Purpose** | Manage professional business entity details, office info, contact, documents, hours, and verification status |
| **Input Data** | companyName, businessType, category, yearEstablished, teamSize, description, address, city, state, pin, mapsUrl, serviceRadius, mobile/alternate, email, website, social links, document statuses, working hours |
| **Output Data** | Verified business identity with document approval status, TradTrust readiness indicator |
| **Dependencies** | Registration (company name seeds), Profile (companyName overlap) |
| **Future Backend Model** | `Company`, `CompanyVerification`, `CompanyDocument`, `BusinessHours` |
| **Future API** | `GET/PATCH /company`, `POST /company/verify-document`, `GET /company/verification-status` |
| **Future Events** | `company.updated`, `document.verified`, `document.rejected`, `company.fully-verified` |
| **Future Permissions** | OWNER, ADMIN (for document review) |
| **Duplicate Fields** | `companyName` duplicated in Profile (business section); `gstin`/`pan` duplicated in Profile; `email`/`phone`/`website`/`linkedin` duplicated in Profile's about section; `mapsUrl` placeholder overlaps with future geo module |
| **Recommendations** | Make this the SINGLE source of truth for company/business data. Remove business section from Profile page. Remove GSTIN/PAN from Profile. |

---

### 4. TradTrust

| Aspect | Detail |
|---|---|
| **Purpose** | Trust scoring and reputation display; currently a placeholder (54 lines) |
| **Input Data** | (none — hardcoded tips only) |
| **Output Data** | Score display (currently "--"), tips checklist |
| **Dependencies** | Verification (documents must be verified before scoring), Reviews (reviews feed into score), Profile (completeness affects score) |
| **Future Backend Model** | `TradTrustScore`, `TradTrustFactor`, `TradTrustHistory` |
| **Future API** | `GET /tradtrust/score`, `GET /tradtrust/factors`, `GET /tradtrust/history`, `POST /tradtrust/recalculate` |
| **Future Events** | `score.updated`, `score.threshold-crossed` (e.g., crossed 80) |
| **Future Permissions** | Public (score read), OWNER (detail), ADMIN (recalculate) |
| **Duplicate Fields** | N/A (placeholder has no data) |
| **Recommendations** | This is the most critical module to develop next after backend integration. Score should be a weighted composite of: profile completeness (20%), document verification (25%), review rating/volume (25%), response rate (15%), membership tier (15%). |

---

### 5. Services Catalog

| Aspect | Detail |
|---|---|
| **Purpose** | Define and manage all professional services with pricing, availability, deliverables, media |
| **Input Data** | name, category, subcategory, short/detail description, price, priceType, availability modes, cities, deliverables (included/excluded), turnaround, media flags |
| **Output Data** | Service catalog displayed on public profile |
| **Dependencies** | Business Identity (company context), Membership (may affect pricing or visibility) |
| **Future Backend Model** | `Service`, `ServicePricing`, `ServiceAvailability`, `ServiceDeliverable`, `ServiceMedia` |
| **Future API** | `GET /services`, `POST /services`, `PATCH /services/:id`, `DELETE /services/:id`, `GET /services/:id` |
| **Future Events** | `service.created`, `service.updated`, `service.deleted`, `service.featured-changed` |
| **Future Permissions** | OWNER (CRUD), PUBLIC (read active/featured) |
| **Duplicate Fields** | `category`/`subcategory` duplicated from Profile's service section; `price`/`description` duplicated; `availability` modes overlap with Business Identity's serviceRadius |
| **Recommendations** | Profile page should remove its inline services section and delegate entirely to this page. Categories should be validated against a master category list (from the Categories landing page). |

---

### 6. Portfolio & Media

| Aspect | Detail |
|---|---|
| **Purpose** | Showcase projects, case studies, and media assets |
| **Input Data** | projects (title/desc/category/featured), case studies (title/client/industry/challenge/solution/outcome), media (images, documents), video placeholder |
| **Output Data** | Portfolio displayed on public profile; completion % calculation |
| **Dependencies** | Registration (seeds basic portfolio), Media (for images/documents) |
| **Future Backend Model** | `Project`, `CaseStudy`, `ProjectMedia`, `CaseStudyMedia` |
| **Future API** | `GET /portfolio`, `POST /portfolio/projects`, `PATCH /portfolio/projects/:id`, `DELETE /portfolio/projects/:id`, `POST /portfolio/case-studies`, media upload endpoints |
| **Future Events** | `project.added`, `project.featured`, `case-study.added` |
| **Future Permissions** | OWNER (CRUD), PUBLIC (read featured) |
| **Duplicate Fields** | `projects` duplicated from Profile's portfolio section; `category` on projects overlaps with service categories; media types (image/document/video) duplicated from Services Catalog media section |
| **Recommendations** | Profile page should remove portfolio section and delegate entirely here. Consider merging media library into a single shared workspace media manager that both Portfolio and Services Catalog reference. |

---

### 7. Search

| Aspect | Detail |
|---|---|
| **Purpose** | Buyer-facing search with filters, sorting, and professional cards |
| **Input Data** | query text, filters (category, tradtrust, experience, rating, languages, availability, membership, verification), sort order |
| **Output Data** | Filtered/sorted list of professional profiles with cards |
| **Dependencies** | All workspace modules (profile, services, verification, reviews) feed into searchable data |
| **Future Backend Model** | `OpenSearch` index aggregating Profile + Services + Reviews + Verification |
| **Future API** | `GET /search?q=&category=&minRating=&location=&sort=` |
| **Future Events** | `search.performed` (analytics), `profile.indexed` |
| **Future Permissions** | PUBLIC (no auth required) |
| **Duplicate Fields** | `category` repeated across Profile, Services, and Registration; `location` duplicated in Profile and Business Identity |
| **Recommendations** | Move from client-side filtering to API-backed search. The placeholder AI Smart Search should integrate with the future AI module. Search results should be driven by OpenSearch index built from all workspace modules. |

---

### 8. Public Profile

| Aspect | Detail |
|---|---|
| **Purpose** | Public-facing profile page that consumes data from all workspace modules |
| **Input Data** | Profile data, services, portfolio, reviews, verification status, TradTrust score |
| **Output Data** | Rendered public profile for visitors and potential clients |
| **Dependencies** | EVERYTHING — profile, services, portfolio, reviews, verification, TradTrust, membership |
| **Future Backend Model** | Aggregation view combining Company + ProfessionalProfile + Services + Reviews + TradTrustScore |
| **Future API** | `GET /profiles/:slug` (aggregated), `GET /profiles/:slug/services`, `GET /profiles/:slug/reviews` |
| **Future Events** | `profile.published`, `profile.viewed` |
| **Future Permissions** | PUBLIC (no auth) |
| **Duplicate Fields** | The `DemoProfile` interface in `tradeserv-profiles.ts` is a flattened view — it duplicates fields from Profile, Services, Portfolio, Business Identity |
| **Recommendations** | The public profile should be a READ-ONLY aggregation. When backend is built, the public profile endpoint should JOIN across all module tables, not duplicate data. |

---

### 9. Inquiries

| Aspect | Detail |
|---|---|
| **Purpose** | Receive and manage client inquiries from the public profile or search results |
| **Input Data** | contactPerson, email, phone, requirement description, budget, timeline |
| **Output Data** | Inquiry notification to professional, status tracking (new→viewed→accepted/rejected→closed) |
| **Dependencies** | Public Profile (inquiry button), Search (inquiry modal), Services (inquiry context references service) |
| **Future Backend Model** | `Inquiry`, `InquiryResponse`, `InquiryStatus` |
| **Future API** | `POST /inquiries`, `GET /inquiries`, `PATCH /inquiries/:id/status`, `POST /inquiries/:id/respond` |
| **Future Events** | `inquiry.received`, `inquiry.accepted`, `inquiry.rejected` |
| **Future Permissions** | PUBLIC (create), OWNER (manage) |
| **Duplicate Fields** | N/A (unique data) |
| **Recommendations** | Inquiry → Proposal → Project is the core workflow. The current demo data shows OTHER professionals' inquiries in Rahul's workspace (bug). Inquiries should reference a specific service from the Services Catalog. |

---

### 10. Proposals & Quotations

| Aspect | Detail |
|---|---|
| **Purpose** | Create and send professional proposals to clients, bridge between inquiry and engagement |
| **Input Data** | title, client, related inquiry, scope, deliverables, pricing type (fixed/hourly/milestone/custom), discount, tax, terms (payment/revision/cancellation), notes |
| **Output Data** | Proposal document (preview), status tracking (draft→sent→accepted/rejected/expired) |
| **Dependencies** | Inquiries (proposal references an inquiry), Services Catalog (pricing models), Business Identity (branding) |
| **Future Backend Model** | `Proposal`, `ProposalPricing`, `ProposalMilestone`, `ProposalTerm`, `ProposalStatus` |
| **Future API** | `POST /proposals`, `GET /proposals`, `PATCH /proposals/:id/status`, `GET /proposals/:id/preview`, `POST /proposals/:id/send`, `POST /proposals/:id/accept`, `POST /proposals/:id/reject` |
| **Future Events** | `proposal.created`, `proposal.sent`, `proposal.accepted`, `proposal.rejected`, `proposal.expired` |
| **Future Permissions** | OWNER (CRUD), CLIENT (accept/reject via link) |
| **Duplicate Fields** | `priceType` (fixed/hourly/custom) duplicated from Services Catalog; `deliverables` array duplicated; `clientName` overlaps with Inquiry's `contactPerson` |
| **Recommendations** | Pre-populate proposal from Inquiry data. Pre-populate pricing from Service Catalog pricing. Milestone pricing is unique to proposals and should not be in Services. |

---

### 11. Reviews & Testimonials

| Aspect | Detail |
|---|---|
| **Purpose** | Collect and manage client reviews, feature testimonials on public profile |
| **Input Data** | rating (1-5), comment text, service reference |
| **Output Data** | Public testimonials, rating breakdown, response to reviews |
| **Dependencies** | Services (review references a service), Public Profile (testimonials displayed) |
| **Future Backend Model** | `Review`, `ReviewResponse`, `ReviewFlag` |
| **Future API** | `POST /reviews`, `GET /reviews`, `PATCH /reviews/:id/feature`, `POST /reviews/:id/respond`, `POST /reviews/:id/flag` |
| **Future Events** | `review.submitted`, `review.featured`, `review.responded` |
| **Future Permissions** | PUBLIC (create after engagement), OWNER (manage, respond) |
| **Duplicate Fields** | `serviceName` on reviews duplicates service data from Services Catalog (should be a foreign key, not string) |
| **Recommendations** | Reviews should be linked to a specific Service (by ID) and an Inquiry/Proposal (by ID) to ensure authenticity. The "Request Review" flow should be automated: after proposal acceptance, send review request. |

---

### 12. Analytics

| Aspect | Detail |
|---|---|
| **Purpose** | Performance metrics — profile views, search appearances, inquiries, reviews |
| **Input Data** | (hardcoded demo stats only — 64 lines, placeholder) |
| **Output Data** | Monthly stat breakdown, tabular view |
| **Dependencies** | Search (view tracking), Inquiries (count), Reviews (count) |
| **Future Backend Model** | `AnalyticsEvent`, `DailyMetric` |
| **Future API** | `GET /analytics/overview`, `GET /analytics/monthly`, `GET /analytics/top-services`, `GET /analytics/trends` |
| **Future Events** | `analytics.daily-snapshot`, `analytics.weekly-report` |
| **Future Permissions** | OWNER (read), ADMIN (cross-user) |
| **Duplicate Fields** | Stat values (142 views, 89 searches, 12 inquiries, 4 reviews) duplicated in Dashboard page |
| **Recommendations** | Analytics should be BACKEND-COMPUTED, not hardcoded. Dashboard should reference Analytics API, not duplicate the numbers. Integrate with Google Analytics or a custom event tracking system. |

---

### 13. Membership

| Aspect | Detail |
|---|---|
| **Purpose** | View current plan and compare upgrade options (81 lines, placeholder) |
| **Input Data** | 3 hardcoded plans (Starter, Trade Smart, Trade Pro) with feature lists |
| **Output Data** | Current plan display, upgrade CTA |
| **Dependencies** | Business Identity (plan may affect visibility), TradTrust (higher plans could boost score weight) |
| **Future Backend Model** | `Subscription`, `Plan`, `PlanFeature` |
| **Future API** | `GET /membership/current`, `GET /membership/plans`, `POST /membership/upgrade`, `POST /membership/cancel` |
| **Future Events** | `membership.upgraded`, `membership.expired`, `membership.cancelled` |
| **Future Permissions** | OWNER (read), PURCHASER (upgrade) |
| **Duplicate Fields** | Plan names/features duplicated between Membership page and Registration step 6 |
| **Recommendations** | Registration step 6 (Membership) and the Membership workspace page should share the same plan data source. A future `Plan` table should be the single source of truth. |

---

### 14. Settings

| Aspect | Detail |
|---|---|
| **Purpose** | Notification, privacy, profile visibility, communication preferences (70 lines, placeholder) |
| **Input Data** | 12 toggle items across 4 categories (all non-functional) |
| **Output Data** | Preference display only (no save logic) |
| **Dependencies** | User identity |
| **Future Backend Model** | `UserPreferences`, `NotificationPreference` |
| **Future API** | `GET /settings`, `PATCH /settings`, `PATCH /settings/notifications` |
| **Future Events** | `settings.updated` |
| **Future Permissions** | OWNER only |
| **Duplicate Fields** | N/A (placeholder) |
| **Recommendations** | Make toggles functional with local state + save button. Future backend should store preferences per user. Consider moving profile visibility control here (draft/published toggle). |

---

## Duplicate Identification

### Duplicate Components (Redefined Across 5-7 Files Each)

| Component | Redefined In | Lines of Duplicate Code |
|---|---|---|
| `GlassCard` | dashboard, profile, services, portfolio, verification, reviews, proposals | ~50 lines × 7 = ~350 |
| `FormInput` | profile, services, portfolio, verification, proposals | ~20 lines × 5 = ~100 |
| `StatBox` | services, portfolio, reviews, proposals | ~10 lines × 4 = ~40 |
| Save toast pattern | profile, services, portfolio, verification, reviews, proposals | ~8 lines × 6 = ~48 |
| `handleSave` stub | profile, services, portfolio, verification, reviews, proposals | ~1 line × 6 = ~6 |
| Accordion section pattern | profile, services, portfolio, verification, reviews, proposals | ~15 lines × 6 = ~90 |

**Total estimated duplicate component code: ~634 lines** that should be centralized into shared components.

### Duplicate Forms

| Form Pattern | Appears In |
|---|---|
| Add service → name/desc/price | Profile (business section), Services Catalog |
| Add project → title/desc/category | Profile (portfolio section), Portfolio page |
| Add qualification/certification | Profile (inline), Registration (step 2) |
| Company/business info | Profile (business section), Business Identity |

### Duplicate Inputs

| Input Field | Duplicated Across |
|---|---|
| `companyName` | Profile (business section), Business Identity |
| `GSTIN` / `PAN` | Profile (business section), Business Identity (documents) |
| `email` / `phone` / `website` | Profile (about section), Business Identity (contact) |
| `category` | Registration, Profile, Services Catalog, Search filters |
| `price` / `priceType` | Profile (services), Services Catalog |
| `project.title` / `project.description` | Profile (portfolio section), Portfolio page |
| `service.name` / `service.description` | Profile (services section), Services Catalog |

### Duplicate Data

| Data Value | Appears In |
|---|---|
| `rahul-sharma-ca` (slug) | dashboard, profile, verification, services, reviews, proposals, public profile, tradeserv-profiles.ts |
| `RS & Associates` (company) | dashboard, profile, business identity, proposals |
| `Rahul Sharma` (name) | dashboard, profile, services, verification, reviews, proposals, registration data |
| Demo analytics (142 views, 89 searches, 12 inquiries, 4 reviews) | Dashboard, Analytics page |

### Duplicate Navigation

| Nav Item | Href | Icon |
|---|---|---|
| `My Services` | `/tradeserv/workspace/services` | `Briefcase` |
| `Proposals` | `/tradeserv/workspace/proposals` | `FileText` |
| `Portfolio` | `/tradeserv/workspace/portfolio` | `Image` |
| `Reviews` | `/tradeserv/workspace/reviews` | `MessageSquare` |
| `Membership` | `/tradeserv/workspace/membership` | `Award` |
| `Verification` | `/tradeserv/workspace/verification` | `Shield` |
| `TradTrust` | `/tradeserv/workspace/tradtrust` | `Award` (duplicate icon with Membership) |
| `Analytics` | `/tradeserv/workspace/analytics` | `BarChart3` |
| `Settings` | `/tradeserv/workspace/settings` | `Settings` |

**Note**: `TradTrust` and `Membership` both use the `Award` icon — collision.

### Duplicate Business Logic

| Logic | Pages |
|---|---|
| `Math.round((featured/total)*100)` conversion | Dashboard, reviews, proposals |
| `navigator.clipboard.writeText` copy link | dashboard, profile, verification, services, reviews, proposals |
| `setSaved(true); setTimeout(() => setSaved(false), 2000)` toast | 6 pages |
| Section completion % calculation | Profile (5 sections), Portfolio (projects/case studies/media) |

---

## Technical Risks

| Risk | Severity | Impact | Mitigation |
|---|---|---|---|
| **6+ local redefinitions of same components** | HIGH | ~634 lines of dead code; each new page copies the pattern; refactoring cost compounds | Extract `GlassCard`, `FormInput`, `StatBox` into shared `@/components/tradeserv/` |
| **Profile page tries to be 5 pages in one** | HIGH | Data inconsistency between Profile inline sections and dedicated pages (services, portfolio, business identity) | Remove business/services/portfolio sections from Profile; Profile = personal info only |
| **No single source of truth for business data** | HIGH | companyName, GSTIN, PAN, address duplicated across 3 pages with no sync | Make Business Identity the canonical source; Profile reads from it |
| **TradTrust and Analytics are pure placeholders** | HIGH | 54 lines and 64 lines respectively — no actual logic; dependency for public profile trust indicators | Prioritize backend development for these two modules |
| **No backend at all** | MEDIUM | All data is hardcoded demo; page refresh loses all changes; no user sessions | Requires full Prisma + API implementation before production |
| **Settings page toggles are non-functional** | MEDIUM | 12 toggle UI elements with zero state management | Add `useState` for each toggle + save button |
| **Inquiry demo data shows wrong perspective** | LOW | DEMO_INQUIRIES shows Rahul Sharma receiving inquiries from others but lists other professionals' names | Fix demo data to show actual clients, not other professionals |
| **Duplicate Award icon** | LOW | TradTrust and Membership nav items share same icon | Use `Shield` for TradTrust or `CreditCard` for Membership |
| **Search uses setLoading inside useMemo** | MEDIUM | Anti-pattern; side effect in computed value | Move to proper `useEffect` + `useState` pattern |
| **No shared types between registration and workspace** | MEDIUM | Registration has its own types; workspace pages define their own interfaces | Create `@/lib/types/tradeserv.ts` shared type library |

---

## Information Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER (Professional)                   │
├─────────────┬──────────────┬─────────────┬─────────────┬────────────┤
│ Registration│   Profile    │  Business   │  Services   │  Portfolio │
│ (7 Steps)   │  Management  │  Identity   │  Catalog    │  & Media   │
├─────────────┴──────┬───────┴──────┬──────┴──────┬──────┴────────────┤
│                    │              │             │                   │
▼                    ▼              ▼             ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPUTATION LAYER                               │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│ Verification │  TradTrust   │  Analytics   │    Membership         │
│ (Doc Review) │  (Scoring)   │  (Metrics)   │    (Plan/Tier)        │
├──────────────┴──────┬───────┴──────┬──────┴───────────────────────┤
│                     │              │                               │
▼                     ▼              ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INTERACTION LAYER                                │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│   Search     │   Public     │  Inquiries   │    Proposals          │
│  (Buyers)    │   Profile    │  (Leads)     │    (Quotes)           │
├──────────────┴──────┬───────┴──────┬──────┴───────────────────────┤
│                     │              │                               │
▼                     ▼              ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FEEDBACK LAYER                                  │
├──────────────────────┬────────────────────────────────────────────┤
│     Reviews          │              Settings                       │
│  (Ratings/Feedback)  │         (Preferences)                       │
└──────────────────────┴────────────────────────────────────────────┘
```

---

## Recommended Implementation Order (Backend)

| Order | Module | Priority | Reason |
|---|---|---|---|
| 1 | **User + ProfessionalProfile** | P0 | Foundation for all other modules |
| 2 | **Company + BusinessIdentity** | P0 | Required for verification |
| 3 | **Document + DocumentVerification** | P0 | Needed for TradTrust and trust signals |
| 4 | **Service + ServicePricing** | P0 | Core offering for all buyer interactions |
| 5 | **Project + CaseStudy + Media** | P0 | Portfolio display on public profile |
| 6 | **Inquiry** | P0 | Lead generation — core business flow |
| 7 | **Proposal + ProposalMilestone** | P0 | Bridge inquiry → engagement |
| 8 | **Review + ReviewResponse** | P0 | Social proof for public profile |
| 9 | **TradTrustScore + TradTrustFactor** | P1 | Depends on documents + reviews + profile |
| 10 | **Subscription + Plan** | P1 | Monetization |
| 11 | **AnalyticsEvent + DailyMetric** | P1 | Depends on data from all modules |
| 12 | **UserPreference** | P2 | Settings storage |

---

## Recommended API Order

| Order | Endpoint Group | Module |
|---|---|---|
| 1 | `POST /auth/register`, `POST /auth/login` | Auth |
| 2 | `GET/PATCH /profile` | Profile |
| 3 | `GET/PATCH /company`, `POST /company/verify-document` | Business Identity |
| 4 | `CRUD /services` | Services Catalog |
| 5 | `CRUD /portfolio/projects`, `CRUD /portfolio/case-studies` | Portfolio |
| 6 | `POST /inquiries`, `PATCH /inquiries/:id` | Inquiries |
| 7 | `CRUD /proposals`, `PATCH /proposals/:id/status` | Proposals |
| 8 | `GET /reviews`, `PATCH /reviews/:id/feature` | Reviews |
| 9 | `GET /tradtrust/score` | TradTrust |
| 10 | `GET /analytics/*` | Analytics |
| 11 | `GET/PATCH /settings` | Settings |
| 12 | `POST /search` (OpenSearch) | Search |

---

## Recommended Prisma Order

| Order | Model | Dependencies |
|---|---|---|
| 1 | `User` | None |
| 2 | `ProfessionalProfile` | User |
| 3 | `Company` | User |
| 4 | `CompanyVerification` | Company |
| 5 | `CompanyDocument` | CompanyVerification |
| 6 | `BusinessHours` | Company |
| 7 | `Qualification` | ProfessionalProfile |
| 8 | `Certification` | ProfessionalProfile |
| 9 | `Service` | Company |
| 10 | `ServicePricing` | Service |
| 11 | `ServiceAvailability` | Service |
| 12 | `ServiceDeliverable` | Service |
| 13 | `Project` | ProfessionalProfile |
| 14 | `CaseStudy` | ProfessionalProfile |
| 15 | `ProjectMedia` | Project |
| 16 | `Inquiry` | Service (or Profile) |
| 17 | `Proposal` | Inquiry (optional), Company |
| 18 | `ProposalMilestone` | Proposal |
| 19 | `ProposalTerm` | Proposal |
| 20 | `Review` | Service, Proposal |
| 21 | `ReviewResponse` | Review |
| 22 | `TradTrustScore` | Company |
| 23 | `TradTrustFactor` | TradTrustScore |
| 24 | `Subscription` | User, Plan |
| 25 | `Plan` | None |
| 26 | `PlanFeature` | Plan |
| 27 | `AnalyticsEvent` | ProfessionalProfile |
| 28 | `DailyMetric` | ProfessionalProfile |
| 29 | `UserPreference` | User |

---

## Recommended Event Order

| Event | Trigger | Consumers |
|---|---|---|
| `professional.registered` | Registration complete | Profile (seed), Analytics (count), Notification |
| `profile.updated` | Profile save | Public Profile, Search Index, TradTrust |
| `company.updated` | Business Identity save | Public Profile, Search Index |
| `document.verified` | Admin approves doc | TradTrust (recalculate), Verification (progress) |
| `document.rejected` | Admin rejects doc | Verification (progress), Notification |
| `company.fully-verified` | All docs verified | TradTrust (enable scoring), Badge (display) |
| `service.created` | Service added | Public Profile, Search Index |
| `service.featured-changed` | Feature toggle | Public Profile (layout change) |
| `inquiry.received` | Client submits inquiry | Notification, Dashboard (count) |
| `inquiry.accepted` | Professional accepts | Proposal (pre-fill), Notification |
| `proposal.created` | Proposal drafted | Dashboard (count) |
| `proposal.sent` | Proposal sent to client | Client notification, Status tracking |
| `proposal.accepted` | Client accepts | Review request, Project (future) |
| `proposal.rejected` | Client rejects | Analytics (win rate), Notification |
| `review.submitted` | Client reviews | TradTrust (recalculate), Public Profile |
| `review.featured` | Toggle testimonial | Public Profile (layout change) |
| `score.updated` | TradTrust recalculated | Public Profile, Badge, Search Rank |
| `membership.upgraded` | Plan change | Feature flags, TradTrust (weight) |
| `analytics.daily-snapshot` | Cron job | Dashboard, Analytics page |

---

## Recommended AI Integration Points

| Integration | Module | AI Feature | Priority |
|---|---|---|---|
| **Profile Summary Generator** | Profile | Generate professional summary from raw inputs | P1 |
| **Service Description Writer** | Services Catalog | Write detailed descriptions from brief keywords | P1 |
| **Smart Search** | Search | Semantic search + query understanding | P1 |
| **Proposal Writer** | Proposals | Generate scope of work, deliverables from inquiry | P1 |
| **Review Response Assistant** | Reviews | Suggest professional responses to reviews | P2 |
| **Analytics Insights** | Analytics | Generate monthly narrative from metrics | P2 |
| **TradTrust Recommendation** | TradTrust | Suggest actions to improve trust score | P2 |
| **Lead Scoring** | Inquiries | Rank inquiries by quality/urgency | P2 |

---

## Recommended OpenSearch Integration

| Index | Source Data | Search Use Case |
|---|---|---|
| `profiles` | ProfessionalProfile + Company | Full-text search on name, title, bio, location |
| `services` | Service + ServicePricing | Category, subcategory, price range, availability |
| `reviews` | Review | Rating filter, testimonial highlights |

**Search Ranking Factors**: TradTrust score (weight: high), Review rating (medium), Membership tier (medium), Profile completeness (low), Response rate (low).

---

## Recommended TradTrust Integration

**Scoring Formula**: `Total Score = (Profile × 0.20) + (Documents × 0.25) + (Reviews × 0.25) + (Responsiveness × 0.15) + (Membership × 0.15)`

| Factor | Weight | Data Source | Calculation |
|---|---|---|---|
| Profile Completeness | 20% | ProfessionalProfile | % of fields filled vs total |
| Document Verification | 25% | CompanyVerification | % of verified documents |
| Review Rating | 15% | Review | Average rating (min 3 reviews) |
| Review Volume | 10% | Review | log2(review_count) normalized |
| Response Rate | 15% | Inquiry + Proposal | % of inquiries with response |
| Membership Tier | 15% | Subscription | Base score per tier |

**Badge Thresholds**: 0-30 = None, 31-50 = Bronze, 51-70 = Silver, 71-85 = Gold, 86-95 = Platinum, 96-100 = Elite.

---

## Refactoring Suggestions

### Immediate (Before Backend)

1. **Extract shared components**: Move `GlassCard`, `FormInput`, `StatBox` to `@/components/tradeserv/` and replace all local definitions (~634 lines saved)
2. **Consolidate business data**: Remove business info section from Profile page; make Business Identity the single source
3. **Fix Inquiry demo data**: Change to show actual clients, not other professionals
4. **Fix TradTrust nav icon**: Change from `Award` (duplicate with Membership) to `Shield` or `Fingerprint`
5. **Add state to Settings**: Make toggle switches functional with `useState`
6. **Fix Search anti-pattern**: Move `setLoading` out of `useMemo` into proper effect
7. **Create shared type library**: Move interfaces from individual pages to `@/lib/types/tradeserv.ts`

### Short-term (With Backend)

8. **Replace all `handleSave` stubs** with real API calls via React Query or SWR
9. **Replace `navigator.clipboard.writeText`** with shared `useCopyToClipboard` hook
10. **Implement proper loading/error states** across all pages (currently none exist)
11. **Add image upload** for portfolio and service media
12. **Replace hardcoded demo data** with API responses

### Medium-term (Post-Production)

13. **Implement TradTrust scoring engine** with the weighted formula above
14. **Build Analytics event tracking** middleware for all user actions
15. **Set up OpenSearch** for scalable search
16. **Add AI integrations** (profile writer, proposal writer, smart search)
17. **Implement notification system** for inquiry/proposal/review events
