# TRADINGO API Inventory

> All API endpoints are prefixed with `/api/v1/`.
> Total: 500+ endpoints across 74 modules, 124 controllers.

## Auth Module

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /auth/register | Register new user | Public |
| POST | /auth/login | Login with email/password | Public |
| POST | /auth/social-login | Google/LinkedIn OAuth | Public |
| POST | /auth/forgot-password | Send reset link | Public |
| POST | /auth/reset-password | Reset password with token | Public |
| POST | /auth/change-password | Change password | JWT |
| POST | /auth/verify-email | Verify email with OTP | Public |
| POST | /auth/verify-mobile | Verify mobile with OTP | Public |
| PATCH | /auth/me | Update profile/settings | JWT |
| POST | /auth/refresh | Refresh JWT token | Public |

## Users Module

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | /users | List users (paginated) | ADMIN |
| GET | /users/:id | Get user by ID | ADMIN |
| PATCH | /users/:id | Update user | ADMIN |
| DELETE | /users/:id | Soft-delete user | ADMIN |

## Companies Module

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | /companies | List companies | Public |
| GET | /companies/my-company | Get own company | JWT |
| GET | /companies/:slug | Get by slug | Public |
| GET | /companies/:id | Get by ID | JWT |
| POST | /companies | Create company | JWT |
| PATCH | /companies/:id | Update company | CompanyOwner |
| DELETE | /companies/:id | Soft-delete | CompanyOwner |

## Products Module (~20 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| GET | /products, /products/:id, /products/:slug | Browse products |
| POST/PATCH/DELETE | /products/* | CRUD (admin/seller) |
| GET | /products/bestsellers | Weekly bestsellers |
| GET/POST | /products/:id/reviews, /products/:id/qa | Reviews & Q&A |

## Smart RFQ Module (~15 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| POST/GET | /smart-rfq | Create/list RFQs |
| GET/PATCH | /smart-rfq/:id | Get/update RFQ |
| GET | /smart-rfq/:id/quotes | Get RFQ quotes |
| POST | /smart-rfq/:rfqId/accept-quote/:quoteId | Accept quote |
| POST | /smart-rfq/:rfqId/reject-quote/:quoteId | Reject quote |
| GET | /smart-rfq/seller/matches | Seller matches |
| POST | /smart-rfq/:id/ai/* | 10 RFQ AI features |

## Quote Module (~15 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| POST/GET | /quotes | Create/list quotes |
| GET/PATCH | /quotes/:id | Get/update quote |
| GET | /quotes/:id/ai/* | 10 AI quote features |
| POST | /quotes/:id/revise | Revise quote |

## Smart Negotiation Module (~20 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| POST | /smart-negotiation/start | Start negotiation |
| POST | /smart-negotiation/:id/counter | Counter offer |
| POST | /smart-negotiation/:id/accept | Accept |
| POST | /smart-negotiation/:id/reject | Reject |
| POST | /smart-negotiation/:id/ai/* | 12 AI negotiation features |
| GET | /smart-negotiation/:id | Get details |

## Smart PO Module

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| POST/GET | /smart-po | Create/list POs |
| GET/PATCH | /smart-po/:id | Get/update PO |
| POST | /smart-po/:id/confirm | Confirm PO |

## Order Module (~15 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| POST/GET | /orders | Create/list orders |
| GET/PATCH | /orders/:id | Get/update order |
| POST | /orders/:id/cancel | Cancel order |
| GET | /orders/:id/timeline | Order timeline |

## Payment Module (~15 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| POST | /payments/create-order | Create Razorpay/Stripe order |
| POST | /payments/verify | Verify payment signature |
| POST | /payments/refund | Initiate refund |
| POST | /payments/webhook | Razorpay/Stripe webhook |
| GET | /payments/history | Payment history |

## GOCASH Wallet Module (~16 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /gocash/wallets | Create wallet (ADMIN) |
| GET | /gocash/wallets/my | Get own wallet |
| GET | /gocash/wallets/:id | Get wallet by ID (ADMIN) |
| POST | /gocash/wallets/:id/credit | Manual credit (ADMIN) |
| POST | /gocash/wallets/:id/debit | Manual debit (ADMIN) |
| POST | /gocash/wallets/:id/redeem | Request redemption |
| POST | /gocash/redemptions/:id/approve | Approve (ADMIN) |
| POST | /gocash/redemptions/:id/reject | Reject (ADMIN) |
| POST | /gocash/transactions/:id/reverse | Reverse (ADMIN) |
| GET | /gocash/wallets/:id/ledger | View ledger |
| GET | /gocash/admin/wallets | List wallets (ADMIN) |
| GET | /gocash/admin/wallets/stats | Wallet stats (ADMIN) |

## Wallet API Module (~22 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /wallet/buyer/summary | Buyer wallet summary |
| GET | /wallet/buyer/balance | Buyer balance |
| GET | /wallet/buyer/transactions | Buyer transactions |
| GET | /wallet/buyer/rewards | Buyer rewards |
| GET | /wallet/buyer/statement | Buyer statement |
| GET | /wallet/seller/summary | Seller wallet summary |
| GET | /wallet/seller/transactions | Seller transactions |
| GET | /wallet/seller/statement | Seller statement |
| GET | /wallet/seller/analytics | Seller analytics |
| GET | /wallet/admin/wallets | Search wallets (ADMIN) |
| GET | /wallet/admin/wallets/:id | Wallet detail (ADMIN) |
| POST | /wallet/admin/wallets/:id/freeze | Freeze (ADMIN) |
| POST | /wallet/admin/wallets/:id/unfreeze | Unfreeze (ADMIN) |
| POST | /wallet/admin/credit | Manual credit (ADMIN) |
| POST | /wallet/admin/debit | Manual debit (ADMIN) |
| POST | /wallet/admin/adjust | Adjust balance (ADMIN) |
| POST | /wallet/admin/reverse | Reverse txn (ADMIN) |
| GET | /wallet/admin/ledger | Search ledger (ADMIN) |
| GET | /wallet/admin/fraud-alerts | Fraud alerts (ADMIN) |
| GET | /wallet/analytics/* | 4 analytics endpoints |

## GOCASH Integration Module (10 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /gocash-integration/membership/signup | Signup bonus |
| POST | /gocash-integration/membership/plan-upgrade | Upgrade bonus |
| POST | /gocash-integration/order/completed | Order reward |
| POST | /gocash-integration/rfq/created | RFQ reward |
| POST | /gocash-integration/quote/accepted | Quote reward (dual) |
| POST | /gocash-integration/negotiation/completed | Negotiation reward |
| POST | /gocash-integration/po/confirmed | PO reward |
| POST | /gocash-integration/shipment/confirmed | Shipment reward |
| POST | /gocash-integration/delivery/confirmed | Delivery reward |
| GET | /gocash-integration/summary | Integration summary |

## Ecosystem Module (~25 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /ecosystem/dashboard | User dashboard |
| GET | /ecosystem/xp/balance | XP balance |
| GET | /ecosystem/xp/history | XP history |
| POST | /ecosystem/checkin | Daily check-in |
| GET | /ecosystem/checkin/history | Check-in history |
| GET | /ecosystem/streaks | User streaks |
| GET | /ecosystem/levels | All levels |
| GET | /ecosystem/levels/my | User level |
| GET | /ecosystem/badges | All badges |
| GET | /ecosystem/badges/my | User badges |
| GET | /ecosystem/missions | Available missions |
| GET | /ecosystem/missions/my | User missions |
| GET | /ecosystem/achievements | Achievements |
| GET | /ecosystem/achievements/my | User achievements |
| GET | /ecosystem/ai-intelligence | AI suggestions |
| GET | /ecosystem/user-summary | User summary |
| GET | /ecosystem/admin/dashboard | Admin dashboard |
| GET | /ecosystem/admin/xp-chart | XP chart (ADMIN) |
| POST | /ecosystem/seed | Seed data (ADMIN) |

## AI Gateway Module (16 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /ai-gateway/process | Core AI processing |
| POST | /ai-gateway/stream | SSE streaming |
| GET | /ai-gateway/credits/balance | Credit balance |
| GET | /ai-gateway/providers | List providers (ADMIN) |
| POST | /ai-gateway/providers | Create provider (ADMIN) |
| PATCH | /ai-gateway/providers/:name | Update provider (ADMIN) |
| POST | /ai-gateway/providers/api-key | Set API key (ADMIN) |
| POST | /ai-gateway/providers/:name/health | Health check (ADMIN) |
| GET/POST | /ai-gateway/prompts | Manage prompts (ADMIN) |

## Founder AI Module (11 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /admin/founder-ai/morning-brief | Daily brief |
| GET | /admin/founder-ai/evening-summary | EOD summary |
| GET | /admin/founder-ai/executive-dashboard | Full dashboard |
| POST | /admin/founder-ai/decision-center | Decision analysis |
| GET | /admin/founder-ai/risk-intelligence | Risk analysis |
| GET | /admin/founder-ai/growth-intelligence | Growth insights |
| POST | /admin/founder-ai/copilot | Q&A copilot |
| GET | /admin/founder-ai/health-score | Business health |
| GET | /admin/founder-ai/priorities | Top priorities |
| GET | /admin/founder-ai/timeline | Executive timeline |
| GET | /admin/founder-ai/report/:type | Executive report |

## TradFind Search Module (~15 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /search/products | Product search |
| GET | /search/companies | Company search |
| GET | /search/global | Global search |
| GET | /search/autocomplete | Autocomplete |
| GET | /search/discovery-feed | Discovery feed |
| GET | /search/ai/* | 11 AI search features |

## Campaign Module (20 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| CRUD | /campaigns | Campaign management |
| GET | /campaigns/active | Active campaigns |
| GET | /campaigns/my-claims | User claims |
| POST | /campaigns/:id/claim | Claim reward |
| POST | /campaigns/:id/clone | Clone campaign |
| POST | /campaigns/:id/pause | Pause campaign |
| POST | /campaigns/:id/resume | Resume campaign |
| POST | /campaigns/:id/archive | Archive campaign |

## Referral Module (17 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| CRUD | /referrals/codes | Referral codes |
| POST | /referrals/validate | Validate code |
| POST | /referrals/apply | Apply referral |
| GET | /referrals/history | User history |
| GET | /referrals/statistics | User stats |
| GET | /referrals/admin/* | Admin endpoints |

## Advertising Module (~20 endpoints)

| Method | Endpoint Range | Purpose |
|--------|----------------|---------|
| CRUD | /advertising | Ad management |
| POST | /advertising/:id/fund | Fund via GOCASH |
| POST | /advertising/:id/pause | Pause |
| POST | /advertising/:id/stop | Stop |
| GET | /advertising/placements | Get placements |
| ADMIN | /admin/advertising/* | Admin ad management |
| POST | /admin/advertising/:id/approve | Approve |
| POST | /admin/advertising/:id/reject | Reject |

## AI Sub-Module Endpoints

| Module | Endpoints | TaskType | Credits |
|--------|-----------|----------|---------|
| AI Search | /search/ai/* (11) | SEARCH_ANALYSIS | 5 |
| AI Finance | /finance/ai/* (10) | FINANCE_ANALYSIS | 10 |
| AI Admin | /admin/ai/* (12) | ADMIN_INTELLIGENCE | 10 |
| AI Negotiation | /smart-negotiation/:id/ai/* (12) | NEGOTIATION | 20 |
| AI RFQ | /smart-rfq/:id/ai/* (10) | RFQ_ANALYSIS | 15 |
| AI Quote | /quotes/:id/ai/* (10) | QUOTE_ANALYSIS | 15 |
| AI CRM | /crm/:id/ai/* (12) | CRM_ANALYSIS | 5 |

## Remaining Modules (Summary)

- **Analytics**: GET endpoints for dashboard, events, ClickHouse queries
- **CRM**: 50+ endpoints (leads, pipelines, follow-ups, tasks, notes, timeline, reports)
- **Finance**: 30+ endpoints (dashboard, credit, collections, credit-notes, RM finance)
- **Dispute**: 20+ endpoints (CRUD, admin, assignment, analytics)
- **Escrow**: 15+ endpoints (create, release, refund, analytics)
- **Settlement**: 15+ endpoints (create, process, retry, analytics)
- **Notification**: 10+ endpoints (list, mark-read, preferences, templates)
- **Chat**: 20+ endpoints (conversations, messages, presence, search, moderation)
- **Communication**: 25+ endpoints (conversation, messages, labels, templates, moderation)
- **CRM**: 50+ endpoints (leads, pipelines, tasks, follow-ups, reports)
- **Location Intelligence**: 7 endpoints (geocode, nearby, clusters)
- **Marketplace Intelligence**: 2 endpoints (best-supplier, buyer-history)
- **Membership**: 10+ endpoints (plans, current, purchase, admin management)
- **Billing**: 15+ endpoints (invoices, PDF generation, tax)
- **SMS**: 4 endpoints (send, stats, logs, test)
- **Storage**: 5+ endpoints (upload, delete, signed URLs)
- **TradTrust**: 4 endpoints (score, history, recalculate)
- **TradGo**: 3 endpoints (leaderboard, my score, history)
- **TradMatch**: 5+ endpoints (match, recommendations)
- **Seller Analytics**: 10+ endpoints (overview, products, orders, RFQs)
- **Buyer**: 15+ endpoints (dashboard, analytics, downloads, notifications, saved-suppliers)
- **Smart Shipment/Delivery**: 10+ endpoints each
- **KYC/Verification**: 10+ endpoints (submit, review, list)
- **Beta Program**: 15+ endpoints (invites, feedback, support, tracking)
- **Launch**: 10+ endpoints (checklist, incidents, dashboard)
- **Market/Freight/Territory Intelligence**: 5+ endpoints each
- **Gallery**: 5+ endpoints (upload, reorder, delete)
- **Categories/Industries**: CRUD endpoints
- **Category Templates**: 15+ endpoints (templates, sections, fields)
- **Product Attributes**: 5+ endpoints
- **Product Locations**: 10+ endpoints
- **Bulk Operations**: 5+ endpoints (import, export, status)
- **Product Claims**: 10+ endpoints
- **Malware**: 5+ endpoints (scan, status, events)
- **Onboarding**: 5+ endpoints (progress, steps)
- **Profile Completion**: 2 endpoints (score, recommendations)
- **Vendor Codes**: 3 endpoints (generate, validate, list)
- **Organizations**: 10+ endpoints (CRUD, members, invitations)
- **Company Locations**: 10+ endpoints
- **Near Me**: 3 endpoints (nearby products, companies, radius search)
