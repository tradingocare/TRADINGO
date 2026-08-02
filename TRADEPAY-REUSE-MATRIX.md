# TRADEPAY Reuse Matrix

> What can be reused (no changes), what must be extended (minor changes), and what must be created from scratch
> Phase E1 — 2026-07-19

---

## Reuse Categories

| Category | Label | Action |
|----------|-------|--------|
| ✅ REUSE | No changes needed | Import/use as-is |
| 🟡 EXTEND | Minor additions needed | Add methods, endpoints, or fields |
| 🔴 CREATE | Must be built from scratch | No existing code to reuse |

---

## 1. Payment Gateway Integration

| Component | Category | Action |
|-----------|----------|--------|
| `IPaymentGateway` interface | ✅ REUSE | Factory pattern already supports multiple gateways |
| `RazorpayService` | ✅ REUSE | Full implementation with HMAC + timingSafeEqual |
| `StripeService` | ✅ REUSE | Full implementation (fix `require()` → import) |
| `getGateway()` factory | ✅ REUSE | Works as-is |
| Gateway enum (CASHFREE, PHONEPE, etc.) | ✅ REUSE | 6 gateway types already defined |
| `PaymentService.createPaymentOrder()` | ✅ REUSE | Razorpay order creation + payment record |
| `PaymentService.verifyPayment()` | ✅ REUSE | Signature verification + status update |
| `PaymentService.createRefund()` | ✅ REUSE | Refund via gateway + payment status update |
| `PaymentService.handleWebhookEvent()` | ✅ REUSE | Idempotent webhook processing |
| `utils/signature.ts` (timingSafeEqual) | ✅ REUSE | Industry-standard signature verification |
| ✅ Create `splitPayment()` | 🟡 EXTEND | Need partial/split payment support for marketplace |
| ✅ Create `createPayout()` | 🔴 CREATE | No payout integration exists (Settlement just updates status) |
| ✅ Create `payoutToBank()` | 🔴 CREATE | No Razorpay Payouts API integration |
| ✅ Create `reconcilePayment()` | 🔴 CREATE | No bank statement reconciliation |

## 2. Order & Checkout

| Component | Category | Action |
|-----------|----------|--------|
| `OrderService.create()` | ✅ REUSE | Idempotent, notification-sending, chat-creating |
| `OrderService.updateStatus()` | ✅ REUSE | 11-status state machine with validation |
| `OrderService.cancelOrder()` | ✅ REUSE | Full cancellation with inventory release |
| `OrderService.requestReturn()` | ✅ REUSE | 7-day return window |
| `OrderNumberService` | ✅ REUSE | State-code based numbering |
| `OrderTimelineService` | ✅ REUSE | Status change tracking |
| `OrderDocumentService` | ✅ REUSE | Versioned document upload |
| `CreateOrderDto` | ✅ REUSE | Fully validated with 20 fields |
| ✅ Create buyer checkout page | 🔴 CREATE | No frontend exists |
| ✅ Create payment method selection | 🔴 CREATE | No UI for gateway selection |
| ✅ Create order confirmation page | 🔴 CREATE | No post-payment confirmation UI |

## 3. Subscription & Membership

| Component | Category | Action |
|-----------|----------|--------|
| `MembershipService.getPlans()` | ✅ REUSE | Public endpoint with visibility gating |
| `MembershipService.getCurrentSubscription()` | ✅ REUSE | Returns company subscription status |
| `MembershipService.validateCoupon()` | ✅ REUSE | Coupon code validation with plan/usage checks |
| `MembershipService.validateReferral()` | ✅ REUSE | Referral code validation |
| `MembershipService.activateSubscription()` | ✅ REUSE | Activates subscription + generates invoice |
| `MembershipService.cancelSubscription()` | ✅ REUSE | Creates event + history |
| `MembershipAdminController` (21 endpoints) | ✅ REUSE | Full plan management admin API |
| Plan seeding (`seedPlans()`, `seedLaunchPlans()`) | ✅ REUSE | 8 plans with features |
| BullMQ subscription processors (3 jobs) | ✅ REUSE | Renewal alerts, grace period, auto-expire |
| `CreateSubscriptionOrderDto` | ✅ REUSE | Subscription order creation DTO |
| ✅ Create subscription purchase page | 🔴 CREATE | No frontend for plan purchase |
| ✅ Create plan comparison UI | 🔴 CREATE | Feature matrix comparison for buyers |
| ✅ Create subscription management page | 🔴 CREATE | No "My Plan" page for users |

## 4. Invoice & GST

| Component | Category | Action |
|-----------|----------|--------|
| `InvoiceService.createSubscriptionInvoice()` | ✅ REUSE | GST-compliant invoice with CGST/SGST/IGST |
| `InvoiceService.generateInvoiceNumber()` | ✅ REUSE | Auto-incrementing TRD-INV-YYYY-SEQ |
| `TaxService.calculateGst()` | ✅ REUSE | 9%/9% intra-state, 18% inter-state, exempt |
| `TaxService.getHsnSacForPlan()` | ✅ REUSE | HSN code for plan billing |
| `BillingAdminController` (4 endpoints) | ✅ REUSE | Admin invoice management |
| `InvoiceHistory` model | ✅ REUSE | Full invoice audit trail |
| `PdfService.generateInvoiceHtml()` | ✅ REUSE | HTML invoice template |
| ✅ Create invoice PDF generation | 🟡 EXTEND | `generatePdfBuffer()` returns Buffer.from(html) — install pdfkit/puppeteer |
| ✅ Create buyer invoice list page | 🔴 CREATE | No frontend |
| ✅ Create invoice detail page | 🔴 CREATE | No frontend |
| ✅ Create GST report page | 🔴 CREATE | No admin frontend |

## 5. Escrow & Settlement

| Component | Category | Action |
|-----------|----------|--------|
| `EscrowService.hold()` | ✅ REUSE | Escrow creation + event tracking |
| `EscrowService.release()` | ✅ REUSE | Escrow release |
| `EscrowService.freeze()` / `refund()` / `reopen()` | ✅ REUSE | Full escrow lifecycle |
| `EscrowService.setAutoReleaseDate()` | ✅ REUSE | Auto-release scheduling |
| `EscrowService.processAutoRelease()` | ✅ REUSE | BullMQ batch auto-release |
| `SettlementService.create()` | ✅ REUSE | Settlement creation per escrow |
| `SettlementService.process()` | 🟡 EXTEND | Currently just status update — needs payout integration |
| `SettlementService.retry()` | ✅ REUSE | Max 3 retries with increment |
| Escrow/Settlement BullMQ processors | ✅ REUSE | Cron jobs for auto-processing |
| ✅ Create Razorpay Payouts integration | 🔴 CREATE | No actual money movement |
| ✅ Create marketplace commission deduction | 🔴 CREATE | No split/commission logic in escrow |
| ✅ Create settlement account management | 🔴 CREATE | No bank account CRUD for sellers |
| ✅ Create settlement dashboard | 🔴 CREATE | No seller payout tracking UI |

## 6. Dispute Resolution

| Component | Category | Action |
|-----------|----------|--------|
| `DisputeService.create()` | ✅ REUSE | Dispute creation with escrow update |
| `DisputeService.updateStatus()` | ✅ REUSE | 13-status state machine |
| `DisputeService.addMessage()` | ✅ REUSE | Dispute communication |
| `DisputeService.addEvidence()` | ✅ REUSE | Evidence management |
| `DisputeService.escalate()` | ✅ REUSE | Admin escalation with BullMQ delayed job |
| `DisputeService.resolveDispute()` | ✅ REUSE | Full/partial resolution + escrow + trustScore |
| `DisputeService.appeal()` | ✅ REUSE | Appeal workflow |
| `AdminAssignmentService` | ✅ REUSE | Round-robin + least-busy admin assignment |
| All 7 BullMQ dispute cron jobs | ✅ REUSE | Expiry, reminders, arbitration, SLA, appeal |
| ✅ Create dispute center frontend | 🔴 CREATE | No buyer/seller dispute UI |
| ✅ Create admin arbitration dashboard | 🔴 CREATE | No admin dispute management UI |

## 7. Finance & Credit

| Component | Category | Action |
|-----------|----------|--------|
| `CreditService.setCreditLimit()` | ✅ REUSE | Trade credit limit management |
| `CreditService.requestApproval()` | ✅ REUSE | Credit approval workflow |
| `CollectionsService.getOutstandingSummary()` | ✅ REUSE | Overdue payment aggregation |
| `CollectionsService.getAgingReport()` | ✅ REUSE | Aging buckets (0-30/31-60/61-90/90+) |
| `CreditNoteService.createCreditNote()` | ✅ REUSE | Credit note with auto-numbering |
| `CreditNoteService.createDebitNote()` | ✅ REUSE | Debit note with auto-numbering |
| `FinanceDashboardService.getDashboard()` | ✅ REUSE | Revenue/receivable/payable metrics |
| `FinanceDashboardService.getCashFlow()` | ✅ REUSE | Inflow vs outflow |
| `AiFinanceService` (10 methods) | ✅ REUSE | AI finance intelligence |
| ✅ Create admin finance dashboard page | 🔴 CREATE | No frontend |
| ✅ Create credit management page | 🔴 CREATE | No admin credit UI |
| ✅ Create collections page | 🔴 CREATE | No collections dashboard |
| ✅ Create credit/debit note management | 🔴 CREATE | No notes UI |

## 8. GOCASH & Wallet

| Component | Category | Action |
|-----------|----------|--------|
| `GocashService` (all methods) | ✅ REUSE | Append-only ledger, idempotent, full lifecycle |
| `WalletApiService` (all methods) | ✅ REUSE | Buyer/seller/admin wallet wrappers |
| `GocashIntegrationService` (all methods) | ✅ REUSE | 9 reward trigger methods |
| Buyer GOCASH page | ✅ REUSE | Exists at `/buyer/gocash` — full loading/empty/error states |
| Seller GOCASH page | ✅ REUSE | Exists at `/seller/gocash` — full loading/empty/error states |
| ✅ Create admin wallet management page | 🔴 CREATE | Previous pages appear deleted |
| ✅ Create reward campaign UI | 🟡 EXTEND | Campaign Engine exists but no payment-specific campaigns |

## 9. Security Infrastructure

| Component | Category | Action |
|-----------|----------|--------|
| HMAC-SHA256 signature verification | ✅ REUSE | timingSafeEqual |
| Webhook idempotency (ProcessedWebhookEvent) | ✅ REUSE | Works as-is |
| `JwtAuthGuard` | ✅ REUSE | On all payment endpoints |
| `RolesGuard` + `@Roles()` | ✅ REUSE | ADMIN/SUPER_ADMIN on admin endpoints |
| `CompanyOwnerGuard` | ✅ REUSE | On company-scoped payment/order/escrow/settlement endpoints |
| Helmet CSP configuration | ✅ REUSE | Proper CSP with HSTS |
| CSRF protection | 🟡 EXTEND | Need to exclude webhook paths |
| Razorpay mode enforcement | ✅ REUSE | Blocks test keys in live mode |
| ✅ Create CSRF exclusion for webhooks | 🟡 EXTEND | `app.register(csrf, { excludedRoutes: ['/payments/webhook/*'] })` |

## 10. Queue Infrastructure

| Component | Category | Action |
|-----------|----------|--------|
| SUBSCRIPTION queue + 3 jobs | ✅ REUSE | Renewal alerts, grace period, expiry |
| ESCROW queue + 2 jobs | ✅ REUSE | Auto-release, expiry monitor |
| SETTLEMENT queue + 2 jobs | ✅ REUSE | Batch process, retry |
| DISPUTE queue + 7 jobs | ✅ REUSE | Expiry, reminders, arbitration, SLA, appeal |
| `queues.ts` definitions | ✅ REUSE | 14 queue types, 12 job type enums |
| BullMQ module registration | ✅ REUSE | All queues registered in AppModule |
| ✅ Create payout queue | 🔴 CREATE | No payout job exists |
| ✅ Create reconciliation queue | 🔴 CREATE | No reconciliation job exists |

## 11. Notification Templates

| Component | Category | Action |
|-----------|----------|--------|
| `PAYMENT_RECEIVED` | ✅ REUSE | `"Payment of ₹{{amount}} has been received successfully."` |
| `PAYMENT_FAILED` | ✅ REUSE | `"Your payment of ₹{{amount}} has failed. Reason: {{reason}}"` |
| `PAYMENT_REFUNDED` | ✅ REUSE | `"₹{{amount}} has been refunded to your account."` |
| `CREDIT_PACK_PURCHASED` | ✅ REUSE | Template exists |
| ✅ Create payout notification template | 🟡 EXTEND | Need `PAYOUT_PROCESSED`, `PAYOUT_FAILED` templates |
| ✅ Create dispute notification templates | 🟡 EXTEND | Need dedicated dispute templates (not just DISPUTE_CREATED) |

## 12. Analytics & Tracking

| Component | Category | Action |
|-----------|----------|--------|
| `PaymentAnalyticsService` | ✅ REUSE | Event ingestion for payment events |
| `EscrowAnalyticsService` | ✅ REUSE | Escrow analytics tracking |
| `SettlementAnalyticsService` | ✅ REUSE | Settlement analytics tracking |
| `DisputeAnalyticsService` | ✅ REUSE | Dispute analytics + ClickHouse query |
| `OrderAnalyticsService` | ✅ REUSE | Order metrics tracking |
| `FounderAiService` finance metrics | ✅ REUSE | 19 revenue/transaction metrics available |
| ✅ Create payment tracking events | 🔴 CREATE | No payment funnel events in events.ts |
| ✅ Create growth intelligence payment metrics | 🟡 EXTEND | Funnel currently stops at "First Order" — needs payment conversion |

---

## Summary: Reuse vs Create

| Domain | ✅ REUSE | 🟡 EXTEND | 🔴 CREATE |
|--------|----------|-----------|-----------|
| Payment Gateway | 9 | 1 | 3 |
| Order & Checkout | 7 | 0 | 3 |
| Subscription & Membership | 8 | 0 | 3 |
| Invoice & GST | 8 | 1 | 3 |
| Escrow & Settlement | 7 | 1 | 4 |
| Dispute Resolution | 10 | 0 | 2 |
| Finance & Credit | 10 | 0 | 4 |
| GOCASH & Wallet | 6 | 1 | 1 |
| Security | 7 | 1 | 0 |
| Queue Infrastructure | 6 | 0 | 2 |
| Notification Templates | 4 | 2 | 0 |
| Analytics & Tracking | 5 | 1 | 1 |
| **Total** | **87** | **8** | **26** |

**Strategy**: 87 components can be reused as-is (72%), 8 need minor extensions (7%), 26 must be created from scratch (21%). The vast majority of backend work is DONE — the focus is frontend pages, payout integration, and analytics.
