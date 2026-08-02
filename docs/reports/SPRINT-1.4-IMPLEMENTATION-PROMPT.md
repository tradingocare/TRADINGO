# Sprint 1.4 — Rate Limit Hardening: Remaining Controllers

## Objective
Add class-level `@Throttle(RateLimits.XXX)` decorators to ~17 remaining controllers that still rely on the global default (100 req/min). This completes the remaining Medium Priority controllers from the Sprint 1.3 audit.

---

## Audit Reference
**Source**: `docs/reports/SPRINT-1.3-PRE-IMPLEMENTATION-AUDIT.md`  
**Shared constants**: `apps/api/src/common/constants/rate-limits.const.ts` (already exists with 25 named RateLimits)  
**Current coverage**: 123/174 controllers (70.7%) with custom throttling

---

## Exact Files to Modify (~22 controllers)

| # | Controller | Suggested RateLimit | Rationale |
|---|---|---|---|
| 1 | `product-attributes/product-attributes.controller.ts` | `WRITE_GENERAL` | Write operations on product attributes |
| 2 | `product-claims/product-claims.controller.ts` | `WRITE_GENERAL` | Claim submissions |
| 3 | `product-location/product-location.controller.ts` | `WRITE_GENERAL` | Inventory/location updates |
| 4 | `product-location/product-location-management.controller.ts` | `ADMIN_WRITE` | Admin location management |
| 5 | `tradgo/tradgo.controller.ts` | `MARKETPLACE_READ` | TradeGo marketplace ops |
| 6 | `tradmatch/tradmatch.controller.ts` | `WRITE_GENERAL` | Trade matching writes |
| 7 | `category-templates/category-templates.controller.ts` | `ADMIN_WRITE` | Admin template management |
| 8 | `users/users.controller.ts` | `WRITE_GENERAL` | User management ops |
| 9 | `company-locations/company-locations.controller.ts` | `WRITE_GENERAL` | Company location CRUD |
| 10 | `manual-payment/manual-payment.controller.ts` | `WRITE_FINANCIAL` | Payment operations |
| 11 | `onboarding/onboarding.controller.ts` | `WRITE_GENERAL` | Onboarding form submissions |
| 12 | `profile-completion/profile-completion.controller.ts` | `WRITE_GENERAL` | Profile completion writes |
| 13 | `product-onboarding/product-onboarding.controller.ts` | `WRITE_GENERAL` | Product onboarding |
| 14 | `organizations/organizations.controller.ts` | `WRITE_GENERAL` | Org management |
| 15 | `communication/template.controller.ts` | `ADMIN_WRITE` | Template CRUD (admin) |
| 16 | `communication/label.controller.ts` | `WRITE_GENERAL` | Label CRUD |
| 17 | `catalog-import/catalog-import.controller.ts` | `ADMIN_WRITE` | Import operations |

### Beta Program (6 controllers — invite-gated, low priority)
| # | Controller | Suggested | Rationale |
|---|---|---|---|
| 18 | `beta-program/beta-program.controller.ts` | `MARKETPLACE_READ` | Beta general |
| 19 | `beta-program/beta-referral.controller.ts` | `WRITE_GENERAL` | Beta referrals |
| 20 | `beta-program/beta-feedback.controller.ts` | `WRITE_GENERAL` | Beta feedback |
| 21 | `beta-program/beta-analytics.controller.ts` | `ADMIN_ANALYTICS` | Beta analytics |
| 22 | `beta-program/beta-admin.controller.ts` | `ADMIN_WRITE` | Beta admin |

---

## Implementation Pattern

For each controller file, add two imports and one decorator:

```typescript
// 1. Add to imports (check depth for path resolution)
import { RateLimits } from '../../common/constants/rate-limits.const';
// import { Throttle } from '@nestjs/throttler'; // verify already imported; if not, add

// 2. Add class-level decorator BEFORE @Controller()
@UseGuards(JwtAuthGuard, RolesGuard)  // existing
@Controller('...')                     // existing
export class SomeController {          // existing
```

For files missing `@Throttle` import:
```typescript
import { Throttle } from '@nestjs/throttler';
```

Path conventions:
- `modules/*/`: use `../../common/constants/rate-limits.const`
- `modules/*/*/`: use `../../../common/constants/rate-limits.const`

---

## RateLimits Constants Reference (from rate-limits.const.ts)

```typescript
export const RateLimits = {
  CHAT_MESSAGE:       { default: { limit: 20,  ttl: 60000 } },
  WRITE_GENERAL:      { default: { limit: 30,  ttl: 60000 } },
  WRITE_FINANCIAL:    { default: { limit: 15,  ttl: 60000 } },
  MARKETPLACE_READ:   { default: { limit: 60,  ttl: 60000 } },
  ADMIN_WRITE:        { default: { limit: 60,  ttl: 60000 } },
  ADMIN_ANALYTICS:    { default: { limit: 30,  ttl: 60000 } },
  REPORT_GENERATE:    { default: { limit: 10,  ttl: 60000 } },
  FILE_UPLOAD:        { default: { limit: 10,  ttl: 60000 } },
  // ... 17 more
};
```

---

## Verification (after all changes)

```bash
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
cd apps/web && npx next build
```

---

## Files Expected

- **Modified**: ~22 controller files (add 2 imports + 1 decorator each)
- **Created**: 0 new files
- **Total unchanged**: 170+ controllers left untouched

---

## Status
**NEXT PHASE READY**
**Phase**: Sprint 1.4 — Rate Limit Hardening (Remaining Controllers)
**Implementation Prompt**: See above
**Status**: Waiting for only one command: START
