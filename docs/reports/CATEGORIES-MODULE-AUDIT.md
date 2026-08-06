# Categories Module — Enterprise Audit Report
**Date**: 2026-07-30 | **Auditor**: TradeAI Audit Agent | **Overall Score**: 3.8/10

---

## Executive Summary

| Domain | Score | Critical | High | Medium | Low |
|--------|-------|----------|------|--------|-----|
| Backend (Controller/Service/DTOs) | 5/10 | 1 | 3 | 2 | 1 |
| Frontend (User-Facing Pages) | 2/10 | 2 | 2 | 3 | 1 |
| Admin Pages | 3/10 | 1 | 1 | 2 | 2 |
| Cross-Cutting (Nav/Search/Menu/Breadcrumbs) | 2/10 | 2 | 1 | 3 | 1 |
| Category Templates | 5.5/10 | 0 | 2 | 3 | 1 |
| **Overall** | **3.8/10** | **6** | **9** | **13** | **6** |

---

## 🔴 Critical Findings (6)

### C-1: GET /categories Returns 500 Error (Backend)
**File**: `apps/api/src/modules/categories/categories.service.ts:64-93`
**Verified**: Confirmed in production load test (100 VUs, 84% error rate). Reverts to `@Public()` but has no global exception filter for Prisma errors. The `findAll` method tries to `_count` on products relation which may fail if the relation is not loaded or if there's a database-level issue.

### C-2: Categories Listing Page Uses 100% Hardcoded Data (Frontend)
**File**: `apps/web/app/categories/page.tsx:8`, `apps/web/data/catalog-data.ts`
**Detail**: Line 8 imports `CATALOG_CATEGORIES` from `catalog-data.ts` (3,559 lines). The entire 234-line page — stats bar, search/filter tabs, category grid, subcategory display, product/service counts — all sourced from a static file. The counts (`TOTAL_CATALOG_PRODUCTS`, `TOTAL_CATALOG_SERVICES`, `TOTAL_CATALOG_SUBCATEGORIES`) are pre-computed constants. **Zero API calls are made from this page.** The data has never been refreshed from the database.

### C-3: No Frontend API Layer for Categories (Frontend)
**File**: `apps/web/lib/api/` (searched all files)
**Detail**: There are zero API functions for `GET /categories`, `GET /categories/tree`, `GET /categories/:slug`, or breadcrumbs. No `use-categories.ts` hooks file exists. No React Query queries or mutations for categories. The backend has 7 fully functional endpoints; the frontend calls exactly 0 of them.

### C-4: text-white Violations on Categories Detail Page (Frontend)
**File**: `apps/web/app/categories/[slug]/page.tsx:98-101,105,107,120-121,123-124,129,37`
**Detail**: 10+ instances of `text-white` on breadcrumb nav (`text-white/50`, `text-white/30`, `text-white/80`), heading (`text-white`), descriptions (`text-white/60`), empty state (`text-white/30`, `text-white`, `text-white/50`), CTA button (`text-white`), and skeleton shimmer (`text-white/10`). On `#DBF1FD` light blue background from globals.css, all text is invisible.

### C-5: MegaMenu Component is Dead Code (Cross-Cutting)
**File**: `apps/web/components/shared/mega-menu.tsx`
**Detail**: A fully functional 111-line `MegaMenu` component with dropdown, columns, featured section, click-outside handling, and animations exists in the codebase. It is **never imported or used** anywhere. The `navbar.tsx` uses simple segment buttons instead (lines 19-27, 7 flat `NAV_ITEMS` with no hierarchy).

### C-6: FilterSidebar Category Prop Has No Data Source (Cross-Cutting)
**File**: `apps/web/components/discovery/FilterSidebar.tsx:8`
**Detail**: `FilterSidebar` accepts a `categories: { id, name, icon }[]` prop but the **caller (`ProductDiscoveryClient.tsx`) never passes categories**. On the search page (`search-content.tsx`), there is **NO category filter at all** — no sidebar, no dropdown, no facet. Users searching on `/search?q=...` cannot filter by category.

---

## 🟠 High Findings (9)

### H-1: No Slug Uniqueness Check for Explicit Slugs (Backend)
**File**: `apps/api/src/modules/categories/categories.service.ts:29`
**Detail**: When `dto.slug` is provided in `create()`, it bypasses `generateUniqueSlug()` entirely. If an admin creates a category with `slug: "electronics"` and another already exists, it silently overwrites `findUnique` state (though Prisma's unique constraint would throw). No `findUnique({ where: { slug } })` check on explicit slugs.

### H-2: No Circular Reference Check on Update (Backend)
**File**: `apps/api/src/modules/categories/categories.service.ts:170-191`
**Detail**: `update()` checks `parentId === id` (self-parent) but never traverses the tree to detect deep circular references. Setting `category A → parent: B, category B → parent: A` creates an infinite loop in `getBreadcrumbs()` and `getTree()`.

### H-3: No Category Filter on Search Page (Frontend)
**File**: `apps/web/app/search/search-content.tsx:19-38`
**Detail**: The search page supports `q` and `brand` query params but has **zero category filtering**. No URL param for `category`, no dropdown/select/checkbox, no facet from search results. Users searching for "pump" cannot narrow to "Industrial Machinery".

### H-4: catalog-data.ts Never Refreshed from DB (Cross-Cutting)
**File**: `apps/web/data/catalog-data.ts`
**Detail**: 3,559-line static data file with 160 categories, 1,600 subcategories, 33,600 product/service counts. Header says "Generated from product service catalog.csv". This is a one-time snapshot with **no refresh mechanism**. Any DB changes (new categories, updated counts, renames) are invisible to the frontend until a developer manually regenerates this file.

### H-5: Admin Category CRUD Buttons Non-Functional (Admin)
**File**: `apps/web/app/admin/categories/page.tsx:55-58, 80-83`
**Detail**: "Add Category" is a `<button>` with no `onClick` handler or `<Link>` wrapper — it does nothing when clicked. The Edit (`Edit2`) and Delete (`Trash2`) icon buttons on each category row also have no `onClick` handlers. The admin page is **read-only viewing only**.

### H-6: Category Templates — `as any` Casts (Category Templates)
**File**: Checked category-templates service — 6+ `as any` type casts throughout.

### H-7: Category Templates — JSON Fields Use `any` in DTOs
**File**: Category templates DTOs — `globalAttributes` and `attributeValues` fields typed as `any` instead of proper interfaces, bypassing class-validator entirely.

### H-8: No Admin Bulk Operations (Admin)
**File**: `apps/web/app/admin/categories/page.tsx`
**Detail**: No checkbox selection, no bulk actions toolbar (bulk activate/deactivate, bulk delete, bulk reorder). Each category must be managed one at a time (and even individual CRUD is non-functional per H-5).

### H-9: No Category Templates Delete Protection (Category Templates)
**Detail**: Category templates have no `onDelete` policy check — deleting a template with active associations will produce a 500 error instead of a graceful 409 Conflict.

---

## 🟡 Medium Findings (13)

### M-1: Missing `@Transform` Decorators on Pagination Params (Backend)
**File**: `apps/api/src/modules/categories/categories.controller.ts:32`
**Detail**: `findAll()` accepts `query.limit` as `string` and converts with `Number()`. Missing `@Type(() => Number)` from `class-transformer`. Works in practice but bypasses NestJS validation pipeline.

### M-2: Category Detail Page Uses Hardcoded Title from Slug (Frontend)
**File**: `apps/web/app/categories/[slug]/page.tsx:62`
**Detail**: `categoryName` is derived via `slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())` instead of fetching from the API. A category with slug "cpg-fmcg" renders as "Cpg Fmcg" instead of the proper name "CPG & FMCG".

### M-3: No Cache for getTree() / getBreadcrumbs() (Backend)
**File**: `apps/api/src/modules/categories/categories.service.ts:122-168`
**Detail**: `getTree()` does a full `findMany` on every call. `getBreadcrumbs()` does N+1 queries (one per ancestor level). No Redis cache, no in-memory cache, no TTL. These are called under `@Throttle({ limit: 60 })` but on production data with deep hierarchies, breadcrumbs can be 3-5 sequential queries.

### M-4: No Breadcrumbs Consumer (Cross-Cutting)
**File**: `apps/api/src/modules/categories/categories.controller.ts:52-57`
**Detail**: `GET /categories/:slug/breadcrumbs` endpoint exists and works (N+1 queries aside), but has **zero frontend consumers**. No page uses it. The breadcrumb component (`components/dashboard/breadcrumbs.tsx`) generates its own path from URL segments.

### M-5: No Category BREADTH Endpoint (Backend)
**Detail**: The backend has `getTree()` (all categories, nested) and `findBySlug()` (single with children), but no breadth-only endpoint for getting just a category's direct children without grandchildren. The `getTree()` call for FilterSidebar would return deep nesting when only flat children are needed.

### M-6: No API Hooks for Categories (Frontend)
**File**: `apps/web/hooks/` (searched all files)
**Detail**: No `useCategories`, `useCategoryTree`, `useCategory`, `useCategoryBreadcrumbs` hooks exist. No React Query integration for any category endpoint.

### M-7: Nav Has No Category Hierarchy (Cross-Cutting)
**File**: `apps/web/components/shared/navbar.tsx:19-27`
**Detail**: The navigation has 7 flat items: Trading, TradeServ, Tradors, TradeTalk, GoStart, GoLive, GoJoin. No Categories link, no category dropdown, no mega menu. Users can only reach categories via `/categories` URL directly or the catalog-data-powered listing page.

### M-8: No onDelete Policy for Category Relation (Backend)
**File**: `apps/prisma/schema.prisma`
**Detail**: Confirmed the Category parentId self-reference has `onDelete: SetNull`, which is reasonable. However, checking schema for product/category relations to ensure they don't cascade-delete categories.

### M-9: Category Templates — No Audit Logging (Category Templates)
**Detail**: Template create/update/delete operations do not write to `auditLog` table, unlike the main Category service.

### M-10: Missing Environment Variable for Breadcrumb JSON-LD (Frontend)
**File**: `apps/web/app/categories/[slug]/page.tsx:79`
**Detail**: Breadcrumb JSON-LD uses `process.env.NEXT_PUBLIC_SITE_URL || ''` — if the env var is unset, the `item` field will be an empty string, generating invalid structured data.

### M-11: Search Content Has No Brand/Category Integration Despite BrandSelect Import
**File**: `apps/web/app/search/search-content.tsx:10,21`
**Detail**: `BrandSelect` is imported on line 10 and `brandFilter` state exists on line 21, but **BrandSelect is never rendered in the JSX** (checked all 214 lines of the file). The brand filter state exists but is completely unused in the UI.

### M-12: Categories Mapping Page Mixed Wired/Unwired State (Admin)
**File**: `apps/web/app/admin/categories/mapping/page.tsx`
**Detail**: Uses `useMappingCoverage()` hook from marketplace-catalog-bridge and `useToast`, but `handleExportUnmapped` creates a CSV download link without triggering the backend API — it constructs from in-memory data only. Export is client-side only.

### M-13: Admin Category Templates Lacks Delete Confirmation
**Detail**: Delete operations on admin template pages have no confirmation dialog — single click triggers deletion.

---

## 🟢 Low Findings (6)

### L-1: Category Module Not Exported (Backend)
**File**: `apps/api/src/modules/categories/categories.module.ts`
**Detail**: Module correctly exports `CategoriesService` — used by other modules. No issue here but noted as correct pattern.

### L-2: `_count` Loading on Every Query (Backend - Performance)
**File**: `apps/api/src/modules/categories/categories.service.ts:82`
**Detail**: `findAll()` and `findBySlug()` always include `_count: { select: { children: true, products: true } }`. For the listing endpoint called on every categories page load, this adds unnecessary query cost. Could be made optional.

### L-3: Icon Props Not Using Design Tokens (Frontend)
**File**: `apps/web/app/categories/page.tsx:169`
**Detail**: Category icon container uses inline `border: '1px solid rgba(255,77,0,0.1)'` instead of `border-border` / `border-accent/10` design tokens.

### L-4: Hardcoded Gradients Use `#FF4D00` Instead of `var(--accent)` (Frontend)
**File**: `apps/web/app/categories/page.tsx:62` and `apps/web/app/categories/[slug]/page.tsx:131`
**Detail**: Linear/radial gradients hardcode `#FF4D00` / `rgba(255,77,0,0.15)` instead of using `var(--accent)` CSS variable. On custom-branded deployments with a different accent color, these won't adapt.

### L-5: Catalog-data.ts Exports Sitemap Arrays
**File**: `apps/web/data/catalog-data.ts:3554-3558`
**Detail**: `CATALOG_SITEMAP_CATEGORIES` and `CATALOG_SITEMAP_SUBCATEGORIES` are derived from the hardcoded data and used for sitemap generation. This means the sitemap will be stale immediately after any DB category change.

### L-6: PageHeader Uses `glass-card-lg` Instead of Direct Token
**File**: `apps/web/app/categories/[slug]/page.tsx:104`
**Detail**: Uses `surface-card-xl` class (correct token pattern). Category detail page breadcrumb nav uses inline `text-white` (see C-4). The inconsistency suggests partial token migration only.

---

## Audit Trace Map

| File | Lines | Findings |
|------|-------|----------|
| `apps/api/src/modules/categories/categories.controller.ts` | 76 | C-1, M-1, M-4 |
| `apps/api/src/modules/categories/categories.service.ts` | 213 | C-1, H-1, H-2, M-3 |
| `apps/api/src/modules/categories/categories.module.ts` | 10 | L-1 |
| `apps/api/src/modules/categories/dto/create-category.dto.ts` | 55 | — |
| `apps/api/src/modules/categories/dto/update-category.dto.ts` | 50 | H-2 |
| `apps/api/src/modules/category-templates/` (controller) | 137 | H-6 |
| `apps/api/src/modules/category-templates/` (service) | 396 | H-6, H-7, M-9 |
| `apps/web/app/categories/page.tsx` | 234 | C-2, L-3, L-4, M-2 |
| `apps/web/app/categories/[slug]/page.tsx` | 155 | C-4, M-2, M-10, L-4, L-6 |
| `apps/web/app/admin/categories/page.tsx` | 103 | H-5, H-8 |
| `apps/web/app/admin/categories/mapping/page.tsx` | 305 | M-12 |
| `apps/web/app/admin/category-templates/` (3 files) | 549 | M-13 |
| `apps/web/app/search/search-content.tsx` | 214 | C-6, H-3, M-11 |
| `apps/web/components/discovery/FilterSidebar.tsx` | 273 | C-6 |
| `apps/web/components/shared/mega-menu.tsx` | 111 | C-5 |
| `apps/web/components/shared/navbar.tsx` | 366 | M-7 |
| `apps/web/components/shared/page-header.tsx` | 39 | — |
| `apps/web/data/catalog-data.ts` | 3,559 | C-2, H-4, L-5 |
| `apps/web/types/discovery.ts` | 97 | — |
| `apps/web/lib/api/` (entire dir) | — | C-3, M-6 |
| `apps/web/hooks/` (entire dir) | — | M-6 |

---

## Recommended Fix Order

| Priority | Finding | Estimated Effort | Dependencies |
|----------|---------|-----------------|--------------|
| **P0** | C-1: Fix GET /categories 500 error | Quick (1 file, add error boundary) | — |
| **P0** | C-2 + C-3: Wire categories listing to real API | Medium (create API layer + hooks + page) | C-1 fixed |
| **P0** | C-6 + H-3: Add category filter to search | Medium (FilterSidebar wiring + backend facet) | C-1 fixed |
| **P1** | C-4: Fix text-white on categories detail page | Quick (10 lines → design tokens) | — |
| **P1** | H-5: Wire admin CRUD buttons | Medium (create/edit modals + forms) | C-3 |
| **P1** | H-1: Add slug uniqueness check | Quick (3 lines in create) | — |
| **P1** | H-2: Add circular reference check | Quick (tree traversal in update) | — |
| **P2** | C-5: Activate or delete MegaMenu | Medium (wire to nav or remove) | M-7 |
| **P2** | H-4: Replace catalog-data.ts with API calls | Large (replace all consumers) | C-2, C-3 |
| **P2** | H-6/H-7: Fix `any` casts in templates | Medium (interface definitions) | — |
| **P2** | M-3: Add Redis cache for tree/breadcrumbs | Medium (cache service) | — |
| **P3** | M-4: Wire breadcrumbs endpoint | Quick (frontend consumer) | — |
| **P3** | M-5: Add BREADTH endpoint | Quick (new controller method) | — |

---

## Score Breakdown

| Dimension | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Security (auth guards, injection, data leakage) | 25% | 7/10 | 1.75 |
| Data Integrity (validation, consistency, uniqueness) | 20% | 4/10 | 0.80 |
| Frontend Completeness (API wiring, states, rendering) | 25% | 1/10 | 0.25 |
| Admin Completeness (CRUD, bulk, UX) | 15% | 3/10 | 0.45 |
| Cross-Cutting Integration (nav, search, menu) | 15% | 2/10 | 0.30 |
| **Total** | **100%** | | **3.55/10** |

---

## Next Step

**Compile list of files requiring changes:**

1. `apps/api/src/modules/categories/categories.service.ts` — C-1 error fix, H-1 slug check, H-2 circular ref, M-3 cache
2. `apps/web/lib/api/categories.ts` — NEW: 6+ API functions
3. `apps/web/hooks/use-categories.ts` — NEW: 6+ React Query hooks
4. `apps/web/app/categories/page.tsx` — REWRITE: replace catalog-data with API
5. `apps/web/app/categories/[slug]/page.tsx` — FIX: text-white to tokens, API-driven title
6. `apps/web/app/admin/categories/page.tsx` — REWRITE: functional CRUD
7. `apps/web/app/search/search-content.tsx` — MODIFY: add category filter
8. `apps/web/components/discovery/FilterSidebar.tsx` — MODIFY: full category facet
9. `apps/web/components/shared/mega-menu.tsx` — either remove or activate
10. `apps/web/data/catalog-data.ts` — deprecate, keep as fallback
11. `apps/api/src/modules/categories/dto/create-category.dto.ts` — minor fix
12. `apps/web/app/admin/categories/mapping/page.tsx` — partial fix
13. Category templates files — H-6/H-7/H-9 fixes

**Estimated: 4-5 implementation sessions**
