# SELLER-AUTH-LOCK.md

## Status

🟢 **LOCKED** — Do not modify without explicit auth-related task  
🟢 **VERIFIED** — All 3 steps confirmed: Guest → Login → Refresh  
🟢 **PRODUCTION READY** — Deployed and tested

---

## Locked Files

These files are **locked** and must not be modified unless a future task explicitly requires authentication changes:

| # | File | Role | Lock Reason |
|---|------|------|-------------|
| 1 | `apps/web/proxy.ts` | Server-side middleware — auth guard for all protected routes | Core auth enforcement; any change risks breaking URL encoding or redirect logic |
| 2 | `apps/web/components/auth/route-guard.tsx` | Client-side route guard with `next` param | Generic guard used across the app; must remain stable |
| 3 | `apps/web/app/(auth)/login/page.tsx` | Login form — reads `next` param, redirects there | Login entry point; any change risks breaking the redirect chain |
| 4 | `apps/web/app/seller/onboarding/OnboardingClient.tsx` | Onboarding page — session restoration + authReady guard | Core onboarding logic with race-condition guards |
| 5 | `apps/web/app/seller/onboarding/page.tsx` | Server component wrapper for OnboardingClient | Must stay thin — metadata only |
| 6 | `apps/web/components/auth/auth-provider.tsx` | Context-based auth provider | Dead code (not wired into layout). Do NOT wire in without full audit |
| 7 | `apps/web/store/auth-store.ts` | Zustand auth store | Core store used by login + onboarding. Do NOT add persistence — session is restored from token |

---

## Authentication Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      SELLER AUTH FLOW (PRODUCTION)                       │
└──────────────────────────────────────────────────────────────────────────┘

  GUEST
    │
    ▼
  /seller/onboarding
    │
    ▼
  proxy.ts [MIDDLEWARE]
    │
    ├── Token cookie exists? ────YES───► NextResponse.next()
    │                                         │
    │                                         ▼
    │                                   OnboardingClient
    │                                         │
    │                                   ┌─────┴──────┐
    │                                   │ getAccessToken()
    │                                   │ from localStorage
    │                                   └─────┬──────┘
    │                                         │
    │                                   ┌─────┴──────┐
    │                                   │ Token exists│
    │                                   │   in store? │
    │                                   └─────┬──────┘
    │                                     │       │
    │                                   YES      NO
    │                                     │       │
    │                                     ▼       ▼
    │                                 authReady  /auth/me
    │                                 = true     fetch user
    │                                     │       │
    │                                     │       ▼
    │                                     │   setAuth()
    │                                     │   in zustand
    │                                     │       │
    │                                     │       ▼
    │                                     │   authReady
    │                                     │   = true
    │                                     │       │
    │                                     └───┬───┘
    │                                         │
    │                                         ▼
    │                                   /seller/profile
    │                                   (data fetch)
    │                                         │
    │                                         ▼
    │                                   UI RENDERS
    │
    └── NO ──► NextResponse.redirect()
                   │
                   ▼
              /login?next=%2Fseller%2Fonboarding
                   │
                   ▼
              LOGIN PAGE
                   │
                   ├── POST /auth/login
                   │   ├── setAccessToken() → localStorage + cookie
                   │   ├── setCookie() → refreshToken cookie
                   │   └── setAuth() → zustand store
                   │
                   ├── read `next` from URL
                   │
                   └── router.push('/seller/onboarding')
                              │
                              ▼
                         ONBOARDING PAGE
```

---

## Redirect Flow

```
Source                  Target                          Mechanism
──────────────────────────────────────────────────────────────────────
/seller/onboarding      /login?next=%2Fseller%2Fonboarding   proxy.ts (server)
/login?next=...         /seller/onboarding                  login page (client)
/seller/onboarding      /                                   OnboardingClient (role check)
(any protected route)   /login?next={path}                  route-guard.tsx (client)
```

All redirects use `next` param with `encodeURIComponent` on the **value only** — never on the full URL.

---

## Session Flow

```
Page Load / Refresh
         │
         ▼
   proxy.ts checks cookie
         │
         ├── Cookie missing → redirect to /login?next=...
         │
         └── Cookie valid  → let request through
                                │
                                ▼
                          OnboardingClient mounts
                                │
                                ├── getAccessToken() from localStorage
                                │
                                ├── NO token  → redirect to /login?next=...
                                │
                                ├── YES token + user in store → authReady = true
                                │
                                └── YES token + NO user in store
                                       │
                                       ▼
                                  GET /auth/me
                                       │
                                   ┌───┴───┐
                                   │       │
                                 SUCCESS  FAILURE
                                   │       │
                                   ▼       ▼
                              setAuth()  redirect to
                              (zustand)  /login?next=...
                                   │
                                   ▼
                            authReady = true
```

**Key design decision:** The zustand store is intentionally NOT persisted. On every page load, the session is validated by:
1. Proxy middleware (server-side cookie check)
2. OnboardingClient (client-side token check + `/auth/me` API call)

This ensures stale sessions are never served from localStorage.

---

## Reasons for Locking

1. **Security critical** — Auth is the outermost gate. A single encoding bug (`%3F` vs `?`) broke the entire login flow.
2. **Multiple synchronized components** — proxy.ts, OnboardingClient, login page, and route-guard all work together. Changing one without understanding the others will break the chain.
3. **Race conditions are resolved** — `authReady` guard prevents `/seller/profile` from firing before auth is established. Changing this could reintroduce race conditions.
4. **Edge cases handled** — redirect loop guard, session restoration, token expiry, role mismatch.
5. **Dead code documented** — `auth-provider.tsx` exists but is NOT wired into the layout. Do not wire it in without auditing all consumers.

---

## Future Integration Guidelines

If a new feature needs authentication:

1. **Use the existing flow** — Do not create a new login page, new route guard, or new auth store.
2. **Protected routes** — Add new paths to `proxy.ts`'s `config.matcher` array. Do not modify the `proxy` function logic.
3. **Client-side guards** — Use the existing `RouteGuard` component with `allowedRoles`.
4. **Post-auth redirect** — Use the `next` query parameter convention.
5. **Token access** — Use `getAccessToken()` from `@/lib/auth` for client-side token checks.
6. **Store access** — Use `useAuthStore()` for zustand access to `user` and `isAuthenticated`.
7. **Session refresh** — Call `/auth/me` if you need fresh user data, then call `setAuth()` on the store.

### What NOT to do

- ❌ Do not add persistence (`persist` middleware) to the auth store. Session restoration is done via API call on mount.
- ❌ Do not wire `AuthProvider` into the layout without auditing all consumers for the dual-state issue (context vs zustand).
- ❌ Do not create a second login page or duplicate auth logic.
- ❌ Do not modify the `redirectToLogin` function signature — it's used by both proxy.ts and middleware-utils.ts.

---

## Verification Artifacts

| File | Description |
|------|-------------|
| `SELLER-ONBOARDING-AUTH-FLOW.md` | Full auth flow documentation |
| `LOGIN-URL-TRACE.md` | Login URL encoding investigation |
| `AGENTS.md` | Session context |

## Final Checklist

- [x] Guest → `/seller/onboarding` → `/login?next=%2Fseller%2Fonboarding` ✅
- [x] Login → redirect to `/seller/onboarding` ✅
- [x] Refresh → stays on `/seller/onboarding` ✅
- [x] No redirect loop ✅
- [x] No 404 ✅
- [x] No unauthorized redirect ✅
- [x] Console logs removed ✅
- [x] TypeScript no errors ✅
- [x] All 5 files locked 🔒
