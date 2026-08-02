# TRADINGO Support Handbook

## Platform Overview

TRADINGO is a B2B commerce and business services ecosystem. The platform serves four primary user roles:

| Role | Description |
|------|-------------|
| **Buyer** | Procures products and services via RFQ, quote comparison, negotiation |
| **Seller** | Lists products, responds to RFQs, fulfills orders |
| **Professional** | Offers services via TradeServ marketplace |
| **Admin** | Manages platform, users, KYC, analytics, AI infrastructure |

## User Support Categories

### Account & Authentication
| Issue | Resolution |
|-------|-----------|
| Can't register | Check email format, password requirements (8+ chars, uppercase, number) |
| Can't login | Reset password via forgot-password flow; check account lockout (3 failed attempts = 15 min cooldown) |
| Email not verified | Check spam folder; resend verification via settings |
| Mobile not verified | Check SMS delivery; resend OTP via settings |

### Buyer Issues
| Issue | Resolution |
|-------|-----------|
| Can't create RFQ | Verify company profile is complete; check category selection |
| No quotes received | Check RFQ visibility settings; try expanding category scope |
| Quote comparison not working | Ensure at least 2 quotes exist for the RFQ |
| Negotiation stuck | Verify both parties are active; check for pending counter-offers |
| Payment failed | Verify Razorpay/Stripe configuration; check payment method |

### Seller Issues
| Issue | Resolution |
|-------|-----------|
| Can't list product | Verify KYC/verification level; check category assignment |
| Product not showing in search | Check publish status; verify quality score > 30 |
| Can't respond to RFQ | Check subscription plan; verify category matches |
| AI copilot not responding | Check AI credit balance; verify AI provider keys |
| Bulk upload fails | Check CSV format (download template from /seller/bulk); check file size (< 10MB) |

### Professional (TradeServ) Issues
| Issue | Resolution |
|-------|-----------|
| Can't create profile | Complete all required fields (bio, services, portfolio) |
| Services not showing | Check verification level (LEVEL_2+ required) |
| Booking not confirmed | Check availability calendar; respond to inquiries within 48h |

### Admin Issues
| Issue | Resolution |
|-------|-----------|
| Can't access admin panel | Verify ADMIN/SUPER_ADMIN role assigned |
| Analytics not loading | Check ClickHouse connection (optional); verify Prometheus scrape targets |
| AI management not working | Verify AI provider keys are valid and have credits |
| User impersonation | Use admin panel user management (audit logged) |

## Common Error Messages

| Error | Meaning | Action |
|-------|---------|--------|
| `401 Unauthorized` | Invalid/expired JWT | Refresh token or re-login |
| `403 Forbidden` | Insufficient role | Verify user has correct role |
| `429 Too Many Requests` | Rate limited | Wait 60s (general) or 5 min (auth) |
| `402 Payment Required` | Insufficient AI credits | Upgrade plan or wait for monthly reset |
| `400 Validation Error` | Invalid input | Check field requirements |
| `503 Service Unavailable` | Dependency down | Check health endpoint; verify database/Redis |

## Escalation Path

| Level | Response Time | Handler |
|-------|---------------|---------|
| L1 | < 1 hour | Platform support team |
| L2 | < 4 hours | Engineering on-call |
| L3 | < 24 hours | Platform architect |
| Executive | < 48 hours | CTO / Founder |

## Monitoring Alerts

### Critical Alerts (Pager)
- API down > 5 minutes
- Database unreachable
- Redis unreachable
- Error rate > 5%
- P95 latency > 2s

### Warning Alerts (Slack)
- Memory usage > 80%
- Disk usage > 80%
- Queue backlog > 1000
- AI provider failure rate > 20%
- SSL certificate expiring < 30 days
