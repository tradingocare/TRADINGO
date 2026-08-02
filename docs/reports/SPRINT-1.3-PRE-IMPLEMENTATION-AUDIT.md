# Sprint 1.3 — Rate Limit Hardening: Pre-Implementation Audit

## Objective
Audit all 174 API controllers to determine which need custom `@Throttle()` decorators. No code will be modified during this audit.

---

## 1. Current Global Throttler Configuration

**File:** `apps/api/src/app.module.ts:153-155`

```typescript
ThrottlerModule.forRootAsync({
  storage: new RedisThrottlerStorage(redisService),
  throttlers: [{ limit: 100, ttl: 60000 }],   // 100 req/min per IP/user
});
```

**Storage:** Custom `RedisThrottlerStorage` using Redis prefix `throttler:` — distributed, survives restarts.

**Default:** 100 requests per 60 seconds = ~1.67 req/s. This is generous for most endpoints but too permissive for auth, write operations, and external-facing APIs.

---

## 2. Controller Census

| Metric | Count |
|--------|-------|
| Total controller files | **174** |
| With custom `@Throttle()` decorator | **76 (43.7%)** |
| With `@SkipThrottle()` only | **1 (0.6%)** |
| **No custom throttle (global 100/min)** | **97 (55.7%)** |

---

## 3. Controllers Already Using @Throttle() (76 Controllers)

These controllers already have custom rate limits and require NO changes:

| Controller | Limit | Controller | Limit |
|---|---|---|---|
| admin-agent | 60/min | admin-intelligence/ai-admin | 30/min |
| advertising | 30/min | ai/ai-bulk | 10/min |
| ai/ai-product-intelligence | 30/min | ai-federation/federation | 20/60 |
| ai-gateway/admin | 60/min | ai-gateway | 30/min |
| ai-orchestrator | 30/min | ai-runtime | 20/min |
| analytics (method) | 30-60/min | auth (all methods) | 3-20/min |
| billing | 30/min | buyer-agent | 60/min |
| campaign | 30/min | categories (method) | 30-60/min |
| certifications | 20/min | commission | 30/min |
| community-agent | 60/min | companies (method) | 30-60/min |
| company-verification | 10/min | crm/ai-crm | 30/min |
| crm/crm (method) | 30/min | crm/public-crm (method) | 3/min |
| dispute | 20/min | enterprise-catalog/search | 30/min |
| enterprise-intelligence | 60/min | escrow | 30/min |
| executive-agent | 30/min | executive-intelligence | 30/min |
| finance/aggregator (method) | 5/min | finance/ai-finance | 30/min |
| gallery | 20/min | gocash | 30/min |
| gocash-ecosystem | 30/min | gocash-integration | 20/min |
| growth-intelligence | 60/min | industries (method) | 30-60/min |
| location-intelligence | 30/min | marketplace-intelligence | 30/min |
| near-me | 60/min | notification (method) | 10/min |
| payment | 30/min | payment-admin | 120/min |
| payment-subscription | 10/min | payment-webhook | 60/min |
| payout | 30/min | payout-admin | 120/min |
| products (method) | 60/min | professional-agent | 60/min |
| quote/ai-quote | 30/min | referral | 20/min |
| refund-engine (method) | 10-30/min | seller-agent | 60/min |
| seller-product/bulk | 10/min | seller-product | 30/min |
| settlement | 30/min | smart-negotiation/ai | 30/min |
| support (method) | 10-20/min | tracking (method) | 60/min |
| tradeserv/ai | 30/min | tradeserv-admin | 120/min |
| tradeserv-booking | 20/min | tradeserv-inquiry | 30/min |
| tradeserv-proposal | 30/min | tradeserv-search | 60/min |
| tradeserv | 30/min | tradetalk/ai | 20/min |
| tradetalk-admin | 120/min | tradetalk | 10-60/min |
| tradfind/ai-search | 30/min | tradfind (methods) | 30-60/min |
| tradtrust | 60/min | user-verification | 10/min |
| vendor-codes | 20/min | wallet-api | 10-60/min |

**Observation:** Rate limits are inconsistently formatted — some use `{ default: { limit: X, ttl: 60000 } }` inline objects. No shared constants file exists.

---

## 4. Controllers Using @SkipThrottle() (1 Controller)

| Controller | Reason |
|---|---|
| health.controller.ts | K8s liveness/readiness probes must never be throttled |

**No changes needed.** Correctly configured.

---

## 5. Controllers WITHOUT Custom Throttle (97 Controllers)

These fall back to the global default of **100 req/min**. Each is classified by traffic profile and assigned a priority for adding custom throttles.

### 5A. HIGH Priority — Public-Facing / Security-Sensitive

Controllers exposing public write endpoints, search, or authentication-adjacent operations:

| Controller | Risk | Recommended Limit | Rationale |
|---|---|---|---|
| `chat/chat.controller.ts` | Public chat — spam vector | **30/min** | Message sending needs rate limiting |
| `communication/conversation.controller.ts` | Conversation creation | **30/min** | Spam prevention |
| `communication/message.controller.ts` | Message sending | **30/min** | Spam prevention |
| `communication/moderation.controller.ts` | Content moderation | **30/min** | Abuse potential |
| `buyer/requirement.controller.ts` | Buyer req creation | **30/min** | Public POST endpoint |
| `rfq/rfq.controller.ts` | RFQ creation | **30/min** | Business-critical POST |
| `quote/quote.controller.ts` | Quote creation | **30/min** | Business-critical POST |
| `smart-rfq/smart-rfq.controller.ts` | Smart RFQ | **30/min** | Business-critical |
| `smart-negotiation/smart-negotiation.controller.ts` | Negotiation | **30/min** | Business-critical |
| `smart-order/smart-order.controller.ts` | Orders | **30/min** | Business-critical POST |
| `smart-po/smart-po.controller.ts` | Purchase orders | **30/min** | Business-critical POST |
| `smart-delivery/smart-delivery.controller.ts` | Delivery updates | **30/min** | Business-critical |
| `smart-shipment/smart-shipment.controller.ts` | Shipments | **30/min** | Business-critical |
| `order/order.controller.ts` | Orders | **30/min** | Business-critical |
| `payment/payment-webhook.controller.ts` | **ALREADY 60/min** | — | Already covered |
| `membership/membership.controller.ts` | Subscriptions/payments | **20/min** | Payment-adjacent |
| `membership/membership-admin.controller.ts` | Admin membership | **60/min** | Admin-only, lower risk |

### 5B. MEDIUM Priority — Authenticated Business Operations

Guarded by `JwtAuthGuard` + `RolesGuard` but still write-heavy:

| Controller | Recommended Limit | Rationale |
|---|---|---|
| `seller/seller.controller.ts` | **60/min** | Authenticated but high volume |
| `seller-product/approval.controller.ts` | **30/min** | Write operations |
| `seller-product/brand.controller.ts` | **30/min** | Write operations |
| `seller-product/media-library.controller.ts` | **20/min** | File uploads (resource-heavy) |
| `seller-analytics/seller-analytics.controller.ts` | **30/min** | Analytics queries |
| `buyer/buyer.controller.ts` | **60/min** | Authenticated |
| `buyer/buyer-notification.controller.ts` | **30/min** | Read operations |
| `buyer/buyer-download.controller.ts` | **20/min** | File downloads |
| `buyer/buyer-analytics.controller.ts` | **30/min** | Analytics |
| `buyer/saved-supplier.controller.ts` | **60/min** | Read-heavy |
| `crm/crm-search.controller.ts` | **30/min** | Search (expensive) |
| `crm/crm-timeline.controller.ts` | **30/min** | Read + write |
| `crm/crm-note.controller.ts` | **30/min** | Write operations |
| `crm/crm-follow-up.controller.ts` | **30/min** | Write operations |
| `crm/crm-task.controller.ts` | **30/min** | Write operations |
| `crm/crm-pipeline.controller.ts` | **30/min** | Write operations |
| `crm/crm-report.controller.ts` | **10/min** | Report generation (expensive) |
| `crm/admin-crm.controller.ts` | **60/min** | Admin-only |
| `finance/collections.controller.ts` | **30/min** | Financial operations |
| `finance/credit.controller.ts` | **30/min** | Financial operations |
| `finance/credit-notes.controller.ts` | **30/min** | Financial operations |
| `finance/finance-dashboard.controller.ts` | **30/min** | Dashboard queries |
| `finance/rm-finance.controller.ts` | **30/min** | RM operations |
| `product-attributes/product-attributes.controller.ts` | **30/min** | Write operations |
| `product-claims/product-claims.controller.ts` | **20/min** | Claims (write) |
| `product-location/product-location.controller.ts` | **30/min** | Write operations |
| `product-location/product-location-management.controller.ts` | **30/min** | Admin write |
| `products/products.controller.ts` | **ALREADY 60/min** | — |
| `tradgo/tradgo.controller.ts` | **30/min** | Trade operations |
| `tradmatch/tradmatch.controller.ts` | **30/min** | Trade matching |
| `category-templates/category-templates.controller.ts` | **30/min** | Template operations |
| `users/users.controller.ts` | **30/min** | User management |
| `company-locations/company-locations.controller.ts` | **30/min** | Write operations |
| `manual-payment/manual-payment.controller.ts` | **10/min** | Manual payment (financial) |
| `onboarding/onboarding.controller.ts` | **20/min** | Onboarding |
| `profile-completion/profile-completion.controller.ts` | **20/min** | Profile updates |
| `product-onboarding/product-onboarding.controller.ts` | **20/min** | Product onboarding |
| `organizations/organizations.controller.ts` | **30/min** | Organization management |

### 5C. LOW Priority — Admin/Internal Only

These controllers are guarded by `ADMIN`/`SUPER_ADMIN` roles. The global default of 100/min is acceptable. No changes needed.

| Controller | Rationale |
|---|---|
| `admin-settings/admin-settings.controller.ts` | Admin-only |
| `admin-advertising/admin-advertising.controller.ts` | Admin-only |
| `ai/catalog-admin.controller.ts` | Admin-only |
| `ai/catalog-quality.controller.ts` | Admin-only |
| `ai/commerce-intelligence.controller.ts` | Admin-only |
| `ai/product-completeness.controller.ts` | Admin-only |
| `audit-log/audit-log.controller.ts` | Admin-only |
| `billing-admin/billing-admin.controller.ts` | Admin-only |
| `enterprise-catalog/catalog-admin.controller.ts` | Admin-only |
| `enterprise-catalog/global-brand.controller.ts` | Admin-only |
| `enterprise-catalog/global-attribute.controller.ts` | Admin-only |
| `enterprise-catalog/taxonomy.controller.ts` | Admin-only |
| `executive-intelligence/alert-engine.controller.ts` | SUPER_ADMIN only |
| `executive-intelligence/correlation-engine.controller.ts` | SUPER_ADMIN only |
| `executive-intelligence/kpi-catalog.controller.ts` | SUPER_ADMIN only |
| `executive-intelligence/unified-health.controller.ts` | SUPER_ADMIN only |
| `feature-flags/feature-flag.controller.ts` | Admin-only |
| `founder-ai/founder-ai.controller.ts` | SUPER_ADMIN only |
| `freight-intelligence/freight-intelligence.controller.ts` | Admin-only |
| `gocash-ecosystem/admin-ecosystem.controller.ts` | Admin-only |
| `incident-response/incident-response.controller.ts` | Admin-only |
| `launch/incidents.controller.ts` | Admin-only |
| `launch/launch-checklist.controller.ts` | Admin-only |
| `launch/launch-dashboard.controller.ts` | Admin-only |
| `market-intelligence/market-intelligence.controller.ts` | Admin-only |
| `marketplace-catalog-bridge/marketplace-catalog-bridge.controller.ts` | Admin-only |
| `quote/admin-quotes.controller.ts` | Admin-only |
| `quote/my-quotes.controller.ts` | Seller scoped (read) |
| `reputation/reputation.controller.ts` | Internal |
| `seller-analytics/seller-analytics.controller.ts` | Seller scoped |
| `seller-product/product-analytics.controller.ts` | Seller scoped |
| `seller-product/product-export.controller.ts` | Seller scoped |
| `sms/sms.controller.ts` | Admin-only |
| `storage/storage.controller.ts` | Internal |
| `territory-intelligence/territory-intelligence.controller.ts` | Admin-only |
| `app.controller.ts` | Root only |
| `beta-*` (6 controllers) | Beta program — limited access |
| `catalog-import/catalog-import.controller.ts` | Admin-only |

---

## 6. Recommended RateLimit Constants

**Create file:** `apps/api/src/common/constants/rate-limits.const.ts`

No existing file or directory at this path. No duplication risk.

```typescript
export const RateLimits = {
  // Auth & Identity
  AUTH_LOGIN: { limit: 5, ttl: 60000 },       // Login attempts
  AUTH_REGISTER: { limit: 3, ttl: 60000 },     // Registration
  AUTH_PASSWORD_RESET: { limit: 3, ttl: 60000 }, // Password reset
  AUTH_GENERAL: { limit: 10, ttl: 60000 },     // Other auth ops

  // Search (expensive)
  SEARCH: { limit: 30, ttl: 60000 },
  SEARCH_AI: { limit: 30, ttl: 60000 },

  // Read Operations
  CATALOG_READ: { limit: 60, ttl: 60000 },
  MARKETPLACE_READ: { limit: 60, ttl: 60000 },
  PUBLIC_READ: { limit: 60, ttl: 60000 },

  // Write Operations
  WRITE_GENERAL: { limit: 30, ttl: 60000 },
  WRITE_FINANCIAL: { limit: 10, ttl: 60000 },
  WRITE_CRITICAL: { limit: 20, ttl: 60000 },

  // Business Operations
  RFQ_CREATE: { limit: 30, ttl: 60000 },
  QUOTE_CREATE: { limit: 30, ttl: 60000 },
  ORDER_CREATE: { limit: 30, ttl: 60000 },
  NEGOTIATION: { limit: 30, ttl: 60000 },
  CHAT_MESSAGE: { limit: 30, ttl: 60000 },
  FILE_UPLOAD: { limit: 20, ttl: 60000 },
  REPORT_GENERATE: { limit: 10, ttl: 60000 },

  // Admin
  ADMIN_WRITE: { limit: 60, ttl: 60000 },
  ADMIN_ANALYTICS: { limit: 30, ttl: 60000 },
  SUPER_ADMIN: { limit: 120, ttl: 60000 },

  // AI (expensive + credit-bearing)
  AI_GENERATE: { limit: 30, ttl: 60000 },
  AI_BULK: { limit: 10, ttl: 60000 },

  // Webhooks (higher tolerance)
  WEBHOOK: { limit: 60, ttl: 60000 },

  // Health probes (no throttle)
  HEALTH: null,
} as const;
```

---

## 7. Controllers Requiring Changes

**97 controllers need custom throttles**, but after classification:

| Priority | Controllers | Action |
|----------|-------------|--------|
| **High** | 20 controllers | Add `@Throttle(RateLimits.XXX)` — class-level for security-critical |
| **Medium** | 42 controllers | Add `@Throttle(RateLimits.XXX)` — class-level for authenticated ops |
| **Low** | 35 controllers | **No action** — admin/internal-only, global 100/min is sufficient |

**Controllers to add throttles to in Sprint 1.3: 62 controllers**
**Controllers to leave as-is: 35 controllers + 1 health controller = 36**

---

## 8. Exact Files to Modify

### New file (1):
- `apps/api/src/common/constants/rate-limits.const.ts` — Shared RateLimits constants

### Files to add @Throttle imports + decorators (~62):

**High Priority (20 controllers):**
- `chat/chat.controller.ts`
- `communication/conversation.controller.ts`
- `communication/message.controller.ts`
- `communication/moderation.controller.ts`
- `buyer/requirement.controller.ts`
- `rfq/rfq.controller.ts`
- `quote/quote.controller.ts`
- `smart-rfq/smart-rfq.controller.ts`
- `smart-negotiation/smart-negotiation.controller.ts`
- `smart-order/smart-order.controller.ts`
- `smart-po/smart-po.controller.ts`
- `smart-delivery/smart-delivery.controller.ts`
- `smart-shipment/smart-shipment.controller.ts`
- `order/order.controller.ts`
- `membership/membership.controller.ts`
- `membership/membership-admin.controller.ts`

**Medium Priority (42 controllers):**
- `seller/seller.controller.ts`
- `seller-product/approval.controller.ts`
- `seller-product/brand.controller.ts`
- `seller-product/media-library.controller.ts`
- `seller-analytics/seller-analytics.controller.ts`
- `buyer/buyer.controller.ts`
- `buyer/buyer-notification.controller.ts`
- `buyer/buyer-download.controller.ts`
- `buyer/buyer-analytics.controller.ts`
- `buyer/saved-supplier.controller.ts`
- `crm/crm-search.controller.ts`
- `crm/crm-timeline.controller.ts`
- `crm/crm-note.controller.ts`
- `crm/crm-follow-up.controller.ts`
- `crm/crm-task.controller.ts`
- `crm/crm-pipeline.controller.ts`
- `crm/crm-report.controller.ts`
- `crm/admin-crm.controller.ts`
- `finance/collections.controller.ts`
- `finance/credit.controller.ts`
- `finance/credit-notes.controller.ts`
- `finance/finance-dashboard.controller.ts`
- `finance/rm-finance.controller.ts`
- `product-attributes/product-attributes.controller.ts`
- `product-claims/product-claims.controller.ts`
- `product-location/product-location.controller.ts`
- `product-location/product-location-management.controller.ts`
- `tradgo/tradgo.controller.ts`
- `tradmatch/tradmatch.controller.ts`
- `category-templates/category-templates.controller.ts`
- `users/users.controller.ts`
- `company-locations/company-locations.controller.ts`
- `manual-payment/manual-payment.controller.ts`
- `onboarding/onboarding.controller.ts`
- `profile-completion/profile-completion.controller.ts`
- `product-onboarding/product-onboarding.controller.ts`
- `organizations/organizations.controller.ts`
- `communication/template.controller.ts`
- `communication/label.controller.ts`
- `catalog-import/catalog-import.controller.ts`

---

## 9. Controllers Requiring NO Changes (36 Controllers)

| Reason | Controllers |
|---|---|
| Admin-only (global 100/min sufficient) | admin-settings, audit-log, billing-admin, enterprise-catalog/catalog-admin, enterprise-catalog/global-brand, enterprise-catalog/global-attribute, enterprise-catalog/taxonomy, feature-flags, freight-intelligence, gocash-ecosystem/admin, incident-response, launch/*, market-intelligence, marketplace-catalog-bridge, quote/admin-quotes, sms, storage, territory-intelligence, app, catalog-import |
| SUPER_ADMIN only | executive-intelligence/* (4 controllers), founder-ai |
| Beta (limited access) | beta-* (6 controllers) |
| Already throttled | 76 controllers listed in Section 3 |
| SkipThrottle | health |

---

## 10. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-throttling legitimate users | 429 errors, support tickets | Use 30/min as floor for write endpoints, 60/min for reads |
| Constants file too granular | Cognitive overhead | Keep to 20±5 constants; group by traffic profile not individual endpoint |
| Missing a controller | Continued 100/min default | Controllers without throttles fall back to global default — safe by design |
| Controller file changes cause merge conflicts | CI pipeline fails | Each file change is additive (new import + decorator); no logic changes |
| Breaking existing @Throttle decorators by changing import path | 500 errors | Only add decorators to currently unthrottled controllers; no changes to existing 76 |

---

## 11. Final Implementation Scope

```
Sprint 1.3 — Rate Limit Hardening

Files to create:  1   (rate-limits.const.ts)
Files to modify:  62  (add @Throttle import + class-level decorator)
Files unchanged:  111 (76 already throttled + 1 skip + 34 no-need)

Net increase in custom-throttled controllers: 62
Total after Sprint 1.3: 76 + 62 = 138 of 174 (79.3%) have custom limits
Remaining on global default: 35 (20.1%) — all admin/internal-only
```

---

**Audit complete. No code has been written. Ready for approval.**
