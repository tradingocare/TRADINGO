# TRADINGO — DNS Configuration Guide

> Sprint 3 (Phase D1) · 2026-08-04. Source of truth for every DNS record.
> Zone: `tradingo.in` on **Cloudflare** (NS: `melnicoff.ns.cloudflare.com`, `rafe.ns.cloudflare.com`).

## 1. Record Inventory (current state — audited live 2026-08-04)

| Name | Type | Current value | Status |
|---|---|---|---|
| tradingo.in | A | 104.21.1.22 / 172.67.151.222 (Cloudflare proxy) | ✅ exists, proxied |
| www.tradingo.in | A | 104.21.1.22 / 172.67.151.222 (Cloudflare proxy) | ✅ exists, proxied |
| **api.tradingo.in** | A | **none — NXDOMAIN** | ❌ **MISSING (blocker B3)** |
| tradingo.in | NS | melnicoff/rafe.ns.cloudflare.com | ✅ |
| tradingo.in | MX | mx1.hostinger.com (5), mx2.hostinger.com (10) | ✅ (current email hosting) |
| tradingo.in | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | ✅ (Hostinger SPF) |
| tradingo.in | TXT | `google-site-verification=JBK1P4LZl2tuwJAvOzrkvoxvEUXXVVwf8fNlAdg7avw` | ✅ |
| _dmarc.tradingo.in | TXT | `v=DMARC1; p=none` | ✅ (policy currently none) |
| tradingo.in | CAA | none | ❌ add |

## 2. Required Records (apply at Cloudflare → DNS)

All three hostnames must point to the production VPS IP (get from founder after provisioning — **do not fabricate**). Keep **Proxied** (orange cloud) ON.

| Name | Type | Value | Proxy | TTL | Purpose |
|---|---|---|---|---|---|
| `tradingo.in` | A | `<VPS_IP>` | Proxied | Auto | Web frontend origin |
| `www.tradingo.in` | A | `<VPS_IP>` | Proxied | Auto | WWW canonical host |
| `api.tradingo.in` | A | `<VPS_IP>` | Proxied | Auto | API + WebSocket origin (JWT issuer, OAuth callbacks, CORS origin) |
| `tradingo.in` | CAA | `0 issue "letsencrypt.org"` | — | Auto | Authorizes LE cert issuance |
| `tradingo.in` | TXT | `v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all` | — | Auto | **After SES migration**: add amazonses.com to existing SPF |
| `_amazonses.tradingo.in` | TXT | SES verification value | — | Auto | **After SES**: domain identity verification (from AWS SES console) |
| `*._domainkey.tradingo.in` | CNAME | SES DKIM values (3) | — | Auto | **After SES**: DKIM signing |
| `_dmarc.tradingo.in` | TXT | `v=DMARC1; p=quarantine; rua=mailto:admin@tradingo.in` | — | Auto | **After SES**: strengthen policy |

> Email records (MX/SPF/DKIM/DMARC): keep Hostinger records until SES domain identity is verified, then extend (never remove SPF include while Hostinger mail is in use).

## 3. Propagation & verification

```powershell
Resolve-DnsName api.tradingo.in -Type A        # expect CF anycast IPs after save
nslookup api.tradingo.in 1.1.1.1               # authoritative check (Cloudflare DNS)
Resolve-DnsName tradingo.in -Type CAA          # expect issue letsencrypt.org
# SSL issuance requires: api.tradingo.in resolving + port 80/443 reachable from LE
```

## 4. Ordering rules
1. Provision VPS → 2. Point all three A records at VPS IP → 3. Verify resolution → 4. Add CAA → 5. Issue SSL (guide: `SSL_SETUP_GUIDE.md`) → 6. SES identity + email records (Sprint 7).
Do NOT issue SSL before records resolve; do NOT enable SES before DNS TXT/CNAME exists.
