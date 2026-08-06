# D1 — Infrastructure Inventory & Cross-Resource Consistency Report

## Generated: 2026-07-28

## 1. New IaC Artifacts — Terraform (12 files)

| File | Lines | Purpose |
|------|-------|---------|
| `main.tf` | 5 | AWS provider config, caller identity data source |
| `versions.tf` | 14 | Terraform >=1.5, AWS provider ~>5.0 |
| `variables.tf` | 74 | 20 input variables with defaults and descriptions |
| `terraform.tfvars.example` | 30 | Example variables for ap-south-1 production |
| `vpc.tf` | 85 | VPC (10.0.0.0/16), 3 subnet tiers, IGW, NAT, route tables |
| `security-groups.tf` | 101 | 5 SGs: ALB, ECS API, ECS Web, RDS, Redis |
| `iam.tf` | 117 | 2 roles (execution + task), 4 policies (ECR, logs, secrets, S3) |
| `ecr.tf` | 88 | 2 repos (api + web), lifecycle policies per repo |
| `alb.tf` | 105 | ALB, 2 target groups, HTTP→HTTPS redirect, HTTPS listener + rules |
| `ecs.tf` | 211 | Cluster, 3 task defs (api/web/migration), 2 services (api/web) |
| `cloudwatch.tf` | 32 | 4 log groups (api, web, migration, nginx) |
| `outputs.tf` | 89 | 21 outputs (VPC ID, subnet IDs, ALB DNS, ECR URLs, SG IDs, etc.) |

## 2. Updated Existing Assets (6 files)

| File | Lines | Change |
|------|-------|--------|
| `infrastructure/ecs/task-definition.api.json` | 84→68 | Region us-east-1→ap-south-1, SSM /tradingo/→/tradingo/production/, role names updated, log group renamed, container name normalized, health check path fixed |
| `infrastructure/ecs/task-definition.web.json` | 48→48 | Same pattern: region, SSM path, role names, log group, container name |
| `infrastructure/ecs/task-definition.migration.json` | 32→32 | Same pattern: family name, region, SSM path, role names, log group |
| `.github/workflows/deploy.yml` | 201 | Region, ECR repos, ECS services, task defs, container names, migration refs, health check path |
| `.github/workflows/deploy-production.yml` | 195 | Same pattern as deploy.yml |
| `.github/workflows/deploy-staging.yml` | 129 | Container names only (staging uses separate infrastructure) |

## 3. Cross-Resource Consistency Matrix

### Region
| Asset | Value |
|-------|-------|
| Terraform default region | `ap-south-1` |
| Task definition JSONs | `ap-south-1` |
| CI/CD deploy.yml | `ap-south-1` |
| CI/CD deploy-production.yml | `ap-south-1` |

### ECR Repository Names
| Service | Terraform | Task Def JSON | CI/CD |
|---------|-----------|---------------|-------|
| API | `tradingo-production-api` | `tradingo-production-api` | `tradingo-production-api` |
| Web | `tradingo-production-web` | `tradingo-production-web` | `tradingo-production-web` |

### ECS Service Names
| Service | Terraform | CI/CD |
|---------|-----------|-------|
| API | `tradingo-production-api` | `tradingo-production-api` |
| Web | `tradingo-production-web` | `tradingo-production-web` |

### Task Definition Family Names
| Service | Terraform | Task Def JSON | CI/CD |
|---------|-----------|---------------|-------|
| API | `tradingo-production-api` | `tradingo-production-api` | `tradingo-production-api` |
| Web | `tradingo-production-web` | `tradingo-production-web` | `tradingo-production-web` |
| Migration | `tradingo-production-migration` | `tradingo-production-migration` | `tradingo-production-migration` |

### Container Names
| Service | Terraform | Task Def JSON | CI/CD |
|---------|-----------|---------------|-------|
| API | `api` | `api` | `api` |
| Web | `web` | `web` | `web` |
| Migration | `migration` | `migration` | N/A |

### IAM Roles
| Role | Terraform | Task Def JSON |
|------|-----------|---------------|
| Execution | `tradingo-production-ecs-execution-role` | `tradingo-production-ecs-execution-role` |
| Task | `tradingo-production-ecs-task-role` | `tradingo-production-ecs-task-role` |

### CloudWatch Log Groups
| Group | Terraform | Task Def JSON |
|-------|-----------|---------------|
| API | `/ecs/tradingo-production-api` | `/ecs/tradingo-production-api` |
| Web | `/ecs/tradingo-production-web` | `/ecs/tradingo-production-web` |
| Migration | `/ecs/tradingo-production-migration` | `/ecs/tradingo-production-migration` |

### SSM Parameter Paths
| All secrets | `/tradingo/production/VARIABLE_NAME` across TF + JSONs |

### Port Mappings
| Service | Container Port | Metrics Port | Terraform | Task Def JSON |
|---------|---------------|--------------|-----------|---------------|
| API | 3001 | 9100 | ✅ 3001+9100 | ✅ 3001+9100 |
| Web | 3000 | — | ✅ 3000 | ✅ 3000 |
| Migration | — | — | ✅ (no ports) | ✅ (no ports) |

### Health Checks
| Service | Path | Port | Match |
|---------|------|------|-------|
| API | `/live` | 3001 | Terraform: ✅ /live:3001; JSON: ✅ /live:3001; CI/CD: ✅ /live |
| Web | `/` | 3000 | Terraform: ✅ /:3000; JSON: ✅ /:3000; CI/CD: ✅ / |

## 4. Preserved Existing Assets (not modified)

| Asset | Path | Purpose |
|-------|------|---------|
| nginx config | `infrastructure/nginx/nginx.conf` | Reverse proxy config |
| nginx site config | `infrastructure/nginx/sites/tradingo.conf` | Site-specific proxy rules |
| SSL placeholder | `infrastructure/nginx/ssl/README.md` | SSL cert instructions |
| Docker Compose prod | `docker-compose.prod.yml` | Local production simulation |
| DR failover | `ops/recovery/dr-failover.sh` | Region failover automation |
| DR failback | `ops/recovery/dr-failback.sh` | Region failback automation |
| Rollback script | `ops/recovery/rollback.sh` | Universal rollback |
| Backup scripts | `ops/backup/backup-postgres.sh` | PostgreSQL backup to S3 |
| VPS deploy script | `scripts/deploy/deploy-vps.sh` | VPS deployment automation |
| Smoke test | `scripts/deploy/smoke-test.sh` | Post-deployment verification |
| `.env.production` | `tradingo.env` | Production environment variables |
| `ci.yml` | `.github/workflows/ci.yml` | CI workflow (no infra references) |

## 5. Gap Analysis

### Gaps Filled by This Phase
| Gap | Resolution |
|-----|------------|
| No IaC tooling | Terraform v1.5+ definition files created |
| No VPC definition | VPC (10.0.0.0/16) with 3 subnet tiers |
| No security group definitions | 5 purpose-built security groups |
| No IAM role definitions | Execution + task roles with least-privilege policies |
| No ECR lifecycle policy | Auto-expire old images (keep 10 prod, purge untagged at 7d) |
| No ALB definition | Internet-facing ALB with HTTP→HTTPS redirect |
| No CloudWatch log groups | 4 log groups with 30-day retention |
| No ECS service definitions | Fargate services with circuit breaker + rollback |
| Stale `us-east-1` region | Migrated all production infra references to `ap-south-1` |
| Stale IAM role names | Updated from generic `ecsTaskExecutionRole` to project-scoped names |
| Stale log group names | Updated from `/ecs/tradingo-api` to `/ecs/tradingo-production-api` |
| Stale SSM paths | Updated from `/tradingo/VAR` to `/tradingo/production/VAR` |
| Stale container names | Normalized from `tradingo-api`→`api`, `tradingo-web`→`web` |
| Stale health check path | API health check from `/api/v1/health`→`/live` (100ms vs 2s+) |

### Remaining Gaps (for D2-D5)
| Gap | Severity | Target |
|-----|----------|--------|
| No ACM certificate provisioned | 🔴 Blocking | D2 |
| No SSM parameters populated | 🔴 Blocking | D2 |
| GitHub secrets not configured | 🔴 Blocking | D2 |
| `.env.production` 65% placeholder | 🟡 High | D2 |
| No Route53 DNS records | 🟡 High | D2 |
| No SSL certificates exist | 🔴 Blocking | D2 |
| SMTP credentials placeholder | 🟡 High | D2 |
| OAuth credentials placeholder | 🟡 High | D2 |
| No Terraform backend (S3/DynamoDB) | 🟡 Medium | D3 |
| No VPC Flow Logs enabled | 🟢 Low | D3 |
| No monitoring alarms defined | 🟡 Medium | D3 |
| Staging CI/CD workflow broken | 🟡 Medium | D4 |
| No disaster recovery testing | 🟡 Medium | D5 |
| No load balancer access logs | 🟢 Low | D3 |

## 6. Verification Results

| Check | Status |
|-------|--------|
| Terraform file creation | ✅ 12 files created |
| Task definition JSON update | ✅ 3 files updated |
| CI/CD workflow update | ✅ 3 files updated |
| JSON syntax validation | ✅ All 3 valid |
| tsc (api) — application code | ✅ 0 errors (only pre-existing spec errors) |
| tsc (web) — application code | ✅ 0 errors |
| Cross-resource naming consistency | ✅ All references verified |
| Port mapping consistency | ✅ API 3001+9100, Web 3000 |
| Health check path consistency | ✅ API /live:3001, Web /:3000 |
| Log group name consistency | ✅ All TF/JSON pairs match |
| IAM role name consistency | ✅ All TF/JSON pairs match |
| SSM path consistency | ✅ All TF/JSON pairs use /tradingo/production/ |
| ECR repo name consistency | ✅ All TF/JSON/CI/CD pairs match |
| ECS service name consistency | ✅ All TF/CI/CD pairs match |
