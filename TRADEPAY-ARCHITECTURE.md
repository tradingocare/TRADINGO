# TRADEPAY Enterprise Architecture

> Phase E1 — Architecture Blueprint
> How TradePay should extend the existing TRADINGO payment ecosystem without rewriting anything
> 2026-07-19

---

## 1. Architecture Philosophy

**Never rewrite. Always extend.**

TRADINGO already has 87 reusable payment components (72% of total). TradePay's architecture is about:
1. **Wiring existing backend endpoints** to frontend pages
2. **Adding missing payout/commission plumbing** on top of existing models
3. **Instrumenting payment events** through the existing tracking pipeline
4. **Building admin UIs** that consume existing REST APIs

---

## 2. High-Level Architecture

```
                     ┌─────────────────────────────────────────────────┐
                     │                   TRADEPAY                      │
                     │         Enterprise Payment Platform             │
                     └──────┬──────────┬──────────┬──────────┬────────┘
                            │          │          │          │
              ┌─────────────┘          │          │          └─────────────┐
              │                        │          │                        │
     ┌────────▼────────┐    ┌─────────▼──────┐   ┌▼──────────┐   ┌────────▼────────┐
     │  Buyer Payment  │    │ Seller Payout  │   │  Platform  │   │   Admin Ops    │
     │    Frontend     │    │   Frontend     │   │  Commission│   │   Frontend     │
     └────────┬────────┘    └─────────┬──────┘   └▲──────────┘   └────────┬────────┘
              │                       │           │                       │
              ▼                       ▼           │                       ▼
     ┌───────────────────────────────────────────────┐     ┌────────────────────────┐
     │        Existing Backend (Reused 87x)          │     │  New Backend (8x)     │
     │                                                │     │                        │
     │  PaymentService  OrderService  EscrowService  │     │  PayoutService         │
     │  MembershipSvc   InvoiceSvc   SettlementSvc   │     │  CommissionService     │
     │  DisputeSvc      CreditSvc    CollectionsSvc  │     │  ReconciliationSvc     │
     │  GocashSvc       WalletApiSvc                 │     │  TaxConfigService      │
     │  TaxService      PdfService                   │     │  PaymentMethodSvc      │
     └──────────────────────┬────────────────────────┘     └───────────┬────────────┘
                            │                                         │
                            ▼                                         ▼
     ┌──────────────────────────────────────────────────────────────────────┐
     │                    Existing Infrastructure (Reuse)                    │
     │                                                                      │
     │  BullMQ Queues (SUBSCRIPTION/ESCROW/SETTLEMENT/DISPUTE)              │
     │  Redis (caching)  PostgreSQL (Prisma ORM)  ClickHouse (analytics)   │
     │  EventIngestionService (tracking)  NotificationService (templates)  │
     │  AiGateway (finance intelligence)  FounderAi (executive metrics)    │
     └──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module Map

### 3.1 Buyer Payment Flow

```
Buyer visits product → Add to Cart → Checkout Page [NEW]
  → Order Review (items, quantities, totals)
  → Delivery Address (existing OrderLocation model)
  → Coupon/Referral (existing MembershipService)
  → Payment Method Selection (existing PaymentGateway enum)
  → POST /companies/:companyId/payments/order (existing PaymentController)
    → Razorpay Checkout (existing RazorpayService)
  → POST /companies/:companyId/payments/verify (existing PaymentController)
    → Order Status: CONFIRMED (existing OrderService)
    → Notification: PAYMENT_RECEIVED (existing template)
    → Analytics: payment_completed [NEW event]
    → Invoice auto-generated (existing InvoiceService)
```

**Reused components**: 8 (all backend, no new code)

### 3.2 Subscription Purchase Flow

```
User browses plans → Plan Comparison [NEW]
  → GET /membership/plans (existing MembershipController)
  → Select Plan + Tier
  → POST /membership/order (existing MembershipController)
  → POST /membership/payment (existing MembershipController)
  → POST /membership/payment/confirm (existing MembershipController)
  → Subscription Activated (existing MembershipService)
  → Invoice auto-generated (existing InvoiceService)
  → PlanHistory + SubscriptionEvent created (existing)
  → Analytics: subscription_purchased [NEW event]
```

**Reused components**: 7 (all backend, no new code)

### 3.3 Seller Payout Flow

```
Order Delivered → Escrow Auto-Release (existing EscrowService)
  → Settlement Created (existing SettlementService)
  → PayoutService.processPayout() [NEW]
    → Calculates commission (CommissionService [NEW])
    → Splits payment: Seller Amount = Total - Commission - TDS - GST
    → Calls Razorpay Payouts API (PayoutService [NEW])
    → Creates Payout record (existing Payout model)
    → Updates Settlement status to PROCESSED
    → Notification: PAYOUT_PROCESSED [NEW template]
    → Analytics: payout_completed [NEW event]
```

**New components**: PayoutService, CommissionService, Razorpay Payouts integration

### 3.4 Admin Operations

```
Admin Console [NEW] → 6 admin pages:
  ├── Payments Dashboard (existing PaymentAdminController)
  │   ├── All payments with search/filter
  │   ├── Refund management
  │   ├── Gateway logs viewer
  │   └── Payment analytics stats
  ├── Finance Dashboard (existing FinanceDashboardController)
  │   ├── Revenue/receivable/payable KPIs
  │   ├── Cash flow visualization
  │   ├── Credit management
  │   ├── Collections & aging
  │   └── Credit/debit notes
  ├── Invoices (existing BillingAdminController)
  │   ├── All invoices with search
  │   ├── Void invoice
  │   ├── Download PDF
  │   └── Monthly GST report
  ├── Settlements (existing SettlementController + PayoutService [NEW])
  │   ├── Settlement queue
  │   ├── Retry failed settlements
  │   ├── Manual payout trigger
  │   └── Settlement account management
  ├── Disputes (existing DisputeController)
  │   ├── Dispute queue
  │   ├── Admin arbitration panel
  │   ├── Evidence review
  │   └── Resolution management
  └── Reconciliation (ReconciliationService [NEW])
      ├── Payment vs bank statement matching
      ├── Discrepancy reports
      └── Settlement reconciliation
```

**New components**: 6 frontend pages, Payout Admin, Reconciliation Service

---

## 4. Data Model Extension

### 4.1 New Models (minimal)

```prisma
/// Seller payout account
model SellerPayoutAccount {
  id          String   @id @default(uuid())
  companyId   String   @unique
  bankAccount String?  // masked account number
  ifscCode    String?
  upiId       String?
  fundAccountId String? // Razorpay fund account ID
  isVerified  Boolean  @default(false)
  verifiedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

/// Commission rule configuration
model CommissionRule {
  id           String   @id @default(uuid())
  categoryId   String?  // null = global default
  minAmount    Decimal? // threshold for this rule
  maxAmount    Decimal?
  percent      Decimal  @db.Decimal(5,2) // e.g., 5.00 = 5%
  fixedFee     Decimal  @default(0) @db.Decimal(10,2)
  tdsPercent   Decimal  @default(0) @db.Decimal(5,2)
  gstOnCommission Boolean @default(true)
  isActive     Boolean  @default(true)
  startsAt     DateTime @default(now())
  endsAt       DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

/// Periodic reconciliation job
model Reconciliation {
  id            String   @id @default(uuid())
  periodStart   DateTime
  periodEnd     DateTime
  totalPayments Decimal  @db.Decimal(14,2)
  totalSettlements Decimal @db.Decimal(14,2)
  discrepancy   Decimal  @default(0) @db.Decimal(14,2)
  status        String   @default("PENDING") // PENDING, MATCHED, DISCREPANCY
  report        Json?
  processedAt   DateTime?
  createdAt     DateTime @default(now())
}
```

**New models**: 3 (SellerPayoutAccount, CommissionRule, Reconciliation)

### 4.2 Existing Model Extensions

| Model | Extension | Purpose |
|-------|-----------|---------|
| `Payout` | Add `commissionAmount`, `tdsAmount`, `gstAmount`, `netAmount`, `settlementId` | Track payout breakdown |
| `Settlement` | Add `payoutId` relation | Link settlement to payout |
| `Commission` (existing) | Wire into escrow release flow | Auto-deduct commission |
| `Invoice` | Add `payoutId` relation | Payout invoices |

---

## 5. API Extension

### New Endpoints

| Method | Path | Controller | Purpose |
|--------|------|------------|---------|
| POST | `/payouts/process/:settlementId` | PayoutController | Trigger payout for a settlement |
| GET | `/payouts` | PayoutController | List payouts for company |
| GET | `/payouts/admin` | PayoutAdminController | Admin payout management |
| POST | `/commission/rules` | CommissionAdminController | Create commission rule |
| GET | `/commission/rules` | CommissionController | Get applicable commission |
| POST | `/payout-accounts` | PayoutAccountController | Save seller bank account |
| GET | `/payout-accounts` | PayoutAccountController | Get seller payout accounts |
| POST | `/reconciliation/run` | ReconciliationController | Run reconciliation |
| GET | `/reconciliation/reports` | ReconciliationController | Get reconciliation reports |

**New endpoints**: ~9 (minimal — most work is frontend)

---

## 6. Queue Extension

### New BullMQ Jobs

| Queue | Job | Schedule | Purpose |
|-------|-----|----------|---------|
| SETTLEMENT | PROCESS_PAYOUT | Every 15 min | Process pending settlements → payouts |
| SETTLEMENT | VERIFY_PAYOUT | Every 1 hour | Check payout status with Razorpay |
| RECONCILIATION | RUN_DAILY | Daily at 2 AM | Match payments vs settlements |

---

## 7. Tracking Events Extension

### New Events (6 additions to events.ts)

```typescript
PAYMENT_INITIATED    = 'payment_initiated'
PAYMENT_COMPLETED    = 'payment_completed'
PAYMENT_FAILED       = 'payment_failed'
SUBSCRIPTION_PURCHASED = 'subscription_purchased'
PAYOUT_PROCESSED     = 'payout_processed'
PAYOUT_FAILED        = 'payout_failed'
```

---

## 8. Frontend Page Inventory

### Phase 1 — Buyer Pages (5 pages)

| Page | Route | Backend | Priority |
|------|-------|---------|----------|
| Checkout | `/buyer/checkout` | PaymentController, OrderController | P0 |
| Checkout Confirmation | `/buyer/checkout/confirm` | PaymentController | P0 |
| Subscription Plans | `/buyer/subscription` | MembershipController | P0 |
| Subscription Checkout | `/buyer/subscription/purchase` | MembershipController, PaymentController | P0 |
| My Orders | `/buyer/orders` (enhance) | OrderController | P1 |

### Phase 2 — Seller Pages (3 pages)

| Page | Route | Backend | Priority |
|------|-------|---------|----------|
| Payout Settings | `/seller/payout-accounts` | PayoutAccountController | P1 |
| Payout History | `/seller/payouts` | PayoutController | P1 |
| Sales Dashboard | `/seller/sales` (enhance) | OrderController, EscrowController | P2 |

### Phase 3 — Admin Pages (6 pages)

| Page | Route | Backend | Priority |
|------|-------|---------|----------|
| Payments Console | `/admin/payments` | PaymentAdminController | P1 |
| Finance Console | `/admin/finance` | FinanceController (42 endpoints) | P2 |
| Invoice Manager | `/admin/billing` | BillingAdminController | P2 |
| Settlement Console | `/admin/settlements` | SettlementController + PayoutService | P2 |
| Dispute Center | `/admin/disputes` (enhance) | DisputeController | P2 |
| Reconciliation | `/admin/reconciliation` | ReconciliationService | P3 |

---

## 9. Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                        │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Helmet CSP + HSTS + CSRF                      │
│  Layer 2: JwtAuthGuard (all payment endpoints)          │
│  Layer 3: RolesGuard (admin payment endpoints)          │
│  Layer 4: CompanyOwnerGuard (company-scoped endpoints)  │
│  Layer 5: Webhook HMAC verification (Razorpay/Stripe)   │
│  Layer 6: Webhook idempotency (ProcessedWebhookEvent)   │
│  Layer 7: Gateway key mode enforcement (test vs live)   │
│  Layer 8: Rate limiting (payment + payout endpoints)    │
└─────────────────────────────────────────────────────────┘
```

**New security layer**: `@Throttle()` decorators on payout and webhook endpoints (Layer 8)

---

## 10. Founder Intelligence Integration

TradePay feeds into the existing Founder AI metrics:

| Founder Metric | Source | Status |
|----------------|--------|--------|
| GMV (Gross Merchandise Value) | Order.totalAmount aggregated | ✅ Already available |
| Revenue | Platform commission | 🔴 Need CommissionService |
| Payment success rate | Payment.status = CAPTURED / total | 🟡 Need aggregation |
| Average order value | Order.totalAmount / count | ✅ Already available |
| Subscription MRR | Active subscriptions * plan price | 🟡 Need aggregation |
| Pending payouts | Settlement.status = PENDING | 🔴 Need PayoutService |
| Refund rate | Refund.amount / Payment.amount | 🟡 Need aggregation |
| Dispute rate | Active disputes / total orders | ✅ Already tracked |

---

## 11. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Commission model | Category-based rules with defaults | B2B commissions vary by product category |
| Payout frequency | Daily batch + on-demand | Standard B2B marketplace pattern |
| Payment gateway | Razorpay primary (Stripe fallback) | Already dominant in codebase |
| Escrow integration | Auto-trigger payout on settlement | Fully automated flow |
| Refund method | Original payment method (optional GOCASH) | PCI compliance + user preference |
| PDF generation | Puppeteer (HTML→PDF) | Reuses existing HTML invoice template |
| Currency | INR only (Phase 1) | Multi-currency in Phase 2 |
