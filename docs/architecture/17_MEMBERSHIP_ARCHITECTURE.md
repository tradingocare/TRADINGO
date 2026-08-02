# TRADINGO Membership Architecture

## Plans

| Plan | Slug | Monthly Credits | Features |
|------|------|-----------------|----------|
| TRAD UP | trad-up | 20 | Basic access |
| Trade Start | trade-start | 50 | Starter features |
| Trade Smart | trade-smart | 100 | Enhanced features |
| Trade Plus | trade-plus | 250 | Professional tools |
| Trade Pro | trade-pro | 500 | Business grade |
| Trade Premium | trade-premium | 1000 | Premium features |
| Trade Elite | trade-elite | 2500 | Full platform |
| TRADBUY | tradbuy | - | Buyer-only plan |

## Plan Management

- **File**: `apps/api/src/modules/membership/membership.service.ts`
- **Endpoints**: CRUD plans, get current subscription, admin management
- **Visibility**: Plans have `PlanVisibility` enum (DRAFT, LAUNCH, PUBLIC, ARCHIVED)
- **Status**: `SubscriptionStatus` (TRIAL, ACTIVE, EXPIRED, SUSPENDED, CANCELLED)

## Plan Features (via `PlanFeature` model)

- AI Credits (different per plan)
- XP Multiplier
- Bonus Missions
- Advertising Credits (discount rates)
- Marketplace Visibility
- TradeServ Visibility
- Priority Support
- Referral Bonus
- Feature flags per plan

## Membership Benefits

From `MembershipBenefitsCard` component:
1. Plan badge/name
2. XP Multiplier (1x-3x based on plan)
3. AI Credits (monthly allocation)
4. Bonus Missions per period
5. Advertising Credits (% discount on CPC/CPM/Fixed)
6. Priority Support tier
7. Marketplace Visibility boost
8. TradeServ Visibility boost
9. Referral Bonus percentage
10. Renewal Date
11. Status + Upgrade CTA

## Upgrade Logic

- Handled via `POST /membership/purchase` → creates/updates subscription
- GOCASH Integration awards `awardPlanUpgradeBonus` (500 GOCASH)
- Subscription expiry handled by `subscription.processor.ts` (BullMQ)
- Renewal alerts at configurable periods (30/15/7/3/1 day)

## Credit System Integration

- AI Credits enforced at `AiGatewayService.process()` level
- Advertising discounts applied at fund time in `AdvertisingService.fund()`
- Plan-based credit allocation stored in `AiCreditUsage` with monthly reset
