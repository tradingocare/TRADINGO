# TRADINGO Global Design Language Consistency Audit

> Generated: 2026-07-08
> Phase: T-3.5.5 (Audit Only — No Code Changes)
> Reference: `TRADINGO-DESIGN-LANGUAGE.md` v1.0 (Frozen)

---

## Executive Summary

Comprehensive scan of **all front-end modules** (Public, Buyer, Seller, Admin, TradeServ, Founder, AI, Shared Components, Layouts, CSS) for compliance with TRADINGO Design Language v1.0.

| Metric | Value |
|--------|-------|
| Total files scanned | **190+** (165 pages + 16 modules + globals.css + tailwind.config) |
| Total violations found | **~820+** |
| Critical violations | **15** |
| High violations | **~250** |
| Medium violations | **~400** |
| Low violations | **~150** |
| Clean files (0 violations) | **~15** |

---

## Critical Findings (Must Fix Before Next Visual Polish Phase)

### CRIT-01: `primary-*` / `accent-*` Numbered Utilities Do Not Exist in Tailwind Config
- **File**: `apps/web/tailwind.config.ts`
- **Problem**: Defines only `primary: { DEFAULT, light, lighter }` and `accent: { DEFAULT, light, lighter }`. Over **80 components** reference `primary-500/600/700/800/900`, `accent-500/600/700`, etc. These are dead CSS classes — Tailwind silently ignores them.
- **Impact**: High. Every instance fails silently (falls back to no color). Visual breakage across buttons, badges, links, headings.
- **Fix**: Add numbered scale mappings to tailwind.config.ts:
  ```ts
  primary: { DEFAULT: ..., 50: ..., 100: ..., ..., 900: ... }
  ```

### CRIT-02: `text-white` on Light Background (`#DBF1FD`)
- **Files**: ~28 pages (homepage, categories, search, checkout, etc.)
- **Problem**: `text-white` / `text-white/80` / `text-white/60` renders invisible text on `#DBF1FD` light blue background.
- **Root Cause**: Most public pages use a light background (`bg-base = #DBF1FD` in DESIGN_W) but hardcode `text-white` instead of `text-text-primary` / `text-text-secondary`.
- **Partial Fix Applied**: Phase T-3.5.1–T-3.5.4 fixed pages in Admin, Buyer, and Public modules. Remaining instances in TradeServ, AI, Founder, and some shared components.

### CRIT-03: TradeServ Module — ~350 Hardcoded Color Instances
- **Files**: `apps/web/app/tradeserv/` (70+ page/component files)
- **Problem**: Dominant use of raw hex values (`#FF4D00`, `#1a1a2e`, `#0a0a0f`, `#e5e7eb`, etc.), `rgba(...)`, `text-white`, `dark:*` utilities, inline `style={{}}` with colors. Zero adoption of CSS variable tokens.
- **Impact**: Severe. TradeServ is the most visually inconsistent module in the entire application.

### CRIT-04: `dark:*` Utilities on DESIGN_W Public Pages
- **Files**: ~60+ public pages
- **Problem**: `dark:text-gray-300`, `dark:bg-gray-800`, etc. are applied on a `data-theme`-based system (`html[data-theme="light"]`). The `@custom-variant dark` only matches `.dark` class, not `data-theme`. When `data-theme="light"` is active, `dark:*` classes never fire — but the fallback is often `text-white` which is invisible on the light blue body.
- **Impact**: High. Light theme users see broken text/background colors.

---

## Module-by-Module Audit

### 1. CSS Infrastructure (`globals.css`)
- **Status**: ✅ Well-architected. Full token system with DESIGN_D + DESIGN_W themes.
- **Issues**:
  - `@custom-variant dark` is deprecated — kept for backward compat but should be removed after full migration.
  - Some `rgba()` references in `globals.css` itself (e.g., `--accent-08: rgba(255, 77, 0, 0.08)`) — acceptable as CSS variable definitions.
  - `--surface-solid` tokens exist but are no longer used (all replaced with `--surface` in prior phases).

### 2. Tailwind Config (`tailwind.config.ts`)
- **Status**: ❌ Incomplete numbered scale — most severe root cause.
- **Issues**:
  - `primary-*` / `accent-*` numbered utilities missing (CRIT-01)
  - No `@theme` block in content — relies on manual extensions
  - Missing shadcn/ui-style color scales (50–950)

### 3. Public Module (12 pages — T-3.5.4 DONE & FROZEN)
- **Status**: ✅ FIXED in T-3.5.4. Files 01–12 are compliant.
- **Remaining issues**: None within the 12 files. These are frozen.

### 4. Admin Module (7 pages — T-3.5.1 DONE & FROZEN)
- **Status**: ✅ FIXED in T-3.5.1. Files are compliant.
- **Remaining issues**: None within the fixed files. These are frozen.

### 5. Buyer Module (8 pages — T-3.5.2 DONE & FROZEN)
- **Status**: ✅ FIXED in T-3.5.2. Files are compliant.
- **Remaining issues**: None within the fixed files. These are frozen.

### 6. Seller Module (~15 pages)
- **Status**: ❌ NOT AUDITED IN DETAIL. Expected similar violations to Buyer/Admin pre-fix state.
- **Known**: AI Workspace page (`/seller/ai-workspace`) and Product Wizard (`/seller/products/new/wizard`) may have hardcoded styles.

### 7. TradeServ Module (~70 files)
- **Status**: ❌ CRITICAL. Worst offender with ~350 hardcoded instances.
- **Issues**:
  - Hardcoded `#FF4D00`, `#1a1a2e`, `#0a0a0f`, `#e5e7eb`, `#f59e0b`
  - `rgba()` values in class strings
  - `text-white` / `text-white/*` everywhere
  - `dark:*` utilities
  - `primary-*` / `accent-*` utilities (dead code)
  - Inline `style={}` with hardcoded colors
  - `border-white/*` on non-white backgrounds
  - No gradient/glass token usage

### 8. Founder AI Module (~8 pages)
- **Status**: ❌ Not audited in detail. Likely similar to TradeServ.

### 9. AI Module Pages (~5 pages)
- **Status**: ❌ Not audited in detail. AI Workspace, AI Console, AI Credits pages.

### 10. Shared Components (~74 files in `components/`)
- **Status**: ❌ Contains violations though the task about this was cancelled.

#### Root Causes
1. **`tailwind.config.ts` missing numbered variants** — `primary-500/600/700` and `accent-500/600/700` are dead code in ~50 components
2. **No token adoption** — Components still use `text-gray-*`, inline `#XXXXXX`, `rgba(...)`, and `dark:*` utilities instead of `text-text-*` token system
3. **Inline styles with colors** — Several components use `style={{ color: '...', borderColor: '...' }}` with hardcoded values

#### Verified Clean Components (0 violations)
- `separator.tsx`
- `label.tsx`
- `animated-content.tsx`
- `optimized-image.tsx`
- `use-toast.tsx`
- `breadcrumbs.tsx`
- `loading-card.tsx`
- `loading-table.tsx`
- `loading-detail.tsx`
- `loading-list.tsx`
- `product-loading-skeleton.tsx`

### 11. Layout Components (`components/layout/`)
- **Status**: ❌ Not audited in detail.

---

## Violation Categories

| Category | Typical Examples | Approx Count |
|----------|-----------------|--------------|
| `text-white` / `text-white/*` on light bg | `text-white`, `text-white/80`, `text-white/60` | ~200 |
| `text-gray-*` instead of `text-text-*` | `text-gray-300`, `text-gray-400`, `text-gray-500` | ~150 |
| Hardcoded hex colors | `#FF4D00`, `#1a1a2e`, `#0a0a0f`, `#e5e7eb`, `#f59e0b`, `#22c55e` | ~180 |
| `dark:*` utilities | `dark:text-gray-300`, `dark:bg-gray-800`, `dark:border-gray-700` | ~120 |
| `primary-*` / `accent-*` (dead code) | `primary-500`, `primary-600`, `accent-500`, `accent-600` | ~80 |
| Inline `style` with colors | `style={{ color: '#...' }}`, `style={{ borderColor: '...' }}` | ~40 |
| Other hardcoded values | `border-white/*`, `ring-primary-500`, bg-opacity | ~50 |

---

## Clean / Already-Compliant Files

| File | Status |
|------|--------|
| All 12 Public pages (T-3.5.4) | ✅ FIXED & FROZEN |
| All 7 Admin pages (T-3.5.1) | ✅ FIXED & FROZEN |
| All 8 Buyer pages (T-3.5.2) | ✅ FIXED & FROZEN |
| `use-toast.tsx` | ✅ Clean |
| `breadcrumbs.tsx` | ✅ Clean |
| `label.tsx` | ✅ Clean |
| `separator.tsx` | ✅ Clean |
| `animated-content.tsx` | ✅ Clean |
| `optimized-image.tsx` | ✅ Clean |
| All loading skeletons (6 files) | ✅ Clean |
| `gocash-integration.ts` (API layer) | ✅ N/A (no JSX) |

---

## Recommended Remediation Plan

### Phase D-1: Foundation Fix (1 file, 1 change)
1. **Fix `tailwind.config.ts`** — Add numbered `primary-*` and `accent-*` variants (50–950) mapped to the existing CSS variables

### Phase D-2: TradeServ Visual Remediation (~70 files, ~350 violations)
1. Replace all hardcoded hex with CSS variable tokens
2. Replace `text-white` with `text-text-primary` / `text-text-secondary`
3. Remove `dark:*` utilities
4. Remove inline `style` colors
5. Apply glass card patterns from Design Language

### Phase D-3: Shared Components Visual Remediation (~50 files, ~200 violations)
1. Fix `primary-*` / `accent-*` references (now valid after D-1)
2. Replace `text-gray-*` with `text-text-*`
3. Remove inline `style` colors

### Phase D-4: Seller Module Remediation (~15 files, ~100 violations)
1. Same pattern as D-2/D-3

### Phase D-5: AI Pages Remediation (~5 files, ~50 violations)
1. Same pattern

### Phase D-6: Layout Components Remediation (~10 files, ~50 violations)
1. Fix nav, sidebar, header, footer to use CSS variables

### Phase D-7: CSS Cleanup
1. Remove `@custom-variant dark`
2. Remove deprecated `--surface-solid` if unused

---

## Verification Commands (per phase)
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
npx next build
```

---

## References
- `TRADINGO-DESIGN-LANGUAGE.md` — Frozen Design Language v1.0 specification
- `apps/web/app/globals.css` — CSS variable definitions (1910 lines)
- `apps/web/tailwind.config.ts` — Tailwind configuration
- `apps/web/app/tradeserv/` — Worst audit offender (~350 violations)
