# Catalog Import — Migration Plan

## Overview

**Purpose:** Seed the TRADINGO platform with 33,600 catalog entries from an approved master catalog, using an idempotent import pipeline with full rollback support.

| Entity        | Count   |
|---------------|---------|
| Categories    | 160     |
| Subcategories | 1,544   |
| Products      | 25,600  |
| Services      | 8,000   |
| **Total**     | 33,600  |

**Source:** Approved master catalog (generated from industry-standard classification codes and manually curated for marketplace readiness).

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ Seed Script  │────>│ ImportJob    │────>│ PostgreSQL   │
│ (CSV/JSON)   │     │ (tracking)   │     │ (Prisma)     │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                           │ (on COMPLETED)
                           v
                    ┌──────────────┐
                    │  OpenSearch  │
                    │  (index)     │
                    └──────────────┘
```

### Components

- **Database:** PostgreSQL 16 via Prisma ORM
- **Search:** OpenSearch for full-text catalog search across ProductMaster and ServiceMaster
- **Import Tracking:** `ImportJob` + `ImportJobRow` models for idempotent, auditable imports
- **Rollback:** Per-job rollback deletes all entities created during that import

### Data Flow

1. Admin triggers import via dashboard or seed script
2. System reads source data (CSV/JSON file or pre-generated seed set)
3. Each row is validated and written to `ImportJobRow` with a status
4. Valid rows are upserted into ProductMaster/ServiceMaster/Category
5. On completion, entries are indexed into OpenSearch
6. On rollback, all entities belonging to the import job are deleted

---

## Migration Steps

### Step 1 — Schema Migration

- Models already defined in `prisma/schema.prisma`:
  - `ImportJob`, `ImportJobRow`, `ProductMaster`, `ServiceMaster`, `ProductAlias`
  - Enums: `ImportJobStatus`, `ImportJobType`, `ImportRowStatus`
- Run `npx prisma migrate dev --name catalog-import` to apply
- Estimated time: **30 minutes**

### Step 2 — Generate Seed Data

- Script: `prisma/seed-catalog.ts`
- Generates 160 categories, 1,544 subcategories, 25,600 products, 8,000 services
- Uses structured naming conventions from industry classification
- Ensures slug uniqueness via counter suffix
- Estimated time: **1 hour**

### Step 3 — Database Seeding

- Run `npx prisma db seed` (or `pnpm db:seed`)
- Imports data via `ImportJob` tracking for auditability
- Each category/subcategory/product/service is recorded as an `ImportJobRow`
- Estimated time: **2–3 hours**

### Step 4 — Verify Data Integrity

- **Count checks:** Verify expected entity counts
- **Slug uniqueness:** Ensure no duplicate slugs exist
- **Parent-child integrity:** No orphan subcategories
- **Category links:** All products/services linked to valid categories
- **Price ranges:** `priceRangeMin <= priceRangeMax` for all entries
- Estimated time: **30 minutes**

### Step 5 — Index to OpenSearch

- Script: `apps/api/src/catalog-import/opensearch-indexer.ts`
- Bulk-indexes ProductMaster and ServiceMaster into OpenSearch
- Maps fields: name, slug, description, searchKeywords, synonyms, tags, category
- Estimated time: **30 minutes**

### Step 6 — Duplicate Detection Pass

- Scan ProductMaster and ServiceMaster for near-duplicate names
- Creates `ProductAlias` entries for confirmed duplicates
- Flags in `ImportJobRow.duplicateOf` for visibility
- Estimated time: **30 minutes**

### Step 7 — Generate SEO Metadata

- Auto-generate `metaTitle` and `metaDescription` for all entries
- Based on name, category path, and description
- Estimated time: **30 minutes**

### Step 8 — Enable Catalog APIs

- NestJS module under `apps/api/src/catalog-import/`
- Endpoints:
  - `POST /api/v1/catalog-import/start`
  - `GET /api/v1/catalog-import/jobs`
  - `GET /api/v1/catalog-import/jobs/:id`
  - `POST /api/v1/catalog-import/jobs/:id/rollback`
  - `POST /api/v1/catalog-import/jobs/:id/retry`
  - `GET /api/v1/catalog-import/stats`
  - `GET /api/v1/catalog-import/search`
- Estimated time: **1 hour**

### Step 9 — Smoke Test Search Functionality

- Test search across ProductMaster and ServiceMaster
- Verify full-text search returns correct results
- Test pagination and filtering by category
- Estimated time: **30 minutes**

---

## Rollback Procedure

1. Admin clicks "Rollback" on a completed import job from the dashboard
2. API sets `ImportJob.status = ROLLING_BACK`
3. System deletes all entities (`ProductMaster`, `ServiceMaster`, `Category`) created during that import, referenced via `ImportJobRow.entityId`
4. Existing data from other jobs is preserved (deletion is scoped per-job)
5. On success: `ImportJob.rolledBackAt` is set, status changed to `ROLLED_BACK`
6. On failure: status remains `ROLLING_BACK` for manual intervention

### Rollback Safeguards

- Only COMPLETED jobs with no `rolledBackAt` can be rolled back
- Rollback is atomic within a database transaction
- OpenSearch documents are removed during rollback
- Cannot rollback twice

---

## Validation Queries

```sql
-- Count checks
SELECT 'categories', COUNT(*) FROM "Category";
SELECT 'subcategories', COUNT(*) FROM "Category" WHERE "parentId" IS NOT NULL;
SELECT 'products', COUNT(*) FROM "ProductMaster";
SELECT 'services', COUNT(*) FROM "ServiceMaster";

-- Slug uniqueness (should return 0)
SELECT slug, COUNT(*) FROM "ProductMaster" GROUP BY slug HAVING COUNT(*) > 1;
SELECT slug, COUNT(*) FROM "ServiceMaster" GROUP BY slug HAVING COUNT(*) > 1;

-- Orphan check (should return 0)
SELECT COUNT(*) FROM "ProductMaster" WHERE "categoryId" IS NOT NULL
  AND "categoryId" NOT IN (SELECT id FROM "Category");
SELECT COUNT(*) FROM "ServiceMaster" WHERE "categoryId" IS NOT NULL
  AND "categoryId" NOT IN (SELECT id FROM "Category");

-- Price range sanity
SELECT COUNT(*) FROM "ProductMaster"
  WHERE "priceRangeMin" IS NOT NULL AND "priceRangeMax" IS NOT NULL
  AND "priceRangeMin" > "priceRangeMax";
```

---

## Timeline

| Step                        | Duration |
|-----------------------------|----------|
| Schema migration            | 30 min   |
| Seed data generation        | 1 hr     |
| Database seeding            | 2–3 hr   |
| OpenSearch indexing         | 30 min   |
| Duplicate detection         | 30 min   |
| SEO metadata generation     | 30 min   |
| API enablement              | 1 hr     |
| Verification & smoke tests  | 30 min   |
| **Total**                   | **~5–6 hr** |
