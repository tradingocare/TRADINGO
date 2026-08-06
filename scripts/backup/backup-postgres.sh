#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date -u '+%Y%m%d_%H%M%S')
DB_NAME="${DB_NAME:-tradingo}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-tradingo}"
S3_BUCKET="${S3_BUCKET:-tradingo-backups}"
AWS_REGION="${AWS_REGION:-us-east-1}"

mkdir -p "$BACKUP_DIR"

echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] Starting PostgreSQL backup: $DB_NAME"

pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump" \
  --no-owner \
  --verbose

echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] Uploading to S3..."
aws s3 cp "${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump" "s3://${S3_BUCKET}/postgres/${DB_NAME}_${TIMESTAMP}.dump" --region "$AWS_REGION"
echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] Upload complete"

echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] Rotating backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date -u '+%Y-%m-%d %H:%M:%S')] Backup complete"
