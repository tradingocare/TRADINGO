PHASE P-2.3 — MARKETPLACE TAXONOMY BRIDGE
========================================

STOP: This document is prepared for Founder review. It summarizes the audit, adapter integration points, files created/modified, compatibility impacts, mapping-coverage run plan, and verification steps. Do NOT change Prisma schema or redesign Marketplace. Use the CatalogAdapter as the only bridge.

1) OBJECTIVE
-----------
Integrate Marketplace taxonomy with the Master Catalog using the existing CatalogAdapter. Audit-first. Backward-compatible. No schema changes. Adapter-only reads (import orchestrator is the only writer).

2) AUDIT SUMMARY (key findings)
-------------------------------
- CatalogAdapter exists and centralizes most read/resolution logic: `apps/api/src/modules/catalog-adapter/catalog-adapter.service.ts`.
- Master Catalog models present in `prisma/schema.prisma` (CatalogCategory, CatalogSubcategory, CatalogItem, CatalogAttribute, CatalogAlias, CatalogIndustryMapping, CatalogUnit).
- Import/Seeder pipeline is the authoritative writer for Catalog tables: `apps/api/src/catalog-import/services/import-orchestrator.service.ts` and `prisma/seeds/*`.
- Marketplace (legacy) taxonomy is implemented via `Category`, `ProductMaster`, `ServiceMaster` models and controllers under `apps/api/src/modules/categories/*` and `apps/api/src/modules/products/*`.
- A Marketplace→Catalog bridge module exists: `apps/api/src/modules/marketplace-catalog-bridge/*` and it already consumes the CatalogAdapter.
- A small number of direct catalog reads were present (coverage, bridge helpers) and were refactored into the adapter (adapter-first reads enforced).
- Performance risk: original per-product adapter calls caused N+1; a bulk unified-search helper and bridge bulk endpoint were added to avoid this.
- No public write endpoints to Catalog should be introduced; import orchestrator must remain sole writer.

3) ADAPTER INTEGRATION POINTS (recommended)
-------------------------------------------
- Adapter Public API (observed)
  - `resolveOldCategoryToNew(oldCategoryId)`
  - `resolveNewCategoryToOld(catalogCategoryId)`
  - `unifiedSearch(query, options)`
  - `batchResolve(ids, direction)`
  - `getCatalogTree()`
  - `validateMapping(oldCategoryId, catalogCategoryId)`
  - `getCatalogItem(id)` / `getCatalogCategory(id)` / `getCatalogSubcategory(id)`
  - Added in implementation: `listCatalogCategories()`, `listOldCategories()`, `unifiedSearchBulk(queries, options)`

- Where to call the adapter (primary consumers)
  - Bridge: `apps/api/src/modules/marketplace-catalog-bridge/*` — use adapter for coverage, enriched trees, bulk search.
  - Product create/update flows: `apps/api/src/modules/products/products.service.ts` — call adapter to suggest mappings during onboarding/save; persist only optional metadata.
  - Tradeserv enrichment: already uses adapter.
  - Any UI-facing endpoints that show suggestions (seller wizard, product edit) should call bridge bulk endpoints rather than direct adapter where RBAC/guards apply.

4) FILES CREATED (deliverables for Founder review)
-------------------------------------------------
- `PHASE_P-2.3_MARKETPLACE_TAXONOMY_AUDIT.md` (this document)
- `PHASE_P-2.3_MAPPING_COVERAGE_RUN.md` (instructions + example request/response)
- `PHASE_P-2.3_FILES_MODIFIED.md` (list of code changes made so far)

5) FILES MODIFIED (work performed in this implementation step)
---------------------------------------------------------------
- Modified: `apps/api/src/modules/catalog-adapter/catalog-adapter.service.ts`
  - Added: `listCatalogCategories()`, `listOldCategories()`, `unifiedSearchBulk(...)` helpers.
- Modified: `apps/api/src/modules/marketplace-catalog-bridge/marketplace-catalog-bridge.service.ts`
  - Replaced direct catalog reads with adapter reads; replaced per-product adapter calls with bulk lookups.
  - Added passthrough `unifiedSearchBulk` service method.
- Modified: `apps/api/src/modules/marketplace-catalog-bridge/marketplace-catalog-bridge.controller.ts`
  - Added `GET /marketplace-catalog-bridge/unified-search/bulk` endpoint.
- Added test: `apps/api/src/modules/catalog-adapter/__tests__/catalog-adapter.service.spec.ts` (basic bulk unit test)

6) EXISTING vs NEW (behavioral diff)
------------------------------------
- Existing behavior preserved:
  - Legacy category endpoints and product create/update APIs remain unchanged.
  - Import/seeder remains the authoritative writer for Catalog.
- New behavior (non-breaking additions):
  - Adapter exposes bulk search to avoid N+1 and to provide mapping suggestions for many items in one call.
  - Marketplace bridge now uses adapter list helpers and bulk search; results are only enriched in responses (no persistence performed unless callers opt to persist mapping metadata).

7) COMPATIBILITY MATRIX
-----------------------
- Legacy public APIs (categories, products) : NO change — compatible
- Frontend routes (seller product wizard, product edit) : NO route changes; UI will be enhanced to call a new bulk endpoint and show suggestions — non-breaking
- Database schema (Prisma) : NO changes allowed — respected
- Import pipeline: writer behavior unchanged — compatible
- Search indices: unchanged now; plan GIN index migration for staging to improve catalog item search performance (see verification)

8) MAPPING COVERAGE (how to run & expected output)
-------------------------------------------------
The system includes a coverage-report endpoint and service method. To produce a mapping coverage report for staging or local, run the following (server must be running or run via a small script that invokes Prisma):

API call (if server running locally on :3000):

GET /marketplace-catalog-bridge/coverage  (admin guard — requires ADMIN token)

Example curl (replace TOKEN):

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/marketplace-catalog-bridge/coverage
```

Expected response shape (example):

{
  "totalOld": 128,
  "totalCatalog": 1400,
  "mappedCount": 118,
  "unmappedOldCount": 10,
  "unmappedCatalogCount": 1282,
  "coverage": 92.1875,
  "mapped": [ { oldId, oldName, oldSlug, catalogId, catalogName }, ... ],
  "unmappedOld": [...],
  "unmappedCatalog": [...]
}

If you cannot run the server, run a Node script that calls the adapter helpers (requires dev environment and DB access). I can prepare and run that script if you want a live mapping report now.

9) BUILD & VERIFICATION (commands)
-----------------------------------
Run these in CI or locally. I recommend running in order and resolving any errors before staging import.

```powershell
# from repo root
npx prisma validate
npx prisma generate
# TypeScript checks
npx tsc -p apps/api/tsconfig.json
npx tsc -p apps/web/tsconfig.json
# Next build
cd apps/web
npx next build
```

Unit tests (API app):

```powershell
# using jest (repo standard)
cd apps/api
npm test -- --testPathPattern=modules/catalog-adapter
```

10) RISKS & MITIGATIONS (summary)
---------------------------------
- Ambiguous mappings: require UI gating & mappingConfidence; expose confidence and require human confirmation before persisting mapping.
- Performance: bulk APIs + GIN indexes (for `CatalogItem.keywords`/`synonyms`) are required prior to enabling large-scale auto-mapping.
- Import failures: run seeder as idempotent; add resume semantics and validation threshold before publishing mappings.

11) ACCEPTANCE CRITERIA for Founder
-----------------------------------
- Audit document reviewed and signed off.
- Mapping coverage run produced and coverage >= Founder-specified threshold (suggested 90%).
- Adapter remains the only read-surface; import orchestrator remains sole writer.
- No changes to Prisma schema or legacy public endpoints.

12) NEXT STEPS (if Founder approves)
-----------------------------------
- Prepare staging mapping run and produce coverage report (I can run this).
- Add frontend wiring to call `/marketplace-catalog-bridge/unified-search/bulk` and show suggestions (non-persisting UI) — after coverage target met.
- Harden import/seeder idempotency tests and schedule staging import dry-run with GIN index applied.

STOP. Wait for Founder review.
