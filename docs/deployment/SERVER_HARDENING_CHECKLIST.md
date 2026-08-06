# TRADINGO — Server Hardening Checklist

> Sprint 3 (Phase D1) · 2026-08-04. Everything required BEFORE production deployment.
> Automation: `ops/provisioning/provision-vps.sh` + `ops/provisioning/verify-security.sh` (exit-0 gate).
> Manual rows below are the residual items NOT covered by the scripts.

## A. Host baseline (automated — verify-security.sh gates)

| # | Item | Verify | Status |
|---|---|---|---|
| 1 | Ubuntu 22.04/24.04 LTS, all upgrades applied | `apt-get -s upgrade \| grep -c '^Inst'` = 0 | script |
| 2 | Automatic security updates | `systemctl is-active unattended-upgrades` | script |
| 3 | Timezone (Asia/Kolkata) | `timedatectl show -p Timezone --value` | script |
| 4 | Swap ≥ 2 GB persisted | `swapon --show`; `/etc/fstab` | script |
| 5 | Non-root user `tradingo` (sudo + docker) | `id tradingo`; `id -nG tradingo` | script |
| 6 | SSH key auth only | `authorized_keys` (600/700); sshd config valid | script |
| 7 | Password login disabled | `grep PasswordAuthentication /etc/ssh/sshd_config.d/99-tradingo.conf` | script |
| 8 | Root login disabled | `grep PermitRootLogin .../99-tradingo.conf` | script |
| 9 | UFW: default deny incoming; 22/80/443 only | `ufw status verbose` | script |
| 10 | Fail2Ban sshd jail (1h / 5 / 10m) | `fail2ban-client status sshd` | script |
| 11 | Docker + Compose plugin, auto-start | `systemctl is-enabled docker`; `docker compose version` | script |
| 12 | Sysctl tuning + nofile limits | `/etc/sysctl.d/99-tradingo.conf` applied | script |
| 13 | Disk ≥ 10 GB free / RAM ≥ 2 GB | `df -h /`; `free -h` | script |

## B. Residual manual items (Sprint 2 scripts do NOT cover)

| # | Item | Command / evidence | Status |
|---|---|---|---|
| 14 | New-session SSH test | `ssh tradingo@<VPS_IP> -i ~/.ssh/id_ed25519` from dev machine; password login must fail | ⏳ post-VPS |
| 15 | Docker daemon security | `docker info` — verify rootless not needed; restrict `"iptables": false` only with explicit port policy decision | ⏳ Sprint 4 |
| 16 | Container image updates | pin `nginx:1.27-alpine`, node, postgres to digest or patch versions; `docker compose pull` on schedule | ⏳ |
| 17 | Log rotation (containers + journald) | `docker compose logs --tail` rotation via logrotate; `journald.conf SystemMaxUse=2G` | ⏳ Sprint 4 |
| 18 | Time sync | `timedatectl timesync-status` (chrony/systemd-timesyncd active) | ⏳ |
| 19 | Monitoring agents | Prometheus targets UP, Alertmanager → Slack test alert, Grafana login | ⏳ Sprint 6 |
| 20 | Backup cron installed + test restore | `/etc/cron.d/tradingo-backup`; `ops/backup/restore-test.sh` drill (blocker B6) | ⏳ Sprint 4+ |
| 21 | Fail2Ban additional jails | docker/nginx jails after services run | ⏳ Sprint 4 |
| 22 | SSH: fail2ban whitelist/SSH key rotation plan | documented in runbook | ⏳ |

## C. Pre-deploy gates (blockers from Sprint 3 audit)

- [ ] **B2** VPS provisioned + §A all green (`verify-security.sh` 0 failed)
- [ ] **B3** DNS records applied (guide: `DNS_CONFIGURATION_GUIDE.md`)
- [ ] **B4** Real LE certificates installed (guide: `SSL_SETUP_GUIDE.md`) — no self-signed in prod
- [ ] **B6** Restore drill executed once
- [ ] **B1** All founder secrets in `.env.production.local` (gitignored)

## D. Post-deploy re-verify (after Sprint 4 stack is up)

```bash
# repeat automated gate after provisioning changes
bash ops/provisioning/verify-security.sh
# network posture
ss -tlnp                      # only 22/80/443 publicly bound
docker ps --format '{{.Names}} {{.Status}}'   # all healthy
curl -sI https://tradingo.in | grep -iE 'strict-transport|x-frame|x-content|referrer'  # headers present
```
