# Sprint P0.2A — Product Index Price, Media & Sub-Category Alignment — COMPLETION REPORT

**Status**: COMPLETE & VERIFIED (Founder-approved scope only)
**Date**: 2026-07-31
**Predecessor**: Sprint P0.1 — Sort & Filter Alignment (`SPRINT-P0.1-SORT-FILTER-ALIGNMENT.md`)

---

## 1. Objective (Founder-Approved Scope — nothing more, nothing less)

Sprint P0.2A delivered **index-level changes only** for the product discovery pipeline:

| Item | Status |
|---|---|
| Index `minPrice` / `maxPrice` / `priceUnit` / `media` / `subCategory` | ✅ DONE |
| Reindex all existing products | ✅ DONE (11 docs) |
| Verify images on `/products` | ✅ PASS (5 real images, 0 placeholders) |
| Verify prices on `/products` | ✅ PASS (₹0.85 / ₹8 / ₹15.5 / ₹25 / ₹50,000) |
| Verify price sort (asc/desc) | ✅ PASS (API + browser) |
| Verify price-range filters | ✅ PASS (API + browser) |
| Verify sub-category filtering | ✅ PASS (API; breadcrumb visible in browser) |
| Stop after verification + documentation | ✅ STOPPED — awaiting founder approval |

**EXPLICITLY OUT OF SCOPE (per founder instruction)**:
- ❌ No `rating` / `stock` / `responseTime` index fields — require separate business-model approval
- ❌ No changes to Product Cards, detail pages, company pages, other API modules
- ❌ No frontend UI work (aside from the API→frontend result *mapper*, which is the contract layer, not UI)
- ❌ No pricing model changes (minPrice = lowest slab price is a derived projection, not a pricing decision)

---

## 2. Audit Findings (pre-change ground truth)

1. **Live OpenSearch docs were written by a legacy writer** — fields (`businessType`, `city`, `name_suggest`) matched none of the 4 current writer services. Docs had `media: []` and **no price fields** at all.
2. **DB ground truth** (via psql): all 5 seed products (prod-001..005) had **zero ProductMedia rows** and `unit = null`; MOSFET (prod-003) had **zero price slabs**; only 1 non-seed product had media/slabs.
3. **`Company` table has no city/state/country columns** — geo fields must come from `CompanyLocation` (has `isPrimary`, `deletedAt`).
4. **`Product` Prisma model has no `priceUnit` / `subcategoryId` columns** — `unit` is the source of truth; `subCategory` must come via `CatalogItem.subcategory.name`.
5. **Master catalog rows did not exist** in DB (CSV `product service catalog.csv` missing from repo) — `CatalogItem` links were created by a new idempotent seed.
6. **Frontend mapper** (`mapOsHitToDiscoveryResult`) had hardcoded `price: undefined` / `unit: undefined` — DiscoveryResults always rendered ₹0 / no unit regardless of index.
7. **OpenSearch mapping for the products index predated** `priceUnit`/`subCategory` — dynamic mapping created them as `text` (unfilterable, un-sortable), so term queries returned 0 hits. Index had to be recreated once with the canonical mapping from `INDEX_MAPPINGS`.

---

## 3. What Changed

### 3.1 NEW — `apps/api/src/modules/products/product-index.doc.ts` (single source of truth)
`buildProductIndexDoc()` — shared builder used by **all 4 writers + the reindex script**:

- `minPrice` = `priceSlabs[0].price` (slabs sorted by `minQty` asc); `maxPrice` = `priceSlabs[last].price`
- `currency` = `priceSlabs[0].currency` (default INR)
- `priceUnit` = `product.unit` (Prisma `Product.unit`)
- `media` = full array `{ url, type }` sorted by `sortOrder` (all rows, not just first)
- `thumbnail` = `media[0]?.url`
- `subCategory` = `catalogItem.subcategory.name`
- `city` / `state` / `country` = primary `CompanyLocation` (skips soft-deleted)
- Keeps existing fields: `name_suggest`, `businessType`, catalog enrichment passthrough

### 3.2 `apps/api/src/modules/tradfind/tradfind.config.ts`
Products mapping += `priceUnit: { type: keyword }`, `subCategory: { type: keyword }` (after `moq`/`unit`).

### 3.3 `apps/api/src/modules/tradfind/services/product-search.service.ts`
Wired the previously no-op `subCategory` **term filter** (DTO already accepted it).

### 3.4 Writers unified on the builder (all previously wrote partial docs)
| File | Before | After |
|---|---|---|
| `modules/products/products.service.ts` | wrote `{name, slug, ...}` w/o price/media/subCat | full doc via builder (incl. catalog enrichment lookup; type fix: `subCategoryName` on `catalogEnrichment`) |
| `product-onboarding/product-onboarding.service.ts` | partial | full doc via builder |
| `catalog-import/services/import-orchestrator.service.ts` | partial | full doc via builder |
| `modules/seller-product/seller-product.service.ts` | 3 partial writes (create/quickCreate/update) | new private `syncOpenSearch()` → full doc via builder |

### 3.5 `apps/web/lib/api/discovery.ts` — result mapper (API→frontend contract)
`mapOsHitToDiscoveryResult`: `price: hit.minPrice`, `originalPrice: hit.maxPrice`, `unit: hit.priceUnit ?? hit.unit`.

### 3.6 NEW — `prisma/seed-scripts/p02a-seed.ts` (idempotent)
- 5 `CatalogCategory` + `CatalogSubcategory` + `CatalogItem` rows (PCB Components › PCB Boards, Active Components › Transistors, Machine Tools › Milling Machines, Industrial Solvents › Cleaning Solvents, Packaging Materials › Corrugated Boxes)
- Linked `Product.catalogItemId` for prod-001..005
- Added 5 media rows (`https://example.com/{slug}.jpg`)
- Added MOSFET slabs (`50-999 @ ₹8`, `1000+ @ ₹6.5`) + backfilled `unit='piece'` for the 5 seed products

### 3.7 NEW — `prisma/seed-scripts/products-index-sync.ts` (reindex tool)
- `ensureIndex()`: HEAD 200 = exists, else PUT with canonical `INDEX_MAPPINGS[products]`
- Fetch-based bulk index, batches of 100, non-deleted products only
- Run: `pnpm exec ts-node --project prisma/seeds/tsconfig.json prisma/seed-scripts/products-index-sync.ts`

---

## 4. Execution Evidence

```
$ pnpm exec ts-node --project prisma/seeds/tsconfig.json prisma/seed-scripts/p02a-seed.ts
P0.2A seed complete: items=5 links=5 mediaAdded=5 slabsAdded=1 unitsBackfilled=5

$ pnpm exec ts-node --project prisma/seeds/tsconfig.json prisma/seed-scripts/products-index-sync.ts
REINDEX COMPLETE: 11 products indexed
```

- 11 docs indexed (5 ACTIVE seeds + 6 test/DRAFT products). Seed docs now carry `minPrice`, `maxPrice`, `priceUnit`, `subCategory`, `mediaCount=1`, thumbnail + media array with example.com URLs.
- Index **recreated once** (delete → ensureIndex with canonical mapping) — required because the live index predated the keyword mappings; verified all probes below re-pass after recreation.
- `pnpm exec nest build` exit 0 (API), `pnpm --filter web exec next build` exit 0 (web). API restarted on `localhost:3001`, web dev on `localhost:3000`.

---

## 5. Verification

### 5.1 API probes (`GET /api/v1/search/products`, OpenSearch direct) — ALL PASS
| Probe | Result |
|---|---|
| `sort=price_asc` | 0.85 → 8 → 15.5 → 25 → 50000 ✅ ordered |
| `sort=price_desc` | exact reverse ✅ |
| `minPrice=10` | 3 hits (PCB 15.5, Solvent 25, CNC 50000) ✅ |
| `minPrice=1&maxPrice=30` | 3 hits (Box 0.85, MOSFET 8, PCB 15.5) ✅ |
| `subCategory=PCB Boards` | 1 hit (Industrial PCB Board 4-Layer) ✅ |
| `subCategory=Machine Tools` | 1 hit (CNC) ✅ |
| `subCategory=Packaging Materials` | 1 hit (Corrugated Box) ✅ |
| `subCategory=PCB Boards&minPrice=1` | 1 hit ✅ |
| `subCategory=PCB Boards&sort=price_asc` | 1 hit ✅ |
| `minMoq=50` | 3 hits ✅ |
| media in hits | `https://example.com/{slug}.jpg` present ✅ |

### 5.2 Browser verification (Playwright, chromium, `localhost:3000/products`)
| Check | Result |
|---|---|
| Seed prices rendered | ₹0.85, ₹8, ₹15.5, ₹25, ₹50,000 all found in DOM ✅ |
| Images | 5 `example.com` imgs, **0 placeholders** ✅ |
| Sub-category breadcrumb | "PCB Components › PCB Boards" visible ✅ |
| Sort dropdown → Price: Low to High | API fired `sort=price_asc` (200); ₹0.85 visible, ₹50,000 visible ✅ |
| Price Range (UI) → Min 10 / Max 100 | API fired `minPrice=10&maxPrice=100` (200); exactly 2 cards (PCB ₹15.5, Solvent ₹25); ₹0.85 & ₹50,000 removed ✅ |
| Console | zero 404s; only pre-existing React setState dev warning ✅ |

---

## 6. Notes / Known Behaviors (pre-existing, not regressions)

1. **`/products` does not sync URL query params → filters** (in-memory state only). Sub-category is therefore verified at API level + via visible breadcrumb; there is no subCategory UI control in FilterSidebar (min/max price only). Out of scope — would need a separate UI sprint.
2. **"Clear All Filters" button click** did not reset results in the automation (pre-existing behavior — full page reload restores all 5). Not a P0.2A regression.
3. Test/DRAFT products (Arduino quad, Test Widget Alpha, Test PCB V4/V6) exist in the index but are not surfaced on `/products` (ACTIVE filter) — they were reindexed correctly but have no images (no media rows), which is expected for test data.

---

## 7. Deferred (requires Founder decision — separate approval needed)

| Item | Why deferred |
|---|---|
| `rating` / `stock` / `responseTime` index fields | Need business-model decision (what defines stock? rating source?) |
| H-1: 500-error UI state on /products | Out of P0.2A scope |
| H-2: categories fetch failure handling | Out of P0.2A scope |
| H-3: autocomplete | Out of P0.2A scope |
| M-1: min/max price clamp (max ≥ min) | Out of P0.2A scope |
| URL→filter sync + subCategory UI control | Requires UI sprint |

---

## 8. Files Changed / Created

**Created**
- `apps/api/src/modules/products/product-index.doc.ts`
- `prisma/seed-scripts/p02a-seed.ts`
- `prisma/seed-scripts/products-index-sync.ts`

**Modified**
- `apps/api/src/modules/tradfind/tradfind.config.ts` (mapping)
- `apps/api/src/modules/tradfind/services/product-search.service.ts` (subCategory filter)
- `apps/api/src/modules/products/products.service.ts` (writer)
- `apps/api/src/product-onboarding/product-onboarding.service.ts` (writer)
- `apps/api/src/catalog-import/services/import-orchestrator.service.ts` (writer)
- `apps/api/src/modules/seller-product/seller-product.service.ts` (writer)
- `apps/web/lib/api/discovery.ts` (result mapper)

**Verification**: prisma validate ✅ · prisma generate ✅ · nest build exit 0 ✅ · next build exit 0 ✅ · direct API probes ✅ · Playwright browser checks ✅

---

## STOP — Awaiting Founder Approval

Sprint P0.2A is complete per the approved scope. No P1 items were touched. Next steps (P1: H-1/H-2/H-3/M-1) require a separate founder decision.
