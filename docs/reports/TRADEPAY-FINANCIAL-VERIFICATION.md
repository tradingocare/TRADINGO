# TradePay Financial Verification Report

**Date**: 2026-07-19  
**Phase**: E6 — RC2 Remediation  
**Scope**: Commission → Payment → Escrow → Settlement → Payout lifecycle

## Money Flow State Machine

```
ORDER CREATED → PAYMENT INITIATED → PAYMENT CAPTURED
                                       ↓
                              ORDER CONFIRMED (C3 fix)
                                       ↓
                              ESCROW HELD (C3 fix)
                                       ↓
                              DELIVERY CONFIRMED
                                       ↓
                              ESCROW RELEASED
                                       ↓
                              SETTLEMENT CREATED
                                       ↓
                              SETTLEMENT PROCESSED
                                       ↓
                              PAYOUT CREATED
                                       ↓
                              PAYOUT COMPLETED

REFUND (C4 fix):
  PAYMENT REFUNDED → ORDER RETURNED/CANCELLED → ESCROW REFUNDED
```

## Unit Verification

### C2 — Invoice Amount: Paise → Rupees
| Input | Before (stored) | After (stored) |
|---|---|---|
| amount = 99900 paise | subtotal = 99900 (₹999 × 100) | subtotal = 999 (₹999) |
| amount = 99900, discount = 0 | totalAmount = 99900 + tax | totalAmount = 999 + tax |

### C7 — Commission fixedFee: Rupees → Paise
| Input | Before | After |
|---|---|---|
| fixedFee = 50.00 (₹50) | 50 paise (₹0.50) | 5000 paise (₹50) |
| totalDeductions = percentFee (paise) + fixedFee (paise) | FixedFee 100x too small | Correct |

### C3 — Order + Escrow on Payment Capture
- `PaymentService.handlePaymentSuccess()` → `order.update({ status: 'CONFIRMED' })` → `escrowService.hold(orderId, companyId, 'system-auto-escrow')`
- System userId used for automated escrow creation

### C4 — Refund cascades to Order + Escrow
- Full refund: `order.status = 'RETURNED'`, `escrow.status = 'REFUNDED'`
- Partial refund: `order.status = 'CANCELLED'`, escrow only updated if exists

## Currency Consistency
- ALL amounts stored as integers (paise): CommissionRule.fixedFee, Order.totalAmount, Payment.amount, Escrow.amount, Settlement.amount, Payout.amount
- ONLY user-facing Decimal fields use rupees: Invoice.subtotal, Invoice.totalAmount
- `Math.round()` used consistently for all integer conversions
