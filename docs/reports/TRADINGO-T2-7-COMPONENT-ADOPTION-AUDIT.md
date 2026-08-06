# TRADINGO® Component Adoption Audit — Phase T-2.7

> **Status**: AUDIT COMPLETE — No code modified  
> **Scope**: All 15 shared component types across all application modules  
> **Standard**: TRADINGO-DESIGN-LANGUAGE.md v1.0  
> **Date**: 2026-07-07

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| Total shared components in library | 15 |
| Total custom/inline implementations found | **658** |
| High-viability replacements | **336 (51%)** |
| Medium-viability replacements | **232 (35%)** |
| Low-viability replacements | **90 (14%)** |
| Files affected across all modules | **~230 unique files** |
| Estimated lines removed | **~12,000–15,000** |
| Reusable component import sites (current) | Button: ~127, Card: ~98, Input: ~78, Badge: ~40+ |
| **Current overall reuse rate** | **~35%** |
| **Target reuse rate after T-3** | **~85%** |

### Files Analyzed
- ~230 `.tsx` files in `apps/web/app/` (all buyer, seller, admin, tradeserv, public pages)
- ~95 `.tsx` files in `apps/web/components/` (shared, dashboard, ui, discovery, tradeserv, onboarding, etc.)

---

## 2. Component Adoption Matrix

### 2.1 Table — Primary Data

| Component | Library File | Custom Instances | High Viability | Medium Viability | Low Viability | Current Imports | Reuse % |
|-----------|-------------|-----------------|:--------------:|:----------------:|:-------------:|:---------------:|:-------:|
| **Button** | `ui/button.tsx` | 47 inline `<button>` | 35 | 12 | 0 | ~127 | 73% |
| **Card** | `ui/card.tsx` | ~141 inline card divs | 120 | 21 | 0 | ~98 | 41% |
| **Input** | `ui/input.tsx` | ~89 INPUT_CLASS + 14 inline + 37 textarea | 89 | 37 | 14 | ~78 + ~20 (textarea) | 42% |
| **Table** | `ui/table.tsx` | 39 inline `<table>` | 39 | 0 | 0 | **0** | **0%** |
| **Badge** | `ui/badge.tsx` | 37 inline badge spans | 19 | 18 | 0 | ~40+ | 52% |
| **Alert** | `ui/alert.tsx` | 23 inline alert boxes | 13 | 10 | 0 | 0 | 0% |
| **Modal** | `ui/modal.tsx` | 21 inline modal overlays | 14 | 4 | 3 | 0 | 0% |
| **Drawer** | `ui/drawer.tsx` | 4 inline drawers | 2 | 0 | 2 | 0 | 0% |
| **Tooltip** | `ui/tooltip.tsx` | 4 inline tooltips | 3 | 1 | 0 | 0 | 0% |
| **Tabs** | `ui/tabs.tsx` | 22 inline tab groups | 12 | 10 | 0 | 0 | 0% |
| **Accordion** | `ui/accordion.tsx` | 4 inline collapsibles | 0 | 2 | 2 | 0 | 0% |
| **Switch** | `ui/switch.tsx` | 7 inline toggles | 6 | 1 | 0 | 0 | 0% |
| **Checkbox** | `ui/checkbox.tsx` | 13 inline checkboxes | 13 | 0 | 0 | 0 | 0% |
| **Radio** | `ui/radio.tsx` | 1 inline radio group | 0 | 1 | 0 | 0 | 0% |
| **Select** | `ui/select.tsx` | 22 inline selects | 14 | 8 | 0 | 0 | 0% |
| **Progress** | `ui/progress.tsx` | 4 inline progress bars | 3 | 1 | 0 | 0 | 0% |
| **LoadingSpinner** | `ui/loading-spinner.tsx` | ~80 Loader2 + 19 CSS spinners | 19 | 80 | 0 | 0 | 0% |
| **EmptyState** | `ui/empty-state.tsx` | ~118 empty state patterns | 40 | 41 | 37 | **0** | **0%** |
| **Avatar** | `ui/avatar.tsx` | 27 inline avatar patterns | 13 | 6 | 8 | **0** | **0%** |
| **TOTAL** | **19** | **~658** | **336** | **232** | **90** | — | |

### 2.2 Reusable Component Usage Scorecard

```
  Current Usage          ┃ Target Usage (T-3)     ┃ Delta
━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━
  Button     73% ███████║ Button     95% █████████║ +22%
  Card       41% ████   ║ Card       85% ████████ ║ +44%
  Input      42% ████   ║ Input      90% █████████║ +48%
  Table       0%        ║ Table     100% ██████████║ +100%
  Badge      52% █████  ║ Badge      85% ████████ ║ +33%
  Alert       0%        ║ Alert      80% ████████ ║ +80%
  Modal       0%        ║ Modal      85% ████████ ║ +85%
  Drawer      0%        ║ Drawer     50% █████    ║ +50%
  Tooltip     0%        ║ Tooltip    80% ████████ ║ +80%
  Tabs        0%        ║ Tabs       90% █████████║ +90%
  Accordion   0%        ║ Accordion  50% █████    ║ +50%
  Switch      0%        ║ Switch    100% ██████████║ +100%
  Checkbox    0%        ║ Checkbox  100% ██████████║ +100%
  Radio       0%        ║ Radio     100% ██████████║ +100%
  Select      0%        ║ Select     90% █████████║ +90%
  Progress    0%        ║ Progress   80% ████████ ║ +80%
  LoadingSpnr 0%        ║ LoadingSpnr 90% █████████║ +90%
  EmptyState  0%        ║ EmptyState  70% ███████ ║ +70%
  Avatar      0%        ║ Avatar     80% ████████ ║ +80%
━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━
  OVERALL   35% ████    ║ OVERALL   85% ████████  ║ +50%
```

---

## 3. Detailed Findings by Component

### 3.1 Modal (`components/ui/modal.tsx`)
- **21 inline implementations** across 16 files
- **14 high-viability**: Simple form modals in seller/brands, seller/media, seller/crm, admin/crm, admin/finance/credit-notes, admin/beta/invites, admin/launch/incidents, admin/products/approval, buyer/negotiation (x2), seller/beta/support, admin/plans, reviews-section, bulk-location-modal
- **4 medium-viability**: admin/catalog-import (separate backdrop), level-up-modal (custom anim), session-timeout (non-dismissable), ProductCard tooltip
- **3 low-viability**: Fullscreen image viewer, lightbox, XP float animation
- **Key finding**: 3 distinct backdrop opacity/glass variations — standardized to Modal's `bg-black/60 backdrop-blur-sm`

### 3.2 Drawer (`components/ui/drawer.tsx`)
- **4 inline implementations**
- **2 high-viability**: seller/onboarding Section8Products (slideover), near-me/filter-drawer
- **2 low-viability**: notification-drawer (dropdown, not drawer), FilterSidebar (responsive sidebar)
- **Key finding**: Only 2 true drawers exist; both map directly to `<Drawer side="right">`

### 3.3 Select (`components/ui/select.tsx`)
- **22 inline `<select>` elements** across ~18 files
- **14 high-viability**: admin/advertising (x2), admin/campaigns, admin/wallets, onboarding (x2), admin/finance/credit (x2), admin/finance/collections, seller/crm, seller/crm/[id], seller/advertising/new (x3), admin/plans
- **8 medium-viability**: Registration forms (vendor/buyer steps) with inline error styling (INPUT_CLASS + inline error border styles)
- **Key finding**: 0 uses of the `select-dark` utility class; background patterns range from `bg-white/[0.04]` to `bg-gray-800`

### 3.4 Checkbox (`components/ui/checkbox.tsx`)
- **13 inline checkboxes** across 8 files
- All **13 high-viability**: Direct replacements — bare `<input type="checkbox">` with `accent-[#f59e0b]` or `rounded border-border`
- **Key files**: plans/purchase, rfq/new, rfq/create, seller/onboarding/Section9, seller/products/new/wizard (x2), subscription/purchase (x2), seller/advertising/new (x3), admin/plans (x2), admin/crm

### 3.5 Tooltip (`components/ui/tooltip.tsx`)
- **4 inline tooltips** across 3 files
- **3 high-viability**: field-renderer, dynamic-field, attribute-row — all use identical `absolute bottom-full left-1/2 mb-2 -translate-x-1/2` pattern
- **1 partial-viability**: ProductCard — click toggle instead of hover
- **Key finding**: field-renderer.tsx and dynamic-field.tsx tooltips are exact visual matches for `<Tooltip side="top">`

### 3.6 Tabs (`components/ui/tabs.tsx`)
- **22 inline tab groups** across 22 files
- **12 high-viability**: spec-tabs, feedback-widget, admin/ai-infrastructure, admin/categories/mapping, admin/negotiation, admin/order, admin/rfq, admin/po, admin/shipment, admin/quote, admin/delivery, CompanyProfileClient
- **10 medium-viability**: 6 AI copilot components (all share identical `border-b-2 border-[#FF4D00]` pattern), admin/plans, tradeserv/inquiries, seller/products, mission-category-tabs
- **Key finding**: 7 admin list pages (negotiation, order, rfq, po, shipment, quote, delivery) share an identical inline pill-bar pattern — ideal for batch replacement

### 3.7 Switch (`components/ui/switch.tsx`)
- **7 inline toggles** across 6 files
- **6 high-viability**: onboarding, buyer/settings, seller/settings (x2), seller/onboarding/Section1, seller/onboarding/Section8, dynamic-field
- **1 medium-viability**: register/vendor/Step5BusinessProfile (uses gradient background `linear-gradient(135deg, #f59e0b, #fbbf24)`)
- **Key finding**: All 6 use the identical `peer sr-only` + styled `rounded-full` div pattern; Switch component provides a drop-in replacement

### 3.8 Radio (`components/ui/radio.tsx`)
- **1 inline radio group** in checkout/page.tsx
- **1 medium-viability**: Uses hidden input + styled label; custom selection highlight on the wrapper
- **Key finding**: Only 1 radio group in the entire app — low migration priority

### 3.9 Popover (`components/ui/popover.tsx`)
- No inline popover implementations found beyond the standard usage contexts (dashboards use click handler patterns, not reusable popovers)
- **0 immediate migration targets**

### 3.10 Alert (`components/ui/alert.tsx`)
- **23 inline alert boxes** across 23 files
- **13 high-viability**: Pure error states (`bg-red-500/10 p-3 text-sm`) in admin/pages, auth pages, buyer/near-me
- **10 medium-viability**: Warning/info states with amber/blue/yellow backgrounds; some have custom layouts (flex justify-between)
- **Key finding**: 0 uses of `role="alert"` outside the Alert component — most are just styled `<div>` elements

### 3.11 Accordion (`components/ui/accordion.tsx`)
- **4 inline collapsible patterns**
- **2 medium-viability**: product-attributes-section, FilterSidebar (FilterSection)
- **2 low-viability**: mega-menu (complex nested), tradeserv/page (CSS-only group-open)
- **Key finding**: Accordion is a specialized component; low migration priority

### 3.12 Table (`components/ui/table.tsx`)
- **39 inline `<table>` elements** across 36 files
- **All 39 high-viability**: Direct replacement with `<Table>`, `<THead>`, `<TBody>`, `<TR>`, `<TH>`, `<TD>`
- **Key files**: 24 admin pages, 6 seller pages, 6 buyer pages, 3 component files
- **Critical finding**: `<Table>` component has **0 imports** — the component exists but is entirely unused. `table-dark` utility also has 0 uses. Every table in the codebase duplicates the glass-container pattern manually.

### 3.13 Avatar (`components/ui/avatar.tsx`)
- **27 inline avatar patterns** across 21 files
- **13 high-viability**: 5 img-based avatars, 8 initials-based circular divs with `rounded-full`
- **6 medium-viability**: Combined img+fallback patterns where `<Avatar>` is the exact match
- **8 low-viability**: Decorative numbered circles, icon containers, chat avatars with status indicators
- **Key finding**: `<Avatar>` has **0 imports** — zero adoption; every profile image in the app is manually inlined

### 3.14 LoadingSpinner (`components/ui/loading-spinner.tsx`)
- **~80 Loader2 inline instances** + **19 CSS border spinners**
- **19 high-viability**: CSS border spinners (`w-12 h-12 rounded-full border-2 border-t-[#f59e0b]`) — direct match with `<LoadingSpinner size="xl" color="accent">`
- **80 medium-viability**: Loader2 at `h-3 w-3` or `h-3.5 w-3.5` — smaller than LoadingSpinner's minimum `sm` size (h-4 w-4); requires adding `xs` size to the component
- **Key finding**: Need to add `xs` size (`h-3 w-3`) to LoadingSpinner before migration

### 3.15 Progress (`components/ui/progress.tsx`)
- **4 inline progress bars**
- **3 high-viability**: admin/launch/page, admin/launch/metrics, health-score-card
- **1 medium-viability**: TrustScoreCard (uses dynamic color function, not gradient)
- **Key finding**: Minimal fragmentation — easiest component to migrate

### 3.16 EmptyState (`components/ui/empty-state.tsx`)
- **~118 empty/error state patterns** across 60+ files
- **40 high-viability**: Exact match for `rounded-xl border border-white/[0.06] bg-white/[0.04] p-12` pattern in buyer/seller list pages
- **41 medium-viability**: Similar pattern with `border-border bg-surface p-12` or different layout
- **37 low-viability**: Raw "No X" text without styled containers (many admin finance/crm pages)
- **Critical finding**: `<EmptyState>` has **0 imports** — zero adoption despite the spec requirement that "ALL data-driven pages MUST handle loading, empty, and error states"

---

## 4. Adoption Risk Matrix

| Risk Level | Count | Components | Mitigation |
|-----------|-------|-----------|------------|
| 🔴 **Critical** — Breaking API mismatch | 2 | Loader2 (needs xs size), EmptyState (current component has no error variant) | Add xs size to LoadingSpinner; extend EmptyState with error and loading variants |
| 🟠 **High** — Visual regression possible | 4 | Switch (accent vs primary color), Progress (gradient vs solid), Checkbox (accent color), Alert (backdrop-glass vs solid) | Verify each visual difference; add color props if needed |
| 🟡 **Medium** — Inline styles or complex wrappers | 8 | INPUT_CLASS forms (inline error styling), registration selects, checkout radio, TrustScoreCard progress | Create wrapper component or extend with error prop |
| 🟢 **Low** — Mechanical replacement | All others | Table, Badge, Modal, Drawer, Tooltip, Tabs, Avatar, Card, Select | Search-and-replace with modern IDE |

### Details on 🔴 Critical Risks

1. **LoadingSpinner**: Adding `xs` size (`h-3 w-3`, `h-3.5 w-3.5`) is essential for the ~80 Loader2 instances in AI copilot components and inline buttons. Without it, many spinners will look oversized.

2. **EmptyState**: Current component only handles empty state (icon + title + description). To replace all 118 patterns, it needs:
   - `variant`: `'empty' | 'error' | 'loading'`
   - `loading` variant shows `<LoadingSpinner>` instead of icon
   - `error` variant shows AlertTriangle icon, error ID in font-mono
   - Backward-compatible: default `variant='empty'` preserves the existing API

---

## 5. Migration Wave Plan

### Wave 1 — Foundation (T-3A) — Zero risk, highest impact
**Goal**: Activate the 7 unused components. Estimated reduction: 250+ inline instances.

| Order | Component | Files Affected | Replacement Count | Estimated Effort |
|:-----:|-----------|:--------------:|:-----------------:|:----------------:|
| 1 | **Table** | 36 | 39 tables | 2-3 hours |
| 2 | **EmptyState** | 60 | 80+ empty/error states | 3-4 hours |
| 3 | **Badge** | 22 | 37 badges | 1-2 hours |
| 4 | **Alert** | 18 | 23 alerts | 1-2 hours |
| 5 | **Tabs** | 12 | 22 tab groups | 3-4 hours |
| 6 | **Avatar** | 21 | 27 avatars | 1-2 hours |

**Wave 1 subtotal**: ~169 files, ~228 replacements, ~12-17 hours

### Wave 2 — Interactive (T-3B) — Low-medium risk, moderate impact
**Goal**: Replace form-level components. Estimated reduction: 180+ instances.

| Order | Component | Files Affected | Replacement Count | Estimated Effort |
|:-----:|-----------|:--------------:|:-----------------:|:----------------:|
| 7 | **Modal** | 14 | 14 modals | 3-4 hours |
| 8 | **Select** | 18 | 22 selects | 2-3 hours |
| 9 | **Checkbox** | 8 | 13 checkboxes | 1 hour |
| 10 | **Switch** | 6 | 7 toggles | 1 hour |
| 11 | **Tooltip** | 3 | 4 tooltips | 0.5 hour |

**Wave 2 subtotal**: ~49 files, ~60 replacements, ~7.5-9.5 hours

### Wave 3 — Heavy (T-3C) — Medium risk, highest effort
**Goal**: Replace card divs, INPUT_CLASS instances, and inline inputs. Estimated reduction: 300+ instances.

| Order | Component | Files Affected | Replacement Count | Estimated Effort |
|:-----:|-----------|:--------------:|:-----------------:|:----------------:|
| 12 | **Card** | 50 | 141 card divs | 6-8 hours |
| 13 | **Input/extea** | 30 | 140 inputs/textareas | 4-6 hours |
| 14 | **LoadingSpinner** | 40 | 99 spinners (+ add xs size) | 3-4 hours |

**Wave 3 subtotal**: ~120 files, ~380 replacements, ~13-18 hours

### Wave 4 — Touch-up (T-3D) — Low risk, low effort
**Goal**: Replace remaining fragmented implementations.

| Order | Component | Files Affected | Replacement Count | Estimated Effort |
|:-----:|-----------|:--------------:|:-----------------:|:----------------:|
| 15 | **Drawer** | 2 | 2 drawers | 0.5 hour |
| 16 | **Accordion** | 2 | 2 accordions | 1 hour |
| 17 | **Radio** | 1 | 1 radio group | 0.5 hour |
| 18 | **Progress** | 4 | 4 progress bars | 0.5 hour |
| 19 | **Button** (inline) | 20 | 47 buttons | 2-3 hours |

**Wave 4 subtotal**: ~29 files, ~56 replacements, ~4.5-5.5 hours

### Total Migration Estimates

| Metric | Value |
|--------|-------|
| Unique files modified | ~230 |
| Replacements | ~658 |
| Estimated engineer-hours | 37-50 hours |
| Lines of code removed | ~12,000-15,000 |
| Reduction in codebase size | ~3-5% of total `.tsx` code |
| Risk vectors | 2 critical (component changes needed), 4 high (visual verification) |

---

## 6. Component Enhancement Requirements Before T-3

Two components need API extensions before Wave 1 can begin:

### 6.1 LoadingSpinner — Add `xs` size

```tsx
// Current
size: { sm: 'h-4 w-4', default: 'h-6 w-6', lg: 'h-8 w-8', xl: 'h-12 w-12' }

// Required addition
size: { xs: 'h-3 w-3', sm: 'h-4 w-4', default: 'h-6 w-6', lg: 'h-8 w-8', xl: 'h-12 w-12' }
```

Rationale: ~80 Loader2 instances use `h-3 w-3` or `h-3.5 w-3.5` in AI copilot components and inline button spinners.

### 6.2 EmptyState — Add `variant` and `action` alignment props

```tsx
// Current
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

// Required for error state coverage
interface EmptyStateProps {
  variant?: 'empty' | 'error' | 'loading';
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  errorId?: string; // shown in font-mono for error variant
  className?: string;
}
```

Rationale: 40+ inline error states use AlertCircle icon with different styling; 37 hardcoded "No X" texts need the EmptyState container.

---

## 7. Estimated Codebase Reduction by Module

| Module | Files Affected | Inline Instances | Estimated Lines Removed | Current Lines | Reduction % |
|--------|:--------------:|:----------------:|:----------------------:|:-------------:|:-----------:|
| Admin | ~55 | ~205 | ~3,800 | ~15,000 | ~25% |
| Buyer | ~45 | ~180 | ~3,200 | ~12,000 | ~27% |
| Seller | ~40 | ~130 | ~2,400 | ~10,000 | ~24% |
| TradeServ | ~20 | ~45 | ~800 | ~8,000 | ~10% |
| Components | ~35 | ~65 | ~1,200 | ~20,000 | ~6% |
| Public pages | ~25 | ~25 | ~600 | ~5,000 | ~12% |
| Auth/Register | ~10 | ~8 | ~200 | ~4,000 | ~5% |
| **TOTAL** | **~230** | **~658** | **~12,200** | **~74,000** | **~16%** |

---

## 8. Recommended T-3 Migration Order

```
Wave 1 ─── Table ─── EmptyState ─── Badge ─── Alert ─── Tabs ─── Avatar
             │            │           │         │        │          │
             ▼            ▼           ▼         ▼        ▼          ▼
Wave 2 ─── Modal ─── Select ─── Checkbox ─── Switch ─── Tooltip
             │            │           │          │          │
             ▼            ▼           ▼          ▼          ▼
Wave 3 ─── Card ─── Input/Textarea ─── LoadingSpinner
             │            │                │
             ▼            ▼                ▼
Wave 4 ─── Drawer ─── Accordion ─── Radio ─── Progress ─── Button (inline)
```

**Each wave must be verified independently**: `tsc web` → `next build` → visual regression check on DESIGN_D + DESIGN_W.

---

## 9. Files NOT to Modify (Intentional Exceptions)

| File | Reason |
|------|--------|
| `components/product/image-gallery.tsx` | Fullscreen image viewer with navigation, zoom, touch gestures |
| `components/product-attributes/attribute-value.tsx` | Simple image lightbox — no card container |
| `components/auth/session-timeout-provider.tsx` | Non-dismissable countdown overlay |
| `components/ecosystem/level-up-modal.tsx` | Custom animated celebration with `pointer-events-none` |
| `components/ecosystem/xp-float-animation.tsx` | Pure CSS animation overlay |
| `components/tradeserv/inquiry-modal.tsx` | Already a dedicated component with AnimatePresence |
| `components/discovery/FilterSidebar.tsx` | Responsive sidebar (static desktop, mobile drawer) — different pattern |
| `components/notifications/notification-drawer.tsx` | Positioned dropdown, not a full drawer |
| `components/shared/navbar.tsx` (mobile menu) | Custom motion animation |
| `components/product/compare-bar.tsx` | Persistent bottom bar, not a modal |
| `app/tradeserv/page.tsx` | CSS-only group-open accordion pattern |
| All `loading.tsx` files | Next.js convention for route-level loading states |

---

## 10. Verification Checklist

Each component migration must verify:

- [ ] `npx tsc --noEmit -p apps/web/tsconfig.json` — 0 errors
- [ ] `npx next build apps/web` — compiled successfully
- [ ] DESIGN_D (dark) renders correctly — backgrounds, borders, text contrast
- [ ] DESIGN_W (light) renders correctly — toggle `<html data-theme="light">`
- [ ] Component API unchanged — all existing props still work
- [ ] Keyboard navigation — Tab, Enter, Escape, Arrow keys where applicable
- [ ] Focus indicators — `focus-visible:*` rings visible on all interactive elements
- [ ] Screen reader — ARIA attributes correct (role, aria-label, aria-hidden)
- [ ] Reduced motion — `useReducedMotion()` or CSS `prefers-reduced-motion: reduce`
- [ ] Responsive — mobile layouts unaffected (no layout shift)
- [ ] No regression in empty states, loading states, error states

---

**STOP — Waiting for Founder review.**
