# Platform Rate Limiting Coverage Report

**Date**: 2026-07-28  
**Source**: Exhaustive audit of `apps/api/src/modules/` — 170 controller files

---

## Summary

| Metric | Count | Percentage |
|--------|-------|-----------|
| **Total controller files** | **170** | 100% |
| With class-level `@Throttle` | 98 | 57.6% |
| With class + method `@Throttle` | 10 | 5.9% |
| **With any class-level throttle** | **108** | **63.5%** |
| Method-level only `@Throttle` | 8 | 4.7% |
| **Any throttle coverage** | **116** | **68.2%** |
| `@SkipThrottle()` | 0 | 0.0% |
| **Global default only (no throttle)** | **54** | **31.8%** |

---

## Controllers with Class-Level @Throttle (108)

All endpoints in these controllers are throttled by a class-level decorator:

**Admin & AI (13):** admin-agent, admin-intelligence/ai-admin, advertising/admin-advertising, advertising/advertising, ai/ai-bulk, ai/ai-product-intelligence, ai-gateway/admin-ai-gateway, ai-gateway/ai-gateway, ai-orchestrator, ai-runtime, billing/billing, campaign, chat, commission, community-agent, company-verification, dispute, enterprise-catalog/enterprise-search, enterprise-intelligence, escrow, executive-agent, executive-intelligence/executive-intelligence, finance/ai-finance, gallery, gocash, gocash-ecosystem/gocash-ecosystem, gocash-integration, growth-intelligence, location-intelligence, marketplace-intelligence, near-me, payment/payment-admin, payment/payment-subscription, payment/payment-webhook, payment/payment, payout/payout-admin, payout/payout, professional-agent, quote/ai-quote, quote/quote, referral, seller-agent, seller-product/bulk-operations, seller-product/seller-product, settlement, smart-negotiation/ai-negotiation, tradeserv/ai-tradeserv, tradeserv/tradeserv-admin, tradeserv/tradeserv-booking, tradeserv/tradeserv-inquiry, tradeserv/tradeserv-proposal, tradeserv/tradeserv-search, tradeserv/tradeserv, tradetalk/ai-tradetalk, tradetalk/tradetalk-admin, tradfind/ai-search, tradtrust, user-verification

**Buyer (6):** buyer/buyer-analytics, buyer/buyer-download, buyer/buyer-notification, buyer/buyer, buyer/requirement, buyer/saved-supplier

**Seller (8):** seller/seller, seller-analytics/seller-analytics, seller-product/approval, seller-product/brand, seller-product/media-library, seller-product/seller-product (also class), seller-agent, seller-product/bulk-operations (also class)

**CRM (9):** crm/admin-crm, crm/ai-crm, crm/crm-follow-up, crm/crm-note, crm/crm-pipeline, crm/crm-report, crm/crm-search, crm/crm-task, crm/crm-timeline

**Finance (5):** finance/collections, finance/credit-notes, finance/credit, finance/finance-dashboard, finance/rm-finance

**Membership (2):** membership/membership-admin, membership/membership

**Communication (4):** communication/conversation, communication/message, communication/moderation, chat/chat

**Tradeserv (7):** tradeserv (×7 controllers)

**Tradetalk (3):** tradetalk/tradetalk (class + method), tradetalk/tradetalk-admin, tradetalk/ai-tradetalk

**Smart Modules (6):** smart-delivery, smart-negotiation/smart-negotiation, smart-order, smart-po, smart-rfq, smart-shipment

**Core (8):** categories (class + method), companies (class + method), industries (class + method), notification (class + method), products (class + method), refund/refund-engine (class + method), support (class + method), order/order

---

## Controllers with Method-Level Only @Throttle (8)

These have individual method throttles but **no class-level fallback**. Non-throttled methods use the global default (100/min):

| Controller | Methods with @Throttle |
|---|---|
| `analytics/analytics.controller.ts` | adminDashboard (60), userAnalytics (30) |
| `auth/auth.controller.ts` | All 18 methods (3-20/min) |
| `crm/crm.controller.ts` | listCampaigns (30) |
| `crm/public-crm.controller.ts` | submitInquiry (3) |
| `finance/aggregator.controller.ts` | exportCsv (5) |
| `tracking/tracking.controller.ts` | 1 method (60) |
| `tradfind/tradfind.controller.ts` | 8 methods (30-60) |
| `vendor-codes/vendor-codes.controller.ts` | validate (20) |

**Risk**: These have adequate per-method throttling for the critical endpoints, but uncritical methods fall back to 100/min.

---

## Controllers with Global Default Only (54)

These have **zero throttle decorators** and rely entirely on the global 100 req/min:

### Admin/Internal (acceptable — low traffic, authenticated)
| Controller | Reason |
|---|---|
| `admin-settings` | Admin-only |
| `audit-log` | Internal |
| `billing/billing-admin` | Admin-only |
| `enterprise-catalog/catalog-admin` | Admin-only |
| `enterprise-catalog/global-attribute` | Admin-only |
| `enterprise-catalog/global-brand` | Admin-only |
| `enterprise-catalog/taxonomy` | Admin-only |
| `feature-flags` | Internal |
| `founder-ai` | SUPER_ADMIN only |
| `freight-intelligence` | Admin-only |
| `gocash-ecosystem/admin-ecosystem` | Admin-only |
| `incident-response` | Admin-only |
| `launch/incidents` | Admin-only (launch phase) |
| `launch/launch-checklist` | Admin-only (launch phase) |
| `launch/launch-dashboard` | Admin-only (launch phase) |
| `market-intelligence` | Admin-only |
| `marketplace-catalog-bridge` | Admin-only |
| `quote/admin-quotes` | Admin-only |
| `quote/my-quotes` | Seller-scoped read |
| `reputation` | Internal |
| `seller-product/product-analytics` | Seller-scoped |
| `seller-product/product-export` | Seller-scoped |
| `sms` | Admin-only |
| `storage` | Internal |
| `territory-intelligence` | Admin-only |
| `executive-intelligence/alert-engine` | SUPER_ADMIN only |
| `executive-intelligence/correlation-engine` | SUPER_ADMIN only |
| `executive-intelligence/kpi-catalog` | SUPER_ADMIN only |
| `executive-intelligence/unified-health` | SUPER_ADMIN only |
| `ai/catalog-admin` | Admin-only |
| `ai/catalog-quality` | Admin-only |
| `ai/commerce-intelligence` | Admin-only |
| `ai/product-completeness` | Admin-only |

### Medium Priority (33 — could benefit from throttling)
| Controller | Rationale |
|---|---|
| `beta-program/*` (6) | Beta access — limited users, moderate risk |
| `category-templates` | Template CRUD, write operations |
| `communication/label` | Label CRUD |
| `communication/template` | Template CRUD |
| `company-locations` | Write operations |
| `manual-payment` | Financial operations |
| `onboarding` | Write operations, user data |
| `organizations` | Write operations |
| `product-attributes` | Write operations |
| `product-claims` | Claims (write) |
| `product-location/product-location` | Write operations |
| `product-location/product-location-management` | Admin write |
| `profile-completion` | Profile updates |
| `tradgo` | Trade operations |
| `tradmatch` | Trade matching |
| `users` | User management |

---

## @SkipThrottle() Controllers (0)

No controllers use `@SkipThrottle()`.

---

## Health Endpoints

The health controller (`health.controller.ts`) was found in a prior audit to use `@SkipThrottle()` but was not found in this module scan (likely in `apps/api/src/health/`, not under `modules/`).

---

## Inconsistencies Discovered

1. **`admin-advertising` now properly throttled** (was unprotected, fixed in Sprint 1.3B)
2. **`products/search` uses method-level 60/min** — class-level MARKETPLACE_READ (60) was added in 1.3B, same limit, no conflict
3. **`categories`, `industries`, `companies` have mixed limits** — class-level at 60, but some public methods override to 30 (tight) via method-level
4. **Beta controllers (6) have zero throttle** — these are invite-gated but could be abused if link leaks
5. **Mismatched import patterns**: 47 controllers use `RateLimits` constants; 69 use inline `{ default: { limit: X, ttl: 60000 } }` objects

---

## Recommendations

1. **Method-level-only controllers (8)**: Consider migrating existing inline method throttles to class-level + override pattern for consistency
2. **Beta controllers (6)**: Add light throttling (60/min) as defense-in-depth
3. **Remaining 33 medium-priority**: Review for Sprint 1.4 if desired
4. **Standardize imports**: Migrate remaining 69 inline decorators to use `RateLimits` constants (low priority, cosmetic)

---

## Appendix: Coverage by Module Domain

| Domain | Total | Throttled | % | Unthrottled |
|---|---|---|---|---|
| Admin/Intelligence | 12 | 8 | 67% | 4 |
| AI | 10 | 7 | 70% | 3 |
| Auth | 1 | 1 | 100% | 0 |
| Beta | 6 | 0 | 0% | 6 |
| Billing | 2 | 1 | 50% | 1 |
| Buyer | 7 | 7 | 100% | 0 |
| Campaign | 1 | 1 | 100% | 0 |
| Categories | 1 | 1 | 100% | 0 |
| Communication | 5 | 4 | 80% | 1 |
| Companies | 2 | 2 | 100% | 0 |
| CRM | 11 | 10 | 91% | 1 |
| Enterprise Catalog | 6 | 2 | 33% | 4 |
| Finance | 6 | 6 | 100% | 0 |
| GOCASH | 4 | 3 | 75% | 1 |
| Membership | 2 | 2 | 100% | 0 |
| Products | 7 | 5 | 71% | 2 |
| Seller | 5 | 5 | 100% | 0 |
| Smart Modules | 6 | 6 | 100% | 0 |
| Support | 1 | 1 | 100% | 0 |
| TradeServ | 7 | 7 | 100% | 0 |
| TradeTalk | 3 | 3 | 100% | 0 |
| TradFind | 2 | 2 | 100% | 0 |
| Others | 45 | 18 | 40% | 27 |
| **Total** | **170** | **116** | **68%** | **54** |
