# Founder Intelligence Platform — Architecture

## 1. Design Principles

1. **Reuse First**: Never duplicate existing intelligence services. Extend or aggregate.
2. **Unification, Not Revolution**: The 3-tier intelligence architecture (Admin Intelligence → Founder AI → Enterprise Intelligence) is sound. Add a 4th Unification Layer on top.
3. **Backward Compatibility**: All existing endpoints remain untouched. New endpoints aggregate existing ones.
4. **Consistency Over Features**: One authoritative source for each metric is better than multiple inconsistent ones.
5. **Lazy Loading**: No background computation. All intelligence is computed on-demand with Redis caching.
6. **Graceful Degradation**: If any sub-module fails, return null for that metric. Never crash the entire dashboard.

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FOUNDER COMMAND CENTER                           │
│  /founder/command-center                                            │
│  Single page aggregating all intelligence                           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│              LAYER 4: UNIFIED INTELLIGENCE API (NEW)                │
│  ExecutiveIntelligenceFacadeService                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Major Service      │ Delegates To              │ Cache TTL    │ │
│  ├────────────────────┼───────────────────────────┼──────────────┤ │
│  │ getUnifiedSummary()│ ALL 4 layers in parallel  │ 60s          │ │
│  │ getUnifiedChart()  │ FounderAI + EnterpriseInt │ 60s          │ │
│  │ getUnifiedHealth() │ FounderAI + EnterpriseInt │ 300s         │ │
│  │ getUnifiedAlerts() │ ExecutiveAlertService     │ 60s          │ │
│  │ getUnifiedSearch() │ Cross-entity search       │ No cache     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  Endpoints:                                                         │
│  GET  /founder/intelligence/unified      → aggregated KPIs          │
│  GET  /founder/intelligence/health       → unified health index     │
│  GET  /founder/intelligence/alerts       → alert summary            │
│  GET  /founder/intelligence/chart/:type  → time-series chart data   │
│  GET  /founder/intelligence/search?q=    → cross-entity search      │
│  GET  /founder/intelligence/export/:fmt  → PDF/CSV export           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│              LAYER 3: EXECUTIVE SERVICES (NEW/MINIMAL)              │
│                                                                     │
│  ExecutiveAlertService                 IntelligenceCorrelationSvc   │
│  ┌──────────────────────────────┐     ┌─────────────────────────┐  │
│  │ Threshold-based alert engine │     │ Cross-domain anomaly    │  │
│  │ Checks all 19 domains        │     │ correlation rules       │  │
│  │ Delivers via NotificationSvc │     │ 5-10 predefined rules   │  │
│  │ Configurable thresholds      │     │ Confidence scoring      │  │
│  └──────────────────────────────┘     └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│              LAYER 2: INTELLIGENCE AGGREGATION (EXISTING)           │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Founder AI  │  │ Enterprise   │  │ Intelligence Aggregators │   │
│  │ 19 endpoints│  │ Intelligence │  │ ┌──────────────────────┐ │   │
│  │ Redis-cached│  │ 14 endpoints │  │ │AnalyticsSvc (9 meth) │ │   │
│  │ AI enriched │  │ No cache     │  │ │GrowthIntelSvc(20 m)  │ │   │
│  └─────────────┘  └──────────────┘  │ │FinanceAggSvc(11 m)   │ │   │
│                                      │ │RevenueStandardizeSvc│ │   │
│                                      │ └──────────────────────┘ │   │
│                                      └──────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│              LAYER 1: DATA SOURCES (EXISTING)                       │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Prisma   │ │ClickHouse│ │  Redis   │ │ AI       │ │Event     │  │
│  │ 267 mods │ │14 tables │ │  Cache   │ │Gateway   │ │Emitter2  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Data Flow

### 3.1 Unified Dashboard Load
1. Founder opens `/founder/command-center`
2. Frontend calls `GET /founder/intelligence/unified`
3. `ExecutiveIntelligenceFacadeService` dispatches 5 parallel requests:
   - `FounderAiAggregatorService.executiveDashboard()` (Redis 60s)
   - `FounderAiAggregatorService.healthScore()` (Redis 60s)
   - `EnterpriseIntelligenceService.getDigitalTwin()` (no cache)
   - `FinanceAggregatorService.getDashboardCards()` (no cache)
   - `GrowthIntelligenceService.getGrowthKpis(30)` (no cache)
4. Each sub-request has 5s timeout + `.catch(() => null)`
5. Results merged into unified response
6. Frontend renders stat cards + 4 core charts + health gauge + alert banner

### 3.2 Alert Detection Flow
1. `ExecutiveAlertService.checkAllThresholds()` runs on every `GET /unified` call
2. Compares current KPI values against configurable thresholds
3. If threshold breached → creates alert in memory → returns in response
4. If same alert repeats 3+ consecutive times → sends Notification via `NotificationService.createWithTemplate()`
5. Alert history persisted to `ExecutiveAlert` (in-memory, lost on restart — acceptable for MVP)

### 3.3 Cross-Domain Correlation Flow
1. `IntelligenceCorrelationService.evaluate()` runs after unified data is fetched
2. Checks 5-10 predefined correlation rules:
   - "High disputes + low trust + declining orders = Trust Crisis"
   - "High AI latency + high failure rate = AI Platform Issue"
   - "Low RFQ creation + low quote response = Marketplace Slowdown"
   - "High refund rate + high dispute rate = Payment Issue"
   - "Low verification rate + high new user growth = Verification Bottleneck"
3. Returns correlation findings with confidence score
4. Displayed as "System Intelligence" section in command center

## 4. Unified Health Index (Consolidated)

The 3 existing health scores will be consolidated into one:
- Weight: Marketplace Activity (25%), Trust & Verification (20%), Growth Momentum (15%), Community Health (10%), AI Adoption (10%), System Health (10%), Revenue Stability (10%)
- Grade: A (>=90), B+ (>=80), B (>=70), C+ (>=60), C (>=50), D (<50)
- Trend: improving/stable/declining (compared to previous snapshot)
- Cache: 300s Redis TTL

## 5. Key Integration Points

| Existing Service | Integration Method | Purpose |
|-----------------|-------------------|---------|
| FounderAiAggregatorService | Direct injection | Primary real-time metrics |
| EnterpriseIntelligenceService | Direct injection | Deep intelligence + digital twin |
| FinanceAggregatorService | Direct injection | Financial KPIs |
| AnalyticsService | Direct injection | ClickHouse-derived metrics |
| GrowthIntelligenceService | Direct injection | Cohort/retention/LTV/CAC |
| AiCircuitBreakerService | Direct injection | AI platform health |
| AiTelemetryService | Direct injection | AI runtime status |
| TradTrustService | Via Founder AI | Trust metrics |
| NotificationService | Direct injection | Alert delivery |

## 6. Extensions to Existing Services (Minimal)

### FounderAiAggregatorService — 3 additions
- `marketplaceIntelligence()`: Add `liquidityRatio`, `rfqFillRate`, `orderConcentration`
- `tradeservIntelligence()`: Add booking conversion funnel, avg booking value
- Remove `Math.random()` — use real period-over-period from GrowthIntelligenceService

### EnterpriseIntelligenceService — 2 additions
- `getDigitalTwin()`: Add catalog quality trend over time
- `getAnalytics()`: Add notification engagement metrics

### AnalyticsService — 1 addition
- Add `getUserEngagement()`: DAU/WAU/MAU computation

## 7. Zero-Change Modules

The following modules must NOT be modified:
- AiAdminService (Admin Intelligence — pure AI proxy, structure is correct)
- AiGatewayModule (all 8 services — frozen)
- AiOrchestratorService (127 actions — frozen)
- TradeAgentFederationService (federation — frozen)
- All agent modules (SellerAgent, BuyerAgent, AdminAgent — frozen)
- All Prisma models (267 — frozen)
- All existing dashboard pages (keep as-is)

## 8. Security & Performance

- All new endpoints guarded by JwtAuthGuard + RolesGuard ('ADMIN', 'SUPER_ADMIN')
- Throttle: 30 req/min on unified endpoint (it's heavy)
- Timeout: 8s for unified dashboard (5s per sub-request with Promise.race)
- Cache: Redis with 60s TTL for unified summary, 300s for health index
- Error isolation: Each sub-request wrapped in try/catch, never fails the whole response
- Pagination: All list endpoints support cursor/offset pagination
- Minification: Unified response uses field abbreviation for payload size (e.g., `tr` instead of `totalRevenue`)
