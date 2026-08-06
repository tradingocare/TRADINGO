# TRADINGO Folder Structure

> This document describes the complete folder structure and explains the purpose of every top-level and key subdirectory.

## Root Level

```
E:\tradingo/
├── apps/                          # Application packages (2)
│   ├── api/                       # NestJS 11 + Fastify 5 backend (port 3001)
│   └── web/                       # Next.js 16 + React 19 frontend (port 3000)
├── packages/                      # Shared packages (5)
│   ├── contracts/                 # Shared API contracts, enums, pagination types
│   ├── gocash/                    # GOCASH type definitions (placeholder)
│   ├── types/                     # Shared TypeScript types (auth, api)
│   ├── ui/                        # Shared UI components (placeholder/empty)
│   └── utils/                     # Shared utilities (cn, formatDate, sleep, truncate, generateId)
├── prisma/                        # Central Prisma schema and migrations
│   ├── schema.prisma              # 170+ models, 160 enums (6884 lines)
│   ├── migrations/                # Database migration history
│   ├── seed.ts                    # Seed script entry point
│   ├── seed-data/                 # Seed data files
│   ├── seed-scripts/              # Organized seed scripts
│   ├── seeds/                     # Additional seed data
│   └── clickhouse-sql.sql         # ClickHouse analytics schema
├── deployment/                    # Production deployment scripts and configs
│   ├── terraform/                 # IaC (Terraform)
│   ├── deploy.sh                  # Deployment script
│   ├── deploy-production.sh       # Production deployment
│   ├── ecs-task-definition-api.json  # ECS task definition for API
│   ├── cloudfront.yml             # CloudFront CDN configuration
│   ├── rds-init.sql               # RDS initialization
│   ├── clickhouse-init.sql        # ClickHouse initialization
│   ├── opensearch-init.sh         # OpenSearch initialization
│   ├── ssl-config.md              # SSL/TLS configuration
│   └── blue-green-deploy.md       # Blue-green deployment strategy
├── infrastructure/                # Docker and ECS infrastructure
│   ├── docker-compose.yml         # Local development infrastructure
│   ├── docker-compose.monitoring.yml  # Monitoring stack
│   ├── docker/                    # Dockerfile configs
│   └── ecs/                       # ECS service configs
├── monitoring/                    # Observability configuration
│   ├── prometheus.yml             # Prometheus scrape config
│   ├── prometheus-alertmanager.yml  # Alertmanager config
│   ├── grafana-dashboard.json     # Pre-built Grafana dashboard
│   ├── dashboards/                # Additional dashboards
│   ├── grafana/                   # Grafana configs
│   ├── prometheus/                # Prometheus configs
│   ├── sentry.yml                 # Sentry config
│   ├── alerting-rules.yml         # Alert rules
│   └── backup-strategy.md         # DB backup strategy
├── security/                      # Security documentation
│   ├── ABAC-POLICY.md             # Attribute-Based Access Control policy
│   ├── SECURITY-REPORT.md         # Security audit report
│   └── scripts/                   # Security scripts
├── docs/                          # General documentation
├── load-tests/                    # Load testing scripts
├── tests/                         # End-to-end tests
├── uat/                           # User acceptance test reports
├── reports/                       # Phase completion reports
├── .github/                       # GitHub Actions workflows
├── package.json                   # Monorepo root scripts
├── turbo.json                     # Turborepo pipeline config
├── pnpm-workspace.yaml            # Workspace definition (apps/*, packages/*)
├── tsconfig.base.json             # Base TypeScript config
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .npmrc                         # npm/pnpm configuration
├── .dockerignore / .gitignore     # Ignore files
├── AGENTS.md                      # Session context (automated workflow)
├── KNOWLEDGE.md                   # Full architecture knowledge base
├── README.md                      # Project README
├── docker-compose.yml             # Development compose
├── docker-compose.prod.yml        # Production compose
└── <70+ documentation .md files>  # Architecture, audit, certification docs
```

## `apps/api/` — Backend Deep Dive

```
apps/api/
├── src/
│   ├── main.ts                    # Bootstrap: Fastify, Sentry, Helmet, CSRF, Swagger, Prometheus
│   ├── app.module.ts              # Root module (imports 74 feature modules)
│   ├── app.controller.ts          # Root controller (GET /api/v1)
│   ├── app.service.ts             # Root service
│   ├── config/
│   │   └── app.config.ts          # 9 config namespaces with Joi validation
│   ├── common/                    # Shared framework infrastructure
│   │   ├── decorators/            # @CurrentUser, @Roles, @Public, @Permissions
│   │   ├── dto/                   # PaginationDto, PaginatedResult, buildPaginationQuery
│   │   ├── enums/                 # Role enum
│   │   ├── filters/               # AllExceptionsFilter
│   │   ├── guards/                # JwtAuthGuard, RolesGuard, PermissionsGuard, CompanyOwnerGuard
│   │   ├── interceptors/          # TransformInterceptor, SentryInterceptor, LoggingInterceptor
│   │   ├── pipes/                 # ValidationPipe
│   │   ├── services/              # RedisModule + RedisService
│   │   ├── utils/                 # template.utils, ws-cors
│   │   └── validators/            # Custom class-validator decorators
│   ├── health/
│   │   ├── health.controller.ts   # GET /live, /ready, /health
│   │   └── health.module.ts
│   ├── prisma/
│   │   ├── prisma.module.ts       # @Global() Prisma provider
│   │   └── prisma.service.ts      # PrismaClient wrapper
│   ├── jobs/                      # BullMQ job processors
│   │   ├── jobs.module.ts         # Job registration
│   │   ├── job-scheduler.service.ts  # Cron scheduling
│   │   ├── queues.ts              # Queue definitions + typed job data
│   │   └── <10 processors>        # Email, export, AI, bestseller, cert, etc.
│   ├── catalog-import/            # CSV/Excel import pipeline
│   │   ├── catalog-import.module/controller/service
│   │   ├── dto/
│   │   └── services/              # CSV parser, import orchestrator
│   ├── product-onboarding/        # Product draft/wizard management
│   │   ├── product-onboarding.module/controller/service
│   │   └── dto/
│   └── modules/                   # 74 feature modules
│       ├── auth/                  # Authentication + authorization
│       ├── users/                 # User management
│       ├── companies/             # Company management
│       ├── products/              # Product catalog
│       ├── smart-rfq/             # RFQ engine
│       ├── quote/                 # Quote management
│       ├── smart-negotiation/     # Negotiation engine
│       ├── smart-po/              # Purchase order
│       ├── order/                 # Order management
│       ├── payment/               # Payment processing (Razorpay, Stripe)
│       ├── ...                    # 74 modules total
```

## `apps/web/` — Frontend Deep Dive

```
apps/web/
├── app/                           # Next.js App Router (253+ routes)
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Home page
│   ├── globals.css                # Global styles + Tailwind
│   ├── (auth)/                    # Auth route group
│   ├── admin/                     # 63 admin pages
│   ├── buyer/                     # 38 buyer pages
│   ├── seller/                    # 61 seller pages
│   ├── tradeserv/                 # 21 TradeServ pages
│   ├── tradhexa/                  # 7 TradHexa pages
│   ├── search/                    # TradFind search
│   └── <public pages>             # About, contact, plans, etc.
├── components/                    # 29 component directories
│   ├── ui/                        # 17 atomic primitives
│   ├── shared/                    # 32 reusable components
│   ├── ecosystem/                 # 21 gamification components
│   ├── founder-ai/                # 12 executive AI components
│   ├── product/                   # 15 product components
│   ├── near-me/                   # 15 location/map components
│   ├── provider/                  # 6 context providers
│   ├── ai/                        # 4 AI copilot components
│   └── <domain components>        # Per-domain components
├── hooks/                         # 49 custom React Query hooks
├── lib/                           # API client and utilities
│   ├── api/                       # 55 API client files
│   ├── auth/                      # Auth utilities
│   ├── store/                     # 5 Zustand stores
│   └── utils/                     # Cloudinary upload, India lookup
├── config/                        # Specification templates
├── data/                          # Master data (categories, navs, catalog)
├── types/                         # Additional type definitions
└── public/                        # Static assets, PWA manifest
```

## `packages/` — Shared Packages Deep Dive

### `@tradingo/contracts`
```
packages/contracts/src/
├── index.ts                       # Barrel exports
├── common/
│   ├── api-response.ts            # ApiResponse, ErrorResponse, success/created/paginated helpers
│   ├── enums.ts                   # 20+ shared enums (Role, AdStatus, OrderStatus, etc.)
│   ├── pagination.ts              # PaginationMeta, PaginatedResponse, PaginationParams
│   └── index.ts
├── advertising/
│   └── index.ts                   # AdvertisingContract, CreateAdvertisingRequest
├── campaign/
│   └── index.ts                   # CampaignContract, CreateCampaignRequest
├── crm/
│   └── index.ts                   # LeadContract, CreateLeadRequest
└── finance/
    └── index.ts                   # CreditContract, CreditNoteContract, DebitNoteContract
```

### `@tradingo/types`
```
packages/types/src/
├── index.ts                       # Re-exports auth.types + api.types
├── auth.types.ts                  # Login/Register/ForgotPassword/ResetPassword types
└── api.types.ts                   # ApiResponse, PaginatedResponse generic types
```

### `@tradingo/utils`
```
packages/utils/src/
└── index.ts                       # cn(), formatDate(), sleep(), truncate(), generateId()
```

### `@tradingo/ui`
```
packages/ui/src/
└── index.ts                       # export {}; (placeholder - reserved for shared UI)
```

### `@tradingo/gocash`
```
packages/gocash/
├── package.json                   # Depends on @prisma/client
└── index.ts                       # (placeholder - intended for shared GOCASH types)
```
