# Tradingo API Developer Guide

## Platform Overview

Tradingo is the backend API for the TradHexa B2B marketplace platform. It powers multi-vendor e-commerce, procurement, professional services (TradeServ), AI-powered negotiation, financial operations (GOCASH), and community features (TradeTalk). The API is designed for external developers building integrations, custom storefronts, ERP connectors, or mobile applications.

## Architecture

The Tradingo API follows a modular monolith architecture with domain-driven design principles.

- **Runtime**: NestJS framework running on Fastify (not Express) for improved throughput and lower latency.
- **Database**: PostgreSQL 16 with Prisma ORM for type-safe queries and migrations.
- **Cache**: Redis for session state, rate limiting, OTP storage, and AI context caching.
- **Queues**: BullMQ for background job processing (notifications, imports, AI pipeline).
- **Search**: OpenSearch for full-text catalog search, autocomplete, and synonym expansion.
- **AI Gateway**: Unified abstraction over 5 LLM providers (OpenRouter, Gemini, Groq, and others) with automatic failover, circuit breaker, and SLA monitoring.
- **Event Bus**: EventEmitter2 for internal domain events (product created, quality updated, reward earned).

### Module Map

The API is organized into approximately 90+ feature modules, including:

| Module | Purpose |
|--------|---------|
| Auth | Registration, login, JWT, OAuth, password management |
| Catalog | Products, categories, brands, attributes, inventory |
| Search | TradFind search, OpenSearch integration, enterprise search |
| Smart RFQ | Request-for-quote lifecycle |
| Quote | Quote creation, revision, acceptance |
| Smart Negotiation | Buyer-seller negotiation with AI copilot |
| Purchase Order | Order creation, tracking, fulfillment |
| TradeServ | Professional services marketplace |
| TradeTalk | Community messaging and conversations |
| GOCASH | Digital wallet, rewards, campaigns, referrals |
| AI Gateway | Unified LLM access, credit system, streaming |
| TradeAI Agents | Seller, Buyer, Admin, Founder executive agents |
| Enterprise Intelligence | Predictive analytics, digital twin, health monitoring |
| Advertising | Sponsored products, CPC/CPM campaigns |
| Membership | Plan management, subscription tiers |
| TradTrust | Trust scoring and verification |
| Notification | In-app, email, and SMS notifications |

## API Base URL

All API endpoints are prefixed with:

```
/api/v1/
```

The full base URL for production is:

```
https://api.tradhexa.com/api/v1/
```

For sandbox/staging:

```
https://sandbox.api.tradhexa.com/api/v1/
```

## Response Envelope

All API responses follow a consistent envelope format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
    [key: string]: unknown;
  };
  timestamp: string; // ISO 8601
}
```

Example successful response:

```json
{
  "success": true,
  "data": {
    "id": "prod_abc123",
    "name": "Industrial Grade Widget",
    "price": 149.99
  },
  "meta": null,
  "timestamp": "2026-07-16T10:30:00.000Z"
}
```

## Error Format

Errors are returned with a structured error envelope:

```typescript
interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

Example error response:

```json
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "price must not be less than 0"
  ],
  "error": "Validation Error",
  "timestamp": "2026-07-16T10:30:00.000Z",
  "path": "/api/v1/products"
}
```

Common HTTP status codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable entity |
| 429 | Rate limited |
| 402 | Insufficient AI credits |
| 500 | Internal server error |

## Pagination

Paginated endpoints return results in a standardized format:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

Query parameters for pagination:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 10 | Items per page (max 100) |
| `sort` | string | varies | Sort field (e.g., `createdAt`, `name`) |
| `order` | `asc` | `desc` | Sort direction |

Example request:

```
GET /api/v1/products?page=2&limit=20&sort=createdAt&order=desc
```

Example response:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 156,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": true
  },
  "timestamp": "2026-07-16T10:30:00.000Z"
}
```

## Authentication Flow

The API uses JWT-based authentication with refresh token rotation.

1. **Register** an account via `POST /auth/register`, `POST /auth/register/buyer`, or `POST /auth/register/vendor`.
2. **Login** via `POST /auth/login` to receive an access token (15-minute expiry) and refresh token (7-day expiry).
3. **Attach** the access token to all authenticated requests via the `Authorization: Bearer <token>` header.
4. **Refresh** the access token via `POST /auth/refresh` when it expires. The old refresh token is invalidated.
5. **Logout** via `POST /auth/logout` to invalidate the current refresh token.

See the [Authentication Guide](AUTH_GUIDE.md) for detailed code examples.

## Rate Limiting

Rate limits are enforced per IP address and per endpoint category:

| Category | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 5 requests | 1 minute |
| Search endpoints | 30 requests | 1 minute |
| General endpoints | 100 requests | 1 minute |
| AI endpoints | Plan-based credits | Monthly |

When rate-limited, the API returns HTTP 429 with a `Retry-After` header indicating seconds until the next allowed request. See the [Rate Limiting Guide](RATE_LIMITING.md) for details.

## SDK Status

There is no official SDK at this time. The API is consumed directly via HTTP using REST conventions. Bindings can be generated from the OpenAPI specification available at `/api/docs`.

Supported approaches for integration:

- **TypeScript/JavaScript**: Use `fetch` (Node 18+) or `axios`. See code examples throughout these guides.
- **Python**: Use `requests` or `httpx`.
- **Java**: Use `OkHttp` or `WebClient`.
- **.NET**: Use `HttpClient`.
- **Postman/Insomnia**: Import the OpenAPI spec from `/api/docs`.

## Getting Help

- **Interactive API documentation**: Available at `/api/docs` when the server is running (Swagger UI).
- **OpenAPI specification**: Available at `/api/docs-json` for tooling integration.
- **Support**: Contact the TradHexa support team through the platform's support ticket system or email api-support@tradhexa.com.
- **Status page**: Check https://status.tradhexa.com for platform availability.

## TypeScript Example: Making API Calls

```typescript
const API_BASE = 'https://api.tradhexa.com/api/v1';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    ...options,
  });

  const body = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      ...body,
    };
  }

  return body.data;
}

// Authenticated request helper
async function authRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}
```
