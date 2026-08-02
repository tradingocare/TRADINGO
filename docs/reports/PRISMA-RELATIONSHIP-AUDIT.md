# Prisma Relationship Audit — Seller Product Management

## 1. ER Relationship Summary

```
User ──1:N──> ProductApproval       (reviewer, admin action tracking)
Company ──1:N──> Product             (seller products)
Company ──1:N──> ProductBrand        (managed brand catalog)
Company ──1:N──> MediaFolder         (media library organization)
Company ──1:N──> ProductExportJob    (catalog export jobs)
Company ──1:N──> Payment             (🔒 locked)
Company ──1:N──> Invoice             (🔒 locked)
Company ──1:N──> PlanHistory         (🔒 locked)
Product ──1:N──> ProductApproval     (approval workflow history)
Product ──N:1──> ProductBrand        (optional brand link)
ProductMedia ──N:1──> MediaFolder    (optional folder assignment)
```

- ✅ Blue = new models/relations for Phase 11
- 🔒 Red = existing locked modules — NOT modified

## 2. Existing Relations (Locked Modules — NO CHANGES)

### User → (current relations: 14)
| Relation | Target | Purpose |
|----------|--------|---------|
| sessions | Session[] | Auth sessions |
| auditLogs | AuditLog[] | Activity audit |
| ownedCompanies | CompanyOwner[] | Company ownership |
| rmAttributions | CodeAttribution[] | RM attribution |
| meAttributions | CodeAttribution[] | ME attribution |
| managedCompanies | Company[] | RM-managed companies |
| rfqsCreated | Rfq[] | Buyer RFQs |
| quotesSubmitted | Quote[] | Seller quotes |
| chatParticipants | ConversationParticipant[] | Chat |
| notifications | Notification[] | Notifications |
| ... | ... | (5 more) |

### Company → (current relations: 30+)
| Relation | Target | Purpose |
|----------|--------|---------|
| products | Product[] | ✅ Existing — locking |
| productDrafts | ProductDraft[] | ✅ Existing |
| productClaims | ProductClaim[] | ✅ Existing |
| payments | Payment[] | 🔒 Locked |
| invoices | Invoice[] | 🔒 Locked |
| planHistory | PlanHistory[] | 🔒 Locked |
| ... | ... | (25+ more) |

## 3. Missing Relations (New — Phase 11)

| # | Model | Field | Missing Reverse | Target Model | Required? | Reason |
|---|-------|-------|-----------------|-------------|-----------|--------|
| 1 | **ProductApproval** | `reviewer User?` | `productApprovals ProductApproval[]` | **User** | ✅ Yes | Admin needs to review/reject products; User model already has 14 reverse relations — adding one more for admin action tracking is non-breaking |
| 2 | **ProductBrand** | `company Company` | `productBrands ProductBrand[]` | **Company** | ✅ Yes | Company needs to list its managed brands; Company already has `products Product[]` — this is the brand catalog side |
| 3 | **MediaFolder** | `company Company` | `mediaFolders MediaFolder[]` | **Company** | ✅ Yes | Company needs to organize media in folders; purely additive |
| 4 | **ProductExportJob** | `company Company` | `productExportJobs ProductExportJob[]` | **Company** | ✅ Yes | Company needs to track export history; purely additive |

| # | Model | New Field | Existing Reverse | Impact |
|---|-------|-----------|------------------|--------|
| 5 | **Product** | `productBrand ProductBrand?` + `brandId String?` | `products Product[]` on ProductBrand already exists from step 2 | ✅ Additive — optional nullable brandId, existing products unaffected |
| 6 | **ProductMedia** | `folderId String?` + `folder MediaFolder?` | `media ProductMedia[]` on MediaFolder already exists from step 3 | ✅ Additive — optional nullable folderId, existing media unaffected |
| 7 | **Product** | `approvals ProductApproval[]` | `product Product` on ProductApproval already exists | ✅ Additive — existing products get empty array |

## 4. Impact Analysis

### Risk: Affecting Locked Modules

| Module | Risk | Mitigation |
|--------|------|------------|
| **Product** (Locked product-card.tsx) | 🔴 None | Adding optional relations only. Existing product queries unchanged. `brandId` and `approvals` are additive null/empty fields. The `ProductStatus` enum extension adds values `PENDING_APPROVAL` and `REJECTED` — backward compatible, existing products keep their current status. |
| **Payment** (Locked) | ✅ None | No relation changes to Payment model. |
| **Invoice** (Locked) | ✅ None | No relation changes to Invoice model. |
| **PlanHistory** (Locked) | ✅ None | No relation changes to PlanHistory model. |
| **Company** (Locked Company Directory) | ✅ None-minimal | Adding reverse relations to Company that reference new models only. Existing company queries unaffected because no new **required** fields. |

### Risk: Existing Code Breakage

| Change | Breakage Risk | Why |
|--------|---------------|-----|
| `ProductStatus` enum: +2 values | ⚠️ Low | Any exhaustive switch on ProductStatus may need updating. In practice, new values are only set by the new approval workflow — existing code paths never set them. |
| `ProductMedia` model: +5 optional fields | ✅ None | All new fields are optional (`String?`, `Int?`, `Boolean?` with defaults). Existing inserts bypass them. |
| `Product` model: +1 relation field +1 scalar | ✅ None | Both optional. Existing `findMany/update/create` don't reference them. |

### Risk: ProductStatus Enum Extension

The new values `PENDING_APPROVAL` and `REJECTED` only need to be added. The existing values `DRAFT`, `ACTIVE`, `INACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED` are untouched.

The `prisma db push` command for enum extension is a **safe ALTER TYPE ADD VALUE** in PostgreSQL — no table rewrite, no existing rows affected. In SQLite, it recreates the table but with the same data.

## 5. Recommendation

**Proceed with all 4 missing reverse relations.** Each is:
- ✅ Purely additive (no new required columns, no breaking constraints)
- ✅ References new models only (ProductApproval, ProductBrand, MediaFolder, ProductExportJob)
- ✅ Follows existing patterns (Company already has 30+ reverse relation arrays)
- ✅ Won't trigger cascade deletes on existing data (all `onDelete: SetNull` or `Cascade` on new FK only)
- ✅ Verified against locked module boundaries (no touch to Payment, Invoice, PlanHistory)

### Summary of Changes

```
User model:         +1 relation   (productApprovals ProductApproval[])
Company model:      +3 relations  (productBrands[], mediaFolders[], productExportJobs[])
Product model:      +1 relation   (approvals ProductApproval[])
                    +1 relation   (productBrand ProductBrand?)
                    +1 scalar     (brandId String?)
ProductMedia model: +1 relation   (folder MediaFolder?)
                    +1 scalar     (folderId String?)
ProductStatus enum: +2 values     (PENDING_APPROVAL, REJECTED)
New models:         4             (ProductApproval, ProductBrand, MediaFolder, ProductExportJob)
```
