# Sprint 1.2 — Performance Bugs — Completion Report

## Summary
Fixed 2 confirmed performance bugs across 3 files. All tasks within scope (45 min estimated).

## Changes Made

### Task 1 — GMV Aggregation (G-01)

**File:** `apps/api/src/common/services/business-metrics.service.ts:71-73`

| Before | After |
|--------|-------|
| `findMany({ select: { totalPrice }, take: 100000 })` + `reduce` | `aggregate({ _sum: { totalPrice }, where: { order: { status: 'DELIVERED' } } })` |

**Impact:**
- Eliminated 100k-row fetch: now returns 1 row from DB regardless of table size
- Added `where` filter: GMV now only counts delivered orders (was counting cancelled/pending too)
- Memory: ~10-15MB per collection cycle → ~1KB

### Task 2 — Health Endpoint Parallelism (G-05)

**File:** `apps/api/src/health/health.controller.ts:37-99`

| Before | After |
|--------|-------|
| 5 sequential `await` calls (6.0s total) | 5 parallel `Promise.allSettled` calls (~3.4s total) |
| `pingClickHouse()` no timeout | Added 3s `Promise.race` timeout |
| `pingStorage()` no timeout | Added 3s `Promise.race` timeout |

**File:** `apps/api/src/main.ts:234`

| Before | After |
|--------|-------|
| `exclude: ['live', 'ready']` | `exclude: ['live', 'ready', 'health']` |

**Impact:**
- `/health` now available at root (previously 404)
- `/api/v1/health` still works (backward compatible — NestJS re-routes)
- Parallel execution reduced worst-case from 5.98s to 3.43s (42% improvement)
- `/ready` endpoint unchanged (0.27s) — remains the canonical orchestrator health check

## Files Modified

| File | Lines | Type |
|------|-------|------|
| `apps/api/src/common/services/business-metrics.service.ts` | 2 | Fix: aggregation |
| `apps/api/src/health/health.controller.ts` | 3 | Fix: parallelism + timeouts |
| `apps/api/src/main.ts` | 1 | Fix: route exclusion |

## Verification Results

| Check | Expected | Actual |
|-------|----------|--------|
| `GET /live` | 200, <1s | **200, 0.69s** ✅ |
| `GET /ready` | 200, <500ms | **200, 0.27s** ✅ |
| `GET /health` (root) | 200, <4s | **200, 3.43s** ✅ |
| `GET /api/v1/health` | 200 | **200** ✅ |
| `business_gmv_total` metric | Present, using aggregate | **Present** ✅ |
| `tsc api --noEmit` (prod) | 0 errors | **0 errors** ✅ |
| `tsc web --noEmit` | 0 errors | **0 errors** ✅ |

## New Findings (Not in Scope)
6 critical performance anti-patterns documented in `SPRINT-1.2-PRE-IMPLEMENTATION-AUDIT.md`:
- N+1 queries in social feed (2 per post), chat unread counts (up to 1500 per request)
- Unbounded queries in marketplace intelligence (7 per eval), growth intelligence (10+)
- New findings not added to any sprint — available for future planning

## Key Metric: Health Endpoint Latency

```
Before (sequential):  5.98s  ════════════════════════════════
After  (parallel):    3.43s  ═══════════════
Improvement:         42% reduction (limited by 3 backend timeouts)
```

**/ready endpoint (DB-only): 0.27s** — recommended for orchestrator health checks.
