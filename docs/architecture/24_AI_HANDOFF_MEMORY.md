# TRADINGO AI Handoff Memory

> This document enables any AI assistant or engineer to resume development immediately with zero context loss.

## Project State

- **Repository**: `E:\tradingo` on Windows
- **Current Phase**: Production Launch (Phase 8) — staging smoke tests, monitoring, load testing
- **Last Completed Phase**: Phase 18.4 — Founder AI Executive Operating System
- **Package Manager**: pnpm (NOT npm)
- **Node Commands**: Use `pnpm` for all package operations
- **Build System**: Turborepo (`turbo` commands)

## Critical Commands

```bash
pnpm dev              # Start both apps in dev mode
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm typecheck        # TypeScript check all apps
pnpm db:generate      # Generate Prisma client
pnpm db:validate      # Validate Prisma schema
pnpm db:migrate       # Run Prisma migrations
pnpm test             # Run tests
npx next build       # Build Next.js (run from apps/web)
npx tsc --noEmit     # TypeScript check (run from api or web)
```

## Frozen Modules (DO NOT MODIFY)

These are CERTIFIED AND FROZEN:
- `GOCASH_Wallet`, `GOCASH_Transaction`, `GOCASH_Redemption` Prisma models
- `GocashService` (gocash.service.ts) — core ledger engine
- `GOCASHLedgerDirection`, `GOCASHLedgerStatus`, `GOCASHTransactionType` enums
- TradTrust scoring engine weights
- `normalizeStatus()` in status-badge.tsx
- Role enum canonical values (uppercase)

## Coding Standards

1. **No comments** — Self-documenting code only
2. **No `any` type** — Use proper TypeScript generics
3. **DTOs always** — Every endpoint has a typed DTO with class-validator
4. **Explicit onDelete** — Every Prisma relation must have explicit onDelete
5. **Shared pagination** — Use `buildPaginationQuery` / `buildPaginatedResult`
6. **Thin frontend** — Components receive data via props, no fetch logic in components
7. **Error states** — Every data fetch shows loading/empty/error states
8. **Audit first** — Search existing code before creating anything new
9. **Reuse before create** — If a component/hook/API function/DTO exists, reuse it
10. **No placeholder/TODO** — Every feature must be fully implemented

## Architecture Patterns

### Adding a New API Endpoint
1. Create DTO in module's `dto/` directory with class-validator decorators
2. Add method to service
3. Add endpoint to controller with proper guards (`@Roles()`, `@Public()`, etc.)
4. Add to frontend API client in `lib/api/`
5. Add React Query hook in `hooks/`
6. Create/update component

### Adding a New AI Feature
1. Add action to existing domain service (e.g., `AiSearchService.addNewMethod()`)
2. Add endpoint to controller (e.g., `/search/ai/new-feature`)
3. Create DTO for request/response
4. Add auto-seed prompt in `onModuleInit()`
5. Add frontend API function + hook
6. Add to copilot component or page

### Adding a New Prisma Model
1. Add to `prisma/schema.prisma` with explicit `@relation` and `onDelete`
2. Run `pnpm db:generate`
3. Run `pnpm db:validate`
4. Create module with service + controller + DTOs

## Business Rules

1. Role canonical values: `ADMIN`, `SUPER_ADMIN`, `SELLER`, `BUYER` (uppercase)
2. Pagination format: `{ data, meta: { total, page, limit, totalPages, hasNext, hasPrevious } }`
3. API response format: `{ statusCode, message, data, timestamp }`
4. Error response format: `{ statusCode, message[], error, timestamp, path }`
5. Validation error format: `{ statusCode: 400, message: string[], error: "Validation Error", timestamp }`
6. AI credit check: HTTP 402 if insufficient credits, returns `{ available, required }`
7. GOCASH rewards: Must use idempotency key (`referenceType_refId_userId`)
8. onDelete policies: Cascade for children, Restrict for critical chain, SetNull for optional

## Module Locations

- **Backend modules**: `apps/api/src/modules/<module-name>/`
- **Frontend pages**: `apps/web/app/<route>/`
- **Frontend components**: `apps/web/components/<domain>/`
- **Frontend hooks**: `apps/web/hooks/use-<feature>.ts`
- **Frontend API**: `apps/web/lib/api/<feature>.ts`
- **Shared utilities**: `packages/utils/src/`
- **Shared types**: `packages/types/src/`
- **Shared contracts**: `packages/contracts/src/`
- **Prisma schema**: `prisma/schema.prisma`
- **Frontend data (navs, categories)**: `apps/web/data/`

## Things Never to Modify

1. Prisma schema models starting with `GOCASH_` (frozen)
2. `packages/gocash/` (placeholder package)
3. Legacy `go-cash/` module (will be deprecated)
4. `gocash.service.ts` core methods (frozen ledger engine)
5. Production audit findings marked "Frozen" in AGENTS.md
6. Any module not related to the current fix/feature

## Environment

- **OS**: Windows (PowerShell 5.1)
- **Path separator**: Backslash (`\`)
- **API**: `http://localhost:3001` (NestJS + Fastify)
- **Web**: `http://localhost:3000` (Next.js 16)
- **Database**: PostgreSQL via Prisma
- **Redis**: Local instance for cache + BullMQ + Socket.IO
