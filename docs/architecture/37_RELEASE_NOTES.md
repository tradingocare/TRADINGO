# TRADINGO Release Notes

> **Status:** Pre-production — formal release notes will be generated for each production release.

## Version History

| Version | Date | Phase | Key Features |
|---------|------|-------|-------------|
| 0.1.0 | - | Foundation | Monorepo, Prisma schema, NestJS backend, Next.js frontend |
| 0.2.0 | - | Sprint 1 | Auth fix, RBAC, security patches |
| 0.3.0 | - | Sprint 2A | Indexes, pagination, DTO validation, onDelete policies |
| 0.4.0 | - | Sprint 2B | Seller workspace fixes, DTO migration |
| 0.5.0 | - | Sprint 3 | Buyer marketplace fixes, RFQ/Quote API |
| 0.6.0 | - | Phase 14B | CSRF, Sentry, liveness, quote acceptance |
| 0.7.0 | - | Phase 14D | Production audit, security certification |
| 1.0.0-rc.1 | - | Phase 14D.1 | Production blocker remediation |
| 1.0.0-rc.2 | - | Phase 15A.3 | GOCASH immutable ledger |
| 1.0.0-rc.3 | - | Phase 15A.5 | Referral engine |
| 1.0.0-rc.4 | - | Phase 15A.6 | Campaign engine |
| 1.0.0-rc.5 | - | Phase 15A.7 | Wallet API |
| 1.0.0-rc.6 | - | Phase 15A.8 | Premium wallet UX |
| 1.0.0-rc.7 | - | Phase 15A.9 | Platform integration |
| 1.0.0-rc.8 | - | Phase 15B.1 | TRADGO consolidation |
| 1.0.0-rc.9 | - | Phase 15B.2 | Buyer verification |
| 1.0.0-rc.10 | - | Phase 16.3 | Advertising platform |
| 1.0.0-rc.11 | - | Phase 16.6B | AI Seller workspace |
| 1.0.0-rc.12 | - | Phase 16.6C | AI Gateway with real providers |
| 1.0.0-rc.13 | - | Phase 16.6D-I | AI modules (RFQ, Quote, Negotiation, Finance, Search, Admin) |
| 1.0.0-rc.14 | - | Phase 16.7 | AI credits & membership |
| 1.0.0-rc.15 | - | Phase 17.0 | Near→Far→Best™ engine |
| 1.0.0-rc.16 | - | Phase 17.1 | SMS gateway |
| 1.0.0-rc.17 | - | Phase 18 | GOCASH Ecosystem 2.0 |
| 1.0.0-rc.18 | - | Phase 18.3 | Ecosystem finalization |
| 1.0.0-rc.19 | - | Phase 18.4 | Founder AI Executive OS |

## Current Release Candidate: v1.0.0-rc.19

### New in this release
- **Founder AI Executive OS** (11 features): Morning Brief, Evening Summary, Executive Dashboard, Decision Center, Risk Intelligence, Growth Intelligence, Founder Copilot, Business Health Score, Executive Priorities, Executive Timeline, Executive Reports
- **7-dimension health scoring engine** with weighted calculations
- **Executive Priorities** — top-10 ranked actions with impact/risk/ROI
- **Executive Timeline** — 5-period aggregation (Today → This Year)
- **Executive Reports** — period-over-period comparisons

### Verified
- prisma validate ✅
- prisma generate ✅
- tsc api 0 errors ✅
- tsc web 0 errors ✅
- turbo typecheck 6/6 ✅
- next build 247 routes ✅

### Known Issues
- TradeServ backend not yet implemented (21 frontend pages exist)
- Formal testing coverage below target
- No formal domain event bus
- No correlation IDs
