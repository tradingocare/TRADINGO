# Smart Order Management Engine — Phase 13B

## Overview

Orders originate exclusively from **LOCKED Purchase Orders**. The engine extends the existing `Order` model with 3 new statuses (`PACKED`, `READY_FOR_DISPATCH`, `IN_TRANSIT`) for granular lifecycle tracking.

## Order Lifecycle

```
PENDING → CONFIRMED → PROCESSING → PACKED → READY_FOR_DISPATCH → DISPATCHED → IN_TRANSIT → DELIVERED → COMPLETED
                                                                                                       ↓
                                                                                                    RETURNED
All states (except COMPLETED/RETURNED) → CANCELLED
```

- **Buyer** controls: CONFIRM_DELIVERY (IN_TRANSIT→DELIVERED), COMPLETE (DELIVERED→COMPLETED), CANCEL, RETURN
- **Seller** controls: CONFIRM (PENDING→CONFIRMED), PROCESS (CONFIRMED→PROCESSING), PACK (PROCESSING→PACKED), READY (PACKED→READY_FOR_DISPATCH), DISPATCH (READY_FOR_DISPATCH→DISPATCHED), IN_TRANSIT (DISPATCHED→IN_TRANSIT), CANCEL

## Creating an Order (PO→Order flow)

1. Buyer negotiates → PO is accepted by seller → buyer **Locks** the PO
2. On the Locked PO page (`/buyer/po/[id]`), a **"Create Order"** button appears
3. `POST /smart-order/:poId/create-from-po` validates:
   - PO exists and is `LOCKED`
   - Current user is the buyer company
   - No Order already exists for this PO
4. Creates Order with items copied from PO line items, marks PO as `CONVERTED_TO_ORDER`
5. Notifications sent to both buyer and seller

## Architecture

### Backend (`apps/api/src/modules/smart-order/`)

| File | Description |
|------|-------------|
| `smart-order.module.ts` | Imports `OrderModule`, registers controller + service |
| `smart-order.service.ts` | PO→Order creation, delegates list/detail/status updates/cancel/return to existing `OrderService` |
| `smart-order.controller.ts` | Flat routes at `/smart-order/*` |
| `dto/smart-order.dto.ts` | DTOs for order operations |

Key design: **No manual order creation endpoint**. The only create path is `createFromPo()`. All other operations delegate to the existing battle-tested `OrderService`.

### OrderService Changes (`apps/api/src/modules/order/`)

- `STATUS_FLOW` updated to include `PACKED`, `READY_FOR_DISPATCH`, `IN_TRANSIT`

### Prisma Changes

- `OrderStatus` enum: added `PACKED`, `READY_FOR_DISPATCH`, `IN_TRANSIT`
- `NotificationType` enum: added `ORDER_CREATED_FROM_PO`, `ORDER_PACKED`, `ORDER_IN_TRANSIT`
- Ran `prisma validate` + `prisma generate`

### Frontend (`apps/web/`)

| File | Description |
|------|-------------|
| `lib/api/smart-order.ts` | 15 API functions |
| `hooks/use-smart-order.ts` | 13 React Query hooks |
| `app/buyer/order/page.tsx` | Buyer order dashboard (list + stat cards + status filter) |
| `app/buyer/order/[id]/page.tsx` | Buyer order detail (items, timeline, confirm delivery, complete, cancel, return) |
| `app/seller/order/page.tsx` | Seller order dashboard |
| `app/seller/order/[id]/page.tsx` | Seller order detail (items, timeline, all status transitions) |
| `app/admin/order/page.tsx` | Admin 3-tab dashboard (Overview / All / Flagged) |
| `app/buyer/po/[id]/page.tsx` | Added "Create Order" button when PO status is LOCKED |

### Nav Updates (`data/master-data.ts`)

- Buyer: `/buyer/orders` → `/buyer/order`
- Seller: `/seller/orders` → `/seller/order`
- Admin: Added new "Orders" entry at `/admin/order`

### Status Badge Updates

Added `packed`, `ready-for-dispatch`, `in-transit` entries to `status-badge.tsx`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/smart-order/:poId/create-from-po` | Generate order from locked PO |
| GET | `/smart-order/buyer` | List buyer orders (paginated, filter by status) |
| GET | `/smart-order/seller` | List seller orders |
| GET | `/smart-order/:orderId` | Get order detail |
| PATCH | `/smart-order/:orderId` | Update order (seller) |
| POST | `/smart-order/:orderId/update-status` | Update order status |
| POST | `/smart-order/:orderId/cancel` | Cancel order |
| POST | `/smart-order/:orderId/return` | Request return |
| GET | `/smart-order/:orderId/timeline` | Get order timeline |
| GET | `/smart-order/:orderId/documents` | Get order documents |
| GET | `/smart-order/analytics` | Company order analytics |
| GET | `/smart-order/admin/analytics` | Admin analytics |
| GET | `/smart-order/admin/all` | Admin list all orders |
| GET | `/smart-order/admin/:orderId` | Admin order detail |

## Verification

- `prisma validate` — ✅
- `tsc --noEmit` (api) — ✅
- `tsc --noEmit` (web) — ✅

## Locked Modules

This module extends but does not modify locked modules (Authentication, Payment, Billing, etc.). The existing `OrderModule` is extended via a new `SmartOrderModule` that delegates to it.
