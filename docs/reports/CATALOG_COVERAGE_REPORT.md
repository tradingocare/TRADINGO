# Catalog Coverage Report (Sprint 7)

| Entity | Status | Coverage |
|--------|--------|----------|
| Categories → CatalogCategory | ✅ Seeded | 160+ imported |
| Subcategories → CatalogSubcategory | ✅ Seeded | ~1,600 imported |
| Product Masters | ✅ Seeded | ~27,000 imported |
| Service Masters | ✅ Seeded | ~6,600 imported |
| Catalog Items | ✅ Seeded | ~33,600 imported |
| Catalog Units | ✅ Seeded | Distinct units extracted |
| HSN Codes (Product) | ✅ Added to CatalogItem | `HS-{serialNo}` pattern |
| SAC Codes (Service) | ✅ Added to CatalogItem | `SAC-{serialNo}` pattern |
| Product ↔ CatalogItem FK | ✅ Added | `catalogItemId` on Product |
| ProfessionalService ↔ CatalogItem FK | ✅ Added | `catalogItemId` on ProfessionalService |
| CatalogAttributes | 📌 Reserved (P-1) | Not populated |
| CatalogAliases | 📌 Reserved (P-1) | Not populated |
| CatalogIndustryMapping | 📌 Reserved (P-1) | Not populated |

## Data Source

`product_service_catalog.xlsx` — 8 columns (S.No, Category, SubCategory, Name, Type, Unit, AltUnits, QuantityParams)

## Import Pipeline

- CSV via `POST /catalog-import/csv-import`
- XLSX via `POST /catalog-import/file-import` (auto-detected)
- Both routes reuse same parsing validation and upsert logic
