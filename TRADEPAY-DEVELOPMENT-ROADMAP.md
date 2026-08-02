# TRADEPAY Development Roadmap

> Phase E1 — 2026-07-19
> 3-phase execution plan (30/60/90 days) for the TradePay Enterprise Payment Platform

---

## Guiding Principles

1. **Never rewrite — always extend.** 87 backend components already exist and are fully functional
2. **Frontend first.** The critical gap is UI — backend is 90%+ complete
3. **Payouts unlock revenue.** Marketplace commission model requires payout infrastructure
4. **Progressive delivery.** Launch with buyer payments first, then subscriptions, then seller payouts

---

## Phase 1: Buyer Payment Launch (Days 1-30)

**Goal**: Buyers can pay for orders and purchase subscriptions. Admins can manage payments.

### Sprint 1.1: Checkout Flow (Days 1-10)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Cart/Review page | ✅ OrderController, OrderService | Checkout page component | 3 days |
| Payment method selection | ✅ PaymentGateway enum | Payment method picker UI | 1 day |
| Razorpay Checkout integration | ✅ RazorpayService | Razorpay checkout.js integration | 2 days |
| Post-payment verification | ✅ PaymentController.verifyPayment | Success/failure pages | 1 day |
| Order confirmation page | ✅ OrderController | Order confirmation component | 1 day |
| **Verification** | tsc api/web 0 errors, next build | | |

### Sprint 1.2: Subscription Purchase (Days 11-18)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Plan comparison page | ✅ MembershipController | Plan comparison grid UI | 2 days |
| Subscription purchase flow | ✅ MembershipController + Store | Subscription checkout flow | 2 days |
| Plan upgrade/downgrade UI | ✅ MembershipService | Subscription management page | 2 days |
| Coupon/referral application | ✅ MembershipService.validateCoupon/Referral | Coupon input component | 1 day |
| **Verification** | tsc api/web 0 errors, next build | | |

### Sprint 1.3: Admin Payment Console (Days 19-25)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Payment listing page | ✅ PaymentAdminController | Admin payments table | 2 days |
| Payment detail + refund | ✅ PaymentAdminController + createRefund() | Refund dialog component | 2 days |
| Gateway logs viewer | ✅ PaymentAdminController.gatewayLogs | Gateway logs component | 1 day |
| **Verification** | tsc api/web 0 errors, next build | | |

### Sprint 1.4: Security Hardening + Tracking (Days 26-30)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| CSRF webhook exclusion | ✅ main.ts | Add excludedRoutes config | 0.5 day |
| Rate limiting on payment endpoints | ✅ @nestjs/throttler | @Throttle() decorators | 0.5 day |
| .env placeholder validation | ✅ App startup | Startup validation check | 0.5 day |
| Payment tracking events (6 events) | ✅ Tracking module | Events in events.ts + wiring | 1 day |
| Growth intelligence funnel extension | ✅ GrowthIntelligenceService | Funnel update (payment step) | 0.5 day |
| **Verification** | tsc api/web 0 errors, next build | | |

### Phase 1 Deliverables

| Deliverable | Count |
|-------------|-------|
| Buyer frontend pages | 5 (checkout, confirmation, plans, subscription purchase, subscription manage) |
| Admin frontend pages | 2 (payments, payment detail) |
| Tracking events | 6 new |
| Security fixes | 3 (CSRF, rate limit, placeholder check) |
| New backend code | Minimal (~5 service methods, all extending existing) |

---

## Phase 2: Seller Payouts & Commission (Days 31-60)

**Goal**: Sellers receive payouts for completed orders. TRADINGO earns marketplace commission.

### Sprint 2.1: Commission Engine (Days 31-38)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| CommissionRule model | ❌ New model | Prisma migration | 1 day |
| CommissionService | ❌ New service | Commission calculation logic | 3 days |
| Commission CRUD endpoints | ❌ New controller | 4 REST endpoints | 2 days |
| Commission dashboard | ❌ New frontend | Admin commission rules page | 2 days |
| **Verification** | prisma validate ✅, tsc api/web 0 errors, next build ✅ | | |

### Sprint 2.2: Payout Integration (Days 39-50)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Razorpay Payouts SDK integration | ❌ New | PayoutService calling Razorpay Payouts API | 3 days |
| Payout queue + processor | ❌ New BullMQ job | PROCESS_PAYOUT + VERIFY_PAYOUT | 2 days |
| Settlement → Payout wiring | 🟡 SettlementService.process() | Payout on settlement release | 2 days |
| PayoutAccount model + CRUD | ❌ New | Seller bank account management | 2 days |
| Escrow commission deduction | 🟡 EscrowService.release() | Deduct commission before release | 1 day |
| PAYOUT_PROCESSED/FAILED templates | 🟡 NotificationService | 2 new templates | 0.5 day |
| Payout notification sending | 🟡 GocashIntegrationService | Wire payout events to notifications | 0.5 day |
| **Verification** | tsc api/web 0 errors, next build ✅ | | |

### Sprint 2.3: Seller Payout Frontend (Days 51-55)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Payout settings page | ❌ New | Bank account/UPI management | 2 days |
| Payout history page | ❌ New | Transaction history + status | 1 day |
| Payout notification preferences | 🟡 Notification preferences | Payout notification toggle | 1 day |
| **Verification** | tsc api/web 0 errors, next build ✅ | | |

### Sprint 2.4: Admin Settlement Console (Days 56-60)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Settlement listing page | ✅ SettlementController | Admin settlement table | 2 days |
| Settlement detail + retry | ✅ SettlementService | Retry/fail/reopen actions | 1 day |
| Payout monitoring dashboard | ❌ New | Payout queue + status dashboard | 2 days |
| **Verification** | tsc api/web 0 errors, next build ✅ | | |

### Phase 2 Deliverables

| Deliverable | Count |
|-------------|-------|
| New Prisma models | 2 (CommissionRule, SellerPayoutAccount) |
| New backend services | 2 (CommissionService, PayoutService) |
| New endpoints | ~12 |
| New BullMQ jobs | 2 (PROCESS_PAYOUT, VERIFY_PAYOUT) |
| Seller frontend pages | 2 (payout settings, payout history) |
| Admin frontend pages | 2 (settlement console, payout dashboard) |
| Notification templates | 2 (PAYOUT_PROCESSED, PAYOUT_FAILED) |

---

## Phase 3: Finance Operations & Intelligence (Days 61-90)

**Goal**: Full finance operations suite — invoices, credit, collections, reconciliation, AI intelligence.

### Sprint 3.1: Invoice PDF + Admin Billing (Days 61-67)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Puppeteer/pdfkit installation | ❌ New | PDF library | 0.5 day |
| PdfService PGP generation | 🟡 PdfService.generatePdfBuffer() | Replace Buffer.from(html) with real PDF | 1 day |
| Invoice listing page | ✅ BillingAdminController | Admin invoice table | 1 day |
| Invoice detail + PDF download | ✅ InvoiceService | Invoice viewer + download | 1 day |
| Monthly GST report UI | ✅ BillingAdminController | GST report visualization | 1 day |
| Buyer invoice list page | ✅ BillingController | Buyer invoice history | 1 day |
| **Verification** | tsc api/web 0 errors, next build ✅ | | |

### Sprint 3.2: Admin Finance Dashboard (Days 68-75)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Finance dashboard page | ✅ FinanceDashboardController | KPIs + charts | 2 days |
| Credit management page | ✅ CreditController | Credit limit + approval UI | 2 days |
| Collections page | ✅ CollectionsController | Aging report + actions | 2 days |
| Credit/debit notes page | ✅ CreditNoteController | Note creation + management | 1 day |
| AI finance insights panel | ✅ AiFinanceController | AI insight cards | 1 day |
| **Verification** | tsc api/web 0 errors, next build ✅ | | |

### Sprint 3.3: Dispute Center (Days 76-80)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Dispute queue page | ✅ DisputeController | Admin dispute table | 1 day |
| Dispute detail + evidence review | ✅ DisputeService | Evidence viewer + timeline | 2 days |
| Admin arbitration panel | ✅ DisputeService.escalate/resolve | Arbitration resolution UI | 1 day |
| Buyer dispute page | ✅ DisputeController | Buyer dispute management | 1 day |
| Seller dispute page | ✅ DisputeController | Seller dispute management | 1 day |
| **Verification** | tsc api/web 0 errors, next build ✅ | | |

### Sprint 3.4: Tax Configuration + Reconciliation (Days 81-87)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| TaxConfig model | ❌ New | Dynamic GST rate configuration | 1 day |
| Tax rate admin UI | ❌ New | Tax configuration page | 1 day |
| ReconciliationService | ❌ New | Payment vs settlement matching | 3 days |
| Reconciliation model | ❌ New | Prisma migration | 1 day |
| Reconciliation admin UI | ❌ New | Reports + discrepancy dashboard | 2 days |
| **Verification** | prisma validate ✅, tsc api/web 0 errors, next build ✅ | | |

### Sprint 3.5: Founder AI + Performance (Days 88-90)

| Task | Reuse | New Code | Effort |
|------|-------|----------|--------|
| Commission revenue in Founder AI | 🟡 FounderAiService | Add commission metrics | 1 day |
| Payment success rate insight | 🟡 FounderAiService | Add payment metrics | 1 day |
| MRR tracking in Founder AI | 🟡 FounderAiService | Add subscription MRR | 1 day |
| Performance audit | — | Review N+1 queries, add indexes | 1 day |
| Final verification | — | Full tsc + build + lint | 1 day |
| **Verification** | tsc api/web 0 errors, next build ✅ | | |

### Phase 3 Deliverables

| Deliverable | Count |
|-------------|-------|
| New Prisma models | 2 (TaxConfig, Reconciliation) |
| New backend services | 2 (ReconciliationService, TaxConfigService) |
| Admin frontend pages | 6 (finance dashboard, credit, collections, notes, dispute center, reconciliation) |
| Buyer/seller frontend pages | 2 (invoice list, dispute management) |
| PDF generation | Functional invoice downloads |
| Founder AI metrics | 3 new (commission revenue, payment success, MRR) |

---

## Summary: 90-Day Plan

| Phase | Duration | Frontend Pages | Backend Services | New Models | New Endpoints | New Jobs | Security Fixes |
|-------|----------|---------------|-----------------|------------|---------------|----------|----------------|
| **P1: Buyer Payments** | Days 1-30 | 7 | 0 | 0 | 0 | 0 | 3 |
| **P2: Payouts + Commission** | Days 31-60 | 4 | 2 | 2 | ~12 | 2 | 0 |
| **P3: Finance Ops** | Days 61-90 | 10 | 2 | 2 | ~6 | 0 | 0 |
| **Total** | **90 days** | **21** | **4** | **4** | **~18** | **2** | **3** |

---

## Effort Estimate

| Phase | Backend (days) | Frontend (days) | Total (days) |
|-------|---------------|-----------------|--------------|
| P1: Buyer Payments | 3 | 27 | 30 |
| P2: Payouts + Commission | 15 | 15 | 30 |
| P3: Finance Ops | 12 | 18 | 30 |
| **Total** | **30** | **60** | **90** |

**Ratio**: 33% backend, 67% frontend — reflects that most backend work is already complete.

---

## Future Phases (Post-90 Day)

| Phase | Timeline | Scope |
|-------|----------|-------|
| P4: Multi-Currency | Q2 | Exchange rates, cross-border fees, currency selector |
| P5: Payment Methods | Q2 | Saved cards, UPI IDs, default payment method |
| P6: Refund Portal | Q2 | Self-service refunds, GOCASH refund option |
| P7: Advanced Reconciliation | Q3 | Bank statement import, ML-based discrepancy detection |
| P8: Payment Webhook Dashboard | Q3 | Webhook delivery log, retry, debugging tools |
