#!/bin/bash
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="${ECR_REPO:-tradingo}"
CLUSTER_NAME="${CLUSTER_NAME:-tradingo-cluster}"
SERVICE_WEB="${SERVICE_WEB:-tradingo-web}"
SERVICE_API="${SERVICE_API:-tradingo-api}"
TASK_WEB="${TASK_WEB:-tradingo-web}"
TASK_API="${TASK_API:-tradingo-api}"
CLOUDFRONT_ID="${CLOUDFRONT_ID:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
GIT_SHA="${GIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TAG="${GIT_SHA}-${TIMESTAMP}"

echo "=== TRADINGO Production Deployment ==="
echo "Region: $AWS_REGION | Tag: $TAG"

# ─── Validation ──────────────────────────────────────────────────
command -v aws >/dev/null 2>&1 || { echo "AWS CLI required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }

# ─── Build & Push ────────────────────────────────────────────────
echo "--- Building images ---"
docker build -f apps/web/Dockerfile -t "${ECR_REPO}/tradingo-web:${TAG}" -t "${ECR_REPO}/tradingo-web:latest" .
docker build -f apps/api/Dockerfile -t "${ECR_REPO}/tradingo-api:${TAG}" -t "${ECR_REPO}/tradingo-api:latest" .

echo "--- Pushing to ECR ---"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${ECR_REPO}"
docker push "${ECR_REPO}/tradingo-web:${TAG}"
docker push "${ECR_REPO}/tradingo-web:latest"
docker push "${ECR_REPO}/tradingo-api:${TAG}"
docker push "${ECR_REPO}/tradingo-api:latest"

# ─── Migrations ──────────────────────────────────────────────────
echo "--- Running migrations ---"
aws ecs run-task \
  --cluster "$CLUSTER_NAME" \
  --task-definition tradingo-migration \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[...],securityGroups=[...],assignPublicIp=ENABLED}" \
  --overrides '{ "containerOverrides": [{ "name": "migration", "command": ["npx", "prisma", "migrate", "deploy"] }] }' \
  --region "$AWS_REGION" > /dev/null

echo "Waiting for migration to complete..."
sleep 30

# ─── Deploy ──────────────────────────────────────────────────────
deploy_service() {
  local service=$1 task=$2 tag=$3
  echo "--- Deploying $service ---"
  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "$service" \
    --task-definition "$task" \
    --force-new-deployment \
    --region "$AWS_REGION" > /dev/null

  echo "Waiting for $service to stabilize..."
  aws ecs wait services-stable \
    --cluster "$CLUSTER_NAME" \
    --services "$service" \
    --region "$AWS_REGION"
}

deploy_service "$SERVICE_WEB" "$TASK_WEB" "$TAG"
deploy_service "$SERVICE_API" "$TASK_API" "$TAG"

# ─── CloudFront Invalidation ─────────────────────────────────────
if [ -n "$CLOUDFRONT_ID" ]; then
  echo "--- Invalidating CloudFront ---"
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_ID" \
    --paths "/products/*" "/categories/*" "/search*" "/api/*" \
    --region "$AWS_REGION" > /dev/null
fi

# ─── Smoke Tests ─────────────────────────────────────────────────
echo "--- Running smoke tests ---"
WEB_URL="${WEB_URL:-https://tradingo.com}"
API_URL="${API_URL:-https://api.tradingo.com}"

for url in "$WEB_URL" "$API_URL/api/health" "$API_URL/api/v1/products?limit=1"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
  if [ "$status" = "200" ] || [ "$status" = "201" ]; then
    echo "  OK: $url ($status)"
  else
    echo "  FAIL: $url ($status)"
    exit 1
  fi
done

echo "=== Deployment successful! ==="

# ─── Slack Notification ──────────────────────────────────────────
if [ -n "$SLACK_WEBHOOK" ]; then
  curl -s -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"✅ TRADINGO deployment *${TAG}* completed successfully\"}" > /dev/null
fi
