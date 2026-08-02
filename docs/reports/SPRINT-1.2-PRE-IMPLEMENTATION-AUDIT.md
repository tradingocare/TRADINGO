# Sprint 1.2 — Pre-Implementation Audit Report

## Scope
Performance Bugs: G-01 (GMV memory issue), G-05 (health endpoint 3.0s+).

Each claimed issue has been re-audited against the current live codebase. Additionally, a broader performance scan was conducted for N+1 patterns, unbounded queries, missing aggregations, and index gaps.

---

## G-01: GMV Memory Issue

### Claim
"GMV metric loads all OrderItems into memory — will OOM production."

### Actual Code (`business-metrics.service.ts:71`)
```typescript
const orderItems = await this.prisma.orderItem.findMany({
  select: { totalPrice: true },
  take: 100000,  // ← there IS a limit, contrary to the claim
});
const gmv = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
gmvGauge.set(gmv);
```

### Analysis

| Aspect | Finding |
|--------|---------|
| `take` limit | **Exists** — `take: 100000`. Not unbounded as claimed. |
| Memory pressure | 100k rows × 1 Decimal field ≈ 10-15MB. Annoying but **won't OOM**. |
| `where` filter | **Missing** — no `where` clause. Counts ALL order items (pending, cancelled, delivered). The metric is inaccurate — should only count delivered/completed items. |
| `take` side effect | Without `orderBy`, `take: 100000` returns the **first 100k rows by PK** — not the most recent or delivered ones. GMV is underestimated for marketplaces with >100k items. |
| DB-side aggregation | Not used — `prisma.orderItem.aggregate({ _sum: { totalPrice }, where: {...} })` would return a single row regardless of table size. |

### Verdict
**⚠️ PARTIALLY CORRECT.** The claim "unbounded with no limit" is incorrect — `take: 100000` exists. However:

1. **No `where` filter** — GMV metric is inaccurate (includes non-delivered items)
2. **Not using `aggregate`** — loads 100k rows into app memory unnecessarily
3. **`take` without `orderBy`** — indeterminate which 100k items are included

**Fix scope:** Replace `findMany` + `reduce` with `aggregate({ _sum: { totalPrice } })`, plus add a `where: { order: { status: 'DELIVERED' } }` filter.

### Files to Modify
| File | Lines | Change |
|------|-------|--------|
| `apps/api/src/common/services/business-metrics.service.ts` | 71-72 | Replace `findMany` with `aggregate` + add `where` filter |

### Evidence (Current API)
```
business_gmv_total <value>  — metric is being set (not crashing)
```

---

## G-05: Health Endpoint Performance

### Claim
"Health endpoint is slow (6.6s P95 under load) because it checks 5 backends synchronously."

### Actual Code (`health.controller.ts:36-48`)
```typescript
@Public()
@Get('health')
async check() {
  const prismaPing = await this.pingPrisma();        // ~50ms
  const redisPing = await this.pingRedis();           // ~50ms or timeout
  const osPing = await this.pingOpenSearch();         // 3s timeout
  const clickhousePing = await this.pingClickHouse(); // ~50ms or timeout
  const storagePing = await this.pingStorage();       // ~50ms or timeout
  const allUp = [prismaPing, redisPing, osPing, clickhousePing, storagePing]
    .every((c) => c.status === 'up');
  ...
}
```

### Measured Timing (Live API, 3 runs)
| Endpoint | Time | Dependencies | Path |
|----------|------|--------------|------|
| `GET /live` | **0.49s** | None | Root (excluded from prefix) |
| `GET /ready` | **0.26s** | DB-only (`SELECT 1`) | Root (excluded from prefix) |
| `GET /api/v1/health` | **5.98s** | DB + Redis + OpenSearch + ClickHouse + Storage | `/api/v1/health` |

### Route Registration (`main.ts:234`)
```typescript
app.setGlobalPrefix('api/v1', { exclude: ['live', 'ready'] });
```
`/health` is NOT in the exclude list. It registers at `/api/v1/health`. There is no `/health` at root.

### Analysis

| Aspect | Finding |
|--------|---------|
| `/ready` performance | **0.26s** — already fast, DB-only. The claim of "6.6s" is stale/wrong. |
| `/api/v1/health` sequential | **Confirmed** — 5 checks run sequentially via `await`. |
| OpenSearch timeout | **3.0s** `AbortSignal.timeout(3000)` — fires on every request if OS is down. |
| ClickHouse timeout | **No explicit timeout** — depends on HTTP client defaults (could be 30s+). |
| Storage timeout | **No explicit timeout** — depends on StorageService.check() implementation. |
| Parallel opportunity | The 5 checks are independent — no reason to run them sequentially. |

### Verdict
**✅ CONFIRMED.** The `/api/v1/health` endpoint has two real problems:
1. **Sequential execution** — 5 independent checks run one-after-another
2. **Missing timeouts** — ClickHouse and Storage checks can hang indefinitely

The **`/ready` endpoint is already fast** (0.26s) and should be the primary health check for orchestrators (K8s liveness, ALB target group health checks). The `/api/v1/health` endpoint is a deep diagnostic — useful for debugging but should not block deployment decisions.

### Fix Scope
1. Run 5 health checks in parallel using `Promise.allSettled`
2. Add explicit timeouts to ClickHouse and Storage checks (3s each)
3. Either add `/health` to the prefix exclude list, or document that `/ready` is the canonical health check

### Files to Modify
| File | Lines | Change |
|------|-------|--------|
| `apps/api/src/health/health.controller.ts` | 37-48 | Change sequential `await` → `Promise.allSettled` |
| `apps/api/src/health/health.controller.ts` | 83-98 | Add timeouts to `pingClickHouse()` and `pingStorage()` |
| `apps/api/src/main.ts` | 234 | Add `'health'` to `exclude` list so /health is also at root |

---

## Broader Performance Scan Results

Per your instruction: **documented separately, NOT added to Sprint 1.2 scope.**

### Critical Findings (Documented, Not Actioned)

| # | File | Issue | Evidence |
|---|------|-------|----------|
| P-01 | `social-feed.service.ts:59-78` | N+1 per post — 2 `findUnique` queries per post in feed | `data.map(async post => ... findUnique(... { postId: post.id }))` |
| P-02 | `chat.service.ts:451-473` | Up to 1,500 queries per unread count calculation | `for...of` on 500 conversations with `findUnique` + `count` each |
| P-03 | `marketplace-intelligence.engine.ts:123-150` | 7 unbounded `findMany` calls per company evaluation | No `take`, no `aggregate` — loads all orders, shipments, payments, etc. |
| P-04 | `marketplace-intelligence.engine.ts:222-240` | Fetches ALL active companies | `company.findMany()` with no limit |
| P-05 | `growth-intelligence.service.ts` | 10+ unbounded `findMany` calls on fast-growing tables | `usageEvent.findMany()`, `crmLead.findMany()` — no `take` |
| P-06 | `crm-timeline.service.ts:21-27` | 7 unbounded parallel queries for timeline view | `rfq.findMany()`, `quote.findMany()`, `order.findMany()`, etc — all without limit |

### Index Gaps (Documented, Not Actioned)

| Model | Missing Composite Index | Impact |
|-------|------------------------|--------|
| `OrderItem` | `@@index([orderId, totalPrice])` | GMV/aggregation queries scan all items per order |
| `ConversationParticipant` | `@@index([userId, conversationId, leftAt])` | Chat unread count scans all participants |
| `CrmLead` | `@@index([source, createdAt])` | Growth intelligence filters on source |
| `SocialPostLike` | `@@index([postId, userId])` | Feed enrichment queries — PostLike exists via `@@unique` but no explicit index |

---

## Sprint 1.2 — Validated Scope

### Task 1: Fix GMV Metric

**File:** `apps/api/src/common/services/business-metrics.service.ts`

**Change:**
```typescript
// BEFORE
const orderItems = await this.prisma.orderItem.findMany({
  select: { totalPrice: true },
  take: 100000,
});
const gmv = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

// AFTER
const gmvResult = await this.prisma.orderItem.aggregate({
  where: { order: { status: 'DELIVERED' } },
  _sum: { totalPrice: true },
});
const gmv = Number(gmvResult._sum.totalPrice ?? 0);
```

**Validation:** `curl http://localhost:3001/api/v1/metrics | grep business_gmv_total` returns accurate value.

**Risk:** Low — aggregate is standard Prisma, backward compatible.

---

### Task 2: Fix Health Endpoint

**File:** `apps/api/src/health/health.controller.ts`

**Changes:**
1. Replace sequential `await` chain with `Promise.allSettled` for the 5 checks
2. Add `AbortSignal.timeout(3000)` to ClickHouse and Storage checks
3. Return aggregated status (error if any check failed, ok if all passed)

**File:** `apps/api/src/main.ts`

**Change:**
4. Add `'health'` to `app.setGlobalPrefix()` exclude list so `/health` works at root alongside `/live` and `/ready`

**Validation:** `curl http://localhost:3001/health` returns 200 in <500ms (ideally ~300ms with parallel checks + 3s timeouts).

**Risk:** Low — backward compatible (existing `/api/v1/health` still works).

---

### Task 3: Verify Both Fixes

| Check | Expected | Actual |
|-------|----------|--------|
| `GET /live` | 200, <500ms | — |
| `GET /ready` | 200, <500ms | — |
| `GET /health` (root) | 200, <500ms | — |
| `GET /api/v1/health` | 200, <5s (or faster) | — |
| `business_gmv_total` metric | Accurate, using `aggregate` | — |
| `tsc api --noEmit` (prod code) | 0 errors | — |
| `tsc web --noEmit` | 0 errors | — |

---

## Summary

| Task | Gap | Effort | Risk | Files |
|------|-----|--------|------|-------|
| 1 | G-01: GMV uses `findMany` instead of `aggregate` | 15 min | Low | 1 |
| 2 | G-05: Health checks run sequentially, missing timeouts | 30 min | Low | 2 |
| **Total** | **2 tasks** | **45 min** | **Low** | **2-3 files** |

**New findings (not in scope):** 6 critical performance bottlenecks documented for future sprints.

---

**Ready for approval. No code has been written.**
