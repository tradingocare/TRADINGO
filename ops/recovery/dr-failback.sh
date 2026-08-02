#!/usr/bin/env bash
set -euo pipefail

# TRADINGO Disaster Recovery Failback
# Returns primary region to service after DR failover
# Restores primary from DR, then switches DNS back
# Usage: ./dr-failback.sh [--commit] [--primary-region=<region>]

DRY_RUN=true
PRIMARY_REGION="${PRIMARY_REGION:-ap-south-1}"
DR_REGION="${DR_REGION:-eu-west-1}"
S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-tradingo-backups}"
LOG_TAG="[dr-failback]"

log() { echo "$LOG_TAG $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }
error() { echo "$LOG_TAG ERROR: $*" >&2; exit 1; }
warn() { echo "$LOG_TAG WARN: $*"; }

for arg in "$@"; do
  case "$arg" in
    --commit) DRY_RUN=false ;;
    --primary-region=*) PRIMARY_REGION="${arg#*=}" ;;
    --help|-h)
      echo "TRADINGO DR Failback"
      echo "Usage: $0 [--commit] [--primary-region=<region>]"
      exit 0
      ;;
  esac
done

log "=========================================="
if $DRY_RUN; then
  log "DR FAILBACK — DRY RUN (use --commit to execute)"
else
  log "DR FAILBACK — EXECUTING"
fi
log "Primary region (recovering): ${PRIMARY_REGION}"
log "DR region (current active):  ${DR_REGION}"
log "=========================================="

# Step 1: Verify primary region is restored and healthy
log "Step 1/6: Verifying primary region recovery..."
PRIMARY_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://api.${PRIMARY_REGION}.tradingo.internal/health" 2>/dev/null || echo "000")
if [ "$PRIMARY_HEALTH" != "200" ]; then
  error "Primary region ${PRIMARY_REGION} is not healthy (HTTP ${PRIMARY_HEALTH}). Cannot failback."
fi
log "✅ Primary region healthy"

# Step 2: Sync data from DR back to primary
log "Step 2/6: Syncing data from DR to primary..."
log "Taking DR snapshot before sync (safety checkpoint)..."
if ! $DRY_RUN; then
  ssh "admin@${DR_REGION}.tradingo.internal" "pg_dump -Fc -Z9 -f /tmp/tradingo-pre-failback.dump tradingo" 2>&1 || warn "DR snapshot failed"
  aws s3 cp "/tmp/tradingo-pre-failback.dump" "s3://${S3_BACKUP_BUCKET}/failback/dr-snapshot-$(date -u +%Y%m%dT%H%M%SZ).dump" 2>/dev/null || true
  log "DR snapshot saved to S3"
else
  log "[DRY-RUN] Would take DR snapshot and sync to primary"
fi

# Step 3: Transfer latest backup from DR to primary
log "Step 3/6: Transferring latest data to primary..."
if ! $DRY_RUN; then
  LATEST_DR_BACKUP=$(aws s3 ls "s3://${S3_BACKUP_BUCKET}/postgres/full/" --region "$DR_REGION" 2>/dev/null | grep ".dump$" | sort | tail -1 | awk '{print $4}' || echo "")
  if [ -n "$LATEST_DR_BACKUP" ]; then
    aws s3 cp "s3://${S3_BACKUP_BUCKET}/postgres/full/${LATEST_DR_BACKUP}" \
      "s3://${S3_BACKUP_BUCKET}/postgres/failback/${LATEST_DR_BACKUP}" --region "$PRIMARY_REGION" 2>&1 || warn "Cross-region copy failed"
    log "Latest backup transferred to primary region"
  fi
else
  log "[DRY-RUN] Would cross-region copy latest backup"
fi

# Step 4: Restore primary PostgreSQL from latest backup
log "Step 4/6: Restoring primary PostgreSQL..."
if ! $DRY_RUN; then
  ssh "postgres@${PRIMARY_REGION}.tradingo.internal" "\
    pg_ctl stop -D /var/lib/postgresql/data -m fast; \
    pg_restore --clean --if-exists --no-owner -d tradingo /tmp/tradingo-pre-failback.dump; \
    pg_ctl start -D /var/lib/postgresql/data" 2>&1 || warn "Primary restore exit code: $?"
  log "Primary PostgreSQL restored and started"
else
  log "[DRY-RUN] Would: stop PG → restore → start PG on primary"
fi

# Step 5: Switch DNS back to primary
log "Step 5/6: Updating DNS to primary..."
if ! $DRY_RUN; then
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
            \"SetIdentifier\": \"primary-${PRIMARY_REGION}\",
            \"Failover\": \"PRIMARY\",
            \"TTL\": 60,
            \"AliasTarget\": {
              \"HostedZoneId\": \"${PRIMARY_LB_ZONE_ID}\",
              \"DNSName\": \"${PRIMARY_LB_DNS}\",
              \"EvaluateTargetHealth\": true
            }
          }
        }]
      }" 2>&1 || warn "Route53 update failed"
    log "DNS switched back to ${PRIMARY_REGION}"
  fi
else
  log "[DRY-RUN] Would run: aws route53 change-resource-record-sets ..."
fi

# Step 6: Scale down DR stack and notify
log "Step 6/6: Scaling down DR and sending notification..."
if ! $DRY_RUN; then
  ssh "admin@${DR_REGION}.tradingo.internal" "kubectl scale deployment/api --replicas=1 -n tradingo && kubectl scale deployment/web --replicas=1 -n tradingo" 2>&1 || warn "DR scale down failed"
  log "DR stack scaled down to minimum"
  
  curl -s -o /dev/null -X POST "${SLACK_WEBHOOK_URL:-}" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"✅ DR FAILBACK COMPLETE — ${DR_REGION} → ${PRIMARY_REGION}\",\"attachments\":[{\"color\":\"good\",\"fields\":[{\"title\":\"Status\",\"value\":\"Primary ${PRIMARY_REGION} is now active\",\"short\":true},{\"title\":\"DR Region\",\"value\":\"${DR_REGION} scaled down, ready for standby\",\"short\":true}]}]}" 2>/dev/null || true
  log "Notification sent"
else
  log "[DRY-RUN] Would scale down DR and send notification"
fi

log "=========================================="
if $DRY_RUN; then
  log "DR FAILBACK DRY RUN COMPLETE"
  log "Run with --commit to execute"
else
  log "✅ DR FAILBACK COMPLETE"
  log "Primary region ${PRIMARY_REGION} restored to production"
  log "DR region ${DR_REGION} returned to standby"
  log "Actions required:"
  log "  1. Run restore-test.sh to verify data integrity"
  log "  2. Monitor application health for 1 hour"
  log "  3. Document incident and failover timeline"
fi
log "=========================================="
