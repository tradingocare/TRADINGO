# TRADINGO Performance Standard

## Caching Strategy

| Layer | Technology | Cache Policy | TTL |
|-------|-----------|-------------|-----|
| AI Responses | Redis | MD5 hash of taskType+payload | 3600s default |
| AI Idempotency | Redis | Idempotency key → response | 86400s (24h) |
| API Queries | Redis (RedisService) | Per-use-case | Configurable |
| React Query | In-memory | stale-while-revalidate | Per-query (30s-5min) |
| Zustand | localStorage | persist middleware | Until cleared |
| Next.js | ISR/SSG | Static generation | Per-page |
| CDN | CloudFront | Static assets | 24h+ |

## Redis Configuration

- **Use**: Cache, BullMQ queues, Socket.IO pub/sub, rate limiting
- **Persistence**: RDB snapshots + AOF log
- **Eviction**: allkeys-lru (maxmemory-policy)
- **Connection pool**: Via ioredis (RedisService)

## Pagination

All list endpoints use the shared pagination utility:
- `buildPaginationQuery()` → `{ skip, take, orderBy }`
- `buildPaginatedResult()` → `{ data, meta: { total, page, limit, totalPages, hasNext, hasPrevious } }`
- Default page size: 10
- Max page size: 100

## Database Indexes

- **Total indexes**: 620
- **Every FK indexed**: True
- **High-query models**: 8-10 indexes each
- **Date-range queries**: Indexed on `createdAt`
- **Composite indexes**: For common query patterns
- **Full-text search**: Handled by OpenSearch, not PostgreSQL

## Query Optimization

- **N+1 prevention**: Prisma `include` / `select` for relation loading
- **Batch loading**: `Promise.all` for independent queries
- **Pagination**: `skip`/`take` (not offset for large datasets where possible)
- **Soft delete filtering**: `deletedAt: null` in where clauses (indexed)
- **Count optimization**: Prisma `count()` without loading data

## Frontend Optimization

- **Next.js output**: `standalone` for optimized Docker deployment
- **Image optimization**: Next.js Image with Cloudinary CDN
- **Code splitting**: Automatic via Next.js App Router
- **Bundle optimization**: Tree-shaking, lucide-react individual imports
- **Font optimization**: Inter font via next/font
- **Web Vitals**: CLS, LCP, FID, INP tracking

## AI Optimization

- **Caching**: Redis cache with MD5 hash of taskType+payload
- **Idempotency**: Same request with same key returns cached result
- **Model selection**: Best model per task (smaller/faster models for simple tasks)
- **Provider fallback**: Circuit breaker prevents repeated failures
- **Cost tracking**: Per-company, per-task spending limits

## OpenSearch

- **Purpose**: Full-text product/company search
- **Features**: Faceted search, geo-spatial, autocomplete, trending
- **Relevance tuning**: Via TradFind search ranking service
- **Index strategy**: Per-entity indexes with mapping

## ClickHouse

- **Purpose**: Event analytics, dashboard metrics, funnel analysis
- **Data**: Append-only event streams
- **Retention**: Configurable (default: 90 days raw, 365 days aggregated)
- **Queries**: Aggregated via AnalyticsService, not raw SQL from client

## Monitoring Metrics

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| API latency (p95) | Prometheus | > 500ms |
| Error rate | Prometheus | > 1% |
| AI latency | UsageTracker | > 10s |
| Redis memory | Prometheus | > 80% |
| DB connections | RDS metrics | > 80% |
| Queue depth | BullMQ | > 1000 |
| Cache hit rate | UsageTracker | < 50% |
