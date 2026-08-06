# Sprint 8 — Founder Intelligence Platform Implementation Plan

## Phase 1: Foundation (Days 1-4)

### Objective: Fix critical data inconsistencies, build unified aggregation layer, establish real-time dashboard

### Task 1.1 — Revenue Standardization Service
**Files**: 3-4
**Effort**: 4-6 hours
**Description**: Create `RevenueStandardizationService` as the single authoritative source for all revenue/GMV queries. All existing services delegate to it.
- Method: `getRevenue(startDate, endDate, definition: 'GMV'|'REVENUE')`
- GMV = SUM(Order.totalAmount) WHERE status IN (CONFIRMED, DELIVERED, SHIPPED)
- Revenue = SUM(Payment.amount) WHERE status = CAPTURED
- Add caching (60s TTL)
- Wire into FounderAiAggregatorService, AnalyticsService, FinanceAggregatorService
**Verification**: All 4 modules return identical revenue values for same period.

### Task 1.2 — Real Growth Rate Computation
**Files**: 1-2
**Effort**: 2-3 hours
**Description**: Remove all `Math.random()` calls from `FounderAiAggregatorService.growthIntelligence()`.
- Replace `growthRate: Math.random() * 40 + 10` with actual period-over-period computation
- Use existing `GrowthIntelligenceService.getGrowthKpis()` for user/order/revenue growth
- Use `getCategoryMomentum()` from EnterpriseIntelligence for category growth
- Use `getRegionalHeatmap()` data for regional growth
**Verification**: Growth numbers are deterministic and reproducible.

### Task 1.3 — Unified Intelligence Facade
**Files**: 4-5
**Effort**: 6-8 hours
**Description**: Create `ExecutiveIntelligenceFacadeService` that aggregates all 4 intelligence layers.
- 6 endpoints: GET /unified, GET /health, GET /alerts, GET /chart/:type, GET /search, GET /export/:fmt
- Parallel Promise.all with 5s timeout per sub-request
- Error isolation (null for failed sub-requests)
- 60s Redis caching for unified response
- Field abbreviation for payload size
**Verification**: Single endpoint returns all critical KPIs (20-30 metrics) in under 3s.

### Task 1.4 — Admin Dashboard Rewrite
**Files**: 5-6
**Effort**: 8-12 hours
**Description**: Rewrite `/admin/dashboard` as the Founder Command Center.
- Top row: 8 stat cards (Revenue, Orders, Users, Companies, RFQs, AI Requests, Trust Score, Health Index)
- Chart row: 4 time-series charts (Revenue 30d, Orders 30d, User Growth 30d, AI Usage 30d)
- Health row: Health gauge + grade + 7 dimension scores
- Alert row: Critical alerts with severity badges
- Activity row: Recent orders, RFQs, registrations (last 10)
- All stat cards clickable → drill-down to admin pages
- 60s auto-refresh with "last updated" timestamp
- Loading/error/empty states for every section
- Real chart library (Recharts)
**Verification**: Page loads in under 3s with all data.

### Phase 1 Deliverables
- RevenueStandardizationService (new, 1 file)
- ExecutiveIntelligenceFacadeService (new, 1 file)
- ExecutiveIntelligenceFacadeController (new, 1 file)
- Admin Dashboard rewrite (5-6 files)
- Removal of Math.random() (1-2 edits)
**Total Phase 1**: 9-11 files, 3-4 days

---

## Phase 2: Intelligence (Days 5-8)

### Objective: Build alert system, cross-domain correlation, metric persistence

### Task 2.1 — Executive Alert Service
**Files**: 3
**Effort**: 4-6 hours
**Description**: Create `ExecutiveAlertService` with threshold-based alert engine.
- Configurable thresholds: revenue drop > 10%, order drop > 20%, dispute > 5%, etc.
- Evaluates on every `GET /unified` call
- Persists alerts in Prisma `ExecutiveAlert` model (new)
- Delivers via NotificationService for 3+ consecutive breaches
- Returns active alerts in unified response
**Verification**: Alert triggers when threshold is crossed within test data.

### Task 2.2 — Intelligence Correlation Engine
**Files**: 2
**Effort**: 4-6 hours
**Description**: Create `IntelligenceCorrelationService` with 5-10 predefined correlation rules.
- Rules evaluate cross-domain data: trust + disputes + orders, AI latency + failures, RFQ + quotes, refunds + disputes, verification + signups
- Returns correlation findings with confidence score (0.0-1.0)
- Integrated into unified intelligence response
**Verification**: Correlation findings appear when related metrics are simultaneously degraded.

### Task 2.3 — Metric Persistence
**Files**: 2-3
**Effort**: 4-6 hours
**Description**: Add Prisma models for operational history.
- `AiCollaborationAudit`: captures federation collaboration events
- `AiOrchestrationAudit`: captures orchestration dispatch events
- `AiSlaSnapshot`: periodic SLA metric snapshots
- Migrate in-memory stores to Prisma models
- Add cleanup job (delete records older than 30 days)
**Verification**: Operational data survives service restart.

### Task 2.4 — Unified Health Index
**Files**: 1-2
**Effort**: 2-3 hours
**Description**: Consolidate 3 existing health scores into one authoritative `HealthIndexService`.
- Standardize dimensions: Marketplace Activity (25%), Trust & Verification (20%), Growth Momentum (15%), Community Health (10%), AI Adoption (10%), System Health (10%), Revenue Stability (10%)
- Grade: A (>=90), B+ (>=80), B (>=70), C+ (>=60), C (>=50), D (<50)
- Trend: improving/stable/declining
- Cache: 300s Redis TTL
- Wire into EnterpriseIntelligenceService (replace getHealthIndex) and FounderAiAggregatorService (replace healthScore)
**Verification**: Same health score from both old entry points.

### Phase 2 Deliverables
- ExecutiveAlertService + Prisma model (2-3 files)
- IntelligenceCorrelationService (1-2 files)
- Metric persistence models (2-3 files)
- HealthIndexService consolidation (1-2 files)
**Total Phase 2**: 6-10 files, 3-4 days

---

## Phase 3: Polish (Days 9-12)

### Objective: Charts, tracking, reports, copilot improvements, CAC

### Task 3.1 — Real Chart Components
**Files**: 5-6
**Effort**: 6-8 hours
**Description**: Build shared chart components using Recharts.
- `TimeSeriesChart`: configurable date range, metric, comparison
- `MetricBarChart`: bar chart with period labels
- `PieChart`: distribution visualization
- `HealthGauge`: 0-100 gauge with color zones
- Wire into: Founder Dashboard, Analytics page, Finance dashboard
**Verification**: Charts render with real data, responsive, accessible.

### Task 3.2 — Page Tracking Expansion
**Files**: 10-15
**Effort**: 4-6 hours
**Description**: Wire 10 critical page templates with `usePageTracking()`.
- Order list, Order detail, RFQ list, RFQ detail, Quote list, Quote detail
- Product list, Product detail, Company profile, User settings
- Add backend EventEmitter2 hooks for key lifecycle events
**Verification**: Tracking events appear in ClickHouse tracking_events table.

### Task 3.3 — Executive Report Export
**Files**: 2-3
**Effort**: 4-6 hours
**Description**: Add PDF and CSV export capability.
- PDF generation from executive report HTML template
- CSV export for tabular data (revenue, orders, users)
- Download trigger from unified dashboard
**Verification**: Reports download as PDF/CSV with correct data.

### Task 3.4 — CAC Model + Real Computation
**Files**: 2-3
**Effort**: 4-6 hours
**Description**: Add `MarketingExpense` Prisma model and compute real CAC.
- Model: companyId, campaignId, channel, amount, period, description
- Admin CRUD for marketing expenses
- Real CAC computation: totalAcquisitionCost / newCustomers
- LTV/CAC ratio becomes meaningful
**Verification**: CAC > 0, LTV/CAC ratio is meaningful.

### Phase 3 Deliverables
- Chart components (5-6 files)
- Page tracking wiring (10-15 files)
- Report export (2-3 files)
- CAC model + service (2-3 files)
**Total Phase 3**: 19-27 files, 3-4 days

---

## Files Never Modified

The following modules are FROZEN — never modify:
- `apps/api/src/modules/ai-gateway/` (all 8 services)
- `apps/api/src/modules/ai-orchestrator/` (127 actions, frozen)
- `apps/api/src/modules/ai-federation/` (federation engine)
- `apps/api/src/modules/seller-agent/` (Seller Agent, frozen)
- `apps/api/src/modules/buyer-agent/` (Buyer Agent, frozen)
- `apps/api/src/modules/admin-agent/` (Admin Agent, frozen)
- `apps/api/src/modules/agent-framework/` (Agent Registry, frozen)
- `apps/web/app/admin/founder-ai/` (keep as AI Insights hub)
- `apps/web/app/founder/executive/` (keep as Agent interface)
- `apps/web/app/founder/intelligence/` (keep as Intelligence hub)
- All Prisma models (frozen)
- All existing admin pages (keep as-is, only /admin/dashboard is rewritten)

---

## Total Effort Estimate

| Phase | Focus | Files | Backend | Frontend | Days |
|-------|-------|-------|---------|----------|------|
| 1 | Foundation | 9-11 | 5-6 | 4-5 | 3-4 |
| 2 | Intelligence | 6-10 | 6-10 | 0 | 3-4 |
| 3 | Polish | 19-27 | 5-8 | 14-19 | 3-4 |
| **Total** | | **34-48** | **16-24** | **18-24** | **9-12** |

## Blocking Dependencies

None — all data already exists in Prisma. No external API integrations needed (except Recharts which is already in dependencies). No new infrastructure (Redis, ClickHouse already running).
