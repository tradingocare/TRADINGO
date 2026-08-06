#!/usr/bin/env bash
# ============================================================
# TRADINGO — VPS Provisioning & Security Baseline (Sprint 2)
# Target: Ubuntu 22.04 / 24.04 LTS (fresh droplet/VM)
# Run as ROOT on a fresh host:  bash provision-vps.sh
# This script does NOT deploy the application, configure DNS,
# or obtain SSL certificates. It only hardens the host.
#
# Config (env overrides):
#   DEPLOY_USER    deployment user (default: tradingo)
#   SSH_PUBKEY     public key to install for DEPLOY_USER (required)
#   TIMEZONE       default: Asia/Kolkata
# ============================================================
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-tradingo}"
SSH_PUBKEY="${SSH_PUBKEY:-}"
TIMEZONE="${TIMEZONE:-Asia/Kolkata}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info() { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail() { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run as root (sudo -i)"
[ -n "$SSH_PUBKEY" ] || warn "SSH_PUBKEY not set — password login will NOT be disabled (no key to rely on)."

export DEBIAN_FRONTEND=noninteractive
LOG=/var/log/tradingo-provision.log
touch "$LOG"

# ------------------------------------------------------------
info "1/12 — System update & upgrade"
apt-get update -qq >>"$LOG" 2>&1
apt-get upgrade -y -qq >>"$LOG" 2>&1 || warn "upgrade exited non-zero (check $LOG)"
apt-get autoremove -y -qq >>"$LOG" 2>&1 || true
ok "System updated"

# ------------------------------------------------------------
info "2/12 — Automatic security updates (unattended-upgrades)"
apt-get install -y -qq unattended-upgrades >>"$LOG" 2>&1
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
sed -i 's|^//\s*"\${distro_id}:\${distro_codename}-updates";|"${distro_id}:${distro_codename}-updates";|' \
  /etc/apt/apt.conf.d/50unattended-upgrades || true
systemctl enable --now unattended-upgrades >>"$LOG" 2>&1
ok "Automatic security updates enabled"

# ------------------------------------------------------------
info "3/12 — Timezone"
timedatectl set-timezone "$TIMEZONE" >>"$LOG" 2>&1 || warn "timedatectl failed (container?)"
ok "Timezone: $(timedatectl show -p Timezone --value)"

# ------------------------------------------------------------
info "4/12 — Deployment user: $DEPLOY_USER"
if id "$DEPLOY_USER" &>/dev/null; then
  ok "User exists"
else
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  ok "User created + sudo group"
fi

# ------------------------------------------------------------
info "5/12 — SSH key authentication"
if [ -n "$SSH_PUBKEY" ]; then
  install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 700 "/home/$DEPLOY_USER/.ssh"
  grep -qF "$SSH_PUBKEY" "/home/$DEPLOY_USER/.ssh/authorized_keys" 2>/dev/null || \
    echo "$SSH_PUBKEY" >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
  ok "SSH public key installed for $DEPLOY_USER"

  cat > /etc/ssh/sshd_config.d/99-tradingo.conf <<EOF
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 4
MaxSessions 6
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60
EOF
  chmod 600 /etc/ssh/sshd_config.d/99-tradingo.conf
  sshd -t && systemctl restart ssh >>"$LOG" 2>&1
  ok "sshd hardened (password login disabled, root login disabled)"
else
  warn "SSH_PUBKEY empty — SKIPPING sshd hardening. Set SSH_PUBKEY and re-run."
fi

# ------------------------------------------------------------
info "6/12 — Fail2Ban"
apt-get install -y -qq fail2ban >>"$LOG" 2>&1
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd
[sshd]
enabled = true
port    = ssh
EOF
systemctl enable --now fail2ban >>"$LOG" 2>&1
ok "Fail2Ban enabled (sshd jail)"

# ------------------------------------------------------------
info "7/12 — UFW firewall"
apt-get install -y -qq ufw >>"$LOG" 2>&1
ufw --force reset >>"$LOG" 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable >>"$LOG" 2>&1
ufw status verbose | head -20
ok "UFW enabled (22, 80, 443; default deny incoming)"

# ------------------------------------------------------------
info "8/12 — Docker Engine + Compose"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh >>"$LOG" 2>&1 || fail "docker install failed"
fi
if ! docker compose version &>/dev/null; then
  apt-get install -y -qq docker-compose-plugin >>"$LOG" 2>&1
fi
usermod -aG docker "$DEPLOY_USER"
systemctl enable --now docker >>"$LOG" 2>&1
systemctl enable --now containerd >>"$LOG" 2>&1
ok "Docker: $(docker --version)"
ok "Compose: $(docker compose version)"
ok "Docker auto-start enabled"

# ------------------------------------------------------------
info "9/12 — Swap"
if swapon --show | grep -q swap; then
  ok "Swap already present: $(swapon --show --noheadings | awk '{print $1, $3}')"
else
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile >>"$LOG" 2>&1
  swapon /swapfile >>"$LOG" 2>&1
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "2G swap created + persisted in /etc/fstab"
fi

# ------------------------------------------------------------
info "10/12 — System tuning (sysctl + limits)"
cat > /etc/sysctl.d/99-tradingo.conf <<'SYSCTL'
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
sysctl --system >>"$LOG" 2>&1 || true
cat > /etc/security/limits.d/99-tradingo.conf <<'LIMITS'
*               soft    nofile          1048576
*               hard    nofile          1048576
LIMITS
ok "System tuning applied"

# ------------------------------------------------------------
info "11/12 — Base tooling"
apt-get install -y -qq curl git jq htop net-tools ca-certificates gnupg >>"$LOG" 2>&1
ok "Base tools installed"

# ------------------------------------------------------------
info "12/12 — Docker post-install access check"
if id -nG "$DEPLOY_USER" | grep -q docker; then
  ok "$DEPLOY_USER is in docker group (log out/in or 'newgrp docker' to use)"
fi

echo
echo "============================================"
echo "  VPS PROVISIONING COMPLETE (Sprint 2)"
echo "============================================"
echo "  Hostname:   $(hostname)"
echo "  OS:         $(. /etc/os-release && echo "$PRETTY_NAME")"
echo "  Timezone:   $(timedatectl show -p Timezone --value 2>/dev/null || echo n/a)"
echo "  Deploy user: $DEPLOY_USER (sudo + docker)"
echo "  Firewall:   UFW active — ssh/80/443"
echo "  Fail2Ban:   sshd jail active"
echo "  Swap:       $(swapon --show --noheadings 2>/dev/null | wc -l) swap device(s)"
echo
echo "  Next: run verify-security.sh, then hand over to Sprint 3+"
echo "  (Sprint 4 will provision OpenSearch/ClickHouse + wire secrets)"
echo "============================================"
