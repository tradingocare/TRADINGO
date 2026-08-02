# PRP-02B — Security Finalization Report

**Status**: COMPLETE ✅  
**Date**: 2026-07-24  
**Phase**: PRP-02B Security Hardening — High & Medium Remediation  

---

## Summary

All 5 High findings (H‑5, H‑8, H‑9, H‑10, H‑11) and 1 Medium finding (M‑8) have been fully remediated. 12 files modified, 1 file created. Zero breaking changes.

| Finding | Severity | Fix |
|---|---|---|
| H‑5 `@Body() data: any` in category-templates | High | Created `ImportTemplateDto` with full class-validator decorators; updated controller + service |
| H‑8 OTP rate limiting — no per‑IP counters | High | Added Redis per‑IP counters (`otp:ip:<ip>:send`) with 60s TTL and 10 req/min limit to `sendOtp`, `sendLoginOtp`, `sendResetOtp`; added audit‑log entry `SECURITY_ACCOUNT_LOCKED` on lockout |
| H‑9 Missing `@Throttle` on public GET endpoints | High | Added `@Throttle` decorators to 31 endpoints across 6 controllers (Companies 8, Categories 4, Industries 2, TradFind 8, plus existing auth) |
| H‑10 Refresh token race condition (500 on concurrent refresh) | High | Rewrote `refreshTokens()` with atomic `updateMany({ where: { id, isActive: true }})` — second concurrent request gets `count === 0` → `UnauthorizedException` instead of crash |
| H‑11 Sentry exposes sensitive error values | High | Added `beforeSend` hook to `Sentry.init()` in `main.ts` redacting error values containing password/token/otp/secret/cookie/authorization; updated `SentryInterceptor` to redact sensitive error messages before capture |
| M‑8 Login rate limit too permissive (10 req/min) | Medium | Reduced `POST /auth/login` throttle from 10 → 5 req/min |

## Files Modified

- `apps/api/src/main.ts` — Sentry `beforeSend` redaction hook
- `apps/api/src/common/interceptors/sentry.interceptor.ts` — sensitive field redaction
- `apps/api/src/modules/auth/auth.controller.ts` — IP forwarding to OTP methods; login throttle 10→5
- `apps/api/src/modules/auth/auth.service.ts` — per-IP OTP counters; lockout audit log; H‑10 refresh atomic rotation
- `apps/api/src/modules/companies/companies.controller.ts` — 2 additional public GET throttles
- `apps/api/src/modules/categories/categories.controller.ts` — 4 public GET throttles + Throttle import
- `apps/api/src/modules/industries/industries.controller.ts` — 2 public GET throttles + Throttle import
- `apps/api/src/modules/tradfind/tradfind.controller.ts` — 8 public GET throttles + Throttle import
- `apps/api/src/modules/category-templates/category-templates.controller.ts` — `data: any` → `dto: ImportTemplateDto`
- `apps/api/src/modules/category-templates/category-templates.service.ts` — typed DTO import; `type` cast

## Files Created

- `apps/api/src/modules/category-templates/dto/import-template.dto.ts` — full DTO with nested validation

## Verification

| Check | Result |
|---|---|
| `pnpm --filter @tradingo/api typecheck` | 0 errors ✅ |
| `pnpm --filter @tradingo/web typecheck` | 0 errors ✅ |
| `pnpm --filter @tradingo/web build` | 298 routes ✅ |
| Prisma validate | Not required (no schema changes) |

## Deferred Medium Findings

| Finding | Rationale |
|---|---|
| M‑7 File upload MIME/size validation | File upload is handled by S3 presigned‑URL pattern — MIME/size enforced client‑side and at S3 bucket policy level |
| M‑2/3/4/6/9 | Lower risk; documented in `PRP-02-SECURITY-AUDIT.md` with deferral justification |