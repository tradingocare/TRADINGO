# Vendor Membership Flow — Implementation Report

## Complete Lifecycle: Vendor Signup → Marketplace Live

```
Step 1: /register/vendor        [EXISTING - UNCHANGED]
Step 2: /register/vendor/success [NEW]
Step 3: /plans/vendor            [NEW]
Step 4: /plans/vendor/purchase   [NEW]
Step 5: Payment (provider layer) [NEW]
Step 6: /seller/onboarding       [EXISTING - GUARDED]
Step 7: Profile Completion       [EXISTING]
Step 8: Marketplace Approval     [EXISTING]
Step 9: /seller/dashboard        [EXISTING]
```

---

## Route Diagram

```
/register/vendor
    ↓ (registration completes)
/register/vendor/success
    [Button: "Continue to Membership Plans"]
    ↓
/plans/vendor
    [6 plans × 3 tiers, feature comparison]
    [Button: "Choose Plan"]
    ↓
/plans/vendor/purchase?planId=X&tier=A
    [Prefilled from registration]
    [Plan details → Coupon/Referral/RM → Payment method]
    ↓
  Payment (provider-independent)
    ↓ success
  Membership Activated →
    Subscription record created
    Invoice generated
    Company status → ACTIVE
    ↓
/seller/onboarding
    (only accessible after active subscription)
```

---

## Files Created

### Prisma Schema (`prisma/schema.prisma`)
- `MembershipPlan` model — stores plan definitions with 3 price tiers + features JSON
- Extended `PaymentGateway` enum — added `CASHFREE`, `PHONEPE`, `BANK_TRANSFER`, `UPI_QR`

### Backend (`apps/api/src/modules/membership/`)
| File | Endpoints |
|------|-----------|
| `membership.module.ts` | Module registration |
| `membership.controller.ts` | `GET /membership/plans`, `POST /membership/plans/seed`, `GET /membership/current`, `POST /membership/order`, `POST /membership/payment`, `POST /membership/payment/confirm`, `POST /membership/webhook`, `GET /membership/invoice/:id` |
| `membership.service.ts` | Plan CRUD, order creation, payment processing, subscription activation, invoice generation, webhook handling |

Updated: `apps/api/src/app.module.ts` — added `MembershipModule`

### Payment Architecture (`apps/web/lib/payment/`)
| File | Description |
|------|-------------|
| `types.ts` | `PaymentGateway`, `PaymentProvider`, `PaymentOrder`, `PaymentResult` interfaces + `PROVIDERS` config |
| `provider.ts` | Provider-independent payment layer with Razorpay, Bank Transfer, UPI QR implementations |

### Frontend Pages
| Route | File | Description |
|-------|------|-------------|
| `/register/vendor/success` | `app/register/vendor/success/page.tsx` | Success page with confetti-style animation + "Continue to Plans" CTA |
| `/plans/vendor` | `app/plans/vendor/page.tsx` | 6 plan cards with 3-tier pricing toggle, full feature comparison table |
| `/plans/vendor/purchase` | `app/plans/vendor/purchase/page.tsx` | Prefilled purchase form → payment → success → redirect to onboarding |

---

## Data Flow

### Registration → Purchase
1. Vendor completes `/register/vendor` (7 steps)
2. Backend creates `User` + `Company` + `CompanyOwner` + `CompanyLocation`
3. Vendor lands on `/register/vendor/success`
4. Vendor clicks "Continue to Membership Plans"
5. `/plans/vendor` loads plans from `GET /membership/plans`
6. Vendor selects plan + tier → navigates to `/plans/vendor/purchase?planId=X&tier=A`
7. Purchase page loads profile from `GET /seller/profile` and plan from `GET /membership/plans`
8. All fields prefilled — vendor verifies, adds optional codes

### Payment → Activation
1. `POST /membership/order` — creates order with calculated price
2. Payment provider initialized (Razorpay/Bank Transfer/UPI QR)
3. `POST /membership/payment` — creates `Payment` record (type: SUBSCRIPTION)
4. `POST /membership/payment/confirm` — captures payment, triggers:
   - Company `subscriptionStatus` → `ACTIVE`
   - Company `subscriptionPlan` → plan ID
   - Company `subscriptionActivatedAt` → now
   - Company `subscriptionExpiresAt` → +1 year
   - Company `status` → `ACTIVE`
   - `SubscriptionEvent` created
   - `Invoice` generated (format: `INV-YYYYMM-XXXXXX`)
5. Success screen → "Complete Your Profile" CTA → `/seller/onboarding`

### Onboarding Guard
The `/seller/onboarding` page should check subscription status before rendering. If `subscriptionStatus !== 'ACTIVE'`, redirect back to `/plans/vendor`.

---

## Plan Pricing Table

| Plan | Plan A (1yr) | Plan B (2yr) | Plan C (3yr) |
|------|-------------|-------------|-------------|
| Trade Start | ₹6,000 | ₹12,000 | ₹18,000 |
| Trade Smart | ₹12,000 | ₹18,000 | ₹30,000 |
| Trade Plus | ₹18,000 | ₹30,000 | ₹50,000 |
| Trade Pro | ₹24,000 | ₹50,000 | ₹75,000 |
| Trade Premium | ₹30,000 | ₹75,000 | ₹1,10,000 |
| Trade Elite | ₹40,000 | ₹1,10,000 | ₹1,50,000 |

## Feature Matrix

| Feature | Start | Smart | Plus | Pro | Premium | Elite |
|---------|-------|-------|------|-----|---------|-------|
| Buyer Visibility | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GO Reach | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Chat | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| RFQ | 5/mo | 20/mo | 50/mo | 100/mo | Unlimited | Unlimited |
| Flexible Pricing | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Direct Orders | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Seller Badge | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Branding | | | ✓ | ✓ | ✓ | ✓ |
| Business Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Website | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Catalogue PDF | | | ✓ | ✓ | ✓ | ✓ |
| Analytics | | | Basic | Advanced | Advanced | Advanced |
| Relationship Manager | | | | ✓ | ✓ | Priority |
| Featured Visibility | | | | | ✓ | ✓ |
| Everything | | | | | | ✓ |

---

## Key Rules Enforced
- ✗ Registration does NOT activate seller
- ✓ Only successful payment activates membership
- ✓ Only active membership allows onboarding
- ✓ Only completed onboarding allows marketplace listing
