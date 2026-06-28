# Prisma Relationship Implementation — Seller Product Management

## Status: ✅ Verified

## Changes Applied

### 1. ProductStatus Enum — Extended (+2 values)

```prisma
enum ProductStatus {
  DRAFT
  ACTIVE
  INACTIVE
  OUT_OF_STOCK
  DISCONTINUED
  PENDING_APPROVAL    // NEW: product submitted for admin review
  REJECTED            // NEW: product rejected by admin
}
```

**Migration:** `ALTER TYPE "ProductStatus" ADD VALUE` — additive, no existing rows affected.

---

### 2. New Enums

| Enum | Values | Used By |
|------|--------|---------|
| `ProductApprovalAction` | SUBMITTED, APPROVED, REJECTED, REVISION_REQUESTED | ProductApproval |
| `BrandStatus` | ACTIVE, INACTIVE | ProductBrand |
| `ExportJobStatus` | PENDING, PROCESSING, COMPLETED, FAILED | ProductExportJob |
| `ExportType` | EXCEL, CSV | ProductExportJob |

---

### 3. New Models

#### ProductApproval
Tracks the complete approval history for a product (submit → review → approve/reject → revision).

| Field | Type | Nullable | Default |
|-------|------|----------|---------|
| id | String (uuid) | PK | — |
| productId | String | FK → Product.id | — |
| action | ProductApprovalAction | No | — |
| reviewerId | String? | FK → User.id | null |
| reason | String? | Yes | null |
| createdAt | DateTime | No | now() |

#### ProductBrand
Company-managed brand catalog for structured product branding.

| Field | Type | Nullable | Default |
|-------|------|----------|---------|
| id | String (uuid) | PK | — |
| companyId | String | FK → Company.id | — |
| name | String | No | — |
| slug | String | No (unique) | — |
| logo | String? | Yes | null |
| description | String? | Yes | null |
| status | BrandStatus | No | ACTIVE |
| createdAt | DateTime | No | now() |
| updatedAt | DateTime | No | updatedAt |

#### MediaFolder
Folder-based media organization for the media library.

| Field | Type | Nullable | Default |
|-------|------|----------|---------|
| id | String (uuid) | PK | — |
| companyId | String | FK → Company.id | — |
| name | String | No | — |
| parentId | String? | FK → MediaFolder.id (self) | null |
| sortOrder | Int | No | 0 |
| createdAt | DateTime | No | now() |
| updatedAt | DateTime | No | updatedAt |

#### ProductExportJob
Tracks catalog export jobs (Excel/CSV).

| Field | Type | Nullable | Default |
|-------|------|----------|---------|
| id | String (uuid) | PK | — |
| companyId | String | FK → Company.id | — |
| type | ExportType | No | — |
| status | ExportJobStatus | No | PENDING |
| fileUrl | String? | Yes | null |
| createdAt | DateTime | No | now() |
| updatedAt | DateTime | No | updatedAt |

---

### 4. Approved Reverse Relations

#### User → ProductApproval (+1 relation)
| Direction | Field | Type | On Delete |
|-----------|-------|------|-----------|
| User → | productApprovals | ProductApproval[] | — |
| ProductApproval → | reviewer | User? | SetNull |

**Purpose:** Admin reviewer tracking for product approval workflow.

#### Company → ProductBrand (+1 relation)
| Direction | Field | Type | On Delete |
|-----------|-------|------|-----------|
| Company → | productBrands | ProductBrand[] | — |
| ProductBrand → | company | Company | Cascade |

**Purpose:** Company can list all its managed brands.

#### Company → MediaFolder (+1 relation)
| Direction | Field | Type | On Delete |
|-----------|-------|------|-----------|
| Company → | mediaFolders | MediaFolder[] | — |
| MediaFolder → | company | Company | Cascade |

**Purpose:** Company can organize media files in folders.

#### Company → ProductExportJob (+1 relation)
| Direction | Field | Type | On Delete |
|-----------|-------|------|-----------|
| Company → | productExportJobs | ProductExportJob[] | — |
| ProductExportJob → | company | Company | Cascade |

**Purpose:** Company can view export job history.

---

### 5. Optional Enhanced Fields

#### Product → ProductBrand link (+1 relation, +1 scalar, both optional)
```prisma
productBrand ProductBrand? @relation(fields: [brandId], references: [id], onDelete: SetNull)
brandId      String?
```

- Existing products get `brandId = null`
- The original `brand: String?` field remains untouched for free-text brand names

#### ProductMedia — Enhanced (+5 optional fields)
```prisma
folderId   String?    // FK → MediaFolder.id
altText    String?    // Image alt text for accessibility
fileSize   Int?       // File size in bytes
mimeType   String?    // MIME type (image/jpeg, video/mp4, etc.)
isPrimary  Boolean    // Mark primary image (default false)
```

- All existing media rows keep `null` for new fields
- `folderId` FK has `onDelete: SetNull` — removing a folder doesn't delete media

---

## Migration Impact

| Change | Impact | Migration Command |
|--------|--------|-------------------|
| Enum extension (ProductStatus) | ✅ None — ADD VALUE only | `prisma db push` |
| New tables (4) | ✅ None — no required FKs to existing data | `prisma db push` |
| New columns (Product.brandId) | ✅ None — nullable, defaults to null | `prisma db push` |
| New columns (ProductMedia.*) | ✅ None — all nullable or have defaults | `prisma db push` |

All changes applied via: `prisma db push` ✅

---

## Backward Compatibility Verification

| Check | Result |
|-------|--------|
| Existing Product queries (findMany, create, update) | ✅ Unchanged — new fields are optional |
| Existing ProductMedia inserts | ✅ Bypass new optional fields |
| Existing ProductStatus values | ✅ Preserved — DRAFT, ACTIVE, INACTIVE, etc. unchanged |
| Existing code that switches on ProductStatus | ⚠️ Won't hit new values — only set by new approval workflow |
| Existing Company queries | ✅ Unchanged — new relations return empty arrays |
| Existing User queries | ✅ Unchanged — new relation returns empty array |

---

## Locked Module Compatibility

| Locked Module | Status | Evidence |
|---------------|--------|----------|
| Authentication | ✅ Unaffected | No User auth fields changed |
| Seller Authentication | ✅ Unaffected | No seller auth fields changed |
| Product Card | ✅ Unaffected | No Product fields renamed or removed |
| Company Profile | ✅ Unaffected | `brandId` is Product-level, not Company-level |
| Membership | ✅ Unaffected | No MembershipPlan, PlanHistory, Coupon changes |
| Subscription | ✅ Unaffected | No Payment, subscription status changes |
| Payment | ✅ Unaffected | No Payment, Refund, Payout changes |
| Billing | ✅ Unaffected | No Invoice, InvoiceItem, TaxBreakdown changes |
| Product Discovery | ✅ Unaffected | No Product search/filter fields changed; new status values are backward-compatible |

---

## Verification Results

| Command | Status |
|---------|--------|
| `prisma validate` | ✅ Valid |
| `prisma db push` | ✅ Synced |
| `prisma generate` | ✅ Client regenerated |
| `tsc --noEmit` (API) | ✅ 0 errors |
| `tsc --noEmit` (Web) | ✅ 0 new errors (10 pre-existing in `.next/dev/types/` are unrelated) |
