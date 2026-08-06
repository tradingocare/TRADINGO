# Phase 15C — TRAD UP™ Launch Plan

## Overview

TRADINGO launches with TWO visible plans while the backend supports unlimited dynamic plans. Future plans are hidden until enabled by Super Admin — no code changes required.

## Launch Plans

### TRAD UP™
- **Price:** ₹0 (Free)
- **Duration:** 6 months
- **Visibility:** LAUNCH
- **Purpose:** Rapid seller onboarding, marketplace growth, data collection, lead generation, market validation
- **Features:**
  - Business Profile
  - Basic Verification
  - Product Listing (configurable limit)
  - Receive RFQs
  - Buyer Chat
  - Basic Search Visibility
  - Basic Dashboard
  - Basic Orders
  - Basic Notifications
- **Not included:** GOCASH, Premium Badge, Priority Ranking, Campaign Rewards, Referral Rewards, AI Features

### Trade Smart™
- **Price:** ₹12,000/year (Plan A)
- **Duration:** 12 months
- **Visibility:** LAUNCH
- **Badge:** "Best Value"
- **All TRAD UP™ features PLUS:**
  - GOCASH Enabled
  - Premium Badge
  - Priority Search Ranking
  - Advanced Analytics
  - Campaign Participation
  - Referral Rewards
  - Exports
  - Advanced RFQ
  - Premium Dashboard
  - Future Premium Features

## Launch Mode

The backend `getPlans()` method filters plans by visibility:
- `LAUNCH` — visible during launch phase
- `PUBLIC` — visible post-launch
- `DRAFT` — hidden, in development
- `ARCHIVED` — hidden, retired

When no visibility argument is provided, only `LAUNCH` and `PUBLIC` plans are returned.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/membership/plans/launch` | Returns only LAUNCH-visibility plans |
| `GET` | `/membership/plans` | Returns LAUNCH + PUBLIC plans (launch mode) |

## Seed Launch Plans

Admin endpoint: `POST /admin/plans/seed-launch`

Creates two plans if they don't exist:
- `trad-up` (TRAD UP™, ₹0, 6 months, LAUNCH)
- `trade-smart-launch` (Trade Smart™, ₹12,000/yr, 12 months, LAUNCH)

## Adding Future Plans

Super Admin creates new plans via `POST /admin/plans` with `visibility: DRAFT`. When ready for launch, update to `visibility: LAUNCH` or `PUBLIC`. No code changes needed.

## Admin Controls

| Endpoint | Description |
|----------|-------------|
| `GET /admin/plans` | List all plans (including DRAFT/ARCHIVED) |
| `POST /admin/plans` | Create new plan |
| `PATCH /admin/plans/:planId` | Update plan |
| `DELETE /admin/plans/:planId` | Delete plan (blocks if active subscriptions) |
| `PATCH /admin/plans/:planId/visibility` | Toggle visibility (DRAFT→LAUNCH→PUBLIC→ARCHIVED) |
| `POST /admin/plans/seed-launch` | Create launch plans |
| `POST /admin/plans/:planId/features` | Add/update plan feature |
| `DELETE /admin/plans/features/:featureId` | Delete plan feature |
| `POST /admin/plans/:planId/addons` | Create plan add-on |
| `DELETE /admin/plans/addons/:addonId` | Delete plan add-on |

## Upgrade Strategy

TRAD UP™ plans include `upgradeRules: { allowedUpgrades: ['trade-smart-launch'] }`, enabling a clear upgrade path from free to paid. Future plans can be added to `allowedUpgrades` at any time.

## Frontend Changes

### Plans Page (`/plans`)
- Calls `GET /membership/plans/launch`
- Shows only 2 plan cards in a 2-column grid
- Feature comparison table between the 2 plans
- "More plans coming soon" banner

### Admin Plans Page (`/admin/plans`)
- Full CRUD for plans
- Visibility toggling
- Feature management
- Add-on management
- Launch plan seeding

### Vendor Plans Page (`/plans/vendor`)
- Redirects to `/plans`

## Launch Success Criteria

1. [x] TRAD UP™ visible to all users at ₹0 for 6 months
2. [x] Trade Smart™ visible at ₹12,000/year
3. [x] Future plans hidden (DRAFT by default)
4. [x] Super Admin can create plans without code changes
5. [x] Feature toggles are DB-driven (PlanFeature model)
6. [x] Pricing tiers supported (Plan A/B/C)
7. [x] Upgrade/downgrade rules configurable
8. [x] Grace period configurable per plan
9. [x] Renewal rules configurable
10. [x] Add-ons supported
