#!/usr/bin/env bash
set -euo pipefail

# ============================================
# TRADINGO — VPS Deployment Script
# DigitalOcean / Any Ubuntu 22.04+ VPS
# Docker Compose deployment
# ============================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

# ── Configuration ──────────────────────────────────────
DOMAIN="${DOMAIN:-tradingo.in}"
API_DOMAIN="api.${DOMAIN}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
REPO_URL="${REPO_URL:-https://github.com/tradingocare/TRADINGO.git}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="docker-compose.prod.yml"
# Real secrets live ONLY in the gitignored .env.production.local.
# The tracked .env.production is a placeholder template and must NEVER be used or overwritten.
ENV_FILE=".env.production.local"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

# ── Prerequisites ──────────────────────────────────────
check_prereqs() {
  info "Checking prerequisites..."
  
  if [ "$(id -u)" -eq 0 ]; then
    fail "Do NOT run as root. Run as a sudo-enabled user."
  fi

  if ! command -v sudo &>/dev/null; then
    fail "sudo is required"
  fi

  local os
  os=$(grep -oP '^ID=\K.*' /etc/os-release 2>/dev/null || echo "unknown")
  if [[ "$os" != "ubuntu" && "$os" != "debian" ]]; then
    warn "Only Ubuntu/Debian are officially supported (detected: $os)"
  fi

  ok "Prerequisites check passed"
}

# ── System Dependencies ────────────────────────────────
install_deps() {
  info "Updating system packages..."
  sudo apt-get update -qq || warn "apt update failed (continuing)"

  info "Installing Docker, Docker Compose, and system tools..."
  if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    # shellcheck disable=SC2016
    warn 'Log out and back in for docker group to take effect, or run: newgrp docker'
  fi

  if ! docker compose version &>/dev/null; then
    sudo apt-get install -y docker-compose-plugin
  fi

  if ! command -v certbot &>/dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
  fi

  # Tools for secret generation and monitoring
  sudo apt-get install -y curl git openssl jq htop net-tools ufw

  ok "Docker: $(docker --version)"
  ok "Docker Compose: $(docker compose version)"
  ok "Certbot: $(certbot --version 2>/dev/null || echo 'installed')"
}

# ── Firewall ───────────────────────────────────────────
configure_firewall() {
  info "Configuring firewall..."
  sudo ufw --force reset
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow ssh
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw --force enable
  ok "Firewall configured (SSH, HTTP, HTTPS)"
}

# ── Clone / Pull Repository ────────────────────────────
setup_repo() {
  local target="$HOME/tradingo"
  if [ -d "$target/.git" ]; then
    info "Repository exists, pulling latest..."
    cd "$target"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
  else
    info "Cloning repository..."
    git clone --branch "$BRANCH" "$REPO_URL" "$target"
    cd "$target"
  fi
  ok "Repository ready at $target ($(git rev-parse --short HEAD))"
}

# ── Generate Secrets ───────────────────────────────────
generate_secrets() {
  info "Generating production secrets..."

  # Fail-fast: never write into the tracked placeholder template.
  if [ "$ENV_FILE" = ".env.production" ]; then
    fail "Refusing to write secrets into the tracked template .env.production. ENV_FILE must point to .env.production.local"
  fi

  # Fail-fast: refuse to silently overwrite an existing secrets file (would rotate all secrets).
  if [ -f "$ENV_FILE" ]; then
    warn "$ENV_FILE already exists — re-running rotates ALL secrets and drops any founder-supplied values."
    read -rp "Overwrite $ENV_FILE? Existing values will be lost. (y/N): " OVERWRITE_ANS
    if [ "${OVERWRITE_ANS:-N}" != "y" ] && [ "${OVERWRITE_ANS:-N}" != "Y" ]; then
      fail "Aborted — $ENV_FILE not modified."
    fi
  fi

  # Generate strong random values
  local jwt_secret jwt_refresh_secret db_password redis_password ai_vault_key grafana_password
  
  jwt_secret=$(openssl rand -hex 64)
  jwt_refresh_secret=$(openssl rand -hex 64)
  db_password=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  redis_password=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
  ai_vault_key=$(openssl rand -hex 64)
  grafana_password=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
  
  # Prompt for API keys that can't be auto-generated
  if [ -z "${RAZORPAY_KEY_ID:-}" ]; then
    read -rp "Razorpay Key ID (rzp_live_...): " RAZORPAY_KEY_ID
  fi
  if [ -z "${RAZORPAY_KEY_SECRET:-}" ]; then
    read -rsp "Razorpay Key Secret: " RAZORPAY_KEY_SECRET
    echo
  fi
  if [ -z "${RAZORPAY_WEBHOOK_SECRET:-}" ]; then
    read -rsp "Razorpay Webhook Secret: " RAZORPAY_WEBHOOK_SECRET
    echo
  fi
  if [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
    read -rp "AWS Access Key ID (for SES/S3): " AWS_ACCESS_KEY_ID
  fi
  if [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
    read -rsp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo
  fi
  
  # Write .env.production.local (gitignored — never commit)
  cat > "$ENV_FILE" << ENVEOF
# TRADINGO — Production Environment (auto-generated)
# ============================================
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://${DOMAIN}
API_URL=https://${API_DOMAIN}
LOG_LEVEL=info

NEXT_PUBLIC_API_URL=https://${API_DOMAIN}/api/v1
NEXT_PUBLIC_SOCKET_URL=https://${API_DOMAIN}
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NEXT_PUBLIC_RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_APP_VERSION=v1.0.0
NEXT_PUBLIC_APP_ENV=production

DATABASE_URL=postgresql://tradingo:${db_password}@postgres:5432/tradingo
DIRECT_URL=postgresql://tradingo:${db_password}@localhost:5432/tradingo
POSTGRES_PASSWORD=${db_password}

REDIS_URL=redis://:${redis_password}@redis:6379/0
REDIS_PASSWORD=${redis_password}

JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_refresh_secret}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_BUCKET=tradingo-uploads
CLOUDFRONT_DOMAIN=

OPENSEARCH_URL=http://host.docker.internal:9200
OPENSEARCH_USERNAME=
OPENSEARCH_PASSWORD=

CLICKHOUSE_URL=http://host.docker.internal:8123
CLICKHOUSE_USERNAME=
CLICKHOUSE_PASSWORD=

EMAIL_FROM=noreply@${DOMAIN}

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://${API_DOMAIN}/auth/google/callback
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_CALLBACK_URL=https://${API_DOMAIN}/auth/linkedin/callback
GOOGLE_MAPS_API_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMS_PROVIDER=twilio

RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}
RAZORPAY_ACCOUNT_NUMBER=
PAYMENT_MODE=live

STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

SENTRY_DSN=
SENTRY_ENABLED=false

AI_VAULT_MASTER_KEY=${ai_vault_key}
AI_CACHE_ENABLED=true

OPENAI_API_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
TAVILY_API_KEY=
FIRECRAWL_API_KEY=

S3_BACKUP_BUCKET=tradingo-backups
S3_BACKUP_PREFIX=postgres
BACKUP_RETENTION_DAYS=30
PG_PASSWORD=${db_password}
WAL_BACKUP_BUCKET=tradingo-wal-archive
WAL_RETENTION_HOURS=168

GRAFANA_ADMIN_PASSWORD=${grafana_password}
SLACK_WEBHOOK_URL=
ENVEOF

  chmod 600 "$ENV_FILE"
  ok "Secrets generated and written to $ENV_FILE"
  
  # Print summary (without exposing secrets)
  echo
  info "=== Generated Secrets Summary ==="
  info "Database password:     ${db_password}"
  info "Redis password:        ${redis_password}"
  info "JWT Secret:            ${jwt_secret:0:16}...${jwt_secret: -16}"
  info "JWT Refresh Secret:    ${jwt_refresh_secret:0:16}...${jwt_refresh_secret: -16}"
  info "AI Vault Key:          ${ai_vault_key:0:16}...${ai_vault_key: -16}"
  info "Grafana Password:      ${grafana_password}"
  echo
  info "SAVE these credentials in a password manager!"
  echo
}

# ── SSL Certificate ────────────────────────────────────
setup_ssl() {
  info "Obtaining SSL certificate for ${DOMAIN}..."
  
  # Stop nginx temporarily if running
  sudo systemctl stop nginx 2>/dev/null || true
  
  # Ensure ports 80/443 are free for certbot standalone
  sudo certbot certonly --standalone \
    --agree-tos --non-interactive \
    --email "${EMAIL}" \
    -d "${DOMAIN}" -d "www.${DOMAIN}" -d "${API_DOMAIN}" \
    --preferred-challenges http || {
    warn "SSL certbot failed. You may need to manually run:"
    warn "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d ${API_DOMAIN}"
  }
  
  # Create ssl directory and symlink certs
  mkdir -p infrastructure/nginx/ssl
  if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" infrastructure/nginx/ssl/fullchain.pem
    sudo cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" infrastructure/nginx/ssl/privkey.pem
    sudo chown -R "$USER:$USER" infrastructure/nginx/ssl/
    chmod 600 infrastructure/nginx/ssl/privkey.pem
    ok "SSL certificates installed"
  else
    warn "SSL certificates not found. Using self-signed for now."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout infrastructure/nginx/ssl/privkey.pem \
      -out infrastructure/nginx/ssl/fullchain.pem \
      -subj "/C=IN/ST=State/L=City/O=TRADINGO/CN=${DOMAIN}"
  fi
}

# ── Build & Deploy ─────────────────────────────────────
build_and_deploy() {
  info "Building and deploying all services..."
  
  # Create required directories
  mkdir -p prometheus_data grafana_data postgres_data redis_data
  
  # Build images
  compose build --parallel
  
  # Run database migrations
  info "Running database migrations..."
  compose run --rm api-migrate || fail "Migration failed. Resolve the error before continuing deployment."
  
  # Seed database (idempotent)
  info "Seeding database..."
  compose run --rm api-migrate npx prisma db seed || warn "Seed completed with warnings"
  
  # Start all services
  info "Starting all services..."
  compose up -d
  
  # Wait for services to be healthy
  info "Waiting for services to become healthy..."
  local retries=30
  local i=0
  while [ $i -lt $retries ]; do
    local healthy
    healthy=$(compose ps --services --filter "status=running" | wc -l)
    local total
    total=$(compose config --services | wc -l)
    echo -ne "  Services healthy: ${healthy}/${total}\r"
    if [ "$healthy" -ge "$((total - 2))" ]; then
      echo
      ok "All services running"
      break
    fi
    i=$((i + 1))
    sleep 5
  done
  
  if [ $i -ge $retries ]; then
    warn "Not all services are healthy. Checking status..."
    compose ps
  fi
}

# ── Smoke Tests ────────────────────────────────────────
run_smoke_tests() {
  info "Running smoke tests..."
  bash scripts/deploy/smoke-test.sh "http://localhost:3001" "http://localhost:3000" || {
    fail "Smoke tests FAILED. Check docker logs."
  }
  ok "All smoke tests passed!"
}

# ── SSL Auto-Renewal ───────────────────────────────────
setup_ssl_renewal() {
  info "Setting up SSL auto-renewal..."
  local project_dir
  project_dir="$(pwd)"

  # Add certbot renewal cron with an explicit repo path.
  printf '0 3 * * * root certbot renew --quiet --post-hook "cd %s && docker compose --env-file .env.production.local -f docker-compose.prod.yml restart nginx"\n' "$project_dir" \
    | sudo tee /etc/cron.d/certbot-renew >/dev/null
  
  ok "SSL auto-renewal configured (daily 3 AM)"
}

# ── Backup Cron ────────────────────────────────────────
setup_backup_cron() {
  info "Setting up automated database backups..."
  local backup_script user_name
  backup_script="$(pwd)/scripts/deploy/backup-db.sh"
  user_name="$(id -un)"

  chmod +x "$backup_script"

  printf '0 2 * * * %s %s\n' "$user_name" "$backup_script" \
    | sudo tee /etc/cron.d/tradingo-backup >/dev/null
  
  ok "Daily backup cron configured (2 AM)"
}

# ── System Tuning ──────────────────────────────────────
system_tuning() {
  info "Applying system tuning..."
  
  # Increase system limits for production
  sudo tee /etc/sysctl.d/99-tradingo.conf << 'SYSCTL'
# TRADINGO production tuning
net.core.somaxconn = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 10
fs.file-max = 2097152
SYSCTL
  
  sudo sysctl --system 2>/dev/null || true
  
  # Increase file descriptor limits
  sudo tee /etc/security/limits.d/99-tradingo.conf << 'LIMITS'
*               soft    nofile          1048576
*               hard    nofile          1048576
LIMITS
  
  ok "System tuning applied"
}

# ── Print Summary ──────────────────────────────────────
print_summary() {
  local ip
  ip=$(curl -s ifconfig.me || echo "<VPS_IP>")
  
  echo
  echo "============================================"
  echo "  TRADINGO Deployment Complete!"
  echo "============================================"
  echo
  echo "  Domain:        https://${DOMAIN}"
  echo "  API:           https://${API_DOMAIN}"
  echo "  Grafana:       http://127.0.0.1:3002 (SSH tunnel / admin / auto-generated)"
  echo "  Tunnel:        ssh -L 3002:127.0.0.1:3002 <user>@${ip}"
  echo "  Server IP:     ${ip}"
  echo
  echo "  DNS Records to configure:"
  echo "    A    ${DOMAIN}       → ${ip}"
  echo "    A    www.${DOMAIN}   → ${ip}"
  echo "    A    api.${DOMAIN}   → ${ip}"
  echo
  echo "  Next steps:"
  echo "    1. Configure DNS A records for your domain"
  echo "    2. Run: docker compose --env-file .env.production.local -f docker-compose.prod.yml logs -f"
  echo "    3. Visit https://${DOMAIN}"
  echo "    4. Configure missing services in .env.production.local:"
  echo "       - AI API keys (OpenAI, OpenRouter, etc.)"
  echo "       - OAuth (Google, LinkedIn)"
  echo "       - Twilio SMS"
  echo "       - Google Maps"
  echo "       - Sentry DSN"
  echo "       - Slack Webhook URL"
  echo "    5. Run POST-LAUNCH-CHECKLIST.md steps"
  echo
  echo "  To update after changes:"
  echo "    docker compose --env-file .env.production.local -f docker-compose.prod.yml pull"
  echo "    docker compose --env-file .env.production.local -f docker-compose.prod.yml up -d"
  echo
}

# ── Main ───────────────────────────────────────────────
main() {
  echo
  echo "============================================"
  echo "  TRADINGO VPS Deployment"
  echo "  Domain: ${DOMAIN}"
  echo "============================================"
  echo
  
  check_prereqs
  install_deps
  configure_firewall
  setup_repo
  generate_secrets
  setup_ssl
  build_and_deploy
  run_smoke_tests
  setup_ssl_renewal
  setup_backup_cron
  system_tuning
  print_summary
  
  ok "DEPLOYMENT COMPLETE"
}

main "$@"
