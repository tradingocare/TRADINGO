# Bug List — TRADINGO v1.0.0 — Phase P2 Test Run

**Date**: 2026-07-20  
**Source**: Automated API testing (25 assertions, 100% PASS)  

---

## P0 — Production Blocking (0)

None.

## P1 — Critical (1 found, 1 fixed)

| # | Module | Bug | Status |
|---|--------|-----|--------|
| 1 | Wallet API | `wallet-api.controller.ts` uses `req.user.userId` but JWT payload stores `sub`. All 24 endpoint handlers broken. | **✅ FIXED** — Changed `req.user.userId` → `req.user.sub` in all handler methods |

## P2 — Major (0)

None.

## P3 — Minor (2 data gaps, not code bugs)

| # | Area | Issue | Notes |
|---|------|-------|-------|
| 2 | Wallets | `newtest@tradingo.com` and `seller2@tradingo.com` have no wallets | Users created via SQL INSERT — signup bonus event never fired. Wallet `findUnique({userId})` returns 404. Not a code defect. |
| 3 | Vendor Matching | Quote creation returns 403 unless seller has `RfqVendorMatch` record | Business rule: "Only matched vendors can quote". Buyer must initiate vendor matching via NearToFar or manual match creation. Works as designed. |

## Fixed During Test Run

| Fix | File | Before | After |
|-----|------|--------|-------|
| Wallet userId → sub | `wallet-api.controller.ts` | `req.user.userId` (24 places) | `req.user.sub` |

## Non-Bugs (Correct Behavior)

These were initially flagged as failures but confirmed as correct:

| Issue | Endpoint | Initial Error | Verdict |
|-------|----------|--------------|---------|
| KYC "my" 404 | `GET /company-verifications/my` | 404 — endpoint doesn't exist | Route is `GET /company-verifications/company/:companyId` — test was wrong |
| Quote DTO 400 | `POST .../quotes` | `items should not exist`, `validUntil should not exist` | DTO expects `lineItems` and `validityDate` — test was wrong |
| Product slug conflict | `POST /seller/products` | "Slug already exists" | Product already created by prior run — test used duplicate name |
