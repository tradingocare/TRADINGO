#!/usr/bin/env bash
set -euo pipefail

# TRADINGO Backup Cron Orchestrator
# Called by systemd timer / cron to run scheduled backups
# Dispatches to specialized backup scripts with proper logging

COMMAND="${1:-help}"
LOG_DIR="${BACKUP_LOG_DIR:-/var/log/tradingo/backups}"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$LOG_DIR"

case "$COMMAND" in
  daily)
    LOG_FILE="${LOG_DIR}/daily-${TIMESTAMP}.log"
    echo "[cron] $(date -u +%Y-%m-%dT%H:%M:%SZ) Starting daily backup" | tee -a "$LOG_FILE"
    
    echo "[cron] === PostgreSQL Full Backup ===" | tee -a "$LOG_FILE"
    /usr/local/bin/postgres-full-backup.sh 2>&1 | tee -a "$LOG_FILE"
    PG_EXIT=$?
    
    echo "[cron] === Redis Backup ===" | tee -a "$LOG_FILE"
    /usr/local/bin/redis-backup.sh 2>&1 | tee -a "$LOG_FILE"
    REDIS_EXIT=$?
    
    if [ $PG_EXIT -eq 0 ] && [ $REDIS_EXIT -eq 0 ]; then
      echo "[cron] Daily backup COMPLETED SUCCESSFULLY" | tee -a "$LOG_FILE"
      exit 0
    else
      echo "[cron] Daily backup PARTIALLY FAILED — PG:${PG_EXIT} Redis:${REDIS_EXIT}" | tee -a "$LOG_FILE"
      exit 1
    fi
    ;;

  hourly)
    LOG_FILE="${LOG_DIR}/hourly-${TIMESTAMP}.log"
    echo "[cron] $(date -u +%Y-%m-%dT%H:%M:%SZ) Starting hourly WAL flush" | tee -a "$LOG_FILE"
    # WAL archiving runs continuously via archive_command in postgresql.conf
    # This is just a health check that WAL archiving is progressing
    WAL_COUNT=$(aws s3 ls "s3://${S3_BACKUP_BUCKET:-tradingo-backups}/postgres/wal/$(date -u +%Y/%m/%d)/" 2>/dev/null | wc -l)
    echo "[cron] WAL segments archived today: ${WAL_COUNT}" | tee -a "$LOG_FILE"
    ;;

  weekly)
    LOG_FILE="${LOG_DIR}/weekly-${TIMESTAMP}.log"
    echo "[cron] $(date -u +%Y-%m-%dT%H:%M:%SZ) Starting weekly integrity check" | tee -a "$LOG_FILE"
    
    # Verify last 3 daily backups
    echo "[cron] Verifying recent backups..." | tee -a "$LOG_FILE"
    LATEST_BACKUPS=$(aws s3 ls "s3://${S3_BACKUP_BUCKET:-tradingo-backups}/postgres/full/" --recursive | sort | tail -3 | awk '{print $4}')
    for BACKUP in $LATEST_BACKUPS; do
      aws s3 cp "s3://${S3_BACKUP_BUCKET:-tradingo-backups}/${BACKUP}" - 2>/dev/null | pg_restore --list >/dev/null 2>&1
      if [ $? -eq 0 ]; then
        echo "[cron] ✅ Integrity OK: ${BACKUP}" | tee -a "$LOG_FILE"
      else
        echo "[cron] ❌ Integrity FAILED: ${BACKUP}" | tee -a "$LOG_FILE"
      fi
    done
    
    # Verify S3 lifecycle rules are applied
    aws s3api get-bucket-lifecycle-configuration --bucket "${S3_BACKUP_BUCKET:-tradingo-backups}" 2>/dev/null \
      && echo "[cron] ✅ S3 lifecycle configured" | tee -a "$LOG_FILE" \
      || echo "[cron] ⚠️  S3 lifecycle not found" | tee -a "$LOG_FILE"

    # Full restore test — validates actual restore to a test database
    echo "[cron] Running full restore test..." | tee -a "$LOG_FILE"
    /usr/local/bin/restore-test.sh 2>&1 | tee -a "$LOG_FILE"
    RESTORE_EXIT=$?
    if [ $RESTORE_EXIT -eq 0 ]; then
      echo "[cron] ✅ Restore test PASSED" | tee -a "$LOG_FILE"
    else
      echo "[cron] ❌ Restore test FAILED (exit: ${RESTORE_EXIT})" | tee -a "$LOG_FILE"
    fi
    ;;

  status)
    echo "=== TRADINGO Backup Status ==="
    echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo ""
    
    echo "--- PostgreSQL Full Backups ---"
    aws s3 ls "s3://${S3_BACKUP_BUCKET:-tradingo-backups}/postgres/full/" --recursive --summarize 2>/dev/null | tail -5
    echo ""
    
    echo "--- WAL Segments (today) ---"
    aws s3 ls "s3://${S3_BACKUP_BUCKET:-tradingo-backups}/postgres/wal/$(date -u +%Y/%m/%d)/" 2>/dev/null | wc -l
    echo ""
    
    echo "--- Redis Backups ---"
    aws s3 ls "s3://${S3_BACKUP_BUCKET:-tradingo-backups}/redis/" --recursive --summarize 2>/dev/null | tail -3
    echo ""
    
    echo "--- Last 24h Backup Logs ---"
    find "$LOG_DIR" -name "*.log" -mtime -1 2>/dev/null | while read -r f; do
      echo "Log: $(basename "$f") — $(tail -1 "$f" 2>/dev/null || echo 'empty')"
    done
    ;;

  help|*)
    echo "TRADINGO Backup Cron Orchestrator"
    echo "Usage: $0 {daily|hourly|weekly|status}"
    echo ""
    echo "  daily    — Run full PostgreSQL + Redis backup"
    echo "  hourly   — Check WAL archival health"
    echo "  weekly   — Verify backup integrity + lifecycle"
    echo "  status   — Show backup summary"
    exit 0
    ;;
esac
