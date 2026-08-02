# TRADINGO Observability

## Monitoring Stack

| Component | Tool | Purpose | Endpoint/Port |
|-----------|------|---------|---------------|
| Metrics | Prometheus | Collect HTTP metrics, AI usage, queue stats | Port 9100 (internal) |
| Dashboards | Grafana | Visualize metrics, alerts | Pre-built JSON at `monitoring/grafana-dashboard.json` |
| Error Tracking | Sentry | Capture exceptions with breadcrumbs | API + Frontend SDKs |
| Health Checks | HealthController | Liveness, readiness, deep health | `GET /live`, `/ready`, `/health` |
| Performance | Web Vitals | CLS, LCP, FID, INP | Frontend tracking |
| AI Monitoring | UsageTrackerService | Per-company token usage, latency, cost | Custom dashboard |
| Logging | LoggingInterceptor | HTTP request logging | Console/Sentry |
| Queue Monitoring | BullMQ | Queue depth, job status | BullMQ dashboard |

## Health Endpoints

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `GET /api/v1/live` | Liveness check | `{ status: 'ok' }` |
| `GET /api/v1/ready` | Readiness check | `{ status: 'ok', db: 'connected', redis: 'connected' }` |
| `GET /api/v1/health` | Deep health | `{ status, uptime, database, redis, memory }` |

## Metrics (Prometheus)

Collected automatically on the internal HTTP server (port 9100):
- HTTP request count (by method, route, status)
- HTTP request duration (histogram)
- HTTP request in-flight
- Error count
- BullMQ queue metrics (depth, processing, failed)
- AI Gateway metrics (requests, latency, cache hit rate)
- Process metrics (memory, CPU, event loop lag)

## Sentry Configuration

### API (NestJS)
- DSN configured via `SENTRY_DSN` env var
- `SentryInterceptor` captures all exceptions
- User context attached (ID, email, role)
- Breadcrumbs for database queries and HTTP calls

### Frontend (Next.js)
- `@sentry/nextjs` with server + client + edge configs
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- User context for authenticated sessions
- Performance tracing for page loads

## Alerting Rules

> Source: `monitoring/alerting-rules.yml`

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | Error rate > 1% over 5m | Critical |
| HighAPILatency | p95 latency > 500ms | Warning |
| HighAILatency | Average AI latency > 10s | Warning |
| RedisMemoryHigh | Memory usage > 80% | Warning |
| QueueBacklog | Queue depth > 1000 | Warning |
| LowCacheHitRate | Cache hit rate < 50% | Info |
| CertificateExpiring | SSL cert < 30 days | Warning |

## Logging Format

```typescript
// LoggingInterceptor format
`[${method}] ${url} - ${statusCode} - ${duration}ms`

// Example
[POST] /api/v1/gocash/wallets/123/credit - 200 - 45ms

// Error logging
[ERROR] Failed to process transaction: Insufficient balance
```

## AI Usage Tracking

Tracked in `AiUsage` Prisma model and accessible via admin endpoints:
- Per-company: Total calls, tokens, cost
- Per-task-type: Most used features
- Per-provider: Success rate, latency
- Cache hit rate
- Daily/weekly/monthly trends

## Backup Strategy

> Documented in `monitoring/backup-strategy.md`

- PostgreSQL: Daily automated backups with 30-day retention
- Redis: RDB snapshots + AOF for persistence
- ClickHouse: Time-based partitioning for data lifecycle
- S3: Cross-region replication for backup files
- Backup testing: Monthly restore drill
