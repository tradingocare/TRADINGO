# Smart Shipment & Logistics Engine — Phase 13C

## Overview

Shipments originate exclusively from valid Orders. No standalone shipment creation. The engine is provider-agnostic with courier provider seeding for future API integration (Delhivery, Blue Dart, DTDC, India Post, DHL, FedEx, UPS, Shiprocket, Ecom Express, XpressBees, Shadowfax, Pickrr).

## Shipment Lifecycle

```
PREPARING → PACKED → READY_FOR_PICKUP → COURIER_ASSIGNED → DISPATCHED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                                                                              ↓
                                                                                                         DELIVERY_FAILED → PREPARING (retry)
```

- **Seller** controls: PREPARING→PACKED, PACKED→READY_FOR_PICKUP, assign courier, COURIER_ASSIGNED→DISPATCHED, DISPATCHED→IN_TRANSIT, IN_TRANSIT→OUT_FOR_DELIVERY, DELIVERY_FAILED→PREPARING
- **Buyer** controls: OUT_FOR_DELIVERY→DELIVERED (confirm delivery)

## Architecture

### Database (Prisma)

| Model | Description |
|-------|-------------|
| `CourierProvider` | Courier companies (name, slug, apiProvider, trackingUrl) |
| `Shipment` | Main shipment with order ref, courier, tracking, status, packages, addresses |
| `ShipmentPackage` | Individual package metadata (weight, dimensions, contents, value) |
| `ShipmentTimelineEvent` | Status change history with location and notes |
| `ShipmentDocument` | Uploaded documents (labels, packing lists, invoices) |

**Enums**: `ShipmentStatus` (10 values), `ShipmentType` (6 values: STANDARD, EXPRESS, PARTIAL, SPLIT, INTERNATIONAL, PICKUP)

**Notification Types**: `SHIPMENT_CREATED`, `SHIPMENT_PACKED`, `SHIPMENT_COURIER_ASSIGNED`, `SHIPMENT_DISPATCHED`, `SHIPMENT_IN_TRANSIT`, `SHIPMENT_OUT_FOR_DELIVERY`, `SHIPMENT_DELIVERED`, `SHIPMENT_DELIVERY_FAILED`

### Backend (`apps/api/src/modules/smart-shipment/`)

| File | Description |
|------|-------------|
| `smart-shipment.module.ts` | Registers controller + service |
| `smart-shipment.service.ts` | All business logic: create, assign courier, update status, list/detail/timeline/documents |
| `smart-shipment.controller.ts` | Flat routes at `/smart-shipment/*` (16 endpoints) |
| `dto/smart-shipment.dto.ts` | DTOs: Create, AssignCourier, UpdateTracking, UpdateShipment, AddDocument |

### Frontend (`apps/web/`)

| File | Description |
|------|-------------|
| `lib/api/smart-shipment.ts` | 16 API functions |
| `hooks/use-smart-shipment.ts` | 11 React Query hooks |
| `app/buyer/shipment/page.tsx` | Buyer shipment dashboard (list + stat cards + status filter) |
| `app/buyer/shipment/[id]/page.tsx` | Buyer shipment detail (live tracking banner, progress bar, timeline, courier details, confirm delivery) |
| `app/seller/shipment/page.tsx` | Seller shipment dashboard |
| `app/seller/shipment/new/page.tsx` | Create shipment from order (select order, weight, packages) |
| `app/seller/shipment/[id]/page.tsx` | Seller shipment detail (assign courier form, all status transitions) |
| `app/admin/shipment/page.tsx` | Admin 3-tab dashboard (Overview / All / Delayed) |

### Courier Integration Strategy

- **Provider-agnostic layer**: `CourierProvider` model with `apiProvider` field to store which API integration to use
- **Tracking URLs**: Template-based (e.g., `https://www.delhivery.com/track/package/{tracking}`) — replace `{tracking}` with actual number
- **Seeding**: `POST /smart-shipment/seed-couriers` inserts 12 major Indian/international couriers
- **Future API integration**: Add a `CourierApiService` per provider that implements a common interface (create shipment, generate label, track, cancel pickup)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/smart-shipment/create` | Create shipment from order (seller) |
| POST | `/smart-shipment/:id/assign-courier` | Assign courier + tracking (seller) |
| POST | `/smart-shipment/:id/update-status` | Update shipment status |
| GET | `/smart-shipment/buyer` | List buyer shipments |
| GET | `/smart-shipment/seller` | List seller shipments |
| GET | `/smart-shipment/:id` | Get shipment details |
| PATCH | `/smart-shipment/:id` | Update shipment details |
| GET | `/smart-shipment/:id/timeline` | Get shipment timeline |
| POST | `/smart-shipment/:id/documents` | Upload document (seller) |
| GET | `/smart-shipment/:id/documents` | Get documents |
| GET | `/smart-shipment/courier-providers` | List active couriers |
| POST | `/smart-shipment/seed-couriers` | Seed default couriers |
| GET | `/smart-shipment/admin/analytics` | Admin analytics |
| GET | `/smart-shipment/admin/all` | Admin list all |
| GET | `/smart-shipment/admin/:id` | Admin detail |

## Validation Rules

- Order must be CONFIRMED or later (CONFIRMED, PROCESSING, PACKED, READY_FOR_DISPATCH, DISPATCHED, IN_TRANSIT)
- Only seller can create shipments and assign couriers
- Tracking numbers must be unique across all shipments
- Courier provider must be active
- Status transitions strictly follow STATUS_FLOW
- Only buyer can confirm delivery (OUT_FOR_DELIVERY→DELIVERED)

## Future Multi-Warehouse Support

The `Shipment` model has `pickupAddress` (Json) and `deliveryAddress` (Json) fields. Future multi-warehouse support:
1. Add `Warehouse` model (id, name, address, companyId)
2. Add `warehouseId` to Shipment
3. Support split shipments across warehouses via `ShipmentType.SPLIT`

## Verification

- `prisma validate` — ✅
- `tsc --noEmit` (api) — ✅
- `tsc --noEmit` (web) — ✅

## Locked Modules

Extends locked Order Management module. Does not modify any locked module.
