# Buyer Workspace — Phase 12A

## Status: ✅ Complete

## Architecture

The Buyer Workspace is the buyer's procurement command center. It sits between Product Discovery and RFQ, providing tools to organize saved products, suppliers, compare options, and create requirement lists that feed directly into RFQ creation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Buyer Workspace (Web)                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Dashboard  │ Saved     │ Saved     │ Compare  │ Requirement │ Draft     │
│ Overview   │ Products  │ Suppliers │ Center   │ Lists       │ RFQs      │
├────────────┴──────────┴───────────┴──────────┴─────────────┴───────────┤
│ Notifications  │  Downloads  │  Analytics                                │
└─────────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                          Buyer API (NestJS)                             │
├─────────────────────────────────────────────────────────────────────────┤
│ BuyerController         → BuyerService         → Prisma                │
│ SavedSupplierController → SavedSupplierService                         │
│ RequirementController   → RequirementService                           │
│ BuyerNotificationController → BuyerNotificationService                 │
│ BuyerDownloadController → BuyerDownloadService                         │
│ BuyerAnalyticsController → BuyerAnalyticsService                       │
├─────────────────────────────────────────────────────────────────────────┤
│                       Reused Existing Modules                           │
├─────────────────────────────────────────────────────────────────────────┤
│ ProductsService (wishlist) │ NotificationService │ CompareStore         │
│ RfqService                 │ CompanyService       │                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Folder Structure

### Backend
```
apps/api/src/modules/buyer/
├── buyer.module.ts
├── buyer.controller.ts
├── buyer.service.ts
├── saved-supplier.controller.ts
├── saved-supplier.service.ts
├── requirement.controller.ts
├── requirement.service.ts
├── buyer-notification.controller.ts
├── buyer-notification.service.ts
├── buyer-download.controller.ts
├── buyer-download.service.ts
├── buyer-analytics.controller.ts
├── buyer-analytics.service.ts
```

### Frontend (enhancing existing)
```
apps/web/app/buyer/
├── layout.tsx                      (existing)
├── dashboard/page.tsx              (enhanced)
├── saved-products/page.tsx         (existing)
├── suppliers/page.tsx              (real API — was mock)
├── compare-quotes/page.tsx         (existing)
├── requirements/
│   ├── page.tsx                    requirement lists overview
│   └── [id]/page.tsx               single list detail + items
├── notifications/page.tsx          notifications feed
├── downloads/page.tsx              downloaded catalogs/invoices
├── analytics/page.tsx              buyer analytics
├── rfqs/page.tsx                   (existing)
├── orders/page.tsx                 (existing)
├── settings/page.tsx               (existing)
├── chat/page.tsx                   (existing)
├── support/page.tsx                (existing)
```

## Workflow

```
Buyer Login
    │
    ▼
Buyer Dashboard
    │
    ├──▶ Discover Products ──▶ Saved Products ──▶ Compare ──▶ Requirement List
    │                                                              │
    │                                                              ▼
    │                                                         Draft RFQ
    │                                                              │
    │                                                              ▼
    │                                                         Send RFQ
    │                                                              │
    │                                                              ▼
    │                                                      Quotation Comparison
    │                                                              │
    │                                                              ▼
    │                                                      Purchase Order
    │
    ├──▶ Saved Suppliers ──▶ Compare ──▶ Requirement List
    │
    ├──▶ Compare Center (Products + Suppliers)
    │
    ├──▶ Notifications
    │
    ├──▶ Downloads
    │
    └──▶ Analytics
```

## Prisma Models

### SavedSupplier
Tracks suppliers a buyer has saved/followed.
| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | PK |
| userId | String | Buyer user ID |
| companyId | String | Saved supplier company ID |
| notes | String? | Buyer's notes about this supplier |
| tags | String[] | Custom tags for categorization |
| createdAt | DateTime | |

### RequirementList
Buyer's procurement lists (e.g., "Steel Project", "Hotel Kitchen").
| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | PK |
| userId | String | Buyer user ID |
| name | String | List name |
| description | String? | List description |
| deadline | DateTime? | Target procurement deadline |
| priority | Priority | LOW / MEDIUM / HIGH |
| status | ListStatus | ACTIVE / ARCHIVED |
| createdAt | DateTime | |

### RequirementListItem
Products within a requirement list.
| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | PK |
| listId | String | FK → RequirementList |
| productId | String? | Optional FK → Product |
| productName | String | Product name (denormalized) |
| quantity | Int | Required quantity |
| unit | String | Unit (kg, pcs, etc.) |
| estimatedBudget | Decimal? | Budget per unit |
| notes | String? | Item-specific notes |
| priority | Priority | LOW / MEDIUM / HIGH |
| sortOrder | Int | Display order |

### BuyerDownload
Tracks downloads of catalogues, brochures, certificates, invoices.
| Field | Type | Description |
|-------|------|-------------|
| id | String (uuid) | PK |
| userId | String | Buyer user ID |
| type | DownloadType | CATALOGUE / BROCHURE / CERTIFICATE / INVOICE / OTHER |
| title | String | Download title |
| fileUrl | String | File URL |
| fileSize | Int? | File size in bytes |
| sourceId | String? | Related entity ID (product, company, invoice) |
| sourceModule | String? | Source module name |
| createdAt | DateTime | |

## API Endpoints

All endpoints prefixed with `/buyer`, JWT-guarded.

### Dashboard
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/buyer/dashboard` | GET | Overview stats + recent activity |

### Saved Suppliers
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/buyer/suppliers` | GET | List saved suppliers |
| `/buyer/suppliers` | POST | Save a supplier |
| `/buyer/suppliers/:companyId` | DELETE | Remove saved supplier |
| `/buyer/suppliers/:companyId/notes` | PATCH | Update notes/tags |

### Requirement Lists
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/buyer/requirements` | GET | List requirement lists |
| `/buyer/requirements` | POST | Create list |
| `/buyer/requirements/:id` | GET | Get list with items |
| `/buyer/requirements/:id` | PATCH | Update list |
| `/buyer/requirements/:id` | DELETE | Delete list |
| `/buyer/requirements/:id/items` | POST | Add item |
| `/buyer/requirements/:id/items/:itemId` | PATCH | Update item |
| `/buyer/requirements/:id/items/:itemId` | DELETE | Remove item |
| `/buyer/requirements/:id/duplicate` | POST | Duplicate list |

### Notifications
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/buyer/notifications` | GET | List buyer notifications |
| `/buyer/notifications/:id/read` | POST | Mark as read |
| `/buyer/notifications/read-all` | POST | Mark all as read |

### Downloads
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/buyer/downloads` | GET | List downloads |
| `/buyer/downloads` | POST | Record a download |

### Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/buyer/analytics` | GET | Buyer analytics overview |

## Integration Points

| Existing Module | Integration |
|----------------|-------------|
| Company Profile | Saved Suppliers reads company data |
| Product Cards | Saved Products / Requirements display products |
| Product Discovery | Products flow into Saved Products → Requirements |
| SellerBadge | Displayed on saved supplier cards |
| Compare | Shared compare engine (products + suppliers) |
| Wishlist | Saved Products uses existing wishlist API |
| Authentication | RouteGuard + useAuthStore |
| Notifications | Reuses Notification model with buyer-specific queries |

## Future RFQ Integration (Phase 12B)

The Requirement Lists built here will be the data source for RFQ creation in Phase 12B:
- "Convert to RFQ" button on requirement lists
- RequirementList items → RfqProductItem
- List budget → RFQ budget range
- List deadline → RFQ expiry
- List notes → RFQ description

## Rollback Strategy

```bash
# Prisma
git checkout -- prisma/schema.prisma
npx prisma db push
npx prisma generate

# Backend
git checkout -- apps/api/src/modules/buyer/

# Frontend
git checkout -- apps/web/app/buyer/requirements/
git checkout -- apps/web/app/buyer/notifications/
git checkout -- apps/web/app/buyer/downloads/
git checkout -- apps/web/app/buyer/analytics/
git checkout -- apps/web/app/buyer/suppliers/page.tsx
git checkout -- apps/web/app/buyer/dashboard/page.tsx
```
