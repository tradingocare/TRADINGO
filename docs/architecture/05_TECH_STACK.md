# TRADINGO Tech Stack (Locked)

## Locked Technologies

These technologies are locked and must NOT be changed without architecture review:

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Backend Framework** | NestJS | 11.x | Opinionated, modular, TypeScript-native, Guards/Interceptors/Pipes pattern |
| **Backend HTTP** | Fastify | 5.x | 2x faster than Express, native async, schema-based serialization |
| **Frontend Framework** | Next.js | 16.x | React server components, App Router, file-based routing, SSR/SSG |
| **Frontend UI** | React | 19.x | Industry standard, server components, hooks |
| **Language** | TypeScript | 5.7.x | Type safety across full stack |
| **Package Manager** | pnpm | 9.15.x | Disk-efficient, strict dependency resolution |
| **Monorepo** | Turborepo | 2.x | Parallel task execution, caching, dependency graph |
| **ORM** | Prisma | 6.x | Type-safe DB access, auto-generated client, migrations |
| **Database** | PostgreSQL | 16.x | ACID compliance, JSON support, mature ecosystem |
| **Cache/Queue** | Redis | 7.x | BullMQ queues, caching, pub/sub, rate limiting |
| **Analytics DB** | ClickHouse | Latest | Columnar storage for event analytics |
| **Search** | OpenSearch | Latest | Full-text search, faceted search, geo search |
| **State Management** | TanStack Query | 5.x | Server state, caching, optimistic updates |
| **State (Client)** | Zustand | 5.x | Lightweight, no boilerplate, persist middleware |
| **Forms** | React Hook Form | 7.x | Performant, uncontrolled, validation integration |
| **Validation (Frontend)** | Zod | 3.x | TypeScript-first schema validation |
| **Validation (Backend)** | class-validator + class-transformer | Latest | Decorator-based DTO validation |
| **Icons** | Lucide React | 0.460.x | Consistent, tree-shakeable icon library |
| **Animation** | Framer Motion | 12.x | Declarative animations, layout animations, gesture support |
| **WebSocket** | Socket.IO | 4.x | Redis adapter for horizontal scaling |
| **Maps** | Leaflet + React-Leaflet | Latest | Open-source map rendering |
| **Payments** | Razorpay (primary), Stripe | Latest | Indian market primary, international fallback |
| **SMS** | Twilio | Latest | Reliable SMS delivery |
| **AI (Primary)** | OpenRouter | API | Multi-model access through single API |
| **AI (Fallback)** | Gemini, Groq, Tavily, Firecrawl | API | Provider redundancy |
| **Monitoring** | Sentry + Prometheus + Grafana | Latest | Error tracking + metrics + dashboards |
| **Auth** | JWT + Passport | Latest | Industry standard, OAuth support |
| **Container** | Docker | Latest | Consistent deployment |
| **Orchestration** | AWS ECS (Fargate) | Latest | Serverless container hosting |

## Why Each Technology

### NestJS + Fastify
NestJS provides enterprise-grade module organization with dependency injection, guards, interceptors, and pipes. Fastify is chosen over Express for its 2x performance advantage and native async support. The `@nestjs/platform-fastify` adapter bridges the two.

### Next.js 16 + React 19
Next.js provides file-based routing, SSR/SSG/ISR, server components, and middleware. React 19 brings server components, actions, and improved concurrent features. The `output: 'standalone'` config enables Docker deployment.

### Prisma 6
Type-safe database access with auto-generated client. Schema-first approach with migrations. PostgreSQL provides ACID compliance needed for financial transactions.

### BullMQ + Redis
Enterprise-grade job queues with scheduling, retries, rate limiting, and concurrency control. Redis serves triple duty: cache, queue broker, and pub/sub for Socket.IO.

### TanStack Query (React Query) + Zustand
React Query handles all server state (caching, refetching, optimistic updates). Zustand handles client-only state (auth, checkout, comparison, wishlist, RFQ wizard). This separation prevents server state pollution.

### ClickHouse
Columnar analytics database optimized for event streams. Used for platform analytics, not transactional data.

### OpenSearch
Full-text search engine with advanced faceting, geo-spatial queries, and relevance tuning. Powers TradFind search.

### Razorpay + Stripe
Razorpay is primary for Indian market (native UPI, NetBanking, cards). Stripe is fallback for international buyers.

### OpenRouter + Multi-Provider AI
OpenRouter provides access to 200+ models through a single API with fallback. Gemini, Groq, Tavily, and Firecrawl are backup providers with specific strengths (speed, search, web scraping). The circuit breaker pattern ensures resilience.
