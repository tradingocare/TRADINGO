# SELLER-ONBOARDING-AUTH-FLOW.md

## Root Cause

**Problem:** Page refresh on `/seller/onboarding` caused a redirect loop to login.

**Why:** The zustand auth store (`useAuthStore`) has no persistence — on page refresh the store resets to `user: null`. The `OnboardingClient` checked `if (!user) router.push('/login')` which always fired on refresh, despite the user having a valid access token in localStorage/cookie. There was no session restoration mechanism.

**Full chain of issues found:**

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `proxy.ts:13` | `url.pathname = redirect` — entire query string encoded as pathname → `%3F` | Split redirect into `pathname` + `search` |
| 2 | `route-guard.tsx:21` | Used `redirect` param instead of `next` | Changed to `next` |
| 3 | `OnboardingClient.tsx:43` | `router.push('/login')` without `next` param | Added `?next=${encodeURIComponent('/seller/onboarding')}` |
| 4 | `login/page.tsx:56` | Always redirected to `/dashboard` after login | Reads `next` from searchParams |
| 5 | `OnboardingClient.tsx` | No session restoration on page refresh | Added token check + `/auth/me` fallback |

---

## Files Modified

### `apps/web/proxy.ts` (login URL encoding fix)
```ts
// Before
url.pathname = redirect;

// After
const [path, search] = redirect.split('?');
url.pathname = path;
url.search = search ? `?${search}` : '';
```

### `apps/web/app/seller/onboarding/OnboardingClient.tsx` (session restoration)
```ts
// Before
const { user } = useAuthStore()
useEffect(() => {
  if (!user) router.push('/login')
  else if (user.role !== 'SELLER') router.push('/')
}, [user, router])

// After
const { user, setAuth } = useAuthStore()
const [authReady, setAuthReady] = useState(false)

useEffect(() => {
  const token = getAccessToken()
  if (!token) { router.push('/login?next=...'); return }
  if (user) {
    if (user.role !== 'SELLER') router.push('/')
    else setAuthReady(true)
    return
  }
  // Token exists but store empty → restore session
  api.get('/auth/me')
    .then((r) => {
      const u = r.data?.user || r.data
      setAuth(u, token)
      if (u.role !== 'SELLER') router.push('/')
      else setAuthReady(true)
    })
    .catch(() => router.push('/login?next=...'))
}, [user, router, setAuth])
```

### `apps/web/components/auth/route-guard.tsx` (param name fix)
```ts
// Before
router.push(`/login?redirect=${encodeURIComponent(pathname)}`)

// After
router.push(`/login?next=${encodeURIComponent(pathname)}`)
```

### `apps/web/app/(auth)/login/page.tsx` (redirect after login)
```ts
// Before
router.push('/dashboard')

// After
const next = searchParams.get('next')
router.push(next && !next.startsWith('/login') ? next : '/dashboard')
```

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTH FLOW (Full Chain)                     │
└─────────────────────────────────────────────────────────────────┘

1. UNAUTHENTICATED USER
   ┌──────────────┐    proxy.ts      ┌───────────────────────┐
   │ /seller/     │ ───────────────→ │ No token cookie       │
   │ onboarding   │    (middleware)  │ → redirect getRoute   │
   └──────────────┘                  │   Decision()           │
                                     │ → redirectToLogin()    │
                                     │ → "/login?next=..."    │
                                     └───────────┬───────────┘
                                                 │
                                     ┌───────────▼───────────┐
                                     │ NextResponse.redirect  │
                                     │ url.pathname = "/login"│
                                     │ url.search = "?next=.."│
                                     └───────────┬───────────┘
                                                 │
                                     ┌───────────▼───────────┐
                                     │ /login?next=%2F        │
                                     │ seller%2Fonboarding    │
                                     │ Browser shows ✅       │
                                     └───────────┬───────────┘
                                                 │
2. USER LOGS IN
                                     ┌───────────▼───────────┐
                                     │ POST /auth/login       │
                                     │ → accessToken + user   │
                                     │ → setAccessToken()     │
                                     │   (localStorage+cookie)│
                                     │ → setAuth(user, token) │
                                     │   (zustand store)      │
                                     │ → read 'next' param    │
                                     │ → router.push(next)    │
                                     └───────────┬───────────┘
                                                 │
                                     ┌───────────▼───────────┐
                                     │ Client-side nav to     │
                                     │ /seller/onboarding     │
                                     │ (middleware does NOT   │
                                     │  run on client nav)    │
                                     └───────────┬───────────┘
                                                 │
3. ONBOARDING RENDERS
                                     ┌───────────▼───────────┐
                                     │ OnboardingClient       │
                                     │ → user from zustand ✅ │
                                     │ → authReady = true     │
                                     │ → fetch /seller/profile│
                                     │ → show UI              │
                                     └───────────────────────┘

4. PAGE REFRESH
   ┌──────────────┐    proxy.ts      ┌───────────────────────┐
   │ Refresh on   │ ───────────────→ │ Token cookie exists   │
   │ /seller/     │    (middleware)  │ → payload not null     │
   │ onboarding   │                  │ → isAuth = true        │
   └──────────────┘                  │ → no redirect          │
                                     │ → NextResponse.next()  │
                                     └───────────┬───────────┘
                                                 │
                                     ┌───────────▼───────────┐
                                     │ OnboardingClient       │
                                     │ → user: null (zustand  │
                                     │   reset on refresh)    │
                                     │ → token exists in      │
                                     │   localStorage ✅      │
                                     │ → /auth/me restores    │
                                     │   session              │
                                     │ → setAuth(user, token) │
                                     │ → authReady = true     │
                                     │ → fetch seller profile │
                                     │ → still on onboarding  │
                                     └───────────────────────┘
```

---

## Redirect Flow

```
Guest → /seller/onboarding
  → proxy.ts (no token)
    → /login?next=%2Fseller%2Fonboarding   ✅ correct encoding
      → Login form
        → POST /auth/login
          → setAccessToken() → localStorage + cookie
          → setAuth() → zustand store
          → router.push('/seller/onboarding')  ✅ reads 'next'
            → OnboardingClient
              → user in store ✅
              → authReady = true
              → fetch /seller/profile
              → render onboarding UI ✅

Refresh on /seller/onboarding
  → proxy.ts (token cookie exists)
    → NextResponse.next() ✅ no redirect
      → OnboardingClient
        → user null (zustand reset)
        → token exists (localStorage)
        → /auth/me → restore session
        → setAuth() → zustand store
        → authReady = true
        → fetch /seller/profile
        → stays on onboarding ✅ no redirect loop
```

---

## Verification Results

| Scenario | Expected | Result |
|----------|----------|--------|
| Guest visits `/seller/onboarding` | Redirect to `/login?next=...` | ✅ |
| Login URL format | `/login?next=%2Fseller%2Fonboarding` | ✅ No `%3F` |
| Login reads `next` param | Routes to `/seller/onboarding` | ✅ |
| After login → onboarding | User sees onboarding UI | ✅ |
| Refresh on onboarding | Stays on onboarding | ✅ |
| Onboarding component unmounts/remounts | Re-checks auth, same result | ✅ |
| Browser back/forward on login | Correct redirect | ✅ |
| Invalid token on refresh | Redirect to login | ✅ |
| Proxy middleware no-token redirect | `/login?next=...` with correct encoding | ✅ |
| No `/login` redirect loop | `next.startsWith('/login')` check prevents it | ✅ |
| 404 on any page | None expected | ✅ |
| Unauthorized redirect (non-SELLER) | Redirect to `/` | ✅ |

---

## Production Status

- [x] Login URL encoding fixed (proxy.ts)
- [x] `next` param correctly used across all redirectors
- [x] Session restoration on page refresh (OnboardingClient)
- [x] `authReady` guard prevents data fetch before auth is established
- [x] RouteGuard also uses `next` param
- [x] Login page reads `next` and redirects there
- [x] No redirect loop (guard against `/login` in `next`)
- [x] Console logs left in `[ONBOARDING-AUTH]` for debugging — remove after verification
- [x] No TypeScript errors in modified files
