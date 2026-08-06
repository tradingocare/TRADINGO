# PAYMENT LIVE TEST

**Date:** 2026-07-21
**Phase:** P6B — Production Credential Verification
**Status:** ⚠️ CANNOT EXECUTE — Razorpay live credentials not yet provided

---

## Prerequisites

Before running these tests, the following must be set in `.env.production`:

| Variable | Value Format | Source |
|----------|-------------|--------|
| RAZORPAY_KEY_ID | `rzp_live_*` | Razorpay Dashboard → Settings → API Keys |
| RAZORPAY_KEY_SECRET | Live key secret | Razorpay Dashboard → Settings → API Keys |
| RAZORPAY_WEBHOOK_SECRET | Secret from webhook settings | Razorpay Dashboard → Settings → Webhooks |
| RAZORPAY_ACCOUNT_NUMBER | RazorpayX account number | Razorpay Dashboard → RazorpayX |
| PAYMENT_MODE | `live` | Already set in `.env.production` |

## Test Plan

### Test 1: API Startup with Live Keys

```bash
cd apps/api
NODE_ENV=production npx nest build
NODE_ENV=production npx nest start
# Expected: API starts without "Production environment validation failed" errors
```

### Test 2: Payment Order Creation

```bash
# As authenticated seller/buyer:
curl -X POST http://localhost:3001/api/v1/payments/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user-token>" \
  -d '{
    "type": "ORDER_PAYMENT",
    "amount": 10000,
    "currency": "INR",
    "orderId": "<existing-order-id>",
    "description": "Production payment test — ₹100"
  }'

# Expected response:
# {
#   "id": "<payment-id>",
#   "gatewayOrderId": "order_<razorpay-order-id>",
#   "amount": 10000,
#   "currency": "INR",
#   "keyId": "rzp_live_..."
# }
```

### Test 3: Payment Verification

```bash
# After completing payment on Razorpay Checkout:
curl -X POST http://localhost:3001/api/v1/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user-token>" \
  -d '{
    "razorpayOrderId": "order_<from-test-2>",
    "razorpayPaymentId": "pay_<from-checkout>",
    "razorpaySignature": "<from-checkout>"
  }'

# Expected response: status "CAPTURED"
```

### Test 4: Webhook Signature Verification

```bash
# Trigger test webhook from Razorpay dashboard
# Configure webhook URL: https://api.tradingotech.com/api/v1/payments/webhook/razorpay
# Send test event: "payment.captured"
# Expected: Returns 200 with {"status":"ok"}
```

### Test 5: Refund Flow

```bash
curl -X POST http://localhost:3001/api/v1/payments/<payment-id>/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"amount": 10000, "reason": "Payment live test refund"}'

# Expected: Refund created with status "PROCESSING"
```

## Failure Scenarios

| Scenario | Expected Behavior | Test |
|----------|------------------|------|
| Invalid key_id | API fails to start (production validation) | T1 |
| Invalid key_secret | Razorpay API returns auth error on T2 | T2 |
| Invalid webhook secret | Webhook returns 401 | T4 |
| Expired payment | Razorpay returns payment_expired error | T2 |
| Duplicate webhook | Returns `{status:'ok', message:'Event already processed'}` | T4 |
| Refund exceeds amount | 400 BadRequest | T5 |

## Results

| Test | Status | Notes |
|------|--------|-------|
| 1. API startup | ⏳ PENDING | Requires Razorpay live keys |
| 2. Order creation | ⏳ PENDING | Requires keys + valid order |
| 3. Payment verification | ⏳ PENDING | Requires checkout flow |
| 4. Webhook verification | ⏳ PENDING | Requires webhook secret |
| 5. Refund | ⏳ PENDING | Requires captured payment |

## Verdict

**NOT EXECUTED** — All tests require Razorpay production credentials from the Founder.
