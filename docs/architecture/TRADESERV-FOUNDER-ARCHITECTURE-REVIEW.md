# TradeServ — Founder Architecture Review

> **Final pre-backend audit** combining Phase 11 (Workflow Integration), Phase 13 (Backend Readiness), and fresh codebase inspection.
> Review date: 03 Jul 2026 | Total audit surface: 20 pages, 11 components, 2 data files

---

## 1. DUPLICATE BUSINESS ENTITIES AUDIT

### 1.1 Business Identity Fragmentation (CRITICAL)

The same business data is **duplicated across 3 pages** with no synchronization:

| Field | Profile (page.tsx:398-423) | Verification (page.tsx:138-163) | Data File |
|---|---|---|---|
| `companyName` | `Company / Firm Name` input | `Company / Firm Name` input | hardcoded as `RS & Associates` |
| `GSTIN` | `GSTIN` input | `GST Registration` doc status | — |
| `PAN` | `PAN` input | `PAN Card` doc status | — |
| `website` | `Website` input | `Website` input | — |
| `linkedin` | `LinkedIn URL` input | `LinkedIn` input | — |
| `email` | — | `Email` input | — |
| `phone` | — | `Primary Mobile` input | — |

**Verdict**: DUPLICATE — Profile page has business fields that belong exclusively in Verification (Business Identity). The Profile page should be personal info only.

### 1.2 Service Data Fragmentation (CRITICAL)

| Data | Profile (services section) | Services Catalog | Data File |
|---|---|---|---|
| service name/desc/price | inline CRUD (lines 232-281) | full CRUD with 22 fields | Demo services in tradeserv-profiles.ts |
| featured services | — | `featured` toggle | `isFeatured` flag |

**Verdict**: DUPLICATE — Profile manages services inline; Services Catalog is the full page. Profile should delegate.

### 1.3 Portfolio Data Fragmentation (HIGH)

| Data | Profile (portfolio section) | Portfolio page | Data File |
|---|---|---|---|
| projects | inline display (lines 284-321) | full CRUD with case studies & media | Demo projects in tradeserv-profiles.ts |

**Verdict**: DUPLICATE — Profile should remove portfolio section; Portfolio page is canonical.

### 1.4 Qualification & Certification Fragmentation (MEDIUM)

| Data | Profile (lines 324-396) | Registration (Step 2) |
|---|---|---|
| qualifications | inline CRUD | inline CRUD |
| certifications | inline CRUD | — |

**Verdict**: DUPLICATE — Both Registration and Profile have qualification CRUD. Registration seeds; Profile maintains.

### 1.5 Analytics Values (LOW)

Dashboard (lines 33-38) and Analytics page (lines 6-11) both hardcode identical values: 142 views, 89 searches, 12 inquiries, 4 reviews.

**Verdict**: DUPLICATE — Both reference demo data; backend should be single source.

### 1.6 Membership Data (LOW)

Registration Step 6 and Membership page both list plan options independently.

**Verdict**: DUPLICATE — Registration seeds membership selection; Membership page reads from canonical Plan data.

---

## 2. PAGE OWNERSHIP MATRIX

Each page maps to exactly **one primary owner** with clear responsibility boundaries:

| Page | Owner | Backend Model | Current State |
|---|---|---|---|
| **Public Pages** | | | |
| `/tradeserv` (Landing) | TradeServ Marketing | No model (CMS content) | Complete — hero, features, categories, footer |
| `/tradeserv/categories` | Category Browser | `TradeServCategory` | Complete — 10 categories listed |
| `/tradeserv/categories/[slug]` | Category Detail | `TradeServCategory` | Complete — SEO metadata, JSON-LD |
| `/tradeserv/c/[slug]` | Category Listing | `TradeServProfessional` query | Complete — profiles list + empty state |
| `/tradeserv/search` | Professional Search | `TradeServProfessional` index | Complete — filters, sort, results |
| `/tradeserv/p/[slug]` | Public Profile | `TradeServProfessional` | Complete — all sections + inquiry modal |
| `/tradeserv/register` | Registration | `TradeServProfessional` | Complete — 7-step wizard, localStorage |
| `/tradeserv/register/success` | Post-Registration | `ProfessionalVerification` | Complete — status + timeline |
| **Workspace Pages** | | | |
| `/workspace/dashboard` | Owner Dashboard | Aggregation view | Complete — 4 widgets, analytics, quick actions |
| `/workspace/profile` | Owner Profile | `ProfessionalProfile` | **OVER-OWNED** — contains services, portfolio, business |
| `/workspace/services` | Services Catalog | `ProfessionalService` | Complete — CRUD, pricing, availability, media |
| `/workspace/portfolio` | Portfolio & Media | `ProfessionalPortfolio` + `CaseStudy` | Complete — projects, case studies, media |
| `/workspace/reviews` | Reviews & Testimonials | `ProfessionalReview` | Complete — breakdown, CRUD, testimonials, replies |
| `/workspace/inquiries` | Inquiries | `ProfessionalInquiry` | Complete — status tabs, filtered list |
| `/workspace/proposals` | Proposals & Quotations | `Proposal` + `ProposalMilestone` | Complete — 7 sections, pricing, terms, preview |
| `/workspace/verification` | Business Identity | `Company` (extended) | Complete — identity, office, contact, docs, hours |
| `/workspace/membership` | Membership | `Subscription` + `Plan` | **PLACEHOLDER** — 81 lines, 3 hardcoded plans |
| `/workspace/tradtrust` | TradTrust | `TradTrustScore` | **PLACEHOLDER** — 54 lines, score shows `--` |
| `/workspace/analytics` | Analytics | `AnalyticsEvent` | **PLACEHOLDER** — 64 lines, hardcoded demo stats |
| `/workspace/settings` | Settings | `UserPreference` | **PLACEHOLDER** — 70 lines, 12 non-functional toggles |

### Ownership Violations

| Violation | Page | What It Owns Wrongly |
|---|---|---|
| **VIOLATION** | Profile (workspace) | Services section + Portfolio section + Business info |
| **VIOLATION** | Dashboard | Duplicates analytics values from Analytics page |
| **VIOLATION** | Registration | Duplicates qualifications CRUD from Profile |

### Recommendations

1. **Profile page**: Remove services section, portfolio section, business info section. Keep: summary, languages, experience, location, qualifications, certifications.
2. **Dashboard**: Remove hardcoded analytics; reference Analytics API when built.
3. **Registration**: Keep qualification seed; Profile maintains updates.

---

## 3. FORM-TO-MODEL MAPPING

Every form in the codebase maps to exactly one future backend model:

| Form | Location | Target Model | Fields | Validated |
|---|---|---|---|---|
| Profile About | `profile.tsx:213-222` | `ProfessionalProfile` | summary, languages, experience, location, website, linkedin | No |
| Profile Services | `profile.tsx:258-265` | `ProfessionalService` | name, category, desc, price | Basic required check |
| Profile Qualifications | `profile.tsx:354-359` | `ProfessionalQualification` | degree, institution, year | Basic required check |
| Profile Business | `profile.tsx:407-418` | `Company` | companyName, gstin, pan, address, website, linkedin | No |
| New Service (Catalog) | `services.tsx:207-265` | `ProfessionalService` | name, category, subcategory, shortDesc, detailDesc, price, priceType, availability, cities, included, excluded, turnaround | Name + category required |
| New Project (Portfolio) | `portfolio.tsx:197-200` | `ProfessionalPortfolio` | title, description, category | Title required |
| New Case Study | `portfolio.tsx:250-258` | `CaseStudy` | title, client, industry, challenge, solution, outcome | Title + client required |
| New Proposal | `proposals.tsx` | `Proposal` + `ProposalMilestone` | 30+ fields across 7 sections | Title + client required |
| Inquiry Modal | `profile-client.tsx` | `ProfessionalInquiry` | companyName, contactPerson, email, phone, requirement, budget, timeline | No API submit |
| Registration Step 1 | `register/page.tsx` | `User` | name, email, phone, city, state | No |
| Registration Step 2 | `register/page.tsx` | `ProfessionalProfile` | title, bio, experience, category, languages, qualifications | No |
| Registration Step 3 | `register/page.tsx` | `ProfessionalService` | services with name/desc/price | No |
| Registration Step 4 | `register/page.tsx` | `ProfessionalPortfolio` | projects with title/desc/url | No |
| Registration Step 5 | `register/page.tsx` | `ProfessionalDocument` | document names | No |
| Registration Step 6 | `register/page.tsx` | `Subscription` | plan selection | No |
| Business Identity | `verification.tsx:146-161` | `Company` | companyName, businessType, businessCategory, yearEstablished, teamSize, description | No |
| Office Info | `verification.tsx:176-195` | `CompanyLocation` | address, city, state, pinCode, mapsUrl, serviceRadius | No |
| Business Contact | `verification.tsx:211-224` | `Company` | phone, email, website, social links | No |
| Business Hours | `verification.tsx:266-282` | `BusinessHours` | workingDays, openingTime, closingTime, emergencyContact | No |
| Review Response | `reviews.tsx:106-111` | `ProfessionalReview` response field | response text | No |

### Issues

1. **Zero form validation** beyond basic `if (!value) return` checks. No email format, phone format, GST format, PIN code, or URL validation.
2. **Zero error states** on any form field. No `isError`, `errorMessage`, or `touched` pattern.
3. **String-typed prices** everywhere. Services page stores `price: string`, tradeserv-profiles.ts uses `price: string`. Must be `Decimal` in backend.
4. **availability stored as comma-separated** strings instead of a proper join table.

---

## 4. FUTURE API DEFINITIONS

Every planned endpoint, organized by ownership:

### 4.1 Professional Profile API
| Method | Endpoint | Request | Response | Permission |
|---|---|---|---|---|
| `GET` | `/tradeserv/profiles/:slug` | — | Aggregated profile | PUBLIC |
| `PUT` | `/tradeserv/profiles/me` | UpdateProfessionalProfileDto | Profile | OWNER |
| `PUT` | `/tradeserv/profiles/me/photo` | FormData | photo URL | OWNER |
| `PUT` | `/tradeserv/profiles/me/cover` | FormData | cover URL | OWNER |
| `POST` | `/tradeserv/profiles/me/qualifications` | CreateQualificationDto | Qualification | OWNER |
| `DELETE` | `/tradeserv/profiles/me/qualifications/:id` | — | void | OWNER |
| `POST` | `/tradeserv/profiles/me/certifications` | CreateCertificationDto | Certification | OWNER |
| `DELETE` | `/tradeserv/profiles/me/certifications/:id` | — | void | OWNER |

### 4.2 Service Catalog API
| Method | Endpoint | Request | Response | Permission |
|---|---|---|---|---|
| `GET` | `/tradeserv/services` | — | Service[] | PUBLIC |
| `GET` | `/tradeserv/services/:id` | — | Service | PUBLIC |
| `POST` | `/tradeserv/services` | CreateServiceDto | Service | OWNER |
| `PATCH` | `/tradeserv/services/:id` | UpdateServiceDto | Service | OWNER |
| `DELETE` | `/tradeserv/services/:id` | — | void | OWNER |
| `PATCH` | `/tradeserv/services/:id/feature` | — | Service | OWNER |
| `PATCH` | `/tradeserv/services/:id/activate` | — | Service | OWNER |

### 4.3 Portfolio & Media API
| Method | Endpoint | Request | Response | Permission |
|---|---|---|---|---|
| `GET` | `/tradeserv/portfolio` | — | PortfolioItem[] | PUBLIC |
| `POST` | `/tradeserv/portfolio/projects` | CreateProjectDto | Project | OWNER |
| `PATCH` | `/tradeserv/portfolio/projects/:id` | UpdateProjectDto | Project | OWNER |
| `DELETE` | `/tradeserv/portfolio/projects/:id` | — | void | OWNER |
| `POST` | `/tradeserv/portfolio/case-studies` | CreateCaseStudyDto | CaseStudy | OWNER |
| `PATCH` | `/tradeserv/portfolio/case-studies/:id` | UpdateCaseStudyDto | CaseStudy | OWNER |
| `DELETE` | `/tradeserv/portfolio/case-studies/:id` | — | void | OWNER |
| `POST` | `/tradeserv/media/upload` | FormData | Media[] | OWNER |
| `DELETE` | `/tradeserv/media/:id` | — | void | OWNER |

### 4.4 Search & Discovery API
| Method | Endpoint | Query Params | Permission |
|---|---|---|---|
| `GET` | `/tradeserv/search` | q, category, minRating, maxPrice, location, languages, sort, page, limit | PUBLIC |
| `GET` | `/tradeserv/discovery/featured` | — | PUBLIC |
| `GET` | `/tradeserv/discovery/trending` | — | PUBLIC |
| `GET` | `/tradeserv/discovery/nearby` | lat, lng, radius | PUBLIC |
| `GET` | `/tradeserv/discovery/recommended` | — | AUTHENTICATED |

### 4.5 Inquiry API
| Method | Endpoint | Request | Permission |
|---|---|---|---|
| `POST` | `/tradeserv/inquiries` | CreateInquiryDto | PUBLIC |
| `GET` | `/tradeserv/inquiries` | status, page, limit | OWNER |
| `GET` | `/tradeserv/inquiries/:id` | — | OWNER |
| `PATCH` | `/tradeserv/inquiries/:id/status` | UpdateStatusDto | OWNER |
| `POST` | `/tradeserv/inquiries/:id/respond` | RespondDto | OWNER |

### 4.6 Proposal API
| Method | Endpoint | Request | Permission |
|---|---|---|---|
| `GET` | `/tradeserv/proposals` | status, page, limit | OWNER |
| `GET` | `/tradeserv/proposals/:id` | — | OWNER |
| `POST` | `/tradeserv/proposals` | CreateProposalDto | OWNER |
| `PATCH` | `/tradeserv/proposals/:id` | UpdateProposalDto | OWNER |
| `POST` | `/tradeserv/proposals/:id/send` | — | OWNER |
| `POST` | `/tradeserv/proposals/:id/accept` | — | CLIENT (public link) |
| `POST` | `/tradeserv/proposals/:id/reject` | RejectReasonDto | CLIENT (public link) |

### 4.7 Reviews & Testimonials API
| Method | Endpoint | Request | Permission |
|---|---|---|---|
| `GET` | `/tradeserv/reviews` | rating, page, limit | PUBLIC |
| `POST` | `/tradeserv/reviews` | CreateReviewDto | AUTHENTICATED (after engagement) |
| `PATCH` | `/tradeserv/reviews/:id/feature` | — | OWNER |
| `POST` | `/tradeserv/reviews/:id/respond` | RespondDto | OWNER |
| `POST` | `/tradeserv/reviews/:id/flag` | — | OWNER |

### 4.8 Verification & Documents API
| Method | Endpoint | Request | Permission |
|---|---|---|---|
| `GET` | `/tradeserv/verification` | — | OWNER |
| `POST` | `/tradeserv/verification/documents` | FormData | OWNER |
| `PATCH` | `/tradeserv/verification/documents/:id` | — | OWNER |
| `POST` | `/tradeserv/verification/documents/:id/review` | ReviewDto | ADMIN |
| `PUT` | `/tradeserv/company` | UpdateCompanyDto | OWNER |
| `PUT` | `/tradeserv/company/location` | UpdateLocationDto | OWNER |
| `PUT` | `/tradeserv/company/hours` | UpdateHoursDto | OWNER |

### 4.9 Registration API
| Method | Endpoint | Request | Permission |
|---|---|---|---|
| `POST` | `/tradeserv/register` | RegisterProfessionalDto | PUBLIC (rate-limited) |
| `GET` | `/tradeserv/register/check-slug` | slug | PUBLIC |
| `POST` | `/tradeserv/register/reserve-slug` | slug | PUBLIC (rate-limited) |
| `GET` | `/tradeserv/register/draft` | — | AUTHENTICATED |
| `PUT` | `/tradeserv/register/draft` | RegisterProfessionalDto | AUTHENTICATED |

### 4.10 Membership & Settings API
| Method | Endpoint | Request | Permission |
|---|---|---|---|
| `GET` | `/tradeserv/membership/current` | — | OWNER |
| `GET` | `/tradeserv/membership/plans` | — | PUBLIC |
| `POST` | `/tradeserv/membership/upgrade` | planId, paymentMethodId | OWNER |
| `GET` | `/tradeserv/settings` | — | OWNER |
| `PATCH` | `/tradeserv/settings` | UpdateSettingsDto | OWNER |
| `PATCH` | `/tradeserv/settings/notifications` | UpdateNotificationPrefsDto | OWNER |

### 4.11 TradTrust API (REUSE EXISTING)
| Method | Endpoint | Request | Permission |
|---|---|---|---|
| `GET` | `/tradtrust/score/:companyId` | — | PUBLIC |
| `GET` | `/tradtrust/history/:companyId` | — | PUBLIC |
| `POST` | `/tradtrust/recalculate/:companyId` | — | ADMIN |

### 4.12 Analytics API (REUSE EXISTING)
| Method | Endpoint | Request | Permission |
|---|---|---|---|
| `GET` | `/analytics/admin/dashboard` | — | ADMIN |
| `GET` | `/analytics/:professionalId` | — | OWNER |

---

## 5. EVENT PRODUCER ↔ CONSUMER MATRIX

All events, their triggers, and consumers identified:

| Event | Producer | Consumer 1 | Consumer 2 | Consumer 3 |
|---|---|---|---|---|
| `professional.registered` | Registration Service | Notification (welcome) | TradTrust (seed score) | Analytics (count) |
| `profile.updated` | Profile Service | Search Index (re-index) | Public Profile (refresh) | — |
| `service.created` | Service Catalog Service | Search Index (re-index) | Public Profile (refresh) | — |
| `service.deleted` | Service Catalog Service | Search Index (re-index) | Review cascades | — |
| `portfolio.updated` | Portfolio Service | AI Gateway (review prompt) | Search Index (re-index) | TradTrust (partial recalc) |
| `document.verified` | Verification Service | TradTrust (recalculate) | Notification (to professional) | Verification progress |
| `document.rejected` | Verification Service | Notification (to professional) | Verification progress | — |
| `company.fully-verified` | Verification Service | TradTrust (unlock scoring) | Badge (display verified) | Search Index (boost rank) |
| `inquiry.received` | Inquiry Service | Notification (to professional) | Dashboard (increment count) | CRM (create lead) |
| `inquiry.accepted` | Inquiry Service | Proposal Service (pre-fill) | Notification (to client) | — |
| `proposal.sent` | Proposal Service | Notification (to client) | Dashboard (update count) | — |
| `proposal.accepted` | Proposal Service | Review Service (request) | Analytics (win rate) | Notification (both parties) |
| `proposal.rejected` | Proposal Service | Analytics (win rate) | Notification (to professional) | — |
| `review.submitted` | Review Service | TradTrust (recalculate) | Public Profile (update rating) | — |
| `review.featured` | Review Service | Public Profile (testimonial section) | — | — |
| `score.updated` | TradTrust Service | Public Profile (update score) | Search Rank (re-rank) | Badge (update tier) |
| `membership.upgraded` | Membership Service | Feature flags | TradTrust (re-weight) | — |
| `membership.expired` | Membership Service | Feature flags | TradTrust (re-weight) | Notification (renewal) |
| `settings.updated` | Settings Service | Profile visibility | Notification prefs | — |

### Issues

1. **Missing `registration.draft-saved` event** — Registration wizard auto-saves to localStorage only; needs server-side auto-save event.
2. **Missing `booking.created` event** — No booking system exists yet (planned for future).
3. **Inquiry→Proposal link** — Not automatic. Inquiry accepted should trigger proposal pre-fill. Currently manual.

---

## 6. PERMISSIONS MATRIX (RBAC/ABAC)

| Role | Endpoints Accessible | Condition |
|---|---|---|
| **PUBLIC** (unauthenticated) | `/tradeserv/search`, `/tradeserv/profiles/:slug`, `/tradeserv/services`, `/tradeserv/reviews`, `/tradeserv/categories`, `POST /tradeserv/inquiries`, `POST /tradeserv/register`, `POST /proposals/:id/accept`, `POST /proposals/:id/reject` | Rate-limited for POST |
| **PROFESSIONAL** (OWNER) | All `/tradeserv/profiles/me`, `/tradeserv/services/*`, `/tradeserv/portfolio/*`, `/tradeserv/inquiries/*`, `/tradeserv/proposals/*`, `/tradeserv/reviews/:id/*`, `/tradeserv/verification/*`, `/tradeserv/membership/*`, `/tradeserv/settings/*`, `/tradeserv/media/*`, `GET /tradtrust/score/:companyId` | CompanyOwnerGuard validates `req.user.companyId === params.companyId` |
| **ADMIN** | `POST /verification/documents/:id/review`, `GET /admin/*`, `POST /tradtrust/recalculate`, `GET /analytics/admin/*` | RolesGuard: ADMIN/SUPER_ADMIN |
| **SUPER_ADMIN** | Everything ADMIN can + user management, plan CRUD | RolesGuard: SUPER_ADMIN |

### Existing Guards (Reusable from TRADINGO backend)

| Guard | Purpose | Use in TradeServ |
|---|---|---|
| `JwtAuthGuard` | Validates Bearer JWT token | All authenticated endpoints |
| `RolesGuard` | Checks `@Roles()` decorator | ADMIN/SUPER_ADMIN endpoints |
| `CompanyOwnerGuard` | Validates company ownership | All OWNER endpoints |
| `PermissionsGuard` | Granular permission checks | Future: feature-specific restrictions |

### Issues

1. **No `PROFESSIONAL` role in `Role` enum** — Currently only `SUPER_ADMIN, ADMIN, MANAGER, SELLER, BUYER, RM, VIEWER`. Need to decide: new role or use SELLER with `professionalType` discriminator.
2. **Proposal accept/reject** — Must work via public signed link (no auth), but must be validated against the proposal's `clientId`. Needs a `ProposalClientGuard`.
3. **Rate limiting** — `POST /inquiries` and `POST /register` must be rate-limited per IP to prevent spam.

---

## 7. REUSABLE COMPONENTS EXTRACTION STATUS

### 7.1 Successfully Extracted (Phase 12)

| Component | File | Usage Count | Lines Saved |
|---|---|---|---|
| `GlassCard` | `components/tradeserv/glass-card.tsx` | Used in 7 pages | ~300 |
| `FormInput` | `components/tradeserv/form-input.tsx` | Used in 6 pages | ~80 |
| `StatBox` | `components/tradeserv/stat-box.tsx` | Used in 4 pages | ~30 |
| `StarRating` | `components/tradeserv/star-rating.tsx` | Used in 2 pages | ~20 |
| `SaveToast` | `components/tradeserv/save-toast.tsx` | Used in 5 pages | ~40 |
| `useSaveToast` | `hooks/use-save-toast.ts` | Used in 6 pages | ~24 |

**Exported from** `components/tradeserv/index.ts` — barrel export for all 5 components.

### 7.2 Domain-Specific Components (Not Extracted — Correctly)

| Component | File | Usage | Should Extract? |
|---|---|---|---|
| `ProfessionalCard` | `components/tradeserv/professional-card.tsx` | Search + category listing | **No** — domain-specific |
| `FilterPanel` | `components/tradeserv/filter-panel.tsx` | Search page only | **No** — search-specific |
| `SortDropdown` | `components/tradeserv/sort-dropdown.tsx` | Search page only | **No** — search-specific |
| `SearchSkeleton` | `components/tradeserv/search-skeleton.tsx` | Search page only | **No** — search-specific |
| `InquiryModal` | `components/tradeserv/inquiry-modal.tsx` | Public profile only | **No** — inquiry-specific |

### 7.3 Still Duplicated (Not Yet Extracted)

| Pattern | Pages | Estimate |
|---|---|---|
| `navigator.clipboard.writeText()` copy button | dashboard, profile, verification, services, reviews, proposals | ~6 copies × 5 lines = 30 lines |
| `Math.round((a/b)*100)` completion calc | profile, portfolio, verification | ~3 copies × 3 lines |
| Accordion section pattern (ChevronUp/Down toggle) | profile, services, portfolio, reviews, verification, proposals | ~6 copies × 15 lines = 90 lines |
| Status tab filter bar | inquiries, reviews | ~2 copies × 40 lines = 80 lines |
| GlassCard preview section (last section of every page) | dashboard, profile, services, portfolio, reviews, verification, proposals | ~7 copies × 15 lines = 105 lines |

### Recommendations

1. Create `useCopyToClipboard` hook — replaces 6 clipboard copies
2. Create `GlassCardPreview` component — replaces 7 preview sections
3. Create `StatusTabBar` component — replaces 2 filter tab bars
4. **Do NOT extract**: `ProfessionalCard`, `InquiryModal`, `FilterPanel` — these are domain-specific and won't be reused

---

## 8. WORKFLOW COMPLETENESS

### 8.1 Registration → Live Workflow

```
Public Landing ──→ Category Browse ──→ Public Profile (read-only)
      │                   │
      ▼                   ▼
Registration ──→ Success ──→ Workspace Dashboard
(7 Steps)           │            │
                    │            ▼
                    │       Profile Management
                    │       Services Catalog
                    │       Portfolio & Media
                    │       Business Identity
                    │         │
                    │         ▼
                    │       Verification (Documents)
                    │         │
                    │         ▼
                    │       TradTrust (Scoring)
                    │         │
                    │         ▼
                    │       GO LIVE
                    ▼
              Membership Purchase
```

**Status**: ✅ UI flow is complete end-to-end. All pages exist and render. No backend persistence.

### 8.2 Lead Capture → Engagement Flow

```
Client Search ──→ Public Profile ──→ Inquiry (modal)
                    │                    │
                    │                    ▼
                    │              Workspace Inquiries
                    │                    │
                    │                    ▼
                    │              Proposal Created
                    │                    │
                    │                    ▼
                    │              Proposal Sent (to client)
                    │                    │
                    │              ┌─────┴─────┐
                    │              ▼           ▼
                    │          Accepted     Rejected
                    │              │
                    │              ▼
                    │         Review Request
                    │              │
                    │              ▼
                    │         Review Submitted
                    │              │
                    │              ▼
                    │         TradTrust Update
                    │
                    ▼
              Client Reviews → Public Testimonial
```

**Status**: ✅ UI flow is complete. Inquiry→Proposal link is manual (pre-fill based on inquiry data). No automated review request after acceptance.

### 8.3 Missing Workflow Links

| Gap | Location | Impact | Fix |
|---|---|---|---|
| Registration data not seeded to workspace | Registration → Profile | User must re-enter data after registration | Registration submit should seed Profile, Services, Portfolio, Documents |
| Inquiry→Proposal pre-fill not automatic | Inquiries → Proposals | Professional must manually copy inquiry data | "Create Proposal" button on inquiry should pre-fill proposal form |
| Acceptance→Review request not automatic | Proposals → Reviews | No automated review solicitation | On `proposal.accepted`, trigger review request email after N days |
| Membership upgrade not wired | Workspace Membership → Registration Step 6 | Plans duplicated in 2 places | Single Plan data source |
| No booking/consultation system | Proposals → Booking | No way to schedule consultations | Future module (Phase 20+) |
| No notification system | All events → User | No real-time/email alerts | Use existing NotificationService (global module) |

---

## 9. DEMO DATA COVERAGE

| Data Type | Source | Records | Completeness |
|---|---|---|---|
| Categories | `tradeserv.ts` | 10 | ✅ Complete |
| Professional Profiles | `tradeserv-profiles.ts` | 7 | ⚠️ 7 of 10 categories have profiles (missing: Business Consultant, Product Photographer, Packaging Designer) |
| Inquiries | `inquiries/page.tsx` | 5 | ✅ Complete (shows wrong perspective bug) |
| Reviews | `reviews/page.tsx` | 10 | ✅ Complete |
| Services | `services/page.tsx` | 4 | ✅ Complete |
| Projects | `portfolio/page.tsx` | 3 | ✅ Complete |
| Case Studies | `portfolio/page.tsx` | 2 | ✅ Complete |
| Analytics | `dashboard/page.tsx` + `analytics/page.tsx` | 4 metrics | ✅ Complete (duplicated) |

### Demo Data Quality Issues

1. **Inquiry bug**: `DEMO_INQUIRIES` shows Rahul Sharma receiving inquiries, but `professionalName` lists OTHER professionals (Priya Patel, Vikram Desai, etc.). This is misleading.
2. **String-typed prices**: All prices stored as `string` (`"15,000"`) instead of numeric values.
3. **Missing profiles**: 3 categories have zero demo professionals.
4. **Single user scope**: Demo data works only for "Rahul Sharma" — other professionals don't have their own workspace view.

---

## 10. TECHNICAL DEBT SUMMARY

| Severity | Issue | Impact | Effort to Fix |
|---|---|---|---|
| **CRITICAL** | No backend — all data is localStorage/demo | Cannot go to production | 4-6 weeks (full Prisma + API) |
| **CRITICAL** | Profile page owns 5 domains | Data inconsistency, duplication | 2-3 days refactoring |
| **HIGH** | String-typed prices everywhere | Will break with Decimal backend | 1 day find/replace |
| **HIGH** | Zero form validation | Users enter invalid data freely | 2 days across all forms |
| **HIGH** | Zero error states on forms | No UX feedback on invalid input | 1 day across all forms |
| **MEDIUM** | 12 Settings toggles are non-functional | Feature not ready | 1 day |
| **MEDIUM** | Hardcoded "Rahul Sharma" across workspace | Only works for one user | Need user session (blocked by backend) |
| **MEDIUM** | `setLoading` inside `useMemo` on search page | Anti-pattern (side effect in computed value) | 30 min |
| **MEDIUM** | Clipboard copy not extracted (6 copies) | Code duplication | 30 min |
| **MEDIUM** | Accordion pattern duplicated (6 copies) | ~90 lines redundant | 1 hour |
| **LOW** | Duplicate Award icon for TradTrust + Membership | Minor UX inconsistency | 5 min |
| **LOW** | Missing GlassCard preview section component | ~105 lines redundant | 30 min |

---

## 11. BACKEND READINESS SUMMARY

### 11.1 What Can Be Reused As-Is (From Existing TRADINGO Backend)

| Module | Reuse Strategy | Files to Import |
|---|---|---|
| **AuthModule** | Full reuse — JWT, OAuth, OTP, role guards | `JwtAuthGuard`, `RolesGuard`, `CompanyOwnerGuard` |
| **TradTrustModule** | Full reuse — 6-dimension scoring for any Company | `TradTrustService.getScore()` |
| **MembershipModule** | Full reuse — add 2 new PlanTypes | `MembershipService.subscribe()`, `MembershipService.getCurrentPlan()` |
| **PaymentModule** | Full reuse — Razorpay + Stripe | `PaymentService.createOrder()` |
| **AiGatewayModule** | Full reuse — add 8 new TaskTypes | `AiGatewayService.process()` |
| **NotificationModule** | Full reuse — global module | `NotificationService.createWithTemplate()` |
| **LocationIntelligenceModule** | Full reuse — geocoding, nearby | `GeocodingService`, `MarketplaceIntelligenceService` |
| **CRM Module** | Full reuse — every professional gets CRM | `CrmService.createLead()` |
| **CompanyVerification** | Full reuse — add 7 new DocumentTypes | `CompanyVerificationService.submit()` |
| **Chat/Messaging** | Full reuse — existing business chat | Conversation module |

### 11.2 What Needs to Be Built

| Module | Models | Endpoints | Priority |
|---|---|---|---|
| TradeServ Professional Profile | ProfessionalProfile, Qualification, Certification | 8 endpoints | P0 |
| TradeServ Service Catalog | ProfessionalService | 7 endpoints | P0 |
| TradeServ Portfolio | ProfessionalPortfolio, CaseStudy, Media | 9 endpoints | P0 |
| TradeServ Inquiry | ProfessionalInquiry | 5 endpoints | P0 |
| TradeServ Proposal | Proposal, ProposalMilestone | 7 endpoints | P0 |
| TradeServ Review | ProfessionalReview | 5 endpoints | P0 |
| TradeServ Registration | (seed all above) | 5 endpoints | P0 |
| TradeServ Admin | (review queue, management) | 8 endpoints | P1 |
| TradeServ AI Features | (via AiGateway) | 8 endpoints | P2 |

### 11.3 New Prisma Models Required

| Model | Fields | Relations |
|---|---|---|
| `ProfessionalProfile` | companyId FK, bio, experience, languages, certifications, qualifications | → Company |
| `ProfessionalService` | companyId FK, name, category, priceMin/Max, pricingType, deliveryDays, isActive | → Company |
| `ProfessionalPortfolio` | companyId FK, title, description, clientName, completionDate, media(Json), tags, isFeatured | → Company |
| `ProfessionalCertification` | companyId FK, name, issuingAuthority, issueDate, expiryDate, certificateUrl, verificationStatus | → Company |
| `ProfessionalAvailability` | companyId FK, dayOfWeek, startTime, endTime, isAvailable | → Company (unique per day) |
| `ProfessionalLanguage` | companyId FK, language, proficiency | → Company (unique per lang) |
| `ProfessionalServiceArea` | companyId FK, city, state, country, serviceType | → Company |
| `Booking` | companyId FK, clientId FK, serviceId?, status, scheduledAt, duration, amount, notes | → Company (x2) |
| `ProfessionalReview` | bookingId FK, companyId FK, clientId FK, rating, title, description, isVerifiedBooking, rehired | → Booking, Company (x2) |
| `Proposal` | companyId FK, clientId FK, inquiryId?, title, description, amount, deliveryDays, status | → Company (x2) |
| `ProfessionalSavedSearch` | userId FK, searchCriteria(Json), name, notifyNewResults | → User |

**Total new models: 11**

### 11.4 Existing Models to Extend

| Model | New Fields |
|---|---|
| `Company` | `professionalType: ProfessionalType?`, `professionalStatus`, `professionalApprovedAt`, `professionalRejectedAt`, `professionalRejectedReason`, `professionalReviewedBy`, `responseTimeMinutes`, `lastActiveAt`, `videoIntroductionUrl`, `socialLinks`, `businessHours` |
| `CrmLead` | `professionalServiceId`, `bookingId`, `inquiryType` |
| `VerificationLevel` | `LEVEL_7` (Professional verified), `LEVEL_8` (Expert verified) |
| `DocumentType` | 7 new values: DIPLOMA, PROFESSIONAL_CERTIFICATE, PORTFOLIO_SAMPLE, LIABILITY_INSURANCE, PROFESSIONAL_MEMBERSHIP, CLIENT_REFERENCE, EXPERIENCE_LETTER |
| `BusinessType` | 3 new values: PROFESSIONAL, CONSULTANCY, FREELANCER |
| `PlanType` | 2 new values: TRADE_PROFESSIONAL_INDIVIDUAL, TRADE_PROFESSIONAL_COMPANY |
| `TaskType` | 8 new values: PROFILE_REVIEW, BIO_GENERATION, PORTFOLIO_SUGGESTION, SERVICE_DESCRIPTION, PRICING_SUGGESTION, LEAD_REPLY, MARKET_INSIGHT, COMPETITOR_ANALYSIS |

---

## 12. FINAL VERDICT

### Build Readiness: 🟢 GREEN

All 20 pages are fully built at the UI level with demo data. The architecture is sound despite duplication issues. Code quality is consistent with TRADINGO design system (dark theme, orange accent, glass morphism).

### Critical Path to Production

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. REFACTOR Profile page (remove business/services/portfolio)    │ 2-3 days
│  2. CREATE Prisma models (11 new, 7 extended)                     │ 2-3 days
│  3. BUILD TradeServ API module (~70 endpoints)                   │ 3-4 weeks
│  4. SEED demo data via API                                        │ 2-3 days
│  5. WIRE all workspace pages to API calls                         │ 1-2 weeks
│  6. ADD form validation to all forms                              │ 2-3 days
│  7. BUILD Admin review queue                                      │ 3-5 days
│  8. ENABLE TradTrust scoring for professional companies           │ 2-3 days
│  9. IMPLEMENT event-based notifications                           │ 3-5 days
│  10. DEPLOY to staging                                            │ 1-2 days
└─────────────────────────────────────────────────────────────────────┘
Total estimate: 6-10 weeks for full production launch
```

### Files Status Summary

| File Count | Status |
|---|---|
| 20 pages | ✅ Built with demo data |
| 11 components | ✅ Extracted (5) + domain-specific (6) |
| 2 data files | ✅ Demo data (7 profiles, 10 categories) |
| 0 API files | 🟡 Not started |
| 0 Prisma models | 🟡 Not started |
| 0 backend modules | 🟡 Not started |
| 0 hooks/api layers | 🟡 Not started (frontend API) |

---

## 13. RECOMMENDED NEXT STEPS

1. **Refactor Profile page first** — Remove services, portfolio, and business sections before backend starts. This prevents building API endpoints that map to wrong pages.
2. **Choose role strategy** — Decide: new `PROFESSIONAL` Role or `professionalType` discriminator on SELLER role.
3. **Design Prisma models** — Use the 11-model specification above as starting point.
4. **Build Registration API first** — It seeds all other models and unblocks everything.
5. **Build Public Profile API second** — It tests the aggregations and enables search indexing.
6. **Build Workspace APIs in parallel** — Profile, Services, Portfolio, Verification can be built independently.
7. **Fix Inquiry demo data bug** — Currently shows wrong professional names.
8. **Add form validation** — Backend DTOs must have class-validator decorators; frontend must add error states.
9. **Convert string prices to Decimal** — In all demo data and interfaces.

---

*Audit performed by automated codebase inspection. No code modified. No files created beyond this report.*
