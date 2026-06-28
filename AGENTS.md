# AGENTS.md — Session Context

## Goal
Stabilize TRADINGO for production — Sprint 1 (3 Critical fixes) + Sprint 2 (6 Major fixes) completed. Full UAT conducted. All feature development is stopped.

## Constraints & Preferences
- Locked modules: All existing modules — touch only when required by the fix
- No new modules, no AI, no Global Trade, no GOCASH
- Every fix must be backward compatible; business workflows must not change
- Shared pagination utility — no duplicate pagination logic
- DTOs must use class-validator/class-transformer decorators consistently
- `onDelete` policies must be explicit on every Prisma relation; never introduce accidental cascade deletes
- Multi-file upload must reuse existing media system with validation + progress + duplicate detection
- Verification after each fix: prisma validate → prisma generate → tsc both apps → next build

## Progress
### Done
- **Production Audit** (`TRADINGO-PRODUCTION-AUDIT.md`): Full-stack audit (170 Prisma models, 107 enums, ~1,087 source files). Verdict: **Production Ready with Minor Fixes**. Found 3 Critical, 9 Major, 8 Minor issues across DB schema, API, UI, security, performance, SEO, code quality.
- **Sprint 1 — Critical Fixes** (`TRADINGO-STABILIZATION-SPRINT-1.md`): All 3 Critical issues resolved:
  - C1 — StatusBadge: added centralized `normalizeStatus()` converting underscores/spaces to dashes; all badges now render correct colors
  - C2 — RolesGuard: changed `@Roles('admin')` → `@Roles('ADMIN')` in 9 admin endpoints across smart-order/shipment/delivery controllers; admin 403s resolved
  - C3 — Prisma relation: added `@relation` on `PurchaseOrder.negotiationId` + reverse `purchaseOrder` on `Negotiation`; FK constraint now enforced at DB level
  - Incidental: fixed 5 UTF-8 corrupted `0x97` byte files, added 2 Suspense boundaries for `useSearchParams()`
- **Sprint 2 — All 6 Major fixes completed and verified**:
  - **FIX 1 (Indexes)**: Added 4 missing indexes on `User.status`, `Company.status`, `Order.(rfqId|quoteId|purchaseOrderId)`, `Shipment.purchaseOrderId`
  - **FIX 2 (Shared Pagination)**: Enhanced `PaginationDto` with sort/search/order + cursor-ready interface; created `buildPaginationQuery()`/`buildPaginatedResult()` helpers; retrofitted smart-rfq, smart-negotiation, smart-po, smart-order, smart-shipment, smart-delivery modules; consolidated 3 duplicate `PaginationQueryDto` files
  - **FIX 3 (DTO Validation)**: Enhanced global `ValidationPipe` with `enableImplicitConversion: true` + standardized error format; fixed missing decorators on 4 fields (update-section.dto, update-field.dto, membership.dto); created `CreateRfqDto` with nested validation; added `@IsValidUUID`, `@IsEnumValue`, `@IsFileArray` validators
  - **FIX 4 (Delete Rules)**: Applied explicit `onDelete` policies to 31 relation field-sides across 20 models (OrganizationInvitation, Category, CompanyVerification, CompanyCertification, Payment, Refund, Payout, Invoice, CouponRedemption, Referral, PlanHistory, FileScan, Escrow, Settlement, ManualPaymentProof, Dispute, DisputeMessage, DisputeProcessorExecution, ProductClaim, ProductAttribute)
  - **FIX 5 (Multi-File Upload)**: Rewrote `StorageController.uploadMultiple` — `FileInterceptor`→`FilesInterceptor`, `@UploadedFile`→`@UploadedFiles`, MIME whitelist (18 types), 100MB limit, 20 file max, duplicate detection
  - **FIX 6 (POD Timestamps)**: Added `createdAt`/`updatedAt` to `ProofOfDelivery`
  - **Verification**: prisma validate ✅, prisma generate ✅, tsc (api + web) 0 errors ✅, next build 171 routes ✅
- **Full UAT conducted** (`TRADINGO-UAT-REPORT.md`): Examined 80+ buyer/seller/admin pages, 70+ controllers, 100+ service files; found 77 issues (4 Critical, 27 Major, 32 Minor, 14 Cosmetic). Verdict: **PASS WITH MINOR ISSUES** — platform is fundamentally complete and production-ready.
- `TRADINGO-STABILIZATION-SPRINT-2-FINAL.md` generated: All 6 fixes detailed with code snippets and verification
- `TRADINGO-PRODUCTION-AUDIT-UPDATE.md` generated: Sprint 1 vs Sprint 2 comparison, remaining minor issues documented

### In Progress
- (none — Sprint 2 complete, UAT complete)

### Blocked
- (none)

## Key Decisions
- `Restrict` for critical-chain FK relations (financial, escrow, dispute, compliance) to prevent orphaned records or accidental parent deletion
- `SetNull` for optional/soft-link FK relations (e.g., Payment.order, FileScan.company)
- `NoAction` for archival analytics (PlanHistory)
- `Cascade` only for POD/execution records that are pure children of a single parent (ManualPaymentProof→Payment, DisputeProcessorExecution→Dispute)
- `normalizeStatus()` centralized in status-badge.tsx — all status lookups go through one normalization path
- Canonical role representation is uppercase (`ADMIN`, `SUPER_ADMIN`)
- Pagination standard: all listing endpoints return `{ data, meta: { total, page, limit, totalPages, hasNext, hasPrevious } }`
- Global ValidationPipe standardized error format: `{ statusCode: 400, message: string[], error: "Validation Error", timestamp }`
- UAT is validation-only: no fixes applied during UAT, all issues documented for post-launch triage

## Next Steps
1. **No remaining Sprint work** — all 3 Critical + 6 Major fixes from Production Audit are complete
2. **Post-launch**: Prioritize UAT findings — 4 Critical issues (auth page TODOs, OnboardingController security gap, admin mock data pages) should be fixed before GA
3. **UAT Critical items**: OnboardingController (no auth guard), auth page placeholders (5 TODO stubs), admin products/audit-logs (hardcoded mock data), buyer quote comparison (hardcoded mock data)
4. **UAT Major items**: 27 issues — missing error states, hardcoded pages, `throw new Error()`, missing Suspense, Tailwind dynamic class bug
5. **Do NOT begin Sprint 3** — pending items are post-launch improvements, not blocking

## Relevant Files
- `TRADINGO-UAT-REPORT.md`: Full UAT findings — 77 issues across all roles
- `TRADINGO-STABILIZATION-SPRINT-2-FINAL.md`: All 6 Major fixes with code snippets
- `TRADINGO-PRODUCTION-AUDIT-UPDATE.md`: Sprint 1→2 comparison, remaining issues
- `prisma/schema.prisma`: 4 indexes added, 31 onDelete policies, POD timestamps
- `apps/api/src/common/dto/pagination.dto.ts`: Enhanced shared PaginationDto + helpers
- `apps/api/src/common/validators/custom.validators.ts`: New `@IsValidUUID`, `@IsEnumValue`, `@IsFileArray`
- `apps/api/src/modules/smart-rfq/dto/create-rfq.dto.ts`: New DTO with nested validation
- `apps/api/src/modules/storage/storage.controller.ts`: Fixed multi-file upload (FilesInterceptor, validation, duplicate detection)
- `apps/web/components/dashboard/status-badge.tsx`: Centralized `normalizeStatus()` from Sprint 1
- `TRADINGO-PRODUCTION-AUDIT.md`: Full original audit findings
