# Sprint 7 — Enterprise Master Catalog Audit

> Audit Date: 2026-07-23
> Source: `E:\tradingo\product_service_catalog.xlsx`
> Status: FOUNDER REVIEW — NO CODING

---

## 1. ENTERPRISE AUDIT

### 1.1 Workbook Structure

| Dimension | Count |
|---|---|
| Sheets | 1 (Product & Service Catalog) |
| Columns | 8 (S.No, Category, SubCategory, Name, Type, UnitMapping, AltUnits, QuantityParams) |
| Top-Level Categories | 160 |
| Subcategories per Category | 10 |
| Total Subcategories | ~1,600 |
| Products per Subcategory | 16 (Product B, Product C, Item Premium/Standard/Economy, Model X1/X2/Pro, Solution Basic/Advanced/Enterprise, Pack Small/Medium/Large, Kit Starter/Professional) |
| Services per Subcategory | 5 (Standard, Premium, Consultation, Management, Support) |
| Total Items | ~33,600 (~27,000 Products + ~6,600 Services) |

### 1.2 Category Tree (160 Landing Pages)

The workbook defines 160 top-level landing categories. Key groups:

**Product-dominant categories** (88):
Agriculture, Animal Feed, Apparel & Fashion, Automation Products, Automobile & Spares, Baby Products, Bags & Luggage, Bakery Items, Bathroom Fittings, Batteries & Inverters, Bearings & Belts, Bike Accessories, Biofuel & Green Energy, Books & Publications, Building & Construction, CCTV & Surveillance, Chemicals, CNC Machines, Computer Hardware, Consumer Electronics, Dairy & Poultry, Doors & Windows, Dry Fruits & Nuts, Edible Oils, Education & Stationery, Electric Vehicles, Electricals & Lighting, EV & Charging Solutions, Farm Equipment, Fasteners & Nuts Bolts, Fire Safety Equipment, Fisheries Equipment, Flour & Grains, Food & Beverages, Food Processing, Frozen Foods, Furniture & Furnishings, Glass & Aluminium, Handicrafts, Health & Pharma, Home & Kitchen, Home Decor, Hospital Furniture, Industrial Machinery, Industrial Supplies, Jewelry, Jewelry Making, Kitchen Appliances, Kitchen Equipment, Lab & Scientific Equipment, Leather Products, Lubricants & Oils, Marine & Fishing, Medical Equipment, Metal Fabrication, Mining & Minerals, Mobile Accessories, Music & Instruments, Nursery & Plants, Office Supplies, Organic Products, Packaging Materials, Paints & Coatings, Paper & Printing, Personal Care, Pet Supplies, Plastic & Polymers, Plastic Molding, Pumps & Pipes, Religious & Spiritual Products, Renewable Energy Equipment, Restaurant Supplies, Rice & Pulses, Robotics, Roofing Solutions, Safety & Security, Scrap & Recycling, Seeds & Fertilizers, Snacks & Namkeen, Solar & Renewable Energy, Spices & Herbs, Sports & Fitness, Sugar & Jaggery, Tea & Coffee, Telecommunication, Textile Manufacturing, Textiles, Timber & Wood, Tools & Hardware, Toys & Games, UPS & Power Backup, Watches & Accessories, Water Treatment, Web Hosting, Welding & Fabrication, Woodworking

**Service-dominant categories** (72):
Accounting Services, AI & Automation Services, Architectural Services, Automobile Services, Business Coaching, Business Loans & Funding, Car Rental Services, Catering Services, Cleaning Services, Cloud Services, Cold Storage Services, Construction Labour, Consultancy Services, Corporate Gifts, Courier Services, Custom Manufacturing, Cyber Security Services, Data Analytics Services, Digital Marketing, E-commerce Consulting, Event Management, Export-Import Services, Facility Management, Film & Media Production, Financial Services, Franchise Opportunities, Graphic Design, Hardware Repair, Heavy Equipment Rental, Hospitality, HR & Recruitment, Human Resource Outsourcing, Influencer & Creator Services, Insurance Services, Interior Designing, Inventory Management, IT & Software, IT Support, Laundry Services, Legal Services, Logistics & Packaging, Maintenance Services, Manpower Suppliers, Medical Lab Services, Packers & Movers, Pest Control, Photography Services, Printing Services, Public Relations, Quality Control, Real Estate, Real Estate Agents, Scrap Buyers, Security Services, Software Development, Supply Chain Logistics, Translation Services, Travel & Tourism, Visa & Immigration Services, Warehouse Space Rental, Waste Management

### 1.3 Product Variant Pattern

Every subcategory follows identical product structure (generated placeholder data):
```
Product B - {SubCategory} Type 1       (unit: Per Day, Monthly)
Product C - {SubCategory} Type 2       (unit: Per Sample, Batch)
Item Premium - {SubCategory} Type 3    (unit: Per Trip, Contract)
Item Standard - {SubCategory} Type 4   (unit: Per Formula, Contract)
Item Economy - {SubCategory} Type 5    (unit: Per Animal, Annual)
Model X1 - {SubCategory} Type 6        (unit: Sheet, Box)
Model X2 - {SubCategory} Type 7        (unit: Roll, Pallet)
Model Pro - {SubCategory} Type 8       (unit: Sqft, Sqmt)
Solution Basic - {SubCategory} Type 9  (unit: Sqmt, Acre)
Solution Advanced - {SubCategory} Type 10 (unit: Kg, Ton)
Solution Enterprise - {SubCategory} Type 11 (unit: Litre, Barrel)
Pack Small - {SubCategory} Type 12     (unit: Piece, Dozen)
Pack Medium - {SubCategory} Type 13    (unit: Set, Lot)
Pack Large - {SubCategory} Type 14     (unit: Meter, Roll)
Kit Starter - {SubCategory} Type 15    (unit: Box, Carton)
Kit Professional - {SubCategory} Type 16 (unit: Bag, Pallet)
```

### 1.4 Service Variant Pattern

Every subcategory follows identical service structure:
```
Standard Service - {SubCategory} Option 1    (unit: Per Project, Contract, qty:1)
Premium Service - {SubCategory} Option 2     (unit: Per Project, Contract, qty:1)
Consultation - {SubCategory} Option 3        (unit: Per Project, Contract, qty:1)
Management Service - {SubCategory} Option 4  (unit: Per Project, Contract, qty:1)
Support Service - {SubCategory} Option 5     (unit: Per Project, Contract, qty:1)
```

### 1.5 Unit Mapping (from workbook)

Units used across the workbook (derived from all item rows):
`Litre, Barrel, Piece, Dozen, Set, Lot, Meter, Roll, Box, Carton, Bag, Pallet, Unit, License, Subscription, Service, Contract, Ton, MT, Pack, Gram, Kg, Can, Book, Certificate, Credit, Per Filing, Annual, Per Month, Per Hour, Monthly, Per Project, Per Acre, Per Season, Per Day, Per Sample, Batch, Per Trip, Per Formula, Per Animal, Sheet, Sqft, Sqmt, Roll, Pallet, Book, Box, Gram, Kg, Can, Pallet, Bag, Pallet, Unit, Lot, Pack, Carton`

### 1.6 What Is NOT in the Workbook

| Feature | Status |
|---|---|
| Brands | NOT PRESENT — no brand column |
| Attribute Specs | NOT PRESENT — no attribute/specification columns |
| HSN Codes | NOT PRESENT — no HSN column |
| SAC Codes | NOT PRESENT — no SAC column |
| Skills | NOT PRESENT — no skill tags |
| Certifications | NOT PRESENT — no certification data |
| Pricing | NOT PRESENT — quantity params only (numbers 5-250) |
| Descriptions | NOT PRESENT — names only |
| Images | NOT PRESENT — names only |
| SEO metadata | NOT PRESENT — names only |

---

## 2. WORKBOOK MAPPING

### 2.1 Existing Model Mapping

```
Workbook Column          → Existing Prisma Model           → Field
──────────────────────────────────────────────────────────────────────
S.No                     → CatalogItem.sourceData          → JSON {serialNo}
Category                 → CatalogCategory.name            → name
                           Category.name (legacy)
Sub Category             → CatalogSubcategory.name         → name
Product/Service Name     → CatalogItem.name                → name
                           ProductMaster.name (legacy)
                           ServiceMaster.name (legacy)
Type                     → CatalogItem.type                → CatalogItemType (Product|Service)
Unit Mapping             → CatalogItem.unit                → String?
                           CatalogUnit.name (reserved)
Alt/Secondary Units      → CatalogItem.altUnits            → String?
Quantity Parameters      → CatalogItem.quantityParams      → String?
```

### 2.2 Existing Import Pipeline

Already reads the SAME CSV format:
- `CsvParserService` extracts: `serialNo, category, subCategory, name, type, unit, altUnits, quantityParams`
- `ImportOrchestratorService` dual-writes to `Category` + `CatalogCategory`, `CatalogSubcategory`, `CatalogItem`, `ProductMaster`, `ServiceMaster`
- Seeder at `prisma/seeds/seed.ts` reads `"product service catalog.csv"`

### 2.3 Dual Taxonomy Bridge (Already Built)

Phase P-2.x already completed:
- Catalog Adapter (P-2.1)
- TradeServ Taxonomy Bridge (P-2.2)
- Marketplace Taxonomy Audit & Bridge (P-2.3)
- OpenSearch Index Extension (P-2.4)
- RFQ/Quote Taxonomy Upgrade (P-2.5, P-2.6)
- Smart Negotiation Taxonomy Integration (P-2.7)

---

## 3. GAP ANALYSIS

### 3.1 Cross-Check Matrix

| Domain | Workbook Has | Implementation Has | Gap | Action |
|---|---|---|---|---|
| Categories | 160 top-level | `CatalogCategory` model | No gap | Already importable |
| Subcategories | ~1,600 | `CatalogSubcategory` model | No gap | Already importable |
| Items | ~33,600 | `CatalogItem` model | No gap | Already importable |
| Product types | Product/Service | `CatalogItemType` enum | No gap | Identical |
| Units | ~50 distinct units | `CatalogUnit` model (empty) | **Model exists but empty** | Populate from workbook |
| Brands | None in workbook | `GlobalBrand` (CRUD ready) | No workbook data | Extend workbook or add admin |
| Attributes/Specs | None in workbook | `GlobalAttribute` (15 types) | No workbook data | Extend workbook or add admin |
| HSN Codes | None in workbook | `ProductMaster.hsCode` field | No workbook data | Add to workbook or AI suggest |
| SAC Codes | None in workbook | **MISSING** | **No SAC field anywhere** | Add `sacCode` to ServiceMaster + CatalogItem |
| Alt Units | Present | `CatalogItem.altUnits` | No gap | Already mapped |
| Quantity Params | Present | `CatalogItem.quantityParams` | No gap | Already mapped |
| Prompts (AI) | None | `AI_GATEWAY` seeded | No gap | Post-import AI enrichment |
| OpenSearch Index | N/A | Enterprise search indices | No gap | Already indexed |
| CSV Import | Workbook is XLSX | `CsvParserService` reads CSV | **Workbook is XLSX, seeder reads CSV** | Add XLSX reader or convert |
| Seller Products | N/A | `Product` model with `ProductMaster` link | Link missing between `CatalogItem` and `Product` | Add `CatalogItem` FK to `Product` |
| TradeServ Services | N/A | `ProfessionalService` model | Link missing between `CatalogItem` and `ProfessionalService` | Add `CatalogItem` FK to `ProfessionalService` |
| Admin CRUD | N/A | `GlobalBrandController`, `GlobalAttributeController`, `TaxonomyController` | No gap | Already built |
| Catalog Sync | N/A | `ImportOrchestratorService` | **Duplicate seeder vs import flow** | Consolidate |

### 3.2 Critical Gaps

#### Gap 1: CatalogItem ↔ Product Link Missing
**Severity**: HIGH
**Impact**: Seller products are not traceable to Master Catalog. Search, analytics, and ranking cannot correlate seller inventory to catalog reference.
**Fix**: Add `catalogItemId String?` FK to `Product` model.

#### Gap 2: CatalogItem ↔ ProfessionalService Link Missing
**Severity**: HIGH
**Impact**: TradeServ services are not traceable to Master Catalog.
**Fix**: Add `catalogItemId String?` FK to `ProfessionalService` model.

#### Gap 3: No SAC Code Support
**Severity**: HIGH (for invoicing/compliance)
**Impact**: Services have HSN but no SAC. Invoicing for services requires SAC for GST compliance.
**Fix**: Add `sacCode String?` to `ServiceMaster` and `CatalogItem` models.

#### Gap 4: Duplicate Seeder vs Import Pipeline
**Severity**: MEDIUM
**Impact**: Two separate code paths read the same data:
1. `apps/api/src/catalog-import/` — POST /import, POST /csv-import (production import)
2. `prisma/seeds/` — `seed.ts` reads CSV (database seeding)
Both do the same thing differently. Risk of divergence.
**Fix**: Consolidate into one pipeline. Seeder should call the import service.

#### Gap 5: Workbook is XLSX, Seeder Reads CSV
**Severity**: MEDIUM
**Impact**: The source file is `product_service_catalog.xlsx` but the seeder reads `product service catalog.csv`. No CSV exists.
**Fix**: Add XLSX parsing to the import pipeline or convert workbook to CSV.

#### Gap 6: CatalogUnit Model Populated
**Severity**: LOW
**Impact**: `CatalogUnit` model exists but has zero rows. Units are stored as free-text strings in `CatalogItem.unit`.
**Fix**: Extract distinct units from workbook during import and populate `CatalogUnit`.

#### Gap 7: CatalogAttribute Not Populated
**Severity**: LOW
**Impact**: `CatalogAttribute` model exists (reserved) but never populated. The workbook has no attribute data.
**Fix**: Post-import AI enrichment phase can populate attributes.

#### Gap 8: CatalogAlias Not Populated
**Severity**: LOW
**Impact**: `CatalogAlias` model exists (reserved) but never populated.
**Fix**: Post-import enrichment using synonym intelligence.

#### Gap 9: CatalogIndustryMapping Not Populated
**Severity**: LOW
**Impact**: `CatalogIndustryMapping` model exists (reserved) but never populated. Industry→category links built via `IndustryCategoryMapping` instead.
**Fix**: Decide which mapping to use. Currently two parallel systems.

### 3.3 Non-Gaps (Already Solved)

| Area | Status | Evidence |
|---|---|---|
| Category hierarchy import | ✅ SOLVED | ImportOrchestratorService imports both `Category` and `CatalogCategory` |
| Subcategory import | ✅ SOLVED | Same pipeline creates `Category.children` + `CatalogSubcategory` |
| Product/service import | ✅ SOLVED | Dual-writes to `ProductMaster`/`ServiceMaster` + `CatalogItem` |
| OpenSearch indexing | ✅ SOLVED | EnterpriseSearchService indexes all catalogs |
| Admin catalog management | ✅ SOLVED | Catalog-admin dashboard, GlobalBrand/GAttribute CRUD, Taxonomy engine |
| Synonym expansion | ✅ SOLVED | SynonymIntelligenceService with 40+ built-in pairs |
| Search analytics | ✅ SOLVED | EnterpriseSearchAnalyticsService with trending |
| Catalog quality scoring | ✅ SOLVED | CatalogQualityScore model + AI scoring |
| AI enrichment pipeline | ✅ SOLVED | AiProductIntelligenceService with title/attribute/category suggestions |
| Event-driven catalog sync | ✅ SOLVED | EnterpriseCommerceEventService with 11 lifecycle events |
| Advertising integration | ✅ SOLVED | CatalogAdvertisingService auto-promotes top products |

---

## 4. ARCHITECTURE PROPOSAL

### 4.1 Single Source of Truth

```
product_service_catalog.xlsx
         │
         ▼
┌──────────────────────────────────────────────┐
│         ImportOrchestratorService             │  ← SINGLE entry point
│  (upgraded: reads XLSX + CSV)                │
└──────┬──────────────┬───────────────┬─────────┘
       │              │               │
       ▼              ▼               ▼
┌──────────┐  ┌────────────┐  ┌──────────────┐
│ Master   │  │ Legacy     │  │ TradeServ    │
│ Catalog  │  │ Marketplace│  │ Professional │
├──────────┤  ├────────────┤  ├──────────────┤
│ Category │  │ Category   │  │ (uses        │
│ Subcat   │  │ Product    │  │ CatalogItem  │
│ Item     │  │ Master     │  │ as reference)│
│ Attribute│  │ Service    │  │              │
│ Alias    │  │ Master     │  │              │
│ Unit     │  │            │  │              │
└──────────┘  └────────────┘  └──────────────┘
```

### 4.2 Key Design Decisions

1. **ImportOrchestratorService** is the SINGLE entry point for all catalog data. Delete `prisma/seeds/` catalog seeders. The seeder should call the import service.

2. **XLSX support** added to `CsvParserService` (rename to `CatalogParserService`). Use `xlsx` npm package (already available via npx).

3. **CatalogItem ↔ Product link**: Add `catalogItemId` FK to `Product` model. This binds every seller product to its master catalog entry.

4. **CatalogItem ↔ ProfessionalService link**: Add `catalogItemId` FK to `ProfessionalService` model.

5. **SAC code**: Add `sacCode` field to `ServiceMaster` and `CatalogItem`. Extend `GlobalAttributeType` with SAC type.

6. **CatalogUnit population**: Extract distinct unit values during import and upsert into `CatalogUnit`.

7. **CatalogAttribute population**: Post-import, use AI enrichment (existing `AiProductIntelligenceService.suggestAttributes()`) to populate attributes per item.

---

## 5. IMPLEMENTATION PLAN

### Phase 1: Foundation (No workbook modifications)
| Task | Effort | Files |
|---|---|---|
| 1.1 Add `catalogItemId` FK to `Product` model | 1h | `schema.prisma` |
| 1.2 Add `catalogItemId` FK to `ProfessionalService` model | 1h | `schema.prisma` |
| 1.3 Add `sacCode` to `ServiceMaster` + `CatalogItem` | 1h | `schema.prisma` |
| 1.4 Extend `GlobalAttributeType` with SAC | 30m | `schema.prisma` |
| 1.5 Run `prisma migrate dev` | 15m | — |
| 1.6 Verify tsc | 5m | — |

### Phase 2: Import Pipeline Upgrade
| Task | Effort | Files |
|---|---|---|
| 2.1 Add XLSX parsing to `CsvParserService` (rename → `CatalogParserService`) | 3h | `catalog-import/services/` |
| 2.2 Add `CatalogUnit` upsert to import pipeline | 1h | `import-orchestrator.service.ts` |
| 2.3 Consolidate seeder → call import service | 2h | `prisma/seeds/seed.ts` |
| 2.4 Add `sacCode` import from workbook (if column added) | 1h | `catalog-import.dto.ts` |
| 2.5 Update `CsvRow` type to match workbook columns | 30m | `catalog-import.dto.ts` |
| 2.6 Test full import cycle | 2h | — |
| 2.7 Verify tsc + build | 15m | — |

### Phase 3: Catalog Population & Linkage
| Task | Effort | Files |
|---|---|---|
| 3.1 Run import against workbook (all 33,600 items) | 30m | — |
| 3.2 Verify `CatalogCategory` rows (160) | 5m | — |
| 3.3 Verify `CatalogSubcategory` rows (~1,600) | 5m | — |
| 3.4 Verify `CatalogItem` rows (~33,600) | 5m | — |
| 3.5 Verify `CatalogUnit` rows (~50) | 5m | — |
| 3.6 Verify `ProductMaster` + `ServiceMaster` rows | 5m | — |
| 3.7 Link existing `Product` records to `CatalogItem` | 2h | migration script |
| 3.8 Link existing `ProfessionalService` records to `CatalogItem` | 2h | migration script |
| 3.9 Index all catalogs in OpenSearch | 30m | — |

### Phase 4: Post-Import Enrichment
| Task | Effort | Files |
|---|---|---|
| 4.1 AI suggest HSN codes for products via AiGateway | 3h | `ai-product-intelligence.service.ts` |
| 4.2 AI suggest SAC codes for services | 3h | `ai-product-intelligence.service.ts` |
| 4.3 Populate `CatalogAttribute` from AI suggestions | 2h | `catalog-admin.service.ts` |
| 4.4 Populate `CatalogAlias` from synonyms | 1h | `taxonomy.service.ts` |
| 4.5 Verify tsc + build | 15m | — |

### Phase 5: Admin & UX
| Task | Effort | Files |
|---|---|---|
| 5.1 Add CatalogItem browser to admin catalog console | 4h | admin page |
| 5.2 Add CatalogUnit admin management page | 2h | admin page |
| 5.3 Add SAC code display to service detail pages | 2h | frontend pages |
| 5.4 Verify build | 15m | — |

### Total Effort: ~30 hours engineering

### What Must NOT Change
- `CatalogCategory`, `CatalogSubcategory`, `CatalogItem` — already frozen models, only populate
- `GlobalBrand` — already frozen, no modification needed
- `GlobalAttribute` — already frozen, only extend enum
- `CatalogQualityScore` — already frozen, no modification
- `EnterpriseSearchService` — already frozen, no modification
- `SynonymIntelligenceService` — already frozen, no modification
- Enterprise ranking engine — already frozen, no modification
- Event-driven catalog sync — already frozen, no modification

### What Must Be Reused
- ✅ `ImportOrchestratorService` — extend, don't replace
- ✅ `CsvParserService` — extend to handle XLSX
- ✅ `CatalogAdminService` — reuse for new admin pages
- ✅ `EnterpriseSearchService` — reuse for re-indexing
- ✅ `AiProductIntelligenceService` — reuse for AI enrichment

### What Must Never Be Duplicated
- ❌ Do NOT create a third catalog model. Use CatalogCategory/Subcategory/Item.
- ❌ Do NOT create a second import pipeline. Extend the existing one.
- ❌ Do NOT create duplicate admin pages. Extend existing catalog-admin controller.
- ❌ Do NOT create separate product/service sync. The dual-write pattern is already correct.
