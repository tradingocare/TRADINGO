# TRADINGO TradeServ Architecture

## Overview

TradeServ is TRADINGO's Professional Services Marketplace — connecting businesses with verified professionals (Chartered Accountants, Company Secretaries, GST Consultants, and more).

## Current Status

| Layer | Status | Details |
|-------|--------|---------|
| Frontend Pages | ✅ Existing | 21 pages fully built |
| Frontend Components | ✅ Existing | 11 reusable components |
| Backend APIs | ⬜ **Not Yet Implemented** | 76 endpoints needed across 9 modules |
| Database Models | ⬜ **Not Yet Implemented** | No TradeServ-specific Prisma models |
| AI Integration | ⬜ Future | AI matching for services |

## Existing Frontend Pages (21)

```
/tradeserv                          — Hub/landing page
/tradeserv/c/[slug]                 — Category detail (CA, CS, GST, etc.)
/tradeserv/categories               — All categories
/tradeserv/categories/[slug]        — Category listing
/tradeserv/p/[slug]                 — Professional profile
/tradeserv/register                 — Professional registration
/tradeserv/register/success         — Registration success
/tradeserv/search                   — Search professionals
/tradeserv/workspace/analytics      — Professional workspace analytics
/tradeserv/workspace/dashboard      — Professional workspace dashboard
/tradeserv/workspace/inquiries      — Service inquiries
/tradeserv/workspace/inquiries/[id] — Inquiry detail
/tradeserv/workspace/membership     — Professional membership
/tradeserv/workspace/portfolio      — Portfolio management
/tradeserv/workspace/profile        — Profile management
/tradeserv/workspace/proposals      — Proposal management
/tradeserv/workspace/reviews        — Reviews management
/tradeserv/workspace/services       — Service listing management
/tradeserv/workspace/settings       — Workspace settings
/tradeserv/workspace/tradtrust      — Trust score for professionals
/tradeserv/workspace/verification   — Professional verification
```

## Existing Frontend Components (11)

| Component | File | Purpose |
|-----------|------|---------|
| GlassCard | `tradeserv/glass-card.tsx` | Glass morphism card |
| FormInput | `tradeserv/form-input.tsx` | Styled form input |
| StatBox | `tradeserv/stat-box.tsx` | Statistics display |
| StarRating | `tradeserv/star-rating.tsx` | Rating component |
| SaveToast | `tradeserv/save-toast.tsx` | Toast notification |
| FilterPanel | `tradeserv/filter-panel.tsx` | Search filters |
| ProfessionalCard | `tradeserv/professional-card.tsx` | Professional listing card |
| InquiryModal | `tradeserv/inquiry-modal.tsx` | Send inquiry modal |
| SearchSkeleton | `tradeserv/search-skeleton.tsx` | Loading skeleton |
| SortDropdown | `tradeserv/sort-dropdown.tsx` | Sort options |

## Future Architecture (Planned)

### Proposed Backend Modules (9 modules, ~76 endpoints)

| Module | Endpoints | Purpose |
|--------|-----------|---------|
| Services | 12 | Service catalog CRUD, categories, pricing |
| Professionals | 10 | Profile CRUD, portfolio, certifications |
| Proposals | 8 | Proposal submission, management, status |
| Inquiries | 8 | Inquiry send, receive, accept, reject |
| Reviews | 6 | Review submit, list, moderation |
| Verification | 8 | Professional KYC, document upload, review |
| Membership | 8 | Professional plan management |
| Analytics | 6 | Professional dashboard analytics |
| Payments | 10 | Service payments, escrow, milestones |

### Integration Points

| Platform Feature | TradeServ Integration |
|-----------------|----------------------|
| GOCASH | Professional rewards for completed services |
| TradTrust | 6-dimension scoring adapted for professionals |
| AI Gateway | Service matching, smart proposals, pricing |
| Notifications | Inquiry alerts, proposal updates |
| Membership | Professional plan benefits |
| Ecosystem | XP/levels for professionals |

### Shared Infrastructure (Reuse)

TradeServ will reuse these existing patterns:
- Auth (same JWT + RBAC)
- GOCASH wallet (same ledger engine)
- Notification system (same templates + channels)
- AI Gateway (same providers + credit system)
- Storage (same file upload)
- Chat (same Socket.IO infrastructure)
- Payment (same Razorpay/Stripe integration)
