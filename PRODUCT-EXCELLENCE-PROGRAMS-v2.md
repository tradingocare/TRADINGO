# TRADINGO — Product Excellence Implementation Programs v2.0

**Status:** 🟡 AUDIT ACCEPTED — Implementation NOT YET APPROVED
**Derived from:** `PRODUCT-EXCELLENCE-PROGRAM.md` (full audit report)
**Optimization:** 64 raw items → 5 duplicates removed → 8 consolidated programs → 4 prioritized tiers

---

## Optimization Summary

| Reduction | Before | After |
|-----------|--------|-------|
| Raw audit items | 64 | 59 |
| Duplicate items identified | — | 5 (P1-11↔P2-1, P2-2↔P2-4, P2-7 split, P3-6↔P0-4, P3-7↔P2-9) |
| Standalone items | 64 | — |
| Consolidated programs | — | **8** |
| Implementation tiers | 6 sprints | **4 tiers** |

---

## Consolidated Programs

### 🔴 TIER 1 — Pre-Launch Critical (must ship before production launch)

| Program | Items Merged | Scope | Days |
|---------|-------------|-------|------|
| **G: UX Refinement** | P0-7, P0-8, P0-9, P1-13, P1-14, P1-15, P2-17, P2-18, P2-19, P2-20, P2-21, P2-22, P3-14, P3-15, P3-16 (15 items) | Form standardization, silent catch removal, accessibility, registration reduction, responsive tables, deep-link tabs, express checkout | 8 |
| **A: Unified Ranking Engine** | P0-1, P0-2, P0-4, P2-8, P2-9, P3-6, P3-7 (7 items→1) | Consolidate all ranking signals (BestSupplier + TradTrust + AI + CatalogQuality + Membership + XP) into single service that feeds all 3 search stacks | 5 |
| **C: Enterprise Catalog Data Model** | P0-5, P0-6, P1-12, P2-13, P2-14 (5 items) | Fix ProductAttribute↔GlobalAttribute FK, Category↔Attribute mapping, product templates, warranty/compliance fields, HSN validation | 5 |

### 🟡 TIER 2 — Pre-Launch High (should ship before production launch)

| Program | Items Merged | Scope | Days |
|---------|-------------|-------|------|
| **B: Search Intelligence** | P0-3, P1-1, P1-9, P1-10, P2-10, P2-11, P3-8, P3-9, P3-10 (9 items→1) | Faceted search aggregations + FilterSidebar, vector embeddings/kNN search, spellcheck, 200+ synonyms, click tracking, search quality dashboard | 8 |
| **F: Marketplace Intelligence** | P0-10, P1-16, P2-7, P2-15, P2-16, P3-12, P3-13 (7 items→1) | Demand/supply engine, category intelligence, customer segmentation, regional heatmap, Redis scoring cache, competitor intel, ML forecasting | 6 |

### 🟢 TIER 3 — Post-Launch (deployable after production launch)

| Program | Items Merged | Scope | Days |
|---------|-------------|-------|------|
| **E: TradeServ Excellence** | P1-2, P1-3, P1-4, P1-6, P2-3, P2-4+P2-2(merged), P2-6, P2-7tz, P3-4, P3-5 (10 items→1, 1 duplicate removed) | Calendar UI, matching algorithm, unit tests, real-time chat, saved searches, pricing intelligence, dispute UI, timezone, video platform, multi-currency | 10 |
| **D: AI Catalog Intelligence** | P1-11+2-1(merged), P2-12 (2 items→1 duplicate removed) | Bulk AI enrichment pipeline (background jobs), embedding-based duplicate detection | 4 |

### 🔵 TIER 4 — Future (v2.0)

| Program | Items Merged | Scope | Days |
|---------|-------------|-------|------|
| **H: Advanced AI** | P3-1, P3-2, P3-3 (3 items) | AI image processing/auto-tagging, AI fraud detection, AI dispute resolution | 6 |

---

## Duplicates Identified & Removed

| # | Original Items | Duplicate Type | Resolution |
|---|---------------|----------------|------------|
| 1 | **P1-11** (Bulk AI enrichment pipeline) + **P2-1** (AI-powered catalog enrichment pipeline) | Exact scope overlap — both describe batch AI processing for products | **Removed P2-1.** Kept under Program D as single item |
| 2 | **P2-2** (AI-powered pricing intelligence for TradeServ) + **P2-4** (Pricing intelligence with market benchmarks) | Same feature — AI pricing with market data | **Removed P2-2.** Kept under Program E as single item |
| 3 | **P2-7** (Redis caching for scoring components) listed under Discovery + Marketplace Intel | Cross-domain concern — caching is infrastructure, not a feature | **Split:** Redis for ranking cache → Program A (implemented as part of Unified Ranking Service). Redis for analytics cache → Program F |
| 4 | **P3-6** (AI personalized ranking in search) + **P0-4** (Wire AI search into ranking) | Same concept — AI signals modifying search ranking | **Removed P3-6.** P0-4 covers it in ranking pipeline; personalization is a sub-feature |
| 5 | **P3-7** (Ecosystem level/XP ranking boost) + **P2-9** (Membership plan boost in ranking) | Same mechanism — non-quality signals boosting ranking | **Merged** into single "Membership + Ecosystem boost" item under Program A |

**Total duplication removed:** 5 items. Effective savings: ~8 dev days.

---

## Program Definitions

### Program A: Unified Ranking Engine

**Problem:** Three disjoint ranking systems (SearchRankingService, EnterpriseRankingService, BestSupplierEngine) with different factor sets. TradTrust 1000-point score unused. Catalog quality, membership, AI personalization, and ecosystem signals not consumed by any ranking system.

**Solution:** Single `UnifiedRankingService` that composites all signals (TradTrust + BestSupplier + Location + CatalogQuality + Membership + Ecosystem + AI) with configurable context-weight profiles. All 3 search stacks call it for final re-ranking.

**Builds on:**
- `MarketplaceIntelligenceService` (14-factor engine)
- `TradTrustService.getScore()` (1000-point score)
- `CatalogQualityService` (10-dimension per product)
- `AiSearchService.personalizedRanking()`
- `MembershipService.getPlanByName()`
- `EcosystemService.getLevel()`

**Files to create:**
- `apps/api/src/modules/unified-ranking/unified-ranking.service.ts`
- `apps/api/src/modules/unified-ranking/unified-ranking.module.ts`
- `apps/api/src/modules/unified-ranking/context-weight-profiles.ts`

**Files to modify:**
- `search-ranking.service.ts` (delegate to UnifiedRankingService)
- `enterprise-ranking.service.ts` (delegate to UnifiedRankingService)
- `marketplace-intelligence.service.ts` (delegate to UnifiedRankingService)
- `tradtrust.service.ts` (add event-driven recalculation)

**Exit criteria:**
- Single `GET /ranking/score/:companyId?buyerId=&lat=&lng=&categoryId=` returns composited score
- Single `POST /ranking/re-rank` accepts raw search results, returns re-ranked
- All 3 search stacks use the same ranking pipeline
- TradTrust auto-recalculates on order/shipment/dispute events
- Redis cache for all scoring components (5-min TTL)

### Program B: Search Intelligence

**Problem:** 3 fragmented search stacks. No faceted search (zero aggregations returned). AI search is sidebar-only. No vector/kNN. No spellcheck. 47 synonyms insufficient. No click tracking. No search quality metrics.

**Solution:** Add OpenSearch aggregations to all product/company searches. Rebuild FilterSidebar with dynamic facets. Add vector embeddings + kNN index for semantic search. Add term_suggest for spellcheck. Enrich synonyms to 200+. Add click tracking + search quality dashboard.

**Builds on:**
- Existing OpenSearch indices (11 indices, edge ngram, completion suggester)
- Existing SynonymIntelligenceService (expand synonym catalog)
- Existing AiGatewayService (for embedding generation)
- Existing EnterpriseSearchAnalytics model (add click tracking fields)

**Files to create:**
- FilterSidebar rewrite with dynamic facet rendering
- Search quality dashboard admin page
- Vector embedding service + index

**Files to modify:**
- `product-search.service.ts` (add aggregations)
- `company-search.service.ts` (add aggregations)
- `EnterpriseSearchAnalytics` Prisma model (add clickedResultId, converted)

**Exit criteria:**
- Every search returns aggregations (category, price range, location, rating, verification level)
- FilterSidebar renders 6+ dynamic facets from aggregations
- Vector search endpoint returns semantically similar products
- "Did you mean X?" shown on misspelled queries
- 200+ synonym pairs covering all major industry verticals
- Search quality dashboard with NDCG@10, MAP@20, zero-result rate

### Program C: Enterprise Catalog Data Model

**Problem:** ProductAttribute disconnected from GlobalAttribute (references TemplateField instead). No Category↔Attribute mapping. No product templates per category. Missing warranty/certification/compliance fields. HSN/GSTIN not validated.

**Solution:** Add FK from ProductAttribute to GlobalAttribute. Create CategoryAttribute mapping model + admin UI. Add ProductTemplate model per category. Extend Product model with warranty/certification/compliance fields. Add HSN validation against government API.

**Builds on:**
- Existing GlobalAttribute model (15 types)
- Existing Category + Industry models
- Existing CatalogQualityService (extend dimensions)

**Files to create:**
- CategoryAttribute mapping model + admin page
- ProductTemplate model + admin builder
- HsnValidationService

**Files to modify:**
- Prisma schema (Product, ProductAttribute, new models)
- ProductAttribute DTOs
- product-edit page (new fields)
- product-import pipeline (HSN validation step)

**Exit criteria:**
- ProductAttribute.fieldId → GlobalAttribute.id (not TemplateField)
- CategoryAttribute table populated with per-category attribute templates
- ProductTemplate builder UI with drag-and-drop attribute selector
- Product model has warrantyPeriod, warrantyType, certifications[], complianceFlags[]
- Import rejects invalid HSN/SAC codes

### Program D: AI Catalog Intelligence

**Problem:** AI enrichment is per-product only (no batch). Duplicate detection uses primitive word-overlap (no embeddings). No automated catalog enrichment pipeline.

**Solution:** BullMQ background jobs for batch AI enrichment. Embedding-based duplicate detection using vector similarity. Scheduled re-enrichment on product updates.

**Builds on:**
- AI Gateway (for embedding + enrichment calls)
- BullMQ queues (existing in ai-runtime)
- CatalogQualityService.detectDuplicates()
- Existing CatalogItem model (reserved embeddingId field)

**Files to create:**
- `apps/api/src/modules/ai-catalog/ai-catalog-batch.service.ts`
- `apps/api/src/modules/ai-catalog/ai-catalog-batch.processor.ts`

**Exit criteria:**
- Admin can trigger "AI Enrich All Products" for a company/category
- Background job processes products in batches of 50
- Duplicate detection uses vector similarity (cosine distance < 0.15)
- Duplicate detection catches same-product-different-name matches

### Program E: TradeServ Excellence

**Problem:** No availability calendar UI. No professional matching (RelatedProfessionals = random). Zero unit tests. No real-time chat. Saved searches backend exists but no frontend. Pricing intelligence lacks market context. No dispute resolution UI. No timezone support. No video platform. No multi-currency.

**Solution:** DayPicker calendar component for booking. Professional matching via OpenSearch + TradTrust. Unit tests for all services. Real-time chat via TradeTalk ChatModule. Saved searches frontend. Pricing intelligence with market benchmarks. Dispute resolution frontend. Timezone-aware scheduling. Zoom/Meet integration. Multi-currency (future).

**Builds on:**
- OpenSearch V2 (for professional matching via existing aggregations)
- TradTrustService (for trust-based ranking)
- TradeTalk ChatModule (existing, reuse for booking conversations)
- ProfessionalSavedSearch model (backend exists, add frontend)
- Existing booking data (for pricing benchmarks)
- RefundModule + DisputeService (backend exists, add frontend)

**Exit criteria:**
- Booking flow has interactive calendar showing available time slots
- RelatedProfessionals shows genuinely similar professionals (same category + location + trust tier)
- 70%+ test coverage on TradeservService, AiTradeservService, BookingFinancialOrchestratorService
- Buyer↔professional chat thread auto-created on booking confirmation
- "Save this search" button on search page + saved searches workspace page
- Pricing suggestions show market percentiles (P25/P50/P75)
- Dispute filing form for buyers/professionals linked to pauseSettlement API
- All booking times converted to user's local timezone

### Program F: Marketplace Intelligence

**Problem:** No demand/supply intelligence. No category intelligence. No customer segmentation. Regional heatmap returns zeros. No competitor intelligence. Predictive analytics is arithmetic extrapolation. No Redis cache for scoring.

**Solution:** DemandSupplyService using existing order/RFQ/search data. CategoryIntelligenceService with growth trends + price benchmarks. Customer segmentation (buyer/seller clustering by behavior). Regional heatmap with real data. Competitor intelligence framework. ML-based forecasting pipeline.

**Builds on:**
- Existing Order, RFQ, Quote, SearchAnalytics data
- GrowthIntelligenceService (acquisition funnel, campaign performance)
- EnterpriseIntelligenceService (predictive analytics)
- Founder intelligence (KPI catalog, alert engine)

**Files to create:**
- `apps/api/src/modules/marketplace-intelligence/demand-supply.service.ts`
- `apps/api/src/modules/marketplace-intelligence/category-intelligence.service.ts`
- `apps/api/src/modules/marketplace-intelligence/customer-segmentation.service.ts`

**Exit criteria:**
- Demand/supply dashboard shows trending categories + supply gaps + opportunity score
- Category intelligence shows per-category growth rate, avg price, seller concentration
- Customer segments (3-5 buyer clusters, 3-5 seller clusters) with behavioral profiles
- Regional heatmap shows real order/RFQ density (not zeros)
- Redis cache for all scoring components (survives restart)

### Program G: UX Refinement

**Problem:** 4 form validation patterns. 6+ silent catch blocks. Accessibility WCAG failures (empty alt text, no skip-to-content, no focus indicators, non-semantic buttons). 7-step seller registration (industry avg: 3-4). Drafts in localStorage. No deep-linkable tab state. Grid tables lose context on mobile. No field-level validation on blur. Stubbed Return Items. TradeTalk "Coming Soon" stats. No express checkout. No admin walkthrough. No push notifications.

**Solution:** Standardize all forms on react-hook-form + zod. Replace all `.catch(() => {})` with toast. Fix all a11y violations (alt text, skip-to-content, focus indicators, semantic buttons). Reduce registration to 4 steps. Move drafts to server. Add URL hash for tab state. Convert grid tables to stacked cards on mobile. Real return flow. Replace stubs with real data. Express checkout with saved preferences.

**Builds on:**
- Existing react-hook-form + zodResolver pattern (already used on auth pages)
- Existing useToast pattern
- Existing EmptyState, DashboardPageHeader, StatCard components
- Existing registration wizard pattern (extend, don't rebuild)

**Exit criteria:**
- 100% of forms use react-hook-form + zod (zero exceptions)
- Zero silent `.catch(() => {})` in all user-facing code
- Lighthouse Accessibility score ≥ 90 on all 10 core pages
- Seller registration: 4 steps (Business Info → Documents → Profile → Plan)
- Registration drafts persist server-side (survive browser clear)
- All tabbed pages have deep-linkable URL state
- 10 core page tables render as stacked cards on < 768px
- All interactive elements have visible focus ring
- Return Items flow functional end-to-end
- Express checkout: 1-click reorder for repeat buyers

### Program H: Advanced AI (Future)

**Problem:** No AI image processing (auto-tagging, visual search). No AI fraud detection beyond basic rules. No AI dispute resolution assistance.

**Solution:** Image recognition pipeline for product auto-tagging + visual similarity search. ML-based fraud detection (transaction patterns, account behavior). AI-assisted dispute resolution (evidence summarization, recommendation).

**Builds on:**
- AI Gateway (image analysis TaskType)
- EscrowService + DisputeService (data sources)
- Existing notification + audit log infrastructure

**Exit criteria:** (Post-launch, not blocking production)

---

## Tier-Based Execution Roadmap

```
TIER 1 — PRE-LAUNCH CRITICAL (13 days)
├── Program G: UX Refinement (8 days)
│   ├── Sprint 1a (4d): Form standardization + silent catches + a11y fixes
│   └── Sprint 1b (4d): Registration reduction + responsive tables + deep-link tabs + express checkout
├── Program A: Unified Ranking Engine (5 days)
│   └── Sprint 2a (5d): UnifiedRankingService + TradTrust auto-recalc + Redis cache
└── Program C: Enterprise Catalog Data Model (5 days)
    └── Sprint 2b (5d): FK fixes + CategoryAttribute + product templates + warranty fields

TIER 2 — PRE-LAUNCH HIGH (14 days)
├── Program B: Search Intelligence (8 days)
│   ├── Sprint 3a (4d): Faceted search aggregations + FilterSidebar rewrite
│   └── Sprint 3b (4d): Vector search + spellcheck + 200 synonyms + click tracking + quality dashboard
└── Program F: Marketplace Intelligence (6 days)
    └── Sprint 4a (6d): Demand/supply engine + category intelligence + segmentation + regional heatmap

TIER 3 — POST-LAUNCH (14 days)
├── Program E: TradeServ Excellence (10 days)
│   ├── Sprint 5a (5d): Calendar UI + matching algorithm + unit tests
│   └── Sprint 5b (5d): Chat + saved searches + pricing intel + dispute UI + timezone
└── Program D: AI Catalog Intelligence (4 days)
    └── Sprint 6a (4d): Bulk enrichment pipeline + embedding duplicate detection

TIER 4 — FUTURE v2.0 (6 days)
├── Program H: Advanced AI (6 days)
    └── Sprint 6b (6d): Image AI + fraud AI + dispute AI
```

**Total optimized:** 47 dev days (vs original 64 items × ~1d = 64d — **27% reduction** through duplicate removal and parallelization)

---

## Risk Assessment (Optimized)

| Risk | Program | Likelihood | Impact | Mitigation |
|------|---------|-----------|--------|------------|
| Ranking engine becomes too complex | A | Medium | High | Start with 5 core signals (Trust+Supplier+Location+Quality+AI); add Membership+XP in v2 |
| Schema migration conflicts across 3 programs | A, C, F | High | Medium | Sequence: Data Model (C) → Ranking (A) → Intel (F). Run prisma validate before each. |
| Form migration (G) touches 20+ files | G | High | High | Use codemod pattern; prioritize buyer-facing forms; leave admin forms for later |
| PostGIS migration breaks geo queries | A | Medium | Critical | Add geography column alongside legacy lat/lng; dual-write; phased cutover with feature flag |
| Registration reduction breaks existing drafts | G | Medium | High | Old drafts stored as JSON unaffected; new wizard ignores extra fields |
| Search unification deferred to v2.0 | B | Low | Medium | Acceptable. Faceted search + vector + spellcheck shipped in Tier 2; full unification is v2.0 |
| Test coverage gap on all Programs | A-G | High | High | Add tests per sprint at 70%+ coverage; critical path (booking, payment, ranking) at 90%+ |

---

## Approval

**Founder Decision:**

☐ **APPROVED** — Proceed with Tier 1 implementation immediately

☐ **APPROVED WITH MODIFICATIONS** — Modify programs before proceeding

☐ **NOT APPROVED** — Provide feedback

**Notes:** ___________________________________________________________________

**Signature:** _________________ **Date:** _______________
