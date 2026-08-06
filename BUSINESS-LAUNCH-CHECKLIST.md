# BUSINESS LAUNCH CHECKLIST

## Membership & Pricing

- [x] **Membership plans seeded** — 6 standard plans + 2 launch plans in DB
- [x] **Launch mode toggle works** — admin can switch to show only launch plans
- [x] **Razorpay payment flow** — subscription order → payment → verification → activation
- [x] **Coupon validation** — usage limits, plan scoping, expiry
- [x] **Referral validation** — code-based discount flow
- [x] **Invoice generation** — PDF with GST, HSN/SAC, tax breakdown
- [ ] **HIGH: Only Razorpay active** — Stripe, UPI, Cards, NetBanking are "Coming Soon". Consider adding at least one backup gateway before launch.
- [ ] **MEDIUM: Pricing hardcoded in seed** — prices are code-level, not configurable without redeployment

## Seller Onboarding

- [x] **7-step registration wizard** — Business Identity → Contact → PAN → GST → Profile → Bank → Plan
- [x] **9-section profile completion** — score-based, 70%+ unlocks "Go Live"
- [x] **KYC verification** — real API-driven company verification with Approve/Reject
- [x] **Go-live button** — POST /seller/go-live with auto-geocode
- [ ] **MEDIUM: Draft saved only in localStorage** — no server-side draft persistence
- [ ] **MEDIUM: Duplicate onboarding paths** — 3 separate flows (7-step wizard, 9-section onboarding, 3-step generic)

## Buyer Onboarding

- [x] **3-step registration wizard** — Personal Info → Company → Preferences
- [ ] **HIGH: Static onboarding page** — `currentStep = 1` hardcoded, never progresses
- [ ] **MEDIUM: No guided profile completion** — no score, no "Go Live" equivalent for buyers
- [ ] **MEDIUM: Registration and onboarding disconnected** — lands on dashboard, not onboarding

## Professional (TradeServ) Onboarding

- [x] **7-step registration wizard** — Basic Info → Professional → Services → Portfolio → Documents → Membership → Review
- [x] **Slug reservation** — real-time availability check
- [x] **Membership comparison** — component during registration
- [ ] **MEDIUM: Not linked from main auth flow** — separate entry point required

## Support Process

- [x] **Beta support module** — full ticket CRUD with categories, priorities, statuses
- [x] **Contact form** — works via /public/crm with honeypot spam protection
- [x] **Contact page** — email, phone, address, business hours
- [ ] **HIGH: No support ticket system for non-beta users** — buyer/seller support pages are static placeholders
- [ ] **HIGH: Tickets loaded via notifications API** — not a proper support ticket endpoint

## Escalation Process

- [x] **Full dispute lifecycle** — OPEN → REVIEW → EVIDENCE → NEGOTIATION → ESCALATED → ARBITRATION → RESOLVED
- [x] **Admin assignment** — round-robin + least-busy arbitration
- [x] **Evidence collection** — file upload per dispute
- [x] **Appeal process** — user can appeal admin decisions
- [ ] **MEDIUM: No admin dispute dashboard UI** — only backend API
- [ ] **MEDIUM: No SLA tracking** — dispute timestamps exist but no breach alerting

## Notification Templates

- [x] **82 notification types** across 16 categories
- [x] **150+ fallback templates** with {{variable}} interpolation
- [x] **In-app (WebSocket) delivery** — NotificationGateway
- [x] **Email delivery via AWS SES** — queued via BullMQ
- [x] **SMS delivery via Twilio** — real provider integration
- [ ] **HIGH: AWS SES credentials empty** — no email sent until configured
- [ ] **MEDIUM: PUSH notifications no-op** — no Firebase/APNS integration
