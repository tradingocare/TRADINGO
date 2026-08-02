# TradePay Financial Certification

**Date**: 2026-07-19  
**Phase**: E6.1 — RC3 Final Certification  
**Certifying Authority**: TRADINGO Production Audit

---

## Amount Consistency

All monetary amounts in the TradePay system follow the **paise convention**:

| Field | Type | Store | Display |
|---|---|---|---|
| Order.totalAmount | Int | paise | Divide by 100 |
| Payment.amount | Int | paise | Divide by 100 |
| Escrow.amount | Int | paise | Divide by 100 |
| Settlement.amount | Int | paise | Divide by 100 |
| Payout.amount | Int | paise | Divide by 100 |
| CommissionRule.fixedFee | Decimal(10,2) | rupees | Native |
| Invoice.subtotal | Decimal(12,2) | rupees | Native |
| Invoice.totalAmount | Decimal(12,2) | rupees | Native |

## Conversion Verification

| Conversion | Formula | Verified |
|---|---|---|
| Commission percent to paise | `Math.round(orderTotal * percent / 100)` | ✅ |
| Commission fixedFee to paise | `Math.round(fixedFee * 100)` (C7 fix) | ✅ |
| Invoice subtotal | `(amount - discount) / 100` (C2 fix) | ✅ |
| Invoice totalAmount | `taxTotal + amountInRupees` (C2 fix) | ✅ |
| Display amount | `(amount / 100).toFixed(2)` | ✅ |

## GST Calculation

- CGST + SGST (intra-state) or IGST (inter-state)
- GST applied on commission amount at 18%
- Proper HSN/SAC code assignment per plan type
- Tax breakdown stored in `TaxBreakdown` model (CGST/SGST/IGST)
- GST applied on `commissionAmount` (not on total order value)

## Invoice Certification

- ✓ Sequential invoice numbers via `InvoiceSequence` model
- ✓ GST-compliant (CGST/SGST/IGST breakdown)
- ✓ HSN/SAC codes per plan
- ✓ Invoice items, tax breakdowns, history tracking
- ✓ Void/reversal support
- ✓ PDF generation via `pdf.service.ts`

## Currency Handling

| Operation | Convention | Verified |
|---|---|---|
| All storage | paise (integer) | ✅ |
| Invoice display | rupees (Decimal 12,2) | ✅ |
| Razorpay integration | paise (as per Razorpay API) | ✅ |
| Math operations | `Math.round()` for integer conversions | ✅ |
| Division safety | `Math.max(0, ...)` on net amounts | ✅ |

## Periodic Financial Operations

| Operation | Trigger | Component | Verified |
|---|---|---|---|
| Pending payout processing | BullMQ SETTLEMENT queue | PayoutProcessor | ✅ |
| Manual payout processing | BullMQ SETTLEMENT queue | PayoutService.processManualPayouts() | ✅ |
| Settlement retry | BullMQ SETTLEMENT queue | SettlementService.processRetries() (max 3) | ✅ |
| Auto escrow release | BullMQ ESCROW queue | EscrowProcessor | ✅ |
| Escrow expiry monitor | BullMQ ESCROW queue | EscrowService.processAutoRelease() | ✅ |
