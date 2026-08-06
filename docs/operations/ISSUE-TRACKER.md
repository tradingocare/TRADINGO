# Issue Tracker — Phase P4 Soft Launch

## Fixed Issues

### P4-001: GET /live and GET /ready return 404
- **Severity**: 🔴 Launch Blocker
- **Found**: 2026-07-20, during Phase P4 deployment verification
- **Description**: K8s liveness (`/live`) and readiness (`/ready`) probes returned 404 because NestJS `setGlobalPrefix('api/v1')` applied to ALL routes including the health probe endpoints
- **Root Cause**: `app.setGlobalPrefix('api/v1')` at `main.ts:120` did not exclude probe routes
- **Fix**: Changed to `app.setGlobalPrefix('api/v1', { exclude: ['live', 'ready'] })`
- **File**: `apps/api/src/main.ts:120`
- **Status**: ✅ FIXED

### P4-002: GET /products returns 500 Internal Server Error
- **Severity**: 🔴 Launch Blocker
- **Found**: 2026-07-20, during product discovery validation
- **Description**: `GET /api/v1/products?limit=3` returned HTTP 500 with `PrismaClientValidationError: Argument 'take': Invalid value provided. Expected Int, provided String.`
- **Root Cause**: `limit` query parameter passed as string from HTTP query, but Prisma `take` requires Int. The destructuring `const { limit = 20 } = query` did not convert the string to number
- **Fix**: Changed from destructuring default to `const limit = Number(query.limit) || 20`
- **File**: `apps/api/src/modules/products/products.service.ts:329`
- **Status**: ✅ FIXED

## Open Issues

### P4-003: OpenSearch health check reports "down"
- **Severity**: 🟡 Low
- **Found**: 2026-07-20
- **Description**: Health check endpoint reports OpenSearch as "down" because the health check uses `fetch('https://localhost:9200')` but OpenSearch runs on HTTP
- **Impact**: Cosmetic — monitoring dashboards show OpenSearch as unhealthy
- **Workaround**: OpenSearch functions correctly for searches
- **Status**: 📝 Documented

### P4-004: Prometheus & AlertManager Docker containers restarting
- **Severity**: 🟡 Low
- **Found**: 2026-07-20
- **Description**: Prometheus and AlertManager Docker containers are in "Restarting" state on Windows
- **Impact**: Metrics collection and alerting limited
- **Workaround**: Grafana available at localhost:3002, postgres-exporter at :9187
- **Status**: 📝 Documented — known Windows Docker Compose compatibility issue

### P4-005: postgres-exporter unhealthy
- **Severity**: 🟡 Low
- **Found**: 2026-07-20
- **Description**: Postgres exporter container status is "unhealthy"
- **Impact**: PostgreSQL metrics not flowing to Prometheus/Grafana
- **Status**: 📝 Documented

### P4-006: OAuth/SMTP placeholders
- **Severity**: 🟡 Medium
- **Found**: Pre-existing (Phase P1)
- **Description**: Google OAuth, LinkedIn OAuth, SMTP credentials are placeholder values
- **Impact**: Social login and email delivery blocked
- **Status**: 📝 Documented — requires real credentials

## Issue Summary

| Category | Count | Fixed | Open |
|----------|-------|-------|------|
| Launch Blocker | 2 | 2 | 0 |
| High | 0 | 0 | 0 |
| Medium | 1 | 0 | 1 |
| Low | 3 | 0 | 3 |
| **Total** | **6** | **2** | **4** |
