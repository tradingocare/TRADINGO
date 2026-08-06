# TRADINGO Security Standard

> Based on production security audit: 14 categories, 66 verified controls.

## Authentication

| Mechanism | Implementation | Status |
|-----------|---------------|--------|
| JWT Access Token | `@nestjs/jwt` + Passport strategy | ✅ |
| JWT Refresh Token | Separate strategy with rotation | ✅ |
| Google OAuth | Passport Google strategy | ✅ |
| LinkedIn OAuth | Passport LinkedIn strategy | ✅ |
| OTP-based login | Auth service with SMS delivery | ✅ |
| Password hashing | bcrypt (via NestJS) | ✅ |
| Session management | Redis-backed session store | ✅ |

## Authorization

| Mechanism | Implementation | Status |
|-----------|---------------|--------|
| RBAC | 7 roles with `RolesGuard` | ✅ |
| Permissions | `PermissionsGuard` with decorator | ✅ |
| Company isolation | `CompanyOwnerGuard` | ✅ |
| Public routes | `@Public()` decorator bypasses JWT | ✅ |
| ABAC policy | Document exists, partial implementation | ⬜ |

## API Security

| Control | Implementation | Status |
|---------|---------------|--------|
| Rate limiting | ThrottlerGuard: 100 req/60s | ✅ |
| Helmet headers | `@fastify/helmet` (CSP, HSTS, etc.) | ✅ |
| CSRF protection | `@fastify/csrf-protection` | ✅ |
| CORS | Fastify CORS with origin validation | ✅ |
| Body limit | 100MB (controlled via config) | ✅ |
| Input validation | Global ValidationPipe (whitelist + transform + forbidNonWhitelisted) | ✅ |
| SQL injection | Prisma parameterized queries (immune) | ✅ |
| XSS prevention | Helmet + input sanitization | ✅ |

## Data Protection

| Control | Implementation | Status |
|---------|---------------|--------|
| Password hashing | bcrypt (salt rounds: 12) | ✅ |
| API key encryption | AES-256-GCM with scrypt-derived key | ✅ |
| Secrets management | Environment variables (`.env`) | ✅ |
| Data encryption | At rest: RDS encryption, In transit: TLS | ✅ |
| PII handling | masked in audit logs | ✅ |
| Soft delete | 14 models with `deletedAt` | ✅ |
| GDPR compliance | User data export/deletion endpoints | ⬜ |

## Network Security

| Control | Implementation | Status |
|---------|---------------|--------|
| TLS/SSL | Load balancer termination | ✅ |
| Security headers | Helmet middleware | ✅ |
| CORS | Whitelist-based | ✅ |
| DDoS protection | Rate limiting + CloudFront | ✅ |
| WAF | AWS WAF (via CloudFront) | ✅ |

## Monitoring & Logging

| Control | Implementation | Status |
|---------|---------------|--------|
| Error tracking | Sentry (API + frontend) | ✅ |
| Audit logging | Request/response logging | ✅ |
| AI usage tracking | Per-company, per-task type | ✅ |
| Fraud detection | Wallet velocity checks, referral fraud | ✅ |
| Alerting | Prometheus Alertmanager | ✅ |

## File Upload Security

| Control | Implementation | Status |
|---------|---------------|--------|
| Malware scanning | ClamAV integration | ✅ |
| File type validation | MIME type checking | ✅ |
| File size limits | Configurable per upload type | ✅ |
| Secure storage | AWS S3 with signed URLs | ✅ |
| Scan quarantine | Infected files quarantined | ✅ |

## Compliance

| Standard | Status |
|----------|--------|
| OWASP Top 10 | Verified |
| Indian IT Act | Compliant |
| PCI DSS | Via Razorpay/Stripe (SAQ-A) |
| GDPR | Partial (no export/delete endpoints) |
| ISO 27001 | Not certified |

## Rate Limiting Configuration

```typescript
// ThrottlerModule config
[{
  limit: 100,     // 100 requests
  ttl: 60000      // per 60 seconds
}]
```

## Security Headers (Helmet)

- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=()
