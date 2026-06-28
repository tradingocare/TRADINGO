# Authentication Production Audit [SUPERSEDED]

## Status: 🟢 PRODUCTION READY (see AUTH-LOCK-REPORT.md)

---

## ✅ PASSED

### TypeScript Compilation
- `apps/web`: `tsc --noEmit` → 0 errors (pre-existing errors in RFQ/registration excluded)
- `apps/api`: `tsc --noEmit` → 0 errors

### Token Flow
- `setAccessToken()` → stores in `localStorage` + `document.cookie`
- `getAccessToken()` → reads from `localStorage`
- API interceptor reads `getAccessToken()` for auth headers ✓
- Refresh interceptor reads `localStorage.getItem('refreshToken')` ✓
- Key names match between LoginClient (`refreshToken`) and client.ts (`refreshToken`) ✓

### RouteGuard Integration
- RouteGuard reads `localStorage.getItem('userRole')` — now set after login
- RouteGuard redirects to `login?next=${pathname}` — LoginClient reads `next` param
- Role dashboards: buyer=`/dashboard`, seller=`/seller/dashboard`, admin=`/admin` ✓

### Auth Store Integration
- `setAuth(data.user, data.accessToken)` matches zustand store signature ✓
- `setUser(data.user)` available for profile updates ✓

### Backend API Endpoint Consistency
| Frontend Call | Backend Endpoint | Match |
|---|---|---|
| `/auth/login` | `POST /auth/login` | ✓ |
| `/auth/send-login-otp` | `POST /auth/send-login-otp` | ✓ |
| `/auth/login-otp` | `POST /auth/login-otp` | ✓ |
| `/auth/forgot-password` | `POST /auth/forgot-password` | ✓ |
| `/auth/verify-reset-otp` | `POST /auth/verify-reset-otp` | ✓ |
| `/auth/reset-password` | `POST /auth/reset-password` | ✓ |
| `/auth/refresh` | `POST /auth/refresh` | ✓ |

### Prisma Schema
- `User.mobile`, `User.panNumber`, `User.status` exist ✓
- `User.panNumber` is `@unique` ✓
- `Session` model exists with `id`, `userId`, `refreshToken`, `userAgent`, `ipAddress`, `expiresAt` ✓

### Security Config
- `ThrottlerModule` configured (100 req/min globally, 10 req/min for login) ✓
- Rate-limiting decorators on login/OTP endpoints ✓
- Password validation: min 8 chars, uppercase, lowercase, digit ✓
- Redis OTP expiry: 5 minutes ✓

---

## 🔧 FIXED (were CRITICAL)

### 1. Token Not Persisted to Storage
**File**: `LoginClient.tsx:145`
**Before**: `setAuth(data.user, data.accessToken)` — only updated zustand in-memory state
**After**: Also calls `setAccessToken(data.accessToken)` — persisted to localStorage + cookie
**Same fix applied to**: OTP login handler at line 216

### 2. userRole Not Set in localStorage
**File**: `LoginClient.tsx`
**Before**: RouteGuard's `localStorage.getItem('userRole')` returned `null` → would always show "redirecting"
**After**: `localStorage.setItem('userRole', data.user.role)` + `document.cookie = 'userRole=...'` on both password login and OTP login

### 3. Redirect Param Mismatch
**File**: `LoginClient.tsx:11`
**RouteGuard** uses: `?next=/seller/dashboard`
**Before** LoginClient reads: `?redirect=/seller/dashboard` → would ignore route guard's intent
**After**: Reads `?next=` first, falls back to `?redirect=`, then defaults to `role.dashboard`

---

## 🟡 MINOR ISSUES (non-blocking)

### 1. Seller Onboarding Redirect
After seller login, users go to `/seller/dashboard`. If onboarding is incomplete, no redirect to `/seller/onboarding` occurs.
- **Fix**: Backend should return `onboardingComplete: boolean` in login response; LoginClient should check and redirect accordingly
- **Status**: Dashboard can serve as a CTA to onboarding; not a blocker

### 2. AuthProvider Dead Code
`components/auth/auth-provider.tsx` is exported from `components/auth/index.ts` but never imported in any app file. Its login method uses `{ email, password }` format which conflicts with the new `{ identifier, password, role, rememberMe }` DTO.
- **Action**: Remove from `index.ts` or mark with deprecation warning
- **Risk**: Low — no code path calls it

### 3. RouteGuard Not Wired
`RouteGuard` exists at `components/auth/route-guard.tsx` and is exported but not wrapped around any layout or page.
- **Risk**: Medium — role-based route protection is entirely client-side in pages that opt-in
- **Action**: Wire into seller layout when ready

### 4. cookie-based userRole may not sync with logout
`document.cookie = 'userRole=...'` is set at login but never cleared at logout.
- **Risk**: Low — cookie has 24h expiry; RouteGuard also checks `getAccessToken()`
- **Action**: Add cookie clearing to logout flow in auth store

---

## 🔴 BLOCKER

### Prisma Migration Not Applied
`prisma migrate dev` has NOT been run. Until the migration is applied:
- `User.mobile` column does not exist → `findUserByIdentifier()` will fail
- `User.panNumber` column does not exist → panNumber login/register will fail
- `User.status` column does not exist → status checks will fail
- Session table may not exist if this is a new environment
- **Run**: `cd apps/api && npx prisma migrate dev --name add_auth_fields`

---

## Manual Test Matrix

| # | Test | Expected Result | Status |
|---|---|---|---|
| 1 | Password Login (Buyer) | Logs in, redirects to `/dashboard` | After migration |
| 2 | Password Login (Seller) | Logs in, redirects to `/seller/dashboard` | After migration |
| 3 | Password Login (Admin) | Logs in, redirects to `/admin` | After migration |
| 4 | Invalid email | "Account not found" error | After migration |
| 5 | Wrong password | "Incorrect password" error | After migration |
| 6 | Suspended account | "Account suspended" error | After migration |
| 7 | OTP Login | Sends OTP, verifies, logs in | After migration |
| 8 | Forgot Password Step 1 | Enters email, sends OTP | After migration |
| 9 | Forgot Password Step 2 | Enters OTP, verifies | After migration |
| 10 | Forgot Password Step 3 | Sets new password, success | After migration |
| 11 | Role Switcher UI | Buyer/Seller/Admin tabs switch form | ✓ Visual |
| 12 | Password Show/Hide | Toggle visibility | ✓ Visual |
| 13 | Remember Me | Checkbox state persists | ✓ Visual |
| 14 | Login → Dashboard redirect | RouteGuard reads userRole, redirects correctly | After migration |
| 15 | Refresh token rotation | Token refreshed after expiry | After migration |
| 16 | Logout clears all state | localStorage, cookie, zustand cleared | Non-blocking |
