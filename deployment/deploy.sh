#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# TRADINGO Deployment Script
#
# Usage:
#   ./deploy.sh [options]
#
# Options:
#   --environment  Target environment (production|staging) [default: production]
#   --region       AWS region [default: ap-south-1]
#   --skip-tests   Skip smoke tests after deployment
#   --skip-notify  Skip Slack notification
#   --rollback     Rollback to previous deployment
#   --help         Show usage
#
# Prerequisites:
#   - AWS CLI v2 configured
#   - Docker installed
#   - jq installed
#   - node + npm (for DB migrations)
#   - git
###############################################################################

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── Defaults ──────────────────────────────────────────────────────────────
ENVIRONMENT="production"
AWS_REGION="ap-south-1"
SKIP_TESTS=false
SKIP_NOTIFY=false
ROLLBACK=false
GIT_SHA=""
ECR_REGISTRY=""
CLUSTER_NAME="tradingo-${ENVIRONMENT}"
SERVICE_WEB="tradingo-web-${ENVIRONMENT}"
SERVICE_API="tradingo-api-${ENVIRONMENT}"
TASK_DEF_WEB="tradingo-web"
TASK_DEF_API="tradingo-api"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# ── Colors ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Help ──────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --environment  Target environment (production|staging) [default: production]
  --region       AWS region [default: ap-south-1]
  --skip-tests   Skip smoke tests after deployment
  --skip-notify  Skip Slack notification
  --rollback     Rollback to previous deployment
  --help         Show this help message
EOF
  exit 0
}

# ── Parse Arguments ──────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment)   ENVIRONMENT="$2"; shift 2 ;;
    --region)        AWS_REGION="$2"; shift 2 ;;
    --skip-tests)    SKIP_TESTS=true; shift ;;
    --skip-notify)   SKIP_NOTIFY=true; shift ;;
    --rollback)      ROLLBACK=true; shift ;;
    --help)          usage ;;
    *)               err "Unknown option: $1"; usage ;;
  esac
done

# ── Validation ────────────────────────────────────────────────────────────
if [[ ! "${ENVIRONMENT}" =~ ^(production|staging)$ ]]; then
  err "Environment must be 'production' or 'staging'"
  exit 1
fi

if ! command -v aws &>/dev/null; then
  err "AWS CLI is not installed. Install it first."
  exit 1
fi

if ! command -v docker &>/dev/null; then
  err "Docker is not installed. Install it first."
  exit 1
fi

if ! command -v jq &>/dev/null; then
  err "jq is not installed. Install it first."
  exit 1
fi

# ── Functions ─────────────────────────────────────────────────────────────

notify_slack() {
  local status="$1"
  local message="$2"
  local color="${3:-#36a64f}"

  if [[ "${SKIP_NOTIFY}" == "true" || -z "${SLACK_WEBHOOK_URL}" ]]; then
    warn "Slack notification skipped"
    return
  fi

  local payload
  payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "${color}",
      "title": "TRADINGO Deployment: ${status}",
      "text": "${message}",
      "fields": [
        { "title": "Environment", "value": "${ENVIRONMENT}", "short": true },
        { "title": "Version",     "value": "${GIT_SHA:0:7}",  "short": true },
        { "title": "Region",      "value": "${AWS_REGION}",  "short": true }
      ],
      "ts": $(date +%s)
    }
  ]
}
EOF
)
  curl -s -X POST -H "Content-Type: application/json" \
    -d "${payload}" "${SLACK_WEBHOOK_URL}" || warn "Slack notification failed"
}

get_git_sha() {
  GIT_SHA="$(git -C "${PROJECT_ROOT}" rev-parse HEAD 2>/dev/null || echo "unknown")"
  info "Git SHA: ${GIT_SHA}"
}

get_ecr_registry() {
  local account_id
  account_id="$(aws sts get-caller-identity --query Account --output text)"
  ECR_REGISTRY="${account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com"
  info "ECR Registry: ${ECR_REGISTRY}"
}

ecr_login() {
  info "Logging into ECR..."
  aws ecr get-login-password --region "${AWS_REGION}" \
    | docker login --username AWS --password-stdin "${ECR_REGISTRY}"
  ok "ECR login successful"
}

build_and_push() {
  local service_name="$1"
  local dockerfile="$2"
  local repo_name="tradingo/${service_name}"
  local image_tag="${ECR_REGISTRY}/${repo_name}:${GIT_SHA}"
  local image_latest="${ECR_REGISTRY}/${repo_name}:latest"
  local image_environment="${ECR_REGISTRY}/${repo_name}:${ENVIRONMENT}"

  info "Building ${service_name} image..."
  docker build \
    -t "${image_tag}" \
    -t "${image_latest}" \
    -t "${image_environment}" \
    -f "${PROJECT_ROOT}/${dockerfile}" \
    --build-arg GIT_SHA="${GIT_SHA}" \
    --build-arg NODE_ENV=production \
    "${PROJECT_ROOT}"

  ok "Built ${service_name} image: ${image_tag}"

  info "Pushing ${service_name} image to ECR..."
  docker push "${image_tag}"
  docker push "${image_latest}"
  docker push "${image_environment}"
  ok "Pushed ${service_name} image: ${image_tag}"
}

run_database_migrations() {
  info "Running database migrations..."
  local migration_cmd="node ${PROJECT_ROOT}/node_modules/.bin/knex migrate:latest"
  if [[ "${ENVIRONMENT}" == "production" ]]; then
    migration_cmd="NODE_ENV=production ${migration_cmd}"
  fi

  # ── Run migrations from a temporary container ──
  docker run --rm \
    --network host \
    -e NODE_ENV="${ENVIRONMENT}" \
    -e DATABASE_URL="${DATABASE_URL}" \
    "${ECR_REGISTRY}/tradingo/api:${GIT_SHA}" \
    sh -c "npx knex migrate:latest --env ${ENVIRONMENT}"

  ok "Database migrations completed"
}

register_task_definition() {
  local task_def_file="$1"
  local family="$2"
  local image_repo="${ECR_REGISTRY}/tradingo/${family#tradingo-}"

  info "Registering task definition: ${family}..."

  local task_def
  task_def=$(cat "${SCRIPT_DIR}/${task_def_file}" \
    | jq --arg IMAGE "${image_repo}:${GIT_SHA}" \
         --arg ENV "${ENVIRONMENT}" \
         --arg REGION "${AWS_REGION}" \
         '.containerDefinitions[0].image = $IMAGE
          | .containerDefinitions[0].environment += [{"name":"NODE_ENV","value":$ENV}]
          | .containerDefinitions[0].environment += [{"name":"AWS_REGION","value":$REGION}]
          | .containerDefinitions[0].logConfiguration.options["aws-region"] = $REGION')

  local result
  result="$(aws ecs register-task-definition \
    --region "${AWS_REGION}" \
    --cli-input-json "${task_def}" 2>&1)"

  local task_def_arn
  task_def_arn="$(echo "${result}" | jq -r '.taskDefinition.taskDefinitionArn')"
  info "Registered: ${task_def_arn}"

  echo "${task_def_arn}"
}

wait_for_steady() {
  local service="$1"
  local cluster="$2"

  info "Waiting for ${service} to reach steady state..."
  aws ecs wait services-stable \
    --region "${AWS_REGION}" \
    --cluster "${cluster}" \
    --services "${service}"
  ok "${service} is steady"
}

wait_for_health() {
  local service_name="$1"
  local health_endpoint="$2"
  local max_retries=30
  local retry_interval=10

  info "Waiting for health check on ${service_name} (${health_endpoint})..."
  for i in $(seq 1 "${max_retries}"); do
    local status
    status="$(curl -s -o /dev/null -w "%{http_code}" "${health_endpoint}" 2>/dev/null || echo "000")"
    if [[ "${status}" == "200" ]]; then
      ok "${service_name} health check passed (HTTP 200)"
      return 0
    fi
    info "Attempt ${i}/${max_retries} — HTTP ${status}, retrying in ${retry_interval}s..."
    sleep "${retry_interval}"
  done

  err "${service_name} health check failed after ${max_retries} attempts"
  return 1
}

deploy_service() {
  local service_name="$1"
  local task_def_arn="$2"
  local cluster="$3"

  info "Deploying ${service_name}..."

  aws ecs update-service \
    --region "${AWS_REGION}" \
    --cluster "${cluster}" \
    --service "${service_name}" \
    --task-definition "${task_def_arn}" \
    --force-new-deployment \
    --deployment-configuration \
      "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}"

  info "Deployment triggered for ${service_name}"
}

rollback_service() {
  local service_name="$1"
  local cluster="$2"

  info "Rolling back ${service_name}..."

  local previous_task_def
  previous_task_def="$(aws ecs describe-services \
    --region "${AWS_REGION}" \
    --cluster "${cluster}" \
    --services "${service_name}" \
    --query 'services[0].deployments[1].taskDefinition' \
    --output text)"

  if [[ -z "${previous_task_def}" || "${previous_task_def}" == "None" ]]; then
    err "No previous task definition found for ${service_name}"
    return 1
  fi

  aws ecs update-service \
    --region "${AWS_REGION}" \
    --cluster "${cluster}" \
    --service "${service_name}" \
    --task-definition "${previous_task_def}" \
    --force-new-deployment

  ok "Rolled back ${service_name} to ${previous_task_def}"
}

run_smoke_tests() {
  local base_url="$1"

  info "Running smoke tests against ${base_url}..."

  local endpoints=(
    "/api/health"
    "/api/ready"
    "/api/v1/status"
  )

  local all_passed=true
  for endpoint in "${endpoints[@]}"; do
    local status
    status="$(curl -s -o /dev/null -w "%{http_code}" "${base_url}${endpoint}" 2>/dev/null || echo "000")"
    if [[ "${status}" == "200" || "${status}" == "204" ]]; then
      ok "  ${endpoint} → ${status}"
    else
      warn "  ${endpoint} → ${status} (expected 2xx)"
      all_passed=false
    fi
  done

  if [[ "${all_passed}" == "true" ]]; then
    ok "All smoke tests passed"
    return 0
  else
    err "Some smoke tests failed"
    return 1
  fi
}

get_alb_dns() {
  local cluster_name="${1}"
  local service_name="${2}"

  aws ecs describe-services \
    --region "${AWS_REGION}" \
    --cluster "${cluster_name}" \
    --services "${service_name}" \
    --query 'services[0].loadBalancers[0].targetGroupArn' \
    --output text
}

# ── Main ──────────────────────────────────────────────────────────────────

main() {
  echo ""
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║              TRADINGO Deployment Script                      ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""
  info "Environment: ${ENVIRONMENT}"
  info "Region:      ${AWS_REGION}"
  info "Date:        $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo ""

  # ── Rollback Mode ──
  if [[ "${ROLLBACK}" == "true" ]]; then
    notify_slack "ROLLBACK STARTED" "Rollback initiated for ${ENVIRONMENT}" "#ff0000"
    rollback_service "${SERVICE_WEB}"  "${CLUSTER_NAME}" || true
    rollback_service "${SERVICE_API}"  "${CLUSTER_NAME}" || true
    wait_for_steady "${SERVICE_WEB}"  "${CLUSTER_NAME}"
    wait_for_steady "${SERVICE_API}"  "${CLUSTER_NAME}"
    notify_slack "ROLLBACK COMPLETE" "Rollback completed for ${ENVIRONMENT}" "#ff0000"
    ok "Rollback completed"
    exit 0
  fi

  # ── Deployment Flow ──
  notify_slack "DEPLOYMENT STARTED" "Deployment initiated for ${ENVIRONMENT}" "#3498db"

  get_git_sha
  get_ecr_registry

  # 1. Build and push Docker images
  ecr_login
  build_and_push "web" "Dockerfile.web"
  build_and_push "api" "Dockerfile.api"

  # 2. Run database migrations
  run_database_migrations

  # 3. Register task definitions
  TASK_DEF_WEB_ARN="$(register_task_definition "ecs-task-definition.json" "${TASK_DEF_WEB}")"
  TASK_DEF_API_ARN="$(register_task_definition "ecs-task-definition-api.json" "${TASK_DEF_API}")"

  # 4. Deploy to ECS
  deploy_service "${SERVICE_WEB}" "${TASK_DEF_WEB_ARN}" "${CLUSTER_NAME}"
  deploy_service "${SERVICE_API}" "${TASK_DEF_API_ARN}" "${CLUSTER_NAME}"

  # 5. Wait for deployments to stabilize
  if ! wait_for_steady "${SERVICE_WEB}" "${CLUSTER_NAME}"; then
    err "Web service deployment failed to stabilize"
    rollback_service "${SERVICE_WEB}" "${CLUSTER_NAME}"
    rollback_service "${SERVICE_API}" "${CLUSTER_NAME}"
    notify_slack "DEPLOYMENT FAILED" "Web service failed to stabilize. Rolled back." "#ff0000"
    exit 1
  fi

  if ! wait_for_steady "${SERVICE_API}" "${CLUSTER_NAME}"; then
    err "API service deployment failed to stabilize"
    rollback_service "${SERVICE_WEB}" "${CLUSTER_NAME}"
    rollback_service "${SERVICE_API}" "${CLUSTER_NAME}"
    notify_slack "DEPLOYMENT FAILED" "API service failed to stabilize. Rolled back." "#ff0000"
    exit 1
  fi

  # 6. Health checks
  ALB_DNS="$(get_alb_dns "${CLUSTER_NAME}" "${SERVICE_WEB}")"
  if ! wait_for_health "Web" "https://tradingo.${ENVIRONMENT}.internal/health"; then
    err "Health check failed for Web service"
    rollback_service "${SERVICE_WEB}" "${CLUSTER_NAME}"
    rollback_service "${SERVICE_API}" "${CLUSTER_NAME}"
    notify_slack "DEPLOYMENT FAILED" "Health check failed. Rolled back." "#ff0000"
    exit 1
  fi

  # 7. Smoke tests
  if [[ "${SKIP_TESTS}" == "false" ]]; then
    if ! run_smoke_tests "https://tradingo.${ENVIRONMENT}.internal"; then
      err "Smoke tests failed"
      rollback_service "${SERVICE_WEB}" "${CLUSTER_NAME}"
      rollback_service "${SERVICE_API}" "${CLUSTER_NAME}"
      notify_slack "DEPLOYMENT FAILED" "Smoke tests failed. Rolled back." "#ff0000"
      exit 1
    fi
  else
    warn "Smoke tests skipped"
  fi

  # 8. Success
  ok "Deployment completed successfully!"
  notify_slack "DEPLOYMENT SUCCEEDED" \
    "Version: ${GIT_SHA:0:7}\nEnvironment: ${ENVIRONMENT}\nRegion: ${AWS_REGION}\nDuration: TODO" \
    "#36a64f"
}

main "$@"
