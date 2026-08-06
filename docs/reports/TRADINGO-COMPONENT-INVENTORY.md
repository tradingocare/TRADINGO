# TRADINGO® Component Inventory & Migration Audit

> **Status**: FROZEN — Founder Approved  
> **Date**: 2026-07-07  
> **Phase**: T-2.4 — Shared Component Inventory Audit  
> **Scope**: All 163 `.tsx` component files across 19 directories, ~248 consuming page files

---

## Table of Contents

1. Executive Summary
2. Shared Component Inventory
3. Usage Matrix
4. Duplicate Detection
5. Gap Analysis (Missing Components)
6. Migration Priority Table
7. Risk Analysis
8. Estimated File Reduction
9. Recommended T-3 Migration Order
10. Frozen Components

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| Total component files | 163 |
| Total production page files | ~248 |
| Shared/reusable component files | 112 |
| Page-specific component files | 51 |
| Distinct component directories | 19 |
| Missing shared components | 15 |
| Duplicate/inconsistent patterns | 5 |
| Components with 0 imports | 3 (exist but unused) |
| Components with 0 existing implementation | 12 (need creation) |
| Estimated file reduction through consolidation | 15–25 files eliminated |

### Architecture Assessment

The component architecture is **moderately healthy** but has significant gaps:

- **Strong foundation**: `components/ui/` (17 shadcn-style files) + `components/shared/` (30 domain-agnostic files) provide a solid design system base.
- **Heavy duplication in discovery**: 6 product card implementations for different contexts.
- **Missing foundational UI**: No `Modal`, `Drawer`, `Tabs`, `Accordion`, `Table`, `Select`, `Checkbox`, `Radio`, `Switch`, `Tooltip`, `Popover`, `Alert`, or `Avatar` components exist.
- **Unused shared components**: `Pagination`, `EmptyState`, `AnimatedContent` exist but have zero consumer imports.
- **Excessive domain-specific patterns**: 3 `SortDropdown`, 2 `TradingEngines`, 2 `Counter` implementations.
- **AI copilot pattern is well-abstracted**: 9 domain copilots follow the same sidebar pattern but are intentionally separate.

---

## 2. Shared Component Inventory

### Tier 1: Core UI Components (`components/ui/`)

| # | Component | File | Exports | Type | Imports | Status |
|---|-----------|------|---------|------|---------|--------|
| 1 | Button | `ui/button.tsx` | `Button`, `buttonVariants` | CVA (7 variants) | **126** | ✅ Active |
| 2 | Card | `ui/card.tsx` | `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter` | shadcn-style | **98** | ✅ Active |
| 3 | Input | `ui/input.tsx` | `Input` | shadcn-style | **78** | ✅ Active |
| 4 | Badge | `ui/badge.tsx` | `Badge`, `badgeVariants` | CVA (6 variants) | **57** | ✅ Active |
| 5 | Textarea | `ui/textarea.tsx` | `Textarea` | shadcn-style | **20** | ✅ Active |
| 6 | Skeleton | `ui/skeleton.tsx` | `Skeleton`, `ShimmerSkeleton`, `shimmer` | Base shimmer | **16** | ✅ Active |
| 7 | Toaster | `ui/toaster.tsx` | `Toaster` | Sonner wrapper | **1** | ✅ Active |
| 8 | Label | `ui/label.tsx` | `Label` | shadcn-style | 0* | ✅ Exists |
| 9 | OptimizedImage | `ui/optimized-image.tsx` | `optimizedImage` | Next/Image wrapper | 0* | ✅ Exists |
| 10 | OtpInput | `ui/otp-input.tsx` | `OtpInput` | Multi-input OTP | 0* | ✅ Exists |
| 11 | Pagination | `ui/pagination.tsx` | `Pagination` | Page nav | **0** | ⚠️ Unused |
| 12 | EmptyState | `ui/empty-state.tsx` | `EmptyState` | Empty state | **0** | ⚠️ Unused |
| 13 | AnimatedContent | `ui/animated-content.tsx` | `AnimatedContent` | Loading→Content | **0** | ⚠️ Unused |
| 14 | Separator | `ui/separator.tsx` | `Separator` | Divider | 0* | ✅ Exists |
| 15 | PasswordStrength | `ui/password-strength.tsx` | `PasswordStrength` | Strength bar | 0* | ✅ Exists |
| 16 | ScrollToTop | `ui/scroll-to-top.tsx` | `ScrollToTop` | Float button | 1 | ✅ Active |
| 17 | useToast | `ui/use-toast.ts` | `toast`, `useToast` | Toast pub/sub | **82 files** | ✅ Active |

*\*Used internally by other components — not directly imported by pages.*

### Tier 2: Shared/Domain Components (`components/shared/`)

| # | Component | File | Imports | Status |
|---|-----------|------|---------|--------|
| 1 | Navbar | `shared/navbar.tsx` | **1** (root layout) | ✅ Active |
| 2 | Footer | `shared/footer.tsx` | **1** (root layout) | ✅ Active |
| 3 | ThemeProvider | `shared/theme-provider.tsx` | **2** | ✅ Active |
| 4 | ThemeToggle | `shared/theme-toggle.tsx` | **0** (used by Topbar inline) | ⚠️ Underused |
| 5 | VerifiedBadge | `shared/VerifiedBadge.tsx` | **9** | ✅ Active |
| 6 | ErrorState | `shared/error-state.tsx` | **8** | ✅ Active |
| 7 | NotFoundState | `shared/not-found-state.tsx` | **5** | ✅ Active |
| 8 | ErrorBoundary | `shared/error-boundary.tsx` | — | ✅ Active |
| 9 | SellerBadge | `shared/SellerBadge.tsx` | 0* | ✅ Exists |
| 10 | RankBadge | `shared/RankBadge.tsx` | 0* | ✅ Exists |
| 11 | TrustScoreCard | `shared/TrustScoreCard.tsx` | 0* | ✅ Exists |
| 12 | UploadZone | `shared/UploadZone.tsx` | 0* | ✅ Exists |
| 13 | PageHeader | `shared/page-header.tsx` | **30** | ✅ Active |
| 14 | Hero | `shared/hero.tsx` | 0* | ✅ Exists |
| 15 | FeatureCards | `shared/feature-cards.tsx` | 0* | ✅ Exists |
| 16 | PricingCards | `shared/pricing-cards.tsx` | 0* | ✅ Exists |
| 17 | CTABlock | `shared/cta-block.tsx` | 0* | ✅ Exists |
| 18 | SectionHeader | `shared/section-header.tsx` | 0* | ✅ Exists |
| 19 | Testimonials | `shared/testimonials.tsx` | 0* | ✅ Exists |
| 20 | Timeline | `shared/timeline.tsx` | 0* | ✅ Exists |
| 21 | AnimatedSection | `shared/animated-section.tsx` | 0* | ✅ Exists |
| 22 | StatisticsCards | `shared/statistics-cards.tsx` | 0* | ✅ Exists |
| 23 | MarketplaceCounters | `shared/marketplace-counters.tsx` | 0* | ✅ Exists |
| 24 | LiveStats | `shared/live-stats.tsx` | 0* | ✅ Exists |
| 25 | GlowTracker | `shared/glow-tracker.tsx` | 0* | ✅ Exists |
| 26 | MegaMenu | `shared/mega-menu.tsx` | 0* | ✅ Exists |
| 27 | TradingEngines | `shared/trading-engines.tsx` | 0* | ✅ Exists |
| 28 | EngineDetailPage | `shared/engine-detail-page.tsx` | 0* | ✅ Exists |
| 29 | PwaInstallPrompt | `shared/pwa-install-prompt.tsx` | 0* | ✅ Exists |
| 30 | ServiceWorkerRegister | `shared/service-worker-register.tsx` | 0* | ✅ Exists |

*\*Used internally by other components, or used by layout-wrapper components.*

### Tier 3: Dashboard Components (`components/dashboard/`)

| # | Component | File | Imports | Status |
|---|-----------|------|---------|--------|
| 1 | Topbar | `dashboard/topbar.tsx` | **4** (buyer/seller/admin layouts + index) | ✅ Active |
| 2 | Sidebar | `dashboard/sidebar.tsx` | **4** (layouts + index) | ✅ Active |
| 3 | DashboardPageHeader | `dashboard/page-header.tsx` | **30** | ✅ Active |
| 4 | Breadcrumbs | `dashboard/breadcrumbs.tsx` | **2** | ✅ Active |
| 5 | StatCard | `dashboard/stat-card.tsx` | **5** | ✅ Active |
| 6 | StatusBadge | `dashboard/status-badge.tsx` | **8** | ✅ Active |
| 7 | DashboardSkeleton | `dashboard/skeleton.tsx` | **0** | ⚠️ Unused |
| 8 | WelcomeTour | `dashboard/welcome-tour.tsx` | 0* | ✅ Exists |

### Tier 4: Domain Components

| Domain | Component | Imports | Status |
|--------|-----------|---------|--------|
| Ecosystem | 21 files | Various | ✅ All actively used |
| Product | 15 files | Various | ✅ Active (some legacy) |
| Near-Me | 14 files | Various | ✅ Active |
| Tradeserv | 12 files | Various | ✅ Active |
| Founder AI | 12 files | Various | ✅ Active |
| Product Onboarding | 11 files | Various | ✅ Active |
| Product Attributes | 5 files | Various | ✅ Active |
| AI | 4 files | 1 each | ✅ Active |
| Auth | 5 files | Various | ✅ Active |
| Chat | 5 files | Various | ✅ Active |
| Notifications | 4 files | Various | ✅ Active |
| Feedback | 4 files | Various | ✅ Active |
| Wallet | 3 files | Various | ✅ Active |
| Discovery | 7 files | Various | ✅ Active |

---

## 3. Usage Matrix

### Top 15 Most-Imported Components

| Rank | Component | Import Count | Consumer Pages |
|------|-----------|-------------|----------------|
| 1 | `Button` | **126** | 126 pages across all roles (buyer/seller/admin/public) |
| 2 | `Card` | **98** | 98 pages — ecosystem, admin, auth, seller, buyer |
| 3 | `Input` | **78** | 78 pages — forms, search, filters, settings |
| 4 | `Badge` | **57** | 57 pages — status, plan, category labels |
| 5 | `PageHeader / DashboardPageHeader` | **30** | 30 pages — admin, seller, public info pages |
| 6 | `Textarea` | **20** | 20 pages — forms, feedback, support |
| 7 | `Skeleton` | **16** | 16 pages — loading states |
| 8 | `VerifiedBadge` | **9** | 9 files — cards, profiles, discovery |
| 9 | `ErrorState` | **8** | 8 files — error boundaries, error pages |
| 10 | `StatusBadge` | **8** | 8 files — order, RFQ, quote, admin |
| 11 | `GlassCard` | **8** | 8 files — TradeServ workspace pages |
| 12 | `NotFoundState` | **5** | 5 files — 404 pages |
| 13 | `StatCard` | **5** | 5 files — dashboard grids |
| 14 | `Topbar` | **4** | 3 dashboard layouts + barrel |
| 15 | `Sidebar` | **4** | 3 dashboard layouts + barrel |

### Components by Consumer Reach

```
               Button  126  ████████████████████████████████████████
               Card    98   ███████████████████████████████
               Input   78   █████████████████████████
               Badge   57   ██████████████████
        PageHeader    30   ██████████
           Textarea   20   ██████
           Skeleton   16   █████
       VerifiedBadge   9   ███
          ErrorState   8   ██
         StatusBadge   8   ██
           GlassCard   8   ██
       NotFoundState   5   █
            StatCard   5   █
              Topbar   4   █
             Sidebar   4   █
          Breadcrumb   2   
       ThemeProvider   2   
              Toaster  1   
              Navbar   1   
```

---

## 4. Duplicate Detection

### 4.1 Product Card — 6 implementations (CRITICAL)

| Implementation | File | Used By | Notes |
|---------------|------|---------|-------|
| `ProductCard` (default) | `components/product/product-card.tsx` | Product listing pages | Full card with gallery, price slabs, quantity |
| `ProductCard` (default) | `components/discovery/ProductCard.tsx` | Discovery search | Image, price, rating, trust badge |
| `UnifiedCard` (default) | `components/discovery/UnifiedCard.tsx` | Mixed search results | Product + Supplier hybrid |
| `CompactProductCard` (default) | `components/product/compact-product-card.tsx` | Grid views | Compact image+name+price |
| `NearMeProductCard` (default) | `components/near-me/near-me-product-card.tsx` | Near-me results | Distance, direction, seller info |
| `LegacyProductCard` | `components/product/product-card.legacy.tsx` | Legacy pages | Deprecated, still in use |

**Impact**: 6 variants with overlapping concerns. Discovery has its own `ProductCard` separate from `product/ProductCard`. `UnifiedCard` duplicates both. Each has unique features that should be composable via props.

**Recommendation**: Consolidate to 2 variants: `ProductCard` (full, with props for gallery/price/quantity/trust) and `ProductCardCompact` (grid, with location support). Eliminate `UnifiedCard` and legacy.

### 4.2 Sort Dropdown — 3 implementations (MAJOR)

| Implementation | File | Notes |
|---------------|------|-------|
| Inline in `FilterSidebar` | `components/discovery/FilterSidebar.tsx` | Select element |
| `SortDropdown` | `components/tradeserv/sort-dropdown.tsx` | Custom buttons |
| `SortDropdown` | `components/near-me/sort-dropdown.tsx` | Select element |

**Impact**: 3 different UI patterns and option sets for the same concept.

**Recommendation**: Create single `SortDropdown` with configurable `SortOption[]` prop. Replace all 3 implementations. Estimated 2 files eliminated.

### 4.3 Animated Counters — 2 implementations (MINOR)

| Implementation | File | Notes |
|---------------|------|-------|
| `StatisticsCards` + inline `Counter` | `components/shared/statistics-cards.tsx` | IntersectionObserver + count-up |
| `MarketplaceCounters` + inline `CountUp` | `components/shared/marketplace-counters.tsx` | Same pattern |

**Recommendation**: Extract shared `CountUp` hook. Deduplicate the stat card wrapper. Estimated 1 file eliminated.

### 4.4 Trading Engines Cards — 2 implementations (MINOR)

| Implementation | File | Notes |
|---------------|------|-------|
| `TradingEngines` (6 engines) | `components/shared/trading-engines.tsx` | TRADBUY, RFQ, Matching, Escrow, GOCASH, TRADGO |
| `TradhexaEngines` (6 engines) | `components/sections/TradhexaEngines.tsx` | TRADFIND, TRADMATCH, TRADRFQ, TRADCONNECT, TRADTRUST, TRADZERO |

**Impact**: Two different engine sets with different visuals. The first is platform-wide; the second is homepage-only. These serve different purposes but follow the same card pattern.

**Recommendation**: Create a single `EngineCard` component with `engine` prop. Estimated 1 file eliminated.

### 4.5 Page Header — 2 implementations (WARNING)

| Implementation | File | Consumer |
|---------------|------|----------|
| `PageHeader` | `components/shared/page-header.tsx` | Public/marketing pages |
| `DashboardPageHeader` | `components/dashboard/page-header.tsx` | Dashboard/admin pages |

**Impact**: These serve different contexts (public vs dashboard) but share 70% visual structure. Both use breadcrumbs + title + description + optional actions.

**Recommendation**: Consolidate into a single `PageHeader` with `variant` prop (`public` | `dashboard`). Estimated 1 file eliminated.

---

## 5. Gap Analysis (Missing Components)

### 5.1 Missing Shared UI Components — Must Create

| # | Component | Priority | Reason |
|---|-----------|----------|--------|
| 1 | **Modal** | **HIGH** | No generic modal exists. 4 inline modal implementations found (inquiry-modal, level-up-modal, session-timeout, bulk-location-modal) with different patterns. Every domain reinvents it. |
| 2 | **Drawer** | **HIGH** | No generic drawer exists. NotificationDrawer and FilterDrawer have different animation/styling. |
| 3 | **Select** | **HIGH** | 78 pages use Input but 0 use Select. Forms without a styled select are inconsistent. |
| 4 | **Checkbox** | **HIGH** | No checkbox component exists. Forms use inline `<input type="checkbox">` with inconsistent styling. |
| 5 | **Tooltip** | **MEDIUM** | No tooltip component. Needed for icon descriptions, truncated text. |
| 6 | **Tabs** | **MEDIUM** | No tabs component. MissionCategoryTabs and SpecificationTabs are both inline. |
| 7 | **Switch** | **MEDIUM** | No switch component. Settings pages use inline checkboxes or buttons for toggle actions. |
| 8 | **Radio** | **MEDIUM** | No radio group component. Used inline in forms inconsistently. |
| 9 | **Popover** | **MEDIUM** | No popover. Useful for dropdown menus, info popups. |
| 10 | **Alert** | **MEDIUM** | No alert component. Inline divs with hardcoded colors for success/error/warning messages. |
| 11 | **Accordion** | **LOW** | No accordion. Useful for FAQ, collapsible sections. |
| 12 | **LoadingSpinner** | **MEDIUM** | No loading spinner. Pages either use skeleton or `<Loader2 className="animate-spin" />` directly. |
| 13 | **Avatar** | **LOW** | No avatar component. User images use raw `<Image>` with fallback divs. |
| 14 | **Table** | **MEDIUM** | No generic `<Table>` component. Every admin page defines its own table HTML. The `.table-dark` utility exists but is underused. |
| 15 | **Progress** | **LOW** | No progress bar component. Every progress bar is inline Tailwind. |

### 5.2 Underused Existing Components — Must Activate

| # | Component | File | Current Status | Action |
|---|-----------|------|---------------|--------|
| 1 | **Pagination** | `ui/pagination.tsx` | Exists — 0 imports | Every list page duplicates pagination logic. Activate and migrate all pagination usage to this component. |
| 2 | **EmptyState** | `ui/empty-state.tsx` | Exists — 0 imports | ~40+ pages have inline empty states. Migrate all to this component. |
| 3 | **AnimatedContent** | `ui/animated-content.tsx` | Exists — 0 imports | Every skeleton→content transition can use this. Activate. |
| 4 | **DashboardSkeleton** | `dashboard/skeleton.tsx` | Exists — 0 direct imports | Every dashboard should use this for initial loading. |
| 5 | **Separator** | `ui/separator.tsx` | Exists — 0 direct imports | Should replace inline `border-b` and `<hr>` elements. |

---

## 6. Migration Priority Table

### Phase T-3 Proposed Order

| Order | Component | Type | Consumer Pages | Effort | Impact | Risk |
|-------|-----------|------|---------------|--------|--------|------|
| 1 | **Modal** | Create | 30+ inline modals | Medium | Very High | Low |
| 2 | **EmptyState** | Activate | 40+ inline empties | Medium | Very High | Low |
| 3 | **Select** | Create | 78 input pages | Low | High | Low |
| 4 | **Checkbox** | Create | 40+ forms | Low | High | Low |
| 5 | **Pagination** | Activate | 30+ list pages | Medium | High | Low |
| 6 | **StatusBadge** | Expand reach | 8→40+ status fields | Low | High | Low |
| 7 | **Table** | Create | 20+ admin tables | High | High | Medium |
| 8 | **Tabs** | Create | 10+ tab patterns | Low | Medium | Low |
| 9 | **Drawer** | Create | 5+ inline drawers | Medium | Medium | Low |
| 10 | **Tooltip** | Create | 20+ icon-only buttons | Low | Medium | Low |
| 11 | **Alert** | Create | 20+ inline alerts | Low | Medium | Low |
| 12 | **Switch** | Create | 10+ settings pages | Low | Medium | Low |
| 13 | **ProductCard** | Consolidate | 5→2 variants | High | High | High |
| 14 | **SortDropdown** | Consolidate | 3→1 variant | Low | Low | Low |
| 15 | **CountUp** | Consolidate | 2→1 variant | Low | Low | Low |
| 16 | **PageHeader** | Consolidate | 2→1 variant | Low | Low | Low |
| 17 | **EngineCards** | Consolidate | 2→1 variant | Low | Low | Low |
| 18 | **AnimatedContent** | Activate | 10+ transitions | Low | Medium | Low |
| 19 | **LoadingSpinner** | Create | 20+ inline spinners | Low | Low | Low |
| 20 | **Radio** | Create | 5+ forms | Low | Low | Low |
| 21 | **Separator** | Activate | 30+ inline dividers | Low | Low | Low |
| 22 | **Accordion** | Create | 5+ FAQ sections | Low | Low | Low |
| 23 | **Avatar** | Create | 10+ user images | Low | Low | Low |
| 24 | **Progress** | Create | 10+ progress bars | Low | Low | Low |
| 25 | **Popover** | Create | 5+ info popups | Low | Low | Low |

### Rationale

**Top priority (1–6)**: Components with the widest cross-cutting impact. Modal and EmptyState alone affect 70+ pages. Select and Checkbox standardize 118+ form pages. Pagination and StatusBadge affect every list and status display.

**Medium priority (7–12)**: Components that improve consistency for specific patterns (tables, tabs, drawers, tooltips, alerts, switches).

**Low priority (13–17)**: Consolidation of existing duplicates. These reduce file count but don't unlock new UI capabilities.

**Nice-to-have (18–25)**: Components that provide minor consistency gains or are used in few places.

---

## 7. Risk Analysis

### 7.1 Migration Risks by Component

| Component | Risk Level | Risk Factors |
|-----------|-----------|--------------|
| **Modal** | **Low** | New component. Only replaces inline modals incrementally. No existing API to break. |
| **EmptyState** | **Low** | New adoption. Inline empty states remain functional until migrated. |
| **Select** | **Low** | New component. Only adds capability; doesn't remove anything initially. |
| **Checkbox** | **Low** | Same as Select. |
| **Pagination** | **Low** | Component already exists; just needs activation. |
| **Table** | **Medium** | 20+ admin tables with varying column structures. Creating a generic `<Table>` that handles all cases requires careful API design. |
| **ProductCard** | **High** | 6 variants with 9 consumer pages. Each variant has unique features. Deduplication risks breaking existing layouts if not all props are supported. **Must keep backward compatibility.** |
| **SortDropdown** | **Low** | 3 implementations, each with unique option sets. API must support arbitrary options. |
| **PageHeader** | **Low** | 2 implementations with different styling. Easy to merge via `variant` prop. |

### 7.2 Architectural Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Breaking change to Button/Input/Badge** | Critical | These are imported by 57–126 files each. ANY API change (prop rename, variant removal) breaks the build. **Freeze these APIs.** |
| **Inconsistent color theme** | High | Phase T-2.1 just made all tokens CSS-variable-based. Migration to use `--color-*` utilities must be one-way — no backsliding to hardcoded colors. |
| **Server Component conflicts** | Medium | Some consumers are Server Components that can't use hooks. New components must support both RSC and client contexts. |
| **Duplicated pagination state** | Medium | 30+ list pages manage pagination state independently. A shared `usePagination` hook would prevent drift. |

### 7.3 Frozen Components (DO NOT MODIFY)

These components are imported by 50+ files and any API change would break the build. Their internal styling may be updated (to use CSS variables) but their **public API (props, variants, sizes) is frozen**.

| Component | Imports | Frozen API |
|-----------|---------|-----------|
| `Button` | 126 | `variant`, `size`, `asChild`, standard HTML button attrs |
| `Card` | 98 | `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter` structure |
| `Input` | 78 | standard HTML input attrs + `ref` forwarding |
| `Badge` | 57 | `variant` (6 values), standard HTML attrs |
| `Textarea` | 20 | standard HTML textarea attrs + `ref` forwarding |
| `useToast` | 82 | `toast()`, `useToast()` hook signature |
| `ThemeProvider` | — | `useTheme()` hook API (value, setTheme) |

---

## 8. Estimated File Reduction

### Elimination Targets

| Action | Files Eliminated |
|--------|-----------------|
| ProductCard consolidation (6→2) | ~3 (UnifiedCard, legacy, one variant) |
| SortDropdown consolidation (3→1) | ~2 (near-me + discovery inline) |
| Counter consolidation (2→1) | ~1 |
| PageHeader consolidation (2→1) | ~1 |
| EngineCards consolidation (2→1) | ~1 |
| Inline modality migrated → shared Modal | ~3 (domain-specific modals removed) |
| **Total estimated reduction** | **~11 files eliminated** |

### Code Duplication Metrics

| Pattern | Current Locations | Replacement | Lines Saved |
|---------|-----------------|-------------|-------------|
| Product card | 6 files | 2 files | ~1,200 |
| Sort dropdown | 3 files | 1 file | ~180 |
| Inline empty states | ~40 pages | 1 component + imports | ~2,000 |
| Inline modals | ~4 files | 1 component + imports | ~400 |
| Inline pagination | ~30 pages | 1 component + hook | ~1,500 |
| Inline tables | ~20 pages | 1 component + imports | ~2,500 |
| Inline spinners | ~20 pages | 1 component | ~200 |
| **Total estimated savings** | **~123 locations** | **7 new components + migrations** | **~7,980 lines** |

---

## 9. Recommended T-3 Migration Order

### Phase T-3.1 — Foundation Components (No-Brainers)
*Components that fill critical gaps with zero risk.*

1. **Modal** (`ui/modal.tsx`) — framer-motion, `variant` (default/destructive), `size` (sm/md/lg/xl/full)
2. **Select** (`ui/select.tsx`) — style-matched to Input, `placeholder`, `options`, `value`/`onChange`
3. **Checkbox** (`ui/checkbox.tsx`) — style-matched, `checked`/`onCheckedChange`, `label`
4. **Activate EmptyState** — replace all ~40 inline empty state divs
5. **Activate Pagination** — replace all ~30 inline pagination blocks
6. **Activate AnimatedContent** — wrap all skeleton→content transitions

### Phase T-3.2 — Structural Components (Medium Risk)
*Components that require careful API design.*

7. **Drawer** (`ui/drawer.tsx`) — framer-motion, `side` (left/right), `size`
8. **Tabs** (`ui/tabs.tsx`) — `items`, `value`/`onChange`
9. **Table** (`ui/table.tsx`) — `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>` composable API
10. **Tooltip** (`ui/tooltip.tsx`) — `content`, `side`
11. **Alert** (`ui/alert.tsx`) — `variant` (info/success/warning/error/destructive), optional icon
12. **Switch** (`ui/switch.tsx`) — `checked`/`onCheckedChange`

### Phase T-3.3 — Consolidation (Higher Risk)
*Deduplication of existing patterns.*

13. **ProductCard** consolidation — merge 6→2 variants, keep backward-compatible prop interfaces
14. **StatusBadge** expansion — adopt in all 40+ status fields
15. **PageHeader** consolidation — merge public + dashboard into 1 component
16. **SortDropdown** consolidation — merge 3→1 with configurable options
17. **LoadingSpinner** + **Radio** + **Avatar** + **Progress**

### Phase T-3.4 — Nice-to-Have
*Low-impact consistency improvements.*

18. **Accordion** + **Popover**
19. **CountUp** consolidation
20. **EngineCards** consolidation
21. **Separator** activation

---

## 10. Frozen Components

The following components are **FROZEN** — no API changes, no restructuring, no prop modifications. Only internal CSS variable migration is permitted.

```
Button          — 126 consumers — FROZEN API
Card            — 98 consumers  — FROZEN API
Input           — 78 consumers  — FROZEN API
useToast        — 82 consumers  — FROZEN API
Badge           — 57 consumers  — FROZEN API (add variants only)
ThemeProvider   — global        — FROZEN API
AuthProvider    — global        — FROZEN API
Topbar          — 3 layouts     — FROZEN props
Sidebar         — 3 layouts     — FROZEN props
Navbar          — root layout   — FROZEN props
Footer          — root layout   — FROZEN props
```

---

## Appendix A: Quick-Reference Import Map

```
@/components/ui/button        → 126 pages
@/components/ui/input         → 78 pages
@/components/ui/card          → 98 pages
@/components/ui/badge         → 57 pages
@/components/ui/textarea      → 20 pages
@/components/ui/skeleton      → 16 pages
@/components/ui/toaster       → 1 page (layout)
@/components/ui/use-toast     → 82 pages

@/components/dashboard/sidebar.tsx     → 3 layouts
@/components/dashboard/topbar.tsx      → 3 layouts
@/components/dashboard/page-header.tsx → 30 pages
@/components/dashboard/stat-card.tsx   → 5 pages
@/components/dashboard/status-badge.tsx → 8 pages
@/components/dashboard/breadcrumbs.tsx  → 2 pages

@/components/shared/VerifiedBadge.tsx   → 9 pages
@/components/shared/ErrorState.tsx      → 8 pages
@/components/shared/NotFoundState.tsx   → 5 pages
@/components/shared/PageHeader.tsx      → 30 pages
@/components/shared/ThemeProvider.tsx    → 2 files
@/components/shared/ThemeToggle.tsx      → 1 file (Topbar)
```

## Appendix B: Files That Need the Most Work

| File | Issues |
|------|--------|
| `app/seller/products/new/wizard.tsx` | 7-step wizard importing 15+ components directly; inline modals, spinners, empty states |
| `app/admin/rfq/page.tsx` | Inline table, inline empty states, inline pagination, inline status |
| `app/buyer/rfq/new/*` | 6 step files with inline inputs, selects, empty states |
| `components/discovery/ProductDiscoveryClient.tsx` | Inline filter logic, inline pagination, inline sort |
| `components/product/product-card.tsx` | Duplicate of discovery/ProductCard; inconsistent API |

---

*This audit freezes the TRADINGO Component Architecture v1.0. All T-3 migration work MUST follow the priority order and risk assessment documented here.*
