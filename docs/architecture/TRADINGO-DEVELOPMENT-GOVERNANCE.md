# TRADINGO Development Governance (Permanent Rule)

Effective: 26 June 2026

The following modules are officially marked as:

🟢 **LOCKED**
🟢 **VERIFIED**
🟢 **PRODUCTION READY**

---

## Locked Modules

1. Homepage
2. Authentication
3. Seller Authentication
4. Vendor Registration
5. Seller Onboarding
6. Product Discovery
7. Product Card
8. Company Directory
9. Company Profile

---

## Mandatory Rules

### Rule 1 — Never Rebuild

Never redesign, rewrite, replace, or restructure a locked module.

Only extend existing functionality.

---

### Rule 2 — Preserve Architecture

Do not change:

- APIs
- Routing
- Folder structure
- Shared components
- Business logic
- UI consistency

unless explicitly approved.

---

### Rule 3 — Extension First

When implementing a new feature:

✅ Extend existing modules.

❌ Do not create duplicate pages or duplicate components.

Reuse existing:

- `ProductCard`
- `SellerBadge`
- `ProductDiscoveryClient`
- Company Profile
- Company Directory
- Authentication
- Route Guards

---

### Rule 4 — Backward Compatibility

Every new feature must preserve:

- Existing imports
- Existing props
- Existing routes
- Existing database schema
- Existing API contracts

No breaking changes.

---

### Rule 5 — Before Any Structural Change

If a task appears to require modifying a locked module:

1. Explain why.
2. Identify affected files.
3. Describe the impact.
4. Wait for user approval.
5. Only then implement.

---

### Rule 6 — Shared Components

Always prefer shared components over creating new ones.

If functionality already exists, reuse it.

Never duplicate business logic.

---

### Rule 7 — Production Quality

Every implementation must pass:

- TypeScript (`tsc --noEmit`)
- ESLint (`eslint`)
- Next Build (`next build`)
- Responsive verification
- Accessibility
- Performance

before completion.

---

### Rule 8 — Documentation

Every major feature must generate:

- Implementation Report
- Verification Report
- Rollback Notes (when applicable)

---

### Rule 9 — Development Priority

From now onward, development order is:

1. Membership Plans
2. Subscription System
3. Payment Gateway
4. Seller Product Upload
5. Product Detail Page
6. RFQ & Negotiation
7. Chat System
8. Orders & Checkout
9. Logistics
10. GOCASH™
11. TRADGO™
12. AI Marketplace Features

Do not revisit completed modules unless explicitly instructed.

---

## Final Policy

Treat the current TRADINGO architecture as the permanent production foundation.

Future work must build on this foundation — not replace it.

Any attempt to redesign a locked module must be rejected until explicit approval is received.
