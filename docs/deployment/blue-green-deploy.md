# TRADINGO Blue/Green Deployment Strategy

## Overview

TRADINGO uses a blue/green deployment model with Amazon ECS Fargate and Application Load
Balancer target groups. This ensures zero-downtime deployments with instant rollback capability.

## Architecture

```
                           ┌─────────────┐
                           │  Route53     │
                           │  tradingo.io  │
                           └──────┬───────┘
                                  │
                           ┌──────┴───────┐
                           │  CloudFront   │
                           └──────┬───────┘
                                  │
                           ┌──────┴───────┐
                           │  ALB          │
                           └──────┬───────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
           ┌────────┴────────┐       ┌──────────┴──────────┐
           │ Target Group A  │       │  Target Group B     │
           │ (Blue - Active) │       │ (Green - Staging)   │
           └────────┬────────┘       └──────────┬──────────┘
                    │                           │
           ┌────────┴────────┐       ┌──────────┴──────────┐
           │ ECS Service A  │       │  ECS Service B      │
           │ (Current)      │       │  (New Deployment)   │
           └────────┬────────┘       └──────────┬──────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                          ┌───────┴────────┐
                          │   RDS Primary  │
                          │   + Read       │
                          │   Replicas     │
                          └────────────────┘
```

## Services

| Component | Blue Target Group | Green Target Group | ECS Service (Blue) | ECS Service (Green) |
|-----------|-------------------|--------------------|--------------------|--------------------|
| API | tradingo-api-blue-tg | tradingo-api-green-tg | tradingo-api-blue | tradingo-api-green |
| Web | tradingo-web-blue-tg | tradingo-web-green-tg | tradingo-web-blue | tradingo-web-green |

## Deployment Flow

### Phase 1: Pre-Deployment
```bash
# 1. Tag current revision as "blue"
aws ecs update-service \
  --cluster tradingo-production \
  --service tradingo-api-blue \
  --service-connect-configuration '...'

# 2. Ensure green services are scaled to 0
aws ecs update-service \
  --cluster tradingo-production \
  --service tradingo-api-green \
  --desired-count 0

aws ecs update-service \
  --cluster tradingo-production \
  --service tradingo-web-green \
  --desired-count 0
```

### Phase 2: Migrate Database (Backward-Compatible)
```bash
# Database migrations must be backward-compatible
# 1. Only ADD columns/tables (never remove)
# 2. Default values for new columns
# 3. Old code must work with new schema

npx knex migrate:latest --env production

# Verify migration status
npx knex migrate:status --env production
```

### Phase 3: Deploy to Green
```bash
# 1. Register new task definitions with updated images
TASK_API=$(aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition-api.json)

TASK_WEB=$(aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json)

# 2. Scale up green services
aws ecs update-service \
  --cluster tradingo-production \
  --service tradingo-api-green \
  --task-definition "$TASK_API" \
  --desired-count 2 \
  --force-new-deployment

aws ecs update-service \
  --cluster tradingo-production \
  --service tradingo-web-green \
  --task-definition "$TASK_WEB" \
  --desired-count 2 \
  --force-new-deployment

# 3. Wait for services to stabilize
aws ecs wait services-stable \
  --cluster tradingo-production \
  --services tradingo-api-green tradingo-web-green

# 4. Health check green targets
for i in {1..30}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    http://<green-alb-internal>/api/health)
  if [ "$STATUS" = "200" ]; then
    echo "Green target health check passed"
    break
  fi
  sleep 10
done
```

### Phase 4: Run Smoke Tests
```bash
# Run comprehensive smoke tests against green target group
# These tests must pass before routing traffic

test_endpoints=(
  "/api/health"
  "/api/ready"
  "/api/v1/status"
  "/api/v1/market/pairs"
  "/api/v1/orders"
  "/api/v1/auth/me"
)

for endpoint in "${test_endpoints[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://<green-alb-internal>$endpoint")
  if [ "$response" != "200" ] && [ "$response" != "204" ]; then
    echo "FAILED: $endpoint returned HTTP $response"
    exit 1
  fi
  echo "PASSED: $endpoint -> $response"
done
```

### Phase 5: Swap Traffic

#### Option A: ALB Listener Rule Swap (Recommended)
```bash
# Swap target group weights: 100% blue -> 100% green
# Update ALB listener rules to route to green target groups

# API listener
aws elbv2 modify-listener \
  --listener-arn "arn:aws:elasticloadbalancing:...:listener/app/tradingo/..." \
  --default-actions \
    '[{"Type":"forward",
       "ForwardConfig":{"TargetGroups":[
         {"TargetGroupArn":"arn:aws:elasticloadbalancing:...:targetgroup/tradingo-api-green","Weight":100},
         {"TargetGroupArn":"arn:aws:elasticloadbalancing:...:targetgroup/tradingo-api-blue","Weight":0}
       ]}}]'

# Web listener
aws elbv2 modify-listener \
  --listener-arn "arn:aws:elasticloadbalancing:...:listener/app/tradingo-web/..." \
  --default-actions \
    '[{"Type":"forward",
       "ForwardConfig":{"TargetGroups":[
         {"TargetGroupArn":"arn:aws:elasticloadbalancing:...:targetgroup/tradingo-web-green","Weight":100},
         {"TargetGroupArn":"arn:aws:elasticloadbalancing:...:targetgroup/tradingo-web-blue","Weight":0}
       ]}}]'
```

#### Option B: Gradual Traffic Migration (Canary)
```bash
# Gradually shift traffic in 10% increments
for weight in 10 25 50 75 100; do
  aws elbv2 modify-listener \
    --listener-arn "..." \
    --default-actions \
      '[{"Type":"forward",
         "ForwardConfig":{"TargetGroups":[
           {"TargetGroupArn":"arn:...green","Weight":'$weight'},
           {"TargetGroupArn":"arn:...blue","Weight":"$((100 - weight))"}
         ]}}]'

  echo "Routing $weight% traffic to green"
  sleep 120  # Monitor for 2 minutes at each step
done
```

### Phase 6: Verify Production
```bash
# 1. Check ALB target group health
aws elbv2 describe-target-health \
  --target-group-arn "arn:aws:elasticloadbalancing:...:targetgroup/tradingo-api-green"

# 2. Verify via external endpoint
curl -sI https://tradingo.io/api/health

# 3. Monitor metrics for 10 minutes
# - Error rate < 1%
# - Latency p99 < 2s
# - No 5xx spikes
```

### Phase 7: Clean Up Blue
```bash
# Mark blue as "drain" and scale to 0 after verification period
aws ecs update-service \
  --cluster tradingo-production \
  --service tradingo-api-blue \
  --desired-count 0

aws ecs update-service \
  --cluster tradingo-production \
  --service tradingo-web-blue \
  --desired-count 0

# Optionally deregister old task definitions after 7 days
```

## Rollback Procedure

### Automatic Rollback (via deployment circuit breaker)
ECS deployment circuit breaker is enabled in the service configuration:
```json
"deploymentConfiguration": {
  "maximumPercent": 200,
  "minimumHealthyPercent": 100,
  "deploymentCircuitBreaker": {
    "enable": true,
    "rollback": true
  }
}
```

ECS automatically triggers rollback if:
- New tasks fail to start
- Health checks fail
- Target group deregistration fails

### Manual Rollback
```bash
# 1. Revert traffic to blue (Active) target group
aws elbv2 modify-listener \
  --listener-arn "..." \
  --default-actions \
    '[{"Type":"forward",
       "ForwardConfig":{"TargetGroups":[
         {"TargetGroupArn":"arn:...blue","Weight":100},
         {"TargetGroupArn":"arn:...green","Weight":0}
       ]}}]'

# 2. Scale down green
aws ecs update-service \
  --cluster tradingo-production \
  --service tradingo-api-green \
  --desired-count 0

# 3. Revert database migrations if needed
# IMPORTANT: Only revert if the migration can be safely rolled back
npx knex migrate:down --env production
```

## Database Migration Compatibility

### Rules for Zero-Downtime Migrations

| Change Type | Safe? | Notes |
|-------------|-------|-------|
| ADD column (nullable) | ✅ Safe | Old code ignores new column |
| ADD column (default) | ✅ Safe | Default applies automatically |
| ADD table | ✅ Safe | Old code doesn't reference it |
| ADD index | ✅ Safe | Concurrently if possible |
| RENAME column | ❌ Unsafe | Use ADD + DROP instead |
| DROP column | ❌ Unsafe | Remove in NEXT deployment |
| DROP table | ❌ Unsafe | Remove in NEXT deployment |
| CHANGE column type | ❌ Unsafe | Add new column, migrate data, drop old |
| ADD NOT NULL | ❌ Unsafe | Requires backfill first |
| ADD foreign key | ⚠️ Validate | Ensure data consistency |

### Migration Process
```sql
-- Phase 1 (N): Add new columns/tables (backward-compatible)
ALTER TABLE orders ADD COLUMN status_v2 VARCHAR(20);
CREATE TABLE order_history (...);

-- Phase 2 (N): Backfill data
UPDATE orders SET status_v2 = status WHERE status_v2 IS NULL;

-- Phase 3 (N+1): Drop old columns after green is active
ALTER TABLE orders DROP COLUMN status;
ALTER TABLE orders RENAME COLUMN status_v2 TO status;
```

## Zero-Downtime Requirements

### Database
- Connection pooling (pgBouncer or RDS Proxy)
- Read replicas for read-heavy workloads
- WAL archiving enabled for PITR
- No schema changes that lock tables exclusively

### Redis
- Redis Cluster or ElastiCache with replicas
- Session data must persist across deployments
- Cache invalidation on deployment (increment global cache key)

### File Storage (S3)
- Immutable asset paths (content-hash based filenames)
- S3 bucket versioning enabled
- CDN cache invalidation after deployment

### Monitoring
- Real-time dashboards (Grafana)
- Prometheus alerting for error spikes
- PagerDuty integration for critical failures
- Synthetic monitoring (CloudWatch Synthetics or DataDog)

## Deployment Window Recommendations

| Environment | Window | Notes |
|-------------|--------|-------|
| Production | Sun 08:00-12:00 UTC | Lowest trading volume |
| Staging | Any time | No SLA constraints |
| Hotfix | Any time | Emergency process requires approval |

### Blackout Periods
- Major trading events (e.g., NFP, CPI releases): No deployments 1 hour before and after
- Month-end / quarter-end: No deployments 2 hours before market close
- Scheduled maintenance windows: First Sunday of month, 06:00-10:00 UTC

## Post-Deployment Verification Checklist

- [ ] All ECS tasks are healthy and in steady state
- [ ] ALB target groups show healthy targets
- [ ] Health check endpoints return HTTP 200
- [ ] Error rate < 1% compared to pre-deployment baseline
- [ ] API latency p50 < 200ms, p95 < 1s, p99 < 3s
- [ ] Web pages load and render correctly
- [ ] Login / authentication flow works
- [ ] Trade order flow works (place, modify, cancel)
- [ ] RFQ flow works (request, quote, accept)
- [ ] Real-time data (WebSocket) connections establish
- [ ] Database connections are stable
- [ ] Redis cache hit ratio > 90%
- [ ] Background jobs / queues are processing
- [ ] Integrations (Sentry, DataDog, PagerDuty) reporting correctly
- [ ] Slack notification of successful deployment sent
