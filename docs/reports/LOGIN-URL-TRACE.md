# LOGIN-URL-TRACE.md — URL Encoding Investigation

## Symptom

When an unauthenticated user visits `/seller/onboarding`, the browser navigates to:

```
/login%3Fnext=%2Fseller%2Fonboarding    ❌ (incorrect)
```

Instead of:

```
/login?next=%2Fseller%2Fonboarding       ✅ (correct)
```

The `?` query separator is being encoded as `%3F` inside the pathname.

---

## Every File Containing Login Redirect Logic

### 1. `apps/web/proxy.ts` — **ROOT CAUSE** ⚠️
Middleware that intercepts `/seller/:path*`, `/buyer/:path*`, `/admin/:path*`, etc.

**Line 13 (before fix):**
```ts
url.pathname = redirect;
```
The `redirect` string (e.g. `/login?next=%2Fseller%2Fonboarding`) was set as the **pathname**, causing `?` to be serialized as `%3F`.

### 2. `apps/web/lib/auth/middleware-utils.ts`
Imports `redirectToLogin` and calls `getRouteDecision`. Returns `{ redirect: "/login?next=%2Fseller%2Fonboarding" }`. Used by `proxy.ts`.

### 3. `apps/web/lib/auth/redirects.ts`
`redirectToLogin` returns `\`/login?next=${encodeURIComponent(next)}\`` — **correctly encoded**.

### 4. `apps/web/components/auth/route-guard.tsx`
Client-side route guard. Uses `router.push(\`/login?next=${encodeURIComponent(pathname)}\`)` — **correct**.

### 5. `apps/web/app/seller/onboarding/OnboardingClient.tsx`
Client-side auth check. Uses `router.push(\`/login?next=${encodeURIComponent('/seller/onboarding')}\`)` — **correct**.

### 6. `apps/web/app/(auth)/login/page.tsx`
Reads `next` from searchParams and redirects there after login — **correct**.

### 7. Other files with `router.push('/login')` (no `next` param):
- `apps/web/app/companies/[slug]/CompanyProfileClient.tsx:75`
- `apps/web/components/auth/auth-provider.tsx:92`
- `apps/web/components/auth/role-guard.tsx:20` 
- `apps/web/lib/api/client.ts:58`
- `apps/web/lib/api-client.ts:94`
- Various product-card, reviews-section, qa-section, discovery components

These are user-interaction-triggered redirects (e.g. "add to cart while not logged in"), not automatic page guards. They intentionally do not include `next`.

---

## Every `encodeURIComponent` Usage in `apps/web` (excluding node_modules)

| File | Line | Usage |
|------|------|-------|
| `lib/auth/redirects.ts` | 7 | `\`/login?next=${encodeURIComponent(next)}\`` — correct (encodes only value) |
| `components/auth/route-guard.tsx` | 21 | `\`/login?next=${encodeURIComponent(pathname)}\`` — correct |
| `app/seller/onboarding/OnboardingClient.tsx` | 43 | `\`/login?next=${encodeURIComponent('/seller/onboarding')}\`` — correct |
| `app/seller/onboarding/sections/Section2Categories.tsx` | 33 | API search — not login-related |
| `app/seller/products/claim/content.tsx` | 52 | API search — not login-related |
| `components/dashboard/topbar.tsx` | 34 | Search — not login-related |
| `components/discovery/SearchBar.tsx` | 44 | API autocomplete — not login-related |
| `components/sections/IndiaHubs.tsx` | 58 | Link href — not login-related |
| `components/seller-locations/address-search-input.tsx` | 32 | Nominatim API — not login-related |

---

## Root Cause

**File:** `apps/web/proxy.ts` (compiled as middleware by Turbopack despite not being named `middleware.ts`)

**Before fix (line 11-14):**
```ts
if (redirect) {
    const url = req.nextUrl.clone();
    url.pathname = redirect;          // ← BUG: redirect is "/login?next=%2Fseller%2Fonboarding"
    return NextResponse.redirect(url);
}
```

**What happened:**
1. User visits `/seller/onboarding`
2. `proxy.ts` intercepts (matcher: `/seller/:path*`)
3. `getRouteDecision` calls `redirectToLogin('/seller/onboarding')`
4. `redirectToLogin` returns `/login?next=%2Fseller%2Fonboarding` ✅
5. **`url.pathname = '/login?next=%2Fseller%2Fonboarding'`** ❌
6. The `?` is part of the pathname, serialized as `%3F`
7. Browser URL: `/login%3Fnext=%2Fseller%2Fonboarding`

---

## File Modified

### `apps/web/proxy.ts` (lines 11-17)

**Before:**
```ts
  if (redirect) {
    const url = req.nextUrl.clone();
    url.pathname = redirect;
    return NextResponse.redirect(url);
  }
```

**After:**
```ts
  if (redirect) {
    const [path, search] = redirect.split('?');
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = search ? `?${search}` : '';
    return NextResponse.redirect(url);
  }
```

---

## Flow Verification

```
User visits /seller/onboarding
  │
  ▼
proxy.ts intercepts (matcher: "/seller/:path*")
  │
  ├─ getRouteDecision('/seller/onboarding', null)
  │   └─ redirectToLogin('/seller/onboarding', true)
  │       └─ returns "/login?next=%2Fseller%2Fonboarding"
  │
  ├─ redirect.split('?') → ['/login', 'next=%2Fseller%2Fonboarding']
  ├─ url.pathname = '/login'
  ├─ url.search = '?next=%2Fseller%2Fonboarding'
  │
  ▼
NextResponse.redirect(url)
  │
  ▼
Browser URL: /login?next=%2Fseller%2Fonboarding  ✅
  │
  ▼
Login page loads → reads 'next' param
  │
  ▼
User logs in → router.push('/seller/onboarding')
```

---

## Other Files Fixed (Earlier Session)

### `apps/web/components/auth/route-guard.tsx:21`
- Param name changed from `redirect` to `next`
- `router.push(\`/login?next=${encodeURIComponent(pathname)}\`)`

### `apps/web/app/seller/onboarding/OnboardingClient.tsx:43`
- Added `?next` param with correct encoding
- `router.push(\`/login?next=${encodeURIComponent('/seller/onboarding')}\`)`

### `apps/web/app/(auth)/login/page.tsx:57-58`
- Reads `next` from searchParams after successful login
- `router.push(next && !next.startsWith('/login') ? next : '/dashboard')`
- Includes redirect-loop guard
