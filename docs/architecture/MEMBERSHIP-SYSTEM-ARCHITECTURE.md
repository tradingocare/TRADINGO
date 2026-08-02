# Membership System Architecture

## Overview

The membership system powers TRADINGO's subscription plans (Trade Start → Trade Elite) with 3 billing models (Plan A/B/C). It integrates with the existing `Company` subscription fields and handles the full lifecycle: plan selection → order → payment → activation → renewal.

## Database Models

### Existing (extended)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Company` | Subscription state on the company | `subscriptionStatus`, `subscriptionPlan`, `subscriptionActivatedAt`, `subscriptionExpiresAt`, `subscriptionGraceStart`, `assignedRmId`, `referralRewardedAt` |
| `MembershipPlan` | Plan definition and pricing | `planId`, `name`, `pricePlanA/B/C`, `features` (JSON), `sortOrder`, `isActive` |
| `SubscriptionEvent` | Subscription state change audit | `companyId`, `status`, `planType`, `metadata` (JSON) |
| `Payment` | Payment transaction record | `companyId`, `gateway`, `status`, `amount`, `notes` (JSON) |
| `Invoice` | Generated invoice | `companyId`, `paymentId`, `subtotal`, `totalAmount`, `status` |

### New

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Coupon` | Discount code for promotions | `code`, `discountType` (PERCENTAGE/FIXED), `discountValue`, `maxUsage`, `usedCount`, `validFrom`, `validUntil`, `applicablePlanIds` (JSON), `minAmount` |
| `Referral` | Referral code tracking | `code`, `referrerCompanyId`, `refereeCompanyId`, `status` (PENDING/REWARDED/EXPIRED), `rewardAmount`, `rewardedAt` |
| `PlanFeature` | Structured feature definition | `planId`, `category`, `feature`, `included`, `value` |
| `PlanHistory` | Plan change/purchase history | `companyId`, `planId`, `fromStatus`, `toStatus`, `changeType` (UPGRADE/DOWNGRADE/RENEWAL/CANCEL), `metadata` (JSON) |

### New Enums

- `DiscountType`: PERCENTAGE, FIXED
- `ReferralStatus`: PENDING, REWARDED, EXPIRED
- `PlanChangeType`: UPGRADE, DOWNGRADE, RENEWAL, CANCEL

## API Endpoints

### Existing (unchanged)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/membership/plans` | Public | List active plans |
| POST | `/membership/plans/seed` | Public | Seed plan data |
| GET | `/membership/current` | JWT | Get company's current subscription |
| POST | `/membership/order` | JWT | Create purchase order |
| POST | `/membership/payment` | JWT | Process payment |
| POST | `/membership/payment/confirm` | JWT | Confirm payment |
| POST | `/membership/webhook` | Public | Payment gateway webhook |
| GET | `/membership/invoice/:id` | JWT | Get invoice details |

### New

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/membership/plans/:slug` | Public | Get plan by slug |
| POST | `/membership/coupon/validate` | JWT | Validate coupon code |
| POST | `/membership/referral/validate` | JWT | Validate referral code |
| GET | `/membership/history` | JWT | Get company's plan history |
| POST | `/membership/cancel` | JWT | Cancel subscription |

## Frontend Pages

| Path | Purpose | Status |
|------|---------|--------|
| `/plans` | Public plan listing (feature comparison, pricing toggle) | NEW |
| `/plans/[slug]` | Individual plan detail page | NEW |
| `/plans/vendor` | Vendor-specific plan page | EXISTS |
| `/plans/vendor/purchase` | Purchase flow (form → payment → success) | EXISTS |
| `/subscription/success` | Post-purchase success confirmation | NEW |
| `/subscription/failed` | Failed payment page | NEW |

## Data Flow

```
Plan Selection → Order Creation → Payment Gateway → Confirm → Activate Company
                                                                   ↓
                                                              Generate Invoice
                                                                   ↓
                                                          Log SubscriptionEvent
                                                                   ↓
                                                          Record PlanHistory
```

## Pricing Structure

| Plan | Plan A (/yr) | Plan B (/2yr) | Plan C (/3yr) | Sort |
|------|-------------|---------------|---------------|------|
| Trade Start | ₹6,000 | ₹12,000 | ₹18,000 | 1 |
| Trade Smart | ₹12,000 | ₹18,000 | ₹30,000 | 2 |
| Trade Plus | ₹18,000 | ₹30,000 | ₹50,000 | 3 |
| Trade Pro | ₹24,000 | ₹50,000 | ₹75,000 | 4 |
| Trade Premium | ₹30,000 | ₹75,000 | ₹1,10,000 | 5 |
| Trade Elite | ₹40,000 | ₹1,10,000 | ₹1,50,000 | 6 |

## Payment Integration (Phase 10B)

Currently uses stub gateway integration. In Phase 10B, the `processPayment` method will:
1. Call Razorpay/other gateway to create an order
2. Return gateway order ID to frontend
3. Frontend handles UPI/Card/NetBanking via gateway SDK
4. Backend `confirmPayment` verifies signature + captures payment
5. Webhook handler provides idempotent fallback

## Rules & Policies

- **Free Trial**: New companies get `TRIAL` status by default (unlimited time until plan activation)
- **Grace Period**: `subscriptionGraceStart` is set when a subscription expires; 30-day grace before feature restriction
- **Auto-renew**: Not implemented yet — manual renewal in Phase 10B
- **Coupons**: One-time use per company; percentage or fixed discount; plan-specific or global
- **Referral**: Referrer gets GOCASH reward when referee purchases first plan
- **Feature gating**: Frontend checks `company.subscriptionPlan` against plan requirements

## Locked Module Policy

This module will be locked after Phase 10 verification. Until then:
- No redesign of existing API endpoints
- All new endpoints follow the established NestJS patterns
- Frontend pages follow the app directory + Client.tsx pattern
- No modifications to the existing payment processing flow
