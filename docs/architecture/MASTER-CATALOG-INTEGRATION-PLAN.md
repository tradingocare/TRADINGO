# Master Catalog Enterprise Integration Plan — Phase P-2

## 1. Executive Summary

**Status**: 🟢 Founder approved Phase P-1 (models + import pipeline). P-2 audit complete.
**Goal**: Integrate new Master Catalog models into Marketplace, TradeServ, Search, Admin, and AI without breaking backward compatibility or modifying existing models.

**Principle**: Zero modification to existing models. All integration via adapter/compatibility layers.

---

## 2. Audit Findings — 10 Domains

| # | Domain | Status | Key Finding |
|---|--------|--------|-------------|
| 1 | **Marketplace** (old Category) | 🔴 Parallel universe | Product.CategoryId → old Category. Zero refs to Catalog models |
| 2 | **TradeServ** (ProfessionalService) | 🔴 Free-text | `ProfessionalService.category` is `String?`, no FK to any taxonomy |
| 3 | **Search (OpenSearch)** | 🔴 Old only | `categories` index built from old Category model. No Catalog awareness |
| 4 | **AI Gateway** | 🟡 Partial | Prompt context has `CompanyData.categoryIds` bound to old Category |
| 5 | **Import Framework** | 🟢 Dual-write | `importCatalogCategories/Subcategories/Items` already writes both old + new |
| 6 | **Admin Panel** | 🔴 Old only | Category management (list/create/edit), Product management all use old models |
| 7 | **Seeder Framework** | 🟢 Ready | `catalog-master.seed.ts` created with resume/rollback for new models |
| 8 | **RFQ Module** | 🔴 Old only | RFQ `categoryId` FK → old Category. Quote has `subcategory` free-text |
| 9 | **Products/Wizard** | 🔴 Old only | `CreateProductDto.categoryId` resolves to old Category |
| 10 | **CRM/Leads** | 🔴 No taxonomy | `CrmLead` has `industry` free-text, no category mapping |

---

## 3. Integration Architecture

```
                    ┌─────────────────────────────┐
                    │   Master Catalog (New)       │
                    │  CatalogCategory             │
                    │  CatalogSubcategory          │
                    │  CatalogItem                 │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │    Catalog Adapter Layer     │
                    │  - getCategory(id)           │
                    │  - searchCategories(q)       │
                    │  - resolveOldCategoryId(id)  │
                    │  - mapToCatalogItem(pmId)    │
                    └──────────┬──────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
  ┌──────▼──────┐    ┌────────▼──────┐    ┌─────────▼─────┐
  │  Marketplace │    │   TradeServ    │    │ Search/Admin   │
  │  (old+new)   │    │  (controlled   │    │  (adapter)     │
  │              │    │   vocabulary)  │    │                │
  └──────────────┘    └───────────────┘    └───────────────┘
```

---

## 4. Phase P-2 Implementation Phases (Sub-phases)

### P-2.1: Catalog Adapter Service (Week 1)
**Files to create**:
- `apps/api/src/modules/catalog-adapter/catalog-adapter.service.ts` — 10 methods: resolveOldToNew, resolveNewToOld, searchCatalog, getHierarchy, validateMapping, batchResolve, getIndustryMapping, getCatalogItem, getCatalogCategory, getCatalogSubcategory
- `apps/api/src/modules/catalog-adapter/catalog-adapter.module.ts`
- `apps/api/src/modules/catalog-adapter/index.ts`

**Key methods**:
```typescript
class CatalogAdapterService {
  // Bidirectional mapping between old Category ↔ new CatalogCategory
  async resolveOldCategoryToNew(oldCategoryId: string): Promise<CatalogCategory | null>
  async resolveNewCategoryToOld(catalogCategoryId: string): Promise<Category | null>
  
  // Fuzzy search across old + new
  async unifiedSearch(query: string, options?: { type?: 'all' | 'old' | 'new' }): Promise<CatalogSearchResult[]>
  
  // Hierarchy functions
  async getCatalogTree(): Promise<CatalogCategory[]> // full tree with subcategories
  
  // Validation
  async validateMapping(oldId: string, newId: string): Promise<ValidationResult>
}
```

### P-2.2: TradeServ Taxonomy Bridge (Week 1)
**Goal**: Replace free-text `ProfessionalService.category` with controlled vocabulary.

**Approach** (no schema change):
1. Create `TradeServCategoryMapping` service that maps free-text strings → CatalogCategory
2. Add `POST /tradeserv/categories/normalize` endpoint (admin) to batch-fix existing records
3. Add `POST /tradeserv/services/:id/category` endpoint to set controlled category
4. `GET /tradeserv/categories` now returns CatalogCategory tree (not groupBy on free-text)
5. Seed service auto-tags new services with resolved CatalogCategory

**Files to create**:
- `apps/api/src/modules/tradeserv/tradeserv-category.service.ts`
- `apps/api/src/modules/tradeserv/tradeserv-category.controller.ts`
- `apps/api/src/modules/tradeserv/dto/tradeserv-category.dto.ts`

### P-2.3: Admin Master Catalog Management (Week 2)
**Goal**: Admin pages for Master Catalog CRUD.

**Backend** (reuse existing patterns from CategoriesController):
- `CatalogCategoryController` — CRUD + tree view + reorder
- `CatalogSubcategoryController` — CRUD + bulk assign to category
- `CatalogItemController` — CRUD + search + bulk operations
- DTOs with class-validator

**Frontend**:
- `/admin/catalog/categories` — tree management (expand/collapse, drag-reorder, edit)
- `/admin/catalog/subcategories` — list, filter by category, edit
- `/admin/catalog/items` — searchable grid, filter by subcategory, bulk edit

### P-2.4: OpenSearch Index Extension (Week 2)
**Goal**: Extend OpenSearch indices to include Catalog models.

- New index `catalog_items` with fields: id, name, description, categoryPath, keywords, synonyms, attributes
- New index `catalog_categories` with fields: id, name, path, parent, level
- Update `TradfindConfigService` to register new indices
- Add `POST /search/reindex-catalog` admin endpoint
- `GET /search/catalog` public endpoint for Master Catalog search
- Products index `categoryId` field can optionally resolve to CatalogItem

### P-2.5: RFQ/Quote Taxonomy Upgrade (Week 2-3)
**Goal**: RFQ `categoryId` optionally resolves to CatalogCategory (backward compat).

- Extend `CreateRfqDto` with optional `catalogCategoryId` field
- Extend `SmartRfqService.create()` to optionally link to CatalogCategory
- Extend `SmartRfqController` GET by id to return both `category` + `catalogCategory`
- Add `POST /smart-rfq/bulk-migrate-categories` admin endpoint to link old→new
- No changes to QuoteService (free-text `subcategory` stays as-is until P-2.6)

### P-2.6: Product Wizard Category Source (Week 3)
**Goal**: Product wizard can use Master Catalog instead of old Category.

- Extend `CreateProductDto` with optional `catalogItemId`
- Extend `GET /products/wizard/categories` to return unified category list (old + new)
- Extension of `SellerProductService.create()` to optionally link to CatalogItem
- UI toggle in wizard step 1: "Use Master Catalog" checkbox
- Stock/price/attribute sync between Product and CatalogItem

### P-2.7: CRM/Leads Industry Resolution (Week 3)
**Goal**: Map `CrmLead.industry` free-text to CatalogCategory.

- Create `CrmIndustryResolver` service that maps free-text → CatalogCategory
- Add `POST /crm/leads/:id/resolve-industry` admin endpoint
- Add `POST /crm/leads/bulk-resolve-industries` admin endpoint
- Display resolved CatalogCategory name in lead detail page

### P-2.8: AI Gateway Context Extension (Week 3)
**Goal**: AI prompts include Master Catalog context.

- Extend `CompanyData` in AI prompt context to include `catalogCategories` and `catalogItems`
- Add `POST /tradfind/ai/context` to return unified context from both old + new
- Update `AiSearchService` to consider Master Catalog in semantic search context
- No changes to existing AI prompt templates

### P-2.9: Market Mapping Tables & CSV Import (Week 4)
**Goal**: Seed full Master Catalog from CSV + map to old categories.

- Create mapping table (in-memory or new Prisma model `CatalogCategoryMapping`) for old→new
- Extend `catalog-master.seed.ts` to include mapping logic
- Add `POST /admin/catalog/import-csv` endpoint with category mapping UI
- Add `POST /admin/catalog/validate-mappings` to check coverage
- Generate mapping report: `GET /admin/catalog/mapping-report`

### P-2.10: Mapping Admin UI (Week 4)
**Goal**: Admin UI for old→new category mapping.

- `/admin/catalog/mappings` page with:
  - List all old categories (paginated, searchable)
  - For each: show linked CatalogCategory (or "Unmapped" badge)
  - Quick-map dropdown to assign CatalogCategory
  - Bulk mapping by name similarity (auto-suggest)
  - Mapping coverage stat card (X% mapped, Y% unmapped)
  - Export mapping CSV

---

## 5. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Old Category → CatalogCategory mismatch causes broken Marketplace | HIGH | Bidirectional resolver with fallback; all old endpoints unchanged |
| TradeServ free-text category cannot be reliably mapped | MEDIUM | GroupBy analysis + admin normalization endpoint for manual review |
| OpenSearch reindex causes temporary search degradation | LOW | Rolling reindex; feature-flag new indices; serve old indices during reindex |
| Product wizard confusion with two category sources | MEDIUM | Default to old; toggle for Master Catalog; clear UI labels |
| AI Gateway prompt size increase | LOW | Context is additive; old context path unchanged; new fields are optional |
| Circular module dependencies in adapter layer | MEDIUM | CatalogAdapterModule is leaf module — imports nothing from domain modules; domain modules import it |
| Concurrent edits to old + new category trees cause drift | HIGH | Only 1 source of truth per time period; migration window where new is truth; old is deprecated |

---

## 6. Files That Must Never Change

- `apps/api/src/modules/categories/` — Old Category CRUD preserved for backward compat
- `apps/api/src/modules/products/` — Product model unchanged; only extend DTO with optional catalogItemId
- `apps/api/src/modules/smart-rfq/` — RFQ model unchanged; extend DTO with optional catalogCategoryId
- `prisma/schema.prisma` — No changes to existing models; only add mapping table if needed
- `apps/api/src/modules/tradfind/` — Existing indices unchanged; new indices added alongside

---

## 7. Verification Plan

After each sub-phase:
1. `npx prisma validate && npx prisma generate`
2. `npx tsc --noEmit -p apps/api/tsconfig.json`
3. `npx tsc --noEmit -p apps/web/tsconfig.json`
4. `npm run next-build` (or `turbo run build`)
5. Smoke test affected endpoints with curl
6. Verify old endpoints still work (no regression)

---

## 8. Success Criteria

1. All 10 domains integrated with Master Catalog
2. Zero old endpoints broken
3. New CatalogItem searchable via OpenSearch
4. TradeServ ProfessionalService category → controlled vocabulary
5. Admin can manage CatalogCategory/Subcategory/Item
6. Old→New mapping covers 100% of seeded categories
7. AI Gateway includes Catalog context in prompts
8. CSV import maps old→new automatically
9. Migration can be rolled back by reverting adapter config
10. tsc + next build: 0 errors after every sub-phase
