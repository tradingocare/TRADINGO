# Sprint 6H — Commission Engine

**Status**: COMPLETE (2026-07-22)
**Founder Authorized**: Yes

---

## Audit Summary

### BookingFinancialOrchestratorService
- **Existing**: `processPaymentVerified()` creates escrow (HELD) on payment verification; `processBookingCompleted()` creates settlement and releases escrow
- **Reusable**: Orchestrator pattern, escrow creation, settlement processing, domain events, audit logging
- **Missing**: Commission calculation before escrow hold; commission-aware settlement amount
- **Dependencies**: CommissionEngineService, Company (for membership plan), ProfessionalService (for category)

### EscrowService
- **Existing**: Order-based `hold()` and `release()` already use `CommissionService.calculate()`; Escrow model has `orderId`, `bookingId`, `amount`, `netAmount`
- **Reusable**: Escrow lifecycle, event logging, notification templates
- **Missing**: Commission storage on Escrow model for booking flow
- **Dependencies**: None (backward compatible)

### Settlement Flow
- **Existing**: `Settlement` model with PENDING→PROCESSED→FAILED; settlement amount = `escrow.netAmount`
- **Reusable**: Settlement lifecycle, SettlementEvent, retry logic
- **Missing**: Commission-aware settlement amount (`netAmount - commissionAmount`)
- **Dependencies**: Escrow.commissionAmount field

### Membership Plans
- **Existing**: `MembershipPlan` with `planId`, `features`, pricing tiers; `Company.currentPlanId` references plan
- **Reusable**: `Company.currentPlanId` for membership-based commission overrides
- **Missing**: No changes needed — membership plan ID is queried from the professional's Company

### Existing CommissionService
- **Existing**: `calculate()` with `findBestRule()` — simple category-then-global priority; includes TDS/GST in result
- **Reusable**: `CommissionRule` Prisma model, `auditLog` infrastructure
- **Missing**: 5-level deterministic priority; scope-based filtering (BOOKING vs ORDER); commission-type awareness (PERCENTAGE/FIXED/ZERO); detailed calculation breakdown
- **Dependencies**: None (new CommissionEngineService is standalone, existing CommissionService untouched)

### Existing Admin
- **Existing**: `CommissionController` with CRUD endpoints under `/commission/rules`
- **Reusable**: Admin guard patterns, throttling, pagination
- **Missing**: Engine-specific rule management (ruleType, calcType, priority, scope, professionalId, membershipPlanId)
- **Dependencies**: None (engine endpoints added alongside existing)

### Payment Calculations
- **Existing**: EscrowService.release() calculates commission from `escrow.netAmount` using CommissionService
- **Reusable**: Commission calculation at payment verified time (booking flow)
- **Missing**: Booking flow commission — now calculated at `processPaymentVerified()` time, stored on Escrow

### Audit/Event Logging
- **Existing**: `auditLog`, `EventEmitter2`, `EscrowEvent`, `SettlementEvent` — all fully reusable
- **Reusable**: `COMMISSION_CALCULATED` audit action, `commission.calculated` event
- **Missing**: Commission-specific audit actions — now implemented (COMMISSION_CALCULATED, COMMISSION_ENGINE_RULE_CREATED/UPDATED/DELETED)
- **Dependencies**: None

---

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `CommissionRuleType` enum, `CommissionCalcType` enum; extended `CommissionRule` with 10 new fields; extended `Escrow` with 3 commission storage fields |
| `apps/api/src/modules/commission/commission.module.ts` | Registered `CommissionEngineService` in providers and exports |
| `apps/api/src/modules/commission/commission.controller.ts` | Extended with 7 engine-specific admin endpoints |
| `apps/api/src/modules/commission/index.ts` | Added `CommissionEngineService` export |
| `apps/api/src/modules/tradeserv/tradeserv.module.ts` | Imported `CommissionModule` |
| `apps/api/src/modules/tradeserv/booking-financial-orchestrator.service.ts` | Wired commission calculation before escrow hold; commission-aware settlement amount |

## Files Created

| File | Purpose |
|------|---------|
| `apps/api/src/modules/commission/commission-engine.service.ts` | Standalone commission calculation engine with 5-level priority |
| `apps/api/src/modules/commission/dto/commission-engine.dto.ts` | DTOs for engine calculation, rule CRUD, and summary |

## Components Reused

| Component | Usage |
|-----------|-------|
| `CommissionRule` Prisma model | Extended with new fields — no new model created |
| `PrismaService` | Shared database access |
| `EventEmitter2` | `commission.calculated` event published on each calculation |
| `auditLog` | `COMMISSION_CALCULATED`, `COMMISSION_ENGINE_RULE_CREATED/UPDATED/DELETED` actions |
| `Escrow` model | Extended with `commissionAmount`, `commissionRuleId`, `commissionMetadata` |
| `BookingFinancialOrchestratorService` | Consumes commission result before escrow hold |
| `CommissionController` | Extended with engine-specific endpoints (no new controller) |
| `CommissionModule` | Extended with new service and exports |

## Components NOT Changed

| Component | Rationale |
|-----------|-----------|
| `CommissionService` | Order-based commission logic unchanged — backward compatible |
| `EscrowService` | Order-based escrow flow unchanged — backward compatible |
| `SettlementService` | Settlement flow unchanged — amount is passed by orchestrator |
| `MembershipPlan` / `PlanFeature` | Queried for membershipPlanId — no changes needed |
| `Escrow` model existing fields | All existing fields untouched — only 3 new nullable/default fields added |
| All frontend files | No frontend changes — this is a backend-only sprint |

---

## Rule Hierarchy

### Priority Order (deterministic, highest to lowest)

| Rank | Rule Type | Constant | Description |
|------|-----------|----------|-------------|
| 1 | **PROMOTIONAL** | `PROMOTIONAL_OVERRIDE` | Temporary promotional/campaign commission rates |
| 2 | **PROFESSIONAL** | `PROFESSIONAL_OVERRIDE` | Professional-specific commission agreements |
| 3 | **MEMBERSHIP** | `MEMBERSHIP_OVERRIDE` | Commission rates based on professional's membership plan |
| 4 | **CATEGORY** | `CATEGORY_RULE` | Commission rates for specific service categories |
| 5 | **PLATFORM DEFAULT** | `PLATFORM_DEFAULT` | Fallback platform-wide commission rate |

### Within each level
- Rules are ordered by `priority DESC`, then `createdAt DESC`
- Only the first matching rule within the highest-priority level wins
- Amount range filtering (`minAmount`, `maxAmount` in currency units) is applied at all levels
- Date range filtering (`startsAt`, `endsAt`) is applied at all levels

### Calculation Types

| Type | Behavior | Commission Value |
|------|----------|-----------------|
| **PERCENTAGE** | `amount * percent / 100` | The percentage rate |
| **FIXED** | `fixedFee * 100` (converted to paise) | The fixed fee in paise |
| **ZERO** | `0` | 0 |

---

## Calculation Flow

```
Booking Payment Verified
        │
        ▼
Lookup: booking.amount, company (currentPlanId), service (category)
        │
        ▼
CommissionEngineService.calculate(amount, professionalCompanyId, categoryId, membershipPlanId)
        │
        ├─ Query all active BOOKING-scoped CommissionRules (priority DESC)
        ├─ For each priority level (PROMOTIONAL → PROFESSIONAL → MEMBERSHIP → CATEGORY → PLATFORM)
        │     └─ Find first rule matching: amount range, date range, scope filter
        │     └─ Apply rule's calcType (PERCENTAGE/FIXED/ZERO)
        │
        ▼
CommissionCalculationResult {
  grossAmount,           // Full booking amount in paise
  commissionType,        // PERCENTAGE | FIXED | ZERO
  commissionValue,       // The applied rate/value
  platformCommission,    // Calculated commission in paise
  netSettlementAmount,   // grossAmount - platformCommission
  appliedRule,           // { id, ruleType, name, priority }
  ruleSource,            // e.g. "MEMBERSHIP_OVERRIDE"
  calculationTimestamp
}
        │
        ▼
Emit: commission.calculated (event)
Audit: COMMISSION_CALCULATED (auditLog)
        │
        ▼
Escrow Created with:
  amount = grossAmount
  commissionAmount = platformCommission
  commissionRuleId = appliedRule.id
  commissionMetadata = full calculation breakdown
        │
        ▼
... (booking lifecycle continues) ...
        │
        ▼
Booking Completed →
  settlementAmount = escrow.netAmount - escrow.commissionAmount
  Settlement created with computed settlementAmount
```

---

## Admin Endpoints

All endpoints under `/commission/engine/*` — ADMIN/SUPER_ADMIN guarded:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/commission/engine/calculate` | Calculate commission (test tool) |
| `GET` | `/commission/engine/rules` | List rules with filters (ruleType, scope, isActive, etc.) |
| `POST` | `/commission/engine/rules` | Create new engine rule |
| `GET` | `/commission/engine/rules/:id` | Get single rule |
| `PATCH` | `/commission/engine/rules/:id` | Update rule (partial) |
| `DELETE` | `/commission/engine/rules/:id` | Delete rule |
| `GET` | `/commission/engine/summary` | Engine rule summary stats |

### Rule Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ruleType` | enum | PLATFORM_DEFAULT | PROMOTIONAL, PROFESSIONAL, MEMBERSHIP, CATEGORY, PLATFORM_DEFAULT |
| `calcType` | enum | PERCENTAGE | PERCENTAGE, FIXED, ZERO |
| `priority` | int | 0 | Higher = higher priority within same ruleType |
| `scope` | string | "BOOKING" | Filter scope (BOOKING, ORDER) |
| `name` | string? | — | Human-readable rule name |
| `description` | string? | — | Optional description |
| `professionalId` | string? | — | Company ID for PROFESSIONAL rules |
| `membershipPlanId` | string? | — | Plan ID for MEMBERSHIP rules |
| `categoryId` | string? | — | Category for CATEGORY rules |
| `percent` | decimal | 0 | Commission percentage |
| `fixedFee` | decimal | 0 | Fixed commission fee |
| `minAmount` | decimal? | — | Min booking amount for this rule |
| `maxAmount` | decimal? | — | Max booking amount for this rule |
| `isActive` | boolean | true | Enable/disable rule |
| `startsAt` | datetime | now | Effective from date |
| `endsAt` | datetime? | — | Expiry date |

---

## Verification Results

| Check | Result |
|-------|--------|
| prisma validate | ✅ |
| prisma generate | ✅ |
| tsc (api) | ✅ 0 errors |
| tsc (web) | ✅ 0 errors |
| eslint (commission) | ✅ 0 errors (4 warnings for `any` in Prisma builders) |
| next build | ✅ 297 routes |

### Test Cases

| Scenario | Expected | Verified |
|----------|----------|----------|
| Percentage commission (10%) on ₹10,000 | Commission = ₹1,000, Net = ₹9,000 | ✅ Algorithm |
| Fixed commission (₹500) on ₹10,000 | Commission = ₹500, Net = ₹9,500 | ✅ Algorithm |
| Zero commission | Commission = ₹0, Net = ₹10,000 | ✅ Algorithm |
| Membership override (overrides category) | Membership rule wins over category | ✅ Priority logic |
| Promotional override (highest priority) | Promo rule wins over all others | ✅ Priority logic |
| Professional-specific override | Professional rule wins over membership/category | ✅ Priority logic |
| No matching rule → zero commission | Commission = ₹0, Net = ₹10,000 | ✅ Algorithm |
| Amount out of range → skip rule | Next rule in same level checked | ✅ Algorithm |
| Expired rule → skip rule | Next rule checked | ✅ Algorithm |
| Duplicate call → same result (idempotency) | Same booking → same calculation | ✅ Deterministic |
| Commission stored on escrow | escrow.commissionAmount set | ✅ Integration |
| Settlement uses commission | settlementAmount = netAmount - commission | ✅ Integration |
| Commission calculation failure → zero fallback | Escrow created with 0 commission, no crash | ✅ Error handling |
| Backward compatible — existing CommissionService | Unchanged, still works for orders | ✅ No changes |

---

## Idempotency

The commission engine is **deterministic by design**:

- Same inputs (amount, professionalCompanyId, categoryId, membershipPlanId) → same query → same rule selection → same calculation result
- No mutable state, no caching, no side effects that influence subsequent calculations
- Configuration version (rule changes) is the only factor that changes results
- Escrow creation is idempotent (existing escrow check in orchestrator)
- Settlement creation is idempotent (existing settlement check in orchestrator)

---

## Audit Events

### Commission Engine Audit Log Actions

| Action | Trigger | Metadata |
|--------|---------|----------|
| `COMMISSION_CALCULATED` | Every engine calculation | grossAmount, commissionAmount, netSettlementAmount, ruleId, ruleSource, commissionType, professionalCompanyId |
| `COMMISSION_ENGINE_RULE_CREATED` | Rule creation | ruleType, calcType, priority, percent, fixedFee |
| `COMMISSION_ENGINE_RULE_UPDATED` | Rule update | Changes array |
| `COMMISSION_ENGINE_RULE_DELETED` | Rule deletion | ruleType, name |

### Events

| Event | Payload |
|-------|---------|
| `commission.calculated` | `{ grossAmount, commissionAmount, netAmount, ruleId, ruleSource, professionalCompanyId, bookingAmount }` |

---

## Remaining Gaps (Future Sprints)

| Gap | Suggested Phase | Notes |
|-----|----------------|-------|
| Commission visualizer in admin dashboard | Later sprint | No UI changes in Sprint 6H — admin endpoints exist for CLI/API testing |
| Bulk rule import/export | Later sprint | CSV import for commission rules |
| Commission analytics (revenue by rule type) | Later sprint | Requires aggregation queries |
| Frontend admin pages for commission engine | Later sprint | No frontend work in Sprint 6H — admin endpoints are API-only |
