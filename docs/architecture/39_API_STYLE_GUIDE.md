# TRADINGO API Style Guide

## URL Conventions

- **Base path**: `/api/v1/`
- **Plural nouns**: `/users`, `/products`, `/gocash/wallets`
- **Nested resources**: `/companies/:id/locations`
- **Actions as last segment**: `/wallets/:id/credit`, `/negotiations/:id/accept`
- **Query params**: Pagination, filters, search

## Endpoint Patterns

### CRUD Pattern
```
GET    /resources       — List (paginated)
POST   /resources       — Create
GET    /resources/:id   — Get by ID
PATCH  /resources/:id   — Partial update
DELETE /resources/:id   — Soft delete
```

### Action Pattern (for commands/operations)
```
POST   /resources/:id/action     — e.g., /wallets/:id/freeze
POST   /resources/:id/submit     — e.g., /orders/:id/submit
```

### Search Pattern
```
GET    /resources/search?q=...   — Full-text search
GET    /resources?search=...     — Simple search
```

### AI Pattern
```
POST   /resources/:id/ai/:action — AI feature on resource
GET    /resources/ai/:action     — AI feature (resource-independent)
```

## Request Format

### POST/PATCH Bodies
- JSON format
- Use DTOs with class-validator decorators
- snake_case for query params, camelCase for JSON fields
- `Content-Type: application/json`

### Query Parameters
```typescript
// Pagination
?page=1&limit=10

// Filters
?status=ACTIVE&type=BUYER

// Search
?search=keyword

// Sort
?sortBy=createdAt&sortOrder=desc

// Date range
?from=2026-01-01&to=2026-07-04
```

## Response Format

### Success
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

### Created
```json
{
  "statusCode": 201,
  "message": "Created",
  "data": { ... },
  "timestamp": "..."
}
```

### Paginated
```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Validation Error
```json
{
  "statusCode": 400,
  "message": ["amount must not be less than 0.01", "type must be a valid enum value"],
  "error": "Validation Error",
  "timestamp": "..."
}
```

### General Error
```json
{
  "statusCode": 404,
  "message": "Wallet not found",
  "error": "Not Found",
  "timestamp": "...",
  "path": "/api/v1/gocash/wallets/123"
}
```

### AI Credit Error
```json
{
  "statusCode": 402,
  "message": "Insufficient AI credits",
  "available": 5,
  "required": 10,
  "timestamp": "..."
}
```

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Validation error / Bad request |
| 401 | Unauthorized (no JWT) |
| 403 | Forbidden (wrong role/permission) |
| 404 | Not found |
| 402 | Insufficient credits (AI) |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Internal server error |

## Authentication

- **Bearer token** in Authorization header
- `Authorization: Bearer <jwt_token>`
- Public routes: No auth required
- Admin routes: `@Roles('ADMIN', 'SUPER_ADMIN')`
- Protected routes: JWT required

## Error Response Best Practices

1. **Not found**: Use `NotFoundException('Human-readable message')`
2. **Validation**: Use `BadRequestException('message')` or let ValidationPipe handle it
3. **Authorization**: Use `UnauthorizedException()` / `ForbiddenException()`
4. **Business logic**: Use `HttpException({ ... }, statusCode)` for custom errors
5. **Never expose**: Stack traces, internal IDs, or sensitive data in error messages
