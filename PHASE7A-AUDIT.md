# Phase 7A — Full Monorepo Audit Report

Generated: 2026-06-16

## Production Readiness Score: 62/100

| Category | Score | Status |
|----------|-------|--------|
| Schema & Migrations | 70 | Good single migration, no dead models |
| Backend Modules | 75 | 36/37 modules registered; CatalogImport is dead code |
| API Contracts | 55 | Catalog-import frontend/backend paths MISMATCH |
| Frontend Pages | 80 | 99 pages covering all major flows |
| React Query Hooks | 70 | 32 hooks, but missing bestseller & onboarding submit hooks |
| Jobs & Cron | 85 | 12 queues, 17 cron jobs, well-organized |
| Security & Guards | 90 | JWT, Roles, CompanyOwner, Permissions guards in place |
| ClickHouse/Analytics | 65 | Basic events tracked, no seller-facing analytics |
| Import Readiness | 30 | CatalogImport dead code, no product import pipeline |
| Seeding | 0 | No seed infrastructure at all |
| Testing | 45 | P0 suites pass, but 294 tests fail (DI mock issues) |

---

## 1. Gap Analysis

### 1.1 Schema Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| Company model has no direct `city`/`state` fields | Bestseller near-me queries rely on nullable snapshot fields | P2 |
| No `BulkImportJob` or `ProductImportJob` models | Cannot track product-level import operations | P1 |
| No `ImportMapping` table for CSV-to-database field mapping | Manual mapping required for every import format | P2 |
| No `CategoryAlias` or `CategorySynonym` model | CSV has different category names than DB | P1 |
| No `ProductDraft` → `ProductImportJob` link | Cannot trace which import job created which product | P2 |

### 1.2 Backend Module Gaps

| Gap | Detail | Priority |
|-----|--------|----------|
| **CatalogImportModule NOT registered** | Exists at `src/catalog-import/` but NOT in `app.module.ts`. All 6 endpoints are unreachable | P1 |
| `retryImport` endpoint exists on frontend | Frontend calls `POST /catalog-import/jobs/:id/retry` but no backend handler | P1 |
| API path mismatch: frontend uses `/jobs` backend uses `/import` | Frontend: `/catalog-import/jobs` → Backend: `/api/v1/catalog-import/import` | P1 |
| No `startImport` handler for direct product creation | CatalogImport only creates ProductMaster/ServiceMaster, not actual Product records | P1 |
| BestsellerAnalyticsService incomplete | Tracks calculation metadata but not integrated with ClickHouse events | P2 |

### 1.3 Frontend API & Hook Gaps

| Gap | Detail | Priority |
|-----|--------|----------|
| No React Query hooks for bestsellers | Products API has `/bestsellers`, `/trending`, `/top-categories`, `/top-sellers`, `/near-me` but no hooks | P2 |
| No hook for product onboarding submit | Backend has `POST /draft/:id/submit` but no React Query mutation | P2 |
| No hook for completeness score | Backend has `GET /draft/:id/completeness` but no React Query query | P3 |
| No hook for onboarding templates | Backend has `GET /templates/:categoryId` but no React Query hook | P3 |

### 1.4 UI Screen Gaps

| Gap | Detail | Priority |
|-----|--------|--------|
| No bestsellers/trending display on seller dashboard | Backend has the data, frontend doesn't show it | P2 |
| Beta product-import page is a checklist only | No actual import functionality, just static guide | P1 |
| No "Claim Product" UI for sellers to claim imported master records | Sellers can't find and claim ProductMaster records | P1 |
| No category mapping UI | No way to reconcile CSV categories with DB categories | P1 |
| No import mapping configuration screen | Admin can't configure how CSV columns map to DB fields | P2 |

---

## 2. Dead Code Report

| Dead Code | Location | Lines | Reason |
|-----------|----------|-------|--------|
| **CatalogImportModule** | `apps/api/src/catalog-import/` | ~400 | Module not imported in `app.module.ts` |
| `CatalogImportController` all 6 endpoints | `catalog-import.controller.ts` | ~120 | Routes unreachable (module not registered) |
| `CatalogImportService:startImport` with `data` param | `catalog-import.service.ts` | ~200 | Accepts file OR data array, but only file path exercised |
| `retryImport` frontend API call | `apps/web/lib/api/catalog-import.ts:111` | 3 | No backend handler exists |
| Beta product-import guide page | `apps/web/app/seller/beta/product-import/page.tsx` | 181 | Static checklist only, no import logic |
| `getProductImportGuide` beta API call | `apps/web/lib/api/beta.ts` (inferred) | - | Likely returns hardcoded steps |

**Note:** CatalogImportModule is recent code clearly written for this phase. Consider it "dormant" rather than abandoned, but it still needs registration and path fixes.

---

## 3. Missing Migrations

| Migration Needed | Reason | Priority |
|-----------------|--------|----------|
| Register CatalogImportModule in app.module.ts | No schema change, just code config | P1 (immediate) |
| Add `city`/`state` columns to Company model | Enables proper near-me filtering | P2 |
| Create `BulkImportJob` model | Track product-level imports | P1 |
| Create `ImportMapping` model | Store CSV-to-DB field mappings | P2 |
| Add `CategoryAlias`/`CategorySynonym` model | Map CSV category names to DB categories | P1 |
| Fix frontend API paths to match backend | No schema change, just code config | P1 (immediate) |

---

## 4. Missing APIs

| Missing API | Needed For | Priority |
|-------------|-----------|----------|
| `POST /catalog-import/jobs/:id/retry` | Frontend calls this but no handler | P1 |
| `POST /catalog-import/import-products` | Import actual Product records from CSV | P1 |
| `POST /catalog-import/map-categories` | Map CSV categories to DB categories | P1 |
| `GET /catalog-import/csv-preview` | Preview CSV before import | P2 |
| `POST /products/claim-master/:masterId` | Seller claims a ProductMaster as their product | P1 |
| `GET /products/bestsellers/hooks` | React Query hooks for bestseller data | P2 |

---

## 5. Missing UI Screens

| Missing Screen | Route | Priority |
|----------------|-------|----------|
| CSV Upload & Preview | `/admin/catalog-import/upload` | P1 |
| Category Mapping | `/admin/catalog-import/map-categories` | P1 |
| Product Import Results | `/admin/catalog-import/results/:jobId` | P1 |
| Claim Master Products | `/seller/catalog/claim` | P1 |
| Bestseller Analytics Dashboard | `/seller/analytics/bestsellers` | P2 |

---

## 6. Product Import Strategy

### Phase 1 (P1): Enable Existing Infrastructure
1. Register `CatalogImportModule` in `app.module.ts`
2. Fix frontend API paths: `/catalog-import/jobs` → `/catalog-import/import`
3. Add `POST /catalog-import/jobs/:id/retry` backend endpoint
4. Verify all 6 catalog-import endpoints work end-to-end

### Phase 2 (P1): CSV Import Pipeline
1. Add `POST /catalog-import/import-from-csv` endpoint
2. Accept CSV file → parse 33,600 rows → deduplicate by checksum
3. Validate rows: name required, type must be Product/Service
4. Create Category records from unique categories (160 found in CSV)
5. Create Subcategory records from unique subcategories (1,544)
6. Create ProductMaster/ServiceMaster records (25,600 products + 8,000 services)

### Phase 3 (P1): Category Master Strategy
1. Map CSV categories to existing DB categories via slug
2. Create missing categories in DB
3. Support alias/synonym mapping for category name differences
4. Build category tree preserving parent-child from CSV Sub Category field

### Phase 4 (P1): Product Master Strategy
1. Extend `ProductMaster` import to create minimal `Product` stubs
2. Each stub: status=DRAFT, companyId=unassigned, linked to master record
3. Add `claimProduct` endpoint for sellers to claim unassigned products
4. Track which products are claimed vs unclaimed

### Phase 5 (P2): Seller Enrichment
1. After claiming, seller adds pricing, images, variants, inventory
2. Uses existing `ProductOnboardingModule` / `ProductDraft` flow
3. Product goes from CLAIMED → DRAFT → ACTIVE via existing publish flow

---

## 7. Category Master Strategy

1. **Parse CSV categories**: Extract all unique Category values (160)
2. **Parse CSV subcategories**: Extract all unique Sub Category values (1,544)
3. **Build tree**: Each Sub Category is child of its Category
4. **Dedup**: Check existing Category records by slug; skip if exists
5. **Upsert**: Create new with auto-generated slugs; update existing with SEO fields
6. **Relations**: Set `parentId` for subcategories pointing to parent category

---

## 8. Product Master Strategy

1. **Parse Type field**: Product → ProductMaster, Service → ServiceMaster
2. **Parse Unit Mapping**: Set as `unit` field on master record
3. **Generate keywords**: Auto-extract from name, split by whitespace/special chars
4. **Generate synonyms**: From Alt/Secondary Units column
5. **Parse Quantity Parameters**: Store as JSON in `sourceData` field
6. **Dedup**: Use checksum (name + type + category) to skip duplicates
7. **Link categories**: Set `categoryId` and `subcategoryId` from created/upserted categories

---

## 9. Seeder Strategy

Current state: **No seed files exist anywhere in the codebase.**

### Required Seeders (P2):
1. **Category Seeder**: Pre-populate 160 categories + 1,544 subcategories from CSV
2. **Product Master Seeder**: Pre-populate 25,600 ProductMaster records
3. **Service Master Seeder**: Pre-populate 8,000 ServiceMaster records
4. **Test Data Seeder**: Create sample companies, users, products for development
5. **Attribute Template Seeder**: Pre-populate category-specific onboarding templates

### Implementation:
- Create `prisma/seed.ts` with seed orchestration
- Create individual seeders in `prisma/seed/` directory
- Use batch processing (100 at a time) for large datasets
- Add `pnpm prisma:seed` script to package.json

---

## 10. P1/P2/P3 Priority Task List

### P1 — Must Fix Before Product Import (Week 1)
| # | Task | Owner |
|---|------|-------|
| 1 | Register CatalogImportModule in app.module.ts | Backend |
| 2 | Fix frontend API paths to match backend (`/jobs` → `/import`) | Frontend |
| 3 | Add `POST /catalog-import/jobs/:id/retry` backend endpoint | Backend |
| 4 | Add CSV upload + parse endpoint | Backend |
| 5 | Add Category creation from CSV | Backend |
| 6 | Add ProductMaster/ServiceMaster creation from CSV | Backend |
| 7 | Add category mapping UI (`/admin/catalog-import/map-categories`) | Frontend |
| 8 | Add CSV preview UI (`/admin/catalog-import/upload`) | Frontend |
| 9 | Add "Claim Product" API + UI for sellers | Fullstack |
| 10 | Verify end-to-end import flow with actual CSV | QA |

### P2 — Should Have (Week 2)
| # | Task | Owner |
|---|------|-------|
| 1 | Add city/state to Company model (migration) | Backend |
| 2 | Create ProductImportJob model (migration) | Backend |
| 3 | Add bestseller React Query hooks | Frontend |
| 4 | Display bestsellers/trending on seller dashboard | Frontend |
| 5 | Create CategoryAlias/CategorySynonym model (migration) | Backend |
| 6 | Add ImportMapping model (migration + UI) | Fullstack |
| 7 | Implement prisma/seed.ts with category + product master seeders | Backend |
| 8 | Add product onboarding submit hook | Frontend |
| 9 | Add completeness score hook + UI | Frontend |

### P3 — Nice to Have (Week 3+)
| # | Task | Owner |
|---|------|-------|
| 1 | Bestseller Analytics Dashboard page | Frontend |
| 2 | Attribute template onboarding hooks | Frontend |
| 3 | ClickHouse integration for bestseller analytics | Backend |
| 4 | Bulk edit UI for imported product masters | Frontend |
| 5 | Import history dashboard with filtering | Frontend |
| 6 | Fix 294 failing tests (DI mock issues) | Backend |

---

## 11. API Contract Validation

### Catalog Import: Frontend vs Backend

| Frontend Call | Expected Backend | Actual Backend | Status |
|--------------|-----------------|----------------|--------|
| `GET /catalog-import/stats` | `GET /api/v1/catalog-import/stats` | ✅ Same | OK |
| `GET /catalog-import/jobs` | `GET /api/v1/catalog-import/jobs` | `GET /import` (different path!) | ❌ MISMATCH |
| `GET /catalog-import/jobs/:id` | `GET /api/v1/catalog-import/jobs/:id` | `GET /import/:jobId` | ❌ MISMATCH |
| `POST /catalog-import/start` | `POST /api/v1/catalog-import/start` | `POST /import` | ❌ MISMATCH |
| `POST /catalog-import/jobs/:id/rollback` | `POST /api/v1/catalog-import/jobs/:id/rollback` | `POST /import/:jobId/rollback` | ❌ MISMATCH |
| `POST /catalog-import/jobs/:id/retry` | `POST /api/v1/catalog-import/jobs/:id/retry` | ❌ DOES NOT EXIST | ❌ MISSING |

**Note:** Even if paths matched, module is not registered so ALL catalog-import routes return 404.

### Products: Frontend vs Backend ✅
All frontend product API calls match backend endpoints.

---

## 12. Key Architecture Decisions

1. **Monorepo structure**: Turbo-based with 5 packages: `api`, `web`, `types`, `utils`, `ui`
2. **Backend**: NestJS with Prisma ORM, BullMQ queues, Redis pub/sub, AWS S3, OpenSearch, ClickHouse
3. **Frontend**: Next.js 14 App Router, React Query v5, Zustand, Tailwind CSS, Axios
4. **Auth flow**: JWT access + refresh tokens, role-based guards (SUPER_ADMIN > ADMIN > MANAGER > VIEWER)
5. **All schema in single migration**: No incremental migrations after init

---

## 13. Summary

The product catalog import is feasible but requires:

- **Immediate fix (P1)**: Register CatalogImportModule + fix API paths (1-2 hours)
- **CSV import pipeline (P1)**: Parse 33,600 rows, create 160 categories, 1,544 subcategories, 33,600 masters (1-2 days)
- **Product claiming (P1)**: Allow sellers to claim master records and enrich them (2-3 days)
- **Seeding (P2)**: Create seed infrastructure for repeatable imports (1 day)
- **Extensions (P2/P3)**: Bestseller dashboards, analytics, import history (3-5 days)

Total estimated effort: **7-14 days** for full product import readiness.
