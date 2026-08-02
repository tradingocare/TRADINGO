# Tradingo API Rate Limiting Guide

## Overview

Tradingo implements rate limiting to ensure platform stability and fair resource allocation. Limits are applied per IP address and grouped by endpoint category. Exceeding a limit returns HTTP 429 (Too Many Requests).

## Rate Limit Tiers

| Tier | Endpoints | Limit | Window | Example Endpoints |
|------|-----------|-------|--------|-------------------|
| Auth | Authentication | 5 requests | 1 minute | `/auth/login`, `/auth/register`, `/auth/forgot-password` |
| Search | Product/Services search | 30 requests | 1 minute | `/products/search`, `/tradeserv/search`, `/categories` |
| General | All other endpoints | 100 requests | 1 minute | `/products`, `/smart-rfq`, `/orders`, `/gocash/*` |
| AI | AI-powered features | Plan-based | Monthly | `/ai-gateway/*`, `/smart-rfq/:id/ai/*`, `/quotes/:id/ai/*` |

## AI Credits

AI endpoints are not rate-limited by time window but by a credit system tied to the company's membership plan:

| Plan | Monthly AI Credits |
|------|--------------------|
| TRAD UP | 20 |
| Trade Start | 50 |
| Trade Smart | 100 |
| Trade Plus | 250 |
| Trade Pro | 500 |
| Trade Premium | 1000 |
| Trade Elite | 2500 |

Each AI action consumes a fixed number of credits:

| Task Type | Credits per Call |
|-----------|------------------|
| `NEGOTIATION` | 20 |
| `FINANCE_ANALYSIS` | 10 |
| `ADMIN_INTELLIGENCE` | 10 |
| `SEARCH_ANALYSIS` | 5 |
| `CATEGORY_SUGGESTION` | 5 |
| `CRM_ANALYSIS` | 10 |

When credits are exhausted, the API returns HTTP 402 (Payment Required) with the available and required credit amounts.

## Rate Limit Headers

Every response includes rate limit information in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1626429000
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

## Handling 429 Responses

When rate-limited, the API returns:

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please retry after 45 seconds.",
  "error": "Too Many Requests",
  "timestamp": "2026-07-16T10:30:00.000Z",
  "path": "/api/v1/auth/login"
}
```

The `Retry-After` header indicates the number of seconds to wait:

```
Retry-After: 45
```

### TypeScript Retry Handler

```typescript
async function rateLimitedRequest<T>(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get('Retry-After') || '10',
        10
      );
      const waitMs = retryAfter * 1000 + 1000; // Add 1s buffer
      console.warn(
        `Rate limited. Waiting ${retryAfter}s (attempt ${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    const body = await response.json();
    if (!response.ok) throw body;
    return body.data;
  }

  throw new Error('Max retries exceeded');
}

// Usage
const products = await rateLimitedRequest(
  'https://api.tradhexa.com/api/v1/products/search?q=widget',
  { headers: { Authorization: `Bearer ${token}` } }
);
```

## Best Practices

### 1. Implement Client-Side Caching

Reduce unnecessary API calls by caching responses locally:

```typescript
const cache = new Map<string, { data: unknown; expiresAt: number }>();

async function cachedRequest<T>(endpoint: string, ttlMs = 60000): Promise<T> {
  const cached = cache.get(endpoint);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json();
  if (!response.ok) throw body;

  cache.set(endpoint, { data: body.data, expiresAt: Date.now() + ttlMs });
  return body.data;
}
```

### 2. Use Exponential Backoff

When retrying requests, increase the wait time exponentially:

```typescript
async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (error instanceof Object && 'status' in error && (error as { status: number }).status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 3. Batch Requests

Combine multiple operations into fewer API calls where possible. Many list endpoints support filtering and sorting to reduce the need for multiple requests.

### 4. Monitor Rate Limit Headers

Track the `X-RateLimit-Remaining` header and slow down requests when the remaining count drops below a threshold:

```typescript
async function monitoredRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10);
  if (remaining < 10) {
    console.warn(`Rate limit low: ${remaining} remaining`);
  }

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

### 5. Separate Auth Client

Use a dedicated client instance for auth endpoints to isolate the stricter rate limits:

```typescript
class AuthClient {
  private lastRequestTime = 0;
  private readonly minIntervalMs = 12000; // 5 req/min = 1 per 12s

  async request<T>(endpoint: string, body: unknown): Promise<T> {
    const now = Date.now();
    const waitMs = this.minIntervalMs - (now - this.lastRequestTime);
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    this.lastRequestTime = Date.now();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data.data;
  }
}
```

### 6. Use Webhooks Instead of Polling

For event-driven integrations, register webhook endpoints to receive real-time notifications instead of polling APIs. See [WEBHOOKS.md](WEBHOOKS.md) for details.

## FAQ

**Q: What happens if I exceed the rate limit?**
A: The API returns HTTP 429 with a `Retry-After` header. Your client should wait the specified duration before retrying.

**Q: Are rate limits per user or per IP?**
A: Auth endpoints are limited per IP. All other endpoints are limited per user (by JWT token). Unauthenticated requests are limited per IP.

**Q: Can I request a higher rate limit?**
A: Enterprise plans may qualify for higher limits. Contact api-support@tradhexa.com with your use case.

**Q: Do AI credits reset?**
A: Yes, AI credits reset at the beginning of each billing cycle (monthly). Unused credits do not roll over.

**Q: Is there a burst limit?**
A: No burst limit is enforced beyond the stated per-minute limits. However, sustained high-volume traffic may trigger additional safeguards.
