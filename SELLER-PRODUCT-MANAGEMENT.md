# Seller Product Management System — Phase 11

## Status: ✅ Complete

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          Seller Dashboard (Web)                           │
├────────────────────────────────────────────────────────────────────────────┤
│ Products → [All | Drafts | Pending | Rejected | Live | Inactive | Archived]│
│           [Add Product] [Bulk Upload] [Media Library] [Analytics]          │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────────┐
│                     Seller Product API (NestJS)                            │
├────────────────────────────────────────────────────────────────────────────┤
│ SellerProductController  →  SellerProductService  →  Prisma               │
│ ProductApprovalController →  ProductApprovalService                       │
│ MediaLibraryController    →  MediaLibraryService                          │
│ BulkUploadController      →  BulkUploadService                            │
│ ProductAnalyticsController → ProductAnalyticsService                      │
│ ProductExportController   →  ProductExportService                         │
│ ProductBrandController    →  ProductBrandService                          │
├────────────────────────────────────────────────────────────────────────────┤
│                        Existing Modules (Reused)                           │
├────────────────────────────────────────────────────────────────────────────┤
│ ProductsService (CRUD, OpenSearch sync)                                    │
│ ProductOnboardingService (drafts, completeness)                            │
│ StorageService (S3 upload)                                                 │
│ CategoriesService (category tree)                                          │
│ SearchModule (OpenSearch)                                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
apps/api/src/modules/seller-product/
  seller-product.module.ts
  seller-product.controller.ts
  seller-product.service.ts
  seller-product.dto.ts
  approval.controller.ts
  approval.service.ts
  media-library.controller.ts
  media-library.service.ts
  bulk-upload.controller.ts
  bulk-upload.service.ts
  product-analytics.controller.ts
  product-analytics.service.ts
  product-export.controller.ts
  product-export.service.ts
  brand.controller.ts
  brand.service.ts

apps/web/app/seller/products/
  page.tsx                          ← NEW: Full product management dashboard
  new/
    page.tsx                        ← 10-step add product wizard
  [id]/
    edit/
      page.tsx                      ← Edit product (same form, pre-filled)
  bulk-upload/
    page.tsx                        ← ENHANCED: Excel/CSV bulk upload
  media/
    page.tsx                        ← Media Library with folders
  analytics/
    page.tsx                        ← Product analytics
```

## Prisma Models

### Extended ProductStatus enum
```prisma
enum ProductStatus { DRAFT, ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED, PENDING_APPROVAL, REJECTED }
```

### ProductApproval
Tracks the approval workflow for products.
| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | Primary key |
| productId | String | Reference to Product |
| action | ProductApprovalAction | SUBMITTED / APPROVED / REJECTED / REVISION_REQUESTED |
| reviewerId | String? | Admin who reviewed |
| reason | String? | Rejection reason or revision notes |
| createdAt | DateTime | Timestamp |

### ProductBrand
Company-managed brand catalog.
| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | Primary key |
| companyId | String | Owner company |
| name | String | Brand name |
| slug | String (unique) | URL-friendly name |
| logo | String? | Logo URL |
| description | String? | Brand description |
| status | BrandStatus | ACTIVE / INACTIVE |

### MediaFolder
Folder-based media organization.
| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | Primary key |
| companyId | String | Owner company |
| name | String | Folder name |
| parentId | String? | Parent folder (nesting) |
| sortOrder | Int | Display order |

### ProductMedia enhancements
Add optional: folderId, altText, fileSize, mimeType, isPrimary

### ProductExportJob
Tracks catalog export jobs.
| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | Primary key |
| companyId | String | Owner company |
| type | ExportType | EXCEL / CSV |
| status | ExportJobStatus | PENDING / PROCESSING / COMPLETED / FAILED |
| fileUrl | String? | Download URL |
| createdAt | DateTime | |

## API Endpoints

### Seller Product Management
All endpoints prefixed with `/seller/products`, JWT-guarded.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/seller/products` | GET | List seller's products (paginated, status filter, search) |
| `/seller/products/:id` | GET | Get single product detail with all relations |
| `/seller/products` | POST | Create new product |
| `/seller/products/:id` | PATCH | Update product |
| `/seller/products/:id` | DELETE | Soft-delete product |
| `/seller/products/:id/submit` | POST | Submit for approval (DRAFT → PENDING_APPROVAL) |
| `/seller/products/:id/approve` | POST | Approve (PENDING_APPROVAL → ACTIVE) |
| `/seller/products/:id/reject` | POST | Reject (PENDING_APPROVAL → REJECTED) |
| `/seller/products/:id/archive` | POST | Archive (→ DISCONTINUED) |
| `/seller/products/:id/restore` | POST | Restore (→ DRAFT) |
| `/seller/products/:id/duplicate` | POST | Duplicate product |
| `/seller/products/bulk/status` | PATCH | Bulk status change |
| `/seller/products/bulk/delete` | POST | Bulk soft-delete |

### Product Brands
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/seller/brands` | GET | List company brands |
| `/seller/brands` | POST | Create brand |
| `/seller/brands/:id` | PATCH | Update brand |
| `/seller/brands/:id` | DELETE | Delete brand |

### Product Media Library
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/seller/media` | GET | List media (folder filter) |
| `/seller/media` | POST | Upload media |
| `/seller/media/:id` | PATCH | Update media (title, alt, folder) |
| `/seller/media/:id` | DELETE | Delete media |
| `/seller/media/folders` | GET | List folders (tree) |
| `/seller/media/folders` | POST | Create folder |
| `/seller/media/folders/:id` | PATCH | Rename folder |
| `/seller/media/folders/:id` | DELETE | Delete folder |

### Product Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/seller/analytics/overview` | GET | Aggregate stats (total, active, views, saved) |
| `/seller/analytics/products` | GET | Per-product analytics (views, clicks, RFQs, chats, orders) |
| `/seller/analytics/performance` | GET | Top/bottom performers |

### Product Export
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/seller/export/products` | POST | Start export job |
| `/seller/export/jobs` | GET | List export jobs |
| `/seller/export/jobs/:id` | GET | Get job status |
| `/seller/export/jobs/:id/download` | GET | Download exported file |
| `/seller/import/preview` | POST | Preview Excel/CSV before import |
| `/seller/import/validate` | POST | Validate import data |
| `/seller/import` | POST | Execute import |

## Approval Workflow

```
DRAFT
  │
  ▼  [Submit for Approval]
SUBMITTED (PENDING_APPROVAL)
  │
  ├──▶ [Admin Approves] ──▶ APPROVED (ACTIVE) ──▶ LIVE on marketplace
  │
  └──▶ [Admin Rejects] ──▶ REJECTED
                            │
                            ▼  [Edit & Resubmit]
                          DRAFT (revision)
```

- Sellers submit products for approval
- Admins review via admin dashboard
- Rejected products show reason and return to draft for revision
- Approved products go live immediately

## Media Structure

```
S3 Bucket: tradingo-uploads
  └── products/
      └── {companyId}/
          └── {productId}/
              ├── images/
              │   ├── {uuid}.jpg
              │   └── {uuid}.jpg
              ├── videos/
              │   └── {uuid}.mp4
              └── documents/
                  ├── catalog.pdf
                  └── datasheet.pdf
```

## Excel Import Format

| Column | Required | Description |
|--------|----------|-------------|
| name | ✅ | Product name |
| slug | ❌ | Auto-generated if empty |
| shortDescription | ❌ | Brief description |
| description | ❌ | Full description |
| category | ❌ | Category name (matched by slug) |
| brand | ❌ | Brand name |
| model | ❌ | Model number |
| sku | ❌ | SKU code |
| hsn | ❌ | HSN code |
| price | ❌ | Selling price |
| compareAtPrice | ❌ | MRP/Compare price |
| moq | ❌ | Minimum order quantity |
| unit | ❌ | Unit (kg, pcs, etc.) |
| stock | ❌ | Available quantity |
| weight | ❌ | Weight in kg/g |
| dimensions | ❌ | L x W x H |
| status | ❌ | draft/active/inactive |

## Future AI Integration

- **Smart Category Suggestions** — ML model recommends category based on product name/description
- **Automated Tagging** — NLP extracts keywords, specs, and attributes from descriptions
- **Duplicate Detection** — AI identifies similar products by name/description similarity
- **Price Optimization** — Suggests optimal pricing based on market data
- **Image Quality Check** — Auto-rejects low-quality or inappropriate images
- **SEO Score** — Predicts search ranking and suggests improvements
- **Bulk Description Generation** — Auto-generates descriptions from specs
- **Anomaly Detection** — Flags unusual pricing, stock, or content changes

## Rollback Strategy

### Prisma Rollback
```bash
# Revert schema changes
git checkout -- prisma/schema.prisma
npx prisma db push --force-reset  # WARNING: drops data
```

### API Rollback
```bash
cd apps/api
git checkout -- src/modules/seller-product/
```

### Web Rollback
```bash
cd apps/web
git checkout -- app/seller/products/
```

### Safe Rollback (no data loss)
If only code changes need reverting and schema is compatible:
```bash
git revert <commit-hash>
npx prisma generate
```

### Database Migrations
The new enums (`PENDING_APPROVAL`, `REJECTED`) are additive — existing products with status `DRAFT` or `ACTIVE` are unaffected. The new tables (`ProductApproval`, `ProductBrand`, `MediaFolder`, `ProductExportJob`) have no required foreign keys to existing data.
