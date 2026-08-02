# TRADINGO® — Enterprise B2B Marketplace

> **Where Trust Meets Trade™**

TRADINGO is the Enterprise B2B Marketplace that unifies **Marketplace + TradeServ Professional Services** into a single AI-powered platform. We connect verified Indian manufacturers, exporters, and service professionals with global buyers through an ecosystem of trust, intelligence, and rewards.

## Architecture

```
E:\tradingo/
├── apps/
│   ├── api/        # NestJS 11 + Fastify 5 backend (port 3001)
│   └── web/        # Next.js 16 + React 19 frontend (port 3000)
├── packages/
│   ├── contracts/  # Shared API contracts
│   ├── gocash/     # GOCASH type definitions
│   ├── types/      # Shared TypeScript types
│   ├── ui/         # Shared UI components
│   └── utils/      # Shared utilities
├── prisma/         # Centralized Prisma schema (231 models, 160 enums)
├── deployment/     # Production deployment scripts
├── infrastructure/ # Docker & ECS configs
└── monitoring/     # Observability stack (Prometheus, Grafana, Sentry)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, Fastify 5, TypeScript 5.7 |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Database | PostgreSQL 16 (Prisma 6 ORM) |
| Cache/Queue | Redis (BullMQ) |
| Analytics | ClickHouse |
| Search | OpenSearch |
| AI Gateway | OpenRouter, Gemini, Groq, Tavily, Firecrawl |
| Payments | Razorpay, Stripe |
| SMS | Twilio |
| Auth | JWT + Passport (Google, LinkedIn OAuth) |
| WebSocket | Socket.IO + Redis adapter |
| Monitoring | Sentry, Prometheus, Grafana |
| State | TanStack Query 5, Zustand 5 |
| Maps | Leaflet + React Leaflet |

## Key Features

- **AI-First**: 19 AI task types, 5 providers, 9 domain-specific AI modules
- **GOCASH Ecosystem**: Wallet, XP, Levels, Badges, Missions, Campaigns, Referrals
- **Marketplace Intelligence**: Near→Far→Best™ ranking, TradTrust 6-dimension scoring
- **Full Trading Workflow**: RFQ → Quote → Negotiation → PO → Order → Shipment → Delivery → Payment
- **Multi-Channel Notifications**: In-app (Socket.IO), Email (SES), SMS (Twilio)
- **Role-Based Access**: 7 roles (SUPER_ADMIN, ADMIN, SELLER, BUYER, etc.)
- **Founder AI**: 11-feature executive intelligence command center

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Start infrastructure (PostgreSQL, Redis)
pnpm docker:up

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development servers (API + Web)
pnpm dev
```

- **API**: http://localhost:3001/api/v1
- **Web**: http://localhost:3000
- **Swagger Docs**: http://localhost:3001/api/docs

## Verification Commands

```bash
pnpm lint                  # Lint all apps
pnpm typecheck             # TypeScript check all packages
pnpm db:validate           # Validate Prisma schema
pnpm db:generate           # Generate Prisma client
cd apps/api && npx tsc --noEmit  # TypeScript check API
cd apps/web && npx tsc --noEmit  # TypeScript check Web
cd apps/web && npx next build    # Production build (247 routes)
```

## Documentation

Extensive documentation is available in the repository root:

| Document | Purpose |
|----------|---------|
| `00_PROJECT_CONSTITUTION.md` | Engineering constitution and golden rules |
| `03_ARCHITECTURE.md` | Complete system architecture |
| `08_PRISMA_SCHEMA.md` | Database schema reference |
| `09_API_INVENTORY.md` | Complete API endpoint inventory |
| `10_MODULE_INVENTORY.md` | All 74 backend modules |
| `13_AI_ARCHITECTURE.md` | AI Gateway and modules |
| `18_GOCASH_ECOSYSTEM.md` | Rewards and wallet system |
| `20_TRADESERV_ARCHITECTURE.md` | Professional services marketplace |
| `24_AI_HANDOFF_MEMORY.md` | AI/developer handoff guide |
| `AGENTS.md` | Session context and phase history |
| `KNOWLEDGE.md` | Full platform knowledge base |

## License

**TRADINGO®** — All Rights Reserved. Proprietary software.
