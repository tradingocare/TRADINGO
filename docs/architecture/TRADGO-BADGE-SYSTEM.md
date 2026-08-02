# TRADGO Unified Badge System

## Overview

Centralized badge registry with 11 badge types. Extends existing `VerifiedBadge` component and `TradgoService` — no new Prisma models, no new modules.

## Badge Registry

### Badge Types

| Badge ID | Label | Icon | Color | How Earned |
|----------|-------|------|-------|------------|
| `verified` | Verified | BadgeCheck | Green | verificationLevel !== LEVEL_0 |
| `trusted` | Trusted | ShieldCheck | Blue | verificationLevel === LEVEL_2 or LEVEL_3 |
| `premium` | Premium | Award | Purple | verificationLevel === LEVEL_4 or LEVEL_5 |
| `gold` | Gold | Crown | Yellow | trustScore >= 90 |
| `platinum` | Platinum | Diamond | Amber | trustScore >= 95 AND (LEVEL_5 or LEVEL_6) |
| `elite` | Elite | Star | Orange | verificationLevel === LEVEL_6 |
| `top-seller` | Top Seller | TrendingUp | Teal | totalProducts >= 100 |
| `top-buyer` | Top Buyer | ShoppingBag | Cyan | (future: based on RFQ/order volume) |
| `fast-responder` | Fast Responder | Zap | Sky | totalProducts >= 10 AND trustScore >= 60 |
| `reliable-supplier` | Reliable Supplier | Truck | Emerald | trustScore >= 70 AND verified |
| `future` | Future | Sparkles | Gray | Placeholder for upcoming badges |

### Component
- **File**: `apps/web/components/shared/VerifiedBadge.tsx`
- **Exports**: `VerifiedBadge`, `BadgeType`
- **Props**: `type: BadgeType`, `showLabel?: boolean`, `size?: 'sm' | 'md' | 'lg'`, `className?: string`
- **Usage**: Import `<VerifiedBadge type="platinum" />` anywhere badges are displayed

### Backend Computation
- **File**: `apps/api/src/modules/tradgo/tradgo.service.ts`
- **Method**: `getUnifiedBadges(companyId)`
- **Endpoint**: `GET /tradgo/unified-badges` (JWT)
- **Returns**: Array of `{ badge, earned, label, description }` — all 11 badges with earned status

### Key Design Decisions
1. **No Prisma model**: Badges are computed on-the-fly from existing Company data
2. **Extensible**: Add new types to `BADGE_CONFIG` in VerifiedBadge.tsx and computation in TradgoService
3. **Reuses**: Existing `VerifiedBadge` component (Phase 15B.1), existing `TradgoService` (Phase 14C)
4. **Future badges**: `future` type always returns `earned: false` — shows as gray placeholder
