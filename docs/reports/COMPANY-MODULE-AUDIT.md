# Company Module — Enterprise Audit Report

**Date:** 2026-07-30
**Scope:** Backend API, Frontend Pages, Components, Hooks, Types, Prisma Schema, Design System
**Status:** ⚠️ PASS WITH CONDITIONS (Score: 5.5/10)

---

## Overall Score: 5.5/10

| Domain | Score | Notes |
|--------|-------|-------|
| Profile Header/Cover/Logo | 7/10 | Good layout, minor token issues |
| Business Info | 6/10 | Content-rich but class bugs break rendering |
| Verification/Certs | 4/10 | No consolidated trust section, hardcoded colors |
| Overview/About | 6/10 | Present but class bugs |
| Trust (TradTrust/GST/PAN/IEC/MSME/ISO) | 3/10 | No IEC/MSME/ISO fields; no trust consolidation |
| Products | 6/10 | Functional, minor issues |
| Buyer Experience (RFQ/Contact/Follow/Share/Save) | 4/10 | Save is client-only, no follow, share untracked |
| Responsive | 7/10 | Grid and responsive classes present |
| Performance | 6/10 | All-in-one fetch pattern, no streaming |
| Accessibility | 4/10 | aria-labels present but alt text weak |
| Design System | 3/10 | ~40+ hardcoded colors, invalid class patterns |
| Architecture | 6/10 | Solid backend, misaligned frontend types, dead endpoints |

---

## 1. Existing Strengths

### Backend
- **Full CRUD** with proper guards (JwtAuthGuard, RolesGuard, CompanyOwnerGuard)
- **20 endpoints** covering directory, search, products, reviews, similar, owners, rankings, RM, subscriptions
- **OpenSearch integration** with graceful DB fallback on all search paths
- **Audit logging** on create/update/delete/owner/RM operations
- **Soft delete** pattern (`deletedAt: null`) consistent across all queries
- **Rate limiting** on every public endpoint
- **12 Prisma indexes** on Company model
- **Profile completion service** integration
- **Onboarding advancement** on company create and subscription activate

### Frontend
- **CompanyCard** — Rich animated card with banner, logo, trust bar, ratings, verified badge, BestScore
- **CompanyCardSkeleton** — Proper shimmer skeleton with good visual feedback
- **Directory page** — Search, filters, sort, grid/list toggle, pagination, empty/error states
- **Profile page** — 7-tab layout, breadcrumbs, cover/logo, stat badges, similar companies
- **Loading states** — Every page has a loading spinner
- **Error states** — "Not found" and error states present
- **AnimatePresence** — Smooth tab transitions in profile

### API Layer
- **useCompanies hook** — React Query with caching/invalidation
- **Companies API** — Typed functions for basic operations

---

## 2. Critical Issues (Fix Immediately)

### C-1: `bg-surface`/`border-border` Outside className Strings — Systemic Bug
**File:** `CompanyProfileClient.tsx`
**Severity:** 🔴 CRITICAL
**Count:** 30+ instances
**Details:** Throughout the file, Tailwind classes like `bg-surface`, `border-border`, `text-text-tertiary` are placed as separate JSX attributes instead of inside the `className` string. For example:

```tsx
// Line 234-235 — WRONG
<span className="text-text-primary/35 text-xs capitalize px-2 py-0.5 rounded-full"
  bg-surface border-border>

// Line 249-250 — WRONG
<span key={cat} className="text-[9px] px-2 py-0.5 rounded-full"
  bg-surface border-border text-text-tertiary>

// Line 317, 328, 342, 360, 382, 398, 418, 442, 584, 605 — and many more
<div className="rounded-2xl p-5"
  bg-surface border-border>
```

These classes render as unknown HTML attributes — ALL background, border, and text styling is silently lost on these elements. This is the #1 visual bug making the profile page look broken.

### C-2: Company TypeScript Interface Mismatch
**Files:** `lib/api/types.ts:13` ↔ `CompanyProfileClient.tsx`
**Severity:** 🔴 CRITICAL
**Details:** The frontend `Company` interface has only 12 fields (`id, name, ownerId, type, gst, phone, address, city, state, status, verificationStatus, createdAt`). The `CompanyProfileClient.tsx` accesses 40+ fields (`businessType`, `establishedYear`, `trustScore`, `verificationLevel`, `locations`, `categories`, `certificationDocs`, `gstNumber`, `panNumber`, `exportMarkets`, `industries`, `businessHours`, `socialLinks`, `infrastructure`, `cataloguesUrl`, `galleryImages`, `factoryImages`, `videos`, `images`, `onTimeDelivery`, `orderCount`, etc. — all typed as `any`.

### C-3: `useCompany(id)` / `getCompany(id)` Calls Wrong Endpoint
**Files:** `use-companies.ts:12`, `companies.ts:16`
**Severity:** 🔴 CRITICAL
**Details:** `getCompany(id)` calls `GET /companies/:id` but the backend has `@Get(':slug') findBySlug(slug)` which does `findFirst({ where: { slug } })`. A UUID will never match a slug. There's no `@Get(':id')` endpoint for ID-based lookup on the controller. Frontend always gets 404 from this hook.

---

## 3. High Issues (Fix in This Sprint)

### H-1: No Trust & Verification Section
**Files:** `CompanyProfileClient.tsx` (all tabs)
**Severity:** 🟠 HIGH
**Details:** There's no consolidated trust/verification section showing:
- TradTrust score breakdown (6 dimensions)
- Verification level badge
- GST verification status
- PAN verification
- IEC number
- MSME registration
- ISO certifications
- Other certs
Currently, these are scattered across overview (sidebar card), certificates (separate tab), and certifications (overview card). No centralized trust dashboard.

### H-2: ~40+ Hardcoded Colors
**Files:** `CompanyCard.tsx` (15+), `CompanyProfileClient.tsx` (25+)
**Severity:** 🟠 HIGH
**Details:**
- `CompanyCard.tsx`: `#FF4D00`, `#9B5DE5`, `#3D8BFF`, `#2DE0E0`, `#F15BB5` (GLOW_COLORS), `#F2C94C`, `#4ade80`, `#22c55e`, `#f59e0b`, `#f87171`, `#ef4444`, `rgba(242,201,76,0.2)`, `rgba(10,14,26,1)`, `rgba(0,0,0,0.5)`
- `CompanyProfileClient.tsx`: `#FF4D00`, `#F2C94C`, `#2DE0E0`, `#9B5DE5`, `#4ade80`, `#f87171`, `#1a0030`, `#0d0d1a`, `#1D0001`, `rgba(255,77,0,0.35)`, and more colorMap entries
- Plus non-existent CSS vars: `var(--accent-cyan)`, `var(--accent-purple)`

### H-3: Non-Existent CSS Variables
**Files:** `CompanyProfileClient.tsx:666, 692, 703`
**Severity:** 🟠 HIGH
**Details:** `var(--accent-cyan)` and `var(--accent-purple)` are used in inline styles but these CSS variables do NOT exist in `globals.css`. They render as invalid colors.

### H-4: Directory Client-Side Re-Filtering Breaks Pagination
**File:** `CompanyDirectoryClient.tsx:104-155`
**Severity:** 🟠 HIGH
**Details:** The `filteredCompanies` useMemo re-filters and re-sorts data that was ALREADY filtered and sorted by the backend. Client-side `filteredCompanies` may have fewer items than the page size, yet pagination shows server-side totals. "Load More" displays wrong remaining count. City/sellerType filters duplicate backend work, causing inconsistent pagination.

### H-5: Profile Completion Guard Blocks Admins
**File:** `companies.controller.ts:155`
**Severity:** 🟠 HIGH
**Details:** `GET :id/profile-completion/details` has `@UseGuards(CompanyOwnerGuard)` but no `RolesGuard('ADMIN')`. Admins get 403 when trying to view profile completion for any company.

### H-6: Save/Like Is Client-Only (No API)
**File:** `CompanyProfileClient.tsx:210-212`
**Severity:** 🟠 HIGH
**Details:** The bookmark button toggles `setSaved(s => !s)` — purely local state. No API call to save/bookmark the company. The SavedSupplier model exists but isn't used here. User loses their saved state on page refresh.

### H-7: Category Filter Missing from Directory
**File:** `CompanyDirectoryClient.tsx`
**Severity:** 🟠 HIGH
**Details:** Backend supports `category` filter in `findDirectory()`, but frontend has no category dropdown/filter in the directory UI. Users can't filter companies by product category.

### H-8: Duplicate `text-accent` in Icon Props
**File:** `CompanyProfileClient.tsx:230, 241, 319, 331, 362, 383, 399, 419, 443, 455, 463, 583, 586, 606, 634, 656, 682, 724, 753`
**Severity:** 🟠 HIGH
**Details:** Many icons have `text-accent` as a standalone prop — `text-accent` is NOT a valid Lucide icon prop (`size`, `color`, `className` are). It's silently ignored. Should be `className="text-accent"`.

---

## 4. Medium Issues

### M-1: Google Maps API Key Hardcoded
**File:** `CompanyProfileClient.tsx:1125`
**Details:** `AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8` is exposed in client-side code. Should use `NEXT_PUBLIC_GOOGLE_MAPS_KEY` env var.

### M-2: No Suspense Boundary on Profile Page
**File:** `CompanyProfileClient.tsx:77-95`
**Details:** All 4 API calls fire in parallel inside a single `useEffect`, and the entire page shows a loading spinner until ALL complete. No streaming/suspense for individual sections (products, reviews, similar could load independently).

### M-3: No `generateStaticParams` for Company Profiles
**File:** `companies/[slug]/page.tsx`
**Details:** Profile page uses `fetch` at request time with `cache: 'no-store'`. No ISR or static generation. Every profile visit hits the API.

### M-4: Map CSS Filter Inverts Text Legibility
**File:** `CompanyProfileClient.tsx:1122`
**Details:** `filter: 'invert(0.9) hue-rotate(180deg)'` on the Google Maps iframe makes road names and labels hard to read.

### M-5: Profile `rating` Always 0
**File:** `companies.service.ts:238`
**Details:** `getPublicProfile()` and `findBySlug()` don't compute aggregate rating from `ProductReview`. The profile page shows `avgRating.toFixed(1)` which falls back to `0.0` when `reviews.summary` is absent or empty.

### M-6: `findMyCompany` Missing certificationDocs in findByOwner
**File:** `companies.service.ts:379-396`
**Details:** While `findBySlug` includes `certificationDocs`, the `findByOwner` method also includes it. This is actually correct (line 388). False alarm — including to note the inconsistency risk.

### M-7: Directory Hero Stats Are Hardcoded
**File:** `CompanyDirectoryClient.tsx:157-164`
**Details:** Stats like `'10L+ Tradors'`, `'2L+ Verified'`, `'5K+ Elite'`, `'500+ Cities'` are hardcoded strings, not from any API.

### M-8: Gallery/Factory Image Alt Text
**File:** `CompanyProfileClient.tsx:642, 759`
**Details:** `alt={`Gallery ${idx + 1}`}` and `alt={`Factory ${idx + 1}`}` are not descriptive. Should use alt text from DB or meaningful descriptions.

---

## 5. Low Issues

- `responseRate` field available but not displayed on public profile
- `onTimeDelivery` and `orderCount` are hardcoded defaults (99%, 500+) in StatBadge
- No company-level analytics on profile (page views, RFQ count, conversion rate)
- `findBySlug` and `getPublicProfile` are almost identical — code duplication risk
- `bannerUrl` checked but `banner` also used — inconsistent field naming
- `bypassCache` in `doFetch` (`JSON.stringify(filters)`) re-fetches on every filter change — could be optimized with `React Query`
- `GET /companies/search` returns cursor-based pagination while `GET /companies/directory` returns page-based — inconsistent consumer experience

---

## 6. Files/Components Requiring Changes

| File | Issues | Est. Effort |
|------|--------|-------------|
| `CompanyProfileClient.tsx` | C-1, H-1, H-2, H-3, H-6, H-8, M-1, M-4 | ⭐⭐⭐⭐⭐ |
| `CompanyCard.tsx` | H-2 | ⭐⭐ |
| `companies.controller.ts` | H-5 | ⭐ |
| `companies.service.ts` | M-5 | ⭐ |
| `lib/api/types.ts` | C-2 | ⭐ |
| `lib/api/companies.ts` | C-2, C-3 | ⭐ |
| `hooks/use-companies.ts` | C-2, C-3 | ⭐ |
| `CompanyDirectoryClient.tsx` | H-4, H-7, M-7 | ⭐⭐⭐ |
| `globals.css` | H-3 (add missing vars) | ⭐ |
| `.env.example` | M-1 (add MAPS key) | ⭐ |

---

## 7. Estimated Implementation Sessions

| Session | Focus | Files | Est. Hours |
|---------|-------|-------|------------|
| **S-1** | Fix bg-surface/border-border class bugs (C-1) | `CompanyProfileClient.tsx` | 2h |
| **S-2** | Fix TypeScript types + hook endpoints (C-2, C-3) | `types.ts`, `companies.ts`, `use-companies.ts` | 1h |
| **S-3** | Design token cleanup (H-2, H-3) | `CompanyCard.tsx`, `CompanyProfileClient.tsx` | 2h |
| **S-4** | Trust & Verification section (H-1) | `CompanyProfileClient.tsx` | 2h |
| **S-5** | Save company API + fix icon props (H-6, H-8) | `CompanyProfileClient.tsx`, `buyer.ts` | 1.5h |
| **S-6** | Directory filter + pagination fixes (H-4, H-7) | `CompanyDirectoryClient.tsx` | 1.5h |
| **S-7** | Profile completion guard + SEO (H-5, M-3) | `companies.controller.ts`, `page.tsx` | 0.5h |
| **S-8** | Maps key, alt text, rating fix, CSS vars (M-1, M-4, M-5, M-8) | Multiple files | 1h |

**Total: ~11.5 hours**

---

## 8. Recommended Implementation Order

| Priority | Session | Rationale |
|----------|---------|-----------|
| 🥇 P0 | **S-1** | Fix CSS class bugs — profile is visually broken without it |
| 🥇 P0 | **S-2** | Fix types and hooks — broken API calls cause 404s |
| 🥇 P0 | **S-3** | Design token cleanup — needed before freeze |
| 🥈 P1 | **S-4** | Trust section — core buyer decision factor |
| 🥈 P1 | **S-6** | Directory pagination + category filter |
| 🥈 P1 | **S-5** | Save company + icon fixes |
| 🥉 P2 | **S-7** | Guard fix + SEO |
| 🥉 P2 | **S-8** | Maps key, alt text, rating |

---

## STOP — Audit Complete. No code was modified.
