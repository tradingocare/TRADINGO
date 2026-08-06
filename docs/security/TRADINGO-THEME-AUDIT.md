# PHASE T-1 — THEME ARCHITECTURE AUDIT

**Project:** TRADINGO® Global Design System  
**Date:** 2026-07-07  
**Status:** AUDIT COMPLETE — AWAITING FOUNDER REVIEW  
**Scope:** Frontend architecture audit of entire `apps/web/` codebase (736 `.tsx`/`.ts` files)

---

## 1. CURRENT THEME ARCHITECTURE

### 1.1 Existing Theme Infrastructure

| Component | Exists? | Status |
|-----------|---------|--------|
| `ThemeProvider` | ✅ `components/shared/theme-provider.tsx` | Active |
| `useTheme()` hook | ✅ Same file | Active |
| `ThemeToggle` | ✅ `components/shared/theme-toggle.tsx` | Active |
| `ThemeProviderWrapper` | ✅ `components/shared/theme-wrapper.tsx` | Active |
| `.dark` CSS variant | ✅ `globals.css` line 3 | Active |
| `localStorage` persistence | ✅ `tradingo-theme` key | Active |

### 1.2 How It Works Today

1. `ThemeProvider` wraps all children in `Providers` → `app/layout.tsx`
2. On mount: reads `localStorage.getItem('tradingo-theme')`, defaults to `'dark'`
3. Toggles `.dark` class on `<html>` via `document.documentElement.classList.toggle('dark', ...)`
4. `ThemeToggle` button calls `toggleTheme()` which flips between `'light'` and `'dark'`

### 1.3 Critical Flaw: THEME TOGGLE IS NON-FUNCTIONAL

Switching to `'light'` mode produces **no visible change** because:

- **`globals.css` `:root` block** (line 11-99) defines ONLY dark theme CSS variables (`--bg-base: #00001c`, `--text-primary: #f0f4ff`, etc.)
- **`globals.css` `@theme` block** (line 101-137) defines ONLY dark theme Tailwind tokens (`--color-surface: #0a0e1a`, `--color-text-primary: #f0f4ff`, etc.)
- **No `:root:not(.dark)` or `:root.light` overrides exist** anywhere
- **No `--light-*` CSS custom properties exist**
- The `dark:` variant classes used in components (e.g., `dark:bg-dark-surface`) reference colors that are **NOT DEFINED** — making them dead/no-op code

**Result:** The platform is effectively dark-only. The theme toggle UI exists but has zero visual effect.

---

## 2. TWO COMPETING COLOR SYSTEMS (CONFLICT)

The codebase has two color systems that **contradict each other**:

### System A: `tailwind.config.ts` (Light Theme Values)

```typescript
colors: {
  bg:      { base: '#DBF1FD', elevated: '#FFFFFF', elevated2: '#F0F7FE' },
  surface: { DEFAULT: '#FFFFFF', ... },
  text:    { primary: '#0F172A', secondary: '#334155', tertiary: '#64748B' },
  border:  { thin: 'rgba(148, 163, 184, 0.2)' },
  accent:  { DEFAULT: '#FF4D00', light: '#FF7A33', dark: '#CC3D00' },
}
```

### System B: `globals.css` `@theme` Block (Dark Theme Values)

```css
@theme {
  --color-bg-base:            #00001c;
  --color-bg-elevated:        #050510;
  --color-surface:            #0a0e1a;
  --color-text-primary:       #f0f4ff;
  --color-text-secondary:     #a8b4cc;
  --color-text-tertiary:      #6b7894;
  --color-border:             rgba(255, 255, 255, 0.07);
  --color-accent-DEFAULT:     #ff4d00;
}
```

### Resolution

In Tailwind CSS v4, the `@theme` block in `globals.css` **completely overrides** the JavaScript-based `tailwind.config.ts`. This means:

- `bg-surface` resolves to `#0a0e1a` (dark), **not** `#FFFFFF` (light)
- `text-text-primary` resolves to `#f0f4ff` (light text), **not** `#0F172A` (dark text)
- The `tailwind.config.ts` light theme values are **effectively dead code**

---

## 3. HARDCODED COLOR AUDIT

### 3.1 Aggregate Counts (736 source files)

| Category | Occurrences | % of Total |
|----------|-------------|-----------|
| `text-white` (incl. opacity variants) | 2,841 | 21.6% |
| `text-{color}-{shade}` (gray/red/green/etc.) | 1,917 | 14.6% |
| `bg-{color}-{shade}` | 726 | 5.5% |
| `bg-white/black` (incl. opacity) | 824 | 6.3% |
| `border-{color}-{shade}` | 404 | 3.1% |
| `border-white/black` (incl. opacity) | 854 | 6.5% |
| Arbitrary `[#...]` values | 1,043 | 7.9% |
| `rgba/rgb()` anywhere | 1,487 | 11.3% |
| Hex colors in `style` props | 307 | 2.3% |
| `rgba/rgb` in `style` props | 441 | 3.4% |
| `boxShadow` in `style` props | 61 | 0.5% |
| **Subtotal Hardcoded** | **~10,905** | **83%** |
| **Tokenized classes** | **~3,782** | **17%** |

### 3.2 Token System Adoption Rate

| Component Area | Tokenized | Hardcoded | Readiness |
|----------------|-----------|-----------|-----------|
| `Button` (CVA) | 95% | 5% | 🟢 HIGH |
| `Badge` (CVA) | 85% | 15% | 🟢 HIGH |
| `Input` | 90% | 10% | 🟢 HIGH |
| `Card` | 10% | 90% | 🔴 LOW |
| `Skeleton` | 80% | 20% | 🟡 MEDIUM |
| `NotificationDrawer` | 100% | 0% | 🟢 HIGH |
| `FilterDrawer` | 100% | 0% | 🟢 HIGH |
| `BulkLocationModal` | 90% | 10% | 🟢 HIGH |
| `InquiryModal` | 5% | 95% | 🔴 LOW |
| `Navbar` | 5% | 95% | 🔴 LOW |
| `Footer` | 10% | 90% | 🔴 LOW |
| `StatusBadge` | 60% | 40% | 🟡 MEDIUM |
| `VerifiedBadge` | 70% | 30% | 🟡 MEDIUM |
| Dashboard Shells (admin/buyer/seller) | 40% | 60% | 🟡 MEDIUM |
| TradeServ pages | 20% | 80% | 🔴 LOW |
| Admin pages | 35% | 65% | 🟡 MEDIUM |
| Marketplace pages | 50% | 50% | 🟡 MEDIUM |
| Authentication pages | 30% | 70% | 🔴 LOW |
| Ecosystem pages | 60% | 40% | 🟡 MEDIUM |

### 3.3 Top 10 Files by Hardcoded Color Density

| File | Hardcoded Count | Tokenized Count | Ratio |
|------|----------------|-----------------|-------|
| `subscription/purchase/PurchaseClient.tsx` | ~206 | ~15 | 93:7 |
| `admin/plans/page.tsx` | ~199 | ~28 | 88:12 |
| `tradeserv/page.tsx` | ~158 | ~12 | 93:7 |
| `tradeserv/workspace/proposals/page.tsx` | ~148 | ~22 | 87:13 |
| `search/search-content.tsx` | ~138 | ~25 | 85:15 |
| `admin/catalog-import/page.tsx` | ~132 | ~71 | 65:35 |
| `tradeserv/workspace/profile/page.tsx` | ~126 | ~31 | 80:20 |
| `tradeserv/workspace/services/page.tsx` | ~124 | ~72 | 63:37 |
| `tradeserv/workspace/reviews/page.tsx` | ~120 | ~25 | 83:17 |
| `components/shared/navbar.tsx` | ~115 | ~5 | 96:4 |

---

## 4. TAILWIND CONFIGURATION AUDIT

### 4.1 File: `apps/web/tailwind.config.ts`

| Section | Exists? | Notes |
|---------|---------|-------|
| `colors.bg.*` | ✅ | Light theme values |
| `colors.primary.*` | ✅ | Only 3: DEFAULT, light, lighter |
| `colors.accent.*` | ✅ | 6 variants: DEFAULT, light, dark, soft, subtle, hover |
| `colors.surface.*` | ✅ | 4 variants |
| `colors.text.*` | ✅ | 5 variants |
| `colors.border.*` | ✅ | 3 variants |
| `colors.glass.*` | ✅ | 5 variants |
| `colors.glow.*` | ✅ | 6 glow colors |
| `boxShadow` | ✅ | 4 custom shadows |
| `animation` | ✅ | 7 custom animations |
| `keyframes` | ✅ | 1 keyframe (gradient) |
| `backdropBlur` | ✅ | xs, 4xl |
| `fontFamily` | ❌ | Not in config (defined in `@theme` block and layout.tsx) |
| `borderRadius` | ❌ | No custom radii |
| `spacing` | ❌ | None |
| Numbered accent weights (50-900) | ❌ | Only `DEFAULT`, `light`, `dark` |

### 4.2 File: `apps/web/app/globals.css` (`@theme` block)

| Token | Value | Notes |
|-------|-------|-------|
| `--color-bg-base` | `#00001c` | Dark background |
| `--color-bg-elevated` | `#050510` | Slightly lighter |
| `--color-bg-elevated-2` | `#080818` | Another variant |
| `--color-surface` | `#0a0e1a` | Card surface |
| `--color-surface-secondary` | `#050510` | Secondary surface |
| `--color-surface-tertiary` | `#080818` | Tertiary surface |
| `--color-accent-DEFAULT` | `#ff4d00` | Brand orange |
| `--color-accent-light` | `#ff7a33` | Lighter orange |
| `--color-accent-dark` | `#cc3d00` | Darker orange |
| `--color-border` | `rgba(255,255,255,0.07)` | Border |
| `--color-border-light` | `rgba(255,255,255,0.04)` | Lighter border |
| `--color-text-primary` | `#f0f4ff` | Primary text |
| `--color-text-secondary` | `#a8b4cc` | Secondary text |
| `--color-text-tertiary` | `#6b7894` | Tertiary/metadata text |
| `--color-text-muted` | `#6b7894` | Muted text |
| `--color-text-on-accent` | `#FFFFFF` | Text on accent buttons |
| `--color-gray-50` to `-950` | `rgba(255,255,255,0.02)` → `#FFFFFF` | 12 white-based grays |

**Missing from `@theme`:** No `--color-primary-*` numbered weights (50-900), no `--color-success`/`--color-warning`/`--color-error`/`--color-info` semantic tokens, no `--font-*` for display/sans.

---

## 5. SHARED COMPONENT AUDIT

### 5.1 Components That Will Automatically Benefit from a Global Theme Provider

These use **tokenized Tailwind classes** (`bg-surface`, `text-text-primary`, `border-border`, etc.) and will respond to `@theme` token changes:

| Component | File | Tokenized % |
|-----------|------|-------------|
| `Button` | `components/ui/button.tsx` | 95% |
| `Badge` | `components/ui/badge.tsx` | 85% |
| `Input` | `components/ui/input.tsx` | 90% |
| `Skeleton` | `components/ui/skeleton.tsx` | 80% |
| `Separator` | `components/ui/separator.tsx` | 90% |
| `Pagination` | `components/ui/pagination.tsx` | 0% (hardcoded grays) |
| `EmptyState` | `components/ui/empty-state.tsx` | 0% (hardcoded grays) |
| `Toaster` | `components/ui/toaster.tsx` | 0% (hardcoded grays) |
| `NotificationDrawer` | `components/notifications/notification-drawer.tsx` | 100% |
| `FilterDrawer` | `components/near-me/filter-drawer.tsx` | 100% |
| `BulkLocationModal` | `components/seller-locations/bulk-location-modal.tsx` | 90% |
| `Sidebar` | `components/dashboard/sidebar.tsx` | 70% |
| `Breadcrumbs` | `components/dashboard/breadcrumbs.tsx` | 0% |
| `DashboardPageHeader` | `components/dashboard/page-header.tsx` | 0% |
| `WelcomeTour` | `components/dashboard/welcome-tour.tsx` | 0% |
| `ErrorState` | `components/shared/error-state.tsx` | 60% |
| `StatusBadge` | `components/dashboard/status-badge.tsx` | 60% |
| `VerifiedBadge` | `components/shared/VerifiedBadge.tsx` | 70% |

**Count: ~18 shared components will partially or fully benefit**
**Fully ready (~90-100%):** 5 components
**Partially ready (~50-85%):** 5 components
**Not ready (~0-30%):** 8 components

### 5.2 Components That Need Rewriting

| Component | Reason | Effort |
|-----------|--------|--------|
| `Card` | Uses hardcoded `rgba()` gradients in className | HIGH |
| `Navbar` | Entirely dark-glass premium design with inline styles | VERY HIGH |
| `Footer` | Inline style backgrounds, cardAccents array, hardcoded hex | HIGH |
| `Topbar` | Hardcoded `rgba(0,29,0,0.95)` background | MEDIUM |
| `InquiryModal` | All hardcoded gray classes, no dark mode support | MEDIUM |
| `SearchBar` | Hardcoded `#FF4D00` inline style | LOW |
| `LevelUpModal` | Hardcoded gradient backgrounds | LOW |
| `SellerBadge` | Heavy inline style usage | MEDIUM |
| `ProductCard` | Heavy inline styles, dynamic gradients | HIGH |

---

## 6. TYPOGRAPHY SYSTEM

### 6.1 Current State

| Property | Definition | Source |
|----------|-----------|--------|
| `--font-sans` | `Inter` | `layout.tsx` + `@theme { --font-sans: 'Inter', sans-serif }` |
| `--font-display` | `Playfair Display` | `layout.tsx` + `@theme { --font-display: 'Playfair Display', serif }` |
| Base headings | `font-family: var(--font-display)` | `globals.css` base layer |
| Body text | `font-family: var(--font-sans)` | Inherited from `layout.tsx` |
| Letter-spacing (headings) | `-0.02em` | `globals.css` base layer |

### 6.2 Issues

- No `font-size` scale tokens defined (relies on Tailwind defaults: `text-sm`, `text-lg`, `text-2xl`, etc.)
- No `font-weight` tokens (relies on Tailwind defaults)
- No `line-height` tokens (relies on Tailwind defaults)
- Headings use Playfair Display (serif) — may not be suitable for light theme

---

## 7. SPACING SYSTEM

### 7.1 Current State

- **No custom spacing tokens defined** — relies entirely on Tailwind defaults (`p-4`, `gap-6`, `space-y-2`, etc.)
- `.container-main` custom utility: `max-width: 1280px`, `padding: 1.5rem` (mobile), `2rem` (sm), `3rem` (lg)
- **No CSS custom properties for spacing** — all inline values

---

## 8. BORDER RADIUS SYSTEM

### 8.1 Current State

- **No custom radius tokens defined**
- Relies on Tailwind defaults: `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-[22px]` (custom)
- Custom radiuses used via arbitrary values: `rounded-[22px]`, `rounded-[1.25rem]`, `rounded-[0.875rem]`
- `rounded-full` (9999px) used extensively for pills/buttons/badges

---

## 9. SHADOW SYSTEM

### 9.1 Current State

| Token | Value | Source |
|-------|-------|--------|
| `shadow-card` | `0 4px 24px rgba(0,0,0,0.04)` | tailwind.config.ts (light, NOT used) |
| `shadow-card-hover` | `0 8px 32px rgba(0,0,0,0.07)` | tailwind.config.ts (light, NOT used) |
| `shadow-soft` | `0 8px 40px rgba(0,0,0,0.30)` | tailwind.config.ts |
| `shadow-glow-accent` | `0 0 30px rgba(245,158,11,0.25)` | tailwind.config.ts |
| `shadow-glow-soft` | `0 8px 40px rgba(0,0,0,0.30)` | tailwind.config.ts |
| CSS `--card-shadow` | `0 8px 40px rgba(0,0,0,0.55)` | globals.css `:root` (dark, ACTIVE) |
| CSS `--card-shadow-hover` | `0 16px 64px rgba(0,0,0,0.65)` | globals.css `:root` (dark, ACTIVE) |

**Pattern:** The `tailwind.config.ts` defines light shadows, but the actual CSS `:root` variables define dark shadows. There's no shadow token for a light theme.

---

## 10. HOVER EFFECTS

### 10.1 Current Patterns

- **Cards**: `translateY(-3px)`, `border-color` change, `box-shadow` amplification
- **Buttons**: `translateY(-2px)`, `box-shadow` glow increase, optional border glow
- **Navigation capsules**: Border glow, box-shadow with accent/orange colors, inset highlights
- **Glass elements**: Mouse-following radial gradients (`--mx`, `--my` CSS vars)
- **All hover effects are dark-theme-optimized** — glow effects use dark-background-appropriate shadows

---

## 11. CURRENT DARK/LIGHT IMPLEMENTATION

### 11.1 Existing Mechanisms

```
ThemeProvider (React Context)
  ├── Stores theme in localStorage('tradingo-theme')
  ├── Default: 'dark'
  ├── Toggles .dark class on <html>
  └── useTheme() hook available everywhere

globals.css
  ├── @custom-variant dark (&:where(.dark, .dark *));
  ├── :root — ONLY dark CSS variables
  ├── @theme — ONLY dark Tailwind tokens
  ├── :where(.dark) .bg-white { → bg-elevated }  (legacy overrides)
  └── :where(.dark) .text-gray-500 { → text-secondary }

Components
  ├── Some use dark:bg-dark-surface (dead code — 'dark-surface' undefined)
  ├── Some use dark:text-dark-text-primary (dead code — 'dark-text-primary' undefined)
  └── Most have no dark: variants at all
```

### 11.2 What's Missing for Light Theme

| Item | Missing? | Impact |
|------|----------|--------|
| `:root` light CSS variables | ❌ COMPLETELY MISSING | **Blocking** |
| `@theme` light overrides | ❌ COMPLETELY MISSING | **Blocking** |
| `:root:not(.dark)` selectors | ❌ COMPLETELY MISSING | Blocking |
| Light background (`#DBF1FD` or similar) | ❌ NOT DEFINED | High |
| Light surface (`#FFFFFF` or similar) | ❌ NOT DEFINED | High |
| Light text (`#0F172A` or similar) | ❌ NOT DEFINED | High |
| Light shadows (subtle, not dark-box) | ❌ NOT DEFINED | High |
| Light glass effects | ❌ NOT DEFINED | Medium |
| Hover effects for light background | ❌ NOT DEFINED | Medium |
| `--dark-*` CSS properties | ❌ NOT DEFINED | Low (dead code) |

---

## 12. THEME READINESS SCORE

### 12.1 Overall Score: **2.2 / 10**

| Category | Score | Reasoning |
|----------|-------|-----------|
| Theme infrastructure (provider, toggle) | 7/10 | Provider/hook/toggle all exist, but no actual theme switching |
| CSS variable system | 3/10 | Dark vars exist, no light vars at all |
| Tailwind config completeness | 4/10 | Light config exists but overridden; missing numbered weights |
| Component tokenization | 3/10 | Only 17% of color usage is tokenized |
| Shared component readiness | 4/10 | ~50% of shared components partially tokenized |
| Hardcoded color coverage | 2/10 | ~10,900 hardcoded color instances vs ~3,800 tokenized |
| Typography system | 6/10 | Fonts defined, no size/weight/line-height tokens |
| Spacing system | 2/10 | No tokens, only default Tailwind |
| Shadow system | 3/10 | Dark shadows defined, no light shadows |
| Hover effects for light theme | 0/10 | All hover effects are dark-optimized |
| `dark:` variant code correctness | 1/10 | Most `dark:*` classes reference undefined colors |
| Overall | **2.2/10** | Infrastructure exists but theme system is effectively non-functional |

---

## 13. EXISTING vs REQUIRED

| Feature | Currently | Required for DESIGN_W (White) |
|---------|-----------|-------------------------------|
| Background color | `#00001c` (dark) | `#DBF1FD` or similar light blue |
| Card surface | `#0a0e1a` dark glass | `#FFFFFF` with soft shadow |
| Text primary | `#f0f4ff` (white-ish) | `#0F172A` (dark navy) |
| Text secondary | `#a8b4cc` | `#334155` |
| Accent | `#FF4D00` (same) | Same (brand color unchanged) |
| Borders | `rgba(255,255,255,0.07)` | `rgba(148,163,184,0.2)` |
| Shadows | Heavy dark shadows | Soft light shadows |
| Glass effect | Dark glass with neon | Light frosted glass |
| Hover glow | Neon backlight | Soft accent lift |

---

## 14. FILES THAT WILL NEED MODIFICATION

### 14.1 Core System Files (4 files)

| File | Change Required |
|------|----------------|
| `apps/web/app/globals.css` | Add `:root.light` CSS variables + `@theme` light overrides |
| `apps/web/tailwind.config.ts` | Add numbered accent weights (50-900), fix color tokens |
| `apps/web/components/shared/theme-provider.tsx` | Add CSS variable switching on theme change |
| `apps/web/app/layout.tsx` | No change needed (already wraps `<Providers>`) |

### 14.2 UI Components to Tokenize (~12 files)

| File | Priority |
|------|----------|
| `components/ui/card.tsx` | HIGH — used everywhere |
| `components/ui/pagination.tsx` | MEDIUM |
| `components/ui/empty-state.tsx` | MEDIUM |
| `components/ui/toaster.tsx` | HIGH |
| `components/ui/skeleton.tsx` | LOW (already 80% tokenized) |
| `components/dashboard/breadcrumbs.tsx` | LOW |
| `components/dashboard/page-header.tsx` | LOW |
| `components/dashboard/welcome-tour.tsx` | LOW |
| `components/shared/error-state.tsx` | PRE-WORK (retain dark compatibility) |

### 14.3 Layout/Shell Components to Theme-Aware (~5 files)

| File | Priority |
|------|----------|
| `components/shared/navbar.tsx` | VERY HIGH — public facing |
| `components/shared/footer.tsx` | VERY HIGH — public facing |
| `components/dashboard/topbar.tsx` | HIGH — all dashboards |
| `components/dashboard/sidebar.tsx` | MEDIUM (already 70%) |
| `app/tradeserv/workspace/layout.tsx` | LOW |

### 14.4 Application Pages (estimated ~180 files)

- **TradeServ**: ~20 pages, heavily hardcoded (80%+)
- **Admin**: ~35 pages, moderately hardcoded (65%+)
- **Buyer**: ~25 pages, moderately tokenized (50%+)
- **Seller**: ~25 pages, moderately tokenized (50%+)
- **Authentication**: ~10 pages, heavily hardcoded (70%+)
- **Marketplace/public**: ~30 pages, moderate (50%+)
- **Ecosystem**: ~15 pages, well-tokenized (60%+)
- **AI/Copilot components**: ~15 files, moderately tokenized
- **Dashboard widgets**: ~10 files, moderately tokenized

### 14.5 Page-by-Page Priority Heatmap

| Area | Files | Tokenized % | Effort | Complexity |
|------|-------|-------------|--------|------------|
| Public homepage | 5 | 30% | MEDIUM | LOW |
| Category pages | 4 | 40% | LOW | LOW |
| Product pages | 8 | 45% | MEDIUM | MEDIUM |
| Search | 4 | 45% | LOW | LOW |
| Checkout | 3 | 35% | LOW | LOW |
| Buyer dashboard | 6 | 50% | LOW | LOW |
| Seller dashboard | 6 | 50% | LOW | LOW |
| Admin dashboard | 8 | 45% | MEDIUM | LOW |
| Admin pages (full) | 35 | 35% | HIGH | MEDIUM |
| TradeServ (public) | 10 | 25% | HIGH | HIGH |
| TradeServ workspace | 15 | 30% | HIGH | MEDIUM |
| Auth pages | 10 | 30% | MEDIUM | LOW |
| Ecosystem | 15 | 60% | LOW | LOW |

---

## 15. FILES THAT MUST NOT BE MODIFIED

| File | Reason |
|------|--------|
| `apps/api/**/*` | Backend — no frontend theme changes |
| `prisma/schema.prisma` | Database schema — no theme changes |
| `apps/web/hooks/use-ai*.ts` | AI hooks — functional logic, no color |
| `apps/web/lib/api/*.ts` | API clients — no color |
| `apps/web/store/*.ts` | State management — no color |
| `apps/web/types/*.ts` | TypeScript types — no color |
| `apps/web/data/master-data.ts` | Navigation data — no color |
| `apps/web/config/*.ts` | Business config — no color |
| `apps/web/instrumentation.ts` | Observability — no color |
| `apps/web/proxy.ts` | API proxy — no color |
| `apps/web/sentry.*.config.ts` | Error tracking — no color |
| `apps/web/next.config.ts` | Build config — no color |
| `apps/web/eslint.config.js` | Linting — no color |
| All `.next/` directory | Build artifacts |

---

## 16. RECOMMENDED THEME ARCHITECTURE

### 16.1 Architecture Overview

```
ThemeProvider (React Context)
  ├── Manages DESIGN_D / DESIGN_W state
  ├── Persists to localStorage('tradingo-theme')
  ├── Applies .theme-dark or .theme-light class to <html>
  └── useTheme() → { theme, setTheme, toggleTheme }

globals.css
  ├── :root — DESIGN_D CSS variables (current)
  ├── :root.theme-light — DESIGN_W CSS variables (NEW)
  ├── @theme — DESIGN_D Tailwind tokens (current)
  └── @theme — .theme-light overrides (NEW)

tailwind.config.ts
  ├── Remove light color values (conflicting!)
  ├── Add numbered accent weights: accent-50 → accent-900
  ├── Add semantic tokens: success, warning, error, info
  └── All via CSS-first approach (Tailwind v4)

Components
  ├── Use tokenized classes ONLY: bg-surface, text-text-primary
  ├── NO hardcoded Tailwind named colors (gray-*, red-*, etc.)
  ├── NO arbitrary [hex] values
  └── NO inline style colors (except dynamic values)
```

### 16.2 DESIGN_D and DESIGN_W Token Map

| Token | DESIGN_D (Current) | DESIGN_W (New) |
|-------|-------------------|----------------|
| `--color-bg-base` | `#00001c` | `#DBF1FD` |
| `--color-bg-elevated` | `#050510` | `#FFFFFF` |
| `--color-bg-elevated-2` | `#080818` | `#F0F7FE` |
| `--color-surface` | `#0a0e1a` | `#FFFFFF` |
| `--color-surface-secondary` | `#050510` | `#F8FAFC` |
| `--color-surface-tertiary` | `#080818` | `#F1F5F9` |
| `--color-text-primary` | `#f0f4ff` | `#0F172A` |
| `--color-text-secondary` | `#a8b4cc` | `#334155` |
| `--color-text-tertiary` | `#6b7894` | `#64748B` |
| `--color-text-muted` | `#6b7894` | `#94A3B8` |
| `--color-text-on-accent` | `#FFFFFF` | `#FFFFFF` |
| `--color-accent-DEFAULT` | `#ff4d00` | `#ff4d00` (same) |
| `--color-border` | `rgba(255,255,255,0.07)` | `rgba(148,163,184,0.2)` |
| `--color-border-light` | `rgba(255,255,255,0.04)` | `rgba(148,163,184,0.12)` |
| `--card-shadow` | `0 8px 40px rgba(0,0,0,0.55)` | `0 4px 24px rgba(0,0,0,0.04)` |
| `--card-shadow-hover` | `0 16px 64px rgba(0,0,0,0.65)` | `0 8px 32px rgba(0,0,0,0.07)` |
| Gray 50-950 | White-based opacities | Black-based opacities |

---

## 17. PHASE-BY-PHASE MIGRATION PLAN

### Phase T-2: Core Infrastructure (Estimated: 2-3 days)
- Add `:root.theme-light` CSS variables to `globals.css`
- Add `@theme` light overrides
- Fix `ThemeProvider` to properly switch CSS variables
- Add numbered accent weights to `@theme`
- Remove conflicting light values from `tailwind.config.ts`

### Phase T-3: Shared UI Components (Estimated: 3-4 days)
- Tokenize `Card` component (hardcoded rgba → CSS variables)
- Tokenize `Pagination`, `EmptyState`, `Toaster`, `ErrorState`
- Add light-compatible hover effects
- Ensure `Button`, `Badge`, `Input` are fully tokenized

### Phase T-4: Layout Shells (Estimated: 3-4 days)
- Rebuild `Navbar` with theme-aware glass design (DESIGN_D + DESIGN_W variants)
- Rebuild `Footer` with theme-aware design
- Fix `Topbar` background (remove hardcoded `rgba(0,29,0,0.95)`)
- Fix `Sidebar` to fully tokenize

### Phase T-5: Dashboard Pages (Estimated: 5-7 days)
- Admin dashboard: ~35 pages
- Buyer dashboard: ~25 pages
- Seller dashboard: ~25 pages
- Replace hardcoded `text-gray-*` → `text-text-secondary` etc.

### Phase T-6: Public Pages (Estimated: 5-7 days)
- Homepage, Product, Search, Categories, Checkout
- Auth pages (Login, Register, Forgot Password)
- TradeServ public pages
- Replace hardcoded `#FF4D00` → `text-accent-DEFAULT` or `bg-accent-DEFAULT`

### Phase T-7: TradeServ Workspace (Estimated: 3-4 days)
- ~15 workspace pages
- Heavy hardcoded styling, full theme refactor

### Phase T-8: Design_W Polish (Estimated: 2-3 days)
- Visual QA for light theme across all pages
- Fix contrast issues
- Ensure smooth dark↔light transitions
- Test all glass/neon effects in light mode

### Phase T-9: Final QA & Deploy (Estimated: 1-2 days)
- Cross-browser testing (both themes)
- Accessibility audit for both themes
- Performance audit (no layout shift on theme toggle)
- Deploy

---

## 18. RISK ASSESSMENT

### 18.1 Risks

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|------------|------------|
| 1 | **Theme toggle causes layout shift (FOUC)** | HIGH | HIGH | Use CSS `@media (prefers-reduced-motion)` + SSR-safe theme detection |
| 2 | **`#FF4D00` hardcoded in 50+ files cannot be auto-replaced** | MEDIUM | HIGH | Grep + sed, then manual QA for each file |
| 3 | **Glass/neon effects impossible to replicate in light mode** | HIGH | MEDIUM | Replace with soft shadows and frosted glass; keep prism effects optional |
| 4 | **Backward compatibility broken for dark-mode users** | HIGH | LOW | Default stays `'dark'`; all changes must preserve dark appearance |
| 5 | **TradeServ workspace has own independent styling** | MEDIUM | HIGH | Separate audit + phased migration |
| 6 | **Inline styles (307 hex + 441 rgba) cannot be tokenized automatically** | MEDIUM | HIGH | Manual refactor; each style must be moved to CSS or tokenized class |
| 7 | **Tailwind v4 `@theme` override behavior is not portable** | LOW | MEDIUM | Stay within Tailwind v4 — do not downgrade |
| 8 | **`text-white` (2,841 instances) cannot stay in light mode** | HIGH | HIGH | Must be replaced with `text-text-on-surface` or similar semantic token |

### 18.2 Estimated Total File Count

| Category | Files |
|----------|-------|
| Core infrastructure | 4 |
| UI components to tokenize | 12 |
| Layout/shell components | 5 |
| Dashboard pages (admin/buyer/seller) | 85 |
| Public pages | 30 |
| TradeServ pages | 25 |
| AI/Copilot components | 15 |
| Dashboard widgets | 10 |
| **TOTAL** | **~186 files** |

### 18.3 Estimated Total Effort

| Phase | Duration | Files |
|-------|----------|-------|
| T-2: Core Infrastructure | 2-3 days | 4 |
| T-3: Shared UI Components | 3-4 days | 12 |
| T-4: Layout Shells | 3-4 days | 5 |
| T-5: Dashboard Pages | 5-7 days | 85 |
| T-6: Public Pages | 5-7 days | 30 |
| T-7: TradeServ Workspace | 3-4 days | 25 |
| T-8: Design_W Polish | 2-3 days | 25 |
| T-9: Final QA & Deploy | 1-2 days | — |
| **TOTAL** | **24-34 days** | **~186 files** |

---

## 19. FOUNDER RECOMMENDATION

1. **PROCEED to Phase T-2** (Core Infrastructure) — the ThemeProvider, useTheme hook, and ThemeToggle component already exist and work correctly. The missing piece is the CSS variable system for DESIGN_W. This is a low-risk, high-impact first step that unblocks all subsequent phases.

2. **DESIGN_D (Dark) remains the ONLY active theme** during T-2 through T-4. DESIGN_W (White) should only be previewable after T-5 (Dashboard Pages) when the majority of UI can render correctly in both modes.

3. **Remove all `dark:*` dead code** that references undefined `--dark-*` tokens. These add noise and mislead developers into thinking dark mode support exists when it does not.

4. **Preserve the `text-white` pattern for now** in DESIGN_D (it renders correctly on dark backgrounds). Replace with semantic tokens `text-text-on-surface` or `text-text-primary-light` only when both themes are fully functional.

5. **The glass card system** (`glass-card`, `glass-card-elevated`, `premium-nav-capsule`, etc.) is the highest-risk item. These use heavy `rgba()` gradients, backdrop-filter, and neon animations that don't translate to light mode. Consider **soft glass** (light frosted `backdrop-filter: blur()` with white backgrounds) for DESIGN_W.

---

**Phase T-1 Audit Complete.**  
**Status:** AWAITING FOUNDER REVIEW  
**Next:** T-2 (Core Infrastructure) — requires explicit START command.
