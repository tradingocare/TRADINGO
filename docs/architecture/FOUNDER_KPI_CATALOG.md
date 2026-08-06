# Founder Intelligence Platform — KPI Catalog

## Purpose

This catalog documents every KPI available for the Founder Command Center, organized by domain. Each entry specifies: KPI name, data source, existing endpoint, computation method, refresh cadence, and current status (Exists / Needs Fix / Missing).

## KPI Legend

- ✅ EXISTS — Fully functional, no changes needed
- ⚠️ EXISTS WITH ISSUES — Data exists but has quality problems (e.g., Math.random())
- 🆕 NEW — Must be built for Sprint 8
- 📋 AGGREGATE — Computed from existing KPIs

---

## 1. Revenue & Financial KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Gross Merchandise Value (GMV)** | `Order.totalAmount` | FounderAI.executiveDashboard | SUM of confirmed/delivered/shipped orders | Real-time | ⚠️ Inconsistent across modules |
| **Revenue** | `Payment.amount` | FinanceAggregator.dashboard | SUM of captured payments | Real-time | ⚠️ Inconsistent across modules |
| **Today's Revenue** | `Payment.amount` | FounderAI.morningBrief | SUM of today's captured payments | Real-time | ✅ |
| **Yesterday's Revenue** | `Payment.amount` | FounderAI.morningBrief | SUM of yesterday's captured payments | Real-time | ✅ |
| **Revenue Growth %** | Computed | FounderAI.morningBrief | (Today - Yesterday) / Yesterday * 100 | Real-time | ✅ |
| **MRR** | `Payment.amount` | AnalyticsService.getRevenueKpis | SUM of monthly subscription payments | Real-time | ✅ |
| **ARR** | `MRR * 12` | AnalyticsService.getRevenueKpis | MRR annualized | Real-time | ✅ |
| **MRR Growth %** | `Payment.amount` | AnalyticsService.getRevenueKpis | Month-over-month MRR change | Monthly | ✅ |
| **Revenue 30-Day Trend** | `Payment.amount` | FounderAI.executiveDashboard | Daily revenue for 30 days | Real-time | ⚠️ Uses raw SQL |
| **Cash Flow (In/Out/Net)** | `Payment.amount` + `Settlement.amount` | FounderAI.executiveDashboard | Inflow - Outflow | Real-time | ✅ |
| **Average Order Value (AOV)** | `Order.totalAmount` | FounderAI.executiveDashboard | Revenue / Total Orders | Real-time | ✅ |
| **Pending Settlements** | `Settlement` | FinanceAggregator.dashboard | COUNT of PENDING settlements | Real-time | ✅ |
| **Escrow Balance** | `Escrow.amount` | FinanceAggregator.dashboard | SUM of HELD escrows | Real-time | ✅ |
| **Commission Earned** | `Commission.amount` | FinanceAggregator.dashboard | SUM of commissions | Real-time | ✅ |
| **Failed Settlements** | `Settlement` | FinanceAggregator.dashboard | COUNT of FAILED settlements | Real-time | ✅ |
| **Payment Volume** | `Payment.amount` | FounderAI.riskIntelligence | Total payment amount (overdue/pending) | Real-time | ✅ |
| **Credit Utilization** | `BuyerCredit` | FinanceAggregator.dashboard | Used / Total Limit * 100 | Real-time | ✅ |
| **Outstanding Credits** | `BuyerCredit` | FinanceAggregator.dashboard | SUM of outstanding credit amounts | Real-time | ✅ |

---

## 2. Order & Transaction KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Total Orders** | `Order` | FounderAI.executiveDashboard | COUNT of all orders | Real-time | ✅ |
| **Today's Orders** | `Order` | FounderAI.morningBrief | COUNT of today's orders | Real-time | ✅ |
| **Yesterday's Orders** | `Order` | FounderAI.morningBrief | COUNT of yesterday's orders | Real-time | ✅ |
| **Order Growth %** | `Order` | FounderAI.morningBrief | Period-over-period comparison | Real-time | ✅ |
| **Order 30-Day Trend** | `Order` | FounderAI.executiveDashboard | Daily order count for 30 days | Real-time | ✅ |
| **Order Completion Rate** | `Order` + `Dispute` | AnalyticsService.getCompletionRate | Completed / Total * 100 | Real-time | ✅ |
| **Order Cancellation Rate** | `Order` | AnalyticsService.getCompletionRate | Cancelled / Total * 100 | Real-time | ✅ |
| **Order Dispute Rate** | `Order` + `Dispute` | AnalyticsService.getCompletionRate | Disputed / Total * 100 | Real-time | ✅ |
| **Pending Orders** | `Order` | FounderAI.morningBrief | COUNT of PENDING orders | Real-time | ✅ |
| **Delayed Shipments** | `Shipment` | FounderAI.riskIntelligence | COUNT of overdue shipments | Real-time | ✅ |
| **Delivery Failure Rate** | `Shipment` | FounderAI.riskIntelligence | Failed / Total deliveries | Real-time | ✅ |
| **Refund Queue** | `Refund` | FinanceAggregator.dashboard | COUNT of PENDING refunds | Real-time | ✅ |
| **Active Disputes** | `Dispute` | FounderAI.riskIntelligence | COUNT of OPEN disputes | Real-time | ✅ |
| **New Disputes (Today)** | `Dispute` | FounderAI.morningBrief | COUNT of today's disputes | Real-time | ✅ |
| **Order Value Distribution** | `Order` | 🆕 UnifiedDashboard | Buckets: <1K, 1-10K, 10-100K, 100K+ | Real-time | 🆕 NEW |

---

## 3. User & Company KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Total Users** | `User` | FounderAI.executiveDashboard | COUNT of all users | Real-time | ✅ |
| **Active Users (30d)** | `User` | FounderAI.riskIntelligence | Users with activity in 30 days | Real-time | ✅ |
| **New Users (Today)** | `User` | FounderAI.morningBrief | COUNT registered today | Real-time | ✅ |
| **User Growth %** | `User` | GrowthIntelligence.kpis | Period-over-period | Daily | ✅ |
| **Total Companies** | `Company` | FounderAI.executiveDashboard | COUNT of all companies | Real-time | ✅ |
| **Active Buyers** | `Company` + `Order` | FounderAI.executiveDashboard | Buyers with orders in 30 days | Real-time | ✅ |
| **Active Sellers** | `Company` + `Product` | FounderAI.executiveDashboard | Sellers with active products | Real-time | ✅ |
| **New Companies (Today)** | `Company` | FounderAI.morningBrief | COUNT registered today | Real-time | ✅ |
| **Pending Verifications** | `CompanyVerification` | FounderAI.morningBrief | COUNT of PENDING verifications | Real-time | ✅ |
| **Verified Partners** | `CompanyVerification` | FounderAI.executiveDashboard | COUNT of APPROVED verifications | Real-time | ✅ |
| **Churn Rate** | `PlanHistory` + `Company` | AnalyticsService.getRevenueKpis | Cancelled / Total * 100 | Monthly | ✅ |
| **Expiring Subscriptions** | `Company` | AnalyticsService.getSubscriptionMetrics | Subs expiring in 30 days | Real-time | ✅ |
| **Inactive Sellers (30d)** | `Company` + `Product` | FounderAI.riskIntelligence | Sellers with no orders in 30d | Real-time | ✅ |
| **Inactive Buyers (30d)** | `Company` + `Order` | FounderAI.riskIntelligence | Buyers with no orders in 30d | Real-time | ✅ |
| **DAU/WAU/MAU** | `User` + `UsageEvent` | 🆕 AnalyticsService.getUserEngagement | Daily/Weekly/Monthly active users | Daily | 🆕 NEW |

---

## 4. Marketplace & RFQ KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Active RFQs** | `Rfq` | FounderAI.morningBrief | COUNT of OPEN RFQs | Real-time | ✅ |
| **RFQs Today** | `Rfq` | FounderAI.morningBrief | COUNT created today | Real-time | ✅ |
| **RFQ Trend (30d)** | `Rfq` | FounderAI.executiveDashboard | Daily RFQ count | Real-time | ✅ |
| **Expired RFQs** | `Rfq` | FounderAI.eveningSummary | COUNT of EXPIRED RFQs | Real-time | ✅ |
| **Active Quotes** | `Quote` | FounderAI.executiveDashboard | COUNT of PENDING quotes | Real-time | ✅ |
| **Abandoned Quotes** | `Quote` | FounderAI.eveningSummary | COUNT of EXPIRED quotes | Real-time | ✅ |
| **RFQ→Quote Conversion %** | `Rfq` + `Quote` | FounderAI.marketplaceIntelligence | RFQs with quotes / Total RFQs | Real-time | ✅ |
| **Quote→Order Conversion %** | `Quote` + `Order` | FounderAI.marketplaceIntelligence | Quotes converted / Total quotes | Real-time | ✅ |
| **Avg Conversion Days** | `Rfq` → `Order` | FounderAI.marketplaceIntelligence | Avg days from RFQ to order | Real-time | ⚠️ Always returns 0 |
| **Active Products** | `Product` | FounderAI.marketplaceIntelligence | COUNT of PUBLISHED products | Real-time | ✅ |
| **Supply-Demand Balance** | `Product` + `Rfq` | EnterpriseIntelligence.supplyDemand | Per-category supply vs demand | Real-time | ✅ |
| **Marketplace Liquidity** | Buyers/Sellers | 🆕 MarketplaceIntelligence | Active buyers / Active sellers | Real-time | 🆕 NEW |
| **RFQ Fill Rate** | `Rfq` + `Quote` | 🆕 MarketplaceIntelligence | RFQs with ≥1 quote / Total | Real-time | 🆕 NEW |
| **Top Categories by RFQ** | `Rfq` + `Category` | FounderAI.executiveDashboard | Category RFQ volume ranking | Real-time | ✅ |

---

## 5. Search & Catalog KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Total Searches** | `EnterpriseSearchAnalytics` | EnterpriseSearch.summary | COUNT of search queries | Real-time | ✅ |
| **Unique Queries** | `EnterpriseSearchAnalytics` | EnterpriseSearch.topQueries | DISTINCT query count | Real-time | ✅ |
| **Zero-Result Rate** | `EnterpriseSearchAnalytics` | EnterpriseSearch.zeroResults | Zero-result / Total * 100 | Real-time | ✅ |
| **Avg Quality Score** | `CatalogQualityScore` | FounderAI.marketplaceIntelligence | AVG of quality scores | Real-time | ✅ |
| **Scored Products** | `CatalogQualityScore` | FounderAI.marketplaceIntelligence | COUNT with quality score | Real-time | ✅ |
| **Missing Image Products** | `CatalogQualityScore` | FounderAI.marketplaceIntelligence | COUNT with missing images | Real-time | ✅ |
| **Missing SEO Products** | `CatalogQualityScore` | FounderAI.marketplaceIntelligence | COUNT with missing SEO | Real-time | ✅ |
| **Missing Specs Products** | `CatalogQualityScore` | FounderAI.marketplaceIntelligence | COUNT with missing specs | Real-time | ✅ |
| **Total Brands** | `GlobalBrand` | FounderAI.marketplaceIntelligence | COUNT of global brands | Real-time | ✅ |
| **Verified Brands** | `GlobalBrand` | FounderAI.marketplaceIntelligence | COUNT of VERIFIED brands | Real-time | ✅ |
| **Categories (with products)** | `Category` | FounderAI.marketplaceIntelligence | COUNT of categories with >0 products | Real-time | ✅ |
| **Catalog Health Trend** | `CatalogQualityScore` | 🆕 EnterpriseIntelligence | Daily avg quality over 30 days | Real-time | 🆕 NEW |

---

## 6. Trust & Verification KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Avg Trust Score** | `TradTrustScore` | EnterpriseIntelligence.trustDistribution | AVG of trust scores | Real-time | ✅ |
| **Trust Grade Distribution** | `TradTrustScore` | EnterpriseIntelligence.trustDistribution | COUNT per grade (A-F) | Real-time | ✅ |
| **Verification Funnel** | `CompanyVerification` | EnterpriseIntelligence.trustDistribution | Pending / Verified / Rejected | Real-time | ✅ |
| **Fraud Alerts (24h)** | `ReferralBlacklist` + alerts | FounderAI.riskIntelligence | COUNT of new fraud alerts | Real-time | ✅ |
| **Blacklisted Entities** | `ReferralBlacklist` | FounderAI.riskIntelligence | COUNT of blacklisted entities | Real-time | ✅ |
| **Payment Risk Level** | `Invoice` | FounderAI.riskIntelligence | Low/Medium/High/Critical | Real-time | ✅ |
| **Overdue Invoices** | `Invoice` | FounderAI.riskIntelligence | COUNT + total amount overdue | Real-time | ✅ |
| **Risk Grade Distribution** | `TradTrustScore` | EnterpriseIntelligence.trustDistribution | Low/Medium/High/Critical | Real-time | ✅ |

---

## 8. AI Platform KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **AI Total Requests** | `AiUsage` | FounderAI.marketplaceIntelligence | COUNT of AI requests | Real-time | ✅ |
| **AI Success Rate** | `AiUsage` | FounderAI.marketplaceIntelligence | Successful / Total * 100 | Real-time | ✅ |
| **AI Avg Latency** | `AiUsage` | FounderAI.marketplaceIntelligence | AVG of latency | Real-time | ✅ |
| **Active AI Providers** | `AiProvider` | FounderAI.marketplaceIntelligence | COUNT of active providers | Real-time | ✅ |
| **Open Circuit Breakers** | `AiCircuitBreaker` | FounderAI.marketplaceIntelligence | COUNT of OPEN breakers | Real-time | ✅ |
| **AI Queue Depth** | `AiAgentRuntime` | EnterpriseIntelligence.analytics | COUNT of queued jobs | Real-time | ✅ |
| **AI Workers Active** | `AiAgentRuntime` | EnterpriseIntelligence.analytics | COUNT of active workers | Real-time | ✅ |
| **AI Completed Jobs (24h)** | `AiUsage` | EnterpriseIntelligence.analytics | COUNT of completed jobs | Real-time | ✅ |
| **AI Failed Jobs (24h)** | `AiUsage` | EnterpriseIntelligence.analytics | COUNT of failed jobs | Real-time | ✅ |
| **SLA Breaches** | `AiSlaEngine` | EnterpriseIntelligence.analytics | COUNT of SLA breaches | Real-time | ✅ |
| **Top AI Features** | `AiUsage` | AiGateway.usage | Feature usage ranking | Real-time | ✅ |
| **AI Credit Utilization** | `AiCreditUsage` | AiGateway.credits | Used / Total per company | Real-time | ✅ |
| **AI Requests by Model** | `AiUsage` | 🆕 EnterpriseIntelligence | Request count per model | Real-time | 🆕 NEW |

---

## 9. GOCASH & Ecosystem KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Total Wallets** | `GOCASH_Wallet` | FounderAI.gocashIntelligence | COUNT of wallets | Real-time | ✅ |
| **Total Wallet Volume** | `GOCASH_Transaction` | FounderAI.gocashIntelligence | SUM of credit transactions | Real-time | ✅ |
| **Avg Wallet Balance** | `GOCASH_Wallet` | FounderAI.gocashIntelligence | AVG of wallet balances | Real-time | ✅ |
| **Total XP Issued** | `EcosystemXPTransaction` | FounderAI.gocashIntelligence | SUM of XP issued | Real-time | ✅ |
| **Avg XP per User** | `EcosystemXPTransaction` | FounderAI.gocashIntelligence | Total XP / Distinct users | Real-time | ✅ |
| **Reward Utilization Rate** | `GOCASH_Transaction` | FounderAI.gocashIntelligence | Redeemed / Earned * 100 | Real-time | ✅ |
| **Mission Completion Rate** | `EcosystemMission` | FounderAI.gocashIntelligence | Completed / Total * 100 | Real-time | ✅ |
| **Active Missions** | `EcosystemMission` | FounderAI.gocashIntelligence | COUNT of active missions | Real-time | ✅ |
| **Total Check-ins** | `EcosystemCheckin` | AdminEcosystemAdmin | COUNT of check-ins | Real-time | ✅ |
| **Badges Issued** | `EcosystemBadge` | AdminEcosystemAdmin | COUNT of badges issued | Real-time | ✅ |
| **Level Distribution** | `EcosystemUserLevel` | 🆕 AdminEcosystemAdmin | Users per level | Real-time | 🆕 NEW |

---

## 10. Community & TradeTalk KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Total Communities** | `Community` | FounderAI.tradetalkIntelligence | COUNT of communities | Real-time | ✅ |
| **Community Growth (30d)** | `Community` | FounderAI.tradetalkIntelligence | New communities in 30 days | Real-time | ✅ |
| **Total Members** | `CommunityMember` | FounderAI.tradetalkIntelligence | COUNT of memberships | Real-time | ✅ |
| **Active Members** | `CommunityMember` | FounderAI.tradetalkIntelligence | Members with activity in 30d | Real-time | ✅ |
| **Total Posts** | `SocialPost` | 🆕 FounderAI.tradetalkIntelligence | COUNT of all posts | Real-time | 🆕 NEW |
| **Total Comments** | `Message` (COMMENT) | 🆕 FounderAI.tradetalkIntelligence | COUNT of comments | Real-time | 🆕 NEW |
| **Engagement Rate** | Posts + Comments | 🆕 FounderAI.tradetalkIntelligence | Interactions / Members | Real-time | 🆕 NEW |

---

## 11. Advertising KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Total Campaigns** | `Advertisement` | FounderAI.advertisingIntelligence | COUNT of all campaigns | Real-time | ✅ |
| **Active Campaigns** | `Advertisement` | FounderAI.advertisingIntelligence | COUNT of ACTIVE campaigns | Real-time | ✅ |
| **Total Spend** | `Advertisement` | FounderAI.advertisingIntelligence | SUM of campaign budgets | Real-time | ✅ |
| **Avg ROI** | `Advertisement` + analytics | FounderAI.advertisingIntelligence | Total value / Spend | Real-time | ⚠️ Always returns 0 |
| **Total Impressions** | `AdAnalytics` | FounderAI.advertisingIntelligence | SUM of impressions | Real-time | ✅ |
| **Total Clicks** | `AdAnalytics` | FounderAI.advertisingIntelligence | SUM of clicks | Real-time | ✅ |
| **Avg CTR** | `AdAnalytics` | FounderAI.advertisingIntelligence | Clicks / Impressions * 100 | Real-time | ✅ |

---

## 12. TradeServ KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Total Professionals** | `ProfessionalService` | FounderAI.tradeservIntelligence | DISTINCT company count | Real-time | ✅ |
| **New Professionals (30d)** | `ProfessionalService` | FounderAI.tradeservIntelligence | New in 30 days | Real-time | ✅ |
| **Total Services** | `ProfessionalService` | FounderAI.tradeservIntelligence | COUNT of services | Real-time | ✅ |
| **Top Service Categories** | `ProfessionalService` | FounderAI.tradeservIntelligence | Category ranking | Real-time | ✅ |
| **Total Bookings** | `Booking` | 🆕 FounderAI.tradeservIntelligence | COUNT of bookings | Real-time | 🆕 NEW |
| **Booking Conversion Rate** | `Inquiry` → `Booking` | 🆕 FounderAI.tradeservIntelligence | Bookings / Inquiries | Real-time | 🆕 NEW |
| **Avg Booking Value** | `Booking` | 🆕 FounderAI.tradeservIntelligence | AVG of booking amount | Real-time | 🆕 NEW |
| **Proposal Count** | `Proposal` | 🆕 FounderAI.tradeservIntelligence | COUNT of proposals | Real-time | 🆕 NEW |
| **Profile Quality Avg** | `CompanyVerification` + expert | FounderAI.tradeservIntelligence | AVG of completion pct | Real-time | ✅ |
| **Verification Rate** | `CompanyVerification` | FounderAI.tradeservIntelligence | Approved / Total * 100 | Real-time | ✅ |

---

## 13. Security KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Platform Security Score** | Composite | FounderAI.securityIntelligence | 0-100 weighted score | Real-time | ✅ |
| **Threat Level** | Composite | FounderAI.securityIntelligence | Low/Medium/High/Critical | Real-time | ✅ |
| **Open Incidents** | `Incident` | FounderAI.securityIntelligence | COUNT of OPEN incidents | Real-time | ✅ |
| **Failed Logins (24h)** | `AuditLog` | FounderAI.securityIntelligence | COUNT of failed logins | Real-time | ✅ |
| **Account Locks** | `AuditLog` | FounderAI.securityIntelligence | COUNT of locked accounts | Real-time | ✅ |
| **Prompt Injections Blocked** | `AiUsage` | FounderAI.securityIntelligence | COUNT of blocked injections | Real-time | ✅ |

---

## 14. Growth & Marketing KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Acquisition Funnel** | `UsageEvent` + `Order` | GrowthIntelligence.acquisitionFunnel | 5-stage: Visitor→Reg→Company→RFQ→Order | Daily | ✅ |
| **Cohort Retention** | `Company` + `Order` | GrowthIntelligence.cohortAnalysis | Monthly cohort matrix | Monthly | ✅ |
| **D7/D30/D90 Retention** | `UsageEvent` + `Company` | GrowthIntelligence.retention | Day-7/30/90 retention rates | Daily | ✅ |
| **LTV (Average)** | `Order` | GrowthIntelligence.ltv | Avg revenue per company | Real-time | ✅ |
| **LTV by Cohort** | `Order` + cohort | GrowthIntelligence.ltv | LTV per monthly cohort | Monthly | ✅ |
| **LTV by Plan** | `Order` + `PlanHistory` | GrowthIntelligence.ltv | LTV per membership plan | Real-time | ✅ |
| **CAC** | `Company` + ... | GrowthIntelligence.cac | Acquisition cost / new users | — | ⚠️ All zeros (placeholder) |
| **LTV/CAC Ratio** | LTV / CAC | GrowthIntelligence.cac | Ratio > 3 is healthy | — | ⚠️ Meaningless (CAC=0) |
| **Traffic Sources** | `UsageEvent` (UTM) | GrowthIntelligence.trafficSources | 6-channel breakdown | Daily | ✅ |
| **Multi-touch Attribution** | `UsageEvent` + `Order` | GrowthIntelligence.attribution | First/Last/Linear touch | Monthly | ✅ |
| **Top Landing Pages** | `UsageEvent` | GrowthIntelligence.topLandingPages | Top 20 by visits + reg | Daily | ✅ |
| **Referral Conversion** | `ReferralUsage` + `ReferralReward` | GrowthIntelligence.referralConversion | Codes→Usages→Rewards | Real-time | ✅ |
| **Lead Conversion by Source** | `CrmLead` | GrowthIntelligence.leadConversion | Source→Lead→Customer | Real-time | ✅ |

---

## 15. Membership KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Total Subscribers** | `Company` | AnalyticsService.getRevenueKpis | COUNT of active subscriptions | Real-time | ✅ |
| **Active Subscriptions** | `Company` | AnalyticsService.getSubscriptionMetrics | COUNT by status | Real-time | ✅ |
| **Expiring in 30 Days** | `Company` | AnalyticsService.getSubscriptionMetrics | COUNT of subs expiring | Real-time | ✅ |
| **Plan Distribution** | `Company` | FounderAI.membershipIntelligence | COUNT per plan name | Real-time | ✅ |
| **Recent Activations** | `PlanHistory` | AnalyticsService.getSubscriptionMetrics | COUNT of recent signups | Real-time | ✅ |
| **Recent Churns** | `PlanHistory` | AnalyticsService.getSubscriptionMetrics | COUNT of cancellations | Real-time | ✅ |
| **Upgrade Opportunities** | `Company` | FounderAI.membershipIntelligence | Eligible for upgrade | Real-time | ✅ |

---

## 16. Overall Health KPIs

| KPI | Source | Endpoint | Method | Cadence | Status |
|-----|--------|----------|--------|---------|--------|
| **Health Index** | 7-dimension composite | FounderAI.healthScore | Weighted score (0-100) | 300s cache | ⚠️ Duplicate (3 versions) |
| **Business Confidence** | 6-factor composite | EnterpriseIntelligence.businessConfidence | Weighted index (0-100) | 300s cache | ✅ |
| **Executive Priorities** | Computed from KPIs | FounderAI.priorities | Top-10 ranked priorities | 300s cache | ✅ |
| **Risk Summary** | 4-domain assessment | FounderAI.riskIntelligence | Payment/Churn/Fraud/Delivery | 60s cache | ✅ |
| **Growth Opportunities** | Supply-demand analysis | EnterpriseIntelligence.opportunities | Category/city/industry gaps | 300s cache | ✅ |
| **Executive Alerts** | Threshold-based | 🆕 ExecutiveAlertService | Cross-domain alert aggregation | Per-request | 🆕 NEW |

---

## KPI Count Summary

| Domain | ✅ Exists | ⚠️ Has Issues | 🆕 New | Total |
|--------|-----------|---------------|--------|-------|
| Revenue & Financial | 15 | 2 | 0 | 17 |
| Order & Transaction | 12 | 1 | 1 | 14 |
| User & Company | 12 | 0 | 1 | 13 |
| Marketplace & RFQ | 11 | 1 | 2 | 14 |
| Search & Catalog | 10 | 0 | 1 | 11 |
| Trust & Verification | 8 | 0 | 0 | 8 |
| AI Platform | 11 | 0 | 1 | 12 |
| GOCASH & Ecosystem | 10 | 0 | 1 | 11 |
| Community & TradeTalk | 4 | 0 | 3 | 7 |
| Advertising | 6 | 1 | 0 | 7 |
| TradeServ | 8 | 0 | 3 | 11 |
| Security | 6 | 0 | 0 | 6 |
| Growth & Marketing | 12 | 1 | 0 | 13 |
| Membership | 7 | 0 | 0 | 7 |
| Overall Health | 5 | 1 | 1 | 7 |
| **Total** | **137** | **7** | **14** | **158** |

**158 total KPIs** across 15 domains. 137 (87%) already exist. 7 (4%) need fixes. 14 (9%) need to be built.
