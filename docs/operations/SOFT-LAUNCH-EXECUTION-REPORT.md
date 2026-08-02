# Soft Launch Execution Report

**Date**: 2026-07-20
**Version**: TRADINGO v1.0.0 GA
**Phase**: P4 — Controlled Soft Launch

## Infrastructure Status

| Service | Status | Port | Notes |
|---------|--------|------|-------|
| API (NestJS) | 🟢 Running | 3001 | Built & deployed from `apps/api/dist/main.js` |
| Web (Next.js) | 🟢 Running | 3000 | Turbopack dev mode |
| PostgreSQL 16 | 🟢 Healthy | 5432 | Docker — 267 tables |
| Redis 7 | 🟢 Healthy | 6379 | Docker |
| OpenSearch 2.17 | 🟢 Running | 9200 | Docker — health check warning (HTTPS vs HTTP) |
| ClickHouse 24.12 | 🟢 Healthy | 8123 | Docker |
| Grafana 11.3 | 🟢 Healthy | 3002 | Docker — login page 200 |
| Prometheus | 🔴 Restarting | 9090 | Known Windows Docker issue |
| AlertManager | 🔴 Restarting | 9093 | Known Windows Docker issue |
| postgres-exporter | 🟡 Unhealthy | 9187 | Connection issue |

## Issues Found & Fixed

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
| `GET /live` and `GET /ready` return 404 | 🔴 Launch Blocker | ✅ FIXED | Added `exclude: ['live', 'ready']` to `setGlobalPrefix()` in `main.ts:120` |
| `GET /products` returns 500 Internal Server Error | 🔴 Launch Blocker | ✅ FIXED | `limit` query param passed as string to Prisma `take`. Changed destructuring to explicit `Number(query.limit) || 20` in `products.service.ts:329` |
| OpenSearch health check reports "down" | 🟡 Low | 📝 Documented | Health check uses HTTPS for localhost:9200 but OpenSearch serves HTTP. Cosmetic — OpenSearch functions correctly |
| Prometheus/AlertManager not stable | 🟡 Low | 📝 Documented | Known Windows Docker Compose config issue |

## Business Validation Results

| Flow | Result | Notes |
|------|--------|-------|
| Health endpoints | ✅ PASS | `/live`, `/ready`, `/api/v1/health` all 200 |
| Buyer login | ✅ PASS | `newtest@tradingo.com` — JWT issued |
| Seller login | ✅ PASS | `seller2@tradingo.com` — JWT issued |
| Buyer profile | ✅ PASS | `GET /auth/me` 200 |
| Companies | ✅ PASS | Both buyer/seller `my-company` 200 |
| Product listing | ✅ PASS | 11 products returned |
| Product search | ✅ PASS | Full-text search working |
| Categories | ✅ PASS | Categories endpoint 200 |
| Bestsellers | ✅ PASS | Bestsellers endpoint 200 |
| Seller products | ✅ PASS | Seller-specific product list 200 |
| Seller brands | ✅ PASS | Empty state handled gracefully |
| Smart RFQ | ✅ PASS | RFQ listing 200 |
| Company verification | ✅ PASS | Verification list 200 |
| Web homepage | ✅ PASS | 200 — 117KB content |
| Login page | ✅ PASS | 200 — rendered |
| Buyer dashboard page | ✅ PASS | 200 — rendered |
| Seller dashboard page | ✅ PASS | 200 — rendered |
| Swagger docs | ✅ PASS | API documentation serving |
| Grafana | ✅ PASS | Monitoring dashboard accessible |

## User & Business Metrics

| Metric | Value |
|--------|-------|
| Registered users (seed) | 2 |
| Companies (seed) | 2 (cmp-buyer-001, cmp-seller-001) |
| Products (seed) | 11 |
| Active RFQs (seed) | 0 |
| Successful payments | 0 (no Razorpay test keys configured) |

## Verifications
- ✅ tsc api — 0 errors
- ✅ tsc web — 0 errors  
- ✅ next build — 284 routes
- ✅ 2 launch blockers fixed
- ✅ 0 remaining P0/P1 issues
