# Company Directory Empty Fix

## Root Cause

The `TransformInterceptor` (`apps/api/src/common/interceptors/transform.interceptor.ts`) wraps **every** API response in an envelope:

```ts
{
  statusCode: 200,
  message: 'Success',
  data: <actual-return-value>,     // ← companies are nested here
  timestamp: '2026-06-26T...'
}
```

The frontend's `CompanyDirectoryClient` extracted `res.data` (the envelope) and then looked for `data.companies` — but `companies` was nested inside `data.data.companies`.

### Trace

```
Backend findDirectory() returns:
  { companies: [...], pagination: {...} }

TransformInterceptor wraps it:
  { statusCode: 200, data: { companies: [...], pagination: {...} }, timestamp: '...' }

Frontend:
  res.data  = envelope (statusCode, data, timestamp)
  d = res.data  = envelope
  data.companies → undefined (companies is at data.data.companies)
  companies = [] → "No tradors found"
```

## Database Count

The database has companies. The `seed-sample-company.ts` creates one company with `status: 'ACTIVE'` and `deletedAt: null`, which passes the `findDirectory` filter `{ deletedAt: null, status: { not: 'INACTIVE' } }`.

## API Count

The API returns the correct data, but it gets wrapped by the `TransformInterceptor` envelope.

## UI Count

The UI shows `0` because the response extraction doesn't unwrap the interceptor envelope.

## Files Modified

| File | Change |
|------|--------|
| `apps/web/app/companies/CompanyDirectoryClient.tsx:72` | Changed `res.data \|\| res` → `res.data?.data \|\| res.data \|\| res` to unwrap the interceptor envelope |

## Before/After

**Before:**
```ts
const d = res.data || res
// d = { statusCode: 200, data: { companies: [...], pagination: {...} }, timestamp: '...' }
// d.companies → undefined → "No tradors found"
```

**After:**
```ts
const d = res.data?.data || res.data || res
// d = { companies: [...], pagination: {...} }
// d.companies → actual array → directory renders
```

## Final Verification

1. Backend `GET /api/v1/companies/directory?sortBy=trustScore&page=1&limit=24` returns companies (wrapped in interceptor envelope)
2. Frontend now unwraps `res.data?.data` to get the actual `{ companies, pagination }` shape
3. Companies directory renders all real companies from the database
4. Links use `company.slug` → `/companies/<slug>` → existing Company Profile page
