# Payment Gateway Architecture — Phase 10C

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT GATEWAY ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────┘

  Frontend (Next.js)
  ┌─────────────────────────────────────────────┐
  │  /subscription/payment    ← Razorpay SDK    │
  │  /subscription/success                      │
  │  /subscription/failed                       │
  │  /admin/payments         ← Admin dashboard  │
  └──────────────┬──────────────────────────────┘
                 │ REST API (JWT)
                 ▼
  Backend (NestJS)
  ┌─────────────────────────────────────────────┐
  │  PaymentSubscriptionController              │
  │  ├── POST /payment/razorpay/order           │
  │  ├── POST /payment/razorpay/verify          │
  │  ├── POST /payment/stripe/order             │
  │  └── POST /payment/stripe/verify            │
  │                                             │
  │  PaymentWebhookController                   │
  │  ├── POST /payments/webhook/razorpay        │
  │  └── POST /payments/webhook/stripe          │
  │                                             │
  │  PaymentAdminController                     │
  │  ├── GET /admin/payments                    │
  │  ├── GET /admin/payments/stats              │
  │  └── GET /admin/payments/gateway-logs       │
  │                                             │
  │  PaymentController (existing)               │
  │  └── /companies/:companyId/payments/*       │
  └──────────────┬──────────────────────────────┘
                 │
                 ▼
  PaymentService (orchestration layer)
  ┌─────────────────────────────────────────────┐
  │  createSubscriptionGatewayOrder()            │
  │  verifySubscriptionPayment()                 │
  │  handlePaymentSuccess()  ← SUBSCRIPTION type │
  │  handleWebhookEvent()     ← enhanced         │
  └──────────────┬──────────────────────────────┘
                 │
          ┌──────┴──────┐
          ▼              ▼
  Gateway Interface   MembershipService
  ┌──────────────┐   ┌──────────────────┐
  │ Razorpay     │   │ activateSub     │
  │ Stripe       │   │ scription()      │
  │ (PayPal,etc) │   └──────────────────┘
  └──────────────┘
```

## Folder Structure

```
apps/api/src/modules/payment/
├── payment.module.ts                    # Module — imports MembershipModule + AnalyticsModule
├── payment.controller.ts                # Existing — company-scoped CRUD
├── payment.service.ts                   # Enhanced — +SUBSCRIPTION type handling
├── payment-subscription.controller.ts   # NEW — /payment/{gateway}/{order|verify}
├── payment-webhook.controller.ts        # Enhanced — +Stripe webhook
├── payment-admin.controller.ts          # NEW — /admin/payments (admin-protected)
├── payment-analytics.service.ts         # Existing
├── dto/
│   ├── create-payment-order.dto.ts      # +SUBSCRIPTION enum value
│   ├── verify-payment.dto.ts            # Existing
│   ├── subscription-order.dto.ts        # NEW — CreateSubscriptionOrderDto, VerifySubscriptionPaymentDto
│   └── create-refund.dto.ts             # Existing
├── gateways/
│   ├── gateway.interface.ts             # NEW — IPaymentGateway abstraction
│   ├── razorpay.service.ts             # MOVED from parent — implements IPaymentGateway
│   ├── stripe.service.ts               # NEW — implements IPaymentGateway
│   └── index.ts                         # NEW — getGateway() factory
├── utils/
│   ├── signature.ts                     # NEW — signature generation/verification helpers
│   └── invoice.ts                       # NEW — invoice number generation, GST calc
└── __tests__/

apps/web/app/subscription/payment/
├── page.tsx                             # NEW — server wrapper
└── PaymentClient.tsx                    # NEW — Razorpay SDK integration, gateway selection

apps/web/app/admin/payments/
├── page.tsx                             # NEW — server wrapper
└── AdminPaymentsClient.tsx              # NEW — admin dashboard with filters
```

## Gateway Abstraction

Interface: `IPaymentGateway`

```typescript
interface IPaymentGateway {
  readonly name: string
  createOrder(amount, currency, receipt, notes?): Promise<PaymentGatewayOrder>
  verifyPayment(params): boolean
  verifyWebhookSignature(rawBody, signature): boolean
  fetchPayment(gatewayPaymentId): Promise<any>
  createRefund(params): Promise<PaymentGatewayRefundResult>
  getKeyId(): string
}
```

Adding a new gateway:
1. Create `{gateway}.service.ts` implementing `IPaymentGateway`
2. Add to `gateways/index.ts` factory
3. Add to `payment.module.ts` providers
4. Add webhook route in `payment-webhook.controller.ts`
5. Add API keys to `.env`

## Webhook Flow

```
Razorpay/Stripe → POST /payments/webhook/{gateway}
                        │
                        ▼
                 Verify signature (raw body + header)
                        │
                   ┌────┴────┐
                   ▼         ▼
              Valid?      Invalid → return 200 { error }
                   │
                   ▼
            Check idempotency (ProcessedWebhookEvent.eventId)
                   │
              ┌────┴────┐
              ▼         ▼
           New?      Duplicate → return 200 { already processed }
               │
               ▼
        handleWebhookEvent(event, payload)
          ├── payment.captured → activate subscription / credit pack
          ├── payment.failed   → mark payment FAILED
          ├── refund.created   → mark refund COMPLETED
          └── checkout.session.completed (Stripe)
               │
               ▼
        Store ProcessedWebhookEvent (replay protection)
```

## Security Checklist

- [x] **Signature verification** — All webhooks verify HMAC-SHA256 (Razorpay) or Stripe SDK (Stripe)
- [x] **Webhook verification** — Every webhook event signature is verified before processing
- [x] **Replay attack prevention** — `ProcessedWebhookEvent` deduplication with unique `eventId` index
- [x] **Idempotency** — `handleWebhookEvent` checks for existing processing before execution
- [x] **Duplicate payment protection** — Webhook and verify endpoints check `gatewayPaymentId` uniqueness
- [x] **Amount validation** — Payment amount is set server-side during order creation, not from client
- [x] **Subscription validation** — Plan existence verified before payment order creation
- [x] **JWT authentication** — All payment endpoints (except webhooks) require JWT auth

## API Contracts

### POST /payment/razorpay/order (JWT)
```json
// Request
{ "planId": "trade_pro", "planTier": "A", "duration": 1 }
// Response
{ "id": "uuid", "orderId": "ORD-XXXX", "gatewayOrderId": "order_xxxx", "amount": 24000, "currency": "INR", "keyId": "rzp_test_xxx", "planName": "Trade Pro" }
```

### POST /payment/razorpay/verify (JWT)
```json
// Request
{ "paymentId": "uuid", "gatewayPaymentId": "pay_xxxx", "gatewaySignature": "sig_xxxx" }
// Response
{ "success": true, "paymentId": "uuid", "planId": "trade_pro", "planTier": "A", "amount": 24000 }
```

### POST /payments/webhook/razorpay (Public)
```json
// Header: x-razorpay-signature: <hmac-sha256>
// Header: x-razorpay-event: payment.captured
// Body: raw JSON payload
// Response: { "status": "ok" }
```

### GET /admin/payments?page=1&limit=20&status=CAPTURED (Admin JWT)
```json
// Response
{ "data": [{...}], "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 } }
```

## Database Mapping

| Prisma Model | Gateway Purpose | Key Fields |
|---|---|---|
| `Payment` | Primary transaction record | `type: SUBSCRIPTION`, `gateway`, `status`, `gatewayOrderId`, `gatewayPaymentId`, `gatewaySignature`, `amount`, `notes` (JSON: planId, planTier, duration) |
| `Refund` | Refund tracking | `paymentId`, `gatewayRefundId`, `amount`, `status` |
| `Invoice` | GST invoice | `paymentId`, `companyId`, `subtotal`, `taxAmount`, `totalAmount`, `status` |
| `ProcessedWebhookEvent` | Idempotency & replay protection | `eventId` (unique), `gateway`, `payload`, `processedAt` |
| `SubscriptionEvent` | Subscription audit log | `companyId`, `status`, `planType`, `metadata` |
| `PlanHistory` | Plan change history | `companyId`, `planId`, `changeType`, `toStatus`, `amount` |

## Payment States

```
PENDING → PROCESSING → CAPTURED → (success)
                           │
                           ├── REFUNDED
                           └── PARTIALLY_REFUNDED
PENDING → FAILED
PENDING → CANCELLED (expired order)
```

## Future Gateways

Adding a new gateway requires:

| Step | File | Change |
|------|------|--------|
| 1 | `gateways/{name}.service.ts` | Create implementing `IPaymentGateway` |
| 2 | `gateways/index.ts` | Add import + `getGateway()` case |
| 3 | `payment.module.ts` | Add to `providers` |
| 4 | `payment-webhook.controller.ts` | Add `POST /payments/webhook/{name}` route |
| 5 | `.env` | Add API keys + webhook secret |

Supported future gateways:
- **PayPal** — REST API with OAuth2, webhooks with webhook ID verification
- **PayU** — Hash-based signature verification, transaction flow
- **PhonePe** — PG URL + redirect flow, X-Verify header
- **Cashfree** — API v2 with signature, webhooks with signature verification

## Environment Variables

```bash
# Current
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=whsec_xxx

# Added (Stripe)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Rollback Strategy

| Scenario | Action |
|----------|--------|
| Razorpay order creation fails | Payment record is NOT created — order is retriable |
| Frontend SDK payment fails | Payment record remains PENDING — user can retry |
| Signature verification fails | Payment NOT captured — no subscription activation |
| Webhook processing fails | Webhook returns 200 (no retry) — event stored in ProcessedWebhookEvent |
| Webhook duplicate received | Idempotency check skips processing — 200 returned |
| Payment verified but subscription activation fails | Payment is CAPTURED but company not activated — manual reconciliation via admin dashboard |
| Stripe integration fails | System falls back to Razorpay (primary) |
