# AGENTS.md — Session Context

## Goal
Complete Phase 16.8 — Wire SMS Gateway: Install Twilio SDK, create SMS service, integrate with OTP authentication, enable SMS notifications for order/shipment/delivery events, add admin SMS management console, replace all console.log/simulated SMS with real delivery.

## Permanent Workflow (Automated — After Every Completed Phase)
1. **Run all verification**: prisma validate, prisma generate, tsc api, tsc web, eslint, next build
2. **Generate completion report**: Existing vs New Report, Files Modified, Files Created, Components Reused, Features Added, Verification Results
3. **Determine next logical phase** using AGENTS.md, current roadmap, current repository state, completed phases
4. **Auto-generate complete implementation prompt** for next phase (must include Objective, Audit requirements, Existing vs New Report instructions, Components to reuse, Architecture rules, Files expected, Documentation required, Verification steps, Output format, Stop condition — immediately executable)
5. **STOP**. Do NOT ask "What next?", "Should I continue?", "Would you like me to proceed?", "Wait for your direction."
6. End every phase with:
   ```
   NEXT PHASE READY
   Phase: <Name>
   Implementation Prompt: <complete ready-to-run prompt>
   Status: Waiting for only one command: START
   ```
7. When user replies START/PROCEED/CONTINUE — immediately begin implementation. No further confirmation.
8. **Always**: Audit First, Reuse Before Create, No Duplicate Code, Provider Agnostic Architecture, Enterprise Standards
9. **Never skip the audit.**

## Constraints & Preferences
- Locked modules: do not touch modules outside buyer marketplace unless required by the fix
- No new modules, no AI, no Global Trade
- GOCASH™ v1.0 — CERTIFIED AND FROZEN (do not modify)
- Every fix must be backward compatible; business workflows must not change
- Replace ALL mock/hardcoded data with real API calls
- No placeholder code, no TODOs
- Validate every form with proper error states
- Frontend must show proper loading, empty, and error states
- Shared pagination utility — no duplicate pagination logic
- DTOs must use class-validator/class-transformer decorators consistently
- `onDelete` policies must be explicit on every Prisma relation
- Verification after each fix: tsc both apps → next build
- No commit unless explicitly asked

## Progress
### Done (Foundational)
- **Production Audit** (`TRADINGO-PRODUCTION-AUDIT.md`): 170 Prisma models, 107 enums, ~1,087 files. 3 Critical, 9 Major, 8 Minor.
- **Sprint 1 — Critical Fixes**: StatusBadge `normalizeStatus()`, `@Roles('ADMIN')` uppercase, PurchaseOrder.negotiationId FK constraint.
- **Sprint 2A — Major Fixes**: Indexes, pagination helpers, DTO validation, onDelete policies, multi-file upload, POD timestamps.
- **Full UAT** (`TRADINGO-UAT-REPORT.md`): 80+ pages, 70+ controllers, 100+ services — 77 issues. Verdict: PASS WITH MINOR ISSUES.
- **Documentation**: `TRADINGO-STABILIZATION-SPRINT-2-FINAL.md`, `TRADINGO-PRODUCTION-AUDIT-UPDATE.md`, Core Platform Completion matrix, v1.0 Certification.

### Done (Sprint 1 — Auth & User Management)
- Added SELLER/BUYER to Role enum, enhanced Session model (device, ip, lastActiveAt, isActive)
- Created 9 DTOs: login, register, forgot-password, reset-password, change-password, verify-email, verify-mobile, update-settings, social-login
- Added 5 endpoints: `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password`, `POST /auth/social-login`, `PATCH /auth/me`
- Fixed 3 security info leaks (user enumeration via generic success messages)
- Wired 5 TODO pages to real APIs: forgot-password, reset-password, login, register, verify-email
- Added AuthProvider to Providers tree
- Verified: prisma ✅, tsc (api + web) 0 errors ✅, next build 171 routes ✅

### Done (Sprint 2B — Seller Workspace Fixes)
All 12 items implemented and verified:
- Created 6 DTOs: `CreateProductDto`, `UpdateProductDto`, `CreateBrandDto`, `UpdateBrandDto`, `CreateMediaDto`, `UpdateMediaDto` — eliminates all `@Body() body: any` in seller-product, brand, media controllers
- Brand delete protection — checks linked products before delete (400 with product count)
- `GET /companies/my-company` endpoint for dynamic company resolution
- Fixed seller profile page — replaced `useCompany('company-1')` with `/companies/my-company`
- Fixed seller dashboard — replaced hardcoded `TRADING_STATS` with `/seller/analytics/overview`
- Fixed products page — `useToast` + error handling in all 3 catch blocks
- Fixed product edit page — toast on load/save failures
- Fixed product wizard — API-fetched categories instead of hardcoded list
- Fixed bulk upload — real `parseCSV()`, real `/seller/bulk/import`, removed `setTimeout` mock
- Fixed export page — toast notifications for fetch/start/download
- Verified: prisma ✅, tsc (api + web) 0 errors ✅, next build 171 routes ✅

### Done (Sprint 3 — Buyer Marketplace Audit)
- **Buyer Audit** (`TRADINGO_BUYER_AUDIT.md`): 20+ buyer pages, 10+ backend controllers — 12 pages with mock data, 10 silent catch blocks, 2 full-mock quote-comparison pages, missing `@Get(':id')` on SmartRfqController, heavy `any` usage, static settings/support pages.

### Done (Sprint 3 — Backend)
- Added `findById`, `updateRfq`, `findQuotes` to SmartRfqService
- Added `@Get(':id')`, `@Patch(':id')`, `@Get(':id/quotes')` to SmartRfqController
- Added `update`, `getQuotes` to frontend smartRfqApi

### Done (Sprint 3 — Frontend Fixes)
- **RFQ detail** — `useToast` + error handling for duplicate
- **RFQ edit** — `smartRfqApi.update`, toast + save state
- **Quote compare** (`/buyer/quote/compare`) — removed `MOCK_QUOTES`, wired to API, loading/empty states
- **Compare quotes** (`/buyer/compare-quotes`) — removed hardcoded `comparison`, wired to API, best-price highlighting, added Suspense boundary for `useSearchParams()`
- **Settings** (`/buyer/settings`) — `useAuth()` instead of hardcoded "Rahul Sharma", save to `PATCH /auth/me`, password change via `POST /auth/change-password`
- **Support** (`/buyer/support`) — hardcoded `recentTickets` → `/buyer/notifications?type=support`
- **Saved products** (`/buyer/saved-products`) — `useToast` error handling for load/remove
- Verified: tsc (api) 0 errors ✅, tsc (web) 0 errors ✅, next build 171 routes ✅

### Done (Phase 14B — Production Launch Readiness)
All 11 audit domains completed, critical issues fixed, launch readiness document generated:
- **`.env.example`** — Added 18 missing variables (SMTP, OAuth, Maps, SMS, Stripe, PAYMENT_MODE, etc.)
- **Fastify bodyLimit** — Fixed mismatch (10MB → 100MB) in main.ts
- **Sentry initialization** — Added `Sentry.init()` in main.ts (was loaded but never called)
- **Liveness + Readiness** — Added `GET /live` and `GET /ready` endpoints to HealthController
- **CSRF protection** — Installed and registered `@fastify/csrf-protection` in main.ts; re-enabled Helmet CSP
- **Notification bridge** — `NotificationProcessor.sendEmail()` now queues real SES delivery via `EmailProcessor` instead of logging
- **Quote acceptance** — Added `POST /smart-rfq/:rfqId/accept-quote/:quoteId` and `reject-quote` endpoints; wired Accept button on compare page
- **Company profile** — Removed unnecessary `try/catch` around `Promise.allSettled` pattern
- **`TRADINGO-LAUNCH-READINESS.md`** — 15-section report with risk assessment, go-live checklist, rollback checklist
- Verified: tsc (api + web) 0 errors ✅, next build 171 routes ✅

### Done (Phase 14C — Cross-Browser, Performance & Production Certification)
- **TRADINGO-BROWSER-COMPATIBILITY.md** — Browser compatibility report (metrics pending production)
- **TRADINGO-PERFORMANCE-REPORT.md** — Performance report (metrics pending production)
- **TRADINGO-ACCESSIBILITY-REPORT.md** — Accessibility report (metrics pending production)
- **TRADINGO-SEO-REPORT.md** — SEO report (metrics pending production)
- **TRADINGO-PRODUCTION-CERTIFICATION.md** — v1.0 Certification (metrics pending production)

### Done (Phase 14D — Final Production Certification & Go-Live Approval)
- **Security Certification** (`TRADINGO-SECURITY-CERTIFICATION.md`): 14 categories, 66 verified controls. 2 CRITICAL findings (dev OTP bypass, analytics raw SQL).
- **Infrastructure Certification** (`TRADINGO-INFRASTRUCTURE-CERTIFICATION.md`): 13 categories, 63 verified, 30 configured. 1 blocking (API Dockerfile empty).
- **Go-Live Approval** (`TRADINGO-GO-LIVE-APPROVAL.md`): 🔴 NOT APPROVED — 3 critical/blocking issues must be remediated.
- **Production Certificate** (`TRADINGO-v1.0-PRODUCTION-CERTIFICATE.md`): 14-domain certification with evidence-based verification.
- **Business Workflow Audit**: 12 workflow modules verified end-to-end. Complete buyer→seller→RFQ→quote→negotiation→PO→order→shipment→delivery→payment flow.
- **Data Integrity Audit**: 167 models, 207 FK relations (100% onDelete coverage), 414 indexes, 91 transaction call sites, 108 validated DTOs.
- **KNOWLEDGE.md**: Created with full platform architecture, patterns, and troubleshooting guide.

### Done (Phase 14D.1 — Production Blocker Remediation)
All 3 production blockers fully remediated:
- **Blocker 1 — Dev OTP Backdoor**: Removed all `if (otp === '123456')` bypasses from `auth.service.ts` (3 locations). All OTP flows now validate against Redis.
- **Blocker 2 — Analytics Raw SQL**: Removed `POST /analytics/query` endpoint and `queryRaw()` method. No client can execute arbitrary SQL.
- **Blocker 3 — API Dockerfile**: Created production-ready Dockerfile (37 lines) with multi-stage build, non-root user, healthcheck.
- **Validation**: Prisma validate ✅, Prisma generate ✅, tsc (api + web) 0 errors ✅, next build 171 routes ✅
- **Go-Live Status**: 🟢 APPROVED FOR PUBLIC PRODUCTION
- **Remediation Report**: `TRADINGO-BLOCKER-REMEDIATION.md`

### Done (Phase 15A.3 — Enterprise Immutable Ledger Engine)
- Deleted 4 TypeORM entity files + `entities/` and `models/` directories
- Extended Prisma schema: added `GOCASHLedgerDirection`, `GOCASHLedgerStatus`, `GOCASH_RedemptionType` enums; expanded `GOCASHTransactionType` to 16 types; enhanced `GOCASH_Wallet`, `GOCASH_Transaction`, `GOCASH_Redemption` with direction, status, currency, idempotencyKey, notes; removed all `@relation` to User/Company
- Rewrote `gocash.service.ts` with 14 methods: createWallet, credit, debit, reverse, redeem, approve/reject redemption, getBalance, getLedger, verifyIdempotency, admin stats — all append-only
- Fixed `gocash.controller.ts`, `gocash.module.ts`, `dto/`, `index.ts`
- Registered `GocashModule` in `AppModule`
- Fixed `packages/gocash/package.json` (removed TypeORM dep, fixed JSON comments)
- Generated `GOCASH-LEDGER-ENGINE.md` with full architecture, ledger flow, balance calculation, idempotency/concurrency strategy, audit model, recovery
- **Verification**: prisma validate ✅, generate ✅, tsc (api) 0 errors ✅, eslint 0 errors ✅, next build 174 routes ✅

### Done (Phase 15A.5 — Enterprise Referral Engine)
- Extended Prisma schema: added ReferralCode, ReferralUsage, ReferralReward, ReferralAudit, ReferralRule, ReferralBlacklist + 5 enums; added internal Prisma relations between referral models
- Built `referral.service.ts` with: code generation (TRAD + 10 hex), validation, fraud detection (self-referral, velocity, disposable email, blacklist, circular), reward processing via GOCASH Ledger idempotent credit, admin dashboard, paginated search, fraud alerts
- Built `referral.controller.ts` with 17 endpoints: user codes (create/list/get own), validate/apply, history/statistics/audit, admin dashboard/referrals/fraud-alerts/blacklist CRUD
- Created DTOs with class-validator decorators
- Registered ReferralModule in AppModule (imports GocashModule)
- Created frontend API layer: `apps/web/lib/api/referral.ts` with 14 typed functions
- Created React Query hooks: `apps/web/hooks/use-referral.ts` with 12 hooks (useMyReferralCode, useCreateReferralCode, useValidateReferral, useFraudAlerts, useBlacklist, etc.)
- Generated `GOCASH-REFERRAL-ENGINE.md` with full architecture, referral flow, fraud detection, reward processing, API contracts
- **Verification**: prisma validate ✅, generate ✅, tsc (api) 0 errors ✅, eslint 0 errors (8 any warnings) ✅, next build 174 routes ✅

### Done (Phase 15A.6 — Enterprise Campaign Engine)
- Extended Prisma schema with 5 new models (`Campaign`, `CampaignRule`, `CampaignTarget`, `CampaignClaim`, `CampaignAnalytics`) and 4 new enums (`CampaignType` with 13 types including AI, `CampaignStatus` with 7 states, `CampaignTargetType` with 11 types, `CampaignClaimStatus` with 5 states) — existing `RewardCampaign` model untouched
- Built `campaign.service.ts` with: full CRUD, IF/THEN rule engine (9 operators: EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, CONTAINS, IN, BETWEEN, etc.), budget engine (total budget, spent/remaining, daily/per-user/per-company limits, max claims), eligibility engine (status/date/budget/limits/fraud checks), reward processing via GOCASH Ledger idempotent `CAMPAIGN_REWARD`, analytics tracking (daily upsert), campaign clone/pause/resume/archive, admin dashboard with type breakdown, seller-specific campaign listing, expired campaign processor, rule evaluation engine
- Built `campaign.controller.ts` with 20 endpoints: CRUD (create/list/get/update/delete), search (paginated, filterable by type/status/date/search), active campaigns, by-type, my-claims, eligibility check, claim reward, admin dashboard, seller campaigns, clone/pause/resume/archive, analytics, rule evaluation, expired processor
- Created 4 DTO files (create, update, query, claim) with class-validator decorators
- Registered CampaignModule in AppModule (imports GocashModule)
- Created frontend API layer: `apps/web/lib/api/campaign.ts` with 20 typed functions + 6 TypeScript interfaces
- Created React Query hooks: `apps/web/hooks/use-campaign.ts` with 17 hooks (useCampaigns, useCampaign, useCreateCampaign, useClaimReward, useActiveCampaigns, useAdminCampaignDashboard, useSellerCampaigns, etc.)
- Created 5 frontend pages: Admin campaign list with dashboard stats (`/admin/campaigns`), Admin campaign builder form (`/admin/campaigns/new`), Admin campaign detail with rules/targeting/analytics (`/admin/campaigns/[id]`), Buyer campaign center with claim cards and history (`/buyer/campaigns`), Seller campaign dashboard with promotions and rewards (`/seller/campaigns`)
- Generated `GOCASH-CAMPAIGN-ENGINE.md` with full architecture, rule engine spec (9 operators, 4 action types), budget engine, eligibility flow, fraud prevention, API contracts (20 endpoints), analytics model, future AI campaign support
- **Verification**: prisma validate ✅, generate ✅, tsc (api) 0 errors ✅, eslint 0 errors (21 any warnings) ✅, tsc (web) 0 errors ✅, next build 178 routes ✅ (4 new campaign pages)

### Done (Phase 15A.7 — Enterprise Wallet API & Financial Operations Layer)
- Created `WalletApiModule` at `apps/api/src/modules/wallet-api/` — wraps `GocashService` as the official financial interface
- Built `wallet-api.service.ts` with: buyer wallet (summary, balance, transactions, rewards, statement), seller wallet (summary, transactions, analytics by type), admin wallet (search by ID/user/company/status, wallet detail, freeze/unfreeze, manual credit/debit/adjustment, reverse transaction, fraud monitoring, ledger search, wallet audit), statement generation (monthly/quarterly/yearly/custom), CSV export, analytics (growth, distribution, top wallets, redemption trends)
- Built `wallet-api.controller.ts` with 30+ endpoints under `/wallet/` prefix — buyer (5), seller (4), admin (11), statement (2), analytics (4)
- Created DTOs with class-validator decorators (WalletSearchDto, LedgerSearchDto, StatementQueryDto, ManualCreditDto, ManualDebitDto, AdjustWalletDto, ReverseTransactionDto)
- Registered WalletApiModule in AppModule (imports GocashModule)
- Created frontend API layer: `apps/web/lib/api/wallet.ts` with 22 typed functions + 12 TypeScript interfaces (WalletSummary, WalletBalance, LedgerEntry, WalletStatement, SellerAnalytics, AdminWalletSummary, AdminWalletDetail, FraudAlerts, WalletGrowth, DistributionItem, TopWallet, RedemptionTrend)
- Created React Query hooks: `apps/web/hooks/use-wallet.ts` with 22 hooks (useBuyerWalletSummary, useSellerAnalytics, useSearchWallets, useFreezeWallet, useManualCredit, useFraudAlerts, useGrowthAnalytics, etc.)
- Rewired existing buyer/seller GOCASH pages (`/buyer/gocash`, `/seller/gocash`) to use real Wallet API endpoints instead of non-existent `/gocash/balance` and `/gocash/history`
- Created admin wallet console (`/admin/wallets`) with wallet search, fraud alerts, top wallets, growth stats
- Created admin wallet detail (`/admin/wallets/[id]`) with freeze/unfreeze, manual credit/debit
- Fixed frontend-backend type mismatch — `LedgerEntry` now matches `GOCASH_Transaction` model
- Fixed pagination format to match existing `PaginatedResponse<T>` flat structure
- Generated `GOCASH-WALLET-API.md` with full architecture, API contracts, data models, search/filtering, statement generation, fraud detection, security, integration guide
- **Verification**: tsc (api) 0 errors ✅, tsc (web) 0 errors ✅, eslint (wallet-api) 0 errors (16 any warnings) ✅, next build 179 routes ✅

### Done (Phase 15A.8 — Premium Wallet UX)
- Created 3 reusable wallet components at `apps/web/components/wallet/`: `WalletTransactionFilters` (direction/type/date filters with search + date presets), `WalletTimeline` (chronological reward activity), `WalletAnalyticsBar` (gradient progress bars for distribution data)
- Enhanced buyer GOCASH page (`/buyer/gocash`): quick action cards to Campaigns/Referrals/Redeem/Statement, transaction filters, reward timeline sidebar, wallet overview bars, campaign/referral center cards, statement period picker
- Enhanced seller GOCASH page (`/seller/gocash`): quick action cards, reward breakdown bars, by-type distribution, quick stats panel, transaction filters, statement period picker, recent activity timeline
- Enhanced admin wallet console (`/admin/wallets`): collapsible fraud center with high-velocity wallets, collapsible ledger explorer with global search, distribution/redemption analytics, collapsible system monitor
- Enhanced admin wallet detail (`/admin/wallets/[id]`): collapsible ledger explorer (real API via searchLedger with walletId), collapsible audit trail, adjust balance form, reverse transaction form, summary grid
- Created `/buyer/gocash/redeem` page (was dead link) with balance display, redeem form, and earn/refer links
- Fixed all missing error states across all 4 pages (40+ state gaps resolved)
- Added sticky table headers for all horizontally-scrolling transaction tables
- Added date range presets (Last 7 days, Last 30 days, This month) to filters
- Added transaction search text input to filter components
- Added toast notifications on CSV download initiation
- All visualizations use pure Tailwind CSS (no chart library), consistent with TRADINGO dark theme
- Generated `GOCASH-WALLET-UX.md` with component hierarchy, screen flow, data flow, future enhancements
- **Verification**: tsc (api) 0 errors ✅, tsc (web) 0 errors ✅, next build 180 routes ✅

### Done (Phase 15A.9 — Platform Integration)
- Created `GocashIntegrationModule` at `apps/api/src/modules/gocash-integration/` — standalone integration layer that processes GOCASH rewards for all platform domains
- Built `constants.ts` with reward amounts for every integration point (Membership: signup 200, plan upgrade 500; Order: completed 50, milestones 200/1000/2500; RFQ: created 25; Quote: accepted 100; Negotiation: completed 75; PO: confirmed 100; Shipment: delivered 50; Delivery: confirmed 75)
- Built `gocash-integration.service.ts` with: idempotent reward processing (`verifyIdempotency` + `credit` via GocashService), milestone detection (order count thresholds), dual-party rewards (Quote accepted: both buyer + seller), notification delivery via `NotificationService.createWithTemplate()`, integration summary with breakdown by reference type
- Built `gocash-integration.controller.ts` with 10 endpoints under `/gocash-integration/`: membership signup, plan upgrade, order completed, RFQ created, quote accepted, negotiation completed, PO confirmed, shipment confirmed, delivery confirmed, summary
- Created DTOs with class-validator decorators (8 request DTOs)
- Registered `GocashIntegrationModule` in AppModule (imports `GocashModule`, uses Global `NotificationService`)
- Created frontend API layer: `apps/web/lib/api/gocash-integration.ts` with 10 typed functions + `IntegrationSummary` interface
- Created React Query hooks: `apps/web/hooks/use-gocash-integration.ts` with 10 hooks (useIntegrationSummary, useAwardSignupBonus, useAwardOrderCompleted, useAwardQuoteAccepted, etc.)
- All rewards use idempotency keys (`REFERENCE_TYPE_refId_userId`) — safe to call multiple times
- **Verification**: tsc (api) 0 errors ✅, tsc (web) 0 errors ✅, next build 180 routes ✅

### Done (Phase 15B.1 — TRADGO Critical Consolidation)

#### KYC Consolidation
- Fixed `lib/api/kyc.ts` to call `/company-verifications` (not `/kyc`); updated `reviewKyc` to POST `/company-verifications/:id/review`; updated `KYCSubmission` type to match backend
- Rewrote `/admin/verification/page.tsx` with real API (loading/error/empty states, Approve/Reject buttons via `useReviewKyc` mutation)
- Deleted duplicate `/admin/kyc/page.tsx`
- Added `verification` to breadcrumb labelMap

#### VerifiedBadge Component Standardization
- Created reusable `VerifiedBadge` component (5 types: verified/trusted/premium/gold/elite, 3 sizes: sm/md/lg)
- Replaced 7 inline `<BadgeCheck>` + "Verified" implementations in: `SellerBadge.tsx`, `product-card.tsx`, `compact-product-card.tsx`, `UnifiedCard.tsx`, `ProductCard.tsx`, `CompanyCard.tsx`, `CompanyProfileClient.tsx`
- Removed `BadgeCheck` from all 7 affected imports, added `VerifiedBadge` import

#### Leaderboard Typing
- Added `LeaderboardEntry` interface to `lib/api/types.ts` (rank, companyId, companyName, slug, logo, trustScore, totalProducts, verificationLevel, score)
- Updated `getLeaderboard()` to return `LeaderboardEntry[]` instead of `any[]`
- Fixed `seller/tradgo/page.tsx` consumer to use `LeaderboardEntry` instead of `any`

#### Analytics Endpoint Fix
- Fixed `getAnalytics()` to call `/analytics/admin/dashboard` (was bare `/analytics` — always 404)
- Updated `AnalyticsSummary` type to match backend `getAdminDashboard()` return shape (gmv, totalSellers, totalBuyers, rfqs, orders, disputes, payments, settlements, growth, period)
- Fixed `admin/analytics/page.tsx` to use correct field names (gmv → Revenue, orders → Orders, rfqs → RFQs, totalSellers → Total Sellers)
- Fixed silent `.catch(() => {})` in `seller/analytics/page.tsx` — added toast on failure

#### TradTrust Controller
- Added `getScore()` and `getHistory()` methods to existing `TradTrustService`
- Created `TradTrustController` with 4 endpoints: `GET /tradtrust/score/:companyId`, `GET /tradtrust/history/:companyId`, `POST /tradtrust/recalculate/:companyId` (admin), `POST /tradtrust/recalculate-all` (admin)
- Updated `TradTrustModule` to register the controller
- **Verification**: tsc (api + web) 0 errors ✅, next build 179 routes ✅

### Done (Phase 15B.2 — Buyer Verification & Reputation Foundation)

#### Prisma Schema
- Added `verificationLevel` + `mobileVerifiedAt` fields to `User` model (reusing `VerificationLevel` enum)
- Created `UserVerification` model (pattern from `CompanyVerification`)
- Created `UserVerificationDocument` model
- Created `ReputationEventType` enum (11 collect-only event types)
- Created `ReputationEvent` model (append-only event log with optional JSON metadata)

#### Backend
- Created `UserVerificationModule` — 5 endpoints under `/user-verifications` (submit/list/my/findById/review)
- Created `UserVerificationService` — submit, review with level-upgrade, cursor-paginated list, sensitive data masking
- Created `ReputationModule` — 2 read-only endpoints under `/reputation`
- Created `ReputationService` — `recordEvent()`, `getEvents()`, `getSummary()`
- Registered both modules in `AppModule`

#### Frontend
- Created `lib/api/user-verification.ts` — typed API client with 7 functions
- Created `hooks/use-user-verification.ts` — 7 React Query hooks
- Created `app/admin/user-verification/page.tsx` — admin review queue
- Extended `app/buyer/settings/page.tsx` — Account Verification card (email status, mobile status, KYC level)
- Updated `lib/api/types.ts` — added `emailVerifiedAt`, `verificationLevel` to `User` interface

#### Documentation
- `TRADGO-BUYER-VERIFICATION.md` — full architecture, endpoints, workflow, files
- `TRADGO-REPUTATION-FOUNDATION.md` — event types, API, design principles

#### Verification
- prisma validate ✅, prisma generate ✅
- tsc (api) 0 errors ✅, tsc (web) 0 errors ✅
- next build 180 routes ✅ (new: `/admin/user-verification`)

### Done (Phase 16.3 — Enterprise Advertising Platform)
- **Audit**: Full codebase audit — 31 existing features found (Campaign Engine, TradFind, TradTrust, Membership, GOCASH, Bestseller snapshots, Analytics, Product.isFeatured, PLAN_BOOST). No existing ad/sponsored/featured/banner/promotion models exist.
- **Prisma schema**: Added 4 enums (`AdType` with 9 types, `AdStatus` with 8 states, `AdPricingModel` with CPC/CPM/FIXED, `AdTargetType` with 7 target types) + 3 models (`Advertisement` with 34 fields, `AdTarget`, `AdAnalytics`)
- **Backend module** (`apps/api/src/modules/advertising/`): `AdvertisingService` with 20 methods (CRUD, pause/resume/stop, approve/reject, fund via GOCASH, analytics, impression/click tracking, placements, expiry/auto-processing), `AdvertisingController` with 14 seller/public endpoints, `AdminAdvertisingController` with 9 admin endpoints, 4 DTOs
- **GOCASH Integration**: `fund()` method debits seller's GOCASH wallet via `GocashService.debit()` with idempotency keys; transitions DRAFT → PENDING_REVIEW
- **Membership Integration**: Discount rates by plan slug (Trade Smart 10%, Plus 15%, Pro 20%, Premium 25%, Elite 30%) applied to CPC/CPM/Fixed pricing
- **Frontend API**: `lib/api/advertising.ts` — 22 typed functions + 10 TypeScript interfaces
- **React Query hooks**: `hooks/use-advertising.ts` — 20 hooks (useMyAds, useCreateAd, usePauseAd, useFundAd, useAdminAds, useApproveAd, etc.)
- **Seller pages**: Dashboard (`/seller/advertising`), Create Campaign (`/seller/advertising/new`), Campaign Detail (`/seller/advertising/[id]`) — all with loading/empty/error states
- **Admin pages**: Dashboard (`/admin/advertising`), Campaign Detail (`/admin/advertising/[id]`) — approve/reject/pause/resume with stats
- **Placement API**: `GET /advertising/placements?type=SPONSORED_PRODUCT` — returns active ads for frontend injection into TradFind search results, homepage, category pages — no modification to TradFind module required
- **Documentation**: `ENTERPRISE-ADVERTISING-PLATFORM.md` — full architecture, 9 ad types, API contracts, integration summary
- **Verification**: prisma validate ✅, generate ✅, tsc (api) 0 errors ✅, tsc (web) 0 errors ✅, eslint 0 new errors ✅, next build 181 routes ✅

### Done (Phase 16.6B — AI Seller Workspace & Product Copilot)
- **Audit**: Confirmed AI backend has 16 fully built endpoints, frontend has 16 unused API functions + 16 unused hooks, zero AI pages/components exist, membership has no AI credits system yet
- **AI Copilot Components**: Created 3 reusable components — `CopilotPanel` (description/SEO/specs/images/translation buttons), `SuggestionCard` (accept/reject/edit with preview), `CatalogScoreCard` (5 sub-scores bar chart + recommendations)
- **AI Workspace Page**: Created `/seller/ai-workspace` with health dashboard (6 stat cards), catalog scores table, bulk processing job list with status filter tabs, quick stats sidebar
- **Seller Nav**: Added "AI Workspace" link with Sparkles icon to `DASHBOARD_SELLER_NAV`
- **Product Edit Page Extension**: Extended `/seller/products/[id]/edit` with AI Copilot sidebar toggle (CopilotPanel) wired to `useGenerateDescription`, `useGenerateSeo`, `useSuggestSpecs`, `useSuggestImages`, `useTranslateProduct`, `useAiCache` hooks; shows existing AI cache suggestions; mixed react-query + raw axios pattern
- **Verification**: tsc api 0 errors ✅, tsc web 0 errors ✅, next build 190 routes ✅

### Done (Phase 16.6C.2 — Real AI Provider Connections & Gateway Resilience)
- **5 providers upgraded from stubs to real HTTP**: OpenRouter, Gemini, Groq (fetchWithRetry + AbortController SSE streaming), Tavily (search API), Firecrawl (web scraping)
- **Gateway Fallback Chain**: `ai-gateway.service.ts` iterates through fallback providers on failure using `getFallbackProviders()` from router
- **Model Registry**: `ModelRegistryService` catalogs 14 models across 5 providers with capabilities (vision, OCR, streaming, maxTokens, contextWindow, cost)
- **Streaming SSE**: `POST /ai-gateway/stream` endpoint with `AiStreamRequestDto`
- **Admin Dashboard**: `/admin/ai-infrastructure` with provider status cards, model registry tab, cache hit rate, cost breakdown
- **Verification**: tsc api 0 errors ✅, tsc web 0 errors ✅, next build 190 routes ✅

### Done (Phase 16.6D — AI RFQ Intelligence)
- **Backend**: Built `AiRfqService` with 10 features (requirements extraction, buyer match, supplier suggestions, pricing analysis, timeline prediction, risk assessment, completeness check, document analysis, market intelligence, scope clarification)
- **10 endpoints** on SmartRfqController under `/smart-rfq/:id/ai/:action`
- **Frontend**: Created API layer (`ai-rfq.ts`), React Query hooks (`use-ai-rfq.ts`), reusable `AiRfqCopilot` component
- **Step Requirement Extended**: `StepRequirement` model enhanced with AI toggle
- **Verification**: tsc api 0 errors ✅, tsc web 0 errors ✅, next build 190 routes ✅

### Done (Phase 16.6E — AI Quote & Pricing Advisor)
- **Backend**: Built `AiQuoteService` with 10 features (generate, price-recommendation, winning-probability, margin-analysis, competitiveness, review, negotiation-prep, risk-assessment, quality-score, sidebar)
- **10 endpoints** on `AiQuoteController` under `/quotes/:id/ai/:action`
- **10 request DTOs** with class-validator
- **Auto-seeded** `QUOTE_ANALYSIS` prompt via PromptManagerService
- **Frontend**: Created API layer (`ai-quote.ts`), React Query hooks (`use-ai-quote.ts`), `AiQuoteSidebar` component with 4 tabs
- **Integrated** into seller quote builder page (`/seller/quote/new`)
- **Verification**: tsc api 0 errors ✅, tsc web 0 errors ✅, next build 191 routes ✅

### Done (Phase 16.6F — AI Negotiation Copilot)
- **Audit**: 4 parallel agents audited Smart Negotiation (524-line service, 14 endpoints, 15 methods), AI Gateway (26 files, 27 endpoints, TaskType.NEGOTIATION=20 credits), Quote Module, TradTrust (550-line, 6-dimension scoring), CRM (27 files), Finance Credit, Membership, Chat, Negotiation Pages
- **Backend**: Created `AiNegotiationService` (12 methods), `AiNegotiationController` (12 endpoints under POST `/smart-negotiation/:id/ai/:action`), `AiNegotiationDto` (12 request DTOs)
- **SmartNegotiationModule updated**: imports AiGatewayModule + QuoteModule + TradTrustModule
- **QuoteModule fixed**: exports AiQuoteService for cross-module injection
- **Frontend**: Created API layer (`ai-negotiation.ts`), React Query hooks (`use-ai-negotiation.ts`, 12 hooks), reusable `AiNegotiationCopilot` component (5 tabs: Strategy, Behaviour, Risk, Communication, Summary)
- **Seller page extended**: AI Copilot toggle + sidebar replacing Quote Info + result panel + toast notifications
- **Buyer page extended**: Same AI Copilot toggle + sidebar + result display panel
- **12 AI features**: strategy, buyer-behavior, seller-suggestions, sentiment, deal-probability, suggested-replies, risk-detection, conversation-summary, translate, ai-memory, timeline, sidebar
- **Prompt auto-seeded**: `NEGOTIATION` prompt with 0.3 temperature, 4096 maxTokens
- **All AI via existing Gateway**: no direct provider calls, credits tracked (20 per call via TaskType.NEGOTIATION)
- **Documentation**: `AI-NEGOTIATION-COPILOT.md` generated
- **Verification**: prisma validate ✅, prisma generate ✅, tsc api 0 errors ✅, tsc web 0 errors ✅, next build 191 routes ✅

### Done (Phase 16.6G — AI Product Wizard)
- **Created WizardCopilot component** (`apps/web/components/ai/wizard-copilot.tsx`): `useWizardAi()` hook with per-action loading tracking (`aiLoading: Record<string, boolean>`), `handleAiGenerate(action, apiCall, onResult)` with toast on success/failure, `AiActionButton` (Sparkles icon + loading spinner), `WizardCopilot` component that renders step-appropriate AI actions, `getStepActions()` factory returning actions per step (1: Generate Description/Suggest SEO/Auto-fill HS Code, 2: Suggest Specs, 3: Suggest Image Types, 4: Suggest Pricing, 6: Translate Hindi/Arabic/French, 7: Calculate Score)
- **Integrated AI into all 7 wizard steps**: Inline AI action bar in each step using custom event pattern (`wizard-ai-fill` event dispatched from WizardCopilot, listened to in wizard.tsx via `useEffect`), AI fills form fields directly (description/shortDescription via `v.handleFieldChange`, specs via `setSpecs`, translations via `setMultiLangDesc`, pricing via `setPriceSlabs`)
- **Fixed 3 silent catch blocks**: Categories fetch (line 104) → toast `Failed to load categories`, Template fetch (line 123) → toast `Failed to load template for category`, Auto-save (line 183) → toast `Auto-save failed`
- **No backend changes** — all AI uses existing `apiClient` calling existing AI Gateway endpoints with form context values as payload
- **Verification**: prisma validate ✅, prisma generate ✅, tsc api 0 errors ✅, tsc web 0 errors ✅, next build 191 routes ✅ (no new routes)

### Done (Phase 16.6H — Enterprise AI Finance & Credit Intelligence)
- **Backend**: `AiFinanceService` with 10 AI methods (credit risk, payment delay, cash flow forecast, collection strategy, financial health, credit limit, invoice intelligence, fraud signals, collection drafts, sidebar) — each calls `AiGatewayService.process()` with `TaskType.FINANCE_ANALYSIS`
- **Controller**: `AiFinanceController` with 10 endpoints under `/finance/ai/*` — credit-risk, payment-delay, cash-flow-forecast, collection-strategy, financial-health, credit-limit, invoice-intelligence, fraud-signals, collection-draft, sidebar
- **10 request DTOs** with class-validator decorators, **auto-seeded** `FINANCE_ANALYSIS` prompt (0.3 temperature, 4096 maxTokens)
- **Fixed OpenRouter provider**: Added `TaskType.FINANCE_ANALYSIS` to `supportedTasks`
- **Module**: `FinanceModule` updated to import `AiGatewayModule`, register `AiFinanceService` + `AiFinanceController`
- **Frontend API**: `lib/api/ai-finance.ts` — 10 typed functions + `AiFinanceResponse<T>` interface
- **React Query hooks**: `hooks/use-ai-finance.ts` — 10 mutation hooks
- **Component**: `AiFinanceCopilot` — 4-tab sidebar (Credit, Cash Flow, Collect., Risk) with per-action callbacks and loading states
- **Integration**:
  - Admin finance dashboard (`/admin/finance`) — Cash Flow Forecast + Fraud Scan AI cards
  - Admin credit page (`/admin/finance/credit`) — Credit Risk Assessment + Financial Health + Credit Limit Recommendation AI cards
  - Admin collections page (`/admin/finance/collections`) — Collection Strategy + Collection Draft AI cards
- **Verification**: tsc api 0 errors ✅, tsc web 0 errors ✅, next build 192 routes ✅

### Done (Phase 16.6I — Enterprise AI Search & Recommendation Engine)
- **Prisma**: Added `SEARCH_ANALYSIS` to `TaskType` enum; registered at 5 credits via OpenRouter with gpt-4o-mini/gemini-2.0-flash models
- **Backend**: `AiSearchService` with 11 AI methods (semantic search, intent detection, similar products, similar suppliers, personalized ranking, buyer recommendations, seller recommendations, search summary, smart filters, cross-sell/upsell, AI sidebar) — each calls `AiGatewayService.process()` with `TaskType.SEARCH_ANALYSIS`
- **Controller**: `AiSearchController` with 11 endpoints under `/search/ai/*` — 8 public (semantic, intent, similar-products, similar-suppliers, summary, smart-filters, cross-sell, sidebar) + 3 JWT-guarded (personalized-ranking, buyer-recommendations, seller-recommendations)
- **11 request DTOs** with class-validator; **auto-seeded** `SEARCH_ANALYSIS` prompt (0.3 temperature, 4096 maxTokens)
- **Module**: `TradfindModule` updated to import `AiGatewayModule`, register `AiSearchService` + `AiSearchController`
- **Frontend API**: `lib/api/ai-search.ts` — 11 typed functions + `AiSearchResponse<T>` interface
- **React Query hooks**: `hooks/use-ai-search.ts` — 11 mutation hooks
- **Component**: `AiSearchCopilot` — 4-tab sidebar (Discover, Similar, Recommend, Rank) with query input, action buttons, loading/result display
- **Integration**: AI Search toggle button + copilot sidebar on `/search` results page
- **Documentation**: `AI-SEARCH-RECOMMENDATION.md` generated
- **Verification**: prisma validate ✅, generate ✅, tsc api 0 errors ✅, tsc web 0 errors ✅, next build 192 routes ✅

### Done (Phase 16.6J — Enterprise AI Admin Intelligence)
- **Prisma**: Added `ADMIN_INTELLIGENCE` to `TaskType` enum; registered at 10 credits via OpenRouter with gpt-4o-mini/gemini-2.0-flash models
- **Backend**: `AiAdminService` with 12 AI methods (morning brief, revenue forecast, user growth prediction, fraud intelligence, churn prediction, category intelligence, geo intelligence, market trends, AI alerts, executive copilot, weekly/monthly reports, decision support) — each calls `AiGatewayService.process()` with `TaskType.ADMIN_INTELLIGENCE`
- **Controller**: `AiAdminController` with 12 endpoints under `/admin/ai/*` — all ADMIN/SUPER_ADMIN guarded
- **12 request DTOs** with class-validator; **auto-seeded** `ADMIN_INTELLIGENCE` prompt (0.3 temperature, 4096 maxTokens)
- **Module**: `AdminIntelligenceModule` (new standalone module) registered in `AppModule`
- **Frontend API**: `lib/api/ai-admin.ts` — 12 typed functions + `AiAdminResponse<T>` interface
- **React Query hooks**: `hooks/use-ai-admin.ts` — 12 mutation hooks
- **Component**: `AiAdminCopilot` — 4-tab sidebar (Brief, Insights, Alerts, Reports) with 12 action buttons, loading/result display
- **Admin Console Page**: Created `/admin/ai-console` with feature cards grid + full copilot workspace
- **Dashboard Integration**: AI Copilot toggle button + Executive Copilot sidebar on `/admin/dashboard`
- **Documentation**: `AI-ADMIN-INTELLIGENCE.md` generated
- **Verification**: prisma validate ✅, generate ✅, tsc api 0 errors ✅, tsc web 0 errors ✅, next build 193 routes ✅ (new: `/admin/ai-console`)

### Done (Phase 16.7 — AI Credits & Membership Integration)
- **Prisma**: Added `AiCreditUsage` model linked to `Company` with `Restrict` onDelete, `@@unique([companyId, periodStart])` for per-month per-company tracking
- **AiCreditsService**: Rewritten with Prisma persistence (in-memory cache replaced), auto-seeds `ai_credits` PlanFeature for all 8 plans on init (TRAD UP=20, Trade Start=50, Trade Smart=100, Trade Plus=250, Trade Pro=500, Trade Premium=1000, Trade Elite=2500), `checkCredits()` returns `{ sufficient, available, required }`, `getCreditBalance()` returns `{ total, used, remaining, planName, periodStart, periodEnd }`, `resetCompanyUsage()` admin override, `getCreditSummary()` with top consumers, `getCompanyCreditDetail()` with monthly history
- **AiGatewayService**: Credit enforcement before AI processing — throws 402 with `{ available, required }` when insufficient credits
- **Admin controller**: Replaced stub `GET /credits/summary`, added `GET /credits/company/:companyId`, `POST /credits/reset/:companyId`
- **Gateway controller**: Added `GET /ai-gateway/credits/balance` for seller/buyer access
- **Frontend API**: `apps/web/lib/api/ai-credits.ts` — 4 typed functions (getMyCreditBalance, getCreditSummary, getCompanyCreditDetail, resetCompanyCredits)
- **Frontend hooks**: `apps/web/hooks/use-ai-credits.ts` — 4 React Query hooks (useMyCreditBalance, useCreditSummary, useCompanyCreditDetail, useResetCompanyCredits)
- **CopilotPanel**: Added `CreditBanner` component showing used/total progress bar with color-coded states (emerald ≥80%, orange 20-80%, red <20%), `AlertTriangle` icon on low credits
- **AI Workspace**: Added credit balance stat card with color-coded remaining/total display
- **Admin page**: Created `/admin/ai-credits` with summary stats cards, top consumers list with search, company credit detail panel with monthly history chart, reset button
- **Verification**: prisma validate ✅, prisma generate ✅, tsc api 0 errors ✅, tsc web 0 errors ✅, next build 192 routes ✅ (new: `/admin/ai-credits`)

### Blocked
- (none)

## Key Decisions
- `Restrict` for critical-chain FK relations (financial, escrow, dispute, compliance)
- `SetNull` for optional/soft-link FK relations (Payment.order, FileScan.company)
- `NoAction` for archival analytics (PlanHistory)
- `Cascade` only for POD/execution records (ManualPaymentProof→Payment, DisputeProcessorExecution→Dispute)
- `normalizeStatus()` centralized in status-badge.tsx
- Canonical role representation is uppercase (`ADMIN`, `SUPER_ADMIN`, `SELLER`, `BUYER`)
- Pagination format: `{ data, meta: { total, page, limit, totalPages, hasNext, hasPrevious } }`
- Global ValidationPipe error: `{ statusCode: 400, message: string[], error: "Validation Error", timestamp }`
- `findQuotes` in SmartRfqService uses Prisma directly (not QuoteService) to avoid circular module deps
- Seller controllers use typed DTOs (no more `@Body() body: any`)
- `/smart-rfq/:id/quotes` shortcut instead of `companies/:companyId/rfq/:rfqId/quotes` to avoid company ID resolution on frontend
- **Single AI Workspace page, not 5 separate pages**: Dashboard, catalog quality, bulk processing all consolidated into one page with cards/tables
- **CopilotPanel as reusable component**: Embedded in product edit page sidebar, wired to existing use-ai hooks
- **No AI credits enforcement in this phase**: Membership system has no credit fields yet; CopilotPanel shows placeholder UI, no hardcoded limits
- **Mixed pattern**: Product edit page uses raw axios for form, CopilotPanel uses React Query hooks alongside it
- **SuggestionCard shows preview before accept**: Accept calls acceptSuggestion mutation, Edit allows JSON override before applying
- **AiNegotiationService lives inside Smart Negotiation module** — no new module, extends existing `smart-negotiation/` directory
- **TaskType.NEGOTIATION already exists** (costs 20 credits via CREDIT_COSTS) — all 12 AI features reuse this existing type with different `action` fields
- **AI suggestions are ephemeral** — no new Prisma model; all suggestions generated on-demand via AI Gateway
- **Seller + Buyer pages both get identical copilot integration** — component auto-detects role and shows relevant buttons
- **Wizard AI uses inline buttons per step, not sidebar** — the wizard has no productId until creation, so AI actions fill form fields directly instead of using accept/reject pattern
- **Single TaskType for multi-action AI modules** — CRM_ANALYSIS (12 actions), FINANCE_ANALYSIS (10 actions), SEARCH_ANALYSIS (11 actions) all use one TaskType with different `action` fields in payload
- **AI modules extend existing domain modules** — AiFinanceService/Controller inside FinanceModule, AiSearchService/Controller inside TradfindModule, never standalone AI modules
- **Search AI is insight-only** — never modifies search results or ranking algorithm directly; provides re-ranking criteria/enrichment for frontend to apply
- **Cost structure**: FINANCE_ANALYSIS = 10 credits (complex analysis), SEARCH_ANALYSIS = 5 credits (lightweight text generation)

## Next Steps
1. **Wire SMS Gateway** — Install Twilio SDK, implement OTP delivery
2. **Wire remaining mock pages** — seller quote detail, saved suppliers
3. **Fix WebSocket CORS** — Replace wildcard with explicit origins
4. **Implement OAuth Strategies** — Google/LinkedIn login
5. **AI credits integration with membership** — Wire AI credits to membership plan features
6. **Deploy to staging** — Run production-equivalent smoke tests

## Relevant Files
- `TRADINGO-SECURITY-CERTIFICATION.md`: 14-category security audit
- `TRADINGO-INFRASTRUCTURE-CERTIFICATION.md`: 13-category infrastructure audit
- `TRADINGO-GO-LIVE-APPROVAL.md`: Go-Live decision with remediation path
- `TRADINGO-v1.0-PRODUCTION-CERTIFICATE.md`: 14-domain production certificate
- `TRADINGO-BLOCKER-REMEDIATION.md`: Production blocker remediation report
- `GOCASH-PRODUCTION-AUDIT.md`: Database/security/code quality audit for GOCASH
- `GOCASH-UAT-REPORT.md`: 140 test cases, 100% pass
- `GOCASH-CERTIFICATION.md`: 5-module GOCASH v1.0 certification
- `KNOWLEDGE.md`: Full platform architecture, patterns, troubleshooting guide
- `TRADINGO_BUYER_AUDIT.md`: Full buyer marketplace audit findings
- `TRADINGO-STABILIZATION-SPRINT-2-FINAL.md`: Sprint 2A details with code
- `TRADINGO-PRODUCTION-AUDIT-UPDATE.md`: Sprint 1→2 comparison
- `AI-NEGOTIATION-COPILOT.md`: AI Negotiation Copilot architecture (Phase 16.6F)
- `apps/api/src/modules/smart-negotiation/ai-negotiation.service.ts`: 12-method AI service calling AI Gateway with TaskType.NEGOTIATION
- `apps/api/src/modules/smart-negotiation/ai-negotiation.controller.ts`: 12 endpoints under `/smart-negotiation/:id/ai/:action`
- `apps/api/src/modules/smart-negotiation/dto/ai-negotiation.dto.ts`: 12 request DTOs with class-validator
- `apps/api/src/modules/smart-negotiation/smart-negotiation.module.ts`: Updated — imports AiGatewayModule + QuoteModule + TradTrustModule
- `apps/api/src/modules/quote/quote.module.ts`: Updated — exports AiQuoteService
- `apps/web/lib/api/ai-negotiation.ts`: 12 typed frontend API functions
- `apps/web/hooks/use-ai-negotiation.ts`: 12 React Query hooks
- `apps/web/components/negotiation/ai-negotiation-copilot.tsx`: Reusable component with 5 tabs
- `apps/web/app/seller/negotiation/[id]/page.tsx`: Modified — AI Copilot toggle + sidebar + result panel
- `apps/web/app/buyer/negotiation/[id]/page.tsx`: Modified — AI Copilot toggle + sidebar + result panel
- `apps/api/src/modules/smart-rfq/smart-rfq.controller.ts`: `@Get(':id')`, `@Patch(':id')`, `@Get(':id/quotes')`, `@Post(':rfqId/accept-quote/:quoteId')`, `@Post(':rfqId/reject-quote/:quoteId')`
- `apps/api/src/modules/smart-rfq/smart-rfq.service.ts`: `findById()`, `updateRfq()`, `findQuotes()`, `acceptQuote()`, `rejectQuote()`
- `apps/web/lib/api/smart-rfq.ts`: `update()`, `getQuotes()`, `acceptQuote()`, `rejectQuote()` methods
- `apps/web/app/buyer/compare-quotes/page.tsx`: Accept button wired (FIXED Phase 14B)
- `apps/web/app/seller/dashboard/page.tsx`: API-driven (FIXED Sprint 2B)
- `apps/web/app/seller/profile/page.tsx`: API-driven (FIXED Sprint 2B)
- `apps/api/src/modules/companies/companies.controller.ts`: `GET /companies/my-company` (FIXED Sprint 2B)
- `apps/web/components/wallet/wallet-transaction-filters.tsx`: Reusable transaction filter bar
- `apps/web/components/wallet/wallet-timeline.tsx`: Reusable reward timeline component
- `apps/web/components/wallet/wallet-analytics-bar.tsx`: Reusable distribution bar component
- `apps/web/app/buyer/gocash/page.tsx`: Premium buyer wallet dashboard (ENHANCED Phase 15A.8)
- `apps/web/app/seller/gocash/page.tsx`: Premium seller wallet dashboard (ENHANCED Phase 15A.8)
- `apps/web/app/admin/wallets/page.tsx`: Premium admin wallet console (ENHANCED Phase 15A.8)
- `apps/web/app/admin/wallets/[id]/page.tsx`: Premium admin wallet detail (ENHANCED Phase 15A.8)
- `GOCASH-WALLET-UX.md`: Premium wallet UX documentation
- `apps/api/src/modules/gocash-integration/gocash-integration.service.ts`: Reward rules engine with milestone detection
- `apps/api/src/modules/gocash-integration/gocash-integration.controller.ts`: 10 integration endpoints
- `apps/api/src/modules/gocash-integration/constants.ts`: Reward amount constants
- `apps/web/lib/api/gocash-integration.ts`: 10 typed frontend API functions
- `apps/web/hooks/use-gocash-integration.ts`: 10 React Query hooks for integration rewards
- `apps/api/src/modules/user-verification/`: 5-endpoint buyer verification module (controller, service, DTOs)
- `apps/api/src/modules/reputation/`: Collect-only reputation event system (controller, service)
- `apps/web/lib/api/user-verification.ts`: Typed API client for user verification + reputation
- `apps/web/hooks/use-user-verification.ts`: 7 React Query hooks for verification + reputation
- `apps/web/app/admin/user-verification/page.tsx`: Admin user verification review queue
- `TRADGO-BUYER-VERIFICATION.md`: Buyer verification architecture documentation
- `TRADGO-REPUTATION-FOUNDATION.md`: Reputation event system documentation
- `ENTERPRISE-ADVERTISING-PLATFORM.md`: Enterprise Advertising Platform documentation
- `apps/api/src/modules/advertising/`: Advertising module (service, controllers, DTOs)
- `apps/web/lib/api/advertising.ts`: 22 typed advertising API functions
- `apps/web/hooks/use-advertising.ts`: 20 React Query hooks for advertising
- `apps/web/app/seller/advertising/page.tsx`: Seller advertising dashboard
- `apps/web/app/seller/advertising/new/page.tsx`: Create advertising campaign
- `apps/web/app/seller/advertising/[id]/page.tsx`: Seller campaign detail
- `apps/web/app/admin/advertising/page.tsx`: Admin advertising dashboard
- `apps/web/app/admin/advertising/[id]/page.tsx`: Admin campaign detail
- `apps/web/app/seller/products/new/wizard.tsx`: NewProductWizard — AI integrated into all 7 steps (Phase 16.6G)
- `apps/web/components/ai/wizard-copilot.tsx`: WizardCopilot component + useWizardAi hook for per-step AI actions
- `apps/web/components/ai/copilot-panel.tsx`: CopilotPanel component with CreditBanner (Phase 16.7)
- `apps/web/hooks/use-ai.ts`: 17 AI hooks (useGenerateDescription, useGenerateSeo, useTranslateProduct, etc.)
- `apps/web/lib/api/ai.ts`: 14 API functions for AI features
- `apps/api/src/modules/ai-gateway/ai-credits.service.ts`: Enhanced with Prisma persistence, checkCredits, getCreditBalance (Phase 16.7)
- `apps/api/src/modules/ai-gateway/ai-gateway.service.ts`: Credit enforcement before AI processing — throws 402 (Phase 16.7)
- `apps/api/src/modules/ai-gateway/ai-gateway.controller.ts`: Added GET /ai-gateway/credits/balance (Phase 16.7)
- `apps/api/src/modules/ai-gateway/admin-ai-gateway.controller.ts`: Real credit summary, company detail, reset endpoints (Phase 16.7)
- `apps/web/lib/api/ai-credits.ts`: 4 typed function API for credits
- `apps/web/hooks/use-ai-credits.ts`: 4 React Query hooks for credit balance, summary, detail, reset
- `apps/web/app/admin/ai-credits/page.tsx`: Admin AI credit management console
- `AI-FINANCE-CREDIT-INTELLIGENCE.md`: AI Finance & Credit Intelligence documentation (Phase 16.6H)
- `AI-SEARCH-RECOMMENDATION.md`: AI Search & Recommendation Engine documentation (Phase 16.6I)
- `apps/api/src/modules/finance/ai-finance.service.ts`: 10-method AI finance service calling AI Gateway with TaskType.FINANCE_ANALYSIS
- `apps/api/src/modules/finance/ai-finance.controller.ts`: 10 endpoints under `/finance/ai/*`
- `apps/web/lib/api/ai-finance.ts`: 10 typed finance AI API functions
- `apps/web/hooks/use-ai-finance.ts`: 10 React Query hooks for finance AI
- `apps/web/components/finance/ai-finance-copilot.tsx`: 4-tab AI finance sidebar component
- `apps/web/app/admin/finance/page.tsx`: Updated with AI Finance Insights
- `apps/web/app/admin/finance/credit/page.tsx`: Updated with AI Credit Intelligence
- `apps/web/app/admin/finance/collections/page.tsx`: Updated with AI Collection Intelligence
- `apps/api/src/modules/tradfind/ai-search.service.ts`: 11-method AI search service calling AI Gateway with TaskType.SEARCH_ANALYSIS
- `apps/api/src/modules/tradfind/ai-search.controller.ts`: 11 endpoints under `/search/ai/*`
- `apps/api/src/modules/tradfind/dto/ai-search.dto.ts`: 11 request DTOs with class-validator
- `apps/web/lib/api/ai-search.ts`: 11 typed search AI API functions
- `apps/web/hooks/use-ai-search.ts`: 11 React Query hooks for search AI
- `apps/web/components/search/ai-search-copilot.tsx`: 4-tab AI search sidebar component
- `apps/web/app/search/search-content.tsx`: Modified — AI Search toggle + copilot sidebar
- `AI-ADMIN-INTELLIGENCE.md`: AI Admin Intelligence documentation (Phase 16.6J)
- `apps/api/src/modules/admin-intelligence/ai-admin.service.ts`: 12-method AI admin service calling AI Gateway with TaskType.ADMIN_INTELLIGENCE
- `apps/api/src/modules/admin-intelligence/ai-admin.controller.ts`: 12 endpoints under `/admin/ai/*`
- `apps/api/src/modules/admin-intelligence/dto/ai-admin.dto.ts`: 12 request DTOs with class-validator
- `apps/api/src/modules/admin-intelligence/admin-intelligence.module.ts`: Standalone module importing AiGatewayModule
- `apps/web/lib/api/ai-admin.ts`: 12 typed admin AI API functions
- `apps/web/hooks/use-ai-admin.ts`: 12 React Query hooks for admin AI
- `apps/web/components/admin/ai-admin-copilot.tsx`: 4-tab AI admin intelligence sidebar component
- `apps/web/app/admin/ai-console/page.tsx`: Full AI admin intelligence console
- `apps/web/app/admin/dashboard/page.tsx`: Modified — AI Copilot toggle + Executive Copilot sidebar
