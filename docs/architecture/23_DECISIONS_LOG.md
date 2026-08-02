# TRADINGO Architectural Decisions Log

## Core Architecture Decisions

### D-001: Monorepo with Turborepo + pnpm
- **Decision**: Use Turborepo + pnpm for monorepo management
- **Rationale**: Fast parallel builds, dependency caching, strict dependency isolation
- **Alternatives**: Nx (more complex), Lerna (slower), single repo (no isolation)
- **Date**: Foundation

### D-002: NestJS + Fastify (not Express)
- **Decision**: Use NestJS with Fastify adapter instead of Express
- **Rationale**: Fastify is 2x faster, native async, schema-based serialization. NestJS provides enterprise-grade module system
- **Alternatives**: NestJS + Express (slower), plain Fastify (no DI/module system)
- **Date**: Foundation

### D-003: Prisma ORM (not TypeORM / Drizzle)
- **Decision**: Use Prisma 6 as the ORM
- **Rationale**: Type-safe queries, auto-generated client, push-based migrations, schema-first
- **Alternatives**: TypeORM (complex decorators, slower), Drizzle (newer, less ecosystem)
- **Date**: Foundation

### D-004: Single Prisma Schema (not per-module)
- **Decision**: Centralized `schema.prisma` at monorepo root
- **Rationale**: Single source of truth for database, easier migration management, cross-model relations
- **Alternatives**: Per-module schemas (merge complexity), per-app databases (no cross-module queries)
- **Date**: Foundation

### D-005: Append-only GOCASH Ledger (not mutable balance)
- **Decision**: Immutable transaction log with balance snapshots
- **Rationale**: Audit trail, fraud detection, reconciliation. Every transaction records `balanceBefore`/`balanceAfter`
- **Alternatives**: Mutable balance (no audit trail), event sourcing (over-engineered)
- **Date**: Phase 15A.3

### D-006: Idempotency Keys for Financial Operations
- **Decision**: Every financial credit/debit requires idempotency key
- **Rationale**: Prevents duplicate rewards from race conditions, network retries, or reprocessing
- **Alternatives**: Optimistic locking (complex), no dedup (unsafe)
- **Date**: Phase 15A.3

### D-007: Single AI Gateway (not per-provider)
- **Decision**: Unify all AI calls through `AiGatewayService`
- **Rationale**: Centralized credit enforcement, caching, routing, fallback, monitoring, cost tracking
- **Alternatives**: Per-module direct provider calls (duplicate logic, no fallback), message queue (latency)
- **Date**: Phase 16.6C

### D-008: Circuit Breaker Pattern for AI Providers
- **Decision**: 5 consecutive failures = 60s circuit open
- **Rationale**: Prevents cascading failures, allows provider recovery, reduces costs
- **Alternatives**: Retry-only (no protection), exponential backoff only (no circuit)
- **Date**: Phase 16.6C

### D-009: Credit Enforcement Before AI Processing
- **Decision**: Check credits BEFORE any AI call, throw 402 if insufficient
- **Rationale**: No wasted AI spend, clear user feedback, plan monetization
- **Alternatives**: Post-processing deduction (waste if insufficient), no check (no enforcement)
- **Date**: Phase 16.7

### D-010: Direct Service Calls over Event Bus
- **Decision**: Services call each other directly rather than through a domain event bus
- **Rationale**: Simpler architecture, type-safe, easier debugging, no eventual consistency issues
- **Alternatives**: NestJS EventEmitter, CQRS event bus, RabbitMQ (more complex, eventual consistency)
- **Tradeoff**: Tight coupling between modules, harder to add new subscribers
- **Mitigation**: BullMQ for async operations, `GocashIntegrationService` for cross-domain rewards
- **Date**: Foundation

### D-011: Soft Delete on Core Entities
- **Decision**: 14 core models use `deletedAt` soft delete
- **Rationale**: Data recovery, audit trails, referential integrity
- **Alternatives**: Hard delete (data loss), archive table (complex queries)
- **Date**: Foundation

### D-012: Restrict on Critical FK Chains
- **Decision**: Financial, escrow, dispute, compliance relations use `onDelete: Restrict`
- **Rationale**: Prevents accidental deletion of critical business records
- **Alternatives**: Cascade (dangerous), SetNull (data integrity loss), NoAction (no protection)
- **Date**: Foundation

### D-013: Thin Frontend Pattern
- **Decision**: All data aggregation, calculations, and business logic in backend
- **Rationale**: Single source of truth for business rules, easier testing, API clients can be replaced
- **Alternatives**: Frontend aggregation (duplicate logic), GraphQL (over-engineered for current needs)
- **Date**: Foundation

### D-014: React Query + Zustand Separation
- **Decision**: React Query for server state, Zustand for client-only state
- **Rationale**: Clear separation, no server state pollution, Zustand for UI-only state
- **Alternatives**: Redux (boilerplate), Context (performance issues), TanStack Query only (no client state)
- **Date**: Foundation

### D-015: CompanyOwnerGuard for Multi-Tenancy
- **Decision**: Company isolation via `CompanyOwner` join table with dedicated guard
- **Rationale**: Clean multi-tenant isolation without modifying every query
- **Alternatives**: Row-level security (PostgreSQL dependent), tenant ID in every query (error-prone)
- **Date**: Foundation

### D-016: Global PrismaModule and RedisModule
- **Decision**: PrismaService and RedisService are `@Global()` modules
- **Rationale**: Available everywhere without explicit imports, reduces boilerplate
- **Alternatives**: Per-module imports (more explicit, more boilerplate)
- **Date**: Foundation

### D-017: DTOs with class-validator (not Zod in API)
- **Decision**: Backend uses class-validator/class-transformer, frontend uses Zod
- **Rationale**: NestJS ValidationPipe works natively with class-validator, Zod is better for frontend type inference
- **Alternatives**: Zod everywhere (no NestJS integration), Joi (less TypeScript integration)
- **Date**: Foundation

### D-018: Pagination Utility (not per-module)
- **Decision**: Shared `buildPaginationQuery()` / `buildPaginatedResult()` in `common/dto/pagination.dto.ts`
- **Rationale**: Consistent pagination format across all endpoints, no duplicate pagination logic
- **Alternatives**: Per-module pagination (duplicate code), Prisma-native skip/take (inconsistent format)
- **Date**: Foundation

### D-019: Uppercase Role Representation
- **Decision**: Canonical role values are uppercase (`ADMIN`, `SELLER`, `BUYER`)
- **Rationale**: Consistency across JWT, guards, database. `normalizeStatus()` handles case normalization.
- **Alternatives**: Lowercase (convention issue), PascalCase (inconsistent)
- **Date**: Sprint 1

### D-020: OnDelete Explicit on Every Relation
- **Decision**: Every Prisma `@relation` has explicit `onDelete` policy
- **Rationale**: Prevents cascading surprises, explicit intent for data lifecycle
- **Alternatives**: Default behavior (inconsistent), implicit cascade (dangerous)
- **Date**: Sprint 2A
