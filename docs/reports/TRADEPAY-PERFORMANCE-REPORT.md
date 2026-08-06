# TRADEPAY Performance Report (RC2)

**Date:** 2026-07-19
**Audit Type:** Performance & Scalability Review

## 1. Database Index Analysis

### Payment Model Indexes
| Index | Status | Assessment |
|---|---|---|
| `companyId` | ✅ | Single-column — adequate for company-scoped queries |
| `orderId` | ✅ | For order→payment lookups |
| `gatewayOrderId` | ✅ | For webhook matching |
| `gatewayPaymentId` | ✅ | For webhook matching |
| `status` | ✅ | For status-based filtering |
| **`[companyId, status]` composite** | ❌ **MISSING** | Most common query pattern (list company payments by status). Without this, PG does index scan + filter. |
| **`[status, createdAt]` composite** | ❌ **MISSING** | For admin queries filtering by status sorted by date |

### Payout Model Indexes
| Index | Status | Assessment |
|---|---|---|
| `companyId` | ✅ | Single-column |
| `status` | ✅ | For pending payout processing |
| `settlementId` | ✅ | For settlement→payout lookup |
| **`[companyId, status]` composite** | ❌ **MISSING** | Seller payout list filtered by status |

### Escrow Model Indexes
| Index | Status | Assessment |
|---|---|---|
| `orderId` (unique) | ✅ | |
| `buyerCompanyId` | ✅ | |
| `sellerCompanyId` | ✅ | |
| `status` | ✅ | |
| **`[sellerCompanyId, status]` composite** | ❌ **MISSING** | Seller dashboard query (most common) |
| **`[autoReleaseAt, status]` composite** | ❌ **MISSING** | Auto-release batch processor query |

### Settlement Model Indexes
| Index | Status | Assessment |
|---|---|---|
| `escrowId` | ✅ | |
| `status` | ✅ | |
| **`[status, retryCount]` composite** | ❌ **MISSING** | processRetries() queries FAILED with retryCount < 3 |

### CommissionRule Model Indexes
| Index | Status | Assessment |
|---|---|---|
| `categoryId` | ✅ | |
| `isActive` | ✅ | |
| **`[categoryId, minAmount, maxAmount]` composite** | ❌ **MISSING** | findBestRule() queries all active rules, filters in memory |

### Overall Index Score: 14/20 (70%)

---

## 2. Query Analysis

### 🟡 N+1 Risk: CommissionService.findBestRule()
**File:** `commission.service.ts:67`
```
this.prisma.commissionRule.findMany({ where: { isActive: true } })
```
Fetches ALL active rules into memory, then filters with Array.filter(). With 1000+ rules, this returns unnecessary data and performs in-memory filtering that should be done at the database level.
- **Fix:** Add where clause filters for category and amount range, or use Prisma compound index

### 🟡 Sequential Processing: SettlementService.processSettlements()
**File:** `settlement.service.ts:272-292`
```typescript
for (const settlement of pendingSettlements) {
  await this.process(settlement.id, 'system-batch');
}
```
Sequential processing of all PENDING settlements. Each iteration does: Prisma transaction (read + write) → Notification → Payout creation. With 1000+ settlements, this blocks the event loop and could timeout.
- **Fix:** Use `Promise.allSettled()` with concurrency control (e.g., batch of 10)

### 🟡 Sequential Processing: SettlementService.processRetries()
**File:** `settlement.service.ts:295-318`
Same sequential pattern for FAILED settlement retries. Also double-calls per iteration (retry + process).

### 🟡 Sequential Processing: PayoutService.processPendingPayouts()
**File:** `payout.service.ts:260-275`
Sequential Razorpay API calls. Each HTTP call adds network latency (~200-500ms). With 100 payouts: 20-50 seconds.
- **Fix:** Parallelize with concurrency limit of 5

### 🟡 Sequential Processing: EscrowService.processAutoRelease()
**File:** `escrow.service.ts:335-359`
Sequential release of overdue escrows. Each release triggers commission calc + settlement + notification.
- **Fix:** Parallelize with concurrency control

---

## 3. Queue & Job Processing

### BullMQ Queue Setup
| Queue | Workers | Status |
|---|---|---|
| Email | EmailProcessor | ✅ Registered |
| Export | ExportProcessor | ✅ Registered |
| Certification | CertificationProcessor | ✅ Registered |
| Subscription | SubscriptionProcessor | ✅ Registered |
| RFQ | RfqProcessor | ✅ Registered |
| Escrow | EscrowProcessor | ✅ Registered |
| Settlement | SettlementProcessor | ✅ Registered |
| Dispute | DisputeProcessor | ✅ Registered |
| Bestseller | BestsellerProcessor | ✅ Registered |
| AI | AiProcessor | ✅ Registered |
| **Payout** | **PayoutProcessor** | ❌ **ORPHANED — exists but not registered** |

### 🔴 CRITICAL: PayoutProcessor Orphaned
**File:** `jobs/payout.processor.ts` (40 lines)
- Defines `@Processor(QueueNames.SETTLEMENT)` — reuses the Settlement queue
- Has 3 job types: `PROCESS_PENDING`, `PROCESS_MANUAL`, `VERIFY_STATUS`
- **Never imported in `JobsModule`** — no `@Module({ providers: [PayoutProcessor] })`
- **`PayoutService` not injectable** — JobsModule doesn't import PayoutModule

The existing `SettlementProcessor` (settlement.processor.ts) handles `PROCESS_SETTLEMENTS` and `PROCESS_RETRIES` on the same queue. The PayoutProcessor would need its own queue or be merged into SettlementProcessor.

### 🟡 VERIFY_STATUS is a No-Op
**File:** `jobs/payout.processor.ts:24`
```typescript
case 'VERIFY_STATUS':
  this.logger.log('Payout status verification job completed (no-op)');
  break;
```
This job type does nothing. Should either be implemented or removed.

---

## 4. Caching Analysis

| Module | Cache Used | Assessment |
|---|---|---|
| PaymentService | ❌ None | Payment data changes frequently — acceptable |
| PayoutService | ❌ None | Payout status changes asynchronously — acceptable |
| SettlementService | ❌ None | Settlement status changes — acceptable |
| EscrowService | ❌ None | Escrow status changes — acceptable |
| CommissionService.findBestRule() | ❌ **None** | **MISSING** — Rules rarely change but fetched on every escrow release and payout |
| InvoiceService | ❌ None | Invoice data is append-only — acceptable |
| Founder AI | ✅ Redis (7 methods) | Good — but no payment-specific caching |

### 🟡 Commission Rules Should Be Cached
**File:** `commission.service.ts:67`
Commission rules are configuration data (change infrequently) but are fetched from the database on every escrow release and payout creation.
- **Recommendation:** Cache rules in Redis with 5-minute TTL. Invalidate on rule CRUD.

---

## 5. Batch Processing Performance

| Batch Operation | Volume | Current Time (est.) | Optimal Time |
|---|---|---|---|
| processSettlements (1000) | 1000 | ~60s (sequential + DB writes) | ~10s (parallel 10) |
| processRetries (100) | 100 | ~10s | ~3s |
| processPendingPayouts (100) | 100 | ~30s (sequential HTTP) | ~5s (parallel 5) |
| processAutoRelease (500) | 500 | ~40s | ~8s |

---

## 6. Invoice & Export Performance

| Operation | Performance | Issue |
|---|---|---|
| Invoice generation (subscription) | ✅ O(1) | Single atomic upsert |
| Invoice generation (general) | ⚠️ O(n) | Uses count+1 — scans entire table |
| Billing history | ⚠️ O(3n) | 3 separate Prisma queries + in-memory sort |
| CSV export | ❌ Not implemented | No bulk export for payments/invoices/settlements |

### 🟡 Invoice Numbering Race Condition
**File:** `payment.service.ts:191-193`
```
const count = await this.prisma.invoice.count();
const invoiceNumber = `INV-${date}-${String(count + 1).padStart(4, '0')}`;
```
- Concurrent payments read same count → duplicate invoice numbers
- Invoice.invoiceNumber is `@unique` → second one fails with Prisma unique constraint error
- **Fix:** Use `InvoiceService.generateInvoiceNumber()` which uses atomic `InvoiceSequence` upsert

---

## PERFORMANCE SCORECARD

| Category | Score | Max | % |
|---|---|---|---|
| Database Indexes | 14 | 20 | 70% |
| Query Optimization | 5 | 10 | 50% |
| Queue/Job Processing | 4 | 10 | 40% |
| Caching | 2 | 10 | 20% |
| Batch Processing | 4 | 10 | 40% |
| Invoice/Export | 5 | 10 | 50% |
| **Overall Performance** | **34** | **70** | **49%** |

## PERFORMANCE ISSUES

| # | Issue | Severity | Fix |
|---|---|---|---|
| P1 | PayoutProcessor orphaned — never runs | 🔴 P0 | Register in JobsModule or merge into SettlementProcessor |
| P2 | CommissionService.findBestRule() fetches all rules | 🟡 P1 | Add composite index + Redis cache with 5-min TTL |
| P3 | Sequential batch processing (4 locations) | 🟡 P1 | Add Promise.allSettled() with concurrency control |
| P4 | Missing 5 composite indexes on Payment/Payout/Escrow/Settlement/CommissionRule | 🟡 P1 | Add @@index for common query patterns |
| P5 | Invoice number race condition | 🟡 P1 | Use atomic InvoiceSequence upsert |
| P6 | VERIFY_STATUS no-op job type | 🟢 P2 | Implement or remove |

---

*Generated: 2026-07-19 | Phase E5 — TradePay RC2 Certification*
