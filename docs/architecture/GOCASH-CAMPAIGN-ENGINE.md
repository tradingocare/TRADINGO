# GOCASH™ Enterprise Campaign Engine

## Architecture Overview

The Campaign Engine is the central promotional system for the entire TRADINGO ecosystem.
It manages all campaign types (signup, membership, cashback, festival, referral, seller,
buyer, category, product, order, coupon, limited-time, and future AI campaigns) with a
unified rule engine, budget engine, targeting system, and fraud prevention.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Campaign Engine                           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Campaign    │  │  Campaign    │  │   Campaign           │  │
│  │  CRUD        │  │  Rules       │  │   Targeting          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│  ┌──────┴─────────────────┴──────────────────────┘              │
│  │                    Budget Engine                              │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  │ Budget   │ │ Spent    │ │ Daily    │ │ Per-User     │  │
│  │  │ Check    │ │ Tracking │ │ Limits   │ │ Limits       │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  └──────────────────────────┬───────────────────────────────────│
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │                  Reward Processing                          ││
│  │                                                             ││
│  │  Campaign Trigger → Eligibility → Fraud Check → Ledger     ││
│  │                                   → Wallet → Notification   ││
│  └─────────────────────────────────────────────────────────────┘│
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │                    GOCASH Ledger Engine                      ││
│  │              gocashService.credit() → immutable entry        ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

## Module Location

| Component | Path |
|-----------|------|
| Service | `apps/api/src/modules/campaign/campaign.service.ts` |
| Controller | `apps/api/src/modules/campaign/campaign.controller.ts` |
| Module | `apps/api/src/modules/campaign/campaign.module.ts` |
| DTOs | `apps/api/src/modules/campaign/dto/` |
| Frontend API | `apps/web/lib/api/campaign.ts` |
| Frontend hooks | `apps/web/hooks/use-campaign.ts` |
| Admin pages | `apps/web/app/admin/campaigns/` (list, detail, new) |
| Buyer page | `apps/web/app/buyer/campaigns/` (campaign center) |
| Seller page | `apps/web/app/seller/campaigns/` (seller promotions) |

## Database Design

### New Prisma Models (added to `prisma/schema.prisma`)

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Campaign` | name, type, status, priority, startDate, endDate, budget, spentBudget, remainingBudget, maxRewards, dailyLimit, perUserLimit, perCompanyLimit, maxClaims, currentClaims, rewardAmount, rewardType, eligibility (Json), targetAudience (Json), metadata (Json) | Central campaign record with all settings |
| `CampaignRule` | campaignId (FK), priority, conditionField, conditionOperator, conditionValue (Json), actionType, actionValue (Json), isActive | IF/THEN rules for eligibility and reward calculation |
| `CampaignTarget` | campaignId (FK), targetType, targetId, isInclude | Audience targeting (include/exclude) |
| `CampaignClaim` | campaignId (FK), userId, companyId, claimType, amount, status (PENDING/APPROVED/REJECTED/PAID/FAILED), transactionId, ipAddress, userAgent, metadata (Json) | Reward claim tracking |
| `CampaignAnalytics` | campaignId (FK), date, claims, approved, rejected, paid, rewardAmount, uniqueUsers, conversionCount, conversionRate | Daily analytics snapshots |

### New Enums

| Enum | Values |
|------|--------|
| `CampaignType` | SIGNUP, MEMBERSHIP, CASHBACK, FESTIVAL, REFERRAL, SELLER, BUYER, CATEGORY, PRODUCT, ORDER, COUPON, LIMITED_TIME, AI |
| `CampaignStatus` | DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED, ARCHIVED, EXPIRED |
| `CampaignTargetType` | BUYER, SELLER, COMPANY, MEMBERSHIP, PRODUCT_CATEGORY, PRODUCT, STATE, CITY, INDUSTRY, REVENUE_TIER, GLOBAL_REGION |
| `CampaignClaimStatus` | PENDING, APPROVED, REJECTED, PAID, FAILED |

## Campaign Types

| Type | Description |
|------|-------------|
| `SIGNUP` | Rewards for new user registration |
| `MEMBERSHIP` | Premium membership bonuses and perks |
| `CASHBACK` | Purchase-based cashback rewards |
| `FESTIVAL` | Diwali, Christmas, etc. seasonal promotions |
| `REFERRAL` | Refer-a-friend campaigns |
| `SELLER` | Seller-specific promotions |
| `BUYER` | Buyer-specific promotions |
| `CATEGORY` | Category-based (e.g., Electronics) cashback |
| `PRODUCT` | Product-specific promotions |
| `ORDER` | Order value-based rewards |
| `COUPON` | Coupon/discount code campaigns |
| `LIMITED_TIME` | Flash sales and urgent promotions |
| `AI` | Future AI-driven dynamic campaigns |

## Rule Engine

### Rule Structure
Each rule follows an IF/THEN pattern:

```
IF <conditionField> <conditionOperator> <conditionValue>
THEN <actionType> <actionValue>
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `EQUALS` | Exact match | `type === 'PREMIUM'` |
| `NOT_EQUALS` | Not equal | `type !== 'BASIC'` |
| `GREATER_THAN` | Numerical > | `orderValue > 10000` |
| `LESS_THAN` | Numerical < | `claims < 100` |
| `CONTAINS` | String contains | `category includes 'Electronics'` |
| `IN` | Array membership | `city in ['Mumbai', 'Delhi']` |
| `BETWEEN` | Range check | `amount between [500, 5000]` |
| `GREATER_THAN_OR_EQUAL` | >= | `loyaltyPoints >= 1000` |
| `LESS_THAN_OR_EQUAL` | <= | `claims <= maxClaims` |

### Action Types

| Action | Description |
|--------|-------------|
| `REWARD` | Grant fixed reward amount |
| `DISCOUNT` | Apply percentage/fixed discount |
| `BONUS` | Add bonus multiplier |
| `MULTIPLIER` | Multiply base reward by factor |

### Example Rules

```
IF orderValue > 10000    → REWARD 300 GOCASH
IF category = Electronics → MULTIPLIER 1.5x
IF festival = Diwali      → MULTIPLIER 2x
IF membership = Premium   → BONUS 100 GOCASH
IF budgetExhausted        → STOP campaign
```

## Budget Engine

| Setting | Description |
|---------|-------------|
| `budget` | Total campaign budget |
| `spentBudget` | Cumulative rewards paid out |
| `remainingBudget` | Available budget (budget - spentBudget) |
| `maxRewards` | Maximum number of rewards |
| `dailyLimit` | Maximum claims per day |
| `perUserLimit` | Maximum claims per user |
| `perCompanyLimit` | Maximum claims per company |
| `maxClaims` | Total maximum claims (0 = unlimited) |

### Budget Validation Flow

```
Claim requested
  ↓
Check: campaign.active?                           → FAIL if not active
Check: campaign started?                          → FAIL if not started
Check: campaign ended?                            → FAIL if ended
Check: remainingBudget > 0?                       → FAIL if exhausted
Check: maxClaims not reached?                     → FAIL if maxed
Check: perUserLimit not reached?                  → FAIL if exceeded
Check: perCompanyLimit not reached?               → FAIL if exceeded
Check: dailyLimit not reached?                    → FAIL if exceeded
Check: eligibility criteria?                      → FAIL if not eligible
  ↓
APPROVED → Ledger → Wallet → Notification
```

## Eligibility Checks

```typescript
async checkEligibility(campaignId, userId, companyId?) {
  // 1. Status check (must be ACTIVE)
  // 2. Date range check
  // 3. Budget exhaustion check
  // 4. Max claims check
  // 5. Per-user limit check
  // 6. Per-company limit check
  // 7. Daily limit check
  // 8. Custom eligibility (JSON criteria)
}
```

## Fraud Prevention

| Check | Description |
|-------|-------------|
| Budget exhaustion | Prevents over-spending |
| Max claims cap | Hard limit on total claims |
| Per-user limit | Prevents abuse by single user |
| Daily limit | Rate limiting |
| Duplicate prevention | Checks existing approved/paid claims |
| Audit trail | All claims recorded in CampaignAnalytics |
| Idempotency key | `CAMPAIGN_{campaignId}_{userId}_{claimId}` prevents double-processing |

## API Endpoints

All under the `/campaigns/` prefix.

### Public / User Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List campaigns (paginated, filterable) |
| `GET` | `/active` | Get currently active campaigns |
| `GET` | `/by-type/:type` | Get campaigns by type |
| `GET` | `/my-claims` | Get current user's claim history |
| `GET` | `/:id` | Get campaign details |
| `POST` | `/check-eligibility` | Check if user is eligible for campaign |
| `POST` | `/claim` | Claim a campaign reward |
| `POST` | `/:id/evaluate-rules` | Evaluate campaign rules against context |

### Seller Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/seller` | Get seller-relevant campaigns |

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Create campaign |
| `PATCH` | `/:id` | Update campaign |
| `DELETE` | `/:id` | Archive campaign |
| `POST` | `/:id/clone` | Clone campaign |
| `POST` | `/:id/pause` | Pause campaign |
| `POST` | `/:id/resume` | Resume campaign |
| `POST` | `/:id/archive` | Archive campaign |
| `GET` | `/admin/dashboard` | Admin dashboard stats |
| `GET` | `/:id/analytics` | Campaign analytics |
| `POST` | `/process-expired` | Process expired campaigns |

## Analytics

The `CampaignAnalytics` model tracks daily snapshots:

```
campaignId + date (unique compound key)
├── claims: total claims made
├── approved: approved claims
├── rejected: rejected claims
├── paid: paid-out claims
├── rewardAmount: total rewards paid
├── uniqueUsers: unique claiming users
├── conversionCount: conversion events
└── conversionRate: conversion %
```

### Admin Dashboard Metrics

| Metric | Source |
|--------|--------|
| Total campaigns | Campaign count |
| Active right now | ACTIVE + in date range |
| Budget used | Sum spentBudget / Sum budget |
| Claims volume | CampaignClaim count |
| Rewards paid | CampaignClaim amount sum (PAID) |
| By type breakdown | Campaign groupBy type |

## Integration Points

| Module | Integration |
|--------|-------------|
| **GOCASH Ledger** | `gocashService.credit()` for reward payouts via `CAMPAIGN_REWARD` type |
| **GOCASH Wallet** | Credits deposited directly to user's GOCASH wallet |
| **Referral Engine** | Campaign codes integrated via `ReferralCodeType.CAMPAIGN` and `ReferralRule.type = 'CAMPAIGN'` |
| **Notifications** | Campaign events (claimed, rewarded, expired) ready for NotificationService integration |
| **Membership** | Campaign eligibility can require specific membership tiers |
| **Orders** | Order value-based rules and cashback campaigns |
| **Future AI** | `CampaignType.AI` reserved for dynamic AI-driven campaigns |

## Frontend Pages

| Page | Path | Description |
|------|------|-------------|
| Admin Campaign List | `/admin/campaigns` | Campaign management with dashboard stats |
| Admin Campaign Builder | `/admin/campaigns/new` | Create new campaign |
| Admin Campaign Detail | `/admin/campaigns/[id]` | Campaign details, rules, targeting, analytics |
| Buyer Campaign Center | `/buyer/campaigns` | Active promotions, claim rewards, claim history |
| Seller Campaigns | `/seller/campaigns` | Seller promotions, membership offers |

## Security

| Measure | Implementation |
|---------|---------------|
| Budget validation | Pre-claim checks against remainingBudget |
| Fraud prevention | Duplicate claim detection, per-user limits, daily caps |
| Audit trail | CampaignAnalytics daily snapshots |
| Idempotency | Idempotency key prevents double GOCASH credit |
| RBAC | ADMIN role required for create/update/delete/pause/resume/archive |
| Cascade deletes | CampaignRule, CampaignTarget, CampaignAnalytics cascade on Campaign delete |
| Restrict deletes | CampaignClaim uses Restrict — claims cannot be orphaned |

## Future AI Campaign Support

The engine is designed for future AI-driven campaigns:

1. **`CampaignType.AI`** — Reserved enum value for AI-generated campaigns
2. **`CampaignRule`** — AI can dynamically create/update rules based on user behavior
3. **`CampaignTarget`** — AI-driven audience targeting with machine learning segments
4. **`eligibility` (JSON)** — Extensible criteria for complex AI eligibility functions
5. **`metadata` (JSON)** — Extensible storage for AI model outputs and scoring
6. **Rule Engine** — Flexible IF/THEN structure supports any condition an AI might generate

## Verification

```bash
pnpm --filter @tradingo/api exec prisma validate    # ✅
pnpm --filter @tradingo/api exec prisma generate    # ✅
cd apps/api && npx tsc --noEmit                     # 0 errors ✅
cd apps/web && npx tsc --noEmit                     # 0 errors ✅
npx eslint apps/api/src/modules/campaign --ext .ts  # 0 errors, 21 warnings ✅
cd apps/web && npx next build                       # 178 routes ✅
```

## Runtime Commands

```bash
# Process expired campaigns (cron job)
curl -X POST /api/campaigns/process-expired -H "Authorization: Bearer <admin-token>"

# Check campaign eligibility
curl -X POST /api/campaigns/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "<id>", "companyId": "<company-id>"}'

# Claim a reward
curl -X POST /api/campaigns/claim \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "<id>", "companyId": "<company-id>"}'

# Evaluate rules against context
curl -X POST /api/campaigns/<id>/evaluate-rules \
  -H "Content-Type: application/json" \
  -d '{"orderValue": 15000, "category": "Electronics"}'
```
