# Sprint P0.7 — Discovery Pages Wireframe Alignment

**Status**: IMPLEMENTED + VERIFIED — awaiting Founder review
**Date**: 2026-07-31
**Scope**: Extend the founder-approved P0.4-P0.6 premium design language to the two remaining review-package listing pages: `/products` (discovery) and `/companies` (directory).

## What Was Done

### Shared Component (no duplication)
- Extracted `SectionHeading` from `PremiumProductDetailClient.tsx` (P0.6) into `apps/web/components/shared/section-heading.tsx` — identical visuals, now used by 3 clients.
- Added optional `asH1` prop (defaults to `h2` so P0.6 product detail is unchanged).

### `/products` — `components/discovery/ProductDiscoveryClient.tsx`
| Change | Detail |
|---|---|
| Breadcrumb | Replaced plain text breadcrumb with P0.6 pill style (`rounded-full border border-border bg-surface/80 px-4 py-2 text-xs backdrop-blur-md`, Home > Products & Services) |
| Section heading | Added `SectionHeading` kicker "DISCOVERY ENGINE" / title "Products & Services" as **h1** (page previously had no h1 — SEO gap fixed) |
| Error state | **New**: query `isError`/`refetch`/`isRefetching` wired — error banner (`bg-status-error/10 border-status-error/25`, AlertTriangle, message, Retry button with spinner). Previously the page had no error state. |
| Metadata | Fixed broken `�` char in `app/products/page.tsx` title → `Products & Services — TRADINGO Discovery` |

### `/companies` — `app/companies/CompanyDirectoryClient.tsx`
| Change | Detail |
|---|---|
| Breadcrumb | Added P0.6 pill breadcrumb (Home > Tradors) above hero |
| Stat labels | `text-[9px]` → `text-[10px] font-semibold` (6 hero stats) |
| Color bug | Search-count `<strong>` was `text-text-tertiary` → `text-text-primary` |

### Unchanged (already compliant)
EngineBar, NearToFarBanner, FilterSidebar, SearchBar, UnifiedCard, CompanyCard — all tokenized (CSS-var based), loading skeletons + empty states present on both pages.

## Design Rules Followed
- All surfaces `bg-surface`/`bg-bg-elevated`, borders `border-border`, typography `text-text-*` — zero new hardcoded colors
- No new components duplicated — single shared `SectionHeading`
- Loading / empty / error states on both pages ✅

## Verification Results
- `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` → 0 errors
- `next build` → ✓ Compiled successfully (40s)
- Playwright smoke (4 viewports × 2 pages): all HTTP 200, breadcrumb present everywhere, `h1` "Products & Services" on `/products`, "Find Verified Tradors" on `/companies`, **zero console errors**
- Error-state negative test: intercepted `/api/v1/search` → 500 → banner "We couldn't load results" + Retry button confirmed rendered
- Screenshots: `docs/review/P0.7-DISCOVERY-ALIGNMENT/*.png` (8 images: desktop/laptop/tablet/mobile × products/companies)

## Stop
Awaiting Founder approval (screenshots in `docs/review/P0.7-DISCOVERY-ALIGNMENT/`).
