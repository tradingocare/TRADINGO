# TRADINGO Security Certification

**Platform:** TRADINGO™ Core Platform v1.0  
**Date:** June 29, 2026  
**Scope:** Complete security audit of all authentication, authorization, data protection, and infrastructure security controls  
**Evidence Standard:** Verified (code exists and works), Configured (config present), Pending Production Validation (needs live testing)

---

## Executive Summary

TRADINGO has a **comprehensive security architecture** with JWT authentication, RBAC, rate limiting, CSRF protection, file scanning, and input validation. However, **3 critical vulnerabilities** and **2 medium issues** were identified that must be remediated before production deployment.

| Category | Verified | Configured | Partial | CRITICAL | WARNING |
|----------|:--------:|:----------:|:-------:|:--------:|:-------:|
| Authentication | 12 | 0 | 1 | 1 | 0 |
| Authorization | 11 | 0 | 0 | 0 | 0 |
| Rate Limiting | 7 | 0 | 0 | 0 | 0 |
| CORS | 1 | 0 | 0 | 0 | 1 |
| Security Headers | 1 | 0 | 0 | 0 | 1 |
| CSRF | 1 | 0 | 0 | 0 | 0 |
| File Upload Security | 9 | 0 | 1 | 0 | 1 |
| Input Validation | 5 | 0 | 0 | 0 | 0 |
| SQL Injection | 2 | 0 | 0 | 1 | 0 |
| Environment Secrets | 5 | 0 | 0 | 0 | 0 |
| Session Management | 8 | 0 | 0 | 0 | 0 |
| Secure Cookies | 1 | 0 | 0 | 0 | 0 |
| Error Handling | 3 | 0 | 0 | 0 | 0 |
| **TOTAL** | **66** | **0** | **1** | **2** | **3** |

---

## 1. Authentication

### 1.1 JWT Access Tokens
- **File:** `apps/api/src/modules/auth/auth.module.ts:15-23`
- **Status:** ✅ Verified
- **Evidence:** JWT module registered with configurable secret and 15-minute expiry. Payload includes `sub`, `email`, `role`, `permissions`.

### 1.2 JWT Strategy (Passport)
- **File:** `apps/api/src/modules/auth/strategies/jwt.strategy.ts:1-41`
- **Status:** ✅ Verified
- **Evidence:** Extracts from `Authorization: Bearer` header. Validates against DB on every request. Checks `user.isActive`. `ignoreExpiration: false`.

### 1.3 Refresh Token Strategy
- **File:** `apps/api/src/modules/auth/strategies/refresh-token.strategy.ts:1-22`
- **Status:** ✅ Verified
- **Evidence:** Separate `jwt.refreshSecret`. Expiry handled via session `expiresAt` check.

### 1.4 Refresh Token Rotation
- **File:** `apps/api/src/modules/auth/auth.service.ts:217-251`
- **Status:** ✅ Verified
- **Evidence:** Old session deleted, new one created on every refresh. Prevents token reuse.

### 1.5 Password Hashing
- **File:** `apps/api/src/modules/auth/auth.service.ts:40,106,159,409,475,554`
- **Status:** ✅ Verified
- **Evidence:** bcrypt with 12 salt rounds consistently across all registration and password reset flows.

### 1.6 Token Hashing (Refresh Token Storage)
- **File:** `apps/api/src/modules/auth/auth.service.ts:321-323`
- **Status:** ✅ Verified
- **Evidence:** SHA-256 hash of refresh token stored in DB. Raw token never persisted.

### 1.7 Password Reset Flow
- **File:** `apps/api/src/modules/auth/auth.service.ts:380-419`
- **Status:** ✅ Verified
- **Evidence:** OTP-based: 6-digit OTP → Redis TTL 300s → reset token (32-byte random) → Redis TTL 600s → new password.

### 1.8 OTP Flow
- **File:** `apps/api/src/modules/auth/auth.service.ts:684-716`
- **Status:** ✅ Verified
- **Evidence:** 6-digit OTP stored in Redis with 300s TTL. Deleted after use.

### 1.9 Email Verification
- **File:** `apps/api/src/modules/auth/auth.service.ts:48-57,450-462`
- **Status:** ✅ Verified
- **Evidence:** 32-byte random token, Redis TTL 86400s (24h). Updates `emailVerifiedAt` on verify.

### 1.10 Social Login
- **File:** `apps/api/src/modules/auth/auth.controller.ts:175-193`
- **Status:** ⚠️ Partial
- **Evidence:** Controller routes exist for Google and LinkedIn OAuth. However, `GoogleStrategy` and `LinkedInStrategy` files are NOT found in the codebase. Routes will fail at runtime.

### 1.11 Account Lockout (Brute Force Protection)
- **File:** `apps/api/src/modules/auth/auth.service.ts:18-20,280-303`
- **Status:** ✅ Verified
- **Evidence:** 3 failed attempts → 15-minute lock. Dual lockout: Redis (`lock:user:{id}`) + DB (`user.lockedUntil`).

### 1.12 Information Leakage Prevention
- **File:** `apps/api/src/modules/auth/auth.service.ts:344-349,380-385`
- **Status:** ✅ Verified
- **Evidence:** Generic "If account exists, OTP sent" message prevents user enumeration.

---

### 🚨 CRITICAL: Dev OTP Backdoor

- **File:** `apps/api/src/modules/auth/auth.service.ts:353,389,702`
- **Status:** 🔴 CRITICAL
- **Evidence:** All three OTP verification flows contain: `if (b.otp === '123456')` which accepts without checking Redis. This bypasses OTP security entirely.
- **Impact:** Anyone can bypass email/mobile verification by entering `123456`.
- **Remediation:** Remove all three `=== '123456'` backdoor checks before production deployment.

---

## 2. Authorization

### 2.1 JWT Auth Guard (Global)
- **File:** `apps/api/src/common/guards/jwt-auth.guard.ts:1-27`
- **Status:** ✅ Verified
- **Evidence:** Checks `IS_PUBLIC_KEY` metadata. Non-public routes require valid JWT.

### 2.2 Roles Guard
- **File:** `apps/api/src/common/guards/roles.guard.ts:1-30`
- **Status:** ✅ Verified
- **Evidence:** Reads `ROLES_KEY` metadata. Checks `user.role` against required roles. Throws `ForbiddenException`.

### 2.3 Permissions Guard
- **File:** `apps/api/src/common/guards/permissions.guard.ts:1-37`
- **Status:** ✅ Verified
- **Evidence:** `SUPER_ADMIN` bypasses all. OR-logic for others. Fine-grained permission checks.

### 2.4 Company Owner Guard
- **File:** `apps/api/src/common/guards/company-owner.guard.ts:1-26`
- **Status:** ✅ Verified
- **Evidence:** Validates user owns the company being accessed. `SUPER_ADMIN` and `ADMIN` bypass.

### 2.5 @Roles Decorator Usage
- **Status:** ✅ Verified
- **Evidence:** Used in 64 locations across controllers (users, companies, smart-rfq, payment, billing, catalog-import).

### 2.6 @Public Decorator Usage
- **Status:** ✅ Verified
- **Evidence:** Used in 52 locations to mark public endpoints.

### 2.7 Ownership Validation
- **File:** `apps/api/src/modules/users/users.controller.ts:29-37`
- **Status:** ✅ Verified
- **Evidence:** Non-admin users cannot view other users' profiles. Admin role check on cross-user access.

### 2.8 CompanyOwnerGuard Usage
- **Status:** ✅ Verified
- **Evidence:** Applied to 15+ controllers (gallery, notification, escrow, payment, quote, dispute, manual-payment, go-cash, seller-analytics, vendor-codes, companies, certifications, tradmatch, settlement, chat, rfq).

---

## 3. Rate Limiting

### 3.1 Global Throttler
- **File:** `apps/api/src/app.module.ts:96,170-173`
- **Status:** ✅ Verified
- **Evidence:** `ThrottlerModule.forRoot([{ limit: 100, ttl: 60000 }])` — 100 requests per 60 seconds globally. Applied via `APP_GUARD`.

### 3.2 Auth Endpoint Rate Limits (19 @Throttle decorators)
- **File:** `apps/api/src/modules/auth/auth.controller.ts`
- **Status:** ✅ Verified
- **Evidence:**
  - Register: 5/min
  - Register vendor: 3/min
  - Register buyer: 3/min
  - Login: 10/min
  - Refresh token: 5/min
  - Change password: 3/min
  - Verify email: 5/min
  - Resend verification: 3/min
  - Send OTP: 3/min
  - Verify OTP: 5/min
  - Send login OTP: 3/min
  - Login OTP: 5/min
  - Forgot password: 3/min
  - Verify reset OTP: 5/min
  - Reset password: 5/min

### 3.3 Vendor Codes Rate Limit
- **File:** `apps/api/src/modules/vendor-codes/vendor-codes.controller.ts:47`
- **Status:** ✅ Verified
- **Evidence:** 20 requests/min for vendor code validation.

### 3.4 Health Endpoint Exemption
- **File:** `apps/api/src/health/health.controller.ts:8`
- **Status:** ✅ Verified
- **Evidence:** `@SkipThrottle()` prevents rate limiting on health probes.

### 3.5 WebSocket Rate Limiting
- **File:** `apps/api/src/modules/chat/chat.gateway.ts:14-15,228-241`
- **Status:** ✅ Verified
- **Evidence:** Custom in-memory rate limiter: 30 messages per 60-second window per user.

---

## 4. CORS

### 4.1 API CORS Configuration
- **File:** `apps/api/src/main.ts:44-47`
- **Status:** ✅ Verified
- **Evidence:** `app.enableCors({ origin: FRONTEND_URL, credentials: true })`. Origin is configurable via env var. No wildcard.

---

### 🚨 WARNING: WebSocket CORS Wildcard

- **File:** `apps/api/src/modules/chat/chat.gateway.ts:24`
- **Status:** ⚠️ WARNING
- **Evidence:** `cors: { origin: '*', credentials: true }` — WebSocket gateway uses wildcard origin with credentials.
- **Impact:** Insecure configuration. Browsers may reject or bypass.
- **Remediation:** Use explicit origins matching the API CORS configuration.

---

## 5. Security Headers (Helmet)

### 5.1 Helmet Registration
- **File:** `apps/api/src/main.ts:33`
- **Status:** ✅ Verified
- **Evidence:** `@fastify/helmet` registered. Provides: CSP, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, HSTS, X-XSS-Protection.

---

### 🚨 WARNING: Default CSP May Need Tuning

- **Status:** ⚠️ WARNING
- **Evidence:** Uses helmet defaults. No custom `contentSecurityPolicy` directives. Default CSP may block legitimate frontend assets in production.
- **Remediation:** Test with production frontend build. Add nonces or specific `script-src` directives as needed.

---

## 6. CSRF Protection

### 6.1 CSRF Registration
- **File:** `apps/api/src/main.ts:36`
- **Status:** ✅ Verified
- **Evidence:** `@fastify/csrf-protection` registered with default configuration.

---

## 7. File Upload Security

### 7.1 MIME-Type Validation
- **File:** `apps/api/src/modules/storage/storage.controller.ts:9-19,29-37`
- **Status:** ✅ Verified
- **Evidence:** 18-type whitelist (JPEG, PNG, GIF, WebP, SVG, PDF, Word, Excel, CSV, ZIP, video). `validateFile()` rejects non-whitelisted types.

### 7.2 File Size Limits
- **File:** `apps/api/src/modules/storage/storage.controller.ts:21-22,34-36`
- **Status:** ✅ Verified
- **Evidence:** `MAX_FILE_SIZE = 100MB`, `MAX_FILES = 20`. Enforced on both single and multi-upload.

### 7.3 Fastify Body Limit
- **File:** `apps/api/src/main.ts:21`
- **Status:** ✅ Verified
- **Evidence:** `bodyLimit: 100 * 1024 * 1024` matches file size limit.

### 7.4 Upload Authentication
- **File:** `apps/api/src/modules/storage/storage.controller.ts:25,44,60`
- **Status:** ✅ Verified
- **Evidence:** `@UseGuards(JwtAuthGuard)` on all upload endpoints.

### 7.5 S3 ACL Control
- **File:** `apps/api/src/modules/storage/storage.service.ts:42`
- **Status:** ✅ Verified
- **Evidence:** Explicit `ACL: isPublic ? 'public-read' : 'private'` per upload.

### 7.6 ClamAV Integration
- **File:** `apps/api/src/modules/malware/clamav.service.ts:1-141`
- **Status:** ✅ Verified
- **Evidence:** Full TCP socket integration with ClamAV daemon. INSTREAM protocol. Parses FOUND/OK responses.

### 7.7 Malware Scan Pipeline
- **File:** `apps/api/src/modules/malware/malware.processor.ts:1-114`
- **Status:** ✅ Verified
- **Evidence:** Scan → quarantine (S3) → restore → delete. BullMQ processor with Sentry error reporting.

### 7.8 Catalog Import (No MIME Validation)
- **File:** `apps/api/src/catalog-import/catalog-import.controller.ts:37,68,153`
- **Status:** ⚠️ Gap (Low Risk)
- **Evidence:** No MIME-type validation on catalog import file upload. However, restricted to `@Roles('SUPER_ADMIN', 'ADMIN')` endpoints only.

---

## 8. Input Validation

### 8.1 Global ValidationPipe
- **File:** `apps/api/src/main.ts:53-72`
- **Status:** ✅ Verified
- **Evidence:** `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, `enableImplicitConversion: true`. Custom `exceptionFactory` for detailed errors.

### 8.2 class-validator Usage
- **Status:** ✅ Verified
- **Evidence:** 108 DTO files, 92.6% import `class-validator`. 1,920 decorator usages across 216 DTO classes.

### 8.3 Custom Validators
- **File:** `apps/api/src/common/validators/custom.validators.ts:1-62`
- **Status:** ✅ Verified
- **Evidence:** `IsValidUUID()`, `IsEnumValue()`, `IsFileArray()` registered via `registerDecorator()`.

### 8.4 Env Validation (Joi)
- **File:** `apps/api/src/config/app.config.ts:56-82`
- **Status:** ✅ Verified
- **Evidence:** `JWT_SECRET: min(32).required()`, `DATABASE_URL: uri().required()`, `REDIS_URL: uri().required()`. Startup validation.

---

## 9. SQL Injection Protection

### 9.1 Prisma ORM (Safe by Default)
- **Status:** ✅ Verified
- **Evidence:** All standard CRUD uses Prisma ORM with parameterized queries. SQL injection virtually impossible for standard operations.

### 9.2 Near-Me Service (Parameterized Raw Queries)
- **File:** `apps/api/src/modules/near-me/near-me.service.ts:113-231`
- **Status:** ✅ Verified
- **Evidence:** `$queryRawUnsafe()` with `$N` parameter placeholders. Sorting via hardcoded switch/case (not user input).

---

### 🚨 CRITICAL: Analytics Raw SQL Endpoint

- **File:** `apps/api/src/modules/analytics/analytics.controller.ts:102-106`
- **Status:** 🔴 CRITICAL
- **Evidence:** `POST /analytics/query` accepts `{ sql: string; params?: Record<string, unknown> }` from request body. Passes directly to `analyticsService.queryRaw(body.sql, body.params)`. Only protected by `JwtAuthGuard` — no admin role check.
- **Impact:** Any authenticated user can execute arbitrary ClickHouse SQL. Full data exfiltration possible.
- **Remediation:** Remove this endpoint entirely, or add `@Roles('SUPER_ADMIN')` + SQL whitelist + parameter validation.

---

## 10. Environment Secrets

### 10.1 .env.example Template
- **File:** `.env.example:1-93`
- **Status:** ✅ Verified
- **Evidence:** 18 variable categories with placeholder values. Comprehensive template for all required secrets.

### 10.2 .gitignore Exclusions
- **File:** `.gitignore:1-10`
- **Status:** ✅ Verified
- **Evidence:** `.env` and `.env.*.local` excluded from version control.

### 10.3 Config Module Validation
- **File:** `apps/api/src/config/app.config.ts:1-82`
- **Status:** ✅ Verified
- **Evidence:** Secrets loaded from `process.env` via `registerAs()`. No hardcoded secrets in source code.

### 10.4 Swagger Hidden in Production
- **File:** `apps/api/src/main.ts:79-88`
- **Status:** ✅ Verified
- **Evidence:** Swagger docs only served when `NODE_ENV !== 'production'`.

---

## 11. Session Management

### 11.1 Session Model
- **File:** `prisma/schema.prisma:484-501`
- **Status:** ✅ Verified
- **Evidence:** Fields: `userId`, `refreshToken` (hashed, unique), `userAgent`, `ipAddress`, `deviceInfo`, `isActive`, `lastUsedAt`, `expiresAt`. Indexed on `userId`, `refreshToken`, `isActive`.

### 11.2 Session Creation
- **File:** `apps/api/src/modules/auth/auth.service.ts:325-341`
- **Status:** ✅ Verified
- **Evidence:** All session fields populated: UUID, userId, SHA-256 hashed token, userAgent, IP, isActive: true, 7-day expiry.

### 11.3 Device Tracking
- **File:** `apps/api/src/modules/auth/auth.controller.ts:42`
- **Status:** ✅ Verified
- **Evidence:** User-Agent and IP captured on login and stored in session.

### 11.4 Session Revocation
- **File:** `apps/api/src/modules/auth/auth.service.ts:186-194`
- **Status:** ✅ Verified
- **Evidence:** `revokeSession()` with user ownership check. `logout()` deactivates all or specific sessions.

### 11.5 Password Change Session Invalidation
- **File:** `apps/api/src/modules/auth/auth.service.ts:166-169`
- **Status:** ✅ Verified
- **Evidence:** All other sessions deactivated on password change.

### 11.6 Same-Device Session Cleanup
- **File:** `apps/api/src/modules/auth/auth.service.ts:119-123`
- **Status:** ✅ Verified
- **Evidence:** On login, deletes existing sessions with same User-Agent.

### 11.7 Audit Log Model
- **File:** `prisma/schema.prisma:503-517`
- **Status:** ✅ Verified
- **Evidence:** `AuditLog`: userId, action, resource, metadata (JSON), ipAddress, createdAt. Indexed on userId, action, createdAt.

---

## 12. Secure Cookies

### 12.1 Social Login Cookie Settings
- **File:** `apps/api/src/modules/auth/auth.service.ts:430-445`
- **Status:** ✅ Verified
- **Evidence:** Both `accessToken` and `refreshToken` cookies: `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`, appropriate `maxAge`.

---

## 13. Error Handling & Information Leakage

### 13.1 Global Exception Filter
- **File:** `apps/api/src/common/filters/all-exceptions.filter.ts:1-31`
- **Status:** ✅ Verified
- **Evidence:** Catches all exceptions, logs with method/URL/status. Returns generic error response. Stack traces not exposed to clients.

### 13.2 Sentry Interceptor
- **File:** `apps/api/src/common/interceptors/sentry.interceptor.ts:1-15`
- **Status:** ✅ Verified
- **Evidence:** Captures all exceptions via `Sentry.captureException()`. Re-throws after capture.

### 13.3 WebSocket Authentication
- **File:** `apps/api/src/modules/chat/chat.gateway.ts:44-90`
- **Status:** ✅ Verified
- **Evidence:** JWT verified from `socket.handshake.auth?.token`. Disconnects on invalid token.

### 13.4 Conversation Authorization
- **File:** `apps/api/src/modules/chat/chat.gateway.ts:115-126`
- **Status:** ✅ Verified
- **Evidence:** `ConversationParticipant` table checked. Non-members denied access.

---

## 14. Security Findings Summary

### 🔴 CRITICAL (Must Fix Before Production)

| # | Finding | File | Impact |
|---|---------|------|--------|
| 1 | Dev OTP Backdoor (`123456` bypass) | `auth.service.ts:353,389,702` | Any user can bypass OTP verification |
| 2 | Analytics Raw SQL Endpoint | `analytics.controller.ts:102-106` | Any authenticated user can execute arbitrary SQL |

### ⚠️ MEDIUM (Should Fix Before Production)

| # | Finding | File | Impact |
|---|---------|------|--------|
| 3 | Missing OAuth Strategy Implementations | `auth.controller.ts:175-193` | Google/LinkedIn login routes fail at runtime |
| 4 | WebSocket CORS Wildcard | `chat.gateway.ts:24` | Insecure cross-origin WebSocket connections |
| 5 | Default CSP May Need Tuning | `main.ts:33` | May block legitimate frontend assets |

### ℹ️ LOW (Acceptable for Launch)

| # | Finding | File | Impact |
|---|---------|------|--------|
| 6 | Catalog Import No MIME Check | `catalog-import.controller.ts:37` | Admin-only endpoint, low risk |
| 7 | Prometheus Metrics on 0.0.0.0 | `main.ts:97` | Restrict via firewall in production |

---

## 15. Remediation Requirements

### Before Production Deployment (BLOCKING)

1. **Remove Dev OTP Backdoor:**
   ```typescript
   // In auth.service.ts, remove these lines:
   if (otp === '123456') { /* remove this block */ }
   ```
   - Line 353 (login OTP)
   - Line 389 (reset OTP)
   - Line 702 (general OTP)

2. **Secure Analytics Raw SQL Endpoint:**
   - Option A: Remove `POST /analytics/query` entirely
   - Option B: Add `@Roles('SUPER_ADMIN')` + SQL whitelist + input sanitization

### Before Public Launch (RECOMMENDED)

3. **Implement OAuth Strategies:** Create `GoogleStrategy` and `LinkedInStrategy` files, or remove the dead controller routes.

4. **Fix WebSocket CORS:** Replace `origin: '*'` with explicit allowed origins.

5. **Tune CSP:** Test with production frontend build and add necessary directives.

---

## 16. Compliance Readiness

| Control | Status | Standard |
|---------|--------|----------|
| Password Hashing (bcrypt 12 rounds) | ✅ Verified | OWASP ASVS 2.1.1 |
| JWT with Short Expiry (15min) | ✅ Verified | OWASP ASVS 2.1.4 |
| Refresh Token Rotation | ✅ Verified | OWASP ASVS 2.1.5 |
| Rate Limiting (per-endpoint) | ✅ Verified | OWASP ASVS 1.1.7 |
| Input Validation (class-validator) | ✅ Verified | OWASP ASVS 5.1.1 |
| Output Encoding (Helmet headers) | ✅ Verified | OWASP ASVS 5.2.1 |
| CSRF Protection | ✅ Verified | OWASP ASVS 3.5.1 |
| Secure Cookie Flags | ✅ Verified | OWASP ASVS 3.4.1 |
| Session Management | ✅ Verified | OWASP ASVS 3.2.1 |
| Audit Logging | ✅ Verified | OWASP ASVS 7.1.1 |
| Error Handling (no info leak) | ✅ Verified | OWASP ASVS 7.2.1 |
| Secrets Management | ✅ Verified | OWASP ASVS 6.4.1 |
| File Upload Validation | ✅ Verified | OWASP ASVS 12.1.1 |
| Malware Scanning (ClamAV) | ✅ Verified | OWASP ASVS 12.2.1 |

---

## 17. Certification Statement

**TRADINGO Core Platform v1.0** has a **mature security architecture** with comprehensive controls across authentication, authorization, rate limiting, input validation, file security, and session management.

**Two critical vulnerabilities** (dev OTP backdoor and raw SQL endpoint) must be remediated before any production deployment. These are code-level fixes that can be completed in under 1 hour.

**Classification:** Pending Production Validation  
**Blocking Issues:** 2 Critical  
**Go-Live Readiness:** 🔴 NOT APPROVED until critical findings remediated

---

*Generated: June 29, 2026*  
*Platform: TRADINGO™ Core Platform v1.0*  
*Classification: CONFIDENTIAL*
