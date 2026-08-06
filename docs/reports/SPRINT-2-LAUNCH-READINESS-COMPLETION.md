# Sprint 2 — Launch Readiness & Acquisition: Completion Report

**Date**: 2026-07-21
**Phase**: Phase 2 Sprint 2 — Launch Readiness & Acquisition
**Status**: COMPLETE

---

## Summary

All 5 Sprint 2 domains delivered: Legal Documents, Support Center, Help Center, Seller Acquisition, Buyer Acquisition. 0 new dependencies, 0 duplicates of existing modules, complete backward compatibility.

| Domain | Status | New Files | Modified Files |
|--------|--------|-----------|----------------|
| Legal Documents | COMPLETE | 2 | 0 |
| Support Center | COMPLETE | 12 | 3 |
| Help/FAQ | COMPLETE | 4 | 0 |
| Seller Acquisition | COMPLETE | 1 | 0 |
| Buyer Acquisition | COMPLETE | 1 | 0 |

---

## 1. Legal Documents

### Pages Created
- `/seller-agreement` — server component with PageHeader + 13 sections + CTABlock
- `/buyer-agreement` — server component with PageHeader + 12 sections + CTABlock

### Architecture Compliance
- ✅ Reused PageHeader (server-compatible)
- ✅ Reused CTABlock
- ✅ Follows `/terms` pattern exactly (inline section array)
- ✅ SEO metadata exported
- ✅ No new API endpoints or backend changes
- ✅ Design tokens only

---

## 2. Support Center

### Backend: SupportModule
**Location**: `apps/api/src/modules/support/`
**Files**: module, controller, service, 1 DTO file with 4 DTOs, index

| Endpoint | Method | Guard | Rate Limit |
|----------|--------|-------|------------|
| `/support/tickets` | POST | JwtAuth + RolesGuard | 10/min |
| `/support/tickets` | GET | JwtAuth + RolesGuard | — |
| `/support/tickets/:id` | GET | JwtAuth + RolesGuard | — |
| `/support/tickets/:id/messages` | POST | JwtAuth + RolesGuard | 20/min |
| `/support/tickets/:id/status` | PATCH | JwtAuth + RolesGuard (ADMIN) | — |
| `/support/tickets/:id/assign` | POST | JwtAuth + RolesGuard (ADMIN) | — |
| `/support/categories` | GET | JwtAuth + RolesGuard | — |
| `/support/stats` | GET | JwtAuth + RolesGuard (ADMIN) | — |

### Prisma Schema Changes
- Added `@relation` with `onDelete: Restrict/Cascade/SetNull` to SupportTicket (user, company, assignee)
- Added `@relation` with `onDelete: Cascade/Restrict` to SupportTicketMessage (ticket, user)
- Added reverse relation fields to User and Company models
- Added 6 notification types to NotificationType enum

### Notification Templates
Added 6 fallback templates: TICKET_CREATED, TICKET_ASSIGNED, TICKET_MESSAGE_ADDED, TICKET_RESOLVED, TICKET_CLOSED, TICKET_REOPENED

### Frontend
- Buyer Support (`/buyer/support`): Rewritten — create ticket modal, status filter tabs, ticket list with loading/empty/error states
- Seller Support (`/seller/support`): Rewritten — same pattern with seller-specific categories
- Admin Support Dashboard (`/admin/support`): Stats row, filters, search, ticket list with quick actions
- Admin Ticket Detail (`/admin/support/[id]`): Message thread, reply form, status updates, assignment

### Architecture Compliance
- ✅ New SupportModule registered in AppModule (not a duplicate — beta-support remains for beta users)
- ✅ Reused PrismaModule, JwtAuthGuard, RolesGuard, @Roles, @Throttle
- ✅ Company-scoped access control (companyId filter for non-admin users)
- ✅ Role-based admin-only endpoints for status/assign
- ✅ Existing Prisma models extended with FK relations (no new models)
- ✅ Design tokens only

---

## 3. Help Center

### Pages Created
- `/help` — category cards grid, search filter, help articles list, popular topics, contact CTA
- `/help/faq` — tab-based category filters, Accordion Q&A, search bar, related articles
- `/help/layout` — metadata export

### Architecture Compliance
- ✅ Reused Accordion, PageHeader, CTABlock, Tabs
- ✅ Static inline content (no API dependency)
- ✅ SEO metadata
- ✅ Design tokens only

---

## 4. Seller Acquisition Page

### Page: `/sell-on-tradingo`
10 sections: Hero, Trust Signals, Benefits, Why TRADINGO, Membership Plans, TradTrust, Marketplace Stats, Testimonials, FAQ, CTA

### Components Reused
- `StatisticsCards`, `FeatureCards`, `PricingCards`, `Testimonials`, `Accordion`, `CTABlock`, `SectionHeader`

### Architecture Compliance
- ✅ No backend changes needed
- ✅ Static content (no API calls)
- ✅ Design tokens only
- ✅ Responsive layout
- ✅ CTA links to /register/vendor and /register/buyer

---

## 5. Buyer Acquisition Page

### Page: `/buy-from-tradingo`
10 sections: Hero, Trust Signals, Benefits, Supplier Verification, Smart RFQ, TradeServ, TradeTalk, Marketplace Stats, Testimonials, FAQ, CTA

### Architecture Compliance
- ✅ No backend changes needed
- ✅ Static content
- ✅ Design tokens only
- ✅ Reuses same component set as seller page

---

## Verification

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `prisma generate` | ✅ |
| `tsc --noEmit` (api) | 0 errors |
| `tsc --noEmit` (web) | 0 errors |
| All new files exist in correct paths | ✅ |
| No hardcoded colors | ✅ (design tokens only) |

**Known Limitations**: Support notification integration (real-time dispatch via NotificationService.createWithTemplate) is wired at code level but not trigger-tested — requires running services with proper notification config.

---

## Files Added

| File | Purpose |
|------|---------|
| `apps/api/src/modules/support/support.module.ts` | Support module registration |
| `apps/api/src/modules/support/support.service.ts` | Support service (8 methods) |
| `apps/api/src/modules/support/support.controller.ts` | Support controller (8 endpoints) |
| `apps/api/src/modules/support/dto/create-ticket.dto.ts` | 4 DTOs (CreateTicket, AddMessage, UpdateStatus, Query) |
| `apps/api/src/modules/support/index.ts` | Module exports |
| `apps/web/lib/api/support.ts` | Frontend API client (9 functions) |
| `apps/web/hooks/use-support.ts` | React Query hooks (8 hooks) |
| `apps/web/app/buyer/support/page.tsx` | Rewritten buyer support |
| `apps/web/app/seller/support/page.tsx` | Rewritten seller support |
| `apps/web/app/admin/support/page.tsx` | Admin support dashboard |
| `apps/web/app/admin/support/[id]/page.tsx` | Admin ticket detail |
| `apps/web/app/seller-agreement/page.tsx` | Seller agreement |
| `apps/web/app/buyer-agreement/page.tsx` | Buyer agreement |
| `apps/web/app/help/page.tsx` | Help center |
| `apps/web/app/help/faq/page.tsx` | FAQ page |
| `apps/web/app/help/layout.tsx` | Help layout |
| `apps/web/app/sell-on-tradingo/page.tsx` | Seller acquisition |
| `apps/web/app/buy-from-tradingo/page.tsx` | Buyer acquisition |

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | FK relations, notification types, reverse relations |
| `apps/api/src/app.module.ts` | Registered SupportModule |
| `apps/api/src/modules/notification/notification.template.service.ts` | Added 6 support notification templates |
| `AGENTS.md` | Updated progress |

## APIs Added

| Method | Path | Description |
|--------|------|-------------|
| POST | `/support/tickets` | Create ticket |
| GET | `/support/tickets` | List tickets |
| GET | `/support/tickets/:id` | Get ticket detail |
| POST | `/support/tickets/:id/messages` | Add message |
| PATCH | `/support/tickets/:id/status` | Update status |
| POST | `/support/tickets/:id/assign` | Assign ticket |
| GET | `/support/categories` | List categories |
| GET | `/support/stats` | Get stats |

## Reuse Matrix

| Component/Pattern | Source | Used In |
|-------------------|--------|---------|
| PageHeader | shared/page-header | Legal pages, Help pages |
| CTABlock | shared/cta-block | Legal pages, Acquisition pages |
| Accordion | ui/accordion | FAQ page, Acquisition pages |
| StatisticsCards | shared/statistics-cards | Acquisition pages |
| FeatureCards | shared/feature-cards | Acquisition pages |
| PricingCards | shared/pricing-cards | Seller acquisition |
| Testimonials | shared/testimonials | Acquisition pages |
| SectionHeader | shared/section-header | Acquisition pages |
| JwtAuthGuard + RolesGuard | common/guards | Support endpoints |
| @Throttle | @nestjs/throttler | Support create/message endpoints |
| NotificationService | notification/ | Wired (template fallbacks) |
| Terms page pattern | /terms → server + sections | /seller-agreement, /buyer-agreement |

---

**Launch Readiness & Acquisition Sprint Complete. Awaiting Architecture Review.**
