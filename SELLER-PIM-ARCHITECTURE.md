# Seller PIM Architecture — Phase 11

## Status: ✅ In Implementation

## Architecture Overview

The Seller Product Information Management (PIM) system is the **single source of truth** for all products in TRADINGO. Every module — Search, Discovery, Company Profile, RFQ, Orders, AI Search, Near To Far™, Product Cards — consumes products from this system.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Seller PIM (NestJS API)                         │
├─────────────────────────────────────────────────────────────────────────┤
│ SellerProductController ──► SellerProductService ──► Prisma              │
│ ProductApprovalController ─► ProductApprovalService                    │
│ MediaLibraryController ────► MediaLibraryService                       │
│ BulkOperationsController ──► BulkOperationsService                     │
│ ProductAnalyticsController ► ProductAnalyticsService                   │
│ BrandController ───────────► BrandService                              │
│ ProductExportController ───► ProductExportService                      │
├─────────────────────────────────────────────────────────────────────────┤
│                         Reused Existing Modules                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ProductsService     │ ProductOnboardingService │ StorageService         │
│ CategoriesService   │ SearchService            │ MembershipService      │
└─────────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                        Frontend (Next.js)                                │
├─────────────────────────────────────────────────────────────────────────┤
│ /seller/products/*      — Full PIM dashboard (All, Drafts, Pending,     │
│                           Rejected, Live, Inactive, Archived)           │
│ /seller/products/new    — 10-step creation wizard                      │
│ /seller/products/[id]/edit — Edit product (pre-filled wizard)          │
│ /seller/brands/*        — Brand management                              │
│ /seller/media/*         — Media Library with folders                    │
│ /seller/bulk-upload/*   — Import (Excel/CSV/ZIP)                       │
│ /seller/export/*        — Export (Excel/CSV)                           │
│ /seller/analytics/*     — Product analytics                             │
│ /admin/products/approval — Admin approval queue                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
apps/api/src/modules/seller-product/
├── seller-product.module.ts
├── seller-product.controller.ts
├── seller-product.service.ts
├── seller-product.dto.ts
├── approval.controller.ts
├── approval.service.ts
├── media-library.controller.ts
├── media-library.service.ts
├── bulk-operations.controller.ts
├── bulk-operations.service.ts
├── product-analytics.controller.ts
├── product-analytics.service.ts
├── brand.controller.ts
├── brand.service.ts
├── product-export.controller.ts
├── product-export.service.ts
```

```
apps/web/app/seller/
├── products/
│   ├── page.tsx                        — Full dashboard with status tabs
│   ├── new/page.tsx                    — 10-step wizard wrapper
│   ├── [id]/edit/page.tsx             — Edit product
│   ├── drafts/page.tsx                — Draft products
│   ├── pending/page.tsx               — Pending approval
│   ├── rejected/page.tsx              — Rejected products
│   ├── live/page.tsx                  — Live products
│   ├── inactive/page.tsx              — Inactive products
│   ├── archived/page.tsx              — Archived products
├── brands/page.tsx                     — Brand management
├── media/page.tsx                      — Media library
├── bulk-upload/page.tsx               — Import
├── export/page.tsx                    — Export
├── analytics/page.tsx                 — Analytics

apps/web/app/admin/products/
└── approval/page.tsx                  — Approval queue
```

## Workflow

```
                                     ┌──────────┐
                                     │  Seller   │
                                     │  Login    │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │Membership │
                                     │Validation │
                                     └────┬─────┘
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                    ┌─────▼────┐   ┌──────▼──────┐  ┌────▼─────┐
                    │ Dashboard│   │ Add Product │  │  Import  │
                    └─────┬────┘   └──────┬──────┘  └────┬─────┘
                          │               │               │
                          │         ┌─────▼──────┐        │
                          │         │  10-Step   │        │
                          │         │  Wizard    │        │
                          │         └─────┬──────┘        │
                          │               │               │
                          │         ┌─────▼──────┐        │
                          │         │   Draft    │        │
                          │         └─────┬──────┘        │
                          │               │               │
                          │         ┌─────▼──────┐        │
                          │         │  Preview   │        │
                          │         └─────┬──────┘        │
                          │               │               │
                          │         ┌─────▼──────┐        │
                          │         │  Submit    │────────┘
                          │         │ Approval   │
                          │         └─────┬──────┘
                          │               │
                          │         ┌─────▼──────┐
                          │         │   Admin    │
                          │         │  Review    │
                          │         └─────┬──────┘
                          │          ┌────┴────┐
                          │          │         │
                          │    ┌─────▼───┐ ┌───▼──────┐
                          │    │Approved │ │ Rejected │
                          │    └─────┬───┘ └───┬──────┘
                          │          │         │
                          │    ┌─────▼───┐     │
                          │    │  Live   │     │ (Revision)
                          │    │Marketpl.│     └──► Draft
                          │    └─────┬───┘
                          │          │
                          │    ┌─────▼───┐
                          │    │Analytics│
                          │    └─────────┘
```

## Database Mapping

| Entity | Prisma Model | Key Relations |
|--------|-------------|---------------|
| Product | Product | companyId, categoryId, brandId, approvals |
| ProductStatus | enum | DRAFT, PENDING_APPROVAL, REJECTED, ACTIVE, INACTIVE, DISCONTINUED |
| ProductBrand | ProductBrand | companyId, products[] |
| ProductMedia | ProductMedia | productId, folderId |
| MediaFolder | MediaFolder | companyId, parentId, children[], media[] |
| ProductApproval | ProductApproval | productId, reviewerId |
| ProductExportJob | ProductExportJob | companyId |

## Approval Flow

```
Product.status = DRAFT
    │
    ▼  [Seller submits for approval]
Product.status = PENDING_APPROVAL
ProductApproval { action: SUBMITTED }
    │
    ├──▶ [Admin approves]
    │    Product.status = ACTIVE
    │    ProductApproval { action: APPROVED, reviewerId, reason? }
    │    Product goes LIVE on marketplace
    │
    └──▶ [Admin rejects with reason]
         Product.status = REJECTED
         ProductApproval { action: REJECTED, reviewerId, reason }
         Seller revises and resubmits → back to DRAFT
```

## Membership Enforcement

| Plan | Max Products | Bulk Import | Media Storage |
|------|-------------|-------------|---------------|
| Trade Start | 1 | ❌ | 50 MB |
| Trade Smart | 25 | ✅ CSV | 200 MB |
| Trade Plus | 100 | ✅ Excel/CSV | 500 MB |
| Trade Pro | 500 | ✅ Excel/CSV/ZIP | 1 GB |
| Trade Premium | 2000 | ✅ All | 2 GB |
| Trade Elite | Unlimited | ✅ All | 5 GB |

Enforced at API level: `SellerProductService.checkMembershipLimit(companyId)`

## Media Pipeline

```
Upload ──► S3 ──► ProductMedia record ──► Thumbnail generation (future)
  │                      │
  ├── Image              ├── folderId → MediaFolder
  ├── Video              ├── isPrimary → primary image
  ├── PDF                ├── altText → accessibility
  └── ZIP                └── sortOrder → ordering
```

## Bulk Import Format

### Excel/CSV Columns
| Column | Required | Validation |
|--------|----------|------------|
| name | ✅ | 1-200 chars |
| slug | ❌ | Auto-generated if empty; unique check |
| shortDescription | ❌ | Max 500 chars |
| description | ❌ | Max 5000 chars |
| category | ❌ | Must match existing category slug |
| brand | ❌ | Must match existing brand name |
| model | ❌ | — |
| sku | ❌ | Unique per company |
| hsn | ❌ | 4-8 digit HSN/SAC code |
| price | ❌ | Positive decimal |
| compareAtPrice | ❌ | Positive decimal |
| moq | ❌ | Positive integer |
| unit | ❌ | — |
| stock | ❌ | Non-negative integer |
| weight | ❌ | Positive decimal |
| dimensions | ❌ | Format: LxWxH (cm) |
| status | ❌ | draft/active |

## API Contracts

### Seller Product Management (`/seller/products`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /seller/products | JWT | List seller's products (status filter, search, pagination) |
| GET | /seller/products/status-counts | JWT | Count by status (dashboard stats) |
| POST | /seller/products | JWT | Create product |
| GET | /seller/products/:id | JWT | Get product detail |
| PATCH | /seller/products/:id | JWT | Update product |
| DELETE | /seller/products/:id | JWT | Soft-delete |
| POST | /seller/products/:id/submit | JWT | Submit for approval |
| POST | /seller/products/:id/duplicate | JWT | Duplicate |
| POST | /seller/products/:id/archive | JWT | Archive (DISCONTINUED) |
| POST | /seller/products/:id/restore | JWT | Restore to DRAFT |
| POST | /seller/bulk/status | JWT | Bulk status update |
| POST | /seller/bulk/delete | JWT | Bulk soft-delete |

### Brand Management (`/seller/brands`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /seller/brands | JWT | List brands |
| POST | /seller/brands | JWT | Create brand |
| PATCH | /seller/brands/:id | JWT | Update brand |
| DELETE | /seller/brands/:id | JWT | Delete brand |

### Media Library (`/seller/media`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /seller/media | JWT | List media (folder filter) |
| POST | /seller/media | JWT | Upload media |
| PATCH | /seller/media/:id | JWT | Update media (alt, primary, folder) |
| DELETE | /seller/media/:id | JWT | Delete media |
| POST | /seller/media/reorder | JWT | Reorder media |
| GET | /seller/media/folders | JWT | List folder tree |
| POST | /seller/media/folders | JWT | Create folder |
| PATCH | /seller/media/folders/:id | JWT | Rename folder |
| DELETE | /seller/media/folders/:id | JWT | Delete folder |

### Bulk Operations (`/seller/bulk`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /seller/bulk/preview | JWT | Preview import |
| POST | /seller/bulk/validate | JWT | Validate rows |
| POST | /seller/bulk/import | JWT | Execute import |
| POST | /seller/bulk/upload-zip | JWT | Upload ZIP with images |

### Export (`/seller/export`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /seller/export/start | JWT | Start export job |
| GET | /seller/export/jobs | JWT | List jobs |
| GET | /seller/export/jobs/:id/download | JWT | Download file |

### Analytics (`/seller/analytics`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /seller/analytics/overview | JWT | Aggregate stats |
| GET | /seller/analytics/products | JWT | Per-product breakdown |
| GET | /seller/analytics/performance | JWT | Top/bottom performers |

### Admin Approval (`/admin/products/approval`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin/products/approval | ADMIN/SUPER_ADMIN | List pending products |
| POST | /admin/products/approval/:id/approve | ADMIN/SUPER_ADMIN | Approve product |
| POST | /admin/products/approval/:id/reject | ADMIN/SUPER_ADMIN | Reject with reason |
| GET | /admin/products/approval/audit | ADMIN/SUPER_ADMIN | Approval audit trail |

## Rollback Strategy

### Schema Rollback
```bash
git checkout -- prisma/schema.prisma
npx prisma db push
npx prisma generate
```

### Backend Rollback
```bash
git checkout -- apps/api/src/modules/seller-product/
```

### Frontend Rollback
```bash
git checkout -- apps/web/app/seller/products/
git checkout -- apps/web/app/seller/brands/
git checkout -- apps/web/app/seller/media/
git checkout -- apps/web/app/seller/bulk-upload/
git checkout -- apps/web/app/seller/export/
git checkout -- apps/web/app/seller/analytics/
git checkout -- apps/web/app/admin/products/
```

### Data Safety
All new schema changes are additive (new tables, optional fields, new enum values). No existing data is affected. Rollback only requires reverting code.
