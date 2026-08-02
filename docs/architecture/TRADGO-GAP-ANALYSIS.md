# TRADGO™ Trust & Reputation Engine — Gap Analysis

> **Phase:** 15B.0 — Audit Only
> **Date:** June 30, 2026
> **Scope:** 30-domain audit of existing TRADINGO codebase for TRADGO™ implementation planning

---

## 1. Executive Summary

| Category | Count |
|----------|-------|
| Existing — Complete/Production | 11 |
| Existing — Needs Enhancement | 9 |
| Missing — Not Implemented | 10 |
| **Total Items Audited** | **30** |

**Key finding:** The codebase has strong foundations for verification (Company Verification), ratings/reviews, trust scoring (TradTrust), analytics (ClickHouse pipeline), and GOCASH rewards. However, 10 domains are entirely absent, and 9 existing domains need significant enhancement or bug fixing before TRADGO can be built.

---

## 2. Item-by-Item Audit

### 2.1 Seller Verification
| Question | Answer |
|----------|--------|
| Existing? | **Partial** — No dedicated seller verification. Sellers inherit verification through Company Verification (`verificationLevel !== 'LEVEL_0'`). |
| Files | `prisma/schema.prisma:1052`, `companies.service.ts:235`, `tradtrust.service.ts:46`, 14+ services |
| Services | 14+ services compute `isVerified` as `verificationLevel !== 'LEVEL_0'` manually |
| Controllers | None — no seller-specific verification endpoints |
| Database | `VerificationLevel` enum (LEVEL_0–LEVEL_6), `Company.verificationLevel`, `Company.status.VERIFIED` (unused) |
| Frontend | `SellerBadge.tsx:46`, 7+ inline badges — no reusable `<VerifiedBadge>` component |
| Reusable? | Partially — convention used consistently but not abstracted |
| Needs Enhancement? | Yes — Add `isSellerVerified` helper, seller-specific endpoint, centralize logic |

### 2.2 Buyer Verification
| Question | Answer |
|----------|--------|
| Existing? | **No** — Zero implementation exists |
| Files | None |
| Services | None |
| Controllers | None |
| Database | No `isBuyerVerified` field, no buyer verification model, no buyer KYC status |
| Frontend | None — marketing claims false for buyers |
| Reusable? | N/A |
| Missing? | **Yes — Buyer identity verification required** |

### 2.3 Company Verification
| Question | Answer |
|----------|--------|
| Existing? | **Yes** — Fully built and tested |
| Files | `prisma/schema.prisma:1217-1252`, `apps/api/src/modules/company-verification/` (module, controller, service, DTOs, tests) |
| Services | `CompanyVerificationService` (222 lines) — submit, review, findByCompany, findById, findAll, maskSensitiveFields |
| Controllers | `CompanyVerificationController` — 5 endpoints (POST submit, GET list, GET by company, GET by ID, POST review) |
| Database | `CompanyVerification`, `CompanyVerificationDocument`, `VerificationStatus` (PENDING/APPROVED/REJECTED), `DocumentType` |
| Frontend | Admin KYC page (broken route), Admin Verification page (fully mocked) |
| Reusable? | Yes — Full module with test coverage |
| Needs Enhancement? | Yes — Fix frontend route mismatch, remove duplicate `/admin/verification` page |

### 2.4 KYC
| Question | Answer |
|----------|--------|
| Existing? | **Partial/Broken** — Embedded in Company Verification and Onboarding |
| Files | `onboarding.service.ts`, `notification.template.service.ts:93-100`, `prisma/schema.prisma:307` (GOCASH_Wallet.kycVerified) |
| Services | `CompanyVerificationService` (KYC workflow), `OnboardingService` (KYC_STARTED/KYC_COMPLETED) |
| Controllers | None — no `@Controller('kyc')` exists |
| Database | KYC fields, `kycVerified`, `KYC_APPROVED/REJECTED/PENDING/EXPIRED` notification types |
| Frontend | Admin KYC page (broken — calls /kyc), admin verification page (fully mocked) |
| Reusable? | Partially — schema/backend solid, frontend-backend route broken |
| Needs Enhancement? | Yes (Critical) — Create /kyc alias or fix frontend to call /company-verifications |

### 2.5 Ratings
| Question | Answer |
|----------|--------|
| Existing? | **Yes (product only)** — Full ratings for products, aggregated for companies |
| Files | `prisma/schema.prisma:4059`, `reviews.service.ts`, `reviews-section.tsx`, `lib/api/products.ts:39-55` |
| Services | `ReviewsService` — CRUD + stats (avg, distribution) |
| Controllers | 3 product endpoints + 1 company endpoint |
| Database | `ProductReview.rating` (Int, 1-5), indexed |
| Frontend | `ReviewsSection` — star display, interactive, breakdown bars, pagination, write modal, helpful button, empty state |
| Reusable? | Yes — component/service pattern reusable for seller/buyer ratings |
| Needs Enhancement? | Yes — Add buyer-to-seller rating, seller-to-buyer rating, wire seller reviews page |

### 2.6 Reviews
| Question | Answer |
|----------|--------|
| Existing? | **Yes (product only)** — Full system with moderation |
| Files | `prisma/schema.prisma:4048-4074` (ProductReview + ReviewStatus), `reviews.service.ts`, `apps/web/app/seller/reviews/page.tsx` (fully mocked) |
| Services | `ReviewsService` — createReview (PENDING), getReviews (APPROVED), markHelpful, getReviewStats |
| Controllers | 5 endpoints (GET, POST, POST helpful, GET stats, GET company reviews) |
| Database | `ProductReview` with PENDING/APPROVED/REJECTED, `isVerifiedPurchase`, `helpfulCount` |
| Frontend | ReviewsSection (full), seller reviews page (100% mock — 3 hardcoded reviews) |
| Reusable? | Yes — full pattern for product reviews |
| Needs Enhancement? | Yes — Wire seller reviews, add admin moderation UI, add review reply, auto-compute isVerifiedPurchase |

### 2.7 Trust Score
| Question | Answer |
|----------|--------|
| Existing? | **Yes** — Production-grade 6-factor trust scoring engine |
| Files | `tradtrust.service.ts` (205 lines), `prisma/schema.prisma:1254-1266` (TradTrustScore), `prisma/schema.prisma:1051` (Company.trustScore), 10+ frontend components |
| Services | `TradTrustService` — calculateScore (verification 30%, profile 25%, age 15%, status 10%, certs 10%, onboarding 10%), recalculateByCompany, recalculateAll |
| Controllers | None — no TradTrustController exists |
| Database | `TradTrustScore` (historical factors JSON), `Company.trustScore`, `Product.trustScoreSnapshot`, 5 other models |
| Frontend | 10+ components (SellerBadge trust bar, CompanyCard, product cards, discovery cards, near-me), 9+ pages |
| Reusable? | Yes — modular, widely distributed |
| Needs Enhancement? | Yes — Add controller, admin override UI, history visualization, breakdown page, auto-recalculation |

### 2.8 Reputation Score
| Question | Answer |
|----------|--------|
| Existing? | **No** — Entirely absent |
| Files | None |
| Services | None |
| Controllers | None |
| Database | No ReputationScore model, no reputationLevel/tier fields anywhere |
| Frontend | Text mentions only (tradhexa-engines.ts:197) |
| Reusable? | N/A |
| Missing? | **Yes — Full engine required** |

### 2.9 Search Ranking
| Question | Answer |
|----------|--------|
| Existing? | **Yes** — Weighted scoring engine with 5 factors |
| Files | `search-ranking.service.ts:31-77`, `search.enums.ts`, `FilterSidebar.tsx:22-29` |
| Services | `SearchRankingService` — calculateScore (relevance 40%, distance 25%, trust 20%, verification 10%, freshness 5%) |
| Controllers | Used by ProductSearchService, CompanySearchService |
| Database | `SearchSort` enum, `SEARCH_RANKING_*_WEIGHT` constants |
| Frontend | FilterSidebar sort options (partial overlap with backend enum) |
| Reusable? | Yes — injectable, configurable weights |
| Needs Enhancement? | Yes — Wire for post-search re-ranking, align frontend/backend sort options |

### 2.10 Product Ranking
| Question | Answer |
|----------|--------|
| Existing? | **Yes (backend only)** — BestsellerService + 5 endpoints + 3 snapshot models |
| Files | `bestseller.service.ts` (577 lines), `products.controller.ts:82-110`, `prisma/schema.prisma:4434-4509` |
| Services | `BestsellerService` — calculateWeeklySnapshots, getBestsellers, getTrending, getTopCategories, getTopSellers, getNearMeTop |
| Controllers | 5 public GET endpoints |
| Database | `ProductBestsellerSnapshot`, `CategoryBestsellerSnapshot`, `SellerBestsellerSnapshot` |
| Frontend | None — zero frontend hooks, APIs, or pages |
| Reusable? | Yes — backend complete |
| Needs Enhancement? | Yes — Create frontend API/hooks/pages for all 5 endpoints |

### 2.11 Company Ranking
| Question | Answer |
|----------|--------|
| Existing? | **Yes (backend only)** — BestsellerService.getTopSellers + AnalyticsService ClickHouse leaderboard |
| Files | `bestseller.service.ts:409-431`, `analytics.service.ts:90-122`, `analytics.controller.ts:44-60` |
| Services | `BestsellerService.getTopSellers`, `AnalyticsService.getSellerLeaderboard`, `AnalyticsService.getSellerLeaderboardPosition` |
| Controllers | 3 endpoints (GET sellers/top, GET leaderboard, GET seller/leaderboard) |
| Database | `SellerBestsellerSnapshot`, ClickHouse `tradingo.leaderboard_metrics` |
| Frontend | None |
| Reusable? | Yes — backend complete |
| Needs Enhancement? | Yes — Create frontend ranking pages |

### 2.12 Seller Badges
| Question | Answer |
|----------|--------|
| Existing? | **Yes** — Computation + UI component + endpoint |
| Files | `tradgo.service.ts:31-61` (6 badges), `SellerBadge.tsx` (215 lines, 8 consumers), `seller/tradgo/page.tsx`, `lib/api/tradgo.ts`, `hooks/use-tradgo.ts` |
| Services | `TradgoService.getBadges` — Verified Seller, Trusted Partner, Catalog Builder, Bulk Supplier, High Trust, Veteran |
| Controllers | `TradgoController` — `GET /tradgo/badges` |
| Database | Computed from Company fields (no dedicated Badge model) |
| Frontend | SellerBadge component (8 consumers), seller TRADGO page badge grid |
| Reusable? | Yes |
| Needs Enhancement? | Yes — Add Prisma Badge model, plan-tied assignment, fix `isTradgoElite` `any` cast |

### 2.13 Buyer Badges
| Question | Answer |
|----------|--------|
| Existing? | **No** — Entirely absent |
| Files | None |
| Services | None |
| Controllers | None |
| Database | None |
| Frontend | None |
| Reusable? | N/A |
| Missing? | **Yes — Full buyer badge system required** |

### 2.14 Verification Badges
| Question | Answer |
|----------|--------|
| Existing? | **Partial** — Ad-hoc inline in 7+ components |
| Files | `SellerBadge.tsx:119-127`, `product-card.tsx:276`, `UnifiedCard.tsx:107`, `ProductCard.tsx:215`, `CompanyProfileClient.tsx:142-146` |
| Services | `TradgoService.getBadges` includes Verified Seller |
| Controllers | None specifically |
| Database | No `VerifiedBadge` model |
| Frontend | 7+ components with inline `<BadgeCheck/>` + Verified text |
| Reusable? | No — duplicated styling |
| Needs Enhancement? | Yes — Create reusable `<VerifiedBadge>` component |

### 2.15 RFQ Quality Metrics
| Question | Answer |
|----------|--------|
| Existing? | **Partial** — Schema complete, event tracking exists, no quality scoring service |
| Files | `prisma/schema.prisma:2008-2028` (RfqAnalytics), `prisma/schema.prisma:2030-2044` (RfqAnalyticsEvent), `rfq-analytics.service.ts` (29 lines), `tradmatch.service.ts:122-139` |
| Services | `RfqAnalyticsService` (event tracking only), `TradMatchService.calculateScore` (vendor matching) |
| Controllers | None for quality metrics |
| Database | RfqAnalytics (8 fields) — no service populates them |
| Frontend | None |
| Reusable? | Partially |
| Needs Enhancement? | Yes — Create quality scoring service populating RfqAnalytics |

### 2.16 Quote Performance
| Question | Answer |
|----------|--------|
| Existing? | **Partial** — Ranking engine exists, conversion computed, admin page mocked |
| Files | `quote.service.ts:12-18,470-489` (ranking), `seller-analytics.service.ts:88` (conversion), `analytics.service.ts:42` (CH), `admin/quote/page.tsx:11` (mock) |
| Services | `QuoteService` (5-factor ranking), `SellerAnalyticsService` (conversion), `AnalyticsService` (CH conversion) |
| Controllers | Product analytics controller, analytics controller |
| Database | `QuoteEvent` model, `RfqAnalytics.quoteConversionRate` |
| Frontend | Admin quote page (100% mock — totalQuotes, submitted, accepted, rejected, expired, avgAmount, conversionRate all hardcoded) |
| Reusable? | Yes — ranking + conversion are production-ready |
| Needs Enhancement? | Yes — Wire admin quote page, add quote performance dashboard |

### 2.17 Negotiation Metrics
| Question | Answer |
|----------|--------|
| Existing? | **No** — Entirely absent |
| Files | None — Negotiation model exists in Prisma but no analytics/metrics layer |
| Services | None |
| Controllers | None |
| Database | Negotiation model (no analytics fields) |
| Frontend | None |
| Reusable? | N/A |
| Missing? | **Yes — Full negotiation metrics required** |

### 2.18 Order Performance
| Question | Answer |
|----------|--------|
| Existing? | **Partial** — OrderAnalyticsService exists with core metrics |
| Files | `order-analytics.service.ts:24-53` (getOrderMetrics), `analytics.service.ts:63-83` (admin dash), `analytics.service.ts:17-57` (seller dash) |
| Services | `OrderAnalyticsService.getOrderMetrics` — totalOrders, completed, cancelled, returned, revenue, AOV, repeatOrders, cancellationRate, returnRate |
| Controllers | Order controller, analytics controller |
| Database | Order model + ClickHouse order_analytics_events |
| Frontend | Basic seller dashboard stats |
| Reusable? | Yes |
| Needs Enhancement? | Yes — Add aggregated order performance dashboard |

### 2.19 Shipment Performance
| Question | Answer |
|----------|--------|
| Existing? | **Minimal** — Rich data model, no metrics service |
| Files | `prisma/schema.prisma:4997-5054` (Shipment), `prisma/schema.prisma:5075-5091` (TimelineEvent) |
| Services | None |
| Controllers | `AdminShipmentController GET admin/analytics` (basic counts: totalShipments, byStatus, byCourier, delayedShipments) |
| Database | Shipment (dispatchDate, estimatedDeliveryDate, deliveredAt), TimelineEvent |
| Frontend | None for performance metrics |
| Reusable? | Partially — data model supports it |
| Needs Enhancement? | Yes — Create shipment performance service (on-time rate, avg duration, status distribution) |

### 2.20 Delivery Performance
| Question | Answer |
|----------|--------|
| Existing? | **Minimal** — Rich data model, no metrics service |
| Files | `prisma/schema.prisma:5123-5168` (Delivery), `prisma/schema.prisma:5170-5188` (ProofOfDelivery), `prisma/schema.prisma:5190-5204` (TimelineEvent) |
| Services | None |
| Controllers | `AdminDeliveryController GET admin/analytics` (basic) |
| Database | Delivery (deliveredAt, confirmedAt, completedAt), POD (OTP, signature, photo, geo) |
| Frontend | `CompanyProfileClient.tsx:235` — onTimeDelivery (falls back to 99%) |
| Reusable? | Partially — data model comprehensive |
| Needs Enhancement? | Yes — Create delivery performance service (on-time rate, avg delivery time, status analytics) |

### 2.21 Cancellation Metrics
| Question | Answer |
|----------|--------|
| Existing? | **Partial** — Computed in OrderAnalyticsService |
| Files | `order-analytics.service.ts:50-51` |
| Services | `OrderAnalyticsService` — `cancelledOrders/totalOrders * 100` |
| Controllers | None specifically |
| Database | Order.CANCELLED, Order.RETURNED statuses |
| Frontend | None |
| Reusable? | Yes — already computed |
| Needs Enhancement? | Yes — Surface in seller dashboard + company profile |

### 2.22 Dispute Metrics
| Question | Answer |
|----------|--------|
| Existing? | **Partial** — DisputeAnalyticsService exists, 4/7 metrics = 0 |
| Files | `dispute-analytics.service.ts:32-58`, `escrow-analytics.service.ts:24-63`, `analytics.service.ts:196-209` |
| Services | `DisputeAnalyticsService.getDisputeMetrics` (totalDisputes OK, resolvedDisputes OK, openDisputes=0, avgResolutionTime=0, refundRate=0, fraudRate=0, appealRate=0) |
| Controllers | Dispute, escrow, analytics controllers |
| Database | Dispute + DisputeResolution + DisputeAppeal models |
| Frontend | None |
| Reusable? | Partially |
| Needs Enhancement? | Yes — Implement 4 stub metrics |

### 2.23 Complaint Metrics
| Question | Answer |
|----------|--------|
| Existing? | **Minimal** — NPS only in BetaProgram |
| Files | `beta-program.service.ts:210-229` (getFeedbackStats), `prisma/schema.prisma:4192-4214` (Feedback) |
| Services | `BetaProgramService.getFeedbackStats` |
| Controllers | Beta program controller |
| Database | Feedback (type, score, status), UsageEvent, ErrorEvent |
| Frontend | None |
| Reusable? | Partially |
| Needs Enhancement? | Yes — Create complaint-specific metrics (rate, resolution time, category breakdown) |

### 2.24 Response Time
| Question | Answer |
|----------|--------|
| Existing? | **Rich but scattered** — Stored on Company, used in 3 scoring engines, displayed in 10+ frontend components |
| Files | `prisma/schema.prisma:1056` (Company.responseRate), `quote.service.ts:474`, `tradmatch.service.ts:126`, `near-to-far.service.ts:46` |
| Services | None centralized — consumed by QuoteService, TradMatchService, NearToFarService, ProductsService, CompaniesService |
| Controllers | None for response time analytics |
| Database | `Company.responseRate` (Float), `RfqAnalytics.averageResponseTimeHours` (unpopulated) |
| Frontend | SellerBadge + 10 components; ProductDiscoveryClient uses `Math.random()` mock |
| Reusable? | Yes — integrated but not centralized |
| Needs Enhancement? | Yes — Centralize response time analytics, fix mock data, populate averageResponseTimeHours |

### 2.25 Completion Rate
| Question | Answer |
|----------|--------|
| Existing? | **No** — Not computed anywhere |
| Files | None — completedOrders count exists in OrderAnalyticsService but no rate computed |
| Services | None |
| Controllers | None |
| Database | Order.COMPLETED status supports computation |
| Frontend | Text mentions only (tradhexa-engines.ts:226) |
| Reusable? | N/A |
| Missing? | **Yes — Full completion rate metric required** |

### 2.26 Analytics
| Question | Answer |
|----------|--------|
| Existing? | **Yes** — Production-grade analytics infrastructure |
| Files | `apps/api/src/modules/analytics/` (10 endpoints, ClickHouse, event ingestion, queue processor), seller-analytics, buyer-analytics, wallet analytics |
| Services | Core AnalyticsService, SellerAnalyticsService, BuyerAnalyticsService, DisputeAnalyticsService, EscrowAnalyticsService, SettlementAnalyticsService, ChatAnalyticsService |
| Controllers | AnalyticsController (10 endpoints), SellerAnalyticsController (3), BuyerAnalyticsController (3), admin analytics in Order/Shipment/Delivery |
| Database | 6+ Prisma models, ClickHouse (9 event tables, 4+ metrics tables), EventIngestionService (batched/buffered/dead-letter) |
| Frontend | Buyer analytics (working), Seller analytics (wrong endpoints), Admin analytics (hardcoded charts) |
| Reusable? | Yes |
| Needs Enhancement? | Yes — Fix seller analytics endpoints, replace admin hardcoded charts |

### 2.27 Leaderboards
| Question | Answer |
|----------|--------|
| Existing? | **Yes** — Two leaderboard implementations |
| Files | `tradgo.service.ts:63-82`, `analytics.service.ts:90-122`, `seller/tradgo/page.tsx:84-117`, `hooks/use-tradgo.ts:18-21` |
| Services | `TradgoService.getLeaderboard` (trustScore + totalProducts), `AnalyticsService.getSellerLeaderboard` (CH revenue) |
| Controllers | `GET /tradgo/leaderboard`, `GET /analytics/leaderboard` |
| Database | Company fields + ClickHouse leaderboard_metrics |
| Frontend | Seller TRADGO page (top 3, gold/silver/bronze), public TRADGO page (mock tiers) |
| Reusable? | Yes |
| Needs Enhancement? | Yes — Unify sources, add buyer leaderboard, wire CH to frontend |

### 2.28 Existing AI Scoring
| Question | Answer |
|----------|--------|
| Existing? | **No** — Zero AI/ML in codebase. All scoring = deterministic weighted formulas |
| Files | None — aiScore, ml_score, intelligenceScore do not exist |
| Services | No AIService, MLService, PredictionService |
| Controllers | None |
| Database | No AI-related models/fields |
| Frontend | None |
| Reusable? | N/A — existing scoring can serve as ML baselines |
| Missing? | **Yes — Full AI/ML scoring engine required** |

### 2.29 Existing Fraud Scoring
| Question | Answer |
|----------|--------|
| Existing? | **Partial** — Scattered across referral + wallet + mock frontend |
| Files | `referral.service.ts` (7 detection patterns), `wallet-api.service.ts:332-367` (3 alerts), `admin/fraud-dashboard/page.tsx` (fully mocked) |
| Services | `ReferralService` (self-referral, velocity, blacklist, circular, disposable email), `WalletApiService` (high velocity, high failure, reversals) |
| Controllers | `GET admin/fraud-alerts` (referral + wallet) |
| Database | `ReferralBlacklist`, `ReferralAudit` — no dedicated FraudAlert/FraudScore model |
| Frontend | Admin fraud dashboard (100% mock — 7 hardcoded flaggedItems) |
| Reusable? | Partially — detection patterns reusable but not unified |
| Needs Enhancement? | Yes — Create unified fraud scoring module, wire dashboard to real API |

### 2.30 Existing GOCASH Integrations
| Question | Answer |
|----------|--------|
| Existing? | **Yes** — Certified v1.0, production-grade, frozen |
| Files | `apps/api/src/modules/gocash/` (14 methods), `gocash-integration/` (9 reward types), `wallet-api/` (30+ endpoints), frontend API + hooks |
| Services | `GocashService` (ledger), `GocashIntegrationService` (rewards), `WalletApiService` (wallet ops + analytics) |
| Controllers | 50+ total endpoints across 3 controllers |
| Database | `GOCASH_Wallet`, `GOCASH_Transaction` (append-only), `GOCASH_Redemption`, 9 enums |
| Frontend | Buyer/seller/admin pages (loading/empty/error states), integration API + hooks |
| Reusable? | Yes — fully modular, extensible reward pattern |
| Needs Enhancement? | Yes (Minor) — Fix `/gocash-integration/summary/:userId` URL mismatch |

## 3. Existing Components Found

| # | Component | Type | Status | Key Files |
|---|-----------|------|--------|-----------|
| 1 | Company Verification | Module | Complete | `apps/api/src/modules/company-verification/` (5 endpoints, 222-line service, DTOs, tests) |
| 2 | KYC | Feature | Partial/Broken | `apps/web/lib/api/kyc.ts` (wrong route), `apps/web/app/admin/kyc/page.tsx` |
| 3 | Product Ratings | Service+UI | Complete | `reviews.service.ts`, `ReviewsSection.tsx` (star display, breakdown, write modal) |
| 4 | Product Reviews | Model+Service+UI | Complete | `ProductReview` model, reviews service (5 endpoints), ReviewsSection |
| 5 | Trust Score (TradTrust) | Engine | Complete | `tradtrust.service.ts` (205 lines, 6 factors), `TradTrustScore` model, 10+ components |
| 6 | Search Ranking (TradFind) | Engine | Complete | `search-ranking.service.ts` (5 factors), `SearchSort` enum |
| 7 | Product Ranking (Bestseller) | Service | Complete (backend) | `bestseller.service.ts` (577 lines, 5 endpoints, 3 snapshot models) |
| 8 | Company Ranking | Service | Complete (backend) | `BestsellerService.getTopSellers`, `AnalyticsService` ClickHouse leaderboard |
| 9 | Seller Badges | Service+UI+API | Complete | `tradgo.service.ts` (6 badges), `SellerBadge.tsx`, `GET /tradgo/badges` |
| 10 | Leaderboards | Service+UI | Partial | `tradgo.service.ts`, `AnalyticsService` (CH), seller TRADGO page |
| 11 | OrderAnalyticsService | Service | Complete | `order-analytics.service.ts` (9 metrics) |
| 12 | DisputeAnalyticsService | Service | Partial | `dispute-analytics.service.ts` (4/7 stubs) |
| 13 | Core Analytics | Module | Complete | `apps/api/src/modules/analytics/` (ClickHouse, event ingestion, queue, 10 endpoints) |
| 14 | SellerAnalytics | Module | Complete | `seller-analytics/` (3 endpoints, Prisma + CH) |
| 15 | BuyerAnalytics | Module | Complete | `buyer/buyer-analytics.*` (3 endpoints) |
| 16 | GOCASH Ledger | Module | Frozen v1.0 | `gocash/` (14 methods, 14 endpoints, idempotent ledger) |
| 17 | GOCASH Integration | Module | Frozen v1.0 | `gocash-integration/` (9 reward types, milestones, dual-party) |
| 18 | Wallet API | Module | Frozen v1.0 | `wallet-api/` (30+ endpoints, admin/buyer/seller) |
| 19 | Referral Fraud Detection | Feature | Complete | `referral.service.ts` (7 detection patterns) |
| 20 | Wallet Fraud Alerts | Feature | Complete | `wallet-api.service.ts:332-367` (3 alert types) |
| 21 | Response Time Integration | Cross-cutting | Rich/Scattered | 3 scoring engines, 10+ components, 5 services |
| 22 | Cancellation Metrics | Computed | Partial | `order-analytics.service.ts:50-51` |

## 4. Components Needing Enhancement

| # | Component | Enhancement Required | Priority |
|---|-----------|---------------------|----------|
| 1 | KYC Frontend Route | Create `/kyc` alias or fix `apps/web/lib/api/kyc.ts` to call `/company-verifications` | Critical |
| 2 | Admin KYC Page | Merge `/admin/kyc` (broken) and `/admin/verification` (mocked) into one working page | High |
| 3 | Seller Reviews Page | Wire `/seller/reviews` page to real API (currently 100% mock) | High |
| 4 | Product Ranking Frontend | Create frontend API/hooks/pages for 5 existing bestseller endpoints | High |
| 5 | Company Ranking Frontend | Create frontend consumer for `GET /analytics/leaderboard` and `GET /products/sellers/top` | High |
| 6 | Seller Analytics Page | Fix wrong endpoint URLs (calls non-existent `/seller/analytics/*`) | High |
| 7 | Admin Analytics Charts | Replace hardcoded bar chart data with real API data | High |
| 8 | TradTrust Controller | Expose REST endpoints for trust score recalculation | Medium |
| 9 | DisputeAnalytics Stubs | Implement 4 hardcoded metrics (avgResolutionTime, refundRate, fraudRate, appealRate) | Medium |
| 10 | Admin Quote Page | Wire to real API (currently 100% mock) | Medium |
| 11 | Response Time Analytics | Centralize, fix `Math.random()` mock in ProductDiscoveryClient | Medium |
| 12 | VerifiedBadge Component | Create reusable `<VerifiedBadge>` component, replace 7+ inline implementations | Medium |
| 13 | Leaderboard Unification | Unify TradGo + ClickHouse leaderboard sources, add buyer leaderboard | Medium |
| 14 | Seller Verification Helper | Create `isSellerVerified` helper, centralize `verificationLevel !== 'LEVEL_0'` logic | Low |
| 15 | Seller Badge Model | Add proper Prisma Badge model, fix `isTradgoElite` `any` cast | Low |
| 16 | GOCASH Integration URL | Fix `/gocash-integration/summary/:userId` mismatch | Low |
| 17 | Fraud Dashboard | Wire to real API (currently 100% mock) | Medium |
| 18 | Order Performance Dashboard | Create aggregated order performance view | Medium |
| 19 | SearchRankingService Wiring | Apply post-search re-ranking, align frontend/backend sort options | Medium |
| 20 | OnTimeDelivery Fallback | Fix hardcoded 99% fallback in CompanyProfileClient | Low |
| 21 | BestsellerAnalytics Stubs | Implement tracking methods (currently logs only) | Low |

## 5. Components That Should Be Merged

| # | Components | Merge Rationale |
|---|-----------|----------------|
| 1 | `/admin/kyc` + `/admin/verification` | Both serve KYC review: one is broken, one is mocked. Merge into single page calling `/company-verifications` |
| 2 | TradGo leaderboard + Analytics ClickHouse leaderboard | Two parallel leaderboard systems. Unify under single leaderboard module |
| 3 | Referral Fraud + Wallet Fraud Alerts | Two separate fraud systems. Merge into unified TradTrust fraud scoring module |
| 4 | Product Review Rating + Company Review Rating | Company rating aggregates product reviews. Unify under consolidated ratings service |

## 6. Components That Should Be Removed

| # | Component | Reason |
|---|-----------|--------|
| 1 | `/admin/verification/page.tsx` | Fully mocked duplicate of `/admin/kyc`. Remove after merging |
| 2 | `BestsellerAnalyticsService` | Stub that only logs. Remove or implement real tracking |
| 3 | `Math.random()` in ProductDiscoveryClient.tsx:104,119 | Dead mock response time data |
| 4 | `Company.status.VERIFIED` | Enum value exists but never set by any service |

## 7. Components Genuinely Missing

| # | Component | Est. Complexity |
|---|-----------|-----------------|
| 1 | **Buyer Verification** — Full buyer identity verification (model, service, controller, UI) | High |
| 2 | **Reputation Score Engine** — Multi-factor reputation score (tiers, levels, methodology) | Very High |
| 3 | **Buyer Badges** — Buyer badge system (model, computation, UI component) | Medium |
| 4 | **Negotiation Metrics** — Negotiation performance analytics | Medium |
| 5 | **Shipment Performance Metrics** — On-time rate, avg duration, status distribution | Medium |
| 6 | **Delivery Performance Metrics** — On-time delivery rate, avg delivery time, status analytics | Medium |
| 7 | **Completion Rate Metric** — Completion/fulfillment rate calculation | Low |
| 8 | **RFQ Quality Scoring Service** — Populates RfqAnalytics model with quality metrics | Medium |
| 9 | **AI/ML Scoring Engine** — Supervised ML for predictive scoring/recommendation | Very High |
| 10 | **Unified Fraud Scoring Module** — Consolidate referral + wallet fraud, add new detection | High |
| 11 | **Complaint Metrics Service** — Complaint rate, resolution time, category breakdown | Low |
| 12 | **TradTrust REST Controller** — Expose trust score recalculation as REST endpoints | Low |

## 8. Estimated Implementation Effort

| Category | Effort (person-weeks) | Items |
|----------|----------------------|-------|
| Critical fixes (5 items) | 1-2 weeks | KYC route, admin KYC merge, seller analytics, seller reviews, admin quote |
| Enhancements (21 items) | 6-8 weeks | Ranking frontends, TradTrust controller, dispute stubs, response time, VerifiedBadge, fraud dashboard, etc. |
| New modules (12 items) | 10-14 weeks | Buyer verification, Reputation score, Buyer badges, Metrics, AI/ML, Fraud, Complaint, TradTrust controller |
| **Total** | **17-24 weeks** | **38 items** |

## 9. Recommended Architecture

```
tradgo/                              # TRADGO Trust & Reputation Engine
+-- tradgo.module.ts                  # Module (imports: PrismaModule, GocashModule)
+-- tradgo.controller.ts              # REST endpoints
+-- tradgo.service.ts                 # Core orchestration
+-- tradtrust/
|   +-- tradtrust.service.ts          # EXISTING — enhance with controller + history API
|   +-- tradtrust.controller.ts       # NEW — expose recalculation endpoints
+-- reputation/
|   +-- reputation.service.ts         # NEW — multi-factor reputation score
|   +-- reputation.controller.ts      # NEW
+-- verification/
|   +-- seller-verification.service.ts # NEW — seller-specific verification
|   +-- buyer-verification.service.ts  # NEW — buyer identity verification
|   +-- company-verification/          # EXISTING — reuse as-is
+-- scoring/
|   +-- ai-scoring.service.ts          # NEW — ML-based predictive scoring
|   +-- fraud-scoring.service.ts       # NEW — unified fraud scoring
|   +-- rfq-quality.service.ts         # NEW — RFQ quality scoring
|   +-- performance.service.ts         # NEW — shipment/delivery/completion metrics
+-- badges/
|   +-- badge.service.ts               # NEW — badge assignment with Badge model
|   +-- badge.controller.ts            # NEW
|   +-- badge-definitions.ts           # NEW — badge rules/criteria
+-- rankings/
|   +-- search-ranking.service.ts      # EXISTING — enhance with post-search re-rank
|   +-- product-ranking.service.ts     # EXISTING (BestsellerService) — add frontend
|   +-- company-ranking.service.ts     # EXISTING — add frontend
|   +-- leaderboard.service.ts         # NEW — unified leaderboard
+-- analytics/
|   +-- analytics.service.ts           # EXISTING (Core Analytics)
|   +-- seller-analytics.service.ts    # EXISTING
|   +-- buyer-analytics.service.ts     # EXISTING
|   +-- negotiation-metrics.service.ts # NEW
|   +-- dispute-metrics.service.ts     # EXISTING — fix stubs
|   +-- cancellation.service.ts        # EXISTING (in OrderAnalyticsService)
|   +-- complaint.service.ts          # NEW
+-- dto/                               # DTOs for all endpoints
+-- tradgo-constants.ts                # Weights, thresholds, config
```

## 10. Final Synthesis

### Existing Components (Reuse)
- Company Verification (complete module)
- Product Ratings & Reviews (complete)
- Trust Score engine (TradTrust)
- Search Ranking engine (TradFind)
- Product/Company Ranking backend (BestsellerService)
- Seller Badges (computation + UI)
- Analytics pipeline (ClickHouse, event ingestion, queue)
- GOCASH Rewards (certified v1.0)
- Order Analytics (partial metrics)
- Response Time integration (scattered but working)
- Referral Fraud Detection (7 patterns)
- Wallet Fraud Alerts (3 patterns)

### New Components Required
1. Buyer Verification system
2. Reputation Score engine
3. Buyer Badges system
4. Negotiation Metrics service
5. Shipment Performance service
6. Delivery Performance service
7. Completion Rate metric
8. RFQ Quality Scoring service
9. AI/ML Scoring engine
10. Unified Fraud Scoring module
11. Complaint Metrics service

### Modules to Extend
- TradTrust → add controller + history API
- TradFind SearchRanking → wire post-search re-ranking
- BestsellerService → add frontend API/hooks/pages
- DisputeAnalyticsService → implement 4 stub metrics
- OrderAnalyticsService → surface completion rate
- TradGo Badges → add Prisma Badge model
- Analytics → fix seller endpoints, admin charts
- CompanyVerification → fix KYC frontend route

### Modules to Reuse (As-Is)
- GOCASH Ledger (frozen v1.0) — reward engine for TRADGO incentives
- GOCASH Integration (frozen v1.0) — platform reward events
- Wallet API (frozen v1.0) — wallet operations + analytics
- Event Ingestion Pipeline (frozen) — analytics event tracking
- Core Analytics (frozen) — ClickHouse dashboards

### Duplicate Code Risks
1. **Two admin verification pages** (`/admin/kyc` + `/admin/verification`) — must merge
2. **Two leaderboard sources** (TradGo + ClickHouse) — must unify
3. **Two fraud detection modules** (Referral + Wallet) — must consolidate
4. **Two analytics paths for seller** (SellerAnalyticsService Prisma + AnalyticsService CH) — harmonize
5. **Company ranking dual source** (BestsellerService + AnalyticsService) — single source of truth
6. **7+ inline Verified badges** — must centralize

### Recommended Development Order

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|-------------|
| **15B.1** | Critical fixes: KYC route, admin merge, seller analytics, seller reviews, admin quote | 1-2 weeks | None |
| **15B.2** | Buyer Verification + Reputation Score (new DB models) | 2-3 weeks | 15B.1 |
| **15B.3** | Performance metrics: Negotiation, Shipment, Delivery, Completion, RFQ Quality | 2-3 weeks | None (can parallelize) |
| **15B.4** | Unified Fraud Scoring + Badges (Buyer + VerifiedBadge + Badge model) | 2 weeks | 15B.2 |
| **15B.5** | Rankings frontend + Leaderboard unification + Search ranking wiring | 2 weeks | 15B.3 |
| **15B.6** | TradTrust controller + Dispute stubs + Complaint metrics + Response time centralization | 1-2 weeks | 15B.3 |
| **15B.7** | AI/ML Scoring engine (baseline) | 3-4 weeks | All above for training data |
| **15B.8** | Full integration, testing, certification | 2-3 weeks | All above |

**Total estimated timeline: 15-21 weeks for full TRADGO implementation**
