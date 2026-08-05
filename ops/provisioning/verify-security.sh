#!/usr/bin/env bash
# ============================================================
# TRADINGO — VPS Security Verification (Sprint 2)
# Run AFTER provision-vps.sh. Prints PASS/FAIL per check and
# exits 0 only if all required checks pass.
#   USAGE: bash verify-security.sh
# ============================================================
set -uo pipefail

DEPLOY_USER="${DEPLOY_USER:-tradingo}"
PASS=0; FAIL=0; WARN=0

check() {
  local name="$1"; local cond="$2"
  if eval "$cond"; then
    echo -e "  \033[32m[PASS]\033[0m $name"; PASS=$((PASS+1))
  else
    echo -e "  \033[31m[FAIL]\033[0m $name"; FAIL=$((FAIL+1))
  fi
}
warnc() { echo -e "  \033[33m[WARN]\033[0m $1"; WARN=$((WARN+1)); }

echo "============================================"
echo " TRADINGO VPS SECURITY VERIFICATION"
echo " $(hostname) @ $(date -Is)"
echo "============================================"

echo "[1] System is Ubuntu LTS + up to date"
check "Ubuntu LTS" "grep -q '^ID=ubuntu' /etc/os-release && grep -Eq 'LTS|24.04|22.04' /etc/os-release"
check "apt update runs clean" "apt-get update -qq >/dev/null 2>&1 && echo ok"
upgrades="$(apt-get -s upgrade 2>/dev/null | grep -c '^Inst ' || true)"
[ "$upgrades" -eq 0 ] && check "0 pending package upgrades" "true" || warnc "$upgrades packages would still upgrade (retry provision) — setting WARN"

echo "[2] Automatic security updates"
check "unattended-upgrades enabled" "systemctl is-enabled unattended-upgrades --quiet"
check "unattended-upgrades active" "systemctl is-active unattended-upgrades --quiet"

echo "[3] Timezone configured"
check "timezone is set (not UTC default)" "timedatectl show -p Timezone --value | grep -vq '^UTC\$'"

echo "[4] Non-root deployment user"
check "user '$DEPLOY_USER' exists" "id '$DEPLOY_USER' &>/dev/null"
check "user has sudo" "id -nG '$DEPLOY_USER' | grep -qw sudo"

echo "[5] SSH key authentication"
check "authorized_keys present for $DEPLOY_USER" "test -s /home/$DEPLOY_USER/.ssh/authorized_keys"
check "authorized_keys perms 600" "[ \"\$(stat -c %a /home/$DEPLOY_USER/.ssh/authorized_keys)\" = '600' ]"

echo "[6] Password login disabled (SSH)"
check "PasswordAuthentication no" "grep -rq '^PasswordAuthentication no' /etc/ssh/sshd_config.d/ 2>/dev/null || grep -q '^PasswordAuthentication no' /etc/ssh/sshd_config"
check "PermitRootLogin no" "grep -rq '^PermitRootLogin no' /etc/ssh/sshd_config.d/ 2>/dev/null || grep -q '^PermitRootLogin no' /etc/ssh/sshd_config"
check "sshd config valid" "sshd -t"

echo "[7] UFW firewall"
check "ufw active" "ufw status | grep -q 'Status: active'"
check "default deny incoming" "ufw status verbose | grep -q 'Default: deny (incoming)'"
check "ssh allowed" "ufw status | grep -q '22/tcp' || ufw status | grep -q 'OpenSSH'"
check "80/tcp allowed" "ufw status | grep -q '80/tcp'"
check "443/tcp allowed" "ufw status | grep -q '443/tcp'"

echo "[8] Fail2Ban"
check "fail2ban enabled" "systemctl is-enabled fail2ban --quiet"
check "fail2ban active" "systemctl is-active fail2ban --quiet"
check "sshd jail enabled" "fail2ban-client status sshd >/dev/null 2>&1"

echo "[9] Docker"
check "docker installed" "command -v docker &>/dev/null && docker --version >/dev/null 2>&1"
check "docker auto-start enabled" "systemctl is-enabled docker --quiet"
check "docker running" "systemctl is-active docker --quiet"

echo "[10] Docker Compose"
check "compose plugin present" "docker compose version >/dev/null 2>&1"

echo "[11] Disk space"
disk_avail="$(df -B1 / | awk 'NR==2 {print $4}')"
check ">= 10 GB free on /" "[ $disk_avail -ge 10737418240 ]" || warnc "free space: $((disk_avail/1073741824)) GB"

echo "[12] Memory + Swap"
mem_total="$(free -b | awk '/Mem:/ {print $2}')"
check ">= 2 GB RAM" "[ $mem_total -ge 2147483648 ]"
check "swap present" "swapon --show | grep -q swap"

echo "[13] Provision log integrity"
check "provision log exists" "test -s /var/log/tradingo-provision.log"

echo
echo "============================================"
echo " RESULT: $PASS passed, $FAIL failed, $WARN warnings"
echo "============================================"
[ "$FAIL" -eq 0 ] || { echo "REMEDIATE FAILURES BEFORE PROCEEDING"; exit 1; }
[ "$WARN" -eq 0 ] && echo "ALL CHECKS PASSED — host ready for Sprint 3+"
exit 0
