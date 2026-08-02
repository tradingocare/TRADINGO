# TRADGO Reputation Foundation

## Overview

Collect-only reputation event system for the TRADGO ecosystem. Records buyer lifecycle events without any AI scoring or ranking logic.

## Design Principles

- **Collect only** — no AI scores, no ranking, no calculations
- **Event-driven** — append-only event log per user
- **Reuse existing** — no duplicate tables, no new enums beyond what's needed
- **Lightweight** — single event model with optional JSON metadata

## Database

### New Enums

```prisma
enum ReputationEventType {
  BUYER_REGISTERED
  BUYER_VERIFIED
  RFQ_CREATED
  QUOTE_ACCEPTED
  ORDER_COMPLETED
  ORDER_CANCELLED
  DISPUTE_OPENED
  DISPUTE_RESOLVED
  DELIVERY_CONFIRMED
  MEMBERSHIP_PURCHASED
  GOCASH_REWARDS_EARNED
}
```

### New Model

```prisma
model ReputationEvent {
  id            String             @id @default(uuid())
  userId        String
  type          ReputationEventType
  referenceId   String?
  referenceType String?
  metadata      Json?
  createdAt     DateTime           @default(now())

  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
  @@index([type])
}
```

### Event Types

| Event | Trigger | Reference |
|-------|---------|-----------|
| BUYER_REGISTERED | User registration | userId |
| BUYER_VERIFIED | KYC approval | Verification ID |
| RFQ_CREATED | RFQ submission | RFQ ID |
| QUOTE_ACCEPTED | Quote acceptance | Quote ID |
| ORDER_COMPLETED | Order delivery | Order ID |
| ORDER_CANCELLED | Order cancellation | Order ID |
| DISPUTE_OPENED | Dispute creation | Dispute ID |
| DISPUTE_RESOLVED | Dispute resolution | Dispute ID |
| DELIVERY_CONFIRMED | Delivery confirmation | Delivery ID |
| MEMBERSHIP_PURCHASED | Plan purchase | Plan ID |
| GOCASH_REWARDS_EARNED | Reward credit | Transaction ID |

## Backend

**New module:** `apps/api/src/modules/reputation/`

- `ReputationService` — `recordEvent()`, `getEvents()`, `getSummary()`
- `ReputationController` — 2 read-only endpoints

### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/reputation/events/:userId` | JWT | Get reputation events for a user |
| GET | `/reputation/summary/:userId` | JWT | Get reputation summary (total events, verification status, recent events) |

### Reputation Summary Returns

```json
{
  "userId": "uuid",
  "totalEvents": 42,
  "memberSince": "2025-01-15T...",
  "emailVerified": true,
  "mobileVerified": true,
  "verificationLevel": "LEVEL_1",
  "recentEvents": [...]
}
```

## Frontend

**New files:**
- `apps/web/lib/api/user-verification.ts` — `getReputationEvents()`, `getReputationSummary()`
- `apps/web/hooks/use-user-verification.ts` — `useReputationEvents()`, `useReputationSummary()`

### Hooks

| Hook | Query Key | Description |
|------|-----------|-------------|
| `useReputationEvents(userId)` | `['reputation', 'events', userId]` | Fetch events for a user |
| `useReputationSummary(userId)` | `['reputation', 'summary', userId]` | Fetch summary for a user |

## Future Integration Points

- Event recording can be wired into existing service methods (e.g., `OrderService.completeOrder()` → `reputationService.recordEvent(userId, 'ORDER_COMPLETED')`)
- No changes needed for current Phase 15B.2 — collection foundation only

## Not Included (Out of Scope)
- AI/ML reputation scoring
- Buyer ranking
- Seller rating of buyers
- Fraud detection
- Buyer reputation badges
- Buyer reputation percentile

## Files Created
- `apps/api/src/modules/reputation/reputation.module.ts`
- `apps/api/src/modules/reputation/reputation.service.ts`
- `apps/api/src/modules/reputation/reputation.controller.ts`
- `apps/web/lib/api/user-verification.ts` (shared with buyer verification)
- `apps/web/hooks/use-user-verification.ts` (shared with buyer verification)

## Verification Results
- prisma validate ✅
- prisma generate ✅
- tsc (api) — 0 errors ✅
- tsc (web) — 0 errors ✅
- next build — 180 routes, 0 errors ✅
