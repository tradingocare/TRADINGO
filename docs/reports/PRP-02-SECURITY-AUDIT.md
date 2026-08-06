# PRP-02 — Comprehensive Security Audit

**Date:** 2026-07-24
**Status:** COMPLETE
**Methodology:** Read-only source code analysis across 10 domains, 50+ files, ~155 controllers
**Reference:** PRP-01 Infrastructure Audit (`docs/reports/PRP-01-INFRASTRUCTURE-AUDIT.md`)

---

## Executive Summary

A comprehensive security audit of the TRADINGO codebase was performed across 10 domains: Authentication, Authorization, API Security, OWASP Top 10, Database Security, Infrastructure, Dependencies, Monitoring, AI Security, and Production Hardening.

**Overall Security Score: 52 / 100 — HIGH RISK**

The application demonstrates **strong foundational security** — Helmet with CSP/HSTS, bcrypt with 12 rounds, account lockout, webhook signature verification, 185+ validated DTOs, ValidationPipe with whitelist/forbidNonWhitelisted, malware scanning, and parameterized SQL queries. These are well-implemented.

However, **critical authorization gating gaps** undermine the entire RBAC system. The most severe finding: 18 endpoints use empty `@Roles()` decorators that bypass all role checking, allowing any authenticated user to award GOCASH credits, claim campaign rewards, and access admin functions. Combined with WebSocket expired token acceptance, CSRF disabled-by-exception, CSP with `'unsafe-inline'`, and unspecified JWT algorithm — these represent systemic failures in the auth/authz layer that require immediate remediation.

---

## Overall Security Score

| Domain | Score | Risk | Key Issues |
|--------|-------|------|-------------|
| Authentication | 40/100 | CRITICAL | WS expired tokens accepted, refresh token expiry bypass, algorithm not specified |
| Authorization | 35/100 | CRITICAL | Empty `@Roles()` on 18 endpoints, missing guards on critical controllers |
| API Security | 65/100 | HIGH | CSRF disabled, missing DTO on refresh, `@Body() any` survivors |
| OWASP Top 10 | 40/100 | CRITICAL | CSP permissive, XSS vector, CSRF bypassed, algorithm confusion risk |
| Database Security | 85/100 | LOW | Parameterized queries, no SQL injection, potential near-me risk |
| Infrastructure | 80/100 | LOW | Docker security good, nginx minor gaps, ClamAV present |
| Dependencies | 70/100 | MEDIUM | Versions current, no vulnerability scanning in CI/CD |
| Monitoring | 50/100 | HIGH | Audit logging present, no security alerting, Sentry incomplete |
| AI Security | 60/100 | MEDIUM | Prompt injection not mitigated, no output sanitization |
| Production Hardening | 45/100 | HIGH | CSP unsafe-inline, missing Permissions-Policy and Cache-Control |
| **OVERALL** | **52/100** | **HIGH** | |

---

## Findings by Severity

### 🔴 CRITICAL (9)

---

#### C-1: Empty `@Roles()` Decorator Bypasses Authorization — 18 Endpoints

**Files:**
- `apps/api/src/modules/campaign/campaign.controller.ts` lines 31, 38, 45, 59, 66, 73, 87, 143
- `apps/api/src/modules/gocash-integration/gocash-integration.controller.ts` lines 21, 29, 37, 45, 53, 61, 69, 77, 85, 92

**Description:** `@Roles()` with no arguments produces `requiredRoles = []`. The `RolesGuard` (`roles.guard.ts:14`) returns `true` when `requiredRoles.length === 0`, meaning **any authenticated user** can invoke these endpoints.

**Critical affected endpoints:**
- `POST /campaigns/claim` — any user can claim campaign rewards (GOCASH credits, refunds)
- `POST /campaigns/:id/evaluate-rules` — any user can evaluate arbitrary campaign rules
- `POST /gocash-integration/*` — all 10 reward-awarding endpoints (signup bonus, plan upgrade, order completed, RFQ created, quote accepted, negotiation completed, PO confirmed, shipment confirmed, delivery confirmed) — any user can trigger financial rewards for any company

**OWASP:** A1:2021 — Broken Access Control
**Impact:** Any authenticated user (including test/compromised accounts) can award themselves or others GOCASH credits and claim campaign rewards. Direct financial loss.
**Recommendation:** Replace every `@Roles()` with explicit roles: `@Roles('BUYER', 'SELLER', 'ADMIN')`. For gocash-integration endpoints, add company-scoped ownership checks (`CompanyOwnerGuard`).

---

#### C-2: WebSocket Gateway Accepts Expired JWTs

**File:** `apps/api/src/modules/chat/chat.gateway.ts` line 73

```typescript
this.jwtService.verify(token, { secret, ignoreExpiration: true })
```

**Description:** `ignoreExpiration: true` means tokens with expired `exp` claims are accepted. An attacker with a leaked or stolen token can establish persistent WebSocket connections indefinitely. The JWT is checked only at connect time and never re-validated during the session.

**OWASP:** A2:2021 — Broken Authentication
**Impact:** Stolen/leaked access tokens grant indefinite WebSocket access (chat, real-time notifications, potentially other WS channels).
**Recommendation:** Remove `ignoreExpiration: true`. Add periodic re-authentication (e.g., heartbeat challenge every 5 minutes). Use `clockTolerance: 30` if clock skew is a concern.

---

#### C-3: CSRF Protection Effectively Disabled (try-catch Swallows All Errors)

**File:** `apps/api/src/main.ts` lines 139, 145

```typescript
try { reply.generateCsrf?.(); } catch {}
try { fastifyApp.csrfProtection(request, reply, () => done()); } catch { done(); }
```

**Description:** Both the CSRF token generation and validation are wrapped in try-catch blocks that silently call `done()`. When combined with the `authorization` header bypass (line 143: `if (request.headers?.authorization) return done()`), **no request is ever rejected by CSRF protection**. Any CSRF validation failure is silently converted to a pass.

**OWASP:** A1:2021 — Broken Access Control
**Impact:** CSRF protection is effectively non-functional. While JWT-authenticated requests bypass CSRF (standard SPA pattern), the silent catch means even non-JWT requests (e.g., API key-authenticated, or requests with malformed auth headers) are not protected.
**Recommendation:** Remove the try-catch around `csrfProtection`. Let the framework throw proper 403 errors. Log CSRF failures instead of swallowing them.

---

#### C-4: CSP `'unsafe-inline'` on script-src Disables XSS Protection

**File:** `apps/api/src/main.ts` line 104

```typescript
scriptSrc: ["'self'", "'unsafe-inline'", "*.cloudfront.net"]
```

**Description:** `'unsafe-inline'` on `script-src` allows any inline `<script>` tag to execute. This completely nullifies CSP as an XSS mitigation. Any XSS vulnerability anywhere in the application can execute arbitrary JavaScript without CSP restriction.

**OWASP:** A3:2021 — Injection
**Impact:** CSP provides zero protection against XSS. Combined with the stored XSS vector in product descriptions (C-7), this enables full account takeover through script injection.
**Recommendation:** Remove `'unsafe-inline'` from script-src. Use nonces or hashes for legitimate inline scripts. If Next.js requires inline scripts, configure the nonce generation in Next.js middleware.

---

#### C-5: JWT Algorithm Not Specified — Algorithm Confusion Risk

**Files:**
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` line 27 — no `algorithms` option
- `apps/api/src/modules/auth/auth.module.ts` line 19 — no `algorithm` in signOptions

**Description:** Neither the JWT signing nor verification specifies `algorithms: ['HS256']`. In passport-jwt, failing to specify the expected algorithm opens the door to **algorithm confusion attacks** — an attacker who obtains a public key (for RS256) could craft tokens verified with the HS256 secret. Similarly, the `alg: 'none'` attack could be attempted if the library accepts unsigned tokens.

**OWASP:** A2:2021 — Broken Authentication, A8:2021 — Software and Data Integrity Failures
**Impact:** An attacker could forge valid JWTs with a different algorithm, gaining arbitrary user access.
**Recommendation:** Add `algorithms: ['HS256']` to JwtStrategy constructor options. Add `algorithm: 'HS256'` to the `signOptions` in `JwtModule.register()`.

---

#### C-6: Refresh Token Strategy Ignores JWT Expiration

**File:** `apps/api/src/modules/auth/strategies/refresh-token.strategy.ts` line 18

```typescript
ignoreExpiration: true
```

**Description:** The refresh token strategy uses `ignoreExpiration: true`, meaning Passport will never reject a refresh token based on its JWT `exp` claim. While `AuthService.refreshTokens()` does check `session.expiresAt < new Date()` in the database, the strategy itself passes any token — including expired ones — through to the service. This removes defense-in-depth.

**OWASP:** A2:2021 — Broken Authentication
**Impact:** A leaked refresh token remains usable even past its JWT expiration, with only the database check as protection. If the database session record is compromised or corrupted, expired tokens could be used indefinitely.
**Recommendation:** Remove `ignoreExpiration: true`. Let the JWT library handle expiration alongside the database check.

---

#### C-7: Stored XSS via Product Description Rendered with dangerouslySetInnerHTML

**File:** `apps/web/app/products/[slug]/page.tsx` line 374

```tsx
<div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
```

**Description:** `product.description` is user-generated content (entered by sellers) and is rendered as raw HTML with only `\n` → `<br/>` replacement. No HTML sanitization. A malicious seller can inject `<script>alert(1)</script>`, `<img onerror=...>`, `<iframe>`, or any arbitrary HTML. This executes in every buyer's browser viewing that product. Combined with CSP `'unsafe-inline'` (C-4), there is no CSP mitigation.

**OWASP:** A3:2021 — Injection (Stored XSS)
**Impact:** Complete account takeover of any buyer viewing the malicious product page. Session token theft, redirections, data exfiltration.
**Recommendation:** Use DOMPurify or similar HTML sanitizer: `<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description.replace(/\n/g, '<br/>')) }} />`. Consider using a Markdown renderer that doesn't allow raw HTML.

---

#### C-8: JWT Access Token Stored Without HttpOnly Flag

**Files:**
- `apps/web/components/auth/auth-provider.tsx` lines 63-64
- `apps/web/lib/auth.ts` line 11
- `apps/web/app/(auth)/login/LoginClient.tsx` line 150

**Description:** The JWT access token is stored in a browser cookie via `document.cookie`, which **cannot set the HttpOnly flag**. The token is readable by any JavaScript in the page. A single XSS vulnerability anywhere on the site enables complete token theft and account takeover.

**OWASP:** A2:2021 — Broken Authentication
**Impact:** Any XSS vulnerability (including C-7) leads to instant token theft and account takeover across the entire platform.
**Recommendation:** Set the `accessToken` cookie exclusively via the server-side API route (`apps/web/app/api/auth/set-cookie/route.ts`), which already supports `httpOnly: true`. The frontend should never set auth cookies via `document.cookie`.

---

#### C-9: Refresh Token Endpoint Lacks DTO Validation

**File:** `apps/api/src/modules/auth/auth.controller.ts` line 62

```typescript
@Body('refreshToken') refreshToken: string
```

**Description:** The refresh token endpoint uses a bare `string` parameter with zero validation. No `@IsString()`, no `@IsNotEmpty()`, no length check. The global `ValidationPipe` does not apply to individual `@Body('field')` parameters extracted via decorator — only full DTO objects are validated.

**OWASP:** A5:2021 — Security Misconfiguration
**Impact:** Malformed or malicious input passes to the service layer without validation. While an empty string will fail downstream, structured malicious payloads could trigger unexpected behavior in the token verification chain.
**Recommendation:** Create a `RefreshTokenDto` with `@IsString()` `@IsNotEmpty()` and use `@Body() dto: RefreshTokenDto`.

---

### 🟠 HIGH (12)

---

#### H-1: OAuth Social Login Auto-Creates Accounts Without Domain Restriction

**Files:**
- `apps/api/src/modules/auth/strategies/google.strategy.ts` lines 52-65
- `apps/api/src/modules/auth/strategies/linkedin.strategy.ts` lines 52-65

**Description:** Both strategies auto-create users with `role: 'BUYER'` and `isActive: true` on first login. No domain restriction (e.g., `@tradingo.com` for admins), no email domain verification beyond OAuth's own. `emailVerifiedAt` is set unconditionally on every login.

**OWASP:** A7:2021 — Identification and Authentication Failures
**Impact:** Anyone with a Google/LinkedIn account can register on the platform automatically. No identity verification beyond OAuth provider trust.
**Recommendation:** Restrict OAuth registration to verified business domains. Add rate limiting on OAuth callback. Do not auto-activate all social registrations.

---

#### H-2: Multiple Mutating Controllers Missing RolesGuard

**Files:**
- `apps/api/src/modules/products/products.controller.ts` — `POST /products`, `PATCH /products/:slug`, `DELETE /products/:slug` and 12+ other endpoints use only `JwtAuthGuard`
- `apps/api/src/modules/seller/seller.controller.ts` — `POST /seller/profile` has no RolesGuard

**Description:** 15+ product endpoints and the seller profile endpoint lack `RolesGuard`. Any authenticated user (including BUYER, VIEWER) can create/update/delete products and modify seller profiles.

**OWASP:** A1:2021 — Broken Access Control
**Impact:** Any registered user can create/manage products and seller profiles regardless of their role. Privilege escalation path.
**Recommendation:** Add `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles('SELLER', 'ADMIN')` to all mutating product and seller endpoints.

---

#### H-3: PAN/GST/IFSC Verification Endpoints Unauthenticated with Stub Responses

**Files:**
- `apps/api/src/modules/auth/auth.service.ts` lines 665-721
- `apps/api/src/modules/auth/auth.controller.ts` lines 121-143

**Description:** Three verification endpoints have no auth guard and return hardcoded mock data (`{ holderName: 'RAJESH KUMAR', verified: true }`). Comments confirm `// Dev/stub` pattern.

**OWASP:** A8:2021 — Software and Data Integrity Failures
**Impact:** Unauthenticated users can get fake verified data for PAN/GST/IFSC checks. Production KYC would rely on stub responses.
**Recommendation:** Add `@UseGuards(JwtAuthGuard)` to all three endpoints. Replace stubs with real NSDL/GST/Razorpay IFSC API integration.

---

#### H-4: Password Complexity Weakness in Vendor/Buyer Registration DTOs

**Files:**
- `apps/api/src/modules/auth/dto/create-vendor.dto.ts` line 45-47
- `apps/api/src/modules/auth/dto/create-buyer.dto.ts` line 23-26

**Description:** `RegisterDto` enforces strong passwords via `@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/)`, but both `CreateVendorDto` and `CreateBuyerDto` only have `@MinLength(8)` — no uppercase, lowercase, digit, or special character requirement. Weak passwords like `password1` are accepted.

**OWASP:** A2:2021 — Broken Authentication
**Impact:** Vendor and buyer accounts can be created with weak passwords, increasing brute-force risk for the most sensitive registration flows.
**Recommendation:** Add the same `@Matches` regex pattern from `RegisterDto` to both `CreateVendorDto.password` and `CreateBuyerDto.password`.

---

#### H-5: `@Body() body: any` Still Exists in 3+ Controllers

**Files:**
- `apps/api/src/modules/category-templates/category-templates.controller.ts` line 74
- `apps/api/src/modules/chat/chat.controller.ts` line 84
- `apps/api/src/catalog-import/catalog-import.controller.ts` lines 24, 31, 184, 190

**Description:** While 185+ DTOs exist, these endpoints use `@Body() body: any` or inline types, bypassing class-validator entirely. Global `ValidationPipe` with `whitelist: true` provides some protection but cannot validate structure on `any`.

**OWASP:** A4:2021 — Insecure Design
**Impact:** Unvalidated input passes directly to service layer. Undefined behavior on malformed payloads.
**Recommendation:** Create proper DTOs for all remaining `any` and inline-typed `@Body()` parameters.

---

#### H-6: No HTTPS Enforcement in CORS

**File:** `apps/api/src/main.ts` lines 160-163

```typescript
app.enableCors({ origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'), credentials: true })
```

**Description:** CORS allows non-HTTPS origins. `credentials: true` on non-HTTPS origins enables session cookie leakage over plain HTTP. The fallback `http://localhost:3000` is hardcoded.

**OWASP:** A5:2021 — Security Misconfiguration
**Impact:** Man-in-the-middle attacks could intercept CORS credentials if HTTP origin is used.
**Recommendation:** Add production mode check that uses HTTPS origin. Ensure `FRONTEND_URL` is validated.

---

#### H-7: No Admin IP Whitelist

**File:** N/A — missing control

**Description:** No IP whitelist/allowlist exists for any admin controller. `/admin/*` routes are protected only by `JwtAuthGuard + RolesGuard`. If a JWT is compromised, there is no network-level protection.

**OWASP:** A1:2021 — Broken Access Control
**Impact:** Compromised admin JWT provides unrestricted access from any IP/location.
**Recommendation:** Implement a middleware or guard that checks `X-Forwarded-For` against a CIDR whitelist for `/admin/*` routes.

---

#### H-8: OTP Flows Lack Per-Identifier Rate Limiting

**File:** `apps/api/src/modules/auth/auth.service.ts` lines 381-427

**Description:** OTP flows (`sendLoginOtp`, `sendResetOtp`, `sendOtp`) rely only on controller-level `@Throttle({ limit: 3, ttl: 60000 })`. The service methods do not check for existing OTP before overwriting. The verify endpoints (`loginWithOtp`, `verifyResetOtp`, `verifyOtp`) have only 5 req/min throttle — insufficient for brute-force prevention against 6-digit OTPs (900K combinations).

**OWASP:** A2:2021 — Broken Authentication
**Impact:** Attacker with rate-limit bypass can brute-force 6-digit OTPs or flood OTP generation.
**Recommendation:** Implement per-identifier Redis rate limiting (1 req/60s per phone/email). Increase OTP length or add attempt limiting (3 attempts per identifier per 5 minutes).

---

#### H-9: Multiple Critical Controllers Missing Rate Limiting

**Files:** Controllers without `@Throttle`:
- `apps/api/src/modules/billing/billing.controller.ts`
- `apps/api/src/modules/companies/companies.controller.ts`
- `apps/api/src/modules/categories/categories.controller.ts`
- `apps/api/src/modules/industries/industries.controller.ts`
- `apps/api/src/modules/escrow/escrow.controller.ts`
- `apps/api/src/modules/enterprise-catalog/controllers/global-brand.controller.ts`
- `apps/api/src/modules/enterprise-catalog/controllers/global-attribute.controller.ts`
- `apps/api/src/modules/enterprise-catalog/controllers/taxonomy.controller.ts`
- `apps/api/src/catalog-import/catalog-import.controller.ts`
- `apps/api/src/modules/tradfind/tradfind.controller.ts`

**Description:** These controllers rely on the global default of 100 req/min, which is too permissive for public-facing, data-heavy, or sensitive operations. Public endpoints for companies, categories, and industries are completely unthrottled beyond the global limit.

**OWASP:** A1:2021 — Broken Access Control
**Impact:** Data scraping, DoS attacks, and financial operation abuse possible on these controllers.
**Recommendation:** Add specific `@Throttle` decorators: public endpoints 30 req/min, write/import endpoints 10 req/min.

---

#### H-10: Refresh Token Rotation Uses `delete` Instead of Invalidation (Race Window)

**File:** `apps/api/src/modules/auth/auth.service.ts` line 245

```typescript
await prisma.session.delete({ where: { id: oldSession.id } });
```

**Description:** During `refreshTokens()`, the old session is deleted. If this operation fails (DB timeout), the old session remains active while a new token is also created. An attacker with a stolen refresh token could race the legitimate user's rotation.

**OWASP:** A2:2021 — Broken Authentication
**Impact:** Window for refresh token replay attacks.
**Recommendation:** Use two-phase approach: first mark old session as `isActive: false`, then create new session. This prevents replay without a delete dependency.

---

#### H-11: Error Responses May Leak Stack Traces

**File:** `apps/api/src/common/filters/all-exceptions.filter.ts` line 22

**Description:** The `AllExceptionsFilter` logs the full stack trace. If centralized logging (ELK, Datadog) has insufficient access control, stack traces may expose internal paths, library versions, and code structure.

**OWASP:** A5:2021 — Security Misconfiguration
**Impact:** Information disclosure via logs.
**Recommendation:** Redact stack traces in production log output. Ensure centralized logging has strict access controls.

---

#### H-12: No HTTPS Enforcement on WebSocket Connection

**File:** `apps/web/components/providers/socket-provider.tsx` line 24

**Description:** WebSocket URL defaults to `http://localhost:3001`. No WSS enforcement in production.

**OWASP:** A5:2021 — Security Misconfiguration, A2:2021 — Cryptographic Failures
**Impact:** WebSocket traffic may be transmitted unencrypted in production if not configured for WSS.
**Recommendation:** Ensure `NEXT_PUBLIC_SOCKET_URL` is validated to use `wss://` in production.

---

### 🟡 MEDIUM (10)

---

#### M-1: SentryInterceptor Does Not Sanitize Sensitive Data Before Capture

**File:** `apps/api/src/common/interceptors/sentry.interceptor.ts` line 10

**Description:** Errors are sent to Sentry without redaction. If an error contains passwords, tokens, or PII, it's transmitted to the Sentry service.

**Recommendation:** Add `beforeSend` in `Sentry.init()` to redact sensitive fields.

---

#### M-2: Swagger Enabled in Non-Production Exposes Full API Schema

**File:** `apps/api/src/main.ts` lines 199-239

**Description:** Swagger is enabled when `NODE_ENV !== 'production'`. In staging/demo environments, the full OpenAPI spec is exposed at `/api/docs`, including all endpoints, DTOs, auth schemes, and example values.

**Recommendation:** Require authentication with Swagger's `swaggerOptions`, or restrict access by IP.

---

#### M-3: Metrics Endpoint Exposes Route Labels (Full Path Enumeration)

**File:** `apps/api/src/common/interceptors/metrics.interceptor.ts` line 36

**Description:** Prometheus metrics include the full URL path as a label, enumerating all API routes including admin endpoints. Anyone with access to `/api/v1/metrics` can discover the entire API surface.

**Recommendation:** Strip sensitive path segments from Prometheus labels, or restrict metrics endpoint access.

---

#### M-4: Potential SQL Injection in Dynamic WHERE Clause Construction

**File:** `apps/api/src/modules/near-me/near-me.service.ts` lines ~230-356

**Description:** Dynamic SQL construction with string concatenation for WHERE clauses. While values are parameterized, column names and structure built from user input could allow injection.

**Recommendation:** Audit the WHERE clause construction. Use Prisma's query builder instead of raw SQL where possible.

---

#### M-5: No Concurrent Session Limits

**File:** `apps/api/src/modules/auth/auth.service.ts` line 133-134

**Description:** Unlimited sessions per user. No maximum concurrent session enforcement.

**Recommendation:** Enforce a maximum (e.g., 10) and revoke oldest on exceed.

---

#### M-6: No Dependency Vulnerability Scanning in CI/CD

**File:** `.github/workflows/*`

**Description:** None of the 5 CI/CD workflows include `pnpm audit`, dependency scanning, or Dependabot configuration.

**Recommendation:** Add `pnpm audit` to CI pipeline. Enable GitHub Dependabot.

---

#### M-7: File Uploads in CatalogImport Lack MIME/Size Validation

**File:** `apps/api/src/catalog-import/catalog-import.controller.ts` line 178

**Description:** The `uploadFile()` endpoint accepts any file type without MIME validation or size checking. While ADMIN-guarded, there is no defense-in-depth.

**Recommendation:** Add MIME type and size validation consistent with `StorageController.validateFile()`.

---

#### M-8: Login Rate Limit (10 req/min per IP) Too Permissive

**File:** `apps/api/src/modules/auth/auth.controller.ts` line 48

**Description:** 10 login attempts/minute per IP. Combined with IP rotation, a determined attacker could brute force common passwords.

**Recommendation:** Reduce to 5/min. Consider progressive delay after repeated failures.

---

#### M-9: Chat Gateway Rate Limiting Is In-Memory (Lost on Restart)

**File:** `apps/api/src/modules/chat/chat.gateway.ts` lines 37, 273-286

**Description:** In-memory `Map<string, RateLimitEntry>` resets on restart and is per-instance (not shared across replicas).

**Recommendation:** Use Redis-backed rate limiting for the chat gateway.

---

#### M-10: Product Description Stored XSS Requires DOMPurify

**File:** `apps/web/app/products/[slug]/page.tsx` line 374

**Description:** Same vector as C-7 but noting the sanitization gap specifically. DOMPurify or equivalent sanitizer must be added.

**Recommendation:** Install `isomorphic-dompurify` and sanitize all user-generated content before `dangerouslySetInnerHTML`.

---

### 🟢 LOW (12)

| # | Finding | File | Recommendation |
|---|---------|------|----------------|
| L-1 | Missing `Permissions-Policy` header | `main.ts:108-128` | Add header to restrict camera/mic/geolocation API access |
| L-2 | Missing `Cache-Control: no-store` on authenticated API | `main.ts` | Add global interceptor for authenticated responses |
| L-3 | Refresh token cookie path too broad (`/`) | `auth.service.ts:478` | Restrict to `path: '/api/v1/auth'` |
| L-4 | Missing nginx hardening (buffer sizes, rate limits) | `nginx.conf` | Add explicit buffer size limits and `limit_req_zone` |
| L-5 | Missing file validation on admin `uploadFile()` | `catalog-import.controller.ts:178` | Add MIME/size checks |
| L-6 | Password change does not blacklist access tokens | `auth.service.ts:160-180` | Add `passwordChangedAt` check in JWT strategy |
| L-7 | `resend-verification` reveals whether email is registered | `auth.service.ts:204-209` | Return generic 200 message |
| L-8 | Google OAuth callback URL defaults to localhost | `google.strategy.ts:27` | Remove default; require in production |
| L-9 | Password reset does not revoke sessions | `auth.service.ts:441-458` | Deactivate existing sessions after reset |
| L-10 | Missing `@Throttle` on onboarding/profile-completion | Various | Add 10 req/min throttle |
| L-11 | Internal hostname leaked in client JS bundle | `lib/api/client.ts:5` | Use relative path `/api/v1` as default |
| L-12 | `pino-pretty` in production dependencies | `apps/api/package.json:58` | Move to devDependencies |

---

### ✅ PASS — Verified Secure Patterns

| Pattern | Evidence |
|---------|----------|
| **ValidationPipe** — whitelist, forbidNonWhitelisted, transform | `main.ts:170-174` |
| **DTO coverage** — ~185+ DTOs with class-validator | Widespread |
| **JWT secret validation** — startup check | `main.ts:42-47` |
| **Production env validation** — Razorpay, AWS, email | `main.ts:52-94` |
| **bcrypt with 12 rounds** | `auth.service.ts:48,167,448,514,593` |
| **Account lockout** — 3 failures → 15-min lock | `auth.service.ts:22-24,288-340` |
| **Webhook signature verification** — Razorpay + Stripe | `payment-webhook.controller.ts:29,65` |
| **Webhook idempotency** — duplicate event detection | `payment-webhook.controller.ts:42-44,78-80` |
| **Razorpay mode guard** — live/test key enforcement | `razorpay.service.ts:17-22` |
| **HTTP-only cookies** for auth tokens (server-side) | `auth.service.ts:470-484` |
| **Helmet** — HSTS, frameguard, noSniff, xssFilter, referrerPolicy | `main.ts:108-128` |
| **HSTS with preload** — 1 year, includeSubDomains, preload | `main.ts:123` |
| **API key vault** — AES-256-GCM authenticated encryption | `api-key-vault.service.ts` |
| **CompanyOwnerGuard** — company ownership verification | `company-owner.guard.ts` |
| **Audit logging** — login failures, escrow/settlement, bookings | Throughout |
| **ClamAV malware scanning** — file upload pipeline | `malware.processor.ts` |
| **Nginx server_tokens off** — version hidden | `nginx.conf:26` |
| **TLS 1.2 + 1.3 only** — no SSLv3/TLSv1.0/TLSv1.1 | `tradingo.conf:13` |
| **No SQL injection** — all raw queries parameterized | Verified across 5 `$queryRawUnsafe` calls |
| **No SSRF vectors** — user-provided URLs not fetched by server | Verified |
| **Graceful shutdown** — SIGTERM/SIGINT handling | `main.ts:264-273` |

---

## OWASP Top 10 Mapping

| OWASP Category | Affected Findings | Risk |
|----------------|-------------------|------|
| **A1:2021 — Broken Access Control** | C-1, C-3, H-2, H-7, H-9, M-5 | CRITICAL |
| **A2:2021 — Cryptographic Failures** | C-2, C-5, C-6, C-8, H-1, H-4, H-8, H-10, H-12 | CRITICAL |
| **A3:2021 — Injection** | C-4, C-7, M-4, M-10 | CRITICAL |
| **A4:2021 — Insecure Design** | H-5 | HIGH |
| **A5:2021 — Security Misconfiguration** | C-9, H-6, H-11, H-12, M-2, M-3 | HIGH |
| **A6:2021 — Vulnerable Components** | M-6 | MEDIUM |
| **A7:2021 — Identification and Auth Failures** | H-1 | HIGH |
| **A8:2021 — Software and Data Integrity** | C-5, H-3 | CRITICAL |
| **A9:2021 — Security Logging & Monitoring** | H-11, M-1 | HIGH |
| **A10:2021 — SSRF** | Not found | PASS |

---

## Files Reviewed

| Domain | Files |
|--------|-------|
| Authentication | `auth.service.ts`, `auth.controller.ts`, `auth.module.ts`, `jwt.strategy.ts`, `refresh-token.strategy.ts`, `google.strategy.ts`, `linkedin.strategy.ts`, `app.config.ts`, `dto/*` |
| Authorization | `roles.guard.ts`, `jwt-auth.guard.ts`, `company-owner.guard.ts`, all controllers with `@Roles`/`@UseGuards` patterns |
| API Security | `main.ts`, `all-exceptions.filter.ts`, `validation.pipe.ts`, `metrics.interceptor.ts`, `sentry.interceptor.ts`, `transform.interceptor.ts`, `logging.interceptor.ts` |
| OWASP | `csp.config.ts`, `csrf.config.ts`, `helmet.config.ts`, `upload.config.ts`, `malware.processor.ts`, `storage.controller.ts`, `catalog-import.controller.ts` |
| Database | `prisma/schema.prisma`, all `$queryRaw`/`$executeRaw` call sites (5 files) |
| Infrastructure | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`, `nginx.conf`, `tradingo.conf`, `ecs/*.json` |
| Dependencies | `package.json`, `apps/api/package.json`, `apps/web/package.json`, `pnpm-lock.yaml` |
| Monitoring | `logger.ts`, `audit.log.service.ts`, `sentry.config.ts`, health controllers |
| AI Security | `ai-gateway.service.ts`, `ai-gateway.controller.ts`, `ai-credits.service.ts`, all AI service callers |
| Production Hardening | `main.ts` (Helmet/CORS/CSRF), `auth-provider.tsx`, `auth.service.ts` (cookies), `socket-provider.tsx` |

---

## Security Gaps Summary

### Gaps Requiring Immediate Remediation

1. **Authorization gating system** — Empty `@Roles()` decorator breaks RBAC for 18 endpoints. Fix: add explicit roles or a compile-time lint rule that forbids empty `@Roles()`.

2. **Authentication hardening** — WebSocket + refresh token + algorithm confusion all allow token abuse. Fix: remove `ignoreExpiration: true` from both WS and refresh strategies; specify `algorithms: ['HS256']`.

3. **XSS chain** — CSP with `'unsafe-inline'` + stored XSS in product descriptions + non-HttpOnly cookies = complete account takeover. Fix: sanitize product descriptions, remove `'unsafe-inline'` from CSP, move token storage to server-side cookies.

4. **CSRF protection** — try-catch swallows all CSRF errors. Fix: remove try-catch; log failures instead.

5. **Rate limiting coverage** — 10+ controllers lack `@Throttle`. Fix: add per-controller rate limits.

### Gaps Requiring Architectural Changes

6. **Admin IP whitelist** — No network-level protection. Requires middleware or edge proxy configuration.

7. **JWT token blacklisting** — No way to revoke access tokens before expiry. Requires Redis token blacklist.

8. **Security alerting** — No automated alerting on brute force detection, unusual access patterns, or auth anomalies.

9. **Dependency vulnerability scanning** — No automated CVE detection in CI/CD pipeline.

10. **Prompt injection mitigation** — AI prompts include user input without sanitization.

---

## Recommended Remediation Order

| Priority | Findings | Effort | Impact |
|----------|----------|--------|--------|
| **P0 — Immediate** | C-1 (empty @Roles), C-4 (CSP unsafe-inline), C-7 (stored XSS) | 2-4 hours | Prevents financial loss and account takeover |
| **P0 — Immediate** | C-8 (non-HttpOnly cookies), C-2 (WS expired tokens) | 2-3 hours | Prevents token theft |
| **P1 — Today** | C-5 (JWT algorithm), C-6 (refresh expiry), C-3 (CSRF) | 1-2 hours | Closes authentication bypasses |
| **P1 — Today** | H-2 (missing RolesGuard), H-8 (OTP rate limiting) | 2-4 hours | Closes privilege escalation paths |
| **P2 — This sprint** | H-1 (OAuth auto-create), H-4 (password complexity), H-5 (@Body any) | 3-5 hours | Hardens registration and validation |
| **P2 — This sprint** | H-3 (PAN/GST stubs), H-9 (missing rate limiting) | 4-6 hours | Removes stub data and adds throttling |
| **P3 — Next sprint** | H-6 (HTTPS CORS), H-7 (admin IP whitelist), H-10 (token rotation) | 4-8 hours | Defense-in-depth improvements |
| **P3 — Next sprint** | M-1 through M-10 | 8-16 hours | Medium-priority hardening |
| **P4 — Backlog** | All LOW findings | 4-8 hours | Non-critical improvements |

---

## Deployment Impact

- **None of the findings block deployment** — the application is functional and deployed.
- **However, deploying without remediating C-1, C-4, C-7, and C-8 exposes the platform to:**
  - Unauthorized GOCASH credit manipulation (direct financial loss)
  - Account takeover via stored XSS + non-HttpOnly cookies + permissive CSP
  - Token forgery via algorithm confusion
- **Application-level changes only** — no infrastructure, schema, or deployment pipeline changes required for any finding.

---

## Go / No-Go Recommendation

**NO-GO** for production launch without remediating the following Critical findings:

| # | Finding | Rationale |
|---|---------|-----------|
| C-1 | Empty `@Roles()` on 18 endpoints | Any authenticated user can award GOCASH credits — direct financial loss |
| C-4 | CSP `unsafe-inline` | Zero XSS protection |
| C-7 | Stored XSS in product descriptions | Complete account takeover |
| C-8 | Non-HttpOnly JWT cookies | Token theft from any XSS |
| C-5 | JWT algorithm not specified | Token forgery |

**Conditional GO** if above 5 findings are remediated and verified.

---

## Verification Command

```
pnpm typecheck && pnpm --filter @tradingo/api exec prisma validate && pnpm --filter @tradingo/api build && pnpm --filter @tradingo/web typecheck
```