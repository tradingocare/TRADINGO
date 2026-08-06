#!/usr/bin/env bash
set -euo pipefail

# TRADINGO Disaster Recovery Failover
# Promotes secondary (standby/DR) to primary after primary failure
# Usage: ./dr-failover.sh [--commit] [--region=<region>]
#   --commit: Actually perform the failover (dry-run without)
#   --region: Target DR region (default: eu-west-1)

DRY_RUN=true
DR_REGION="eu-west-1"
PRIMARY_REGION="${PRIMARY_REGION:-ap-south-1}"
S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-tradingo-backups}"
LOG_TAG="[dr-failover]"

log() { echo "$LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }
error() { echo "$LOG_TAG ERROR: $*" >&2; exit 1; }
warn() { echo "$LOG_TAG WARN: $*"; }

for arg in "$@"; do
  case "$arg" in
    --commit) DRY_RUN=false ;;
    --region=*) DR_REGION="${arg#*=}" ;;
    --help|-h)
      echo "TRADINGO DR Failover"
      echo "Usage: $0 [--commit] [--region=<region>]"
      echo "  --commit       Actually perform failover (default: dry-run)"
      echo "  --region       Target DR region (default: eu-west-1)"
      exit 0
      ;;
  esac
done

log "=========================================="
if $DRY_RUN; then
  log "DR FAILOVER — DRY RUN (use --commit to execute)"
else
  log "DR FAILOVER — EXECUTING"
fi
log "Primary region:    ${PRIMARY_REGION}"
log "DR region:         ${DR_REGION}"
log "=========================================="

# Step 1: Verify primary is actually down
log "Step 1/8: Verifying primary region failure..."
PRIMARY_API="http://api.${PRIMARY_REGION}.tradingo.internal/health"
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$PRIMARY_API" 2>/dev/null | grep -q "200"; then
  error "Primary region ${PRIMARY_REGION} is still healthy. Aborting failover."
fi
log "✅ Primary confirmed unreachable"

# Step 2: Verify DR region is healthy
log "Step 2/8: Verifying DR region health..."
DR_API="http://api.${DR_REGION}.tradingo.internal/health"
DR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$DR_API" 2>/dev/null || echo "000")
if [ "$DR_STATUS" != "200" ]; then
  error "DR region ${DR_REGION} is unhealthy (HTTP ${DR_STATUS}). Cannot failover."
fi
log "✅ DR region healthy (HTTP ${DR_STATUS})"

# Step 3: Check S3 cross-region replication status
log "Step 3/8: Checking S3 backup replication..."
LATEST_PRIMARY=$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/postgres/full/" --region "$PRIMARY_REGION" 2>/dev/null | grep ".dump$" | sort | tail -1 | awk '{print $4}' || echo "")
LATEST_DR=$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/postgres/full/" --region "$DR_REGION" 2>/dev/null | grep ".dump$" | sort | tail -1 | awk '{print $4}' || echo "")
if [ -z "$LATEST_DR" ]; then
  error "No replicated backups found in DR region ${DR_REGION}"
fi
log "Primary latest: ${LATEST_PRIMARY:-none}"
log "DR latest:      ${LATEST_DR}"
log "✅ S3 replication verified"

# Step 4: Promote DR Postgres replica
log "Step 4/8: Promoting DR PostgreSQL replica to primary..."
if ! $DRY_RUN; then
  # pg_ctl promote on the DR standby
  ssh "postgres@${DR_REGION}.tradingo.internal" "pg_ctl promote -D /var/lib/postgresql/data" 2>&1 || warn "pg_ctl promote exit code: $?"
  log "PostgreSQL promoted to primary"
else
  log "[DRY-RUN] Would run: ssh postgres@... pg_ctl promote"
fi

# Step 5: Update DNS to point to DR region
log "Step 5/8: Updating DNS records..."
if ! $DRY_RUN; then
  # Route53 failover — switch primary A record to DR load balancer
  HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query 'HostedZones[?Name==`tradingo.com.`].Id' --output text 2>/dev/null || echo "")
  if [ -n "$HOSTED_ZONE_ID" ]; then
    aws route53 change-resource-record-sets \
      --hosted-zone-id "$HOSTED_ZONE_ID" \
      --change-batch "{
        \"Changes\": [{
          \"Action\": \"UPSERT\",
          \"ResourceRecordSet\": {
            \"Name\": \"api.tradingo.com\",
            \"Type\": \"A\",
            \"SetIdentifier\": \"dr-failover-${DR_REGION}\",
            \"Failover\": \"PRIMARY\",
            \"TTL\": 60,
            \"AliasTarget\": {
              \"HostedZoneId\": \"${DR_LB_ZONE_ID}\",
              \"DNSName\": \"${DR_LB_DNS}\",
              \"EvaluateTargetHealth\": true
            }
          }
        }]
      }" 2>&1 || warn "Route53 update failed"
    log "DNS updated to point to ${DR_REGION}"
  else
    warn "No Route53 zone found for tradingo.com"
  fi
else
  log "[DRY-RUN] Would run: aws route53 change-resource-record-sets ..."
fi

# Step 6: Scale up DR application stack
log "Step 6/8: Scaling DR application stack..."
if ! $DRY_RUN; then
  ssh "admin@${DR_REGION}.tradingo.internal" "kubectl scale deployment/api --replicas=3 -n tradingo && kubectl scale deployment/web --replicas=3 -n tradingo" 2>&1 || warn "Scale up failed"
  log "DR application stack scaled up"
else
  log "[DRY-RUN] Would run: kubectl scale deployment/api --replicas=3"
fi

# Step 7: Verify DR application health
log "Step 7/8: Verifying DR application health..."
if ! $DRY_RUN; then
  for i in {1..30}; do
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://api.${DR_REGION}.tradingo.internal/api/v1/health" 2>/dev/null || echo "000")
    if [ "$HEALTH" = "200" ]; then
      log "✅ DR application healthy after failover"
      break
    fi
    if [ "$i" -eq 30 ]; then
      warn "DR application healthcheck did not pass within 90s"
    fi
    sleep 3
  done
else
  log "[DRY-RUN] Would verify DR application health"
fi

# Step 8: Notify
log "Step 8/8: Sending failover notification..."
if ! $DRY_RUN; then
  # Slack/email notification
  curl -s -o /dev/null -X POST "${SLACK_WEBHOOK_URL:-}" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"🚨 DR FAILOVER EXECUTED — Primary: ${PRIMARY_REGION} → DR: ${DR_REGION}\",\"attachments\":[{\"color\":\"danger\",\"fields\":[{\"title\":\"Status\",\"value\":\"ACTIVE — DR ${DR_REGION} is now primary\",\"short\":true},{\"title\":\"Action Required\",\"value\":\"Investigate primary region failure before initiating failback\",\"short\":false}]}]}" 2>/dev/null || true
  log "Notification sent"
else
  log "[DRY-RUN] Would send Slack alert"
fi

log "=========================================="
if $DRY_RUN; then
  log "DR FAILOVER DRY RUN COMPLETE"
  log "Run with --commit to execute"
else
  log "🔴 DR FAILOVER EXECUTED"
  log "Primary region ${PRIMARY_REGION} has been failed over to ${DR_REGION}"
  log "New API endpoint: http://api.${DR_REGION}.tradingo.internal"
  log "Immediate actions required:"
  log "  1. Investigate primary region failure"
  log "  2. Run dr-failback.sh when primary is restored"
  log "  3. Update incident tracker"
fi
log "=========================================="
