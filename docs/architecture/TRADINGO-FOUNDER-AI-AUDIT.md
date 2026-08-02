# TRADINGO Founder AI — Platform Audit Report

> **Status**: Pre-implementation — Pending Founder Review
> **Date**: 2026-07-03
> **Scope**: Full platform audit across 16 domains for Executive Intelligence Layer

---

## Audit Summary

| Dimension | Count |
|-----------|-------|
| Backend services audited | **60+** across 16 domains |
| Existing endpoints | **200+** for data/intelligence |
| Existing AI methods | **60+** (Admin Intelligence 12, CRM 12, Finance 10, Search 11, Negotiation 12, RFQ 10, Quote 10) |
| Scoring engines | **3** (TradTrust 0-1000, Marketplace 14-factor, Unified 15-factor) |
| Analytics tables | **9** ClickHouse event tables, **4** query tables |
| Notification channels | **4** (in-app, email, SMS, push) |
| Event bus | **DOES NOT EXIST** (gap identified in Core Architecture Review) |
| Audit logging | **Manual, inconsistent** (gap identified in Core Architecture Review) |
| Frontend admin pages | **50+** routes, **15+** fully built |
| Shared dashboard components | **16** (StatCard, Skeleton, StatusBadge, Breadcrumbs, etc.) |

---

## 1. What Already Exists

### 1.1 AI Gateway (Fully Built — 17 endpoints + 14 admin)

**Reuse: Directly.**
- `AiGatewayService.process()` — single entry point for ALL AI features
- 5 providers (OpenRouter, Gemini, Groq, Tavily, Firecrawl), 14 models
- Credit enforcement (402 on insufficient credits)
- Circuit breaker, fallback chain, caching, usage tracking
- Prompt versioning via `PromptManagerService`
- 17 TaskTypes (ADMIN_INTELLIGENCE costs 10 credits)

### 1.2 Admin Intelligence (Fully Built — 12 methods)

**Reuse: Directly.** Already provides:
- Morning Brief, Revenue Forecast, User Growth Prediction
- Fraud Intelligence, Churn Prediction, Category Intelligence
- Geo Intelligence, Market Trends, AI Alerts
- Executive Copilot, Weekly/Monthly Report, Decision Support
- Auto-seeded prompt with Indian market context (INR, GST, festivals, metro/tier-2/3 cities)

**Gap**: Only Executive Copilot is wired on the admin dashboard. Other 11 features require navigating to `/admin/ai-console`. No auto-trigger (brief on login, evening summary).

### 1.3 CRM (Fully Built — 14 core methods + 12 AI methods)

**Reuse: Data + AI only.** Never modify existing services.
- `CrmLead` model with 8-status pipeline, estimated values, scoring
- 12 AI features (lead scoring, conversion probability, pipeline health, forecast, deal risk, sentiment, etc.)
- **Gap**: No admin CRM page exists — 35 API functions and 27 hooks are defined but unused in any page
- **Gap**: AI CRM hooks are defined (12) but never imported anywhere

### 1.4 Finance (Fully Built — 10 AI methods + credit/collections/dashboard)

**Reuse: Data + AI only.**
- Credit management (limit, risk level, utilization)
- Collections (aging report, overdue companies, notes/timeline)
- Finance dashboard (revenue, receivable, payable, cash flow)
- 10 AI methods (credit risk, payment delay, cash flow forecast, collection strategy, etc.)
- 5 admin pages already built

### 1.5 Marketplace Intelligence (Fully Built — 12 endpoints)

**Reuse: Directly.**
- `MarketplaceIntelligenceService` — 14-factor best supplier scoring (distance, trust, price, reliability)
- `MarketplaceIntelligenceEngine` — 15-factor unified score with A+/A/B+/B/C/D grades
- Near->Far->Best algorithm with progressive radius expansion
- Buyer/seller recommendations, geo-intelligence, business intelligence
- Delivery prediction, relationship scoring

### 1.6 TradTrust (Fully Built — 8 methods)

**Reuse: Directly.** 1000-point scoring engine with 6 profile + 8 behavioral factors - 2 penalties. Grades (A+ through D), risk levels (Low through Critical). Public endpoints for score, breakdown, history.

### 1.7 Location Intelligence (Fully Built — 6 endpoints)

**Reuse: Directly.** Geocoding (Nominatim OSM), nearby search, geo clusters, cache, reverse geocode.

### 1.8 Analytics (Fully Built — 10 endpoints + ClickHouse)

**Reuse: Directly.**
- `getAdminDashboard()` — GMV, total sellers, total buyers, RFQs, orders, disputes, payments, settlements, growth
- `getSellerDashboard()` — Per-seller revenue, orders, RFQs, quotes, conversion
- `getCompletionRate()` — Completion/cancellation/dispute rates
- `getCharts()` — Daily metrics time series
- 9 ClickHouse event tables, 4 query tables

### 1.9 Orders (Fully Built — analytics layer)

**Reuse: Data only.**
- `OrderAnalyticsService.getOrderMetrics()` — Revenue, AOV, repeat orders, cancellation/return rates
- `SmartOrderService.getAdminAnalytics()` — Global totals by status
- `SmartPoService.getAdminOverview()` — PO volume and status
- `SmartShipmentService.getPerformanceMetrics()` — On-time delivery, transit time
- `SmartShipmentService.getAdminAnalytics()` — Courier breakdown, delays
- `SmartDeliveryService.getAdminAnalytics()` — Delivery stats

### 1.10 Payments (Fully Built)

**Reuse: Data only.** Payment model with type/status/amount/gateway/timestamps. Invoice model with GST breakdown. Refund tracking.

### 1.11 Membership (Fully Built)

**Reuse: Data only.**
- `getCurrentSubscription()` — Plan, status, expiry dates
- `getPlanHistory()` — Upgrade/downgrade/cancel history with reasons
- `cancelSubscription()` — Captures churn with reason
- Plan pricing data (6 plans, 3 billing cycles each)

### 1.12 Advertising (Fully Built)

**Reuse: Data + dashboard only.**
- `getAdminDashboard()` — Total/active/pending/paused/expired/complete/rejected counts, total spend/impressions/clicks, by-type breakdown
- `getSellerDashboard()` — Per-seller spend, impressions, clicks, CTR
- `getAnalytics()` — Per-ad ROI, CPC, CTR, conversions

### 1.13 GOCASH Ecosystem (Fully Built)

**Reuse: Data + AI only.**
- `getAdminDashboard()` — Total users, XP, checkins, badges, missions, achievements
- `getAdminXpChart(days)` — XP time series
- `aiRewardIntelligence()` — AI-powered engagement insights
- 35+ XP reasons mapped, 8 level tiers (BRONZE->LEGEND)

### 1.14 Notifications (Fully Built — Global Module)

**Reuse: Directly.** `NotificationService` with `createWithTemplate()` for multi-channel delivery (in-app + email + SMS). 60+ fallback templates.

### 1.15 Event Bus

**DOES NOT EXIST.** This is the #1 critical gap identified in the Core Architecture Review. All cross-module communication is synchronous service injection. No async domain events.

### 1.16 Audit Logging

**MANUAL AND INCONSISTENT.** Some services create AuditLog entries manually, many don't. No centralized pipeline. This is the #2 critical gap.

---

## 2. What Can Be Reused (Directly)

| Asset | Source | Use in Founder AI |
|-------|--------|-------------------|
| `AiGatewayService.process()` | ai-gateway.service.ts | All AI features (briefs, recommendations, copilot) |
| `AiAdminService.morningBrief()` | admin-intelligence | Morning Executive Brief feature |
| `AiAdminService.revenueForecast()` | admin-intelligence | Revenue Intelligence |
| `AiAdminService.executiveCopilot()` | admin-intelligence | Founder Copilot feature |
| `AiAdminService.fraudIntelligence()` | admin-intelligence | Risk Intelligence |
| `AiAdminService.churnPrediction()` | admin-intelligence | Customer Churn insights |
| `AiAdminService.categoryIntelligence()` | admin-intelligence | Growth Intelligence |
| `AiAdminService.geoIntelligence()` | admin-intelligence | Growth Intelligence |
| `AiAdminService.marketTrends()` | admin-intelligence | Market Intelligence |
| `AiAdminService.aiAlerts()` | admin-intelligence | Critical Alerts |
| `AiAdminService.decisionSupport()` | admin-intelligence | AI Decision Center |
| `AnalyticsService.getAdminDashboard()` | analytics | Revenue, Orders, GMV data |
| `AnalyticsService.getCompletionRate()` | analytics | Operational metrics |
| `SmartOrderService.getAdminAnalytics()` | smart-order | Order intelligence |
| `AdvertisingService.getAdminDashboard()` | advertising | Advertising performance |
| `GocashEcosystemService.getAdminDashboard()` | ecosystem | Engagement metrics |
| `GocashEcosystemService.getAdminXpChart()` | ecosystem | XP trends |
| `MarketplaceIntelligenceEngine.getMarketplaceRankings()` | marketplace-intelligence | Top categories/cities/industries |
| `MarketplaceIntelligenceEngine.getGeoIntelligence()` | marketplace-intelligence | Geo distribution |
| `SmartShipmentService.getAdminAnalytics()` | smart-shipment | Delivery risk |
| `FinanceDashboardService.getDashboard()` | finance | Cash flow, revenue, collections |
| `CollectionsService.getAgingReport()` | finance | Collection risk |
| `CreditService.listCredits()` | finance | Credit risk |
| `NotificationService.createWithTemplate()` | notification | Alerts delivery |
| `AiAdminCopilot` component | frontend components | Reusable copilot panel |
| `StatCard`, `DashboardPageHeader`, `DashboardSkeleton` | frontend components | Dashboard layout |
| All 12 `use-ai-admin` hooks | frontend hooks | Direct API integration |
| `adminNavSections` | sidebar | Add Founder AI nav link |

---

## 3. What Should Be Extended

| Component | Extension | For Founder AI |
|-----------|-----------|----------------|
| `AiAdminService.morningBrief()` | Add real-time data enrichment | Wire to AnalyticsService + OrderService + PaymentService for current-day data |
| `AiAdminService.executiveCopilot()` | Add all 10 executive intents | Focus area routing for natural language queries |
| `AiAdminCopilot` component | New dedicated page | Replace copilot panel with full dashboard layout |
| `DashboardPageHeader` | No extension needed | Use as-is for /admin/founder-ai |
| `StatCard` | No extension needed | Use as-is with platform-specific icons |
| `DASHBOARD_ADMIN_NAV` | Add "Founder AI" link | Add with Sparkles icon to admin sidebar |
| `Breadcrumbs labelMap` | Add "founder-ai" mapping | Route label for navigation |
| `adminNavSections` | Add Intelligence section link | Add to System or new Intelligence group |

---

## 4. What Must NOT Be Changed

| Module | Reason |
|--------|--------|
| `PrismaModule` | Global — all data access depends on stability |
| `RedisModule` | Global — caching, rate limiting |
| `GocashModule` | GOCASH v1.0 CERTIFIED — append-only ledger |
| `WalletApiModule` | Financial operations — production wrapper |
| `GocashIntegrationModule` | Idempotent reward processing |
| `ReferralModule` | Fraud detection + rewards |
| `CampaignModule` | Budget engine + claims |
| `AuthModule` | Security-critical — 24 endpoints |
| `PaymentModule` | 2 gateways — financial transactions |
| `NotificationModule` | Global — all notification delivery |
| `SmsModule` | Global — OTP delivery |
| `TradTrustModule` | Scoring engine — 6 dimensions |
| `CompanyVerificationModule` | KYC workflow |
| `UserVerificationModule` | Buyer verification |
| `ReputationModule` | Append-only event log |
| Any Prisma model | Schema must not change for Founder AI data needs (use house table or API aggregation) |

---

## 5. Gap Analysis: Founder AI Features vs Existing Capabilities

### Feature 1: Morning Executive Brief
| Requirement | Status | Source |
|------------|--------|--------|
| Revenue today | EXISTS | AnalyticsService.getAdminDashboard() |
| Orders today | EXISTS | SmartOrderService.getAdminAnalytics() |
| RFQs today | EXISTS | AnalyticsService.getAdminDashboard() |
| Quotes today | EXISTS | QuoteService (needs admin aggregation) |
| Payments today | EXISTS | PaymentService.findAll() |
| Collections today | EXISTS | CollectionsService.getOutstandingSummary() |
| AI Opportunities | EXISTS | AiAdminService.morningBrief() |
| Critical Alerts | EXISTS | AiAdminService.aiAlerts() |
| Top Priorities | EXISTS | AiAdminService.morningBrief() |
| Auto-trigger on login | MISSING | Need scheduled context enrichment |

### Feature 2: Evening Business Summary
| Requirement | Status | Source |
|------------|--------|--------|
| Daily Revenue | EXISTS | AnalyticsService.getAdminDashboard() |
| Orders | EXISTS | SmartOrderService.getAdminAnalytics() |
| Growth | EXISTS | AnalyticsService growth rates |
| Missed Opportunities | EXISTS | AiAdminService.aiAlerts() |
| Completed Missions | EXISTS | GocashEcosystemService.getAdminDashboard() |
| Pending Actions | EXISTS | CRM follow-ups, collections |
| Tomorrow Focus | MISSING | Need aggregation + AI |

### Feature 3: Executive Dashboard
| Requirement | Status | Source |
|------------|--------|--------|
| Revenue Trends | EXISTS | Analytics ClickHouse daily metrics |
| Growth | EXISTS | Analytics growth rates |
| Cash Flow | EXISTS | FinanceDashboardService.getCashFlow() |
| Top Categories | EXISTS | MarketplaceIntelligenceEngine.getMarketplaceRankings() |
| Top Cities | EXISTS | MarketplaceIntelligenceEngine.getGeoIntelligence() |
| Top States | EXISTS | MarketplaceIntelligenceEngine.getMarketplaceRankings() |
| Top Industries | EXISTS | MarketplaceIntelligenceEngine.getMarketplaceRankings() |
| Top Buyers | EXISTS | Order analytics by buyer |
| Top Sellers | EXISTS | AnalyticsService.getSellerLeaderboard() |
| Top Professionals (TradeServ) | DOES NOT EXIST | TradeServ not implemented |

### Feature 4: AI Decision Center
| Requirement | Status | Source |
|------------|--------|--------|
| Recommend Campaign | EXISTS | AiAdminService.decisionSupport() |
| Pricing | EXISTS | AiAdminService.decisionSupport() |
| Membership | EXISTS | Membership plan analytics |
| Advertising | EXISTS | AdvertisingService.getAdminDashboard() |
| Collections | EXISTS | CollectionsService + AiAdminService |
| Expansion | EXISTS | MarketplaceIntelligenceEngine.getBusinessIntelligence() |
| Hiring | MISSING | No HR data in platform |
| AI Confidence | EXISTS | AiGatewayResponse includes provider/model/latency |
| Reason | EXISTS | AI content includes reasoning in response |
| Expected Outcome | EXISTS | AiAdminService.decisionSupport() |

### Feature 5: Risk Intelligence
| Requirement | Status | Source |
|------------|--------|--------|
| Payment Risk | EXISTS | Finance AI credit risk |
| Customer Churn | EXISTS | AiAdminService.churnPrediction() + Membership cancel reasons |
| Fraud | EXISTS | AiAdminService.fraudIntelligence() + Wallet fraud signals |
| Inactive Sellers | EXISTS | Can aggregate from order/analytics data |
| Inactive Buyers | EXISTS | Can aggregate from order/analytics data |
| Inventory Risk | MISSING | No inventory/stock module |
| Delivery Risk | EXISTS | SmartShipmentService performance metrics |

### Feature 6: Growth Intelligence
| Requirement | Status | Source |
|------------|--------|--------|
| High Growth Categories | EXISTS | MarketIntelligenceService.getMarketTrends() |
| Emerging Cities | EXISTS | Geo intelligence + location data |
| Emerging Industries | EXISTS | MarketIntelligenceService |
| Business Opportunities | EXISTS | MarketplaceIntelligenceEngine.getBusinessIntelligence() |
| Marketplace Gaps | EXISTS | AiAdminService.decisionSupport() |

### Feature 7: Founder Copilot (Natural Language)
| Requirement | Status | Source |
|------------|--------|--------|
| "How is business today?" | EXISTS | AiAdminService.executiveCopilot() with focusArea |
| "Which city is growing fastest?" | EXISTS | AiAdminService.geoIntelligence() |
| "Which seller needs attention?" | EXISTS | AiAdminService.executiveCopilot() |
| "Which campaign should I launch?" | EXISTS | AiAdminService.decisionSupport() |
| "Why are collections down?" | EXISTS | AiAdminService.executiveCopilot() |
| Natural language routing | MISSING | Need intent classification layer |

### Feature 8: Cross-Module Intelligence
| Requirement | Status |
|------------|--------|
| Marketplace data | EXISTS |
| TradeServ data | NOT YET (future) |
| CRM data | EXISTS (data accessible, no admin page) |
| Finance data | EXISTS |
| Membership data | EXISTS |
| Advertising data | EXISTS |
| GOCASH data | EXISTS |
| Notifications data | EXISTS |
| Analytics data | EXISTS |

### Feature 9: AI Explanation
| Requirement | Status |
|------------|--------|
| Reason | EXISTS — in AI response content |
| Confidence | EXISTS — AiGatewayResponse includes provider/model |
| Source | EXISTS — provider + model returned |
| Impact | EXISTS — in decision support content |
| Suggested Action | EXISTS — in decision support content |

### Feature 10: Frontend
| Requirement | Status | Source |
|------------|--------|--------|
| `/admin/founder-ai` page | DOES NOT EXIST | Must create |
| Enterprise dashboard | DOES NOT EXIST | Must build |
| Responsive | USE EXISTING | Admin layout pattern |
| Dark theme | USE EXISTING | Tailwind dark theme |
| Premium charts | MISSING | No chart library — use inline bars (existing pattern) |
| Cards | USE EXISTING | StatCard, Card components |
| Insights | USE EXISTING | AiAdminCopilot pattern |
| Priority panel | DOES NOT EXIST | Must build |

---

## 6. Architecture Decision

### Pattern: Aggregation Layer + AI Enrichment

Founder AI will NOT be a new NestJS module with its own Prisma models. Instead, it follows the **Frontend-Orchestrated Aggregation** pattern:

```
/admin/founder-ai page
    |
    +-> useMultipleQueries() — aggregate data from 10+ existing API endpoints
    |     (analytics, orders, payments, membership, advertising, ecosystem, etc.)
    |
    +-> Compute local stats (revenue, growth, top lists, counts, trends)
    |     from aggregated data (NO new backend endpoints needed)
    |
    +-> AI enrichment (optional, on-demand)
    |     -> AiAdminService.morningBrief() — AI-generated insights
    |     -> AiAdminService.executiveCopilot() — natural language answers
    |     -> Display AI confidence/source alongside data
    |
    +-> Render dashboard with:
          - Morning Brief (auto-loaded)
          - Executive Dashboard (StatCards + charts + tables)
          - AI Decision Center (action cards with confidence)
          - Risk Intelligence (status cards with alerts)
          - Growth Intelligence (trend cards)
          - Founder Copilot (chat input)
```

### Why NOT a new backend module?

1. **All data already exists** — 200+ endpoints across 60+ services
2. **Event bus doesn't exist** — Can't rely on async events for real-time data
3. **No new Prisma models needed** — Aggregation is query-only, not write
4. **Minimal maintenance** — Frontend aggregates, backend unchanged
5. **Future-ready** — When Event Bus is implemented, switch to event-driven updates

### What new services ARE needed?

1. **`FounderAiAggregatorService`** (backend — lightweight, no new DB tables)
   - `getMorningBrief()` — Orchestrates calls to AnalyticsService, OrderService, PaymentService, CollectionsService, AiAdminService
   - `getEveningSummary()` — Same pattern with end-of-day focus
   - `getExecutiveDashboard()` — Aggregated stats across all domains
   - `getAIDecisionCenter()` — Routes to AiAdminService.decisionSupport() with enriched context
   - `getRiskIntelligence()` — Aggregated risk from Finance, Membership, Shipment, Fraud
   - `getGrowthIntelligence()` — Aggregated growth from MarketIntelligence, GeoIntelligence, Rankings
   - `founderCopilot(query)` — Intent classification + routing to appropriate AiAdminService method
   
2. **`FounderAiController`** (backend — 7 endpoints under `/admin/founder-ai`)
   - All endpoints require ADMIN role, all responses logged

3. **Frontend page** (`/admin/founder-ai`)
   - Enterprise dashboard with 6 sections + copilot

---

## 7. Existing vs New Report

| Item | Existing | New | Source |
|------|----------|-----|--------|
| `/admin/founder-ai` page | 0 | 1 | Must create |
| `FounderAiController` | 0 | 1 (7 endpoints) | Must create |
| `FounderAiAggregatorService` | 0 | 1 | Must create |
| `FounderAiModule` | 0 | 1 | Must create |
| API functions (`ai-founder.ts`) | 0 | 7 | Must create |
| React Query hooks (`use-ai-founder.ts`) | 0 | 7 | Must create |
| Founder AI components | 0 | 6+ | Must create |
| Prisma models | 0 | 0 | NOT NEEDED |
| Event bus integration | 0 | 0 | NOT YET (future) |
| DTOs | 0 | 7+ | Must create |
| Admin nav link | 0 | 1 | Add to adminNavSections |
| Breadcrumb mapping | 0 | 1 | Add to labelMap |
| AI Gateway integration | EXISTS | Direct reuse | AiAdminService methods |
| Analytics data | EXISTS | Direct reuse | AnalyticsService methods |
| Order/Payment/Membership data | EXISTS | Direct reuse | Existing services |
| Dashboard components | EXISTS | Direct reuse | StatCard, Skeleton, etc. |
| Toast system | EXISTS | Direct reuse | `useToast()` |
| Authentication | EXISTS | Direct reuse | JwtAuthGuard + RolesGuard |

**Total new files**: ~15 (1 module, 1 controller, 1 service, 7 DTOs, 1 API file, 1 hook file, 1 page, ~6 components, nav/breadcrumb updates)
**Total modified files**: ~3 (sidebar, master-data, breadcrumbs)
**Total reused files**: 30+ (all existing services, components, hooks, API clients)

---

## 8. Business Impact

| Feature | Value Proposition |
|---------|------------------|
| Morning Brief | Save 30+ min/day for founders — no manual dashboard checking |
| Evening Summary | Catch daily misses before they become problems |
| Executive Dashboard | One screen to see ALL platform health metrics |
| AI Decision Center | Data-driven decisions with explainable AI reasoning |
| Risk Intelligence | Early warning on churn, fraud, payment risk |
| Growth Intelligence | Identify expansion opportunities proactively |
| Founder Copilot | Natural language access to ANY platform question |

---

## 9. Security Notes

- All endpoints ADMIN-only (JwtAuthGuard + RolesGuard)
- All actions logged via backend AuditService (when available) + console logging
- No user PII in AI prompts (aggregated data only)
- No mutation endpoints (read-only intelligence)
- Existing RBAC + ABAC respected

---

## 10. Verification Plan

```
prisma validate     -> 0 errors (no schema changes)
prisma generate     -> 0 errors (no schema changes)
tsc api             -> 0 errors
tsc web             -> 0 errors
eslint              -> 0 new errors
next build          -> routes increase by 1 (+ /admin/founder-ai)
```

---

*Audit complete: 2026-07-03 | 16 domains audited | 60+ services reviewed | 200+ endpoints cataloged*
