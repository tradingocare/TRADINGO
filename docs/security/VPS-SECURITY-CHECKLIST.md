# TRADINGO — VPS Security Checklist (Sprint 2 Baseline)

Source of truth for what a production host MUST satisfy before any service is
deployed. Automation: `ops/provisioning/provision-vps.sh` (apply) and
`ops/provisioning/verify-security.sh` (check). Manual spot-verify commands included.

## 1. Provisioning prerequisites (founder)
- [ ] VPS provisioned: Ubuntu **22.04 or 24.04 LTS**, ≥ 2 vCPU / ≥ 4 GB RAM / ≥ 40 GB SSD (recommended)
- [ ] Root SSH access available for first login
- [ ] Public key `~/.ssh/id_ed25519.pub` (dev machine) registered on the VPS for user `tradingo`
- [ ] DNS stays untouched (Sprint 3); SSL untouched (Sprint 3); app NOT deployed (Sprint 4+)

## 2. Hardening checklist (verify-security.sh automates all of these)

### OS baseline
- [ ] `apt-get update && apt-get upgrade` applied (no pending upgrades)
- [ ] Automatic security updates: `systemctl is-active unattended-upgrades`
- [ ] Timezone set (e.g. `Asia/Kolkata`): `timedatectl show -p Timezone --value`
- [ ] Swap present: `swapon --show` (2 GB; persisted in `/etc/fstab`)

### Users & SSH
- [ ] Non-root deployment user `tradingo` in `sudo` group: `id tradingo`
- [ ] `authorized_keys` populated (600/700 perms)
- [ ] `PasswordAuthentication no` — `grep PasswordAuthentication /etc/ssh/sshd_config.d/99-tradingo.conf`
- [ ] `PermitRootLogin no`
- [ ] `sshd -t` clean + ssh restarted
- [ ] Verify in a NEW session: `ssh tradingo@<IP> -i ~/.ssh/id_ed25519` works; password login fails

### Firewall (UFW)
- [ ] `ufw status verbose` → `Status: active`, `Default: deny (incoming)`
- [ ] Allowed: 22/tcp, 80/tcp, 443/tcp only

### Intrusion prevention
- [ ] `systemctl is-active fail2ban`
- [ ] `fail2ban-client status sshd` → bantime 1h / maxretry 5 / findtime 10m

### Docker
- [ ] `docker --version` and `docker compose version`
- [ ] `systemctl is-enabled docker` (auto-start)
- [ ] `tradingo` in `docker` group
- [ ] Note: docker on default bridge has NO iptables restriction yet — restrict `iptables` false in daemon.json only when explicit container port policy decided (Sprint 4 networking)

### System tuning (apply)
- [ ] `/etc/sysctl.d/99-tradingo.conf` present; `sysctl --system` applied
- [ ] `/etc/security/limits.d/99-tradingo.conf` (nofile 1048576)

### Resources
- [ ] Disk: `df -h /` ≥ 10 GB free
- [ ] Memory: `free -h` ≥ 2 GB
- [ ] Swap: `swapon --show` ≥ 2 GB

## 3. Gate
`bash ops/provisioning/verify-security.sh` → **0 failed** before Sprint 3 work starts.
A copy of the output is archived in `docs/reports/SPRINT-2-VPS-PROVISIONING.md`.
