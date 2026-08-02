# Smart Negotiation Center (Phase 12E)

Structured commercial discussion tied to quotations, with counter offers, version history, and future Purchase Order conversion.

## Architecture

### Data Model (Prisma)

| Model | Purpose |
|---|---|
| `Negotiation` | Core negotiation linked to a quote; tracks status, current proposal fields, timestamps |
| `NegotiationVersion` | Immutable version history — each counter offer creates a new version with changed fields diff |
| `NegotiationEvent` | Immutable audit trail — tracks every action (start, counter, accept, reject, cancel) |

**Status flow**: `NEGOTIATION_STARTED` → `BUYER_COUNTER` / `SELLER_COUNTER` ↔ `PENDING` → `ACCEPTED` | `REJECTED` | `CANCELLED` | `EXPIRED` | `CONVERTED`

### Backend Module

`apps/api/src/modules/smart-negotiation/`

| File | Purpose |
|---|---|
| `smart-negotiation.module.ts` | NestJS module registration (exports service) |
| `smart-negotiation.controller.ts` | REST endpoints at `/smart-negotiation/:quoteId/start`, `/:id/counter`, `/:id/accept`, `/:id/reject`, `/:id/cancel`, `/:id`, `/:id/versions`, `/:id/timeline`, `/admin/*` |
| `smart-negotiation.service.ts` | Core business logic: start, counter, accept, reject, cancel, findAll, findById, getVersions, getTimeline, admin methods |
| `dto/start-negotiation.dto.ts` | Optional notes |
| `dto/counter-offer.dto.ts` | All negotiable fields (price, MOQ, lead time, delivery, payment, discount, warranty, freight, validity) |

**Key patterns**:
- Flat route prefix (like `SmartRfqModule`) — no company nesting
- `getUserCompany()` resolves companyId from `CompanyOwner` table via JWT `sub`
- `prisma.$transaction` for all state-changing operations (negotiation + version + event + quote status)
- `NotificationService.createWithTemplate()` after each state transition
- RolesGuard for admin routes (`SUPER_ADMIN`, `ADMIN`)

### Frontend

#### API Lib: `apps/web/lib/api/smart-negotiation.ts`
13 API functions: start, counter, accept, reject, cancel, list, getById, getVersions, getTimeline, getAdminOverview, getAdminNegotiations, getAdminFlagged, getAdminAudit

#### Hooks: `apps/web/hooks/use-smart-negotiation.ts`
14 React Query hooks with automatic cache invalidation on mutations.

#### Pages

| Route | File | Purpose |
|---|---|---|
| `/buyer/negotiation/` | `apps/web/app/buyer/negotiation/page.tsx` | Buyer list with tabs (All/Active/Countered/Accepted/Rejected), search, stat counts |
| `/buyer/negotiation/[id]/` | `apps/web/app/buyer/negotiation/[id]/page.tsx` | Buyer detail: current offer, counter form (9 fields), accept/reject/cancel, version history timeline |
| `/seller/negotiation/` | `apps/web/app/seller/negotiation/page.tsx` | Seller list with tabs (All/New/Buyer Countered/Accepted/Rejected) |
| `/seller/negotiation/[id]/` | `apps/web/app/seller/negotiation/[id]/page.tsx` | Seller detail: current offer, revise form, accept/reject/cancel, version history timeline |
| `/admin/negotiation/` | `apps/web/app/admin/negotiation/page.tsx` | Admin 4-tab dashboard: Overview (stat cards), All (table), Flagged (rejected/cancelled), Audit (event trail) |

#### Entry Points
- **Quote Compare page** (`/buyer/quote/compare/`): "Negotiate" button in the action panel when exactly 1 quote is selected — calls `POST /smart-negotiation/:quoteId/start`

#### Navigation Updates

| Role | Nav Item | href |
|---|---|---|
| Buyer | Negotiations | `/buyer/negotiation` |
| Seller | Negotiations | `/seller/negotiation` |
| Admin | Negotiations | `/admin/negotiation` |

### Key Constraints
- Negotiations ONLY start from SUBMITTED/VIEWED quotes
- Only one negotiation per quote (`quoteId` is `@unique`)
- Counter offers only in active statuses (`NEGOTIATION_STARTED`, `BUYER_COUNTER`, `SELLER_COUNTER`, `PENDING`)
- Each counter offer creates an immutable `NegotiationVersion` with computed `changedFields` diff
- Accepting a negotiation automatically sets the quote status to `ACCEPTED`
- Notifications sent via `NotificationService` on start, counter, accept, reject

### Verification
- `prisma validate` — schema valid
- `tsc --noEmit` (api) — 0 errors
- `tsc --noEmit` (web) — 0 errors
