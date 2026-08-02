# TRADINGO Production Launch Checklist

## Pre-Launch Verification

### Environment Configuration
- [ ] `.env` file contains ALL required variables from `.env.example` (50+ vars)
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique, random 64+ char strings
- [ ] `NODE_ENV=production` set in production environment
- [ ] `FRONTEND_URL` points to production domain (https://tradingo.io)
- [ ] `DATABASE_URL` uses production PostgreSQL connection string
- [ ] `REDIS_URL` uses production Redis connection string
- [ ] `OPENSEARCH_URL` uses production OpenSearch endpoint
- [ ] `NODE_OPTIONS=--max-old-space-size=2048` set for API
- [ ] `LOG_LEVEL=info` for production (not debug)

### Secrets Management
- [ ] All `CHANGE_ME` placeholders replaced in K8s secrets
- [ ] JWT secrets stored in secrets manager (not in env files)
- [ ] AWS credentials (ACCESS_KEY_ID, SECRET_ACCESS_KEY) configured
- [ ] Razorpay/Stripe API keys configured
- [ ] SMTP credentials configured for email delivery
- [ ] Twilio credentials configured for SMS
- [ ] AI provider API keys configured (OpenRouter, Gemini, Groq, Tavily, Firecrawl)
- [ ] Sentry DSN configured
- [ ] CSRF_SECRET configured
- [ ] AI_VAULT_MASTER_KEY configured (not default)

### SSL/TLS
- [ ] TLS certificate issued via cert-manager/Let's Encrypt
- [ ] Wildcard certificate for *.tradingo.io
- [ ] Certificate auto-renewal configured
- [ ] HSTS header sending (max-age=31536000, preload)
- [ ] HTTP→HTTPS redirect configured

### Monitoring
- [ ] Prometheus scraping `/api/v1/metrics` successfully
- [ ] Grafana dashboards populated with data
- [ ] Alertmanager configured with Slack/PagerDuty receivers
- [ ] Sentry capturing errors from API (NODE_ENV=production)
- [ ] Sentry capturing errors from Web (client + server)
- [ ] Web Vitals RUM data flowing (check browser console /api/vitals)
- [ ] Redis metrics visible (hit rate, memory, connections)
- [ ] PostgreSQL metrics visible (connections, query time, cache hit ratio)
- [ ] Node/cadvisor metrics visible (CPU, memory, disk)
- [ ] Custom Prometheus metrics working: api_http_requests_total, api_http_request_duration_seconds, api_http_connections_active

### Alerting
- [ ] APIHighErrorRate alert fires correctly (5xx > 5%)
- [ ] APIHighLatency alert fires correctly (P95 > 2s)
- [ ] APIDown alert fires correctly (up == 0)
- [ ] HighMemoryUsage alert fires correctly (mem < 10%)
- [ ] HighDiskUsage alert fires correctly (disk < 10%)
- [ ] PostgresDown alert fires correctly (pg_up == 0)
- [ ] QueueBacklog alert fires correctly (BullMQ > 1000)
- [ ] Slack/PagerDuty notification received on test alert

### Logging
- [ ] API logs at `info` level (not debug)
- [ ] Pino JSON format enabled for production
- [ ] Logs shipped to centralized logging (ELK/Loki)
- [ ] Request logging includes: method, url, statusCode, durationMs
- [ ] Error logs include: stack trace, correlationId, reqId
- [ ] Audit log entries being created for auth/security events
- [ ] No sensitive data in logs (passwords, tokens, PII masked)

### Health Checks
- [ ] `GET /api/v1/live` returns 200
- [ ] `GET /api/v1/ready` returns 200 (checks DB, Redis, OpenSearch)
- [ ] `GET /` returns 200 (Next.js web)
- [ ] Kubernetes liveness probes passing
- [ ] Kubernetes readiness probes passing
- [ ] Kubernetes startup probes passing (if configured)
- [ ] Docker HEALTHCHECK passing for API container

### Docker
- [ ] API Dockerfile builds with 0 errors
- [ ] Web Dockerfile builds with 0 errors
- [ ] API Dockerfile sets ENV NODE_ENV=production
- [ ] Web Dockerfile has HEALTHCHECK instruction
- [ ] Image sizes optimized (multi-stage, production deps only)
- [ ] Images tagged with git SHA (not :latest)
- [ ] Images pushed to container registry

### Kubernetes (if using K8s)
- [ ] All 13 K8s manifests applied
- [ ] Secrets created from template (not committed)
- [ ] Ingress configured with TLS
- [ ] Ingress rate limiting configured (100 rps, burst 300)
- [ ] PodDisruptionBudget created (api: minAvailable=2)
- [ ] Pod anti-affinity configured
- [ ] HPA functional (scaling based on CPU/Memory)
- [ ] Rolling update strategy configured (maxSurge=1, maxUnavailable=0)
- [ ] Resource limits applied to all pods
- [ ] PVCs bound (PostgreSQL 100Gi, Redis 10Gi)
- [ ] Network policies restrict pod-to-pod traffic

### Redis
- [ ] Redis 7 running (AOF enabled, RDB snapshots)
- [ ] Maxmemory-policy set to allkeys-lru
- [ ] Connection limit configured (maxclients)
- [ ] TLS enabled for Redis connections
- [ ] Redis password/ACL configured
- [ ] Backup cron job running (RDB to S3)
- [ ] Socket.IO adapter connected

### PostgreSQL
- [ ] PostgreSQL 16 running
- [ ] Connection pool configured (pgBouncer recommended)
- [ ] Max connections configured
- [ ] WAL archiving enabled for PITR
- [ ] Daily full backup running (pg_dump to S3)
- [ ] Backup retention policy applied (30d hot, 90d glacier, 365d deep archive)
- [ ] Database migration applied (prisma migrate deploy)
- [ ] Indexes created (414+ total)
- [ ] VACUUM/ANALYZE scheduled
- [ ] Query performance baseline captured

### OpenSearch
- [ ] OpenSearch running and accessible
- [ ] Enterprise indices created (brands, attributes, synonyms, mappings)
- [ ] TradFind indices created (products, companies, categories)
- [ ] Snapshot repository configured (S3)
- [ ] Index lifecycle policy configured
- [ ] Query timeout configured (10s)

### AI Providers
- [ ] OpenRouter API key valid (test request succeeds)
- [ ] Gemini API key valid
- [ ] Groq API key valid
- [ ] Tavily API key valid
- [ ] Firecrawl API key valid
- [ ] AI credits seeded for admin account
- [ ] Default AI prompts seeded in database

### Backups Verified
- [ ] PostgreSQL full backup successful
- [ ] WAL archiving active (check pg_stat_archiver)
- [ ] Redis RDB backup successful
- [ ] S3 lifecycle rules applied
- [ ] Restore test passed (full backup → restore → verify)
- [ ] PITR restore tested (recover to specific point in time)
- [ ] OpenSearch snapshot test (create → list → verify)
- [ ] DR failover script dry-run completed
- [ ] Rollback script tested

### Rollback Plan
- [ ] Previous Docker images tagged and available
- [ ] Database migration reversible (prisma migrate down)
- [ ] Rollback script verified (rollback.sh --type=database|docker|kubernetes)
- [ ] Feature flags allow disabling new functionality
- [ ] Communication plan documented for rollback scenarios

### Disaster Recovery
- [ ] DR region configured (secondary region)
- [ ] S3 cross-region replication active
- [ ] DR failover script tested
- [ ] DR failback script tested
- [ ] RPO target: 5 minutes (WAL streaming)
- [ ] RTO target: 1 hour (full recovery)

## Launch Day Checklist

### Pre-Launch (T-1 hour)
- [ ] Final health check of all services
- [ ] Verify SSL certificates not expiring
- [ ] Check disk space on all nodes
- [ ] Verify backup ran successfully
- [ ] Check alertmanager is operational
- [ ] Verify Sentry is capturing events
- [ ] Take pre-launch database snapshot

### Launch (T-0)
- [ ] Deploy API to production
- [ ] Verify API liveness probe passes
- [ ] Verify API readiness probe passes (DB, Redis, OpenSearch)
- [ ] Deploy Web to production
- [ ] Verify Web health check passes
- [ ] Verify Swagger disabled (NODE_ENV=production)
- [ ] Verify browser requests reach backend
- [ ] Verify login flow (register → login → JWT)
- [ ] Verify product search returns results
- [ ] Verify rate limiting working (429 on abuse)
- [ ] Verify CSRF protection working
- [ ] Monitor error rates for 15 minutes

### Post-Launch (T+1 hour)
- [ ] Check error rate < 0.1%
- [ ] Check P95 latency < 500ms
- [ ] Check P99 latency < 2s
- [ ] Verify Web Vitals (LCP < 2.5s)
- [ ] Check Sentry for new errors
- [ ] Verify Prometheus metrics populating
- [ ] Verify Grafana dashboards updated
- [ ] Send test email (welcome email flow)
- [ ] Send test SMS (OTP flow)
- [ ] Verify AI Gateway processes a request
- [ ] Check queue depth (should be near 0)
- [ ] Verify Redis cache hit ratio (> 80% expected)

### Post-Launch (T+24 hours)
- [ ] Review 24-hour error report
- [ ] Review 24-hour latency P50/P95/P99
- [ ] Check daily backup completed
- [ ] Review disk usage trends
- [ ] Review memory usage trends
- [ ] Check for any unhandled exceptions in Sentry
- [ ] Verify all cron jobs executed
- [ ] Review API usage by endpoint (top 10)
- [ ] Review slowest database queries
