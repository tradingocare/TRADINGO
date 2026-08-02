# TRADINGO® Master Catalog Audit

> **Version**: 1.0
> **Status**: ARCHITECTURE ONLY — No implementation
> **Phase**: P-0.5 (Pre-Phase P-1)
> **Date**: 2026-07-04
> **Contract Reference**: TRADINGO-ENTERPRISE-DOMAIN-MODEL.md (v1.0, FROZEN)

---

## Table of Contents

1. [Existing Architecture](#1-existing-architecture)
2. [Existing vs Required](#2-existing-vs-required)
3. [Reusable Components](#3-reusable-components)
4. [Components to Extend](#4-components-to-extend)
5. [Components That Must Never Change](#5-components-that-must-never-change)
6. [CSV Import Strategy](#6-csv-import-strategy)
7. [Master Catalog Integration Strategy](#7-master-catalog-integration-strategy)
8. [Database Impact](#8-database-impact)
9. [Migration Strategy](#9-migration-strategy)
10. [Risks](#10-risks)

---

## 1. Existing Architecture

### 1.1 Category Model (Prisma)

The `Category` model at `prisma/schema.prisma:1032` has **13 fields** and uses a **self-referencing parent/children tree** (no separate `SubCategory` model). Categories with `parentId != null` serve as subcategories.

```
Category (id, parentId?, name, slug, description, icon, image,
          seoTitle?, seoDescription?, isActive, sortOrder, createdAt, updatedAt)
  ├── parent: Category? (self, onDelete: SetNull)
  ├── children: Category[]
  ├── products: Product[]
  ├── productMasters: ProductMaster[]
  ├── serviceMasters: ServiceMaster[]
  ├── companies: CompanyCategory[]
  ├── rfqs: Rfq[]
  └── ... (10 total relations)
```

**Key facts:**
- 3 indexes: `slug`, `parentId`, `isActive`
- Slug is `@unique`
- Self-referencing via `CategoryTree` relation with `onDelete: SetNull`
- No separate `SubCategory`, `CatalogCategory`, or `CatalogItem` model exists

### 1.2 ProductMaster Model (Existing Master Catalog)

`ProductMaster` at `schema.prisma:3810` (18 fields) is the **existing Master Catalog** concept:

```
ProductMaster (id, categoryId?, subcategoryId?, name, slug, shortDescription?,
               description?, unit?, moq?, priceRangeMin?, priceRangeMax?,
               currency, hsCode?, isActive, searchKeywords[], synonyms[],
               tags[], metaTitle?, metaDescription?, sourceData?, ...)
  ├── category: Category? (onDelete: SetNull)
  ├── aliases: ProductAlias[]
  ├── claims: ProductClaim[]
  └── products: Product[]
```

### 1.3 ServiceMaster Model

`ServiceMaster` at `schema.prisma:3882` (16 fields) mirrors `ProductMaster` for services:

```
ServiceMaster (id, categoryId?, subcategoryId?, name, slug, description?,
               unit?, priceRangeMin?, priceRangeMax?, currency, isActive,
               searchKeywords[], synonyms[], tags[], ...)
  ├── category: Category? (onDelete: SetNull)
  └── (no direct Product relation)
```

### 1.4 Product Model

`Product` at `schema.prisma:1607` has **42 fields** and links to Category via `categoryId`:

```
Product (id, companyId, categoryId?, industryId?, productMasterId?, name,
         slug, shortDescription?, description?, productType, status, ...)
  ├── category: Category? (onDelete: SetNull)
  ├── productMaster: ProductMaster? (onDelete: SetNull)
  ├── company: Company (onDelete: Cascade)
  └── 19 child relations (media, specs, variants, etc.)
```

### 1.5 Category API Coverage

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/categories` | POST | JWT (no role check) | ✅ |
| `/categories` | GET | Public | ✅ |
| `/categories/tree` | GET | Public | ✅ |
| `/categories/:slug` | GET | Public | ✅ |
| `/categories/:slug/breadcrumbs` | GET | Public | ✅ |
| `/categories/:id` | PATCH | JWT (no role check) | ✅ |
| `/categories/:id` | DELETE | JWT (no role check) | ✅ |

**Critical gap**: No `@Roles('ADMIN')` guard on write endpoints. Any authenticated user can create/update/delete categories.

### 1.6 Catalog Import Pipeline (Already Exists)

Two parallel import pipelines exist:

**A. Seed pipeline** (`prisma/seeds/`):
- `seed.ts` (81 lines) — Orchestrator: parse CSV → seed categories → subcategories → product masters → service masters
- `categories.seed.ts`, `subcategories.seed.ts`, `product-masters.seed.ts`, `service-masters.seed.ts` — Modular seeders with resume/rollback support
- `seed.utils.ts` — Manual CSV parser (no library dependency)
- Uses existing `Category` model (self-referencing tree) for both categories and subcategories
- Uses existing `ProductMaster` and `ServiceMaster` for catalog items
- Tracks via `ImportJob` model

**B. Production API pipeline** (`apps/api/src/catalog-import/`):
- `CsvParserService` — Production-grade CSV parsing via `csv-parse` v5.6.0
- `ImportOrchestratorService` (585 lines) — Full pipeline: parse → import categories → subcategories → product masters → service masters → create products → index in search
- `CatalogImportService` (598 lines) — Non-CSV imports, job management, search, stats
- Controller with 19 endpoints under `/catalog-import/`
- Full `ImportJob`/`ImportJobRow` tracking with rollback support

**C. Frontend admin page** (`/admin/catalog-import`):
- 635-line page with stats bar, search, job list, start/rollback/retry actions
- Auto-polling during active jobs
- Full typed API client at `lib/api/catalog-import.ts` (117 lines)

### 1.7 OpenSearch Indexes

Four indexes defined in `tradfind.config.ts`:
- `products` — 2 shards, geo_point location field, 40+ fields — **partially populated**
- `companies` — 2 shards, same structure — **only 7 of 40 fields indexed**
- `categories` — 1 shard — **EMPTY (never indexed)**
- `industries` — 1 shard — **EMPTY (never indexed)**

**Critical**: Categories and industries indexes are never populated. The `ProductsService.syncOpenSearch()` only indexes at the product level (categoryId/categoryName), never at the category level.

### 1.8 Static Frontend Data

Two parallel static data sources:
- `apps/web/data/catalog-data.ts` (3,559 lines): 160 categories, 1,600 subcategories — full catalog
- `apps/web/data/master-data.ts` (1,092 lines): 20 curated categories, 20 sample products, 12 sample services — navigation subset

### 1.9 Key Existing Infrastructure Summary

| Component | Location | Lines | Purpose |
|-----------|----------|-------|---------|
| Category model | `prisma/schema.prisma:1032` | 32 lines | Self-referencing tree |
| ProductMaster model | `prisma/schema.prisma:3810` | 37 lines | Existing master catalog (products) |
| ServiceMaster model | `prisma/schema.prisma:3882` | 30 lines | Existing master catalog (services) |
| Product model | `prisma/schema.prisma:1607` | 78 lines | Seller products |
| ImportJob model | `prisma/schema.prisma:3927` | 27 lines | Import tracking |
| ImportJobRow model | `prisma/schema.prisma:3955` | 23 lines | Per-row tracking |
| CategoriesController | `categories.controller.ts` | 7 endpoints | Category CRUD API |
| CategoriesService | `categories.service.ts` | 204 lines | Category business logic |
| CatalogImportController | `catalog-import.controller.ts` | 19 endpoints | Import API |
| ImportOrchestratorService | `import-orchestrator.service.ts` | 585 lines | Full import pipeline |
| CsvParserService | `csv-parser.service.ts` | 155 lines | CSV parsing |
| Seed pipeline | `prisma/seeds/` | 857 lines | Database seeding from CSV |
| Admin catalog import page | `/admin/catalog-import/page.tsx` | 635 lines | Frontend import UI |
| Catalog API client | `lib/api/catalog-import.ts` | 117 lines | Frontend API layer |
| Static catalog data | `catalog-data.ts` | 3,559 lines | Frontend catalog data |
| Static master data | `master-data.ts` | 1,092 lines | Navigation/featured data |

---

## 2. Existing vs Required

### 2.1 Architecture Contract Requirements (from Domain Model Part 2)

| Required | Existing | Gap |
|----------|----------|-----|
| **Master Catalog DB** with CatalogCategory, CatalogSubcategory, CatalogItem models | No dedicated catalog models exist. Uses `Category` (self-referencing) + `ProductMaster` + `ServiceMaster` | **GAP**: No unified catalog schema. Current models partially cover this but are split across 3 models with different structures |
| **CSV as single source of truth** | Both seed and production pipelines already parse the CSV | **ALIGNED**: Infrastructure exists. Just needs to target new catalog models |
| **Product → Marketplace** rule | Product already has `categoryId` → Category | **ALIGNED**: Rule is already implemented |
| **Service → TradeServ** rule | ServiceMaster exists but has NO TradeServ backend built | **GAP**: ServiceMaster exists but no TradeServ service/professional/inquiry/proposal models consume it |
| **No duplicate taxonomies** | Two static frontend data files + one DB-backed category tree | **GAP**: Three separate category representations exist (DB, catalog-data.ts, master-data.ts) |

### 2.2 Catalog Model Comparison

| Aspect | Current (ProductMaster/ServiceMaster) | Required (Master Catalog) |
|--------|--------------------------------------|---------------------------|
| Unified model | Split across ProductMaster + ServiceMaster | Single CatalogItem with type enum |
| Category link | categoryId (FK, SetNull) | CatalogCategory + CatalogSubcategory FKs |
| Unit mapping | `unit: String?` | Reference to CatalogUnit table |
| Import tracking | Via ImportJob (already exists) | Same ImportJob pattern (reuse) |
| Search indexing | Never indexed in OpenSearch | Must index in OpenSearch |
| Admin management | No dedicated admin UI for ProductMaster/ServiceMaster | Admin catalog management UI |
| Frontend consumption | Static catalog-data.ts (3,559 lines) | API-driven from new catalog models |

### 2.3 What Must Be Created

| Item | Priority | Description |
|------|----------|-------------|
| **CatalogCategory model** | HIGH | Category from CSV (id, name, slug, icon, description, sortOrder, isActive) — distinct from existing `Category` model |
| **CatalogSubcategory model** | HIGH | Subcategory (id, categoryId, name, slug) |
| **CatalogItem model** | HIGH | Product or Service item (id, subcategoryId, name, slug, type: Product|Service, unit?, keywords[]) |
| **CatalogUnit model** | MEDIUM | Unit of measure reference table |
| **Import pipeline update** | HIGH | Modify existing import pipeline to populate new catalog models |
| **Catalog API** | HIGH | CRUD + search + filter endpoints for catalog models |
| **Admin catalog UI** | MEDIUM | Create/administer catalog categories/subcategories/items |
| **Frontend API client** | MEDIUM | Replace static catalog-data.ts with API-driven data |
| **OpenSearch index** | MEDIUM | Index catalog items for autocomplete and category search |

### 2.4 What Already Exists and Must Be Reused

| Component | Reuse As |
|-----------|----------|
| `CategoriesService` | Reuse for existing Category model (seller-facing product categories). New catalog models are separate. |
| `CsvParserService` | Reuse as-is for CSV parsing |
| `ImportOrchestratorService` | Extend to populate new catalog models |
| `ImportJob` / `ImportJobRow` | Reuse as-is for import tracking |
| `/admin/catalog-import` page | Extend to support catalog model management |
| `lib/api/catalog-import.ts` | Extend with catalog-specific endpoints |
| OpenSearch `categories` index | Reuse index definition, populate with catalog data |
| Seed pipeline (`prisma/seeds/`) | Reuse pattern, update target models |
| `catalog-data.ts` | Replace with API-driven data (static file becomes seed source metadata) |

---

## 3. Reusable Components

### 3.1 Backend (Full Reuse — No Changes Needed)

| Component | File | Why Reusable |
|-----------|------|-------------|
| `CsvParserService` | `catalog-import/services/csv-parser.service.ts` | Production-grade CSV parser with validation. Parses the exact 8-column CSV format. Returns categorized rows. No changes needed. |
| `ImportJob` model | `prisma/schema.prisma:3927` | Full tracking with status, row-level detail, checksum duplicate detection, rollback support. |
| `ImportJobRow` model | `prisma/schema.prisma:3955` | Per-row tracking with status, raw data JSON, errors array, checksum. |
| `ImportJobType` enum | `prisma/schema.prisma:3792` | Already has CATEGORY, SUBCATEGORY, PRODUCT_MASTER, SERVICE_MASTER values. |
| `ImportJobStatus` enum | `prisma/schema.prisma` | PENDING, RUNNING, COMPLETED, FAILED, PARTIAL, ROLLING_BACK, ROLLED_BACK. |

### 3.2 Backend (Partial Reuse — Extend)

| Component | File | Extension Needed |
|-----------|------|-----------------|
| `ImportOrchestratorService` | `catalog-import/services/import-orchestrator.service.ts` | Currently targets `Category` + `ProductMaster` + `ServiceMaster`. Add path to target new `CatalogCategory` + `CatalogSubcategory` + `CatalogItem` models. |
| `CatalogImportService` | `catalog-import/catalog-import.service.ts` | Add catalog-specific search, stats, and management methods. |
| `CatalogImportController` | `catalog-import/catalog-import.controller.ts` | Add catalog-specific endpoints alongside existing import endpoints. |
| Seed pipeline (`prisma/seeds/`) | `prisma/seeds/` | Currently seeds `Category` + `ProductMaster` + `ServiceMaster`. Add parallel seeding for new catalog models. |

### 3.3 Frontend (Full Reuse)

| Component | File | Why Reusable |
|-----------|------|-------------|
| Admin catalog import page | `/admin/catalog-import/page.tsx` | Full import management UI with stats, search, job tracking, auto-polling. Will manage both existing and new catalog imports. |
| `lib/api/catalog-import.ts` | `lib/api/catalog-import.ts` | Typed API client with all import operations. Add catalog-specific methods. |
| `CsvParserService` (toast patterns) | Various | Error handling, loading states, and toast patterns throughout admin pages. |

### 3.4 Frontend (Partial Reuse — Will Be Replaced)

| Component | File | Replacement |
|-----------|------|-------------|
| `catalog-data.ts` | `apps/web/data/catalog-data.ts` | Replace `CATALOG_CATEGORIES` static array with API-driven data from new catalog endpoints. Keep file as seed metadata reference. |
| `master-data.ts` | `apps/web/data/master-data.ts` | Replace `MASTER_CATEGORIES` (20 curated) with API-driven data. Keep navigation, mega menu, and other non-catalog data. |

### 3.5 Infrastructure (Full Reuse)

| Component | Purpose | Why Reusable |
|-----------|---------|-------------|
| OpenSearch cluster | Search indexing | Already configured. Existing `categories` index can be reused for catalog categories. |
| OpenSearch `categories` index | Category search | Index definition exists but is empty. Populate with catalog data. |
| OpenSearch `products` index | Product search | Already indexes product-level category info. No change needed. |

---

## 4. Components to Extend

### 4.1 ImportOrchestratorService — Add Catalog Import Path

Current flow:
```
CSV → parse → importCategories → Category table
           → importSubcategories → Category (parentId) table
           → importProductMasters → ProductMaster table
           → importServiceMasters → ServiceMaster table
           → createProducts → Product table
           → indexProducts → SearchService
```

Extended flow:
```
CSV → parse → importCatalogCategories → **CatalogCategory** table (NEW)
           → importCatalogSubcategories → **CatalogSubcategory** table (NEW)
           → importCatalogItems → **CatalogItem** table (NEW)
           [keep existing path for backward compatibility]
           → importCategories → Category table (existing)
           → importProductMasters → ProductMaster table (existing)
           → importServiceMasters → ServiceMaster table (existing)
```

### 4.2 CatalogImportController — Add Catalog Endpoints

Current endpoints are under `/catalog-import/`. Add:
- `GET /catalog/categories` — list catalog categories
- `GET /catalog/categories/:id/subcategories` — list subcategories
- `GET /catalog/items?category=&subcategory=&type=&search=` — search catalog items
- `GET /catalog/stats` — catalog statistics
- `GET /catalog/autocomplete?q=` — autocomplete for catalog items

### 4.3 Admin Page — Add Catalog Management

New admin pages:
- `/admin/catalog/categories` — Manage catalog categories (list, reorder, toggle active)
- `/admin/catalog/import` — Existing import page, extended with catalog models

Existing `/admin/categories` page (currently static mock data) should be replaced with real API data — but this is a separate concern from the Master Catalog.

### 4.4 OpenSearch — Populate Categories Index

Currently `categories` index is defined but empty. Must:
1. Index `CatalogCategory` records into OpenSearch on import
2. Add `CatalogItem` index for item-level search
3. Update `TradfindService.globalSearch()` to search new indexes

### 4.5 Frontend — Replace Static Data

Replace `CATALOG_CATEGORIES` usage across these files:
- `/admin/categories/page.tsx` → API call to backend categories
- `/categories/page.tsx` → API call to catalog categories
- `/trading/page.tsx` → API call
- `/industries/page.tsx` → API call
- `/rfq/new` → API call
- `/register/*` → API call
- `ProductDiscoveryClient.tsx` → API call (already has fallback pattern)

### 4.6 Existing Migrations Directory

Check `prisma/migrations/` for existing migration state. The new catalog models will require:
- New migration file(s) adding all catalog models
- No changes to existing models — fully additive

### 4.7 Future Architecture Reservations (No Implementation)

The following models are created in the Prisma schema but are **NOT populated** during Phase P-1. They are architecture reservations for future phases:

| Model | Purpose | Phase |
|-------|---------|-------|
| `CatalogAttribute` | Dynamic attributes per catalog item (e.g., "voltage", "gsm", "capacity" with typed values) | Future — after TradeServ |
| `CatalogAlias` | Synonyms and alternate names for catalog items (powers AI search matching and multilingual support) | Future — AI Search Phase |
| `CatalogIndustryMapping` | Links catalog subcategories/items to Industry model for relevance scoring and filtering | Future — Search Phase |
| AI fields on `CatalogItem` | `embeddingId?`, `aiSummary?`, `searchVector?` — reserved for future AI embedding and semantic search | Future — AI Search Phase |

**Rule**: These models exist in the schema but must not be populated, queried, or exposed via API until their respective future phase. They are compile-time reservations only.

### 4.8 Master Catalog Immutability Rules

The Master Catalog (CatalogCategory, CatalogSubcategory, CatalogItem) has special constraints:

| Rule | Enforcement |
|------|-------------|
| **No manual CRUD** on catalog data | Catalog models are INSERT-only during import. No UPDATE or DELETE through any API. The CSV is the only source of truth. |
| **No admin UI** for catalog data edits | Admin pages for catalog are view-only. Edits go through CSV re-import. |
| **CSV re-import is the only update mechanism** | To modify catalog data, update the CSV file and re-run the import pipeline. |
| **No API endpoints** for create/update/delete on catalog models | Only read endpoints (GET) are exposed. Writes happen exclusively through the import pipeline. |
| **Import is idempotent** | Re-importing the same CSV produces the same result. Updated CSV rows overwrite existing records. |

These rules do NOT apply to `CatalogAttribute`, `CatalogAlias`, or `CatalogIndustryMapping` — those are dynamic and may have CRUD in future phases.

---

## 5. Components That Must Never Change

### 5.1 Frozen Components

These are explicitly frozen by the architecture contract and Founder Commandments:

| Component | Reason | Reference |
|-----------|--------|-----------|
| **GOCASH Ledger Engine** (`gocash.service.ts`) | Financial immutability | Founder Commandment 9, Part 12 |
| **AI Gateway** (`AiGatewayService.process()`) | Central AI pipeline | Founder Commandment 9, Part 12 |
| **Role enum** (7 values) | Access backbone | Part 12 |
| **TradTrust 6 dimensions** | Scoring consistency | Founder Commandment 11, Part 12 |
| **Pagination format** | Frontend dependency (55 files) | Part 12 |
| **API response format** | Frontend dependency (TransformInterceptor) | Part 12 |
| **Notification types** (135 values) | Production stability | Part 12 |

### 5.2 Existing Category/Product Models That Must NOT Change

| Model | Reason | Constraint |
|-------|--------|-----------|
| **Category** (existing model) | 10 direct relations, 50+ dependent files, seed pipeline targets it | **Extend only** — add new catalog models alongside. Do not modify existing Category schema. |
| **Product** (existing model) | 42 fields, 19 relations, 22+ dependent models, seller workflows | **No changes.** Product.categoryId remains an optional link to Category (not CatalogCategory). |
| **ProductMaster** (existing model) | 18 fields, seed pipeline targets it, referenced by Product and ProductClaim | **Keep as-is.** New CatalogItem is separate. ProductMaster can eventually be deprecated in favor of CatalogItem. |
| **ServiceMaster** (existing model) | 16 fields, seed pipeline targets it | **Keep as-is.** Same deprecation path as ProductMaster. |
| **CompanyCategory** (junction) | 2 fields, links Company ↔ existing Category for seller classification | **No change.** This is a company-to-marketing-category link, separate from catalog taxonomy. |
| **Industry** model | 6 fields, 3 relations | **No change.** Industries are distinct from catalog categories. |

### 5.3 Existing APIs That Must NOT Change

| API | Reason |
|-----|--------|
| `GET /categories` | Public, consumed by ProductDiscoveryClient, wizard, SEO pages |
| `GET /categories/tree` | Public, consumed by category browsing |
| `GET /categories/:slug` | Public, consumed by category detail pages |
| `POST /categories` | Auth-guarded (needs role fix but schema stays same) |
| `GET /products?categoryId=` | Consumed by search and filter pages |
| All 19 `/catalog-import/*` endpoints | Existing import pipeline, must continue working |

---

## 6. CSV Import Strategy

### 6.1 Current State

Both the seed pipeline and production API pipeline already parse the CSV and populate:
- `Category` (for both categories and subcategories via parentId)
- `ProductMaster` (for product catalog items)
- `ServiceMaster` (for service catalog items)

### 6.2 Strategy: Additive, Not Replacive

**Do NOT modify the existing import pipeline.** Instead, add a new parallel import path:

```
CSV (product service catalog.csv, 33,600 rows)
 │
 ├──► Existing Path (unchanged)
 │       ├── CategoriesSeeder → Category table (self-referencing)
 │       ├── SubcategoriesSeeder → Category.parentId
 │       ├── ProductMastersSeeder → ProductMaster table
 │       └── ServiceMastersSeeder → ServiceMaster table
 │
 └──► New Catalog Path (additive)
         ├── CatalogCategoriesImporter → CatalogCategory table (NEW)
         ├── CatalogSubcategoriesImporter → CatalogSubcategory table (NEW)
         ├── CatalogProductsImporter → CatalogItem (type=Product) table (NEW)
         └── CatalogServicesImporter → CatalogItem (type=Service) table (NEW)
```

### 6.3 Import Steps

| Step | Action | Target | Depends On |
|------|--------|--------|------------|
| 1 | Parse CSV header + validate | `CsvParserService` (reuse) | — |
| 2 | Extract unique categories | Deduplicate column 2 | Step 1 |
| 3 | Import CatalogCategories | `CatalogCategory` table | Step 2 |
| 4 | Extract unique subcategories per category | Deduplicate column 3 per category | Step 2 |
| 5 | Import CatalogSubcategories | `CatalogSubcategory` table | Steps 3-4 |
| 6 | Filter `Type = Product` rows | 25,600 rows | Step 1 |
| 7 | Import Product CatalogItems | `CatalogItem (type=Product)` table | Steps 5-6 |
| 8 | Filter `Type = Service` rows | 8,000 rows | Step 1 |
| 9 | Import Service CatalogItems | `CatalogItem (type=Service)` table | Steps 5, 8 |
| 10 | Index in OpenSearch | `categories` + `catalog-items` indexes | Steps 3, 5, 7, 9 |
| 11 | Record ImportJob metadata | `ImportJob` table | All above |

### 6.4 Import Guarantees

| Property | Mechanism |
|----------|-----------|
| **Idempotency** | Checksum-based duplicate detection via `ImportJobRow.checksum` |
| **Rollback** | Transactional import per step; `ImportJob` rollback flag |
| **Resume** | `ImportJobRow.status` tracking allows resume from last failed row |
| **Validation** | Per-row validation with error collection (already implemented in CsvParserService) |
| **Audit** | `ImportJob` stores full metadata; `ImportJobRow` stores raw + validated data |

### 6.5 CSV-to-Model Mapping

| CSV Column | Target Field | Example |
|------------|-------------|---------|
| `Category (Landing Page)` | `CatalogCategory.name` | "Accounting Services" |
| `Sub Category` | `CatalogSubcategory.name` | "Tax Consulting" |
| `Product / Service Name` | `CatalogItem.name` | "Accounting Ledger Book" |
| `Type` | `CatalogItem.type` (Product|Service) | "Product" |
| `Unit Mapping` | `CatalogItem.unit` | "Litre" |
| `Alt / Secondary Units` | `CatalogItem.altUnits` | "Barrel" |
| `Quantity Parameters` | `CatalogItem.quantityParams` | "20" |

---

## 7. Master Catalog Integration Strategy

### 7.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Master Catalog Domain                        │
│                                                                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ CatalogCategory │  │ CatalogSubcategory│  │   CatalogItem    │   │
│  │ (160 rows)      │──│ (1,600 rows)      │──│ (33,600 rows)    │   │
│  │ id, name, slug  │  │ id, categoryId    │  │ id, subcategoryId │   │
│  │ icon, sortOrder │  │ name, slug        │  │ name, type, unit  │   │
│  │ isActive        │  │                   │  │ altUnits, keywords│   │
│  └────────┬───────┘  └────────┬──────────┘  └────────┬─────────┘   │
│           │                   │                       │             │
│           └───────────────────┴───────────────────────┘             │
│                              │                                      │
│                              ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                  Catalog Service API                        │     │
│  │  GET /catalog/categories    GET /catalog/items             │     │
│  │  GET /catalog/subcategories GET /catalog/search            │     │
│  │  GET /catalog/autocomplete  GET /catalog/stats             │     │
│  └───────────────────────┬────────────────────────────────────┘     │
│                          │                                          │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┬────────────────────┐
          ▼                ▼                ▼                    ▼
   ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────────┐
   │ Marketplace│  │  TradeServ  │  │   TradeRFQ   │  │    Search      │
   │ (Products) │  │ (Services)  │  │ (Categories) │  │  (Facets +     │
   │            │  │            │  │              │  │  Autocomplete)  │
   └────────────┘  └────────────┘  └──────────────┘  └────────────────┘
```

### 7.2 Integration Points

| Consumer Domain | Integration | Mechanism | Status |
|----------------|-------------|-----------|--------|
| **Marketplace** (Product) | Category selection in product create/edit | `Select category from CatalogCategory` | New — replace current `Category` dropdown |
| **TradeServ** (Service) | Category selection in service listing | `Select subcategory from CatalogSubcategory where type=Service` | New — no TradeServ backend yet |
| **TradeRFQ** (Rfq) | Category filter on RFQ creation | `Select category from CatalogCategory` | New — currently uses Category or static data |
| **Search** (TradFind) | Category facets + autocomplete | Index `CatalogCategory` + `CatalogItem` in OpenSearch | New — categories index currently empty |
| **AI Domain** | Context for prompts | Pass catalog category/subcategory/item as prompt context | New — enrich AI prompts with catalog taxonomy |
| **Admin UI** | Catalog management | CRUD on catalog models | New — no admin UI exists for catalog taxonomy |

### 7.3 Phase P-1 Scope (Master Catalog Import Only)

Phase P-1 is the **database import** of the 33,600-item CSV into new catalog models. It includes:

| In Scope | Detail |
|----------|--------|
| All 7 Prisma models | CatalogCategory, CatalogSubcategory, CatalogItem, CatalogAttribute, CatalogAlias, CatalogIndustryMapping, CatalogUnit |
| 1 enum | CatalogItemType (Product, Service) |
| Reserved AI fields | searchVector, embeddingId, aiSummary, keywords, synonyms, seoTitle, seoDescription on CatalogItem |
| Import pipeline extension | Populate CatalogCategory, CatalogSubcategory, CatalogItem from CSV |
| Existing import path | Keep unchanged (Category, ProductMaster, ServiceMaster) |

It does NOT include:

| Out of Scope | Reasoning |
|-------------|-----------|
| Populating CatalogAttribute | Architecture reservation only — no CSV data |
| Populating CatalogAlias | Architecture reservation only — future AI search phase |
| Populating CatalogIndustryMapping | Architecture reservation only — requires Industry model integration |
| Populating CatalogUnit | Separate future phase |
| Using AI fields | Reserved — not populated or queried |
| Replacing frontend static data | Separate frontend phase after catalog API is built |
| Updating OpenSearch indexes | Separate infrastructure phase |
| Building admin catalog management UI | Separate admin phase |
| Changing Product.categoryId to reference CatalogCategory | Separate integration phase |
| Deprecating ProductMaster/ServiceMaster | Future — only after all consumers migrate to catalog models |

### 7.4 Post P-1 Integration Roadmap

| Phase | Scope | Duration |
|-------|-------|----------|
| **P-0.5** | Audit (this document) | Complete |
| **P-1** | DB import: new catalog models + import pipeline | 2 weeks |
| **P-1.5** | Catalog API: CRUD + search + filter endpoints | 1 week |
| **P-1.7** | Admin catalog management UI | 1 week |
| **P-2** | Frontend migration: replace static data with API calls | 1 week |
| **P-2.5** | OpenSearch: populate categories + catalog-items indexes | 1 week |
| **P-3** | TradeServ: consume catalog services | Part of TradeServ build |

---

## 8. Database Impact

### 8.1 New Models Required

#### CatalogCategory
```prisma
model CatalogCategory {
  id          String  @id @default(cuid())
  slug        String  @unique
  name        String
  icon        String?
  description String?
  seoTitle    String?
  seoDescription String?
  sortOrder   Int     @default(0)
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  subcategories     CatalogSubcategory[]
  industryMappings  CatalogIndustryMapping[]

  @@index([slug])
  @@index([isActive])
  @@index([sortOrder])
}
```

#### CatalogSubcategory
```prisma
model CatalogSubcategory {
  id         String @id @default(cuid())
  categoryId String
  slug       String
  name       String
  seoTitle   String?
  seoDescription String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  category          CatalogCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  items             CatalogItem[]
  industryMappings  CatalogIndustryMapping[]

  @@unique([categoryId, slug])
  @@index([categoryId])
  @@index([slug])
}
```

#### CatalogItem
```prisma
enum CatalogItemType {
  Product
  Service
}

model CatalogItem {
  id              String           @id @default(cuid())
  subcategoryId   String
  type            CatalogItemType
  name            String
  slug            String           @unique
  unit            String?
  altUnits        String?
  quantityParams  String?
  // Search & SEO fields
  keywords        String[]
  synonyms        String[]
  seoTitle        String?
  seoDescription  String?
  // Reserved AI fields — not yet implemented
  searchVector    String?          // Reserved: vector embedding text
  embeddingId     String?          // Reserved: external embedding model ID
  aiSummary       String?          // Reserved: AI-generated item summary
  // Audit
  isActive        Boolean          @default(true)
  sourceData      Json?            // Original CSV row for audit trace
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  subcategory       CatalogSubcategory @relation(fields: [subcategoryId], references: [id], onDelete: Cascade)
  attributes        CatalogAttribute[]
  aliases           CatalogAlias[]
  industryMappings  CatalogIndustryMapping[]

  @@index([subcategoryId])
  @@index([type])
  @@index([slug])
  @@index([keywords])
  @@index([synonyms])
  @@index([isActive])
}
```

#### CatalogAttribute (Architecture Reservation)
```prisma
model CatalogAttribute {
  id           String   @id @default(cuid())
  catalogItemId String
  key          String
  label        String?
  value        String
  unit         String?
  sortOrder    Int      @default(0)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  catalogItem CatalogItem @relation(fields: [catalogItemId], references: [id], onDelete: Cascade)

  @@unique([catalogItemId, key])
  @@index([catalogItemId])
  @@index([key])
  @@index([isActive])
}
```

#### CatalogAlias (Architecture Reservation)
```prisma
model CatalogAlias {
  id            String  @id @default(cuid())
  catalogItemId String
  alias         String
  locale        String  @default("en")
  isActive      Boolean @default(true)
  createdAt     DateTime @default(now())

  catalogItem CatalogItem @relation(fields: [catalogItemId], references: [id], onDelete: Cascade)

  @@unique([catalogItemId, alias])
  @@index([catalogItemId])
  @@index([alias])
  @@index([locale])
}
```

#### CatalogIndustryMapping (Architecture Reservation)
```prisma
model CatalogIndustryMapping {
  id                String @id @default(cuid())
  industryId        String
  catalogCategoryId   String?
  catalogSubcategoryId String?
  catalogItemId       String?
  relevanceScore    Float   @default(1.0)
  isPrimary         Boolean @default(false)
  createdAt         DateTime @default(now())

  category    CatalogCategory?    @relation(fields: [catalogCategoryId], references: [id], onDelete: Cascade)
  subcategory CatalogSubcategory? @relation(fields: [catalogSubcategoryId], references: [id], onDelete: Cascade)
  item        CatalogItem?        @relation(fields: [catalogItemId], references: [id], onDelete: Cascade)

  @@index([industryId])
  @@index([catalogCategoryId])
  @@index([catalogSubcategoryId])
  @@index([catalogItemId])
  @@index([isPrimary])
}
```

#### CatalogUnit (optional, medium priority)
```prisma
model CatalogUnit {
  id        String @id @default(cuid())
  name      String @unique     // "Litre", "Piece", "Kilogram", etc.
  symbol    String             // "L", "pc", "kg"
  category  String?            // "Volume", "Count", "Weight"
  createdAt DateTime @default(now())
}
```

### 8.2 Model Count Impact

| Metric | Value |
|--------|-------|
| New models | 7 (CatalogCategory, CatalogSubcategory, CatalogItem, CatalogAttribute, CatalogAlias, CatalogIndustryMapping, CatalogUnit) |
| New enums | 1 (CatalogItemType: Product, Service) |
| Existing models modified | 0 (fully additive) |
| Existing relations modified | 0 |
| Total Prisma models after P-1 | 238 (was 231) |

### 8.3 Populated vs Reserved

| Model | Populated in P-1? | Data Source |
|-------|-------------------|-------------|
| `CatalogCategory` | ✅ Yes | CSV column 2 (160 rows) |
| `CatalogSubcategory` | ✅ Yes | CSV column 3 grouped by category (1,600 rows) |
| `CatalogItem` | ✅ Yes | CSV rows 1-33,600 (33,600 rows) |
| `CatalogAttribute` | ❌ No — reserved | No CSV data. Future use. |
| `CatalogAlias` | ❌ No — reserved | Can be generated from item names. Future use. |
| `CatalogIndustryMapping` | ❌ No — reserved | Requires Industry model integration. Future use. |
| `CatalogUnit` | ❌ No — future | Requires unit extraction from CSV. Separate phase. |

### 8.3 Row Count Estimates

| Table | Estimated Rows | Growth |
|-------|---------------|--------|
| CatalogCategory | 160 | Static (only changes if CSV updates) |
| CatalogSubcategory | 1,600 | Static |
| CatalogItem | 33,600 | Static |
| CatalogUnit | ~50 | Reference data |

### 8.4 No-Modify Guarantees

The following **must not change** in this phase:
- `Category` model — unchanged (still powers seller-facing product categorization)
- `Product` model — unchanged
- `ProductMaster` model — unchanged
- `ServiceMaster` model — unchanged
- `CompanyCategory` model — unchanged
- `Industry` model — unchanged
- All existing indexes, relations, and onDelete policies — unchanged

---

## 9. Migration Strategy

### 9.1 Principle: Zero-Downtime Additive Migration

New catalog tables are created alongside existing tables. No existing table is modified or dropped.

### 9.2 Migration Steps

| Step | Action | Risk |
|------|--------|------|
| 1 | Create migration: `prisma migrate dev --name add_catalog_models` | Low — additive only |
| 2 | Verify no existing models are modified in generated migration | Medium — must audit migration file |
| 3 | Run migration on staging | Low |
| 4 | Validate new tables are empty | Low |
| 5 | Run seed pipeline or import API to populate | Medium — depends on import correctness |
| 6 | Validate row counts match CSV expectations | Low |
| 7 | Run on production (repeat steps 3-6) | Low — additive |

### 9.3 Rollback Plan

Since the migration is purely additive:
- **Rollback**: `prisma migrate down` to remove new tables
- **No data loss**: No existing tables are affected
- **No application changes required**: Existing code continues to work without new tables

### 9.4 Data Integrity Checks

After import, verify:
- `CatalogCategory` count = 160 (all unique categories from CSV)
- `CatalogSubcategory` count = 1,600 (all unique subcategories)
- `CatalogItem` count = 33,600 (all rows)
- `CatalogItem.type = Product` count = 25,600
- `CatalogItem.type = Service` count = 8,000
- No orphan subcategories (every subcategory has a valid category)
- No orphan items (every item has a valid subcategory)
- All slugs are unique

### 9.5 Post-Migration Cleanup

| Task | Timing |
|------|--------|
| Verify seed pipeline still runs (existing path) | Immediately after migration |
| Verify import API still works (existing path) | Immediately after migration |
| Verify all existing category-related APIs unchanged | Immediately after migration |
| Remove temporary comments about "generated from CSV" after catalog API is built | Post P-1 |

---

## 10. Risks

### 10.1 Architecture Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Two category systems coexist**: Existing `Category` (selller-facing) + new `CatalogCategory` (master catalog). Confusion about which to use. | Developer confusion, mis-integration | HIGH | Clear documentation in README and AGENTS.md. CatalogCategory = taxonomy source. Category = seller product categorization. |
| **Import pipeline duplication**: Seed pipeline and production API pipeline both parse the same CSV but independently. | Inconsistent behavior | MEDIUM | Add catalog import path to both pipelines simultaneously. |
| **Existing Category model never aligns with Master Catalog**: Products link to `Category` via `categoryId`. They should ideally link to `CatalogCategory`. | Two systems forever | MEDIUM | Document this as a future consolidation phase. Do not attempt in P-1. |

### 10.2 Data Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **CSV format changes** in the future | Import pipeline breaks | LOW | The CSV is frozen as the permanent source. Format changes require architecture review. |
| **Static frontend data drifts from DB** | Inconsistent catalog display | MEDIUM | Replace static data with API calls in post-P-1 phase. |
| **Duplicate catalog entries** if import runs multiple times | Data pollution | LOW | Checksum-based deduplication via ImportJobRow already exists. |

### 10.3 Performance Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **33,600 rows imported in single transaction** | Transaction timeout, memory pressure | LOW | Batch import in chunks of 500. ImportJobRow pattern already supports batch processing. |
| **OpenSearch indexing of 33,600 items** | Indexing load | LOW | Batch indexing with bulk API. Can run as background job. |

### 10.4 Security Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Existing Category endpoints lack ADMIN role guard** | Any user can modify taxonomy | HIGH (pre-existing) | This is a pre-existing issue NOT in scope of P-1. Document in audit. |
| **New catalog endpoints also need guard** | Same vulnerability | MEDIUM | Ensure new catalog endpoints use `@Roles('ADMIN')` or `@Roles('SUPER_ADMIN')` |
| **Import API accessible to non-admins** | Unauthorized data modification | LOW | Existing `/catalog-import/` endpoints require JWT auth. Verify ADMIN guard. |

### 10.5 Migration Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Prisma migration accidentally modifies existing models** | Schema drift, broken relations | LOW | Audit generated migration file before running. Run `prisma migrate diff` to preview. |
| **Seed pipeline breaks after migration** | Development workflow disrupted | MEDIUM | Run seed immediately after migration to verify both old and new paths work. |

---

## P-1.1 Security Hotfix: Category Endpoint RBAC

### Issue

Current `CategoriesController` write endpoints use `@UseGuards(JwtAuthGuard)` but **no** `@Roles()` guard. Any authenticated user (buyer, seller, any role) can create, update, or delete categories:

| Endpoint | Current Auth | Required Auth |
|----------|-------------|---------------|
| `POST /categories` | JWT (any role) | JWT + ADMIN/SUPER_ADMIN |
| `PATCH /categories/:id` | JWT (any role) | JWT + ADMIN/SUPER_ADMIN |
| `DELETE /categories/:id` | JWT (any role) | JWT + ADMIN/SUPER_ADMIN |
| All `/admin/templates/*` | JWT (any role) | JWT + ADMIN/SUPER_ADMIN |

### Fix

Apply `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')` decorator to:
1. `CategoriesController.create()` — `POST /categories`
2. `CategoriesController.update()` — `PATCH /categories/:id`
3. `CategoriesController.remove()` — `DELETE /categories/:id`
4. `CategoryTemplatesController` — all endpoints (already under `/admin/templates/` path but missing role enforcement)

### Priority

**HIGH** — This is a pre-existing security vulnerability. Must be fixed immediately after Phase P-1 migration is validated.

### Execution

This hotfix is a **separate task** from Phase P-1. It touches only existing code (controller decorators), not new catalog models. It should take < 30 minutes and be deployed as a hotfix patch.

---

## Summary: State of Readiness

| Dimension | Readiness | Notes |
|-----------|-----------|-------|
| CSV import infrastructure | 🟢 EXISTING | CsvParserService, ImportOrchestratorService, ImportJob model all production-ready |
| Seed pipeline | 🟢 EXISTING | `prisma/seeds/` has modular seeders for Category/ProductMaster/ServiceMaster |
| Admin import UI | 🟢 EXISTING | `/admin/catalog-import` page with stats, job tracking, search |
| Category API | 🟢 EXISTING | 7 endpoints, full CRUD with tree/breadcrumbs |
| Catalog target models | 🔴 NOT YET CREATED | CatalogCategory, CatalogSubcategory, CatalogItem |
| Catalog import path | 🔴 NOT YET CREATED | New importers parallel to existing ones |
| Catalog API | 🔴 NOT YET CREATED | CRUD + search + filter endpoints |
| Admin catalog UI | 🔴 NOT YET CREATED | Category/subcategory management pages |
| OpenSearch catalog index | 🔴 EMPTY | Index definitions exist but never populated |
| Static frontend data | 🟡 TEMPORARY | catalog-data.ts + master-data.ts will be replaced post-P-1 |

---

## Audit Coverage

| # | Audit Dimension | Status | Findings |
|---|----------------|--------|----------|
| 1 | Existing Prisma Category models | ✅ AUDITED | Self-referencing tree, 13 fields, 10 relations |
| 2 | Existing Product models | ✅ AUDITED | 42 fields, 19 relations, soft-delete pattern |
| 3 | Existing Service models | ✅ AUDITED | ServiceMaster exists (16 fields) but no TradeServ backend |
| 4 | Existing Marketplace hierarchy | ✅ AUDITED | Category → Product → Company, CompanyCategory junction |
| 5 | Existing OpenSearch indexes | ✅ AUDITED | 4 indexes defined, categories + industries EMPTY |
| 6 | Existing Search architecture | ✅ AUDITED | TradFindService orchestrator, 10 sub-services, geo-capable |
| 7 | Existing Category APIs | ✅ AUDITED | 7 endpoints, no ADMIN role guard on writes |
| 8 | Existing Seeder files | ✅ AUDITED | 5 modular seeders, 2 parallel pipelines (seed + API) |
| 9 | Existing CSV import utilities | ✅ AUDITED | CsvParserService + ImportOrchestratorService production-ready |
| 10 | Existing Admin category management | ✅ AUDITED | Static mock page (no real CRUD), catalog import page works |
| 11 | Existing validation rules | ✅ AUDITED | DTOs with class-validator, inconsistencies between modules |
| 12 | Existing dependencies on Category/Product | ✅ AUDITED | 12 models with categoryId, 22 models with productId |

---

**End of Audit.**

No implementation, Prisma changes, database migration, or API changes begin until Founder approval of this audit and Phase P-1 scope.
