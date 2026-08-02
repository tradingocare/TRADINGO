# TRADINGO Operations Runbook

## Daily Operations

### Morning Checks (T+0)
1. Verify `/api/v1/health` returns OK (all dependencies green)
2. Check Prometheus targets — all UP
3. Review Sentry for new errors (last 24h)
4. Verify daily backup completed
5. Check disk usage on all nodes (< 80%)

### Weekly Tasks
1. Review slowest database queries (pg_stat_statements)
2. Review API latency P50/P95/P99 trends
3. Rotate any expiring secrets/certificates
4. Check SSL certificate expiry (< 30 days → renew)
5. Review OpenSearch index sizes

### Monthly Tasks
1. Review cost analysis (AI provider usage, AWS, hosting)
2. Review and archive old logs
3. Test database restore from backup
4. Review user growth and platform adoption metrics
5. Update Grafana dashboard thresholds based on trends

## Incident Response

### Severity Levels

| Severity | Definition | Response Time | Example |
|----------|-----------|---------------|---------|
| **P0** | Platform down / data loss | Immediate (< 15 min) | API not responding, database corruption |
| **P1** | Major feature broken | < 1 hour | Login broken, search returning errors |
| **P2** | Minor feature degraded | < 4 hours | Slow page load, non-critical UI bug |
| **P3** | Cosmetic issue | < 1 week | Styling issue, typo |

### Incident Response Process

1. **Detect** — Alert from Prometheus, Sentry, or user report
2. **Triage** — Determine severity, assign owner
3. **Mitigate** — Apply fix, rollback, or feature flag
4. **Resolve** — Verify fix, update status
5. **Post-mortem** — Root cause analysis within 48 hours

### Common Incident Responses

#### API Down
```bash
# Check container status
docker ps | grep tradingo-api

# Check logs
docker logs tradingo-api --tail 100

# Restart container
docker compose -f docker-compose.prod.yml restart api

# If database issue, check connection
docker logs tradingo-postgres --tail 50
```

#### High Memory Usage
```bash
# Check per-container memory
docker stats --no-stream

# Check if OOM killer triggered
dmesg | grep -i oom

# Restart specific service
docker compose -f docker-compose.prod.yml restart <service>
```

#### Database Slow Queries
```bash
# Check active queries
docker exec tradingo-postgres psql -U tradingo -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"

# Check long-running queries (> 5 min)
docker exec tradingo-postgres psql -U tradingo -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 minutes';"

# Kill a specific query
docker exec tradingo-postgres psql -U tradingo -c "SELECT pg_terminate_backend(<pid>);"
```

#### Redis Issues
```bash
# Check Redis health
redis-cli -a $REDIS_PASSWORD PING

# Check memory usage
redis-cli -a $REDIS_PASSWORD INFO memory

# Clear cache (caution: affects all cached data)
redis-cli -a $REDIS_PASSWORD FLUSHDB
```

#### BullMQ Queue Backlog
```bash
# Connect to Redis and check queue sizes
redis-cli -a $REDIS_PASSWORD LLEN bull:<queue-name>:waiting
redis-cli -a $REDIS_PASSWORD LLEN bull:<queue-name>:active

# Check for stalled jobs
redis-cli -a $REDIS_PASSWORD ZCOUNT bull:<queue-name>:stalled 0 +inf
```

## Standard Operating Procedures

### Configuration Changes
1. Edit config file or env var
2. Test on staging first (if available)
3. Apply to production
4. Verify health endpoint
5. Monitor for 15 minutes

### Database Migration
```bash
# Always take backup first
pg_dump -h localhost -U tradingo tradingo > /backups/pre-migration-$(date +%Y%m%d%H%M).sql

# Apply migration
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Verify
docker compose -f docker-compose.prod.yml run --rm api npx prisma validate
```

### SSL Certificate Renewal
```bash
# Check expiry
openssl x509 -in /etc/nginx/ssl/tradingo.crt -noout -dates

# Renew via certbot
certbot renew --nginx

# Reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Scaling Guidelines

| Metric | Threshold | Action |
|--------|-----------|--------|
| API CPU > 70% for 5 min | HPA auto-scales (3→10 pods) | Verify HPA is configured |
| API memory > 80% | Increase pod memory limits | Edit deployment manifest |
| Database connections > 80% | Increase pool size or add pgbouncer | Prisma pool: 3→20 |
| Redis memory > 80% | Increase maxmemory or cluster | Edit Redis config |
| OpenSearch query latency > 500ms | Add shards or optimize queries | Reindex with 3 shards |
| Queue backlog > 1000 | Add workers or increase concurrency | Edit queue config |
