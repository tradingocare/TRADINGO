# Phase 15C — Dynamic Membership Engine

## Architecture

The Dynamic Membership Engine extends the existing `MembershipModule` (apps/api/src/modules/membership/) with unlimited plans, feature toggles, visibility control, and plan builder capabilities — all driven by database configuration. No code changes required to add new plans.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Dynamic Membership Engine                        │
│                                                                     │
│  MembershipPlan (extended)                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ planId (unique String)           ← free-form identifier      │   │
│  │ name, description, duration                                  │   │
│  │ pricePlanA/B/C                    ← 3 pricing tiers          │   │
│  │ sortOrder, isActive                                          │   │
│  │ visibility (PlanVisibility)       ← DRAFT/LAUNCH/PUBLIC/     │   │
│  │                                    ARCHIVED                  │   │
│  │ isFree, badgeText                 ← display hints            │   │
│  │ countryPricing (JSON)             ← per-country prices       │   │
│  │ upgradeRules (JSON)               ← permitted upgrades       │   │
│  │ downgradeRules (JSON)             ← permitted downgrades     │   │
│  │ gracePeriodDays                   ← days before suspension   │   │
│  │ renewalRules (JSON)               ← auto-renew config        │   │
│  │ trialPeriodDays                   ← trial duration           │   │
│  │ launchOfferEndsAt                 ← time-limited offer       │   │
│  │ metadata (JSON)                   ← extensible               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PlanFeature (exists)               PlanAddon (NEW)                 │
│  ┌──────────────────────────┐       ┌──────────────────────────┐   │
│  │ planId (FK)              │       │ planId (FK)              │   │
│  │ category, feature        │       │ name, description        │   │
│  │ included (boolean)       │       │ price, duration          │   │
│  │ value (string limit)     │       │ isActive, sortOrder      │   │
│  │ sortOrder                │       └──────────────────────────┘   │
│  └──────────────────────────┘                                       │
│                                                                     │
│  Company (extended)                                                 │
│  ┌──────────────────────────────────┐                               │
│  │ subscriptionStatus (exists)      │                               │
│  │ subscriptionPlan (exists)        │                               │
│  │ currentPlanId (NEW) → planId     │                               │
│  └──────────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Plan Visibility System

```
enum PlanVisibility {
  DRAFT     — Hidden, in development
  LAUNCH    — Visible during launch phase only
  PUBLIC    — Visible post-launch
  ARCHIVED  — Hidden, retired
}
```

The `getPlans()` method filters by visibility. With no argument, returns `LAUNCH` + `PUBLIC` plans (launch mode). Admin `adminGetAllPlans()` returns all plans regardless of visibility.

## Feature Toggle System

Each plan has zero or more `PlanFeature` records. Each feature has:
- `category` — grouping (e.g., "Analytics", "Products")
- `feature` — feature name (e.g., "Advanced Analytics")
- `included` — boolean toggle (enabled/disabled)
- `value` — optional limit string (e.g., "25", "unlimited")

Plan features are displayed on the frontend plans page with check/cross marks in the comparison table.

## Add-on System

Each plan can have zero or more `PlanAddon` records:
- `name`, `description` — display info
- `price` — additional cost
- `duration` — validity in months
- `isActive` — toggle

Add-ons are optional extras purchasable alongside a plan.

## Plan Builder (Admin)

The admin interface at `/admin/plans` provides:
1. **Create Plan** — form with all plan fields, features as comma-separated input
2. **List Plans** — all plans with visibility badge, price, toggles
3. **Toggle Visibility** — cycles DRAFT → LAUNCH → PUBLIC → ARCHIVED
4. **Delete Plan** — blocked if companies have active subscriptions
5. **Plan Detail** — expanded view showing features, add-ons, upgrade/downgrade rules, grace period, metadata
6. **Seed Launch Plans** — one-click creation of TRAD UP™ + Trade Smart™

## Company Subscription Integration

`Company.currentPlanId` (NEW) stores the active `MembershipPlan.planId` as a free-form string. The existing `subscriptionPlan` (PlanType enum) is preserved for backward compatibility. Both are set during subscription activation and cleared during cancellation.

## API Endpoints (Summary)

### Public
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/membership/plans` | List active visible plans (LAUNCH + PUBLIC) |
| `GET` | `/membership/plans/launch` | List only LAUNCH plans |
| `GET` | `/membership/plans/:slug` | Single plan by planId |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/plans` | List ALL plans (incl. DRAFT/ARCHIVED) |
| `POST` | `/admin/plans` | Create plan |
| `PATCH` | `/admin/plans/:planId` | Update plan |
| `DELETE` | `/admin/plans/:planId` | Delete plan |
| `PATCH` | `/admin/plans/:planId/visibility` | Change visibility |
| `POST` | `/admin/plans/:planId/features` | Upsert feature |
| `DELETE` | `/admin/plans/features/:featureId` | Delete feature |
| `POST` | `/admin/plans/:planId/addons` | Create add-on |
| `DELETE` | `/admin/plans/addons/:addonId` | Delete add-on |
| `POST` | `/admin/plans/seed-launch` | Seed launch plans |

## Prisma Changes

### New Enum
```prisma
enum PlanVisibility { DRAFT, LAUNCH, PUBLIC, ARCHIVED }
```

### Extended Model: MembershipPlan
```prisma
visibility       PlanVisibility @default(DRAFT)
isFree           Boolean        @default(false)
badgeText        String?
countryPricing   Json?
upgradeRules     Json?
downgradeRules   Json?
gracePeriodDays  Int            @default(0)
renewalRules     Json?
trialPeriodDays  Int            @default(0)
launchOfferEndsAt DateTime?
metadata         Json?
planAddons       PlanAddon[]
companies        Company[]      @relation("CurrentPlan")
```

### New Model: PlanAddon
```prisma
model PlanAddon {
  id          String         @id @default(uuid())
  planId      String
  name        String
  description String?
  price       Int
  duration    Int            @default(1)
  isActive    Boolean        @default(true)
  sortOrder   Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  plan        MembershipPlan @relation(fields: [planId], references: [planId], onDelete: Cascade)
}
```

### Extended Model: Company
```prisma
currentPlanId String?
currentPlan   MembershipPlan? @relation("CurrentPlan", fields: [currentPlanId], references: [planId], onDelete: SetNull)
```

## Weight Configuration

Not applicable to this phase. Plan features and limits are stored per-plan in the database.

## Data Flow

```
Admin creates plan
  → POST /admin/plans with all fields
  → MembershipService.adminCreatePlan()
  → Plan stored in DB with requested visibility
  → Plan features created as PlanFeature records

User views plans
  → GET /membership/plans/launch
  → MembershipService.getLaunchPlans()
  → Only LAUNCH + PUBLIC plans returned

User purchases plan
  → POST /subscription/purchase (existing flow)
  → MembershipService.activateSubscription()
  → Company.subscriptionPlan + Company.currentPlanId set

Admin enables future plan
  → PATCH /admin/plans/:planId/visibility
  → Update visibility from DRAFT → LAUNCH or PUBLIC
  → Plan immediately visible on plans page
```

## Future-Proofing

Adding a new plan requires zero code changes:
1. `POST /admin/plans` with the plan's data
2. Set features via `POST /admin/plans/:planId/features`
3. Set visibility to `LAUNCH` or `PUBLIC`
4. Plan appears on the plans page automatically

Future capabilities that can be added without schema changes:
- **Country pricing** — store in `countryPricing` JSON
- **Seasonal offers** — use `launchOfferEndsAt`
- **Tiered pricing** — Plan A/B/C already supported
- **Promo badges** — use `badgeText`
- **Upgrade paths** — store in `upgradeRules` JSON
- **Trial periods** — use `trialPeriodDays`
- **Grace periods** — use `gracePeriodDays`
- **Auto-renewal** — configure via `renewalRules` JSON
