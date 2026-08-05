# TRADINGO — VPS Provisioning Audit (Sprint 2, 2026-08-04)

## 1. Objective
Provision + harden the production VPS host (Ubuntu LTS) with a security baseline:
non-root deployment user, SSH key auth, password login disabled, UFW, Fail2Ban,
Docker, Docker Compose, timezone, automatic security updates, disk/memory/swap
verification. **No application deployment, no DNS, no SSL** (later sprints).

## 2. Audit — What Exists Today

| Item | Status | Evidence |
|---|---|---|
| Production VPS | ❌ **NONE provisioned** | No host IP, no SSH target anywhere in repo/env; blocker B2 from FINAL-PRODUCTION-READINESS-AUDIT remains |
| AWS CLI | ⚠️ Installed v2, **no credentials** | `aws sts get-caller-identity` → NoCredentials |
| Terraform | ⚠️ Installed, **no state/backend/providers** in repo | no `.tf` files found |
| SSH keypair | ✅ `id_ed25519` + `id_ed25519.pub` (`ssh-ed25519 … tradingocare@gmail.com`) | `~/.ssh/` on dev machine — ready to install on VPS |
| SSH config | ❌ none | no `~/.ssh/config` |
| Existing deploy script | ✅ `scripts/deploy/deploy-vps.sh` (471 lines) | covers deps/Docker/UFW/certbot/compose-up — **no hardening** (no user mgmt, no SSH lockdown, no Fail2Ban, no unattended-upgrades, no timezone/swap) |
| k8s manifests | ✅ `ops/k8s/` (15 files) | deployment target for later phase; missing `tradingo-secrets.yaml` + `cluster-issuer.yaml` |
| Backup/recovery scripts | ✅ `ops/backup/` (6) + `ops/recovery/` (3) | host-side cron scripts; restore drill never executed |
| Monitoring configs | ✅ `ops/monitoring/` (Prometheus, Grafana, Alertmanager) | ready to deploy in Sprint 6 |
| GitHub Secrets | ⚠️ **UNVERIFIABLE** | `gh` not authenticated (blocker B5) |

## 3. Audit — Gaps Found vs Sprint 2 Scope
1. **No VPS + no credentials** → live provisioning/verification impossible today.
2. AWS CLI unconfigured → no EC2/route to auto-provision (would also need VPC/subnet/security-group decisions).
3. `deploy-vps.sh` would create a deployable but **unhardened** host (root SSH + passwords still possible).
4. No unattended-upgrades, Fail2Ban, timezone, swap, or SSH-lockdown anywhere in repo.

## 4. Sprint 2 Response (what was created)
- `ops/provisioning/provision-vps.sh` — hardened baseline installer (12 phases; see file).
- `ops/provisioning/verify-security.sh` — 13-group machine-readable verification (exit 0 gate).
- `.env.production.local.example` — secrets reference template (names/comments only).
- Secrets audit → see `docs/reports/SPRINT-2-VPS-PROVISIONING.md` §3.
- This audit report + `VPS-SECURITY-CHECKLIST.md`.

## 5. Execution Status (honest)
Provisioning + verification scripts were written and `bash -n` validated
(✅ both OK) but **NOT executed against a live host** — no VPS exists and no
credentials are available. See `SPRINT-2-VPS-PROVISIONING.md` §5 for the pending
verification matrix and the exact founder action to unlock it.
