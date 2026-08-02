# TRADGO Buyer Verification Foundation

## Overview

Buyer verification foundation for the TRADGO ecosystem. Provides identity verification, document upload, admin review workflow, and verification level tracking for buyer users.

## Architecture

### Database (Prisma)

**Extended models:**
- `User.verificationLevel` — `VerificationLevel` enum (LEVEL_0 through LEVEL_6), `@default(LEVEL_0)`
- `User.mobileVerifiedAt` — `DateTime?`, tracks mobile OTP verification timestamp

**New models:**
- `UserVerification` — Verification request with level, status, submitter, reviewer, documents
- `UserVerificationDocument` — Individual documents attached to a verification request

### Enums Reused
- `VerificationLevel` — reused directly (not duplicated)
- `VerificationStatus` — PENDING, APPROVED, REJECTED — reused
- `DocumentType` — PAN, GST, AADHAAR, etc. — reused

### Backend

**New module:** `apps/api/src/modules/user-verification/`

- `UserVerificationService` — submit, review, findByUser, findById, findAll (cursor-paginated)
- `UserVerificationController` — 5 endpoints under `/user-verifications`

### API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/user-verifications` | JWT | Submit verification request |
| GET | `/user-verifications` | JWT | List all (paginated) |
| GET | `/user-verifications/my` | JWT | Get own verification requests |
| GET | `/user-verifications/:id` | JWT | Get single verification |
| POST | `/user-verifications/:id/review` | JWT | Admin approve/reject |

### Frontend

**New files:**
- `apps/web/lib/api/user-verification.ts` — typed API client
- `apps/web/hooks/use-user-verification.ts` — React Query hooks
- `apps/web/app/admin/user-verification/page.tsx` — admin review queue

**Extended files:**
- `apps/web/app/buyer/settings/page.tsx` — added Account Verification card showing email/mobile/KYC status
- `apps/web/lib/api/types.ts` — added `emailVerifiedAt`, `verificationLevel` to `User` interface

## Verification Workflow

1. Buyer submits identity documents via `POST /user-verifications`
2. Admin reviews via `POST /user-verifications/:id/review`
3. On approval, `User.verificationLevel` is upgraded (only if new level > current)
4. Audit log records all status changes

## Files Modified
- `prisma/schema.prisma` — 3 new models, 1 new enum, User extended
- `apps/api/src/app.module.ts` — registered 2 new modules
- `apps/web/lib/api/types.ts` — User interface extended
- `apps/web/app/buyer/settings/page.tsx` — verification card added

## Files Created
- `apps/api/src/modules/user-verification/user-verification.module.ts`
- `apps/api/src/modules/user-verification/user-verification.controller.ts`
- `apps/api/src/modules/user-verification/user-verification.service.ts`
- `apps/api/src/modules/user-verification/dto/submit-user-verification.dto.ts`
- `apps/api/src/modules/user-verification/dto/review-user-verification.dto.ts`
- `apps/web/lib/api/user-verification.ts`
- `apps/web/hooks/use-user-verification.ts`
- `apps/web/app/admin/user-verification/page.tsx`

## Components Reused
- `VerificationLevel` enum — existing
- `VerificationStatus` enum — existing
- `StatusBadge` — for showing PENDING/APPROVED/REJECTED status
- `DashboardPageHeader` — admin page header
- `TableSkeleton` — loading state
- `useAuth` — user context for settings page
- `VerifiedBadge` — for future embedding on buyer-facing pages

## Verification Results
- prisma validate ✅
- prisma generate ✅
- tsc (api) — 0 errors ✅
- tsc (web) — 0 errors ✅
- next build — 180 routes, 0 errors ✅
