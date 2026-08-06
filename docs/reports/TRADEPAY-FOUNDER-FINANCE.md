# TRADEPAY Founder Finance Certification (RC2)

**Date:** 2026-07-19  
**Audit Type:** Financial Accuracy & Business Validation  

## 1. Financial Model Overview

TradePay processes value through a 5-stage pipeline:

```
Buyer Payment (PAISE)
  → Escrow Hold (PAISE)
    → Commission Deduction (PAISE)
      → Settlement (PAISE)
        → Seller Payout (PAISE)
```

**All internal amounts stored as Integers (paise).** The only Decimal fields are:
- `Order.totalAmount` (Decimal — rupees in DB, converted to paise on read)
- `Invoice.totalAmount` (Decimal — display in rupees)
- `CommissionRule.percent`/`fixedFee` (Decimal — percentages and fixed amounts)

---

## 2. Commission Calculation Audit

### Formula (commission.service.ts:42-50)
```
percentFee    = Math.round(orderTotal * rule.percent / 100)
fixedFee      = Math.round(Number(rule.fixedFee))
commissionAmt = percentFee + fixedFee
tdsAmount     = Math.round(commissionAmt * rule.tdsPercent / 100)
gstAmount     = gstOnCommission ? Math.round(commissionAmt * 0.18) : 0
totalDeduct   = commissionAmt + tdsAmount + gstAmount
netAmount     = Math.max(0, orderTotal - totalDeduct)
```

### Rounding Assessment
| Operation | Method | Correct? |
|---|---|---|
| percentFee | `Math.round()` | ✅ Rounds to nearest paisa |
| tdsAmount | `Math.round()` | ✅ Rounds to nearest paisa |
| gstAmount | `Math.round()` | ✅ IEEE 754 safe for Int * 0.18 |
| netAmount floor | `Math.max(0, ...)` | ✅ Prevents negative settlement |

### 🔴 CRITICAL: fixedFee Unit Ambiguity
**File:** `commission.service.ts:43`  
`CommissionRule.fixedFee` is `Decimal(10,2)` — stored as rupees (e.g., `10.00` = ₹10). But the code treats it as paise:
```typescript
const fixedFee = Math.round(Number(bestRule.fixedFee));
// If fixedFee = 10.00, fixedFee = 10 paise = ₹0.10
// Should be: 10.00 * 100 = 1000 paise = ₹10
```
**Impact:** If `fixedFee` is stored as rupees, it's being undercharged 100x. If stored as paise, the Decimal(10,2) type is misleading. No documentation clarifies the unit.

### 🟡 Commission Recalculated on Payout
**File:** `payout.service.ts:42`  
When `createFromSettlement()` creates a payout, it calls `CommissionService.calculate()` AGAIN. If commission rules changed between escrow release and payout creation, the commission could differ from what was originally calculated. No snapshot of the original commission is stored.

---

## 3. Settlement Calculation Audit

### Amount Flow
```
Order.totalAmount (Decimal, rupees)
  → Escrow.amount = Math.round(Number(order.totalAmount) * 100)  [paise]
  → Escrow.netAmount = amount - goCashAmount                      [paise]  
  → Settlement.amount = escrow.netAmount                          [paise]
  → Payout.amount = settlement.amount                             [paise]
```

### 🔴 CRITICAL: Settlement→Payout Orphan Failure
**File:** `settlement.service.ts:137-155`  
`process()` marks settlement as PROCESSED first, THEN attempts to create payout. If payout creation fails:
- Settlement stays PROCESSED (no rollback)
- No payout record exists
- No automatic recovery
- Requires manual database intervention

**Recommendation:** Wrap settlement status update + payout creation in a single Prisma transaction.

---

## 4. Escrow Release Audit

### Release Conditions (escrow.service.ts:274-333)
| Check | Implemented? | Details |
|---|---|---|
| Escrow exists | ✅ | Prisma findUnique throws if not found |
| Status is HELD | ✅ | Guard at line 280 |
| Auto-release countdown | ✅ | 48h from delivery confirmation |
| Commission calculated | ✅ | On escrow.netAmount |
| Settlement created | ✅ | Auto-creates PENDING settlement |

### 🔴 CRITICAL: Commission Not Stored on Escrow Model
**File:** `escrow.service.ts:295-301`  
Commission details (amount, TDS, GST) are only stored in the EscrowEvent metadata (JSON), not in the Escrow model itself. The Escrow model has no `commissionAmount`, `tdsAmount`, or `gstAmount` fields. To audit commission history, you must query the EscrowEvent table and parse JSON metadata.

---

## 5. Payout Processing Audit

### Amount Deduction Flow
```
Payout.amount             = settlement.amount (gross)
Payout.commissionAmount  = commission result
Payout.tdsAmount         = TDS on commission
Payout.gstAmount         = GST on commission  
Payout.netAmount         = amount - commission - TDS - GST (sent to seller)
```

### 🔴 CRITICAL: Notification Amount Display Bug
**File:** `payout.service.ts:153`
```
{ netAmount: (payout.netAmount ?? payout.amount / 100).toFixed(2) }
```
Operator precedence: `payout.netAmount ?? (payout.amount / 100)` — the `/ 100` only applies to the fallback, not to `payout.netAmount`. If `payout.netAmount = 50000` (₹500), the notification shows `"50000.00"` instead of `"500.00"`.
**Fix:** `((payout.netAmount ?? payout.amount) / 100).toFixed(2)`

### 🟡 No Auto-Retry on Payout Failure
**File:** `payout.service.ts:125`  
When Razorpay Payouts API fails, the payout falls back to MANUAL status immediately. No automatic retry. Zero retry attempts.

---

## 6. Invoice/GST Accuracy

### 🔴 CRITICAL: Subscription Invoice Amounts 100x Inflated
**File:** `apps/api/src/modules/billing/invoice.service.ts:61-64`
```typescript
subtotal: params.amount - (params.discountAmount || 0),
// params.amount is Payment.amount (paise, e.g. 6000 for ₹60)
// Stored as Decimal(12,2) — becomes ₹6,000.00 instead of ₹60.00
```
**Impact:** Every subscription invoice is 100x too large:
- Trade Start (₹60/year) → Shows ₹6,000 + ₹1,080 GST = ₹7,080
- Trade Elite (₹400/year) → Shows ₹40,000 + ₹7,200 GST = ₹47,200

**Fix:** Add `/ 100` conversion: `params.amount / 100`

### ✅ General Invoice Path is Correct
**File:** `payment.service.ts:195`
```typescript
subtotal: (payment.amount / 100).toFixed(2),
```
This correctly converts paise to rupees for general invoices (ORDER type).

### 🟡 GST Verification is a Stub
**File:** `auth.service.ts:683-701`
```typescript
async verifyGst(gstNumber: string) {
  // In production, integrate with GST portal API
  return { verified: true, businessName: 'KUMAR TRADING CO', ...stubData };
}
```
Returns mock data for any correctly-formatted GSTIN. No real GST verification against the government portal.

### 🟡 Invoice Number Race Condition
**File:** `payment.service.ts:192-193`
```typescript
const count = await this.prisma.invoice.count();
const invoiceNumber = `INV-${date}-${String(count + 1).padStart(4, '0')}`;
```
Two concurrent payments read the same count → duplicate invoice numbers → Prisma unique constraint violation.

---

## 7. Refund Analysis

### Two Disconnected Refund Paths

**Path A: Payment Refund** (payment.service.ts:createRefund())
```
Payment status → REFUNDED/PARTIALLY_REFUNDED
✓ Refund record created
✓ Razorpay refund initiated
✓ Notification sent
✗ Escrow NOT updated
✗ Commission NOT reversed
✗ Settlement NOT cancelled
```

**Path B: Escrow Refund** (escrow.service.ts:refund())
```
Escrow status → REFUNDED
✓ Notification sent
✗ No gateway refund initiated
✗ No Refund record created
✗ Commission NOT reversed
✗ Settlement NOT cancelled
```

### 🔴 CRITICAL: Complete Refund Disconnect
A full escrow refund requires:
1. Payment refund API call (gateway refund)
2. Escrow refund API call (platform refund)
3. Manual commission adjustment (no API available)
4. Manual settlement cancellation (no API available)

This creates double-liability risk and operational burden.

---

## 8. Financial Validation Scorecard

| Category | Score | Max | % |
|---|---|---|---|
| Commission Calculation | 5 | 10 | 50% |
| Settlement Calculation | 6 | 10 | 60% |
| Escrow Release | 6 | 10 | 60% |
| Payout Processing | 4 | 10 | 40% |
| Invoice Accuracy | 3 | 10 | 30% |
| GST Compliance | 4 | 10 | 40% |
| Refund Handling | 1 | 10 | 10% |
| **Overall Financial** | **29** | **70** | **41%** |

## CRITICAL FINANCIAL ISSUES

| # | Issue | Severity | Impact |
|---|---|---|---|
| F1 | Subscription invoices 100x inflated | 🔴 P0 | Wrong amounts sent to customers. Tax compliance risk. |
| F2 | fixedFee unit ambiguous (rupees vs paise) | 🔴 P0 | 100x undercharge on commission if fixedFee is in rupees |
| F3 | Settlement→payout orphan (no rollback on failure) | 🔴 P0 | Funds stuck, requires DB intervention |
| F4 | Refund systems disconnected (payment vs escrow) | 🔴 P0 | Double-liability risk |
| F5 | Payout notification amount 100x inflated for netAmount | 🟡 P1 | Seller sees "₹50,000.00" instead of "₹500.00" |
| F6 | Commission snapshot not stored (recalculated on payout) | 🟡 P1 | Rules changing between release and payout produce different amounts |
| F7 | GST verification returns mock data for all GSTINs | 🟡 P1 | Tax compliance risk during audit |
| F8 | Invoice number race condition (count+1) | 🟡 P1 | Duplicate invoice number on concurrent payments |
| F9 | Commission not stored on Escrow model | 🟢 P2 | Audit trail requires event JSON parsing |
| F10 | No auto-retry on payout failure | 🟢 P2 | Falls to MANUAL — requires admin intervention |

---

*Generated: 2026-07-19 | Phase E5 — TradePay RC2 Certification*
