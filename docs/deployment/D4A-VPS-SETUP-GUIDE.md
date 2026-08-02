# D4A — Hostinger VPS Initial Setup Guide

**Target:** Hostinger KVM VPS — Ubuntu 24.04 LTS
**Purpose:** Prepare server for TRADINGO production deployment
**Status:** Ready to execute after VPS provisioning

---

## Pre-Flight Checklist

- [ ] Hostinger KVM VPS ordered and active
- [ ] VPS IP address received (from Hostinger dashboard → VPS → Overview)
- [ ] Root password received (emailed by Hostinger upon provisioning)
- [ ] Domain DNS ready to point: `tradingo.in`, `www.tradingo.in`, `api.tradingo.in`
- [ ] SSH client available (Linux/Mac terminal, or Windows PowerShell)

---

## Step 1 — Initial SSH Access

```bash
# Connect as root (use password from Hostinger email)
ssh root@<VPS_IP>

# First thing: update the root password
passwd

# Create a sudo user for daily operations (NEVER work as root)
adduser deploy
usermod -aG sudo deploy

# Test sudo access
su - deploy
sudo whoami   # Should output: root

# Now copy your SSH public key
# From your local machine:
ssh-copy-id deploy@<VPS_IP>
# Or manually:
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "<YOUR_PUBLIC_KEY>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## Step 2 — Update Operating System

```bash
# Update package lists
sudo apt-get update -qq

# Upgrade all packages
sudo apt-get upgrade -y

# Install essential tools
sudo apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  htop \
  net-tools \
  jq \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release

# Apply all security patches (even if not strictly an upgrade)
sudo apt-get dist-upgrade -y

# Remove unnecessary packages
sudo apt-get autoremove -y
sudo apt-get autoclean -y

# Verify
lsb_release -a
uname -r
```

---

## Step 3 — Configure Timezone

```bash
# Set timezone to Asia/Kolkata (India)
sudo timedatectl set-timezone Asia/Kolkata

# Verify
timedatectl
date

# Enable NTP sync
sudo timedatectl set-ntp true

# Verify NTP
timedatectl show-timesync --all
```

---

## Step 4 — Configure SSH Security

```bash
# Backup the original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Apply security hardening
sudo sed -i 's/^#Port 22/Port 22/' /etc/ssh/sshd_config
sudo sed -i 's/^#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#PermitEmptyPasswords no/PermitEmptyPasswords no/' /etc/ssh/sshd_config
sudo sed -i 's/^#ChallengeResponseAuthentication yes/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#UsePAM yes/UsePAM no/' /etc/ssh/sshd_config
sudo sed -i 's/^#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
sudo sed -i 's/^#MaxSessions 10/MaxSessions 5/' /etc/ssh/sshd_config
sudo sed -i 's/^#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
sudo sed -i 's/^#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config
sudo sed -i 's/^#AllowAgentForwarding yes/AllowAgentForwarding no/' /etc/ssh/sshd_config
sudo sed -i 's/^#AllowTcpForwarding yes/AllowTcpForwarding no/' /etc/ssh/sshd_config
sudo sed -i 's/^#X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config

# Restart SSH to apply changes
sudo systemctl restart sshd

# Verify SSH config is valid
sudo sshd -t
```

---

## Step 5 — Configure Firewall (UFW)

```bash
# Default deny
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential services only
sudo ufw allow ssh        # Port 22
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS

# Enable firewall
sudo ufw --force enable

# Verify
sudo ufw status verbose

# Expected output:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
# 22/tcp (v6)                ALLOW       Anywhere (v6)
# 80/tcp (v6)                ALLOW       Anywhere (v6)
# 443/tcp (v6)               ALLOW       Anywhere (v6)
```

---

## Step 6 — Install Docker & Docker Compose

```bash
# Install Docker using official convenience script
curl -fsSL https://get.docker.com | sudo sh

# Add your deploy user to docker group
sudo usermod -aG docker $USER

# NOTE: Log out and back in for group change to take effect
# Or run: newgrp docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version

# Expected output:
# Docker version 27.x.x, build xxxxx
# Docker Compose version v2.x.x
```

---

## Step 7 — Install Fail2Ban

```bash
# Install
sudo apt-get install -y fail2ban

# Create local jail configuration (don't modify defaults)
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Verify
sudo systemctl status fail2ban --no-pager
sudo fail2ban-client status

# Expected: sshd jail should be active
sudo fail2ban-client status sshd
```

---

## Step 8 — Configure Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt-get install -y unattended-upgrades

# Configure
sudo tee /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
EOF

# Enable automatic updates
sudo tee /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

# Verify
sudo unattended-upgrades --dry-run --debug
```

---

## Step 9 — Configure Docker Log Rotation & Daemon

```bash
# Create Docker daemon configuration
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "storage-driver": "overlay2"
}
EOF

# Restart Docker to apply
sudo systemctl restart docker

# Verify
docker info --format '{{.LoggingDriver}}'   # Should output: json-file
docker info --format '{{.Driver}}'           # Should output: overlay2
```

---

## Step 10 — System Tuning (sysctl + Limits)

```bash
# Apply production kernel tuning
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

# Apply
sudo sysctl --system

# Increase file descriptor limits
sudo tee /etc/security/limits.d/99-tradingo.conf << 'LIMITS'
*               soft    nofile          1048576
*               hard    nofile          1048576
LIMITS

# Verify
ulimit -n
sysctl net.core.somaxconn
sysctl vm.swappiness
```

---

## Step 11 — Verify System Resources

```bash
# ── Disk ──
echo "=== DISK ==="
df -h /
lsblk

# ── Memory ──
echo "=== MEMORY ==="
free -h
cat /proc/meminfo | grep -E "MemTotal|MemAvailable|SwapTotal|SwapFree"

# ── Swap ──
echo "=== SWAP ==="
swapon --show
sudo swapon --summary

# ── CPU ──
echo "=== CPU ==="
nproc
lscpu | grep "Model name"

# ── Load ──
echo "=== LOAD ==="
uptime
cat /proc/loadavg
```

---

## Step 12 — Setup Git Repository (Clone)

```bash
# Clone the TRADINGO repository
cd ~
git clone https://github.com/tradingocare/TRADINGO.git
cd tradingo

# Make deployment scripts executable
chmod +x scripts/deploy/*.sh

# Verify
ls -la scripts/deploy/
```

---

## Verification Commands

Run these after completing all steps to confirm everything is ready:

```bash
echo "=== VERIFICATION REPORT ==="

echo -n "Docker:         "; docker --version 2>/dev/null || echo "NOT INSTALLED"
echo -n "Compose:        "; docker compose version 2>/dev/null || echo "NOT INSTALLED"
echo -n "UFW active:     "; sudo ufw status | grep -q "Status: active" && echo "YES" || echo "NO"
echo -n "Fail2Ban active:"; sudo systemctl is-active fail2ban 2>/dev/null || echo "NO"
echo -n "Unattended:     "; sudo systemctl is-active unattended-upgrades 2>/dev/null || echo "NO"
echo -n "SSH root login: "; sudo grep "^PermitRootLogin" /etc/ssh/sshd_config || echo "CHECK"
echo -n "SSH password:   "; sudo grep "^PasswordAuthentication" /etc/ssh/sshd_config || echo "CHECK"
echo -n "Timezone:       "; timedatectl | grep "Time zone"
echo -n "Disk:           "; df -h / | tail -1 | awk '{print $3 "/" $2 " used (" $5 ")"}'
echo -n "Memory:         "; free -h | grep Mem | awk '{print $3 "/" $2 " used"}'
echo -n "Swap:           "; free -h | grep Swap | awk '{print $3 "/" $2 " used"}'
echo -n "Docker logs:    "; docker info --format '{{.LoggingDriver}}' 2>/dev/null || echo "default"
echo -n "Docker storage: "; docker info --format '{{.Driver}}' 2>/dev/null || echo "default"

echo "=== END REPORT ==="
```

---

## Expected Verification Output

```
Docker:         Docker version 27.x.x, build xxxxx
Compose:        Docker Compose version v2.x.x
UFW active:     YES
Fail2Ban active: YES
Unattended:     active
SSH root login: PermitRootLogin no
SSH password:   PasswordAuthentication no
Timezone:       Asia/Kolkata (IST, +0530)
Disk:           4.2G/78G used (6%)
Memory:         512M/3.8G used
Swap:           0B/2G used
Docker logs:    json-file
Docker storage: overlay2
```

---

## Deliverables

| # | Deliverable | Location |
|---|-------------|----------|
| 1. Server Configuration Report | Section 11 + Verification output |
| 2. Installed Packages | Docker, Compose, Git, Curl, Unzip, Fail2Ban, unattended-upgrades |
| 3. Firewall Rules | SSH (22), HTTP (80), HTTPS (443) only |
| 4. Security Checklist | SSH hardened, root disabled, password auth off, Fail2Ban active |
| 5. Docker Validation | daemon.json configured, service enabled, log rotation set |
| 6. Remaining Tasks | Clone repo, configure DNS, obtain SSL, deploy application |

---

## Files Modified (on VPS)

| File | Change |
|------|--------|
| `/etc/ssh/sshd_config` | Root login disabled, password auth off, SSH hardening |
| `/etc/fail2ban/jail.local` | SSH jail with 24h ban on 3 failed attempts |
| `/etc/docker/daemon.json` | Log rotation (10m, 3 files), live-restore, overlay2 |
| `/etc/apt/apt.conf.d/20auto-upgrades` | Automatic security updates enabled |
| `/etc/apt/apt.conf.d/50unattended-upgrades` | Allowed origins for unattended upgrades |
| `/etc/sysctl.d/99-tradingo.conf` | Production kernel tuning parameters |
| `/etc/security/limits.d/99-tradingo.conf` | File descriptor limits (1M) |

---

## Remaining Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Root login not yet disabled | LOW | Will be done during initial setup step 4 |
| SSH keys not yet deployed | LOW | User must provide SSH public key |
| Docker group requires logout | LOW | `newgrp docker` or re-login after install |
| No swap configured | MEDIUM | Hostinger typically provisions without swap; add 2G swapfile if missing |
| No monitoring dashboards imported | LOW | Post-deployment task |
| DNS not configured | LOW | Need to set A records pointing to VPS IP |
| No SSL certificate | LOW | certbot run during D4D deployment phase |

---

## Final Verdict

**READY** — The VPS will be ready for deployment after executing these 12 steps. All required packages and configurations are defined. No pre-existing state to audit (fresh VPS).

**Next phase: D4B — Repository Clone & Environment Configuration** (on approval)
