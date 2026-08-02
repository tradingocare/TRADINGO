# TRADINGO Post-Launch Checklist

## T+0 (Immediately After Launch)

### Verification
- [ ] `GET /api/v1/live` returns 200 — `{"status":"ok"}`
- [ ] `GET /api/v1/ready` returns 200 — all dependencies green
- [ ] `GET /api/v1/health` returns 200
- [ ] `GET /` returns 200 (Next.js web)
- [ ] Swagger disabled (NODE_ENV=production)
- [ ] Login flow works (register → login → JWT)
- [ ] Product search returns results
- [ ] Rate limiting working (429 on rapid requests)
- [ ] CSRF protection working

### Monitoring
- [ ] Prometheus scraping API metrics
- [ ] Grafana dashboards populated
- [ ] Sentry capturing events
- [ ] No 5xx errors in first 15 minutes
- [ ] P95 latency < 500ms
- [ ] P99 latency < 2s

## T+1 Hour

- [ ] Error rate < 0.1%
- [ ] Web Vitals acceptable (LCP < 2.5s)
- [ ] No memory leaks (container memory stable)
- [ ] No connection pool exhaustion
- [ ] Queue depth near 0
- [ ] Redis cache hit ratio > 80%
- [ ] Send test email (welcome flow)
- [ ] Send test SMS (OTP flow)
- [ ] AI Gateway processes a test request

## T+24 Hours

- [ ] Review 24-hour error report from Sentry
- [ ] Review 24-hour latency P50/P95/P99
- [ ] Daily backup completed successfully
- [ ] Disk usage trends normal
- [ ] Memory usage trends normal
- [ ] No unhandled exceptions in Sentry
- [ ] All cron jobs executed
- [ ] Review top 10 API endpoints by usage
- [ ] Review slowest database queries

## T+7 Days

- [ ] Backup restoration tested
- [ ] No memory leaks detected
- [ ] No connection pool issues
- [ ] Certificate renewal verified (< 30 days → auto-renew)
- [ ] SSL certificate chain valid
- [ ] Review weekly growth metrics
- [ ] Review AI provider costs
- [ ] Review infrastructure costs

## T+30 Days

- [ ] Full post-launch review meeting
- [ ] Review and update SLA targets
- [ ] Plan v1.1 enhancements
- [ ] Update runbooks with lessons learned
- [ ] Review and prune unused resources
- [ ] Archive old logs
- [ ] Perform load test with production traffic profile
- [ ] Review and update security policies
