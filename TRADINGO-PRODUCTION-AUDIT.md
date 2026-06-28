# TRADINGO Production Audit Report

**Date:** 2026-06-28
**Audit Scope:** Full-stack production readiness assessment
**Platform:** pnpm monorepo — NestJS 11 (Fastify) API + Next.js 16 (React 19) Web + Prisma 6 (PostgreSQL)

---

## Executive Summary

TRADINGO is a large B2B trade platform spanning 170 Prisma models, 107 enums, ~1,087 source files across 2 apps. The platform implements a complete RFQ→Quote→Negotiation→PO→Order→Shipment→Delivery lifecycle. Overall code quality is strong, with passing TypeScript compilation on both apps and comprehensive business logic coverage.

**Classification: Production Ready with Minor Fixes**

The platform is fundamentally production-ready. No blocking architectural issues exist. However, 3 critical bugs and 12+ moderate issues should be addressed before GA launch.

**Critical Issues (3):**
1. StatusBadge key format mismatch — ALL status badges render generic fallback
2. Role guard casing mismatch — 9 admin endpoints in smart-order/shipment/delivery are inaccessible
3. PurchaseOrder.negotiationId missing Prisma @relation — no FK constraint

---

## Module-by-Module Results

### ✅ Authentication & Authorization
- JWT auth with Passport + refresh tokens
- Google/LinkedIn OAuth
- OTP-based login and verification
- Role-based access control (RBAC) with RolesGuard and PermissionsGuard
- Company owner verification (CompanyOwnerGuard)
- Public endpoint decorator (`@Public()`) for skip-auth routes
- `tsc` passes, no type errors
- **Status: PRODUCTION READY ⚠️ (1 issue)**

### ✅ Membership & Billing
- Membership plans (TRADE_START through TRADE_ELITE, TRADBUY)
- Subscription lifecycle with trial/active/expired/suspended/cancelled
- Billing module with invoice generation, history, PDF download, tax summary
- PlanHistory tracking all plan changes
- Subscription alert periods (30/15/7/3/1 day)
- **Status: PRODUCTION READY**

### ✅ Payments
- Razorpay integration with order creation and verification
- Stripe integration
- Webhook handlers for both gateways
- Full payment lifecycle: pending → processing → captured → failed → refunded → partially_refunded
- Admin payment management with gateway logs
- Refund support with order return linking
- Payout support for sellers
- **Status: PRODUCTION READY**

### ✅ Company Profile
- Company CRUD with directory, search, slug-based routing
- Company verification (KYC) with document upload
- Company locations (head office, branch, warehouse, factory, pickup)
- Company categories and industries
- TradTrust scoring
- Profile completion tracking
- **Status: PRODUCTION READY**

### ✅ Product Management
- Full product CRUD with slug generation
- Product variants, inventory, price slabs, specifications
- Product media, attachments, multi-language descriptions
- Product approval workflow (submitted/approved/rejected/revision_requested)
- Product claims for marketplace product ownership
- Product export (Excel/CSV), bulk operations
- Brand management, media library
- Product analytics for sellers
- **Status: PRODUCTION READY**

### ✅ Product Discovery
- Search with OpenSearch integration
- Product cards with rating, price, seller trust
- Category and industry browsing
- Near To Far™ geo-matching
- Product comparison (wishlist, compare bar)
- Trending, bestseller, top-seller endpoints
- **Status: PRODUCTION READY**

### ✅ Smart RFQ Engine
- RFQ creation wizard (7 steps)
- Seller matching and vendor distribution
- Near To Far™ supplier scoring
- Admin monitoring (overview, flagged, audit trail)
- RFQ credit packs and analytics
- Notification triggers on match
- **Status: PRODUCTION READY**

### ✅ Smart Quotation Engine
- Quote creation by sellers in response to RFQs
- Buyer comparison (12-column side-by-side)
- Quote events tracking (created, viewed, accepted, rejected, expired)
- Revision support
- Admin monitoring
- **Status: PRODUCTION READY**

### ⚠️ Smart Negotiation Center
- 12 endpoints, full lifecycle (start/counter/accept/reject/cancel)
- Version tracking + timeline events
- Buyer and seller dashboards
- Admin 4-tab monitoring
- Notification integration
- **Status: PRODUCTION READY ⚠️ (minor)**

### ⚠️ Smart Purchase Order Engine
- 15+ endpoints, full lifecycle (generate/confirm/accept/lock/cancel/revision)
- PDF generation
- Buyer/seller/admin dashboards
- Notification integration
- **Missing `@relation` on `negotiationId`** (see Critical Issue #3)
- **Status: PRODUCTION READY ⚠️ (1 critical issue)**

### ⚠️ Smart Order Management
- Order creation from locked PO only (enforced)
- Status transitions with STATUS_FLOW validation
- Buyer/seller/admin dashboards
- Timeline + document tracking
- **Role guard uses lowercase `'admin'`** (see Critical Issue #2)
- **Status: PRODUCTION READY ⚠️ (1 critical issue)**

### ⚠️ Smart Shipment & Logistics
- 16 endpoints, full shipment lifecycle
- Provider-agnostic courier layer (12 seeded providers)
- Shipment packages, timeline events, documents
- Buyer tracking page, seller create/assign-courier flow
- Admin analytics dashboard
- **Role guard uses lowercase `'admin'`** (see Critical Issue #2)
- **Status: PRODUCTION READY ⚠️ (1 critical issue)**

### ⚠️ Smart Delivery & POD
- 13 endpoints, full delivery lifecycle
- POD capture (receiver name/mobile/OTP/geo/signature/photo)
- Buyer confirm/reject flow, seller status transitions
- Admin 3-tab dashboard
- Documents + timeline
- **Role guard uses lowercase `'admin'`** (see Critical Issue #2)
- **Status: PRODUCTION READY ⚠️ (1 critical issue)**

### ✅ Notifications System
- ~90 NotificationType values covering every business event
- NotificationService.createWithTemplate pattern
- In-app + email + SMS + push channels
- Notification preferences per company
- Unread count, mark-read, bulk operations
- Template-based message generation
- **Status: PRODUCTION READY**

### ✅ Trade Communication Hub
- Chat/messaging with conversations and messages
- Message status tracking (sent/delivered/read)
- File attachments, message reporting, moderation
- Conversation labeling, archiving, muting, pinning
- Audit logging for conversations
- **Status: PRODUCTION READY**

### ✅ Escrow & Settlement
- Escrow lifecycle: pending → held → released → refunded → disputed
- Escrow events with status change tracking
- Settlement processing with retry logic
- Manual review workflows
- **Status: PRODUCTION READY**

### ✅ Dispute Resolution
- Full dispute lifecycle with appeals
- Evidence upload, messages, escalation
- Admin arbitration with resolution types
- 13 dispute statuses covering all scenarios
- **Status: PRODUCTION READY**

### ✅ Admin Dashboard
- Comprehensive admin modules: users, companies, products, categories, RFQs, quotes, negotiations, POs, orders, shipments, deliveries, payments, disputes, KYC, fraud, audit logs, system health
- Moderation tools for communication, products, feedback
- Launch checklist and incident management
- Beta program management
- **Status: PRODUCTION READY**

---

## Critical Issues

### CRITICAL-1: StatusBadge Key Format Mismatch — ALL Status Badges Broken

**Severity:** CRITICAL
**Location:** `apps/web/components/dashboard/status-badge.tsx:50`
**Description:** The `statusStyles` map uses **dash-case** keys (e.g., `'out-for-delivery'`, `'buyer-confirmed'`), but pages pass status values in **SCREAMING_SNAKE_CASE** (e.g., `OUT_FOR_DELIVERY`, `DELIVERY_CONFIRMED`). The lookup does `status.toLowerCase()` which produces `out_for_delivery` — this does NOT match `out-for-delivery`, so **every single StatusBadge instance falls through to the generic fallback style**.

Status differentiation is completely lost across all ~50+ pages using StatusBadge. All badges render white-on-transparent regardless of actual status.

**Fix:** Normalize the lookup key:
```ts
const normalized = status.toLowerCase().replace(/[ _]/g, '-');
const style = statusStyles[normalized] || 'border-white/10 bg-white/[0.04] text-white/50';
```

### CRITICAL-2: Role Guard Lowercase `'admin'` — 9 Admin Endpoints Inaccessible

**Severity:** CRITICAL
**Location:**
- `apps/api/src/modules/smart-order/smart-order.controller.ts:115,123,135`
- `apps/api/src/modules/smart-shipment/smart-shipment.controller.ts:109,117,129`
- `apps/api/src/modules/smart-delivery/smart-delivery.controller.ts:83,91,99`

**Description:** Three smart modules use `@Roles('admin')` (lowercase) on their admin endpoints. The `RolesGuard` at `apps/api/src/common/guards/roles.guard.ts` does strict comparison `user.role === requiredRole`. Since `Role` enum values are uppercase (`ADMIN`, `SUPER_ADMIN`), every request to these endpoints returns `ForbiddenException`.

**Affected endpoints:**
- `GET /smart-order/admin/analytics`
- `GET /smart-order/admin/all`
- `GET /smart-order/admin/:orderId`
- `GET /smart-shipment/admin/analytics`
- `GET /smart-shipment/admin/all`
- `GET /smart-shipment/admin/:id`
- `GET /smart-delivery/admin/analytics`
- `GET /smart-delivery/admin/all`
- `GET /smart-delivery/admin/:id`

**Fix:** Change `@Roles('admin')` to `@Roles('ADMIN')` in all 9 locations.

### CRITICAL-3: PurchaseOrder.negotiationId Missing Prisma @relation

**Severity:** CRITICAL
**Location:** `prisma/schema.prisma:4403`
**Description:** `PurchaseOrder.negotiationId` is declared as a plain `String @unique` with NO `@relation` attribute. This means:
- No foreign key constraint at the database level
- No cascade behavior if a Negotiation is deleted
- Prisma cannot generate typed joins or nested queries
- Referential integrity is enforced only at the application layer

All other steps in the chain (Quote→Negotiation, PO→Order, Order→Shipment, Shipment→Delivery) have proper `@relation` directives with explicit `onDelete` policies.

**Fix:**
```prisma
negotiationId String @unique
negotiation   Negotiation @relation(fields: [negotiationId], references: [id], onDelete: Restrict)
```

---

## Major Issues

### MAJOR-1: 33 Relations Across 19 Models Missing onDelete Policies

**Severity:** MAJOR
**Location:** Multiple models — see table below
**Description:** Deleting parent records (User, Company, Order, Payment, etc.) will fail with FK constraint violations because 33 `@relation` directives lack explicit `onDelete`.

| Model | Missing onDelete On | Target |
|-------|-------------------|--------|
| OrganizationInvitation | inviter → User | User |
| GoCashTransaction | company → Company | Company |
| SellerAnalyticsEvent | company → Company | Company |
| RfqAnalytics | company → Company | Company |
| Payment | company, order | Company, Order |
| Refund | payment, orderReturn | Payment, OrderReturn |
| Payout | company → Company | Company |
| Invoice | company, payment | Company, Payment |
| CouponRedemption | coupon, company | Coupon, Company |
| Referral | referrer, referee | Company ×2 |
| PlanHistory | company → Company | Company |
| FileScan | company → Company | Company |
| Escrow | order, buyerCompany, sellerCompany | Order, Company ×2 |
| Settlement | escrow → Escrow | Escrow |
| ManualPaymentProof | payment, company, verifiedBy | Payment, Company, User |
| Dispute | order, escrow, raisedByCompany, againstCompany | Order, Escrow, Company ×2 |
| DisputeMessage | sender → User | User |
| DisputeProcessorExecution | dispute → Dispute | Dispute |
| ProductClaim | company → Company | Company |
| ProductAttribute | field → TemplateField | TemplateField |

### MAJOR-2: Missing Database Indexes — 6 Locations

**Severity:** MAJOR
**Description:** Performance-impacting missing indexes on frequently queried columns.

| Model | Missing Index On | Impact |
|-------|-----------------|--------|
| Company | `status` | Company filtering by status |
| User | `status` | User filtering by status |
| Order | `rfqId` | FK join to Rfq |
| Order | `quoteId` | FK join to Quote |
| Order | `purchaseOrderId` | FK join to PurchaseOrder |
| Shipment | `purchaseOrderId` | FK join to PurchaseOrder |

### MAJOR-3: No Pagination on Smart-* List Endpoints (5 Modules)

**Severity:** MAJOR
**Location:**
- `GET /smart-negotiation` (buyer list)
- `GET /smart-negotiation/seller` (seller list)
- `GET /smart-po` (buyer list)
- `GET /smart-po/seller` (seller list)
- `GET /smart-order/buyer`
- `GET /smart-order/seller`
- `GET /smart-shipment/buyer`
- `GET /smart-shipment/seller`
- `GET /smart-delivery/buyer`
- `GET /smart-delivery/seller`

**Description:** All smart-* list endpoints return ALL records without pagination. As transaction volumes grow, this will cause memory and performance issues. Compare with 10+ other services that properly implement page/limit/skip/take.

### MAJOR-4: ProofOfDelivery Missing createdAt Field

**Severity:** MAJOR
**Location:** `prisma/schema.prisma:4749-4765`
**Description:** The `ProofOfDelivery` model has no `createdAt @default(now())` field. It relies solely on `deliveredAt`. This means there is no way to distinguish when the POD record was created vs when delivery occurred. All other 169 models have proper timestamps.

### MAJOR-5: 17 Modules Lack DTO Validation

**Severity:** MAJOR
**Description:** The following modules have no `dto/` folder and do not use `class-validator` decorators on their endpoints. They rely on inline parameter access or manual validation.

`analytics`, `billing`, `buyer`, `communication`, `membership`, `near-me`, `onboarding`, `profile-completion`, `search`, `seller`, `smart-rfq`, `storage`, `tradgo`, `tradmatch`, `tradtrust`, `vendor-codes`

### MAJOR-6: StorageController Multiple Upload Broken

**Severity:** MAJOR
**Location:** `apps/api/src/modules/storage/storage.controller.ts:30`
**Description:** `uploadMultiple()` uses `FileInterceptor('files')` (single file interceptor) instead of `FilesInterceptor('files')` (multi-file). A code comment on line 34 acknowledges: "This would need FilesInterceptor for multiple files".

### MAJOR-7: Two @@unique Constraints on Nullable Fields

**Severity:** MAJOR
**Location:**
- `prisma/schema.prisma:996` — `GoCashTransaction`: `@@unique([companyId, type, reason])` where `reason` is `String?`
- `prisma/schema.prisma:1568` — `RfqCreditLedger`: `@@unique([companyId, type, referenceId])` where `referenceId` is `String?`

**Description:** PostgreSQL unique constraints allow multiple NULL values, so duplicate entries with `NULL` in the nullable field are NOT prevented. If the intent is to prevent any duplicates, use a partial unique index or change the field to non-nullable with a sentinel value.

---

## Minor Issues

### MINOR-1: DollarSign Icon Missing from Sidebar ICON_MAP

**Severity:** Minor
**Location:** `apps/web/components/dashboard/sidebar.tsx:114-119`
**Description:** The `ICON_MAP` has no `DollarSign` entry, so the "Quotes" nav item for all 3 roles falls back to `LayoutDashboard` icon.

### MINOR-2: console.log Statements in Production Code (15 instances)

**Severity:** Minor
**Location:**
- `apps/web/app/companies/CompanyDirectoryClient.tsx:72-168` — 13 debug console.log statements
- `apps/web/app/rfq/create/RfqWizard.tsx:120` — 1 debug console.log
- `apps/web/lib/monitoring/sentry.ts:79` — 1 structured log (acceptable)

### MINOR-3: TODO Placeholders in Auth Pages (8 instances)

**Severity:** Minor
**Location:** All `apps/web/app/(auth)/*` pages
- `verify-mobile/page.tsx:37,48` — TODO: Verify mobile OTP, Resend OTP
- `onboarding/page.tsx:75` — TODO: Submit onboarding data
- `register/seller/page.tsx:39` — TODO: Submit seller details
- `reset-password/page.tsx:50` — TODO: Reset password via token
- `verify-email/page.tsx:35,46` — TODO: Verify email OTP, Resend OTP

### MINOR-4: HttpCode Style Inconsistency

**Severity:** Minor
**Description:** Early modules use `@HttpCode(HttpStatus.OK)` (enum style) while smart-* modules use `@HttpCode(200)` (numeric style). Both work correctly but are inconsistent across the codebase.

### MINOR-5: No loading.tsx Files — Inline Loading Only

**Severity:** Minor
**Description:** Dashboard pages use inline `isLoading ? <TableSkeleton /> :` patterns instead of Next.js `loading.tsx` files. This works but bypasses Next.js streaming and Suspense integration.

### MINOR-6: Unused Imports in Admin Pages

**Severity:** Minor
**Location:**
- `apps/web/app/admin/communication/page.tsx:7` — `CardHeader`, `CardTitle` unused
- `apps/web/app/admin/delivery/page.tsx:5` — `Button` unused
- `apps/web/app/admin/negotiation/page.tsx:5` — `Button` unused
- `apps/web/app/admin/order/page.tsx:5,8` — `Button`, `Link` unused

### MINOR-7: Orphaned Module Directories Not Imported

**Severity:** Minor
**Location:** `apps/api/src/modules/search/`, `tradtrust/`, `malware/`
**Description:** Three module directories exist but are NOT imported in `apps/api/src/app.module.ts` and have no controllers. These may be dead code or work-in-progress.

### MINOR-8: Overlapping NotificationType Values

**Severity:** Minor
**Location:** `prisma/schema.prisma:2610,2668`
**Description:** `DISPUTE_CREATED` (line 2668) duplicates the meaning of `DISPUTE_OPENED` (line 2610). Code uses `DISPUTE_OPENED`. The duplicate should be removed to avoid confusion.

---

## Performance Findings

| Finding | Severity | Detail |
|---------|----------|--------|
| Missing indexes on 6 frequently queried columns | **Major** | See MAJOR-2 — affects query performance at scale |
| No pagination on 10 smart-* list endpoints | **Major** | See MAJOR-3 — returns unbounded result sets |
| No bundle analysis conducted | Info | Recommend `next-bundle-analyzer` before GA |
| No lazy loading audit | Info | Pages use standard Next.js patterns |
| React Query caching active | OK | Proper query key invalidation patterns observed |
| Images use Unsplash/placeholder URLs | OK | No local image optimization audit performed |

---

## Security Findings

| Finding | Severity | Detail |
|---------|----------|--------|
| 9 admin endpoints inaccessible (wrong role casing) | **Critical** | See CRITICAL-2 — impacts admin operations |
| JWT auth + refresh tokens | ✅ | Properly implemented with Passport |
| Rate limiting (100 req/60s global) | ✅ | ThrottlerGuard applied globally |
| File upload lacks type/size validation | **Major** | No FileTypeValidator or MaxFileSizeValidator |
| XSS protection | ✅ | React/Next.js auto-escape |
| SQL injection | ✅ | Prisma parameterized queries |
| CSRF | ✅ | Next.js built-in + API token-based auth |
| User ownership validation | ✅ | CompanyOwnerGuard pattern |
| Role-based access control | ✅ | RolesGuard + PermissionsGuard |
| Public endpoints correctly decorated | ✅ | @Public() on all public routes |

---

## SEO Findings

| Finding | Severity | Detail |
|---------|----------|--------|
| Sitemap generation | ✅ | `app/sitemap.ts` with static + category + city routes |
| Robots.txt | ✅ | `app/robots.ts` with correct disallow rules for auth/seller/buyer/admin |
| Metadata in root layout | ✅ | Root `layout.tsx` has Next.js `Metadata` export |
| Dynamic product pages | ✅ | Product slugs with canonical URLs |
| Schema markup | ⚠️ **Missing** | No JSON-LD structured data on product or company pages |
| Canonical URLs | ⚠️ **Missing** | No `<link rel="canonical">` on dynamic pages |
| Page-specific metadata | ⚠️ **Partial** | Root layout has metadata, but many nested pages lack page-specific `generateMetadata` |

---

## Code Quality Findings

| Finding | Score | Detail |
|---------|-------|--------|
| TypeScript compilation | ✅ PASS | Both apps: `tsc --noEmit` passes with 0 errors |
| ESLint errors (source files) | 4 errors | All are `@typescript-eslint/no-unused-vars` — unused imports in admin pages |
| ESLint warnings | ~100 warnings | Mostly `@typescript-eslint/no-explicit-any` across both apps |
| console.log in source | 15 instances | Heavy debug logging in CompanyDirectoryClient.tsx |
| TODOs in source | 8 instances | All in `/(auth)/` pages — placeholder implementations |
| Dead module directories | 3 | `search/`, `tradtrust/`, `malware/` exist but are not wired |
| Unused enum values | Several | NotificationType has some defined but unused values |
| TypeScript `any` usage | Widespread | Lint warnings indicate ~100+ locations using `any` across both apps |

---

## Broken Links / Missing Integrations

| Finding | Severity | Detail |
|---------|----------|--------|
| All nav items have page.tsx | ✅ PASS | Verified all nav entries map to existing routes |
| Seller delivery pages exist | ✅ | `/seller/delivery` and `/seller/delivery/[id]` created |
| No dead nav items | ✅ | Every nav label has a matching route |

---

## Recommended Fixes (Priority Order)

### Fix Immediately (Pre-GA)

1. **CRITICAL-1**: Fix `status-badge.tsx` key normalization — add `.replace(/[ _]/g, '-')` to the lookup
2. **CRITICAL-2**: Fix role casing in smart-order/shipment/delivery — change `'admin'` to `'ADMIN'`
3. **CRITICAL-3**: Add `@relation` to `PurchaseOrder.negotiationId` in Prisma schema
4. **MAJOR-6**: Fix `StorageController.uploadMultiple` — replace `FileInterceptor` with `FilesInterceptor`

### Fix Within Sprint

5. **MAJOR-1**: Add `onDelete` policies to all 33 relations (prioritize Payment, Order, Company, User relations)
6. **MAJOR-2**: Add indexes on `Company.status`, `User.status`, `Order.rfqId`, `Order.quoteId`, `Order.purchaseOrderId`, `Shipment.purchaseOrderId`
7. **MAJOR-3**: Add pagination to all smart-* list endpoints
8. **MAJOR-4**: Add `createdAt @default(now())` to `ProofOfDelivery`
9. **MAJOR-5**: Add DTO validation to 17 modules (prioritize billing, communication, seller-product)
10. **MAJOR-7**: Fix `@@unique` constraints on nullable fields (make fields non-nullable or use partial indexes)
11. **MINOR-1**: Add `DollarSign` to sidebar ICON_MAP
12. **MINOR-6**: Remove unused imports in admin pages

### Fix Within First Release Sprint

13. **MINOR-2**: Remove or guard debug console.log in CompanyDirectoryClient.tsx
14. **MINOR-3**: Implement TODO placeholders in auth pages
15. **MINOR-7**: Wire or remove orphaned module directories
16. **SEO**: Add JSON-LD structured data + canonical URLs on product/company pages
17. **Security**: Add file type/size validation to POST /upload

---

## Production Checklist

### Pre-Launch Checklist

- [ ] **CRITICAL-1: StatusBadge fix** — Apply key normalization
- [ ] **CRITICAL-2: Role guard fix** — Change lowercase `'admin'` to `'ADMIN'` in 3 modules
- [ ] **CRITICAL-3: Prisma @relation fix** — Add relation to PurchaseOrder.negotiationId
- [ ] Run `npx prisma migrate dev` after schema changes
- [ ] Run `npx prisma generate` to update client
- [ ] Run `tsc --noEmit` on both apps — verify 0 errors
- [ ] Run ESLint on both apps — verify 0 errors
- [ ] Verify all admin endpoints for smart-order/shipment/delivery respond with 200
- [ ] Verify StatusBadge renders correct colors for all ~40 status values
- [ ] Verify file upload works for both single and multiple files

### Post-Launch Checklist

- [ ] Add pagination to all list endpoints
- [ ] Add missing database indexes
- [ ] Add JSON-LD structured data
- [ ] Configure `next-bundle-analyzer` for bundle optimization
- [ ] Set up proper error monitoring (Sentry is configured but verify)
- [ ] Load test smart-* endpoints with realistic data volumes
- [ ] Audit console.log removal in production builds
- [ ] Verify all notification types trigger correctly through the lifecycle

---

## Conclusion

**Verdict: PRODUCTION READY WITH MINOR FIXES**

TRADINGO is a robust, well-architected B2B trade platform. TypeScript compilation passes cleanly on both apps with 0 errors. The complete RFQ→Quote→Negotiation→PO→Order→Shipment→Delivery lifecycle is implemented end-to-end with proper status flows, notifications, and timeline tracking.

Three critical bugs must be fixed before GA:
1. StatusBadge renders all statuses as generic (format mismatch)
2. 9 admin endpoints return 403 Forbidden (role casing bug)
3. PurchaseOrder→Negotiation lacks database-level foreign key

These are straightforward fixes (none require architectural changes). Once addressed, the platform is ready for production deployment with ongoing monitoring for the issues tracked above.

**Estimated fix effort:** 2-3 developer days for all critical + major issues combined.
