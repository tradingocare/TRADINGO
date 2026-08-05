# TRADINGO — SSL Setup Guide

> Sprint 3 (Phase D1) · 2026-08-04. Complete install + renewal for the compose path.

## 1. Current state (audited)

- `infrastructure/nginx/ssl/` contains **self-signed dev certificates** (CN=tradingo.local; see `ssl/README.md`). **Never use in production** — browsers will block.
- K8s path: `ops/k8s/ingress.yaml` references `cert-manager.io/cluster-issuer: letsencrypt-prod` — **`cluster-issuer.yaml` missing** (create before k8s deploy; k8s path deferred to the k8s phase).
- nginx configs reference `/etc/nginx/ssl/fullchain.pem` + `privkey.pem` (mounted from `infrastructure/nginx/ssl/`) — swap files in place, reload.

## 2. Primary path — Let's Encrypt (compose VPS)

**Preconditions:** DNS A records resolve (guide: `DNS_CONFIGURATION_GUIDE.md`); UFW allows 80/443; VPS has internet egress to Let's Encrypt.

```bash
# as tradingo user (sudo)
sudo apt-get install -y certbot                    # or python3-certbot-nginx
# stop nginx container briefly so certbot can bind :80
cd ~/tradingo && docker compose --env-file .env.production.local -f docker-compose.prod.yml stop nginx
# issue (standalone)
sudo certbot certonly --standalone --agree-tos --non-interactive \
  --email admin@tradingo.in \
  -d tradingo.in -d www.tradingo.in -d api.tradingo.in \
  --preferred-challenges http
# install into repo (nginx reads these paths)
sudo cp /etc/letsencrypt/live/tradingo.in/fullchain.pem infrastructure/nginx/ssl/fullchain.pem
sudo cp /etc/letsencrypt/live/tradingo.in/privkey.pem infrastructure/nginx/ssl/privkey.pem
sudo chown tradingo:tradingo infrastructure/nginx/ssl/*
chmod 600 infrastructure/nginx/ssl/privkey.pem
docker compose --env-file .env.production.local -f docker-compose.prod.yml start nginx
```

**Verify:**
```bash
docker compose --env-file .env.production.local -f docker-compose.prod.yml exec nginx nginx -t
curl -fsS https://api.tradingo.in/live
echo | openssl s_client -servername tradingo.in -connect tradingo.in:443 2>/dev/null | openssl x509 -noout -subject -dates -issuer
# expect: CN=tradingo.in, issuer=Let's Encrypt, NOT After = ~90 days
```

## 3. Auto-renewal

```bash
# test first
sudo certbot renew --dry-run
# install cron (runs at 03:00; restarts nginx container after renewal)
printf '0 3 * * * root certbot renew --quiet --post-hook "cd /home/tradingo/tradingo && docker compose --env-file .env.production.local -f docker-compose.prod.yml restart nginx"\n' \
  | sudo tee /etc/cron.d/tradingo-certbot-renew >/dev/null
```
Renewal copies the refreshed live certs into `infrastructure/nginx/ssl/` — extend the `--post-hook` with the `cp` commands from §2 if not using symlinks (preferred: keep the cert paths as the live-dir symlinks and mount those).

**Preferred simplification:** mount `/etc/letsencrypt` into nginx and point configs at the live symlink paths — then renewal needs zero copying. (Config change in Sprint 4.)

## 4. Fallback strategy

| Scenario | Action |
|---|---|
| LE rate limit / issuance failure | Re-run with `--preferred-challenges http`; check `/var/log/letsencrypt/*.log`; wait 1h for duplicate limit |
| Certbot unavailable on host | Use `certbot/certbot` Docker image with `-v /etc/letsencrypt` + port 80 publish, same commands |
| DNS not yet propagated | Do NOT issue; wait for `Resolve-DnsName` to show CF IPs (guide: DNS_CONFIGURATION_GUIDE) |
| Immediate production need before LE | Temporarily install a Cloudflare Origin Certificate (15-year, TLS Full strict works with origin certs) — still NOT self-signed |
| K8s deployment path | Create `cluster-issuer.yaml` (ClusterIssuer, letsencrypt-prod, http01) — ingress already annotated |

## 5. TLS policy (nginx)

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_stapling on; ssl_stapling_verify on;
```
(Current config has `TLSv1.2 TLSv1.3` ✅ but dated cipher string — apply the block above in Sprint 4 nginx finalization.)
