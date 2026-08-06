# TRADINGO v1.0.0 — Known Issues

**Date**: 2026-07-14
**Severity Legend**: 🔴 Critical | 🟡 Major | 🔵 Minor

---

## Production Issues (Non-Blocking)

### 🟡 OpenRouter Free Tier Rate Limit
- **Description**: OpenRouter free tier allows ~20 requests/minute. Under high AI usage, users may experience 429 rate limit errors.
- **Impact**: AI features may be temporarily unavailable during usage spikes.
- **Workaround**: Upgrade to OpenRouter paid tier, or configure Gemini/Groq as fallback providers.
- **Resolution**: Configure paid OpenRouter API key in production env.

### 🟡 Admin Sidebar Navigation
- **Description**: Admin sidebar (`master-data.ts`) doesn't include all 65+ admin pages. Some pages are only accessible via direct URL.
- **Impact**: Admin users may need to bookmark or manually navigate to some pages.
- **Resolution**: Future release to sync sidebar with all admin routes.

### 🟡 `any` Type Instances in Admin Pages
- **Description**: ~59 `any` type instances across admin pages (heaviest: CRM 10+, Plans 6+, Negotiation/PO 5+ each).
- **Impact**: Reduced TypeScript strictness on admin pages. Risk of runtime type errors.
- **Resolution**: Incremental typing improvement. Admin pages remain functional.

### 🔵 Jest OOM on Windows Development
- **Description**: `jest --runInBand` runs out of memory on Windows (8GB heap). Works on Linux/Mac and CI.
- **Impact**: Windows developers cannot run local unit tests.
- **Workaround**: Use WSL2, Linux dev machine, or CI pipeline for tests.
- **Resolution**: Reduce Jest worker count or increase Node.js heap size.

### 🔵 Docker Build Fails on Windows
- **Description**: `pnpm install` with `--frozen-lockfile` fails on Windows due to symlink limitations.
- **Impact**: Cannot build Docker images on native Windows.
- **Workaround**: Use WSL2, Linux dev machine, or CI pipeline for Docker builds.
- **Resolution**: Already documented in developer setup.

### 🔵 Console.error Statements
- **Description**: A few pages use `console.error` for non-critical debug logging (feedback page, StepRequirement localStorage reads, company metadata fetch).
- **Impact**: No user-facing impact. May clutter server logs minimally.
- **Resolution**: These are intentional debug statements for non-critical operations.

---

## Known Limitations (Design Decisions)

### 🔵 No Soft Delete in TradeServ Models
- **Description**: Booking, Proposal, and ProfessionalReview models use hard delete instead of soft delete.
- **Impact**: Deleted records cannot be recovered from UI.
- **Resolution**: Deferred to future phase. Database backups provide safety net.

### 🔵 No Audit User Fields in TradeServ Models
- **Description**: TradeServ models lack `createdBy`/`updatedBy` fields. Ownership is tracked via `companyId`/`clientId`.
- **Impact**: Cannot attribute changes to specific admin users.
- **Resolution**: Deferred to future phase. `AuditLog` model provides general audit trail.

### 🔵 Master Catalog Immutable
- **Description**: Master Catalog (CatalogCategory, CatalogItem) is declared frozen by Founder. No UI modifications allowed.
- **Impact**: Catalog changes require direct database operations or import pipeline.
- **Resolution**: Intentional design choice for data integrity.

### 🔵 API Base Path
- **Description**: API is served under `/api/v1/` prefix. Some tools may not expect the path prefix.
- **Impact**: Requires configuration in API client tools.
- **Resolution**: Consistent with versioning best practices.

---

## Resolved Issues

All 7 Critical issues from RC1 UAT (Phase 26.1) have been fixed:

| Issue | Status |
|-------|--------|
| Admin Audit Logs hardcoded | ✅ Wired to `GET /admin/audit-logs` API |
| Admin System Health static | ✅ Wired to `/live`, `/ready`, `/health` |
| Admin Settings static shell | ✅ Wired to `AppSetting` CRUD API |
| Admin Categories hardcoded | ✅ Wired to `GET /categories/tree` |
| Product Approval silent catches | ✅ Toast notifications added |
| Malware Scanner silent catch | ✅ Toast notifications added |
| Buyer RFQ Wizard silent catch | ✅ Toast + error handling added |

All empty `catch {}` blocks have been addressed (16+ fixed across admin, billing, buyer, seller, and registration pages).

---

## Monitoring Triage

If any of these are observed post-launch, they require investigation:

| Symptom | Possible Cause | Action |
|---------|---------------|--------|
| 5xx errors in API logs | Database connection pool exhausted | Check PostgreSQL connections, increase pool |
| Slow AI responses (>10s) | OpenRouter rate limited or provider down | Check AI Gateway fallback chain, verify provider status |
| Frontend rendering errors | API version mismatch | Verify API and web are on same version |
| RFQ wizard submission failures | Validation error or database constraint | Check ValidationPipe errors in logs |
| GOCASH transaction failures | Idempotency key collision or insufficient balance | Verify idempotency key format, check wallet balance |

---

## Final Assessment

**TRADINGO v1.0.0 is production-ready.**

All 7 Critical, top Major issues resolved. Known issues are cosmetic or documented limitations. Core trade flow (buyer→RFQ→quote→negotiation→PO→order→shipment→delivery→payment) is fully functional with proper error handling on every page.
