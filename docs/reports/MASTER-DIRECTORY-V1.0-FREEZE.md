# Master Business Directory — Version 1.0 Freeze

**Status: FROZEN** · Freeze date: 2026-08-03 · Approved by: Founder (final integrity audit)

## Freeze Declaration
The Master Business Directory (Master Catalog) is certified at **Version 1.0**. The directory is the single source of truth for catalog taxonomy and product/service master data. No AI agent may modify, insert, delete, or migrate Master Directory rows without explicit Founder approval.

## Certified Integrity (2026-08-03T17:1xZ — verified via SQL, OpenSearch, API)

| Entity | Current | Integrity |
| --- | --- | --- |
| Industry | 166 | 12 legacy (07-20) + 154 constant; 0 duplicates |
| CatalogCategory | 1,665 | 5 legacy (07-31) + 1,660 (166 × 10); 1:1 industry mapping (1,660) |
| CatalogSubcategory | 6,665 | 5 legacy + 6,660 (1,665 × 4) |
| CatalogItem Product | 34,997 | 5 legacy + 34,992 deterministic; hsCode 8-digit valid × 34,997, 0 invalid |
| CatalogItem Service | 13,330 | 6,665 × 2; sacCode 9983xx valid |
| ProductMaster | 34,992 | 1:1 mirror of items; 0 orphans, 0 mismatches |
| ServiceMaster | 13,330 | 1:1 mirror; 0 orphans, 0 mismatches |
| GlobalBrand | 400 | exact target |
| ProductBrand | 499 | 3 benign slug collisions; unique enforced |
| Company | 502 | 500 + 2 legacy test accounts (functional) |
| Territory | 1,280 | 36 states + 728 districts + 351 cities + 165 industrial areas |
| CatalogAttribute | 104,991 | exactly 3 per product; 0 duplicate keys |
| GlobalAttribute | 20 | exact |
| CatalogSynonym | 335 | constant size; 0 duplicates |
| CatalogAlias | 34,997 | 1 per product |
| CatalogIndustryMapping | 1,660 | 1 per category |
| IndustryCategoryMapping | 201 | industry ↔ legacy category |
| CatalogUnit | 61 | exact |

## Verification Evidence
- OpenSearch `catalog` index: 56,818 docs (34,992 PM + 13,330 SM + 166 IND + 1,665 CAT + 6,665 SUB), 0 errors
- Runtime indexes: `catalog_items` 48,327, `catalog_categories` 8,330 (search-verified exact)
- OS ↔ DB parity: PRODUCT_MASTER 34,992/34,992, SERVICE_MASTER 13,330/13,330, **0 mismatches**
- hsCode 3-way spot check: CatalogItem = ProductMaster = OpenSearch (`corrugated-boxes-standard-mini` → 84590235)
- API: catalog search, global search (6 sections), category-filtered product search, product detail — all 200 OK
- Duplicates: 0 · Invalid hsCodes: 0 · Orphan masters: 0 · Inactive items: 0 · DB clean of reseed artifacts

## Lock Rules
1. No modifications to rows in any Master Directory table without Founder approval (Industry, CatalogCategory, CatalogSubcategory, CatalogItem, ProductMaster, ServiceMaster, GlobalBrand, GlobalAttribute, CatalogUnit, CatalogSynonym, CatalogAlias, CatalogAttribute, CatalogIndustryMapping, IndustryCategoryMapping).
2. Master-data constants (`prisma/seed-data/master-directory.data.ts`) are frozen.
3. Master directory seeders (`master-directory.seed.ts`) are frozen — run only in audit mode (`PHASES=X`).
4. hsCode/SAC code formats: products 8-digit HSN, services 9983xx SAC — must never regress.
5. Approved mutation paths only: import pipeline (ImportOrchestratorService), admin catalog console (P-3.0), ProductService publish (creates catalogItemId links — never edits master rows).
6. Legacy rows (12 industries, 5 categories, 5 subcategories, 5 products, 2 companies, 9 media, 19 slabs, 11 specs — all 2026-07) are part of V1.0; no cleanup without Founder approval.
7. Any future version (V1.1+) requires a new freeze record and Founder sign-off.

## Known Stale Targets (documentation only — no data impact)
| Target | Stale value | Actual design value |
| --- | --- | --- |
| Industry | 160 | 154 (constant) |
| Territory | 2,800 | 1,280 (constant) |
| CatalogSynonym | 240 | 335 (constant) |
| CatalogIndustryMapping | 1,600 | 1,660 (1 per category) |
| IndustryCategoryMapping | 120 | 201 (legacy matches) |
