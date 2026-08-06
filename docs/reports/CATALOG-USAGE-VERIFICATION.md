# Catalog Data Usage Verification

## Source of Truth: `apps/web/data/catalog-data.ts`
- 160 categories with slugs
- 1,600+ subcategories
- Product & service counts

## Files Updated to Use `CATALOG_CATEGORIES`

| File | What Changed |
|------|-------------|
| `apps/web/app/categories/page.tsx` | Uses `CATALOG_CATEGORIES` for all category cards, filtering, stats |
| `apps/web/app/categories/[slug]/page.tsx` | Uses catalog data for category detail & subcategory grid |
| `apps/web/app/trading/page.tsx` | Uses `CATALOG_CATEGORIES.slice(0,8)` for section cards |
| `apps/web/app/products/ProductsPageClient.tsx` | Uses `REAL_CATEGORIES` mapped from `CATALOG_CATEGORIES` as API fallback |
| `apps/web/app/browse/page.tsx` | Uses `MASTER_PRODUCTS` as fallback (no individual product in catalog-data) |
| `apps/web/app/sitemap.ts` | Uses `CATALOG_SITEMAP_CATEGORIES` for dynamic category sitemap entries |
| `apps/web/app/register/vendor/steps/Step5BusinessProfile.tsx` | `CATEGORIES` derived from `CATALOG_CATEGORIES` |
| `apps/web/app/register/buyer/steps/Step3Preferences.tsx` | `CATEGORIES` derived from `CATALOG_CATEGORIES` |
| `apps/web/app/register/buyer/steps/Step2CompanyProfile.tsx` | `INDUSTRIES` derived from `CATALOG_CATEGORIES` |
| `apps/web/app/rfq/new/RfqCreationWizard.tsx` | `CATEGORIES` derived from `CATALOG_CATEGORIES` |
| `apps/web/app/industries/page.tsx` | `industries` mapped from `CATALOG_CATEGORIES` |
| `apps/web/app/admin/categories/page.tsx` | `categories` mapped from `CATALOG_CATEGORIES` |

## Files Using `master-data.ts` as Fallback (No Individual Product Data in Catalog)

| File | Data Source | Reason |
|------|------------|--------|
| `apps/web/app/browse/page.tsx` | `MASTER_PRODUCTS` | Fallback when API empty — catalog has no individual products |
| `apps/web/app/products/ProductsPageClient.tsx` | `MASTER_PRODUCTS` + `MASTER_SERVICES` | Fallback when API empty — catalog has no individual products |

## Excluded (Legitimate Domain-Specific Constants)
- `seller/beta/support/page.tsx` `CATEGORIES` — support ticket categories (Technical, Billing, etc.)
- `admin/products/page.tsx` hardcoded products — admin UI mockup
- `admin/launch/checklist/page.tsx` — launch checklist categories (Infrastructure, Content, etc.)

## Verification
All user-facing pages now source their category/industry data from `CATALOG_CATEGORIES` in `catalog-data.ts`. No hardcoded mock arrays remain in the public app routes.
