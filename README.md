# Trading

Monorepo for the Trading platform — a full-stack application built with Next.js 16, NestJS, PostgreSQL, Redis, OpenSearch, and ClickHouse.

## Architecture Overview

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Next.js 16 │───>│   NestJS API │───>│  PostgreSQL  │
│   (App Router)│   │   (Fastify)  │    │  (Prisma ORM)│
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
              ┌────────────┼────────────────┐
              ▼            ▼                ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │   Redis   │ │OpenSearch│ │  ClickHouse  │
        │ (Cache +  │ │ (Search) │ │ (Analytics)  │
        │  BullMQ)  │ └──────────┘ └──────────────┘
        └──────────┘
              │
        ┌─────┴──────┐
        ▼            ▼
   ┌─────────┐ ┌──────────┐
   │ Prometheus│ │  Grafana  │
   │ Metrics  │ │ Dashboards│
   └──────────┘ └──────────┘
```

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker Desktop** (for local services: PostgreSQL, Redis, OpenSearch, ClickHouse)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> tradingo
cd tradingo
pnpm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Start infrastructure services
pnpm docker:up

# 4. Run database migrations
pnpm db:migrate

# 5. Seed database with test users
pnpm db:seed

# 6. Start development servers
pnpm dev
```

The API starts at **http://localhost:3001**, the frontend at **http://localhost:3000**.

## Environment Setup

Copy `.env.example` to `.env.local` and configure the variables. Key settings:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token signing key (min 32 chars) |
| `SEED_ADMIN_EMAIL` | Super admin email for seed script |
| `SEED_ADMIN_PASSWORD` | Super admin password for seed script |

## Running Locally

```bash
# Start all infrastructure (PostgreSQL, Redis, OpenSearch, ClickHouse)
pnpm docker:up

# Run Prisma migrations
pnpm db:migrate

# Seed test users (SUPER_ADMIN + ADMIN + 10 VIEWERs)
pnpm db:seed

# Start API + Web in dev mode (concurrent via Turborepo)
pnpm dev

# Start only the API
pnpm --filter @tradingo/api dev

# Start only the frontend
pnpm --filter @tradingo/web dev

# Stop infrastructure
pnpm docker:down
```

### Seed Users

After running `pnpm db:seed`, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@tradingo.io | Admin@1234 | SUPER_ADMIN |
| test@example.com | Test@1234 | ADMIN |
| user1@example.com - user10@example.com | Viewer@1234 | VIEWER |

## Running Tests

```bash
# Run all tests
pnpm test

# Run API unit tests
pnpm --filter @tradingo/api test

# Run API E2E tests
pnpm --filter @tradingo/api test:e2e
```

## API Documentation

Swagger UI is available at **http://localhost:3001/api/docs** (dev only).

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/register | Public | Register new user |
| POST | /api/v1/auth/login | Public | Login |
| POST | /api/v1/auth/refresh | Public | Refresh tokens |
| POST | /api/v1/auth/logout | JWT | Logout |
| GET | /api/v1/users | JWT + RBAC | List users (Admin+) |
| GET | /api/v1/users/me | JWT | Current user profile |
| GET | /api/v1/users/:id | JWT | Get user by ID |
| PATCH | /api/v1/users/:id | JWT | Update user |
| PATCH | /api/v1/users/:id/role | JWT + Perm | Update user role |
| DELETE | /api/v1/users/:id | JWT + RBAC | Soft delete user |
| GET | /api/v1/health | Public | Health check |

## Monitoring

| Service | Port | Description |
|---------|------|-------------|
| Prometheus | 9090 | Metrics collection |
| Grafana | 3000 | Dashboards (admin/admin) |
| API Metrics | 9100 | Prometheus metrics endpoint |

```bash
# Start monitoring stack
docker compose -f infrastructure/docker-compose.monitoring.yml up -d
```

## Deployment

The project deploys to **AWS ECS Fargate** via GitHub Actions.

### Workflows

- **CI** (`.github/workflows/ci.yml`): Runs on every PR — lint, typecheck, test, build
- **Deploy Staging** (`.github/workflows/deploy-staging.yml`): Auto-deploys on push to `develop`
- **Deploy Production** (`.github/workflows/deploy-production.yml`): Manual dispatch on `main`

### Required Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_ACCOUNT_ID` | AWS account ID |
| `SUBNETS` | VPC subnet IDs (comma-separated) |
| `SECURITY_GROUPS` | Security group IDs (comma-separated) |
| `SLACK_WEBHOOK_URL` | Slack notification webhook |

## Project Structure

```
root/
├── apps/
│   ├── web/              # Next.js 16 frontend (App Router)
│   └── api/              # NestJS backend (Fastify)
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── utils/            # Shared utility functions
│   └── ui/               # Shared React components
├── infrastructure/
│   ├── docker/           # Dockerfiles
│   ├── docker-compose.yml
│   └── ecs/              # ECS task definitions
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── monitoring/
│   ├── prometheus/
│   └── grafana/
└── .github/
    └── workflows/        # CI/CD pipelines
```

## Contributing

1. Branch from `develop`: `git checkout -b feature/my-feature develop`
2. Follow existing code conventions
3. Ensure all tests pass: `pnpm test`
4. Run type-check: `pnpm typecheck`
5. Run lint: `pnpm lint`
6. Create a pull request against `develop`
