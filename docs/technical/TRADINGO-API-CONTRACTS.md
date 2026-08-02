# TRADINGO API Contracts

**Version**: 1.0
**Status**: Architecture Frozen — Design Specification
**Date**: 2026-07-27
**Classification**: Founder Confidential — API Architecture

---

## TABLE OF CONTENTS

1. API Design Principles
2. Global API Standards
3. Module Contracts
4. AI Contracts
5. Event Contracts
6. Security Standards
7. Versioning Strategy
8. Error Standards
9. Integration Guidelines
10. API Readiness Checklist

---

## 1. API DESIGN PRINCIPLES

### 1.1 Core Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Resource-Oriented** | Every API surface maps to a business resource (User, Order, RFQ, TrustScore). RPC-style actions are exceptional and prefixed with a verb. |
| 2 | **Consistent Naming** | All resources use plural nouns. All operations follow CRUD conventions. Unusual operations use the `/:resource/:id/:action` pattern. |
| 3 | **Versioned from Day One** | All public APIs carry a version prefix. Internal APIs are versioned but may change within the same major version. |
| 4 | **Self-Describing** | Every response includes `_metadata` with requestId, correlationId, and timestamp. APIs document pagination, filtering, and sorting capabilities in response metadata. |
| 5 | **Idempotent Where Required** | Mutating operations that create side effects (payments, escrow, orders) require idempotency keys. Safe operations (GET) are naturally idempotent. |
| 6 | **Context-Aware** | Every authenticated request carries tenant (companyId) and role context. APIs return different data based on authorization. |
| 7 | **Observable by Default** | Every request produces a trace. Every error has a unique identifier. Every mutation is logged to the audit trail. |
| 8 | **Backward Compatible within Major Version** | Adding fields to responses is always allowed. Removing or renaming fields requires a new major version. |
| 9 | **Eventual Consistency for Reads, Strong for Mutations** | Read APIs may return stale data (within SLA). Write APIs guarantee strong consistency on success response. |
| 10 | **Intelligence-Aware** | Every API response may include AI-enriched fields (confidence, recommendations, signals). These are always optional and marked with `ai_` prefix. |

### 1.2 Resource Naming Convention

```
Format: /api/{version}/{domain}/{resource}[/{resourceId}][/{sub-resource}[/{sub-resourceId}]][/{action}]

Examples:
  /api/v1/identity/users/{userId}
  /api/v1/commerce/orders/{orderId}/items
  /api/v1/commerce/rfqs/{rfqId}/ai/supplier-suggestions
  /api/v1/gocash/wallets/{walletId}/transactions
  /api/v1/trust/scores/{companyId}
  /api/v1/ai-gateway/agents/{agentId}/invoke
```

### 1.3 Domain Prefixes

Every module API is grouped under a domain prefix that matches BCA-01 module ownership:

| Domain Prefix | Module | BCA-01 Section |
|--------------|--------|----------------|
| `identity` | Auth / Identity Module | 2.2.1 |
| `trust` | TradTrust / Risk Module | 2.2.2 |
| `commerce` | Commerce & Marketplace | 2.2.3 |
| `finance` | Finance & Payment | 2.2.4 |
| `ai` | AI Platform | 2.2.5 |
| `knowledge` | Knowledge & Data | 2.2.6 |
| `community` | TradeTalk | 2.2.7 |
| `services` | TradeServ | 2.2.8 |
| `enterprise` | Enterprise & Platform | 2.2.9 |
| `membership` | Membership & Subscription | 2.2.10 |
| `support` | Support & Help | 2.2.11 |
| `growth` | Growth & Engagement | 2.2.12 |
| `tradors` | Tradors (Business Graph) | 2.2.13 |
| `workflow` | Automation & Workflow | 2.2.14 |
| `analytics` | Analytics & Insights | 2.2.15 |
| `founder` | Founder Tools | 2.2.16 |

### 1.4 Cross-Cutting Concerns

- **Public APIs**: Prefix `/api/v1/{domain}` — versioned, stable, backward-compatible
- **Internal APIs**: Prefix `/internal/v1/{domain}` — versioned, may change within major
- **Admin APIs**: Prefix `/api/v1/admin/{domain}` — SUPER_ADMIN / ADMIN role required
- **AI APIs**: Prefix `/api/v1/ai/{domain}` — routed through AI Gateway with credit checks
- **Event APIs**: Prefix `/api/v1/events/{domain}` — event publishing endpoints
- **Webhook APIs**: Prefix `/api/v1/webhooks/{domain}` — external event delivery
- **Public endpoints**: No authentication, rate-limited by IP
- **Authenticated endpoints**: JWT required
- **Machine-to-Machine**: API key + JWT (service accounts via Integration Module)

---

## 2. GLOBAL API STANDARDS

### 2.1 HTTP Methods

| Method | Semantic | Idempotent | Safe | Body | Response |
|--------|----------|------------|------|------|----------|
| `GET` | Retrieve resource(s) | ✅ Yes | ✅ Yes | No | 200 / 404 |
| `POST` | Create resource or execute action | ❌ No (unless idempotency key) | ❌ No | Yes | 201 / 202 |
| `PUT` | Full replace of resource | ✅ Yes | ❌ No | Yes | 200 / 204 |
| `PATCH` | Partial update of resource | ✅ Conditional | ❌ No | Yes | 200 |
| `DELETE` | Remove resource | ✅ Yes | ❌ No | Optional | 200 / 204 |

### 2.2 URI Conventions

```
# Collection
GET    /api/v1/{domain}/{resource}
POST   /api/v1/{domain}/{resource}

# Single resource
GET    /api/v1/{domain}/{resource}/{id}
PUT    /api/v1/{domain}/{resource}/{id}
PATCH  /api/v1/{domain}/{resource}/{id}
DELETE /api/v1/{domain}/{resource}/{id}

# Sub-resource collection
GET    /api/v1/{domain}/{resource}/{id}/{sub-resource}
POST   /api/v1/{domain}/{resource}/{id}/{sub-resource}

# Actions (non-CRUD operations)
POST   /api/v1/{domain}/{resource}/{id}/{action}
GET    /api/v1/{domain}/{resource}/{id}/{action}

# Bulk operations
POST   /api/v1/{domain}/{resource}/bulk
POST   /api/v1/{domain}/{resource}/bulk/{action}

# Search
POST   /api/v1/{domain}/{resource}/search  (complex queries as POST)
GET    /api/v1/{domain}/{resource}/search  (simple queries as GET)

# AI augmentation (always POST, always through AI Gateway)
POST   /api/v1/{domain}/{resource}/{id}/ai/{action}

# Events
POST   /api/v1/events/{domain}/{event-type}
POST   /api/v1/events/webhook/{domain}/{subscription-id}
```

### 2.3 Standard Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | integer | Page number (1-indexed) | `page=1` |
| `limit` | integer | Items per page (default 20, max 100) | `limit=50` |
| `cursor` | string | Cursor for key-based pagination | `cursor=eyJpZCI6MTIzfQ==` |
| `sort` | string | Sort field and direction | `sort=createdAt:desc,amount:asc` |
| `filter` | string | Filter expression (see 2.8) | `filter=status:eq:active` |
| `search` | string | Full-text search query | `search=industrial+pump` |
| `q` | string | Quick search (simple query string) | `q=supplier+mumbai` |
| `fields` | string | Sparse fieldset | `fields=id,name,tradTrustScore` |
| `include` | string | Include related resources | `include=company,products` |
| `expand` | string | Expand nested resources | `expand=items.product` |
| `locale` | string | Response language | `locale=en-IN` |

### 2.4 Standard Response Envelope

All API responses follow a consistent envelope:

```json
{
  "_metadata": {
    "requestId": "req_a1b2c3d4",
    "correlationId": "corr_e5f6g7h8",
    "domain": "commerce",
    "timestamp": "2026-07-27T10:30:00.000Z",
    "version": "1.0",
    "processingTimeMs": 45,
    "traceId": "trace_i9j0k1l2"
  },
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": false
    },
    "sort": {
      "field": "createdAt",
      "direction": "desc"
    },
    "filter": {
      "applied": "status:eq:active"
    }
  },
  "included": { ... },
  "ai": {
    "recommendations": [ ... ],
    "confidence": 0.87,
    "agentId": "buyer-ai-v2",
    "explanation": "Recommended based on transaction history and TradTrust score"
  }
}
```

### 2.5 Pagination

Two pagination methods are supported. APIs specify which they use in response metadata.

#### Cursor Pagination (Preferred for lists)

```json
{
  "meta": {
    "pagination": {
      "type": "cursor",
      "nextCursor": "eyJpZCI6MTUwLCJjcmVhdGVkQXQiOiIyMDI2LTA3LTI3VDEwOjMwOjAwWiJ9",
      "hasMore": true
    }
  },
  "data": [ ... ]
}
```

**Request:** `GET /api/v1/{domain}/{resource}?cursor={cursor}&limit=20`
**Rules:**
- Cursor encodes last item's sort key(s)
- Sorting must be stable (primary sort on unique field)
- Sort field must match cursor encoding
- Default sort is `createdAt:desc` unless specified
- Cursor expires after 24 hours (stale cursor returns error)

#### Offset Pagination (Fallback — admin/export endpoints)

```json
{
  "meta": {
    "pagination": {
      "type": "offset",
      "page": 2,
      "limit": 50,
      "total": 1234,
      "totalPages": 25,
      "hasNext": true,
      "hasPrevious": true
    }
  },
  "data": [ ... ]
}
```

**Rules:**
- Page is 1-indexed
- Maximum page number is 10,000 (query beyond this requires cursor)
- Maximum limit is 100 (use export API for larger datasets)
- Total count is an estimate beyond 10,000 records

### 2.6 Filtering

Filter expression syntax for the `filter` query parameter:

```
Format: {field}:{operator}:{value}[,{field}:{operator}:{value}]

Operators:
  eq          Equal to                    status:eq:active
  neq         Not equal to                status:neq:cancelled
  gt          Greater than                amount:gt:50000
  gte         Greater than or equal       amount:gte:100000
  lt          Less than                   amount:lt:5000
  lte         Less than or equal          amount:lte:10000
  in          In list                     status:in:active,pending,suspended
  nin         Not in list                 status:nin:deleted,archived
  contains    Contains string             name:contains:pump
  startswith  Starts with                 name:startswith:indus
  endswith    Ends with                   name:endswith:parts
  between     Between two values          amount:between:10000,50000
  exists      Field exists                description:exists:true
  isNull      Field is null               deletedAt:isNull:true

Logical grouping (double pipe = AND, comma = OR):
  status:eq:active||tier:gte:3          (status = active AND tier >= 3)
  status:eq:active,status:eq:pending    (status = active OR status = pending)

Nested field access:
  company.address.city:eq:Mumbai
  product.attributes.weight:gte:100
```

### 2.7 Sorting

```
Format: {field}:{direction}[,{field}:{direction}]

Default: createdAt:desc

Examples:
  sort=name:asc
  sort=tradTrustScore:desc,createdAt:asc
  sort=amount:desc

Rules:
  - First sort field must be unique or paired with ID field for stable pagination
  - Maximum 3 sort fields
  - Only indexed fields may be used as sort keys
```

### 2.8 Sparse Fieldsets

```
Format: fields={field1},{field2},{field3}

Examples:
  fields=id,name,tradTrustScore
  fields=id,company.name,company.tradTrustScore

Rules:
  - ID is always included regardless of fields parameter
  - Nested fields accessible via dot notation
```

### 2.9 Standard Status Codes

| Code | Description | When to Use |
|------|-------------|-------------|
| `200 OK` | Successful response | GET, PATCH, PUT, DELETE |
| `201 Created` | Resource created | POST |
| `202 Accepted` | Async operation started | Long-running jobs |
| `204 No Content` | Success, no body | DELETE |
| `301 Moved Permanently` | Resource moved | URL changes |
| `400 Bad Request` | Validation error | Invalid input |
| `401 Unauthorized` | Not authenticated | Missing/invalid JWT |
| `402 Payment Required` | Credits exhausted | AI credit limit hit |
| `403 Forbidden` | Not authorized | Insufficient role/permission |
| `404 Not Found` | Resource not found | Invalid ID |
| `405 Method Not Allowed` | Wrong HTTP method | POST on read-only resource |
| `409 Conflict` | Version conflict | Stale ETag, duplicate idempotency key |
| `410 Gone` | Resource deleted | Expired resource |
| `412 Precondition Failed` | Condition not met | ETag mismatch |
| `422 Unprocessable Entity` | Business rule violation | Domain validation failure |
| `429 Too Many Requests` | Rate limit exceeded | Retry-After header included |
| `500 Internal Server Error` | Unexpected error | Always log and return requestId |
| `502 Bad Gateway` | Upstream failure | External service unavailable |
| `503 Service Unavailable` | Temporary outage | Maintenance, overload |
| `504 Gateway Timeout` | Upstream timeout | External service timeout |

### 2.10 Error Model (RFC 7807 Problem Details)

All errors follow [RFC 7807](https://tools.ietf.org/html/rfc7807) Problem Details:

```json
{
  "type": "https://api.tradingo.io/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "The request body contains invalid fields",
  "instance": "/api/v1/commerce/orders",
  "requestId": "req_a1b2c3d4",
  "correlationId": "corr_e5f6g7h8",
  "timestamp": "2026-07-27T10:30:00.000Z",
  "errors": [
    {
      "field": "items[0].quantity",
      "message": "Quantity must be at least 1",
      "code": "MIN_VIOLATION",
      "value": 0,
      "constraints": { "min": 1 }
    },
    {
      "field": "payment.method",
      "message": "Unsupported payment method for this transaction value",
      "code": "UNSUPPORTED_PAYMENT_METHOD",
      "value": "COD"
    }
  ]
}
```

**Standard Error Types:**

| Type URI | Title | When |
|----------|-------|------|
| `/errors/validation-error` | Validation Error | 400, 422 |
| `/errors/authentication-error` | Authentication Error | 401 |
| `/errors/authorization-error` | Authorization Error | 403 |
| `/errors/not-found` | Not Found | 404 |
| `/errors/conflict` | Conflict | 409 |
| `/errors/rate-limit` | Rate Limit Exceeded | 429 |
| `/errors/credit-exhausted` | AI Credits Exhausted | 402 |
| `/errors/idempotency-conflict` | Idempotency Key Conflict | 409 |
| `/errors/business-rule-violation` | Business Rule Violation | 422 |
| `/errors/dependency-failure` | Dependency Failure | 502, 504 |
| `/errors/internal-error` | Internal Error | 500 |

### 2.11 Request ID, Correlation ID, and Tracing

| Header | Format | Required | Description |
|--------|--------|----------|-------------|
| `X-Request-ID` | `req_[a-z0-9]{16}` | Generated by server | Unique request identifier |
| `X-Correlation-ID` | `corr_[a-z0-9]{16}` | Generated by server | Links related requests across services |
| `X-Trace-ID` | `trace_[a-z0-9]{16}` | Optional (client sets) | End-to-end trace across distributed systems |
| `X-Span-ID` | `span_[a-z0-9]{16}` | Generated per hop | Identifies individual service hop |
| `traceparent` | W3C Trace Context | Optional | W3C distributed tracing standard |
| `tracestate` | W3C Trace Context | Optional | W3C vendor-specific trace data |

**Rules:**
- Server generates `X-Request-ID` if client does not provide
- Client should set `X-Correlation-ID` at entry point; server propagates it
- All responses include `X-Request-ID` header
- All error responses include `requestId` and `correlationId` in body
- Tracing headers propagated across all internal service calls

### 2.12 Idempotency Keys

Mutating operations that create side effects (POST, PATCH to state-changing resources) support idempotency keys.

| Header | Format | Required | Description |
|--------|--------|----------|-------------|
| `Idempotency-Key` | `[a-f0-9-]{36}` (UUID v4) | Required for payments, escrow, orders | Uniquely identifies the operation |

**Rules:**
- Idempotency key is stored for 24 hours
- Same key + same request payload → return original response (201 or conflict)
- Same key + different request payload → `409 Conflict` error
- Same key after expiry → treated as new request
- GET/DELETE/PUT are naturally idempotent (keys not required)
- AI API calls should use idempotency keys for credit-sensitive operations

### 2.13 Rate Limits

| Tier | Public Endpoints | Authenticated | AI API | Admin API |
|------|-----------------|---------------|--------|-----------|
| **Anonymous** | 10 req/min | — | — | — |
| **Authenticated** | — | 100 req/min | 20 req/min | — |
| **AI Agent** | — | — | 60 req/min per agent | — |
| **Admin** | — | — | — | 200 req/min |
| **Webhook (inbound)** | — | 500 req/min | — | — |
| **Integration (M2M)** | — | 300 req/min per key | 100 req/min | 50 req/min |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1698400000
Retry-After: 45
```

### 2.14 API Versioning

| Aspect | Policy |
|--------|--------|
| **Version format** | `v{major}` (e.g., `v1`, `v2`) |
| **Location** | URL prefix: `/api/v1/{domain}/...` |
| **Major versions** | Breaking changes only (field removal, endpoint removal, request schema breakage) |
| **Minor changes** | Backward-compatible additions within major version (new fields, new endpoints) |
| **Deprecation notice** | Minimum 90 days before major version removal |
| **Sunset header** | `Sunset: Sat, 27 Oct 2026 00:00:00 GMT` on deprecated endpoints |
| **Migration header** | `Deprecation: true` on deprecated endpoints |
| **Supported versions** | Current major + 1 previous major version |
| **Internal APIs** | No deprecation guarantee; change with notice |
| **Beta APIs** | `/api/v1/beta/{domain}/...` — may change without notice |

### 2.15 Deprecation Strategy

```
Phase 1 — Announcement (T-90 days)
  ├── Add `Deprecation: true` header to deprecated endpoints
  ├── Add `Sunset` header with removal date
  ├── Update API documentation
  └── Notify all API consumers (in-app + email)

Phase 2 — Soft Deprecation (T-60 days)
  ├── Log warnings on deprecated endpoint usage
  ├── Block automated tests from using deprecated endpoints
  └── Publish migration guide

Phase 3 — Hard Deprecation (T-30 days)
  ├── Return warning in response body:
  │   "warning": "This endpoint is deprecated. Use /api/v2/... instead."
  └── Alert contacted API consumers without migration

Phase 4 — Removal (T-0)
  ├── Return 410 Gone with migration instructions
  ├── Remove from documentation
  └── Archived in version history
```

### 2.16 Standard Headers

| Request Header | Description | Required |
|----------------|-------------|----------|
| `Authorization` | `Bearer {jwt}` | For authenticated endpoints |
| `X-API-Key` | `{api-key}` | For M2M integrations |
| `Idempotency-Key` | UUID v4 | For mutating operations |
| `X-Correlation-ID` | Correlation identifier | Recommended |
| `X-Trace-ID` | Trace identifier | Optional |
| `Accept` | `application/json` | Default |
| `Content-Type` | `application/json` | For requests with body |
| `Accept-Language` | `en-IN`, `hi-IN`, etc. | Locale selection |
| `If-Match` | ETag value | Conditional requests |
| `If-None-Match` | ETag value | Conditional requests |

| Response Header | Description |
|----------------|-------------|
| `X-Request-ID` | Unique request identifier |
| `X-Correlation-ID` | Correlation identifier |
| `X-Trace-ID` | Trace identifier |
| `X-RateLimit-Limit` | Rate limit ceiling |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Rate limit reset timestamp |
| `Retry-After` | Seconds to wait before retry |
| `ETag` | Resource version for caching |
| `Deprecation` | `true` if endpoint is deprecated |
| `Sunset` | UTC timestamp of removal |
| `Cache-Control` | Caching policy |

---

## 3. MODULE CONTRACTS

### 3.1 Identity & Profile (Auth Module)

**Purpose**: Registration, authentication, authorization, session management, profile management.
**Owner**: Auth Module (BCA-01 2.2.1)
**System of Record**: Auth / Identity Database

#### Public APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/identity/auth/register` | Register new user + company | Public |
| POST | `/api/v1/identity/auth/login` | Login with credentials | Public |
| POST | `/api/v1/identity/auth/social-login` | Login via OAuth provider | Public |
| POST | `/api/v1/identity/auth/refresh` | Refresh access token | Public (with refresh token) |
| POST | `/api/v1/identity/auth/logout` | Invalidate session | JWT |
| POST | `/api/v1/identity/auth/forgot-password` | Request password reset | Public |
| POST | `/api/v1/identity/auth/reset-password` | Reset password with token | Public (with reset token) |
| POST | `/api/v1/identity/auth/change-password` | Change password (authenticated) | JWT |
| POST | `/api/v1/identity/auth/verify-email` | Verify email address | Public (with token) |
| POST | `/api/v1/identity/auth/verify-mobile` | Verify mobile number | JWT |
| POST | `/api/v1/identity/auth/send-otp` | Send OTP for verification | Public (rate-limited) |

#### Resoures

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/identity/users/me` | Get current user profile | JWT |
| PATCH | `/api/v1/identity/users/me` | Update current user profile | JWT |
| GET | `/api/v1/identity/users/{userId}` | Get user by ID | JWT (ADMIN or self) |
| GET | `/api/v1/identity/users` | List users (admin) | JWT + ADMIN |
| DELETE | `/api/v1/identity/users/{userId}` | Delete user (soft delete) | JWT + ADMIN |

#### Company Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/identity/companies` | Register company | JWT |
| GET | `/api/v1/identity/companies/{companyId}` | Get company profile | JWT |
| PATCH | `/api/v1/identity/companies/{companyId}` | Update company profile | JWT (company member) |
| GET | `/api/v1/identity/companies/my-company` | Get current user's company | JWT |
| GET | `/api/v1/identity/companies` | List companies (admin) | JWT + ADMIN |

#### Session Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/identity/sessions` | List active sessions | JWT |
| DELETE | `/api/v1/identity/sessions/{sessionId}` | Invalidate session | JWT |
| DELETE | `/api/v1/identity/sessions` | Invalidate all sessions | JWT |

#### Role & Permission Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/identity/roles` | List roles | JWT + ADMIN |
| POST | `/api/v1/identity/roles` | Create role | JWT + ADMIN |
| PATCH | `/api/v1/identity/roles/{roleId}` | Update role | JWT + ADMIN |
| DELETE | `/api/v1/identity/roles/{roleId}` | Delete role | JWT + ADMIN |
| POST | `/api/v1/identity/users/{userId}/roles` | Assign role to user | JWT + ADMIN |
| DELETE | `/api/v1/identity/users/{userId}/roles/{roleId}` | Remove role from user | JWT + ADMIN |

#### Verification Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/identity/verifications` | Submit verification request | JWT |
| GET | `/api/v1/identity/verifications` | List verification requests | JWT |
| GET | `/api/v1/identity/verifications/{verificationId}` | Get verification details | JWT |
| POST | `/api/v1/identity/verifications/{verificationId}/review` | Approve/reject verification | JWT + ADMIN |

#### Internal APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/internal/v1/identity/users/{userId}` | Get user (full data) | Internal (service token) |
| GET | `/internal/v1/identity/companies/{companyId}` | Get company (full data) | Internal (service token) |
| POST | `/internal/v1/identity/auth/validate-token` | Validate JWT and return claims | Internal |
| POST | `/internal/v1/identity/auth/exchange-service-token` | Exchange API key for service token | Internal |
| GET | `/internal/v1/identity/users/by-email/{email}` | Resolve user by email | Internal |
| GET | `/internal/v1/identity/companies/by-tax-id/{taxId}` | Resolve company by tax ID | Internal |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/identity/users/{userId}/ai/risk-profile` | AI-assisted user risk assessment | JWT + ADMIN |
| POST | `/api/v1/identity/companies/{companyId}/ai/verification-assist` | AI-assisted verification guidance | JWT + ADMIN |
| POST | `/api/v1/identity/auth/ai/smart-otp` | AI-determined OTP delivery channel | JWT |

#### Event APIs (Produced)

| Event | Trigger | Schema |
|-------|---------|--------|
| `registration.started` | Registration form opened | `{ userId, channel, referrer }` |
| `registration.completed` | Registration submitted | `{ userId, companyId, role, industry, location }` |
| `profile.updated` | Profile changed | `{ userId, changedFields, previousValues }` |
| `company.verified` | Company verification approved | `{ companyId, verificationLevel, documents }` |
| `company.kyc_submitted` | KYC documents uploaded | `{ companyId, documentTypes }` |
| `company.kyc_approved` | KYC approved | `{ companyId, verifier, level }` |
| `company.kyc_rejected` | KYC rejected | `{ companyId, reason, resubmissionCount }` |
| `user.role_changed` | User role updated | `{ userId, previousRole, newRole }` |
| `user.session_created` | New session started | `{ userId, device, ip }` |
| `user.sessions_revoked` | Sessions invalidated | `{ userId, count }` |

#### Auth & Validation Rules

| Rule | Value |
|------|-------|
| Password min length | 8 characters |
| Password complexity | At least 1 uppercase, 1 lowercase, 1 number |
| Email verification | Required within 7 days of registration |
| Mobile verification | Required for seller accounts |
| JWT expiry (access) | 15 minutes |
| JWT expiry (refresh) | 7 days (configurable per plan) |
| Refresh token rotation | Yes (old token invalidated on refresh) |
| Session limit | 10 concurrent sessions per user |
| Rate limit (login) | 5 attempts per minute per IP |
| Rate limit (register) | 3 registrations per hour per IP |
| Rate limit (OTP send) | 3 OTPs per phone per hour |
| Idempotency | Required for registration (to prevent duplicate accounts) |

### 3.2 Trust & Safety (TradTrust Module)

**Purpose**: Multi-dimensional trust scoring, risk assessment, fraud detection, identity verification.
**Owner**: TradTrust Module (BCA-01 2.2.2)
**System of Record**: Trust Database

#### Public APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/trust/scores/{companyId}` | Get trust score | JWT |
| GET | `/api/v1/trust/scores/{companyId}/history` | Get score history | JWT |
| GET | `/api/v1/trust/scores/{companyId}/dimensions` | Get dimension breakdowns | JWT |
| GET | `/api/v1/trust/scores/batch` | Batch score lookup (up to 100) | JWT |

#### Risk Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/trust/risk/assess` | Assess transaction risk | JWT |
| GET | `/api/v1/trust/risk/alerts` | List risk alerts | JWT + ADMIN |
| POST | `/api/v1/trust/risk/alerts/{alertId}/resolve` | Resolve risk alert | JWT + ADMIN |
| GET | `/api/v1/trust/risk/summary` | Risk summary for company | JWT |

#### Fraud Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/trust/fraud/report` | Report suspicious activity | JWT |
| GET | `/api/v1/trust/fraud/cases` | List fraud cases | JWT + ADMIN |
| POST | `/api/v1/trust/fraud/cases/{caseId}/review` | Review fraud case | JWT + ADMIN |
| GET | `/api/v1/trust/fraud/signals/{companyId}` | Get fraud signals | JWT + ADMIN |

#### Compliance Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/trust/compliance/status/{companyId}` | Compliance status | JWT |
| POST | `/api/v1/trust/compliance/check` | Check compliance for transaction | JWT |
| GET | `/api/v1/trust/compliance/requirements/{jurisdiction}` | List compliance requirements | Public |

#### Dispute Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/trust/disputes` | File a dispute | JWT |
| GET | `/api/v1/trust/disputes/{disputeId}` | Get dispute details | JWT (participant) |
| GET | `/api/v1/trust/disputes` | List disputes | JWT |
| POST | `/api/v1/trust/disputes/{disputeId}/evidence` | Submit evidence | JWT |
| POST | `/api/v1/trust/disputes/{disputeId}/resolve` | Resolve dispute (admin) | JWT + ADMIN |

#### Internal APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/internal/v1/trust/scores/{companyId}/full` | Full score with signals | Internal |
| POST | `/internal/v1/trust/score/refresh` | Trigger score recalculation | Internal |
| POST | `/internal/v1/trust/risk/evaluate` | Evaluate risk for transaction | Internal |
| POST | `/internal/v1/trust/fraud/scan` | Scan transaction for fraud | Internal |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/trust/scores/{companyId}/ai/predict` | AI-predicted trust for new entities | JWT |
| POST | `/api/v1/trust/fraud/ai/detect` | AI-enhanced fraud detection | JWT |
| POST | `/api/v1/trust/disputes/{disputeId}/ai/recommend` | AI-recommended resolution | JWT + ADMIN |

#### Event APIs (Produced)

| Event | Trigger | Schema |
|-------|---------|--------|
| `trust.score_updated` | Trust score recalculated | `{ companyId, newScore, changedDimensions }` |
| `trust.signal_added` | New trust signal collected | `{ companyId, signalType, value, evidence }` |
| `trust.signal_removed` | Trust signal expired/removed | `{ companyId, signalType, reason }` |
| `risk.alert_triggered` | Risk threshold exceeded | `{ companyId, riskType, severity, entities }` |
| `risk.alert_resolved` | Risk alert resolved | `{ alertId, resolution, actions }` |
| `fraud.suspected` | Potential fraud detected | `{ transactionId, reason, signals }` |
| `fraud.confirmed` | Fraud confirmed | `{ caseId, impact, action }` |
| `fraud.false_positive` | Fraud alert was false | `{ caseId, correctionSignal }` |
| `dispute.filed` | Dispute created | `{ disputeId, orderId, amount, reason }` |
| `dispute.resolved` | Dispute resolved | `{ disputeId, resolution, outcome }` |

#### Dimension Model

The TradTrust score is computed from 16 dimensions per FAS-01 4.6.1 and IAS-01 10.2:

| Dimension | Weight | Source |
|-----------|--------|--------|
| Transaction Volume | 8% | Order history |
| Transaction Consistency | 8% | Order regularity |
| Delivery Performance | 10% | On-time + quality delivery rate |
| Quality Consistency | 10% | Product/service quality over time |
| Payment Behaviour | 10% | On-time payment rate |
| Communication Responsiveness | 5% | Response rate and time |
| Verification Level | 8% | KYC/KYB depth |
| Dispute History | 8% | Dispute rate and resolution |
| Network Quality | 5% | Quality of business relationships |
| Longevity | 5% | Platform tenure |
| Complaint Record | 5% | Complaint frequency and handling |
| Certification Status | 5% | Active certifications |
| Financial Health | 5% | Payment and credit behaviour |
| Compliance Record | 3% | Regulatory compliance |
| Platform Engagement | 3% | Feature adoption and activity |
| AI-Trust Score | 2% | ML-predicted trust for new entities |

#### Score Ranges

| Range | Label | Confidence | Implications |
|-------|-------|------------|-------------|
| 800–950 | Elite | ±15 | Full autonomy, premium features, reduced fees |
| 650–799 | Trusted | ±25 | Standard operations, moderate credit |
| 450–649 | Standard | ±50 | Standard operations, escrow required |
| 250–449 | Developing | ±75 | Limited operations, enhanced scrutiny |
| 0–249 | New | ±100 | Onboarding phase, full escrow, limited features |

### 3.3 Commerce & Marketplace

**Purpose**: Catalog management, product management, RFQ/quotes, negotiation, orders, shipping.
**Owner**: Commerce & Marketplace (BCA-01 2.2.3)
**System of Record**: Product Database, Order Database, RFQ Database, Quote Database

#### Product Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/commerce/products` | List/search products | Public |
| GET | `/api/v1/commerce/products/{productId}` | Get product details | Public |
| POST | `/api/v1/commerce/products` | Create product | JWT (seller) |
| PATCH | `/api/v1/commerce/products/{productId}` | Update product | JWT (owner) |
| DELETE | `/api/v1/commerce/products/{productId}` | Delete product (soft) | JWT (owner) |
| POST | `/api/v1/commerce/products/{productId}/publish` | Publish product | JWT (owner) |
| POST | `/api/v1/commerce/products/{productId}/unpublish` | Unpublish product | JWT (owner) |
| POST | `/api/v1/commerce/products/bulk` | Bulk create/update products | JWT (seller) |
| POST | `/api/v1/commerce/products/bulk/import` | Import products from CSV/XLSX | JWT (seller) |
| GET | `/api/v1/commerce/products/{productId}/quality` | Get product quality score | JWT (owner) |

#### Category Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/commerce/categories` | List categories | Public |
| GET | `/api/v1/commerce/categories/{categoryId}` | Get category tree | Public |
| POST | `/api/v1/commerce/categories` | Create category | JWT + ADMIN |
| PATCH | `/api/v1/commerce/categories/{categoryId}` | Update category | JWT + ADMIN |
| DELETE | `/api/v1/commerce/categories/{categoryId}` | Delete category | JWT + ADMIN |

#### Brand Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/commerce/brands` | List brands | Public |
| GET | `/api/v1/commerce/brands/{brandId}` | Get brand details | Public |
| POST | `/api/v1/commerce/brands` | Register brand | JWT (seller) |
| PATCH | `/api/v1/commerce/brands/{brandId}` | Update brand | JWT (owner) |
| POST | `/api/v1/commerce/brands/{brandId}/verify` | Verify brand | JWT + ADMIN |

#### RFQ Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/commerce/rfqs` | Create RFQ | JWT (buyer) |
| GET | `/api/v1/commerce/rfqs/{rfqId}` | Get RFQ details | JWT (participant) |
| PATCH | `/api/v1/commerce/rfqs/{rfqId}` | Update RFQ | JWT (buyer/owner) |
| GET | `/api/v1/commerce/rfqs` | List RFQs | JWT |
| POST | `/api/v1/commerce/rfqs/{rfqId}/close` | Close RFQ | JWT (buyer/owner) |
| GET | `/api/v1/commerce/rfqs/{rfqId}/quotes` | List quotes for RFQ | JWT (participant) |

#### Quote Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/commerce/quotes` | Create quote | JWT (seller) |
| GET | `/api/v1/commerce/quotes/{quoteId}` | Get quote details | JWT (participant) |
| PATCH | `/api/v1/commerce/quotes/{quoteId}` | Update quote | JWT (seller/owner) |
| GET | `/api/v1/commerce/quotes` | List quotes | JWT |
| POST | `/api/v1/commerce/rfqs/{rfqId}/accept-quote/{quoteId}` | Accept quote | JWT (buyer) |
| POST | `/api/v1/commerce/rfqs/{rfqId}/reject-quote/{quoteId}` | Reject quote | JWT (buyer) |

#### Negotiation Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/commerce/negotiations` | Start negotiation | JWT (participant) |
| GET | `/api/v1/commerce/negotiations/{negotiationId}` | Get negotiation details | JWT (participant) |
| POST | `/api/v1/commerce/negotiations/{negotiationId}/message` | Send negotiation message | JWT (participant) |
| GET | `/api/v1/commerce/negotiations/{negotiationId}/messages` | Get negotiation messages | JWT (participant) |
| POST | `/api/v1/commerce/negotiations/{negotiationId}/accept` | Accept deal | JWT (participant) |
| POST | `/api/v1/commerce/negotiations/{negotiationId}/counter` | Send counter offer | JWT (participant) |
| POST | `/api/v1/commerce/negotiations/{negotiationId}/withdraw` | Withdraw from negotiation | JWT (participant) |

#### Order Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/commerce/orders` | Create order | JWT (buyer) |
| GET | `/api/v1/commerce/orders/{orderId}` | Get order details | JWT (participant) |
| PATCH | `/api/v1/commerce/orders/{orderId}` | Update order | JWT (participant) |
| GET | `/api/v1/commerce/orders` | List orders | JWT |
| POST | `/api/v1/commerce/orders/{orderId}/cancel` | Cancel order | JWT (buyer) |
| POST | `/api/v1/commerce/orders/{orderId}/confirm-delivery` | Confirm delivery | JWT (buyer) |

#### Shipping Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/commerce/shipments` | Create shipment | JWT (seller) |
| GET | `/api/v1/commerce/shipments/{shipmentId}` | Get shipment details | JWT (participant) |
| PATCH | `/api/v1/commerce/shipments/{shipmentId}/track` | Update tracking | JWT (seller) |
| GET | `/api/v1/commerce/shipments/{shipmentId}/track` | Get tracking info | JWT (participant) |

#### Internal APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/internal/v1/commerce/products/{productId}/full` | Full product with all fields | Internal |
| GET | `/internal/v1/commerce/orders/{orderId}/full` | Full order with line items | Internal |
| POST | `/internal/v1/commerce/orders/{orderId}/status` | Update order status | Internal |
| POST | `/internal/v1/commerce/products/{productId}/quality` | Update quality score | Internal |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/commerce/products/{productId}/ai/suggest-category` | AI category suggestion | JWT |
| POST | `/api/v1/commerce/products/{productId}/ai/generate-description` | AI description generation | JWT |
| POST | `/api/v1/commerce/products/{productId}/ai/suggest-attributes` | AI attribute suggestions | JWT |
| POST | `/api/v1/commerce/products/{productId}/ai/translate` | AI translation | JWT |
| POST | `/api/v1/commerce/products/{productId}/ai/suggest-pricing` | AI pricing suggestion | JWT |
| POST | `/api/v1/commerce/rfqs/{rfqId}/ai/improve` | AI RFQ improvement | JWT |
| POST | `/api/v1/commerce/rfqs/{rfqId}/ai/supplier-suggestions` | AI supplier matching | JWT |
| POST | `/api/v1/commerce/rfqs/{rfqId}/ai/price-analysis` | AI price analysis | JWT |
| POST | `/api/v1/commerce/rfqs/{rfqId}/ai/risk-assessment` | AI RFQ risk assessment | JWT |
| POST | `/api/v1/commerce/quotes/{quoteId}/ai/generate` | AI quote generation | JWT |
| POST | `/api/v1/commerce/quotes/{quoteId}/ai/win-probability` | AI win probability | JWT |
| POST | `/api/v1/commerce/quotes/{quoteId}/ai/margin-analysis` | AI margin analysis | JWT |
| POST | `/api/v1/commerce/negotiations/{negotiationId}/ai/strategy` | AI negotiation strategy | JWT |
| POST | `/api/v1/commerce/negotiations/{negotiationId}/ai/suggested-replies` | AI suggested replies | JWT |

#### Event APIs (Produced)

| Event | Trigger | Schema |
|-------|---------|--------|
| `product.created` | Product created | `{ productId, companyId, category, attributes }` |
| `product.updated` | Product updated | `{ productId, changedFields }` |
| `product.published` | Product published | `{ productId, companyId }` |
| `product.unpublished` | Product unpublished | `{ productId, reason }` |
| `product.quality_updated` | Quality score changed | `{ productId, score, dimensions }` |
| `product.ai_enriched` | AI enrichment applied | `{ productId, enrichmentType }` |
| `rfq.created` | RFQ created | `{ rfqId, buyerId, products, quantity, budget, timeline }` |
| `rfq.updated` | RFQ updated | `{ rfqId, changedFields }` |
| `rfq.expired` | RFQ expired | `{ rfqId, reason }` |
| `rfq.ai_assisted` | AI assisted RFQ | `{ rfqId, aiAction, improvement }` |
| `quote.received` | Quote submitted | `{ quoteId, rfqId, supplierId, price, terms }` |
| `quote.ai_generated` | AI generated quote | `{ quoteId, aiParameters, accepted }` |
| `quote.accepted` | Quote accepted | `{ quoteId, rfqId, reason }` |
| `quote.rejected` | Quote rejected | `{ quoteId, reason, counterOffer }` |
| `negotiation.started` | Negotiation initiated | `{ negotiationId, rfqId, participants }` |
| `negotiation.message_sent` | Message in negotiation | `{ negotiationId, sender, content, intent }` |
| `negotiation.deal_reached` | Deal agreed | `{ negotiationId, terms, satisfaction }` |
| `negotiation.failed` | Negotiation failed | `{ negotiationId, reason, breakdownPoint }` |
| `negotiation.ai_counteroffer` | AI counter offer | `{ negotiationId, suggestedTerms, accepted }` |
| `order.created` | Order created | `{ orderId, rfqId, quoteId, buyerId, supplierId, amount }` |
| `order.payment_received` | Payment received | `{ orderId, paymentId, amount, method }` |
| `order.payment_failed` | Payment failed | `{ orderId, paymentId, reason, attempts }` |
| `order.shipped` | Order shipped | `{ orderId, carrier, trackingId, estimatedDelivery }` |
| `order.delivered` | Order delivered | `{ orderId, actualDeliveryDate, condition }` |
| `order.delayed` | Order delayed | `{ orderId, delayDuration, reason }` |
| `order.disputed` | Order disputed | `{ orderId, disputant, reason, amount }` |
| `order.resolved` | Dispute resolved | `{ orderId, resolution, outcome, satisfaction }` |
| `order.cancelled` | Order cancelled | `{ orderId, reason, stage }` |

### 3.4 Finance & Payment

**Purpose**: Payment processing, escrow, invoicing, settlement, commissions, pricing, reconciliation.
**Owner**: Finance & Payment (BCA-01 2.2.4)
**System of Record**: Payment Database

#### Payment Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/finance/payments` | Create payment | JWT |
| GET | `/api/v1/finance/payments/{paymentId}` | Get payment details | JWT (participant) |
| GET | `/api/v1/finance/payments` | List payments | JWT |
| POST | `/api/v1/finance/payments/{paymentId}/refund` | Process refund | JWT + ADMIN |
| POST | `/api/v1/finance/payments/webhook` | Payment gateway webhook | Public (IP whitelist) |
| POST | `/api/v1/finance/payments/verify` | Verify payment signature | JWT |

#### Escrow Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/finance/escrow` | Create escrow | JWT (buyer) |
| GET | `/api/v1/finance/escrow/{escrowId}` | Get escrow details | JWT (participant) |
| POST | `/api/v1/finance/escrow/{escrowId}/release` | Release escrow | JWT (buyer) |
| POST | `/api/v1/finance/escrow/{escrowId}/dispute` | Dispute escrow | JWT (participant) |
| POST | `/api/v1/finance/escrow/{escrowId}/freeze` | Freeze escrow | JWT + ADMIN |
| POST | `/api/v1/finance/escrow/{escrowId}/refund` | Refund escrow | JWT + ADMIN |

#### Settlement Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/finance/settlements` | List settlements | JWT (participant) |
| GET | `/api/v1/finance/settlements/{settlementId}` | Get settlement details | JWT (participant) |
| POST | `/api/v1/finance/settlements/{settlementId}/retry` | Retry failed settlement | JWT + ADMIN |

#### Commission Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/finance/commission/rules` | List commission rules | JWT + ADMIN |
| POST | `/api/v1/finance/commission/rules` | Create commission rule | JWT + ADMIN |
| PATCH | `/api/v1/finance/commission/rules/{ruleId}` | Update commission rule | JWT + ADMIN |
| DELETE | `/api/v1/finance/commission/rules/{ruleId}` | Delete commission rule | JWT + ADMIN |
| POST | `/api/v1/finance/commission/calculate` | Calculate commission | JWT |
| GET | `/api/v1/finance/commission/summary` | Commission earned summary | JWT |

#### Invoice Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/finance/invoices/{invoiceId}` | Get invoice | JWT (participant) |
| GET | `/api/v1/finance/invoices` | List invoices | JWT |
| POST | `/api/v1/finance/invoices/{invoiceId}/download` | Download invoice PDF | JWT |

#### Reconciliation Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/finance/reconciliation/summary` | Reconciliation summary | JWT + ADMIN |
| GET | `/api/v1/finance/reconciliation/discrepancies` | Unmatched transactions | JWT + ADMIN |
| POST | `/api/v1/finance/reconciliation/match` | Manual reconciliation | JWT + ADMIN |
| GET | `/api/v1/finance/reconciliation/export` | Export reconciliation report | JWT + ADMIN |

#### Internal APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/internal/v1/finance/payments/capture` | Capture authorized payment | Internal |
| POST | `/internal/v1/finance/escrow/{escrowId}/hold` | Place funds on hold | Internal |
| POST | `/internal/v1/finance/escrow/{escrowId}/release` | Release held funds | Internal |
| GET | `/internal/v1/finance/balance/{companyId}` | Get company balance | Internal |
| POST | `/internal/v1/finance/settlement/process` | Process settlement batch | Internal |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/finance/ai/credit-risk` | AI credit risk assessment | JWT + ADMIN |
| POST | `/api/v1/finance/ai/payment-delay` | AI payment delay prediction | JWT + ADMIN |
| POST | `/api/v1/finance/ai/cash-flow-forecast` | AI cash flow forecast | JWT |
| POST | `/api/v1/finance/ai/financial-health` | AI financial health score | JWT |
| POST | `/api/v1/finance/ai/credit-limit` | AI credit limit recommendation | JWT + ADMIN |

#### Event APIs (Produced)

| Event | Trigger | Schema |
|-------|---------|--------|
| `payment.created` | Payment initiated | `{ paymentId, orderId, amount, method }` |
| `payment.captured` | Payment captured | `{ paymentId, amount, gatewayRef }` |
| `payment.failed` | Payment failed | `{ paymentId, reason, attempts }` |
| `payment.refunded` | Refund processed | `{ paymentId, amount, reason }` |
| `escrow.created` | Escrow created | `{ escrowId, orderId, amount, buyerId, sellerId }` |
| `escrow.released` | Escrow released | `{ escrowId, amount }` |
| `escrow.disputed` | Escrow disputed | `{ escrowId, reason }` |
| `settlement.completed` | Settlement processed | `{ settlementId, companyId, amount }` |
| `settlement.failed` | Settlement failed | `{ settlementId, reason }` |
| `commission.calculated` | Commission computed | `{ transactionId, amount, ruleApplied }` |

### 3.5 Membership & Subscription

**Purpose**: Plan management, subscription billing, usage tracking, tier management, plan recommendations.
**Owner**: Membership Module (BCA-01 2.2.10)
**System of Record**: Subscription Database

#### Plan Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/membership/plans` | List available plans | Public |
| GET | `/api/v1/membership/plans/{planId}` | Get plan details | Public |
| POST | `/api/v1/membership/plans` | Create plan | JWT + ADMIN |
| PATCH | `/api/v1/membership/plans/{planId}` | Update plan | JWT + ADMIN |
| DELETE | `/api/v1/membership/plans/{planId}` | Delete plan | JWT + ADMIN |

#### Subscription Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/membership/subscriptions` | Create subscription | JWT |
| GET | `/api/v1/membership/subscriptions/current` | Get current subscription | JWT |
| GET | `/api/v1/membership/subscriptions/{subscriptionId}` | Get subscription details | JWT |
| GET | `/api/v1/membership/subscriptions` | List subscriptions | JWT |
| PATCH | `/api/v1/membership/subscriptions/{subscriptionId}` | Update subscription | JWT |
| POST | `/api/v1/membership/subscriptions/{subscriptionId}/cancel` | Cancel subscription | JWT |
| POST | `/api/v1/membership/subscriptions/{subscriptionId}/upgrade` | Upgrade plan | JWT |

#### Usage Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/membership/usage` | Get usage summary | JWT |
| GET | `/api/v1/membership/usage/breakdown` | Get usage breakdown | JWT |
| GET | `/api/v1/membership/usage/history` | Get usage history | JWT |

#### Billing Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/membership/billing/invoices` | List invoices | JWT |
| GET | `/api/v1/membership/billing/invoices/{invoiceId}` | Get invoice details | JWT |
| POST | `/api/v1/membership/billing/invoices/{invoiceId}/pay` | Pay invoice | JWT |
| GET | `/api/v1/membership/billing/payment-methods` | List payment methods | JWT |
| POST | `/api/v1/membership/billing/payment-methods` | Add payment method | JWT |
| DELETE | `/api/v1/membership/billing/payment-methods/{methodId}` | Remove payment method | JWT |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/membership/ai/plan-recommendation` | AI plan recommendation | JWT |
| POST | `/api/v1/membership/ai/churn-prediction` | AI churn prediction | JWT + ADMIN |
| POST | `/api/v1/membership/ai/upgrade-timing` | AI upgrade timing recommendation | JWT |

#### Event APIs (Produced)

| Event | Trigger | Schema |
|-------|---------|--------|
| `membership.subscribed` | Plan subscribed | `{ companyId, plan, amount, term }` |
| `membership.upgraded` | Plan upgraded | `{ companyId, oldPlan, newPlan, reason }` |
| `membership.cancelled` | Plan cancelled | `{ companyId, plan, reason, tenure }` |
| `membership.expired` | Plan expired | `{ companyId, plan, tenure }` |
| `membership.payment_succeeded` | Billing payment success | `{ companyId, invoiceId, amount }` |
| `membership.payment_failed` | Billing payment failed | `{ companyId, invoiceId, reason, attempts }` |

### 3.6 TradeServ (Services)

**Purpose**: Professional profiles, service catalog, booking, proposals, reviews, portfolio management.
**Owner**: TradeServ Module (BCA-01 2.2.8)
**System of Record**: Service Database

#### Professional Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/services/professionals/register` | Register as professional | JWT |
| GET | `/api/v1/services/professionals/{professionalId}` | Get professional profile | Public |
| PATCH | `/api/v1/services/professionals/{professionalId}` | Update professional profile | JWT (owner) |
| GET | `/api/v1/services/professionals` | List/search professionals | Public |
| GET | `/api/v1/services/professionals/my-profile` | Get own profile | JWT |

#### Service Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/services/services` | Create service listing | JWT (professional) |
| GET | `/api/v1/services/services/{serviceId}` | Get service details | Public |
| PATCH | `/api/v1/services/services/{serviceId}` | Update service | JWT (owner) |
| DELETE | `/api/v1/services/services/{serviceId}` | Delete service | JWT (owner) |
| GET | `/api/v1/services/services` | List services | Public |

#### Booking Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/services/bookings` | Create booking | JWT |
| GET | `/api/v1/services/bookings/{bookingId}` | Get booking details | JWT (participant) |
| PATCH | `/api/v1/services/bookings/{bookingId}/status` | Update booking status | JWT (participant) |
| GET | `/api/v1/services/bookings` | List bookings | JWT |
| POST | `/api/v1/services/bookings/{bookingId}/cancel` | Cancel booking | JWT (participant) |
| POST | `/api/v1/services/bookings/{bookingId}/pay` | Pay for booking | JWT |

#### Proposal Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/services/proposals` | Create proposal | JWT (professional) |
| GET | `/api/v1/services/proposals/{proposalId}` | Get proposal details | JWT (participant) |
| PATCH | `/api/v1/services/proposals/{proposalId}` | Update proposal | JWT (owner) |
| POST | `/api/v1/services/proposals/{proposalId}/accept` | Accept proposal | JWT (client) |
| POST | `/api/v1/services/proposals/{proposalId}/reject` | Reject proposal | JWT (client) |
| GET | `/api/v1/services/proposals` | List proposals | JWT |

#### Review Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/services/reviews` | Submit review | JWT (client) |
| GET | `/api/v1/services/reviews/{reviewId}` | Get review details | Public |
| GET | `/api/v1/services/reviews` | List reviews | Public |
| DELETE | `/api/v1/services/reviews/{reviewId}` | Delete review | JWT (owner) |

#### Portfolio Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/services/portfolio` | Add portfolio item | JWT (professional) |
| GET | `/api/v1/services/portfolio/{itemId}` | Get portfolio item | Public |
| PATCH | `/api/v1/services/portfolio/{itemId}` | Update portfolio item | JWT (owner) |
| DELETE | `/api/v1/services/portfolio/{itemId}` | Delete portfolio item | JWT (owner) |
| GET | `/api/v1/services/portfolio` | List portfolio items | Public |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/services/search/ai/semantic` | AI-powered professional search | Public |
| POST | `/api/v1/services/professionals/{professionalId}/ai/match-score` | AI match score for client | JWT |
| POST | `/api/v1/services/bookings/{bookingId}/ai/insights` | AI booking insights | JWT (participant) |

#### Event APIs (Produced)

| Event | Trigger | Schema |
|-------|---------|--------|
| `tradeserv.booking_created` | Booking created | `{ bookingId, professionalId, clientId, serviceId }` |
| `tradeserv.booking_completed` | Booking completed | `{ bookingId, satisfaction, issues }` |
| `tradeserv.review_submitted` | Review submitted | `{ reviewId, professionalId, rating, feedback }` |

### 3.7 TradeTalk (Community)

**Purpose**: Posts, communities, comments, follows, messaging.
**Owner**: TradeTalk Module (BCA-01 2.2.7)
**System of Record**: Community Database

#### Post Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/community/posts` | Create post | JWT |
| GET | `/api/v1/community/posts/{postId}` | Get post details | Public |
| PATCH | `/api/v1/community/posts/{postId}` | Update post | JWT (owner) |
| DELETE | `/api/v1/community/posts/{postId}` | Delete post | JWT (owner) |
| GET | `/api/v1/community/posts` | List/feed posts | Public |
| POST | `/api/v1/community/posts/{postId}/like` | Like/unlike post | JWT |
| POST | `/api/v1/community/posts/{postId}/save` | Save/unsave post | JWT |

#### Community Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/community/communities` | Create community | JWT |
| GET | `/api/v1/community/communities/{communityId}` | Get community details | Public |
| PATCH | `/api/v1/community/communities/{communityId}` | Update community | JWT (owner) |
| DELETE | `/api/v1/community/communities/{communityId}` | Delete community | JWT (owner) |
| GET | `/api/v1/community/communities` | List communities | Public |
| POST | `/api/v1/community/communities/{communityId}/join` | Join community | JWT |
| POST | `/api/v1/community/communities/{communityId}/leave` | Leave community | JWT |

#### Comment Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/community/posts/{postId}/comments` | Add comment | JWT |
| GET | `/api/v1/community/posts/{postId}/comments` | List comments | Public |
| DELETE | `/api/v1/community/comments/{commentId}` | Delete comment | JWT (owner) |

#### Follow Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/community/follow` | Follow user/company | JWT |
| DELETE | `/api/v1/community/follow` | Unfollow | JWT |
| GET | `/api/v1/community/follow/{userId}/followers` | Get followers | Public |
| GET | `/api/v1/community/follow/{userId}/following` | Get following | Public |
| GET | `/api/v1/community/follow/check` | Check follow status | JWT |

#### Messaging Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/community/conversations` | Create conversation | JWT |
| GET | `/api/v1/community/conversations` | List conversations | JWT |
| POST | `/api/v1/community/conversations/{conversationId}/messages` | Send message | JWT |
| GET | `/api/v1/community/conversations/{conversationId}/messages` | Get messages | JWT |
| PATCH | `/api/v1/community/messages/{messageId}` | Update message | JWT (owner) |
| DELETE | `/api/v1/community/messages/{messageId}` | Delete message | JWT (owner) |
| POST | `/api/v1/community/conversations/{conversationId}/read` | Mark as read | JWT |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/community/posts/{postId}/ai/generate` | AI post generation | JWT |
| POST | `/api/v1/community/posts/{postId}/ai/moderation` | AI content moderation | Internal |
| POST | `/api/v1/community/posts/{postId}/ai/summarize` | AI content summarization | Public |
| POST | `/api/v1/community/posts/{postId}/ai/translate` | AI content translation | JWT |
| POST | `/api/v1/community/ai/suggest-communities` | AI community suggestions | JWT |
| POST | `/api/v1/community/ai/trending-topics` | AI trending topics | Public |

#### Event APIs (Produced)

| Event | Trigger | Schema |
|-------|---------|--------|
| `tradetalk.post_created` | Post published | `{ postId, authorId, communityId, content }` |
| `tradetalk.comment_added` | Comment added | `{ commentId, postId, authorId }` |
| `tradetalk.community_joined` | User joined community | `{ userId, communityId }` |
| `tradetalk.reaction_added` | Post liked/reacted | `{ postId, userId, reactionType }` |

### 3.8 Growth & Engagement (GOCASH + Ecosystem)

**Purpose**: GOCASH wallet, transactions, referrals, campaigns, achievements, Near→Far engine.
**Owner**: Growth & Engagement Module (BCA-01 2.2.12)
**System of Record**: Wallet Database, Ecosystem Database, Referral Database

#### Wallet Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/growth/wallets/my` | Get my wallet summary | JWT |
| GET | `/api/v1/growth/wallets/{walletId}` | Get wallet details | JWT (owner) |
| GET | `/api/v1/growth/wallets/{walletId}/transactions` | List transactions | JWT |
| GET | `/api/v1/growth/wallets/{walletId}/statement` | Get wallet statement | JWT |

#### Referral Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/growth/referrals/codes` | Create referral code | JWT |
| GET | `/api/v1/growth/referrals/codes/my` | Get my codes | JWT |
| POST | `/api/v1/growth/referrals/apply` | Apply referral code | JWT |
| GET | `/api/v1/growth/referrals/history` | Get referral history | JWT |
| GET | `/api/v1/growth/referrals/statistics` | Get referral stats | JWT |

#### Campaign Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/growth/campaigns` | Create campaign | JWT |
| GET | `/api/v1/growth/campaigns/{campaignId}` | Get campaign details | Public |
| PATCH | `/api/v1/growth/campaigns/{campaignId}` | Update campaign | JWT (owner) |
| GET | `/api/v1/growth/campaigns` | List campaigns | Public |
| POST | `/api/v1/growth/campaigns/{campaignId}/claim` | Claim campaign reward | JWT |
| GET | `/api/v1/growth/campaigns/{campaignId}/analytics` | Campaign analytics | JWT + ADMIN |

#### Achievement Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/growth/achievements` | List achievements | JWT |
| GET | `/api/v1/growth/achievements/my` | Get my achievements | JWT |
| GET | `/api/v1/growth/achievements/{achievementId}` | Get achievement details | Public |

#### Ecosystem Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/growth/ecosystem/dashboard` | Ecosystem dashboard | JWT |
| GET | `/api/v1/growth/ecosystem/xp-balance` | Get XP balance | JWT |
| GET | `/api/v1/growth/ecosystem/xp-history` | XP transaction history | JWT |
| POST | `/api/v1/growth/ecosystem/checkin` | Daily check-in | JWT |
| GET | `/api/v1/growth/ecosystem/streaks` | Get streak info | JWT |
| GET | `/api/v1/growth/ecosystem/levels` | Get level info | JWT |
| GET | `/api/v1/growth/ecosystem/badges` | List badges | JWT |
| GET | `/api/v1/growth/ecosystem/missions` | List missions | JWT |
| POST | `/api/v1/growth/ecosystem/missions/{missionId}/complete` | Complete mission | JWT |
| GET | `/api/v1/growth/leaderboard` | Get leaderboard | Public |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/growth/ai/reward-summary` | AI-powered reward summary | JWT |
| POST | `/api/v1/growth/ecosystem/ai/suggested-missions` | AI-suggested missions | JWT |

#### Event APIs (Produced)

| Event | Trigger | Schema |
|-------|---------|--------|
| `gocash.earned` | GOCASH credited | `{ entityId, amount, source, balance }` |
| `gocash.spent` | GOCASH debited | `{ entityId, amount, destination, balance }` |
| `campaign.participated` | Campaign joined | `{ companyId, campaignId, action }` |
| `achievement.unlocked` | Achievement earned | `{ entityId, achievement, level }` |
| `referral.code_created` | Referral code generated | `{ userId, code }` |
| `referral.converted` | Referral converted | `{ referrerId, refereeId, reward }` |
| `ecosystem.checkin_completed` | Daily checkin | `{ userId, streak, xpEarned }` |
| `ecosystem.level_up` | Level increased | `{ userId, previousLevel, newLevel }` |
| `ecosystem.mission_completed` | Mission completed | `{ userId, missionId, xpEarned }` |

### 3.9 Support & Help

**Purpose**: Ticket management, knowledge base, chat support, AI support, SLA management.
**Owner**: Support Module (BCA-01 2.2.11)
**System of Record**: Support Database

#### Ticket Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/support/tickets` | Create ticket | JWT |
| GET | `/api/v1/support/tickets/{ticketId}` | Get ticket details | JWT (participant) |
| PATCH | `/api/v1/support/tickets/{ticketId}` | Update ticket | JWT (participant) |
| GET | `/api/v1/support/tickets` | List tickets | JWT |
| POST | `/api/v1/support/tickets/{ticketId}/messages` | Add message | JWT (participant) |
| GET | `/api/v1/support/tickets/{ticketId}/messages` | Get messages | JWT (participant) |
| POST | `/api/v1/support/tickets/{ticketId}/assign` | Assign ticket | JWT + ADMIN |
| POST | `/api/v1/support/tickets/{ticketId}/close` | Close ticket | JWT (participant) |
| GET | `/api/v1/support/tickets/stats` | Ticket statistics | JWT + ADMIN |

#### Knowledge Base Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/support/knowledge-base/articles` | List articles | Public |
| GET | `/api/v1/support/knowledge-base/articles/{articleId}` | Get article | Public |
| GET | `/api/v1/support/knowledge-base/categories` | List categories | Public |
| GET | `/api/v1/support/knowledge-base/search` | Search articles | Public |

#### AI APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/support/ai/auto-respond` | AI auto-response to ticket | Internal |
| POST | `/api/v1/support/ai/suggest-articles` | AI article suggestions | JWT |
| POST | `/api/v1/support/ai/summarize-ticket` | AI ticket summarization | JWT + ADMIN |
| POST | `/api/v1/support/ai/sentiment` | AI sentiment analysis | Internal |

### 3.10 Analytics & Insights

**Purpose**: Descriptive, diagnostic, predictive, and prescriptive analytics. TradHexa six-dimensional BI.
**Owner**: Analytics Module (BCA-01 2.2.15)
**System of Record**: Data Warehouse

#### Analytics Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/analytics/dashboard` | Get analytics dashboard | JWT |
| GET | `/api/v1/analytics/tradhexa` | Get TradHexa score | JWT |
| GET | `/api/v1/analytics/reports` | List reports | JWT |
| POST | `/api/v1/analytics/reports` | Create custom report | JWT |
| GET | `/api/v1/analytics/reports/{reportId}` | Get report data | JWT |
| POST | `/api/v1/analytics/reports/{reportId}/export` | Export report | JWT |
| GET | `/api/v1/analytics/metrics` | Get platform metrics | JWT |

#### Admin Analytics

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/admin/analytics/dashboard` | Admin dashboard metrics | JWT + ADMIN |
| GET | `/api/v1/admin/analytics/growth` | Growth metrics | JWT + ADMIN |
| GET | `/api/v1/admin/analytics/revenue` | Revenue analytics | JWT + ADMIN |
| GET | `/api/v1/admin/analytics/user-metrics` | User metrics | JWT + ADMIN |
| GET | `/api/v1/admin/analytics/export` | Export analytics data | JWT + ADMIN |

#### Growth Intelligence (Admin)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/admin/growth-intelligence/acquisition-funnel` | Acquisition funnel | JWT + ADMIN |
| GET | `/api/v1/admin/growth-intelligence/campaign-performance` | Campaign performance | JWT + ADMIN |
| GET | `/api/v1/admin/growth-intelligence/referral-conversion` | Referral conversion | JWT + ADMIN |
| GET | `/api/v1/admin/growth-intelligence/traffic-sources` | Traffic sources | JWT + ADMIN |
| GET | `/api/v1/admin/growth-intelligence/summary` | Growth summary | JWT + ADMIN |

### 3.11 Founder Tools

**Purpose**: Executive dashboard, morning brief, risk radar, opportunity scanner, health index.
**Owner**: Founder Module (BCA-01 2.2.16)
**System of Record**: Aggregated from all modules

#### Founder Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/founder/dashboard` | Executive dashboard | JWT + ADMIN |
| GET | `/api/v1/founder/morning-brief` | AI-generated morning brief | JWT + ADMIN |
| GET | `/api/v1/founder/risk-radar` | Risk early warning | JWT + ADMIN |
| GET | `/api/v1/founder/opportunity-scanner` | Growth opportunity scan | JWT + ADMIN |
| GET | `/api/v1/founder/health-index` | Platform health index | JWT + ADMIN |
| GET | `/api/v1/founder/decision-center` | Decision hub data | JWT + ADMIN |
| GET | `/api/v1/founder/intelligence/unified` | Unified intelligence dashboard | JWT + ADMIN |
| GET | `/api/v1/founder/intelligence/health` | Health score | JWT + ADMIN |

#### KPI & Correlation

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/founder/kpi-catalog` | KPI definitions | JWT + ADMIN |
| POST | `/api/v1/founder/kpi-catalog/evaluate` | Evaluate KPIs | JWT + ADMIN |
| GET | `/api/v1/founder/alerts` | List alerts | JWT + ADMIN |
| POST | `/api/v1/founder/alerts/{alertId}/acknowledge` | Acknowledge alert | JWT + ADMIN |
| POST | `/api/v1/founder/alerts/{alertId}/resolve` | Resolve alert | JWT + ADMIN |
| GET | `/api/v1/founder/correlations` | KPI correlations | JWT + ADMIN |

#### Executive Agent APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/founder/executive/copilot` | Executive copilot query | JWT + ADMIN |
| GET | `/api/v1/founder/executive/kpi` | Executive KPI dashboard | JWT + ADMIN |
| GET | `/api/v1/founder/executive/risks` | Executive risk engine | JWT + ADMIN |
| GET | `/api/v1/founder/executive/opportunities` | Executive opportunity engine | JWT + ADMIN |
| POST | `/api/v1/founder/executive/coordinate` | Coordinate with agent | JWT + ADMIN |

#### Enterprise Intelligence

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/founder/enterprise-intelligence/dashboard` | Enterprise intelligence | JWT + ADMIN |
| GET | `/api/v1/founder/enterprise-intelligence/revenue` | Revenue analytics | JWT + ADMIN |
| GET | `/api/v1/founder/enterprise-intelligence/growth` | Growth analytics | JWT + ADMIN |
| GET | `/api/v1/founder/enterprise-intelligence/health` | Enterprise health | JWT + ADMIN |
| POST | `/api/v1/founder/enterprise-intelligence/digital-twin/optimize` | Digital twin optimization | JWT + ADMIN |

### 3.12 Knowledge & Data

**Purpose**: Knowledge Graph, event store, vector store, object storage.
**Owner**: Knowledge Module (BCA-01 2.2.6)
**System of Record**: Graph Database, Event Store

#### Knowledge Graph Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/knowledge/graph/entities/{entityId}` | Get entity | JWT |
| GET | `/api/v1/knowledge/graph/entities` | Search entities | JWT |
| GET | `/api/v1/knowledge/graph/relationships` | Query relationships | JWT |
| POST | `/api/v1/knowledge/graph/query` | Execute graph query | JWT |
| GET | `/api/v1/knowledge/graph/traverse` | Traverse graph between entities | JWT |

#### Internal APIs

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/internal/v1/knowledge/graph/entity` | Create/update entity | Internal |
| POST | `/internal/v1/knowledge/graph/relationship` | Create relationship | Internal |
| POST | `/internal/v1/knowledge/events/ingest` | Ingest event | Internal |

### 3.13 Administration

**Purpose**: System administration, configuration, feature flags, audit log.
**Owner**: Enterprise & Platform (BCA-01 2.2.9)

#### Admin Resources

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/admin/system/health` | System health check | Internal |
| GET | `/api/v1/admin/system/ready` | Readiness check | Internal |
| GET | `/api/v1/admin/system/live` | Liveness check | Internal |
| GET | `/api/v1/admin/audit-log` | Audit log search | JWT + ADMIN |
| GET | `/api/v1/admin/audit-log/{entryId}` | Audit entry details | JWT + ADMIN |
| GET | `/api/v1/admin/feature-flags` | List feature flags | JWT + ADMIN |
| PATCH | `/api/v1/admin/feature-flags/{flagId}` | Update feature flag | JWT + ADMIN |
| GET | `/api/v1/admin/configuration` | List configuration | JWT + ADMIN |
| PATCH | `/api/v1/admin/configuration/{key}` | Update configuration | JWT + ADMIN |
| GET | `/api/v1/admin/metrics` | Prometheus metrics | Internal |

#### System of Record Admin

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/admin/ai-credits` | AI credit summary | JWT + ADMIN |
| GET | `/api/v1/admin/ai-credits/company/{companyId}` | Company credit detail | JWT + ADMIN |
| POST | `/api/v1/admin/ai-credits/reset/{companyId}` | Reset company credits | JWT + ADMIN |
| GET | `/api/v1/admin/ai-federation` | AI federation overview | JWT + ADMIN |
| POST | `/api/v1/admin/ai-federation/workflows/execute` | Execute federation workflow | JWT + ADMIN |
| GET | `/api/v1/admin/ai-runtime` | AI runtime dashboard | JWT + ADMIN |
| POST | `/api/v1/admin/ai-runtime/circuit-breaker/reset` | Reset circuit breaker | JWT + ADMIN |

---

## 4. AI CONTRACTS

### 4.1 AI Gateway

**Purpose**: Central AI access point. Routes all AI requests to appropriate models with credit tracking, rate limiting, and cost governance.
**Owner**: AI Gateway Module (BCA-01 4.1 #13)
**System of Record**: AI Gateway (transient), AI Audit Log

#### Agent Invocation

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/ai-gateway/agents/{agentId}/invoke` | Invoke AI agent | JWT |
| POST | `/api/v1/ai-gateway/agents/{agentId}/invoke-async` | Async agent invocation | JWT |
| POST | `/api/v1/ai-gateway/stream` | Streaming AI response (SSE) | JWT |
| POST | `/api/v1/ai-gateway/batch` | Batch AI inference | JWT |

#### Prompt Management

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/ai-gateway/prompts` | List prompts | JWT + ADMIN |
| GET | `/api/v1/ai-gateway/prompts/{promptId}` | Get prompt version | JWT + ADMIN |
| POST | `/api/v1/ai-gateway/prompts` | Create prompt | JWT + ADMIN |
| POST | `/api/v1/ai-gateway/prompts/{promptId}/versions` | Create new version | JWT + ADMIN |
| POST | `/api/v1/ai-gateway/prompts/{promptId}/activate` | Activate prompt version | JWT + ADMIN |
| GET | `/api/v1/ai-gateway/prompts/{promptId}/versions` | List prompt versions | JWT + ADMIN |

#### Credit & Cost Management

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/ai-gateway/credits/balance` | Get my credit balance | JWT |
| GET | `/api/v1/ai-gateway/credits/usage` | Get credit usage history | JWT |
| GET | `/api/v1/ai-gateway/credits/cost` | Get cost breakdown | JWT + ADMIN |

#### Models & Monitoring

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/ai-gateway/models` | List available models | JWT |
| GET | `/api/v1/ai-gateway/models/{modelId}` | Get model details | JWT |
| GET | `/api/v1/ai-gateway/health` | Gateway health status | Internal |

#### AI Runtime

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/ai-runtime/enqueue` | Enqueue AI job | JWT |
| GET | `/api/v1/ai-runtime/jobs/{jobId}` | Get job status | JWT |
| GET | `/api/v1/ai-runtime/jobs` | List jobs | JWT |
| POST | `/api/v1/ai-runtime/workflows` | Execute multi-step workflow | JWT |
| GET | `/api/v1/ai-runtime/queues/stats` | Queue statistics | JWT + ADMIN |
| GET | `/api/v1/ai-runtime/sla` | SLA monitoring | JWT + ADMIN |
| GET | `/api/v1/ai-runtime/circuit-breaker` | Circuit breaker status | JWT + ADMIN |

#### AI Governance

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/ai-gateway/audit` | AI audit log | JWT + ADMIN |
| POST | `/api/v1/ai-gateway/audit/search` | Search audit entries | JWT + ADMIN |
| GET | `/api/v1/ai-gateway/governance/permissions` | Agent permissions matrix | JWT + ADMIN |
| PATCH | `/api/v1/ai-gateway/governance/permissions/{agentId}` | Update agent permissions | JWT + ADMIN |
| GET | `/api/v1/ai-gateway/governance/budgets` | Cost budgets | JWT + ADMIN |
| PATCH | `/api/v1/ai-gateway/governance/budgets/{agentId}` | Update budget | JWT + ADMIN |

### 4.2 Agent Invocation Standard

All AI agent invocations follow this contract:

**Request:**
```json
POST /api/v1/ai-gateway/agents/{agentId}/invoke
Idempotency-Key: uuid
X-Request-ID: req_abc123

{
  "task": {
    "type": "supplier-ranking",
    "input": {
      "rfqId": "rfq_xyz",
      "constraints": {
        "maxBudget": 500000,
        "preferredLocation": "Mumbai",
        "requireCertification": ["ISO9001"]
      }
    }
  },
  "context": {
    "companyId": "comp_789",
    "userId": "user_456",
    "entityIds": ["rfq_xyz", "comp_789"],
    "memoryHints": ["previous-suppliers", "preferred-payment-terms"]
  },
  "options": {
    "confidenceThreshold": 0.7,
    "maxTokens": 2048,
    "temperature": 0.3,
    "synchronous": true,
    "timeout": 30000
  }
}
```

**Response (Synchronous):**
```json
{
  "_metadata": {
    "requestId": "req_abc123",
    "correlationId": "corr_def456",
    "agentId": "buyer-ai-v2",
    "modelUsed": "gpt-4o-mini",
    "promptVersion": "buyer-ai-supplier-ranking:v1.2.3",
    "creditsConsumed": 5,
    "latencyMs": 2340,
    "timestamp": "2026-07-27T10:30:00.000Z"
  },
  "status": "completed",
  "decisionType": "recommendation",
  "confidence": 0.87,
  "result": {
    "selectedOption": {
      "id": "supplier_1",
      "value": {
        "supplierId": "comp_456",
        "matchScore": 0.92,
        "tradTrustScore": 780,
        "estimatedPrice": 425000,
        "deliveryTimeline": "14 days"
      },
      "confidence": 0.87,
      "riskScore": 0.12
    },
    "alternatives": [
      {
        "id": "supplier_2",
        "value": {
          "supplierId": "comp_789",
          "matchScore": 0.78,
          "tradTrustScore": 720,
          "estimatedPrice": 390000,
          "deliveryTimeline": "21 days"
        },
        "confidence": 0.72,
        "riskScore": 0.28,
        "rejectionReason": "Lower TradTrust score and longer delivery timeline"
      }
    ]
  },
  "signalsUsed": [
    { "name": "tradtrust_score", "weight": 0.30, "value": 780 },
    { "name": "price_competitiveness", "weight": 0.25, "value": 0.85 },
    { "name": "delivery_reliability", "weight": 0.20, "value": 0.90 }
  ],
  "reasoning": {
    "summary": "Supplier ranked by composite score of TradTrust, price competitiveness, and delivery reliability",
    "keyFactors": [
      "Highest TradTrust score among matching suppliers",
      "Competitive pricing within budget",
      "Proven delivery track record in required location"
    ],
    "tradeOffs": [
      {
        "dimension": "Price vs Trust",
        "selectedValue": "Higher trust (780) at moderate price (425K)",
        "alternativeValue": "Lower trust (720) at lower price (390K)",
        "impact": "Reduced risk of delivery failure offsets 35K premium"
      }
    ]
  },
  "riskAssessment": {
    "overallRisk": 0.12,
    "dimensions": {
      "financial": 0.08,
      "operational": 0.15,
      "reputational": 0.05,
      "compliance": 0.10
    },
    "mitigations": [
      "Escrow-backed payment",
      "Milestone-based release schedule"
    ]
  },
  "autonomyCheck": {
    "level": "recommendation",
    "requiresHuman": true,
    "escalationReason": "First-time transaction with this supplier",
    "timeToAct": "2026-07-28T10:30:00.000Z"
  },
  "cost": {
    "credits": 5,
    "estimatedCost": 0.015,
    "currency": "USD"
  }
}
```

**Response (Asynchronous):**
```json
{
  "_metadata": { ... },
  "status": "accepted",
  "jobId": "job_abc123",
  "estimatedCompletion": "2026-07-27T10:32:00.000Z",
  "statusUrl": "/api/v1/ai-runtime/jobs/job_abc123"
}
```

**Streaming Response (SSE):**
```
event: token
data: {"token": "Based", "index": 0}

event: token
data: {"token": " on", "index": 1}

event: decision
data: {
  "decisionType": "recommendation",
  "confidence": 0.87,
  "result": { ... }
}

event: complete
data: {
  "totalTokens": 456,
  "latencyMs": 2340,
  "creditsConsumed": 5
}
```

### 4.3 Agent-to-Agent Communication

Agents communicate through the Federation service. This is an internal protocol only.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/internal/v1/ai-federation/delegate` | Delegate task to agent | Internal |
| POST | `/internal/v1/ai-federation/broadcast` | Broadcast to capable agents | Internal |
| POST | `/internal/v1/ai-federation/message` | Send agent-to-agent message | Internal |
| GET | `/internal/v1/ai-federation/discover` | Discover agents by capability | Internal |
| POST | `/internal/v1/ai-federation/collaboration/{collabId}/cancel` | Cancel collaboration | Internal |

#### Agent Messaging Protocol

```json
POST /internal/v1/ai-federation/message

{
  "messageId": "msg_uuid",
  "from": "buyer-ai-v2",
  "to": "tradtrust-engine-v3",
  "type": "request",
  "intent": "get-trust-score",
  "payload": {
    "companyId": "comp_456",
    "dimensions": ["delivery", "payment", "communication"],
    "includeConfidence": true
  },
  "context": {
    "correlationId": "corr_def456",
    "traceId": "trace_ghi789"
  },
  "priority": "medium",
  "replyTo": null,
  "ttl": 30000
}
```

### 4.4 Federation & Multi-Agent Collaboration

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/ai-federation/workflows` | Execute predefined workflow | JWT |
| POST | `/api/v1/ai-federation/collaborations` | Create collaboration | JWT |
| GET | `/api/v1/ai-federation/collaborations/{collabId}` | Get collaboration status | JWT |
| GET | `/api/v1/ai-federation/workflows/{workflowId}` | Get workflow status | JWT |
| GET | `/api/v1/ai-federation/agents` | List registered agents | JWT |
| GET | `/api/v1/ai-federation/agents/{agentId}` | Get agent capabilities | JWT |
| POST | `/api/v1/ai-federation/agents/{agentId}/health` | Agent health check | Internal |

### 4.5 AI Feedback Loop

Every AI decision must support feedback capture:

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/ai-feedback` | Submit explicit feedback | JWT |
| POST | `/api/v1/ai-feedback/implicit` | Submit implicit feedback | JWT |
| GET | `/api/v1/ai-feedback/{decisionId}` | Get feedback history | JWT + ADMIN |
| GET | `/api/v1/ai-feedback/summary` | Feedback summary for agent | JWT + ADMIN |

### 4.6 AI Approval API

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/ai-approvals/pending` | List pending approvals | JWT |
| GET | `/api/v1/ai-approvals/{approvalId}` | Get approval request | JWT |
| POST | `/api/v1/ai-approvals/{approvalId}/approve` | Approve decision | JWT |
| POST | `/api/v1/ai-approvals/{approvalId}/reject` | Reject decision | JWT |
| POST | `/api/v1/ai-approvals/{approvalId}/modify` | Approve with modifications | JWT |

---

## 5. EVENT CONTRACTS

### 5.1 Event Publishing

Events are published through the Event Bus (BCA-01 #3). Every module publishes typed, schema-validated events.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/events/{domain}/{eventType}` | Publish event | JWT |
| POST | `/internal/v1/events/{domain}/{eventType}` | Publish internal event | Internal |

**Event Envelope:**

```json
{
  "eventId": "evt_a1b2c3d4",
  "eventType": "order.created",
  "eventVersion": "1.0",
  "source": "commerce",
  "domain": "commerce",
  "timestamp": "2026-07-27T10:30:00.000Z",
  "producer": {
    "module": "order-module",
    "service": "order-service",
    "instance": "order-svc-1"
  },
  "entity": {
    "type": "order",
    "id": "order_xyz789"
  },
  "correlationId": "corr_def456",
  "traceId": "trace_ghi789",
  "priority": "very-high",
  "learningValue": "very-high",
  "businessValue": "very-high",
  "data": {
    "orderId": "order_xyz789",
    "buyerId": "comp_456",
    "supplierId": "comp_789",
    "amount": 425000,
    "currency": "INR",
    "items": [
      { "productId": "prod_123", "quantity": 10, "unitPrice": 42500 }
    ]
  },
  "metadata": {
    "schemaVersion": "1.0",
    "producerVersion": "1.2.3",
    "environment": "production"
  },
  "ttl": 86400
}
```

### 5.2 Event Subscription

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/events/subscriptions` | Create subscription | JWT |
| GET | `/api/v1/events/subscriptions` | List subscriptions | JWT |
| DELETE | `/api/v1/events/subscriptions/{subId}` | Delete subscription | JWT |
| PATCH | `/api/v1/events/subscriptions/{subId}` | Update subscription | JWT |
| GET | `/api/v1/events/subscriptions/{subId}/deliveries` | Get delivery history | JWT |

### 5.3 Webhooks

Webhooks allow external systems to receive TRADINGO events.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/webhooks` | Register webhook | JWT |
| GET | `/api/v1/webhooks` | List webhooks | JWT |
| PATCH | `/api/v1/webhooks/{webhookId}` | Update webhook | JWT |
| DELETE | `/api/v1/webhooks/{webhookId}` | Delete webhook | JWT |
| POST | `/api/v1/webhooks/{webhookId}/rotate-secret` | Rotate webhook secret | JWT |
| GET | `/api/v1/webhooks/{webhookId}/deliveries` | Get delivery log | JWT |
| POST | `/api/v1/webhooks/{webhookId}/deliveries/{deliveryId}/retry` | Retry delivery | JWT |

**Webhook Delivery Format:**

```http
POST {subscriber_url}
Content-Type: application/json
X-TRADINGO-Signature: t=1698400000,v1=abc123...
X-TRADINGO-Event-Type: order.created
X-TRADINGO-Delivery-Id: del_a1b2c3d4
X-TRADINGO-Timestamp: 2026-07-27T10:30:00.000Z

{
  "eventId": "evt_a1b2c3d4",
  "eventType": "order.created",
  "eventVersion": "1.0",
  "timestamp": "2026-07-27T10:30:00.000Z",
  "data": { ... }
}
```

**Signature Verification:**
- `t` = epoch timestamp of delivery attempt
- `v1` = HMAC-SHA256 of `{t}.{payload}` using webhook secret
- Subscribers verify signature before processing

### 5.4 Retry & Dead-Letter Policy

| Retry Level | Attempts | Backoff | After DLQ |
|-------------|----------|---------|-----------|
| **Critical** | 5 | Exponential (1s, 2s, 4s, 8s, 16s) | Alert on-call immediately |
| **Very High** | 5 | Exponential (5s, 10s, 20s, 40s, 80s) | Alert within 5 minutes |
| **High** | 3 | Exponential (30s, 60s, 120s) | Alert within 30 minutes |
| **Medium** | 3 | Linear (5min, 10min, 15min) | Log for daily review |
| **Low** | 1 | None | Log and discard |

**Dead-Letter Queue Behavior:**
- Events in DLQ are retained for 30 days
- DLQ events can be replayed (POST /api/v1/events/subscriptions/{subId}/deliveries/{deliveryId}/retry)
- DLQ threshold alerts trigger when any subscription exceeds 10% failure rate in 1 hour
- Manual DLQ inspection via admin API

### 5.5 Event Versioning

| Aspect | Policy |
|--------|--------|
| **Version format** | SemVer without patch (e.g., `1.0`, `2.0`) |
| **Breaking change** | Field removal, schema restructure, semantic change |
| **Backward-compatible** | Adding optional fields, relaxing constraints |
| **Coexistence** | Producers publish both old and new event versions during migration (parallel run for 14 days) |
| **Schema registry** | Every event type has a registered schema in the Schema Registry |
| **Schema validation** | Events are validated against schema on publish; invalid events are rejected |

### 5.6 Event Schema Registry

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/events/schemas` | List registered schemas | JWT |
| GET | `/api/v1/events/schemas/{eventType}` | Get event schema | JWT |
| POST | `/api/v1/events/schemas` | Register event schema | JWT + ADMIN |
| POST | `/api/v1/events/schemas/{eventType}/versions` | Register new version | JWT + ADMIN |

---

## 6. SECURITY STANDARDS

### 6.1 Authentication

| Mechanism | Endpoint Type | Token Life | Rotation |
|-----------|--------------|------------|----------|
| **JWT (Bearer)** | User-facing APIs | Access: 15 min, Refresh: 7 days | Refresh token rotation on each refresh |
| **API Key + JWT** | M2M integrations | 1 year | Rotated via Integration Module |
| **Service Token** | Internal service-to-service | 1 hour | Generated by Auth Module |
| **Session Token** | WebSocket connections | Session duration | Invalidated on disconnect |

### 6.2 Authorization

| Layer | Mechanism | Policy Location |
|-------|-----------|----------------|
| **Authentication** | JWT validation | API Gateway / Auth Module |
| **Role-Based Access (RBAC)** | Roles assigned to users | Auth Module (BCA-01 2.2.1) |
| **Attribute-Based Access (ABAC)** | Dynamic permission evaluation | Policy Engine (BCA-01 #24) |
| **Resource Ownership** | Resource ID vs user companyId | Module-level enforcement |
| **Scope-Based** | Scopes limiting API access | Integration keys |

**Role Hierarchy:**
```
SUPER_ADMIN → ADMIN → SELLER → BUYER → USER
                    ↘ USER (unverified)
```

**Standard Permission Checks:**
- `self`: User can only access own resources
- `company`: User can access resources within own company
- `admin`: ADMIN or SUPER_ADMIN role required
- `super_admin`: SUPER_ADMIN role required
- `owner`: User must be the resource owner
- `participant`: User must be a participant in the transaction

### 6.3 API Security Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforce HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS protection |
| `Content-Security-Policy` | Configurable per environment | Resource whitelist |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer control |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Feature restriction |

### 6.4 Input Validation

| Rule | Enforcement |
|------|-------------|
| All request bodies validated against JSON Schema | API Gateway + Module |
| String length limits enforced | Min 1, Max varies by field |
| Numeric range limits enforced | Configured per field |
| Enum values validated against allowed set | Schema validation |
| SQL injection prevention | Parameterized queries (no raw SQL) |
| XSS prevention | Output encoding |
| File upload size limit | 10MB default, configurable |
| Allowed file types | Whitelist per upload context |

### 6.5 Sensitive Data Handling

| Data Class | Examples | Handling |
|------------|----------|----------|
| **Public** | Company name, product name | No restrictions |
| **Internal** | Email, phone, address | Logged but not exposed in public APIs |
| **Sensitive** | Payment details, KYC documents | Encrypted at rest, masked in logs |
| **Secret** | Passwords, API keys, tokens | Hashed/encrypted, never logged |

---

## 7. VERSIONING STRATEGY

### 7.1 API Lifecycle

```
v1.0 ────┬─── v1.1 (additive) ──── v1.2 (additive) ──── v1.3 (additive)
         │                                               │
         │                                        Deprecation notice (T-90)
         │                                               │
         └───────────────────────────────────────── v2.0 (breaking)
```

### 7.2 Breaking vs Non-Breaking Changes

| Change | Classification | Example |
|--------|---------------|---------|
| Adding new endpoint | Non-breaking | `GET /api/v1/resource/new` |
| Adding optional field to response | Non-breaking | Adding `ai_confidence` field |
| Adding optional request parameter | Non-breaking | Adding `include` query param |
| Relaxing validation constraint | Non-breaking | Widening allowed enum values |
| Removing endpoint | Breaking | DELETE /api/v1/resource |
| Removing field from response | Breaking | Removing `status` field |
| Making required field optional | Breaking | Changing from required to optional |
| Changing field type | Breaking | `price` from string to number |
| Adding required field to request | Breaking | Adding required `version` field |
| Changing endpoint URL | Breaking | `/api/v1/resource` → `/api/v2/resource` |

### 7.3 Version Compatibility Rules

| Consumer | Producer Change | Compatibility |
|----------|----------------|---------------|
| v1 client | v1.1 server | ✅ Compatible (new fields ignored) |
| v1.1 client | v1 server | ✅ Compatible (missing fields treated as null) |
| v1 client | v2 server | ⚠️ Deprecated endpoints redirect to v2 |
| v2 client | v1 server | ❌ Not compatible |

---

## 8. ERROR STANDARDS

### 8.1 Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request body validation failed |
| `INVALID_INPUT` | 400 | Malformed input |
| `MISSING_REQUIRED_FIELD` | 422 | Required field not provided |
| `INVALID_FIELD_VALUE` | 422 | Field value out of range or invalid |
| `RESOURCE_NOT_FOUND` | 404 | The requested resource does not exist |
| `RESOURCE_CONFLICT` | 409 | Resource state conflict (stale version) |
| `RESOURCE_EXISTS` | 409 | Resource already exists (duplicate) |
| `AUTHENTICATION_REQUIRED` | 401 | No valid authentication |
| `AUTHENTICATION_INVALID` | 401 | Token expired or invalid |
| `AUTHORIZATION_INSUFFICIENT` | 403 | Insufficient permissions |
| `AUTHORIZATION_IP_BLOCKED` | 403 | IP not whitelisted |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `RATE_LIMIT_AI_CREDITS` | 402 | AI credits exhausted |
| `IDEMPOTENCY_KEY_MISSING` | 400 | Idempotency key required but not provided |
| `IDEMPOTENCY_KEY_CONFLICT` | 409 | Same key with different payload |
| `IDEMPOTENCY_KEY_EXPIRED` | 400 | Idempotency key expired |
| `BUSINESS_RULE_VIOLATION` | 422 | Domain validation failure |
| `INSUFFICIENT_FUNDS` | 422 | Wallet balance insufficient |
| `TRANSACTION_LIMIT_EXCEEDED` | 422 | Daily/monthly transaction limit |
| `COMPLIANCE_BLOCKED` | 422 | Regulatory compliance check failed |
| `DEPENDENCY_FAILURE` | 502 | External service failure |
| `DEPENDENCY_TIMEOUT` | 504 | External service timeout |
| `SERVICE_UNAVAILABLE` | 503 | Temporary service outage |
| `INTERNAL_ERROR` | 500 | Unexpected error |

### 8.2 Error Response Envelope

All errors follow the RFC 7807 Problem Details format (Section 2.10):

```json
{
  "type": "https://api.tradingo.io/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "The request body contains invalid fields",
  "instance": "/api/v1/commerce/orders",
  "requestId": "req_a1b2c3d4",
  "correlationId": "corr_e5f6g7h8",
  "timestamp": "2026-07-27T10:30:00.000Z",
  "errors": [
    {
      "code": "MIN_VIOLATION",
      "field": "items[0].quantity",
      "message": "Quantity must be at least 1",
      "value": 0,
      "constraints": { "min": 1 }
    }
  ]
}
```

### 8.3 Error Severity

| Severity | HTTP Range | Response Time | Action Required |
|----------|-----------|---------------|-----------------|
| **Fatal** | 5xx | <500ms | Alert on-call, investigate immediately |
| **Error** | 4xx (user error) | <200ms | Log, return to client |
| **Warning** | 4xx (business rule) | <200ms | Log, return to client |
| **Info** | 2xx with warning | <200ms | Log warning, return success |

---

## 9. INTEGRATION GUIDELINES

### 9.1 External Integrations

External systems integrate with TRADINGO via:

1. **REST APIs** — Standard CRUD + action APIs (Section 3)
2. **Webhooks** — Event-driven notifications (Section 5.3)
3. **GraphQL** — Flexible data queries (future, not in current scope)
4. **Integration Marketplace** — Pre-built connectors (plugin framework)

### 9.2 Integration API Key Types

| Key Type | Access | Rate Limit | Uses |
|----------|--------|------------|------|
| **Read-only** | GET only | 100 req/min | Analytics, reporting |
| **Standard** | All non-admin | 300 req/min | Business integrations |
| **Admin** | All including admin | 500 req/min | Platform management |
| **Webhook** | Outbound only | — | Event delivery |

### 9.3 Webhook Best Practices

1. **Respond quickly**: Acknowledge webhook with 200 within 5 seconds
2. **Idempotent processing**: Webhooks may be delivered more than once (use eventId for dedup)
3. **Verify signature**: Validate `X-TRADINGO-Signature` header before processing
4. **Return errors properly**: Non-200 responses trigger retry with backoff
5. **Endpoint security**: Use HTTPS only; rotate secrets regularly
6. **Rate preparation**: Handle bursts of webhooks; queue processing if needed

### 9.4 SDK & Client Requirements

API consumers should implement:
1. Automatic retry with exponential backoff (max 3 attempts)
2. Idempotency key generation for mutating operations
3. Token refresh handling (401 → refresh → retry)
4. Rate limit backoff (429 → wait for Retry-After)
5. Request ID propagation
6. Pagination handling (follow next cursor)
7. Response envelope parsing

---

## 10. API READINESS CHECKLIST

### 10.1 Per-Module Checklist

Every module API must verify these before going live:

| # | Check | Requirement |
|---|-------|-------------|
| 1 | **URI Conventions** | All endpoints follow `/api/v1/{domain}/{resource}` pattern |
| 2 | **HTTP Methods** | Correct method per operation (Section 2.1) |
| 3 | **Response Envelope** | Consistent `_metadata` + `data` + optional `meta` |
| 4 | **Pagination** | Cursor pagination for list endpoints |
| 5 | **Filtering** | Standard filter syntax for list endpoints |
| 6 | **Sorting** | Standard sort syntax for list endpoints |
| 7 | **Error Model** | RFC 7807 Problem Details for all errors |
| 8 | **Authentication** | JWT validation on all protected endpoints |
| 9 | **Authorization** | RBAC checks on all protected endpoints |
| 10 | **Rate Limiting** | Rate limits applied per endpoint group |
| 11 | **Idempotency** | Idempotency keys for mutating operations |
| 12 | **Request ID** | X-Request-ID header on all responses |
| 13 | **Correlation ID** | X-Correlation-ID propagation |
| 14 | **Event Emission** | Module emits events for all state changes |
| 15 | **Audit Logging** | All mutations logged to audit trail |
| 16 | **Input Validation** | All inputs validated against schema |
| 17 | **OpenAPI Spec** | Complete OpenAPI 3.1 specification published |
| 18 | **Deprecation Headers** | Deprecation + Sunset headers on deprecated endpoints |
| 19 | **Sparse Fieldsets** | `fields` parameter supported |
| 20 | **Cache Headers** | Appropriate Cache-Control headers |

### 10.2 AI API Checklist

| # | Check | Requirement |
|---|-------|-------------|
| 1 | **Gateway Routing** | All AI requests through AI Gateway |
| 2 | **Credit Check** | Credit balance verified before processing |
| 3 | **Confidence Scoring** | Every AI decision includes confidence |
| 4 | **Decision Type** | Every AI response declares decision type |
| 5 | **Signals Used** | Every AI response lists signals used |
| 6 | **Reasoning** | Every AI response includes reasoning |
| 7 | **Risk Assessment** | Every decision includes risk assessment |
| 8 | **Explainability** | Human-readable explainability included |
| 9 | **Feedback Capture** | Every decision supports feedback |
| 10 | **Audit Logging** | Every AI decision logged to AI audit |

### 10.3 Security Checklist

| # | Check | Requirement |
|---|-------|-------------|
| 1 | **HTTPS Only** | All endpoints served over HTTPS |
| 2 | **JWT Validation** | Token signature, expiry, and claims verified |
| 3 | **Role Enforcement** | Endpoint-level role authorization |
| 4 | **Input Sanitization** | All inputs sanitized against injection |
| 5 | **Rate Limiting** | Rate limits enforced per tenant/IP |
| 6 | **CORS** | CORS configured per environment |
| 7 | **CSRF** | CSRF protection for cookie-based sessions |
| 8 | **Sensitive Data** | No secrets in responses or logs |
| 9 | **Audit Trail** | All mutations logged |
| 10 | **Webhook Security** | Webhook signatures verified |

### 10.4 Event Readiness Checklist

| # | Check | Requirement |
|---|-------|-------------|
| 1 | **Schema Registration** | Event schema registered in Schema Registry |
| 2 | **Event Envelope** | Standard event envelope used |
| 3 | **Event Version** | Semantic version on all events |
| 4 | **Classification** | Priority, learning value, business value set |
| 5 | **Producer Metadata** | Source module, service, instance identified |
| 6 | **Entity Reference** | Primary entity type and ID included |
| 7 | **Correlation ID** | Events linked to originating request |
| 8 | **Trace ID** | Distributed tracing context propagated |
| 9 | **TTL** | Event time-to-live set |
| 10 | **Idempotent Handlers** | Event handlers idempotent (handle duplicates) |

---

> **End of TRADINGO API Contracts Specification v1.0**
>
> *"Design is complete. Implementation may begin. The API contract is the single source of truth for all module interfaces."*
