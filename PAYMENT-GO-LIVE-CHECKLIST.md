# PAYMENT GO-LIVE CHECKLIST

## Razorpay Live Activation

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **Live key ID generated** | 🔧 NEEDS ACTION | `.env.production` has `rzp_live_<replace>` — replace with actual live key |
| 2 | **Live key secret generated** | 🔧 NEEDS ACTION | `.env.production` has `<replace>` — replace with actual secret |
| 3 | **Webhook secret generated** | 🔧 NEEDS ACTION | `.env.production` has `<replace>` — generate from Razorpay dashboard |
| 4 | **PAYMENT_MODE set to 'live'** | ✅ | `.env.production` has `PAYMENT_MODE=live` |
| 5 | **Test key detection** | ✅ | `razorpay.service.ts` throws FATAL if test keys used in live mode |
| 6 | **Live key validation** | 🟡 WEAK | Joi validation allows empty keys — app starts with no payment capability |

## Webhook Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **Webhook endpoint** | ✅ | `POST /payments/webhook/razorpay` registered |
| 2 | **Signature verification** | ✅ | HMAC SHA-256 via `timingSafeEqual` constant-time comparison |
| 3 | **Webhook secret** | 🔧 NEEDS ACTION | Must be set to actual webhook secret from Razorpay dashboard |
| 4 | **🔴 HTTP status on failure** | ✅ **FIXED** | Was returning 200 on signature failure — now returns 401 (Razorpay retries) |
| 5 | **Idempotency** | ✅ | `ProcessedWebhookEvent` model with unique eventId — skips duplicates |
| 6 | **Event handling** | ✅ | Supports `payment.captured`, `payment.failed`, `refund.created` |

## Settlement

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **Settlement service** | ✅ | Full lifecycle: PENDING → PROCESSED → FAILED/RETRY |
| 2 | **BullMQ processor** | ✅ | Runs every 30 min for settlement processing |
| 3 | **Analytics** | ✅ | SettlementAnalyticsService tracks volume, timing, failures |
| 4 | **Audit trail** | ✅ | SettlementEvent model with Cascade delete |

## Payout

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **Payout service** | ✅ | Full lifecycle with Razorpay Payouts API integration |
| 2 | **🔴 RAZORPAY_ACCOUNT_NUMBER** | 🔧 **MISSING** | Not present in any `.env` file — payouts will fail with "account_number is required" |
| 3 | **Fund account creation** | ✅ | Creates Razorpay fund accounts from seller bank details |
| 4 | **Payout processor** | 🟡 REGISTERED | Uses `@Processor(QueueNames.SETTLEMENT)` — should be a separate queue |
| 5 | **Manual payout fallback** | ✅ | Failed automatic payouts fall back to manual processing |
| 6 | **Admin payout management** | ✅ | Admin endpoints to process/confirm/fail payouts |
| 7 | **No admin payout UI** | 🟡 MISSING | Admin has endpoints but no frontend page |

## Payment Flow

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **Checkout → Order → Payment** | ✅ | Full flow with Razorpay SDK + backend verification |
| 2 | **Subscription payment** | ✅ | Plan selection → Razorpay → Verification → Activation |
| 3 | **Payment verification** | ✅ | `timingSafeEqual` constant-time signature verification |
| 4 | **Escrow integration** | ✅ | Payment success → Escrow hold → Release on delivery |
| 5 | **Refund processing** | ✅ | Refund created via Razorpay API with status tracking |
| 6 | **Invoice generation** | ✅ | PDF invoice with GST, HSN/SAC, tax breakdown |
| 7 | **Payment analytics** | ✅ | Admin stats dashboard with revenue, volume, gateway metrics |

## Pre-Launch Configuration Steps

### Last-Minute Setup
```bash
# 1. Set production Razorpay credentials in .env.production
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
RAZORPAY_KEY_SECRET=your_live_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_ACCOUNT_NUMBER=your_razorpayx_account_number
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY

# 2. Configure webhook in Razorpay Dashboard
# URL: https://api.tradingo.com/api/v1/payments/webhook/razorpay
# Events: payment.captured, payment.failed, refund.created

# 3. Verify settlement account
# Ensure RazorpayX account has sufficient balance for payouts

# 4. Test with a real transaction
# Create test buyer → Place order → Pay with UPI/CC → Verify webhook → Check settlement
```

## Critical Path Items

| # | Item | Impact | Fix |
|---|------|--------|-----|
| 1 | **RAZORPAY_ACCOUNT_NUMBER missing** | All payout API calls fail with 400 | Add to `.env.production` from RazorpayX dashboard |
| 2 | **Webhook secret not set** | All webhooks fail signature verification | Generate from Razorpay dashboard, set in `.env.production` |
| 3 | **Empty key validation not strict** | App starts without payment capability | Add production-only validation in app.config.ts |
| 4 | **Payout processor queue misconfigured** | May not trigger independently | Create dedicated payout queue in job-scheduler.service.ts |
