#!/bin/bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
SECRETS=(
  "JWT_SECRET:$(openssl rand -base64 32)"
  "DATABASE_URL:postgresql://tradingo_app:password@tradingo-db.region.rds.amazonaws.com:5432/tradingo"
  "REDIS_URL:redis://tradingo-cache.region.amazonaws.com:6379"
  "RAZORPAY_KEY_ID:rzp_live_XXXXXXXXXXXXXXXX"
  "RAZORPAY_KEY_SECRET:XXXXXXXXXXXXXXXXXXXXXXXX"
  "SENTRY_DSN:https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o000000.ingest.sentry.io/0000000"
  "SMTP_HOST:smtp.tradingo.com"
  "SMTP_USER:notifications@tradingo.com"
  "SMTP_PASS:placeholder"
)

echo "Setting up AWS Secrets Manager secrets..."

for secret in "${SECRETS[@]}"; do
  NAME="${secret%%:*}"
  VALUE="${secret#*:}"
  
  if aws secretsmanager describe-secret --secret-id "tradingo/$NAME" --region "$AWS_REGION" 2>/dev/null; then
    echo "  Updating: tradingo/$NAME"
    aws secretsmanager put-secret-value \
      --secret-id "tradingo/$NAME" \
      --secret-string "$VALUE" \
      --region "$AWS_REGION" > /dev/null
  else
    echo "  Creating: tradingo/$NAME"
    aws secretsmanager create-secret \
      --name "tradingo/$NAME" \
      --secret-string "$VALUE" \
      --tags Key=Environment,Value=production Key=Project,Value=tradingo \
      --region "$AWS_REGION" > /dev/null
  fi
done

echo "All secrets configured."
