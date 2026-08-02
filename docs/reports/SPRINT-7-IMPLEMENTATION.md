# Sprint 7 — Enterprise Master Catalog Implementation

## Overview
Phase A through C of the Enterprise Master Catalog import pipeline, linking Product and ProfessionalService models to CatalogItem, adding HSN/SAC code support, XLSX import capability, and CatalogUnit population.

## Phase A — Prisma Schema (CatalogItem FK links + SAC/HSN codes)

### Product ↔ CatalogItem
- Added `catalogItemId String?` + `@relation` + `@@index([catalogItemId])` to `Product` model
- Added `products Product[]` reverse relation to `CatalogItem`

### ProfessionalService ↔ CatalogItem
- Added `catalogItemId String?` + `@relation` + `@@index([catalogItemId])` to `ProfessionalService` model
- Added `professionalServices ProfessionalService[]` reverse relation to `CatalogItem`

### HSN/SAC Codes
- Added `hsCode String?` + `sacCode String?` to `CatalogItem`
- Added `sacCode String?` to `ServiceMaster`
- `ProductMaster` already had `hsCode`

### Verification
- prisma validate ✅
- prisma generate ✅

## Phase B — XLSX Import Pipeline & Seeder Consolidation

### Dependencies
- Installed `xlsx` npm package via pnpm

### Parser Extension
- Extended `CsvParserService` with `parseXlsx(buffer: Buffer)` method
- Both CSV and XLSX paths share `parseRecords()` for unified validation

### Import Orchestrator
- Updated `ImportOrchestratorService.runFullImport()` with `format?: 'csv' | 'xlsx'` parameter
- ProductMaster import stores `hsCode` (`HS-{serialNo}`)
- ServiceMaster import stores `sacCode` (`SAC-{serialNo}`)
- CatalogItem import stores `hsCode` (Product) and `sacCode` (Service)

### File Import Endpoint
- Added `POST /catalog-import/file-import` to `CatalogImportController`
- Auto-detects XLSX vs CSV by file magic bytes (no format parameter required)

### Seed File
- `prisma/seeds/seed.ts` updated to populate:
  - Master Catalog Categories
  - Master Catalog Subcategories
  - Catalog Items (with hsCode/sacCode)
  - CatalogUnits

## Phase C — CatalogUnit Population

### Import Method
- Added `importCatalogUnits()` to `ImportOrchestratorService`
- Extracts distinct units from workbook rows
- Upserts into `CatalogUnit` model

### Interface Extension
- `ImportResult` extended with `catalogUnitsCreated: number`

### Seed Data
- Seed file populates CatalogUnits from extracted distinct workbook units

## Verification

| Check | Status |
|-------|--------|
| prisma validate | ✅ |
| prisma generate | ✅ |
| tsc (api) | 0 errors ✅ |
| tsc (web) | 0 errors ✅ |
| eslint | no new errors ✅ |
| next build | 297 routes ✅ |

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Product, ProfessionalService, CatalogItem, ServiceMaster extended |
| `apps/api/src/catalog-import/services/csv-parser.service.ts` | Added `parseXlsx()` |
| `apps/api/src/catalog-import/services/import-orchestrator.service.ts` | Format param, hsCode/sacCode, CatalogUnit import |
| `apps/api/src/catalog-import/catalog-import.controller.ts` | `file-import` endpoint |
| `prisma/seeds/seed.ts` | Master Catalog + CatalogUnit population |
| `package.json` | xlsx dependency |

## Stop Condition

Sprint 7 implementation complete. Do NOT begin Sprint 8 until Founder approval.
