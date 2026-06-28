# Smart Purchase Order Engine (Phase 13A)

Legally structured digital commercial agreement originating from accepted negotiations.

## Architecture

### Data Model (Prisma)

| Model | Purpose |
|---|---|
| `PurchaseOrder` | Core PO with full commercial terms, status, timestamps |
| `PurchaseOrderLineItem` | Individual product/service lines with pricing and GST |
| `PurchaseOrderAttachment` | Attached documents |
| `PurchaseOrderVersion` | Immutable version history — each state change creates a snapshot |
| `PurchaseOrderEvent` | Immutable audit trail — tracks every action |

**Status flow**: `DRAFT` → `BUYER_CONFIRMED` → `SELLER_PENDING` → `SELLER_ACCEPTED` → `LOCKED` → `CONVERTED_TO_ORDER`

**PO Number format**: `PO-YYYYMMDD-XXXXX` (date + random 5-digit suffix)

### Backend Module

`apps/api/src/modules/smart-po/`

| File | Purpose |
|---|---|
| `smart-po.module.ts` | NestJS module registration |
| `smart-po.controller.ts` | REST endpoints at `/smart-po/:negotiationId/generate`, `/:id/confirm`, `/:id/accept`, `/:id/reject`, `/:id/cancel`, `/:id/request-revision`, `/:id` (PATCH), `/:id/lock`, `/:id`, `/:id/versions`, `/:id/timeline`, `/:id/pdf`, `/admin/*` |
| `smart-po.service.ts` | Core business logic: generate, confirm, markSellerPending, accept, reject, cancel, requestRevision, revise, lock, findAll, findById, getVersions, getTimeline, getPdfHtml, admin methods |
| `po-pdf.service.ts` | HTML template generator for professional enterprise PO PDF |
| `dto/update-po.dto.ts` | Update DTO with full commercial terms, line items, GST |

**Key patterns**:
- Flat route prefix `/smart-po` (like Smart RFQ and Negotiation modules)
- `generate()` creates PO from ACCEPTED negotiation, copies quote line items, generates PO number
- `confirm()` (buyer) → `markSellerPending()` (system) → `accept()` (seller) → `lock()` (buyer)
- `requestRevision()` returns to DRAFT for buyer to revise
- `revise()` (PATCH) updates fields and replaces line items
- Every state change creates a version snapshot + event
- Notifications sent at each stage

### Frontend

#### API Lib: `apps/web/lib/api/smart-po.ts`
17 API functions: generate, confirm, accept, reject, cancel, requestRevision, revise, lock, list, getById, getVersions, getTimeline, getPdfUrl, admin overview/orders/flagged/audit

#### Hooks: `apps/web/hooks/use-smart-po.ts`
19 React Query hooks with automatic cache invalidation on mutations.

#### Pages

| Route | File | Purpose |
|---|---|---|
| `/buyer/po/` | `apps/web/app/buyer/po/page.tsx` | Buyer list with tabs (All/Draft/Confirmed/Seller Accepted/Locked), search |
| `/buyer/po/[id]/` | `apps/web/app/buyer/po/[id]/page.tsx` | Buyer detail: pricing, terms, line items, timeline, versions; actions: Confirm, Lock, Cancel, PDF download |
| `/seller/po/` | `apps/web/app/seller/po/page.tsx` | Seller list with tabs (All/Pending Review/Accepted/Locked) |
| `/seller/po/[id]/` | `apps/web/app/seller/po/[id]/page.tsx` | Seller detail: pricing, terms, line items; actions: Accept, Reject, Request Revision, PDF download |
| `/admin/po/` | `apps/web/app/admin/po/page.tsx` | Admin 4-tab dashboard: Overview (stat cards), All POs (table), Flagged (rejected/cancelled), Audit (event trail) |

#### Entry Point
- **Buyer Negotiation Detail** (`/buyer/negotiation/[id]/`): "Generate PO" button when status is ACCEPTED — calls `POST /smart-po/:negotiationId/generate` and navigates to the new PO detail

### Navigation Updates

| Role | Nav Item | href |
|---|---|---|
| Buyer | Purchase Orders | `/buyer/po` |
| Seller | Purchase Orders | `/seller/po` |
| Admin | Purchase Orders | `/admin/po` |

### Purchase Order Lifecycle

```
Buyer                          Seller
  │                              │
  ├─ Generate PO (from ACCEPTED  │
  │   negotiation)               │
  │   → DRAFT                    │
  │                              │
  ├─ Confirm PO                  │
  │   → BUYER_CONFIRMED          │
  │                              │
  │                    ──────────┤
  │                    System marks SELLER_PENDING
  │                              │
  │                              ├─ Accept → SELLER_ACCEPTED
  │                              ├─ Reject → REJECTED
  │                              └─ Request Revision → back to DRAFT
  │
  ├─ Lock PO (after seller       │
  │   accepts)                   │
  │   → LOCKED                   │
  │
  └─ Convert to Order (Phase 13B)
      → CONVERTED_TO_ORDER
```

### Version Control
- Every status change creates a `PurchaseOrderVersion` with a full PO data snapshot
- `changedFields` tracks which fields were modified
- Version history viewable on detail page sidebar
- Event timeline tracks every action with actor role

### Digital Acceptance
- Buyer confirms → digital signature placeholder
- Seller accepts → digital signature placeholder  
- System locks → final signature placeholder
- PDF includes signature area with acceptance timeline

### Future Order Integration (Phase 13B)
- Orders are linked to POs via `purchaseOrderId` on the `Order` model
- Every Order must originate from a `LOCKED` PO
- PO status `CONVERTED_TO_ORDER` marks successful conversion

### Verification
- `prisma validate` — schema valid
- `tsc --noEmit` (api) — 0 errors
- `tsc --noEmit` (web) — 0 errors
