# Subscription Checkout — Phase 10B

## Workflow

```
/plans → /plans/[slug] → /subscription/purchase → /subscription/success|failed
                              │
                              ├─ Step 1:  Plan Selection (display + tier toggle)
                              ├─ Step 2:  Company Information (auto-fill from /seller/profile)
                              ├─ Step 3:  Billing Details (address + GST toggle)
                              ├─ Step 4:  Coupon Code (validate via /membership/coupon/validate)
                              ├─ Step 5:  Referral & RM Code (validate via /membership/referral/validate)
                              ├─ Step 6:  Order Summary (price breakdown)
                              ├─ Step 7:  Terms & Agreements (4 checkboxes)
                              ├─ Step 8:  Payment Method (UI only, disabled)
                              └─ Step 9:  Confirmation → POST /membership/order → redirect
```

## Folder Structure

```
apps/web/app/subscription/
├── purchase/
│   ├── page.tsx              # Server wrapper — renders PurchaseClient
│   └── PurchaseClient.tsx    # 9-step checkout (all step components inline)
├── success/
│   └── page.tsx              # Post-purchase success page
└── failed/
    └── page.tsx              # Payment failure page

apps/web/store/
└── checkout-store.ts         # Zustand store — all checkout state + computed price

apps/api/src/modules/
├── membership/
│   ├── membership.controller.ts   # +coupon/validate, +referral/validate, +history, +cancel
│   ├── membership.service.ts      # validateCoupon, validateReferral, getPlanBySlug, etc.
│   ├── membership.dto.ts          # ValidateCouponDto, ValidateReferralDto, etc.
│   └── membership.module.ts       # (unchanged)
└── seller/
    └── seller.service.ts          # +gstNumber, +panNumber, +email, +mobile, +ownerName in profile
```

## API Usage

| Method | Endpoint | Auth | Used In |
|--------|----------|------|---------|
| GET | `/membership/plans` | Public | Step 1 — list all active plans |
| GET | `/seller/profile` | JWT | Step 2 — auto-fill company info |
| POST | `/membership/coupon/validate` | JWT | Step 4 — validate coupon code |
| POST | `/membership/referral/validate` | JWT | Step 5 — validate referral code |
| POST | `/membership/order` | JWT | Step 9 — create order and redirect |

### API Contracts

**POST /membership/coupon/validate**
```json
// Request
{ "code": "SAVE20", "planId": "trade_pro", "companyId": "<auto>" }
// Response (200)
{ "valid": true, "discountType": "PERCENTAGE", "discountValue": 20, "maxDiscount": 5000, "minAmount": 0 }
// Error (400)
{ "message": "Coupon usage limit reached" }
```

**POST /membership/referral/validate**
```json
// Request
{ "code": "REFER50", "refereeCompanyId": "<auto>" }
// Response (200)
{ "valid": true, "referrerName": "Acme Corp", "rewardAmount": 1000, "rewardType": "GOCASH" }
```

**POST /membership/order**
```json
// Request
{ "planId": "trade_pro", "planTier": "A", "duration": 1 }
// Response (200)
{ "orderId": "ORD-ABC123", "planId": "trade_pro", "amount": 24000, "currency": "INR", ... }
```

## Validation Rules

| Field | Rule |
|-------|------|
| Company Name | Required |
| Owner Name | Required |
| Email | Required, valid email format |
| Mobile | Required, Indian mobile (starts 6-9, 10 digits) |
| GST | Optional, format: `99AAAAA0000A1Z5` |
| PAN | Optional, format: `AAAAA9999A` |
| Billing Contact | Required |
| Billing Address | Required |
| City | Required |
| State | Required (select from list) |
| Pincode | Required, 6 digits |
| Invoice Name | Required if GST billing enabled |
| Invoice Email | Required if GST billing enabled |
| Invoice Mobile | Required if GST billing enabled |
| Coupon Code | Validated against backend |
| Referral Code | Validated against backend |
| Terms | All 4 checkboxes must be checked |
| Payment Method | Must select one |

## Checkout State Flow (Zustand)

```
Store: useCheckoutStore
├── currentStep: 1-9
├── plan: Plan | null
├── tier: 'A' | 'B' | 'C'
├── companyInfo: { name, businessType, gstNumber, panNumber, ownerName, mobile, email }
├── billing: { contactName, address, city, state, pincode, country, gstBilling, invoiceName, invoiceEmail, invoiceMobile }
├── coupon: { code, validated, discountType, discountValue, maxDiscount, minAmount, error }
├── referral: { code, validated, referrerName, rewardAmount, error }
├── rmCode: string
├── terms: { membership, refund, privacy, seller }
├── paymentMethod: string | null
├── orderCreated: boolean
└── orderId: string | null

Hook: usePrice() — computes { price, discount, gst, total, savings, renewalAmount }
```

## Future Payment Integration Points (Phase 10C)

### Files to modify
1. **`PurchaseClient.tsx`** — Step 8 (Payment) and Step 9 (Confirmation):
   - Enable payment method selection buttons (remove `disabled`)
   - Replace stub `handleProceed` with real gateway SDK initialization
   - Integrate `getPaymentProvider()` from `lib/payment/provider.ts`
   - Flow: Create order → Init gateway → Process → Confirm payment → Redirect

2. **`membership.service.ts`** — `processPayment()`:
   - Replace stub with real gateway API calls (Razorpay, Stripe, etc.)
   - Implement webhook signature verification in `handleWebhook()`
   - Add payment retry logic for failed transactions

3. **`membership.controller.ts`** — webhook route:
   - Add gateway-specific webhook secret validation
   - Implement idempotency key for duplicate webhook events

### Rollback Notes
- All payment-related UI is behind `disabled` props — simply remove `disabled` to enable
- The `Payment` model and `Invoice` model are already fully structured for real gateway data
- `processPayment()` and `confirmPayment()` methods already exist with correct data flow
- `handleWebhook()` is a stub ready for real webhook verification logic
- The checkout store's `orderCreated` flag and `orderId` field preserve state through redirects
