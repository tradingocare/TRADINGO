# TRADINGO® Project Constitution

## Vision

TRADINGO is the Enterprise B2B Marketplace that unifies **Marketplace + TradeServ Professional Services** into a single AI-powered platform. We connect verified Indian manufacturers, exporters, and service professionals with global buyers through an ecosystem of trust, intelligence, and rewards.

## Engineering Constitution

### Golden Rules

1. **Audit First** — Before ANY change, audit the existing codebase. Know what exists before adding.
2. **Reuse Before Create** — If a component, service, hook, API function, DTO, or pattern exists, reuse it. Never duplicate.
3. **Backend Aggregation** — All data aggregation, calculations, and business logic live in the backend. Frontend only displays.
4. **Thin Frontend** — Components receive data via props. No fetch logic in components. All API calls in hooks/API layer.
5. **Event Driven** — Domain events for cross-module communication. BullMQ for async processing.
6. **AI First** — AI is embedded in every workflow. Single AI Gateway for all providers. Credits enforce usage.
7. **Business First** — Every feature serves a business workflow. No placeholder code. No mock data in production.
8. **Provider Agnostic** — All external services (AI, payments, SMS, email) are abstracted behind interfaces with factory/provider pattern.

### Audit First Policy

Before implementing any change:
1. Search existing components (glob + grep)
2. Search existing hooks
3. Search existing API functions
4. Search existing services
5. Search existing DTOs
6. Check Prisma schema for existing models
7. Verify the module is not frozen/modified
8. Only then implement

### Coding Philosophy

- **No Comments** — Code should be self-documenting. Use descriptive names, not comments.
- **TypeScript Strict** — No `any`. Proper generics. Interface-first design.
- **DTO Everywhere** — Every endpoint has a typed DTO with class-validator decorators.
- **Explicit onDelete** — Every Prisma relation has an explicit onDelete policy.
- **Pagination Shared** — Use the shared pagination utility (`buildPaginationQuery`/`buildPaginatedResult`). No duplicate pagination logic.
- **Validation at Edge** — ValidationPipe globally with whitelist + transform + forbidNonWhitelisted.

### Frozen Modules

These modules are **CERTIFIED AND FROZEN** — do not modify unless explicitly required by a fix:
- `GOCASH_Wallet`, `GOCASH_Transaction`, `GOCASH_Redemption` (Prisma models)
- Core GOCASH Ledger Engine (`gocash.service.ts`)
- TradTrust scoring engine
- Production audit findings (see TRADINGO-PRODUCTION-AUDIT.md)
- All `GOCASHLedgerDirection`, `GOCASHLedgerStatus`, `GOCASHTransactionType` enums

### Stop Conditions

A phase stops when:
1. All verification passes (prisma validate, prisma generate, tsc api, tsc web, turbo typecheck, next build)
2. All new code is documented in AGENTS.md
3. Completion report is generated
4. Next phase implementation prompt is ready
5. **Do NOT ask "What next?"** — the output must be: `NEXT PHASE READY` with the complete prompt.

## Backend Aggregation Principle

All business logic, calculations, aggregations, and data transformations happen in the backend (NestJS services). The frontend (Next.js) is purely a presentation layer. This applies to:
- Statistics and analytics
- Health scores and rankings
- Credit calculations
- Eligibility checks
- Data joins and aggregations
- AI response processing

## Thin Frontend Principle

React components:
- Receive data via props (React Query results or passed from parent)
- Never contain fetch/api call logic directly
- Use hooks for all data fetching (custom hooks wrapping React Query)
- Show proper loading, empty, error states for every data dependency

## Event Driven Architecture

- BullMQ with Redis for async job processing
- 12 named queues (EMAIL, EXPORT, NOTIFICATION, CERTIFICATION, SUBSCRIPTION, RFQ, ESCROW, SETTLEMENT, DISPUTE, ANALYTICS, MALWARE, BESTSELLER, AI)
- Domain events via service method calls (not a formal event bus)
- Job processors for time-consuming operations
- Retry logic with exponential backoff per queue

## AI First Architecture

- Single `AiGatewayService` for ALL AI processing
- 19 `TaskType` values with associated credit costs (1-20 credits)
- 5 providers (OpenRouter, Gemini, Groq, Tavily, Firecrawl) with auto-fallback chain
- Circuit breaker (5 consecutive failures = 60s cooldown)
- Redis caching with configurable TTL
- Idempotency key deduplication
- Credits enforced at gateway BEFORE any AI processing (HTTP 402 if insufficient)
- 9 domain-specific AI modules, all following the same pattern

## Enterprise Standards

- JWT authentication with Passport (JWT + refresh token + Google + LinkedIn)
- RBAC with 7 roles (SUPER_ADMIN, ADMIN, MANAGER, SELLER, BUYER, RM, VIEWER)
- Company isolation via CompanyOwnerGuard
- Rate limiting (100 requests/60s)
- Sentry error tracking
- Prometheus metrics on port 9100
- Helmet security headers + CSRF protection
- Swagger docs at `/api/docs`
- OpenSearch for search
- ClickHouse for analytics
- Redis for caching + pub/sub + BullMQ

## Response Format

All API responses follow the `TransformInterceptor` format:

```typescript
{
  statusCode: number,
  message: string,
  data: T,
  timestamp: string
}
```

Error responses follow `AllExceptionsFilter` format:

```typescript
{
  statusCode: number,
  message: string[] | string,
  error: string,
  timestamp: string,
  path: string
}
```

Pagination uses the shared `PaginatedResponse<T>`:

```typescript
{
  data: T[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNext: boolean,
    hasPrevious: boolean
  }
}
```

## Locked Technologies

- **Framework**: NestJS 11 (backend), Next.js 16 (frontend)
- **Language**: TypeScript 5.7
- **Package Manager**: pnpm 9.15
- **Monorepo**: Turborepo 2.x
- **Database**: PostgreSQL (Prisma 6 ORM)
- **Cache/Queue**: Redis (BullMQ)
- **Analytics**: ClickHouse
- **Search**: OpenSearch
- **AI Providers**: OpenRouter (primary), Gemini, Groq, Tavily, Firecrawl
- **Payments**: Razorpay (primary), Stripe
- **SMS**: Twilio
- **Auth**: JWT + Passport (Google, LinkedIn OAuth)
- **WebSocket**: Socket.IO with Redis adapter
- **Monitoring**: Sentry, Prometheus, Grafana
- **Icons**: Lucide React
- **Animation**: Framer Motion 12
- **State Management**: React Query 5 + Zustand 5
- **Forms**: React Hook Form 7 + Zod 3
- **Maps**: Leaflet + React Leaflet
