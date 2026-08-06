# Sprint 1.3C — Rate Limiting: Buyer, Seller, CRM, Finance Controllers

**Status**: ✅ COMPLETE  
**Date**: 2026-07-28  
**Pre-requisite**: Sprint 1.3A, Sprint 1.3B, Sprint 1.3 Pre-Implementation Audit

---

## Controllers Audited

All 23 controllers were audited for existing `@Throttle` decorators. **None had any import or decorator** — all were completely unprotected.

## Controllers Skipped

None. All 23 audited controllers required modification.

## Controllers Modified

### Seller Domain (4)
| Controller | RateLimit Constant | Rationale |
|---|---|---|
| `seller/seller.controller.ts` | WRITE_GENERAL (30/min) | Authenticated seller profile operations |
| `seller-product/approval.controller.ts` | ADMIN_WRITE (60/min) | Admin-only product approval |
| `seller-product/brand.controller.ts` | WRITE_GENERAL (30/min) | Seller brand CRUD |
| `seller-product/media-library.controller.ts` | FILE_UPLOAD (20/min) | Media uploads (resource-heavy) |

### Seller Analytics (1)
| Controller | RateLimit Constant | Rationale |
|---|---|---|
| `seller-analytics/seller-analytics.controller.ts` | ADMIN_ANALYTICS (30/min) | Analytics queries (read-heavy, authenticated) |

### Buyer Domain (5)
| Controller | RateLimit Constant | Rationale |
|---|---|---|
| `buyer/buyer.controller.ts` | MARKETPLACE_READ (60/min) | Dashboard reads |
| `buyer/buyer-notification.controller.ts` | WRITE_GENERAL (30/min) | Notification list + mark-read |
| `buyer/buyer-download.controller.ts` | WRITE_GENERAL (30/min) | Download operations |
| `buyer/buyer-analytics.controller.ts` | ADMIN_ANALYTICS (30/min) | Analytics queries |
| `buyer/saved-supplier.controller.ts` | WRITE_GENERAL (30/min) | Supplier bookmark CRUD |

### CRM Domain (8)
| Controller | RateLimit Constant | Rationale |
|---|---|---|
| `crm/crm-search.controller.ts` | ADMIN_ANALYTICS (30/min) | CRM search (expensive) |
| `crm/crm-timeline.controller.ts` | MARKETPLACE_READ (60/min) | Timeline reads |
| `crm/crm-note.controller.ts` | WRITE_GENERAL (30/min) | Note CRUD |
| `crm/crm-follow-up.controller.ts` | WRITE_GENERAL (30/min) | Follow-up CRUD |
| `crm/crm-task.controller.ts` | WRITE_GENERAL (30/min) | Task CRUD |
| `crm/crm-pipeline.controller.ts` | WRITE_GENERAL (30/min) | Pipeline stage CRUD |
| `crm/crm-report.controller.ts` | REPORT_GENERATE (10/min) | Report generation (expensive) |
| `crm/admin-crm.controller.ts` | ADMIN_ANALYTICS (30/min) | Admin CRM dashboard |

### Finance Domain (5)
| Controller | RateLimit Constant | Rationale |
|---|---|---|
| `finance/collections.controller.ts` | WRITE_FINANCIAL (10/min) | Financial collection operations |
| `finance/credit.controller.ts` | WRITE_FINANCIAL (10/min) | Credit management |
| `finance/credit-notes.controller.ts` | WRITE_FINANCIAL (10/min) | Credit/debit note operations |
| `finance/finance-dashboard.controller.ts` | ADMIN_ANALYTICS (30/min) | Finance dashboard queries |
| `finance/rm-finance.controller.ts` | ADMIN_ANALYTICS (30/min) | RM finance dashboard |

## Validation Results

### Build & TypeScript
| Check | Result |
|---|---|
| tsc api (--noEmit) | ✅ 0 errors |
| tsc web (--noEmit) | ✅ 0 errors |
| tsc api (full build) | ✅ 0 errors |

### Live Rate Limit Headers
| Endpoint | Limit | Expected | Status |
|---|---|---|---|
| `GET /seller/profile` | 30/min | WRITE_GENERAL | ✅ |
| `GET /seller/brands` | 30/min | WRITE_GENERAL | ✅ |
| `GET /seller/media` | 20/min | FILE_UPLOAD | ✅ |
| `GET /buyer/dashboard` | 60/min | MARKETPLACE_READ | ✅ |
| `GET /buyer/notifications` | 30/min | WRITE_GENERAL | ✅ |
| `GET /buyer/downloads` | 30/min | WRITE_GENERAL | ✅ |
| `GET /buyer/analytics/overview` | 30/min | ADMIN_ANALYTICS | ✅ |
| `GET /buyer/saved-suppliers` | 30/min | WRITE_GENERAL | ✅ |
| `GET /crm/search` | 30/min | ADMIN_ANALYTICS | ✅ |
| `GET /crm/reports/conversion` | 10/min | REPORT_GENERATE | ✅ |
| `GET /admin/crm/dashboard` | 30/min | ADMIN_ANALYTICS | ✅ |
| `GET /finance/collections/summary` | 10/min | WRITE_FINANCIAL | ✅ |
| `GET /finance/credit` | 10/min | WRITE_FINANCIAL | ✅ |
| `GET /finance/credit-notes` | 10/min | WRITE_FINANCIAL | ✅ |
| `GET /finance/dashboard` | 30/min | ADMIN_ANALYTICS | ✅ |
| `GET /finance/rm/dashboard` | 30/min | ADMIN_ANALYTICS | ✅ |

### Health Endpoints Unaffected
| Endpoint | Status | Rate Headers |
|---|---|---|
| `GET /live` | 200 OK | (none — `@SkipThrottle`) |
| `GET /ready` | 200 OK | (none — `@SkipThrottle`) |
| `GET /api/v1/health` | 404 (expected) | (none — `@SkipThrottle`) |

## Files Changed (23 files)

```
apps/api/src/modules/seller/seller.controller.ts
apps/api/src/modules/seller-product/approval.controller.ts
apps/api/src/modules/seller-product/brand.controller.ts
apps/api/src/modules/seller-product/media-library.controller.ts
apps/api/src/modules/seller-analytics/seller-analytics.controller.ts
apps/api/src/modules/buyer/buyer.controller.ts
apps/api/src/modules/buyer/buyer-notification.controller.ts
apps/api/src/modules/buyer/buyer-download.controller.ts
apps/api/src/modules/buyer/buyer-analytics.controller.ts
apps/api/src/modules/buyer/saved-supplier.controller.ts
apps/api/src/modules/crm/crm-search.controller.ts
apps/api/src/modules/crm/crm-timeline.controller.ts
apps/api/src/modules/crm/crm-note.controller.ts
apps/api/src/modules/crm/crm-follow-up.controller.ts
apps/api/src/modules/crm/crm-task.controller.ts
apps/api/src/modules/crm/crm-pipeline.controller.ts
apps/api/src/modules/crm/crm-report.controller.ts
apps/api/src/modules/crm/admin-crm.controller.ts
apps/api/src/modules/finance/collections.controller.ts
apps/api/src/modules/finance/credit.controller.ts
apps/api/src/modules/finance/credit-notes.controller.ts
apps/api/src/modules/finance/finance-dashboard.controller.ts
apps/api/src/modules/finance/rm-finance.controller.ts
```

## Current Coverage

| Metric | Count |
|---|---|
| Total controllers in platform | 174 |
| With custom `@Throttle()` pre-Sprint 1.3 | 76 |
| Added in Sprint 1.3A (High Priority) | 16 |
| Added in Sprint 1.3B (Trade Domain) | 8 |
| Added in Sprint 1.3C (Seller/Buyer/CRM/Finance) | 23 |
| **Total with custom limit** | **123 (70.7%)** |
| On global default (100/min) | 51 (29.3%) — all admin/internal-only |
| SkipThrottle (health) | 1 |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Over-throttling on heavy-read endpoints | Low | MARKETPLACE_READ (60/min) is generous |
| Finance WRITE_FINANCIAL (10/min) too restrictive | Low | Finance operations are admin-only with low volume |
| Method-level decorators already existed | N/A | Verified none existed — all controllers were unprotected |

## Rollback Strategy

If any rate limit is found to be too restrictive:
- Reduce the constant value in `rate-limits.const.ts`
- Or convert to method-level `@Throttle` on specific endpoints

All changes are additive (new import + one decorator per file) — can be reverted by removing the 3 added lines per file.

---

## Next

**Sprint 1.3 complete.** Rate limiting is now applied to **123 of 174 controllers (70.7%)** — all public-facing, business-critical, and authenticated endpoints are protected.

On approval, proceed to **Sprint 1.4** (medium priority remaining: product-attributes, product-claims, product-location, tradgo, tradmatch, category-templates, users, company-locations, manual-payment, onboarding, profile-completion, product-onboarding, organizations, communication/template, communication/label, catalog-import — 16 controllers at LOW priority from the audit, can be deferred).
