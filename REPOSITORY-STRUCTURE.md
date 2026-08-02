# TRADINGO Repository Structure

## Overview

```
E:\tradingo/
├── .github/                    # GitHub Actions workflows (5 CI/CD files)
├── .vscode/                    # VS Code settings
├── apps/                       # Application source code
│   ├── api/                    # NestJS 11 + Fastify 5 backend (99 modules, 159 controllers)
│   │   ├── src/
│   │   │   ├── app.module.ts   # Root module
│   │   │   ├── main.ts         # Entry point
│   │   │   ├── common/         # Shared guards, decorators, interceptors, filters
│   │   │   ├── config/         # Configuration modules
│   │   │   ├── health/         # Health check endpoints
│   │   │   ├── modules/        # 99 business modules
│   │   │   ├── prisma/         # Prisma service
│   │   │   └── catalog-import/ # Catalog import pipeline
│   │   ├── Dockerfile          # Multi-stage production build
│   │   ├── test/               # E2E test specs (6 files)
│   │   └── tsconfig.json
│   └── web/                    # Next.js 16 + React 19 frontend (280 pages, 272 routes)
│       ├── app/                # Next.js App Router pages
│       ├── components/         # 200+ reusable components
│       ├── hooks/              # 60+ React Query hooks
│       ├── lib/                # API clients, utilities, auth
│       ├── store/              # Zustand stores
│       ├── types/              # TypeScript type definitions
│       ├── public/             # Static assets
│       ├── Dockerfile          # Multi-stage production build
│       └── tailwind.config.ts
├── assets/                     # Static assets (empty, ready for use)
├── docs/                       # Organized documentation
│   ├── architecture/           # Foundation docs, AI docs, module docs (144 files)
│   ├── deployment/             # Deployment, Docker, K8s, CI/CD guides (16 files)
│   ├── security/               # Security standards and audits (11 files)
│   ├── operations/             # Runbooks, operations guides (17 files)
│   ├── reports/                # Audit, QA, completion reports (37 files)
│   ├── releases/               # GA release, RC reports, certification (8 files)
│   └── archive/                # Old phase/uat docs (18 files)
├── examples/                   # Example files (empty, ready for use)
├── ops/                        # Operations, infrastructure configs
│   ├── backup/                 # Database backup scripts (8 files)
│   ├── k8s/                    # Kubernetes manifests (14 files)
│   ├── load-testing/           # k6 load test scripts (4 files)
│   ├── monitoring/             # Prometheus + Grafana configs
│   └── recovery/               # Disaster recovery scripts (3 files)
├── packages/                   # Shared packages (monorepo)
│   ├── contracts/              # API contract types
│   ├── gocash/                 # GOCASH engine
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # UI component library
│   └── utils/                  # Shared utilities
├── prisma/                     # Database schema and seeds
│   ├── schema.prisma           # 260 models, 173 enums
│   ├── migrations/             # 6 migration files
│   ├── seed.ts
│   └── seeds/                  # Seed data files
├── scripts/                    # Shell scripts
│   ├── backup/                 # PostgreSQL backup/restore
│   └── deploy/                 # Smoke test script
├── tests/                      # Playwright E2E tests
│   ├── e2e/                    # 7 E2E test specs
│   ├── fixtures/               # Test fixtures
│   └── helpers/                # Test helpers
├── tools/                      # Tool scripts (empty, ready for use)
├── AGENTS.md                   # Session context (auto-managed)
├── README.md                   # Project overview
├── docker-compose.yml          # Development stack (7 services)
├── docker-compose.prod.yml     # Production stack (8 services)
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turborepo config
├── tsconfig.base.json          # Base TypeScript config
├── playwright.config.ts        # Playwright E2E config
├── .env.example                # Environment template (34 vars)
├── .gitignore                  # Git ignore rules
├── .eslintrc.js                # ESLint config
├── .prettierrc                 # Prettier config
├── .npmrc                      # npm/pnpm config
└── .dockerignore               # Docker ignore rules
```

## Documentation Map

| Directory | Purpose | File Count |
|-----------|---------|-----------|
| `docs/architecture/` | Foundation standards (00-40), AI docs, module docs, API guides | 144 |
| `docs/deployment/` | Docker, K8s, CI/CD, launch checklists, rollback procedures | 16 |
| `docs/security/` | Security standards, auth docs, hardening reports, certification | 11 |
| `docs/operations/` | Production runbooks, support handbook, post-launch checklists, backup strategy | 17 |
| `docs/reports/` | Audit reports, QA reports, completion reports, UAT reports | 37 |
| `docs/releases/` | GA release notes, RC reports, certification certificates, release manifest | 8 |
| `docs/archive/` | Old phase completion reports, UAT flow docs, legacy audits | 18 |

## Scripts Map

| Path | Purpose |
|------|---------|
| `scripts/backup/backup-postgres.sh` | PostgreSQL database backup |
| `scripts/backup/restore-postgres.sh` | PostgreSQL database restore |
| `scripts/deploy/smoke-test.sh` | Deployment smoke test |

## Deployment Assets

| Asset | Location |
|-------|----------|
| API Dockerfile | `apps/api/Dockerfile` |
| Web Dockerfile | `apps/web/Dockerfile` |
| Dev Compose | `docker-compose.yml` |
| Prod Compose | `docker-compose.prod.yml` |
| K8s Manifests | `ops/k8s/` (14 files) |
| K8s Kustomization | `ops/k8s/kustomization.yaml` |
| Prometheus Config | `ops/monitoring/prometheus/` |
| Grafana Dashboards | `ops/monitoring/grafana/dashboards/` |
| GitHub Workflows | `.github/workflows/` (5 files) |
| Backup Scripts | `ops/backup/` (8 files) |
| Recovery Scripts | `ops/recovery/` (3 files) |
| Load Test Scripts | `ops/load-testing/` (4 files) |

## Architecture Files

| File | Description |
|------|-------------|
| `docs/architecture/00_FOUNDER_MASTER_ROADMAP.md` | Founder-approved master roadmap |
| `docs/architecture/03_ARCHITECTURE.md` | System architecture overview |
| `docs/architecture/04_CORE_INFRASTRUCTURE_BLUEPRINT.md` | Infrastructure blueprint |
| `docs/architecture/08_PRISMA_SCHEMA.md` | Database schema reference |
| `docs/architecture/09_API_INVENTORY.md` | Complete API endpoint inventory |
| `docs/architecture/13_AI_ARCHITECTURE.md` | AI platform architecture |
| `docs/architecture/20_TRADESERV_ARCHITECTURE.md` | TradeServ architecture |
| `docs/architecture/24_AI_HANDOFF_MEMORY.md` | AI handoff context |
| `docs/architecture/KNOWLEDGE.md` | Platform knowledge base |
| `docs/releases/TRADINGO-v1.0.0-GA-RELEASE.md` | GA release notes |
| `docs/releases/TRADINGO-RELEASE-MANIFEST.md` | Release manifest with versions |

## Platform Counts

| Domain | Count |
|--------|-------|
| Prisma Models | 260 |
| Prisma Enums | 173 |
| Prisma Indexes | 414+ |
| API Controllers | 159 |
| API Endpoints | 1,356 |
| API Modules | 99 |
| DTOs | 185+ |
| Frontend Pages | 280 |
| Frontend Routes | 272 |
| AI Providers | 5 |
| AI Task Types | 31 |
| AI Agents | 7 (5 registered + 2 unregistered) |
| Docker Services (dev) | 7 |
| Docker Services (prod) | 8 |
| K8s Manifests | 14 |
