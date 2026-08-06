# SMS Integration (Phase 17.1)

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   SmsService                          │
│  ┌────────────────────────────────────────────────┐  │
│  │  send()          sendOtp()    sendTransactional() │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────┐ │  │
│  │  │Rate     │  │ Rate     │  │ Rate           │ │  │
│  │  │Limit    │  │ Limit    │  │ Limit          │ │  │
│  │  └────┬────┘  └────┬─────┘  └───────┬────────┘ │  │
│  │       └────────────┼────────────────┘           │  │
│  │                    ▼                            │  │
│  │          SmsProviderFactory                     │  │
│  │          ┌────────┴────────┐                    │  │
│  │          ▼                 ▼                    │  │
│  │   ConsoleSmsProvider  TwilioSmsProvider          │  │
│  │   (fallback, logs)    (real delivery)           │  │
│  │                    ▼                            │  │
│  │              SmsLog (Prisma)                    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## SMS Templates (sms.constants.ts)

| Template | Purpose | Format |
|---|---|---|
| OTP_LOGIN | Login verification | `Your TRADINGO login code is: {otp}. Valid for 5 minutes.` |
| OTP_REGISTER | Registration verification | `Welcome to TRADINGO! Your verification code is: {otp}.` |
| OTP_RESET_PASSWORD | Password reset | `Your TRADINGO password reset code is: {otp}.` |
| OTP_VERIFY_MOBILE | Mobile verification | `Your TRADINGO mobile verification code is: {otp}.` |
| ORDER_CONFIRMED | Order confirmed | `Order #{id} confirmed on TRADINGO. Track your order.` |
| ORDER_SHIPPED | Order shipped | `Order #{id} has been shipped! Tracking: {tracking}` |
| ORDER_DELIVERED | Order delivered | `Order #{id} has been delivered. Thank you!` |
| SHIPMENT_CREATED | Shipment created | `Shipment #{id} created on TRADINGO.` |
| DELIVERY_SCHEDULED | Delivery scheduled | `Your delivery is scheduled for {date}.` |
| QUOTE_RECEIVED | New quote | `You have received a new quote on TRADINGO.` |
| NEGOTIATION_MESSAGE | New negotiation message | `You have a new negotiation message on TRADINGO.` |
| PAYMENT_RECEIVED | Payment received | `Payment of ₹{amount} received on TRADINGO.` |

## Rate Limits

| Window | Max per Mobile |
|---|---|
| 1 minute | 5 SMS |
| 1 hour | 20 SMS |
| 24 hours | 50 SMS |

Rate limits are enforced in-memory. Exceeding limits silently fails (returns `{ success: false }` without sending).

## Provider Selection

The `SMS_PROVIDER` env var selects the provider:
- `console` (default) — logs to console, no real delivery
- `twilio` — real Twilio SMS delivery

Set `SMS_PROVIDER=twilio` with valid `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` in `.env`.

## Fallback Behavior

- If Twilio credentials are missing or Twilio SDK fails, the Twilio provider logs a warning and returns a fake success with `twilio-noop-{timestamp}` messageId
- The Console provider is always available as fallback
- All SMS operations persist to `SmsLog` regardless of provider

## API Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /sms/stats` | ADMIN | Delivery statistics (total sent/failed, by provider, by template, today count) |
| `GET /sms/logs` | ADMIN | Paginated SMS logs with search by phone/status/template/date range |
| `POST /sms/send-test` | ADMIN | Send a test SMS to a phone number |

## OTP Delivery Flow

1. **sendLoginOtp()** — Detects if identifier is a phone number (regex `^\+?[1-9]\d{9,14}$`), sends SMS via `SmsService.sendOtp()` with `OTP_LOGIN` template
2. **sendResetOtp()** — Same phone detection, sends with `OTP_RESET_PASSWORD` template
3. **sendOtp(type='mobile')** — Sends with `OTP_VERIFY_MOBILE` template via `SmsService`

## Notification SMS Flow

`NotificationProcessor.sendSms()` now uses `SmsService.send()` instead of console logging. It looks up the user's company mobile number and delivers the notification message body.

## Database

**SmsLog** model: phoneNumber, message, template, provider, status, messageId, error, cost, metadata, createdAt. Indexed by phoneNumber+createdAt, status+createdAt, template+createdAt.

## Files Created/Modified

| File | Change |
|---|---|
| `apps/api/package.json` | Added `twilio` dependency |
| `prisma/schema.prisma` | Added `SmsLog` model |
| `.env.example` | Added `SMS_PROVIDER` |
| `apps/api/src/modules/sms/sms.service.ts` | Created — SmsService with rate limiting + logging |
| `apps/api/src/modules/sms/sms.constants.ts` | Created — Template constants + rate limit config |
| `apps/api/src/modules/sms/sms.controller.ts` | Created — Admin endpoints |
| `apps/api/src/modules/sms/dto/send-sms.dto.ts` | Created — DTO validation |
| `apps/api/src/modules/sms/sms.module.ts` | Updated — register SmsService + SmsController + PrismaModule |
| `apps/api/src/modules/sms/providers/twilio.provider.ts` | Updated — proper Twilio import instead of require() |
| `apps/api/src/modules/auth/auth.service.ts` | Updated — SMS delivery for login OTP, reset OTP, mobile verification OTP |
| `apps/api/src/modules/notification/notification.processor.ts` | Updated — real SMS delivery via SmsService |
| `apps/web/app/admin/sms/page.tsx` | Created — Admin SMS dashboard |
| `apps/web/lib/api/admin-sms.ts` | Created — Typed API client |
| `apps/web/data/master-data.ts` | Updated — Added SMS Console nav item |

## Verification

- prisma validate ✅
- prisma generate ✅
- tsc (api) 0 errors ✅
- tsc (web) 0 errors ✅
- eslint (sms module) 0 errors, 2 warnings ✅
- next build 194 routes ✅
