# Company Directory Fix — Client-Side Filtering Pipeline

## Problem
The Companies Directory (`/companies`) shows "No tradors found" even though the API returns companies. The `filteredCompanies` step in the rendering pipeline did not exist — `companies` from the API was passed directly to render without any client-side filtering.

## Root Cause
The `verified`, `elite`, `city`, and `sellerType` filter parameters are sent to the backend but the backend **ignores** `verified`, `elite`, and `city` (they are declared as query params in the controller but never used in the service's `where` clause). The frontend had no client-side fallback to apply these filters, so if any filter was active, no filtering would occur on either side.

However, the primary cause of the "empty" state on first load is likely a **response extraction issue** or a **backend returning 0 results**. The added logging identifies which.

## Fix
Added a `filteredCompanies` pipeline using `useMemo` in `CompanyDirectoryClient.tsx`:

| Step | Filter | Logic |
|------|--------|-------|
| 1 | Search (q) | `name`, `city`, `description`, `tagline` — case-insensitive includes |
| 2 | Seller Type | `sellerType` exact match |
| 3 | Verified | `isVerified === true` |
| 4 | Elite | `isTradgoElite === true` |
| 5 | City | `city` — case-insensitive includes |
| 6 | Min Trust | `trustScore >= parseInt(minTrust)` |
| 7 | Sort | `trustScore` desc / `rating` desc / `createdAt` desc / `name` asc |

The render now uses `filteredCompanies` instead of `companies`.

## Console Logs
All existing `[COMPANY-DIR]` logs remain. Key markers:
- `res.data?.data?.companies?.length` — length if wrapped by TransformInterceptor
- `res.data?.companies?.length` — length if NOT wrapped
- `d.companies length` — final unwrapped length
- `filteredCompanies.length AFTER useMemo` — length after client-side filtering

## To Verify
1. Open `/companies` in browser
2. Check console for `[COMPANY-DIR]` logs
3. If `d.companies length > 0` but `filteredCompanies.length === 0` → client-side filter is too aggressive
4. If `d.companies length === 0` → API returns no data (check backend)
5. If `d.companies length > 0` and `filteredCompanies.length > 0` but empty state shows → render bug
