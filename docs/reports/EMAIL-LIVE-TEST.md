# EMAIL LIVE TEST

**Date:** 2026-07-21
**Phase:** P6B — Production Credential Verification
**Status:** ⚠️ CANNOT EXECUTE — AWS SES credentials not yet provided

---

## Prerequisites

Before running these tests, the following must be set in `.env.production`:

| Variable | Value Format | Source |
|----------|-------------|--------|
| AWS_ACCESS_KEY_ID | AKIA* key | AWS Console → IAM → User with SES permissions |
| AWS_SECRET_ACCESS_KEY | Secret key | AWS Console → IAM → User with SES permissions |
| AWS_REGION | `ap-south-1` | Already set — must match SES region |
| EMAIL_FROM | `noreply@tradingotech.com` | Already set in `.env.production` |

## AWS SES Pre-Setup Checklist

| Step | Action | Status |
|------|--------|--------|
| 1 | Request SES production sending limit increase | ⏳ PENDING |
| 2 | Verify `noreply@tradingotech.com` email identity in SES | ⏳ PENDING |
| 3 | Verify `tradingotech.com` domain identity in SES (DKIM) | ⏳ PENDING |
| 4 | Create IAM user with `AmazonSESFullAccess` policy | ⏳ PENDING |
| 5 | Copy IAM credentials to `.env.production` | ⏳ PENDING |
| 6 | Ensure region `ap-south-1` is SES-supported for production | ⏳ PENDING |

## Test Plan

### Test 1: API Startup

```bash
cd apps/api
NODE_ENV=production npx nest build
NODE_ENV=production npx nest start
# Expected: API starts without production validation errors
```

### Test 2: Transactional Email Delivery

Test each email type by triggering the corresponding action:

| Email Type | Action to Trigger | Expected Recipient |
|------------|------------------|--------------------|
| Welcome | Register a new buyer account | User's email |
| Password Reset | Request password reset on login page | User's email |
| OTP | Login with mobile number | User's mobile (SMS) |
| Payment Received | Complete a payment | Company email |
| Payment Failed | Failed payment (via webhook) | Company email |
| Generic Notification | Trigger any notification | User's email |

### Test 3: SES Verification

```bash
# Check SES sending statistics (if metrics endpoint is available):
curl http://localhost:3001/api/v1/metrics
# Look for ses_send_* metrics

# Check email logs (requires admin):
curl http://localhost:3001/api/v1/admin/email/logs \
  -H "Authorization: Bearer <admin-token>"
```

### Test 4: BullMQ Email Queue

```bash
# Check email queue status (requires admin):
curl http://localhost:3001/api/v1/admin/queues/email \
  -H "Authorization: Bearer <admin-token>"
# Expected: Completed job count increasing
```

## Failure Scenarios

| Scenario | Expected Behavior |
|----------|------------------|
| SES credentials missing | API fails to start (production validation) |
| SES in sandbox mode | Only verified emails receive mail — other sends fail |
| EmailFrom not verified | SES rejects send with MessageRejected error |
| DKIM not configured | Emails may land in spam folder |
| Rate limit exceeded | SES throttles, BullMQ retries |

## Results

| Test | Status | Notes |
|------|--------|-------|
| SES credentials configured | ⏳ PENDING | Requires AWS IAM credentials |
| SES domain verified | ⏳ PENDING | Requires AWS SES console action |
| Welcome email sent | ⏳ PENDING | Requires credentials + sandbox removal |
| Password reset email sent | ⏳ PENDING | Requires credentials |
| OTP SMS sent | ⏳ PENDING | Requires Twilio credentials |
| Payment notification | ⏳ PENDING | Requires Razorpay + SES |

## Verdict

**NOT EXECUTED** — All tests require AWS SES production credentials from the Founder. Additionally, SES must be moved out of sandbox mode and email identities must be verified before any email can be sent to non-verified recipients.
