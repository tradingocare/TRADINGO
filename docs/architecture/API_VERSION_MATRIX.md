# API Version Matrix

## Versioning Strategy

### Current Approach
- **No explicit versioning in URL paths** — the base path `/api/v1/` is used as a convention but is not part of a formal API versioning scheme
- All endpoints live under `/api/v1/` with regular path-based routing
- Breaking changes are communicated via changelog and deprecation headers, not URL paths

### Backward Compatibility Guarantee
- Existing endpoints will not be removed or modified in a breaking way without deprecation notice
- Adding new fields to response objects is always backward compatible
- Adding new optional query/body parameters is always backward compatible
- Removing fields, changing field types, or making optional fields required is **breaking** and requires deprecation

### Deprecation Policy

| Step | Action | Timeline |
|------|--------|----------|
| 1 | Endpoint marked as deprecated in OpenAPI spec | Immediate |
| 2 | `Sunset` header added to responses | Same release |
| 3 | `Deprecation` header with `version` parameter added | Same release |
| 4 | Deprecation notice published in changelog | Same release |
| 5 | Old endpoint removed | 6 months after deprecation |

Deprecation headers:
```
Sunset: Sat, 16 Jan 2027 00:00:00 GMT
Deprecation: version="v1"
```

### Changelog-Driven Versioning
- All API changes are documented in `API_CHANGELOG.md`
- Major releases are tagged in git (e.g., `v1.0.0`)
- The changelog is the single source of truth for API evolution
- Breaking changes are called out explicitly in changelog entries

### Future Versioning (v2+)
If a formal versioning scheme becomes necessary:

| Strategy | Pros | Cons |
|----------|------|------|
| **URL path** (`/api/v2/`) | Clear, cache-friendly, easy to route | Duplicate controllers, stale endpoints |
| **Header** (`Accept: application/vnd.tradhexa.v2+json`) | Clean URLs, fine-grained | Harder to test, less discoverable |
| **Query param** (`?api-version=2`) | Simple to implement | Cache pollution, not RESTful |

**Recommended**: URL path versioning if v2 is ever needed. Middleware can route based on version prefix.

## Module Version Maturity

| Module | Maturity | Breaking Change Risk |
|--------|----------|---------------------|
| Authentication | **Stable** | Low |
| Users | **Stable** | Low |
| Products | **Stable** | Low |
| Categories | **Stable** | Low |
| Brands | **Stable** | Low |
| Organizations | **Stable** | Low |
| RFQ | **Stable** | Low |
| Quotes | **Stable** | Low |
| Smart Negotiation | **Stable** | Low |
| Purchase Orders | **Stable** | Low |
| Payments | **Stable** | Low |
| Escrow | **Stable** | Low |
| Finance | **Stable** | Low |
| GOCASH Wallet | **Stable** | Low (immutable ledger) |
| GOCASH Ecosystem | **Stable** | Low |
| Campaigns | **Stable** | Low |
| Referrals | **Stable** | Low |
| AI Gateway | **Stable** | Low |
| AI Runtime | **Stable** | Low |
| AI Agents | **Stable** | Low |
| AI Federation | **Stable** | Low |
| AI Domain Services | **Stable** | Low |
| Trade Talk | **Stable** | Low |
| Notifications | **Stable** | Low |
| Search | **Stable** | Low |
| Enterprise Catalog | **Stable** | Low |
| Enterprise Intelligence | **Mature** | Low |
| TradeServ | **Mature** | Medium |
| CRM | **Mature** | Low |
| Advertising | **Mature** | Low |
| Marketplace Intelligence | **Mature** | Low |
| Location Intelligence | **Mature** | Low |
| Territory Intelligence | **Mature** | Low |

## Version Compatibility Matrix

| Client SDK | API v1 | Notes |
|------------|--------|-------|
| TypeScript (axios) | ✅ Full | Recommended for web frontend |
| Python | ✅ Full | Auto-generatable from OpenAPI |
| Java | ✅ Full | Auto-generatable from OpenAPI |
| Go | ✅ Full | Auto-generatable from OpenAPI |
| cURL | ✅ Full | Ad-hoc testing |
| Postman | ✅ Full | Collection available |
| Swagger UI | ✅ Full | Built-in at `/docs` |
