# SPRINT P0.5 — Premium Company Profile

**Status**: COMPLETE — READY FOR FOUNDER REVIEW
**Date**: 2026-07-31
**Scope**: `/companies` directory + `/companies/[slug]` company profile — premium UX, real-API integrity, Next 16 params correctness

---

## 1. Executive Summary

The company profile surface (`/companies` + `/companies/[slug]`) had **three critical pre-existing defects** that made it non-functional:

1. **`/companies` (Tradors Directory) rendered a 100% mock profile page** — the untracked `app/companies/CompanyProfileClient.tsx` (512 lines) with 36 hardcoded products, 5 hardcoded suppliers, `alert()` buttons, hardcoded company "Precision Machining Tools Ltd.", and DESIGN_D violations (`bg-[#0B132B]`, `bg-slate-900`, `text-slate-*`, `bg-emerald-500`). The real directory client (`CompanyDirectoryClient.tsx`, fully API-driven + tokenized) was orphaned — imported by nothing.
2. **`/companies/[slug]` profile passed `slug=undefined` to the client** — the page used the pre-Next-15 synchronous `params` pattern, but this repo runs **Next.js 16 where `params` is a Promise**. The page therefore NEVER loaded: metadata always fell back to "Company Profile — TRADINGO" and the client always rendered "Trador not found". Every consumer of company profiles (CompanyCard → `/companies/${slug}`, product detail seller links) was broken.
3. **Hidden crash once the slug fix landed** — the profile client had a React **hooks-order violation** (two `useMemo` calls after early returns) and mapped products with `fromProductCardData` which requires a `seller` object that raw Prisma products don't include. Both crashed the Products tab. These were latent — unexercisable until the slug fix made the page actually render.

All three fixed, plus premium upgrades. **22/22 Playwright checks pass. tsc 0 errors. Build exit 0.**

---

## 2. Existing vs New Report

| Area | Before (P0.5) | After (P0.5) |
|---|---|---|
| `/companies` index | Mock profile page (512-line untracked file) | Real API-driven Tradors Directory (`CompanyDirectoryClient`), tokenized fallback |
| `/companies/[slug]` data | Never loaded (slug=undefined) → always "Trador not found" | Loads company + products + reviews + similar via 4 real endpoints |
| Metadata | Fallback title always | Real company name/description/OG from `GET /companies/:slug` |
| Product catalog | (unreachable) 12-item cap, Load More dead button | Fetch-on-demand pagination: Load More fetches next page and appends; button shown only when `fetched < total` |
| Reviews | (unreachable) 6-item cap, no pagination | Load More Reviews (page 2+ fetch-append), empty state preserved |
| Reviews CTA | `toast('Review feature coming soon!')` placeholder | Honest read-only note ("reviews come from verified purchase history") — no fake CTA (no company-review POST endpoint exists) |
| Hero | Inline `var(--bg-elevated)` + rgba border/shadow | `glass-card-xl ambient-backlight` (P0.4 pattern) |
| Error boundary | None | New `[slug]/error.tsx` with retry (platform `ErrorState` pattern) |
| Dead code | 512-line mock + `bg-[#0B132B]` fallback | Both deleted |

---

## 3. Files Modified

| File | Change |
|---|---|
| `apps/web/app/companies/page.tsx` | Restored `CompanyDirectoryClient` import + Tradors Directory metadata; tokenized `DirectoryFallback` (`bg-bg-base`, `border-t-accent`) |
| `apps/web/app/companies/[slug]/page.tsx` | **Next 16 fix**: `params: Promise<{ slug }>` awaited in `generateMetadata` and page; added `generateStaticParams() { return [] }` (mirrors `/products/[slug]` authoritative pattern) |
| `apps/web/app/companies/[slug]/CompanyProfileClient.tsx` | Hook-order fix (2 `useMemo`s moved above early returns); `fromProductCardData` → `fromEnrichedProduct` (correct raw-Product converter); product/review pagination state (`productPage/productTotal/reviewPage/reviewTotal`) + `loadMoreProducts`/`loadMoreReviews` fetch-append handlers; Load More button driven by `filteredProducts.length < productTotal`; reviews Load More; placeholder CTA → honest note; hero → `glass-card-xl ambient-backlight relative overflow-hidden` |
| `apps/web/app/companies/[slug]/error.tsx` | **New** — ErrorState boundary with retry + home link |
| `apps/web/app/companies/CompanyProfileClient.tsx` | **Deleted** — 512-line mock (untracked, unreachable after page.tsx fix) |

## 4. Components Reused (zero new)

- `CompanyDirectoryClient.tsx` — restored real directory (hero, filters, sort, grid/list, Load More append, empty state)
- `ProductCard` + `fromEnrichedProduct` — canonical card + raw-Product converter for the Products tab
- `CompanyCard` — similar tradors grid
- `VerifiedBadge` — hero verification chip
- `ErrorState` — error boundary
- `glass-card-xl` / `ambient-backlight` / `bg-surface` / `border-border` tokens — P0.4 design language
- Endpoints: `GET /companies/:slug`, `/:slug/products`, `/:slug/reviews`, `/:slug/similar`, `GET /companies/directory` — all pre-existing, zero backend changes

## 5. Pre-Existing Defects Found & Fixed (root causes)

| # | Defect | Root cause | Fix |
|---|---|---|---|
| 1 | `/companies` showed mock profile | Untracked 512-line mock wired into `page.tsx`; real directory client orphaned | Restored directory, deleted mock |
| 2 | Profile never loaded (always "Trador not found") | Next 16 async `params` — page used synchronous `params.slug` | Awaited `params` (both page + generateMetadata) |
| 3 | Products tab crash: `Cannot read properties of undefined (reading 'id')` | `fromProductCardData` requires `seller`; raw Product payload has none | `fromEnrichedProduct` |
| 4 | React "Rendered more hooks than during the previous render" | 2 `useMemo`s after `if (loading) return` / `if (!company) return` | Moved above early returns |

Note: defects 3 & 4 were **unexercisable before defect 2 was fixed** — the page never rendered past the not-found state.

## 6. Verification Results

- `tsc --noEmit -p apps/web/tsconfig.json` → **0 errors**
- `pnpm exec next build` → **exit 0**, compiled 36.4s; `/companies` ○ static, `/companies/[slug]` ● (empty static params → on-demand)
- **Playwright (22/22 PASS)**:
  - Directory: hero, 2 company cards (Test Seller Company, Test Buyer Corp), no mock content, stats
  - Profile: name, trust badge, About, Main Products (5 links), all 6 tabs, canonical cards
  - Products tab: "5 products" count, Load More correctly hidden (5 ≤ fetched 12), 15 product-card links
  - Reviews tab: empty state, honest note, no "coming soon"
  - Similar tradors: section + CompanyCard (Test Buyer Corp)
  - Not-found slug: "Trador not found" + Back to Directory
  - Regression `/products/cnc-milling-machine-5-axis`: renders (slug fix did not disturb product detail)
- Console noise: pre-existing `example.com` seed-image `/_next/image` 404s (documented in P0.4 report)

## 7. Environment Notes (this session)

- Next 16 confirmed (`apps/web/package.json` → `"next": "^16.0.0"`) — **all future dynamic pages must await `params`**.
- `next dev` started on top of a prior `next build` output returns 404 for `[slug]` routes until `.next` is deleted — if this recurs, clear `.next` before dev.
- API restarts via `node dist/main.js` in `apps/api`; health at `http://localhost:3001/live` (no `/api/v1` prefix on health).
- Test data in DB: 2 companies (`test-seller-company`, `test-buyer-corp`), 5 products under the seller, 0 reviews.

## 8. Out of Scope / Future (noting for founder)

- **Company review submission** — no POST endpoint exists (only `GET /companies/:slug/reviews`). CTA removed; if desired, a backend endpoint (e.g. `POST /companies/:slug/reviews` with verified-purchase enforcement) is a future workstream.
- **Google Maps embed** on Contact tab uses a hardcoded public demo API key (pre-existing) — consider env-var-ing it.
- `fromEnrichedProduct` leaves `seller` empty for company products (endpoint doesn't include `company` relation) — ProductCard renders without seller row; acceptable, noted for future enrichment.
