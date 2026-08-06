# Go-Live Plan

## Phase P3 — Soft Launch (Current)

### Objective
Controlled release to limited users for real-world validation.

### Scope
- ✅ All 284 routes serving
- ✅ 12 certified domains (86% overall)
- ✅ 4 remaining blockers resolved
- ✅ Online presence: Privacy, Terms, Cookies, Refund pages
- ✅ Security hardened: webhooks, favicon, metadata

### Launch Window
- T+0: Enable production DNS, verify SSL
- T+1: Smoke test all critical flows
- T+3: Monitor error rates, payment success rate
- T+7: Collect user feedback
- T+14: Review and fix issues

### Rollback Plan
1. Revert DNS to previous (if applicable)
2. `docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d`
3. Monitor Sentry for error rate drop
4. Verify on staging environment

### Known Limitations
1. OAuth (Google/LinkedIn) — placeholder keys, social login blocked
2. SMTP — placeholder credentials, email delivery blocked
3. AI_VAULT_MASTER_KEY — placeholder, AI features limited
4. No automated S3 backups — manual pg_dump only
5. No log rotation — manual cleanup required
6. Windows Docker: Prometheus/AlertManager not functioning

### Success Criteria
- [ ] 100+ registered users in first week
- [ ] 50+ products listed
- [ ] 10+ RFQs created
- [ ] Payment success rate > 95%
- [ ] Error rate < 1% of requests
- [ ] Zero security incidents
